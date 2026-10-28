import React, {useMemo} from "react";
import * as THREE from "three";
import {ThreeCanvas} from "@remotion/three";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {Cam, CameraRig} from "../../lib/three/core";

/**
 * TRUE 3D procedural look-dev for Vacuum Cleaner V2.
 * Every hero object is a real triangle mesh: room, furniture, giant pocket puh,
 * impeller, hoses, cyclone, filter, wheels, brushes and particulate.
 * No image planes, image-generation assets, SVG scenery or flat fake 3D.
 * Frame-driven only: deterministic at every frame for Remotion parallel renders.
 */
type V = [number,number,number];
type PanelProps={position:V;size:V;color:string;roughness?:number;metalness?:number};
const Panel:React.FC<PanelProps>=({position,size,color,roughness=.72,metalness=0})=><mesh position={position} castShadow receiveShadow>
  <boxGeometry args={size}/><meshStandardMaterial color={color} roughness={roughness} metalness={metalness}/>
</mesh>;
const Ball:React.FC<{p:V;s:V;color:string;rough?:number;metal?:number}>=({p,s,color,rough=.78,metal=0})=><mesh position={p} scale={s} castShadow receiveShadow>
  <sphereGeometry args={[1,30,22]}/><meshStandardMaterial color={color} roughness={rough} metalness={metal}/>
</mesh>;
const rnd=(n:number)=>{const r=Math.sin(n*127.1+43.9)*43173.73;return r-Math.floor(r)};

