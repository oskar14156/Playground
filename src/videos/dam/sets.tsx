import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, TubePath, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { Cyl, House, RB, Car, tex } from "../../lib/three/diorama";
import { FollowPill } from "../../lib/Follow";
import { easeInOut, easeOut, keys, keys3, ramp } from "../../lib/timing";
import { HardHat, Jet } from "../sewer/props";
import { c } from "./cues";
import { ARCH_R, blockList, Cableway, Canyon, Cofferdam, Dam, DamBlocks, DamCanvas, fbm, H, hw, IntakeTowers, Lake, Portal, Powerhouse, Pylon, RIM, River, rnd, thick, TUNNEL_Y, tunnelPts, wallOff, xEnd, zUp } from "./world";
import { Blast, CityLights, Dust, DumpTruck, Fence, FridgePlant, Generator, Hose, InflatablePool, Jumbo, Plunger, Puddle, Runner, SwimRing, terrazzoTex, Waterfall } from "./props";
import { Big, CounterPill, DimH, DimV, FlatWallInsert, Pill, Stamp, Tag, YearCounter } from "./inserts";

export type SetProps = { f: number };
const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 10) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));
const fade = (f: number, a: number, b: number, d = 8) => Math.min(fadeIn(f, a, d), 1 - ramp(f, b - d, b));

/** screen position of a world point (far plane large enough for the canyon) */
const proj = (p: V3, cam: Cam) => {
  const cm = new THREE.PerspectiveCamera(cam.fov ?? 40, 1080 / 1920, 0.1, 20000);
  cm.position.set(...cam.pos);
  cm.lookAt(...cam.look);
  cm.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(cm);
  return { x: ((v.x + 1) / 2) * 1080, y: ((1 - v.y) / 2) * 1920, ok: v.z < 1 };
};

// ───────────────────────── people ─────────────────────────
const FRIEND: Outfit = { top: "#2874c9", pants: "#262b36", shoes: "#1c1f26", loose: "male" };
const WORKER = (i: number): Outfit => ({ top: ["#e8e2d2", "#5a7fa8", "#c9b48a", "#7a8a6a"][i % 4], pants: ["#3a4a6a", "#4a4034", "#2c3446"][i % 3], shoes: "#2a2018", sleeves: 0.8, loose: "male" });
const MASK_S = 0.5;
const WORN: V3 = [0, -0.2, 0.03];
const Worker: React.FC<{ i: number; p: V3; ry?: number; clip: string; lib?: string; t: number; s?: number }> = ({ i, p, ry = 0, clip, lib = LIB1, t, s = 1 }) => (
  <Model
    file={["man_b.glb", "man_c.glb", "man_d.glb", "man_a.glb"][i % 4]}
    anims={lib}
    clip={clip}
    t={t + i * 0.37}
    p={p}
    ry={ry}
    scale={s}
    outfit={WORKER(i)}
    tint={{ Hair: "#2a2018" }}
    attach={{ bone: "Head", node: <HardHat color={i % 2 ? "#f4f4f0" : "#c9a227"} lamp={false} /> }}
  />
);

// ───────────────────────── 1. HOOK: backyard on the rim → flooded canyon ─────────────────────────
const YZ = 700; // the yard sits on the left rim, downstream
const edgeX = -(hw(RIM) + wallOff(-1, RIM, YZ));
const YX = -224; // pool centre x
const POOL: V3 = [YX, RIM, YZ];

