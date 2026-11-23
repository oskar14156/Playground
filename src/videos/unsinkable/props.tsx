import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Cyl, RB, tex } from "../../lib/three/diorama";
import { Lifeboat } from "../../lib/three/Lifeboat";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";

// ───────────────────────── canvas texture cache ─────────────────────────
const cache = new Map<string, THREE.CanvasTexture>();
const ptex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  if (cache.has(key)) return cache.get(key)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, seeded(key.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 11) >>> 0));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
};

// ───────────────────────── 1. Speedboat (Grandma's Ep.13 getaway boat) ─────────────────────────
export const Speedboat: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; wake?: number; driver?: React.ReactNode }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  wake = 1,
  driver,
}) => {
  const hullGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.55, -0.58);
    s.lineTo(0.45, -0.62);
    s.quadraticCurveTo(1.25, -0.46, 1.75, 0);
    s.quadraticCurveTo(1.25, 0.46, 0.45, 0.62);
    s.lineTo(-1.55, 0.58);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.48, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);

  const bob = Math.sin(t * 4.2) * 0.035;
  const pitch = Math.sin(t * 3.1) * 0.025 + wake * 0.06;

  return (
    <group position={[p[0], p[1] + bob, p[2]]} rotation={[0, ry, pitch]} scale={scale}>
      {/* sculpted white fiberglass hull + crimson sport stripe */}
      <mesh geometry={hullGeo} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f5f3ed" roughness={0.22} metalness={0.08} clearcoat={0.9} />
      </mesh>
      <RB p={[0.08, 0.34, 0]} s={[2.55, 0.06, 1.24]} r={0.02} color="#cf2828" rough={0.35} />
      {/* teak foredeck inlay */}
      <RB p={[0.72, 0.5, 0]} s={[1.1, 0.04, 0.88]} r={0.015} color="#7c4724" rough={0.6} />
      {/* wraparound dark glass cockpit windshield */}
      <mesh position={[0.38, 0.68, 0]} rotation={[0, 0, -0.45]}>
        <boxGeometry args={[0.34, 0.28, 0.96]} />
        <meshPhysicalMaterial color="#18384d" roughness={0.1} metalness={0.2} transparent opacity={0.62} clearcoat={1} />
      </mesh>
      {/* leather captain bench & helm wheel */}
      <RB p={[-0.55, 0.48, 0]} s={[0.55, 0.22, 0.95]} r={0.04} color="#c28e52" rough={0.75} />
      <RB p={[-0.78, 0.68, 0]} s={[0.14, 0.34, 0.95]} r={0.03} color="#c28e52" rough={0.75} />
      <Cyl p={[0.15, 0.58, 0]} r={0.03} h={0.3} rot={[0, 0, -0.5]} color="#22252c" metal={0.8} />
      <mesh position={[0.04, 0.68, 0]} rotation={[0, Math.PI / 2, 0.5]}>
        <torusGeometry args={[0.14, 0.02, 8, 22]} />
        <meshStandardMaterial color="#1c2026" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* twin outboard motors astern */}
      {[-0.24, 0.24].map((z, i) => (
        <group key={i} position={[-1.62, 0.34, z]}>
          <RB p={[0, 0.16, 0]} s={[0.28, 0.36, 0.2]} r={0.04} color="#20242c" metal={0.5} rough={0.35} />
          <Cyl p={[0, -0.14, 0]} r={0.045} h={0.38} color="#343b46" metal={0.8} />
        </group>
      ))}
      {/* foamy wake ribbons when speeding away */}
      {wake > 0.1 ? (
        <group>
          {[-0.25, 0.25].map((z, i) => (
            <mesh key={i} position={[-2.4 - ((t * 2) % 0.4), 0.02, z * 1.4]} rotation={[-Math.PI / 2, 0, i === 0 ? 0.16 : -0.16]}>
              <planeGeometry args={[2.2, 0.26]} />
              <meshStandardMaterial color="#eef9ff" emissive="#c6eeff" emissiveIntensity={0.35 * wake} transparent opacity={0.62 * wake} />
            </mesh>
          ))}
        </group>
      ) : null}
      {/* driver figure positioned cleanly in cockpit seat */}
      {driver ? <group position={[-0.22, 0.2, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.78}>{driver}</group> : null}
    </group>
  );
};

