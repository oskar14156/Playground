import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { RB } from "../../lib/three/diorama";
import { Grain } from "../../lib/ViewMode";
import { FollowPill } from "../../lib/Follow";
import { easeInOut, easeOut, keys, keys3, ramp } from "../../lib/timing";
import { Big, Tag } from "../rocket/sets";
import { Beanie } from "../white-house/props";
import { PhoneMesh } from "../internet/props";
import { c } from "./cues";
import { monaPuhTex, Blob, Cake, Scooter, Shards, crackTex, Crown, JewelCase, LiftTruck, PanelBack, Rock, Splat, Teacup, Toolbox, Trunk, Vitrine, VITRINE, Wheelchair, Wig } from "./props";
import { Apollo, Attic, CourNapoleon, Fortress, Gallery, LouvreCanvas, PuhRoom, QUAI_WIN, Quai, Salon1911, VIT_P } from "./world";
import { Clipping, CounterPill, Headlines, LeonardoLetter, LoginScreen, Stamp, SuspectCard, Ticket, YearTag } from "./inserts";

export type SetProps = { f: number };
const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 10) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** walk along a polyline at `speed` m/s; returns position, heading (model faces +Z) and whether still moving */
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
  const [px, pz] = pts[pts.length - 2];
  return { x: lx, z: lz, ry: Math.atan2(lx - px, lz - pz), moving: false };
};

// ───────────────────────── people ─────────────────────────
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420", loose: "male" };
const WORKER: Outfit = { top: "#6a7480", pants: "#3a3f46", shoes: "#2a2420", sleeves: 0.9 };
const SMOCK: Outfit = { top: "#cdc4ae", pants: "#2e2a26", shoes: "#1a1612", sleeves: 1 };
const PLUMBER: Outfit = { top: "#3b3f46", pants: "#1c2233", shoes: "#141210", sleeves: 1 };
const ROBBER: Outfit = { top: "#26282c", pants: "#1b1c1f", shoes: "#111111" };
const GUARD: Outfit = { top: "#14161a", pants: "#14161a", shoes: "#0a0a0a", sleeves: 0.85 };
const TOURIST_TOPS = ["#e05a47", "#f2c14e", "#4fa3a5", "#7a5cc4", "#e8e2d4", "#2f6d4a", "#d17a9a", "#3a7bd5", "#9a6a3e", "#ff8c42"];
const PEOPLE = ["man_a.glb", "woman_a.glb", "man_c.glb", "woman_b.glb", "man_d.glb", "woman_c.glb", "man_b.glb"];
const HAIR = ["#1a1410", "#5a3a20", "#d9b46a", "#2a2018", "#8a5a30", "#1a1a1a", "#c9c9c9"];
const tourist = (i: number): Outfit => ({ top: TOURIST_TOPS[i % TOURIST_TOPS.length], pants: ["#2b3550", "#3b3b3b", "#c9b994", "#1f1f24"][i % 4], shoes: ["#eeeeee", "#2a2420", "#111"][i % 3], sleeves: 0.55 + (i % 3) * 0.12 });
const MASK_S = 0.5;
const WORN: V3 = [0, -0.2, 0.03];

/** crowd around the barrier in the gallery: phones up, flashes now and then */
type Fan = { x: number; z: number; ry: number; i: number; phone: boolean };
const VZ = VIT_P[2];
const FANS: Fan[] = (() => {
  const out: Fan[] = [];
  let i = 0;
  for (const [r, n, a0, a1] of [
    [4.1, 7, -1.05, 1.05],
    [5.1, 8, -1.15, 1.15],
    [6.2, 6, -0.9, 0.9],
  ] as const) {
    for (let k = 0; k < n; k++) {
      const a = a0 + ((a1 - a0) * (k + 0.5 * (i % 2) * 0.3)) / (n - 1);
      out.push({ x: Math.sin(a) * r + ((i * 37) % 7) * 0.03, z: VZ + Math.cos(a) * r, ry: Math.PI + a, i, phone: i % 3 !== 2 });
      i++;
    }
  }
  return out;
})();
const Crowd: React.FC<{ t: number; f: number; skip?: (fan: Fan) => boolean; flash?: boolean }> = ({ t, f, skip, flash = true }) => (
  <>
    {FANS.filter((fan) => !(skip && skip(fan))).map((fan) => {
      const fl = flash && fan.phone && (f + fan.i * 13) % 47 < 2 ? 1 : 0;
      return (
        <Model
          key={fan.i}
          file={PEOPLE[fan.i % PEOPLE.length]}
          anims={LIB2}
          clip={fan.phone ? "Idle_Lantern_Loop" : fan.i % 2 ? "Idle_TalkingPhone_Loop" : "Idle_FoldArms_Loop"}
          t={t + fan.i * 0.37}
          p={[fan.x, 0, fan.z]}
          ry={fan.ry}
          outfit={tourist(fan.i)}
          tint={{ Hair: HAIR[fan.i % HAIR.length] }}
          attach={fan.phone ? { bone: "hand_r", node: <PhoneMesh p={[0.02, 0.09, 0.05]} rot={[1.35, 0.0, 0.2]} flash={fl} /> } : undefined}
        />
      );
    })}
  </>
);

const Sepia: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ filter: "sepia(0.9) contrast(1.08) brightness(0.92) saturate(0.9)" }}>{children}</AbsoluteFill>
    <Grain amount={0.12} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(30,18,6,0.55) 100%)" }} />
  </AbsoluteFill>
);

