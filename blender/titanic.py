"""Titanic — the 3D sets rendered in Blender (EEVEE). Remotion keeps the two diagram sets
(compartments, 45° vs 15°) and adds captions/HUD/sound (composition titanic-blender).

  blender -b -P blender/titanic.py -- --stills 0,60,200 --res 40 --samples 16     # look-dev
  blender -b -P blender/titanic.py -- --render --draft                            # fast preview
  blender -b -P blender/titanic.py -- --render                                    # final frames

Shots cover cue ranges from public/titanic/words.json (same phrases as src/videos/titanic/cues.ts).
The wreck shot also writes public/tib/wreck_track.json: screen positions of the BOW/STERN
tags and the 600 m measure line for the Remotion overlay.
"""
import argparse
import json
import math
import os
import random
import sys

import bpy
import mathutils
from bpy_extras.object_utils import world_to_camera_view

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "models"))
import common as C  # noqa: E402
import liner  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--stills", default="")
ap.add_argument("--render", action="store_true")
ap.add_argument("--draft", action="store_true", help="quarter resolution, few samples → public/tib/draft")
ap.add_argument("--only", default="")
ap.add_argument("--chunk", default="", help="i/N: render only block i of N (parallel cloud jobs)")
ap.add_argument("--res", type=int, default=100)
ap.add_argument("--samples", type=int, default=48)
ap.add_argument("--stills_out", default=os.path.join(C.ROOT, "out", "stills", "tib"))
a = ap.parse_args(argv)
if a.draft:
    a.res, a.samples = 30, 6
OUT = os.path.join(C.ROOT, "public", "tib", "draft" if a.draft else "frames")

cue = C.Cues("titanic")
c = {
    k: cue.at(v)
    for k, v in {
        "then": "Then in 1985",
        "found": "found her",
        "depth": "3,800",
        "two": "two pieces",
        "apart": "600 meters apart",
        "so": "So what tears",
        "half": "in half",
        "iceberg": "The iceberg",
        "stern": "The stern rose",
        "tons": "Thousands of tons",
        "hanging": "hanging in the air",
        "hull": "The hull bent",
        "ruler": "ruler",
        "snapped": "snapped",
        "not": "Not at the steep",
        "survivors": "Survivors said",
        "official": "The official inquiries",
        "truth": "So the truth",
        "which": "Which is why",
    }.items()
}
END = cue.voice_end + 12
print("CUES", c, "END", END, flush=True)

SHOTS = {}


def shot(name, start, end):
    def deco(fn):
        SHOTS[name] = (start, end, fn)
        return fn

    return deco


# ───────────────────────── shared: night sky, calm sea ─────────────────────────
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


def calm_sea(sc, start, end, size=320, repeat=5, scale=0.35):
    """Glassy North Atlantic (it was flat calm that night): ocean modifier + a far flat plane."""
    water = C.mat("sea", (0.002, 0.004, 0.008), rough=0.05)
    pw = water.node_tree.nodes["Principled BSDF"]
    pw.inputs["IOR"].default_value = 1.33
    bpy.ops.mesh.primitive_plane_add(size=2)
    o = bpy.context.object
    o.name = "ocean"
    md = o.modifiers.new("ocean", "OCEAN")
    md.geometry_mode = "GENERATE"
    md.spatial_size = size
    md.repeat_x = md.repeat_y = repeat
    md.resolution = 10
    md.wave_scale = scale
    md.choppiness = 0.8
    md.wind_velocity = 6
    md.time = start / 30
    md.keyframe_insert("time", frame=start)
    md.time = end / 30
    md.keyframe_insert("time", frame=end)
    linear_keys(o)
    o.location = (-size * repeat / 2, -size * repeat / 2, 0)
    o.data.materials.append(water)
    bpy.ops.object.shade_smooth()
    far = C.cube("far_sea", (40000, 40000, 0.01), (0, 0, -0.25), water)
    return o


