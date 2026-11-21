import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, TubePath, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { Earth } from "../../lib/three/Earth";
import { Pigeon } from "../../lib/three/Pigeon";
import { Shark } from "../../lib/three/Shark";
import { CableShip, CS, CS_BOW } from "../../lib/three/CableShip";
import { easeOut, keys, keys3, ramp } from "../../lib/timing";
import { fonts } from "../../lib/theme";
import { Big, Tag } from "../rocket/sets";
import { AirCanvas } from "../airplane/world";
import { atOf, Bedroom, EARTH_LAT, EARTH_LON, greatCircle, LONDON, onEarth, SYDNEY } from "../airplane/sets";
import { c } from "./cues";
import { anatomyPoints, CableAnatomy, FibreCore, FibreLayers } from "./fibre";
import { chatTex, Garden, GardenHose, LondonRoof, PhoneMesh, TripodPhone } from "./props";
import { Amplifier, AMPS, Anchor, Cable, groundY, HullAbove, LandingStation, PowerDots, Pulses, SeaCanvas, TrawlNet, YARN_X0 } from "./sea";
import { Cable1858, ChatPhone, CounterPill, HoseCompare, PacketLoss, PacketsArrive, PhotoPackets, PigeonRace, RfcCard, SpeedRace, Stamp, UsedCounter } from "./inserts";

export type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);

const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420", loose: "male" };
const GRANDMA: Outfit = { top: "#b07ab8", pants: "#6a5a7a", shoes: "#e8e0d8", sleeves: 0.62, loose: "female" };
const MASK_S = 0.5;
const WORN: V3 = [0, -0.2, 0.03];

// ───────────────────────── people ─────────────────────────
/** the friend in the fox head, posing for the self-timer photo (Dance_Loop, frozen once the photo is taken) */
export const FRIEND_POSE = { p: [-0.6, 0, 0.6] as V3, ry: 1.09, at: 2.6 };
export const PosingFriend: React.FC<{ t: number }> = ({ t }) => (
  <Model file="man_b.glb" anims={LIB1} clip="Dance_Loop" t={t} p={FRIEND_POSE.p} ry={FRIEND_POSE.ry} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} attach={{ bone: "Head", node: <FursuitHead s={MASK_S} t={t} p={WORN} /> }} />
);
export const TRIPOD: V3 = [1.3, 0, 1.6];

/** grandma: with her phone, or wearing the puh for her own selfie */
export const GRANDMA_AT: V3 = [0.8, 0, 2.2];
const Grandma: React.FC<{ t: number; mode: "phone" | "laugh" | "selfie"; screen?: THREE.Texture | null }> = ({ t, mode, screen }) => {
  const phone = <PhoneMesh p={[0.02, 0.09, 0.05]} rot={[1.35, 0.0, 0.2]} screen={screen} />;
  if (mode === "selfie")
    return (
      <Model
        file="woman_c.glb"
        anims={LIB2}
        clip="Idle_Lantern_Loop"
        t={t}
        p={GRANDMA_AT}
        ry={0.35}
        outfit={GRANDMA}
        tint={{ Hair: "#d9d9d9" }}
        attach={[
          { bone: "Head", node: <FursuitHead s={MASK_S * 0.95} t={t} p={WORN} /> },
          { bone: "hand_r", node: <PhoneMesh p={[0.02, 0.09, 0.05]} rot={[0.2, Math.PI, 0.2]} /> },
        ]}
      />
    );
  return <Model file="woman_c.glb" anims={LIB2} clip={mode === "laugh" ? "Yes" : "Idle_Lantern_Loop"} t={t} p={GRANDMA_AT} ry={0.35} outfit={GRANDMA} tint={{ Hair: "#d9d9d9" }} attach={{ bone: "hand_r", node: phone }} />;
};

// ───────────────────────── HOOK: grandma wants a photo ─────────────────────────
const HOOK_MSGS = [{ at: 6, from: "her" as const, text: "send pic of u using it 🙂" }];
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [0, [2.5, 1.65, 4.6]],
      [c.using, [2.1, 1.6, 4.0]],
    ]),
    look: [0.85, 1.35, 2.2],
    fov: 40,
  };
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} dusk={0.15} sun={[220, 90, 60]} fog={0.6}>
        <Garden>
          <Grandma t={t} mode="phone" screen={chatTex([{ from: "her", text: "send pic of u using it 🙂" }])} />
        </Garden>
      </AirCanvas>
      <ChatPhone f={f} at={0} until={c.using} msgs={HOOK_MSGS} />
      <Big x={540} y={380} text="SEND PIC." o={fadeIn(f, 2)} size={110} color="#ffd23f" />
    </AbsoluteFill>
  );
};

// ───────────────────────── BEDROOM: the photo shoot, then "today" ─────────────────────────
export const SetShoot: React.FC<SetProps> = ({ f }) => {
  const flashAt = c.lives - 16;
  const tPose = f < flashAt ? f / 30 : flashAt / 30; // freeze the pose for the photo
  const t = f / 30;
  const flash = f >= flashAt ? Math.max(0, 1 - (f - flashAt) / 5) : 0;
  const cam: Cam = {
    pos: keys3(f, [
      [c.using, [2.3, 1.45, 3.1]],
      [flashAt, [1.9, 1.4, 2.6]],
    ]),
    look: [-0.3, 1.15, 0.6],
    fov: 42,
  };
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={1} indoor shadow={6} ao={0.6}>
        <Bedroom t={t} friend={false} />
        <PosingFriend t={Math.max(FRIEND_POSE.at - 1.2, tPose - c.using / 30 + FRIEND_POSE.at - 1.2)} />
        <TripodPhone p={TRIPOD} ry={-2.05} flash={flash} />
        <pointLight position={[0.8, 2.2, 1.5]} intensity={1.6} distance={6} color="#ffe2c0" />
      </AirCanvas>
      {flash > 0 ? <AbsoluteFill style={{ background: "#ffffff", opacity: flash * 0.55 }} /> : null}
      {f >= flashAt + 4 ? <Big x={540} y={1500} text="📸 3 MB" o={fadeIn(f, flashAt + 4)} size={90} color="#ffffff" /> : null}
    </AbsoluteFill>
  );
};

