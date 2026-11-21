import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Belgian Malinois (the Secret Service dog) from primitives, real size: ~1.1 m long, 0.62 m at the shoulder.
 * Fawn coat, black mask and ears, black-tipped tail. Faces +X. `run` 0–1 blends standing → gallop
 * (stride ~2.4 gallops/s, use a move speed of ~8 m/s at run = 1 so the paws don't slide). `t` in seconds.
 * Origin = between the paws on the ground.
 */
export const Dog: React.FC<{ t: number; run?: number; bark?: number }> = ({ t, run = 0, bark = 0 }) => {
  const fawn = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b07a3c", roughness: 0.85 }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1d1712", roughness: 0.8 }), []);
  const nose = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0b0b0b", roughness: 0.3 }), []);
  const eye = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a1a0c", roughness: 0.15, metalness: 0.2 }), []);
  const ph = t * 2.4 * Math.PI * 2;
  const bob = run * 0.05 * Math.sin(ph * 2) + (1 - run) * 0.008 * Math.sin(t * 2);
  const pitch = run * 0.08 * Math.sin(ph);
  // legs: [x, z, phase]; front pair and hind pair, gallop = pairs slightly offset
  const legs: [number, number, number, boolean][] = [
    [0.36, 0.1, 0, true],
    [0.36, -0.1, 0.35, true],
    [-0.36, 0.1, Math.PI, false],
    [-0.36, -0.1, Math.PI + 0.35, false],
  ];
  const tail = 0.5 + 0.3 * Math.sin(t * (run > 0.5 ? 9 : 4));
  return (
    <group position={[0, bob, 0]} rotation={[0, 0, pitch]}>
      {/* body: chest + belly + hips */}
      <mesh material={fawn} position={[0.04, 0.58, 0]} rotation={[0, 0, Math.PI / 2 - 0.08]} castShadow>
        <capsuleGeometry args={[0.15, 0.62, 8, 16]} />
      </mesh>
      <mesh material={fawn} position={[0.32, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.19, 16, 12]} />
      </mesh>
      <mesh material={fawn} position={[-0.3, 0.6, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 12]} />
      </mesh>
      {/* darker saddle on the back */}
      <mesh material={dark} position={[0.0, 0.66, 0]} rotation={[0, 0, Math.PI / 2 - 0.08]} scale={[0.85, 1, 0.9]}>
        <capsuleGeometry args={[0.13, 0.42, 6, 12]} />
      </mesh>
      {/* neck + head */}
      <group position={[0.42, 0.72, 0]} rotation={[0, 0, 0.55 - run * 0.35]}>
        <mesh material={fawn} position={[0.1, 0.0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.09, 0.2, 6, 12]} />
        </mesh>
        <group position={[0.26, 0.04, 0]} rotation={[0, 0, -0.55 + run * 0.35]}>
          <mesh material={fawn} castShadow>
            <sphereGeometry args={[0.11, 16, 12]} />
          </mesh>
          {/* black mask + muzzle */}
          <mesh material={dark} position={[0.13, -0.03, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.055, 0.12, 6, 12]} />
          </mesh>
          <mesh material={nose} position={[0.22, -0.02, 0]}>
            <sphereGeometry args={[0.028, 10, 8]} />
          </mesh>
          {/* jaw opens when barking */}
          <mesh material={dark} position={[0.12, -0.08, 0]} rotation={[0, 0, -0.2 - 0.4 * bark]}>
            <boxGeometry args={[0.13, 0.025, 0.06]} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh material={eye} position={[0.08, 0.04, s * 0.06]}>
                <sphereGeometry args={[0.018, 10, 8]} />
              </mesh>
              {/* tall pointed ears */}
              <mesh material={dark} position={[-0.02, 0.15, s * 0.06]} rotation={[s * 0.25, 0, -0.15]} castShadow>
                <coneGeometry args={[0.045, 0.14, 4]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
      {/* legs: upper + lower with a knee, paws */}
      {legs.map(([x, z, p, front], i) => {
        const swing = run * 0.75 * Math.sin(ph + p);
        const knee = run * (front ? -0.5 : 0.6) * Math.max(0, Math.sin(ph + p + 1.2));
        return (
          <group key={i} position={[x, 0.56, z]} rotation={[0, 0, swing]}>
            <mesh material={fawn} position={[0, -0.13, 0]} castShadow>
              <capsuleGeometry args={[front ? 0.045 : 0.06, 0.18, 6, 10]} />
            </mesh>
            <group position={[0, -0.27, 0]} rotation={[0, 0, knee]}>
              <mesh material={fawn} position={[0, -0.13, 0]} castShadow>
                <capsuleGeometry args={[0.035, 0.2, 6, 10]} />
              </mesh>
              <mesh material={dark} position={[0.03, -0.27, 0]}>
                <sphereGeometry args={[0.045, 10, 8]} />
              </mesh>
            </group>
          </group>
        );
      })}
      {/* tail, black tip */}
      <group position={[-0.44, 0.64, 0]} rotation={[0, 0, -2.2 + tail * 0.5]}>
        <mesh material={fawn} position={[0, 0.14, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.22, 6, 10]} />
        </mesh>
        <mesh material={dark} position={[0, 0.3, 0]}>
          <capsuleGeometry args={[0.035, 0.08, 6, 10]} />
        </mesh>
      </group>
    </group>
  );
};
