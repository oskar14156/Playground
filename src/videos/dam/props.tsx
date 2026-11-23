import React, { useMemo } from "react";
import { Glow, V3 } from "../../lib/three/core";
import { Cyl, RB } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";

// ───────────────────────── 1. CanyonTunnelsCutaway (4 giant 17m diversion rock tunnels + dry center riverbed) ─────────────────────────
export const CanyonTunnelsCutaway: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; divert?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  divert = 1,
}) => {
  const rock = usePbr("brown_mud_rocks_01", [3, 2]);
  const tunnelOffsets = [-2.05, -1.25, 1.25, 2.05];

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Left & right canyon cliff mass pierced clearly by semi-transparent cutaway brow revealing all 4 bypass tubes */}
      {[-1.7, 1.7].map((sx) => (
        <group key={sx}>
          {/* Solid canyon rock bench underneath the 4 diversion bores */}
          <mesh position={[sx, 0.14, 0]} receiveShadow>
            <boxGeometry args={[1.85, 0.28, 3.6]} />
            <meshStandardMaterial color="#8f583c" map={rock.map} normalMap={rock.normalMap} roughnessMap={rock.roughnessMap} roughness={0.92} />
          </mesh>
          {/* Upper canyon hill slice rendered translucent x-ray over the 4 rock tunnels */}
          <RB p={[sx, 1.28, -0.15]} s={[1.85, 1.55, 3.2]} r={0.03} color="#a46949" opacity={0.28} />
        </group>
      ))}
      {/* Dry excavated canyon floor riverbed in the center */}
      <RB p={[0, 0.05, 0]} s={[1.8, 0.12, 3.6]} r={0.01} color="#c4a678" rough={0.94} />

      {/* Earth-rock upstream cofferdam plugging riverbed when divert >= 0.3 */}
      {divert > 0.3 ? <RB p={[0, 0.55, -1.45]} s={[1.85, 0.95, 0.65]} r={0.05} color="#78543c" rough={0.92} /> : null}
      {/* Reservoir backing up behind cofferdam */}
      <RB p={[0, 0.45, -2.55]} s={[4.6, 0.85, 1.55]} r={0.02} color="#178cb4" rough={0.14} opacity={0.9} />

      {/* 4 concrete-lined 17 m diversion tunnel bores & rushing water streams clearly exposed inside x-ray cliffs */}
      {tunnelOffsets.map((tx, idx) => (
        <group key={idx} position={[tx, 0.62, 0]}>
          <Cyl p={[0, 0, 0]} r={0.3} h={3.72} rot={[Math.PI / 2, 0, 0]} color="#687686" rough={0.65} opacity={0.55} />
          <Cyl p={[0, 0, 0]} r={0.22} h={3.8} rot={[Math.PI / 2, 0, 0]} color="#28c8f5" emissive="#22b2e6" ei={divert * 0.95} />
          {/* Shooting discharge foam jet out downstream tunnel mouth */}
          <Cyl
            p={[0, -0.04, 2.15 + ((t * 1.4 + idx * 0.25) % 0.6)]}
            r={0.18}
            r2={0.26}
            h={0.85}
            rot={[Math.PI / 2, 0, 0]}
            color="#a6f2ff"
            emissive="#4ceeff"
            ei={0.65 * divert}
          />
        </group>
      ))}
    </group>
  );
};