// ───────────────────────── HOOK + the glass case (gallery, before the fans) ─────────────────────────
const WORKER_PATH: [number, number][] = [
  [1.9, VZ + 2.1],
  [1.1, VZ + 1.1],
];
const ESCAPE: [number, number][] = [
  [1.1, VZ + 1.1],
  [3.6, VZ + 0.3],
  [5.4, VZ + 2.5],
  [7.2, VZ + 6.0],
];
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const glassK = ramp(f, c.glassCase - 6, c.steals - 8, easeInOut);
  const open = ramp(f, c.steals, c.steals + 10);
  const carry = f >= c.steals + 12;
  const esc = follow(ESCAPE, 1.4, (f - c.steals - 14) / 30);
  const work = follow(WORKER_PATH, 1.2, (f - c.hire + 4) / 30);
  const carryHead: V3 = [esc.x + Math.sin(esc.ry) * 0.42, 1.05, esc.z + Math.cos(esc.ry) * 0.42];
  const cam: Cam = {
    pos: keys3(f, [
      [0, [0.35, 1.75, VZ + 3.3]],
      [c.million - 1, [0.15, 1.68, VZ + 2.5]],
      [c.million, [-2.6, 3.4, VZ + 10.5]],
      [c.steal - 1, [-2.4, 3.2, VZ + 9.6]],
      [c.steal, [6.9, 1.45, VZ + 7.0]],
      [c.hire - 1, [6.6, 1.5, VZ + 6.6]],
      [c.hire, [-2.6, 2.1, VZ + 4.0]],
      [c.steals - 1, [-2.2, 2.0, VZ + 3.4]],
      [c.steals, [-1.5, 2.1, VZ + 2.6]],
      [c.dumb, [-0.5, 2.2, VZ + 7.4]],
      [c.y1911, [0.5, 2.3, VZ + 9.2]],
    ]),
    look: keys3(f, [
      [0, [0, 1.25, VZ]],
      [c.million - 1, [0, 1.3, VZ]],
      [c.million, [0, 1.6, VZ + 1.5]],
      [c.steal - 1, [0, 1.6, VZ + 1.5]],
      [c.steal, [2.2, 1.1, VZ + 2.2]],
      [c.hire - 1, [2.0, 1.1, VZ + 2.0]],
      [c.hire, [0.7, 1.3, VZ + 0.5]],
      [c.steals - 1, [0.6, 1.35, VZ + 0.4]],
      [c.steals, [1.1, 1.3, VZ + 1.0]],
      [c.dumb, [esc.x, 1.2, esc.z]],
      [c.y1911, [esc.x, 1.2, esc.z]],
    ]),
    fov: f < c.million ? 42 : f >= c.hire && f < c.steals ? 50 : 46,
  };
  // the robber sneaks in from the right side during "some want to steal it"
  const sneak = follow(
    [
      [5.0, VZ + 5.1],
      [3.4, VZ + 3.7],
    ],
    1.0,
    (f - c.steal + 6) / 30,
  );
  const count = keys(f, [
    [c.million, 0],
    [c.million + 24, 10_000_000],
  ]);
  return (
    <AbsoluteFill>
      <LouvreCanvas cam={cam} t={t} look="gallery" shadow={14}>
        <Gallery t={t} spot={1}>
          <group position={VIT_P}>
            <Vitrine t={t} panes={glassK} open={open} puh={!carry} blink={f > c.steal && f < c.steal + 4 ? 1 : 0} />
          </group>
          <Crowd t={t} f={f} skip={(fan) => (f >= c.hire && fan.x > 0.5 && fan.z > VZ + 2.6) || (f >= c.hire && fan.x > 2.0) || (f >= c.steal && fan.x > 1.2 && fan.z > VZ + 2.8)} flash={f < c.hire} />
          {f >= c.steal - 6 && f < c.hire ? <Model file="man_d.glb" anims={LIB1} clip={sneak.moving ? "Crouch_Fwd_Loop" : "Crouch_Idle_Loop"} t={t} p={[sneak.x, 0, sneak.z]} ry={sneak.ry} outfit={ROBBER} tint={{ Hair: "#151515" }} attach={{ bone: "Head", node: <Beanie /> }} /> : null}
          {f >= c.hire - 6 ? (
            carry ? (
              <>
                <Model file="man_c.glb" anims={LIB2} clip={esc.moving ? "Walk_Carry_Loop" : "Idle_Lantern_Loop"} t={t} p={[esc.x, 0, esc.z]} ry={esc.ry} outfit={WORKER} tint={{ Hair: "#2a1d14" }} />
                <group position={carryHead} rotation={[0, esc.ry, 0]}>
                  <FursuitHead s={0.55} t={t} />
                </group>
              </>
            ) : (
              <Model file="man_c.glb" anims={LIB1} clip={work.moving ? "Walk_Loop" : "Interact"} t={work.moving ? t : (f - c.hire) / 30} p={[work.x, 0, work.z]} ry={work.moving ? work.ry : Math.atan2(-work.x, VZ - work.z)} outfit={WORKER} tint={{ Hair: "#2a1d14" }} />
            )
          ) : null}
        </Gallery>
      </LouvreCanvas>
      <CounterPill o={f >= c.million && f < c.hire ? fadeIn(f, c.million) : 0} value={count} label="VISITORS / YEAR" top={200} />
      {f >= c.glassCase + 4 && f < c.steals ? <Tag x={640} y={760} text="GLASS CASE" o={fadeIn(f, c.glassCase + 4)} color="#8fd0ff" side="right" /> : null}
    </AbsoluteFill>
  );
};

export const SetClip1911: React.FC<SetProps> = ({ f }) => <Clipping f={f} at={c.y1911} year="1911" head="Painting stolen. The thief worked there" sub="He had helped build the glass case that was supposed to protect it." />;

