import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Cyl, RB } from "../../lib/three/diorama";
import { seeded } from "../../lib/timing";

// ───────────────────────── Procedural Curtain-Wall & Spire Textures ─────────────────────────
const cache = new Map<string, THREE.CanvasTexture>();

const burjFacadeTex = (litMode: "diff" | "emissive", repeat: [number, number] = [1, 1]) => {
  const k = `burj_${litMode}_${repeat[0]}_${repeat[1]}`;
  if (cache.has(k)) return cache.get(k)!;
  const W = 512;
  const H = 1024;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  const r = seeded(828);

  if (litMode === "diff") {
    const gr = g.createLinearGradient(0, 0, W, 0);
    gr.addColorStop(0, "#4c7596");
    gr.addColorStop(0.5, "#6b99bd");
    gr.addColorStop(1, "#456c8a");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    // Double-height curtain wall glass + silver aluminum horizontal spandrels & vertical fins
    const cols = 16;
    const rows = 48;
    const cw = W / cols;
    const rh = H / rows;
    for (let y = 0; y < rows; y++) {
      if (y % 8 === 0) {
        // Louvered mechanical equipment band
        g.fillStyle = "#2b3947";
        g.fillRect(0, y * rh, W, rh);
        g.fillStyle = "#91a4b6";
        for (let s = 2; s < rh; s += 4) g.fillRect(0, y * rh + s, W, 1.5);
        continue;
      }
      for (let x = 0; x < cols; x++) {
        const v = r();
        g.fillStyle = v < 0.35 ? "#5a88ac" : v < 0.72 ? "#7aa9cc" : "#96c2e2";
        g.fillRect(x * cw + 2, y * rh + 3, cw - 4, rh - 6);
        g.fillStyle = "rgba(255,255,255,0.16)";
        g.fillRect(x * cw + 3, y * rh + 4, (cw - 6) * 0.4, 3);
      }
      g.fillStyle = "#d9e3ec";
      g.fillRect(0, y * rh, W, 2.5);
    }
    g.fillStyle = "#eef4fa";
    for (let x = 0; x < cols; x++) g.fillRect(x * cw, 0, 2.5, H);
  } else {
    g.fillStyle = "#000000";
    g.fillRect(0, 0, W, H);
    const cols = 16;
    const rows = 48;
    const cw = W / cols;
    const rh = H / rows;
    for (let y = 0; y < rows; y++) {
      if (y % 8 === 0) {
        // Horizontal LED facade ring light
        g.fillStyle = "#c8e8ff";
        g.fillRect(0, y * rh + rh * 0.4, W, 3);
        continue;
      }
      for (let x = 0; x < cols; x++) {
        const p = r();
        if (p < 0.32) {
          g.fillStyle = p < 0.2 ? "#ffd890" : p < 0.27 ? "#a8ebff" : "#ffffff";
          g.fillRect(x * cw + 4, y * rh + 5, cw - 8, rh - 10);
        }
      }
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  cache.set(k, t);
  return t;
};

/** Scale raw ExtrudeGeometry world-meter UVs so 1 texture tile = 28 m wide × 180 m tall. */
const scaleWorldUVs = (g: THREE.BufferGeometry, tileW = 28, tileH = 180) => {
  const ua = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < ua.count; i++) {
    ua.setXY(i, ua.getX(i) / tileW, ua.getY(i) / tileH);
  }
  ua.needsUpdate = true;
};

/** Rounded-nose Y-wing lobe profile extruded vertically (unit height `h`). */
const makeLobeGeo = (radius: number, innerDist: number, outerDist: number, h: number) => {
  const s = new THREE.Shape();
  s.moveTo(innerDist, -radius);
  s.lineTo(outerDist, -radius);
  s.absarc(outerDist, 0, radius, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(innerDist, radius);
  s.absarc(innerDist, 0, radius, Math.PI / 2, (Math.PI * 3) / 2, false);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: h,
    bevelEnabled: true,
    bevelThickness: Math.min(0.45, h * 0.08),
    bevelSize: Math.min(0.4, radius * 0.08),
    bevelSegments: 2,
    curveSegments: 14,
  });
  g.rotateX(-Math.PI / 2); // +Y vertical extrusion
  scaleWorldUVs(g, 28, 180);
  g.computeVertexNormals();
  return g;
};

