"""Black Box — the whole reel in Blender (EEVEE). Remotion adds captions/HUD/sound on top.

  blender -b -P blender/blackbox.py -- --stills 0,120,300 --res 50        # look-dev stills
  blender -b -P blender/blackbox.py -- --render --res 100                 # all frames → public/bbb/frames

Every shot is a separate Blender scene covering a cue range (same cue phrases as
src/videos/black-box/cues.ts), so re-voicing re-times the shots automatically.
"""
import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "models"))
import common as C  # noqa: E402
import airliner  # noqa: E402
import recorder  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--stills", default="", help="comma-separated global frames to render as stills")
ap.add_argument("--render", action="store_true", help="render every frame of every shot")
ap.add_argument("--only", default="", help="comma-separated shot names to build/render")
ap.add_argument("--res", type=int, default=50)
ap.add_argument("--samples", type=int, default=48)
ap.add_argument("--out", default=os.path.join(C.ROOT, "public", "bbb", "frames"))
ap.add_argument("--stills_out", default=os.path.join(C.ROOT, "out", "stills", "bbb"))
a = ap.parse_args(argv)

cue = C.Cues("black-box")
c = {
    k: cue.at(*v) if isinstance(v, tuple) else cue.at(v)
    for k, v in {
        "black2": ("black", 2),
        "orange": "bright orange",
        "search": "search teams",
        "wreckage": "wreckage",
        "tail": "And they ride",
        "tailWord": "tail",
        "survive": "most likely",
        "armor": "But the orange",
        "armorWord": "armor",
        "chip": "The real recorder",
        "tests": "three tests",
        "first": "First",
        "g3400": "3,400",
        "fighter": "A fighter",
        "blacks": "blacks out",
        "fire": "Then fire",
        "deg": "1,100",
        "hour": "full hour",
        "ocean": "Then the ocean",
        "feet": "20,000",
        "underwater": "Underwater",
        "pings": "pings",
        "days": "90 days",
        "silent": "Then it goes",
        "so": "So the one",
        "found": "not being found",
        "which": "Which is why",
    }.items()
}
END = cue.voice_end + 10
print("CUES", c, "END", END, flush=True)

SHOTS = {}


def shot(name, start, end):
    def deco(fn):
        SHOTS[name] = (start, end, fn)
        return fn

    return deco


# ───────────────────────── 1 · void studio (hook + outro) ─────────────────────────
def void(sc, outro=False):
    C.world_hdri(sc, None, strength=1.0, color=(0.002, 0.0025, 0.004))
    C.world_fog(sc, density=0.012, color=(0.6, 0.7, 0.9), anisotropy=0.5)
    floor = C.cube("floor", (12, 12, 0.02), (0, 0, -0.01), C.mat("floor", (0.012, 0.013, 0.016), rough=0.22, metal=0.0))
    root, P = recorder.build("rec")
    root.rotation_euler = (0, 0, math.radians(-28))
    # blue rim lights from behind
    for x, y, e in ((-0.9, 0.9, 22), (0.9, 0.8, 14)):
        bpy.ops.object.light_add(type="AREA", location=(x, y, 0.55))
        L = bpy.context.object
        L.data.energy = e
        L.data.size = 0.6
        L.data.color = (0.45, 0.62, 1.0)
        L.rotation_euler = (math.radians(70), 0, math.atan2(-x, y) + math.pi)
    # key spot that snaps on at "black" #2 and fades for the loop
    bpy.ops.object.light_add(type="SPOT", location=(0.55, -0.85, 1.25))
    key = bpy.context.object
    key.data.energy = 0
    key.data.spot_size = math.radians(30)
    key.data.spot_blend = 0.4
    key.data.color = (1.0, 0.93, 0.82)
    key.data.shadow_soft_size = 0.05
    d = (0 - key.location.x, 0 - key.location.y, 0.08 - key.location.z)
    import mathutils

    key.rotation_euler = mathutils.Vector(d).to_track_quat("-Z", "Y").to_euler()
    on = 260
    if not outro:
        for f, e in ((0, 0), (c["black2"] - 1, 0), (c["black2"] + 2, on)):
            key.data.energy = e
            key.data.keyframe_insert("energy", frame=f)
    else:
        for f, e in ((c["so"], on), (c["which"], on * 0.15), (END - 6, 0)):
            key.data.energy = e
            key.data.keyframe_insert("energy", frame=f)
    cam = C.camera(sc, lens=50, fstop=2.2)
    look = (0.03, 0, 0.09)
    p0 = (0.95, -1.05, 0.32)
    if not outro:
        C.aim(cam, p0, look, frame=0)
        C.aim(cam, (0.62, -0.78, 0.26), look, frame=c["search"])
    else:
        C.aim(cam, (-0.55, -0.9, 0.34), look, frame=c["so"])
        C.aim(cam, p0, look, frame=END - 2)
    # turntable: the recorder turns slowly (same angle at frame 0 and at the end)
    root.rotation_euler[2] = math.radians(-28)
    root.keyframe_insert("rotation_euler", frame=(c["so"] if outro else 0), index=2)
    root.rotation_euler[2] = math.radians(-28 + (12 if not outro else 0))
    root.keyframe_insert("rotation_euler", frame=(END - 2 if outro else c["search"]), index=2)
    C.glare(sc, threshold=1.2, size=6)


