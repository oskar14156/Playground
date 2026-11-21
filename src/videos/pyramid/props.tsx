import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Cyl, RB } from "../../lib/three/diorama";
import { seeded } from "../../lib/timing";

/** One rough limestone block (default 1.5 × 1 × 1 m ≈ a car's weight), slightly irregular, with chisel marks. */
const blockTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    g.fillStyle = "#d8bd8e";
    g.fillRect(0, 0, S, S);
    const r = seeded(21);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(90,60,30,0.10)" : "rgba(255,245,220,0.10)";
      g.fillRect(r() * S, r() * S, 2 + r() * 7, 1 + r() * 4);
    }
    g.strokeStyle = "rgba(110,80,50,0.25)";
    for (let i = 0; i < 40; i++) {
      g.lineWidth = 1 + r() * 2;
      const x = r() * S;
      const y = r() * S;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 10 + r() * 16, y + (r() - 0.5) * 6);
      g.stroke();
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

export const StoneBlock: React.FC<{ p: V3; s?: V3; ry?: number; tone?: string; paint?: THREE.Texture }> = ({ p, s = [1.5, 1, 1], ry = 0, tone = "#ffffff", paint }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <RB p={[0, s[1] / 2, 0]} s={s} r={0.06} map={blockTex()} color={tone} rough={0.95} />
    {paint ? (
      <mesh position={[0, s[1] / 2, s[2] / 2 + 0.006]}>
        <planeGeometry args={[s[0] * 0.92, s[1] * 0.86]} />
        <meshStandardMaterial map={paint} transparent roughness={0.95} />
      </mesh>
    ) : null}
  </group>
);

