"""Code-built Blender set look-dev: three NEW vacuum story shots.
No generated images or image planes. Outputs room, fur and punchline samples.
"""
import bpy,math,random,os,argparse,sys
from mathutils import Vector
R=random.Random(91)
p=argparse.ArgumentParser()
argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
p.add_argument("--res",type=int,default=45);p.add_argument("--samples",type=int,default=22)
p.add_argument("--out",default="out/vacuum_story");p.add_argument("--export-model",action="store_true");a=p.parse_args(argv)
bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
sc=bpy.context.scene;sc.render.engine="CYCLES";sc.cycles.samples=a.samples;sc.cycles.use_denoising=True
sc.render.resolution_x=1080;sc.render.resolution_y=1920;sc.render.resolution_percentage=a.res
sc.view_settings.view_transform="AgX";sc.view_settings.look="AgX - Medium High Contrast";sc.view_settings.exposure=.10
def material(name,rgb,rough=.65,metal=0,sub=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
 bs=m.node_tree.nodes.get("Principled BSDF")
 bs.inputs["Base Color"].default_value=(*rgb,1);bs.inputs["Roughness"].default_value=rough
 bs.inputs["Metallic"].default_value=metal
 if sub:bs.inputs["Subsurface Weight"].default_value=sub
 tex=m.node_tree.nodes.new("ShaderNodeTexNoise");tex.inputs["Scale"].default_value=80
 tx=m.node_tree.nodes.new("ShaderNodeTexCoord");m.node_tree.links.new(tx.outputs["Generated"],tex.inputs["Vector"])
 bump=m.node_tree.nodes.new("ShaderNodeBump");bump.inputs["Strength"].default_value=.08;bump.inputs["Distance"].default_value=.017
 m.node_tree.links.new(tex.outputs["Fac"],bump.inputs["Height"]);m.node_tree.links.new(bump.outputs["Normal"],bs.inputs["Normal"])
 return m
wood=material("Oak floor",(.48,.28,.15));plaster=material("Warm wall plaster",(.66,.64,.60))
sofa=material("Textured deep teal woven fabric",(.16,.29,.30),.87)
cream=material("Cream rug",(.75,.66,.52),.98)
blue=material("Original pocket puh saturated cyan blue plush",(.12,.38,.89),.97,sub=.05)
belly=material("Soft pale-blue plush",(.59,.81,.99),.96)
eyes=material("Gloss ceramic white",(.96,.97,1),.12);pupil=material("Gloss pupil",(.016,.025,.047),.08)
iron=material("Dark powdercoated graphite",(.055,.078,.103),.34,.32)
glass=material("Clear plastic tinted",(.49,.79,.89),.12,.08)
leather=material("Warm yellow leather",(.59,.41,.17),.73)
brick=material("Red baked brick",(.48,.23,.17),.82)
plantmat=material("Foliage",(.12,.31,.16),.77)
furblue=material("Loose orange fox fur",(.88,.35,.09),.96)
def add(o,ma):
 o.data.materials.append(ma);return o
def box(n,pos,size,ma,bevel=.05):
 bpy.ops.mesh.primitive_cube_add(size=1,location=pos);o=bpy.context.object;o.name=n;o.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);add(o,ma)
 if bevel:md=o.modifiers.new("fabricated bevel","BEVEL");md.width=min(bevel,min(size)*.35);md.segments=3
 o.modifiers.new("weighted normals","WEIGHTED_NORMAL")
 return o
def sph(n,pos,s,ma,segments=32):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=24,location=pos)
 o=bpy.context.object;o.name=n;o.scale=s;add(o,ma)
 for f in o.data.polygons:f.use_smooth=True
 return o
def cyl(n,pos,r,depth,ma):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=r,depth=depth,location=pos)
 o=bpy.context.object;o.name=n;add(o,ma)
 for f in o.data.polygons:f.use_smooth=True
 return o
def hair(n,pts,ma,thick=.008):
 cu=bpy.data.curves.new(n,"CURVE");cu.dimensions="3D";cu.bevel_depth=thick;cu.bevel_resolution=2
 spl=cu.splines.new("POLY");spl.points.add(len(pts)-1)
 for i,pt in enumerate(pts):spl.points[i].co=(*pt,1)
 o=bpy.data.objects.new(n,cu);bpy.context.collection.objects.link(o);add(o,ma);return o
