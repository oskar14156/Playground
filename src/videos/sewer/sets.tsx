import React from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, TubePath, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { RB, Slab, Streetlight, tex } from "../../lib/three/diorama";
import { Grain } from "../../lib/ViewMode";
import { FollowPill } from "../../lib/Follow";
import { easeInOut, easeOut, keys, keys3, ramp } from "../../lib/timing";
import { c } from "./cues";
import { Alligator, BarScreen, Bucket, cobbleTex, DisplayCase, Fatberg, Flies, FlatCap, HardHat, Jet, PumpHandle, Rain, Rope, signTex, Stink, StreetPump, TBM, TopHat, Wipe } from "./props";
import { BATH, Bathroom, BrickTube, CommitteeRoom, EggSewer, MuseumRoom, Section, SECTION, SewerCanvas, Spot, Terrace, TOILET_P, Westminster, Works } from "./world";
import { AreaInsert, Big, BusCompare, Calendar, Cctv, CounterPill, FatCam, Pill, Question, RainGauge, SnowMap, Stamp, Tag, YearTag } from "./inserts";

export type SetProps = { f: number };
const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 10) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));

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
const VICT_M: Outfit = { top: "#3d3a40", pants: "#2c2a2e", shoes: "#151311", sleeves: 1, loose: "male" };
const VICT_W: Outfit = { top: "#2f3e5c", pants: "#3a2f2a", shoes: "#1a1410", sleeves: 1, loose: "female" };
const BRICKIE: Outfit = { top: "#cfc4a8", pants: "#4a4034", shoes: "#2a2018", sleeves: 0.7, loose: "male" };
const SUIT_W: Outfit = { top: "#f2f2ee", pants: "#f2f2ee", shoes: "#1c2a3a", sleeves: 1 };
const HIVIS: Outfit = { top: "#ff8a1c", pants: "#1f2a44", shoes: "#1a1a1a", sleeves: 1 };
const KID: Outfit = { top: "#7a6a52", pants: "#3e3a34", shoes: "#141210", sleeves: 1, loose: "male" };
const VISITOR = (i: number): Outfit => ({ top: ["#e05a47", "#4fa3a5", "#f2c14e", "#7a5cc4"][i % 4], pants: ["#2b3550", "#3b3b3b", "#c9b994"][i % 3], shoes: "#eeeeee", sleeves: 0.6, loose: i % 2 ? "female" : "male" });
const MASK_S = 0.5;
const WORN: V3 = [0, -0.2, 0.03];

const Sepia: React.FC<{ children: React.ReactNode; k?: number }> = ({ children, k = 0.9 }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ filter: `sepia(${k}) contrast(1.08) brightness(0.95) saturate(0.95)` }}>{children}</AbsoluteFill>
    <Grain amount={0.12} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(30,18,6,0.5) 100%)" }} />
  </AbsoluteFill>
);

// ───────────────────────── 1. HOOK: the bathroom ─────────────────────────
const BOWL: V3 = [TOILET_P[0], 0.36, TOILET_P[2] + 0.06];
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const spin = ramp(f, c.flushed + 6, c.down + 4, easeInOut);
  const slurp = ramp(f, c.down + 6, c.andNow - 2, (x) => x * x);
  const under = f >= c.andNow;
  const dropK = ramp(f, c.andNow + 2, c.place + 8, easeInOut);
  const press = f > c.flushed + 2 && f < c.flushed + 10 ? 1 : 0;
  const cam: Cam = under
    ? {
        pos: keys3(f, [
          [c.andNow, [1.9, 0.4, 4.4]],
          [c.pipe, [1.6, -1.2, 4.6]],
        ]),
        look: keys3(f, [
          [c.andNow, [TOILET_P[0], -0.6, BATH.z0 + 0.1]],
          [c.pipe, [TOILET_P[0], -2.3, BATH.z0 + 0.1]],
        ]),
        fov: 44,
      }
    : {
        pos: keys3(f, [
          [0, [-0.2, 1.95, 3.6]],
          [c.giant, [0.15, 1.6, 1.7]],
          [c.down - 1, [0.2, 1.5, 1.1]],
          [c.down, [0.1, 1.55, -0.2]],
          [c.andNow - 1, [0.08, 1.2, -0.38]],
        ]),
        look: keys3(f, [
          [0, [0.05, 0.95, -0.55]],
          [c.giant, [0.1, 0.6, -0.7]],
          [c.down - 1, [0.06, 0.45, -0.72]],
          [c.down, [BOWL[0], 0.25, BOWL[2]]],
          [c.andNow - 1, [BOWL[0], 0.2, BOWL[2]]],
        ]),
        fov: f >= c.down ? 46 : 40,
      };
  // the puh: sits in the bowl, spins with the water, gets slurped (squash + sink), then shoots down the x-ray pipe
  const puhS = 0.3 * (1 - 0.85 * slurp);
  const pipeY = -0.15 - dropK * 3.3;
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="interior" shadow={6} key2={[2.5, 5, 4]}>
        <Bathroom t={t} swirl={spin} press={press} xray={under ? 1 : 0}>
          {f < c.andNow ? (
            <group position={[BOWL[0], BOWL[1] - 0.12 * slurp, BOWL[2]]} rotation={[0, spin * 16 + slurp * 10, 0]} scale={[1 + slurp * 0.3, 1 - slurp * 0.9, 1 + slurp * 0.3]}>
              <FursuitHead s={puhS} t={t} blink={f > c.giant + 6 && f < c.giant + 10 ? 1 : 0} />
            </group>
          ) : f < c.pipe ? (
            <group position={[TOILET_P[0], pipeY, BATH.z0 + 0.12]} scale={[0.42, 0.62, 0.42]} rotation={[0, t * 6, 0]}>
              <FursuitHead s={0.3} t={t} />
            </group>
          ) : null}
          <Model file="man_a.glb" anims={LIB1} clip={f < c.flushed + 30 ? "Interact" : f < c.down + 10 ? "Idle_Loop" : "Idle_Talking_Loop"} t={f < c.flushed + 30 ? Math.max(0, (f - c.flushed + 14) / 30) : t} p={[0.62, 0, -0.42]} ry={-2.2} outfit={FRIEND} tint={{ Hair: "#3a2a1c" }} />
        </Bathroom>
      </SewerCanvas>
      {f >= c.flushed + 8 && f < c.andNow ? <Big x={540} y={330} text="FLUSHED" o={pop(f, c.flushed + 8)} color="#5ff2ff" size={110} /> : null}
      <Question f={f} at={c.place} until={c.pipe} text="WHERE DOES IT GO?" top={1250} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 2. 1850: a pipe straight into the river ─────────────────────────
