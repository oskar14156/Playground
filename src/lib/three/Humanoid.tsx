import React from "react";
import type { ThreeElements } from "@react-three/fiber";

/**
 * Procedural, posable human figure built from primitives (no rig files, no downloads).
 * Reads as the stylised crew / suit figures in the reference reels. ~1.8 units tall,
 * feet at y=0, facing +Z.
 *
 * Animate by passing a Pose computed from the frame: use the pose helpers below
 * (walk, climb, wave, float) or mixPose() between two poses.
 */
export type Pose = {
  /** whole-body offset / lean */
  rootY?: number;
  spine?: number; // forward bend (rad)
  twist?: number;
  head?: [number, number]; // pitch, yaw
  lShoulder?: [number, number, number];
  rShoulder?: [number, number, number];
  lElbow?: number;
  rElbow?: number;
  lHip?: [number, number];
  rHip?: [number, number];
  lKnee?: number;
  rKnee?: number;
};

export type Look = {
  suit?: string;
  skin?: string;
  helmet?: "hood" | "flight" | "none";
  helmetColor?: string;
  visor?: string;
  boots?: string;
  /** small chest/arm stripe color, e.g. reflective tape */
  stripe?: string;
};

/** Suit fabric: sheen makes primitives read as cloth instead of plastic. */
const Fabric: React.FC<{ color: string }> = ({ color }) => (
  <meshPhysicalMaterial color={color} roughness={0.72} metalness={0} sheen={0.8} sheenRoughness={0.5} sheenColor="#ffffff" />
);

const Limb: React.FC<{ len: number; r: number; color: string; children?: React.ReactNode }> = ({ len, r, color, children }) => (
  <group>
    <mesh position={[0, -len / 2, 0]} castShadow>
      <capsuleGeometry args={[r, len - r * 2 > 0 ? len - r * 2 : 0.01, 6, 12]} />
      <Fabric color={color} />
    </mesh>
    <group position={[0, -len, 0]}>{children}</group>
  </group>
);

