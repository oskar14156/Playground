import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Cyl, RB } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";

// ───────────────────────── canvas texture cache ─────────────────────────
const cache = new Map<string, THREE.CanvasTexture>();
const ptex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void) => {
  if (cache.has(key)) return cache.get(key)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, seeded(key.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 17) >>> 0));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
};

// ───────────────────────── 1. FortKnoxBuilding (1936 neoclassical Kentucky granite depository) ─────────────────────────
export const FortKnoxBuilding: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
}) => {
  const stone = usePbr("concrete_floor_02", [4, 2]);
  const plaque = useMemo(
    () =>
      ptex("knox-plaque", 512, 96, (g) => {
        g.fillStyle = "#1b222c";
        g.fillRect(0, 0, 512, 96);
        g.strokeStyle = "#e0b341";
        g.lineWidth = 4;
        g.strokeRect(4, 4, 504, 88);
        g.fillStyle = "#ffd65a";
        g.font = "bold 28px sans-serif";
        g.textAlign = "center";
        g.fillText("U.S. BULLION DEPOSITORY", 256, 44);
        g.fillStyle = "#dce6f0";
        g.font = "bold 20px sans-serif";
        g.fillText("FORT KNOX · EST. 1936", 256, 74);
      }),
    [],
  );

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Broad stepped limestone plinth + grand central front steps */}
      <RB p={[0, 0.14, 0]} s={[5.4, 0.28, 3.6]} r={0.02} color="#b6b0a4" rough={0.78} />
      <RB p={[0, 0.08, 2.05]} s={[2.1, 0.16, 0.55]} r={0.01} color="#c4beb2" rough={0.76} />
      <RB p={[0, 0.2, 1.9]} s={[1.95, 0.14, 0.45]} r={0.01} color="#cecac0" rough={0.75} />

      {/* Main dressed-granite neoclassical fortress block */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.75, 1.95, 2.95]} />
        <meshStandardMaterial color="#b4afa4" map={stone.map} normalMap={stone.normalMap} roughnessMap={stone.roughnessMap} roughness={0.78} />
      </mesh>
      {/* Heavy upper entablature cornice & corner sentry guard turrets */}
      <RB p={[0, 2.28, 0]} s={[4.95, 0.22, 3.15]} r={0.02} color="#cbc5ba" rough={0.7} />
      {[
        [-2.25, -1.35],
        [2.25, -1.35],
        [-2.25, 1.35],
        [2.25, 1.35],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 2.55, tz]}>
          <Cyl p={[0, 0, 0]} r={0.28} h={0.48} seg={8} color="#9e988c" rough={0.75} />
          <Cyl p={[0, 0.3, 0]} r={0.31} h={0.12} seg={8} color="#787266" rough={0.7} />
        </group>
      ))}

      {/* Vertical granite pilasters & recessed slit armored bays along front facade */}
      {[-1.95, -1.35, 1.35, 1.95].map((x) => (
        <group key={x}>
          <RB p={[x, 1.25, 1.51]} s={[0.24, 1.85, 0.12]} r={0.015} color="#ccc6ba" rough={0.72} />
          {x > -1.9 && x < 1.9 ? null : <RB p={[x + (x < 0 ? 0.3 : -0.3), 1.25, 1.48]} s={[0.14, 0.85, 0.06]} r={0.01} color="#17202b" />}
        </group>
      ))}

      {/* Central bronze portico + gold-inscribed inscription plaque + sculpted double vault doors */}
      <RB p={[0, 1.25, 1.56]} s={[1.85, 1.9, 0.2]} r={0.02} color="#c5bfb2" rough={0.7} />
      <RB p={[0, 1.05, 1.66]} s={[0.96, 1.48, 0.08]} r={0.02} color="#6c5224" metal={0.78} rough={0.32} />
      <RB p={[-0.22, 1.05, 1.7]} s={[0.38, 1.32, 0.04]} r={0.01} color="#9e7a36" metal={0.8} rough={0.3} />
      <RB p={[0.22, 1.05, 1.7]} s={[0.38, 1.32, 0.04]} r={0.01} color="#9e7a36" metal={0.8} rough={0.3} />
      <RB p={[-0.08, 1.02, 1.73]} s={[0.04, 0.28, 0.03]} r={0.008} color="#ffd24d" metal={0.9} />
      <RB p={[0.08, 1.02, 1.73]} s={[0.04, 0.28, 0.03]} r={0.008} color="#ffd24d" metal={0.9} />
      {/* Roof parapet spire flag pole */}
      <Cyl p={[0, 2.75, 0]} r={0.025} h={1.0} color="#dce4ec" metal={0.85} />
      <mesh position={[0, 2.02, 1.68]}>
        <planeGeometry args={[1.62, 0.3]} />
        <meshBasicMaterial map={plaque} />
      </mesh>
      {/* Perimeter steel fence posts across front compound */}
      {[-2.8, -2.0, 2.0, 2.8].map((fx) => (
        <group key={fx} position={[fx, 0, 2.45]}>
          <Cyl p={[0, 0.55, 0]} r={0.03} h={1.1} color="#465260" metal={0.8} />
          <mesh position={[0, 1.12, 0]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color={Math.sin(t * 6 + fx) > 0 ? "#ff3b30" : "#551210"} />
          </mesh>
        </group>
      ))}
      <RB p={[-2.4, 0.65, 2.45]} s={[0.9, 0.04, 0.04]} r={0.01} color="#586472" metal={0.8} />
      <RB p={[2.4, 0.65, 2.45]} s={[0.9, 0.04, 0.04]} r={0.01} color="#586472" metal={0.8} />
    </group>
  );
};

