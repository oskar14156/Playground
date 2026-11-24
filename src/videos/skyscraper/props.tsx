import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Cyl, labelTex, Lamp, Plant, RB, Slab, Sofa, tex } from "../../lib/three/diorama";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";
import { BurjKhalifa, TowerCrane } from "./burj";

const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const WORN: V3 = [0, -0.2, 0.03];

const WORKER_A: Outfit = { top: "#e5a024", pants: "#2b3748", shoes: "#1e1b18", loose: "male" };
const WORKER_B: Outfit = { top: "#1f7a8c", pants: "#263242", shoes: "#1e1b18", loose: "male" };
const FRIEND: Outfit = { top: "#2874c9", pants: "#242b38", shoes: "#1a1d24", loose: "male" };
const GRANDMA: Outfit = { top: "#6f4b86", pants: "#262834", shoes: "#2c2e38", loose: "female" };
const COMMUTERS: Outfit[] = [
  { top: "#304868", pants: "#1c222d", shoes: "#14161b", loose: "male" },
  { top: "#d45478", pants: "#282e3a", shoes: "#f0f2f5", loose: "female" },
  { top: "#3b8c6e", pants: "#2e2824", shoes: "#1c1a18", loose: "female" },
  { top: "#8c96a4", pants: "#222630", shoes: "#181a20", loose: "male" },
];

// ───────────────────────── Procedural Prop Textures ─────────────────────────
const propTexCache = new Map<string, THREE.CanvasTexture>();
const makePropTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  if (propTexCache.has(key)) return propTexCache.get(key)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, seeded(key.split("").reduce((a, c) => a * 33 + c.charCodeAt(0), 11) & 0x7fffffff));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  propTexCache.set(key, t);
  return t;
};

/** Canvas painting hanging in Grandma's penthouse: Titanic sinking + fox head on a wooden door (Ep. 14 callback). */
const titanicArtTex = () =>
  makePropTex("titanic_art", 512, 340, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 340);
    gr.addColorStop(0, "#0b1a36");
    gr.addColorStop(0.65, "#193b68");
    gr.addColorStop(1, "#09172b");
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 340);
    // Moon
    g.fillStyle = "#fff4cf";
    g.beginPath();
    g.arc(90, 72, 26, 0, Math.PI * 2);
    g.fill();
    // Iceberg
    g.fillStyle = "#bfe6fa";
    g.beginPath();
    g.moveTo(350, 230);
    g.lineTo(410, 96);
    g.lineTo(465, 165);
    g.lineTo(492, 230);
    g.closePath();
    g.fill();
    // Sinking Titanic tilted stern-up
    g.save();
    g.translate(220, 215);
    g.rotate(-0.42);
    g.fillStyle = "#181d26";
    g.fillRect(-100, -24, 190, 42);
    g.fillStyle = "#c83e2b";
    g.fillRect(-100, 12, 190, 12);
    g.fillStyle = "#f4efe4";
    g.fillRect(-75, -42, 140, 18);
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i === 3 ? "#111" : "#d89438";
      g.fillRect(-60 + i * 32, -74, 14, 34);
    }
    g.restore();
    // Ocean waves
    g.fillStyle = "#12426b";
    g.fillRect(0, 222, 512, 118);
    // Wooden door + orange fox circle floating heroically
    g.fillStyle = "#8a5c32";
    g.fillRect(88, 250, 76, 16);
    g.fillStyle = "#ef7d2e";
    g.beginPath();
    g.arc(126, 238, 16, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#fff3e3";
    g.beginPath();
    g.arc(126, 243, 9, 0, Math.PI * 2);
    g.fill();
  });

const liferingTex = () =>
  makePropTex("titanic_lifering", 512, 512, (g) => {
    g.fillStyle = "#f5f5f5";
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = "#d12d28";
    g.fillRect(0, 0, 512, 128);
    g.fillRect(0, 256, 512, 128);
    g.fillStyle = "#141820";
    g.font = "900 44px Arial";
    g.textAlign = "center";
    g.fillText("RMS TITANIC", 256, 206);
  });

const floorLabelTex = (fl: number) =>
  makePropTex(`floor_lbl_${fl}`, 256, 128, (g) => {
    g.fillStyle = "#162130";
    g.fillRect(0, 0, 256, 128);
    g.strokeStyle = "#d9b45c";
    g.lineWidth = 6;
    g.strokeRect(8, 8, 240, 112);
    g.fillStyle = "#d9b45c";
    g.font = "700 24px Arial";
    g.textAlign = "center";
    g.fillText("EXPRESS FLOOR", 128, 42);
    g.fillStyle = "#ffffff";
    g.font = "900 54px Arial";
    g.fillText(`F${fl}`, 128, 102);
  });

const strataTex = () =>
  makePropTex("strata_profile_v2", 1024, 768, (g, r) => {
    const layers = [
      { y0: 0, y1: 160, c1: "#e6c387", c2: "#caa265" },
      { y0: 160, y1: 380, c1: "#b98e5d", c2: "#997045" },
      { y0: 380, y1: 580, c1: "#8d6f52", c2: "#6e563f" },
      { y0: 580, y1: 768, c1: "#6a5543", c2: "#4f3e30" },
    ];
    for (const L of layers) {
      const gr = g.createLinearGradient(0, L.y0, 0, L.y1);
      gr.addColorStop(0, L.c1);
      gr.addColorStop(1, L.c2);
      g.fillStyle = gr;
      g.fillRect(0, L.y0, 1024, L.y1 - L.y0);
      // Wavy geological bedding lines + pebbles
      for (let k = 0; k < 5; k++) {
        const yy = L.y0 + ((k + 0.5) / 5) * (L.y1 - L.y0);
        g.strokeStyle = `rgba(35,24,14,${0.12 + r() * 0.14})`;
        g.lineWidth = 3;
        g.beginPath();
        for (let x = 0; x <= 1024; x += 24) {
          const y = yy + Math.sin(x * 0.015 + k) * 9 + Math.cos(x * 0.04) * 3;
          x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
      for (let i = 0; i < 450; i++) {
        const px = r() * 1024;
        const py = L.y0 + r() * (L.y1 - L.y0);
        g.fillStyle = r() < 0.5 ? "rgba(255,235,195,0.16)" : "rgba(40,26,14,0.22)";
        g.beginPath();
        g.ellipse(px, py, 2 + r() * 6, 1.5 + r() * 3, r() * 2, 0, Math.PI * 2);
        g.fill();
      }
    }
    // Geological engineering depth markers positioned strictly in clear left earth margin
    const marks = [
      { y: 28, label: "0 m" },
      { y: 215, label: "-15 m" },
      { y: 425, label: "-30 m" },
      { y: 635, label: "-50 m" },
    ];
    g.font = "800 16px Arial";
    g.textBaseline = "middle";
    for (const m of marks) {
      g.fillStyle = "#ffd23f";
      g.fillRect(252, m.y - 2, 12, 4);
      const tw = g.measureText(m.label).width;
      g.fillStyle = "rgba(15,20,28,0.78)";
      g.beginPath();
      g.roundRect(267, m.y - 14, tw + 14, 28, 7);
      g.fill();
      g.fillStyle = "#ffe58f";
      g.fillText(m.label, 274, m.y + 1);
    }
  });

const persianRugTex = () =>
  makePropTex("persian_rug", 512, 384, (g) => {
    g.fillStyle = "#7a1e2a";
    g.fillRect(0, 0, 512, 384);
    // Triple ornate gold & navy geometric borders
    g.strokeStyle = "#d9b052";
    g.lineWidth = 10;
    g.strokeRect(18, 18, 476, 348);
    g.strokeStyle = "#1a2b44";
    g.lineWidth = 18;
    g.strokeRect(38, 38, 436, 308);
    g.strokeStyle = "#d9b052";
    g.lineWidth = 5;
    g.strokeRect(56, 56, 400, 272);
    // Navy floral corner accents
    const corners: [number, number][] = [
      [56, 56],
      [456, 56],
      [56, 328],
      [456, 328],
    ];
    for (const [cx, cy] of corners) {
      g.fillStyle = "#1a2b44";
      g.beginPath();
      g.arc(cx, cy, 34, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#d9b052";
      g.lineWidth = 3;
      g.stroke();
    }
    // Central sapphire-and-gold diamond medallion
    g.save();
    g.translate(256, 192);
    g.fillStyle = "#d9b052";
    g.beginPath();
    g.moveTo(0, -84);
    g.lineTo(126, 0);
    g.lineTo(0, 84);
    g.lineTo(-126, 0);
    g.closePath();
    g.fill();
    g.fillStyle = "#1a2b44";
    g.beginPath();
    g.moveTo(0, -60);
    g.lineTo(92, 0);
    g.lineTo(0, 60);
    g.lineTo(-92, 0);
    g.closePath();
    g.fill();
    g.fillStyle = "#d9b052";
    g.beginPath();
    g.moveTo(0, -28);
    g.lineTo(44, 0);
    g.lineTo(0, 28);
    g.lineTo(-44, 0);
    g.closePath();
    g.fill();
    g.restore();
  });

const hazardChevronTex = () =>
  makePropTex("hazard_chevron", 256, 128, (g) => {
    g.fillStyle = "#f5b82e";
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = "#1b2028";
    for (let x = -128; x < 384; x += 64) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 32, 0);
      g.lineTo(x + 160, 128);
      g.lineTo(x + 128, 128);
      g.closePath();
      g.fill();
    }
  });

const jerseyStripeTex = () =>
  makePropTex("jersey_stripe", 256, 128, (g) => {
    g.fillStyle = "#f4f6f8";
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = "#d93829";
    for (let x = -128; x < 384; x += 64) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 32, 0);
      g.lineTo(x + 160, 128);
      g.lineTo(x + 128, 128);
      g.closePath();
      g.fill();
    }
  });

const burjSkyReflectionTex = () =>
  makePropTex("burj_sky_refl", 1024, 1024, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 1024);
    gr.addColorStop(0, "#124273");
    gr.addColorStop(0.45, "#2a7eb8");
    gr.addColorStop(0.8, "#58addb");
    gr.addColorStop(1, "#e5b880");
    g.fillStyle = gr;
    g.fillRect(0, 0, 1024, 1024);
    // Soft diagonal sunlit white cirrus cloud wisps sweeping across entire facade
    g.save();
    g.rotate(-0.22);
    const cloudBands = [
      { x: -80, y: 240, w: 1200, h: 90, a: 0.22 },
      { x: -120, y: 420, w: 1300, h: 130, a: 0.28 },
      { x: -60, y: 610, w: 1200, h: 75, a: 0.18 },
    ];
    for (const cb of cloudBands) {
      const cgr = g.createLinearGradient(cb.x, cb.y, cb.x, cb.y + cb.h);
      cgr.addColorStop(0, "rgba(255,255,255,0)");
      cgr.addColorStop(0.5, `rgba(255,250,242,${cb.a})`);
      cgr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = cgr;
      g.fillRect(cb.x, cb.y, cb.w, cb.h);
    }
    g.restore();
    // Crisp solar specular streak slicing diagonally across multi-pane glass
    const sgr = g.createLinearGradient(0, 0, 1024, 1024);
    sgr.addColorStop(0, "rgba(255,255,255,0)");
    sgr.addColorStop(0.44, "rgba(255,255,255,0)");
    sgr.addColorStop(0.5, "rgba(255,252,240,0.42)");
    sgr.addColorStop(0.56, "rgba(255,255,255,0)");
    sgr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = sgr;
    g.fillRect(0, 0, 1024, 1024);
  });

const wetConcreteCrackTex = () =>
  makePropTex("concrete_cracks_v2", 512, 512, (g, r) => {
    g.fillStyle = "#6c727a";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.09)";
      g.fillRect(r() * 512, r() * 512, 3 + r() * 9, 3 + r() * 9);
    }
    for (let c = 0; c < 14; c++) {
      let x = r() * 512;
      let y = r() * 512;
      g.strokeStyle = "#ff5b2e";
      g.lineWidth = 8;
      g.beginPath();
      g.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (r() - 0.5) * 95;
        y += (r() - 0.5) * 95;
        g.lineTo(x, y);
      }
      g.stroke();
      g.strokeStyle = "#18100c";
      g.lineWidth = 4;
      g.stroke();
    }
  });

const mixerDrumTex = () =>
  makePropTex("mixer_drum_tex", 512, 256, (g) => {
    g.fillStyle = "#52667a";
    g.fillRect(0, 0, 512, 256);
    // Diagonal warning/livery chevron stripes spinning along the mixing drum
    g.fillStyle = "#e8a020";
    for (let x = -256; x < 768; x += 128) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 48, 0);
      g.lineTo(x + 176, 256);
      g.lineTo(x + 128, 256);
      g.closePath();
      g.fill();
    }
    g.fillStyle = "#eef4fa";
    for (let x = -192; x < 768; x += 128) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + 22, 0);
      g.lineTo(x + 150, 256);
      g.lineTo(x + 128, 256);
      g.closePath();
      g.fill();
    }
  });

// Replaced per-pane X-reflection with continuous multi-pane `burjSkyReflectionTex`

const sandGrimeTex = () =>
  makePropTex("sand_grime_pane", 256, 256, (g, r) => {
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = "rgba(218, 168, 102, 0.72)";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(182,126,64,0.45)" : "rgba(245,212,158,0.42)";
      g.fillRect(r() * 256, r() * 256, 4 + r() * 14, 2 + r() * 5);
    }
  });

// ───────────────────────── Character Bone Attachments ─────────────────────────
export const HardHat: React.FC<{ p?: V3; color?: string }> = ({ p = [0, 0.14, 0.015], color = "#f7c427" }) => (
  <group position={p}>
    <mesh position={[0, 0.02, 0]} scale={[1, 0.72, 1.12]} castShadow>
      <sphereGeometry args={[0.145, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2 + 0.12]} />
      <meshStandardMaterial color={color} roughness={0.28} metalness={0.1} />
    </mesh>
    <mesh position={[0, 0.012, 0.04]} rotation={[0.08, 0, 0]} castShadow>
      <cylinderGeometry args={[0.165, 0.17, 0.018, 18]} />
      <meshStandardMaterial color={color} roughness={0.3} />
    </mesh>
    <RB p={[0, 0.09, 0.01]} s={[0.032, 0.055, 0.22]} r={0.01} color={color} rough={0.22} />
  </group>
);

