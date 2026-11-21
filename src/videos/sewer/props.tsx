import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "../../lib/three/core";
import { Cyl, RB, tex } from "../../lib/three/diorama";
import { seeded } from "../../lib/timing";

// Props for "You build the sewer" (episode 11). Metres, y up, frame-driven (no useFrame).

// ───────────────────────── canvas textures ─────────────────────────
const tcache = new Map<string, THREE.CanvasTexture>();
export const ctex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, rep: [number, number] = [1, 1]) => {
  const k = `${key}|${rep}`;
  if (tcache.has(k)) return tcache.get(k)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, seeded(key.length * 31 + w + h));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...rep);
  t.anisotropy = 8;
  tcache.set(k, t);
  return t;
};

/** water swirl seen from above (a spiral of light streaks), rotated by the caller */
export const swirlTex = () =>
  ctex("swirl", 256, 256, (g) => {
    g.fillStyle = "#7fc3dc";
    g.fillRect(0, 0, 256, 256);
    g.translate(128, 128);
    for (let a = 0; a < 6; a++) {
      g.beginPath();
      for (let k = 0; k < 90; k++) {
        const u = k / 90;
        const ang = a * (Math.PI / 3) + u * 5.5;
        const rad = 120 * (1 - u);
        g.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      g.strokeStyle = "rgba(235,250,255,0.75)";
      g.lineWidth = 7;
      g.stroke();
    }
    const gr = g.createRadialGradient(0, 0, 2, 0, 0, 40);
    gr.addColorStop(0, "#123a4c");
    gr.addColorStop(1, "rgba(18,58,76,0)");
    g.fillStyle = gr;
    g.fillRect(-128, -128, 256, 256);
  });

/** wet wipe: off-white cloth with a quilted dot pattern */
export const wipeTex = () =>
  ctex("wipe", 128, 128, (g) => {
    g.fillStyle = "#f1efe6";
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = "rgba(160,170,180,0.35)";
    for (let y = 6; y < 128; y += 12) for (let x = 6 + ((y / 12) % 2) * 6; x < 128; x += 12) g.fillRect(x, y, 3, 3);
  });

/** fatberg skin: grey-beige fat with wipe fibres, darker crust, yellow streaks */
export const fatTex = () =>
  ctex("fat", 512, 512, (g, r) => {
    g.fillStyle = "#b9ad8a";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) {
      const x = r() * 512,
        y = r() * 512,
        s = 4 + r() * 26;
      g.fillStyle = [`rgba(120,108,80,${0.15 + r() * 0.3})`, `rgba(225,215,180,${0.2 + r() * 0.3})`, `rgba(200,170,70,${0.1 + r() * 0.25})`, `rgba(90,80,62,${0.1 + r() * 0.2})`][i % 4];
      g.beginPath();
      g.ellipse(x, y, s, s * (0.4 + r() * 0.6), r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    // wipe fibres
    g.strokeStyle = "rgba(245,242,232,0.55)";
    g.lineWidth = 2;
    for (let i = 0; i < 160; i++) {
      const x = r() * 512,
        y = r() * 512;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + (r() - 0.5) * 60, y + (r() - 0.5) * 60, x + (r() - 0.5) * 90, y + (r() - 0.5) * 90);
      g.stroke();
    }
  });

/** yellow mould pustules (alpha) that grow over the fatberg in the museum */
export const mouldTex = () =>
  ctex("mould", 512, 512, (g, r) => {
    g.clearRect(0, 0, 512, 512);
    for (let i = 0; i < 70; i++) {
      const x = r() * 512,
        y = r() * 512,
        s = 6 + r() * 22;
      const gr = g.createRadialGradient(x, y, 1, x, y, s);
      gr.addColorStop(0, "rgba(255,236,90,1)");
      gr.addColorStop(0.6, "rgba(230,200,40,0.9)");
      gr.addColorStop(1, "rgba(200,170,30,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, s, 0, Math.PI * 2);
      g.fill();
    }
  });

/** cobblestones (Victorian streets) */
export const cobbleTex = (rep: [number, number]) =>
  ctex("cobble", 512, 512, (g, r) => {
    g.fillStyle = "#3a3632";
    g.fillRect(0, 0, 512, 512);
    const rows = 16;
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * 16;
      for (let x = -1; x < 17; x++) {
        const v = 95 + r() * 45;
        g.fillStyle = `rgb(${v},${v - 6},${v - 14})`;
        g.beginPath();
        g.roundRect(x * 32 + off + 2, y * 32 + 2, 28, 28, 7);
        g.fill();
      }
    }
  }, rep);

/** London stock brick in a cross-section (yellow-grey, the colour of the Victorian sewers' engineering brick is red) */
export const brickTex = (rep: [number, number], color = "#8e4a32") =>
  ctex(`brick${color}`, 512, 512, (g, r) => {
    g.fillStyle = "#cfc6b4";
    g.fillRect(0, 0, 512, 512);
    const base = new THREE.Color(color);
    for (let y = 0; y < 16; y++) {
      const off = (y % 2) * 32;
      for (let x = -1; x < 9; x++) {
        const k = 0.8 + r() * 0.35;
        g.fillStyle = `rgb(${Math.min(255, base.r * 255 * k)},${Math.min(255, base.g * 255 * k)},${Math.min(255, base.b * 255 * k)})`;
        g.fillRect(x * 64 + off + 2, y * 32 + 2, 60, 28);
      }
    }
  }, rep);

/** soil strata for cross-sections: topsoil → gravel → London clay. Round pebbles + blotches (no streaks: the face is
 * stretched vertically, so everything is drawn tall-and-thin here and reads round on screen). */
export const strataTex = (h = 1024) =>
  ctex(`strata2_${h}`, 256, h, (g, r) => {
    const bands: [number, number, string][] = [
      [0.0, 0.035, "#4a3a2c"],
      [0.035, 0.11, "#8a7a5c"],
      [0.11, 0.2, "#9a8a68"],
      [0.2, 1.0, "#5f6a6e"],
    ];
    for (const [a, b, col] of bands) {
      g.fillStyle = col;
      g.fillRect(0, a * h, 256, (b - a) * h + 1);
    }
    // wavy band borders
    g.strokeStyle = "rgba(30,24,18,0.35)";
    g.lineWidth = 3;
    for (const y of [0.035, 0.11, 0.2]) {
      g.beginPath();
      for (let x = 0; x <= 256; x += 8) g.lineTo(x, y * h + Math.sin(x * 0.07 + y * 40) * 3);
      g.stroke();
    }
    const sy = h / 256; // vertical stretch of the face mapping → draw ellipses taller so they look round
    for (let i = 0; i < 1600; i++) {
      const y = r() * h;
      const v = y / h;
      const gravel = v > 0.035 && v < 0.2;
      const sz = gravel ? 1.5 + r() * 4 : 2 + r() * 7;
      const l = gravel ? 150 + r() * 70 : 70 + r() * 40;
      g.fillStyle = gravel ? `rgba(${l},${l - 10},${l - 30},0.7)` : `rgba(${l - 10},${l},${l + 6},${0.18 + r() * 0.2})`;
      g.beginPath();
      g.ellipse(r() * 256, y, sz, sz * Math.min(4, sy * 0.25 + 0.8), 0, 0, Math.PI * 2);
      g.fill();
    }
  });

// ───────────────────────── bathroom ─────────────────────────
const lathe = (pts: [number, number][], seg = 40) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

/**
 * Close-coupled floor toilet, real size: bowl rim 0.40 m high, 0.38 m wide, 0.70 m deep with the cistern.
 * Faces +Z, origin on the floor under the bowl centre. `swirl` 0..1 spins the water; `lid` 0 = up.
 */
export const Toilet: React.FC<{ p: V3; ry?: number; t: number; swirl?: number; water?: string; press?: number }> = ({ p, ry = 0, t, swirl = 0, water = "#8fd0e6", press = 0 }) => {
  const geo = useMemo(
    () => ({
      bowl: lathe([
        [0.0, 0.0],
        [0.11, 0.0],
        [0.12, 0.05],
        [0.11, 0.16],
        [0.14, 0.24],
        [0.19, 0.33],
        [0.2, 0.39],
        [0.185, 0.405],
        [0.16, 0.39],
        [0.12, 0.3],
        [0.06, 0.22],
        [0.0, 0.2],
      ]),
      seat: new THREE.TorusGeometry(0.155, 0.028, 12, 40),
    }),
    [],
  );
  const porcelain = <meshPhysicalMaterial color="#f7f7f4" roughness={0.12} clearcoat={1} clearcoatRoughness={0.1} />;
  const sw = swirlTex();
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <group scale={[1, 1, 1.28]} position={[0, 0, 0.04]}>
        <mesh geometry={geo.bowl} castShadow receiveShadow>
          {porcelain}
        </mesh>
        {/* water in the bowl */}
        <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, t * (1 + swirl * 14)]}>
          <circleGeometry args={[0.125 - swirl * 0.03, 40]} />
          <meshPhysicalMaterial map={sw} color={water} roughness={0.05} clearcoat={1} transparent opacity={0.92} />
        </mesh>
        {/* seat (down) */}
        <mesh geometry={geo.seat} position={[0, 0.425, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1.1, 1]} castShadow>
          <meshPhysicalMaterial color="#ffffff" roughness={0.3} clearcoat={0.6} />
        </mesh>
      </group>
      {/* lid, open, leaning on the cistern */}
      <group position={[0, 0.45, -0.17]} rotation={[-0.18, 0, 0]}>
        <mesh position={[0, 0.2, 0]} scale={[1, 1.15, 0.12]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.2, 36]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.3} clearcoat={0.6} />
        </mesh>
      </group>
      {/* cistern + flush plate */}
      <RB p={[0, 0.62, -0.28]} s={[0.42, 0.44, 0.17]} r={0.04} color="#f7f7f4" rough={0.15} />
      <RB p={[0, 0.855, -0.28]} s={[0.44, 0.04, 0.19]} r={0.015} color="#f7f7f4" rough={0.15} />
      <RB p={[-0.045, 0.88 - press * 0.012, -0.28]} s={[0.07, 0.02, 0.07]} r={0.01} color="#c9cfd4" metal={0.9} rough={0.25} />
      <RB p={[0.045, 0.88 - press * 0.012, -0.28]} s={[0.07, 0.02, 0.07]} r={0.01} color="#c9cfd4" metal={0.9} rough={0.25} />
      {/* bolt caps on the foot */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 0.03, 0.08]}>
          <sphereGeometry args={[0.018, 10, 8]} />
          <meshStandardMaterial color="#f2f2ef" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
};

