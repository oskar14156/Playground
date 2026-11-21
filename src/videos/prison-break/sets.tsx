import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, project, V3 } from "../../lib/three/core";
import { Model } from "../../lib/three/gltf";
import { RB, Sofa, Lamp, Rug, Plant, tex } from "../../lib/three/diorama";
import { FursuitHead } from "../../lib/three/Mascots";
import { easeInOut, easeOut, keys3, ramp, seeded } from "../../lib/timing";
import { c } from "./cues";
import { AMBER, BLUE, Pin, Stamp, TimeBars, TitleCard } from "./inserts";
import { ARTIST, COAT, GUARD, GuardCap, INMATE, INMATE2, LIB1, LIB2, Michael, ROBE, SUIT, TattooMan, Torch, follow } from "./people";
import { AllenKey, BankLobby, CaseBoard, ChemBottle, Courtroom, Infirmary, IntakeRoom, MeatBlock, PillBottle, ShadowBoard, TattooStudio, TvSet, WallPhone } from "./props";
import { Spot } from "./spot";
import { blockWall, Campus, CellHouse, HeroCell, PipeChase, PrisonCanvas } from "./world";

export type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const useAt = (cam: Cam) => (p: V3) => project(p, cam, 1080, 1920) ?? { x: -999, y: -999 };

/** Pistol in the right hand (hand_r bone space). */
const Pistol: React.FC = () => (
  <group position={[0.02, 0.06, 0.08]} rotation={[0, 0, Math.PI / 2]}>
    <RB p={[0, 0, 0.05]} s={[0.03, 0.04, 0.17]} r={0.006} color="#1a1a1c" metal={0.7} rough={0.4} />
    <RB p={[0, -0.05, -0.01]} s={[0.028, 0.09, 0.035]} r={0.006} color="#1a1a1c" metal={0.5} rough={0.5} rot={[0.25, 0, 0]} />
  </group>
);

/** A plain room shell (block walls, ceiling) for small interiors. */
const Room: React.FC<{ w: number; d: number; h?: number; color?: [string, string]; floor?: string }> = ({ w, d, h = 2.8, color = ["#c9c3a8", "#5d7062"], floor = "#8a8478" }) => {
  const wall = useMemo(() => blockWall(color[0], color[1], 31, [w / 2, h / 2.8]), [w, h, color]);
  const side = useMemo(() => blockWall(color[0], color[1], 32, [d / 2, h / 2.8]), [d, h, color]);
  const fl = useMemo(() => tex("tiles", floor, [w, d], 4), [w, d, floor]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial map={fl} roughness={0.6} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={wall} roughness={0.85} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[(k * w) / 2, h / 2, 0]} rotation={[0, (-k * Math.PI) / 2, 0]} receiveShadow>
          <planeGeometry args={[d, h]} />
          <meshStandardMaterial map={side} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#d8d4c4" roughness={0.95} />
      </mesh>
    </group>
  );
};

// ───────────────────────── HOOK · Fox River from above ─────────────────────────
export const HookScene: React.FC<{ f: number; cam?: Cam }> = ({ f, cam: camIn }) => {
  const cam: Cam = camIn ?? {
    pos: keys3(f, [
      [0, [-104, 108, 146]],
      [120, [-84, 86, 120]],
    ], easeOut),
    look: keys3(f, [
      [0, [4, 16, 0]],
      [120, [6, 12, 2]],
    ]),
    fov: 46,
  };
  return (
    <PrisonCanvas cam={cam} mood="night" fog={["#06070b", 260, 640]} ao={0.6} bloom={1.0}>
      <Campus route={ramp(f, 12, 84, easeInOut)} scan={f < 50 ? -1 : ramp(f, 50, 100, easeInOut)} />
    </PrisonCanvas>
  );
};

export const SetHook: React.FC<SetProps> = ({ f }) => (
  <AbsoluteFill>
    <HookScene f={f} />
    <TitleCard f={f} out={c.michael} />
  </AbsoluteFill>
);

// ───────────────────────── Michael arrives (cell house) ─────────────────────────
export const SetArrive: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.michael) / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.michael, [0.2, 1.75, 7.0]],
      [c.wears, [0.4, 1.7, 6.6]],
    ]),
    look: keys3(f, [
      [c.michael, [3.4, 1.2, 3.0]],
      [c.wears, [1.8, 1.2, 2.9]],
    ]),
    fov: 46,
  };
  const at = useAt(cam);
  const m = follow([[4.2, 3.0], [1.0, 3.0], [0.3, 2.1]], t, 1.2);
  const g = follow([[5.6, 3.2], [2.2, 3.2], [1.4, 3.1]], t, 1.2);
  const mp = at([m.x, 2.0, m.z]);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="cellhouse" fog={["#0a0b10", 18, 46]}>
        <CellHouse />
        <HeroCell t={t} />
        <Michael anims={LIB1} clip={m.done ? "Idle_Loop" : "Walk_Loop"} t={t * 1.05} p={[m.x, 0, m.z]} ry={m.ry} />
        <Model file="man_d.glb" anims={LIB1} clip={g.done ? "Idle_Loop" : "Walk_Loop"} t={t * 1.05 + 0.3} p={[g.x, 0, g.z]} ry={g.ry} outfit={GUARD} tint={{ Hair: "#1a1410" }} attach={{ bone: "Head", node: <GuardCap /> }} />
        {/* inmates at the railings above */}
        {(
          [
            ["man_b.glb", [-3.4, 2.8, 2.55], INMATE2],
            ["man_c.glb", [3.6, 5.6, 2.55], INMATE],
            ["man_d.glb", [-6.6, 5.6, 2.55], INMATE2],
            ["man_b.glb", [-1.2, 8.4, 2.55], INMATE],
          ] as [string, V3, typeof INMATE][]
        ).map(([file, p, o], i) => (
          <Model key={i} file={file} anims={LIB2} clip="Idle_Rail_Loop" t={t + i * 0.7} p={p} ry={0} outfit={o} tint={{ Hair: ["#2a1a10", "#1a1a1a", "#5a3a22", "#111"][i] }} />
        ))}
      </PrisonCanvas>
      <Pin x={mp.x} y={Math.max(330, mp.y - 60)} o={fadeIn(f, c.michael + 12)} text="MICHAEL SCOFIELD" sub="STRUCTURAL ENGINEER" color={AMBER} side="left" />
    </AbsoluteFill>
  );
};

