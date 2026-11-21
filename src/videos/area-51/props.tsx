import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { RB, tex } from "../../lib/three/diorama";

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
};
const once = <T,>(make: () => T) => {
  let v: T | null = null;
  return () => (v ??= make());
};

/** Corrugated metal (vertical ribs). */
const corrugated = once(() =>
  canvasTex(
    256,
    64,
    (g) => {
      for (let x = 0; x < 256; x++) {
        const v = 170 + 50 * Math.sin((x / 256) * Math.PI * 2 * 16);
        g.fillStyle = `rgb(${v},${v + 3},${v + 6})`;
        g.fillRect(x, 0, 1, 64);
      }
    },
    [12, 1],
  ),
);

/** Big arched hangar (origin = ground under the middle of the front, faces +Z). w × l, arch height ≈ w/2.4. */
export const Hangar: React.FC<{ w?: number; l?: number; door?: number; color?: string; light?: number }> = ({ w = 40, l = 60, door = 0, color = "#d9dcdf", light = 0 }) => {
  const r = w / 2;
  const sy = 0.82;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: corrugated(), color, roughness: 0.45, metalness: 0.55, side: THREE.DoubleSide }), [color]);
  const front = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-r, 0);
    s.absarc(0, 0, r, Math.PI, 0, true);
    s.lineTo(r, 0);
    const hole = new THREE.Path();
    hole.moveTo(-r * 0.78, 0);
    hole.lineTo(r * 0.78, 0);
    hole.lineTo(r * 0.78, r * 0.7);
    hole.lineTo(-r * 0.78, r * 0.7);
    hole.closePath();
    s.holes.push(hole);
    return new THREE.ShapeGeometry(s, 32);
  }, [r]);
  return (
    <group>
      {/* the arched shell */}
      <mesh material={mat} position={[0, 0, -l / 2]} rotation={[Math.PI / 2, 0, Math.PI / 2]} scale={[1, 1, sy]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, l, 48, 1, true, 0, Math.PI]} />
      </mesh>
      <mesh geometry={front} position={[0, 0, 0]} scale={[1, sy, 1]} castShadow>
        <meshStandardMaterial color="#c9ccd0" roughness={0.5} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={front} position={[0, 0, -l]} scale={[1, sy, 1]}>
        <meshStandardMaterial color="#c9ccd0" roughness={0.5} metalness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* dark inside + sliding doors */}
      <mesh position={[0, (r * 0.7 * sy) / 2, -0.6]}>
        <planeGeometry args={[r * 1.56, r * 0.7 * sy]} />
        <meshStandardMaterial color="#2a2e33" emissive="#ffe8c0" emissiveIntensity={0.25 * light} />
      </mesh>
      {[-1, 1].map((s) =>
        [0, 1].map((k) => (
          <mesh key={`${s}${k}`} material={mat} position={[s * (r * 0.39 + k * r * 0.39 - (door * r * 0.39 * (k ? 0.6 : 1))) + s * 0, (r * 0.7 * sy) / 2, 0.3 + k * 0.25]}>
            <boxGeometry args={[r * 0.39, r * 0.7 * sy, 0.2]} />
          </mesh>
        )),
      )}
      {/* concrete apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 14]} receiveShadow>
        <planeGeometry args={[w + 6, 28]} />
        <meshStandardMaterial map={tex("plaster", "#b6ae9f", [6, 4], 201)} roughness={0.9} />
      </mesh>
    </group>
  );
};

/** Flat-roofed base building with window bands (origin = ground middle, faces +Z). */
export const Block: React.FC<{ s: V3; color?: string; seed?: number }> = ({ s, color = "#d8d2c4", seed = 1 }) => {
  const win = useMemo(
    () =>
      canvasTex(256, 128, (g) => {
        g.fillStyle = color;
        g.fillRect(0, 0, 256, 128);
        g.fillStyle = "#2a3542";
        for (let y = 0; y < 2; y++) for (let x = 0; x < 8; x++) g.fillRect(8 + x * 31, 22 + y * 60, 20, 26);
      }),
    [color],
  );
  win.wrapS = THREE.RepeatWrapping;
  win.repeat.set(Math.max(1, Math.round(s[0] / 16)), 1);
  return (
    <group>
      <mesh position={[0, s[1] / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={s} />
        <meshStandardMaterial map={win} roughness={0.85} />
      </mesh>
      <RB p={[0, s[1] + 0.15, 0]} s={[s[0] + 0.4, 0.3, s[2] + 0.4]} r={0.05} color="#9a958b" />
      {/* AC units on the roof */}
      {[-0.3, 0.2].map((k, i) => (
        <RB key={i} p={[k * s[0], s[1] + 0.8, ((seed + i) % 2 ? 0.2 : -0.2) * s[2]]} s={[2.4, 1.2, 1.6]} r={0.08} color="#b9bcc0" metal={0.4} />
      ))}
    </group>
  );
};

/** Radar dome on a lattice tower (origin = ground). */
export const RadarDome: React.FC = () => (
  <group>
    {[-1, 1].map((x) =>
      [-1, 1].map((z) => (
        <mesh key={`${x}${z}`} position={[x * 2.4, 6, z * 2.4]} rotation={[z * 0.08, 0, -x * 0.08]}>
          <cylinderGeometry args={[0.18, 0.22, 12, 6]} />
          <meshStandardMaterial color="#c9ccd0" metalness={0.6} roughness={0.4} />
        </mesh>
      )),
    )}
    <RB p={[0, 12.2, 0]} s={[6.5, 0.5, 6.5]} r={0.06} color="#b9bcc0" />
    <mesh position={[0, 15.4, 0]} castShadow>
      <sphereGeometry args={[4.4, 32, 24]} />
      <meshStandardMaterial color="#f4f4f2" roughness={0.6} />
    </mesh>
  </group>
);

/** Control tower: concrete shaft, glass cab (origin = ground). */
export const Tower: React.FC = () => (
  <group>
    <mesh position={[0, 10, 0]} castShadow>
      <cylinderGeometry args={[2.2, 2.6, 20, 20]} />
      <meshStandardMaterial map={tex("plaster", "#d6cfbf", [3, 4], 211)} roughness={0.85} />
    </mesh>
    <mesh position={[0, 22, 0]}>
      <cylinderGeometry args={[4.2, 3.4, 4, 8]} />
      <meshStandardMaterial color="#2a3a48" roughness={0.1} metalness={0.6} />
    </mesh>
    <RB p={[0, 24.3, 0]} s={[9, 0.6, 9]} r={0.1} color="#e6e1d6" />
    <mesh position={[0, 26.5, 0]}>
      <cylinderGeometry args={[0.08, 0.08, 4, 6]} />
      <meshStandardMaterial color="#ddd" />
    </mesh>
  </group>
);

/** Water tower (origin = ground). */
export const WaterTower: React.FC = () => (
  <group>
    {Array.from({ length: 4 }, (_, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return (
        <mesh key={i} position={[Math.cos(a) * 3, 9, Math.sin(a) * 3]} rotation={[Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1]}>
          <cylinderGeometry args={[0.2, 0.25, 18, 8]} />
          <meshStandardMaterial color="#cfd2d6" metalness={0.5} roughness={0.4} />
        </mesh>
      );
    })}
    <mesh position={[0, 20.5, 0]} castShadow>
      <cylinderGeometry args={[4.6, 4.6, 5, 32]} />
      <meshStandardMaterial color="#e9ebee" metalness={0.3} roughness={0.5} />
    </mesh>
    <mesh position={[0, 23.6, 0]}>
      <coneGeometry args={[4.8, 1.6, 32]} />
      <meshStandardMaterial color="#d9dcdf" metalness={0.3} roughness={0.5} />
    </mesh>
  </group>
);

/** White pickup (camo dudes' truck). Faces +X, origin = ground middle. */
export const Pickup: React.FC<{ color?: string }> = ({ color = "#eef0f2" }) => (
  <group>
    <RB p={[0.9, 1.05, 0]} s={[2.2, 1.1, 1.9]} r={0.2} color={color} rough={0.35} metal={0.3} />
    <RB p={[-0.9, 0.8, 0]} s={[2.6, 0.6, 1.9]} r={0.08} color={color} rough={0.35} metal={0.3} />
    <RB p={[0.2, 0.62, 0]} s={[5.2, 0.5, 1.95]} r={0.12} color={color} rough={0.35} metal={0.3} />
    <mesh position={[1.35, 1.35, 0]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[1.7, 0.55]} />
      <meshStandardMaterial color="#1b2733" roughness={0.1} metalness={0.5} />
    </mesh>
    {[-1.5, 1.6].map((x) =>
      [-0.95, 0.95].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.42, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.3, 18]} />
          <meshStandardMaterial color="#151515" roughness={0.9} />
        </mesh>
      )),
    )}
  </group>
);

