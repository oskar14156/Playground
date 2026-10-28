import React, {useMemo} from "react";
import * as THREE from "three";
import {useLoader} from "@react-three/fiber";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader.js";
import {ThreeCanvas} from "@remotion/three";
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig} from "remotion";
import {CameraRig,Cam} from "../../lib/three/core";
import wordsJson from "../../../public/vacuum-live/words.json";

type Word={word:string,start:number,end:number};
type V=[number,number,number];
const words=wordsJson as Word[];
const fps=30;
export const VACUUM_LIVE_DURATION=Math.ceil((words[words.length-1]?.end||76)*fps)+15;
const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
const tokens=words.map(x=>normalize(x.word));
function cue(q:string){
 const m=q.split(/\s+/).map(normalize);
 for(let i=0;i<=tokens.length-m.length;i++)if(m.every((v,j)=>tokens[i+j]===v))return Math.round(words[i].start*fps);
 throw new Error("Missing 3D scene timing: "+q);
}
const cues=[
 [0,0,"THE PROBLEM"],
 [cue("It's a furry fox helmet"),1,"A FURSUIT HEAD"],
 [cue("And it's shedding"),2,"FUR EVERYWHERE"],
 [cue("So you grab a broom"),3,"BROOM FAILS"],
 [cue("So you put a spinning fan"),4,"IMPELLER"],
 [cue("But you've built a machine"),5,"THE EXHAUST"],
 [cue("So you seal a dust container"),6,"DUST BIN"],
 [cue("But the filter clogs"),7,"CLOGGED"],
 [cue("So you make the air spin"),8,"CYCLONE"],
 [cue("The smaller dust can keep going"),9,"SMALL PARTICLES"],
 [cue("So you add a fine filter"),10,"FINE FILTER"],
 [cue("But the carpet is still orange"),11,"FUR IN CARPET"],
 [cue("So you add a rotating brush"),12,"SPINNING BRUSH"],
 [cue("But the hose gets blocked"),13,"BLOCKED HOSE"],
 [cue("So you add a thermal cutout"),14,"THERMAL CUTOUT"],
 [cue("Finally the floor is spotless"),15,"SPOTLESS"],
 [cue("Even the giant pocket puh is gone"),16,"WHERE IS HE?"],
 [cue("You look inside the transparent dust bin"),17,"INSIDE THE BIN"],
 [cue("Your friend says"),18,"WRONG THING"],
 [cue("And that's what happens when"),19,"ALL BECAUSE..."]
] as const;
const rand=(i:number)=>{const v=Math.sin(i*121.15+17.84)*33577.12;return v-Math.floor(v)};
const lin=(a:number,b:number,p:number)=>a+(b-a)*p;
const smooth=(t:number)=>{const p=Math.max(0,Math.min(1,t));return p*p*(3-2*p)};
const lerpV=(a:V,b:V,p:number):V=>[lin(a[0],b[0],p),lin(a[1],b[1],p),lin(a[2],b[2],p)];
const interp=(a:V,b:V,p:number)=>lerpV(a,b,smooth(p));
const cool="#5fdded",amber="#ffb66a";
function cameraFor(mode:number,age:number):Cam{
 const e=Math.max(0,age),wig=Math.sin(e*.7);
 if(mode===0)return {pos:[4.9-e*.18,3.05+.15*wig,7.0-e*.16],look:[-1.25,1.28,-1.6],fov:42};
 if(mode===1)return {pos:[1.85-e*.20,2.25+wig*.12,3.60-e*.15],look:[-1.42,1.60,-1.50],fov:35};
 if(mode===2||mode===3)return {pos:[4.15-e*.12,2.7+wig*.18,5.5-e*.1],look:[-.4,1.2,-.55],fov:40};
 if(mode===11||mode===12)return {pos:[-3.6+e*.16,.95,4.8-e*.12],look:[-2.55,.37,1.44],fov:37};
 if(mode===15||mode===16)return {pos:[4.85-e*.15,2.8,6.50-e*.2],look:[-.9,1.15,-1.35],fov:40};
 if(mode===17||mode===18)return {pos:[1.6+Math.sin(e*.5)*.6,2.1+e*.04,3.10-e*.09],look:[-.49,1.58,-.14],fov:28};
 if(mode===4||mode===5)return {pos:[2.5+e*.11,2.4,4.5-e*.12],look:[1.49,1.05,.65],fov:33};
 if(mode===6||mode===8||mode===9)return {pos:[1.40+Math.sin(e*.58)*1.1,2.60+Math.sin(e*.42)*.20,3.75-e*.09],look:[-.49,1.55,-.14],fov:33};
 if(mode===7||mode===10)return {pos:[3.2-e*.1,2.15+wig*.15,4.5-e*.10],look:[.74,1.65,-.14],fov:36};
 if(mode===13||mode===14)return {pos:[3.4+Math.sin(e*.6)*.24,1.85,4.70-e*.12],look:[1.5,1.02,.64],fov:35};
 return {pos:[4.3+wig*.22,2.9,6.7-e*.15],look:[-.6,1.2,-1.3],fov:42};
}
const InstancedFur:React.FC<{frame:number;mode:number;age:number}>=({frame,mode,age})=>{
 const count=270;
 const mesh=useMemo(()=>{
  const geometry=new THREE.TetrahedronGeometry(.027,0);
  const material=new THREE.MeshStandardMaterial({color:"#f68a39",roughness:.91,emissive:"#69310c",emissiveIntensity:.1});
  return new THREE.InstancedMesh(geometry,material,count);
 },[]);
 const o=useMemo(()=>new THREE.Object3D(),[]);
 const t=frame/30;
 for(let i=0;i<count;i++){
  const x=-3+rand(i*5)*6,y=.15+rand(i*7)*2.35,z=-2.4+rand(i*17)*4.8;
  let xx=x,yy=y,zz=z;
  if(mode===2||mode===3) {
    xx=x+.16*Math.sin(t*2+i),yy=.16+(y+age*.7)%2.5,zz=z+.15*Math.sin(t+i);
  } else if(mode===11||mode===12) {
    const collapse=smooth(age/Math.max(1,mode===12?6:2));
    xx=lin(x,-2.4,collapse),yy=lin(.09+rand(i)*.12,.31,collapse),zz=lin(z,1.45,collapse);
  } else {
    xx=x+.05*Math.sin(t*.5+i),yy=.1+rand(i*7)*.17,zz=z;
  }
  o.position.set(xx,yy,zz);
  o.rotation.set(t*.6+i*.08,t*.5+i*.6,0);
  const s=(.75+rand(i*13)*1.3)*((mode===15||mode===16||mode===17||mode===18)?0.001:1);
  o.scale.set(s,s*.6,s*1.65);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;
 return <primitive object={mesh}/>;
};
const Vortex:React.FC<{frame:number;mode:number;age:number}>=({frame,mode,age})=>{
 const count=140;
 const particle=useMemo(()=>new THREE.InstancedMesh(
   new THREE.SphereGeometry(.021,7,6),
   new THREE.MeshBasicMaterial({color:"#f8b563",toneMapped:false}),
   count),[]);
 const obj=useMemo(()=>new THREE.Object3D(),[]);
 const seconds=frame/30;
 const path:V[]=[
  [-3.13,.28,1.53],[-2.65,.3,1.53],[-1.95,.55,1.15],[-1.53,1.34,.86],
  [-.90,2.22,.54],[-.49,2.35,-.14],[-.49,1.45,-.14],[-.49,.97,-.14],
  [-.49,2.29,-.14],[.85,1.70,-.14],[1.55,1.03,.64],[2.43,2.1,-1.03]
 ];
 for(let i=0;i<count;i++){
  const phase=((i/count+seconds*.35)%1+1)%1;
  let v:V;
  if(mode===8||mode===9||mode===6){
    const angle=phase*Math.PI*10+seconds*8;
    const radius=.43-phase*.07;
    v=[-.49+Math.cos(angle)*radius,2.37-phase*1.45,-.14+Math.sin(angle)*radius];
  } else {
    const seg=phase*(path.length-1);const a=Math.min(path.length-2,Math.floor(seg));
    v=lerpV(path[a],path[a+1],seg-a);
    v=[v[0]+Math.sin(phase*37+seconds*9)*.032,v[1],v[2]+Math.cos(phase*37+seconds*8)*.03];
  }
  obj.position.set(...v);
  const s=.8+rand(i*13)*.9;obj.scale.setScalar(s);obj.updateMatrix();particle.setMatrixAt(i,obj.matrix);
 }
 particle.instanceMatrix.needsUpdate=true;
 return <primitive object={particle}/>;
};
const Airflow:React.FC<{frame:number;mode:number}>=({frame,mode})=>{
 const mesh=useMemo(()=>new THREE.InstancedMesh(
   new THREE.SphereGeometry(.015,7,5),new THREE.MeshBasicMaterial({color:"#5eefff",toneMapped:false}),84),[]);
 const ob=useMemo(()=>new THREE.Object3D(),[]);
 const t=frame/30;
 for(let i=0;i<84;i++){
  const u=(i/84+t*.28)%1;
  const a=u*Math.PI*11+t*3.5;
  ob.position.set(-.49+.15*Math.cos(a),.93+u*1.76,-.14+.15*Math.sin(a));
  ob.scale.setScalar(.6+rand(i)*1.5);ob.updateMatrix();mesh.setMatrixAt(i,ob.matrix);
 }
 mesh.instanceMatrix.needsUpdate=true;
 return mode===8||mode===9||mode===10?<primitive object={mesh}/>:null;
};
const Impeller:React.FC<{frame:number}>=({frame})=><group position={[1.55,1.02,.67]} rotation={[0,0,frame*.34]}>
 <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.07,.07,.16,22]}/><meshStandardMaterial metalness={.8} roughness={.23} color="#e6c175"/></mesh>
 {Array.from({length:9},(_,i)=>{
   const a=i*Math.PI*2/9;
   return <mesh key={i} rotation={[0,0,a+.28]} position={[Math.cos(a)*.23,Math.sin(a)*.23,0]}>
     <boxGeometry args={[.24,.09,.027]}/><meshStandardMaterial metalness={.7} roughness={.29} color="#f9ad5a" side={THREE.DoubleSide}/>
   </mesh>;
 })}
