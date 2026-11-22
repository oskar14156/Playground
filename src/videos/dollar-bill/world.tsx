import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, Glow, V3 } from "../../lib/three/core";
import { Bookshelf, Can, Cyl, Env, Frame, KeyLight, labelTex, Lamp, Plant, Post, RB, Rug, Slab, Sofa, tex, Window } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";

export type Look = "room" | "laundry" | "store" | "uv" | "studio" | "sepia" | "day";

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

const SkyDome: React.FC = () => {
  const mat = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 4;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#5f95d4");
    gr.addColorStop(0.55, "#a9c9ea");
    gr.addColorStop(1, "#e9eef0");
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: tx, side: THREE.BackSide, fog: false, depthWrite: false });
  }, []);
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[400, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2 + 0.1]} />
    </mesh>
  );
};

export const BillCanvas: React.FC<{
  cam: Cam;
  look: Look;
  children: React.ReactNode;
  ao?: number;
  keyPos?: V3;
  keyI?: number;
  shadow?: number;
  fog?: [number, number];
  bg?: string;
}> = ({ cam, look, children, ao = 1.1, keyPos, keyI, shadow = 10, fog: fogIn, bg: bgIn }) => {
  const { width, height } = useVideoConfig();
  const dark = look === "uv" || look === "studio";
  const sepia = look === "sepia";
  const bg =
    bgIn ??
    (look === "uv"
      ? "#07040f"
      : look === "studio"
        ? "#0b0e16"
        : look === "sepia"
          ? "#1c140c"
          : look === "day"
            ? "#9fd0f2"
            : look === "store"
              ? "#dce4ec"
              : look === "laundry"
                ? "#d6e2e8"
                : "#d9d2c5");

  const fog: [number, number] = fogIn ?? (dark ? [6, 22] : sepia ? [5, 18] : look === "day" ? [60, 260] : [12, 48]);
  const hemiSky = dark ? "#2a2048" : sepia ? "#ffe0a8" : "#fff7eb";
  const hemiGround = dark ? "#0a0812" : sepia ? "#261a0e" : "#706658";
  const hemiI = look === "uv" ? 0.14 : look === "studio" ? 0.24 : sepia ? 0.45 : 0.62;
  const kPos: V3 = keyPos ?? (dark ? [cam.look[0] + 2.2, cam.look[1] + 3.4, cam.look[2] + 3.2] : [cam.look[0] + 2.6, cam.look[1] + 4.4, cam.look[2] + 4.0]);
  const kInt = keyI ?? (look === "uv" ? 0.32 : look === "studio" ? 1.55 : sepia ? 1.45 : 1.75);
  const kCol = look === "uv" ? "#a68cff" : sepia ? "#ffcf8c" : "#fff6e8";

  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.03, far: 1000 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      {look === "day" ? <SkyDome /> : null}
      <fog attach="fog" args={[bg, fog[0], fog[1]]} />
      <hemisphereLight args={[hemiSky, hemiGround, hemiI]} />
      <KeyLight p={kPos} target={cam.look} intensity={kInt} color={kCol} size={shadow} />
      {children}
      <Env intensity={look === "uv" ? 0.04 : look === "studio" ? 0.18 : 0.3} />
      <Post bloom={dark ? 1.15 : 0.45} ao={ao} vignette={dark ? 0.55 : 0.35} />
    </ThreeCanvas>
  );
};

