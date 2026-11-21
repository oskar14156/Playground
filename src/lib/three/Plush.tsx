import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "./core";

/**
 * Giant original plush animal (~2 m with ears at s = 1): round fuzzy body, lighter belly, round ears,
 * googly eyes, stitched smile. Frame-driven: `t` seconds for a soft idle wobble, `squish` 0–1 to
 * squash it (stuck in a corner), `look` turns the pupils (radians).
 */
export const Plush: React.FC<{ p?: V3; ry?: number; s?: number; t?: number; squish?: number; look?: number; color?: string; belly?: string }> = ({
  p = [0, 0, 0],
  ry = 0,
  s = 1,
  t = 0,
  squish = 0,
  look = 0,
  color = "#4a9cff",
  belly = "#bfe0ff",
}) => {
  const fur = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color, roughness: 1, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color("#d8ecff") }),
    [color],
  );
  const furLight = useMemo(() => new THREE.MeshPhysicalMaterial({ color: belly, roughness: 1, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffffff") }), [belly]);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1b1e2a", roughness: 0.6 }), []);
  const eyeW = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.15, clearcoat: 1 }), []);
  const smile = useMemo(() => new THREE.TorusGeometry(0.2, 0.018, 8, 32, Math.PI * 0.8), []);
  const wob = Math.sin(t * 1.6) * 0.02;
  const sx = 1 + squish * 0.35;
  const sy = 1 - squish * 0.3;
  const px = Math.sin(look) * 0.05;
  return (
    <group position={p} rotation={[0, ry, 0]} scale={[s * sx, s * sy * (1 + wob), s * sx]}>
      {/* body + belly */}
      <mesh material={fur} position={[0, 0.85, 0]} scale={[0.82, 0.9, 0.75]} castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 32]} />
      </mesh>
      <mesh material={furLight} position={[0, 0.75, 0.42]} scale={[0.52, 0.58, 0.36]}>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      {/* ears (inner ear lighter) */}
      {[-1, 1].map((k) => (
        <group key={k} position={[0.5 * k, 1.68, -0.05]} rotation={[0, 0, -0.35 * k]}>
          <mesh material={fur} scale={[0.3, 0.3, 0.14]} castShadow>
            <sphereGeometry args={[1, 32, 20]} />
          </mesh>
          <mesh material={furLight} position={[0, 0, 0.08]} scale={[0.18, 0.18, 0.08]}>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
        </group>
      ))}
      {/* googly eyes */}
      {[-1, 1].map((k) => (
        <group key={k} position={[0.24 * k, 1.28, 0.6]}>
          <mesh material={eyeW} scale={[0.17, 0.19, 0.08]}>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
          <mesh material={dark} position={[px + 0.02 * k, -0.03, 0.07]} scale={[0.08, 0.09, 0.04]}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
        </group>
      ))}
      {/* nose + stitched smile */}
      <mesh material={dark} position={[0, 1.12, 0.69]} scale={[0.07, 0.05, 0.04]}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      <mesh geometry={smile} material={dark} position={[0, 1.08, 0.66]} rotation={[0, 0, Math.PI * 1.1]} />
      {/* stubby arms + feet */}
      {[-1, 1].map((k) => (
        <mesh key={`a${k}`} material={fur} position={[0.78 * k, 0.95, 0.15]} rotation={[0, 0, 0.9 * k]} scale={[0.18, 0.36, 0.18]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
      ))}
      {[-1, 1].map((k) => (
        <mesh key={`f${k}`} material={fur} position={[0.36 * k, 0.12, 0.3]} scale={[0.26, 0.14, 0.34]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
      ))}
    </group>
  );
};
