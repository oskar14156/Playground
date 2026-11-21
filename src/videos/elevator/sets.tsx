import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow, project, TubePath, V3 } from "../../lib/three/core";
import { Env, KeyLight, Post, RB, Slab, tex } from "../../lib/three/diorama";
import { Model, Outfit } from "../../lib/three/gltf";
import { Plush } from "../../lib/three/Plush";
import { Reactor } from "../../lib/three/Reactor";
import { fonts } from "../../lib/theme";
import { easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { stairY, Buffers, Building, Car, CAR, Counterweight, CW, floorY, Ground, LandingDoors, MachineRoom, Rails, Rope, ROOF, SHEAVE } from "./building";
import { c } from "./cues";

export type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 10) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));

const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const YOU: Outfit = { top: "#e8573a", pants: "#2c3440", shoes: "#f2f2f2" };
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" };
const HAIR_YOU = { Hair: "#3b2a1e" };
const HAIR_FRIEND = { Hair: "#1a1a1a" };
const carCx = (CAR.x0 + CAR.x1) / 2;
// power cable from the reactor to the machine room (dense points so it draws on smoothly)
const CABLE = new THREE.CatmullRomCurve3([new THREE.Vector3(14, 3, -6), new THREE.Vector3(11, 14, -4), new THREE.Vector3(5, ROOF + 2, -3), new THREE.Vector3(SHEAVE.x + 1.2, ROOF + 0.8, SHEAVE.z)]).getPoints(80);

// ───────────────────────── the story of the car (pure functions of the frame) ─────────────────────────
const G = 9.81;
/** Height of the car floor. */
export const carY = (f: number) => {
  if (f < c.heavy) return 0;
  if (f < c.diff) return 0.18 * Math.abs(Math.sin((f - c.heavy) / 7)); // you pull, it slips back
  if (f < c.snaps + 6) return keys(f, [[c.diff, 0.1], [c.snaps - 4, 15]]);
  if (f < c.rails) {
    const t = Math.max(0, (f - (c.snaps + 6)) / 30);
    return Math.max(0, 15 - 0.5 * G * t * t);
  }
  if (f < c.slack) return 15;
  if (f < c.faster) return 15 - 0.3 * ramp(f, c.slack + 4, c.slack + 8); // a few cm: brakes bite
  if (f < c.several) {
    // going down faster and faster until the governor fires the brakes
    const tStop = c.fire + 4;
    const t = (Math.min(f, tStop) - c.faster) / 30;
    return 24 - 0.5 * 1.4 * t * t;
  }
  if (f < c.door) return keys(f, [[c.several, 24 - 0.5 * 1.4 * ((c.fire + 4 - c.faster) / 30) ** 2], [c.several + 1, 12]]);
  if (f < c.locked) return floorY(3);
  if (f < c.shut + 12) return keys(f, [[c.locked + 6, floorY(3)], [c.there - 4, floorY(10)]]);
  if (f < c.safe) return keys(f, [[c.shut + 12, floorY(10)], [c.springs - 2, 0.3], [c.springs + 10, -0.45]]);
  if (f < c.reactor + 10) return keys(f, [[c.safe, 0], [c.reactor, 1.2]]);
  return keys(f, [[c.reactor + 10, 1.2], [c.congrats, floorY(10)]], easeOut);
};
const cwY = (f: number) => ROOF - 3 - carY(f) * 0.95; // counterweight moves the other way

