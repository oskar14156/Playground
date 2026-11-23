import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Cyl, RB } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";

const cache = new Map<string, THREE.CanvasTexture>();
const ptex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  if (cache.has(key)) return cache.get(key)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, seeded(key.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 29) >>> 0));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
};

// ───────────────────────── 1. FighterJet (swept delta naval stealth jet + twin tailfins + optional afterburner) ─────────────────────────
export const FighterJet: React.FC<{
  p?: V3;
  rot?: V3;
  scale?: number;
  afterburner?: number;
  hookDown?: boolean;
}> = ({ p = [0, 0, 0], rot = [0, 0, 0], scale = 1, afterburner = 0, hookDown = false }) => (
  <group position={p} rotation={rot} scale={scale}>
    {/* Fuselage & pointed radome nose (+X forward) */}
    <RB p={[0, 0.08, 0]} s={[1.05, 0.14, 0.22]} r={0.04} color="#5f6c7a" metal={0.62} rough={0.32} />
    <mesh position={[0.66, 0.07, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <coneGeometry args={[0.095, 0.36, 12]} />
      <meshStandardMaterial color="#3c4652" metalness={0.55} roughness={0.35} />
    </mesh>
    {/* Bubble cockpit canopy */}
    <mesh position={[0.26, 0.16, 0]} scale={[1.8, 0.72, 0.65]}>
      <sphereGeometry args={[0.11, 12, 8]} />
      <meshPhysicalMaterial color="#ffc85c" metalness={0.45} roughness={0.12} clearcoat={1} />
    </mesh>
    {/* Swept delta main wings + horizontal tailplanes */}
    <RB p={[-0.08, 0.08, -0.32]} rot={[0, 0.44, 0]} s={[0.42, 0.03, 0.56]} r={0.01} color="#687685" metal={0.6} />
    <RB p={[-0.08, 0.08, 0.32]} rot={[0, -0.44, 0]} s={[0.42, 0.03, 0.56]} r={0.01} color="#687685" metal={0.6} />
    {/* Twin outward-cant vertical tail stabilizers */}
    <RB p={[-0.42, 0.22, -0.11]} rot={[-0.28, 0, -0.2]} s={[0.22, 0.22, 0.025]} r={0.008} color="#4f5b69" metal={0.6} />
    <RB p={[-0.42, 0.22, 0.11]} rot={[0.28, 0, -0.2]} s={[0.22, 0.22, 0.025]} r={0.008} color="#4f5b69" metal={0.6} />
    {/* Arresting tailhook when landing */}
    {hookDown ? <Cyl p={[-0.56, -0.05, 0]} r={0.016} h={0.34} rot={[0, 0, -0.62]} color="#ffd23f" metal={0.85} /> : null}
    {/* Twin exhaust nozzles & blazing afterburner flames */}
    {[-0.055, 0.055].map((nz, idx) => (
      <group key={idx} position={[-0.52, 0.07, nz]}>
        <Cyl p={[0, 0, 0]} r={0.042} h={0.08} rot={[0, 0, Math.PI / 2]} color="#232930" metal={0.85} />
        {afterburner > 0.1 ? (
          <group position={[-0.18 * afterburner, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.045, 0.42 * afterburner, 10]} />
              <meshBasicMaterial color="#ff9234" />
            </mesh>
            <Glow position={[0, 0, 0]} size={0.35 * afterburner} color="#6af0ff" opacity={0.85} />
          </group>
        ) : null}
      </group>
    ))}
  </group>
);

// ───────────────────────── 2. CarrierHull333m (USS Gerald R. Ford 333m deck + aft island + 30x jets) ─────────────────────────
export const CarrierHull333m: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  t?: number;
  xray?: number;
  hero?: React.ReactNode;
}> = ({ p = [0, 0, 0], ry = 0, scale = 1, t = 0, xray = 0, hero }) => {
  const steel = usePbr("metal_plate", [4, 2]);
  const deckTex = useMemo(
    () =>
      ptex("cvn78-deck", 1024, 320, (g) => {
        g.fillStyle = "#363e48";
        g.fillRect(0, 0, 1024, 320);
        // Edge white safety foul lines
        g.fillStyle = "#eef2f6";
        g.fillRect(14, 18, 996, 6);
        g.fillRect(14, 296, 996, 6);
        // Angled runway centerline & twin dashed stripes
        g.save();
        g.translate(450, 160);
        g.rotate(-0.15);
        g.fillStyle = "#ffd23f";
        g.fillRect(-380, -3, 760, 6);
        g.fillStyle = "#ffffff";
        for (let x = -360; x < 360; x += 48) g.fillRect(x, -46, 26, 4);
        for (let x = -360; x < 360; x += 48) g.fillRect(x, 42, 26, 4);
        g.restore();
        // Bow 78 number + EMALS catapult tracks
        g.fillStyle = "#ffffff";
        g.font = "bold 54px sans-serif";
        g.fillText("78", 890, 92);
        g.fillStyle = "#7ea8c4";
        g.fillRect(620, 74, 360, 5);
        g.fillRect(620, 114, 360, 5);
      }),
    [],
  );

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Tapered armored lower waterline hull */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 0.44, 1.15]} />
        <meshStandardMaterial
          color="#46515e"
          map={steel.map}
          roughness={0.55}
          metalness={0.5}
          transparent={xray > 0.25}
          opacity={xray > 0.25 ? 0.34 : 1}
        />
      </mesh>
      {/* Flared bow wave splitter & bronze quadruple propellers astern */}
      <mesh position={[3.05, 0.24, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.44, 0.8]} />
        <meshStandardMaterial color="#46515e" metalness={0.55} roughness={0.5} transparent={xray > 0.25} opacity={xray > 0.25 ? 0.34 : 1} />
      </mesh>
      {[-0.28, 0.28].map((pz, i) => (
        <Cyl key={i} p={[-3.0, 0.14, pz]} r={0.14} h={0.08} rot={[0, 0, Math.PI / 2]} color="#d89e3c" metal={0.9} />
      ))}

      {/* Crisp foam white wake along waterline */}
      <RB p={[-0.2, 0.02, 0]} s={[6.6, 0.04, 1.38]} r={0.02} color="#dcf6ff" opacity={0.45} />

      {/* Overhanging 333 m flight deck platform with angled recovery waist */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 0.1, 1.68]} />
        <meshStandardMaterial color="#68727d" map={deckTex} roughness={0.68} metalness={0.25} />
      </mesh>
      {/* Aft-positioned CVN-78 Island Superstructure with SPY-6 octagonal radar faces */}
      <group position={[-1.45, 0.55, 0.62]}>
        <RB p={[0, 0.38, 0]} s={[0.82, 0.72, 0.34]} r={0.02} color="#7e8994" metal={0.45} />
        <RB p={[0.08, 0.82, 0]} s={[0.52, 0.22, 0.28]} r={0.02} color="#929ca6" metal={0.45} />
        <RB p={[0.14, 0.48, -0.18]} s={[0.24, 0.24, 0.04]} r={0.01} color="#c4d4e2" metal={0.7} />
        <Cyl p={[0, 1.12, 0]} r={0.03} h={0.48} color="#cad4de" metal={0.8} />
        {/* Rotating navigation radar bar */}
        <RB p={[0, 1.28, 0]} rot={[0, t * 3.5, 0]} s={[0.38, 0.04, 0.06]} r={0.01} color="#eef6ff" emissive="#6cf0ff" ei={0.8} />
        {hero ? <group position={[0, 0.96, 0]}>{hero}</group> : null}
      </group>

      {/* Parked fighter wings on flight deck */}
      {[
        [1.4, -0.5, 0.35],
        [0.6, -0.52, 0.4],
        [-0.3, 0.55, -0.35],
        [-2.2, 0.52, -0.45],
      ].map(([jx, jz, jrot], idx) => (
        <FighterJet key={idx} p={[jx, 0.57, jz]} rot={[0, jrot, 0]} scale={0.42} />
      ))}
    </group>
  );
};

