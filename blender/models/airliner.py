"""Procedural twin-engine narrow-body airliner (A320/737 class), ~38 m long, built in metres.

+X = nose, Z up. Smooth lofted fuselage (cross-sections), swept wings and stabilisers with an
airfoil thickness, under-wing engines with nacelles, a window band + cockpit windows as an
emissive/dark texture, and a tail section whose skin can be faded to show what's inside.

build(name) → (root, parts) with parts["skin"] (fuselage), parts["tailskin"] (rear 9 m),
parts["wings"], parts["engines"], parts["fin"].
"""
import math

import bmesh
import bpy

from common import empty, mat, parent

L = 38.0  # fuselage length
R = 1.95  # fuselage radius


def fuselage_radius(t):
    """t = 0 tail … 1 nose. Rounded nose, long cylindrical middle, upswept tapered tail."""
    if t > 0.9:  # nose
        k = (t - 0.9) / 0.1
        return R * math.sqrt(max(0.0, 1 - k ** 2.2))
    if t < 0.22:  # tail cone
        k = (0.22 - t) / 0.22
        return R * (1 - 0.82 * k ** 1.3)
    return R


def fuselage_z(t):
    """centre-line height: tail cone sweeps up so the underside rises toward the tail."""
    if t < 0.22:
        k = (0.22 - t) / 0.22
        return 0.9 * k ** 1.5
    return 0.0


def loft(name, t0, t1, m, rings=80, seg=48):
    bm = bmesh.new()
    rows = []
    for i in range(rings + 1):
        t = t0 + (t1 - t0) * i / rings
        x = -L / 2 + L * t
        r = max(fuselage_radius(t), 0.02)
        z0 = fuselage_z(t)
        row = []
        for j in range(seg):
            a = 2 * math.pi * j / seg
            # slightly taller than wide, like real fuselages
            row.append(bm.verts.new((x, r * math.cos(a), z0 + r * 1.04 * math.sin(a))))
        rows.append(row)
    uv = bm.loops.layers.uv.new("UVMap")
    for i in range(rings):
        for j in range(seg):
            jn = (j + 1) % seg
            f = bm.faces.new((rows[i][j], rows[i][jn], rows[i + 1][jn], rows[i + 1][j]))
            for loop, (a, b) in zip(f.loops, ((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j))):
                loop[uv].uv = (t0 + (t1 - t0) * a / rings, b / seg)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(m)
    return o