/** The famous warning sign (origin = ground). */
const signTex = once(() =>
  canvasTex(512, 640, (g) => {
    g.fillStyle = "#f4f1e8";
    g.fillRect(0, 0, 512, 640);
    g.fillStyle = "#c8261e";
    g.fillRect(0, 0, 512, 120);
    g.fillStyle = "#ffffff";
    g.font = "bold 92px Arial";
    g.textAlign = "center";
    g.fillText("WARNING", 256, 94);
    g.fillStyle = "#151515";
    g.font = "bold 44px Arial";
    ["RESTRICTED AREA", "", "NO TRESPASSING", "BEYOND THIS POINT", "", "PHOTOGRAPHY OF THIS", "AREA IS PROHIBITED"].forEach((l, i) => g.fillText(l, 256, 190 + i * 50));
    g.fillStyle = "#c8261e";
    g.font = "bold 40px Arial";
    g.fillText("USE OF DEADLY FORCE", 256, 570);
    g.fillText("AUTHORIZED", 256, 616);
  }),
);
export const WarningSign: React.FC = () => (
  <group>
    {[-0.75, 0.75].map((x) => (
      <mesh key={x} position={[x, 1.2, -0.05]}>
        <cylinderGeometry args={[0.05, 0.05, 2.4, 8]} />
        <meshStandardMaterial color="#8a8f95" metalness={0.6} roughness={0.4} />
      </mesh>
    ))}
    <mesh position={[0, 1.85, 0]} castShadow>
      <boxGeometry args={[1.6, 2.0, 0.04]} />
      <meshStandardMaterial color="#e8e4da" />
    </mesh>
    <mesh position={[0, 1.85, 0.025]}>
      <planeGeometry args={[1.56, 1.95]} />
      <meshStandardMaterial map={signTex()} roughness={0.7} />
    </mesh>
  </group>
);

