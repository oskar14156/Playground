"""
Pocket Puh / Vacuum V3: Blender hard-surface product and cyclone look development.
ALL geometry, lighting and airflow particles are code-generated in Blender.
Not an image-plane scene, not generated still imagery. Renders three camera studies.

Command: blender -b -P blender/vacuum_hero.py -- --res 45 --samples 24
Outputs: out/vacuum_blender/hero.png, cyclone.png, brush.png.
"""
import bpy, math, random, os, sys, argparse
from mathutils import Vector

ap=argparse.ArgumentParser()
argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
ap.add_argument("--res",type=int,default=48)
ap.add_argument("--samples",type=int,default=22)
ap.add_argument("--shot",default="all")
ap.add_argument("--out",default="out/vacuum_blender")
ap.add_argument("--quality",default="draft")
a=ap.parse_args(argv)
R=random.Random(23)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for x in bpy.data.materials: bpy.data.materials.remove(x)
sc=bpy.context.scene
sc.render.engine="CYCLES"
sc.cycles.samples=a.samples
sc.cycles.use_denoising=True
sc.render.resolution_x=1080
sc.render.resolution_y=1920
sc.render.resolution_percentage=a.res
sc.render.image_settings.file_format="PNG"
sc.render.film_transparent=False
sc.render.film_transparent=False
sc.view_settings.view_transform="AgX"
sc.view_settings.look="AgX - Medium High Contrast"
sc.camera=None

def mat(name, c, metal=0, rough=.36, transmission=0, emission=0,coat=.0):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*c,1);m.use_nodes=True
    p=m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value=(*c,1)
    p.inputs["Metallic"].default_value=metal
    p.inputs["Roughness"].default_value=rough
    if "Transmission Weight" in p.inputs: p.inputs["Transmission Weight"].default_value=transmission
    if "Coat Weight" in p.inputs: p.inputs["Coat Weight"].default_value=coat
    if name.startswith(("01 ","02 ","04 ")):
        tex=m.node_tree.nodes.new("ShaderNodeTexNoise")
        coords=m.node_tree.nodes.new("ShaderNodeTexCoord")
        m.node_tree.links.new(coords.outputs["Generated"],tex.inputs["Vector"])
        tex.inputs["Scale"].default_value=230 if name.startswith("01 ") else 90
        tex.inputs["Detail"].default_value=2
        bump=m.node_tree.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value=.085 if name.startswith("02 ") else .04
        bump.inputs["Distance"].default_value=.011
        m.node_tree.links.new(tex.outputs["Fac"],bump.inputs["Height"])
        m.node_tree.links.new(bump.outputs["Normal"],p.inputs["Normal"])
    if emission:
        p.inputs["Emission Color"].default_value=(*c,1)
        p.inputs["Emission Strength"].default_value=emission
    return m
graphite=mat("01 Graphite anodized aluminium",(.031,.046,.067),.83,.28,coat=.18)
rubber=mat("02 Rubber and silicone",(.022,.031,.041),.05,.81)
chrome=mat("03 Brushed silver alloy",(.55,.67,.73),.91,.18)
steel=mat("04 Satin gunmetal",(.17,.24,.31),.89,.25)
glass=mat("05 Tinted polycarbonate",(.58,.86,.95),.08,.085,.62,.0,.30)
accent=mat("06 Pearl orange ceramic",(.94,.36,.09),.56,.28,coat=.36)
accent_dark=mat("07 Warm inner copper",(.45,.15,.07),.82,.24)
cyan=mat("08 Flow diagnostic",(.08,.71,.99),.05,.18,emission=5)
cyan_soft=mat("09 Flow glow",(.12,.44,.92),.0,.3,emission=1.5)
white=mat("10 Porcelain white details",(.75,.86,.86),.24,.29)
fluff=mat("11 Blue plush fibers",(.04,.24,.88),.0,.88)
gold=mat("12 Motor windings",(.9,.49,.17),.74,.3)
floor=mat("13 Slate backdrop",(.035,.058,.077),.13,.33)
line=mat("14 Hairline LED",(.03,.66,.79),.1,.27,emission=2.2)