const Yard: React.FC<{ f: number; t: number; burst: number }> = ({ f, t, burst }) => {
  const grass = tex("grass", "#5f8f3e", [8, 8], 3);
  const tap: V3 = [-236.9, RIM + 0.5, YZ - 2];
  const hand: V3 = [YX + 2.1, RIM + 1.0, YZ + 2.2];
  const spread = ramp(f, c.flooded - 8, c.entire + 10, easeInOut);
  return (
    <group>
      <mesh position={[-221, RIM + 0.02, YZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial map={grass} roughness={0.95} />
      </mesh>
      <House p={[-241, RIM, YZ]} siding="#d9c7a6" lit={0} seed={3} />
      {/* house faces +z; turn it toward the canyon */}
      <Fence p={[-208, RIM, YZ - 14]} n={14} ry={-Math.PI / 2} broken={burst > 0.5 ? 7 : -1} />
      <InflatablePool p={POOL} level={0.85 + 0.15 * burst} t={t} slosh={burst} />
      <SwimRing p={[YX - 0.3, RIM + 0.86 + 0.15 * burst, YZ + 0.2]} bob={0.04 * Math.sin(t * 2.2) + burst * 0.1 * Math.sin(t * 7)} ry={0.4}>
        <group position={[0, 0.25, 0]} rotation={[0, 0.5, 0]}>
          <FursuitHead s={0.62} t={t} />
        </group>
      </SwimRing>
      <Hose
        pts={[tap, [-236.5, RIM + 0.04, YZ - 1], [-231, RIM + 0.04, YZ + 1.5], [-226, RIM + 0.04, YZ + 3.4], [YX + 1.8, RIM + 0.06, YZ + 3.1], [hand[0] - 0.1, RIM + 0.5, hand[2]], hand]}
        burst={burst}
      />
      <RB p={[-237.1, RIM + 0.5, YZ - 2]} s={[0.15, 0.12, 0.12]} r={0.03} color="#b8b2a8" metal={0.6} />
      <Model
        file="man_a.glb"
        anims={LIB2}
        clip="Farm_Watering"
        t={t}
        p={[YX + 2.6, RIM, YZ + 2.4]}
        ry={-2.3}
        outfit={FRIEND}
        tint={{ Hair: "#3a2a1c" }}
        attach={{ bone: "hand_r", node: <Jet p={[0, 0.0, 0.08]} rot={[0.3, 0, 0]} t={t} len={2.2 + 4 * burst} o={1} color="#cfeeff" /> }}
      />
      {/* burst: jets from the hose + the lawn floods toward the rim */}
      {burst > 0.05
        ? [0.25, 0.5, 0.75].map((u, i) => {
            const pt: V3 = [-236 + 10 * u, RIM + 0.1, YZ - 0.5 + 3.5 * u];
            return <Jet key={i} p={pt} rot={[-1.1, i * 1.7, 0]} t={t + i} len={3 + 2 * burst} o={burst} color="#cfeeff" />;
          })
        : null}
      <Puddle p={[-218, RIM + 0.05, YZ]} r={1.9 + 16 * spread} o={Math.min(1, 0.4 + spread)} t={t} />
      {spread > 0.15 ? (
        <mesh position={[(-205 + edgeX) / 2, RIM + 1.7, YZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[Math.abs(edgeX + 205) + 4, 16 * Math.min(1, spread * 1.5)]} />
          <meshStandardMaterial color="#8fd0ea" roughness={0.05} metalness={0.2} transparent opacity={0.85} />
        </mesh>
      ) : null}
      {spread > 0.2 ? <Waterfall p={[edgeX + 4, RIM + 0.5, YZ]} w={40 * spread} h={RIM - 4} t={t} ry={Math.PI / 2} o={ramp(spread, 0.2, 0.4)} color="rgba(220,240,250,1)" lean={0.46} /> : null}
    </group>
  );
};

export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const burst = ramp(f, c.accidentally, c.accidentally + 10, easeOut);
  const flood = ramp(f, c.flooded, c.soBuild + 20, easeInOut);
  const ghost = ramp(f, c.soBuild + 8, c.stop + 10, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [0, [-213.8, RIM + 1.9, YZ + 6.4]],
      [c.accidentally, [-215.2, RIM + 1.7, YZ + 5.0]],
      [c.flooded + 6, [-212, RIM + 4.5, YZ + 10]],
      [c.entire - 1, [-211, RIM + 5.5, YZ + 11]],
      [c.entire, [edgeX - 40, RIM + 70, YZ + 80]],
      [c.entire + 14, [-120, RIM + 190, YZ + 260]],
      [c.soBuild, [40, 270, 400]],
      [c.first, [50, 300, 360]],
    ]),
    look: keys3(f, [
      [0, [YX - 1, RIM + 0.7, YZ - 0.4]],
      [c.accidentally, [YX - 1.5, RIM + 0.6, YZ - 0.5]],
      [c.flooded + 6, [YX + 1, RIM + 0.4, YZ]],
      [c.entire - 1, [YX + 2, RIM + 0.4, YZ]],
      [c.entire, [edgeX + 40, RIM - 110, YZ - 10]],
      [c.entire + 14, [-40, 60, 520]],
      [c.soBuild, [0, 160, 40]],
      [c.first, [0, 170, 30]],
    ]),
    fov: keys(f, [
      [0, 40],
      [c.flooded + 6, 44],
      [c.entire + 14, 42],
    ]),
  };
  const near = f < c.flooded + 6;
  const ringP = proj([edgeX + 60, 8 + 110 * flood, YZ - 80], cam);
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="day" shadow={near ? 14 : 500} shadowAt={near ? POOL : [0, 0, 400]}>
        <Canyon />
        <Yard f={f} t={t} burst={burst} />
        <River z0={-1600} z1={1600} y={4 + 112 * flood} t={t} speed={10} color={flood > 0.05 ? "#5b6b4e" : "#3f8a83"} foam={1.6} />
        {flood > 0.1 ? (
          <SwimRing p={[edgeX + 60, 4 + 112 * flood + 0.1, YZ - 80 + 40 * flood]} s={6} bob={0.3 * Math.sin(t * 2)}>
            <group position={[0, 0.25, 0]}>
              <FursuitHead s={0.62} t={t} />
            </group>
          </SwimRing>
        ) : null}
        {ghost > 0.01 ? <GhostDam k={ghost} /> : null}
      </DamCanvas>
      {f > c.entire + 4 && f < c.soBuild + 10 && ringP.ok ? <Tag x={ringP.x} y={ringP.y} text="POCKET PUH" o={fade(f, c.entire + 4, c.soBuild + 10)} color="#ff6fa8" side="right" size={34} /> : null}
      {f > c.entire && f < c.soBuild + 4 ? <Pill o={fade(f, c.entire, c.soBuild + 4)} value="1 CANYON" label="FLOODED" top={190} color="#ffb05a" /> : null}
      <Pill o={fade(f, c.stop - 6, c.first)} value="STOP THE RIVER" label="221 m WALL" top={190} color="#ffd23f" />
    </AbsoluteFill>
  );
};

/** blueprint ghost of the dam drawing itself across the canyon */
const GhostDam: React.FC<{ k: number }> = ({ k }) => {
  const lines: React.ReactNode[] = [];
  for (let j = 0; j <= 6; j++) {
    const y = 125 + ((H - 125) * j) / 6;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) {
      const x = -(hw(y) - 3) + (2 * (hw(y) - 3) * i) / 30;
      pts.push(new THREE.Vector3(x, y, zUp(x, 1) + (j === 6 ? 0 : thick(y) * 0.3)));
    }
    lines.push(<TubePath key={j} points={pts} radius={j === 6 ? 4 : 2.4} color="#4ceeff" progress={Math.max(0, Math.min(1, k * 1.6 - j * 0.1))} />);
  }
  return <group>{lines}</group>;
};