/** Orange-topped boundary post (the "line in the sand"). Origin = ground. */
export const BoundaryPost: React.FC = () => (
  <group>
    <mesh position={[0, 0.75, 0]}>
      <cylinderGeometry args={[0.06, 0.07, 1.5, 8]} />
      <meshStandardMaterial color="#cfc8b8" roughness={0.8} />
    </mesh>
    <mesh position={[0, 1.4, 0]}>
      <cylinderGeometry args={[0.065, 0.065, 0.25, 8]} />
      <meshStandardMaterial color="#ff6a1a" roughness={0.5} />
    </mesh>
  </group>
);

/** Buried road sensor: a cut-away of the road shows the box with a radio pulse (origin = road surface). */
export const RoadSensor: React.FC<{ t: number; ping: number }> = ({ t, ping }) => (
  <group>
    {/* dug-in housing with a little antenna, half out of the dirt beside the road */}
    <RB p={[0, 0.12, 0]} s={[0.5, 0.25, 0.35]} r={0.04} color="#3a3f45" metal={0.5} />
    <mesh position={[0.15, 0.45, 0.1]}>
      <cylinderGeometry args={[0.01, 0.01, 0.5, 6]} />
      <meshStandardMaterial color="#222" />
    </mesh>
    <Glow position={[0.15, 0.7, 0.1]} size={0.25} color="#ff3b30" opacity={0.6 + 0.4 * Math.sin(t * 3)} />
    {ping > 0 ? (
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ping * 3.5, ping * 3.5 + 0.12, 48]} />
        <meshBasicMaterial color="#ff5a4e" transparent opacity={1 - ping} toneMapped={false} />
      </mesh>
    ) : null}
  </group>
);

