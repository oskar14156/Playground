import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Bookshelf, Frame, Lamp, Plant, RB, Rug, Slab, Sofa, Tree, tex } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";

// ───────────────────────── building geometry (metres) ─────────────────────────
export const FH = 3; // floor height
export const FLOORS = 10; // ground floor = 1st … 10th floor at y = 27
export const ROOF = FH * FLOORS; // 30
export const B = { x0: -9, x1: 9, zBack: -3.6, zFront: 1.6 }; // cut open at the front (doll's house)
export const SHAFT = { x0: -1.8, x1: 1.8 };
export const STAIRS = { x0: 5.7, x1: 8.8 };
export const DOOR = { z0: -2.0, z1: 0.2 }; // landing-door opening in the left shaft wall
export const floorY = (n: number) => (n - 1) * FH; // floor n (1–10) → slab top

const WALL_COLORS = ["#e9dcc6", "#d9e4d2", "#e6d3cf", "#d6dde8", "#eadfba", "#dfd5e6", "#e8e2d6", "#cfe0dd", "#ecd8c2", "#dcdcdc"];
const SOFA = ["#6d7f8f", "#8a5a44", "#4f6b58", "#7b6a8f", "#a07c4a"];

/** Ground, soil cross-section with the elevator pit, grass and a few trees. */
export const Ground: React.FC = () => {
  const mud = usePbr("brown_mud_rocks_01", [10, 1.2]);
  const mud2 = usePbr("brown_mud_rocks_01", [1.2, 1.2]);
  const grass = useMemo(() => tex("grass", "#6f9a4a", [30, 20], 31), []);
  const soil = (p: V3, s: V3, m: typeof mud) => (
    <mesh position={p} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial map={m.map} normalMap={m.normalMap} roughnessMap={m.roughnessMap} color="#c9a487" roughness={1} />
    </mesh>
  );
  return (
    <group>
      {/* grass behind and beside the building */}
      {/* grass behind and beside the building — not under it (the pit must stay open) */}
      <Slab p={[0, -0.05, -34.2]} s={[160, 0.1, 61]} map={grass} rough={1} />
      <Slab p={[-45.15, -0.05, 0]} s={[71.7, 0.1, 8]} map={grass} rough={1} />
      <Slab p={[45.15, -0.05, 0]} s={[71.7, 0.1, 8]} map={grass} rough={1} />
      {/* the cut soil block, leaving room for the pit under the shaft */}
      {/* top at -0.31 so it never touches the ground-floor slab (z-fighting) */}
      {soil([-41.8, -5.16, -29], [80, 9.7, 61.2], mud)}
      {soil([41.8, -5.16, -29], [80, 9.7, 61.2], mud)}
      {soil([0, -6, -29], [3.6, 8, 61.2], mud2)}
      {/* pit lining */}
      <Slab p={[0, -1.95, -1]} s={[3.6, 0.1, 5.2]} color="#8d8a84" rough={0.9} />
      <Slab p={[0, -0.9, -3.65]} s={[3.6, 2.0, 0.1]} color="#9a968f" rough={0.9} />
      {/* trees only on the left: the right side is kept free for the reactor gag */}
      {[-14, -22, -32].map((x, i) => (
        <Tree key={i} p={[x, 0, -8 - (i % 3) * 5]} s={2.6 + (i % 2)} />
      ))}
    </group>
  );
};

/** One flight of stairs (10 solid steps, each down to the floor below) rising `dir` along z. */
const Flight: React.FC<{ x0: number; x1: number; y0: number; z0: number; dir: 1 | -1 }> = ({ x0, x1, y0, z0, dir }) => (
  <group>
    {Array.from({ length: 10 }, (_, i) => {
      const top = 0.15 * (i + 1);
      return <RB key={i} p={[(x0 + x1) / 2, y0 + top / 2, z0 + dir * 0.3 * (i + 0.5)]} s={[x1 - x0, top, 0.3]} r={0.01} color="#cfc8bc" rough={0.8} />;
    })}
  </group>
);
/** Height of the first flight's step surface at z (ground floor), for feet on the stairs. */
export const stairY = (z: number) => Math.min(1.5, Math.max(0, Math.ceil((1.2 - z) / 0.3) * 0.15));

