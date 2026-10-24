"""Volcano — the 3D sets in Blender (EEVEE). Remotion keeps the magma lab, the blast map and the
height comparison, and adds captions/HUD/sound (composition volcano-blender).

  blender -b -P blender/volcano.py -- --stills 0,200,500 --res 30 --samples 8
  blender -b -P blender/volcano.py -- --render --draft [--chunk 3/8]
  blender -b -P blender/volcano.py -- --render [--chunk 3/8]

Real scale in metres. Mount St. Helens: cone ~1.7 km above its base (summit 2,950 m), lost 400 m;
the north-flank bulge is drawn ~3× its real ~150 m so it reads (as in the Remotion version).
Writes public/vob/flank_track.json (screen position of the bulge for the NORTH FLANK tag).
"""
import argparse
import json
import math
import os
import random
import sys

import bpy
import mathutils
import numpy as np
from bpy_extras.object_utils import world_to_camera_view

sys.path.insert(0, os.path.dirname(__file__))
import common as C  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--stills", default="")
ap.add_argument("--render", action="store_true")
ap.add_argument("--draft", action="store_true")
ap.add_argument("--only", default="")
ap.add_argument("--chunk", default="")
ap.add_argument("--res", type=int, default=100)
ap.add_argument("--samples", type=int, default=48)
ap.add_argument("--stills_out", default=os.path.join(C.ROOT, "out", "stills", "vob"))
a = ap.parse_args(argv)
if a.draft:
    a.res, a.samples = 30, 6
OUT = os.path.join(C.ROOT, "public", "vob", "draft" if a.draft else "frames")

