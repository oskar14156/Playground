import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, project, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { RB } from "../../lib/three/diorama";
import { CM, ClawMachine, ClawState, makePile, PrizeToy } from "../../lib/three/ClawMachine";
import { Gauge, StatPill } from "../../lib/Hud";
import { ViewMode } from "../../lib/ViewMode";
import { easeInOut, easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { fonts, palettes } from "../../lib/theme";
import { Big, Tag } from "../rocket/sets";
import { c } from "./cues";
import { ArcadeCanvas } from "./world";
import { Bill, FireHelmet, Garage, Lobster, Wallet } from "./props";
import { MemeStamp } from "./inserts";

export type SetProps = { f: number };
const P = palettes.night;
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" };
const YOU: Outfit = { top: "#e8573a", pants: "#2c3440", shoes: "#f2f2f2" };
const PLAYER: Outfit = { top: "#2fa36b", pants: "#2a3340", shoes: "#e8e8e8" };
const FIRE: Outfit = { top: "#22262c", pants: "#22262c", shoes: "#0e0e0e", sleeves: 1 };
const OD = CM.D + 0.14; // outer depth of the cabinet; the glass front sits at z = CM.D/2 + 0.03
const HOME: [number, number] = [CM.chute.x, CM.chute.z];
const MASK_S = 0.36; // pocket puh in the machine: ≈ 45 cm tall, 43 cm wide (FursuitHead: 1.25 m per unit)

/** a seeded pile that leaves room for the pocket puh at the back right */
const PILE = makePile(18, 5);
const pileWithout = (ids: number[]) => PILE.filter((_, i) => !ids.includes(i));
const nearest = (x: number, z: number) => {
  let best = 0;
  PILE.forEach((q, i) => {
    if (Math.hypot(q.p[0] - x, q.p[2] - z) < Math.hypot(PILE[best].p[0] - x, PILE[best].p[2] - z)) best = i;
  });
  return best;
};

// ───────────────────────── one claw try as a pure function of progress k ─────────────────────────
/**
 * home (over the chute) → target → open → drop → close → lift → (win: carry to the chute, open, prize falls)
 * `grip` = how far the prongs close (0.05 strong … 0.4 a weak hug); `slip` = k where the prize slides out.
 * Returns the claw, whether the prize hangs in it (`hold`), and its drop below the hub while it falls (`fall`, m).
 */
const tryClaw = (k: number, target: [number, number], drop = 0.42, grip = 0.06, slip = 2): { claw: ClawState; hold: boolean; fall: number; won: boolean } => {
  // ramp() works in frames (min. 1 apart), so scale the 0–1 progress up
  const seg = (a: number, b: number) => ramp(k * 1000, a * 1000, b * 1000, easeInOut);
  const go = seg(0, 0.2);
  const back = seg(0.62, 0.84);
  const x = HOME[0] + (target[0] - HOME[0]) * go + (HOME[0] - target[0]) * back;
  const z = HOME[1] + (target[1] - HOME[1]) * go + (HOME[1] - target[1]) * back;
  const dr = drop * (seg(0.26, 0.4) - seg(0.48, 0.6));
  const open = 0.3 + 0.7 * seg(0.18, 0.26) - (1 - grip) * seg(0.4, 0.47) + (1 - grip) * seg(0.86, 0.9) - 0.7 * seg(0.94, 1);
  const holding = k >= 0.45 && k < 0.88 && k < slip;
  const fall = k >= slip ? Math.min(0.35, 4 * (k - slip) * (k - slip) * 60) : k >= 0.88 ? Math.min(0.4, (k - 0.88) * 6) : 0;
  return { claw: { x, z, drop: dr, open: Math.max(0, open) }, hold: holding || (k >= slip && k < slip + 0.06) || (k >= 0.88 && k < 0.93 && slip > 1), fall, won: slip > 1 && k >= 0.88 };
};
const HELD_Y = -0.36; // prize origin below the hub when gripped

/** A prize in the claw (hub-local). */
const Held: React.FC<{ kind: number; s: number; fall: number; t: number; tilt?: number }> = ({ kind, s, fall, t, tilt = 0 }) => (
  <group position={[0, HELD_Y - fall, 0]} rotation={[tilt, 0, tilt * 0.5]}>
    <PrizeToy kind={kind} s={s} t={t} />
  </group>
);

const Hero: React.FC<React.ComponentProps<typeof ClawMachine>> = (props) => <ClawMachine {...props} />;

/** steel ball with a gold band and dimples, spinning (so the spin reads) */
const SteelBall: React.FC<{ t: number; r?: number }> = ({ t, r = 0.045 }) => (
  <group rotation={[0.3, t * 9, 0.2]}>
    <mesh castShadow>
      <sphereGeometry args={[r, 32, 24]} />
      <meshStandardMaterial color="#e6eaee" metalness={1} roughness={0.12} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[r * 1.002, r * 0.08, 8, 40]} />
      <meshStandardMaterial color="#d9a521" metalness={1} roughness={0.25} />
    </mesh>
    {Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * r * 0.97, r * 0.35 * (i % 2 ? 1 : -1), Math.sin(a) * r * 0.97]}>
          <sphereGeometry args={[r * 0.12, 8, 6]} />
          <meshStandardMaterial color="#8a9098" metalness={1} roughness={0.4} />
        </mesh>
      );
    })}
  </group>
);