def link(o, m):
    o.data.materials.append(m)
    return o
def bevel(o,w=.04,segments=3):
    md=o.modifiers.new("CNC edge highlight / machined fillet","BEVEL")
    md.width=w;md.segments=segments
    md.affect="EDGES"
    n=o.modifiers.new("Weighted machined normals","WEIGHTED_NORMAL")
    n.keep_sharp=True
    return o
def cube(name,loc,scale,m,fillet=.04):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object;o.name=name
    o.dimensions=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    link(o,m)
    if fillet: bevel(o,min(fillet, min(scale)*.4))
    return o
def cyl(name,loc,rad,depth,m,vertices=72,rot=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=rad,depth=depth,location=loc)
    o=bpy.context.object;o.name=name
    if rot is not None: o.rotation_euler=rot
    link(o,m); bevel(o,min(depth*.16,.025),2)
    for face in o.data.polygons: face.use_smooth=True
    return o
def ring(name,loc,r,minor,m,rot=None):
    bpy.ops.mesh.primitive_torus_add(major_segments=72,minor_segments=10,location=loc,
                                     major_radius=r,minor_radius=minor)
    o=bpy.context.object;o.name=name
    if rot is not None: o.rotation_euler=rot
    link(o,m)
    for face in o.data.polygons: face.use_smooth=True
    return o
def sphere(name,loc,size,m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=12,radius=1,location=loc)
    o=bpy.context.object;o.name=name;o.scale=size
    link(o,m)
    for face in o.data.polygons:face.use_smooth=True
    return o
def curve(name,points,matl,width=.014,cyclic=False):
    cu=bpy.data.curves.new(name,"CURVE");cu.dimensions="3D";cu.resolution_u=12
    cu.bevel_depth=width;cu.bevel_resolution=3
    sp=cu.splines.new("POLY");sp.points.add(len(points)-1)
    for i,pt in enumerate(points): sp.points[i].co=(*pt,1)
    sp.use_cyclic_u=cyclic
    o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);link(o,matl)
    return o
def bolthead(name,loc,rot=(0,0,0)):
    o=cyl(name,loc,.035,.019,chrome,12,rot)
    return o
def text3(name,string,location,size=.10,material=white,rotation=(math.pi/2,0,0)):
    cu=bpy.data.curves.new(name,"FONT");cu.body=string;cu.size=size;cu.extrude=.002;cu.bevel_depth=.0015
    o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.location=location;o.rotation_euler=rotation;link(o,material)
    return o
def point_at(o,target): o.rotation_euler=(Vector(target)-o.location).to_track_quat("-Z","Y").to_euler()
def area(name,loc,power,color,shape,size,target,size_y=None):
    bpy.ops.object.light_add(type="AREA",location=loc)
    o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color
    o.data.shape=shape;o.data.size=size
    if size_y and shape=="RECTANGLE":o.data.size_y=size_y
    point_at(o,target)
    return o
def mesh_shell(name,rad,z_bottom,z_top,opening=(23,157),matl=glass,center=(0,0)):
    # Segmented 300-degree wall physically opens towards camera (+Y), revealing internals.
    verts=[];faces=[]
    ts=[math.radians(deg) for deg in range(opening[1],opening[0]+360+1,3)]
    for t in ts:
        verts.extend([(rad*math.cos(t),rad*math.sin(t),z_bottom),
                      (rad*math.cos(t),rad*math.sin(t),z_top)])
    for i in range(len(ts)-1):
        j=i*2;faces.append((j,j+2,j+3,j+1))
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.location=(center[0],center[1],0);link(o,matl)
    solid=o.modifiers.new("molded shell thickness","SOLIDIFY");solid.thickness=.013
    bev=o.modifiers.new("edge polish","BEVEL");bev.width=.006;bev.segments=2
    for f in me.polygons:f.use_smooth=True
    return o

