import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam, CameraRig, Glow, project, TubePath, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { Post, RB } from "../../lib/three/diorama";
import { easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { fonts } from "../../lib/theme";
import { Big, Tag } from "../rocket/sets";
import { c } from "./cues";
import { BENT, Chambers, ENTRANCE_P, GREAT, KINGS, MASTABA, PLUGS, QUEENS, RampTheories, STEP, Tomb } from "./pyramid";
import { BlackCat, CargoBoat, Detector, graffitiTex, Jar, Loaf, Saucer, SignPost, Skyline, Sledge, StoneBlock } from "./props";
import { CLIFF_X, GizaCanvas, NILE } from "./world";
import { BlockClock, BlockVsCar, CounterPill, ForceBars, NileMap, PatchNotes, Stamp } from "./inserts";

export type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const W = 1080;
const H = 1920;

const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" };
const YOU: Outfit = { top: "#e8573a", pants: "#2c3440", shoes: "#f2f2f2" };
const ROBBER: Outfit = { top: "#1d1d22", pants: "#25252b", shoes: "#151515" };
const SKIN = ["#9a6440", "#8a5434", "#a8744c", "#7a4a2c"];
/** Egyptian workers: bare chest (skin top, short sleeves), a white linen kilt, bare feet. */
const worker = (i: number): Outfit => ({ top: SKIN[i % 4], pants: "#efe6d2", shoes: SKIN[i % 4], sleeves: 0.17 });
const TOURISTS: Outfit[] = [
  { top: "#f2f2f2", pants: "#3a4a6a", shoes: "#ffffff" },
  { top: "#e8b83a", pants: "#d8c8a8", shoes: "#6a4a2a" },
  { top: "#3aa88a", pants: "#2a2a2a", shoes: "#eeeeee" },
  { top: "#d85a8a", pants: "#e8e2d8", shoes: "#ffffff" },
  { top: "#4a6ad8", pants: "#c8b898", shoes: "#3a3a3a" },
  { top: "#a83a3a", pants: "#3a3a3a", shoes: "#eeeeee" },
];
const PULL_ARMS: Record<string, [number, number, number]> = { spine_02: [0, 1, 0.38], upperarm_l: [0.2, -0.85, -0.45], lowerarm_l: [0.12, -0.55, -0.8], upperarm_r: [-0.2, -0.85, -0.45], lowerarm_r: [-0.12, -0.55, -0.8] };
const MASK_S = 0.5;

/** screen position of a world point; points beyond project()'s 1 km far plane are moved along the line of sight to 500 m */
const atOf = (cam: Cam) => (p: V3) => {
  const d = Math.hypot(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]);
  if (d < 900) return project(p, cam, W, H);
  const k = 500 / d;
  return project([cam.pos[0] + (p[0] - cam.pos[0]) * k, cam.pos[1] + (p[1] - cam.pos[1]) * k, cam.pos[2] + (p[2] - cam.pos[2]) * k], cam, W, H);
};

// ───────────────────────── FRIEND (opening): close on the pocket puh → "buried with it. Forever." ─────────────────────────
export const SetFriend: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const buried = c.friend + 14; // "…buried"
  const cam: Cam = {
    pos: keys3(f, [
      [0, [0.62, 1.18, 1.55]],
      [buried, [0.55, 1.18, 1.35]],
      [c.forever, [2.9, 1.7, 4.6]],
      [c.dig, [2.2, 1.6, 3.6]],
    ]),
    look: keys3(f, [
      [0, [0.1, 1.02, 0.05]],
      [buried, [0.1, 1.04, 0.05]],
      [c.forever, [0, 1.05, 0]],
    ]),
    fov: keys(f, [
      [0, 38],
      [c.forever, 40],
    ]),
  };
  const at = atOf(cam);
  const pFriend = at([-0.75, 1.95, 0.1]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} shadow={10}>
        <StoneBlock p={[0.1, 0, 0]} s={[0.9, 0.8, 0.7]} />
        <group position={[0.1, 0.8, 0.05]}>
          <FursuitHead s={MASK_S} t={t} />
        </group>
        <Model file="man_b.glb" anims={LIB1} clip="Idle_Talking_Loop" t={t} p={[-0.8, 0, 0.1]} ry={0.7} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} />
        <Model file="man_a.glb" anims={LIB2} clip="Idle_FoldArms_Loop" t={t} p={[1.1, 0, 0.5]} ry={-0.8} outfit={YOU} tint={{ Hair: "#3b2a1e" }} />
      </GizaCanvas>
      {f >= c.forever && f < c.steal ? <Big x={540} y={1450} text="FOREVER." o={fadeIn(f, c.forever)} size={110} color="#ffd23f" /> : null}
      {f >= c.age && pFriend ? <Tag x={pFriend.x} y={pFriend.y} text="AGE: 25" side="left" o={fadeIn(f, c.age)} /> : null}
      {f >= c.ahead && pFriend ? <Tag x={pFriend.x} y={pFriend.y + 90} text="PLANNING AHEAD" side="left" color="#5dfc8d" o={fadeIn(f, c.ahead)} size={32} /> : null}
      {f >= c.steal ? <Stamp f={f} at={c.steal} text="NO STEALING. EVER." top={1300} size={78} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── HOLE: you dig, the puh goes in; a robber digs too ─────────────────────────
const Hole: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <circleGeometry args={[0.75, 32]} />
      <meshStandardMaterial color="#3a2614" roughness={1} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={[1, 1, 0.35]}>
      <torusGeometry args={[0.85, 0.16, 8, 32]} />
      <meshStandardMaterial color="#c49a64" roughness={1} />
    </mesh>
    <mesh position={[1.35, 0, -0.6]} scale={[0.7, 0.38, 0.55]} castShadow receiveShadow>
      <sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#b88a56" roughness={1} />
    </mesh>
  </group>
);
export const SetHole: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.dig, [2.6, 2.8, 3.6]],
      [c.robbers1, [2.2, 3.1, 3.8]],
      [c.bench, [1.4, 3.6, 4.6]],
    ]),
    look: keys3(f, [
      [c.dig, [0.2, 0.3, 0]],
      [c.robbers1, [-0.5, 0.4, -0.2]],
    ]),
    fov: 42,
  };
  const at = atOf(cam);
  const sink = ramp(f, c.dig + 18, c.dig + 34);
  // the robber walks in from the north-west, then kneels at the hole
  const rk = ramp(f, c.robbers1 - 30, c.robbers1 + 18, (x) => x);
  const rp: V3 = [-4.2 + 3.1 * rk, 0, -2.6 + 1.7 * rk];
  const kneel = rk >= 1;
  const pRob = at([rp[0], 1.9, rp[2]]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} shadow={10}>
        <Hole />
        <group position={[0, 0.85 - 1.0 * sink, 0]}>
          <FursuitHead s={MASK_S * 0.9} t={t} />
        </group>
        <Model file="man_a.glb" anims={LIB1} clip="Fixing_Kneeling" t={t} p={[0.95, 0, 0.55]} ry={-2.2} outfit={YOU} tint={{ Hair: "#3b2a1e" }} />
        <Model file="man_b.glb" anims={LIB2} clip="Idle_FoldArms_Loop" t={t} p={[-0.4, 0, 1.6]} ry={2.9} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} />
        {f >= c.robbers1 - 30 ? (
          <Model file="man_d.glb" anims={LIB1} clip={kneel ? "Fixing_Kneeling" : "Crouch_Fwd_Loop"} t={kneel ? t : t * 1.1} p={rp} ry={kneel ? 2.1 : 0.95} outfit={ROBBER} tint={{ Hair: "#111111" }} />
        ) : null}
      </GizaCanvas>
      {f >= c.robbers1 && pRob ? <Tag x={pRob.x} y={pRob.y} text="TOMB ROBBER" color="#ff3b30" side="left" o={fadeIn(f, c.robbers1)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── MASTABA → STEP PYRAMID: the tomb grows on the same spot ─────────────────────────
const SitePeople: React.FC<{ t: number; z: number }> = ({ t, z }) => (
  <>
    <Model file="man_b.glb" anims={LIB2} clip="Idle_FoldArms_Loop" t={t} p={[-1, 0, z]} ry={2.9} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} attach={{ bone: "Head", node: <FursuitHead s={MASK_S} t={t} p={[0, -0.2, 0.03]} /> }} />
    <Model file="man_a.glb" anims={LIB1} clip="Idle_Loop" t={t} p={[0.6, 0, z + 0.3]} ry={3.3} outfit={YOU} tint={{ Hair: "#3b2a1e" }} />
  </>
);
export const SetMastaba: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.bench, [3.6, 2, 25]],
      [c.bench + 14, [8, 4, 30]],
      [c.bench + 44, [32, 22, 52]],
      [c.mastaba, [64, 45, 94]],
      [c.stack, [70, 50, 104]],
    ]),
    look: keys3(f, [
      [c.bench, [-0.4, 1.5, 14]],
      [c.bench + 14, [-0.5, 2.5, 10]],
      [c.mastaba, [0, 2, 0]],
    ]),
    fov: 42,
  };
  const at = atOf(cam);
  const built = ramp(f, c.bench + 4, c.bench + 32, (x) => x);
  const pTop = at([0, 7.5, 0]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} shadow={50}>
        <Tomb prof={MASTABA} courseH={1} built={built} drop={4} />
        <SitePeople t={t} z={16} />
      </GizaCanvas>
      {f >= c.mastaba && pTop ? <Tag x={pTop.x} y={pTop.y - 150} text="MASTABA" o={fadeIn(f, c.mastaba)} side="left" /> : null}
      {f >= c.mastaba + 8 && pTop ? <Tag x={pTop.x} y={pTop.y - 66} text="= 'BENCH' IN ARABIC" color="#8fd0ff" side="left" size={30} o={fadeIn(f, c.mastaba + 8)} /> : null}
      {f >= c.bigger1 ? <Big x={540} y={430} text="BIGGER." o={fadeIn(f, c.bigger1)} size={120} color="#ffd23f" /> : null}
    </AbsoluteFill>
  );
};

