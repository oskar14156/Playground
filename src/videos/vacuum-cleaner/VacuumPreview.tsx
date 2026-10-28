import React from "react";
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from "remotion";
import {MusicBed, Sfx} from "../../lib/Sound";
import rawWords from "../../../public/vacuum-cleaner/words.json";

type Word = {word:string;start:number;end:number};
const words:Word[] = rawWords as Word[];
const FPS=30;
export const DURATION=Math.ceil(((words[words.length-1]?.end) || 80)*FPS)+24;
const clean=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
const tokens=words.map(w=>clean(w.word));
function at(phrase:string):number {
  const q=phrase.split(/\s+/).map(clean);
  for(let i=0;i<=tokens.length-q.length;i++) {
    if(q.every((w,k)=>tokens[i+k]===w)) return Math.round(words[i].start*FPS);
  }
  // The voice's word timings are the clock; a missing cue is a real error.
  throw new Error("Missing word cue: "+phrase);
}
const c={
  broom:at("So you grab a broom"),
  fan:at("So you put a spinning fan"),
  blow:at("shoots fur out the back"),
  bin:at("So you seal a dust container"),
  clog:at("But the filter clogs"),
  cyclone:at("So you make the air spin"),
  small:at("The smaller dust can keep going"),
  fine:at("So you add a fine filter"),
  brush:at("So you add a rotating brush"),
  blocked:at("But the hose gets blocked"),
  thermal:at("So you add a thermal cutout"),
  nozzle:at("And then you make the nozzle bigger"),
  done:at("Finally the floor is spotless"),
  gone:at("Even the giant pocket puh is gone"),
  eyes:at("Two googly eyes stare back"),
  wrong:at("Your friend says"),
};
const d=(i:number)=>{const x=Math.sin(i*127.13+34.1)*43758.5453;return x-Math.floor(x)};
const fuzz=Array.from({length:185},(_,i)=>({x:75+d(i*7)*920,y:1000+d(i*11)*660,r:3+d(i*17)*13,phase:d(i*23)*Math.PI*2}));
const colors=["#ffd56d","#f7ede0","#6ba5e7","#9bc3db","#e6d5ba","#dd8b75","#85a48d"];
const Plush:React.FC<{x:number;y:number;s?:number;t:number;inside?:boolean}>=({x,y,s=1,t,inside=false})=>(
  <g transform={"translate("+x+" "+(y+Math.sin(t*2.3)*4)+") scale("+s+")"}>
    <ellipse cx="0" cy="300" rx="162" ry="26" fill="#112846" opacity="0.36"/>
    <g filter="url(#softshadow)">
      <ellipse cx="-98" cy="183" rx="55" ry="65" fill="url(#fur)" transform="rotate(-21 -98 183)"/>
      <ellipse cx="98" cy="183" rx="55" ry="65" fill="url(#fur)" transform="rotate(21 98 183)"/>
      <ellipse cx="-93" cy="-68" rx="54" ry="60" fill="url(#fur)" stroke="#3069ac" strokeWidth="7"/>
      <ellipse cx="93" cy="-68" rx="54" ry="60" fill="url(#fur)" stroke="#3069ac" strokeWidth="7"/>
      <ellipse cx="-93" cy="-68" rx="33" ry="37" fill="#9dcbfb"/>
      <ellipse cx="93" cy="-68" rx="33" ry="37" fill="#9dcbfb"/>
      <ellipse cy="108" rx="144" ry="158" fill="url(#fur)" stroke="#20588c" strokeWidth="8"/>
      <ellipse cy="138" rx="88" ry="102" fill="url(#belly)" opacity=".96"/>
      <ellipse cx="-66" cy="264" rx="60" ry="35" fill="url(#fur)" stroke="#2e6ca6" strokeWidth="6"/>
      <ellipse cx="66" cy="264" rx="60" ry="35" fill="url(#fur)" stroke="#2e6ca6" strokeWidth="6"/>
      <ellipse cx="-46" cy="46" rx="32" ry="38" fill="white"/>
      <ellipse cx="46" cy="46" rx="32" ry="38" fill="white"/>
      <ellipse cx="-39" cy="52" rx="14" ry="19" fill="#1c2943"/>
      <ellipse cx="53" cy="52" rx="14" ry="19" fill="#1c2943"/>
      <circle cx="-43" cy="45" r="6" fill="white"/>
      <circle cx="49" cy="45" r="6" fill="white"/>
      <ellipse cy="100" rx="13" ry="8" fill="#1d324a"/>
      <path d="M -38 115 Q 0 151 38 115" stroke="#1d324a" strokeWidth="7" fill="none" strokeLinecap="round"/>
      {inside&&<circle cx="0" cy="118" r="3" fill="#fff"/>}
    </g>
  </g>
);
const Apartment:React.FC<{f:number;cleaned:boolean;gone:boolean}>=({f,cleaned,gone})=>{
  const time=f/FPS;
  const density=cleaned?0.09:1;
  return <g>
    <rect width="1080" height="1920" fill="url(#sky)"/>
    <path d="M0 1200 L1080 1200 L1080 1720 L0 1720Z" fill="url(#floor)"/>
    <rect x="44" y="250" width="990" height="950" rx="30" fill="url(#wall)" stroke="#fbf0dc" strokeWidth="16"/>
    {Array.from({length:9},(_,i)=><path key={i} d={"M44 "+(350+i*95)+" H1034"} stroke="#b4b5b1" opacity=".1" strokeWidth="3"/>)}
    <rect x="76" y="295" width="320" height="410" rx="18" fill="#f3dcc2" stroke="#9b8066" strokeWidth="19"/>
    <rect x="96" y="315" width="278" height="371" fill="url(#window)"/>
    <circle cx="315" cy="371" r="47" fill="#fff7b2" opacity=".8"/>
    {Array.from({length:8},(_,i)=><rect key={i} x={96+i*36} y={505+d(i)*50} width={29} height={220} fill={["#526980","#465c78","#627689"][i%3]}/>)}
    <path d="M237 305 V696 M80 507 H391" stroke="#eee2d1" strokeWidth="18"/>
    <rect x="565" y="300" width="330" height="550" rx="14" fill="#604c3d" stroke="#2c2928" strokeWidth="12"/>
    {[365,505,645,785].map((y,j)=><g key={y}>
      <rect x="573" y={y} width="318" height="21" fill="#af8361"/>
      {Array.from({length:9},(_,i)=><rect key={i} x={582+i*33} y={y-70-d(i+j*13)*16} width={18+d(i+j*9)*8} height={70+d(i+j*13)*16} rx="2" fill={colors[(i+j)%colors.length]} stroke="#715f53" strokeWidth="2"/>)}
    </g>)}
    <path d="M60 1192 H1022" stroke="#f5ebdb" strokeWidth="28"/>
    {Array.from({length:17},(_,i)=><g key={i}>
      <path d={"M0 "+(1215+i*33)+" H1080"} stroke="#694c3e" opacity=".2" strokeWidth="5"/>
      <path d={"M"+((i%2)*160)+" 1200 L"+((i%2)*160)+" 1800"} stroke="#fff" opacity=".05"/>
    </g>)}
    <path d="M80 1320 L760 1320 L915 1585 L0 1585Z" fill="#bfb1a4" opacity=".45"/>
    <path d="M92 1293 L759 1293 L893 1550 L13 1550Z" fill="#748c96" stroke="#e2c4aa" strokeWidth="21"/>
    {Array.from({length:13},(_,i)=><path key={i} d={"M"+(105+i*54)+" 1315 l-72 210"} stroke="#cad5d6" opacity=".35" strokeWidth="5"/>)}
    <g filter="url(#softshadow)">
      <rect x="170" y="865" width="400" height="360" rx="55" fill="url(#sofa)" stroke="#5f655d" strokeWidth="8"/>
      <rect x="205" y="900" width="155" height="172" rx="38" fill="#86948a"/>
      <rect x="373" y="900" width="155" height="172" rx="38" fill="#89978e"/>
      <rect x="149" y="1007" width="442" height="185" rx="48" fill="#65786b" stroke="#52695e" strokeWidth="9"/>
      <rect x="130" y="972" width="94" height="198" rx="35" fill="#6c8273"/>
      <rect x="521" y="972" width="92" height="198" rx="35" fill="#6c8273"/>
      <path d="M194 1179 v46 M530 1179 v46" stroke="#655343" strokeWidth="18"/>
    </g>
    <g transform="translate(850 975)">
      <rect x="-16" y="130" width="33" height="87" fill="#916846"/>
      <rect x="-56" y="203" width="112" height="14" rx="7" fill="#805b40"/>
      <path d="M0 136 L0 -64" stroke="#b69d73" strokeWidth="16"/>
      <path d="M-78 -70 Q 0 -190 78 -70 Z" fill="url(#lamp)" stroke="#8e7458" strokeWidth="6"/>
      <ellipse cy="-65" rx="80" ry="12" fill="#fffbd7" opacity=".4"/>
    </g>
    <g transform="translate(941 1120)">
      <path d="M-32 35 L31 35 L20 123 L-22 123Z" fill="#b77d5b"/>
      {[-2,-1,0,1,2].map((a)=><path key={a} d={"M0 41 Q"+(a*60)+" -120 "+(a*42)+" -145"} fill="none" stroke="#517d52" strokeWidth="13" strokeLinecap="round"/>)}
      {[-2,-1,0,1,2].map((a)=><ellipse key={a} cx={a*38} cy={-148+d(a+5)*44} rx="41" ry="20" fill="#548a65" transform={"rotate("+(a*24)+" "+(a*38)+" -128)"}/>)}
    </g>
    {!gone&&<Plush x={720} y={812} s={.77} t={time}/>}
    {fuzz.slice(0,Math.round(fuzz.length*density)).map((p,i)=><g key={i} opacity={Math.min(1,0.4+d(i)*0.5)}>
      <path d={"M"+(p.x+Math.sin(time*1.1+p.phase)*13)+" "+(p.y+Math.sin(time*.66+p.phase)*8)+" q-11 -14 0 -20 q 13 8 0 20"} fill="none" stroke={i%3===0?"#9fdaff":"#49a6ed"} strokeWidth={Math.max(2,p.r*.65)} strokeLinecap="round"/>
    </g>)}
  </g>;
};
const Machine:React.FC<{f:number;step:number}>=({f,step})=>{
  const fan=step>=1;
  const dust=step>=2;
  const cyclone=step>=3;
  const fine=step>=4;
  const brush=step>=5;
  const guard=step>=6;
  const big=step>=7;
  return <g filter="url(#softshadow)" transform={"translate("+(big?-50:0)+" "+(big?-75:0)+") scale("+(big?1.1:1)+")"}>
    <ellipse cx="550" cy="1533" rx="395" ry="44" fill="#081824" opacity=".37"/>
    {fan&&<>
      <path d="M170 1493 L130 1470 L130 1382 Q145 1346 183 1346 L328 1346" fill="none" stroke="#263e53" strokeWidth="50" strokeLinecap="round"/>
      <path d="M170 1493 L130 1470 L130 1382 Q145 1346 183 1346 L328 1346" fill="none" stroke="#00cbd5" strokeWidth="7" strokeDasharray="15 23" strokeDashoffset={-f*3}/>
      <rect x="130" y="1494" width={big?200:148} height="56" rx="24" fill="#243f54" stroke="#00d6dc" strokeWidth="8"/>
      <rect x="278" y="1285" width="552" height="224" rx="54" fill="url(#body)" stroke="#deab51" strokeWidth="11"/>
      <path d="M300 1323 Q540 1246 811 1326" stroke="#fff2b3" opacity=".45" strokeWidth="12" fill="none"/>
      <circle cx="750" cy="1397" r="78" fill="#1e2c47" stroke="#eac16b" strokeWidth="12"/>
      <g transform={"rotate("+(f*15%360)+" 750 1397)"}>{Array.from({length:7},(_,i)=><path key={i} d="M750 1397 Q700 1350 745 1326 Q809 1319 785 1380Z" fill="#f2ad4f" stroke="#7a503d" strokeWidth="4" transform={"rotate("+(i*360/7)+" 750 1397)"}/>)}</g>
      <circle cx="750" cy="1397" r="15" fill="#ffe39e"/>
      <rect x="804" y="1368" width="84" height="62" rx="14" fill="#345467" stroke="#3ef4bb" strokeWidth="7"/>
      {Array.from({length:4},(_,i)=><path key={i} d={"M"+(848+i*12)+" 1378 l18 11 -18 11"} stroke="#bdfce9" strokeWidth="4" fill="none" opacity=".8"/>)}
      <circle cx="400" cy="1515" r="41" fill="#2d3441" stroke="#b4bdba" strokeWidth="12"/>
      <circle cx="735" cy="1515" r="41" fill="#2d3441" stroke="#b4bdba" strokeWidth="12"/>
      <circle cx="400" cy="1515" r="14" fill="#8ca4aa"/>
      <circle cx="735" cy="1515" r="14" fill="#8ca4aa"/>
    </>}
    {dust&&<>
      <rect x="338" y="1266" width="238" height="275" rx="37" fill="url(#glass)" stroke="#e6f6fb" strokeWidth="12" opacity=".96"/>
      <path d="M358 1479 Q455 1441 559 1479 L559 1520 L356 1520Z" fill="#56bdf4" opacity=".78"/>
      {Array.from({length:25},(_,i)=><circle key={i} cx={365+d(i*17)*182} cy={1490-d(i*13)*50} r={2+d(i)*8} fill="#7fe0fc" opacity=".8"/>)}
    </>}
    {cyclone&&<>
      <path d="M363 1314 C550 1288 568 1370 402 1380 C312 1385 360 1446 525 1416 C570 1400 496 1452 439 1467" fill="none" stroke="#ff8c51" strokeWidth="12" strokeDasharray="20 12" strokeDashoffset={-f*4} opacity=".95"/>
      <path d="M459 1381 L459 1506" stroke="#4cd8e0" strokeWidth="4" strokeDasharray="8 12"/>
    </>}
    {fine&&<g>
      <rect x="583" y="1319" width="73" height="146" rx="11" fill="#372e64" stroke="#ed7ef5" strokeWidth="8"/>
      {Array.from({length:9},(_,i)=><path key={i} d={"M587 "+(1331+i*15)+" l62 0"} stroke="#f5b6f4" strokeWidth="7"/>)}
    </g>}
    {brush&&<g>
      <rect x="101" y="1483" width="181" height="70" rx="23" fill="#1d3d55" stroke="#74d4db" strokeWidth="8"/>
      <g transform={"rotate("+(f*13%360)+" 184 1520)"}>{Array.from({length:12},(_,i)=><path key={i} d="M184 1485 L184 1555" stroke={i%2?"#fb9c54":"#8eedf4"} strokeWidth="6" transform={"rotate("+(i*15)+" 184 1520)"}/>)}</g>
    </g>}
    {guard&&<g>
      <rect x="671" y="1310" width="48" height="52" rx="9" fill="#f4dddd" stroke="#f8565f" strokeWidth="6"/>
      <path d="M696 1318 L684 1341 L703 1341 L692 1355" fill="none" stroke="#ed4352" strokeWidth="5"/>
    </g>}
    {fan&&<g fill="none" strokeLinecap="round">
      <path d="M225 1438 Q280 1416 326 1387" stroke="#12f2e3" strokeWidth="10" strokeDasharray="21 15" strokeDashoffset={-f*2}/>
      <path d="M614 1400 Q675 1400 705 1400" stroke="#12f2e3" strokeWidth="8" strokeDasharray="14 18" strokeDashoffset={-f*2}/>
    </g>}
  </g>;
};
const Title:React.FC<{f:number;step:number}>=({f,step})=>{
  const labels=[
    ["THE BLUE FUR PROBLEM","SHE IS EVERYWHERE","#6bc2ff"],
    ["MOTOR + IMPELLER","LOW PRESSURE = AIR MOVES IN","#ffce73"],
    ["DUST COLLECTOR","THE AIR MUST ESCAPE","#8cf4ef"],
    ["CYCLONE CHAMBER","SPIN • SEPARATE • COLLECT","#ffad71"],
    ["FINE FILTER","TRAP THE SMALL PARTICLES","#efa0ff"],
    ["BRUSH ROLL","LOOSEN THE CARPET FIBERS","#7eeaf1"],
    ["THERMAL CUTOUT","BLOCKED FLOW → HEAT","#ff6f7d"],
    ["MISSION ACCOMPLISHED","EVERYTHING IS CLEAN","#b0fbb6"]
  ];
  const entry=labels[Math.min(labels.length-1,step)];
  const op=0.85+0.15*Math.sin(f*.11);
  return <g opacity={op}>
    <rect x="46" y="85" width="988" height="175" rx="30" fill="#111b2d" opacity=".88" stroke={entry[2]} strokeWidth="4"/>
    <text x="84" y="143" fill="#fff9eb" fontSize="29" fontWeight="800" letterSpacing="4" fontFamily="Arial">BUILD LOG / EPISODE 03</text>
    <text x="84" y="204" fill={entry[2]} fontSize="53" fontWeight="900" fontFamily="Arial" letterSpacing=".8">{entry[0]}</text>
    <text x="84" y="244" fill="#f3f5f5" fontSize="26" fontWeight="700" letterSpacing="2" fontFamily="Arial">{entry[1]}</text>
  </g>;
};
const Insert:React.FC<{f:number;step:number}>=({f,step})=>{
  const mode=step===1?"PRESSURE DIFFERENCE":step===3?"CYCLONIC SEPARATION":step===4?"FINE FILTRATION":step===5?"CARPET AGITATION":step===6?"OVERHEAT PROTECTION":"";
  if(!mode)return null;
  return <g>
    <rect x="75" y="310" width="930" height="292" rx="24" fill="#0e2233" opacity=".91" stroke="#88d7ed" strokeWidth="4"/>
    <text x="120" y="375" fill="#ffffff" fontSize="33" fontWeight="900" fontFamily="Arial" letterSpacing="2">{mode}</text>
    {step===1&&<>
      <text x="150" y="485" fill="#f4cd6e" fontSize="39" fontWeight="900">ROOM AIR</text><path d="M400 461 H690" stroke="#2cdeed" strokeWidth="19" strokeLinecap="round" strokeDasharray="24 15" strokeDashoffset={-f*4}/>
      <path d="M675 430 L721 461 L675 494" fill="none" stroke="#2cdeed" strokeWidth="16"/>
      <text x="745" y="485" fill="#a4edff" fontSize="39" fontWeight="900">LOW P</text>
    </>}
    {step===3&&<>
      <circle cx="538" cy="483" r="89" fill="none" stroke="#f7ae60" strokeWidth="16" strokeDasharray="36 15" strokeDashoffset={-f*5}/>
      <circle cx="538" cy="483" r="32" fill="none" stroke="#36ddde" strokeWidth="11"/>
      <text x="135" y="494" fill="#80e3ff" fontSize="34">DIRTY AIR</text><text x="729" y="494" fill="#f5d18e" fontSize="34">BIG DUST ↓</text>
    </>}
    {step===4&&<>
      <path d="M270 425 H770" stroke="#f1adf6" strokeWidth="30" strokeDasharray="12 18"/>
      {Array.from({length:9},(_,i)=><circle key={i} cx={260+d(i)*300} cy={500+d(i*3)*55} r="8" fill="#82deff"/>)}
      <text x="155" y="578" fill="#f4e8fb" fontSize="33">FINE DUST STAYS INSIDE</text>
    </>}
    {step===5&&<>
      <rect x="200" y="518" width="680" height="43" fill="#9fa59c"/>
      <g transform={"rotate("+(f*7%360)+" 540 466)"}>{Array.from({length:10},(_,i)=><path key={i} d="M540 410 V522" stroke="#75e5e6" strokeWidth="10" transform={"rotate("+(i*18)+" 540 466)"}/>)}</g>
      <text x="130" y="403" fill="#d2fbf8" fontSize="32">SPINNING BRUSH LIFTS FUR</text>
    </>}
    {step===6&&<>
      <path d="M160 515 L260 430 L360 515" stroke="#f87081" strokeWidth="15" fill="none"/>
      <text x="410" y="470" fill="#ff7785" fontSize="49" fontWeight="900">TOO HOT!</text>
      <text x="410" y="530" fill="#f9eded" fontSize="35">CUT POWER</text>
    </>}
  </g>;
};
const Captain:React.FC<{f:number}>=({f})=>{
  const t=f/FPS;
  let idx=0;for(let i=0;i<words.length;i++){if(words[i].start<=t)idx=i;else break;}
  const w=words[idx]?.word||"Your";
  const font=Math.min(116,Math.max(60,1100/(w.length*.64)));
  return <g>
    <rect x="70" y="1642" width="940" height="216" rx="34" fill="#0a1725" opacity=".82" stroke="#ffffff" strokeWidth="2" strokeOpacity=".45"/>
    <text x="540" y="1786" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize={font} letterSpacing="-3" fill="#fff" stroke="#03070c" strokeWidth="15" paintOrder="stroke" strokeLinejoin="round">{w.toUpperCase()}</text>
  </g>;
};
const EndEyes:React.FC<{f:number}>=({f})=>{
  if(f<c.eyes)return null;
  return <g>
    <rect x="240" y="910" width="604" height="570" rx="110" fill="#163f68" stroke="#80d4fc" strokeWidth="20" opacity=".96"/>
    <Plush x={546} y={985} s={1.45} t={f/FPS} inside/>
    <rect x="249" y="914" width="590" height="566" rx="110" fill="url(#glass)" stroke="#beeafc" strokeWidth="14" opacity=".66"/>
  </g>;
};
export const VacuumPreview:React.FC=()=>{
  const f=useCurrentFrame();
  const step=f<c.fan?0:f<c.bin?1:f<c.cyclone?2:f<c.fine?3:f<c.brush?4:f<c.blocked?5:f<c.done?6:7;
  const cleaned=f>=c.done;
  const gone=f>=c.gone;
  const opening=f>DURATION-18;
  const phase=opening?0:f;
  const sh=opening?0:step;
  const pan=Math.sin(phase*.015)*5;
  return <AbsoluteFill style={{background:"#162335",overflow:"hidden"}}>
    <svg viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" width="1080" height="1920" style={{height:"100%",width:"100%"}}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f1c9a0"/><stop offset=".6" stopColor="#acbbcb"/><stop offset="1" stopColor="#263a62"/></linearGradient>
        <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e7d4b7"/><stop offset=".5" stopColor="#c6b4a0"/><stop offset="1" stopColor="#8c8c8b"/></linearGradient>
        <linearGradient id="window" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8dbae4"/><stop offset=".7" stopColor="#f5b880"/><stop offset="1" stopColor="#798ca0"/></linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2=".5" y2="1"><stop stopColor="#ad8668"/><stop offset="1" stopColor="#493a31"/></linearGradient>
        <linearGradient id="sofa" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a1ad9c"/><stop offset=".7" stopColor="#728775"/><stop offset="1" stopColor="#566858"/></linearGradient>
        <linearGradient id="lamp" x1="0" y1="0" x2=".3" y2="1"><stop stopColor="#fff9e0"/><stop offset="1" stopColor="#c9a36c"/></linearGradient>
        <linearGradient id="body"><stop stopColor="#c17f42"/><stop offset=".3" stopColor="#f4c879"/><stop offset=".65" stopColor="#d29b5d"/><stop offset="1" stopColor="#a36c42"/></linearGradient>
        <linearGradient id="glass"><stop stopColor="#a3d7ef" stopOpacity=".28"/><stop offset=".5" stopColor="#e7faff" stopOpacity=".38"/><stop offset="1" stopColor="#5ab7ed" stopOpacity=".34"/></linearGradient>
        <radialGradient id="fur" cx=".28" cy=".22" r=".88"><stop stopColor="#aae8ff"/><stop offset=".48" stopColor="#5eaff3"/><stop offset="1" stopColor="#295d9b"/></radialGradient>
        <radialGradient id="belly"><stop stopColor="#eefbff"/><stop offset="1" stopColor="#98c8f8"/></radialGradient>
        <filter id="softshadow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="4" dy="15" stdDeviation="17" floodColor="#152536" floodOpacity=".38"/></filter>
        <radialGradient id="vignette"><stop offset=".55" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#05101e" stopOpacity=".45"/></radialGradient>
      </defs>
      <g transform={"translate("+pan+" 0)"}><Apartment f={phase} cleaned={opening?false:cleaned} gone={opening?false:gone}/></g>
      {phase>=c.fan&&phase<c.eyes&&<Machine f={phase} step={sh}/>}
      {phase>=c.fan&&phase<c.done&&<Insert f={phase} step={sh}/>}
      {!opening&&<EndEyes f={phase}/>}
      <Title f={phase} step={sh}/>
      <rect width="1080" height="1920" fill="url(#vignette)" pointerEvents="none"/>
      <Captain f={phase}/>
      <text x="540" y="1891" textAnchor="middle" fontFamily="Arial" fontSize="22" fill="#e6f1f5" opacity=".75">DRAFT PREVIEW • VACUUM CLEANER</text>
    </svg>
    <Audio src={staticFile("vacuum-cleaner/vo.mp3")}/>
    <MusicBed name="wonder" words={words} volume={0.13}/>
    <Sfx at={c.broom} name="whoosh" volume={0.35}/>
    <Sfx at={c.fan} name="swell" volume={0.27}/>
    <Sfx at={c.blow} name="thud" volume={0.42}/>
    <Sfx at={c.bin} name="pop" volume={0.55}/>
    <Sfx at={c.cyclone} name="whoosh_fast" volume={0.42}/>
    <Sfx at={c.fine} name="pop" volume={0.48}/>
    <Sfx at={c.brush} name="riser" volume={0.27}/>
    <Sfx at={c.blocked} name="impact" volume={0.4}/>
    <Sfx at={c.thermal} name="beep" volume={0.6}/>
    <Sfx at={c.done} name="chime" volume={0.4}/>
    <Sfx at={c.gone} name="glitch" volume={0.45}/>
    <Sfx at={c.wrong} name="thud" volume={0.3}/>
  </AbsoluteFill>;
};
