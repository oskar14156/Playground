import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, project, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { PlaneModel } from "../../lib/three/PlaneModel";
import { House, RB, tex } from "../../lib/three/diorama";
import { easeOut, keys3, ramp } from "../../lib/timing";
import { fonts } from "../../lib/theme";
import { Big, Tag } from "../rocket/sets";
import { LawnCanvas } from "../white-house/world";
import { OakTree } from "../white-house/props";
import { c } from "./cues";
import { Base, HANGARS } from "./base";
import { A12, BoundaryPost, ETSign, HangarNumber, MiG21, Pickup, Popcorn, RoadSensor, Scrub, Sedan, U2, WarningSign } from "./props";
import { DesertCanvas, ringH } from "./world";
import { usePbr } from "../../lib/three/pbr";

export type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 10) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" };
const YOU: Outfit = { top: "#e8573a", pants: "#2c3440", shoes: "#f2f2f2" };
const CAMO: Outfit = { top: "#8a7a58", pants: "#7a6a4a", shoes: "#3a2e22", sleeves: 0.85 };
const MASK_S = 0.5;

/** A camo dude: desert camo, dark shades. */
const Shades: React.FC = () => (
  <group position={[0, 0.08, 0.1]}>
    <mesh>
      <boxGeometry args={[0.13, 0.03, 0.012]} />
      <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.6} />
    </mesh>
  </group>
);
const CamoDude: React.FC<{ clip: string; t: number; p: V3; ry: number; file?: string; lib?: string }> = ({ clip, t, p, ry, file = "man_d.glb", lib = LIB2 }) => (
  <Model file={file} anims={lib} clip={clip} t={t} p={p} ry={ry} outfit={CAMO} tint={{ Hair: "#2a1d14" }} attach={{ bone: "Head", node: <Shades /> }} />
);