// ───────────────────────── the tattoo ─────────────────────────
export const SetTattoo: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.wears) / 30;
  const cam: Cam = { pos: keys3(f, [[c.wears, [0, 1.35, 2.4]], [c.tattooBig, [0.1, 1.3, 1.75]]]), look: [0, 1.22, 0], fov: 38 };
  const at = useAt(cam);
  const ry = -0.5 + t * 0.55;
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="dark" bg="#05070c" ao={0.8} bloom={1.1}>
        <hemisphereLight args={["#3a4a6a", "#0a0a0a", 0.35]} />
        <directionalLight position={[-2, 2.5, 2]} intensity={1.6} color="#ffe0c0" />
        <pointLight position={[1.4, 1.8, -1.2]} intensity={14} distance={5} decay={2} color={BLUE} />
        <pointLight position={[-1.4, 1.2, -1.0]} intensity={10} distance={5} decay={2} color={AMBER} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[3, 48]} />
          <meshStandardMaterial color="#0c0e12" roughness={0.6} />
        </mesh>
        <TattooMan clip="Idle_Loop" t={t} ry={ry} glow={0.35 + 0.5 * ramp(f, c.wears + 20, c.wears + 50)} />
      </PrisonCanvas>
      <Pin {...at([0.18, 1.32, 0.12])} o={fadeIn(f, c.wears + 14)} text="THE BLUEPRINTS" sub="ON HIS SKIN" color={AMBER} side="right" />
    </AbsoluteFill>
  );
};

// ───────────────────────── tattoo studio: dozens of hours ─────────────────────────
export const SetStudio: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.tattooBig) / 30;
  const cam: Cam = { pos: keys3(f, [[c.tattooBig, [-1.7, 1.5, 1.9]], [c.day1, [-1.3, 1.4, 1.5]]]), look: [0.2, 0.9, -0.4], fov: 42 };
  const at = useAt(cam);
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL"];
  const mi = Math.min(months.length - 1, Math.floor(Math.max(0, f - c.tattooBig - 10) / 12));
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="warm" ao={1.0} env={0.1}>
        <TattooStudio buzz={t} />
        <TattooMan clip="Sitting_Idle_Loop" t={t} p={[0, 0.07, -0.25]} ry={0} glow={0} />
        <Model file="man_d.glb" anims={LIB1} clip="Interact" t={(t % 1.5) + 0.4} p={[0.8, 0, -0.35]} ry={-Math.PI / 2} outfit={ARTIST} tint={{ Hair: "#111" }} />
      </PrisonCanvas>
      <div style={{ position: "absolute", top: 1240, width: "100%", display: "flex", justifyContent: "center", opacity: fadeIn(f, c.tattooBig + 6) }}>
        <div style={{ display: "flex", gap: 10 }}>
          {months.map((m, i) => (
            <div key={m} style={{ width: 118, padding: "10px 0", borderRadius: 12, textAlign: "center", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 700, fontSize: 40, background: i <= mi ? BLUE : "rgba(255,255,255,0.12)", color: i <= mi ? "#081018" : "#aaa" }}>{m}</div>
          ))}
        </div>
      </div>
      <Pin {...at([0.4, 1.2, -0.3])} o={fadeIn(f, c.tattooBig + 10)} text="DOZENS OF HOURS" color={BLUE} side="right" />
      <Pin {...at([-0.3, 0.9, -0.2])} o={fadeIn(f, c.heal)} text="MUST HEAL FIRST" sub="BEFORE HE GOES IN" color={BLUE} side="left" />
    </AbsoluteFill>
  );
};

// ───────────────────────── intake photo ─────────────────────────
export const SetIntake: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.day1) / 30;
  const cam: Cam = { pos: keys3(f, [[c.day1, [0.35, 1.45, 2.3]], [c.remember1, [0.15, 1.35, 1.5]]]), look: [0, 1.15, -1.2], fov: 44 };
  const at = useAt(cam);
  const flash = Math.max(1 - ramp(f, c.day1 + 18, c.day1 + 24), 0) * (f >= c.day1 + 18 ? 1 : 0) + Math.max(0, 1 - ramp(f, c.finger, c.finger + 6)) * (f >= c.finger ? 1 : 0);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="room" ao={0.9}>
        <IntakeRoom flash={flash} />
        <TattooMan clip="Idle_Loop" t={t} p={[0, 0, -1.0]} ry={0} />
        <Model file="man_c.glb" anims={LIB1} clip="Idle_Loop" t={t} p={[-1.3, 0, 0.6]} ry={0.9} outfit={GUARD} tint={{ Hair: "#3a2a1a" }} attach={{ bone: "Head", node: <GuardCap /> }} />
      </PrisonCanvas>
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.75 }} />
      <Pin {...at([0.25, 1.3, -0.95])} o={fadeIn(f, c.day1 + 20)} text="EVERY TATTOO" sub="PHOTOGRAPHED ON DAY 1" color={BLUE} side="right" />
      <Pin {...at([-0.25, 1.75, -1.4])} o={fadeIn(f, c.finger)} text="ID, LIKE A FINGERPRINT" color={BLUE} side="left" size={36} />
    </AbsoluteFill>
  );
};

