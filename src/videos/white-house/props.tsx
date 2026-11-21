import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { RB, labelTex, tex } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";

const iron = () => new THREE.MeshStandardMaterial({ color: "#16181b", metalness: 0.6, roughness: 0.45 });

/** Iron picket fence along X (origin = middle, on the ground). `h` = height incl. the spiked top (old 2 m, new 4 m). */
export const Fence: React.FC<{ len: number; h: number; spikes?: boolean; gap?: number }> = ({ len, h, spikes = true, gap = 0.16 }) => {
  const mat = useMemo(iron, []);
  const n = Math.floor(len / gap);
  const pickets = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.045, 1, 0.045);
    const m = new THREE.InstancedMesh(geo, mat, n);
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      o.position.set(-len / 2 + gap / 2 + i * gap, h / 2, 0);
      o.scale.set(1, h, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.castShadow = true;
    return m;
  }, [mat, n, len, gap, h]);
  const tips = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.05, 0.22, 4);
    const m = new THREE.InstancedMesh(geo, mat, n);
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      // anti-climb: the tips bend outwards (towards +Z) like the real fence top
      o.position.set(-len / 2 + gap / 2 + i * gap, h + 0.08, 0.06);
      o.rotation.set(0.5, 0, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    return m;
  }, [mat, n, len, gap, h]);
  return (
    <group>
      <primitive object={pickets} />
      {spikes ? <primitive object={tips} /> : null}
      {[0.25, h - 0.35].map((y) => (
        <mesh key={y} material={mat} position={[0, y, 0]}>
          <boxGeometry args={[len, 0.08, 0.07]} />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(len / 3) + 1 }, (_, i) => (
        <group key={i} position={[-len / 2 + i * 3, 0, 0]}>
          <mesh material={mat} position={[0, h / 2 + 0.05, 0]} castShadow>
            <boxGeometry args={[0.14, h + 0.1, 0.14]} />
          </mesh>
          <mesh material={mat} position={[0, h + 0.18, 0]}>
            <sphereGeometry args={[0.1, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* stone curb */}
      <RB p={[0, 0.12, 0]} s={[len, 0.24, 0.5]} r={0.04} color="#bdb6a8" rough={0.9} />
    </group>
  );
};

/** Steel bollard row across a street (origin = middle). `rise` 0–1 pops them out of the road. */
export const Bollards: React.FC<{ len: number; rise?: number }> = ({ len, rise = 1 }) => {
  const n = Math.floor(len / 1.4) + 1;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[-len / 2 + i * 1.4, -1.1 * (1 - rise), 0]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.16, 1.1, 16]} />
            <meshStandardMaterial color="#2a2d31" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <cylinderGeometry args={[0.165, 0.165, 0.1, 16]} />
            <meshStandardMaterial color="#e8c22e" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Box truck (origin = ground under the middle, faces +X). `crush` 0–1 crumples the cab nose. */
export const Truck: React.FC<{ color?: string; crush?: number; lights?: number }> = ({ color = "#d9d5cc", crush = 0, lights = 1 }) => {
  const wheel = (x: number, z: number) => (
    <group key={`${x}${z}`} position={[x, 0.5, z]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.35, 20]} />
        <meshStandardMaterial color="#141414" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.02, 16]} />
        <meshStandardMaterial color="#9ea3a8" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
  return (
    <group>
      <RB p={[-1.0, 2.1, 0]} s={[5.4, 2.8, 2.45]} r={0.08} color={color} rough={0.6} />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-1.0, 2.2, s * 1.235]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[4.8, 2.2]} />
          <meshStandardMaterial map={labelTex("#e8e4da", "#c0392b", "TOTALLY", "NORMAL MOVERS", 768, 352)} roughness={0.6} />
        </mesh>
      ))}
      <RB p={[2.2 - crush * 0.5, 1.45, 0]} s={[1.9 - crush * 0.9, 1.9, 2.35]} r={0.2} color="#3a5f8a" rough={0.4} metal={0.3} />
      <mesh position={[3.1 - crush * 0.95, 1.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.0, 0.9]} />
        <meshStandardMaterial color="#1b2733" roughness={0.1} metalness={0.5} />
      </mesh>
      <RB p={[0.4, 0.75, 0]} s={[7.6, 0.3, 2.2]} r={0.05} color="#1c1c1c" />
      {[-3.0, -1.6, 2.2].map((x) => [wheel(x, 1.1), wheel(x, -1.1)])}
      {[-0.8, 0.8].map((z) => (
        <group key={z}>
          <mesh position={[3.16 - crush * 0.95, 0.95, z]}>
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshStandardMaterial color="#fff6dc" emissive="#fff1c8" emissiveIntensity={2 * lights} />
          </mesh>
          {lights > 0 ? <Glow position={[3.4 - crush * 0.95, 0.95, z]} size={1.6} color="#fff1c8" opacity={0.8 * lights} /> : null}
        </group>
      ))}
    </group>
  );
};