// ───────────────────────── 3. EmalsTrackCutaway (0->240 km/h in 2s electromagnetic launch trench) ─────────────────────────
export const EmalsTrackCutaway: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; progress?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  progress = 0.45,
}) => {
  const coils = useMemo(() => Array.from({ length: 12 }, (_, i) => -2.2 + i * 0.4), []);
  const jetX = -2.2 + progress * 4.9;
  const liftY = progress > 0.78 ? Math.pow((progress - 0.78) / 0.22, 1.5) * 1.45 : 0;
  const pitch = progress > 0.78 ? ((progress - 0.78) / 0.22) * 0.32 : 0;

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Far deck wing + clear cutaway glass front apron revealing open EMALS trench */}
      <RB p={[0, 0.42, -0.58]} s={[5.4, 0.14, 0.95]} r={0.02} color="#46515e" metal={0.6} />
      <RB p={[0, 0.42, 0.58]} s={[5.4, 0.14, 0.95]} r={0.02} color="#68d8ff" opacity={0.25} />
      <RB p={[0, -0.05, 0]} s={[5.4, 0.2, 2.0]} r={0.02} color="#182330" metal={0.75} />

      {/* Linear Induction Stator Coils lighting up sequentially behind catapult shuttle */}
      {coils.map((cx, i) => {
        const active = Math.abs(cx - jetX) < 0.75 || cx < jetX;
        const hot = Math.abs(cx - jetX) < 0.45;
        return (
          <group key={i} position={[cx, 0.25, 0]}>
            <RB p={[0, 0, 0]} s={[0.18, 0.34, 0.42]} r={0.02} color="#34485e" metal={0.72} />
            <RB
              p={[0, 0.08, 0.2]}
              s={[0.16, 0.16, 0.06]}
              r={0.01}
              color={hot ? "#6af4ff" : active ? "#2892c4" : "#24303c"}
              emissive={hot ? "#6af4ff" : "#1c80b4"}
              ei={hot ? 1.8 : active ? 0.9 : 0.15}
            />
          </group>
        );
      })}

      {/* Electromagnetic Launch Shuttle + FighterJet blasting off bow */}
      <RB p={[Math.min(2.3, jetX), 0.44, 0]} s={[0.24, 0.09, 0.18]} r={0.01} color="#ffd23f" emissive="#ffd23f" ei={0.7} />
      <FighterJet p={[jetX, 0.55 + liftY, 0]} rot={[0, 0, pitch]} scale={1.08} afterburner={1.0} />
      <Glow position={[jetX - 0.55, 0.55 + liftY, 0]} size={0.65} color="#7ef4ff" opacity={0.55 + Math.sin(t * 16) * 0.15} />
    </group>
  );
};