/** Lockheed U-2: long slim fuselage, very long straight glider wings, silver (origin = middle, nose +X). ~19 m long, 31 m span. */
export const U2: React.FC<{ glow?: number }> = ({ glow = 0 }) => {
  const silver = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9ced4", metalness: 0.9, roughness: 0.22, emissive: "#ffb06a", emissiveIntensity: 0.9 * glow }), [glow]);
  return (
    <group>
      <mesh material={silver} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.75, 16, 8, 20]} />
      </mesh>
      <mesh material={silver} position={[0.5, 0.15, 0]}>
        <boxGeometry args={[2.6, 0.18, 31]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={silver} position={[0.5, 0.2, s * 15.4]}>
          <boxGeometry args={[1.4, 0.16, 0.9]} />
        </mesh>
      ))}
      <mesh material={silver} position={[-7.6, 1.6, 0]}>
        <boxGeometry args={[2.0, 3.0, 0.16]} />
      </mesh>
      <mesh material={silver} position={[-7.9, 0.4, 0]}>
        <boxGeometry args={[1.6, 0.12, 6.4]} />
      </mesh>
      <mesh position={[4.5, 0.65, 0]} scale={[1.8, 0.7, 0.8]}>
        <sphereGeometry args={[0.55, 16, 10]} />
        <meshStandardMaterial color="#1b2733" roughness={0.05} metalness={0.6} />
      </mesh>
      {glow > 0.01 ? (
        <group>
          <Glow position={[0, 0.2, 0]} size={30 * glow} color="#ffcf8a" opacity={0.8 * glow} fog={false} />
          {[-1, 1].map((s) => (
            <Glow key={s} position={[0.5, 0.2, s * 10]} size={18 * glow} color="#ffb06a" opacity={0.7 * glow} fog={false} />
          ))}
        </group>
      ) : null}
    </group>
  );
};

/** Popcorn bucket (origin = bottom). */
export const Popcorn: React.FC = () => {
  const stripes = useMemo(
    () =>
      canvasTex(256, 64, (g) => {
        for (let i = 0; i < 16; i++) {
          g.fillStyle = i % 2 ? "#ffffff" : "#d22b2b";
          g.fillRect(i * 16, 0, 16, 64);
        }
      }),
    [],
  );
  return (
    <group>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.12, 0.09, 0.26, 24, 1, true]} />
        <meshStandardMaterial map={stripes} side={THREE.DoubleSide} roughness={0.6} />
      </mesh>
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} position={[Math.cos(i * 2.4) * 0.07 * ((i % 4) / 4 + 0.3), 0.27 + (i % 3) * 0.025, Math.sin(i * 2.4) * 0.07 * ((i % 4) / 4 + 0.3)]}>
          <icosahedronGeometry args={[0.028, 0]} />
          <meshStandardMaterial color="#fff4c8" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
};

/** Lockheed A-12 / "Blackbird" family (origin = middle, nose +X): ~31 m long, 17 m span, black titanium skin,
 * the flat chines along the fuselage, a delta wing, two big engine nacelles with spike inlets, inward-canted fins. */