// ───────────────────────── 2. BulkheadCutaway (16 compartments, E-Deck 3m open tops, spillover) ─────────────────────────
export const BulkheadCutaway: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  t?: number;
  /** 0..1 progressive flooding: 0..0.42 fills bays 1..4 safely; 0.45..1.0 tilts bow and cascades over bulkhead #4 top into bays 5..8 */
  flood?: number;
  xray?: number;
}> = ({ p = [0, 0, 0], ry = 0, scale = 1, t = 0, flood = 0.2, xray = 1 }) => {
  const metal = usePbr("metal_plate", [4, 1]);
  const nBays = 16;
  const hullLen = 7.2;
  const bayW = (hullLen - 1.1) / nBays;
  const xStart = hullLen * 0.5 - 0.55; // bays numbered 1 (bow +X) to 16 (stern -X)

  const sinkProgress = Math.max(0, (flood - 0.42) / 0.58);
  const shipPitch = -Math.min(0.28, flood * 0.08 + sinkProgress * 0.22);
  const shipSink = sinkProgress * 0.24;

  // Individual compartment fill heights (0..1.08; 1.0 = top of bulkhead at y=0.62)
  const bayFill = (idx: number) => {
    if (idx < 4) {
      // Forward 4 compartments flood first; reach bulkhead lip around flood=0.44
      return Math.min(1.03, Math.max(0, flood * 2.4 - idx * 0.08));
    }
    if (idx < 10 && sinkProgress > 0) {
      // Spillover sequentially into bays 5, 6, 7, 8... over top of open bulkheads
      const threshold = (idx - 4) * 0.14;
      return Math.min(1.02, Math.max(0, (sinkProgress - threshold) * 2.2));
    }
    return 0;
  };

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      <group position={[0, -shipSink, 0]} rotation={[0, 0, shipPitch]}>
        {/* Outer starboard hull shell backplate (red keel below y=0.22, black upper shell) */}
        <mesh position={[0, -0.1, -0.44]} castShadow receiveShadow>
          <boxGeometry args={[hullLen, 0.52, 0.08]} />
          <meshStandardMaterial color="#7d201c" map={metal.map} normalMap={metal.normalMap} roughnessMap={metal.roughnessMap} roughness={0.75} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.42, -0.44]} castShadow receiveShadow>
          <boxGeometry args={[hullLen, 0.54, 0.08]} />
          <meshStandardMaterial color="#1f242c" map={metal.map} normalMap={metal.normalMap} roughnessMap={metal.roughnessMap} roughness={0.55} metalness={0.35} />
        </mesh>
        {/* Sharp triangular bow prow at +X and stern counter at -X */}
        <mesh position={[hullLen * 0.5 + 0.28, 0.16, -0.22]} rotation={[0, 0, -0.14]} castShadow>
          <boxGeometry args={[0.72, 1.04, 0.48]} />
          <meshStandardMaterial color="#1f242c" roughness={0.5} metalness={0.35} transparent={xray > 0.2} opacity={xray > 0.2 ? 0.45 : 1} />
        </mesh>
        <mesh position={[-hullLen * 0.5 - 0.22, 0.22, -0.22]} castShadow>
          <boxGeometry args={[0.58, 0.94, 0.48]} />
          <meshStandardMaterial color="#1f242c" roughness={0.5} metalness={0.35} transparent={xray > 0.2} opacity={xray > 0.2 ? 0.45 : 1} />
        </mesh>

        {/* Bottom double-hull floor plate & keel */}
        <RB p={[0, -0.34, -0.02]} s={[hullLen + 0.4, 0.08, 0.92]} r={0.01} color="#5e1714" metal={0.4} rough={0.7} />

        {/* Unsealed promenade & boat superstructure floating open above y=0.66 so open tops are glaringly obvious */}
        <RB p={[-0.1, 0.86, -0.34]} s={[hullLen - 0.9, 0.05, 0.34]} r={0.01} color="#f1ede3" rough={0.65} />
        {[-1.55, -0.55, 0.45, 1.45].map((fx, i) => (
          <Cyl key={i} p={[fx, 1.24, -0.34]} r={0.14} h={0.66} rot={[0, 0, -0.12]} color={i === 3 ? "#8b6d48" : "#d9a54a"} metal={0.25} />
        ))}
        {[-1.55, -0.55, 0.45, 1.45].map((fx, i) => (
          <Cyl key={`b-${i}`} p={[fx + 0.04, 1.54, -0.34]} r={0.144} h={0.14} rot={[0, 0, -0.12]} color="#141820" />
        ))}

        {/* 15 Transverse watertight bulkheads separating 16 open-top bays (stop at E-Deck y=0.62) */}
        {Array.from({ length: nBays + 1 }, (_, i) => {
          const x = xStart - i * bayW;
          const isBreachZone = i >= 1 && i <= 6;
          return (
            <group key={`bh-${i}`} position={[x, 0.14, -0.04]}>
              <RB
                p={[0, 0, 0]}
                s={[0.045, 0.96, 0.78]}
                r={0.005}
                color={isBreachZone ? "#22c7d8" : "#4eaec0"}
                emissive={isBreachZone ? "#128da1" : "#000000"}
                ei={0.35}
                metal={0.65}
                rough={0.3}
              />
              {/* Bright warning trim along open UNSEALED top rim (y=+0.48 local -> y=0.62 world) */}
              <RB p={[0, 0.485, 0]} s={[0.065, 0.032, 0.82]} r={0.005} color="#ffd23f" emissive="#ffd23f" ei={0.55} />
            </group>
          );
        })}

        {/* Animated translucent turquoise water rising in bays 1..16 + waterfall spillovers over bulkhead lips */}
        {Array.from({ length: nBays }, (_, idx) => {
          const level = bayFill(idx);
          if (level <= 0.02) return null;
          const xCenter = xStart - (idx + 0.5) * bayW;
          const maxH = 0.92;
          const h = level * maxH;
          const spilling = level > 0.96 && idx < 9 && bayFill(idx + 1) > 0.01;
          return (
            <group key={`w-${idx}`}>
              <mesh position={[xCenter, -0.3 + h * 0.5, -0.02]}>
                <boxGeometry args={[bayW - 0.055, h, 0.72]} />
                <meshPhysicalMaterial color="#1ea8eb" emissive="#0d66a8" emissiveIntensity={0.45} roughness={0.12} transparent opacity={0.74} />
              </mesh>
              {/* Glowing surface wave highlight */}
              <mesh position={[xCenter, -0.3 + h, -0.02]}>
                <boxGeometry args={[bayW - 0.06, 0.025, 0.73]} />
                <meshBasicMaterial color="#9ae6ff" />
              </mesh>
              {/* Spillover cascade pouring directly OVER top of left bulkhead into next compartment */}
              {spilling ? (
                <group position={[xStart - (idx + 1) * bayW - 0.02, 0.64, 0.1]}>
                  <mesh position={[0, 0.03, 0]}>
                    <boxGeometry args={[0.14, 0.06, 0.64]} />
                    <meshBasicMaterial color="#c4f3ff" />
                  </mesh>
                  <mesh position={[-0.08, -0.26 + Math.sin(t * 9 + idx) * 0.02, 0]}>
                    <boxGeometry args={[0.09, 0.56, 0.6]} />
                    <meshPhysicalMaterial color="#7ae2ff" emissive="#3bc7f5" emissiveIntensity={0.75} transparent opacity={0.86} />
                  </mesh>
                </group>
              ) : null}
            </group>
          );
        })}

        {/* Outer bright waterline guide plane + iceberg scrape slash across forward 6 compartments */}
        <RB p={[0, 0.28, 0.4]} s={[hullLen + 0.45, 0.024, 0.04]} r={0.005} color="#ffd23f" emissive="#ffd23f" ei={0.4} />
        {flood > 0.05 ? (
          <mesh position={[xStart - bayW * 2.6, 0.04, 0.39]}>
            <boxGeometry args={[bayW * 5.4, 0.075, 0.05]} />
            <meshBasicMaterial color="#ff4238" />
          </mesh>
        ) : null}
      </group>
    </group>
  );
};

