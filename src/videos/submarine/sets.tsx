import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as THREE from "three";
import { Cam, Glow, project, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { MiniSub, subDims } from "../../lib/three/MiniSub";
import { FursuitHead } from "../../lib/three/Mascots";
import { CRANE_TIP, WB, WorkBoat } from "../../lib/three/WorkBoat";
import { fonts } from "../../lib/theme";
import { easeInOut, easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { c } from "./cues";
import { bedY, DEPTHS, FRONT, Jelly, OceanCanvas, PLUSH_X } from "./ocean";
import { Bubbles, Cabin, Cable, GiantGlass, GLASS, PingRing, PressureArrows, RealSub, Splash } from "./parts";

export type SetProps = { f: number };
export const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
export const pop = (f: number, a: number, d = 10) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));

const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const YOU: Outfit = { top: "#e8573a", pants: "#2c3440", shoes: "#f2f2f2" };
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" };
const HAIR_YOU = { Hair: "#3b2a1e" };
const HAIR_FRIEND = { Hair: "#1a1a1a" };
const X0 = CRANE_TIP[0]; // everything is lowered from the crane at this x
const D = WB.deck;
const PL: V3 = [PLUSH_X, bedY(PLUSH_X, 0), 0];
const SP: V3 = [X0, -222, 0]; // where the sub pings
const FINAL: V3 = [-12.2, -0.72, 1.2]; // surfaced behind the stern, sail out of the water
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// ───────────────────────── the story, as pure functions of the frame ─────────────────────────
/** The fursuit head ("giant pocket puh"): sits on the stern → overboard → sinks 300 m → on the sand → in the claw →
 * tossed back → lands on your friend's head, and he dances in it. */
type MaskPose = { p: V3; rz: number; ry: number; worn: boolean; tumble: number };
const MASK_S = 0.5;
const LANDED = c.built + 46;
const DANCE_FRIEND: V3 = [-0.42, D, 0.2];
const FRIEND_RY = -0.75;
/** Where the worn mask's origin sits on the friend (head bone ≈ 1.58 m, mask 0.2 below it in bone space). */
const ON_HEAD: V3 = [DANCE_FRIEND[0] + 0.03 * Math.sin(FRIEND_RY), D + 1.38, DANCE_FRIEND[2] + 0.03 * Math.cos(FRIEND_RY)];
const WORN_OFFSET: V3 = [0, -0.2, 0.03];
const plushState = (f: number, sub: SubState): MaskPose => {
  const base = { worn: false, tumble: 0 };
  const water = c.dropped + 22;
  // on the deck in front of you two, then it rolls off the stern (between the A-frame legs)
  if (f < c.dropped + 4) return { ...base, p: [-3.6, D, 0.7], rz: 0, ry: 0.3 };
  if (f < water) {
    const k = ramp(f, c.dropped + 4, water, (x) => x * x);
    return { ...base, p: [-3.6 - 2.95 * k, D + 0.35 * Math.sin(k * Math.PI) - (D + 0.4) * k, 0.7 - 0.5 * k], rz: 1.9 * k, ry: 0.3, tumble: k };
  }
  const land = c.sank + 42;
  if (f < land) {
    const k = ramp(f, water, land, easeInOut);
    const x = -6.55 + (PL[0] + 6.55) * Math.pow(k, 1.6);
    return { ...base, p: [x, -0.4 + (PL[1] + 0.4) * k, 0.2 - 0.2 * k], rz: 1.9 + 3.3 * k, ry: 0.25 + 1.6 * k, tumble: 1 };
  }
  // lying on its side on the sand, face towards the camera
  if (f < c.grab + 6) return { ...base, p: [PL[0], PL[1] + 0.3, 0], rz: 1.35, ry: 0.35 };
  // held by the top of the head in the claw
  const inClaw = add(sub.p, [sub.dims.half + 1.35, -1.43 - 0.68, 0]);
  if (f < c.built + 18) return { ...base, p: inClaw, rz: 0.12, ry: 0.4 };
  const k = ramp(f, c.built + 18, LANDED, easeInOut);
  const p = lerp3(inClaw, ON_HEAD, k);
  p[1] += Math.sin(k * Math.PI) * 2.6;
  if (f < LANDED) return { ...base, p, rz: 0.12 * (1 - k) + k * 2 * Math.PI, ry: 0.4 + (FRIEND_RY - 0.4) * k };
  return { ...base, p: ON_HEAD, rz: 0, ry: FRIEND_RY, worn: true };
};

type SubState = {
  show: boolean;
  p: V3;
  ry: number;
  rz: number;
  stretch: number;
  paint: number;
  xray: number;
  tanks: number;
  fill: number;
  vent: number;
  blow: number;
  lights: number;
  arm: number;
  claw: number;
  reactor: number;
  hatch: number;
  prop: number; // propeller time (stops when the batteries die)
  dims: ReturnType<typeof subDims>;
};

