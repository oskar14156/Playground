import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, V3 } from "../../lib/three/core";
import { Car, Cyl, Env, KeyLight, Plant, Post, RB, Rug, Slab, Streetlight, tex, Window } from "../../lib/three/diorama";
import { Bathtub } from "../../lib/three/diorama";
import { brickTex, cobbleTex, ctex, RollHolder, SoilPipe, strataTex, Toilet, TowelRail, Vanity } from "./props";
import { usePbr } from "../../lib/three/pbr";

// ───────────────────────── canvas ─────────────────────────
export type Look = "interior" | "day" | "overcast" | "sepia" | "tunnel" | "night" | "museum";
/** One canvas for every sewer set: background/fog/lights per look, AO + bloom + ACES. */
export const SewerCanvas: React.FC<{ cam: Cam; t: number; look: Look; children: React.ReactNode; ao?: number; key2?: V3; keyI?: number; shadow?: number; fog?: [number, number]; bg?: string }> = ({ cam, t, look, children, ao = 1.2, key2, keyI, shadow = 30, fog, bg: bgIn }) => {
  const { width, height } = useVideoConfig();
  const outdoor = look === "day" || look === "overcast";
  const dark = look === "tunnel" || look === "night";
  const bg = bgIn ?? (look === "day" ? "#b9d3ea" : look === "overcast" ? "#9aa6ae" : look === "sepia" ? "#b9a582" : look === "tunnel" ? "#05070a" : look === "night" ? "#0a0f1c" : look === "museum" ? "#10141c" : "#2a3036");
  const fg = fog ?? (outdoor ? [120, 700] : dark ? [8, 60] : [30, 160]);
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.03, far: 3000 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      {outdoor ? <SkyDome grey={look === "overcast"} /> : null}
      <fog attach="fog" args={[bg, fg[0], fg[1]]} />
      <hemisphereLight args={[outdoor ? "#e6f0ff" : look === "sepia" ? "#fff0d0" : dark ? "#2a3a58" : "#fff4e6", outdoor ? "#7a6e58" : "#141210", outdoor ? 0.55 : dark ? 0.18 : look === "sepia" ? 0.75 : 0.6]} />
      <KeyLight
        p={key2 ?? (outdoor ? [cam.look[0] - 60, cam.look[1] + 90, cam.look[2] + 60] : [cam.look[0] + 3, cam.look[1] + 9, cam.look[2] + 7])}
        target={cam.look}
        intensity={keyI ?? (look === "day" ? 2.0 : look === "overcast" ? 1.1 : dark ? 0.25 : look === "sepia" ? 1.5 : 1.3)}
        color={outdoor ? "#fff0d8" : dark ? "#9fb4ff" : "#fff3e2"}
        size={shadow}
      />
      {children}
      <Env intensity={outdoor ? 0.4 : dark ? 0.05 : 0.25} />
      <Post bloom={dark ? 0.9 : 0.5} ao={ao} vignette={0.45} />
    </ThreeCanvas>
  );
};

const SkyDome: React.FC<{ grey?: boolean }> = ({ grey }) => {
  const mat = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 4;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, grey ? "#7d8a94" : "#5f95d4");
    gr.addColorStop(0.55, grey ? "#a3adb4" : "#a9c9ea");
    gr.addColorStop(1, grey ? "#c3c8cb" : "#e9eef0");
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const tx = new THREE.CanvasTexture(cv);
    tx.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: tx, side: THREE.BackSide, fog: false, depthWrite: false });
  }, [grey]);
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[2000, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2 + 0.1]} />
    </mesh>
  );
};