# Environment: art-directed midnight studio with a glossy floor and distant panel lights.
cube("Seamless exhibition platform",(0,0,-.20),(12,11,.28),floor,.05)
for x in (-5.7,5.7):
    cube("backdrop cove",(x,1.8,2.7),(.22,12,5.9),graphite,.08)
cube("backdrop wall",(0,5.65,2.7),(12,.20,6),graphite,.03)
cube("vertical cyan light strip",(-5.45,5.48,2.45),(.035,.06,4.5),cyan_soft,.006)
cube("vertical amber light strip",(5.45,5.48,2.45),(.035,.06,4.5),accent,.006)
for k in range(6):
    cube("recessed floor inlay %d"%k,(-3.7+k*1.48,1.4,-.045),(.018,5,.006),steel,.004)
area("Key softbox",(-3.8,-4.0,7.8),1400,(.81,.92,1.0),"RECTANGLE",5,(0,0,1.2),3)
area("Warm edge reflection",(5.0,1.1,5.2),1000,(1,.65,.43),"RECTANGLE",3,(0,0,1.35),5)
area("Cool top strip",(.25,4.1,6.6),1550,(.42,.79,1),"RECTANGLE",4,(0,0,1.2),2)
area("Soft frontal",(1,-5.2,3.6),650,(.75,.86,1),"RECTANGLE",4,(0,0,1.2),5)
sc.world.color=(.075,.075,.075)
sc.render.film_transparent=False

# Compact high-end canister vacuum body: caster chassis, 6 spoke wheel and molded housing.
cube("Chassis carbon composite",(.23,.22,.38),(2.7,1.32,.46),graphite,.21)
cube("Undertray satin metal",(.24,.15,.17),(2.95,1.53,.12),steel,.065)
for side in (-1,1):
    y=side*.80
    cyl("Main rubber wheel",(1.00,y,.36),.36,.23,rubber,64,(math.pi/2,0,0))
    cyl("Satin wheel dish",(1.00,y+side*.128,.36),.228,.025,steel,52,(math.pi/2,0,0))
    for k in range(8):
        ang=2*math.pi*k/8
        cyl("Wheel aerospoke",(1+.14*math.cos(ang),y+side*.15,.36+.14*math.sin(ang)),.025,.026,chrome,16,(math.pi/2,0,0))
    cyl("Hollow wheel center",(1.00,y+side*.165,.36),.052,.035,chrome,24,(math.pi/2,0,0))
# Small underside casters
for x in (-.90,.05):
    for y in (-.5,.5):sphere("Undertray mount",(x,y,.11),(.09,.09,.09),rubber)

# CYCLONE: main physical transparent shell, deep conical core, separator vanes, fasteners.
cx=-.49;cy=.14
cyl("Collection base",(cx,cy,.65),.61,.18,graphite)
cyl("Container orange bottom rim",(cx,cy,.78),.622,.065,accent)
cyl("Cyclone top machined silver cap",(cx,cy,2.57),.65,.16,chrome)
cyl("Cap blue black accent",(cx,cy,2.65),.58,.055,graphite)
mesh_shell("Cutaway polycarbonate cup",.61,.80,2.52, (203,337),glass,(cx,cy))
for z in (.86,1.02,1.80,2.45):
    # Open-front rings match the missing front segment, no rings hiding the section.
    points=[]
    for deg in range(337,563,4):
        th=math.radians(deg)
        points.append((cx+.615*math.cos(th),cy+.615*math.sin(th),z))
    curve("Transparent chamber seam "+str(z),points,chrome,.012)
for i in range(12):
    ang=2*math.pi*i/12
    x=cx+.54*math.cos(ang);y=cy+.54*math.sin(ang)
    cyl("Lid fastener %02d"%i,(x,y,2.68),.028,.026,steel,12)