shot("void_in", 0, c["search"] - 1)(lambda sc: void(sc))
shot("void_out", c["so"], END)(lambda sc: void(sc, outro=True))


# ───────────────────────── 2 · night wreckage, a searchlight finds the box ─────────────────────────
@shot("wreck", c["search"], c["tail"] - 1)
def wreck(sc):
    import random

    rnd = random.Random(4)
    C.world_hdri(sc, None, strength=1.0, color=(0.004, 0.006, 0.012))
    C.world_fog(sc, density=0.035, color=(0.75, 0.8, 0.9), anisotropy=0.6)
    ground = C.cube("ground", (60, 60, 0.02), (0, 0, -0.01), C.pbr("burned", "burned_ground_01", scale=0.25, bump=1.2))
    skin = C.mat("panel", (0.75, 0.77, 0.8), rough=0.35, metal=0.65)
    char = C.mat("charred", (0.04, 0.035, 0.03), rough=0.8, metal=0.2)
    # torn fuselage panels: bent cylinder segments with a noisy edge (displace), scattered
    for i in range(36):
        r = 0.6 + rnd.random() * 1.6
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=0.6 + rnd.random() * 1.4, vertices=24, end_fill_type="NOTHING", location=(0, 0, 0))
        o = bpy.context.object
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="DESELECT")
        bpy.ops.object.mode_set(mode="OBJECT")
        keep = rnd.uniform(0.15, 0.4)
        for v in o.data.vertices:
            ang = math.atan2(v.co.y, v.co.x)
            v.select = not (0 < ang < keep * math.pi * 2)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.delete(type="VERT")
        bpy.ops.object.mode_set(mode="OBJECT")
        sol = o.modifiers.new("sol", "SOLIDIFY")
        sol.thickness = 0.01
        tex = bpy.data.textures.new(f"torn{i}", "CLOUDS")
        tex.noise_scale = 0.3
        dsp = o.modifiers.new("dsp", "DISPLACE")
        dsp.texture = tex
        dsp.strength = 0.12
        ang = rnd.random() * math.pi * 2
        dist = 1.0 + rnd.random() * 5
        o.location = (math.cos(ang) * dist, math.sin(ang) * dist + 1.5, 0.05 + rnd.random() * 0.2)
        o.rotation_euler = (rnd.random() * 3, rnd.random() * 3, rnd.random() * 6)
        o.data.materials.append(skin if rnd.random() > 0.35 else char)
        bpy.ops.object.shade_smooth()
    # small shards
    for i in range(120):
        ang = rnd.random() * math.pi * 2
        dist = 0.6 + rnd.random() * 9
        C.cube("shard", (0.05 + rnd.random() * 0.3, 0.03 + rnd.random() * 0.2, 0.004), (math.cos(ang) * dist, math.sin(ang) * dist + 1, 0.01), skin if rnd.random() > 0.5 else char).rotation_euler = (
            rnd.random(),
            rnd.random(),
            rnd.random() * 6,
        )
    # embers (slow glow, no strobe)
    ember = C.mat("ember", (0.1, 0.03, 0.0), emission=(1.0, 0.35, 0.05), strength=8)
    for i in range(40):
        ang = rnd.random() * math.pi * 2
        dist = 2.2 + rnd.random() * 6
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.006 + rnd.random() * 0.01, location=(math.cos(ang) * dist, math.sin(ang) * dist + 1.5, 0.006))
        bpy.context.object.data.materials.append(ember)
    # small fires on the ground: glowing coal patch + a warm light each
    for (fx, fy) in ((-1.6, 2.4), (2.2, 3.6), (-0.4, 5.5), (3.4, 1.2), (-3.0, 4.6)):
        C.cyl("coals", 0.25 + rnd.random() * 0.2, 0.01, (fx, fy, 0.005), m=C.mat("coal", (0.05, 0.01, 0.0), emission=(1.0, 0.3, 0.04), strength=5), verts=12)
        bpy.ops.object.light_add(type="POINT", location=(fx, fy, 0.35))
        fl = bpy.context.object
        fl.data.energy = 60
        fl.data.color = (1.0, 0.45, 0.12)
        fl.data.shadow_soft_size = 0.3
    # smoke columns: procedural volume (noise rising with time via mapping keyframes)
    for (x, y, h) in ((-2.5, 4.0, 6), (3.0, 6.0, 7), (0.8, 9.0, 8)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, h / 2))
        sm = bpy.context.object
        sm.scale = (1.6, 1.6, h)
        vm = bpy.data.materials.new("smoke")
        vm.use_nodes = True
        nt = vm.node_tree
        for n in list(nt.nodes):
            nt.nodes.remove(n)
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        pv = nt.nodes.new("ShaderNodeVolumePrincipled")
        pv.inputs["Color"].default_value = (0.05, 0.05, 0.055, 1)
        co = nt.nodes.new("ShaderNodeTexCoord")
        mp = nt.nodes.new("ShaderNodeMapping")
        nz = nt.nodes.new("ShaderNodeTexNoise")
        nz.inputs["Scale"].default_value = 2.2
        nz.inputs["Detail"].default_value = 8
        grad = nt.nodes.new("ShaderNodeTexGradient")
        grad.gradient_type = "SPHERICAL"
        nt.links.new(co.outputs["Object"], mp.inputs["Vector"])
        nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
        nt.links.new(co.outputs["Object"], grad.inputs["Vector"])
        mul = nt.nodes.new("ShaderNodeMath")
        mul.operation = "MULTIPLY"
        nt.links.new(nz.outputs["Fac"], mul.inputs[0])
        nt.links.new(grad.outputs["Fac"], mul.inputs[1])
        cr = nt.nodes.new("ShaderNodeMapRange")
        cr.inputs["From Min"].default_value = 0.18
        cr.inputs["From Max"].default_value = 0.5
        cr.inputs["To Max"].default_value = 6.0
        nt.links.new(mul.outputs["Value"], cr.inputs["Value"])
        nt.links.new(cr.outputs["Result"], pv.inputs["Density"])
        nt.links.new(pv.outputs["Volume"], out.inputs["Volume"])
        # the smoke drifts upward: animate the noise offset
        mp.inputs["Location"].default_value = (0, 0, 0)
        mp.inputs["Location"].keyframe_insert("default_value", frame=c["search"])
        mp.inputs["Location"].default_value = (0, 0, -0.4)
        mp.inputs["Location"].keyframe_insert("default_value", frame=c["tail"])
        sm.data.materials.append(vm)
    # the recorder, half-buried and scorched, near the camera
    root, P = recorder.build("rec", wear=0.8)
    root.location = (0.35, 0.2, -0.05)
    root.rotation_euler = (math.radians(14), math.radians(-8), math.radians(35))
    # searchlight from a helicopter: sweeps across the field, lands on the box at "wreckage"
    bpy.ops.object.light_add(type="SPOT", location=(-6, -3, 14))
    sl = bpy.context.object
    sl.data.energy = 9000
    sl.data.spot_size = math.radians(11)
    sl.data.spot_blend = 0.35
    sl.data.color = (0.85, 0.92, 1.0)
    tgt = C.empty("slTarget", (-4, 6, 0))
    con = sl.constraints.new("TRACK_TO")
    con.target = tgt
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    for f, p in ((c["search"], (-4.0, 7.0, 0)), (c["search"] + 20, (-1.5, 2.5, 0)), (c["wreckage"] - 2, (0.35, 0.25, 0)), (c["tail"], (0.35, 0.25, 0))):
        tgt.location = p
        tgt.keyframe_insert("location", frame=f)
    # dim moon fill
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 10))
    moon = bpy.context.object
    moon.data.energy = 0.45
    moon.data.color = (0.6, 0.7, 1.0)
    moon.rotation_euler = (math.radians(50), 0, math.radians(-40))
    cam = C.camera(sc, lens=35, fstop=2.8)
    C.aim(cam, (-0.8, -4.6, 3.0), (0.2, 2.2, 0.2), frame=c["search"])
    C.aim(cam, (1.1, -1.35, 0.75), (0.35, 0.2, 0.1), frame=c["wreckage"] + 6)
    C.aim(cam, (0.95, -1.15, 0.62), (0.35, 0.2, 0.1), frame=c["tail"])
    C.glare(sc, threshold=1.0, size=7)


