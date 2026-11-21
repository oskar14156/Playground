import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { seeded } from "../../lib/timing";

/**
 * Fibre-optic look-dev pieces for the LIGHT beat. All axes along +X.
 *
 * 1. CableAnatomy — a deep-sea ("lightweight") telecom cable, ~17 mm, cut back in steps like a product cutaway:
 *    polyethylene sheath → copper tube (carries the power for the amplifiers) → stranded steel wires (strength) →
 *    steel tube filled with gel → 8 coloured glass fibres. Radius 1 unit ≈ 8.5 mm.
 *    `peel` 0–1 retracts the layers one after another (0 = closed cable, 1 = every layer stepped back).
 * 2. FibreLayers — one fibre: coloured acrylate coating (0.25 mm) → glass cladding (0.125 mm) → core (0.009 mm),
 *    next to a human hair (~0.08 mm). 1 unit = 0.1 mm.
 * 3. FibreCore — inside the core: the light ray bouncing off the core/cladding boundary (total internal reflection),
 *    carrying a train of pulses (1 = light, 0 = dark). Core radius 1 unit.
 */

// ───────────────────────── 1. the cable ─────────────────────────
export const ANATOMY = {
  sheath: { r: 1.0, end0: 6, end1: -3.2 },
  copper: { r: 0.66, end0: 6, end1: -1.4 },
  wires: { r: 0.52, end0: 6, end1: 0.6 },
  tube: { r: 0.3, end0: 6, end1: 2.6 },
  fibres: { r: 0.16, end: 5.6 },
  start: -14,
};
const FIBRE_COLORS = ["#2f6fd6", "#ff8a1a", "#2fb34a", "#8a5a2a", "#7d8a96", "#f4f4f0", "#e2342a", "#1c1c1c"];

/** a ring-shaped (hollow) tube segment along X from x0 to x1, outer radius r, wall `wall` */
const Shell: React.FC<{ x0: number; x1: number; r: number; wall: number; color: string; metal?: number; rough?: number; cap?: string }> = ({ x0, x1, r, wall, color, metal = 0, rough = 0.5, cap }) => {
  if (x1 - x0 < 0.01) return null;
  const len = x1 - x0;
  const mid = (x0 + x1) / 2;
  return (
    <group>
      <mesh position={[mid, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, len, 64, 1, true]} />
        <meshStandardMaterial color={color} metalness={metal} roughness={rough} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[mid, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r - wall, r - wall, len, 64, 1, true]} />
        <meshStandardMaterial color={color} metalness={metal} roughness={rough} side={THREE.BackSide} />
      </mesh>
      {/* the cut face: a flat ring at the end */}
      <mesh position={[x1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[r - wall, r, 64]} />
        <meshStandardMaterial color={cap ?? color} metalness={metal} roughness={rough + 0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export const CableAnatomy: React.FC<{ t: number; peel: number; glow?: number }> = ({ t, peel, glow = 1 }) => {
  const A = ANATOMY;
  // each layer retracts in its own slice of `peel`
  const step = (i: number, from: number, to: number) => {
    const k = THREE.MathUtils.clamp(peel * 4 - i, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    return from + (to - from) * e;
  };
  const eS = step(0, A.sheath.end0, A.sheath.end1);
  const eC = step(1, A.copper.end0, A.copper.end1);
  const eW = step(2, A.wires.end0, A.wires.end1);
  const eT = step(3, A.tube.end0, A.tube.end1);
  // 18 helical steel wires
  const wires = useMemo(() => {
    const out: THREE.TubeGeometry[] = [];
    const n = 18;
    for (let i = 0; i < n; i++) {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 120; k++) {
        const x = A.start + ((A.wires.end0 - A.start) * k) / 120;
        const a = (i / n) * Math.PI * 2 + x * 0.32;
        pts.push(new THREE.Vector3(x, Math.cos(a) * (A.wires.r - 0.08), Math.sin(a) * (A.wires.r - 0.08)));
      }
      out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.075, 8, false));
    }
    return out;
  }, []);
  // the wires are cut at eW with a clipping plane (keeps the helix exact)
  const clipW = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), []);
  clipW.constant = eW;
  // 8 fibres: a bundle that fans out a little past the tube end
  const fibres = useMemo(
    () =>
      FIBRE_COLORS.map((col, i) => {
        const a = (i / FIBRE_COLORS.length) * Math.PI * 2;
        const r0 = i === 0 ? 0 : 0.12;
        const a0 = i === 0 ? 0 : a;
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 40; k++) {
          const x = A.start + ((A.fibres.end - A.start) * k) / 40;
          const fan = Math.max(0, x - A.tube.end1) * 0.07;
          pts.push(new THREE.Vector3(x, Math.cos(a0) * (r0 + fan) + (i === 0 ? fan : 0), Math.sin(a0) * (r0 + fan)));
        }
        return { col, curve: new THREE.CatmullRomCurve3(pts) };
      }),
    [],
  );
  const r = seeded(3);
  return (
    <group>
      {/* sheath: natural polyethylene, slightly translucent-looking off-white over black */}
      <Shell x0={A.start} x1={eS} r={A.sheath.r} wall={0.3} color="#1d222b" rough={0.35} cap="#2a303a" />
      <Shell x0={A.start} x1={eC} r={A.copper.r} wall={0.07} color="#c8743f" metal={0.9} rough={0.32} />
      <group>
        {wires.map((g, i) => (
          <mesh key={i} geometry={g} castShadow>
            <meshStandardMaterial color="#b8c0c9" metalness={0.92} roughness={0.28} clippingPlanes={[clipW]} />
          </mesh>
        ))}
      </group>
      <Shell x0={A.start} x1={eT} r={A.tube.r} wall={0.05} color="#d9dee4" metal={0.95} rough={0.18} />
      {/* the gel around the fibres (where the tube is open) */}
      <mesh position={[(A.start + eT) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[A.tube.r - 0.06, A.tube.r - 0.06, eT - A.start, 32]} />
        <meshStandardMaterial color="#e8d9a0" transparent opacity={0.35} roughness={0.2} depthWrite={false} />
      </mesh>
      {fibres.map((q, i) => (
        <group key={i}>
          <mesh>
            <tubeGeometry args={[q.curve, 80, 0.034, 10, false]} />
            <meshStandardMaterial color={q.col} roughness={0.35} metalness={0.05} />
          </mesh>
          {/* the light coming out of each fibre end */}
          {glow > 0 ? (
            <>
              <Glow position={q.curve.getPoint(1)} size={0.35 + 0.08 * Math.sin(t * 6 + i)} color="#9ff4ff" opacity={glow * (0.85 + 0.15 * r())} />
              <mesh position={q.curve.getPoint(1)}>
                <sphereGeometry args={[0.03, 10, 8]} />
                <meshBasicMaterial color="#e8fdff" toneMapped={false} />
              </mesh>
            </>
          ) : null}
        </group>
      ))}
    </group>
  );
};
/** world points for the anatomy labels (on each layer's step) */
export const anatomyPoints = (peel: number): Record<"sheath" | "copper" | "wires" | "tube" | "fibres", V3> => {
  const A = ANATOMY;
  const k = (i: number) => 1 - Math.pow(1 - THREE.MathUtils.clamp(peel * 4 - i, 0, 1), 3);
  return {
    sheath: [A.sheath.end0 + (A.sheath.end1 - A.sheath.end0) * k(0) - 0.6, A.sheath.r, 0.3],
    copper: [A.copper.end0 + (A.copper.end1 - A.copper.end0) * k(1) - 0.4, A.copper.r, 0.3],
    wires: [A.wires.end0 + (A.wires.end1 - A.wires.end0) * k(2) - 0.4, A.wires.r, 0.2],
    tube: [A.tube.end0 + (A.tube.end1 - A.tube.end0) * k(3) - 0.3, A.tube.r, 0.1],
    fibres: [A.fibres.end, 0.3, 0],
  };
};