/** spot light with its target in the scene */
export const Spot: React.FC<{ p: V3; target: V3; angle: number; penumbra?: number; intensity: number; distance: number; color?: string }> = ({ p, target, angle, penumbra = 0.6, intensity, distance, color = "#ffffff" }) => {
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

// ───────────────────────── the bathroom (doll's house cut) ─────────────────────────
export const BATH = { x0: -1.4, x1: 1.4, z0: -1.1, z1: 1.1, h: 2.6 };
export const TOILET_P: V3 = [0.05, 0, -0.73];
/** Bathroom, front open (+Z). Floor y = 0; below it a cut through the floor + the wall void with the soil pipe. */
export const Bathroom: React.FC<{ t: number; swirl?: number; press?: number; xray?: number; children?: React.ReactNode }> = ({ t, swirl = 0, press = 0, xray = 0, children }) => {
  const { x0, x1, z0, z1, h } = BATH;
  const W = x1 - x0,
    D = z1 - z0;
  const floor = tex("tiles", "#d8d4cc", [6, 5], 4);
  const wallTile = tex("tiles", "#e9eef0", [7, 3], 2);
  const paint = tex("plaster", "#9fc6bf", [3, 2], 5);
  return (
    <group>
      {/* floor + cut slab */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floor} roughness={0.35} />
      </mesh>
      <Slab p={[0, -0.14, 0]} s={[W + 0.2, 0.26, D]} color="#c9b48a" map={tex("planks", "#b59b6e", [4, 1], 3)} />
      {[-1.0, -0.4, 0.2, 0.8].map((x) => (
        <RB key={x} p={[x, -0.37, 0]} s={[0.07, 0.2, D]} r={0.01} color="#9a7c52" />
      ))}
      {/* walls: back + left + right, tiles to 1.2 m then paint */}
      <RB p={[0, 0.6, z0 - 0.05]} s={[W + 0.2, 1.2, 0.1]} r={0.01} map={wallTile} color="#ffffff" rough={0.25} />
      <RB p={[0, 1.2 + (h - 1.2) / 2, z0 - 0.05]} s={[W + 0.2, h - 1.2, 0.1]} r={0.01} map={paint} color="#ffffff" />
      {[x0 - 0.05, x1 + 0.05].map((x, k) => (
        <group key={x}>
          <RB p={[x, 0.6, 0]} s={[0.1, 1.2, D]} r={0.01} map={wallTile} color="#ffffff" rough={0.25} />
          <RB p={[x, 1.2 + (h - 1.2) / 2, 0]} s={[0.1, h - 1.2, D]} r={0.01} map={paint} color="#ffffff" />
          {/* wall cut edge (shows thickness) */}
          <RB p={[x, h / 2 - 0.2, z1 + 0.01]} s={[0.12, h + 0.4, 0.02]} r={0.005} color={k ? "#b8b0a2" : "#b8b0a2"} />
        </group>
      ))}
      <RB p={[0, 1.2, z0 + 0.005]} s={[W, 0.04, 0.02]} r={0.005} color="#2f6d7a" />
      <Window p={[x0 + 0.01, 1.75, -0.15]} ry={Math.PI / 2} s={[0.9, 0.8]} sky="#cfe6f5" glow={0.8} />
      {/* furniture */}
      <Bathtub p={[x0 + 0.45, 0, -0.12]} level={0.55} />
      <Toilet p={TOILET_P} t={t} swirl={swirl} press={press} />
      <Vanity p={[0.85, 0, z0 + 0.25]} />
      <TowelRail p={[x1 - 0.01, 1.1, 0.35]} ry={-Math.PI / 2} />
      <RollHolder p={[0.42, 0.72, z0 + 0.01]} />
      <Rug p={[-0.6, 0.005, 0.55]} s={[0.8, 0.5]} color="#6aa6a0" />
      <Plant p={[x1 - 0.28, 0, z0 + 0.95]} />
      {/* below the floor: dark wall void + the soil pipe (x-ray teal when `xray`) */}
      <Slab p={[0, -2.0, z0 - 0.1]} s={[W + 0.2, 3.3, 0.1]} color="#2a2724" map={brickTex([4, 4], "#5a4a40")} />
      {[x0 - 0.05, x1 + 0.05].map((x) => (
        <Slab key={x} p={[x, -2.0, 0]} s={[0.1, 3.3, D]} color="#2a2724" />
      ))}
      <SoilPipe from={[TOILET_P[0], -0.02, z0 + 0.12]} drop={3.4} run={0.01} color={xray > 0.5 ? "#26c6d9" : "#8a9096"} />
      {xray > 0.01 ? (
        <mesh position={[TOILET_P[0], -1.72, z0 + 0.12]}>
          <cylinderGeometry args={[0.075, 0.075, 3.4, 18, 1, true]} />
          <meshStandardMaterial color="#5ff2ff" emissive="#26c6d9" emissiveIntensity={1.2} transparent opacity={0.35 * xray} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
      <pointLight position={[0, 2.3, 0.4]} intensity={4} distance={6} color="#fff1dc" />
      {children}
    </group>
  );
};

// ───────────────────────── Victorian terraced houses ─────────────────────────
const sashTex = () =>
  ctex("sash", 128, 192, (g) => {
    g.fillStyle = "#e9e5dc";
    g.fillRect(0, 0, 128, 192);
    g.fillStyle = "#2b3a44";
    for (const [x, y] of [
      [10, 10],
      [68, 10],
      [10, 100],
      [68, 100],
    ])
      g.fillRect(x, y, 50, 82);
    g.fillStyle = "rgba(200,225,240,0.35)";
    g.fillRect(14, 14, 20, 30);
    g.fillRect(72, 104, 20, 30);
  });

/**
 * A row of `n` London terraced houses (each 5 m wide, 3 storeys + slate roof), front facing +Z, origin at the
 * left front corner on the ground. `brick` = facade colour. `lit` 0..1 warm windows (night).
 */
export const Terrace: React.FC<{ p: V3; n?: number; ry?: number; brick?: string; lit?: number; depth?: number; stoops?: boolean }> = ({ p, n = 4, ry = 0, brick = "#b5915c", lit = 0, depth = 9, stoops = false }) => {
  const W = 5,
    H = 10.5;
  const bt = brickTex([2, 4], brick);
  const roof = tex("shingles", "#4a5058", [4, 2], 3);
  const sash = sashTex();
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {Array.from({ length: n }, (_, i) => {
        const x = i * W + W / 2;
        const dy = stoops ? 1.02 : 0;
        return (
          <group key={i} position={[x, 0, 0]}>
            <RB p={[0, H / 2, -depth / 2]} s={[W - 0.04, H, depth]} r={0.02} map={bt} color="#ffffff" rough={0.9} />
            {/* stucco ground floor band + cornice */}
            <RB p={[0, 1.6, 0.03]} s={[W, 3.2, 0.08]} r={0.01} color="#e6dfcf" rough={0.8} />
            <RB p={[0, H - 0.3, 0.12]} s={[W + 0.05, 0.35, 0.3]} r={0.03} color="#e6dfcf" rough={0.8} />
            {/* door with fanlight */}
            <RB p={[-1.4, 1.25 + dy, 0.09]} s={[1.0, 2.3, 0.06]} r={0.02} color={["#1f3a5f", "#5a1f24", "#1d3b2a", "#222"][i % 4]} rough={0.4} />
            <mesh position={[-1.4, 2.62 + dy, 0.08]}>
              <circleGeometry args={[0.5, 20, 0, Math.PI]} />
              <meshStandardMaterial color={lit > 0 ? "#f4c56a" : "#33424c"} emissive={lit > 0 ? "#f4b04a" : "#000"} emissiveIntensity={lit * 1.2} />
            </mesh>
            {stoops ? null : <RB p={[-1.4, 0.08, 0.35]} s={[1.3, 0.16, 0.6]} r={0.02} color="#bdb6a8" />}
            {stoops ? (
              <group position={[-1.4, 0, 0.1]}>
                {Array.from({ length: 6 }, (_, k) => (
                  <RB key={k} p={[0, 0.09 + k * 0.17, 1.55 - k * 0.27]} s={[1.5, 0.18, 0.3 + (5 - k) * 0.27 * 0]} r={0.02} color="#7a5644" rough={0.9} />
                ))}
                {Array.from({ length: 6 }, (_, k) => (
                  <RB key={`f${k}`} p={[0, 0.045 + k * 0.085, 1.55 - k * 0.27 + 0.02]} s={[1.46, 0.09 + k * 0.17, 0.3]} r={0.01} color="#6b4b3a" rough={0.9} />
                ))}
                {[-0.8, 0.8].map((x) => (
                  <group key={x}>
                    <RB p={[x, 0.55, 0.85]} s={[0.12, 1.1, 1.5]} r={0.02} rot={[-0.56, 0, 0]} color="#5a3e30" />
                    <Cyl p={[x, 1.25, 0.82]} r={0.025} h={1.8} rot={[Math.PI / 2 - 0.56, 0, 0]} color="#1a1a1a" metal={0.6} rough={0.4} />
                    <Cyl p={[x, 0.55, 1.7]} r={0.03} h={1.0} color="#1a1a1a" metal={0.6} rough={0.4} />
                  </group>
                ))}
              </group>
            ) : null}
            {/* sash windows: ground floor 1, upper floors 2 each */}
            {[
              [1.1, 1.7],
              [-1.2, 4.9],
              [1.1, 4.9],
              [-1.2, 8.0],
              [1.1, 8.0],
            ].map(([wx, wy], k) => (
              <group key={k} position={[wx, wy, 0.08]}>
                <mesh>
                  <planeGeometry args={[1.1, 1.75]} />
                  <meshStandardMaterial map={sash} color="#ffffff" emissive={lit > 0 && (i + k) % 3 !== 1 ? "#ffc070" : "#000"} emissiveIntensity={lit * 0.9} roughness={0.3} />
                </mesh>
                <RB p={[0, -0.95, 0.06]} s={[1.3, 0.1, 0.16]} r={0.02} color="#e6dfcf" />
                <RB p={[0, 0.95, 0.04]} s={[1.3, 0.12, 0.1]} r={0.02} color="#e6dfcf" />
              </group>
            ))}
            {/* slate roof + chimney stack with pots on the party wall */}
            <mesh position={[0, H + 1.4, -depth / 2]} rotation={[0, 0, 0]} castShadow>
              <boxGeometry args={[W, 0.01, 0.01]} />
            </mesh>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[0, H + 1.35, -depth / 2 + s * depth * 0.25]} rotation={[s * 0.55, 0, 0]} castShadow>
                <boxGeometry args={[W, 0.12, depth * 0.58]} />
                <meshStandardMaterial map={roof} color="#ffffff" roughness={0.8} />
              </mesh>
            ))}
            <RB p={[W / 2 - 0.02, H + 2.2, -depth / 2]} s={[0.7, 1.6, 1.3]} r={0.03} map={bt} color="#ffffff" />
            {[-0.35, 0.0, 0.35].map((z) => (
              <Cyl key={z} p={[W / 2 - 0.02, H + 3.15, -depth / 2 + z]} r={0.11} r2={0.09} h={0.35} color="#b5653e" rough={0.8} />
            ))}
          </group>
        );
      })}
    </group>
  );
};