// ───────────────────────── 3. FunnelCutaway (Funnel #4 cut open revealing hollow air vent) ─────────────────────────
export const FunnelCutaway: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; cutaway?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  cutaway = 1,
}) => {
  const planks = useMemo(() => tex("planks", "#b88a55", [5, 2], 21), []);
  const fx = [1.85, 0.62, -0.62, -1.85];

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* boat deck housing & lower hull apron + brass railing */}
      <RB p={[0, -0.05, 0]} s={[5.8, 0.1, 1.9]} r={0.02} map={planks} rough={0.72} />
      <RB p={[0, -0.42, 0]} s={[5.5, 0.66, 1.6]} r={0.02} color="#ede9df" rough={0.68} />
      {/* Boiler room fire glow grates with iron furnace mullions feeding funnels 1..3 ONLY */}
      <RB p={[0.62, -0.4, 0.81]} s={[3.25, 0.28, 0.04]} r={0.01} color="#ff5e1a" emissive="#ff5e1a" ei={1.15} />
      {[-0.85, -0.26, 0.33, 0.92, 1.51, 2.1].map((gx, gi) => (
        <RB key={`fg-${gi}`} p={[gx, -0.4, 0.835]} s={[0.07, 0.3, 0.03]} r={0.006} color="#262b34" metal={0.7} />
      ))}
      {[1.85, 0.62, -0.62].map((bx, i) => (
        <Cyl key={`up-${i}`} p={[bx, -0.1, 0.0]} r={0.08} h={0.55} rot={[0.4, 0, 0]} color="#404650" metal={0.7} />
      ))}

      {fx.map((x, idx) => {
        const isFourth = idx === 3;
        const cut = isFourth && cutaway > 0.25;
        return (
          <group key={idx} position={[x, 0, 0]} rotation={[0, 0, -0.14]}>
            {/* raised base fidley & collar */}
            <RB p={[0, 0.12, 0]} s={[0.68, 0.24, 0.62]} r={0.02} color="#ebe7dc" rough={0.65} />
            {/* diagonal steel guy wires anchoring collar to boat deck */}
            {[-0.36, 0.36].map((dz, w) => (
              <Cyl key={w} p={[0, 0.72, dz]} r={0.008} h={1.4} rot={[w === 0 ? 0.24 : -0.24, 0, 0]} color="#94a0b0" metal={0.85} />
            ))}
            {cut ? (
              <group>
                {/* Back half cutaway shell of #4 funnel (open C-channel showing hollow inside) */}
                <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.25, 0.27, 1.48, 28, 1, true, Math.PI * 0.25, Math.PI * 1.45]} />
                  <meshStandardMaterial color="#d8a248" roughness={0.55} metalness={0.18} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, 1.66, 0]} castShadow>
                  <cylinderGeometry args={[0.255, 0.252, 0.34, 28, 1, true, Math.PI * 0.25, Math.PI * 1.45]} />
                  <meshStandardMaterial color="#161920" roughness={0.6} side={THREE.DoubleSide} />
                </mesh>
                {/* Internal hollow air-vent duct & tiny galley flue inside #4 — ZERO boiler uptake! */}
                <Cyl p={[-0.08, 0.88, -0.06]} r={0.06} h={1.52} color="#8ba6be" metal={0.75} rough={0.35} />
                <Cyl p={[0.1, 0.88, -0.02]} r={0.032} h={1.5} color="#4e5866" metal={0.8} rough={0.3} />
                {/* Interior structural ring ribs */}
                {[0.45, 0.95, 1.45].map((ry2) => (
                  <mesh key={ry2} position={[0, ry2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.22, 0.015, 8, 24, Math.PI * 1.35]} />
                    <meshStandardMaterial color="#3c4452" metalness={0.75} roughness={0.3} />
                  </mesh>
                ))}
                {/* Bright blue floating air-vent particles instead of smoke */}
                {[0, 1, 2, 3].map((k) => {
                  const prog = (t * 0.8 + k * 0.25) % 1;
                  return (
                    <mesh key={k} position={[0, 0.3 + prog * 1.55, 0.04]}>
                      <sphereGeometry args={[0.045, 10, 8]} />
                      <meshBasicMaterial color="#67e4ff" transparent opacity={0.85 * (1 - prog)} />
                    </mesh>
                  );
                })}
              </group>
            ) : (
              <group>
                {/* Solid raked buff & black funnel */}
                <Cyl p={[0, 0.92, 0]} r={0.27} r2={0.25} h={1.48} color="#dba449" rough={0.55} metal={0.18} />
                <Cyl p={[0, 1.68, 0]} r={0.252} r2={0.255} h={0.34} color="#161920" rough={0.65} />
                <Cyl p={[0, 1.82, 0]} r={0.22} h={0.06} color="#111" />
                {/* Active coal boiler exhaust smoke rising from funnels 1..3 ONLY */}
                {!isFourth
                  ? [0, 1, 2, 3].map((s) => {
                      const k = (t * 0.55 + s * 0.25 + idx * 0.1) % 1;
                      return (
                        <mesh key={s} position={[-k * 0.35, 1.9 + k * 0.85, 0]} scale={0.6 + k * 1.3}>
                          <sphereGeometry args={[0.14, 10, 8]} />
                          <meshStandardMaterial color="#6a707c" roughness={0.95} transparent opacity={0.58 * (1 - k)} />
                        </mesh>
                      );
                    })
                  : null}
              </group>
            )}
            {/* Gold whistle pipe on front edge */}
            <Cyl p={[0.25, 1.05, 0.06]} r={0.018} h={1.2} color="#e2b94e" metal={0.9} rough={0.2} />
          </group>
        );
      })}
    </group>
  );
};