// ───────────────────────── 2. the raging river ─────────────────────────
const RIVER_W = 2 * hw(0) - 30;
export const SetRiver: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const pour = ramp(f, c.wetConcrete + 2, c.wetConcrete + 14, easeOut);
  const plume = ramp(f, c.wetConcrete + 8, c.sweeps + 10, (x) => x);
  const swept = ramp(f, c.raging - 6, c.dynamite, (x) => x);
  const cam: Cam = {
    pos: keys3(f, [
      [c.first, [33, 5.2, 34]],
      [c.wetConcrete, [31, 6.5, 30]],
      [c.raging, [24, 7.5, 26]],
      [c.dynamite, [23, 7, 24]],
    ]),
    look: keys3(f, [
      [c.first, [4, 6, 0]],
      [c.wetConcrete, [3, 10, -2]],
      [c.raging - 4, [10, 4.5, -2]],
      [c.dynamite, [11, 4.5, 6]],
    ]),
    fov: 42,
  };
  const wz = -16 + 30 * swept;
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="day" shadow={60} shadowAt={[10, 0, 10]} ao={0}>
        <Canyon />
        <River z0={-1600} z1={1600} y={4} t={t} speed={11} foam={1.4} width={RIVER_W} color="#3a7f78" />
        {/* banks of gravel */}
        {[-1, 1].map((s) => (
          <RB key={s} p={[s * (RIVER_W / 2 + 10), 2.5, 0]} s={[20, 5, 400]} r={2} color="#8a7058" rough={1} />
        ))}
        {/* concrete plume washing away */}
        {plume > 0 && plume < 1 ? (
          <mesh position={[2, 4.15, -2 + 40 * plume]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[6 + 10 * plume, 10 + 70 * plume]} />
            <meshStandardMaterial color="#9b958c" transparent opacity={0.8 * (1 - plume)} roughness={0.8} />
          </mesh>
        ) : null}
        {f < c.raging ? <Cableway z={-2} u={0.5} drop={RIM + 40 - 18 - 22} pour={pour} /> : null}
        {/* workers on the right bank */}
        <Worker i={0} p={[24, 5, 8]} ry={-1.9} clip="Idle_Rail_Call" lib={LIB2} t={t} />
        <Worker i={1} p={[25.5, 5, 14]} ry={-2.4} clip="Idle_No_Loop" lib={LIB2} t={t} />
        <Worker i={2} p={[23, 5, 22]} ry={-1.2} clip="Idle_Loop" t={t} />
        <DumpTruck p={[29, 5, -6]} ry={0.2} load="#9b958c" />
        {/* the worker swept away on a plank */}
        {f >= c.raging - 6 ? (
          <group position={[11 + 1.5 * Math.sin(t * 2), 4.1, wz]} rotation={[0, t * 2.4, 0]}>
            <RB p={[0, 0.05, 0]} s={[0.9, 0.12, 3.2]} r={0.04} color="#9a7a52" />
            <Worker i={3} p={[0, -0.1, 0]} ry={0} clip="Swim_Idle_Loop" t={t} />
          </group>
        ) : null}
      </DamCanvas>
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. dynamite + tunnels ─────────────────────────
export const SetBlast: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const push = ramp(f, c.dynamite, c.dynamite + 5, easeOut);
  const k = ramp(f, c.dynamite + 5, c.dynamite + 40, (x) => x);
  const cam: Cam = { pos: keys3(f, [[c.dynamite - 4, [36, 6.5, 42]], [c.fourTunnels, [37, 7.5, 46]]]), look: [-30, 22, -40], fov: 44 };
  const wall: V3 = [-(hw(20) - 6), 20, -40];
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="day" shadow={80} shadowAt={[0, 0, 0]}>
        <Canyon />
        <River z0={-1600} z1={1600} y={4} t={t} speed={11} foam={1.4} width={RIVER_W} color="#3a7f78" />
        <RB p={[RIVER_W / 2 + 10, 2.5, 0]} s={[20, 5, 400]} r={2} color="#8a7058" rough={1} />
        <Plunger p={[31, 5, 36]} ry={-0.6} push={push} />
        <Worker i={0} p={[31.6, 5, 36.8]} ry={-2.6} clip="Interact" t={(f - c.dynamite + 6) / 30} />
        <Blast p={wall} k={k} size={34} dir={[1, 0.2, 0.3]} />
        {k > 0 ? <Glow position={wall} size={160 * (1 - k)} color="#ffcf70" opacity={1 - k} /> : null}
      </DamCanvas>
      {push > 0.5 && f < c.dynamite + 14 ? <AbsoluteFill style={{ background: "#fff3d0", opacity: 0.45 * (1 - ramp(f, c.dynamite + 5, c.dynamite + 9)) }} /> : null}
    </AbsoluteFill>
  );
};

const Tunnels: React.FC<{ draw: number[]; pulse?: number; water?: number }> = ({ draw, pulse = 0, water = 0 }) => {
  const out: React.ReactNode[] = [];
  let n = 0;
  for (const s of [-1, 1])
    for (const ln of [0, 1]) {
      const pts = tunnelPts(s, ln);
      out.push(<TubePath key={`t${n}`} points={pts} radius={8.5} color="#4ceeff" progress={draw[n]} opacity={0.95} glow={false} />);
      if (water > 0)
        for (let q = 0; q < 6; q++) {
          const u = (pulse + q / 6) % 1;
          const i = Math.floor(u * (pts.length - 1));
          const a = pts[i];
          const b = pts[Math.min(pts.length - 1, i + 1)];
          const fr = u * (pts.length - 1) - i;
          out.push(<Glow key={`p${n}${q}`} position={a.clone().lerp(b, fr)} size={40} color="#e8fbff" opacity={water} />);
        }
      n++;
    }
  return <group>{out}</group>;
};

export const SetTunnels: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const draw = [0, 1, 2, 3].map((i) => ramp(f, c.fourTunnels + i * 4, c.fourTunnels + i * 4 + 16, easeOut));
  const cam: Cam = { pos: keys3(f, [[c.fourTunnels, [240, 1250, 950]], [c.m17, [200, 1100, 820]]]), look: [0, 0, 60], fov: 42 };
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="xray" shadow={500}>
        <Canyon xray={1} />
        <River z0={-1600} z1={1600} y={4} t={t} speed={11} foam={0.6} width={RIVER_W} color="#1f5a72" />
        <Tunnels draw={draw} />
      </DamCanvas>
      <Pill o={fadeIn(f, c.fourTunnels + 4)} value="4 TUNNELS" label="THROUGH SOLID ROCK" top={190} color="#4ceeff" />
    </AbsoluteFill>
  );
};

export const SetPortal: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const pz = tunnelPts(-1, 0)[0].z;
  const px = -(hw(TUNNEL_Y) - 26);
  const nx = 0.878;
  const nz = -0.479;
  const cam: Cam = { pos: keys3(f, [[c.m17, [px + nx * 52, 7, pz + nz * 52]], [c.straight, [px + nx * 44, 8, pz + nz * 44]]]), look: [px, 12, pz], fov: 46 };
  const top = proj([px, TUNNEL_Y + 8.9, pz + 4], cam);
  const bot = proj([px, TUNNEL_Y - 8.9, pz + 4], cam);
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="day" shadow={60} shadowAt={[px, 10, pz]}>
        <Canyon />
        <River z0={-1600} z1={1600} y={4} t={t} speed={11} foam={1.2} width={RIVER_W} color="#3a7f78" />
        <Portal side={-1} lane={0} inlet />
        <RB p={[px + 7, 4.9, pz + 14]} s={[14, 1, 40]} r={0.3} color="#9a8a74" rough={1} />
        <DumpTruck p={[px + 8, 5.4, pz + 20]} ry={Math.PI + 0.3} load="#7a5a44" />
        <Worker i={1} p={[px + 4, 5.4, pz + 8]} ry={1.2} clip="Idle_Loop" t={t} />
        <Worker i={2} p={[px + 10.5, 5.4, pz + 12]} ry={-0.4} clip="Idle_Rail_Call" lib={LIB2} t={t} />
      </DamCanvas>
      <DimV x={Math.min(top.x, bot.x) - 60} y0={bot.y} y1={top.y} o={fadeIn(f, c.m17 + 2, 10)} label={"17 m\n56 ft"} side="left" />
    </AbsoluteFill>
  );
};