export const SetToday: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const k = ramp(f, c.today, c.today + 10, easeOut);
  const cam: Cam = { pos: [1.0 - 0.25 * k, 1.62, 3.0 - 0.5 * k], look: [-0.6, 1.5, 0.6], fov: 38 };
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={1} indoor shadow={6} ao={0.6}>
        <Bedroom t={t} friend={false} />
        <Model file="man_b.glb" anims={LIB1} clip="Idle_Loop" t={t} p={FRIEND_POSE.p} ry={0.75} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} attach={{ bone: "Head", node: <FursuitHead s={MASK_S} t={t} p={WORN} /> }} />
        <pointLight position={[0.8, 2.2, 1.5]} intensity={1.6} distance={6} color="#ffe2c0" />
      </AirCanvas>
      <ChatPhone f={f} at={c.today - 4} until={c.pigeon} msgs={[{ at: 0, from: "her", text: "send pic of u using it 🙂" }, { at: c.today + 2, from: "her", text: "today pls 🙏" }]} left={520} top={1150} tilt={-5} />
      <Big x={540} y={400} text="TODAY." o={fadeIn(f, c.today + 6)} size={120} color="#ff6b5e" />
    </AbsoluteFill>
  );
};

// ───────────────────────── GLOBE: 17,000 km (and later the pigeon over the ocean) ─────────────────────────
const RouteGlobe: React.FC<{ f: number; from: number; until: number; spin0?: number; pigeon?: boolean }> = ({ f, from, until, spin0 = 0, pigeon = false }) => {
  const t = f / 30;
  const spin = spin0 + ramp(f, from, until, (x) => x) * 0.25;
  const route = useMemo(() => greatCircle(LONDON, SYDNEY), []);
  const pts = route.map(([la, lo], i) => onEarth(la, lo, 1 + 0.02 + 0.06 * Math.sin((Math.PI * i) / (route.length - 1)), spin));
  const mid = pts[Math.floor(pts.length * 0.45)].clone().normalize(); // aim at the middle of the route
  const camPos = mid.clone().multiplyScalar(keys(f, [
    [from, 4.8],
    [until, 5.1],
  ]));
  // north up: roll the camera so the pole's direction (seen from the camera) points to the top of the frame
  const pole = onEarth(90, 0, 1, spin);
  const np = pole.clone().sub(mid.clone().multiplyScalar(pole.dot(mid)));
  const cam: Cam = { pos: [camPos.x, camPos.y, camPos.z], look: [0, 0, 0], fov: 40, roll: Math.atan2(np.x, np.y) };
  const draw = pigeon ? 1 : ramp(f, from + 4, from + 34, easeOut);
  const at = atOf(cam);
  const pL = onEarth(...LONDON, 1.02, spin);
  const pS = onEarth(...SYDNEY, 1.02, spin);
  const sL = at([pL.x, pL.y, pL.z]);
  const sS = at([pS.x, pS.y, pS.z]);
  // the pigeon flaps along the route and drops into the Indian Ocean
  const fly = ramp(f, from + 4, from + 40, (x) => x) * 0.62;
  const drop = ramp(f, from + 40, from + 52, (x) => x * x);
  const pp = pts[Math.round(fly * (pts.length - 1))];
  const sp = at([pp.x, pp.y, pp.z]);
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={1} ao={0} env={0.05}>
        <Earth r={1} lat={EARTH_LAT} lon={EARTH_LON} spin={spin} clouds={t * 0.01} sun={[mid.x + 0.4, mid.y + 0.6, mid.z]} cover={0.55} />
        <TubePath points={pts} progress={draw} radius={0.009} color={pigeon ? "#ffffff" : "#ffd23f"} opacity={pigeon ? 0.5 : 1} />
      </AirCanvas>
      {sL ? <Tag x={sL.x} y={sL.y} text={pigeon ? "LONDON" : "YOU · 📸 3 MB"} side="right" o={fadeIn(f, from + 4)} size={32} /> : null}
      {sS ? <Tag x={sS.x} y={sS.y} text="GRANDMA" color="#ff6aa8" side="left" o={fadeIn(f, from + 14)} size={32} /> : null}
      {pigeon && sp ? (
        <div style={{ position: "absolute", left: sp.x - 70, top: sp.y - 90 + drop * 160, fontSize: 130, opacity: 1 - ramp(f, from + 50, from + 56, (x) => x), transform: `rotate(${drop * 120}deg)` }}>🐦</div>
      ) : null}
      {pigeon && f >= from + 50 && sp ? <div style={{ position: "absolute", left: sp.x - 50, top: sp.y + 90, fontSize: 90, opacity: fadeIn(f, from + 50) }}>💦</div> : null}
      {!pigeon ? <CounterPill o={fadeIn(f, from + 14)} value={17000 * ramp(f, from + 14, from + 44, easeOut)} label="KM · 10,600 MI" /> : null}
    </AbsoluteFill>
  );
};
/** a camera looking at (lat, lon) as it is at `spin0` from `dist`, north up; the Earth may keep spinning under it */
const globeCam = (lat: number, lon: number, dist: number, spin0: number, fov = 40): Cam => {
  const v = onEarth(lat, lon, 1, spin0).normalize();
  const pole = onEarth(90, 0, 1, spin0);
  const np = pole.clone().sub(v.clone().multiplyScalar(pole.dot(v)));
  const p = v.clone().multiplyScalar(dist);
  return { pos: [p.x, p.y, p.z], look: [0, 0, 0], fov, roll: Math.atan2(np.x, np.y) };
};
export const SetGlobe: React.FC<SetProps> = ({ f }) => <RouteGlobe f={f} from={c.lives} until={c.today} />;
export const SetPigeonGlobe: React.FC<SetProps> = ({ f }) => <RouteGlobe f={f} from={c.ocean} until={c.cable} spin0={0.1} pigeon />;