# Internal true cone, no opaque cover masking the core.
bpy.ops.mesh.primitive_cone_add(vertices=72,radius1=.17,radius2=.44,depth=1.24,location=(cx,cy,1.59))
co=bpy.context.object;co.name="Cyclone tapered separation funnel";link(co,steel)
co.modifiers.new("Cone bevel","BEVEL").width=.015
for f in co.data.polygons:f.use_smooth=True
cyl("Central clean-air vortex finder",(cx,cy,2.12),.125,.7,graphite)
cyl("Central vortex guide rim",(cx,cy,2.38),.18,.025,accent)
for i in range(9):
    ang=i*math.pi*2/9
    # Actual helical inlet guide vanes at top of separator.
    pts=[]
    for j in range(13):
        t=j/12;theta=ang+t*1.45
        pts.append((cx+(.28+.10*t)*math.cos(theta),cy+(.28+.10*t)*math.sin(theta),2.44-.28*t))
    curve("Stationary helical guide vane",pts,accent_dark,.021)
# Tangential inlet duct on near side of container and into impeller.
curve("Intake air route rubber",[
    (-2.5,-1.33,.35),(-1.95,-1.27,.43),(-1.6,-1.1,.85),(-1.53,-.82,1.37),(-1.2,-.70,2.24),(-.84,-.55,2.35)],rubber,.18)
curve("Coaxial molded hose rim",[(-2.6,-1.34,.35),(-2.33,-1.33,.36)],steel,.205)
for k in range(19):
    t=k/18
    x=-1.95+(.42*t);y=-1.27+.45*t;z=.43+.94*t
    ring("Hose ribs", (x,y,z),.185,.012,steel,rot=(.16,-.35,0))

# Particle flow: blue fibers and cyan helical tracer at different radii,
# clear-air return is central, orange mass settles in the base.
for k in range(2):
    pts=[]
    for j in range(175):
        t=j/174
        theta=(k*math.pi)+t*math.pi*4.7
        r=.48-.035*t
        pts.append((cx+r*math.cos(theta),cy+r*math.sin(theta),2.35-1.24*t))
    curve("Tangential illuminated airflow path %d"%k,pts,cyan if k==0 else cyan_soft,.009 if k else .016)
for k in range(3):
    pts=[]
    for j in range(70):
        t=j/69
        ang=k*2.1+t*math.pi*2.8
        pts.append((cx+.11*math.cos(ang),cy+.11*math.sin(ang),1.24+1.18*t))
    curve("Filtered return vortex",pts,line,.010)
for i in range(230):
    ang=R.uniform(0,2*math.pi);r=R.uniform(.25,.48);z=R.uniform(.83,1.06)
    # individual curved fur fibers, not rocks or beads
    pts=[]
    for j in range(4):
        u=j/3
        pts.append((cx+r*math.cos(ang)+.014*u,cy+r*math.sin(ang)+.007*u,z+.014*u+.005*math.sin(u*6+ang)))
    curve("Collected blue lint fiber %03d"%i,pts,fluff,.0025)
for i in range(130):
    a0=R.uniform(-math.pi,math.pi);r=R.uniform(.20,.44);z=R.uniform(1.24,2.30)
    theta=a0+z*4.5
    sphere("Suspended fur mote",(cx+r*math.cos(theta),cy+r*math.sin(theta),z),(.012,.008,.014),fluff)

# Exhaust filter to right: pleated HEPA cartridge, ribbed structural frame.
filter_x=.85;filter_y=.14;filter_z=1.60
cyl("Filter cylinder external rings",(filter_x,filter_y,filter_z),.36,.75,steel,56,(math.pi/2,0,0))
cyl("Filter pleated medium",(filter_x,filter_y+.415,filter_z),.305,.065,white,56,(math.pi/2,0,0))
for i in range(44):
    th=2*math.pi*i/44
    x=filter_x+.255*math.cos(th);z=filter_z+.255*math.sin(th)
    curve("Physical folded HEPA pleat",[ (filter_x,filter_y+.46,filter_z),
        (x,filter_y+.46,z)], white,.005)