/** The building: floor slabs, walls, furnished flats left of the shaft, stairwell on the right. */
export const Building: React.FC<{ cutStairs?: boolean }> = () => {
  const brick = usePbr("red_brick_03", [6, 10]);
  const planks = useMemo(() => tex("planks", "#a8774a", [3, 2], 41), []);
  const lobby = useMemo(() => tex("tiles", "#e6e1d8", [6, 3], 42), []);
  const walls = useMemo(() => WALL_COLORS.map((c, i) => tex("wallpaper", c, [3, 1], 50 + i)), []);
  const rnd = useMemo(() => seeded(77), []);
  const looks = useMemo(() => Array.from({ length: FLOORS }, () => ({ sofa: SOFA[Math.floor(rnd() * SOFA.length)], flip: rnd() > 0.5, rug: ["#7a3b3b", "#3b5a7a", "#6a6a3b", "#5a3b6a"][Math.floor(rnd() * 4)] })), [rnd]);
  const W = B.x1 - B.x0;
  const D = B.zFront - B.zBack;
  const cz = (B.zFront + B.zBack) / 2;
  return (
    <group>
      {/* side walls (brick outside) + roof */}
      {[B.x0 - 0.15, B.x1 + 0.15].map((x) => (
        <mesh key={x} position={[x, ROOF / 2, cz]} castShadow receiveShadow>
          <boxGeometry args={[0.3, ROOF + 0.3, D]} />
          <meshStandardMaterial map={brick.map} normalMap={brick.normalMap} roughnessMap={brick.roughnessMap} />
        </mesh>
      ))}
      <mesh position={[0, ROOF / 2, B.zBack - 0.15]} receiveShadow>
        <boxGeometry args={[W + 0.6, ROOF + 0.3, 0.3]} />
        <meshStandardMaterial map={brick.map} normalMap={brick.normalMap} roughnessMap={brick.roughnessMap} />
      </mesh>
      {Array.from({ length: FLOORS + 1 }, (_, k) => {
        const y = k * FH;
        // slab with a hole for the shaft
        return (
          <group key={k}>
            <Slab p={[(B.x0 + SHAFT.x0) / 2, y - 0.15, cz]} s={[SHAFT.x0 - B.x0, 0.3, D]} color="#bdb8ae" rough={0.9} />
            <Slab p={[(SHAFT.x1 + B.x1) / 2, y - 0.15, cz]} s={[B.x1 - SHAFT.x1, 0.3, D]} color="#bdb8ae" rough={0.9} />
          </group>
        );
      })}
      {Array.from({ length: FLOORS }, (_, k) => {
        const y = k * FH;
        const L = looks[k];
        const ground = k === 0;
        return (
          <group key={`f${k}`}>
            {/* floors */}
            <Slab p={[(B.x0 + SHAFT.x0) / 2, y + 0.01, cz]} s={[SHAFT.x0 - B.x0, 0.02, D]} map={ground ? lobby : planks} rough={0.55} />
            <Slab p={[(SHAFT.x1 + STAIRS.x0) / 2, y + 0.01, cz]} s={[STAIRS.x0 - SHAFT.x1, 0.02, D]} map={ground ? lobby : planks} rough={0.55} />
            {/* back walls */}
            <Slab p={[(B.x0 + SHAFT.x0) / 2, y + FH / 2, B.zBack + 0.02]} s={[SHAFT.x0 - B.x0, FH, 0.04]} map={walls[k]} rough={0.95} />
            <Slab p={[(SHAFT.x1 + STAIRS.x0) / 2, y + FH / 2, B.zBack + 0.02]} s={[STAIRS.x0 - SHAFT.x1, FH, 0.04]} map={walls[(k + 3) % FLOORS]} rough={0.95} />
            <Slab p={[(STAIRS.x0 + B.x1) / 2, y + FH / 2, B.zBack + 0.02]} s={[B.x1 - STAIRS.x0, FH, 0.04]} color="#d9d4ca" rough={0.95} />
            {/* shaft walls (concrete) and the wall between flat and stairwell */}
            {/* left shaft wall has the landing-door opening (DOOR.z0..z1, 2.4 m high) toward the flat */}
            <Slab p={[SHAFT.x0 - 0.08, y + FH / 2, (B.zBack + DOOR.z0) / 2]} s={[0.16, FH, DOOR.z0 - B.zBack]} color="#a9a59e" rough={0.95} />
            <Slab p={[SHAFT.x0 - 0.08, y + FH / 2, (DOOR.z1 + B.zFront) / 2]} s={[0.16, FH, B.zFront - DOOR.z1]} color="#a9a59e" rough={0.95} />
            <Slab p={[SHAFT.x0 - 0.08, y + 2.4 + (FH - 2.4) / 2, (DOOR.z0 + DOOR.z1) / 2]} s={[0.16, FH - 2.4, DOOR.z1 - DOOR.z0]} color="#a9a59e" rough={0.95} />
            <Slab p={[SHAFT.x1 + 0.08, y + FH / 2, cz]} s={[0.16, FH, D]} color="#a9a59e" rough={0.95} />
            {!ground ? <Slab p={[STAIRS.x0 - 0.06, y + FH / 2, cz - 0.6]} s={[0.12, FH, D - 1.2]} color="#d0cabe" rough={0.95} /> : null}
            {/* ceiling lamp */}
            <mesh position={[-5.4, y + FH - 0.12, -0.8]}>
              <cylinderGeometry args={[0.28, 0.2, 0.12, 24]} />
              <meshStandardMaterial color="#fff6e0" emissive="#ffe8b8" emissiveIntensity={1.2} />
            </mesh>
            {!ground ? (
              <group>
                <Frame p={[-5.4, y + 1.75, B.zBack + 0.06]} s={[1.0, 0.7]} art={["#6f8fa8", "#b0805a", "#7aa36a", "#a86a8f"][k % 4]} />
                <Sofa p={[L.flip ? -3.6 : -6.6, y, -2.6]} color={L.sofa} />
                <Rug p={[-5.2, y + 0.02, -0.6]} s={[3.0, 2.0]} color={L.rug} />
                <Lamp p={[-8.2, y, -2.8]} on={0.6} />
                {k < FLOORS - 1 ? <Plant p={[L.flip ? -8.1 : -2.6, y, 0.6]} s={0.8} /> : <Plant p={[-8.1, y, -1.2]} s={0.8} />}
                <Bookshelf p={[3.7, y, B.zBack + 0.35]} />
                <Plant p={[4.9, y, 0.8]} s={0.7} />
              </group>
            ) : null}
            {/* stairs in the stairwell: two flights per storey with a landing at the back */}
            <Flight x0={STAIRS.x0} x1={7.2} y0={y} z0={1.2} dir={-1} />
            <RB p={[(STAIRS.x0 + STAIRS.x1) / 2, y + 1.5 - 0.08, -2.65]} s={[STAIRS.x1 - STAIRS.x0, 0.16, 1.7]} r={0.01} color="#cfc8bc" rough={0.8} />
            <Flight x0={7.3} x1={STAIRS.x1} y0={y + 1.5} z0={-1.8} dir={1} />
          </group>
        );
      })}
      {/* roof parapet */}
      <Slab p={[0, ROOF + 0.45, B.zBack + 0.1]} s={[W, 0.6, 0.2]} color="#9d968c" rough={0.9} />
    </group>
  );
};