// ───────────────────────── ROOF: the pigeon (RFC 1149, Bergen 2001, Winston 2009) ─────────────────────────
const PERCH: V3 = [-1.7, 1.12, -2.62];
export const SetRoof: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const off = c.pigeon + 22;
  const k = ramp(f, off, off + 60, (x) => x);
  const flying = f >= off;
  const pig: V3 = [PERCH[0] + 7 * k * k, PERCH[1] + 0.5 * Math.min(1, (f - off) / 8) * (flying ? 1 : 0) + 9 * k * k, PERCH[2] - 16 * k * k];
  const cam: Cam = f < c.standard
    ? {
        pos: keys3(f, [
          [c.pigeon, [-1.15, 1.3, -1.55]],
          [off, [-1.3, 1.35, -1.75]],
          [off + 30, [-0.4, 1.6, 0.2]],
        ]),
        look: keys3(f, [
          [c.pigeon, [-1.7, 1.2, -2.6]],
          [off, [-1.65, 1.35, -2.7]],
          [off + 30, [1.5, 5, -12]],
        ]),
        fov: keys(f, [
          [c.pigeon, 34],
          [off + 30, 46],
        ]),
      }
    : { pos: [1.6, 1.6, 3.6], look: [-0.8, 1.6, -4], fov: 46 };
  const leg = f < off ? atOf(cam)([PERCH[0] + 0.03, PERCH[1] + 0.05, PERCH[2] + 0.01]) : null;
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} ground="none" sun={[-60, 70, 80]} fog={1} env={0.28}>
        <LondonRoof t={t} />
        <Pigeon p={pig} ry={flying ? -0.4 : 0} rx={flying ? -0.5 : 0} t={t} flap={flying ? 1 : 0} card peck={f < off ? Math.max(0, Math.sin(t * 4)) * 0.3 : 0} />
        {[-5.2, -4.5, 0.6, 1.4, 2.3].map((x, i) => (
          <Pigeon key={i} p={[x, 0.9, -5]} ry={i % 2 ? 0.6 : -0.5} t={t + i * 0.7} seed={i} peck={Math.max(0, Math.sin(t * 2 + i * 1.7)) * 0.6} />
        ))}
      </AirCanvas>
      {f >= c.joke && f < c.standard ? <Big x={540} y={420} text={"NOT A\nJOKE."} o={fadeIn(f, c.joke)} size={110} color="#ffd23f" /> : null}
      {leg && f >= c.pigeon + 4 && f < off + 2 ? <Tag x={leg.x} y={leg.y} text="MEMORY CARD" side="right" o={fadeIn(f, c.pigeon + 4) * (1 - fadeIn(f, off - 4, 6))} size={34} color="#2f6fd6" /> : null}
      <RfcCard f={f} at={c.standard} until={c.y2001} />
      <PacketLoss f={f} at={c.y2001} lost={c.lost} until={c.y2009} />
      <PigeonRace f={f} at={c.y2009} beat={c.beat} until={c.ocean} />
    </AbsoluteFill>
  );
};