export const Binoculars: React.FC<{ p?: V3; rot?: V3 }> = ({ p = [0, 0.05, 0.1], rot = [0.3, 0, 0] }) => (
  <group position={p} rotation={rot}>
    {[-0.048, 0.048].map((x, i) => (
      <group key={i} position={[x, 0, 0]}>
        <Cyl p={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} r={0.036} r2={0.026} h={0.14} color="#1e242c" rough={0.45} />
        <Cyl p={[0, 0, 0.072]} rot={[Math.PI / 2, 0, 0]} r={0.034} h={0.012} color="#c89a42" metal={0.85} />
        {/* Shiny optical front glass lens */}
        <Cyl
          p={[0, 0, 0.078]}
          rot={[Math.PI / 2, 0, 0]}
          r={0.028}
          h={0.008}
          color="#5cd6ff"
          emissive="#38c4ff"
          ei={0.65}
          metal={0.9}
          rough={0.08}
        />
      </group>
    ))}
    {/* Central bridge hinge + focus wheel */}
    <RB p={[0, 0, -0.01]} s={[0.09, 0.032, 0.04]} r={0.008} color="#28303a" />
    <Cyl p={[0, 0.016, 0]} rot={[Math.PI / 2, 0, 0]} r={0.018} h={0.048} color="#d6b35f" metal={0.85} />
    <Cyl p={[0, 0.024, -0.025]} rot={[Math.PI / 2, 0, 0]} r={0.014} h={0.022} color="#14181f" metal={0.7} />
  </group>
);

export const Squeegee: React.FC<{ p?: V3 }> = ({ p = [0, 0.02, 0.18] }) => (
  <group position={p} rotation={[0.35, 0, 0.15]}>
    <Cyl p={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} r={0.018} h={0.38} color="#cfd6de" metal={0.82} />
    <RB p={[0, 0, 0.2]} s={[0.42, 0.045, 0.035]} r={0.008} color="#1f2833" metal={0.5} />
    <RB p={[0, 0, 0.22]} s={[0.44, 0.025, 0.016]} r={0.004} color="#22a6e0" rough={0.4} />
  </group>
);

// ───────────────────────── 1. Luxury Sky Penthouse (Grandma's Cloud Home) ─────────────────────────
export const LuxuryPenthouse: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  t?: number;
  resident?: React.ReactNode;
}> = ({ p = [0, 0, 0], ry = 0, scale = 1, t = 0, resident }) => {
  const travertine = useMemo(() => tex("tiles", "#f1ece0", [4, 3], 10), []);
  const teak = useMemo(() => tex("planks", "#8e5d34", [5, 3], 11), []);
  const plaster = useMemo(() => tex("plaster", "#ece3d2", [3, 2], 12), []);
  const titanic = useMemo(() => titanicArtTex(), []);
  const ringTex = useMemo(() => liferingTex(), []);

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Dense volumetric sculpted white cloud cradle strictly BELOW floor slab (-0.42 max) */}
      {[
        [-2.2, -1.08, -0.2, 2.2, 0.62, 2.0],
        [0.4, -1.14, 0.1, 2.7, 0.66, 2.1],
        [2.6, -1.05, -0.3, 1.9, 0.58, 1.8],
        [-0.8, -1.22, 1.4, 2.3, 0.55, 1.5],
        [1.5, -1.18, 1.3, 2.0, 0.54, 1.5],
      ].map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={i} position={[x + Math.sin(t * 0.4 + i) * 0.06, y, z]} scale={[sx, sy, sz]} receiveShadow>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#f6faff" roughness={0.96} />
        </mesh>
      ))}

      {/* Heavy concrete terrace raft & gold fascia */}
      <RB p={[0, -0.18, 0]} s={[7.8, 0.36, 5.2]} r={0.08} color="#dfe5ec" rough={0.55} />
      <RB p={[0, -0.02, 0]} s={[7.92, 0.09, 5.32]} r={0.02} color="#d6b35f" metal={0.78} rough={0.28} />

      {/* Interior floor (left & center) + outdoor teak sun deck (right + front) */}
      <Slab p={[-0.75, 0.02, -0.35]} s={[5.8, 0.04, 4.1]} map={travertine} rough={0.3} metal={0.05} />
      <Slab p={[2.8, 0.02, -0.2]} s={[1.6, 0.04, 4.6]} map={teak} rough={0.62} />
      <Slab p={[-0.3, 0.02, 2.05]} s={[7.2, 0.04, 0.95]} map={teak} rough={0.62} />

      {/* Infinity plunge pool strip on front-left terrace */}
      <RB p={[-2.15, 0.05, 1.95]} s={[2.6, 0.08, 0.82]} r={0.02} color="#189ec7" emissive="#127ba0" ei={0.35} rough={0.12} metal={0.2} />

      {/* Interior plaster walls + gold trim + warm walnut acoustic slat wall */}
      <Slab p={[-0.75, 1.68, -2.35]} s={[5.8, 3.3, 0.16]} map={plaster} rough={0.85} />
      <Slab p={[-3.58, 1.68, -0.35]} s={[0.16, 3.3, 4.1]} map={plaster} rough={0.85} />
      {/* Walnut architectural slats behind sofa */}
      {Array.from({ length: 12 }, (_, i) => (
        <RB key={i} p={[-3.2 + i * 0.18, 1.65, -2.24]} s={[0.07, 2.9, 0.05]} r={0.01} color="#5e3a20" rough={0.6} />
      ))}

      {/* Gold ceiling crown cornice trim */}
      <RB p={[-0.75, 3.27, -2.23]} s={[5.8, 0.08, 0.08]} r={0.015} color="#d6b35f" metal={0.8} />

      {/* Ceiling roof slab + recessed warm downlights */}
      <RB p={[-0.75, 3.4, -0.3]} s={[6.1, 0.22, 4.4]} r={0.04} color="#edf1f5" rough={0.5} />
      {[-2.2, -0.4, 1.2].map((lx) => (
        <group key={lx} position={[lx, 3.28, -0.5]}>
          <Cyl p={[0, 0, 0]} r={0.16} h={0.03} color="#fff7df" emissive="#ffe29c" ei={1.8} />
        </group>
      ))}
      <pointLight position={[-0.8, 2.9, -0.3]} intensity={16} distance={9} color="#ffe3b3" />

      {/* RIGHT PANORAMIC FLOOR-TO-CEILING GLASS WINDOW (Friend peeks straight through here!) */}
      <group position={[2.1, 1.65, -0.35]}>
        <mesh>
          <boxGeometry args={[0.04, 3.1, 3.9]} />
          <meshStandardMaterial color="#bce8ff" transparent opacity={0.22} metalness={0.3} roughness={0.08} />
        </mesh>
        {[-1.95, -0.65, 0.65, 1.95].map((mz) => (
          <RB key={mz} p={[0, 0, mz]} s={[0.08, 3.22, 0.07]} r={0.01} color="#1f252e" metal={0.8} />
        ))}
        {[-1.55, 0, 1.55].map((my) => (
          <RB key={my} p={[0, my, 0]} s={[0.08, 0.07, 3.98]} r={0.01} color="#1f252e" metal={0.8} />
        ))}
      </group>

      {/* Frameless terrace balustrade glass + brass stanchions */}
      <mesh position={[-0.3, 0.56, 2.46]}>
        <boxGeometry args={[7.2, 0.88, 0.03]} />
        <meshStandardMaterial color="#c4eeff" transparent opacity={0.28} metalness={0.2} roughness={0.1} />
      </mesh>
      <RB p={[-0.3, 1.01, 2.46]} s={[7.3, 0.05, 0.06]} r={0.015} color="#d6b35f" metal={0.82} />
      {[-3.8, -2.0, -0.2, 1.6, 3.4].map((rx) => (
        <Cyl key={rx} p={[rx, 0.52, 2.46]} r={0.028} h={1.0} color="#d6b35f" metal={0.82} />
      ))}

      {/* Furnishing using diorama.tsx + custom Ep. 14 Titanic painting & life preserver */}
      <mesh position={[-1.4, 0.048, -0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.9, 2.0]} />
        <meshStandardMaterial map={persianRugTex()} roughness={0.92} />
      </mesh>
      <Sofa p={[-2.05, 0.04, -1.45]} color="#4d687d" />
      <Lamp p={[-3.15, 0.04, -1.7]} on={1.1} />
      <Plant p={[1.45, 0.04, -1.7]} s={0.95} />
      {/* Walnut credenza sideboard under Titanic painting + vase & books */}
      <group position={[-0.25, 0.34, -1.96]}>
        <RB p={[0, 0, 0]} s={[1.8, 0.62, 0.42]} r={0.02} color="#4f311c" rough={0.55} />
        <RB p={[0, 0.32, 0]} s={[1.84, 0.04, 0.44]} r={0.01} color="#6b4429" rough={0.45} />
        {[-0.45, 0.45].map((hx) => (
          <Cyl key={hx} p={[hx, 0.05, 0.22]} r={0.025} h={0.03} color="#d6b35f" metal={0.85} />
        ))}
        <Cyl p={[-0.52, 0.49, 0.02]} r={0.075} r2={0.05} h={0.3} color="#288fa8" rough={0.22} metal={0.2} />
        {[
          { x: 0.4, c: "#c93f32", h: 0.22 },
          { x: 0.47, c: "#2e6ca4", h: 0.25 },
          { x: 0.54, c: "#d99e26", h: 0.2 },
        ].map((bk, i) => (
          <RB key={i} p={[bk.x, 0.34 + bk.h / 2, 0]} s={[0.055, bk.h, 0.18]} r={0.008} color={bk.c} rough={0.6} />
        ))}
      </group>
      {/* Outdoor terrace teak sun-lounger + balcony planter */}
      <group position={[2.85, 0.04, -1.25]} rotation={[0, -0.25, 0]}>
        <RB p={[0, 0.24, 0]} s={[0.72, 0.1, 1.65]} r={0.03} color="#8e5d34" rough={0.6} />
        <RB p={[0, 0.32, 0.15]} s={[0.64, 0.08, 1.25]} r={0.03} color="#f4efe4" rough={0.8} />
        <RB p={[0, 0.48, -0.58]} rot={[0.55, 0, 0]} s={[0.64, 0.08, 0.52]} r={0.03} color="#f4efe4" rough={0.8} />
      </group>
      <Plant p={[3.05, 0.04, 0.45]} s={0.82} />
      {/* Marble coffee table + gold legs + teacup */}
      <group position={[-1.65, 0.04, -0.05]}>
        <RB p={[0, 0.36, 0]} s={[1.15, 0.06, 0.65]} r={0.02} color="#f5f2eb" rough={0.2} />
        {[-0.5, 0.5].map((lx) =>
          [-0.25, 0.25].map((lz) => <Cyl key={`${lx}${lz}`} p={[lx, 0.18, lz]} r={0.02} h={0.34} color="#d6b35f" metal={0.85} />),
        )}
        <Cyl p={[0.12, 0.44, 0]} r={0.06} h={0.09} color="#ffffff" />
      </group>
      {/* Framed Titanic Sinking painting on back wall */}
      <group position={[-0.25, 1.85, -2.23]}>
        <RB p={[0, 0, 0]} s={[1.72, 1.18, 0.06]} r={0.02} color="#c49a3c" metal={0.75} />
        <mesh position={[0, 0, 0.036]}>
          <planeGeometry args={[1.52, 1.0]} />
          <meshStandardMaterial map={titanic} roughness={0.45} />
        </mesh>
      </group>
      {/* Leaning RMS TITANIC life preserver ring */}
      <group position={[1.55, 0.5, -1.0]} rotation={[0.18, -0.45, 0]}>
        <mesh>
          <torusGeometry args={[0.36, 0.1, 14, 28]} />
          <meshStandardMaterial map={ringTex} roughness={0.55} />
        </mesh>
      </group>

      {/* Grandma standing clearly inside panoramic glass / balcony */}
      {resident ? <group position={[0.45, 0.04, 0.35]}>{resident}</group> : null}
    </group>
  );
};

