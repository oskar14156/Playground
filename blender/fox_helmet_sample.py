"""Blender code-only sample: wearable faux-fur fox fursuit head on workshop mannequin.
Usage: blender -b -P blender/fox_helmet_sample.py -- --res 48 --samples 24
"""
import bpy,math,random,sys,argparse,os
from mathutils import Vector
r=random.Random(2028);ap=argparse.ArgumentParser();av=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
ap.add_argument("--res",type=int,default=48);ap.add_argument("--samples",type=int,default=24)
ap.add_argument("--out",default="out/fox_helmet");ap.add_argument("--export-model",action="store_true");ap.add_argument("--export-lite",action="store_true");opts=ap.parse_args(av)
bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
sc=bpy.context.scene;sc.render.engine="CYCLES";sc.cycles.samples=opts.samples;sc.cycles.use_denoising=True
sc.render.resolution_x=1080;sc.render.resolution_y=1920;sc.render.resolution_percentage=opts.res
sc.view_settings.view_transform="AgX";sc.view_settings.look="AgX - Medium High Contrast"
sc.view_settings.exposure=-1.05
def mat(n,c,rough=.6,metal=0):
 m=bpy.data.materials.new(n);m.use_nodes=True;m.diffuse_color=(*c,1)
 p=m.node_tree.nodes.get("Principled BSDF");p.inputs["Base Color"].default_value=(*c,1);p.inputs["Roughness"].default_value=rough;p.inputs["Metallic"].default_value=metal
 if "Sheen Weight" in p.inputs and "Fur" in n:p.inputs["Sheen Weight"].default_value=.5
 return m
orange=mat("Fur / burnt fox orange",(.55,.09,.012),.94)
light=mat("Fur / golden orange",(.72,.25,.045),.92)
ivory=mat("Fur / warm white",(.87,.82,.74),.93)
inner=mat("Ear interior dusty rose",(.38,.12,.14),.91)
black=mat("Matte black nose and muzzle line",(.022,.026,.033),.59)
blue=mat("Furry bright ice blue iris",(.10,.50,.68),.27)
eye=mat("Glassy amber sclera",(.93,.84,.67),.14)
foam=mat("Helmet inner EVA padding dark foam",(.04,.05,.058),.91)
metal=mat("Nickel studio fittings",(.44,.51,.54),.26,.8)
oak=mat("Oak workbench",(.35,.20,.105),.62)
wall=mat("Warm studio backdrop",(.24,.25,.26),.87)
def assign(o,m):o.data.materials.append(m);return o
def sphere(n,loc,scales,m,segments=40):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=28,location=loc);o=bpy.context.object;o.name=n;o.scale=scales;assign(o,m)
 for q in o.data.polygons:q.use_smooth=True
 return o
def box(n,loc,dims,m,bevel=.03):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.dimensions=dims
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);assign(o,m)
 if bevel:
  mod=o.modifiers.new("soft edges","BEVEL");mod.width=min(bevel,min(dims)*.3);mod.segments=4
 o.modifiers.new("weighted normals","WEIGHTED_NORMAL");return o
def curve(n,pts,m,width=.007):
 cu=bpy.data.curves.new(n,"CURVE");cu.dimensions="3D";cu.bevel_depth=width;cu.bevel_resolution=2
 spl=cu.splines.new("POLY");spl.points.add(len(pts)-1)
 for i,p in enumerate(pts):spl.points[i].co=(*p,1)
 o=bpy.data.objects.new(n,cu);bpy.context.collection.objects.link(o);assign(o,m);return o
def aim(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat("-Z","Y").to_euler()
def lightlamp(n,pos,power,color,size,t):
 bpy.ops.object.light_add(type="AREA",location=pos);o=bpy.context.object;o.name=n;o.data.energy=power;o.data.color=color;o.data.shape="DISK";o.data.size=size;aim(o,t)
# Workbench and stand, proper grounded props.
box("large workshop table",(0,0,.10),(4.7,3.4,.18),oak,.06)
for x in (-1.8,1.8):
 for y in (-1.25,1.25):box("workbench leg",(x,y,-.65),(.15,.15,1.46),metal,.018)
bpy.ops.mesh.primitive_cylinder_add(vertices=56,radius=.34,depth=.065,location=(0,0,.27))
assign(bpy.context.object,metal)
bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.065,depth=1.12,location=(0,0,.85))
assign(bpy.context.object,metal)
# Stand mannequin is visible below neck opening, confirming helmet scale.
sphere("Mannequin shoulderless neck foam",(0,0,1.29),(.22,.19,.35),foam)
_fox_before=set(bpy.data.objects.keys())
# Fox mask designed as a WEARABLE shell: actual open underside and thin interior.
# Construct an ellipsoidal outer shell omitting lower rings, solidify thickness,
# so a viewer can see the dark hollow interior through the rear/bottom opening.
verts=[];faces=[];nt=64;nphi=32
for i in range(nphi+1):
 theta=.02+(math.pi-.37)*i/nphi
 for j in range(nt):
  phi=2*math.pi*j/nt
  verts.append((.65*math.sin(theta)*math.cos(phi),.58*math.sin(theta)*math.sin(phi),1.92+.77*math.cos(theta)))
