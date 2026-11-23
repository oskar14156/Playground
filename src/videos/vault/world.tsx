import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, Glow, V3 } from "../../lib/three/core";
import { Cyl, Env, KeyLight, Post, RB, Slab, tex } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";

export type Look = "nightlawn" | "bunker" | "studio" | "gold" | "army";

export const VaultCanvas: React.FC<{
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
    look === "gold"
      ? "#1a1308"
      : look === "army"
        ? "#070f18"
        : look === "bunker"
          ? "#0a0e14"
          : look === "nightlawn"
            ? "#081220"
            : "#09101a";
  const hemiSky = look === "gold" ? "#ffe6a8" : "#6ea8e0";
  const hemiGround = look === "gold" ? "#3a2810" : "#121820";
  const kPos: V3 = keyPos ?? [cam.look[0] + 3.4, cam.look[1] + 5.8, cam.look[2] + 4.4];
  const kInt = keyI ?? (look === "gold" ? 2.1 : 1.7);
  const kCol = look === "gold" ? "#ffe39c" : "#d8ecff";

  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 44, near: 0.03, far: 400 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 14, 52]} />
      <hemisphereLight args={[hemiSky, hemiGround, look === "gold" ? 0.55 : 0.44]} />
      <KeyLight p={kPos} target={cam.look} intensity={kInt} color={kCol} size={shadow} />
      {children}
      <Env intensity={look === "gold" ? 0.36 : 0.25} />
      <Post bloom={look === "gold" ? 0.95 : 0.78} ao={ao} vignette={0.4} />
    </ThreeCanvas>
  );
};

// ───────────────────────── 1. FortKnoxLawn (Kentucky night grass, paved driveway, security floodlights) ─────────────────────────
export const FortKnoxLawn: React.FC<{ children?: React.ReactNode; t?: number }> = ({ children, t = 0 }) => {
  const grass = useMemo(() => tex("grass", "#1e3a22", [10, 10], 8), []);
  const concrete = usePbr("concrete_floor_02", [4, 4]);

  return (
    <group>
      <RB p={[0, -0.04, 0]} s={[34, 0.08, 34]} r={0.01} map={grass} rough={0.94} />
      {/* Paved limestone concrete security apron & front approach driveway */}
      <mesh position={[0, 0.01, 2.2]} receiveShadow>
        <boxGeometry args={[6.8, 0.04, 8.2]} />
        <meshStandardMaterial color="#8c929a" map={concrete.map} normalMap={concrete.normalMap} roughnessMap={concrete.roughnessMap} roughness={0.85} />
      </mesh>
      {/* Perimeter steel bollards along driveway */}
      {[-2.4, -1.2, 1.2, 2.4].map((x, i) => (
        <Cyl key={i} p={[x, 0.22, 4.2]} r={0.08} h={0.44} color="#e5b838" metal={0.5} rough={0.4} />
      ))}
      {/* Twin tall night compound floodlight masts */}
      {[-3.6, 3.6].map((lx, i) => (
        <group key={i} position={[lx, 0, 2.6]}>
          <Cyl p={[0, 1.8, 0]} r={0.05} h={3.6} color="#586472" metal={0.8} />
          <RB p={[0, 3.6, 0]} s={[0.45, 0.14, 0.14]} r={0.02} color="#fff4d6" emissive="#c6e8ff" ei={1.4} />
        </group>
      ))}
      <Glow position={[0, 4.5, -14]} size={10} color="#4d82c4" opacity={0.28 + Math.sin(t) * 0.02} />
      {children}
    </group>
  );
};

// ───────────────────────── 2. BunkerInterior & StudioDark ─────────────────────────
export const BunkerInterior: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const floor = usePbr("concrete_floor_02", [5, 5]);
  return (
    <group>
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[20, 0.08, 18]} />
        <meshStandardMaterial color="#6e7782" map={floor.map} normalMap={floor.normalMap} roughnessMap={floor.roughnessMap} roughness={0.86} />
      </mesh>
      <pointLight position={[-1.4, 3.8, 2.5]} intensity={24} distance={15} color="#ffd89c" castShadow={false} />
      <pointLight position={[1.8, 3.2, 2.4]} intensity={18} distance={14} color="#9adfff" castShadow={false} />
      {children}
    </group>
  );
};

export const StudioDark: React.FC<{ children?: React.ReactNode; spotColor?: string; spotI?: number }> = ({
  children,
  spotColor = "#ffd890",
  spotI = 26,
}) => (
  <group>
    <Slab p={[0, -0.02, 0]} s={[18, 0.04, 16]} color="#0d131d" rough={0.88} metal={0.14} />
    <pointLight position={[0, 4.2, 2.8]} intensity={spotI} distance={16} color={spotColor} castShadow={false} />
    {children}
  </group>
);