// ───────────────────────── LAY: a cable ship lays the cable from the beach (1858 card on top) ─────────────────────────
export const SetLay: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const k = ramp(f, c.cable, c.light, (x) => x);
  const shipX = 95 + 80 * k;
  const stern: V3 = [shipX - CS.L / 2 + 0.5, CS.deck + 9, 0];
  const td = stern[0] - 55; // where the cable touches the floor
  const catenary = useMemo(() => [] as THREE.Vector3[], []);
  catenary.length = 0;
  for (let i = 0; i <= 30; i++) {
    const s = i / 30;
    const x = stern[0] + (td - stern[0]) * s;
    const y = stern[1] + (groundY(td) + 0.32 - stern[1]) * Math.pow(s, 0.65);
    catenary.push(new THREE.Vector3(x, y, 0));
  }
  const cam: Cam = {
    pos: keys3(f, [
      [c.cable, [-14, 2, 80]],
      [c.cable + 50, [shipX - 50, -6, 190]],
      [c.light, [shipX - 50, -8, 200]],
    ]),
    look: keys3(f, [
      [c.cable, [-14, -1, 0]],
      [c.cable + 50, [shipX - 50, -8, 0]],
      [c.light, [shipX - 50, -10, 0]],
    ]),
    fov: 40,
  };
  return (
    <AbsoluteFill>
      <SeaCanvas cam={cam} t={t}>
        <LandingStation />
        <Cable x0={-36} x1={td} />
        <TubePath points={catenary} radius={0.32} color="#ffd23f" glow={false} />
        <CableShip p={[shipX, 0, 0]} rock={0.01 * Math.sin(t * 0.8)} />
      </SeaCanvas>
      <Cable1858 f={f} at={c.y1858} queen={c.queen} hours={c.hours16} weeks={c.weeks} until={c.light} />
      {f >= c.weeks + 18 ? <Stamp f={f} at={c.weeks + 18} text="DEAD." top={980} size={110} /> : null}
      {f >= c.voltage ? <Big x={540} y={420} text={"TOO MUCH\nVOLTAGE?"} o={fadeIn(f, c.voltage)} size={90} color="#ffd23f" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── FIBRE: what is inside the cable, one fibre vs a hair, light bouncing in the core ─────────────────────────
const ANAT_LABELS: { k: "sheath" | "copper" | "wires" | "tube" | "fibres"; text: string; color: string; side: "left" | "right"; d: number }[] = [
  { k: "sheath", text: "PLASTIC SHEATH", color: "#c9d2de", side: "left", d: 6 },
  { k: "copper", text: "COPPER · POWER", color: "#ff9a4a", side: "right", d: 16 },
  { k: "wires", text: "STEEL WIRES · STRENGTH", color: "#c9d2de", side: "left", d: 26 },
  { k: "tube", text: "STEEL TUBE + GEL", color: "#e8d9a0", side: "right", d: 36 },
  { k: "fibres", text: "8 GLASS FIBRES", color: "#7ff6ff", side: "left", d: 46 },
];
/** the cable stands up diagonally in the 9:16 frame: axis from lower left to upper right, tilted towards the camera */
const ANAT_ROT = new THREE.Euler(0.25, -0.55, 1.12);
const anatAt = (p: V3): V3 => new THREE.Vector3(...p).applyEuler(ANAT_ROT).toArray() as V3;
export const SetFibre: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const stage = f < c.hair ? "cable" : f < c.runs ? "fibre" : "core";
  const peel = ramp(f, c.light + 2, c.light + 52, (x) => x);
  const cam: Cam =
    stage === "cable"
      ? {
          pos: keys3(f, [
            [c.light, [0.6, -1.4, 21]],
            [c.glass, [0.9, 0.2, 18]],
            [c.hair, anatAt([5.4, 0.3, 4.2])],
          ]),
          look: keys3(f, [
            [c.light, anatAt([-1.2, 0, 0])],
            [c.glass, anatAt([0.6, 0, 0])],
            [c.hair, anatAt([5.6, 0, 0])],
          ]),
          fov: 34,
        }
      : stage === "fibre"
        ? { pos: keys3(f, [[c.hair, [-4, 2.4, 15]], [c.runs, [-1, 1.6, 12]]]), look: [0, -1, 0], fov: 34 }
        : {
            pos: keys3(f, [
              [c.runs, [-10, 1.9, 5.2]],
              [c.theory, [-4, 1.6, 4.4]],
              [c.fades, [4, 1.4, 4.0]],
            ]),
            look: keys3(f, [
              [c.runs, [-2, 0, 0]],
              [c.fades, [10, 0, 0]],
            ]),
            fov: 38,
          };
  const at = atOf(cam);
  const pts = anatomyPoints(peel);
  const period = 26;
  const pulse = ((f - c.hair) % period) / period;
  // a bounce point near the middle of the frame for the label
  const bounce = at([Math.round(cam.look[0] / 1.6) * 1.6 + 0.8, 0.92, 0.25]);
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={1} ao={0} env={stage === "cable" ? 0.35 : 0.15}>
        {stage === "cable" ? (
          <>
            <group rotation={ANAT_ROT}>
              <CableAnatomy t={t} peel={peel} glow={fadeIn(f, c.light + 40, 10)} />
            </group>
            <pointLight position={[-2, 4, 5]} intensity={40} distance={30} color="#fff2e0" />
            <pointLight position={[6, -2, 4]} intensity={20} distance={20} color="#7fd8ff" />
          </>
        ) : stage === "fibre" ? (
          <>
            <FibreLayers t={t} hair={fadeIn(f, c.hair + 4, 10)} pulse={pulse} />
            <pointLight position={[-3, 5, 6]} intensity={40} distance={40} color="#fff2e0" />
          </>
        ) : (
          <>
            <FibreCore t={t} o={fadeIn(f, c.runs, 6)} />
            <pointLight position={[0, 4, 4]} intensity={10} distance={30} color="#7fd8ff" />
          </>
        )}
      </AirCanvas>
      {stage === "cable"
        ? ANAT_LABELS.map((q) => {
            const sp = at(anatAt(pts[q.k]));
            return sp && f >= c.light + q.d ? <Tag key={q.k} x={sp.x} y={sp.y} text={q.text} side={q.side} o={fadeIn(f, c.light + q.d)} size={30} color={q.color} /> : null;
          })
        : null}
      {stage === "cable" && f >= c.light + 30 && f < c.glass + 6 ? <Big x={540} y={1640} text={"≈ 17 MM · 0.7 IN"} o={fadeIn(f, c.light + 30) * (1 - fadeIn(f, c.glass, 6))} size={70} color="#ffd23f" /> : null}
      {stage === "fibre" ? (
        <>
          <Tag x={600} y={700} text="GLASS FIBRE · 0.125 MM" side="right" o={fadeIn(f, c.hair)} size={32} color="#7ff6ff" />
          <Tag x={480} y={1230} text="A HAIR · ≈ 0.08 MM" side="left" o={fadeIn(f, c.hair + 8)} size={32} color="#c98a5a" />
        </>
      ) : null}
      {stage === "core" && bounce && f < c.theory ? <Tag x={bounce.x} y={bounce.y} text="BOUNCES OFF THE GLASS" side="right" o={fadeIn(f, c.runs + 20)} size={30} color="#7ff6ff" /> : null}
      {stage === "core" && f < c.theory ? <Big x={540} y={1500} text={"1 = LIGHT\n0 = DARK"} o={fadeIn(f, c.runs + 34)} size={80} color="#ffffff" /> : null}
      <CounterPill o={fadeIn(f, c.runs)} value={200000 * ramp(f, c.runs, c.runs + 24, easeOut)} label="KM/S · 124,000 MI/S" />
      <SpeedRace f={f} at={c.theory} plane={c.plane} until={c.fades} />
    </AbsoluteFill>
  );
};

