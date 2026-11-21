import React, { useMemo } from "react";
import * as THREE from "three";
import { seeded } from "../timing";
import { glowTexture, V3 } from "./core";

let crustTex: THREE.CanvasTexture | null = null;
/** Dark crust plates with glowing cracks (tiles). Used as an emissive map that scrolls. */
const crustTexture = () => {
  if (crustTex) return crustTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffb347";
  g.fillRect(0, 0, 256, 256);
  const r = seeded(77);
  for (let i = 0; i < 70; i++) {
    const x = r() * 256;
    const y = r() * 256;
    const s = 14 + r() * 34;
    g.fillStyle = `rgba(${20 + r() * 30},${8 + r() * 10},6,${0.82 + r() * 0.15})`;
    g.beginPath();
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const rr = s * (0.6 + r() * 0.5);
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
  }
  crustTex = new THREE.CanvasTexture(c);
  crustTex.wrapS = crustTex.wrapT = THREE.RepeatWrapping;
  return crustTex;
};

/**
 * Glowing lava channel along a path (points on the ground, already at surface height).
 * `progress` 0–1 draws the flow on from the first point; `flow` scrolls the crust
 * (pass frame × speed). Width tapers into a rounded front lobe.
 */
export const LavaRiver: React.FC<{ points: V3[]; width?: number; progress?: number; flow: number; glow?: number }> = ({
  points,
  width = 0.6,
  progress = 1,
  flow,
  glow = 1,
}) => {
  const tex = useMemo(() => {
    const t = crustTexture().clone();
    t.needsUpdate = true;
    return t;
  }, []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  const n = 120;
  const len = Math.max(2, Math.floor(n * Math.min(1, Math.max(0.02, progress))));
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= len; i++) {
    const t = (i / n) * 1;
    const p = curve.getPointAt(Math.min(1, t));
    const tan = curve.getTangentAt(Math.min(1, t));
    const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const front = i / len; // 0 at source, 1 at the front
    const w = width * (0.85 + 0.15 * Math.sin(i * 0.7)) * (front > 0.92 ? Math.sqrt(Math.max(0, 1 - (front - 0.92) / 0.08)) * 0.9 + 0.1 : 1);
    pos.push(p.x + side.x * w, p.y + 0.02, p.z + side.z * w, p.x - side.x * w, p.y + 0.02, p.z - side.z * w);
    uv.push(0, t * 6, 1, t * 6);
  }
  for (let i = 0; i < len; i++) {
    const a = i * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  tex.offset.set(0, -flow);
  const head = curve.getPointAt(Math.min(1, len / n));
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#1a0d08" emissive="#ff6a1a" emissiveMap={tex} emissiveIntensity={2.2 * glow} map={tex} roughness={0.9} toneMapped={false} />
      </mesh>
      {/* heat glow along the channel */}
      {Array.from({ length: 10 }, (_, i) => {
        const p = curve.getPointAt(Math.min(1, ((i + 0.5) / 10) * (len / n)));
        return (
          <sprite key={i} position={[p.x, p.y + 0.25, p.z]} scale={[width * 5, width * 3, 1]}>
            <spriteMaterial map={glowTexture()} color="#ff7a2a" transparent opacity={0.35 * glow} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        );
      })}
      <pointLight position={[head.x, head.y + 0.6, head.z]} intensity={6 * glow} distance={8} decay={1.5} color="#ff7a2a" />
    </group>
  );
};

/**
 * Billowing ash / debris cloud: seeded puffs that spawn from `origin`, travel along
 * `dir` (spread by `spread` radians) and grow. `t` = frames since the cloud started.
 */
export const AshCloud: React.FC<{
  t: number;
  origin: V3;
  dir: V3;
  speed?: number;
  spread?: number;
  count?: number;
  color?: string;
  size?: number;
  rise?: number;
  seed?: number;
}> = ({ t, origin, dir, speed = 0.18, spread = 0.9, count = 140, color = "#5d5a57", size = 1.4, rise = 0.02, seed = 3 }) => {
  const puffs = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, () => ({ born: r() * 40, a: (r() - 0.5) * spread, v: 0.6 + r() * 0.6, up: r(), s: 0.6 + r() * 0.8 }));
  }, [count, spread, seed]);
  if (t < 0) return null;
  const d = new THREE.Vector3(...dir).normalize();
  return (
    <group>
      {puffs.map((p, i) => {
        const age = t - p.born;
        if (age <= 0) return null;
        const dirA = d.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), p.a);
        const dist = speed * p.v * age * (1 - Math.min(0.5, age / 400));
        const pos: V3 = [origin[0] + dirA.x * dist, origin[1] + rise * age * (0.5 + p.up) + p.up * 0.6, origin[2] + dirA.z * dist];
        const s = size * p.s * (0.4 + Math.min(2.5, age / 18));
        const shade = 0.75 + 0.25 * p.up;
        return (
          <sprite key={i} position={pos} scale={[s, s, 1]}>
            <spriteMaterial map={glowTexture()} color={new THREE.Color(color).multiplyScalar(shade)} transparent opacity={Math.min(0.95, age / 6) * 0.9} depthWrite={false} />
          </sprite>
        );
      })}
    </group>
  );
};

/**
 * Instanced conifer forest in an annulus around the origin. Trees fall radially away from
 * the origin when the blast front (radius `front`) has passed them, within `sector`
 * (radians either side of north = −Z).
 */
export const BlastForest: React.FC<{ front: number; rMin?: number; rMax?: number; count?: number; sector?: number; scale?: number; ground?: (x: number, z: number) => number }> = ({
  front,
  rMin = 6,
  rMax = 34,
  count = 3500,
  sector = Math.PI * 0.62,
  scale = 0.55,
  ground = () => 0,
}) => {
  const trees = useMemo(() => {
    const r = seeded(91);
    return Array.from({ length: count }, () => {
      const a = r() * Math.PI * 2 - Math.PI;
      const d = Math.sqrt(rMin * rMin + r() * (rMax * rMax - rMin * rMin));
      return { a, d, s: scale * (0.7 + r() * 0.6), lag: r() * 4 };
    });
  }, [count, rMin, rMax, scale]);
  const mesh = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.18, 1, 6);
    geo.translate(0, 0.5, 0);
    // white base: instance colours multiply with it (a green base made every tree near-black)
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1 }), count);
    m.frustumCulled = false;
    return m;
  }, [count]);
  const dummy = new THREE.Object3D();
  const fallenCol = new THREE.Color("#7a6a55");
  const standCol = new THREE.Color("#2f5a2c");
  trees.forEach((t, i) => {
    const x = Math.sin(t.a) * t.d;
    const z = -Math.cos(t.a) * t.d;
    const inSector = Math.abs(t.a) < sector;
    const fall = inSector ? Math.min(1, Math.max(0, (front - t.d) * 2 - t.lag * 0.1)) : 0;
    dummy.position.set(x, ground(x, z), z);
    // tip over away from the volcano: rotate about the horizontal axis perpendicular to the radius
    const axis = new THREE.Vector3(Math.cos(t.a), 0, Math.sin(t.a));
    dummy.quaternion.setFromAxisAngle(axis, (-fall * Math.PI) / 2); // −: k × up = toward the volcano, so negate
    dummy.scale.setScalar(t.s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, standCol.clone().lerp(fallenCol, fall));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return <primitive object={mesh} />;
};