// ───────────────────────── 1. DenRoom (Hook + Finale + Raid) ─────────────────────────
export const DenRoom: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const floorTex = useMemo(() => tex("planks", "#9c7049", [4, 4], 1), []);
  const wallTex = useMemo(() => tex("plaster", "#ebe4d5", [3, 2], 2), []);
  return (
    <group>
      {/* enclosed room shell: floor, back wall, side walls, front return & ceiling */}
      <Slab p={[0, -0.02, 0]} s={[9, 0.04, 8]} map={floorTex} rough={0.78} />
      <Slab p={[0, 1.8, -2.2]} s={[9, 3.6, 0.12]} map={wallTex} rough={0.92} />
      <Slab p={[-3.8, 1.8, 1.0]} s={[0.12, 3.6, 8]} map={wallTex} rough={0.92} />
      <Slab p={[3.8, 1.8, 1.0]} s={[0.12, 3.6, 8]} map={wallTex} rough={0.92} />
      <Slab p={[0, 3.62, 1.0]} s={[9, 0.08, 8]} color="#f4efe6" rough={0.95} />
      {/* baseboards */}
      <RB p={[0, 0.07, -2.12]} s={[8.8, 0.14, 0.04]} r={0.01} color="#f5f2eb" />
      <RB p={[-3.72, 0.07, 1.0]} s={[0.04, 0.14, 7.8]} r={0.01} color="#f5f2eb" />
      <RB p={[3.72, 0.07, 1.0]} s={[0.04, 0.14, 7.8]} r={0.01} color="#f5f2eb" />

      {/* room furniture */}
      <Rug p={[0, 0.004, 0.3]} s={[3.8, 2.6]} color="#3a526e" />
      <Window p={[-1.4, 1.75, -2.11]} s={[1.5, 1.4]} sky="#a9d4f5" glow={0.9} curtains="#4a637a" />
      <Bookshelf p={[-2.9, 0, -1.9]} />
      <Frame p={[0.35, 2.05, -2.11]} s={[0.85, 0.65]} art="#e28743" />
      <Plant p={[2.8, 0, -1.6]} s={1.05} />
      <Lamp p={[-2.1, 0, -1.6]} on={0.9} />
      <Sofa p={[-1.9, 0, 0.45]} ry={Math.PI * 0.45} color="#4d6882" />

      {/* oak study desk on the right (top y = 0.78) */}
      <group position={[1.15, 0, -0.95]}>
        <RB p={[0, 0.75, 0]} s={[1.7, 0.06, 0.85]} r={0.015} map={floorTex} rough={0.7} />
        {[
          [-0.76, -0.35],
          [0.76, -0.35],
          [-0.76, 0.35],
          [0.76, 0.35],
        ].map(([x, z], i) => (
          <RB key={i} p={[x, 0.36, z]} s={[0.07, 0.72, 0.07]} r={0.01} color="#34261c" />
        ))}
      </group>
      {children}
    </group>
  );
};

// ───────────────────────── 2. LaundryRoom (Washing Machine & Fold test) ─────────────────────────
export const LaundryRoom: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const tileFloor = useMemo(() => tex("tiles", "#cfd9df", [5, 5], 3), []);
  const wallTex = useMemo(() => tex("tiles", "#eaf1f5", [5, 3], 4), []);
  const soap = useMemo(() => labelTex("#2888e8", "#ffe042", "TIDE PUH", "SOAP"), []);
  const soft = useMemo(() => labelTex("#ff7aa2", "#ffffff", "SOFT", "FRESH"), []);
  return (
    <group>
      <Slab p={[0, -0.02, 0]} s={[8, 0.04, 7]} map={tileFloor} rough={0.45} />
      <Slab p={[0, 1.8, -1.8]} s={[8, 3.6, 0.12]} map={wallTex} rough={0.5} />
      <Slab p={[-3.2, 1.8, 0.8]} s={[0.12, 3.6, 7]} map={wallTex} rough={0.5} />
      <Slab p={[3.2, 1.8, 0.8]} s={[0.12, 3.6, 7]} map={wallTex} rough={0.5} />
      <Slab p={[0, 3.62, 0.8]} s={[8, 0.08, 7]} color="#f5f7f8" rough={0.9} />

      {/* countertop & wall shelf */}
      <RB p={[-1.4, 0.5, -1.35]} s={[1.4, 1.0, 0.72]} r={0.02} color="#dce3ea" rough={0.4} />
      <RB p={[0, 1.72, -1.62]} s={[2.6, 0.06, 0.34]} r={0.012} color="#8f6b4a" rough={0.7} />
      <Can p={[-0.7, 1.9, -1.6]} r={0.075} h={0.28} label={soap} />
      <Can p={[-0.45, 1.88, -1.6]} r={0.07} h={0.24} label={soft} />
      <Can p={[0.6, 1.9, -1.6]} r={0.075} h={0.28} label={soap} />
      {/* laundry basket */}
      <Cyl p={[1.55, 0.28, -0.9]} r={0.26} r2={0.32} h={0.56} color="#b8986a" rough={0.85} />
      {children}
    </group>
  );
};