// 27 spiraling setback tiers (real Burj Khalifa Y-plan progression from y=0 to y=602 m, plus 226 m pinnacle spire -> 828 m)
type LobeDef = {
  wing: number; // 0, 1, 2 (0°, 120°, 240°)
  tier: number; // 0..26 (27 spiraling setbacks)
  y0: number;
  y1: number;
  inner: number;
  outer: number;
  rad: number;
};

const BURJ_LOBES: LobeDef[] = (() => {
  const out: LobeDef[] = [];
  // Spiral order counterclockwise across wings A(0), B(1), C(2) from outermost petals inward
  const outerMaxH = [
    96, 122, 148, // outer petals (setbacks 1..3)
    176, 204, 232, // mid-outer petals (setbacks 4..6)
    262, 290, 318, // mid petals (setbacks 7..9)
    346, 374, 400, // mid-inner petals (setbacks 10..12)
    426, 450, 474, // inner petals (setbacks 13..15)
    498, 520, 540, // upper petals (setbacks 16..18)
    556, 570, 582, // crown petals (setbacks 19..21)
    592, 600, 608, // high core petals (setbacks 22..24)
    616, 622, 628, // spire shoulders (setbacks 25..27)
  ];
  for (let i = 0; i < 27; i++) {
    const ring = Math.floor(i / 3); // 0..8 radial band moving inward
    const wing = i % 3;
    const rad = Math.max(3.6, 11.2 - ring * 0.88);
    const outer = Math.max(10.5, 58 - ring * 5.6);
    const inner = Math.max(3.5, outer - 18 + ring * 0.6);
    out.push({
      wing,
      tier: i,
      y0: 0,
      y1: outerMaxH[i],
      inner,
      outer,
      rad,
    });
  }
  return out;
})();

const hexCoreGeo = (r: number, h: number) => {
  const s = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  scaleWorldUVs(g, 28, 180);
  g.computeVertexNormals();
  return g;
};