const HOUSE_PIPE: V3[] = [
  [-7.5, -0.4, 0.3],
  [-7.5, -2.0, 0.3],
  [-2, -2.8, 0.3],
  [4, -3.5, 0.3],
  [6.8, -3.9, 0.3],
];
const ROW_P: V3 = [-20, 0, -0.4];
export const SetRiver: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const draw = ramp(f, c.pipe + 6, c.river1 + 14, easeInOut);
  const brown = ramp(f, c.drinks - 4, c.everybody + 10, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.pipe, [-1, -0.5, 42]],
      [c.done + 8, [0, -0.8, 37]],
      [c.drinks, [6.4, 1.45, 1.4]],
      [c.y1854, [6.5, 1.5, 1.2]],
    ]),
    look: keys3(f, [
      [c.pipe, [0, -2.5, 0]],
      [c.done + 8, [0.5, -2.6, 0]],
      [c.drinks, [4.9, 1.0, -1.9]],
      [c.y1854, [4.9, 1.05, -1.9]],
    ]),
    fov: 42,
  };
  const pts = HOUSE_PIPE.map((q) => new THREE.Vector3(...q));
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="overcast" shadow={40} key2={[-40, 60, 50]}>
        <Section t={t} era="1850" dirty={brown * 0.75}>
          <Terrace p={ROW_P} n={4} brick="#a98a5e" />
          <TubePath points={pts} progress={draw} radius={0.28} color="#26c6d9" glow />
          {/* outfall: brown plume spreading on the river */}
          {brown > 0.01 ? (
            <mesh position={[9, SECTION.riverY + 0.03, -2]} rotation={[-Math.PI / 2, 0, 0]} scale={[1 + brown * 2.2, 1 + brown * 1.6, 1]}>
              <circleGeometry args={[2.2, 32]} />
              <meshStandardMaterial color="#5a4422" transparent opacity={0.75 * brown} roughness={0.4} />
            </mesh>
          ) : null}
          {/* downstream: a woman takes drinking water from the river */}
          <group position={[4.9, 0, -1.9]}>
            <Model file="woman_b.glb" anims={LIB2} clip={f > c.everybody ? "Consume" : "Idle_FoldArms_Loop"} t={f > c.everybody ? (f - c.everybody) / 30 : t} p={[0, 0, 0]} ry={-0.5} outfit={VICT_W} tint={{ Hair: "#4a3020" }} />
            <Bucket p={[0.45, 0, 0.35]} fill="#6a5a32" />
          </group>
        </Section>
      </SewerCanvas>
      {f >= c.drinks + 8 ? <Tag x={640} y={1180} text="DRINKING WATER" o={fadeIn(f, c.drinks + 8)} color="#8fd0ff" side="right" /> : null}
      {f < c.drinks ? <Stamp f={f} at={c.done} text="DONE ✓" top={520} color="#3ecf6e" rot={-6} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. 1854: the Broad Street pump ─────────────────────────
const PUMP_P: V3 = [0, 0, -6];
const DOC_PATH: [number, number][] = [
  [1.3, -3.2],
  [0.78, -6.05],
];
export const SetPump: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const doc = follow(DOC_PATH, 1.25, (f - c.y1854) / 30);
  const off = f >= c.removed + 4;
  const cam: Cam = {
    pos: keys3(f, [
      [c.y1854, [3.6, 1.7, 1.6]],
      [c.handle - 1, [3.2, 1.65, -0.6]],
      [c.handle, [2.1, 1.75, -4.0]],
      [c.y1858, [2.2, 1.85, -3.6]],
    ]),
    look: keys3(f, [
      [c.y1854, [0, 1.2, -6]],
      [c.handle - 1, [0.2, 1.3, -6]],
      [c.handle, [0.4, 1.45, -6.2]],
      [c.y1858, [0.5, 1.55, -6.2]],
    ]),
    fov: f >= c.handle ? 44 : 46,
  };
  const cob = cobbleTex([10, 16]);
  return (
    <Sepia>
      <SewerCanvas cam={cam} t={t} look="sepia" shadow={18} key2={[8, 16, 4]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]} receiveShadow>
          <planeGeometry args={[14, 40]} />
          <meshStandardMaterial map={cob} roughness={0.9} />
        </mesh>
        <Terrace p={[-6.2, 0, 10]} ry={Math.PI / 2} n={6} brick="#a98a5e" />
        <Terrace p={[6.2, 0, -20]} ry={-Math.PI / 2} n={6} brick="#9a7a52" />
        <StreetPump p={PUMP_P} handle={off ? 0 : 1} handleAngle={f >= c.handle && !off ? 0.2 + 0.5 * Math.sin(ramp(f, c.handle, c.removed) * Math.PI) : 0.2} />
        <Model
          file="man_b.glb"
          anims={doc.moving ? LIB1 : LIB1}
          clip={doc.moving ? "Walk_Formal_Loop" : f >= c.handle && f < c.removed + 16 ? "Interact" : "Idle_Loop"}
          t={!doc.moving && f >= c.handle ? (f - c.handle) / 30 : t}
          p={[doc.x, 0, doc.z]}
          ry={doc.moving ? doc.ry : -Math.PI / 2}
          outfit={VICT_M}
          tint={{ Hair: "#2a2018" }}
          attach={[{ bone: "Head", node: <TopHat /> }, ...(off ? [{ bone: "hand_r", node: <PumpHandle p={[0.0, 0.05, 0.05]} rot={[0.3, 0, 0.2]} /> }] : [])]}
        />
        <group position={[-0.5, 0, -4.7]}>
          <Model file="woman_a.glb" anims={LIB2} clip="Idle_FoldArms_Loop" t={t + 1.3} p={[0, 0, 0]} ry={Math.PI - 0.3} outfit={VICT_W} tint={{ Hair: "#2a1a10" }} />
          <Bucket p={[0.35, 0, 0.2]} />
        </group>
      </SewerCanvas>
      <YearTag f={f} at={c.y1854 + 2} until={c.dirty} year="1854" what="SOHO, LONDON" top={240} />
      <SnowMap f={f} at={c.dirty} until={c.handle} cross={c.dirty + 34} />
    </Sepia>
  );
};