// ───────────────────────── bank + court ─────────────────────────
export const SetBank: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.robs) / 30;
  const cam: Cam = { pos: keys3(f, [[c.robs, [3.4, 1.7, 2.8]], [c.judge, [3.0, 1.6, 2.4]]]), look: [-0.6, 1.3, -0.9], fov: 48 };
  const shot = f >= c.robs + 14 && f < c.robs + 18 ? 1 : 0;
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="warm" ao={1.0}>
        <BankLobby />
        <Model file="man_a.glb" anims={LIB1} clip="Pistol_Aim_Up" t={t * 0.4} p={[0.3, 0, 0.1]} ry={-0.6} outfit={{ top: "#2a2e36", pants: "#22252b", shoes: "#141414", sleeves: 1 }} tint={{ Hair: "#2a2018" }} attach={{ bone: "hand_r", node: <Pistol /> }} />
        <Model file="woman_a.glb" anims={LIB1} clip="Crouch_Idle_Loop" t={t} p={[-1.8, 0, -2.0]} ry={0.2} outfit={{ top: "#e8e2d4", pants: "#2a2a3a", shoes: "#1a1a1a", sleeves: 1 }} tint={{ Hair: "#6a3a1a" }} />
        <Model file="woman_b.glb" anims={LIB1} clip="Crouch_Idle_Loop" t={t + 0.6} p={[0.2, 0, -2.0]} ry={-0.3} outfit={{ top: "#5a7a9a", pants: "#2a2a3a", shoes: "#1a1a1a", sleeves: 1 }} tint={{ Hair: "#1a1a1a" }} />
        <Model file="man_c.glb" anims={LIB1} clip="Crouch_Idle_Loop" t={t + 0.3} p={[-2.6, 0, 1.4]} ry={1.2} outfit={{ top: "#8a5a3a", pants: "#3a3a3a", shoes: "#2a2a2a" }} tint={{ Hair: "#888" }} />
        {shot ? <Glow position={[0.1, 3.9, -0.4]} size={1.2} color="#fff4d0" /> : null}
        {shot ? <pointLight position={[0.2, 3.3, -0.2]} intensity={20} distance={6} decay={2} color="#ffe2a0" /> : null}
      </PrisonCanvas>
      <Stamp f={f} at={c.robs + 14} text="BANG!" color={AMBER} top={300} size={110} rot={-8} until={c.robs + 40} />
    </AbsoluteFill>
  );
};

export const SetCourt: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.judge) / 30;
  const cam: Cam = { pos: keys3(f, [[c.judge, [2.6, 2.1, 3.0]], [c.federal, [2.2, 2.0, 2.5]]]), look: [-0.4, 1.3, -1.4], fov: 48 };
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="warm" ao={1.0}>
        <Courtroom />
        <RB p={[0, 0.55, -2.35]} s={[0.6, 0.5, 0.55]} r={0.03} color="#2a1a10" rough={0.6} />
        <Model file="man_c.glb" anims={LIB1} clip="Sitting_Talking_Loop" t={t} p={[0, 0.3, -2.3]} ry={0} outfit={ROBE} tint={{ Hair: "#d8d8d8" }} />
        <Michael anims={LIB1} clip="Idle_Loop" t={t} p={[-1.1, 0, 1.7]} ry={Math.PI - 0.15} outfit={{ top: "#2a2e36", pants: "#22252b", shoes: "#141414", sleeves: 1 }} />
        <Model file="man_b.glb" anims={LIB1} clip="Idle_Loop" t={t + 0.8} p={[1.5, 0, -0.1]} ry={-1.2} outfit={GUARD} tint={{ Hair: "#2a1a10" }} attach={{ bone: "Head", node: <GuardCap /> }} />
      </PrisonCanvas>
      <Pin x={540} y={1340} o={fadeIn(f, c.judge + 8)} text="“THE PRISON NEAREST HOME”" color={AMBER} size={42} side="center" />
    </AbsoluteFill>
  );
};

// ───────────────────────── the toilet ─────────────────────────
export const SetToilet: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.toGet) / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.toGet, [-0.25, 1.55, 1.25]],
      [c.allen, [-0.45, 1.05, -0.35]],
      [c.real1, [-0.4, 0.95, -0.7]],
    ]),
    look: keys3(f, [
      [c.toGet, [0.4, 0.6, -1.2]],
      [c.allen, [0.45, 0.6, -1.35]],
      [c.real1, [0.45, 0.55, -1.45]],
    ]),
    fov: 44,
  };
  const at = useAt(cam);
  const screws = 1 - ramp(f, c.toilet + 6, c.toilet + 30);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="cellhouse" fog={["#0a0b10", 14, 40]}>
        <CellHouse />
        <HeroCell t={t} screws={screws} />
        <Michael anims={LIB1} clip="Fixing_Kneeling" t={t} p={[0.42, 0, -0.65]} ry={Math.PI} attach={{ bone: "hand_r", node: <AllenKey p={[0, 0.07, 0.02]} rot={[0, 0, 1.4]} s={1.4} glow={0.6} /> }} />
      </PrisonCanvas>
      <Pin {...at([0.15, 0.75, -1.2])} o={fadeIn(f, c.allen + 4)} text="HOMEMADE ALLEN KEY" color={AMBER} side="left" />
      <Pin {...at([0.72, 0.75, -1.43])} o={fadeIn(f, c.toilet)} text="4 TAMPER SCREWS" color={AMBER} side="right" size={36} />
    </AbsoluteFill>
  );
};