// ───────────────────────── the elevator parts ─────────────────────────
export const CAR = { x0: -1.5, x1: 0.8, z0: -2.0, z1: 0.2, h: 2.6 };
export const CW = { x: 1.25, z: -1.0, w: 0.5, d: 1.1, h: 2.0 };
export const SHEAVE = { x: 0.45, y: ROOF + 1.4, z: -0.9, r: 0.8 };
const carCx = (CAR.x0 + CAR.x1) / 2;

/** Wooden box: plank floor, posts, back and side walls (front open so we can see inside). */
export const Car: React.FC<{ y: number; brake?: number; show?: number; brakes?: boolean }> = ({ y, brake = 0, show = 1, brakes = false }) => {
  const wood = useMemo(() => tex("planks", "#9a6b3e", [2, 2], 61), []);
  const w = CAR.x1 - CAR.x0;
  const d = CAR.z1 - CAR.z0;
  const cz = (CAR.z0 + CAR.z1) / 2;
  if (show <= 0) return null;
  return (
    <group position={[0, y, 0]} scale={[1, Math.max(0.01, show), 1]}>
      <Slab p={[carCx, 0.06, cz]} s={[w, 0.12, d]} map={wood} rough={0.7} />
      <Slab p={[carCx, 1.3, CAR.z0 + 0.04]} s={[w, 2.6, 0.08]} map={wood} rough={0.75} />
      {[CAR.x0 + 0.04, CAR.x1 - 0.04].map((x) => (
        <Slab key={x} p={[x, 0.6, cz]} s={[0.08, 1.2, d]} map={wood} rough={0.75} />
      ))}
      {[[CAR.x0, CAR.z1], [CAR.x1, CAR.z1], [CAR.x0, CAR.z0], [CAR.x1, CAR.z0]].map(([x, z], i) => (
        <RB key={i} p={[x, CAR.h / 2, z]} s={[0.12, CAR.h, 0.12]} r={0.02} color="#7a5232" rough={0.7} />
      ))}
      {/* top frame + hook */}
      <RB p={[carCx, CAR.h, cz]} s={[w + 0.12, 0.14, 0.14]} r={0.02} color="#7a5232" />
      <RB p={[carCx, CAR.h, cz]} s={[0.14, 0.14, d + 0.12]} r={0.02} color="#7a5232" />
      <mesh position={[carCx, CAR.h + 0.12, -0.9]}>
        <torusGeometry args={[0.1, 0.025, 8, 24]} />
        <meshStandardMaterial color="#555" metalness={1} roughness={0.35} />
      </mesh>
      {/* safety brakes next to the rails: red when they bite */}
      {brakes
        ? [CAR.x0 - 0.06, CAR.x1 + 0.06].map((x) => (
            <RB key={x} p={[x, 0.25, -0.9]} s={[0.12, 0.42, 0.3]} r={0.02} color={brake > 0.5 ? "#ff3b30" : "#c0392b"} emissive="#ff2a1a" ei={brake * 2.5} />
          ))
        : null}
    </group>
  );
};