// ───────────────────────── HOME: the hook in your friend's back garden ─────────────────────────
export const SetHome: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [0, [1.6, 1.55, 6.2]],
      [c.hide, [1.2, 1.6, 5.6]],
      [c.over, [3.4, 2.2, 7.6]],
      [c.desert, [3.6, 2.3, 8]],
    ]),
    look: keys3(f, [
      [0, [0, 1.15, 0]],
      [c.hide, [0, 1.15, 0]],
      [c.over, [1.2, 1.3, -1.5]],
      [c.desert, [1.2, 1.3, -1.5]],
    ]),
    fov: 42,
  };
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const glow = 0.6 + 0.4 * Math.sin(t * 3);
  const lid = ramp(f, c.hide, c.hide + 10);
  const pMask = at([0, 1.6, 0]);
  const pNeighbour = at([4.6, 2.2, -4.2]);
  return (
    <AbsoluteFill>
      <LawnCanvas cam={cam} t={t} night={0} monument={false}>
        <House p={[-3, 0, -9]} siding="#d6c7a8" lit={0} seed={8} />
        {/* garden fence + the neighbour peeking over it */}
        {Array.from({ length: 14 }, (_, i) => (
          <RB key={i} p={[-2 + i * 0.6, 0.9, -4.5]} s={[0.12, 1.8, 0.05]} r={0.02} color="#c9a77a" />
        ))}
        <RB p={[1.9, 1.5, -4.48]} s={[8.4, 0.1, 0.06]} r={0.02} color="#b8946a" />
        <group position={[-7, 0, -6]}>
          <OakTree s={0.7} seed={3} />
        </group>
        {f >= c.over - 4 ? <Model file="woman_c.glb" anims={LIB2} clip="Idle_TalkingPhone_Loop" t={t} p={[4.6, 0.3 + 0.4 * ramp(f, c.over - 4, c.over + 6), -5.0]} ry={-0.4} outfit={{ top: "#d98ab0", pants: "#4a4a5a", shoes: "#eeeeee" }} /> : null}
        {/* garden table, the box, the glowing mask */}
        <RB p={[0, 0.72, 0]} s={[1.4, 0.06, 0.9]} r={0.02} color="#8a6a4a" />
        {[-0.6, 0.6].map((x) => [-0.35, 0.35].map((z) => <RB key={`${x}${z}`} p={[x, 0.36, z]} s={[0.06, 0.72, 0.06]} r={0.01} color="#6a5038" />))}
        <RB p={[0, 0.95, 0]} s={[0.7, 0.42, 0.55]} r={0.02} color="#c8a46e" rough={0.9} />
        <RB p={[0, 1.17 + 0.25 * lid, -0.27 - 0.1 * lid]} s={[0.7, 0.02, 0.55]} rot={[-1.2 * (1 - lid) - 0.1, 0, 0]} r={0.01} color="#b8925c" />
        <group position={[0, 1.22, 0.02]}>
          <FursuitHead s={MASK_S} t={t} />
        </group>
        <Glow position={[0, 1.35, 0.05]} size={1.6 * glow} color="#7dff8a" opacity={0.55 * (1 - lid * 0.7)} />
        <Model file="man_b.glb" anims={LIB2} clip={f < c.hide ? "Idle_No_Loop" : "Idle_FoldArms_Loop"} t={t} p={[-1.0, 0, 0.3]} ry={0.9} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} />
        <Model file="man_a.glb" anims={LIB1} clip="Idle_Talking_Loop" t={t} p={[1.05, 0, 0.45]} ry={-0.9} outfit={YOU} tint={{ Hair: "#3b2a1e" }} />
      </LawnCanvas>
      {f >= 20 && f < c.hide && pMask ? <Tag x={pMask.x} y={pMask.y} text="ALIEN?!" color="#5dfc8d" o={fadeIn(f, 20)} /> : null}
      {f >= c.over + 4 && pNeighbour ? <Tag x={pNeighbour.x} y={pNeighbour.y} text="NOSY NEIGHBOUR" color="#ff6b5e" side="left" o={fadeIn(f, c.over + 4)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── DESERT: the drive out, the lake, the line, the base, Janet ─────────────────────────
const ROAD = new THREE.CatmullRomCurve3([new THREE.Vector3(1500, 0, 1850), new THREE.Vector3(1150, 0, 1500), new THREE.Vector3(800, 0, 1150), new THREE.Vector3(480, 0, 760), new THREE.Vector3(220, 0, 380)]); // stays inside the mountain ring
const roadAt = (k: number): V3 => {
  const p = ROAD.getPointAt(Math.min(1, Math.max(0, k)));
  return [p.x, 0, p.z];
};
const LINE_K = 0.52; // where the boundary crosses the road
const LINE_P = roadAt(LINE_K);
const LINE_T = (() => {
  const tg = ROAD.getTangentAt(LINE_K);
  return [tg.x, 0, tg.z] as V3;
})();
/** a point beside the road at the line: s = sideways metres (left +), b = metres back along the road */
const nearLine = (s: number, b: number): V3 => [LINE_P[0] - LINE_T[2] * s - LINE_T[0] * b, 0, LINE_P[2] + LINE_T[0] * s - LINE_T[2] * b];

/** nearLine with a height */
const nly = (s: number, b: number, y: number): V3 => {
  const p = nearLine(s, b);
  return [p[0], y, p[2]];
};
const HILL = nly(14, -70, 0);
/** the public hill next to the base (Freedom Ridge stand-in) and the direction from it to the base */
const HILL2: V3 = [520, 0, 470];
const TO_BASE: V3 = (() => {
  const d = new THREE.Vector3(-100 - HILL2[0], 0, 200 - HILL2[2]).normalize();
  return [d.x, 0, d.z];
})();
/** a far peak in the mountain ring standing in for the public viewpoint 42 km away: the highest ring point in that direction */
const PEAK: V3 = (() => {
  const a = Math.atan2(2350, 2650);
  let best: V3 = [0, 0, 0];
  for (let r = 2500; r < 5100; r += 10) {
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const h = ringH(x, z);
    if (h > best[1]) best = [x, h, z];
  }
  return best;
})();
/** from the peak towards the base (horizontal unit vector) */
const PEAK_DIR: V3 = (() => {
  const d = new THREE.Vector3(-100 - PEAK[0], 0, 150 - PEAK[2]).normalize();
  return [d.x, 0, d.z];
})();
/** a spot just in front of the peak's top, towards the base, at the terrain height */
const PEAK_STAND: V3 = (() => {
  const x = PEAK[0] + PEAK_DIR[0] * 3;
  const z = PEAK[2] + PEAK_DIR[2] * 3;
  return [x, ringH(x, z) - 0.1, z];
})();
/** scrub stays off the road, the base, the runway and the lake */
const ROAD_PTS = Array.from({ length: 160 }, (_, i) => ROAD.getPointAt(i / 159));
const avoidScrub = (x: number, z: number) => {
  if (x > -340 && x < 260 && z > -70 && z < 370) return true;
  if (Math.abs(z) < 45 && Math.abs(x) < 1850) return true;
  if (((x - 0) / 1320) ** 2 + ((z + 600) / 540) ** 2 < 1) return true;
  for (const q of ROAD_PTS) if ((q.x - x) ** 2 + (q.z - z) ** 2 < 100) return true;
  return false;
};

const DirtRoad: React.FC = () => {
  const geo = useMemo(() => {
    const n = 400;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const p = ROAD.getPointAt(k);
      const tg = ROAD.getTangentAt(k);
      pos.push(p.x - tg.z * 4, 0.25, p.z + tg.x * 4, p.x + tg.z * 4, 0.25, p.z - tg.x * 4);
      uv.push(0, k * 400, 1, k * 400);
      if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  const dirt = useMemo(() => tex("asphalt", "#b39a76", [1, 1], 241), []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={dirt} roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
};

// the workers' daily commute: a jam of cars on the dirt road up to the gate
const JAM = Array.from({ length: 34 }, (_, i) => 0.992 - i * 0.0042);
const JAM_COLORS = ["#d9dcdf", "#2f6fb5", "#3b3f45", "#b8a07a", "#7a1f1a", "#eef0f2", "#4a6b3a", "#1d2a3a"];
const jamSide = (k: number, s: number, y: number): V3 => {
  const p = ROAD.getPointAt(k);
  const tg = ROAD.getTangentAt(k);
  return [p.x - tg.z * s, y, p.z + tg.x * s];
};
const JAM_CAM0 = jamSide(0.835, 8, 9);
const JAM_CAM1 = jamSide(0.862, 7, 7.5);
const JAM_LOOK: V3 = (() => {
  const p = ROAD.getPointAt(0.97);
  return [p.x - 40, 3, p.z - 40];
})();

const camDesert = (f: number): Cam => {
  const L = LINE_P;
  // chase cam behind your car on the drive out
  if (f < c.lake) {
    const kk = 0.05 + 0.9 * ramp(f, c.desert - 10, c.runway + 20, (x) => x);
    const p = ROAD.getPointAt(kk);
    const tg = ROAD.getTangentAt(kk);
    const lift = 1 - ramp(f, c.desert, c.nevada + 10);
    return { pos: [p.x - tg.x * (18 + 30 * lift), 5 + 18 * lift, p.z - tg.z * (18 + 30 * lift)], look: [p.x + tg.x * 160, 8 - 30 * lift, p.z + tg.z * 160], fov: 40 };
  }
  const k: [number, V3][] = [
    [c.lake, [-300, 6, 260]],
    [c.runway, [-200, 14, 120]],
    [c.look - 1, [-160, 20, 110]],
    [c.look, [L[0] + 60, 6, L[2] + 70]],
    [c.sign - 1, [L[0] + 40, 4, L[2] + 50]],
    [c.sign, nly(-3.0, 6.5, 1.7)],
    [c.deadly, nly(-3.3, 3.0, 1.5)],
    [c.guards - 1, nly(-3.3, 2.9, 1.5)],
    [c.guards, [HILL[0] - 3 - LINE_T[0] * 9 + LINE_T[2] * 2, 5.6, HILL[2] - 3 * 0 - LINE_T[2] * 9 - LINE_T[0] * 2]],
    [c.sensors - 1, [HILL[0] - 3 - LINE_T[0] * 8 + LINE_T[2] * 2, 5.6, HILL[2] - LINE_T[2] * 8 - LINE_T[0] * 2]],
    [c.sensors, nly(2.4, 9.5, 1.5)],
    [c.fence - 1, nly(2.3, 9.2, 1.5)],
    [c.fence, nly(-11, 7, 2.4)],
    [c.hills - 1, nly(-12, 7.5, 2.6)],
    [c.hills, [HILL2[0] - TO_BASE[0] * 9 + TO_BASE[2] * 4, 7.6, HILL2[2] - TO_BASE[2] * 9 - TO_BASE[0] * 4]],
    [c.closest - 1, [HILL2[0] - TO_BASE[0] * 10 + TO_BASE[2] * 4, 7.8, HILL2[2] - TO_BASE[2] * 10 - TO_BASE[0] * 4]],
    // over the shoulder of a tourist on the far peak, the base tiny below
    [c.closest, [PEAK_STAND[0] - PEAK_DIR[0] * 6.5 + PEAK_DIR[2] * 0.6, PEAK_STAND[1] + 2.9, PEAK_STAND[2] - PEAK_DIR[2] * 6.5 - PEAK_DIR[0] * 0.6]],
    [c.workers - 1, [PEAK_STAND[0] - PEAK_DIR[0] * 5 + PEAK_DIR[2] * 0.5, PEAK_STAND[1] + 2.6, PEAK_STAND[2] - PEAK_DIR[2] * 5 - PEAK_DIR[0] * 0.5]],
    [c.workers, JAM_CAM0],
    [c.fly - 1, JAM_CAM1],
    [c.fly, [260, 5, 64]],
    [c.build, [240, 5, 60]],
  ];
  const l: [number, V3][] = [
    [c.desert, [1200, 0, 1800]],
    [c.lake - 1, [700, 0, 1000]],
    [c.lake, [600, 2, -300]],
    [c.runway, [400, 0, 0]],
    [c.look - 1, [400, 0, 0]],
    [c.look, [L[0], 1.5, L[2]]],
    [c.sign - 1, [L[0], 1.5, L[2]]],
    [c.sign, nly(-3.5, -0.4, 1.9)],
    [c.deadly, nly(-3.5, -0.4, 1.25)],
    [c.guards - 1, nly(-3.5, -0.4, 1.25)],
    [c.guards, [HILL[0] - 2, 4.9, HILL[2]]],
    [c.sensors - 1, [HILL[0] - 2, 4.9, HILL[2]]],
    [c.sensors, nly(4.6, 6, 0.3)],
    [c.fence - 1, nly(4.6, 6, 0.3)],
    [c.fence, nly(-1, -0.5, 1.2)],
    [c.hills - 1, nly(-1, -0.5, 1.2)],
    [c.hills, [-100, 12, 200]],
    [c.closest - 1, [-100, 12, 200]],
    [c.closest - 1, [-100, 12, 200]],
    [c.closest, [PEAK_STAND[0] + PEAK_DIR[0] * 60, PEAK_STAND[1] - 7, PEAK_STAND[2] + PEAK_DIR[2] * 60]],
    [c.workers - 1, [PEAK_STAND[0] + PEAK_DIR[0] * 60, PEAK_STAND[1] - 7, PEAK_STAND[2] + PEAK_DIR[2] * 60]],
    [c.workers, JAM_LOOK],
    [c.fly - 1, JAM_LOOK],
    [c.fly, [700, 30, 0]],
    [c.build, [-200, 6, 0]],
  ];
  return { pos: keys3(f, k), look: keys3(f, l), fov: 40 };
};

export const SetDesert: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const jK0 = ramp(f, c.fly - 6, c.build - 4, (x) => x);
  const jX0 = 760 - 1000 * jK0;
  const jP: V3 = [jX0, (jX0 > 240 ? (jX0 - 240) * 0.07 : 0) + 4, 0];
  const hillSand = usePbr("coast_sand_rocks_02", [12, 12]);
  const cam0 = camDesert(f);
  const follow = f >= c.fly ? 0.85 : 0;
  const cam: Cam = follow ? { ...cam0, look: lerp3(cam0.look, jP, follow) } : cam0;
  const at = (p: V3) => project(p, cam, 1080, 1920);
  // your car drives out with the box; the tourists' car later stops at the line
  const yourK = ramp(f, c.desert - 10, c.runway + 20, (x) => x);
  const yourCar = roadAt(0.05 + 0.9 * yourK);
  const touristK = ramp(f, c.look, c.sign - 4, easeOut);
  const touristCar = roadAt(0.32 + (LINE_K - 0.012 - 0.32) * touristK);
  const tangentAt = (k: number) => {
    const tg = ROAD.getTangentAt(Math.min(1, Math.max(0, k)));
    return Math.atan2(-tg.z, tg.x);
  };
  const runway = f >= c.runway ? ramp(f, c.runway, c.runway + 14, easeOut) : 0;
  const baseUp = ramp(f, c.workers, c.workers + 22, easeOut);
  const signPop = pop(f, c.sign, 10);
  const ping = f >= c.sensors + 6 ? ((f - c.sensors - 6) / 24) % 1 : 0;
  const posts = f >= c.fence ? ramp(f, c.fence, c.fence + 24, (x) => x) : f >= c.sign ? 0.15 : 0;
  // Janet: lands on the runway, from east to west
  const jK = ramp(f, c.fly - 6, c.build - 4, (x) => x);
  const jetX = 760 - 1000 * jK; // final approach → touchdown at x ≈ 240 → rolls out past the camera
  const jetY = jetX > 240 ? (jetX - 240) * 0.07 : 0;
  const pSign = at(nly(-3.5, -0.4, 3.0));
  const pGuards = at([HILL[0] - 3, 6.4, HILL[2]]);
  const pSensor = at(nly(4.6, 6, 0.8));
  const pLine = at(nly(-9, 0, 1.6));
  const tourists: { file: string; s: number; clip: string; lib: string; outfit: Outfit }[] = [
    { file: "man_c.glb", s: -2.6, clip: "Idle_TalkingPhone_Loop", lib: LIB2, outfit: { top: "#e3c13a", pants: "#3b4a6a", shoes: "#eee" } },
    { file: "woman_a.glb", s: -1.2, clip: "Idle_Loop", lib: LIB1, outfit: { top: "#5dfc8d", pants: "#2c2c2c", shoes: "#eee" } },
    { file: "woman_b.glb", s: 1.6, clip: "Idle_TalkingPhone_Loop", lib: LIB2, outfit: { top: "#e8573a", pants: "#5a4a3a", shoes: "#eee" } },
  ];
  return (
    <AbsoluteFill>
      <DesertCanvas cam={cam} t={t} ao={f < c.lake || (f >= c.workers && f < c.fly) ? 0 : 0.8}>
        <DirtRoad />
        {/* your car with the box on the back seat */}
        {f < c.look ? (
          <group position={yourCar} rotation={[0, tangentAt(0.05 + 0.9 * yourK), 0]}>
            <Sedan color="#c0392b" />
          </group>
        ) : null}
        {/* the runway appears on "a free runway" (the base comes later) */}
        {runway > 0 && f < c.workers ? (
          <group scale={[runway, 1, 1]}>
            <Base hangarDoor={0} light={0} />
          </group>
        ) : null}
        {f >= c.workers ? (
          <group scale={[1, Math.max(0.01, baseUp), 1]}>
            <Base hangarDoor={0.4} light={0.6} />
          </group>
        ) : null}
        {/* the workers' commute: bumper to bumper up to the gate, brake lights on, inching forward */}
        {f >= c.workers && f < c.fly
          ? JAM.map((k, i) => {
              const inch = 0.0011 * ramp(f, c.workers + 6 + i * 1.5, c.workers + 30 + i * 1.5, easeOut);
              const kk = k + inch;
              return (
                <group key={i} position={jamSide(kk, -2.1, 0.26)} rotation={[0, tangentAt(kk), 0]}>
                  <Sedan color={JAM_COLORS[(i * 5) % JAM_COLORS.length]} brake={1.2} />
                </group>
              );
            })
          : null}
        {/* the line, the sign, the camo dudes on their hill, the sensor */}
        {f >= c.look ? (
          <group>
            <group position={touristCar} rotation={[0, tangentAt(0.32 + (LINE_K - 0.012 - 0.32) * touristK), 0]}>
              <Sedan color="#2f6fb5" />
            </group>
            {f >= c.sign ? (
              <group position={nearLine(-3.5, -0.4)} rotation={[0, Math.atan2(LINE_T[0], LINE_T[2]) + Math.PI, 0]} scale={[signPop, signPop, signPop]}>
                <WarningSign />
              </group>
            ) : null}
            {Array.from({ length: 41 }, (_, i) => {
              const s = (i - 20) * 9;
              const vis = Math.abs(s) <= posts * 180 ? 1 : 0;
              return vis && Math.abs(s) > 5 ? (
                <group key={i} position={nearLine(s, 0)}>
                  <BoundaryPost />
                </group>
              ) : null;
            })}
            {f >= c.guards ? (
              <group>
                {/* a low hill beside the road */}
                <mesh position={[HILL[0], -24, HILL[2]]} scale={[1.4, 0.35, 1]}>
                  <sphereGeometry args={[80, 64, 32]} />
                  <meshStandardMaterial {...hillSand} color="#ffe6bf" roughness={1} />
                </mesh>
                <group position={[HILL[0] + 3, 4.0, HILL[2]]} rotation={[0, Math.atan2(LINE_T[0], LINE_T[2]) - 0.6, 0]}>
                  <Pickup />
                </group>
                <CamoDude clip="Idle_FoldArms_Loop" t={t} p={[HILL[0] - 2.5, 3.95, HILL[2] + 2]} ry={Math.atan2(-LINE_T[0], -LINE_T[2])} />
                <CamoDude clip="Idle_Rail_Loop" t={t + 0.5} file="man_c.glb" p={[HILL[0] - 4.2, 3.9, HILL[2] - 1]} ry={Math.atan2(-LINE_T[0], -LINE_T[2])} />
              </group>
            ) : null}
            {f >= c.sensors ? (
              <group position={nly(4.6, 6, 0)}>
                <RoadSensor t={t} ping={ping} />
              </group>
            ) : null}
            {/* tourists get out and stand exactly at the line */}
            {f >= c.fence - 10 && f < c.workers
              ? tourists.map((p, i) => <Model key={i} file={p.file} anims={p.lib} clip={p.clip} t={t + i * 0.4} p={nearLine(p.s, 1.2)} ry={Math.atan2(-LINE_T[0], -LINE_T[2])} outfit={p.outfit} />)
              : null}
          </group>
        ) : null}
        <Scrub n={9000} area={[-250, 1600, -150, 1900]} avoid={avoidScrub} />
        {/* the public hill: tourists photograph the base, until 1995 */}
        {f >= c.hills - 4 && f < c.workers ? (
          <group>
            <mesh position={[HILL2[0], -26, HILL2[2]]} scale={[1.2, 0.36, 1]}>
              <sphereGeometry args={[84, 64, 32]} />
              <meshStandardMaterial {...hillSand} color="#ffe6bf" roughness={1} />
            </mesh>
            {f < c.take + 12
              ? [-3, -1.2, 1, 2.8].map((s2, i) => (
                  <Model
                    key={i}
                    file={["man_c.glb", "woman_a.glb", "woman_b.glb", "man_d.glb"][i]}
                    anims={LIB2}
                    clip="Idle_TalkingPhone_Loop"
                    t={t + i * 0.37}
                    p={[HILL2[0] + TO_BASE[2] * s2, 4.1, HILL2[2] - TO_BASE[0] * s2]}
                    ry={Math.atan2(TO_BASE[0], TO_BASE[2])}
                    outfit={[{ top: "#e3c13a", pants: "#3b4a6a", shoes: "#eee" }, { top: "#5dfc8d", pants: "#2c2c2c", shoes: "#eee" }, { top: "#e8573a", pants: "#5a4a3a", shoes: "#eee" }, { top: "#9a6ad6", pants: "#2c2c2c", shoes: "#eee" }][i]}
                  />
                ))
              : Array.from({ length: 9 }, (_, i) => (
                  <group key={i} position={[HILL2[0] + TO_BASE[2] * (i - 4) * 3, 4.0, HILL2[2] - TO_BASE[0] * (i - 4) * 3]}>
                    <BoundaryPost />
                  </group>
                ))}
          </group>
        ) : null}
        {/* the last public viewpoint: a tourist filming from the far peak */}
        {f >= c.closest && f < c.workers ? (
          <Model file="man_c.glb" anims={LIB2} clip="Idle_TalkingPhone_Loop" t={t} p={PEAK_STAND} ry={Math.atan2(PEAK_DIR[0], PEAK_DIR[2])} outfit={{ top: "#e3c13a", pants: "#3b4a6a", shoes: "#eee" }} />
        ) : null}
        {/* Janet */}
        {f >= c.fly - 6 ? (
          <group position={[jetX, jetY + 2.4, 0]} rotation={[0, Math.PI / 2, jetX > 240 ? 0.06 : 0]}>
            <PlaneModel frame={f} body="#f4f4f2" tail="#c0392b" scale={[18, 18, 18]} />
          </group>
        ) : null}
      </DesertCanvas>
      {f >= c.nevada && f < c.lake ? <Big x={540} y={420} text={"NEVADA DESERT\nNOBODY LIVES HERE"} o={fadeIn(f, c.nevada)} size={70} color="#ffd23f" /> : null}
      {f >= c.runway + 8 && f < c.look ? <Big x={540} y={1460} text={"FREE RUNWAY\n3.7 KM · 2.3 MI"} o={fadeIn(f, c.runway + 8)} size={74} color="#ffffff" /> : null}
      {f >= c.deadly + 6 && f < c.guards && pSign ? <Big x={540} y={1470} text={"DEADLY FORCE\nAUTHORIZED"} o={fadeIn(f, c.deadly + 6)} size={80} color="#ff3b30" /> : null}
      {f >= c.guards + 8 && f < c.sensors && pGuards ? <Tag x={pGuards.x} y={pGuards.y} text="CAMO DUDES" color="#c9a57a" o={fadeIn(f, c.guards + 8)} /> : null}
      {f >= c.sensors + 6 && f < c.fence && pSensor ? <Tag x={pSensor.x} y={pSensor.y} text="SENSOR" color="#ff6b5e" o={fadeIn(f, c.sensors + 6)} /> : null}
      {f >= c.line && f < c.workers && pLine ? <Tag x={pLine.x} y={pLine.y} text="NO FENCE. JUST A LINE." color="#ff8a3a" side="left" o={fadeIn(f, c.line)} /> : null}
      {f >= c.take && f < c.closest ? <Stamp text="TAKEN · 1995" o={pop(f, c.take, 6)} color="#ff3b30" /> : null}
      {f >= c.closest + 6 && f < c.workers ? <Big x={540} y={1460} text={"CLOSEST PUBLIC VIEW\n42 KM · 26 MI AWAY"} o={fadeIn(f, c.closest + 6)} size={70} color="#ffd23f" /> : null}
      {f >= c.workers + 10 && f < c.fly ? <Big x={540} y={400} text={f >= c.workers + 33 ? "EVERY. SINGLE. DAY." : "DAILY COMMUTE"} o={fadeIn(f, c.workers + 10)} size={74} color="#ffd23f" /> : null}
      {f >= c.workers + 33 && f < c.fly ? <Big x={540} y={1460} text={["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"][Math.min(6, Math.floor((f - c.workers - 33) / 5))]} o={1} size={110} color="#ffffff" /> : null}
      {f >= c.janet - 4 ? <Big x={540} y={1460} text={"CALL SIGN:\nJANET"} o={fadeIn(f, c.janet - 4)} size={86} color="#ff6b5e" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── DUSK: the U-2 up high catching the sun → a "UFO" ─────────────────────────
export const SetDusk: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const high = f >= c.spy && f < c.sunset; // the strange light from the ground, the spy plane up close at 18 km, the ground again
  const U2P: V3 = [-600 + (f - c.spy) * 6, 18000, -1200];
  const cam: Cam = high
    ? { pos: keys3(f, [[c.spy, [U2P[0] + 24, 18004, -1200 + 34]], [c.sunset, [U2P[0] + 30, 18008, -1200 + 40]]]), look: [U2P[0], 18000, -1200], fov: 40 }
    : { pos: keys3(f, [[c.lights, [272, 2, 250]], [c.sunset, [260, 2, 240]], [c.pile, [250, 2, 230]]]), look: f < c.spy ? [-2000, 260, -420] : [-2000, 560, -420], fov: 40 };
  const dusk = high ? 0.55 : 0.9;
  const glow = high ? 0 : f < c.spy ? 0.75 * ramp(f, c.lights + 4, c.lights + 16) : ramp(f, c.sunset + 4, c.glows + 6);
  const at = (p: V3) => project(p, cam, 1080, 1920);
  // from the ground the U-2 is a point of light 18 km up: draw it as a glow along the same line of sight, nearer
  const seen: V3 = [-44000 + (f - c.sunset) * 6, 18000, -9000];
  const dir = new THREE.Vector3(seen[0] - cam.pos[0], seen[1] - cam.pos[1], seen[2] - cam.pos[2]).normalize().multiplyScalar(6000);
  const fake: V3 = [cam.pos[0] + dir.x, cam.pos[1] + dir.y, cam.pos[2] + dir.z];
  // project() clips at 1 km: label a point on the same line of sight, 500 m out
  const pUfo = at([cam.pos[0] + dir.x / 12, cam.pos[1] + dir.y / 12, cam.pos[2] + dir.z / 12]);
  return (
    <AbsoluteFill>
      <DesertCanvas cam={cam} t={t} dusk={dusk} ao={0}>
        {!high ? <Base hangarDoor={0.4} light={1} /> : null}
        {high ? (
          <group position={U2P}>
            <U2 glow={0} />
          </group>
        ) : (
          <group>
            {f < c.spy ? (
              <group>
                <Model file="man_c.glb" anims={LIB2} clip="Idle_TalkingPhone_Loop" t={t} p={[cam.pos[0] - 13, 0, cam.pos[2] - 4.6]} ry={-1.9} outfit={{ top: "#e3c13a", pants: "#3b4a6a", shoes: "#eee" }} />
                <Model file="woman_b.glb" anims={LIB2} clip="Idle_No_Loop" t={t + 0.4} p={[cam.pos[0] - 12.2, 0, cam.pos[2] - 1.6]} ry={-1.7} outfit={{ top: "#e8573a", pants: "#5a4a3a", shoes: "#eee" }} />
              </group>
            ) : null}
            <Glow position={fake} size={260 + 40 * Math.sin(t * 2)} color="#ff9a4a" opacity={0.8 * glow} fog={false} />
            <Glow position={fake} size={110} color="#ffe2b0" opacity={glow} fog={false} />
            <Glow position={fake} size={40} color="#ffffff" opacity={glow} fog={false} />
          </group>
        )}
      </DesertCanvas>
      {high && f >= c.spy + 6 ? <Big x={540} y={380} text={"U-2 SPY PLANE\n18 KM · 60,000 FT"} o={fadeIn(f, c.spy + 6)} size={70} color="#ffffff" /> : null}
      {high && f >= c.higher ? <HeightBars f={f} at={c.higher} /> : null}
      {f >= c.lights + 12 && f < c.spy && pUfo ? <Tag x={pUfo.x} y={pUfo.y} text="???" color="#ffd23f" o={fadeIn(f, c.lights + 12)} /> : null}
      {!high && f >= c.glows && pUfo ? <Tag x={pUfo.x} y={pUfo.y} text="UFO?!" color="#5dfc8d" o={fadeIn(f, c.glows)} /> : null}
    </AbsoluteFill>
  );
};

/** U-2 vs airliners, to scale: 18 km vs 3–6 km (1950s cruise), metric + imperial. */
const HeightBars: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const k = ramp(f, at, at + 14, easeOut);
  const bar = (label: string, sub: string, h: number, color: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", width: 300, height: 560 }}>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff", WebkitTextStroke: "5px #000", paintOrder: "stroke fill", textAlign: "center" }}>{label}</div>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 30, color, WebkitTextStroke: "4px #000", paintOrder: "stroke fill", marginBottom: 8, textAlign: "center" }}>{sub}</div>
      <div style={{ width: 120, height: 460 * h * k, background: color, borderRadius: "14px 14px 0 0", border: "5px solid #000" }} />
    </div>
  );
  return (
    <div style={{ position: "absolute", top: 1180, left: 0, width: "100%", display: "flex", justifyContent: "center", gap: 60, opacity: Math.min(1, k * 2) }}>
      {bar("U-2", "18 KM · 60,000 FT", 1, "#ffd23f")}
      {bar("AIRLINERS 1950s", "3–6 KM · 10–20,000 FT", 0.33, "#8fd0ff")}
    </div>
  );
};

// ───────────────────────── HANGAR WINDOW: the pocket puh watches the 150 at the line, with popcorn ─────────────────────────
export const SetWindow: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const H = HANGARS[1];
  // a small office window on the hangar's side, seen from outside; the mask sits behind it
  const W: V3 = [H[0] - 23.6, 3.2, H[1] - 20];
  const cam: Cam = { pos: keys3(f, [[c.popcorn, [W[0] - 4.2, 3.0, W[2] + 1.2]], [c.congrats, [W[0] - 3.4, 3.1, W[2] + 0.8]]]), look: [W[0], 3.1, W[2]], fov: 40 };
  const frame = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-3, -3);
    s.lineTo(3, -3);
    s.lineTo(3, 3);
    s.lineTo(-3, 3);
    s.closePath();
    const h = new THREE.Path();
    h.moveTo(-0.9, -0.6);
    h.lineTo(0.9, -0.6);
    h.lineTo(0.9, 0.6);
    h.lineTo(-0.9, 0.6);
    h.closePath();
    s.holes.push(h);
    return new THREE.ShapeGeometry(s);
  }, []);
  const munch = Math.max(0, Math.sin(t * 6)) * 0.03;
  const wallTex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 64;
    const g = cv.getContext("2d")!;
    for (let x = 0; x < 256; x++) {
      const v = 175 + 45 * Math.sin((x / 256) * Math.PI * 2 * 16);
      g.fillStyle = `rgb(${v},${v + 3},${v + 6})`;
      g.fillRect(x, 0, 1, 64);
    }
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(1, 1);
    return tx;
  }, []);
  return (
    <AbsoluteFill>
      <DesertCanvas cam={cam} t={t} dusk={0.25}>
        <Base hangarDoor={0.4} light={1} />
        {/* the office wall with its window, facing −X */}
        <group position={W} rotation={[0, -Math.PI / 2, 0]}>
          <mesh geometry={frame}>
            <meshStandardMaterial map={wallTex} color="#e3e6e9" roughness={0.45} metalness={0.5} side={THREE.DoubleSide} />
          </mesh>
          {/* window frame */}
          {[
            [0, 0.64, 1.96, 0.08],
            [0, -0.64, 1.96, 0.08],
            [-0.94, 0, 0.08, 1.36],
            [0.94, 0, 0.08, 1.36],
            [0, 0, 0.04, 1.2],
          ].map(([x, y, w, h], i) => (
            <RB key={i} p={[x, y, 0.06]} s={[w, h, 0.08]} r={0.01} color="#9aa0a6" metal={0.5} />
          ))}
          <RB p={[0, -0.66, 0.1]} s={[2, 0.08, 0.25]} r={0.02} color="#e9ebee" />
          {/* dark room behind */}
          <mesh position={[0, 0, -1.6]}>
            <planeGeometry args={[4, 3]} />
            <meshStandardMaterial color="#2a2622" />
          </mesh>
          <pointLight position={[0.4, 0.4, -0.6]} intensity={4} distance={4} color="#ffd9a0" />
          <group position={[-0.15, -0.25 + munch, -0.45]} rotation={[0, 0.2, 0]}>
            <FursuitHead s={MASK_S * 0.9} t={t} />
          </group>
          <group position={[0.55, -0.62, -0.2]}>
            <Popcorn />
          </group>
        </group>
        {/* the big "18" painted beside the office window */}
        <group position={[W[0] - 0.12, 6.6, W[2] + 3.4]} rotation={[0, -Math.PI / 2, 0]}>
          <HangarNumber n="18" />
        </group>
      </DesertCanvas>
      <Big x={540} y={1470} text="🍿" o={fadeIn(f, c.popcorn + 10)} size={110} />
    </AbsoluteFill>
  );
};

