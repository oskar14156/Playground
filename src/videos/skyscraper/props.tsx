import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Cyl, RB, tex } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";

// ───────────────────────── canvas texture cache ─────────────────────────
const cache = new Map<string, THREE.CanvasTexture>();
const ptex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  if (cache.has(key)) return cache.get(key)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, seeded(key.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 19) >>> 0));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
};

// ───────────────────────── 1. BurjTower (Y-shaped buttressed core + 27 spiraling setbacks) ─────────────────────────
export const BurjTower: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  t?: number;
  /** 0..1 flexural storm sway across upper tiers */
  sway?: number;
  /** 0..1 highlights inner hexagonal buttressed core in orange */
  cutaway?: number;
  /** 0 = Y-shaped 27-setback tower; 1 = straight uniform tower shaking violently */
  straightMode?: number;
}> = ({ p = [0, 0, 0], ry = 0, scale = 1, t = 0, sway = 0.15, cutaway = 0, straightMode = 0 }) => {
  const cladding = useMemo(
    () =>
      ptex("burj-glass", 256, 512, (g) => {
        g.fillStyle = "#5b86a3";
        g.fillRect(0, 0, 256, 512);
        // vertical stainless steel mullions
        g.fillStyle = "#c9dce8";
        for (let x = 0; x < 256; x += 24) g.fillRect(x, 0, 3, 512);
        // horizontal spandrel floor bands
        g.fillStyle = "#263b4c";
        for (let y = 0; y < 512; y += 22) g.fillRect(0, y, 256, 3);
      }),
    [],
  );

  // 27 spiraling setbacks arranged across 3 Y wings (angles 0, 2pi/3, 4pi/3)
  const tiers = useMemo(
    () =>
      Array.from({ length: 27 }, (_, i) => {
        const k = i / 27;
        const wing = i % 3;
        const hBot = k * 5.2;
        const h = (1 - k * 0.65) * 0.68 + 0.18;
        const reach = (1 - k * 0.82) * 0.85 + 0.12;
        const thick = (1 - k * 0.6) * 0.28 + 0.08;
        return { i, wing, angle: (wing * Math.PI * 2) / 3 + 0.35, hBot, h, reach, thick };
      }),
    [],
  );

  const swayAmp = sway * 0.18;
  const beaconOn = Math.sin(t * 6.5) > 0.2;

  if (straightMode > 0.5) {
    const vib = Math.sin(t * 16) * 0.09;
    return (
      <group position={p} rotation={[0, ry, 0]} scale={scale}>
        <group rotation={[0, 0, vib]}>
          <RB p={[0, 2.75, 0]} s={[0.85, 5.5, 0.85]} r={0.04} color="#7ea8c2" map={cladding} metal={0.65} rough={0.2} />
          <Cyl p={[0, 6.0, 0]} r={0.04} r2={0.01} h={1.2} color="#dce6ef" metal={0.9} />
        </group>
      </group>
    );
  }

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Central Y-buttressed hexagonal concrete core */}
      {Array.from({ length: 12 }, (_, s) => {
        const yNorm = s / 12;
        const yCenter = yNorm * 5.4 + 0.24;
        const flex = Math.sin(t * 2.2) * swayAmp * Math.pow(yNorm, 1.7);
        const r = Math.max(0.11, 0.36 * (1 - yNorm * 0.72));
        return (
          <Cyl
            key={`core-${s}`}
            p={[flex, yCenter, 0]}
            r={r}
            r2={Math.max(0.09, r * 0.92)}
            h={0.52}
            seg={6}
            color={cutaway > 0.25 ? "#ff8c38" : "#89b2cb"}
            emissive={cutaway > 0.25 ? "#ff6614" : "#183e57"}
            ei={cutaway > 0.25 ? 0.85 : 0.15}
            metal={0.55}
            rough={0.22}
          />
        );
      })}

      {/* 27 spiraling setback lobes around the central Y core */}
      {tiers.map((tr) => {
        const yNorm = (tr.hBot + tr.h * 0.5) / 6.0;
        const flex = Math.sin(t * 2.2) * swayAmp * Math.pow(yNorm, 1.7);
        const dx = Math.cos(tr.angle) * (tr.reach * 0.5);
        const dz = Math.sin(tr.angle) * (tr.reach * 0.5);
        return (
          <group key={tr.i} position={[flex + dx, tr.hBot + tr.h * 0.5, dz]} rotation={[0, -tr.angle, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[tr.thick * 0.48, tr.thick * 0.52, tr.h, 12]} />
              <meshPhysicalMaterial
                color="#79abc8"
                map={cladding}
                roughness={0.16}
                metalness={0.62}
                clearcoat={0.7}
                transparent={cutaway > 0.35}
                opacity={cutaway > 0.35 ? 0.55 : 1}
              />
            </mesh>
            {/* Inner wing web connecting lobe to central Y core */}
            <RB
              p={[-tr.reach * 0.25, 0, 0]}
              s={[tr.reach * 0.6, tr.h * 0.98, tr.thick * 0.92]}
              r={0.02}
              color="#6ea1bf"
              map={cladding}
              metal={0.62}
              rough={0.18}
              opacity={cutaway > 0.35 ? 0.55 : undefined}
            />
          </group>
        );
      })}

      {/* Steel pinnacle spire (y = 5.5 .. 7.1) flexing smoothly with tip sway */}
      <group position={[Math.sin(t * 2.2) * swayAmp, 5.55, 0]}>
        <Cyl p={[0, 0.75, 0]} r={0.075} r2={0.015} h={1.55} color="#dce6f0" metal={0.9} rough={0.18} />
        <mesh position={[0, 1.54, 0]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshBasicMaterial color={beaconOn ? "#ff3b30" : "#5a1412"} />
        </mesh>
        {beaconOn ? <Glow position={[0, 1.54, 0]} size={0.55} color="#ff4238" opacity={0.75} /> : null}
      </group>
    </group>
  );
};

