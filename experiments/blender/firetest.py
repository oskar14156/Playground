"""Quality test A: the black box in a fire test, rendered with Blender EEVEE.

Run headless:
  blender -b -P experiments/blender/firetest.py -- --out out/compare/blender --frames 48 --res 100

Builds everything procedurally (no downloads): brick wall, concrete floor, rusty stand,
orange recorder with stencil text, Mantaflow fire, area/point lights, DOF, bloom (Glare).
"""
import argparse
import math
import sys
import time

import bpy

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--out", default="out/compare/blender")
ap.add_argument("--frames", type=int, default=48, help="simulate this many frames, render the last one")
ap.add_argument("--res", type=int, default=100, help="resolution percentage of 1080x1920")
ap.add_argument("--sim", type=int, default=72, help="fire domain resolution")
ap.add_argument("--clip", type=int, default=0, help="also render the last N frames as a clip")
a = ap.parse_args(argv)

# ---------- reset ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1080
scene.render.resolution_y = 1920
scene.render.resolution_percentage = a.res
scene.render.fps = 30
scene.frame_start = 1
scene.frame_end = a.frames
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Punchy"
scene.view_settings.exposure = -0.6
ee = scene.eevee
for attr, val in [("taa_render_samples", 64), ("use_raytracing", True), ("volumetric_tile_size", "4"), ("volumetric_samples", 96), ("use_shadows", True)]:
    if hasattr(ee, attr):
        setattr(ee, attr, val)


def mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links


def principled(nodes):
    return nodes.get("Principled BSDF")


# ---------- world: dim bundled interior HDRI ----------
world = bpy.data.worlds.new("W")
scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes
env = wn.new("ShaderNodeTexEnvironment")
import glob, os  # noqa: E401

hdris = glob.glob(os.path.join(bpy.utils.system_resource("DATAFILES"), "studiolights", "world", "interior.exr"))
if hdris:
    env.image = bpy.data.images.load(hdris[0])
    world.node_tree.links.new(env.outputs["Color"], wn["Background"].inputs["Color"])
wn["Background"].inputs["Strength"].default_value = 0.25

# ---------- floor: concrete ----------
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
floor = bpy.context.object
m, n, l = mat("Concrete")
p = principled(n)
noise = n.new("ShaderNodeTexNoise")
noise.inputs["Scale"].default_value = 18
noise.inputs["Detail"].default_value = 12
ramp = n.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = (0.32, 0.31, 0.3, 1)
ramp.color_ramp.elements[1].color = (0.52, 0.5, 0.48, 1)
l.new(noise.outputs["Fac"], ramp.inputs["Fac"])
l.new(ramp.outputs["Color"], p.inputs["Base Color"])
p.inputs["Roughness"].default_value = 0.85
bump = n.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.25
l.new(noise.outputs["Fac"], bump.inputs["Height"])
l.new(bump.outputs["Normal"], p.inputs["Normal"])
floor.data.materials.append(m)

# ---------- brick walls (corner) ----------
def brick_wall(loc, rot):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    w = bpy.context.object
    w.scale = (8, 6, 1)
    m, n, l = mat("Brick")
    p = principled(n)
    tc = n.new("ShaderNodeTexCoord")
    br = n.new("ShaderNodeTexBrick")
    br.inputs["Scale"].default_value = 9
    br.inputs["Mortar Size"].default_value = 0.012
    br.inputs["Color1"].default_value = (0.42, 0.16, 0.08, 1)
    br.inputs["Color2"].default_value = (0.55, 0.24, 0.12, 1)
    br.inputs["Mortar"].default_value = (0.55, 0.5, 0.45, 1)
    br.offset = 0.5
    l.new(tc.outputs["Object"], br.inputs["Vector"])
    l.new(br.outputs["Color"], p.inputs["Base Color"])
    p.inputs["Roughness"].default_value = 0.9
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.6
    l.new(br.outputs["Fac"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], p.inputs["Normal"])
    w.data.materials.append(m)


brick_wall((0, 2.2, 3), (math.radians(90), 0, 0))
brick_wall((-2.6, 0, 3), (math.radians(90), 0, math.radians(90)))

# ---------- rusty steel stand ----------
m_rust, n, l = mat("RustySteel")
p = principled(n)
nz = n.new("ShaderNodeTexNoise")
nz.inputs["Scale"].default_value = 40
cr = n.new("ShaderNodeValToRGB")
cr.color_ramp.elements[0].color = (0.08, 0.08, 0.09, 1)
cr.color_ramp.elements[1].color = (0.35, 0.16, 0.06, 1)
l.new(nz.outputs["Fac"], cr.inputs["Fac"])
l.new(cr.outputs["Color"], p.inputs["Base Color"])
p.inputs["Metallic"].default_value = 0.7
p.inputs["Roughness"].default_value = 0.6
for x in (-0.6, 0.6):
    for y in (-0.45, 0.45):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.9, location=(x, y, 0.45))
        bpy.context.object.data.materials.append(m_rust)
