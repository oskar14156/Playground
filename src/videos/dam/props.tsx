import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Cyl, RB, tex } from "../../lib/three/diorama";
import { ctex, signTex } from "../sewer/props";
import { rnd } from "./world";

// ───────────────────────── backyard ─────────────────────────
/** above-ground inflatable pool (3 stacked rings), water level 0..1, overflow sheen */
export const InflatablePool: React.FC<{ p: V3; r?: number; level?: number; t?: number; slosh?: number }> = ({ p, r = 1.7, level = 0.8, t = 0, slosh = 0 }) => (
  <group position={p}>
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 0.16 + i * 0.27, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <torusGeometry args={[r, 0.14, 14, 48]} />
        <meshStandardMaterial color={i === 1 ? "#f4f4f2" : "#2f8fe0"} roughness={0.35} />
      </mesh>
    ))}
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[r, 40]} />
      <meshStandardMaterial color="#5ab8e8" roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.1 + 0.62 * level + 0.03 * Math.sin(t * 5) * slosh, 0]} rotation={[-Math.PI / 2 + 0.02 * slosh * Math.sin(t * 3), 0, 0]}>
      <circleGeometry args={[r - 0.02, 40]} />
      <meshStandardMaterial color="#62c6ee" roughness={0.05} metalness={0.1} transparent opacity={0.85} />
    </mesh>
  </group>
);

/** pink swim ring; children sit on it (the puh) */
export const SwimRing: React.FC<{ p: V3; ry?: number; bob?: number; children?: React.ReactNode; s?: number }> = ({ p, ry = 0, bob = 0, children, s = 1 }) => (
  <group position={[p[0], p[1] + bob, p[2]]} rotation={[0.08 * Math.sin(bob * 20), ry, 0.06 * Math.cos(bob * 17)]} scale={s}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <torusGeometry args={[0.42, 0.16, 14, 36]} />
      <meshStandardMaterial color="#ff6fa8" roughness={0.3} />
    </mesh>
    {[0, 1, 2, 3].map((k) => (
      <mesh key={k} rotation={[Math.PI / 2, 0, (k * Math.PI) / 2]}>
        <torusGeometry args={[0.42, 0.162, 14, 36, 0.35]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
    ))}
    {children}
  </group>
);

/** garden hose as a tube through points, tap end optional */
export const Hose: React.FC<{ pts: V3[]; r?: number; color?: string; burst?: number }> = ({ pts, r = 0.025, color = "#2e9e4a", burst = 0 }) => {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 80, r * (1 + burst * 2.2), 8, false), [pts, r, burst]);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
};

/** picket fence along +x from p, `n` panels of 2 m */
export const Fence: React.FC<{ p: V3; n: number; ry?: number; broken?: number }> = ({ p, n, ry = 0, broken = -1 }) => {
  const wood = tex("planks", "#b98a5a", [0.5, 1], 4);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {Array.from({ length: n }).map((_, i) =>
        i === broken ? null : (
          <group key={i} position={[i * 2, 0, 0]}>
            {[0.35, 1.05].map((y) => (
              <RB key={y} p={[1, y, 0]} s={[2, 0.08, 0.05]} r={0.01} color="#a87a4c" />
            ))}
            {Array.from({ length: 9 }).map((_, k) => (
              <mesh key={k} position={[0.12 + k * 0.22, 0.65, 0.04]} castShadow>
                <boxGeometry args={[0.14, 1.3, 0.025]} />
                <meshStandardMaterial map={wood} roughness={0.8} />
              </mesh>
            ))}
          </group>
        ),
      )}
    </group>
  );
};

/** spreading flood sheet on a flat yard: radius grows with k */
export const Puddle: React.FC<{ p: V3; r: number; o?: number; t?: number }> = ({ p, r, o = 1, t = 0 }) =>
  r > 0.05 ? (
    <mesh position={p} rotation={[-Math.PI / 2, 0, 0.3 * Math.sin(t)]}>
      <circleGeometry args={[r, 48]} />
      <meshStandardMaterial color="#7cc4e6" roughness={0.04} metalness={0.2} transparent opacity={0.75 * o} />
    </mesh>
  ) : null;