cue = C.Cues("volcano")
c = {
    k: cue.at(v)
    for k, v in {
        "hawaii": "In Hawaii",
        "deg": "1,100",
        "creep": "Some flows",
        "walk": "You could walk",
        "so": "So why did",
        "apart": "itself apart",
        "every": "Every magma",
        "pressure": "The pressure keeps",
        "y1980": "In 1980",
        "north": "north side",
        "slid": "slid away",
        "burst": "burst out",
        "blast": "The blast flattened",
        "danger": "So the danger",
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


# ───────────────────────── shared helpers ─────────────────────────
def fbm(x, y, seed=1, octaves=6, scale=1.0):
    """Cheap fractal noise for heightfields: sums of rotated sine waves (deterministic)."""
    rnd = random.Random(seed)
    z = np.zeros_like(x)
    amp, freq = 1.0, scale
    for _ in range(octaves):
        for _ in range(3):
            ang = rnd.uniform(0, math.pi)
            ph = rnd.uniform(0, 6.3)
            z += amp * np.sin((x * math.cos(ang) + y * math.sin(ang)) * freq + ph) / 3
        amp *= 0.5
        freq *= 2.03
    return z


def heightfield(name, size, n, zfn, keys=()):
    """Grid mesh (size×size m, n×n verts) with z = zfn(X, Y); keys = [(name, zfn)] → shape keys."""
    xs = np.linspace(-size / 2, size / 2, n)
    X, Y = np.meshgrid(xs, xs)
    Z = zfn(X, Y)
    verts = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
    idx = np.arange(n * n).reshape(n, n)
    faces = np.stack([idx[:-1, :-1].ravel(), idx[:-1, 1:].ravel(), idx[1:, 1:].ravel(), idx[1:, :-1].ravel()], 1)
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts.tolist(), [], faces.tolist())
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    for p in me.polygons:
        p.use_smooth = True
    if keys:
        o.shape_key_add(name="Basis")
        for kname, kfn in keys:
            k = o.shape_key_add(name=kname)
            Zk = kfn(X, Y).ravel()
            k.data.foreach_set("co", np.stack([X.ravel(), Y.ravel(), Zk], 1).ravel().tolist())
    return o


def node(nt, kind, **inputs):
    n = nt.nodes.new(kind)
    for k, v in inputs.items():
        if k == "op":
            n.operation = v
        elif k == "blend":
            n.data_type = "RGBA"
            n.blend_type = v
        else:
            n.inputs[k].default_value = v
    return n


def volume_cloud(name, color, density, scale_noise, seed, emission=None, emis_strength=0.0, w_speed=0.0, f0=0, f1=1):
    """Unit cube volume: billowing noise density × spherical falloff (scale the object to shape it).
    W of the 4D noise moves over time so the cloud churns."""
    bpy.ops.mesh.primitive_cube_add(size=2)
    o = bpy.context.object
    o.name = name
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    for n_ in list(nt.nodes):
        nt.nodes.remove(n_)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    pv = node(nt, "ShaderNodeVolumePrincipled", Color=(*color, 1), Anisotropy=0.35)
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.noise_dimensions = "4D"
    nz.inputs["Scale"].default_value = scale_noise
    nz.inputs["Detail"].default_value = 12
    nz.inputs["Roughness"].default_value = 0.62
    nz.inputs["W"].default_value = seed
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    if w_speed:
        nz.inputs["W"].keyframe_insert("default_value", frame=f0)
        nz.inputs["W"].default_value = seed + w_speed * (f1 - f0) / 30
        nz.inputs["W"].keyframe_insert("default_value", frame=f1)
    ln = nt.nodes.new("ShaderNodeVectorMath")
    ln.operation = "LENGTH"
    nt.links.new(tc.outputs["Object"], ln.inputs[0])
    fall = node(nt, "ShaderNodeMapRange", **{"From Min": 0.55, "From Max": 1.0, "To Min": 1.0, "To Max": 0.0})
    nt.links.new(ln.outputs["Value"], fall.inputs["Value"])
    mul = node(nt, "ShaderNodeMath", op="MULTIPLY")
    nt.links.new(nz.outputs["Fac"], mul.inputs[0])
    nt.links.new(fall.outputs["Result"], mul.inputs[1])
    thr = node(nt, "ShaderNodeMapRange", **{"From Min": 0.32, "From Max": 0.62, "To Min": 0.0, "To Max": density})
    nt.links.new(mul.outputs[0], thr.inputs["Value"])
    nt.links.new(thr.outputs["Result"], pv.inputs["Density"])
    if emission:
        pv.inputs["Emission Color"].default_value = (*emission, 1)
        pv.inputs["Emission Strength"].default_value = emis_strength
    nt.links.new(pv.outputs["Volume"], out.inputs["Volume"])
    o.data.materials.append(m)
    return o, pv


def keyframes(ob, path, items, index=-1):
    for f, v in items:
        setattr(ob, path, v)
        ob.keyframe_insert(path, frame=f, index=index)


def export_track(sc, path, points, f0, f1):
    cam = sc.camera
    out = {"from": f0, "points": {k: [] for k in points}}
    for f in range(f0, f1 + 1):
        sc.frame_set(f)
        for k, p in points.items():
            v = world_to_camera_view(sc, cam, mathutils.Vector(p))
            out["points"][k].append(None if v.z <= 0 else [round(v.x * 1080, 1), round((1 - v.y) * 1920, 1)])
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(out, open(path, "w"))


def person(name, loc, m):
    """Dark silhouette hiker (~1.8 m) with a backpack; legs are separate so they can swing."""
    parts = []
    root = C.empty(name, loc)
    torso = C.cyl(f"{name}_torso", 0.19, 0.62, (0, 0, 1.22), m=m, verts=12)
    torso.scale = (1.0, 0.75, 1.0)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(0, 0, 1.68))
    head = bpy.context.object
    head.data.materials.append(m)
    pack = C.cube(f"{name}_pack", (0.32, 0.18, 0.45), (0, 0.2, 1.25), m)
    legs = []
    for dx in (-0.1, 0.1):
        hip = C.empty(f"{name}_hip", (dx, 0, 0.92))
        leg = C.cyl(f"{name}_leg", 0.08, 0.9, (0, 0, -0.45), m=m, verts=8)
        leg.parent = hip
        hip.parent = root
        legs.append(hip)
    for p in (torso, head, pack):
        p.parent = root
    return root, legs