for y in (-0.45, 0.45):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=1.25, location=(0, y, 0.9), rotation=(0, math.radians(90), 0))
    bpy.context.object.data.materials.append(m_rust)
for x in (-0.6, 0.6):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.95, location=(x, 0, 0.9), rotation=(math.radians(90), 0, 0))
    bpy.context.object.data.materials.append(m_rust)
# burner nozzles
for x in (-0.3, 0.0, 0.3):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.25, location=(x, 0.05, 0.13))
    bpy.context.object.data.materials.append(m_rust)

# ---------- the recorder ----------
m_or, n, l = mat("Orange")
p = principled(n)
p.inputs["Base Color"].default_value = (0.95, 0.22, 0.02, 1)
p.inputs["Roughness"].default_value = 0.45
if "Coat Weight" in p.inputs:
    p.inputs["Coat Weight"].default_value = 0.2
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1.08))
box = bpy.context.object
box.scale = (0.62, 0.3, 0.17)
bev = box.modifiers.new("bev", "BEVEL")
bev.width = 0.025
bev.segments = 4
box.data.materials.append(m_or)
bpy.ops.object.shade_smooth()
m_white, n, l = mat("Reflective")
principled(n).inputs["Base Color"].default_value = (0.9, 0.9, 0.88, 1)
principled(n).inputs["Roughness"].default_value = 0.25
for x in (-0.2, 0.2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, 1.08))
    s = bpy.context.object
    s.scale = (0.035, 0.306, 0.172)
    s.data.materials.append(m_white)
# beacon
m_alu, n, l = mat("Alu")
principled(n).inputs["Base Color"].default_value = (0.8, 0.8, 0.82, 1)
principled(n).inputs["Metallic"].default_value = 1
principled(n).inputs["Roughness"].default_value = 0.3
bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.26, location=(0.44, 0, 1.08), rotation=(0, math.radians(90), 0))
bpy.context.object.data.materials.append(m_alu)
# stencil text on the front face
m_ink, n, l = mat("Ink")
principled(n).inputs["Base Color"].default_value = (0.02, 0.02, 0.02, 1)
for txt, z, size in (("FLIGHT RECORDER", 1.12, 0.05), ("DO NOT OPEN", 1.05, 0.04)):
    bpy.ops.object.text_add(location=(0, -0.302, z), rotation=(math.radians(90), 0, 0))
    t = bpy.context.object
    t.data.body = txt
    t.data.align_x = "CENTER"
    t.data.align_y = "CENTER"
    t.data.size = size
    t.data.extrude = 0.002
    t.data.materials.append(m_ink)

# ---------- fire: Mantaflow ----------
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.05, 0.3))
emitter = bpy.context.object
emitter.scale = (0.75, 0.42, 0.06)
bpy.ops.object.select_all(action="DESELECT")
emitter.select_set(True)
bpy.context.view_layer.objects.active = emitter
bpy.ops.object.quick_smoke(style="BOTH", show_flows=False)
domain = bpy.context.object  # quick_smoke leaves the domain active
domain.location = (0, 0.05, 1.3)
domain.scale = (1.0, 0.8, 1.35)
dsett = domain.modifiers["Fluid"].domain_settings
dsett.resolution_max = a.sim
dsett.cache_type = "ALL"  # replay mode only simulates during playback; jumping to a frame showed no fire
dsett.use_noise = True  # high-res turbulence on top: real flame tongues instead of a soft pillar
dsett.noise_scale = 2
dsett.noise_strength = 1.2
dsett.cache_frame_end = a.frames
dsett.cache_directory = os.path.abspath(os.path.join(a.out, "cache"))
dsett.flame_vorticity = 1.4
dsett.vorticity = 0.25
dsett.burning_rate = 0.85
# own volume material: smoke from "density", glowing flames from "flame" via blackbody
vm = bpy.data.materials.new("FireVolume")
vm.use_nodes = True
vn, vl = vm.node_tree.nodes, vm.node_tree.links
for node in list(vn):
    vn.remove(node)
