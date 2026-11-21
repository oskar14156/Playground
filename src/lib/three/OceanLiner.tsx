import React, { useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { glowTexture, V3 } from "./core";

/**
 * Procedural four-funnel ocean liner (Titanic class) from primitives. Bow points to +X,
 * stern at -X, length 8 units, waterline at y = 0 (keel at -0.32, top of hull at 0.5).
 *
 *   breakX   where the hull can split (default between funnels 3 and 4)
 *   split    0–1 the two pieces hinge apart around the keel at breakX (top tears first)
 *   bowDrop / sternDrop  extra angles (rad) for each piece once split
 *   lights   0–1 porthole + deck lights
 *   stress   0–1 glowing band around breakX (hot = high bending stress)
 *   wreck    0–1 rust/dark, funnels gone, stern piece crumpled (seabed look)
 *   clip     "bow" | "stern" renders only that piece
 *
 * Pieces rotate in the X–Y plane; the ship group itself is placed/pitched by the parent.
 */
export const LINER = { length: 8, keel: -0.32, deck: 0.5, halfBeam: 0.42, breakX: -0.85 } as const;

const halfWidth = (x: number) => {
  const { halfBeam } = LINER;
  if (x > 2.2) return halfBeam * Math.max(0, 1 - Math.pow((x - 2.2) / 1.8, 1.7));
  if (x < -3.3) {
    const k = Math.min(1, (-3.3 - x) / 0.7);
    return halfBeam * Math.sqrt(Math.max(0, 1 - k * k));
  }
  return halfBeam;
};

/** Top-view outline of the hull between x0 and x1, extruded up into a hull piece. */
const hullPiece = (x0: number, x1: number, y0: number, y1: number, inset = 0) => {
  const n = 48;
  const s = new THREE.Shape();
  const xs = Array.from({ length: n + 1 }, (_, i) => x0 + ((x1 - x0) * i) / n);
  xs.forEach((x, i) => {
    const w = Math.max(0.001, halfWidth(x) - inset);
    if (i === 0) s.moveTo(x, w);
    else s.lineTo(x, w);
  });
  [...xs].reverse().forEach((x) => s.lineTo(x, -Math.max(0.001, halfWidth(x) - inset)));
  const g = new THREE.ExtrudeGeometry(s, { depth: y1 - y0, bevelEnabled: false, curveSegments: 4 });
  // shape is in X/Z (top view); extrusion goes along +Y after rotating -90° about X
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  return g;
};

type Part = "bow" | "stern";
const FUNNELS = [1.55, 0.6, -0.35, -1.3];
const LIFEBOATS = [1.9, 1.15, 0.95, 0.2, -0.75, -1.65, -1.85];
// superstructure blocks: [x0, x1, y0, y1, inset]
const DECKS: [number, number, number, number, number][] = [
  [-2.9, 2.5, 0.5, 0.66, 0.02],
  [-2.6, 2.2, 0.66, 0.8, 0.08],
  [-1.9, 1.9, 0.8, 0.9, 0.16],
];

export const OceanLiner: React.FC<
  {
    frame: number;
    breakX?: number;
    split?: number;
    bowDrop?: number;
    sternDrop?: number;
    lights?: number;
    stress?: number;
    wreck?: number;
    blueprint?: number;
    /** render only one piece (wreck scenes) */
    clip?: Part;
  } & ThreeElements["group"]
> = ({ frame, breakX = LINER.breakX, split = 0, bowDrop = -0.32, sternDrop = 0.2, lights = 1, stress = 0, wreck = 0, blueprint = 0, clip, ...g }) => {
  const hinge: V3 = [breakX, LINER.keel, 0];
  const gap = split > 0 ? 0.015 : 0;
  const pieces = useMemo(() => {
    const make = (p: Part) => {
      const [a, b] = p === "bow" ? [breakX + gap, 4] : [-4, breakX - gap];
      const clip = (x0: number, x1: number) => [Math.max(a, x0), Math.min(b, x1)] as const;
      const decks = DECKS.map(([x0, x1, y0, y1, inset]) => {
        const [c0, c1] = clip(x0, x1);
        return c1 - c0 > 0.02 ? hullPiece(c0, c1, y0, y1, inset) : null;
      }).filter(Boolean) as THREE.BufferGeometry[];
      return {
        red: hullPiece(a, b, LINER.keel, 0.0),
        black: hullPiece(a, b, 0.0, LINER.deck),
        decks,
        ports: portholes(a, b),
      };
    };
    return { bow: make("bow"), stern: make("stern") };
  }, [breakX, gap]);

  const rust = (c: string, k: number) => new THREE.Color(c).lerp(new THREE.Color("#3b2a20"), k * 0.8);
  const bp = blueprint;
  const solid = 1 - bp * 0.9;
  const mat = (c: string, rough = 0.6, metal = 0.2) => (
    <meshStandardMaterial
      key={bp > 0 ? "t" : "o"}
      color={rust(c, wreck)}
      roughness={rough}
      metalness={metal}
      transparent={bp > 0}
      opacity={solid}
      depthWrite={bp < 0.5}
    />
  );

  const piece = (p: Part) => {
    const geo = pieces[p];
    const ang = p === "bow" ? bowDrop * split : sternDrop * split;
    const crumple = p === "stern" ? wreck : 0;
    return (
      <group position={hinge} rotation={[0, 0, ang]}>
        <group position={[-hinge[0], -hinge[1], 0]} scale={[1, 1 - crumple * 0.35, 1 + crumple * 0.25]}>
          <mesh geometry={geo.red} castShadow receiveShadow>
            {mat("#7a1f1a", 0.8, 0.1)}
          </mesh>
          <mesh geometry={geo.black} castShadow receiveShadow>
            {mat("#2b3038", 0.5, 0.2)}
          </mesh>
          {geo.decks.map((d, i) => (
            <mesh key={i} geometry={d} castShadow receiveShadow>
              {mat(i === 0 ? "#e9e4d8" : "#f2efe6", 0.7, 0.05)}
            </mesh>
          ))}
          {/* lifeboats along the boat deck */}
          {LIFEBOATS.filter((x) => (p === "bow" ? x > breakX : x < breakX)).map((x) =>
            [1, -1].map((side) => (
              <mesh key={`${x}${side}`} position={[x, 0.86, side * 0.33]}>
                <boxGeometry args={[0.2, 0.05, 0.06]} />
                {mat("#f4f1ea", 0.7, 0.05)}
              </mesh>
            )),
          )}
          {/* gilt line along the top of the hull */}
          <mesh position={[(p === "bow" ? breakX + 4 : breakX - 4) / 2, 0.46, 0]}>
            <boxGeometry args={[p === "bow" ? 4 - breakX - 0.9 : 4 + breakX - 0.6, 0.008, 2 * LINER.halfBeam + 0.004]} />
            <meshStandardMaterial color="#c9a24a" metalness={0.6} roughness={0.4} transparent={bp > 0} opacity={solid} key={bp > 0 ? "t" : "o"} />
          </mesh>
          {/* funnels */}
          {FUNNELS.filter((x) => (p === "bow" ? x > breakX : x < breakX)).map((x) => (
            <Funnel key={x} x={x} solid={solid} gone={wreck} bp={bp} />
          ))}
          {/* masts */}
          {(p === "bow" ? [3.1] : [-3.0]).map((x) => (
            <mesh key={x} position={[x, 1.3, 0]} rotation={[0, 0, 0.06]}>
              <cylinderGeometry args={[0.012, 0.018, 1.7, 6]} />
              {mat("#6b5a45", 0.8, 0.1)}
            </mesh>
          ))}
          {/* propellers + rudder only on the stern piece */}
          {p === "stern" ? <Screws frame={frame} /> : null}
          {lights > 0.01 && wreck < 0.5 ? (
            <points geometry={geo.ports}>
              <pointsMaterial
                size={0.075}
                map={glowTexture()}
                color="#ffd79a"
                transparent
                opacity={lights}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </points>
          ) : null}
          {bp > 0.01 ? <Edges geos={[geo.red, geo.black, ...geo.decks]} opacity={bp} /> : null}
        </group>
      </group>
    );
  };

  return (
    <group {...g}>
      {clip !== "stern" ? piece("bow") : null}
      {clip !== "bow" ? piece("stern") : null}
      {stress > 0.01 ? (
        // on the starboard skin (camera side), not inside the hull where it would be hidden
        <group position={[breakX, 0.2, LINER.halfBeam + 0.06]}>
          {[0.42, 0.3].map((z) => (
            <sprite key={z} position={[0, 0, 0]} scale={[0.8 + stress * 1.4, 0.7 + stress * 0.5, 1]}>
              <spriteMaterial map={glowTexture()} color="#fff0c8" transparent opacity={Math.min(1, stress * 1.3)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </sprite>
          ))}
        </group>
      ) : null}
    </group>
  );
};

const Funnel: React.FC<{ x: number; solid: number; gone: number; bp: number }> = ({ x, solid, gone, bp }) => {
  if (gone > 0.5) return null;
  return (
    <group position={[x, 0.9, 0]} rotation={[0, 0, 0.12]} scale={[1.15, 1, 0.85]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.84, 20]} />
        <meshStandardMaterial key={bp > 0 ? "t" : "o"} color="#c98f3b" roughness={0.6} transparent={bp > 0} opacity={solid} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.152, 0.152, 0.17, 20]} />
        <meshStandardMaterial key={bp > 0 ? "t" : "o"} color="#111111" roughness={0.6} transparent={bp > 0} opacity={solid} />
      </mesh>
    </group>
  );
};