export const SetJumbo: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const drill = 0.5 + 0.5 * Math.sin(t * 2);
  const rock = useMemo(() => tex("plaster", "#6a4c3a", [10, 3], 9), []);
  const cam: Cam = { pos: keys3(f, [[c.straight, [5.5, 4.5, 6]], [c.plug, [4.5, 5.5, 14]]]), look: [-0.5, 5.5, 40], fov: 52 };
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="interior" shadow={20} shadowAt={[0, 4, 30]} sun={[0, 30, 10]} sunI={0.4} fog={[20, 110]} bloom={0.8}>
        {/* tunnel bore along +z, invert at y = 0 */}
        <mesh position={[0, 8.5, 20]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[8.5, 8.5, 70, 40, 1, true]} />
          <meshStandardMaterial map={rock} side={THREE.BackSide} roughness={1} color="#a88a70" />
        </mesh>
        <mesh position={[0, 8.5, 47]}>
          <circleGeometry args={[8.6, 40]} />
          <meshStandardMaterial map={rock} roughness={1} color="#8a6a52" />
        </mesh>
        <RB p={[0, 0.3, 20]} s={[13, 0.6, 70]} r={0.1} color="#5a4a3a" rough={1} />
        <Jumbo p={[0, 0.6, 37]} t={t} drill={drill} />
        <Worker i={0} p={[-2.5, 3.0, 39.5]} ry={0} clip="Fixing_Kneeling" t={t} />
        <Worker i={1} p={[2.4, 5.4, 39.4]} ry={0.1} clip="Push_Loop" t={t} />
        <Worker i={2} p={[-1.2, 7.8, 39.4]} ry={-0.1} clip="Push_Loop" t={t} />
        <Worker i={3} p={[4.5, 0.6, 30]} ry={2.6} clip="Idle_Torch_Loop" t={t} />
        {[-4, 0, 4].map((x) => (
          <pointLight key={x} position={[x, 9, 43]} intensity={60} distance={30} color="#ffd8a0" />
        ))}
        <pointLight position={[0, 12, 20]} intensity={40} distance={40} color="#ffcf90" />
        <Dust c={[0, 6, 45]} r={4} k={0.5 + 0.2 * Math.sin(t * 3)} n={14} color="#d8c0a0" />
      </DamCanvas>
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. plug + reroute ─────────────────────────
export const SetReroute: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const up = ramp(f, c.plug - 4, c.plug + 18, easeOut);
  const xr = f >= c.reroute;
  const drain = ramp(f, c.reroute + 6, c.site + 10, easeInOut);
  const pulse = (t * 0.6) % 1;
  const cam: Cam = xr
    ? { pos: keys3(f, [[c.reroute, [200, 720, -520]], [c.next, [170, 620, -400]]]), look: [0, 0, 40], fov: 42 }
    : { pos: keys3(f, [[c.plug, [30, 330, -640]], [c.reroute, [40, 420, -620]]]), look: [0, 0, -300], fov: 40 };
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look={xr ? "xray" : "day"} shadow={600}>
        <Canyon xray={xr ? 1 : 0} />
        <Cofferdam z={-300} up={up} />
        <Cofferdam z={420} up={ramp(f, c.reroute, c.reroute + 20, easeOut)} />
        <River z0={-1600} z1={-300} y={4 + 10 * up} t={t} speed={xr ? 6 : 10} foam={1} color={xr ? "#1f5a72" : "#3a7f78"} />
        <River z0={420} z1={1600} y={4} t={t} speed={10} foam={0.8} color={xr ? "#1f5a72" : "#3a7f78"} />
        {drain < 1 ? <River z0={-300} z1={420} y={4 - 4.6 * drain} t={t} speed={10 * (1 - drain)} foam={1 - drain} color={xr ? "#1f5a72" : "#3a7f78"} width={RIVER_W} /> : null}
        {[-1, 1].map((s) => [0, 1].map((ln) => <Portal key={`${s}${ln}`} side={s} lane={ln} inlet water={up} t={t} />))}
        {xr ? <Tunnels draw={[1, 1, 1, 1]} pulse={pulse} water={1} /> : null}
        {drain > 0.4
          ? [0, 1, 2, 3].map((i) => <DumpTruck key={i} p={[-14 + i * 9, 0, 420 - 120 * ramp(f, c.site - 20 + i * 5, c.next, easeOut) - i * 30]} ry={Math.PI} color={["#b8452e", "#3d5a3a", "#c9a227", "#5a7fa8"][i]} />)
          : null}
      </DamCanvas>
      {f >= c.site - 2 ? <Stamp f={f} at={c.site - 2} text="RIVER REROUTED" top={1340} color="#4ceeff" rot={-6} size={80} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. 221 m tall ─────────────────────────
export const SetRise: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const top = H * ramp(f, c.next + 4, c.tall221 + 30, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.next, [210, 150, 700]],
      [c.but, [240, 260, 760]],
    ]),
    look: keys3(f, [
      [c.next, [0, 60, 100]],
      [c.but, [0, 120, 80]],
    ]),
    fov: 42,
  };
  const a = proj([-xEnd(0) * 0 - 10, 0, 205], cam);
  const b = proj([-10, top, zUp(-10, 1) + thick(top)], cam);
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="day" shadow={500}>
        <Canyon />
        <Cofferdam z={-300} up={1} />
        <River z0={-1600} z1={-300} y={14} t={t} speed={6} foam={0.6} />
        <River z0={420} z1={1600} y={4} t={t} speed={8} foam={0.6} />
        {top > 1 ? <Dam top={top} road={false} /> : null}
        <Cableway z={60} u={0.45 + 0.1 * Math.sin(t)} drop={RIM + 40 - 18 - top - 10} />
        <Cableway z={140} u={0.6 - 0.1 * Math.sin(t * 0.8)} drop={RIM + 40 - 18 - top - 30} />
        {[0, 1, 2].map((i) => (
          <DumpTruck key={i} p={[-20 + i * 16, 0, 330 + i * 12]} ry={Math.PI + 0.2 * i} />
        ))}
      </DamCanvas>
      <DimV x={Math.max(a.x, b.x) + 70} y0={a.y} y1={b.y} o={fadeIn(f, c.tall221, 10)} label={"221 m\n726 ft"} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 6. flat wall → arch ─────────────────────────
export const SetFlat: React.FC<SetProps> = ({ f }) => (
  <AbsoluteFill style={{ background: "#0b2a44" }}>
    <FlatWallInsert f={f} at={c.but - 4} snap={c.cracker} until={c.soCurve + 1} />
  </AbsoluteFill>
);

export const SetArch: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const k = ramp(f, c.soCurve + 6, c.giantArch + 12, easeInOut);
  const cam: Cam = { pos: keys3(f, [[c.soCurve, [0, 760, 330]], [c.base200, [80, 640, 420]]]), look: [0, 60, 20], fov: 40 };
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="day" shadow={500}>
        <Canyon />
        <Dam k={Math.max(0.001, k)} />
        <Lake y={200} k={Math.max(0.001, k)} t={t} />
        <River z0={330} z1={1600} y={4} t={t} speed={4} foam={0.3} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const x = -120 + i * 40;
          const z0 = -zUp(x, k) - 140;
          return <TubePath key={i} points={[new THREE.Vector3(x, 205, z0), new THREE.Vector3(x, 205, -zUp(x, k) - 18)]} radius={3} color="#5cd2ff" opacity={0.85} />;
        })}
      </DamCanvas>
      <Pill o={fadeIn(f, c.giantArch)} value="ARCH" label="BULGES INTO THE LAKE" top={190} color="#5dfc8d" />
    </AbsoluteFill>
  );
};