// ───────────────────────── 2. BunkerWallCutaway (4-ft granite + rebar + 4,200 yd3 concrete + 750 t steel liner) ─────────────────────────
export const BunkerWallCutaway: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
}) => {
  const concrete = usePbr("concrete_floor_02", [3, 2]);
  const steel = usePbr("metal_plate", [2, 2]);

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Layer 1: Massive dressed granite masonry blocks on front-left exterior */}
      {[-1.35, -0.65, 0.05, 0.75, 1.45].map((yy, row) =>
        [-1.35, -0.45, 0.45].map((xx, col) => (
          <RB
            key={`${row}-${col}`}
            p={[xx - 0.15 + (row % 2) * 0.16, yy + 1.5, -0.65]}
            s={[0.82, 0.62, 0.52]}
            r={0.03}
            color="#a29d92"
            rough={0.82}
          />
        )),
      )}

      {/* Layer 2: Exposed structural I-beam & criss-cross 750-ton steel rebar grid */}
      <group position={[0.45, 1.5, -0.05]}>
        {[-1.1, -0.4, 0.3, 1.0].map((vx) => (
          <Cyl key={vx} p={[vx, 0, 0]} r={0.042} h={3.3} color="#c47a44" metal={0.85} rough={0.32} />
        ))}
        {[-1.2, -0.4, 0.4, 1.2].map((hy) => (
          <Cyl key={hy} p={[0, hy, 0.04]} r={0.038} h={2.7} rot={[0, 0, Math.PI / 2]} color="#c47a44" metal={0.85} rough={0.32} />
        ))}
      </group>

      {/* Layer 3: 1.2 m / 4 ft thick reinforced concrete monolith core */}
      <mesh position={[0.85, 1.5, 0.45]} castShadow receiveShadow>
        <boxGeometry args={[2.15, 3.35, 0.85]} />
        <meshStandardMaterial color="#8e98a2" map={concrete.map} normalMap={concrete.normalMap} roughnessMap={concrete.roughnessMap} roughness={0.8} />
      </mesh>

      {/* Layer 4: Inner hardened brushed-armor steel vault liner */}
      <mesh position={[1.25, 1.5, 1.05]} castShadow receiveShadow>
        <boxGeometry args={[1.45, 3.35, 0.28]} />
        <meshStandardMaterial color="#677f98" map={steel.map} roughness={0.35} metalness={0.55} />
      </mesh>

      {/* Deflecting drill/blast orange sparks bouncing off exterior granite wall */}
      {Array.from({ length: 8 }, (_, k) => {
        const sp = (t * 2.6 + k * 0.17) % 1;
        return (
          <mesh key={k} position={[-1.05 - sp * 1.15, 1.45 + Math.sin(k * 2.1) * sp * 0.75, -0.95 - sp * 0.45]}>
            <sphereGeometry args={[0.045 * (1 - sp * 0.5), 6, 6]} />
            <meshBasicMaterial color={k % 2 ? "#ffd23f" : "#ff6b28"} />
          </mesh>
        );
      })}
    </group>
  );
};