// ───────────────────────── London cross-section (street → sewer → river) ─────────────────────────
/** Bazalgette egg profile (inner height h, scaled by k), invert at y = 0 */
export const eggShape = (h: number, k = 1): THREE.Shape => {
  const s = new THREE.Shape();
  const c = 0.45 * h; // scale centre, so outer and inner eggs are concentric and the inner invert sits at y = 0
  const R = (h / 3) * k;
  const r = (h / 6) * k;
  const top = c + (h - h / 3 - c) * k;
  const bot = c + (h / 6 - c) * k;
  s.absarc(0, top, R, 0, Math.PI, false);
  s.absarc(0, bot, r, Math.PI, Math.PI * 2, false);
  s.lineTo(R, top);
  return s;
};
export type Hole = { x: number; y: number; h?: number; circle?: number };
/** front (+Z) face of a ground block with tunnel holes, strata texture mapped over the face */
const CutFace: React.FC<{ x0: number; x1: number; y0: number; y1: number; holes?: Hole[]; tint?: string }> = ({ x0, x1, y0, y1, holes = [], tint = "#ffffff" }) => {
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(x0, y0);
    sh.lineTo(x1, y0);
    sh.lineTo(x1, y1);
    sh.lineTo(x0, y1);
    sh.lineTo(x0, y0);
    for (const hl of holes) {
      if (hl.x < x0 || hl.x > x1) continue;
      if (hl.circle) {
        const c = new THREE.Path();
        c.absarc(hl.x, hl.y, hl.circle, 0, Math.PI * 2, true);
        sh.holes.push(c);
      } else {
        const e = eggShape(hl.h ?? 2.7, 1.32);
        const pts = e.getPoints(24).map((v) => new THREE.Vector2(v.x + hl.x, v.y + hl.y)).reverse();
        sh.holes.push(new THREE.Path(pts));
      }
    }
    const g = new THREE.ShapeGeometry(sh, 24);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - x0) / 9, (pos.getY(i) - y0) / (y1 - y0));
    return g;
  }, [x0, x1, y0, y1, JSON.stringify(holes)]);
  const strata = strataTex();
  return (
    <mesh geometry={geo} position={[0, 0, 0.001]} receiveShadow>
      <meshStandardMaterial map={strata} color={tint} roughness={1} />
    </mesh>
  );
};
/**
 * The ground cut open at z = 0 (front face shows soil strata), street on top (y = 0), the Thames on the right (x > 0).
 * `era`: "1850" mud bank + pipe straight into the river; "1860" brick interceptor + embankment; "modern" asphalt, cars.
 */
