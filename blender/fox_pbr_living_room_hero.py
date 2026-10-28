"""High-end lookdev: real CC0 scan/PBR sofa + cloth/floor shaders + wearable fox.
This is a NEW asset-based test, no primitive sofa or 2D photo plate.
"""
import bpy,sys,os,math,random
from mathutils import Vector,Matrix
R=random.Random(2082)
args=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
def get(flag,default):
 return args[args.index(flag)+1] if flag in args else default
SOFA=get("--sofa","out/assets/sofa_02/sofa_02_1k.gltf")
FOX=get("--fox","")
OUT=get("--out","out/pbr-hero")
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
sc=bpy.context.scene
sc.render.engine="CYCLES"
sc.cycles.samples=int(get("--samples","24"))
sc.cycles.use_denoising=True
sc.render.resolution_x=1080;sc.render.resolution_y=1920
sc.render.resolution_percentage=int(get("--res","50"))
sc.view_settings.view_transform="AgX"
sc.view_settings.look="AgX - Medium High Contrast"
sc.view_settings.exposure=.05
sc.world.color=(.12,.12,.12)
def simple_mat(name,color,metal=0,rough=.8):
 m=bpy.data.materials.new(name);m.use_nodes=True
 p=m.node_tree.nodes.get("Principled BSDF")
 p.inputs["Base Color"].default_value=(*color,1)
 p.inputs["Metallic"].default_value=metal;p.inputs["Roughness"].default_value=rough
 return m
metal=simple_mat("Brushed bronze window metal",(.27,.20,.135),.62,.31)
plaster=simple_mat("Clean warm plaster",(.68,.65,.59),0,.95)
dark=simple_mat("Deep blue accent wall",(.17,.19,.22),0,.85)
def texture_mat(name,base,secondary,scale=16):
 m=simple_mat(name,base)
 nodes=m.node_tree.nodes;link=m.node_tree.links;p=nodes.get("Principled BSDF")
 tex=nodes.new("ShaderNodeTexNoise");tex.inputs["Scale"].default_value=scale
 coord=nodes.new("ShaderNodeTexCoord")
 link.new(coord.outputs["Generated"],tex.inputs["Vector"])
 ramp=nodes.new("ShaderNodeValToRGB")
 ramp.color_ramp.elements[0].position=.29;ramp.color_ramp.elements[0].color=(*base,1)
 ramp.color_ramp.elements[1].position=.74;ramp.color_ramp.elements[1].color=(*secondary,1)
 link.new(tex.outputs["Fac"],ramp.inputs["Fac"]);link.new(ramp.outputs["Color"],p.inputs["Base Color"])
 bump=nodes.new("ShaderNodeBump");bump.inputs["Strength"].default_value=.19;bump.inputs["Distance"].default_value=.008
 link.new(tex.outputs["Fac"],bump.inputs["Height"]);link.new(bump.outputs["Normal"],p.inputs["Normal"])
 return m
