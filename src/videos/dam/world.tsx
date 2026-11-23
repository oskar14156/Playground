import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, Glow, V3 } from "../../lib/three/core";
import { Cyl, Env, KeyLight, Post, RB, Slab, tex } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";

export type Look = "yard" | "canyon" | "thermal" | "turbine" | "studio";

export const DamCanvas: React.FC<{
  cam: Cam;
  look: Look;
  children: React.ReactNode;
  ao?: number;
  keyPos?: V3;
  keyI?: number;
  shadow?: number;
}> = ({ cam, look, children, ao = 0.8, keyPos, keyI, shadow = 16 }) => {
  const { width, height } = useVideoConfig();
  const bg =
    look === "canyon" || look === "yard"
      ? "#f0b97e"
      : look === "turbine"
        ? "#0a1524"
        : "#0b111c";
  const hemiSky = look === "canyon" || look === "yard" ? "#fff1d6" : "#6ea8e0";
  const hemiGround = look === "canyon" || look === "yard" ? "#7a4d32" : "#121720";
  const kPos: V3 = keyPos ?? [cam.look[0] + 4.4, cam.look[1] + 6.6, cam.look[2] + 4.8];
  const kInt = keyI ?? (look === "canyon" || look === "yard" ? 2.05 : 1.7);
  const kCol = look === "canyon" || look === "yard" ? "#ffebc2" : "#cfe8ff";

  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 44, near: 0.03, far: 400 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 18, 72]} />
      <hemisphereLight args={[hemiSky, hemiGround, look === "canyon" || look === "yard" ? 0.72 : 0.44]} />
      <KeyLight p={kPos} target={cam.look} intensity={kInt} color={kCol} size={shadow} />
      {children}
      <Env intensity={look === "canyon" || look === "yard" ? 0.42 : 0.25} />
      <Post bloom={look === "canyon" || look === "yard" ? 0.48 : 0.86} ao={ao} vignette={look === "canyon" || look === "yard" ? 0.22 : 0.42} />
    </ThreeCanvas>
  );
};

// ───────────────────────── 1. BlackCanyonWorld (terraced red-brown granite canyon cliffs flanking gorge) ─────────────────────────
export const BlackCanyonWorld: React.FC<{ children?: React.ReactNode; t?: number; dammed?: boolean }> = ({
  children,
  t = 0,
  dammed = true,
}) => {
  const rock = usePbr("brown_mud_rocks_01", [5, 4]);
  const cliffBands = useMemo(
    () => [
      { y: 0.4, w: 2.8, x: 2.92 },
      { y: 1.4, w: 2.8, x: 3.15 },
      { y: 2.5, w: 2.8, x: 3.45 },
      { y: 3.5, w: 2.8, x: 3.75 },
    ],
    [],
  );

  return (
    <group>
      {/* Canyon bedrock riverbed & downstream channel */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[32, 0.2, 32]} />
        <meshStandardMaterial color="#8c5a3e" map={rock.map} normalMap={rock.normalMap} roughnessMap={rock.roughnessMap} roughness={0.94} />
      </mesh>
      {/* Upstream Lake Mead vs raging river */}
      <RB p={[0, dammed ? 1.55 : 0.06, -4.6]} s={[5.2, dammed ? 2.9 : 0.14, 7.6]} r={0.02} color="#1785a8" rough={0.14} metal={0.25} opacity={0.88} />
      <RB p={[0, 0.04, 4.6]} s={[4.2, 0.1, 8.2]} r={0.02} color="#1a7696" rough={0.18} metal={0.2} opacity={0.85} />

      {/* Left (Arizona) & Right (Nevada) terraced granite canyon cliffs */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {cliffBands.map((b, bi) => (
            <mesh key={bi} position={[side * b.x, b.y, 0]} castShadow receiveShadow>
              <boxGeometry args={[b.w, 1.15, 16]} />
              <meshStandardMaterial
                color={bi % 2 ? "#8f5639" : "#a86948"}
                map={rock.map}
                normalMap={rock.normalMap}
                roughnessMap={rock.roughnessMap}
                roughness={0.92}
              />
            </mesh>
          ))}
        </group>
      ))}
      <Glow position={[3.5, 6.2, -26]} size={10} color="#ffe3a8" opacity={0.32 + Math.sin(t) * 0.02} />
      {children}
    </group>
  );
};