const streakTex = (key: string, base: string) =>
  ctex(`dam-fall-${key}`, 128, 512, (g, r) => {
    g.clearRect(0, 0, 128, 512);
    for (let i = 0; i < 140; i++) {
      const x = r() * 128;
      const y = r() * 512;
      g.strokeStyle = i % 3 ? base : "rgba(255,255,255,0.9)";
      g.globalAlpha = 0.25 + r() * 0.6;
      g.lineWidth = 2 + r() * 6;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 3, y + 40 + r() * 120);
      g.stroke();
    }
    g.globalAlpha = 1;
  });

/** a sheet of falling water (waterfall), top centre at p, width w, height h, falling −y */
export const Waterfall: React.FC<{ p: V3; w: number; h: number; t: number; ry?: number; color?: string; o?: number; lean?: number }> = ({ p, w, h, t, ry = 0, color = "rgba(170,140,100,1)", o = 1, lean = 0.25 }) => {
  const tx = useMemo(() => {
    const c = streakTex(color, color).clone();
    c.wrapS = c.wrapT = THREE.RepeatWrapping;
    c.needsUpdate = true;
    return c;
  }, [color]);
  tx.repeat.set(w / 8, h / 40);
  tx.offset.set(0, t * 1.6);
  return o > 0.01 ? (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh position={[0, -h / 2, h * lean * 0.5]} rotation={[-lean, 0, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tx} transparent opacity={0.95 * o} color="#ffffff" roughness={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <Glow position={[0, -h + 2, h * lean]} size={w * 1.4} color="#f2e6d2" opacity={0.5 * o} />
    </group>
  ) : null;
};

// ───────────────────────── 1930s construction ─────────────────────────
/** 1930s dump truck facing +z, ~7 m long */
export const DumpTruck: React.FC<{ p: V3; ry?: number; color?: string; tip?: number; load?: string }> = ({ p, ry = 0, color = "#b8452e", tip = 0, load }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, 0.9, 0]} s={[2.1, 0.3, 6.8]} r={0.05} color="#1c1c1c" />
    {/* cab + hood */}
    <RB p={[0, 1.9, 1.6]} s={[2.0, 1.7, 1.5]} r={0.15} color={color} />
    <RB p={[0, 2.25, 1.9]} s={[1.85, 0.6, 0.9]} r={0.1} color="#1b2533" rough={0.1} metal={0.5} />
    <RB p={[0, 1.55, 3.0]} s={[1.4, 1.0, 1.5]} r={0.25} color={color} />
    <RB p={[0, 1.4, 3.8]} s={[1.3, 0.9, 0.1]} r={0.03} color="#2a2a2a" metal={0.6} />
    {[-0.7, 0.7].map((x) => (
      <Cyl key={x} p={[x * 0.7, 1.7, 3.86]} r={0.16} h={0.08} rot={[Math.PI / 2, 0, 0]} color="#fff4d0" emissive="#fff4d0" ei={0.4} />
    ))}
    {/* tipping bed */}
    <group position={[0, 1.15, -0.6]} rotation={[-tip * 0.8, 0, 0]}>
      <group position={[0, 0, -1.6]}>
        <RB p={[0, 0.7, 0]} s={[2.2, 0.12, 3.4]} r={0.04} color="#6a6a62" metal={0.5} />
        {[-1.05, 1.05].map((x) => (
          <RB key={x} p={[x, 1.2, 0]} s={[0.1, 1.0, 3.4]} r={0.03} color="#6a6a62" metal={0.5} />
        ))}
        <RB p={[0, 1.2, 1.65]} s={[2.2, 1.0, 0.1]} r={0.03} color="#6a6a62" metal={0.5} />
        {load ? <RB p={[0, 1.4, 0]} s={[2.0, 0.9, 3.2]} r={0.4} color={load} rough={1} /> : null}
      </group>
    </group>
    {[-0.95, 0.95].map((x) =>
      [2.7, -1.2, -2.6].map((z) => <Cyl key={`${x}${z}`} p={[x * 1.05, 0.55, z]} r={0.55} h={0.4} rot={[0, 0, Math.PI / 2]} color="#151515" />),
    )}
  </group>
);

/**
 * Drilling jumbo (Hoover, 1931): a truck carrying a 3-deck steel frame with 24 pneumatic drills aimed at the rock face (+z).
 * `drill` 0..1 pushes the drills in, `t` vibrates them.
 */