/** Steel guide rails along the shaft (diagram teal so they read as "new part"). */
export const Rails: React.FC<{ o: number }> = ({ o }) =>
  o <= 0 ? null : (
    <group>
      {[CAR.x0 - 0.14, CAR.x1 + 0.14].map((x) => (
        <mesh key={x} position={[x, (ROOF - 2) / 2, -0.9]} scale={[1, o, 1]}>
          <boxGeometry args={[0.06, ROOF + 2, 0.16]} />
          <meshStandardMaterial color="#34c6d9" emissive="#1a8fa0" emissiveIntensity={0.35} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );

/** A straight rope (bright diagram line) from a to b, with white dots that travel with it. */
export const Rope: React.FC<{ a: V3; b: V3; travel: number; color?: string; dots?: boolean }> = ({ a, b, travel, color = "#ffd23f", dots = true }) => {
  const A = new THREE.Vector3(...a);
  const Bv = new THREE.Vector3(...b);
  const len = A.distanceTo(Bv);
  const mid = A.clone().add(Bv).multiplyScalar(0.5);
  const dir = Bv.clone().sub(A).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  const step = 1.2;
  const n = Math.floor(len / step);
  const ph = ((travel % step) + step) % step;
  return (
    <group>
      <mesh position={mid} quaternion={q}>
        <cylinderGeometry args={[0.035, 0.035, len, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.5} />
      </mesh>
      {dots
        ? Array.from({ length: n }, (_, i) => {
            const d = i * step + ph;
            if (d > len) return null;
            const p = A.clone().add(dir.clone().multiplyScalar(d));
            return (
              <mesh key={i} position={p}>
                <sphereGeometry args={[0.07, 10, 8]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

export const Counterweight: React.FC<{ y: number; o: number }> = ({ y, o }) =>
  o <= 0 ? null : (
    <group position={[CW.x, y, CW.z]} scale={[o, o, o]}>
      {Array.from({ length: 6 }, (_, i) => (
        <RB key={i} p={[0, 0.17 + i * 0.33, 0]} s={[CW.w, 0.3, CW.d]} r={0.02} color="#ff8a1f" emissive="#ff6a00" ei={0.15} metal={0.3} rough={0.5} />
      ))}
      <RB p={[0, CW.h + 0.05, 0]} s={[CW.w + 0.06, 0.1, CW.d + 0.06]} r={0.02} color="#666" metal={0.8} rough={0.4} />
    </group>
  );

/** Machine room on the roof: sheave, hand crank (until there is a motor), optional motor + governor. */
export const MachineRoom: React.FC<{ spin: number; crank: number; motor: number; governor: number; flyOut: number }> = ({ spin, crank, motor, governor, flyOut }) => {
  const conc = useMemo(() => tex("plaster", "#b9b4aa", [2, 1], 71), []);
  return (
    <group>
      <Slab p={[0, ROOF + 3.05, -1.55]} s={[5.4, 0.2, 4.1]} map={conc} rough={0.9} />
      <Slab p={[0, ROOF + 1.5, B.zBack + 0.05]} s={[5.4, 3, 0.1]} map={conc} rough={0.9} />
      {[-2.65, 2.65].map((x) => (
        <Slab key={x} p={[x, ROOF + 1.5, -1.55]} s={[0.1, 3, 4.1]} map={conc} rough={0.9} />
      ))}
      {/* sheave on its stand */}
      <RB p={[SHEAVE.x, ROOF + 0.6, SHEAVE.z - 0.6]} s={[0.3, 1.2, 0.3]} r={0.03} color="#4a4f57" metal={0.7} rough={0.4} />
      <group position={[SHEAVE.x, SHEAVE.y, SHEAVE.z]} rotation={[0, 0, spin]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[SHEAVE.r, SHEAVE.r, 0.22, 48]} />
          <meshStandardMaterial color="#6d737c" metalness={0.9} roughness={0.3} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 3]} position={[0, 0, 0.12]}>
            <boxGeometry args={[SHEAVE.r * 1.8, 0.08, 0.04]} />
            <meshStandardMaterial color="#3d4249" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
        {/* hand crank on the axle */}
        {crank > 0 ? (
          <group position={[0, 0, 0.3]} scale={[crank, crank, crank]}>
            <RB p={[0.35, 0, 0]} s={[0.7, 0.08, 0.06]} r={0.02} color="#8a5a3a" />
            <RB p={[0.68, 0, 0.18]} s={[0.07, 0.07, 0.36]} r={0.03} color="#d9a25a" />
          </group>
        ) : null}
      </group>
      {/* electric motor */}
      {motor > 0 ? (
        <group position={[SHEAVE.x + 1.25, ROOF + 0.6, SHEAVE.z]} scale={[motor, motor, motor]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.9, 32]} />
            <meshStandardMaterial color="#2f6fd1" metalness={0.5} roughness={0.35} />
          </mesh>
          <RB p={[0, -0.45, 0]} s={[0.9, 0.2, 0.9]} r={0.03} color="#3a3f47" metal={0.6} />
        </group>
      ) : null}
      {/* overspeed governor: small sheave with two flyweights that swing out */}
      {governor > 0 ? (
        <group position={[-1.3, ROOF + 1.2, -2.6]} scale={[governor, governor, governor]}>
          <RB p={[0, -0.6, 0]} s={[0.2, 1.0, 0.2]} r={0.03} color="#4a4f57" metal={0.7} />
          <group rotation={[0, 0, spin * 2.2]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.35, 0.35, 0.12, 32]} />
              <meshStandardMaterial color="#e0b23a" metalness={0.6} roughness={0.35} emissive="#a07000" emissiveIntensity={0.2} />
            </mesh>
            {[-1, 1].map((k) => {
              const a = k * (0.25 + flyOut * 0.9);
              return (
                <group key={k} rotation={[0, 0, k > 0 ? a : Math.PI + a]} position={[0, 0, 0.12]}>
                  <RB p={[0.25, 0, 0]} s={[0.5, 0.05, 0.04]} r={0.01} color="#333" metal={0.8} />
                  <mesh position={[0.5, 0, 0]}>
                    <sphereGeometry args={[0.1, 16, 12]} />
                    <meshStandardMaterial color={flyOut > 0.6 ? "#ff3b30" : "#d0d4da"} metalness={0.8} roughness={0.3} emissive="#ff2a1a" emissiveIntensity={flyOut > 0.6 ? 1.5 : 0} />
                  </mesh>
                </group>
              );
            })}
          </group>
        </group>
      ) : null}
    </group>
  );
};

/** Landing doors in the left shaft wall on every floor, with a lock lamp: red = locked, green = car here. */
export const LandingDoors: React.FC<{ o: number; carFloor: number; open10?: number; lockShow?: number }> = ({ o, carFloor, open10 = 0, lockShow = 0 }) =>
  o <= 0 ? null : (
    <group>
      {Array.from({ length: FLOORS }, (_, k) => {
        const n = k + 1;
        const y = floorY(n);
        const open = n === 10 ? open10 : 0;
        const here = Math.abs(carFloor - n) < 0.02;
        const w = (DOOR.z1 - DOOR.z0) / 2;
        const zc = (DOOR.z0 + DOOR.z1) / 2;
        return (
          <group key={k} position={[SHAFT.x0 - 0.08, y, 0]} scale={[1, o, 1]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[0, 1.2, zc + s * (w / 2 + open * w * 0.95)]} castShadow>
                <boxGeometry args={[0.06, 2.4, w - 0.02]} />
                <meshStandardMaterial color="#b8c2cc" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
            {lockShow > 0 ? (
              <group position={[-0.15, 2.7, zc]} scale={[lockShow, lockShow, lockShow]}>
                <mesh>
                  <sphereGeometry args={[0.2, 20, 14]} />
                  <meshStandardMaterial color={here ? "#3dff7a" : "#ff3b30"} emissive={here ? "#22ff66" : "#ff2a1a"} emissiveIntensity={2.5} />
                </mesh>
                <Glow position={[0, 0, 0.1]} size={1.6} color={here ? "#3dff7a" : "#ff3b30"} opacity={0.8} />
              </group>
            ) : null}
          </group>
        );
      })}
    </group>
  );

/** Pit buffers: two coil springs that compress when the car overruns. */
export const Buffers: React.FC<{ o: number; squeeze: number }> = ({ o, squeeze }) => {
  const geo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(Array.from({ length: 121 }, (_, i) => new THREE.Vector3(Math.cos((i / 120) * Math.PI * 14) * 0.22, i / 120, Math.sin((i / 120) * Math.PI * 14) * 0.22))),
        360,
        0.035,
        8,
      ),
    [],
  );
  if (o <= 0) return null;
  const h = 1.0 * (1 - 0.45 * squeeze);
  return (
    <group>
      {[-0.95, 0.35].map((x) => (
        <group key={x} position={[x, -1.9, -0.9]} scale={[o, o * h, o]}>
          <mesh geometry={geo}>
            <meshStandardMaterial color="#39d98a" emissive="#1f9a5c" emissiveIntensity={0.4} metalness={0.6} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