// ───────────────────────── tool control ─────────────────────────
export const SetTools: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.real1) / 30;
  const cam: Cam = { pos: keys3(f, [[c.real1, [1.3, 1.6, 1.9]], [c.behind, [0.6, 1.45, 1.2]]]), look: [0, 1.3, -1.4], fov: 44 };
  const at = useAt(cam);
  const flash = f >= c.counted ? 0.5 + 0.5 * Math.sin((f - c.counted) * 0.5) : 0;
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="room" ao={1.0}>
        <Room w={5} d={4} color={["#c8c4b4", "#4a5a4a"]} />
        <group position={[0, 0, 0.5]}>
          <ShadowBoard p={[0, 1.5, -2.46]} missing={6} flash={flash} door={1} />
          {/* workbench under it */}
          <RB p={[0, 0.88, -2.1]} s={[2.4, 0.06, 0.7]} r={0.01} color="#7a6a4a" rough={0.6} />
          {[-1.1, 1.1].map((x) => (
            <RB key={x} p={[x, 0.43, -2.1]} s={[0.06, 0.86, 0.6]} r={0.01} color="#4a5258" metal={0.6} />
          ))}
          <RB p={[0.8, 0.98, -2.1]} s={[0.35, 0.14, 0.25]} r={0.02} color="#c0202a" metal={0.4} rough={0.5} />
        </group>
        <Model file="man_b.glb" anims={LIB2} clip="Idle_FoldArms_Loop" t={t} p={[-0.9, 0, -0.6]} ry={0.35} outfit={GUARD} tint={{ Hair: "#2a1a10" }} attach={{ bone: "Head", node: <GuardCap /> }} />
      </PrisonCanvas>
      <Pin {...at([-0.6, 2.05, -1.95])} o={fadeIn(f, c.real1 + 10)} text="SHADOW BOARD" color={BLUE} side="left" />
      <Pin {...at([0.05, 1.05, -1.95])} o={fadeIn(f, c.counted)} text="1 MISSING → LOCKDOWN" sub="COUNTED EVERY TIME" color="#ff3b30" side="right" size={38} />
    </AbsoluteFill>
  );
};

// ───────────────────────── through the hole into the pipe chase ─────────────────────────
export const SetChase: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.behind) / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.behind, [0.45, 1.0, 0.7]],
      [c.behind + 30, [0.45, 0.5, -1.0]],
      [c.corridor, [0.45, 0.55, -1.75]],
      [c.y2015, [0.3, 1.1, -2.45]],
    ]),
    look: keys3(f, [
      [c.behind, [0.45, 0.45, -1.6]],
      [c.behind + 30, [0.45, 0.48, -2.6]],
      [c.corridor, [-1.5, 0.6, -2.6]],
      [c.y2015, [-7, 0.8, -2.6]],
    ]),
    fov: 50,
  };
  const at = useAt(cam);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="chase" fog={["#07080b", 6, 22]} ao={0.8} bloom={1.0}>
        <CellHouse />
        <HeroCell t={t} off={1} screws={0} />
        <PipeChase route={ramp(f, c.corridor, c.corridor + 20)} />
      </PrisonCanvas>
      <Pin {...at([-2.2, 1.7, -2.6])} o={fadeIn(f, c.corridor)} text="PIPE CHASE" sub="BEHIND EVERY CELL" color={AMBER} side="left" />
      <Stamp f={f} at={c.thisReal + 6} text="REAL" color={BLUE} top={1300} />
    </AbsoluteFill>
  );
};

// ───────────────────────── Clinton 2015: crawling along the pipes ─────────────────────────
export const SetClinton: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.y2015) / 30;
  const cam: Cam = { pos: keys3(f, [[c.y2015, [-5.6, 1.0, -2.15]], [c.manhole, [-5.0, 0.9, -2.2]]]), look: [-1.5, 0.45, -2.6], fov: 50 };
  const at = useAt(cam);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="chase" fog={["#07080b", 5, 20]} ao={0.8} bloom={1.0}>
        <CellHouse />
        <HeroCell off={1} screws={0} />
        <PipeChase cut={0.6} />
        {[0, 1].map((i) => (
          <Model key={i} file={i ? "man_c.glb" : "man_b.glb"} anims={LIB1} clip="Crouch_Fwd_Loop" t={t * 1.0 + i * 0.4} p={[-0.4 - 0.45 * t - i * 1.4, 0, -2.45]} ry={-Math.PI / 2} outfit={{ top: "#4a5a3a", pants: "#3a4a3a", shoes: "#2a2a2a" }} tint={{ Hair: i ? "#3a2a1a" : "#1a1a1a" }} />
        ))}
      </PrisonCanvas>
      <Pin x={540} y={330} o={fadeIn(f, c.y2015 + 4)} text="CLINTON · NEW YORK · 2015" sub="A REAL ESCAPE" color={BLUE} side="center" />
      <Pin {...at([-3, 0.7, -2.9])} o={fadeIn(f, c.crawled)} text="STEAM PIPE" color={BLUE} side="right" />
    </AbsoluteFill>
  );
};