export const A12: React.FC = () => {
  const black = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2e35", metalness: 0.6, roughness: 0.38 }), []);
  const gearMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b8bcc2", metalness: 0.8, roughness: 0.3 }), []);
  const tyre = useMemo(() => new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.9 }), []);
  const plan = useMemo(() => {
    // planform (x forward, y = span) of fuselage chines + delta wing, extruded thin
    const s = new THREE.Shape();
    s.moveTo(15.5, 0);
    s.quadraticCurveTo(8, 1.1, 2, 2.2);
    s.lineTo(-3, 8.4);
    s.lineTo(-9.5, 8.4);
    s.lineTo(-11, 2.2);
    s.lineTo(-15, 1.2);
    s.lineTo(-15, -1.2);
    s.lineTo(-11, -2.2);
    s.lineTo(-9.5, -8.4);
    s.lineTo(-3, -8.4);
    s.lineTo(2, -2.2);
    s.quadraticCurveTo(8, -1.1, 15.5, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.12, bevelSegments: 3 });
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={plan} material={black} position={[0, 0.2, 0]} castShadow />
      {/* fuselage spine + cockpit */}
      <mesh material={black} rotation={[0, 0, -Math.PI / 2]} position={[1, 0.1, 0]} scale={[1, 1, 0.75]} castShadow>
        <capsuleGeometry args={[0.85, 22, 8, 20]} />
      </mesh>
      <mesh position={[8.4, 0.75, 0]} scale={[2.2, 0.55, 0.7]}>
        <sphereGeometry args={[0.6, 16, 10]} />
        <meshStandardMaterial color="#2a3a48" roughness={0.05} metalness={0.7} />
      </mesh>
      {/* nose gear */}
      <mesh material={gearMat} position={[9.5, -0.9, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.6, 10]} />
      </mesh>
      {[-0.22, 0.22].map((dz) => (
        <mesh key={dz} material={tyre} position={[9.5, -1.75, dz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.22, 18]} />
        </mesh>
      ))}
      {/* nacelles with inlet spikes, mid-wing */}
      {[-1, 1].map((s) => (
        <group key={s} position={[-4, 0.1, s * 4.6]}>
          <mesh material={black} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <cylinderGeometry args={[1.05, 1.15, 13, 24]} />
          </mesh>
          <mesh material={black} position={[7.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.7, 2.2, 20]} />
          </mesh>
          <mesh position={[-6.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[0.95, 0.95, 0.2, 20]} />
            <meshStandardMaterial color="#0a0a0a" />
          </mesh>
          {/* main gear under the inner wing: leg + twin wheels, standing on the ground at y = −2.1 */}
          <mesh material={gearMat} position={[-2.5, -1.1, -s * 2.0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.6, 10]} />
          </mesh>
          {[-0.28, 0.28].map((dz) => (
            <mesh key={dz} material={tyre} position={[-2.5, -1.65, -s * 2.0 + dz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.45, 0.45, 0.3, 20]} />
            </mesh>
          ))}
          {/* fin on top of the nacelle, canted inwards */}
          <mesh material={black} position={[-5, 1.9, -s * 0.2]} rotation={[s * 0.26, 0, 0]}>
            <boxGeometry args={[3.6, 3.2, 0.14]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** MiG-21 "Fishbed": silver delta fighter with a nose intake cone, tall swept fin, red stars (origin = middle, nose +X, ~14 m). */
export const MiG21: React.FC = () => {
  const silver = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b9bec4", metalness: 0.85, roughness: 0.3 }), []);
  const star = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = "#d0261e";
    g.strokeStyle = "#ffffff";
    g.lineWidth = 6;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 22 : 56;
      g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
    }
    g.closePath();
    g.stroke();
    g.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const delta = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(1.5, 0.6);
    s.lineTo(-3.6, 3.6);
    s.lineTo(-4.4, 3.6);
    s.lineTo(-3.8, 0.6);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: false });
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  return (
    <group>
      <mesh material={silver} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.62, 0.55, 12, 24]} />
      </mesh>
      <mesh position={[6.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.62, 0.6, 24, 1, true]} />
        <meshStandardMaterial color="#2a2d31" side={THREE.DoubleSide} />
      </mesh>
      <mesh material={silver} position={[6.6, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.28, 1.0, 20]} />
      </mesh>
      <mesh position={[3.6, 0.55, 0]} scale={[1.8, 0.6, 0.6]}>
        <sphereGeometry args={[0.5, 16, 10]} />
        <meshStandardMaterial color="#2a3a48" roughness={0.05} metalness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={delta} material={silver} position={[0, 0, 0]} scale={[1, 1, s]} castShadow />
      ))}
      <mesh material={silver} position={[-4.4, 1.4, 0]} rotation={[0, 0, 0.55]}>
        <boxGeometry args={[2.6, 2.4, 0.1]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-3.1, 1.25, s * 0.06]} rotation={[0, s === 1 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial map={star} transparent toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[-6.1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.1, 20]} />
        <meshStandardMaterial color="#121212" />
      </mesh>
    </group>
  );
};