// ───────────────────────── 2. FrictionPilesCutaway (192 piles 50m deep in desert sand, ZERO bedrock) ─────────────────────────
export const FrictionPilesCutaway: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; arrows?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  arrows = 1,
}) => {
  const sand = usePbr("coast_sand_rocks_02", [4, 2]);
  const raft = usePbr("concrete_floor_02", [3, 1]);

  const pileCoords = useMemo(() => {
    const out: [number, number][] = [];
    // Y-footprint + hex cluster of piles representing 192 dense 50m friction piles
    for (let r = 0; r < 3; r++) {
      const a = (r * Math.PI * 2) / 3 + 0.35;
      for (let d = 0.25; d <= 1.25; d += 0.33) {
        out.push([Math.cos(a) * d, Math.sin(a) * d]);
        out.push([Math.cos(a + 0.18) * (d * 0.88), Math.sin(a + 0.18) * (d * 0.88)]);
      }
    }
    return out;
  }, []);

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Framed 3-sided geological desert strata cutaway (sand, gypsum-silt, looser deeper sand — zero bedrock) */}
      <mesh position={[0, -1.65, -1.1]} receiveShadow>
        <boxGeometry args={[6.4, 3.6, 1.3]} />
        <meshStandardMaterial color="#cca970" map={sand.map} normalMap={sand.normalMap} roughnessMap={sand.roughnessMap} roughness={0.92} />
      </mesh>
      {/* Left & right geological trench side walls framing the friction pile cavity */}
      {[-2.5, 2.5].map((wx) => (
        <mesh key={wx} position={[wx, -1.65, 0.1]} receiveShadow>
          <boxGeometry args={[1.4, 3.6, 1.65]} />
          <meshStandardMaterial color="#bf9a62" map={sand.map} normalMap={sand.normalMap} roughnessMap={sand.roughnessMap} roughness={0.94} />
        </mesh>
      ))}
      {/* Horizontal stratified sediment bands across back & deeper loose sand layer at bottom */}
      <RB p={[0, -0.75, -0.44]} s={[6.35, 0.28, 0.08]} r={0.01} color="#e2c288" rough={0.94} />
      <RB p={[0, -1.85, -0.44]} s={[6.35, 0.32, 0.08]} r={0.01} color="#b48a54" rough={0.95} />
      <RB p={[0, -3.22, -0.15]} s={[6.4, 0.56, 2.5]} r={0.02} color="#8a6c44" rough={0.96} />
      {/* Thin desert surface crust framing top edge around tower base */}
      <mesh position={[0, 0.12, -1.05]} receiveShadow>
        <boxGeometry args={[6.4, 0.16, 1.35]} />
        <meshStandardMaterial color="#e0be86" map={sand.map} roughness={0.9} />
      </mesh>

      {/* 3.7 m thick reinforced concrete Y-shaped transfer foundation raft sitting cleanly atop piles */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.92, 0.98, 0.36, 6]} />
        <meshStandardMaterial color="#b4bcc6" map={raft.map} normalMap={raft.normalMap} roughnessMap={raft.roughnessMap} roughness={0.74} metalness={0.1} />
      </mesh>
      {[0, 1, 2].map((w) => {
        const ang = (w * Math.PI * 2) / 3 + 0.35;
        return (
          <group key={w} rotation={[0, -ang, 0]}>
            <mesh position={[0.92, 0.08, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.38, 0.36, 0.72]} />
              <meshStandardMaterial color="#aeb7c2" map={raft.map} normalMap={raft.normalMap} roughnessMap={raft.roughnessMap} roughness={0.75} metalness={0.1} />
            </mesh>
          </group>
        );
      })}
      {/* Lower tower stump resting firmly on the Y-raft */}
      <BurjTower p={[0, 0.25, 0]} scale={0.44} sway={0} />

      {/* Dense forest of 50m bored concrete friction piles with spiral gripping rings & UP friction arrows */}
      {pileCoords.map(([x, z], idx) => (
        <group key={idx} position={[x, -1.5, z]}>
          <Cyl p={[0, 0, 0]} r={0.058} h={2.85} color="#6fc1d6" emissive="#1c88a8" ei={0.32} rough={0.44} metal={0.22} />
          <Cyl p={[0, 1.35, 0]} r={0.074} h={0.14} color="#9aa4b0" rough={0.6} />
          {[-0.85, 0, 0.85].map((ry) => (
            <Cyl key={ry} p={[0, ry, 0]} r={0.065} h={0.035} color="#3a7b96" rough={0.5} />
          ))}
          {/* Skin-friction grip arrows pointing UP along outer pile walls */}
          {arrows > 0.1 && idx % 3 === 0 ? (
            <group position={[0.1, (((t * 0.9 + idx * 0.23) % 1) - 0.5) * 2.0, 0]}>
              <Cyl p={[0, 0, 0]} r={0.022} h={0.3} color="#ffd23f" emissive="#ffd23f" ei={1.0 * arrows} />
              <mesh position={[0, 0.2, 0]}>
                <coneGeometry args={[0.058, 0.12, 8]} />
                <meshBasicMaterial color="#ffd23f" />
              </mesh>
            </group>
          ) : null}
        </group>
      ))}
    </group>
  );
};