// ───────────────────────── 2D overlays ─────────────────────────
const Tag: React.FC<{ x: number; y: number; text: string; o: number; color?: string; side?: "left" | "right" }> = ({ x, y, text, o, color = "#ffd23f", side = "right" }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `translate(${side === "right" ? "0" : "-100%"}, -50%) scale(${0.85 + 0.15 * o})`, display: "flex", alignItems: "center", flexDirection: side === "right" ? "row" : "row-reverse", gap: 10 }}>
    <div style={{ width: 16, height: 16, borderRadius: 8, background: color, boxShadow: `0 0 12px ${color}` }} />
    <div style={{ width: 50, height: 4, background: color }} />
    <div style={{ padding: "8px 18px", borderRadius: 12, background: "#ffffff", border: `4px solid ${color}`, fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#111", whiteSpace: "nowrap", boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}>{text}</div>
  </div>
);

/** Big label stuck on a part (the reference reel's "120°F" style). */
const Big: React.FC<{ x: number; y: number; text: string; o: number; color?: string; size?: number }> = ({ x, y, text, o, color = "#ffffff", size = 70 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * o})`, opacity: o, fontFamily: fonts.punch, fontWeight: 900, fontSize: size, color, WebkitTextStroke: "10px #000", paintOrder: "stroke fill", whiteSpace: "nowrap" }}>{text}</div>
);

// ───────────────────────── 3D canvas ─────────────────────────
const Canvas3D: React.FC<{ cam: Cam; children: React.ReactNode; sky?: string }> = ({ cam, children, sky = "#a9cdf0" }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.1, far: 900 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 120, 420]} />
      <hemisphereLight args={["#e8f2ff", "#6b5a44", 0.85]} />
      <KeyLight p={[-30, 60, 40]} target={[0, 12, 0]} intensity={2.4} color="#fff3e2" size={40} />
      {children}
      <Env intensity={0.4} />
      <Post bloom={0.45} ao={1.4} vignette={0.35} />
    </ThreeCanvas>
  );
};

// ───────────────────────── the world (one continuous building) ─────────────────────────
export const SetWorld: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const y = carY(f);
  const built = f >= c.box;
  const crashed = f >= c.survive && f < c.rails;
  const brake = f >= c.slack && f < c.faster ? ramp(f, c.slack + 3, c.slack + 6) : f >= c.fire && f < c.several ? ramp(f, c.fire, c.fire + 4) : 0;
  const flyOut = ramp(f, c.swing - 4, c.swing + 6);
  const ropes = f >= c.several ? 1 + Math.min(3, Math.floor((f - c.several) / 6)) : 1;
  const carFloor = y / 3 + 1;
  // floor-10 door: opens for the friend gag, stays locked after the rewind, opens when the car is there,
  // closes before it may move, and opens again at the end
  const open10 =
    f >= c.door && f < c.locked
      ? ramp(f, c.door + 6, c.door + 18)
      : f >= c.there && f < c.bottom
        ? ramp(f, c.there + 2, c.there + 12) - ramp(f, c.cantMove, c.cantMove + 10)
        : f >= c.congrats
          ? ramp(f, c.congrats, c.congrats + 10)
          : 0;
  const tryDoor = f >= c.locked + 6 && f < c.there ? Math.sin((f - c.locked) * 1.3) * 0.02 * (1 - ramp(f, c.there - 10, c.there)) : 0;
  void tryDoor;
  const reactor = pop(f, c.reactor + 4, 16);

  // ── camera: one take per beat, moving through the same building
  const follow = (fy: number, dist = 10, side = 1.6): V3 => [side, fy + 2.4, dist];
  const cam: Cam = useMemo(() => {
    const k: [number, V3][] = [
      [0, [6, 16.5, 54]],
      [c.stairs - 12, [8, 10, 34]],
      [c.stairs, [4.0, 2.5, 7.8]],
      [c.box - 8, [4.3, 2.6, 6.6]],
      [c.box, [2.2, 2.6, 9.5]],
      [c.counter, [3.5, 4.5, 16]],
      [c.diff + 10, follow(4, 14, 3.5)],
      [c.snaps, follow(15, 11, 2.5)],
      [c.snaps + 25, follow(6, 12, 2.5)],
      [c.survive, [2.2, 1.6, 7.5]],
      [c.rails - 3, [2.0, 1.5, 7.0]],
      [c.rails, follow(15, 11, 2.8)],
      [c.slack, follow(15, 8, 2.0)],
      [c.faster, follow(24, 12, 3)],
      [c.wheel - 4, follow(20, 12, 3)],
      [c.wheel + 8, [0.4, ROOF + 2.0, 6.0]],
      [c.fire + 10, [0.4, ROOF + 2.0, 6.0]],
      [c.several, follow(12, 11, 3)],
      [c.door - 10, follow(12, 11, 3)],
      [c.door, [-0.6, floorY(10) + 2.2, 7.8]],
      [c.locked - 6, [-0.4, floorY(10) + 2.2, 7.6]],
      [c.locked, [-6.6, floorY(10) + 1.9, 1.4]],
      [c.cantMove + 12, [-6.4, floorY(10) + 1.9, 1.2]],
      [c.bottom - 6, [5, 15, 46]],
      [c.bottom + 6, [2.2, 0.4, 8]],
      [c.safe, [2.6, 2.2, 9]],
      [c.reactor, [2.6, 2.2, 9]],
      [c.reactor + 24, [22, 17, 66]],
      [c.congrats - 4, [22, 17, 64]],
      [c.congrats + 14, [-1.2, floorY(10) + 2.0, 9.5]],
      [c.end, [-1.6, floorY(10) + 1.9, 8.6]],
    ];
    const l: [number, V3][] = [
      [0, [0, 15.5, 0]],
      [c.stairs - 12, [4, 8, 0]],
      [c.stairs, [6.7, 1.3, -1.2]],
      [c.box - 8, [6.8, 1.7, -2.2]],
      [c.box, [-0.3, 1.5, -1]],
      [c.counter, [0, 3.5, -1]],
      [c.diff + 10, [0, 4, -1]],
      [c.snaps, [0, 15.5, -1]],
      [c.snaps + 25, [0, 5, -1]],
      [c.survive, [-0.2, 0.6, -1]],
      [c.rails - 3, [-0.2, 0.6, -1]],
      [c.rails, [0, 16, -1]],
      [c.slack, [0, 15.6, -1]],
      [c.faster, [0, 24, -1]],
      [c.wheel - 4, [0, 20, -1]],
      [c.wheel + 8, [-0.6, ROOF + 1.3, -1.6]],
      [c.fire + 10, [-0.6, ROOF + 1.3, -1.6]],
      [c.several, [0, 13.5, -1]],
      [c.door - 10, [0, 13.5, -1]],
      [c.door, [-2.3, floorY(10) + 1.2, -0.9]],
      [c.locked - 6, [-1.8, floorY(10) + 1.0, -0.9]],
      [c.locked, [-1.9, floorY(10) + 1.5, -0.9]],
      [c.cantMove + 12, [-1.9, floorY(10) + 1.5, -0.9]],
      [c.bottom - 6, [0, 15, 0]],
      [c.bottom + 6, [-0.3, -0.6, -1]],
      [c.safe, [-0.3, 1.4, -1]],
      [c.reactor, [-0.3, 1.4, -1]],
      [c.reactor + 24, [10, 13, -4]],
      [c.congrats - 4, [10, 13, -4]],
      [c.congrats + 14, [-2.6, floorY(10) + 1.2, -0.6]],
      [c.end, [-2.7, floorY(10) + 1.2, -0.6]],
    ];
    let pos = keys3(f, k);
    let look = keys3(f, l);
    // while the car travels, the camera rides along with it (blended in/out over 10 frames)
    const ride = (a: number, b2: number, dist: number, side: number) => {
      if (f < a - 10 || f > b2 + 10) return;
      const w = Math.min(ramp(f, a - 10, a), 1 - ramp(f, b2, b2 + 10));
      const yy = Math.max(1.2, carY(Math.min(f, b2)));
      const P: V3 = [side, yy + 2.4, dist];
      const L: V3 = [-0.3, yy + 1.3, -1];
      pos = pos.map((v, i) => v + (P[i] - v) * w) as V3;
      look = look.map((v, i) => v + (L[i] - v) * w) as V3;
    };
    ride(c.diff, c.snaps + 26, 13, 3);
    ride(c.faster, c.wheel - 2, 13, 3);
    return { pos, look, fov: 38 };
  }, [f]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── people
  const youStairs = f >= c.stairs && f < c.box;
  const youP: V3 = youStairs
    ? (() => {
        const z = keys(f, [[c.stairs, 1.6], [c.corner, -1.0], [c.box, -0.9]]);
        return [6.45, stairY(z), z] as V3;
      })()
    : f < c.stairs
      ? [6.4, 0, 0.6]
      : f < c.climb + 10
        ? [keys(f, [[c.box, 2.6], [c.climb, 2.6], [c.climb + 14, -1.0]]), 0, -0.4]
        : [-1.0, y + 0.12, -0.6];
  const youClip = youStairs ? "Push_Loop" : f < c.stairs ? "Walk_Loop" : f < c.climb ? "Idle_Loop" : f < c.climb + 14 ? "Walk_Loop" : "Idle_Rail_Loop";
  const youRy = youStairs ? Math.PI : f < c.climb + 14 && f >= c.box ? -Math.PI / 2 : f < c.stairs ? -Math.PI / 2 : 0;
  const plushP: V3 = youStairs
    ? (() => {
        const z = keys(f, [[c.stairs, 0.3], [c.corner, -2.3]]);
        return [keys(f, [[c.corner, 6.45], [c.corner + 12, 6.75]]), stairY(z + 0.3) + 0.02, z] as V3;
      })()
    : f < c.stairs
      ? [5.2, 0, 0.6]
      : f < c.climb + 10
        ? [keys(f, [[c.climb, 3.6], [c.climb + 14, 0.05]]), 0, -0.7]
        : crashed
          ? [0.1, 0.25, -0.6]
          : f >= c.congrats
            ? [keys(f, [[c.congrats + 6, 0.05], [c.congrats + 26, -2.3]]), floorY(10) + 0.02 + (f >= c.callIt ? Math.max(0, Math.sin(((f - c.callIt - 3) / 16) * Math.PI)) * 0.5 : 0), keys(f, [[c.congrats + 6, -1.0], [c.congrats + 26, -0.4]])]
            : [0.05, y + 0.12, -1.0];
  // wedged in the turn: squeezed narrow (negative squish = taller/thinner) and shaking as you push
  const wedged = youStairs ? ramp(f, c.corner, c.corner + 8) : 0;
  const squish = youStairs ? -0.25 * wedged + 0.04 * wedged * Math.sin(f / 2.2) : crashed ? 0.4 : 0;
  const jump = f >= c.callIt ? Math.max(0, Math.sin(((f - c.callIt) / 16) * Math.PI)) * 0.55 : 0;
  const friendP: V3 = f >= c.locked && f < c.bottom ? [-2.5, floorY(10), -0.9] : f >= c.congrats ? [-3.6, floorY(10) + jump, -0.2] : f >= c.door && f < c.locked ? [keys(f, [[c.door, -4.4], [c.empty - 6, -2.25], [c.empty + 4, -1.45]]), floorY(10) + (f > c.empty + 4 ? -0.1 * ramp(f, c.empty + 4, c.empty + 10) : 0), -0.9] : [-3.8, floorY(10), 0.4];
  const friendClip = f >= c.door && f < c.empty ? "Walk_Loop" : f >= c.callIt ? "Jump_Loop" : f >= c.congrats ? "Yes" : f >= c.empty && f < c.locked ? "Idle_No_Loop" : f >= c.locked && f < c.there ? "Interact" : "Idle_Talking_Loop";

  // overlays need the same camera
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pFriend = at([-3.8, floorY(10) + 2.2, 0.4]);
  const pCw = at([CW.x, cwY(f) + CW.h + 0.4, CW.z]);
  const pCar = at([carCx, y + 3.0, -0.9]);
  const pReactor = at([19, 9.5, -7]);
  const pDoor = at([-1.95, floorY(10) + 1.4, -0.9]);

  return (
    <AbsoluteFill>
      <Canvas3D cam={cam}>
        <Ground />
        <Building />
        <MachineRoom spin={-y / SHEAVE.r} crank={f >= c.box && f < c.reactor + 20 ? 1 : 0} motor={pop(f, c.reactor + 10, 14)} governor={pop(f, c.wheel, 12)} flyOut={f >= c.several ? 0 : flyOut} />
        {/* the car, its rope(s) and the counterweight */}
        {built && !crashed ? <Car y={y} brake={brake} show={pop(f, c.box, 12)} brakes={f >= c.rails} /> : null}
        {crashed ? (
          <group>
            {Array.from({ length: 7 }, (_, i) => {
              const r = seeded(i * 13 + 3);
              return <RB key={i} p={[-1.2 + r() * 2, 0.1 + r() * 0.3, -1.6 + r() * 1.6]} s={[1.2 + r(), 0.1, 0.25]} rot={[r() * 0.4, r() * 3, r() * 0.6]} r={0.02} color="#9a6b3e" />;
            })}
          </group>
        ) : null}
        {built && !(f >= c.snaps + 6 && f < c.rails)
          ? Array.from({ length: ropes }, (_, i) => {
              const dz = (i - (ropes - 1) / 2) * 0.16;
              const top: V3 = [SHEAVE.x - SHEAVE.r, SHEAVE.y, SHEAVE.z + dz];
              return (
                <group key={i}>
                  <Rope a={[SHEAVE.x - SHEAVE.r, y + CAR.h + 0.15, -0.9 + dz]} b={top} travel={y} />
                  {f >= c.counter ? <Rope a={[CW.x, cwY(f) + CW.h + 0.1, CW.z + dz]} b={[SHEAVE.x + SHEAVE.r, SHEAVE.y, SHEAVE.z + dz]} travel={-y} /> : null}
                </group>
              );
            })
          : null}
        {/* the snapped rope end whips up after the snap */}
        {f >= c.snaps + 6 && f < c.survive ? <Rope a={[SHEAVE.x - SHEAVE.r, SHEAVE.y - keys(f, [[c.snaps + 6, 13], [c.snaps + 30, 3]]), SHEAVE.z]} b={[SHEAVE.x - SHEAVE.r, SHEAVE.y, SHEAVE.z]} travel={0} dots={false} /> : null}
        <Counterweight y={cwY(f)} o={pop(f, c.counter, 12)} />
        <Rails o={ramp(f, c.rails, c.rails + 14, easeOut)} />
        <LandingDoors o={ramp(f, c.door - 2, c.door + 8)} carFloor={carFloor} open10={open10} lockShow={pop(f, c.locked + 4, 10)} />
        <Buffers o={pop(f, c.bottom + 4, 12)} squeeze={ramp(f, c.springs - 6, c.springs + 10)} />
        {/* governor rope loop (shaft back corner) */}
        {f >= c.wheel ? (
          <group>
            <Rope a={[-1.65, -1.4, -2.6]} b={[-1.65, ROOF + 1.2, -2.6]} travel={y} color="#e0b23a" dots={false} />
            <Rope a={[-0.95, -1.4, -2.6]} b={[-0.95, ROOF + 1.2, -2.6]} travel={-y} color="#e0b23a" />
          </group>
        ) : null}
        {/* people */}
        {crashed ? null : <Model file="man_a.glb" anims={youClip === "Idle_Rail_Loop" ? LIB2 : LIB1} clip={youClip} t={t} p={youP} ry={youRy} outfit={YOU} tint={HAIR_YOU} />}
        {f < c.bottom || f >= c.congrats ? <Model file="man_b.glb" anims={friendClip === "Yes" || friendClip === "Idle_No_Loop" ? LIB2 : LIB1} clip={friendClip} t={t} p={friendP} ry={(f >= c.door && f < c.bottom) ? Math.PI / 2 : f >= c.congrats ? 0.5 : 0} outfit={FRIEND} tint={HAIR_FRIEND} /> : null}
        <group position={plushP} rotation={[0, 0, youStairs ? -0.35 * wedged : 0]}>
          <Plush s={0.85} t={t} squish={squish} ry={youStairs ? Math.PI + 0.6 * wedged : 0} />
        </group>
        {/* the joke: a nuclear plant next door, with a cable to the machine room */}
        {reactor > 0 ? (
          <group>
            <Reactor p={[19, 1.6 * reactor * 1.6, -7]} s={1.6 * reactor} t={t} steam={ramp(f, c.reactor + 12, c.reactor + 30)} />
            <TubePath points={CABLE} color="#3dff7a" progress={ramp(f, c.reactor + 6, c.reactor + 22)} radius={0.12} />
          </group>
        ) : null}
        {/* sweat while pulling by hand */}
        {f >= c.heavy && f < c.counter + 10 ? <Glow position={[-0.8, y + 2.0, -0.2]} size={0.25} color="#8fd0ff" opacity={0.6 * Math.abs(Math.sin(f / 5))} /> : null}
        {f >= c.hand && f < c.reactor ? <Glow position={[-0.8, y + 2.0, -0.2]} size={0.25} color="#8fd0ff" opacity={0.6 * Math.abs(Math.sin(f / 5))} /> : null}
      </Canvas3D>
      {/* labels */}
      {f >= c.corner + 6 && f < c.box - 4 ? <Big x={540} y={560} text="STUCK!" o={fadeIn(f, c.corner + 6)} color="#ff3b30" size={96} /> : null}
      {pFriend && f < c.stairs - 6 ? <Tag x={pFriend.x + 30} y={pFriend.y} text="10TH FLOOR" o={fadeIn(f, 12)} /> : null}
      {pCw && f >= c.counter + 10 && f < c.snaps ? <Tag x={pCw.x + 30} y={pCw.y} text="BOX + ½ LOAD" color="#ff8a1f" o={fadeIn(f, c.counter + 10)} /> : null}
      {pCar && f >= c.eachOne && f < c.door ? <Tag x={pCar.x + 40} y={pCar.y} text="× 4 ROPES" o={fadeIn(f, c.eachOne)} /> : null}
      {pDoor && f >= c.locked + 4 && f < c.bottom ? (
        <div style={{ position: "absolute", left: pDoor.x, top: pDoor.y - 330, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * fadeIn(f, c.locked + 4)})`, opacity: fadeIn(f, c.locked + 4), display: "flex", alignItems: "center", gap: 14, padding: "14px 26px", borderRadius: 18, background: f >= c.there + 2 && f < c.cantMove + 6 ? "#22c55e" : "#ef4444", fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, color: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
          {f >= c.there + 2 && f < c.cantMove + 6 ? "🔓 BOX IS HERE" : "🔒 LOCKED"}
        </div>
      ) : null}
      {f >= c.elevator ? <Big x={540} y={560} text="THE ELEVATOR" o={fadeIn(f, c.elevator)} size={110} color="#ffd23f" /> : null}
      {pReactor && f >= c.reactor + 16 && f < c.congrats + 10 ? <Tag x={pReactor.x - 20} y={pReactor.y} side="left" text="☢ NUCLEAR REACTOR" color="#3dff7a" o={fadeIn(f, c.reactor + 16)} /> : null}
      {f >= c.faster && f < c.fire + 6 ? <Big x={540} y={1450} text={`${(1.4 * (Math.min(f, c.fire + 4) - c.faster) / 30).toFixed(1)} m/s`} o={fadeIn(f, c.faster)} color={f >= c.swing ? "#ff3b30" : "#ffffff"} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── close-up: the brake grabs the rail (schematic) ─────────────────────────
export const SetBrake: React.FC<SetProps> = ({ f }) => {
  const slack = ramp(f, c.slack + 2, c.slack + 8);
  const bite = ramp(f, c.slack + 8, c.slack + 14, easeOut);
  const drop = 24 * bite;
  const tooth = (i: number) => <path key={i} d={`M 470 ${300 + i * 90} l 70 40 l -70 40 z`} fill="#1f8fa0" />;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #f4efe6 0%, #d9d2c4 100%)" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {/* rail with teeth */}
        <rect x={400} y={200} width={70} height={1500} fill="#34c6d9" />
        {Array.from({ length: 16 }, (_, i) => tooth(i))}
        {/* car side */}
        <g transform={`translate(0 ${drop})`}>
          <rect x={640} y={520} width={300} height={700} rx={16} fill="#9a6b3e" stroke="#5a3b22" strokeWidth={8} />
          {/* spring (zig-zag) pushing the pawl toward the rail when the rope goes slack */}
          <polyline points={Array.from({ length: 9 }, (_, i) => `${640 - 20 - (i % 2) * 40},${760 + i * 14 * (1 - 0.5 * slack)}`).join(" ")} fill="none" stroke="#333" strokeWidth={8} />
          <path d={`M 640 700 L ${560 - 30 * slack} ${720 + 10 * slack} L 640 760 Z`} fill={bite > 0.5 ? "#ff3b30" : "#c0392b"} stroke="#5a1a14" strokeWidth={6} />
          {/* rope */}
          <path d={slack < 0.5 ? "M 790 520 L 790 120" : `M 790 520 Q 830 400 760 300 Q 700 220 780 120`} fill="none" stroke="#ffd23f" strokeWidth={18} strokeLinecap="round" />
        </g>
      </svg>
      <div style={{ position: "absolute", top: 1380, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, color: bite > 0.5 ? "#ff3b30" : "#1d2330", WebkitTextStroke: bite > 0.5 ? "0" : "0", opacity: fadeIn(f, c.slack + 6) }}>
        {bite > 0.5 ? "GRAB!" : "ROPE GOES SLACK"}
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── flashback: New York, 1854 ─────────────────────────
export const SetOtis: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cutAt = c.cut + 10;
  const drop = f < cutAt ? 0 : 0.18 * ramp(f, cutAt, cutAt + 5, easeOut);
  const H = 9; // platform height
  // wide on the crowd under the raised platform, then up to Otis when it drops
  const cam: Cam = { pos: keys3(f, [[c.y1854, [10, 3, 20]], [c.cut - 6, [7, 3.2, 17]], [c.dropped, [4, H + 1.2, 9]]]), look: keys3(f, [[c.y1854, [0, 6, 0]], [c.cut - 6, [0, 5.6, 0]], [c.dropped, [0, H + 0.7, 0]]]), fov: 40 };
  const wood = useMemo(() => tex("planks", "#8a6a44", [2, 2], 91), []);
  const floor = useMemo(() => tex("planks", "#6b5236", [8, 8], 92), []);
  const crowd = useMemo(() => {
    const r = seeded(18);
    const files = ["man_b.glb", "woman_a.glb", "man_c.glb", "woman_b.glb", "man_d.glb", "woman_c.glb"];
    return Array.from({ length: 9 }, (_, i) => ({ file: files[i % files.length], p: [-5 + (i % 5) * 2.4 + r() * 0.6, 0, 4 + Math.floor(i / 5) * 1.8 + r()] as V3, ry: Math.PI + (r() - 0.5) * 0.6, ph: r() * 3 }));
  }, []);
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ filter: "sepia(0.75) contrast(1.08) brightness(1.02)" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 36, near: 0.1, far: 300 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
        <CameraRig cam={cam} />
        <color attach="background" args={["#d9cdb6"]} />
        <hemisphereLight args={["#fff4e0", "#5a4a36", 0.9]} />
        <KeyLight p={[-12, 30, 20]} target={[0, 5, 0]} intensity={2} color="#fff0d8" size={20} />
        {/* exhibition hall floor + back wall with tall windows */}
        <Slab p={[0, -0.05, 0]} s={[60, 0.1, 40]} map={floor} rough={0.8} />
        <Slab p={[0, 9, -6]} s={[60, 18, 0.3]} color="#c9b99a" rough={0.9} />
        {[-12, -6, 6, 12].map((x) => (
          <Slab key={x} p={[x, 9, -5.8]} s={[2.6, 9, 0.05]} color="#f6efe0" rough={0.4} />
        ))}
        {/* the hoist tower: two wooden posts, a beam with a pulley */}
        {[-1.6, 1.6].map((x) => (
          <RB key={x} p={[x, (H + 4) / 2, 0]} s={[0.3, H + 4, 0.3]} r={0.03} map={wood} />
        ))}
        <RB p={[0, H + 4, 0]} s={[3.6, 0.35, 0.4]} r={0.03} map={wood} />
        {/* platform with Otis on it */}
        <group position={[0, H - drop, 0]}>
          <RB p={[0, 0, 0]} s={[2.8, 0.18, 2.2]} r={0.03} map={wood} />
          <RB p={[0, 0.5, -1.05]} s={[2.8, 1.0, 0.08]} r={0.02} map={wood} />
          <Model file="man_c.glb" anims={LIB1} clip="Idle_Loop" t={t} p={[0, 0.1, 0]} outfit={{ top: "#4a4038", pants: "#2b2622", shoes: "#111", sleeves: 0.9 }} tint={HAIR_FRIEND} />
          {/* top hat */}
          <mesh position={[0, 2.02, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.26, 24]} />
            <meshStandardMaterial color="#141414" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.89, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.02, 24]} />
            <meshStandardMaterial color="#141414" roughness={0.6} />
          </mesh>
          {/* brake pawls flash when they bite */}
          {[-1.45, 1.45].map((x) => (
            <RB key={x} p={[x, 0.1, 0]} s={[0.18, 0.3, 0.3]} r={0.02} color={f >= cutAt + 3 ? "#ff3b30" : "#7a2a22"} emissive="#ff2a1a" ei={f >= cutAt + 3 ? 1.5 : 0} />
          ))}
        </group>
        {/* the rope (cut at cutAt) down to the winch where a man with an axe stands */}
        <Rope a={[0, H + 0.1 - drop, 0]} b={[0, H + 3.8, 0]} travel={0} dots={false} color="#c9a46a" />
        {f < cutAt ? <Rope a={[0.4, 1.0, 0.6]} b={[0.4, H + 3.8, 0.3]} travel={0} dots={false} color="#c9a46a" /> : <Rope a={[0.4, 1.0, 0.6]} b={[0.4, 2.6, 0.55]} travel={0} dots={false} color="#c9a46a" />}
        <Model file="man_d.glb" anims={LIB2} clip="TreeChopping_Loop" t={t} p={[1.4, 0, 0.9]} ry={-Math.PI / 2} outfit={{ top: "#5a4632", pants: "#3a3028", shoes: "#1d1a16" }} tint={HAIR_FRIEND} />
        {crowd.map((q, i) => (
          <Model key={i} file={q.file} anims={LIB2} clip="Idle_FoldArms_Loop" t={t + q.ph} p={q.p} ry={q.ry} outfit={{ top: ["#4a3a2a", "#2e3a4a", "#5a2e2e", "#3a4a32"][i % 4], pants: "#2b2b2b", shoes: "#111" }} tint={HAIR_FRIEND} />
        ))}
        <Env intensity={0.35} />
        <Post bloom={0.3} ao={1.4} vignette={0.6} />
      </ThreeCanvas>
      <div style={{ position: "absolute", top: 260, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 120, color: "#fff", WebkitTextStroke: "14px #000", paintOrder: "stroke fill", opacity: fadeIn(f, c.y1854) }}>1854</div>
      <div style={{ position: "absolute", top: 400, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 800, fontSize: 40, color: "#fff", WebkitTextStroke: "8px #000", paintOrder: "stroke fill", opacity: fadeIn(f, c.y1854 + 10) }}>ELISHA OTIS · NEW YORK</div>
    </AbsoluteFill>
  );
};

