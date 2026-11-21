import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "../../lib/three/core";
import { RB, tex } from "../../lib/three/diorama";
import { seeded } from "../../lib/timing";

// A small coastal spaceport around the launch pad (1 unit = 1 m). Pad centre at `pad`, pad deck at y ≈ 3.1.

/** Island: beach ring, grass top, a few dunes; origin at sea level. */
const Island: React.FC<{ c: V3; rx: number; rz: number }> = ({ c, rx, rz }) => {
  const sand = useMemo(() => tex("asphalt", "#d9c79a", [30, 30], 12), []);
  const grass = useMemo(() => tex("grass", "#6e8f4c", [40, 40], 13), []);
  const geo = (k: number, h: number) => {
    const shape = new THREE.Shape();
    const n = 64;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob = 1 + 0.06 * Math.sin(a * 5) + 0.04 * Math.sin(a * 11 + 1);
      const x = Math.cos(a) * rx * k * wob;
      const z = Math.sin(a) * rz * k * wob;
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelThickness: 1.2, bevelSize: 6, bevelSegments: 3, curveSegments: 4 });
    g.rotateX(Math.PI / 2);
    g.translate(0, h, 0);
    return g;
  };
  const beach = useMemo(() => geo(1, 2.2), []); // eslint-disable-line react-hooks/exhaustive-deps
  const top = useMemo(() => geo(0.86, 2.6), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group position={[c[0], -1.4, c[2]]}>
      <mesh geometry={beach} receiveShadow>
        <meshStandardMaterial map={sand} color="#e8d6a8" roughness={1} />
      </mesh>
      <mesh geometry={top} position={[0, 0.25, 0]} receiveShadow>
        <meshStandardMaterial map={grass} color="#7d9a55" roughness={1} />
      </mesh>
      {/* foam line where the sea meets the beach */}
      <mesh position={[0, 1.42, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[rx * 1.08, rz * 1.08, 1]}>
        <ringGeometry args={[0.97, 1.0, 96]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
};

const Palm: React.FC<{ p: V3; s?: number; lean?: number }> = ({ p, s = 1, lean = 0.15 }) => (
  <group position={p} scale={[s, s, s]} rotation={[0, 0, lean]}>
    <mesh position={[0, 3, 0]} castShadow>
      <cylinderGeometry args={[0.12, 0.2, 6, 8]} />
      <meshStandardMaterial color="#8a6a46" roughness={1} />
    </mesh>
    {Array.from({ length: 7 }, (_, i) => {
      const a = (i / 7) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 1.1, 5.8, Math.sin(a) * 1.1]} rotation={[Math.sin(a) * 0.9, -a, Math.cos(a) * 0.9]} castShadow>
          <boxGeometry args={[2.6, 0.05, 0.55]} />
          <meshStandardMaterial color="#4f8a3a" roughness={0.9} />
        </mesh>
      );
    })}
  </group>
);

/** Vehicle assembly building: huge box with stripes and a flag panel. */
const Hangar: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => {
  const flag = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 160;
    const g = c.getContext("2d")!;
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i % 2 ? "#ffffff" : "#b22234";
      g.fillRect(0, (i * 160) / 13, 256, 160 / 13 + 1);
    }
    g.fillStyle = "#3c3b6e";
    g.fillRect(0, 0, 104, 86);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <RB p={[0, 30, 0]} s={[48, 60, 36]} r={0.4} color="#d9dad6" rough={0.8} />
      {/* vertical panel lines */}
      {Array.from({ length: 11 }, (_, i) => (
        <RB key={i} p={[-22 + i * 4.4, 30, 18.05]} s={[0.25, 60, 0.12]} r={0.05} color="#b9bbb6" rough={0.8} />
      ))}
      {/* tall doors */}
      <RB p={[-8, 22, 18.1]} s={[10, 44, 0.3]} r={0.1} color="#9fa3a6" rough={0.7} metal={0.3} />
      {/* flag */}
      <mesh position={[13, 44, 18.12]}>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial map={flag} roughness={0.8} />
      </mesh>
      {/* low annex */}
      <RB p={[30, 8, 0]} s={[16, 16, 30]} r={0.3} color="#cfd0cc" rough={0.8} />
    </group>
  );
};

