import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, project, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { Capsule, ISS, LaunchPad, Plasma, Rocket, rkY } from "../../lib/three/Space";
import { WB, WorkBoat } from "../../lib/three/WorkBoat";
import { fonts } from "../../lib/theme";
import { easeInOut, easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { c } from "./cues";
import { BowlingBall, Columbiad, FishbowlHelmet, Ladder, Sandwich, Shell, Skateboard } from "./props";
import { FarEarth, R_EARTH, SkyCanvas, SpaceCanvas, SUN } from "./world";
import { CloudField, Spaceport } from "./spaceport";
import { PlaneModel } from "../../lib/three/PlaneModel";

export type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 10) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const YOU: Outfit = { top: "#e8573a", pants: "#2c3440", shoes: "#f2f2f2" };
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" };
const HAIR_YOU = { Hair: "#3b2a1e" };
const HAIR_FRIEND = { Hair: "#1a1a1a" };
const D = WB.deck;
const MASK_S = 0.5;
const PAD: V3 = [60, 0, -30]; // launch pad on the sea next to the boat
const PAD_TOP = 3.12;
const ROCKET_BASE: V3 = [PAD[0], PAD_TOP + 0.1, PAD[2]];
const EARTH_C: V3 = [0, -(R_EARTH + 400000), 0]; // the ISS is at the origin of the orbit sets

// ───────────────────────── overlays ─────────────────────────
export const Tag: React.FC<{ x: number; y: number; text: string; o: number; color?: string; side?: "left" | "right"; size?: number }> = ({ x, y, text, o, color = "#ffd23f", side: want = "right", size = 38 }) => {
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

export const Big: React.FC<{ x: number; y: number; text: string; o: number; color?: string; size?: number }> = ({ x, y, text, o, color = "#ffffff", size = 70 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * o})`, opacity: o, fontFamily: fonts.punch, fontWeight: 900, fontSize: size, color, WebkitTextStroke: `${Math.round(size / 7)}px #000`, paintOrder: "stroke fill", whiteSpace: "pre", textAlign: "center", lineHeight: 1.05 }}>{text}</div>
);

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
/** Altitude + speed pill, always metric and imperial. */
const FlightPill: React.FC<{ km: number; kmh?: number; o: number }> = ({ km, kmh, o }) =>
  o > 0.01 ? (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "12px 30px", borderRadius: 22, background: "rgba(6,10,22,0.8)", border: "3px solid rgba(140,200,255,0.6)", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontFamily: fonts.hud, fontSize: 28, letterSpacing: 4, color: "#8fd0ff" }}>ALTITUDE</span>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 56, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{km < 10 ? km.toFixed(1) : fmt(km)} km</span>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#ffd23f", fontVariantNumeric: "tabular-nums" }}>· {km * 0.6214 < 10 ? (km * 0.6214).toFixed(1) : fmt(km * 0.6214)} mi</span>
        </div>
        {kmh !== undefined ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontFamily: fonts.hud, fontSize: 28, letterSpacing: 4, color: "#8fd0ff" }}>SPEED</span>
            <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{fmt(kmh)} km/h</span>
            <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 32, color: "#ffd23f", fontVariantNumeric: "tabular-nums" }}>· {fmt(kmh * 0.6214)} mph</span>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

const DangerWash: React.FC<{ o: number; f: number }> = ({ o, f }) =>
  o > 0.001 ? <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, rgba(255,40,30,0) 40%, rgba(255,30,20,0.55) 100%)", opacity: o * (0.65 + 0.35 * Math.sin(f / 5)) }} /> : null;

// ───────────────────────── SEA: the boat, the pad, the cannon, the skateboard, launch and splashdown ─────────────────────────
const FRIEND_P: V3 = [-0.42, D, 0.2];
const FRIEND_RY = -0.75;
const ON_HEAD: V3 = [FRIEND_P[0] + 0.03 * Math.sin(FRIEND_RY), D + 1.38, FRIEND_P[2] + 0.03 * Math.cos(FRIEND_RY)];
const CAP_SEA: V3 = [-11.5, -0.9, 2.4]; // floating capsule after splashdown
const LANDED = c.built + 40;

/** Rocket altitude above the pad during the launch (metres). */
const launchY = (f: number) => (f < c.launch + 8 ? 0 : 0.5 * 9 * ((f - c.launch - 8) / 30) ** 2 * 6);