# ───────────────────────── A · lava dome in the crater at night (hook + loop) ─────────────────────────
P0, LOOK0 = (-760, -980, 520), (0, 0, 110)


def dome_material():
    """Dark andesite with incandescent cracks: Voronoi cell edges glow, hotter toward the top."""
    m = C.pbr("dome", "burned_ground_01", scale=0.05, tint=(0.18, 0.16, 0.15))
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = 0.06
    nt.links.new(tc.outputs["Object"], vor.inputs["Vector"])
    nz = node(nt, "ShaderNodeTexNoise", Scale=0.02, Detail=6)
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    edge = node(nt, "ShaderNodeMapRange", **{"From Min": 0.0, "From Max": 0.06, "To Min": 1.0, "To Max": 0.0})
    nt.links.new(vor.outputs["Distance"], edge.inputs["Value"])
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    top = node(nt, "ShaderNodeMapRange", **{"From Min": 40.0, "From Max": 190.0, "To Min": 0.15, "To Max": 1.0})
    nt.links.new(sep.outputs["Z"], top.inputs["Value"])
    m1 = node(nt, "ShaderNodeMath", op="MULTIPLY")
    nt.links.new(edge.outputs["Result"], m1.inputs[0])
    nt.links.new(top.outputs["Result"], m1.inputs[1])
    m2 = node(nt, "ShaderNodeMath", op="MULTIPLY")
    nt.links.new(m1.outputs[0], m2.inputs[0])
    nt.links.new(nz.outputs["Fac"], m2.inputs[1])
    cr = nt.nodes.new("ShaderNodeValToRGB")
    els = cr.color_ramp.elements
    els[0].position, els[0].color = 0.08, (0, 0, 0, 1)
    els[1].position, els[1].color = 0.55, (1.0, 0.55, 0.12, 1)
    mid = els.new(0.25)
    mid.color = (0.55, 0.06, 0.01, 1)
    nt.links.new(m2.outputs[0], cr.inputs["Fac"])
    nt.links.new(cr.outputs["Color"], p.inputs["Emission Color"])
    p.inputs["Emission Strength"].default_value = 18.0
    return m


def crater_z(X, Y):
    r = np.hypot(X, Y)
    rim = 320 * np.exp(-((r - 1050) / 380) ** 2)  # crater wall
    floor = -40 + 0.00002 * r**2
    outside = 320 - 0.12 * np.clip(r - 1200, 0, None)
    z = np.where(r < 1050, np.maximum(floor, rim), np.maximum(outside, rim))
    dome = 190 * np.clip(1 - (r / 380) ** 2, 0, None) ** 0.6
    z = np.maximum(z, dome - 30)
    return z + 18 * fbm(X, Y, seed=3, scale=1 / 120) + 4 * fbm(X, Y, seed=4, scale=1 / 18)


def dome(sc, outro=False):
    f0, f1 = (0, c["hawaii"] - 1) if not outro else (c["danger"], END)
    C.night_sky(sc, strength=1.2)
    ter = heightfield("crater", 4200, 360, crater_z)
    rock = C.pbr("crater_rock", "burned_ground_01", scale=0.04, tint=(0.32, 0.29, 0.27))
    ter.data.materials.append(rock)
    # the dome itself: a finer mesh with glowing cracks
    dm = heightfield("dome", 900, 260, lambda X, Y: np.where(np.hypot(X, Y) < 440, crater_z(X, Y) + 1.5, -200))
    dm.data.materials.append(dome_material())
    # steam rising off the dome, lit from below
    st, pv = volume_cloud("steam", (0.85, 0.82, 0.8), 0.006, 1.2, seed=2.0, w_speed=0.08, f0=f0, f1=f1)
    st.location, st.scale = (40, 30, 560), (380, 380, 420)
    keyframes(st, "location", [(f0, (40, 30, 540)), (f1, (60, 40, 600))])
    bpy.ops.object.light_add(type="POINT", location=(0, 0, 260))
    glow = bpy.context.object
    glow.data.energy = 4.0e7
    glow.data.color = (1.0, 0.42, 0.12)
    glow.data.shadow_soft_size = 120
    cam = C.camera(sc, lens=38, fstop=None)
    cam.data.clip_end = 20000
    if not outro:
        C.aim(cam, P0, LOOK0, frame=0)
        C.aim(cam, (-640, -840, 470), (0, 0, 100), frame=f1)
    else:
        C.aim(cam, (-560, -760, 430), (0, 0, 100), frame=f0)
        C.aim(cam, P0, LOOK0, frame=END)
    C.glare(sc, threshold=1.0, size=7, strength=0.9)