const FloorAndRoom:React.FC=()=>{
  const books=useMemo(()=>Array.from({length:54},(_,i)=>({
    x:-3.85+(i%9)*.16,
    y:1.12+Math.floor(i/9)*.45,
    height:.22+rnd(i*3)*.16,
    color:["#b97a43","#38546e","#e4af79","#728e78","#d0d0af","#b36656"][i%6]
  })),[]);
  return <group>
    <Panel position={[0,-.11,0]} size={[9,.22,8]} color="#8c6450"/>
    {Array.from({length:27},(_,i)=><Panel key={"plank"+i} position={[-4.33+i*.333,.017,0]} size={[.327,.025,7.98]} color={i%3===0?"#986f56":i%3===1?"#a77d60":"#aa8266"}/>)}
    <Panel position={[0,2.7,-4.02]} size={[9,5.7,.22]} color="#d3c6b6"/>
    <Panel position={[-4.57,2.7,0]} size={[.24,5.7,8]} color="#bca998"/>
    <Panel position={[0,5.56,-.65]} size={[9,.18,6.7]} color="#ece2d3"/>
    <Panel position={[0,.12,-3.9]} size={[9,.27,.13]} color="#f0e7dd"/>
    <Panel position={[-4.42,.12,0]} size={[.13,.27,8]} color="#f0e7dd"/>
    {/* Window: actual clear pane and thick frame set in the rear wall. */}
    <Panel position={[2.66,3.4,-3.85]} size={[2.25,2.65,.09]} color="#92bad4" roughness={.1} metalness={.08}/>
    <Panel position={[2.66,4.72,-3.70]} size={[2.45,.12,.16]} color="#eee3d2"/>
    <Panel position={[2.66,2.09,-3.70]} size={[2.45,.12,.16]} color="#eee3d2"/>
    <Panel position={[1.49,3.4,-3.70]} size={[.12,2.71,.16]} color="#eee3d2"/>
    <Panel position={[3.85,3.4,-3.70]} size={[.12,2.71,.16]} color="#eee3d2"/>
    <Panel position={[2.65,3.4,-3.68]} size={[.10,2.64,.08]} color="#eee3d2"/>
    <Panel position={[2.65,3.25,-3.68]} size={[2.38,.10,.08]} color="#eee3d2"/>
    {/* Shelves, braces, dozens of individual books: not a single flat texture. */}
    {[-3.96,-2.26].map(z=><group key={z}>
      <Panel position={[-3.88,2.15,z]} size={[1.27,4.30,.10]} color="#533d31"/>
    </group>)}
    {[1.06,1.52,1.98,2.44,2.90,3.36].map(y=><Panel key={y} position={[-3.8,y,-3.1]} size={[1.35,.10,1.5]} color="#a0784f"/>)}
    {books.map((b,i)=><Panel key={i} position={[b.x,b.y,b.height*.3-3.05]} size={[.115,b.height,.21]} color={b.color}/>)}
    {/* Sofa cushions, arms and legs: clear thickness and soft organic forms */}
    <Panel position={[-1.85,.40,-2.48]} size={[3.15,.56,1.42]} color="#506b60"/>
    <Panel position={[-1.85,1.07,-3.00]} size={[3.26,1.35,.31]} color="#617f6f"/>
    <Panel position={[-3.45,.69,-2.49]} size={[.42,1.22,1.45]} color="#567060"/>
    <Panel position={[-.25,.69,-2.49]} size={[.42,1.22,1.45]} color="#567060"/>
    {[-2.7,-1.2].map(x=><group key={x}>
      <Ball p={[x,.87,-2.30]} s={[.70,.23,.65]} color="#789186"/>
      <Ball p={[x,1.41,-2.83]} s={[.69,.50,.20]} color="#789186"/>
      <Panel position={[x,.07,-2.65]} size={[.16,.36,.16]} color="#473d36"/>
    </group>)}
    <Ball p={[-2.5,1.14,-2.35]} s={[.29,.25,.18]} color="#d3ab71"/>
    {/* Woven rug; actual thin 3D carpet with visible raised strips */}
    <Panel position={[.2,.045,1.05]} size={[6.8,.07,3.92]} color="#d3c4ac"/>
    {Array.from({length:22},(_,i)=><Panel key={i} position={[-3.08+i*.30,.093,1.05]} size={[.045,.016,3.70]} color={i%2?"#c1b09c":"#e4d4b9"}/>)}
    <Panel position={[.35,.78,-.45]} size={[1.45,.11,.82]} color="#886648"/>
    {[-.20,.9].map(x=><Panel key={x} position={[x,.39,-.45]} size={[.11,.66,.11]} color="#5a4638"/>)}
    <Panel position={[.35,.84,-.45]} size={[.99,.04,.46]} color="#a57f54"/>
    {/* Floor lamp: physical shade and stand, warm local light */}
    <mesh position={[-.15,1.95,-3.58]} castShadow><cylinderGeometry args={[.55,.8,.88,32,1,true]}/><meshStandardMaterial color="#f3dfb0" emissive="#e4ba73" emissiveIntensity={.25} side={THREE.DoubleSide}/></mesh>
    <mesh position={[-.15,1.05,-3.58]}><cylinderGeometry args={[.035,.035,1.5,12]}/><meshStandardMaterial color="#9a805f" metalness={.5} roughness={.3}/></mesh>
    <mesh position={[-.15,.10,-3.58]}><cylinderGeometry args={[.30,.30,.08,24]}/><meshStandardMaterial color="#9a805f" metalness={.5}/></mesh>
    {/* Plant with distinct stem and leaves */}
    <mesh position={[3.8,.4,-2.7]} castShadow><cylinderGeometry args={[.30,.22,.8,22]}/><meshStandardMaterial color="#98694e" roughness={.75}/></mesh>
    {Array.from({length:18},(_,i)=>{
      const a=i*2.399, y=.9+rnd(i*8)*1.6, rr=.22+rnd(i*3)*.62;
      return <group key={i}>
        <mesh position={[3.8+rr*Math.cos(a)*.55,y, -2.7+rr*Math.sin(a)*.6]} rotation={[0,a,-.55]} scale={[.18,.36,.06]} castShadow><sphereGeometry args={[1,12,10]}/><meshStandardMaterial color={i%3===0?"#4c8258":i%3===1?"#679364":"#35674b"} roughness={.9}/></mesh>
      </group>;
    })}
  </group>;
};