export const Jumbo: React.FC<{ p: V3; t: number; drill?: number }> = ({ p, t, drill = 0 }) => {
  const steel = "#6f6a5e";
  const drills: React.ReactNode[] = [];
  for (let deck = 0; deck < 3; deck++)
    for (let k = 0; k < 8; k++) {
      const x = -4.2 + k * 1.2;
      const y = 3.0 + deck * 2.4;
      const jit = 0.03 * Math.sin(t * 60 + k * 2 + deck);
      drills.push(
        <group key={`${deck}${k}`} position={[x, y + jit, 4.6 + drill * 1.2]}>
          <Cyl p={[0, 0, 0]} r={0.14} h={1.1} rot={[Math.PI / 2, 0, 0]} color="#3a3a36" metal={0.7} />
          <Cyl p={[0, 0, 1.4]} r={0.035} h={1.8} rot={[Math.PI / 2, 0, 0]} color="#b9b4a8" metal={0.8} />
        </group>,
      );
    }
  return (
    <group position={p}>
      <DumpTruck p={[0, 0, -2]} color="#3d5a3a" />
      {/* frame */}
      {[-4.8, 4.8].map((x) =>
        [1.2, 4.2].map((z) => <RB key={`${x}${z}`} p={[x, 4.6, z]} s={[0.25, 8, 0.25]} r={0.03} color={steel} metal={0.6} />),
      )}
      {[2.2, 4.6, 7.0].map((y) => (
        <group key={y}>
          <RB p={[0, y, 2.7]} s={[9.8, 0.18, 3.4]} r={0.03} color="#8a7454" />
          <RB p={[0, y + 0.55, 1.05]} s={[9.8, 0.06, 0.06]} r={0.01} color={steel} metal={0.6} />
        </group>
      ))}
      {drills}
      {/* hoses */}
      {[-3, 0, 3].map((x) => (
        <Cyl key={x} p={[x, 5, 1.0]} r={0.08} h={8} color="#1a1a1a" />
      ))}
    </group>
  );
};

/** dynamite detonator (plunger box) */
export const Plunger: React.FC<{ p: V3; ry?: number; push?: number }> = ({ p, ry = 0, push = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, 0.2, 0]} s={[0.45, 0.4, 0.3]} r={0.03} color="#7a4b2a" />
    <RB p={[0, 0.25, 0.16]} s={[0.3, 0.1, 0.02]} r={0.005} color="#e8d9b0" />
    <Cyl p={[0, 0.55 - push * 0.25, 0]} r={0.025} h={0.5} color="#888" metal={0.7} />
    <RB p={[0, 0.8 - push * 0.25, 0]} s={[0.5, 0.06, 0.06]} r={0.02} color="#2a2a2a" />
  </group>
);

/** rock fragments flying from a blast at p (k 0..1) */
export const Blast: React.FC<{ p: V3; k: number; n?: number; size?: number; dir?: V3 }> = ({ p, k, n = 40, size = 30, dir = [1, 0, 0] }) => {
  if (k <= 0 || k >= 1) return null;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd(i, 1) * Math.PI * 2;
    const e = rnd(i, 2) * 1.2 - 0.2;
    const sp = (0.4 + rnd(i, 3)) * size * 1.6;
    const d: V3 = [dir[0] * sp * k + Math.cos(a) * sp * 0.5 * k, Math.sin(e) * sp * k - 40 * k * k, dir[2] * sp * k + Math.sin(a) * sp * 0.5 * k];
    const s = (0.6 + rnd(i, 4)) * size * 0.06;
    items.push(
      <mesh key={i} position={[p[0] + d[0], p[1] + d[1], p[2] + d[2]]} rotation={[k * 6 * rnd(i, 5), k * 5, 0]} castShadow>
        <dodecahedronGeometry args={[s, 0]} />
        <meshStandardMaterial color="#6a4a36" roughness={1} />
      </mesh>,
    );
  }
  const fl = Math.max(0, 1 - k * 2.2);
  return (
    <group>
      {items}
      <Glow position={p} size={size * 3 * (0.4 + k)} color="#ffb050" opacity={fl} />
      <Glow position={[p[0] + dir[0] * size * k, p[1] + size * 0.3 * k, p[2]]} size={size * 4 * k} color="#bfa58a" opacity={0.6 * (1 - k)} fog />
    </group>
  );
};