// ───────────────────────── 4. 1858: the Great Stink + Parliament ─────────────────────────
const WEST_LEN = 120;
export const SetStinkOutside: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.y1858, [24, 7, 44]],
      [c.smells, [14, 5.5, 26]],
    ]),
    look: [0, 9, -12],
    fov: 48,
  };
  const stinkO = ramp(f, c.stink - 6, c.stink + 12, easeOut);
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="overcast" shadow={80} fog={[60, 400]} bg="#a7ad94">
        <Westminster p={[-WEST_LEN / 2, 0, -10]} len={WEST_LEN} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 30]}>
          <planeGeometry args={[400, 70]} />
          <meshPhysicalMaterial color="#5b5530" roughness={0.12} clearcoat={1} />
        </mesh>
        {/* far bank */}
        <mesh position={[0, 0, 70]}>
          <boxGeometry args={[400, 3, 10]} />
          <meshStandardMaterial color="#6a6a50" />
        </mesh>
        <group scale={5}>
          <Stink p={[2, -0.1, 4]} t={t} n={34} w={16} h={4} o={0.4 + 0.6 * stinkO} thick={0.09} />
        </group>
        {/* rubbish floating */}
        {Array.from({ length: 14 }, (_, k) => (
          <RB key={k} p={[-30 + k * 5 + Math.sin(k) * 2, -0.5, 14 + ((k * 7) % 20)]} s={[0.8, 0.2, 0.5]} r={0.08} rot={[0, k, 0]} color={k % 3 ? "#4a3c22" : "#6e6040"} />
        ))}
      </SewerCanvas>
      <YearTag f={f} at={c.y1858 + 2} until={c.smells} year="1858" what="THE GREAT STINK" top={240} color="#9bd84a" />
    </AbsoluteFill>
  );
};

const MPS: { p: [number, number]; file: string; hair: string }[] = [
  { p: [-1.1, 1.7], file: "man_c.glb", hair: "#2a2018" },
  { p: [0.1, 1.95], file: "man_d.glb", hair: "#8a8a8a" },
  { p: [1.2, 1.65], file: "man_b.glb", hair: "#5a3a20" },
];
export const SetParliament: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const throwK = ramp(f, c.parliament + 4, c.parliament + 22);
  const wet = ramp(f, c.parliament + 16, c.bleach + 20, easeOut);
  const stinkIn = ramp(f, c.noWork - 4, c.noWork + 16, easeOut);
  const run = f >= c.nothing + 6;
  const cam: Cam = {
    pos: keys3(f, [
      [c.smells, [0.4, 1.9, 5.2]],
      [c.parliament, [1.6, 1.7, 1.2]],
      [c.noWork - 1, [1.4, 1.75, 1.0]],
      [c.noWork, [0, 1.8, 5.0]],
      [c.nothing, [0, 2.0, 5.6]],
      [c.tunnels, [0, 2.6, 6.4]],
    ]),
    look: keys3(f, [
      [c.smells, [0, 1.8, -3]],
      [c.parliament, [-1.6, 2.2, -3.6]],
      [c.noWork - 1, [-1.7, 2.2, -3.6]],
      [c.noWork, [0, 1.7, -2]],
      [c.nothing, [0, 1.5, -1]],
      [c.tunnels, [0, 1.3, 0]],
    ]),
    fov: 50,
  };
  // the servant throws a bucket of bleach (chloride of lime) at the left curtains
  const splash: V3[] = Array.from({ length: 16 }, (_, k) => {
    const u = Math.min(1, Math.max(0, (f - c.parliament - 10 - k * 0.4) / 10));
    return [-0.9 - u * 0.9 + Math.sin(k) * 0.1, 1.45 + u * 0.9 - u * u * 0.8 + Math.cos(k * 1.3) * 0.15, -2.9 - u * 0.8];
  });
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="interior" shadow={10} key2={[2, 7, 5]}>
        <CommitteeRoom t={t} wet={wet}>
          <Stink p={[0, 0.8, -3.6]} t={t} n={14} w={3} h={2.6} o={stinkIn} thick={0.05} />
          {/* servant with the bucket */}
          {f < c.noWork + 10 ? (
            <Model
              file="man_c.glb"
              anims={LIB2}
              clip={f >= c.parliament + 2 && f < c.parliament + 30 ? "OverhandThrow" : "Idle_Lantern_Loop"}
              t={f >= c.parliament + 2 ? (f - c.parliament - 2) / 30 : t}
              p={[-0.8, 0, -2.75]}
              ry={-2.6}
              outfit={{ top: "#5a5048", pants: "#2e2a26", shoes: "#111", sleeves: 1, loose: "male" }}
              tint={{ Hair: "#1a1410" }}
              attach={{ bone: "hand_r", node: <Bucket p={[0, -0.05, 0.05]} rot={[throwK > 0.4 ? 2.4 : 0.2, 0, 0]} /> }}
            />
          ) : null}
          {f > c.parliament + 10 && f < c.parliament + 34
            ? splash.map((q, k) => (
                <mesh key={k} position={q}>
                  <sphereGeometry args={[0.04 + (k % 3) * 0.015, 8, 6]} />
                  <meshStandardMaterial color="#f2f6e6" transparent opacity={0.8} emissive="#ffffff" emissiveIntensity={0.3} />
                </mesh>
              ))
            : null}
          {/* MPs: arms folded → shake heads → sprint out */}
          {MPS.map((m, i) => {
            const r = follow(
              [
                [m.p[0], m.p[1]],
                [m.p[0] * 1.6 + (i - 1) * 0.6, 9],
              ],
              5.2,
              (f - c.nothing - 6 - i * 3) / 30,
            );
            const pos: V3 = run ? [r.x, 0, r.z] : [m.p[0], 0, m.p[1]];
            if (run && !r.moving) return null;
            return (
              <Model
                key={i}
                file={m.file}
                anims={run ? LIB1 : LIB2}
                clip={run ? "Sprint_Loop" : f >= c.noWork ? "Idle_No_Loop" : "Idle_FoldArms_Loop"}
                t={t + i * 0.4}
                p={pos}
                ry={run ? r.ry : Math.PI + (i - 1) * 0.25}
                outfit={VICT_M}
                tint={{ Hair: m.hair }}
                attach={{ bone: "Head", node: <TopHat /> }}
              />
            );
          })}
        </CommitteeRoom>
      </SewerCanvas>
      {f >= c.bleach && f < c.noWork ? <Tag x={330} y={700} text="BLEACH" o={fadeIn(f, c.bleach)} color="#f2f6e6" side="right" /> : null}
      <Calendar f={f} at={c.law} until={c.nothing} />
      {f < c.nothing ? <Stamp f={f} at={c.days + 8} text="SEWER LAW PASSED" top={980} color="#ff3b30" rot={-8} size={84} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. 1860s: brick tunnels ─────────────────────────
const SEW: V3 = [2.5, -6, 0];
export const SetBricks: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const built = ramp(f, c.tunnels, c.miles + 20, easeInOut);
  const wideK = ramp(f, c.twice, c.twice + 18, easeInOut);
  const h = 2.0 * (1 + wideK);
  const today = f >= c.today;
  if (today) return <SetToday f={f} />;
  const bricks = keys(f, [
    [c.bricks, 0],
    [c.bricks + 24, 318_000_000],
  ]);
  const cam: Cam = {
    pos: keys3(f, [
      [c.tunnels, [1, -2, 46]],
      [c.miles, [3.5, -3.5, 16]],
      [c.bricks, [3.3, -4.6, 5.5]],
      [c.wide, [2.5, -4.6, 17]],
      [c.today - 1, [2.5, -4.4, 19]],
    ]),
    look: keys3(f, [
      [c.tunnels, [1, -3, 0]],
      [c.miles, [2.5, -5, -2]],
      [c.bricks, [2.5, -5.2, -5]],
      [c.wide, [2.5, -4.6, 0]],
      [c.today - 1, [2.5, -4.4, 0]],
    ]),
    fov: 42,
  };
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="day" shadow={40} key2={[-30, 50, 40]}>
        <Section t={t} era="1860" dirty={0.5} holes={[{ x: SEW[0], y: SEW[1], h }]}>
          <Terrace p={ROW_P} n={4} brick="#a98a5e" />
          <EggSewer p={SEW} h={h} built={built} flow={f >= c.wide ? 0.35 * (1 + wideK) : 0} t={t} glow={wideK > 0.01 && wideK < 0.99 ? 1 : 0} />
          {/* lamps inside the bore so the bricklayers read */}
          <pointLight position={[SEW[0], SEW[1] + 1.4, -2]} intensity={14} distance={14} color="#ffd9a0" />
          <pointLight position={[SEW[0], SEW[1] + 1.2, -6]} intensity={10} distance={10} color="#ffd9a0" />
          {f < c.wide
            ? [
                { z: -1.4, ry: 0.3, x: -0.35 },
                { z: -3.4, ry: -0.4, x: 0.35 },
                { z: -5.6, ry: 0.2, x: -0.2 },
              ].map((w, i) =>
                built * 30 > -w.z + 1 ? (
                  <Model key={i} file={["man_c.glb", "man_a.glb", "man_d.glb"][i]} anims={LIB1} clip="Fixing_Kneeling" t={t + i * 0.7} p={[SEW[0] + w.x, SEW[1] + 0.05, w.z]} ry={Math.PI + w.ry} outfit={BRICKIE} tint={{ Hair: "#3a2a1c" }} attach={{ bone: "Head", node: <FlatCap /> }} />
                ) : null,
              )
            : null}
        </Section>
      </SewerCanvas>
      <Pill o={f >= c.miles && f < c.wide ? fadeIn(f, c.miles) : 0} value="1,100 MILES" label="1,770 KM OF SEWERS" top={190} color="#ff9f1c" />
      <CounterPill o={f >= c.bricks && f < c.wide ? fadeIn(f, c.bricks) : 0} value={bricks} label="BRICKS" top={330} />
      <AreaInsert f={f} at={c.twice} four={c.four} until={c.today} />
    </AbsoluteFill>
  );
};

