import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Can, Cyl, labelTex, RB, tex } from "../../lib/three/diorama";
import { seeded } from "../../lib/timing";
import { BleachedFiveBill, EURION_OFFSETS, FakeBill, PuhBill } from "./bill";

// ───────────────────────── canvas texture cache ─────────────────────────
const pcache = new Map<string, THREE.CanvasTexture>();
const ptex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  if (pcache.has(key)) return pcache.get(key)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, seeded(key.length * 97 + w + h));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  pcache.set(key, t);
  return t;
};

// ───────────────────────── 1. Hook props: PriceTag, EmptyWallet, HomePrinter ─────────────────────────
export const PriceTag: React.FC<{ p?: V3; rot?: V3; swing?: number; text?: string; sub?: string }> = ({
  p = [0, 0, 0],
  rot = [0, 0, 0],
  swing = 0,
  text = "$100",
  sub = "USED",
}) => {
  const tagTex = useMemo(
    () =>
      ptex(`tag-${sub}-${text}`, 256, 360, (g) => {
        g.fillStyle = "#ffd639";
        g.fillRect(0, 0, 256, 360);
        g.strokeStyle = "#b87a00";
        g.lineWidth = 10;
        g.strokeRect(10, 10, 236, 340);
        // top punched hole
        g.fillStyle = "#4d3812";
        g.beginPath();
        g.arc(128, 38, 16, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#b02a1e";
        g.font = "900 44px Arial, sans-serif";
        g.textAlign = "center";
        g.fillText(sub, 128, 138);
        g.fillStyle = "#161616";
        g.font = "900 84px Arial, sans-serif";
        g.fillText(text, 128, 252);
        g.fillStyle = "#5c4a1a";
        g.font = "bold 22px Arial, sans-serif";
        g.fillText("POCKET PUH", 128, 308);
      }),
    [sub, text],
  );
  return (
    <group position={p} rotation={rot}>
      <group rotation={[0, 0, swing]}>
        {/* cord up to collar/mask */}
        <Cyl p={[0, 0.07, 0]} r={0.004} h={0.14} color="#d9c6a3" />
        <mesh position={[0, -0.02, 0]} castShadow>
          <boxGeometry args={[0.2, 0.28, 0.012]} />
          <meshStandardMaterial map={tagTex} roughness={0.65} />
        </mesh>
      </group>
    </group>
  );
};

export const EmptyWallet: React.FC<{ p?: V3; rot?: V3; open?: number; mothT?: number }> = ({
  p = [0, 0, 0],
  rot = [0, 0, 0],
  open = 0.85,
  mothT = 0,
}) => {
  const txt = useMemo(
    () =>
      ptex("wallet-0", 256, 128, (g) => {
        g.fillStyle = "#f2f0e6";
        g.fillRect(0, 0, 256, 128);
        g.fillStyle = "#c0392b";
        g.font = "900 66px Arial, sans-serif";
        g.textAlign = "center";
        g.fillText("$0.00", 128, 86);
      }),
    [],
  );
  const flap = Math.sin(mothT * 18) * 0.65;
  const mothY = 0.16 + Math.min(0.45, mothT * 0.18);
  return (
    <group position={p} rotation={rot}>
      {/* left leather half */}
      <group rotation={[0, 0, open * 0.55]}>
        <RB p={[-0.08, 0.02, 0]} s={[0.16, 0.024, 0.2]} r={0.008} color="#5e361c" rough={0.7} />
      </group>
      {/* right leather half */}
      <group rotation={[0, 0, -open * 0.55]}>
        <RB p={[0.08, 0.02, 0]} s={[0.16, 0.024, 0.2]} r={0.008} color="#5e361c" rough={0.7} />
      </group>
      {/* $0.00 slip */}
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.18, 0.09]} />
        <meshStandardMaterial map={txt} roughness={0.8} />
      </mesh>
      {/* fluttering cartoon moth */}
      {mothT > 0.02 ? (
        <group position={[Math.sin(mothT * 4) * 0.06, mothY, Math.cos(mothT * 3) * 0.04]} rotation={[0.2, mothT * 2, 0]}>
          <Cyl p={[0, 0, 0]} r={0.01} h={0.05} rot={[Math.PI / 2, 0, 0]} color="#4a3f35" />
          <mesh position={[-0.03, 0.006, 0]} rotation={[0, 0, flap]}>
            <boxGeometry args={[0.05, 0.004, 0.04]} />
            <meshStandardMaterial color="#d9d0ba" roughness={0.9} />
          </mesh>
          <mesh position={[0.03, 0.006, 0]} rotation={[0, 0, -flap]}>
            <boxGeometry args={[0.05, 0.004, 0.04]} />
            <meshStandardMaterial color="#d9d0ba" roughness={0.9} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

export const HomePrinter: React.FC<{ p?: V3; ry?: number; printProg?: number; active?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  printProg = 0.5,
  active = 1,
}) => {
  const lcdTex = useMemo(
    () =>
      ptex("printer-lcd", 256, 96, (g) => {
        g.fillStyle = "#0a1d26";
        g.fillRect(0, 0, 256, 96);
        g.fillStyle = "#5cf2c7";
        g.font = "900 28px 'Courier New', monospace";
        g.fillText("PRINTING:", 16, 40);
        g.fillStyle = "#ffe066";
        g.fillText("100_REAL.PNG", 16, 76);
      }),
    [],
  );
  const billZ = 0.16 + Math.min(1, Math.max(0, printProg)) * 0.24;
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {/* printer chassis */}
      <RB p={[0, 0.09, 0]} s={[0.58, 0.18, 0.36]} r={0.025} color="#282d36" rough={0.48} />
      {/* top scanner lid */}
      <RB p={[0, 0.19, -0.01]} s={[0.56, 0.03, 0.33]} r={0.01} color="#343b46" rough={0.42} />
      {/* tilted rear paper feed tray + blank paper stack */}
      <RB p={[0, 0.26, -0.17]} s={[0.32, 0.22, 0.025]} r={0.008} rot={[-0.28, 0, 0]} color="#1d2128" rough={0.5} />
      <RB p={[0, 0.27, -0.155]} s={[0.28, 0.2, 0.022]} r={0.004} rot={[-0.28, 0, 0]} color="#f6f7fa" rough={0.85} />
      {/* front output shelf */}
      <RB p={[0, 0.035, 0.25]} s={[0.38, 0.02, 0.22]} r={0.008} color="#222730" rough={0.5} />
      {/* LCD panel */}
      <mesh position={[0.16, 0.185, 0.12]} rotation={[-0.95, 0, 0]}>
        <planeGeometry args={[0.14, 0.055]} />
        <meshStandardMaterial map={lcdTex} emissive="#42f5c5" emissiveIntensity={0.4 * active} />
      </mesh>
      {/* green/amber status LED */}
      <mesh position={[-0.22, 0.165, 0.175]}>
        <sphereGeometry args={[0.012, 12, 10]} />
        <meshStandardMaterial color="#38ff7a" emissive="#38ff7a" emissiveIntensity={2.0 * active} />
      </mesh>
      {/* fake bill emerging from paper slot */}
      <FakeBill p={[0, 0.078, billZ]} rot={[-Math.PI / 2, 0, 0]} scale={0.22} />
      {/* stack of finished fakes beside printer */}
      {[0, 1, 2].map((i) => (
        <FakeBill key={i} p={[0.48, 0.01 + i * 0.014, 0.06]} rot={[-Math.PI / 2, 0, (i - 1) * 0.14]} scale={0.22} />
      ))}
    </group>
  );
};

// ───────────────────────── 2. WashingMachine Cutaway ─────────────────────────
export const WashingMachine: React.FC<{ p?: V3; ry?: number; spin?: number; mush?: number; showJeans?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  spin = 0,
  mush = 0,
  showJeans = 1,
}) => {
  const r = seeded(41);
  const bubbles = Array.from({ length: 18 }, () => ({
    a: r() * Math.PI * 2,
    rad: 0.08 + r() * 0.17,
    z: (r() - 0.5) * 0.22,
    s: 0.014 + r() * 0.022,
  }));
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {/* Cabinet sides/back/top/bottom leaving front porthole open & cutaway */}
      <RB p={[0, 0.04, 0]} s={[0.84, 0.08, 0.72]} r={0.02} color="#eef1f4" rough={0.32} />
      <RB p={[0, 0.96, 0]} s={[0.84, 0.12, 0.72]} r={0.025} color="#f5f7f9" rough={0.3} />
      <RB p={[-0.36, 0.5, 0]} s={[0.12, 0.9, 0.72]} r={0.02} color="#eef1f4" rough={0.32} />
      <RB p={[0.36, 0.5, 0]} s={[0.12, 0.9, 0.72]} r={0.02} color="#eef1f4" rough={0.32} />
      <RB p={[0, 0.5, -0.3]} s={[0.76, 0.9, 0.12]} r={0.02} color="#dce1e7" rough={0.4} />
      {/* Front lower kickplate + upper control fascia */}
      <RB p={[0, 0.13, 0.34]} s={[0.84, 0.16, 0.06]} r={0.015} color="#e4e8ee" rough={0.35} />
      <RB p={[0, 0.87, 0.34]} s={[0.84, 0.16, 0.06]} r={0.015} color="#e4e8ee" rough={0.35} />
      {/* Control dial, detergent drawer, digital timer */}
      <RB p={[-0.24, 0.87, 0.375]} s={[0.2, 0.09, 0.02]} r={0.008} color="#d3d9e0" rough={0.3} />
      <Cyl p={[0, 0.87, 0.385]} r={0.042} h={0.03} rot={[Math.PI / 2, 0, 0]} color="#c4cbd4" metal={0.75} rough={0.25} />
      <RB p={[0.24, 0.87, 0.375]} s={[0.16, 0.07, 0.015]} r={0.006} color="#101822" emissive="#42e3ff" ei={0.35} />

      {/* Outer dark tub ring */}
      <mesh position={[0, 0.49, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.31, 0.31, 0.44, 32, 1, true]} />
        <meshStandardMaterial color="#1d242e" side={THREE.DoubleSide} roughness={0.6} />
      </mesh>

      {/* Chrome door ring around porthole */}
      <mesh position={[0, 0.49, 0.35]}>
        <torusGeometry args={[0.27, 0.032, 16, 36]} />
        <meshStandardMaterial color="#cfd5dc" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Subtle tinted glass porthole rim */}
      <mesh position={[0, 0.49, 0.34]}>
        <circleGeometry args={[0.25, 32]} />
        <meshStandardMaterial color="#8fd4ff" transparent opacity={0.14} roughness={0.1} metalness={0.2} />
      </mesh>

      {/* Spinning stainless steel inner drum */}
      <group position={[0, 0.49, 0.06]} rotation={[0, 0, spin]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.255, 0.255, 0.36, 28, 1, true]} />
          <meshStandardMaterial color="#96a1ad" metalness={0.78} roughness={0.32} side={THREE.DoubleSide} />
        </mesh>
        {/* rear drum plate */}
        <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.255, 0.255, 0.02, 28]} />
          <meshStandardMaterial color="#7d8792" metalness={0.8} roughness={0.35} />
        </mesh>
        {/* 3 steel drum baffles */}
        {[0, 1, 2].map((i) => {
          const a = (i * Math.PI * 2) / 3;
          return <RB key={i} p={[Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0]} s={[0.04, 0.05, 0.32]} r={0.01} rot={[0, 0, a]} color="#bcc4ce" metal={0.7} rough={0.3} />;
        })}

        {/* Folded denim jeans inside */}
        {showJeans > 0.05 ? (
          <group position={[-0.08, -0.06, -0.03]} rotation={[0.4, 0.3, 0.8]} scale={showJeans}>
            <RB p={[0, 0, 0]} s={[0.16, 0.09, 0.14]} r={0.025} color="#284c7c" rough={0.9} />
            <RB p={[0.04, 0.04, 0]} s={[0.12, 0.05, 0.12]} r={0.02} color="#345f99" rough={0.9} />
          </group>
        ) : null}

        {/* Crisp cotton PuhBill tumbling cleanly */}
        <PuhBill p={[0.07, 0.07, 0.07]} rot={[0.35, -0.4, 0.25]} scale={0.18} />

        {/* Disintegrating fake paper bill turning into grey mush */}
        <FakeBill p={[-0.04, 0.12, 0.09]} rot={[-0.4, 0.2, 0.5]} scale={0.18} mush={mush} />

        {/* Soap suds / bubbles */}
        {bubbles.map((b, i) => (
          <mesh key={i} position={[Math.cos(b.a) * b.rad, Math.sin(b.a) * b.rad, b.z]}>
            <sphereGeometry args={[b.s, 10, 8]} />
            <meshStandardMaterial color="#e6f9ff" transparent opacity={0.68} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* Swirl of soapy cyan water in lower drum */}
      <mesh position={[0, 0.34, 0.16]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.21, 24]} />
        <meshStandardMaterial color="#42b8e8" transparent opacity={0.55} roughness={0.12} />
      </mesh>
    </group>
  );
};

