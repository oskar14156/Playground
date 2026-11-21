import React, { useMemo } from "react";
import * as THREE from "three";
import { seeded } from "../timing";
import { glowTexture, V3 } from "./core";

/** Seeded particle cloud moving with the frame: dust, marine snow, embers. Pure function of `frame`. */
export const Drift: React.FC<{
  frame: number;
  count: number;
  box: V3; // extent (half sizes)
  velocity: V3; // units per frame
  size: number;
  color: string;
  opacity?: number;
  seed?: number;
  additive?: boolean;
}> = ({ frame, count, box, velocity, size, color, opacity = 0.8, seed = 5, additive = true }) => {
  const base = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1, r()] as [number, number, number, number]);
  }, [count, seed]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const arr = geo.getAttribute("position") as THREE.BufferAttribute;
  const wrap = (v: number, h: number) => ((((v + h) % (2 * h)) + 2 * h) % (2 * h)) - h;
  base.forEach(([x, y, z, w], i) => {
    const sp = 0.6 + 0.8 * w;
    arr.setXYZ(
      i,
      wrap(x * box[0] + velocity[0] * frame * sp + Math.sin(frame * 0.03 + w * 9) * 0.05, box[0]),
      wrap(y * box[1] + velocity[1] * frame * sp, box[1]),
      wrap(z * box[2] + velocity[2] * frame * sp, box[2]),
    );
  });
  arr.needsUpdate = true;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={size}
        map={glowTexture()}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
};

/** Visible light cone from `from` to `to` (fake volumetric beam). */
export const Beam: React.FC<{ from: V3; to: V3; radius: number; color?: string; opacity?: number }> = ({
  from,
  to,
  radius,
  color = "#d6e8ff",
  opacity = 0.09,
}) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize());
  return (
    <group position={mid} quaternion={q}>
      {[1, 0.6].map((k) => (
        <mesh key={k}>
          <coneGeometry args={[radius * k, len, 32, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={opacity * (k === 1 ? 1 : 1.6)} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

/** Flat glow decal on the ground (light pool, ping ring fill). */
export const GroundGlow: React.FC<{ position: V3; size: number; color: string; opacity?: number }> = ({ position, size, color, opacity = 1 }) => (
  <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[size, size]} />
    <meshBasicMaterial map={glowTexture()} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
  </mesh>
);

/** Spotlight whose target is a point (R3F needs the target object in the scene). */
export const AimedSpot: React.FC<{ position: V3; target: V3; intensity: number; angle?: number; color?: string; shadows?: boolean }> = ({
  position,
  target,
  intensity,
  angle = 0.35,
  color = "#ffffff",
  shadows = true,
}) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...target);
  tgt.updateMatrixWorld();
  return (
    <>
      <primitive object={tgt} />
      <spotLight
        position={position}
        target={tgt}
        intensity={intensity}
        angle={angle}
        penumbra={0.5}
        decay={0}
        color={color}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
    </>
  );
};

/** Flames: seeded rising glow sprites around a base point. Pure function of frame. */
export const Flames: React.FC<{ frame: number; count?: number; spread?: V3; height?: number; intensity?: number; seed?: number }> = ({
  frame,
  count = 150,
  spread = [1, 0, 0.5],
  height = 1.6,
  intensity = 1,
  seed = 11,
}) => {
  const ps = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({ x: r() * 2 - 1, z: r() * 2 - 1, period: 30 + r() * 30, phase: r() * 40, s: 0.4 + r() * 0.7, sway: r() * 6 }));
  }, [count, seed]);
  const col = (k: number) => new THREE.Color("#fff3b0").lerp(new THREE.Color("#ff7a1a"), Math.min(1, k * 1.6)).lerp(new THREE.Color("#b3200a"), Math.max(0, k - 0.55) * 2);
  return (
    <group>
      {ps.map((p, i) => {
        const k = ((frame + p.phase) % p.period) / p.period;
        const y = k * height * (0.6 + 0.4 * p.s);
        const narrow = 1 - k * 0.7;
        const x = p.x * spread[0] * narrow + Math.sin(frame * 0.2 + p.sway) * 0.06 * k;
        const z = p.z * spread[2] * narrow;
        return (
          <sprite key={i} position={[x, y, z]} scale={Array(3).fill(p.s * (1 - k * 0.6) * 0.75) as V3}>
            {/* fade in at birth so respawning particles don't pop (read as flicker) */}
            <spriteMaterial map={glowTexture()} color={col(k)} transparent opacity={intensity * Math.min(1, k / 0.2) * (1 - k) * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        );
      })}
    </group>
  );
};

/** Wavy seabed / ground with gentle dunes (deterministic). */
export const Dunes: React.FC<{ size?: number; color: string; amp?: number }> = ({ size = 30, color, amp = 0.12 }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, 120, 120);
    const p = g.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      p.setZ(i, amp * (Math.sin(x * 0.9) * Math.cos(y * 0.7) + 0.5 * Math.sin(x * 2.3 + y * 1.7) + 0.25 * Math.sin(x * 5.1 - y * 4.3)));
    }
    g.computeVertexNormals();
    return g;
  }, [size, amp]);
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
};

/** Arrow (cone + shaft) pointing from `from` toward `to` — pressure / force. */
export const Arrow: React.FC<{ from: V3; to: V3; color: string; thickness?: number; opacity?: number }> = ({ from, to, color, thickness = 0.05, opacity = 1 }) => {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  const head = thickness * 4;
  return (
    <group position={a} quaternion={q}>
      <mesh position={[0, (len - head) / 2, 0]}>
        <cylinderGeometry args={[thickness, thickness, len - head, 12]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
      </mesh>
      <mesh position={[0, len - head / 2, 0]}>
        <coneGeometry args={[thickness * 2.4, head, 16]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
      </mesh>
    </group>
  );
};