/** today: a sewer flusher with a head torch walks the same Victorian tunnel */
const SetToday: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const w = follow(
    [
      [0.2, -1.6],
      [0.2, -9],
    ],
    1.1,
    (f - c.today + 4) / 30,
  );
  const cam: Cam = { pos: [-0.45, 1.55, 1.2], look: [0.2, 1.1, -7], fov: 56 };
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="tunnel" shadow={8} key2={[0, 2.5, -2]}>
        <BrickTube r={1.5} len={50} flow={0.3} t={t} />
        <Model file="man_d.glb" anims={LIB1} clip={w.moving ? "Walk_Loop" : "Idle_Torch_Loop"} t={t} p={[w.x, 0.1, w.z]} ry={Math.PI} outfit={HIVIS} tint={{ Hair: "#2a2018" }} attach={{ bone: "Head", node: <HardHat color="#f4f4f0" /> }} />
        <Spot p={[w.x, 1.85, w.z - 0.2]} target={[w.x, 0.4, w.z - 7]} angle={0.55} intensity={45} distance={18} color="#fff3d0" />
        <pointLight position={[0, 2.2, 0.5]} intensity={4} distance={9} color="#9fb4ff" />
      </SewerCanvas>
      {f >= c.today + 6 ? <Tag x={600} y={560} text="BUILT 1860s · STILL IN USE" o={fadeIn(f, c.today + 6)} color="#ff9f1c" side="left" size={34} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 6. rain: overflow into the river ─────────────────────────
const CSO: V3[] = [
  [4.0, -3.6, 0.3],
  [5.2, -3.9, 0.3],
  [6.8, -4.2, 0.3],
];
export const SetRain: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const mm = 2 * ramp(f, c.mm - 10, c.mm + 8, easeOut);
  const fill = ramp(f, c.rain + 4, c.overflow + 4, easeInOut);
  const over = ramp(f, c.overflow, c.back + 10, easeOut);
  const puhK = ramp(f, c.included - 6, c.included + 10, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.rain, [1.5, -1, 46]],
      [c.overflow, [4, -2.5, 24]],
      [c.included - 4, [12.5, 1.6, 9.5]],
      [c.y2025, [13, 1.8, 10]],
    ]),
    look: keys3(f, [
      [c.rain, [1.5, -3, 0]],
      [c.overflow, [4, -4.2, 0]],
      [c.included - 4, [9.8, -2.1, -1]],
      [c.y2025, [9.8, -2.0, -1]],
    ]),
    fov: 42,
  };
  const pts = CSO.map((q) => new THREE.Vector3(...q));
  const bob = Math.sin(t * 3) * 0.06;
  const puhP: V3 = [6.8 + puhK * 3.2, SECTION.riverY + 0.05 + bob - (1 - puhK) * 2.6, -1.0];
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="overcast" shadow={40} key2={[-30, 50, 40]} keyI={0.8}>
        <Section t={t} era="modern" dirty={over * 0.7} holes={[{ x: SEW[0], y: SEW[1], h: 4 }]}>
          <Terrace p={ROW_P} n={4} brick="#a98a5e" />
          <EggSewer p={SEW} h={4} built={1} flow={0.5 + fill * 2.6} water="#4f5a4a" t={t} />
          <TubePath points={pts} progress={over > 0 ? 1 : 0} radius={0.3} color={over > 0 ? "#8a6a2a" : "#26c6d9"} opacity={over > 0 ? 1 : 0.5} glow={over > 0} />
          {over > 0.01 ? (
            <mesh position={[9, SECTION.riverY + 0.03, -1.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[1 + over * 2.4, 1 + over * 1.6, 1]}>
              <circleGeometry args={[2.0, 32]} />
              <meshStandardMaterial color="#5a4422" transparent opacity={0.7 * over} roughness={0.4} />
            </mesh>
          ) : null}
          <Rain c={[-8, 6, -4]} size={[50, 14, 16]} t={t} o={ramp(f, c.rain, c.rain + 10)} />
          {f >= c.included - 6 ? (
            <group position={puhP} rotation={[0.3 * Math.sin(t * 2), t * 0.8, 0.2 * Math.cos(t * 2.3)]}>
              <FursuitHead s={0.9} t={t} blink={f > c.included + 14 && f < c.included + 18 ? 1 : 0} />
            </group>
          ) : null}
        </Section>
      </SewerCanvas>
      <RainGauge o={f >= c.rain && f < c.tonnes39 ? fadeIn(f, c.rain) : 0} mm={mm} top={190} />
      {f >= c.overflow + 4 && f < c.included ? <Tag x={520} y={1040} text="OVERFLOW" o={fadeIn(f, c.overflow + 4)} color="#ff6b3d" side="right" /> : null}
      <CounterPill
        o={f >= c.tonnes39 ? fadeIn(f, c.tonnes39) : 0}
        value={keys(f, [
          [c.tonnes39, 0],
          [c.tonnes39 + 22, 39_000_000],
        ])}
        label="TONNES A YEAR INTO THE THAMES"
        top={190}
      />
    </AbsoluteFill>
  );
};