/** Vanity unit: cabinet with 2 doors, countertop, inset basin, chrome mixer tap, mirror and toothbrush cup above. Faces +Z. */
export const Vanity: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, 0.42, 0]} s={[0.8, 0.78, 0.46]} r={0.02} color="#3d5a6c" rough={0.55} />
    {[-0.2, 0.2].map((x) => (
      <group key={x}>
        <RB p={[x, 0.42, 0.232]} s={[0.38, 0.7, 0.02]} r={0.008} color="#46667a" rough={0.5} />
        <RB p={[x - Math.sign(x) * 0.15, 0.6, 0.25]} s={[0.012, 0.12, 0.02]} r={0.005} color="#c9cfd4" metal={0.9} rough={0.25} />
      </group>
    ))}
    <RB p={[0, 0.83, 0]} s={[0.84, 0.04, 0.5]} r={0.01} color="#e8e4dc" rough={0.3} />
    {/* basin */}
    <mesh position={[0, 0.852, 0.02]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]}>
      <circleGeometry args={[0.2, 36]} />
      <meshPhysicalMaterial color="#f4f4f1" roughness={0.12} clearcoat={1} />
    </mesh>
    <mesh position={[0, 0.853, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.02, 16]} />
      <meshStandardMaterial color="#9aa3aa" metalness={0.9} roughness={0.3} />
    </mesh>
    {/* mixer tap */}
    <Cyl p={[0, 0.93, -0.17]} r={0.022} h={0.16} color="#d5dbe0" metal={0.95} rough={0.15} />
    <mesh position={[0, 1.0, -0.12]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.055, 0.016, 10, 20, Math.PI]} />
      <meshStandardMaterial color="#d5dbe0" metalness={0.95} roughness={0.15} />
    </mesh>
    <RB p={[0, 1.02, -0.2]} s={[0.025, 0.02, 0.09]} r={0.008} rot={[-0.4, 0, 0]} color="#d5dbe0" metal={0.95} rough={0.15} />
    {/* mirror */}
    <RB p={[0, 1.45, -0.21]} s={[0.66, 0.78, 0.03]} r={0.02} color="#2a2f33" />
    <mesh position={[0, 1.45, -0.19]}>
      <planeGeometry args={[0.6, 0.72]} />
      <meshStandardMaterial color="#b8cdd8" metalness={1} roughness={0.04} />
    </mesh>
    {/* toothbrush cup + soap */}
    <Cyl p={[0.3, 0.9, -0.13]} r={0.032} h={0.1} color="#7fc7b8" rough={0.3} />
    {[0, 1].map((k) => (
      <RB key={k} p={[0.3 + (k - 0.5) * 0.02, 0.99, -0.13]} s={[0.012, 0.13, 0.012]} r={0.005} rot={[0, 0, (k - 0.5) * 0.25]} color={k ? "#ff7b6b" : "#58a8ff"} />
    ))}
    <RB p={[-0.3, 0.87, -0.12]} s={[0.09, 0.035, 0.06]} r={0.015} color="#f3d9a6" rough={0.5} />
  </group>
);

