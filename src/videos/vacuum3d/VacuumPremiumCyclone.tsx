import React,{useMemo} from "react";
import {useLoader} from "@react-three/fiber";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import {ThreeCanvas} from "@remotion/three";
import {AbsoluteFill,useCurrentFrame,useVideoConfig,staticFile} from "remotion";
import {CameraRig,type Cam,project} from "../../lib/three/core";

/**
 * Cinematic, genuinely animated cutaway LOOK-DEV shot.
 * Source model = Blender mesh GLB, not still images, with per-frame:
 * impeller, airflow helix, moving lint, camera dolly/orbit, pleated filter,
 * assembly explosion, readable 3D mechanical labels.
 */
export const PREMIUM_DURATION=150;
const pi=Math.PI;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t)};
const rand=(i:number)=>{const v=Math.sin(i*127.61+19.91)*48759.74;return v-Math.floor(v)};
type V=[number,number,number];

const MachinedRing:React.FC<{p:V,r:number,color:string,rot?:V,thick?:number}>=({p,r,color,rot=[pi/2,0,0],thick=.024})=><mesh position={p} rotation={rot} castShadow><torusGeometry args={[r,thick,12,60]}/><meshStandardMaterial color={color} metalness={.84} roughness={.24}/></mesh>;
const Cyl:React.FC<{p:V,r:number,h:number,color:string,rot?:V,open?:boolean}>=({p,r,h,color,rot=[0,0,0],open=false})=><mesh position={p} rotation={rot} castShadow receiveShadow>
 <cylinderGeometry args={[r,r,h,44,1,open]}/><meshStandardMaterial color={color} metalness={.62} roughness={.29} side={THREE.DoubleSide}/>
</mesh>;
const Shaft:React.FC<{f:number}>=({f})=><group position={[1.56,1.03,.84]}>
 <MachinedRing p={[0,0,-.24]} r={.47} color="#afcbd6" rot={[0,0,0]} thick={.04}/>
 <MachinedRing p={[0,0,.12]} r={.44} color="#8babb7" rot={[0,0,0]}/>
 <group rotation={[0,0,f*.47]}>
  {Array.from({length:11},(_,i)=>{
   const angle=i*2*pi/11;
   return <group key={i} rotation={[0,0,angle]}>
     <mesh position={[.02,.23,0]} rotation={[0,0,-.30]} castShadow>
      <boxGeometry args={[.16,.37,.037]}/><meshStandardMaterial color="#f9b65b" metalness={.78} roughness={.28} side={THREE.DoubleSide}/>
     </mesh>
     <mesh position={[0,.35,.028]}><boxGeometry args={[.06,.12,.07]}/><meshStandardMaterial color="#8c6349" metalness={.66} roughness={.34}/></mesh>
   </group>
  })}
  <Cyl p={[0,0,.07]} r={.094} h={.17} color="#d9e1e3" rot={[pi/2,0,0]}/>
 </group>
 </group>;

const Vortex:React.FC<{f:number,thin:boolean}>=({f,thin})=>{
 const obj=useMemo(()=>new THREE.Object3D(),[]);
 const particles=useMemo(()=>{
  const n=160;
  return new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.011,1),
   new THREE.MeshStandardMaterial({color:"#ffbd79",roughness:.93,emissive:"#5d270b",emissiveIntensity:.20}),n);
 },[]);
 const n=particles.count;
 for(let i=0;i<n;i++){
  const u=(rand(i*43)+f*.0019+((i%8)*.026))%1;
  const a=rand(i*77)*pi*2+f*.086+(1-u)*pi*8;
  const rr=.47-u*.12+Math.sin(i*8.5)*.017;
  const x=-.49+rr*Math.cos(a);
  const y=2.38-1.49*u;
  const z=-.14+rr*Math.sin(a);
  obj.position.set(x,y,z);
  obj.rotation.set(a,u*pi,a*.7);
  const s=(thin?.48:1)*(.55+rand(i*19)*1.1);
  obj.scale.set(s*.85,s*.35,s*2.2);obj.updateMatrix();
  particles.setMatrixAt(i,obj.matrix);
 }
 particles.instanceMatrix.needsUpdate=true;
 return <primitive object={particles}/>;
};
const FlowTrails:React.FC<{f:number}>=({f})=><group>
 {Array.from({length:7},(_,i)=>{
  const dots=Array.from({length:23},(_,j)=>{
   const u=(j/23+f*.003+i/7)%1;
   const a=u*pi*9+f*.06+i*.87;
   return [-.49+Math.cos(a)*(.50-u*.08),2.35-u*1.36,-.14+Math.sin(a)*(.50-u*.08)] as V;
  });
  return <group key={i}>{dots.map((p,j)=><mesh key={j} position={p}>
    <sphereGeometry args={[.010*(1-j/45),8,6]}/><meshBasicMaterial color={i%2?"#7cefff":"#fae3a7"} transparent opacity={.65} depthWrite={false}/>
  </mesh>)}</group>;
 })}
 </group>;

