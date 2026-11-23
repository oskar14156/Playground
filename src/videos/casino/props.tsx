import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Cyl, labelTex, RB } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";
import { PuhBill } from "../dollar-bill/bill";

// ───────────────────────── canvas texture cache ─────────────────────────
const cache = new Map<string, THREE.CanvasTexture>();
const ptex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  if (cache.has(key)) return cache.get(key)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, seeded(key.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7) >>> 0));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
};

// ───────────────────────── 1. PokerChip, ChipStack, RfidChipCutaway, ChipRain ─────────────────────────
export const PokerChip: React.FC<{ p?: V3; rot?: V3; scale?: number; color?: string; label?: string; emissive?: string }> = ({
  p = [0, 0, 0],
  rot = [0, 0, 0],
  scale = 1,
  color = "#1b1e28",
  label = "$100",
  emissive = "#000000",
}) => {
  const face = useMemo(
    () =>
      ptex(`chip-${color}-${label}`, 256, 256, (g) => {
        g.fillStyle = color;
        g.fillRect(0, 0, 256, 256);
        // outer dashed casino edge spots
        g.strokeStyle = "#f4efe0";
        g.lineWidth = 22;
        for (let i = 0; i < 6; i++) {
          const a0 = (i * Math.PI) / 3 - 0.18;
          g.beginPath();
          g.arc(128, 128, 114, a0, a0 + 0.36);
          g.stroke();
        }
        // gold dashed ring
        g.strokeStyle = "#e6b94c";
        g.lineWidth = 6;
        g.setLineDash([12, 10]);
        g.beginPath();
        g.arc(128, 128, 86, 0, Math.PI * 2);
        g.stroke();
        g.setLineDash([]);
        // cream center medallion
        g.fillStyle = "#f7f2e4";
        g.beginPath();
        g.arc(128, 128, 70, 0, Math.PI * 2);
        g.fill();
        // fox silhouette emblem + denomination
        g.fillStyle = "#e87624";
        g.beginPath();
        g.arc(128, 106, 18, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#181a20";
        g.font = "900 32px Arial, sans-serif";
        g.textAlign = "center";
        g.fillText(label, 128, 162);
      }),
    [color, label],
  );
  return (
    <group position={p} rotation={rot} scale={scale}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.008, 28]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} emissive={emissive} emissiveIntensity={emissive === "#000000" ? 0 : 0.25} />
      </mesh>
      <mesh position={[0, 0.0044, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.044, 28]} />
        <meshStandardMaterial map={face} roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.0044, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.044, 28]} />
        <meshStandardMaterial map={face} roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  );
};

export const ChipStack: React.FC<{ p?: V3; count?: number; color?: string; label?: string; seed?: number; scale?: number }> = ({
  p = [0, 0, 0],
  count = 10,
  color = "#1b1e28",
  label = "$100",
  seed = 11,
  scale = 1,
}) => {
  const offsets = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, (_, i) => ({
      dx: (r() - 0.5) * 0.004,
      dz: (r() - 0.5) * 0.004,
      ry: r() * Math.PI * 2,
      y: i * 0.0086 + 0.004,
    }));
  }, [count, seed]);
  return (
    <group position={p} scale={scale}>
      {offsets.map((o, i) => (
        <PokerChip key={i} p={[o.dx, o.y, o.dz]} rot={[0, o.ry, 0]} color={color} label={label} />
      ))}
    </group>
  );
};

export const RfidChipCutaway: React.FC<{ p?: V3; rot?: V3; scale?: number; open?: number; pulse?: number }> = ({
  p = [0, 0, 0],
  rot = [0, 0, 0],
  scale = 1,
  open = 0.85,
  pulse = 1,
}) => {
  const rimTex = useMemo(
    () =>
      ptex("rfid-cap", 512, 512, (g) => {
        g.fillStyle = "#191d28";
        g.fillRect(0, 0, 512, 512);
        g.strokeStyle = "#f4efe0";
        g.lineWidth = 42;
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 - 0.16;
          g.beginPath();
          g.arc(256, 256, 224, a, a + 0.32);
          g.stroke();
        }
        g.fillStyle = "#f6f0df";
        g.beginPath();
        g.arc(256, 256, 138, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "#d4a23a";
        g.lineWidth = 10;
        g.stroke();
        g.fillStyle = "#d42b2b";
        g.font = "900 58px Arial, sans-serif";
        g.textAlign = "center";
        g.fillText("RFID", 256, 240);
        g.fillStyle = "#181a20";
        g.font = "900 52px Arial, sans-serif";
        g.fillText("$500", 256, 304);
      }),
    [],
  );
  const lidY = 0.045 + open * 0.24;
  const lidZ = -open * 0.16;
  const lidRx = -open * 0.42;
  return (
    <group position={p} rotation={rot} scale={scale}>
      {/* lower chip housing with dark PCB recess */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.46, 0.065, 42]} />
        <meshStandardMaterial color="#181c26" roughness={0.38} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.034, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.37, 36]} />
        <meshStandardMaterial color="#0e2a20" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* concentric copper RFID antenna coil */}
      {[0.14, 0.19, 0.24, 0.29, 0.34].map((r, i) => (
        <mesh key={i} position={[0, 0.038, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.007, 10, 42]} />
          <meshStandardMaterial color="#e89448" metalness={0.86} roughness={0.22} emissive="#e88a38" emissiveIntensity={0.25 * pulse} />
        </mesh>
      ))}
      {/* glowing silicon transponder IC in center */}
      <RB p={[0, 0.045, 0]} s={[0.12, 0.022, 0.12]} r={0.008} color="#11161f" metal={0.6} rough={0.25} />
      <RB p={[0, 0.056, 0]} s={[0.075, 0.008, 0.075]} r={0.003} color="#3ce8ff" emissive="#3ce8ff" ei={1.8 * pulse} />
      <Glow position={[0, 0.08, 0]} size={0.52} color="#4ceeff" opacity={0.35 * pulse} />

      {/* hinged/lifted top inlay cap showing exterior chip markings */}
      <group position={[0, lidY, lidZ]} rotation={[lidRx, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.46, 0.46, 0.026, 42]} />
          <meshStandardMaterial color="#1b1f2a" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.455, 42]} />
          <meshStandardMaterial map={rimTex} roughness={0.38} />
        </mesh>
      </group>
    </group>
  );
};