// ───────────────────────── 3. StoreRoom (Checkout Pen Test) ─────────────────────────
export const StoreRoom: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const floorTex = useMemo(() => tex("tiles", "#dfe4e8", [6, 6], 6), []);
  const wallTex = useMemo(() => tex("plaster", "#eff2f5", [3, 2], 5), []);
  const cola = useMemo(() => labelTex("#d82a2a", "#ffffff", "PUH COLA", "$2.50"), []);
  const chips = useMemo(() => labelTex("#f2b624", "#1b2845", "CHIPS", "$3.99"), []);
  return (
    <group>
      <Slab p={[0, -0.02, 0]} s={[9, 0.04, 8]} map={floorTex} rough={0.4} />
      <Slab p={[0, 1.9, -2.3]} s={[9, 3.8, 0.12]} map={wallTex} rough={0.85} />
      <Slab p={[-4.0, 1.9, 1.0]} s={[0.12, 3.8, 8]} map={wallTex} rough={0.85} />
      <Slab p={[4.0, 1.9, 1.0]} s={[0.12, 3.8, 8]} map={wallTex} rough={0.85} />
      <Slab p={[0, 3.82, 1.0]} s={[9, 0.08, 8]} color="#f5f7f9" rough={0.9} />
      {/* overhead fluorescent light strips */}
      {[-1.5, 1.5].map((x) => (
        <RB key={x} p={[x, 3.74, -0.4]} s={[1.8, 0.05, 0.35]} r={0.01} color="#ffffff" emissive="#f4fbff" ei={1.4} />
      ))}
      {/* stocked grocery shelves against back wall */}
      {[-1.6, 1.6].map((sx, si) => (
        <group key={si} position={[sx, 0, -1.98]}>
          <RB p={[0, 1.15, 0]} s={[2.2, 2.3, 0.42]} r={0.02} color="#283140" rough={0.6} />
          {[0.65, 1.2, 1.75].map((y, yi) => (
            <group key={yi}>
              {Array.from({ length: 6 }, (_, i) => (
                <Can key={i} p={[-0.85 + i * 0.34, y + 0.14, 0.12]} r={0.065} h={0.22} label={(i + yi) % 2 === 0 ? cola : chips} />
              ))}
            </group>
          ))}
        </group>
      ))}
      {children}
    </group>
  );
};

// ───────────────────────── 4. StudioPedestal (UV, Photoshop, Macro Bill, 3D Ribbon) ─────────────────────────
export const StudioPedestal: React.FC<{ children?: React.ReactNode; spotColor?: string; spotI?: number }> = ({
  children,
  spotColor = "#e8f2ff",
  spotI = 24,
}) => (
  <group>
    <Slab p={[0, -0.02, 0]} s={[14, 0.04, 14]} color="#10141d" rough={0.88} />
    <Slab p={[0, 2.5, -3.4]} s={[14, 5.2, 0.12]} color="#0d111a" rough={0.92} />
    <Spot p={[0.4, 3.2, 2.2]} target={[0, 0.5, 0]} angle={0.65} intensity={spotI} distance={10} color={spotColor} />
    {children}
  </group>
);

// ───────────────────────── 5. Workshop1739 (Ben Franklin Sepia Flashback) ─────────────────────────
export const Workshop1739: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const brick = usePbr("red_brick_03", [3, 2]);
  const timber = useMemo(() => tex("planks", "#66452b", [3, 2], 9), []);
  return (
    <group>
      <Slab p={[0, -0.02, 0]} s={[9, 0.04, 8]} map={timber} rough={0.85} />
      <Slab p={[0, 1.8, -2.0]} s={[9, 3.6, 0.12]} {...brick} rough={0.9} />
      <Slab p={[-3.5, 1.8, 1.0]} s={[0.12, 3.6, 8]} {...brick} rough={0.9} />
      <Slab p={[3.5, 1.8, 1.0]} s={[0.12, 3.6, 8]} {...brick} rough={0.9} />
      <Slab p={[0, 3.62, 1.0]} s={[9, 0.08, 8]} color="#3b2b1d" rough={0.95} />
      {/* old wooden print table */}
      <RB p={[0, 0.68, -0.4]} s={[2.4, 0.09, 1.1]} r={0.02} map={timber} rough={0.8} />
      {/* brass candlestick + warm glow */}
      <group position={[-0.9, 0.725, -0.7]}>
        <Cyl p={[0, 0.02, 0]} r={0.07} h={0.04} color="#b88b3a" metal={0.75} rough={0.3} />
        <Cyl p={[0, 0.14, 0]} r={0.022} h={0.22} color="#f5ebd2" rough={0.6} />
        <Glow position={[0, 0.28, 0]} size={0.55} color="#ffb94d" opacity={0.9} />
        <pointLight position={[0, 0.34, 0]} intensity={10} distance={5} decay={1.6} color="#ffae42" castShadow={false} />
      </group>
      {children}
    </group>
  );
};