</group>;
const BrushRoll:React.FC<{frame:number}>=({frame})=><group position={[-2.55,.28,1.45]} rotation={[frame*.39,0,0]}>
 <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.12,.12,1.20,24]}/><meshStandardMaterial color="#a6492a" metalness={.5}/></mesh>
 {Array.from({length:33},(_,i)=>{
  const x=(i-16)*.035;
  return Array.from({length:8},(_,j)=>{
   const a=j*Math.PI/4+i*.17;const r=.19;
   return <mesh key={i*8+j} position={[x,Math.sin(a)*r,Math.cos(a)*r]} rotation={[a,0,0]}>
     <boxGeometry args={[.018,.095,.017]}/><meshStandardMaterial color={j%2?"#fb915a":"#56c9ee"} roughness={.87}/>
   </mesh>;
  });
 })}
</group>;
const Broom:React.FC<{frame:number}>=({frame})=>{
 const t=frame/30;
 return <group position={[-1.1,.12,1.2]} rotation={[0,0,.28*Math.sin(t*2.5)]}>
   <mesh position={[0,1.03,0]} rotation={[0,0,-.24]}><cylinderGeometry args={[.037,.037,2.1,12]}/><meshStandardMaterial color="#b88b54" roughness={.74}/></mesh>
   <mesh position={[.23,.14,0]}><boxGeometry args={[.9,.18,.36]}/><meshStandardMaterial color="#428c9a"/></mesh>
   {Array.from({length:28},(_,i)=><mesh key={i} position={[-.17+i*.030,.025,0]}><boxGeometry args={[.012,.14,.18]}/><meshStandardMaterial color="#ead4a4"/></mesh>)}
 </group>;
};
const Studio:React.FC=()=> <group>
 <mesh position={[0,-.1,0]} receiveShadow><cylinderGeometry args={[5.3,5.5,.22,68]}/><meshStandardMaterial color="#152737" metalness={.35} roughness={.30}/></mesh>
 <mesh position={[0,.02,-3]}><boxGeometry args={[10,.04,.04]}/><meshBasicMaterial color="#34566d"/></mesh>
 {Array.from({length:12},(_,i)=><mesh key={i} position={[-4.4+i*.8,.014,3.1]}>
   <boxGeometry args={[.025,.014,2]}/><meshBasicMaterial color="#214259"/></mesh>)}
 </group>;