/** wall clock (on the back wall), hands at h:m */
const WallClock: React.FC<{ p: V3; h: number; m: number }> = ({ p, h, m }) => (
  <group position={p}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.32, 0.32, 0.05, 40]} />
      <meshStandardMaterial color="#f4f1e8" emissive="#f4f1e8" emissiveIntensity={0.25} />
    </mesh>
    <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.32, 0.025, 8, 40]} />
      <meshStandardMaterial color="#222" metalness={0.6} roughness={0.3} />
    </mesh>
    {Array.from({ length: 12 }, (_, i) => (
      <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.26, Math.cos((i / 12) * Math.PI * 2) * 0.26, 0.03]}>
        <boxGeometry args={[0.02, 0.05, 0.005]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    ))}
    <group position={[0, 0, 0.04]} rotation={[0, 0, -((h % 12) / 12) * Math.PI * 2 - (m / 720) * Math.PI * 2]}>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.025, 0.16, 0.006]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
    <group position={[0, 0, 0.045]} rotation={[0, 0, -(m / 60) * Math.PI * 2]}>
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.016, 0.22, 0.006]} />
        <meshStandardMaterial color="#c0202a" />
      </mesh>
    </group>
  </group>
);

// ───────────────────────── 1 · GARAGE: your friend is broke ─────────────────────────
const MOUND = (() => {
  const r = seeded(21);
  const out: { kind: number; p: V3; ry: number; s: number; tilt: number }[] = [];
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2;
    const rr = 1.35 * Math.sqrt(r());
    const h = 0.78 * (1 - (rr / 1.45) ** 2);
    out.push({ kind: Math.floor(r() * 5), p: [Math.cos(a) * rr, Math.max(0, h - 0.22), Math.sin(a) * rr * 0.8], ry: (r() - 0.5) * 3, s: 0.22 + r() * 0.1, tilt: (r() - 0.5) * 0.8 });
  }
  return out;
})();

export const SetGarage: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [0, [1.1, 1.45, 4.4]],
      [c.hasAll, [0.9, 1.4, 4.0]],
      [c.plushies, [-0.6, 2.1, 4.2]],
      [c.glass, [-0.9, 2.25, 4.0]],
    ]),
    look: keys3(f, [
      [0, [0.1, 0.9, 0.2]],
      [c.hasAll, [0.0, 0.9, 0.2]],
      [c.plushies, [0, 0.55, 0.1]],
      [c.glass, [0, 0.55, 0.1]],
    ]),
    fov: 42,
  };
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pWallet = at([0.42, 0.62, 0.72]);
  const pMask = at([-0.6, 1.3, 0.05]);
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t} mood="garage" ao={0.9} bloom={0.6}>
        <Garage />
        {/* the mound: a soft core + 46 plushies */}
        <mesh position={[0, 0, 0]} scale={[1.3, 0.62, 1.05]}>
          <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#6a5a7a" roughness={1} />
        </mesh>
        {MOUND.map((q, i) => (
          <group key={i} position={q.p} rotation={[q.tilt, q.ry, q.tilt * 0.5]}>
            <PrizeToy kind={q.kind} s={q.s} t={t * 0.2 + i} />
          </group>
        ))}
        {/* your friend on top, the giant pocket puh next to him, the empty wallet */}
        <Model file="man_b.glb" anims={LIB1} clip="Sitting_Idle_Loop" t={t} p={[0.15, 0.22, 0.25]} ry={0.25} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} />
        <group position={[-0.6, 0.6, 0.05]} rotation={[0, 0.45, 0]}>
          <FursuitHead s={0.5} t={t} />
        </group>
        <Wallet p={[0.42, 0.6, 0.72]} ry={0.3} s={1.4} />
        <Model file="man_a.glb" anims={LIB1} clip="Idle_Talking_Loop" t={t} p={[1.55, 0, 1.15]} ry={-1.0} outfit={YOU} tint={{ Hair: "#3b2a1e" }} />
      </ArcadeCanvas>
      {f >= 12 && pWallet ? <Tag x={pWallet.x} y={pWallet.y} text="$0.00" color="#ff5a4f" o={fadeIn(f, 12)} /> : null}
      {f >= c.hasAll + 6 && pMask ? <Tag x={pMask.x} y={pMask.y} text="GIANT POCKET PUH" color="#ef7d2e" side="left" o={fadeIn(f, c.hasAll + 6)} size={34} /> : null}
      <StatPill at={c.plushies} value={500} from={0} countFrames={20} unit="PLUSHIES" palette={P} top={230} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 2 · ARCADE: 1 dollar a grab, it wins every time, broke by lunch ─────────────────────────