// ───────────────────────── 2. Construction Core Deck Next Door (Hook Friend + Crane + Workers) ─────────────────────────
export const ConstructionCoreDeck: React.FC<{
  p?: V3;
  scale?: number;
  t?: number;
  showFriend?: boolean;
  crane?: boolean;
}> = ({ p = [0, 0, 0], scale = 1, t = 0, showFriend = true, crane = true }) => {
  const conc = usePbr("concrete_floor_02", [3, 3]);
  const steel = usePbr("metal_plate", [2, 2]);
  return (
    <group position={p} scale={scale}>
      {/* Upper Burj Y-core concrete & glass shaft descending down into clouds below */}
      <group position={[1.5, -8.8, -0.8]}>
        <BurjKhalifa p={[0, 0, 0]} scale={0.0155} t={t} build={0.74} cranes={false} />
      </group>

      {/* Main reinforced concrete floor deck cantilevered out toward Grandma */}
      <mesh position={[0.6, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.8, 0.34, 4.4]} />
        <meshStandardMaterial map={conc.map} normalMap={conc.normalMap} roughnessMap={conc.roughnessMap} color="#9fa6ad" roughness={0.88} />
      </mesh>
      {/* Exposed steel I-beam outriggers & diagonal knee braces */}
      {[-1.5, 1.5].map((bz, i) => (
        <group key={i} position={[-0.2, -0.52, bz]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <boxGeometry args={[3.4, 0.22, 0.22]} />
            <meshStandardMaterial map={steel.map} normalMap={steel.normalMap} roughnessMap={steel.roughnessMap} color="#586675" metalness={0.75} roughness={0.4} />
          </mesh>
          <RB p={[1.1, -0.72, 0]} rot={[0, 0, 0.78]} s={[0.18, 2.2, 0.18]} r={0.02} color="#3b4754" metal={0.8} />
        </group>
      ))}

      {/* Concrete core shear wall with rebar starter rods sticking upward */}
      <mesh position={[2.25, 1.4, -0.4]} castShadow receiveShadow>
        <boxGeometry args={[1.25, 2.8, 3.2]} />
        <meshStandardMaterial map={conc.map} normalMap={conc.normalMap} roughnessMap={conc.roughnessMap} color="#8f979e" roughness={0.9} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <Cyl key={i} p={[1.85 + (i % 2) * 0.6, 3.15, -1.6 + Math.floor(i / 2) * 0.8]} r={0.032} h={0.8} color="#824028" metal={0.65} />
      ))}

      {/* Yellow tubular safety railing along the left window-peeking edge */}
      {[-1.9, -0.95, 0, 0.95, 1.9].map((rz) => (
        <Cyl key={rz} p={[-1.72, 0.68, rz]} r={0.032} h={1.06} color="#f5b82e" metal={0.4} />
      ))}
      <RB p={[-1.72, 1.18, 0]} s={[0.07, 0.07, 4.05]} r={0.02} color="#f5b82e" />
      <RB p={[-1.72, 0.65, 0]} s={[0.05, 0.05, 4.05]} r={0.01} color="#f5b82e" />

      {/* Construction props: stacked strapped steel I-beams, wooden pallet, safety cone */}
      <RB p={[0.9, 0.3, -1.55]} s={[1.8, 0.24, 0.9]} r={0.02} color="#8a5a32" rough={0.82} />
      <RB p={[0.9, 0.52, -1.55]} s={[1.9, 0.18, 0.55]} r={0.02} color="#5f7082" metal={0.78} />
      {[-0.45, 0.45].map((sx) => (
        <RB key={sx} p={[0.9 + sx, 0.52, -1.55]} s={[0.05, 0.2, 0.57]} r={0.005} color="#d93829" rough={0.4} />
      ))}
      <group position={[-0.75, 0.17, -1.45]}>
        <RB p={[0, 0.03, 0]} s={[0.38, 0.06, 0.38]} r={0.01} color="#20252d" />
        <Cyl p={[0, 0.28, 0]} r={0.14} r2={0.035} h={0.46} color="#ff6f1f" rough={0.45} />
        <Cyl p={[0, 0.3, 0]} r={0.11} r2={0.08} h={0.12} color="#f5f8fc" rough={0.35} />
      </group>

      {/* Towering yellow crane above core */}
      {crane ? <TowerCrane p={[2.2, 2.75, -0.4]} scale={0.34} t={t} ry={-2.5} /> : null}

      {/* Rigged hard-hat construction crew */}
      <Model
        file="man_c.glb"
        anims={LIB1}
        clip="Fixing_Kneeling"
        t={t}
        p={[0.55, 0.17, -0.95]}
        ry={0.85}
        outfit={WORKER_A}
        tint={{ Hair: "#201814" }}
        attach={{ bone: "Head", node: <HardHat color="#ffd23f" /> }}
      />
      <Model
        file="man_d.glb"
        anims={LIB2}
        clip="Idle_FoldArms_Loop"
        t={t + 0.5}
        p={[1.05, 0.17, 1.25]}
        ry={-1.95}
        outfit={WORKER_B}
        tint={{ Hair: "#161616" }}
        attach={{ bone: "Head", node: <HardHat color="#ffffff" /> }}
      />

      {/* Friend raising binoculars directly to his eyes peeking across toward Grandma */}
      {showFriend ? (
        <Model
          file="man_a.glb"
          anims={LIB1}
          clip="Idle_Loop"
          t={t}
          p={[-1.28, 0.17, 0.4]}
          ry={-Math.PI / 2}
          outfit={FRIEND}
          tint={{ Hair: "#161616" }}
          aim={{
            upperarm_l: [-0.25, -0.05, 0.95],
            lowerarm_l: [-0.42, 0.86, 0.44],
            upperarm_r: [0.25, -0.05, 0.95],
            lowerarm_r: [0.42, 0.86, 0.44],
          }}
          attach={{ bone: "Head", node: <Binoculars p={[0, 0.04, 0.175]} rot={[0, 0, 0]} /> }}
        />
      ) : null}
    </group>
  );
};

// ───────────────────────── 3. Subterranean Geological Cutaway + Rotary Piling Rig + Y-Raft + 192 Friction Piles ─────────────────────────
export const GeologyFoundationCutaway: React.FC<{
  p?: V3;
  scale?: number;
  t?: number;
  drillK?: number;
  arrows?: number;
}> = ({ p = [0, 0, 0], scale = 1, t = 0, drillK = 1, arrows = 1 }) => {
  const sand = usePbr("coast_sand_rocks_02", [5, 5]);
  const conc = usePbr("concrete_floor_02", [2, 6]);
  const mud = usePbr("brown_mud_rocks_01", [4, 2]);
  const prof = useMemo(() => strataTex(), []);

  // Y-shaped reinforced concrete transfer raft (3.7 m thick scaled cleanly)
  const yRaftGeo = useMemo(() => {
    const s = new THREE.Shape();
    for (let w = 0; w < 3; w++) {
      const a0 = (w * Math.PI * 2) / 3 - 0.24;
      const a1 = (w * Math.PI * 2) / 3 + 0.24;
      const aMid = (w * Math.PI * 2) / 3;
      const rIn = 0.85;
      const rOut = 3.15;
      if (w === 0) s.moveTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      else s.lineTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      s.lineTo(Math.cos(aMid - 0.14) * rOut, Math.sin(aMid - 0.14) * rOut);
      s.lineTo(Math.cos(aMid + 0.14) * rOut, Math.sin(aMid + 0.14) * rOut);
      s.lineTo(Math.cos(a1) * rIn, Math.sin(a1) * rIn);
    }
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.62, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04 });
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, []);

  // Radial Y-cluster of bored piles (cleaner spacing so geological strata & rebar read between piles)
  const piles = useMemo(() => {
    const pts: { x: number; z: number; cutaway: boolean }[] = [];
    for (let w = 0; w < 3; w++) {
      const a = (w * Math.PI * 2) / 3 + 0.28;
      for (let r = 0; r < 4; r++) {
        for (const row of [-0.55, 0.55]) {
          const dist = 0.55 + r * 0.72;
          const px = Math.cos(a) * dist - Math.sin(a) * row * 0.42;
          const pz = Math.sin(a) * dist + Math.cos(a) * row * 0.42;
          pts.push({ x: px, z: pz, cutaway: pz > 0.25 && r % 2 === 0 });
        }
      }
    }
    return pts;
  }, []);

  const rigDepth = -5.6 * drillK;
  const arrowSlide = (t * 0.85) % 1;

  return (
    <group position={p} scale={scale}>
      {/* Surface desert plateau (y = 0) */}
      <mesh position={[0, 0.05, -2.5]} receiveShadow>
        <boxGeometry args={[20, 0.1, 10]} />
        <meshStandardMaterial map={sand.map} normalMap={sand.normalMap} roughnessMap={sand.roughnessMap} color="#dfb882" roughness={0.94} />
      </mesh>
      {/* Side earth flank walls so camera never looks into an empty black box */}
      <mesh position={[-8.8, -3.5, -2.5]} receiveShadow>
        <boxGeometry args={[2.4, 7.2, 10]} />
        <meshStandardMaterial map={mud.map} normalMap={mud.normalMap} roughnessMap={mud.roughnessMap} color="#b28658" roughness={0.95} />
      </mesh>
      <mesh position={[8.8, -3.5, -2.5]} receiveShadow>
        <boxGeometry args={[2.4, 7.2, 10]} />
        <meshStandardMaterial map={mud.map} normalMap={mud.normalMap} roughnessMap={mud.roughnessMap} color="#b28658" roughness={0.95} />
      </mesh>

      {/* Geological cross-section backdrop wall behind the piles */}
      <mesh position={[0, -3.65, -2.6]} receiveShadow>
        <planeGeometry args={[16.2, 7.3]} />
        <meshStandardMaterial map={prof} roughness={0.95} />
      </mesh>
      {/* Excavated pit bottom shelf */}
      <mesh position={[0, -7.25, -0.5]} receiveShadow>
        <boxGeometry args={[16.8, 0.3, 4.6]} />
        <meshStandardMaterial color="#4a3a2d" roughness={0.98} />
      </mesh>

      {/* Depth ruler markers on left side of geological wall */}
      {[0, -1.6, -3.2, -4.8, -6.2].map((my, idx) => (
        <RB key={idx} p={[-4.9, my - 0.4, -2.42]} s={[0.42, 0.04, 0.05]} r={0.01} color="#ffd23f" emissive="#ffb020" ei={0.4} />
      ))}

      {/* Stub base of Burj Khalifa loading cleanly onto plateau surface above the Y-raft */}
      <group position={[0.35, 0.08, -0.35]}>
        <BurjKhalifa p={[0, 0, 0]} scale={0.032} t={t} build={0.22} cranes={false} />
      </group>

      {/* Y-shaped 3.7 m reinforced concrete raft cap + exposed front rebar mesh */}
      <mesh position={[0, -0.72, -0.25]} geometry={yRaftGeo} castShadow receiveShadow>
        <meshStandardMaterial map={conc.map} normalMap={conc.normalMap} roughnessMap={conc.roughnessMap} color="#adb3ba" roughness={0.82} />
      </mesh>
      {/* Exposed front rebar cage edge */}
      {[-0.2, 0.05, 0.3].map((ryOffset, i) => (
        <group key={i} position={[0, -0.56 + ryOffset * 0.5, 1.4]}>
          <RB p={[0, 0, 0]} s={[2.4, 0.025, 0.025]} r={0.005} color="#8a442a" metal={0.75} />
        </group>
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <Cyl key={i} p={[-1.1 + i * 0.22, -0.45, 1.4]} r={0.016} h={0.42} color="#8a442a" metal={0.75} />
      ))}

      {/* Textured concrete friction piles (50 m deep into sand) + helical rebar cage cutaways */}
      {piles.map((pl, idx) => (
        <group key={idx} position={[pl.x, -3.75, pl.z - 0.25]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.105, 0.105, 6.1, 14]} />
            <meshStandardMaterial map={conc.map} normalMap={conc.normalMap} roughnessMap={conc.roughnessMap} color="#b4bbc2" roughness={0.82} />
          </mesh>
          {/* Pile head cap ring meeting the Y-raft + intermediate concrete pour collar rings */}
          <Cyl p={[0, 2.98, 0]} r={0.125} h={0.14} color="#8a9299" rough={0.78} />
          {[-1.6, 0.2, 1.8].map((cy, ci) => (
            <Cyl key={ci} p={[0, cy, 0]} r={0.114} h={0.035} color="#8f979e" rough={0.8} />
          ))}
          {/* Front cutaway vertical rebar strands + spiral stirrup hoops */}
          {pl.cutaway ? (
            <group position={[0, 0, 0.08]}>
              {[-0.045, 0, 0.045].map((rx, k) => (
                <Cyl key={k} p={[rx, 0, 0]} r={0.01} h={5.8} color="#c45a34" metal={0.72} />
              ))}
              {Array.from({ length: 8 }, (_, hIdx) => (
                <mesh key={`st_${hIdx}`} position={[0, -2.4 + hIdx * 0.68, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.068, 0.008, 6, 12]} />
                  <meshStandardMaterial color="#c45a34" metalness={0.72} roughness={0.35} />
                </mesh>
              ))}
            </group>
          ) : null}
        </group>
      ))}

      {/* Surface Bauer BG-40 Rotary Piling Rig on left plateau (detailed tracks, glass cab, open X-braced mast, hydraulics, Kelly drive) */}
      <group position={[-2.15, 0.1, 0.45]} scale={0.78}>
        {/* Tracked crawler undercarriage + idlers + cleats */}
        {[-0.5, 0.5].map((tz) => (
          <group key={tz} position={[0, 0.22, tz]}>
            <RB p={[0, 0, 0]} s={[1.75, 0.36, 0.32]} r={0.08} color="#1f242c" rough={0.82} />
            <Cyl p={[-0.76, 0, 0]} rot={[Math.PI / 2, 0, 0]} r={0.19} h={0.34} color="#28303b" metal={0.5} />
            <Cyl p={[0.76, 0, 0]} rot={[Math.PI / 2, 0, 0]} r={0.19} h={0.34} color="#28303b" metal={0.5} />
            {Array.from({ length: 9 }, (_, ci) => (
              <group key={ci} position={[-0.64 + ci * 0.16, 0, 0]}>
                <RB p={[0, 0.19, 0]} s={[0.06, 0.04, 0.36]} r={0.005} color="#13161b" />
                <RB p={[0, -0.19, 0]} s={[0.06, 0.04, 0.36]} r={0.005} color="#13161b" />
              </group>
            ))}
          </group>
        ))}
        <RB p={[0, 0.36, 0]} s={[1.2, 0.18, 0.92]} r={0.02} color="#2b333e" metal={0.6} />

        {/* Main Excavator Body + Rear Hazard Counterweight + Vertical Exhaust + Glass Operator Cab */}
        <RB p={[-0.18, 0.78, -0.06]} s={[1.45, 0.66, 0.88]} r={0.06} color="#f5b82e" rough={0.38} />
        {/* Cooling louvers + chrome exhaust + air cleaner drum */}
        {[-0.45, -0.25, -0.05].map((lx, li) => (
          <RB key={li} p={[lx, 0.82, 0.39]} s={[0.12, 0.36, 0.03]} r={0.005} color="#252c36" />
        ))}
        <Cyl p={[-0.58, 1.32, -0.24]} r={0.045} h={0.55} color="#c8d4e0" metal={0.88} />
        <Cyl p={[-0.36, 1.18, -0.26]} r={0.09} h={0.22} color="#252d38" metal={0.6} />
        {/* Hazard chevron counterweight */}
        <mesh position={[-0.92, 0.78, 0]} castShadow>
          <boxGeometry args={[0.42, 0.62, 0.92]} />
          <meshStandardMaterial map={hazardChevronTex()} roughness={0.45} />
        </mesh>
        {/* Framed glass operator cab on right-front corner + beacon */}
        <group position={[0.25, 0.86, 0.32]}>
          <RB p={[0, 0, 0]} s={[0.68, 0.78, 0.46]} r={0.04} color="#222832" metal={0.5} />
          <RB p={[0.35, 0.04, 0]} s={[0.03, 0.56, 0.36]} r={0.01} color="#7ad0ff" rough={0.1} metal={0.2} />
          <RB p={[0.04, 0.04, 0.24]} s={[0.5, 0.54, 0.03]} r={0.01} color="#7ad0ff" rough={0.1} metal={0.2} />
          <Cyl p={[0, 0.44, 0]} r={0.055} h={0.1} color="#ffaa18" emissive="#ff9500" ei={1.1} />
        </group>

        {/* Twin angled hydraulic mast-raising cylinders (yellow barrel + chrome piston rod) */}
        {[-0.22, 0.22].map((cz, ci) => (
          <group key={ci} position={[0.26, 1.45, cz]} rotation={[0, 0, -0.56]}>
            <Cyl p={[0, -0.35, 0]} r={0.055} h={0.9} color="#e5a21d" metal={0.45} />
            <Cyl p={[0, 0.35, 0]} r={0.032} h={0.85} color="#dce6f0" metal={0.92} />
          </group>
        ))}

        {/* Open Steel Lattice Red Leader Mast (x = 0.78, y = 0.2..4.7) */}
        <group position={[0.78, 0.18, 0]}>
          {[-0.14, 0.14].map((mx) =>
            [-0.14, 0.14].map((mz) => (
              <Cyl key={`mc_${mx}_${mz}`} p={[mx, 2.25, mz]} r={0.034} h={4.55} color="#d93829" metal={0.5} />
            )),
          )}
          {Array.from({ length: 9 }, (_, ri) => {
            const ry = 0.25 + ri * 0.5;
            return (
              <group key={ri}>
                <RB p={[0, ry, 0.14]} s={[0.3, 0.035, 0.035]} r={0.005} color="#b8291d" metal={0.5} />
                <RB p={[0, ry, -0.14]} s={[0.3, 0.035, 0.035]} r={0.005} color="#b8291d" metal={0.5} />
                <Cyl p={[0, ry + 0.25, 0.14]} rot={[0, 0, 0.52]} r={0.016} h={0.54} color="#e54d3e" />
                <Cyl p={[0, ry + 0.25, 0.14]} rot={[0, 0, -0.52]} r={0.016} h={0.54} color="#e54d3e" />
              </group>
            );
          })}
          {/* Top cathead pulley sheave wheel + winch wire */}
          <RB p={[0.14, 4.58, 0]} s={[0.42, 0.16, 0.32]} r={0.02} color="#d93829" />
          <Cyl p={[0.26, 4.65, 0]} rot={[Math.PI / 2, 0, 0]} r={0.14} h={0.1} color="#28313d" metal={0.8} />
          <Cyl p={[0.2, 2.5, 0.08]} r={0.014} h={4.1} color="#8e9aa8" metal={0.9} />
        </group>

        {/* Sliding Rotary Kelly Drive Gearbox + Kelly Bar + Helical Auger entering Sand Borehole */}
        <group position={[0.98, 1.9 + (1 - drillK) * 1.4, 0]}>
          <RB p={[-0.08, 0, 0]} s={[0.42, 0.44, 0.4]} r={0.04} color="#f5b82e" metal={0.4} />
          <Cyl p={[0, 0.02, 0]} r={0.18} h={0.34} color="#28313d" metal={0.75} />
          <RB p={[-0.28, 0.12, 0.18]} rot={[0.3, 0, 0.5]} s={[0.22, 0.06, 0.06]} r={0.02} color="#181c22" />
        </group>
        <Cyl p={[0.98, 2.3, 0]} r={0.06} h={4.4} color="#b5c0cc" metal={0.88} />
        {/* Borehole steel casing collar + excavated sand spoils mound */}
        <Cyl p={[0.98, 0.06, 0]} r={0.22} r2={0.2} h={0.14} color="#586675" metal={0.8} />
        <Cyl p={[0.98, 0.03, 0]} r={0.42} r2={0.22} h={0.09} color="#cfa265" rough={0.95} />
        {/* Spinning golden helical auger flight */}
        <group position={[0.98, rigDepth * 0.45, 0]} rotation={[0, t * 8, 0]}>
          <Cyl p={[0, 0, 0]} r={0.095} h={2.2} color="#c4cfd9" metal={0.82} />
          {Array.from({ length: 8 }, (_, s) => (
            <mesh key={s} position={[0, -0.9 + s * 0.24, 0]} rotation={[0.25, s * 0.8, 0]}>
              <torusGeometry args={[0.13, 0.025, 6, 14]} />
              <meshStandardMaterial color="#f5b82e" metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Right plateau yellow/black safety fencing + Geotechnical Engineer standing for scale */}
      <group position={[3.0, 0.1, 0.85]}>
        {[0, 0.85, 1.7].map((fx) => (
          <Cyl key={fx} p={[-0.85 + fx, 0.38, 0]} r={0.025} h={0.76} color="#28313d" />
        ))}
        <RB p={[0, 0.68, 0]} s={[1.85, 0.06, 0.04]} r={0.01} color="#f5b82e" />
        <RB p={[0, 0.36, 0]} s={[1.85, 0.05, 0.04]} r={0.01} color="#f5b82e" />
      </group>
      <Model
        file="man_d.glb"
        anims={LIB2}
        clip="Idle_FoldArms_Loop"
        t={t + 0.3}
        p={[2.75, 0.1, 0.45]}
        ry={-0.65}
        scale={0.62}
        outfit={WORKER_B}
        tint={{ Hair: "#1a1816" }}
        attach={{ bone: "Head", node: <HardHat color="#ffffff" /> }}
      />

      {/* Skin-friction mechanics arrows: Coral load downward from tower vs Golden friction shear upward along piles */}
      {arrows > 0.05 ? (
        <group>
          {/* Downward weight load pushed cleanly in front onto the Y-raft */}
          {[-0.95, 0, 0.95].map((ax, i) => (
            <group key={`dn${i}`} position={[ax, 1.05 - arrowSlide * 0.45, 1.25]} scale={arrows}>
              <Cyl p={[0, 0.25, 0]} r={0.065} h={0.5} color="#ff4b3a" emissive="#ff3b30" ei={1.2} />
              <mesh position={[0, -0.05, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.14, 0.28, 12]} />
                <meshStandardMaterial color="#ff4b3a" emissive="#ff3b30" emissiveIntensity={1.25} />
              </mesh>
            </group>
          ))}
          {/* Upward skin-friction shear arrows gripping the desert sand */}
          {[-2.1, -1.05, 0, 1.05, 2.1].map((fx, col) =>
            [0, 1].map((row) => {
              const fy = -6.1 + ((row * 0.5 + arrowSlide) % 1) * 4.8;
              return (
                <group key={`up${col}_${row}`} position={[fx, fy, 1.05]} scale={arrows}>
                  <Cyl p={[0, 0, 0]} r={0.048} h={0.44} color="#ffd23f" emissive="#ffaa18" ei={1.0} />
                  <mesh position={[0, 0.28, 0]}>
                    <coneGeometry args={[0.12, 0.24, 12]} />
                    <meshStandardMaterial color="#ffd23f" emissive="#ffaa18" emissiveIntensity={1.15} />
                  </mesh>
                </group>
              );
            }),
          )}
        </group>
      ) : null}
    </group>
  );
};