export const ChipRain: React.FC<{ t: number; count?: number; radius?: number; height?: number; seed?: number }> = ({
  t,
  count = 28,
  radius = 3.2,
  height = 4.8,
  seed = 77,
}) => {
  const items = useMemo(() => {
    const r = seeded(seed);
    const palette = [
      { c: "#c92a2a", l: "$5" },
      { c: "#1f7a3f", l: "$25" },
      { c: "#181b24", l: "$100" },
      { c: "#d49b2a", l: "$500" },
    ];
    return Array.from({ length: count }, (_, i) => ({
      x: (r() - 0.5) * radius * 2,
      y0: r() * height,
      z: (r() - 0.5) * radius * 1.4 - 0.4,
      sp: 0.75 + r() * 0.65,
      rx: r() * Math.PI,
      ry: r() * Math.PI,
      rz: r() * Math.PI,
      spin: (r() - 0.5) * 2.4,
      isBill: i % 4 === 0,
      chip: palette[i % palette.length],
    }));
  }, [count, height, radius, seed]);
  return (
    <group>
      {items.map((b, i) => {
        const y = height - ((b.y0 + t * b.sp) % height) - 0.3;
        const pos: V3 = [b.x + Math.sin(t * 2.2 + i) * 0.22, y, b.z];
        const rot: V3 = [b.rx + t * b.spin, b.ry + t * b.spin * 0.7, b.rz];
        return b.isBill ? (
          <PuhBill key={i} p={pos} rot={rot} scale={0.26} ribbon={false} />
        ) : (
          <PokerChip key={i} p={pos} rot={rot} scale={1.7} color={b.chip.c} label={b.chip.l} />
        );
      })}
    </group>
  );
};

// ───────────────────────── 2. PlayingCard & CardTable ─────────────────────────
export const PlayingCard: React.FC<{
  p?: V3;
  rot?: V3;
  scale?: number;
  rank?: string;
  suit?: "♠" | "♥" | "♣" | "♦";
  faceUp?: boolean;
}> = ({ p = [0, 0, 0], rot = [0, 0, 0], scale = 1, rank = "A", suit = "♠", faceUp = true }) => {
  const red = suit === "♥" || suit === "♦";
  const frontTex = useMemo(
    () =>
      ptex(`card-${rank}-${suit}`, 256, 360, (g) => {
        g.fillStyle = "#faf7ef";
        g.fillRect(0, 0, 256, 360);
        g.strokeStyle = "#d9d1c1";
        g.lineWidth = 8;
        g.strokeRect(4, 4, 248, 352);
        const col = red ? "#cf2424" : "#181a20";
        g.fillStyle = col;
        g.font = "900 48px Georgia, serif";
        g.textAlign = "center";
        g.fillText(rank, 40, 62);
        g.font = "44px Arial, sans-serif";
        g.fillText(suit, 40, 108);
        g.save();
        g.translate(256, 360);
        g.rotate(Math.PI);
        g.font = "900 48px Georgia, serif";
        g.fillText(rank, 40, 62);
        g.font = "44px Arial, sans-serif";
        g.fillText(suit, 40, 108);
        g.restore();
        g.font = "128px Arial, sans-serif";
        g.fillText(suit, 128, 224);
      }),
    [rank, red, suit],
  );
  const backTex = useMemo(
    () =>
      ptex("card-back-puh", 256, 360, (g) => {
        g.fillStyle = "#fcf8ee";
        g.fillRect(0, 0, 256, 360);
        g.fillStyle = "#9c1922";
        g.fillRect(16, 16, 224, 328);
        g.strokeStyle = "#f2c652";
        g.lineWidth = 6;
        g.strokeRect(24, 24, 208, 312);
        g.fillStyle = "#f2c652";
        g.font = "900 32px Georgia, serif";
        g.textAlign = "center";
        g.fillText("PUH", 128, 174);
        g.fillText("CASINO", 128, 212);
      }),
    [],
  );
  return (
    <group position={p} rotation={[rot[0], rot[1] + (faceUp ? 0 : Math.PI), rot[2]]} scale={scale}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.14, 0.195, 0.003]} />
        <meshStandardMaterial color="#f5f0e2" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[0.136, 0.19]} />
        <meshStandardMaterial map={frontTex} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, -0.002]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.136, 0.19]} />
        <meshStandardMaterial map={backTex} roughness={0.55} />
      </mesh>
    </group>
  );
};

export const CardTable: React.FC<{ p?: V3; ry?: number; scale?: number; mode?: "blackjack" | "roulette"; children?: React.ReactNode }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  mode = "blackjack",
  children,
}) => {
  const feltTex = useMemo(
    () =>
      ptex(`felt-${mode}`, 1024, 512, (g) => {
        g.fillStyle = mode === "roulette" ? "#115e38" : "#136b3e";
        g.fillRect(0, 0, 1024, 512);
        // subtle felt weave dots
        g.fillStyle = "rgba(0,0,0,0.08)";
        for (let y = 0; y < 512; y += 8) for (let x = (y % 16) / 2; x < 1024; x += 8) g.fillRect(x, y, 2, 2);
        g.strokeStyle = "#f2c652";
        g.lineWidth = 5;
        if (mode === "blackjack") {
          g.beginPath();
          g.arc(512, 60, 390, 0.22, Math.PI - 0.22);
          g.stroke();
          g.fillStyle = "#f4cf6a";
          g.font = "900 32px Georgia, serif";
          g.textAlign = "center";
          g.fillText("PUH PALACE · BLACKJACK PAYS 3 TO 2", 512, 210);
          g.font = "bold 22px Arial, sans-serif";
          g.fillStyle = "rgba(255,255,255,0.72)";
          g.fillText("DEALER MUST STAND ON 17", 512, 250);
          for (const bx of [260, 512, 764]) {
            g.strokeStyle = "#f2c652";
            g.lineWidth = 4;
            g.beginPath();
            g.arc(bx, 380, 44, 0, Math.PI * 2);
            g.stroke();
          }
        } else {
          g.strokeRect(48, 56, 928, 400);
          g.fillStyle = "#f2c652";
          g.font = "900 34px Georgia, serif";
          g.textAlign = "center";
          g.fillText("EUROPEAN & STRIP ROULETTE", 512, 118);
          // simplified betting grid on table felt
          const cols = 12;
          for (let i = 0; i < cols; i++) {
            for (let r = 0; r < 3; r++) {
              g.fillStyle = (i + r) % 2 === 0 ? "#b82020" : "#151820";
              g.fillRect(140 + i * 62, 168 + r * 62, 56, 56);
              g.strokeStyle = "#f2c652";
              g.lineWidth = 2;
              g.strokeRect(140 + i * 62, 168 + r * 62, 56, 56);
            }
          }
        }
      }),
    [mode],
  );
  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* dark mahogany pedestal & brass footrest down to y=0 */}
      {[-0.65, 0.65].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <RB p={[0, 0.05, 0]} s={[0.52, 0.1, 0.72]} r={0.02} color="#2c170d" rough={0.45} />
          <Cyl p={[0, 0.38, 0]} r={0.11} r2={0.15} h={0.62} color="#3a1e10" rough={0.4} />
        </group>
      ))}
      <Cyl p={[0, 0.16, 0]} r={0.022} h={1.36} rot={[0, 0, Math.PI / 2]} color="#d4a23a" metal={0.85} rough={0.22} />
      {/* table deck + padded leather/mahogany rail (top felt y = 0.78) */}
      <RB p={[0, 0.73, 0]} s={[2.24, 0.09, 1.18]} r={0.04} color="#3a1c0f" rough={0.38} />
      <RB p={[0, 0.785, 0.56]} s={[2.28, 0.075, 0.1]} r={0.035} color="#1d1817" rough={0.55} />
      <RB p={[0, 0.785, -0.56]} s={[2.28, 0.075, 0.1]} r={0.035} color="#1d1817" rough={0.55} />
      <RB p={[-1.1, 0.785, 0]} s={[0.1, 0.075, 1.18]} r={0.035} color="#1d1817" rough={0.55} />
      <RB p={[1.1, 0.785, 0]} s={[0.1, 0.075, 1.18]} r={0.035} color="#1d1817" rough={0.55} />
      {/* green felt top plane at y = 0.78 */}
      <mesh position={[0, 0.78, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.12, 1.06]} />
        <meshStandardMaterial map={feltTex} roughness={0.92} />
      </mesh>
      {children}
    </group>
  );
};