// ───────────────────────── SEA FLOOR: amplifiers, 10 kV, the deep, armour, sharks, anchors ─────────────────────────
const SHARK_X = YARN_X0 + 18; // between the amplifiers at 240 and 330
const ANCHOR_X0 = 160;
const BREAK_X = 182;
export const SetFloor: React.FC<SetProps> = ({ f }) => {
  const frozen = f >= c.twist && f < c.never ? c.twist : f; // "Plot twist": freeze frame
  const t = frozen / 30;
  const ff = frozen;
  // camera along the route
  // camera along the route: level with the cable (floor in the lower third), never looking down into the cut
  const cam: Cam = {
    pos: keys3(ff, [
      [c.fades, [126, -38.5, 28]],
      [c.amp - 8, [150, -41.2, 15]],
      [c.power - 4, [150, -41.2, 15]],
      [c.power + 14, [-14, 3, 120]],
      [c.deep, [-10, 2, 125]],
      [c.deep + 25, [430, -100, 160]],
      [c.deep + 45, [530, -290, 190]],
      [c.touches, [692, -748, 30]],
      [c.hose, [701, -750.6, 13]],
      [c.coast - 1, [701, -750.6, 13]],
      [c.coast, [128, -34.5, 42]],
      [c.steel - 4, [128, -34.5, 42]],
      [c.steel + 20, [120, -35.6, 16]],
      [c.sharks - 15, [120, -35.6, 16]],
      [c.sharks - 14, [SHARK_X - 4.5, -80.6, 16]],
      [c.google + 30, [SHARK_X - 3, -81.3, 13]],
      [c.breaks, [186, -42, 40]],
      [c.ship, [186, -43, 36]],
    ]),
    look: keys3(ff, [
      [c.fades, [140, -42.5, 0]],
      [c.amp - 8, [150, -43.2, 0]],
      [c.power - 4, [150, -43.2, 0]],
      [c.power + 14, [-14, -1, 0]],
      [c.deep, [-10, -2, 0]],
      [c.deep + 25, [470, -130, 0]],
      [c.deep + 45, [600, -480, 0]],
      [c.touches, [705, -752.5, 0]],
      [c.hose, [705, -754.6, 0]],
      [c.coast - 1, [705, -754.6, 0]],
      [c.coast, [128, -39.2, 0]],
      [c.steel - 4, [128, -39.2, 0]],
      [c.steel + 20, [120, -38.2, 0]],
      [c.sharks - 15, [120, -38.2, 0]],
      [c.sharks - 14, [SHARK_X - 1.5, -83.3, 0]],
      [c.google + 30, [SHARK_X - 1.5, -83.6, 0]],
      [c.breaks, [186, -56.5, 0]],
      [c.ship, [186, -57, 0]],
    ]),
    fov: 40,
  };
  const atF = atOf(cam);
  const ampTags = { coil: atF([150.4, groundY(150) + 1.2, 0.3]), laser: atF([148.6, groundY(150) + 0.35, 0.2]) };
  // in close shots the pulses are smaller and slower, or they cross the frame in 2–3 frames and read as flashes
  const camDist = Math.max(8, cam.pos[2]);
  const pulseSize = Math.min(3, 0.09 * camDist);
  const pulseSpeed = Math.min(60, 1.6 * camDist);
  const pulseEvery = Math.min(24, Math.max(6, 0.6 * camDist));
  const lamp = ramp(ff, c.deep + 20, c.deep + 60, (x) => x) * (1 - ramp(ff, c.coast - 6, c.coast, (x) => x));
  const amp = ramp(ff, c.amp, c.amp + 10, easeOut);
  const fade = ff < c.amp ? ramp(ff, c.fades, c.fades + 20, (x) => x) : 0;
  const armour = ramp(ff, c.steel, c.steel + 20, easeOut);
  const buried = 0.72 * ramp(ff, c.steel + 30, c.steel + 54, easeOut); // the armour still peeks out of the sand
  const yarn = ramp(ff, c.google + 4, c.google + 40, (x) => x);
  // the shark comes in from the left, bites at sharks + 22, lets go
  const sk = ramp(ff, c.sharks - 10, c.sharks + 22, easeOut);
  const shark: V3 = [SHARK_X - 14 + 12.5 * sk, groundY(SHARK_X) + 2.6 - 1.9 * sk, 3.5 - 2.8 * sk];
  const bite = ff >= c.sharks + 16 && ff < c.google ? Math.min(1, (ff - c.sharks - 16) / 4) : ff >= c.google ? Math.max(0, 1 - (ff - c.google) / 6) : 0;
  // trouble on the shelf: a trawl and a dragging anchor
  const drag = ramp(ff, c.breaks, c.anchors + 10, (x) => x);
  const anchorX = ANCHOR_X0 + 26 * drag;
  const broken = ff >= c.anchors + 6;
  const showShelfTrouble = ff >= c.breaks - 6;
  const showShark = ff >= c.sharks - 12 && ff < c.breaks - 6;
  return (
    <AbsoluteFill>
      <SeaCanvas cam={cam} t={t} lamp={lamp}>
        <LandingStation />
        <Cable x0={-36} armour={armour} buried={buried} yarn={yarn} gap={broken ? [BREAK_X - 1.5, BREAK_X + 1.5] : null} />
        {AMPS.map((x) => (
          <Amplifier key={x} x={x} t={t} on={x === 150 ? amp : ff >= c.amp + 6 ? 0.6 : 0} xray={x === 150 ? ramp(ff, c.amp + 14, c.amp + 26, easeOut) * (1 - ramp(ff, c.power - 6, c.power, (k) => k)) : 0} />
        ))}
        {ff < c.power + 20 || ff >= c.coast ? <Pulses t={t} x0={-10} x1={ff >= c.coast ? 420 : 300} fade={fade} o={broken ? 0 : 1} speed={pulseSpeed} size={pulseSize} every={pulseEvery} /> : null}
        {ff >= c.power && ff < c.coast ? <PowerDots t={t} x0={-34} x1={200} o={fadeIn(ff, c.power)} /> : null}
        {ff >= c.deep ? <Pulses t={t} x0={420} x1={900} speed={pulseSpeed * 1.5} every={30} size={pulseSize * 1.3} o={fadeIn(ff, c.deep)} /> : null}
        {ff >= c.hose - 10 && ff < c.coast ? <GardenHose p={[704, groundY(704) + 0.02, 3.2]} s={2} /> : null}
        {ff >= c.coast - 6 && ff < c.breaks - 6 ? (
          <>
            <HullAbove x={112} len={70} />
            <Anchor p={[128, groundY(128), -6]} chainTop={[112 + 26, 0, -4]} rot={1.2} />
          </>
        ) : null}
        {showShark ? <Shark p={shark} ry={0} rz={-0.08 * sk} s={1.4} t={t} bite={bite} /> : null}
        {showShelfTrouble ? (
          <>
            <HullAbove x={anchorX - 30} len={64} color="#4a3a32" />
            <Anchor p={[anchorX, groundY(anchorX) + 0.4, 0.6]} chainTop={[anchorX - 30 + 22, 0, -4]} rot={1.35} />
            <TrawlNet x={238 - 30 * drag} t={t} top={[238 - 30 * drag + 70, 0, -4]} />
            <HullAbove x={238 - 30 * drag + 76} len={34} color="#2f5a7a" />
          </>
        ) : null}
        {broken ? <Glow position={[BREAK_X, groundY(BREAK_X) + 1, 0.5]} size={6 * Math.max(0, 1 - (ff - c.anchors - 6) / 20)} color="#ffb070" opacity={0.9} /> : null}
      </SeaCanvas>
      {/* amplifiers */}
      {ff >= c.fades && ff < c.amp ? <Tag x={560} y={1220} text="LIGHT FADES…" side="right" o={fadeIn(ff, c.fades + 10)} size={34} color="#7ff6ff" /> : null}
      {ff >= c.amp && ff < c.power + 10 ? <Big x={540} y={420} text={"AMPLIFIER\nEVERY 50–100 KM\n30–60 MI"} o={fadeIn(ff, c.amp)} size={72} color="#7ff6ff" /> : null}
      {ampTags.coil && ff >= c.amp + 20 && ff < c.power - 6 ? <Tag x={ampTags.coil.x} y={ampTags.coil.y} text="ERBIUM FIBRE" side="right" o={fadeIn(ff, c.amp + 20)} size={30} color="#ff6aa8" /> : null}
      {ampTags.laser && ff >= c.amp + 28 && ff < c.power - 6 ? <Tag x={ampTags.laser.x} y={ampTags.laser.y} text="PUMP LASER" side="left" o={fadeIn(ff, c.amp + 28)} size={30} color="#ff5050" /> : null}
      {ff >= c.power + 10 && ff < c.deep ? <Big x={540} y={420} text={"10,000 V"} o={fadeIn(ff, c.power + 10)} size={130} color="#ffd23f" /> : null}
      {ff >= c.deep + 4 && ff < c.touches ? <CounterPill o={fadeIn(ff, c.deep + 4)} value={8000 * ramp(ff, c.deep + 6, c.touches - 4, (x) => x * x)} label="M DEEP" /> : null}
      {ff >= c.touches && ff < c.coast - 6 ? <Big x={540} y={400} text={"8,000 M\n26,000 FT"} o={fadeIn(ff, c.touches)} size={100} color="#ffffff" /> : null}
      {ff >= c.touches && ff < c.coast - 6 ? <div style={{ position: "absolute", top: 600, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 30, letterSpacing: 4, color: "#a9c8e8", opacity: fadeIn(ff, c.touches) }}>DEPTHS NOT TO SCALE</div> : null}
      <HoseCompare f={ff} at={c.hose} until={c.coast - 4} />
      {ff >= c.steel && ff < c.sharks - 14 ? <Big x={540} y={420} text={"STEEL ARMOUR\n+ BURIED"} o={fadeIn(ff, c.steel)} size={84} color="#c9d2de" /> : null}
      {ff >= c.google && ff < c.twist ? <Big x={540} y={420} text={"KEVLAR-STYLE\nYARN · 2014"} o={fadeIn(ff, c.google)} size={80} color="#ffffff" /> : null}
      {f >= c.twist + 4 && f < c.breaks ? <Stamp f={f} at={c.twist + 4} text="MYTH." top={1260} size={120} /> : null}
      {f >= c.twist && f < c.never ? <AbsoluteFill style={{ background: "rgba(20,10,0,0.18)" }} /> : null}
      {ff >= c.breaks ? <CounterPill o={fadeIn(ff, c.breaks)} value={200 * ramp(ff, c.breaks, c.breaks + 24, easeOut)} label="BREAKS / YEAR" /> : null}
      {ff >= c.anchors ? <Big x={540} y={1460} text={"≈ 70 %\nANCHORS + NETS"} o={fadeIn(ff, c.anchors)} size={80} color="#ff8a3a" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── SHIP: the repair ship fishes the cable up at night ─────────────────────────
export const SetShip: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const shipX = BREAK_X - CS_BOW[0] - 4;
  const bow = new THREE.Vector3(shipX + CS_BOW[0], CS_BOW[1], 0);
  const lift = ramp(f, c.hook - 10, c.photo, easeOut);
  const hookP = new THREE.Vector3(BREAK_X - 3, groundY(BREAK_X) + 1.2 + lift * 40, 0);
  const rope = [bow, new THREE.Vector3((bow.x + hookP.x) / 2 + 3, (bow.y + hookP.y) / 2, 0), hookP];
  // the broken end hangs from the hook in a loop
  const end = useMemo(() => [] as THREE.Vector3[], []);
  end.length = 0;
  for (let i = 0; i <= 24; i++) {
    const s = i / 24;
    const x = BREAK_X - 30 + (hookP.x - (BREAK_X - 30)) * s;
    const y = groundY(BREAK_X - 30) + 0.32 + (hookP.y - groundY(BREAK_X - 30) - 0.32) * Math.pow(s, 2.2);
    end.push(new THREE.Vector3(x, y, 0));
  }
  const cam: Cam = {
    pos: keys3(f, [
      [c.ship, [140, -4, 175]],
      [c.photo, [146, -10, 165]],
    ]),
    look: keys3(f, [
      [c.ship, [148, -22, 0]],
      [c.photo, [150, -28, 0]],
    ]),
    fov: 40,
  };
  return (
    <AbsoluteFill>
      <SeaCanvas cam={cam} t={t} night={1}>
        <Cable x0={-36} x1={BREAK_X - 30} />
        <Cable x0={BREAK_X + 1.5} />
        <TubePath points={end} radius={0.32} color="#ffd23f" glow={false} />
        <TubePath points={rope.length ? new THREE.CatmullRomCurve3(rope).getPoints(30) : []} radius={0.12} color="#e8e2d0" glow={false} />
        {/* the grapnel */}
        <group position={hookP}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} rotation={[0, (i / 3) * Math.PI * 2, 0]} position={[0, -0.6, 0]}>
              <torusGeometry args={[0.8, 0.12, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#8a9098" metalness={0.8} roughness={0.35} />
            </mesh>
          ))}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.6, 8]} />
            <meshStandardMaterial color="#8a9098" metalness={0.8} roughness={0.35} />
          </mesh>
        </group>
        <CableShip p={[shipX, 0, 0]} rock={0.012 * Math.sin(t * 0.9)} lights={1} />
      </SeaCanvas>
      <Big x={540} y={1520} text={"CABLE REPAIR\nSHIP"} o={fadeIn(f, c.ship + 4)} size={88} color="#ffd23f" />
      {f >= c.hook ? <Tag x={560} y={1300} text="GIANT HOOK" side="right" o={fadeIn(f, c.hook)} size={36} color="#ff8a3a" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── PACKETS: the photo → 2,000 packets ─────────────────────────
export const SetPackets: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = { pos: [2.6, 1.55, 1.7], look: [0.6, 0.95, -1.4], fov: 42 };
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={1} indoor shadow={6} ao={0.6}>
        <Bedroom t={t} />
      </AirCanvas>
      <AbsoluteFill style={{ background: "rgba(4,8,18,0.55)" }} />
      <PhotoPackets f={f} at={c.photo} split={c.packets} address={c.address} until={c.herEnd} />
    </AbsoluteFill>
  );
};

