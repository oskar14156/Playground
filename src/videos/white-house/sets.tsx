import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, project, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { Dog } from "../../lib/three/Dog";
import { WhiteHouse, WH } from "../../lib/three/WhiteHouse";
import { House, labelTex, RB, Streetlight, tex } from "../../lib/three/diorama";
import { fonts } from "../../lib/theme";
import { easeInOut, easeOut, keys, keys3, ramp } from "../../lib/timing";
import { Big, Tag } from "../rocket/sets";
import { c } from "./cues";
import { Beanie, Bollards, BowlingLane, Bunker, Cessna, Drone, Fence, Launcher, NoFlyDome, OakTree, Radar, Rifle, Sack, Shades, Truck } from "./props";
import { CodenameCard } from "./inserts";
import { LawnCanvas } from "./world";
import { usePbr } from "../../lib/three/pbr";

export type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const fadeOut = (f: number, a: number, d = 6) => 1 - ramp(f, a, a + d);
const pop = (f: number, a: number, d = 10) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** heading (ry) for a model that faces +Z, walking from a to b */
const head = (a: V3, b: V3) => Math.atan2(b[0] - a[0], b[2] - a[2]);

const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const ROBBER: Outfit = { top: "#26282c", pants: "#1b1c1f", shoes: "#111111" };
const AGENT: Outfit = { top: "#14161a", pants: "#14161a", shoes: "#0a0a0a", sleeves: 0.85 };
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" };
const MASK_S = 0.5;
const D = WH.d / 2; // north wall z
const PORCH_Y = 1.1; // north portico floor
const FENCE_Z = 62;
const COTTAGE: V3 = [0, 0, 40];
const PLINTH: V3 = [0, 0, 45.2];
const TREE_P: V3 = [22, 0, 42];
const LAUNCH_P: V3 = [-62, 0, 30];
const WIN_X = -22.4 + 3 * 4.48; // the ground-floor window that takes the hits

/** Robbers' street outfit: dark clothes, beanie + eye mask. */
const Robber: React.FC<{ file: string; clip: string; t: number; p: V3; ry: number; lib?: string; inPlace?: boolean }> = ({ file, clip, t, p, ry, lib = LIB1, inPlace }) => (
  <Model file={file} anims={lib} clip={clip} t={t} p={p} ry={ry} outfit={ROBBER} tint={{ Hair: "#151515" }} inPlace={inPlace} attach={{ bone: "Head", node: <Beanie /> }} />
);
const Agent: React.FC<{ file: string; clip: string; t: number; p: V3; ry: number; lib?: string }> = ({ file, clip, t, p, ry, lib = LIB1 }) => (
  <Model file={file} anims={lib} clip={clip} t={t} p={p} ry={ry} outfit={AGENT} tint={{ Hair: "#2a1d14" }} attach={{ bone: "Head", node: <Shades /> }} />
);

