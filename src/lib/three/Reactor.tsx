import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "./core";
import { seeded } from "../timing";

/**
 * A small nuclear plant for gags and explainers: hyperboloid cooling tower with a steam plume,
 * a domed containment building and a turbine hall. 1 unit = 1 m; the tower is `h` tall.
 * Frame-driven: `t` seconds moves the steam, `steam` 0–1 fades it in.
 */
export const CoolingTower: React.FC<{ p?: V3; h?: number; t: number; steam?: number }> = ({ p = [0, 0, 0], h = 12, t, steam = 1 }) => {
  const geo = useMemo(() => {
    // hyperboloid of one sheet: wide base, waist at 70 % height, slight flare at the top
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 40; i++) {
      const y = (i / 40) * h;
      const yc = 0.72 * h;
      const r = 0.24 * h * Math.sqrt(1 + ((y - yc) / (0.42 * h)) ** 2);
      pts.push(new THREE.Vector2(r, y));
    }
    return new THREE.LatheGeometry(pts, 64);
  }, [h]);
  const puffs = useMemo(() => {
    const rnd = seeded(41);
    return Array.from({ length: 26 }, () => ({ ph: rnd(), dx: (rnd() - 0.5) * 0.5, sz: 0.7 + rnd() * 0.6 }));
  }, []);
  const top = h;
  return (
    <group position={p}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#cfcac2" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* red-and-white band near the top, like real towers' aviation marking */}
      <mesh position={[0, top * 0.93, 0]}>
        <cylinderGeometry args={[0.245 * h * 1.06, 0.245 * h * 1.04, h * 0.05, 64, 1, true]} />
        <meshStandardMaterial color="#c8423a" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {puffs.map((q, i) => {
        const u = (((t * 0.09 + q.ph) % 1) + 1) % 1;
        const y = top + u * h * 1.1;
        const x = q.dx * h * 0.3 + u * h * 0.35; // the wind leans the plume
        const size = h * (0.35 + u * 0.9) * q.sz;
        return <Glow key={i} position={[x, y, 0]} size={size} color="#ffffff" opacity={steam * 0.55 * Math.sin(u * Math.PI)} fog={false} />;
      })}
    </group>
  );
};

export const Reactor: React.FC<{ p?: V3; ry?: number; t: number; steam?: number; s?: number }> = ({ p = [0, 0, 0], ry = 0, t, steam = 1, s = 1 }) => (
  <group position={p} rotation={[0, ry, 0]} scale={[s, s, s]}>
    {/* containment dome */}
    <mesh position={[0, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[2.4, 2.4, 3.2, 48]} />
      <meshStandardMaterial color="#e4e1da" roughness={0.85} />
    </mesh>
    <mesh position={[0, 1.6, 0]} castShadow>
      <sphereGeometry args={[2.4, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#e9e6df" roughness={0.8} />
    </mesh>
    {/* turbine hall */}
    <mesh position={[4.2, 0.2, 0]} castShadow receiveShadow>
      <boxGeometry args={[4, 3.6, 3.4]} />
      <meshStandardMaterial color="#9fa8b2" roughness={0.7} />
    </mesh>
    <mesh position={[4.2, 2.1, 0]}>
      <boxGeometry args={[4.1, 0.2, 3.5]} />
      <meshStandardMaterial color="#5d6670" roughness={0.6} />
    </mesh>
    <CoolingTower p={[-5.5, -1.6, -1]} h={9} t={t} steam={steam} />
  </group>
);