// ───────────────────────── 4+ weeks with hacksaw blades in frozen meat ─────────────────────────
export const SetHacksaw: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.took) / 30;
  const cam: Cam = { pos: keys3(f, [[c.took, [-2.2, 1.55, -1.9]], [c.route, [-2.35, 1.45, -1.9]]]), look: [-3.1, 0.35, -2.7], fov: 50 };
  const at = useAt(cam);
  const saw = Math.sin(t * 9) * 0.12;
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="chase" fog={["#07080b", 4, 16]} ao={0.8} bloom={1.0}>
        <CellHouse />
        <HeroCell off={1} screws={0} />
        <PipeChase cut={0.4 + 0.6 * ramp(f, c.took, c.route)} />
        {/* the hacksaw working the steam pipe */}
        <group position={[-3 + saw, 0.69, -2.86]} rotation={[0, 0, 0.05]}>
          <RB p={[0, 0.06, 0]} s={[0.4, 0.015, 0.012]} r={0.004} color="#2f6a9a" metal={0.6} rough={0.4} />
          <RB p={[-0.19, 0.03, 0]} s={[0.015, 0.07, 0.012]} r={0.004} color="#2f6a9a" metal={0.6} rough={0.4} />
          <RB p={[0.19, 0.03, 0]} s={[0.015, 0.07, 0.012]} r={0.004} color="#2f6a9a" metal={0.6} rough={0.4} />
          <RB p={[0, 0, 0]} s={[0.38, 0.014, 0.003]} r={0.001} color="#d8dde0" metal={1} rough={0.2} />
          <RB p={[0.25, 0.06, 0]} s={[0.12, 0.04, 0.03]} r={0.01} color="#1a1a1a" rough={0.6} />
        </group>
        <MeatBlock p={[-3.3, 0.01, -2.35]} open={0} />
      </PrisonCanvas>
      <TimeBars f={f} at={c.took + 6} top={230} />
      <Pin {...at([-3.3, 0.1, -2.35])} o={fadeIn(f, c.meat)} text="BLADES IN FROZEN MEAT" color={BLUE} side="right" size={36} />
    </AbsoluteFill>
  );
};

// ───────────────────────── infirmary: fake diabetes ─────────────────────────
export const SetInfirmary: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.route) / 30;
  const cam: Cam = { pos: keys3(f, [[c.route, [1.4, 1.6, 2.2]], [c.pills, [1.0, 1.55, -0.7]], [c.pugReal, [0.95, 1.5, -0.95]]]), look: keys3(f, [[c.route, [-0.8, 1.0, -0.8]], [c.pills, [0.9, 1.25, -1.8]], [c.pugReal, [0.9, 1.25, -1.8]]]), fov: 44 };
  const at = useAt(cam);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="room" ao={1.0}>
        <Infirmary />
        <Michael anims={LIB1} clip="Sitting_Idle_Loop" t={t} p={[-1.2, 0.42, -0.35]} ry={Math.PI / 2} />
        <Model file="woman_a.glb" anims={LIB1} clip="Idle_Talking_Loop" t={t} p={[-0.35, 0, -0.1]} ry={-1.7} outfit={COAT} tint={{ Hair: "#8a3a1a" }} />
        <PillBottle p={[1.6, 0.76, 0.7]} label="PUGNAc" s={1.4} />
      </PrisonCanvas>
      <Pin {...at([-1.1, 1.5, -0.4])} o={fadeIn(f, c.diabetes)} text="FAKES TYPE 1 DIABETES" color={AMBER} side="right" size={36} />
      <Pin {...at([0.9, 1.45, -1.75])} o={fadeIn(f, c.pills + 4)} text="PUGNAc PILLS" color={AMBER} side="left" />
    </AbsoluteFill>
  );
};