const WIN_A = nearest(0.1, -0.1);
const WIN_B = nearest(-0.15, -0.25);
export const SetArcade: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const g1 = ramp(f, c.every, c.every + 26, (x) => x);
  const g2 = ramp(f, c.every + 24, c.lunch + 4, (x) => x);
  const a = tryClaw(g1, [PILE[WIN_A].p[0], PILE[WIN_A].p[2]], 0.42);
  const b = tryClaw(g2, [PILE[WIN_B].p[0], PILE[WIN_B].p[2]], 0.45);
  const second = f >= c.every + 24;
  const cur = second ? b : a;
  const lunch = f >= c.lunch;
  const pile = lunch ? PILE.filter((_, i) => i % 4 === 0) : pileWithout([...(g1 > 0.45 ? [WIN_A] : []), ...(g2 > 0.45 ? [WIN_B] : [])]);
  const heldQ = second ? PILE[WIN_B] : PILE[WIN_A];
  const won = (g1 >= 0.95 ? 1 : 0) + (g2 >= 0.95 ? 1 : 0);
  // prizes that came out of the door lie on the carpet in front of it; at lunch there are dozens
  const outN = lunch ? 26 : won;
  const rr = seeded(9);
  const outs = Array.from({ length: 26 }, () => ({ x: CM.chute.x + (rr() - 0.5) * 1.1, z: OD / 2 + 0.25 + rr() * 0.7, ry: rr() * 6, kind: Math.floor(rr() * 5), s: 0.1 + rr() * 0.03 }));
  const cam: Cam = {
    pos: keys3(f, [
      [c.glass, [0.6, 1.7, 4.6]],
      [c.dollar - 4, [0.3, 1.45, 2.1]],
      [c.dollar, [0.55, 0.78, 1.05]],
      [c.every - 2, [0.5, 0.74, 0.98]],
      [c.every, [0.55, 1.45, 1.55]],
      [c.lunch - 1, [0.45, 1.45, 1.45]],
      [c.lunch, [1.5, 1.9, 3.7]],
      [c.down, [1.35, 1.9, 3.4]],
    ]),
    look: keys3(f, [
      [c.glass, [0, 1.3, 0]],
      [c.dollar - 4, [0, 1.25, 0]],
      [c.dollar, [0.2, 0.6, OD / 2]],
      [c.every - 2, [0.2, 0.6, OD / 2]],
      [c.every, [-0.05, 1.25, 0]],
      [c.lunch - 1, [-0.05, 1.25, 0]],
      [c.lunch, [-0.35, 1.25, -1.2]],
      [c.down, [-0.35, 1.25, -1.2]],
    ]),
    fov: 42,
  };
  const bill = ramp(f, c.dollar + 2, c.dollar + 22, easeInOut);
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pSlot = at([0.2, 0.68, OD / 2]);
  const pClock = at([-0.9, 2.45, -5.9]);
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t}>
        <Hero
          claw={f < c.every ? { x: HOME[0], z: HOME[1], drop: 0, open: 0.3 } : cur.claw}
          t={t}
          pile={pile}
          power={f >= c.every && !lunch ? 1 : 0}
          door={Math.max(ramp(f, c.every + 21, c.every + 24) - ramp(f, c.every + 26, c.every + 30), ramp(f, c.lunch - 6, c.lunch - 3) - ramp(f, c.lunch, c.lunch + 4))}
          held={cur.hold && !lunch ? <Held kind={heldQ.kind} s={heldQ.s} fall={cur.fall} t={t} /> : null}
        />
        {/* the $1 bill sliding into the slot */}
        {f >= c.dollar - 2 && f < c.every + 4 ? <Bill p={[0.2, 0.625, OD / 2 + 0.11 - 0.1 * bill]} rot={[-Math.PI / 2, 0, Math.PI / 2]} s={0.9} /> : null}
        {/* won prizes on the carpet */}
        {outs.slice(0, outN).map((o, i) => (
          <group key={i} position={[o.x, 0, o.z]} rotation={[0, o.ry, i % 3 ? 0 : 1.4]}>
            <PrizeToy kind={o.kind} s={o.s} t={t + i} />
          </group>
        ))}
        <WallClock p={[-0.9, 2.45, -5.93]} h={lunch ? 12 : 9} m={0} />
      </ArcadeCanvas>
      {f >= c.dollar + 2 && f < c.every && pSlot ? <Tag x={pSlot.x} y={pSlot.y - 60} text="$1 A GRAB" color="#ffd23f" o={fadeIn(f, c.dollar + 2)} /> : null}
      <StatPill at={c.every + 22} until={c.down} value={lunch ? 61 : won} from={lunch ? 2 : undefined} countFrames={14} unit={!lunch && won === 1 ? "PRIZE WON" : "PRIZES WON"} palette={P} color="#ff5a4f" top={230} />
      {lunch && pClock ? <Tag x={pClock.x} y={pClock.y} text="12:00 · BROKE" color="#ff5a4f" side="right" o={fadeIn(f, c.lunch + 6)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 3 · CLAW CLOSE-UP: turn it down, the little hug (and later: FULL POWER) ─────────────────────────
const HUG_T = nearest(0.12, 0.05);
export const SetClose: React.FC<SetProps & { full?: boolean }> = ({ f, full = false }) => {
  const t = f / 30;
  const q = PILE[HUG_T];
  const s0 = full ? c.decides : c.down;
  const power = full ? 0.25 + 0.75 * ramp(f, c.decides + 40, c.decides + 48) : 1 - 0.8 * ramp(f, c.down + 4, c.down + 24);
  // hover, then drop + hug (down → nobody), or a full-power grip (decides → real)
  const k = full ? 0.32 + 0.16 * ramp(f, c.decides + 6, c.decides + 40) + 0.1 * ramp(f, c.decides + 44, c.real) : keys(f, [[c.down, 0.2], [c.closes, 0.32], [c.hug - 6, 0.47], [c.hug + 10, 0.53], [c.nobody, 0.6]], (x) => x);
  const tc = tryClaw(k, [q.p[0], q.p[2]], 0.42, full ? 0.06 : 0.38, full ? 2 : 0.515);
  const cam: Cam = { pos: keys3(f, [[s0, [0.42, 1.68, 1.05]], [s0 + 120, [0.3, 1.62, 0.9]]]), look: [q.p[0], 1.2, q.p[2] + 0.05], fov: 40 };
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const heart = at([q.p[0], 1.42, q.p[2]]);
  const hk = ramp(f, c.hug, c.hug + 18, easeOut);
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t} others={false}>
        <Hero claw={tc.claw} t={t} power={power} pile={tc.hold ? pileWithout([HUG_T]) : PILE} held={tc.hold ? <Held kind={q.kind} s={q.s} fall={tc.fall} t={t} /> : null} />
        <Glow position={[tc.claw.x, CM.top - 0.15 - tc.claw.drop * 0.52, tc.claw.z]} size={0.35 * power} color="#ffb000" opacity={0.7 * power} />
      </ArcadeCanvas>
      <Gauge at={s0 + 2} value={full ? 100 : 20} from={full ? 20 : 100} countFrames={full ? 10 : 22} max={100} unit="%" label="CLAW POWER" x={540} y={1560} palette={P} size={300} />
      {!full && f >= c.hug && heart ? (
        <div style={{ position: "absolute", left: heart.x, top: heart.y - 120 * hk, transform: `translate(-50%,-50%) scale(${0.5 + 0.8 * hk})`, opacity: 1 - ramp(f, c.hug + 24, c.hug + 34), fontSize: 120, color: "#ff4f8a", textShadow: "0 0 30px #ff4f8a" }}>♥</div>
      ) : null}
      {full && f >= c.decides + 44 ? <Big x={540} y={300} text="FULL POWER" o={fadeIn(f, c.decides + 44, 6)} color="#ffd23f" size={110} /> : null}
    </AbsoluteFill>
  );
};
export const SetPower: React.FC<SetProps> = ({ f }) => <SetClose f={f} full />;