// ───────────────────────── 3. VaultDoor20Ton (massive Mosler-style 20-ton door + 10 radial steel bolts) ─────────────────────────
export const VaultDoor20Ton: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; open?: number; torch?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  open = 0.2,
  torch = 1,
}) => {
  const steel = usePbr("metal_plate", [2, 2]);
  const bolts = useMemo(() => Array.from({ length: 10 }, (_, i) => (i * Math.PI * 2) / 10), []);
  const boltRetract = open * 0.22;

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Heavy recessed concrete & brushed armor vestibule frame */}
      <RB p={[0, 1.55, -0.45]} s={[3.6, 3.3, 0.75]} r={0.04} color="#58626e" rough={0.75} />
      <Cyl p={[0, 1.55, -0.05]} r={1.48} h={0.42} rot={[Math.PI / 2, 0, 0]} seg={36} color="#283442" metal={0.88} rough={0.28} />

      {/* Swinging 20-ton solid chrome-steel circular Mosler vault door */}
      <group position={[-1.25, 1.55, 0.22]} rotation={[0, -open * 1.05, 0]}>
        <group position={[1.25, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[1.25, 1.25, 0.42, 36]} />
            <meshStandardMaterial color="#cbd6e2" map={steel.map} roughness={0.32} metalness={0.55} />
          </mesh>
          {/* Outer & inner machined bevel bezel rings so steel face catches specular rim light cleanly */}
          <mesh position={[0, 0, 0.22]}>
            <torusGeometry args={[1.05, 0.045, 10, 32]} />
            <meshStandardMaterial color="#8d9dad" metalness={0.75} roughness={0.26} />
          </mesh>
          <mesh position={[0, 0, 0.22]}>
            <torusGeometry args={[0.72, 0.03, 8, 28]} />
            <meshStandardMaterial color="#a4b4c4" metalness={0.75} roughness={0.28} />
          </mesh>
          {/* Radial 10 chrome locking bolts */}
          {bolts.map((a, idx) => {
            const bx = Math.cos(a) * (1.28 - boltRetract);
            const by = Math.sin(a) * (1.28 - boltRetract);
            return <Cyl key={idx} p={[bx, by, 0]} r={0.055} h={0.34} rot={[0, 0, a - Math.PI / 2]} color="#dce8f4" metal={0.95} rough={0.14} />;
          })}
          {/* Spoked geared handwheel spinning smoothly */}
          <group position={[0, 0, 0.28]} rotation={[0, 0, t * 1.4]}>
            <mesh>
              <torusGeometry args={[0.42, 0.04, 10, 28]} />
              <meshStandardMaterial color="#ffd24d" metalness={0.9} roughness={0.18} />
            </mesh>
            {[0, 1, 2, 3].map((s) => (
              <Cyl key={s} p={[0, 0, 0]} r={0.025} h={0.82} rot={[0, 0, (s * Math.PI) / 4]} color="#ffd24d" metal={0.9} />
            ))}
          </group>
          {/* Twin brass combination dial pods */}
          {[-0.58, 0.58].map((dx) => (
            <Cyl key={dx} p={[dx, 0.18, 0.24]} r={0.13} h={0.08} rot={[Math.PI / 2, 0, 0]} color="#e5ba45" metal={0.88} />
          ))}
        </group>
        {/* Heavy crane hinge arm on left */}
        <RB p={[-0.08, 0.48, 0.06]} s={[0.45, 0.16, 0.24]} r={0.02} color="#344252" metal={0.8} />
        <RB p={[-0.08, -0.48, 0.06]} s={[0.45, 0.16, 0.24]} r={0.02} color="#344252" metal={0.8} />
      </group>

      {/* Blowtorch plasma sparks deflecting impotently off steel face */}
      {torch > 0.2 ? (
        <group position={[0.42, 1.15, 0.58]}>
          <Glow position={[0, 0, 0]} size={0.55} color="#4ceeff" opacity={0.85} />
          {[0, 1, 2, 3, 4].map((s) => {
            const k = (t * 3 + s * 0.2) % 1;
            return (
              <mesh key={s} position={[Math.cos(s * 1.3) * k * 0.75, -k * k * 0.8 + 0.1, k * 0.45]}>
                <sphereGeometry args={[0.04 * (1 - k), 6, 6]} />
                <meshBasicMaterial color="#ffb840" />
              </mesh>
            );
          })}
        </group>
      ) : null}
    </group>
  );
};