// ───────────────────────── Realistic Open-Lattice Luffing-Jib Tower Crane ─────────────────────────
export const TowerCrane: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
}) => {
  const swing = ry + Math.sin(t * 0.45) * 0.35;
  const beaconPulse = 0.6 + 0.4 * Math.sin(t * 4);
  return (
    <group position={p} rotation={[0, swing, 0]} scale={scale}>
      {/* Open 3D Steel Lattice Mast: 4 corner chords + horizontal collar frames + X-bracing */}
      {[-0.45, 0.45].map((cx) =>
        [-0.45, 0.45].map((cz) => (
          <Cyl key={`${cx}${cz}`} p={[cx, 4.5, cz]} r={0.075} h={9.1} color="#f5b82e" metal={0.5} rough={0.36} />
        )),
      )}
      {Array.from({ length: 8 }, (_, i) => {
        const yCollar = 0.8 + i * 1.1;
        const yMid = 0.25 + i * 1.1;
        return (
          <group key={i}>
            {/* Open hollow collar frame */}
            {[-0.45, 0.45].map((zOff) => (
              <RB key={`cz${zOff}`} p={[0, yCollar, zOff]} s={[1.02, 0.08, 0.08]} r={0.015} color="#28313d" metal={0.65} />
            ))}
            {[-0.45, 0.45].map((xOff) => (
              <RB key={`cx${xOff}`} p={[xOff, yCollar, 0]} s={[0.08, 0.08, 1.02]} r={0.015} color="#28313d" metal={0.65} />
            ))}
            {/* Diagonal X-brace struts on front & back faces */}
            {[-0.45, 0.45].map((zFace) => (
              <group key={`xb${zFace}`}>
                <Cyl p={[0, yMid, zFace]} rot={[0, 0, 0.72]} r={0.032} h={1.42} color="#e5a21d" metal={0.5} />
                <Cyl p={[0, yMid, zFace]} rot={[0, 0, -0.72]} r={0.032} h={1.42} color="#e5a21d" metal={0.5} />
              </group>
            ))}
            {/* Side alternating diagonal web struts */}
            {[-0.45, 0.45].map((xFace) => (
              <Cyl
                key={`xs${xFace}`}
                p={[xFace, yMid, 0]}
                rot={[i % 2 === 0 ? 0.72 : -0.72, 0, 0]}
                r={0.028}
                h={1.42}
                color="#d99418"
                metal={0.5}
              />
            ))}
          </group>
        );
      })}
      {/* Operator cab & turntable */}
      <Cyl p={[0, 9.2, 0]} r={0.85} h={0.55} color="#252e3a" metal={0.65} />
      <RB p={[0.95, 9.8, 0]} s={[1.2, 1.3, 1.1]} r={0.08} color="#f5b82e" rough={0.38} />
      <RB p={[1.55, 9.9, 0]} s={[0.1, 0.9, 0.9]} r={0.02} color="#7fd8ff" emissive="#ffe59e" ei={0.6} rough={0.1} />
      {/* Counter-jib + concrete ballast blocks */}
      <RB p={[-3.2, 9.75, 0]} s={[6.4, 0.42, 0.95]} r={0.04} color="#e5a21d" metal={0.45} />
      {[-5.6, -4.6, -3.7].map((bx, i) => (
        <RB key={i} p={[bx, 9.4, 0]} s={[0.8, 1.6, 1.2]} r={0.05} color="#7f8894" rough={0.85} />
      ))}
      {/* A-frame cathead mast + aviation peak beacon */}
      <Cyl p={[0, 11.4, 0]} r={0.22} r2={0.08} h={3.6} color="#f5b82e" />
      <Glow position={[0, 13.3, 0]} size={1.2} color="#ff3b30" opacity={beaconPulse} />
      <mesh position={[0, 13.3, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#ff4a3d" emissive="#ff3b30" emissiveIntensity={2.2 * beaconPulse} />
      </mesh>
      {/* Open 3D Steel Lattice Luffing Jib Boom */}
      <group position={[0.4, 10.1, 0]} rotation={[0, 0, 0.42]}>
        {/* 4 Longitudinal corner chord tubes */}
        {[-0.34, 0.34].map((cy) =>
          [-0.34, 0.34].map((cz) => (
            <Cyl
              key={`jc_${cy}_${cz}`}
              p={[7.2, cy, cz]}
              rot={[0, 0, Math.PI / 2]}
              r={0.052}
              h={14.6}
              color="#f5b82e"
              metal={0.5}
              rough={0.35}
            />
          )),
        )}
        {/* 11 Transverse open frame ties */}
        {Array.from({ length: 11 }, (_, i) => {
          const bx = 0.6 + i * 1.32;
          return (
            <group key={`jt_${i}`} position={[bx, 0, 0]}>
              {[-0.34, 0.34].map((sz) => (
                <RB key={`jv${sz}`} p={[0, 0, sz]} s={[0.06, 0.72, 0.06]} r={0.01} color="#d99418" metal={0.55} />
              ))}
              {[-0.34, 0.34].map((sy) => (
                <RB key={`jh${sy}`} p={[0, sy, 0]} s={[0.06, 0.06, 0.72]} r={0.01} color="#d99418" metal={0.55} />
              ))}
            </group>
          );
        })}
        {/* Diagonal truss web braces along both z = +-0.34 faces */}
        {Array.from({ length: 10 }, (_, i) => {
          const wx = 1.26 + i * 1.32;
          const rotZ = i % 2 === 0 ? 0.92 : -0.92;
          return [-0.34, 0.34].map((sz) => (
            <Cyl key={`jw_${i}_${sz}`} p={[wx, 0, sz]} rot={[0, 0, rotZ]} r={0.03} h={1.45} color="#f5b82e" metal={0.5} />
          ));
        })}
        {/* Tension stay cable from cathead to jib tip */}
        <Cyl p={[6.5, 1.5, 0]} rot={[0, 0, 1.38]} r={0.055} h={14.5} color="#404954" metal={0.82} />
        {/* Hoist cables + hazard hook block + wire slings + 3-part steel I-beam */}
        <group position={[13.8, 0, 0]} rotation={[0, 0, -0.42]}>
          <Cyl p={[0, -3.6, 0.14]} r={0.04} h={7.2} color="#303842" metal={0.85} />
          <Cyl p={[0, -3.6, -0.14]} r={0.04} h={7.2} color="#303842" metal={0.85} />
          {/* Hazard hook pulley block */}
          <RB p={[0, -7.2, 0]} s={[0.46, 0.62, 0.46]} r={0.05} color="#f5b82e" />
          <RB p={[0, -7.2, 0]} s={[0.48, 0.14, 0.48]} r={0.02} color="#212730" />
          <Cyl p={[0, -7.56, 0]} r={0.055} h={0.2} color="#303842" metal={0.85} />
          {/* Two angled wire-rope sling cables */}
          <Cyl p={[0, -7.82, 0.54]} rot={[1.1, 0, 0]} r={0.026} h={1.22} color="#4e5864" metal={0.88} />
          <Cyl p={[0, -7.82, -0.54]} rot={[-1.1, 0, 0]} r={0.026} h={1.22} color="#4e5864" metal={0.88} />
          {/* Detailed 3-part Steel I-Beam (top flange, web, bottom flange) */}
          <RB p={[0, -8.12, 0]} s={[0.42, 0.08, 3.8]} r={0.015} color="#b4c2d0" metal={0.86} rough={0.28} />
          <RB p={[0, -8.33, 0]} s={[0.1, 0.36, 3.8]} r={0.01} color="#8e9dad" metal={0.82} rough={0.34} />
          <RB p={[0, -8.54, 0]} s={[0.42, 0.08, 3.8]} r={0.015} color="#b4c2d0" metal={0.86} rough={0.28} />
        </group>
      </group>
    </group>
  );
};

// ───────────────────────── Hero Burj Khalifa (Exact Y-Plan + 27 Spiraling Setbacks) ─────────────────────────
export const BurjKhalifa: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  t?: number;
  /** 0..1 progressive construction growth from podium to spire */
  build?: number;
  /** 0..1 amplitude of upper-tier storm cantilever sway */
  sway?: number;
  /** 0..1 architectural highlight rings sweeping up the 27 spiraling setback terraces */
  highlightSetbacks?: number;
  /** 0..1 illuminated golden-hour / night interior & facade LEDs */
  lit?: number;
  /** 0..1 celebratory ascending LED wave along terraces and spire collars */
  celebrate?: number;
  /** Render active climbing tower cranes on upper setbacks */
  cranes?: boolean;
}> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  build = 1,
  sway = 0,
  highlightSetbacks = 0,
  lit = 0,
  celebrate = 0,
  cranes = false,
}) => {
  const diffMap = useMemo(() => burjFacadeTex("diff", [1, 1]), []);
  const emMap = useMemo(() => burjFacadeTex("emissive", [1, 1]), []);

  const lobeGeos = useMemo(
    () =>
      BURJ_LOBES.map((l) => ({
        ...l,
        geo: makeLobeGeo(l.rad, l.inner, l.outer, l.y1 - l.y0),
      })),
    [],
  );
  const coreGeo = useMemo(() => hexCoreGeo(16.5, 636), []);

  const curH = 828 * build;
  const swayBend = sway * 16 * Math.sin(t * 1.45);
  const blink = 0.65 + 0.35 * Math.sin(t * 2.2);

  // Subtle architectural glass tint that shifts smoothly from mirror daylight blue-silver to twilight sapphire
  const glassTint = new THREE.Color("#d9ebf7").lerp(new THREE.Color("#698bb0"), lit * 0.65);

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Monumental stepped entrance podium */}
      <mesh position={[0, 7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[62, 70, 14, 6]} />
        <meshStandardMaterial color="#cfd7df" metalness={0.45} roughness={0.42} />
      </mesh>
      <mesh position={[0, 17, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[52, 58, 8, 6]} />
        <meshStandardMaterial map={diffMap} emissiveMap={emMap} emissive="#ffffff" emissiveIntensity={lit * 0.9} color={glassTint} metalness={0.68} roughness={0.2} />
      </mesh>

      {/* Central buttressed hexagonal Y core */}
      {curH > 12 ? (
        <mesh geometry={coreGeo} scale={[1, Math.min(1, curH / 636), 1]} castShadow receiveShadow>
          <meshStandardMaterial
            map={diffMap}
            emissiveMap={emMap}
            emissive="#ffffff"
            emissiveIntensity={lit * 1.1}
            color={glassTint}
            metalness={0.66}
            roughness={0.22}
          />
        </mesh>
      ) : null}

      {/* 27 spiraling setback lobes with stainless-steel vertical tubular mullions + terrace setback caps */}
      {lobeGeos.map((l) => {
        if (curH < 10) return null;
        const hFrac = Math.min(1, curH / l.y1);
        const hActual = l.y1 * hFrac;
        const ang = (l.wing * Math.PI * 2) / 3;
        const bendAtTop = swayBend * Math.pow(hActual / 828, 2.2);
        const sweep = Math.max(0, 1 - Math.abs(highlightSetbacks * 1.15 - l.tier / 26) * 6);
        const ledWave = celebrate > 0.05 ? Math.max(0, 1 - Math.abs(((t * 0.48) % 1.25) - l.tier / 26) * 4.5) * celebrate : 0;

        return (
          <group key={l.tier} rotation={[0, ang, 0]} position={[bendAtTop * 0.25, 0, 0]}>
            <mesh geometry={l.geo} scale={[1, hFrac, 1]} castShadow receiveShadow>
              <meshStandardMaterial
                map={diffMap}
                emissiveMap={emMap}
                emissive={highlightSetbacks > 0.05 && sweep > 0.2 ? "#42f5aa" : ledWave > 0.15 ? "#ffe296" : "#ffffff"}
                emissiveIntensity={
                  highlightSetbacks > 0.05
                    ? lit * 0.8 + sweep * 0.85
                    : lit * 1.05 + ledWave * 0.85
                }
                color={glassTint}
                metalness={0.68}
                roughness={0.2}
              />
            </mesh>
            {/* Stainless steel vertical tubular fins framing lobe edges */}
            {[-l.rad * 0.82, l.rad * 0.82].map((fz, fi) => (
              <mesh key={fi} position={[l.outer * 0.92, hActual * 0.5, fz]} castShadow>
                <cylinderGeometry args={[0.42, 0.42, hActual, 8]} />
                <meshStandardMaterial color="#e4edf5" metalness={0.92} roughness={0.18} />
              </mesh>
            ))}
            {/* Recessed rooftop terrace cap on finished setback */}
            {hFrac > 0.99 ? (
              <mesh position={[l.outer - l.rad * 0.2, l.y1 + 0.55, 0]} castShadow>
                <cylinderGeometry args={[l.rad * 0.92, l.rad * 0.96, 1.1, 12]} />
                <meshStandardMaterial
                  color={highlightSetbacks > 0.05 ? "#42f5aa" : ledWave > 0.2 ? "#ffe89e" : "#c8d4e0"}
                  emissive={highlightSetbacks > 0.05 ? "#42f5aa" : "#ffd875"}
                  emissiveIntensity={highlightSetbacks > 0.05 ? highlightSetbacks * (0.6 + sweep * 1.4) : ledWave * 1.9}
                  metalness={0.65}
                  roughness={0.25}
                />
              </mesh>
            ) : null}
          </group>
        );
      })}

      {/* Exposed steel rebar core + cranes if still under active construction */}
      {cranes && build < 0.95 ? (
        <group position={[0, Math.min(curH, 636), 0]}>
          <TowerCrane p={[14, 0, 0]} scale={2.4} t={t} ry={0.4} />
          <TowerCrane p={[-10, -48, 12]} scale={2.1} t={t + 2.2} ry={2.4} />
        </group>
      ) : null}

      {/* Upper structural tiers + 244 m telescoping steel pinnacle spire (y = 584..828) */}
      {curH > 585 ? (
        <group position={[swayBend * 0.45, 584, 0]} rotation={[0, 0, -swayBend * 0.0018]}>
          {/* Crown observation tiers */}
          <Cyl p={[0, 26, 0]} r={11.5} r2={7.2} h={52} seg={12} color="#8fb8d6" metal={0.78} rough={0.2} />
          <Cyl p={[swayBend * 0.16, 74, 0]} r={6.8} r2={4.2} h={46} seg={12} color="#c5d6e6" metal={0.86} rough={0.18} />
          {/* Architectural stainless collar rings */}
          {[14, 38, 62, 86, 110].map((ryPos, k) => (
            <Cyl
              key={k}
              p={[swayBend * (k * 0.04), ryPos, 0]}
              r={12 - k * 1.65}
              h={2.2}
              seg={18}
              color="#eef4fa"
              emissive={celebrate > 0.1 ? "#ffe28a" : "#bfe8ff"}
              ei={lit * 1.2 + celebrate * (0.7 + 0.8 * Math.sin(t * 4 - k * 0.9))}
              metal={0.92}
              rough={0.15}
            />
          ))}
          {/* Needle spire (98 m -> 244 m above tier base = 828 m total) */}
          <group position={[swayBend * 0.3, 98, 0]} rotation={[0, 0, -swayBend * 0.0032]}>
            <Cyl p={[0, 44, 0]} r={3.6} r2={1.7} h={88} seg={14} color="#dfe8f0" metal={0.9} rough={0.18} />
            <Cyl p={[swayBend * 0.14, 114, 0]} r={1.65} r2={0.45} h={58} seg={12} color="#edf3f8" metal={0.94} rough={0.15} />
            <Glow position={[swayBend * 0.2, 145, 0]} size={18} color="#ff3b30" opacity={blink} />
            <mesh position={[swayBend * 0.2, 145, 0]}>
              <sphereGeometry args={[1.4, 10, 10]} />
              <meshStandardMaterial color="#ff4a3d" emissive="#ff3b30" emissiveIntensity={2.5 * blink} />
            </mesh>
          </group>
        </group>
      ) : null}
    </group>
  );
};

