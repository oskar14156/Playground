import React,{useMemo} from "react";
import * as THREE from "three";
import {ThreeCanvas} from "@remotion/three";
import {AbsoluteFill,Audio,staticFile,useCurrentFrame,useVideoConfig} from "remotion";
import {CameraRig,type Cam} from "../../lib/three/core";
import wordsJson from "../../../public/vacuum-motion/words.json";
type Word={word:string,start:number,end:number};
const words=wordsJson as Word[];
const FPS=30;
export const ACTIVE_DURATION=Math.ceil((words[words.length-1]?.end??77)*FPS)+10;
const cap=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(x:number)=>{const y=cap(x);return y*y*(3-2*y);};
const hash=(i:number)=>{const x=Math.sin(i*74.231+54.6)*97643.254;return x-Math.floor(x);};
const norm=(x:string)=>x.toLowerCase().replace(/[^a-z0-9]/g,"");
const tokens=words.map(x=>norm(x.word));
const cue=(s:string)=>{
 const q=s.split(/\s+/).map(norm);
 for(let i=0;i<=tokens.length-q.length;i++)if(q.every((t,j)=>tokens[i+j]===t))return words[i].start*FPS;
 throw new Error("missing cue "+s);
};
const beats=[
 {f:0,kind:"problem",name:"FOX HELMET SHEDS"},
 {f:cue("So you grab a broom"),kind:"broom",name:"BROOM? NOPE."},
 {f:cue("So you put a spinning fan"),kind:"fan",name:"MOTOR + IMPELLER"},
 {f:cue("But you've built a machine"),kind:"exhaust",name:"DIRTY EXHAUST"},
 {f:cue("So you seal a dust container"),kind:"bin",name:"ADD DUST BIN"},
 {f:cue("But the filter clogs"),kind:"clog",name:"FILTER CLOGS"},
 {f:cue("So you make the air spin"),kind:"cyclone",name:"BUILD A CYCLONE"},
 {f:cue("So you add a fine filter"),kind:"filter",name:"FILTER THE EXHAUST"},
 {f:cue("But the carpet is still orange"),kind:"carpet",name:"CARPET PROBLEM"},
 {f:cue("So you add a rotating brush"),kind:"brush",name:"POWERED BRUSH"},
 {f:cue("But the hose gets blocked"),kind:"blocked",name:"BLOCKED AIRFLOW"},
 {f:cue("So you add a thermal cutout"),kind:"thermal",name:"THERMAL CUTOUT"},
 {f:cue("Finally the floor is spotless"),kind:"clean",name:"MISSION ACCOMPLISHED"},
 {f:cue("Even the giant pocket puh is gone"),kind:"gag",name:"WAIT ..."},
 {f:cue("You look inside the transparent dust bin"),kind:"inside",name:"WHERE'S POCKET PUH?"},
 {f:cue("Your friend says"),kind:"punch",name:"WRONG THING!"}
] as const;
type Phase=typeof beats[number]["kind"];
const C=(p:string)=><meshStandardMaterial color={p} roughness={.62}/>;
const Box3:React.FC<{p:[number,number,number],s:[number,number,number],c:string,r?:[number,number,number]}>=({p,s,c,r=[0,0,0]})=><mesh position={p} rotation={r} castShadow receiveShadow><boxGeometry args={s}/>{C(c)}</mesh>;
const Egg:React.FC<{p:[number,number,number],s:[number,number,number],c:string,metal?:number}>=({p,s,c,metal=0})=><mesh position={p} scale={s} castShadow receiveShadow><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={c} roughness={metal?.25:.82} metalness={metal}/></mesh>;
const Tor:React.FC<{p:[number,number,number],r:number,c:string,rot?:[number,number,number]}>=({p,r,c,rot=[0,0,0]})=><mesh position={p} rotation={rot}><torusGeometry args={[r,.028,10,50]}/><meshStandardMaterial color={c} metalness={.65} roughness={.28}/></mesh>;
const FoxHelmet:React.FC<{frame:number;small?:boolean;isInside?:boolean}>=({frame,small=false,isInside=false})=>{
 const t=frame/FPS;const scale=small?.37:1;
 return <group scale={[scale,scale,scale]} position={[0,Math.sin(t*3)*.04,0]} rotation={[0,Math.sin(t*1.8)*.10,Math.sin(t*2)*.035]}>
  {/* open wearable fox fursuit head: body is a hollow shell, not an animal */}
  <mesh position={[0,1.02,0]} castShadow><sphereGeometry args={[.78,44,26,0,Math.PI*2,0,Math.PI*.78]}/><meshStandardMaterial color="#d46b1b" roughness={.97} side={THREE.DoubleSide}/></mesh>
  <Tor p={[0,.40,0]} r={.51} c="#383a3c" rot={[Math.PI/2,0,0]}/>
  {[-1,1].map(q=><group key={q}>
    <mesh position={[q*.48,1.98,-.02]} rotation={[0,0,q*-.21]} castShadow>
      <coneGeometry args={[.34,.77,5]}/>{C("#b94d18")}
    </mesh>
    <Egg p={[q*.48,1.99,.205]} s={[.18,.30,.075]} c="#723d45"/>
    <Egg p={[q*.49,.70,.30]} s={[.33,.35,.46]} c="#f2e4ce"/>
    <Egg p={[q*.28,1.25,.57]} s={[.23,.22,.15]} c="#372826"/>
    <Egg p={[q*.28,1.25,.71]} s={[.18,.16,.08]} c="#f2ce80"/>
    <Egg p={[q*.28+.018,1.25,.781]} s={[.077,.11,.03]} c="#143445"/>
    <Egg p={[q*.28+.005,1.29,.817]} s={[.028,.035,.011]} c="#ffffff"/>
    <Egg p={[q*.17,.64,.64]} s={[.27,.19,.27]} c="#f3e7d3"/>
  </group>)}
  <Egg p={[0,.67,.88]} s={[.17,.10,.12]} c="#222c36"/>
  <Egg p={[0,.45,.61]} s={[.35,.11,.20]} c="#fbf0df"/>
  {/* short curved faux-fur tufts are actual 3D cones */}
  {Array.from({length:160},(_,i)=>{
   const u=hash(i*11)*1.6-.7,a=hash(i*13)*Math.PI*2,v=Math.sqrt(1-u*u);
   const x=v*Math.cos(a)*.78,y=1.02+u*.75,z=v*Math.sin(a)*.76;
   return <mesh key={i} position={[x,y,z]} rotation={[u,0,-a]} scale={[.4+hash(i*17)*.45,.4,1]}>
     <coneGeometry args={[.022,.11,3]}/>{C(i%4===0?"#ef8a34":"#c36223")}
   </mesh>;
  })}
  {isInside&&<Egg p={[0,1.24,-.44]} s={[.12,.07,.17]} c="#0c1420"/>}
 </group>;
};
const Room:React.FC<{frame:number;clean:boolean}>=({frame,clean})=><group>
 <Box3 p={[0,-.12,0]} s={[10,.22,9]} c="#a07755"/>
 {Array.from({length:25},(_,i)=><Box3 key={i} p={[-4.8+i*.40,.015,0]} s={[.39,.018,9]} c={i%3===0?"#a77d59":"#93684c"}/>)}
 <Box3 p={[0,2.9,-4.48]} s={[10,6,.28]} c="#d6cbbb"/>
 <Box3 p={[-4.95,2.9,0]} s={[.25,6,9]} c="#d0c3b2"/>
 <Box3 p={[3.1,3.0,-4.25]} s={[2.3,3.0,.18]} c="#8db2ce"/>
 {[-1,1].map(i=><Box3 key={i} p={[3.1+i*.6,3.0,-4.10]} s={[.09,3.08,.11]} c="#f1e6d5"/>)}
 <Box3 p={[3.1,3,-4.08]} s={[2.35,.10,.13]} c="#f1e6d5"/>
 <Box3 p={[-1.7,.45,-2.5]} s={[3.2,.8,1.7]} c="#526c62"/>
 <Box3 p={[-1.7,1.25,-3.25]} s={[3.2,1.15,.3]} c="#6c8074"/>
 {[-2.7,-.7].map(x=><Egg key={x} p={[x,.95,-2.18]} s={[.67,.24,.65]} c="#819b89"/>)}
 <Box3 p={[-3.3,.83,-2.45]} s={[.40,1.4,1.5]} c="#4d655b"/>
 <Box3 p={[-.1,.83,-2.45]} s={[.40,1.4,1.5]} c="#4d655b"/>
 <Box3 p={[.25,.07,.40]} s={[7,.10,4.7]} c="#c3baa0"/>
 {Array.from({length:14},(_,i)=><Box3 key={i} p={[-3+i*.5,.135,.4]} s={[.019,.01,4.5]} c="#a89d8b"}/>)}
 <Box3 p={[-3.9,2.3,-3.3]} s={[1.8,4.4,.36]} c="#684f3c"/>
 {[1,1.8,2.6,3.4].map(y=><Box3 key={y} p={[-3.9,y,-3.1]} s={[1.74,.12,.58]} c="#a28263"/>)}
 {Array.from({length:26},(_,i)=><Box3 key={i} p={[-4.65+(i%7)*.22,1.16+Math.floor(i/7)*.8,-2.86]} s={[.14,.38+(i%3)*.06,.18]} c={["#b87365","#697c93","#edbf7c","#506e63"][i%4]}/>)}
 {!clean&&<DustCloud frame={frame} type="room"/>}
 </group>;
