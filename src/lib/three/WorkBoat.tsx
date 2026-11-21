import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "./core";
import { RB, tex } from "./diorama";

/**
 * Small research/work boat, ~9 m long, bow at +X, origin on the waterline at mid-ship.
 * Deck at y = DECK, A-frame crane over the stern: things hang from CRANE_TIP.
 * `name` is painted on the bow. `rock` (radians) tilts it on the swell.
 */
export const WB = { L: 9, beam: 3.0, deck: 0.75, keel: -0.95 } as const;
export const CRANE_TIP: V3 = [-WB.L / 2 - 1.5, 3.6, 0];

const hullGeometry = () => {
  const n = 48;
  const m = 18;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const white = new THREE.Color("#f3f1ec");
  const stripe = new THREE.Color("#1d4f8f");
  const red = new THREE.Color("#a3302a");
  for (let i = 0; i <= n; i++) {
    const u = i / n; // 0 = stern (transom), 1 = bow
    const x = -WB.L / 2 + u * WB.L;
    // full beam aft, fine entry forward
    const w = (WB.beam / 2) * (u < 0.55 ? 1 : Math.pow(Math.max(0, 1 - Math.pow((u - 0.55) / 0.45, 2)), 0.6));
    const sheer = WB.deck + 0.35 * Math.pow(Math.max(0, u - 0.4), 2); // bow rises
    const keel = WB.keel * (u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15 * 0.6);
    for (let j = 0; j <= m; j++) {
      const th = (j / m) * Math.PI; // 0 = starboard rail, π = port rail
      const s = Math.sin(th);
      const y = sheer + (keel - sheer) * Math.pow(s, 0.7);
      const z = w * Math.cos(th) * (1 - 0.18 * Math.pow(s, 4));
      pos.push(x, y, z);
      const c = y < 0.02 ? red : y > sheer - 0.28 && y < sheer - 0.12 ? stripe : white;
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const a = i * (m + 1) + j;
      const b = a + m + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  // transom (flat stern)
  const base = pos.length / 3;
  pos.push(-WB.L / 2, (WB.deck + WB.keel) / 2, 0);
  col.push(white.r, white.g, white.b);
  for (let j = 0; j < m; j++) idx.push(base, j + 1, j);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

const nameTex = (name: string) => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const g = c.getContext("2d")!;
  g.font = "bold 64px Arial, sans-serif";
  g.fillStyle = "#1d4f8f";
  g.textBaseline = "middle";
  g.fillText(name, 10, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const WorkBoat: React.FC<{ p?: V3; rock?: number; name?: string; winch?: number }> = ({ p = [0, 0, 0], rock = 0, name = "POCKET PUH", winch = 0 }) => {
  const hull = useMemo(hullGeometry, []);
  const deckTex = useMemo(() => tex("planks", "#b08a5c", [6, 2], 7), []);
  const label = useMemo(() => nameTex(name), [name]);
  const rail = (a: V3, b: V3, r = 0.025, color = "#d9dde2") => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    const d = vb.clone().sub(va);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    return (
      <mesh position={mid.toArray()} quaternion={q} key={`${a}${b}`}>
        <cylinderGeometry args={[r, r, d.length(), 8]} />
        <meshStandardMaterial color={color} metalness={color === "#d9dde2" ? 0.8 : 0.3} roughness={color === "#d9dde2" ? 0.25 : 0.45} />
      </mesh>
    );
  };
  const D = WB.deck;
  const halfW = WB.beam / 2 - 0.12;
  return (
    <group position={p} rotation={[rock, 0, rock * 0.4]}>
      <mesh geometry={hull} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.45} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      {/* deck */}
      <mesh position={[-0.6, D - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WB.L * 0.82, WB.beam * 0.94]} />
        <meshStandardMaterial map={deckTex} roughness={0.85} />
      </mesh>
      {/* name on both bows */}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[WB.L * 0.3, D - 0.3, k * (WB.beam / 2 - 0.02)]} rotation={[0, k > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[2.0, 0.38]} />
          <meshBasicMaterial map={label} transparent toneMapped={false} />
        </mesh>
      ))}
      {/* wheelhouse */}
      <RB p={[1.3, D + 1.0, 0]} s={[2.4, 2.0, 2.2]} r={0.08} color="#f4f2ee" rough={0.5} />
      <RB p={[1.35, D + 2.07, 0]} s={[2.7, 0.14, 2.45]} r={0.05} color="#d8d5cf" rough={0.6} />
      {/* window band */}
      {[-1, 1].map((k) => (
        <RB key={k} p={[1.3, D + 1.45, k * 1.105]} s={[2.0, 0.6, 0.02]} r={0.01} color="#1c2a36" rough={0.08} metal={0.2} />
      ))}
      <RB p={[2.505, D + 1.45, 0]} s={[0.02, 0.6, 1.8]} r={0.01} color="#1c2a36" rough={0.08} metal={0.2} />
      <RB p={[0.6, D + 0.75, 1.11]} s={[0.7, 1.4, 0.03]} r={0.02} color="#e2ded6" rough={0.6} />
      {/* life ring on the wheelhouse wall */}
      <mesh position={[1.9, D + 0.75, 1.13]}>
        <torusGeometry args={[0.24, 0.07, 12, 32]} />
        <meshStandardMaterial color="#ff5a1f" roughness={0.6} />
      </mesh>
      {/* mast, radar, lights */}
      <mesh position={[1.0, D + 2.9, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.6, 10]} />
        <meshStandardMaterial color="#d9dde2" metalness={0.7} roughness={0.3} />
      </mesh>
      <RB p={[1.0, D + 3.2, 0]} s={[0.9, 0.08, 0.16]} r={0.03} color="#2a2f35" rough={0.4} />
      <RB p={[1.6, D + 2.25, 0]} s={[0.5, 0.18, 0.5]} r={0.06} color="#e8e8e8" rough={0.5} />
      {/* railings along both sides */}
      {[-1, 1].map((k) => (
        <group key={k}>
          {[-3.9, -3.0, -2.1, -1.2, -0.3, 2.7, 3.4].map((x) => rail([x, D, k * halfW], [x, D + 0.85, k * halfW], 0.02))}
          {rail([-3.9, D + 0.85, k * halfW], [-0.3, D + 0.85, k * halfW])}
          {rail([2.7, D + 0.85, k * halfW], [3.6, D + 1.0, k * halfW * 0.7])}
        </group>
      ))}
      {/* fenders */}
      {[-2.6, -0.6].map((x) => (
        <mesh key={x} position={[x, D - 0.35, WB.beam / 2 + 0.06]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.2, 0.09, 12, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
      {/* A-frame crane over the stern + winch */}
      {[-1, 1].map((k) => (
        <group key={k}>{rail([-WB.L / 2 + 0.3, D, k * 1.36], [CRANE_TIP[0], CRANE_TIP[1], k * 1.3], 0.08, "#f2b21c")}</group>
      ))}
      {rail([CRANE_TIP[0], CRANE_TIP[1], -1.35], [CRANE_TIP[0], CRANE_TIP[1], 1.35], 0.09, "#f2b21c")}
      <mesh position={[CRANE_TIP[0], CRANE_TIP[1] - 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
        <meshStandardMaterial color="#2a2f35" metalness={0.7} roughness={0.35} />
      </mesh>
      <group position={[-2.6, D + 0.45, 0]}>
        <RB p={[0, -0.15, 0]} s={[0.9, 0.3, 1.4]} r={0.04} color="#3a4149" rough={0.5} metal={0.4} />
        <mesh rotation={[Math.PI / 2, winch, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 1.0, 24]} />
          <meshStandardMaterial color="#e2a51a" roughness={0.45} metalness={0.3} />
        </mesh>
        {[-0.55, 0.55].map((z) => (
          <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.06, 24]} />
            <meshStandardMaterial color="#3a4149" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