export const TowelRail: React.FC<{ p: V3; ry?: number; color?: string }> = ({ p, ry = 0, color = "#e8835a" }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Cyl p={[0, 0, 0.06]} r={0.012} h={0.6} rot={[0, 0, Math.PI / 2]} color="#d5dbe0" metal={0.9} rough={0.2} />
    {[-0.3, 0.3].map((x) => (
      <Cyl key={x} p={[x, 0, 0.03]} r={0.012} h={0.06} rot={[Math.PI / 2, 0, 0]} color="#d5dbe0" metal={0.9} rough={0.2} />
    ))}
    <RB p={[0, -0.22, 0.07]} s={[0.46, 0.46, 0.035]} r={0.015} color={color} rough={1} />
    <RB p={[0, 0.0, 0.07]} s={[0.47, 0.04, 0.05]} r={0.02} color={color} rough={1} />
  </group>
);

export const RollHolder: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, 0, 0.02]} s={[0.04, 0.04, 0.04]} r={0.01} color="#d5dbe0" metal={0.9} rough={0.2} />
    <Cyl p={[0.07, 0, 0.07]} r={0.055} h={0.1} rot={[0, 0, Math.PI / 2]} color="#fbfbf7" rough={0.9} />
  </group>
);

/** soil pipe under a floor: vertical drop + bend + run, 110 mm, grey PVC */
export const SoilPipe: React.FC<{ from: V3; drop: number; run: number; dir?: 1 | -1; color?: string }> = ({ from, drop, run, dir = 1, color = "#8a9096" }) => (
  <group position={from}>
    <Cyl p={[0, -drop / 2, 0]} r={0.055} h={drop} color={color} rough={0.5} />
    <mesh position={[0, -drop, 0]}>
      <sphereGeometry args={[0.062, 14, 10]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
    <Cyl p={[(dir * run) / 2, -drop - 0.0, 0]} r={0.055} h={run} rot={[0, 0, Math.PI / 2 - 0.03 * dir]} color={color} rough={0.5} />
  </group>
);

// ───────────────────────── Victorian street things ─────────────────────────
/** Cast-iron street water pump (Broad Street style): fluted column, cap, spout, long handle. Faces +Z. `handle` 1 = on. */
export const StreetPump: React.FC<{ p: V3; ry?: number; handle?: number; handleAngle?: number }> = ({ p, ry = 0, handle = 1, handleAngle = 0.2 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <Cyl p={[0, 0.06, 0]} r={0.26} h={0.12} color="#2c2f30" metal={0.6} rough={0.5} />
    <Cyl p={[0, 0.85, 0]} r={0.15} r2={0.12} h={1.5} seg={12} color="#2f3436" metal={0.6} rough={0.45} />
    <Cyl p={[0, 1.66, 0]} r={0.17} h={0.12} color="#2c2f30" metal={0.6} rough={0.5} />
    <mesh position={[0, 1.8, 0]}>
      <sphereGeometry args={[0.14, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color="#2c2f30" metalness={0.6} roughness={0.5} />
    </mesh>
    <mesh position={[0, 1.95, 0]}>
      <sphereGeometry args={[0.05, 10, 8]} />
      <meshStandardMaterial color="#2c2f30" metalness={0.6} roughness={0.5} />
    </mesh>
    {/* spout */}
    <Cyl p={[0, 1.02, 0.2]} r={0.04} h={0.22} rot={[Math.PI / 2 - 0.35, 0, 0]} color="#2f3436" metal={0.6} rough={0.45} />
    {/* stone trough */}
    <RB p={[0, 0.2, 0.42]} s={[0.6, 0.3, 0.36]} r={0.03} color="#8a8478" rough={0.9} />
    {/* handle pivot + handle */}
    <Cyl p={[0.17, 1.42, 0]} r={0.04} h={0.08} rot={[0, 0, Math.PI / 2]} color="#2c2f30" metal={0.6} rough={0.5} />
    {handle > 0.01 ? (
      <group position={[0.2, 1.42, 0]} rotation={[handleAngle, 0, 0]}>
        <Cyl p={[0, 0, -0.45]} r={0.025} h={0.9} rot={[Math.PI / 2, 0, 0]} color="#2f3436" metal={0.6} rough={0.45} />
        <mesh position={[0, 0, -0.9]}>
          <sphereGeometry args={[0.04, 10, 8]} />
          <meshStandardMaterial color="#2f3436" metalness={0.6} roughness={0.45} />
        </mesh>
      </group>
    ) : null}
  </group>
);

/** the pump handle on its own (carried away by the doctor) */
export const PumpHandle: React.FC<{ p?: V3; rot?: V3 }> = ({ p = [0, 0, 0], rot = [0, 0, 0] }) => (
  <group position={p} rotation={rot}>
    <Cyl p={[0, 0, 0]} r={0.025} h={0.9} color="#2f3436" metal={0.6} rough={0.45} />
    <mesh position={[0, 0.45, 0]}>
      <sphereGeometry args={[0.04, 10, 8]} />
      <meshStandardMaterial color="#2f3436" metalness={0.6} roughness={0.45} />
    </mesh>
  </group>
);

/** Victorian top hat (attach to the Head bone) */
export const TopHat: React.FC<{ color?: string }> = ({ color = "#141414" }) => (
  <group position={[0, 0.2, 0.0]}>
    <Cyl p={[0, 0, 0]} r={0.17} h={0.02} color={color} rough={0.6} />
    <Cyl p={[0, 0.11, 0]} r={0.105} r2={0.115} h={0.2} color={color} rough={0.6} />
    <Cyl p={[0, 0.03, 0]} r={0.108} h={0.03} color="#3a2a20" rough={0.6} />
  </group>
);

/** flat cap for workers and 1935 kids */
export const FlatCap: React.FC<{ color?: string }> = ({ color = "#5a5248" }) => (
  <group position={[0, 0.16, 0.01]} rotation={[-0.15, 0, 0]}>
    <mesh scale={[1, 0.38, 1.1]}>
      <sphereGeometry args={[0.12, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
    <RB p={[0, 0.0, 0.11]} s={[0.17, 0.015, 0.09]} r={0.006} color={color} rough={0.95} />
  </group>
);

/** hard hat + head torch (modern sewer workers) */
export const HardHat: React.FC<{ color?: string; lamp?: boolean }> = ({ color = "#f4f4f0", lamp = true }) => (
  <group position={[0, 0.17, 0.01]}>
    <mesh scale={[1, 0.8, 1.1]}>
      <sphereGeometry args={[0.13, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
    <mesh scale={[1, 0.1, 1.15]} position={[0, 0.005, 0.01]}>
      <cylinderGeometry args={[0.155, 0.155, 0.1, 24]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
    {lamp ? (
      <group position={[0, 0.06, 0.13]}>
        <RB p={[0, 0, 0]} s={[0.06, 0.04, 0.04]} r={0.01} color="#222" />
        <mesh position={[0, 0, 0.021]}>
          <circleGeometry args={[0.015, 12]} />
          <meshStandardMaterial color="#fff6d8" emissive="#fff6d8" emissiveIntensity={4} />
        </mesh>
      </group>
    ) : null}
  </group>
);

export const Bucket: React.FC<{ p?: V3; rot?: V3; fill?: string }> = ({ p = [0, 0, 0], rot = [0, 0, 0], fill }) => (
  <group position={p} rotation={rot}>
    <mesh position={[0, 0.14, 0]} castShadow>
      <cylinderGeometry args={[0.15, 0.12, 0.28, 20, 1, true]} />
      <meshStandardMaterial color="#6f747a" metalness={0.7} roughness={0.4} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.12, 20]} />
      <meshStandardMaterial color="#5c6166" metalness={0.7} roughness={0.4} />
    </mesh>
    {fill ? (
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.14, 20]} />
        <meshStandardMaterial color={fill} roughness={0.2} />
      </mesh>
    ) : null}
    <mesh position={[0, 0.28, 0]} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.15, 0.006, 6, 20, Math.PI]} />
      <meshStandardMaterial color="#4a4e52" metalness={0.7} roughness={0.4} />
    </mesh>
  </group>
);

// ───────────────────────── modern works ─────────────────────────
/**
 * Tunnel boring machine head, Ø `d` m, cutting toward −X. Cutter wheel spins with `spin`, shield + trailing gear behind.
 * Origin at the centre of the cutter face.
 */
export const TBM: React.FC<{ d?: number; spin: number; len?: number }> = ({ d = 8.8, spin, len = 14 }) => {
  const r = d / 2;
  return (
    <group>
      {/* cutter wheel */}
      <group rotation={[spin, 0, 0]}>
        <Cyl p={[0, 0, 0]} r={r} h={0.5} rot={[0, 0, Math.PI / 2]} seg={48} color="#c9a23a" metal={0.5} rough={0.45} />
        {Array.from({ length: 6 }, (_, k) => (
          <RB key={k} p={[-0.32, 0, 0]} s={[0.3, d * 0.96, 0.42]} r={0.06} rot={[(k * Math.PI) / 6, 0, 0]} color="#d8b246" metal={0.5} rough={0.4} />
        ))}
        {Array.from({ length: 36 }, (_, k) => {
          const a = k * 2.4;
          const rr = 0.6 + (k / 36) * (r - 0.8);
          return (
            <mesh key={k} position={[-0.5, Math.cos(a) * rr, Math.sin(a) * rr]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.13, 0.13, 0.16, 12]} />
              <meshStandardMaterial color="#8c9297" metalness={0.9} roughness={0.3} />
            </mesh>
          );
        })}
        <mesh position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.7, 0.6, 20]} />
          <meshStandardMaterial color="#8c9297" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      {/* shield */}
      <Cyl p={[len / 2 + 0.25, 0, 0]} r={r - 0.05} h={len} rot={[0, 0, Math.PI / 2]} seg={48} color="#e8e4da" metal={0.4} rough={0.5} />
      {[2, 5, 8, 11].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[r - 0.02, 0.06, 8, 48]} />
          <meshStandardMaterial color="#b9b4a8" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <RB p={[6, r - 0.6, r - 0.2]} s={[3, 0.5, 0.06]} r={0.02} color="#2f6db5" />
    </group>
  );
};