// ───────────────────────── 4. SplitKeypadRing (10 split keypads 1..9 GREEN, #10 blinking RED) ─────────────────────────
export const SplitKeypadRing: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; lit?: number; lost10?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  lit = 9,
  lost10 = 1,
}) => {
  const pads = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI * 0.78 + (i / 9) * (Math.PI * 1.56);
        return { i: i + 1, x: Math.sin(a) * 1.65, z: Math.cos(a) * 1.25 - 0.35, a };
      }),
    [],
  );

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Central encrypted hologram lock pedestal */}
      <Cyl p={[0, 0.45, -0.35]} r={0.42} h={0.9} color="#1d2b3c" metal={0.75} />
      <mesh position={[0, 1.22, -0.35]} rotation={[t * 1.5, t * 2, 0]}>
        <torusGeometry args={[0.38, 0.04, 10, 28]} />
        <meshBasicMaterial color={lost10 > 0.5 ? "#ff4238" : "#5dfc8d"} />
      </mesh>
      <Glow position={[0, 1.22, -0.35]} size={0.85} color={lost10 > 0.5 ? "#ff4238" : "#4ceeff"} opacity={0.65} />

      {/* 10 separate combination keypad terminals around arc */}
      {pads.map((pd) => {
        const isTen = pd.i === 10;
        const ok = pd.i <= lit && !(isTen && lost10 > 0.5);
        const alarm = isTen && lost10 > 0.5 && Math.sin(t * 9) > 0;
        const col = ok ? "#42f58a" : alarm ? "#ff3b30" : "#522424";
        return (
          <group key={pd.i} position={[pd.x, 0, pd.z]} rotation={[0, pd.a, 0]}>
            <Cyl p={[0, 0.45, 0]} r={0.07} h={0.9} color="#3a4c62" metal={0.7} />
            <RB p={[0, 0.95, 0]} rot={[-0.25, 0, 0]} s={[0.38, 0.28, 0.08]} r={0.02} color="#1b2a3c" metal={0.55} />
            <RB p={[0, 0.96, 0.05]} rot={[-0.25, 0, 0]} s={[0.3, 0.18, 0.025]} r={0.01} color={col} emissive={col} ei={ok ? 1.15 : alarm ? 1.5 : 0.45} />
          </group>
        );
      })}
    </group>
  );
};