export const SetStep: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.stack, [120, 30, 170]],
      [c.first + 30, [190, 70, 150]],
    ]),
    look: [0, 26, 0],
    fov: 40,
  };
  const at = atOf(cam);
  const built = ramp(f, c.stack + 2, c.imhotep + 24, (x) => x);
  const pTop = at([0, 63, 0]);
  const pBase = at([60, 2, 55]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t}>
        <Tomb prof={STEP} courseH={1.3} built={built} drop={5} />
      </GizaCanvas>
      {f >= c.imhotep && pTop ? <Tag x={pTop.x} y={pTop.y - 40} text="IMHOTEP" side="left" o={fadeIn(f, c.imhotep)} /> : null}
      {f >= c.imhotep + 6 && pTop ? <Tag x={pTop.x} y={pTop.y + 46} text="ARCHITECT · ~2670 BC" side="left" color="#8fd0ff" size={32} o={fadeIn(f, c.imhotep + 6)} /> : null}
      {f >= c.first ? <Big x={540} y={400} text={"THE FIRST\nPYRAMID"} o={fadeIn(f, c.first)} size={100} color="#ffd23f" /> : null}
      {f >= c.first + 6 && pBase ? <Tag x={pBase.x} y={pBase.y} text="62.5 M · 205 FT" color="#5dfc8d" o={fadeIn(f, c.first + 6)} side="left" size={34} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── BENT PYRAMID: 54° → 43° ─────────────────────────
const AngleMark: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; label: string; color: string; o: number }> = ({ a, b, label, color, o }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={10} strokeLinecap="round" />
    <line x1={a.x} y1={a.y} x2={a.x + 170} y2={a.y} stroke={color} strokeWidth={5} strokeDasharray="14 10" />
    <text x={a.x + 110} y={a.y - 26} fontFamily={fonts.punch} fontWeight={900} fontSize={62} fill="#fff" stroke="#000" strokeWidth={9} paintOrder="stroke">
      {label}
    </text>
  </svg>
);
export const SetBent: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.smooth, [520, 12, -40]],
      [c.patch, [560, 24, 0]],
      [c.bigger2, [600, 40, 50]],
    ]),
    look: [0, 34, 0],
    fov: 34,
  };
  const at = atOf(cam);
  const low = ramp(f, c.smooth + 4, c.risky, (x) => x) * 0.449;
  const high = ramp(f, c.switch43 + 4, c.patch + 14, (x) => x) * (1 - 0.449);
  const built = low + high;
  // the visible silhouette edge (south side)
  const hw0 = BENT.hw(0)[1];
  const hw47 = BENT.hw(47)[1];
  const b0 = at([0, 0, hw0 + 1]);
  const b1 = at([0, 47, hw47 + 1]);
  const b2 = at([0, 104.6, 0]);
  const risky = f >= c.risky && f < c.switch43 + 4;
  const pTop = at([0, 106, 0]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} sun={[260, 170, 360]}>
        <Tomb prof={BENT} built={built} casing={built} tone="#c4a983" casingColor="#d6c3a0" />
      </GizaCanvas>
      {f >= c.steep && b0 && b1 ? <AngleMark a={b0} b={b1} label="54°" color={risky ? "#ff3b30" : "#ffd23f"} o={fadeIn(f, c.steep)} /> : null}
      {risky && b1 ? <Tag x={b1.x} y={b1.y - 60} text="RISKY" color="#ff3b30" side="right" o={fadeIn(f, c.risky)} /> : null}
      {f >= c.switch43 + 8 && b1 && b2 ? <AngleMark a={b1} b={b2} label="43°" color="#5dfc8d" o={fadeIn(f, c.switch43 + 8)} /> : null}
      <PatchNotes f={f} at={c.patch} />
      {f >= c.bent && pTop ? <Tag x={pTop.x} y={pTop.y - 60} text="THE BENT PYRAMID" side="left" o={fadeIn(f, c.bent)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── GREAT PYRAMID: 146 m, 2.3 million blocks ─────────────────────────
/** Statue of Liberty silhouette (ground to torch), drawn into a 100 × 300 box. */
const LIBERTY =
  "M 30 300 L 30 250 L 22 250 L 22 232 L 34 222 L 34 176 L 66 176 L 66 222 L 78 232 L 78 250 L 70 250 L 70 300 Z " +
  "M 38 176 L 40 120 Q 36 100 42 86 L 46 70 Q 44 62 48 58 L 44 52 L 47 50 L 49 44 L 52 50 L 55 44 L 57 50 L 61 48 L 58 56 Q 60 62 58 70 L 62 80 L 66 58 L 64 30 L 61 26 L 63 10 L 66 4 L 70 10 L 72 26 L 69 30 L 70 60 L 66 92 Q 64 110 62 120 L 62 176 Z";
export const SetGreat: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.bigger2, [420, 70, 560]],
      [c.liberty, [470, 90, 600]],
      [c.sleds, [520, 120, 560]],
    ]),
    look: keys3(f, [
      [c.bigger2, [0, 60, 0]],
      [c.liberty, [40, 60, 40]],
    ]),
    fov: 40,
  };
  const at = atOf(cam);
  const built = ramp(f, c.bigger2 - 2, c.m146 + 8, (x) => x);
  const count = ramp(f, c.blocks - 6, c.blocks + 22, easeOut);
  const apex = at([0, 146.6, 0]);
  const foot = at([0, 0, 0]);
  // the Statue of Liberty, 93 m, standing in front of the south-east corner
  const lb = at([190, 0, 170]);
  const lt = at([190, 93, 170]);
  const lh = lb && lt ? lb.y - lt.y : 0;
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t}>
        <Tomb prof={GREAT} built={built} />
      </GizaCanvas>
      {f >= c.m146 && apex ? <Tag x={apex.x} y={apex.y} text="146.6 M · 481 FT" side="right" o={fadeIn(f, c.m146)} /> : null}
      {f >= c.liberty && lb && lt ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: fadeIn(f, c.liberty) }}>
          <g transform={`translate(${lb.x - (lh / 300) * 50},${lt.y}) scale(${lh / 300})`}>
            <path d={LIBERTY} fill="#5fb59a" stroke="#0b2a22" strokeWidth={3} />
          </g>
          {apex && foot ? <line x1={lt.x + 70} y1={lt.y} x2={apex.x + 40} y2={lt.y} stroke="#ffffff" strokeWidth={4} strokeDasharray="12 10" /> : null}
        </svg>
      ) : null}
      {f >= c.liberty + 6 && lt ? <Tag x={lt.x + 20} y={lt.y - 50} text="93 M · 305 FT" color="#5fb59a" side="right" size={32} o={fadeIn(f, c.liberty + 6)} /> : null}
      <CounterPill o={fadeIn(f, c.blocks - 6)} value={2300000 * count} label="BLOCKS" />
      <BlockVsCar f={f} at={c.heavy} />
      <BlockClock f={f} at={c.finish} />
    </AbsoluteFill>
  );
};