/** Nevada licence plate. */
const plateTex = once(() =>
  canvasTex(256, 128, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, "#cfe3f5");
    gr.addColorStop(1, "#f6e7c4");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 128);
    g.strokeStyle = "#1d3b6e";
    g.lineWidth = 6;
    g.strokeRect(3, 3, 250, 122);
    g.fillStyle = "#1d3b6e";
    g.textAlign = "center";
    g.font = "bold 22px Arial";
    g.fillText("NEVADA", 128, 30);
    g.font = "bold 64px Arial";
    g.fillText("51 X 1F", 128, 100);
  }),
);
/** Sedan body side profile (beltline down), cabin glass and roof — shared by every car. */
const sedanGeo = once(() => {
  const ext = (s: THREE.Shape, depth: number, bevel: number) => {
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 16 });
    g.translate(0, 0, -depth / 2);
    return g;
  };
  const b = new THREE.Shape();
  b.moveTo(-2.25, 0.3);
  b.lineTo(2.25, 0.3);
  b.quadraticCurveTo(2.42, 0.62, 2.28, 0.82);
  b.lineTo(1.05, 0.98);
  b.lineTo(-1.95, 1.0);
  b.quadraticCurveTo(-2.32, 0.95, -2.3, 0.62);
  b.lineTo(-2.25, 0.3);
  // greenhouse: narrower than the body (tumblehome), glass all round, body-coloured roof on top
  const gl = new THREE.Shape();
  gl.moveTo(1.02, 0.96);
  gl.quadraticCurveTo(0.55, 1.36, 0.05, 1.4);
  gl.lineTo(-1.0, 1.38);
  gl.quadraticCurveTo(-1.55, 1.3, -1.9, 0.96);
  gl.closePath();
  const rf = new THREE.Shape();
  rf.moveTo(0.42, 1.36);
  rf.quadraticCurveTo(0.25, 1.43, 0.05, 1.44);
  rf.lineTo(-1.0, 1.42);
  rf.quadraticCurveTo(-1.25, 1.39, -1.4, 1.33);
  rf.closePath();
  return { body: ext(b, 1.66, 0.09), glass: ext(gl, 1.42, 0.04), roof: ext(rf, 1.4, 0.05) };
});
/** A more detailed sedan (origin = ground middle, faces +X): body with tumblehome cabin, bumpers, plate, wide tail lights,
 * grille, mirrors, wheel arches, rims. */
export const Sedan: React.FC<{ color?: string; brake?: number }> = ({ color = "#c0392b", brake = 0.4 }) => {
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.3 }), [color]);
  const geo = sedanGeo();
  const trim = "#1d1f22";
  return (
    <group>
      <mesh geometry={geo.body} material={body} castShadow receiveShadow />
      <mesh geometry={geo.glass}>
        <meshStandardMaterial color="#16202a" roughness={0.06} metalness={0.8} />
      </mesh>
      <mesh geometry={geo.roof} material={body} castShadow />
      {/* bumpers, sills */}
      <RB p={[-2.36, 0.42, 0]} s={[0.22, 0.26, 1.78]} r={0.08} color={trim} rough={0.7} />
      <RB p={[2.36, 0.4, 0]} s={[0.22, 0.24, 1.78]} r={0.08} color={trim} rough={0.7} />
      {[-0.88, 0.88].map((z) => (
        <RB key={z} p={[0, 0.33, z]} s={[2.2, 0.1, 0.06]} r={0.03} color={trim} rough={0.7} />
      ))}
      {/* rear: plate, wide tail lights, exhaust */}
      <mesh position={[-2.48, 0.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.5, 0.25]} />
        <meshStandardMaterial map={plateTex()} roughness={0.5} />
      </mesh>
      {[-0.58, 0.58].map((z) => (
        <RB key={z} p={[-2.34, 0.8, z]} s={[0.06, 0.15, 0.5]} r={0.03} color="#9a0d16" emissive="#ff1e2c" ei={brake} rough={0.25} />
      ))}
      <mesh position={[-2.42, 0.25, 0.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, 0.16, 12]} />
        <meshStandardMaterial color="#9aa0a6" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* front: grille + headlights */}
      <RB p={[2.36, 0.64, 0]} s={[0.05, 0.16, 0.8]} r={0.03} color="#0d0e10" rough={0.5} />
      {[-0.62, 0.62].map((z) => (
        <RB key={z} p={[2.3, 0.72, z]} s={[0.08, 0.13, 0.38]} r={0.04} color="#f4f1e6" emissive="#fff1c8" ei={0.5} rough={0.1} />
      ))}
      {/* mirrors */}
      {[-1, 1].map((sd) => (
        <RB key={sd} p={[0.85, 1.05, sd * 0.93]} s={[0.12, 0.13, 0.2]} r={0.04} color={color} metal={0.55} rough={0.3} />
      ))}
      {/* wheel arches + wheels */}
      {[-1.45, 1.45].map((x) =>
        [-0.84, 0.84].map((z) => (
          <group key={`${x}${z}`}>
            <mesh position={[x, 0.36, z > 0 ? 0.925 : -0.925]} rotation={[0, z > 0 ? 0 : Math.PI, 0]}>
              <circleGeometry args={[0.44, 24, 0, Math.PI]} />
              <meshStandardMaterial color="#0b0b0c" roughness={1} />
            </mesh>
            <group position={[x, 0.34, z]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.34, 0.34, 0.24, 24]} />
                <meshStandardMaterial color="#141414" roughness={0.9} />
              </mesh>
              <mesh position={[0, z > 0 ? 0.125 : -0.125, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.02, 16]} />
                <meshStandardMaterial color="#c9ced4" metalness={0.9} roughness={0.25} />
              </mesh>
            </group>
          </group>
        )),
      )}
    </group>
  );
};