for i in range(nphi):
 for j in range(nt):
  a=i*nt+j;b=i*nt+(j+1)%nt;c=(i+1)*nt+(j+1)%nt;d=(i+1)*nt+j
  mid=[verts[q] for q in (a,b,c,d)]
  cy=sum(v[1] for v in mid)/4;cz=sum(v[2] for v in mid)/4
  if cy>.19 and 1.39<cz<2.40:continue  # actual rear entry opening
  faces.append((a,b,c,d))
me=bpy.data.meshes.new("Wearable hollow foam shell mesh");me.from_pydata(verts,[],faces);me.update()
o=bpy.data.objects.new("HOLLOW FOX HELMET SHELL / OPEN NECK",me);bpy.context.collection.objects.link(o);assign(o,orange)
for face in me.polygons:face.use_smooth=True
solid=o.modifiers.new("Molded wearable foam wall","SOLIDIFY");solid.thickness=.032
# Deep dark interior through open back.
sphere("Interior black acoustic mesh",(0,.03,1.94),(.53,.49,.66),foam)
# Separate raised brows, cheeks and snout.
for sgn in (-1,1):
 sphere("Fox cheek faux fur",(sgn*.46,-.32,1.77),(.30,.32,.30),light)
 sphere("White lower cheek patch",(sgn*.35,-.48,1.62),(.29,.20,.21),ivory)
 sphere("Padded brow ridge",(sgn*.275,-.45,2.17),(.34,.15,.12),orange)
 # Eye sockets and fitted mesh eyes; shape eyewear facing camera y=-.
 sphere("Eye inlay/socket",(sgn*.275,-.562,2.07),(.215,.105,.198),black)
 sphere("Light eye",(sgn*.275,-.655,2.07),(.159,.065,.143),eye)
 sphere("Blue pupil",(sgn*.275+sgn*.017,-.716,2.055),(.067,.027,.092),blue)
 sphere("Black slit pupil",(sgn*.275+sgn*.017,-.741,2.054),(.019,.012,.083),black)
 sphere("Eye highlight",(sgn*.275-.045,-.743,2.106),(.027,.011,.028),ivory)
# Tapered long foxy ears formed from thick lofted triangle mesh front/back with inset panel.
def ear(name,sgn,matl,scale=1):
 x=sgn*.43
 outer=[(x-sgn*.25,-.10,2.48),(x+sgn*.035,-.04,3.17),(x+sgn*.32,-.10,2.48)]
 verts=outer+[(px,py+.18,pz-.04) for px,py,pz in outer]
 polys=[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(2,5,3,0)]
 m=bpy.data.meshes.new(name);m.from_pydata(verts,[],polys);m.update()
 ob=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(ob);assign(ob,matl)
 be=ob.modifiers.new("Soft ear rim bevel","BEVEL");be.width=.045;be.segments=3
 ob.modifiers.new("Weighted normals","WEIGHTED_NORMAL")
 return ob
for side in (-1,1):
 ear("Long upright fursuit fox ear",side,orange)
 # inset pink ears on near (-Y) surface, clearly separate geometry
 center=side*.43
 verts=[(center-side*.14,-.126,2.54),(center+side*.025,-.09,2.97),(center+side*.195,-.126,2.54)]
 m=bpy.data.meshes.new("Inner ear velvet");m.from_pydata(verts,[],[(0,1,2)]);m.update()
 ob=bpy.data.objects.new("Pink padded ear interior",m);bpy.context.collection.objects.link(ob);assign(ob,inner)
# Long clearly vulpine muzzle: two fluffy bulges, wedge nose, bottom jaw and smile.
sphere("Fox cream bridge",(0,-.51,1.86),(.255,.25,.26),ivory)
for sg in (-1,1):sphere("Left right white snout",(sg*.165,-.76,1.67),(.25,.27,.18),ivory)
sphere("Nose triangular black plush",(0,-1.005,1.765),(.175,.13,.11),black)
sphere("Lower fox jaw",(0,-.68,1.46),(.36,.27,.11),ivory)
curve("Stitched smile left",[(-.15,-.927,1.56),(-.10,-.96,1.52),(0,-.97,1.51)],black,.011)
curve("Stitched smile right",[(0,-.97,1.51),(.12,-.95,1.53),(.23,-.89,1.57)],black,.011)
# Fine fur tufts, aligned to ellipsoid normals and limited to tiny length (not spikes).
for i in range(1750):
 u=r.uniform(-.91,.93);ang=r.uniform(0,2*math.pi)
 v=math.sqrt(1-u*u);px=.65*v*math.cos(ang);py=.58*v*math.sin(ang);pz=1.92+.77*u
 if py < -.41 and 1.66<pz<2.26:continue
 if py>.15 and 1.39<pz<2.42:continue  # Keep eyes/snout unobscured
 direction=Vector((px/.65**2,py/.58**2,(pz-1.92)/.77**2)).normalized()
 start=Vector((px,py,pz))
 end=start+direction*r.uniform(.014,.039)
 curve("Short directionally combed artificial fur strand",[start,start+(end-start)*.55,end],orange if i%3 else light,.0014)
