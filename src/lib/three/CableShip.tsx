import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "./core";
import { RB } from "./diorama";

/**
 * Cable ship (~100 m), bow towards +X, origin on the waterline at mid-ship.
 * Real cable layers/repair ships have big sheave wheels overhanging the bow (the cable runs over them),
 * the bridge forward, round cable tanks amidships and an A-frame at the stern.
 * `name` is painted on both sides. `lights` 0–1 switches the deck floodlights (night work).
 * The cable leaves over the bow sheave at CS_BOW (world offset from the origin).
 */
export const CS = { L: 100, beam: 18, deck: 7, keel: -6 } as const;
export const CS_BOW: V3 = [CS.L / 2 + 5.2, CS.deck + 4.6, 0];

const hullGeometry = () => {
  const n = 64;
  const m = 20;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const white = new THREE.Color("#eef0f0");
  const stripe = new THREE.Color("#e8602c");
  const red = new THREE.Color("#8e2a26");
  const boot = new THREE.Color("#1b1d22");
  for (let i = 0; i <= n; i++) {
    const u = i / n; // 0 = stern, 1 = bow
    const x = -CS.L / 2 + u * CS.L;
    const w = (CS.beam / 2) * (u < 0.62 ? 1 - 0.12 * Math.pow(Math.max(0, 0.12 - u) / 0.12, 2) : Math.pow(Math.max(0, 1 - Math.pow((u - 0.62) / 0.38, 2)), 0.55));
    const sheer = CS.deck + 2.2 * Math.pow(Math.max(0, u - 0.55), 2) * 4;
    const keel = CS.keel * (u < 0.9 ? 1 : 1 - ((u - 0.9) / 0.1) * 0.5);
    for (let j = 0; j <= m; j++) {
      const th = (j / m) * Math.PI;
      const s = Math.sin(th);
      const y = sheer + (keel - sheer) * Math.pow(s, 0.55);
      const z = w * Math.cos(th) * (1 - 0.12 * Math.pow(s, 6));
      pos.push(x, y, z);
      const c = y < -0.4 ? red : y < 0.4 ? boot : y > sheer - 1.6 && y < sheer - 0.9 ? stripe : white;
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const a = i * (m + 1) + j;
      const b = a + m + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  const base = pos.length / 3;
  pos.push(-CS.L / 2, (CS.deck + CS.keel) / 2, 0);
  col.push(white.r, white.g, white.b);
  for (let j = 0; j < m; j++) idx.push(base, j + 1, j);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

/** deck outline at the sheer line, for the deck plate */
const deckShape = () => {
  const s = new THREE.Shape();
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const w = (CS.beam / 2) * (u < 0.62 ? 1 : Math.pow(Math.max(0, 1 - Math.pow((u - 0.62) / 0.38, 2)), 0.55));
    pts.push([-CS.L / 2 + u * CS.L, w - 0.25]);
  }
  s.moveTo(pts[0][0], -pts[0][1]);
  pts.forEach(([x, w]) => s.lineTo(x, w));
  pts.slice().reverse().forEach(([x, w]) => s.lineTo(x, -w));
  return s;
};

const windowsTex = (rows: number, cols: number, lit: boolean) => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#eef0f0";
  g.fillRect(0, 0, 512, 128);
  for (let r = 0; r < rows; r++)
    for (let k = 0; k < cols; k++) {
      g.fillStyle = lit && (r * 7 + k * 3) % 5 !== 0 ? "#ffd99a" : "#26323f";
      g.fillRect(12 + k * (488 / cols), 16 + r * (110 / rows), 488 / cols - 12, 110 / rows - 30);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const nameTex = (name: string) => {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.font = "900 92px Arial, sans-serif";
  g.fillStyle = "#13305a";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(name, 512, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const Sheave: React.FC<{ p: V3; r?: number }> = ({ p, r = 2.6 }) => (
  <group position={p}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
      <torusGeometry args={[r, 0.35, 12, 40]} />
      <meshStandardMaterial color="#e8602c" metalness={0.3} roughness={0.45} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[r * 0.82, r * 0.82, 0.25, 32]} />
      <meshStandardMaterial color="#3a3f47" metalness={0.6} roughness={0.5} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.45, 0.45, 1.6, 16]} />
      <meshStandardMaterial color="#8a9098" metalness={0.8} roughness={0.3} />
    </mesh>
  </group>
);

export const CableShip: React.FC<{ p?: V3; ry?: number; rock?: number; name?: string; lights?: number }> = ({ p = [0, 0, 0], ry = 0, rock = 0, name = "POCKET PUH CABLE", lights = 0 }) => {
  const hull = useMemo(hullGeometry, []);
  const deck = useMemo(() => {
    const g = new THREE.ShapeGeometry(deckShape(), 1);
    g.rotateX(Math.PI / 2);
    return g;
  }, []);
  const lit = lights > 0.5;
  const win = useMemo(() => windowsTex(3, 9, lit), [lit]);
  const bridgeWin = useMemo(() => windowsTex(1, 7, lit), [lit]);
  const label = useMemo(() => nameTex(name), [name]);
  const D = CS.deck;
  return (
    <group position={p} rotation={[rock * 0.3, ry, rock]}>
      <mesh geometry={hull} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.55} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={deck} position={[0, D - 0.02, 0]} receiveShadow>
        <meshStandardMaterial color="#5a6a5a" roughness={0.85} />
      </mesh>
      {/* name on both sides */}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[8, D - 2.6, k * (CS.beam / 2 + 0.05)]} rotation={[0, k > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[34, 4.2]} />
          <meshBasicMaterial map={label} transparent toneMapped={false} />
        </mesh>
      ))}
      {/* superstructure forward of midships: 3 decks + bridge */}
      <RB p={[16, D + 4.5, 0]} s={[18, 9, 15]} r={0.6} color="#eef0f0" />
      {[-1, 1].map((k) => (
        <mesh key={k} position={[16, D + 4.6, k * 7.53]} rotation={[0, k > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[17, 8]} />
          <meshStandardMaterial map={win} roughness={0.5} emissive={lit ? "#ffcc88" : "#000"} emissiveMap={win} emissiveIntensity={lit ? 0.7 : 0} />
        </mesh>
      ))}
      <RB p={[19, D + 11, 0]} s={[10, 4, 19]} r={0.4} color="#f3f4f4" />
      <mesh position={[24.03, D + 11.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[17, 2.6]} />
        <meshStandardMaterial map={bridgeWin} roughness={0.3} emissive={lit ? "#ffcc88" : "#000"} emissiveMap={bridgeWin} emissiveIntensity={lit ? 0.8 : 0} />
      </mesh>
      {/* mast with radar and lights */}
      <mesh position={[18, D + 18, 0]}>
        <cylinderGeometry args={[0.35, 0.5, 10, 10]} />
        <meshStandardMaterial color="#f0f0ee" roughness={0.5} />
      </mesh>
      <mesh position={[18, D + 19.5, 0]} rotation={[0, 0.6, 0]}>
        <boxGeometry args={[0.5, 0.4, 6]} />
        <meshStandardMaterial color="#2a2f36" roughness={0.5} />
      </mesh>
      {/* funnel */}
      <RB p={[4, D + 10, 0]} s={[6, 8, 5]} r={0.8} color="#e8602c" />
      <mesh position={[4, D + 14.2, 0]}>
        <boxGeometry args={[5.4, 0.6, 4.4]} />
        <meshStandardMaterial color="#1b1d22" roughness={0.6} />
      </mesh>
      {/* round cable tanks amidships */}
      {[-8, -22].map((x) => (
        <group key={x} position={[x, D, 0]}>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[5.5, 5.5, 1.2, 40]} />
            <meshStandardMaterial color="#c8cdd2" roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.22, 0]}>
            <cylinderGeometry args={[4.6, 4.6, 0.05, 40]} />
            <meshStandardMaterial color="#1c1f24" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.2, 4.4, 40, 6]} />
            <meshStandardMaterial color="#e2b52c" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* stern A-frame */}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[-CS.L / 2 + 2, D + 6, k * 6]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[1, 12, 1]} />
          <meshStandardMaterial color="#e8602c" roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[-CS.L / 2 + 0.9, D + 11.9, 0]}>
        <boxGeometry args={[1, 1, 13]} />
        <meshStandardMaterial color="#e8602c" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* bow sheaves on an overhanging frame */}
      <RB p={[CS.L / 2 - 2.5, D + 2.4, 0]} s={[9, 2.2, 6.4]} r={0.3} color="#3a3f47" />
      <RB p={[CS.L / 2 + 2.2, D + 2.0, 0]} s={[3.4, 1.4, 5.6]} r={0.3} color="#3a3f47" />
      {[-1.8, 1.8].map((z) => (
        <Sheave key={z} p={[CS.L / 2 + 2.6, D + 4.6, z]} />
      ))}
      {/* railings */}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[-6, D + 0.6, k * (CS.beam / 2 - 0.3)]}>
          <boxGeometry args={[CS.L * 0.8, 0.08, 0.08]} />
          <meshStandardMaterial color="#e0e3e6" roughness={0.5} />
        </mesh>
      ))}
      {/* deck floodlights for night work */}
      {lights > 0
        ? [[CS.L / 2 - 4, D + 9, 0], [-14, D + 6, 0], [16, D + 13.5, 6], [16, D + 13.5, -6]].map((q, i) => (
            <group key={i}>
              <Glow position={q as V3} size={3.2} color="#fff1c8" opacity={0.9 * lights} />
              <pointLight position={q as V3} intensity={60 * lights} distance={40} color="#ffe2b0" />
            </group>
          ))
        : null}
      {lights > 0 ? (
        <>
          <Glow position={[24.5, D + 13, CS.beam / 2]} size={1.4} color="#3dff6a" opacity={lights} />
          <Glow position={[24.5, D + 13, -CS.beam / 2]} size={1.4} color="#ff3b30" opacity={lights} />
          <Glow position={[18, D + 23.3, 0]} size={1.6} color="#ffffff" opacity={lights} />
        </>
      ) : null}
    </group>
  );
};