/** Spherical liquid-oxygen tank on legs (white), as at real pads. */
const SphereTank: React.FC<{ p: V3; r?: number }> = ({ p, r = 7 }) => (
  <group position={p}>
    <mesh position={[0, r + 3, 0]} castShadow receiveShadow>
      <sphereGeometry args={[r, 40, 28]} />
      <meshStandardMaterial color="#f1f1ee" roughness={0.5} metalness={0.1} />
    </mesh>
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * Math.PI * 2;
      return <RB key={i} p={[Math.cos(a) * r * 0.75, (r + 3) / 2, Math.sin(a) * r * 0.75]} s={[0.5, r + 3, 0.5]} r={0.05} color="#9aa0a5" metal={0.5} rough={0.5} />;
    })}
  </group>
);

/** Lightning protection mast (tall slim tower with a thin catenary wire to the next). */
const Mast: React.FC<{ p: V3; h?: number }> = ({ p, h = 80 }) => (
  <group position={p}>
    <mesh position={[0, h / 2, 0]} castShadow>
      <cylinderGeometry args={[0.35, 0.8, h, 10]} />
      <meshStandardMaterial color="#d8dadc" roughness={0.6} metalness={0.4} />
    </mesh>
    <mesh position={[0, h + 3, 0]}>
      <cylinderGeometry args={[0.05, 0.12, 6, 6]} />
      <meshStandardMaterial color="#555" />
    </mesh>
  </group>
);

/** Thin wire between two points (lightning catenary). */
const Wire: React.FC<{ a: V3; b: V3 }> = ({ a, b }) => {
  const curve = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const M = A.clone().add(B).multiplyScalar(0.5);
    M.y -= A.distanceTo(B) * 0.12;
    return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, M, B), 40, 0.05, 4, false);
  }, [a, b]);
  return (
    <mesh geometry={curve}>
      <meshStandardMaterial color="#3a3d40" />
    </mesh>
  );
};

