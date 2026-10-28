import React from "react";
import {AbsoluteFill,Audio,Img,staticFile,useCurrentFrame} from "remotion";
import timeData from "../../../public/vacuum-full/words.json";
type Word={word:string;start:number;end:number};
const words:Word[]=timeData as Word[];
const fps=30;
export const FOX_VACUUM_DURATION=Math.ceil((words[words.length-1]?.end||84)*fps)+14;
const norm=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]/g,"");
const toks=words.map(x=>norm(x.word));
function at(phrase:string){
 const q=phrase.split(/\s+/).map(norm);
 for(let i=0;i<=toks.length-q.length;i++)if(q.every((w,j)=>w===toks[i+j]))return Math.floor(words[i].start*fps);
 throw new Error("Missing cue: "+phrase);
}
const cut=[
 {start:0,plate:"rooms/room_wide.png",label:"THE PROBLEM",mode:"normal"},
 {start:at("It's a furry fox helmet"),plate:"fox/threequarter.png",label:"GIANT POCKET PUH",mode:"fox"},
 {start:at("His entire apartment is turning orange"),plate:"rooms/fur.png",label:"FUR EVERYWHERE",mode:"fall"},
 {start:at("So you grab a broom"),plate:"rooms/room.png",label:"TRY A BROOM",mode:"fall"},
 {start:at("So you put a spinning fan"),plate:"machine/vacuum_blender/hero.png",label:"BUILD AN IMPELLER",mode:"flow"},
 {start:at("But you've built a machine"),plate:"machine/vacuum_blender/hero.png",label:"DIRTY EXHAUST",mode:"flow"},
 {start:at("So you seal a dust container"),plate:"machine/vacuum_blender/cyclone.png",label:"SEALED DUST BIN",mode:"dust"},
 {start:at("But the filter clogs"),plate:"machine/vacuum_blender/hero.png",label:"FILTER CLOGGED",mode:"warning"},
 {start:at("So you make the air spin"),plate:"machine/vacuum_blender/cyclone.png",label:"CYCLONE SEPARATOR",mode:"cyclone"},
 {start:at("The smaller dust can keep going"),plate:"machine/vacuum_blender/cyclone.png",label:"SMALL DUST CONTINUES",mode:"cyclone"},
 {start:at("So you add a fine filter"),plate:"machine/vacuum_blender/hero.png",label:"EXHAUST FILTER",mode:"flow"},
 {start:at("But the carpet is still orange"),plate:"rooms/fur.png",label:"CARPET STILL DIRTY",mode:"fall"},
 {start:at("So you add a rotating brush"),plate:"machine/vacuum_blender/brush.png",label:"ROTATING BRUSH",mode:"brush"},
 {start:at("But the hose gets blocked"),plate:"machine/vacuum_blender/hero.png",label:"AIRFLOW BLOCKED",mode:"warning"},
 {start:at("So you add a thermal cutout"),plate:"machine/vacuum_blender/hero.png",label:"THERMAL CUTOUT",mode:"warning"},
 {start:at("Finally the floor is spotless"),plate:"rooms/room_wide.png",label:"EVERYTHING CLEAN",mode:"clean"},
 {start:at("Even the giant pocket puh is gone"),plate:"rooms/punchline.png",label:"WAIT A SECOND...",mode:"gag"},
 {start:at("You look inside the transparent dust bin"),plate:"rooms/bin_close.png",label:"INSIDE THE BIN",mode:"gag"},
 {start:at("Your friend says"),plate:"fox/front.png",label:"YOU CLEANED THE WRONG THING",mode:"gag"},
 {start:at("And that's what happens when"),plate:"rooms/room_wide.png",label:"ALL BECAUSE...",mode:"clean"}
];
const src=(file:string)=>staticFile("vacuum-full/"+file);
const particles=Array.from({length:48},(_,i)=>({x:50+((i*137)%960),y:120+((i*271)%1510),r:4+i%7}));
const Extras:React.FC<{mode:string;f:number}>=({mode,f})=>{
 const t=f/fps;
 const warn=mode==="warning";
 const particle=mode==="fall"||mode==="dust"||mode==="cyclone"||mode==="brush";
 return <svg style={{position:"absolute",left:0,top:0,width:"100%",height:"100%",pointerEvents:"none"}} viewBox="0 0 1080 1920">
  {particle&&particles.map((p,i)=>{
    let x=p.x+Math.sin(t*1.6+i)*22,y=(p.y+t*34)%1920;
    if(mode==="cyclone"){const a=i*.53+t*4.1;const r=46+i%18*13;x=545+Math.cos(a)*r;y=995+Math.sin(a)*r*.75;}
    return <circle key={i} cx={x} cy={y} r={p.r} fill={mode==="cyclone"?"#69d4ff":"#fca456"} opacity=".70"/>;
  })}
  {(mode==="flow"||mode==="cyclone"||mode==="dust")&&<g fill="none" stroke="#5fe2fa" strokeWidth="10">
   <path d="M 125 1320 Q 280 1270 395 1140" strokeDasharray="26 25" strokeDashoffset={-f*5}/>
   <path d="M 385 1175 l35 -48 -47 -12"/>
   <path d="M 610 1110 Q 745 985 810 810" strokeDasharray="26 25" strokeDashoffset={-f*5}/>
  </g>}
  {mode==="brush"&&<g fill="none" stroke="#8cf7fa" strokeWidth="12">
   <path d="M190 1370 Q 450 1300 780 1360" strokeDasharray="19 20" strokeDashoffset={-f*5}/>
   <path d="M750 1330 l50 35 -50 25"/>
  </g>}
  {warn&&<g>
    <rect x="180" y="510" width="720" height="142" rx="18" fill="#281720" opacity=".92" stroke="#ff6174" strokeWidth="6"/>
    <text x="540" y="601" textAnchor="middle" fill="#ff9da7" fontSize="64" fontWeight="900" fontFamily="Arial">
       {f%28<14?"MOTOR TOO HOT":"SAFETY CUTOFF"}
    </text>
  </g>}
 </svg>;
};
export const VacuumFoxFullPreview:React.FC=()=>{
 const f=useCurrentFrame(),t=f/fps;
 let ci=0;for(let i=0;i<cut.length;i++)if(f>=cut[i].start)ci=i;else break;
 const shot=cut[ci],local=f-shot.start;
 let wordI=0;for(let i=0;i<words.length;i++)if(t>=words[i].start)wordI=i;else break;
 const w=words[wordI]?.word||"";
 const fontsize=Math.min(135,Math.max(69,1030/(Math.max(2,w.length)*.72)));
 const sFrame=Math.floor((local%45)/4)*4;
 const imagePath=shot.mode==="cyclone"?"machine/vacuum_motion/f_"+String(sFrame).padStart(3,"0")+".png":shot.plate;
 const zoom=1.065+Math.min(local/30,8)*.01;
 const dx=Math.sin(t*.65+ci)*16,dy=Math.cos(t*.53+ci)*12;
 return <AbsoluteFill style={{background:"#0d1b28",overflow:"hidden"}}>
  <Img src={src(imagePath)} style={{position:"absolute",left:"-4%",top:"-3%",height:"106%",width:"108%",objectFit:"cover",
   transform:"translate("+dx+"px,"+dy+"px) scale("+zoom+")",opacity:Math.min(1,local/8),
   filter:shot.mode==="warning"?"saturate(.80) contrast(1.16)":"saturate(1.15) contrast(1.08)"}}/>
  <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(7,19,30,.58),transparent 27%,transparent 65%,rgba(5,14,24,.71))"}}/>
  <Extras mode={shot.mode} f={local}/>
  <div style={{position:"absolute",top:95,left:70,right:70,color:"#e3e9ee",fontFamily:"Arial",fontSize:29,fontWeight:800,letterSpacing:3}}>
   POCKET PUH / EPISODE 03
  </div>
  <div style={{position:"absolute",top:153,left:70,right:65,color:"#fff",fontFamily:"Arial",fontSize:49,fontWeight:900,letterSpacing:1,textShadow:"0 3px 12px #001119"}}>
   {shot.label}
  </div>
  <div style={{position:"absolute",bottom:180,left:65,right:65,height:168,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <span style={{fontFamily:"Arial Black,Arial,sans-serif",fontSize:fontsize,fontWeight:900,color:"white",textTransform:"uppercase",
     whiteSpace:"nowrap",textShadow:"3px 3px #08131d,-3px 3px #08131d,3px -3px #08131d,-3px -3px #08131d,0 8px 5px #000"}}>
     {w}
    </span>
  </div>
  <div style={{position:"absolute",bottom:63,left:75,right:75,height:6,background:"#606c78"}}>
    <div style={{width:(100*f/FOX_VACUUM_DURATION)+"%",height:6,background:"#f6bc74"}}/>
  </div>
  <Audio src={src("vo.mp3")}/>
 </AbsoluteFill>;
};
