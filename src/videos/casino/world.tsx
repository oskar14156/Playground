import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, Glow, V3 } from "../../lib/three/core";
import { Cyl, Env, KeyLight, Lamp, Post, RB, Slab, tex, Window } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { CeilingDome, ExitSign, SlotMachine, WallClock } from "./props";

export type Look = "parlor" | "maze" | "bellagio" | "vip" | "studio" | "security" | "vegas";

export const Spot: React.FC<{ p: V3; target: V3; angle: number; penumbra?: number; intensity: number; distance: number; color?: string }> = ({
  p,
  target,
  angle,
  penumbra = 0.65,
  intensity,
  distance,
  color = "#ffffff",
}) => {
  const l = useMemo(() => new THREE.SpotLight(), []);
  l.position.set(...p);
  l.target.position.set(...target);
  l.angle = angle;
  l.penumbra = penumbra;
  l.intensity = intensity;
  l.distance = distance;
  l.decay = 2;
  l.color.set(color);
  return (
    <>
      <primitive object={l} />
      <primitive object={l.target} />
    </>
  );
};

// Procedural burgundy + gold diamond casino carpet texture
const useCarpetTex = (bgCol = "#4f0f1a", accent = "#d4a23a") =>
  useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    g.fillStyle = bgCol;
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = accent;
    g.lineWidth = 4;
    for (let y = 0; y <= 256; y += 64) {
      for (let x = 0; x <= 256; x += 64) {
        g.beginPath();
        g.moveTo(x, y - 24);
        g.lineTo(x + 24, y);
        g.lineTo(x, y + 24);
        g.lineTo(x - 24, y);
        g.closePath();
        g.stroke();
      }
    }
    const tx = new THREE.CanvasTexture(cv);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(8, 8);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
  }, [accent, bgCol]);

export const CasinoCanvas: React.FC<{
  cam: Cam;
  look: Look;
  children: React.ReactNode;
  ao?: number;
  keyPos?: V3;
  keyI?: number;
  shadow?: number;
}> = ({ cam, look, children, ao = 1.0, keyPos, keyI, shadow = 12 }) => {
  const { width, height } = useVideoConfig();
  const dark = look === "studio" || look === "security" || look === "vegas";
  const bg =
    look === "bellagio"
      ? "#f2e5cf"
      : look === "parlor"
        ? "#2a1614"
        : look === "maze"
          ? "#1a0a0d"
          : look === "vip"
            ? "#1e0d14"
            : look === "vegas"
              ? "#090b18"
              : "#0b0e16";
  const fog: [number, number] = dark ? [8, 28] : look === "bellagio" ? [14, 52] : [10, 42];
  const hemiSky = look === "bellagio" ? "#fff6e5" : dark ? "#2a3554" : "#ffdcb0";
  const hemiGround = look === "bellagio" ? "#6e5c45" : "#1a1012";
  const hemiI = look === "bellagio" ? 0.8 : look === "parlor" ? 0.52 : look === "vip" ? 0.45 : dark ? 0.25 : 0.35;
  const kPos: V3 = keyPos ?? [cam.look[0] + 2.4, cam.look[1] + 4.0, cam.look[2] + 3.4];
  const kInt = keyI ?? (look === "bellagio" ? 1.85 : look === "studio" ? 1.5 : 1.45);
  const kCol = look === "security" ? "#b8dcff" : look === "vegas" ? "#cfe8ff" : "#fff1da";

  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 42, near: 0.03, far: 400 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, fog[0], fog[1]]} />
      <hemisphereLight args={[hemiSky, hemiGround, hemiI]} />
      <KeyLight p={kPos} target={cam.look} intensity={kInt} color={kCol} size={shadow} />
      {children}
      <Env intensity={look === "bellagio" ? 0.35 : dark ? 0.16 : 0.22} />
      <Post bloom={dark ? 1.05 : 0.55} ao={ao} vignette={dark ? 0.55 : 0.35} />
    </ThreeCanvas>
  );
};