/** Small high-wing plane like the 1994 Cessna 150 (origin = middle, nose +X, ~7.3 m long, 10 m span). */
export const Cessna: React.FC<{ prop?: number }> = ({ prop = 0 }) => (
  <group>
    <mesh position={[0, 0.9, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.85]} castShadow>
      <capsuleGeometry args={[0.55, 4.6, 8, 16]} />
      <meshStandardMaterial color="#f2f2ee" roughness={0.45} />
    </mesh>
    <mesh position={[0.7, 1.15, 0]} scale={[1.3, 0.55, 0.9]}>
      <sphereGeometry args={[0.6, 16, 12]} />
      <meshStandardMaterial color="#1b2733" roughness={0.1} metalness={0.5} />
    </mesh>
    <RB p={[0.2, 1.65, 0]} s={[1.5, 0.12, 10]} r={0.05} color="#f2f2ee" rough={0.45} />
    {[-4.2, 4.2].map((z) => (
      <RB key={z} p={[0.2, 1.64, z]} s={[1.5, 0.13, 1.4]} r={0.05} color="#b02a2a" rough={0.5} />
    ))}
    <RB p={[-3.0, 1.0, 0]} s={[0.8, 0.08, 3.4]} r={0.03} color="#f2f2ee" />
    <RB p={[-3.1, 1.6, 0]} s={[0.9, 1.3, 0.08]} r={0.03} color="#b02a2a" />
    <mesh position={[3.15, 0.9, 0]} rotation={[prop, 0, 0]}>
      <boxGeometry args={[0.06, 1.9, 0.14]} />
      <meshStandardMaterial color="#222" />
    </mesh>
    {[-0.9, 0.9].map((z) => (
      <mesh key={z} position={[0.4, 0.25, z]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.12, 14]} />
        <meshStandardMaterial color="#141414" />
      </mesh>
    ))}
  </group>
);

/** Consumer quadcopter (origin = middle; ~0.35 m). */
export const Drone: React.FC<{ t: number; spin?: number }> = ({ t, spin = 1 }) => (
  <group>
    <RB p={[0, 0, 0]} s={[0.2, 0.07, 0.12]} r={0.03} color="#f4f4f4" rough={0.4} />
    {[-1, 1].map((x) =>
      [-1, 1].map((z) => (
        <group key={`${x}${z}`}>
          <RB p={[x * 0.08, 0, z * 0.08]} s={[0.2, 0.025, 0.025]} r={0.01} rot={[0, x * z * 0.78, 0]} color="#f4f4f4" />
          <mesh position={[x * 0.15, 0.03, z * 0.15]} rotation={[0, t * 40 * spin, 0]}>
            <boxGeometry args={[0.16, 0.005, 0.02]} />
            <meshStandardMaterial color="#888" />
          </mesh>
        </group>
      )),
    )}
    <mesh position={[0.11, -0.03, 0]}>
      <sphereGeometry args={[0.025, 10, 8]} />
      <meshStandardMaterial color="#111" roughness={0.1} />
    </mesh>
  </group>
);

