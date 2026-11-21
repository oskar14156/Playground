import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { RB } from "../../lib/three/diorama";
import { seeded } from "../../lib/timing";

// ───────────────────────── a cable / rope between two points ─────────────────────────
export const Cable: React.FC<{ a: V3; b: V3; r?: number; color?: string; strands?: number; frayed?: number }> = ({ a, b, r = 0.03, color = "#c8ccd0", strands = 0, frayed = 0 }) => {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const d = vb.clone().sub(va);
  const len = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  if (len < 0.001) return null;
  if (!strands)
    return (
      <mesh position={va.clone().add(vb).multiplyScalar(0.5).toArray()} quaternion={q}>
        <cylinderGeometry args={[r, r, len, 8]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
      </mesh>
    );
  // several twisted strands; `frayed` 0–1 snaps them one after another (red ends)
  const broken = Math.floor(frayed * strands);
  return (
    <group position={va.toArray()} quaternion={q}>
      {Array.from({ length: strands }, (_, i) => {
        const a0 = (i / strands) * Math.PI * 2;
        const ok = i >= broken;
        const off: V3 = [Math.cos(a0) * r * 0.6, 0, Math.sin(a0) * r * 0.6];
        return ok ? (
          <mesh key={i} position={[off[0], len / 2, off[2]]}>
            <cylinderGeometry args={[r * 0.45, r * 0.45, len, 6]} />
            <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
          </mesh>
        ) : (
          <group key={i}>
            {/* snapped strand: two short curled ends near the break point */}
            <mesh position={[off[0] * 3, len * 0.5 + 0.18, off[2] * 3]} rotation={[0.6, a0, 0.5]}>
              <cylinderGeometry args={[r * 0.45, r * 0.45, 0.4, 6]} />
              <meshStandardMaterial color="#ff4d3a" emissive="#ff2a1a" emissiveIntensity={1.2} />
            </mesh>
            <mesh position={[off[0] * 3, len * 0.5 - 0.18, off[2] * 3]} rotation={[-0.6, a0, -0.5]}>
              <cylinderGeometry args={[r * 0.45, r * 0.45, 0.4, 6]} />
              <meshStandardMaterial color="#ff4d3a" emissive="#ff2a1a" emissiveIntensity={1.2} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ───────────────────────── giant drinking glass used as a diving bell ─────────────────────────
export const GLASS = { r: 1.05, h: 2.7 };
/** Origin = centre of the rim. `flip` 0 = upright (rim on top), 1 = upside down (rim at the bottom).
 * `water` 0–1 = fraction of the inside filled from the rim. */
export const GiantGlass: React.FC<{ flip: number; water: number; children?: React.ReactNode }> = ({ flip, water, children }) => {
  const { r, h } = GLASS;
  const glass = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#e8fbff", roughness: 0.04, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
    [],
  );
  const rimGlass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.55, depthWrite: false }), []);
  const hw = h * Math.min(0.98, Math.max(0, water));
  // the glass body points from the rim (y=0) towards the base (y=+h) when upside down
  return (
    <group rotation={[0, 0, Math.PI * (1 - flip)]}>
      <mesh position={[0, h / 2, 0]} material={glass}>
        <cylinderGeometry args={[r * 0.92, r, h, 48, 1, true]} />
      </mesh>
      {/* thick base */}
      <mesh position={[0, h - 0.06, 0]} material={rimGlass}>
        <cylinderGeometry args={[r * 0.92, r * 0.92, 0.14, 48]} />
      </mesh>
      {/* rounded rim */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={rimGlass}>
        <torusGeometry args={[r, 0.035, 10, 64]} />
      </mesh>
      {/* glints */}
      {[-0.55, 0.62].map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * r * 0.97, h * 0.5, Math.cos(a) * r * 0.97]} rotation={[0, a, 0]}>
          <planeGeometry args={[0.08 + i * 0.05, h * 0.8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.35} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {/* water that got in (from the rim up) */}
      {hw > 0.01 && flip > 0.99 ? (
        <group>
          <mesh position={[0, hw / 2, 0]}>
            <cylinderGeometry args={[r * 0.9 + (1 - hw / h) * r * 0.08, r * 0.985, hw, 48]} />
            <meshStandardMaterial color="#2c7dff" emissive="#0b46d0" emissiveIntensity={0.35} transparent opacity={0.55} depthWrite={false} />
          </mesh>
          <mesh position={[0, hw, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[r * 0.9 + (1 - hw / h) * r * 0.08, 48]} />
            <meshStandardMaterial color="#9fd8ff" emissive="#4aa8ff" emissiveIntensity={0.6} transparent opacity={0.6} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ) : null}
      {children}
    </group>
  );
};

// ───────────────────────── a real nuclear submarine (≈ 100 m, size ladder) ─────────────────────────
/** Long black attack submarine, nose at +X, origin mid-hull, real scale (length 100 m, Ø 10 m). */
export const RealSub: React.FC<{ t: number }> = ({ t }) => {
  const hull = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const L = 100;
    for (let i = 0; i <= 80; i++) {
      const u = i / 80; // 0 = tail tip, 1 = nose
      let rr = 5;
      if (u < 0.28) rr = 5 * Math.pow(u / 0.28, 0.55) * (0.15 + 0.85 * (u / 0.28));
      if (u > 0.9) rr = 5 * Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.9) / 0.1, 2)));
      pts.push(new THREE.Vector2(Math.max(0.05, rr), -L / 2 + u * L));
    }
    const g = new THREE.LatheGeometry(pts, 48);
    g.rotateZ(-Math.PI / 2);
    return g;
  }, []);
  const prop = t * 3;
  return (
    <group>
      <mesh geometry={hull} castShadow receiveShadow>
        <meshStandardMaterial color="#3a4550" roughness={0.6} metalness={0.25} />
      </mesh>
      {/* sail with fairwater planes */}
      <RB p={[22, 7.5, 0]} s={[11, 6, 2.6]} r={1.1} color="#3a4550" rough={0.6} />
      <RB p={[23, 8.2, 0]} s={[3.2, 0.35, 9]} r={0.15} color="#1a1f24" rough={0.7} />
      {/* cross tail + pump jet */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-44, 0, 0]} rotation={[(i * Math.PI) / 2, 0, 0]}>
          <boxGeometry args={[6, 0.4, 9]} />
          <meshStandardMaterial color="#1a1f24" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[-49, 0, 0]} rotation={[prop, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.6, 1.4, 2.4, 24, 1, true]} />
        <meshStandardMaterial color="#2a3036" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* draught marks + a few hull lines so the size reads */}
      {[-20, -5, 10, 30].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[5.02, 0.06, 6, 48]} />
          <meshStandardMaterial color="#2c333b" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
};