ring("Filter housing steel halo",(filter_x,filter_y+.456,filter_z),.352,.026,chrome,rot=(math.pi/2,0,0))
curve("Separator clean air duct",[(cx,cy,2.64),(-.1,.26,2.86),(.77,.26,2.63),
                                   (filter_x,filter_y,2.01)],graphite,.13)
curve("Clean air visible route",[(cx,cy,2.73),(-.12,.29,2.89),(.79,.29,2.63),
                                   (filter_x,filter_y,2.01)],cyan_soft,.021)
# MOTOR: stator stack, copper windings, axle, 9 true curved blade shapes.
mx=1.55;my=.28;mz=1.02
cyl("Motor deep chassis",(mx,my,mz),.48,.72,graphite,64,(math.pi/2,0,0))
for k in range(13):
    yy=my-.33+k*.055
    ring("Machined motor cooling fin", (mx,yy,mz),.48,.016,steel,rot=(math.pi/2,0,0))
for i in range(19):
    ang=2*math.pi*i/19
    x=mx+.36*math.cos(ang);z=mz+.36*math.sin(ang)
    ring("Copper winding exposed", (x,my-.1,z),.082,.020,gold,rot=(math.pi/2,0,0))
cyl("Motor face shiny bearing",(mx,my-.45,mz),.40,.12,chrome,64,(math.pi/2,0,0))
cyl("Motor axle",(mx,my-.56,mz),.08,.3,graphite,36,(math.pi/2,0,0))
for i in range(9):
    ang=i*math.pi*2/9
    pts=[]
    for j in range(7):
        t=j/6
        th=ang+.5*t
        r=.10+.26*t
        pts.append((mx+r*math.cos(th),my-.64-.012*math.sin(t*math.pi),mz+r*math.sin(th)))
    # Blade has visible width, lift and curvature, not a flat box.
    vv=[]
    for p in pts:vv.append((p[0],p[1],p[2]))
    for p in pts:vv.append((p[0],p[1]-.042,p[2]+.052))
    ff=[]
    for j in range(len(pts)-1):ff.append((j,j+1,j+1+len(pts),j+len(pts)))
    me=bpy.data.meshes.new("Swept turbine blade");me.from_pydata(vv,[],ff);me.update()
    o=bpy.data.objects.new("Sculpted impeller blade %02d"%i,me);bpy.context.collection.objects.link(o);link(o,accent)
    so=o.modifiers.new("rolled titanium edge","SOLIDIFY");so.thickness=.015
    bv=o.modifiers.new("polished edges","BEVEL");bv.width=.007;bv.segments=2
ring("Impeller protective edge",(mx,my-.57,mz),.46,.035,chrome,(math.pi/2,0,0))
for i in range(8):
    th=i*math.pi/4
    bolthead("Motor cover torx", (mx+.44*math.cos(th),my-.61,mz+.44*math.sin(th)),(math.pi/2,0,0))
# Motor housing rear exhaust and display
cube("Copper outlet manifold",(1.67,.77,1.75),(.66,.70,.20),accent_dark,.055)
curve("Filtered air outlet",[(1.7,.85,1.8),(2.05,.9,1.92),(2.33,1.10,2.04)],graphite,.15)
for i in range(5):
    cyl("Exhaust perforation",(2.35,1.1,1.95+i*.045),.015,.025,chrome,16,(math.pi/2,0,0))
