import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, V3 } from "../../lib/three/core";
import { Env, KeyLight, Post, RB, Cyl } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { ctex } from "../sewer/props";

/**
 * One continuous Black Canyon at real scale (metres). River flows toward +Z; Lake Mead is upstream (z < 0).
 * Riverbed y = 0, dam crest y = H (221 m), canyon rim y = RIM. The dam is an arch bulging upstream.
 */
export const H = 221;
export const RIM = 265;
/** canyon half width at height y (real Black Canyon: ~85 m at the riverbed, ~290 m chord at the crest) */
export const hw = (y: number) => 42 + 104 * Math.pow(Math.max(0, y) / H, 0.85);
export const ARCH_R = 175;
/** upstream face of the arch: z offset at x for curvature k (0 = flat wall, 1 = Hoover arch) */
export const zUp = (x: number, k: number) => k * (ARCH_R - Math.sqrt(Math.max(1, ARCH_R * ARCH_R - x * x)));
/** dam thickness at height y: 200 m at the base → 14 m at the crest */
export const thick = (y: number) => 14 + 186 * Math.pow(1 - Math.min(1, Math.max(0, y) / H), 1.7);
/** dam end x at height y (buried deep in the rock, the rock surface near the dam only bulges outward) */
export const xEnd = (y: number) => hw(y) + 28;

// ───────────────────────── noise ─────────────────────────
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const vnoise = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
};
export const fbm = (x: number, y: number) => vnoise(x, y) * 0.6 + vnoise(x * 2.1 + 5, y * 2.1 + 3) * 0.28 + vnoise(x * 4.3 + 9, y * 4.3 + 1) * 0.12;
export const rnd = (i: number, k = 0) => hash(i * 1.37 + 0.11, k * 7.13 + 0.7);

/** rock surface offset (outward, metres) of the canyon wall. Near the dam and the tunnel portals the wall only
 *  pulls inward, so the dam ends and the portal headwalls are always buried in rock. */
export const wallOff = (side: number, y: number, z: number) => {
  const n = 16 * fbm(z / 95 + side * 13, y / 55) + 6 * fbm(z / 24 + side * 7, y / 14) + 3 * Math.sin(y / 9.5 + fbm(z / 60, side) * 2);
  const nearDam = z > -90 && z < 330;
  const nearPortal = (z > -470 && z < -360) || (z > 500 && z < 610);
  return nearDam ? Math.abs(n) * 0.8 + 1 : nearPortal ? -Math.abs(n) * 0.5 - 1.5 : n;
};

// ───────────────────────── canvas ─────────────────────────
export type Look = "day" | "dusk" | "night" | "interior" | "xray" | "golden";
export const DamCanvas: React.FC<{ cam: Cam; look: Look; children: React.ReactNode; ao?: number; sun?: V3; sunI?: number; shadow?: number; shadowAt?: V3; fog?: [number, number]; bloom?: number }> = ({
  cam,
  look,
  children,
  ao = 0,
  sun,
  sunI,
  shadow = 400,
  shadowAt,
  fog,
  bloom,
}) => {
  const { width, height } = useVideoConfig();
  const outdoor = look === "day" || look === "dusk" || look === "golden";
  const bg = look === "day" ? "#c9dcec" : look === "golden" ? "#f0cfa0" : look === "dusk" ? "#3a2c4a" : look === "xray" ? "#04101a" : look === "night" ? "#070b16" : "#1d1a18";
  const fg = fog ?? (outdoor || look === "night" ? [900, 4200] : look === "xray" ? [600, 2600] : [40, 260]);
  const tgt = shadowAt ?? cam.look;
  const sunP: V3 = sun ?? [tgt[0] - 500, tgt[1] + 700, tgt[2] + 260];
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.1, far: 6000 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      {outdoor ? <SkyDome look={look} /> : null}
      <fog attach="fog" args={[bg, fg[0], fg[1]]} />
      <hemisphereLight
        args={[
          look === "day" ? "#eaf2ff" : look === "golden" ? "#ffe2bd" : look === "dusk" ? "#8f7ab8" : look === "xray" ? "#3c7a9a" : look === "night" ? "#2a3a58" : "#fff1dc",
          look === "xray" ? "#061018" : "#5a4632",
          look === "day" ? 0.6 : look === "golden" ? 0.5 : look === "dusk" ? 0.35 : look === "xray" ? 0.5 : look === "night" ? 0.2 : 0.55,
        ]}
      />
      <KeyLight
        p={[tgt[0] + (sunP[0] - tgt[0]), sunP[1], sunP[2]]}
        target={tgt}
        intensity={sunI ?? (look === "day" ? 2.4 : look === "golden" ? 2.2 : look === "dusk" ? 0.7 : look === "xray" ? 0.6 : look === "night" ? 0.25 : 1.4)}
        color={look === "golden" ? "#ffc98a" : look === "dusk" ? "#ff9a6a" : look === "xray" ? "#9fd8ff" : "#fff2dc"}
        size={shadow}
      />
      {children}
      <Env intensity={outdoor ? 0.35 : 0.2} />
      <Post bloom={bloom ?? (look === "night" || look === "dusk" || look === "xray" ? 0.9 : 0.45)} ao={ao} vignette={0.4} />
    </ThreeCanvas>
  );
};