// ───────────────────────── NIGHT: the grounds, from the hook to the drone ─────────────────────────
// Each beat holds its key until the frame before the next beat's key (hard cut), keys() eases in between.
const camNight = (f: number): Cam => {
  const k: [number, V3][] = [
    [0, [0.3, 1.5, 51.2]],
    [c.nice - 2, [0.3, 1.6, 51]],
    [c.nice + 10, [10, 3.2, 58]],
    [c.walkIn, [9, 2.6, 56]],
    [c.y2014 - 1, [7, 2.2, 52]],
    [c.lock, [0, 2.8, 38]],
    [c.guards + 20, [0, 2.6, 34.5]],
    [c.climb - 1, [0, 2.6, 34]],
    [c.climb, [3.6, 2.0, 67.2]],
    [c.newFence, [4.4, 2.4, 68.4]],
    [c.spikes + 10, [7.5, 3.4, 72]],
    [c.truck - 1, [7.8, 3.4, 72.5]],
    [c.truck, [-4, 3.2, 88]],
    [c.street + 24, [-6, 2.8, 86]],
    [c.anyway - 1, [-6, 2.8, 86]],
    [c.anyway, [9.5, 2.4, 51.5]],
    [c.dogs, [12, 2.4, 48]],
    [c.steps + 24, [11, 2.0, 51]],
    [c.snipers - 1, [11, 2.0, 51]],
    [c.snipers, [-6, 19.4, 23]],
    [c.pairs + 16, [-7, 19.0, 21.5]],
    [c.shoot - 1, [-7, 19.0, 21.5]],
    [c.shoot, [WIN_X - 3.4, 1.8, 70.6]],
    [c.glass - 1, [WIN_X - 3, 1.8, 70]],
    [c.glass, [WIN_X + 0.6, 4.3, 19.5]],
    [c.sky - 1, [WIN_X + 0.5, 4.3, 19]],
    [c.sky, [-44, 8, 92]],
    [c.crashed + 10, [-34, 6.5, 80]],
    [c.crashed + 16, [27, 3.2, 23]],
    [c.ban - 1, [26, 3.0, 23.5]],
    [c.ban, [140, 80, 200]],
    [c.missiles - 1, [130, 74, 186]],
    [c.missiles, [-47, 4.6, 46]],
    [c.drone - 1, [-49, 4.2, 44]],
    [c.drone, [38, 7, 62]],
    [c.drunk + 20, [28.2, 5.7, 49]],
    [c.bunker, [28, 5.7, 48.7]],
    // codename close-up (this set is used again after the bathrooms)
    [c.codename, [-1.0, 3.0, 19.2]],
    [c.congrats, [-1.3, 3.0, 18.4]],
  ];
  const l: [number, V3][] = [
    [0, [-0.9, 1.0, 44.9]],
    [c.nice - 2, [-0.8, 1.05, 44.8]],
    [c.nice + 10, [0, 2.4, 40]],
    [c.walkIn, [0.5, 1.6, 43]],
    [c.y2014 - 1, [0.2, 1.6, 42.6]],
    [c.lock, [0, 3.6, D]],
    [c.guards + 20, [0, 3.3, D]],
    [c.climb - 1, [0, 3.3, D]],
    [c.climb, [0.4, 1.7, FENCE_Z]],
    [c.newFence, [0.4, 2.2, FENCE_Z]],
    [c.spikes + 10, [0.4, 2.8, FENCE_Z]],
    [c.truck - 1, [0.4, 2.8, FENCE_Z]],
    [c.truck, [-24, 1.5, 73]],
    [c.street + 24, [-24, 1.3, 73]],
    [c.anyway - 1, [-24, 1.3, 73]],
    [c.anyway, [6, 2.0, 61.4]],
    [c.dogs, [5.4, 0.9, 57]],
    [c.steps + 24, [6, 0.6, 59]],
    [c.snipers - 1, [6, 0.6, 59]],
    [c.snipers, [-13.2, 16.9, 12.6]],
    [c.pairs + 16, [-13.2, 16.9, 12.6]],
    [c.shoot - 1, [-13.2, 16.9, 12.6]],
    [c.shoot, [WIN_X, 3.0, 40]],
    [c.glass - 1, [WIN_X, 3.0, 40]],
    [c.glass, [WIN_X, 4.0, D]],
    [c.sky - 1, [WIN_X, 4.0, D]],
    [c.sky, [-6, 15, 22]],
    [c.crashed + 10, [6, 5, 34]],
    [c.crashed + 16, [13, 1.0, 30]],
    [c.ban - 1, [13.5, 0.9, 30]],
    [c.ban, [0, 22, 0]],
    [c.missiles - 1, [0, 22, 0]],
    [c.missiles, [LAUNCH_P[0], 3.5, LAUNCH_P[2]]],
    [c.drone - 1, [LAUNCH_P[0], 3.5, LAUNCH_P[2]]],
    [c.drone, [30, 8, 52]],
    [c.drunk + 20, [25.3, 5.2, 45.4]],
    [c.bunker, [25.3, 5.2, 45.4]],
    [c.codename, [-2.3, 2.35, 15]],
    [c.congrats, [-2.3, 2.35, 15]],
  ];
  return { pos: keys3(f, k), look: keys3(f, l), fov: f < c.nice ? 50 : 40 };
};