// ───────────────────────── 3. FoldMachine (4,000 double folds tester) ─────────────────────────
export const FoldMachine: React.FC<{ p?: V3; ry?: number; fold?: number }> = ({ p = [0, 0, 0], ry = 0, fold = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    {/* pedestal column down to y=0 */}
    <RB p={[0, 0.04, 0]} s={[0.68, 0.08, 0.56]} r={0.015} color="#212732" metal={0.5} rough={0.45} />
    <Cyl p={[0, 0.28, 0]} r={0.12} h={0.44} color="#4e5866" metal={0.7} rough={0.35} />
    {/* tester table + vertical column + brass jaw clamp */}
    <RB p={[0, 0.52, 0]} s={[1.05, 0.08, 0.68]} r={0.02} color="#2c3543" metal={0.45} rough={0.45} />
    <Cyl p={[0, 0.68, -0.06]} r={0.055} h={0.28} color="#9aa4b2" metal={0.82} rough={0.25} />
    <RB p={[0, 0.84, 0]} s={[0.14, 0.09, 0.24]} r={0.015} color="#d4a23a" metal={0.82} rough={0.24} />
    <PuhBill p={[0, 0.84, 0.16]} scale={0.52} fold={fold} />
  </group>
);

// ───────────────────────── 4. CheckoutCounter + IodinePen ─────────────────────────
export const CheckoutCounter: React.FC<{ p?: V3; ry?: number }> = ({ p = [0, 0, 0], ry = 0 }) => {
  const regTex = useMemo(
    () =>
      ptex("reg-disp", 256, 96, (g) => {
        g.fillStyle = "#081c12";
        g.fillRect(0, 0, 256, 96);
        g.fillStyle = "#48ff8a";
        g.font = "900 54px 'Courier New', monospace";
        g.textAlign = "center";
        g.fillText("$100.00", 128, 66);
      }),
    [],
  );
  const gum = useMemo(() => labelTex("#ff4f7a", "#ffe066", "PUH GUM", "$1.99"), []);
  const mints = useMemo(() => labelTex("#2ec4d6", "#ffffff", "MINTS", "$2.49"), []);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {/* counter body */}
      <RB p={[0, 0.44, 0]} s={[2.1, 0.88, 0.86]} r={0.03} color="#2a3240" rough={0.5} />
      {/* stainless countertop rim */}
      <RB p={[0, 0.895, 0]} s={[2.16, 0.05, 0.92]} r={0.02} color="#cfd6de" metal={0.55} rough={0.32} />
      {/* dark conveyor belt */}
      <RB p={[-0.36, 0.925, 0]} s={[1.18, 0.016, 0.56]} r={0.006} color="#171a20" rough={0.9} />
      {/* recessed scanner glass */}
      <RB p={[0.34, 0.924, 0.04]} s={[0.26, 0.012, 0.24]} r={0.005} color="#102822" emissive="#ff3b30" ei={0.35} />
      {/* POS cash register + digital screen */}
      <RB p={[0.66, 1.0, -0.18]} s={[0.42, 0.16, 0.34]} r={0.02} color="#1d222b" rough={0.4} />
      <Cyl p={[0.72, 1.18, -0.26]} r={0.022} h={0.22} color="#9aa3af" metal={0.7} />
      <RB p={[0.72, 1.32, -0.26]} s={[0.34, 0.14, 0.04]} r={0.012} color="#151920" />
      <mesh position={[0.72, 1.32, -0.236]}>
        <planeGeometry args={[0.3, 0.1]} />
        <meshStandardMaterial map={regTex} emissive="#48ff8a" emissiveIntensity={0.7} />
      </mesh>
      {/* impulse snack rack on customer front */}
      <RB p={[-0.5, 0.58, 0.45]} s={[0.76, 0.52, 0.12]} r={0.015} color="#1f2530" />
      <Can p={[-0.72, 0.72, 0.48]} r={0.045} h={0.14} label={gum} />
      <Can p={[-0.56, 0.72, 0.48]} r={0.045} h={0.14} label={mints} />
      <Can p={[-0.4, 0.72, 0.48]} r={0.045} h={0.14} label={gum} />
      <Can p={[-0.24, 0.72, 0.48]} r={0.045} h={0.14} label={mints} />
    </group>
  );
};