// ───────────────────────── 1. ParlorRoom (Hook + Clock/Window Removal) ─────────────────────────
export const ParlorRoom: React.FC<{ children?: React.ReactNode; clockOut?: number; windowOut?: number }> = ({
  children,
  clockOut = 0,
  windowOut = 0,
}) => {
  const carpet = useCarpetTex("#5e1320", "#d4a23a");
  const wood = useMemo(() => tex("planks", "#4a2718", [3, 2], 14), []);
  const wallPaper = useMemo(() => tex("wallpaper", "#3d121c", [4, 2], 7), []);
  return (
    <group>
      <Slab p={[0, -0.02, 0]} s={[11, 0.04, 10]} map={carpet} rough={0.92} />
      <Slab p={[0, 2.0, -2.6]} s={[11, 4.0, 0.14]} map={wallPaper} rough={0.85} />
      <Slab p={[-4.6, 2.0, 1.0]} s={[0.14, 4.0, 10]} map={wallPaper} rough={0.85} />
      <Slab p={[4.6, 2.0, 1.0]} s={[0.14, 4.0, 10]} map={wallPaper} rough={0.85} />
      <Slab p={[0, 4.02, 1.0]} s={[11, 0.08, 10]} color="#2b1218" rough={0.9} />
      {/* rich mahogany wainscot panelling along lower wall */}
      <RB p={[0, 0.45, -2.5]} s={[10.8, 0.9, 0.06]} r={0.01} map={wood} rough={0.65} />
      {/* right side door with glowing EXIT sign */}
      <group position={[2.2, 0, -2.48]}>
        <RB p={[0, 1.05, 0]} s={[1.05, 2.1, 0.08]} r={0.02} color="#3a1c0f" rough={0.55} />
        <RB p={[0.38, 1.0, 0.06]} s={[0.04, 0.14, 0.05]} r={0.01} color="#e5ba45" metal={0.85} />
        <ExitSign p={[0, 2.34, 0.04]} />
      </group>
      {/* Window on left wall that shrinks/bricks away when `windowOut` rises */}
      {windowOut < 0.95 ? (
        <group position={[-1.4, 1.58, -2.5]} scale={1 - windowOut}>
          <Window p={[0, 0, 0]} s={[1.35, 1.3]} sky="#9fd4ff" glow={0.9 * (1 - windowOut)} curtains="#6b1d28" />
        </group>
      ) : null}
      {/* Wall clock above left wall that unhooks and drops cleanly with `clockOut` */}
      {clockOut < 0.96 ? <WallClock p={[0.15, 2.02, -2.48]} fall={clockOut} /> : null}
      <Lamp p={[-2.4, 0, -1.9]} on={0.9} color="#ffe0a6" />
      <Spot p={[0, 3.6, 0.2]} target={[0, 0.78, 0]} angle={0.8} intensity={14} distance={9} color="#ffe8ba" />
      {children}
    </group>
  );
};

// ───────────────────────── 2. MazeRoom (Confusing Low-Ceiling Classic Casino Floor) ─────────────────────────
export const MazeRoom: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const carpet = useCarpetTex("#420b15", "#e0852a");
  return (
    <group>
      <Slab p={[0, -0.02, 0]} s={[12, 0.04, 12]} map={carpet} rough={0.95} />
      {/* claustrophobic low ceiling y=2.55 */}
      <Slab p={[0, 2.58, 0]} s={[12, 0.08, 12]} color="#170a0e" rough={0.95} />
      <Slab p={[0, 1.28, -3.4]} s={[12, 2.6, 0.14]} color="#260c14" rough={0.9} />
      <Slab p={[-4.5, 1.28, 0]} s={[0.14, 2.6, 12]} color="#260c14" rough={0.9} />
      <Slab p={[4.5, 1.28, 0]} s={[0.14, 2.6, 12]} color="#260c14" rough={0.9} />
      {/* winding maze banks of slot machines blocking clear sightlines */}
      {[-1.12, 1.12].map((x, idx) => (
        <SlotMachine key={`a-${idx}`} p={[x, 0, -0.35]} ry={idx === 0 ? 0.55 : -0.55} scale={0.88} flash={0.4} />
      ))}
      {[-0.45, 0.45].map((x, idx) => (
        <SlotMachine key={`b-${idx}`} p={[x, 0, -1.85]} ry={idx === 0 ? 0.1 : -0.1} scale={0.88} flash={0.6} />
      ))}
      <SlotMachine p={[-2.1, 0, 1.2]} ry={1.1} scale={0.85} />
      <SlotMachine p={[2.1, 0, 1.2]} ry={-1.1} scale={0.85} />
      {children}
    </group>
  );
};