export const SetSea: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const rock = 0.03 * Math.sin(t * 1.1);
  // ── which beat
  const ladderOn = f < c.cannon;
  const cannonOn = f >= c.cannon && f < c.skate;
  const skateOn = f >= c.skate && f < c.rocket;
  const rocketOn = f >= c.rocket && f < c.chutes;
  const finale = f >= c.chutes;
  // ── ladder shooting up from the stern deck
  const ladderH = f < c.ladder ? 0 : 400 * Math.pow(ramp(f, c.ladder + 2, c.ladder + 22, (x) => x), 2);
  // ── cannon
  const boom = c.kick + 6;
  const flash = f >= boom ? 1 - ramp(f, boom, boom + 18) : 0;
  const shellIn = ramp(f, c.verne, c.kick - 4, easeInOut);
  // ── skateboard: rolls forward a little with every throw
  const throws = f >= c.throwBack ? Math.min(8, Math.floor((f - c.throwBack) / 13) + 1) : 0;
  const lastThrow = c.throwBack + (throws - 1) * 13;
  const skateX = PAD[0] - 9 + throws * 1.4 + (throws > 0 ? 1.4 * ramp(f, lastThrow, lastThrow + 10, easeOut) - 1.4 : 0);
  const SKZ = PAD[2] + 6.2;
  // ── rocket
  const rocketPop = pop(f, c.rocket, 14);
  const xray = rocketOn ? Math.max(ramp(f, c.soMany, c.soMany + 10) * (1 - ramp(f, c.bombs, c.bombs + 8)), ramp(f, c.stages, c.stages + 8) * (1 - ramp(f, c.launch - 10, c.launch))) : 0;
  const fuel = ramp(f, c.fuel - 6, c.fuel + 24);
  const explode = f >= c.stages && f < c.launch ? ramp(f, c.stages + 4, c.stages + 20, easeInOut) * (1 - ramp(f, c.launch - 12, c.launch - 2)) : 0;
  const empty1 = f >= c.drop && f < c.launch ? ramp(f, c.drop, c.drop + 14) : 0;
  const bomb = f >= c.bombs + 12 && f < c.bombs + 40 ? ramp(f, c.bombs + 12, c.bombs + 38, (x) => x * x) : -1;
  const ignite = f >= c.launch ? ramp(f, c.launch, c.launch + 8) : 0;
  const ry = launchY(f);
  // ── splashdown + finale
  const chuteK = ramp(f, c.chutes, c.chutes + 14, easeOut);
  const capY = keys(f, [[c.chutes, 120], [c.splash + 8, CAP_SEA[1]]], (x) => x);
  const splash = f >= c.splash + 8 ? ramp(f, c.splash + 8, c.splash + 40) : 0;
  const capP: V3 = [CAP_SEA[0], f < c.splash + 8 ? capY : CAP_SEA[1] + 0.12 * Math.sin(t * 1.4), CAP_SEA[2]];
  // mask: in your hands on the capsule → tossed onto your friend's head → worn
  const maskTop: V3 = add(capP, [0.6, 4.6, 0.5]);
  const tossK = ramp(f, c.built + 10, LANDED, easeInOut);
  const maskP = lerp3(maskTop, ON_HEAD, tossK);
  maskP[1] += Math.sin(tossK * Math.PI) * 2.6;
  const worn = f >= LANDED;
  // ── people
  const friendClip = finale ? (f >= LANDED + 4 ? "Dance_Loop" : "Yes") : f >= c.launch ? "Idle_FoldArms_Loop" : "Idle_Talking_Loop";
  const friendLib = friendClip === "Yes" || friendClip === "Idle_FoldArms_Loop" ? LIB2 : LIB1;
  const youOnDeck = f < c.ladder + 4;
  const youClimb = f >= c.ladder + 4 && f < c.cannon;
  // ── camera, one take per beat
  const cam: Cam = useMemo(() => {
    const k: [number, V3][] = [
      [c.space - 2, [-6, 2.2, 15]],
      [c.hour, [-5, 1.6, 12]],
      [c.ladder, [-5.5, 1.4, 11]],
      [c.ladder + 18, [-4, 1.0, 8]],
      [c.cannon - 1, [PAD[0] + 30, 12, PAD[2] + 50]],
      [c.kick, [PAD[0] + 27, 11, PAD[2] + 45]],
      [c.pancake - 2, [PAD[0] + 11.4, 5.0, PAD[2] + 9.0]],
      [c.pancake + 30, [PAD[0] + 11.0, 4.7, PAD[2] + 8.6]],
      [c.skate - 1, [PAD[0] - 6.5, 5.0, PAD[2] + 13.5]],
      [c.rocket - 6, [PAD[0] - 1.5, 4.8, PAD[2] + 13.5]],
      [c.rocket + 6, [PAD[0] + 32, 26, PAD[2] + 74]],
      [c.soMany, [PAD[0] + 30, 26, PAD[2] + 70]],
      [c.fuel + 20, [PAD[0] + 26, 27, PAD[2] + 64]],
      [c.bombs, [PAD[0] + 24, 14, PAD[2] + 46]],
      [c.y1958, [PAD[0] + 22, 13, PAD[2] + 42]],
      [c.stages, [PAD[0] + 36, 30, PAD[2] + 88]],
      [c.launch - 4, [PAD[0] + 36, 30, PAD[2] + 90]],
      [c.launch, [-6, 3.4, 14]],
      [c.tip, [-6, 3.6, 13]],
      [c.chutes, [CAP_SEA[0] + 18, 70, CAP_SEA[2] + 60]],
      [c.splash, [CAP_SEA[0] + 12, 6, CAP_SEA[2] + 34]],
      [c.congrats, [-6.8, 3.0, 30]],
      [c.built + 8, [-6.4, 3.0, 29]],
      [LANDED, [-1.8, 2.4, 13.5]],
      [c.theRocket + 30, [-1.4, 2.2, 11.5]],
      [c.theRocket + 56, [0.1, 2.0, 6.8]],
      [c.end, [-0.1, 1.95, 6.0]],
    ];
    const l: [number, V3][] = [
      [c.space - 2, [-3, 3.5, 0]],
      [c.hour, [-3, 4.5, 0]],
      [c.ladder, [-2.6, 4, 0]],
      [c.ladder + 18, [-2.6, 8, 0.6]],
      [c.cannon - 1, [PAD[0], 16, PAD[2]]],
      [c.kick, [PAD[0], 18, PAD[2]]],
      [c.pancake - 2, [PAD[0] + 9, PAD_TOP + 0.2, PAD[2] + 6]],
      [c.pancake + 30, [PAD[0] + 9, PAD_TOP + 0.1, PAD[2] + 6]],
      [c.skate - 1, [PAD[0] - 7.5, PAD_TOP + 0.9, PAD[2] + 6.2]],
      [c.rocket - 6, [PAD[0] - 2.5, PAD_TOP + 0.9, PAD[2] + 6.2]],
      [c.rocket + 6, [PAD[0], 24, PAD[2]]],
      [c.soMany, [PAD[0], 24, PAD[2]]],
      [c.fuel + 20, [PAD[0], 24, PAD[2]]],
      [c.bombs, [PAD[0], 12, PAD[2]]],
      [c.y1958, [PAD[0], 10, PAD[2]]],
      [c.stages, [PAD[0], 28, PAD[2]]],
      [c.launch - 4, [PAD[0], 28, PAD[2]]],
      [c.launch, [PAD[0], 22, PAD[2]]],
      [c.tip, [PAD[0], 60, PAD[2]]],
      [c.chutes, [CAP_SEA[0], 60, CAP_SEA[2]]],
      [c.splash, [CAP_SEA[0], 3, CAP_SEA[2]]],
      [c.congrats, [-7.2, 1.0, 0]],
      [c.built + 8, [-6.8, 1.0, 0]],
      [LANDED, [-1.5, 1.45, 0]],
      [c.theRocket + 30, [-1.3, 1.45, 0]],
      [c.theRocket + 56, [-0.45, 1.45, 0.2]],
      [c.end, [-0.45, 1.5, 0.2]],
    ];
    let pos = keys3(f, k);
    let look = keys3(f, l);
    // shake on the cannon boom (≤ 3 swings) and on ignition
    const shake = (a: number, amp: number) => (f >= a && f < a + 14 ? amp * Math.sin(((f - a) / 14) * Math.PI * 3) * (1 - (f - a) / 14) : 0);
    const s = shake(boom, 0.6) + shake(c.launch + 2, 0.25);
    pos = [pos[0] + s, pos[1] + s * 0.5, pos[2]];
    // ride along with the skateboard (side view, the tower stays behind)
    if (f >= c.skate - 1 && f < c.rocket - 4) {
      const w = Math.min(ramp(f, c.skate - 1, c.skate + 8), 1 - ramp(f, c.rocket - 14, c.rocket - 4));
      const P: V3 = [skateX + 1.2, PAD_TOP + 1.9, SKZ + 6.8];
      const L: V3 = [skateX + 0.4, PAD_TOP + 0.9, SKZ];
      pos = pos.map((v, i) => v + (P[i] - v) * w) as V3;
      look = look.map((v, i) => v + (L[i] - v) * w) as V3;
    }
    // follow the rocket as it climbs
    if (f >= c.launch + 20 && f < c.chutes) look = [look[0], Math.max(look[1], ROCKET_BASE[1] + ry + 25), look[2]];
    // follow the capsule down under its chutes
    if (f >= c.chutes && f < c.splash) look = [look[0], capY + 8, look[2]];
    return { pos, look, fov: 40 };
  }, [f]); // eslint-disable-line react-hooks/exhaustive-deps
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pRocket = at([ROCKET_BASE[0] + 2.5, ROCKET_BASE[1] + rkY.top - 1, ROCKET_BASE[2]]);
  const pFuel = at([ROCKET_BASE[0] + 2.2, ROCKET_BASE[1] + 14, ROCKET_BASE[2]]);
  const pS1 = at([ROCKET_BASE[0] + 2.2, ROCKET_BASE[1] + 12 - explode * 8, ROCKET_BASE[2]]);
  const pS2 = at([ROCKET_BASE[0] + 2.2, ROCKET_BASE[1] + rkY.s2 + 5, ROCKET_BASE[2]]);
  const pCap = at([ROCKET_BASE[0] + 2.0, ROCKET_BASE[1] + rkY.cap + 2 + explode * 8, ROCKET_BASE[2]]);
  const pCannon = at([PAD[0] + 3, PAD_TOP + 30, PAD[2]]);
  const danger = Math.max(f >= c.kick && f < c.skate - 10 ? 0.9 * (1 - ramp(f, c.pancake + 20, c.skate - 10)) : 0, f >= c.bombs + 30 && f < c.joke ? 1 : 0);
  const kmNow = finale ? Math.max(0, capY / 1000) : 0;
  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} t={t} km={kmNow}>
        <Spaceport pad={PAD} />
        <CloudField center={[0, 0, 0]} y0={900} y1={1700} spread={8000} n={46} size={[600, 1500]} seed={9} />
        <WorkBoat p={[0, 0, 0]} rock={rock} />
        <Model
          file="man_b.glb"
          anims={friendLib}
          clip={friendClip}
          t={t}
          p={finale || f >= c.launch ? FRIEND_P : [-2.6, D, -0.3]}
          ry={finale || f >= c.launch ? FRIEND_RY : 0.2}
          outfit={FRIEND}
          tint={HAIR_FRIEND}
          attach={worn ? { bone: "Head", node: <FursuitHead s={MASK_S} t={t} p={[0, -0.2, 0.03]} /> } : undefined}
        />
        {youOnDeck ? <Model file="man_a.glb" anims={LIB1} clip="Idle_Talking_Loop" t={t} p={[-1.7, D, 0.6]} ry={-0.3} outfit={YOU} tint={HAIR_YOU} /> : null}
        {/* the ladder from the stern deck, and you climbing it */}
        {ladderOn && ladderH > 0 ? (
          <group position={[-3.4, D, 0.9]}>
            <Ladder h={ladderH} around={4} window={30} />
          </group>
        ) : null}
        {youClimb ? <Model file="man_a.glb" anims={LIB2} clip="ClimbUp_1m_RM" inPlace t={(t * 0.9) % 0.667} p={[-3.4, D + 1.0 + 2 * ramp(f, c.ladder + 4, c.ladder + 20), 1.32]} ry={Math.PI} outfit={YOU} tint={HAIR_YOU} /> : null}
        {/* the launch pad (tower + pier) */}
        <group position={PAD}>
          <LaunchPad arm={rocketOn && f < c.launch ? 1 : 1 - ramp(f, c.launch - 6, c.launch)} />
        </group>
        {/* Jules Verne's cannon + shell + you as a pancake */}
        {cannonOn ? (
          <group>
            <group position={[PAD[0], PAD_TOP + 0.7, PAD[2]]} scale={[0.85, 0.85, 0.85]}>
              <Columbiad recoil={f >= boom ? Math.exp(-(f - boom) / 6) : 0} flash={flash} />
            </group>
            {f < boom ? (
              <group position={[PAD[0], PAD_TOP + 0.7 + 0.85 * (34 + 2 - 30 * shellIn), PAD[2]]} scale={[0.85, 0.85, 0.85]}>
                <Shell />
              </group>
            ) : null}
            {f >= c.pancake - 4 ? (
              <group>
                <group position={[PAD[0] + 9, PAD_TOP + 0.05, PAD[2] + 6]} rotation={[-Math.PI / 2, 0, 0.5]} scale={[1.35, 1.35, 0.1]}>
                  <Model file="man_a.glb" anims={LIB1} clip="Idle_Loop" t={0.2} outfit={YOU} tint={HAIR_YOU} />
                </group>
                {/* little stars circling the flattened head */}
                {[0, 1, 2].map((i) => {
                  const a = t * 3 + (i * Math.PI * 2) / 3;
                  return <Glow key={i} position={[PAD[0] + 9 + Math.cos(a) * 0.4 - 0.6, PAD_TOP + 0.4, PAD[2] + 6 + Math.sin(a) * 0.4 - 0.9]} size={0.25} color="#ffe28a" opacity={0.9} />;
                })}
              </group>
            ) : null}
          </group>
        ) : null}
        {/* you on a skateboard, throwing bowling balls backwards */}
        {skateOn ? (
          <group>
            <group position={[skateX, PAD_TOP, SKZ]}>
              <Skateboard spin={skateX * 3} />
              <Model file="man_a.glb" anims={LIB2} clip="OverhandThrow" t={throws > 0 ? 0.25 + Math.min(0.55, ((f - lastThrow) / 30) * 1.4) : 0.1} p={[0, 0.15, 0]} ry={-Math.PI / 2} outfit={YOU} tint={HAIR_YOU} />
            </group>
            {Array.from({ length: throws }, (_, i) => {
              const t0 = c.throwBack + i * 13 + 6;
              const k = Math.max(0, (f - t0) / 30);
              const x0 = PAD[0] - 9 + (i + 1) * 1.4 - 0.4;
              return k > 0 ? <BowlingBall key={i} p={[x0 - 9 * k, PAD_TOP + Math.max(0.11, 1.5 + 2 * k - 4.9 * k * k), SKZ]} rot={-k * 9} color={["#3a1f8f", "#c0392b", "#1f7a3a"][i % 3]} /> : null;
            })}
          </group>
        ) : null}
        {/* the rocket on the pad → launch */}
        {rocketOn && rocketPop > 0.02 ? (
          <group position={add(ROCKET_BASE, [0, ry, 0])} scale={[rocketPop, rocketPop, rocketPop]}>
            {explode > 0.001 ? (
              <group>
                <group position={[0, -explode * 8, 0]}>
                  <Rocket t={t} xray={xray} fuel1={fuel * (1 - empty1)} showS2={false} showCap={false} name="POCKET PUH 1" />
                </group>
                <Rocket t={t} xray={xray} fuel2={fuel} showS1={false} showCap={false} />
                <group position={[0, explode * 8, 0]}>
                  <Rocket t={t} xray={xray} showS1={false} showS2={false} />
                </group>
              </group>
            ) : (
              <Rocket t={t} xray={xray} fuel1={fuel} fuel2={fuel} flame1={ignite} />
            )}
            {/* the "joke": a bomb dropping out of the nozzle */}
            {bomb >= 0 ? (
              // plops out of the engine skirt towards the camera and rolls onto the deck
              <group position={[3.2 * bomb, 0.9 + 1.6 * Math.sin(bomb * Math.PI) - 0.25 * bomb, 3.2 * bomb]} rotation={[bomb * 4, 0, bomb * 2]}>
                <mesh>
                  <sphereGeometry args={[1.0, 28, 18]} />
                  <meshStandardMaterial color="#2a2d33" metalness={0.6} roughness={0.35} />
                </mesh>
                {/* yellow ☢ disc facing the camera */}
                <group rotation={[-bomb * 4, 0, -bomb * 2]}>
                  <mesh position={[0.35, 0.2, 0.95]} rotation={[0, 0.35, 0]}>
                    <circleGeometry args={[0.5, 24]} />
                    <meshBasicMaterial color="#ffd400" />
                  </mesh>
                  <mesh position={[0.36, 0.2, 0.96]} rotation={[0, 0.35, 0]}>
                    <circleGeometry args={[0.12, 16]} />
                    <meshBasicMaterial color="#111" />
                  </mesh>
                </group>
              </group>
            ) : null}
            {f >= c.bombs + 38 && f < c.joke + 4 ? <Glow position={[3.2, 0.8, 3.2]} size={60 * ramp(f, c.bombs + 38, c.bombs + 46)} color="#fff1c8" opacity={0.95} /> : null}
          </group>
        ) : null}
        {/* launch smoke */}
        {f >= c.launch && f < c.chutes
          ? Array.from({ length: 22 }, (_, i) => {
              const r = seeded(i + 40);
              const born = c.launch + i * 1.5;
              if (f < born) return null;
              const k = Math.min(1, (f - born) / 60);
              const a = r() * Math.PI * 2;
              return <Glow key={i} position={[PAD[0] + Math.cos(a) * (4 + 18 * k), PAD_TOP + 2 + 6 * k * r(), PAD[2] + Math.sin(a) * (4 + 18 * k)]} size={10 + 18 * k} color="#e8e6e2" opacity={0.75 * (1 - k * 0.6)} />;
            })
          : null}
        {/* splashdown */}
        {finale ? (
          <group>
            <group position={capP} rotation={[f < c.splash + 8 ? 0.15 * Math.sin(t * 1.3) : 0.05 * Math.sin(t), 0, 0.08]}>
              <Capsule t={t} chutes={f < c.splash + 30 ? chuteK * (1 - ramp(f, c.splash + 12, c.splash + 30)) : 0} />
            </group>
            {splash > 0 && splash < 1
              ? Array.from({ length: 24 }, (_, i) => {
                  const r = seeded(i + 7);
                  const a = r() * Math.PI * 2;
                  const v = 3 + r() * 5;
                  const y = v * splash * 1.2 - 6 * splash * splash;
                  return y > 0 ? <Glow key={i} position={[capP[0] + Math.cos(a) * v * splash, y, capP[2] + Math.sin(a) * v * splash]} size={0.6 + r()} color="#ffffff" opacity={0.9 * (1 - splash)} /> : null;
                })
              : null}
            {/* you on top of the capsule, cheering, then the toss */}
            {f >= c.congrats - 6 ? <Model file="man_a.glb" anims={LIB2} clip="Yes" t={t} p={add(capP, [0, 4.0, 0])} ry={0.4} outfit={YOU} tint={HAIR_YOU} attach={{ bone: "Head", node: <FishbowlHelmet /> }} /> : null}
            {!worn && f >= c.congrats - 6 ? (
              <group position={maskP} rotation={[0, 0, tossK * Math.PI * 2]}>
                <FursuitHead s={MASK_S} t={t} ry={0.4 + (FRIEND_RY - 0.4) * tossK} />
              </group>
            ) : null}
          </group>
        ) : null}
      </SkyCanvas>
      <DangerWash o={danger} f={f} />
      {/* labels */}
      {f >= c.space && f < c.ladder + 10 ? (
        <>
          <div style={{ position: "absolute", top: 300, left: 60, right: 60, borderTop: "6px dashed #ffffff", opacity: fadeIn(f, c.space) * 0.9 }} />
          <Big x={540} y={380} text="SPACE ↑ 100 km · 62 mi" o={fadeIn(f, c.space)} size={66} />
        </>
      ) : null}
      {f >= c.hour && f < c.ladder + 10 ? <Big x={540} y={1460} text={"1 HOUR AT\n100 km/h · 62 mph"} o={fadeIn(f, c.hour)} size={66} color="#ffd23f" /> : null}
      {pCannon && f >= c.verne && f < c.kick ? <Tag x={pCannon.x} y={pCannon.y} text="JULES VERNE · 1865" o={fadeIn(f, c.verne)} side="left" /> : null}
      {f >= c.g - 4 && f < c.pancake + 4 ? <GMeter f={f} /> : null}
      {f >= c.pancake + 2 && f < c.skate ? <Big x={540} y={1420} text="PANCAKE" o={fadeIn(f, c.pancake + 2)} size={110} color="#ffb547" /> : null}
      {f >= c.every && f < c.rocket ? (
        <>
          <Big x={250} y={520} text="← BALL" o={fadeIn(f, c.every)} size={64} color="#c9a7ff" />
          <Big x={830} y={520} text="YOU →" o={fadeIn(f, c.every + 4)} size={64} color="#ffd23f" />
        </>
      ) : null}
      {pRocket && f >= c.rocket + 8 && f < c.soMany ? <Tag x={pRocket.x} y={pRocket.y} text="ROCKET" o={fadeIn(f, c.rocket + 8)} /> : null}
      {pFuel && f >= c.fuel && f < c.bombs ? <Tag x={pFuel.x} y={pFuel.y} text="90% FUEL" color="#ff9a2e" o={fadeIn(f, c.fuel)} /> : null}
      {pCap && f >= c.fuel + 10 && f < c.bombs ? <Tag x={pCap.x} y={pCap.y} text="YOU" color="#ffffff" o={fadeIn(f, c.fuel + 10)} size={32} /> : null}
      {f >= c.joke && f < c.y1958 ? <JokeFreeze f={f} /> : null}
      {f >= c.stages + 10 && f < c.launch - 4 ? (
        <>
          {pS1 ? <Tag x={pS1.x} y={pS1.y} text={f >= c.drop ? "STAGE 1 · EMPTY → DROP" : "STAGE 1"} color={f >= c.drop ? "#9aa1a8" : "#ff9a2e"} o={fadeIn(f, c.stages + 10)} size={32} /> : null}
          {pS2 ? <Tag x={pS2.x} y={pS2.y} text="STAGE 2" color="#5fb7ff" o={fadeIn(f, c.stages + 14)} size={32} /> : null}
          {pCap ? <Tag x={pCap.x} y={pCap.y} text="YOU" color="#ffffff" o={fadeIn(f, c.stages + 18)} size={32} /> : null}
        </>
      ) : null}
      {f >= c.launch + 10 && f < c.tip ? <FlightPill km={(ry * 1) / 1000} kmh={(9 * 6 * Math.max(0, f - c.launch - 8)) / 30 * 3.6} o={fadeIn(f, c.launch + 10)} /> : null}
      {f >= c.chutes && f < c.splash + 8 ? <FlightPill km={Math.max(0, capY) / 1000} o={fadeIn(f, c.chutes)} /> : null}
      {f >= c.theRocket && f < c.theRocket + 50 ? <Big x={540} y={560} text="THE ROCKET" o={fadeIn(f, c.theRocket) * (1 - ramp(f, c.theRocket + 38, c.theRocket + 50))} size={110} color="#ffd23f" /> : null}
      {f >= c.theRocket + 62 ? <Big x={540} y={430} text="REUNITED ♥" o={fadeIn(f, c.theRocket + 62)} size={92} color="#ff7ab8" /> : null}
    </AbsoluteFill>
  );
};