// ───────────────────────── 4. Construction Pour Yard: 10-Wheel Mixer, Crushed-Ice Plant, Pump & Riser Pipe ─────────────────────────
export const ConcretePourSite: React.FC<{
  p?: V3;
  scale?: number;
  t?: number;
  nightK?: number;
  iceFlow?: number;
  crackK?: number;
  pumpPulse?: number;
}> = ({ p = [0, 0, 0], scale = 1, t = 0, nightK = 0, iceFlow = 0, crackK = 1, pumpPulse = 1 }) => {
  const conc = usePbr("concrete_floor_02", [3, 3]);
  const asphalt = useMemo(() => tex("asphalt", "#343840", [6, 4], 21), []);
  const crackMap = useMemo(() => wetConcreteCrackTex(), []);

  return (
    <group position={p} scale={scale}>
      {/* Staging concrete construction yard apron */}
      <Slab p={[0, -0.04, 0]} s={[20, 0.08, 12]} map={asphalt} rough={0.9} />
      <mesh position={[0, 0.02, -0.4]} receiveShadow>
        <boxGeometry args={[12.5, 0.06, 6.2]} />
        <meshStandardMaterial map={conc.map} normalMap={conc.normalMap} roughnessMap={conc.roughnessMap} color="#8c9298" roughness={0.85} />
      </mesh>

      {/* Background lower Y-core under active night/day pour */}
      <group position={[2.65, 0.04, -1.6]}>
        <BurjKhalifa p={[0, 0, 0]} scale={0.032} t={t} build={0.34} lit={nightK * 0.7} cranes />
      </group>

      {/* Active Rebar Pour Slab Deck (middle-right foreground: cracks in 50°C heat -> cures glossy clean with ice) */}
      <group position={[1.85, 0.14, 1.3]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.55, 0.22, 1.85]} />
          <meshStandardMaterial
            map={crackK > 0.2 ? crackMap : conc.map}
            color={crackK > 0.2 ? "#b4bac2" : "#748290"}
            emissive="#ff4a18"
            emissiveIntensity={crackK * 0.22}
            roughness={0.85}
          />
        </mesh>
        {/* Steel rebar edge cage */}
        {Array.from({ length: 7 }, (_, i) => (
          <Cyl key={i} p={[-1.05 + i * 0.35, 0.18, 0.78]} r={0.02} h={0.32} color="#82442c" metal={0.7} />
        ))}
        {/* Steam heat haze wisps rising off hot concrete */}
        {crackK > 0.15
          ? [0, 1, 2].map((w) => {
              const rise = (t * 0.8 + w * 0.33) % 1;
              return (
                <Glow
                  key={w}
                  position={[-0.6 + w * 0.6, 0.35 + rise * 1.1, 0.2]}
                  size={0.55}
                  color="#ff9944"
                  opacity={(1 - rise) * 0.42 * crackK}
                />
              );
            })
          : null}
      </group>

      {/* Industrial Crushed-Ice Batching Silo & Conveyor (back-left, brought cleanly inside 9:16 frame) */}
      <group position={[-2.0, 0.04, -0.65]}>
        {/* Structural steel H-legs */}
        {[
          [-0.55, -0.55],
          [0.55, -0.55],
          [-0.55, 0.55],
          [0.55, 0.55],
        ].map(([lx, lz], i) => (
          <RB key={i} p={[lx, 0.9, lz]} s={[0.14, 1.8, 0.14]} r={0.01} color="#3b4858" metal={0.75} />
        ))}
        {/* Insulated stainless-steel silo + ICE PLANT badge + stiffener rings + roof guardrail + condenser fans + access ladder */}
        <Cyl p={[0, 2.4, 0]} r={0.88} h={2.2} seg={24} color="#8aa2b8" metal={0.62} rough={0.38} />
        <mesh position={[0, 2.45, 0]}>
          <cylinderGeometry args={[0.895, 0.895, 0.95, 24, 1, true, -Math.PI * 0.45, Math.PI * 0.9]} />
          <meshStandardMaterial map={labelTex("#dceff8", "#1677b3", "ICE PLANT", "-10 C CHILLER")} roughness={0.45} />
        </mesh>
        {/* Steel structural stiffener rings above & below label */}
        {[1.9, 2.98].map((sy, ri) => (
          <Cyl key={ri} p={[0, sy, 0]} r={0.91} h={0.06} seg={24} color="#4e6275" metal={0.75} />
        ))}
        <Cyl p={[0, 1.05, 0]} r={0.88} r2={0.28} h={0.55} seg={24} color="#638da8" metal={0.6} />
        <Cyl p={[0, 3.65, 0]} r={0.65} h={0.32} color="#3679a3" metal={0.5} />
        {/* Roof safety handrail ring + 6 stanchion posts */}
        <mesh position={[0, 4.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.022, 6, 20]} />
          <meshStandardMaterial color="#f5b82e" metalness={0.5} roughness={0.35} />
        </mesh>
        {Array.from({ length: 6 }, (_, pi) => {
          const ang = (pi / 6) * Math.PI * 2;
          return <Cyl key={pi} p={[Math.cos(ang) * 0.62, 3.98, Math.sin(ang) * 0.62]} r={0.02} h={0.42} color="#f5b82e" />;
        })}
        {/* Twin spinning silver condenser fans on silo roof */}
        {[-0.28, 0.28].map((fx, fi) => (
          <group key={fi} position={[fx, 3.84, 0]}>
            <Cyl p={[0, 0, 0]} r={0.2} h={0.08} color="#283545" metal={0.7} />
            <group rotation={[0, t * 8 + fi, 0]}>
              <RB p={[0, 0.05, 0]} s={[0.32, 0.02, 0.05]} r={0.005} color="#dce6f0" metal={0.9} />
              <RB p={[0, 0.05, 0]} s={[0.05, 0.02, 0.32]} r={0.005} color="#dce6f0" metal={0.9} />
            </group>
          </group>
        ))}
        {/* Vertical steel access ladder along right side */}
        <group position={[0.92, 2.2, 0]}>
          {[-0.12, 0.12].map((lz) => (
            <Cyl key={lz} p={[0, 0, lz]} r={0.018} h={3.2} color="#dce2e8" metal={0.8} />
          ))}
          {Array.from({ length: 9 }, (_, li) => (
            <Cyl key={li} p={[0, -1.4 + li * 0.35, 0]} rot={[Math.PI / 2, 0, 0]} r={0.012} h={0.24} color="#dce2e8" metal={0.8} />
          ))}
        </group>
        {/* Twin frosted chiller pipes */}
        <Cyl p={[-0.95, 2.1, 0.2]} r={0.09} h={2.2} color="#8be8ff" emissive="#40c8f0" ei={0.35 + iceFlow * 0.5} rough={0.2} />
        {/* Cold white vapor mist wisps billowing from ice chute */}
        {iceFlow > 0.05
          ? [0, 1, 2].map((v) => {
              const drift = (t * 0.9 + v * 0.33) % 1;
              return (
                <Glow
                  key={v}
                  position={[0.6 + drift * 0.9, 1.85 + drift * 0.35, 0.65]}
                  size={0.75}
                  color="#dffaff"
                  opacity={(1 - drift) * 0.42 * iceFlow}
                />
              );
            })
          : null}
        {/* Conveyor trough pouring chunkier sparkling crushed ice into mixer hopper */}
        <RB p={[1.15, 1.65, 0.85]} rot={[0.15, -0.35, -0.32]} s={[2.1, 0.22, 0.42]} r={0.02} color="#475b70" metal={0.7} />
        {iceFlow > 0.05
          ? Array.from({ length: 8 }, (_, k) => {
              const fOff = (t * 2.1 + k * 0.125) % 1;
              return (
                <RB
                  key={k}
                  p={[0.45 + fOff * 1.45, 2.04 - fOff * 0.72, 0.55 + fOff * 0.52]}
                  rot={[t + k, k, 0.5]}
                  s={[0.24, 0.2, 0.22]}
                  r={0.03}
                  color="#e4fbff"
                  emissive="#6ee6ff"
                  ei={0.9 * iceFlow}
                />
              );
            })
          : null}
      </group>

      {/* Detailed 10-Wheel Concrete Mixer Truck (beveled sloped nose, window cutouts, fenders, exhaust, striped drum) */}
      <group position={[-0.25, 0.04, 0.85]} rotation={[0, 0.18, 0]}>
        {/* Heavy steel chassis frame + fuel tank cylinder */}
        <RB p={[0, 0.48, 0]} s={[3.25, 0.2, 0.95]} r={0.03} color="#28303b" metal={0.7} />
        <Cyl p={[-0.32, 0.42, 0.54]} rot={[0, 0, Math.PI / 2]} r={0.14} h={0.62} color="#b8c4d0" metal={0.85} />
        {/* Sculpted cab + sloped front hood + dark side windows + wipers + mirror + exhaust stack */}
        <RB p={[-1.08, 1.02, 0]} s={[0.88, 1.02, 0.96]} r={0.08} color="#f2b824" rough={0.34} />
        <RB p={[-1.56, 0.84, 0]} s={[0.32, 0.64, 0.88]} r={0.06} color="#e5a61c" rough={0.36} />
        <RB p={[-1.48, 1.18, 0]} rot={[0, 0, 0.22]} s={[0.14, 0.48, 0.84]} r={0.02} color="#78c2ff" rough={0.12} metal={0.35} />
        {/* Twin windshield wiper blades */}
        {[-0.22, 0.22].map((wz) => (
          <RB key={wz} p={[-1.53, 1.14, wz]} rot={[0.18, 0, 0.22]} s={[0.02, 0.3, 0.03]} r={0.004} color="#14181e" />
        ))}
        {[-0.49, 0.49].map((wz, i) => (
          <RB key={i} p={[-1.05, 1.16, wz]} s={[0.56, 0.36, 0.04]} r={0.02} color="#1c2734" metal={0.3} rough={0.15} />
        ))}
        <RB p={[-1.42, 1.15, 0.56]} s={[0.06, 0.22, 0.08]} r={0.01} color="#181c22" />
        <Cyl p={[-0.58, 1.38, 0.42]} r={0.055} h={1.55} color="#c8d4e0" metal={0.88} />
        <Cyl p={[-1.05, 1.58, 0]} r={0.07} h={0.12} color="#ff9d1c" emissive="#ff8000" ei={1.2 + Math.sin(t * 7) * 0.8} />
        <Glow position={[-1.05, 1.65, 0]} size={0.55} color="#ffaa2b" opacity={0.45 + 0.35 * Math.sin(t * 7)} />
        <RB p={[-1.74, 0.7, 0]} s={[0.08, 0.2, 0.72]} r={0.02} color="#d4dce4" metal={0.88} />
        {/* Headlights + glow */}
        {[-0.34, 0.34].map((hz, i) => (
          <group key={i} position={[-1.75, 0.64, hz]}>
            <RB p={[0, 0, 0]} s={[0.06, 0.12, 0.14]} r={0.01} color="#fff7d6" emissive="#ffe599" ei={0.6 + nightK * 2.4} />
            {nightK > 0.2 ? <Glow position={[-0.1, 0, 0]} size={0.7} color="#ffe7a8" opacity={nightK * 0.75} /> : null}
          </group>
        ))}
        {/* Wheel arch fenders + 3 Axles (6 sculpted rubber wheels with silver rims) */}
        {[-1.08, 0.65, 1.32].map((wx, i) => (
          <group key={i}>
            <RB p={[wx, 0.68, 0]} s={[0.76, 0.08, 1.06]} r={0.02} color="#212730" />
            {[-0.5, 0.5].map((wz, j) => (
              <group key={j} position={[wx, 0.34, wz]}>
                <Cyl p={[0, 0, 0]} rot={[Math.PI / 2, 0, 0]} r={0.34} h={0.22} color="#171a1f" rough={0.88} />
                <Cyl p={[0, 0, wz > 0 ? 0.09 : -0.09]} rot={[Math.PI / 2, 0, 0]} r={0.18} h={0.06} color="#cfd7df" metal={0.85} />
              </group>
            ))}
          </group>
        ))}
        {/* Steel drum cradle A-frames */}
        <RB p={[-0.3, 0.82, 0]} s={[0.2, 0.55, 0.72]} r={0.02} color="#34404e" metal={0.7} />
        <RB p={[1.38, 0.85, 0]} s={[0.2, 0.68, 0.72]} r={0.02} color="#34404e" metal={0.7} />
        {/* Spinning Striped Concrete Mixing Drum */}
        <group position={[0.48, 1.36, 0]} rotation={[0, 0, 0.26]}>
          <group rotation={[t * 2.4, 0, 0]}>
            <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.44, 0.64, 0.95, 22]} />
              <meshStandardMaterial map={mixerDrumTex()} metalness={0.32} roughness={0.5} />
            </mesh>
            <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.42, 0.64, 0.92, 22]} />
              <meshStandardMaterial map={mixerDrumTex()} metalness={0.32} roughness={0.5} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.635, 0.05, 8, 24]} />
              <meshStandardMaterial color={nightK > 0.4 ? "#2fc6e8" : "#e59624"} roughness={0.45} />
            </mesh>
          </group>
        </group>
        {/* Rear hopper & discharge chute pouring continuous chilled wet concrete stream into Putzmeister pump hopper */}
        <RB p={[1.65, 1.08, 0]} s={[0.42, 0.48, 0.56]} r={0.03} color="#3a4552" metal={0.65} />
        <RB p={[1.98, 0.78, -0.08]} rot={[0, 0, -0.45]} s={[0.65, 0.14, 0.28]} r={0.02} color="#4e5b68" metal={0.6} />
        <Cyl p={[2.22, 0.48, -0.14]} rot={[0, 0, -0.12]} r={0.08} r2={0.1} h={0.44} color="#8296a8" rough={0.35} />
        <Glow position={[2.24, 0.35, -0.14]} size={0.35} color={nightK > 0.3 ? "#8ae8ff" : "#ffb080"} opacity={0.4} />
      </group>

      {/* High-Pressure Putzmeister Pump + Hydraulic Outriggers + Vertical Climbing Steel Riser Pipe */}
      <group position={[1.45, 0.04, 0.15]}>
        <RB p={[0, 0.52, 0]} s={[1.65, 0.72, 0.88]} r={0.06} color="#e59a1e" rough={0.38} />
        {/* Digital control box on pump side */}
        <RB p={[-0.2, 0.58, 0.46]} s={[0.36, 0.28, 0.06]} r={0.015} color="#18222e" />
        <RB p={[-0.2, 0.6, 0.495]} s={[0.24, 0.14, 0.01]} r={0.005} color="#5cf0ff" emissive="#22c8ff" ei={1.1} />
        {/* Angled hydraulic stabilizer outriggers + timber cribbing pads */}
        {[-0.55, 0.55].map((oz, oi) => (
          <group key={oi} position={[-0.65, 0.26, oz * 1.15]}>
            <RB p={[0, -0.06, oi === 0 ? -0.15 : 0.15]} rot={[oi === 0 ? 0.55 : -0.55, 0, 0]} s={[0.12, 0.45, 0.12]} r={0.01} color="#28313d" metal={0.6} />
            <RB p={[0, -0.24, oi === 0 ? -0.28 : 0.28]} s={[0.26, 0.05, 0.26]} r={0.01} color="#8a5a32" rough={0.85} />
          </group>
        ))}
        <Cyl p={[-0.35, 0.24, 0.46]} rot={[Math.PI / 2, 0, 0]} r={0.24} h={0.18} color="#181b20" />
        <Cyl p={[-0.35, 0.24, -0.46]} rot={[Math.PI / 2, 0, 0]} r={0.24} h={0.18} color="#181b20" />
        <RB p={[0.92, 0.6, 0]} s={[0.45, 0.48, 0.62]} r={0.04} color="#313b47" />
        {/* Steel delivery elbow + tall vertical pipe clamped to core */}
        <RB p={[1.25, 0.35, -0.4]} rot={[0.6, 0, 0]} s={[0.16, 0.16, 1.2]} r={0.03} color="#283545" metal={0.75} />
        <Cyl p={[1.38, 3.3, -1.05]} r={0.09} h={6.2} color="#34465a" metal={0.8} />
        {Array.from({ length: 6 }, (_, k) => (
          <Cyl key={k} p={[1.38, 0.8 + k * 1.0, -1.05]} r={0.135} h={0.08} color="#f5b82e" metal={0.5} />
        ))}
        {/* Pulsing concrete flow capsules climbing the pipe */}
        {pumpPulse > 0.05
          ? Array.from({ length: 5 }, (_, k) => {
              const py = 0.6 + ((t * 1.9 + k * 0.2) % 1) * 5.2;
              return (
                <Cyl
                  key={k}
                  p={[1.38, py, -1.05]}
                  r={0.12}
                  h={0.38}
                  color={nightK > 0.3 ? "#62ebff" : "#ff6b3a"}
                  emissive={nightK > 0.3 ? "#3ee4ff" : "#ff4518"}
                  ei={1.6}
                />
              );
            })
          : null}
      </group>

      {/* Construction Floodlight Towers snapping on smoothly in Night mode */}
      {[
        [-4.2, 0.04, 1.9],
        [4.1, 0.04, 1.6],
      ].map(([lx, ly, lz], i) => (
        <group key={i} position={[lx, ly, lz]}>
          <RB p={[0, 0.24, 0]} s={[0.75, 0.48, 0.6]} r={0.04} color="#f2b224" />
          <Cyl p={[0, 2.25, 0]} r={0.06} h={4.1} color="#dce2e8" metal={0.85} />
          <RB p={[0, 4.25, 0]} s={[0.85, 0.26, 0.22]} r={0.03} color="#2a323c" />
          {nightK > 0.15 ? (
            <>
              <Glow position={[0, 4.25, 0.18]} size={1.6} color="#fff7d6" opacity={nightK * 0.95} />
              <pointLight position={[0, 4.1, 0.5]} intensity={18 * nightK} distance={14} color="#e6f5ff" />
            </>
          ) : null}
        </group>
      ))}

      {/* Foreground Jobsite Framing: Jersey barriers, orange traffic cones & stacked rebar sleepers */}
      {[-2.95, 2.95].map((bx, bi) => (
        <group key={`jb_${bi}`} position={[bx, 0.04, 3.25]} rotation={[0, bi === 0 ? 0.14 : -0.14, 0]}>
          <RB p={[0, 0.26, 0]} s={[1.55, 0.46, 0.42]} r={0.04} color="#9aa4b0" rough={0.85} />
          <mesh position={[0, 0.56, 0]} castShadow>
            <boxGeometry args={[1.52, 0.2, 0.24]} />
            <meshStandardMaterial map={jerseyStripeTex()} roughness={0.45} />
          </mesh>
        </group>
      ))}
      {[
        [-1.65, 3.3],
        [-0.85, 3.4],
        [0.95, 3.35],
        [1.8, 3.25],
      ].map(([cx, cz], ci) => (
        <group key={`cn_${ci}`} position={[cx, 0.04, cz]}>
          <RB p={[0, 0.025, 0]} s={[0.32, 0.05, 0.32]} r={0.01} color="#1f242c" />
          <Cyl p={[0, 0.25, 0]} r={0.12} r2={0.03} h={0.42} color="#ff6f1f" rough={0.45} />
          <Cyl p={[0, 0.27, 0]} r={0.095} r2={0.07} h={0.1} color="#f5f8fc" rough={0.35} />
        </group>
      ))}
      <group position={[-3.3, 0.04, 1.35]} rotation={[0, 0.3, 0]}>
        <RB p={[0, 0.05, -0.25]} s={[0.9, 0.08, 0.12]} r={0.01} color="#78502c" rough={0.85} />
        <RB p={[0, 0.05, 0.25]} s={[0.9, 0.08, 0.12]} r={0.01} color="#78502c" rough={0.85} />
        {[-0.25, -0.12, 0, 0.12, 0.25].map((rx, ri) => (
          <Cyl key={ri} p={[rx, 0.12, 0]} rot={[Math.PI / 2, 0, 0]} r={0.022} h={1.2} color="#8a442a" metal={0.75} />
        ))}
      </group>

      {/* Construction workers positioned clearly on yard apron without blocking mixer headlights or rebar deck */}
      <Model
        file="man_c.glb"
        anims={crackK > 0.3 ? LIB2 : LIB1}
        clip={crackK > 0.3 ? "Idle_No_Loop" : "Interact"}
        t={t}
        p={[-2.55, 0.05, 1.95]}
        ry={0.55}
        outfit={WORKER_A}
        tint={{ Hair: "#201814" }}
        attach={{ bone: "Head", node: <HardHat color="#ffd23f" /> }}
      />
      <Model
        file="man_b.glb"
        anims={LIB2}
        clip={nightK > 0.3 ? "Yes" : "Idle_FoldArms_Loop"}
        t={t + 0.4}
        p={[2.65, 0.05, 2.25]}
        ry={-0.75}
        outfit={WORKER_B}
        tint={{ Hair: "#161616" }}
        attach={{ bone: "Head", node: <HardHat color="#ffffff" /> }}
      />
    </group>
  );
};