const FurryPlush:React.FC<{position:V;scale?:number;f:number}>=({position,scale=1,f})=>{
  const fur=useMemo(()=>{
    const geom=new THREE.ConeGeometry(.028,.12,4);
    const mat=new THREE.MeshStandardMaterial({color:"#4297de",roughness:.98,side:THREE.DoubleSide});
    const mesh=new THREE.InstancedMesh(geom,mat,1800);
    const matrix=new THREE.Matrix4(), up=new THREE.Vector3(0,1,0);
    const center=new THREE.Vector3(0,1.12,0);
    const temp=new THREE.Object3D();
    for(let i=0;i<1800;i++){
      const u=rnd(i*7)*2-1, a=rnd(i*11)*Math.PI*2,s=Math.sqrt(1-u*u);
      const n=new THREE.Vector3(s*Math.cos(a),u,s*Math.sin(a));
      const surf=new THREE.Vector3(n.x*.82,n.y*.96,n.z*.68);
      const norm=new THREE.Vector3(n.x/.82,n.y/.96,n.z/.68).normalize();
      temp.position.copy(center).add(surf).addScaledVector(norm,.045);
      temp.quaternion.setFromUnitVectors(up,norm);
      const size=.5+rnd(i*17)*.9;
      temp.scale.set(size,size,size);temp.updateMatrix();
      matrix.copy(temp.matrix);mesh.setMatrixAt(i,matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;
    return mesh;
  },[]);
  return <group position={position} scale={scale} rotation={[0,Math.sin(f*.012)*.035,0]}>
    {/* The BLUE Pocket Puh is the original volumetric plush, not a rabbit photo */}
    <Ball p={[0,1.12,0]} s={[.84,.98,.70]} color="#4a9cff"/>
    <primitive object={fur}/>
    <Ball p={[0,.96,.53]} s={[.53,.65,.23]} color="#cae8ff"/>
    {[-1,1].map(k=><group key={k}>
      <Ball p={[k*.54,2.04,-.04]} s={[.31,.32,.15]} color="#539aeb"/>
      <Ball p={[k*.54,2.06,.076]} s={[.18,.19,.08]} color="#abd8ff"/>
      <Ball p={[k*.81,1.04,.08]} s={[.25,.36,.25]} color="#4c9de3"/>
      <Ball p={[k*.39,.18,.28]} s={[.32,.18,.36]} color="#498fd1"/>
      <Ball p={[k*.25,1.53,.60]} s={[.19,.21,.11]} color="#fffdf4" rough={.18}/>
      <Ball p={[k*.25+.045,1.53,.696]} s={[.084,.095,.05]} color="#111723" rough={.15}/>
      <Ball p={[k*.25+.018,1.58,.742]} s={[.028,.028,.015]} color="#ffffff" rough={.2}/>
    </group>)}
    <Ball p={[0,1.29,.71]} s={[.07,.05,.045]} color="#151824"/>
    <mesh position={[0,1.18,.72]} rotation={[0,0,Math.PI]}><torusGeometry args={[.21,.019,8,32,Math.PI]}/><meshStandardMaterial color="#1b2334"/></mesh>
  </group>;
};

const FurDebris:React.FC<{f:number;clean?:boolean}>=({f,clean=false})=>{
  const fluff=useMemo(()=>{
    const geo=new THREE.IcosahedronGeometry(.075,1);
    const mat=new THREE.MeshStandardMaterial({color:"#54b1fb",roughness:.95,flatShading:true});
    const count=450,mesh=new THREE.InstancedMesh(geo,mat,count);
    const o=new THREE.Object3D();
    for(let i=0;i<count;i++){
      const x=-3.2+rnd(i*9)*6.3,z=-.85+rnd(i*17)*4.35;
      o.position.set(x,.11+rnd(i*13)*.10,z);const s=.30+rnd(i*27)*1.8;
      o.scale.set(s*.8,s*.25,s*.9);o.rotation.y=rnd(i*19)*Math.PI*2;o.updateMatrix();mesh.setMatrixAt(i,o.matrix);
    }
    mesh.castShadow=true;mesh.instanceMatrix.needsUpdate=true;return mesh;
  },[]);
  return <group>
    {!clean&&<primitive object={fluff}/>}
    {!clean&&Array.from({length:80},(_,i)=>{
      const x=-3.3+rnd(i*2)*6,z=-1.3+rnd(i*11)*4;
      const phase=rnd(i*9)*Math.PI*2;
      return <Ball key={i} p={[x+.07*Math.sin(f*.04+phase),.40+rnd(i*7)*2+.09*Math.sin(f*.035+phase),z]} s={[.035,.050,.032]} color="#7ac7ff"/>;
    })}
  </group>;
};
const Pipe:React.FC<{points:V[];r:number;color:string;metal?:number;transparent?:boolean}>=({points,r,color,metal=.1,transparent=false})=>{
  const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[JSON.stringify(points)]);
  return <mesh castShadow>
    <tubeGeometry args={[curve,48,r,14,false]}/>
    <meshStandardMaterial color={color} metalness={metal} roughness={.3} transparent={transparent} opacity={transparent ? 0.44 : 1}/>
  </mesh>;
};

const Vacuum:React.FC<{f:number;shot:number;finale?:boolean}>=({f,shot,finale=false})=>{
  const t=f/30;
  const blades=Array.from({length:9},(_,i)=>i);
  return <group position={[1.60,0,1.10]} rotation={[0,-.24,0]} scale={finale?1.13:1}>
    {/* Wheeled chassis, wheel hubs and castor */}
    <Panel position={[.22,.35,.04]} size={[1.7,.38,1.05]} color="#293443" roughness={.33} metalness={.25}/>
    {[-.53,.53].map(z=><group key={z}>
      <mesh position={[.80,.27,z]} rotation={[Math.PI/2,0,0]} castShadow>
        <cylinderGeometry args={[.31,.31,.18,32]}/><meshStandardMaterial color="#172332" roughness={.68}/>
      </mesh>
      <mesh position={[.80,.27,z+(z>0?.095:-.095)]} rotation={[Math.PI/2,0,0]}>
        <cylinderGeometry args={[.17,.17,.19,32]}/><meshStandardMaterial color="#a5bcc0" metalness={.75} roughness={.22}/>
      </mesh>
    </group>)}
    {/* Main motor outer case and visible impeller in real 3D */}
    <mesh position={[.68,.86,0]} rotation={[Math.PI/2,0,0]} castShadow><cylinderGeometry args={[.47,.47,.83,40,1,true]}/><meshStandardMaterial color="#344657" side={THREE.DoubleSide} metalness={.7} roughness={.25}/></mesh>
    <mesh position={[.68,.86,.45]}><torusGeometry args={[.39,.06,10,40]}/><meshStandardMaterial color="#b4d2de" metalness={.75} roughness={.22}/></mesh>
    <group position={[.68,.86,.47]} rotation={[0,0,t*17]}>
      {blades.map(i=><mesh key={i} rotation={[0,0,i*Math.PI*2/9]} position={[0,.19,0]}>
        <boxGeometry args={[.19,.31,.035]}/><meshStandardMaterial color="#e4aa61" metalness={.75} roughness={.27} side={THREE.DoubleSide}/>
      </mesh>)}
      <mesh><sphereGeometry args={[.105,20,12]}/><meshStandardMaterial color="#f4c671" metalness={.85} roughness={.13}/></mesh>
    </group>
    <mesh position={[1.06,.83,-.08]} rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.32,.32,.65,30]}/><meshStandardMaterial color="#ae5e4c" metalness={.40} roughness={.39}/></mesh>
    {Array.from({length:8},(_,i)=><Panel key={i} position={[1.07,.75+(i%4)*.07,-.35+Math.floor(i/4)*.61]} size={[.48,.018,.045]} color="#d8a56b" metalness={.52}/>)}
    {/* Transparent cyclonic chamber (center [ -.35,1.37, 0 ]) */}
    <mesh position={[-.38,1.32,0]} castShadow><cylinderGeometry args={[.56,.48,1.58,52,1,true]}/><meshPhysicalMaterial color="#b6e6f2" roughness={.10} metalness={0} transparent opacity={.23} depthWrite={false} side={THREE.DoubleSide}/></mesh>
    <mesh position={[-.38,.53,0]}><cylinderGeometry args={[.49,.49,.075,48]}/><meshStandardMaterial color="#546577" metalness={.7} roughness={.24}/></mesh>
    <mesh position={[-.38,2.1,0]}><cylinderGeometry args={[.57,.57,.11,48]}/><meshStandardMaterial color="#435466" metalness={.6} roughness={.27}/></mesh>
    <mesh position={[-.38,1.43,0]}><coneGeometry args={[.30,.95,48,1,true]}/><meshStandardMaterial color="#7fadb7" metalness={.5} roughness={.25} side={THREE.DoubleSide} transparent opacity={.8}/></mesh>
    <mesh position={[-.38,1.98,0]}><cylinderGeometry args={[.15,.15,.32,36]}/><meshStandardMaterial color="#ddbf87" metalness={.5} roughness={.35}/></mesh>
    {/* Fine filter physical pleated sections */}
    <mesh position={[.22,1.5,-.18]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.25,.25,.6,36]}/><meshStandardMaterial color="#d7c6e9" metalness={.12} roughness={.6}/></mesh>
    {Array.from({length:12},(_,i)=><mesh key={i} position={[-.04+i*.055,1.5,-.18]} rotation={[0,0,Math.PI/2]}>
      <torusGeometry args={[.25,.009,6,32]}/><meshStandardMaterial color="#8b69be" roughness={.6}/>
    </mesh>)}
    {/* Hose, nozzle, corrugations all real 3D geometry */}
    <Pipe points={[[-.93,1.70,.23],[-1.30,1.83,.31],[-1.52,1.21,.63],[-1.68,.52,.92],[-2.04,.33,1.13]]} r={.145} color="#303f4b" metal={.15}/>
    {Array.from({length:16},(_,i)=>{
      const u=i/15;
      return <mesh key={i} position={[-1.23-.32*u,1.76-.41*u,.38+.26*u]} rotation={[.25,0,.27]}>
        <torusGeometry args={[.145,.016,5,20]}/><meshStandardMaterial color="#718795" metalness={.55} roughness={.35}/>
      </mesh>;
    })}
    <Panel position={[-2.03,.24,1.11]} size={[.91,.30,.77]} color="#354b5c" metalness={.3} roughness={.32}/>
    <Panel position={[-2.00,.095,1.47]} size={[.95,.055,.03]} color="#67d7e7" metalness={.4}/>
    {/* Brush roll: actual rotating geometry */}
    <group position={[-2.03,.18,1.14]} rotation={[0,0,0]}>
      <mesh rotation={[0,0,t*22]}>
        <cylinderGeometry args={[.14,.14,.78,18]}/><meshStandardMaterial color="#ec845c" metalness={.3} roughness={.4}/>
      </mesh>
      {Array.from({length:16},(_,i)=><mesh key={i} position={[(i-7.5)*.047,0,.16*Math.sin(t*22+i*.7)]} rotation={[t*22+i*.65,0,0]}>
        <boxGeometry args={[.015,.065,.016]}/><meshStandardMaterial color={i%2?"#ed6381":"#53c5db"} roughness={.8}/>
      </mesh>)}
    </group>
    {/* The thermally protected motor warning LED */}
    <mesh position={[1.25,1.21,.36]}><sphereGeometry args={[.07,14,12]}/><meshStandardMaterial color={shot===3?"#ff3543":"#60ebaf"} emissive={shot===3?"#ff2128":"#19f9a1"} emissiveIntensity={shot===3?3:.6}/></mesh>
    {/* Physical heavy fur in chamber, rather than a flat overlay */}
    {Array.from({length:42},(_,i)=>{
      const ang=rnd(i*7)*6.28, rr=.12+rnd(i*17)*.35;
      const spin=shot===2?t*3.5:0;
      const y=.74+rnd(i*9)*1.12;
      return <Ball key={i} p={[-.38+rr*Math.cos(ang+spin),y,rr*Math.sin(ang+spin)]} s={[.018+rnd(i)*.022,.021,.03]} color="#6cbcf9"/>;
    })}
    {/* Deliberately impossible cartoon payoff is separate from engineering visuals */}
    {finale&&<>
      <mesh position={[-.30,1.18,.32]} scale={[1.45,1.16,1.24]}><sphereGeometry args={[.76,40,28]}/><meshPhysicalMaterial color="#caeafa" transparent opacity={.18} depthWrite={false} metalness={.03} roughness={.07} side={THREE.DoubleSide}/></mesh>
      <FurryPlush position={[-.32,.54,.42]} scale={.48} f={f}/>
    </>}
  </group>;
};