// ───────────────────────── 3. IceConcreteMixer (night site with mixer truck, gantry ice chiller & trailer pump) ─────────────────────────
export const IceConcreteMixer: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; hotCrack?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  hotCrack = 0,
}) => {
  const concrete = usePbr("concrete_floor_02", [2, 2]);
  const steel = usePbr("metal_plate", [2, 1]);

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Concrete pour slab + yellow perimeter safety curbs */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[4.8, 0.14, 3.4]} />
        <meshStandardMaterial
          color={hotCrack > 0.5 ? "#d87a4a" : "#89949e"}
          map={concrete.map}
          normalMap={concrete.normalMap}
          roughnessMap={concrete.roughnessMap}
          roughness={0.85}
        />
      </mesh>
      <RB p={[0, 0.04, -1.58]} s={[4.6, 0.08, 0.14]} r={0.01} color="#e5b93b" rough={0.55} />

      {/* Night site halogen floodlight mast on back-left */}
      <group position={[-1.95, 0.02, -1.25]}>
        <RB p={[0, 0.08, 0]} s={[0.45, 0.16, 0.45]} r={0.02} color="#2c3746" metal={0.7} />
        <Cyl p={[0, 1.35, 0]} r={0.035} h={2.6} color="#9aa6b4" metal={0.8} />
        <RB p={[0, 2.6, 0]} s={[0.56, 0.08, 0.08]} r={0.01} color="#2c3746" metal={0.7} />
        {[-0.18, 0.18].map((lx) => (
          <RB key={lx} p={[lx, 2.52, 0.07]} rot={[0.42, 0, 0]} s={[0.18, 0.12, 0.08]} r={0.01} color="#fff6dc" emissive="#a8e8ff" ei={1.5} />
        ))}
      </group>

      {/* Glowing orange heat cracks when daytime 50C */}
      {hotCrack > 0.2
        ? [-0.9, 0.15, 0.85].map((x, i) => (
            <RB key={i} p={[x, 0.03, 0.55 - i * 0.2]} s={[1.1, 0.02, 0.06]} rot={[0, i * 0.5, 0]} r={0.005} color="#ff5a1f" emissive="#ff5a1f" ei={1.5 * hotCrack} />
          ))
        : null}

      {/* Detailed Ready-Mix Concrete Agitator Truck (facing -X, rear drum feeding pump on +X) */}
      <group position={[-0.75, 0.02, 0.15]}>
        {/* Chassis frame & 4 rugged tires with silver wheel hubs */}
        <RB p={[0, 0.34, 0]} s={[1.85, 0.12, 0.82]} r={0.02} color="#26303d" metal={0.65} rough={0.4} />
        {[
          [-0.65, -0.4],
          [-0.65, 0.4],
          [0.52, -0.4],
          [0.52, 0.4],
        ].map(([wx, wz], wi) => (
          <group key={wi} position={[wx, 0.2, wz]}>
            <Cyl p={[0, 0, 0]} r={0.2} h={0.14} rot={[Math.PI / 2, 0, 0]} color="#171b21" rough={0.85} />
            <Cyl p={[0, 0, 0]} r={0.1} h={0.15} rot={[Math.PI / 2, 0, 0]} color="#c4cfd9" metal={0.8} />
          </group>
        ))}
        {/* Amber truck cab + dark windshield + warm headlights */}
        <RB p={[-0.66, 0.64, 0]} s={[0.56, 0.52, 0.78]} r={0.04} color="#e5b83b" metal={0.35} rough={0.35} />
        <RB p={[-0.72, 0.71, 0]} s={[0.48, 0.24, 0.74]} r={0.02} color="#172434" rough={0.15} metal={0.7} />
        {[-0.24, 0.24].map((hz) => (
          <RB key={hz} p={[-0.95, 0.47, hz]} s={[0.04, 0.08, 0.12]} r={0.01} color="#fff4c4" emissive="#ffd878" ei={1.2} />
        ))}
        {/* Steel pedestal A-frames anchoring the mixer drum to the truck chassis */}
        <RB p={[-0.2, 0.52, 0]} s={[0.12, 0.28, 0.62]} r={0.01} color="#343f4d" metal={0.75} />
        <RB p={[0.58, 0.64, 0]} s={[0.14, 0.52, 0.66]} r={0.01} color="#343f4d" metal={0.75} />
        {/* Tilted ribbed mixing drum */}
        <group position={[0.18, 0.8, 0]} rotation={[0, 0, -0.24]}>
          <group rotation={[t * 2.2, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.38, 0.44, 1.18, 18]} />
              <meshStandardMaterial color={hotCrack > 0.5 ? "#d86b38" : "#dce6f0"} map={steel.map} roughness={0.35} metalness={0.45} />
            </mesh>
            {[-0.3, 0, 0.3].map((rx) => (
              <Cyl key={rx} p={[rx, 0, 0]} r={0.43} h={0.045} rot={[0, 0, Math.PI / 2]} color="#43a6d6" metal={0.6} />
            ))}
          </group>
        </group>
        {/* Rear intake hopper & angled concrete discharge chute toward trailer pump */}
        <Cyl p={[0.74, 1.05, 0]} r={0.22} r2={0.09} h={0.32} color="#2f3a47" metal={0.7} />
        <RB p={[0.98, 0.62, 0]} rot={[0, 0, -0.58]} s={[0.56, 0.06, 0.22]} r={0.01} color="#8f9aa6" metal={0.75} />
      </group>

      {/* Anchored 4-leg Steel Ice-Batch Gantry feeding crushed ice straight into mixer hopper */}
      {hotCrack < 0.5 ? (
        <group position={[-0.1, 0.02, -0.48]}>
          {[
            [-0.45, -0.32],
            [0.45, -0.32],
            [-0.45, 0.32],
            [0.45, 0.32],
          ].map(([gx, gz], gi) => (
            <Cyl key={gi} p={[gx, 0.82, gz]} r={0.032} h={1.65} color="#4d5c6e" metal={0.8} rough={0.32} />
          ))}
          <RB p={[0, 1.65, 0]} s={[1.05, 0.08, 0.78]} r={0.01} color="#344150" metal={0.75} />
          {/* Stainless insulated crushed-ice silo firmly mounted on the gantry deck */}
          <Cyl p={[0, 1.98, 0]} r={0.42} r2={0.36} h={0.58} color="#3ba8d8" metal={0.45} rough={0.28} />
          <Cyl p={[0, 1.56, 0]} r={0.32} r2={0.12} h={0.24} color="#687a8c" metal={0.7} />
          {/* Angled ice chute down toward mixer rear hopper */}
          <RB p={[0.05, 1.32, 0.34]} rot={[0.58, 0, 0]} s={[0.26, 0.06, 0.72]} r={0.01} color="#7ea8c4" metal={0.65} />
          {/* Sparkling crushed ice cubes cascading along the chute */}
          {Array.from({ length: 7 }, (_, k) => {
            const drop = (t * 1.45 + k * 0.14) % 1;
            return (
              <mesh
                key={k}
                position={[(k % 3 - 1) * 0.06, 1.44 - drop * 0.38, 0.1 + drop * 0.52]}
                rotation={[t * 3 + k, t * 2, k]}
              >
                <boxGeometry args={[0.095, 0.095, 0.095]} />
                <meshPhysicalMaterial color="#d2f6ff" emissive="#6ae2ff" emissiveIntensity={0.5} roughness={0.1} clearcoat={1} />
              </mesh>
            );
          })}
        </group>
      ) : null}

      {/* High-pressure Schwing-style Concrete Trailer Pump + Bolted Vertical Riser Pipe */}
      <group position={[1.1, 0.02, 0.15]}>
        {/* Pump wheels + frame */}
        {[-0.36, 0.36].map((wz) => (
          <Cyl key={wz} p={[0.05, 0.16, wz]} r={0.16} h={0.1} rot={[Math.PI / 2, 0, 0]} color="#171b21" rough={0.85} />
        ))}
        <RB p={[0.08, 0.36, 0]} s={[0.92, 0.34, 0.62]} r={0.03} color="#e5ba45" metal={0.55} rough={0.32} />
        {/* Intake concrete hopper receiving chute pour */}
        <RB p={[-0.38, 0.56, 0]} s={[0.38, 0.28, 0.56]} r={0.02} color="#343f4d" metal={0.7} />
        {/* Swept steel S-bend flange feeding vertical riser */}
        <RB p={[0.32, 0.48, -0.15]} s={[0.24, 0.18, 0.34]} r={0.04} color="#58b8e6" metal={0.8} />
        <Cyl p={[0.32, 1.9, -0.2]} r={0.085} h={3.55} color="#58b8e6" metal={0.85} rough={0.22} />
        {/* Steel pipe collar clamps along vertical riser */}
        {[0.75, 1.65, 2.55].map((cy) => (
          <Cyl key={cy} p={[0.32, cy, -0.2]} r={0.115} h={0.07} color="#2c3744" metal={0.8} />
        ))}
        {[0, 1, 2].map((rIdx) => {
          const py = ((t * 1.6 + rIdx * 0.33) % 1) * 3.1 + 0.4;
          return (
            <mesh key={rIdx} position={[0.32, py, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.125, 0.025, 8, 20]} />
              <meshBasicMaterial color={hotCrack > 0.5 ? "#ff5a1f" : "#67f0ff"} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

// ───────────────────────── 4. WindVortexTunnel (violent red vortex vs scattered Y-setback curl) ─────────────────────────
export const WindVortexTunnel: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; yShape?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  yShape = 1,
}) => (
  <group position={p} rotation={[0, ry, 0]} scale={scale}>
    {/* Aerodynamic test rig base turntable */}
    <Cyl p={[0, -0.62, 0]} r={1.85} r2={1.95} h={0.14} seg={32} color="#172436" metal={0.65} rough={0.35} />
    <Cyl p={[0, -0.54, 0]} r={1.55} h={0.03} seg={32} color="#34688c" emissive="#227da8" ei={0.35} />
    <BurjTower p={[0, -0.55, 0]} scale={0.48} t={t} sway={yShape > 0.5 ? 0.18 : 0.0} straightMode={yShape < 0.5 ? 1 : 0} />

    {/* Incoming wind streamlines + chevron tips from -X */}
    {[-0.1, 0.55, 1.2, 1.85, 2.45].map((yy, i) => {
      const wx = -2.1 + ((t * 2.4 + i * 0.22) % 1) * 1.75;
      const zOff = (i % 2 ? 1 : -1) * 0.22;
      return (
        <group key={`in-${i}`} position={[wx, yy, zOff]}>
          <Cyl p={[0, 0, 0]} r={0.024} h={0.68} rot={[0, 0, Math.PI / 2]} color="#74e4ff" emissive="#5ad8ff" ei={0.95} />
          <mesh position={[0.38, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.055, 0.14, 8]} />
            <meshBasicMaterial color="#9ef2ff" />
          </mesh>
        </group>
      );
    })}

    {/* Downstream wake: synchronized big red vortex rings (straight tower) vs tiny upward-deflected dissipated eddies */}
    {yShape < 0.5
      ? [0.25, 0.9, 1.55, 2.2].map((yy, i) => {
          const xDrift = 0.65 + ((t * 1.45 + i * 0.25) % 1) * 1.65;
          const altZ = Math.sin(t * 9 + i * 1.8) * 0.36;
          return (
            <mesh key={`v-${i}`} position={[xDrift, yy, altZ]} rotation={[Math.PI / 2, 0, t * 4]}>
              <torusGeometry args={[0.36, 0.05, 10, 24]} />
              <meshBasicMaterial color="#ff4238" transparent opacity={0.88} />
            </mesh>
          );
        })
      : Array.from({ length: 12 }, (_, i) => {
          const k = (t * 1.6 + i * 0.17) % 1;
          const xW = 0.36 + k * 1.7;
          const yW = 0.15 + i * 0.22 + k * 0.45;
          const zW = Math.sin(i * 2.1 + k * 5) * (0.28 + k * 0.35);
          return (
            <group key={`d-${i}`} position={[xW, yW, zW]} rotation={[0.3, -k * 3, 0.35]}>
              <Cyl p={[0, 0, 0]} r={0.016 * (1 - k * 0.5)} h={0.36 * (1 - k * 0.4)} rot={[0, 0, Math.PI / 2 - 0.35]} color="#70efff" emissive="#5ad8ff" ei={0.75 * (1 - k)} />
              <mesh rotation={[0, k * 6, 0]}>
                <torusGeometry args={[0.085, 0.014, 6, 14, Math.PI * 1.5]} />
                <meshBasicMaterial color="#70efff" transparent opacity={0.68 * (1 - k)} />
              </mesh>
            </group>
          );
        })}
  </group>
);

// ───────────────────────── 5. DoubleDeckElevator (36 km/h glass cutaway shaft) ─────────────────────────
export const DoubleDeckElevator: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; lift?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  lift = 0.45,
}) => {
  const shaftTex = useMemo(
    () =>
      ptex("elev-shaft", 256, 512, (g) => {
        g.fillStyle = "#111b29";
        g.fillRect(0, 0, 256, 512);
        g.strokeStyle = "#3a789c";
        g.lineWidth = 4;
        for (let y = 24; y < 512; y += 64) {
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(256, y);
          g.stroke();
        }
      }),
    [],
  );

  const carY = -1.1 + lift * 2.35;
  const deckTex = useMemo(
    () =>
      ptex("elev-decks", 256, 128, (g) => {
        g.fillStyle = "#ffe6a6";
        g.fillRect(0, 0, 256, 128);
        g.fillStyle = "#2b3847";
        g.fillRect(10, 10, 236, 28);
        g.fillStyle = "#ffd23f";
        g.font = "bold 20px sans-serif";
        g.textAlign = "center";
        g.fillText("EXPRESS DECK", 128, 31);
        // tiny passenger silhouettes inside glass cabin
        g.fillStyle = "#2c3e55";
        for (const x of [76, 128, 178]) {
          g.beginPath();
          g.arc(x, 62, 11, 0, Math.PI * 2);
          g.fill();
          g.fillRect(x - 14, 75, 28, 48);
        }
      }),
    [],
  );

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Cutaway elevator shaft truss structure, drive sheave beam & guide rails */}
      <RB p={[0, 0.2, -0.45]} s={[1.65, 4.0, 0.12]} r={0.02} map={shaftTex} metal={0.5} rough={0.35} />
      <RB p={[0, 2.22, -0.05]} s={[1.85, 0.16, 0.95]} r={0.02} color="#2f4156" metal={0.75} />
      <Cyl p={[0, 2.15, 0]} r={0.22} h={0.28} rot={[0, 0, Math.PI / 2]} color="#e5ba45" metal={0.85} />
      {[-0.72, 0.72].map((x) => (
        <Cyl key={x} p={[x, 0.2, 0.18]} r={0.038} h={4.0} color="#7ea8c4" metal={0.85} rough={0.2} />
      ))}
      {/* Glass front safety ribs */}
      {[-1.1, -0.3, 0.5, 1.3].map((yy) => (
        <RB key={yy} p={[0, yy, 0.36]} s={[1.5, 0.035, 0.04]} r={0.008} color="#9bc4dc" metal={0.75} />
      ))}

      {/* Counterweight rising/falling in opposite direction */}
      <RB p={[0.52, -carY * 0.75 + 0.1, -0.22]} s={[0.26, 0.85, 0.14]} r={0.02} color="#e5ba45" metal={0.7} />

      {/* Twin-deck brushed-steel & glass illuminated elevator cab */}
      <group position={[0, carY, 0]}>
        {[0, 0.58].map((dy, idx) => (
          <group key={idx} position={[0, dy, 0]}>
            <RB p={[0, 0, 0]} s={[0.88, 0.52, 0.64]} r={0.04} color="#d4e0ec" metal={0.8} rough={0.22} />
            <mesh position={[0, 0.02, 0.33]}>
              <planeGeometry args={[0.7, 0.36]} />
              <meshBasicMaterial map={deckTex} />
            </mesh>
          </group>
        ))}
        {/* Hoist cables up to top sheave */}
        {[-0.2, 0.2].map((cx) => (
          <Cyl key={cx} p={[cx, 1.65, 0]} r={0.015} h={2.5} color="#dce4ec" metal={0.9} />
        ))}
      </group>

      {/* Blue aerodynamic speed streaks zooming past moving cab */}
      {[0, 1, 2, 3].map((i) => {
        const yS = -1.4 + (((i * 0.48 - t * 2.8) % 3.2) + 3.2) % 3.2;
        return <Cyl key={i} p={[(i % 2 ? -0.46 : 0.46), yS, 0.28]} r={0.016} h={0.42} color="#5ff0ff" emissive="#5ff0ff" ei={1.2} />;
      })}
    </group>
  );
};