/** grandma's phone: the packets snap back together into the photo */
const PHOTO_RECT: [number, number, number, number] = [462, 1438, 300, 380];
export const SetArrive: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const done = c.herEnd + 34;
  const cam: Cam = { pos: [2.4, 1.6, 5.0], look: [0.9, 1.3, 2.2], fov: 40 };
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} dusk={0.15} sun={[220, 90, 60]} fog={0.6}>
        <Garden>
          <Grandma t={t} mode="phone" screen={chatTex([{ from: "her", text: "send pic of u using it 🙂" }, { from: "me", photo: true }])} />
        </Garden>
      </AirCanvas>
      <ChatPhone f={f} at={c.herEnd} until={c.notOne} msgs={[{ at: 0, from: "her", text: "send pic of u using it 🙂" }, { at: done, from: "me", photo: "internet/photo.jpg" }]} tilt={0} />
      <PacketsArrive f={f} at={c.herEnd + 4} done={done} rect={PHOTO_RECT} />
    </AbsoluteFill>
  );
};

// ───────────────────────── CABLE MAP: 600 cables, 1.5 million km, 99 % ─────────────────────────
type LL = [number, number];
const C: Record<string, LL> = {
  ny: [40.6, -73.9], va: [36.8, -76], cornwall: [50.1, -5.5], bilbao: [43.4, -3], lisbon: [38.7, -9.1], marseille: [43.3, 5.4], alex: [31.2, 29.9],
  suez: [29.9, 32.6], jeddah: [21.5, 39.2], djibouti: [11.6, 43.1], mumbai: [19, 72.8], chennai: [13, 80.3], colombo: [6.9, 79.9], singapore: [1.3, 103.8],
  hk: [22.3, 114.2], shanghai: [31.2, 121.5], tokyo: [35.6, 139.7], guam: [13.4, 144.8], la: [33.9, -118.4], seattle: [47.6, -122.3], hawaii: [21.3, -157.8],
  sydney: [-33.9, 151.2], perth: [-31.95, 115.86], auckland: [-36.8, 174.7], miami: [25.8, -80.2], fortaleza: [-3.7, -38.5], lagos: [6.4, 3.4],
  dakar: [14.7, -17.4], luanda: [-8.8, 13.2], cape: [-33.9, 18.4], mombasa: [-4, 39.7], panama: [9, -79.5], lima: [-12, -77], valpo: [-33, -71.6],
  halifax: [44.6, -63.6], fiji: [-18.1, 178.4], jakarta: [-6.1, 106.8], darwin: [-12.4, 130.8],
};
/** cable routes as waypoints (city keys or [lat, lon] sea points) so they stay in the oceans like the real ones */
type WP = string | LL;
const ROUTES: WP[][] = [
  ["ny", [45, -40], "cornwall"], ["va", [40, -40], "bilbao"], ["halifax", [48, -35], "cornwall"], ["ny", [38, -40], "lisbon"],
  ["miami", [18, -62], [5, -42], "fortaleza"], ["fortaleza", [18, -30], "lisbon"], ["fortaleza", [-6, -10], "luanda"],
  ["lisbon", [28, -16], "dakar", [3, -10], "lagos", [-2, 6], "luanda", [-22, 10], "cape"],
  ["cape", [-36, 30], [-24, 40], [-12, 45], "mombasa", [2, 48], "djibouti"],
  ["marseille", [38, 12], [34, 22], "alex"],
  ["suez", [27, 34.5], "jeddah", [14, 42], "djibouti", [13, 55], "mumbai"],
  ["mumbai", [10, 72], "colombo", [5, 90], "singapore"], ["chennai", [8, 90], "singapore"],
  ["singapore", [8, 108], "hk", [26, 122], "shanghai", [32, 130], "tokyo"],
  ["tokyo", [42, 175], "la"], ["tokyo", [50, -170], "seattle"], ["shanghai", [36, 135], [47, -175], "seattle"],
  ["la", "hawaii", [-10, -175], "sydney"], ["hawaii", "guam", "tokyo"], ["guam", [-8, 156], [-25, 157], "sydney"], ["sydney", "auckland"],
  ["sydney", "fiji", "hawaii"], ["perth", [-15, 108], "singapore"], ["perth", [-37, 118], [-41, 140], "sydney"],
  ["jakarta", [-10, 118], "darwin", [-10, 141], [-14, 150], [-26, 155], "sydney"],
  ["miami", [18, -79], "panama", [-2, -83], "lima", [-22, -73], "valpo"], ["la", [15, -102], "panama"],
  ["mombasa", [0, 55], "mumbai"], ["djibouti", [6, 70], [3, 90], "singapore"],
  ["marseille", [37, 2], [36, -6], "lisbon"], ["alex", [35, 18], [41, 8], "marseille"], ["mumbai", [21, 62], [25, 57]], ["singapore", [2, 106], "jakarta"],
  ["hk", [19, 126], "guam"], ["tokyo", [28, 128], "hk"], ["chennai", [10, 84], "colombo"], ["ny", [32, -72], "miami"], ["lagos", [2, -18], "fortaleza"],
  ["cape", [-33, -10], [-26, -38], [-23, -42]], ["cornwall", [56, -20], [62, -40], "halifax"], ["suez", [33, 30], "alex"],
];
/** the photo's route: London → Marseille → Egypt → Red Sea → Mumbai → Singapore → Perth → Sydney */
const PHOTO_ROUTE: LL[] = [LONDON, C.marseille, C.alex, C.suez, C.jeddah, C.mumbai, C.singapore, C.perth, C.sydney];
const polyline = (lls: LL[], r: number, spin: number) => {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < lls.length - 1; i++) {
    const seg = greatCircle(lls[i], lls[i + 1], 40);
    seg.forEach(([la, lo], j) => {
      if (i > 0 && j === 0) return;
      out.push(onEarth(la, lo, r, spin));
    });
  }
  return out;
};
const CableWeb: React.FC<{ spin: number; draw: number; t: number; photo?: number; pulses?: number }> = ({ spin, draw, t, photo = 0, pulses = 1 }) => {
  const lines = ROUTES.map((r) => polyline(r.map((k) => (typeof k === "string" ? C[k] : k)), 1.004, spin));
  const ph = polyline(PHOTO_ROUTE, 1.008, spin);
  return (
    <group>
      {lines.map((pts, i) => (
        <TubePath key={i} points={pts} progress={Math.min(1, Math.max(0, draw * 1.6 - (i % 7) * 0.08))} radius={0.0032} color="#7ff6ff" />
      ))}
      {pulses > 0
        ? lines.map((pts, i) => {
            const k = (t * 0.35 + i * 0.137) % 1;
            const p = pts[Math.floor(k * (pts.length - 1))];
            return <Glow key={i} position={p} size={0.05} color="#e8fdff" opacity={pulses * Math.min(1, draw * 2)} />;
          })
        : null}
      {photo > 0 ? <TubePath points={ph} progress={photo} radius={0.0055} color="#ffd23f" /> : null}
    </group>
  );
};
export const SetCableMap: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const spin = -0.2 - ramp(f, c.notOne, c.detours, (x) => x) * 0.6; // turns east: Europe → Asia
  const draw = ramp(f, c.notOne + 4, c.six + 30, (x) => x);
  const cam = globeCam(18, 35, keys(f, [
    [c.notOne, 3.6],
    [c.carry, 4.6],
  ]), -0.2);
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={1} ao={0} env={0.05}>
        <Earth r={1} lat={EARTH_LAT} lon={EARTH_LON} spin={spin} clouds={t * 0.01} sun={[cam.pos[0] + 1.5, cam.pos[1] + 2, cam.pos[2]]} cover={0.45} />
        <CableWeb spin={spin} draw={draw} t={t} />
      </AirCanvas>
      <CounterPill o={fadeIn(f, c.six)} value={600 * ramp(f, c.six, c.six + 20, easeOut)} label="CABLES" />
      {f >= c.million ? <Big x={540} y={1430} text={"1.5 MILLION KM\n930,000 MI"} o={fadeIn(f, c.million)} size={80} color="#7ff6ff" /> : null}
      {f >= c.carry ? <Big x={540} y={1650} text={"99 % OF DATA\nBETWEEN CONTINENTS"} o={fadeIn(f, c.carry)} size={64} color="#ffd23f" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── GRANDMA: she sees it, sends one back (3 times now) ─────────────────────────
export const SetGrandma: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const selfie = f >= c.back + 10;
  const cam: Cam = selfie
    ? { pos: keys3(f, [[c.back + 10, [2.4, 1.65, 4.0]], [c.congrats, [2.0, 1.6, 3.6]]]), look: [0.85, 1.45, 2.2], fov: 40 }
    : { pos: keys3(f, [[c.detours, [3.2, 1.7, 5.6]], [c.back + 10, [2.6, 1.6, 4.6]]]), look: [0.9, 1.3, 2.2], fov: 40 };
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} dusk={0.15} sun={[220, 90, 60]} fog={0.6}>
        <Garden>
          <Grandma t={t} mode={selfie ? "selfie" : f >= c.sees ? "laugh" : "phone"} screen={chatTex([{ from: "me", photo: true }])} />
        </Garden>
      </AirCanvas>
      {f < c.back + 10 ? <Big x={540} y={400} text={"0.25 S"} o={fadeIn(f, c.detours + 4)} size={130} color="#7ff6ff" /> : null}
      <ChatPhone f={f} at={c.wearing} until={c.congrats} msgs={[{ at: 0, from: "me", photo: "internet/photo.jpg" }, { at: c.wearing + 6, from: "her", photo: "internet/photo_grandma.jpg" }]} title="FROM GRANDMA 🇦🇺" left={40} top={980} tilt={-4} />
      <UsedCounter f={f} at={c.three} top={250} />
    </AbsoluteFill>
  );
};

// ───────────────────────── FINALE: the planet wrapped in glass ─────────────────────────
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const spin = 0.7 - ramp(f, c.congrats, c.congrats + 240, (x) => x) * 0.25;
  const cam = globeCam(8, 80, keys(f, [
    [c.congrats, 3.4],
    [c.callIt, 5.0],
  ]), 0.7);
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={1} ao={0} env={0.05}>
        <Earth r={1} lat={EARTH_LAT} lon={EARTH_LON} spin={spin} clouds={t * 0.01} sun={[cam.pos[0] + 1.5, cam.pos[1] + 2, cam.pos[2]]} cover={0.45} />
        <CableWeb spin={spin} draw={1} t={t} photo={ramp(f, c.congrats + 6, c.planet + 30, easeOut)} />
        <Glow position={[0, 0, 0]} size={3.4} color="#3fa8ff" opacity={0.25} />
      </AirCanvas>
      {f >= c.callIt ? <Big x={540} y={400} text={"THE\nINTERNET"} o={fadeIn(f, c.callIt)} size={130} color="#ffffff" /> : null}
    </AbsoluteFill>
  );
};

export { Grandma };