/** precast concrete tunnel lining, rings along X from x0 to x1 (built up to `built`, 0..1), inner radius r */
export const Lining: React.FC<{ x0: number; x1: number; r: number; built?: number; ring?: number }> = ({ x0, x1, r, built = 1, ring = 2 }) => {
  const L = (x1 - x0) * built;
  const n = Math.max(1, Math.floor(L / ring));
  return (
    <group>
      {L > 0.01 ? (
        <mesh position={[x1 - L / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} receiveShadow>
          <cylinderGeometry args={[r + 0.35, r + 0.35, L, 48, 1, true]} />
          <meshStandardMaterial color="#b6b1a6" roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
      {Array.from({ length: n }, (_, k) => (
        <mesh key={k} position={[x1 - k * ring, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[r + 0.02, 0.03, 6, 48]} />
          <meshStandardMaterial color="#8e897e" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Inlet bar screen (sewage works): steel frame inclined 75°, vertical bars, a rake on chains that climbs the bars and
 * tips what it caught into a skip. Channel flows toward −Z. `rake` 0..1 = rake position bottom → top.
 */
export const BarScreen: React.FC<{ p: V3; w?: number; h?: number; phase: number; rakes?: number; load?: (k: number, u: number) => React.ReactNode }> = ({ p, w = 3.2, h = 7, phase, rakes = 3, load }) => {
  const tilt = 0.26; // from vertical
  const along = (u: number): V3 => [0, u * h * Math.cos(tilt), -u * h * Math.sin(tilt)];
  return (
    <group position={p}>
      {/* side frames */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 + 0.12), 0, 0]} rotation={[-tilt, 0, 0]}>
          <RB p={[0, h / 2, 0]} s={[0.22, h + 0.4, 0.4]} r={0.03} color="#2f6db5" metal={0.4} rough={0.45} />
        </group>
      ))}
      {/* bars */}
      <group rotation={[-tilt, 0, 0]}>
        {Array.from({ length: 26 }, (_, k) => (
          <RB key={k} p={[-w / 2 + 0.06 + (k * (w - 0.12)) / 25, h * 0.45, -0.1]} s={[0.03, h * 0.9, 0.08]} r={0.008} color="#8d949a" metal={0.85} rough={0.35} />
        ))}
        {/* chains */}
        {[-1, 1].map((s) => (
          <RB key={s} p={[s * (w / 2 - 0.05), h / 2, 0.12]} s={[0.05, h, 0.05]} r={0.01} color="#555b60" metal={0.8} rough={0.4} />
        ))}
        {/* head unit + motor */}
        <RB p={[0, h + 0.35, 0.0]} s={[w + 0.6, 0.9, 1.1]} r={0.06} color="#2f6db5" metal={0.4} rough={0.45} />
        <Cyl p={[w / 2 + 0.5, h + 0.35, 0.0]} r={0.35} h={0.5} rot={[0, 0, Math.PI / 2]} color="#e2b33a" metal={0.4} rough={0.45} />
      </group>
      {/* rakes on the chain, each with its load */}
      {Array.from({ length: rakes }, (_, k) => {
        const u = (((phase + k / rakes) % 1) + 1) % 1;
        return (
          <group key={k} position={along(u * 0.98)} rotation={[-tilt, 0, 0]}>
            <RB p={[0, 0, 0.18]} s={[w, 0.12, 0.3]} r={0.03} color="#d3d7da" metal={0.85} rough={0.35} />
            {Array.from({ length: 25 }, (_, j) => (
              <RB key={j} p={[-w / 2 + 0.12 + (j * (w - 0.24)) / 24, 0.0, 0.0]} s={[0.025, 0.05, 0.24]} r={0.008} color="#d3d7da" metal={0.85} rough={0.35} />
            ))}
            <group position={[0, 0.1, 0.25]} rotation={[tilt, 0, 0]}>{load ? load(k, u) : null}</group>
          </group>
        );
      })}
    </group>
  );
};

/** a wet wipe, crumpled (slightly bent plane) */
export const Wipe: React.FC<{ p: V3; rot: V3; s?: number; dirty?: number }> = ({ p, rot, s = 0.2, dirty = 0 }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1, 6, 6);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 4 + pos.getY(i) * 3) * 0.08);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} position={p} rotation={rot} scale={s} castShadow>
      <meshStandardMaterial map={wipeTex()} color={dirty ? "#cbbd98" : "#ffffff"} roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** lumpy fatberg blob: displaced sphere, stretched along X. `mould` 0..1 fades yellow pustules in. */
export const Fatberg: React.FC<{ p: V3; s: V3; seed?: number; mould?: number; grow?: number }> = ({ p, s, seed = 3, mould = 0, grow = 1 }) => {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 5);
    const r = seeded(seed);
    const bumps = Array.from({ length: 14 }, () => ({ d: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), a: 0.08 + r() * 0.16, w: 3 + r() * 5 }));
    const pos = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = v.clone().normalize();
      let d = 1 + Math.sin(n.x * 9 + seed) * 0.03 + Math.sin(n.y * 13) * 0.025;
      for (const b of bumps) d += b.a * Math.max(0, n.dot(b.d)) ** b.w;
      v.copy(n.multiplyScalar(d));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, [seed]);
  const k = Math.max(0.001, grow);
  return (
    <group position={p} scale={[s[0] * k, s[1] * k, s[2] * k]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial map={fatTex()} roughness={0.55} clearcoat={0.5} clearcoatRoughness={0.4} />
      </mesh>
      {mould > 0.01 ? (
        <mesh geometry={geo} scale={1.004}>
          <meshStandardMaterial map={mouldTex()} transparent opacity={mould} roughness={0.7} emissive="#5a4a00" emissiveIntensity={0.2} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
};

/** buzzing flies around a centre: tiny dark bodies with blurred wings, frame-driven orbits */
export const Flies: React.FC<{ c: V3; t: number; n?: number; r?: number; o?: number; size?: number }> = ({ c, t, n = 9, r = 0.4, o = 1, size = 1 }) =>
  o > 0.01 ? (
    <group position={c}>
      {Array.from({ length: n }, (_, k) => {
        const a = t * (2.2 + (k % 3) * 0.7) + k * 1.7;
        const rr = r * (0.6 + 0.4 * Math.sin(k * 2.3 + t * 1.3));
        const y = 0.15 * Math.sin(t * 3.1 + k) + (k % 4) * 0.05;
        return (
          <group key={k} position={[Math.cos(a) * rr, y, Math.sin(a * 1.1) * rr]} scale={o * size}>
            <mesh>
              <sphereGeometry args={[0.012, 8, 6]} />
              <meshStandardMaterial color="#111" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.01, 0]} rotation={[0, a, Math.sin(t * 60 + k) * 0.6]}>
              <planeGeometry args={[0.04, 0.016]} />
              <meshBasicMaterial color="#d9e6ee" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  ) : null;

/** museum display case: plinth + glass box + brass label. Origin on the floor. */
export const DisplayCase: React.FC<{ p: V3; w?: number; h?: number; d?: number; children?: React.ReactNode; label?: THREE.Texture }> = ({ p, w = 1.6, h = 0.9, d = 0.9, children, label }) => (
  <group position={p}>
    <RB p={[0, 0.45, 0]} s={[w + 0.1, 0.9, d + 0.1]} r={0.02} color="#20262c" rough={0.6} />
    <group position={[0, 0.9, 0]}>{children}</group>
    <mesh position={[0, 0.9 + h / 2, 0]}>
      <boxGeometry args={[w, h, d]} />
      <meshPhysicalMaterial color="#e8f3f8" roughness={0.03} transmission={0} transparent opacity={0.14} depthWrite={false} />
    </mesh>
    {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <RB key={`${sx}${sz}`} p={[(sx * w) / 2, 0.9 + h / 2, (sz * d) / 2]} s={[0.025, h, 0.025]} r={0.006} color="#9aa2a8" metal={0.8} rough={0.3} />))}
    {label ? (
      <mesh position={[0, 0.62, d / 2 + 0.056]}>
        <planeGeometry args={[0.7, 0.24]} />
        <meshStandardMaterial map={label} roughness={0.5} />
      </mesh>
    ) : null}
  </group>
);

/** cartoon alligator (body along +Z, snout first), 2–2.4 m. `jaw` 0..1 opens the mouth, `wag` swings the tail. */
export const Alligator: React.FC<{ p?: V3; ry?: number; rx?: number; s?: number; jaw?: number; wag?: number }> = ({ p = [0, 0, 0], ry = 0, rx = 0, s = 1, jaw = 0, wag = 0 }) => {
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: "#4f6b2e", roughness: 0.75 }), []);
  const belly = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9c08a", roughness: 0.8 }), []);
  const segs = [
    [0.0, 0.2, 0.24],
    [-0.28, 0.22, 0.27],
    [-0.56, 0.21, 0.26],
    [-0.82, 0.17, 0.2],
    [-1.05, 0.13, 0.15],
    [-1.26, 0.1, 0.11],
    [-1.45, 0.07, 0.08],
    [-1.62, 0.05, 0.05],
  ];
  return (
    <group position={p} rotation={[rx, ry, 0]} scale={s}>
      {segs.map(([z, h, w], k) => {
        const sway = Math.sin(wag - k * 0.6) * 0.06 * k;
        return (
          <group key={k} position={[sway, h, z]}>
            <mesh material={skin} scale={[w, h * 0.75, 0.2]} castShadow>
              <sphereGeometry args={[1, 18, 12]} />
            </mesh>
            {/* back scutes */}
            {k < 6 ? (
              <>
                {[-0.4, 0.4].map((x) => (
                  <mesh key={x} material={skin} position={[x * w, h * 0.68, 0]} scale={[0.04, 0.05, 0.06]}>
                    <sphereGeometry args={[1, 8, 6]} />
                  </mesh>
                ))}
              </>
            ) : null}
          </group>
        );
      })}
      <mesh material={belly} position={[0, 0.1, -0.3]} scale={[0.24, 0.08, 0.5]}>
        <sphereGeometry args={[1, 16, 10]} />
      </mesh>
      {/* head: upper jaw + lower jaw */}
      <group position={[0, 0.24, 0.2]}>
        <mesh material={skin} position={[0, 0.02, 0.28]} scale={[0.17, 0.08, 0.38]} rotation={[-jaw * 0.35, 0, 0]} castShadow>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        <group rotation={[jaw * 0.35, 0, 0]}>
          <mesh material={belly} position={[0, -0.06, 0.26]} scale={[0.15, 0.05, 0.36]}>
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
          {/* teeth */}
          {Array.from({ length: 8 }, (_, k) => (
            <mesh key={k} position={[(k % 2 ? 1 : -1) * 0.12, -0.02, 0.06 + (k >> 1) * 0.1]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.014, 0.045, 6]} />
              <meshStandardMaterial color="#fbf8ee" roughness={0.4} />
            </mesh>
          ))}
        </group>
        {/* eyes */}
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.09, 0.1, 0.06]}>
            <mesh material={skin} scale={[0.06, 0.05, 0.06]}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
            <mesh position={[0, 0.02, 0.035]}>
              <sphereGeometry args={[0.032, 12, 8]} />
              <meshPhysicalMaterial color="#e6c23a" roughness={0.1} clearcoat={1} />
            </mesh>
            <mesh position={[0, 0.02, 0.064]} scale={[0.25, 1, 0.3]}>
              <sphereGeometry args={[0.022, 8, 6]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        ))}
        {/* nostrils */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} material={skin} position={[sx * 0.04, 0.09, 0.6]} scale={[0.025, 0.018, 0.025]}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        ))}
      </group>
      {/* legs */}
      {[
        [0.24, -0.08],
        [-0.24, -0.08],
        [0.24, -0.7],
        [-0.24, -0.7],
      ].map(([x, z], k) => (
        <group key={k} position={[x, 0.08, z]} rotation={[0, 0, Math.sign(x) * 0.9 + Math.sin(wag * 1.5 + k) * 0.15]}>
          <mesh material={skin} position={[Math.sign(x) * 0.06, -0.02, 0]} scale={[0.1, 0.05, 0.06]}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** a rope as a tube along points */
export const Rope: React.FC<{ pts: V3[]; r?: number; color?: string }> = ({ pts, r = 0.015, color = "#c8b28a" }) => {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q))), 32, r, 6, false), [JSON.stringify(pts), r]);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
};

