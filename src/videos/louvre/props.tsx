import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { RB, tex } from "../../lib/three/diorama";
import { FursuitHead } from "../../lib/three/Mascots";
import { seeded } from "../../lib/timing";

const canvas = (w: number, h: number) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  return { cv, g: cv.getContext("2d")! };
};
const done = (cv: HTMLCanvasElement) => {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};
const memo = new Map<string, THREE.CanvasTexture>();
const cached = (key: string, make: () => THREE.CanvasTexture) => {
  if (!memo.has(key)) memo.set(key, make());
  return memo.get(key)!;
};

// ───────────────────────── paintings ─────────────────────────
/** An old-master style canvas (no real painting): sky, hills, a few figure groups, warm varnish. */
export const oldMasterTex = (seed: number, w = 768, h = 512) =>
  cached(`om${seed}${w}${h}`, () => {
    const { cv, g } = canvas(w, h);
    const r = seeded(seed * 31 + 7);
    const sky = g.createLinearGradient(0, 0, 0, h);
    const hue = 190 + r() * 40;
    sky.addColorStop(0, `hsl(${hue},35%,${45 + r() * 15}%)`);
    sky.addColorStop(0.55, `hsl(${35 + r() * 15},45%,${65 + r() * 10}%)`);
    sky.addColorStop(1, `hsl(${25 + r() * 10},40%,${25 + r() * 10}%)`);
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    // clouds
    for (let i = 0; i < 18; i++) {
      g.fillStyle = `rgba(255,245,225,${0.08 + r() * 0.15})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h * 0.45, 40 + r() * 120, 15 + r() * 40, 0, 0, Math.PI * 2);
      g.fill();
    }
    // architecture / hills
    g.fillStyle = `hsl(${30 + r() * 20},25%,${20 + r() * 12}%)`;
    g.beginPath();
    g.moveTo(0, h);
    for (let x = 0; x <= w; x += 32) g.lineTo(x, h * (0.55 + 0.12 * Math.sin(x * 0.01 + seed) + r() * 0.04));
    g.lineTo(w, h);
    g.fill();
    if (r() < 0.6) {
      g.fillStyle = `hsl(35,20%,${55 + r() * 10}%)`;
      for (let i = 0; i < 5; i++) g.fillRect(w * (0.1 + i * 0.18), h * 0.3, w * 0.03, h * 0.35);
      g.fillRect(w * 0.08, h * 0.27, w * 0.8, h * 0.04);
    }
    // figure groups
    const robes = ["#8a1f1f", "#1f3f8a", "#c9a24a", "#e8dcc4", "#2f5a2f", "#6a2a6a"];
    for (let i = 0; i < 14; i++) {
      const x = r() * w,
        y = h * (0.62 + r() * 0.3),
        s = 18 + r() * 26;
      g.fillStyle = robes[Math.floor(r() * robes.length)];
      g.beginPath();
      g.moveTo(x - s * 0.5, y + s * 1.6);
      g.quadraticCurveTo(x, y - s * 0.2, x + s * 0.5, y + s * 1.6);
      g.fill();
      g.fillStyle = "#e0b48c";
      g.beginPath();
      g.arc(x, y - s * 0.25, s * 0.28, 0, Math.PI * 2);
      g.fill();
    }
    // varnish + craquelure
    const v = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.7);
    v.addColorStop(0, "rgba(255,200,120,0.05)");
    v.addColorStop(1, "rgba(40,20,0,0.45)");
    g.fillStyle = v;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0,0,0,0.08)";
    for (let i = 0; i < 300; i++) {
      const x = r() * w,
        y = r() * h;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 14, y + (r() - 0.5) * 14);
      g.stroke();
    }
    return done(cv);
  });

/** "Mona Puh": the fox head in a sfumato half-length portrait pose (our own parody, not the real painting). */
export const monaPuhTex = () =>
  cached("monapuh", () => {
    const w = 530,
      h = 770;
    const { cv, g } = canvas(w, h);
    const r = seeded(77);
    // hazy landscape
    const sky = g.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#7f8f78");
    sky.addColorStop(0.4, "#a8a77c");
    sky.addColorStop(1, "#4a3b22");
    g.fillStyle = sky;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(60,80,70,0.5)";
    g.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(0, 220 + i * 30 + r() * 20);
      g.bezierCurveTo(150, 180 + i * 35, 380, 260 + i * 25, w, 200 + i * 30);
      g.stroke();
    }
    g.fillStyle = "rgba(90,110,120,0.55)";
    g.beginPath();
    g.ellipse(80, 300, 70, 14, 0, 0, Math.PI * 2);
    g.ellipse(460, 330, 60, 12, 0, 0, Math.PI * 2);
    g.fill();
    // dark robe, folded hands
    g.fillStyle = "#2a2116";
    g.beginPath();
    g.moveTo(40, h);
    g.bezierCurveTo(60, 520, 150, 430, 265, 420);
    g.bezierCurveTo(380, 430, 470, 520, 490, h);
    g.fill();
    g.fillStyle = "#6b5532";
    g.beginPath();
    g.moveTo(180, 470);
    g.quadraticCurveTo(265, 520, 350, 470);
    g.lineTo(340, 500);
    g.quadraticCurveTo(265, 545, 190, 500);
    g.fill();
    g.fillStyle = "#e6b98a";
    g.beginPath();
    g.ellipse(250, 650, 70, 30, -0.15, 0, Math.PI * 2);
    g.ellipse(320, 635, 55, 26, 0.2, 0, Math.PI * 2);
    g.fill();
    // fox head: ears, face, cream muzzle, aqua eyes, smile
    const cx = 265,
      cy = 290;
    g.fillStyle = "#e07a2e";
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + s * 40, cy - 70);
      g.lineTo(cx + s * 120, cy - 200);
      g.lineTo(cx + s * 125, cy - 40);
      g.fill();
      g.fillStyle = "#fff0dc";
      g.beginPath();
      g.moveTo(cx + s * 62, cy - 80);
      g.lineTo(cx + s * 112, cy - 165);
      g.lineTo(cx + s * 110, cy - 70);
      g.fill();
      g.fillStyle = "#e07a2e";
    }
    g.beginPath();
    g.ellipse(cx, cy, 125, 115, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#fff0dc";
    g.beginPath();
    g.ellipse(cx, cy + 50, 85, 62, 0, 0, Math.PI * 2);
    g.fill();
    for (const s of [-1, 1]) {
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.ellipse(cx + s * 48, cy - 15, 30, 34, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#2ec4d6";
      g.beginPath();
      g.ellipse(cx + s * 46 + 4, cy - 10, 20, 25, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#111";
      g.beginPath();
      g.ellipse(cx + s * 46 + 5, cy - 8, 9, 12, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(cx + s * 46 + 10, cy - 18, 5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#1d1716";
    g.beginPath();
    g.ellipse(cx, cy + 30, 16, 11, 0, 0, Math.PI * 2);
    g.fill();
    // the famous little smile
    g.strokeStyle = "#4a1622";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(cx - 34, cy + 66);
    g.quadraticCurveTo(cx, cy + 82, cx + 34, cy + 64);
    g.stroke();
    // sfumato + varnish
    const v = g.createRadialGradient(w / 2, h * 0.45, h * 0.15, w / 2, h / 2, h * 0.7);
    v.addColorStop(0, "rgba(255,210,120,0.08)");
    v.addColorStop(1, "rgba(30,20,5,0.55)");
    g.fillStyle = v;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(0,0,0,0.06)";
    for (let i = 0; i < 500; i++) {
      const x = r() * w,
        y = r() * h;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 10, y + (r() - 0.5) * 10);
      g.stroke();
    }
    return done(cv);
  });

/** Gilded frame with a canvas texture inside (s = picture size in metres, faces +Z). */
export const Painting: React.FC<{ p: V3; s: [number, number]; ry?: number; map: THREE.Texture; frame?: number; gold?: string }> = ({ p, s, ry = 0, map, frame = 0.12, gold = "#b48a3a" }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, 0, 0.03]} s={[s[0] + frame * 2, s[1] + frame * 2, 0.08]} r={0.02} color={gold} metal={0.75} rough={0.35} />
    <RB p={[0, 0, 0.05]} s={[s[0] + frame * 0.8, s[1] + frame * 0.8, 0.06]} r={0.01} color="#6d5020" metal={0.6} rough={0.4} />
    <mesh position={[0, 0, 0.085]}>
      <planeGeometry args={s} />
      <meshStandardMaterial map={map} roughness={0.55} />
    </mesh>
  </group>
);

// ───────────────────────── the vitrine ─────────────────────────
const splatTex = (color: string, seed: number, chunky = false) =>
  cached(`splat${color}${seed}${chunky}`, () => {
    const { cv, g } = canvas(512, 512);
    const r = seeded(seed);
    g.fillStyle = color;
    g.beginPath();
    g.arc(256, 256, 120, 0, Math.PI * 2);
    g.fill();
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2,
        d = 100 + r() * 130,
        s = 10 + r() * 40;
      g.beginPath();
      g.arc(256 + Math.cos(a) * d, 256 + Math.sin(a) * d, s, 0, Math.PI * 2);
      g.fill();
    }
    // drips
    for (let i = 0; i < 7; i++) {
      const x = 170 + r() * 170;
      g.fillRect(x - 8, 256, 16, 140 + r() * 110);
      g.beginPath();
      g.arc(x, 256 + 250 * (0.55 + r() * 0.45), 11, 0, Math.PI * 2);
      g.fill();
    }
    if (chunky)
      for (let i = 0; i < 40; i++) {
        g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.7)" : "rgba(120,60,20,0.5)";
        g.beginPath();
        g.arc(160 + r() * 200, 160 + r() * 200, 6 + r() * 14, 0, Math.PI * 2);
        g.fill();
      }
    const t = done(cv);
    return t;
  });

export type Splat = { kind: "paint" | "cake" | "soup" | "crack"; k: number; at: [number, number]; s?: number };

/**
 * Pedestal + glass case with the giant pocket puh on a velvet cushion. Origin = floor centre, glass faces +Z.
 * `thick` 0–1 grows the glass edges into bulletproof slabs, `ac` 0–1 shows the climate vents + display,
 * `splats` sit on the front pane (x/y in metres from the pane centre), `open` slides the front pane up.
 */
export const VITRINE = { w: 1.5, h: 1.25, d: 1.2, ped: 1.0 };
export const Vitrine: React.FC<{ t: number; thick?: number; ac?: number; splats?: Splat[]; open?: number; puh?: boolean; panes?: number; blink?: number }> = ({ t, thick = 0, ac = 0, splats = [], open = 0, puh = true, panes = 1, blink = 0 }) => {
  const { w, h, d, ped } = VITRINE;
  const e = 0.025 + 0.06 * thick; // edge frame thickness
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#dff2ff", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, clearcoat: 1, envMapIntensity: 1.6, side: THREE.DoubleSide }), []);
  const glassEdge = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8fc9c0", roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.55 }), []);
  const marble = useMemo(() => tex("plaster", "#ece6da", [1, 1], 5), []);
  const yTop = ped + 0.06;
  const front = d / 2;
  return (
    <group>
      {/* pedestal: stone plinth with a dark base and a moulded cap */}
      <RB p={[0, 0.06, 0]} s={[w + 0.16, 0.12, d + 0.16]} r={0.02} color="#2a2724" rough={0.6} />
      <RB p={[0, ped / 2, 0]} s={[w, ped - 0.06, d]} r={0.02} map={marble} color="#f1ebe0" rough={0.45} />
      <RB p={[0, ped, 0]} s={[w + 0.08, 0.08, d + 0.08]} r={0.02} color="#e9e2d4" rough={0.4} />
      {/* velvet cushion */}
      <RB p={[0, yTop + 0.05, 0]} s={[0.9, 0.1, 0.8]} r={0.05} color="#7a1023" rough={0.95} />
      {puh ? (
        <group position={[0, yTop + 0.1, 0]}>
          <FursuitHead s={0.55} t={t} blink={blink} />
        </group>
      ) : null}
      {/* the case: glass panes + edges */}
      {panes > 0.01 ? (
        <group position={[0, yTop + 0.04 + (h / 2) * Math.min(1, panes), 0]} scale={[1, Math.max(0.001, Math.min(1, panes)), 1]}>
          {/* back, sides, top */}
          <mesh position={[0, 0, -front]} material={glass}>
            <planeGeometry args={[w, h]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[(s * w) / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={glass}>
              <planeGeometry args={[d, h]} />
            </mesh>
          ))}
          <mesh position={[0, h / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glass}>
            <planeGeometry args={[w, d]} />
          </mesh>
          {/* front pane (slides up when opened) with what the fans threw at it */}
          <group position={[0, open * h * 0.95, front]}>
            <mesh material={glass}>
              <planeGeometry args={[w, h]} />
            </mesh>
            {splats.map((sp, i) =>
              sp.k > 0.01 ? (
                <mesh key={i} position={[sp.at[0], sp.at[1], 0.01 + i * 0.002]} scale={[sp.k, sp.k, 1]}>
                  <planeGeometry args={[sp.s ?? 0.7, sp.s ?? 0.7]} />
                  <meshStandardMaterial
                    map={sp.kind === "paint" ? splatTex("#c4141c", 3) : sp.kind === "cake" ? splatTex("#f4ead6", 9, true) : sp.kind === "soup" ? splatTex("#e4682a", 5, true) : crackTex()}
                    transparent
                    depthWrite={false}
                    roughness={sp.kind === "crack" ? 0.1 : 0.35}
                    polygonOffset
                    polygonOffsetFactor={-2}
                  />
                </mesh>
              ) : null,
            )}
          </group>
          {/* edges (thicker = bulletproof laminate) */}
          {[
            [0, h / 2, front, w, e, e],
            [0, -h / 2, front, w, e, e],
            [0, h / 2, -front, w, e, e],
            [0, -h / 2, -front, w, e, e],
            [w / 2, h / 2, 0, e, e, d],
            [-w / 2, h / 2, 0, e, e, d],
            [w / 2, -h / 2, 0, e, e, d],
            [-w / 2, -h / 2, 0, e, e, d],
            [w / 2, 0, front, e, h, e],
            [-w / 2, 0, front, e, h, e],
            [w / 2, 0, -front, e, h, e],
            [-w / 2, 0, -front, e, h, e],
          ].map(([x, y, z, sx, sy, sz], i) => (
            <mesh key={i} position={[x, y, z]} material={thick > 0.02 ? glassEdge : undefined}>
              <boxGeometry args={[sx, sy, sz]} />
              {thick > 0.02 ? null : <meshStandardMaterial color="#b9a06a" metalness={0.85} roughness={0.25} />}
            </mesh>
          ))}
        </group>
      ) : null}
      {/* climate control: vents in the plinth + a small display */}
      {ac > 0.01 ? (
        <group>
          {[-0.45, 0, 0.45].map((x) => (
            <group key={x} position={[x, 0.3, d / 2 + 0.005]}>
              <RB p={[0, 0, 0]} s={[0.32, 0.12, 0.02]} r={0.01} color="#3a3d42" metal={0.6} rough={0.4} />
              {[0, 1, 2, 3].map((k) => (
                <mesh key={k} position={[0, -0.04 + k * 0.027, 0.012]}>
                  <boxGeometry args={[0.28, 0.008, 0.004]} />
                  <meshStandardMaterial color="#111" />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[0.55, 0.72, d / 2 + 0.006]}>
            <planeGeometry args={[0.22, 0.1]} />
            <meshBasicMaterial color="#58ffb0" toneMapped={false} transparent opacity={ac} />
          </mesh>
          {/* cool air drifting up inside the case */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const k = (t * 0.35 + i / 6) % 1;
            return <Glow key={i} position={[-0.5 + (i % 3) * 0.5, yTop + 0.15 + k * h, 0.3 - (i % 2) * 0.5]} size={0.35} color="#a8e6ff" opacity={0.35 * ac * Math.sin(k * Math.PI)} />;
          })}
        </group>
      ) : null}
    </group>
  );
};

export const crackTex = () =>
  cached("crack", () => {
    const { cv, g } = canvas(512, 512);
    const r = seeded(4);
    g.strokeStyle = "rgba(255,255,255,0.95)";
    for (let i = 0; i < 16; i++) {
      g.lineWidth = 3 - i * 0.12;
      g.beginPath();
      let x = 256,
        y = 256;
      g.moveTo(x, y);
      const a0 = (i / 16) * Math.PI * 2;
      for (let k = 0; k < 7; k++) {
        const a = a0 + (r() - 0.5) * 0.6;
        x += Math.cos(a) * 32;
        y += Math.sin(a) * 32;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    for (let ring = 1; ring <= 3; ring++) {
      g.beginPath();
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const rr = ring * 45 + (r() - 0.5) * 18;
        g.lineTo(256 + Math.cos(a) * rr, 256 + Math.sin(a) * rr);
      }
      g.lineWidth = 1.5;
      g.stroke();
    }
    return done(cv);
  });

// ───────────────────────── barriers ─────────────────────────
/** Curved wooden barrier (half circle of radius r around the origin, opening towards +Z). */
export const Barrier: React.FC<{ r: number; arc?: number }> = ({ r, arc = Math.PI * 0.8 }) => {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => -arc / 2 + (arc * i) / (n - 1));
  return (
    <group>
      <mesh position={[0, 0.95, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2 - arc / 2]}>
        <torusGeometry args={[r, 0.045, 8, 64, arc]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.45} />
      </mesh>
      {pts.map((a) => (
        <group key={a} position={[Math.sin(a) * r, 0, Math.cos(a) * r]}>
          <mesh position={[0, 0.47, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.05, 0.94, 10]} />
            <meshStandardMaterial color="#4a2e1a" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.04, 16]} />
            <meshStandardMaterial color="#b9a06a" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** Queue stanchions joined by retractable belts along a polyline. */
export const Stanchions: React.FC<{ pts: [number, number][]; color?: string }> = ({ pts, color = "#1d2a4a" }) => (
  <group>
    {pts.map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.96, 10]} />
          <meshStandardMaterial color="#c9ccd2" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.015, 0]}>
          <cylinderGeometry args={[0.16, 0.17, 0.03, 18]} />
          <meshStandardMaterial color="#9ea2a8" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    ))}
    {pts.slice(1).map(([x, z], i) => {
      const [x0, z0] = pts[i];
      const len = Math.hypot(x - x0, z - z0);
      return (
        <mesh key={i} position={[(x + x0) / 2, 0.9, (z + z0) / 2]} rotation={[0, -Math.atan2(z - z0, x - x0), 0]}>
          <boxGeometry args={[len, 0.05, 0.006]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      );
    })}
  </group>
);

// ───────────────────────── things the fans throw ─────────────────────────
export const Rock: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <mesh scale={[s * 1.1, s * 0.8, s]} castShadow>
    <dodecahedronGeometry args={[0.07, 0]} />
    <meshStandardMaterial color="#8d877c" roughness={0.95} flatShading />
  </mesh>
);
export const Teacup: React.FC = () => (
  <group>
    <mesh castShadow>
      <cylinderGeometry args={[0.045, 0.032, 0.06, 18, 1, true]} />
      <meshStandardMaterial color="#ffffff" roughness={0.2} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0.05, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.018, 0.005, 6, 14]} />
      <meshStandardMaterial color="#ffffff" roughness={0.2} />
    </mesh>
    <mesh position={[0, -0.03, 0]}>
      <cylinderGeometry args={[0.06, 0.05, 0.008, 18]} />
      <meshStandardMaterial color="#ffffff" roughness={0.2} />
    </mesh>
  </group>
);
export const Blob: React.FC<{ color: string; s?: number }> = ({ color, s = 1 }) => (
  <mesh scale={[s, s * 0.8, s]}>
    <icosahedronGeometry args={[0.08, 1]} />
    <meshStandardMaterial color={color} roughness={0.35} />
  </mesh>
);
/** A round cream cake with a cherry. */
export const Cake: React.FC<{ s?: number }> = ({ s = 1 }) => (
  <group scale={[s, s, s]}>
    <mesh castShadow>
      <cylinderGeometry args={[0.12, 0.12, 0.09, 24]} />
      <meshStandardMaterial color="#f4ead6" roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.0, 0]}>
      <cylinderGeometry args={[0.122, 0.122, 0.02, 24]} />
      <meshStandardMaterial color="#e05a7a" roughness={0.5} />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => (
      <mesh key={i} position={[Math.cos(i * 0.785) * 0.09, 0.055, Math.sin(i * 0.785) * 0.09]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
    ))}
    <mesh position={[0, 0.07, 0]}>
      <sphereGeometry args={[0.02, 10, 8]} />
      <meshStandardMaterial color="#c4141c" roughness={0.2} />
    </mesh>
  </group>
);
/** A curly grey wig + pearl necklace for the "grandma" (attach to "Head"). */
export const Wig: React.FC = () => {
  const r = seeded(12);
  const curls = Array.from({ length: 34 }, () => {
    const a = r() * Math.PI * 2,
      b = r() * Math.PI * 0.55;
    return [Math.cos(a) * Math.sin(b) * 0.12, 0.1 + Math.cos(b) * 0.1, Math.sin(a) * Math.sin(b) * 0.12 - 0.01] as V3;
  });
  return (
    <group>
      {curls.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <meshStandardMaterial color="#d8d8de" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, -0.05]}>
        <sphereGeometry args={[0.06, 12, 10]} />
        <meshStandardMaterial color="#d8d8de" roughness={0.9} />
      </mesh>
      {/* cat-eye glasses */}
      <group position={[0, 0.08, 0.11]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.035, 0, 0]}>
            <torusGeometry args={[0.024, 0.005, 6, 16]} />
            <meshStandardMaterial color="#c43c7a" roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/** A wheelchair (seat height 0.5 m, faces +Z). */
export const Wheelchair: React.FC = () => (
  <group>
    {[-1, 1].map((s) => (
      <group key={s}>
        <mesh position={[s * 0.33, 0.3, -0.1]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.3, 0.02, 8, 32]} />
          <meshStandardMaterial color="#222" roughness={0.6} />
        </mesh>
        <mesh position={[s * 0.36, 0.3, -0.1]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.27, 0.008, 6, 32]} />
          <meshStandardMaterial color="#c9ccd2" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[s * 0.25, 0.07, 0.35]}>
          <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[s * 0.25, 0.32, 0.12]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.55, 8]} />
          <meshStandardMaterial color="#c9ccd2" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[s * 0.22, 0.75, -0.3]} rotation={[-0.15, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.6, 8]} />
          <meshStandardMaterial color="#c9ccd2" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    ))}
    <RB p={[0, 0.5, 0.02]} s={[0.46, 0.06, 0.46]} r={0.02} color="#1d2a4a" rough={0.8} />
    <RB p={[0, 0.78, -0.24]} s={[0.46, 0.5, 0.04]} r={0.02} rot={[-0.12, 0, 0]} color="#1d2a4a" rough={0.8} />
    <RB p={[0, 0.12, 0.42]} s={[0.4, 0.03, 0.18]} r={0.01} color="#333" />
  </group>
);

// ───────────────────────── 1911 ─────────────────────────
/** The back of a wooden panel painting (poplar, 77 × 53 cm), seen from behind — the thief carries it like this. */
export const PanelBack: React.FC<{ p?: V3; rot?: V3 }> = ({ p = [0, 0, 0], rot = [0, 0, 0] }) => {
  const wood = useMemo(() => tex("planks", "#a07a4a", [0.6, 0.6], 8), []);
  return (
    <group position={p} rotation={rot}>
      <RB p={[0, 0, 0]} s={[0.53, 0.77, 0.03]} r={0.008} map={wood} color="#b08a5a" rough={0.8} />
      {[-0.22, 0.22].map((y) => (
        <RB key={y} p={[0, y, -0.022]} s={[0.5, 0.05, 0.02]} r={0.005} color="#7a5a32" rough={0.8} />
      ))}
    </group>
  );
};

/** A travelling trunk (1.0 × 0.55 × 0.55 m) with a hinged lid (`open` 0–1). */
export const Trunk: React.FC<{ open?: number; children?: React.ReactNode }> = ({ open = 0, children }) => {
  const wood = useMemo(() => tex("planks", "#9a6a3a", [1, 0.5], 14), []);
  return (
    <group>
      <RB p={[0, 0.22, 0]} s={[1.0, 0.44, 0.55]} r={0.02} map={wood} color="#e8d2b0" rough={0.75} />
      {[-0.35, 0.35].map((x) => (
        <RB key={x} p={[x, 0.22, 0]} s={[0.05, 0.46, 0.57]} r={0.01} color="#2a2a2a" metal={0.6} rough={0.5} />
      ))}
      <group position={[0, 0.44, -0.275]} rotation={[-open * 1.75, 0, 0]}>
        <RB p={[0, 0.06, 0.275]} s={[1.0, 0.12, 0.55]} r={0.03} map={wood} color="#e8d2b0" rough={0.75} />
        <RB p={[0, 0.06, 0.552]} s={[0.12, 0.08, 0.02]} r={0.005} color="#c9a24a" metal={0.85} rough={0.3} />
      </group>
      {/* dark inside + contents on top */}
      <mesh position={[0, 0.445, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.47]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.9} />
      </mesh>
      <group position={[0, 0.47, 0]}>{children}</group>
    </group>
  );
};

/** Plumber's toolbox. */
export const Toolbox: React.FC = () => (
  <group>
    <RB p={[0, 0.1, 0]} s={[0.42, 0.2, 0.2]} r={0.02} color="#8a2a1e" metal={0.4} rough={0.5} />
    <mesh position={[0, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
      <torusGeometry args={[0.06, 0.012, 6, 14, Math.PI]} />
      <meshStandardMaterial color="#222" />
    </mesh>
  </group>
);

// ───────────────────────── the 2025 heist ─────────────────────────
/** Furniture-lift truck: cab + bed, an extending ladder lift to height `reach` (m) with a basket that rides it (`ride` 0–1). */
export const LiftTruck: React.FC<{ reach: number; ext: number; ride: number; lights?: number; children?: React.ReactNode }> = ({ reach, ext, ride, lights = 1, children }) => {
  const ang = 0.95; // ladder angle from horizontal
  const len = (reach / Math.sin(ang)) * ext;
  const base: V3 = [0, 1.6, -1.6];
  const top = (k: number): V3 => [0, base[1] + Math.sin(ang) * len * k, base[2] - Math.cos(ang) * len * k];
  const basket = top(Math.min(1, ride) * 0.98);
  return (
    <group>
      {/* cab */}
      <RB p={[0, 1.35, 2.3]} s={[2.3, 2.1, 1.9]} r={0.12} color="#e8e6e0" rough={0.4} metal={0.2} />
      <RB p={[0, 1.7, 3.26]} s={[2.0, 0.8, 0.04]} r={0.02} color="#1c2630" rough={0.05} metal={0.4} />
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.8, 3.27]}>
          <circleGeometry args={[0.12, 16]} />
          <meshBasicMaterial color={lights > 0 ? "#fff6d8" : "#666"} toneMapped={false} />
        </mesh>
      ))}
      {lights > 0 ? <Glow position={[0, 0.8, 3.6]} size={3} color="#fff2c8" opacity={0.5 * lights} /> : null}
      {/* bed + chassis */}
      <RB p={[0, 0.85, -1.2]} s={[2.3, 0.3, 5.0]} r={0.04} color="#d9d6cc" rough={0.6} />
      <RB p={[0, 0.55, 0]} s={[1.0, 0.25, 7.0]} r={0.03} color="#222" />
      {[2.4, -0.4, -2.6].map((z) =>
        [-1, 1].map((s) => (
          <mesh key={`${z}${s}`} position={[s * 1.05, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.32, 20]} />
            <meshStandardMaterial color="#171717" roughness={0.8} />
          </mesh>
        )),
      )}
      {/* outriggers */}
      {[-1, 1].map((s) => (
        <RB key={s} p={[s * 1.55, 0.25, -2.4]} s={[0.9, 0.12, 0.2]} r={0.02} color="#e2b53a" />
      ))}
      {/* ladder lift: two rails + rungs */}
      <group position={base} rotation={[ang, 0, 0]}>
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, len / 2, 0]}>
            <boxGeometry args={[0.1, len, 0.14]} />
            <meshStandardMaterial color="#c9ccd2" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {Array.from({ length: Math.max(1, Math.floor(len / 0.6)) }, (_, i) => (
          <mesh key={i} position={[0, 0.3 + i * 0.6, 0]}>
            <boxGeometry args={[0.7, 0.04, 0.04]} />
            <meshStandardMaterial color="#9ea2a8" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* basket */}
      <group position={basket}>
        <RB p={[0, 0, 0]} s={[1.0, 0.06, 0.9]} r={0.02} color="#9ea2a8" metal={0.7} rough={0.35} />
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, 0.45, 0]}>
            <boxGeometry args={[0.04, 0.9, 0.9]} />
            <meshStandardMaterial color="#c9ccd2" metalness={0.8} roughness={0.3} wireframe />
          </mesh>
        ))}
        {children}
      </group>
    </group>
  );
};

/** A jewel: crown with gems (origin = bottom centre, ~0.3 m wide). */
export const Crown: React.FC<{ s?: number; t?: number }> = ({ s = 1, t = 0 }) => {
  const gems = ["#2a6cff", "#e0213a", "#2bc46a", "#ffffff"];
  return (
    <group scale={[s, s, s]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.13, 0.12, 0.12, 24, 1, true]} />
        <meshStandardMaterial color="#e6c15a" metalness={1} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <group key={i}>
            <mesh position={[Math.cos(a) * 0.1, 0.17, Math.sin(a) * 0.1]} rotation={[0, -a, 0.35 * Math.cos(0)]}>
              <coneGeometry args={[0.025, 0.12, 6]} />
              <meshStandardMaterial color="#e6c15a" metalness={1} roughness={0.2} />
            </mesh>
            <mesh position={[Math.cos(a) * 0.128, 0.06, Math.sin(a) * 0.128]}>
              <octahedronGeometry args={[0.018, 0]} />
              <meshStandardMaterial color={gems[i % 4]} roughness={0.05} metalness={0.2} emissive={gems[i % 4]} emissiveIntensity={0.25 + 0.15 * Math.sin(t * 3 + i)} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.26, 0]}>
        <sphereGeometry args={[0.03, 12, 10]} />
        <meshStandardMaterial color="#2a6cff" roughness={0.05} emissive="#2a6cff" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
};

/** Glass display table for jewels (1.4 × 1.0 m top at 1.0 m). */
export const JewelCase: React.FC<{ children?: React.ReactNode; broken?: number }> = ({ children, broken = 0 }) => {
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#e6f4ff", roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }), []);
  return (
    <group>
      <RB p={[0, 0.45, 0]} s={[1.4, 0.9, 1.0]} r={0.03} color="#1d2a4a" rough={0.6} />
      <RB p={[0, 0.93, 0]} s={[1.3, 0.06, 0.9]} r={0.01} color="#2a1018" rough={0.95} />
      {children}
      <mesh position={[0, 1.2, 0]} material={glass}>
        <boxGeometry args={[1.38, 0.5, 0.98]} />
      </mesh>
      {broken > 0 ? (
        <mesh position={[0, 1.2, 0.5]}>
          <planeGeometry args={[1.2, 0.45]} />
          <meshStandardMaterial map={crackTex()} transparent depthWrite={false} opacity={broken} />
        </mesh>
      ) : null}
    </group>
  );
};

/** A small motor scooter (faces +Z), rider sits at y ≈ 0.55. */
export const Scooter: React.FC<{ color?: string; spin?: number }> = ({ color = "#1d1f24", spin = 0 }) => (
  <group>
    {[0.62, -0.58].map((z) => (
      <group key={z} position={[0, 0.25, z]} rotation={[0, Math.PI / 2, 0]}>
        <mesh rotation={[0, 0, spin]}>
          <torusGeometry args={[0.19, 0.06, 8, 20]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.06, 16]} />
          <meshStandardMaterial color="#9ea2a8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    ))}
    <RB p={[0, 0.42, -0.25]} s={[0.38, 0.32, 0.8]} r={0.12} color={color} rough={0.35} metal={0.3} />
    <RB p={[0, 0.62, -0.3]} s={[0.3, 0.1, 0.62]} r={0.04} color="#111" rough={0.8} />
    <RB p={[0, 0.3, 0.2]} s={[0.3, 0.08, 0.5]} r={0.03} color={color} rough={0.35} metal={0.3} />
    <mesh position={[0, 0.7, 0.55]} rotation={[0.35, 0, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.75, 8]} />
      <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
    </mesh>
    <mesh position={[0, 1.05, 0.66]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
      <meshStandardMaterial color="#222" />
    </mesh>
    <RB p={[0, 0.8, 0.62]} s={[0.36, 0.42, 0.08]} r={0.04} rot={[0.35, 0, 0]} color={color} rough={0.35} metal={0.3} />
  </group>
);

/** Glass shards bursting from a point (k 0→1), falling with gravity. */
export const Shards: React.FC<{ k: number; n?: number; dir?: V3; seed?: number }> = ({ k, n = 26, dir = [0, 0, 1], seed = 3 }) => {
  if (k <= 0 || k >= 1) return null;
  const r = seeded(seed);
  const tt = k * 1.1;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const v: V3 = [dir[0] * (1 + r() * 2) + (r() - 0.5) * 2.4, 1.2 + r() * 1.6, dir[2] * (1 + r() * 2) + (r() - 0.5) * 2.4];
        return (
          <mesh key={i} position={[v[0] * tt, v[1] * tt - 4.9 * tt * tt, v[2] * tt]} rotation={[i + tt * 9, i * 2 + tt * 7, 0]}>
            <planeGeometry args={[0.06 + r() * 0.1, 0.05 + r() * 0.08]} />
            <meshStandardMaterial color="#dff2ff" transparent opacity={0.75} roughness={0.05} metalness={0.3} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
};