// ───────────────────────── SLED: dragging a block, dry sand vs wet sand ─────────────────────────
const SLED_Z0 = 330;
export const SetSled: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  // slow and struggling on dry sand (a heap builds up in front), easier once the sand is wet
  const d = (() => {
    const a = Math.max(0, Math.min(f, c.water + 12) - c.sleds) * 0.004;
    const b = Math.max(0, f - (c.water + 12)) * 0.022;
    return a + b;
  })();
  const sz = SLED_Z0 - d;
  const heap = ramp(f, c.sleds + 6, c.digs + 10) * (1 - ramp(f, c.water + 6, c.water + 20));
  const wet = ramp(f, c.water + 4, c.water + 16);
  const cam: Cam = { pos: [5.2, 2.0, sz + 5.5], look: [-0.4, 1.0, sz - 5], fov: 42 };
  const at = atOf(cam);
  const pullers = Array.from({ length: 8 }, (_, i) => ({ x: i % 2 ? 0.55 : -0.55, z: sz - 3.2 - Math.floor(i / 2) * 1.35, i }));
  const walkT = d / 1.1; // clip seconds = metres / walk speed
  const rope = (side: number) => [new THREE.Vector3(side * 0.45, 0.45, sz - 1.25), ...pullers.filter((p) => Math.sign(p.x) === side).map((p) => new THREE.Vector3(p.x, 0.92, p.z + 0.38))];
  const pWater = at([0, 0.1, sz - 2.2]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} shadow={14}>
        <Tomb prof={GREAT} built={0.34} />
        <Sledge p={[0, 0, sz]} ry={0} />
        {heap > 0.01 ? (
          <mesh position={[0, 0, sz - 1.4]} scale={[0.95, 0.32 * heap, 0.45]}>
            <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#e0b77e" roughness={1} />
          </mesh>
        ) : null}
        {wet > 0.01 ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, sz - 4.5]}>
            <planeGeometry args={[1.9, 6.4]} />
            <meshStandardMaterial color="#8a6238" roughness={0.45} transparent opacity={0.75 * wet} depthWrite={false} />
          </mesh>
        ) : null}
        {pullers.map((p) => (
          <Model key={p.i} file={["man_a.glb", "man_c.glb", "man_d.glb", "man_b.glb"][p.i % 4]} anims={LIB1} clip="Walk_Loop" t={walkT * 0.55 + p.i * 0.31} p={[p.x, 0, p.z]} ry={Math.PI} outfit={worker(p.i)} tint={{ Hair: "#141010" }} aim={PULL_ARMS} />
        ))}
        {[-1, 1].map((s) => (
          <TubePath key={s} points={rope(s)} radius={0.025} color="#c8a46a" glow={false} />
        ))}
        {/* the water-pourer standing on the front of the sledge */}
        {f >= c.water - 4 ? (
          <Model file="man_c.glb" anims={LIB2} clip="Farm_Watering" t={t} p={[0, 0.28, sz - 1.0]} ry={Math.PI} outfit={worker(5)} tint={{ Hair: "#141010" }} attach={{ bone: "hand_r", node: <Jar p={[0, 0.05, 0.05]} rot={[0, 0, 2.2]} s={0.9} /> }} />
        ) : null}
        {wet > 0.01 ? (
          <mesh position={[0.15, 0.55, sz - 1.75]}>
            <cylinderGeometry args={[0.03, 0.05, 1.1, 8]} />
            <meshStandardMaterial color="#9ed8ff" transparent opacity={0.6 * wet} roughness={0.1} depthWrite={false} />
          </mesh>
        ) : null}
      </GizaCanvas>
      {f >= c.digs && f < c.water + 10 && pWater ? <Tag x={pWater.x} y={pWater.y} text="SAND PILES UP" color="#ff6b5e" side="right" size={32} o={fadeIn(f, c.digs)} /> : null}
      {f >= c.water + 10 && pWater ? <Tag x={pWater.x} y={pWater.y} text="WET SAND" color="#4ab8ff" side="right" o={fadeIn(f, c.water + 10)} /> : null}
      <ForceBars f={f} at={c.study} />
    </AbsoluteFill>
  );
};