// ───────────────────────── 1911: the Salon Carré ─────────────────────────
const P1911: [number, number][] = [
  [0, -10.6],
  [3.0, -8.0],
  [6.1, -5.5],
];
export const Set1911: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const took = f >= c.monday + 8;
  const w = follow(P1911, 1.4, (f - c.monday - 14) / 30);
  const doorOpen = ramp(f, c.plumber + 6, c.plumber + 20);
  const cam: Cam = {
    pos: keys3(f, [
      [c.monday, [-3.0, 2.2, -4.0]],
      [c.door - 1, [-2.4, 2.0, -3.4]],
      [c.door, [0.8, 1.9, -1.4]],
      [c.plumber - 1, [1.2, 1.9, -1.2]],
      [c.plumber, [2.6, 1.75, -1.6]],
      [c.police, [3.0, 1.75, -1.8]],
    ]),
    look: keys3(f, [
      [c.monday, [0, 1.6, -11]],
      [c.door - 1, [w.x * 0.5, 1.4, -8]],
      [c.door, [w.x, 1.2, w.z]],
      [c.plumber - 1, [w.x, 1.2, w.z]],
      [c.plumber, [6.4, 1.3, -5.0]],
      [c.police, [6.4, 1.3, -5.2]],
    ]),
    fov: 46,
  };
  const panelP: V3 = [w.x + Math.sin(w.ry) * 0.4, 1.1, w.z + Math.cos(w.ry) * 0.4];
  return (
    <Sepia>
      <LouvreCanvas cam={cam} t={t} look="warm" shadow={14}>
        <Salon1911 empty={took ? 1 : 0}>
          {took ? (
            <>
              <Model file="man_a.glb" anims={LIB2} clip={w.moving ? "Walk_Carry_Loop" : "Idle_Lantern_Loop"} t={t} p={[w.x, 0, w.z]} ry={w.ry} outfit={SMOCK} tint={{ Hair: "#1a1410" }} />
              {/* carried in front of him, picture side out */}
              <group position={panelP} rotation={[0, w.ry, 0]}>
                <PanelBack p={[0, 0, -0.02]} rot={[0, Math.PI, 0]} />
                <mesh position={[0, 0, 0.0]}>
                  <planeGeometry args={[0.53, 0.77]} />
                  <meshStandardMaterial map={monaPuhTex()} roughness={0.6} />
                </mesh>
              </group>
            </>
          ) : (
            <Model file="man_a.glb" anims={LIB1} clip="Interact" t={(f - c.monday + 10) / 30} p={[0, 0, -11.1]} ry={Math.PI} outfit={SMOCK} tint={{ Hair: "#1a1410" }} />
          )}
          {/* the plumber at the service door, unlocking it */}
          <Model file="man_d.glb" anims={LIB1} clip={f >= c.plumber ? "Interact" : "Idle_Loop"} t={f >= c.plumber ? (f - c.plumber) / 30 : t} p={[6.15, 0, -4.0]} ry={Math.PI - 0.3} outfit={PLUMBER} tint={{ Hair: "#2a1d14" }} />
          <group position={[5.5, 0, -3.4]}>
            <Toolbox />
          </group>
          <group position={[6.92, 1.25, -6.1]} rotation={[0, -doorOpen * 1.4, 0]}>
            <RB p={[0, 0, 0.6]} s={[0.1, 2.5, 1.2]} r={0.02} color="#4a3020" rough={0.6} />
          </group>
        </Salon1911>
      </LouvreCanvas>
      {f >= c.monday && f < c.door ? <Big x={540} y={300} text={"MONDAY · 21 AUG 1911\nMUSEUM CLOSED"} o={fadeIn(f, c.monday)} size={62} color="#ffe2a8" /> : null}
    </Sepia>
  );
};

export const SetPicasso: React.FC<SetProps> = ({ f }) => <SuspectCard f={f} at={c.police} stamp={c.picasso + 8} />;

// ───────────────────────── 1911–1913: the trunk ─────────────────────────
export const SetTrunk: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const open = ramp(f, c.trunk + 4, c.trunk + 18);
  const yr = Math.round(keys(f, [
    [c.years, 1911],
    [c.sell - 2, 1913],
  ]));
  const cam: Cam = { pos: keys3(f, [[c.trunk, [0.9, 1.75, 0.5]], [c.sell, [0.6, 1.8, 0.25]]]), look: [0, 0.4, -0.65], fov: 42 };
  return (
    <Sepia>
      <LouvreCanvas cam={cam} t={t} look="warm" shadow={6}>
        <Attic>
          <group position={[0, 0, -0.6]}>
            <Trunk open={open}>
              <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
                <planeGeometry args={[0.53 * 0.85, 0.77 * 0.85]} />
                <meshStandardMaterial map={monaPuhTex()} roughness={0.6} />
              </mesh>
            </Trunk>
          </group>
          {/* a wall calendar */}
          <RB p={[2.0, 1.7, -2.97]} s={[0.5, 0.65, 0.02]} r={0.01} color="#efe6cc" />
        </Attic>
      </LouvreCanvas>
      {f >= c.years ? <Big x={540} y={330} text={String(yr)} o={fadeIn(f, c.years)} size={150} color="#ffe2a8" /> : null}
    </Sepia>
  );
};

export const SetLetter: React.FC<SetProps> = ({ f }) => <LeonardoLetter f={f} at={c.sell} sign={c.leonardo} busted={c.twist - 6} />;

export const SetTwist: React.FC<SetProps> = ({ f }) => (
  <AbsoluteFill>
    <Headlines f={f} at={c.twist} free={c.free} />
    <Stamp f={f} at={c.free} text="FREE MARKETING" top={780} color="#2ec46a" rot={-8} size={100} />
  </AbsoluteFill>
);