const BlueArrows:React.FC<{f:number;shot:number}>=({f,shot})=>{
  if(shot!==1&&shot!==2&&shot!==3)return null;
  const p=f*.11;
  return <group>
    {Array.from({length:12},(_,i)=>{
      const a=i*Math.PI/6+p,r=.27;
      return <mesh key={i} position={[1.22+r*Math.cos(a),1.4+(i%5)*.09,1.1+r*Math.sin(a)]}>
        <sphereGeometry args={[.03,10,8]}/><meshBasicMaterial color="#4febff" toneMapped={false}/>
      </mesh>;
    })}
    {Array.from({length:9},(_,i)=>{
      const z=2.35-(i*.23+p*.17)%2.05;
      return <mesh key={i} position={[-.37,.23,z]}>
        <sphereGeometry args={[.045,10,8]}/><meshBasicMaterial color="#81ebf8" toneMapped={false}/>
      </mesh>;
    })}
  </group>;
};
const SHOTS=["01 / THE PROBLEM","02 / MOTOR + AIRFLOW","03 / CYCLONE","04 / BRUSH + FILTER","05 / WRONG THING"];
const CamFor=(shot:number,f:number,motion=false):Cam=>{
  const s=f/30;
  if(motion)return {pos:[4.15+Math.sin(s*.66)*.72,2.60+Math.sin(s*.9)*.18,5.22-Math.min(1.0,s*.24)],look:[1.18,1.28,1.03],fov:31};
  const wob=Math.sin(s*.8)*.12;
  if(shot===0)return {pos:[5.1+wob,3.65,8.4-s*.18],look:[-.3,1.1,-1.2],fov:41};
  if(shot===1)return {pos:[4.85+wob,2.25,5.68],look:[1.78,1.0,1.28],fov:37};
  if(shot===2)return {pos:[2.25+wob,2.80,4.6],look:[1.13,1.46,1.15],fov:34};
  if(shot===3)return {pos:[.25+wob,.73,4.28],look:[-.38,.25,2.12],fov:34};
  return {pos:[3.7+wob,2.62,5.8],look:[1.08,1.42,1.4],fov:36};
};
export const VACUUM_3D_DURATION=150;
export const Vacuum3DLab:React.FC<{motion?:boolean}>=({motion=false})=>{
  const f=useCurrentFrame(),{width,height}=useVideoConfig();
  const shot=motion?2:Math.min(4,Math.floor(f/30));
  const cam=CamFor(shot,f,motion);
  return <AbsoluteFill style={{background:"linear-gradient(180deg,#cfbba0 0%,#c2b7aa 70%,#514c48 100%)"}}>
    <ThreeCanvas width={width} height={height} camera={{fov:40,near:.06,far:60}} gl={{antialias:true}} shadows>
      <CameraRig cam={cam}/>
      <color attach="background" args={["#c3b9ad"]}/>
      <ambientLight intensity={.48}/>
      <hemisphereLight args={["#c7e8ff","#69513c",1.65]}/>
      <directionalLight position={[2.5,7,3.8]} castShadow intensity={2.8} color="#fff4d9" shadow-mapSize={[1024,1024]} shadow-camera-near={1} shadow-camera-far={28} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9}/>
      <pointLight position={[-1,3,-1.4]} intensity={12} distance={8} color="#ffdfad"/>
      <pointLight position={[2.8,3.8,1.4]} intensity={8} distance={10} color="#c6e8ff"/>
      <FloorAndRoom/>
      {shot!==4&&<FurryPlush position={[-1.65,.6,-1.88]} scale={1.15} f={f}/>}
      <FurDebris f={f} clean={shot===4}/>
      <Vacuum f={f} shot={shot} finale={shot===4}/>
      <BlueArrows f={f} shot={shot}/>
    </ThreeCanvas>
    <div style={{position:"absolute",top:80,left:84,padding:"18px 22px",borderRadius:9,background:"rgba(14,24,36,.72)",color:"white",fontFamily:"Arial,sans-serif",fontWeight:800,fontSize:35,letterSpacing:1.3}}>
      {motion?"3D MOTION PROOF / CYCLONE":SHOTS[shot]}
    </div>
    <div style={{position:"absolute",bottom:120,left:84,color:"#fff",fontFamily:"Arial,sans-serif",fontSize:25,textShadow:"0 2px 6px #172331"}}>
      THREE.JS GEOMETRY • REAL PERSPECTIVE CAMERA • NO IMAGE PLANES
    </div>
  </AbsoluteFill>;
};