// ───────────────────────── 7. 2025: the super sewer ─────────────────────────
const TW: V3 = [24, -58, 0];
export const SetTideway: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const bt = ramp(f, c.y2025, c.superSewer + 10, easeInOut);
  const tz = -9 + bt * 9.6;
  const cam: Cam = {
    pos: keys3(f, [
      [c.y2025, [27, -54, 24]],
      [c.superSewer + 6, [28, -53, 28]],
      [c.km, [14, -36, 95]],
      [c.deep, [9, -32, 122]],
      [c.wipes, [9, -32, 126]],
    ]),
    look: keys3(f, [
      [c.y2025, [24, -58, 0]],
      [c.superSewer + 6, [24, -58, 0]],
      [c.km, [12, -38, 0]],
      [c.deep, [9, -34, 0]],
      [c.wipes, [9, -34, 0]],
    ]),
    fov: 42,
  };
  const dust = ramp(f, c.superSewer - 8, c.superSewer + 30);
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="day" shadow={120} key2={[-60, 80, 120]} fog={[200, 900]}>
        <Section t={t} era="modern" deep={80} dirty={0.2} holes={[{ x: TW[0], y: TW[1], circle: 4.45 }, { x: SEW[0], y: SEW[1], h: 4 }]}>
          <Terrace p={ROW_P} n={4} brick="#a98a5e" />
          <EggSewer p={SEW} h={4} built={1} flow={0.6} t={t} />
          {/* drop shaft from the old overflow down to the new tunnel */}
          <mesh position={[5.0, -32.5, 0.6]}>
            <cylinderGeometry args={[1.4, 1.4, 52, 24, 1, true]} />
            <meshStandardMaterial color="#26c6d9" emissive="#26c6d9" emissiveIntensity={0.8} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <TubePath
            points={[
              [4.0, -3.6, 0.5],
              [5.0, -6.5, 0.5],
            ].map((q) => new THREE.Vector3(...(q as V3)))}
            progress={1}
            radius={0.3}
            color="#26c6d9"
            glow
          />
          {/* the bored tunnel behind the cutter (concrete lining) + the TBM breaking through the cut face */}
          <mesh position={[TW[0], TW[1], -24]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[4.45, 4.45, 48, 40, 1, true]} />
            <meshStandardMaterial color="#6e6a62" roughness={0.9} side={THREE.BackSide} />
          </mesh>
          <group position={[TW[0], TW[1], tz]} rotation={[0, Math.PI / 2, 0]}>
            <TBM d={8.8} spin={t * 1.6} len={12} />
          </group>
          {dust > 0.01 && dust < 0.99
            ? Array.from({ length: 30 }, (_, k) => {
                const a = k * 2.4;
                const r = 3 + dust * 6 * ((k % 5) / 5 + 0.4);
                return (
                  <RB key={k} p={[TW[0] + Math.cos(a) * r, TW[1] + Math.sin(a) * r - dust * dust * 6, 1 + dust * 6 * ((k % 3) / 3 + 0.3)]} s={[0.5, 0.4, 0.45]} r={0.1} rot={[k, k * 2, 0]} color="#7a7060" />
                );
              })
            : null}
          {/* depth ruler */}
          <group position={[-4, 0, 0.6]}>
            <RB p={[0, -35, 0]} s={[0.4, 70, 0.2]} r={0.05} color="#ffd23f" />
            {Array.from({ length: 8 }, (_, k) => (
              <RB key={k} p={[0.6, -k * 10, 0]} s={[1.4, 0.3, 0.2]} r={0.05} color="#ffd23f" />
            ))}
          </group>
        </Section>
        <Glow position={[TW[0], TW[1], 1]} size={18} color="#fff1c0" opacity={0.25 * dust * (1 - dust)} />
      </SewerCanvas>
      <YearTag f={f} at={c.y2025 + 2} until={c.km} year="2025" what="SUPER SEWER" top={240} color="#26c6d9" />
      <Pill o={f >= c.km ? fadeIn(f, c.km) : 0} value="25 KM" label="15.5 MILES LONG" top={190} color="#26c6d9" />
      {f >= c.km + 6 ? <Tag x={760} y={1330} text="SUPER SEWER" o={fadeIn(f, c.km + 6)} color="#26c6d9" side="left" /> : null}
      <Pill o={f >= c.deep ? fadeIn(f, c.deep) : 0} value="70 M" label="230 FT DEEP" top={320} color="#ffd23f" />
    </AbsoluteFill>
  );
};

