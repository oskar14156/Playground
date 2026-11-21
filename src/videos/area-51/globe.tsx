import React from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { CameraRig, Cam, Glow, project, Stars3D, TubePath } from "../../lib/three/core";
import { Earth } from "../../lib/three/Earth";
import { easeInOut, easeOut, ramp } from "../../lib/timing";
import { fonts } from "../../lib/theme";
import { Big, Tag } from "../rocket/sets";

type LL = [number, number];
const D = Math.PI / 180;
/** Earth with lat = 90, lon = 0 keeps its texture frame: north = +Y, lon 0 = +X, lon 90°E = −Z. */
const dir = ([lat, lon]: LL) => new THREE.Vector3(Math.cos(lat * D) * Math.cos(lon * D), Math.sin(lat * D), -Math.cos(lat * D) * Math.sin(lon * D));
const slerp = (a: THREE.Vector3, b: THREE.Vector3, k: number) => {
  const om = a.angleTo(b);
  if (om < 1e-5) return a.clone();
  return a.clone().multiplyScalar(Math.sin((1 - k) * om) / Math.sin(om)).add(b.clone().multiplyScalar(Math.sin(k * om) / Math.sin(om)));
};

// Verkhnyaya Salda (VSMPO, the Soviet titanium works in the Urals) → shell companies → Groom Lake
const URALS: LL = [58.1, 60.6];
const NEVADA: LL = [37.24, -115.8];
const VIA: { ll: LL; name: string }[] = [
  { ll: [48.5, 12], name: "TOTALLY REAL TRADING CO." },
  { ll: [40, -38], name: "NOT-A-SPY IMPORTS LTD." },
];
const WIDE: LL = [50, -30];
const LEGS: LL[] = [URALS, ...VIA.map((v) => v.ll), NEVADA];
/** The route sampled along great circles, lifted into an arc per leg. */
const ROUTE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let l = 0; l < LEGS.length - 1; l++) {
    const a = dir(LEGS[l]);
    const b = dir(LEGS[l + 1]);
    for (let i = l === 0 ? 0 : 1; i <= 40; i++) {
      const k = i / 40;
      pts.push(slerp(a, b, k).normalize().multiplyScalar(1.004 + 0.05 * Math.sin(k * Math.PI)));
    }
  }
  return pts;
})();
const legAt = (i: number) => i * 40; // ROUTE index of waypoint i

/** "The country with the most titanium is the Soviet Union … the CIA bought it from them, through fake companies."
 * A globe: close on the Urals → ENEMY → the route draws itself through two shell companies to Nevada. */