export const SECTION = { river0: 6, river1: 46, riverY: -2.2, bedY: -8, groundY: -16, depthZ: 34 };
export const Section: React.FC<{ t: number; era: "1850" | "1860" | "modern"; river?: number; dirty?: number; deep?: number; holes?: Hole[]; cars?: boolean; children?: React.ReactNode }> = ({ t, era, river = 1, dirty = 0, deep = 16, holes = [], cars = true, children }) => {
  const { river0, river1, riverY, bedY, depthZ } = SECTION;
  const top = era === "modern" ? tex("asphalt", "#3d4044", [8, 6], 2) : cobbleTex([16, 12]);
  const water = useMemo(() => new THREE.Color("#3f7590").lerp(new THREE.Color("#6a5a32"), dirty), [dirty]);
  return (
    <group>
      {/* street ground block, cut face toward +Z */}
      <mesh position={[(-40 + river0) / 2, -deep / 2, -depthZ / 2]} receiveShadow>
        <boxGeometry args={[river0 + 40, deep, depthZ]} />
        <meshStandardMaterial attach="material-0" color="#6a6458" roughness={1} />
        <meshStandardMaterial attach="material-1" color="#6a6458" roughness={1} />
        <meshStandardMaterial attach="material-2" map={top} color="#ffffff" roughness={0.9} />
        <meshStandardMaterial attach="material-3" color="#6a6458" roughness={1} />
        <meshStandardMaterial attach="material-4" visible={false} />
        <meshStandardMaterial attach="material-5" color="#6a6458" roughness={1} />
      </mesh>
      <CutFace x0={-40} x1={river0} y0={-deep} y1={0} holes={holes} />
      {/* river bed block under the water */}
      <mesh position={[(river0 + river1) / 2, (bedY - deep) / 2, -depthZ / 2]} receiveShadow>
        <boxGeometry args={[river1 - river0, deep + bedY, depthZ]} />
        <meshStandardMaterial attach="material-0" color="#5a5040" roughness={1} />
        <meshStandardMaterial attach="material-1" color="#5a5040" roughness={1} />
        <meshStandardMaterial attach="material-2" color="#4a4436" roughness={1} />
        <meshStandardMaterial attach="material-3" color="#5a5040" roughness={1} />
        <meshStandardMaterial attach="material-4" visible={false} />
        <meshStandardMaterial attach="material-5" color="#5a5040" roughness={1} />
      </mesh>
      <CutFace x0={river0} x1={river1} y0={-deep} y1={bedY} holes={holes} tint="#d8d0c0" />
      {/* river bank: sloping mud (1850) or a granite embankment wall (1860+) */}
      {era === "1850" ? (
        <MudBank x0={river0} y0={0} y1={bedY} w={3.4} depth={depthZ} />
      ) : (
        // front face 3 cm behind the cut face (z = 0): coplanar faces z-fought and blinked in single frames
        <RB p={[river0 - 0.6, (0 + bedY) / 2, -depthZ / 2]} s={[1.6, -bedY + 0.3, depthZ - 0.06]} r={0.05} color="#9a958a" rough={0.9} map={brickTex([depthZ / 2, 4], "#9a958a")} />
      )}
      {/* water: cut face + surface */}
      {river > 0.01 ? (
        <group>
          <mesh position={[(river0 + river1) / 2 + 0.2, (riverY + bedY) / 2, -depthZ / 2]}>
            <boxGeometry args={[river1 - river0 - 0.4, riverY - bedY, depthZ - 0.02]} />
            <meshPhysicalMaterial color={water} roughness={0.15} transparent opacity={0.82} clearcoat={1} />
          </mesh>
          <mesh position={[(river0 + river1) / 2, riverY + 0.01, -depthZ / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[river1 - river0, depthZ, 1, 1]} />
            <meshPhysicalMaterial color={water} roughness={0.08} clearcoat={1} normalMap={rippleTex(t)} normalScale={new THREE.Vector2(0.4, 0.4)} />
          </mesh>
        </group>
      ) : null}
      {/* far bank */}
      <mesh position={[river1 + 20, -4, -depthZ / 2]}>
        <boxGeometry args={[40, 8, depthZ]} />
        <meshStandardMaterial color="#5e7a46" roughness={1} />
      </mesh>
      {/* street furniture by era */}
      {era === "modern" && cars ? (
        <>
          <Car p={[-14, 0, -6]} color="#c0392b" ry={Math.PI / 2} />
          <Car p={[-24, 0, -4]} color="#2f6db5" ry={-Math.PI / 2} />
          {[-30, -18, -6].map((x) => (
            <Streetlight key={x} p={[x, 0.16, -9.6]} on={0} />
          ))}
        </>
      ) : null}
      {children}
    </group>
  );
};

/** sloping mud bank (1850, before the embankment): a wedge from the street edge down to the river bed */
const MudBank: React.FC<{ x0: number; y0: number; y1: number; w: number; depth: number }> = ({ x0, y0, y1, w, depth }) => {
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(x0, y0);
    sh.lineTo(x0 + w, y1);
    sh.lineTo(x0, y1);
    sh.lineTo(x0, y0);
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
    g.translate(0, 0, -depth);
    return g;
  }, [x0, y0, y1, w, depth]);
  return (
    <mesh geometry={geo} receiveShadow castShadow>
      <meshStandardMaterial color="#5b4a34" roughness={1} />
    </mesh>
  );
};

