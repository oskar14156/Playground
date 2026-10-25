"""Shared helpers for Blender-rendered reels (run inside Blender: blender -b -P <script> -- args).

Timing comes from public/<slug>/words.json exactly like the Remotion side (cue phrases →
frames at 30 fps), so Blender shots and Remotion overlays stay in sync after re-voicing.
"""
import json
import math
import os
import re

import bpy
import mathutils

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TEX = os.path.join(ROOT, "public", "textures")
FPS = 30


# ---------- cues ----------
def norm(s):
    return re.sub(r"[^a-z0-9äöüß]", "", s.lower())


class Cues:
    def __init__(self, slug):
        self.words = json.load(open(os.path.join(ROOT, "public", slug, "words.json")))
        self.voice_end = round(self.words[-1]["end"] * FPS)

    def _find(self, phrase, nth=1):
        toks = [norm(t) for t in phrase.split() if norm(t)]
        seen = 0
        for i in range(len(self.words) - len(toks) + 1):
            if all(norm(self.words[i + k]["word"]) == t for k, t in enumerate(toks)):
                seen += 1
                if seen == nth:
                    return i
        raise KeyError(f'cue "{phrase}" #{nth} not in words.json')

    def at(self, phrase, nth=1):
        return round(self.words[self._find(phrase, nth)]["start"] * FPS)