def linear_keys(ob):
    for fc in C.fcurves(ob):
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def drop_piece(P, which):
    """Delete one piece of a ship (and everything parented to it)."""
    for ob in list(P[which].children_recursive) + [P[which]]:
        bpy.data.objects.remove(ob, do_unlink=True)


def marine_snow(n, box, center, r=0.05, seed=1):
    rnd = random.Random(seed)
    m = C.mat("snow", (0.8, 0.85, 0.9), emission=(0.7, 0.85, 1.0), strength=0.6)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=r)
    base = bpy.context.object
    base.data.materials.append(m)
    me = base.data
    base.location = center
    for i in range(n):
        o = bpy.data.objects.new("snow", me)
        bpy.context.collection.objects.link(o)
        o.location = tuple(center[k] + (rnd.random() - 0.5) * box[k] for k in range(3))
        s = 0.5 + rnd.random()
        o.scale = (s, s, s)


# ───────────────────────── A · the intact ship at night (hook + loop outro) ─────────────────────────
P0, LOOK0 = (180, -130, 5.0), (40, 0, 17)


def night(sc, outro=False):
    f0, f1 = (0, c["then"] - 1) if not outro else (c["which"], END)
    night_sky(sc)
    calm_sea(sc, f0, f1)
    root, P = liner.build("ship")
    # she steams slowly ahead (+X) — the camera keeps pace, so only the sea moves
    cam = C.camera(sc, lens=32, fstop=None)
    if not outro:
        C.aim(cam, P0, LOOK0, frame=0)
        C.aim(cam, (166, -118, 5.5), (38, 0, 17), frame=f1)
    else:
        C.aim(cam, (200, -165, 8), (30, 0, 17), frame=f0)
        C.aim(cam, P0, LOOK0, frame=END)
    sun = bpy.ops.object.light_add(type="SUN")
    s = bpy.context.object
    s.data.energy = 0.05  # starlight: just enough to separate the hull from the sky
    s.data.color = (0.6, 0.7, 1.0)
    s.rotation_euler = (math.radians(60), 0, math.radians(-30))
    C.glare(sc, threshold=0.8, size=7, strength=0.8)


shot("night_in", 0, c["then"] - 1)(lambda sc: night(sc))
shot("night_out", c["which"], END)(lambda sc: night(sc, outro=True))


# ───────────────────────── B · the wreck, 3,800 m down; crane up to the debris map ─────────────────────────
BOW_LOC, STERN_LOC = (0, 274, 6.0), (0, -474.5, 7.5)
SCAN_CUT = c["two"] - 4  # also in TitanicBlender.tsx