const rippleCache: { t?: THREE.CanvasTexture } = {};
const rippleTex = (t: number) => {
  if (!rippleCache.t) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const g = cv.getContext("2d")!;
    const img = g.createImageData(256, 256);
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const a = Math.sin((x / 256) * Math.PI * 8 + Math.sin((y / 256) * Math.PI * 6) * 1.5);
        const b = Math.cos((y / 256) * Math.PI * 10 + Math.sin((x / 256) * Math.PI * 4));
        const i = (y * 256 + x) * 4;
        img.data[i] = 128 + a * 50;
        img.data[i + 1] = 128 + b * 50;
        img.data[i + 2] = 255;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    const tx = new THREE.CanvasTexture(cv);
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(6, 4);
    rippleCache.t = tx;
  }
  rippleCache.t.offset.set(t * 0.02, t * 0.013);
  return rippleCache.t;
};

/**
 * Egg-shaped brick sewer (Bazalgette profile) running along Z from z0 to z1, inner height `h` (width = 2/3 h).
 * `built` 0..1 builds it from z1 (front) backwards. `flow` water depth in metres, `water` colour.
 */
export const EggSewer: React.FC<{ p: V3; h?: number; z0?: number; z1?: number; built?: number; flow?: number; water?: string; t?: number; glow?: number }> = ({ p, h = 2.7, z0 = -30, z1 = 0, built = 1, flow = 0.4, water = "#5d5a3a", t = 0, glow = 0 }) => {
  const geo = useMemo(() => {
    const outer = eggShape(h, 1.32);
    outer.holes.push(new THREE.Path(eggShape(h, 1).getPoints(24).reverse()));
    const L = Math.max(0.01, (z1 - z0) * built);
    const g = new THREE.ExtrudeGeometry(outer, { depth: L, bevelEnabled: false, curveSegments: 24 });
    g.translate(0, 0, -L);
    return { g, L };
  }, [h, z0, z1, built]);
  const pb = usePbr("red_brick_03", [0.5, 0.5]);
  return (
    <group position={[p[0], p[1], p[2] + z1]}>
      <mesh geometry={geo.g} castShadow receiveShadow>
        <meshStandardMaterial {...pb} color={glow > 0 ? "#ffb08a" : "#ffffff"} emissive={glow > 0 ? "#ff7a3a" : "#000"} emissiveIntensity={glow * 0.5} roughness={0.9} />
      </mesh>
      {flow > 0.01 ? (
        <mesh position={[0, flow + 0.02, -geo.L / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[Math.min(h * 0.62, flow * 1.6 + 0.5), geo.L]} />
          <meshPhysicalMaterial color={water} roughness={0.12} clearcoat={1} normalMap={rippleTex(t)} normalScale={new THREE.Vector2(0.3, 0.3)} />
        </mesh>
      ) : null}
    </group>
  );
};

/** round brick sewer seen from inside (CCTV / walk-through), along −Z from z = 0, radius r, centre height r. */
export const BrickTube: React.FC<{ r?: number; len?: number; flow?: number; water?: string; t: number; color?: string }> = ({ r = 1.4, len = 60, flow = 0.35, water = "#5a5536", t, color = "#8e4a32" }) => {
  const pb = usePbr("red_brick_03", [4, len / 3]);
  return (
    <group>
      <mesh position={[0, r, -len / 2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[r, r, len, 40, 1, true]} />
        <meshStandardMaterial {...pb} color={color === "#8e4a32" ? "#ffffff" : color} roughness={1} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, flow, -len / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2 * Math.sqrt(Math.max(0.01, r * r - (r - flow) * (r - flow))), len]} />
        <meshPhysicalMaterial color={water} roughness={0.1} clearcoat={1} normalMap={rippleTex(t)} normalScale={new THREE.Vector2(0.35, 0.35)} />
      </mesh>
    </group>
  );
};