// ───────────────────────── 3. RouletteWheel (hero prop: 1/2/3 green zeros + ivory ball) ─────────────────────────
export const RouletteWheel: React.FC<{
  p?: V3;
  rot?: V3;
  scale?: number;
  spin?: number;
  ballAngle?: number;
  ballDrop?: number;
  zeros?: 1 | 2 | 3;
  stand?: boolean;
}> = ({ p = [0, 0, 0], rot = [0, 0, 0], scale = 1, spin = 0, ballAngle = 0, ballDrop = 0, zeros = 1, stand = true }) => {
  const rotorTex = useMemo(
    () =>
      ptex(`roulette-rotor-${zeros}`, 1024, 1024, (g) => {
        g.fillStyle = "#1a100a";
        g.fillRect(0, 0, 1024, 1024);
        const total = 36 + zeros;
        const step = (Math.PI * 2) / total;
        const zeroLabels = zeros === 1 ? ["0"] : zeros === 2 ? ["0", "00"] : ["0", "00", "000"];
        // place zeros evenly spaced around wheel for instant readability
        const zeroSlots = new Map<number, string>();
        zeroLabels.forEach((lbl, idx) => {
          zeroSlots.set(Math.floor((idx * total) / zeros), lbl);
        });
        let num = 1;
        for (let i = 0; i < total; i++) {
          const a0 = i * step - Math.PI / 2;
          const a1 = a0 + step;
          const zLbl = zeroSlots.get(i);
          const col = zLbl ? "#16c95b" : i % 2 === 0 ? "#c41e24" : "#151820";
          g.fillStyle = col;
          g.beginPath();
          g.moveTo(512, 512);
          g.arc(512, 512, 488, a0, a1);
          g.closePath();
          g.fill();
          g.strokeStyle = "#d9ae44";
          g.lineWidth = zLbl ? 6 : 3;
          g.stroke();

          // inner bright gold pocket divider ring
          g.fillStyle = zLbl ? "#1aff6e" : col;
          g.beginPath();
          g.moveTo(512, 512);
          g.arc(512, 512, 336, a0 + 0.01, a1 - 0.01);
          g.closePath();
          g.fill();

          const mid = (a0 + a1) / 2;
          g.save();
          g.translate(512 + Math.cos(mid) * 412, 512 + Math.sin(mid) * 412);
          g.rotate(mid + Math.PI / 2);
          g.fillStyle = "#ffffff";
          g.font = zLbl ? "900 40px Arial, sans-serif" : "900 30px Arial, sans-serif";
          g.textAlign = "center";
          g.textBaseline = "middle";
          const txt = zLbl ?? String(num++);
          g.fillText(txt, 0, 0);
          g.restore();
        }
        // outer pocket-ring brass separator circle
        g.strokeStyle = "#e6bf55";
        g.lineWidth = 10;
        g.beginPath();
        g.arc(512, 512, 336, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.arc(512, 512, 488, 0, Math.PI * 2);
        g.stroke();
      }),
    [zeros],
  );

  const bRadius = THREE.MathUtils.lerp(0.46, 0.295, Math.min(1, Math.max(0, ballDrop)));
  const bY = THREE.MathUtils.lerp(0.088, 0.052, Math.min(1, Math.max(0, ballDrop)));

  return (
    <group position={p} rotation={rot} scale={scale}>
      {stand ? (
        <group position={[0, -0.58, 0]}>
          <RB p={[0, 0.04, 0]} s={[0.88, 0.08, 0.88]} r={0.02} color="#26140c" rough={0.45} />
          <Cyl p={[0, 0.31, 0]} r={0.14} r2={0.22} h={0.5} color="#3b1e11" rough={0.35} />
        </group>
      ) : null}
      {/* lower mahogany solid base disc (top at y = +0.01 so rotor at y = 0.032 sits completely exposed!) */}
      <mesh position={[0, -0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.52, 0.48, 0.06, 48]} />
        <meshStandardMaterial color="#3d1b0d" roughness={0.34} metalness={0.1} />
      </mesh>
      {/* hollow turned mahogany outer rim wall */}
      <mesh position={[0, 0.055, 0]} castShadow>
        <cylinderGeometry args={[0.56, 0.52, 0.11, 48, 1, true]} />
        <meshStandardMaterial color="#4f2412" roughness={0.3} metalness={0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* dark walnut ball-track lip */}
      <mesh position={[0, 0.112, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.54, 0.032, 16, 48]} />
        <meshStandardMaterial color="#38180c" roughness={0.28} metalness={0.12} />
      </mesh>
      {/* sloped dark walnut inner track (hollow open cone) */}
      <mesh position={[0, 0.062, 0]}>
        <cylinderGeometry args={[0.53, 0.39, 0.075, 48, 1, true]} />
        <meshStandardMaterial color="#2a130a" roughness={0.32} side={THREE.DoubleSide} />
      </mesh>
      {/* 8 brass ball deflectors around track */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.46, 0.072, Math.sin(a) * 0.46]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.022, 0.016, 0.05]} />
            <meshStandardMaterial color="#e0b548" metalness={0.85} roughness={0.2} />
          </mesh>
        );
      })}
      {/* spinning pocket rotor completely above base top (y = 0.032) */}
      <group rotation={[0, spin, 0]}>
        <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.395, 48]} />
          <meshStandardMaterial map={rotorTex} roughness={0.35} metalness={0.15} emissive="#ffffff" emissiveMap={rotorTex} emissiveIntensity={0.18} />
        </mesh>
        {/* central brass cone turret + cross handles */}
        <Cyl p={[0, 0.095, 0]} r={0.04} r2={0.18} h={0.13} color="#d9ab3f" metal={0.88} rough={0.2} />
        <Cyl p={[0, 0.18, 0]} r={0.032} h={0.12} color="#e5bc55" metal={0.88} rough={0.18} />
        <Cyl p={[0, 0.21, 0]} r={0.014} h={0.26} rot={[0, 0, Math.PI / 2]} color="#f0ca65" metal={0.88} rough={0.18} />
        <Cyl p={[0, 0.21, 0]} r={0.014} h={0.26} rot={[Math.PI / 2, 0, 0]} color="#f0ca65" metal={0.88} rough={0.18} />
        {[
          [0.13, 0],
          [-0.13, 0],
          [0, 0.13],
          [0, -0.13],
        ].map(([hx, hz], i) => (
          <mesh key={i} position={[hx, 0.21, hz]}>
            <sphereGeometry args={[0.022, 12, 10]} />
            <meshStandardMaterial color="#f2cf6c" metalness={0.9} roughness={0.16} />
          </mesh>
        ))}
      </group>
      {/* orbiting ivory roulette ball */}
      <mesh position={[Math.cos(ballAngle) * bRadius, bY, Math.sin(ballAngle) * bRadius]} castShadow>
        <sphereGeometry args={[0.025, 16, 12]} />
        <meshStandardMaterial color="#faf8f0" roughness={0.15} metalness={0.08} emissive="#ffffff" emissiveIntensity={0.22} />
      </mesh>
    </group>
  );
};