@shot("wreck", c["then"], c["so"] - 1)
def wreck(sc):
    f0, f1 = c["then"], c["so"] - 1
    C.world_hdri(sc, None, strength=1.0, color=(0.0, 0.0, 0.0))
    nt = sc.world.node_tree
    vol = nt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Color"].default_value = (0.35, 0.6, 0.7, 1)
    vol.inputs["Anisotropy"].default_value = 0.6
    nt.links.new(vol.outputs["Volume"], nt.nodes["World Output"].inputs["Volume"])
    dens = vol.inputs["Density"]
    for f, d in ((f0, 0.0), (c["two"], 0.0)):  # black water, like the real ROV footage
        dens.default_value = d
        dens.keyframe_insert("default_value", frame=f)
    # seabed: silt with low dunes
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -60, 0))
    bed = bpy.context.object
    bed.scale = (900, 1500, 1)
    bpy.ops.object.transform_apply(scale=True)
    sub = bed.modifiers.new("sub", "SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = sub.render_levels = 8
    # broad swells + fine ripples: the low survey light turns them into scan-like relief
    for nm, scale, strength in (("dunes", 60, 5.0), ("ripples", 9, 1.0)):
        tex = bpy.data.textures.new(nm, "CLOUDS")
        tex.noise_scale = scale
        dsp = bed.modifiers.new(nm, "DISPLACE")
        dsp.texture = tex
        dsp.strength = strength
    bed.data.materials.append(C.pbr("silt", "coast_sand_rocks_02", scale=0.06, tint=(0.55, 0.52, 0.47)))
    # bow: upright, nose dug into the mud; stern: reversed, crumpled
    rb, PB = liner.build("bow", split_x=-14, wreck=True)
    drop_piece(PB, "stern")
    rb.rotation_euler = (0, math.radians(1.5), math.radians(90))
    rb.location = BOW_LOC
    rs, PS = liner.build("stern", split_x=-14, wreck=True, seed=5)
    drop_piece(PS, "bow")
    rs.rotation_euler = (math.radians(4), 0, math.radians(-90 + 4))
    rs.location = STERN_LOC
    rs.scale = (1, 1.12, 0.62)  # decks pancaked when it hit the bottom
    # debris field between the pieces
    rnd = random.Random(9)
    junk = C.pbr("junk", "rusty_metal_02", scale=0.3, tint=(0.5, 0.3, 0.2))
    bpy.ops.mesh.primitive_cube_add(size=1)
    base = bpy.context.object
    base.data.materials.append(junk)
    base.location = (0, 0, -50)
    for i in range(420):
        y = rnd.uniform(-345, 262)
        near = min(abs(y - 262), abs(y + 340))
        x = rnd.gauss(0, 30 + 0.25 * near)
        o = bpy.data.objects.new("debris", base.data)
        bpy.context.collection.objects.link(o)
        s = rnd.uniform(1.0, 7.0)
        o.scale = (s, s * rnd.uniform(0.3, 1.0), s * rnd.uniform(0.15, 0.5))
        o.location = (x, y, 0.3)
        o.rotation_euler = (rnd.uniform(-0.3, 0.3), rnd.uniform(-0.3, 0.3), rnd.uniform(0, 6.3))
    # ROV camera with two lamps; at "two pieces" it is 1 km up looking straight down (north up)
    cam = C.camera(sc, lens=30, fstop=None)
    cam.data.clip_end = 3000
    # ROV in front of the prow, then a hard cut (glitch in Remotion) to the survey mosaic
    cut = SCAN_CUT
    C.aim(cam, (26, 452, 34), (0, 396, 12), frame=f0)
    C.aim(cam, (36, 440, 30), (0, 390, 12), frame=cut - 1)
    C.aim(cam, (0, -131, 1080), (0, -130, 0), frame=cut)
    C.aim(cam, (0, -131, 1020), (0, -130, 0), frame=f1)
    fc_set_constant(cam, cut - 1)
    lamps = []
    for dx in (-3, 3):
        bpy.ops.object.light_add(type="SPOT", location=(dx, 0, 0))
        lp = bpy.context.object
        lp.data.spot_size = math.radians(55)
        lp.data.spot_blend = 0.6
        lp.data.color = (0.85, 0.95, 1.0)
        lp.parent = cam
        lp.rotation_euler = (0, math.radians(dx * 2), 0)
        for f, e in ((f0, 1.5e5), (cut - 1, 1.5e5), (cut, 0)):
            lp.data.energy = e
            lp.data.keyframe_insert("energy", frame=f)
        fc_set_constant(lp.data, cut - 1)
    # survey light for the mosaic: low and raking (long shadows = relief), graded to sonar teal in Remotion
    bpy.ops.object.light_add(type="SUN")
    sun = bpy.context.object
    sun.rotation_euler = (math.radians(72), 0, math.radians(65))
    sun.data.color = (1.0, 1.0, 1.0)
    sun.data.angle = math.radians(2)
    for f, e in ((f0, 0), (cut - 1, 0), (cut, 16.0)):
        sun.data.energy = e
        sun.data.keyframe_insert("energy", frame=f)
    fc_set_constant(sun.data, cut - 1)
    C.glare(sc, threshold=1.5, size=6, strength=0.5)
    sc["track"] = True


def export_track(sc, path, points, f0, f1):
    """Screen positions (1080×1920 px) of world points for every frame → JSON for Remotion."""
    cam = sc.camera
    out = {"from": f0, "points": {k: [] for k in points}}
    for f in range(f0, f1 + 1):
        sc.frame_set(f)
        for k, p in points.items():
            v = world_to_camera_view(sc, cam, mathutils.Vector(p))
            out["points"][k].append(None if v.z <= 0 else [round(v.x * 1080, 1), round((1 - v.y) * 1920, 1)])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(out, open(path, "w"))


WRECK_POINTS = {"bowTag": (0, 334, 20), "sternTag": (0, -400, 18), "a": (0, 258, 6), "b": (0, -338, 6)}


# ───────────────────────── C · a crack draws down the hull between funnels 3 and 4 ─────────────────────────
@shot("crack", c["so"], c["iceberg"] - 1)
def crack(sc):
    f0, f1 = c["so"], c["iceberg"] - 1
    night_sky(sc)
    calm_sea(sc, f0, f1)
    root, P = liner.build("ship")
    # jagged crack from the boat deck to the waterline at x = −14, just proud of the plating
    rnd = random.Random(2)
    pts = []
    z = liner.BOAT_DECK
    x = -14.0
    while z > 0.5:
        y = -liner.half_w(x, min(1, (z + 10.5) / 21.5)) - 0.12 if z < liner.sheer(x) else -liner.HB + 0.9 - 0.12
        pts.append((x, y, z))
        z -= rnd.uniform(0.6, 1.4)
        x += rnd.uniform(-0.9, 0.9)
    cd = bpy.data.curves.new("crack", "CURVE")
    cd.dimensions = "3D"
    sp = cd.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
    cd.bevel_depth = 0.32
    cd.bevel_resolution = 1
    co = bpy.data.objects.new("crack", cd)
    sc.collection.objects.link(co)
    cm = C.mat("crack", (0.02, 0.015, 0.01), rough=0.8, emission=(1.0, 0.55, 0.22), strength=6)
    cd.materials.append(cm)
    cd.bevel_factor_end = 0
    cd.keyframe_insert("bevel_factor_end", frame=f0 + 8)
    cd.bevel_factor_end = 1
    cd.keyframe_insert("bevel_factor_end", frame=c["half"] + 6)
    cam = C.camera(sc, lens=30, fstop=None)
    C.aim(cam, (12, -62, 4), (-14, -14, 10), frame=f0)
    C.aim(cam, (2, -48, 6), (-14, -14, 9), frame=f1)
    bpy.ops.object.light_add(type="SUN")
    s = bpy.context.object
    s.data.energy = 0.05
    s.data.color = (0.6, 0.7, 1.0)
    s.rotation_euler = (math.radians(60), 0, math.radians(-30))
    C.glare(sc, threshold=0.8, size=7, strength=0.8)


# ───────────────────────── F/G · stern rises, the hull bends and snaps ─────────────────────────
def pitch_at(f):
    """Bow-down trim (degrees) by frame: 7 → 15 while the stern rises (matches the HUD readout)."""
    k = min(1, max(0, (f - c["stern"] - 6) / (c["hanging"] + 20 - c["stern"] - 6)))
    k = k * k * (3 - 2 * k)
    return 7 + 8 * k


@shot("break", c["stern"], c["not"] - 1)
def brk(sc):
    f0, f1 = c["stern"], c["not"] - 1
    night_sky(sc)
    calm_sea(sc, f0, f1)
    pivot = C.empty("pivot", (25, 0, 0))
    root, P = liner.build("ship")
    root.location = (-25, 0, 0)
    root.parent = pivot
    keys = [f0, c["tons"], c["hanging"], c["hanging"] + 20, c["hull"], c["snapped"], f1]
    for f in keys:
        pivot.rotation_euler = (0, math.radians(pitch_at(f)), 0)
        pivot.location = (25, 0, -2 - 4 * (pitch_at(f) - 7) / 8)
        pivot.keyframe_insert("rotation_euler", frame=f, index=1)
        pivot.keyframe_insert("location", frame=f, index=2)
    # lights fail just before the break; bending stress builds; then the hull snaps at the keel
    liner.set_lights(P, 1, c["hull"] - 2)
    liner.set_lights(P, 0.15, c["hull"] + 1)
    liner.set_lights(P, 0, c["hull"] + 4)
    st = P["stress"].outputs[0]
    for f, v in ((c["hull"], 0), (c["snapped"], 1), (c["snapped"] + 12, 0.0)):
        st.default_value = v
        st.keyframe_insert("default_value", frame=f)
    for piece, ang in ((P["bow"], 22), (P["stern"], -9)):
        piece.rotation_euler = (0, 0, 0)
        piece.keyframe_insert("rotation_euler", frame=c["snapped"], index=1)
        piece.rotation_euler = (0, math.radians(ang), 0)
        piece.keyframe_insert("rotation_euler", frame=f1, index=1)
    bowdrop = P["bow"].location.z
    P["bow"].keyframe_insert("location", frame=c["snapped"], index=2)
    P["bow"].location.z = bowdrop - 9
    P["bow"].keyframe_insert("location", frame=f1, index=2)
    # weight arrows over the raised stern (world-vertical, so they counter the ship's trim)
    am = C.mat("arrow", (1, 0.2, 0.12), emission=(1.0, 0.25, 0.15), strength=5)
    for i, ax in enumerate((-62, -84, -122)):
        # local to the stern piece (origin = keel under the break, x = −14 / z = −10.5)
        arr = C.empty(f"arrow{i}")
        arr.parent = P["stern"]
        arr.location = (ax + 14, 0, 42)
        shaft = C.cyl("shaft", 1.0, 14, (0, 0, 0), m=am, verts=16)
        bpy.ops.mesh.primitive_cone_add(radius1=3.0, depth=6, vertices=24)
        head = bpy.context.object
        head.data.materials.append(am)
        head.rotation_euler = (math.pi, 0, 0)
        shaft.parent, head.parent = arr, arr
        shaft.location, head.location = (0, 0, 9), (0, 0, -1)
        for f, s in ((c["tons"] + 2 + i * 3, 0), (c["tons"] + 8 + i * 3, 1), (c["hull"] - 1, 1), (c["hull"], 0)):
            arr.scale = (s, s, s)
            arr.keyframe_insert("scale", frame=f)
        for f in keys:  # counter the trim so they point straight down
            arr.rotation_euler = (0, -math.radians(pitch_at(f)), 0)
            arr.keyframe_insert("rotation_euler", frame=f, index=1)
    # sparks at the break
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.35, location=(0, 0, -200))
    spark = bpy.context.object
    spark.data.materials.append(C.mat("spark", (1, 0.6, 0.2), emission=(1.0, 0.6, 0.25), strength=40))
    bpy.ops.mesh.primitive_plane_add(size=6)
    em = bpy.context.object
    em.parent = P["stern"]
    em.location = (0, 0, 14)
    em.hide_render = True
    ps = em.modifiers.new("sparks", "PARTICLE_SYSTEM").particle_system.settings
    ps.count = 260
    ps.frame_start, ps.frame_end = c["snapped"], c["snapped"] + 8
    ps.lifetime = 22
    ps.normal_factor = 18
    ps.factor_random = 10
    ps.render_type = "OBJECT"
    ps.instance_object = spark
    ps.particle_size = 1.0
    ps.size_random = 0.6
    # camera: low stern quarter, then a cut to the broadside at "The hull bent"
    cam = C.camera(sc, lens=24, fstop=None)
    C.aim(cam, (-200, -110, 6), (-50, 0, 24), frame=f0)
    C.aim(cam, (-185, -100, 7), (-50, 0, 30), frame=c["hull"] - 1)
    C.aim(cam, (-25, -300, 8), (-25, 0, 20), frame=c["hull"])
    C.aim(cam, (-25, -285, 8), (-25, 0, 16), frame=f1)
    fc_set_constant(cam, c["hull"] - 1)
    bpy.ops.object.light_add(type="SUN")
    s = bpy.context.object
    s.data.energy = 0.14
    s.data.color = (0.6, 0.7, 1.0)
    s.rotation_euler = (math.radians(60), 0, math.radians(-30))
    C.glare(sc, threshold=0.8, size=7, strength=0.8)