// ───────────────────────── cute poison ─────────────────────────
export const SetPoison: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.mixes) / 30;
  const cam: Cam = { pos: keys3(f, [[c.mixes, [1.2, 0.95, 1.0]], [c.noProof, [1.0, 0.85, 0.8]], [c.crew, [0.9, 0.8, 0.7]]]), look: [0.1, 0.3, -0.35], fov: 40 };
  const at = useAt(cam);
  const pour = ramp(f, c.mixes + 10, c.mixes + 40);
  const fizz = f < c.noProof ? ramp(f, c.iron, c.iron + 20) : 1 - ramp(f, c.noProof, c.noProof + 20);
  const conc = useMemo(() => tex("plaster", "#5a5650", [3, 2], 8), []);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="chase" fog={["#07080b", 3, 12]} ao={1.0} bloom={1.1}>
        {/* crawl space under the infirmary floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[6, 4]} />
          <meshStandardMaterial map={conc} roughness={1} />
        </mesh>
        <mesh position={[0, 0.6, -1.2]}>
          <planeGeometry args={[6, 1.2]} />
          <meshStandardMaterial map={conc} color="#8a8478" roughness={1} />
        </mesh>
        <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 4]} />
          <meshStandardMaterial color="#3a3630" roughness={1} />
        </mesh>
        {[-1.2, 0, 1.2].map((x) => (
          <RB key={x} p={[x, 1.1, 0]} s={[0.2, 0.2, 4]} r={0.01} color="#4a4038" rough={0.9} />
        ))}
        {/* the iron pipe */}
        <mesh position={[0, 0.45, -0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 6, 28]} />
          <meshStandardMaterial color="#5a4a3a" metalness={0.7} roughness={0.6} />
        </mesh>
        {/* the "poison" on the pipe: blue-green wet patch that fizzes, then nothing happens */}
        <mesh position={[0.05, 0.47, -0.6]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.093, 0.093, 0.3, 28, 1, true, -1.8, 2.2]} />
          <meshStandardMaterial color="#3ab8a0" emissive="#2aa890" emissiveIntensity={0.6 * fizz} transparent opacity={0.3 + 0.5 * pour} roughness={0.15} />
        </mesh>
        {Array.from({ length: 14 }, (_, k) => {
          const r = seeded(k + 3);
          const ph = (t * 1.6 + r()) % 1;
          return (
            <mesh key={k} position={[0.05 + (r() - 0.5) * 0.25, 0.56 + ph * 0.12, -0.6 + (r() - 0.5) * 0.1]}>
              <sphereGeometry args={[0.008 + 0.006 * r(), 8, 6]} />
              <meshStandardMaterial color="#cffff0" transparent opacity={(1 - ph) * fizz} />
            </mesh>
          );
        })}
        <ChemBottle p={[-0.45, 0, -0.2]} label="CuSO₄" sub="COPPER SULFATE" liquid="#2a6ae0" band="#1a4aa0" />
        <group position={[0.25, 0.3 + 0.25 * pour, -0.35]} rotation={[0, 0, 1.9 * pour]}>
          <ChemBottle p={[0, -0.12, 0]} label="H₃PO₄" sub="PHOSPHORIC ACID" liquid="#e8f0f0" level={0.6 - 0.3 * pour} band="#a02a2a" />
        </group>
        {pour > 0.4 && pour < 0.999 ? (
          <mesh position={[0.07, 0.56, -0.5]}>
            <cylinderGeometry args={[0.006, 0.01, 0.16, 8]} />
            <meshStandardMaterial color="#e8f6f6" transparent opacity={0.7} />
          </mesh>
        ) : null}
        {f >= c.rust ? <ChemBottle p={[0.75, 0, 0.05]} label="RUST OFF" sub="PHOSPHORIC ACID" liquid="#f0e8c8" band="#c9a227" h={0.3} /> : null}
        <pointLight position={[0.6, 1.0, 0.5]} color="#ffd9a0" intensity={7} distance={5} decay={2} />
        <pointLight position={[-0.8, 0.8, 0.3]} color="#9ab8ff" intensity={3} distance={4} decay={2} />
        <Glow position={[0.05, 0.5, -0.5]} size={0.6} color="#3affd0" opacity={0.5 * fizz} />
      </PrisonCanvas>
      <Pin {...at([0.05, 0.6, -0.6])} o={fadeIn(f, c.cute)} text="“CUTE POISON”" sub="CuSO₄ + H₃PO₄" color={AMBER} side="left" />
      <Stamp f={f} at={c.noProof + 4} text="NO EVIDENCE" sub="IT EATS THROUGH IRON" color={BLUE} top={1260} size={100} />
      <Pin {...at([0.75, 0.25, 0.05])} o={fadeIn(f, c.rust)} text="SOLD AS RUST REMOVER" color={BLUE} side="right" size={36} />
    </AbsoluteFill>
  );
};

// ───────────────────────── D.B. Cooper ─────────────────────────
export const SetCrew: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.crew) / 30;
  const cam: Cam = { pos: keys3(f, [[c.crew, [0.5, 1.5, 3.3]], [c.night, [0.3, 1.35, 2.4]]]), look: [-0.4, 0.8, -0.3], fov: 44 };
  const at = useAt(cam);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="cellhouse" fog={["#0a0b10", 14, 40]}>
        <CellHouse />
        <HeroCell t={t} shelf={false} />
        <Model file="man_c.glb" anims={LIB1} clip="Sitting_Idle_Loop" t={t} p={[-0.25, 0.08, 0.1]} ry={Math.PI / 2} outfit={INMATE} tint={{ Hair: "#d8d8d8" }} />
        {/* the 1971 ransom bag under the bunk */}
        <group position={[-0.35, 0, -0.9]}>
          <mesh position={[0, 0.16, 0]} scale={[1, 0.9, 0.8]}>
            <sphereGeometry args={[0.18, 20, 14]} />
            <meshStandardMaterial color="#c8b896" roughness={1} />
          </mesh>
          <mesh position={[0, 0.17, 0.145]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.16, 0.12]} />
            <meshStandardMaterial map={useMemo(() => tex("plaster", "#c8b896", [1, 1], 2), [])} />
          </mesh>
        </group>
      </PrisonCanvas>
      <Pin {...at([-0.25, 1.4, 0.1])} o={fadeIn(f, c.crew + 6)} text="WESTMORELAND" sub="THE OLD MAN" color={AMBER} side="right" />
      <Stamp f={f} at={c.cooper} text="D.B. COOPER?" sub="$200,000 · 1971 · NEVER FOUND" color={AMBER} top={1250} size={92} rot={-4} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 8 men in the pipe chase ─────────────────────────