cube("Status indicator housing",(1.70,-.47,.55),(.49,.10,.24),chrome,.05)
cube("Status cyan display",(1.70,-.531,.55),(.37,.012,.13),cyan_soft,.018)
text3("Machine model marking","VORTEX / 01",(-.32,-.69,.37),.13,white)
text3("Brand microtext","CYCLONE",(-.67,-.58,2.66),.095,accent)
# Lower front nozzle: remove opaque box and model only a rounded open-front frame.
# The exposed brush axle and bristles MUST be visible to the near-side camera.
cube("Nozzle rear manifold",(-2.55,-.89,.30),(1.46,.25,.39),graphite,.065)
cube("Nozzle left cheek",(-3.26,-1.31,.29),(.14,.76,.35),steel,.06)
cube("Nozzle right cheek",(-1.84,-1.31,.29),(.14,.76,.35),steel,.06)
cube("Nozzle chrome upper rail",(-2.55,-1.0,.48),(1.3,.12,.07),chrome,.025)
# The near-side shell is intentionally REMOVED for the educational cutaway.
cube("Nozzle cyan work light",(-2.55,-1.70,.52),(1.1,.020,.027),cyan_soft,.005)
cyl("Brush roller barrel",(-2.55,-1.45,.28),.123,1.12,accent_dark,48,(0,math.pi/2,0))
for i in range(44):
    x=-3.075+(i/43)*1.05
    for j in range(11):
        ang=2*math.pi*j/11+i*.29
        p0=(x,-1.45+.118*math.cos(ang),.28+.118*math.sin(ang))
        p1=(x+.018,-1.45+.21*math.cos(ang),.28+.21*math.sin(ang))
        p2=(x+.027,-1.45+.24*math.cos(ang+.17),.28+.24*math.sin(ang+.17))
        curve("Spiral colored brush bristles",[p0,p1,p2],
              accent if j%4<2 else fluff,.0042)
for x in (-3.11,-1.99):
    cyl("Brush end bearing",(x,-1.45,.28),.135,.035,chrome,24,(0,math.pi/2,0))
for i in range(22):
    bolthead("Nozzle CNC screw",(-3.16+i*.057,-1.62,.44))
for i in range(55):
    x=-3.1+R.uniform(0,1)*1.1
    yy=-1.8+R.uniform(0,1)*.35
    curve("blue debris at intake",[(x,yy,.025),(x+.025,yy+.025,.035)],fluff,.004)


# Textile carpet segment placed under the cleaning head (actual dimensional weave).
carpet_mat=mat("Beige low-pile woven carpet",(.35,.29,.23),0,.96)
pile_mat=mat("Warm wool pile",(.53,.45,.34),0,.92)
cube("Actual rug carpet",(-2.60,-1.72,-.018),(2.95,2.30,.078),carpet_mat,.012)
for i in range(280):
    x=-3.88+R.random()*2.6
    y=-2.75+R.random()*2.0
    points=[(x,y,.035),(x+.005,y+.008,.051),(x+.014,y+.012,.038)]
    curve("soft carpet wool tuft",points,pile_mat,.0017)
for i in range(220):
    x=-3.80+R.random()*2.4;y=-2.50+R.random()*1.4
    curve("uncollected blue fur strand",[(x,y,.047),(x+.018,y+.017,.061),(x+.044,y+.022,.050)],fluff,.0025)

# Camera view (portrait), cinematic focal length tuned per target; no camera clipping.
def camera(name,position,target,lens=40,focus=0):
    bpy.ops.object.camera_add(location=position)
    o=bpy.context.object;o.name=name;point_at(o,target)
    o.data.type="PERSP";o.data.lens=lens;o.data.sensor_width=36
    if focus:
        o.data.dof.use_dof=True;o.data.dof.focus_distance=(Vector(position)-Vector(target)).length
        o.data.dof.aperture_fstop=focus
    sc.camera=o
    return o

views={
    "hero":((3.0,-5.35,3.40),(-.08,-.05,1.54),46,10),
    "cyclone":((1.35,-4.4,2.95),(-.54,.10,1.75),54,9),
    "brush":((-3.05,-3.25,.86),(-2.53,-1.42,.28),55,12),
}
out=os.path.abspath(a.out)
os.makedirs(out,exist_ok=True)
shots=views.keys() if a.shot=="all" else [a.shot]
for name in shots:
    position,target,lens,dof=views[name]
    camera("Camera / "+name,position,target,lens,dof)
    sc.render.filepath=os.path.join(out,name+".png")
    sc.camera.data.lens=lens
    print("RENDERING",name,sc.render.filepath,flush=True)
    bpy.ops.render.render(write_still=True)
print("DONE",out,flush=True)