const AnimatedWorld:React.FC<{frame:number;mode:number;age:number}>=({frame,mode,age})=>{
 const fox=useLoader(GLTFLoader,staticFile("vacuum-live/fox_helmet.glb"));
 const room=useLoader(GLTFLoader,staticFile("vacuum-live/room.glb"));
 const vacuum=useLoader(GLTFLoader,staticFile("vacuum-live/vacuum_body.glb"));
 const head=useMemo(()=>fox.scene.clone(true),[fox.scene]);
 const captured=useMemo(()=>fox.scene.clone(true),[fox.scene]);
 const furniture=useMemo(()=>room.scene.clone(true),[room.scene]);
 const machine=useMemo(()=>vacuum.scene.clone(true),[vacuum.scene]);
 const isRoom=[0,1,2,3,11,15,16,19].includes(mode);
 const isCarpet=mode===12;
 const final=mode===17||mode===18;
 const activeMotor=mode>=4&&mode<=14;
 const sucking=mode===16;
 const t=frame/30;
 const cam=cameraFor(mode,age);
 const suction=sucking?smooth(age/3):0;
 return <>
  <CameraRig cam={cam}/>
  <color attach="background" args={[isRoom?"#c5b3a4":"#0e1c2a"]}/>
  <ambientLight intensity={.60}/>
  <hemisphereLight args={["#e6eeff","#695041",1.9]}/>
  <directionalLight position={[4,8,5]} intensity={2.7} color="#fff0d8" castShadow shadow-mapSize={[1024,1024]} shadow-camera-near={.1} shadow-camera-far={40} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9}/>
  <pointLight position={[-3,3,-1]} intensity={30} distance={12} color="#fcd9aa"/>
  <pointLight position={[3,3,3]} intensity={23} distance={11} color="#9eeaff"/>
  {isRoom?<>
    <primitive object={furniture}/>
    {mode!==16&&<group position={[-1.47,.15+.06*Math.sin(t*2.6),-1.55]} rotation={[0,Math.sin(t*.6)*.12,0]} scale={.70}>
     <primitive object={head}/>
    </group>}
    {mode===16&&<group position={interp([-1.47,.15,-1.55],[1.65,.4,1.35],suction)} rotation={[suction*4,suction*5,suction*2]} scale={.7*(1-.92*suction)}>
     <primitive object={head}/>
    </group>}
    <InstancedFur frame={frame} mode={mode} age={age}/>
    {mode===3&&<Broom frame={frame}/>}
    {mode===15&&<group position={[2.4,0,.45]} scale={.39}><primitive object={machine}/><Impeller frame={frame}/><BrushRoll frame={frame}/></group>}
  </>:<>
    <Studio/>
    <primitive object={machine}/>
    {activeMotor&&<Impeller frame={frame}/>}
    {activeMotor&&<BrushRoll frame={frame}/>}
    {activeMotor&&<Vortex frame={frame} age={age} mode={mode}/>}
    {activeMotor&&<Airflow frame={frame} mode={mode}/>}
    {mode===14&&<pointLight position={[1.55,1.1,.75]} intensity={frame%25<13?8:0} color="#ff3b47" distance={3}/>}
    {isCarpet&&<InstancedFur frame={frame} mode={mode} age={age}/>}
    {final&&<group position={[-.49,.76,-.14]} scale={.41} rotation={[0,Math.sin(t*.6)*.2,0]}>
       <primitive object={captured}/>
    </group>}
  </>}
 </>;
};
export const VacuumFoxLive:React.FC<{proof?:boolean}>=({proof=false})=>{
 const f=useCurrentFrame();const {width,height}=useVideoConfig();
 const phase=proof?Math.floor(f/45)%5:0;
 const samples=[3,4,8,12,17];
 let mode:number=0,age=0,caption="REAL 3D";
 if(proof){mode=samples[phase];age=(f%45)/30;caption=["MOVING BROOM","SPINNING IMPELLER","CYCLONE AIRFLOW","MOVING BRUSH","FOX IN CANISTER"][phase];}
 else {
  let current=0;for(let i=0;i<cues.length;i++)if(f>=cues[i][0])current=i;else break;
  mode=cues[current][1];age=(f-cues[current][0])/30;caption=cues[current][2];
 }
 const t=f/30;
 let w=0;for(let i=0;i<words.length;i++)if(words[i].start<=t)w=i;else break;
 const word=words[w]?.word||"";
 const fs=Math.min(128,Math.max(72,990/(word.length*.74)));
 return <AbsoluteFill style={{background:"#091726"}}>
   <ThreeCanvas width={width} height={height} shadows camera={{fov:40,near:.05,far:100}} gl={{antialias:true}}>
      <AnimatedWorld frame={f} mode={mode} age={age}/>
   </ThreeCanvas>
   <AbsoluteFill style={{pointerEvents:"none",background:"linear-gradient(180deg,rgba(0,10,20,.35),transparent 28%,transparent 63%,rgba(0,10,20,.45))"}}/>
   <div style={{position:"absolute",left:65,top:75,right:65,color:"#e9e3db",fontFamily:"Arial",fontWeight:900,fontSize:26,letterSpacing:2.8,textShadow:"0 3px 12px #081521"}}>POCKET PUH / YOU BUILD IT</div>
   <div style={{position:"absolute",left:65,top:122,right:60,color:mode===14?"#ff8591":"#ffc881",fontFamily:"Arial",fontWeight:900,fontSize:45,letterSpacing:1,textShadow:"0 4px 14px #081521"}}>{caption}</div>
   {mode===14&&!proof&&<div style={{position:"absolute",top:360,left:150,right:150,border:"5px solid #ff6777",borderRadius:20,textAlign:"center",fontSize:65,color:"#fff",fontFamily:"Arial",fontWeight:900,padding:24,background:"rgba(60,6,18,.73)"}}>MOTOR OVERHEATING!</div>}
   {!proof&&<>
    <div style={{position:"absolute",bottom:160,left:55,right:55,display:"flex",alignItems:"center",justifyContent:"center",height:176}}>
      <span style={{fontFamily:"Arial Black,Arial,sans-serif",fontSize:fs,fontWeight:900,color:"#fff",textTransform:"uppercase",whiteSpace:"nowrap",textShadow:"3px 3px 0 #141414,-3px 3px 0 #141414,3px -3px 0 #141414,-3px -3px 0 #141414,0 6px 8px #000"}}>{word}</span>
    </div>
    <Audio src={staticFile("vacuum-live/vo.mp3")}/>
   </>}
 </AbsoluteFill>;
};
