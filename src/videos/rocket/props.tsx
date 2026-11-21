import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { labelTex, RB } from "../../lib/three/diorama";
import { seeded } from "../../lib/timing";

// Props for the rocket build reel (1 unit = 1 m).

/** Aluminium ladder from y = 0 up to `h` (only the part within ±`window` of `around` is built, so it can be 100 km). */
export const Ladder: React.FC<{ h: number; around?: number; window?: number }> = ({ h, around = 0, window = 60 }) => {
  const y0 = Math.max(0, around - window);
  const y1 = Math.min(h, around + window);
  if (y1 <= y0) return null;
  const rungs: number[] = [];
  for (let y = Math.ceil(y0 / 0.3) * 0.3; y < y1; y += 0.3) rungs.push(y);
  return (
    <group>
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[x, (y0 + y1) / 2, 0]} castShadow>
          <boxGeometry args={[0.06, y1 - y0, 0.09]} />
          <meshStandardMaterial color="#c9ced4" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {rungs.map((y) => (
        <mesh key={y.toFixed(2)} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.56, 8]} />
          <meshStandardMaterial color="#b9bec4" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
};

/** Jules Verne's "Columbiad": a giant cast-iron barrel standing on the pad, muzzle up. Origin = base centre. */
export const Columbiad: React.FC<{ h?: number; recoil?: number; flash?: number }> = ({ h = 34, recoil = 0, flash = 0 }) => {
  // cast-iron barrel turned on a lathe: breech, a slow taper, mouldings, a swelling muzzle and the bore going down
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const add = (r: number, y: number) => pts.push(new THREE.Vector2(r, y));
    add(0, 0);
    add(3.15, 0);
    add(3.3, 0.35);
    add(3.3, 1.1);
    add(3.05, 1.3);
    add(3.0, 2.6);
    add(3.2, 2.8);
    add(3.2, 3.4);
    add(2.95, 3.6);
    for (let i = 0; i <= 24; i++) {
      const k = 0.11 + (i / 24) * 0.77;
      const r = 2.92 - 0.95 * k;
      add(r, h * k);
    }
    add(2.12, h * 0.9);
    add(2.3, h * 0.95);
    add(2.5, h * 0.975);
    add(2.55, h - 0.25);
    add(2.4, h);
    add(1.35, h);
    add(1.32, h - 8);
    add(0, h - 8);
    return new THREE.LatheGeometry(pts, 72);
  }, [h]);
  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: "#41464d", metalness: 0.8, roughness: 0.3 }), []);
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b08a4e", metalness: 0.9, roughness: 0.32 }), []);
  const plaque = useMemo(() => labelTex("#b08a4e", "#3b2a14", "COLUMBIAD", "BALTIMORE GUN CLUB · 1865"), []);
  const bands = [0.13, 0.36, 0.62, 0.86];
  return (
    <group position={[0, -recoil * 0.6, 0]}>
      <mesh geometry={geo} material={iron} castShadow receiveShadow />
      {/* brass bands with rivets */}
      {bands.map((k) => {
        const r = 2.92 - 0.95 * k + 0.08;
        return (
          <group key={k} position={[0, h * k, 0]}>
            <mesh material={brass} castShadow>
              <cylinderGeometry args={[r, r, 0.7, 72]} />
            </mesh>
            {Array.from({ length: 20 }, (_, i) => {
              const a = (i / 20) * Math.PI * 2;
              return (
                <mesh key={i} material={brass} position={[Math.sin(a) * (r + 0.02), 0, Math.cos(a) * (r + 0.02)]}>
                  <sphereGeometry args={[0.09, 8, 6]} />
                </mesh>
              );
            })}
          </group>
        );
      })}
      {/* bronze plaque on the breech */}
      <mesh position={[0, 5.6, 2.83]} rotation={[-0.03, 0, 0]}>
        <planeGeometry args={[3.2, 1.6]} />
        <meshStandardMaterial map={plaque} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* stepped stone plinth with bolts */}
      <RB p={[0, -0.35, 0]} s={[8.4, 0.7, 8.4]} r={0.12} color="#8f897f" rough={0.95} />
      <RB p={[0, -0.95, 0]} s={[10, 0.6, 10]} r={0.12} color="#7d776e" rough={0.95} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return (
          <mesh key={i} material={iron} position={[Math.sin(a) * 3.6, 0.1, Math.cos(a) * 3.6]}>
            <cylinderGeometry args={[0.18, 0.22, 0.3, 6]} />
          </mesh>
        );
      })}
      {flash > 0.01 ? (
        <group position={[0, h + 2, 0]}>
          <Glow position={[0, 0, 0]} size={30 * flash} color="#fff1c8" opacity={flash} />
          <Glow position={[0, 6, 0]} size={50 * flash} color="#ff9a3a" opacity={0.7 * flash} />
        </group>
      ) : null}
    </group>
  );
};