// ───────────────────────── 2. HooverArchWall (221 m curved arch-gravity wedge + flat cracking wall contrast) ─────────────────────────
export const HooverArchWall: React.FC<{
  p?: V3;
  ry?: number;
  scale?: number;
  t?: number;
  archMode?: number;
}> = ({ p = [0, 0, 0], ry = 0, scale = 1, t = 0, archMode = 1 }) => {
  const concrete = usePbr("concrete_floor_02", [4, 3]);
  const segments = useMemo(() => Array.from({ length: 11 }, (_, i) => (i - 5) / 5), []);

  if (archMode < 0.5) {
    // Thin flat brittle concrete wall buckling under reservoir pressure
    const flex = Math.sin(t * 10) * 0.05;
    return (
      <group position={p} rotation={[0, ry, 0]} scale={scale}>
        <RB p={[0, 1.3, flex]} s={[3.8, 2.6, 0.28]} r={0.02} color="#98a2ac" rough={0.8} />
        {[-0.8, 0.1, 0.9].map((cx, i) => (
          <RB key={i} p={[cx, 1.3 + i * 0.15, 0.16]} rot={[0, 0, 0.35 * (i - 1)]} s={[0.07, 1.85, 0.03]} r={0.005} color="#ff4238" emissive="#ff4238" ei={1.6} />
        ))}
        {/* Pressure arrows smashing dead into flat wall */}
        {[-1.1, 0, 1.1].map((ax, i) => (
          <Cyl key={i} p={[ax, 1.35, -0.65 + ((t * 1.4) % 0.35)]} r={0.04} h={0.85} rot={[Math.PI / 2, 0, 0]} color="#ff4238" emissive="#ff4238" ei={1.2} />
        ))}
      </group>
    );
  }

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Sweeping concave arch-gravity wedge tapering 200 m base -> 14 m crest */}
      {segments.map((s, idx) => {
        const ang = s * 0.62;
        const radius = 2.65;
        const x = Math.sin(ang) * radius;
        const z = -Math.cos(ang) * radius + 2.25;
        return (
          <group key={idx} position={[x, 0, z]} rotation={[0, -ang, 0]}>
            {/* Stepped tapered cross-section (thick broad base -> sleek road crest) */}
            <mesh position={[0, 0.65, 0.28]} castShadow receiveShadow>
              <boxGeometry args={[0.52, 1.3, 1.45]} />
              <meshStandardMaterial color="#b2bac4" map={concrete.map} normalMap={concrete.normalMap} roughnessMap={concrete.roughnessMap} roughness={0.78} />
            </mesh>
            <mesh position={[0, 1.72, 0.05]} castShadow receiveShadow>
              <boxGeometry args={[0.52, 1.05, 0.78]} />
              <meshStandardMaterial color="#bec6d0" map={concrete.map} normalMap={concrete.normalMap} roughnessMap={concrete.roughnessMap} roughness={0.74} />
            </mesh>
            {/* US Highway 93 crest roadway */}
            <RB p={[0, 2.32, -0.18]} s={[0.54, 0.14, 0.44]} r={0.01} color="#dce2ea" rough={0.55} />
          </group>
        );
      })}

      {/* Art-Deco cylindrical upstream Lake Mead Intake Towers */}
      {[-1.35, 1.35].map((ix) => (
        <group key={ix} position={[ix, 1.55, -1.05]}>
          <Cyl p={[0, 0, 0]} r={0.22} h={2.2} seg={12} color="#cfd6de" rough={0.65} />
          <Cyl p={[0, 1.15, 0]} r={0.26} h={0.18} seg={12} color="#f5a623" rough={0.45} />
        </group>
      ))}

      {/* Wedge compression force arrows redirecting water load outward into canyon walls */}
      {[-1.1, 1.1].map((fx, i) => (
        <Cyl
          key={i}
          p={[fx * 1.05, 1.35, 0.15]}
          r={0.045}
          h={1.25}
          rot={[0, fx < 0 ? -0.55 : 0.55, Math.PI / 2]}
          color="#ffd23f"
          emissive="#ffae2b"
          ei={1.1}
        />
      ))}
    </group>
  );
};