export const Humanoid: React.FC<{ pose?: Pose; look?: Look } & ThreeElements["group"]> = ({ pose = {}, look = {}, ...g }) => {
  const {
    suit = "#ff7a1a",
    skin = "#c98d6b",
    helmet = "hood",
    helmetColor = suit,
    visor = "#1c140f",
    boots = "#2a2a2e",
    stripe,
  } = look;
  const p = pose;
  const sh = (s?: [number, number, number]) => s ?? [0, 0, 0];
  const hp = (h?: [number, number]) => h ?? [0, 0];
  const [lsx, lsy, lsz] = sh(p.lShoulder);
  const [rsx, rsy, rsz] = sh(p.rShoulder);
  const [lhx, lhz] = hp(p.lHip);
  const [rhx, rhz] = hp(p.rHip);
  const [hpch, hyaw] = p.head ?? [0, 0];

  return (
    <group {...g}>
      <group position={[0, 0.95 + (p.rootY ?? 0), 0]}>
        {/* pelvis */}
        <mesh castShadow>
          <capsuleGeometry args={[0.15, 0.12, 6, 12]} />
          <Fabric color={suit} />
        </mesh>
        {/* legs */}
        {(
          [
            [-0.1, lhx, lhz, p.lKnee ?? 0],
            [0.1, rhx, rhz, p.rKnee ?? 0],
          ] as const
        ).map(([x, hx, hz, knee], i) => (
          <group key={i} position={[x, -0.05, 0]} rotation={[hx, 0, hz]}>
            <Limb len={0.44} r={0.085} color={suit}>
              <group rotation={[knee, 0, 0]}>
                <Limb len={0.42} r={0.07} color={suit}>
                  <mesh position={[0, -0.03, 0.06]} castShadow>
                    <boxGeometry args={[0.12, 0.08, 0.26]} />
                    <meshStandardMaterial color={boots} roughness={0.8} />
                  </mesh>
                </Limb>
              </group>
            </Limb>
          </group>
        ))}
        {/* torso */}
        <group rotation={[p.spine ?? 0, p.twist ?? 0, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <capsuleGeometry args={[0.2, 0.32, 8, 16]} />
            <Fabric color={suit} />
          </mesh>
          {stripe ? (
            <mesh position={[0, 0.36, 0.0]}>
              <cylinderGeometry args={[0.205, 0.205, 0.05, 20, 1, true]} />
              <meshStandardMaterial color={stripe} emissive={stripe} emissiveIntensity={0.25} />
            </mesh>
          ) : null}
          {/* head */}
          <group position={[0, 0.66, 0]} rotation={[hpch, hyaw, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.13, 24, 16]} />
              <meshStandardMaterial color={skin} roughness={0.5} />
            </mesh>
            {helmet === "hood" ? (
              <>
                {/* hood with a face opening toward +Z, then a glass face plate */}
                <mesh scale={[1.3, 1.35, 1.3]} castShadow>
                  <sphereGeometry args={[0.13, 32, 20, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5, 0, Math.PI * 0.82]} />
                  <meshPhysicalMaterial color={helmetColor} roughness={0.7} sheen={0.8} sheenColor="#ffffff" side={2} />
                </mesh>
                <mesh position={[0, -0.01, 0.075]} scale={[1, 1.2, 0.75]}>
                  <sphereGeometry args={[0.12, 24, 16, Math.PI / 2 - 0.85, 1.7, 0.35, 1.9]} />
                  <meshPhysicalMaterial color={visor} roughness={0.04} metalness={0.1} transmission={0} transparent opacity={0.35} clearcoat={1} />
                </mesh>
                {[-0.04, 0.04].map((x) => (
                  <mesh key={x} position={[x, 0.015, 0.118]}>
                    <sphereGeometry args={[0.012, 10, 8]} />
                    <meshStandardMaterial color="#1a1310" roughness={0.3} />
                  </mesh>
                ))}
              </>
            ) : null}
            {helmet === "flight" ? (
              <>
                <mesh scale={[1.18, 1.15, 1.2]} position={[0, 0.03, -0.01]} castShadow>
                  <sphereGeometry args={[0.13, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
                  <meshStandardMaterial color={helmetColor} roughness={0.35} metalness={0.15} />
                </mesh>
                <mesh position={[0, 0.06, 0.12]} rotation={[0.3, 0, 0]}>
                  <boxGeometry args={[0.2, 0.06, 0.04]} />
                  <meshStandardMaterial color={visor} roughness={0.05} metalness={0.7} />
                </mesh>
              </>
            ) : null}
          </group>
          {/* arms */}
          {(
            [
              [-0.27, lsx, lsy, lsz, p.lElbow ?? 0],
              [0.27, rsx, rsy, rsz, p.rElbow ?? 0],
            ] as const
          ).map(([x, ax, ay, az, elbow], i) => (
            <group key={i} position={[x, 0.5, 0]} rotation={[ax, ay, az + (x < 0 ? 0.08 : -0.08)]}>
              <Limb len={0.33} r={0.065} color={suit}>
                <group rotation={[-elbow, 0, 0]}>
                  <Limb len={0.3} r={0.055} color={suit}>
                    <mesh castShadow>
                      <sphereGeometry args={[0.055, 12, 10]} />
                      <meshStandardMaterial color={boots} roughness={0.7} />
                    </mesh>
                  </Limb>
                </group>
              </Limb>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
};

// ---------- pose helpers (all pure functions of time t in seconds) ----------

export const idle = (t: number): Pose => ({
  rootY: Math.sin(t * 2) * 0.004,
  spine: 0.02,
  lShoulder: [0.05, 0, 0.05],
  rShoulder: [0.05, 0, -0.05],
  lElbow: 0.15,
  rElbow: 0.15,
});

export const walk = (t: number, speed = 1): Pose => {
  const s = Math.sin(t * 6 * speed);
  const c = Math.cos(t * 6 * speed);
  return {
    rootY: Math.abs(c) * 0.03,
    spine: 0.06,
    lHip: [s * 0.45, 0],
    rHip: [-s * 0.45, 0],
    lKnee: Math.max(0, -c) * 0.7,
    rKnee: Math.max(0, c) * 0.7,
    lShoulder: [-s * 0.4, 0, 0.06],
    rShoulder: [s * 0.4, 0, -0.06],
    lElbow: 0.35,
    rElbow: 0.35,
  };
};

/** Hand-over-hand ladder climb in place (move the figure up yourself). */
export const climb = (t: number): Pose => {
  const s = Math.sin(t * 4);
  return {
    spine: -0.05,
    lShoulder: [-2.6 - s * 0.3, 0, 0.1],
    rShoulder: [-2.6 + s * 0.3, 0, -0.1],
    lElbow: 0.4 + s * 0.3,
    rElbow: 0.4 - s * 0.3,
    lHip: [-0.6 - s * 0.4, 0],
    rHip: [-0.6 + s * 0.4, 0],
    lKnee: 1.0 + s * 0.4,
    rKnee: 1.0 - s * 0.4,
    head: [-0.3, 0],
  };
};

export const wave = (t: number): Pose => ({
  ...idle(t),
  rShoulder: [-0.3, 0, -2.5],
  rElbow: 0.5 + Math.sin(t * 8) * 0.35,
});

/** Arms slightly out, legs dangling — floating / ascending through water or air. */
export const float = (t: number): Pose => ({
  rootY: 0,
  spine: 0.05 + Math.sin(t * 1.5) * 0.04,
  lShoulder: [0.1, 0, 0.55 + Math.sin(t * 1.7) * 0.08],
  rShoulder: [0.1, 0, -0.55 - Math.sin(t * 1.7) * 0.08],
  lElbow: 0.3,
  rElbow: 0.3,
  lHip: [0.15 + Math.sin(t * 1.3) * 0.1, 0.05],
  rHip: [-0.05 - Math.sin(t * 1.3) * 0.1, -0.05],
  lKnee: 0.25,
  rKnee: 0.35,
  head: [-0.15, 0],
});

/** Seated (pilot / operator). */
export const seated = (t: number): Pose => ({
  rootY: -0.42,
  spine: -0.05,
  lHip: [-1.5, 0.05],
  rHip: [-1.5, -0.05],
  lKnee: -1.5,
  rKnee: -1.5,
  lShoulder: [-0.9, 0, 0.1],
  rShoulder: [-0.9 + Math.sin(t * 2) * 0.05, 0, -0.1],
  lElbow: 0.6,
  rElbow: 0.6,
});

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Blend two poses (k=0 → a, k=1 → b). */
export const mixPose = (a: Pose, b: Pose, k: number): Pose => {
  const out: Record<string, unknown> = {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Pose>;
  keys.forEach((key) => {
    const va = a[key];
    const vb = b[key];
    if (Array.isArray(va) || Array.isArray(vb)) {
      const xa = (va ?? [0, 0, 0]) as number[];
      const xb = (vb ?? [0, 0, 0]) as number[];
      out[key] = xa.map((x, i) => lerp(x, xb[i] ?? 0, k));
    } else {
      out[key] = lerp((va as number) ?? 0, (vb as number) ?? 0, k);
    }
  });
  return out as Pose;
};