out = vn.new("ShaderNodeOutputMaterial")
pv = vn.new("ShaderNodeVolumePrincipled")
at_d = vn.new("ShaderNodeAttribute")
at_d.attribute_name = "density"
at_f = vn.new("ShaderNodeAttribute")
at_f.attribute_name = "flame"
md = vn.new("ShaderNodeMath")
md.operation = "MULTIPLY"
md.inputs[1].default_value = 2.5
mf = vn.new("ShaderNodeMath")
mf.operation = "MULTIPLY"
mf.inputs[1].default_value = 45.0
vl.new(at_d.outputs["Fac"], md.inputs[0])
vl.new(md.outputs["Value"], pv.inputs["Density"])
# sharpen the flame field: flame^1.6 keeps the bright cores, drops the haze
pw = vn.new("ShaderNodeMath")
pw.operation = "POWER"
pw.inputs[1].default_value = 1.6
vl.new(at_f.outputs["Fac"], pw.inputs[0])
vl.new(pw.outputs["Value"], mf.inputs[0])
# colour the flames directly (blackbody went white after AgX tone mapping)
fr = vn.new("ShaderNodeValToRGB")
fr.color_ramp.elements[0].position = 0.0
fr.color_ramp.elements[0].color = (0.5, 0.03, 0.0, 1)
fr.color_ramp.elements[1].position = 1.0
fr.color_ramp.elements[1].color = (1.0, 0.78, 0.3, 1)
mid = fr.color_ramp.elements.new(0.45)
mid.color = (1.0, 0.3, 0.02, 1)
vl.new(at_f.outputs["Fac"], fr.inputs["Fac"])
vl.new(fr.outputs["Color"], pv.inputs["Emission Color"])
vl.new(mf.outputs["Value"], pv.inputs["Emission Strength"])
pv.inputs["Blackbody Intensity"].default_value = 0.0
pv.inputs["Color"].default_value = (0.05, 0.045, 0.04, 1)
pv.inputs["Temperature"].default_value = 1650
vl.new(pv.outputs["Volume"], out.inputs["Volume"])
domain.data.materials.clear()
domain.data.materials.append(vm)
flow = emitter.modifiers["Fluid"].flow_settings
flow.fuel_amount = 1.4
flow.temperature = 1.6
emitter.hide_render = True

# ---------- lights ----------
bpy.ops.object.light_add(type="AREA", location=(1.6, -2.4, 2.8))
key = bpy.context.object
key.data.energy = 60
key.data.size = 2.0
key.rotation_euler = (math.radians(55), 0, math.radians(30))
bpy.ops.object.light_add(type="POINT", location=(0, -0.2, 0.9))
fire_l = bpy.context.object
fire_l.data.energy = 140
fire_l.data.color = (1.0, 0.45, 0.12)
fire_l.data.shadow_soft_size = 0.4
bpy.ops.object.light_add(type="POINT", location=(0, 1.0, 2.0))
back = bpy.context.object
back.data.energy = 80
back.data.color = (1.0, 0.4, 0.1)

# ---------- camera ----------
bpy.ops.object.camera_add(location=(1.15, -3.3, 1.55))
cam = bpy.context.object
scene.camera = cam
cam.data.lens = 40
direction = (0 - cam.location.x, 0 - cam.location.y, 1.12 - cam.location.z)
import mathutils  # noqa: E402

cam.rotation_euler = mathutils.Vector(direction).to_track_quat("-Z", "Y").to_euler()
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = mathutils.Vector(direction).length
cam.data.dof.aperture_fstop = 2.8

# ---------- compositor: bloom ----------
scene.use_nodes = True
ct = scene.node_tree if hasattr(scene, "node_tree") and scene.node_tree else None
if ct:
    rl = ct.nodes.get("Render Layers")
    comp = ct.nodes.get("Composite")
    if rl and comp:
        glare = ct.nodes.new("CompositorNodeGlare")
        glare.glare_type = "FOG_GLOW" if hasattr(glare, "glare_type") else glare.glare_type
        if hasattr(glare, "threshold"):
            glare.threshold = 0.8
        if hasattr(glare, "size"):
            glare.size = 7
        ct.links.new(rl.outputs["Image"], glare.inputs["Image"])
        ct.links.new(glare.outputs["Image"], comp.inputs["Image"])

# ---------- bake + render ----------
os.makedirs(a.out, exist_ok=True)
t0 = time.time()
bpy.ops.object.select_all(action="DESELECT")
domain.select_set(True)
bpy.context.view_layer.objects.active = domain
with bpy.context.temp_override(object=domain, active_object=domain):
    bpy.ops.fluid.bake_all()
print(f"BAKE {time.time() - t0:.1f}s", flush=True)

frames = [a.frames] if not a.clip else list(range(a.frames - a.clip + 1, a.frames + 1))
for fr in frames:
    scene.frame_set(fr)
    t1 = time.time()
    scene.render.filepath = os.path.abspath(os.path.join(a.out, f"f_{fr:04d}.png"))
    bpy.ops.render.render(write_still=True)
    print(f"RENDER frame {fr} {time.time() - t1:.1f}s", flush=True)
print("DONE", flush=True)