# ───────────────────────── 3 · airliner above the clouds, tail turns x-ray ─────────────────────────
@shot("plane", c["tail"], c["armor"] - 1)
def plane(sc):
    C.world_hdri(sc, "kloppenheim_06_puresky_2k.hdr", strength=1.0, rotation=math.radians(110))
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 50))
    sun = bpy.context.object
    sun.data.energy = 3.5
    sun.data.angle = math.radians(1.5)
    sun.rotation_euler = (math.radians(55), 0, math.radians(140))
    root, P = airliner.build("jet")
    # cloud deck below: volume slab with noise density
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -55))
    cl = bpy.context.object
    cl.scale = (500, 500, 14)
    vm = bpy.data.materials.new("clouds")
    vm.use_nodes = True
    nt = vm.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    pv = nt.nodes.new("ShaderNodeVolumePrincipled")
    pv.inputs["Color"].default_value = (1, 1, 1, 1)
    pv.inputs["Anisotropy"].default_value = 0.6
    co = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1, 1, 2.5)
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 5
    nz.inputs["Detail"].default_value = 10
    nz.inputs["Roughness"].default_value = 0.6
    nt.links.new(co.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(co.outputs["Object"], sep.inputs["Vector"])
    hfade = nt.nodes.new("ShaderNodeMapRange")  # thinner toward the top of the deck
    hfade.inputs["From Min"].default_value = 0.5
    hfade.inputs["From Max"].default_value = -0.3
    nt.links.new(sep.outputs["Z"], hfade.inputs["Value"])
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    nt.links.new(nz.outputs["Fac"], mul.inputs[0])
    nt.links.new(hfade.outputs["Result"], mul.inputs[1])
    dr = nt.nodes.new("ShaderNodeMapRange")
    dr.inputs["From Min"].default_value = 0.47
    dr.inputs["From Max"].default_value = 0.56
    dr.inputs["To Max"].default_value = 0.35
    nt.links.new(mul.outputs["Value"], dr.inputs["Value"])
    nt.links.new(dr.outputs["Result"], pv.inputs["Density"])
    nt.links.new(pv.outputs["Volume"], out.inputs["Volume"])
    cl.data.materials.append(vm)
    # clouds stream past (plane flies +X): move the noise
    mp.inputs["Location"].default_value = (0, 0, 0)
    mp.inputs["Location"].keyframe_insert("default_value", frame=c["tail"])
    mp.inputs["Location"].default_value = (0.25, 0, 0)
    mp.inputs["Location"].keyframe_insert("default_value", frame=c["armor"])
    # recorder inside the tail, enlarged ×6 so it reads at airliner scale (noted in the storyboard)
    rroot, RP = recorder.build("tailrec")
    rroot.scale = (6, 6, 6)
    rroot.location = (-airliner.L / 2 + 5.2, -0.0, -0.9)
    # x-ray: tail skin fades out, a cyan wireframe of it fades in
    tm = P["tailskin_mat"]
    pbsdf = tm.node_tree.nodes["Principled BSDF"]
    if hasattr(tm, "surface_render_method"):
        tm.surface_render_method = "BLENDED"
    for f, al in ((c["tailWord"], 1.0), (c["tailWord"] + 12, 0.04)):
        pbsdf.inputs["Alpha"].default_value = al
        pbsdf.inputs["Alpha"].keyframe_insert("default_value", frame=f)
    wf = P["tailskin"].copy()
    wf.data = P["tailskin"].data.copy()
    sc.collection.objects.link(wf)
    wmod = wf.modifiers.new("wire", "WIREFRAME")
    wmod.thickness = 0.02
    wmat = C.mat("xray", (0.2, 0.8, 1.0), emission=(0.3, 0.9, 1.0), strength=0, alpha=1.0)
    wf.data.materials.clear()
    wf.data.materials.append(wmat)
    wp = wmat.node_tree.nodes["Principled BSDF"]
    for f, s in ((c["tailWord"], 0), (c["tailWord"] + 12, 6)):
        wp.inputs["Emission Strength"].default_value = s
        wp.inputs["Emission Strength"].keyframe_insert("default_value", frame=f)
    # saturated and moderate: a strong emission clipped to a pale blob under AgX
    glow = C.mat("recglow", (0.9, 0.12, 0.01), emission=(1.0, 0.22, 0.01), strength=0)
    gp = glow.node_tree.nodes["Principled BSDF"]
    for f, s in ((c["tailWord"] + 6, 0), (c["tailWord"] + 16, 1.4)):
        gp.inputs["Emission Strength"].default_value = s
        gp.inputs["Emission Strength"].keyframe_insert("default_value", frame=f)
    # every part glows (the white label read as stray letters) → one orange silhouette
    for part in RP["all"]:
        if part.type == "MESH" and part.data.materials:
            part.data.materials[0] = glow
    # gentle bank
    root.rotation_euler = (math.radians(-4), 0, 0)
    root.keyframe_insert("rotation_euler", frame=c["tail"])
    root.rotation_euler = (math.radians(3), 0, 0)
    root.keyframe_insert("rotation_euler", frame=c["armor"])
    cam = C.camera(sc, lens=45, fstop=None)
    C.aim(cam, (26, -78, 10), (-1, 0, -1), frame=c["tail"])
    C.aim(cam, (-4, -36, 5), (-12, 0, 0.5), frame=c["tailWord"] + 4)
    C.aim(cam, (-9, -19, 2.5), (-14.2, 0, 0.6), frame=c["armor"])
    C.glare(sc, threshold=1.3, size=6)


# ───────────────────────── 4 · cutaway: armor vs the memory unit ─────────────────────────
@shot("cutaway", c["armor"], c["first"] - 1)
def cutaway(sc):
    C.world_hdri(sc, None, strength=1.0, color=(0.004, 0.012, 0.025))
    floor = C.cube("floor", (8, 8, 0.01), (0, 0, -0.005), None)
    gm = bpy.data.materials.new("grid")
    gm.use_nodes = True
    nt = gm.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (0.01, 0.03, 0.06, 1)
    p.inputs["Roughness"].default_value = 0.3
    br = nt.nodes.new("ShaderNodeTexBrick")
    br.inputs["Scale"].default_value = 30
    br.inputs["Mortar Size"].default_value = 0.012
    br.offset = 0
    br.squash = 1
    br.inputs["Color1"].default_value = (0, 0, 0, 1)
    br.inputs["Color2"].default_value = (0, 0, 0, 1)
    br.inputs["Mortar"].default_value = (0.25, 0.85, 1.0, 1)
    nt.links.new(br.outputs["Color"], p.inputs["Emission Color"])
    p.inputs["Emission Strength"].default_value = 0.6
    floor.data.materials.append(gm)
    root, P = recorder.build("rec")
    # key + rim
    for loc, e, col in (((0.6, -0.9, 0.9), 50, (1, 0.97, 0.92)), ((-0.6, 0.7, 0.5), 40, (0.4, 0.75, 1.0))):
        bpy.ops.object.light_add(type="AREA", location=loc)
        L = bpy.context.object
        L.data.energy = e
        L.data.size = 0.7
        L.data.color = col
        import mathutils

        L.rotation_euler = (mathutils.Vector((0, 0, 0.08)) - mathutils.Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    # armor turns to glass at "armor"; the cap slides off and the board rises at "The real recorder"
    for part in P["all"]:
        if part.type != "MESH" or not part.data.materials:
            continue
        m = part.data.materials[0]
        if "paint" not in m.name:
            continue
    paintm = P["paint"]
    pp = paintm.node_tree.nodes["Principled BSDF"]
    if hasattr(paintm, "surface_render_method"):
        paintm.surface_render_method = "BLENDED"
    for f, al in ((c["armorWord"], 1.0), (c["armorWord"] + 10, 0.55), (c["chip"], 0.55), (c["chip"] + 14, 0.18)):
        pp.inputs["Alpha"].default_value = al
        pp.inputs["Alpha"].keyframe_insert("default_value", frame=f)
    cap = P["cap"]
    cap.keyframe_insert("location", frame=c["chip"])
    cap.location.x += 0.12
    cap.keyframe_insert("location", frame=c["chip"] + 14)
    board = P["board"]
    board.hide_render = False
    for ch in P["chips"]:
        ch.hide_render = False
    board.keyframe_insert("location", frame=c["chip"] + 6)
    board.location.z += 0.12
    board.location.x += 0.04
    board.keyframe_insert("location", frame=c["chip"] + 22)
    pcb = P["pcb"].node_tree.nodes["Principled BSDF"]
    pcb.inputs["Emission Color"].default_value = (0.2, 1.0, 0.5, 1)
    for f, s in ((c["chip"] + 6, 0), (c["chip"] + 22, 1.5)):
        pcb.inputs["Emission Strength"].default_value = s
        pcb.inputs["Emission Strength"].keyframe_insert("default_value", frame=f)
    cam = C.camera(sc, lens=50, fstop=2.8)
    look = (0.08, 0, 0.09)
    C.aim(cam, (0.9, -1.0, 0.55), look, frame=c["armor"])
    C.aim(cam, (0.65, -0.62, 0.42), (0.13, 0, 0.12), frame=c["chip"] + 20)
    C.aim(cam, (0.55, -0.55, 0.38), (0.13, 0, 0.13), frame=c["first"])
    C.glare(sc, threshold=1.0, size=6)


# ───────────────────────── 5 · impact test: the memory unit fired into aluminium honeycomb ─────────────────────────
@shot("impact", c["first"], c["fire"] - 1)
def impact(sc):
    C.world_hdri(sc, "industrial_workshop_foundry_1k.hdr", strength=0.6)
    C.cube("floor", (40, 40, 0.02), (0, 0, -0.01), C.pbr("concrete", "concrete_floor_02", scale=0.4))
    steel = C.mat("steel", (0.55, 0.56, 0.58), rough=0.28, metal=1.0)
    # air cannon barrel on a stand, pointing +X
    C.cyl("barrel", 0.11, 3.0, (-2.2, 0, 0.9), rot=(0, math.radians(90), 0), m=steel, bevel=0.01)
    C.cyl("barrel_in", 0.08, 3.02, (-2.2, 0, 0.9), rot=(0, math.radians(90), 0), m=C.mat("bore", (0.01, 0.01, 0.01), rough=0.6))
    for x in (-3.2, -1.3):
        C.cube("stand", (0.12, 0.5, 0.85), (x, 0, 0.42), steel, bevel=0.01)
    # honeycomb target block: hex texture via voronoi-ish brick-like pattern on a thick block
    hc = bpy.data.materials.new("honeycomb")
    hc.use_nodes = True
    nt = hc.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Metallic"].default_value = 1.0
    p.inputs["Roughness"].default_value = 0.3
    hexi = nt.nodes.new("ShaderNodeTexImage")
    hexi.image = bpy.data.images.load(os.path.join(C.ROOT, "blender", "assets", "honeycomb.png"), check_existing=True)
    hexi.projection = "BOX"
    hco = nt.nodes.new("ShaderNodeTexCoord")
    hmp = nt.nodes.new("ShaderNodeMapping")
    hmp.inputs["Scale"].default_value = (2.2, 2.2, 2.2)
    nt.links.new(hco.outputs["Object"], hmp.inputs["Vector"])
    nt.links.new(hmp.outputs["Vector"], hexi.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeRGBToBW")
    nt.links.new(hexi.outputs["Color"], mr.inputs["Color"])
    inv = nt.nodes.new("ShaderNodeMath")
    inv.operation = "SUBTRACT"
    inv.inputs[0].default_value = 1.0
    nt.links.new(mr.outputs["Val"], inv.inputs[1])
    mr = inv
    col = nt.nodes.new("ShaderNodeMix")
    col.data_type = "RGBA"
    col.inputs[6].default_value = (0.9, 0.9, 0.92, 1)
    col.inputs[7].default_value = (0.08, 0.08, 0.09, 1)
    nt.links.new(mr.outputs["Value"], col.inputs["Factor"])
    nt.links.new(col.outputs[2], p.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.8
    nt.links.new(mr.outputs["Value"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    C.cube("target", (0.3, 0.8, 0.8), (1.0, 0, 0.83), hc, bevel=0.005)
    C.cube("target_frame", (0.34, 0.86, 0.12), (1.0, 0, 0.37), steel, bevel=0.005)
    # the CSMU only (that's what is tested): orange cylinder with its label
    root, P = recorder.build("rec")
    keep = {P["csmu"].name, P["cap"].name, P["label"].name}
    for part in P["all"]:
        if part.name not in keep:
            part.hide_render = True
    hit = c["g3400"] + 2
    # fly from the barrel to the target (fast), small rebound, then rest
    root.rotation_euler = (0, 0, 0)
    for f, x in ((c["first"], -3.6), (hit - 12, -1.9), (hit, 0.66), (hit + 10, 0.5), (c["fire"], 0.5)):
        root.location = (x, 0, 0.83)
        root.keyframe_insert("location", frame=f)
    # impact flash + dent decal
    bpy.ops.object.light_add(type="POINT", location=(0.85, -0.3, 0.95))
    fl = bpy.context.object
    for f, e in ((hit - 1, 0), (hit, 2500), (hit + 6, 0)):
        fl.data.energy = e
        fl.data.keyframe_insert("energy", frame=f)
    fl.data.color = (1.0, 0.85, 0.6)
    # overhead strip lights
    for x in (-2, 1):
        bpy.ops.object.light_add(type="AREA", location=(x, 0, 3.4))
        L = bpy.context.object
        L.data.energy = 220
        L.data.shape = "RECTANGLE"
        L.data.size, L.data.size_y = 2.5, 0.3
    cam = C.camera(sc, lens=35, fstop=4)
    C.aim(cam, (-2.2, -1.5, 1.05), (-1.4, 0, 0.88), frame=c["first"])
    C.aim(cam, (0.25, -1.25, 1.0), (0.75, 0, 0.86), frame=hit)
    C.aim(cam, (0.0, -1.7, 1.2), (0.7, 0, 0.86), frame=c["fighter"])
    C.aim(cam, (-0.1, -1.9, 1.3), (0.7, 0, 0.86), frame=c["fire"])
    C.glare(sc, threshold=1.0, size=7)


# ───────────────────────── 6 · fire test ─────────────────────────
@shot("fire", c["fire"], c["ocean"] - 1)
def fire(sc):
    C.world_hdri(sc, "industrial_workshop_foundry_1k.hdr", strength=0.15)
    sc.view_settings.exposure = -0.4
    C.cube("floor", (20, 20, 0.02), (0, 0, -0.01), C.pbr("concrete", "concrete_floor_02", scale=0.5))
    brick = C.pbr("brick", "red_brick_03", scale=0.6)
    w1 = C.cube("wall", (8, 0.1, 6), (0, 2.2, 3), brick)
    w2 = C.cube("wall2", (0.1, 8, 6), (-2.6, 0, 3), brick)
    rust = C.pbr("rust", "rusty_metal_02", scale=3, metal=0.7)
    for x in (-0.6, 0.6):
        for y in (-0.45, 0.45):
            C.cyl("leg", 0.03, 0.9, (x, y, 0.45), m=rust, verts=16)
    for y in (-0.45, 0.45):
        C.cyl("bar", 0.025, 1.25, (0, y, 0.9), rot=(0, math.radians(90), 0), m=rust, verts=16)
    for x in (-0.6, 0.6):
        C.cyl("bar", 0.025, 0.95, (x, 0, 0.9), rot=(math.radians(90), 0, 0), m=rust, verts=16)
    for x in (-0.3, 0.0, 0.3):
        C.cyl("burner", 0.05, 0.25, (x, 0.05, 0.13), m=rust, verts=16)
    # the CSMU on the stand, scaled ×2.4 so it reads in the frame
    root, P = recorder.build("rec")
    keep = {P["csmu"].name, P["cap"].name, P["label"].name}
    for part in P["all"]:
        if part.name not in keep:
            part.hide_render = True
    root.scale = (2.4, 2.4, 2.4)
    root.location = (-0.31, 0, 0.75)
    # paint chars over the hour: darken the base colour
    pm = P["paint"].node_tree.nodes["Principled BSDF"]
    for f, col in ((c["fire"], (0.93, 0.18, 0.015, 1)), (c["ocean"], (0.18, 0.06, 0.02, 1))):
        pm.inputs["Base Color"].default_value = col
        pm.inputs["Base Color"].keyframe_insert("default_value", frame=f)
    # Mantaflow fire (same recipe as experiments/blender/firetest.py)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.05, 0.3))
    emitter = bpy.context.object
    emitter.scale = (0.75, 0.42, 0.06)
    bpy.ops.object.select_all(action="DESELECT")
    emitter.select_set(True)
    bpy.context.view_layer.objects.active = emitter
    bpy.ops.object.quick_smoke(style="BOTH", show_flows=False)
    domain = bpy.context.object
    domain.location = (0, 0.05, 1.3)
    domain.scale = (1.0, 0.8, 1.35)
    ds = domain.modifiers["Fluid"].domain_settings
    ds.resolution_max = 96
    ds.cache_type = "ALL"
    ds.use_noise = True
    ds.noise_scale = 2
    ds.noise_strength = 1.2
    ds.flame_vorticity = 1.4
    ds.vorticity = 0.25
    # simulate in the shot's own frames, with 40 frames of warm-up before the cut
    ds.cache_frame_start = c["fire"] - 40
    ds.cache_frame_end = c["ocean"]
    ds.cache_directory = os.path.join(C.ROOT, "out", "bbb_cache", "fire")
    fs = emitter.modifiers["Fluid"].flow_settings
    fs.fuel_amount = 1.4
    fs.temperature = 1.6
    emitter.hide_render = True
    vm = bpy.data.materials.new("FireVolume")
    vm.use_nodes = True
    vn, vl = vm.node_tree.nodes, vm.node_tree.links
    for n in list(vn):
        vn.remove(n)
    out = vn.new("ShaderNodeOutputMaterial")
    pv = vn.new("ShaderNodeVolumePrincipled")
    ad = vn.new("ShaderNodeAttribute")
    ad.attribute_name = "density"
    af = vn.new("ShaderNodeAttribute")
    af.attribute_name = "flame"
    md = vn.new("ShaderNodeMath")
    md.operation = "MULTIPLY"
    md.inputs[1].default_value = 2.5
    vl.new(ad.outputs["Fac"], md.inputs[0])
    vl.new(md.outputs["Value"], pv.inputs["Density"])
    pw = vn.new("ShaderNodeMath")
    pw.operation = "POWER"
    pw.inputs[1].default_value = 1.6
    vl.new(af.outputs["Fac"], pw.inputs[0])
    mf = vn.new("ShaderNodeMath")
    mf.operation = "MULTIPLY"
    mf.inputs[1].default_value = 45
    vl.new(pw.outputs["Value"], mf.inputs[0])
    fr = vn.new("ShaderNodeValToRGB")
    fr.color_ramp.elements[0].color = (0.5, 0.03, 0.0, 1)
    fr.color_ramp.elements[1].color = (1.0, 0.78, 0.3, 1)
    fr.color_ramp.elements.new(0.45).color = (1.0, 0.3, 0.02, 1)
    vl.new(af.outputs["Fac"], fr.inputs["Fac"])
    vl.new(fr.outputs["Color"], pv.inputs["Emission Color"])
    vl.new(mf.outputs["Value"], pv.inputs["Emission Strength"])
    pv.inputs["Color"].default_value = (0.05, 0.045, 0.04, 1)
    vl.new(pv.outputs["Volume"], out.inputs["Volume"])
    domain.data.materials.clear()
    domain.data.materials.append(vm)
    bpy.ops.object.light_add(type="AREA", location=(1.6, -2.4, 2.8))
    key = bpy.context.object
    key.data.energy = 60
    key.data.size = 2.0
    key.rotation_euler = (math.radians(55), 0, math.radians(30))
    bpy.ops.object.light_add(type="POINT", location=(0, -0.2, 0.9))
    fl = bpy.context.object
    fl.data.energy = 140
    fl.data.color = (1.0, 0.45, 0.12)
    cam = C.camera(sc, lens=40, fstop=2.8)
    C.aim(cam, (1.4, -3.4, 1.5), (0, 0, 1.0), frame=c["fire"])
    C.aim(cam, (0.7, -2.6, 1.3), (0, 0, 1.0), frame=c["ocean"])
    C.glare(sc, threshold=0.8, size=7)
    sc["needs_bake"] = domain.name


# ───────────────────────── 7 · the deep: sinking ─────────────────────────
@shot("ocean", c["ocean"], c["underwater"] - 1)
def ocean(sc):
    import random

    rnd = random.Random(9)
    C.world_hdri(sc, None, strength=1.0, color=(0.01, 0.07, 0.11))
    C.world_fog(sc, density=0.06, color=(0.25, 0.6, 0.8), anisotropy=0.75, glow=(0.05, 0.32, 0.5), glow_strength=0.06)
    # a diver's lamp that follows the box down
    bpy.ops.object.light_add(type="SPOT", location=(0.5, -0.9, 0.9))
    lamp = bpy.context.object
    lamp.data.energy = 60
    lamp.data.spot_size = math.radians(40)
    lamp.data.color = (0.85, 0.95, 1.0)
    lt = C.empty("lampT", (0, 0, 0))
    con = lamp.constraints.new("TRACK_TO")
    con.target = lt
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    for f, z in ((c["ocean"], 0.0), (c["underwater"], -2.2)):
        lt.location = (0, 0, z + 0.05)
        lt.keyframe_insert("location", frame=f)
        lamp.location = (0.5, -0.9, z + 0.9)
        lamp.keyframe_insert("location", frame=f)
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 10))
    sun = bpy.context.object
    sun.data.energy = 6
    sun.data.color = (0.6, 0.85, 1.0)
    sun.rotation_euler = (math.radians(8), math.radians(6), 0)
    for f, e in ((c["ocean"], 6), (c["underwater"], 0.6)):  # light fades with depth
        sun.data.energy = e
        sun.data.keyframe_insert("energy", frame=f)
    root, P = recorder.build("rec", wear=0.5)
    # sinking + slow tumble (camera follows; the world drifts up past it)
    for f, z, r in ((c["ocean"], 0, 0), (c["underwater"], -2.2, 40)):
        root.location = (0, 0, z)
        root.rotation_euler = (math.radians(r * 0.4), math.radians(r * 0.2), math.radians(-30 + r))
        root.keyframe_insert("location", frame=f)
        root.keyframe_insert("rotation_euler", frame=f)
    # marine snow
    snow = C.mat("snow", (0.8, 0.9, 1.0), emission=(0.7, 0.85, 1.0), strength=0.15)
    for i in range(500):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.0012 + rnd.random() * 0.0025, subdivisions=1, location=(rnd.uniform(-1.4, 1.4), rnd.uniform(-1.0, 1.6), rnd.uniform(-3.5, 1.2)))
        bpy.context.object.data.materials.append(snow)
    cam = C.camera(sc, lens=40, fstop=2.4)
    C.aim(cam, (0.75, -0.95, 0.5), (0.05, 0, 0.05), frame=c["ocean"])
    C.aim(cam, (0.55, -0.8, -1.85), (0.05, 0, -2.15), frame=c["underwater"])
    C.glare(sc, threshold=1.2, size=6)


# ───────────────────────── 8 · seabed: the beacon pings, then goes silent ─────────────────────────
@shot("seabed", c["underwater"], c["so"] - 1)
def seabed(sc):
    import random

    rnd = random.Random(3)
    C.world_hdri(sc, None, strength=1.0, color=(0.002, 0.015, 0.025))
    C.world_fog(sc, density=0.07, color=(0.2, 0.55, 0.65), anisotropy=0.6, glow=(0.03, 0.22, 0.3), glow_strength=0.05)
    C.cube("sand", (30, 30, 0.02), (0, 0, -0.01), C.pbr("sand", "coast_sand_rocks_02", scale=0.6, bump=1.5))
    rock = C.pbr("rock", "burned_ground_01", scale=2, tint=(0.4, 0.42, 0.4))
    for i in range(14):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.05 + rnd.random() * 0.25, subdivisions=3, location=(rnd.uniform(-3, 3), rnd.uniform(0.3, 5), 0))
        r = bpy.context.object
        r.scale = (1, 0.8 + rnd.random() * 0.4, 0.5 + rnd.random() * 0.3)
        r.data.materials.append(rock)
        bpy.ops.object.shade_smooth()
    root, P = recorder.build("rec", wear=0.6)
    root.location = (0, 0, -0.035)
    root.rotation_euler = (math.radians(4), math.radians(-6), math.radians(-25))
    # a searchlight from above (the ROV / ship) dims after the signal is lost
    bpy.ops.object.light_add(type="SPOT", location=(0.3, -1.2, 2.8))
    sp = bpy.context.object
    sp.data.spot_size = math.radians(40)
    sp.data.spot_blend = 0.6
    sp.data.color = (0.75, 0.95, 1.0)
    import mathutils

    sp.rotation_euler = (mathutils.Vector((0, 0, 0)) - sp.location).to_track_quat("-Z", "Y").to_euler()
    for f, e in ((c["underwater"], 420), (c["silent"], 420), (c["silent"] + 20, 120)):
        sp.data.energy = e
        sp.data.keyframe_insert("energy", frame=f)
    # pings: expanding glowing rings + a pulse of light at the beacon, every 30 frames
    ulb = P["ulb"]
    beacon_world = (0.27 * math.cos(math.radians(-25)), 0.27 * math.sin(math.radians(-25)), 0.07)
    ringm = C.mat("ring", (0.2, 1, 0.6), emission=(0.3, 1.0, 0.7), strength=0)
    bpy.ops.object.light_add(type="POINT", location=beacon_world)
    bl = bpy.context.object
    bl.data.color = (0.4, 1.0, 0.75)
    pings = list(range(c["underwater"], c["silent"], 30))
    for k, f0 in enumerate(pings):
        bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.02, location=beacon_world)
        ring = bpy.context.object
        m = ringm.copy()
        ring.data.materials.append(m)
        pm = m.node_tree.nodes["Principled BSDF"]
        for f, s, e in ((f0 - 1, 0.05, 0), (f0, 0.06, 12), (f0 + 28, 1.1, 0)):
            ring.scale = (s, s, s * 0.5)
            ring.keyframe_insert("scale", frame=f)
            pm.inputs["Emission Strength"].default_value = e
            pm.inputs["Emission Strength"].keyframe_insert("default_value", frame=f)
        for f, e in ((f0 - 1, 0), (f0 + 1, 25), (f0 + 10, 0)):
            bl.data.energy = e
            bl.data.keyframe_insert("energy", frame=f)
    cam = C.camera(sc, lens=35, fstop=2.8)
    C.aim(cam, (0.7, -1.1, 1.1), (0.05, 0, 0.04), frame=c["underwater"])
    C.aim(cam, (-0.2, -1.2, 1.0), (0.05, 0, 0.04), frame=c["silent"])
    C.aim(cam, (-0.5, -1.05, 0.85), (0.05, 0, 0.04), frame=c["so"])
    C.glare(sc, threshold=1.0, size=7)


# ───────────────────────── build + render (one shot at a time) ─────────────────────────
only = [x for x in a.only.split(",") if x] or list(SHOTS)
stills = [int(x) for x in a.stills.split(",") if x]
os.makedirs(a.stills_out, exist_ok=True)
os.makedirs(a.out, exist_ok=True)
for name in only:
    start, end, fn = SHOTS[name]
    want = [f for f in stills if start <= f <= end]
    if not a.render and not want:
        continue
    sc = C.new_scene(name, start, end, res=a.res, samples=a.samples)
    fn(sc)
    print(f"BUILT {name} {start}-{end}", flush=True)
    if "needs_bake" in sc:
        dom = sc.objects[sc["needs_bake"]]
        bpy.context.view_layer.objects.active = dom
        bpy.ops.fluid.bake_all()
        print("BAKED fire", flush=True)
    for f in want:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(a.stills_out, f"s_{f:04d}.jpg")
        bpy.ops.render.render(write_still=True)
        print(f"STILL {f} ({name})", flush=True)
    if a.render:
        sc.render.filepath = os.path.join(a.out, "f_")
        bpy.ops.render.render(animation=True)
        print(f"RENDERED {name}", flush=True)
print("DONE", flush=True)