const Screws: React.FC<{ frame: number }> = () => (
  <group position={[-3.75, -0.22, 0]}>
    {[-0.22, 0, 0.22].map((z, i) => (
      <group key={z} position={[i === 1 ? 0.05 : 0.25, 0, z]} rotation={[0, 0, 0]}>
        {[0, 1, 2].map((b) => (
          <mesh key={b} rotation={[(b * Math.PI * 2) / 3, 0, 0]} position={[0, 0, 0]}>
            <boxGeometry args={[0.02, 0.18, 0.06]} />
            <meshStandardMaterial color="#b0894a" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>
    ))}
    <mesh position={[-0.12, 0.05, 0]}>
      <boxGeometry args={[0.12, 0.3, 0.02]} />
      <meshStandardMaterial color="#121417" />
    </mesh>
  </group>
);

/** Two rows of portholes along both sides + deck-light row, within [x0, x1]. */
const portholes = (x0: number, x1: number) => {
  const pts: number[] = [];
  const rows = [0.18, 0.32, 0.58, 0.73];
  for (let x = x0 + 0.06; x < x1 - 0.04; x += 0.075) {
    rows.forEach((y, r) => {
      const inset = r >= 2 ? (r === 2 ? 0.02 : 0.08) : 0;
      if (r >= 2 && (x < -2.85 + r * 0.3 || x > 2.45 - r * 0.25)) return;
      // skip some windows so it reads as a real ship, not an LED strip
      if (Math.sin(x * 37.1 + r * 11.3) > 0.55) return;
      const w = halfWidth(x) - inset + 0.004;
      if (w < 0.05) return;
      pts.push(x, y, w, x, y, -w);
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
};

const Edges: React.FC<{ geos: THREE.BufferGeometry[]; opacity: number }> = ({ geos, opacity }) => {
  const edges = useMemo(() => geos.map((g) => new THREE.EdgesGeometry(g, 25)), [geos]);
  return (
    <>
      {edges.map((e, i) => (
        <lineSegments key={i} geometry={e}>
          <lineBasicMaterial color="#7fe8ff" transparent opacity={opacity} toneMapped={false} />
        </lineSegments>
      ))}
    </>
  );
};