export const SetEight: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.night) / 30;
  const cam: Cam = { pos: keys3(f, [[c.night, [3.4, 1.5, -2.2]], [c.count, [2.6, 1.4, -2.25]]]), look: [-6, 0.6, -2.6], fov: 46 };
  const files = ["man_a.glb", "man_b.glb", "man_c.glb", "man_d.glb"];
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="chase" fog={["#07080b", 4, 18]} ao={0.8} bloom={1.0}>
        <CellHouse />
        <HeroCell off={1} screws={0} light={0.2} />
        <PipeChase route={1} bulbs={0.8} />
        {Array.from({ length: 8 }, (_, i) => (
          <Model key={i} file={files[i % 4]} anims={LIB1} clip="Crouch_Fwd_Loop" t={t + i * 0.37} p={[-0.6 - i * 1.15 - 0.7 * t, 0, -2.5 + (i % 2) * 0.12]} ry={-Math.PI / 2} outfit={i % 2 ? INMATE : INMATE2} tint={{ Hair: ["#1a1a1a", "#3a2a1a", "#d8d8d8", "#5a3a22"][i % 4] }} />
        ))}
      </PrisonCanvas>
      <Pin x={540} y={330} o={fadeIn(f, c.eight)} text="8 MEN" sub="THE FOX RIVER EIGHT" color={AMBER} side="center" />
    </AbsoluteFill>
  );
};

// ───────────────────────── the night count ─────────────────────────
export const SetCount: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.count) / 30;
  const close = f >= c.bunk;
  const cam: Cam = close
    ? { pos: keys3(f, [[c.bunk, [0.8, 1.6, 2.6]], [c.phone, [0.5, 1.4, 1.9]]]), look: [-0.5, 0.6, -0.3], fov: 42 }
    : { pos: keys3(f, [[c.count, [5.5, 2.6, 9.5]], [c.handbook, [4.6, 2.4, 8.6]]]), look: [0.6, 1.2, 2.2], fov: 46 };
  const g = follow([[5, 2.25], [1.3, 2.25]], close ? 3.5 : t, 1.1);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="cellhouse" fog={["#05060a", 10, 34]} env={0.05}>
        <CellHouse lit={0.15} />
        <HeroCell light={0.05} body shelf />
        <Model file="man_d.glb" anims={LIB1} clip={g.done ? "Idle_Torch_Loop" : "Walk_Loop"} t={t} p={[g.x, 0, g.z]} ry={g.done ? -2.6 : g.ry} outfit={GUARD} tint={{ Hair: "#1a1410" }} attach={{ bone: "hand_r", node: <Torch /> }} />
        {/* torch beam into the cell once he stands at the bars */}
        {g.done ? (
          <>
            <Spot p={[1.1, 1.3, 2.0]} target={[-0.5, 0.6, -0.3]} angle={0.3} intensity={40} distance={8} color="#fff6dc" />
            <mesh position={[0.3, 0.95, 0.85]} rotation={[0, 0, 0]} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1.6, 0.7, 2.3).normalize())}>
              <coneGeometry args={[0.45, 2.8, 24, 1, true]} />
              <meshBasicMaterial color="#fff6dc" transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
            </mesh>
          </>
        ) : null}
      </PrisonCanvas>
      {close ? <Pin x={540} y={1330} o={fadeIn(f, c.bunk + 6)} text="EVERY MAN AT HIS BUNK" color={BLUE} side="center" size={40} /> : null}
      {!close ? <Pin x={540} y={330} o={fadeIn(f, c.count + 4)} text="LIGHTS OUT · COUNT" color={BLUE} side="center" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── recorded calls ─────────────────────────
export const SetPhone: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.phone) / 30;
  const cam: Cam = { pos: keys3(f, [[c.phone, [2.2, 1.7, 7.6]], [c.wall, [1.7, 1.6, 6.8]]]), look: [0.6, 1.4, 4.0], fov: 44 };
  const at = useAt(cam);
  const rec = Math.floor(f / 12) % 2;
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="cellhouse" fog={["#0a0b10", 14, 40]}>
        <CellHouse />
        <HeroCell t={t} />
        {/* phone on a pillar in the hall */}
        <RB p={[0.6, 1.4, 3.75]} s={[0.6, 2.8, 0.5]} r={0.02} color="#8a8676" rough={0.9} />
        <WallPhone p={[0.6, 0, 4.0]} lifted={1} />
        <Michael anims={LIB2} clip="Idle_TalkingPhone_Loop" t={t} p={[0.75, 0, 4.55]} ry={Math.PI - 0.4} />
      </PrisonCanvas>
      <Pin {...at([0.6, 1.95, 4.02])} o={fadeIn(f, c.phone + 6)} text={`${rec ? "●" : "○"} REC`} sub="EVERY CALL" color="#ff3b30" side="left" />
      <div style={{ position: "absolute", top: 1300, left: 140, width: 800, height: 120, display: "flex", alignItems: "center", gap: 6, opacity: fadeIn(f, c.recorded) }}>
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} style={{ width: 10, height: 20 + 80 * Math.abs(Math.sin(i * 0.7 + f * 0.4) * Math.sin(i * 0.23)), background: "#ff3b30", borderRadius: 4 }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── FBI: case file + board ─────────────────────────
const Office: React.FC<{ t: number }> = () => (
  <group>
    <Room w={5} d={4.4} color={["#b8b4a4", "#6a6458"]} floor="#5a5048" />
    <RB p={[0, 0.74, -0.4]} s={[1.6, 0.05, 0.8]} r={0.01} color="#4a3628" rough={0.5} />
    {[-0.75, 0.75].map((x) => (
      <RB key={x} p={[x, 0.37, -0.4]} s={[0.05, 0.72, 0.7]} r={0.01} color="#3a2a1e" />
    ))}
    <RB p={[0.25, 0.775, -0.35]} s={[0.36, 0.02, 0.26]} r={0.005} color="#c9a46a" rough={0.8} rot={[0, -0.15, 0]} />
    <RB p={[0.24, 0.79, -0.34]} s={[0.3, 0.004, 0.22]} r={0.002} color="#f2efe4" rough={0.9} rot={[0, -0.12, 0]} />
    <Lamp p={[-0.55, 0.77, -0.55]} />
    {[1.8, 2.3].map((x) => (
      <RB key={x} p={[x, 0.65, -1.9]} s={[0.46, 1.3, 0.6]} r={0.02} color="#6a7076" metal={0.5} rough={0.5} />
    ))}
    <Plant p={[-2.0, 0, -1.8]} />
    <pointLight position={[0, 2.4, 0]} color="#fff0d8" intensity={6} distance={7} decay={2} />
  </group>
);

export const SetOffice: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.police) / 30;
  const cam: Cam = { pos: keys3(f, [[c.police, [1.9, 1.9, 2.0]], [c.remember2, [1.4, 1.7, 1.4]]]), look: [-0.1, 0.95, -0.3], fov: 46 };
  const at = useAt(cam);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="room" ao={1.0}>
        <Office t={t} />
        <Model file="man_b.glb" anims={LIB1} clip="Idle_Loop" t={t} p={[-0.2, 0, -1.25]} ry={0.5} outfit={SUIT} tint={{ Hair: "#2a1a10" }} />
      </PrisonCanvas>
      <Pin {...at([0.25, 0.8, -0.35])} o={fadeIn(f, c.police + 8)} text="HIS FILE" sub="FROM DAY 1" color={BLUE} side="right" />
    </AbsoluteFill>
  );
};