// ───────────────────────── 5. SelfSustainingCore (off-grid diesel power generator + steel water cistern) ─────────────────────────
export const SelfSustainingCore: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
}) => (
  <group position={p} rotation={[0, ry, 0]} scale={scale}>
    {/* Reinforced bunker steel skid deck */}
    <RB p={[0, 0.08, 0]} s={[3.6, 0.16, 1.85]} r={0.02} color="#26313e" metal={0.75} rough={0.35} />

    {/* Left Bay: V12 Emergency Diesel Power Plant Generator */}
    <group position={[-0.95, 0.16, 0]}>
      <RB p={[0, 0.42, 0]} s={[1.35, 0.72, 0.95]} r={0.04} color="#e5b838" metal={0.55} rough={0.32} />
      <RB p={[0.52, 0.48, 0]} s={[0.28, 0.68, 0.88]} r={0.02} color="#1b2634" metal={0.7} />
      {/* Spinning cooling fan flywheel on front + glowing green BUS BAR */}
      <Cyl p={[-0.7, 0.42, 0]} r={0.32} h={0.1} rot={[0, 0, Math.PI / 2]} color="#344354" metal={0.8} />
      <Cyl p={[0, 1.05, -0.15]} r={0.08} h={0.65} color="#8c98a6" metal={0.85} />
      <RB p={[0.1, 0.84, 0.42]} s={[0.62, 0.12, 0.08]} r={0.01} color="#42f58a" emissive="#42f58a" ei={1.0 + Math.sin(t * 8) * 0.25} />
    </group>

    {/* Right Bay: Private Stainless Water Cistern Tank & Blue Pump Manifold */}
    <group position={[0.95, 0.16, 0]}>
      {[-0.45, 0.45].map((sx) => (
        <RB key={sx} p={[sx, 0.18, 0]} s={[0.14, 0.36, 0.85]} r={0.02} color="#344252" metal={0.75} />
      ))}
      <Cyl p={[0, 0.62, 0]} r={0.44} h={1.28} rot={[0, 0, Math.PI / 2]} seg={24} color="#c8d6e4" metal={0.82} rough={0.22} />
      <Cyl p={[0, 1.05, 0]} r={0.08} h={0.28} color="#42b8e6" metal={0.6} />
      {/* Glowing aqua water pump pipeline connecting cistern to bunker riser */}
      <Cyl p={[-0.45, 0.56, 0.48]} r={0.045} h={0.9} color="#42e8ff" emissive="#42e8ff" ei={0.8} />
      <RB p={[-0.05, 0.35, 0.48]} s={[0.38, 0.26, 0.24]} r={0.02} color="#2876b5" metal={0.6} />
    </group>
  </group>
);

// ───────────────────────── 6. ArmyPerimeterBase (rotating radar tower, patrol cruiser & tank silhouettes) ─────────────────────────
export const ArmyPerimeterBase: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
}) => (
  <group position={p} rotation={[0, ry, 0]} scale={scale}>
    {/* Lattice Radar Tower with spinning saucer + cyan sweep beam */}
    <group position={[-1.4, 0, -0.5]}>
      <Cyl p={[-0.22, 1.15, -0.22]} r={0.03} h={2.3} color="#586472" metal={0.8} />
      <Cyl p={[0.22, 1.15, -0.22]} r={0.03} h={2.3} color="#586472" metal={0.8} />
      <Cyl p={[0, 1.15, 0.22]} r={0.03} h={2.3} color="#586472" metal={0.8} />
      <group position={[0, 2.38, 0]} rotation={[0, t * 2.4, 0]}>
        <RB p={[0, 0, 0]} s={[0.78, 0.28, 0.14]} r={0.03} color="#d6e2ee" metal={0.75} />
        <Glow position={[0.45, 0, 0.3]} size={0.5} color="#42f58a" opacity={0.7} />
      </group>
    </group>

    {/* Armored Battle Tank flanking perimeter */}
    <group position={[1.25, 0, -0.25]} rotation={[0, -0.45, 0]}>
      <RB p={[0, 0.18, 0]} s={[1.38, 0.26, 0.84]} r={0.04} color="#3b4938" rough={0.78} />
      <RB p={[0, 0.36, 0]} s={[1.18, 0.22, 0.72]} r={0.03} color="#4c5c47" rough={0.75} />
      <Cyl p={[0.05, 0.56, 0]} r={0.32} h={0.22} seg={12} color="#566850" rough={0.72} />
      <Cyl p={[-0.65, 0.58, 0]} r={0.04} h={1.15} rot={[0, 0, Math.PI / 2]} color="#3e4c3a" metal={0.65} />
    </group>

    {/* Federal U.S. Mint Police Patrol Cruiser with flashing red/blue lightbar */}
    <group position={[0.15, 0, 1.25]} rotation={[0, 0.35, 0]}>
      <RB p={[0, 0.26, 0]} s={[1.42, 0.28, 0.68]} r={0.05} color="#162538" metal={0.6} rough={0.28} />
      <RB p={[-0.08, 0.46, 0]} s={[0.78, 0.2, 0.6]} r={0.04} color="#eef2f6" rough={0.3} />
      {[
        [-0.45, -0.35],
        [-0.45, 0.35],
        [0.45, -0.35],
        [0.45, 0.35],
      ].map(([wx, wz], wi) => (
        <Cyl key={wi} p={[wx, 0.14, wz]} r={0.14} h={0.09} rot={[Math.PI / 2, 0, 0]} color="#16181c" rough={0.85} />
      ))}
      <RB p={[-0.2, 0.59, -0.14]} s={[0.12, 0.07, 0.22]} r={0.01} color="#ff3830" emissive="#ff3830" ei={Math.sin(t * 14) > 0 ? 1.8 : 0.2} />
      <RB p={[-0.2, 0.59, 0.14]} s={[0.12, 0.07, 0.22]} r={0.01} color="#32a4ff" emissive="#32a4ff" ei={Math.sin(t * 14) < 0 ? 1.8 : 0.2} />
    </group>
  </group>
);