// ───────────────────────── RIVER: Tura limestone across the Nile, boats ─────────────────────────
export const SetRiver: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const bz = 220 - (f - c.nile) * 0.11;
  const cam: Cam = {
    pos: keys3(f, [
      [c.nile, [NILE.x - 120, 22, 160]],
      [c.boats, [NILE.x - 60, 12, bz + 42]],
      [c.merer, [NILE.x - 52, 10, bz + 36]],
    ]),
    look: keys3(f, [
      [c.nile, [CLIFF_X, 50, -40]],
      [c.boats, [NILE.x + 10, -7, bz - 6]],
      [c.merer, [NILE.x + 10, -7, bz - 6]],
    ]),
    fov: keys(f, [
      [c.nile, 28],
      [c.boats, 40],
    ]),
  };
  const at = atOf(cam);
  const pCliff = at([CLIFF_X + 20, 80, -40]);
  const pBoat = at([NILE.x + 10, 2, bz]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} shadow={80}>
        <Tomb prof={GREAT} built={0.4} />
        <CargoBoat p={[NILE.x + 10, -9.9, bz]} ry={0} t={t} />
        <CargoBoat p={[NILE.x + 70, -9.9, bz - 260]} ry={0.1} t={t + 2} />
        <CargoBoat p={[NILE.x - 40, -9.9, bz + 300]} ry={-0.05} t={t + 5} />
      </GizaCanvas>
      {f >= c.nile + 6 && f < c.boats && pCliff && pCliff.x < 860 ? <Tag x={pCliff.x} y={pCliff.y} text="TURA · WHITE LIMESTONE" side="left" size={32} o={fadeIn(f, c.nile + 6)} /> : null}
      {f >= c.boats + 6 && pBoat ? <Tag x={pBoat.x} y={pBoat.y - 120} text="CARGO BOAT" color="#8fd0ff" side="left" o={fadeIn(f, c.boats + 6)} /> : null}
      <NileMap f={f} at={c.granite} />
    </AbsoluteFill>
  );
};

// ───────────────────────── CREW: paid workers, bread and beer, crew names ─────────────────────────
const CREW_Z = 132;
export const SetCrew: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const g1 = useMemo(() => graffitiTex(4), []);
  const g2 = useMemo(() => graffitiTex(9), []);
  const cam: Cam = {
    pos: keys3(f, [
      [c.who, [6, 2.6, CREW_Z + 9]],
      [c.loaves - 4, [3.4, 2.0, CREW_Z + 5.5]],
      [c.names - 2, [1.6, 1.6, CREW_Z + 3.2]],
      [c.drunk, [-1.6, 1.7, CREW_Z + 3.4]],
      [c.up, [-2.4, 1.8, CREW_Z + 3.8]],
    ]),
    look: keys3(f, [
      [c.who, [0, 1.1, CREW_Z]],
      [c.loaves - 4, [2.2, 0.9, CREW_Z + 0.8]],
      [c.names - 2, [-0.2, 0.8, CREW_Z]],
      [c.drunk, [-2.8, 1.0, CREW_Z]],
    ]),
    fov: 42,
  };
  const at = atOf(cam);
  const pCrew = at([0.3, 2.1, CREW_Z - 1.5]);
  const pFood = at([2.2, 1.05, CREW_Z + 0.8]);
  const pG1 = at([-0.2, 1.25, CREW_Z + 0.5]);
  const pG2 = at([-2.8, 1.25, CREW_Z + 0.5]);
  const wob = Math.sin(t * 2.2) * 0.12;
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} shadow={14}>
        <Tomb prof={GREAT} built={0.42} />
        {/* the crew around a sledge */}
        <Sledge p={[0.6, 0, CREW_Z - 2.2]} ry={0.3} />
        {[0, 1, 2, 3].map((i) => (
          <Model key={i} file={["man_c.glb", "man_d.glb", "man_a.glb", "man_b.glb"][i]} anims={i % 2 ? LIB2 : LIB1} clip={i % 2 ? "Idle_FoldArms_Loop" : "Idle_Talking_Loop"} t={t + i} p={[-1.6 + i * 1.3, 0, CREW_Z - 3.8 + (i % 2) * 0.4]} ry={0.2 - i * 0.15} outfit={worker(i)} tint={{ Hair: "#141010" }} />
        ))}
        {/* the daily pay: 10 cone loaves and a jug of beer on a wooden table */}
        <group position={[2.2, 0, CREW_Z + 0.8]}>
          <RB p={[0, 0.72, 0]} s={[1.3, 0.07, 0.7]} r={0.02} color="#8a6a44" />
          {[-0.55, 0.55].map((x) => [-0.28, 0.28].map((z) => <RB key={`${x}${z}`} p={[x, 0.36, z]} s={[0.06, 0.72, 0.06]} r={0.01} color="#6a5034" />))}
          {Array.from({ length: 10 }, (_, i) => (
            <Loaf key={i} p={[-0.48 + (i % 5) * 0.19, 0.88, -0.14 + Math.floor(i / 5) * 0.24]} ry={i} />
          ))}
          <Jar p={[0.45, 0.76, 0.05]} s={1.1} />
        </group>
        {/* two blocks with red crew graffiti */}
        <StoneBlock p={[-0.2, 0, CREW_Z]} s={[1.6, 1.0, 1.0]} paint={g1} />
        <StoneBlock p={[-2.8, 0, CREW_Z]} s={[1.6, 1.0, 1.0]} ry={0.05} paint={g2} />
        {/* a Drunkard of Menkaure, wobbling with his jug */}
        <group position={[-3.9, 0, CREW_Z + 0.9]} rotation={[0, 0.5, wob]}>
          <Model file="man_c.glb" anims={LIB1} clip="Idle_Loop" t={t * 0.6} p={[0, 0, 0]} outfit={worker(2)} tint={{ Hair: "#141010" }} attach={{ bone: "hand_r", node: <Jar p={[0, 0.02, 0.06]} rot={[0.3, 0, 2.6]} s={0.8} /> }} />
        </group>
      </GizaCanvas>
      {f >= c.who + 6 && f < c.loaves ? <Stamp f={f} at={c.who + 10} text="NOT SLAVES" top={1250} color="#ff3b30" /> : null}
      {f >= c.paid && f < c.names && pCrew ? <Tag x={pCrew.x} y={pCrew.y} text="PAID WORKERS" color="#5dfc8d" side="left" o={fadeIn(f, c.paid)} /> : null}
      {f >= c.loaves && f < c.names && pFood ? <Tag x={pFood.x} y={pFood.y - 30} text="10 LOAVES + 1 BEER" side="left" size={34} o={fadeIn(f, c.loaves)} /> : null}
      {f >= c.loaves + 8 && f < c.names && pFood ? <Tag x={pFood.x} y={pFood.y + 110} text="EVERY DAY" color="#8fd0ff" side="left" size={30} o={fadeIn(f, c.loaves + 8)} /> : null}
      {f >= c.friends && pG1 ? <Tag x={pG1.x} y={pG1.y - 170} text="FRIENDS OF KHUFU" color="#ff8a3a" side="right" o={fadeIn(f, c.friends)} /> : null}
      {f >= c.drunk && pG2 ? <Tag x={Math.min(pG2.x, 1060 - (21 * 30 * 0.62 + 110))} y={pG2.y + 260} text="DRUNKARDS OF MENKAURE" color="#ff3b30" side="right" size={30} o={fadeIn(f, c.drunk)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── RAMP: nobody knows for sure ─────────────────────────
export const SetRamp: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.up, [520, 150, 520]],
      [c.north, [620, 220, 300]],
    ]),
    look: [0, 55, 0],
    fov: 40,
  };
  const at = atOf(cam);
  const s1 = ramp(f, c.up + 10, c.up + 30, (x) => x);
  const s2 = ramp(f, c.honest + 4, c.honest + 26, (x) => x);
  const s3 = ramp(f, c.ramps, c.ramps + 26, (x) => x);
  const p1 = at([0, 80, 120]);
  const p2 = at([118, 100, -30]);
  const p3 = at([-80, 130, 60]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t}>
        <Tomb prof={GREAT} built={1} />
        <RampTheories straight={s1} zigzag={s2} spiral={s3} />
      </GizaCanvas>
      {s1 > 0.9 && p1 ? <Tag x={p1.x} y={p1.y} text="STRAIGHT?" color="#ff9a3a" side="left" size={34} o={fadeIn(f, c.up + 26)} /> : null}
      {s2 > 0.9 && p2 ? <Tag x={p2.x} y={p2.y} text="ZIGZAG?" color="#5ad2ff" side="right" size={34} o={fadeIn(f, c.honest + 22)} /> : null}
      {s3 > 0.6 && p3 ? <Tag x={p3.x} y={p3.y} text="SPIRAL?" color="#c78bff" side="left" size={34} o={fadeIn(f, c.ramps + 16)} /> : null}
      {f >= c.honest ? <Big x={540} y={380} text="NOBODY KNOWS" o={fadeIn(f, c.honest)} size={92} color="#ffffff" /> : null}
      <Stamp f={f} at={c.bro} text="TRUST ME BRO" top={1300} color="#ffd23f" rot={-6} />
    </AbsoluteFill>
  );
};