// ───────────────────────── 5. 3D Aerodynamic Wind Tunnel Streamlines + Vortex Street ─────────────────────────
const arrowEulerAlong = (curve: THREE.CatmullRomCurve3, u = 1): V3 => {
  const tan = curve.getTangentAt(u).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
  const e = new THREE.Euler().setFromQuaternion(q);
  return [e.x, e.y, e.z];
};

export const WindStreamlines: React.FC<{
  p?: V3;
  scale?: number;
  t?: number;
  /** 0 = violent red alternating Kármán vortex coils behind straight tower; 1 = broken harmless turquoise curls */
  yShape?: number;
}> = ({ p = [0, 0, 0], scale = 1, t = 0, yShape = 0 }) => {
  const incomingPaths = useMemo(() => {
    const out: { geo: THREE.TubeGeometry; tip: V3; rot: V3 }[] = [];
    for (let row = 0; row < 5; row++) {
      const y = 120 + row * 125;
      for (const lane of [-1, 1]) {
        const pts: THREE.Vector3[] = [];
        for (let s = 0; s <= 16; s++) {
          const x = -320 + s * 28;
          const deflect = Math.exp(-(((x - 10) / 88) ** 2)) * 44;
          const wrapZ = lane * (32 + deflect);
          pts.push(new THREE.Vector3(x, y + Math.sin(s * 0.35 + row) * 6, wrapZ));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const end = pts[pts.length - 1];
        out.push({
          geo: new THREE.TubeGeometry(curve, 28, 2.5, 7, false),
          tip: [end.x, end.y, end.z],
          rot: arrowEulerAlong(curve, 1),
        });
      }
    }
    return out;
  }, []);

  const karmanVortices = useMemo(() => {
    const out: { geo: THREE.TubeGeometry; tip: V3; rot: V3 }[] = [];
    for (let k = 0; k < 6; k++) {
      const side = k % 2 === 0 ? 1 : -1;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 26; i++) {
        const ang = i * 0.52;
        const rad = 18 + i * 0.95;
        const driftX = 35 + k * 42 + i * 2.2;
        const y = 140 + k * 82 + Math.cos(ang) * rad * 0.42;
        const z = side * 34 + Math.sin(ang) * rad;
        pts.push(new THREE.Vector3(driftX, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const end = pts[pts.length - 1];
      out.push({
        geo: new THREE.TubeGeometry(curve, 30, 3.0, 8, false),
        tip: [end.x, end.y, end.z],
        rot: arrowEulerAlong(curve, 1),
      });
    }
    return out;
  }, []);

  const brokenWisps = useMemo(() => {
    const r = seeded(77);
    const out: { geo: THREE.TubeGeometry; tip: V3; rot: V3; baseP: V3; ry: number }[] = [];
    for (let k = 0; k < 18; k++) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) {
        const a = i * 0.6;
        const rad = 8 + i * 0.65;
        pts.push(new THREE.Vector3(i * 4.5, Math.sin(a) * rad * 0.55, Math.cos(a) * rad));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const end = pts[pts.length - 1];
      out.push({
        geo: new THREE.TubeGeometry(curve, 14, 2.4, 6, false),
        tip: [end.x, end.y, end.z],
        rot: arrowEulerAlong(curve, 1),
        baseP: [32 + r() * 95, 90 + k * 31, (r() - 0.5) * 90],
        ry: (r() - 0.5) * 1.4,
      });
    }
    return out;
  }, []);

  return (
    <group position={p} scale={scale}>
      {/* Incoming high-speed streamlines + sliding 3D conical arrowheads */}
      {incomingPaths.map((item, i) => {
        const flowPulse = ((t * 1.6 + i * 0.13) % 1) * 28;
        return (
          <group key={`in${i}`} position={[flowPulse - 14, 0, 0]}>
            <mesh geometry={item.geo}>
              <meshStandardMaterial
                color="#8ee8ff"
                emissive="#45d2ff"
                emissiveIntensity={0.9}
                transparent
                opacity={0.78}
              />
            </mesh>
            <mesh position={item.tip} rotation={item.rot}>
              <coneGeometry args={[7, 22, 8]} />
              <meshStandardMaterial color="#b4f2ff" emissive="#5ee0ff" emissiveIntensity={1.3} />
            </mesh>
          </group>
        );
      })}

      {/* Leeward wake: Giant synchronized red Kármán vortices vs shattered irregular turquoise wisps */}
      {yShape < 0.5
        ? karmanVortices.map((v, i) => {
            const drift = ((t * 36) % 44) - 18;
            return (
              <group key={`kv${i}`} position={[drift, 0, 0]}>
                <mesh geometry={v.geo}>
                  <meshStandardMaterial
                    color="#ff5a45"
                    emissive="#ff2d20"
                    emissiveIntensity={1.45}
                    transparent
                    opacity={0.86}
                  />
                </mesh>
                <mesh position={v.tip} rotation={v.rot}>
                  <coneGeometry args={[8.5, 24, 8]} />
                  <meshStandardMaterial color="#ff927d" emissive="#ff3b30" emissiveIntensity={1.6} />
                </mesh>
              </group>
            );
          })
        : brokenWisps.map((w, i) => {
            const drift = ((t * 28 + i * 9) % 40) - 10;
            return (
              <group key={`bw${i}`} position={[w.baseP[0] + drift, w.baseP[1], w.baseP[2]]} rotation={[0, w.ry, 0]}>
                <mesh geometry={w.geo}>
                  <meshStandardMaterial
                    color="#5dfc9d"
                    emissive="#2ee880"
                    emissiveIntensity={1.05}
                    transparent
                    opacity={0.82}
                  />
                </mesh>
                <mesh position={w.tip} rotation={w.rot}>
                  <coneGeometry args={[5.5, 16, 8]} />
                  <meshStandardMaterial color="#a6ffd0" emissive="#42f595" emissiveIntensity={1.2} />
                </mesh>
              </group>
            );
          })}
    </group>
  );
};

// ───────────────────────── 6. Storm Spire + Comedy Swinging Chandelier Penthouse ─────────────────────────
export const StormPenthouseSpire: React.FC<{ p?: V3; scale?: number; t?: number }> = ({
  p = [0, 0, 0],
  scale = 1,
  t = 0,
}) => {
  const swayAmp = Math.sin(t * 1.55);
  const blink = 0.65 + 0.35 * Math.sin(t * 2.2);
  const boltFlash = Math.pow(Math.max(0, Math.sin(t * 2.4 + 0.8)), 10);

  const lightningGeo = useMemo(() => {
    const main = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 4.8, 0),
      new THREE.Vector3(-0.6, 3.3, 0.2),
      new THREE.Vector3(0.45, 2.0, 0),
      new THREE.Vector3(-0.75, 0.6, -0.1),
      new THREE.Vector3(0.2, -1.2, 0.2),
      new THREE.Vector3(-0.3, -2.8, 0),
    ]);
    const branch = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.6, 3.3, 0.2),
      new THREE.Vector3(-1.45, 2.1, 0.4),
      new THREE.Vector3(-1.85, 0.9, 0.2),
    ]);
    return {
      main: new THREE.TubeGeometry(main, 16, 0.085, 6, false),
      branch: new THREE.TubeGeometry(branch, 8, 0.045, 5, false),
    };
  }, []);

  const rainDrops = useMemo(() => {
    const r = seeded(303);
    return Array.from({ length: 85 }, (_, i) => ({
      x: (r() - 0.5) * 16,
      y: (r() - 0.5) * 16 + 2,
      z: (r() - 0.5) * 7 + 1,
      speed: 9 + r() * 5,
      idx: i,
    }));
  }, []);

  return (
    <group position={p} scale={scale}>
      {/* Forked 3D storm lightning bolt in clouds behind */}
      <group position={[-2.8, 1.2, -6.5]}>
        <mesh geometry={lightningGeo.main}>
          <meshStandardMaterial
            color="#e6f7ff"
            emissive="#72d8ff"
            emissiveIntensity={boltFlash > 0.15 ? 3.5 * boltFlash : 0.05}
            transparent
            opacity={boltFlash > 0.15 ? Math.min(1, boltFlash * 1.4) : 0.04}
          />
        </mesh>
        <mesh geometry={lightningGeo.branch}>
          <meshStandardMaterial
            color="#d8f2ff"
            emissive="#58cbff"
            emissiveIntensity={boltFlash > 0.15 ? 2.8 * boltFlash : 0.04}
            transparent
            opacity={boltFlash > 0.15 ? Math.min(1, boltFlash * 1.2) : 0.03}
          />
        </mesh>
        {boltFlash > 0.2 ? <Glow position={[-0.3, 1.8, 0.5]} size={4.5} color="#9ae6ff" opacity={boltFlash * 0.55} /> : null}
      </group>

      {/* Plumb Vertical Reference Line + Golden ±2 m Deflection Gauge Arc clearly visible along spire waist */}
      <group position={[0, 0, 0.35]}>
        {Array.from({ length: 8 }, (_, i) => (
          <RB key={i} p={[0, 2.75 + i * 0.25, 0]} s={[0.032, 0.12, 0.02]} r={0.005} color="#eef6ff" emissive="#ffffff" ei={0.7} />
        ))}
        <mesh position={[0, 2.55, 0.04]} rotation={[0, 0, Math.PI / 2 - 0.26]}>
          <torusGeometry args={[1.95, 0.032, 8, 24, 0.52]} />
          <meshStandardMaterial color="#ffd23f" emissive="#ffb020" emissiveIntensity={1.1} />
        </mesh>
      </group>

      {/* Upper Burj stepped crown descending cleanly BELOW the penthouse floor slab (y = 0) */}
      <group position={[swayAmp * 0.14, -4.5, 0]} rotation={[0, 0, -swayAmp * 0.025]}>
        <Cyl p={[0, 3.2, 0]} r={1.85} r2={1.45} h={2.2} seg={12} color="#6387a6" metal={0.72} rough={0.24} />
        <Cyl p={[0, 1.2, 0]} r={2.25} r2={1.85} h={2.4} seg={12} color="#4e6f8c" metal={0.7} rough={0.26} />
        <Cyl p={[0, -2.5, 0]} r={3.1} r2={2.25} h={5.4} seg={12} color="#3b5872" metal={0.68} rough={0.28} />
        {/* 12 Radial stainless-steel vertical cladding ribs around stepped crown */}
        {Array.from({ length: 12 }, (_, ri) => {
          const ang = (ri / 12) * Math.PI * 2;
          return (
            <group key={ri}>
              <Cyl p={[Math.cos(ang) * 1.66, 3.2, Math.sin(ang) * 1.66]} r={0.035} h={2.1} color="#dce6f0" metal={0.9} />
              <Cyl p={[Math.cos(ang) * 2.06, 1.2, Math.sin(ang) * 2.06]} r={0.038} h={2.3} color="#dce6f0" metal={0.9} />
              <Cyl p={[Math.cos(ang) * 2.68, -2.5, Math.sin(ang) * 2.68]} r={0.045} h={5.2} color="#cddae6" metal={0.88} />
            </group>
          );
        })}
        {/* Illuminated crown collar bands */}
        {[4.2, 2.1, -0.2].map((ryPos, k) => (
          <Cyl
            key={k}
            p={[0, ryPos, 0]}
            r={1.48 + k * 0.42}
            h={0.14}
            seg={18}
            color="#d8eeff"
            emissive="#98d8ff"
            ei={0.95}
          />
        ))}
      </group>

      {/* Comedy Cutaway Top Penthouse Room nested cleanly ABOVE the crown tiers (NO spire inside!) */}
      <group position={[swayAmp * 0.22, -0.15, 0]}>
        {/* Outer metallic tower structural piers framing the suite */}
        <RB p={[-1.72, 1.08, 0]} s={[0.26, 2.24, 2.35]} r={0.03} color="#58697a" metal={0.75} />
        <RB p={[1.72, 1.08, 0]} s={[0.26, 2.24, 2.35]} r={0.03} color="#58697a" metal={0.75} />
        {/* Warm walnut suite floor, back paneling, ceiling */}
        <RB p={[0, 0, 0]} s={[3.5, 0.16, 2.3]} r={0.02} color="#9e876a" rough={0.75} />
        <RB p={[0, 1.08, -1.04]} s={[3.3, 2.04, 0.14]} r={0.02} color="#3a2d24" rough={0.8} />
        <RB p={[0, 2.14, 0]} s={[3.65, 0.18, 2.4]} r={0.03} color="#344354" metal={0.65} />
        <pointLight position={[0, 1.65, 0.35]} intensity={3.2} distance={5.5} color="#ffd99a" />

        {/* Framed mini Titanic painting + slim walnut bookshelf inside penthouse */}
        <group position={[0.62, 1.38, -0.95]}>
          <RB p={[0, 0, 0]} s={[0.78, 0.54, 0.04]} r={0.01} color="#c49a3c" metal={0.75} />
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.68, 0.44]} />
            <meshStandardMaterial map={titanicArtTex()} roughness={0.45} />
          </mesh>
        </group>
        <group position={[-1.18, 0.65, -0.82]}>
          <RB p={[0, 0, 0]} s={[0.58, 1.12, 0.24]} r={0.01} color="#4d321e" rough={0.6} />
          {[0.28, -0.08, -0.4].map((sy, si) => (
            <group key={si} position={[0, sy, 0.02]}>
              <RB p={[0, -0.06, 0]} s={[0.52, 0.03, 0.22]} r={0.005} color="#6b462b" />
              {[-0.16, -0.08, 0, 0.09, 0.16].map((bx, bi) => (
                <RB
                  key={bi}
                  p={[bx, 0.06, 0]}
                  s={[0.045, 0.16 + ((bi + si) % 2) * 0.03, 0.14]}
                  r={0.004}
                  color={["#c93f32", "#2e6ca4", "#d99e26", "#3a8c6e", "#7d4b8c"][(bi + si) % 5]}
                />
              ))}
            </group>
          ))}
        </group>

        {/* Multi-Tier Sparkling Crystal Chandelier reacting physically to the ±2 m tower sway! */}
        <group position={[0, 2.04, 0]} rotation={[0, 0, -swayAmp * 0.44]}>
          <Cyl p={[0, -0.22, 0]} r={0.022} h={0.44} color="#d6b35f" metal={0.88} />
          {[
            { y: -0.36, r: 0.32, n: 7 },
            { y: -0.49, r: 0.22, n: 5 },
            { y: -0.61, r: 0.12, n: 2 },
          ].map((tier, ti) => (
            <group key={ti} position={[0, tier.y, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[tier.r, 0.016, 6, 20]} />
                <meshStandardMaterial color="#e0be68" metalness={0.88} roughness={0.22} />
              </mesh>
              {Array.from({ length: tier.n }, (_, bi) => {
                const ba = (bi / tier.n) * Math.PI * 2;
                return (
                  <mesh key={bi} position={[Math.cos(ba) * tier.r, -0.04, Math.sin(ba) * tier.r]}>
                    <sphereGeometry args={[0.035, 8, 8]} />
                    <meshStandardMaterial color="#fff9e8" emissive="#ffe29a" emissiveIntensity={1.65} />
                  </mesh>
                );
              })}
            </group>
          ))}
          <Glow position={[0, -0.5, 0]} size={0.62} color="#ffcf75" opacity={0.34} />
        </group>

        {/* Ornate rug, plant, floor lamp, sofa & calmly sitting Grandma in FursuitHead */}
        <mesh position={[0, 0.09, -0.15]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.1, 1.3]} />
          <meshStandardMaterial map={persianRugTex()} roughness={0.92} />
        </mesh>
        <Plant p={[1.25, 0.08, -0.68]} s={0.62} />
        <Lamp p={[-1.32, 0.08, -0.7]} on={0.45} />
        <group position={[-0.38, 0.08, -0.45]} scale={0.58}>
          <Sofa p={[0, 0, 0]} color="#7a3e4d" />
        </group>
        <group position={[-0.38, 0.1, -0.35]} scale={0.65}>
          <Model
            file="woman_c.glb"
            anims={LIB1}
            clip="Sitting_Idle_Loop"
            t={t}
            outfit={GRANDMA}
            tint={{ Hair: "#d9d9d9" }}
            attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
          />
        </group>
        <group position={[0.58, 0.08, 0.25]}>
          <RB p={[0, 0.24, 0]} s={[0.72, 0.05, 0.46]} r={0.01} color="#f2ede2" />
          <Cyl p={[0.25, 0.12, 0]} r={0.02} h={0.24} color="#d6b35f" />
          <Cyl p={[-0.25, 0.12, 0]} r={0.02} h={0.24} color="#d6b35f" />
          {/* Coffee mug sliding back & forth across table */}
          <Cyl p={[swayAmp * -0.18, 0.32, 0]} r={0.055} h={0.1} color="#ffffff" />
        </group>

        {/* Rooftop maintenance parapet railing + spinning 3-cup wind anemometer */}
        <group position={[0, 2.25, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.68, 0.025, 6, 24]} />
            <meshStandardMaterial color="#cfd8e3" metalness={0.8} roughness={0.25} />
          </mesh>
          {Array.from({ length: 8 }, (_, pi) => {
            const pa = (pi / 8) * Math.PI * 2;
            return <Cyl key={pi} p={[Math.cos(pa) * 1.68, -0.12, Math.sin(pa) * 1.68]} r={0.018} h={0.24} color="#cfd8e3" metal={0.8} />;
          })}
        </group>
        <group position={[1.25, 2.55, 0.4]}>
          <Cyl p={[0, -0.16, 0]} r={0.022} h={0.35} color="#dce6f0" metal={0.85} />
          <group rotation={[0, t * 14, 0]}>
            {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ca, ci) => (
              <group key={ci} rotation={[0, ca, 0]}>
                <Cyl p={[0.12, 0, 0]} rot={[0, 0, Math.PI / 2]} r={0.01} h={0.22} color="#dce6f0" metal={0.88} />
                <mesh position={[0.23, 0, 0]}>
                  <sphereGeometry args={[0.042, 8, 8]} />
                  <meshStandardMaterial color="#ffd23f" metalness={0.6} roughness={0.3} />
                </mesh>
              </group>
            ))}
          </group>
        </group>

        {/* Stepped pinnacle spire base & telescoping steel mast rising ABOVE penthouse roof! */}
        <group position={[0, 2.23, 0]} rotation={[0, 0, -swayAmp * 0.065]}>
          <Cyl p={[0, 0.32, 0]} r={1.08} r2={0.68} h={0.64} seg={16} color="#9bb2c7" metal={0.85} />
          <Cyl p={[0, 0.92, 0]} r={0.64} r2={0.38} h={0.58} seg={16} color="#b8cad8" metal={0.88} />
          {/* 12 Vertical stainless-steel cladding ribs on upper spire collar */}
          {Array.from({ length: 12 }, (_, ri) => {
            const ang = (ri / 12) * Math.PI * 2;
            return (
              <Cyl key={ri} p={[Math.cos(ang) * 0.9, 0.42, Math.sin(ang) * 0.9]} r={0.026} h={0.78} color="#eef4fa" metal={0.92} />
            );
          })}
          <Cyl p={[0, 0.65, 0]} r={0.72} h={0.09} seg={18} color="#d8f0ff" emissive="#a8e4ff" ei={1.1} />
          {/* Tall slender flexing Burj pinnacle mast */}
          <Cyl p={[swayAmp * 0.1, 2.9, 0]} rot={[0, 0, -swayAmp * 0.04]} r={0.24} r2={0.05} h={3.8} seg={14} color="#e2ebf2" metal={0.92} rough={0.16} />
          <Glow position={[swayAmp * 0.18, 4.82, 0]} size={0.95} color="#ff3b30" opacity={blink} />
          <mesh position={[swayAmp * 0.18, 4.82, 0]}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial color="#ff453a" emissive="#ff3b30" emissiveIntensity={2.5 * blink} />
          </mesh>
        </group>
      </group>

      {/* Driving diagonal storm rain streaks */}
      {rainDrops.map((d) => {
        const y = 9 - (((-d.y + t * d.speed) % 16 + 16) % 16);
        const x = d.x + y * 0.22;
        return (
          <mesh key={d.idx} position={[x, y, d.z]} rotation={[0, 0, -0.22]}>
            <cylinderGeometry args={[0.013, 0.013, 0.6, 4]} />
            <meshBasicMaterial color="#b4dcff" transparent opacity={0.48} />
          </mesh>
        );
      })}
    </group>
  );
};