// ───────────────────────── 2. FloodedBackyard (burst backyard pool flooding desert canyon cliff) ─────────────────────────
export const FloodedBackyard: React.FC<{ children?: React.ReactNode; t?: number }> = ({ children, t = 0 }) => {
  const grass = useMemo(() => tex("grass", "#427834", [8, 8], 8), []);
  const rock = usePbr("brown_mud_rocks_01", [4, 3]);

  return (
    <group>
      {/* Terraced grass backyard cliff perched solidly atop dark canyon rock bluff */}
      <RB p={[-1.05, 1.38, -0.85]} s={[5.2, 0.22, 4.4]} r={0.02} map={grass} rough={0.9} />
      <mesh position={[-1.05, 0.55, -0.85]} receiveShadow>
        <boxGeometry args={[5.15, 1.48, 4.3]} />
        <meshStandardMaterial color="#7d4c32" map={rock.map} roughness={0.94} />
      </mesh>
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[28, 0.25, 28]} />
        <meshStandardMaterial color="#8f583c" map={rock.map} roughness={0.92} />
      </mesh>
      {/* Wooden picket fence posts */}
      {[-3.0, -1.8, -0.6, 0.6].map((fx) => (
        <RB key={fx} p={[fx, 1.85, -2.95]} s={[0.14, 0.85, 0.1]} r={0.01} color="#d6c4a4" rough={0.8} />
      ))}
      <RB p={[-1.2, 1.98, -2.95]} s={[4.2, 0.1, 0.08]} r={0.01} color="#d6c4a4" rough={0.8} />
      {/* Burst kiddie pool perched right at canyon bluff edge with broken notch spilling waterfall */}
      <Cyl p={[-0.75, 1.66, -0.35]} r={1.08} h={0.42} seg={24} color="#3aa8e8" rough={0.35} />
      <Cyl p={[-0.75, 1.72, -0.35]} r={0.94} h={0.32} seg={24} color="#76e4ff" emissive="#22b8e8" ei={0.35} />
      {/* Continuous sloped waterfall torrent spilling off yard lip down rock bluff + churning splash foam below */}
      <RB p={[0.15, 0.72, 1.35]} rot={[0.62, 0, 0]} s={[1.45, 0.14, 1.95]} r={0.04} color="#58d6ff" emissive="#22b2e6" ei={0.45} opacity={0.9} />
      <RB p={[0.15, 0.72, 1.38]} rot={[0.62, 0, 0]} s={[0.45, 0.16, 1.9]} r={0.04} color="#b8f4ff" emissive="#66e4ff" ei={0.5} opacity={0.85} />
      {[-0.4, 0.15, 0.7].map((sx, si) => (
        <mesh key={si} position={[sx + 0.15, 0.14 + Math.sin(t * 7 + si) * 0.05, 2.15]} scale={[1.2, 0.5, 0.9]}>
          <sphereGeometry args={[0.38, 10, 8]} />
          <meshStandardMaterial color="#e8fbff" emissive="#9eeeff" emissiveIntensity={0.4} roughness={0.5} />
        </mesh>
      ))}
      <RB p={[0.45, -0.05, 3.6 + Math.sin(t * 6) * 0.08]} s={[5.2, 0.14, 4.4]} r={0.02} color="#178ab4" opacity={0.9} />
      {children}
    </group>
  );
};

export const StudioDark: React.FC<{ children?: React.ReactNode; spotColor?: string; spotI?: number }> = ({
  children,
  spotColor = "#9ae4ff",
  spotI = 26,
}) => (
  <group>
    <Slab p={[0, -0.02, 0]} s={[20, 0.04, 18]} color="#0b121e" rough={0.86} metal={0.14} />
    <pointLight position={[0, 4.4, 3.0]} intensity={spotI} distance={18} color={spotColor} castShadow={false} />
    {children}
  </group>
);