export const TitaniumGlobe: React.FC<{ f: number; at: number; enemy: number; man: number; bought: number; fake: number; end: number }> = ({ f, at, enemy, man, bought, fake, end }) => {
  const prog = ramp(f, bought + 6, fake + 20, easeInOut);
  // close on the Urals, then pulled far back so the whole route (and both shell companies) stays in frame
  const wide = ramp(f, bought, bought + 30, easeInOut);
  const camDir = slerp(dir(URALS), dir(WIDE), wide).normalize();
  const dist = 2.3 + 0.3 * ramp(f, at, bought, (x) => x) + 2.2 * wide;
  const pos = camDir.clone().multiplyScalar(dist);
  const cam: Cam = { pos: [pos.x, pos.y, pos.z], look: [0, -0.08 * wide, 0], fov: 40 };
  const sun = camDir.clone().add(new THREE.Vector3(0.5, 0.6, 0.3)).normalize();
  const at3 = (v: THREE.Vector3) => project(v, cam, 1080, 1920);
  // a label is only shown on the side of the globe that faces the camera
  const facing = (v: THREE.Vector3) => v.clone().normalize().dot(pos.clone().sub(v).normalize()) > 0.15;
  const pUssr = facing(dir(URALS)) ? at3(dir(URALS).multiplyScalar(1.01)) : null;
  const pNv = facing(dir(NEVADA)) ? at3(dir(NEVADA).multiplyScalar(1.01)) : null;
  const enemyK = ramp(f, enemy, enemy + 8, easeOut);
  const fakeK = ramp(f, fake + 4, fake + 10, easeOut);
  return (
    <AbsoluteFill style={{ background: "#03050b" }}>
      <ThreeCanvas width={1080} height={1920} camera={{ fov: 40, near: 0.01, far: 200 }}>
        <CameraRig cam={cam} />
        <Stars3D frame={f} count={900} radius={40} size={0.12} />
        <Earth r={1} lat={90} lon={0} sun={[sun.x, sun.y, sun.z]} cover={0.35} />
        {/* the Soviet titanium works, red once it is "the enemy" */}
        <Glow position={dir(URALS).multiplyScalar(1.01)} size={0.09 + 0.06 * enemyK} color={enemyK > 0 ? "#ff3b30" : "#ffd23f"} opacity={1} />
        <TubePath points={ROUTE} progress={prog} radius={0.006 + 0.008 * wide} color="#ffd23f" />
        {VIA.map((v, i) => (prog * (ROUTE.length - 1) >= legAt(i + 1) ? <Glow key={i} position={dir(v.ll).multiplyScalar(1.01)} size={0.07 + 0.08 * wide} color="#ffffff" /> : null))}
        {prog > 0.97 ? <Glow position={dir(NEVADA).multiplyScalar(1.01)} size={0.2} color="#5dfc8d" /> : null}
      </ThreeCanvas>
      {pUssr ? <Tag x={pUssr.x} y={pUssr.y} text={enemyK > 0 ? "USSR ★ ENEMY" : "USSR ★"} color={enemyK > 0 ? "#ff3b30" : "#ffd23f"} o={ramp(f, at + 4, at + 12, easeOut)} /> : null}
      {VIA.map((v, i) => {
        const shown = prog * (ROUTE.length - 1) >= legAt(i + 1);
        const p = shown && facing(dir(v.ll)) ? at3(dir(v.ll).multiplyScalar(1.01)) : null;
        return p ? <Tag key={i} x={p.x} y={p.y} text={v.name} color="#ffffff" size={32} side={i ? "left" : "right"} o={1} /> : null;
      })}
      {pNv && prog > 0.97 ? <Tag x={pNv.x} y={pNv.y} text="AREA 51" color="#5dfc8d" side="left" o={ramp(f, fake + 18, fake + 26)} /> : null}
      {f >= at + 10 && f < bought + 10 ? <Big x={540} y={330} text={"TITANIUM:\nUSSR = #1 SUPPLIER"} o={ramp(f, at + 10, at + 20, easeOut) * (1 - ramp(f, bought, bought + 10))} size={66} color="#cfd8e3" /> : null}
      {f >= man ? (
        <div style={{ position: "absolute", left: 70, top: 1480, padding: "14px 26px", borderLeft: "10px solid #ffd23f", background: "rgba(6,10,22,0.85)", fontFamily: fonts.hud, color: "#fff", opacity: ramp(f, man, man + 8), transform: `translateX(${(1 - ramp(f, man, man + 10, easeOut)) * -80}px)` }}>
          <div style={{ fontSize: 30, letterSpacing: 4, color: "#ffd23f" }}>SAYS</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 48 }}>BEN RICH</div>
          <div style={{ fontSize: 30, color: "#b9c4d0" }}>SKUNK WORKS ENGINEER, A-12</div>
        </div>
      ) : null}
      {f >= fake + 4 ? (
        <div style={{ position: "absolute", top: 1240, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(1, fakeK) }}>
          <div style={{ transform: `rotate(-8deg) scale(${2 - fakeK})`, border: "12px solid #ff3b30", color: "#ff3b30", fontFamily: fonts.punch, fontWeight: 900, fontSize: 96, padding: "4px 28px", borderRadius: 16, background: "rgba(0,0,0,0.35)" }}>FAKE COMPANIES</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

