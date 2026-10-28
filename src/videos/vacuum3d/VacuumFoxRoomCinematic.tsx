import React,{useMemo} from "react";
import * as THREE from "three";
import {useLoader,useThree} from "@react-three/fiber";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {ThreeCanvas} from "@remotion/three";
import {AbsoluteFill,staticFile,useCurrentFrame,useVideoConfig} from "remotion";
import {CameraRig,type Cam} from "../../lib/three/core";

export const ROOM_QUALITY_FRAMES=150;
const smooth=(n:number)=>{const a=Math.max(0,Math.min(1,n));return a*a*(3-2*a)};
const rnd=(i:number)=>{const x=Math.sin(i*127.1+3.43)*48913.823;return x-Math.floor(x)};
type V=[number,number,number];
const lerp=(a:V,b:V,t:number):V=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];

const RenderSettings:React.FC=()=>{
 const gl=useThree(s=>s.gl);
 gl.toneMapping=THREE.ACESFilmicToneMapping;
 gl.toneMappingExposure=1.02;
 gl.outputColorSpace=THREE.SRGBColorSpace;
 return null;
};
const Fox:React.FC<{frame:number}>=({frame})=>{
 const model=useLoader(GLTFLoader,staticFile("vacuum-quality/fox_helmet.glb"));
 const scene=useMemo(()=>{
   const o=model.scene.clone(true);
   o.traverse(c=>{if(c instanceof THREE.Mesh){c.castShadow=true;c.receiveShadow=true}});
   return o;
 },[model.scene]);
 const t=frame/30;
 return <group position={[-1.47,.18+Math.sin(t*2.2)*.018,-1.55]} rotation={[0,Math.sin(t*.70)*.04,Math.sin(t*1.2)*.015]} scale={.70}>
  <primitive object={scene}/>
 </group>;
};
const FurWind:React.FC<{frame:number}>=({frame})=>{
 const total=800;
 const obj=useMemo(()=>new THREE.Object3D(),[]);
 const mesh=useMemo(()=>new THREE.InstancedMesh(
  new THREE.CapsuleGeometry(.011,.028,2,5),
  new THREE.MeshStandardMaterial({color:"#dc6727",roughness:.95,side:THREE.DoubleSide}),
  total
 ),[]);
 const t=frame/30;
 for(let i=0;i<total;i++){
  const spread=rnd(i*7),start=rnd(i*17)*1.6;
  const age=Math.max(0,t-start);
  const phase=rnd(i*13)*Math.PI*2;
  const radius=.25+spread*1.65;
  const x=-1.47+Math.cos(phase+age*.31)*radius+Math.sin(i*.9+age)*age*.18;
  const y=1.60+Math.sin(phase*2)*.45+age*.19-(age*age)*.075;
  const z=-1.56+Math.sin(phase+age*.21)*radius*.65+age*.28;
  obj.position.set(x,y,z);
  obj.rotation.set(age*.6,phase+age*.4,age*.43);
  const amount=Math.min(1,Math.max(0,age*.6));
  const s=amount*(.34+rnd(i*47)*.4);
  obj.scale.set(s*.3,s,s*.4);
  obj.updateMatrix();
  mesh.setMatrixAt(i,obj.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;
 return <primitive object={mesh}/>;
};
const ColorGradedRoom:React.FC<{frame:number}>=({frame})=>{
 const model=useLoader(GLTFLoader,staticFile("vacuum-quality/room.glb"));
 const scene=useMemo(()=>{
  const o=model.scene.clone(true);
  o.traverse(c=>{
   if(c instanceof THREE.Mesh){
    c.castShadow=true;c.receiveShadow=true;
    if(c.material instanceof THREE.MeshStandardMaterial){
      const m=c.material.clone();
      m.roughness=Math.max(.31,m.roughness);
      c.material=m;
    }
   }
  });return o;
 },[model.scene]);
 const k=smooth((frame-21)/111);
 const camStart:V=[5.2,3.1,7.15],camEnd:V=[1.35,2.18,3.6];
 const aimStart:V=[-.60,1.52,-1.35],aimEnd:V=[-1.47,1.68,-1.55];
 const cam:Cam={pos:lerp(camStart,camEnd,k),look:lerp(aimStart,aimEnd,k),fov:43-7*k};
 return <>
  <RenderSettings/>
  <CameraRig cam={cam}/>
  <color attach="background" args={["#b8a897"]}/>
  <ambientLight intensity={.31}/>
  <hemisphereLight args={["#c1defb","#4c3324",.98]}/>
  <directionalLight position={[4,8,5]} castShadow shadow-mapSize={[1024,1024]} intensity={2.5} color="#fff3dd" shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={8} shadow-camera-bottom={-8}/>
  <spotLight position={[-3,4.5,2]} angle={1.0} intensity={29} penumbra={.7} color="#ffe1b4" distance={9}/>
  <pointLight position={[3,3.6,-2]} intensity={21} distance={10} color="#94cbff"/>
  <primitive object={scene}/>
  <Fox frame={frame}/>
  <FurWind frame={frame}/>
 </>;
};
export const VacuumFoxRoomCinematic:React.FC=()=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const progress=smooth((frame-45)/100);
 return <AbsoluteFill style={{background:"#1b2b32",overflow:"hidden"}}>
  <ThreeCanvas width={width} height={height} shadows camera={{near:.05,far:70,fov:41}}>
    <ColorGradedRoom frame={frame}/>
  </ThreeCanvas>
  <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(8,22,36,.48),transparent 27%,transparent 69%,rgba(7,17,26,.48))",pointerEvents:"none"}}/>
  <div style={{position:"absolute",left:61,top:92,font:"900 27px Arial",letterSpacing:2.3,color:"#e4edf1"}}>POCKET PUH / THE PROBLEM</div>
  <div style={{position:"absolute",left:59,top:146,font:"900 57px Arial",color:"#fff",textShadow:"0 5px 13px #172028"}}>{progress>.65?"FUR EVERYWHERE":"THE FOX HELMET"}</div>
  <div style={{position:"absolute",bottom:128,left:60,right:60,textAlign:"center",font:"900 50px Arial",color:"#fff",textShadow:"0 5px 10px black"}}>BUILD A VACUUM CLEANER</div>
 </AbsoluteFill>;
};