// ───────────────────────── PRECISION: north, level, then the white casing ─────────────────────────
export const SetPrecision: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const top: V3 = [0, 760, 60];
  const cam: Cam = {
    pos: keys3(f, [
      [c.north, top],
      [c.flat - 8, top],
      [c.flat + 6, [330, 3.5, 240]],
      [c.cover, [340, 4, 250]],
      [c.cover + 46, [430, 130, 520]],
    ]),
    look: keys3(f, [
      [c.north, [0, 0, 0]],
      [c.flat - 8, [0, 0, 0]],
      [c.flat + 6, [0, 2, 0]],
      [c.cover, [0, 2, 0]],
      [c.cover + 46, [0, 62, 0]],
    ]),
    fov: 40,
  };
  const at = atOf(cam);
  const casing = ramp(f, c.cover + 6, c.cover + 50, (x) => x);
  const topView = f < c.flat - 2;
  const nTop = at([0, 0, -200]);
  const nBot = at([0, 0, 200]);
  const eA = at([115, 0, -115]);
  const eB = at([115, 0, 115]);
  const l0 = at([-115, 0.2, 115.4]);
  const l1 = at([115, 0.2, 115.4]);
  const glint = casing > 0.2 ? at([60, 70, 60]) : null;
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} sun={[-200, 260, 260]}>
        <Tomb prof={GREAT} built={1} casing={casing} />
      </GizaCanvas>
      {topView && nTop && nBot && eA && eB ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: fadeIn(f, c.north + 4) }}>
          <line x1={nTop.x} y1={nTop.y} x2={nBot.x} y2={nBot.y} stroke="#5ad2ff" strokeWidth={6} strokeDasharray="18 12" />
          <polygon points={`${nTop.x},${nTop.y - 40} ${nTop.x - 26},${nTop.y + 10} ${nTop.x + 26},${nTop.y + 10}`} fill="#5ad2ff" />
          <text x={nTop.x + 34} y={nTop.y} fontFamily={fonts.punch} fontWeight={900} fontSize={64} fill="#fff" stroke="#000" strokeWidth={8} paintOrder="stroke">
            N
          </text>
          <line x1={eA.x} y1={eA.y - 60} x2={eB.x} y2={eB.y + 60} stroke="#ffd23f" strokeWidth={6} />
        </svg>
      ) : null}
      {topView && f >= c.north + 14 ? <Tag x={540} y={1320} text="OFF BY < 0.1°" color="#ffd23f" side="right" o={fadeIn(f, c.north + 14)} /> : null}
      {!topView && f < c.cover + 4 && l0 && l1 ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: fadeIn(f, c.flat + 6) }}>
          <line x1={l0.x} y1={l0.y} x2={l1.x} y2={l1.y} stroke="#5dfc8d" strokeWidth={6} />
          <circle cx={l0.x} cy={l0.y} r={10} fill="#5dfc8d" />
        </svg>
      ) : null}
      {f >= c.flat + 8 && f < c.cover + 4 ? <Tag x={110} y={1330} text="FLAT TO 2 CM · 0.8 IN" color="#5dfc8d" side="right" o={fadeIn(f, c.flat + 8)} /> : null}
      {glint ? <div style={{ position: "absolute", left: glint.x - 160, top: glint.y - 160, width: 320, height: 320, borderRadius: 160, background: "radial-gradient(circle, rgba(255,250,230,0.9) 0%, rgba(255,240,200,0) 65%)", opacity: 0.6 * Math.sin(Math.min(1, casing) * Math.PI) }} /> : null}
      {f >= c.cover + 12 ? <Tag x={110} y={1330} text="POLISHED WHITE LIMESTONE" color="#ffffff" side="right" size={34} o={fadeIn(f, c.cover + 12)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── ROBBERS (x-ray at night) → TOURISTS (today) ─────────────────────────
export const SetRobbers: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.robbers, [-340, 70, -10]],
      [c.plugs + 4, [-120, 22, -72]],
      [c.around, [-70, 12, -84]],
      [c.tourists, [-64, 12, -86]],
    ]),
    look: keys3(f, [
      [c.robbers, [0, 42, -20]],
      [c.plugs + 4, [0, 11, -74]],
      [c.around, [0, 8, -84]],
    ]),
    fov: 42,
  };
  const at = atOf(cam);
  const plugs = fadeIn(f, c.plugs + 6, 10);
  const robbers = ramp(f, c.around - 4, c.tourists - 4, (x) => x);
  const hid = ramp(f, c.hide + 6, c.hide + 20);
  const pPlug = at(PLUGS[1]);
  const pEnt = at(ENTRANCE_P);
  const pTun = at([0, 9, -96]);
  const crew = [0, 1, 2].map((i) => {
    const k = ramp(f, c.robbers + i * 6, c.around, (x) => x);
    return { p: [-2 + i * 2, 0, -150 + 30 * k] as V3, walking: k < 1, i };
  });
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} night={0.6} ao={0} fog={0.6} sun={[-300, 160, 80]}>
        <Tomb prof={GREAT} built={1} cut />
        <Chambers o={1} plugs={plugs} robbers={robbers} pocket={1} />
        {/* the entrance glows, then gets hidden behind a casing stone */}
        <Glow position={[ENTRANCE_P[0], ENTRANCE_P[1] + 0.8, ENTRANCE_P[2] - 1]} size={10 * (1 - hid) + 0.01} color="#ffd28a" opacity={0.9 * (1 - hid)} />
        {crew.map((r) => (
          <group key={r.i}>
            <Model file={["man_d.glb", "man_c.glb", "man_a.glb"][r.i]} anims={LIB1} clip={r.walking ? "Walk_Loop" : "Idle_Torch_Loop"} t={t + r.i} p={r.p} ry={0} outfit={ROBBER} tint={{ Hair: "#111111" }} />
            <Glow position={[r.p[0] + 0.3, 1.9, r.p[2] + 0.3]} size={3.2} color="#ffa040" opacity={0.85} />
          </group>
        ))}
      </GizaCanvas>
      {f >= c.plugs + 22 && pPlug ? <Tag x={pPlug.x} y={pPlug.y + 40} text="GRANITE PLUGS · UP TO 25 T" color="#ff3b30" side="right" size={34} o={fadeIn(f, c.plugs + 22)} /> : null}
      {f >= c.hide && f < c.around && pEnt ? <Tag x={pEnt.x} y={pEnt.y} text="HIDDEN ENTRANCE" color="#ffd28a" side="right" size={34} o={fadeIn(f, c.hide)} /> : null}
      {f >= c.around + 10 && pTun ? <Tag x={pTun.x} y={pTun.y - 80} text="ROBBERS' TUNNEL" color="#ff8a3a" side="right" o={fadeIn(f, c.around + 10)} /> : null}
    </AbsoluteFill>
  );
};