// ───────────────────────── 4. SlotMachine & VirtualReelCutaway ─────────────────────────
export const SlotMachine: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  reels?: [number, number, number];
  lever?: number;
  mode?: "classic" | "ldw";
  flash?: number;
}> = ({ p = [0, 0, 0], ry = 0, scale = 1, reels = [0, 0, 0], lever = 0, mode = "classic", flash = 0 }) => {
  const stripTex = useMemo(
    () =>
      ptex("slot-strip-v2", 1024, 256, (g) => {
        g.fillStyle = "#faf5e6";
        g.fillRect(0, 0, 1024, 256);
        const syms = [
          { t: "777", c: "#d91f26", bg: "#fff0cc" },
          { t: "PUH", c: "#d9560b", bg: "#ffe8cc" },
          { t: "BAR", c: "#161a24", bg: "#e4e9f0" },
          { t: "$$$", c: "#158032", bg: "#daf5e2" },
          { t: "CHERRY", c: "#c9163c", bg: "#ffdce5" },
          { t: "BELL", c: "#b8820e", bg: "#fff3c4" },
          { t: "STAR", c: "#1d58c9", bg: "#dceaff" },
          { t: "FOX", c: "#d45a12", bg: "#ffe7d4" },
        ];
        const w = 1024 / syms.length;
        syms.forEach((s, i) => {
          const x0 = i * w;
          g.fillStyle = s.bg;
          g.fillRect(x0 + 6, 10, w - 12, 236);
          g.strokeStyle = "#8a8070";
          g.lineWidth = 6;
          g.strokeRect(x0 + 6, 10, w - 12, 236);
          g.save();
          g.translate(x0 + w / 2, 128);
          g.rotate(Math.PI / 2);
          g.fillStyle = s.c;
          g.font = "900 56px Arial, sans-serif";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText(s.t, 0, 0);
          g.restore();
        });
      }),
    [],
  );

  const marqueeTex = useMemo(
    () =>
      ptex("slot-marquee", 512, 160, (g) => {
        const gr = g.createLinearGradient(0, 0, 512, 0);
        gr.addColorStop(0, "#751018");
        gr.addColorStop(0.5, "#c91c28");
        gr.addColorStop(1, "#751018");
        g.fillStyle = gr;
        g.fillRect(0, 0, 512, 160);
        g.strokeStyle = "#ffd654";
        g.lineWidth = 10;
        g.strokeRect(8, 8, 496, 144);
        g.fillStyle = "#ffe666";
        g.font = "900 56px Georgia, serif";
        g.textAlign = "center";
        g.fillText("LUCKY PUH", 256, 78);
        g.fillStyle = "#ffffff";
        g.font = "900 32px Arial, sans-serif";
        g.fillText("★ 777 JACKPOT ★", 256, 128);
      }),
    [],
  );

  const ldwScreen = useMemo(
    () =>
      ptex("slot-ldw-screen", 512, 340, (g) => {
        g.fillStyle = "#160a28";
        g.fillRect(0, 0, 512, 340);
        // neon celebration starbursts + paylines
        g.strokeStyle = "#ff42b0";
        g.lineWidth = 5;
        g.beginPath();
        g.moveTo(20, 70);
        g.lineTo(492, 165);
        g.lineTo(20, 260);
        g.stroke();
        g.strokeStyle = "#3ce8ff";
        g.beginPath();
        g.moveTo(20, 165);
        g.lineTo(492, 165);
        g.stroke();
        g.fillStyle = "#ffe038";
        g.font = "900 58px Arial, sans-serif";
        g.textAlign = "center";
        g.fillText("BIG WIN!!", 256, 86);
        g.fillStyle = "#5dfc8d";
        g.font = "900 52px Arial, sans-serif";
        g.fillText("WIN $0.40", 256, 198);
        g.fillStyle = "#ff8080";
        g.font = "bold 32px Arial, sans-serif";
        g.fillText("(YOU BET $1.00)", 256, 272);
      }),
    [],
  );

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* lower pedestal cabinet down to y=0 */}
      <RB p={[0, 0.36, 0]} s={[0.76, 0.72, 0.62]} r={0.03} color="#281016" rough={0.5} />
      <RB p={[0, 0.14, 0.28]} s={[0.56, 0.14, 0.12]} r={0.02} color="#b9c2cc" metal={0.82} rough={0.22} />
      {/* main chrome & crimson upper housing */}
      <RB p={[0, 1.1, 0]} s={[0.78, 0.82, 0.56]} r={0.035} color="#a81822" rough={0.32} />
      <RB p={[0, 1.14, 0.27]} s={[0.68, 0.44, 0.04]} r={0.015} color="#11141c" metal={0.6} rough={0.25} />
      {/* illuminated button deck */}
      <RB p={[0, 0.74, 0.34]} s={[0.76, 0.12, 0.22]} r={0.02} rot={[0.25, 0, 0]} color="#c9d0d8" metal={0.78} rough={0.24} />
      {[-0.22, -0.07, 0.08, 0.23].map((bx, i) => (
        <RB key={i} p={[bx, 0.805, 0.35]} s={[0.09, 0.03, 0.08]} r={0.01} color={i === 3 ? "#34e86a" : "#ff4040"} emissive={i === 3 ? "#34e86a" : "#ff4040"} ei={0.8 + 0.8 * flash} />
      ))}
      {/* top gold marquee + flashing celebration beacon */}
      <RB p={[0, 1.62, 0.02]} s={[0.74, 0.24, 0.44]} r={0.025} color="#241118" rough={0.35} />
      <mesh position={[0, 1.62, 0.245]}>
        <planeGeometry args={[0.68, 0.21]} />
        <meshStandardMaterial map={marqueeTex} emissive="#ffffff" emissiveMap={marqueeTex} emissiveIntensity={0.45 + 0.4 * flash} />
      </mesh>
      <Cyl p={[0, 1.81, 0]} r={0.065} h={0.12} color="#ffbe26" emissive="#ffd842" ei={0.6 + 2.2 * flash} />
      {flash > 0.15 ? <Glow position={[0, 1.84, 0.05]} size={0.95} color="#ffd842" opacity={0.65 * flash} /> : null}

      {/* chrome pull lever on right side */}
      <group position={[0.42, 1.0, 0.05]} rotation={[lever * 0.9, 0, 0]}>
        <Cyl p={[0, 0, 0]} r={0.042} h={0.07} rot={[0, 0, Math.PI / 2]} color="#cfd6de" metal={0.85} rough={0.2} />
        <Cyl p={[0.03, 0.24, 0]} r={0.018} h={0.48} color="#dfe5ec" metal={0.88} rough={0.18} />
        <mesh position={[0.03, 0.48, 0]} castShadow>
          <sphereGeometry args={[0.055, 16, 12]} />
          <meshStandardMaterial color="#e0222a" roughness={0.22} metalness={0.2} />
        </mesh>
      </group>

      {mode === "classic" ? (
        <group position={[0, 1.14, 0.18]}>
          {/* 3 rotating physical reel drums */}
          {[-0.2, 0, 0.2].map((rx, idx) => (
            <mesh key={idx} position={[rx, 0, 0]} rotation={[reels[idx], 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 0.16, 24, 1, true]} />
              <meshStandardMaterial map={stripTex} roughness={0.45} emissive="#ffffff" emissiveMap={stripTex} emissiveIntensity={0.08} />
            </mesh>
          ))}
          {/* glowing red payline bar across center */}
          <RB p={[0, 0, 0.14]} s={[0.64, 0.014, 0.01]} r={0.004} color="#ff3b30" emissive="#ff3b30" ei={1.6} />
        </group>
      ) : (
        <mesh position={[0, 1.14, 0.295]}>
          <planeGeometry args={[0.62, 0.4]} />
          <meshStandardMaterial map={ldwScreen} emissive="#ffffff" emissiveMap={ldwScreen} emissiveIntensity={0.65 + 0.5 * flash} />
        </mesh>
      )}
    </group>
  );
};

