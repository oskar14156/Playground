import React, { useMemo } from "react";
import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";
import { Glow, V3 } from "./core";

/**
 * Classic "rocket" lava lamp, 1 unit = 10 cm (42 cm tall). Frame-driven: pass `t` (seconds).
 *  - wax: real metaballs (MarchingCubes) so blobs stretch, split and merge like the real thing
 *  - `hero`: optional 0–1 height of one big blob the story follows (null = only ambient blobs)
 *  - `heat`: 0–1 bulb brightness (warm-up), `ambient`: 0–1 how many free blobs move
 *  - `cut`: 0–1 fades the glass + liquid so the wax reads like a cross-section
 */
export const LAMP = { baseTop: 1.3, bottleTop: 3.7, capTop: 4.15 };

/** Inner bottle radius at height y (units). Widest 1.9, narrow at both ends. */
export const bottleR = (y: number) => {
  const t = Math.min(1, Math.max(0, (y - LAMP.baseTop) / (LAMP.bottleTop - LAMP.baseTop)));
  const ss = (a: number, b: number, x: number) => {
    const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return k * k * (3 - 2 * k);
  };
  return 0.3 + 0.2 * ss(0, 0.25, t) - 0.28 * ss(0.25, 1, t);
};

const lathe = (fn: (y: number) => number, y0: number, y1: number, steps = 48) =>
  new THREE.LatheGeometry(
    Array.from({ length: steps + 1 }, (_, i) => {
      const y = y0 + ((y1 - y0) * i) / steps;
      return new THREE.Vector2(fn(y), y);
    }),
    96,
  );

// wax blob paths: each rises from the pool, drifts, turns at the top and sinks (seconds)
const AMBIENT = [
  { period: 19, phase: 0.1, x: 0.14, z: -0.05, s: 0.9 },
  { period: 23, phase: 0.55, x: -0.16, z: 0.08, s: 0.75 },
  { period: 17, phase: 0.8, x: 0.05, z: 0.12, s: 0.6 },
  { period: 27, phase: 0.33, x: -0.04, z: -0.14, s: 0.85 },
];

/** 0 → 1 → 0 over one cycle, lingering at the ends like real wax (slow start, slow turn). */
const cycle = (u: number) => {
  const p = ((u % 1) + 1) % 1;
  const k = p < 0.5 ? p / 0.5 : (1 - p) / 0.5;
  return k * k * (3 - 2 * k);
};