/** NASAMS-style canister launcher on a truck bed, 6 tubes, tilted up (origin = ground, faces +X). */
export const Launcher: React.FC<{ raise?: number }> = ({ raise = 1 }) => {
  const camo = useMemo(() => tex("plaster", "#55603f", [2, 2], 41), []);
  return (
    <group>
      <RB p={[0, 0.9, 0]} s={[7, 0.5, 2.4]} r={0.06} color="#4b5338" />
      <RB p={[3.2, 1.7, 0]} s={[1.8, 1.8, 2.3]} r={0.15} color="#4b5338" />
      <mesh position={[4.12, 1.95, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.9, 0.8]} />
        <meshStandardMaterial color="#1b2733" roughness={0.1} metalness={0.5} />
      </mesh>
      {[-2.4, -0.9, 2.6].map((x) => [-1.15, 1.15].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.5, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.35, 18]} />
          <meshStandardMaterial color="#141414" roughness={0.9} />
        </mesh>
      )))}
      <group position={[-2.4, 1.2, 0]} rotation={[0, 0, raise * 0.55]}>
        <mesh position={[1.9, 0.75, 0]} castShadow>
          <boxGeometry args={[4.2, 1.5, 2.2]} />
          <meshStandardMaterial map={camo} color="#6b7550" roughness={0.8} />
        </mesh>
        {[0, 1, 2].map((r) =>
          [0, 1].map((k) => (
            <mesh key={`${r}${k}`} position={[4.02, 0.3 + k * 0.85, -0.72 + r * 0.72]} rotation={[0, 0, -Math.PI / 2]}>
              <circleGeometry args={[0.28, 20]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
};

/** Radar dish on a mast that turns with `t` (origin = ground). */
export const Radar: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh position={[0, 2, 0]}>
      <cylinderGeometry args={[0.12, 0.18, 4, 10]} />
      <meshStandardMaterial color="#c9ccd0" metalness={0.6} roughness={0.4} />
    </mesh>
    <group position={[0, 4.2, 0]} rotation={[0, t * 2.2, 0]}>
      <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, Math.PI / 2 - 0.3]}>
        <sphereGeometry args={[1.2, 24, 12, 0, Math.PI * 2, 0, 0.9]} />
        <meshStandardMaterial color="#e8ebee" metalness={0.4} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  </group>
);

/** Red see-through no-fly dome with latitude rings (origin = centre on the ground). */
export const NoFlyDome: React.FC<{ r: number; o: number; t: number }> = ({ r, o, t }) => (
  <group>
    <mesh key="dome">
      <sphereGeometry args={[r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial color="#ff3b30" transparent opacity={0.07 * o} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
    {[0.15, 0.4, 0.65, 0.88].map((k) => {
      const a = k * (Math.PI / 2);
      return (
        <mesh key={k} position={[0, Math.sin(a) * r, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[Math.cos(a) * r, r * 0.0025, 6, 96]} />
          <meshBasicMaterial color="#ff5a4e" transparent opacity={0.8 * o} toneMapped={false} />
        </mesh>
      );
    })}
    {/* a scan ring that climbs the dome */}
    {(() => {
      const a = ((t * 0.35) % 1) * (Math.PI / 2);
      return (
        <mesh position={[0, Math.sin(a) * r, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[Math.cos(a) * r, r * 0.008, 6, 96]} />
          <meshBasicMaterial color="#ffd0cc" transparent opacity={o * (1 - a / (Math.PI / 2))} toneMapped={false} />
        </mesh>
      );
    })()}
  </group>
);

/** Robber's loot sack (origin = bottom). */
export const Sack: React.FC = () => (
  <group>
    <mesh position={[0, 0.32, 0]} scale={[1, 1.15, 0.9]} castShadow>
      <sphereGeometry args={[0.3, 16, 12]} />
      <meshStandardMaterial color="#8a7a5a" roughness={0.95} />
    </mesh>
    <mesh position={[0, 0.66, 0]}>
      <cylinderGeometry args={[0.06, 0.12, 0.14, 10]} />
      <meshStandardMaterial color="#8a7a5a" roughness={0.95} />
    </mesh>
  </group>
);

/** Black agent sunglasses + earpiece cord, for attach={{ bone: "Head", node: <Shades/> }}. */
export const Shades: React.FC = () => (
  <group position={[0, 0.08, 0.1]}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.035, 0, 0]}>
        <boxGeometry args={[0.055, 0.03, 0.01]} />
        <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.6} />
      </mesh>
    ))}
    <mesh position={[0, 0.005, 0]}>
      <boxGeometry args={[0.03, 0.008, 0.008]} />
      <meshStandardMaterial color="#050505" />
    </mesh>
    <mesh position={[0.085, -0.05, -0.08]} rotation={[0.3, 0, 0]}>
      <cylinderGeometry args={[0.003, 0.003, 0.14, 4]} />
      <meshStandardMaterial color="#d8d8d8" />
    </mesh>
  </group>
);

/** Black beanie for the robbers (attach to "Head"). */
export const Beanie: React.FC = () => (
  <group position={[0, 0.12, 0.0]}>
    <mesh scale={[1, 0.8, 1.05]}>
      <sphereGeometry args={[0.115, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#141414" roughness={0.95} />
    </mesh>
    <mesh position={[0, 0.0, 0]}>
      <cylinderGeometry args={[0.118, 0.118, 0.04, 16]} />
      <meshStandardMaterial color="#141414" roughness={0.95} />
    </mesh>
    {/* the classic black eye mask */}
    <mesh position={[0, -0.06, 0.09]}>
      <boxGeometry args={[0.16, 0.035, 0.02]} />
      <meshStandardMaterial color="#0a0a0a" roughness={0.6} />
    </mesh>
  </group>
);

/** Sniper rifle with scope (origin = stock, points +Z), for a crouching sniper on the roof. */
export const Rifle: React.FC = () => (
  <group>
    <RB p={[0, 0, 0.45]} s={[0.06, 0.09, 0.9]} r={0.02} color="#2a2c2f" />
    <mesh position={[0, 0.02, 1.25]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.015, 0.015, 0.75, 8]} />
      <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0.09, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.025, 0.025, 0.35, 10]} />
      <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} />
    </mesh>
  </group>
);