// ───────────────────────── 7. GoldBullionRoom (4,500 tons solid gold stacks + central velvet pocket-puh pedestal) ─────────────────────────
export const GoldBullionRoom: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; hero?: React.ReactNode }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  hero,
}) => {
  const goldRows = useMemo(() => {
    const out: [number, number, number][] = [];
    for (const side of [-1.45, 1.45]) {
      for (let tier = 0; tier < 4; tier++) {
        for (let z = -1; z <= 1; z++) {
          for (let b = 0; b < 3; b++) {
            out.push([side + (b - 1) * 0.28, 0.12 + tier * 0.24, z * 0.65]);
          }
        }
      }
    }
    return out;
  }, []);

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Steel storage racks framing glistening stacked gold bullion bars */}
      {[-1.45, 1.45].map((sx) => (
        <group key={sx} position={[sx, 0.55, 0]}>
          <RB p={[0, -0.52, 0]} s={[1.05, 0.08, 2.1]} r={0.01} color="#283444" metal={0.75} />
          <RB p={[0, 0.52, 0]} s={[1.05, 0.08, 2.1]} r={0.01} color="#283444" metal={0.75} />
          {[-0.48, 0.48].map((px) =>
            [-0.98, 0.98].map((pz) => <Cyl key={`${px}-${pz}`} p={[px, 0, pz]} r={0.03} h={1.15} color="#465668" metal={0.85} />),
          )}
        </group>
      ))}
      {goldRows.map(([x, y, z], idx) => (
        <mesh key={idx} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.16, 0.54]} />
          <meshStandardMaterial color="#ffd244" emissive="#7a5200" emissiveIntensity={0.2} metalness={0.92} roughness={0.16} />
        </mesh>
      ))}

      {/* Crimson velvet museum pedestal spotlighting the pocket puh resting flush on top */}
      <group position={[0, 0, 0.2]}>
        <Cyl p={[0, 0.42, 0]} r={0.44} h={0.84} color="#222a36" metal={0.7} />
        <Cyl p={[0, 0.87, 0]} r={0.46} h={0.08} color="#9e1e2c" rough={0.88} />
        <Glow position={[0, 1.35, 0]} size={1.25} color="#ffd86a" opacity={0.28 + Math.sin(t * 2) * 0.05} />
        {hero ? <group position={[0, 0.72, 0]}>{hero}</group> : null}
      </group>
    </group>
  );
};