// ───────────────────────── 4 · NOBODY PLAYS: players walk off, the machine dims ─────────────────────────
const LEAVERS: { file: string; outfit: Outfit; path: [number, number][]; delay: number }[] = [
  { file: "woman_c.glb", outfit: { top: "#d98ab0", pants: "#3a3a4a", shoes: "#eee" }, path: [[0.3, 1.0], [1.0, 1.25], [2.4, 1.6]], delay: 0 },
  { file: "man_c.glb", outfit: PLAYER, path: [[-0.25, 1.05], [-0.9, 1.35], [-2.4, 1.9]], delay: 10 },
  { file: "man_d.glb", outfit: { top: "#f2c94c", pants: "#2a3340", shoes: "#fff" }, path: [[0.7, 1.6], [1.3, 1.9], [2.6, 2.6]], delay: 5 },
];
const follow = (pts: [number, number][], speed: number, t: number) => {
  let d = Math.max(0, t) * speed;
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    const L = Math.hypot(bx - ax, bz - az);
    if (d <= L) return { x: ax + ((bx - ax) * d) / L, z: az + ((bz - az) * d) / L, ry: Math.atan2(bx - ax, bz - az), moving: true };
    d -= L;
  }
  const [lx, lz] = pts[pts.length - 1];
  return { x: lx, z: lz, ry: 0, moving: false };
};
export const SetLonely: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = { pos: keys3(f, [[c.nobody, [0.25, 1.75, 4.6]], [c.chip, [0.4, 2.4, 6.4]]]), look: keys3(f, [[c.nobody, [0.1, 1.0, 0.6]], [c.chip, [0, 0.9, 0]]]), fov: 50 };
  const dim = ramp(f, c.plays, c.plays + 20);
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t} dim={dim}>
        <Hero claw={{ x: HOME[0], z: HOME[1], drop: 0, open: 0.3 }} t={t} pile={PILE} lights={1 - 0.7 * dim} />
        {LEAVERS.map((L, i) => {
          const tt = (f - c.nobody - L.delay) / 30;
          const w = follow(L.path, 1.2, tt);
          return tt < 0 ? (
            <Model key={i} file={L.file} anims={LIB2} clip="Idle_No_Loop" t={t} p={[L.path[0][0], 0, L.path[0][1]]} ry={Math.PI + 0.2 * i} outfit={L.outfit} />
          ) : (
            <Model key={i} file={L.file} anims={LIB1} clip="Walk_Loop" t={tt * 1.1} p={[w.x, 0, w.z]} ry={w.ry} outfit={L.outfit} />
          );
        })}
      </ArcadeCanvas>
      <StatPill at={c.nobody + 4} value={0} unit="PLAYERS" palette={P} color="#9fb3c8" top={230} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 5 · X-RAY: the chip ─────────────────────────