/** The Verne shell (aluminium bullet with portholes). Origin = base. */
export const Shell: React.FC = () => (
  <group>
    <mesh position={[0, 1.2, 0]} castShadow>
      <cylinderGeometry args={[1.15, 1.15, 2.4, 40]} />
      <meshStandardMaterial color="#b8bcc2" metalness={0.85} roughness={0.25} />
    </mesh>
    <mesh position={[0, 2.4 + 0.9, 0]} castShadow>
      <coneGeometry args={[1.15, 1.8, 40]} />
      <meshStandardMaterial color="#b8bcc2" metalness={0.85} roughness={0.25} />
    </mesh>
    {[0, 1.6, 3.2].map((a) => (
      <mesh key={a} position={[Math.sin(a) * 1.16, 1.6, Math.cos(a) * 1.16]} rotation={[0, a, 0]}>
        <circleGeometry args={[0.22, 20]} />
        <meshStandardMaterial color="#1b2733" emissive="#ffd38a" emissiveIntensity={0.25} />
      </mesh>
    ))}
  </group>
);

/** Skateboard (deck + trucks + wheels). Origin = ground under its centre, nose towards +X. `spin` rolls the wheels. */
export const Skateboard: React.FC<{ spin?: number }> = ({ spin = 0 }) => (
  <group>
    <RB p={[0, 0.13, 0]} s={[0.82, 0.03, 0.22]} r={0.012} color="#2a2a2e" rough={0.9} />
    <RB p={[0, 0.112, 0]} s={[0.8, 0.012, 0.2]} r={0.005} color="#e8573a" rough={0.6} />
    {[-0.27, 0.27].map((x) => (
      <group key={x} position={[x, 0.05, 0]}>
        <RB p={[0, 0.03, 0]} s={[0.06, 0.04, 0.18]} r={0.01} color="#9aa1a8" metal={0.8} rough={0.3} />
        {[-0.09, 0.09].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, spin, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.035, 14]} />
            <meshStandardMaterial color="#f2e6a0" roughness={0.5} />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);

/** Glossy bowling ball with three finger holes. */
export const BowlingBall: React.FC<{ p: V3; rot?: number; color?: string }> = ({ p, rot = 0, color = "#3a1f8f" }) => (
  <group position={p} rotation={[rot, rot * 0.7, 0]}>
    <mesh castShadow>
      <sphereGeometry args={[0.11, 24, 18]} />
      <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={1} />
    </mesh>
    {[
      [0.03, 0.07],
      [-0.03, 0.07],
      [0, 0.02],
    ].map(([x, y], i) => (
      <mesh key={i} position={[x, y, 0.085]}>
        <sphereGeometry args={[0.014, 10, 8]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
    ))}
  </group>
);

/** Corned-beef sandwich that bursts into floating crumbs (`burst` 0–1, `t` seconds drift). */
export const Sandwich: React.FC<{ p: V3; burst: number; t: number }> = ({ p, burst, t }) => {
  const crumbs = useMemo(() => {
    const r = seeded(65);
    return Array.from({ length: 70 }, () => ({ d: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), v: 0.4 + r() * 1.2, s: 0.012 + r() * 0.03, spin: r() * 6, kind: r() }));
  }, []);
  const whole = 1 - Math.min(1, burst * 3);
  return (
    <group position={p}>
      {whole > 0.01 ? (
        <group rotation={[0.3 + t * 0.4, t * 0.6, 0.2]} scale={[whole, whole, whole]}>
          {[-0.04, 0.04].map((y) => (
            <RB key={y} p={[0, y, 0]} s={[0.2, 0.035, 0.18]} r={0.012} color="#e0b878" rough={0.9} />
          ))}
          <RB p={[0, 0, 0]} s={[0.19, 0.04, 0.17]} r={0.01} color="#c9575a" rough={0.8} />
          <RB p={[0, 0.022, 0]} s={[0.21, 0.008, 0.19]} r={0.004} color="#6fbf4a" rough={0.8} />
        </group>
      ) : null}
      {burst > 0.01
        ? crumbs.map((q, i) => {
            const k = burst * q.v;
            return (
              <mesh key={i} position={[q.d.x * k, q.d.y * k, q.d.z * k]} rotation={[q.spin + t, q.spin * 0.5 + t * 0.7, 0]}>
                <boxGeometry args={[q.s, q.s * 0.7, q.s * 0.9]} />
                <meshStandardMaterial color={q.kind < 0.6 ? "#e0b878" : q.kind < 0.85 ? "#c9575a" : "#6fbf4a"} roughness={0.9} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/** Fishbowl space helmet, worn on the "Head" bone (bone space). */
export const FishbowlHelmet: React.FC = () => (
  <group position={[0, 0.13, 0.05]}>
    <mesh>
      <sphereGeometry args={[0.24, 32, 24]} />
      <meshPhysicalMaterial color="#e8f7ff" roughness={0.03} clearcoat={1} transparent opacity={0.18} depthWrite={false} />
    </mesh>
    <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.15, 0.03, 10, 28]} />
      <meshStandardMaterial color="#d9dde2" metalness={0.8} roughness={0.3} />
    </mesh>
    <mesh position={[0.1, 0.1, 0.18]} rotation={[0, 0.5, 0]}>
      <planeGeometry args={[0.04, 0.12]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
    </mesh>
  </group>
);