// ───────────────────────── 6. WindowWasherCradle (24,348 panels + BMU rooftop jib & gondola wiping desert dust) ─────────────────────────
export const WindowWasherCradle: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  t?: number;
  progress?: number;
  washer?: React.ReactNode;
}> = ({ p = [0, 0, 0], ry = 0, scale = 1, t = 0, progress = 0.5, washer }) => {
  const cleanWall = useMemo(
    () =>
      ptex("burj-wall-clean", 512, 512, (g) => {
        g.fillStyle = "#3f7ca6";
        g.fillRect(0, 0, 512, 512);
        g.fillStyle = "#b8d9ee";
        for (let x = 0; x < 512; x += 32) g.fillRect(x, 0, 4, 512);
        g.fillStyle = "#224662";
        for (let y = 0; y < 512; y += 32) g.fillRect(0, y, 512, 4);
      }),
    [],
  );

  const cradleY = 0.85 - progress * 1.75;
  const swayX = Math.sin(t * 2.2) * 0.03;

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Gleaming multi-bay reflective glass curtain wall + rooftop parapet behind */}
      <RB p={[0, 0.2, -0.35]} s={[3.4, 3.8, 0.14]} r={0.02} map={cleanWall} metal={0.65} rough={0.14} />
      <RB p={[0, 2.18, -0.3]} s={[3.55, 0.22, 0.36]} r={0.02} color="#c4ced8" metal={0.4} rough={0.45} />

      {/* Rooftop BMU crane turret & cantilevered steel boom holding hoist cables */}
      <group position={[swayX, 2.34, -0.25]}>
        <Cyl p={[0, 0.12, 0]} r={0.28} h={0.24} color="#e5a823" metal={0.65} />
        <RB p={[0, 0.3, 0.28]} s={[1.65, 0.14, 0.72]} r={0.02} color="#f5a623" metal={0.6} />
        {[-0.72, 0.72].map((bx) => (
          <Cyl key={bx} p={[bx, 0.28, 0.43]} r={0.055} h={0.06} rot={[0, 0, Math.PI / 2]} color="#283544" metal={0.85} />
        ))}
      </group>

      {/* Orange sand dust film over uncleaned lower wall */}
      {progress < 0.95 ? (
        <mesh position={[0, cradleY - 1.1, -0.26]}>
          <planeGeometry args={[3.35, Math.max(0.1, (1 - progress) * 2.1)]} />
          <meshStandardMaterial color="#b9864c" roughness={0.95} transparent opacity={0.62} />
        </mesh>
      ) : null}

      {/* Top re-dusting haze creeping down from the top ("top is dirty again") */}
      {progress > 0.55 ? (
        <mesh position={[0, 1.42, -0.26]}>
          <planeGeometry args={[3.35, (progress - 0.55) * 1.9]} />
          <meshStandardMaterial color="#c49055" roughness={0.95} transparent opacity={0.55} />
        </mesh>
      ) : null}

      {/* BMU steel washing gondola cradle hanging cleanly down from rooftop BMU pulleys */}
      <group position={[swayX, cradleY, 0.18]}>
        <RB p={[0, 0, 0]} s={[1.55, 0.1, 0.58]} r={0.02} color="#d6dde6" metal={0.75} rough={0.3} />
        <RB p={[0, 0.34, 0.26]} s={[1.55, 0.04, 0.04]} r={0.01} color="#f5a623" />
        <RB p={[0, 0.34, -0.26]} s={[1.55, 0.04, 0.04]} r={0.01} color="#f5a623" />
        {[-0.72, 0.72].map((x) => {
          const cableLen = 2.62 - cradleY;
          return (
            <group key={x}>
              <Cyl p={[x, 0.2, 0.26]} r={0.02} h={0.42} color="#f5a623" />
              <Cyl p={[x, 0.2, -0.26]} r={0.02} h={0.42} color="#f5a623" />
              <Cyl p={[x, cableLen * 0.5, 0]} r={0.015} h={cableLen} color="#d8e2ee" metal={0.9} />
            </group>
          );
        })}
        {/* Control console & cleaning foam brush roller */}
        <RB p={[0.42, 0.42, 0.08]} s={[0.18, 0.22, 0.12]} r={0.01} color="#283544" />
        <Cyl p={[0, 0.16, -0.32]} r={0.065} h={1.25} rot={[0, 0, Math.PI / 2]} color="#ffffff" emissive="#c6f2ff" ei={0.35} />
        {washer ? <group position={[-0.1, 0.05, 0]}>{washer}</group> : null}
      </group>
    </group>
  );
};