// ───────────────────────── 3. BellagioRoom (Soaring Luxury Glass-Art Playground) ─────────────────────────
export const BellagioRoom: React.FC<{ children?: React.ReactNode; t?: number }> = ({ children, t = 0 }) => {
  const marble = usePbr("concrete_floor_02", [5, 5]);
  const blossoms = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => {
        const ring = i < 14 ? 0 : i < 28 ? 1 : 2;
        const n = ring === 0 ? 14 : ring === 1 ? 14 : 8;
        const idx = ring === 0 ? i : ring === 1 ? i - 14 : i - 28;
        const a = (idx / n) * Math.PI * 2 + ring * 0.22;
        const rad = ring === 0 ? 0.8 : ring === 1 ? 0.44 : 0.18;
        const colors = ["#e69b18", "#d42638", "#1a6fd4", "#18a878", "#c92a6a", "#f0b830"];
        return {
          x: Math.cos(a) * rad,
          z: Math.sin(a) * rad - 0.5,
          y: 3.02 - ring * 0.12,
          rx: Math.sin(a) * 0.45,
          rz: -Math.cos(a) * 0.45,
          col: colors[i % colors.length],
        };
      }),
    [],
  );

  return (
    <group>
      {/* polished warm ivory marble lobby floor + luxury crimson/gold runner */}
      <Slab p={[0, -0.02, 0]} s={[16, 0.04, 16]} {...marble} color="#f5e6cc" rough={0.22} />
      <RB p={[0, 0.005, -0.5]} s={[1.7, 0.01, 10]} r={0.004} color="#5c111e" rough={0.92} />
      <RB p={[-0.88, 0.006, -0.5]} s={[0.06, 0.012, 10]} r={0.003} color="#d4a23a" metal={0.7} />
      <RB p={[0.88, 0.006, -0.5]} s={[0.06, 0.012, 10]} r={0.003} color="#d4a23a" metal={0.7} />

      <Slab p={[0, 2.4, -4.4]} s={[16, 4.9, 0.15]} color="#e8d6b8" rough={0.55} />
      <Slab p={[-5.6, 2.4, 0]} s={[0.15, 4.9, 16]} color="#e8d6b8" rough={0.55} />
      <Slab p={[5.6, 2.4, 0]} s={[0.15, 4.9, 16]} color="#e8d6b8" rough={0.55} />
      {/* high coffered gold ceiling y = 4.6 */}
      <Slab p={[0, 4.65, 0]} s={[16, 0.1, 16]} color="#fff5e0" rough={0.4} />
      {[-1.5, 0, 1.5].map((x) => (
        <RB key={x} p={[x, 4.55, -1.5]} s={[0.18, 0.12, 10]} r={0.01} color="#d4a23a" metal={0.75} rough={0.28} />
      ))}

      {/* grand fluted gold-capped lobby columns framing 9:16 */}
      {[
        [-1.45, -1.9],
        [1.45, -1.9],
        [-1.9, -3.8],
        [1.9, -3.8],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <RB p={[0, 0.22, 0]} s={[0.56, 0.44, 0.56]} r={0.02} color="#dcc294" rough={0.35} />
          <Cyl p={[0, 2.38, 0]} r={0.2} h={4.15} color="#f0dfbe" rough={0.3} />
          <Cyl p={[0, 4.44, 0]} r={0.32} h={0.2} color="#d4a23a" metal={0.85} rough={0.22} />
        </group>
      ))}

      {/* Chihuly-style Venetian blown-glass blossom chandelier */}
      <group position={[0, Math.sin(t * 1.4) * 0.02, -0.35]}>
        {/* brass suspension rods + concentric chandelier rings */}
        {[-0.45, 0.45].map((dx) => (
          <Cyl key={dx} p={[dx, 3.88, -0.5]} r={0.014} h={1.52} color="#d4a23a" metal={0.88} />
        ))}
        <mesh position={[0, 3.12, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.82, 0.022, 10, 40]} />
          <meshStandardMaterial color="#d4a23a" metalness={0.88} roughness={0.2} />
        </mesh>
        <mesh position={[0, 3.02, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.018, 10, 32]} />
          <meshStandardMaterial color="#d4a23a" metalness={0.88} roughness={0.2} />
        </mesh>
        {blossoms.map((b, idx) => (
          <mesh key={idx} position={[b.x, b.y, b.z]} rotation={[b.rx, 0, b.rz]}>
            <cylinderGeometry args={[0.04, 0.12, 0.22, 10]} />
            <meshPhysicalMaterial color={b.col} emissive={b.col} emissiveIntensity={0.16} roughness={0.12} clearcoat={1} />
          </mesh>
        ))}
        <Glow position={[0, 2.82, -0.5]} size={1.6} color="#ffcf7a" opacity={0.32} />
        <pointLight position={[0, 2.62, -0.5]} intensity={10} distance={10} color="#ffe4b0" castShadow={false} />
      </group>
      {children}
    </group>
  );
};