/** Red-ochre crew graffiti on a block face: a cartouche with signs, like the work-gang marks found at Giza. */
export const graffitiTex = (seed: number) => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 340;
  const g = c.getContext("2d")!;
  const r = seeded(seed);
  g.strokeStyle = "rgba(170,40,25,0.9)";
  g.fillStyle = "rgba(170,40,25,0.9)";
  g.lineCap = "round";
  g.lineWidth = 9;
  // cartouche
  g.beginPath();
  g.ellipse(170, 170, 95, 140, 0, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(80, 318);
  g.lineTo(260, 318);
  g.stroke();
  // signs inside and beside it
  for (let i = 0; i < 4; i++) {
    const y = 70 + i * 62;
    g.beginPath();
    if (i % 2) g.arc(170, y, 18, 0, Math.PI * 2);
    else {
      g.moveTo(140, y);
      g.lineTo(200, y);
      g.moveTo(170, y - 18);
      g.lineTo(170, y + 18);
    }
    g.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const x = 300 + (i % 3) * 62;
    const y = 70 + Math.floor(i / 3) * 90;
    g.beginPath();
    const k = r();
    if (k < 0.3) g.ellipse(x, y, 20, 12, 0, 0, Math.PI * 2);
    else if (k < 0.6) {
      g.moveTo(x - 20, y + 20);
      g.lineTo(x, y - 22);
      g.lineTo(x + 20, y + 20);
    } else {
      g.moveTo(x - 22, y);
      g.quadraticCurveTo(x, y - 30, x + 22, y);
    }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** A wooden sledge: two curved runners, cross beams and lashing ropes; the block sits on top. */
export const Sledge: React.FC<{ p: V3; ry?: number; block?: boolean }> = ({ p, ry = 0, block = true }) => (
  <group position={p} rotation={[0, ry, 0]}>
    {[-0.55, 0.55].map((x) => (
      <group key={x}>
        <RB p={[x, 0.09, 0]} s={[0.16, 0.18, 2.3]} r={0.05} color="#8a6440" rough={0.9} />
        <RB p={[x, 0.16, -1.2]} s={[0.16, 0.16, 0.32]} rot={[0.6, 0, 0]} r={0.05} color="#8a6440" rough={0.9} />
      </group>
    ))}
    {[-0.8, -0.27, 0.27, 0.8].map((z) => (
      <RB key={z} p={[0, 0.23, z]} s={[1.45, 0.1, 0.16]} r={0.03} color="#9a7048" rough={0.9} />
    ))}
    {block ? <StoneBlock p={[0, 0.28, 0]} s={[1.2, 0.95, 1.7]} /> : null}
    {block
      ? [-0.45, 0.45].map((z) => (
          <mesh key={z} position={[0, 0.78, z]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.62, 0.025, 6, 20, Math.PI]} />
            <meshStandardMaterial color="#b89a64" roughness={1} />
          </mesh>
        ))
      : null}
  </group>
);

/** A clay water jar. */
export const Jar: React.FC<{ p: V3; rot?: V3; s?: number }> = ({ p, rot, s = 1 }) => {
  const geo = useMemo(() => {
    const pts = [0, 0.1, 0.17, 0.2, 0.19, 0.14, 0.08, 0.075, 0.09].map((r, i) => new THREE.Vector2(r, i * 0.06));
    return new THREE.LatheGeometry(pts, 20);
  }, []);
  return (
    <mesh geometry={geo} position={p} rotation={rot} scale={s} castShadow>
      <meshStandardMaterial color="#b0603a" roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** Bread from a bell-shaped mould (bedja) — the cone loaves found at the workers' town. */
export const Loaf: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => (
  <mesh position={p} rotation={[0, ry, 0]} castShadow>
    <coneGeometry args={[0.09, 0.24, 14]} />
    <meshStandardMaterial color="#c58a4a" roughness={0.85} />
  </mesh>
);

/** A Nile cargo boat with curved ends, mast, a square sail and steering oars; carries a block. */
export const CargoBoat: React.FC<{ p: V3; ry?: number; sail?: number; t?: number }> = ({ p, ry = 0, sail = 1, t = 0 }) => {
  const hull = useMemo(() => {
    const L = 16;
    const shape = new THREE.Shape();
    shape.moveTo(-L / 2, 1.8);
    shape.quadraticCurveTo(-L / 2 + 1.5, 0, -L / 2 + 4, 0);
    shape.lineTo(L / 2 - 4, 0);
    shape.quadraticCurveTo(L / 2 - 1.5, 0, L / 2, 2.2);
    shape.lineTo(L / 2 - 0.6, 2.2);
    shape.quadraticCurveTo(L / 2 - 2.2, 0.9, L / 2 - 4, 0.9);
    shape.lineTo(-L / 2 + 4, 0.9);
    shape.quadraticCurveTo(-L / 2 + 2.2, 0.9, -L / 2 + 0.6, 1.8);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 3.4, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.4, bevelSegments: 3, curveSegments: 16 });
    g.translate(0, 0, -1.7);
    g.rotateY(Math.PI / 2);
    return g;
  }, []);
  const bob = Math.sin(t * 1.1) * 0.08;
  return (
    <group position={[p[0], p[1] + bob, p[2]]} rotation={[Math.sin(t * 0.9) * 0.012, ry, 0]}>
      <mesh geometry={hull} castShadow receiveShadow>
        <meshStandardMaterial color="#8c6238" roughness={0.85} />
      </mesh>
      <RB p={[0, 0.95, 0]} s={[3.2, 0.12, 9]} r={0.03} color="#a8804e" />
      <StoneBlock p={[0, 1.0, 1.4]} s={[1.6, 1.1, 2.2]} />
      <Cyl p={[0, 5.2, -1.6]} r={0.12} h={9} color="#6a4a2a" />
      <RB p={[0, 8.8, -1.6]} s={[5.6, 0.12, 0.12]} r={0.04} color="#6a4a2a" />
      {sail > 0 ? (
        <mesh position={[0, 6.6, -1.5]}>
          <planeGeometry args={[5.4, 4.2 * sail, 6, 4]} />
          <meshStandardMaterial color="#efe2c4" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
      {[-1, 1].map((k) => (
        <RB key={k} p={[k * 1.6, 1.5, 7.2]} s={[0.12, 0.12, 4]} rot={[0.5, k * 0.25, 0]} r={0.04} color="#6a4a2a" />
      ))}
    </group>
  );
};

/** A black cat (Egypt's favourite animal) sitting up; `clap` 0–1 brings the front paws together. Origin on the ground. */
export const BlackCat: React.FC<{ p: V3; ry?: number; s?: number; clap?: number; t?: number }> = ({ p, ry = 0, s = 1, clap = 0, t = 0 }) => {
  const m = useMemo(
    () => ({
      fur: new THREE.MeshPhysicalMaterial({ color: "#1d1d22", roughness: 0.5, sheen: 1, sheenColor: new THREE.Color("#a2a2c0"), sheenRoughness: 0.35 }),
      muzzle: new THREE.MeshPhysicalMaterial({ color: "#2e2e35", roughness: 0.6, sheen: 1, sheenColor: new THREE.Color("#b0b0c8") }),
      eye: new THREE.MeshPhysicalMaterial({ color: "#d8e04a", emissive: "#a8b020", emissiveIntensity: 0.45, roughness: 0.05, clearcoat: 1 }),
      pink: new THREE.MeshStandardMaterial({ color: "#e48a9a", roughness: 0.6 }),
      white: new THREE.MeshBasicMaterial({ color: "#f2f2f2" }),
      black: new THREE.MeshBasicMaterial({ color: "#000000" }),
    }),
    [],
  );
  const smile = useMemo(() => {
    const g = new THREE.TorusGeometry(0.018, 0.004, 6, 12, Math.PI);
    g.rotateZ(Math.PI);
    return g;
  }, []);
  // a slow clap: paws meet ~1.5 times a second
  const ph = Math.max(0, Math.sin(t * Math.PI * 3)) * clap;
  const lid = 0.35 + 0.65 * (1 - 0.6 * ph); // smug half-closed eyes on every clap
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      {/* sitting body: haunches, belly, chest */}
      <mesh material={m.fur} position={[0, 0.15, -0.05]} scale={[0.135, 0.15, 0.16]} castShadow>
        <sphereGeometry args={[1, 28, 20]} />
      </mesh>
      <mesh material={m.fur} position={[0, 0.3, 0.0]} scale={[0.09, 0.13, 0.085]} rotation={[0.25, 0, 0]} castShadow>
        <sphereGeometry args={[1, 24, 18]} />
      </mesh>
      {/* head */}
      <group position={[0, 0.47, 0.05]} rotation={[0.12 * ph, 0, 0.06 * Math.sin(t * 1.3)]}>
        <mesh material={m.fur} scale={[0.1, 0.085, 0.088]} castShadow>
          <sphereGeometry args={[1, 28, 20]} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={k} material={m.fur} position={[0.06 * k, -0.025, 0.025]} scale={[0.05, 0.04, 0.05]}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
        ))}
        {/* ears with pink insides */}
        {[-1, 1].map((k) => (
          <group key={k} position={[0.06 * k, 0.075, -0.005]} rotation={[-0.15, 0, -k * 0.38]}>
            <mesh material={m.fur} castShadow>
              <coneGeometry args={[0.04, 0.085, 3]} />
            </mesh>
            <mesh material={m.pink} position={[0, -0.006, 0.014]} scale={[0.6, 0.72, 0.4]}>
              <coneGeometry args={[0.04, 0.085, 3]} />
            </mesh>
          </group>
        ))}
        {/* eyes: almond, slit pupils, a highlight */}
        {[-1, 1].map((k) => (
          <group key={k} position={[0.038 * k, 0.012, 0.078]} rotation={[0, k * 0.35, k * -0.12]}>
            <mesh material={m.eye} scale={[0.024, 0.02 * lid, 0.012]}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
            <mesh material={m.black} position={[0, 0, 0.011]} scale={[0.006, 0.018 * lid, 0.004]}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
            <mesh material={m.white} position={[0.008, 0.007 * lid, 0.012]} scale={0.0045}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
        ))}
        {/* muzzle, pink nose, smug mouth, whiskers */}
        <mesh material={m.muzzle} position={[0, -0.03, 0.074]} scale={[0.04, 0.026, 0.025]}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh material={m.pink} position={[0, -0.014, 0.098]} rotation={[Math.PI / 2 + 0.3, 0, Math.PI]} scale={[1, 0.6, 1]}>
          <coneGeometry args={[0.011, 0.012, 3]} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={k} geometry={smile} material={m.white} position={[0.017 * k, -0.036, 0.097]} />
        ))}
        {[-1, 1].map((k) =>
          [-0.18, 0, 0.18].map((a, j) => (
            <mesh key={`${k}${j}`} material={m.white} position={[0.075 * k, -0.03 + a * 0.04, 0.075]} rotation={[0, 0, Math.PI / 2 + k * a]}>
              <cylinderGeometry args={[0.0012, 0.0006, 0.1, 4]} />
            </mesh>
          )),
        )}
      </group>
      {/* front legs raised, clapping in front of the chest; pink pads face each other */}
      {[-1, 1].map((k) => (
        <group key={k} position={[0.06 * k, 0.32, 0.07]} rotation={[-1.15, 0, k * (0.55 - 0.5 * ph)]}>
          <mesh material={m.fur} position={[0, 0.065, 0]} castShadow>
            <capsuleGeometry args={[0.024, 0.1, 6, 12]} />
          </mesh>
          <mesh material={m.fur} position={[0, 0.14, 0.004]} scale={[0.03, 0.026, 0.03]}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh material={m.pink} position={[-k * 0.022, 0.142, 0.006]} scale={[0.006, 0.014, 0.014]}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        </group>
      ))}
      {/* hind paws in front, tail curled around them */}
      {[-1, 1].map((k) => (
        <mesh key={k} material={m.fur} position={[0.08 * k, 0.025, 0.09]} scale={[0.04, 0.025, 0.06]} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ))}
      <mesh material={m.fur} position={[0, 0.02, 0.0]} rotation={[Math.PI / 2, 0, -0.3 + 0.15 * Math.sin(t * 2)]} castShadow>
        <torusGeometry args={[0.15, 0.02, 8, 24, Math.PI * 1.15]} />
      </mesh>
    </group>
  );
};