floor=texture_mat("Photographic-ish oak parquet shader",(.31,.185,.10),(.54,.36,.19),42)
rug=texture_mat("Thick neutral wool rug",(.49,.46,.39),(.65,.61,.52),90)
def box(name,loc,dims,mat,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
 o=bpy.context.object;o.name=name;o.dimensions=dims
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(mat)
 if bevel:
  b=o.modifiers.new("Chamfer","BEVEL");b.width=bevel;b.segments=3
  o.modifiers.new("Hard surface weighted normals","WEIGHTED_NORMAL")
 return o
# Architectural room. Surface grain, ceiling, window and spotlights.
box("Solid oak plank floor",(0,0,-.11),(8,8,.20),floor)
for i in range(25):
 x=-3.87+i*.315
 box("Individual oak floorboard",(x,0,.0),(.305,8,.009),floor,.002)
box("Painted back wall",(0,3.68,2.4),(8,.15,4.8),plaster)
box("Left accent wall",(-3.95,0,2.4),(.14,8,4.8),dark)
box("White skirting board",(0,3.58,.22),(8,.12,.40),plaster,.01)
box("Wide wool carpet",(.0,-1,.046),(5.3,3.15,.05),rug,.012)
for i in range(900):
 x=-2.58+R.random()*5.1;y=-2.52+R.random()*3.05
 bpy.ops.mesh.primitive_uv_sphere_add(segments=6,ring_count=4,location=(x,y,.079))
 ob=bpy.context.object;ob.name="Short carpet pile tuft"
 ob.scale=(.005,.004,.019);ob.data.materials.append(rug)
# Daylit window, enough material variation.
glass=simple_mat("Window reflected sky",(.49,.67,.77),.05,.12)
box("Window large reflective pane",(1.79,3.48,3.17),(2.50,.06,2.40),glass,.008)
for x in (.53,1.79,3.05):
 box("Window bronze stile",(x,3.36,3.17),(.055,.17,2.47),metal,.008)
for z in (2,3.2,4.40):
 box("Window bronze rail",(1.79,3.35,z),(2.61,.15,.065),metal,.008)
# Minimal decor, real asset should be focus: don't fake an entire set with boxes.
def imported_asset(filepath,name,target_width,target,turn=0):
 before=set(bpy.data.objects)
 bpy.ops.import_scene.gltf(filepath=filepath)
 objects=list(set(bpy.data.objects)-before)
 meshes=[o for o in objects if o.type=="MESH"]
 if not meshes:raise RuntimeError(f"No meshes in asset {filepath}")
 bound=[]
 for o in meshes:
  for p in o.bound_box:bound.append(o.matrix_world@Vector(p))
 mins=[min(p[i] for p in bound) for i in range(3)]
 maxs=[max(p[i] for p in bound) for i in range(3)]
 center=Vector(((mins[0]+maxs[0])/2,(mins[1]+maxs[1])/2,mins[2]))
 width=maxs[0]-mins[0]
 if width<=.001:raise RuntimeError("Bad zero width "+name)
 root=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(root)
 for o in objects:
  if o.parent is None:
   w=o.matrix_world.copy()
   o.parent=root;o.matrix_world=w
 s=target_width/width
 root.matrix_world=Matrix.Translation(Vector(target)) @ Matrix.Rotation(turn,4,'Z') @ Matrix.Scale(s,4) @ Matrix.Translation(-center)
 for m in meshes:
  for polygon in m.data.polygons:polygon.use_smooth=True
  m.cycles_visibility.camera=True
 print("ASSET_IMPORT",name,"meshes",len(meshes),"vertices",sum(len(o.data.vertices) for o in meshes),
       "dimension_m",tuple(round(maxs[i]-mins[i],3) for i in range(3)),
       "scale",round(s,4),flush=True)
 return root
sofa=imported_asset(SOFA,"REAL SCANNED PBR SOFA",2.7,(-.60,1.1,.0),turn=math.pi)
if FOX:
 fox=imported_asset(FOX,"FURSUIT HELMET ON UPHOLSTERY",.77,(-.62,1.10,.83),turn=math.pi)
# Add believable small interior details.
bpy.ops.mesh.primitive_cylinder_add(vertices=56,radius=.28,depth=.42,location=(2.54,1.43,.26))
plantpot=bpy.context.object;plantpot.name="Ceramic planter";plantpot.data.materials.append(simple_mat("Matte clay",(.44,.37,.30),0,.8))
leaf=simple_mat("Plant glossy green",(.06,.23,.09),0,.55)
for i in range(23):
 x=2.54+math.sin(i*2.399)*(.14+.38*R.random())
 y=1.43+math.cos(i*2.399)*(.14+.36*R.random())
 z=.51+.25+R.random()*1.25
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=(x,y,z))
 o=bpy.context.object;o.name="Individual glossy plant leaf";o.scale=(.16,.07,.05)
 o.data.materials.append(leaf)
def illuminate(name,pos,power,color,size,point):
 bpy.ops.object.light_add(type="AREA",location=pos)
 o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color
 o.data.shape="DISK";o.data.size=size
 o.rotation_euler=(Vector(point)-o.location).to_track_quat("-Z","Y").to_euler()
illuminate("Huge cinematic window key",(1,-2.5,5),920,(1,.88,.75),4.2,(-.5,0,1))
illuminate("Cool bounced fill",(-4,-1,3.8),360,(.67,.82,1),3.4,(-.5,0,1))
illuminate("Rear warm rim",(2.6,3.1,4.2),640,(1,.77,.51),2.2,(-.5,0,1))
# Three camera directions to QA actual textures, silhouette and crop.
shots={
 "wide":((3.5,-5.6,3.2),(-.55,.45,1.1),49),
 "sofa":((1.1,-3.5,2.25),(-.54,1.08,1.02),55),
 "close":((.45,-2.2,1.92),(-.56,1.08,1.22),72)
}
for name,(pos,point,lens) in shots.items():
 bpy.ops.object.camera_add(location=pos)
 cam=bpy.context.object;cam.name="Cinematic PBR "+name
 cam.rotation_euler=(Vector(point)-cam.location).to_track_quat("-Z","Y").to_euler()
 cam.data.lens=lens;sc.camera=cam
 sc.render.filepath=os.path.abspath(os.path.join(OUT,name+".png"))
 print("RENDERING",name,flush=True)
 bpy.ops.render.render(write_still=True)
print("COMPLETE",flush=True)