// ───────────────────────── FINALE: golden hour over the base, your friend dances with the "alien" ─────────────────────────
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const P: V3 = [-190, 0, 140];
  const cam: Cam = {
    // from the runway side towards the hangars, so the hangar is the backdrop (never fly through it)
    pos: keys3(f, [
      [c.congrats, [-40, 60, -160]],
      [c.callIt, [-150, 18, 60]],
      [c.a51 + 30, [-186, 3.0, 128]],
      [c.end, [-187.5, 2.5, 131]],
    ]),
    look: keys3(f, [
      [c.congrats, [-160, 10, 170]],
      [c.callIt, [-185, 6, 150]],
      [c.a51 + 30, [-190, 1.7, 140]],
      [c.end, [-190, 1.6, 140]],
    ]),
    fov: 40,
  };
  return (
    <AbsoluteFill>
      <DesertCanvas cam={cam} t={t} dusk={0.38} sun={[-90, 60, -110]}>
        <Base hangarDoor={0.6} light={1} />
        <Model file="man_b.glb" anims={LIB1} clip="Dance_Loop" t={t} p={P} ry={0.3} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} attach={{ bone: "Head", node: <FursuitHead s={MASK_S} t={t} p={[0, -0.2, 0.03]} /> }} />
        <CamoDude clip="Idle_FoldArms_Loop" t={t} p={[P[0] + 2.2, 0, P[2] - 1.2]} ry={-0.4} />
        <CamoDude clip="Yes" t={t + 0.3} file="man_c.glb" p={[P[0] - 2.4, 0, P[2] - 0.8]} ry={0.5} />
      </DesertCanvas>
      {f >= c.a51 ? <Big x={540} y={420} text="AREA 51" o={pop(f, c.a51, 10)} size={150} color="#5dfc8d" /> : null}
      {f >= c.a51 + 14 ? <Big x={540} y={560} text="OFFICIALLY: HOMEY AIRPORT" o={fadeIn(f, c.a51 + 14)} size={46} color="#ffffff" /> : null}
    </AbsoluteFill>
  );
};