export const SetNight: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  // the camera follows the diving plane until it hits the lawn
  const planeK0 = ramp(f, c.sky + 4, c.crashed + 14, (x) => x);
  const cam0 = camNight(f);
  const follow = f >= c.sky && f < c.crashed + 16 ? 0.75 * ramp(f, c.sky, c.sky + 10) : 0;
  const cam: Cam = follow > 0 ? { ...cam0, look: lerp3(cam0.look, lerp3([-70, 45, -40], [6, 0.2, 36], planeK0), follow) } : cam0;
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const big = f >= c.lock; // the mansion replaces the cottage
  const hook = f < c.y2014;
  const codename = f >= c.codename;
  // ── hook: robbers creep to the plinth, the cottage pops up, they stroll in through the front door
  const cottage = hook ? pop(f, c.nice, 12) : 0;
  const maskIn = ramp(f, c.nice + 4, c.nice + 20, easeInOut);
  const maskP = lerp3(add(PLINTH, [0, 1.05, 0]), [COTTAGE[0] - 1.9, 1.2, COTTAGE[2] + 2.3], maskIn);
  const rA0: V3 = [-2.6, 0, 43.4];
  const rA1: V3 = [-1.0, 0, 44.4];
  const door: V3 = [COTTAGE[0], 0, COTTAGE[2] + 2.3];
  const rAp = f < c.walkIn ? lerp3(rA0, rA1, ramp(f, 0, c.nice + 10, (x) => x)) : lerp3(rA1, door, ramp(f, c.walkIn + 4, c.walkIn + 46, (x) => x));
  const rB0: V3 = [-3.4, 0, 44.6];
  const rB1: V3 = [-1.9, 0, 45.6];
  const rBp = f < c.walkIn ? lerp3(rB0, rB1, ramp(f, 0, c.nice + 10, (x) => x)) : lerp3(rB1, door, ramp(f, c.walkIn + 12, c.walkIn + 58, (x) => x));
  const doorOpen = ramp(f, c.walkIn + 26, c.walkIn + 34);
  // ── the mansion's door shuts, agents step in front of it
  const whDoor = big ? 0.75 * (1 - ramp(f, c.lock + 2, c.lock + 14)) : 0.75;
  const agentK = ramp(f, c.guards - 6, c.guards + 18, (x) => x);
  const agL0: V3 = [-4.2, PORCH_Y, D + 3.4];
  const agL1: V3 = [-1.05, PORCH_Y, D + 1.6];
  const agR0: V3 = [4.2, PORCH_Y, D + 3.4];
  const agR1: V3 = [1.05, PORCH_Y, D + 1.6];
  // ── fence: the old 2 m fence, then the 4 m one with spikes
  const fenceOn = f >= c.climb - 2;
  const fenceH = 2 + 2 * ramp(f, c.newFence + 2, c.newFence + 22, easeOut);
  const spikes = f >= c.spikes;
  const climbUp = ramp(f, c.climb + 6, c.newFence, (x) => x);
  const slide = ramp(f, c.newFence + 4, c.newFence + 22);
  const climberY = 1.5 * climbUp * (1 - slide);
  // ── truck vs bollards on the street
  const truckX = keys(f, [[c.truck, -62], [c.street + 6, -25.1]], (x) => Math.sqrt(x)); // front stops at the bollards (x = −21.6)
  const crush = ramp(f, c.street + 4, c.street + 10);
  const bollards = ramp(f, c.street - 4, c.street + 4, easeOut);
  // ── a robber drops over the fence, runs 3 steps, the dog gets him
  const dropK = ramp(f, c.anyway + 4, c.anyway + 22, (x) => x * x);
  const runK = ramp(f, c.steps, c.steps + 16, (x) => x);
  const robP: V3 = [6, 3.9 * (1 - dropK), FENCE_Z - 0.6 - 2.4 * runK];
  const caught = f >= c.steps + 16;
  const dogStart: V3 = [8.4, 0, 52.4]; // barking in the foreground, then sprints to the robber
  const dogEnd: V3 = [5.8, 0, FENCE_Z - 3.4];
  const dogK = ramp(f, c.seconds, c.steps + 16, (x) => x); // released on "in 4 seconds"
  const dogP = lerp3(dogStart, dogEnd, dogK);
  // ── window hits
  const shots = [c.shoot + 10, c.shoot + 20, c.shoot + 30];
  const flash = shots.reduce((m, s) => Math.max(m, f >= s && f < s + 3 ? 1 - (f - s) / 3 : 0), 0);
  const crack = ramp(f, c.glass + 2, c.glass + 8);
  // ── plane, no-fly dome, missiles, drone
  const planeK = ramp(f, c.sky + 4, c.crashed + 14, (x) => x);
  const planeA: V3 = [-70, 45, -40]; // over the roof from behind the house
  const planeB: V3 = [6, 0.2, 36];
  const skid = ramp(f, c.crashed + 14, c.crashed + 34, easeOut);
  const planeP: V3 = planeK < 1 ? lerp3(planeA, planeB, planeK) : lerp3(planeB, [16, 0.2, 28], skid);
  const planeOn = f >= c.sky && f < c.ban;
  const dome = ramp(f, c.ban + 2, c.ban + 18, easeOut);
  const raise = ramp(f, c.missiles + 6, c.missiles + 30);
  const droneK = ramp(f, c.drone + 4, c.drunk + 26, (x) => x);
  const droneP: V3 = droneK < 1 ? [44 - 18.7 * droneK + 2.5 * Math.sin(droneK * 9), 14 - 8.8 * droneK + 1.2 * Math.sin(droneK * 13), 66 - 20.6 * droneK + 2 * Math.cos(droneK * 7)] : [TREE_P[0] + 3.3, 5.2, TREE_P[2] + 3.4];
  // ── labels
  const pMask = at(add(PLINTH, [0, 1.5, 0]));
  const pWin = at([COTTAGE[0] - 1.9, 2.9, COTTAGE[2] + 2.6]);
  const pDoor = at([0, 6.5, D + 1]);
  const pFenceTop = at([2, fenceH + 0.3, FENCE_Z]);
  const pSnipers = at([-13.2, 18.0, 12.5]);
  const pLaunch = at([LAUNCH_P[0], 6, LAUNCH_P[2]]);
  const pDrone = at([TREE_P[0] + 3.3, 6.2, TREE_P[2] + 3.4]);
  return (
    <AbsoluteFill>
      <LawnCanvas cam={cam} t={t} night={0}>
        {/* hook: the plinth + mask, then the cottage */}
        {hook ? (
          <group>
            <RB p={[PLINTH[0], 0.45, PLINTH[2]]} s={[0.7, 0.9, 0.7]} r={0.05} color="#d8d2c4" rough={0.8} />
            {maskIn < 1 ? (
              <group position={maskP} scale={1 - 0.4 * maskIn}>
                <FursuitHead s={MASK_S} t={t} />
              </group>
            ) : null}
            {cottage > 0.01 ? (
              <group position={COTTAGE} scale={[cottage, cottage, cottage]}>
                <House p={[0, 0, 0]} siding="#b9c7d6" lit={0} seed={4} />
                {doorOpen > 0 ? (
                  <mesh position={[0, 1.1, 2.555]}>
                    <planeGeometry args={[0.95 * doorOpen, 2.0]} />
                    <meshBasicMaterial color="#120c06" />
                  </mesh>
                ) : null}
              </group>
            ) : null}
            <Robber file="man_c.glb" clip={f < c.walkIn ? "Crouch_Fwd_Loop" : "Walk_Loop"} t={t * 1.2} p={rAp} ry={f < c.walkIn ? head(rA0, rA1) : head(rA1, door)} />
            <Robber file="woman_a.glb" clip={f < c.walkIn ? "Crouch_Fwd_Loop" : "Walk_Carry_Loop"} lib={f < c.walkIn ? LIB1 : LIB2} t={t * 1.2 + 0.3} p={rBp} ry={f < c.walkIn ? head(rB0, rB1) : head(rB1, door)} />
            <group position={[rBp[0] + 0.5, 0, rBp[2] - 0.3]}>
              <Sack />
            </group>
          </group>
        ) : null}
        {/* the mansion */}
        {big ? <WhiteHouse t={t} lit={0} door={whDoor} glass={crack} /> : null}
        {big ? <NorthGrounds /> : null}
        {big && !codename && f < c.climb + 2 ? (
          <group>
            <Agent file="man_d.glb" clip={agentK < 1 ? "Walk_Formal_Loop" : "Idle_FoldArms_Loop"} lib={agentK < 1 ? LIB1 : LIB2} t={t} p={lerp3(agL0, agL1, agentK)} ry={agentK < 1 ? head(agL0, agL1) : 0} />
            <Agent file="woman_b.glb" clip={agentK < 1 ? "Walk_Formal_Loop" : "Idle_FoldArms_Loop"} lib={agentK < 1 ? LIB1 : LIB2} t={t + 0.4} p={lerp3(agR0, agR1, agentK)} ry={agentK < 1 ? head(agR0, agR1) : 0} />
          </group>
        ) : null}
        {codename ? <Agent file="man_d.glb" clip="Idle_TalkingPhone_Loop" lib={LIB2} t={t} p={[-2.3, PORCH_Y, D + 2.0]} ry={0.25} /> : null}
        {/* fence, street, bollards, the park beyond */}
        {big && fenceOn ? (
          <group>
            <group position={[0, 0, FENCE_Z]}>
              <Fence len={170} h={fenceH} spikes={spikes} />
            </group>
            <Street />
            <group position={[-21.6, 0, 73]} rotation={[0, Math.PI / 2, 0]}>
              <Bollards len={13} rise={bollards} />
            </group>
            {[-60, -35, -8, 18, 44, 70].map((x, i) => (
              <group key={x} position={[x, 0, 92 + (i % 2) * 7]}>
                <OakTree s={1.2} seed={i + 2} />
              </group>
            ))}
          </group>
        ) : null}
        {f >= c.climb && f < c.truck ? (
          <Robber file="man_c.glb" clip={slide > 0 ? "Idle_No_Loop" : "ClimbUp_1m_RM"} lib={LIB2} inPlace={slide === 0} t={slide > 0 ? t : (t * 0.9) % 0.667} p={[0.4, climberY, FENCE_Z + 0.55]} ry={Math.PI} />
        ) : null}
        {f >= c.truck - 2 && f < c.anyway ? (
          <group position={[truckX, 0, 73]}>
            <Truck crush={crush} />
          </group>
        ) : null}
        {f >= c.anyway && f < c.snipers ? (
          <group>
            <Robber file="woman_a.glb" clip={caught ? "Death01" : runK > 0 ? "Sprint_Loop" : dropK < 1 ? "Jump_Loop" : "Crouch_Idle_Loop"} t={caught ? Math.min(1.4, (f - c.steps - 16) / 30) : t} p={robP} ry={Math.PI} />
            {f >= c.dogs ? (
              <group position={dogP} rotation={[0, Math.atan2(-(dogEnd[2] - dogStart[2]), dogEnd[0] - dogStart[0]), 0]}>
                <Dog t={t} run={dogK > 0 && dogK < 1 ? 1 : 0} bark={dogK === 0 || dogK >= 1 ? 0.5 + 0.5 * Math.sin(t * 9) : 0} />
              </group>
            ) : null}
          </group>
        ) : null}
        {/* snipers on the roof walkway, behind the balustrade */}
        {f >= c.snipers && f < c.shoot ? (
          <group>
            {[-14.0, -12.4].map((x, i) => (
              <group key={x}>
                <Agent file={i ? "man_c.glb" : "man_d.glb"} clip="Pistol_Aim_Neutral" t={t + i} p={[x, WH.wall, D - 0.55]} ry={0.1} />
                <group position={[x + 0.18, WH.wall + 1.38, D - 0.5]} rotation={[0.05, 0.1, 0]}>
                  <Rifle />
                </group>
              </group>
            ))}
          </group>
        ) : null}
        {/* robbers firing from outside the fence */}
        {f >= c.shoot && f < c.sky ? (
          <group>
            {[WIN_X - 2.2, WIN_X + 1.6].map((x, i) => (
              <group key={x}>
                <Robber file={i ? "woman_a.glb" : "man_c.glb"} clip="Pistol_Shoot" t={((f - c.shoot) / 30 + i * 0.3) % 1.0} p={[x, 0, FENCE_Z + 3.2]} ry={Math.PI} />
                {flash > 0 ? <Glow position={[x - 0.2, 1.45, FENCE_Z + 2.4]} size={1.6 * flash} color="#ffd27a" opacity={flash} /> : null}
              </group>
            ))}
          </group>
        ) : null}
        {/* 1994: the small plane */}
        {planeOn ? (
          <group position={planeP} rotation={[planeK < 1 ? 0 : 0.28 * skid, Math.atan2(-(planeB[2] - planeA[2]), planeB[0] - planeA[0]) + 0.5 * skid, planeK < 1 ? -0.35 : -0.12]}>
            <Cessna prop={planeK < 1 ? t * 30 : 0.4} />
            {skid > 0 && skid < 1 ? <Glow position={[0, 0.3, 0]} size={4} color="#ffb36b" opacity={0.6 * (1 - skid)} /> : null}
          </group>
        ) : null}
        {/* dust + smoke after the crash, slow so it never flickers */}
        {planeOn && skid > 0 ? (
          <group position={[16, 0, 28]}>
            {[0, 1, 2, 3, 4].map((i) => {
              const k = Math.min(1, (f - c.crashed - 14 - i * 4) / 40);
              return k > 0 ? <Glow key={i} position={[Math.sin(i * 2) * 1.5, 1 + k * (4 + i), Math.cos(i * 3) * 1.2]} size={3 + 5 * k} color="#8c8a86" opacity={0.5 * (1 - k * 0.7)} /> : null;
            })}
          </group>
        ) : null}
        {f >= c.ban && f < c.missiles ? (
          <group>
            <NoFlyDome r={115} o={dome} t={t} />
            <group position={[30, 0, 34]}>
              <Radar t={t} />
            </group>
          </group>
        ) : null}
        {f >= c.missiles - 2 ? (
          <group position={LAUNCH_P}>
            <Launcher raise={raise} />
          </group>
        ) : null}
        <group position={TREE_P}>
          <OakTree seed={7} />
        </group>
        {f >= c.drone ? (
          <group position={droneP} rotation={[droneK < 1 ? 0.2 * Math.sin(t * 5) : 0.6, droneK * 2, droneK < 1 ? 0.25 * Math.sin(t * 4) : -0.9]}>
            <group scale={[3, 3, 3]}>
              <Drone t={t} spin={droneK < 1 ? 1 : 0} />
            </group>
            <Glow position={[0.3, 0, 0.3]} size={0.6} color={f % 20 < 10 ? "#ff3b30" : "#3dff7a"} opacity={0.9} />
          </group>
        ) : null}
      </LawnCanvas>
      {/* overlays */}
      {f < c.nice + 4 && pMask ? <Tag x={pMask.x} y={pMask.y} text="POCKET PUH" color="#ff8a3a" o={fadeIn(f, 14) * fadeOut(f, c.nice)} /> : null}
      {f >= c.nice + 18 && f < c.walkIn + 20 && pWin ? <Tag x={pWin.x} y={pWin.y} text="POCKET PUH INSIDE" color="#ff8a3a" side="left" o={fadeIn(f, c.nice + 18)} /> : null}
      {f >= c.lock + 10 && f < c.climb && pDoor ? <Tag x={pDoor.x} y={pDoor.y} text="LOCKED" color="#ffd23f" o={fadeIn(f, c.lock + 10)} /> : null}
      {f >= c.climb + 8 && f < c.newFence + 4 && pFenceTop ? <Tag x={pFenceTop.x} y={pFenceTop.y} text="6 FT 6 IN · 2 M" color="#9aa1a8" o={fadeIn(f, c.climb + 8)} /> : null}
      {f >= c.metres && f < c.truck && pFenceTop ? <Tag x={pFenceTop.x} y={pFenceTop.y} text="13 FT · 4 M" color="#3dd6ff" o={fadeIn(f, c.metres)} /> : null}
      {f >= c.spikes + 4 && f < c.truck ? <Big x={540} y={1470} text="ANTI-CLIMB SPIKES" o={fadeIn(f, c.spikes + 4)} size={70} color="#3dd6ff" /> : null}
      {f >= c.street + 8 && f < c.anyway ? <Big x={540} y={1460} text={"STREET CLOSED\nTO CARS · 1995"} o={fadeIn(f, c.street + 8)} size={74} color="#ffd23f" /> : null}
      {f >= c.seconds && f < c.steps ? <Big x={540} y={1460} text="RELEASED IN 4 S" o={fadeIn(f, c.seconds)} size={84} color="#ffd23f" /> : null}
      {f >= c.steps + 4 && f < c.snipers ? <Big x={540} y={1460} text={`${Math.max(1, Math.min(3, Math.ceil(runK * 3)))} STEP${runK > 0.34 ? "S" : ""}`} o={fadeIn(f, c.steps + 4)} size={96} color="#ff6b5e" /> : null}
      {f >= c.pairs && f < c.shoot && pSnipers ? <Tag x={pSnipers.x} y={pSnipers.y} text="ALWAYS IN PAIRS" color="#ff6b5e" o={fadeIn(f, c.pairs)} /> : null}
      {f >= c.glass + 8 && f < c.sky ? <Big x={540} y={1460} text="BULLETPROOF" o={fadeIn(f, c.glass + 8)} size={100} color="#3dd6ff" /> : null}
      {f >= c.crashed + 14 && f < c.ban ? <Big x={540} y={430} text={"1994\nTRUE STORY"} o={fadeIn(f, c.crashed + 14)} size={84} color="#ff6b5e" /> : null}
      {f >= c.ban + 10 && f < c.missiles ? <Big x={540} y={1460} text={"NO-FLY ZONE\nP-56"} o={fadeIn(f, c.ban + 10)} size={86} color="#ff6b5e" /> : null}
      {f >= c.missiles + 10 && f < c.drone && pLaunch ? <Tag x={pLaunch.x} y={pLaunch.y} text="MISSILES" color="#ff9a3a" side="right" o={fadeIn(f, c.missiles + 10)} /> : null}
      {f >= c.joke && f < c.isnt ? <Stamp text="JOKE?" o={pop(f, c.joke, 6)} color="#ffd23f" /> : null}
      {f >= c.isnt && f < c.drone ? <Stamp text="NOT A JOKE" o={pop(f, c.isnt, 6)} color="#ff3b30" /> : null}
      {f >= c.real && f < c.drone ? <Big x={540} y={1470} text={"NASAMS\nSINCE 2005"} o={fadeIn(f, c.real)} size={74} color="#ffffff" /> : null}
      {f >= c.drunk + 26 && f < c.bunker && pDrone ? <Tag x={pDrone.x} y={pDrone.y} text="2015 · TRUE STORY" color="#ff6b5e" side="left" o={fadeIn(f, c.drunk + 26)} /> : null}
      {codename ? <CodenameCard f={f} at={c.codename + 4} obama={c.obama} fluff={c.fluffball} /> : null}
    </AbsoluteFill>
  );
};