export const VirtualReelCutaway: React.FC<{ p?: V3; rot?: V3; scale?: number; spin?: number; highlight?: number }> = ({
  p = [0, 0, 0],
  rot = [0, 0, 0],
  scale = 1,
  spin = 0,
  highlight = 1,
}) => {
  const stopTex = useMemo(
    () =>
      ptex("vr-22stops", 256, 512, (g) => {
        g.fillStyle = "#f4efe0";
        g.fillRect(0, 0, 256, 512);
        const list = ["777", "BAR", "PUH", "CHERRY", "BLANK", "PUH"];
        for (let i = 0; i < 6; i++) {
          g.fillStyle = i === 2 ? "#ffd666" : i === 5 ? "#ffe3e3" : "#f7f3e8";
          g.fillRect(10, i * 85 + 6, 236, 74);
          g.strokeStyle = "#333";
          g.lineWidth = 3;
          g.strokeRect(10, i * 85 + 6, 236, 74);
          g.fillStyle = i === 2 ? "#d92b1e" : "#181a20";
          g.font = "900 42px Arial, sans-serif";
          g.textAlign = "center";
          g.fillText(list[i], 128, i * 85 + 56);
        }
      }),
    [],
  );

  return (
    <group position={p} rotation={rot} scale={scale}>
      {/* dark studio stand base down cleanly */}
      <RB p={[0, 0.04, 0]} s={[2.1, 0.08, 0.72]} r={0.02} color="#171b24" rough={0.5} />

      {/* Left: Compact 22-Stop Physical Reel */}
      <group position={[-0.64, 0.52, 0]}>
        <RB p={[0, -0.34, 0]} s={[0.42, 0.24, 0.34]} r={0.015} color="#262d3b" metal={0.5} />
        <mesh rotation={[spin * 0.45, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.24, 22]} />
          <meshStandardMaterial map={stopTex} roughness={0.45} />
        </mesh>
        <RB p={[0, 0, 0.26]} s={[0.28, 0.018, 0.016]} r={0.005} color="#ff4238" emissive="#ff4238" ei={1.5} />
      </group>

      {/* Center glowing RNG mapping connectors */}
      {[-0.14, 0, 0.14].map((dy, i) => (
        <Cyl key={i} p={[-0.14, 0.58 + dy, 0]} r={0.014} h={0.62} rot={[0, 0, Math.PI / 2]} color="#42e8ff" emissive="#42e8ff" ei={1.3 * highlight} />
      ))}

      {/* Right: Towering 128-Stop Hidden Virtual RNG Wheel */}
      <group position={[0.48, 0.78, 0]}>
        <RB p={[0, -0.58, 0]} s={[0.52, 0.36, 0.36]} r={0.02} color="#202632" metal={0.55} />
        <group rotation={[0, 0, -spin]}>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.54, 0.05, 14, 64]} />
            <meshStandardMaterial color="#152b48" metalness={0.45} roughness={0.28} emissive="#1c5ca8" emissiveIntensity={0.4} />
          </mesh>
          {/* 36 blank blue virtual stops + 1 narrow golden JACKPOT slit + 2 bright amber NEAR MISS zones */}
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2;
            const isJackpot = i === 0;
            const isNear = i === 1 || i === 35;
            const col = isJackpot ? "#ffd23f" : isNear ? "#ff4a3d" : "#3a88e0";
            return (
              <RB
                key={i}
                p={[Math.cos(a) * 0.54, Math.sin(a) * 0.54, 0.04]}
                s={[isJackpot ? 0.09 : 0.045, 0.022, 0.04]}
                r={0.005}
                rot={[0, 0, a]}
                color={col}
                emissive={col}
                ei={isJackpot ? 2.2 * highlight : isNear ? 1.8 * highlight : 0.4}
              />
            );
          })}
        </group>
        {/* top selector arrow pointing at jackpot vs near miss */}
        <RB p={[0, 0.64, 0.06]} s={[0.04, 0.1, 0.04]} r={0.008} color="#ff4238" emissive="#ff4238" ei={1.6} />
      </group>
    </group>
  );
};