/** A metal flying saucer with a glowing rim; `beam` 0–1 shines a cone of light down. */
export const Saucer: React.FC<{ p: V3; t: number; s?: number; beam?: number; tilt?: number }> = ({ p, t, s = 1, beam = 0, tilt = 0 }) => {
  const body = useMemo(() => {
    const pts = [
      [0, -0.9],
      [3.2, -0.6],
      [7.5, -0.1],
      [8, 0],
      [7.5, 0.25],
      [3.6, 0.8],
      [2.2, 1.6],
      [0, 1.9],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 48);
  }, []);
  return (
    <group position={p} scale={s} rotation={[tilt, t * 0.8, 0]}>
      <mesh geometry={body} castShadow>
        <meshStandardMaterial color="#b8c2cc" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[2.1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#7af0ff" emissive="#3ad0ff" emissiveIntensity={0.5} roughness={0.05} transmission={0.4} transparent opacity={0.8} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const on = 0.5 + 0.5 * Math.sin(t * 4 - i * 0.8);
        return <Glow key={i} position={[Math.cos(a) * 7.7, 0.05, Math.sin(a) * 7.7]} size={1.6 + on} color="#7dff8a" opacity={0.5 + 0.5 * on} />;
      })}
      {beam > 0.01 ? (
        <mesh position={[0, -11, 0]}>
          <coneGeometry args={[7, 22, 32, 1, true]} />
          <meshBasicMaterial color="#9dffb0" transparent opacity={0.18 * beam} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ) : null}
    </group>
  );
};