/** The vehicle: steel ball on a cable → free ball with tanks → stretched sub → dive → grab → reactor → surface. */
const subState = (f: number): SubState => {
  const show = f >= c.ball;
  const stretch = ramp(f, c.stretch + 4, c.domes + 18, easeInOut);
  const paint = ramp(f, c.stretch + 10, c.domes + 24, easeInOut);
  const reactor = f >= c.reactor ? pop(f, c.reactor + 4, 18) : 0;
  const dims = subDims(stretch, reactor);
  // ── depth / position
  let y: number;
  let x = X0;
  let z = 0;
  if (f < c.lower) y = 1.6;
  else if (f < c.again) y = keys(f, [[c.lower, 1.6], [c.y1934 + 20, -40]]);
  else if (f < c.cut) y = keys(f, [[c.again, -55], [c.ends, -58]]) - (f > c.ends + 18 ? 0.35 * ramp(f, c.ends + 18, c.ends + 22, easeOut) : 0) - (f > c.ends + 34 ? 0.25 * ramp(f, c.ends + 34, c.ends + 37, easeOut) : 0);
  else if (f < c.blow) y = keys(f, [[c.rushes + 8, -58.6], [c.blow, -72]], (k) => k * k);
  else if (f < c.p300) y = keys(f, [[c.pushed - 10, -72], [c.fits - 4, -60], [c.p300, -60]]);
  else if (f < c.breathe) y = keys(f, [[c.p300, -60], [c.kilo + 10, -150]]);
  else if (f < c.below) y = keys(f, [[c.breathe, -150], [c.below, -170]]);
  else if (f < c.sound) y = keys(f, [[c.below, -185], [c.ping - 2, SP[1]]]);
  else if (f < c.batt) {
    // off-screen during the sonar insert it travels to the plush; then rises with it
    const grabP: V3 = add(PL, [-(subDims(1).half + 1.35), subDims(1).R + 0.9, 0]);
    const k = ramp(f, c.sound, c.arm - 6, easeInOut);
    x = SP[0] + (grabP[0] - SP[0]) * k;
    y = SP[1] + (grabP[1] - SP[1]) * k;
    if (f >= c.blowT + 6) y = grabP[1] + 46 * Math.pow(ramp(f, c.blowT + 6, c.batt, (q) => q), 1.6);
  } else {
    x = FINAL[0];
    z = keys(f, [[c.real + 20, 0], [c.congrats, FINAL[2]]]);
    y = keys(f, [[c.batt, -16], [c.real + 24, -15], [c.congrats + 6, FINAL[1]]], easeOut);
  }
  const p: V3 = [x, y, z];
  // ── parts
  const tanks = f >= c.addTanks ? pop(f, c.addTanks, 12) : 0;
  const fill =
    f < c.rushes
      ? 0
      : f < c.pushed - 8
        ? ramp(f, c.rushes, c.sinkB + 14)
        : f < c.p300
          ? 1 - ramp(f, c.pushed - 8, c.rise + 10)
          : f < c.blowT
            ? ramp(f, c.p300, c.p300 + 24)
            : f < c.batt
              ? 1 - ramp(f, c.blowT, c.blowT + 22)
              : 0;
  const vent = (f >= c.open && f < c.blow) || (f >= c.p300 && f < c.p300 + 26) ? 1 : 0;
  const blow = (f >= c.blow && f < c.fits) || (f >= c.blowT && f < c.batt - 4) || (f >= c.congrats - 30 && f < c.built + 10) ? 1 : 0;
  const xray = f >= c.fits && f < c.stretch + 14 ? ramp(f, c.fits, c.fits + 10) * (1 - ramp(f, c.stretch, c.stretch + 14)) : f >= c.breathe && f < c.below + 10 ? ramp(f, c.breathe, c.breathe + 12) * (1 - ramp(f, c.below, c.below + 10)) : 0;
  // headlights: on in the deep, flicker out when the batteries die, back with the reactor
  let lights = ramp(f, c.noSun, c.noSun + 10);
  if (f >= c.batt) {
    const dying = f < c.reactor + 8;
    const fl = f >= c.empty - 4 && f < c.empty + 14 ? [0, 1, 1, 0, 0, 1, 0, 0, 0][Math.floor((f - (c.empty - 4)) / 2)] ?? 0 : f < c.empty - 4 ? 1 : 0;
    lights = dying ? fl : ramp(f, c.reactor + 8, c.reactor + 16);
  }
  const arm = f >= c.arm && f < c.built + 50 ? ramp(f, c.arm + 2, c.grab - 2, easeInOut) * (f >= c.built + 18 ? 1 - 0.5 * ramp(f, c.built + 18, c.built + 46) : 1) : 0;
  const claw = f >= c.grab ? ramp(f, c.grab, c.grab + 6) * (f >= c.built + 18 ? 1 - ramp(f, c.built + 40, c.built + 46) : 1) : 0;
  const hatch = ramp(f, c.built - 2, c.built + 10, easeOut);
  const prop = f < c.empty + 6 ? f / 30 : f < c.reactor + 8 ? (c.empty + 6) / 30 : (c.empty + 6) / 30 + (f - c.reactor - 8) / 30;
  // nose-down while diving, nose-up while rising
  const rz =
    f >= c.p300 && f < c.kilo + 10
      ? -0.22 * Math.sin(ramp(f, c.p300, c.kilo + 10) * Math.PI)
      : f >= c.blowT && f < c.batt
        ? 0.18 * Math.sin(ramp(f, c.blowT + 4, c.batt + 10) * Math.PI)
        : f >= c.real + 24 && f < c.built
          ? 0.12 * Math.sin(ramp(f, c.real + 24, c.built) * Math.PI)
          : 0;
  return { show, p, ry: 0, rz, stretch, paint, xray, tanks, fill, vent, blow, lights, arm, claw, reactor, hatch, prop, dims };
};

/** The giant glass (diving bell): flips, you step in, it is lowered to 10 m. Rim depth drives the water level. */
const glassState = (f: number) => {
  const show = f >= c.glass && f < c.ball;
  const flip = ramp(f, c.upside - 4, c.upside + 14, easeInOut);
  const rimY = keys(f, [[c.inside + 6, 0.55], [c.half - 2, -10]], easeInOut);
  const d = Math.max(0, -rimY);
  const water = 1 - 1 / (1 + d / 10); // Boyle: air volume = 1 / (1 + depth/10)
  const C: V3 = [X0, rimY + GLASS.h / 2, 0];
  return { show, flip, rimY, water, d, C, appear: pop(f, c.glass, 12) };
};