// ───────────────────────── 8. wipes + fat → fatberg (CCTV) ─────────────────────────
export const SetWipes: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const grow = ramp(f, c.fatberg - 6, c.whitechapel, easeOut);
  const fatK = ramp(f, c.fat, c.fatberg, easeOut);
  const cam: Cam = { pos: [0, 1.35, -1], look: [0, 0.75, -14], fov: 72 };
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="tunnel" shadow={6} key2={[0, 2.5, 0]}>
        <BrickTube r={1.4} len={60} flow={0.35} t={t} />
        <pointLight position={[0, 1.5, -1.6]} intensity={16} distance={22} color="#e6f3ff" />
        <pointLight position={[0, 1.6, -9]} intensity={6} distance={10} color="#e6f3ff" />
        {/* wipes drifting toward the camera on the flow */}
        {Array.from({ length: 22 }, (_, k) => {
          const z = -26 + (((t - c.wipes / 30) * 1.6 + k * 1.15) % 24.5);
          const stuck = grow > 0 && z < -9 && z > -12;
          return f >= c.wetWipes - 6 ? <Wipe key={k} p={[Math.sin(k * 2.1) * 0.5, 0.37 + (k % 3) * 0.03, stuck ? -9.5 - (k % 4) * 0.4 : z]} rot={[-Math.PI / 2 + Math.sin(k) * 0.4, k, Math.sin(t + k) * 0.3]} s={0.42} dirty={k % 2} /> : null;
        })}
        {/* fat lumps clinging to the walls, growing */}
        {fatK > 0.01
          ? Array.from({ length: 10 }, (_, k) => (
              <Fatberg key={k} p={[(k % 2 ? 1 : -1) * 1.0, 0.45 + (k % 3) * 0.2, -6 - k * 1.4]} s={[0.22, 0.18, 0.3]} seed={k + 2} grow={fatK} />
            ))
          : null}
        {grow > 0.01 ? <Fatberg p={[0, 1.0, -8.5]} s={[1.3, 1.1, 2.6]} seed={9} grow={grow} /> : null}
        <pointLight position={[0, 2.0, -5.5]} intensity={grow * 10} distance={8} color="#fff1d0" />
      </SewerCanvas>
      <Cctv f={f} label="WHITECHAPEL RD" />
      {f >= c.fatberg + 6 ? <Big x={540} y={420} text="FATBERG" o={pop(f, c.fatberg + 6)} color="#ffd23f" size={120} /> : null}
    </AbsoluteFill>
  );
};

export const SetFatberg: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.whitechapel, [0.85, 1.7, 3.2]],
      [c.buses, [0.6, 1.55, 1.6]],
    ]),
    look: [0, 1.0, -6],
    fov: 62,
  };
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="tunnel" shadow={6} key2={[0, 2.6, 1]}>
        <BrickTube r={1.6} len={60} flow={0.3} t={t} />
        <Fatberg p={[0, 1.05, -12]} s={[1.55, 1.25, 8.5]} seed={11} />
        <Model file="man_a.glb" anims={LIB2} clip="Farm_Watering" t={t} p={[-0.35, 0.05, -2.2]} ry={Math.PI + 0.1} outfit={SUIT_W} tint={{ Hair: "#2a2018" }} attach={[{ bone: "Head", node: <HardHat color="#f4f4f0" /> }, { bone: "hand_r", node: <Jet p={[0, 0.0, 0.08]} rot={[0.3, 0, 0]} t={t} len={2.4} /> }]} />
        <Spot p={[-0.35, 1.9, -2.0]} target={[0, 1, -6]} angle={0.55} intensity={40} distance={16} color="#fff3d0" />
        <pointLight position={[0.6, 1.8, 1.5]} intensity={5} distance={10} color="#c9d8ff" />
        <pointLight position={[0.8, 2.4, -5.5]} intensity={14} distance={9} color="#ffe6b8" />
      </SewerCanvas>
      {f >= c.whitechapel + 4 && f < c.buses ? <YearTag f={f} at={c.whitechapel + 4} until={c.buses} year="2017" what="WHITECHAPEL" top={240} /> : null}
      <Pill o={f >= c.t130 ? fadeIn(f, c.t130) : 0} value="130 TONNES" label="143 TONS" top={f >= c.buses ? 190 : 380} color="#ffd23f" />
      <Pill o={f >= c.t130 + 14 && f < c.buses ? fadeIn(f, c.t130 + 14) : 0} value="250 M" label="820 FT LONG" top={510} color="#ffd23f" />
      <BusCompare f={f} at={c.buses} until={c.museum} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 9. the museum + FatCam ─────────────────────────
export const SetMuseum: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const flies = ramp(f, c.flies, c.flies + 10);
  const mould = ramp(f, c.mould, c.mould + 24, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.museum, [1.8, 2.1, 6.6]],
      [c.flies - 1, [0.9, 1.6, 2.2]],
      [c.flies, [0.55, 1.55, 0.35]],
      [c.stream, [0.5, 1.5, 0.2]],
    ]),
    look: keys3(f, [
      [c.museum, [0, 1.9, -2.2]],
      [c.flies - 1, [0, 1.15, -1.5]],
      [c.flies, [0, 1.1, -1.5]],
      [c.stream, [0, 1.1, -1.5]],
    ]),
    fov: f >= c.flies ? 38 : 44,
  };
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="museum" shadow={10} key2={[2, 6, 4]} keyI={0.6}>
        <MuseumRoom>
          <DisplayCase p={[0, 0, -1.5]} w={1.4} h={0.8} d={0.9} label={signTex("FATBERG", "Whitechapel, 2017", "#e8e2d0", "#1a1a1a")}>
            <Fatberg p={[0, 0.2, 0]} s={[0.48, 0.2, 0.3]} seed={5} mould={mould} />
          </DisplayCase>
          <Flies c={[0, 1.25, -1.5]} t={t} n={16} r={0.42} o={flies} size={1.35} />
          <Spot p={[0.8, 4.2, 0.8]} target={[0, 1, -1.5]} angle={0.32} intensity={26} distance={12} color="#fff1dc" />
          {[
            { p: [-1.3, 0, 0.1] as V3, ry: 2.6, clip: "Idle_FoldArms_Loop", file: "woman_c.glb" },
            { p: [1.35, 0, 0.3] as V3, ry: -2.5, clip: "Idle_Lantern_Loop", file: "man_c.glb" },
            { p: [-2.2, 0, 1.4] as V3, ry: 2.8, clip: "Idle_TalkingPhone_Loop", file: "woman_a.glb" },
          ].map((v, i) => (
            <Model key={i} file={v.file} anims={LIB2} clip={v.clip} t={t + i} p={v.p} ry={v.ry} outfit={VISITOR(i)} tint={{ Hair: ["#1a1410", "#d9b46a", "#5a3a20"][i] }} />
          ))}
        </MuseumRoom>
      </SewerCanvas>
      <FatCam f={f} at={c.stream} until={c.isnt + 2}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 58%, #b9ad8a 0%, #8e8262 22%, #2a2620 48%, #121212 100%)" }} />
        <div style={{ position: "absolute", left: "30%", top: "52%", width: 60, height: 40, borderRadius: 30, background: "#ffe45a", opacity: 0.8, filter: "blur(2px)" }} />
        <div style={{ position: "absolute", left: "55%", top: "60%", width: 40, height: 30, borderRadius: 20, background: "#ffe45a", opacity: 0.8, filter: "blur(2px)" }} />
      </FatCam>
      <Stamp f={f} at={c.isnt} text="IT ISN'T." top={1240} color="#ff3b30" rot={-7} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 10. 1935, New York: the alligator ─────────────────────────