def point(obj,tar):obj.rotation_euler=(Vector(tar)-obj.location).to_track_quat("-Z","Y").to_euler()
def light(n,pos,power,color,size,tar):
 bpy.ops.object.light_add(type="AREA",location=pos);o=bpy.context.object;o.name=n;o.data.energy=power;o.data.color=color
 o.data.shape="DISK";o.data.size=size;point(o,tar)
def camera(pos,tar,lens):
 bpy.ops.object.camera_add(location=pos);o=bpy.context.object;point(o,tar);o.data.lens=lens;sc.camera=o
def carpet(r=250):
 box("Low pile rug",(0,-1.02,.025),(5.3,3.25,.065),cream)
 for i in range(r):
  x=R.uniform(-2.5,2.5);y=R.uniform(-2.50,.48)
  hair("Physical wool tuft",[(x,y,.07),(x+.008,y+.016,.095),(x+.018,y+.026,.075)],cream,.002)
# Actual dollhouse room 7x7x4.5
box("Individual planks solid substrate",(0,0,-.13),(7.5,7.5,.24),wood)
for i in range(29):
 box("Tongue-and-groove oak plank",(-3.60+i*.256,0,.004),(.25,7.5,.025),wood,.006)
box("Rear solid wall",(0,3.72,2.26),(7.5,.23,4.65),plaster)
box("Left solid wall",(-3.78,0,2.26),(.22,7.5,4.65),plaster)
box("Ceiling perimeter cornice",(0,3.54,4.5),(7.5,.22,.15),cream)
box("Real finished ceiling",(0,0,4.67),(7.5,7.5,.25),plaster)
box("Floor skirting",(0,3.51,.19),(7.5,.15,.28),cream)
# Large glazed sash and physical architecture
box("Timber window frame outer",(1.6,3.51,3.07),(2.8,.11,2.75),cream)
box("City light seen through window",(1.6,3.43,3.10),(2.52,.032,2.5),glass,.008)
for x in (.3,1.61,2.92):box("Window timber mullion",(x,3.36,3.08),(.095,.11,2.7),cream)
for z in (1.8,3.20,4.44):box("Window timber transom",(1.6,3.34,z),(2.78,.11,.095),cream)
# Sofa backrest, arms, legs and upholstered cushions
box("Sofa couch base",(-1.55,1.51,.51),(3.50,1.3,.55),sofa,.20)
box("Backrest",(-1.55,2.02,1.18),(3.50,.30,1.27),sofa,.13)
for x in (-3.29,.18):box("Rolled sofa arm",(x,1.45,.85),(.40,1.47,.99),sofa,.18)
for x in (-2.38,-.73):
 box("Seat cushion",(x,1.32,.93),(1.59,.94,.30),sofa,.14)
 box("Back cushion",(x,1.82,1.48),(1.54,.32,.61),sofa,.13)
for x in (-2.95,-.10):
 for y in (1.10,1.99):box("Tapered oak sofa foot",(x,y,.19),(.12,.13,.37),wood)
sph("Cream accent pillow",(-2.85,1.30,1.27),(.38,.12,.28),belly)
sph("Ochre accent pillow",(-.80,1.32,1.27),(.30,.13,.33),leather)
# Wall mounted bookshelf with real items.
for z in (1.17,1.94,2.71,3.49):
 box("Floating oak shelf",(-2.78,3.25,z),(1.55,.4,.085),wood,.021)