// ───────────────────────── close-up: how the overspeed governor works (schematic) ─────────────────────────
/** Box speed in the insert (m/s, illustrative): it creeps up, then the brakes stop it. */
const govSpeed = (f: number) => {
  if (f < c.fire + 4) return 0.8 + 2.6 * ramp(f, c.wheel, c.swing + 6, (x) => x * x);
  return 3.4 * (1 - ramp(f, c.fire + 4, c.fire + 12, easeOut));
};

export const SetGovernor: React.FC<SetProps> = ({ f }) => {
  // distance travelled since the insert started (sum of speeds) drives the box, the rope and the wheel
  let dist = 0;
  for (let k = c.wheel; k < f; k++) dist += govSpeed(k) / 30;
  const v = govSpeed(f);
  const W = { x: 540, y: 600, r: 190 };
  const angle = (dist / 1.0) * 1.4; // wheel turns with the rope (rad)
  const spread = f < c.fire + 4 ? ramp(f, c.swing - 6, c.swing + 10, easeOut) : 1 - ramp(f, c.fire + 30, c.fire + 45);
  // at rest the arms lie folded along the rim (75° off radial); too fast → they swing out to 10°
  const armA = (75 - 65 * spread) * (Math.PI / 180);
  const tripped = f >= c.fire;
  const flash = tripped ? 1 - ramp(f, c.fire, c.fire + 12) : 0;
  const boxY = 1000 + Math.min(330, dist * 45);
  const L = W.x - W.r; // left rope strand (the box hangs on it)
  const R = W.x + W.r;
  const bottom = 1720;
  const dots = (x: number, dir: 1 | -1) =>
    Array.from({ length: 14 }, (_, i) => {
      const yy = W.y + (((i * 90 + dir * dist * 150) % 1260) + 1260) % 1260 * 0.86;
      return yy < bottom ? <circle key={i} cx={x} cy={yy} r={9} fill="#fff" /> : null;
    });
  const weight = (side: 1 | -1) => {
    // arm hinged near the hub, rotates with the wheel; spread opens it outward
    const base = angle + (side > 0 ? 0 : Math.PI);
    const hx = W.x + Math.cos(base) * 40;
    const hy = W.y + Math.sin(base) * 40;
    const a = base + side * 0 + armA;
    const ex = hx + Math.cos(a) * 170;
    const ey = hy + Math.sin(a) * 170;
    return (
      <g key={side}>
        <line x1={hx} y1={hy} x2={ex} y2={ey} stroke="#2b2f36" strokeWidth={14} strokeLinecap="round" />
        <circle cx={ex} cy={ey} r={30} fill={spread > 0.8 ? "#ff3b30" : "#9aa3ad"} stroke="#2b2f36" strokeWidth={6} />
        <circle cx={hx} cy={hy} r={10} fill="#2b2f36" />
      </g>
    );
  };
  const gauge = Math.min(1, v / 3.4);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #f6f1e7 0%, #ddd5c6 100%)" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {/* rope loop: over the wheel, down to a tension pulley; the box hangs on the left strand */}
        <line x1={L} y1={W.y} x2={L} y2={bottom} stroke="#e0b23a" strokeWidth={16} />
        <line x1={R} y1={W.y} x2={R} y2={bottom} stroke="#e0b23a" strokeWidth={16} />
        {dots(L, 1)}
        {dots(R, -1)}
        <circle cx={W.x} cy={bottom} r={W.r} fill="none" stroke="#e0b23a" strokeWidth={16} />
        <circle cx={W.x} cy={bottom} r={40} fill="#6b7280" />
        {/* the box (its brakes grab when the rope is stopped) */}
        <g transform={`translate(${L - 110}, ${boxY})`}>
          <rect x={0} y={0} width={220} height={170} rx={12} fill="#9a6b3e" stroke="#5a3b22" strokeWidth={8} />
          <rect x={-26} y={110} width={26} height={50} fill={tripped ? "#ff3b30" : "#c0392b"} />
          <rect x={220} y={110} width={26} height={50} fill={tripped ? "#ff3b30" : "#c0392b"} />
          <text x={110} y={100} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={42} fill="#fff">BOX</text>
        </g>
        {/* wheel with spokes, turning with the rope */}
        <g transform={`rotate(${(angle * 180) / Math.PI} ${W.x} ${W.y})`}>
          <circle cx={W.x} cy={W.y} r={W.r} fill="#f2c94c" stroke="#8a6a1a" strokeWidth={12} />
          {[0, 60, 120].map((d) => (
            <line key={d} x1={W.x - W.r * Math.cos((d * Math.PI) / 180)} y1={W.y - W.r * Math.sin((d * Math.PI) / 180)} x2={W.x + W.r * Math.cos((d * Math.PI) / 180)} y2={W.y + W.r * Math.sin((d * Math.PI) / 180)} stroke="#c9a23a" strokeWidth={10} />
          ))}
        </g>
        {/* spring between the two weights pulls them in */}
        {(() => {
          const p = (side: 1 | -1) => {
            const base = angle + (side > 0 ? 0 : Math.PI);
            const a = base + armA;
            return [W.x + Math.cos(base) * 40 + Math.cos(a) * 95, W.y + Math.sin(base) * 40 + Math.sin(a) * 95];
          };
          const [x1, y1] = p(1);
          const [x2, y2] = p(-1);
          const n = 10;
          const pts = Array.from({ length: n + 1 }, (_, i) => {
            const t = i / n;
            const nx = -(y2 - y1);
            const ny = x2 - x1;
            const len = Math.hypot(nx, ny) || 1;
            const o = i % 2 === 0 || i === n ? 0 : (i % 4 === 1 ? 18 : -18);
            return `${x1 + (x2 - x1) * t + (nx / len) * o},${y1 + (y2 - y1) * t + (ny / len) * o}`;
          }).join(" ");
          return <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth={7} />;
        })()}
        {weight(1)}
        {weight(-1)}
        <circle cx={W.x} cy={W.y} r={26} fill="#2b2f36" />
        {/* trip catch: when a weight swings out far enough it knocks this, and the clamp grabs the rope */}
        <g transform={`rotate(-45 ${W.x} ${W.y})`}>
          <rect x={W.x + W.r + 24} y={W.y - 26} width={70} height={52} rx={10} fill={tripped ? "#ff3b30" : "#4b5563"} />
        </g>
        <text x={W.x + 205} y={W.y - 230} fontFamily={fonts.punch} fontWeight={900} fontSize={30} fill="#374151">TRIGGER</text>
        <g transform={`translate(${L}, ${W.y + 230})`}>
          <rect x={-70 + (tripped ? 34 : 0)} y={-30} width={46} height={60} rx={8} fill={tripped ? "#ff3b30" : "#6b7280"} />
          <rect x={24 - (tripped ? 34 : 0)} y={-30} width={46} height={60} rx={8} fill={tripped ? "#ff3b30" : "#6b7280"} />
        </g>
        <text x={L - 150} y={W.y + 240} fontFamily={fonts.punch} fontWeight={900} fontSize={30} fill="#374151">CLAMP</text>
        {flash > 0 ? <circle cx={L} cy={W.y + 230} r={60 + 140 * (1 - flash)} fill="none" stroke="#ff3b30" strokeWidth={10} opacity={flash} /> : null}
        {/* speed gauge */}
        <rect x={950} y={900} width={60} height={600} rx={30} fill="#e5e7eb" stroke="#374151" strokeWidth={6} />
        <rect x={950} y={900} width={60} height={150} rx={30} fill="#fecaca" />
        <rect x={956} y={1494 - 588 * gauge} width={48} height={588 * gauge} rx={24} fill={gauge > 0.75 ? "#ef4444" : "#22c55e"} />
        <text x={980} y={880} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={34} fill="#111">SPEED</text>
      </svg>
      {/* labels */}
      {f >= c.wheel + 10 && f < c.spinsBox ? <div style={{ position: "absolute", left: 70, top: 300, opacity: fadeIn(f, c.wheel + 10), padding: "10px 20px", borderRadius: 14, background: "#fff", border: "4px solid #e0b23a", fontFamily: fonts.punch, fontWeight: 900, fontSize: 38 }}>WHEEL + WEIGHTS</div> : null}
      {f >= c.spinsBox && f < c.swing ? <div style={{ position: "absolute", left: 70, top: 300, opacity: fadeIn(f, c.spinsBox), padding: "10px 20px", borderRadius: 14, background: "#fff", border: "4px solid #e0b23a", fontFamily: fonts.punch, fontWeight: 900, fontSize: 38 }}>ROPE MOVES WITH THE BOX ↓</div> : null}
      {f >= c.swing && f < c.fire ? <div style={{ position: "absolute", width: "100%", top: 300, textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, color: "#ef4444", opacity: fadeIn(f, c.swing), padding: "0 40px" }}>TOO FAST → WEIGHTS FLY OUT</div> : null}
      {f >= c.fire ? <div style={{ position: "absolute", width: "100%", top: 300, textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 50, color: "#ef4444", opacity: fadeIn(f, c.fire), padding: "0 40px" }}>CLICK → ROPE STOPS → BRAKES GRAB</div> : null}
    </AbsoluteFill>
  );
};
