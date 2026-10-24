"""RMS Titanic at real scale (metres): 269 m long, 28 m beam, 10.5 m draft, waterline at z = 0.
+X = bow. Built from lofted sections, so it can be split anywhere along the length:

  build(name, split_x=None, wreck=False) → (root, P)
    P["bow"], P["stern"]  piece empties, both pivoting at the keel under split_x
                          (rotate them about Y to hinge the hull apart)
    P["side"]             hull/superstructure material (atlas from make_titanic_tex.py)
    P["lights"]           Value node 0–1: porthole + window emission
    P["stress"]           Value node 0–1: white-hot band around split_x (thermal view)
    P["lamps"]            warm point lights along the decks (energy follows set_lights)

Hull, superstructure and deck all use mesh coordinates in ship space, so the shader can
place the stress band and the atlas UVs by x/z no matter how the pieces move.
"""
import math
import os
import random

import bmesh
import bpy

from common import ROOT, cyl, empty, mat, parent, pbr

L, BEAM, DRAFT = 269.0, 28.2, 10.5
HB = BEAM / 2
Z0, Z1 = -11.0, 23.0  # atlas height range (make_titanic_tex.py)
BOAT_DECK = 19.6
LAMP = 4000.0
FUNNELS = [47.0, 22.5, -2.0, -26.5]
SIDE_PNG = os.path.join(ROOT, "blender", "assets", "titanic_side.jpg")
EMIT_PNG = os.path.join(ROOT, "blender", "assets", "titanic_side_emit.jpg")


def sheer(x):
    t = x / (L / 2)
    return 11.0 + (3.6 if t > 0 else 2.4) * t * t


def keel(x):
    """Keel line: flat, the counter stern lifts out of the water over the last ~18 m."""
    if x < -116:
        k = (-116 - x) / 18.5
        return -DRAFT + (DRAFT + 3.5) * min(1, k) ** 1.6
    return -DRAFT


def half_w(x, u):
    """Half-breadth at x for height fraction u (0 keel … 1 sheer)."""
    if x > 30:  # fine bow, slight flare toward the top
        t = min(1, (x - 30) / (L / 2 - 30))
        w = HB * (1 - t ** 1.9) * (0.82 + 0.18 * u) ** (0.5 * t)
    elif x < -85:  # rounded counter stern in plan
        t = min(1, (-85 - x) / (L / 2 - 85))
        w = HB * math.sqrt(max(0.0, 1 - t ** 2.2))
    else:
        w = HB
    # bilge: round off the bottom; V-shaped toward the ends
    b = 0.16
    fine = 0.0 if -60 < x < 20 else min(1, (abs(x) - (20 if x > 0 else 60)) / 60)
    bil = math.sqrt(max(0.0, 1 - (1 - min(1, u / b)) ** 2))
    v = u ** 0.55
    return w * ((1 - fine) * bil + fine * v)


def _uv(x, z):
    return ((x + L / 2) / L, (z - Z0) / (Z1 - Z0))


def loft(name, x0, x1, n, section, top_flat=True):
    """Closed loft: section(x) → list of (y, z) from the keel centre up the starboard side to
    the top edge; mirrored for port; top closed by a deck (material index 1)."""
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    rings = []
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        stb = section(x)
        pts = stb + [(-y, z) for y, z in reversed(stb)]
        rings.append([bm.verts.new((x, y, z)) for y, z in pts])
    m = len(rings[0])
    for i in range(n):
        a, b = rings[i], rings[i + 1]
        for k in range(m - 1):
            f = bm.faces.new((a[k], b[k], b[k + 1], a[k + 1]))
            top = k == len(section(0)) - 1  # the deck strip between the two top edges
            f.material_index = 1 if top and top_flat else 0
            for lp in f.loops:
                lp[uvl].uv = _uv(lp.vert.co.x, lp.vert.co.z)
    for ring, rev in ((rings[0], True), (rings[-1], False)):
        uniq = []
        for v in ring:
            if not uniq or (v.co - uniq[-1].co).length > 1e-4:
                uniq.append(v)
        if len(uniq) >= 3 and (uniq[0].co - uniq[-1].co).length < 1e-4:
            uniq = uniq[:-1]
        if len(uniq) >= 3:
            try:
                f = bm.faces.new(list(reversed(uniq)) if rev else uniq)
                f.material_index = 2
            except ValueError:
                pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.002)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    for p in o.data.polygons:
        p.use_smooth = True
    if hasattr(o.data, "set_sharp_from_angle"):
        o.data.set_sharp_from_angle(angle=math.radians(40))
    return o