// ───────────────────────── 7. Double-Deck Skyscraper Express Core + Commuters + Exhausted Stair Climber ─────────────────────────
export const DoubleDeckCoreCutaway: React.FC<{
  p?: V3;
  scale?: number;
  t?: number;
  lift?: number;
}> = ({ p = [0, 0, 0], scale = 1, t = 0, lift = 0 }) => {
  const conc = usePbr("concrete_floor_02", [3, 4]);
  const planks = useMemo(() => tex("planks", "#9c7046", [3, 2], 41), []);
  const floorHeight = 2.65;
  const travel = lift * floorHeight * 5;
  const cabY = -1.6 + travel;
  const cabRoofY = cabY + 5.36;
  const hairCols = ["#241c16", "#5a3922", "#181818", "#784c28"];

  return (
    <group position={p} scale={scale}>
      {/* Central reinforced concrete express shaft back wall */}
      <mesh position={[0, 4.5, -1.6]} receiveShadow>
        <boxGeometry args={[9.4, 24, 0.3]} />
        <meshStandardMaterial map={conc.map} normalMap={conc.normalMap} roughnessMap={conc.roughnessMap} color="#7d8691" roughness={0.88} />
      </mesh>

      {/* Stacked 8 cut-open furnished building floors (Left) + compact visible stairs (Right) */}
      {Array.from({ length: 8 }, (_, k) => {
        const y = -3.8 + k * floorHeight;
        const flNum = 112 + k * 2;
        const lbl = floorLabelTex(flNum);
        const person = COMMUTERS[k % COMMUTERS.length];
        return (
          <group key={k} position={[0, y, 0]}>
            {/* Left lobby concrete & hardwood slab */}
            <RB p={[-2.55, 0, -0.2]} s={[2.55, 0.18, 2.7]} r={0.02} color="#b8c0c8" />
            <Slab p={[-2.55, 0.1, -0.2]} s={[2.5, 0.02, 2.6]} map={planks} rough={0.45} />
            {/* Warm ceiling cove strip + golden lobby plaque + brushed-gold landing door pillar + abstract art print */}
            <RB p={[-2.4, floorHeight - 0.15, -0.2]} s={[1.8, 0.05, 0.25]} r={0.01} color="#fff3d2" emissive="#ffe19e" ei={1.4} />
            <RB p={[-1.32, 1.25, -0.85]} s={[0.1, 2.3, 0.95]} r={0.015} color="#c49b45" metal={0.82} />
            <RB p={[-1.35, 1.15, 0.12]} s={[0.04, 0.14, 0.08]} r={0.008} color="#4ceeff" emissive="#22d4ff" ei={1.3} />
            <RB p={[-2.8, 1.55, -1.42]} s={[0.56, 0.44, 0.04]} r={0.01} color="#26303d" metal={0.6} />
            <RB p={[-2.8, 1.55, -1.39]} s={[0.46, 0.34, 0.02]} r={0.005} color={k % 2 === 0 ? "#4296c8" : "#d98236"} />
            <mesh position={[-1.9, 1.55, -1.4]}>
              <planeGeometry args={[0.92, 0.46]} />
              <meshStandardMaterial map={lbl} />
            </mesh>
            {/* Lobby Sofa or Plant */}
            {k % 2 === 0 ? (
              <group position={[-2.95, 0.12, -0.82]} scale={0.5}>
                <Sofa p={[0, 0, 0]} color="#4e6478" />
              </group>
            ) : (
              <Plant p={[-3.05, 0.12, -0.85]} s={0.68} />
            )}
            {/* Waiting commuter every other floor with natural hair tint */}
            {k >= 2 && k <= 5 ? (
              <Model
                file={k % 2 === 0 ? "woman_a.glb" : "man_a.glb"}
                anims={LIB2}
                clip="Idle_TalkingPhone_Loop"
                t={t + k * 0.7}
                p={[-2.05, 0.12, 0.22]}
                ry={1.25}
                scale={0.78}
                outfit={person}
                tint={{ Hair: hairCols[k % hairCols.length] }}
              />
            ) : null}

            {/* Right stairwell compact inside 9:16 frame (x = +1.6..+3.1) + brushed-steel handrail & balusters */}
            <RB p={[2.45, 0, -0.2]} s={[1.65, 0.18, 2.5]} r={0.02} color="#9aa4b0" />
            {Array.from({ length: 6 }, (_, st) => (
              <RB
                key={st}
                p={[1.82 + st * 0.22, 0.18 + st * 0.38, -0.25]}
                s={[0.24, 0.36, 1.45]}
                r={0.01}
                color="#c7cfd6"
                rough={0.75}
              />
            ))}
            {[0, 1, 2].map((bi) => (
              <Cyl key={`hb_${bi}`} p={[1.88 + bi * 0.52, 0.62 + bi * 0.86, 0.45]} r={0.02} h={0.72} color="#cfd8e3" metal={0.85} />
            ))}
            <Cyl p={[2.4, 1.82, 0.45]} rot={[0, 0, -0.544]} r={0.028} h={2.02} color="#e2ebf2" metal={0.88} />
          </group>
        );
      })}

      {/* Exhausted stair climber feet planted cleanly on top tread of Step 2 (y = 1.12) on Floor 118 + bobbing sweat drop */}
      <Model
        file="man_c.glb"
        anims={LIB1}
        clip="Walk_Loop"
        t={t * 0.55}
        p={[2.24, -3.8 + 3 * floorHeight + 1.12, -0.22]}
        ry={Math.PI / 2}
        scale={0.78}
        outfit={{ top: "#d44238", pants: "#282e38", shoes: "#111", loose: "male" }}
        tint={{ Hair: "#241c16" }}
      />
      <group position={[2.46, -3.8 + 3 * floorHeight + 2.38 - ((t * 1.4) % 1) * 0.22, 0.08]}>
        <mesh>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshStandardMaterial color="#6ce6ff" emissive="#36caff" emissiveIntensity={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <coneGeometry args={[0.032, 0.06, 8]} />
          <meshStandardMaterial color="#6ce6ff" emissive="#36caff" emissiveIntensity={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Steel T-guide rails & counterweight shaft bay */}
      {[-1.2, 1.0, 1.52].map((rx, idx) => (
        <mesh key={idx} position={[rx, 4.5, -0.2]}>
          <boxGeometry args={[0.08, 23.5, 0.16]} />
          <meshStandardMaterial color="#36c7da" emissive="#1c8ea0" emissiveIntensity={0.42} metalness={0.75} roughness={0.28} />
        </mesh>
      ))}

      {/* Descending Orange Counterweight in right bay */}
      <group position={[1.26, 7.6 - travel * 0.9, -0.2]}>
        {Array.from({ length: 6 }, (_, i) => (
          <RB key={i} p={[0, i * 0.36, 0]} s={[0.38, 0.32, 0.88]} r={0.02} color="#ff8a1f" emissive="#ff6200" ei={0.25} />
        ))}
      </group>

      {/* Hoist cables + motion dots starting STRICTLY ABOVE cab roof crosshead (zero cable inside cabins!) */}
      {[-0.42, 0.24].map((cx, i) => {
        const topY = 20.5;
        const len = Math.max(0.2, topY - cabRoofY);
        const midY = (cabRoofY + topY) / 2;
        return (
          <group key={i}>
            <Cyl p={[cx, midY, -0.15]} r={0.03} h={len} color="#ffd23f" emissive="#ffb020" ei={0.55} />
            {Array.from({ length: 12 }, (_, d) => {
              const dy = cabRoofY + 0.35 + d * 1.15;
              if (dy > topY) return null;
              return (
                <mesh key={d} position={[cx, dy, -0.15]}>
                  <sphereGeometry args={[0.06, 8, 8]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* DOUBLE-DECK GLASS & BRUSHED GOLD EXPRESS ELEVATOR CABS (Upper + Lower decks moving as ONE!) */}
      <group position={[-0.1, cabY, -0.15]}>
        {/* Outer joined structural steel car sling columns (open front so passengers read crystal clear) */}
        {[-1.02, 1.02].map((sx) =>
          [-0.84, 0.84].map((sz) => (
            <RB key={`${sx}${sz}`} p={[sx, 2.6, sz]} s={[0.075, 5.42, 0.075]} r={0.015} color="#283546" metal={0.78} />
          )),
        )}
        <RB p={[0, 5.32, 0]} s={[2.12, 0.14, 1.76]} r={0.02} color="#283546" metal={0.78} />
        <RB p={[0, -0.04, 0]} s={[2.12, 0.14, 1.76]} r={0.02} color="#283546" metal={0.78} />
        {[0, floorHeight].map((dy, deckIdx) => (
          <group key={deckIdx} position={[0, dy, 0]}>
            <RB p={[0, 0.06, 0]} s={[1.98, 0.12, 1.66]} r={0.02} color="#d6b35f" metal={0.78} />
            <RB p={[0, 2.38, 0]} s={[1.98, 0.14, 1.66]} r={0.02} color="#283546" metal={0.75} />
            <RB p={[0, 1.22, -0.8]} s={[1.92, 2.22, 0.08]} r={0.01} color="#a47c3e" metal={0.65} rough={0.3} />
            <RB p={[0, 0.92, -0.72]} s={[1.7, 0.045, 0.05]} r={0.01} color="#f5d47a" metal={0.9} />
            {[-0.96, 0.96].map((sx, sIdx) => (
              <mesh key={sIdx} position={[sx, 1.22, 0]}>
                <boxGeometry args={[0.04, 2.18, 1.6]} />
                <meshStandardMaterial color="#b4e8ff" transparent opacity={0.25} roughness={0.08} metalness={0.2} />
              </mesh>
            ))}
            <Cyl p={[0, 2.28, 0]} r={0.26} h={0.04} color="#fff8e0" emissive="#ffe29a" ei={1.8} />
            <pointLight position={[0, 1.9, 0.2]} intensity={6.5} distance={4.5} color="#ffe3b0" />
            <RB p={[0, 2.38, 0.86]} s={[1.82, 0.22, 0.06]} r={0.02} color={deckIdx === 1 ? "#ffd23f" : "#3be0ff"} emissive={deckIdx === 1 ? "#ffb020" : "#1ec2e8"} ei={1.1} />
          </group>
        ))}

        {/* 4 Rigged 3D Commuters inside BOTH upper & lower cabs simultaneously (with natural hair tints!) */}
        <Model file="man_a.glb" anims={LIB2} clip="Idle_TalkingPhone_Loop" t={t} p={[-0.44, 0.12, 0]} ry={0.35} scale={0.76} outfit={COMMUTERS[0]} tint={{ Hair: "#241c16" }} />
        <Model file="woman_a.glb" anims={LIB1} clip="Idle_Loop" t={t + 0.5} p={[0.42, 0.12, -0.08]} ry={-0.3} scale={0.76} outfit={COMMUTERS[1]} tint={{ Hair: "#5a3922" }} />
        <Model file="man_d.glb" anims={LIB2} clip="Idle_FoldArms_Loop" t={t + 0.2} p={[-0.42, floorHeight + 0.12, -0.05]} ry={0.25} scale={0.76} outfit={COMMUTERS[3]} tint={{ Hair: "#181818" }} />
        <Model file="woman_b.glb" anims={LIB1} clip="Idle_Talking_Loop" t={t + 0.8} p={[0.42, floorHeight + 0.12, 0.05]} ry={-0.35} scale={0.76} outfit={COMMUTERS[2]} tint={{ Hair: "#784c28" }} />
      </group>
    </group>
  );
};

// ───────────────────────── 8. High-Altitude Curved Glass Facade + BMU Crane + Sisyphus Gondola Washers ─────────────────────────
export const FacadeWashScene: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  t?: number;
  buildK?: number;
  washProgress?: number;
  dustReturn?: number;
}> = ({ p = [0, 0, 0], ry = 0, scale = 1, t = 0, buildK = 1, washProgress = 0.5, dustReturn = 0 }) => {
  const grime = useMemo(() => sandGrimeTex(), []);
  const skyRefl = useMemo(() => burjSkyReflectionTex(), []);
  const cols = 7;
  const rows = 6;
  const paneW = 0.68;
  const paneH = 0.72;
  const baseLeft = -((cols - 1) * paneW) / 2;
  const baseTop = 2.15;

  // Slice one continuous Dubai sky-and-cloud reflection across all 42 glass panes
  const paneGeos = useMemo(() => {
    const out: THREE.PlaneGeometry[] = [];
    for (let r = 0; r < rows; r++) {
      for (let cIdx = 0; cIdx < cols; cIdx++) {
        const g = new THREE.PlaneGeometry(paneW - 0.09, paneH - 0.09);
        const ua = g.attributes.uv as THREE.BufferAttribute;
        for (let i = 0; i < ua.count; i++) {
          ua.setXY(i, (cIdx + ua.getX(i)) / cols, (rows - 1 - r + ua.getY(i)) / rows);
        }
        ua.needsUpdate = true;
        out.push(g);
      }
    }
    return out;
  }, []);

  const cradleY = 2.05 - washProgress * 3.45;
  const sandCloudO = dustReturn > 0.05 ? Math.sin(dustReturn * Math.PI) * 0.65 : 0;

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Curved / stepped architectural Burj Y-wing facade wall */}
      <RB p={[0, 0.2, -0.22]} s={[5.4, 5.2, 0.36]} r={0.04} color="#283645" metal={0.65} rough={0.35} />
      {/* Vertical stainless-steel tubular Burj outer wing fins + center 3-bay mullions */}
      {[-2.62, 2.62].map((fx, i) => (
        <Cyl key={i} p={[fx, 0.2, 0.12]} r={0.14} h={5.3} seg={16} color="#dce6ef" metal={0.92} rough={0.18} />
      ))}
      {[baseLeft + 1.5 * paneW, baseLeft + 4.5 * paneW].map((mx, i) => (
        <Cyl key={`bm_${i}`} p={[mx, 0.35, 0.08]} r={0.055} h={4.6} seg={12} color="#eef4fa" metal={0.92} rough={0.16} />
      ))}

      {/* 42 Individual reflective glass panels with continuous sky-reflection UVs & stepped 3-bay depth */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, cIdx) => {
          const paneIdx = r * cols + cIdx;
          const threshold = paneIdx / (rows * cols);
          const snapIn = THREE.MathUtils.clamp((buildK - threshold * 0.75) * 4, 0, 1);
          if (snapIn <= 0.02) return null;
          const px = baseLeft + cIdx * paneW;
          const py = baseTop - r * paneH;
          const bayZ = cIdx >= 2 && cIdx <= 4 ? 0.07 : 0;
          const offsetZ = (1 - snapIn) * 1.4;

          // Cleaned behind cradle descent, then top 3 rows get coated again during dustReturn!
          const cleaned = THREE.MathUtils.clamp((py - (cradleY + 0.1)) / 0.45, 0, 1);
          const reDirty = r < 3 ? dustReturn * (0.95 - r * 0.15) : 0;
          const dustAlpha = Math.max(0, 1 - cleaned + reDirty);

          return (
            <group key={`${r}_${cIdx}`} position={[px, py, 0.04 + bayZ + offsetZ]}>
              {/* Aluminum mullion perimeter frame */}
              <RB p={[0, 0, -0.02]} s={[paneW - 0.04, paneH - 0.04, 0.05]} r={0.008} color="#aebbc8" metal={0.85} />
              {/* Reflective blue-teal glass pane with unified continuous sky reflection */}
              <mesh position={[0, 0, 0.015]} geometry={paneGeos[paneIdx]}>
                <meshStandardMaterial
                  map={skyRefl}
                  color={dustAlpha < 0.3 ? "#ffffff" : "#90b0c8"}
                  metalness={0.58}
                  roughness={0.12}
                  emissive="#1a5c80"
                  emissiveIntensity={dustAlpha < 0.3 ? 0.4 : 0.08}
                />
              </mesh>
              {/* Layered desert sand grime (keyed cleanly when visible so transparent never flips unexpectedly) */}
              {dustAlpha > 0.04 ? (
                <mesh position={[0, 0, 0.028]}>
                  <planeGeometry args={[paneW - 0.09, paneH - 0.09]} />
                  <meshStandardMaterial map={grime} transparent opacity={Math.min(0.95, dustAlpha)} roughness={0.95} />
                </mesh>
              ) : null}
            </group>
          );
        }),
      )}

      {/* Roof mechanical terrace & Detailed Rail-Mounted Telescoping BMU Crane */}
      <RB p={[0, 2.86, 0.08]} s={[5.5, 0.24, 1.3]} r={0.03} color="#8a96a3" rough={0.5} />
      {/* Twin steel rooftop I-beam travel rails */}
      {[0.18, 0.52].map((rz) => (
        <RB key={rz} p={[0, 3.01, rz]} s={[4.8, 0.09, 0.08]} r={0.01} color="#34404e" metal={0.82} />
      ))}
      <group position={[0, 3.08, 0.35]}>
        {/* 4-wheel steel bogie carriage + hazard bumpers */}
        <RB p={[0, 0.08, 0]} s={[1.55, 0.14, 0.52]} r={0.02} color="#283546" metal={0.75} />
        {[-0.58, 0.58].map((wx) =>
          [-0.18, 0.18].map((wz) => (
            <Cyl key={`${wx}${wz}`} p={[wx, 0.02, wz]} rot={[Math.PI / 2, 0, 0]} r={0.075} h={0.06} color="#cfd8e3" metal={0.85} />
          )),
        )}
        {[-0.8, 0.8].map((hx) => (
          <mesh key={hx} position={[hx, 0.09, 0]} castShadow>
            <boxGeometry args={[0.08, 0.16, 0.56]} />
            <meshStandardMaterial map={hazardChevronTex()} roughness={0.45} />
          </mesh>
        ))}
        {/* Slewing ring + Beveled yellow rotary turret cab + cooling louvers + flashing beacon */}
        <Cyl p={[0, 0.22, 0]} r={0.38} h={0.14} color="#3a4552" metal={0.75} />
        <RB p={[0, 0.52, -0.04]} s={[0.82, 0.46, 0.72]} r={0.05} color="#f5b82e" rough={0.36} />
        {[-0.22, -0.06, 0.1].map((lx) => (
          <RB key={lx} p={[lx, 0.52, 0.33]} s={[0.08, 0.26, 0.02]} r={0.005} color="#202832" />
        ))}
        <Cyl p={[0.25, 0.8, -0.1]} r={0.055} h={0.1} color="#ffaa18" emissive="#ff9500" ei={1.2 + Math.sin(t * 7) * 0.7} />
        <Glow position={[0.25, 0.88, -0.1]} size={0.45} color="#ffaa2b" opacity={0.45 + 0.35 * Math.sin(t * 7)} />
        {/* Angled hydraulic luffing cylinder piston */}
        <group position={[0, 0.44, 0.3]} rotation={[0.82, 0, 0]}>
          <Cyl p={[0, -0.18, 0]} r={0.055} h={0.42} color="#e5a21d" metal={0.5} />
          <Cyl p={[0, 0.2, 0]} r={0.032} h={0.38} color="#e2ebf2" metal={0.92} />
        </group>
        {/* Twin-chord telescoping jib arm + spreader beam + grooved cable drums */}
        <RB p={[-0.22, 0.64, 0.32]} rot={[0.16, 0, 0]} s={[0.14, 0.16, 0.92]} r={0.02} color="#e5a01d" />
        <RB p={[0.22, 0.64, 0.32]} rot={[0.16, 0, 0]} s={[0.14, 0.16, 0.92]} r={0.02} color="#e5a01d" />
        <RB p={[0, 0.56, 0.7]} s={[2.55, 0.14, 0.22]} r={0.02} color="#283546" metal={0.75} />
        {[-1.12, 1.12].map((cx, idx) => (
          <Cyl key={`dr_${idx}`} p={[cx, 0.56, 0.68]} rot={[0, 0, Math.PI / 2]} r={0.1} h={0.18} color="#cfd8e3" metal={0.85} />
        ))}
        {/* Twin steel hoist wire cables down to gondola tie-ins */}
        {[-1.12, 1.12].map((cx, idx) => {
          const topY = 0.56;
          const botY = cradleY + 0.62 - 3.08;
          const midY = (topY + botY) / 2;
          const len = Math.max(0.2, topY - botY);
          return <Cyl key={idx} p={[cx, midY, 0.7]} r={0.022} h={len} color="#d8e2ec" metal={0.9} />;
        })}
      </group>

      {/* Steel-mesh window washing gondola cradle + frothy soap strip + droplets + 2 rigged workers */}
      <group position={[0, cradleY, 1.05]}>
        <RB p={[0, 0, 0]} s={[2.55, 0.14, 0.85]} r={0.02} color="#cfd7df" metal={0.65} />
        {/* Yellow tubular perimeter safety rail */}
        <RB p={[0, 0.62, 0.4]} s={[2.58, 0.05, 0.05]} r={0.01} color="#f5b82e" />
        <RB p={[0, 0.62, -0.4]} s={[2.58, 0.05, 0.05]} r={0.01} color="#f5b82e" />
        {[-1.24, 0, 1.24].map((px, k) => (
          <group key={k}>
            <Cyl p={[px, 0.31, 0.4]} r={0.025} h={0.62} color="#f5b82e" />
            <Cyl p={[px, 0.31, -0.4]} r={0.025} h={0.62} color="#f5b82e" />
          </group>
        ))}
        {/* Blue soapy water buckets */}
        <Cyl p={[0, 0.18, 0.15]} r={0.14} r2={0.17} h={0.28} color="#2494d4" />
        {/* Frothy soap wipe strip right across the glass + foam puffs + falling glistening water droplets */}
        <RB p={[0, 0.72, -0.82]} s={[2.45, 0.09, 0.03]} r={0.01} color="#ffffff" emissive="#d8f4ff" ei={0.6} />
        {[-0.75, 0, 0.75].map((fx, k) => (
          <Glow key={k} position={[fx + Math.sin(t * 5 + k) * 0.15, 0.72, -0.78]} size={0.55} color="#ffffff" opacity={0.55} />
        ))}
        {Array.from({ length: 10 }, (_, di) => {
          const dropPhase = (t * 2.2 + di * 0.17) % 1;
          return (
            <mesh key={`wd_${di}`} position={[-1.05 + di * 0.23, 0.68 - dropPhase * 0.95, -0.76]}>
              <sphereGeometry args={[0.026, 6, 6]} />
              <meshStandardMaterial color="#b4f0ff" emissive="#6ee4ff" emissiveIntensity={0.8} roughness={0.1} />
            </mesh>
          );
        })}

        {/* Two rigged window washers in crisp 3/4 stance wearing hard hats + holding T-squeegees */}
        <Model
          file="man_b.glb"
          anims={LIB1}
          clip="Interact"
          t={t}
          p={[-0.62, 0.08, 0.02]}
          ry={Math.PI - 0.52}
          scale={0.78}
          outfit={WORKER_A}
          tint={{ Hair: "#201a16" }}
          attach={[
            { bone: "Head", node: <HardHat color="#ffd23f" /> },
            { bone: "hand_r", node: <Squeegee /> },
          ]}
        />
        <Model
          file="man_d.glb"
          anims={dustReturn > 0.15 ? LIB2 : LIB1}
          clip={dustReturn > 0.15 ? "Idle_No_Loop" : "Interact"}
          t={t + 0.6}
          p={[0.62, 0.08, 0.02]}
          ry={Math.PI + 0.52}
          scale={0.78}
          outfit={WORKER_B}
          tint={{ Hair: "#161616" }}
          attach={[
            { bone: "Head", node: <HardHat color="#ffffff" /> },
            { bone: "hand_r", node: <Squeegee /> },
          ]}
        />
      </group>

      {/* Golden desert sandstorm dust clouds sweeping across upper glass panels */}
      {sandCloudO > 0.04
        ? [
            [-1.3, 1.55, 0.55],
            [-0.2, 1.85, 0.62],
            [1.1, 1.45, 0.52],
          ].map(([cx, cy, cz], i) => (
            <Glow
              key={i}
              position={[cx + dustReturn * 0.9, cy, cz]}
              size={2.8}
              color="#eab062"
              opacity={sandCloudO}
            />
          ))
        : null}
    </group>
  );
};