/** 20,000 g against the 7 g at which people black out. */
const GMeter: React.FC<{ f: number }> = ({ f }) => {
  const k = ramp(f, c.g - 4, c.g + 10, easeOut);
  const v = Math.round(20000 * k);
  return (
    <div style={{ position: "absolute", top: 1300, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 30, opacity: fadeIn(f, c.g - 4) }}>
      <div style={{ padding: "16px 30px", borderRadius: 20, background: "rgba(0,0,0,0.7)", border: "4px solid #ff3b30", textAlign: "center" }}>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 92, color: "#ff3b30", fontVariantNumeric: "tabular-nums" }}>{v.toLocaleString("en-US")} g</div>
        <div style={{ fontFamily: fonts.hud, fontSize: 30, color: "#fff", letterSpacing: 3 }}>THE CANNON</div>
      </div>
      <div style={{ padding: "16px 30px", borderRadius: 20, background: "rgba(0,0,0,0.7)", border: "4px solid #9aa1a8", textAlign: "center" }}>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 92, color: "#fff" }}>7 g</div>
        <div style={{ fontFamily: fonts.hud, fontSize: 30, color: "#fff", letterSpacing: 3 }}>BLACKOUT</div>
      </div>
    </div>
  );
};

/** "That's a joke." — the picture freezes grey with a stamp. */
const JokeFreeze: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill style={{ backdropFilter: "grayscale(1) contrast(1.2)", background: "rgba(0,0,0,0.25)" }}>
    <div style={{ position: "absolute", top: 760, left: 540, transform: `translate(-50%,-50%) rotate(-10deg) scale(${1.6 - 0.6 * fadeIn(f, c.joke, 6)})`, opacity: fadeIn(f, c.joke, 6), border: "12px solid #ffd23f", borderRadius: 18, padding: "6px 34px", fontFamily: fonts.punch, fontWeight: 900, fontSize: 120, color: "#ffd23f", letterSpacing: 4 }}>JOKE!</div>
  </AbsoluteFill>
);