export const SetXray: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const x = ramp(f, c.chip, c.chip + 14);
  const cam: Cam = { pos: keys3(f, [[c.chip, [0.8, 0.95, 1.7]], [c.type, [0.18, 0.62, 0.95]]]), look: keys3(f, [[c.chip, [0, 0.7, 0]], [c.type, [0.05, 0.55, OD / 2 - 0.06]]]), fov: 40 };
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pc = at([0.05, 0.62, OD / 2 - 0.06]);
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t} dim={0.4}>
        <Hero claw={{ x: HOME[0], z: HOME[1], drop: 0, open: 0.3 }} t={t} pile={PILE} xray={x} power={0.3} />
      </ArcadeCanvas>
      {f >= c.chip + 8 && pc ? <Tag x={pc.x - 60} y={Math.max(pc.y + 120, 1150)} text="THE CHIP" color="#2ec4d6" side="left" o={fadeIn(f, c.chip + 8)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 6 · LET'S GO GAMBLING: a player, two hugs ─────────────────────────
const GAMBLE_T = nearest(-0.05, -0.15);
export const SetGamble: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const q = PILE[GAMBLE_T];
  const k1 = ramp(f, c.hugAgain - 6, c.dang1 + 4, (x) => x);
  const k2 = ramp(f, c.dang1 + 4, c.dang2 + 4, (x) => x);
  const first = f < c.dang1 + 4;
  const tc = tryClaw(first ? k1 : k2, [q.p[0], q.p[2]], 0.43, 0.38, 0.515);
  const sad = (f >= c.dang1 && f < c.dang1 + 16) || f >= c.dang2;
  const cam: Cam = { pos: keys3(f, [[c.hugAgain, [-0.85, 1.7, 2.1]], [c.settings, [-0.7, 1.62, 1.8]]]), look: [0.0, 1.2, 0.2], fov: 44 };
  const stick: [number, number] = f < c.gambling ? [0, 0] : [0.25 * Math.sin(t * 5), 0.2 * Math.cos(t * 4)];
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t}>
        <Hero claw={tc.claw} t={t} power={0.2} stick={stick} pile={tc.hold ? pileWithout([GAMBLE_T]) : PILE} held={tc.hold ? <Held kind={q.kind} s={q.s} fall={tc.fall} t={t} /> : null} />
        <Model file="man_c.glb" anims={sad ? LIB2 : LIB1} clip={sad ? "Idle_No_Loop" : "Idle_Loop"} t={t} p={[0.12, 0, 0.98]} ry={Math.PI} outfit={PLAYER} tint={{ Hair: "#5a3a22" }} />
      </ArcadeCanvas>
      <MemeStamp f={f} at={c.gambling} until={c.dang1} text={"LET'S GO\nGAMBLING!"} color="#7dff5a" top={250} size={110} />
      <MemeStamp f={f} at={c.dang1} until={c.dang2} text="AW, DANG IT" color="#ff5a4f" top={300} size={110} rot={3} />
      <MemeStamp f={f} at={c.dang2} text="AW, DANG IT" color="#ff5a4f" top={300} size={120} rot={-5} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 7 · THE DROP (danger): carried to the hole, slips off the rim ─────────────────────────
const DROP_Q = PILE[nearest(-0.1, 0.1)];
export const SetDrop: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  // claw arrives with the prize, slows to a crawl at the rim (slow-mo), prongs go soft, it slides off
  const x = keys(f, [[c.edge, 0.05], [c.close - 10, -0.12], [c.purpose + 20, -0.15]]);
  const soft = ramp(f, c.close - 8, c.close + 2);
  const slide = ramp(f, c.close, c.close + 14, (k) => k * k);
  const fallX = 0.07 * slide;
  const cam: Cam = { pos: keys3(f, [[c.edge, [-0.62, 1.32, 0.95]], [c.chooses, [-0.55, 1.26, 0.8]]]), look: [-0.17, 1.24, 0.2], fov: 38 };
  const danger = f >= c.close;
  const scene = (
    <ArcadeCanvas cam={cam} t={t} others={false}>
      <Hero
        claw={{ x, z: 0.2, drop: 0.24, open: 0.06 + 0.32 * soft }}
        t={t}
        power={1 - 0.75 * soft}
        pile={PILE}
        held={
          <group position={[fallX, HELD_Y - 0.33 * slide + 0.02 * soft, 0]} rotation={[0, 0, -1.1 * slide]}>
            <PrizeToy kind={1} s={DROP_Q.s * 1.05} t={t} />
          </group>
        }
      />
    </ArcadeCanvas>
  );
  return (
    <AbsoluteFill>
      {danger ? <ViewMode mode="danger">{scene}</ViewMode> : scene}
      {f >= c.close ? <Big x={540} y={330} text="SO CLOSE." o={fadeIn(f, c.close, 5)} color="#ff3b30" size={120} /> : null}
      {f >= c.purpose ? <Big x={540} y={1500} text="ON PURPOSE" o={fadeIn(f, c.purpose, 5)} color="#ffffff" size={90} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 8 · INSIDE THE BOX: the claw chooses ─────────────────────────
export const SetInside: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const d = ramp(f, c.chooses, c.wait, easeInOut);
  const cam: Cam = { pos: [0.18, 1.1, 0.16], look: [0.02, 1.7, -0.02], fov: 62, roll: 0.05 * Math.sin(t) };
  // plushies around the camera tilt back to look up at the claw
  const lookUp = PILE.filter((q) => Math.hypot(q.p[0] - 0.18, q.p[2] - 0.16) > 0.16).map((q) => ({ ...q, tilt: -0.55 }));
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t} others={false} bloom={1.3}>
        <Hero claw={{ x: 0.02, z: -0.02, drop: 0.1 + 0.18 * d, open: 0.95 }} t={t} power={0.6} pile={lookUp} />
        <Glow position={[0.02, CM.top - 0.25 - 0.1 * d, -0.02]} size={0.6} color="#fff2c0" opacity={0.8} />
      </ArcadeCanvas>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 30%, transparent 30%, rgba(0,0,0,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 9 · SKILL: joystick + timer, skill issue ─────────────────────────
export const SetDeck: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = { pos: keys3(f, [[c.joystick, [0.5, 1.36, 1.15]], [c.officially, [0.38, 1.3, 1.0]], [c.issue, [0.42, 1.34, 1.08]], [c.top, [0.4, 1.4, 1.2]]]), look: keys3(f, [[c.joystick, [0.16, 1.07, OD / 2 + 0.07]], [c.issue, [0.14, 1.1, OD / 2 + 0.03]], [c.top, [0.05, 1.2, 0.2]]]), fov: 40 };
  const secs = Math.max(0, 15 - Math.floor(Math.max(0, f - c.joystick - 10) / 9));
  const stick: [number, number] = [0.3 * Math.sin(t * 4.2), 0.2 * Math.sin(t * 3.1 + 1)];
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pb = at([0.28, 1.06, OD / 2 + 0.07]);
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t}>
        <Hero claw={{ x: 0.1 * Math.sin(t * 2), z: 0.05 * Math.cos(t * 2), drop: 0, open: 0.3 }} t={t} pile={PILE} stick={f >= c.joystick + 6 ? stick : [0, 0]} />
        {/* timer display on the deck */}
        <group position={[-0.2, 1.05, OD / 2 + 0.1]} rotation={[-0.6, 0, 0]}>
          <RB p={[0, 0, 0]} s={[0.16, 0.07, 0.02]} r={0.008} color="#0a0a0a" />
        </group>
      </ArcadeCanvas>
      {f >= c.joystick + 10 ? (
        <div style={{ position: "absolute", top: 250, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontWeight: 700, fontSize: 130, color: secs <= 5 ? "#ff3b30" : "#ff9a3a", textShadow: "0 0 30px rgba(255,80,40,0.8)", opacity: fadeIn(f, c.joystick + 10) }}>
          0:{String(secs).padStart(2, "0")}
        </div>
      ) : null}
      {f >= c.skill && f < c.issue && pb ? <Tag x={pb.x} y={pb.y} text="SKILL GAME™" color="#2ec4d6" o={fadeIn(f, c.skill)} /> : null}
      <MemeStamp f={f} at={c.issue} text="SKILL ISSUE" color="#ff3b30" top={1300} size={130} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 10 · THE BAIT: pocket puh grand prize, too big for the hole; the steel ball ─────────────────────────
const PUH_P: V3 = [0.16, 0.06, -0.16];
const BALL_P: V3 = [-0.08, 0.14, -0.02];
const BAIT_PILE = PILE.filter((q) => Math.hypot(q.p[0] - PUH_P[0], q.p[2] - PUH_P[2]) > 0.27 && Math.hypot(q.p[0] - BALL_P[0], q.p[2] - BALL_P[2]) > 0.08 && !(Math.abs(q.p[0] - BALL_P[0]) < 0.1 && q.p[2] > BALL_P[2]));
export const SetBait: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.top, [0.25, 1.3, 1.15]],
      [c.grand, [0.3, 1.55, 1.0]],
      [c.fit, [0.0, 1.9, 1.7]],
      [c.next - 2, [0.0, 1.88, 1.65]],
      [c.next + 8, [-0.06, 1.34, 0.42]],
      [c.runOut, [-0.07, 1.31, 0.36]],
    ]),
    look: keys3(f, [
      [c.top, [0.1, 1.3, -0.1]],
      [c.grand, [0.14, 1.32, -0.16]],
      [c.fit, [-0.05, 1.22, 0.02]],
      [c.next - 2, [-0.05, 1.22, 0.02]],
      [c.next + 8, [BALL_P[0], 1.0 + BALL_P[1], BALL_P[2]]],
    ]),
    fov: 40,
  };
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pPuh = at([PUH_P[0], 1.62, PUH_P[2]]);
  const pBall = at([BALL_P[0], 1.0 + BALL_P[1] + 0.05, BALL_P[2]]);
  // size brackets at "It doesn't even fit"
  const showFit = f >= c.fit && f < c.next + 4;
  const bracketO = fadeIn(f, c.fit);
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t} others={false} bloom={1.0}>
        <Hero
          claw={{ x: -0.25 + 0.05 * Math.sin(t * 0.8), z: 0.12, drop: 0, open: 0.3 }}
          t={t}
          pile={BAIT_PILE}
          inside={
            <>
              <group position={PUH_P} rotation={[0, -0.25, 0]}>
                <FursuitHead s={MASK_S} t={t} />
              </group>
              <group position={BALL_P}>
                <SteelBall t={t} />
              </group>
            </>
          }
        />
        {f >= c.next ? <Glow position={[BALL_P[0] + 0.03, 1.0 + BALL_P[1] + 0.03, BALL_P[2] + 0.03]} size={0.12 + 0.04 * Math.sin(t * 9)} color="#fff3b0" opacity={0.9} /> : null}
      </ArcadeCanvas>
      {f >= c.grand && f < c.fit && pPuh ? <Tag x={pPuh.x} y={pPuh.y} text="GRAND PRIZE" color="#ffd23f" o={fadeIn(f, c.grand)} /> : null}
      {f >= c.never && f < c.fit && pPuh ? <Tag x={pPuh.x} y={pPuh.y + 90} text="WON: 0 TIMES" color="#ff5a4f" o={fadeIn(f, c.never)} /> : null}
      {showFit ? (
        <div style={{ position: "absolute", top: 1180, left: 90, width: 900, padding: "24px 30px", borderRadius: 24, background: "rgba(8,10,22,0.82)", opacity: bracketO, fontFamily: fonts.punch, fontWeight: 900 }}>
          {[
            ["POCKET PUH", "45 cm · 18 in", 45, "#ef7d2e"],
            ["THE HOLE", "26 cm · 10 in", 26, "#2ec4d6"],
          ].map(([name, size, cm, col], i) => (
            <div key={i} style={{ marginTop: i ? 18 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 40, color: "#fff" }}>
                <span>{name}</span>
                <span style={{ color: col as string }}>{size}</span>
              </div>
              <div style={{ height: 34, marginTop: 8, width: `${((cm as number) / 45) * 100 * ramp(f, c.fit + i * 6, c.fit + 16 + i * 6, easeOut)}%`, background: col as string, borderRadius: 10 }} />
            </div>
          ))}
        </div>
      ) : null}
      {f >= c.ball && pBall ? <Tag x={pBall.x} y={pBall.y - 40} text="STEEL BALL ?!" color="#d9a521" o={fadeIn(f, c.ball)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 11 · LOBSTERS: the joke that isn't, let him cook ─────────────────────────
const GRAVEL = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const g = cv.getContext("2d")!;
    g.fillStyle = "#3a3630";
    g.fillRect(0, 0, 256, 256);
    const r = seeded(13);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = ["#6a6258", "#4a443c", "#8a7e6a", "#2a2824"][i % 4];
      g.beginPath();
      g.arc(r() * 256, r() * 256, 1.5 + r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 4);
    return t;
  };
})();
const LOBS = (() => {
  const r = seeded(31);
  return Array.from({ length: 9 }, (_, i) => ({ p: [(r() - 0.5) * 0.62, 0, (r() - 0.5) * 0.5 - 0.05] as V3, ry: r() * 6.28, s: 0.85 + r() * 0.25, i }));
})();
export const SetLobster: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const fill = ramp(f, c.lobsters, c.lobsters + 30);
  const lobsters = f >= c.lobsters + 6;
  const grab = ramp(f, c.winOne, c.cook - 4, (x) => x);
  const L = LOBS[2];
  const HAT = LOBS.reduce((a, b) => (b.p[2] > a.p[2] && b.i !== 2 ? b : a), LOBS[0]);
  const tc = tryClaw(0.2 + 0.4 * grab, [L.p[0], L.p[2]], 0.6, 0.15, 2);
  const cook = f >= c.cook;
  const cam: Cam = cook
    ? { pos: [HAT.p[0] + 0.06, 1.52, HAT.p[2] + 0.5], look: [HAT.p[0], 1.06, HAT.p[2]], fov: 32 }
    : { pos: keys3(f, [[c.runOut, [0.35, 1.5, 1.7]], [c.lobsters, [0.3, 1.42, 1.45]], [c.restaurants, [0.6, 1.5, 1.9]], [c.winOne, [0.25, 1.45, 1.35]]]), look: [0, 1.25, 0], fov: 42 };
  const hat = ramp(f, c.cook + 2, c.cook + 10, easeOut);
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t} others={!cook}>
        <Hero
          claw={f >= c.winOne ? tc.claw : { x: HOME[0], z: HOME[1], drop: 0, open: 0.3 }}
          t={t}
          pile={f < c.lobsters ? [] : []}
          water={fill}
          sign={f >= c.lobsters ? "LOBSTER GRAB" : "PLUSH GRAB"}
          signColor={f >= c.lobsters ? "#28e0ff" : "#ff3fb4"}
          inside={
            lobsters ? (
              <>
                {LOBS.map((l) => (l.i === 2 && tc.hold ? null : <Lobster key={l.i} p={[l.p[0], 0.24 * (1 - ramp(f, c.lobsters + 6 + l.i * 2, c.lobsters + 22 + l.i * 2)), l.p[2]]} ry={l.ry} s={l.s} t={t + l.i} hat={l.i === HAT.i ? hat : 0} />))}
                {/* gravel on the tank floor */}
                <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[CM.W - 0.01, CM.D - 0.01]} />
                  <meshStandardMaterial map={GRAVEL()} roughness={1} />
                </mesh>
              </>
            ) : null
          }
          held={tc.hold ? (
            <group position={[0, -0.27, 0]} rotation={[0.3, 0, 0]}>
              <Lobster s={L.s} t={t} />
            </group>
          ) : null}
        />
        {fill > 0 ? <Glow position={[0, 1.3, 0.3]} size={1.2} color="#28e0ff" opacity={0.15 * fill} /> : null}
        <pointLight position={[0, 1.7, 0.1]} color="#fff4e0" intensity={0.8 * fill} distance={1.6} decay={2} />
      </ArcadeCanvas>
      {f >= c.runOut && f < c.lobsters ? <Big x={540} y={330} text="EMPTY" o={fadeIn(f, c.runOut + 4)} color="#9fb3c8" size={100} /> : null}
      {f >= c.joke && f < c.restaurants ? <Big x={540} y={330} text="JOKE…?" o={fadeIn(f, c.joke, 5)} color="#ffffff" size={110} /> : null}
      <StatPill at={c.restaurants} until={c.cook} value={300} from={0} countFrames={18} prefix="~" unit="RESTAURANTS" palette={P} color="#28e0ff" top={230} />
      <MemeStamp f={f} at={c.cook} text="LET HIM COOK" color="#ffd23f" top={1320} size={120} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 12 · GLITCH: kids climb in, firefighters patch it ─────────────────────────