// ───────────────────────── 4. ArrestingGearBay (3 cables + sub-deck AAG water turbines -> touch-and-go) ─────────────────────────
export const ArrestingGearBay: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; pull?: number; bolter?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  pull = 0.5,
  bolter = 0,
}) => {
  const wires = [-0.65, 0.05, 0.75];
  const catchWire = 0.05;
  const jetX = bolter > 0.5 ? -2.1 + pull * 5.2 : -1.9 + pull * 2.75;
  const jetY = bolter > 0.5 ? (pull > 0.55 ? 0.58 + (pull - 0.55) * 3.1 : 0.58 + (1 - pull) * 0.4) : 0.58 + (pull < 0.25 ? (0.25 - pull) * 1.4 : 0);
  const wireStretch = bolter > 0.5 ? 0 : pull > 0.25 ? Math.max(0, (jetX - 0.6) * 0.75) : 0;

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Upper stern flight deck */}
      <RB p={[0, 0.46, 0]} s={[5.2, 0.14, 2.2]} r={0.02} color="#3b444f" metal={0.55} />
      {/* 3 Arresting Steel Cables across deck (cable #2 deflecting V-shape on catch!) */}
      {wires.map((wx, idx) => (
        <group key={idx}>
          {idx === 1 && wireStretch > 0.02 ? (
            <>
              <Cyl
                p={[(wx + jetX - 0.45) * 0.5, 0.55, -0.5]}
                r={0.02}
                h={1.25}
                rot={[Math.PI / 2, 0, -Math.atan2(jetX - 0.45 - wx, 1.0)]}
                color="#ffd23f"
              />
              <Cyl
                p={[(wx + jetX - 0.45) * 0.5, 0.55, 0.5]}
                r={0.02}
                h={1.25}
                rot={[Math.PI / 2, 0, Math.atan2(jetX - 0.45 - wx, 1.0)]}
                color="#ffd23f"
              />
            </>
          ) : (
            <Cyl p={[wx, 0.55, 0]} r={0.02} h={2.05} rot={[Math.PI / 2, 0, 0]} color="#ffd23f" metal={0.85} />
          )}
        </group>
      ))}

      {/* Lower deck compartment exposing 3 giant AAG water-turbine brake drums */}
      <RB p={[0, -0.88, 0]} s={[5.2, 0.16, 2.2]} r={0.02} color="#1a2432" metal={0.75} />
      {wires.map((wx, idx) => (
        <group key={`turb-${idx}`} position={[wx, -0.35, 0]}>
          <Cyl p={[0, 0, 0]} r={0.34} h={0.72} rot={[0, t * (idx === 1 ? 8 : 2), 0]} color="#3ba8d8" metal={0.65} />
          <Cyl p={[0, 0.42, 0]} r={0.03} h={0.8} color="#dce4ec" metal={0.9} />
        </group>
      ))}

      {/* Landing or full-throttle bolter FighterJet */}
      <FighterJet p={[jetX, jetY, 0]} rot={[0, 0, bolter > 0.5 && pull > 0.55 ? 0.34 : 0]} scale={0.95} afterburner={bolter > 0.5 ? 1.2 : 0.45} hookDown />
      {catchWire ? null : null}
    </group>
  );
};