export const SetProfile: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = { pos: keys3(f, [[c.base200, [540, 140, 112]], [c.harder, [510, 142, 108]]]), look: [0, 112, 104], fov: 44 };
  const b0 = proj([0, 0, 0], cam);
  const b1 = proj([0, 0, thick(0)], cam);
  const t0 = proj([0, H, 0], cam);
  const t1 = proj([0, H, thick(H)], cam);
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="day" shadow={500} sun={[600, 500, 300]}>
        <Canyon cut />
        <Dam half />
        <Lake y={200} t={t} />
        {/* water cut face */}
        <mesh position={[0.2, 100, -600]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1200, 200]} />
          <meshStandardMaterial color="#1f5f86" transparent opacity={0.85} />
        </mesh>
        <Car p={[-6, H, zUp(-6, 1) + 5]} color="#c0392b" ry={Math.PI / 2} />
        <Car p={[-14, H, zUp(-14, 1) + 9]} color="#f2c14e" ry={-Math.PI / 2} />
      </DamCanvas>
      <DimH y={b0.y + 50} x0={b0.x} x1={b1.x} o={fadeIn(f, c.base200 + 2, 10)} label="200 m · 660 ft" below />
      <Tag x={(t0.x + t1.x) / 2} y={t0.y + 10} text="14 m · 45 ft" o={fadeIn(f, c.top14, 8)} side="left" size={40} />
      <Pill o={fade(f, c.base200 + 2, c.harder + 1)} value="THICK → THIN" label="CROSS-SECTION" top={1720} color="#ffd23f" />
    </AbsoluteFill>
  );
};

export const SetWedge: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const push = ramp(f, c.harder, c.harder + 20, easeOut);
  const flow = ramp(f, c.tighter, c.wedges + 14, easeInOut);
  const glow = ramp(f, c.wedges, c.cliffs, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.harder, [0, 820, 260]],
      [c.wedges, [-40, 620, 300]],
      [c.cliffs + 6, [40, 380, 420]],
    ]),
    look: keys3(f, [
      [c.harder, [0, 100, 30]],
      [c.wedges, [-30, 120, 40]],
      [c.cliffs + 6, [-110, 200, 70]],
    ]),
    fov: 40,
  };
  const arcPts = (side: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const x = side * (hw(H) - 2) * (i / 20);
      pts.push(new THREE.Vector3(x, H + 6, zUp(x, 1) + 7));
    }
    return pts;
  };
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="day" shadow={500}>
        <Canyon />
        <Dam />
        <Lake y={200} t={t} />
        <IntakeTowers show={0} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const x = -120 + i * 40;
          const len = 60 + 40 * push + 8 * Math.sin(t * 5 + i);
          return <TubePath key={i} points={[new THREE.Vector3(x, 206, -zUp(x, 1) - 20 - len), new THREE.Vector3(x, 206, -zUp(x, 1) - 14)]} radius={3.2} color="#5cd2ff" opacity={0.85} />;
        })}
        {flow > 0 ? (
          <>
            <TubePath points={arcPts(-1)} radius={4} color="#ff8a2a" progress={flow} />
            <TubePath points={arcPts(1)} radius={4} color="#ff8a2a" progress={flow} />
          </>
        ) : null}
        {glow > 0
          ? [-1, 1].map((s) => (
              <group key={s}>
                <Glow position={[s * (hw(H) + 4), H - 20, zUp(s * hw(H), 1) + 10]} size={120 * glow} color="#ff8a2a" opacity={glow} />
                <Glow position={[s * (hw(120) + 2), 120, zUp(s * hw(120), 1) + 30]} size={90 * glow} color="#ff8a2a" opacity={glow * 0.8} />
              </group>
            ))
          : null}
      </DamCanvas>
      {f >= c.cliffs ? <Stamp f={f} at={c.cliffs} text="ARCH WEDGED" top={1330} color="#5dfc8d" rot={-6} size={84} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 7. pour → heat → 125 years → dust ─────────────────────────
export const SetPour: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const mono = f >= c.pouring;
  const top = mono ? 110 + (H - 110) * ramp(f, c.pouring + 4, c.traps - 4, easeInOut) : 110;
  const shake = f >= c.wait && f < c.wait + 8 ? Math.sin(f * 3) * 3 : 0;
  const cam: Cam = {
    pos: keys3(f, [
      [c.wait, [40 + shake, 320, 560]],
      [c.pouring, [30, 260, 600]],
      [c.traps, [20, 220, 640]],
    ]),
    look: [0, 100, 90],
    fov: 42,
  };
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="day" shadow={500}>
        <Canyon />
        <Cofferdam z={-300} up={1} />
        <River z0={-1600} z1={-300} y={14} t={t} speed={6} foam={0.6} />
        <River z0={420} z1={1600} y={4} t={t} speed={8} foam={0.6} />
        {mono ? <Dam top={top} road={false} /> : <DamBlocks s={{ top, stagger: 1 }} />}
        <Cableway z={60} u={0.4 + 0.15 * Math.sin(t * 1.3)} drop={RIM + 40 - 18 - top - 12} pour={0.5 + 0.5 * Math.sin(t * 2)} />
        <Cableway z={150} u={0.62 - 0.12 * Math.sin(t)} drop={RIM + 40 - 18 - top - 20} pour={0.5 + 0.5 * Math.cos(t * 2)} />
      </DamCanvas>
      <Pill o={fade(f, c.pouring + 4, c.traps + 2)} value="3,250,000 yd³" label="2.5M m³ CONCRETE" top={190} color="#e8dfcf" />
      <Pill o={fade(f, c.lump - 2, c.traps + 2)} value="ONE LUMP" label="" top={330} color="#ff7a3c" />
    </AbsoluteFill>
  );
};

export const SetHeat: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const heat = ramp(f, c.traps, c.traps + 24, easeOut);
  const cracks = ramp(f, c.yrs125 + 26, c.shatter, easeInOut);
  const crumble = ramp(f, c.shatter + 2, c.soPour - 2, (x) => x);
  const shake = f > c.shatter && f < c.soPour ? Math.sin(f * 2.7) * 4 : 0;
  const cam: Cam = {
    pos: keys3(f, [
      [c.traps, [40 + shake, 150, 640]],
      [c.shatter, [20 + shake, 170, 560]],
      [c.soPour, [shake, 160, 600]],
    ]),
    look: [0, 110, 90],
    fov: 44,
  };
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="night" shadow={500} bloom={0.7}>
        <Canyon />
        <River z0={420} z1={1600} y={4} t={t} speed={6} foam={0.4} color="#1d3a44" />
        {crumble <= 0 ? <Dam top={H} road={false} heat={heat} cracks={cracks} /> : <DamBlocks s={{ top: H, stagger: 0, fall: crumble, heat: () => 0.9, grout: 1 }} />}
        <Dust c={[0, 40, 160]} r={120} k={crumble} n={22} color="#d8c0a0" />
        {heat > 0.3 ? <pointLight position={[0, 120, 320]} intensity={heat * 2e4} distance={900} color="#ff6a2a" /> : null}
      </DamCanvas>
      <YearCounter f={f} at={c.yrs125} until={c.shatter + 6} />
      <Pill o={fade(f, c.traps + 6, c.yrs125)} value="+ HEAT" label="CEMENT CURING" top={190} color="#ff7a3c" />
    </AbsoluteFill>
  );
};