def wing_mesh(name, span, root_chord, tip_chord, sweep, dihedral, thick, m, mirror=True):
    """Trapezoid wing with a symmetric airfoil-ish thickness; root at y=0 extending to +y."""
    bm = bmesh.new()
    n_span, n_chord = 12, 16
    grid_top, grid_bot = [], []
    for i in range(n_span + 1):
        s = i / n_span
        chord = root_chord + (tip_chord - root_chord) * s
        le_x = -math.tan(sweep) * span * s
        y = span * s
        zoff = math.tan(dihedral) * y
        top, bot = [], []
        for j in range(n_chord + 1):
            c = j / n_chord
            x = le_x - c * chord
            th = thick * chord * 5 * (0.2969 * math.sqrt(c) - 0.126 * c - 0.3516 * c * c + 0.2843 * c ** 3 - 0.1036 * c ** 4)
            top.append(bm.verts.new((x, y, zoff + th)))
            bot.append(bm.verts.new((x, y, zoff - th)))
        grid_top.append(top)
        grid_bot.append(bot)
    for i in range(n_span):
        for j in range(n_chord):
            bm.faces.new((grid_top[i][j], grid_top[i + 1][j], grid_top[i + 1][j + 1], grid_top[i][j + 1]))
            bm.faces.new((grid_bot[i][j], grid_bot[i][j + 1], grid_bot[i + 1][j + 1], grid_bot[i + 1][j]))
    # tip cap
    for j in range(n_chord):
        bm.faces.new((grid_top[-1][j], grid_top[-1][j + 1], grid_bot[-1][j + 1], grid_bot[-1][j]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(m)
    if mirror:
        mm = o.modifiers.new("mirror", "MIRROR")
        mm.use_axis = (False, True, False)
    return o


def window_texture_mat(name, paint):
    """Fuselage paint with a dark window band (procedural: a wave texture masked to a stripe)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*paint, 1)
    p.inputs["Roughness"].default_value = 0.28
    p.inputs["Metallic"].default_value = 0.15
    if "Coat Weight" in p.inputs:
        p.inputs["Coat Weight"].default_value = 0.4
    # windows live in UV: u along the length, v around; the band is at v ≈ 0.27 / 0.73 (both sides)
    uvn = nt.nodes.new("ShaderNodeUVMap")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(uvn.outputs["UV"], sep.inputs["Vector"])
    # window pitch along the length: sin wave → squares
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = 2 * math.pi * 70
    nt.links.new(sep.outputs["X"], mul.inputs[0])
    sin = nt.nodes.new("ShaderNodeMath")
    sin.operation = "SINE"
    nt.links.new(mul.outputs["Value"], sin.inputs[0])
    gt = nt.nodes.new("ShaderNodeMath")
    gt.operation = "GREATER_THAN"
    gt.inputs[1].default_value = 0.25
    nt.links.new(sin.outputs["Value"], gt.inputs[0])
    # band in v (|v - 0.27| < 0.012) on the −Y side (v ≈ 0.75 is +Y side because a = 2πv)
    band = None
    for centre in (0.27, 0.73):
        sub = nt.nodes.new("ShaderNodeMath")
        sub.operation = "SUBTRACT"
        sub.inputs[1].default_value = centre
        nt.links.new(sep.outputs["Y"], sub.inputs[0])
        ab = nt.nodes.new("ShaderNodeMath")
        ab.operation = "ABSOLUTE"
        nt.links.new(sub.outputs["Value"], ab.inputs[0])
        lt = nt.nodes.new("ShaderNodeMath")
        lt.operation = "LESS_THAN"
        lt.inputs[1].default_value = 0.011
        nt.links.new(ab.outputs["Value"], lt.inputs[0])
        if band is None:
            band = lt
        else:
            mx = nt.nodes.new("ShaderNodeMath")
            mx.operation = "MAXIMUM"
            nt.links.new(band.outputs["Value"], mx.inputs[0])
            nt.links.new(lt.outputs["Value"], mx.inputs[1])
            band = mx
    # only between the doors (u 0.22 … 0.86)
    inside = nt.nodes.new("ShaderNodeMapRange")
    inside.inputs["From Min"].default_value = 0.22
    inside.inputs["From Max"].default_value = 0.23
    nt.links.new(sep.outputs["X"], inside.inputs["Value"])
    inside2 = nt.nodes.new("ShaderNodeMapRange")
    inside2.inputs["From Min"].default_value = 0.86
    inside2.inputs["From Max"].default_value = 0.85
    nt.links.new(sep.outputs["X"], inside2.inputs["Value"])
    m1 = nt.nodes.new("ShaderNodeMath")
    m1.operation = "MULTIPLY"
    nt.links.new(gt.outputs["Value"], m1.inputs[0])
    nt.links.new(band.outputs["Value"], m1.inputs[1])
    m2 = nt.nodes.new("ShaderNodeMath")
    m2.operation = "MULTIPLY"
    nt.links.new(m1.outputs["Value"], m2.inputs[0])
    nt.links.new(inside.outputs["Result"], m2.inputs[1])
    m3 = nt.nodes.new("ShaderNodeMath")
    m3.operation = "MULTIPLY"
    nt.links.new(m2.outputs["Value"], m3.inputs[0])
    nt.links.new(inside2.outputs["Result"], m3.inputs[1])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs[6].default_value = (*paint, 1)
    mix.inputs[7].default_value = (0.03, 0.04, 0.06, 1)
    nt.links.new(m3.outputs["Value"], mix.inputs["Factor"])
    nt.links.new(mix.outputs[2], p.inputs["Base Color"])
    return m


def build(name="Airliner", livery=(0.92, 0.93, 0.95), tail_color=(0.05, 0.16, 0.38)):
    skin_m = window_texture_mat(f"{name}_skin", livery)
    wing_m = mat(f"{name}_wing", (0.78, 0.8, 0.83), rough=0.35, metal=0.4)
    tail_m = mat(f"{name}_tailpaint", tail_color, rough=0.3)
    eng_m = mat(f"{name}_engine", (0.85, 0.86, 0.88), rough=0.3, metal=0.5)
    dark_m = mat(f"{name}_intake", (0.02, 0.02, 0.025), rough=0.5)
    glass_m = mat(f"{name}_glass", (0.02, 0.03, 0.05), rough=0.08, metal=0.5)

    # fuselage in two pieces: front (t 0.24 → 1) and the tail section (t 0 → 0.24) whose
    # skin can be faded for the x-ray shot
    front = loft(f"{name}_skin", 0.24, 1.0, skin_m)
    tail_skin_m = window_texture_mat(f"{name}_tailskin_m", livery)
    tail = loft(f"{name}_tailskin", 0.0, 0.24, tail_skin_m, rings=30)
    # cockpit windows
    cock = []
    for y in (-0.55, 0.55):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(L / 2 - 2.3, y, 0.95))
        w = bpy.context.object
        w.scale = (0.5, 0.35, 0.22)
        w.rotation_euler = (0, math.radians(-25), math.radians(15 if y > 0 else -15))
        w.data.materials.append(glass_m)
        cock.append(w)
    # wings: root at x ≈ +1, low wing
    wings = wing_mesh(f"{name}_wing", 16.5, 6.6, 1.6, math.radians(25), math.radians(5), 0.12, wing_m)
    wings.location = (2.5, 0, -1.2)
    # horizontal stabiliser + fin
    hstab = wing_mesh(f"{name}_hstab", 6.2, 3.6, 1.2, math.radians(30), math.radians(6), 0.1, wing_m)
    hstab.location = (-L / 2 + 4.2, 0, 0.6)
    fin = wing_mesh(f"{name}_fin", 6.0, 5.2, 1.7, math.radians(35), 0, 0.1, tail_m, mirror=False)
    fin.rotation_euler = (math.radians(90), 0, 0)
    fin.location = (-L / 2 + 6.3, 0, 1.7)
    # engines under the wings
    engines = []
    for y in (-5.6, 5.6):
        bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=3.6, location=(3.6, y, -2.4), rotation=(0, math.radians(90), 0), vertices=48)
        e = bpy.context.object
        e.data.materials.append(eng_m)
        bv = e.modifiers.new("bevel", "BEVEL")
        bv.width = 0.15
        bv.segments = 4
        bpy.ops.object.shade_smooth()
        bpy.ops.mesh.primitive_cylinder_add(radius=0.88, depth=0.1, location=(5.42, y, -2.4), rotation=(0, math.radians(90), 0), vertices=48)
        intake = bpy.context.object
        intake.data.materials.append(dark_m)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(3.1, y, -1.55))
        pylon = bpy.context.object
        pylon.scale = (2.6, 0.18, 0.7)
        pylon.data.materials.append(wing_m)
        engines += [e, intake, pylon]
    root = empty(name)
    parts_all = [front, tail, wings, hstab, fin] + engines + cock
    parent(parts_all, root)
    return root, {"skin": front, "tailskin": tail, "tailskin_mat": tail_skin_m, "wings": wings, "fin": fin, "hstab": hstab, "engines": engines, "all": parts_all}