/** stairs up to the robbers' hole on the north face (today's tourist entrance) */
const stairY = (z: number) => THREE.MathUtils.clamp(((-z - 110) / (128 - 110)) * -7 + 7, 0, 7);
export const SetTourists: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.tourists, [16, 5, -140]],
      [c.white, [12, 6.5, -134]],
    ]),
    look: [0, 5.5, -116],
    fov: 42,
  };
  const at = atOf(cam);
  const L = 22;
  const people = TOURISTS.map((o, i) => {
    const s = (t * 1.05 + i * (L / TOURISTS.length)) % L;
    const z = -132 + s;
    return { o, i, z, y: stairY(z), fade: Math.min(1, (L - s) / 2) };
  });
  const pHole = at([0, 10.6, -111]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} shadow={30}>
        <Tomb prof={GREAT} built={1} />
        {/* the hole: a dark ragged opening in the face */}
        <mesh position={[0, 8.3, -109.8]}>
          <boxGeometry args={[2.4, 2.7, 3.2]} />
          <meshStandardMaterial color="#0d0906" roughness={1} />
        </mesh>
        {/* a torn rim of broken blocks around the opening */}
        {[-1.5, 1.5].map((x) => (
          <RB key={x} p={[x * 1.05, 8.2, -111.2]} s={[1.0, 3.2, 1.0]} r={0.08} color="#b89a6a" rough={1} />
        ))}
        <RB p={[0, 9.9, -111.2]} s={[3.6, 0.7, 0.8]} r={0.08} color="#b89a6a" rough={1} />
        {/* stone stairs with a wooden hand-rail */}
        {Array.from({ length: 18 }, (_, i) => {
          const z = -128 + i;
          return <RB key={i} p={[0, stairY(z + 0.5) / 2 - 0.02, z + 0.5]} s={[2.6, stairY(z + 0.5) + 0.04, 1.02]} r={0.02} color="#cdb48a" rough={0.95} />;
        })}
        <TubePath points={[new THREE.Vector3(1.4, 1, -128), new THREE.Vector3(1.4, 8, -110.5)]} radius={0.04} color="#7a5634" glow={false} />
        {people.map((p) =>
          p.z < -110.6 ? <Model key={p.i} file={["woman_a.glb", "man_c.glb", "woman_b.glb", "man_a.glb", "woman_c.glb", "man_d.glb"][p.i]} anims={LIB1} clip="Walk_Loop" t={t * 0.95 + p.i} p={[(p.i % 2 ? 0.45 : -0.45), p.y, p.z]} ry={0} outfit={p.o} /> : null,
        )}
        <Model file="woman_b.glb" anims={LIB2} clip="Idle_TalkingPhone_Loop" t={t} p={[3.4, 0, -131]} ry={-0.5} outfit={TOURISTS[3]} />
        <SignPost p={[-3.2, 0, -131]} ry={0.4} lines={["ENTRANCE", "GREAT PYRAMID"]} s={0.9} />
      </GizaCanvas>
      {pHole ? <Tag x={pHole.x} y={pHole.y} text="ROBBERS' TUNNEL · ~820 AD" color="#ff8a3a" side="left" size={34} o={fadeIn(f, c.tourists + 4)} /> : null}
      {f >= c.tourists + 26 && pHole ? <Tag x={pHole.x} y={pHole.y + 86} text="TOURIST ENTRANCE TODAY" color="#5dfc8d" side="left" size={34} o={fadeIn(f, c.tourists + 26)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── QUAKE 1303: the casing falls, Cairo gets it ─────────────────────────
const CAIRO: V3 = [900, -9.6, -900];
export const SetQuake: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const shake = f >= c.quake && f < c.quake + 30 ? Math.sin(((f - c.quake) / 30) * Math.PI * 6) * 0.012 * (1 - (f - c.quake) / 30) : 0;
  const cam: Cam = {
    pos: keys3(f, [
      [c.white, [420, 60, 470]],
      [c.cairo - 4, [440, 70, 480]],
      [c.cairo + 10, [430, 90, 380]],
      [c.scan, [420, 100, 320]],
    ]),
    look: keys3(f, [
      [c.white, [0, 60, 0]],
      [c.cairo - 4, [0, 60, 0]],
      [c.cairo + 10, [880, 40, -880]],
      [c.scan, [900, 30, -900]],
    ]),
    fov: 40,
    roll: shake,
  };
  const at = atOf(cam);
  const fall = ramp(f, c.quake + 4, c.cairo + 6, (x) => x);
  const casing = 1 - 0.8 * fall;
  const r = useMemo(() => seeded(5), []);
  const slabs = useMemo(() => Array.from({ length: 26 }, () => ({ x: (r() - 0.5) * 180, y: 40 + r() * 80, d: r() * 0.5 })), [r]);
  const arc = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) {
      const k = i / 30;
      pts.push(new THREE.Vector3(60 + (CAIRO[0] - 60) * k, 60 + 260 * Math.sin(k * Math.PI), 60 + (CAIRO[2] - 60) * k));
    }
    return pts;
  }, []);
  const arcK = ramp(f, c.cairo, c.cairo + 26, (x) => x);
  const pCairo = at([CAIRO[0], 120, CAIRO[2]]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} dusk={0.25}>
        <Tomb prof={GREAT} built={1} casing={casing} />
        {f >= c.quake + 4
          ? slabs.map((s, i) => {
              const k = Math.max(0, Math.min(1, (fall - s.d) * 2));
              if (k <= 0 || k >= 1) return null;
              const y = s.y * (1 - k);
              const zf = GREAT.hw(y)[1] + 2 + k * 30;
              return <StoneBlock key={i} p={[s.x * (1 - y / 160), y, zf]} s={[2.4, 1.2, 1.6]} ry={k * 3} tone="#fffaf0" />;
            })
          : null}
        <group position={CAIRO} scale={1.5}>
          <Skyline p={[0, 0, 0]} ry={Math.PI / 2} />
        </group>
        {arcK > 0 ? <TubePath points={arc} progress={arcK} radius={6} color="#fff6e0" /> : null}
      </GizaCanvas>
      {f >= c.quake ? <Tag x={110} y={420} text="EARTHQUAKE · 1303" color="#ff6b5e" side="right" o={fadeIn(f, c.quake)} /> : null}
      {f >= c.cairo + 14 && pCairo ? <Tag x={pCairo.x} y={pCairo.y} text="CAIRO" side="left" o={fadeIn(f, c.cairo + 14)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── SCAN 2017: cosmic-ray muons find the Big Void ─────────────────────────
export const SetScan: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.scan, [-420, 80, 40]],
      [c.found, [-190, 55, -12]],
      [c.nobodyIn, [-110, 52, -18]],
      [c.backrooms, [-24, 51, -19]],
    ]),
    look: keys3(f, [
      [c.scan, [0, 40, -10]],
      [c.found, [0, 46, -20]],
      [c.backrooms, [0, 51, -20]],
    ]),
    fov: 44,
  };
  const at = atOf(cam);
  const voidK = fadeIn(f, c.found + 4, 12);
  const muons = useMemo(() => {
    const r = seeded(17);
    return Array.from({ length: 60 }, () => ({ x: (r() - 0.5) * 220, z: (r() - 0.5) * 220, sp: 8 + r() * 6, ph: r() * 600, tilt: (r() - 0.5) * 0.3 }));
  }, []);
  const pVoid = at([0, 57, -24]);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} night={1} ao={0} fog={0.7} sun={[-300, 160, 80]}>
        <Tomb prof={GREAT} built={1} cut />
        <Chambers o={0.8} voidK={voidK} />
        <Detector p={[-1.2, QUEENS[1] - 3, QUEENS[2]]} on={0.6 + 0.4 * Math.sin(t * 5)} />
        {muons.map((m, i) => {
          const y = 420 - ((f * m.sp + m.ph) % 560);
          return (
            <mesh key={i} position={[m.x + y * m.tilt * 0.2, y, m.z]} rotation={[0, 0, m.tilt]}>
              <cylinderGeometry args={[0.35, 0.35, 26, 5]} />
              <meshBasicMaterial color="#7af0ff" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          );
        })}
        <Glow position={KINGS} size={14} color="#ffb85a" opacity={0.5} />
      </GizaCanvas>
      {f >= c.scan + 10 && f < c.found ? <Tag x={110} y={420} text="COSMIC-RAY MUONS" color="#7af0ff" side="right" o={fadeIn(f, c.scan + 10)} /> : null}
      {f >= c.found + 8 && pVoid ? <Tag x={pVoid.x} y={pVoid.y - 70} text="HIDDEN SPACE · ≥ 30 M · 98 FT" color="#7af0ff" side="left" size={34} o={fadeIn(f, c.found + 8)} /> : null}
      {f >= c.nobodyIn ? <Stamp f={f} at={c.nobodyIn} text="NOBODY'S BEEN INSIDE" top={1320} color="#7af0ff" size={70} rot={-4} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── THE BACKROOMS (inside the void) ─────────────────────────
const wallTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c2 = document.createElement("canvas");
    c2.width = c2.height = 256;
    const g = c2.getContext("2d")!;
    g.fillStyle = "#c9b45a";
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(120,100,40,0.35)";
    g.lineWidth = 3;
    for (let x = 0; x < 256; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 256);
      g.stroke();
    }
    const r = seeded(2);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = `rgba(90,70,20,${r() * 0.08})`;
      g.fillRect(r() * 256, r() * 256, 3, 3);
    }
    t = new THREE.CanvasTexture(c2);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 1);
    return t;
  };
})();
const carpetTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c2 = document.createElement("canvas");
    c2.width = c2.height = 256;
    const g = c2.getContext("2d")!;
    g.fillStyle = "#9a8642";
    g.fillRect(0, 0, 256, 256);
    const r = seeded(6);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(60,50,20,0.15)" : "rgba(200,180,100,0.12)";
      g.fillRect(r() * 256, r() * 256, 2, 2);
    }
    for (let i = 0; i < 6; i++) {
      g.fillStyle = "rgba(70,55,20,0.18)";
      g.beginPath();
      g.ellipse(r() * 256, r() * 256, 20 + r() * 30, 10 + r() * 20, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    t = new THREE.CanvasTexture(c2);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 30);
    return t;
  };
})();
/** A white polar bear standing far down the corridor ("Remember November 2026"). */
const PolarBear: React.FC<{ p: V3 }> = ({ p }) => {
  const m = <meshStandardMaterial color="#f4f2ea" roughness={0.9} />;
  return (
    <group position={p}>
      <mesh position={[0, 1.2, 0]} scale={[0.55, 0.85, 0.45]}>
        <sphereGeometry args={[1, 18, 14]} />
        {m}
      </mesh>
      <mesh position={[0, 2.25, 0.08]} scale={[0.32, 0.3, 0.32]}>
        <sphereGeometry args={[1, 16, 12]} />
        {m}
      </mesh>
      <mesh position={[0, 2.18, 0.36]} scale={[0.14, 0.12, 0.18]}>
        <sphereGeometry args={[1, 12, 10]} />
        {m}
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[0.2 * k, 2.5, 0.02]} scale={0.08}>
          <sphereGeometry args={[1, 10, 8]} />
          {m}
        </mesh>
      ))}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[0.22 * k, 0.35, 0]} scale={[0.16, 0.4, 0.18]}>
          <sphereGeometry args={[1, 12, 10]} />
          {m}
        </mesh>
      ))}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[0.5 * k, 1.35, 0.1]} rotation={[0, 0, k * 0.25]} scale={[0.13, 0.42, 0.13]}>
          <sphereGeometry args={[1, 12, 10]} />
          {m}
        </mesh>
      ))}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[0.1 * k, 2.28, 0.31]} scale={0.022}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      ))}
    </group>
  );
};
const posterTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c2 = document.createElement("canvas");
    c2.width = 256;
    c2.height = 340;
    const g = c2.getContext("2d")!;
    g.fillStyle = "#f2eedc";
    g.fillRect(0, 0, 256, 340);
    g.fillStyle = "#1a1a1a";
    g.font = "900 44px Arial Black, Arial";
    g.textAlign = "center";
    g.fillText("REMEMBER", 128, 120);
    g.fillText("NOVEMBER", 128, 180);
    g.font = "900 64px Arial Black, Arial";
    g.fillText("2026", 128, 260);
    t = new THREE.CanvasTexture(c2);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();