const DRAIN: V3 = [0, 0, -2.6];
export const SetGator: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const up = ramp(f, c.gator - 14, c.gator + 18, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.ny, [3.8, 2.2, 4.2]],
      [c.gator - 16, [2.6, 1.6, 2.6]],
      [c.screens, [2.2, 1.3, 1.6]],
    ]),
    look: keys3(f, [
      [c.ny, [0, 1.0, -2.4]],
      [c.gator - 16, [0, 0.5, -2.4]],
      [c.screens, [0, 0.4, -2.2]],
    ]),
    fov: 46,
  };
  const gz = DRAIN[2] + up * 1.1;
  const hands: V3 = [0.05, 1.02, -0.62];
  return (
    <Sepia k={0.8}>
      <SewerCanvas cam={cam} t={t} look="night" shadow={10} key2={[4, 10, 4]} keyI={0.5}>
        {/* street (snow) + kerb + pavement + brownstones */}
        <Slab p={[0, -0.05, -3]} s={[30, 0.1, 12]} color="#e8ecef" map={tex("plaster", "#e8ecef", [6, 3], 4)} />
        <RB p={[0, 0.08, -4.4]} s={[30, 0.18, 0.3]} r={0.02} color="#9a9890" />
        <Slab p={[0, 0.1, -6.5]} s={[30, 0.2, 4]} color="#d9dde0" />
        <Terrace p={[-14, 0.2, -8.6]} n={6} brick="#6e4636" lit={0.8} stoops />
        {[-6, 6].map((x) => (
          <Streetlight key={x} p={[x, 0.2, -5]} on={1} />
        ))}
        <pointLight position={[0, 4, -4]} intensity={12} distance={14} color="#ffd59a" />
        {/* storm drain opening in the kerb */}
        <RB p={[DRAIN[0], -0.02, DRAIN[2] - 1.55]} s={[1.4, 0.06, 0.5]} r={0.01} color="#111" />
        <mesh position={[DRAIN[0], 0.005, DRAIN[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 0.8]} />
          <meshStandardMaterial color="#060606" />
        </mesh>
        {/* the alligator, pulled out of the drain */}
        <Alligator p={[DRAIN[0], -0.9 + up * 0.92, gz]} ry={0} rx={-0.9 * (1 - up)} s={0.9} jaw={f > c.gator ? 0.5 + 0.5 * Math.sin(t * 9) : 0} wag={t * 4} />
        <Rope pts={[[DRAIN[0], up * 0.25 + 0.2, gz + 0.62], [0, 0.6, (gz + hands[2]) / 2], hands]} />
        {[
          { p: [-0.7, -0.6] as [number, number], file: "man_a.glb" },
          { p: [0.05, -0.2] as [number, number], file: "man_c.glb" },
          { p: [0.75, 0.2] as [number, number], file: "man_d.glb" },
        ].map((k, i) => (
          <Model key={i} file={k.file} anims={LIB2} clip={f > c.gator + 4 ? "Hit_Knockback" : "Idle_Rail_Loop"} t={f > c.gator + 4 ? Math.min(0.6, (f - c.gator - 4) / 30) : t + i * 0.3} p={[k.p[0], 0, k.p[1]]} ry={Math.PI} outfit={KID} tint={{ Hair: "#2a2018" }} attach={{ bone: "Head", node: <FlatCap color={["#4a4238", "#2e2a26", "#5a5248"][i]} /> }} />
        ))}
      </SewerCanvas>
      <YearTag f={f} at={c.y1935} until={c.gator} year="1935" what="NEW YORK" top={240} />
    </Sepia>
  );
};