const Stamp: React.FC<{ text: string; o: number; color: string }> = ({ text, o, color }) => (
  <div style={{ position: "absolute", top: 380, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(1, o) }}>
    <div style={{ transform: `rotate(-8deg) scale(${2 - Math.min(1, o)})`, border: `12px solid ${color}`, color, fontFamily: fonts.punch, fontWeight: 900, fontSize: 110, padding: "4px 30px", borderRadius: 18, background: "rgba(0,0,0,0.35)" }}>{text}</div>
  </div>
);

/** North Lawn: the round fountain and the curved driveway from the gates to the portico. */
const NorthGrounds: React.FC = () => {
  const drive = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-30, 0, 66),
      new THREE.Vector3(-24, 0, 46),
      new THREE.Vector3(-12, 0, 30),
      new THREE.Vector3(0, 0, 27.2),
      new THREE.Vector3(12, 0, 30),
      new THREE.Vector3(24, 0, 46),
      new THREE.Vector3(30, 0, 66),
    ]);
    // a flat ribbon 6 m wide along the curve
    const n = 120;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const p = curve.getPointAt(k);
      const tg = curve.getTangentAt(k);
      const nx = -tg.z;
      const nz = tg.x;
      pos.push(p.x + nx * 3, 0.03, p.z + nz * 3, p.x - nx * 3, 0.03, p.z - nz * 3);
      uv.push(0, k * 30, 1, k * 30);
      if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  const gravel = useMemo(() => tex("asphalt", "#b9b2a2", [1, 1], 111), []);
  const stone = useMemo(() => tex("plaster", "#e2dccf", [6, 1], 112), []);
  return (
    <group>
      <mesh geometry={drive} receiveShadow>
        <meshStandardMaterial map={gravel} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, 0, 44]}>
        <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[6.4, 6.6, 0.6, 64, 1, true]} />
          <meshStandardMaterial map={stone} roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.0, 6.6, 64]} />
          <meshStandardMaterial map={stone} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[6.0, 64]} />
          <meshStandardMaterial color="#4f86ad" roughness={0.08} metalness={0.3} />
        </mesh>
        {/* jet + spray */}
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.05, 0.25, 2.4, 12]} />
          <meshStandardMaterial color="#e9f4ff" transparent opacity={0.6} roughness={0.1} />
        </mesh>
        <Glow position={[0, 2.8, 0]} size={2.6} color="#ffffff" opacity={0.5} />
      </group>
    </group>
  );
};