// ───────────────────────── the fans attack + bulletproof + climate ─────────────────────────
const FRONT_Z = VZ + VITRINE.d / 2;
const THROWER: V3 = [1.7, 0, VZ + 4.3];
const GRANNY: V3 = [-1.9, 0, VZ + 4.1];
type Shot = { at: number; from: V3; hit: V3; kind: "rock" | "paint" | "cup" | "soup" | "cake" };
const shots = (): Shot[] => [
  { at: c.rock, from: [1.75, 1.7, VZ + 4.0], hit: [-0.25, 1.75, FRONT_Z], kind: "rock" },
  { at: c.paint, from: [1.75, 1.7, VZ + 4.0], hit: [0.3, 1.55, FRONT_Z], kind: "paint" },
  { at: c.teacup, from: [1.75, 1.7, VZ + 4.0], hit: [0.45, 2.05, FRONT_Z], kind: "cup" },
  { at: c.soup, from: [1.75, 1.7, VZ + 4.0], hit: [-0.35, 1.35, FRONT_Z], kind: "soup" },
  { at: c.cake + 4, from: [-1.75, 1.25, VZ + 3.8], hit: [0.0, 1.9, FRONT_Z], kind: "cake" },
];
const FLY = 9;
export const SetFans: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const S = shots();
  const clean = 1 - ramp(f, c.bullet, c.bullet + 10);
  const splats: Splat[] = [
    { kind: "crack", k: ramp(f, S[0].at + FLY, S[0].at + FLY + 3) * clean, at: [-0.25, -0.1 + 0.2], s: 0.8 },
    { kind: "paint", k: ramp(f, S[1].at + FLY, S[1].at + FLY + 4) * clean, at: [0.3, -0.12], s: 0.75 },
    { kind: "crack", k: ramp(f, S[2].at + FLY, S[2].at + FLY + 3) * clean, at: [0.45, 0.38], s: 0.35 },
    { kind: "soup", k: ramp(f, S[3].at + FLY, S[3].at + FLY + 4) * clean, at: [-0.35, -0.32], s: 0.8 },
    { kind: "cake", k: ramp(f, S[4].at + FLY, S[4].at + FLY + 4) * clean, at: [0.0, 0.22], s: 0.9 },
  ];
  const thick = ramp(f, c.bullet + 6, c.bullet + 22, easeOut);
  const ac = ramp(f, c.ac, c.ac + 12);
  const roll = follow(
    [
      [-3.4, VZ + 5.8],
      [GRANNY[0], GRANNY[2]],
    ],
    1.1,
    (f - c.grandma + 6) / 30,
  );
  const shake = (k: number) => (k > 0 && k < 1 ? Math.sin(k * 40) * 0.03 * (1 - k) : 0);
  const lastHit = S.reduce((acc, s) => (f >= s.at + FLY ? s.at + FLY : acc), -100);
  const jolt = shake(ramp(f, lastHit, lastHit + 8));
  const cam: Cam = {
    pos: keys3(f, [
      [c.fans, [4.6, 2.4, VZ + 9.0]],
      [c.rock - 1, [3.8, 2.2, VZ + 7.6]],
      [c.rock, [-1.3, 2.05, VZ + 3.3]],
      [c.grandma - 1, [-1.2, 2.0, VZ + 3.1]],
      [c.grandma, [-0.6, 2.6, VZ + 2.6]],
      [c.cake + 2, [-0.4, 2.5, VZ + 2.5]],
      [c.cake + 14, [1.5, 1.9, VZ + 5.2]],
      [c.bullet - 1, [1.4, 1.9, VZ + 5.0]],
      [c.bullet, [1.3, 1.85, VZ + 3.2]],
      [c.ac - 1, [1.0, 1.75, VZ + 2.9]],
      [c.ac, [-1.6, 1.2, VZ + 2.5]],
      [c.queue, [-1.5, 1.25, VZ + 2.3]],
    ]).map((v, i) => v + (i === 0 ? jolt : 0)) as V3,
    look: keys3(f, [
      [c.fans, [0, 1.4, VZ + 1]],
      [c.rock - 1, [0, 1.6, VZ + 0.6]],
      [c.rock, [0.3, 1.6, FRONT_Z]],
      [c.grandma - 1, [0.3, 1.6, FRONT_Z]],
      [c.grandma, [roll.x, 0.9, roll.z]],
      [c.cake + 2, [GRANNY[0], 0.95, GRANNY[2]]],
      [c.cake + 14, [0, 1.7, FRONT_Z]],
      [c.bullet - 1, [0, 1.7, FRONT_Z]],
      [c.bullet, [0, 1.7, FRONT_Z]],
      [c.ac - 1, [0, 1.6, FRONT_Z]],
      [c.ac, [0.2, 0.75, FRONT_Z]],
      [c.queue, [0.2, 0.8, FRONT_Z]],
    ]),
    fov: 44,
  };
  const thrower = S.filter((s) => s.kind !== "cake").reduce((acc, s) => (f >= s.at - 14 ? s : acc), null as Shot | null);
  return (
    <AbsoluteFill>
      <LouvreCanvas cam={cam} t={t} look="gallery" shadow={12}>
        <Gallery t={t}>
          <group position={VIT_P}>
            <Vitrine t={t} thick={thick} ac={ac} splats={splats} blink={S.some((s) => f >= s.at + FLY && f < s.at + FLY + 5) ? 1 : 0} />
          </group>
          <Crowd t={t} f={f} skip={(fan) => (Math.abs(fan.x - THROWER[0]) < 0.9 && Math.abs(fan.z - THROWER[2]) < 0.9) || (Math.abs(fan.x - GRANNY[0]) < 1.0 && Math.abs(fan.z - GRANNY[2]) < 1.0) || (fan.x < -2.2 && fan.z > VZ + 4.5)} flash={false} />
          {/* the thrower behind the barrier */}
          <Model file="man_b.glb" anims={LIB2} clip={thrower && f < thrower.at + 20 ? "OverhandThrow" : "Idle_FoldArms_Loop"} t={thrower && f < thrower.at + 20 ? (f - thrower.at + 14) / 30 : t} p={THROWER} ry={Math.PI + 0.35} outfit={tourist(3)} tint={{ Hair: "#5a3a20" }} />
          {/* the "grandma" in the wheelchair */}
          {f >= c.grandma - 2 ? (
            <group position={[roll.x, 0, roll.z]} rotation={[0, roll.moving ? roll.ry : Math.PI + 0.45, 0]}>
              <Wheelchair />
              <Model file="man_a.glb" anims={LIB1} clip="Sitting_Idle_Loop" t={t} p={[0, 0.06, 0.05]} ry={0} outfit={{ top: "#c86a9a", pants: "#6a4a7a", shoes: "#222", sleeves: 0.85 }} tint={{ Hair: "#d8d8de" }} attach={{ bone: "Head", node: <Wig /> }} />
              {f < S[4].at ? (
                <group position={[0, 0.82, 0.42]}>
                  <Cake s={0.9} />
                </group>
              ) : null}
            </group>
          ) : null}
          {/* things in the air */}
          {S.map((s, i) => {
            const k = (f - s.at) / FLY;
            if (k < 0 || k >= 1) return null;
            const p = lerp3(s.from, s.hit, k);
            p[1] += Math.sin(k * Math.PI) * 0.45;
            return (
              <group key={i} position={p} rotation={[k * 7, k * 5, 0]}>
                {s.kind === "rock" ? <Rock s={1} /> : s.kind === "paint" ? <Blob color="#c4141c" s={1.2} /> : s.kind === "cup" ? <Teacup /> : s.kind === "soup" ? <Blob color="#e4682a" s={1.3} /> : <Cake s={0.9} />}
              </group>
            );
          })}
          {/* the bounced teacup on the floor */}
          {f >= S[2].at + FLY && f < c.bullet ? (
            <group position={[0.6, 0.04, FRONT_Z + 0.5]} rotation={[Math.PI / 2, 0, 0.6]}>
              <Teacup />
            </group>
          ) : null}
        </Gallery>
      </LouvreCanvas>
      <YearTag f={f} at={S[0].at + FLY} until={S[1].at + FLY} year="1956" what="A ROCK" />
      <YearTag f={f} at={S[1].at + FLY} until={S[2].at + FLY} year="1974" what="RED PAINT" />
      <YearTag f={f} at={S[2].at + FLY} until={S[3].at + FLY} year="2009" what="A TEACUP" />
      <YearTag f={f} at={S[3].at + FLY} until={c.wheelchair} year="2024" what="SOUP" />
      <YearTag f={f} at={S[4].at + FLY} until={c.bullet} year="2022" what="CAKE" />
      {f >= c.bullet + 8 && f < c.ac ? <Big x={540} y={330} text="BULLETPROOF" o={pop(f, c.bullet + 8)} size={100} color="#8fd0ff" /> : null}
      {f >= c.ac ? <Big x={540} y={330} text={"18–21 °C · 64–70 °F\n50 % HUMIDITY"} o={fadeIn(f, c.ac + 4)} size={64} color="#a8e6ff" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── the queue ─────────────────────────
const LANES: [number, number][] = [
  [-5, -9],
  [5, -9],
  [5, -6.5],
  [-5, -6.5],
  [-5, -4],
  [5, -4],
  [5, -1.5],
  [-5, -1.5],
];
export const SetQueue: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const shuffle = (f - c.queue) / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.queue, [6.5, 12.5, 6.5]],
      [c.seconds, [5.0, 9.5, 2.0]],
      [c.entrance, [3.4, 6.0, -6.0]],
    ]),
    look: keys3(f, [
      [c.queue, [0, 0.5, -7.5]],
      [c.seconds, [0, 1.0, -10]],
      [c.entrance, [0, 1.2, VZ + 0.5]],
    ]),
    fov: 50,
  };
  // people standing along the lanes, shuffling forward
  const people: { x: number; z: number; ry: number; i: number; moving: boolean }[] = [];
  for (let i = 0; i < 26; i++) {
    const w = follow([...LANES].reverse() as [number, number][], 0.45, i * 1.65 + Math.min(shuffle, 3) * 0.6);
    const lane = Math.round(((w.z + 9) / 2.5) % 2);
    people.push({ x: w.x + (i % 2 ? 0.25 : -0.25), z: w.z + 1.2, ry: w.ry + (lane ? 0 : 0), i, moving: shuffle < 3 && i % 3 === 0 });
  }
  const timer = Math.max(0, 30 - Math.max(0, (f - c.seconds) / 30) * 14);
  return (
    <AbsoluteFill>
      <LouvreCanvas cam={cam} t={t} look="gallery" shadow={20}>
        <Gallery t={t} queue>
          <group position={VIT_P}>
            <Vitrine t={t} thick={1} ac={1} />
          </group>
          <Crowd t={t} f={f} flash={false} skip={(fan) => fan.i % 2 === 1} />
          {people.map((p) => (
            <Model key={p.i} file={PEOPLE[(p.i + 3) % PEOPLE.length]} anims={p.moving ? LIB1 : LIB2} clip={p.moving ? "Walk_Loop" : p.i % 4 === 0 ? "Idle_TalkingPhone_Loop" : "Idle_FoldArms_Loop"} t={t * 0.5 + p.i * 0.3} p={[p.x, 0, p.z]} ry={p.ry} outfit={tourist(p.i + 5)} tint={{ Hair: HAIR[(p.i + 2) % HAIR.length] }} />
          ))}
          <Model file="man_d.glb" anims={LIB2} clip="Idle_Rail_Call" t={t} p={[3.6, 0, VZ + 2.6]} ry={-2.2} outfit={GUARD} tint={{ Hair: "#1a1410" }} />
        </Gallery>
      </LouvreCanvas>
      {f >= c.seconds ? (
        <div style={{ position: "absolute", top: 230, width: "100%", display: "flex", justifyContent: "center", opacity: fadeIn(f, c.seconds) }}>
          <div style={{ padding: "10px 40px", borderRadius: 24, background: timer < 10 ? "#d0342c" : "rgba(6,10,22,0.85)", border: "4px solid #fff", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 110, color: "#fff", fontVariantNumeric: "tabular-nums" }}>0:{String(Math.ceil(timer)).padStart(2, "0")}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── the pyramid ─────────────────────────
export const SetPyramid: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const popK = ramp(f, c.pyramid - 2, c.pyramid + 14, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4));
  const reveal = ramp(f, c.panes, c.not666 - 4);
  const cam: Cam = {
    pos: keys3(f, [
      [c.entrance, [-150, 30, 40]],
      [c.pyramid, [-95, 18, 30]],
      [c.panes, [-62, 9, 22]],
      [c.not666, [-48, 6, 16]],
      [c.back, [-44, 5, 14]],
    ]),
    look: keys3(f, [
      [c.entrance, [10, 12, 0]],
      [c.pyramid, [0, 10, 0]],
      [c.panes, [0, 9, 0]],
      [c.not666, [0, 10, 0]],
      [c.back, [0, 10, 0]],
    ]),
    fov: 50,
  };
  const panes = Math.round(673 * reveal);
  return (
    <AbsoluteFill>
      <LouvreCanvas cam={cam} t={t} look="day" shadow={120}>
        <CourNapoleon t={t} reveal={reveal} pyrPop={Math.max(0.0001, popK)} />
        {/* visitors on the court */}
        {Array.from({ length: 14 }, (_, i) => {
          const w = follow(
            [
              [-60 + (i % 5) * 4, -20 + i * 3.1],
              [-24, -6 + (i % 7) * 2],
            ],
            1.2,
            t + i * 2.3,
          );
          return <Model key={i} file={PEOPLE[i % PEOPLE.length]} anims={LIB1} clip={w.moving ? "Walk_Loop" : "Idle_Loop"} t={t + i * 0.4} p={[w.x, 0, w.z]} ry={w.ry} outfit={tourist(i)} tint={{ Hair: HAIR[i % HAIR.length] }} />;
        })}
      </LouvreCanvas>
      <CounterPill o={f >= c.panes ? fadeIn(f, c.panes) : 0} value={panes} label="PANES" top={200} />
      {f >= c.not666 ? (
        <div style={{ position: "absolute", top: 400, width: "100%", display: "flex", justifyContent: "center", opacity: fadeIn(f, c.not666) }}>
          <div style={{ position: "relative", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 150, color: "#fff", WebkitTextStroke: "16px #000", paintOrder: "stroke fill" }}>
            666
            <div style={{ position: "absolute", left: -20, right: -20, top: "50%", height: 22, background: "#ff3b30", transform: `rotate(-12deg) scaleX(${ramp(f, c.not666 + 6, c.not666 + 12)})`, transformOrigin: "left center", borderRadius: 11 }} />
          </div>
        </div>
      ) : null}
      {f >= c.davinci ? <Tag x={140} y={720} text="THE DA VINCI CODE (2003)" o={fadeIn(f, c.davinci)} color="#ffd23f" side="right" size={36} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 2025: the heist (Sunday morning, 9:30) ─────────────────────────
const TRUCK_Z = 6.8;
const Thief: React.FC<{ i: number; clip: string; t: number; p: V3; ry: number; lib?: string }> = ({ i, clip, t, p, ry, lib = LIB1 }) => (
  <Model file={i ? "man_b.glb" : "man_d.glb"} anims={lib} clip={clip} t={t + i} p={p} ry={ry} outfit={ROBBER} tint={{ Hair: "#151515" }} attach={{ bone: "Head", node: <Beanie /> }} />
);
export const SetQuai: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const ext = ramp(f, c.truck, c.truck + 18, easeInOut);
  const ride = ramp(f, c.truck + 18, c.skip - 13, easeInOut);
  const smash = c.skip - 10;
  const broken = ramp(f, smash, smash + 3);
  const cam: Cam = {
    pos: keys3(f, [
      [c.back, [-18, 2.4, 26]],
      [c.truck - 1, [-15, 2.2, 23]],
      [c.truck, [-5.5, 1.5, 15.5]],
      [c.truck + 20, [-5.0, 2.6, 14.5]],
      [smash - 4, [-3.6, 6.4, 9.5]],
      [c.skip, [-3.2, 6.8, 8.6]],
    ]),
    look: keys3(f, [
      [c.back, [0, 6, 0]],
      [c.truck - 1, [0, 5.5, 1]],
      [c.truck, [0, 3.0, 4.5]],
      [c.truck + 20, [0, 4.5, 3]],
      [smash - 4, [0, 7.4, 1]],
      [c.skip, [0, 7.6, 0.8]],
    ]),
    fov: 48,
  };
  return (
    <AbsoluteFill>
      <LouvreCanvas cam={cam} t={t} look="day" shadow={30} key2={[-90, 70, 20]}>
        <Quai t={t} day broken={broken}>
          <group position={[QUAI_WIN[0], 0, TRUCK_Z]}>
            <LiftTruck reach={QUAI_WIN[1] - 2.0} ext={Math.max(0.05, ext)} ride={ride} lights={0}>
              {[-0.22, 0.22].map((x, i) => (
                <Thief key={i} i={i} clip={i === 0 && f >= smash - 12 && f < smash + 10 ? "Punch_Cross" : "Idle_Loop"} t={f >= smash - 12 ? (f - smash + 12) / 30 : t} p={[x, 0.04, 0]} ry={Math.PI} />
              ))}
            </LiftTruck>
          </group>
          <group position={[QUAI_WIN[0], QUAI_WIN[1] + 0.9, 0.3]}>
            <Shards k={(f - smash) / 22} dir={[0, 0, 0.6]} />
          </group>
        </Quai>
      </LouvreCanvas>
      {f >= c.y2025 ? <Big x={540} y={300} text={"SUNDAY, 19 OCT 2025\n9:30 AM · MUSEUM OPEN"} o={fadeIn(f, c.y2025)} size={58} color="#ffd23f" /> : null}
    </AbsoluteFill>
  );
};

/** stopwatch from the smash (0:00) to the escape (7:00) */
const Stopwatch: React.FC<{ f: number }> = ({ f }) => {
  const sec = Math.min(420, Math.max(0, keys(f, [[c.skip - 10, 0], [c.jewels + 20, 240], [c.minutes + 8, 420]])));
  const done = sec >= 420;
  return (
    <div style={{ position: "absolute", top: 1430, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ padding: "6px 30px", borderRadius: 20, background: done ? "#d0342c" : "rgba(6,10,22,0.85)", border: "4px solid #fff", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 80, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
        ⏱ {Math.floor(sec / 60)}:{String(Math.floor(sec % 60)).padStart(2, "0")}
      </div>
    </div>
  );
};

export const SetApollo: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const run = [0, 1].map((i) =>
    follow(
      [
        [1.6 - i * 0.3, -3.0 - i * 0.6],
        [-0.2 + i * 0.5, -8.3 - i * 0.5],
      ],
      3.6,
      (f - c.skip + 4) / 30 - i * 0.25,
    ),
  );
  const cut = [c.jewels + 2, c.jewels + 14];
  const grab = f >= c.jewels + 16;
  if (grab)
    run[0] = follow(
      [
        [-0.2, -8.3],
        [1.0, -4.0],
        [3.6, -1.6],
      ],
      2.6,
      (f - c.jewels - 18) / 30,
    );
  const cam: Cam = {
    pos: keys3(f, [
      [c.skip, [-0.8, 1.55, 0.2]],
      [c.jewels - 1, [-0.7, 1.6, -0.6]],
      [c.jewels, [1.7, 1.75, -6.0]],
      [c.minutes, [1.5, 1.7, -6.4]],
    ]),
    look: keys3(f, [
      [c.skip, [-0.6, 1.15, -5.0]],
      [c.jewels - 1, [-0.4, 1.15, -6.4]],
      [c.jewels, [-1.0, 1.1, -9.6]],
      [c.minutes, [-0.6, 1.2, -8.6]],
    ]),
    fov: f < c.jewels ? 56 : 50,
  };
  const sparking = f >= cut[0] && f < cut[1];
  return (
    <AbsoluteFill>
      <LouvreCanvas cam={cam} t={t} look="gallery" shadow={10}>
        <Apollo t={t} torch={0}>
          {/* the puh, ignored */}
          <group position={[-1.5, 0, -4.6]} rotation={[0, Math.PI / 2, 0]} scale={[0.8, 0.8, 0.8]}>
            <Vitrine t={t} thick={1} ac={0} blink={f > c.skip + 16 && f < c.skip + 20 ? 1 : 0} />
          </group>
          {[-9.6, -14.5].map((z, k) => (
            <group key={z} position={[-1.0, 0, z]}>
              <JewelCase broken={k === 0 ? ramp(f, cut[1] - 2, cut[1] + 1) : 0}>
                {!(k === 0 && grab) ? (
                  <group position={[0, 0.96, 0]}>
                    <Crown s={k === 0 ? 1 : 0.8} t={t} />
                  </group>
                ) : null}
                {[-0.45, 0.45].map((x) => (
                  <mesh key={x} position={[x, 0.98, 0.1]}>
                    <torusGeometry args={[0.1, 0.012, 6, 24]} />
                    <meshStandardMaterial color="#f4f8ff" metalness={1} roughness={0.15} emissive="#9ab8ff" emissiveIntensity={0.2} />
                  </mesh>
                ))}
              </JewelCase>
            </group>
          ))}
          {/* disc-cutter sparks on the case */}
          {sparking
            ? Array.from({ length: 10 }, (_, i) => {
                const k = ((f * 0.37 + i * 0.13) % 1);
                return <Glow key={i} position={[-0.55 + k * 0.5, 1.2 + Math.sin(i * 7 + f) * 0.08 - k * 0.3, -9.05 + k * 0.6]} size={0.18} color="#ffb040" opacity={1 - k} />;
              })
            : null}
          {sparking ? <pointLight position={[-0.5, 1.2, -9.0]} intensity={8 + 4 * Math.sin(f * 2.1)} distance={4} color="#ffb040" /> : null}
          {run.map((w, i) => (
            <Thief key={i} i={i} lib={i === 0 && grab ? LIB2 : LIB1} clip={i === 0 && grab ? "Walk_Carry_Loop" : w.moving ? "Jog_Fwd_Loop" : i === 0 && sparking ? "Fixing_Kneeling" : "Idle_Torch_Loop"} t={t} p={[w.x, 0, w.z]} ry={w.moving ? w.ry : Math.PI} />
          ))}
          {grab ? (
            <group position={[run[0].x + Math.sin(run[0].ry) * 0.42, 1.0, run[0].z + Math.cos(run[0].ry) * 0.42]}>
              <Crown s={1} t={t} />
            </group>
          ) : null}
          {/* the broken window they came through */}
          <mesh position={[4.48, 3.0, -1.6]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[1.8, 1.8]} />
            <meshBasicMaterial map={crackTex()} transparent depthWrite={false} />
          </mesh>
        </Apollo>
      </LouvreCanvas>
      {f >= c.jewels ? <CounterPill o={fadeIn(f, c.jewels)} value={keys(f, [[c.jewels, 0], [c.jewels + 20, 88_000_000]])} label="€ · $102 M" top={200} /> : null}
      <Stopwatch f={f} />
    </AbsoluteFill>
  );
};

/** In 7 minutes: back down the lift, off on two scooters; one crown left on the pavement. */
export const SetEscape: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const go = (f - c.minutes - 6) / 30;
  const cam: Cam = { pos: keys3(f, [[c.minutes, [-6.4, 0.75, 12.4]], [c.password, [-7.2, 0.8, 12.6]]]), look: keys3(f, [[c.minutes, [-5.6, 0.45, 7.2]], [c.password, [-8.0, 0.6, 6.6]]]), fov: 50 };
  return (
    <AbsoluteFill>
      <LouvreCanvas cam={cam} t={t} look="day" shadow={20} key2={[-90, 70, 20]}>
        <Quai t={t} day broken={1}>
          <group position={[QUAI_WIN[0], 0, TRUCK_Z]}>
            <LiftTruck reach={QUAI_WIN[1] - 2.0} ext={1} ride={0} lights={0} />
          </group>
          {[0, 1].map((i) => {
            const x = -2.6 - i * 1.4 - Math.max(0, go) * Math.max(0, go) * 6 - Math.max(0, go) * 3;
            const z = 4.4 + i * 1.1;
            return (
              <group key={i} position={[x, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
                <Scooter color={i ? "#3a3d44" : "#1d1f24"} spin={go * 20} />
                <Model file={i ? "man_b.glb" : "man_d.glb"} anims={LIB1} clip="Sitting_Idle_Loop" t={t} p={[0, 0.1, -0.25]} ry={0} outfit={ROBBER} tint={{ Hair: "#151515" }} attach={{ bone: "Head", node: <Beanie /> }} />
              </group>
            );
          })}
          {/* left behind on the pavement */}
          <group position={[-6.2, 0.17, 8.6]} rotation={[0.5, 0.4, 1.2]}>
            <Crown s={1.1} t={t} />
          </group>
        </Quai>
      </LouvreCanvas>
      <Stopwatch f={f} />
      {f >= c.minutes + 4 ? <Tag x={110} y={1180} text="1 CROWN LEFT BEHIND" o={fadeIn(f, c.minutes + 4)} color="#ffd23f" side="right" size={38} /> : null}
    </AbsoluteFill>
  );
};

export const SetPassword: React.FC<SetProps> = ({ f }) => (
  <AbsoluteFill>
    <LoginScreen f={f} at={c.password} typeAt={c.itWas + 4} granted={c.joke - 2} />
    <Stamp f={f} at={c.isnt + 2} text="TRUE · 2014 AUDIT" top={1380} color="#ff3b30" rot={-6} size={84} />
  </AbsoluteFill>
);

// ───────────────────────── its own room ─────────────────────────
export const SetOwnRoom: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.ownRoom, [0.5, 2.0, 5.2]],
      [c.ownEntrance, [2.4, 2.1, 3.4]],
      [c.ticket, [1.6, 1.9, 2.6]],
      [c.plan, [-1.0, 1.9, 3.6]],
      [c.congrats, [-1.6, 1.8, 3.2]],
    ]),
    look: keys3(f, [
      [c.ownRoom, [0, 1.4, -1.5]],
      [c.ownEntrance, [3.2, 2.0, -5.8]],
      [c.ticket, [3.2, 1.6, -5.8]],
      [c.plan, [-2.4, 2.4, -5.8]],
      [c.congrats, [-2.8, 2.6, -5.8]],
    ]),
    fov: 46,
  };
  return (
    <AbsoluteFill>
      <LouvreCanvas cam={cam} t={t} look="gallery" shadow={8}>
        <PuhRoom>
          <group position={[0, 0, -1.5]}>
            <Vitrine t={t} thick={1} ac={1} />
          </group>
        </PuhRoom>
      </LouvreCanvas>
      {f >= c.ownRoom && f < c.ownEntrance ? <Big x={540} y={300} text="ITS OWN ROOM" o={pop(f, c.ownRoom + 6)} size={92} color="#ffd23f" /> : null}
      {f >= c.ownEntrance && f < c.ticket ? <Big x={540} y={300} text="ITS OWN ENTRANCE" o={pop(f, c.ownEntrance)} size={84} color="#ffd23f" /> : null}
      <Ticket f={f} at={c.ticket} top={1080} />
      {f >= c.plan ? <Big x={540} y={300} text={"THE REAL PLAN\nFOR THE MONA LISA"} o={pop(f, c.plan)} size={72} color="#ffffff" /> : null}
      {f >= c.mona + 10 ? <Tag x={140} y={560} text="OWN ROOM · ~2031" o={fadeIn(f, c.mona + 10)} color="#ffd23f" side="right" size={36} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── payoff: fortress → palace → pyramid, then the dance ─────────────────────────
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const fort = 1 - ramp(f, c.palace, c.palace + 16);
  const rise = ramp(f, c.palace, c.palace + 22, easeOut);
  const pyr = ramp(f, c.pyrTop + 2, c.pyrTop + 16, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4));
  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [-250, 160, 40]],
      [c.pyrTop, [-200, 115, 30]],
      [c.allFor, [-120, 45, 20]],
      [c.callIt, [-55, 11, 12]],
      [c.louvre + 16, [-21.5, 2.0, 5.5]],
      [c.end, [-22.0, 1.75, 4.2]],
    ]),
    look: keys3(f, [
      [c.congrats, [0, 10, 0]],
      [c.pyrTop, [0, 8, 0]],
      [c.allFor, [-8, 6, 0]],
      [c.callIt, [-14, 4, 0]],
      [c.louvre + 16, [-26, 1.5, 0]],
      [c.end, [-26, 1.4, 0]],
    ]),
    fov: 46,
  };
  return (
    <AbsoluteFill>
      <LouvreCanvas cam={cam} t={t} look="day" shadow={f < c.callIt ? 150 : 20}>
        <CourNapoleon t={t} rise={rise} pyramid={pyr > 0.001} pyrPop={Math.max(0.0001, pyr)} />
        <Fortress o={fort} />
        <Model file="man_b.glb" anims={LIB1} clip="Dance_Loop" t={t} p={[-26, 0, 0]} ry={0.76} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} attach={{ bone: "Head", node: <FursuitHead s={MASK_S} t={t} p={WORN} /> }} />
        {Array.from({ length: 6 }, (_, i) => (
          <Model key={i} file={PEOPLE[(i + 2) % PEOPLE.length]} anims={LIB2} clip="Idle_Lantern_Loop" t={t + i * 0.5} p={[-30 + (i % 3) * 1.6 - 3, 0, -3.5 + i * 1.4]} ry={Math.atan2(4 + (i % 3) * 1.6, 3.5 - i * 1.4)} outfit={tourist(i + 2)} tint={{ Hair: HAIR[i % HAIR.length] }} attach={{ bone: "hand_r", node: <PhoneMesh p={[0.02, 0.09, 0.05]} rot={[1.35, 0.0, 0.2]} /> }} />
        ))}
      </LouvreCanvas>
      {f >= c.fortress && f < c.palace ? <Big x={540} y={300} text={"1190\nA FORTRESS"} o={pop(f, c.fortress)} size={80} color="#ffffff" /> : null}
      {f >= c.palace && f < c.pyrTop ? <Big x={540} y={300} text="A PALACE" o={pop(f, c.palace)} size={90} color="#ffffff" /> : null}
      {f >= c.pyrTop && f < c.callIt ? <Big x={540} y={300} text={"1989\nTHE PYRAMID"} o={pop(f, c.pyrTop + 4)} size={80} color="#8fd0ff" /> : null}
      {f >= c.louvre && f < c.follow ? <Big x={540} y={330} text="THE LOUVRE" o={pop(f, c.louvre)} size={120} color="#ffffff" /> : null}
      <FollowPill f={f} at={c.follow} until={c.end - 14} top={1220} />
    </AbsoluteFill>
  );
};