/** water jet from a hose nozzle along +Z: a few stretched droplet streaks, frame-driven */
export const Jet: React.FC<{ p: V3; rot?: V3; t: number; len?: number; o?: number; color?: string }> = ({ p, rot = [0, 0, 0], t, len = 2.2, o = 1, color = "#d8f0ff" }) =>
  o > 0.01 ? (
    <group position={p} rotation={rot}>
      <mesh position={[0, 0, len / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.015, len, 10, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={0.45 * o} emissive={color} emissiveIntensity={0.3} depthWrite={false} />
      </mesh>
      {Array.from({ length: 14 }, (_, k) => {
        const u = ((t * 3 + k / 14) % 1) * len;
        const spread = (u / len) * 0.18;
        return (
          <mesh key={k} position={[Math.sin(k * 3.1) * spread, Math.cos(k * 2.3) * spread - (u * u) / (len * 9), u]} scale={[1, 1, 3]}>
            <sphereGeometry args={[0.018, 6, 4]} />
            <meshStandardMaterial color={color} transparent opacity={0.8 * o} emissive={color} emissiveIntensity={0.4} />
          </mesh>
        );
      })}
    </group>
  ) : null;

/** cartoon "stink" lines: wavy green ribbons rising and fading (frame-driven) */
export const Stink: React.FC<{ p: V3; t: number; n?: number; w?: number; h?: number; o?: number; thick?: number }> = ({ p, t, n = 10, w = 6, h = 3, o = 1, thick = 0.035 }) => {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 24; k++) pts.push(new THREE.Vector3(Math.sin(k * 0.9) * 0.12, (k / 24) * 1, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, thick, 6, false);
  }, [thick]);
  return o > 0.01 ? (
    <group position={p}>
      {Array.from({ length: n }, (_, k) => {
        const u = (t * 0.35 + k / n) % 1;
        const a = Math.sin(u * Math.PI) * o;
        return (
          <mesh key={k} geometry={geo} position={[((k * 0.618) % 1) * w - w / 2, u * h, ((k * 0.37) % 1) * 1.5 - 0.75]} scale={[1, 0.9 + (k % 3) * 0.2, 1]} rotation={[0, k, Math.sin(t + k) * 0.2]}>
            <meshStandardMaterial color="#9bd84a" emissive="#7fc23a" emissiveIntensity={0.6} transparent opacity={0.75 * a} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  ) : null;
};

/** rain streaks in a box (frame-driven) */
export const Rain: React.FC<{ c: V3; size: V3; t: number; n?: number; o?: number }> = ({ c, size, t, n = 220, o = 1 }) => {
  const r = useMemo(() => seeded(77), []);
  const drops = useMemo(() => Array.from({ length: n }, () => [r(), r(), r()]), [n, r]);
  return o > 0.01 ? (
    <group position={c}>
      {drops.map(([x, y, z], k) => {
        const yy = (((y - t * 1.6) % 1) + 1) % 1;
        return (
          <mesh key={k} position={[(x - 0.5) * size[0], (yy - 0.5) * size[1], (z - 0.5) * size[2]]}>
            <boxGeometry args={[0.02, 0.45, 0.02]} />
            <meshBasicMaterial color="#cfe3f5" transparent opacity={0.45 * o} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  ) : null;
};

/** generic label texture for in-world signs */
export const signTex = (text: string, sub = "", bg = "#1d2a33", fg = "#f2efe6", w = 512, h = 192) =>
  ctex(`sign|${text}|${sub}|${bg}`, w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = fg;
    g.lineWidth = 6;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = fg;
    g.textAlign = "center";
    g.font = `900 ${sub ? 64 : 80}px Arial`;
    g.fillText(text, w / 2, sub ? h * 0.48 : h * 0.62);
    if (sub) {
      g.font = "600 34px Arial";
      g.fillText(sub, w / 2, h * 0.8);
    }
  });

export { tex };
