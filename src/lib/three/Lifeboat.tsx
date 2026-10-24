import React, { useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";

/**
 * Double-ended wooden lifeboat (Titanic type). Length 3.9 along X, beam 1.2, origin = centre
 * of the gunwale (top edge) — place it at y ≈ 0.3 so it floats with 0.3 of freeboard.
 * `seats` are the thwart positions (x); a seated Humanoid at scale 0.42 sits on one when
 * placed at y = SEAT_Y (relative to the boat origin).
 */
export const BOAT = { length: 3.9, beam: 1.2, depth: 0.55 } as const;
export const SEAT_Y = -0.32; // humanoid group y so its hips rest on a thwart (seated pose, scale 0.42)
export const THWARTS = [-1.15, -0.4, 0.35, 1.1];

const hullGeometry = () => {
  const n = 40; // along the length
  const m = 14; // around the cross-section (gunwale → keel → gunwale)
  const { length: L, beam: B, depth: D } = BOAT;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * 2 - 1; // -1 … 1
    const x = (u * L) / 2;
    const w = (B / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.4)), 0.55);
    const d = D * (0.75 + 0.25 * (1 - u * u));
    const sheer = 0.08 * u * u; // ends rise a little
    for (let j = 0; j <= m; j++) {
      const th = (j / m) * Math.PI;
      pos.push(x, sheer - d * Math.sin(th) * (0.35 + 0.65 * Math.sqrt(1 - u * u)), w * Math.cos(th));
    }
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const a = i * (m + 1) + j;
      const b = a + m + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

export const Lifeboat: React.FC<{ color?: string; inside?: string } & ThreeElements["group"]> = ({ color = "#cfc9bb", inside = "#7a6a55", ...g }) => {
  const hull = useMemo(hullGeometry, []);
  const rim = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const { length: L, beam: B } = BOAT;
    for (let k = 0; k <= 80; k++) {
      const a = (k / 80) * Math.PI * 2;
      const u = Math.cos(a);
      const w = (B / 2) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), 2.4)), 0.55);
      pts.push(new THREE.Vector3((u * L) / 2, 0.08 * u * u, Math.sign(Math.sin(a)) * w));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 160, 0.025, 6, true);
  }, []);
  return (
    <group {...g}>
      <mesh geometry={hull} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.85} side={THREE.BackSide} />
      </mesh>
      {/* inside planking (the index winding makes the front faces point inward) */}
      <mesh geometry={hull}>
        <meshStandardMaterial color={inside} roughness={0.9} side={THREE.FrontSide} />
      </mesh>
      <mesh geometry={rim}>
        <meshStandardMaterial color="#5a4a38" roughness={0.8} />
      </mesh>
      {/* thwarts (seats) */}
      {THWARTS.map((x) => (
        <mesh key={x} position={[x, -0.12, 0]} castShadow>
          <boxGeometry args={[0.16, 0.04, BOAT.beam * 0.92 * Math.sqrt(Math.max(0.2, 1 - Math.pow((2 * x) / BOAT.length, 2)))]} />
          <meshStandardMaterial color="#8a7458" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};