def chunk(shots, spec):
    """Split the frames of all shots into N contiguous blocks for parallel (cloud) rendering.
    spec "i/N" (1-based) → {shot: (start, end)} for the frames of block i; "" → everything."""
    if not spec:
        return {k: (s, e) for k, (s, e, _) in shots.items()}
    i, n = (int(x) for x in spec.split("/"))
    frames = sorted(f for s, e, _ in shots.values() for f in range(s, e + 1))
    per = -(-len(frames) // n)
    mine = set(frames[(i - 1) * per : i * per])
    out = {}
    for k, (s, e, _) in shots.items():
        fs = [f for f in range(s, e + 1) if f in mine]
        if fs:
            out[k] = (fs[0], fs[-1])
    return out


# ---------- scene ----------
def new_scene(name, frame_start, frame_end, res=100, samples=48):
    """Reset Blender and configure its single scene (bpy.ops only add to the active scene,
    and background mode has no window to switch scenes — so one shot at a time)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.name = name
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
    sc.render.resolution_percentage = res
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = frame_start, frame_end
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Punchy"
    sc.render.image_settings.file_format = "JPEG"
    sc.render.image_settings.quality = 93
    ee = sc.eevee
    for attr, val in [("taa_render_samples", samples), ("use_raytracing", True), ("volumetric_tile_size", "4"), ("volumetric_samples", 64), ("use_shadows", True), ("volumetric_end", 600.0)]:
        if hasattr(ee, attr):
            setattr(ee, attr, val)
    sc.world = bpy.data.worlds.new(name + "_world")
    sc.world.use_nodes = True
    return sc


def use_cycles(sc, samples=64):
    """Cycles on the NVIDIA GPU via CUDA — for cloud VMs where EEVEE has no OpenGL driver and
    silently falls back to software rendering. Colab lacks the OptiX runtime (libnvoptix), so
    CUDA + OpenImageDenoise. Adaptive sampling."""
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("OPTIX", "CUDA") if os.environ.get("CYCLES_OPTIX") else ("CUDA",):
        try:
            prefs.compute_device_type = kind
            prefs.refresh_devices()
            devs = [d for d in prefs.devices if d.type == kind]
            if devs:
                for d in prefs.devices:
                    d.use = d.type == kind
                print("CYCLES GPU", kind, [d.name for d in devs], flush=True)
                break
        except TypeError:
            continue
    sc.render.engine = "CYCLES"
    sc.cycles.device = "GPU"
    sc.cycles.samples = samples
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.02
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPTIX" if prefs.compute_device_type == "OPTIX" else "OPENIMAGEDENOISE"
    sc.cycles.volume_step_rate = 4.0
    sc.cycles.max_bounces = 6
    sc.cycles.volume_bounces = 1


def link(sc, ob):
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    sc.collection.objects.link(ob)
    return ob


def world_hdri(sc, file, strength=1.0, rotation=0.0, color=None):
    nt = sc.world.node_tree
    bg = nt.nodes["Background"]
    if file:
        env = nt.nodes.new("ShaderNodeTexEnvironment")
        env.image = bpy.data.images.load(os.path.join(TEX, file), check_existing=True)
        mapping = nt.nodes.new("ShaderNodeMapping")
        coord = nt.nodes.new("ShaderNodeTexCoord")
        mapping.inputs["Rotation"].default_value[2] = rotation
        nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
        nt.links.new(mapping.outputs["Vector"], env.inputs["Vector"])
        nt.links.new(env.outputs["Color"], bg.inputs["Color"])
    elif color:
        bg.inputs["Color"].default_value = (*color, 1)
    bg.inputs["Strength"].default_value = strength


def world_fog(sc, density=0.02, color=(0.6, 0.65, 0.75), anisotropy=0.3, glow=None, glow_strength=0.0):
    """Volumetric haze in the whole world so spot lights draw visible beams. `glow` gives the
    medium its own faint light (murky water): without it the fog swallows the background → black."""
    nt = sc.world.node_tree
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = density
    vol.inputs["Color"].default_value = (*color, 1)
    vol.inputs["Anisotropy"].default_value = anisotropy
    if glow:
        vol.inputs["Emission Color"].default_value = (*glow, 1)
        vol.inputs["Emission Strength"].default_value = glow_strength
    nt.links.new(vol.outputs["Volume"], nt.nodes["World Output"].inputs["Volume"])


def night_sky(sc, strength=1.0, stars=1.0):
    """Moonless, starry (14 April 1912 had no moon): dark gradient + soft star points."""
    nt = sc.world.node_tree
    bg = nt.nodes["Background"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value = -0.02
    ramp.inputs["From Max"].default_value = 0.5
    nt.links.new(sep.outputs["Z"], ramp.inputs["Value"])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs[6].default_value = (0.02, 0.032, 0.06, 1)  # horizon glow
    mix.inputs[7].default_value = (0.002, 0.003, 0.009, 1)  # zenith
    nt.links.new(ramp.outputs["Result"], mix.inputs["Factor"])
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 260
    nt.links.new(tc.outputs["Generated"], vor.inputs["Vector"])
    soft = nt.nodes.new("ShaderNodeMapRange")
    soft.inputs["From Min"].default_value = 0.05
    soft.inputs["From Max"].default_value = 0.14
    soft.inputs["To Min"].default_value = 1.0
    soft.inputs["To Max"].default_value = 0.0
    nt.links.new(vor.outputs["Distance"], soft.inputs["Value"])
    sepc = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(vor.outputs["Color"], sepc.inputs["Color"])
    pw = nt.nodes.new("ShaderNodeMath")  # most stars faint, a few bright
    pw.operation = "POWER"
    pw.inputs[1].default_value = 6.0
    nt.links.new(sepc.outputs[0], pw.inputs[0])
    few = nt.nodes.new("ShaderNodeMath")  # only ~1 in 4 cells holds a visible star
    few.operation = "GREATER_THAN"
    few.inputs[1].default_value = 0.75
    nt.links.new(sepc.outputs[1], few.inputs[0])
    pw2 = nt.nodes.new("ShaderNodeMath")
    pw2.operation = "MULTIPLY"
    nt.links.new(pw.outputs[0], pw2.inputs[0])
    nt.links.new(few.outputs[0], pw2.inputs[1])
    m1 = nt.nodes.new("ShaderNodeMath")
    m1.operation = "MULTIPLY"
    nt.links.new(soft.outputs["Result"], m1.inputs[0])
    nt.links.new(pw2.outputs[0], m1.inputs[1])
    above = nt.nodes.new("ShaderNodeMath")  # no stars below the horizon
    above.operation = "GREATER_THAN"
    above.inputs[1].default_value = 0.02
    nt.links.new(sep.outputs["Z"], above.inputs[0])
    m2 = nt.nodes.new("ShaderNodeMath")
    m2.operation = "MULTIPLY"
    nt.links.new(m1.outputs[0], m2.inputs[0])
    nt.links.new(above.outputs[0], m2.inputs[1])
    m3 = nt.nodes.new("ShaderNodeMath")
    m3.operation = "MULTIPLY"
    m3.inputs[1].default_value = 14.0 * stars
    nt.links.new(m2.outputs[0], m3.inputs[0])
    add = nt.nodes.new("ShaderNodeMix")
    add.data_type = "RGBA"
    add.blend_type = "ADD"
    add.inputs["Factor"].default_value = 1
    nt.links.new(mix.outputs[2], add.inputs[6])
    cc = nt.nodes.new("ShaderNodeCombineColor")
    for i in range(3):
        nt.links.new(m3.outputs[0], cc.inputs[i])
    nt.links.new(cc.outputs[0], add.inputs[7])
    nt.links.new(add.outputs[2], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = strength


def glare(sc, threshold=0.9, size=7, strength=1.0):
    """Bloom-like fog glow in the compositor (Blender 5: node group + Group Output)."""
    ng = bpy.data.node_groups.new(f"{sc.name}_comp", "CompositorNodeTree")
    sc.compositing_node_group = ng
    ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    rl = ng.nodes.new("CompositorNodeRLayers")
    g = ng.nodes.new("CompositorNodeGlare")
    out = ng.nodes.new("NodeGroupOutput")
    g.inputs["Type"].default_value = "Fog Glow"
    g.inputs["Threshold"].default_value = threshold
    g.inputs["Strength"].default_value = strength
    if g.inputs["Size"].type in ("INT", "VALUE"):
        g.inputs["Size"].default_value = size if g.inputs["Size"].type == "INT" else size / 9
    ng.links.new(rl.outputs["Image"], g.inputs["Image"])
    ng.links.new(g.outputs["Image"], out.inputs["Image"])


# ---------- materials ----------
def mat(name, color=(0.8, 0.8, 0.8), rough=0.5, metal=0.0, emission=None, strength=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if emission:
        p.inputs["Emission Color"].default_value = (*emission, 1)
        p.inputs["Emission Strength"].default_value = strength
    if alpha < 1:
        p.inputs["Alpha"].default_value = alpha
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "BLENDED"
    return m


def pbr(name, slug, scale=1.0, tint=None, metal=0.0, bump=1.0):
    """Poly Haven texture set public/textures/<slug>_{diff,nor_gl,rough}.jpg, box-projected."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (scale, scale, scale)
    nt.links.new(coord.outputs["Object"], mp.inputs["Vector"])

    def tex(kind, non_color):
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(os.path.join(TEX, f"{slug}_{kind}.jpg"), check_existing=True)
        if non_color:
            t.image.colorspace_settings.name = "Non-Color"
        t.projection = "BOX"
        t.projection_blend = 0.2
        nt.links.new(mp.outputs["Vector"], t.inputs["Vector"])
        return t

    d = tex("diff", False)
    if tint:
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        mix.inputs[7].default_value = (*tint, 1)
        nt.links.new(d.outputs["Color"], mix.inputs[6])
        nt.links.new(mix.outputs[2], p.inputs["Base Color"])
    else:
        nt.links.new(d.outputs["Color"], p.inputs["Base Color"])
    r = tex("rough", True)
    nt.links.new(r.outputs["Color"], p.inputs["Roughness"])
    n = tex("nor_gl", True)
    nm = nt.nodes.new("ShaderNodeNormalMap")
    nm.inputs["Strength"].default_value = bump
    nt.links.new(n.outputs["Color"], nm.inputs["Color"])
    nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
    p.inputs["Metallic"].default_value = metal
    return m


def paint(name, color, rough=0.38, grime=0.25):
    """Semi-gloss paint with orange-peel bump and a little grime in the roughness."""
    m = mat(name, color, rough)
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 220
    b = nt.nodes.new("ShaderNodeBump")
    b.inputs["Strength"].default_value = 0.04
    nt.links.new(nz.outputs["Fac"], b.inputs["Height"])
    nt.links.new(b.outputs["Normal"], p.inputs["Normal"])
    g = nt.nodes.new("ShaderNodeTexNoise")
    g.inputs["Scale"].default_value = 9
    g.inputs["Detail"].default_value = 8
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value = rough
    mr.inputs["To Max"].default_value = rough + grime
    nt.links.new(g.outputs["Fac"], mr.inputs["Value"])
    nt.links.new(mr.outputs["Result"], p.inputs["Roughness"])
    if "Coat Weight" in p.inputs:
        p.inputs["Coat Weight"].default_value = 0.15
    return m


def image_mat(name, path, rough=0.5, alpha=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(path, check_existing=True)
    nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
    if alpha:
        nt.links.new(t.outputs["Alpha"], p.inputs["Alpha"])
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "BLENDED"
    p.inputs["Roughness"].default_value = rough
    return m


# ---------- objects ----------
def cube(name, size, loc=(0, 0, 0), m=None, bevel=0.0, segments=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        bv = o.modifiers.new("bevel", "BEVEL")
        bv.width = bevel
        bv.segments = segments
        bv.limit_method = "ANGLE"
    if m:
        o.data.materials.append(m)
    bpy.ops.object.shade_smooth() if bevel else None
    return o


def cyl(name, r, depth, loc=(0, 0, 0), rot=(0, 0, 0), m=None, verts=48, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object
    o.name = name
    if bevel:
        bv = o.modifiers.new("bevel", "BEVEL")
        bv.width = bevel
        bv.segments = 3
        bv.limit_method = "ANGLE"
    if m:
        o.data.materials.append(m)
    bpy.ops.object.shade_smooth()
    if hasattr(o.data, "set_sharp_from_angle"):
        o.data.set_sharp_from_angle(angle=math.radians(35))
    return o


def text(name, body, size, loc, rot=(math.radians(90), 0, 0), m=None, extrude=0.0003, font=None):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    t = bpy.context.object
    t.name = name
    t.data.body = body
    t.data.size = size
    t.data.align_x = "CENTER"
    t.data.align_y = "CENTER"
    t.data.extrude = extrude
    if font:
        t.data.font = font
    if m:
        t.data.materials.append(m)
    return t


def parent(children, to):
    for c in children:
        c.parent = to
        c.matrix_parent_inverse = to.matrix_world.inverted()


def empty(name, loc=(0, 0, 0)):
    bpy.ops.object.empty_add(location=loc)
    e = bpy.context.object
    e.name = name
    return e


# ---------- camera ----------
def camera(sc, name="Cam", lens=40, fstop=None):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.sensor_fit = "VERTICAL"
    cd.sensor_height = 36
    if fstop:
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = fstop
    co = bpy.data.objects.new(name, cd)
    sc.collection.objects.link(co)
    sc.camera = co
    return co


def aim(cam, pos, look, frame=None, focus=True, roll=0.0):
    cam.location = pos
    d = mathutils.Vector(look) - mathutils.Vector(pos)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cam.rotation_euler.rotate_axis("Z", roll)
    if focus and cam.data.dof.use_dof:
        cam.data.dof.focus_distance = d.length
    if frame is not None:
        cam.keyframe_insert("location", frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)
        if focus and cam.data.dof.use_dof:
            cam.data.dof.keyframe_insert("focus_distance", frame=frame)


def key(ob, path, value, frame, index=-1):
    setattr(ob, path, value) if not isinstance(value, (tuple, list)) else setattr(ob, path, value)
    ob.keyframe_insert(path, frame=frame, index=index)


def fcurves(idb):
    """F-curves of an ID's action (Blender 5 keeps them in a channelbag per action slot)."""
    ad = getattr(idb, "animation_data", None)
    if not ad or not ad.action:
        return []
    if hasattr(ad.action, "fcurves"):
        return list(ad.action.fcurves)
    from bpy_extras import anim_utils

    cb = anim_utils.action_get_channelbag_for_slot(ad.action, ad.action_slot)
    return list(cb.fcurves) if cb else []


def smooth_keys(ob):
    ad = ob.animation_data
    if ad and ad.action:
        for fc in getattr(ad.action, "fcurves", []):
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"
                kp.easing = "AUTO"
