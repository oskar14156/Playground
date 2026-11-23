import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, Glow, V3 } from "../../lib/three/core";
import { Cyl, Env, KeyLight, Post, RB, Slab, tex } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";

export type Look = "tarmac" | "ocean" | "cutaway" | "studio" | "daysea";

export const CarrierCanvas: React.FC<{
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
    look === "daysea"
      ? "#88c6eb"
      : look === "tarmac"
        ? "#182436"
        : look === "ocean"
          ? "#0a1c30"
          : "#08101c";
  const hemiSky = look === "daysea" ? "#fff6e2" : "#6ea8e0";
  const hemiGround = look === "daysea" ? "#264e70" : "#0b1522";
  const kPos: V3 = keyPos ?? [cam.look[0] + 4.2, cam.look[1] + 6.4, cam.look[2] + 4.8];
  const kInt = keyI ?? (look === "daysea" ? 2.0 : 1.75);
  const kCol = look === "daysea" ? "#fff2d4" : "#cde8ff";

  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 44, near: 0.03, far: 400 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 16, 70]} />
      <hemisphereLight args={[hemiSky, hemiGround, look === "daysea" ? 0.72 : 0.44]} />
      <KeyLight p={kPos} target={cam.look} intensity={kInt} color={kCol} size={shadow} />
      {children}
      <Env intensity={look === "daysea" ? 0.42 : 0.25} />
      <Post bloom={look === "daysea" ? 0.55 : 0.85} ao={ao} vignette={look === "daysea" ? 0.25 : 0.42} />
    </ThreeCanvas>
  );
};

// ───────────────────────── 1. AirportTarmac (curb outside BANNED terminal) ─────────────────────────
export const AirportTarmac: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const asphalt = useMemo(() => tex("asphalt", "#252b34", [8, 8], 8), []);
  const wall = usePbr("concrete_floor_02", [3, 2]);
  const signTex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 160;
    const g = cv.getContext("2d")!;
    g.fillStyle = "#1d1014";
    g.fillRect(0, 0, 512, 160);
    g.strokeStyle = "#ff4238";
    g.lineWidth = 8;
    g.strokeRect(6, 6, 500, 148);
    g.fillStyle = "#ff4c3d";
    g.font = "bold 46px sans-serif";
    g.textAlign = "center";
    g.fillText("NO FLY LIST", 256, 68);
    g.fillStyle = "#ffd23f";
    g.font = "bold 28px sans-serif";
    g.fillText("POCKET PUH BANNED", 256, 120);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  return (
    <group>
      <RB p={[0, -0.04, 0]} s={[26, 0.08, 22]} r={0.01} map={asphalt} rough={0.92} />
      {/* Double yellow curb & taxiway stripe */}
      <RB p={[0, 0.01, 1.35]} s={[16, 0.02, 0.14]} r={0.005} color="#e5b838" />
      {/* Terminal facade & BANNED sign */}
      <mesh position={[0, 1.45, -1.65]} receiveShadow>
        <boxGeometry args={[8.5, 2.9, 0.45]} />
        <meshStandardMaterial color="#8c96a4" map={wall.map} roughness={0.78} />
      </mesh>
      <RB p={[0, 1.35, -1.38]} s={[5.4, 1.65, 0.08]} r={0.02} color="#68c6ff" opacity={0.35} />
      <mesh position={[0, 2.15, -1.3]}>
        <planeGeometry args={[2.6, 0.82]} />
        <meshBasicMaterial map={signTex} />
      </mesh>
      {/* Bollard posts */}
      {[-1.8, -0.6, 0.6, 1.8].map((x) => (
        <Cyl key={x} p={[x, 0.35, 0.6]} r={0.06} h={0.7} color="#f5a623" metal={0.6} />
      ))}
      {children}
    </group>
  );
};

// ───────────────────────── 2. OpenOcean (sunlit or deep blue animated waves) ─────────────────────────
export const OpenOcean: React.FC<{ children?: React.ReactNode; t?: number; day?: boolean }> = ({
  children,
  t = 0,
  day = true,
}) => (
  <group>
    <Slab p={[0, -0.15, 0]} s={[60, 0.25, 60]} color={day ? "#0e4d73" : "#071d32"} rough={0.28} metal={0.38} />
    {/* Animated whitecap swells */}
    {[-5.5, -2.5, 1.5, 4.8].map((wz, i) => {
      const wx = Math.sin(t * 0.9 + i * 1.4) * 1.6;
      return (
        <RB
          key={i}
          p={[wx + (i % 2 ? -2.8 : 2.8), -0.01, wz]}
          s={[2.2, 0.03, 0.18]}
          r={0.01}
          color={day ? "#b8ecff" : "#3a789c"}
          rough={0.4}
        />
      );
    })}
    <Glow position={[4, 6.5, -28]} size={12} color={day ? "#fff2c6" : "#4ca4ff"} opacity={day ? 0.38 : 0.22} />
    {children}
  </group>
);

export const StudioDark: React.FC<{ children?: React.ReactNode; spotColor?: string; spotI?: number }> = ({
  children,
  spotColor = "#9ae4ff",
  spotI = 26,
}) => (
  <group>
    <Slab p={[0, -0.02, 0]} s={[20, 0.04, 18]} color="#0b131f" rough={0.86} metal={0.14} />
    <pointLight position={[0, 4.4, 3.0]} intensity={spotI} distance={18} color={spotColor} castShadow={false} />
    {children}
  </group>
);
