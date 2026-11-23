import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, Glow, V3 } from "../../lib/three/core";
import { Env, KeyLight, Post, RB, Slab, Cyl } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";

const DubaiPalm: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <Cyl p={[0, 0.75, 0]} r={0.08} r2={0.05} h={1.5} color="#7c5b3e" rough={0.92} />
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i * Math.PI * 2) / 6;
      return (
        <group key={i} position={[0, 1.48, 0]} rotation={[0.42, a, 0]}>
          <RB p={[0, 0, 0.38]} s={[0.16, 0.03, 0.76]} r={0.01} color="#4d8b3e" rough={0.75} />
        </group>
      );
    })}
  </group>
);

const glassCache = new Map<string, THREE.CanvasTexture>();
const cityGlassTex = (night: boolean) => {
  const key = night ? "city-glass-night" : "city-glass-day";
  if (glassCache.has(key)) return glassCache.get(key)!;
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 512;
  const g = cv.getContext("2d")!;
  g.fillStyle = night ? "#142438" : "#4b7999";
  g.fillRect(0, 0, 256, 512);
  g.fillStyle = night ? "#294666" : "#b8d6ea";
  for (let x = 0; x < 256; x += 28) g.fillRect(x, 0, 3, 512);
  for (let y = 0; y < 512; y += 22) {
    g.fillStyle = night ? "#0e1a28" : "#284862";
    g.fillRect(0, y, 256, 4);
    if (night && y % 66 === 0) {
      g.fillStyle = "#ffd98c";
      for (let x = 6; x < 246; x += 56) g.fillRect(x, y + 6, 16, 10);
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  glassCache.set(key, t);
  return t;
};

export type Look = "clouds" | "underground" | "nightsite" | "dayheat" | "studio";

export const SkyCanvas: React.FC<{
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
    look === "clouds"
      ? "#9ad4f8"
      : look === "dayheat"
        ? "#f5b067"
        : look === "nightsite"
          ? "#091020"
          : look === "underground"
            ? "#0d0f14"
            : "#09111c";
  const fog: [number, number] = look === "clouds" || look === "dayheat" ? [20, 75] : [10, 42];
  const hemiSky = look === "clouds" ? "#fff9eb" : look === "dayheat" ? "#ffd29e" : "#406b9c";
  const hemiGround = look === "clouds" ? "#6d8fb0" : "#181410";
  const hemiI = look === "clouds" || look === "dayheat" ? 0.78 : 0.38;
  const kPos: V3 = keyPos ?? [cam.look[0] + 3.4, cam.look[1] + 5.6, cam.look[2] + 4.5];
  const kInt = keyI ?? (look === "clouds" || look === "dayheat" ? 1.9 : 1.55);
  const kCol = look === "dayheat" ? "#ffcf8c" : look === "clouds" ? "#fff5df" : "#cce8ff";

  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 44, near: 0.03, far: 400 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, fog[0], fog[1]]} />
      <hemisphereLight args={[hemiSky, hemiGround, hemiI]} />
      <KeyLight p={kPos} target={cam.look} intensity={kInt} color={kCol} size={shadow} />
      {children}
      <Env intensity={look === "clouds" ? 0.42 : 0.25} />
      <Post bloom={look === "clouds" ? 0.5 : 0.85} ao={ao} vignette={look === "clouds" ? 0.22 : 0.45} />
    </ThreeCanvas>
  );
};

