import React, { useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";

/**
 * Procedural volcano terrain (no assets). Centre at the origin, north = −Z, y up.
 *
 *   kind      "strato" steep snowy cone (St. Helens) | "shield" broad low dome (Hawaii)
 *   height    summit height in units (strato default 3 ≈ 2,950 m → 1 unit ≈ 1 km)
 *   radius    base radius in units
 *   bulge     0–1 north flank swells outward (the 1980 "cryptodome")
 *   collapse  0–1 north flank slides away + summit drops ~13 % (≈ 400 m of 2,950)
 *   snow      0–1 snow cap amount
 *
 * Geometry is rebuilt from the props each frame, so bulge/collapse can be animated.
 */
export const Volcano: React.FC<
  {
    kind?: "strato" | "shield";
    height?: number;
    radius?: number;
    bulge?: number;
    collapse?: number;
    snow?: number;
    segments?: number;
    /** colour of the surrounding ground plane — the tile fades into it so no square edge shows */
    ground?: string;
  } & ThreeElements["group"]
> = ({ kind = "strato", height, radius, bulge = 0, collapse = 0, snow = 1, segments = 200, ground, ...g }) => {
  const H = height ?? (kind === "strato" ? 3 : 1.2);
  const R = radius ?? (kind === "strato" ? 7 : 14);
  const size = R * 2.6;
  const base = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    geo.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 3), 3));
    return geo;
  }, [size, segments]);

  const pos = base.attributes.position as THREE.BufferAttribute;
  const col = base.attributes.color as THREE.BufferAttribute;
  const rock = new THREE.Color(kind === "strato" ? "#6b6560" : "#2a2522");
  const rockDark = new THREE.Color(kind === "strato" ? "#4a4541" : "#151211");
  const forest = new THREE.Color(kind === "strato" ? "#2f4a2c" : "#2c3a22");
  const white = new THREE.Color("#f2f5f8");
  const scar = new THREE.Color("#8a7a68");
  const c = new THREE.Color();
  const groundCol = ground ? new THREE.Color(ground) : null;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const ang = Math.atan2(x, -z); // 0 = north (−Z)
    const north = Math.max(0, Math.cos(ang)) ** 3; // weight of the north flank
    const ridges = 1 + 0.06 * Math.sin(ang * 9 + r * 0.8) + 0.04 * Math.sin(ang * 23 - r * 1.7);
    let h: number;
    if (kind === "strato") {
      const k = Math.max(0, 1 - r / R);
      h = H * Math.pow(k, 1.5) * ridges;
      // crater
      const rc = R * 0.06;
      if (r < rc * 1.6) h -= H * 0.05 * Math.max(0, 1 - (r / (rc * 1.6)) ** 2);
    } else {
      h = H * Math.exp(-((r / R) ** 2) * 2.2) * (1 + 0.03 * Math.sin(ang * 7 + r));
      if (r < R * 0.05) h -= H * 0.08 * (1 - r / (R * 0.05));
    }
    // swelling north flank
    // (real bulge ≈ 150 m ≈ 5 % — drawn at 14 % so it reads on screen)
    h += bulge * H * 0.14 * north * Math.exp(-(((r - R * 0.3) / (R * 0.16)) ** 2));
    // lateral collapse: horseshoe crater open to the north + lower summit
    const scarK = collapse * north * Math.max(0, 1 - r / (R * 0.75));
    h -= scarK * H * 0.45 * (0.6 + 0.4 * Math.max(0, 1 - r / (R * 0.4)));
    h = Math.min(h, H * (1 - 0.135 * collapse));
    // gentle ground undulation outside the cone, fading to exactly 0 at the tile edge so the
    // terrain meets a flat ground plane (y = 0) without a visible step
    const edge = Math.max(0, 1 - Math.max(Math.abs(x), Math.abs(z)) / (size / 2));
    h += 0.04 * Math.sin(x * 0.7) * Math.cos(z * 0.6) * Math.min(1, edge * 4);
    pos.setY(i, Math.max(h, 0.03 * Math.min(1, edge * 4)));
    // colour by height / slope band
    const hn = h / H;
    if (kind === "strato") {
      c.copy(r > R * 0.78 ? forest : rock).lerp(rockDark, 0.5 + 0.5 * Math.sin(ang * 13 + r * 2.1) * 0.5);
      const snowLine = 0.45 + 0.08 * Math.sin(ang * 5);
      if (hn > snowLine) c.lerp(white, Math.min(1, (hn - snowLine) * 6) * snow);
      if (scarK > 0.05) c.lerp(scar, Math.min(1, scarK * 2.5));
    } else {
      c.copy(r > R * 0.9 ? forest : rock).lerp(rockDark, 0.5 + 0.5 * Math.sin(ang * 17 + r * 3.1));
    }
    if (groundCol) c.lerp(groundCol, 1 - Math.min(1, edge * 3));
    col.setXYZ(i, c.r, c.g, c.b);
  }
  pos.needsUpdate = true;
  col.needsUpdate = true;
  base.computeVertexNormals();
  return (
    <group {...g}>
      <mesh geometry={base} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
};

/** Height of the volcano surface at (x, z) — for placing things on the slope. Mirrors Volcano. */
export const volcanoHeight = (x: number, z: number, kind: "strato" | "shield" = "strato", H = kind === "strato" ? 3 : 1.2, R = kind === "strato" ? 7 : 14) => {
  const r = Math.hypot(x, z);
  const ang = Math.atan2(x, -z);
  const ridges = 1 + 0.06 * Math.sin(ang * 9 + r * 0.8) + 0.04 * Math.sin(ang * 23 - r * 1.7);
  if (kind === "strato") return H * Math.pow(Math.max(0, 1 - r / R), 1.5) * ridges;
  return H * Math.exp(-((r / R) ** 2) * 2.2) * (1 + 0.03 * Math.sin(ang * 7 + r));
};