// ───────────────────────── Westminster 1858 ─────────────────────────
const gothicTex = () =>
  ctex("gothic", 512, 512, (g, r) => {
    g.fillStyle = "#cdb98d";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(90,70,40,0.25)";
    for (let y = 0; y < 512; y += 18) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
    }
    // 4 bays: buttress strips + tall pointed windows with tracery
    for (let b = 0; b < 4; b++) {
      const cx = b * 128 + 64;
      g.fillStyle = "rgba(120,96,60,0.35)";
      g.fillRect(b * 128, 0, 10, 512);
      for (const [y0, hgt] of [
        [70, 150],
        [290, 170],
      ]) {
        g.fillStyle = "#2c3236";
        g.beginPath();
        g.moveTo(cx - 30, y0 + hgt);
        g.lineTo(cx - 30, y0 + 30);
        g.quadraticCurveTo(cx - 30, y0, cx, y0 - 14);
        g.quadraticCurveTo(cx + 30, y0, cx + 30, y0 + 30);
        g.lineTo(cx + 30, y0 + hgt);
        g.fill();
        g.strokeStyle = "#cdb98d";
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(cx, y0 - 10);
        g.lineTo(cx, y0 + hgt);
        g.moveTo(cx - 30, y0 + hgt * 0.5);
        g.lineTo(cx + 30, y0 + hgt * 0.5);
        g.stroke();
        void r;
      }
    }
  });