// ───────────────────────── 7. CloudPenthouse (Sky balcony floating above layered clouds) ─────────────────────────
export const CloudPenthouse: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  t?: number;
  resident?: React.ReactNode;
}> = ({ p = [0, 0, 0], ry = 0, scale = 1, t = 0, resident }) => {
  const marble = useMemo(() => tex("tiles", "#f1ede4", [4, 4], 8), []);
  // Keep every cloud bank well BELOW terrace slab (top <= -0.14) so feet & deck stay completely clear
  const clouds = useMemo(
    () => [
      { p: [-1.55, -0.58, 0.45] as V3, rx: 1.05, ry: 0.34, rz: 0.85 },
      { p: [-0.35, -0.62, 0.72] as V3, rx: 1.25, ry: 0.36, rz: 0.95 },
      { p: [1.05, -0.56, 0.52] as V3, rx: 1.15, ry: 0.35, rz: 0.85 },
      { p: [1.75, -0.5, -0.5] as V3, rx: 1.1, ry: 0.36, rz: 0.95 },
      { p: [-1.8, -0.48, -0.6] as V3, rx: 1.05, ry: 0.35, rz: 0.9 },
      { p: [0.1, -0.68, -1.3] as V3, rx: 1.85, ry: 0.42, rz: 1.05 },
    ],
    [],
  );

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Stylized layered soft cumulus shelf floating strictly beneath the marble terrace */}
      {clouds.map((cl, i) => (
        <mesh key={i} position={[cl.p[0] + Math.sin(t + i) * 0.06, cl.p[1], cl.p[2]]} scale={[cl.rx, cl.ry, cl.rz]}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color="#f5f8ff" roughness={0.96} />
        </mesh>
      ))}
      {/* Marble sky terrace with contrasting slate-gold edge fascia + furnished luxury penthouse pavilion */}
      <RB p={[0, 0, 0]} s={[2.9, 0.14, 2.4]} r={0.03} map={marble} rough={0.32} />
      <RB p={[0, -0.02, 0]} s={[2.96, 0.09, 2.46]} r={0.02} color="#283546" metal={0.65} rough={0.3} />
      <RB p={[0, 0.9, -0.88]} s={[2.7, 1.75, 0.14]} r={0.02} color="#1e2a38" metal={0.5} />
      {/* Warm penthouse interior cove light, gold art frame & sofa inside glass pavilion */}
      <RB p={[0, 1.12, -0.79]} s={[0.85, 0.56, 0.04]} r={0.01} color="#d9a840" metal={0.7} />
      <RB p={[0, 1.12, -0.76]} s={[0.74, 0.45, 0.02]} r={0.01} color="#2f6690" emissive="#4fa8d8" ei={0.35} />
      <RB p={[0, 0.24, -0.54]} s={[1.35, 0.28, 0.52]} r={0.04} color="#3a4c60" rough={0.8} />
      <RB p={[0, 0.48, -0.74]} s={[1.35, 0.38, 0.14]} r={0.04} color="#2e3d4f" rough={0.8} />
      <RB p={[0, 0.2, 0.05]} s={[0.72, 0.18, 0.36]} r={0.02} color="#d9c6a5" rough={0.45} />
      {/* Warm ceiling soffit glow + tempered glass facade */}
      <RB p={[0, 1.72, -0.45]} s={[2.35, 0.04, 0.65]} r={0.01} color="#ffe8ad" emissive="#ffd888" ei={0.85} />
      <RB p={[0, 0.9, -0.45]} s={[2.45, 1.65, 0.72]} r={0.02} color="#aee6ff" opacity={0.28} />
      <RB p={[0, 1.8, -0.45]} s={[2.8, 0.12, 1.25]} r={0.02} color="#f1ede4" rough={0.5} />
      {/* Glass safety panels + brass handrail around balcony perimeter */}
      <RB p={[0, 0.24, 1.12]} s={[2.76, 0.34, 0.025]} r={0.005} color="#aee6ff" opacity={0.38} />
      <RB p={[0, 0.44, 1.12]} s={[2.82, 0.045, 0.05]} r={0.01} color="#d9a840" metal={0.88} />
      {[-1.35, -0.68, 0, 0.68, 1.35].map((bx) => (
        <Cyl key={bx} p={[bx, 0.24, 1.12]} r={0.02} h={0.42} color="#d9a840" metal={0.88} />
      ))}
      {resident ? <group position={[0, 0.08, 0.56]}>{resident}</group> : null}
    </group>
  );
};