/** You: on deck → jump → dive to 10 m → back up → in the glass → in the ball/sub → out of the hatch. */
const youState = (f: number, sub: SubState, gl: ReturnType<typeof glassState>) => {
  const jump0 = c.breath + 10;
  const enter = jump0 + 16;
  if (f < jump0) return { show: true, p: [-2.95, D, 1.05] as V3, ry: 0.25, pitch: 0, clip: f < c.dropped + 6 ? "Idle_Loop" : f < c.breath ? "Idle_No_Loop" : "Idle_Loop", lib: f >= c.dropped + 6 && f < c.breath ? LIB2 : LIB1 };
  if (f < enter) {
    const k = ramp(f, jump0, enter, (x) => x);
    return { show: true, p: [-2.95 - 3.4 * k, D + 1.6 * Math.sin(k * Math.PI) - (D + 0.4) * k, 1.05 - 0.7 * Math.sqrt(k)] as V3, ry: -Math.PI / 2, pitch: 1.2 * k, clip: "Jump_Start", lib: LIB1 };
  }
  if (f < c.glass) {
    // swim down head first to the 10 m line, tread water, then shoot back up
    const down = keys(f, [[enter, -0.4], [c.ten + 14, -9.6]], easeOut);
    const up = f > c.outAir + 2 ? keys(f, [[c.outAir + 2, -9.6], [c.glass - 2, 0.3]], easeInOut) : down;
    const y = f > c.outAir + 2 ? up : down;
    const pitch = keys(f, [[c.ten + 4, 1.25], [c.ten + 14, 0.1], [c.outAir - 2, 0.1], [c.outAir + 8, -1.35]]);
    const clip = f < c.ten + 10 || f > c.outAir + 2 ? "Swim_Fwd_Loop" : "Swim_Idle_Loop";
    return { show: true, p: [-6.35, y, 0.35] as V3, ry: -Math.PI / 2, pitch, clip, lib: LIB1 };
  }
  if (f < c.ball) {
    // standing on the glass's platform (appears with the glass)
    return { show: f >= c.inside - 4, p: [X0 + 0.1, gl.rimY - 0.12, 0.05] as V3, ry: 0.35, pitch: 0, clip: f >= c.halfFull ? "Idle_No_Loop" : "Idle_Loop", lib: f >= c.halfFull ? LIB2 : LIB1 };
  }
  if (f >= c.built + 6) {
    // standing in the open hatch, cheering
    const hx = sub.p[0] + sub.dims.L * 0.12 - 0.15;
    return { show: true, p: [hx, sub.p[1] + sub.dims.R + 0.62 - 1.0 + 0.9 * ramp(f, c.built + 6, c.built + 16, easeOut), sub.p[2]] as V3, ry: 0.4, pitch: 0, clip: f >= c.callIt ? "Jump_Loop" : "Yes", lib: f >= c.callIt ? LIB1 : LIB2 };
  }
  // inside the vehicle: crammed in the ball, later at the controls (only visible in x-ray beats)
  const inBall = f < c.stretch + 14;
  const p: V3 = inBall ? add(sub.p, [-0.05, -0.62, 0]) : add(sub.p, [sub.dims.L / 2 - 0.6, -sub.dims.R * 0.55 + 0.02, 0]);
  return { show: sub.xray > 0.05, p, ry: Math.PI / 2, pitch: 0, clip: inBall ? "Sitting_Idle_Loop" : "Driving_Loop", lib: LIB1, scale: inBall ? 0.88 : 1 };
};

const friendState = (f: number) => {
  const finale = f >= c.congrats;
  const clip = finale ? (f >= LANDED + 4 ? "Dance_Loop" : "Yes") : f < c.dropped + 2 ? "Idle_Talking_Loop" : f < c.breath ? "Idle_No_Loop" : "Idle_Rail_Loop";
  const lib = clip === "Idle_No_Loop" || clip === "Idle_Rail_Loop" || clip === "Yes" ? LIB2 : LIB1;
  return { p: finale ? DANCE_FRIEND : ([-3.6, D, -0.8] as V3), ry: finale ? FRIEND_RY : f < c.breath ? 0.15 : -0.6, clip, lib };
};

// ───────────────────────── camera ─────────────────────────
const worldCam = (f: number, sub: SubState, plush: V3, you: V3, gl: ReturnType<typeof glassState>): Cam => {
  const k: [number, V3][] = [
    [0, [-2.6, 2.1, 9.6]],
    [c.dropped + 10, [-3.3, 1.7, 9.4]],
    [c.dropped + 22, [-4.6, 0.6, 18]],
    [c.breath, [-3.2, 1.5, 18]],
    [c.ten + 16, [-5.6, -9.0, 8.6]],
    [c.outAir, [-5.4, -9.0, 8.2]],
    [c.glass, [X0 + 2.4, 2.4, 16]],
    [c.inside, [X0 + 2.0, 1.8, 14]],
    [c.ball, [X0 + 2.6, 2.4, 14]],
    [c.lower, [X0 + 2.4, 1.8, 12]],
    [c.again, [X0 + 1.6, -54.0, 10]],
    [c.ends, [X0 + 0.5, -54.3, 7.2]],
    [c.cut, [X0 + 2.6, -56.5, 12]],
    [c.fits, [X0 + 1.6, -59.9, 9.6]],
    [c.stretch, [X0 - 3.5, -58.5, 15]],
    [c.domes, [X0 + 3.5, -58.6, 19]],
    [c.p300, [X0 + 4, -58, 21]],
    [c.breathe, [X0 + 1.6, -149.6, 7.2]],
    [c.scrub, [X0 - 1.2, -149.6, 7.4]],
    [c.oxygen, [X0 + 0.2, -150, 10.5]],
    [c.below, [X0 + 3, -186, 18]],
    [c.ping, [X0 + 64, -250, 470]],
    [c.listen + 30, [X0 + 64, -252, 450]],
    [c.arm, [PL[0] - 0.2, PL[1] + 2.2, 13]],
    [c.blowT, [PL[0] - 0.6, PL[1] + 2.4, 14]],
    [c.batt, [FINAL[0] + 2.6, -15.2, 13]],
    [c.reactor + 10, [FINAL[0] + 2.2, -15.2, 12]],
    [c.joke + 10, [-18, -19, 165]],
    [c.food, [-14, -19, 158]],
    [c.congrats, [-7.4, 2.8, 32]],
    [c.built + 16, [-7.0, 2.8, 31]],
    [LANDED, [-1.9, 2.4, 13.5]],
    [c.theSub + 34, [-1.6, 2.3, 12.5]],
    [c.theSub + 60, [0.1, 2.0, 6.8]],
    [c.end, [-0.1, 1.95, 6.0]],
  ];
  const l: [number, V3][] = [
    [0, [-3.25, 1.7, 0]],
    [c.dropped + 10, [-3.9, 1.1, 0]],
    [c.dropped + 22, [-5.6, -0.6, 0]],
    [c.breath, [-4.4, 0.2, 0]],
    [c.ten + 16, [-6.4, -9.4, 0]],
    [c.outAir, [-6.4, -9.4, 0]],
    [c.glass, [X0, 1.8, 0]],
    [c.inside, [X0, 1.2, 0]],
    [c.ball, [X0, 1.5, 0]],
    [c.lower, [X0, 1.0, 0]],
    [c.again, [X0, -54.6, 0]],
    [c.ends, [X0, -55.4, 0]],
    [c.cut, [X0, -57, 0]],
    [c.fits, [X0 + 1.3, -60.3, 0]],
    [c.stretch, [X0, -60, 0]],
    [c.domes, [X0, -60, 0]],
    [c.p300, [X0, -60, 0]],
    [c.breathe, [X0 + 1.3, -150.2, 0]],
    [c.scrub, [X0 - 1.6, -150.2, 0]],
    [c.oxygen, [X0, -150.2, 0]],
    [c.below, [X0, -186, 0]],
    [c.ping, [X0 + 64, -256, 0]],
    [c.listen + 30, [X0 + 64, -258, 0]],
    [c.arm, [PL[0] - 1.6, PL[1] + 1.3, 0]],
    [c.blowT, [PL[0] - 2.0, PL[1] + 1.8, 0]],
    [c.batt, [FINAL[0], -15.6, 0]],
    [c.reactor + 10, [FINAL[0], -15.6, 0]],
    [c.joke + 10, [-18, -27, -12]],
    [c.food, [-14, -27, -12]],
    [c.congrats, [-7.6, 0.9, 0]],
    [c.built + 16, [-7.2, 1.0, 0]],
    [LANDED, [-1.5, 1.45, 0]],
    [c.theSub + 34, [-1.3, 1.45, 0]],
    [c.theSub + 60, [-0.45, 1.45, 0.2]],
    [c.end, [-0.45, 1.5, 0.2]],
  ];
  let pos = keys3(f, k);
  let look = keys3(f, l);
  // ride along with a moving subject (blended in/out over `blend` frames)
  const ride = (a: number, b: number, target: V3, off: V3, lookOff: V3 = [0, 0, 0], blend = 8) => {
    if (f < a - blend || f > b + blend) return;
    const w = Math.min(ramp(f, a - blend, a), 1 - ramp(f, b, b + blend));
    const L = add(target, lookOff);
    const P = add(L, off);
    pos = pos.map((v, i) => v + (P[i] - v) * w) as V3;
    look = look.map((v, i) => v + (L[i] - v) * w) as V3;
  };
  ride(c.dropped + 24, c.breath - 6, plush, [0.9, 0.8, keys(f, [[c.dropped + 24, 9], [c.sank, 11], [c.sank + 44, 6.9]])], [0, 0.3, 0], 10);
  ride(c.breath + 22, c.ten + 10, you, [1.2, 0.8, 9.5], [0, 0, 0], 8);
  ride(c.outAir + 6, c.glass - 4, you, [1.2, 0.6, 10], [0, 0, 0], 6);
  ride(c.inside + 6, c.ball - 2, gl.C, [1.4, 0.6, keys(f, [[c.inside, 12], [c.halfFull, 8.4]])], [0, -0.3, 0], 8);
  ride(c.lower, c.y1934, sub.p, [2.2, 1.0, 11], [0, 0.2, 0], 8);
  ride(c.cut + 10, c.fits, sub.p, [2.8, 0.6, 12.5], [0, 0, 0], 10);
  ride(c.p300 + 6, c.kilo, sub.p, [4.5, 2.4, 23], [0, 0, 0], 8);
  if (f >= c.breathe - 1 && f < c.below + 6) {
    // inside the hull: camera keys relative to the (slowly sinking) sub
    const rp = keys3(f, [[c.breathe, [1.4, 1.6, 8.6]], [c.scrub, [-1.0, 1.6, 8.8]], [c.machine + 10, [-1.2, 1.5, 8.8]], [c.oxygen, [0.2, 1.4, 11.5]]]);
    const rl = keys3(f, [[c.breathe, [1.2, -0.1, 0]], [c.scrub, [-1.5, -0.1, 0]], [c.machine + 10, [-1.7, 0, 0]], [c.oxygen, [0, -0.1, 0]]]);
    const w = 1 - ramp(f, c.below, c.below + 6);
    pos = pos.map((v, i) => v + (sub.p[i] + rp[i] - v) * w) as V3;
    look = look.map((v, i) => v + (sub.p[i] + rl[i] - v) * w) as V3;
  }
  ride(c.below, c.ping - 6, sub.p, [3.2, 0.2, 17], [0, 0, 0], 6);
  ride(c.blowT + 4, c.batt - 1, sub.p, [3.0, 1.0, 15], [1.4, -1.0, 0], 8);
  return { pos, look, fov: f >= c.breathe && f < c.below ? 44 : 40 };
};