// ───────────────────────── 5. WallClock, ExitSign, CocktailTray, VentDuct, CeilingDome, MonitorWall, VegasSkyline ─────────────────────────
export const WallClock: React.FC<{ p?: V3; rot?: V3; fall?: number }> = ({ p = [0, 0, 0], rot = [0, 0, 0], fall = 0 }) => {
  const face = useMemo(
    () =>
      ptex("wall-clock", 256, 256, (g) => {
        g.fillStyle = "#fcfaf2";
        g.beginPath();
        g.arc(128, 128, 120, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = "#222";
        g.lineWidth = 8;
        g.stroke();
        g.lineCap = "round";
        g.beginPath();
        g.moveTo(128, 128);
        g.lineTo(128, 56);
        g.moveTo(128, 128);
        g.lineTo(184, 152);
        g.stroke();
      }),
    [],
  );
  return (
    <group position={[p[0], p[1] - fall * 0.9, p[2] + fall * 0.25]} rotation={[rot[0] + fall * 0.4, rot[1], rot[2] - fall * 0.8]} scale={1 - fall * 0.2}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.04, 28]} />
        <meshStandardMaterial color="#1d222b" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0.022]}>
        <circleGeometry args={[0.22, 28]} />
        <meshStandardMaterial map={face} roughness={0.6} />
      </mesh>
    </group>
  );
};

export const ExitSign: React.FC<{ p?: V3; ry?: number }> = ({ p = [0, 0, 0], ry = 0 }) => {
  const tx = useMemo(
    () =>
      ptex("exit-sign", 256, 128, (g) => {
        g.fillStyle = "#200608";
        g.fillRect(0, 0, 256, 128);
        g.strokeStyle = "#ff3b30";
        g.lineWidth = 8;
        g.strokeRect(6, 6, 244, 116);
        g.fillStyle = "#ff3b30";
        g.font = "900 72px Arial, sans-serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText("EXIT", 128, 66);
      }),
    [],
  );
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <RB p={[0, 0, 0]} s={[0.48, 0.24, 0.06]} r={0.01} color="#181b22" />
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[0.44, 0.2]} />
        <meshStandardMaterial map={tx} emissive="#ff3b30" emissiveMap={tx} emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
};

export const CocktailTray: React.FC<{ p?: V3; rot?: V3; scale?: number }> = ({ p = [0, 0, 0], rot = [0, 0, 0], scale = 1 }) => (
  <group position={p} rotation={rot} scale={scale}>
    {/* polished silver serving tray */}
    <Cyl p={[0, 0.008, 0]} r={0.21} h={0.014} color="#dfe5ed" metal={0.88} rough={0.15} />
    {[
      [-0.07, 0.02, "#7affc6"],
      [0.08, -0.03, "#ff7aa8"],
    ].map(([gx, gz, liq], i) => (
      <group key={i} position={[gx as number, 0.015, gz as number]}>
        <Cyl p={[0, 0.004, 0]} r={0.038} h={0.008} color="#d8eef8" metal={0.2} rough={0.1} />
        <Cyl p={[0, 0.055, 0]} r={0.006} h={0.1} color="#d8eef8" metal={0.2} rough={0.1} />
        <Cyl p={[0, 0.13, 0]} r={0.052} r2={0.006} h={0.065} color={liq as string} emissive={liq as string} ei={0.35} rough={0.1} />
        {/* olive garnish */}
        <mesh position={[0.01, 0.15, 0]}>
          <sphereGeometry args={[0.012, 10, 8]} />
          <meshStandardMaterial color="#65a832" roughness={0.4} />
        </mesh>
      </group>
    ))}
  </group>
);