// ───────────────────────── 4. BoatDeckCutaway (20 boats + optional glowing red cut slots) ─────────────────────────
export const BoatDeckCutaway: React.FC<{ p?: V3; ry?: number; scale?: number; ghosts?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  ghosts = 1,
}) => {
  const planks = useMemo(() => tex("planks", "#c49660", [6, 2], 31), []);
  const slots = [-2.45, -1.96, -1.47, -0.98, -0.49, 0.0, 0.49, 0.98, 1.47, 1.96, 2.45];
  const solidIdx = new Set([0, 2, 5, 8, 10]);

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Full lower white/black hull side wall + brass portholes below boat deck */}
      <RB p={[0, -0.45, 0.02]} s={[6.4, 0.82, 1.56]} r={0.02} color="#f1ede3" rough={0.72} />
      <RB p={[0, -0.98, 0.02]} s={[6.4, 0.36, 1.58]} r={0.02} color="#1d222a" rough={0.5} metal={0.3} />
      <RB p={[0, -0.8, 0.82]} s={[6.42, 0.04, 0.03]} r={0.005} color="#d4a644" metal={0.85} />
      {[-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4].map((px, i) => (
        <Cyl key={`ph-${i}`} p={[px, -0.44, 0.81]} r={0.075} h={0.04} rot={[Math.PI / 2, 0, 0]} color="#ffe194" emissive="#ffc860" ei={0.6} />
      ))}

      {/* Boat deck planked surface + 1st class deckhouse behind */}
      <RB p={[0, 0, 0]} s={[6.4, 0.1, 1.68]} r={0.02} map={planks} rough={0.75} />
      <RB p={[0, 0.46, -0.56]} s={[6.2, 0.86, 0.46]} r={0.02} color="#f3efe5" rough={0.7} />
      {/* Georgian multi-pane warm-lit promenade cabin windows with wooden sills */}
      {[-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4].map((wx, i) => (
        <group key={i} position={[wx, 0.48, -0.325]}>
          <RB p={[0, 0, 0]} s={[0.46, 0.44, 0.04]} r={0.01} color="#4d321c" rough={0.55} />
          <RB p={[0, 0, 0.015]} s={[0.38, 0.36, 0.02]} r={0.008} color="#ffe39f" emissive="#ffd070" ei={0.75} />
          <RB p={[0, 0, 0.028]} s={[0.025, 0.36, 0.015]} r={0.004} color="#4d321c" />
          <RB p={[0, 0, 0.028]} s={[0.38, 0.025, 0.015]} r={0.004} color="#4d321c" />
        </group>
      ))}
      {/* Brass promenade handrail + white stanchions */}
      <RB p={[0, 0.34, 0.78]} s={[6.2, 0.028, 0.028]} r={0.01} color="#d4a644" metal={0.85} />
      {slots.map((x, i) => (
        <Cyl key={`post-${i}`} p={[x, 0.18, 0.78]} r={0.015} h={0.34} color="#f0ece0" rough={0.6} />
      ))}

      {slots.map((x, idx) => {
        const isReal = solidIdx.has(idx);
        if (isReal) {
          return (
            <group key={idx} position={[x, 0.42, 0.46]}>
              {/* Twin curved Welin quadrant davits */}
              {[-0.22, 0.22].map((dx) => (
                <group key={dx} position={[dx, -0.18, 0]}>
                  <Cyl p={[0, 0.2, 0]} r={0.02} h={0.48} color="#e8e2d4" rough={0.5} />
                  <RB p={[0, 0.43, 0.14]} s={[0.036, 0.036, 0.32]} r={0.01} color="#e8e2d4" />
                </group>
              ))}
              <Lifeboat position={[0, 0.12, 0.18]} scale={0.16} color="#f5f1e6" inside="#8a6c4c" />
            </group>
          );
        }
        if (ghosts <= 0.04) return null;
        return (
          <group key={`g-${idx}`} position={[x, 0.54, 0.62]}>
            <mesh>
              <boxGeometry args={[0.42, 0.14, 0.22]} />
              <meshBasicMaterial color="#ff3b30" transparent opacity={0.38 * ghosts} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.44, 0.15, 0.23]} />
              <meshBasicMaterial color="#ff5e52" wireframe transparent opacity={0.9 * ghosts} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ───────────────────────── 5. CrowsNest (foremast tub + locked BINOCULARS chest + drifting key) ─────────────────────────
export const CrowsNest: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; locked?: number; keyAway?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  locked = 1,
  keyAway = 0.25,
}) => {
  const label = useMemo(
    () =>
      ptex("binoc-locker", 512, 256, (g) => {
        g.fillStyle = "#161d29";
        g.fillRect(0, 0, 512, 256);
        g.fillStyle = "#d42b2b";
        g.fillRect(0, 162, 512, 62);
        g.fillStyle = "rgba(255,255,255,0.85)";
        g.fillRect(0, 162, 512, 4);
        g.fillStyle = "#ffffff";
        g.font = "900 52px Arial, sans-serif";
        g.textAlign = "center";
        g.fillText("BINOCULARS", 256, 112);
        g.font = "700 32px Arial, sans-serif";
        g.fillText("LOCKED", 256, 204);
      }),
    [],
  );
  const sway = Math.sin(t * 1.4) * 0.02;

  return (
    <group position={p} rotation={[sway, ry, sway * 0.6]} scale={scale}>
      {/* Steel mast + climbing ladder rungs */}
      <Cyl p={[0, 0.4, -0.18]} r={0.14} r2={0.12} h={3.2} color="#cca45e" rough={0.55} metal={0.25} />
      {Array.from({ length: 10 }, (_, i) => (
        <RB key={i} p={[0, -0.9 + i * 0.26, -0.03]} s={[0.24, 0.02, 0.03]} r={0.006} color="#262b34" metal={0.75} />
      ))}

      {/* Wooden & iron crow's nest tub facing +Z */}
      <group position={[0, 0.96, 0.16]}>
        <Cyl p={[0, 0, 0]} r={0.44} r2={0.48} h={0.56} color="#58341c" rough={0.78} />
        <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.47, 0.04, 10, 32]} />
          <meshStandardMaterial color="#3c2313" roughness={0.65} />
        </mesh>
        {/* Brass ship's bell mounted beside rim */}
        <Cyl p={[0.36, 0.36, 0.22]} r={0.08} r2={0.035} h={0.14} color="#e5ba45" metal={0.9} rough={0.2} />
      </group>

      {/* Locked steel Binoculars Locker chest right below tub on mast front (padlock BELOW label so sign is 100% readable) */}
      <group position={[0, 0.42, 0.36]}>
        <RB p={[0, 0, 0]} s={[0.72, 0.42, 0.34]} r={0.02} color="#222a38" metal={0.65} rough={0.35} />
        <mesh position={[0, 0.075, 0.174]}>
          <planeGeometry args={[0.62, 0.24]} />
          <meshStandardMaterial map={label} roughness={0.4} />
        </mesh>
        {locked > 0.1 ? (
          <group position={[0, -0.14, 0.2]} scale={0.85 + locked * 0.18}>
            <mesh position={[0, 0.065, 0]}>
              <torusGeometry args={[0.045, 0.014, 8, 20, Math.PI]} />
              <meshStandardMaterial color="#d8e0ea" metalness={0.92} roughness={0.2} />
            </mesh>
            <RB p={[0, -0.01, 0]} s={[0.12, 0.11, 0.05]} r={0.015} color="#ffb928" emissive="#ff6a00" ei={0.55 * locked} metal={0.85} rough={0.2} />
          </group>
        ) : null}
      </group>

      {/* Reassigned officer's oversized brass key drifting away off-deck */}
      <group position={[0.58 + keyAway * 0.5, 0.44 - keyAway * 0.18, 0.42]} rotation={[0.2, -0.25, -0.45 - keyAway * 0.45]} scale={1.05}>
        <mesh position={[-0.14, 0, 0]}>
          <torusGeometry args={[0.08, 0.02, 8, 24]} />
          <meshStandardMaterial color="#ffd23f" emissive="#d48c10" emissiveIntensity={0.35} metalness={0.9} roughness={0.2} />
        </mesh>
        <Cyl p={[0.06, 0, 0]} r={0.02} h={0.28} rot={[0, 0, Math.PI / 2]} color="#ffd23f" metal={0.9} rough={0.2} />
        <RB p={[0.15, -0.04, 0]} s={[0.07, 0.06, 0.02]} r={0.005} color="#ffd23f" metal={0.9} rough={0.2} />
      </group>
    </group>
  );
};