export const SetBackrooms: React.FC<SetProps> = ({ f }) => {
  const { width, height } = useVideoConfig();
  const k = ramp(f, c.backrooms - 6, c.aliens, (x) => x);
  const cam: Cam = { pos: [0.15, 1.6, -0.6 - 5 * k], look: [0.05, 1.55, -20], fov: 50, roll: Math.sin(f * 0.05) * 0.006 };
  const wall = wallTex();
  const walls: { p: V3; s: V3 }[] = [];
  // a long corridor (x = ±2) with side openings, cross walls and pillars further on
  for (let i = 0; i < 9; i++) {
    const z = -i * 5;
    if (i % 3 !== 1) walls.push({ p: [-2.1, 1.5, z - 2.5], s: [0.2, 3, 5] });
    if (i % 4 !== 2) walls.push({ p: [2.1, 1.5, z - 2.5], s: [0.2, 3, 5] });
    if (i > 2 && i % 2) walls.push({ p: [-4.5, 1.5, z - 1], s: [4.6, 3, 0.2] });
  }
  return (
    <AbsoluteFill style={{ background: "#2a2410" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 50, near: 0.05, far: 200 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
        <CameraRig cam={cam} />
        <fog attach="fog" args={["#cbbd78", 6, 42]} />
        <ambientLight intensity={0.9} color="#fff4c0" />
        {Array.from({ length: 9 }, (_, i) => (
          <pointLight key={i} position={[0, 2.85, -i * 5 - 1]} intensity={6} distance={9} color="#fff8d8" />
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
          <planeGeometry args={[20, 60]} />
          <meshStandardMaterial map={carpetTex()} roughness={1} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, -20]}>
          <planeGeometry args={[20, 60]} />
          <meshStandardMaterial color="#d9d2a8" roughness={0.9} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[0, 2.99, -i * 5 - 1]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 0.6]} />
            <meshBasicMaterial color={i === 4 && Math.floor(f / 7) % 5 === 0 ? "#a8a070" : "#fffbe8"} />
          </mesh>
        ))}
        {walls.map((w, i) => (
          <mesh key={i} position={w.p}>
            <boxGeometry args={w.s} />
            <meshStandardMaterial map={wall} roughness={0.95} />
          </mesh>
        ))}
        {/* the far wall, a poster and the bear in the doorway */}
        <mesh position={[0, 1.5, -45]}>
          <boxGeometry args={[4.2, 3, 0.2]} />
          <meshStandardMaterial map={wall} roughness={0.95} />
        </mesh>
        <mesh position={[1.99, 1.7, -8]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.55, 0.73]} />
          <meshStandardMaterial map={posterTex()} roughness={0.9} />
        </mesh>
        <PolarBear p={[-0.4, 0, -31]} />
        <Post bloom={0.8} ao={0} vignette={0.6} />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(20,16,0,0.45) 100%)" }} />
    </AbsoluteFill>
  );
};