// ───────────────────────── 2D overlays ─────────────────────────
export const Tag: React.FC<{ x: number; y: number; text: string; o: number; color?: string; side?: "left" | "right"; size?: number }> = ({ x, y, text, o, color = "#ffd23f", side: want = "right", size = 38 }) => {
  // keep the pill inside the frame: flip to the other side of the point when it would run off
  const w = text.length * size * 0.62 + 110;
  const side = want === "right" && x + w > 1060 ? "left" : want === "left" && x - w < 20 ? "right" : want;
  return (
  <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `translate(${side === "right" ? "0" : "-100%"}, -50%) scale(${0.85 + 0.15 * o})`, transformOrigin: side === "right" ? "left center" : "right center", display: "flex", alignItems: "center", flexDirection: side === "right" ? "row" : "row-reverse", gap: 10 }}>
    <div style={{ width: 16, height: 16, borderRadius: 8, background: color, boxShadow: `0 0 12px ${color}` }} />
    <div style={{ width: 46, height: 4, background: color }} />
    <div style={{ padding: "8px 18px", borderRadius: 12, background: "#ffffff", border: `4px solid ${color}`, fontFamily: fonts.punch, fontWeight: 900, fontSize: size, color: "#111", whiteSpace: "nowrap", boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}>{text}</div>
  </div>
  );
};

/** Big outlined label (the reference reel's "120°F" style). */
export const Big: React.FC<{ x: number; y: number; text: string; o: number; color?: string; size?: number }> = ({ x, y, text, o, color = "#ffffff", size = 70 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * o})`, opacity: o, fontFamily: fonts.punch, fontWeight: 900, fontSize: size, color, WebkitTextStroke: `${Math.round(size / 7)}px #000`, paintOrder: "stroke fill", whiteSpace: "pre", textAlign: "center", lineHeight: 1.05 }}>{text}</div>
);

/** Depth pill at the top: number + the pressure it means (1 atm per 10 m). */
const DepthPill: React.FC<{ d: number; o: number; red?: boolean }> = ({ d, o, red }) => {
  const pr = 1 + d / 10;
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, padding: "14px 30px", borderRadius: 22, background: "rgba(6,14,28,0.78)", border: `3px solid ${red ? "#ff3b30" : "rgba(120,220,255,0.6)"}`, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
        <span style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 4, color: "#8fe3ff" }}>DEPTH</span>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{Math.round(d)} m</span>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: red ? "#ff6b5e" : "#ffd23f", fontVariantNumeric: "tabular-nums" }}>{pr < 10 ? pr.toFixed(1) : Math.round(pr)}× PRESSURE</span>
      </div>
    </div>
  );
};

const DangerWash: React.FC<{ o: number; f: number }> = ({ o, f }) =>
  o > 0.001 ? <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, rgba(255,40,30,0) 40%, rgba(255,30,20,0.55) 100%)", opacity: o * (0.65 + 0.35 * Math.sin(f / 5)) }} /> : null;