// ───────────────────────── 6. SternTurbine (center prop stops -> no rudder wash) ─────────────────────────
const Propeller: React.FC<{ p: V3; blades: number; radius: number; spin: number; color?: string }> = ({
  p,
  blades,
  radius,
  spin,
  color = "#d6a442",
}) => (
  <group position={p} rotation={[0, 0, spin]}>
    <Cyl p={[0, 0, 0]} r={radius * 0.24} h={0.18} rot={[Math.PI / 2, 0, 0]} color={color} metal={0.9} rough={0.22} />
    {Array.from({ length: blades }, (_, i) => (
      <group key={i} rotation={[0, 0, (i / blades) * Math.PI * 2]}>
        <mesh position={[0, radius * 0.54, 0]} rotation={[0.38, 0, 0]}>
          <boxGeometry args={[radius * 0.36, radius * 0.78, 0.032]} />
          <meshStandardMaterial color={color} metalness={0.9} roughness={0.24} />
        </mesh>
      </group>
    ))}
  </group>
);

export const SternTurbine: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  t?: number;
  /** 0 = steaming forward with cyan rudder wash; 1 = wing props reversing & center turbine DEAD */
  stalled?: number;
  rudderAngle?: number;
}> = ({ p = [0, 0, 0], ry = 0, scale = 1, t = 0, stalled = 0, rudderAngle = 0.42 }) => {
  const rusty = usePbr("rusty_metal_02", [2, 2]);
  const sternGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.05, -1.6);
    s.lineTo(1.05, -1.6);
    s.quadraticCurveTo(0.85, -0.35, 0.14, 0.55);
    s.quadraticCurveTo(0, 0.65, -0.14, 0.55);
    s.quadraticCurveTo(-0.85, -0.35, -1.05, -1.6);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.72, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2 });
    g.rotateX(Math.PI / 2);
    return g;
  }, []);

  const wingSpin = stalled > 0.4 ? -t * 7.5 : t * 9.5;
  const centerSpin = stalled > 0.4 ? 0.35 : t * 11.5;

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Sculpted tapered Titanic cruiser stern (viewed from 3/4 behind-starboard so ALL 3 props + rudder read clearly) */}
      <mesh position={[0, 1.38, -0.15]} geometry={sternGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#1f252e" roughness={0.5} metalness={0.35} />
      </mesh>
      {/* Red anti-fouling lower keel skeg + bossings */}
      <mesh position={[0, 0.82, -0.18]} geometry={sternGeo} scale={[0.88, 0.72, 0.96]} castShadow receiveShadow>
        <meshStandardMaterial color="#87221d" map={rusty.map} normalMap={rusty.normalMap} roughnessMap={rusty.roughnessMap} roughness={0.75} metalness={0.2} />
      </mesh>
      <RB p={[0, 0.25, -0.45]} s={[0.16, 0.78, 1.4]} r={0.03} color="#761e19" rough={0.75} metal={0.2} />

      {/* Wing A-brackets + Twin Outer 3-Blade Wing Propellers */}
      {[-0.74, 0.74].map((x, idx) => (
        <group key={idx}>
          <RB p={[x * 0.62, 0.28, -0.45]} s={[0.56, 0.09, 0.35]} r={0.02} color="#631b17" rot={[0, idx === 0 ? -0.25 : 0.25, idx === 0 ? 0.45 : -0.45]} />
          <Cyl p={[x, 0.08, -0.48]} r={0.08} h={0.95} rot={[Math.PI / 2, 0, 0]} color="#4a4f59" metal={0.8} />
          <Propeller p={[x, 0.08, 0.02]} blades={3} radius={0.44} spin={wingSpin * (idx === 0 ? 1 : -1)} />
          {stalled > 0.4 ? (
            <mesh position={[x, 0.08, 0.1]}>
              <torusGeometry args={[0.38, 0.03, 8, 24]} />
              <meshBasicMaterial color="#e0f6ff" transparent opacity={0.58} />
            </mesh>
          ) : null}
        </group>
      ))}

      {/* Center 4-Blade Parsons Turbine Propeller (CANNOT REVERSE -> STOPS DEAD) */}
      <Cyl p={[0, 0.06, -0.45]} r={0.075} h={0.76} rot={[Math.PI / 2, 0, 0]} color="#4a4f59" metal={0.8} />
      <Propeller p={[0, 0.06, -0.06]} blades={4} radius={0.4} spin={centerSpin} color={stalled > 0.4 ? "#8e7b52" : "#ebbc46"} />

      {/* Stern Rudder directly astern of center prop, compact silhouette */}
      <group position={[0, 0.08, 0.44]} rotation={[0, rudderAngle, 0]}>
        <Cyl p={[0, 0.24, -0.08]} r={0.05} h={0.92} color="#4e5664" metal={0.85} />
        <RB p={[0, 0.05, 0.18]} s={[0.055, 0.78, 0.44]} r={0.012} color="#7d221c" rough={0.65} metal={0.3} />
        <RB p={[0, 0.05, 0.4]} s={[0.065, 0.78, 0.03]} r={0.008} color={stalled > 0.4 ? "#ff4c3d" : "#44ebff"} emissive={stalled > 0.4 ? "#ff3b30" : "#44ebff"} ei={0.85} />
      </group>

      {/* Bold 3D Hydrodynamic Wash Arrows passing beside the center prop & rudder */}
      {[-0.14, 0.08, 0.3].map((yy, i) => {
        const flowZ = ((t * 1.4 + i * 0.33) % 1) * 0.75;
        const ok = stalled < 0.45;
        return (
          <group key={`flow-${i}`} position={[ok ? 0.16 + flowZ * 0.25 : 0.14, yy, ok ? 0.05 + flowZ : 0.22 + i * 0.12]}>
            <Cyl
              p={[0, 0, 0]}
              r={ok ? 0.03 : 0.022}
              h={ok ? 0.34 : 0.18}
              rot={[Math.PI / 2, 0, 0]}
              color={ok ? "#3deeff" : "#ff4238"}
              emissive={ok ? "#3deeff" : "#ff4238"}
              ei={ok ? 1.2 : 0.9}
            />
            {ok ? (
              <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.07, 0.14, 10]} />
                <meshBasicMaterial color="#70f5ff" />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
};

// ───────────────────────── 7. Iceberg (sculpted faceted glacier peaks + huge submerged ice ram) ─────────────────────────
export const Iceberg: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number }> = ({ p = [0, 0, 0], ry = 0, scale = 1, t = 0 }) => {
  const spireGeo = useMemo(() => {
    const g = new THREE.DodecahedronGeometry(0.95, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ridge = 1 + 0.28 * Math.sin(x * 3.8 + z * 2.5);
      pos.setXYZ(i, x * ridge * 0.85, y > 0 ? y * 1.45 : y * 0.45, z * ridge * 0.78);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={[p[0], p[1] + Math.sin(t * 1.2) * 0.03, p[2]]} rotation={[0, ry, 0]} scale={scale}>
      {/* Faceted jagged glacial above-water cliff */}
      <mesh position={[0, 0.45, 0]} geometry={spireGeo} castShadow receiveShadow>
        <meshPhysicalMaterial color="#dff5ff" roughness={0.28} clearcoat={0.6} flatShading />
      </mesh>
      <mesh position={[-0.65, 0.24, 0.28]} geometry={spireGeo} scale={[0.62, 0.65, 0.68]} rotation={[0.1, 1.1, 0.2]} castShadow>
        <meshPhysicalMaterial color="#eef9ff" roughness={0.26} clearcoat={0.6} flatShading />
      </mesh>
      <mesh position={[0.62, 0.18, -0.2]} geometry={spireGeo} scale={[0.56, 0.58, 0.62]} rotation={[-0.1, -0.8, -0.15]} castShadow>
        <meshPhysicalMaterial color="#cdeeff" roughness={0.3} clearcoat={0.6} flatShading />
      </mesh>
      {/* Massive jagged submerged underwater ice ram */}
      <mesh position={[0.08, -0.85, 0.12]} geometry={spireGeo} scale={[1.38, -1.2, 1.28]} rotation={[0.1, 0.5, 0.08]}>
        <meshPhysicalMaterial color="#3bbcf0" emissive="#156aa8" emissiveIntensity={0.48} roughness={0.18} transparent opacity={0.82} flatShading />
      </mesh>
      <Glow position={[0, -0.35, 0.2]} size={2.2} color="#5cd6ff" opacity={0.28} />
    </group>
  );
};

// ───────────────────────── 8. HeatedPool (F-deck ornate indoor swimming bath, intact deep underwater) ─────────────────────────
export const HeatedPool: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; wreck?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  wreck = 0,
}) => {
  const tiles = useMemo(() => tex("tiles", "#3ba4c8", [6, 5], 12), []);
  const deckCol = new THREE.Color("#f0ebe0").lerp(new THREE.Color("#4e3f32"), wreck).getStyle();

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Tiled basin floor + surrounding marble/wood F-deck apron */}
      <RB p={[0, -0.45, 0]} s={[2.9, 0.08, 2.2]} r={0.02} map={tiles} rough={0.35} />
      {/* Raised pool borders */}
      <RB p={[0, 0.02, -1.28]} s={[3.7, 0.14, 0.52]} r={0.02} color={deckCol} rough={0.65} />
      <RB p={[0, 0.02, 1.28]} s={[3.7, 0.14, 0.52]} r={0.02} color={deckCol} rough={0.65} />
      <RB p={[-1.62, 0.02, 0]} s={[0.56, 0.14, 2.1]} r={0.02} color={deckCol} rough={0.65} />
      <RB p={[1.62, 0.02, 0]} s={[0.56, 0.14, 2.1]} r={0.02} color={deckCol} rough={0.65} />

      {/* Back Edwardian bulkhead wall + brass wall sconces & arched pilasters */}
      <RB p={[0, 1.15, -1.48]} s={[3.7, 2.2, 0.12]} r={0.02} color={wreck > 0.5 ? "#392b22" : "#eae3d4"} rough={0.75} />
      {[-1.4, -0.48, 0.48, 1.4].map((x, i) => (
        <group key={i} position={[x, 1.1, -1.39]}>
          <RB p={[0, 0, 0]} s={[0.18, 2.1, 0.08]} r={0.015} color={wreck > 0.5 ? "#5a4332" : "#dfd7c4"} rough={0.6} />
          {i === 1 || i === 2 ? (
            <mesh position={[0, 0.35, 0.08]}>
              <sphereGeometry args={[0.075, 12, 10]} />
              <meshStandardMaterial color="#ffe4a4" emissive="#ffd173" emissiveIntensity={wreck > 0.5 ? 0.25 : 1.5} />
            </mesh>
          ) : null}
        </group>
      ))}
      {/* Brass pool entry ladder + diving springboard on right apron */}
      {[-0.14, 0.14].map((dz, i) => (
        <Cyl key={i} p={[-1.28, 0.05, dz]} r={0.018} h={0.95} color="#d6aa42" metal={0.9} rough={0.2} />
      ))}
      <RB p={[1.28, 0.14, 0]} s={[0.58, 0.04, 0.26]} r={0.01} color="#c28e52" rough={0.5} />

      {/* Clear translucent heated blue saltwater volume so tiled floor & steps visibly shimmer underneath */}
      <mesh position={[0, -0.18 + Math.sin(t * 2.5) * 0.015, 0]}>
        <boxGeometry args={[2.76, 0.42, 2.04]} />
        <meshPhysicalMaterial color="#18b7e8" emissive="#127eb8" emissiveIntensity={0.35} roughness={0.08} transparent opacity={0.44} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.04 + Math.sin(t * 2.5) * 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.72, 2.0]} />
        <meshBasicMaterial color="#7ce3ff" transparent opacity={0.26} />
      </mesh>

      {/* Marine snow / warm steam motes floating above water */}
      {[0, 1, 2, 3, 4].map((i) => {
        const yy = ((t * 0.45 + i * 0.21) % 1) * 1.1;
        return (
          <mesh key={i} position={[-0.9 + i * 0.45, 0.2 + yy, Math.sin(t + i) * 0.4]}>
            <sphereGeometry args={[0.032, 8, 6]} />
            <meshBasicMaterial color={wreck > 0.5 ? "#95dcff" : "#ffffff"} transparent opacity={0.55 * (1 - yy)} />
          </mesh>
        );
      })}
    </group>
  );
};