// ───────────────────────── 11. the screens at the sewage works ─────────────────────────
export const SetScreens: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const phase = (f - c.screens) / 120;
  const cam: Cam = {
    pos: keys3(f, [
      [c.screens, [6, 3.5, 7]],
      [c.wipeWord - 1, [4.5, 2.4, 3.6]],
      [c.wipeWord, [2.6, 1.6, 1.4]],
      [c.yourPuh, [2.0, 1.7, 1.0]],
      [c.congrats, [1.8, 1.8, 0.9]],
    ]),
    look: keys3(f, [
      [c.screens, [0, 0.5, -3.6]],
      [c.wipeWord - 1, [0, 0.4, -3.6]],
      [c.wipeWord, [0, 0.6, -3.9]],
      [c.yourPuh, [0, 1.1, -4.0]],
      [c.congrats, [0, 1.3, -4.1]],
    ]),
    fov: 44,
  };
  // which rake carries what: content is keyed to the spoken list; the puh rides the rake that is low in the band at its cue
  const p0 = (c.yourPuh - 6 - c.screens) / 120;
  const puhRake = [0, 1, 2].find((k) => {
    const u = (((p0 + k / 3) % 1) + 1) % 1;
    return u >= 0.12 && u < 0.46;
  }) ?? 0;
  const loadAt = (k: number, u: number) => {
    const item = f < c.fatWord ? "wipes" : f < c.gators ? "fat" : f < c.yourPuh ? "gator" : "puh";
    const show = item === "gator" ? u > 0.46 && u < 0.79 : u > 0.2 && u < 0.92;
    if (!show) return null;
    if (k !== puhRake && item === "puh") return null;
    if (item === "wipes") return [0, 1, 2, 3].map((j) => <Wipe key={j} p={[-1.0 + j * 0.65, 0.05, 0.05]} rot={[-0.3, j, 0.4]} s={0.32} dirty={1} />);
    if (item === "fat") return <Fatberg p={[0, 0.12, 0.1]} s={[0.7, 0.16, 0.22]} seed={k + 4} />;
    if (item === "gator") return <Alligator p={[0.6, -0.05, 0.3]} ry={Math.PI / 2} s={0.7} jaw={0.4} wag={t * 3} />;
    return (
      <group position={[0, 0.25, 0.2]}>
        <FursuitHead s={0.6} t={t} blink={f > c.yourPuh + 16 && f < c.yourPuh + 20 ? 1 : 0} />
      </group>
    );
  };
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="day" shadow={20} key2={[-20, 30, 20]}>
        <Works t={t}>
          <BarScreen p={[0, -3, -2.6]} w={3.6} h={6.6} phase={phase} load={loadAt} />
        </Works>
      </SewerCanvas>
      {f >= c.giantScreens && f < c.wipeWord ? <Tag x={560} y={500} text="BIGGEST SEWAGE WORKS IN BRITAIN" o={fadeIn(f, c.giantScreens)} color="#2f6db5" side="left" size={30} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 12. finale ─────────────────────────
const NET: V3[][] = (() => {
  const out: V3[][] = [];
  for (let k = 0; k < 6; k++) {
    const z = -40 + k * 14;
    out.push(Array.from({ length: 12 }, (_, i) => [-120 + i * 22, -3, z + Math.sin(i * 0.8 + k) * 4] as V3));
  }
  for (let k = 0; k < 10; k++) {
    const x = -110 + k * 24;
    out.push([[x, -3, -46] as V3, [x + 3, -3, -20] as V3, [x - 2, -3, 6] as V3, [x + 4, -3, 30] as V3]);
  }
  return out;
})();
const THAMES: V3[] = Array.from({ length: 14 }, (_, i) => [-130 + i * 20, -0.4, 44 + Math.sin(i * 0.6) * 10] as V3);
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const over = f >= c.builtMiles && f < c.allFor;
  if (over) return <SetOverview f={f} />;
  const worn = f >= c.congrats + 16;
  const rinse = f < c.congrats + 16;
  const dance = f >= c.allFor;
  const cam: Cam = dance
    ? {
        pos: keys3(f, [
          [c.allFor, [4.0, 1.4, 3.2]],
          [c.callIt, [4.4, 1.5, 3.6]],
          [c.end, [4.9, 1.6, 4.4]],
        ]),
        look: [3.2, 1.55, -0.2],
        fov: 42,
      }
    : { pos: [4.4, 1.55, 3.0], look: [3.55, 0.85, -0.35], fov: 42 };
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="day" shadow={14} key2={[-20, 30, 20]}>
        <Works t={t}>
          <BarScreen p={[0, -3, -2.6]} w={3.6} h={6.6} phase={(f - c.screens) / 120} />
          <Model
            file="man_a.glb"
            anims={dance ? LIB1 : LIB2}
            clip={dance ? "Dance_Loop" : rinse ? "Farm_Watering" : "Idle_FoldArms_Loop"}
            t={t}
            p={[3.2, 0, -0.4]}
            ry={dance ? 0.55 : -0.2}
            outfit={FRIEND}
            tint={{ Hair: "#3a2a1c" }}
            attach={[
              ...(worn ? [{ bone: "Head", node: <FursuitHead s={MASK_S} p={WORN} t={t} dance={dance ? 1 : 0} /> }] : []),

            ]}
          />
          {!worn ? (
            <group position={[3.9, 0.2, -0.3]}>
              <FursuitHead s={0.42} t={t} blink={f % 40 < 3 ? 1 : 0} />
            </group>
          ) : null}
          {rinse ? (
            <group position={[3.42, 1.0, -0.33]} rotation={[0, 1.46, 0]}>
              <Jet p={[0, 0, 0]} rot={[0.96, 0, 0]} t={t} len={0.75} />
            </group>
          ) : null}
          {/* sparkle when it goes on */}
          {f >= c.congrats + 14 && f < c.congrats + 30 ? <Glow position={[3.2, 1.75, -0.4]} size={1.4} color="#fff6c0" opacity={1 - ramp(f, c.congrats + 14, c.congrats + 30)} /> : null}
        </Works>
      </SewerCanvas>
      {f >= c.sewer ? <Big x={540} y={260} text={"THE\nSEWER"} o={pop(f, c.sewer)} color="#ffd23f" size={150} /> : null}
      <FollowPill f={f} at={c.follow} until={c.end - 18} />
      {f >= c.flushIt && f < c.end - 18 ? <Big x={540} y={1460} text="FLUSH IT?" o={pop(f, c.flushIt)} color="#5ff2ff" size={84} /> : null}
    </AbsoluteFill>
  );
};

/** London from above: the city on top, the glowing Victorian network under it, the super sewer under the Thames */
const SetOverview: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const net = ramp(f, c.builtMiles, c.builtMiles + 40, easeInOut);
  const sup = ramp(f, c.superSewer2, c.superSewer2 + 14, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.builtMiles, [20, 110, 120]],
      [c.allFor, [0, 170, 150]],
    ]),
    look: [0, -4, 0],
    fov: 45,
  };
  const groundMat = <meshStandardMaterial color="#8d9a7a" transparent opacity={0.18} roughness={1} depthWrite={false} />;
  return (
    <AbsoluteFill>
      <SewerCanvas cam={cam} t={t} look="day" shadow={200} key2={[-100, 160, 120]} fog={[300, 1200]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[300, 140]} />
          {groundMat}
        </mesh>
        {/* city blocks: terrace rows */}
        {Array.from({ length: 18 }, (_, k) => (
          <Terrace key={k} p={[-120 + (k % 6) * 42, 0, -36 + Math.floor(k / 6) * 26]} n={6} brick={["#a98a5e", "#9a7a52", "#b5915c"][k % 3]} />
        ))}
        {NET.map((pts, k) => (
          <TubePath key={k} points={pts.map((q) => new THREE.Vector3(...q))} progress={net} radius={k < 6 ? 1.4 : 0.9} color="#ff9f1c" glow />
        ))}
        <TubePath points={THAMES.map((q) => new THREE.Vector3(...q))} progress={1} radius={6} color="#3f7590" opacity={0.85} />
        <TubePath points={THAMES.map((q) => new THREE.Vector3(q[0], -14, q[2]))} progress={sup} radius={1.6} color="#26c6d9" glow />
        {f >= c.liveFat ? (
          <group position={[30, 12 + Math.sin(t * 3) * 0.6, -10]} scale={pop(f, c.liveFat) * 6}>
            <mesh>
              <planeGeometry args={[1.6, 0.6]} />
              <meshBasicMaterial color="#ff2d55" />
            </mesh>
          </group>
        ) : null}
      </SewerCanvas>
      <Pill o={net} value="1,100 MILES" label="1,770 KM OF TUNNELS" top={190} color="#ff9f1c" />
      {f >= c.superSewer2 ? <Tag x={540} y={1180} text="SUPER SEWER" o={fadeIn(f, c.superSewer2)} color="#26c6d9" side="right" /> : null}
      {f >= c.liveFat ? <Tag x={600} y={660} text="● LIVE · FatCam" o={fadeIn(f, c.liveFat)} color="#ff2d55" side="right" size={34} /> : null}
    </AbsoluteFill>
  );
};