const Stamp: React.FC<{ text: string; o: number; color: string }> = ({ text, o, color }) => (
  <div style={{ position: "absolute", top: 380, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(1, o) }}>
    <div style={{ transform: `rotate(-8deg) scale(${2 - Math.min(1, o)})`, border: `12px solid ${color}`, color, fontFamily: fonts.punch, fontWeight: 900, fontSize: 104, padding: "4px 30px", borderRadius: 18, background: "rgba(0,0,0,0.35)" }}>{text}</div>
  </div>
);

// ───────────────────────── SKYLAB 1974: the base seen from orbit → flash → the photo + the memo ─────────────────────────
const SKY_HOLE = { x: 90, y: 130, w: 900, h: 640 };
const SKY_H = 1900;
export const SetSkylab: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const snap = c.skylab + 62; // "photographed"
  const fov = f < snap ? 70 - 30 * ramp(f, c.skylab, snap, easeOut) : 40;
  // an oblique shot from high up: the base in the photo's lower half, the white lake and the mountains behind it
  const cam: Cam = { pos: [60, SKY_H, 2300], look: [-60, 0, f < snap ? -40 : 640], fov };
  // labels: project a point on the same line of sight inside the camera's far plane
  const atFar = (p: V3) => {
    const d = [p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]];
    const s = 500 / Math.hypot(d[0], d[1], d[2]);
    return project([cam.pos[0] + d[0] * s, cam.pos[1] + d[1] * s, cam.pos[2] + d[2] * s], cam, 1080, 1920);
  };
  const pBase = atFar([-80, 0, 240]);
  const pLake = atFar([40, 0, -500]);
  const shot = f >= snap;
  const flash = f >= snap ? 1 - ramp(f, snap, snap + 10) : 0;
  const ph = pop(f, snap, 10);
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <AbsoluteFill style={{ filter: shot ? "sepia(0.45) saturate(0.8) contrast(1.08) brightness(1.05)" : "saturate(0.9)" }}>
        <DesertCanvas cam={cam} t={t} ao={0} sun={[-300, 500, 200]}>
          <Base hangarDoor={0} light={0} />
          <DirtRoad />
          <Scrub n={9000} area={[-1200, 1600, -150, 1900]} avoid={avoidScrub} />
        </DesertCanvas>
      </AbsoluteFill>
      {!shot ? (
        // Skylab's camera viewfinder
        <AbsoluteFill>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            {[
              [80, 300, 1, 1],
              [1000, 300, -1, 1],
              [80, 1640, 1, -1],
              [1000, 1640, -1, -1],
            ].map(([x, y, sx, sy], i) => (
              <path key={i} d={`M ${x} ${y + sy * 90} L ${x} ${y} L ${x + sx * 90} ${y}`} stroke="#ffffff" strokeWidth={8} fill="none" opacity={0.85} />
            ))}
            <circle cx={540} cy={960} r={70} stroke="#ffffff" strokeWidth={5} fill="none" opacity={0.7} />
            <path d="M 540 860 L 540 1060 M 440 960 L 640 960" stroke="#ffffff" strokeWidth={4} opacity={0.7} />
          </svg>
          <div style={{ position: "absolute", top: 330, left: 120, fontFamily: fonts.hud, fontSize: 40, color: "#ffffff", letterSpacing: 4, textShadow: "0 2px 6px #000" }}>SKYLAB · 1974</div>
          <div style={{ position: "absolute", top: 1560, right: 120, fontFamily: fonts.hud, fontSize: 40, color: "#ffffff", letterSpacing: 4, textShadow: "0 2px 6px #000" }}>435 KM · 270 MI UP</div>
          {f % 30 < 18 ? <div style={{ position: "absolute", top: 330, right: 120, width: 26, height: 26, borderRadius: 13, background: "#ff3b30" }} /> : null}
        </AbsoluteFill>
      ) : (
        // the print: dark around it, a white border, the label written on the bottom
        <AbsoluteFill style={{ transform: `scale(${1.08 - 0.08 * Math.min(1, ph)})`, transformOrigin: "50% 30%" }}>
          <div
            style={{
              position: "absolute",
              left: SKY_HOLE.x,
              top: SKY_HOLE.y,
              width: SKY_HOLE.w,
              height: SKY_HOLE.h,
              boxShadow: "0 0 0 26px #f4f1ea, 0 0 0 3000px #05070c",
            }}
          />
          <div style={{ position: "absolute", left: SKY_HOLE.x - 26, top: SKY_HOLE.y + SKY_HOLE.h + 26, width: SKY_HOLE.w + 52, height: 84, background: "#f4f1ea", fontFamily: fonts.hud, fontSize: 36, color: "#333", padding: "18px 34px", boxSizing: "border-box" }}>
            SKYLAB 4 · 1974 · FROM SPACE
          </div>
          {pBase ? <Tag x={pBase.x} y={pBase.y} text="AREA 51" color="#5dfc8d" o={fadeIn(f, snap + 10)} /> : null}
          {pLake && f < c.told ? <Tag x={pLake.x} y={pLake.y} text="GROOM LAKE" color="#ffffff" side="left" o={fadeIn(f, snap + 16)} /> : null}
        </AbsoluteFill>
      )}
      {f >= c.told ? (
        <div style={{ position: "absolute", top: 230, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(1, pop(f, c.told, 6)) }}>
          <div style={{ transform: `rotate(-10deg) scale(${2 - Math.min(1, pop(f, c.told, 6))})`, border: "12px solid #ff3b30", color: "#ff3b30", fontFamily: fonts.punch, fontWeight: 900, fontSize: 92, padding: "4px 28px", borderRadius: 16, background: "rgba(0,0,0,0.25)" }}>
            TOLD NOT TO
          </div>
        </div>
      ) : null}
      {flash > 0 ? <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── SPY PLANE: the A-12 rolls out of the hangar ─────────────────────────
export const SetSpy: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const H = HANGARS[1];
  const roll = ramp(f, c.build + 6, c.titanium, easeOut);
  const P: V3 = [H[0], 2.1, H[1] + 10 - 52 * roll];
  // three-quarter front, low: the nose comes at you out of the hangar, the whole plane fits the tall frame
  const cam: Cam = {
    pos: keys3(f, [
      [c.build, [H[0] + 16, 3.4, H[1] - 60]],
      [c.titanium, [H[0] + 15, 3.0, P[2] - 34]],
      [c.soviet, [H[0] + 12, 2.6, P[2] - 28]],
    ]),
    look: keys3(f, [
      [c.build, [H[0], 4, H[1] - 6]],
      [c.titanium, [P[0], 2.4, P[2] - 3]],
      [c.soviet, [P[0], 2.4, P[2] - 3]],
    ]),
    fov: 40,
  };
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pSkin = at([P[0] + 4.6, 4.4, P[2] + 2]);
  return (
    <AbsoluteFill>
      <DesertCanvas cam={cam} t={t} sun={[90, 70, -60]}>
        <Base hangarDoor={1} light={1} />
        <group position={P} rotation={[0, Math.PI / 2, 0]}>
          <A12 />
        </group>
      </DesertCanvas>
      {f >= c.speed ? <Big x={540} y={420} text={"A-12 · MACH 3.35\n3,560 KM/H · 2,210 MPH"} o={fadeIn(f, c.speed)} size={64} color="#ffffff" /> : null}
      {f >= c.titanium + 4 && pSkin ? <Tag x={pSkin.x} y={pSkin.y} text="TITANIUM SKIN" color="#9aa7b4" o={fadeIn(f, c.titanium + 4)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── ENEMY JET: a real Soviet MiG-21 over the runway, 1968 ─────────────────────────
export const SetMig: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const k = ramp(f, c.enemy, c.name, (x) => x);
  const P: V3 = [700 - 1300 * k, 22 - 14 * Math.sin(k * Math.PI) * 0.5, 30];
  // a chase camera flies alongside, slowly falling behind, so the jet stays big and the ground rushes past
  const cam: Cam = { pos: [P[0] - 24 + 34 * k, P[1] + 3, P[2] - 50], look: [P[0], P[1], P[2]], fov: 40 };
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pJet = at([P[0], P[1] + 4, P[2]]);
  return (
    <AbsoluteFill>
      <DesertCanvas cam={cam} t={t}>
        <Base hangarDoor={0.3} light={0.4} />
        <group position={P} rotation={[0, Math.PI, -0.08]} scale={[1.4, 1.4, 1.4]}>
          <MiG21 />
        </group>
      </DesertCanvas>
      {f >= c.y1968 ? <Big x={540} y={420} text={"1968 · A REAL\nSOVIET MiG-21"} o={fadeIn(f, c.y1968)} size={72} color="#ff6b5e" /> : null}
      {f >= c.beat && pJet ? <Tag x={pJet.x} y={pJet.y} text="HAVE DOUGHNUT" color="#ffd23f" o={fadeIn(f, c.beat)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── HIGHWAY: Nevada names the road outside ─────────────────────────
export const SetHighway: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const k = ramp(f, c.highway, c.storm, (x) => x);
  const asph = useMemo(() => tex("asphalt", "#3a3c40", [60, 1], 261), []);
  const cam: Cam = { pos: keys3(f, [[c.highway, [6, 1.9, 10]], [c.storm, [4, 1.8, 8.5]]]), look: [0, 2.3, 0], fov: 40 };
  return (
    <AbsoluteFill>
      <DesertCanvas cam={cam} t={t} sun={[60, 80, 80]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 6]} receiveShadow>
          <planeGeometry args={[2000, 8]} />
          <meshStandardMaterial map={asph} roughness={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.31, 6]}>
          <planeGeometry args={[2000, 0.15]} />
          <meshStandardMaterial color="#e8c22e" />
        </mesh>
        <group position={[0, 0, 0]}>
          <ETSign />
        </group>
        <group position={[-60 + 90 * k, 0.3, 7.6]}>
          <Sedan color="#e8e8e8" />
        </group>
        <Scrub n={3000} area={[-300, 300, -300, 0]} />
        <Scrub n={2500} area={[-300, 300, 12, 300]} seed={9} />
      </DesertCanvas>
      {f >= c.highway + 10 ? <Big x={540} y={1460} text={"NAMED IN 1996"} o={fadeIn(f, c.highway + 10)} size={80} color="#5dfc8d" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── NARUTO RUN: the storm, 2019 ─────────────────────────
const RUNNERS: { file: string; s: number; d: number; outfit: Outfit }[] = [
  { file: "man_c.glb", s: -6, d: 0, outfit: { top: "#e3c13a", pants: "#3b4a6a", shoes: "#eee" } },
  { file: "woman_a.glb", s: -3.5, d: 3, outfit: { top: "#5dfc8d", pants: "#2c2c2c", shoes: "#eee" } },
  { file: "man_d.glb", s: -1, d: 1.5, outfit: { top: "#ff8a3a", pants: "#2c2c2c", shoes: "#eee" } },
  { file: "woman_b.glb", s: 1.5, d: 4, outfit: { top: "#3a7bd5", pants: "#5a4a3a", shoes: "#eee" } },
  { file: "man_a.glb", s: 4, d: 2, outfit: { top: "#c0392b", pants: "#2c3440", shoes: "#eee" } },
  { file: "woman_c.glb", s: 6.5, d: 5, outfit: { top: "#9a6ad6", pants: "#2c2c2c", shoes: "#eee" } },
];
const NARUTO_ARMS: Record<string, [number, number, number]> = { spine_02: [0, 1, 0.75], upperarm_l: [0.22, -0.3, -1], lowerarm_l: [0.2, -0.28, -1], upperarm_r: [-0.22, -0.3, -1], lowerarm_r: [-0.2, -0.28, -1] };
export const SetNaruto: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const run = (d: number) => (f - c.naruto) * 0.26 + d * 0.6; // metres covered at ~8 m/s (start 20 m before the line)
  // the camera runs alongside the group, then stops with them at the line
  const back = 20 - Math.min(18 - 2.5 * 0.3, run(2.5));
  const cam: Cam = { pos: nly(-15, back - 5, 2.0), look: nly(0, back - 1, 1.3), fov: 40 };
  return (
    <AbsoluteFill>
      <DesertCanvas cam={cam} t={t}>
        <DirtRoad />
        <group position={nearLine(-3.5, -0.4)} rotation={[0, Math.atan2(LINE_T[0], LINE_T[2]) + Math.PI, 0]}>
          <WarningSign />
        </group>
        {Array.from({ length: 41 }, (_, i) => {
          const s2 = (i - 20) * 9;
          return Math.abs(s2) > 5 ? (
            <group key={i} position={nearLine(s2, 0)}>
              <BoundaryPost />
            </group>
          ) : null;
        })}
        {RUNNERS.map((r, i) => {
          const covered = Math.min(18 - r.d * 0.3, run(r.d));
          const p = nearLine(r.s, 20 - covered);
          const at2 = covered >= 18 - r.d * 0.3; // they stop at the line and film
          return (
            <Model
              key={i}
              file={r.file}
              anims={at2 ? LIB2 : LIB1}
              clip={at2 ? "Idle_TalkingPhone_Loop" : "Sprint_Loop"}
              t={at2 ? t : t * 1.3 + i * 0.21}
              p={p}
              ry={Math.atan2(-LINE_T[0], -LINE_T[2]) + Math.PI}
              outfit={r.outfit}
              aim={at2 ? undefined : NARUTO_ARMS}
            />
          );
        })}
        <CamoDude clip="Idle_FoldArms_Loop" t={t} p={nly(3, -6, 0)} ry={Math.atan2(LINE_T[0], LINE_T[2]) + Math.PI} />
        <Scrub n={4000} area={[LINE_P[0] - 160, LINE_P[0] + 160, LINE_P[2] - 160, LINE_P[2] + 160]} avoid={(x, z) => avoidScrub(x, z) || (x - LINE_P[0]) ** 2 + (z - LINE_P[2]) ** 2 < 45 * 45} seed={5} />
      </DesertCanvas>
      {f >= c.naruto + 6 && f < c.cantStop ? <Stamp text="NARUTO RUN" o={pop(f, c.naruto + 6, 6)} color="#ff8a3a" /> : null}
      {f >= c.cantStop && f < c.showed ? <Big x={540} y={430} text={"THEY CAN'T\nSTOP ALL OF US"} o={fadeIn(f, c.cantStop)} size={86} color="#ffd23f" /> : null}
      {f >= c.showed ? <Big x={540} y={1430} text={"150\nSHOWED UP"} o={pop(f, c.showed + 4, 10)} size={120} color="#ff3b30" /> : null}
    </AbsoluteFill>
  );
};