/** A bowling lane in the basement: planks, gutters, 10 pins knocked by `hit` 0–1, the ball rolling with `roll` 0–1. */
export const BowlingLane: React.FC<{ roll: number; hit: number }> = ({ roll, hit }) => {
  const planks = useMemo(() => tex("planks", "#d8b07a", [1, 14], 51), []);
  const pinGeo = useMemo(() => {
    const p = [
      [0, 0],
      [0.03, 0],
      [0.055, 0.08],
      [0.06, 0.12],
      [0.04, 0.2],
      [0.025, 0.25],
      [0.035, 0.31],
      [0.03, 0.36],
      [0, 0.38],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(p, 16);
  }, []);
  const L = 18.3;
  const pins: [number, number][] = [];
  for (let row = 0; row < 4; row++) for (let k = 0; k <= row; k++) pins.push([-0.15 * row + 0.3 * k, -L / 2 + 0.3 - row * 0.26]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.05, L]} />
        <meshStandardMaterial map={planks} roughness={0.25} metalness={0.05} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.64, -0.04, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.23, 0.06, L]} />
          <meshStandardMaterial color="#3a3d42" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
      {pins.map(([x, z], i) => {
        const r = ((i * 37) % 10) / 10;
        const fly = hit * (0.6 + r);
        return (
          <mesh key={i} geometry={pinGeo} position={[x + (r - 0.5) * 1.4 * fly, Math.sin(Math.min(1, hit) * Math.PI) * 0.4 * r, z - fly * 0.8]} rotation={[-fly * 1.6, r * 3, (r - 0.5) * 2 * fly]} castShadow>
            <meshStandardMaterial color="#f7f4ee" roughness={0.3} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.11, L / 2 - 1 - roll * (L - 1.6)]} rotation={[-roll * 50, 0, 0]} castShadow>
        <sphereGeometry args={[0.11, 20, 14]} />
        <meshStandardMaterial color="#3a1f8f" roughness={0.15} metalness={0.2} />
      </mesh>
    </group>
  );
};

/** Concrete bunker room with a round blast door (origin = floor middle), seen through a cut-open front (+Z). */
export const Bunker: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const conc = usePbr("concrete_floor_02", [4, 2]);
  const steel = usePbr("metal_plate", [2, 2]);
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial {...conc} color="#9a9a94" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2, -4]}>
        <planeGeometry args={[16, 4]} />
        <meshStandardMaterial {...conc} color="#c9c9c2" roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 8, 2, 0]} rotation={[0, -s * Math.PI / 2, 0]}>
          <planeGeometry args={[8, 4]} />
          <meshStandardMaterial {...conc} color="#c9c9c2" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial {...conc} color="#b8b8b0" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* blast door on the back wall */}
      <group position={[4.8, 1.6, -3.9]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.35, 1.35, 0.3, 40]} />
          <meshStandardMaterial {...steel} color="#9aa2aa" metalness={0.85} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.18]}>
          <torusGeometry args={[0.45, 0.06, 8, 24]} />
          <meshStandardMaterial color="#c9a64a" metalness={0.8} roughness={0.3} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0.17]}>
              <cylinderGeometry args={[0.07, 0.07, 0.05, 8]} />
              <meshStandardMaterial color="#3b3f45" metalness={0.8} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
      {/* a conference table, screens, ceiling lights */}
      <RB p={[-2.2, 0.75, -0.6]} s={[5, 0.1, 1.8]} r={0.04} color="#3b2a1d" rough={0.4} />
      {[-4, -2.2, -0.4].map((x) => [-1.6, 0.4].map((z) => <RB key={`${x}${z}`} p={[x, 0.5, z]} s={[0.55, 1.0, 0.55]} r={0.08} color="#1d1f24" />))}
      {[-4.2, -1.4].map((x) => (
        <group key={x} position={[x, 2.3, -3.95]}>
          <RB p={[0, 0, 0]} s={[2.4, 1.4, 0.08]} r={0.03} color="#111" />
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[2.25, 1.25]} />
            <meshBasicMaterial map={labelTex("#0b1a2a", "#1f6fb5", "DEFCON", "STATUS · GREEN", 512, 280)} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {[-5, 0, 5].map((x) => (
        <group key={x}>
          <RB p={[x, 3.92, 0]} s={[1.6, 0.08, 0.3]} r={0.02} color="#fffbe8" emissive="#fff3c8" ei={1.5 * glow} />
          <pointLight position={[x, 3.4, 0.5]} intensity={6 * glow} distance={9} color="#fff3d6" />
        </group>
      ))}
    </group>
  );
};