export const SetBoard: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.show) / 30;
  const cam: Cam = { pos: keys3(f, [[c.show, [1.4, 1.6, 1.4]], [c.congrats, [0.6, 1.5, 0.6]]]), look: [0, 1.45, -2.2], fov: 46 };
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="room" ao={1.0}>
        <Office t={t} />
        <CaseBoard p={[0, 1.55, -2.18]} strings={ramp(f, c.fbi, c.follows + 10)} />
        <Model file="man_b.glb" anims={LIB1} clip="Idle_Loop" t={t} p={[-0.6, 0, -1.1]} ry={Math.PI - 0.3} outfit={SUIT} tint={{ Hair: "#2a1a10" }} />
      </PrisonCanvas>
      <Pin x={540} y={330} o={fadeIn(f, c.show + 4)} text="IN THE SHOW · SEASON 2" sub="AGENT MAHONE DECODES THE TATTOOS" color={AMBER} size={38} side="center" />
    </AbsoluteFill>
  );
};

// ───────────────────────── finale: it works perfectly… on Fox ─────────────────────────
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.congrats) / 30;
  // living room; TV screen centre (0, 1.05, -2.02), 1.25 × 0.7 m
  const push = ramp(f, c.honest, c.honest + 40, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [1.5, 1.6, 3.6]],
      [c.fox, [1.0, 1.45, 3.1]],
      [c.honest, [0.6, 1.3, 2.6]],
      [c.honest + 40, [0, 1.05, -1.35]],
    ]),
    look: keys3(f, [
      [c.congrats, [0, 0.95, -1.8]],
      [c.honest, [0, 1.05, -2.0]],
    ]),
    fov: 44,
  };
  const corners: V3[] = [[-0.625, 1.4, -2.02], [0.625, 0.7, -2.02]];
  const a = project(corners[0], cam, 1080, 1920);
  const b = project(corners[1], cam, 1080, 1920);
  const wall = useMemo(() => tex("wallpaper", "#3a4a5a", [3, 2], 5), []);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="dark" bg="#05060a" ao={1.0} env={0.06}>
        <hemisphereLight args={["#3a4a6a", "#141010", 0.35]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[7, 6]} />
          <meshStandardMaterial map={useMemo(() => tex("planks", "#6a4a32", [4, 3], 3), [])} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.4, -2.3]} receiveShadow>
          <planeGeometry args={[7, 2.8]} />
          <meshStandardMaterial map={wall} roughness={0.9} />
        </mesh>
        <Rug p={[0, 0.005, -0.2]} s={[2.6, 1.8]} color="#6a3a2a" />
        <TvSet p={[0, 0, -2.0]} />
        <Sofa p={[0, 0, 1.6]} ry={Math.PI} color="#4a5a6a" />
        {/* the pocket puh watches too: a fox head on the TV cabinet */}
        <group position={[0.84, 0.66, -1.9]} rotation={[0, -0.35, 0]}>
          <FursuitHead s={0.24} t={t} />
        </group>
        <Lamp p={[-1.6, 0, -1.6]} on={0.6} />
        <Plant p={[1.6, 0, -1.7]} />
      </PrisonCanvas>
      {/* the show on the TV: the Fox River diorama, from the hook */}
      {a && b ? (
        <div style={{ position: "absolute", left: a.x, top: a.y, width: b.x - a.x, height: b.y - a.y, overflow: "hidden", background: "#000" }}>
          <div style={{ position: "absolute", left: (b.x - a.x) / 2 - 540 * Math.min(1, (b.x - a.x) / 1080), top: (b.y - a.y) / 2 - 960 * Math.min(1, (b.x - a.x) / 1080), width: 1080, height: 1920, transform: `scale(${Math.min(1, (b.x - a.x) / 1080)})`, transformOrigin: "0 0" }}>
            <HookScene f={30 + (f - c.congrats) * 0.6} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.08), transparent 40%)", opacity: 1 - push }} />
        </div>
      ) : null}
      <Pin x={540} y={330} o={fadeIn(f, c.fox) * (1 - push)} text="WORKS PERFECTLY… ON TV" color={AMBER} size={42} side="center" />
    </AbsoluteFill>
  );
};