def hull_section(x):
    zk, zt = keel(x), sheer(x)
    pts = []
    for k in range(15):
        u = k / 14
        pts.append((max(0.0, half_w(x, u)) if k else 0.0, zk + (zt - zk) * u))
    return pts


def block_section(z0, z1, inset, xr):
    def sec(x):
        w = max(0.05, min(half_w(x, 1.0), HB) - inset)
        return [(0.0, z0), (w, z0), (w, z1)]

    return sec


def side_material(name, wreck=False):
    """Atlas paint + lit windows (× lights) + white-hot stress band around the split."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Roughness"].default_value = 0.42
    tc = nt.nodes.new("ShaderNodeTexImage")
    tc.image = bpy.data.images.load(SIDE_PNG, check_existing=True)
    te = nt.nodes.new("ShaderNodeTexImage")
    te.image = bpy.data.images.load(EMIT_PNG, check_existing=True)
    nt.links.new(tc.outputs["Color"], p.inputs["Base Color"])
    lights = nt.nodes.new("ShaderNodeValue")
    lights.name = "lights"
    lights.outputs[0].default_value = 1.0
    stress = nt.nodes.new("ShaderNodeValue")
    stress.name = "stress"
    stress.outputs[0].default_value = 0.0
    split = nt.nodes.new("ShaderNodeValue")
    split.name = "split_x"
    # emission = window atlas × lights × 6  +  stress colour × exp(-((x - split)/w)^2) × stress × 30
    em1 = nt.nodes.new("ShaderNodeMix")
    em1.data_type = "RGBA"
    em1.blend_type = "MULTIPLY"
    em1.inputs["Factor"].default_value = 1
    nt.links.new(te.outputs["Color"], em1.inputs[6])
    mulL = nt.nodes.new("ShaderNodeMath")
    mulL.operation = "MULTIPLY"
    mulL.inputs[1].default_value = 6.0
    nt.links.new(lights.outputs[0], mulL.inputs[0])
    cmb = nt.nodes.new("ShaderNodeCombineColor")
    for i in range(3):
        nt.links.new(mulL.outputs[0], cmb.inputs[i])
    nt.links.new(cmb.outputs[0], em1.inputs[7])
    tco = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tco.outputs["Object"], sep.inputs["Vector"])
    d = nt.nodes.new("ShaderNodeMath")
    d.operation = "SUBTRACT"
    nt.links.new(sep.outputs["X"], d.inputs[0])
    nt.links.new(split.outputs[0], d.inputs[1])
    dv = nt.nodes.new("ShaderNodeMath")
    dv.operation = "DIVIDE"
    dv.inputs[1].default_value = 14.0
    nt.links.new(d.outputs[0], dv.inputs[0])
    sq = nt.nodes.new("ShaderNodeMath")
    sq.operation = "MULTIPLY"
    nt.links.new(dv.outputs[0], sq.inputs[0])
    nt.links.new(dv.outputs[0], sq.inputs[1])
    ng = nt.nodes.new("ShaderNodeMath")
    ng.operation = "MULTIPLY"
    ng.inputs[1].default_value = -1.0
    nt.links.new(sq.outputs[0], ng.inputs[0])
    ex = nt.nodes.new("ShaderNodeMath")
    ex.operation = "EXPONENT"
    nt.links.new(ng.outputs[0], ex.inputs[0])
    ms = nt.nodes.new("ShaderNodeMath")
    ms.operation = "MULTIPLY"
    nt.links.new(ex.outputs[0], ms.inputs[0])
    nt.links.new(stress.outputs[0], ms.inputs[1])
    ms2 = nt.nodes.new("ShaderNodeMath")
    ms2.operation = "MULTIPLY"
    ms2.inputs[1].default_value = 30.0
    nt.links.new(ms.outputs[0], ms2.inputs[0])
    hot = nt.nodes.new("ShaderNodeMix")
    hot.data_type = "RGBA"
    hot.blend_type = "ADD"
    hot.inputs["Factor"].default_value = 1
    nt.links.new(em1.outputs[2], hot.inputs[6])
    sc = nt.nodes.new("ShaderNodeMix")
    sc.data_type = "RGBA"
    sc.blend_type = "MULTIPLY"
    sc.inputs["Factor"].default_value = 1
    sc.inputs[6].default_value = (1.0, 0.55, 0.2, 1)
    cmb2 = nt.nodes.new("ShaderNodeCombineColor")
    for i in range(3):
        nt.links.new(ms2.outputs[0], cmb2.inputs[i])
    nt.links.new(cmb2.outputs[0], sc.inputs[7])
    nt.links.new(sc.outputs[2], hot.inputs[7])
    nt.links.new(hot.outputs[2], p.inputs["Emission Color"])
    p.inputs["Emission Strength"].default_value = 1.0
    if wreck:  # rust over the plating, portholes as dark holes, no lights
        lights.outputs[0].default_value = 0.0
        tco2 = nt.nodes.new("ShaderNodeTexCoord")
        mp = nt.nodes.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = (0.12, 0.12, 0.12)
        nt.links.new(tco2.outputs["Object"], mp.inputs["Vector"])
        rd = nt.nodes.new("ShaderNodeTexImage")
        rd.image = bpy.data.images.load(os.path.join(ROOT, "public", "textures", "rusty_metal_02_diff.jpg"), check_existing=True)
        rd.projection = "BOX"
        rd.projection_blend = 0.2
        nt.links.new(mp.outputs["Vector"], rd.inputs["Vector"])
        holes = nt.nodes.new("ShaderNodeMix")
        holes.data_type = "RGBA"
        holes.blend_type = "MULTIPLY"
        holes.inputs["Factor"].default_value = 1
        inv = nt.nodes.new("ShaderNodeInvert")
        nt.links.new(te.outputs["Color"], inv.inputs["Color"])
        nt.links.new(rd.outputs["Color"], holes.inputs[6])
        nt.links.new(inv.outputs["Color"], holes.inputs[7])
        tint = nt.nodes.new("ShaderNodeMix")
        tint.data_type = "RGBA"
        tint.blend_type = "MULTIPLY"
        tint.inputs["Factor"].default_value = 1
        tint.inputs[7].default_value = (0.42, 0.24, 0.15, 1)
        nt.links.new(holes.outputs[2], tint.inputs[6])
        nt.links.new(tint.outputs[2], p.inputs["Base Color"])
        p.inputs["Roughness"].default_value = 0.85
        rn = nt.nodes.new("ShaderNodeTexImage")
        rn.image = bpy.data.images.load(os.path.join(ROOT, "public", "textures", "rusty_metal_02_nor_gl.jpg"), check_existing=True)
        rn.image.colorspace_settings.name = "Non-Color"
        rn.projection = "BOX"
        nt.links.new(mp.outputs["Vector"], rn.inputs["Vector"])
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nt.links.new(rn.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], p.inputs["Normal"])
    return m, lights, stress, split


def build(name="Titanic", split_x=-14.0, wreck=False, seed=3):
    rnd = random.Random(seed)
    side, lights, stress, splitv = side_material(f"{name}_side", wreck)
    if not wreck:
        splitv.outputs[0].default_value = split_x
    deck = mat(f"{name}_deck", (0.42, 0.31, 0.2), rough=0.7) if not wreck else pbr(f"{name}_deckr", "rusty_metal_02", 0.1, (0.4, 0.27, 0.18))
    torn = mat(f"{name}_torn", (0.05, 0.04, 0.035), rough=0.9, metal=0.4)
    buff = mat(f"{name}_buff", (0.62, 0.36, 0.1), rough=0.5) if not wreck else torn
    black = mat(f"{name}_black", (0.012, 0.012, 0.014), rough=0.45)
    white = mat(f"{name}_white", (0.85, 0.84, 0.8), rough=0.5) if not wreck else torn
    wood = mat(f"{name}_wood", (0.25, 0.17, 0.1), rough=0.6)

    stern_x0, bow_x1 = -L / 2, L / 2
    pieces = {"bow": [], "stern": []}

    def add(o, x):
        pieces["bow" if x >= split_x else "stern"].append(o)

    for tag, a, b in (("stern", stern_x0, split_x), ("bow", split_x, bow_x1)):
        n = max(8, int((b - a) / 2.2))
        h = loft(f"{name}_hull_{tag}", a, b, n, hull_section)
        for mm in (side, deck, torn):
            h.data.materials.append(mm)
        pieces[tag].append(h)
        # superstructure blocks: B deck, A deck (promenade), boat-deck houses
        for (z0, z1, inset, xa, xb) in ((sheer(0) - 0.05, 14.2, 0.0, -96, 82), (14.2, 17.6, 0.5, -74, 76), (17.6, BOAT_DECK, 0.9, -78, 78), (BOAT_DECK, BOAT_DECK + 2.8, 5.0, -58, 70)):
            if wreck and z0 > 15:
                continue
            ca, cb = max(a, xa), min(b, xb)
            if cb - ca < 1:
                continue
            blk = loft(f"{name}_ss_{tag}", ca, cb, max(2, int((cb - ca) / 6)), block_section(z0, z1, inset, (xa, xb)))
            for mm in (side, deck, torn):
                blk.data.materials.append(mm)
            pieces[tag].append(blk)
    if not wreck:
        # funnels: elliptical, raked aft, buff with black tops
        for fx in FUNNELS:
            f = cyl(f"{name}_funnel", 1.0, 1.0, (fx, 0, BOAT_DECK + 10.5), m=buff, verts=40)
            f.scale = (3.75, 2.9, 21.0)
            f.rotation_euler = (0, math.radians(-6), 0)
            top = cyl(f"{name}_ftop", 1.0, 1.0, (fx - 0.89, 0, BOAT_DECK + 19.0), m=black, verts=40)
            top.scale = (3.8, 2.95, 4.2)
            top.rotation_euler = (0, math.radians(-6), 0)
            add(f, fx)
            add(top, fx)
        # masts + rigging (antenna wires between the masts, stays to bow and stern)
        masts = ((88.0, 58.0), (-102.0, 52.0))
        for mx, mh in masts:
            mz = sheer(mx)
            m_ = cyl(f"{name}_mast", 0.45, mh - mz, (mx, 0, (mh + mz) / 2), m=wood, verts=12)
            m_.rotation_euler = (0, math.radians(-2.5), 0)
            add(m_, mx)
        nest = cyl(f"{name}_nest", 1.1, 2.0, (88.9, 0, 33), m=black, verts=16)
        add(nest, 88)

        def wire(p0, p1, x_for):
            import mathutils

            v0, v1 = mathutils.Vector(p0), mathutils.Vector(p1)
            d = v1 - v0
            w = cyl(f"{name}_wire", 0.06, d.length, tuple((v0 + v1) / 2), m=black, verts=6)
            w.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
            add(w, x_for)

        for dy in (-1.2, 1.2):
            wire((88 - 1.2, dy, 56), (-102 + 1.2, dy, 50), 0 if split_x < -102 else 88)  # spans the break → bow
        wire((88.5, 0, 57), (L / 2 - 1, 0, sheer(L / 2) + 1), 100)
        wire((-102.5, 0, 51), (-L / 2 + 2, 0, sheer(-L / 2) + 1), -110)
        # lifeboats in davits along the boat deck edge (4 forward + 4 aft per side)
        for bx in (66, 58, 50, 42, -34, -42, -50, -58):
            for side_y in (-1, 1):
                y = side_y * (HB - 1.6)
                boat = bpy.data.objects.new(f"{name}_boat", _boat_mesh())
                bpy.context.collection.objects.link(boat)
                boat.data.materials.append(white)
                boat.location = (bx, y, BOAT_DECK + 1.6)
                add(boat, bx)
                for dx in (-3.6, 3.6):
                    dv = cyl(f"{name}_davit", 0.14, 3.2, (bx + dx, y + side_y * 0.3, BOAT_DECK + 1.6), m=black, verts=6)
                    add(dv, bx)
    # forecastle: rails converging at the stem, bollards, capstans, anchors
    rail_m = black if not wreck else torn
    for zoff in (1.1, 0.55):
        cd = bpy.data.curves.new(f"{name}_rail", "CURVE")
        cd.dimensions = "3D"
        sp = cd.splines.new("POLY")
        xs = [96 + (L / 2 - 0.6 - 96) * i / 30 for i in range(31)]
        pts = [(x, half_w(x, 1.0) - 0.25, sheer(x) + zoff) for x in xs] + [(x, -(half_w(x, 1.0) - 0.25), sheer(x) + zoff) for x in reversed(xs)]
        sp.points.add(len(pts) - 1)
        for i, q in enumerate(pts):
            sp.points[i].co = (*q, 1)
        cd.bevel_depth = 0.06
        cd.materials.append(rail_m)
        ro = bpy.data.objects.new(f"{name}_rail", cd)
        bpy.context.collection.objects.link(ro)
        add(ro, 120)
    for x in [96 + 2.6 * i for i in range(15)]:
        for sy in (-1, 1):
            if half_w(x, 1.0) > 0.6:
                add(cyl(f"{name}_post", 0.05, 1.1, (x, sy * (half_w(x, 1.0) - 0.25), sheer(x) + 0.55), m=rail_m, verts=6), x)
    for (bx, by) in ((112, -6), (112, 6), (104, -9), (104, 9), (124, -3.5), (124, 3.5)):
        add(cyl(f"{name}_bollard", 0.45, 1.0, (bx, by, sheer(bx) + 0.5), m=rail_m, verts=12), bx)
    for by in (-2.6, 2.6):
        add(cyl(f"{name}_capstan", 1.0, 1.4, (117, by, sheer(117) + 0.7), m=rail_m, verts=16), 117)
    for sy in (-1, 1):
        anc = cyl(f"{name}_anchor", 1.0, 0.6, (121, sy * (half_w(121, 0.7) + 0.15), sheer(121) - 4.0), rot=(math.radians(90), 0, 0), m=rail_m, verts=6)
        anc.scale = (1.4, 2.2, 1.0)
        add(anc, 121)

    # rudder + three propellers (the stern standing out of the sea is iconic)
    bronze = mat(f"{name}_bronze", (0.55, 0.36, 0.18), rough=0.35, metal=1.0) if not wreck else torn
    rud = bpy.data.objects.new(f"{name}_rudder", bpy.data.meshes.new("rudder"))
    bpy.context.collection.objects.link(rud)
    import bmesh as _bm

    bmr = _bm.new()
    vs = [bmr.verts.new((x, y, z)) for (x, z) in ((-127.2, -10.2), (-133.6, -9.6), (-133.2, 2.4), (-127.2, 2.8)) for y in (-0.6, 0.6)]
    bmesh.ops.convex_hull(bmr, input=vs)
    bmr.to_mesh(rud.data)
    bmr.free()
    rud.data.materials.append(black if not wreck else torn)
    add(rud, -130)
    for (px_, py_, pr) in ((-124.0, 0.0, 2.6), (-112.0, -6.6, 3.6), (-112.0, 6.6, 3.6)):
        hub = cyl(f"{name}_hub", 0.7, 1.6, (px_, py_, -7.2), rot=(0, math.radians(90), 0), m=bronze, verts=16)
        add(hub, px_)
        nb = 3 if py_ else 4
        for k in range(nb):
            ang = 2 * math.pi * k / nb
            bl = cyl(f"{name}_blade", 1.0, 0.18, (px_, py_ + math.cos(ang) * pr * 0.55, -7.2 + math.sin(ang) * pr * 0.55), rot=(ang, math.radians(90), 0), m=bronze, verts=16)
            bl.scale = (pr * 0.5, 0.8, 1.0)
            bl.rotation_euler = (ang + math.pi / 2, math.radians(90), math.radians(20))
            add(bl, px_)
        if py_:
            sh = cyl(f"{name}_shaft", 0.5, 14, (px_ + 7, py_ * 0.85, -6.6), rot=(0, math.radians(90), 0), m=black, verts=10)
            add(sh, px_)
    if wreck:
        # wreck: foremast fallen back across the deck, debris on deck
        fm = cyl(f"{name}_mast", 0.45, 40, (68, 2, sheer(68) + 1.5), rot=(0, math.radians(88), math.radians(6)), m=torn, verts=10)
        add(fm, 68)

    # warm light spilling from the portholes onto the sea: one-sided area lights along each
    # side, facing outward and down (they never light the hull itself)
    lamps = []
    if not wreck:
        import mathutils

        for lx in range(-105, 115, 20):
            for side_y in (-1, 1):
                bpy.ops.object.light_add(type="AREA", location=(lx, side_y * (half_w(lx, 0.6) + 0.6), 5.5))
                lp = bpy.context.object
                lp.data.shape = "RECTANGLE"
                lp.data.size, lp.data.size_y = 18, 5
                lp.data.energy = LAMP
                lp.data.color = (1.0, 0.7, 0.4)
                lp.data.specular_factor = 0.0  # no light-shaped glints on the glassy sea
                lp.rotation_euler = mathutils.Vector((0, side_y, -0.7)).to_track_quat("-Z", "X").to_euler()
                add(lp, lx)
                lamps.append(lp)

    root = empty(name)
    bow = empty(f"{name}_bowpiece", (split_x, 0, keel(split_x)))
    stern = empty(f"{name}_sternpiece", (split_x, 0, keel(split_x)))
    parent(pieces["bow"], bow)
    parent(pieces["stern"], stern)
    parent([bow, stern], root)
    return root, {"bow": bow, "stern": stern, "side": side, "lights": lights, "stress": stress, "lamps": lamps}


_BOAT = None


def _boat_mesh():
    """Shared 9 m lifeboat hull (half-ellipsoid hull with a flat top)."""
    global _BOAT
    try:
        if _BOAT is not None and _BOAT.name in bpy.data.meshes:
            return _BOAT
    except ReferenceError:  # freed by a scene reset
        pass
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=10, radius=1.0)
    for v in bm.verts:
        v.co.x *= 4.5
        v.co.y *= 1.1
        v.co.z = min(v.co.z, 0.2) * 0.9
    me = bpy.data.meshes.new("lifeboat")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    _BOAT = me
    return me


def set_lights(P, value, frame):
    """Keyframe porthole/window glow and deck lamps together (0 = blackout)."""
    P["lights"].outputs[0].default_value = value
    P["lights"].outputs[0].keyframe_insert("default_value", frame=frame)
    for lp in P["lamps"]:
        try:
            lp.data.energy = LAMP * value
        except ReferenceError:  # its piece was dropped
            continue
        lp.data.keyframe_insert("energy", frame=frame)