/** two small legs in jeans + sneakers sticking out of the prize door, kicking */
const KidLegs: React.FC<{ t: number; out: number }> = ({ t, out }) => (
  <group position={[CM.chute.x, 0.2, OD / 2 - 0.25 + 0.42 * out]} scale={1.25}>
    {[-1, 1].map((k) => {
      const kick = Math.sin(t * 9 + k * 1.6) * 0.35;
      return (
        <group key={k} position={[k * 0.05, 0, 0]} rotation={[Math.PI / 2 - 0.1 + kick * 0.3, 0, 0]}>
          <mesh position={[0, 0.16, 0]} castShadow>
            <capsuleGeometry args={[0.035, 0.26, 6, 12]} />
            <meshStandardMaterial color="#3a5a8a" roughness={0.9} />
          </mesh>
          <group position={[0, 0.33, 0.02]}>
            <RB p={[0, 0, 0.03]} s={[0.07, 0.05, 0.12]} r={0.02} color="#f2f2f2" rough={0.6} />
            <RB p={[0, -0.022, 0.03]} s={[0.075, 0.015, 0.125]} r={0.006} color="#ff4f5a" />
          </group>
        </group>
      );
    })}
  </group>
);
export const SetGlitch: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = { pos: keys3(f, [[c.glitch, [0.75, 0.6, 1.75]], [c.climb + 20, [0.8, 0.7, 2.0]], [c.fire, [1.3, 1.05, 2.9]], [c.congrats, [1.35, 1.1, 3.0]]]), look: keys3(f, [[c.glitch, [-0.3, 0.35, 0.55]], [c.climb + 20, [-0.3, 0.35, 0.6]], [c.fire, [-0.6, 0.55, 0.9]]]), fov: 48 };
  const tt = (f - c.fire + 30) / 30;
  const w = follow([[-2.2, 3.2], [-1.0, 1.8], [-0.72, 0.95]], 1.25, tt);
  const kneel = !w.moving && tt > 0;
  const shake = f >= c.climb ? 0.004 * Math.sin(t * 40) : 0;
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t}>
        <group position={[shake, 0, 0]}>
          <Hero claw={{ x: HOME[0], z: HOME[1], drop: 0, open: 0.3 }} t={t} pile={PILE} door={f >= c.climb ? 1 : 0} />
        </group>
        {f >= c.climb ? <KidLegs t={t} out={ramp(f, c.climb, c.climb + 14)} /> : null}
        {tt > 0 ? (
          <Model file="man_d.glb" anims={LIB1} clip={kneel ? "Fixing_Kneeling" : "Walk_Loop"} t={kneel ? t : tt * 1.15} p={[w.x, 0, w.z]} ry={kneel ? Math.PI / 2 : w.ry} outfit={FIRE} tint={{ Hair: "#2a1d14" }} attach={{ bone: "Head", node: <FireHelmet color="#c0202a" /> }} />
        ) : null}
      </ArcadeCanvas>
    </AbsoluteFill>
  );
};

