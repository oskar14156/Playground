import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "./core";

/**
 * Reef shark (~2.5 m), nose towards +X, origin at mid-body.
 * Grey back, white belly (vertex colours), fins, gill slits, eyes.
 * `t` drives the tail sweep; `bite` 0–1 opens the jaw (with teeth).
 */
export const SHARK_L = 2.5;

const radius = (u: number) => {
  // u: 0 = nose, 1 = tail fork
  if (u < 0.12) return 0.17 * Math.sqrt(u / 0.12) * (0.75 + 0.25 * (u / 0.12));
  if (u < 0.4) return 0.17 + 0.03 * Math.sin(((u - 0.12) / 0.28) * Math.PI * 0.5);
  return 0.2 * Math.pow(1 - (u - 0.4) / 0.6, 1.25) + 0.022;
};

const bodyGeo = () => {
  const N = 64;
  const M = 28;
  const pos: number[] = [];
  const col: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  const back = new THREE.Color("#5f6f7c");
  const belly = new THREE.Color("#eef0ee");
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = SHARK_L * (0.5 - u);
    const r = radius(u);
    for (let j = 0; j <= M; j++) {
      const a = (j / M) * Math.PI * 2;
      const cy = Math.cos(a);
      const sz = Math.sin(a);
      // taller than wide, flatter belly, the snout pointed slightly down
      const y = r * 1.05 * cy * (cy < 0 ? 0.82 : 1) - (u < 0.1 ? 0.03 * (1 - u / 0.1) : 0);
      const z = r * 0.82 * sz;
      pos.push(x, y, z);
      const k = THREE.MathUtils.smoothstep(cy, -0.35, 0.15);
      const c = belly.clone().lerp(back, k);
      col.push(c.r, c.g, c.b);
      uvs.push(u, j / M);
    }
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < M; j++) {
      const a = i * (M + 1) + j;
      const b = a + M + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

/** fin from a 2D outline (x back, y up), extruded thin and centred on z */
const finGeo = (pts: [number, number][], thick = 0.03) => {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.4, bevelSize: 0.012, bevelSegments: 2, curveSegments: 8 });
  g.translate(0, 0, -thick / 2);
  return g;
};

export const Shark: React.FC<{ p?: V3; ry?: number; rz?: number; s?: number; t?: number; bite?: number; swim?: number }> = ({ p = [0, 0, 0], ry = 0, rz = 0, s = 1, t = 0, bite = 0, swim = 1 }) => {
  const geo = useMemo(bodyGeo, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const dorsal = useMemo(() => finGeo([[0, 0], [0.24, 0.37], [0.29, 0.36], [0.24, 0.08], [0.38, 0.0], [0.3, -0.04]]), []);
  const dorsal2 = useMemo(() => finGeo([[0, 0], [0.03, 0.09], [0.09, 0], [0.06, -0.03]], 0.02), []);
  const pect = useMemo(() => finGeo([[0, 0], [0.26, -0.36], [0.36, -0.38], [0.3, -0.05], [0.18, 0.02]], 0.03), []);
  const caudal = useMemo(() => finGeo([[0, 0.04], [0.22, 0.52], [0.3, 0.5], [0.16, 0.02], [0.28, -0.3], [0.2, -0.3], [0, -0.04]], 0.03), []);
  const mFin = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a6a77", roughness: 0.55 }), []);
  const mBody = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05 }), []);
  // tail sweep: lateral wave growing towards the tail
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const ph = t * 5.5 * swim;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3];
    const u = 0.5 - x / SHARK_L;
    const amp = 0.16 * Math.pow(Math.max(0, u - 0.25), 1.6) * swim;
    pos.setZ(i, base[i * 3 + 2] + amp * Math.sin(ph - u * 4.5));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const sway = (u: number) => 0.16 * Math.pow(Math.max(0, u - 0.25), 1.6) * swim * Math.sin(ph - u * 4.5);
  const tailU = 0.98;
  const tailX = SHARK_L * (0.5 - tailU);
  const jaw = bite * 0.55;
  return (
    <group position={p} rotation={[0, ry, rz]} scale={[s, s, s]}>
      <mesh geometry={geo} material={mBody} castShadow receiveShadow />
      {/* fins */}
      <mesh geometry={dorsal} material={mFin} position={[0.18, 0.17, sway(0.43)]} rotation={[0, Math.PI, 0]} castShadow />
      <mesh geometry={dorsal2} material={mFin} position={[-0.62, 0.07, sway(0.75)]} rotation={[0, Math.PI, 0]} />
      {[-1, 1].map((k) => (
        <mesh key={k} geometry={pect} material={mFin} position={[0.5, -0.1, k * 0.12 + sway(0.3)]} rotation={[k * 0.55, Math.PI, k * 0.05]} castShadow />
      ))}
      <mesh geometry={dorsal2} material={mFin} position={[-0.55, -0.1, sway(0.72)]} rotation={[Math.PI, Math.PI, 0]} />
      <group position={[tailX, 0, sway(tailU)]} rotation={[0, 0.9 * Math.cos(ph - tailU * 4.5) * 0.35 * swim, 0]}>
        <mesh geometry={caudal} material={mFin} rotation={[0, Math.PI, 0]} castShadow />
      </group>
      {/* eyes */}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[0.98, 0.05, k * 0.105]}>
          <sphereGeometry args={[0.022, 12, 8]} />
          <meshStandardMaterial color="#060606" roughness={0.1} metalness={0.3} />
        </mesh>
      ))}
      {/* gill slits */}
      {[-1, 1].map((k) =>
        [0, 1, 2, 3, 4].map((i) => (
          <mesh key={`${k}${i}`} position={[0.68 - i * 0.045, -0.01, k * 0.158]} rotation={[0, k > 0 ? 0 : Math.PI, 0.12]}>
            <planeGeometry args={[0.008, 0.13]} />
            <meshStandardMaterial color="#2c353d" roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
        )),
      )}
      {/* mouth: dark gape under the snout, the lower jaw drops when it bites */}
      <group position={[0.95, -0.1, 0]} rotation={[0, 0, -jaw]}>
        <mesh position={[-0.05, -0.012, 0]} scale={[0.13, 0.03, 0.12]}>
          <sphereGeometry args={[1, 16, 8]} />
          <meshStandardMaterial color="#e9ebe8" roughness={0.6} />
        </mesh>
        {bite > 0.05
          ? Array.from({ length: 9 }, (_, i) => {
              const a = -1.1 + (i / 8) * 2.2;
              return (
                <mesh key={i} position={[-0.05 + Math.cos(a) * 0.1, 0.02, Math.sin(a) * 0.1]}>
                  <coneGeometry args={[0.009, 0.03, 4]} />
                  <meshStandardMaterial color="#fbfaf2" roughness={0.3} />
                </mesh>
              );
            })
          : null}
      </group>
      {bite > 0.05 ? (
        <mesh position={[0.92, -0.095, 0]} scale={[0.11, 0.035 + 0.06 * bite, 0.1]}>
          <sphereGeometry args={[1, 16, 8]} />
          <meshStandardMaterial color="#3a1416" roughness={0.9} />
        </mesh>
      ) : null}
    </group>
  );
};