const SkyDome: React.FC<{ look: Look }> = ({ look }) => {
  const mat = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 4;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 256);
    const stops: [number, string][] =
      look === "dusk"
        ? [
            [0, "#1c1a3c"],
            [0.5, "#6a4a7a"],
            [0.85, "#e08a5a"],
            [1, "#ffc27a"],
          ]
        : look === "golden"
        ? [
            [0, "#4f86c6"],
            [0.6, "#b8cce0"],
            [1, "#ffd9a8"],
          ]
        : [
            [0, "#3f7fcc"],
            [0.55, "#9cc4ea"],
            [1, "#eef2f2"],
          ];
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: tx, side: THREE.BackSide, fog: false, depthWrite: false });
  }, [look]);
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[5000, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2 + 0.12]} />
    </mesh>
  );
};

// ───────────────────────── canyon ─────────────────────────
const Z0 = 1600;
const useCliffGeo = (side: number) =>
  useMemo(() => {
    const NZ = 160;
    const NY = 46;
    const pos: number[] = [];
    const uv: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const cDark = new THREE.Color("#5e4232");
    const cRed = new THREE.Color("#9a6242");
    const cTan = new THREE.Color("#b89a74");
    const cc = new THREE.Color();
    // rows: y from -12 up to the rim, then 3 rows rolling back over the rim edge
    const rows: { y: number; dx: number }[] = [];
    for (let j = 0; j <= NY; j++) rows.push({ y: -12 + ((RIM + 12) * j) / NY, dx: 0 });
    rows.push({ y: RIM + 1.5, dx: 6 }, { y: RIM - 0.4, dx: 30 }, { y: RIM - 0.4, dx: 140 });
    for (let j = 0; j < rows.length; j++) {
      for (let i = 0; i <= NZ; i++) {
        const z = -Z0 + (2 * Z0 * i) / NZ;
        const { y, dx } = rows[j];
        const yy = Math.min(y, RIM);
        const off = j <= NY ? wallOff(side, yy, z) : wallOff(side, RIM, z);
        // horizontal strata ledges
        const ledge = j <= NY ? 2.2 * Math.max(0, Math.sin(yy / 7.3 + 1.3 * fbm(z / 140, side * 3))) : 0;
        const x = side * (hw(yy) + off + ledge + dx);
        pos.push(x, y, z);
        uv.push(z / 16, (j <= NY ? y : y + dx) / 16);
        const a = 0.5 + 0.5 * fbm(z / 70 + side * 4, y / 30);
        const band = 0.5 + 0.5 * Math.sin(y / 11 + 2 * fbm(z / 200, side));
        const streak = 0.5 + 0.5 * fbm(z / 9 + side * 2, y / 120);
        cc.copy(cDark).lerp(cRed, a).lerp(cTan, band * 0.45 * streak);
        if (j > NY) cc.lerp(cTan, 0.6);
        // the Poly Haven albedo averages ~0.27 → lift the vertex colour so the product lands on the palette
        col.push(cc.r * 3.2, cc.g * 3.2, cc.b * 3.2);
      }
    }
    const W = NZ + 1;
    for (let j = 0; j < rows.length - 1; j++)
      for (let i = 0; i < NZ; i++) {
        const a = j * W + i;
        const b = a + 1;
        const c = a + W;
        const d = c + 1;
        if (side < 0) idx.push(a, c, b, b, c, d);
        else idx.push(a, b, c, b, d, c);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, [side]);

/** Both canyon walls + desert plateau + riverbed. `xray` turns the rock into translucent glass,
 *  `cut` hides the near (+x) wall like a doll's house. */
export const Canyon: React.FC<{ xray?: number; cut?: boolean; cutLeft?: boolean; tint?: string }> = ({ xray = 0, cut, cutLeft, tint = "#ffffff" }) => {
  const rock = usePbr("coast_sand_rocks_02", [1, 1]);
  const mud = usePbr("brown_mud_rocks_01", [40, 140]);
  const L = useCliffGeo(-1);
  const R = useCliffGeo(1);
  const sand = useMemo(
    () =>
      ctex("dam-desert", 512, 512, (g, r) => {
        g.fillStyle = "#c9a57a";
        g.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 2600; i++) {
          const v = 150 + r() * 70;
          g.fillStyle = `rgba(${v + 30},${v},${v - 40},${0.25 + r() * 0.3})`;
          g.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 3);
        }
        for (let i = 0; i < 90; i++) {
          g.fillStyle = `rgba(90,80,52,${0.35 + r() * 0.3})`;
          g.beginPath();
          g.arc(r() * 512, r() * 512, 2 + r() * 4, 0, Math.PI * 2);
          g.fill();
        }
      }, [60, 60]),
    [],
  );
  const solid = useMemo(() => new THREE.MeshStandardMaterial({ ...rock, color: tint, vertexColors: true, roughness: 0.95, normalScale: new THREE.Vector2(1.6, 1.6) }), [rock, tint]);
  const glass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#5ad7ff", emissive: "#0b4d6a", emissiveIntensity: 0.6, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }),
    [],
  );
  const mat = xray > 0.5 ? glass : solid;
  return (
    <group>
      {cutLeft ? null : <mesh geometry={L} material={mat} receiveShadow castShadow={xray <= 0.5} />}
      {cut ? null : <mesh geometry={R} material={mat} receiveShadow castShadow={xray <= 0.5} />}
      {/* plateau */}
      {[-1, 1].map((s) =>
        (s > 0 && cut) || (s < 0 && cutLeft) ? null : (
          <mesh key={s} position={[s * (hw(RIM) + 40 + 2500), RIM, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[5000, 2 * Z0 + 2000]} />
            <meshStandardMaterial map={sand} roughness={1} color={xray > 0.5 ? "#16364a" : "#ffffff"} />
          </mesh>
        ),
      )}
      {/* riverbed */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 2 * Z0]} />
        <meshStandardMaterial {...mud} color={xray > 0.5 ? "#1a3442" : "#8d7462"} roughness={1} />
      </mesh>
    </group>
  );
};