export const IodinePen: React.FC<{ p?: V3; rot?: V3; scale?: number }> = ({ p = [0, 0, 0], rot = [0, 0, 0], scale = 1 }) => (
  <group position={p} rotation={rot} scale={scale}>
    {/* yellow pen barrel */}
    <Cyl p={[0, 0.11, 0]} r={0.022} h={0.22} color="#f5c824" rough={0.35} />
    {/* black collar + pocket clip */}
    <Cyl p={[0, 0.225, 0]} r={0.024} h={0.028} color="#181a1e" rough={0.4} />
    <RB p={[0.025, 0.17, 0]} s={[0.008, 0.1, 0.014]} r={0.003} color="#181a1e" />
    {/* chisel felt tip at y=0 */}
    <Cyl p={[0, -0.015, 0]} r={0.006} r2={0.019} h={0.038} color="#d68c1a" rough={0.85} />
  </group>
);

// ───────────────────────── 5. BleachStation ─────────────────────────
export const BleachStation: React.FC<{ p?: V3; soak?: number; stampPress?: number }> = ({
  p = [0, 0, 0],
  soak = 0.5,
  stampPress = 0.2,
}) => {
  const bleachLbl = useMemo(() => labelTex("#eef5ff", "#1f6fe0", "BLEACH", "ULTRA"), []);
  const stampY = 0.28 - Math.min(1, Math.max(0, stampPress)) * 0.17;
  return (
    <group position={p}>
      {/* wooden workbench */}
      <RB p={[0, 0.04, 0]} s={[1.6, 0.08, 0.9]} r={0.02} map={tex("planks", "#7d5b3e", [2, 1])} rough={0.82} />
      {/* stainless soak tray */}
      <RB p={[-0.36, 0.12, 0]} s={[0.64, 0.08, 0.48]} r={0.015} color="#b8c2cc" metal={0.7} rough={0.3} />
      {/* pale bubbling bleach bath */}
      <mesh position={[-0.36, 0.155, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.56, 0.4]} />
        <meshStandardMaterial color="#d2f2ff" transparent opacity={0.78} roughness={0.1} />
      </mesh>
      {/* submerged $5 turning pale */}
      <BleachedFiveBill p={[-0.36, 0.13 + 0.03 * soak, 0]} rot={[-Math.PI / 2, 0, 0.08]} scale={0.28} />
      {/* BLEACH jug */}
      <Can p={[-0.65, 0.22, -0.26]} r={0.078} h={0.28} label={bleachLbl} />
      {/* freshly stamped bleached 5 on the right */}
      <BleachedFiveBill p={[0.32, 0.086, 0.05]} rot={[-Math.PI / 2, 0, -0.05]} scale={0.34} />
      {/* chunky red rubber "100" stamp pressing down */}
      <group position={[0.32, stampY, 0.05]}>
        <RB p={[0, 0.02, 0]} s={[0.2, 0.04, 0.12]} r={0.008} color="#c0392b" rough={0.5} />
        <Cyl p={[0, 0.1, 0]} r={0.032} r2={0.042} h={0.14} color="#8f5332" rough={0.65} />
      </group>
    </group>
  );
};