/** A wooden road sign on a post with two painted text lines. */
export const SignPost: React.FC<{ p: V3; ry?: number; lines: [string, string]; s?: number; left?: boolean }> = ({ p, ry = 0, lines, s = 1, left = false }) => {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 360;
    const g = c.getContext("2d")!;
    g.fillStyle = "#e9d6a8";
    g.fillRect(0, 0, 1024, 360);
    const r = seeded(3);
    for (let i = 0; i < 60; i++) {
      g.strokeStyle = `rgba(120,80,40,${0.08 + r() * 0.1})`;
      g.lineWidth = 2;
      g.beginPath();
      const y = r() * 360;
      g.moveTo(0, y);
      g.lineTo(1024, y + (r() - 0.5) * 10);
      g.stroke();
    }
    g.fillStyle = "#2a1a10";
    g.font = "900 140px Arial Black, Arial, sans-serif";
    g.textAlign = "center";
    g.fillText(lines[0], 512, 165);
    g.font = "700 80px Arial, sans-serif";
    g.fillText(lines[1], 512, 290);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [lines]);
  return (
    <group position={p} rotation={[0, ry, 0]} scale={s}>
      <RB p={[0, 1.3, 0]} s={[0.14, 2.6, 0.14]} r={0.03} color="#6a4a2a" />
      <group position={[0, 2.35, 0.09]}>
        <RB p={[0, 0, -0.03]} s={[2.5, 0.9, 0.06]} r={0.02} color="#c9a46a" />
        <mesh position={[0, 0, 0.006]}>
          <planeGeometry args={[2.4, 0.82]} />
          <meshStandardMaterial map={tex} roughness={0.9} />
        </mesh>
        {/* arrow tip */}
        <mesh position={[left ? -1.4 : 1.4, 0, -0.03]} rotation={[0, 0, left ? Math.PI / 2 : -Math.PI / 2]}>
          <coneGeometry args={[0.45, 0.4, 3]} />
          <meshStandardMaterial color="#c9a46a" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
};