// ───────────────────────── 9. FloatingDoor (carved oak panel + glowing "ROOM FOR 2" outline) ─────────────────────────
export const FloatingDoor: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; hero?: React.ReactNode }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  hero,
}) => {
  const oak = useMemo(() => tex("planks", "#5e361c", [2, 2], 44), []);
  const chalk = useMemo(
    () =>
      ptex("room-for-2", 512, 256, (g) => {
        g.clearRect(0, 0, 512, 256);
        g.strokeStyle = "#7cf5ff";
        g.lineWidth = 7;
        g.setLineDash([14, 10]);
        g.strokeRect(18, 18, 476, 220);
        g.setLineDash([]);
        g.fillStyle = "#ffffff";
        g.font = "900 54px Arial, sans-serif";
        g.textAlign = "center";
        g.fillText("ROOM FOR 2", 256, 118);
        g.fillStyle = "#7cf5ff";
        g.font = "800 32px Arial, sans-serif";
        g.fillText("SPACE AVAILABLE ✓", 256, 178);
      }),
    [],
  );

  const bob = Math.sin(t * 2.1) * 0.03;
  const roll = Math.sin(t * 1.6) * 0.03;

  return (
    <group position={[p[0], p[1] + bob, p[2]]} rotation={[roll * 0.7, ry, roll]} scale={scale}>
      {/* Double-wide carved oak Titanic paneling door */}
      <RB p={[0, 0, 0]} s={[2.35, 0.12, 1.38]} r={0.03} map={oak} rough={0.62} />
      {/* Raised decorative carved trim frames */}
      <RB p={[-0.55, 0.068, 0]} s={[0.88, 0.03, 0.96]} r={0.01} color="#4a2813" rough={0.55} />
      <RB p={[0.55, 0.068, 0]} s={[0.88, 0.03, 0.96]} r={0.01} color="#4a2813" rough={0.55} />
      {/* Brass door handle knob on left end */}
      <Cyl p={[-1.06, 0.09, 0.42]} r={0.045} h={0.08} color="#dfae3e" metal={0.9} rough={0.2} />
      {/* Glowing chalk "ROOM FOR 2" dashed reserve on the empty right half */}
      <mesh position={[0.54, 0.092, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.05, 0.92]} />
        <meshBasicMaterial map={chalk} transparent />
      </mesh>
      {/* Fursuit / survivor hero sitting on the left half */}
      {hero ? <group position={[-0.56, 0.08, 0]}>{hero}</group> : null}
    </group>
  );
};
