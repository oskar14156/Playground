import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow, V3 } from "../../lib/three/core";
import { Env, KeyLight, Post, RB } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";
import { Bunk, SteelToilet, CellShelf } from "./props";
import { Spot } from "./spot";

/**
 * Fox River, built in one "cell-local" frame so every interior shot shares it:
 *   hero cell (Michael's) at the origin, bars at z = +1.5, back wall z = −1.5…−1.8, cell x = −1…+1, tier height 2.8 m.
 *   Side A cells: x = (i − 7) · 2 m, i = 0…13 (x −14…12), 4 tiers. The hall runs along x; its centre line is z = 6.
 *   Side B cells face back: bars at z = 10.5, interior z 10.5…13.5. Pipe chase behind side A: z −3.3…−1.8.
 * Real-world sizes in metres (US cell ≈ 2 × 3 m; tier ≈ 2.8 m).
 */
export const W = 2; // cell width
export const D = 3; // cell depth
export const H = 2.8; // tier height
export const TIERS = 4;
export const CELLS = 14;
export const HALL_Z = 6;
export const cellX = (i: number) => (i - 7) * W;

// ───────────────────────── canvas textures ─────────────────────────
const texCache = new Map<string, THREE.CanvasTexture>();
const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat: [number, number] = [1, 1], srgb = true) => {
  const k = `${key}|${repeat}`;
  if (texCache.has(k)) return texCache.get(k)!;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  texCache.set(k, t);
  return t;
};

/** Painted concrete-block wall (40 × 20 cm blocks), two-tone like an old state prison: dark lower band, pale upper,
 * grime streaks and chipped paint. One texture tile = 2 m wide × 2.8 m tall (one cell wall). */
export const blockWall = (upper: string, lower: string, seed = 1, repeat: [number, number] = [1, 1]) =>
  canvasTex(`block|${upper}|${lower}|${seed}`, 512, 716, (g) => {
    const r = seeded(seed * 31 + 7);
    const band = 716 * (1 - 1.15 / 2.8);
    g.fillStyle = upper;
    g.fillRect(0, 0, 512, band);
    g.fillStyle = lower;
    g.fillRect(0, band, 512, 716 - band);
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(0, band - 3, 512, 6);
    // block courses: 20 cm = 51 px, 40 cm = 102 px
    for (let y = 0; y < 716; y += 51) {
      const off = (Math.round(y / 51) % 2) * 51;
      g.fillStyle = "rgba(0,0,0,0.16)";
      g.fillRect(0, y, 512, 3);
      for (let x = -off; x < 512; x += 102) g.fillRect(x, y, 3, 51);
      for (let x = -off; x < 512; x += 102) {
        g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.03 * r()})`;
        g.fillRect(x + 3, y + 3, 99, 48);
      }
    }
    for (let i = 0; i < 16000; i++) {
      g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${0.06 * r()})`;
      g.fillRect(r() * 512, r() * 716, 2, 2);
    }
    // grime streaks running down from the top, scuffs at the bottom
    for (let i = 0; i < 26; i++) {
      const x = r() * 512;
      const grd = g.createLinearGradient(0, 0, 0, 200 + r() * 400);
      grd.addColorStop(0, `rgba(40,30,20,${0.12 + 0.12 * r()})`);
      grd.addColorStop(1, "rgba(40,30,20,0)");
      g.fillStyle = grd;
      g.fillRect(x, 0, 3 + r() * 10, 600);
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(20,16,12,${0.1 + 0.2 * r()})`;
      g.fillRect(r() * 512, 650 + r() * 60, 10 + r() * 50, 2 + r() * 4);
    }
    // paint chips showing grey concrete
    for (let i = 0; i < 34; i++) {
      g.fillStyle = `rgba(150,150,145,${0.5 + 0.4 * r()})`;
      g.beginPath();
      g.ellipse(r() * 512, r() * 716, 2 + r() * 6, 1 + r() * 4, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  }, repeat);

/** Chain-link mesh (alpha in the texture). One tile = 1 m. */
export const chainLink = (repeat: [number, number]) =>
  canvasTex("chain", 256, 256, (g) => {
    g.clearRect(0, 0, 256, 256);
    g.strokeStyle = "#d8dde2";
    g.lineWidth = 5;
    const s = 32;
    for (let k = -8; k < 16; k++) {
      g.beginPath();
      g.moveTo(k * s, 0);
      g.lineTo(k * s + 256, 256);
      g.stroke();
      g.beginPath();
      g.moveTo(k * s + 256, 0);
      g.lineTo(k * s, 256);
      g.stroke();
    }
  }, repeat);

/** Steel bar grating (catwalk floors), alpha. One tile = 0.5 m. */
export const grating = (repeat: [number, number]) =>
  canvasTex("grate", 128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = "#ffffff";
    for (let x = 0; x < 128; x += 16) g.fillRect(x, 0, 5, 128);
    for (let y = 0; y < 128; y += 42) g.fillRect(0, y, 128, 4);
  }, repeat);

/** Cut limestone ashlar for the outer wall (Joliet is limestone). One tile = 4 m × 4 m. */
export const ashlar = (repeat: [number, number]) =>
  canvasTex("ashlar", 1024, 1024, (g) => {
    const r = seeded(77);
    g.fillStyle = "#8e8676";
    g.fillRect(0, 0, 1024, 1024);
    const rowH = 1024 / 7;
    for (let y = 0; y < 7; y++) {
      let x = -r() * 200;
      while (x < 1024) {
        const w = 180 + r() * 220;
        const v = 0.78 + r() * 0.32;
        g.fillStyle = `rgb(${Math.round(176 * v)},${Math.round(166 * v)},${Math.round(144 * v)})`;
        g.fillRect(x + 4, y * rowH + 4, w - 8, rowH - 8);
        for (let k = 0; k < 220; k++) {
          g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,240"},${0.08 * r()})`;
          g.fillRect(x + 4 + r() * (w - 8), y * rowH + 4 + r() * (rowH - 8), 3 + r() * 8, 2 + r() * 5);
        }
        x += w;
      }
    }
    for (let i = 0; i < 60; i++) {
      const x = r() * 1024;
      const grd = g.createLinearGradient(0, 0, 0, 1024);
      grd.addColorStop(0, `rgba(30,28,22,${0.25 * r()})`);
      grd.addColorStop(1, "rgba(30,28,22,0)");
      g.fillStyle = grd;
      g.fillRect(x, 0, 4 + r() * 14, 1024);
    }
  }, repeat);