export const VentDuct: React.FC<{ p?: V3; rot?: V3; scale?: number; spin?: number; mythFlash?: number; scentProg?: number }> = ({
  p = [0, 0, 0],
  rot = [0, 0, 0],
  scale = 1,
  spin = 0,
  mythFlash = 0,
  scentProg = 0,
}) => {
  const metalPbr = usePbr("metal_plate", [2, 1]);
  const o2Lbl = useMemo(() => labelTex("#118596", "#ffffff", "O₂ GAS", "FLAMMABLE"), []);
  const scentLbl = useMemo(() => labelTex("#2864b8", "#ffe066", "SCENT", "HVAC COOL"), []);
  const r = seeded(63);
  const particles = Array.from({ length: 12 }, (_, i) => ({
    x0: -0.48 + i * 0.1,
    y: (r() - 0.5) * 0.24,
    z: (r() - 0.5) * 0.16,
    rad: 0.022 + r() * 0.016,
  }));

  return (
    <group position={p} rotation={rot} scale={scale}>
      {/* vertical steel ceiling suspension rods so the duct never floats */}
      {[-0.6, 0.6].map((rx) => (
        <Cyl key={rx} p={[rx, 1.35, -0.05]} r={0.016} h={2.05} color="#788290" metal={0.75} rough={0.35} />
      ))}

      {/* compact 1.55m cutaway sheet-metal duct (top, bottom, rear, louvers) */}
      <RB p={[0, 0.34, 0]} s={[1.55, 0.06, 0.62]} r={0.01} {...metalPbr} metal={0.75} rough={0.35} />
      <RB p={[0, -0.34, 0]} s={[1.55, 0.06, 0.62]} r={0.01} {...metalPbr} metal={0.75} rough={0.35} />
      <RB p={[0, 0, -0.28]} s={[1.55, 0.66, 0.06]} r={0.01} {...metalPbr} metal={0.75} rough={0.35} />
      {/* ceiling louver grille on bottom right */}
      {[-0.12, 0.04, 0.2, 0.36, 0.52].map((x) => (
        <RB key={x} p={[x, -0.37, 0]} s={[0.04, 0.03, 0.5]} r={0.005} rot={[0, 0, 0.4]} color="#b8c2cc" metal={0.75} />
      ))}

      {/* spinning blower fan on the left inside duct */}
      <group position={[-0.52, 0, 0]} rotation={[spin, 0, 0]}>
        <Cyl p={[0, 0, 0]} r={0.075} h={0.14} rot={[0, 0, Math.PI / 2]} color="#2d3440" metal={0.7} />
        {[0, 1, 2, 3].map((k) => (
          <RB key={k} p={[0, 0, 0]} s={[0.04, 0.46, 0.12]} r={0.01} rot={[(k * Math.PI) / 4, 0, 0]} color="#788492" metal={0.75} />
        ))}
      </group>

      {/* O₂ Cylinder mounted cleanly below-left with copper pipe up into duct (fits 100% inside 9:16!) */}
      <group position={[-0.52, -0.68, 0.06]} scale={1 - scentProg * 0.12}>
        <Cyl p={[0, 0.34, 0]} r={0.018} h={0.28} color="#d98a3c" metal={0.8} rough={0.25} />
        <Cyl p={[0, 0, 0]} r={0.13} h={0.54} color="#168b99" metal={0.45} rough={0.35} />
        <mesh position={[0, 0.27, 0]}>
          <sphereGeometry args={[0.13, 16, 12]} />
          <meshStandardMaterial color="#168b99" metalness={0.45} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.02, 0.134]}>
          <planeGeometry args={[0.18, 0.2]} />
          <meshStandardMaterial map={o2Lbl} roughness={0.5} />
        </mesh>
        {mythFlash > 0.05 ? (
          <>
            <Glow position={[0.16, 0.56, 0.12]} size={0.62 * mythFlash} color="#ff5a26" opacity={0.62 * mythFlash} />
            <pointLight position={[0.2, 0.6, 0.25]} intensity={7 * mythFlash} distance={4.5} color="#ff5a26" castShadow={false} />
          </>
        ) : null}
      </group>

      {/* Signature Scent bottle below-right with steel pipe + cool cyan airflow inside duct */}
      {scentProg > 0.05 ? (
        <group>
          <group position={[0.52, -0.66, 0.06]}>
            <Cyl p={[0, 0.28, 0]} r={0.016} h={0.24} color="#9aa6b5" metal={0.8} rough={0.25} />
            <Cyl p={[0, 0, 0]} r={0.11} h={0.44} color="#2864b8" metal={0.4} rough={0.3} />
            <mesh position={[0, 0.02, 0.114]}>
              <planeGeometry args={[0.16, 0.19]} />
              <meshStandardMaterial map={scentLbl} roughness={0.45} />
            </mesh>
          </group>
          {particles.map((pt, i) => {
            const x = ((pt.x0 + 0.9 + spin * 0.14) % 1.15) - 0.45;
            return (
              <mesh key={i} position={[x, pt.y, pt.z]}>
                <sphereGeometry args={[pt.rad, 10, 8]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? "#5ceeff" : "#ffe066"}
                  emissive={i % 2 === 0 ? "#5ceeff" : "#ffd642"}
                  emissiveIntensity={1.1 * scentProg}
                  transparent
                  opacity={0.78 * scentProg}
                />
              </mesh>
            );
          })}
        </group>
      ) : null}
    </group>
  );
};

export const CeilingDome: React.FC<{ p?: V3; scanAngle?: number; beam?: number }> = ({ p = [0, 0, 0], scanAngle = 0, beam = 1 }) => (
  <group position={p} rotation={[0, scanAngle, 0]}>
    <Cyl p={[0, 0.04, 0]} r={0.18} h={0.06} color="#d4a23a" metal={0.85} rough={0.22} />
    <mesh position={[0, 0.01, 0]}>
      <sphereGeometry args={[0.15, 20, 14, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5]} />
      <meshStandardMaterial color="#090c14" roughness={0.1} metalness={0.8} />
    </mesh>
    {beam > 0.05 ? (
      <mesh position={[0, -0.75, 0.25]} rotation={[0.32, 0, 0]}>
        <coneGeometry args={[0.35, 1.45, 20, 1, true]} />
        <meshBasicMaterial color="#ff3b30" transparent opacity={0.18 * beam} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    ) : null}
  </group>
);

