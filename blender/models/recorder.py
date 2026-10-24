"""Modern solid-state flight data recorder (SSFDR style), built from photos of real units:

- rear: long orange electronics chassis with screw heads and a data plate
- front-top: horizontal orange cylinder = the crash-survivable memory unit (CSMU), wrapped in a
  white label "FLIGHT RECORDER / DO NOT OPEN"
- very front: the underwater locator beacon (ULB): black body, silver end cap, two straps
- everything on an orange mounting tray with front hooks; round connectors at the back

Real size in metres (≈ 0.5 m long). Origin = centre of the tray underside, +X = front.
build(...) returns the root empty; parts are named so shots can animate them:
  rec.chassis, rec.csmu, rec.csmu_cap, rec.board, rec.ulb, rec.tray
"""
import math
import os

import bpy
import bmesh

from common import cube, cyl, empty, mat, paint, parent, ROOT

LABEL_PNG = os.path.join(ROOT, "blender", "assets", "csmu_label.png")
PLATE_PNG = os.path.join(ROOT, "blender", "assets", "data_plate.png")


def curved_label(name, radius, length, arc_deg, m):
    """Partial cylinder (axis = X) with UVs 0..1, centred on the +Y… facing side (−Y = camera side)."""
    bm = bmesh.new()
    seg_u, seg_v = 48, 2
    verts = []
    a0 = math.radians(180 - arc_deg / 2)  # centred on −Y: (y, z) = (r·cos a, r·sin a), a = 180° → y = −r
    for j in range(seg_v + 1):
        x = -length / 2 + length * j / seg_v
        row = []
        for i in range(seg_u + 1):
            a = a0 + math.radians(arc_deg) * i / seg_u
            row.append(bm.verts.new((x, radius * math.cos(a), radius * math.sin(a))))
        verts.append(row)
    uv = bm.loops.layers.uv.new("UVMap")
    for j in range(seg_v):
        for i in range(seg_u):
            f = bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
            for loop, (uu, vv) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                # text runs along the cylinder axis (x), letters stack around the circumference
                loop[uv].uv = (vv / seg_v, 1 - uu / seg_u)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    return o


def build(name="Recorder", wear=0.0):
    # "international orange": saturated red-orange (the salmon tone read as plastic)
    orange = paint(f"{name}_paint", (0.72, 0.05, 0.003), rough=0.33, grime=0.18 + wear * 0.4)
    dark = mat(f"{name}_dark", (0.03, 0.03, 0.035), rough=0.45, metal=0.3)
    steel = mat(f"{name}_steel", (0.75, 0.75, 0.78), rough=0.25, metal=1.0)
    olive = mat(f"{name}_olive", (0.12, 0.13, 0.09), rough=0.55, metal=0.4)
    from common import image_mat

    label_m = image_mat(f"{name}_label", LABEL_PNG, rough=0.3)
    plate_m = image_mat(f"{name}_plate", PLATE_PNG, rough=0.25)
    plate_m.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 0.6

    parts = []
    # mounting tray
    tray = cube(f"{name}_tray", (0.52, 0.135, 0.012), (0.0, 0, 0.006), orange, bevel=0.002)
    parts.append(tray)
    for y in (-0.05, 0.05):  # front hooks
        parts.append(cube(f"{name}_hook", (0.03, 0.012, 0.03), (0.265, y, 0.018), orange, bevel=0.003))
    # electronics chassis (rear)
    chassis = cube(f"{name}_chassis", (0.30, 0.125, 0.16), (-0.1, 0, 0.012 + 0.08), orange, bevel=0.004)
    parts.append(chassis)
    # screw heads on top (2 rows) and on the side
    for i in range(5):
        for y in (-0.045, 0.045):
            parts.append(cyl(f"{name}_screw", 0.0042, 0.002, (-0.23 + i * 0.065, y, 0.173), m=steel, verts=16))
    # data plate on the side (−Y faces the camera in most shots)
    # a plane (not a cube) so the plate texture keeps its UV orientation: upright, facing −Y
    bpy.ops.mesh.primitive_plane_add(size=1, location=(-0.06, -0.0632, 0.125), rotation=(math.radians(90), 0, 0))
    plate = bpy.context.object
    plate.name = f"{name}_dataplate"
    plate.scale = (0.11, 0.05, 1)
    plate.data.materials.append(plate_m)
    parts.append(plate)
    # rear connectors
    for z in (0.06, 0.12):
        c = cyl(f"{name}_conn", 0.018, 0.03, (-0.265, 0.03, z), rot=(0, math.radians(90), 0), m=olive, verts=24, bevel=0.002)
        parts.append(c)
    # CSMU cylinder (front-top), axis along X
    csmu = cyl(f"{name}_csmu", 0.058, 0.16, (0.13, 0, 0.012 + 0.058 + 0.002), rot=(0, math.radians(90), 0), m=orange, bevel=0.004)
    parts.append(csmu)
    cap = cyl(f"{name}_csmu_cap", 0.06, 0.014, (0.215, 0, 0.072), rot=(0, math.radians(90), 0), m=orange, bevel=0.003)
    parts.append(cap)
    # saddle straps holding the CSMU
    for x in (0.08, 0.18):
        parts.append(cube(f"{name}_saddle", (0.012, 0.13, 0.03), (x, 0, 0.026), orange, bevel=0.002))
    label = curved_label(f"{name}_label", 0.0592, 0.13, 150, label_m)
    label.location = (0.13, 0, 0.072)
    parts.append(label)
    # memory board inside the CSMU (shown when opened)
    pcb = mat(f"{name}_pcb", (0.02, 0.22, 0.08), rough=0.4)
    board = cube(f"{name}_board", (0.12, 0.05, 0.004), (0.13, 0, 0.072), pcb)
    chip_m = mat(f"{name}_chip", (0.02, 0.02, 0.02), rough=0.3)
    chips = [cube(f"{name}_chip", (0.018, 0.014, 0.003), (0.09 + i * 0.026, 0, 0.0755), chip_m) for i in range(4)]
    parent(chips, board)
    board.hide_render = True  # revealed by the cutaway shot
    for ch in chips:
        ch.hide_render = True
    parts.append(board)
    # ULB: black body + silver end cap + straps, mounted at the very front
    ulb_body = cyl(f"{name}_ulb", 0.017, 0.085, (0.265, 0, 0.072), rot=(0, math.radians(90), 0), m=dark, verts=32, bevel=0.002)
    ulb_cap = cyl(f"{name}_ulbcap", 0.0175, 0.018, (0.314, 0, 0.072), rot=(0, math.radians(90), 0), m=steel, verts=32, bevel=0.002)
    for x in (0.245, 0.29):
        parts.append(cube(f"{name}_ulbstrap", (0.008, 0.04, 0.042), (x, 0, 0.072), dark, bevel=0.002))
    parts += [ulb_body, ulb_cap]

    root = empty(name)
    parent(parts, root)
    root["parts"] = [p.name for p in parts]
    return root, {"chassis": chassis, "csmu": csmu, "cap": cap, "board": board, "chips": chips, "ulb": ulb_body, "tray": tray, "label": label, "all": parts, "paint": orange, "pcb": pcb}