// ───────────────────────── CLIMB: the ladder to space, and later the rocket's gravity turn ─────────────────────────
const CLIMB0 = c.ladder + 8;
/** Altitude (m) during the climb: through the clouds, past the airliners, into the black. */
const climbAlt = (f: number) =>
  keys(
    f,
    [
      [CLIMB0, 4],
      [CLIMB0 + 6, 2600],
      [CLIMB0 + 10, 10500],
      [CLIMB0 + 23, 11500],
      [CLIMB0 + 29, 50000],
      [c.letGo - 4, 100000],
    ],
    (x) => x,
  );
const PLANE_F = CLIMB0 + 17; // the airliner crosses here (the climb almost stops around 11 km for it)
const LADDER_ON_BOAT: V3 = [3.4, 0, -0.9]; // boat/spaceport offset so the ladder (at the origin) stands on the stern

export const SetClimb: React.FC<SetProps> = ({ f }) => (f >= c.tip - 2 ? <RocketTurn f={f} /> : <ClimbUp f={f} />);

const ClimbUp: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const alt = climbAlt(f);
  const km = alt / 1000;
  // after "let go" you fall away from the camera
  const fallT = f >= c.letGo + 8 ? (f - c.letGo - 8) / 30 : 0;
  const youY = alt - 0.5 * 9.8 * fallT * fallT * 2.5;
  // camera: below you looking up the ladder → beside you looking down at the clouds/Earth → level at the top
  const early = 1 - ramp(f, CLIMB0 + 4, CLIMB0 + 12);
  const late = ramp(f, CLIMB0 + 24, c.letGo - 6);
  const pos: V3 = [2.6 + 1.4 * (1 - early), alt + lerpN(-3.6, lerpN(2.2, 1.4, late), 1 - early), lerpN(4.2, lerpN(7.5, 6.4, late), 1 - early)];
  const look: V3 = [0, alt + lerpN(3, lerpN(0.4, 0.6, late), 1 - early) - Math.min(8, 0.5 * 9.8 * fallT * fallT) * 0.5, 0];
  const cam: Cam = { pos, look, fov: 44 };
  const planeK = ramp(f, PLANE_F - 9, PLANE_F + 9, (x) => x);
  const issK = f >= c.fall && f < c.because ? ramp(f, c.fall, c.fall + 16, (x) => x) : -1;
  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} t={t} km={km} sea={km < 4}>
        {/* the ground you left: boat + spaceport (low), then the real Earth (high) */}
        {km < 4 ? (
          <group position={LADDER_ON_BOAT}>
            <WorkBoat p={[0, 0, 0]} />
            <group position={PAD}>
              <LaunchPad />
            </group>
            <Spaceport pad={PAD} />
          </group>
        ) : (
          <FarEarth cam={cam} center={[LADDER_ON_BOAT[0], -R_EARTH, LADDER_ON_BOAT[2]]} lat={28} lon={-80} sun={[0.3, 0.9, 0.3]} backdrop />
        )}
        <CloudField center={[0, 0, 0]} y0={2000} y1={3000} spread={5000} n={90} size={[380, 1000]} seed={4} />
        {/* the cloud deck far below once you are above it */}
        {km > 3 ? <CloudField center={[0, 0, -12000]} y0={1800} y1={2600} spread={40000} n={110} size={[2500, 6500]} seed={12} /> : null}
        <group position={[0, D, 0]}>
          <Ladder h={100010} around={alt - D} window={80} />
        </group>
        <Model file="man_a.glb" anims={f < c.letGo + 6 ? LIB2 : LIB1} clip={f < c.letGo + 6 ? "ClimbUp_1m_RM" : "Jump_Loop"} inPlace={f < c.letGo + 6} t={f < c.letGo + 6 ? (t * 1.4) % 0.667 : t} p={[0, youY + (f < c.letGo + 6 ? 0.3 : -0.4), 0.42]} ry={Math.PI} outfit={YOU} tint={HAIR_YOU} />
        {/* an airliner at cruising altitude, ~240 m/s across the middle of the view (the camera looks left, towards x ≈ −70) */}
        {planeK > 0 && planeK < 1 ? <PlaneModel frame={f} position={[-145 + 145 * planeK, alt - 40 - (f - PLANE_F) * 0.8, -150]} rotation={[0, -Math.PI / 2, 0.05]} scale={[22, 22, 22]} /> : null}
        {issK >= 0 ? (
          <group position={[-90 + 180 * issK, alt + 30, -90]}>
            <Glow position={[0, 0, 0]} size={16} color="#ffffff" opacity={1} fog={false} />
            {Array.from({ length: 12 }, (_, i) => (
              <Glow key={i} position={[-i * 5, 0, 0]} size={12 - i * 0.8} color="#bfe3ff" opacity={0.8 - i * 0.06} fog={false} />
            ))}
          </group>
        ) : null}
      </SkyCanvas>
      <FlightPill km={km} o={fadeIn(f, CLIMB0 + 2)} />
      {f >= PLANE_F - 6 && f < PLANE_F + 7 ? <Big x={540} y={1460} text={"PLANES FLY HERE\n~11 km · 36,000 ft"} o={fadeIn(f, PLANE_F - 6, 3) * (1 - ramp(f, PLANE_F + 3, PLANE_F + 7))} size={62} color="#ffffff" /> : null}
      {f >= c.letGo - 10 && f < c.letGo + 6 ? <Big x={540} y={1460} text="SPACE!" o={fadeIn(f, c.letGo - 10)} size={120} color="#ffd23f" /> : null}
      {f >= c.fall && f < c.because ? <Big x={540} y={430} text="ISS →→→" o={fadeIn(f, c.fall)} size={90} color="#bfe3ff" /> : null}
    </AbsoluteFill>
  );
};
const lerpN = (a: number, b: number, k: number) => a + (b - a) * k;