// ───────────────────────── 13 · FINALE: you built it; your friend dances in the pocket puh ─────────────────────────
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = { pos: keys3(f, [[c.congrats, [0.9, 1.55, 3.0]], [c.callIt, [1.1, 1.9, 4.2]], [c.end, [1.2, 2.1, 4.8]]]), look: keys3(f, [[c.congrats, [0.3, 1.2, 0.6]], [c.end, [0.2, 1.3, 0.2]]]), fov: 44 };
  const r = seeded(77);
  const bills = useMemo(() => Array.from({ length: 30 }, () => ({ x: 0.4 + (r() - 0.5) * 2.2, z: 1.3 + (r() - 0.5) * 1.4, ry: r() * 6.28 })), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <AbsoluteFill>
      <ArcadeCanvas cam={cam} t={t}>
        <Hero claw={{ x: 0.1 * Math.sin(t), z: 0, drop: 0, open: 0.3 }} t={t} pile={BAIT_PILE} power={0.2} />
        {bills.map((b, i) => (
          <Bill key={i} p={[b.x, 0.004 + i * 0.0004, b.z]} rot={[-Math.PI / 2, 0, b.ry]} s={1.4} />
        ))}
        <Model file="man_b.glb" anims={LIB1} clip="Dance_Loop" t={t} p={[0.75, 0, 1.45]} ry={0.2} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} attach={{ bone: "Head", node: <FursuitHead s={0.5} p={[0, -0.2, 0.03]} t={t} /> }} />
        <Model file="man_a.glb" anims={LIB1} clip="Idle_Talking_Loop" t={t} p={[-0.25, 0, 1.6]} ry={0.6} outfit={YOU} tint={{ Hair: "#3b2a1e" }} />
      </ArcadeCanvas>
    </AbsoluteFill>
  );
};