/** Pennsylvania Avenue: asphalt with lane marks, sidewalks, lamps (between the fence and the park). */
const Street: React.FC = () => {
  const asph = useMemo(() => tex("asphalt", "#2d2f33", [30, 3], 81), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 73]} receiveShadow>
        <planeGeometry args={[400, 12]} />
        <meshStandardMaterial map={asph} roughness={0.9} />
      </mesh>
      {[65.5, 80.5].map((z) => (
        <RB key={z} p={[0, 0.08, z]} s={[400, 0.16, 3]} r={0.03} color="#a9a59b" rough={0.9} />
      ))}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-140 + i * 10, 0.03, 73]}>
          <planeGeometry args={[4, 0.18]} />
          <meshStandardMaterial color="#e8e2c8" roughness={0.8} />
        </mesh>
      ))}
      {[-50, -20, 10, 40].map((x) => (
        <Streetlight key={x} p={[x, 0, 81]} on={0} />
      ))}
      {/* lamps on the fence side light the people at the fence */}
      {[-19, 5].map((x) => (
        <group key={x}>
          <Streetlight p={[x, 0, 65]} on={0} />
        </group>
      ))}
    </group>
  );
};

// ───────────────────────── UNDER: a cut through the ground — bunker, then the bowling lane ─────────────────────────
const CUT_Z = 26;
export const SetUnder: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.bunker, [0, 4, 72]],
      [c.ww2 - 4, [0, -11, 52]],
      [c.forever, [-1.5, -12.6, 36]],
      [c.bowling - 1, [-1.8, -12.6, 35]],
      [c.bowling, [8.6, -3.5, 23.6]],
      [c.baths, [6.5, -3.7, 23.4]],
    ]),
    look: keys3(f, [
      [c.bunker, [0, 0, 20]],
      [c.ww2 - 4, [0, -13, 20]],
      [c.forever, [-2, -14, 21]],
      [c.bowling - 1, [-2, -14, 21]],
      [c.bowling, [-10, -4.6, 21.8]],
      [c.baths, [-10, -4.6, 21.8]],
    ]),
    fov: 40,
  };
  const roll = ramp(f, c.bowling + 8, c.bowling + 30, (x) => x);
  const hit = ramp(f, c.bowling + 30, c.bowling + 44, easeOut);
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pBunker = at([-1.5, -10.4, CUT_Z]);
  const pLane = at([-9.2, -3.6, 21.5]);
  const brick = usePbr("red_brick_03", [6, 1.2]);
  const floor = useMemo(() => tex("planks", "#7a5a3e", [6, 3], 92), []);
  return (
    <AbsoluteFill>
      <LawnCanvas cam={cam} t={t} night={0} ao={0.6}>
        <WhiteHouse t={t} lit={0} />
        <SoilFace z={CUT_Z} holes={[[-11, 11, -5.4, -1.2], [-8.2, 8.2, -15.2, -10.8]]} />
        {/* basement: walls, ceiling lights, the lane along X */}
        <group position={[0, -5.2, 22]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[22, 8]} />
            <meshStandardMaterial map={floor} roughness={0.6} />
          </mesh>
          <mesh position={[0, 2, -4]}>
            <planeGeometry args={[22, 4]} />
            <meshStandardMaterial {...brick} roughness={0.9} />
          </mesh>
          {/* retro score screens over the lane */}
          {[-3, 3].map((x) => (
            <group key={x} position={[x, 3.1, -3.9]}>
              <RB p={[0, 0, 0]} s={[2.2, 0.9, 0.1]} r={0.03} color="#1d1f24" />
              <mesh position={[0, 0, 0.06]}>
                <planeGeometry args={[2.0, 0.75]} />
                <meshBasicMaterial map={labelTex("#101a2e", "#ffd23f", "STRIKE", "LANE 1", 512, 192)} toneMapped={false} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[22, 8]} />
            <meshStandardMaterial color="#d8d2c2" side={THREE.DoubleSide} />
          </mesh>
          {[-6, 0, 6].map((x) => (
            <pointLight key={x} position={[x, 3.4, 1]} intensity={7} distance={9} color="#fff1d6" />
          ))}
          <group position={[0, 0.01, -0.5]} rotation={[0, Math.PI / 2, 0]}>
            <BowlingLane roll={roll} hit={hit} />
          </group>
          {/* the mask cheering at the pin end */}
          <group position={[-10.2, 1.0, 1.4]}>
            <RB p={[0, -0.5, 0]} s={[0.6, 1, 0.6]} r={0.05} color="#3b2a1d" />
            <group position={[0, 0.35, 0]}>
              <FursuitHead s={MASK_S} t={t} dance={f >= c.bowling + 40 ? 1 : 0} />
            </group>
          </group>
        </group>
        {/* bunker */}
        <group position={[0, -15, 22]}>
          <Bunker glow={1} />
          {f >= c.forever - 10 ? (
            <group position={[-2.2, 1.0, -0.6]}>
              <FursuitHead s={MASK_S} t={t} />
            </group>
          ) : null}
        </group>
      </LawnCanvas>
      {f >= c.ww2 - 10 && f < c.forever && pBunker ? <Tag x={pBunker.x} y={pBunker.y} text="BUNKER · DUG IN WW2" color="#ffd23f" side="right" o={fadeIn(f, c.ww2 - 10)} /> : null}
      {f >= c.bowling + 6 && pLane ? <Tag x={pLane.x} y={pLane.y} text="BOWLING ALLEY · REAL" color="#3dd6ff" side="left" o={fadeIn(f, c.bowling + 6)} /> : null}
      {f >= c.bowling + 32 ? <Big x={540} y={1470} text="STRIKE!" o={pop(f, c.bowling + 32, 8)} size={120} color="#ffd23f" /> : null}
    </AbsoluteFill>
  );
};

/** A vertical cut face of soil at z with rectangular holes [x0, x1, y0, y1] (so the rooms behind it show). */
const SoilFace: React.FC<{ z: number; holes: [number, number, number, number][] }> = ({ z, holes }) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-60, 0);
    s.lineTo(60, 0);
    s.lineTo(60, -34);
    s.lineTo(-60, -34);
    s.closePath();
    for (const [x0, x1, y0, y1] of holes) {
      const h = new THREE.Path();
      h.moveTo(x0, y0);
      h.lineTo(x1, y0);
      h.lineTo(x1, y1);
      h.lineTo(x0, y1);
      h.closePath();
      s.holes.push(h);
    }
    const g = new THREE.ShapeGeometry(s);
    // UVs in metres / 6 so the soil texture repeats
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 6, pos.getY(i) / 6);
    return g;
  }, [holes]);
  const soil = usePbr("brown_mud_rocks_01", [1, 1]);
  return (
    <group position={[0, 0, z]}>
      <mesh geometry={geo}>
        <meshStandardMaterial {...soil} color="#b89c84" roughness={0.95} />
      </mesh>
      {/* grass edge + layer bands */}
      <RB p={[0, -0.25, 0.05]} s={[120, 0.5, 0.1]} r={0.02} color="#3e6b2c" rough={0.95} />
      {[-7.5, -19, -27].map((y) => (
        <mesh key={y} position={[0, y, 0.02]}>
          <planeGeometry args={[120, 0.35]} />
          <meshStandardMaterial color="#4a3220" roughness={1} />
        </mesh>
      ))}
      {/* concrete frames around the rooms */}
      {holes.map(([x0, x1, y0, y1], i) => (
        <group key={i}>
          <RB p={[(x0 + x1) / 2, y1 + 0.2, 0.05]} s={[x1 - x0 + 0.8, 0.4, 0.2]} r={0.03} color="#8d8d86" />
          <RB p={[(x0 + x1) / 2, y0 - 0.2, 0.05]} s={[x1 - x0 + 0.8, 0.4, 0.2]} r={0.03} color="#8d8d86" />
          {[x0 - 0.2, x1 + 0.2].map((x) => (
            <RB key={x} p={[x, (y0 + y1) / 2, 0.05]} s={[0.4, y1 - y0, 0.2]} r={0.03} color="#8d8d86" />
          ))}
        </group>
      ))}
    </group>
  );
};