shot("dome_in", 0, c["hawaii"] - 1)(lambda sc: dome(sc))
shot("dome_out", c["danger"], END)(lambda sc: dome(sc, outro=True))


# ───────────────────────── B · Hawaii: a lava river at night, a hiker walks away ─────────────────────────
def lava_material(f0, f1):
    """Moving crust plates (dark) with white-hot seams; the pattern drifts downstream (+X)."""
    m = bpy.data.materials.new("lava")
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (0.03, 0.02, 0.02, 1)
    p.inputs["Roughness"].default_value = 0.8
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    mp.inputs["Location"].default_value = (0, 0, 0)
    mp.inputs["Location"].keyframe_insert("default_value", frame=f0)
    mp.inputs["Location"].default_value = (-1.2 * (f1 - f0) / 30, 0, 0)
    mp.inputs["Location"].keyframe_insert("default_value", frame=f1)
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = 0.35
    nt.links.new(mp.outputs["Vector"], vor.inputs["Vector"])
    nz = node(nt, "ShaderNodeTexNoise", Scale=0.15, Detail=8)
    nt.links.new(mp.outputs["Vector"], nz.inputs["Vector"])
    edge = node(nt, "ShaderNodeMapRange", **{"From Min": 0.0, "From Max": 0.12, "To Min": 1.0, "To Max": 0.0})
    nt.links.new(vor.outputs["Distance"], edge.inputs["Value"])
    add = node(nt, "ShaderNodeMath", op="ADD")
    nt.links.new(edge.outputs["Result"], add.inputs[0])
    sub = node(nt, "ShaderNodeMath", op="MULTIPLY")
    sub.inputs[1].default_value = 0.45
    nt.links.new(nz.outputs["Fac"], sub.inputs[0])
    nt.links.new(sub.outputs[0], add.inputs[1])
    cr = nt.nodes.new("ShaderNodeValToRGB")
    els = cr.color_ramp.elements
    els[0].position, els[0].color = 0.25, (0.01, 0.0, 0.0, 1)
    els[1].position, els[1].color = 1.1 / 1.45, (1.0, 0.8, 0.35, 1)
    e2 = els.new(0.4)
    e2.color = (0.4, 0.03, 0.0, 1)
    e3 = els.new(0.55)
    e3.color = (1.0, 0.3, 0.03, 1)
    rng = node(nt, "ShaderNodeMapRange", **{"From Min": 0.0, "From Max": 1.45})
    nt.links.new(add.outputs[0], rng.inputs["Value"])
    nt.links.new(rng.outputs["Result"], cr.inputs["Fac"])
    nt.links.new(cr.outputs["Color"], p.inputs["Emission Color"])
    p.inputs["Emission Strength"].default_value = 14.0
    bump = node(nt, "ShaderNodeBump", Strength=0.6)
    nt.links.new(edge.outputs["Result"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    return m


@shot("hawaii", c["hawaii"], c["so"] - 1)
def hawaii(sc):
    f0, f1 = c["hawaii"], c["so"] - 1
    C.night_sky(sc, strength=0.8)
    C.world_fog(sc, density=0.0025, color=(1.0, 0.6, 0.4), anisotropy=0.5)

    def ground(X, Y):
        chan = np.exp(-((Y - 6 * np.sin(X / 23)) / 7.5) ** 2)
        return 1.4 * fbm(X, Y, seed=7, scale=1 / 9) + 0.25 * fbm(X, Y, seed=8, scale=1.3) + 1.6 * np.exp(-((np.abs(Y - 6 * np.sin(X / 23)) - 7.5) / 2.5) ** 2) - 1.2 * chan

    ter = heightfield("basalt", 260, 420, ground)
    ter.data.materials.append(C.pbr("basalt", "burned_ground_01", scale=0.35, tint=(0.14, 0.13, 0.13)))
    riv = heightfield("lava", 260, 300, lambda X, Y: np.where(np.abs(Y - 6 * np.sin(X / 23)) < 6.4, -0.55 + 0.15 * fbm(X, Y, seed=9, scale=0.4), -5))
    riv.data.materials.append(lava_material(f0, f1))
    # glow the river throws on the levees and the hiker (EEVEE emission doesn't light the scene)
    for x in range(-60, 130, 18):
        bpy.ops.object.light_add(type="AREA", location=(x, 6 * math.sin(x / 23), 3.0))
        L = bpy.context.object
        L.data.shape = "RECTANGLE"
        L.data.size, L.data.size_y = 18, 10
        L.data.energy = 1.8e5
        L.data.color = (1.0, 0.38, 0.1)
        L.rotation_euler = (math.pi, 0, 0)  # facing up: lights the steam and the hiker from below/side
        L.data.specular_factor = 0.3
    for x in range(-60, 130, 18):
        bpy.ops.object.light_add(type="POINT", location=(x, 6 * math.sin(x / 23), 1.5))
        L = bpy.context.object
        L.data.energy = 6.0e4
        L.data.color = (1.0, 0.35, 0.08)
        L.data.shadow_soft_size = 4
    st, _ = volume_cloud("fumes", (0.9, 0.8, 0.75), 0.05, 0.08, seed=5.0, w_speed=0.15, f0=f0, f1=f1)
    st.location, st.scale = (40, 0, 8), (90, 14, 9)
    dark = C.mat("hiker", (0.015, 0.015, 0.017), rough=0.7)
    hk, legs = person("hiker", (14, -13.5, 0.4), dark)
    hk.rotation_euler = (0, 0, math.radians(-100))
    # stands watching the river, then walks away (away from camera, along the bank)
    keyframes(hk, "location", [(f0, (14, -13.5, 0.4)), (c["walk"] - 4, (14, -13.5, 0.4)), (f1, (14 + 1.4 * (f1 - c["walk"] + 4) / 30, -15.5, 0.6))])
    for f in range(c["walk"] - 4, f1 + 1, 8):
        for i, hip in enumerate(legs):
            hip.rotation_euler = (math.radians(24) * math.sin((f - c["walk"]) * 0.39 + i * math.pi), 0, 0)
            hip.keyframe_insert("rotation_euler", frame=f, index=0)
    cam = C.camera(sc, lens=30, fstop=4.0)
    cam.data.clip_end = 2000
    C.aim(cam, (-6, -24, 2.2), (40, 2, 0.5), frame=f0)
    C.aim(cam, (0, -23, 2.4), (44, 0, 0.5), frame=c["walk"])
    C.aim(cam, (4, -22.5, 2.6), (40, -4, 0.8), frame=f1)
    cam.data.dof.focus_distance = 22
    C.glare(sc, threshold=1.0, size=7, strength=0.9)


# ───────────────────────── C/E · Mount St. Helens: calm, swelling, collapse, lateral blast ─────────────────────────
HC = 1700.0  # cone height above its base (summit 2,950 m; base ~1,250 m)


def cone(X, Y):
    r = np.hypot(X, Y)
    ang = np.arctan2(Y, X)
    gullies = (25 + 0.04 * np.clip(4000 - r, 0, None)) * np.sin(ang * 23 + 0.6 * fbm(X, Y, seed=2, scale=1 / 900)) * np.clip(r / 900, 0, 1)
    body = HC * np.clip(1 - r / 7200, 0, None) ** 1.75
    top = -260 * np.exp(-(r / 520) ** 2) * 0  # rounded summit (pre-1980 it had no crater)
    hills = 120 * fbm(X, Y, seed=11, scale=1 / 2600) * np.clip((r - 5000) / 3000, 0, 1)
    lake = -160 * np.exp(-(np.hypot(X - 600, Y - 8200) / 1600) ** 4)  # Spirit Lake basin, north
    return body + top + gullies * np.clip(1 - r / 7200, 0, 1) + hills + lake + 14 * fbm(X, Y, seed=12, scale=1 / 140)


def bulged(X, Y):
    return cone(X, Y) + 420 * np.exp(-(((X) / 1300) ** 2 + ((Y - 2100) / 1100) ** 2))


def collapsed(X, Y):
    z = cone(X, Y)
    r = np.hypot(X, Y)
    north = np.clip((Y / np.maximum(r, 1) - 0.25) / 0.45, 0, 1)
    crater = np.minimum(z, HC - 400 - 0.0002 * np.maximum(0, 1800 - r) ** 2 * 0 + 0 * r)
    crater = np.where(r < 1900, np.minimum(z, HC - 400 - 600 * np.exp(-(r / 900) ** 2)), z)
    cut = crater - north * 900 * np.clip(1 - r / 4200, 0, 1) ** 1.2
    deposit = 70 * np.clip((Y - 4200) / 1500, 0, 1) * np.exp(-((X - 300) / 2600) ** 2) * (1 + 0.5 * fbm(X, Y, seed=13, scale=1 / 300))
    return np.maximum(cut, cone(X, Y) * 0 - 50) + deposit


def mountain_material():
    """Snow above ~1,050 m (patchy edge), bare rock on steep parts, forest below, ash after the blast."""
    m = bpy.data.materials.new("mountain")
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs["Vector"])
    nsep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(geo.outputs["Normal"], nsep.inputs["Vector"])
    nz = node(nt, "ShaderNodeTexNoise", Scale=0.004, Detail=10)
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    zn = node(nt, "ShaderNodeMath", op="ADD")
    nt.links.new(sep.outputs["Z"], zn.inputs[0])
    nzs = node(nt, "ShaderNodeMath", op="MULTIPLY")
    nzs.inputs[1].default_value = 420
    nt.links.new(nz.outputs["Fac"], nzs.inputs[0])
    nt.links.new(nzs.outputs[0], zn.inputs[1])
    snow = node(nt, "ShaderNodeMapRange", **{"From Min": 1180.0, "From Max": 1260.0})
    nt.links.new(zn.outputs[0], snow.inputs["Value"])
    forest = node(nt, "ShaderNodeMapRange", **{"From Min": 900.0, "From Max": 760.0})
    nt.links.new(zn.outputs[0], forest.inputs["Value"])
    steep = node(nt, "ShaderNodeMapRange", **{"From Min": 0.86, "From Max": 0.74})
    nt.links.new(nsep.outputs["Z"], steep.inputs["Value"])
    rock_tex = nt.nodes.new("ShaderNodeTexImage")
    rock_tex.image = bpy.data.images.load(os.path.join(C.TEX, "coast_sand_rocks_02_diff.jpg"), check_existing=True)
    rock_tex.projection = "BOX"
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (0.004, 0.004, 0.004)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], rock_tex.inputs["Vector"])
    rock = node(nt, "ShaderNodeMix", blend="MULTIPLY", Factor=1.0)
    rock.inputs[7].default_value = (0.42, 0.38, 0.35, 1)
    nt.links.new(rock_tex.outputs["Color"], rock.inputs[6])
    fz = node(nt, "ShaderNodeTexNoise", Scale=0.02, Detail=8)
    nt.links.new(tc.outputs["Object"], fz.inputs["Vector"])
    fcol = nt.nodes.new("ShaderNodeValToRGB")
    fe = fcol.color_ramp.elements
    fe[0].color, fe[1].color = (0.012, 0.03, 0.012, 1), (0.04, 0.07, 0.03, 1)
    nt.links.new(fz.outputs["Fac"], fcol.inputs["Fac"])
    c1 = node(nt, "ShaderNodeMix", blend="MIX")
    nt.links.new(forest.outputs["Result"], c1.inputs["Factor"])
    nt.links.new(rock.outputs[2], c1.inputs[6])
    nt.links.new(fcol.outputs["Color"], c1.inputs[7])
    snow_steep = node(nt, "ShaderNodeMath", op="MULTIPLY")
    inv = node(nt, "ShaderNodeMath", op="SUBTRACT")
    inv.inputs[0].default_value = 1.0
    nt.links.new(steep.outputs["Result"], inv.inputs[1])
    nt.links.new(snow.outputs["Result"], snow_steep.inputs[0])
    nt.links.new(inv.outputs[0], snow_steep.inputs[1])
    s_amt = node(nt, "ShaderNodeMath", op="MAXIMUM")
    nt.links.new(snow_steep.outputs[0], s_amt.inputs[0])
    sx = node(nt, "ShaderNodeMath", op="MULTIPLY")
    sx.inputs[1].default_value = 0.6
    nt.links.new(snow.outputs["Result"], sx.inputs[0])
    nt.links.new(sx.outputs[0], s_amt.inputs[1])
    c2 = node(nt, "ShaderNodeMix", blend="MIX")
    c2.inputs[7].default_value = (0.86, 0.88, 0.92, 1)
    nt.links.new(s_amt.outputs[0], c2.inputs["Factor"])
    nt.links.new(c1.outputs[2], c2.inputs[6])
    # ash: the north sector greys out after the blast (Value "ash" keyframed 0→1)
    ash = nt.nodes.new("ShaderNodeValue")
    ash.name = "ash"
    ash.outputs[0].default_value = 0.0
    northm = node(nt, "ShaderNodeMapRange", **{"From Min": 600.0, "From Max": 2500.0})
    nt.links.new(sep.outputs["Y"], northm.inputs["Value"])
    am = node(nt, "ShaderNodeMath", op="MULTIPLY")
    nt.links.new(northm.outputs["Result"], am.inputs[0])
    nt.links.new(ash.outputs[0], am.inputs[1])
    c3 = node(nt, "ShaderNodeMix", blend="MIX")
    c3.inputs[7].default_value = (0.3, 0.29, 0.28, 1)
    nt.links.new(am.outputs[0], c3.inputs["Factor"])
    nt.links.new(c2.outputs[2], c3.inputs[6])
    nt.links.new(c3.outputs[2], p.inputs["Base Color"])
    rough = node(nt, "ShaderNodeMapRange", **{"To Min": 0.95, "To Max": 0.55})
    nt.links.new(s_amt.outputs[0], rough.inputs["Value"])
    nt.links.new(rough.outputs["Result"], p.inputs["Roughness"])
    bump = node(nt, "ShaderNodeBump", Strength=0.35)
    nt.links.new(fz.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    return m, ash


H_CAM = ((-21500, -2600, 2300), (0, 600, 900))  # from the west: north flank on the left


def helens(sc, part):
    f0, f1 = (c["so"], c["every"] - 1) if part == "a" else (c["pressure"], c["blast"] - 1)
    C.world_hdri(sc, "kloppenheim_06_puresky_2k.hdr", strength=1.1, rotation=math.radians(200))
    C.world_fog(sc, density=0.000022, color=(0.65, 0.75, 0.9), anisotropy=0.2)
    sc.eevee.volumetric_start = 800
    sc.eevee.volumetric_end = 70000
    ter = heightfield("helens", 34000, 520, cone, keys=(("bulge", bulged), ("collapse", collapsed)))
    mm, ash = mountain_material()
    ter.data.materials.append(mm)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(600, 8200, -95))
    lake = bpy.context.object
    lake.scale = (4200, 3000, 1)
    lake.data.materials.append(C.mat("lake", (0.02, 0.05, 0.07), rough=0.08))
    bpy.ops.object.light_add(type="SUN")
    sun = bpy.context.object
    sun.data.energy = 4.2
    sun.data.angle = math.radians(1.0)
    sun.rotation_euler = (math.radians(52), 0, math.radians(35))  # morning sun from the south-east
    cam = C.camera(sc, lens=34, fstop=None)
    cam.data.clip_end = 120000
    if part == "a":
        C.aim(cam, (-23500, -3000, 2200), (0, 600, 1000), frame=f0)
        C.aim(cam, (-21500, -2600, 2300), (0, 600, 900), frame=f1)
        sc["flank"] = False
        return
    kb = ter.data.shape_keys.key_blocks
    keyframes(kb["bulge"], "value", [(f0, 0.0), (c["y1980"] + 6, 1.0), (c["slid"] - 4, 1.0), (c["slid"] + 10, 0.0)])
    keyframes(kb["collapse"], "value", [(c["slid"] - 4, 0.0), (c["slid"] + 26, 1.0)])
    av = ash.outputs[0]
    for f, v in ((c["burst"] + 4, 0.0), (f1, 1.0)):
        av.default_value = v
        av.keyframe_insert("default_value", frame=f)
    # landslide dust (brown) racing north down the flank
    dust, _ = volume_cloud("dust", (0.45, 0.36, 0.28), 0.0035, 1.4, seed=7.0, w_speed=0.25, f0=c["slid"], f1=f1)
    keyframes(dust, "location", [(c["slid"], (0, 1600, 900)), (c["slid"] + 30, (200, 4800, 450)), (f1, (300, 7500, 400))])
    keyframes(dust, "scale", [(c["slid"] - 1, (1, 1, 1)), (c["slid"], (900, 900, 500)), (f1, (3200, 3600, 900))])
    # lateral blast: a dark, ground-hugging surge north; then the vertical ash column
    surge, sp = volume_cloud("surge", (0.22, 0.2, 0.19), 0.006, 1.6, seed=3.0, w_speed=0.35, f0=c["burst"], f1=f1, emission=(1.0, 0.35, 0.1), emis_strength=0.0)
    keyframes(surge, "location", [(c["burst"], (0, 1200, 1200)), (f1, (400, 7200, 1100))])
    keyframes(surge, "scale", [(c["burst"] - 1, (1, 1, 1)), (c["burst"], (700, 700, 600)), (c["burst"] + 18, (3000, 3600, 1300)), (f1, (6000, 7000, 1700))])
    for f, e in ((c["burst"], 0.0), (c["burst"] + 3, 0.004), (c["burst"] + 16, 0.0)):  # hot core flash
        sp.inputs["Emission Strength"].default_value = e
        sp.inputs["Emission Strength"].keyframe_insert("default_value", frame=f)
    col, _ = volume_cloud("column", (0.42, 0.4, 0.38), 0.005, 1.3, seed=9.0, w_speed=0.2, f0=c["burst"], f1=f1)
    keyframes(col, "location", [(c["burst"] + 6, (0, 700, 2000)), (f1, (0, 1100, 5200))])
    keyframes(col, "scale", [(c["burst"] + 5, (1, 1, 1)), (c["burst"] + 6, (800, 800, 900)), (f1, (2600, 2600, 4200))])
    # camera: same view as part a, eases north at "slid away", shakes and pulls back on the blast
    C.aim(cam, H_CAM[0], H_CAM[1], frame=f0)
    C.aim(cam, (-21800, -2300, 2300), (0, 1200, 900), frame=c["slid"])
    C.aim(cam, (-22200, -1500, 2350), (0, 2600, 1100), frame=c["burst"])
    for i, f in enumerate(range(c["burst"] + 2, c["burst"] + 14, 4)):  # ≤ 3 swings
        C.aim(cam, (-22400 - 200 * i, -1400, 2400 + (60 if i % 2 else -60) * (1 - i / 3)), (0, 2700, 1200 + (40 if i % 2 else -40)), frame=f)
    C.aim(cam, (-27000, -1000, 2900), (0, 2800, 2200), frame=f1)
    sc["flank"] = True


shot("helens_a", c["so"], c["every"] - 1)(lambda sc: helens(sc, "a"))
shot("helens_b", c["pressure"], c["blast"] - 1)(lambda sc: helens(sc, "b"))


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
    fn(sc)
    print(f"BUILT {name} {start}-{end}", flush=True)
    if sc.get("flank"):
        export_track(sc, os.path.join(C.ROOT, "public", "vob", "flank_track.json"), {"flank": (0, 2300, 1350)}, start, end)
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