const FineFilter:React.FC<{f:number,explode:number}>=({f,explode})=>{
 const shift=explode*.56;
 return <group position={[.89+shift,1.62,-.20]}>
  <Cyl p={[0,0,0]} r={.27} h={.62} color="#7b8ea1" rot={[pi/2,0,0]} open/>
  <MachinedRing p={[0,.34,0]} r={.28} color="#f4ddc5" thick={.032}/>
  <MachinedRing p={[0,-.34,0]} r={.28} color="#f4ddc5" thick={.032}/>
  {Array.from({length:40},(_,i)=>{
   const a=i*2*pi/40;
   return <mesh key={i} position={[Math.cos(a)*.235,0,Math.sin(a)*.235]} rotation={[0,a,0]}>
    <boxGeometry args={[.018,.56,.044]}/>
    <meshStandardMaterial color={i%2?"#e2dfd5":"#c3d4d9"} roughness={.78}/>
   </mesh>
  })}
 </group>
};
const BracketHardware:React.FC<{explode:number}>=({explode})=><group>
  <Cyl p={[-.49,2.50+explode*.12,-.14]} r={.61} h={.083} color="#273e52"/>
  <Cyl p={[-.49,.80,-.14]} r={.53} h={.088} color="#425465"/>
  {Array.from({length:14},(_,i)=>{
   const a=i*2*pi/14;
   const x=-.49+.56*Math.cos(a),z=-.14+.56*Math.sin(a);
   return <group key={i}>
    <Cyl p={[x,2.57+explode*.12,z]} r={.021} h={.028} color="#bbdce6"/>
    <mesh position={[x,2.591+explode*.12,z]} rotation={[0,a,0]}><boxGeometry args={[.022,.004,.007]}/><meshBasicMaterial color="#314753"/></mesh>
   </group>
  })}
  <mesh position={[-.49,1.65,-.14]} castShadow>
   <cylinderGeometry args={[.50,.54,1.65,60,1,true]}/>
   <meshPhysicalMaterial color="#b8e8f6" roughness={.095} metalness={.06} transparent opacity={.19} depthWrite={false} side={THREE.DoubleSide}/>
  </mesh>
  {[1.1,1.76,2.3].map(y=><MachinedRing key={y} p={[-.49,y,-.14]} r={.545} color="#7aabbd" rot={[pi/2,0,0]} thick={.015}/>)}
</group>;