/** dust puffs (billboard glows) around a centre */
export const Dust: React.FC<{ c: V3; r: number; k: number; n?: number; color?: string }> = ({ c, r, k, n = 18, color = "#cdb89a" }) =>
  k > 0.01 ? (
    <group>
      {Array.from({ length: n }).map((_, i) => (
        <Glow
          key={i}
          position={[c[0] + (rnd(i, 7) - 0.5) * r * 2 * (0.5 + k), c[1] + rnd(i, 8) * r * k, c[2] + (rnd(i, 9) - 0.5) * r * 2 * (0.5 + k)]}
          size={r * (0.6 + rnd(i, 3)) * (0.5 + k)}
          color={color}
          opacity={0.55 * Math.min(1, k * 3) * (1 - k * 0.6)}
          fog
        />
      ))}
    </group>
  ) : null;

// ───────────────────────── refrigeration plant ─────────────────────────
/** 1933 ammonia refrigeration plant (1,000 tons of ice a day): long hall, compressor stacks, 2 cooling towers, sign */
export const FridgePlant: React.FC<{ p: V3; ry?: number; t: number; on?: number }> = ({ p, ry = 0, t, on = 1 }) => {
  const siding = tex("siding", "#c8c2b4", [8, 2], 6);
  const sign = useMemo(() => signTex("REFRIGERATION PLANT", "1,000 TONS OF ICE A DAY", "#1f3a4f", "#eaf6ff", 1024, 192), []);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh position={[0, 8, 0]} castShadow receiveShadow>
        <boxGeometry args={[46, 16, 20]} />
        <meshStandardMaterial map={siding} roughness={0.8} />
      </mesh>
      <RB p={[0, 16.6, 0]} s={[47, 1.2, 21]} r={0.3} color="#6a6560" />
      {Array.from({ length: 8 }).map((_, i) => (
        <RB key={i} p={[-19.5 + i * 5.6, 9, 10.05]} s={[3.2, 4, 0.2]} r={0.05} color="#2a3542" />
      ))}
      <mesh position={[0, 13.4, 10.12]}>
        <planeGeometry args={[30, 5.6]} />
        <meshStandardMaterial map={sign} roughness={0.6} />
      </mesh>
      {/* cooling towers (slatted) with mist */}
      {[-12, 12].map((x) => (
        <group key={x} position={[x, 0, -18]}>
          <RB p={[0, 9, 0]} s={[12, 18, 12]} r={0.3} color="#7d6a52" />
          {Array.from({ length: 9 }).map((_, k) => (
            <RB key={k} p={[0, 2 + k * 1.9, 6.05]} s={[11.4, 0.4, 0.2]} r={0.05} color="#5a4a38" />
          ))}
          {[0, 1, 2, 3, 4].map((k) => (
            <Glow key={k} position={[Math.sin(t + k) * 2, 20 + ((t * 4 + k * 3) % 14), Math.cos(t * 0.7 + k) * 2]} size={10 + k * 2} color="#eef6ff" opacity={0.35 * on} fog />
          ))}
        </group>
      ))}
      {/* ammonia tanks */}
      {[-18, -10].map((x) => (
        <Cyl key={x} p={[x, 3, 15]} r={2.2} h={10} rot={[0, 0, Math.PI / 2]} color="#d9dde0" metal={0.5} rough={0.4} />
      ))}
    </group>
  );
};

// ───────────────────────── powerhouse interior ─────────────────────────
/** Hoover generator unit (cream housing, red-brown cap, brass band). Origin on the floor. */
export const Generator: React.FC<{ p: V3; spin?: number; lowered?: number; lit?: number }> = ({ p, spin = 0, lowered = 1, lit = 0 }) => {
  const dy = (1 - lowered) * 26;
  return (
    <group position={[p[0], p[1] + dy, p[2]]}>
      <Cyl p={[0, 1.2, 0]} r={7.2} h={2.4} seg={48} color="#2e2b28" rough={0.6} />
      <Cyl p={[0, 4.4, 0]} r={6.4} h={4} seg={48} color="#e6dccb" rough={0.5} />
      <Cyl p={[0, 6.6, 0]} r={6.5} h={0.5} seg={48} color="#c79a3e" metal={0.8} rough={0.3} />
      <Cyl p={[0, 8.0, 0]} r={5.4} r2={6.2} h={2.4} seg={48} color="#8a2b22" rough={0.45} />
      <Cyl p={[0, 9.6, 0]} r={2.2} h={1.0} seg={32} color="#d9cfbd" rough={0.4} />
      <group position={[0, 9.6, 0]} rotation={[0, spin, 0]}>
        {[0, 1, 2, 3].map((k) => (
          <RB key={k} p={[Math.cos((k * Math.PI) / 2) * 1.6, 0.6, Math.sin((k * Math.PI) / 2) * 1.6]} s={[0.4, 0.3, 0.4]} r={0.05} color="#2a2a2a" />
        ))}
      </group>
      {lit > 0.01 ? <Glow position={[0, 10.5, 0]} size={8} color="#ffd88a" opacity={0.5 * lit} /> : null}
    </group>
  );
};

