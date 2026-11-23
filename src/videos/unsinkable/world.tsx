import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, Glow, V3 } from "../../lib/three/core";
import { Cyl, Env, KeyLight, Post, RB, Slab, tex } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";

export type Look = "harbor" | "shipyard" | "night" | "abyss" | "studio";

export const ShipCanvas: React.FC<{
  cam: Cam;
  look: Look;
  children: React.ReactNode;
  ao?: number;
  keyPos?: V3;
  keyI?: number;
  shadow?: number;
}> = ({ cam, look, children, ao = 0.85, keyPos, keyI, shadow = 14 }) => {
  const { width, height } = useVideoConfig();
  const bg =
    look === "harbor"
      ? "#9ed2f2"
      : look === "shipyard"
        ? "#101b2c"
        : look === "night"
          ? "#070c1a"
          : look === "abyss"
            ? "#041624"
            : "#09101c";
  const fog: [number, number] = look === "harbor" ? [18, 65] : look === "abyss" ? [7, 26] : [10, 40];
  const hemiSky = look === "harbor" ? "#fff9e8" : look === "abyss" ? "#267ba8" : "#446c9e";
  const hemiGround = look === "harbor" ? "#254e6b" : "#071019";
  const hemiI = look === "harbor" ? 0.72 : look === "abyss" ? 0.45 : 0.35;
  const kPos: V3 = keyPos ?? [cam.look[0] + 3.2, cam.look[1] + 5.2, cam.look[2] + 4.4];
  const kInt = keyI ?? (look === "harbor" ? 1.85 : look === "abyss" ? 1.35 : 1.55);
  const kCol = look === "harbor" ? "#fff4dc" : look === "abyss" ? "#6be0ff" : "#cce8ff";

  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 44, near: 0.03, far: 400 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, fog[0], fog[1]]} />
      <hemisphereLight args={[hemiSky, hemiGround, hemiI]} />
      <KeyLight p={kPos} target={cam.look} intensity={kInt} color={kCol} size={shadow} />
      {children}
      <Env intensity={look === "harbor" ? 0.38 : 0.22} />
      <Post bloom={look === "harbor" ? 0.45 : 0.85} ao={ao} vignette={look === "harbor" ? 0.25 : 0.48} />
    </ThreeCanvas>
  );
};

// ───────────────────────── 1. HarborPier (Daytime Belfast/Southampton pier + open Atlantic) ─────────────────────────
export const HarborPier: React.FC<{ children?: React.ReactNode; t?: number }> = ({ children, t = 0 }) => {
  const planks = useMemo(() => tex("planks", "#825c3c", [6, 3], 9), []);
  return (
    <group>
      {/* sunlit sparkling Atlantic sea surface */}
      <Slab p={[0, -0.04, 0]} s={[60, 0.08, 60]} color="#165d8c" rough={0.18} metal={0.25} />
      {/* wooden timber harbor pier deck on left side */}
      <RB p={[-2.2, 0.35, 0.8]} s={[3.2, 0.26, 7.5]} r={0.03} map={planks} rough={0.78} />
      {/* pier pilings & brass-topped mooring bollards */}
      {[-1.5, 0.2, 1.9, 3.2].map((z, i) => (
        <group key={i} position={[-0.78, 0.42, z]}>
          <Cyl p={[0, -0.3, 0]} r={0.1} h={0.85} color="#4d331e" rough={0.85} />
          <Cyl p={[-0.18, 0.24, 0]} r={0.07} h={0.26} color="#262c34" metal={0.8} rough={0.35} />
        </group>
      ))}
      {/* industrial gantry slipway silhouette in background distance */}
      <group position={[-4.5, 0, -9.5]}>
        {[-1.5, 1.5].map((x) => (
          <RB key={x} p={[x, 3.2, 0]} s={[0.24, 6.4, 0.24]} r={0.02} color="#3b4d63" metal={0.6} />
        ))}
        <RB p={[0, 6.2, 0]} s={[3.8, 0.28, 0.28]} r={0.02} color="#3b4d63" metal={0.6} />
      </group>
      {/* warm sun glow on water horizon */}
      <Glow position={[4, 4.5, -24]} size={10} color="#fff1c4" opacity={0.45 + Math.sin(t) * 0.02} />
      {children}
    </group>
  );
};

// ───────────────────────── 2. AtlanticNight (Dark moonlit ocean + distant stars) ─────────────────────────
export const AtlanticNight: React.FC<{ children?: React.ReactNode; t?: number }> = ({ children, t = 0 }) => {
  const stars = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        x: ((i * 37) % 36) - 18,
        y: 3.5 + ((i * 19) % 10),
        z: -16 - ((i * 11) % 8),
        s: 0.03 + (i % 3) * 0.015,
      })),
    [],
  );
  return (
    <group>
      <Slab p={[0, -0.04, 0]} s={[60, 0.08, 60]} color="#081c30" rough={0.14} metal={0.35} />
      {stars.map((st, idx) => (
        <mesh key={idx} position={[st.x, st.y, st.z]}>
          <sphereGeometry args={[st.s, 6, 6]} />
          <meshBasicMaterial color="#e8f3ff" />
        </mesh>
      ))}
      <Glow position={[-3.5, 6.2, -20]} size={5.2} color="#cce4ff" opacity={0.35 + Math.sin(t) * 0.02} />
      {children}
    </group>
  );
};

// ───────────────────────── 3. UnderwaterDeep (Abyssal 3,800 m seabed & cyan water volume) ─────────────────────────
export const UnderwaterDeep: React.FC<{ children?: React.ReactNode; t?: number; spotI?: number }> = ({ children, t = 0, spotI = 26 }) => {
  const sand = usePbr("brown_mud_rocks_01", [5, 5]);
  return (
    <group>
      <mesh position={[0, -1.65, 0]} receiveShadow>
        <boxGeometry args={[26, 0.14, 26]} />
        <meshStandardMaterial map={sand.map} normalMap={sand.normalMap} roughnessMap={sand.roughnessMap} roughness={0.92} />
      </mesh>
      {/* Volumetric submarine searchlight glow overhead */}
      <pointLight position={[0.4, 3.8, 2.2]} intensity={spotI} distance={16} color="#7fe4ff" castShadow={false} />
      <Glow position={[0, 4.2, -3]} size={6} color="#2894c8" opacity={0.28} />
      {/* Drifting marine snow specs */}
      {Array.from({ length: 24 }, (_, i) => {
        const y = -1.2 + (((i * 0.37 - t * 0.12) % 4) + 4) % 4;
        return (
          <mesh key={i} position={[((i * 2.3) % 6) - 3, y, ((i * 1.7) % 4) - 2]}>
            <sphereGeometry args={[0.022, 6, 6]} />
            <meshBasicMaterial color="#9ae6ff" transparent opacity={0.5} />
          </mesh>
        );
      })}
      {children}
    </group>
  );
};

// ───────────────────────── 4. StudioDark (Blueprint / technical cutaway stage) ─────────────────────────
export const StudioDark: React.FC<{ children?: React.ReactNode; spotColor?: string; spotI?: number }> = ({
  children,
  spotColor = "#c8e6ff",
  spotI = 24,
}) => (
  <group>
    <Slab p={[0, -0.02, 0]} s={[18, 0.04, 16]} color="#0d1522" rough={0.88} metal={0.12} />
    <pointLight position={[0, 3.8, 2.6]} intensity={spotI} distance={14} color={spotColor} castShadow={false} />
    {children}
  </group>
);