export const Spaceport: React.FC<{ pad: V3 }> = ({ pad }) => {
  const palms = useMemo(() => {
    const r = seeded(77);
    return Array.from({ length: 26 }, () => {
      const a = r() * Math.PI * 2;
      const k = 0.78 + r() * 0.14;
      return { p: [pad[0] + 40 + Math.cos(a) * 150 * k, 1.4, pad[2] - 90 + Math.sin(a) * 110 * k] as V3, s: 0.8 + r() * 0.5, lean: (r() - 0.5) * 0.4 };
    }).filter((q) => Math.hypot(q.p[0] - pad[0], q.p[2] - pad[2]) > 30);
  }, [pad]);
  const masts: V3[] = [
    [pad[0] - 24, 1.4, pad[2] - 24],
    [pad[0] + 24, 1.4, pad[2] - 24],
    [pad[0] - 24, 1.4, pad[2] + 22],
    [pad[0] + 24, 1.4, pad[2] + 22],
  ];
  return (
    <group>
      <Island c={[pad[0] + 40, 0, pad[2] - 90]} rx={160} rz={115} />
      {/* road from the hangar to the pad */}
      <RB p={[pad[0] + 30, 1.62, pad[2] - 60]} s={[12, 0.08, 64]} r={0.02} color="#5a5d60" rough={0.95} />
      <Hangar p={[pad[0] + 40, 1.4, pad[2] - 120]} ry={-0.1} />
      <SphereTank p={[pad[0] + 38, 1.4, pad[2] - 8]} />
      <SphereTank p={[pad[0] - 34, 1.4, pad[2] - 14]} r={5.5} />
      {/* water tower for the sound-suppression deluge */}
      <group position={[pad[0] + 52, 1.4, pad[2] - 40]}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + 0.4;
          return <RB key={i} p={[Math.cos(a) * 3, 30, Math.sin(a) * 3]} s={[0.4, 60, 0.4]} r={0.05} color="#9aa0a5" metal={0.5} />;
        })}
        <mesh position={[0, 64, 0]} castShadow>
          <cylinderGeometry args={[5, 5, 10, 32]} />
          <meshStandardMaterial color="#e8e9ea" roughness={0.6} />
        </mesh>
        <mesh position={[0, 70.5, 0]}>
          <coneGeometry args={[5.3, 3, 32]} />
          <meshStandardMaterial color="#cfd1d3" roughness={0.6} />
        </mesh>
      </group>
      {masts.map((m, i) => (
        <Mast key={i} p={m} />
      ))}
      <Wire a={add(masts[0], [0, 83, 0])} b={add(masts[1], [0, 83, 0])} />
      <Wire a={add(masts[2], [0, 83, 0])} b={add(masts[3], [0, 83, 0])} />
      <Wire a={add(masts[0], [0, 83, 0])} b={add(masts[2], [0, 83, 0])} />
      <Wire a={add(masts[1], [0, 83, 0])} b={add(masts[3], [0, 83, 0])} />
      {palms.map((q, i) => (
        <Palm key={i} p={q.p} s={q.s} lean={q.lean} />
      ))}
    </group>
  );
};
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ───────────────────────── soft cumulus clouds (billboards) ─────────────────────────
let puffTex: THREE.Texture | null = null;
/** A cumulus puff painted from overlapping soft circles: bright tops, grey flat bottom. */
export const cloudTexture = () => {
  if (puffTex) return puffTex;
  const W = 512;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const r = seeded(5);
  for (let i = 0; i < 46; i++) {
    const x = W * (0.18 + 0.64 * r());
    const rr = 30 + r() * 70;
    const y = H * 0.72 - rr * (0.3 + 0.7 * r()) * (1 - Math.abs(x / W - 0.5) * 1.2);
    const grd = g.createRadialGradient(x - rr * 0.2, y - rr * 0.3, rr * 0.1, x, y, rr);
    grd.addColorStop(0, "rgba(255,255,255,0.95)");
    grd.addColorStop(0.6, "rgba(238,242,248,0.75)");
    grd.addColorStop(1, "rgba(210,218,230,0)");
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, rr, 0, Math.PI * 2);
    g.fill();
  }
  // flat grey base
  const base = g.createLinearGradient(0, H * 0.6, 0, H * 0.8);
  base.addColorStop(0, "rgba(180,190,205,0)");
  base.addColorStop(1, "rgba(160,170,188,0.0)");
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = "rgba(0,0,0,1)";
  g.fillRect(0, H * 0.78, W, H);
  puffTex = new THREE.CanvasTexture(c);
  puffTex.colorSpace = THREE.SRGBColorSpace;
  return puffTex;
};

/** A field of cumulus billboards at a given altitude band around a centre (they always face the camera). */
export const CloudField: React.FC<{ center: V3; y0: number; y1: number; spread: number; n?: number; size?: [number, number]; seed?: number; opacity?: number }> = ({ center, y0, y1, spread, n = 40, size = [300, 800], seed = 2, opacity = 1 }) => {
  const clouds = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: n }, () => ({ x: (r() - 0.5) * spread, z: (r() - 0.5) * spread, y: y0 + r() * (y1 - y0), s: size[0] + r() * (size[1] - size[0]) }));
  }, [n, spread, y0, y1, seed, size]);
  const tex2 = cloudTexture();
  return (
    <group position={[center[0], 0, center[2]]}>
      {clouds.map((q, i) => (
        <sprite key={i} position={[q.x, q.y, q.z]} scale={[q.s, q.s / 2, 1]}>
          <spriteMaterial map={tex2} transparent opacity={opacity} depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
};