const Stage:React.FC<{f:number;camera:Cam}>=({f,camera})=>{
 const model=useLoader(GLTFLoader,staticFile("vacuum-quality/vacuum_body.glb"));
 const scene=useMemo(()=>{
 const sc=model.scene.clone(true);
 sc.traverse((o)=>{
   if(!(o instanceof THREE.Mesh))return;
   o.castShadow=true;o.receiveShadow=true;
   const material=o.material;
   if(material instanceof THREE.MeshStandardMaterial){
     const m=material.clone();
     if(m.name.includes("Satin gunmetal")){m.color.set("#607282");m.roughness=.31;m.metalness=.64;}
     if(m.name.includes("Graphite anodized")){m.color.set("#263b4b");m.roughness=.36;m.metalness=.70;}
     if(m.name.includes("Tinted polycarbonate")){m.color.set("#afdeee");m.transparent=true;m.opacity=.24;m.depthWrite=false;m.roughness=.10;}
     o.material=m;
   }
 });
 return sc;
},[model.scene]);
 const t=f/30;
 const explode=smooth((f-78)/38)*1.85;
 const isFlow=f>=16;
 return <>
  <CameraRig cam={camera}/>
  <color attach="background" args={["#0c1a27"]}/>
  <ambientLight intensity={.32}/>
  <hemisphereLight args={["#7fadd6","#2c2420",1.15]}/>
  <directionalLight position={[-4.5,6,5]} intensity={3.4} color="#f5e9d5" castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={7} shadow-camera-bottom={-6}/>
  <spotLight position={[4,3,1]} angle={.72} intensity={85} penumbra={.7} color="#65c9ff" distance={11}/>
  <pointLight position={[-2,4,-1]} intensity={32} distance={9} color="#ffad67"/>
  <pointLight position={[-1.2,2.2,3.2]} intensity={14} distance={8} color="#ffffff"/>
  <group position={[0,0,0]}><primitive object={scene}/></group>
  <BracketHardware explode={explode}/>
  <Shaft f={f}/>
  <FineFilter f={f} explode={explode}/>
  {isFlow&&<Vortex f={f} thin={false}/>}
  {isFlow&&<FlowTrails f={f}/>}
  {/* Physical assembly blueprints, behind actual mesh: spatial reference grid */}
  {Array.from({length:16},(_,i)=><mesh key={i} position={[-4.0+i*.47,-.055,-.80]} receiveShadow>
   <boxGeometry args={[.008,.005,5]}/><meshBasicMaterial color="#254456"/>
  </mesh>)}
  <mesh position={[0,-.068,0]} receiveShadow><boxGeometry args={[8,.012,6]}/><meshStandardMaterial color="#132635" metalness={.32} roughness={.42}/></mesh>
 </>
};
const Label:React.FC<{p:V;cam:Cam;w:number;h:number;name:string;sub:string;color:string;pos?:number}>=({p,cam,w,h,name,sub,color,pos=0})=>{
 const a=project(p,cam,w,h);
 if(!a||a.x<-200||a.x>w+200)return null;
 return <div style={{position:"absolute",left:Math.max(18,Math.min(w-220,a.x+(pos?85:-190))),top:Math.max(210,Math.min(h-200,a.y-35)),padding:"10px 15px",
  background:"rgba(9,23,39,.85)",borderLeft:"4px solid "+color,color:"#fff",boxShadow:"0 4px 20px #06121d",width:192,
  fontFamily:"Arial,sans-serif"}}>
   <div style={{fontSize:26,fontWeight:900}}>{name}</div>
   <div style={{fontSize:18,color:"#b5cfdd",marginTop:4}}>{sub}</div>
 </div>;
};
export const VacuumPremiumCyclone:React.FC<{embed?:boolean;shot?:"cyclone"|"filter"}>=({embed=false,shot="cyclone"})=>{
 const f=useCurrentFrame()+(shot==="filter"?110:0),{width,height}=useVideoConfig();
 const t=f/30;
 const blend=(a:number,b:number,u:number)=>a+(b-a)*u;
 const move=(from:V,to:V,u:number):V=>[blend(from[0],to[0],u),blend(from[1],to[1],u),blend(from[2],to[2],u)];
 const p1=smooth((f-28)/42),p2=smooth((f-100)/36);
 const wide:V=[6.0+Math.sin(t*.40)*.15,3.12,7.15];
 const macro:V=[3.15+Math.sin(t*.34)*.18,2.54,4.22];
 const filter:V=[4.6+Math.sin(t*.30)*.15,2.45,5.6];
 const pos=move(move(wide,macro,p1),filter,p2);
 const look=move(move([-.60,1.40,.10],[-.49,1.55,-.14],p1),[.55,1.42,-.05],p2);
 const cam:Cam={pos,look,fov:blend(blend(49,37,p1),46,p2)};

 return <AbsoluteFill style={{background:"#061523",overflow:"hidden"}}>
  <ThreeCanvas width={width} height={height} shadows camera={{fov:36,near:.05,far:70}}>
   <Stage f={f} camera={cam}/>
  </ThreeCanvas>
  <AbsoluteFill style={{pointerEvents:"none",background:"linear-gradient(180deg,rgba(2,12,24,.65),transparent 26%,transparent 62%,rgba(2,12,24,.78))"}}/>
  {!embed&&<div style={{position:"absolute",top:85,left:60,color:"#e6f5fd",fontFamily:"Arial",fontWeight:800,fontSize:25,letterSpacing:3}}>POCKET PUH / ENGINEERING EXPLAINED</div>}
  {!embed&&<div style={{position:"absolute",top:138,left:58,color:"#fff",fontFamily:"Arial",fontWeight:900,fontSize:52,letterSpacing:1}}>{f>110?"EXHAUST FILTRATION":"CYCLONE SEPARATOR"}</div>}
  {!embed&&<div style={{position:"absolute",top:220,left:61,color:"#acd3e4",fontFamily:"Arial",fontWeight:700,fontSize:28}}>REAL 3D CUTAWAY • MOVING AIRFLOW</div>}
  {f>42&&f<107&&<Label p={[-.49,2.30,-.14]} cam={cam} w={width} h={height} name="CYCLONE" sub="Heavy lint falls out" color="#feb36d"/>}
  {f>103&&<Label p={[.89+smooth((f-78)/38)*1.04,1.65,-.2]} cam={cam} w={width} h={height} name="HEPA FILTER" sub="Fine particles stay" color="#6ce4ff" pos={0}/>}
  {!embed&&f>110&&<div style={{position:"absolute",right:60,top:265,font:"800 28px Arial",color:"#80eaff",letterSpacing:2}}>EXPLODED VIEW</div>}
  {!embed&&<div style={{position:"absolute",bottom:125,left:50,right:50,color:"white",fontFamily:"Arial",textAlign:"center",fontSize:48,fontWeight:900,textShadow:"0 4px 16px black"}}>{f>110?"CAPTURE THE FINE DUST":"SPIN → SEPARATE → FILTER"}</div>}
 </AbsoluteFill>;
};