// ───────────────────────── ALIENS: busy at Area 51 ─────────────────────────
export const SetAliens: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const sign = f >= c.a51 - 2;
  const cam: Cam = sign
    ? { pos: keys3(f, [[c.a51 - 2, [-1.5, 1.5, 331]], [c.tallest, [-2.0, 1.6, 333.5]]]), look: [-4.6, 3.4, 318], fov: 42 }
    : { pos: keys3(f, [[c.aliens, [-420, 70, 520]], [c.a51, [-440, 80, 540]]]), look: [0, 130, 0], fov: 40 };
  const arrive = ramp(f, c.aliens - 10, c.aliens + 22, easeOut);
  const leave = ramp(f, c.busy + 6, c.a51 + 30, (x) => x * x);
  const ufo: V3 = [-9000 * leave, 900 - 700 * arrive + 1200 * leave, -1200 * leave];
  const beam = (1 - leave) * fadeIn(f, c.aliens + 16, 10);
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} dusk={0.55} shadow={sign ? 12 : 260}>
        <Tomb prof={GREAT} built={1} casing={1} />
        <Saucer p={ufo} t={t} s={2.6} beam={beam} tilt={0.35 * leave} />
        {leave > 0.05 ? <Glow position={ufo} size={60} color="#7dff8a" opacity={0.8} fog={false} /> : null}
        <SignPost p={[-4.6, 0, 320]} ry={0.25} left lines={["AREA 51", "11,800 KM · 7,300 MI"]} />
      </GizaCanvas>
    </AbsoluteFill>
  );
};

// ───────────────────────── FINALE: your friend dances in the mask, the black cat claps ─────────────────────────
const FIN_Z = 128;
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [2.3, 1.7, FIN_Z + 5.8]],
      [c.callIt, [3.6, 2.4, FIN_Z + 8.5]],
      [c.great + 40, [70, 50, FIN_Z + 250]],
    ]),
    look: keys3(f, [
      [c.congrats, [0.45, 1.3, FIN_Z]],
      [c.callIt, [0.5, 1.7, FIN_Z]],
      [c.great + 40, [0, 62, 0]],
    ]),
    fov: 40,
  };
  return (
    <AbsoluteFill>
      <GizaCanvas cam={cam} t={t} dusk={0.6} shadow={f < c.great ? 16 : 260} sun={[-260, 120, 200]}>
        <Tomb prof={GREAT} built={1} casing={1} />
        <StoneBlock p={[0, 0, FIN_Z]} s={[1.6, 0.6, 1.2]} />
        <Model file="man_b.glb" anims={LIB1} clip="Dance_Loop" t={t} p={[0, 0.6, FIN_Z]} ry={0.25} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} attach={{ bone: "Head", node: <FursuitHead s={MASK_S} t={t} p={[0, -0.2, 0.03]} /> }} />
        <Model file="man_a.glb" anims={LIB2} clip="Yes" t={t} p={[-1.7, 0, FIN_Z + 0.9]} ry={0.6} outfit={YOU} tint={{ Hair: "#3b2a1e" }} />
        <StoneBlock p={[1.2, 0, FIN_Z + 0.7]} s={[0.75, 0.75, 0.7]} ry={-0.2} />
        <BlackCat p={[1.2, 0.75, FIN_Z + 0.75]} ry={-0.45} s={1.5} clap={fadeIn(f, c.congrats + 6)} t={t} />
      </GizaCanvas>
      {f >= c.great ? <Big x={540} y={330} text={"THE GREAT\nPYRAMID"} o={fadeIn(f, c.great)} size={104} color="#ffd23f" /> : null}
      {f >= c.great + 10 ? <Big x={540} y={500} text="146.6 M · 481 FT" o={fadeIn(f, c.great + 10)} size={52} color="#ffffff" /> : null}
    </AbsoluteFill>
  );
};
