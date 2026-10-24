import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { seeded } from "../timing";

export type V3 = [number, number, number];
export type Cam = { pos: V3; look: V3; fov?: number; roll?: number };

/**
 * Drives the R3F camera from a pure description. Compute `cam` from the frame
 * (see keys3 in timing.ts) — never animate the camera with useFrame().
 */
export const CameraRig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...cam.pos);
  camera.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0);
  camera.lookAt(...cam.look);
  const fov = cam.fov ?? 40;
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};

/**
 * World point → screen pixels for the same camera, so HTML overlays (labels, callouts)
 * can stick to 3D objects with crisp fonts. Returns null when the point is behind the camera.
 */
export const project = (p: THREE.Vector3 | V3, cam: Cam, width: number, height: number) => {
  const c = new THREE.PerspectiveCamera(cam.fov ?? 40, width / height, 0.01, 1000);
  c.position.set(...cam.pos);
  c.up.set(Math.sin(cam.roll ?? 0), Math.cos(cam.roll ?? 0), 0);
  c.lookAt(...cam.look);
  c.updateMatrixWorld();
  const v = (Array.isArray(p) ? new THREE.Vector3(...p) : p.clone()).project(c);
  if (v.z > 1) return null;
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
};

let glowTex: THREE.Texture | null = null;
/** Soft radial sprite texture used for every glow / light bloom. */
export const glowTexture = () => {
  if (glowTex) return glowTex;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.18, "rgba(255,255,255,0.75)");
  grd.addColorStop(0.45, "rgba(255,255,255,0.18)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
};

/** Additive glow sprite — fakes bloom for lights, cities, engines, beacons. */
export const Glow: React.FC<{ position: V3 | THREE.Vector3; size: number; color: string; opacity?: number; fog?: boolean }> = ({
  position,
  size,
  color,
  opacity = 1,
  fog = true,
}) => {
  const pos = Array.isArray(position) ? position : (position.toArray() as V3);
  return (
    <sprite position={pos} scale={[size, size, size]}>
      <spriteMaterial map={glowTexture()} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} fog={fog} />
    </sprite>
  );
};

/** Star field on a sphere shell, twinkle driven by frame. */
export const Stars3D: React.FC<{ frame: number; count?: number; radius?: number; seed?: number; size?: number }> = ({
  frame,
  count = 1200,
  radius = 40,
  seed = 3,
  size = 0.12,
}) => {
  const geo = useMemo(() => {
    const rnd = seeded(seed);
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = rnd() * 2 - 1;
      const t = rnd() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos.set([radius * s * Math.cos(t), radius * u, radius * s * Math.sin(t)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count, radius, seed]);
  return (
    <points geometry={geo}>
      <pointsMaterial
        size={size}
        map={glowTexture()}
        color="#cfd8ff"
        transparent
        opacity={0.75 + 0.15 * Math.sin(frame * 0.1)}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={false} // sky objects sit beyond any scene fog
      />
    </points>
  );
};

/**
 * A thick, glowing path (routes, beams, trails). `progress` 0–1 draws it on.
 * Rebuilt each frame from the points, so the points may move (morphing maps etc.).
 */
export const TubePath: React.FC<{
  points: THREE.Vector3[];
  progress?: number;
  radius?: number;
  color: string;
  opacity?: number;
  glow?: boolean;
}> = ({ points, progress = 1, radius = 0.008, color, opacity = 1, glow = true }) => {
  const n = Math.max(2, Math.floor(points.length * Math.min(1, Math.max(0, progress))));
  if (progress <= 0.001 || points.length < 2) return null;
  const pts = points.slice(0, n);
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, Math.max(8, n * 2), radius, 8, false);
  return (
    <group>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} />
      </mesh>
      {glow ? (
        <mesh geometry={new THREE.TubeGeometry(curve, Math.max(8, n * 2), radius * 3.2, 8, false)}>
          <meshBasicMaterial color={color} transparent opacity={opacity * 0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ) : null}
      {glow ? <Glow position={pts[pts.length - 1]} size={radius * 18} color={color} opacity={opacity} /> : null}
    </group>
  );
};

/** Thin 1px polyline (grids, graticules, guides). */
export const ThinLine: React.FC<{ points: THREE.Vector3[]; color: string; opacity?: number; dashed?: boolean }> = ({
  points,
  color,
  opacity = 1,
  dashed = false,
}) => {
  const line = useMemo(() => new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial()), []);
  line.geometry.setFromPoints(points);
  if (dashed) {
    line.material = new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.04, gapSize: 0.03, depthWrite: false });
    line.computeLineDistances();
  } else {
    const m = line.material as THREE.LineBasicMaterial;
    m.color.set(color);
    m.transparent = true;
    m.opacity = opacity;
    m.depthWrite = false;
  }
  return <primitive object={line} />;
};