// ───────────────────────── 4. VipPitRoom (Chips/Drinks, Blackjack, Grandma Finale) ─────────────────────────
export const VipPitRoom: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const carpet = useCarpetTex("#450c19", "#d9aa42");
  const wall = useMemo(() => tex("wallpaper", "#2c0d16", [4, 2], 12), []);
  return (
    <group>
      <Slab p={[0, -0.02, 0]} s={[12, 0.04, 12]} map={carpet} rough={0.9} />
      <Slab p={[0, 2.2, -2.8]} s={[12, 4.4, 0.14]} map={wall} rough={0.85} />
      <Slab p={[-4.8, 2.2, 0.6]} s={[0.14, 4.4, 12]} map={wall} rough={0.85} />
      <Slab p={[4.8, 2.2, 0.6]} s={[0.14, 4.4, 12]} map={wall} rough={0.85} />
      <Slab p={[0, 4.42, 0.6]} s={[12, 0.08, 12]} color="#210910" rough={0.92} />
      {/* brass wall sconces + VIP gold stanchions in background */}
      {[-1.8, 1.8].map((sx, idx) => (
        <group key={idx} position={[sx, 2.25, -2.68]}>
          <RB p={[0, 0, 0]} s={[0.12, 0.28, 0.06]} r={0.01} color="#d4a23a" metal={0.85} />
          <Glow position={[0, 0.1, 0.1]} size={0.75} color="#ffd885" opacity={0.75} />
        </group>
      ))}
      <CeilingDome p={[0, 4.35, -0.35]} beam={0.45} />
      <Spot p={[0, 4.1, 0.6]} target={[0, 0.78, 0]} angle={0.78} intensity={20} distance={10} color="#ffe9c2" />
      {children}
    </group>
  );
};

// ───────────────────────── 5. StudioDark (Roulette Macro, Virtual Reel Cutaway, Vent Cutaway, RFID) ─────────────────────────
export const StudioDark: React.FC<{ children?: React.ReactNode; spotColor?: string; spotI?: number }> = ({
  children,
  spotColor = "#ffe8c2",
  spotI = 24,
}) => (
  <group>
    <Slab p={[0, -0.02, 0]} s={[14, 0.04, 14]} color="#0f131c" rough={0.88} />
    <Slab p={[0, 2.6, -3.5]} s={[14, 5.4, 0.12]} color="#0b0e16" rough={0.92} />
    <Slab p={[0, 5.2, 0]} s={[14, 0.1, 14]} color="#0b0e16" rough={0.92} />
    <Spot p={[0.3, 3.6, 2.1]} target={[0, 0.65, 0]} angle={0.68} intensity={spotI} distance={10} color={spotColor} />
    {children}
  </group>
);