export const LavaLamp: React.FC<{
  p?: V3;
  t: number;
  hero?: number | null;
  heat?: number;
  ambient?: number;
  cut?: number;
  wax?: string;
  liquid?: string;
}> = ({ p = [0, 0, 0], t, hero = null, heat = 1, ambient = 1, cut = 0, wax = "#ff4a17", liquid = "#ffc44a" }) => {
  const geo = useMemo(
    () => ({
      base: lathe((y) => 0.62 - 0.3 * Math.pow(y / LAMP.baseTop, 0.9), 0, LAMP.baseTop),
      glass: lathe((y) => bottleR(y) + 0.02, LAMP.baseTop, LAMP.bottleTop),
      liquid: lathe((y) => bottleR(y) - 0.015, LAMP.baseTop + 0.02, LAMP.bottleTop - 0.12),
      cap: lathe((y) => 0.25 - 0.13 * ((y - LAMP.bottleTop) / (LAMP.capTop - LAMP.bottleTop)), LAMP.bottleTop - 0.02, LAMP.capTop),
      coil: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          Array.from({ length: 121 }, (_, i) => {
            const a = (i / 120) * Math.PI * 2 * 4;
            return new THREE.Vector3(Math.cos(a) * 0.2, LAMP.baseTop + 0.05 + (i / 120) * 0.07, Math.sin(a) * 0.2);
          }),
        ),
        240,
        0.012,
        8,
      ),
    }),
    [],
  );

  const liquidTex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 4;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    const gr = g.createLinearGradient(0, 256, 0, 0); // canvas y=0 is v=1 (top of the bottle)
    gr.addColorStop(0, "#fff0a0");
    gr.addColorStop(0.25, liquid);
    gr.addColorStop(1, "#a8420c");
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [liquid]);
  const waxMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: wax, emissive: new THREE.Color(wax), emissiveIntensity: 0.55, roughness: 0.32, metalness: 0 }),
    [wax],
  );
  waxMat.emissiveIntensity = 0.35 + 0.6 * heat;

  // the wax volume: a 1.2-unit cube around the bottle middle, 64³ cells
  const S = 1.2;
  const cy = (LAMP.baseTop + LAMP.bottleTop) / 2;
  const mc = useMemo(() => {
    const m = new MarchingCubes(64, waxMat, false, false, 60000);
    m.isolation = 80;
    return m;
  }, [waxMat]);

  // rebuild the field for this frame (pure function of t / hero / ambient)
  mc.reset();
  const ball = (x: number, y: number, z: number, strength: number) => {
    // keep the blob inside the glass at its height
    const r = Math.hypot(x, z);
    const lim = Math.max(0, bottleR(y) - 0.12);
    const k = r > lim && r > 0 ? lim / r : 1;
    mc.addBall((x * k) / S / 2 + 0.5, (y - cy) / S / 2 + 0.5, (z * k) / S / 2 + 0.5, strength, 12);
  };
  // the pool on the coil: a flat row of balls
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    ball(Math.cos(a) * 0.14, LAMP.baseTop + 0.08, Math.sin(a) * 0.14, 0.05);
  }
  ball(0, LAMP.baseTop + 0.1, 0, 0.07);
  const yLo = LAMP.baseTop + 0.18;
  const yHi = LAMP.bottleTop - 0.32;
  AMBIENT.forEach((b, i) => {
    if (i >= Math.round(ambient * AMBIENT.length)) return;
    const h = cycle(t / b.period + b.phase);
    const y = yLo + (yHi - yLo) * h;
    const sway = Math.sin(t * 0.35 + i * 1.7) * 0.06;
    ball(b.x + sway, y, b.z + Math.cos(t * 0.3 + i) * 0.05, 0.2 * b.s);
    // a smaller trailing lobe makes the blob pear-shaped while it travels
    const lag = Math.abs(Math.sin((t / b.period + b.phase) * Math.PI * 2)) * 0.12;
    ball(b.x + sway * 0.8, y - lag, b.z, 0.09 * b.s);
  });
  if (hero !== null) {
    const y = yLo + (yHi - yLo) * hero;
    ball(0.02, y, 0.02, 0.2);
    ball(0.02, y - 0.12, 0.02, 0.08);
    // the neck it leaves behind while it is still close to the pool
    if (hero < 0.25) ball(0.02, (y + LAMP.baseTop + 0.1) / 2, 0.02, 0.07 * (1 - hero / 0.25));
  }
  mc.update();

  const glassOpacity = 1 - cut * 0.85;
  return (
    <group position={p}>
      {/* chrome base + cap */}
      <mesh geometry={geo.base} castShadow receiveShadow>
        <meshStandardMaterial color="#c7ccd2" metalness={1} roughness={0.22} />
      </mesh>
      <mesh geometry={geo.cap} castShadow>
        <meshStandardMaterial color="#c7ccd2" metalness={1} roughness={0.22} />
      </mesh>
      {/* bulb glow inside the top of the base */}
      <Glow position={[0, LAMP.baseTop - 0.02, 0]} size={1.2 * heat + 0.01} color="#ffb35a" opacity={0.9 * heat} />
      <pointLight position={[0, LAMP.baseTop + 0.15, 0]} intensity={6 * heat} distance={3} decay={1.6} color="#ffb36a" />
      <pointLight position={[0, LAMP.baseTop + 1.2, 0.3]} intensity={1.5 * heat} distance={2} decay={2} color="#ff8a3a" />
      {/* wax */}
      <primitive object={mc} position={[0, cy, 0]} scale={[S, S, S]} />
      {/* coil */}
      <mesh geometry={geo.coil}>
        <meshStandardMaterial color="#9aa1a8" metalness={1} roughness={0.35} />
      </mesh>
      {/* liquid + glass */}
      <mesh geometry={geo.liquid} renderOrder={2}>
        <meshBasicMaterial key="liq" map={liquidTex} color={new THREE.Color(0.35 + 0.65 * heat, 0.35 + 0.65 * heat, 0.35 + 0.65 * heat)} transparent opacity={0.26 + 0.2 * (1 - cut)} depthWrite={false} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={geo.glass} renderOrder={3}>
        <meshPhysicalMaterial key="glass" color="#ffffff" transparent opacity={0.12 * glassOpacity} roughness={0.05} metalness={0} clearcoat={1} clearcoatRoughness={0.05} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