def fc_set_constant(ob, frame):
    """Make the keyframe at `frame` hold until the next one (a hard cut)."""
    for fc in C.fcurves(ob):
        for kp in fc.keyframe_points:
            if abs(kp.co.x - frame) < 0.5:
                kp.interpolation = "CONSTANT"


# ───────────────────────── I · from a lifeboat: the stern stands out of the sea ─────────────────────────
def open_boat(name):
    import bmesh

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=14, radius=1.0)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > 0.01], context="VERTS")
    for v in bm.verts:
        v.co.x *= 4.3
        v.co.y *= 1.05
        v.co.z *= 1.0
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    so = o.modifiers.new("solid", "SOLIDIFY")
    so.thickness = 0.06
    for p in me.polygons:
        p.use_smooth = True
    return o


def person(name, loc, m, seed):
    rnd = random.Random(seed)
    torso = C.cyl(name, 0.22, 0.7, (loc[0], loc[1], loc[2] + 0.35), m=m, verts=12)
    torso.scale = (0.8, 1.0, 1.0)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(loc[0], loc[1], loc[2] + 0.84))
    head = bpy.context.object
    head.data.materials.append(m)
    torso.rotation_euler = (rnd.uniform(-0.1, 0.1), rnd.uniform(-0.15, 0.05), 0)
    return [torso, head]