// ───────────────────────── 2. one fibre next to a hair ─────────────────────────
/** 1 unit = 0.1 mm: coating r 1.25 (0.25 mm Ø), cladding r 0.625 (0.125 mm Ø), core r 0.045 (9 µm Ø, drawn 0.06) */
export const FibreLayers: React.FC<{ t: number; hair: number; pulse: number }> = ({ t, hair, pulse }) => {
  const hairGeo = useMemo(() => {
    const pts = Array.from({ length: 40 }, (_, i) => new THREE.Vector3(-14 + (26 * i) / 39, -2.2 + 0.25 * Math.sin(i * 0.3), 0.6 * Math.cos(i * 0.21)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.4, 16, false);
  }, []);
  // cuticle scales on the hair: a subtle ring texture
  const hairTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "#5a3826";
    g.fillRect(0, 0, 512, 64);
    g.strokeStyle = "rgba(30,16,8,0.55)";
    g.lineWidth = 3;
    for (let x = 0; x < 512; x += 14) {
      g.beginPath();
      g.moveTo(x, 0);
      g.quadraticCurveTo(x + 8, 32, x, 64);
      g.stroke();
    }
    const tx = new THREE.CanvasTexture(c);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(6, 1);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }, []);
  const coatEnd = -3;
  const cladEnd = 2.5;
  const coreEnd = 6;
  const px = -14 + 20 * pulse;
  return (
    <group>
      {/* blue acrylate coating, stepped back */}
      <mesh position={[(-14 + coatEnd) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[1.25, 1.25, coatEnd + 14, 64]} />
        <meshStandardMaterial color="#2f6fd6" roughness={0.3} />
      </mesh>
      <mesh position={[coatEnd, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <ringGeometry args={[0.625, 1.25, 64]} />
        <meshStandardMaterial color="#5a8ae6" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* glass cladding */}
      <mesh position={[(-14 + cladEnd) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.625, 0.625, cladEnd + 14, 64, 1, true]} />
        <meshPhysicalMaterial color="#e6f8ff" roughness={0.04} transmission={0.85} thickness={0.6} ior={1.46} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[cladEnd, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <circleGeometry args={[0.625, 64]} />
        <meshPhysicalMaterial color="#dff6ff" roughness={0.05} transmission={0.8} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* the core, glowing, sticking out a little further */}
      <mesh position={[(-14 + coreEnd) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, coreEnd + 14, 16]} />
        <meshStandardMaterial color="#9ff4ff" emissive="#3fd8ff" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <Glow position={[coreEnd, 0, 0]} size={1.6} color="#9ff4ff" opacity={0.9} />
      {pulse > 0 && pulse < 1 ? <Glow position={[px, 0, 0]} size={1.4} color="#e8fdff" opacity={1} /> : null}
      {hair > 0 ? (
        <mesh geometry={hairGeo} scale={[1, 1, 1]} position={[0, -0.6 * (1 - hair), 0]}>
          <meshStandardMaterial map={hairTex} roughness={0.5} transparent opacity={hair} />
        </mesh>
      ) : null}
      <Glow position={[Math.sin(t) * 0.3, 0, 0]} size={0.3} color="#7ff6ff" opacity={0.15} />
    </group>
  );
};

// ───────────────────────── 3. inside the core ─────────────────────────
export const CORE_LEN = 60;
/** the zig-zag path of the light inside the core (radius 1): bounces every `hop` units */
const rayPath = (hop = 3.2) => {
  const pts: THREE.Vector3[] = [];
  for (let x = -CORE_LEN / 2, i = 0; x <= CORE_LEN / 2 + 0.01; x += hop / 2, i++) pts.push(new THREE.Vector3(x, i % 2 ? 0.92 : -0.92, i % 2 ? 0.25 : -0.25));
  return pts;
};
/** pulses along the ray: 1 0 1 1 0 1 0 0 … as bright dashes, moving with `t` */
const BITS = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1];
export const FibreCore: React.FC<{ t: number; o?: number; speed?: number }> = ({ t, o = 1, speed = 9 }) => {
  const path = useMemo(() => rayPath(), []);
  const curve = useMemo(() => new THREE.CurvePath<THREE.Vector3>(), []);
  if (curve.curves.length === 0) for (let i = 0; i < path.length - 1; i++) curve.add(new THREE.LineCurve3(path[i], path[i + 1]));
  const rayGeo = useMemo(() => new THREE.TubeGeometry(curve as unknown as THREE.Curve<THREE.Vector3>, path.length * 4, 0.035, 8, false), [curve, path.length]);
  const total = curve.getLength();
  const pulses: { p: THREE.Vector3; on: number }[] = [];
  const spacing = 3.4;
  const head = (t * speed) % (BITS.length * spacing);
  for (let i = 0; i < 18; i++) {
    const d = head + i * spacing;
    const bit = BITS[i % BITS.length];
    const u = (d % total) / total;
    pulses.push({ p: curve.getPointAt(u), on: bit });
  }
  const bounces = path.slice(1, -1);
  return (
    <group>
      {/* the core: clear glass tube; the cladding around it: a bigger, slightly frosted glass */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1, 1, CORE_LEN, 64, 1, true]} />
        <meshPhysicalMaterial color="#9fe9ff" roughness={0.05} transmission={0.6} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} emissive="#1a6a8a" emissiveIntensity={0.25} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[3.2, 3.2, CORE_LEN, 64, 1, true]} />
        <meshPhysicalMaterial color="#cfe8f2" roughness={0.25} transmission={0.4} transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* rings that mark the core wall so its shape reads */}
      {Array.from({ length: 31 }, (_, i) => (
        <mesh key={i} position={[-CORE_LEN / 2 + i * 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1, 0.008, 6, 48]} />
          <meshBasicMaterial color="#7fe6ff" transparent opacity={0.35 * o} />
        </mesh>
      ))}
      {/* the ray */}
      <mesh geometry={rayGeo}>
        <meshBasicMaterial color="#5fd8ff" transparent opacity={0.35 * o} toneMapped={false} />
      </mesh>
      {/* bounce points flash softly on the wall */}
      {bounces.map((b, i) => (
        <Glow key={i} position={b} size={0.5} color="#7ff6ff" opacity={0.35 * o} />
      ))}
      {/* the pulses: a 1 is a bright packet of light, a 0 is a gap */}
      {pulses.map((q, i) =>
        q.on ? (
          <group key={i}>
            <Glow position={q.p} size={1.3} color="#e8fdff" opacity={o} />
            <mesh position={q.p}>
              <sphereGeometry args={[0.09, 12, 8]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
          </group>
        ) : null,
      )}
    </group>
  );
};
/** the bit (0/1) of the pulse that is nearest to screen-space x in the core, for labels */
export const bitPulses = (t: number, speed = 9) => {
  const path = rayPath();
  const curve = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < path.length - 1; i++) curve.add(new THREE.LineCurve3(path[i], path[i + 1]));
  const total = curve.getLength();
  const spacing = 3.4;
  const head = (t * speed) % (BITS.length * spacing);
  return Array.from({ length: 18 }, (_, i) => ({ p: curve.getPointAt(((head + i * spacing) % total) / total), bit: BITS[i % BITS.length] }));
};
