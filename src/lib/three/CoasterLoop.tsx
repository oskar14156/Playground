import React, { useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";

/**
 * A vertical roller-coaster loop with entry/exit straights, in the X–Y plane (track runs +X,
 * the loop climbs in +Y, exits offset in +Z so it doesn't cross itself).
 *
 *   round   1 = perfect circle, 0 = teardrop/clothoid (wide bottom, tight top); animatable
 *   R       loop "radius" (circle radius; the teardrop is a bit taller)
 *   ride    0–1 position of the train along the whole track (use loopRide() for physical speed)
 *   style   "steel" (modern) | "wood" (1895)
 */
export const loopShape = (theta: number, round: number, R: number): [number, number] => {
  const cx = R * Math.sin(theta);
  const cy = R - R * Math.cos(theta);
  const H = 2.25 * R;
  const tx = R * Math.sin(theta) * (0.98 + 0.5 * Math.cos(theta)) * 1.02;
  const ty = (H * (1 - Math.cos(theta))) / 2;
  return [cx * round + tx * (1 - round), cy * round + ty * (1 - round)];
};

const trackPoints = (round: number, R: number) => {
  const pts: THREE.Vector3[] = [];
  const straight = 2.4 * R;
  const off = 0.9 * (R / 3);
  for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector3(-straight + (straight * i) / 12, 0, 0));
  const n = 96;
  for (let i = 1; i < n; i++) {
    const th = (i / n) * Math.PI * 2;
    const [x, y] = loopShape(th, round, R);
    pts.push(new THREE.Vector3(x, y, (off * i) / n));
  }
  for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector3((straight * i) / 12, 0, off));
  return pts;
};

/** Ride position 0–1 over time t (s) for a frictionless train: slow at the top, fast at the bottom. */
export const loopRide = (t: number, round: number, R: number, lapSeconds = 4) => {
  const pts = trackPoints(round, R);
  const curve = new THREE.CatmullRomCurve3(pts);
  const N = 400;
  const g = 9.81;
  const yTop = Math.max(...pts.map((p) => p.y));
  // entry speed: enough to clear the top of the circle (v² = g·r at top) with a small margin
  const v0 = Math.sqrt(2 * g * yTop + g * R * 1.15);
  // time to travel each segment ∝ ds / v(y)
  const len = curve.getLength();
  const times: number[] = [0];
  for (let i = 1; i <= N; i++) {
    const p = curve.getPointAt(i / N);
    const v = Math.sqrt(Math.max(0.2, v0 * v0 - 2 * g * p.y));
    times.push(times[i - 1] + len / N / v);
  }
  const total = times[N];
  const target = ((t / lapSeconds) % 1) * total;
  let i = 0;
  while (i < N && times[i + 1] < target) i++;
  const k = (target - times[i]) / Math.max(1e-6, times[i + 1] - times[i]);
  return (i + k) / N;
};

export const CoasterLoop: React.FC<
  { round?: number; R?: number; ride?: number; style?: "steel" | "wood"; cars?: number; trackColor?: string } & ThreeElements["group"]
> = ({ round = 0, R = 3, ride = 0.3, style = "steel", cars = 4, trackColor, ...g }) => {
  const pts = trackPoints(round, R);
  const curve = new THREE.CatmullRomCurve3(pts);
  const gauge = 0.28;
  const rail = (side: number) => new THREE.CatmullRomCurve3(pts.map((p) => p.clone().add(new THREE.Vector3(0, 0, side * gauge))));
  const steel = style === "steel";
  const col = trackColor ?? (steel ? "#ff4a3a" : "#b98a5a");
  const railGeo = (side: number) => new THREE.TubeGeometry(rail(side), 400, steel ? 0.07 : 0.06, 8, false);
  const spine = new THREE.TubeGeometry(curve, 400, steel ? 0.12 : 0.05, 8, false);
  // cross ties
  const ties = useMemo(() => Array.from({ length: 70 }, (_, i) => i / 70), []);
  const supports = [-0.75, -0.45, 0.88, 0.95].map((u) => u * 2.4 * R);
  const carObjs = Array.from({ length: cars }, (_, i) => {
    const s = Math.min(0.999, Math.max(0.001, ride - i * 0.018));
    const p = curve.getPointAt(s);
    const tan = curve.getTangentAt(s).normalize();
    // "up" for the car = the tangent turned 90° to the left in the loop plane: world-up on the
    // straights, toward the loop centre inside the loop (the old curvature-based normal flipped
    // at the straight→loop joint and scattered the cars)
    const up = new THREE.Vector3(-tan.y, tan.x, 0).normalize();
    const m = new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), tan, up);
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    return { p, q, i };
  });
  return (
    <group {...g}>
      <mesh geometry={railGeo(1)} castShadow>
        <meshStandardMaterial color={col} metalness={steel ? 0.5 : 0} roughness={steel ? 0.35 : 0.8} />
      </mesh>
      <mesh geometry={railGeo(-1)} castShadow>
        <meshStandardMaterial color={col} metalness={steel ? 0.5 : 0} roughness={steel ? 0.35 : 0.8} />
      </mesh>
      <mesh geometry={spine} castShadow>
        <meshStandardMaterial color={steel ? "#d8dbe0" : "#8a6a48"} metalness={steel ? 0.6 : 0} roughness={0.5} />
      </mesh>
      {ties.map((u, i) => {
        const p = curve.getPointAt(u);
        return (
          <mesh key={i} position={p}>
            <boxGeometry args={[0.06, 0.06, gauge * 2.2]} />
            <meshStandardMaterial color={steel ? "#9aa0aa" : "#6b4f33"} />
          </mesh>
        );
      })}
      {supports.map((x, i) => (
        <mesh key={i} position={[x, -2, i >= 2 ? 0.9 * (R / 3) : 0]}>
          <cylinderGeometry args={[0.08, 0.1, 4, 8]} />
          <meshStandardMaterial color={steel ? "#c9ccd2" : "#7a5a3a"} />
        </mesh>
      ))}
      {carObjs.map(({ p, q, i }) => (
        <group key={i} position={p} quaternion={q}>
          {/* lookAt points −Z at the target: the car body runs along local Z */}
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[0.62, 0.3, 0.75]} />
            <meshStandardMaterial color={steel ? "#2b6cff" : "#a3482c"} metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.48, 0.12]}>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshStandardMaterial color="#e2b48f" />
          </mesh>
        </group>
      ))}
    </group>
  );
};