/** Ground cross-section block: soil layers (origin = top middle; `w` × `h` × `d`). */
export const SoilCut: React.FC<{ w: number; h: number; d: number; holes?: { p: V3; s: V3 }[] }> = ({ w, h, d }) => {
  const soil = useMemo(() => tex("plaster", "#6b4a2f", [6, 4], 71), []);
  return (
    <group>
      <mesh position={[0, -h / 2, 0]}>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={soil} color="#7a573a" roughness={0.95} />
      </mesh>
      {/* darker stripes = layers */}
      {[0.18, 0.45, 0.72].map((k) => (
        <mesh key={k} position={[0, -h * k, d / 2 + 0.01]}>
          <planeGeometry args={[w, 0.25]} />
          <meshStandardMaterial color="#4a3220" roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

/** A lumpy leaf ball: subdivided icosphere pushed in and out by layered sines (cached per radius/seed). */
const blobCache = new Map<string, THREE.BufferGeometry>();
const leafBlob = (r: number, seed: number) => {
  const key = `${r.toFixed(2)}|${seed}`;
  const hit = blobCache.get(key);
  if (hit) return hit;
  const g = new THREE.IcosahedronGeometry(r, 5);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    const bump = 0.13 * Math.sin(n.x * 7 + seed) * Math.sin(n.y * 6 + seed * 0.7) * Math.sin(n.z * 8 + seed * 1.3) + 0.06 * Math.sin(n.x * 19 + n.z * 17 + seed);
    v.copy(n.multiplyScalar(r * (1 + bump)));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  blobCache.set(key, g);
  return g;
};
const leafMats = new Map<string, THREE.Material>();
/** Leaf material: a dappled leaf canvas (light/dark leaf specks) tinted per tree tone. */
const leafMat = (color: string) => {
  const hit = leafMats.get(color);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 256, 256);
  let r = 3;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 2600; i++) {
    const l = 70 + Math.floor(rnd() * 120);
    g.fillStyle = `rgb(${l},${l},${l})`;
    g.beginPath();
    g.ellipse(rnd() * 256, rnd() * 256, 2 + rnd() * 4, 1 + rnd() * 2.5, rnd() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, bumpMap: t, bumpScale: 3, color: new THREE.Color(color).multiplyScalar(1.6), roughness: 0.9 });
  leafMats.set(color, m);
  return m;
};

/** Broad lawn tree (oak / magnolia look): tapered trunk, two forks, a rounded canopy of overlapping blobs.
 * ~9 m tall at s = 1, canopy ~7 m wide. Origin = trunk foot. `seed` varies the canopy. */
export const OakTree: React.FC<{ s?: number; seed?: number }> = ({ s = 1, seed = 1 }) => {
  const blobs = useMemo(() => {
    let r = seed * 9301;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + rnd();
      const d = i === 0 ? 0 : 1.6 + rnd() * 1.2;
      return { p: [Math.cos(a) * d, 6.2 + rnd() * 1.6 + (i === 0 ? 1 : 0), Math.sin(a) * d] as V3, r: 1.9 + rnd() * 0.9, c: ["#2e5527", "#365f2c", "#3f6a31"][i % 3] };
    });
  }, [seed]);
  const bark = useMemo(() => new THREE.MeshStandardMaterial({ map: tex("planks", "#5a4330", [1, 3], 121), color: "#8a7564", roughness: 0.95 }), []);
  return (
    <group scale={[s, s, s]}>
      <mesh material={bark} position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.42, 4.4, 20]} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} material={bark} position={[k * 0.7, 4.8, k * 0.2]} rotation={[k * 0.15, 0, -k * 0.5]} castShadow>
          <cylinderGeometry args={[0.14, 0.24, 2.4, 10]} />
        </mesh>
      ))}
      {blobs.map((b, i) => (
        <mesh key={i} geometry={leafBlob(b.r, seed * 13 + i)} material={leafMat(b.c)} position={b.p} scale={[1, 0.82, 1]} castShadow receiveShadow />
      ))}
    </group>
  );
};