# Interior ring, retaining pads and adjustable fabric strap: recognizable wearability.
for i in range(2):
 zz=1.37+i*.12
 pts=[(.41*math.cos(2*math.pi*j/48),.37*math.sin(2*math.pi*j/48),zz) for j in range(49)]
 curve("Foam brow/neck comfort ring",pts,foam,.045)
curve("Adjustable chin strap",[(-.36,-.25,1.42),(-.33,-.4,1.25),(0,-.46,1.16),(.33,-.4,1.25),(.36,-.25,1.42)],foam,.027)
box("Clip-on adjustable buckle",(.21,-.45,1.25),(.11,.05,.075),metal,.012)
_fox_meshes=set(bpy.data.objects.keys())-_fox_before
# Extra useful believable detail on table: fabric swatches, tailor's tape, cutting scissors handle
box("Fur fabric sample swatch",(1.12,-.25,.23),(.65,.95,.045),orange,.017)
for i in range(70):
 x=.82+r.random()*.58;y=-.65+r.random()*.85
 curve("Sample fur pile",[(x,y,.26),(x+.015,y+.018,.30)],light,.0024)
box("Fox helmet interior detail card",(-1.2,-.1,.23),(.74,.9,.025),ivory,.01)
box("Wall rear studio plane",(0,4,2.0),(8,.1,5),wall,.0)
box("Floor behind workbench",(0,0,-1.45),(12,12,.10),wall,.0)
lightlamp("Warm front soft key",(-3,-4.7,5.8),560,(1,.85,.72),4,(0,0,2))
lightlamp("Cool rim",(3.7,2.0,4.9),620,(.52,.79,1),3,(0,0,2.1))
lightlamp("Top white softbox",(0,-1.1,6.2),740,(1,.97,.91),3.2,(0,0,2))
lightlamp("Camera fill",(1,-5.0,3.5),260,(.75,.85,1),2.9,(0,0,1.8))
views={
 "front":((3.05,-6.7,3.38),(0,-.10,1.93),48),
 "threequarter":((-3.8,-5.2,3.1),(0,-.05,2.01),48),
 "wearable":((1.56,3.42,2.47),(0,0,1.84),49)
}
if opts.export_model:
 os.makedirs(opts.out,exist_ok=True)
 def keep_preview_geometry(ob):
  if not opts.export_lite or ob.type=="MESH":return True
  if not ob.name.startswith("Short directionally combed artificial fur strand"):return True
  suffix=ob.name.rsplit(".",1)[-1]
  return suffix.isdigit() and int(suffix)%10==0
 bpy.ops.object.select_all(action="DESELECT")
 for ob in bpy.data.objects:
  if ob.name in _fox_meshes and ob.type in ("MESH","CURVE") and keep_preview_geometry(ob):
   ob.select_set(True)
 for ob in list(bpy.context.selected_objects):
  if ob.type=="CURVE":
   bpy.ops.object.select_all(action="DESELECT");ob.select_set(True);bpy.context.view_layer.objects.active=ob
   bpy.ops.object.convert(target="MESH")
 bpy.ops.object.select_all(action="DESELECT")
 for ob in bpy.data.objects:
  if ob.name in _fox_meshes and ob.type=="MESH":ob.select_set(True)
 # Many individual fibers are combined into a single rig model for efficient WebGL drawing.
 if bpy.context.selected_objects:
  bpy.context.view_layer.objects.active=bpy.context.selected_objects[0]
  bpy.ops.object.join()
  if opts.export_lite:
   target=bpy.context.view_layer.objects.active
   modifier=target.modifiers.new("Lightweight animated video LOD","DECIMATE")
   modifier.ratio=0.6
   bpy.ops.object.modifier_apply(modifier=modifier.name)
 bpy.ops.export_scene.gltf(filepath=os.path.abspath(os.path.join(opts.out,"fox_helmet.glb")),export_format="GLB",use_selection=True,export_apply=True)
 print("EXPORTED LIVE THREE.JS FOX HELMET GLB",flush=True)
else:
 os.makedirs(opts.out,exist_ok=True)
 for name,(pos,t,lens) in views.items():
  bpy.ops.object.camera_add(location=pos);cam=bpy.context.object;cam.name="Shot "+name;cam.data.lens=lens;aim(cam,t);sc.camera=cam
  sc.render.filepath=os.path.abspath(os.path.join(opts.out,name+".png"))
  print("RENDER",name,sc.render.filepath,flush=True);bpy.ops.render.render(write_still=True)
 print("DONE")