@shot("lifeboat", c["survivors"], c["truth"] - 1)
def lifeboat(sc):
    f0, f1 = c["survivors"], c["truth"] - 1
    night_sky(sc, strength=1.6, stars=1.2)
    calm_sea(sc, f0, f1, size=200, repeat=4, scale=0.3)
    root, P = liner.build("ship")
    drop_piece(P, "bow")
    liner.set_lights(P, 0, f0)
    # the stern piece standing up, sinking slowly, ~320 m away
    # positive pitch = bow down / stern up; sunk so the torn end is under water
    root.location = (-300, 90, -40)
    root.rotation_euler = (0, math.radians(62), math.radians(-20))
    root.keyframe_insert("location", frame=f0)
    root.location = (-300, 90, -48)
    root.keyframe_insert("location", frame=f1)
    linear_keys(root)
    # the boat with people, rocking a little
    boat = open_boat("lifeboat")
    wood = C.mat("boatwood", (0.32, 0.27, 0.22), rough=0.7)
    boat.data.materials.append(wood)
    rig = C.empty("boat", (0, 0, 0.35))
    boat.parent = rig
    dark = C.mat("coat", (0.03, 0.03, 0.035), rough=0.8)
    folks = []
    for i, (bx, by) in enumerate(((-2.2, -0.45), (-2.1, 0.45), (-0.8, -0.5), (-0.7, 0.45), (0.6, 0.0), (1.8, -0.4))):
        folks += person(f"p{i}", (bx, by, -0.25), dark, i)
    for o in folks:
        o.parent = rig
    for f in range(f0, f1 + 1, 15):
        rig.rotation_euler = (0.03 * math.sin(f * 0.05), 0.02 * math.sin(f * 0.04 + 1), 0)
        rig.location.z = 0.35 + 0.05 * math.sin(f * 0.06)
        rig.keyframe_insert("rotation_euler", frame=f)
        rig.keyframe_insert("location", frame=f)
    cam = C.camera(sc, lens=35, fstop=None)
    C.aim(cam, (5.8, -1.6, 1.7), (-300, 60, 40), frame=f0)
    C.aim(cam, (5.4, -1.4, 1.6), (-300, 60, 36), frame=f1)
    # starlight from behind the ship: the people read as silhouettes against the glittering sea
    bpy.ops.object.light_add(type="SUN")
    s = bpy.context.object
    s.data.energy = 0.1
    s.data.color = (0.6, 0.72, 1.0)
    s.rotation_euler = (math.radians(80), 0, math.radians(110))
    C.glare(sc, threshold=0.8, size=7, strength=0.8)