/** The rocket pitches over ("gravity turn") and stage 1 falls away. */
const RocketTurn: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const k = ramp(f, c.tip - 2, c.aroundToo, (x) => x);
  const km = 12 + 140 * k * k;
  const pitch = 1.25 * ramp(f, c.tip + 4, c.tip + 40, easeInOut); // 0 = straight up, 1.25 ≈ 72° over
  const sep = ramp(f, c.tip + 30, c.aroundToo + 6, (x) => x);
  const P: V3 = [0, km * 1000, 0];
  // follow stage 2 (it keeps flying) as the rocket pitches over: its middle sits ~33 m up the rocket axis
  const mid: V3 = [P[0] + Math.sin(pitch) * 33, P[1] + Math.cos(pitch) * 33, P[2]];
  const cam: Cam = { pos: [mid[0] + 14, mid[1] + 6, mid[2] + 78], look: [mid[0] - 4, mid[1] - 6, mid[2]], fov: 40 };
  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} t={t} km={km} sea={false}>
        <group position={P} rotation={[0, 0, -pitch]}>
          <Rocket t={t} flame1={sep > 0 ? 0 : 1} flame2={sep > 0.05 ? 1 : 0} sep1={sep * 26} tumble1={sep * 1.6} vacuum={Math.min(1, km / 80)} />
        </group>
      </SkyCanvas>
      <FlightPill km={km} kmh={2000 + 26000 * k} o={1} />
      {f >= c.tip + 8 ? <Big x={540} y={1460} text="SIDEWAYS →" o={fadeIn(f, c.tip + 8)} size={100} color="#ffd23f" /> : null}
      {f >= c.tip + 32 ? <Big x={540} y={1600} text="STAGE 1: EMPTY → DROP" o={fadeIn(f, c.tip + 32)} size={54} color="#9aa1a8" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── ORBIT: the ISS, the orbit line, sunrises, the grab ─────────────────────────
const MASK_ON_PANEL: V3 = [-44, 0.3, 35]; // near the tip of a solar wing (wing spans z 3.5 … 37.5)

export const SetOrbit: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const hook = f < c.space;
  const sideways = f >= c.because && f < c.falling;
  const wide = f >= c.aroundToo && f < c.float;
  const sun = f >= c.sunrises && f < c.steak;
  const grab = f >= c.grab;
  // Earth turning under the station (slow normally, a time-lapse for the sunrises)
  const spin = sun ? ((f - c.sunrises) / 30) * 0.25 : t * 0.004 + (sideways ? (f - c.because) * 0.0036 : 0);
  let cam: Cam;
  if (hook) cam = { pos: keys3(f, [[0, [-37, 5.5, 48]], [c.space - 4, [-40.5, 2.4, 39.4]]]), look: keys3(f, [[0, add(MASK_ON_PANEL, [1.5, 0.2, 0])], [c.space - 4, add(MASK_ON_PANEL, [0, 0.3, 0])]]), fov: 40 };
  else if (sideways) cam = { pos: keys3(f, [[c.because, [95, 22, 70]], [c.falling, [70, 14, 92]]]), look: keys3(f, [[c.because, [-10, -8, 0]], [c.falling, [-6, -10, 0]]]), fov: 40, roll: -0.08 };
  // 22° above the orbit plane, far enough back that the planet and the ring fit the vertical frame
  else if (wide) cam = { pos: keys3(f, [[c.aroundToo, [0, EARTH_C[1] + 1.42e7, 3.52e7]], [c.float, [0, EARTH_C[1] + 1.27e7, 3.15e7]]]), look: [0, EARTH_C[1], 0], fov: 40 };
  else if (sun) cam = { pos: keys3(f, [[c.sunrises, [38, 44, 160]], [c.steak, [34, 41, 148]]]), look: [-4, -42, -120], fov: 40 };
  else cam = { pos: keys3(f, [[c.grab, [-25, 9, 62]], [c.home, [-27, 7, 58]]]), look: keys3(f, [[c.grab, [-44, 1.5, 38.5]], [c.home, [-44, 1.8, 39.5]]]), fov: 40 };
  // the station "moving" sideways = Earth and stars sliding past; speed streaks behind it
  // sunrise: the sun comes up over the limb (the horizon is ~20° below level at 400 km) straight ahead of the camera
  const sunEl = sun ? -0.42 + 0.22 * ramp(f, c.sunrises, c.steak, (x) => x) : 0;
  const sunUp = sun ? ramp(f, c.sunrises + 14, c.sunrises + 30) : 1;
  const sunDir: [number, number, number] = sun ? [-0.16, Math.sin(sunEl), -Math.cos(sunEl)] : wide ? [0.55, 0.35, 0.75] : SUN;
  const sunrises = sun ? Math.min(16, 1 + Math.floor((f - c.sunrises) / ((c.steak - c.sunrises) / 16))) : 0;
  // orbit wide shot: a ring just above the planet + the capsule riding it
  const ringK = ramp(f, c.aroundToo, c.float, (x) => x);
  const capOnRing: V3 = wide ? [Math.cos(0.15 + ringK * 3.4) * (R_EARTH + 400000), EARTH_C[1], Math.sin(0.15 + ringK * 3.4) * (R_EARTH + 400000)] : [0, 0, 0];
  // the grab: capsule beside the panel, you lean out of the hatch, the mask comes inside
  const capG: V3 = [-44, -0.6, 41.6];
  const grabK = ramp(f, c.grab + 8, c.grab + 30, easeInOut);
  const maskP: V3 = grab ? lerp3(MASK_ON_PANEL, add(capG, [0, 3.6, 0]), grabK) : MASK_ON_PANEL;
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pMask = at(add(MASK_ON_PANEL, [0, 0.6, 0]));
  const pISS = at([20, 6, 0]);
  return (
    <AbsoluteFill>
      <SpaceCanvas cam={cam} t={t} sunDir={sunDir} sun={0.15 + 0.85 * sunUp} ao={!wide} near={wide ? 100 : 0.3}>
        <FarEarth cam={cam} center={wide ? [0, EARTH_C[1], 0] : EARTH_C} spin={spin} clouds={t * 0.002} lat={28} lon={-20} sun={sunDir} />
        {!wide ? (
          <ISS>
            {!grab || grabK < 1 ? (
              <group position={maskP} rotation={[0.2, 0.6, 0.3]}>
                <FursuitHead s={MASK_S} t={t} />
              </group>
            ) : null}
          </ISS>
        ) : null}
        {sideways
          ? Array.from({ length: 16 }, (_, i) => {
              const r = seeded(i + 3);
              const x = 70 - (((f - c.because) * 9 + i * 30) % 260);
              return <Glow key={i} position={[x - 60, (r() - 0.5) * 30, (r() - 0.5) * 40 - 10]} size={2 + r() * 2} color="#bfe3ff" opacity={0.6} />;
            })
          : null}
        {grab ? (
          <group position={capG} rotation={[0.1, 0.6, 0.15]}>
            <Capsule t={t} />
            <Model file="man_a.glb" anims={LIB1} clip="Interact" t={t} p={[0, 2.6, 0.4]} ry={-0.2} outfit={YOU} tint={HAIR_YOU} attach={{ bone: "Head", node: <FishbowlHelmet /> }} />
          </group>
        ) : null}
        {wide ? (
          // same 1/1000 trick as FarEarth: world = cam + (p − cam) / 1000
          <group position={[cam.pos[0] * 0.999, cam.pos[1] * 0.999, cam.pos[2] * 0.999]} scale={[0.001, 0.001, 0.001]}>
            <mesh position={[0, EARTH_C[1], 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[R_EARTH + 400000, 45000, 8, 240]} />
              <meshBasicMaterial color="#ffd23f" toneMapped={false} />
            </mesh>
            <Glow position={capOnRing} size={1400000} color="#ffffff" opacity={1} fog={false} />
            {/* a short fading trail behind the capsule along the orbit */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = 0.15 + ringK * 3.4 - (i + 1) * 0.035; // right → left across the front of the planet
              return <Glow key={i} position={[Math.cos(a) * (R_EARTH + 400000), EARTH_C[1], Math.sin(a) * (R_EARTH + 400000)]} size={900000 - i * 55000} color="#ffe9a8" opacity={0.75 - i * 0.055} fog={false} />;
            })}
          </group>
        ) : null}
        {sun ? (
          <group>
            <Glow position={[sunDir[0] * 3000, sunDir[1] * 3000, sunDir[2] * 3000]} size={420} color="#ffffff" opacity={1} fog={false} />
            <Glow position={[sunDir[0] * 3000, sunDir[1] * 3000, sunDir[2] * 3000]} size={1100} color="#ffd08a" opacity={0.7} fog={false} />
            <Glow position={[sunDir[0] * 3000, sunDir[1] * 3000, sunDir[2] * 3000]} size={2400} color="#ff9a4a" opacity={0.16 * sunUp} fog={false} />
          </group>
        ) : null}
      </SpaceCanvas>
      {hook && pMask && f > 20 ? <Tag x={pMask.x} y={pMask.y} text="POCKET PUH" color="#ff8a3a" o={fadeIn(f, 24)} /> : null}
      {hook && f >= 6 ? <Big x={540} y={1480} text={"ISS · 400 km · 250 mi"} o={fadeIn(f, 6) * (1 - ramp(f, c.space - 10, c.space - 2))} size={64} color="#bfe3ff" /> : null}
      {sideways && pISS ? <Tag x={pISS.x} y={pISS.y - 200} text="ISS" color="#bfe3ff" o={fadeIn(f, c.because)} /> : null}
      {f >= c.kmh && sideways ? <Big x={540} y={1460} text={"28,000 km/h\n17,500 mph"} o={fadeIn(f, c.kmh)} size={92} color="#ffd23f" /> : null}
      {wide ? <Big x={540} y={430} text="FALLING AROUND" o={fadeIn(f, c.aroundToo + 6)} size={90} color="#ffd23f" /> : null}
      {wide ? <Big x={540} y={1480} text={"28,000 km/h · 17,500 mph"} o={fadeIn(f, c.aroundToo + 12)} size={58} /> : null}
      {sun ? <Big x={540} y={1460} text={`SUNRISE ×${sunrises}`} o={fadeIn(f, c.sunrises)} size={100} color="#ffd23f" /> : null}
      {sun ? <Big x={540} y={1600} text="EVERY DAY" o={fadeIn(f, c.sunrises + 10)} size={56} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── CAPSULE: floating inside, the smell, the sandwich ─────────────────────────
export const SetCapsule: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const capP: V3 = [0, 0, 0];
  const cam: Cam = { pos: keys3(f, [[c.float, [1.6, 2.4, 6.4]], [c.steak, [1.2, 2.2, 5.6]], [c.sandwich, [0.9, 2.3, 5.4]], [c.grab, [1.1, 2.3, 5.8]]]), look: [0, 1.7, -0.3], fov: 42 };
  const float = 0.18 * Math.sin(t * 1.3);
  const spin = 0.4 * Math.sin(t * 0.5);
  const burst = f >= c.crumbs - 4 ? ramp(f, c.crumbs - 4, c.congress + 40, (x) => Math.sqrt(x)) : 0;
  const sandIn = ramp(f, c.sandwich, c.sandwich + 24, easeOut);
  const sandP: V3 = [0.9 - 0.4 * sandIn, 2.0 + 0.1 * Math.sin(t), 0.4 + 0.5 * (1 - sandIn)];
  const earthC: V3 = [0, -(R_EARTH + 400000), -2e5];
  return (
    <AbsoluteFill>
      <SpaceCanvas cam={cam} t={t}>
        <FarEarth cam={cam} center={earthC} lat={10} lon={30} spin={t * 0.01} />
        <group position={capP}>
          <Capsule t={t} cut>
            {/* floating cross-legged like astronauts in the photos, slowly turning (pivot around the belly) */}
            <group position={[0.1, 2.0 + float, 1.05]} rotation={[-0.55 + 0.2 * Math.sin(t * 0.7), spin, 0.7 + 0.25 * Math.sin(t * 0.45)]}>
              <Model file="man_a.glb" anims={LIB1} clip="Sitting_Idle_Loop" t={t} p={[0, -0.55, 0]} scale={0.82} outfit={YOU} tint={HAIR_YOU} attach={{ bone: "Head", node: <FishbowlHelmet /> }} />
            </group>
          </Capsule>
        </group>
        {f >= c.sandwich ? <Sandwich p={sandP} burst={burst} t={t} /> : null}
      </SpaceCanvas>
      {f >= c.noGravity && f < c.sunrises ? <GravityGauge f={f} /> : null}
      {f >= c.justFalling && f < c.sunrises ? <Big x={540} y={430} text="JUST FALLING ↓" o={fadeIn(f, c.justFalling)} size={80} color="#ffd23f" /> : null}
      {f >= c.steak && f < c.sandwich ? <Big x={540} y={1440} text={"SMELLS LIKE\nSEARED STEAK 🥩"} o={fadeIn(f, c.steak + 6)} size={72} color="#ffb547" /> : null}
      {f >= c.y1965 && f < c.grab ? <Big x={540} y={420} text="1965 · GEMINI 3" o={fadeIn(f, c.y1965)} size={74} color="#ffd23f" /> : null}
      {f >= c.congress ? <Memo f={f} /> : null}
    </AbsoluteFill>
  );
};

const GravityGauge: React.FC<{ f: number }> = ({ f }) => {
  const k = ramp(f, c.ninety - 4, c.ninety + 14, easeOut);
  return (
    <div style={{ position: "absolute", top: 1360, left: 540, transform: "translateX(-50%)", opacity: fadeIn(f, c.noGravity), display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 46, color: "#fff", WebkitTextStroke: "7px #000", paintOrder: "stroke fill" }}>GRAVITY UP HERE</div>
      <div style={{ width: 520, height: 54, borderRadius: 27, border: "5px solid #fff", background: "rgba(0,0,0,0.55)", overflow: "hidden" }}>
        <div style={{ width: `${90 * k}%`, height: "100%", background: "#5dfc8d" }} />
      </div>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 70, color: "#5dfc8d", WebkitTextStroke: "8px #000", paintOrder: "stroke fill" }}>{Math.round(90 * k)}%</div>
    </div>
  );
};