/** Palace of Westminster river front (1858: no clock tower in shot), along X from x0, front at z = 0 facing +Z. */
export const Westminster: React.FC<{ p: V3; len?: number }> = ({ p, len = 120 }) => {
  const gt = gothicTex();
  gt.repeat.set(len / 16, 1);
  return (
    <group position={p}>
      <RB p={[len / 2, 9, -8]} s={[len, 18, 16]} r={0.05} map={gt} color="#ffffff" rough={0.85} />
      {/* parapet pinnacles */}
      {Array.from({ length: Math.floor(len / 4) }, (_, k) => (
        <mesh key={k} position={[2 + k * 4, 19.2, 0.1]}>
          <coneGeometry args={[0.35, 2.4, 6]} />
          <meshStandardMaterial color="#c4af80" roughness={0.85} />
        </mesh>
      ))}
      {/* towers at the ends */}
      {[6, len - 6].map((x) => (
        <group key={x}>
          <RB p={[x, 14, -2]} s={[9, 28, 9]} r={0.05} map={gt} color="#ffffff" rough={0.85} />
          {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <mesh key={`${sx}${sz}`} position={[x + sx * 4.2, 29.5, -2 + sz * 4.2]}><coneGeometry args={[0.6, 4, 6]} /><meshStandardMaterial color="#c4af80" roughness={0.85} /></mesh>))}
        </group>
      ))}
      {/* river terrace */}
      <RB p={[len / 2, 0.5, 3]} s={[len, 1, 6]} r={0.05} color="#b9a983" rough={0.9} />
      <RB p={[len / 2, 1.5, 5.8]} s={[len, 1, 0.4]} r={0.05} color="#b9a983" rough={0.9} />
    </group>
  );
};

/** committee room overlooking the river: panelling, tall window, heavy curtains (`wet` darkens them), green benches */
export const CommitteeRoom: React.FC<{ wet?: number; drip?: number; t: number; children?: React.ReactNode }> = ({ wet = 0, t, children }) => {
  const panel = tex("planks", "#5a3a22", [3, 4], 7);
  const curtain = new THREE.Color("#8a1f24").lerp(new THREE.Color("#3e1012"), wet);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial map={tex("planks", "#6a4a2c", [6, 5], 2)} roughness={0.6} />
      </mesh>
      {/* back wall with the river window */}
      <RB p={[-3.3, 2.5, -4]} s={[3.4, 5, 0.2]} r={0.01} map={panel} color="#ffffff" />
      <RB p={[3.3, 2.5, -4]} s={[3.4, 5, 0.2]} r={0.01} map={panel} color="#ffffff" />
      <RB p={[0, 4.6, -4]} s={[3.2, 0.8, 0.2]} r={0.01} map={panel} color="#ffffff" />
      <RB p={[0, 0.45, -4]} s={[3.2, 0.9, 0.2]} r={0.01} map={panel} color="#ffffff" />
      <mesh position={[0, 2.55, -4.15]}>
        <planeGeometry args={[3.2, 3.3]} />
        <meshStandardMaterial color="#c9d49a" emissive="#a9c070" emissiveIntensity={0.9} />
      </mesh>
      {[-0.8, 0, 0.8].map((x) => (
        <RB key={x} p={[x, 2.55, -4.0]} s={[0.07, 3.3, 0.08]} r={0.01} color="#3a2a1a" />
      ))}
      <RB p={[0, 2.55, -4.0]} s={[3.2, 0.07, 0.08]} r={0.01} color="#3a2a1a" />
      {/* curtains, wet = darker + glossier */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 1.85, 2.6, -3.8]}>
          {Array.from({ length: 5 }, (_, k) => (
            <mesh key={k} position={[(k - 2) * 0.13, 0, Math.sin(k * 1.7) * 0.04]} castShadow>
              <cylinderGeometry args={[0.09, 0.11, 4.4, 10]} />
              <meshPhysicalMaterial color={curtain} roughness={0.85 - wet * 0.6} clearcoat={wet} />
            </mesh>
          ))}
        </group>
      ))}
      <RB p={[0, 4.85, -3.8]} s={[4.6, 0.08, 0.08]} r={0.02} color="#b8923a" metal={0.8} rough={0.3} />
      {/* side walls */}
      {[-5, 5].map((x) => (
        <RB key={x} p={[x, 2.5, 0]} s={[0.2, 5, 8]} r={0.01} map={panel} color="#ffffff" />
      ))}
      {/* green leather benches + table */}
      {[-2.6, 2.6].map((x) => (
        <group key={x} position={[x, 0, -0.5]}>
          <RB p={[0, 0.45, 0]} s={[1.0, 0.18, 3.6]} r={0.06} color="#2f5a3a" rough={0.5} />
          <RB p={[Math.sign(x) * 0.45, 0.85, 0]} s={[0.15, 0.7, 3.6]} r={0.06} color="#2f5a3a" rough={0.5} />
          <RB p={[0, 0.2, 0]} s={[0.9, 0.4, 3.4]} r={0.03} color="#3a2616" />
        </group>
      ))}
      <RB p={[0, 0.8, -0.5]} s={[1.6, 0.08, 3.2]} r={0.02} color="#4a301c" rough={0.5} />
      <RB p={[0, 0.4, -0.5]} s={[1.3, 0.75, 2.8]} r={0.02} color="#3a2616" />
      {[-0.4, 0.3, 0.0].map((z, k) => (
        <RB key={k} p={[(k - 1) * 0.35, 0.85, -0.5 + z * 2]} s={[0.3, 0.01, 0.42]} r={0.003} rot={[0, k * 0.3, 0]} color="#f2ecd8" />
      ))}
      <pointLight position={[0, 3.6, 1]} intensity={6} distance={10} color="#ffd9a0" />
      {void t}
      {children}
    </group>
  );
};