export const MonitorWall: React.FC<{ p?: V3; ry?: number; scale?: number }> = ({ p = [0, 0, 0], ry = 0, scale = 1 }) => {
  const feeds = useMemo(
    () =>
      [
        { title: "CAM-01 · BLACKJACK", tag: "CARD COUNTER DETECTED", col: "#ff3b30" },
        { title: "CAM-02 · ROULETTE", tag: "RFID BANK: $14,820", col: "#3ce8ff" },
        { title: "CAM-03 · EXIT NORTH", tag: "LOCKED TO FLOOR", col: "#ffd23f" },
        { title: "CAM-04 · FACIAL ID", tag: "FRIEND: TRESPASSED", col: "#ff3b30" },
      ].map((fd, i) =>
        ptex(`cctv-${i}`, 320, 200, (g) => {
          g.fillStyle = "#08121a";
          g.fillRect(0, 0, 320, 200);
          // green surveillance target reticle
          g.strokeStyle = fd.col;
          g.lineWidth = 4;
          g.strokeRect(108, 42, 104, 108);
          g.fillStyle = "#183044";
          g.beginPath();
          g.arc(160, 86, 26, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = fd.col;
          g.fillRect(8, 8, 304, 28);
          g.fillStyle = "#ffffff";
          g.font = "900 16px 'Courier New', monospace";
          g.fillText(fd.title, 16, 28);
          g.fillStyle = fd.col;
          g.font = "900 18px 'Courier New', monospace";
          g.textAlign = "center";
          g.fillText(fd.tag, 160, 182);
        }),
      ),
    [],
  );
  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      <RB p={[0, 0.38, 0]} s={[1.8, 0.76, 0.65]} r={0.02} color="#171b24" rough={0.5} />
      {[
        [-0.44, 1.18, 0.14],
        [0.44, 1.18, -0.14],
        [-0.44, 1.72, 0.14],
        [0.44, 1.72, -0.14],
      ].map(([x, y, ang], idx) => (
        <group key={idx} position={[x, y, -0.1]} rotation={[0, ang, 0]}>
          <RB p={[0, 0, 0]} s={[0.82, 0.48, 0.04]} r={0.015} color="#10131a" />
          <mesh position={[0, 0, 0.024]}>
            <planeGeometry args={[0.76, 0.42]} />
            <meshStandardMaterial map={feeds[idx]} emissive="#ffffff" emissiveMap={feeds[idx]} emissiveIntensity={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const VegasSkyline: React.FC<{ p?: V3; t?: number }> = ({ p = [0, 0, 0], t = 0 }) => {
  const signTex = useMemo(
    () =>
      ptex("vegas-marquee", 512, 160, (g) => {
        g.fillStyle = "#18061c";
        g.fillRect(0, 0, 512, 160);
        g.strokeStyle = "#ffd642";
        g.lineWidth = 10;
        g.strokeRect(8, 8, 496, 144);
        g.fillStyle = "#ffd642";
        g.font = "900 54px Georgia, serif";
        g.textAlign = "center";
        g.fillText("PUH PALACE", 256, 76);
        g.fillStyle = "#4cf0ff";
        g.font = "900 30px Arial, sans-serif";
        g.fillText("★ LAS VEGAS STRIP ★", 256, 128);
      }),
    [],
  );
  const hotelWinTex = useMemo(
    () =>
      ptex("vegas-hotel-win", 512, 512, (g, r) => {
        g.fillStyle = "#101524";
        g.fillRect(0, 0, 512, 512);
        // top neon roofline stripe
        g.fillStyle = "#ffbe3b";
        g.fillRect(0, 6, 512, 16);
        for (let row = 0; row < 16; row++) {
          for (let col = 0; col < 10; col++) {
            const on = r() > 0.28;
            if (!on) continue;
            g.fillStyle = r() > 0.72 ? "#7ae8ff" : r() > 0.35 ? "#ffd466" : "#ff9b42";
            g.fillRect(22 + col * 48, 36 + row * 29, 32, 16);
          }
        }
      }),
    [],
  );

  return (
    <group position={p}>
      {/* dark Strip boulevard base */}
      <RB p={[0, -0.04, 0]} s={[12, 0.08, 8]} r={0.02} color="#11141c" rough={0.7} />
      {/* Center PUH PALACE illuminated hotel tower */}
      <mesh position={[0, 1.5, -1.25]} castShadow>
        <boxGeometry args={[1.25, 3.0, 0.72]} />
        <meshStandardMaterial map={hotelWinTex} roughness={0.35} emissive="#fff0c0" emissiveMap={hotelWinTex} emissiveIntensity={0.85} />
      </mesh>
      <RB p={[0, 3.04, -1.25]} s={[1.32, 0.08, 0.78]} r={0.02} color="#ffd23f" emissive="#ffd23f" ei={1.2} />
      <mesh position={[0, 2.28, -0.87]}>
        <planeGeometry args={[1.05, 0.34]} />
        <meshStandardMaterial map={signTex} emissive="#ffffff" emissiveMap={signTex} emissiveIntensity={1.15} />
      </mesh>
      {/* Left magenta-trimmed casino tower */}
      <mesh position={[-1.45, 1.15, -1.45]} castShadow>
        <boxGeometry args={[0.88, 2.3, 0.68]} />
        <meshStandardMaterial map={hotelWinTex} roughness={0.35} emissive="#ff80c4" emissiveMap={hotelWinTex} emissiveIntensity={0.75} />
      </mesh>
      <RB p={[-1.45, 2.34, -1.45]} s={[0.94, 0.07, 0.72]} r={0.02} color="#ff42b0" emissive="#ff42b0" ei={1.4} />
      {/* Right cyan-trimmed resort tower behind golden pyramid */}
      <mesh position={[1.65, 1.25, -2.0]} castShadow>
        <boxGeometry args={[0.9, 2.5, 0.68]} />
        <meshStandardMaterial map={hotelWinTex} roughness={0.35} emissive="#7ae8ff" emissiveMap={hotelWinTex} emissiveIntensity={0.75} />
      </mesh>
      <mesh position={[1.45, 0.62, -1.2]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.78, 1.24, 4]} />
        <meshStandardMaterial color="#2a2214" metalness={0.7} roughness={0.25} emissive="#ffd23f" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[1.45, 2.2, -1.2]}>
        <cylinderGeometry args={[0.04, 0.14, 2.6, 12, 1, true]} />
        <meshBasicMaterial color="#fff3a8" transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* 4 Las Vegas Strip palm trees framing the fountain */}
      {[-1.55, -1.18, 1.18, 1.55].map((px, i) => (
        <group key={i} position={[px, 0, 0.45 + (i % 2) * 0.3]}>
          <Cyl p={[0, 0.42, 0]} r={0.03} r2={0.055} h={0.85} color="#5e3e26" rough={0.85} />
          {[0, 1, 2, 3, 4].map((fi) => (
            <RB key={fi} p={[Math.cos(fi * 1.25) * 0.16, 0.88, Math.sin(fi * 1.25) * 0.16]} s={[0.32, 0.03, 0.1]} r={0.01} rot={[0.3, fi * 1.25, -0.35]} color="#1f6e38" />
          ))}
        </group>
      ))}

      {/* Illuminated Bellagio-style front fountain basin + dancing jets */}
      <RB p={[0, 0.06, 0.35]} s={[2.4, 0.12, 1.05]} r={0.04} color="#222a38" />
      <mesh position={[0, 0.125, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 0.88]} />
        <meshStandardMaterial color="#1860a8" emissive="#3cb4ff" emissiveIntensity={0.55} roughness={0.15} />
      </mesh>
      {[-0.75, -0.38, 0, 0.38, 0.75].map((fx, i) => {
        const h = 0.45 + 0.35 * Math.abs(Math.sin(t * 2.5 + i * 0.9));
        return <Cyl key={i} p={[fx, 0.12 + h / 2, 0.35]} r={0.035} r2={0.014} h={h} color="#9eeeff" emissive="#7ae8ff" ei={0.85} />;
      })}
      {/* Towering golden $72B chip stacks rising beside fountain */}
      {[-0.85, 0.85].map((sx, idx) => (
        <ChipStack key={idx} p={[sx, 0.01, -0.45]} count={20} color="#d49b2a" label="$500" seed={idx + 5} scale={2.2} />
      ))}
    </group>
  );
};