// ───────────────────────── Naive Straight Glass Skyscraper (Guitar-String Resonance Contrast) ─────────────────────────
export const StraightGlassTower: React.FC<{
  p?: V3;
  scale?: number;
  t?: number;
  /** 0..1 harmonic resonant sideways flex */
  flex?: number;
  /** 0..1 glowing structural shear crack + tilt */
  snap?: number;
}> = ({ p = [0, 0, 0], scale = 1, t = 0, flex = 1, snap = 0 }) => {
  const diffMap = useMemo(() => burjFacadeTex("diff", [2, 0.18]), []);
  const segs = 24;
  const totalH = 720;
  const segH = totalH / segs;
  const amp = flex * 28 * Math.sin(t * 2.4);

  const debris = useMemo(() => {
    const r = seeded(912);
    return Array.from({ length: 28 }, (_, i) => {
      const spark = i >= 20;
      return {
        spark,
        vx: (r() - 0.35) * (spark ? 210 : 165),
        vy: 30 + (r() - 0.25) * (spark ? 150 : 120),
        vz: (r() - 0.5) * (spark ? 200 : 160),
        rx: (r() - 0.5) * 14,
        ry: (r() - 0.5) * 14,
        rz: (r() - 0.5) * 14,
        w: spark ? 2.6 + r() * 2.2 : 6 + r() * 8,
        h: spark ? 12 + r() * 14 : 7 + r() * 9,
      };
    });
  }, []);

  const fractureK = snap > 0.15 ? Math.min(1, (snap - 0.15) / 0.85) : 0;
  const fx = amp * Math.pow(12.5 / segs, 1.55);
  const fy = 12 * segH;

  return (
    <group position={p} scale={scale}>
      <RB p={[0, 9, 0]} s={[64, 18, 64]} r={1.2} color="#3a4552" metal={0.4} rough={0.6} />
      {Array.from({ length: segs }, (_, i) => {
        const yFrac = (i + 0.5) / segs;
        const modeShape = Math.pow(yFrac, 1.55);
        const sx = amp * modeShape;
        const slope = (amp * 1.55 * Math.pow(yFrac, 0.55)) / totalH;
        const crackIdx = 12;
        const crackTilt = i >= crackIdx ? snap * 0.28 * (i - (crackIdx - 1)) * 0.1 : 0;
        const crackedMid = i === crackIdx && snap > 0.15;
        return (
          <group
            key={i}
            position={[sx + (i >= crackIdx ? snap * (i - (crackIdx - 1)) * 6 : 0), i * segH + segH * 0.5, 0]}
            rotation={[0, 0, -Math.atan(slope) - crackTilt]}
          >
            <mesh castShadow receiveShadow>
              <boxGeometry args={[46, segH + 1.4, 46]} />
              <meshStandardMaterial
                map={diffMap}
                color={crackedMid ? "#ff7a6b" : "#6f98b8"}
                emissive="#ff3b30"
                emissiveIntensity={crackedMid ? snap * 1.4 : 0}
                metalness={0.65}
                roughness={0.22}
              />
            </mesh>
            {/* Corner steel columns */}
            {[-23.2, 23.2].map((cx) =>
              [-23.2, 23.2].map((cz) => (
                <RB key={`${cx}${cz}`} p={[cx, 0, cz]} s={[1.8, segH + 1.4, 1.8]} r={0.2} color="#dce6f0" metal={0.85} />
              )),
            )}
          </group>
        );
      })}
      {/* Fracture steel girder stubs + exploding ballistic glass shards & sparks */}
      {fractureK > 0.02 ? (
        <group>
          {[-18, -10, 0, 10, 18, 6].map((gz, gi) => (
            <RB
              key={`gs_${gi}`}
              p={[fx + (gi % 2 === 0 ? -12 : 14), fy + (gi - 2.5) * 4, gz]}
              rot={[0.15 * gi, 0.2, (gi % 2 === 0 ? 1 : -1) * 0.45 * fractureK]}
              s={[14, 1.6, 1.6]}
              r={0.15}
              color="#c8d6e4"
              emissive="#ff5238"
              ei={0.35}
              metal={0.85}
            />
          ))}
          {debris.map((d, di) => (
            <mesh
              key={`db_${di}`}
              position={[fx + d.vx * fractureK, fy + d.vy * fractureK - 150 * fractureK * fractureK, d.vz * fractureK]}
              rotation={[d.rx * fractureK, d.ry * fractureK, d.rz * fractureK]}
            >
              <boxGeometry args={[d.w, d.h, d.spark ? d.w : 1.1]} />
              <meshStandardMaterial
                color={d.spark ? "#ffb85c" : "#9ee2ff"}
                emissive={d.spark ? "#ff9436" : "#4db8ff"}
                emissiveIntensity={d.spark ? 2.2 : 0.45}
                metalness={d.spark ? 0.2 : 0.85}
                roughness={d.spark ? 0.4 : 0.1}
              />
            </mesh>
          ))}
        </group>
      ) : null}
      {/* Straight spire at top */}
      <Cyl
        p={[amp + snap * 75, totalH + 45 - snap * 24, 0]}
        rot={[0, 0, -Math.atan((amp * 1.55) / totalH) - snap * 0.35]}
        r={2.4}
        r2={0.5}
        h={96}
        color="#d4dee8"
        metal={0.9}
      />
    </group>
  );
};
