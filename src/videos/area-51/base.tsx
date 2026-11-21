import React from "react";
import { RB, tex } from "../../lib/three/diorama";
import { Block, Hangar, Pickup, RadarDome, Tower, WaterTower } from "./props";
import { Runway } from "./world";

/** Hangar fronts (they face the runway, −Z). */
export const HANGARS: [number, number][] = [
  [-260, 190],
  [-190, 190],
  [-120, 190],
];

/** The base on the south shore of the dry lake: runway (z = 0), apron, three arched hangars, tower, radar dome,
 * water tower, office blocks, a car park with white pickups. `hangarDoor` opens the middle hangar, `light` its glow. */
export const Base: React.FC<{ hangarDoor?: number; light?: number }> = ({ hangarDoor = 0, light = 0 }) => {
  const conc = tex("plaster", "#b8b1a3", [30, 8], 221);
  return (
    <group>
      <Runway />
      {/* apron in front of the hangars */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-120, 0.05, 150]} receiveShadow>
        <planeGeometry args={[420, 120]} />
        <meshStandardMaterial map={conc} roughness={0.9} />
      </mesh>
      {HANGARS.map(([x, z], i) => (
        <group key={x} position={[x, 0, z]} rotation={[0, Math.PI, 0]}>
          <Hangar w={44} l={70} door={i === 1 ? hangarDoor : 0} light={i === 1 ? light : 0} />
        </group>
      ))}
      <group position={[0, 0, 150]}>
        <Tower />
      </group>
      <group position={[90, 0, 260]}>
        <RadarDome />
      </group>
      <group position={[170, 0, 300]}>
        <WaterTower />
      </group>
      {[
        [40, 230, 60, 9, 22],
        [110, 230, 40, 12, 20],
        [-30, 290, 70, 8, 24],
        [60, 320, 50, 10, 18],
      ].map(([x, z, w, h, d], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, Math.PI, 0]}>
          <Block s={[w, h, d]} seed={i} />
        </group>
      ))}
      {/* car park */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[140, 0.05, 180]} receiveShadow>
        <planeGeometry args={[80, 40]} />
        <meshStandardMaterial map={tex("asphalt", "#3d3f43", [6, 3], 231)} roughness={0.9} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <group key={i} position={[110 + (i % 5) * 14, 0, 170 + Math.floor(i / 5) * 18]} rotation={[0, Math.PI / 2, 0]}>
          <Pickup color={i % 4 === 3 ? "#c9ccd0" : "#eef0f2"} />
        </group>
      ))}
      <RB p={[140, 0.3, 156]} s={[80, 0.6, 0.6]} r={0.1} color="#bdb6a8" />
    </group>
  );
};