/** Stencilled text on a transparent background (cell numbers, "TIER B", "AUTHORIZED PERSONNEL"). */
export const stencil = (text: string, color = "#f1e9d0", w = 512, h = 128, size = 86) =>
  canvasTex(`stencil|${text}|${color}|${w}|${h}`, w, h, (g) => {
    g.clearRect(0, 0, w, h);
    g.font = `900 ${size}px "Arial Black", Impact, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2 + 4);
    // worn stencil: erase random flecks
    const r = seeded(text.length * 13 + 3);
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 260; i++) g.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 3);
    g.globalCompositeOperation = "source-over";
  });

/** Printed sign: coloured header bar + body lines. */
export const signTex = (head: string, lines: string[], headBg = "#c0202a", bg = "#f4f1e6", w = 512, h = 340) =>
  canvasTex(`sign|${head}|${lines.join("/")}|${headBg}`, w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = headBg;
    g.fillRect(0, 0, w, h * 0.3);
    g.fillStyle = "#ffffff";
    g.font = `900 ${Math.round(h * 0.17)}px Arial`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(head, w / 2, h * 0.155);
    g.fillStyle = "#1a1a1a";
    g.font = `700 ${Math.round(h * 0.1)}px Arial`;
    lines.forEach((l, i) => g.fillText(l, w / 2, h * (0.45 + i * 0.15)));
    g.strokeStyle = "#1a1a1a";
    g.lineWidth = 8;
    g.strokeRect(4, 4, w - 8, h - 8);
  });

// ───────────────────────── instancing ─────────────────────────
export type Xf = { p: V3; s?: V3; r?: V3; c?: string };
/** Many copies of one mesh in one draw call (bars, rails, bolts, bricks). Pass memoised `xf`. */
export const Inst: React.FC<{ geo: THREE.BufferGeometry; xf: Xf[]; mat: THREE.Material; cast?: boolean }> = ({ geo, xf, mat, cast = true }) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, xf.length));
    const o = new THREE.Object3D();
    xf.forEach((x, i) => {
      o.position.set(...x.p);
      o.rotation.set(...(x.r ?? [0, 0, 0]));
      o.scale.set(...(x.s ?? [1, 1, 1]));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      if (x.c) m.setColorAt(i, new THREE.Color(x.c));
    });
    m.count = xf.length;
    m.castShadow = cast;
    m.receiveShadow = true;
    m.frustumCulled = false;
    return m;
  }, [geo, xf, mat, cast]);
  return <primitive object={mesh} />;
};

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 12);
const CYL_HI = new THREE.CylinderGeometry(1, 1, 1, 24);
export const geo = { box: BOX, cyl: CYL, cylHi: CYL_HI };
const useStd = (color: string, rough = 0.6, metal = 0, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra }), [color, rough, metal]); // eslint-disable-line react-hooks/exhaustive-deps
export const useMat = useStd;

// ───────────────────────── canvas + light moods ─────────────────────────
export type Mood = "cellhouse" | "chase" | "night" | "room" | "warm" | "dark";
/** One ThreeCanvas per shot. Moods: `cellhouse` = sodium lamps + cold window light, `chase` = a few caged bulbs,
 * `night` = moon + floodlights outside, `room` = fluorescent, `warm` = tungsten (bank, tattoo studio), `dark` = blank. */
export const PrisonCanvas: React.FC<{ cam: Cam; children: React.ReactNode; mood?: Mood; bg?: string; fog?: [string, number, number]; ao?: number; bloom?: number; env?: number }> = ({
  cam,
  children,
  mood = "cellhouse",
  bg = "#06070b",
  fog,
  ao = 1.0,
  bloom = 0.8,
  env,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.02, far: 1500 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      {fog ? <fog attach="fog" args={fog} /> : null}
      {mood === "cellhouse" ? (
        <>
          <hemisphereLight args={["#8a93b8", "#2a2018", 0.5]} />
          <KeyLight p={[4, 14, 9]} target={[0, 2, 4]} intensity={1.5} color="#ffc98a" size={16} />
        </>
      ) : mood === "chase" ? (
        <>
          <hemisphereLight args={["#6a7080", "#1a140e", 0.45]} />
          <KeyLight p={[2, 6, 3]} target={[0, 1, -2.5]} intensity={0.75} color="#ffd9a0" size={6} />
        </>
      ) : mood === "night" ? (
        <>
          <hemisphereLight args={["#5a6a9a", "#181e18", 0.6]} />
          <KeyLight p={[-30, 40, 30]} target={[0, 0, 0]} intensity={1.2} color="#a8bcff" size={60} />
        </>
      ) : mood === "room" ? (
        <>
          <hemisphereLight args={["#e8f0ff", "#4a4640", 0.75]} />
          <KeyLight p={[1.5, 4, 3]} target={[0, 1, 0]} intensity={1.6} color="#f4f8ff" size={6} />
        </>
      ) : mood === "warm" ? (
        <>
          <hemisphereLight args={["#ffe9cc", "#3a2c20", 0.7]} />
          <KeyLight p={[2, 4.5, 3]} target={[0, 1, 0]} intensity={1.8} color="#ffdcae" size={7} />
        </>
      ) : null}
      {children}
      <Env intensity={env ?? (mood === "night" ? 0.05 : mood === "chase" ? 0.04 : mood === "dark" ? 0.06 : 0.14)} />
      <Post bloom={bloom} ao={ao} vignette={0.45} />
    </ThreeCanvas>
  );
};

// ───────────────────────── the cell house ─────────────────────────
const backTex = (nx: number, ny: number) => blockWall("#c9c3a8", "#5d7062", 3, [nx, ny]);
/** Bars of one cell front (local: x −1…1, y 0…H, plane z = 0): 17 round bars + 3 flat cross bars + frame. */
const barsOf = (x0: number, y0: number, z: number, out: Xf[], flats: Xf[]) => {
  for (let k = 0; k < 17; k++) out.push({ p: [x0 - 0.88 + k * 0.11, y0 + 1.25, z], s: [0.016, 2.5, 0.016] });
  for (const y of [0.12, 1.1, 2.42]) flats.push({ p: [x0, y0 + y, z], s: [1.82, 0.06, 0.035] });
  flats.push({ p: [x0 - 0.92, y0 + 1.25, z], s: [0.06, 2.5, 0.06] }, { p: [x0 + 0.92, y0 + 1.25, z], s: [0.06, 2.5, 0.06] });
};

/**
 * Four tiers of cells on two sides of a long hall, catwalks with railings and chain-link safety screens, stairs at the
 * ends, steel roof trusses, sodium lamps, tall barred windows. `hero` = skip that side-A cell (drawn by <HeroCell/>).
 * `lit` = 0…1 for the cell lights (lights-out at night = 0.2).
 */
export const CellHouse: React.FC<{ hero?: [number, number] | null; lit?: number; t?: number; sideB?: boolean }> = ({ hero = [7, 0], lit = 1, sideB = true }) => {
  const floor = usePbr("concrete_floor_02", [10, 5]);
  const brick = usePbr("red_brick_03", [8, 4]);
  const cellPaint = useMemo(() => blockWall("#c9c3a8", "#5d7062", 3), []);
  const steel = useStd("#3c4a52", 0.45, 0.75);
  const barsMat = useStd("#9aa3a6", 0.35, 0.9);
  const rail = useStd("#2f5b6a", 0.5, 0.6);
  const slab = useStd("#8a8578", 0.85, 0);
  const mattress = useStd("#7a8a9c", 0.95, 0);
  const blanket = useStd("#5a6450", 0.95, 0);
  const porcelain = useStd("#b9c0c4", 0.25, 0.85);
  const dark = useStd("#16181c", 0.9, 0);
  const lampMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffd9a0", emissive: "#ffb35c", emissiveIntensity: 1.4 * lit, roughness: 0.5 }), [lit]);
  const screen = useMemo(() => new THREE.MeshStandardMaterial({ map: chainLink([10, 1]), alphaTest: 0.5, side: THREE.DoubleSide, color: "#b8c0c6", metalness: 0.7, roughness: 0.4 }), []);
  const grate = useMemo(() => new THREE.MeshStandardMaterial({ map: grating([2, 60]), alphaTest: 0.5, side: THREE.DoubleSide, color: "#4a5358", metalness: 0.7, roughness: 0.5 }), []);
  const winMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a3a5e", emissive: "#5d7cc0", emissiveIntensity: 0.9, roughness: 0.3 }), []);

  const X = useMemo(() => {
    const bars: Xf[] = [];
    const flats: Xf[] = [];
    const parts: Xf[] = []; // partition walls
    const bunks: Xf[] = [];
    const matt: Xf[] = [];
    const blank: Xf[] = [];
    const toil: Xf[] = [];
    const lamps: Xf[] = [];
    const posts: Xf[] = [];
    const rails: Xf[] = [];
    const slabs: Xf[] = [];
    const r = seeded(9);
    const sides: [number, number][] = sideB ? [[1.5, 1], [10.5, -1]] : [[1.5, 1]]; // [bar plane z, +1 = cell lies at z < bars]
    for (const [zb, dir] of sides) {
      for (let tier = 0; tier < TIERS; tier++) {
        const y0 = tier * H;
        for (let i = 0; i < CELLS; i++) {
          const x = cellX(i);
          const isHero = hero && dir === 1 && i === hero[0] && tier === hero[1];
          parts.push({ p: [x - W / 2, y0 + H / 2, zb - dir * (D / 2)], s: [0.2, H, D] });
          if (isHero) continue;
          barsOf(x, y0, zb, bars, flats);
          // bunk along the left wall, toilet at the back (seen through the bars)
          const zc = zb - dir * D * 0.45;
          bunks.push({ p: [x - 0.55, y0 + 0.42, zc], s: [0.75, 0.06, 2.0] }, { p: [x - 0.55, y0 + 1.5, zc], s: [0.75, 0.06, 2.0] });
          matt.push({ p: [x - 0.55, y0 + 0.5, zc], s: [0.72, 0.1, 1.95] }, { p: [x - 0.55, y0 + 1.58, zc], s: [0.72, 0.1, 1.95] });
          if (r() < 0.7) blank.push({ p: [x - 0.55, y0 + 0.57, zc + 0.2], s: [0.74, 0.05, 1.2], r: [0, (r() - 0.5) * 0.15, 0] });
          toil.push({ p: [x + 0.45, y0 + 0.45, zb - dir * (D - 0.32)], s: [0.5, 0.9, 0.35] });
          if (r() < 0.55) lamps.push({ p: [x, y0 + H - 0.32, zb - dir * D * 0.5], s: [0.5, 0.04, 0.22] });
        }
        // floor slab / catwalk of this tier
        slabs.push({ p: [-1, y0 + H - 0.15, zb - dir * (D / 2) + dir * 0], s: [CELLS * W + 0.4, 0.3, D] });
        if (tier > 0) {
          slabs.push({ p: [-1, y0 - 0.08, zb + dir * 0.6], s: [CELLS * W + 0.4, 0.06, 1.2] });
          for (let k = 0; k <= CELLS * 2; k++) posts.push({ p: [cellX(0) - 1 + k, y0 + 0.55, zb + dir * 1.18], s: [0.025, 1.1, 0.025] });
          for (const yy of [0.55, 1.08]) rails.push({ p: [-1, y0 + yy, zb + dir * 1.18], s: [CELLS * W + 0.4, 0.045, 0.045] });
          rails.push({ p: [-1, y0 + 0.07, zb + dir * 1.19], s: [CELLS * W + 0.4, 0.14, 0.01] });
        }
      }
    }
    return { bars, flats, parts, bunks, matt, blank, toil, lamps, posts, rails, slabs };
  }, [hero, sideB]);

  const len = CELLS * W + 0.4;
  const roofY = TIERS * H + 2.2;
  return (
    <group>
      {/* hall floor + polished strip down the middle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, 0, 6]} receiveShadow>
        <planeGeometry args={[len + 6, 16]} />
        <meshStandardMaterial {...floor} color="#9a958a" roughness={0.55} />
      </mesh>
      {/* cell back walls (painted block, seen through the bars) */}
      {(hero
        ? ([
            [cellX(0) - 1.2, cellX(hero[0]) - 1, 0, H],
            [cellX(hero[0]) + 1, cellX(CELLS - 1) + 1.2, 0, H],
            [cellX(0) - 1.2, cellX(CELLS - 1) + 1.2, H, TIERS * H],
          ] as [number, number, number, number][])
        : ([[cellX(0) - 1.2, cellX(CELLS - 1) + 1.2, 0, TIERS * H]] as [number, number, number, number][])
      ).map(([x0, x1, y0, y1], k) => (
        <mesh key={k} position={[(x0 + x1) / 2, (y0 + y1) / 2, -1.5]} receiveShadow>
          <planeGeometry args={[x1 - x0, y1 - y0]} />
          <meshStandardMaterial map={backTex(Math.round((x1 - x0) / W), Math.round((y1 - y0) / H))} roughness={0.85} />
        </mesh>
      ))}
      {sideB ? (
        <mesh position={[-1, (TIERS * H) / 2, 13.5]} rotation={[0, Math.PI, 0]} receiveShadow>
          <planeGeometry args={[len, TIERS * H]} />
          <meshStandardMaterial map={useMemo(() => blockWall("#c9c3a8", "#5d7062", 5, [CELLS, TIERS]), [])} roughness={0.85} />
        </mesh>
      ) : null}
      <Inst geo={BOX} xf={X.parts} mat={useMemo(() => new THREE.MeshStandardMaterial({ map: cellPaint, roughness: 0.85 }), [cellPaint])} />
      <Inst geo={BOX} xf={X.slabs} mat={slab} />
      <Inst geo={CYL} xf={X.bars} mat={barsMat} />
      <Inst geo={BOX} xf={X.flats} mat={barsMat} />
      <Inst geo={BOX} xf={X.bunks} mat={steel} />
      <Inst geo={BOX} xf={X.matt} mat={mattress} />
      <Inst geo={BOX} xf={X.blank} mat={blanket} />
      <Inst geo={BOX} xf={X.toil} mat={porcelain} />
      <Inst geo={BOX} xf={X.lamps} mat={lampMat} cast={false} />
      <Inst geo={CYL} xf={X.posts} mat={rail} />
      <Inst geo={BOX} xf={X.rails} mat={rail} />
      {/* chain-link safety screens on the upper catwalks (tiers 2–4) */}
      {[1, 2, 3].map((tier) =>
        [[2.69, 1], ...(sideB ? [[9.31, -1]] : [])].map(([z]) => (
          <mesh key={`${tier}-${z}`} position={[-1, tier * H + 1.75, z]} material={screen}>
            <planeGeometry args={[len, 1.3]} />
          </mesh>
        )),
      )}
      {/* catwalk grating at the hero tier's level (seen from below) */}
      <mesh position={[-1, H - 0.05, 2.1]} rotation={[-Math.PI / 2, 0, 0]} material={grate}>
        <planeGeometry args={[len, 1.2]} />
      </mesh>
      {/* tier stencils on the catwalk fascias */}
      {[0, 1, 2, 3].map((tier) => (
        <mesh key={tier} position={[-8, tier * H + 2.4, 1.55]}>
          <planeGeometry args={[1.6, 0.4]} />
          <meshBasicMaterial map={stencil(`GALLERY ${tier + 1}`)} transparent depthWrite={false} toneMapped={false} opacity={0.85} />
        </mesh>
      ))}
      {Array.from({ length: CELLS }, (_, i) => (
        <mesh key={i} position={[cellX(i), 2.62, 1.56]}>
          <planeGeometry args={[0.6, 0.15]} />
          <meshBasicMaterial map={stencil(`A-${(i + 1).toString().padStart(2, "0")}`, "#f1e9d0", 256, 64, 46)} transparent depthWrite={false} opacity={0.85} />
        </mesh>
      ))}
      {/* end walls: brick with tall barred windows */}
      {[-15.2, 13.2].map((x, k) => (
        <group key={x} position={[x, 0, 6]} rotation={[0, k === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <mesh position={[0, roofY / 2, 0]} receiveShadow>
            <planeGeometry args={[16, roofY]} />
            <meshStandardMaterial {...brick} color="#a08a7a" roughness={0.9} />
          </mesh>
          {[-2.4, 0, 2.4].map((wx) => (
            <group key={wx} position={[wx, 6.5, 0.05]}>
              <mesh material={winMat}>
                <planeGeometry args={[1.6, 6]} />
              </mesh>
              {Array.from({ length: 6 }, (_, b) => (
                <mesh key={b} position={[-0.68 + b * 0.27, 0, 0.04]}>
                  <boxGeometry args={[0.04, 6, 0.04]} />
                  <meshStandardMaterial color="#1a1d20" metalness={0.6} roughness={0.5} />
                </mesh>
              ))}
              {Array.from({ length: 8 }, (_, b) => (
                <mesh key={`h${b}`} position={[0, -2.6 + b * 0.75, 0.04]}>
                  <boxGeometry args={[1.6, 0.04, 0.04]} />
                  <meshStandardMaterial color="#1a1d20" metalness={0.6} roughness={0.5} />
                </mesh>
              ))}
              <Glow position={[0, 0, 0.6]} size={5} color="#6d8cd8" opacity={0.25} />
            </group>
          ))}
        </group>
      ))}
      {/* stairs at the far end, up to every tier */}
      {[0, 1, 2].map((tier) => (
        <group key={tier} position={[-13.6, tier * H, 4.0]}>
          {Array.from({ length: 14 }, (_, s) => (
            <RB key={s} p={[0, 0.1 + s * 0.2, 0.9 - s * 0.13]} s={[1.0, 0.04, 0.28]} r={0.01} color="#3a454c" metal={0.6} rough={0.5} cast={false} />
          ))}
          <mesh position={[0.52, 1.45, 0]} rotation={[Math.atan2(2.8, 1.8), 0, 0]}>
            <boxGeometry args={[0.04, 0.08, 3.4]} />
            <meshStandardMaterial color="#2f5b6a" metalness={0.6} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* roof: steel trusses + a skylight strip */}
      <mesh position={[-1, roofY, 6]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[len + 6, 16]} />
        <meshStandardMaterial color="#1a1c20" roughness={1} />
      </mesh>
      <mesh position={[-1, roofY - 0.02, 6]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[len, 1.6]} />
        <meshStandardMaterial color="#1e2a44" emissive="#3d5a9a" emissiveIntensity={0.6} />
      </mesh>
      {Array.from({ length: 8 }, (_, k) => (
        <group key={k} position={[-14 + k * 4, roofY - 0.4, 6]}>
          <mesh>
            <boxGeometry args={[0.18, 0.3, 15]} />
            <primitive object={steel} attach="material" />
          </mesh>
          {/* hanging sodium lamp */}
          <mesh position={[0, -1.6, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 3.0, 6]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0, -3.1, 0]}>
            <cylinderGeometry args={[0.12, 0.38, 0.3, 20, 1, true]} />
            <meshStandardMaterial color="#2c3238" metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -3.22, 0]}>
            <sphereGeometry args={[0.12, 16, 10]} />
            <meshStandardMaterial color="#ffd7a0" emissive="#ffae4a" emissiveIntensity={3} />
          </mesh>
          <Glow position={[0, -3.3, 0]} size={2.4} color="#ffb060" opacity={0.5} />
        </group>
      ))}
      {[-10, -2, 6].map((x) => (
        <pointLight key={x} position={[x, roofY - 3.6, 6]} color="#ffb766" intensity={18} distance={22} decay={2} />
      ))}
      {/* the cell lights glow onto the catwalks */}
      <pointLight position={[0, 2.3, 0.4]} color="#ffd9a6" intensity={1.6 * lit} distance={5} decay={2} />
      {/* shadow catchers so the instanced back walls don't look flat: a dark strip under each slab */}
      {[0, 1, 2, 3].map((tier) => (
        <mesh key={`u${tier}`} position={[-1, tier * H + H - 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[len, D]} />
          <primitive object={dark} attach="material" />
        </mesh>
      ))}
    </group>
  );
};

// ───────────────────────── Michael's cell (hero) ─────────────────────────
/**
 * The hero cell at the origin in full detail: painted block walls, steel combo toilet-sink on the back wall with its
 * 4 tamper-proof screws, bunk bed, shelf (origami swan, tiny fox plush, books), vandal-proof ceiling light, bars + door.
 * `off` 0…1 = the toilet is unscrewed and set aside, revealing the hole into the pipe chase behind.
 * `door` 0…1 = door slid open. `light` = cell light.
 */
export const HeroCell: React.FC<{ off?: number; door?: number; light?: number; t?: number; screws?: number; shelf?: boolean; body?: boolean }> = ({ off = 0, door = 0, light = 1, t = 0, screws = 1, shelf = true, body }) => {
  const floor = usePbr("concrete_floor_02", [1.5, 2]);
  const side = useMemo(() => blockWall("#cfc8ad", "#5d7062", 11, [1.5, 1]), []);
  const back = useMemo(() => blockWall("#cfc8ad", "#5d7062", 12, [1, 1]), []);
  const barsMat = useStd("#9aa3a6", 0.35, 0.9);
  const hole = { x0: 0.15, x1: 0.75, y0: 0.08, y1: 0.86 };
  const backZ = -1.5;
  const bars: Xf[] = useMemo(() => {
    const out: Xf[] = [];
    for (let k = 0; k < 9; k++) out.push({ p: [-0.88 + k * 0.11, 1.25, 1.5], s: [0.017, 2.5, 0.017] });
    return out;
  }, []);
  const doorBars: Xf[] = useMemo(() => {
    const out: Xf[] = [];
    for (let k = 0; k < 8; k++) out.push({ p: [0.11 + k * 0.11, 1.25, 1.53], s: [0.017, 2.5, 0.017] });
    return out;
  }, []);
  return (
    <group>
      {/* floor + ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[1.8, 3]} />
        <meshStandardMaterial {...floor} color="#a49d90" roughness={0.6} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.48, 0]}>
        <planeGeometry args={[1.76, 3]} />
        <meshStandardMaterial map={side} color="#d8d2bc" roughness={0.9} />
      </mesh>
      {/* side walls */}
      {[-0.88, 0.88].map((x, k) => (
        <mesh key={x} position={[x, 1.25, 0]} rotation={[0, k === 0 ? Math.PI / 2 : -Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[3, 2.5]} />
          <meshStandardMaterial map={side} roughness={0.85} />
        </mesh>
      ))}
      {/* back wall with the hole behind the toilet (4 pieces), 30 cm thick */}
      {(
        [
          [-0.9, hole.x0, 0, 2.5],
          [hole.x1, 0.9, 0, 2.5],
          [hole.x0, hole.x1, hole.y1, 2.5],
          [hole.x0, hole.x1, 0, hole.y0],
        ] as [number, number, number, number][]
      ).map(([x0, x1, y0, y1], k) => (
        <group key={k}>
          <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, backZ + 0.02]} receiveShadow>
            <planeGeometry args={[x1 - x0, y1 - y0]} />
            <meshStandardMaterial map={back} roughness={0.85} />
          </mesh>
          <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, backZ - 0.16]}>
            <boxGeometry args={[x1 - x0, y1 - y0, 0.28]} />
            <meshStandardMaterial color="#77736a" roughness={0.95} />
          </mesh>
        </group>
      ))}
      {/* off: lifted off the wall, carried to the door end and set down (clear of the hole and the bunk) */}
      <SteelToilet p={[0.45 + (-0.85) * off, 0.3 * Math.sin(Math.PI * off), backZ + 0.01 + 2.55 * off]} off={off} screws={screws} />
      <Bunk p={[-0.5, 0, -0.25]} body={body} />
      {shelf ? <CellShelf p={[0.9, 1.35, 0.35]} t={t} /> : null}
      {/* vandal-proof ceiling light */}
      <RB p={[0, 2.47, 0]} s={[0.5, 0.06, 0.22]} r={0.02} color="#c8ccd0" metal={0.6} rough={0.4} />
      <mesh position={[0, 2.435, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.42, 0.16]} />
        <meshStandardMaterial color="#fff2da" emissive="#ffe0b0" emissiveIntensity={2.4 * light} />
      </mesh>
      <pointLight position={[0, 2.2, 0.1]} color="#ffe2b8" intensity={3.2 * light} distance={5} decay={2} castShadow={false} />
      {/* bars: fixed half + sliding door */}
      <Inst geo={CYL} xf={bars} mat={barsMat} />
      <group position={[-0.9 * door, 0, 0]}>
        <Inst geo={CYL} xf={doorBars} mat={barsMat} />
        {[0.12, 1.1, 2.42].map((y) => (
          <RB key={y} p={[0.5, y, 1.53]} s={[0.86, 0.06, 0.035]} r={0.005} color="#9aa3a6" metal={0.9} rough={0.35} />
        ))}
        <RB p={[0.9, 1.15, 1.56]} s={[0.12, 0.3, 0.1]} r={0.01} color="#5c666b" metal={0.8} rough={0.4} />
      </group>
      {[0.12, 1.1, 2.42].map((y) => (
        <RB key={y} p={[-0.45, y, 1.5]} s={[0.9, 0.06, 0.035]} r={0.005} color="#9aa3a6" metal={0.9} rough={0.35} />
      ))}
      <RB p={[0, 2.62, 1.55]} s={[2.0, 0.24, 0.16]} r={0.01} color="#4a5559" metal={0.7} rough={0.45} />
    </group>
  );
};

// ───────────────────────── the pipe chase ─────────────────────────
/**
 * The utility corridor behind side A (z −3.3…−1.8): steam and water pipes along the far wall on brackets, vertical
 * risers to every tier, valves, insulated sections, grated walkways per tier with a ladder, caged bulbs.
 * `glowPipe` lights the steam pipe amber (the route). `cut` 0…1 = a hacksaw cut in the steam pipe (Clinton).
 */
export const PipeChase: React.FC<{ route?: number; cut?: number; bulbs?: number }> = ({ route = 0, cut = 0, bulbs = 1 }) => {
  const rust = usePbr("rusty_metal_02", [8, 1]);
  const brick = usePbr("red_brick_03", [10, 4]);
  const wallPaint = useMemo(() => blockWall("#8a8676", "#4a5048", 21, [CELLS, TIERS]), []);
  const grate = useMemo(() => new THREE.MeshStandardMaterial({ map: grating([60, 3]), alphaTest: 0.5, side: THREE.DoubleSide, color: "#5a6064", metalness: 0.7, roughness: 0.5 }), []);
  const brackets: Xf[] = useMemo(() => {
    const out: Xf[] = [];
    for (let tier = 0; tier < TIERS; tier++) for (let x = -14; x <= 12; x += 1.5) out.push({ p: [x, tier * H + 0.95, -3.15], s: [0.05, 1.5, 0.3] });
    return out;
  }, []);
  const risers: Xf[] = useMemo(() => Array.from({ length: CELLS }, (_, i) => ({ p: [cellX(i) + 0.45, (TIERS * H) / 2, -1.95], s: [0.045, TIERS * H, 0.045] })), []);
  const bracketMat = useStd("#33393c", 0.6, 0.7);
  const riserMat = useStd("#6b5a48", 0.55, 0.7);
  const len = CELLS * W + 0.4;
  const pipeY = [0.55, 0.9, 1.3];
  return (
    <group>
      {/* far brick wall + painted backs of the cells */}
      <mesh position={[-1, (TIERS * H) / 2, -3.3]} receiveShadow>
        <planeGeometry args={[len, TIERS * H]} />
        <meshStandardMaterial {...brick} color="#8a6a5a" roughness={0.95} />
      </mesh>
      <mesh position={[-1, (TIERS * H) / 2, -1.8]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[len, TIERS * H]} />
        <meshStandardMaterial map={wallPaint} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1, 0.001, -2.55]} receiveShadow>
        <planeGeometry args={[len, 1.5]} />
        <meshStandardMaterial color="#3a352e" roughness={1} />
      </mesh>
      {/* the main runs along the far wall, per tier */}
      {Array.from({ length: TIERS }, (_, tier) =>
        pipeY.map((y, k) => {
          const isSteam = tier === 0 && k === 0;
          const r = [0.13, 0.08, 0.06][k];
          return (
            <group key={`${tier}-${k}`}>
              <mesh position={[-1, tier * H + y, -3.0 + k * 0.03]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
                <cylinderGeometry args={[r, r, len, 24]} />
                <meshStandardMaterial {...rust} color={isSteam && route > 0 ? new THREE.Color("#ffb35c").lerp(new THREE.Color("#ffffff"), 0.2) : k === 1 ? "#b8b2a2" : "#8a7a66"} emissive={isSteam ? "#ff9a2a" : "#000"} emissiveIntensity={isSteam ? 0.6 * route : 0} roughness={0.7} metalness={0.6} />
              </mesh>
              {/* flanges every 3 m */}
              {Array.from({ length: 9 }, (_, n) => (
                <mesh key={n} position={[-13 + n * 3, tier * H + y, -3.0 + k * 0.03]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[r * 1.35, r * 1.35, 0.05, 24]} />
                  <meshStandardMaterial color="#4a4038" metalness={0.7} roughness={0.5} />
                </mesh>
              ))}
            </group>
          );
        }),
      )}
      {/* insulated (white-wrapped) section and gate valves */}
      <mesh position={[-6, 0.9, -2.97]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 4, 24]} />
        <meshStandardMaterial color="#d8d2c2" roughness={0.95} />
      </mesh>
      {[-9, 3, 8].map((x) => (
        <group key={x} position={[x, 0.55, -2.8]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.3, 12]} />
            <meshStandardMaterial color="#3a3530" metalness={0.7} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.17]}>
            <torusGeometry args={[0.12, 0.015, 8, 24]} />
            <meshStandardMaterial color="#b0302a" metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <Inst geo={BOX} xf={brackets} mat={bracketMat} />
      <Inst geo={CYL} xf={risers} mat={riserMat} />
      {/* steam-pipe cut (Clinton): a dark slot + bright filings */}
      {cut > 0 ? (
        <group position={[-3, 0.55, -2.87]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.134, 0.134, 0.02 + 0.5 * cut, 24, 1, true, -0.9, 1.8]} />
            <meshStandardMaterial color="#0b0b0b" roughness={1} side={THREE.DoubleSide} />
          </mesh>
          <Glow position={[0, 0.05, 0.12]} size={0.12} color="#ffd9a0" opacity={0.25 * cut} />
        </group>
      ) : null}
      {/* grated walkways per tier + a ladder */}
      {[1, 2, 3].map((tier) => (
        <mesh key={tier} position={[-1, tier * H - 0.05, -2.55]} rotation={[-Math.PI / 2, 0, 0]} material={grate}>
          <planeGeometry args={[len, 1.5]} />
        </mesh>
      ))}
      <group position={[-12, 0, -2.2]}>
        {[-0.22, 0.22].map((x) => (
          <mesh key={x} position={[x, H * 1.5, 0]}>
            <boxGeometry args={[0.04, H * 3, 0.06]} />
            <meshStandardMaterial color="#3a454c" metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
        {Array.from({ length: 28 }, (_, k) => (
          <mesh key={k} position={[0, 0.3 + k * 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 0.44, 8]} />
            <meshStandardMaterial color="#3a454c" metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* caged bulbs */}
      {[-10, -4, 2, 8].map((x) => (
        <group key={x} position={[x, 2.5, -3.15]}>
          <mesh>
            <sphereGeometry args={[0.06, 12, 8]} />
            <meshStandardMaterial color="#ffe2b0" emissive="#ffc070" emissiveIntensity={3 * bulbs} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshStandardMaterial color="#202020" wireframe />
          </mesh>
          <Glow position={[0, 0, 0.05]} size={0.8} color="#ffbf70" opacity={0.5 * bulbs} />
          <pointLight color="#ffc983" intensity={5 * bulbs} distance={7} decay={2} />
        </group>
      ))}
    </group>
  );
};

// ───────────────────────── the perimeter (outside, night) ─────────────────────────
/** Concertina razor wire: tilted steel rings along x (one draw call). */
export const RazorWire: React.FC<{ from: number; to: number; y: number; z: number; r?: number }> = ({ from, to, y, z, r = 0.38 }) => {
  const ring = useMemo(() => new THREE.TorusGeometry(1, 0.012, 4, 28), []);
  const mat = useStd("#cfd6dc", 0.25, 1);
  const xf = useMemo(() => {
    const out: Xf[] = [];
    for (let x = from; x < to; x += 0.11) out.push({ p: [x, y, z], s: [r, r, r], r: [0, Math.PI / 2 + 0.55 * Math.sin(x * 9), 0.2] });
    return out;
  }, [from, to, y, z, r]);
  return <Inst geo={ring} xf={xf} mat={mat} cast={false} />;
};

/** Double chain-link fence (3.7 m · 12 ft), razor wire on top, a taut-wire sensor box on every 4th post. */
export const Fence: React.FC<{ z: number; from: number; to: number; h?: number; hot?: number }> = ({ z, from, to, h = 3.7, hot = 0 }) => {
  const mesh = useMemo(() => new THREE.MeshStandardMaterial({ map: chainLink([(to - from) / 0.9, h / 0.9]), alphaTest: 0.45, side: THREE.DoubleSide, color: "#aab3ba", metalness: 0.8, roughness: 0.35 }), [from, to, h]);
  const post = useStd("#7d868c", 0.4, 0.85);
  const posts = useMemo(() => {
    const out: Xf[] = [];
    for (let x = from; x <= to; x += 3) out.push({ p: [x, h / 2, z], s: [0.05, h, 0.05] });
    return out;
  }, [from, to, z, h]);
  const sensors = useMemo(() => posts.filter((_, i) => i % 4 === 0).map((p) => ({ p: [p.p[0], 1.2, z + 0.08] as V3, s: [0.16, 0.24, 0.08] as V3 })), [posts, z]);
  const sensorMat = useStd("#d8d2b8", 0.6, 0.1);
  return (
    <group>
      <mesh position={[(from + to) / 2, h / 2, z]} material={mesh}>
        <planeGeometry args={[to - from, h]} />
      </mesh>
      <Inst geo={CYL} xf={posts} mat={post} />
      <Inst geo={BOX} xf={sensors} mat={sensorMat} />
      <RazorWire from={from} to={to} y={h + 0.3} z={z} />
      {hot > 0 ? <pointLight position={[(from + to) / 2, h / 2, z + 0.5]} color="#7ad8ff" intensity={6 * hot} distance={8} decay={2} /> : null}
    </group>
  );
};

/** Guard tower: concrete shaft, glazed cab with a walkway, roof, searchlight and an armed guard silhouette inside. */
export const Tower: React.FC<{ p: V3; ry?: number; beam?: number; t?: number; h?: number }> = ({ p, ry = 0, beam = 0, h = 11 }) => {
  const conc = usePbr("concrete_floor_02", [1, 3]);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.25, 1.5, h, 8]} />
        <meshStandardMaterial {...conc} color="#b8b2a4" roughness={0.9} />
      </mesh>
      {/* cab */}
      <mesh position={[0, h + 0.15, 0]} castShadow>
        <cylinderGeometry args={[2.1, 2.1, 0.3, 8]} />
        <meshStandardMaterial color="#8c877c" roughness={0.9} />
      </mesh>
      <mesh position={[0, h + 1.35, 0]}>
        <cylinderGeometry args={[1.7, 1.7, 2.1, 8, 1, true]} />
        <meshPhysicalMaterial color="#2a3c50" emissive="#ffcf7a" emissiveIntensity={0.25} roughness={0.08} metalness={0.2} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 8 }, (_, k) => {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        return (
          <mesh key={k} position={[Math.cos(a) * 1.68, h + 1.35, Math.sin(a) * 1.68]}>
            <boxGeometry args={[0.08, 2.1, 0.08]} />
            <meshStandardMaterial color="#222629" metalness={0.6} roughness={0.5} />
          </mesh>
        );
      })}
      {/* walkway railing */}
      <mesh position={[0, h + 1.15, 0]}>
        <torusGeometry args={[2.05, 0.03, 6, 8]} />
        <meshStandardMaterial color="#2f3a40" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* roof */}
      <mesh position={[0, h + 2.75, 0]} castShadow>
        <coneGeometry args={[2.5, 0.9, 8]} />
        <meshStandardMaterial color="#3a3f44" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* warm inside light */}
      <pointLight position={[0, h + 1.4, 0]} color="#ffcf7a" intensity={6} distance={7} decay={2} />
      {/* searchlight on the roof edge */}
      <group position={[1.9, h + 2.4, 0]} rotation={[0, 0, -0.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.22, 0.5, 20]} />
          <meshStandardMaterial color="#2a2f33" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0.26, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.26, 24]} />
          <meshStandardMaterial color="#fffbe8" emissive="#fff4d0" emissiveIntensity={3 * (0.4 + beam)} />
        </mesh>
        {beam > 0 ? (
          <mesh position={[9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[2.6, 18, 32, 1, true]} />
            <meshBasicMaterial color="#fff4d0" transparent opacity={0.07 * beam} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
          </mesh>
        ) : null}
      </group>
    </group>
  );
};

/**
 * The outer wall of Fox River along x (inside = z < 0, outside = z > 0): limestone, 7 m tall (show-scale, not claimed
 * as Joliet's real height), coping, razor wire, towers every 40 m, floodlight poles; outside it the double fence,
 * a gravel no-man's-land, a road and dark woods. `x0…x1` = wall extent.
 */
export const Perimeter: React.FC<{ beam?: number; hot?: number; t?: number; fences?: boolean; woods?: boolean }> = ({ beam = 0, hot = 0, t = 0, fences = true, woods = true }) => {
  const stone = useMemo(() => ashlar([30, 2]), []);
  const grass = usePbr("brown_mud_rocks_01", [40, 20]);
  const asphalt = usePbr("concrete_floor_02", [40, 2]);
  const trees = useMemo(() => {
    const r = seeded(5);
    return Array.from({ length: 90 }, () => ({ x: -70 + r() * 140, z: 30 + r() * 45, s: 0.8 + r() * 0.7 }));
  }, []);
  const trunk = useStd("#2a2018", 0.95, 0);
  const pine = useStd("#14261c", 0.9, 0);
  const pineXf = useMemo(() => trees.flatMap((q) => [0, 1, 2].map((k) => ({ p: [q.x, (2.4 + k * 2.1) * q.s, q.z] as V3, s: [(2.6 - k * 0.7) * q.s, 3.2 * q.s, (2.6 - k * 0.7) * q.s] as V3 }))), [trees]);
  const trunkXf = useMemo(() => trees.map((q) => ({ p: [q.x, 1.2 * q.s, q.z] as V3, s: [0.18 * q.s, 2.4 * q.s, 0.18 * q.s] as V3 })), [trees]);
  const cone = useMemo(() => new THREE.ConeGeometry(1, 1, 9), []);
  return (
    <group>
      {/* ground: yard inside, mud/grass outside, gravel strip, a road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 20]} receiveShadow>
        <planeGeometry args={[200, 120]} />
        <meshStandardMaterial {...grass} color="#4a5a3a" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5.5]} receiveShadow>
        <planeGeometry args={[200, 11]} />
        <meshStandardMaterial color="#7a766c" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 21]} receiveShadow>
        <planeGeometry args={[200, 7]} />
        <meshStandardMaterial {...asphalt} color="#3a3a3c" roughness={0.9} />
      </mesh>
      {Array.from({ length: 20 }, (_, k) => (
        <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[-95 + k * 10, 0.03, 21]}>
          <planeGeometry args={[3, 0.15]} />
          <meshStandardMaterial color="#e8d070" emissive="#3a3010" />
        </mesh>
      ))}
      {/* the wall */}
      <mesh position={[0, 3.5, -0.6]} castShadow receiveShadow>
        <boxGeometry args={[120, 7, 1.2]} />
        <meshStandardMaterial map={stone} roughness={0.92} />
      </mesh>
      <RB p={[0, 7.1, -0.6]} s={[120, 0.3, 1.5]} r={0.05} color="#a49d8a" rough={0.9} />
      <RazorWire from={-60} to={60} y={7.6} z={-0.6} r={0.45} />
      {[-40, 0, 40].map((x) => (
        <Tower key={x} p={[x, 0, -0.6]} beam={beam} t={t} h={11} />
      ))}
      {fences ? (
        <>
          <Fence z={4} from={-60} to={60} />
          <Fence z={10.5} from={-60} to={60} hot={hot} />
        </>
      ) : null}
      {/* floodlight poles */}
      {[-50, -25, 0, 25, 50].map((x) => (
        <group key={x} position={[x + 12, 0, 7.3]}>
          <mesh position={[0, 6, 0]}>
            <cylinderGeometry args={[0.1, 0.16, 12, 10]} />
            <meshStandardMaterial color="#6a7076" metalness={0.7} roughness={0.4} />
          </mesh>
          <RB p={[0, 12.1, -0.2]} s={[1.2, 0.3, 0.4]} r={0.05} color="#3a3f44" metal={0.5} />
          <mesh position={[0, 11.95, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.1, 0.35]} />
            <meshStandardMaterial color="#fff" emissive="#ffe4b0" emissiveIntensity={4} side={THREE.DoubleSide} />
          </mesh>
          <Glow position={[0, 11.8, -0.2]} size={4} color="#ffd9a0" opacity={0.6} />
          <Spot p={[0, 11.8, -0.2]} target={[0, 0, -4.3]} angle={0.9} penumbra={0.6} intensity={420} distance={40} color="#ffd9a6" />
        </group>
      ))}
      {/* woods */}
      {woods ? (
        <>
          <Inst geo={CYL} xf={trunkXf} mat={trunk} cast={false} />
          <Inst geo={cone} xf={pineXf} mat={pine} cast={false} />
        </>
      ) : null}
    </group>
  );
};

/** Sky dome for night exteriors: deep blue gradient + a moon glow. */
export const NightSky: React.FC = () => {
  const map = useMemo(
    () =>
      canvasTex("nightsky", 16, 256, (g) => {
        const grd = g.createLinearGradient(0, 0, 0, 256);
        grd.addColorStop(0, "#03050c");
        grd.addColorStop(0.55, "#0b1426");
        grd.addColorStop(0.75, "#1b2740");
        grd.addColorStop(1, "#262a30");
        g.fillStyle = grd;
        g.fillRect(0, 0, 16, 256);
      }),
    [],
  );
  return (
    <group>
      <mesh>
        <sphereGeometry args={[300, 32, 16]} />
        <meshBasicMaterial map={map} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      <Glow position={[-120, 110, -160]} size={60} color="#cfd8ff" opacity={0.35} fog={false} />
      <mesh position={[-120, 110, -160]}>
        <sphereGeometry args={[5, 24, 16]} />
        <meshBasicMaterial color="#e8eeff" fog={false} />
      </mesh>
    </group>
  );
};

// ───────────────────────── Fox River from above (hook + finale TV) ─────────────────────────
/** Window grid for a big masonry building: warm lit and dark windows (one tile = 4 windows × 4 floors). */
const windowsTex = (seed: number, repeat: [number, number]) =>
  canvasTex(`wins|${seed}`, 256, 256, (g) => {
    const r = seeded(seed);
    g.clearRect(0, 0, 256, 256);
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const lit = r() < 0.45;
        g.fillStyle = lit ? `rgba(255,${190 + Math.round(r() * 40)},120,1)` : "rgba(20,24,34,1)";
        g.fillRect(x * 64 + 22, y * 64 + 14, 20, 38);
        g.fillStyle = "rgba(0,0,0,0.8)";
        for (let b = 0; b < 3; b++) g.fillRect(x * 64 + 26 + b * 6, y * 64 + 14, 2, 38);
      }
  }, repeat);

/** A cell block / building with brick walls, a window grid on both long sides and a low gable roof. */
const Block: React.FC<{ p: V3; s: V3; seed?: number; roof?: string; wall?: string; ry?: number }> = ({ p, s, seed = 1, roof = "#3a3430", wall = "#8a5a48", ry = 0 }) => {
  const brick = usePbr("red_brick_03", [s[0] / 3, s[1] / 3]);
  const wins = useMemo(() => windowsTex(seed, [s[0] / 6, s[1] / 6]), [seed, s]);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh position={[0, s[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={s} />
        <meshStandardMaterial {...brick} color={wall} roughness={0.9} />
      </mesh>
      {[1, -1].map((k) => (
        <mesh key={k} position={[0, s[1] / 2, (k * s[2]) / 2 + k * 0.03]} rotation={[0, k > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[s[0] - 2, s[1] - 2]} />
          <meshStandardMaterial map={wins} transparent emissiveMap={wins} emissive="#ffffff" emissiveIntensity={0.9} roughness={0.4} depthWrite={false} />
        </mesh>
      ))}
      <mesh position={[0, s[1] + 1.6, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.01, s[2] * 0.62, 3.2, 4, 1, false, Math.PI / 4]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>
      <mesh position={[0, s[1] + 0.15, 0]} scale={[s[0] / s[2], 1, 1]}>
        <boxGeometry args={[s[2] + 0.4, 0.3, s[2] + 0.4]} />
        <meshStandardMaterial color="#6a6258" roughness={0.9} />
      </mesh>
    </group>
  );
};

/**
 * Fox River as a floating diorama (≈ real scale): outer limestone wall 110 × 70 m with 6 towers, the long cell house,
 * the infirmary, admin block by the gate, the yard with fences, floodlights, the road and woods outside.
 * `route` 0…1 draws the escape route in amber (cell → pipes → infirmary → cable over the wall → woods).
 */
export const CAMPUS = { cell: [-18, 3, -12] as V3, infirmary: [24, 0, 10] as V3 };
export const Campus: React.FC<{ route?: number; scan?: number; t?: number }> = ({ route = 0, scan = -1 }) => {
  const stone = useMemo(() => ashlar([8, 1]), []);
  const grass = usePbr("brown_mud_rocks_01", [20, 14]);
  const yard = usePbr("concrete_floor_02", [12, 8]);
  const towers: V3[] = [[-55, 0, -35], [55, 0, -35], [-55, 0, 35], [55, 0, 35], [0, 0, -35], [0, 0, 35]];
  const routePts = useMemo(
    () => [
      [-18, 1.2, -12], [-18, 1.2, -18.5], [6, 1.2, -18.5], [14, 0.6, -4], [24, 0.6, 6], [24, 6, 10], [32, 11, 22], [44, 9, 33], [60, 1.5, 44], [76, 1.5, 52],
    ].map((q) => new THREE.Vector3(...(q as V3))),
    [],
  );
  const curve = useMemo(() => new THREE.CatmullRomCurve3(routePts, false, "catmullrom", 0.2), [routePts]);
  const tube = useMemo(() => (route > 0.01 ? new THREE.TubeGeometry(curve, 200, 0.6, 10, false) : null), [curve, route > 0.01]); // eslint-disable-line react-hooks/exhaustive-deps
  const n = tube ? tube.index!.count : 0;
  if (tube) tube.setDrawRange(0, Math.floor((n * route) / 6) * 6);
  const head = curve.getPoint(Math.min(1, Math.max(0, route)));
  const trees = useMemo(() => {
    const r = seeded(8);
    return Array.from({ length: 160 }, () => {
      const a = r() * Math.PI * 2;
      const d = 75 + r() * 40;
      return { p: [Math.cos(a) * d * 1.1, 0, Math.sin(a) * d * 0.8] as V3, s: 0.8 + r() * 0.8 };
    });
  }, []);
  const pine = useStd("#173022", 0.9, 0);
  const yardFence = useMemo(() => new THREE.MeshStandardMaterial({ map: chainLink([28, 4]), alphaTest: 0.45, side: THREE.DoubleSide, color: "#b8c0c6", metalness: 0.7, roughness: 0.4 }), []);
  const cone = useMemo(() => new THREE.ConeGeometry(1, 1, 8), []);
  const pineXf = useMemo(() => trees.map((q) => ({ p: [q.p[0], 5 * q.s, q.p[2]] as V3, s: [3.2 * q.s, 10 * q.s, 3.2 * q.s] as V3 })), [trees]);
  return (
    <group>
      {/* the floating base: grass top + soil sides */}
      <mesh position={[0, -3, 0]} receiveShadow>
        <boxGeometry args={[260, 6, 200]} />
        <meshStandardMaterial color="#2a1e16" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[260, 200]} />
        <meshStandardMaterial {...grass} color="#4a5a34" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <planeGeometry args={[108, 68]} />
        <meshStandardMaterial {...yard} color="#8a8478" roughness={0.95} />
      </mesh>
      {/* outer wall */}
      {(
        [
          [0, -35, 110, 1.2],
          [0, 35, 110, 1.2],
          [-55, 0, 1.2, 70],
          [55, 0, 1.2, 70],
        ] as [number, number, number, number][]
      ).map(([x, z, w, d], k) => (
        <group key={k}>
          <mesh position={[x, 3.5, z]} castShadow receiveShadow>
            <boxGeometry args={[w, 7, d]} />
            <meshStandardMaterial map={stone} roughness={0.92} />
          </mesh>
          <RB p={[x, 7.1, z]} s={[w + 0.3, 0.3, d + 0.3]} r={0.05} color="#a49d8a" rough={0.9} />
        </group>
      ))}
      {towers.map((p, k) => (
        <Tower key={k} p={p} beam={0.3} h={11} />
      ))}
      {/* buildings */}
      <Block p={[-18, 0, -14]} s={[56, 16, 16]} seed={2} />
      <Block p={[24, 0, 10]} s={[22, 9, 12]} seed={5} wall="#c8c0b0" roof="#4a4a4a" />
      <Block p={[-30, 0, 20]} s={[26, 8, 12]} seed={9} wall="#9a6a52" />
      {/* yard fences + basketball court */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.05, 18]}>
        <planeGeometry args={[28, 15]} />
        <meshStandardMaterial color="#5a6a6a" roughness={0.8} />
      </mesh>
      {[[2, 10.5, 28], [2, 25.5, 28]].map(([x, z, w], k) => (
        <mesh key={k} position={[x, 2, z]} material={yardFence}>
          <planeGeometry args={[w, 4]} />
        </mesh>
      ))}
      {/* floodlight masts inside */}
      {[[-40, -25], [40, -25], [-40, 25], [40, 25], [0, 0]].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 9, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 18, 8]} />
            <meshStandardMaterial color="#6a7076" metalness={0.6} roughness={0.4} />
          </mesh>
          <Glow position={[0, 18.2, 0]} size={9} color="#ffcf8a" opacity={0.7} />
          <pointLight position={[0, 17, 0]} color="#ffc983" intensity={260} distance={50} decay={2} />
        </group>
      ))}
      {/* outside: road + woods */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 48]}>
        <planeGeometry args={[260, 8]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.9} />
      </mesh>
      <Inst geo={cone} xf={pineXf} mat={pine} cast={false} />
      {/* the route */}
      {tube ? (
        <>
          <mesh geometry={tube}>
            <meshBasicMaterial color="#ffb347" toneMapped={false} />
          </mesh>
          <Glow position={head} size={10} color="#ffb347" opacity={0.9} />
        </>
      ) : null}
      {/* REALITY scan plane sweeping across */}
      {scan >= 0 && scan <= 1 ? (
        <mesh position={[-130 + 260 * scan, 20, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[200, 50]} />
          <meshBasicMaterial color="#5cc8ff" transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
    </group>
  );
};