// ───────────────────────── 1. DubaiDesert (day/night sand & glazed Downtown Dubai skyline + fountain basin) ─────────────────────────
export const DubaiDesert: React.FC<{ children?: React.ReactNode; t?: number; night?: boolean; plaza?: boolean }> = ({
  children,
  t = 0,
  night = false,
  plaza = true,
}) => {
  const sand = usePbr("coast_sand_rocks_02", [8, 8]);
  const stone = usePbr("concrete_floor_02", [4, 4]);
  const cityGlass = useMemo(() => cityGlassTex(night), [night]);
  const towers = useMemo(
    () => [
      { x: -5.8, h: 3.1, w: 0.92, z: -8.2, spire: 0.45 },
      { x: -3.8, h: 4.3, w: 0.96, z: -9.8, spire: 0.7 },
      { x: 4.1, h: 3.85, w: 0.94, z: -9.3, spire: 0.55 },
      { x: 6.1, h: 2.85, w: 0.88, z: -8.0, spire: 0.35 },
      { x: -1.9, h: 2.55, w: 0.86, z: -11.2, spire: 0.3 },
      { x: 2.1, h: 2.75, w: 0.9, z: -11.0, spire: 0.4 },
    ],
    [],
  );

  return (
    <group>
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[42, 0.08, 42]} />
        <meshStandardMaterial color={night ? "#473b2c" : "#dbb882"} map={sand.map} normalMap={sand.normalMap} roughnessMap={sand.roughnessMap} roughness={0.92} />
      </mesh>
      {plaza ? (
        <group>
          {/* Downtown limestone podium plaza & turquoise Dubai Fountain lake */}
          <Cyl p={[0, 0.02, 0]} r={2.35} h={0.05} seg={32} map={stone.map} color={night ? "#5c6470" : "#e5dec9"} rough={0.75} />
          <Cyl p={[0.35, 0.045, 0.95]} r={1.65} h={0.025} seg={32} color={night ? "#155570" : "#2799b8"} rough={0.14} metal={0.25} />
          {/* Fountain water jets pulsing gently */}
          {[-0.6, -0.1, 0.4, 0.9].map((fx, j) => (
            <Cyl
              key={j}
              p={[fx, 0.14 + Math.sin(t * 4 + j) * 0.05, 1.35]}
              r={0.025}
              r2={0.012}
              h={0.22 + Math.sin(t * 4 + j) * 0.08}
              color="#d8f6ff"
              emissive="#98e8ff"
              ei={0.5}
            />
          ))}
          {[-1.85, 1.85].map((px) => (
            <DubaiPalm key={px} p={[px, 0.04, 0.9]} s={0.42} />
          ))}
        </group>
      ) : null}
      {towers.map((tw, i) => (
        <group key={i} position={[tw.x, 0, tw.z]}>
          {/* Podium */}
          <RB p={[0, 0.25, 0]} s={[tw.w * 1.25, 0.5, tw.w * 1.15]} r={0.03} color={night ? "#232c3b" : "#9da9b5"} rough={0.7} />
          {/* Main glazed shaft */}
          <RB p={[0, tw.h * 0.5, 0]} s={[tw.w, tw.h, tw.w]} r={0.04} map={cityGlass} color={night ? "#6889ab" : "#86b4d1"} metal={0.62} rough={0.22} />
          {/* Upper crown setback + steel mast */}
          <RB p={[0, tw.h + 0.28, 0]} s={[tw.w * 0.68, 0.58, tw.w * 0.68]} r={0.03} map={cityGlass} color={night ? "#5c7a98" : "#9ec6de"} metal={0.68} rough={0.18} />
          <Cyl p={[0, tw.h + 0.56 + tw.spire * 0.5, 0]} r={0.03} r2={0.008} h={tw.spire} color="#dce6f0" metal={0.9} />
        </group>
      ))}
      <Glow position={[3.5, 5.2, -24]} size={10} color={night ? "#7ec2ff" : "#ffe8b0"} opacity={0.35 + Math.sin(t) * 0.02} />
      {children}
    </group>
  );
};

// ───────────────────────── 2. NightSite & StudioDark ─────────────────────────
export const NightSite: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <group>
    <Slab p={[0, -0.04, 0]} s={[20, 0.08, 18]} color="#161b24" rough={0.9} />
    <pointLight position={[-1.6, 3.8, 2.2]} intensity={26} distance={15} color="#a4dfff" castShadow={false} />
    <pointLight position={[1.8, 2.8, 1.8]} intensity={14} distance={12} color="#ffd58c" castShadow={false} />
    {children}
  </group>
);

export const StudioDark: React.FC<{ children?: React.ReactNode; spotColor?: string; spotI?: number }> = ({
  children,
  spotColor = "#c8e6ff",
  spotI = 26,
}) => (
  <group>
    <Slab p={[0, -0.02, 0]} s={[18, 0.04, 16]} color="#0c131f" rough={0.88} metal={0.12} />
    <pointLight position={[0, 4.2, 2.8]} intensity={spotI} distance={16} color={spotColor} castShadow={false} />
    {children}
  </group>
);
