import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "../../lib/three/core";
import { Cyl, RB, tex } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";

/**
 * Live American lobster (~0.3 m body at s = 1, claws extra). Live lobsters are dark olive/blue-brown — they only
 * turn red when cooked — with rubber bands on the claws, as in restaurant tanks. Origin on the floor, head = +Z.
 * `t` seconds drives antennae, legs and a slow claw wave; `hat` puts a chef's toque on it ("let him cook").
 */
/** mottled live-lobster shell: dark olive-blue with brown-orange speckles */
const shellTex = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#2c3a2c";
    g.fillRect(0, 0, 256, 256);
    let r = 7;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = ["#1d2a33", "#3d4a2a", "#5a3a22", "#7a4a26", "#22303a"][i % 5];
      g.beginPath();
      g.arc(rnd() * 256, rnd() * 256, 1 + rnd() * 4, 0, Math.PI * 2);
      g.fill();
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };
})();

export const Lobster: React.FC<{ p?: V3; ry?: number; s?: number; t?: number; hat?: number; look?: number }> = ({ p = [0, 0, 0], ry = 0, s = 1, t = 0, hat = 0, look = 0 }) => {
  const m = useMemo(
    () => ({
      shell: new THREE.MeshPhysicalMaterial({ map: shellTex(), color: "#ffffff", roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.3 }),
      under: new THREE.MeshPhysicalMaterial({ color: "#c76b2a", roughness: 0.4, clearcoat: 0.6 }),
      band: new THREE.MeshStandardMaterial({ color: "#2f6bd8", roughness: 0.6 }),
      eye: new THREE.MeshPhysicalMaterial({ color: "#0a0a0a", roughness: 0.1, clearcoat: 1 }),
      white: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 }),
    }),
    [],
  );
  const segs = 6;
  const wave = Math.sin(t * 1.7) * 0.15;
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      <group position={[0, 0.045, 0]}>
        {/* carapace */}
        <mesh material={m.shell} position={[0, 0.01, 0.06]} scale={[0.045, 0.04, 0.085]} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        {/* rostrum */}
        <mesh material={m.shell} position={[0, 0.02, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.012, 0.05, 8]} />
        </mesh>
        {/* tail: overlapping segments curling slightly down + fan */}
        {Array.from({ length: segs }, (_, i) => (
          <mesh key={i} material={m.shell} position={[0, 0.004 - 0.005 * i, -0.035 - i * 0.02]} rotation={[0.1 * i - 0.25, 0, 0]} scale={[0.037 - i * 0.0025, 0.016, 0.019]} castShadow>
            <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
        ))}
        {[-1, 0, 1].map((k) => (
          <mesh key={k} material={m.shell} position={[k * 0.018, -0.025, -0.205]} rotation={[0.5, k * 0.5, 0]} scale={[0.014, 0.004, 0.026]}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        ))}
        {/* eyes on stalks */}
        {[-1, 1].map((k) => (
          <group key={k} position={[0.014 * k, 0.04, 0.13]} rotation={[0, look * 0.5, 0]}>
            <mesh material={m.shell} position={[0, 0.004, 0]} rotation={[0.3, 0, k * 0.3]}>
              <cylinderGeometry args={[0.003, 0.004, 0.014, 6]} />
            </mesh>
            <mesh material={m.eye} position={[0.003 * k, 0.012, 0.003]}>
              <sphereGeometry args={[0.0065, 10, 8]} />
            </mesh>
          </group>
        ))}
        {/* long antennae */}
        {[-1, 1].map((k) => (
          <mesh key={k} material={m.under} position={[0.04 * k, 0.05, 0.3]} rotation={[-1.35 + Math.sin(t * 2 + k) * 0.08, 0, k * (0.4 + Math.sin(t * 1.3 + k) * 0.06)]}>
            <cylinderGeometry args={[0.0012, 0.003, 0.32, 5]} />
          </mesh>
        ))}
        {/* walking legs */}
        {[-1, 1].map((k) =>
          [0, 1, 2, 3].map((i) => (
            <mesh key={`${k}${i}`} material={m.under} position={[0.05 * k, -0.025, 0.09 - i * 0.03]} rotation={[0, 0, k * (1.1 + 0.08 * Math.sin(t * 6 + i))]}>
              <cylinderGeometry args={[0.003, 0.002, 0.07, 5]} />
            </mesh>
          )),
        )}
        {/* the two big claws with blue rubber bands */}
        {[-1, 1].map((k) => (
          <group key={k} position={[0.035 * k, 0.0, 0.13]} rotation={[0.1 + (k > 0 ? wave : -wave), k * 0.55, 0]}>
            <mesh material={m.shell} position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.009, 0.011, 0.08, 10]} />
            </mesh>
            <group position={[0, 0, 0.1]}>
              <mesh material={m.shell} scale={[0.04 - (k > 0 ? 0.006 : 0), 0.022, 0.07]} castShadow>
                <sphereGeometry args={[1, 18, 12]} />
              </mesh>
              <mesh material={m.shell} position={[0.01 * k, 0, 0.075]} scale={[0.016, 0.012, 0.04]}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
              <mesh material={m.band} position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 0.7, 1]}>
                <torusGeometry args={[0.02, 0.004, 6, 16]} />
              </mesh>
            </group>
          </group>
        ))}
        {/* chef's toque */}
        {hat > 0.01 ? (
          <group position={[0, 0.045, 0.08]} scale={hat}>
            <mesh material={m.white} position={[0, 0.01, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.02, 20]} />
            </mesh>
            <mesh material={m.white} position={[0, 0.045, 0]} scale={[1, 0.85, 1]}>
              <sphereGeometry args={[0.04, 18, 12]} />
            </mesh>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} material={m.white} position={[Math.cos(i * 1.256) * 0.025, 0.06, Math.sin(i * 1.256) * 0.025]}>
                <sphereGeometry args={[0.022, 12, 8]} />
              </mesh>
            ))}
          </group>
        ) : null}
      </group>
    </group>
  );
};