# ───────────────────────── J · the bow glides down into the dark ─────────────────────────
@shot("descent", c["truth"], c["which"] - 1)
def descent(sc):
    f0, f1 = c["truth"], c["which"] - 1
    C.world_hdri(sc, None, strength=1.0, color=(0.0, 0.0, 0.0))
    C.world_fog(sc, density=0.004, color=(0.3, 0.6, 0.8), anisotropy=0.6, glow=(0.03, 0.12, 0.2), glow_strength=0.0)
    vol = [n for n in sc.world.node_tree.nodes if n.type == "PRINCIPLED_VOLUME"][0]
    for f, g in ((f0, 0.0022), (f1, 0.0012)):
        vol.inputs["Emission Strength"].default_value = g
        vol.inputs["Emission Strength"].keyframe_insert("default_value", frame=f)
    root, P = liner.build("ship")
    drop_piece(P, "stern")
    liner.set_lights(P, 0, f0)
    root.rotation_euler = (0, math.radians(32), 0)
    root.location = (0, 0, 0)
    root.keyframe_insert("location", frame=f0)
    root.location = (60, 0, -110)
    root.keyframe_insert("location", frame=f1)
    linear_keys(root)
    bpy.ops.object.light_add(type="SUN")
    s = bpy.context.object
    s.rotation_euler = (math.radians(15), 0, math.radians(30))
    s.data.color = (0.5, 0.75, 1.0)
    for f, e in ((f0, 1.6), (f1, 0.55)):
        s.data.energy = e
        s.data.keyframe_insert("energy", frame=f)
    cam = C.camera(sc, lens=30, fstop=None)
    C.aim(cam, (60, -190, 10), (40, 0, -10), frame=f0)
    C.aim(cam, (95, -175, -95), (90, 0, -120), frame=f1)
    linear_keys(cam)
    marine_snow(700, (70, 60, 200), (85, -105, -50), r=0.12)
    C.glare(sc, threshold=1.0, size=6, strength=0.6)