// ───────────────────────── DAY: the South Lawn, your friend dances in the mask ─────────────────────────
export const SetDay: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [34, 8, -108]],
      [c.wh, [20, 5, -82]],
      [c.wh + 40, [8, 2.6, -55]],
      [c.end, [5, 2.2, -47]],
    ]),
    look: keys3(f, [
      [c.congrats, [0, 10, -10]],
      [c.wh, [0, 8, -14]],
      [c.wh + 40, [2, 2.4, -36]],
      [c.end, [2.2, 1.7, -38.5]],
    ]),
    fov: 40,
  };
  return (
    <AbsoluteFill>
      <LawnCanvas cam={cam} t={t} night={0}>
        <WhiteHouse t={t} />
        {/* south fountain */}
        <group position={[0, 0, -60]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[6, 6.2, 0.5, 48]} />
            <meshStandardMaterial color="#d8d2c4" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[5.7, 48]} />
            <meshStandardMaterial color="#5c8fb8" roughness={0.15} metalness={0.2} />
          </mesh>
          <Glow position={[0, 2.4, 0]} size={3} color="#ffffff" opacity={0.6} />
        </group>
        <Model file="man_b.glb" anims={LIB1} clip="Dance_Loop" t={t} p={[2.2, 0, -38]} ry={Math.PI + 0.25} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} attach={{ bone: "Head", node: <FursuitHead s={MASK_S} t={t} p={[0, -0.2, 0.03]} /> }} />
        <group position={[3.6, 0, -39.4]} rotation={[0, -Math.PI / 2 + 0.4, 0]}>
          <Dog t={t} run={0} bark={0.5 + 0.5 * Math.sin(t * 6)} />
        </group>
        <Agent file="man_d.glb" clip="Idle_FoldArms_Loop" lib={LIB2} t={t} p={[-1.6, 0, -35]} ry={Math.PI + 0.5} />
        {[-26, 26].map((x, i) => (
          <group key={x} position={[x, 0, -48]}>
            <OakTree s={1.1} seed={i + 11} />
          </group>
        ))}
      </LawnCanvas>
      {f >= c.rooms ? <Big x={540} y={300} text="132 ROOMS" o={fadeIn(f, c.rooms)} size={96} color="#ffffff" /> : null}
      {f >= c.paint ? <Big x={540} y={420} text={"570 GAL · 2,160 L\nWHITE PAINT"} o={fadeIn(f, c.paint)} size={60} color="#ffd23f" /> : null}
      {f >= c.wh ? <Big x={540} y={1470} text="THE WHITE HOUSE" o={pop(f, c.wh, 10)} size={104} color="#ffffff" /> : null}
    </AbsoluteFill>
  );
};