/** terrazzo hall floor (Hoover's geometric pattern) */
export const terrazzoTex = () =>
  ctex("dam-terrazzo", 1024, 1024, (g, r) => {
    g.fillStyle = "#d8cdb8";
    g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 9000; i++) {
      const v = 140 + r() * 100;
      g.fillStyle = `rgba(${v},${v - 20},${v - 50},0.35)`;
      g.fillRect(r() * 1024, r() * 1024, 2, 2);
    }
    g.strokeStyle = "#8a2b22";
    g.lineWidth = 10;
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      const o = 120 + k * 70;
      g.moveTo(512, 512 - o);
      g.lineTo(512 + o, 512);
      g.lineTo(512, 512 + o);
      g.lineTo(512 - o, 512);
      g.closePath();
      g.stroke();
    }
    g.fillStyle = "#1f3a4f";
    g.beginPath();
    g.arc(512, 512, 70, 0, Math.PI * 2);
    g.fill();
  });

/** Francis turbine runner: hub + 13 curved blades, spinning about y */
export const Runner: React.FC<{ p: V3; spin: number; s?: number }> = ({ p, spin, s = 1 }) => (
  <group position={p} rotation={[0, spin, 0]} scale={s}>
    <Cyl p={[0, 0, 0]} r={1.1} r2={1.8} h={1.6} seg={32} color="#b07a3a" metal={0.8} rough={0.3} />
    {Array.from({ length: 13 }).map((_, k) => (
      <group key={k} rotation={[0, (k * Math.PI * 2) / 13, 0]}>
        <RB p={[2.2, -0.1, 0]} s={[1.9, 1.4, 0.16]} r={0.06} rot={[0, 0.5, 0.35]} color="#c58a44" metal={0.85} rough={0.25} />
      </group>
    ))}
    <Cyl p={[0, 3.5, 0]} r={0.5} h={5} color="#5a5a5a" metal={0.8} />
  </group>
);

/** night city of lights on the horizon (Las Vegas), `lit` 0..1 switches it on from the centre out */
export const CityLights: React.FC<{ p: V3; lit: number; t: number }> = ({ p, lit, t }) => {
  const win = useMemo(
    () =>
      ctex("dam-windows", 256, 512, (g, r) => {
        g.fillStyle = "#0c0f18";
        g.fillRect(0, 0, 256, 512);
        for (let y = 8; y < 512; y += 14)
          for (let x = 8; x < 256; x += 14) {
            if (r() < 0.62) {
              g.fillStyle = r() < 0.75 ? "#ffd58a" : "#9fe0ff";
              g.fillRect(x, y, 8, 7);
            }
          }
      }),
    [],
  );
  const towers: React.ReactNode[] = [];
  for (let i = 0; i < 46; i++) {
    const x = (rnd(i, 1) - 0.5) * 700;
    const z = (rnd(i, 2) - 0.5) * 220;
    const h = 30 + Math.pow(rnd(i, 3), 2) * 160 * (1 - Math.abs(x) / 450);
    const w = 18 + rnd(i, 4) * 26;
    const on = Math.min(1, Math.max(0, lit * 1.6 - Math.abs(x) / 450));
    towers.push(
      <mesh key={i} position={[x, h / 2, z]}>
        <boxGeometry args={[w, h, w * 0.8]} />
        <meshStandardMaterial map={win} color={on > 0.05 ? "#ffffff" : "#20232c"} emissive="#ffffff" emissiveMap={win} emissiveIntensity={on * 1.4} />
      </mesh>,
    );
  }
  return (
    <group position={p}>
      {towers}
      {/* the Strat */}
      <Cyl p={[60, 170, 0]} r={4} h={340} color="#c8c8d0" />
      <Cyl p={[60, 330, 0]} r={16} r2={12} h={18} color="#d8d8e0" emissive="#9fe0ff" ei={lit * 1.2} />
      <Glow position={[0, 40, 0]} size={700} color="#ffb86a" opacity={0.35 * lit} fog />
      <Glow position={[0, 400, 0]} size={30} color="#ffffff" opacity={lit * (0.6 + 0.4 * Math.sin(t * 6))} />
    </group>
  );
};