const Memo: React.FC<{ f: number }> = ({ f }) => {
  const k = fadeIn(f, c.congress, 10);
  return (
    <div style={{ position: "absolute", top: 1330, left: 540, transform: `translate(-50%, ${(1 - k) * 200}px) rotate(-3deg)`, opacity: k, width: 760, padding: "26px 34px", background: "#fbf7ec", borderRadius: 8, boxShadow: "0 12px 40px rgba(0,0,0,0.5)", fontFamily: fonts.hud, color: "#222" }}>
      <div style={{ fontSize: 30, letterSpacing: 3, color: "#666" }}>NASA → U.S. CONGRESS</div>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 58, marginTop: 6 }}>NO MORE SANDWICHES.</div>
      <div style={{ position: "absolute", right: 24, top: 18, transform: "rotate(12deg)", border: "6px solid #c0392b", color: "#c0392b", fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, padding: "2px 12px", borderRadius: 8 }}>PROMISED</div>
    </div>
  );
};

// ───────────────────────── REENTRY: plasma, then the shield burning away ─────────────────────────
export const SetReentry: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const km = keys(f, [[c.home, 95], [c.chutes, 20]], (x) => x);
  const heat = ramp(f, c.home + 4, c.hotter, easeOut) * (1 - ramp(f, c.chutes - 20, c.chutes));
  const close = f >= c.shield;
  const ablate = ramp(f, c.burnAway - 6, c.chutes, (x) => x);
  const P: V3 = [0, km * 1000, 0];
  const cam: Cam = close ? { pos: [P[0] + 7, P[1] - 4.5, P[2] + 9.5], look: [P[0], P[1] - 0.4, P[2]], fov: 42 } : { pos: [P[0] + 12, P[1] + 4, P[2] + 22], look: [P[0], P[1] - 2, P[2]], fov: 40 };
  const embers = useMemo(() => {
    const r = seeded(91);
    return Array.from({ length: 40 }, () => ({ a: r() * Math.PI * 2, rr: 0.4 + r() * 1.5, v: 4 + r() * 8, ph: r() }));
  }, []);
  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} t={t} km={km} sea={false}>
        <group position={P} rotation={[0.35, 0, 0.25]}>
          <Capsule t={t} heat={heat} ablate={ablate} />
          <Plasma o={heat} t={t} />
          {close
            ? embers.map((q, i) => {
                const u = (((t * 1.2 + q.ph) % 1) + 1) % 1;
                return <Glow key={i} position={[Math.cos(q.a) * q.rr, -0.1 + u * q.v * 0.8, Math.sin(q.a) * q.rr]} size={0.25} color="#ffb04a" opacity={heat * (1 - u)} />;
              })
            : null}
        </group>
      </SkyCanvas>
      <FlightPill km={km} kmh={keys(f, [[c.home, 27000], [c.chutes, 1500]])} o={1} />
      {f >= c.hotter ? <Big x={540} y={1450} text={"1,600 °C\n2,900 °F"} o={fadeIn(f, c.hotter) * (close ? 0 : 1)} size={100} color="#ff8a3a" /> : null}
      {close ? <Big x={540} y={1450} text={"BURNS AWAY\nON PURPOSE"} o={fadeIn(f, c.burnAway)} size={84} color="#ffb04a" /> : null}
    </AbsoluteFill>
  );
};