// ───────────────────────── water ─────────────────────────
const flowTex = (key: string, base: string, foam: number) =>
  ctex(`dam-flow-${key}`, 256, 512, (g, r) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 512);
    for (let i = 0; i < 260 * foam; i++) {
      const x = r() * 256;
      const y = r() * 512;
      g.strokeStyle = `rgba(255,255,255,${0.08 + r() * 0.35 * foam})`;
      g.lineWidth = 1 + r() * 3;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 8, y + 10 + r() * 40);
      g.stroke();
    }
  });

/** river strip between z0 and z1 at level y, flowing toward +Z (`t` seconds, `speed` m/s) */
export const River: React.FC<{ z0: number; z1: number; y: number; t: number; speed?: number; color?: string; foam?: number; width?: number }> = ({
  z0,
  z1,
  y,
  t,
  speed = 6,
  color = "#3f8a83",
  foam = 1,
  width,
}) => {
  const L = z1 - z0;
  const w = width ?? 2 * hw(y) + 60;
  const tx = useMemo(() => {
    const b = flowTex(`${color}-${foam}`, color, foam);
    const c = b.clone();
    c.wrapS = c.wrapT = THREE.RepeatWrapping;
    c.needsUpdate = true;
    return c;
  }, [color, foam]);
  tx.repeat.set(w / 30, L / 60);
  tx.offset.set(0, (-t * speed) / 60);
  return (
    <mesh position={[0, y, (z0 + z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, L]} />
      <meshStandardMaterial map={tx} roughness={0.15} metalness={0.15} color="#ffffff" />
    </mesh>
  );
};

/** Lake Mead behind the arch: its downstream edge follows the upstream face at level y */
export const Lake: React.FC<{ y: number; k?: number; color?: string; t?: number }> = ({ y, k = 1, color = "#2b6f98", t = 0 }) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    const xe = hw(y) + 70;
    s.moveTo(-xe, 2400);
    for (let i = 0; i <= 40; i++) {
      const x = -xe + (2 * xe * i) / 40;
      const xc = Math.max(-xEnd(y), Math.min(xEnd(y), x));
      s.lineTo(x, -zUp(xc, k) + 0.5);
    }
    s.lineTo(xe, 2400);
    s.closePath();
    return new THREE.ShapeGeometry(s, 4);
  }, [y, k]);
  useEffect(() => () => geo.dispose(), [geo]);
  const tx = useMemo(() => {
    const b = flowTex(`lake-${color}`, color, 0.25);
    const c = b.clone();
    c.wrapS = c.wrapT = THREE.RepeatWrapping;
    c.repeat.set(0.02, 0.01);
    c.needsUpdate = true;
    return c;
  }, [color]);
  tx.offset.set(t * 0.002, t * 0.001);
  // shape lies in XY with +y = upstream → rotate so shape-y maps to world −z
  return (
    <mesh geometry={geo} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial map={tx} color="#ffffff" roughness={0.08} metalness={0.2} />
    </mesh>
  );
};