// ───────────────────────── museum room ─────────────────────────
export const MuseumRoom: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[16, 14]} />
      <meshStandardMaterial map={tex("planks", "#3a3028", [8, 7], 5)} roughness={0.55} />
    </mesh>
    <RB p={[0, 3, -5]} s={[16, 6, 0.2]} r={0.01} color="#1f2b3a" rough={0.9} />
    {[-8, 8].map((x) => (
      <RB key={x} p={[x, 3, 2]} s={[0.2, 6, 14]} r={0.01} color="#1f2b3a" rough={0.9} />
    ))}
    {/* wall graphic: big title */}
    <mesh position={[0, 3.4, -4.88]}>
      <planeGeometry args={[6.4, 1.4]} />
      <meshStandardMaterial map={museumTitle()} transparent roughness={0.8} />
    </mesh>
    {/* framed photos */}
    {[-5.2, 5.2].map((x) => (
      <group key={x}>
        <RB p={[x, 2.4, -4.86]} s={[2.0, 1.4, 0.05]} r={0.01} color="#c9b994" />
        <mesh position={[x, 2.4, -4.83]}>
          <planeGeometry args={[1.8, 1.2]} />
          <meshStandardMaterial color="#5a5444" roughness={0.6} />
        </mesh>
      </group>
    ))}
    {children}
  </group>
);
const museumTitle = () =>
  ctex("museumTitle", 1024, 224, (g) => {
    g.clearRect(0, 0, 1024, 224);
    g.fillStyle = "#e8e2d0";
    g.font = "900 120px Arial";
    g.textAlign = "center";
    g.fillText("FATBERG!", 512, 130);
    g.font = "600 40px Arial";
    g.fillText("WHITECHAPEL · 2017", 512, 196);
  });

// ───────────────────────── sewage works inlet channel ─────────────────────────
export const Works: React.FC<{ t: number; children?: React.ReactNode }> = ({ t, children }) => {
  const conc = tex("plaster", "#a9a69e", [6, 3], 9);
  return (
    <group>
      {/* ground slabs on both sides of the channel */}
      {[-1, 1].map((s) => (
        <Slab key={s} p={[s * 7.1, -0.25, -6]} s={[10, 0.5, 40]} map={conc} color="#ffffff" />
      ))}
      {/* channel walls + floor */}
      {[-1, 1].map((s) => (
        <Slab key={s} p={[s * 2.05, -1.5, -6]} s={[0.3, 3, 40]} map={conc} color="#d0ccc2" />
      ))}
      <Slab p={[0, -3, -6]} s={[4.4, 0.2, 40]} map={conc} color="#b0aca2" />
      <mesh position={[0, -1.6, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.8, 40]} />
        <meshPhysicalMaterial color="#5f5a3a" roughness={0.1} clearcoat={1} normalMap={rippleTex(t * 2)} normalScale={new THREE.Vector2(0.5, 0.5)} />
      </mesh>
      {/* handrails */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Cyl p={[s * 2.4, 1.05, -6]} r={0.03} h={40} rot={[Math.PI / 2, 0, 0]} color="#e2b33a" rough={0.4} />
          {Array.from({ length: 11 }, (_, k) => (
            <Cyl key={k} p={[s * 2.4, 0.5, 14 - k * 4]} r={0.03} h={1.1} color="#e2b33a" rough={0.4} />
          ))}
        </group>
      ))}
      {/* skip for the screenings */}
      <group position={[0, 0, -7.5]}>
        <RB p={[0, 0.7, 0]} s={[3.2, 1.4, 1.8]} r={0.05} color="#2f8a4a" rough={0.5} metal={0.3} />
        <RB p={[0, 1.3, 0]} s={[3.0, 0.2, 1.6]} r={0.03} color="#4a4636" />
      </group>
      {/* sheds + tanks in the distance */}
      <RB p={[-14, 3, -30]} s={[12, 6, 10]} r={0.05} color="#c8c2b4" />
      <RB p={[-14, 6.4, -30]} s={[12.4, 0.8, 10.4]} r={0.05} color="#2f6db5" />
      {[14, 26].map((x) => (
        <group key={x}>
          <Cyl p={[x, 1.2, -34]} r={7} h={2.4} seg={48} color="#b8b2a4" rough={0.9} />
          <Cyl p={[x, 2.45, -34]} r={6.8} h={0.1} seg={48} color="#5d6a3a" rough={0.2} />
        </group>
      ))}
      {children}
    </group>
  );
};