// ───────────────────────── 5. A1BReactorPair (twin pressurized nuclear cores glowing Cherenkov blue in hull) ─────────────────────────
export const A1BReactorPair: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
}) => (
  <group position={p} rotation={[0, ry, 0]} scale={scale}>
    <RB p={[0, -0.05, 0]} s={[4.2, 0.16, 2.1]} r={0.02} color="#1b2532" metal={0.75} />
    {[-0.85, 0.85].map((rx, i) => (
      <group key={i} position={[rx, 0.65, 0]}>
        <Cyl p={[0, 0, 0]} r={0.48} h={1.25} seg={24} color="#c4d2e0" metal={0.82} rough={0.2} />
        <mesh position={[0, 0.64, 0]}>
          <sphereGeometry args={[0.48, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#dce6f0" metalness={0.85} roughness={0.18} />
        </mesh>
        {/* Glowing Cherenkov core ring */}
        <Cyl p={[0, 0.05, 0]} r={0.5} h={0.34} seg={24} color="#44eeff" emissive="#44eeff" ei={1.2 + Math.sin(t * 5 + i) * 0.2} />
        <Glow position={[0, 0.05, 0.42]} size={0.85} color="#44eeff" opacity={0.45} />
      </group>
    ))}
    {/* High-pressure copper/silver steam manifold connecting both reactors to twin aft shafts */}
    <RB p={[0, 1.15, -0.35]} s={[2.1, 0.12, 0.18]} r={0.03} color="#e5ba45" metal={0.88} />
    <Cyl p={[0, 0.55, -0.35]} r={0.06} h={1.25} color="#e5ba45" metal={0.88} />
  </group>
);