// ───────────────────────── 6. UvFixture ─────────────────────────
export const UvFixture: React.FC<{ p?: V3; on?: number; width?: number }> = ({ p = [0, 0, 0], on = 1, width = 1.6 }) => (
  <group position={p}>
    <RB p={[0, 0.04, 0]} s={[width, 0.07, 0.16]} r={0.02} color="#171922" metal={0.6} rough={0.35} />
    <Cyl p={[0, -0.005, 0]} r={0.022} h={width - 0.12} rot={[0, 0, Math.PI / 2]} color="#9d50ff" emissive="#8f3dff" ei={2.6 * on} />
    {on > 0.05 ? (
      <>
        <Glow position={[0, -0.02, 0]} size={0.55} color="#a044ff" opacity={0.32 * on} />
        <pointLight position={[0, -0.15, 0]} intensity={10 * on} distance={6} decay={1.6} color="#9f4aff" castShadow={false} />
      </>
    ) : null}
  </group>
);

// ───────────────────────── 7. PhotoshopDesk (Scanner + Monitor + Block Modal) ─────────────────────────
export const PhotoshopDesk: React.FC<{ p?: V3; scanProg?: number; blocked?: number; eurion?: number }> = ({
  p = [0, 0, 0],
  scanProg = 0.5,
  blocked = 0,
  eurion = 0,
}) => {
  const uiTex = useMemo(
    () =>
      ptex("ps-ui-v1", 768, 460, (g) => {
        g.fillStyle = "#1b1d24";
        g.fillRect(0, 0, 768, 460);
        // top menu bar
        g.fillStyle = "#262933";
        g.fillRect(0, 0, 768, 34);
        g.fillStyle = "#4fa8ff";
        g.fillRect(10, 6, 28, 22);
        g.fillStyle = "#fff";
        g.font = "900 15px Arial, sans-serif";
        g.fillText("Ps", 14, 22);
        g.fillStyle = "#cfd6e3";
        g.font = "bold 14px Arial, sans-serif";
        g.fillText("File   Edit   Image   Layer   Filter   100_PUH.tif @ 100%", 54, 22);
        // left tool rail
        g.fillStyle = "#232630";
        g.fillRect(0, 34, 52, 426);
        for (let i = 0; i < 9; i++) {
          g.fillStyle = i === 1 ? "#4fa8ff" : "#565e70";
          g.fillRect(14, 54 + i * 38, 24, 22);
        }
        // right layers panel
        g.fillStyle = "#232630";
        g.fillRect(620, 34, 148, 426);
        g.fillStyle = "#8a94a6";
        g.font = "bold 13px Arial, sans-serif";
        g.fillText("LAYERS", 636, 60);
        g.fillStyle = "#2f3442";
        g.fillRect(632, 74, 124, 34);
        g.fillStyle = "#e6edf5";
        g.fillText("Bill_Scan", 642, 96);

        // center bill preview on dark canvas
        g.fillStyle = "#cfdabf";
        g.fillRect(120, 118, 430, 184);
        g.strokeStyle = "#1f472c";
        g.lineWidth = 6;
        g.strokeRect(128, 126, 414, 168);
        g.fillStyle = "#d97a36";
        g.beginPath();
        g.arc(335, 210, 48, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#173b24";
        g.font = "900 26px Georgia, serif";
        g.textAlign = "center";
        g.fillText("100 PUH", 335, 162);
      }),
    [],
  );

  const modalTex = useMemo(
    () =>
      ptex("ps-block-modal", 512, 260, (g) => {
        g.fillStyle = "#14161e";
        g.fillRect(0, 0, 512, 260);
        g.strokeStyle = "#ff3b30";
        g.lineWidth = 10;
        g.strokeRect(6, 6, 500, 248);
        g.fillStyle = "#ff3b30";
        g.fillRect(6, 6, 500, 56);
        g.fillStyle = "#fff";
        g.font = "900 28px Arial, sans-serif";
        g.textAlign = "center";
        g.fillText("⚠  COUNTERFEIT BLOCKED", 256, 44);
        g.fillStyle = "#ff857d";
        g.font = "900 32px Arial, sans-serif";
        g.fillText("CANNOT EDIT BANKNOTES", 256, 126);
        g.fillStyle = "#b8c4d4";
        g.font = "bold 20px Arial, sans-serif";
        g.fillText("EURion + CBCDG CDS DETECTED", 256, 174);
        g.fillStyle = "#ff3b30";
        g.fillRect(176, 198, 160, 40);
        g.fillStyle = "#fff";
        g.font = "900 22px Arial, sans-serif";
        g.fillText("ACCESS DENIED", 256, 225);
      }),
    [],
  );

  const scanX = -0.34 + Math.min(1, Math.max(0, scanProg)) * 0.68;

  return (
    <group position={p}>
      {/* Dark desk slab */}
      <RB p={[0, 0.04, 0]} s={[2.1, 0.08, 1.05]} r={0.02} color="#1c2029" rough={0.55} />

      {/* Left: Flatbed scanner with slightly lifted lid */}
      <group position={[-0.64, 0.12, 0.06]} rotation={[0, 0.18, 0]}>
        <RB p={[0, 0, 0]} s={[0.58, 0.08, 0.42]} r={0.015} color="#282d38" rough={0.4} />
        {/* glass platen */}
        <mesh position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 0.34]} />
          <meshStandardMaterial color="#0e161d" metalness={0.2} roughness={0.12} />
        </mesh>
        {/* bill lying on scanner glass */}
        <PuhBill p={[0, 0.047, 0]} rot={[-Math.PI / 2, 0, 0]} scale={0.28} eurion={eurion} />
        {/* glowing green scan beam sweeping left -> right */}
        {scanProg > 0.01 && scanProg < 0.99 ? (
          <group position={[scanX * 0.65, 0.055, 0]}>
            <mesh>
              <boxGeometry args={[0.016, 0.008, 0.32]} />
              <meshBasicMaterial color="#42ff88" toneMapped={false} />
            </mesh>
            <Glow position={[0, 0.01, 0]} size={0.28} color="#42ff88" opacity={0.85} />
          </group>
        ) : null}
        {/* hinged lid opened 32 deg */}
        <group position={[0, 0.04, -0.2]} rotation={[-0.58, 0, 0]}>
          <RB p={[0, 0.018, 0.2]} s={[0.58, 0.028, 0.42]} r={0.012} color="#343b48" rough={0.38} />
        </group>
      </group>

      {/* Center-Right: Widescreen monitor */}
      <group position={[0.38, 0.56, -0.14]} rotation={[0, -0.1, 0]}>
        {/* stand */}
        <RB p={[0, -0.46, 0]} s={[0.28, 0.025, 0.2]} r={0.008} color="#2d333f" metal={0.6} />
        <RB p={[0, -0.26, -0.04]} s={[0.07, 0.38, 0.04]} r={0.01} color="#2d333f" metal={0.6} />
        {/* bezel */}
        <RB p={[0, 0, 0]} s={[1.18, 0.72, 0.04]} r={0.018} color="#161920" rough={0.35} />
        {/* Photoshop screen */}
        <mesh position={[0, 0, 0.024]}>
          <planeGeometry args={[1.1, 0.64]} />
          <meshStandardMaterial map={uiTex} emissive="#ffffff" emissiveMap={uiTex} emissiveIntensity={0.42} roughness={0.2} />
        </mesh>
        {/* Glowing EURion circles on screen */}
        {eurion > 0.05 ? (
          <group position={[-0.08, 0.02, 0.028]}>
            {EURION_OFFSETS.map(([dx, dy], i) => (
              <mesh key={i} position={[(dx - 0.03) * 1.9, -dy * 1.9, 0]}>
                <ringGeometry args={[0.022, 0.032, 24]} />
                <meshBasicMaterial color="#ffe033" transparent opacity={eurion} toneMapped={false} />
              </mesh>
            ))}
          </group>
        ) : null}
        {/* Access Denied Block Modal */}
        {blocked > 0.04 ? (
          <mesh position={[-0.04, 0, 0.033]} scale={0.75 + 0.25 * blocked}>
            <planeGeometry args={[0.76, 0.39]} />
            <meshBasicMaterial map={modalTex} transparent opacity={Math.min(1, blocked * 1.2)} toneMapped={false} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
};

// ───────────────────────── 8. PrintingPress + MagnifyingGlass ─────────────────────────
export const PrintingPress: React.FC<{ p?: V3; ry?: number; spin?: number; scale?: number }> = ({ p = [0, 0, 0], ry = 0, spin = 0, scale = 1 }) => (
  <group position={p} rotation={[0, ry, 0]} scale={scale}>
    {/* heavy cast iron bed with steel rail */}
    <RB p={[0, 0.42, 0]} s={[1.5, 0.14, 0.96]} r={0.025} color="#465060" metal={0.62} rough={0.38} />
    <RB p={[0, 0.495, 0]} s={[1.54, 0.03, 0.98]} r={0.01} color="#8e9aa8" metal={0.78} rough={0.28} />
    {/* four legs */}
    {[
      [-0.62, -0.38],
      [0.62, -0.38],
      [-0.62, 0.38],
      [0.62, 0.38],
    ].map(([x, z], i) => (
      <RB key={i} p={[x, 0.2, z]} s={[0.12, 0.4, 0.12]} r={0.015} color="#363e4a" metal={0.6} rough={0.4} />
    ))}
    {/* side upright arches */}
    {[-0.44, 0.44].map((z) => (
      <RB key={z} p={[0, 0.78, z]} s={[0.52, 0.62, 0.09]} r={0.02} color="#3d4654" metal={0.6} rough={0.38} />
    ))}
    {/* twin brass impression rollers */}
    <Cyl p={[0, 0.72, 0]} r={0.14} h={0.82} rot={[Math.PI / 2, spin, 0]} color="#d4a042" metal={0.85} rough={0.22} />
    <Cyl p={[0, 0.96, 0]} r={0.11} h={0.82} rot={[Math.PI / 2, -spin, 0]} color="#2b7548" metal={0.5} rough={0.32} />
    {/* spinning spoked flywheel */}
    <group position={[0, 0.76, 0.56]} rotation={[0, 0, spin]}>
      <mesh>
        <torusGeometry args={[0.36, 0.04, 12, 32]} />
        <meshStandardMaterial color="#a6382e" metalness={0.55} roughness={0.32} />
      </mesh>
      {[0, 1, 2, 3].map((k) => (
        <RB key={k} p={[0, 0, 0]} s={[0.68, 0.04, 0.04]} r={0.01} rot={[0, 0, (k * Math.PI) / 4]} color="#a6382e" metal={0.55} />
      ))}
    </group>
    {/* wooden feed sheet + printed bill exiting */}
    <RB p={[-0.58, 0.53, 0]} s={[0.48, 0.03, 0.66]} r={0.01} rot={[0, 0, 0.12]} color="#9e724a" rough={0.75} />
    <PuhBill p={[0.56, 0.52, 0]} rot={[-Math.PI / 2, 0, Math.PI / 2]} scale={0.34} />
  </group>
);

export const MagnifyingGlass: React.FC<{ p?: V3; rot?: V3; scale?: number }> = ({ p = [0, 0, 0], rot = [0, 0, 0], scale = 1 }) => (
  <group position={p} rotation={rot} scale={scale}>
    {/* polished brass bezel */}
    <mesh>
      <torusGeometry args={[0.24, 0.025, 14, 36]} />
      <meshStandardMaterial color="#d9aa42" metalness={0.85} roughness={0.22} />
    </mesh>
    {/* subtle clear lens glass */}
    <mesh>
      <circleGeometry args={[0.23, 32]} />
      <meshStandardMaterial color="#d8f4ff" transparent opacity={0.18} roughness={0.05} metalness={0.1} />
    </mesh>
    {/* brass neck + walnut handle */}
    <Cyl p={[0, -0.29, 0]} r={0.022} h={0.09} color="#d9aa42" metal={0.85} rough={0.24} />
    <Cyl p={[0, -0.49, 0]} r={0.034} r2={0.026} h={0.34} color="#4f2a16" rough={0.55} />
  </group>
);

// ───────────────────────── 9. MicroLensRibbon (3D cutaway of woven ribbon + glass domes) ─────────────────────────
export const MicroLensRibbon: React.FC<{ p?: V3; rot?: V3; tiltX?: number; tiltY?: number }> = ({
  p = [0, 0, 0],
  rot = [0, 0, 0],
  tiltX = 0,
  tiltY = 0,
}) => {
  const symBell = useMemo(
    () =>
      ptex("ml-bell", 128, 128, (g) => {
        g.clearRect(0, 0, 128, 128);
        g.fillStyle = "#8ee3ff";
        g.beginPath();
        g.moveTo(28, 96);
        g.lineTo(36, 46);
        g.arc(64, 46, 28, Math.PI, 0);
        g.lineTo(100, 96);
        g.closePath();
        g.fill();
        g.fillRect(20, 96, 88, 14);
        g.beginPath();
        g.arc(64, 114, 9, 0, Math.PI * 2);
        g.fill();
      }),
    [],
  );
  const sym100 = useMemo(
    () =>
      ptex("ml-100", 128, 128, (g) => {
        g.clearRect(0, 0, 128, 128);
        g.fillStyle = "#ffffff";
        g.font = "900 56px Arial, sans-serif";
        g.textAlign = "center";
        g.fillText("100", 64, 82);
      }),
    [],
  );
  const paperEdge = tex("plaster", "#d7ddc4", [1, 1], 4);
  const sx = tiltY * 0.09;
  const sy = tiltX * 0.09;

  return (
    <group position={p} rotation={[rot[0] + tiltX * 0.45, rot[1] + tiltY * 0.55, rot[2]]}>
      {/* cotton paper slabs on left & right showing woven cross-section */}
      <RB p={[-0.64, 0, 0]} s={[0.64, 1.32, 0.05]} r={0.012} map={paperEdge} rough={0.88} />
      <RB p={[0.64, 0, 0]} s={[0.64, 1.32, 0.05]} r={0.012} map={paperEdge} rough={0.88} />
      {/* royal-blue woven ribbon channel */}
      <RB p={[0, 0, -0.01]} s={[0.66, 1.36, 0.032]} r={0.008} color="#16458f" metal={0.35} rough={0.28} />
      {/* subtle glowing micro-printed symbols underneath the lenses */}
      {[-0.44, -0.22, 0, 0.22, 0.44].map((y, rIdx) =>
        [-0.18, 0, 0.18].map((x, cIdx) => (
          <mesh key={`${rIdx}-${cIdx}`} position={[x + sx, y + sy, 0.016]}>
            <planeGeometry args={[0.13, 0.13]} />
            <meshStandardMaterial map={(rIdx + cIdx) % 2 === 0 ? symBell : sym100} transparent opacity={0.96} emissive="#7be0ff" emissiveIntensity={0.65} />
          </mesh>
        )),
      )}
      {/* 5 × 9 array of glossy 3D microlens domes */}
      {Array.from({ length: 9 }, (_, rIdx) =>
        Array.from({ length: 5 }, (_, cIdx) => (
          <mesh key={`dome-${rIdx}-${cIdx}`} position={[-0.24 + cIdx * 0.12, -0.52 + rIdx * 0.13, 0.025]} scale={[1, 1, 0.65]}>
            <sphereGeometry args={[0.048, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshPhysicalMaterial color="#dff6ff" roughness={0.05} metalness={0.05} clearcoat={1} transparent opacity={0.52} />
          </mesh>
        )),
      )}
      {/* paper bridges weaving over the blue ribbon */}
      {[-0.38, 0.38].map((y) => (
        <RB key={y} p={[0, y, 0.035]} s={[0.72, 0.11, 0.03]} r={0.01} map={paperEdge} rough={0.86} />
      ))}
    </group>
  );
};

// ───────────────────────── 10. BillRain & StickyNote ─────────────────────────
export const BillRain: React.FC<{ t: number; count?: number; radius?: number; height?: number; seed?: number }> = ({
  t,
  count = 24,
  radius = 3.2,
  height = 5.5,
  seed = 19,
}) => {
  const bills = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * radius * 2,
      y0: r() * height,
      z: (r() - 0.5) * radius * 1.4 - 0.6,
      sp: 0.7 + r() * 0.6,
      rx: r() * Math.PI,
      ry: r() * Math.PI,
      rz: r() * Math.PI,
      spin: (r() - 0.5) * 1.6,
    }));
  }, [count, height, radius, seed]);

  return (
    <group>
      {bills.map((b, i) => {
        const y = height - ((b.y0 + t * b.sp) % height) - 0.4;
        return (
          <PuhBill
            key={i}
            p={[b.x + Math.sin(t * 2 + i) * 0.25, y, b.z]}
            rot={[b.rx + t * b.spin, b.ry + t * b.spin * 0.7, b.rz]}
            scale={0.28}
            ribbon={false}
          />
        );
      })}
    </group>
  );
};

export const StickyNote: React.FC<{ p?: V3; rot?: V3; text?: string; sub?: string }> = ({
  p = [0, 0, 0],
  rot = [0, 0, 0],
  text = "ONLY USED 3×",
  sub = "— GRANDMA",
}) => {
  const tx = useMemo(
    () =>
      ptex(`sticky-${text}-${sub}`, 256, 256, (g) => {
        g.fillStyle = "#ffe55c";
        g.fillRect(0, 0, 256, 256);
        g.fillStyle = "#f2ce35";
        g.fillRect(0, 0, 256, 36);
        g.fillStyle = "#221a10";
        g.font = "900 32px 'Comic Sans MS', Arial, sans-serif";
        g.textAlign = "center";
        g.fillText(text, 128, 128);
        g.font = "bold 26px 'Comic Sans MS', Arial, sans-serif";
        g.fillStyle = "#6e4e18";
        g.fillText(sub, 128, 184);
      }),
    [sub, text],
  );
  return (
    <mesh position={p} rotation={rot} castShadow>
      <boxGeometry args={[0.24, 0.24, 0.008]} />
      <meshStandardMaterial map={tx} roughness={0.85} />
    </mesh>
  );
};