/** The green "EXTRATERRESTRIAL HIGHWAY" road sign (origin = ground, faces +Z). */
const etTex = once(() =>
  canvasTex(768, 384, (g) => {
    g.fillStyle = "#0e6b3a";
    g.fillRect(0, 0, 768, 384);
    g.strokeStyle = "#ffffff";
    g.lineWidth = 10;
    g.strokeRect(14, 14, 740, 356);
    g.fillStyle = "#ffffff";
    g.textAlign = "center";
    g.font = "bold 70px Arial";
    g.fillText("EXTRATERRESTRIAL", 384, 160);
    g.fillText("HIGHWAY", 384, 260);
    g.font = "bold 40px Arial";
    g.fillText("STATE ROUTE 375", 384, 330);
  }),
);
export const ETSign: React.FC = () => (
  <group>
    {[-1.3, 1.3].map((x) => (
      <mesh key={x} position={[x, 1.6, -0.06]}>
        <cylinderGeometry args={[0.06, 0.06, 3.2, 8]} />
        <meshStandardMaterial color="#8a8f95" metalness={0.6} roughness={0.4} />
      </mesh>
    ))}
    <mesh position={[0, 2.6, 0]} castShadow>
      <planeGeometry args={[3.6, 1.8]} />
      <meshStandardMaterial map={etTex()} roughness={0.6} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

/** Big painted hangar number (origin = centre of the decal). */
export const HangarNumber: React.FC<{ n: string }> = ({ n }) => {
  const t = useMemo(
    () =>
      canvasTex(256, 256, (g) => {
        g.clearRect(0, 0, 256, 256);
        g.fillStyle = "#f2c230";
        g.font = "bold 200px Arial";
        g.textAlign = "center";
        g.fillText(n, 128, 200);
      }),
    [n],
  );
  return (
    <mesh>
      <planeGeometry args={[6, 6]} />
      <meshBasicMaterial map={t} transparent toneMapped={false} />
    </mesh>
  );
};

/** Sagebrush: thousands of low grey-green shrubs as one instanced mesh. `avoid(x, z)` keeps roads, runway and lake clear. */
export const Scrub: React.FC<{ n?: number; area: [number, number, number, number]; avoid?: (x: number, z: number) => boolean; seed?: number }> = ({ n = 9000, area, avoid, seed = 3 }) => {
  const mesh = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 2);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const k = 1 + 0.22 * Math.sin(x * 7) * Math.sin(z * 6) + 0.12 * Math.sin(y * 9);
      p.setXYZ(i, x * k, Math.max(-0.2, y) * 0.62 * k, z * k);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: "#727a5e", roughness: 1, envMapIntensity: 0.3 });
    const m = new THREE.InstancedMesh(geo, mat, n);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    let r = seed * 7919;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const [x0, x1, z0, z1] = area;
    let k = 0;
    for (let tries = 0; tries < n * 3 && k < n; tries++) {
      const x = x0 + rnd() * (x1 - x0);
      const z = z0 + rnd() * (z1 - z0);
      if (avoid && avoid(x, z)) continue;
      const s = 0.35 + rnd() * 0.75;
      o.position.set(x, s * 0.2, z);
      o.scale.set(s * (0.9 + rnd() * 0.4), s, s * (0.9 + rnd() * 0.4));
      o.rotation.set(0, rnd() * 6.28, 0);
      o.updateMatrix();
      m.setMatrixAt(k, o.matrix);
      m.setColorAt(k, col.setHSL(0.15 + rnd() * 0.08, 0.15 + rnd() * 0.15, 0.5 + rnd() * 0.25));
      k++;
    }
    m.count = k;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, [n, area, avoid, seed]);
  return <primitive object={mesh} />;
};
