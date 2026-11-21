import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "./core";

/**
 * Giant rag doll (the "giant pocket puh", ~1.75 m at s = 1): an obvious soft toy — button eyes, stitched
 * smile, yarn hair in two braids, polka-dot dress with a white collar, striped stockings, felt shoes.
 * Fully clothed, cartoon proportions (big head, stubby limbs). Origin = between the feet.
 * Frame-driven pose, all 0–1 unless noted:
 * - `sit`   legs swing forward and the doll sits on the ground (origin stays on the floor)
 * - `limp`  arms and legs flop outward (falling, lying on the seabed, hanging in the claw)
 * - `dance` hop, sway, kicks and waving arms, driven by `t` (seconds)
 * - `wave`  right arm up
 */
export const RagDoll: React.FC<{ p?: V3; ry?: number; s?: number; t?: number; sit?: number; limp?: number; dance?: number; wave?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  s = 1,
  t = 0,
  sit = 0,
  limp = 0,
  dance = 0,
  wave = 0,
}) => {
  const mats = useMemo(() => {
    const fabric = (color: string, map?: THREE.Texture) =>
      new THREE.MeshPhysicalMaterial({ color, map, roughness: 1, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffffff") });
    return {
      skin: fabric("#f3d2b8"),
      cheek: new THREE.MeshStandardMaterial({ color: "#f29a9a", roughness: 1, transparent: true, opacity: 0.85 }),
      hair: fabric("#ffffff", yarnTex()),
      dress: fabric("#ffffff", dotsTex()),
      collar: fabric("#fbf6ec"),
      stocking: fabric("#ffffff", stripeTex()),
      shoe: new THREE.MeshStandardMaterial({ color: "#5b3a24", roughness: 0.9 }),
      button: new THREE.MeshPhysicalMaterial({ color: "#151821", roughness: 0.25, clearcoat: 1 }),
      thread: new THREE.MeshStandardMaterial({ color: "#f7f1e6", roughness: 1 }),
      stitch: new THREE.MeshStandardMaterial({ color: "#7a2e2e", roughness: 1 }),
      ribbon: fabric("#ffcc1a"),
    };
  }, []);
  const smile = useMemo(() => new THREE.TorusGeometry(0.075, 0.009, 6, 24, Math.PI * 0.8), []);
  const dressGeo = useMemo(() => {
    // A-line dress from the armpits to just above the knees
    const pts = [
      [0.0, 0.0],
      [0.36, 0.0],
      [0.33, 0.08],
      [0.27, 0.28],
      [0.2, 0.46],
      [0.18, 0.52],
      [0.0, 0.53],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  // ── pose
  const ph = t * Math.PI * 2 * 1.05; // ~1 beat per second
  const hop = dance * Math.abs(Math.sin(ph)) * 0.14;
  const sway = dance * Math.sin(ph) * 0.14;
  const twist = dance * Math.sin(ph * 0.5) * 0.35;
  const kickL = dance * Math.max(0, Math.sin(ph)) * 0.6;
  const kickR = dance * Math.max(0, -Math.sin(ph)) * 0.6;
  const legLen = 0.62;
  const hipY = legLen + 0.06;
  const legFwd = -1.45 * sit; // rotate legs forward about X
  const bodyDrop = (hipY - 0.12) * sit; // sit on the floor
  const armOut = 0.35 + 0.9 * limp + dance * (0.6 + 0.5 * Math.sin(ph));
  const armUpR = wave * 2.4 + dance * (1.4 + 0.5 * Math.sin(ph + 1));
  const armUpL = dance * (1.4 + 0.5 * Math.sin(ph + 2.5));
  const legSpread = 0.08 + 0.35 * limp;
  const wob = Math.sin(t * 1.6) * 0.015 * (1 - dance);
  const leg = (k: 1 | -1, kick: number) => (
    <group key={k} position={[0.11 * k, hipY, 0]} rotation={[legFwd - kick, 0, k * legSpread]}>
      <mesh material={mats.stocking} position={[0, -legLen / 2, 0]} castShadow>
        <capsuleGeometry args={[0.075, legLen - 0.15, 8, 16]} />
      </mesh>
      <mesh material={mats.shoe} position={[0, -legLen + 0.03, 0.06]} scale={[1, 0.62, 1.45]} castShadow>
        <sphereGeometry args={[0.095, 16, 12]} />
      </mesh>
    </group>
  );
  const arm = (k: 1 | -1, up: number) => (
    <group key={k} position={[0.2 * k, hipY + 0.47, 0]} rotation={[0, 0, k * (armOut + up)]}>
      <mesh material={mats.dress} position={[0, -0.06, 0]} castShadow>
        <sphereGeometry args={[0.085, 16, 12]} />
      </mesh>
      <mesh material={mats.skin} position={[0, -0.26, 0]} castShadow>
        <capsuleGeometry args={[0.062, 0.3, 8, 16]} />
      </mesh>
      {/* mitten hand */}
      <mesh material={mats.skin} position={[0, -0.47, 0]} scale={[1, 1.15, 0.8]} castShadow>
        <sphereGeometry args={[0.08, 16, 12]} />
      </mesh>
    </group>
  );
  return (
    <group position={p} rotation={[0, ry, 0]} scale={[s, s * (1 + wob), s]}>
      <group position={[0, hop - bodyDrop, 0]} rotation={[0, twist, sway]}>
        {leg(1, kickR)}
        {leg(-1, kickL)}
        {/* bloomers peeking out under the dress */}
        <mesh material={mats.collar} position={[0, hipY + 0.02, 0]} scale={[1, 0.55, 0.85]}>
          <sphereGeometry args={[0.2, 20, 14]} />
        </mesh>
        <mesh geometry={dressGeo} material={mats.dress} position={[0, hipY - 0.1, 0]} castShadow receiveShadow />
        {/* collar + yellow bow */}
        <mesh material={mats.collar} position={[0, hipY + 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.045, 10, 28]} />
        </mesh>
        <mesh material={mats.ribbon} position={[0, hipY + 0.42, 0.16]} scale={[1.6, 0.8, 0.6]}>
          <sphereGeometry args={[0.045, 12, 10]} />
        </mesh>
        {arm(1, armUpR)}
        {arm(-1, armUpL)}
        {/* head */}
        <group position={[0, hipY + 0.78, 0]} rotation={[0.08 * limp, 0, -sway * 0.6]}>
          <mesh material={mats.skin} scale={[1, 0.98, 0.94]} castShadow receiveShadow>
            <sphereGeometry args={[0.31, 40, 28]} />
          </mesh>
          {/* yarn hair: a fringe of loops + two braids with bows */}
          <mesh material={mats.hair} position={[0, 0.07, -0.02]} scale={[1.04, 0.92, 1.0]}>
            <sphereGeometry args={[0.31, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
          {/* back of the head: yarn all the way down to the neck */}
          <mesh material={mats.hair} position={[0, -0.02, -0.06]} scale={[1, 1, 0.9]}>
            <sphereGeometry args={[0.315, 32, 20]} />
          </mesh>
          {Array.from({ length: 11 }, (_, i) => {
            const a = -0.95 + (i / 10) * 1.9;
            return (
              <mesh key={i} material={mats.hair} position={[Math.sin(a) * 0.27, 0.13, Math.cos(a) * 0.24]} rotation={[Math.PI / 2 - 0.3, 0, a]}>
                <torusGeometry args={[0.04, 0.018, 6, 12]} />
              </mesh>
            );
          })}
          {[-1, 1].map((k) => (
            <group key={k} position={[0.27 * k, -0.02, -0.04]} rotation={[0, 0, k * (0.35 + 0.5 * limp + dance * 0.3 * Math.sin(ph + k))]}>
              {[0, 1, 2, 3].map((j) => (
                <mesh key={j} material={mats.hair} position={[0.02 * k, -0.08 - j * 0.085, 0]} scale={[1, 1.2, 1]}>
                  <sphereGeometry args={[0.055 - j * 0.004, 12, 10]} />
                </mesh>
              ))}
              <mesh material={mats.ribbon} position={[0.02 * k, -0.04, 0]} scale={[1.7, 0.7, 0.7]}>
                <sphereGeometry args={[0.04, 10, 8]} />
              </mesh>
            </group>
          ))}
          {/* button eyes with cross-stitched thread */}
          {[-1, 1].map((k) => (
            <group key={k} position={[0.105 * k, 0.0, 0.285]} rotation={[0, 0.33 * k, 0]}>
              <mesh material={mats.button} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.055, 0.055, 0.025, 24]} />
              </mesh>
              {[0.78, -0.78].map((r) => (
                <mesh key={r} material={mats.thread} position={[0, 0, 0.014]} rotation={[0, 0, r]}>
                  <boxGeometry args={[0.055, 0.008, 0.004]} />
                </mesh>
              ))}
            </group>
          ))}
          {/* rosy cheeks, tiny nose, stitched smile */}
          {[-1, 1].map((k) => (
            <mesh key={k} material={mats.cheek} position={[0.17 * k, -0.09, 0.245]} rotation={[0, 0.6 * k, 0]} scale={[1, 0.75, 0.3]}>
              <sphereGeometry args={[0.045, 14, 10]} />
            </mesh>
          ))}
          <mesh material={mats.stitch} position={[0, -0.05, 0.305]} scale={[1, 0.8, 0.6]}>
            <sphereGeometry args={[0.018, 10, 8]} />
          </mesh>
          <mesh geometry={smile} material={mats.stitch} position={[0, -0.1, 0.285]} rotation={[0.25, 0, Math.PI * 1.1]} />
        </group>
      </group>
    </group>
  );
};

let dots: THREE.Texture | null = null;
const dotsTex = () => {
  if (dots) return dots;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2f7fd6";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#ffffff";
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      g.beginPath();
      g.arc(x * 32 + (y % 2 ? 16 : 0) + 8, y * 32 + 16, 6, 0, Math.PI * 2);
      g.fill();
    }
  dots = new THREE.CanvasTexture(c);
  dots.wrapS = dots.wrapT = THREE.RepeatWrapping;
  dots.repeat.set(3, 2);
  dots.colorSpace = THREE.SRGBColorSpace;
  return dots;
};

let stripes: THREE.Texture | null = null;
const stripeTex = () => {
  if (stripes) return stripes;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? "#ffffff" : "#e8443a";
    g.fillRect(0, i * 32, 64, 32);
  }
  stripes = new THREE.CanvasTexture(c);
  stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping;
  stripes.repeat.set(1, 1.5);
  stripes.colorSpace = THREE.SRGBColorSpace;
  return stripes;
};

let yarn: THREE.Texture | null = null;
/** Yarn strands running from the parting down to the ears. */
const yarnTex = () => {
  if (yarn) return yarn;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#a9561f";
  g.fillRect(0, 0, 256, 128);
  for (let x = 0; x < 256; x += 6) {
    const grd = g.createLinearGradient(x, 0, x + 6, 0);
    grd.addColorStop(0, "#8c4316");
    grd.addColorStop(0.5, "#d0823e");
    grd.addColorStop(1, "#8c4316");
    g.fillStyle = grd;
    g.fillRect(x, 0, 6, 128);
  }
  yarn = new THREE.CanvasTexture(c);
  yarn.wrapS = yarn.wrapT = THREE.RepeatWrapping;
  yarn.colorSpace = THREE.SRGBColorSpace;
  return yarn;
};
