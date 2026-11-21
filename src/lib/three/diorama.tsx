import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { seeded } from "../timing";
import type { V3 } from "./core";

/**
 * Stylised "diorama" kit for cosy low-poly interiors and suburbs (look of the Absolute-Zero
 * reference reels): procedural canvas textures (planks, tiles, wallpaper, siding, shingles,
 * asphalt, grass), rounded furniture, a blocky survivor figure, and a post stack
 * (N8AO + bloom + ACES + vignette). Everything is deterministic (seeded) and frame-free.
 */

// ───────────────────────── textures ─────────────────────────
type TexKind = "planks" | "tiles" | "wallpaper" | "siding" | "shingles" | "asphalt" | "grass" | "carpet" | "plaster";
const cache = new Map<string, THREE.CanvasTexture>();

const shade = (hex: string, k: number) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return `#${c.getHexString()}`;
};

export const tex = (kind: TexKind, color: string, repeat: [number, number] = [1, 1], seed = 1) => {
  const key = `${kind}|${color}|${repeat}|${seed}`;
  if (cache.has(key)) return cache.get(key)!;
  const S = 512;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const g = cv.getContext("2d")!;
  const r = seeded(seed * 97 + kind.length);
  g.fillStyle = color;
  g.fillRect(0, 0, S, S);
  const noise = (n: number, a: number, size = 2) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a * r()})` : `rgba(255,255,255,${a * r()})`;
      g.fillRect(r() * S, r() * S, size, size);
    }
  };
  if (kind === "planks") {
    const rows = 8;
    for (let y = 0; y < rows; y++) {
      let x = -r() * 200;
      while (x < S) {
        const w = 160 + r() * 200;
        g.fillStyle = shade(color, 0.82 + r() * 0.3);
        g.fillRect(x, (y * S) / rows, w, S / rows);
        for (let k = 0; k < 5; k++) {
          g.strokeStyle = `rgba(0,0,0,${0.05 + r() * 0.06})`;
          g.lineWidth = 1;
          const yy = (y * S) / rows + 6 + r() * (S / rows - 12);
          g.beginPath();
          g.moveTo(x, yy);
          g.bezierCurveTo(x + w * 0.3, yy + (r() - 0.5) * 6, x + w * 0.6, yy + (r() - 0.5) * 6, x + w, yy);
          g.stroke();
        }
        g.fillStyle = "rgba(0,0,0,0.35)";
        g.fillRect(x, (y * S) / rows, 2, S / rows);
        x += w;
      }
      g.fillStyle = "rgba(0,0,0,0.4)";
      g.fillRect(0, (y * S) / rows, S, 2);
    }
  } else if (kind === "tiles") {
    const n = 8;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        g.fillStyle = shade(color, 0.93 + r() * 0.1);
        g.fillRect((x * S) / n + 3, (y * S) / n + 3, S / n - 6, S / n - 6);
      }
    g.globalCompositeOperation = "destination-over";
    g.fillStyle = shade(color, 0.6);
    g.fillRect(0, 0, S, S);
    g.globalCompositeOperation = "source-over";
  } else if (kind === "wallpaper") {
    for (let x = 0; x < S; x += 64) {
      g.fillStyle = shade(color, 0.94);
      g.fillRect(x, 0, 30, S);
    }
    noise(4000, 0.05);
  } else if (kind === "siding") {
    const n = 16;
    for (let y = 0; y < n; y++) {
      const grd = g.createLinearGradient(0, (y * S) / n, 0, ((y + 1) * S) / n);
      grd.addColorStop(0, shade(color, 1.05));
      grd.addColorStop(1, shade(color, 0.8));
      g.fillStyle = grd;
      g.fillRect(0, (y * S) / n, S, S / n);
    }
    noise(2000, 0.04);
  } else if (kind === "shingles") {
    const n = 12;
    for (let y = 0; y < n; y++) {
      const off = (y % 2) * 21;
      for (let x = -1; x < 13; x++) {
        g.fillStyle = shade(color, 0.75 + r() * 0.4);
        g.fillRect(x * 42 + off, (y * S) / n, 40, S / n - 3);
      }
    }
  } else if (kind === "asphalt") {
    noise(30000, 0.12, 2);
  } else if (kind === "grass") {
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = shade(color, 0.7 + r() * 0.6);
      g.fillRect(r() * S, r() * S, 2, 4 + r() * 4);
    }
  } else if (kind === "carpet") {
    noise(40000, 0.08, 1);
    g.strokeStyle = shade(color, 0.7);
    g.lineWidth = 18;
    g.strokeRect(30, 30, S - 60, S - 60);
  } else {
    noise(9000, 0.05, 2);
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
};

/** Printed product label: background, a colour band, a big product name and a small line. */
export const labelTex = (bg: string, band: string, name: string, sub = "", w = 512, h = 256) => {
  const key = `label|${bg}|${band}|${name}|${sub}|${w}x${h}`;
  if (cache.has(key)) return cache.get(key)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = band;
  g.fillRect(0, h * 0.62, w, h * 0.2);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.fillRect(0, h * 0.62, w, 4);
  g.fillStyle = shade(band, 0.45);
  g.font = `900 ${Math.round(h * 0.26)}px Arial`;
  g.textAlign = "center";
  g.fillText(name, w / 2, h * 0.45);
  g.fillStyle = "#ffffff";
  g.font = `700 ${Math.round(h * 0.11)}px Arial`;
  g.fillText(sub, w / 2, h * 0.76);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
};

/** Food can: printed label around the side, metal lids. */
export const Can: React.FC<{ p: V3; r?: number; h?: number; label: THREE.Texture }> = ({ p, r = 0.075, h = 0.22, label }) => (
  <mesh position={p} castShadow receiveShadow>
    <cylinderGeometry args={[r, r, h, 28]} />
    <meshStandardMaterial attach="material-0" map={label} roughness={0.5} metalness={0.1} />
    <meshStandardMaterial attach="material-1" color="#c9cfd4" roughness={0.3} metalness={0.9} />
    <meshStandardMaterial attach="material-2" color="#c9cfd4" roughness={0.3} metalness={0.9} />
  </mesh>
);

// ───────────────────────── primitives ─────────────────────────
const rbCache = new Map<string, RoundedBoxGeometry>();
const rbox = (s: V3, r: number) => {
  const k = `${s}|${r}`;
  if (!rbCache.has(k)) rbCache.set(k, new RoundedBoxGeometry(s[0], s[1], s[2], 3, Math.min(r, Math.min(...s) / 2 - 0.001)));
  return rbCache.get(k)!;
};

type MatProps = { color?: string; map?: THREE.Texture; rough?: number; metal?: number; emissive?: string; ei?: number; opacity?: number };
const Mat: React.FC<MatProps> = ({ color = "#fff", map, rough = 0.75, metal = 0, emissive, ei = 0, opacity }) => (
  <meshStandardMaterial color={color} map={map} roughness={rough} metalness={metal} emissive={emissive ?? "#000"} emissiveIntensity={ei} transparent={opacity !== undefined} opacity={opacity ?? 1} />
);

/** Rounded box (r = edge radius). */
export const RB: React.FC<{ p: V3; s: V3; r?: number; rot?: V3; cast?: boolean } & MatProps> = ({ p, s, r = 0.03, rot, cast = true, ...m }) => (
  <mesh position={p} rotation={rot} geometry={rbox(s, r)} castShadow={cast} receiveShadow>
    <Mat {...m} />
  </mesh>
);

/** Flat textured slab (floors, walls) — receives shadows, never casts. */
export const Slab: React.FC<{ p: V3; s: V3; rot?: V3 } & MatProps> = ({ p, s, rot, ...m }) => (
  <mesh position={p} rotation={rot} receiveShadow>
    <boxGeometry args={s} />
    <Mat {...m} />
  </mesh>
);

export const Cyl: React.FC<{ p: V3; r: number; h: number; rot?: V3; seg?: number; r2?: number } & MatProps> = ({ p, r, h, rot, seg = 24, r2, ...m }) => (
  <mesh position={p} rotation={rot} castShadow receiveShadow>
    <cylinderGeometry args={[r2 ?? r, r, h, seg]} />
    <Mat {...m} />
  </mesh>
);

// ───────────────────────── environment reflections ─────────────────────────
/** Soft studio environment (RoomEnvironment → PMREM) so metal and glossy surfaces reflect
 * something instead of rendering black. Low intensity: it is fill, not a light source. */
export const Env: React.FC<{ intensity?: number }> = ({ intensity = 0.35 }) => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = intensity;
    pm.dispose();
  }, [gl, scene, intensity]);
  return null;
};

// ───────────────────────── post stack ─────────────────────────
/** `ao={0}` drops the AO pass entirely (it still reads depth at intensity 0 and blotches huge depth ranges). */
export const Post: React.FC<{ bloom?: number; ao?: number; vignette?: number }> = ({ bloom = 0.9, ao = 1.6, vignette = 0.5 }) =>
  ao > 0 ? (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={0.5} intensity={ao} distanceFalloff={0.6} />
      <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.25} intensity={bloom} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={vignette} />
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.25} intensity={bloom} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={vignette} />
    </EffectComposer>
  );

/** Soft key light with a big shadow map (one per scene). */
export const KeyLight: React.FC<{ p: V3; target?: V3; intensity: number; color: string; size?: number }> = ({ p, target = [0, 0, 0], intensity, color, size = 8 }) => {
  const light = useMemo(() => {
    const l = new THREE.DirectionalLight(color, intensity);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    l.shadow.camera.left = l.shadow.camera.bottom = -size;
    l.shadow.camera.right = l.shadow.camera.top = size;
    l.shadow.bias = -0.0004;
    l.shadow.normalBias = 0.02;
    l.shadow.radius = 6;
    return l;
  }, [color, intensity, size]);
  light.position.set(...p);
  light.target.position.set(...target);
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
};

// ───────────────────────── furniture & props ─────────────────────────
export const Sofa: React.FC<{ p: V3; ry?: number; color?: string }> = ({ p, ry = 0, color = "#6d7f8f" }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, 0.22, 0]} s={[2.6, 0.32, 1.0]} r={0.08} color={shade(color, 0.85)} />
    {[-0.64, 0.64].map((x) => (
      <RB key={x} p={[x, 0.46, 0.05]} s={[1.24, 0.2, 0.86]} r={0.09} color={color} />
    ))}
    <RB p={[0, 0.72, -0.4]} s={[2.6, 0.72, 0.24]} r={0.1} color={shade(color, 0.9)} />
    {[-1.32, 1.32].map((x) => (
      <RB key={x} p={[x, 0.45, 0]} s={[0.24, 0.62, 1.0]} r={0.1} color={shade(color, 0.85)} />
    ))}
    <RB p={[0.9, 0.7, -0.22]} s={[0.5, 0.42, 0.16]} r={0.08} rot={[0.2, 0, 0.12]} color="#c9a46a" />
    {[-1.2, 1.2].map((x) =>
      [-0.4, 0.4].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.03, z]} r={0.04} h={0.06} color="#2b211b" />),
    )}
  </group>
);

export const Lamp: React.FC<{ p: V3; on?: number; color?: string }> = ({ p, on = 1, color = "#ffd29a" }) => (
  <group position={p}>
    <Cyl p={[0, 0.02, 0]} r={0.2} h={0.04} color="#2a2a2a" metal={0.5} rough={0.4} />
    <Cyl p={[0, 0.8, 0]} r={0.02} h={1.6} color="#2a2a2a" metal={0.6} rough={0.35} />
    <Cyl p={[0, 1.7, 0]} r={0.28} r2={0.18} h={0.32} seg={20} color="#f3e6cf" emissive={color} ei={1.6 * on} />
    <pointLight position={[0, 1.55, 0]} intensity={14 * on} distance={7} decay={1.6} color={color} castShadow={false} />
  </group>
);

/** Fiddle-leaf fig in a ceramic pot: a thin trunk with broad, glossy leaves at varied angles. */
export const Plant: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => {
  const r = seeded(17);
  const leaves = Array.from({ length: 26 }, (_, k) => {
    const h = 0.55 + (k / 26) * 0.95 + r() * 0.08;
    const a = k * 2.4 + r() * 0.6;
    const out = 0.12 + r() * 0.12;
    return { p: [Math.sin(a) * out, h, Math.cos(a) * out] as V3, a, tilt: 0.5 + r() * 0.5, sc: 0.8 + r() * 0.5, c: r() < 0.5 ? "#2f6b3a" : "#3d7f45" };
  });
  return (
    <group position={p} scale={s}>
      <Cyl p={[0, 0.2, 0]} r={0.19} r2={0.23} h={0.4} color="#e9e4da" rough={0.35} />
      <Cyl p={[0, 0.405, 0]} r={0.21} h={0.02} color="#3b2a1e" rough={1} />
      <Cyl p={[0, 0.9, 0]} r={0.022} r2={0.012} h={1.0} color="#6b4a32" />
      {leaves.map((l, k) => (
        <group key={k} position={l.p} rotation={[0, l.a, 0]}>
          <mesh rotation={[l.tilt, 0, 0]} position={[0, 0, 0.09]} scale={[0.09 * l.sc, 0.012, 0.15 * l.sc]} castShadow>
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial color={l.c} roughness={0.45} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const Bookshelf: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => {
  const r = seeded(5);
  const cols = ["#7b2e2e", "#2e4f7b", "#c9a14a", "#3f6b4a", "#e8e0d0", "#5a3f6b"];
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <RB p={[0, 1.0, 0]} s={[1.2, 2.0, 0.36]} r={0.02} color="#6b4a32" />
      {[0, 1, 2, 3].map((k) => (
        <group key={k} position={[0, 0.22 + k * 0.48, 0.03]}>
          {Array.from({ length: 9 }, (_, i) => {
            const h = 0.26 + r() * 0.12;
            return <RB key={i} p={[-0.48 + i * 0.12, h / 2, 0]} s={[0.1, h, 0.26]} r={0.01} color={cols[Math.floor(r() * cols.length)]} />;
          })}
        </group>
      ))}
    </group>
  );
};

export const Frame: React.FC<{ p: V3; s: [number, number]; ry?: number; art: string }> = ({ p, s, ry = 0, art }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, 0, 0]} s={[s[0], s[1], 0.04]} r={0.01} color="#2a2018" />
    <mesh position={[0, 0, 0.022]}>
      <planeGeometry args={[s[0] * 0.82, s[1] * 0.82]} />
      <Mat color={art} rough={0.9} />
    </mesh>
  </group>
);

/** Window in a wall facing +z (or rotated): frame, mullions, glowing sky pane, curtains. */
export const Window: React.FC<{ p: V3; s: [number, number]; ry?: number; sky: string; glow?: number; curtains?: string }> = ({ p, s, ry = 0, sky, glow = 1, curtains }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <mesh>
      <planeGeometry args={s} />
      <meshStandardMaterial color={sky} emissive={sky} emissiveIntensity={glow} />
    </mesh>
    {[-s[0] / 2, s[0] / 2].map((x) => (
      <RB key={x} p={[x, 0, 0.04]} s={[0.08, s[1] + 0.08, 0.1]} r={0.01} color="#efeae0" />
    ))}
    {[-s[1] / 2, s[1] / 2, 0].map((y) => (
      <RB key={y} p={[0, y, 0.04]} s={[s[0], y === 0 ? 0.05 : 0.08, 0.1]} r={0.01} color="#efeae0" />
    ))}
    <RB p={[0, 0, 0.04]} s={[0.05, s[1], 0.08]} r={0.01} color="#efeae0" />
    <RB p={[0, -s[1] / 2 - 0.06, 0.1]} s={[s[0] + 0.3, 0.06, 0.22]} r={0.02} color="#efeae0" />
    {curtains
      ? [-1, 1].map((d) => <RB key={d} p={[d * (s[0] / 2 + 0.12), 0.05, 0.14]} s={[0.36, s[1] + 0.5, 0.06]} r={0.03} color={curtains} />)
      : null}
  </group>
);

export const Rug: React.FC<{ p: V3; s: [number, number]; color: string }> = ({ p, s, color }) => (
  <mesh position={p} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={s} />
    <Mat map={tex("carpet", color, [1, 1], 3)} rough={1} />
  </mesh>
);

export const Fridge: React.FC<{ p: V3; ry?: number; color?: string }> = ({ p, ry = 0, color = "#e9ebec" }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, 0.95, 0]} s={[0.86, 1.9, 0.74]} r={0.06} color={color} rough={0.35} />
    <RB p={[0, 1.32, 0.375]} s={[0.84, 0.02, 0.02]} r={0.005} color="#c9cdd1" />
    {[1.62, 0.95].map((y) => (
      <RB key={y} p={[0.34, y, 0.4]} s={[0.04, 0.4, 0.05]} r={0.015} color="#aeb3b8" metal={0.7} rough={0.3} />
    ))}
    <RB p={[-0.2, 1.62, 0.38]} s={[0.12, 0.08, 0.01]} r={0.01} color="#e05a3c" />
    <RB p={[-0.05, 1.5, 0.38]} s={[0.1, 0.1, 0.01]} r={0.01} color="#3c7ae0" />
  </group>
);

/** Panel front door (+ tall frosted sidelight to the right). `sideGlow` lights the glass from outside. */
export const FrontDoor: React.FC<{ p: V3; sideGlow?: number; shake?: number }> = ({ p, sideGlow = 0, shake = 0 }) => (
  <group position={p} rotation={[0, shake, 0]}>
    <RB p={[0, 1.07, 0]} s={[1.0, 2.14, 0.07]} r={0.01} color="#7a3b26" />
    {[0.55, 1.5].map((y) =>
      [-0.22, 0.22].map((x) => <RB key={`${x}${y}`} p={[x, y, 0.04]} s={[0.34, y > 1 ? 0.7 : 0.6, 0.02]} r={0.01} color="#6b321f" />),
    )}
    <Cyl p={[0.38, 1.02, 0.07]} r={0.035} h={0.06} rot={[Math.PI / 2, 0, 0]} color="#c9a64a" metal={0.8} rough={0.25} />
    <RB p={[0.0, 2.2, 0]} s={[1.9, 0.12, 0.14]} r={0.02} color="#efeae0" />
    <RB p={[0.75, 1.1, 0]} s={[0.42, 2.14, 0.1]} r={0.01} color="#efeae0" />
    <mesh position={[0.75, 1.15, 0.056]}>
      <planeGeometry args={[0.28, 1.7]} />
      <meshStandardMaterial color="#b9c8de" emissive="#7f9fd6" emissiveIntensity={0.15 + sideGlow} roughness={0.6} />
    </mesh>
  </group>
);

export const Bathtub: React.FC<{ p: V3; level: number }> = ({ p, level }) => (
  <group position={p}>
    {/* rim + walls as rounded boxes, hollow inside */}
    <RB p={[0, 0.03, 0]} s={[1.9, 0.06, 0.86]} r={0.03} color="#f6f6f4" rough={0.25} />
    <RB p={[0, 0.3, -0.4]} s={[1.9, 0.6, 0.1]} r={0.04} color="#f6f6f4" rough={0.25} />
    <RB p={[0, 0.3, 0.4]} s={[1.9, 0.6, 0.1]} r={0.04} color="#f6f6f4" rough={0.25} />
    <RB p={[-0.9, 0.3, 0]} s={[0.1, 0.6, 0.86]} r={0.04} color="#f6f6f4" rough={0.25} />
    <RB p={[0.9, 0.3, 0]} s={[0.1, 0.6, 0.86]} r={0.04} color="#f6f6f4" rough={0.25} />
    <mesh position={[0, 0.07 + 0.48 * level, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.72, 0.72]} />
      <meshPhysicalMaterial color="#69b8de" roughness={0.05} transmission={0} transparent opacity={0.82} clearcoat={1} />
    </mesh>
    {/* faucet + running water */}
    <Cyl p={[0.78, 0.72, -0.36]} r={0.03} h={0.24} color="#cfd5da" metal={0.9} rough={0.2} />
    <RB p={[0.7, 0.82, -0.36]} s={[0.2, 0.05, 0.05]} r={0.02} color="#cfd5da" metal={0.9} rough={0.2} />
    {level < 0.99 ? <Cyl p={[0.62, 0.45 + 0.24 * level, -0.36]} r={0.018} h={0.7 - 0.48 * level} color="#a9dcf5" emissive="#bfe8ff" ei={0.3} opacity={0.7} /> : null}
  </group>
);

/** Blocky survivor (red beanie, olive jacket) — seen from behind/side, like the reference reels. */
export const Survivor: React.FC<{ p: V3; ry?: number; seated?: boolean; jacket?: string; beanie?: string }> = ({ p, ry = 0, seated, jacket = "#4c5a3c", beanie = "#c0392b" }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, seated ? 0.78 : 1.2, 0]} s={[0.56, 0.7, 0.34]} r={0.1} color={jacket} />
    <RB p={[0, seated ? 1.22 : 1.64, 0]} s={[0.3, 0.32, 0.3]} r={0.1} color="#d9a98a" />
    <RB p={[0, seated ? 1.38 : 1.8, 0]} s={[0.33, 0.16, 0.33]} r={0.08} color={beanie} />
    {[-0.34, 0.34].map((x) => (
      <RB key={x} p={[x, seated ? 0.72 : 1.12, seated ? 0.12 : 0]} s={[0.16, 0.6, 0.18]} r={0.07} rot={[seated ? -0.5 : 0, 0, 0]} color={jacket} />
    ))}
    {[-0.13, 0.13].map((x) =>
      seated ? (
        <group key={x}>
          <RB p={[x, 0.46, 0.25]} s={[0.2, 0.18, 0.5]} r={0.07} color="#2c3440" />
          <RB p={[x, 0.22, 0.5]} s={[0.18, 0.46, 0.18]} r={0.07} color="#2c3440" />
        </group>
      ) : (
        <RB key={x} p={[x, 0.42, 0]} s={[0.2, 0.84, 0.2]} r={0.07} color="#2c3440" />
      ),
    )}
  </group>
);

// ───────────────────────── exterior ─────────────────────────
export const Tree: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <Cyl p={[0, 0.8, 0]} r={0.16} h={1.6} color="#5a3d2b" />
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0, 1.8 + i * 0.85, 0]} castShadow>
        <coneGeometry args={[1.4 - i * 0.35, 1.6, 7]} />
        <Mat color={["#2f5a37", "#386840", "#427548"][i]} rough={0.9} />
      </mesh>
    ))}
  </group>
);

export const Streetlight: React.FC<{ p: V3; on?: number }> = ({ p, on = 1 }) => (
  <group position={p}>
    <Cyl p={[0, 2.4, 0]} r={0.07} h={4.8} color="#2f3236" metal={0.6} rough={0.4} />
    <RB p={[0, 4.85, 0.5]} s={[0.16, 0.1, 1.0]} r={0.03} color="#2f3236" />
    <RB p={[0, 4.78, 0.95]} s={[0.32, 0.08, 0.5]} r={0.03} color="#fff2c8" emissive="#ffd99a" ei={3 * on} />
    <pointLight position={[0, 4.5, 1.0]} intensity={60 * on} distance={16} decay={1.5} color="#ffd79a" />
  </group>
);

/** Suburban house facing +z: siding, shingled roof, porch, framed windows, door. */
export const House: React.FC<{ p: V3; siding: string; lit: number; seed?: number }> = ({ p, siding, lit, seed = 1 }) => {
  const sid = tex("siding", siding, [3, 2], seed);
  const sh = tex("shingles", "#4a4340", [3, 2], seed + 1);
  return (
    <group position={p}>
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 3.4, 5]} />
        <Mat map={sid} rough={0.85} />
      </mesh>
      {/* gabled roof: two slabs */}
      {[-1, 1].map((d) => (
        <mesh key={d} position={[0, 4.15, d * 1.3]} rotation={[d * 0.62, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.6, 0.14, 3.2]} />
          <Mat map={sh} rough={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 4.15, 0]} castShadow>
        <boxGeometry args={[5.98, 1.75, 0.01]} />
        <Mat map={sid} />
      </mesh>
      <RB p={[1.9, 4.8, -0.6]} s={[0.5, 1.2, 0.5]} r={0.03} color="#7d3f32" />
      {/* porch */}
      <RB p={[0, 0.12, 2.9]} s={[3.2, 0.24, 1.2]} r={0.03} color="#cfc8bb" />
      {[-1.45, 1.45].map((x) => (
        <RB key={x} p={[x, 1.4, 3.35]} s={[0.12, 2.4, 0.12]} r={0.02} color="#efeae0" />
      ))}
      <RB p={[0, 2.62, 3.0]} s={[3.4, 0.12, 1.4]} r={0.02} color="#efeae0" />
      <RB p={[0, 1.1, 2.51]} s={[0.95, 2.0, 0.06]} r={0.01} color="#2f4a5e" />
      {[-1.9, 1.9].map((x) =>
        [1.2, 2.6].map((y) => (
          <group key={`${x}${y}`} position={[x, y, 2.51]}>
            <mesh>
              <planeGeometry args={[0.95, 0.8]} />
              <meshStandardMaterial color={lit > 0.05 ? "#ffcf8a" : "#1b2230"} emissive="#ffbf70" emissiveIntensity={1.4 * lit} />
            </mesh>
            {[-0.5, 0.5].map((xx) => (
              <RB key={xx} p={[xx, 0, 0.04]} s={[0.06, 0.92, 0.06]} r={0.01} color="#efeae0" />
            ))}
            {[-0.42, 0.42, 0].map((yy) => (
              <RB key={yy} p={[0, yy, 0.04]} s={[1.0, 0.06, 0.06]} r={0.01} color="#efeae0" />
            ))}
          </group>
        )),
      )}
      {lit > 0.05 ? <pointLight position={[0, 1.8, 3.4]} intensity={6 * lit} distance={6} color="#ffbf70" /> : null}
    </group>
  );
};

export const Car: React.FC<{ p: V3; color: string; ry?: number; tail?: number; head?: number }> = ({ p, color, ry = 0, tail = 0, head = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, 0.5, 0]} s={[1.8, 0.62, 4.3]} r={0.18} color={color} rough={0.35} metal={0.3} />
    <RB p={[0, 0.98, -0.25]} s={[1.6, 0.52, 2.3]} r={0.16} color={color} rough={0.35} metal={0.3} />
    <RB p={[0, 0.98, -0.25]} s={[1.62, 0.36, 2.0]} r={0.12} color="#1b2533" rough={0.1} metal={0.6} />
    {[-0.72, 0.72].map((x) =>
      [-1.35, 1.35].map((z) => <Cyl key={`${x}${z}`} p={[x * 1.1, 0.3, z]} r={0.32} h={0.24} rot={[0, 0, Math.PI / 2]} color="#141414" />),
    )}
    {[-0.62, 0.62].map((x) => (
      <RB key={x} p={[x, 0.62, 2.16]} s={[0.36, 0.14, 0.04]} r={0.02} color="#ff2a1a" emissive="#ff2a1a" ei={0.6 + 3.5 * tail} />
    ))}
    {[-0.6, 0.6].map((x) => (
      <RB key={x} p={[x, 0.6, -2.16]} s={[0.34, 0.14, 0.04]} r={0.02} color="#fff6e0" emissive="#fff3d0" ei={3 * head} />
    ))}
  </group>
);