// ───────────────────────── the dam ─────────────────────────
/** Arch-gravity dam mesh. `k` curvature, `top` built height (m), `half` = only the left half (cut at the crown). */
const buildDam = (k: number, top: number, half: boolean) => {
  const NU = 56;
  const NV = 30;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const grid = (P: (u: number, v: number) => V3, nu: number, nv: number, flip: boolean, uvs: (p: V3) => [number, number]) => {
    const base = pos.length / 3;
    for (let j = 0; j <= nv; j++)
      for (let i = 0; i <= nu; i++) {
        const p = P(i / nu, j / nv);
        pos.push(...p);
        uv.push(...uvs(p));
      }
    const W = nu + 1;
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = base + j * W + i;
        const b = a + 1;
        const c = a + W;
        const d = c + 1;
        if (flip) idx.push(a, c, b, b, c, d);
        else idx.push(a, b, c, b, d, c);
      }
  };
  const yOf = (v: number) => -10 + (top + 10) * v;
  const xOf = (u: number, y: number) => (half ? -xEnd(y) + xEnd(y) * u : -xEnd(y) + 2 * xEnd(y) * u);
  const up = (u: number, v: number): V3 => {
    const y = yOf(v);
    const x = xOf(u, y);
    return [x, y, zUp(x, k)];
  };
  const dn = (u: number, v: number): V3 => {
    const y = yOf(v);
    const x = xOf(u, y);
    return [x, y, zUp(x, k) + thick(y)];
  };
  const fuv = (p: V3): [number, number] => [p[0] / 48, p[1] / 48];
  grid(up, NU, NV, true, fuv);
  grid(dn, NU, NV, false, fuv);
  // crest
  grid((u, v) => {
    const a = up(u, 1);
    const b = dn(u, 1);
    return [a[0] + (b[0] - a[0]) * v, a[1], a[2] + (b[2] - a[2]) * v];
  }, NU, 2, true, (p) => [p[0] / 24, p[2] / 24]);
  // end caps (profile sections)
  for (const u of [0, 1]) {
    grid((w, v) => {
      const a = up(u, v);
      const b = dn(u, v);
      return [a[0], a[1], a[2] + (b[2] - a[2]) * w];
    }, 12, NV, u === 1, (p) => [p[2] / 24, p[1] / 24]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

/** Hoover's face: pale concrete with faint 5 ft lift lines and block joints, 48 m tile */
export const liftTex = () =>
  ctex("dam-lifts", 512, 512, (g, r) => {
    g.fillStyle = "#e9e2d4";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 3000; i++) {
      const v = 200 + r() * 40;
      g.fillStyle = `rgba(${v},${v - 6},${v - 16},0.25)`;
      g.fillRect(r() * 512, r() * 512, 2 + r() * 6, 1 + r() * 3);
    }
    for (let y = 0; y < 512; y += 16) {
      g.fillStyle = `rgba(120,110,95,${0.18 + r() * 0.1})`;
      g.fillRect(0, y, 512, 1.5);
    }
    for (let x = 0; x < 512; x += 170) {
      g.fillStyle = "rgba(110,100,85,0.22)";
      g.fillRect(x, 0, 2, 512);
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(150,130,100,${0.06 + r() * 0.08})`;
      g.fillRect(r() * 512, r() * 512, 2 + r() * 4, 30 + r() * 120);
    }
  }, [1, 1]);

export const crackTex = () =>
  ctex("dam-cracks", 1024, 1024, (g, r) => {
    g.clearRect(0, 0, 1024, 1024);
    g.strokeStyle = "#ffffff";
    g.lineCap = "round";
    const branch = (x: number, y: number, a: number, len: number, w: number, d: number) => {
      let px = x;
      let py = y;
      for (let s = 0; s < len; s++) {
        a += (r() - 0.5) * 0.7;
        const nx = px + Math.cos(a) * 9;
        const ny = py + Math.sin(a) * 9;
        g.lineWidth = w * (1 - s / len) + 0.6;
        g.beginPath();
        g.moveTo(px, py);
        g.lineTo(nx, ny);
        g.stroke();
        px = nx;
        py = ny;
        if (d < 3 && r() < 0.06) branch(px, py, a + (r() - 0.5) * 2, len * 0.5, w * 0.6, d + 1);
      }
    };
    for (let i = 0; i < 16; i++) branch(r() * 1024, r() * 1024, r() * Math.PI * 2, 40 + r() * 50, 5, 0);
  });

/**
 * The dam. heat 0..1 glows it red-white (curing heat), cracks 0..1 shows the crack web, cool 0..1 goes icy blue.
 */
export const Dam: React.FC<{ k?: number; top?: number; half?: boolean; heat?: number; cracks?: number; cool?: number; xray?: number; road?: boolean; t?: number }> = ({
  k = 1,
  top = H,
  half = false,
  heat = 0,
  cracks = 0,
  cool = 0,
  xray = 0,
  road = true,
}) => {
  const kq = Math.round(k * 200) / 200;
  const tq = Math.round(top * 2) / 2;
  const geo = useMemo(() => buildDam(kq, Math.max(1, tq), half), [kq, tq, half]);
  useEffect(() => () => geo.dispose(), [geo]);
  const conc = useMemo(() => ({ map: liftTex() }), []);
  const crk = useMemo(() => {
    const c = crackTex().clone();
    c.wrapS = c.wrapT = THREE.RepeatWrapping;
    c.repeat.set(0.18, 0.18);
    c.needsUpdate = true;
    return c;
  }, []);
  const hot = new THREE.Color("#3a0800").lerp(new THREE.Color("#ff4a10"), Math.min(1, heat * 1.3));
  const base = new THREE.Color("#ddd3c2").lerp(new THREE.Color("#9fd8ff"), cool * 0.7).lerp(new THREE.Color("#2a0e08"), heat * 0.85);
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        {xray > 0.5 ? (
          <meshStandardMaterial color="#9fe6ff" emissive="#2aa8d8" emissiveIntensity={0.35} transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} />
        ) : (
          <meshStandardMaterial {...conc} color={base} roughness={0.9} emissive={heat > 0.01 ? hot : "#000000"} emissiveIntensity={heat > 0.01 ? 0.3 + 0.9 * heat : 0} />
        )}
      </mesh>
      {cracks > 0.01 ? (
        <mesh geometry={geo}>
          <meshBasicMaterial color={heat > 0.2 ? "#fff1b0" : "#1a1410"} alphaMap={crk} transparent opacity={Math.min(1, cracks)} depthWrite={false} polygonOffset polygonOffsetFactor={-2} toneMapped={false} />
        </mesh>
      ) : null}
      {road && top >= H - 0.5 && xray <= 0.5 ? <Crest k={k} half={half} /> : null}
    </group>
  );
};

/** crest road: parapets both sides + lamp posts (art deco) */
const Crest: React.FC<{ k: number; half: boolean }> = ({ k, half }) => {
  const N = 26;
  const xe = hw(H) - 2;
  const items: React.ReactNode[] = [];
  for (let i = 0; i <= N; i++) {
    const x = half ? -xe + (xe * i) / N : -xe + (2 * xe * i) / N;
    const z = zUp(x, k);
    const ang = Math.atan2(k * x, Math.sqrt(Math.max(1, ARCH_R * ARCH_R - x * x)));
    if (i < N) {
      const x2 = half ? -xe + (xe * (i + 1)) / N : -xe + (2 * xe * (i + 1)) / N;
      const z2 = zUp(x2, k);
      const len = Math.hypot(x2 - x, z2 - z) + 0.4;
      const a2 = -Math.atan2(z2 - z, x2 - x);
      for (const off of [0.6, 13.4]) items.push(<RB key={`p${i}-${off}`} p={[(x + x2) / 2, H + 0.6, (z + z2) / 2 + off]} s={[len, 1.2, 0.6]} r={0.08} rot={[0, a2, 0]} color="#e2d8c6" />);
    }
    if (i % 4 === 2) items.push(<Cyl key={`l${i}`} p={[x, H + 3.2, z + 13.4]} r={0.18} h={5} color="#2c2a28" metal={0.6} />);
    void ang;
  }
  return <group>{items}</group>;
};

// ───────────────────────── blocks (Lego pour) ─────────────────────────
export type BlockState = { top: number; stagger: number; heat?: (x: number, y: number, z: number) => number; grout?: number; studs?: number; fall?: number; k?: number; zOnly?: [number, number] };
const BW = 16;
const LIFT = 6;
/** every block centre for the full dam (x, y, zOff across the thickness) */
export const blockList = (() => {
  const out: { i: number; j: number; x: number; y: number; zo: number; lift: number }[] = [];
  for (let lift = 0; lift * LIFT < H; lift++) {
    const y = lift * LIFT + LIFT / 2 - 4;
    const xe = xEnd(y) - 3;
    const th = thick(y);
    for (let i = -12; i <= 12; i++) {
      const x = i * BW;
      if (Math.abs(x) > xe) continue;
      for (let j = 0; j * BW < th; j++) out.push({ i, j, x, y, zo: j * BW + BW / 2, lift });
    }
  }
  return out;
})();

/** Columns of blocks poured in lifts. Instanced; per-instance colour for heat/cooling. */
export const DamBlocks: React.FC<{ s: BlockState }> = ({ s }) => {
  const k = s.k ?? 1;
  const conc = usePbr("concrete_floor_02", [0.5, 0.5]);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ ...conc, roughness: 0.9 }), blockList.length);
    m.castShadow = true;
    m.receiveShadow = true;
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(blockList.length * 3), 3);
    return m;
  }, [conc]);
  const studs = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.CylinderGeometry(2.6, 2.6, 2.2, 18), new THREE.MeshStandardMaterial({ roughness: 0.6 }), blockList.length * 4);
    m.castShadow = true;
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(blockList.length * 4 * 3), 3);
    return m;
  }, []);
  const o = new THREE.Object3D();
  const col = new THREE.Color();
  const grey = new THREE.Color("#ddd3c2");
  const groutC = new THREE.Color("#cfc8bb");
  let n = 0;
  let ns = 0;
  const gap = (1 - (s.grout ?? 0)) * 1.6;
  for (const b of blockList) {
    const hcol = s.top * (1 - s.stagger * 0.22 * rnd(b.i * 31 + b.j, 3));
    if (b.y - LIFT / 2 > hcol) continue;
    const zc = zUp(b.x, k) + b.zo;
    if (s.zOnly && (zc < s.zOnly[0] || zc > s.zOnly[1])) continue;
    const ang = -Math.atan2(k * b.x, Math.sqrt(Math.max(1, ARCH_R * ARCH_R - b.x * b.x)));
    const fall = s.fall ?? 0;
    const fr = rnd(b.i * 13 + b.j * 7 + b.lift, 9);
    const drop = fall > 0 ? Math.max(0, fall - fr * 0.35) : 0;
    o.position.set(b.x + (fr - 0.5) * 40 * drop, b.y - 0.5 * 160 * drop * drop * (0.6 + b.y / H), zc + (fr - 0.3) * 60 * drop);
    o.rotation.set(drop * 3 * (fr - 0.5), ang + drop * 2 * fr, drop * 2.5 * (0.5 - fr));
    o.scale.set(BW - gap, LIFT - gap * 0.5, BW - gap);
    o.updateMatrix();
    mesh.setMatrixAt(n, o.matrix);
    const h = s.heat ? s.heat(b.x, b.y, zc) : 0;
    if (h > 0) col.set("#2a0600").lerp(new THREE.Color("#ff4a10"), Math.min(1, h * 1.2));
    else if (h < 0) col.copy(grey).lerp(new THREE.Color("#4ab8ff"), Math.min(1, -h));
    else col.copy((s.grout ?? 0) > 0.5 ? groutC : grey).multiplyScalar(0.92 + 0.12 * rnd(b.i * 5 + b.j, b.lift));
    mesh.setColorAt(n, col);
    // Lego studs on the top block of each column
    if ((s.studs ?? 0) > 0.01 && b.y + LIFT / 2 > hcol - 0.01 && b.y + LIFT / 2 <= hcol + LIFT) {
      for (const [dx, dz] of [
        [-4, -4],
        [4, -4],
        [-4, 4],
        [4, 4],
      ]) {
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        o.position.set(b.x + dx * ca + dz * sa, b.y + LIFT / 2 + 1.1 * (s.studs ?? 0), zc - dx * sa + dz * ca);
        o.rotation.set(0, 0, 0);
        o.scale.set(1, s.studs ?? 0, 1);
        o.updateMatrix();
        studs.setMatrixAt(ns, o.matrix);
        studs.setColorAt(ns, col);
        ns++;
      }
    }
    n++;
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor!.needsUpdate = true;
  studs.count = ns;
  studs.instanceMatrix.needsUpdate = true;
  if (studs.instanceColor) studs.instanceColor.needsUpdate = true;
  const mat = mesh.material as THREE.MeshStandardMaterial;
  const anyHeat = !!s.heat;
  mat.emissive.set(anyHeat ? "#ffffff" : "#000000");
  mat.emissiveIntensity = 0;
  return (
    <group>
      <primitive object={mesh} />
      {ns > 0 ? <primitive object={studs} /> : null}
      {anyHeat ? <HeatGlowBlocks mesh={mesh} /> : null}
    </group>
  );
};

/** additive copy of the blocks so hot blocks glow (instance colours drive it) */
const HeatGlowBlocks: React.FC<{ mesh: THREE.InstancedMesh }> = ({ mesh }) => {
  const glow = useMemo(() => {
    const g = new THREE.InstancedMesh(mesh.geometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), mesh.instanceMatrix.count);
    return g;
  }, [mesh]);
  glow.instanceMatrix = mesh.instanceMatrix;
  glow.instanceColor = mesh.instanceColor;
  glow.count = mesh.count;
  return <primitive object={glow} />;
};

// ───────────────────────── tunnels, cofferdams ─────────────────────────
export const TUNNEL_Y = 14;
/** centre line of diversion tunnel (side −1/+1, lane 0 inner / 1 outer) */
export const tunnelPts = (side: number, lane: number) => {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const z = -415 + 970 * u;
    const bulge = Math.sin(u * Math.PI);
    const x = side * (hw(TUNNEL_Y) - 12 + bulge * (34 + lane * 30) + lane * 4);
    pts.push(new THREE.Vector3(x, TUNNEL_Y + 2 * bulge - lane * 1.5, z));
  }
  return pts;
};

/** concrete portal headwall where a tunnel meets the canyon (faces the river, tilted upstream/downstream) */
export const Portal: React.FC<{ side: number; lane: number; inlet: boolean; water?: number; t?: number }> = ({ side, lane, inlet, water = 0, t = 0 }) => {
  const pts = tunnelPts(side, lane);
  const p = inlet ? pts[0] : pts[pts.length - 1];
  const x = side * (hw(TUNNEL_Y) - 26 - lane * 2);
  const ry = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  const tilt = (inlet ? -1 : 1) * side * 0.5;
  return (
    <group position={[x, 0, p.z]} rotation={[0, ry + tilt, 0]}>
      {/* headwall: front face at local z = 0 */}
      <RB p={[0, 15, -16]} s={[30, 32, 32]} r={1} color="#cfc6b4" />
      <mesh position={[0, TUNNEL_Y, 0.05]}>
        <circleGeometry args={[8.5, 40]} />
        <meshStandardMaterial color="#07090b" roughness={1} />
      </mesh>
      <mesh position={[0, TUNNEL_Y, 0.4]}>
        <torusGeometry args={[8.9, 0.7, 10, 48]} />
        <meshStandardMaterial color="#e6dfd0" roughness={0.8} />
      </mesh>
      {water > 0.01 ? (
        <mesh position={[0, TUNNEL_Y - 8.5 + 6 * water, 0.6]}>
          <planeGeometry args={[15, 12 * water]} />
          <meshBasicMaterial color="#9fe6ff" transparent opacity={0.6 + 0.2 * Math.sin(t * 9)} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};

/** earth-and-rock cofferdam across the river at z, raised 0..1 */
export const Cofferdam: React.FC<{ z: number; up: number; h?: number }> = ({ z, up, h = 30 }) => {
  const mud = usePbr("brown_mud_rocks_01", [6, 1]);
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-40, 0);
    s.lineTo(-10, h);
    s.lineTo(10, h);
    s.lineTo(40, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 2 * hw(h) + 40, bevelEnabled: false });
    g.translate(0, 0, -(hw(h) + 20));
    g.rotateY(Math.PI / 2);
    return g;
  }, [h]);
  if (up <= 0.01) return null;
  return (
    <mesh geometry={geo} position={[0, -2, z]} scale={[1, up, 1]} castShadow receiveShadow>
      <meshStandardMaterial {...mud} color="#c9a57a" roughness={1} />
    </mesh>
  );
};

// ───────────────────────── construction kit on the rims ─────────────────────────
/** cableway: head tower on each rim, track cable across, an 8-ton concrete bucket at u (0..1 across), hoist depth d */
export const Cableway: React.FC<{ z: number; u: number; drop: number; pour?: number }> = ({ z, u, drop, pour = 0 }) => {
  const xa = -(hw(RIM) + 25);
  const xb = hw(RIM) + 25;
  const top = RIM + 40;
  const bx = xa + (xb - xa) * u;
  const sag = 18 * Math.sin(u * Math.PI);
  const by = top - sag;
  const line = (a: V3, b: V3, r: number, key: string) => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    const len = va.distanceTo(vb);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    return (
      <mesh key={key} position={mid} quaternion={q}>
        <cylinderGeometry args={[r, r, len, 6]} />
        <meshStandardMaterial color="#1c1c1c" metalness={0.6} roughness={0.5} />
      </mesh>
    );
  };
  const segs: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const u0 = i / 12;
    const u1 = (i + 1) / 12;
    segs.push(line([xa + (xb - xa) * u0, top - 18 * Math.sin(u0 * Math.PI), z], [xa + (xb - xa) * u1, top - 18 * Math.sin(u1 * Math.PI), z], 0.35, `c${i}`));
  }
  return (
    <group>
      {[xa, xb].map((x) => (
        <group key={x} position={[x, RIM, z]}>
          {[-5, 5].map((dz) => (
            <group key={dz}>
              {line([-4, 0, dz], [0, 42, dz * 0.3], 0.6, "a")}
              {line([4, 0, dz], [0, 42, dz * 0.3], 0.6, "b")}
            </group>
          ))}
          <RB p={[0, 42, 0]} s={[4, 2, 6]} r={0.2} color="#3a3530" />
        </group>
      ))}
      {segs}
      {/* trolley + hoist + bucket */}
      <RB p={[bx, by - 1, z]} s={[4, 2, 2.4]} r={0.2} color="#c9a227" />
      {line([bx, by - 2, z], [bx, by - 2 - drop, z], 0.15, "h")}
      <group position={[bx, by - 4 - drop, z]} rotation={[0, 0, pour * 0.9]}>
        <Cyl p={[0, 0, 0]} r={2.2} r2={1.7} h={3.6} color="#5d5a55" metal={0.5} />
        <mesh position={[0, 1.75, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.1, 20]} />
          <meshStandardMaterial color="#9b958c" roughness={0.9} />
        </mesh>
      </group>
      {pour > 0.3 ? (
        <mesh position={[bx + 3, by - 4 - drop - 6, z]}>
          <cylinderGeometry args={[0.6, 1.2, 10, 8]} />
          <meshStandardMaterial color="#9b958c" roughness={0.9} />
        </mesh>
      ) : null}
    </group>
  );
};

/** the four intake towers in Lake Mead (art deco, 120 m) */
export const IntakeTowers: React.FC<{ show?: number }> = ({ show = 1 }) =>
  show > 0.01 ? (
    <group>
      {[-1, 1].map((s) =>
        [-150, -230].map((z, i) => {
          const x = s * (hw(110) - 24 - i * 6);
          return (
            <group key={`${s}${z}`} position={[x, 0, z]}>
              <Cyl p={[0, 60 * show, 0]} r={13} h={120 * show} seg={32} color="#e2d9c8" rough={0.85} />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((a) => (
                <RB key={a} p={[Math.cos((a * Math.PI) / 4) * 13.4, 62 * show, Math.sin((a * Math.PI) / 4) * 13.4]} s={[2, 112 * show, 2]} r={0.3} rot={[0, -(a * Math.PI) / 4, 0]} color="#d2c8b4" />
              ))}
              <Cyl p={[0, 120 * show + 4, 0]} r={10} r2={13.5} h={8} color="#cfc4ae" />
              <Cyl p={[0, 120 * show + 10, 0]} r={6} h={6} color="#bfb39b" />
            </group>
          );
        }),
      )}
    </group>
  ) : null;

/** U-shaped powerhouse at the downstream toe: one wing along each wall */
export const Powerhouse: React.FC = () => (
  <group>
    {[-1, 1].map((s) => (
      <group key={s}>
        <RB p={[s * (hw(20) - 22), 22, 300]} s={[30, 44, 180]} r={1} color="#e6ddcc" />
        {Array.from({ length: 9 }).map((_, i) => (
          <RB key={i} p={[s * (hw(20) - 22) - s * 15.2, 26, 222 + i * 19]} s={[0.6, 30, 8]} r={0.2} color="#2a3442" />
        ))}
        <RB p={[s * (hw(20) - 22), 45, 300]} s={[32, 2, 182]} r={0.4} color="#cbbfa8" />
      </group>
    ))}
  </group>
);

/** a little desert road + transmission line toward Las Vegas */
export const Pylon: React.FC<{ p: V3; ry?: number; s?: number }> = ({ p, ry = 0, s = 1 }) => {
  const leg = (a: V3, b: V3, key: string) => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    return (
      <mesh key={key} position={va.clone().add(vb).multiplyScalar(0.5)} quaternion={q}>
        <cylinderGeometry args={[0.25, 0.25, va.distanceTo(vb), 5]} />
        <meshStandardMaterial color="#8a8f95" metalness={0.7} roughness={0.4} />
      </mesh>
    );
  };
  const out: React.ReactNode[] = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(leg([sx * 4, 0, sz * 4], [sx * 1.2, 30, sz * 1.2], `l${sx}${sz}`));
  for (let h = 6; h < 30; h += 6) out.push(leg([-3, h, 0], [3, h + 6, 0], `x${h}`), leg([3, h, 0], [-3, h + 6, 0], `y${h}`));
  out.push(leg([-11, 30, 0], [11, 30, 0], "arm"), leg([-8, 24, 0], [8, 24, 0], "arm2"));
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      {out}
    </group>
  );
};