/** Firefighter helmet for the Head bone (classic US shape: tall crown, long back brim, front shield). */
export const FireHelmet: React.FC<{ color?: string }> = ({ color = "#d8b21a" }) => (
  <group position={[0, 0.12, 0.01]}>
    <mesh scale={[0.13, 0.11, 0.15]} castShadow>
      <sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={1} />
    </mesh>
    <mesh position={[0, -0.005, -0.03]} scale={[0.19, 0.012, 0.23]}>
      <cylinderGeometry args={[1, 1, 1, 28]} />
      <meshPhysicalMaterial color={color} roughness={0.3} clearcoat={1} />
    </mesh>
    <mesh position={[0, 0.06, 0.135]} rotation={[-0.25, 0, 0]}>
      <boxGeometry args={[0.08, 0.09, 0.008]} />
      <meshStandardMaterial color="#ffffff" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.06, 0.14]} rotation={[-0.25, 0, 0]}>
      <boxGeometry args={[0.05, 0.05, 0.004]} />
      <meshStandardMaterial color="#c0202a" roughness={0.5} />
    </mesh>
  </group>
);

/** A $1 bill (real proportions 156 × 66 mm). */
export const Bill: React.FC<{ p?: V3; rot?: V3; s?: number }> = ({ p = [0, 0, 0], rot = [0, 0, 0], s = 1 }) => {
  const map = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 312;
    c.height = 132;
    const g = c.getContext("2d")!;
    g.fillStyle = "#d9e2c9";
    g.fillRect(0, 0, 312, 132);
    g.strokeStyle = "#3f5a3a";
    g.lineWidth = 6;
    g.strokeRect(6, 6, 300, 120);
    g.fillStyle = "#3f5a3a";
    g.beginPath();
    g.ellipse(156, 66, 34, 42, 0, 0, Math.PI * 2);
    g.fill();
    g.font = "900 46px Arial Black";
    g.fillText("1", 22, 52);
    g.fillText("1", 266, 118);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh position={p} rotation={rot} scale={s}>
      <planeGeometry args={[0.156, 0.066]} />
      <meshStandardMaterial map={map} roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** Open, empty leather wallet. */
export const Wallet: React.FC<{ p?: V3; ry?: number; s?: number; open?: number }> = ({ p = [0, 0, 0], ry = 0, s = 1, open = 1 }) => (
  <group position={p} rotation={[0, ry, 0]} scale={s}>
    <RB p={[-0.05, 0.004, 0]} s={[0.1, 0.008, 0.09]} r={0.004} color="#5a3a24" rough={0.7} />
    <group position={[0, 0.006, 0]} rotation={[0, 0, -2.6 * open]}>
      <RB p={[0.05, 0, 0]} s={[0.1, 0.008, 0.09]} r={0.004} color="#6a4429" rough={0.7} />
    </group>
  </group>
);

/** Your friend's garage: concrete floor, brick walls, a roll-up door, shelves, a workbench and a bare bulb. */
export const Garage: React.FC<{ bulb?: number }> = ({ bulb = 1 }) => {
  const conc = usePbr("concrete_floor_02", [3, 3]);
  const brick = usePbr("red_brick_03", [3, 1.5]);
  const shelf = useMemo(() => tex("planks", "#8a6a48", [1, 1], 7), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial {...conc} color="#b8b2a8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.4, -3]} receiveShadow>
        <planeGeometry args={[7, 2.8]} />
        <meshStandardMaterial {...brick} color="#c9a090" roughness={0.9} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 3.5, 1.4, 0.5]} rotation={[0, (-k * Math.PI) / 2, 0]} receiveShadow>
          <planeGeometry args={[7, 2.8]} />
          <meshStandardMaterial {...brick} color="#c9a090" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 2.8, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color="#6a6560" roughness={1} />
      </mesh>
      {/* roll-up door behind the camera side wall (left) */}
      {Array.from({ length: 10 }, (_, i) => (
        <RB key={i} p={[-3.46, 0.14 + i * 0.24, 0.5]} s={[0.04, 0.22, 2.6]} r={0.01} color="#d9dde0" metal={0.5} rough={0.4} />
      ))}
      {/* metal shelves with boxes and paint tins on the back wall */}
      <group position={[2.3, 0, -2.7]}>
        {[-0.55, 0.55].map((x) => (
          <RB key={x} p={[x, 0.9, 0]} s={[0.04, 1.8, 0.04]} r={0.005} color="#5a6068" metal={0.8} />
        ))}
        {[0.3, 0.9, 1.5].map((y, i) => (
          <group key={y}>
            <RB p={[0, y, 0]} s={[1.14, 0.03, 0.42]} r={0.005} color="#8a8f96" metal={0.6} map={shelf} />
            <RB p={[-0.3, y + 0.14, 0]} s={[0.36, 0.26, 0.3]} r={0.01} color={["#b8925c", "#a6824e", "#c4a06a"][i]} rough={0.9} />
            <Cyl p={[0.2, y + 0.08, 0.02]} r={0.07} h={0.14} color={["#d23a2a", "#2a6ad2", "#e8e8e8"][i]} metal={0.4} rough={0.4} />
            <Cyl p={[0.38, y + 0.08, -0.04]} r={0.06} h={0.14} color="#9aa0a6" metal={0.7} rough={0.35} />
          </group>
        ))}
      </group>
      {/* workbench with a vice */}
      <group position={[-1.6, 0, -2.6]}>
        <RB p={[0, 0.88, 0]} s={[1.6, 0.06, 0.6]} r={0.01} color="#9a7a52" map={shelf} />
        {[-0.72, 0.72].map((x) => [-0.24, 0.24].map((z) => <RB key={`${x}${z}`} p={[x, 0.43, z]} s={[0.06, 0.86, 0.06]} r={0.01} color="#6a5038" />))}
        <RB p={[0.5, 0.97, 0.1]} s={[0.16, 0.12, 0.1]} r={0.01} color="#2a5a9a" metal={0.6} />
        {/* pegboard */}
        <RB p={[0, 1.55, -0.28]} s={[1.5, 0.8, 0.02]} r={0.005} color="#c8a878" rough={0.9} />
        {[-0.5, -0.2, 0.15, 0.45].map((x, i) => (
          <RB key={x} p={[x, 1.55 + (i % 2) * 0.1, -0.25]} s={[0.04, 0.3, 0.02]} r={0.008} color={["#c0202a", "#333", "#2a5a9a", "#e8a21a"][i]} metal={0.4} />
        ))}
      </group>
      {/* bare bulb on a cord */}
      <mesh position={[0.4, 2.55, -0.6]}>
        <cylinderGeometry args={[0.004, 0.004, 0.5, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.4, 2.28, -0.6]}>
        <sphereGeometry args={[0.05, 16, 12]} />
        <meshStandardMaterial color="#fff6dc" emissive="#ffd890" emissiveIntensity={3 * bulb} />
      </mesh>
      <pointLight position={[0.4, 2.2, -0.6]} color="#ffd890" intensity={3.5 * bulb} distance={8} decay={2} castShadow />
    </group>
  );
};