/** Simple air bar for the breath-hold dive. */
const AirBar: React.FC<{ x: number; y: number; v: number; o: number }> = ({ x, y, v, o }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: "translate(-50%,-50%)", display: "flex", alignItems: "center", gap: 14 }}>
    <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff", WebkitTextStroke: "6px #000", paintOrder: "stroke fill" }}>AIR</span>
    <div style={{ width: 300, height: 40, borderRadius: 20, background: "rgba(0,0,0,0.6)", border: "4px solid #fff", overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, v) * 100}%`, height: "100%", background: v < 0.3 ? "#ff3b30" : "#5dfc8d" }} />
    </div>
  </div>
);

// ───────────────────────── 3D bits only the world uses ─────────────────────────
/** Headlight cone that lights the seabed in front of the sub. */
const SubLight: React.FC<{ p: V3; on: number }> = ({ p, on }) => {
  const light = useMemo(() => {
    const l = new THREE.SpotLight("#fff2d6", 0, 40, 0.55, 0.6, 1.2);
    return l;
  }, []);
  light.intensity = 260 * on;
  light.position.set(...p);
  light.target.position.set(p[0] + 8, p[1] - 4, p[2]);
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
};

/** CO₂ puffs filling the cabin, then swallowed by the scrubber; blue O₂ dots from the generator. */
const AirDots: React.FC<{ f: number; sub: SubState }> = ({ f, sub }) => {
  const dots = useMemo(() => {
    const r = seeded(12);
    return Array.from({ length: 34 }, (_, i) => ({ born: i * 2.2, x: r(), y: r(), z: r(), w: r() * 6 }));
  }, []);
  const o2 = useMemo(() => {
    const r = seeded(19);
    return Array.from({ length: 16 }, (_, i) => ({ born: i * 4, x: r(), y: r(), z: r(), w: r() * 6 }));
  }, []);
  if (sub.xray < 0.05) return null;
  const { L, R } = sub.dims;
  const mouth = add(sub.p, [L / 2 - 0.45, -R * 0.55 + 1.15, 0]);
  const scrubber = add(sub.p, [-L / 2 + 0.2, -R * 0.55 + 0.62, -0.35]);
  const gen = add(sub.p, [-L / 2 + 0.25, -R * 0.55 + 1.2, 0.4]);
  return (
    <group>
      {dots.map((q, i) => {
        const t0 = c.breathe + 6 + q.born;
        if (f < t0) return null;
        const drift = ramp(f, t0, t0 + 40, easeOut);
        const spot: V3 = add(sub.p, [-L / 2 + 0.3 + q.x * (L + 0.4), -R * 0.2 + q.y * R * 0.9, (q.z - 0.5) * R * 1.1]);
        let p = lerp3(mouth, spot, drift);
        p[1] += Math.sin(f / 20 + q.w) * 0.04;
        // sucked into the scrubber one after another
        const sx = c.scrub + 14 + i * 1.4;
        const k = ramp(f, sx, sx + 16, easeInOut);
        p = lerp3(p, scrubber, k);
        const o = 1 - ramp(f, sx + 12, sx + 16);
        return o > 0.01 ? (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.07, 12, 8]} />
            <meshStandardMaterial color="#8a8f96" emissive="#3a3f46" emissiveIntensity={0.5} transparent opacity={0.9 * o} />
          </mesh>
        ) : null;
      })}
      {o2.map((q, i) => {
        const t0 = c.machine + 18 + q.born;
        if (f < t0) return null;
        const k = ramp(f, t0, t0 + 36, easeOut);
        const spot: V3 = add(sub.p, [-L / 2 + 0.6 + q.x * (L - 0.2), -R * 0.1 + q.y * R * 0.8, (q.z - 0.5) * R]);
        const p = lerp3(gen, spot, k);
        return <Glow key={`o${i}`} position={p} size={0.22} color="#4fb4ff" opacity={0.95 * k} />;
      })}
    </group>
  );
};

// ───────────────────────── the world ─────────────────────────
export const SetWorld: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const sub = subState(f);
  const gl = glassState(f);
  const pl = plushState(f, sub);
  const you = youState(f, sub, gl);
  const fr = friendState(f);
  const cam = worldCam(f, sub, pl.p, you.p, gl);
  const dark = ramp(f, c.noSun - 6, c.noSun + 16) * (f < c.batt ? 1 : 0);
  const rock = 0.03 * Math.sin(t * 1.1);
  // cable from the crane: to the glass base, then to the ball (until it is cut)
  const cableTop: V3 = [X0, CRANE_TIP[1] - 0.12, 0];
  const glassTop: V3 = [gl.C[0], gl.C[1] + GLASS.h / 2 + 0.06, 0];
  const ballTop: V3 = add(sub.p, [0, sub.dims.R + 0.16, 0]);
  const cutY = ballTop[1] + 3;
  const realX = -34 + (f - c.joke) * 0.22;
  const at = (p: V3) => project(p, cam, 1080, 1920);
  // HUD: depth of whatever the camera follows
  const subj = f < c.breath ? -pl.p[1] : f < c.glass ? -you.p[1] : f < c.ball ? gl.d : f >= c.ping && f < c.arm ? 222 : -sub.p[1];
  const depthO = (f >= c.dropped + 26 && f < c.breath - 2) || (f >= c.breath + 30 && f < c.glass) || (f >= c.inside + 20 && f < c.ball) || (f >= c.lower + 30 && f < c.y1934) || (f >= c.again && f < c.batt) ? 1 : 0;
  const danger = Math.max(f >= c.ears && f < c.outAir + 10 ? 0.7 : 0, f >= c.ends && f < c.cut ? 1 : 0, f >= c.n31 - 6 && f < c.kilo ? 0.8 : 0);
  const pressureO = f >= c.p300 + 6 && f < c.kilo ? fadeIn(f, c.p300 + 6) : 0;
  const realO = f >= c.joke - 4;
  // labels
  const pGlass = at(add(gl.C, [GLASS.r + 0.1, 0.3, 0]));
  const pBall = at(add(sub.p, [sub.dims.R + 0.2, 0.4, 0]));
  const pTank = at(add(sub.p, [sub.dims.half * 0.5 + 0.5, -sub.dims.R * 0.55, 1.2]));
  const pNose = at(add(sub.p, [sub.dims.half, 0, 0]));
  const pTail = at(add(sub.p, [-sub.dims.half, 0, 0]));
  const pScrub = at(add(sub.p, [-sub.dims.L / 2 + 0.2, -sub.dims.R * 0.55 + 1.1, -0.35]));
  const pGen = at(add(sub.p, [-sub.dims.L / 2 + 0.25, -sub.dims.R * 0.55 + 1.25, 0.4]));
  const pReact = at(add(sub.p, [0, sub.dims.R + 0.2, 0]));
  const pPlush = at(add(PL, [0, 1.4, 0]));
  const pSubFar = at(SP);
  const pReal = at([realX, -31, -34]);
  const pMine = at(add(sub.p, [sub.dims.half, 0.5, 0]));
  const pGhost = at(add(sub.p, [2.5, 1.7, 0]));
  const pEars = at(add(you.p, [0, 0.4, 0]));
  return (
    <AbsoluteFill>
      <OceanCanvas cam={cam} t={t} dark={dark} lines={f >= c.ping - 2 && f < c.listen + 40 ? 0 : 1}>
        <WorkBoat p={[0, 0, 0]} rock={rock} winch={f >= c.lower && f < c.y1934 ? -(f - c.lower) / 6 : 0} />
        <Model
          file="man_b.glb"
          anims={fr.lib}
          clip={fr.clip}
          t={t}
          p={fr.p}
          ry={fr.ry}
          outfit={FRIEND}
          tint={HAIR_FRIEND}
          attach={pl.worn ? { bone: "Head", node: <FursuitHead s={MASK_S} t={t} p={WORN_OFFSET} /> } : undefined}
        />
        {you.show ? (
          <group position={you.p} rotation={[0, 0, you.pitch]}>
            <Model file="man_a.glb" anims={you.lib} clip={you.clip} t={t} p={[0, you.clip.startsWith("Swim") ? -0.75 : 0, 0]} ry={you.ry} scale={(you as { scale?: number }).scale ?? 1} outfit={YOU} tint={HAIR_YOU} />
          </group>
        ) : null}
        {/* splashes */}
        <Splash p={[-6.1, 0, 0.3]} k={ramp(f, c.dropped + 21, c.dropped + 51)} size={1.2} />
        <Splash p={[-6.3, 0, 0.4]} k={ramp(f, c.breath + 25, c.breath + 55)} />
        <Splash p={[-6.35, 0, 0.35]} k={ramp(f, c.glass - 3, c.glass + 27)} size={0.7} />
        {/* the fursuit head (until it lands on your friend's head; then it rides on his head bone) */}
        {pl.worn ? null : (
          <group position={pl.p} rotation={[0, 0, pl.rz]}>
            <FursuitHead s={MASK_S} t={t} ry={pl.ry} limp={pl.tumble} />
          </group>
        )}
        <Bubbles p={add(pl.p, [0, 0.6, 0])} t={t} o={f > c.dropped + 22 && f < c.sank + 40 ? 1 : 0} n={10} rise={3} seed={4} />
        {/* puff of sand where it lands */}
        {f >= c.sank + 40 && f < c.sank + 80 ? <Glow position={add(PL, [0, 0.6, 0])} size={2 + 5 * ramp(f, c.sank + 40, c.sank + 80)} color="#d9c9a8" opacity={0.6 * (1 - ramp(f, c.sank + 40, c.sank + 80))} /> : null}
        {/* breath-hold: bubbles from your mouth, red at the ears */}
        <Bubbles p={add(you.p, [0.2, 0.2, 0])} t={t} o={f > c.breath + 26 && f < c.glass ? 0.8 : 0} n={8} rise={2.5} seed={6} />
        {f >= c.ears && f < c.outAir + 6 ? <Glow position={add(you.p, [0, 0.45, 0.25])} size={0.6 + 0.25 * Math.sin(f / 4)} color="#ff3b30" opacity={0.85} /> : null}
        {/* the giant glass on its cable */}
        {gl.show ? (
          <group>
            <Cable a={cableTop} b={glassTop} r={0.03} />
            <group position={gl.C} scale={[gl.appear, gl.appear, gl.appear]}>
              <group rotation={[0, 0, Math.PI * (1 - gl.flip)]}>
                <group position={[0, -GLASS.h / 2, 0]}>
                  <GiantGlass flip={1} water={gl.water}>
                    {/* weighted platform on three chains */}
                    {gl.flip > 0.99 ? (
                      <group position={[0, -0.12, 0]}>
                        <mesh position={[0, -0.05, 0]} castShadow>
                          <cylinderGeometry args={[0.9, 0.9, 0.1, 40]} />
                          <meshStandardMaterial color="#4b5560" metalness={0.7} roughness={0.4} />
                        </mesh>
                        {[0, 1, 2].map((i) => {
                          const a = (i / 3) * Math.PI * 2 + 0.5;
                          return <Cable key={i} a={[Math.cos(a) * 0.86, 0, Math.sin(a) * 0.86]} b={[Math.cos(a) * 1.0, 0.12, Math.sin(a) * 1.0]} r={0.015} color="#7a828a" />;
                        })}
                      </group>
                    ) : null}
                  </GiantGlass>
                </group>
              </group>
            </group>
            <Bubbles p={[X0 + 0.9, gl.rimY + 0.05, 0.4]} t={t} o={f > c.inside + 20 && f < c.halfFull ? 0.7 : 0} n={6} rise={2} seed={9} />
          </group>
        ) : null}
        {/* the vehicle */}
        {sub.show ? (
          <group>
            {f < c.cut ? <Cable a={cableTop} b={add(ballTop, [0, 3.2, 0])} r={0.035} /> : null}
            {f < c.cut ? <Cable a={add(ballTop, [0, 3.2, 0])} b={ballTop} r={0.035} strands={f >= c.again ? 6 : 0} frayed={ramp(f, c.ends + 6, c.ends + 40)} /> : null}
            {/* the cut: the top part flies up and away, the bottom piece drops */}
            {f >= c.cut + 6 && f < c.cut + 30 ? <Cable a={[X0 + ramp(f, c.cut + 6, c.cut + 30) * 1.5, cutY + 6 * ramp(f, c.cut + 6, c.cut + 30, easeOut), 0]} b={[X0 + 0.3 * ramp(f, c.cut + 6, c.cut + 30), cutY + 0.3 + 14 * ramp(f, c.cut + 6, c.cut + 30, easeOut), 0]} r={0.035} /> : null}
            {f >= c.cut && f < c.cut + 6 ? <Cable a={ballTop} b={[X0, cutY + 40, 0]} r={0.035} /> : null}
            {f >= c.cut && f < c.cut + 8 ? <Glow position={[X0, cutY, 0]} size={1.4 * (1 - ramp(f, c.cut, c.cut + 8))} color="#ffe28a" opacity={1} /> : null}
            <group position={sub.p} rotation={[0, sub.ry, sub.rz]}>
              <MiniSub stretch={sub.stretch} paint={sub.paint} xray={sub.xray} tanks={sub.tanks} fill={sub.fill} vent={sub.vent} blow={sub.blow} lights={sub.lights} arm={sub.arm} claw={sub.claw} reactor={sub.reactor} hatch={sub.hatch} t={sub.prop}>
                {sub.xray > 0.05 && f >= c.breathe ? <Cabin R={sub.dims.R} L={sub.dims.L} scrub={pop(f, c.scrub + 4, 12)} o2={pop(f, c.machine + 4, 12)} screens={1} batt={1} /> : null}
              </MiniSub>
              <PressureArrows len={sub.dims.L} r={sub.dims.R} o={pressureO} push={0.5 + 0.5 * Math.sin(f / 6)} />
            </group>
            <SubLight p={add(sub.p, [sub.dims.half - 0.2, -sub.dims.R * 0.55, 0])} on={sub.lights * (f >= c.noSun ? 1 : 0)} />
            <AirDots f={f} sub={sub} />
            {/* H₂ bubbles leaving the hull from the oxygen machine */}
            <Bubbles p={add(sub.p, [-sub.dims.L / 2 + 0.25, sub.dims.R, 0.4])} t={t} o={f > c.machine + 16 && f < c.below ? 0.8 : 0} n={10} rise={3} seed={14} />
          </group>
        ) : null}
        {/* the plush, too big for the ball (thought bubble) */}
        {f >= c.never - 6 && f < c.stretch + 6 ? (
          <group position={add(sub.p, [2.45, -1.0, 0.2])} scale={[fadeIn(f, c.never - 6), fadeIn(f, c.never - 6), fadeIn(f, c.never - 6)]}>
            <FursuitHead s={MASK_S} t={t} ry={-0.5} />
            <Glow position={[0, 0.4, -0.5]} size={2.2} color="#bfe0ff" opacity={0.45} />
          </group>
        ) : null}
        {/* sonar: ping from the sub, echo back from the plush */}
        {f >= c.ping - 4 && f < c.sound ? (
          <group>
            <PingRing c={SP} radius={155 * ramp(f, c.ping, c.ping + 26, (x) => x)} o={1 - ramp(f, c.ping + 22, c.ping + 30)} width={1.6} />
            <PingRing c={PL} radius={155 * ramp(f, c.ping + 26, c.listen + 30, (x) => x)} o={(f >= c.ping + 26 ? 1 : 0) * (1 - ramp(f, c.listen + 26, c.listen + 34))} color="#ffd23f" width={1.6} />
            <Glow position={SP} size={9} color="#fff1c8" opacity={0.9} />
            <Glow position={add(PL, [0, 0.8, 0])} size={7 + 5 * (f >= c.ping + 26 && f < c.ping + 36 ? 1 : 0)} color="#4a9cff" opacity={0.9} />
          </group>
        ) : null}
        {/* the real thing: a 100 m nuclear submarine gliding past behind ours */}
        {realO ? (
          <group position={[realX, -36, -34]}>
            <RealSub t={t} />
          </group>
        ) : null}
        <Jelly p={[X0 - 6, -205, -8]} t={t} />
        <Jelly p={[X0 + 9, -172, -14]} t={t + 2} s={1.3} color="#ffb3f0" />
        <Jelly p={[PL[0] - 9, PL[1] + 9, -10]} t={t + 4} s={0.9} />
      </OceanCanvas>

      <DangerWash o={danger} f={f} />
      {/* depth lines are labelled on the left edge */}
      {f < c.ping - 2 || f >= c.listen + 40
        ? DEPTHS.filter((d) => d < 300).map((d) => {
            const p = at([cam.look[0], -d, FRONT]);
            return p && p.y > 330 && p.y < 1800 ? (
              <div key={d} style={{ position: "absolute", left: 28, top: p.y - 46, fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, color: "#fff", opacity: 0.85, WebkitTextStroke: "6px rgba(0,0,0,0.6)", paintOrder: "stroke fill" }}>
                {d} m
              </div>
            ) : null;
          })
        : null}
      <DepthPill d={subj} o={depthO} red={danger > 0.5} />

      {/* breath-hold */}
      {f >= c.ten && f < c.glass - 6 ? <AirBar x={540} y={1460} v={1 - ramp(f, c.breath + 26, c.outAir)} o={fadeIn(f, c.ten)} /> : null}
      {pEars && f >= c.ears && f < c.outAir + 6 ? <Tag x={pEars.x + 50} y={pEars.y - 120} text="OUCH" color="#ff3b30" o={fadeIn(f, c.ears)} /> : null}
      {f >= c.ten + 6 && f < c.outAir + 10 ? <Big x={540} y={1300} text="2× PRESSURE" o={fadeIn(f, c.ten + 6)} color="#ff6b5e" size={84} /> : null}
      {/* diving bell */}
      {pGlass && f >= c.upside + 10 && f < c.squeezes ? <Tag x={pGlass.x + 20} y={pGlass.y - 120} text="DIVING BELL" color="#5dd8ff" o={fadeIn(f, c.upside + 10)} /> : null}
      {pGlass && f >= c.squeezes && f < c.ball ? <Tag x={pGlass.x + 20} y={pGlass.y - 120} text={`AIR ${gl.water > 0.45 ? "½" : Math.round((1 - gl.water) * 100) + "%"}`} color="#5dd8ff" o={fadeIn(f, c.squeezes)} /> : null}
      {f >= c.halfFull && f < c.ball ? <Big x={540} y={1380} text="HALF FULL!" o={fadeIn(f, c.halfFull)} color="#5dd8ff" size={90} /> : null}
      {/* ball, cable, tanks */}
      {pBall && f >= c.ball + 10 && f < c.y1934 ? <Tag x={pBall.x + 20} y={pBall.y} text="STEEL BALL" color="#c9d3dc" o={fadeIn(f, c.ball + 10)} /> : null}
      {f >= c.ends + 8 && f < c.cut ? <Big x={540} y={1360} text="NOT AGAIN…" o={fadeIn(f, c.ends + 8)} color="#ff6b5e" size={96} /> : null}
      {pTank && f >= c.addTanks + 8 && f < c.open ? <Tag x={pTank.x + 10} y={pTank.y + 60} text="BALLAST TANKS" color="#1fd1c1" o={fadeIn(f, c.addTanks + 8)} /> : null}
      {f >= c.rushes && f < c.blow ? <Big x={540} y={1420} text={"WATER IN\nHEAVIER ↓"} o={fadeIn(f, c.rushes)} color="#4f8bff" size={80} /> : null}
      {f >= c.pushed - 10 && f < c.fits ? <Big x={540} y={1420} text={"AIR IN\nLIGHTER ↑"} o={fadeIn(f, c.pushed - 10)} color="#ffffff" size={80} /> : null}
      {pGhost && f >= c.never && f < c.stretch + 4 ? <Tag x={pGhost.x} y={pGhost.y - 40} text="✗ NO ROOM" color="#ff3b30" o={fadeIn(f, c.never)} side="left" /> : null}
      {pNose && pTail && f >= c.domes && f < c.flat ? (
        <>
          <Tag x={pNose.x + 10} y={pNose.y - 150} text="ROUND" color="#ffd23f" o={fadeIn(f, c.domes)} side="left" />
          <Tag x={pTail.x - 10} y={pTail.y + 170} text="ROUND" color="#ffd23f" o={fadeIn(f, c.domes + 4)} />
        </>
      ) : null}
      {/* air */}
      {pScrub && f >= c.scrub + 10 && f < c.below ? <Tag x={pScrub.x - 20} y={Math.min(pScrub.y - 160, 420)} text="CO₂ SCRUBBER" color="#ff8a1f" side="left" o={fadeIn(f, c.scrub + 10)} size={34} /> : null}
      {pGen && f >= c.machine + 10 && f < c.below ? <Tag x={pGen.x + 20} y={Math.min(pGen.y - 260, 520)} text="O₂ FROM WATER" color="#4fb4ff" o={fadeIn(f, c.machine + 10)} size={34} /> : null}
      {f >= c.breathe + 8 && f < c.below ? <CO2Meter v={ramp(f, c.breathe + 8, c.scrub + 6) * (1 - 0.8 * ramp(f, c.scrub + 20, c.oxygen + 10))} o={fadeIn(f, c.breathe + 8)} /> : null}
      {/* darkness + sonar */}
      {f >= c.noSun && f < c.ping - 2 ? <Big x={540} y={1400} text="NO SUNLIGHT" o={fadeIn(f, c.noSun)} color="#8fe3ff" size={90} /> : null}
      {pSubFar && f >= c.ping && f < c.sound ? <Tag x={pSubFar.x - 20} y={pSubFar.y - 50} text="YOU" color="#fff1c8" side="left" o={fadeIn(f, c.ping)} /> : null}
      {pPlush && f >= c.ping + 20 && f < c.sound ? <Tag x={pPlush.x + 20} y={pPlush.y + 30} text="POCKET PUH" color="#4a9cff" side="left" o={fadeIn(f, c.ping + 20)} /> : null}
      {f >= c.ping + 4 && f < c.sound ? <Big x={540} y={480} text={f < c.listen + 4 ? "PING" : "…ECHO"} o={fadeIn(f, f < c.listen + 4 ? c.ping + 4 : c.listen + 4)} color={f < c.listen + 4 ? "#5dfcff" : "#ffd23f"} size={110} /> : null}
      {/* battery, reactor, the real thing */}
      {f >= c.empty - 4 && f < c.reactor + 10 ? <Battery o={fadeIn(f, c.empty - 4)} /> : null}
      {pReact && f >= c.reactor + 12 && f < c.joke + 8 ? <Tag x={pReact.x + 20} y={pReact.y - 140} text="☢ NUCLEAR REACTOR" color="#3dff7a" o={fadeIn(f, c.reactor + 12)} /> : null}
      {pReal && f >= c.joke + 16 && f < c.congrats ? <Tag x={pReal.x} y={pReal.y + 150} text="REAL ONE · 100 m" color="#ffd23f" o={fadeIn(f, c.joke + 16)} /> : null}
      {pMine && f >= c.joke + 22 && f < c.congrats ? <Tag x={pMine.x + 30} y={pMine.y - 40} text="YOURS · 8 m" color="#ffffff" o={fadeIn(f, c.joke + 22)} size={32} /> : null}
      {f >= c.real && f < c.congrats ? <Big x={540} y={1440} text={"ONLY LIMIT:\nTHE FOOD 🥫"} o={fadeIn(f, c.real + 4)} color="#ffd23f" size={74} /> : null}
      {f >= c.theSub && f < c.theSub + 50 ? <Big x={540} y={560} text="THE SUBMARINE" o={fadeIn(f, c.theSub) * (1 - ramp(f, c.theSub + 38, c.theSub + 50))} size={104} color="#ffd23f" /> : null}
      {f >= c.theSub + 62 ? <Big x={540} y={430} text={"REUNITED ♥"} o={fadeIn(f, c.theSub + 62)} size={92} color="#ff7ab8" /> : null}
    </AbsoluteFill>
  );
};

const CO2Meter: React.FC<{ v: number; o: number }> = ({ v, o }) => (
  <div style={{ position: "absolute", left: 540, top: 1470, transform: "translate(-50%,-50%)", opacity: o, display: "flex", alignItems: "center", gap: 16 }}>
    <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 46, color: "#fff", WebkitTextStroke: "7px #000", paintOrder: "stroke fill" }}>CO₂</span>
    <div style={{ width: 340, height: 44, borderRadius: 22, background: "rgba(0,0,0,0.6)", border: "4px solid #fff", overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0.04, v) * 100}%`, height: "100%", background: v > 0.6 ? "#ff3b30" : v > 0.35 ? "#ffb020" : "#5dfc8d" }} />
    </div>
  </div>
);

const Battery: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ position: "absolute", left: 540, top: 1420, transform: `translate(-50%,-50%) scale(${0.8 + 0.2 * o})`, opacity: o, display: "flex", alignItems: "center" }}>
    <div style={{ width: 300, height: 140, borderRadius: 22, border: "12px solid #ff3b30", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", padding: 10, boxSizing: "border-box" }}>
      <div style={{ width: 30, height: "100%", borderRadius: 8, background: "#ff3b30" }} />
    </div>
    <div style={{ width: 22, height: 60, borderRadius: "0 8px 8px 0", background: "#ff3b30" }} />
    <div style={{ position: "absolute", width: "100%", textAlign: "center", top: 160, fontFamily: fonts.punch, fontWeight: 900, fontSize: 56, color: "#ff3b30", WebkitTextStroke: "8px #000", paintOrder: "stroke fill" }}>0%</div>
  </div>
);