// ───────────────────────── 8. Lego blocks, pipes, refrigeration, grout ─────────────────────────
export const SetLego: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const top = 40 + 150 * ramp(f, c.soPour, c.pipes930 + 2, easeInOut);
  const studs = Math.min(ramp(f, c.lego - 4, c.lego + 4, easeOut), 1 - ramp(f, c.pipes930 - 8, c.pipes930));
  const cam: Cam = { pos: keys3(f, [[c.soPour, [70, 300, 470]], [c.pipes930, [40, 340, 520]]]), look: [0, 70, 90], fov: 42 };
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="day" shadow={500}>
        <Canyon />
        <Cofferdam z={-300} up={1} />
        <River z0={-1600} z1={-300} y={14} t={t} speed={6} foam={0.6} />
        <DamBlocks s={{ top, stagger: 1, studs }} />
        <Cableway z={70} u={0.45 + 0.12 * Math.sin(t * 1.4)} drop={RIM + 40 - 18 - top - 12} pour={0.6} />
      </DamCanvas>
      <Pill o={fadeIn(f, c.lego)} value="BLOCKS" label="POURED IN 1.5 m LIFTS" top={190} color="#ffd23f" />
    </AbsoluteFill>
  );
};

/** close-up of 3 block columns: lifts with steel cooling coils; pipes 0..1 lays them, cold 0..1 turns them icy, grout fills the joints */
const BlockClose: React.FC<{ f: number; t: number; lay: number; cold: number; grout: number }> = ({ f, t, lay, cold, grout }) => {
  const LIFTS = 6;
  const LH = 2.6;
  const BW = 16;
  const gap = 1.4 * (1 - grout);
  const items: React.ReactNode[] = [];
  const coilCol = cold > 0.5 ? "#4ab8ff" : "#ffb347";
  for (let bx = -1; bx <= 1; bx++)
    for (let bz = 0; bz <= 1; bz++) {
      const hcol = LIFTS - (bx === 1 && bz === 0 ? 1 : 0);
      for (let l = 0; l < hcol; l++) {
        const x = bx * BW;
        const z = bz * BW;
        const y = l * LH + LH / 2;
        items.push(
          <mesh key={`b${bx}${bz}${l}`} position={[x, y, z]} castShadow receiveShadow>
            <boxGeometry args={[BW - gap, LH - 0.12, BW - gap]} />
            <meshStandardMaterial color={grout > 0.5 ? "#9fb4c4" : "#7fc8e8"} emissive="#0e3a52" emissiveIntensity={0.5} transparent opacity={0.3} depthWrite={false} roughness={0.9} />
          </mesh>,
        );
        // coil on top of each lift (serpentine), drawn on by lay
        const pts: THREE.Vector3[] = [];
        for (let r = 0; r < 6; r++) {
          const zz = z - BW / 2 + 1.6 + r * 2.5;
          const a = r % 2 ? 1 : -1;
          pts.push(new THREE.Vector3(x - a * (BW / 2 - 1.5), y + LH / 2 - 0.2, zz), new THREE.Vector3(x + a * (BW / 2 - 1.5), y + LH / 2 - 0.2, zz));
        }
        const pr = Math.max(0, Math.min(1, lay * 1.6 - l * 0.12 - (bx + 1) * 0.08));
        items.push(<TubePath key={`c${bx}${bz}${l}`} points={pts} radius={0.16} color={coilCol} progress={pr} opacity={0.95} />);
      }
    }
  // grout: grey fill rising in the joints
  const g = grout > 0 ? (
    <group>
      {[-BW / 2, BW / 2].map((x) => (
        <mesh key={`gx${x}`} position={[x, (LIFTS * LH * grout) / 2, BW / 2]}>
          <boxGeometry args={[1.5, LIFTS * LH * grout, BW * 2]} />
          <meshStandardMaterial color="#c9c2b4" emissive="#6a645a" emissiveIntensity={0.4} roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, (LIFTS * LH * grout) / 2, BW / 2]}>
        <boxGeometry args={[BW * 3, LIFTS * LH * grout, 1.5]} />
        <meshStandardMaterial color="#c9c2b4" emissive="#6a645a" emissiveIntensity={0.4} roughness={1} />
      </mesh>
    </group>
  ) : null;
  void f;
  return (
    <group>
      {items}
      {g}
      <mesh position={[0, -0.05, 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a2a34" roughness={1} />
      </mesh>
      <Worker i={0} p={[-6, LIFTS * LH, 4]} ry={0.6} clip="Fixing_Kneeling" t={t} />
      <Worker i={1} p={[3, LIFTS * LH, 12]} ry={-2.2} clip="Walk_Carry_Loop" lib={LIB2} t={t} />
      <Worker i={2} p={[14, (LIFTS - 1) * LH, 3]} ry={-0.8} clip="Idle_Loop" t={t} />
      {cold > 0.3
        ? [0, 1, 2, 3, 4, 5].map((k) => <Glow key={k} position={[-20 + k * 8, 4 + (k % 3) * 4, 17 + Math.sin(t * 3 + k)]} size={6} color="#bfe8ff" opacity={0.4 * cold} />)
        : null}
    </group>
  );
};

export const SetPipes: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const lay = ramp(f, c.pipes930 - 2, c.pump - 2, easeInOut);
  const cam: Cam = { pos: keys3(f, [[c.pipes930, [34, 28, 46]], [c.pump, [30, 24, 42]]]), look: [0, 6, 6], fov: 44 };
  const km = 930 * ramp(f, c.pipes930 + 2, c.pipes930 + 40, easeOut);
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="xray" shadow={40} shadowAt={[0, 6, 8]} fog={[200, 900]} bloom={1}>
        <BlockClose f={f} t={t} lay={lay} cold={0} grout={0} />
      </DamCanvas>
      <CounterPill o={fadeIn(f, c.pipes930)} value={km} label="KM OF PIPE · 582 MI" top={190} />
    </AbsoluteFill>
  );
};

export const SetPlant: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cool = ramp(f, c.fridge - 10, c.grout - 4, easeInOut);
  const heat = (x: number, y: number, z: number) => {
    // the cold front starts at the pipes from the plant (downstream toe) and spreads through the dam
    const d = Math.hypot(x * 0.6, y * 1.0, (z - 200) * 0.8) / 260;
    const k = cool * 1.6 - d;
    return k > 0 ? -Math.min(1, k * 2.2) : 0.85 - 0.25 * d;
  };
  const cam: Cam = {
    pos: keys3(f, [
      [c.pump, [-70, 60, 520]],
      [c.fridge, [-90, 90, 560]],
      [c.grout, [-110, 140, 600]],
    ]),
    look: keys3(f, [
      [c.pump, [10, 20, 300]],
      [c.fridge, [0, 50, 240]],
      [c.grout, [0, 90, 160]],
    ]),
    fov: 44,
  };
  const pipe = (side: number) => [
    new THREE.Vector3(10 + side * 6, 6, 280),
    new THREE.Vector3(side * 10, 4, 240),
    new THREE.Vector3(side * 12, 4, 210),
    new THREE.Vector3(side * 14, 40, 170),
    new THREE.Vector3(side * 16, 90, 110),
  ];
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="night" shadow={300} shadowAt={[0, 0, 260]} bloom={1}>
        <Canyon />
        <River z0={420} z1={1600} y={4} t={t} speed={8} foam={0.6} />
        <DamBlocks s={{ top: H, stagger: 0.4, heat }} />
        <FridgePlant p={[12, 0, 300]} ry={Math.PI / 2} t={t} />
        {[-1, 1].map((s) => (
          <TubePath key={s} points={pipe(s)} radius={1.4} color="#4ab8ff" progress={ramp(f, c.pump + 2, c.fridge + 6, easeOut)} />
        ))}
        <Worker i={0} p={[-8, 0, 318]} ry={0.4} clip="Idle_Loop" t={t} />
      </DamCanvas>
      <Pill o={fadeIn(f, c.pump + 4)} value="ICE-COLD WATER" label="THROUGH EVERY PIPE" top={190} color="#4ab8ff" />
    </AbsoluteFill>
  );
};