for i in range(42):
 z=1.22+(i%4)*.77+R.uniform(.0,.12);x=-3.42+(i//4)*.135
 size=R.uniform(.085,.14);col=material("Book cloth %02d"%i,
     (.16+.45*R.random(),.22+.32*R.random(),.15+.50*R.random()),.85)
 box("Individual hardback book",(x,3.09,z+.15),(size,.25,.31+R.random()*.22),col,.012)
# Sideboard, pot and plant
box("Walnut coffee tabletop",(.8,.40,.59),(1.6,.82,.12),wood,.07)
for x in (.17,1.44):
 for y in (.04,.75):box("Table tapered leg",(x,y,.27),(.09,.09,.54),wood,.015)
cyl("Plant terracotta pot",(2.8,1.15,.34),.30,.65,brick)
for i in range(24):
 angle=i*2.399;h=.52+R.random()*1.4
 sph("Physical plant leaf",(2.8+.34*math.cos(angle),1.15+.3*math.sin(angle),h),(.23,.10,.08),plantmat,12)
carpet()
# From now on POCKET PUH = orange-and-white WEARABLE FOX FURSUIT HEAD, not a blue plush.
foxOrange=material("Pocket Puh fox helmet orange synthetic fur",(.69,.21,.045),.92)
foxCream=material("Pocket Puh fox helmet white muzzle",(.86,.81,.71),.9)
foxBlack=material("Fox mesh eyes and padded opening",(.015,.021,.025),.52)
foxInner=material("Fox inner ear velvet",(.37,.12,.14),.87)
def foxhelmet(pos=(0,0,0),size=1):
 root=bpy.data.objects.new("FOX_POCKET_PUH_WEARABLE_HELMET",None);bpy.context.collection.objects.link(root)
 root.location=pos;root.scale=(size,)*3
 def parent(ob):
  ob.parent=root;ob.matrix_parent_inverse.identity()
  return ob
 parent(sph("Wearable fox helmet shell",(0,0,.80),(.67,.60,.74),foxOrange))
 parent(sph("Fursuit pale cheek left",(-.40,-.38,.54),(.32,.29,.26),foxCream))
 parent(sph("Fursuit pale cheek right",(.40,-.38,.54),(.32,.29,.26),foxCream))
 for q in (-1,1):
  ear=box("Tapered tall fox ear",(q*.44,-.08,1.52),(.34,.23,.65),foxOrange,.11)
  ear.rotation_euler[1]=-q*.24;parent(ear)
  parent(sph("Deep pink inner ear",(q*.44,-.228,1.53),(.17,.055,.24),foxInner))
  parent(sph("Fursuit shaped socket",(q*.25,-.53,.91),(.195,.12,.195),foxBlack))
  parent(sph("Amber glossy eye",(q*.25,-.65,.91),(.15,.067,.135),eyes))
  parent(sph("Dark iris",(q*.25+.02,-.713,.91),(.077,.025,.080),pupil))
  parent(sph("Long fox muzzle",(q*.13,-.65,.56),(.23,.25,.21),foxCream))
 parent(sph("Black triangular foam nose",(0,-.88,.64),(.16,.13,.10),foxBlack))
 parent(sph("White lower jaw",(0,-.55,.38),(.33,.26,.13),foxCream))
 # Dark wearable neck opening and retaining flange.
 o=cyl("Dark padded wearer neck opening",(0,0,.135),.40,.17,foxBlack);parent(o)
 # Simulated physical fur, not a single texture plane.
 for i in range(580):
  u=R.uniform(-.8,.9);angle=R.uniform(0,2*math.pi);v=math.sqrt(1-u*u)
  x=.67*v*math.cos(angle);y=.60*v*math.sin(angle);z=.80+.74*u
  if y<-.37 and .56<z<1.16:continue
  base=Vector((x,y,z));d=Vector((x/.67**2,y/.60**2,u/.74)).normalized()
  parent(hair("Short orange faux-fur strands",[base,base+d*.02,base+d*.035],foxOrange,.002))
 return root
P=foxhelmet((-1.40,1.16,1.14),.72)

# Loose fur, animated via independent keyframed fibers after scene constructed.
floating=[]
for i in range(230):
 x=R.uniform(-3,3);y=R.uniform(-2.6,2.55);z=R.uniform(.09,2.8)
 o=sph("Airborne blue fur fluff",(x,y,z),(.02,.025,.04),furblue,12)
 floating.append(o)
for i in range(900):
 x=R.uniform(-2.9,2.6);y=R.uniform(-2.50,.20)
 hair("Loose shed fiber on rug",[(x,y,.12),(x+.04,y+.01,.14),(x+.07,y+.04,.13)],furblue,.004)
# Vacuum canister prop, physical hollow shell and clear front window facing camera.
vac=material("Vacuum shell satin",(.06,.10,.14),.28,.35)
root=bpy.data.objects.new("Vacuum_PUNCHLINE",None);bpy.context.collection.objects.link(root)
def vparent(o):o.parent=root;o.matrix_parent_inverse.identity();return o
vparent(box("Vacuum motor body",(0,0,.47),(1.55,.96,.75),vac,.20))
for side in (-1,1):
 o=cyl("Roller wheel",(0,side*.60,.30),.31,.20,iron);o.rotation_euler=(math.pi/2,0,0);vparent(o)
# Clear cutaway cup is physically open toward the camera: no opaque white cylinder.
cup=bpy.data.meshes.new("Clear open-front cylindrical cup")
verts=[];faces=[]
for i in range(66):
 theta=math.radians(18+i*(144/65))
 verts.extend([(.61*math.cos(theta),.61*math.sin(theta),.90),
               (.61*math.cos(theta),.61*math.sin(theta),2.03)])
for i in range(65):faces.append((i*2,i*2+2,i*2+3,i*2+1))
cup.from_pydata(verts,[],faces);cup.update()
cup_ob=bpy.data.objects.new("Polycarbonate open cutaway cup",cup)
bpy.context.collection.objects.link(cup_ob);add(cup_ob,glass);vparent(cup_ob)

vparent(cyl("Vacuum bin bottom black",(0,0,.85),.63,.13,iron))
vparent(cyl("Vacuum bin top orange",(0,0,2.08),.64,.16,leather))




Pcaptured=foxhelmet((1.00,-1.13,.98),.49)
root.location=(1.00,-1.13,0)
# Cinematic integrated lighting, actual geometry, ambient occlusion from path trace
light("Window sun broad softbox",(1.5,-3.2,7),1050,(1,.81,.59),4.2,(0,0,1))
light("Cool blue soft fill",(-4,-1.6,5.2),600,(.55,.76,1),3.3,(-1,1,1))
light("Bright rim light",(1.5,3.2,5.1),650,(.92,.81,.73),3,(-1,1,1))
light("Table lamp glow",(-2.3,2.8,2.5),280,(1,.57,.25),1.8,(-1,1,1))
light("Front beauty key",(0,-3.8,3.4),820,(1.0,.98,.94),3,(-.7,.9,1.15))
views={
 "room":((2.65,-5.25,2.62),(-1.42,1.44,1.26),47),
 "room_wide":((4.2,-7.0,3.25),(-.48,.56,1.38),42),
 "sofa_detail":((.8,-2.65,2.2),(-1.40,1.34,1.42),58),
 "fur":((1.55,-3.62,1.9),(-1.45,1.1,1.55),54),
 "punchline":((2.35,-3.45,2.10),(1,-1.12,1.39),43),
 "bin_close":((1.9,-2.8,1.9),(1,-1.12,1.42),66)
}
if a.export_model:
 out=os.path.abspath(a.out);os.makedirs(out,exist_ok=True)
 # Export realistic furnished room WITHOUT fox, floating hair or payoff vacuum.
 bpy.ops.object.select_all(action="DESELECT")
 for ob in bpy.data.objects:
  if ob.name in _room_meshes and ob.type in ("MESH","CURVE"):
   ob.select_set(True)
 for ob in list(bpy.context.selected_objects):
  if ob.type=="CURVE":
   bpy.ops.object.select_all(action="DESELECT")
   ob.select_set(True);bpy.context.view_layer.objects.active=ob;bpy.ops.object.convert(target="MESH")
 bpy.ops.object.select_all(action="DESELECT")
 for ob in bpy.data.objects:
  if ob.name in _room_meshes and ob.type=="MESH":ob.select_set(True)
 if bpy.context.selected_objects:
  bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.join()
 bpy.ops.export_scene.gltf(filepath=os.path.join(out,"room.glb"),export_format="GLB",use_selection=True,export_apply=True)
 print("EXPORTED LIVE THREE.JS ROOM GLB",flush=True)
else:
 out=os.path.abspath(a.out);os.makedirs(out,exist_ok=True)
 for name,(c,t,l) in views.items():
  def is_child(ob,parent):
   while ob.parent:
    if ob.parent==parent:return True
    ob=ob.parent
   return False
  for ob in bpy.data.objects:
   if is_child(ob,root):ob.hide_render=(name not in ("punchline","bin_close"))
   if is_child(ob,P):ob.hide_render=(name in ("punchline","bin_close"))
   if is_child(ob,Pcaptured):ob.hide_render=(name not in ("punchline","bin_close"))
  for ob in floating:ob.hide_render=(name in ("punchline","bin_close"))
  for ob in bpy.data.objects:
   if ob.name.startswith("Loose shed fiber"):ob.hide_render=(name in ("punchline","bin_close"))
  camera(c,t,l)
  sc.render.filepath=os.path.join(out,name+".png")
  print("RENDER",name,sc.render.filepath,flush=True)
  bpy.ops.render.render(write_still=True)
 print("DONE")
 