// ───────────────────────── pressure arrows around a hull (side view, XY plane) ─────────────────────────
export const PressureArrows: React.FC<{ len: number; r: number; o: number; push: number; color?: string; n?: number }> = ({ len, r, o, push, color = "#ff3b30", n = 16 }) => {
  // points on the capsule outline (in the XY plane) with inward normals
  const pts = useMemo(() => {
    const out: { p: THREE.Vector2; nrm: THREE.Vector2 }[] = [];
    const per = 2 * len + 2 * Math.PI * r;
    for (let i = 0; i < n; i++) {
      let s = (i / n) * per;
      let p: THREE.Vector2, nrm: THREE.Vector2;
      if (s < len) {
        p = new THREE.Vector2(-len / 2 + s, r);
        nrm = new THREE.Vector2(0, 1);
      } else if ((s -= len) < Math.PI * r) {
        const a = Math.PI / 2 - s / r;
        nrm = new THREE.Vector2(Math.cos(a), Math.sin(a));
        p = new THREE.Vector2(len / 2, 0).add(nrm.clone().multiplyScalar(r));
      } else if ((s -= Math.PI * r) < len) {
        p = new THREE.Vector2(len / 2 - s, -r);
        nrm = new THREE.Vector2(0, -1);
      } else {
        s -= len;
        const a = -Math.PI / 2 - s / r;
        nrm = new THREE.Vector2(Math.cos(a), Math.sin(a));
        p = new THREE.Vector2(-len / 2, 0).add(nrm.clone().multiplyScalar(r));
      }
      out.push({ p, nrm });
    }
    return out;
  }, [len, r, n]);
  if (o <= 0.001) return null;
  return (
    <group>
      {pts.map(({ p, nrm }, i) => {
        const gap = 0.25 + 0.35 * (1 - push);
        const tip = p.clone().add(nrm.clone().multiplyScalar(gap));
        const tail = p.clone().add(nrm.clone().multiplyScalar(gap + 1.0));
        const mid = tip.clone().add(tail).multiplyScalar(0.5);
        const ang = Math.atan2(-nrm.x, nrm.y); // local +Y → outward normal, so the head (−Y) points in
        return (
          <group key={i} position={[mid.x, mid.y, 1.6]} rotation={[0, 0, ang]} scale={[o, o, o]}>
            <mesh position={[0, 0.12, 0]}>
              <boxGeometry args={[0.12, 0.7, 0.04]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.38, 0]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.22, 0.34, 3]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ───────────────────────── sonar ping ring (expanding circle facing the camera) ─────────────────────────
export const PingRing: React.FC<{ c: V3; radius: number; o: number; color?: string; width?: number }> = ({ c, radius, o, color = "#5dfcff", width = 0.6 }) => {
  if (o <= 0.001 || radius <= 0.01) return null;
  return (
    <group position={c}>
      <mesh>
        <ringGeometry args={[Math.max(0, radius - width), radius, 128]} />
        <meshBasicMaterial color={color} transparent opacity={o} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <ringGeometry args={[Math.max(0, radius - width * 4), radius - width, 128]} />
        <meshBasicMaterial color={color} transparent opacity={o * 0.18} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

// ───────────────────────── splash + rising bubbles ─────────────────────────
export const Splash: React.FC<{ p: V3; k: number; size?: number }> = ({ p, k, size = 1 }) => {
  const drops = useMemo(() => {
    const r = seeded(41);
    return Array.from({ length: 26 }, () => ({ a: r() * Math.PI * 2, v: 2 + r() * 4, up: 3 + r() * 5, s: 0.08 + r() * 0.14 }));
  }, []);
  if (k <= 0 || k >= 1) return null;
  const tt = k * 1.1;
  return (
    <group position={p}>
      {drops.map((d, i) => {
        const x = Math.cos(d.a) * d.v * tt * 0.5 * size;
        const z = Math.sin(d.a) * d.v * tt * 0.3 * size;
        const y = (d.up * tt - 4.9 * tt * tt) * size;
        return y > -0.1 ? <Glow key={i} position={[x, y, z]} size={d.s * 3 * size} color="#ffffff" opacity={0.9 * (1 - k)} /> : null;
      })}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2 + k * 2.4 * size, 0.45 + k * 2.6 * size, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7 * (1 - k)} depthWrite={false} />
      </mesh>
    </group>
  );
};

export const Bubbles: React.FC<{ p: V3; t: number; o: number; n?: number; spread?: number; rise?: number; seed?: number }> = ({ p, t, o, n = 14, spread = 0.4, rise = 3, seed = 3 }) => {
  const b = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: n }, () => ({ ph: r(), x: (r() - 0.5) * spread, z: (r() - 0.5) * spread, s: 0.04 + r() * 0.07 }));
  }, [n, spread, seed]);
  if (o <= 0.001) return null;
  return (
    <group position={p}>
      {b.map((q, i) => {
        const u = (((t * 0.8 + q.ph) % 1) + 1) % 1;
        return <Glow key={i} position={[q.x + Math.sin(u * 9 + i) * 0.08, u * rise, q.z]} size={q.s * 2.6} color="#e9fbff" opacity={o * 0.9 * Math.sin(u * Math.PI)} />;
      })}
    </group>
  );
};

// ───────────────────────── cabin interior (x-ray beats) ─────────────────────────
/** Inside the sub hull (hull space, nose +X): floor, seat, control panel, battery rack, and the add-ons. */
export const Cabin: React.FC<{ R: number; L: number; scrub: number; o2: number; screens: number; batt: number }> = ({ R, L, scrub, o2, screens, batt }) => {
  const fy = -R * 0.55;
  return (
    <group>
      {/* floor grating */}
      <RB p={[0, fy, 0]} s={[L + R * 0.6, 0.05, R * 1.4]} r={0.02} color="#4a5058" rough={0.6} metal={0.5} />
      {/* control panel in the nose */}
      <RB p={[L / 2 + R * 0.25, fy + 0.55, 0]} s={[0.25, 0.7, 1.2]} r={0.04} color="#2a2f35" rough={0.4} metal={0.5} />
      {[-0.3, 0.3].map((z) => (
        <RB key={z} p={[L / 2 + R * 0.12, fy + 0.72, z]} s={[0.02, 0.28, 0.42]} r={0.01} color="#0b1a12" emissive="#3dff9a" ei={0.8 * screens} />
      ))}
      {/* pilot seat */}
      <RB p={[L / 2 - 0.55, fy + 0.25, 0]} s={[0.55, 0.12, 0.55]} r={0.04} color="#c0392b" rough={0.7} />
      <RB p={[L / 2 - 0.82, fy + 0.6, 0]} s={[0.1, 0.65, 0.55]} r={0.04} color="#c0392b" rough={0.7} />
      <RB p={[L / 2 - 0.55, fy + 0.12, 0]} s={[0.12, 0.24, 0.12]} r={0.02} color="#30363c" />
      {/* battery rack under the floor */}
      {[-1.4, -0.7, 0, 0.7].map((x) => (
        <RB key={x} p={[x, fy - 0.3, 0]} s={[0.55, 0.4, 0.8]} r={0.03} color="#2b2f36" emissive={batt > 0.5 ? "#22c55e" : "#ef4444"} ei={0.25} />
      ))}
      {/* CO₂ scrubber (orange box with a fan) */}
      {scrub > 0.01 ? (
        <group position={[-L / 2 + 0.2, fy + 0.62, -0.35]} scale={[scrub, scrub, scrub]}>
          <RB p={[0, 0, 0]} s={[0.7, 0.9, 0.55]} r={0.05} color="#ff8a1f" rough={0.5} />
          <mesh position={[0.36, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 24]} />
            <meshStandardMaterial color="#2a2f35" />
          </mesh>
        </group>
      ) : null}
      {/* oxygen generator (blue tank with a water pipe) */}
      {o2 > 0.01 ? (
        <group position={[-L / 2 + 0.25, fy + 0.6, 0.4]} scale={[o2, o2, o2]}>
          <mesh>
            <cylinderGeometry args={[0.24, 0.24, 0.95, 24]} />
            <meshStandardMaterial color="#2f7dff" roughness={0.35} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <sphereGeometry args={[0.24, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#2f7dff" roughness={0.35} metalness={0.3} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};