export const SetGrout: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const grout = ramp(f, c.grout, c.solid + 6, easeInOut);
  const cam: Cam = { pos: keys3(f, [[c.grout - 4, [36, 26, 48]], [c.finally, [42, 34, 56]]]), look: [0, 7, 6], fov: 44 };
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="xray" shadow={40} shadowAt={[0, 6, 8]} fog={[200, 900]} bloom={1}>
        <BlockClose f={f} t={t} lay={1} cold={1} grout={grout} />
        {/* grout hose */}
        <TubePath points={[new THREE.Vector3(-30, 2, 30), new THREE.Vector3(-20, 1, 20), new THREE.Vector3(-8, 4, 8.6)]} radius={0.35} color="#7a7468" glow={false} />
      </DamCanvas>
      {f >= c.solid ? <Stamp f={f} at={c.solid} text="FUSED SOLID" top={1330} color="#e8dfcf" rot={-6} size={84} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 9. turbines → Las Vegas ─────────────────────────
export const SetHall: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const floor = useMemo(() => {
    const tx = terrazzoTex().clone();
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(2, 10);
    tx.needsUpdate = true;
    return tx;
  }, []);
  const wall = tex("plaster", "#e8dfcf", [6, 2], 4);
  const N = 9;
  const n = Math.round(17 * ramp(f, c.turbines17 - 2, c.turning - 4, (x) => x));
  const cam: Cam = { pos: keys3(f, [[c.finally, [-16, 16, -26]], [c.turning, [-12, 13, -14]]]), look: [5, 6, 110], fov: 46 };
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="interior" shadow={60} shadowAt={[0, 0, 80]} sun={[-40, 80, 40]} sunI={0.9} fog={[80, 320]}>
        <mesh position={[0, 0, 80]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[46, 240]} />
          <meshStandardMaterial map={floor} roughness={0.35} />
        </mesh>
        {[-23, 23].map((x) => (
          <mesh key={x} position={[x, 22, 80]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[240, 44]} />
            <meshStandardMaterial map={wall} roughness={0.8} />
          </mesh>
        ))}
        {/* window band on the right wall */}
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[22.9, 30, -10 + i * 22]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[12, 14]} />
            <meshStandardMaterial color="#fff2d8" emissive="#fff2d8" emissiveIntensity={1.4} />
          </mesh>
        ))}
        <mesh position={[0, 44, 80]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[46, 240]} />
          <meshStandardMaterial color="#cfc4b0" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {/* crane rails + bridge */}
        {[-21, 21].map((x) => (
          <RB key={x} p={[x, 36, 80]} s={[1.2, 1.2, 240]} r={0.1} color="#3a3a36" metal={0.6} />
        ))}
        <RB p={[0, 36.8, 40 + 70 * ramp(f, c.finally, c.turning, easeInOut)]} s={[44, 2.4, 3]} r={0.2} color="#c9a227" metal={0.4} />
        {Array.from({ length: N }).map((_, i) => {
          const lowered = ramp(f, c.turbines17 - 6 + i * 5, c.turbines17 + 6 + i * 5, easeOut);
          return <Generator key={i} p={[4, 0, i * 22]} spin={t * 3 * lowered} lowered={lowered} lit={lowered} />;
        })}
        <Worker i={0} p={[-8, 0, 12]} ry={1.8} clip="Idle_Loop" t={t} />
        <Worker i={1} p={[-6, 0, 30]} ry={2.6} clip="Walk_Loop" t={t} />
        <pointLight position={[0, 30, 40]} intensity={1200} distance={200} color="#fff0d8" />
      </DamCanvas>
      <CounterPill o={fadeIn(f, c.turbines17 - 2)} value={n} label="GIANT TURBINES" top={190} />
    </AbsoluteFill>
  );
};

export const SetPenstock: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = { pos: [26, 18, 34], look: [0, 6, 0], fov: 44 };
  const pts = [new THREE.Vector3(-40, 50, -30), new THREE.Vector3(-20, 30, -14), new THREE.Vector3(-10, 14, -6), new THREE.Vector3(-8, 4, 0), new THREE.Vector3(0, 2, 0)];
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="xray" shadow={60} bloom={1}>
        <TubePath points={pts} radius={4.5} color="#4ceeff" opacity={0.35} />
        {Array.from({ length: 10 }).map((_, q) => {
          const u = (t * 1.4 + q / 10) % 1;
          const curve = new THREE.CatmullRomCurve3(pts);
          return <Glow key={q} position={curve.getPoint(u)} size={6} color="#e8fbff" opacity={0.9} />;
        })}
        <Runner p={[0, 2, 0]} spin={t * 8} s={2.2} />
        <Generator p={[0, 12, 0]} spin={t * 8} />
        <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6, 9, 48]} />
          <meshBasicMaterial color="#4ceeff" transparent opacity={0.3} />
        </mesh>
      </DamCanvas>
      <Pill o={fadeIn(f, c.turning + 2)} value="WATER → SPIN" label="RIVER PRESSURE" top={190} color="#4ceeff" />
    </AbsoluteFill>
  );
};