# ───────────────────────── build + render (one shot at a time) ─────────────────────────
only = [x for x in a.only.split(",") if x] or list(SHOTS)
stills = [int(x) for x in a.stills.split(",") if x]
os.makedirs(a.stills_out, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
mine = C.chunk({k: SHOTS[k] for k in only}, a.chunk)
for name in only:
    start, end, fn = SHOTS[name]
    want = [f for f in stills if start <= f <= end]
    if not want and not (a.render and name in mine):
        continue
    sc = C.new_scene(name, start, end, res=a.res, samples=a.samples)
    sc.view_settings.exposure = 0.0
    fn(sc)
    if sc.camera:
        sc.camera.data.clip_end = max(sc.camera.data.clip_end, 4000)
    print(f"BUILT {name} {start}-{end}", flush=True)
    if "track" in sc:
        export_track(sc, os.path.join(C.ROOT, "public", "tib", "wreck_track.json"), WRECK_POINTS, start, end)
    for f in want:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(a.stills_out, f"s_{f:04d}.jpg")
        bpy.ops.render.render(write_still=True)
        print(f"STILL {f} ({name})", flush=True)
    if a.render and name in mine:
        sc.frame_start, sc.frame_end = mine[name]
        sc.render.filepath = os.path.join(OUT, "f_")
        bpy.ops.render.render(animation=True)
        print(f"RENDERED {name}", flush=True)
print("DONE", flush=True)