/** A far-off Cairo skyline: domes and minarets in pale stone. */
export const Skyline: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => {
  const items = useMemo(() => {
    const r = seeded(8);
    return Array.from({ length: 26 }, (_, i) => ({ x: (i - 13) * 34 + (r() - 0.5) * 20, z: (r() - 0.5) * 60, kind: r(), h: 20 + r() * 30, w: 18 + r() * 16 }));
  }, []);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      {items.map((it, i) => (
        <group key={i} position={[it.x, 0, it.z]}>
          <RB p={[0, it.h / 2, 0]} s={[it.w, it.h, it.w * 0.8]} r={0.5} color="#e2d2b0" rough={0.9} />
          {it.kind < 0.45 ? (
            <mesh position={[0, it.h, 0]} castShadow>
              <sphereGeometry args={[it.w * 0.38, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#efe6d2" roughness={0.6} />
            </mesh>
          ) : null}
          {it.kind > 0.7 ? (
            <group position={[it.w * 0.45, 0, 0]}>
              <Cyl p={[0, it.h + 18, 0]} r={1.8} r2={1.2} h={it.h + 36} color="#ece2cc" />
              <mesh position={[0, it.h * 2 + 38, 0]}>
                <coneGeometry args={[1.6, 5, 10]} />
                <meshStandardMaterial color="#d8c9a8" />
              </mesh>
            </group>
          ) : null}
        </group>
      ))}
    </group>
  );
};

/** A muon detector box (the ScanPyramids emulsion plates sit in the Queen's Chamber). */
export const Detector: React.FC<{ p: V3; on: number }> = ({ p, on }) => (
  <group position={p}>
    <RB p={[0, 0.5, 0]} s={[1.6, 1, 1]} r={0.05} color="#2a3240" metal={0.6} rough={0.4} />
    <Glow position={[0, 1.1, 0.4]} size={2.2 * on} color="#7af0ff" opacity={on} />
  </group>
);