const DustCloud:React.FC<{frame:number;type:"room"|"flow"|"cyclone"|"carpet";blocked?:boolean}>=({frame,type,blocked=false})=>{
 const t=frame/FPS;
 const count=type==="room"?150:95;
 return <group>{Array.from({length:count},(_,i)=>{
   const ph=hash(i*41)*Math.PI*2,r=hash(i*17),a=ph+t*(type==="cyclone"?4.3:1.4);
   let x=0,y=0,z=0;
   if(type==="room"){x=-3.5+hash(i*13)*7;y=.2+hash(i*19)*2+Math.sin(a)*.38;z=-1.5+hash(i*29)*5;}
   else if(type==="cyclone"){const rad=.37+hash(i*29)*.21;x=Math.cos(a)*rad;y=.7+((r+t*.6)%1.9);z=Math.sin(a)*rad;}
   else if(type==="flow"){x=-3+(t*2.1+r*7)%6;y=.8+Math.sin(a)*.3;z=Math.cos(ph)*.24;}
   else{x=-2+(t*1.2+r*5)%4;y=.17+Math.abs(Math.sin(a))*.24;z=hash(i*13)*2-1;}
   return <mesh key={i} position={[x,y,z]} scale={[1,1.7,1]} rotation={[a,a*.3,0]}>
     <icosahedronGeometry args={[type==="room"?.025:.039,0]}/><meshStandardMaterial color={blocked?"#e36b45":i%3===0?"#ffc075":"#f09038"} emissive="#b54a06" emissiveIntensity={.17} roughness={.95}/>
   </mesh>;
  })}</group>;
};
const Vacuum:React.FC<{frame:number;phase:Phase;step:number}>=({frame,phase,step})=>{
 const t=frame/FPS,expose=phase==="cyclone"||phase==="bin"||phase==="filter"||phase==="clog";
 const active=phase==="fan"||phase==="exhaust"||phase==="cyclone"||phase==="brush"||phase==="filter"||phase==="bin"||phase==="clean";
 const brush=phase==="brush"||phase==="carpet"||phase==="clean",stopped=phase==="blocked"||phase==="thermal";
 return <group>
  <Box3 p={[.62,.31,0]} s={[2.10,.58,1.27]} c="#293b48"/>
  {[-.65,.65].map(q=><group key={q}><mesh position={[1.32,.29,q]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.35,.35,.21,30]}/>{C("#1c2938")}</mesh><Tor p={[1.32,.29,q*1.21]} r={.18} c="#bdc8cd" rot={[Math.PI/2,0,0]}/></group>)}
  <mesh position={[.87,.97,.04]} rotation={[Math.PI/2,0,0]}>
   <cylinderGeometry args={[.47,.47,.8,40]}/><meshStandardMaterial color="#526a7b" metalness={.8} roughness={.24} side={THREE.DoubleSide}/>
  </mesh>
  <group position={[.87,.97,.49]} rotation={[0,0,active?t*20:0]}>
    {Array.from({length:9},(_,i)=><mesh key={i} rotation={[0,0,i*Math.PI/4.5]} position={[0,.22,0]}>
      <boxGeometry args={[.19,.32,.026]}/><meshStandardMaterial color="#eba24d" metalness={.55} roughness={.35}/>
    </mesh>)}
    <Egg p={[0,0,0]} s={[.1,.1,.12]} c="#fbe1a8"/>
  </group>
  <mesh position={[-.46,1.4,0]}>
    <cylinderGeometry args={[.57,.49,1.65,48,1,true]}/>
    <meshPhysicalMaterial color="#89d1e4" transparent opacity={expose?.13:.38} roughness={.11} depthWrite={false} side={THREE.DoubleSide}/>
  </mesh>
  <mesh position={[-.46,1.44,0]}><coneGeometry args={[.34,1.15,36,1,true]}/><meshStandardMaterial color="#c8ab8b" metalness={.6} roughness={.30} side={THREE.DoubleSide}/></mesh>
  <mesh position={[-.46,2.26,0]}><cylinderGeometry args={[.60,.60,.12,40]}/>{C("#354655")}</mesh>
  <mesh position={[-.46,.56,0]}><cylinderGeometry args={[.53,.53,.12,40]}/>{C("#354655")}</mesh>
  {step>=4&&<mesh position={[.25,1.66,0]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.27,.27,.48,40]}/>{C("#c997df")}</mesh>}
  {step>=7&&<mesh position={[1.5,1.25,.35]}><sphereGeometry args={[.08,20,14]}/><meshBasicMaterial color={stopped?"#ff273e":"#35ffa1"}/></mesh>}
  {/* Real 3D hose geometry with opening and physically animated carpet brush */}
  <mesh rotation={[0,Math.PI/2,0]} position={[-1.40,.66,.28]}>
    <torusGeometry args={[.35,.14,12,48]}/>{C("#4d6270")}
  </mesh>
  <Box3 p={[-1.86,.23,.72]} s={[1.45,.34,.75]} c="#374b59"/>
  {brush&&<group position={[-1.86,.14,1.10]} rotation={[0,0,stopped?0:t*16]}>
   <mesh rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.17,.17,1.19,32]}/>{C("#df7a38")}</mesh>
   {Array.from({length:24},(_,i)=><mesh key={i} rotation={[0,i*Math.PI/12,0]} position={[-.53+(i%12)*.1,Math.sin(i*2)*.10,.12]}>
      <boxGeometry args={[.018,.12,.016]}/>{C(i%2?"#64d3df":"#f3a748")}
   </mesh>)}
  </group>}
  {(phase==="cyclone"||phase==="bin"||phase==="filter")&&<group position={[-.46,.25,0]}><DustCloud frame={frame} type="cyclone"/></group>}
  {(phase==="fan"||phase==="exhaust")&&<group position={[.25,0,.36]}><DustCloud frame={frame} type="flow"/></group>}
  {phase==="gag"||phase==="inside"||phase==="punch"?<group position={[-.46,.78,.10]}><FoxHelmet frame={frame} small isInside/></group>:null}
 </group>;
};
const ArrowField:React.FC<{frame:number;phase:Phase}>=({frame,phase})=>{
 if(!["fan","exhaust","cyclone","filter","bin","brush"].includes(phase))return null;
 const t=frame/FPS;
 return <group>
   {Array.from({length:18},(_,i)=>{const a=i*.35+t*3.7;
    const cyclone=phase==="cyclone"||phase==="bin";
    return <mesh key={i} position={cyclone?[-.46+Math.cos(a)*(.68+i%3*.05),.85+((t*.45+i*.13)%1.25),Math.sin(a)*(.68+i%3*.05)]:[-2.4+((t*1.8+i*.20)%3.2),.80+Math.sin(a)*.14,.8]} rotation={[a,0,a]}>
    <coneGeometry args={[.055,.19,5]}/><meshBasicMaterial color={phase==="exhaust"?"#ff9c58":"#4feaff"} toneMapped={false}/>
   </mesh>})}
 </group>;
};
const stages:Record<Phase,number>={problem:0,broom:0,fan:1,exhaust:1,bin:2,clog:3,cyclone:4,filter:5,carpet:5,brush:6,blocked:7,thermal:7,clean:8,gag:8,inside:8,punch:8};
const MachineScene:React.FC<{frame:number;phase:Phase;progress:number}>=({frame,phase,progress})=>{
 const phaseRoom=phase==="problem"||phase==="broom"||phase==="clean";
 const fox=phase==="problem"||phase==="broom"||phase==="carpet";
 const close=phase==="cyclone"||phase==="bin"||phase==="filter"||phase==="inside"||phase==="punch";
 const t=frame/FPS;
 const cam:Cam=phaseRoom?{pos:[4.5+Math.sin(t*.45)*.6,3.55,8.2-progress*.3],look:[-.3,1.1,-1.5],fov:39}:
   close?{pos:[2.7+Math.sin(t*.6)*.65,2.45+Math.sin(t*.4)*.10,4.1-progress*.6],look:[-.28,1.3,.03],fov:33}:
   {pos:[3.85+Math.sin(t*.53)*.7,2.3,5.6-progress*.4],look:[-.4,.95,.4],fov:35};
 const vacShift=phase==="brush"||phase==="carpet"||phase==="clean"?Math.sin(t*.9)*.85:0;
 return <>
  <CameraRig cam={cam}/>
  <color attach="background" args={["#c7b6a4"]}/>
  <hemisphereLight intensity={1.65} color="#e5eeff" groundColor="#72543a"/>
  <directionalLight position={[3,8,4]} intensity={2.4} color="#fff3da" castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10}/>
  <pointLight position={[-3,3,-2]} intensity={30} distance={13} color="#ffdfa3"/>
  <Room frame={frame} clean={phase==="clean"||phase==="gag"||phase==="inside"||phase==="punch"}/>
  {fox&&<group position={[-1.7,.75,-1.9]} scale={[.90,.90,.90]}><FoxHelmet frame={frame}/></group>}
  {phase!=="problem"&&phase!=="broom"&&<group position={[vacShift+1.0,.08,1.4]} rotation={[0,-.22,0]}>
    <Vacuum frame={frame} phase={phase} step={stages[phase]}/>
    <ArrowField frame={frame} phase={phase}/>
   </group>}
  {phase==="carpet"||phase==="brush"?<group position={[0,0,1.4]}><DustCloud frame={frame} type="carpet"/></group>:null}
 </>;
};
const Overlay:React.FC<{frame:number;phase:Phase;name:string;word:string;local:number}>=({frame,phase,name,word,local})=>{
 const op=smooth(local/8);
 const blocked=phase==="blocked"||phase==="thermal";
 const wfs=Math.min(130,Math.max(68,900/Math.max(2,word.length*.63)));
 return <AbsoluteFill style={{pointerEvents:"none"}}>
   <div style={{position:"absolute",top:86,left:72,color:"#d9f4ff",fontFamily:"Arial,sans-serif",fontWeight:800,letterSpacing:4,fontSize:27}}>POCKET PUH / BUILD 03</div>
   <div style={{position:"absolute",top:145,left:72,color:blocked?"#ff6875":"#fff9e9",fontFamily:"Arial,sans-serif",fontWeight:900,fontSize:45,letterSpacing:1,textShadow:"0 5px 14px #14202a",opacity:op}}>{name}</div>
   {(phase==="cyclone"||phase==="fan"||phase==="filter")&&<div style={{position:"absolute",top:260,left:70,display:"flex",gap:15}}>
     <div style={{padding:"11px 15px",border:"2px solid #65eaff",color:"#b7faff",borderRadius:9,font:"700 28px Arial",background:"#18333bbb"}}>{phase==="cyclone"?"SPIN":"AIR IN"}</div>
     <div style={{padding:"11px 15px",border:"2px solid #eca452",color:"#ffe3c1",borderRadius:9,font:"700 28px Arial",background:"#382719cc"}}>{phase==="cyclone"?"SEPARATE":"AIR OUT"}</div>
   </div>}
   {blocked&&<div style={{position:"absolute",top:"50%",left:"13%",right:"13%",background:"#5b1b2599",padding:25,border:"5px solid #ff6870",textAlign:"center",color:"#fff",font:"900 55px Arial"}}>{phase==="thermal"?"AUTO SHUTOFF":"OVERHEAT!"}</div>}
   <div style={{position:"absolute",left:40,right:40,bottom:140,height:190,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <span style={{fontFamily:"Arial Black,Arial,sans-serif",fontSize:wfs,textTransform:"uppercase",fontWeight:900,color:"white",textAlign:"center",textShadow:"4px 4px #09101a,-4px 4px #09101a,4px -4px #09101a,-4px -4px #09101a,0 10px 4px #080c12"}}>{word}</span>
   </div>
   <div style={{position:"absolute",left:68,right:68,bottom:72,height:5,background:"#ffffff50"}}><div style={{width:(100*frame/ACTIVE_DURATION)+"%",height:5,background:"#ffa65c"}}/></div>
  </AbsoluteFill>;
};
export const VacuumActive3D:React.FC<{sample?:boolean}>=({sample=false})=>{
 const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 // the isolated 10s test starts directly with the cyclone mechanism, full reel uses all beats
 const actualFrame=sample?frame+Math.round(cue("So you make the air spin")):frame;
 let stage=0;for(let i=0;i<beats.length;i++)if(actualFrame>=beats[i].f)stage=i;else break;
 const b=beats[stage],local=actualFrame-b.f;
 let wordIdx=0;const sec=actualFrame/FPS;
 for(let i=0;i<words.length;i++)if(words[i].start<=sec)wordIdx=i;else break;
 return <AbsoluteFill style={{background:"#172734"}}>
  <ThreeCanvas width={width} height={height} camera={{fov:40,near:.05,far:50}} shadows>
   <MachineScene frame={actualFrame} phase={b.kind} progress={smooth(local/65)}/>
  </ThreeCanvas>
  <Overlay frame={actualFrame} phase={b.kind} name={b.name} word={words[wordIdx]?.word??""} local={local}/>
  {!sample&&<Audio src={staticFile("vacuum-motion/vo.mp3")}/>}
 </AbsoluteFill>;
};