// ───────────────────────── 3. DamCoolingMatrix (red 125-yr monolith vs interlocking Lego blocks + 930 km ice pipes) ─────────────────────────
export const DamCoolingMatrix: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number; legoCool?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
  legoCool = 1,
}) => {
  const concrete = usePbr("concrete_floor_02", [2, 2]);
  const blocks = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let x = -1.2; x <= 1.25; x += 0.6) {
      for (let z = -0.6; z <= 0.65; z += 0.6) {
        const h = 1.65 - (z + 0.6) * 0.45;
        out.push([x, h * 0.5, z]);
      }
    }
    return out;
  }, []);

  if (legoCool < 0.5) {
    // Solid hot cracking monolith (125 years hydration heat)
    return (
      <group position={p} rotation={[0, ry, 0]} scale={scale}>
        <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.95, 2.2, 1.75]} />
          <meshStandardMaterial color="#9c4830" map={concrete.map} emissive="#ff3814" emissiveIntensity={0.35} roughness={0.85} />
        </mesh>
        {/* Jagged thermal magma stress cracks snapping across overheated monolith face */}
        {[
          [-0.75, 1.3, 0.35],
          [0.15, 1.1, -0.45],
          [0.85, 1.25, 0.25],
        ].map(([cx, cy, rotZ], ci) => (
          <RB key={ci} p={[cx, cy, 0.9]} rot={[0, 0, rotZ]} s={[0.09, 1.55, 0.06]} r={0.01} color="#ffbe3b" emissive="#ff6818" ei={1.8} />
        ))}
        <Glow position={[0, 1.15, 0.4]} size={2.2} color="#ff5a1f" opacity={0.35 + Math.sin(t * 6) * 0.08} />
      </group>
    );
  }

  return (
    <group position={p} rotation={[0, ry, 0]} scale={scale}>
      {/* Interlocking stepped concrete column blocks */}
      {blocks.map(([bx, by, bz], idx) => (
        <mesh key={idx} position={[bx, by, bz]} castShadow receiveShadow>
          <boxGeometry args={[0.52, by * 2, 0.52]} />
          <meshStandardMaterial color="#a6b2be" map={concrete.map} roughness={0.78} />
        </mesh>
      ))}
      {/* Glowing icy-cyan 1-inch serpentine steel cooling pipes woven across blocks */}
      {[0.38, 0.86, 1.34].map((py, i) => (
        <group key={i} position={[0, py, 0]}>
          <Cyl p={[0, 0, 0.65]} r={0.032} h={3.0} rot={[0, 0, Math.PI / 2]} color="#5ceeff" emissive="#44e8ff" ei={1.1} />
          <Cyl p={[0, 0, 0]} r={0.032} h={3.0} rot={[0, 0, Math.PI / 2]} color="#5ceeff" emissive="#44e8ff" ei={0.9} />
        </group>
      ))}
      {/* Ice-chilled refrigeration manifold header on left side */}
      <Cyl p={[-1.85, 0.85, 0.3]} r={0.22} h={1.7} color="#3ba8d8" metal={0.65} />
      <Cyl p={[-1.65, 0.85, 0.65]} r={0.05} h={1.2} color="#82f6ff" emissive="#44e8ff" ei={0.9} />
    </group>
  );
};

// ───────────────────────── 4. TurbineBayCutaway (17 spinning generator turbines + power feed to Vegas) ─────────────────────────
export const TurbineBayCutaway: React.FC<{ p?: V3; ry?: number; scale?: number; t?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  scale = 1,
  t = 0,
}) => (
  <group position={p} rotation={[0, ry, 0]} scale={scale}>
    <RB p={[0, 0.08, 0]} s={[4.8, 0.16, 1.65]} r={0.02} color="#28313c" metal={0.7} />
    <RB p={[0, 0.95, -0.78]} s={[4.8, 1.75, 0.16]} r={0.02} color="#aeb6c0" rough={0.7} />
    {[-1.8, -0.9, 0, 0.9, 1.8].map((tx, idx) => (
      <group key={idx} position={[tx, 0.16, 0]}>
        <Cyl p={[0, 0.28, 0]} r={0.34} h={0.54} seg={18} color="#34688c" metal={0.6} rough={0.28} />
        <group position={[0, 0.62, 0]} rotation={[0, t * 5 + idx, 0]}>
          <Cyl p={[0, 0, 0]} r={0.14} h={0.14} color="#e5ba45" metal={0.9} />
          <RB p={[0, 0, 0]} s={[0.48, 0.08, 0.1]} r={0.01} color="#e5ba45" metal={0.9} />
        </group>
        {/* High-voltage glowing insulator & power line */}
        <Cyl p={[0, 1.05, -0.45]} r={0.035} h={0.95} color="#ffd23f" emissive="#ffd23f" ei={0.85} />
      </group>
    ))}
    {/* Overhead crane girder gantry */}
    <RB p={[0, 1.68, 0.15]} s={[4.6, 0.14, 0.28]} r={0.01} color="#e5b838" metal={0.55} />
  </group>
);