export const SetVegas: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const lit = ramp(f, c.mw2000 + 10, c.vegas + 10, easeInOut);
  const cam: Cam = { pos: keys3(f, [[c.mw2000, [-10, 30, 160]], [c.congrats, [0, 40, 60]]]), look: [80, 150, -2300], fov: 36 };
  const sand = tex("asphalt", "#7a6250", [80, 80], 2);
  const pylons = Array.from({ length: 10 }, (_, i) => -i * 320);
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="dusk" shadow={600} fog={[600, 4200]} bloom={1.1}>
        <mesh position={[0, 0, -1800]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[8000, 8000]} />
          <meshStandardMaterial map={sand} color="#b89878" roughness={1} />
        </mesh>
        {pylons.map((z, i) => (
          <Pylon key={i} p={[40, 0, z]} s={1.4} />
        ))}
        {[-15, 15].map((dx) =>
          pylons.slice(0, -1).map((z, i) => (
            <TubePath key={`${dx}${i}`} points={[new THREE.Vector3(40 + dx, 42, z), new THREE.Vector3(40 + dx, 36, z - 160), new THREE.Vector3(40 + dx, 42, z - 320)]} radius={0.3} color="#ffd88a" opacity={0.5 + 0.5 * lit} glow={false} />
          )),
        )}
        {[0, 1, 2].map((q) => {
          const z = -((t * 900 + q * 1000) % 2900);
          return <Glow key={q} position={[40, 40, z]} size={30} color="#ffe6a0" opacity={0.9} />;
        })}
        <group position={[150, 0, -2300]} scale={2}>
          <CityLights p={[0, 0, 0]} lit={lit} t={t} />
        </group>
        {/* desert mountains */}
        {[-1, 1, 2].map((k) => (
          <mesh key={k} position={[k * 1400, 0, -3800]} scale={[900, 260 + 80 * k, 300]}>
            <coneGeometry args={[1, 1, 6]} />
            <meshStandardMaterial color="#4a3a4a" roughness={1} />
          </mesh>
        ))}
      </DamCanvas>
      <Pill o={fadeIn(f, c.mw2000)} value="2,080 MW" label="FOR LAS VEGAS" top={190} color="#ffd23f" />
    </AbsoluteFill>
  );
};

// ───────────────────────── 10. finale on the crest ─────────────────────────
const CX = -40;
const CZ = zUp(CX, 1) + 7;
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const close = f >= c.justTo;
  const stand = f >= c.follow - 4;
  const cam: Cam = close
    ? {
        pos: keys3(f, [
          [c.justTo, [CX + 7, H + 3.2, CZ + 6]],
          [c.callIt, [CX + 9, H + 4.5, CZ + 9]],
          [c.hooverDam + 8, [CX + 70, H + 40, CZ + 120]],
          [c.follow - 1, [CX + 72, H + 42, CZ + 124]],
          [c.follow, [CX + 4.5, H + 2.2, CZ + 8.5]],
          [c.end, [CX + 4.2, H + 2.0, CZ + 7.5]],
        ]),
        look: keys3(f, [
          [c.justTo, [CX, H + 1.0, CZ]],
          [c.callIt, [CX, H + 1.2, CZ]],
          [c.hooverDam + 8, [CX - 10, H - 30, CZ - 20]],
          [c.follow - 1, [CX - 10, H - 30, CZ - 20]],
          [c.follow, [CX + 2.2, H + 1.3, CZ + 0.6]],
        ]),
        fov: 42,
      }
    : {
        pos: keys3(f, [
          [c.congrats, [30, 120, 760]],
          [c.justTo, [60, 330, 640]],
        ]),
        look: [0, 130, 60],
        fov: 42,
      };
  const nearShot = close && !(f > c.callIt + 10 && f < c.follow);
  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="golden" shadow={nearShot ? 12 : 500} shadowAt={nearShot ? [CX, H, CZ] : [0, 100, 100]} sun={nearShot ? [CX - 30, H + 40, CZ + 20] : undefined}>
        <Canyon />
        <Dam />
        <Lake y={200} t={t} />
        <IntakeTowers />
        <Powerhouse />
        <River z0={420} z1={1600} y={4} t={t} speed={3} foam={0.2} color="#2f7e8a" />
        {[0, 1, 2, 3].map((i) => {
          const x = -100 + ((t * 9 + i * 55) % 200);
          return <Car key={i} p={[x, H, zUp(x, 1) + (i % 2 ? 5 : 9)]} color={["#c0392b", "#f2f2ee", "#2f4a5e", "#f2c14e"][i]} ry={i % 2 ? Math.PI / 2 : -Math.PI / 2} />;
        })}
        {/* the friend's pool on the crest, hose over the parapet into Lake Mead */}
        <InflatablePool p={[CX, H, CZ]} level={0.9} t={t} />
        <Hose pts={[[CX - 1.2, H + 0.9, CZ - 0.6], [CX - 1.8, H + 1.6, CZ - 4], [CX - 2, H + 1.4, CZ - 6.6], [CX - 2.1, H - 6, CZ - 8], [CX - 2.2, 200.2, CZ - 12]]} />
        {stand ? (
          <Model
            file="man_a.glb"
            anims={LIB1}
            clip="Dance_Loop"
            t={t}
            p={[CX + 2.8, H, CZ + 0.8]}
            ry={0.6}
            outfit={FRIEND}
            tint={{ Hair: "#3a2a1c" }}
            attach={{ bone: "Head", node: <FursuitHead s={MASK_S} p={WORN} t={t} dance={1} /> }}
          />
        ) : (
          <Model
            file="man_a.glb"
            anims={LIB1}
            clip="Sitting_Idle_Loop"
            t={t}
            p={[CX, H + 0.12, CZ]}
            ry={0.6}
            outfit={FRIEND}
            tint={{ Hair: "#3a2a1c" }}
            attach={{ bone: "Head", node: <FursuitHead s={MASK_S} p={WORN} t={t} /> }}
          />
        )}
      </DamCanvas>
      {f >= c.hooverDam ? <Big x={540} y={250} text={"THE HOOVER DAM"} o={pop(f, c.hooverDam)} color="#ffd23f" size={96} /> : null}
      <FollowPill f={f} at={c.follow} until={c.end} top={1400} />
    </AbsoluteFill>
  );
};

// keep tree-shaking honest for helpers only used in some builds
void [ARCH_R, blockList, fbm, rnd, Cyl, easeInOut];
