import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Spot } from "./spot";
import { Cyl, RB, labelTex, tex } from "../../lib/three/diorama";
import { FursuitHead } from "../../lib/three/Mascots";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";

/** Props for Fox River and the real-world sets. Real sizes in metres; every prop stands on its own origin (y = 0 = floor). */

const steel = { color: "#c3c9cd", metal: 0.92, rough: 0.28 };
const lathe = (pts: [number, number][], seg = 40) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

// ───────────────────────── cell ─────────────────────────
/**
 * Stainless combo toilet-sink, wall-mounted (≈ 0.6 m wide, 1.0 m tall). Front = +z. `screws` 0…1 = the 4 tamper
 * screws in the back plate (0 = removed). `off` 0…1 turns it 90° (HeroCell carries it aside).
 */
export const SteelToilet: React.FC<{ p: V3; off?: number; screws?: number }> = ({ p, off = 0, screws = 1 }) => {
  const bowl = useMemo(() => lathe([[0.0, 0.0], [0.12, 0.0], [0.17, 0.06], [0.2, 0.2], [0.21, 0.36], [0.2, 0.4], [0.16, 0.4], [0.15, 0.24], [0.08, 0.14], [0.0, 0.13]]), []);
  const basin = useMemo(() => lathe([[0.0, -0.06], [0.1, -0.06], [0.14, -0.01], [0.15, 0.0], [0.17, 0.0], [0.17, 0.02], [0.0, 0.02]], 32), []);
  return (
    <group position={p} rotation={[0, (Math.PI / 2) * off, 0]}>
      <group>
        {/* back plate / chase cover */}
        <RB p={[0, 0.55, 0.03]} s={[0.62, 1.1, 0.06]} r={0.015} {...steel} />
        {/* raised upper cabinet with the sink */}
        <RB p={[0, 0.95, 0.17]} s={[0.56, 0.24, 0.28]} r={0.03} {...steel} />
        <mesh position={[0, 1.075, 0.2]}>
          <primitive object={basin} attach="geometry" />
          <meshStandardMaterial color="#b0b8bc" metalness={0.95} roughness={0.18} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.08, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.135, 32]} />
          <meshStandardMaterial color="#8d969b" metalness={0.95} roughness={0.3} />
        </mesh>
        {/* push-button bubbler + taps */}
        {[-0.18, 0.18].map((x) => (
          <Cyl key={x} p={[x, 1.09, 0.08]} r={0.022} h={0.02} {...steel} />
        ))}
        <Cyl p={[0, 1.11, 0.06]} r={0.012} h={0.06} {...steel} />
        {/* bowl */}
        <mesh position={[0, 0.0, 0.26]} castShadow receiveShadow>
          <primitive object={bowl} attach="geometry" />
          <meshStandardMaterial color="#c8ced2" metalness={0.92} roughness={0.22} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.4, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18, 0.025, 10, 40]} />
          <meshStandardMaterial color="#d0d6da" metalness={0.92} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.27, 0.26]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.14, 32]} />
          <meshStandardMaterial color="#3a5260" roughness={0.1} metalness={0.2} />
        </mesh>
        {/* flush button */}
        <Cyl p={[0.22, 0.7, 0.07]} r={0.03} h={0.02} rot={[Math.PI / 2, 0, 0]} color="#9aa2a6" metal={0.9} rough={0.3} />
        {/* polished steel mirror above */}
        <RB p={[0, 1.5, 0.02]} s={[0.36, 0.3, 0.015]} r={0.01} color="#e6ecef" metal={1} rough={0.08} />
        {/* the 4 tamper-proof screws (hex sockets) */}
        {screws > 0.01
          ? [[-0.27, 0.08], [0.27, 0.08], [-0.27, 0.75], [0.27, 0.75]].map(([x, y], k) => (
              <group key={k} position={[x, y, 0.065 + 0.06 * (1 - screws)]}>
                <Cyl p={[0, 0, 0]} r={0.016} h={0.012} rot={[Math.PI / 2, 0, 0]} color="#7a8286" metal={0.9} rough={0.35} />
                <mesh position={[0, 0, 0.007]}>
                  <circleGeometry args={[0.006, 6]} />
                  <meshBasicMaterial color="#111" />
                </mesh>
              </group>
            ))
          : null}
      </group>
    </group>
  );
};

/** Two wall-mounted steel bunks along the cell's left wall (x = −0.9), 2 m long in z. */
export const Bunk: React.FC<{ p: V3; messy?: number; body?: boolean }> = ({ p, messy = 0, body }) => (
  <group position={p}>
    {[0.42, 1.52].map((y, k) => (
      <group key={y} position={[0, y, 0]}>
        <RB p={[0, 0, 0]} s={[0.76, 0.05, 2.0]} r={0.01} color="#46525a" metal={0.75} rough={0.45} />
        <RB p={[0.37, 0.05, 0]} s={[0.04, 0.12, 2.0]} r={0.01} color="#46525a" metal={0.75} rough={0.45} />
        <RB p={[0, 0.11, 0]} s={[0.72, 0.11, 1.95]} r={0.04} color="#7d8b9a" rough={0.95} />
        <RB p={[0, 0.2, -0.82]} s={[0.55, 0.09, 0.3]} r={0.04} color="#e6e2d6" rough={0.95} />
        {/* grey wool blanket, folded at the foot (top) or pulled up (bottom) */}
        {k === 1 ? (
          <RB p={[0, 0.2, 0.75]} s={[0.66, 0.08, 0.38]} r={0.03} color="#5d6655" rough={1} />
        ) : (
          <RB p={[0.01, 0.18 + (body ? 0.08 : 0), 0.15]} s={[0.73, 0.04 + (body ? 0.14 : 0), 1.45]} r={body ? 0.09 : 0.02} color="#5d6655" rough={1} rot={[0, 0.03 * messy, 0]} />
        )}
      </group>
    ))}
    {/* posts + ladder at the door end */}
    {[-0.98, 0.98].map((z) => (
      <RB key={z} p={[0.37, 0.98, z]} s={[0.05, 1.96, 0.05]} r={0.01} color="#3a454c" metal={0.7} rough={0.45} />
    ))}
    {[0.75, 1.05, 1.3].map((y) => (
      <Cyl key={y} p={[0.39, y, 0.92]} r={0.014} h={0.16} rot={[Math.PI / 2, 0, 0]} color="#3a454c" metal={0.7} rough={0.45} />
    ))}
  </group>
);

/** Michael's origami swan (white paper, faceted). */
export const OrigamiSwan: React.FC<{ p: V3; s?: number; ry?: number }> = ({ p, s = 1, ry = 0 }) => {
  const g = useMemo(() => {
    const v = [
      // body (two wings as folded triangles), neck, head
      [-0.06, 0, 0], [0.06, 0, 0], [0, 0, 0.09], [0, 0.04, -0.01],
      [-0.065, 0.045, 0.02], [0.065, 0.045, 0.02], [0, 0.0, -0.06], [0, 0.11, -0.05], [0, 0.12, -0.08],
    ];
    const f = [
      [0, 2, 3], [1, 3, 2], [0, 3, 4], [1, 5, 3], [0, 6, 3], [1, 3, 6], [6, 7, 3], [6, 3, 7], [7, 8, 3], [7, 3, 8],
    ];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(f.flatMap((t) => t.flatMap((i) => v[i])), 3));
    geo.computeVertexNormals();
    return geo;
  }, []);
  return (
    <mesh geometry={g} position={p} scale={s} rotation={[0, ry, 0]} castShadow>
      <meshStandardMaterial color="#f4f0e6" roughness={0.85} side={THREE.DoubleSide} flatShading />
    </mesh>
  );
};

/** Wall shelf + bolted desk on the cell's right wall (p = wall point; items extend towards −x). */
export const CellShelf: React.FC<{ p: V3; t?: number }> = ({ p, t = 0 }) => {
  const books = useMemo(() => {
    const r = seeded(4);
    return Array.from({ length: 6 }, (_, i) => ({ z: -0.38 + i * 0.045, h: 0.2 + r() * 0.06, c: ["#7a2a24", "#24426a", "#2f5a38", "#c9a227", "#5a3a6a", "#2a2a2a"][i] }));
  }, []);
  return (
    <group position={p}>
      {/* shelf */}
      <RB p={[-0.15, 0, 0]} s={[0.3, 0.03, 0.95]} r={0.008} color="#6a767c" metal={0.7} rough={0.45} />
      {books.map((b) => (
        <RB key={b.z} p={[-0.13, 0.015 + b.h / 2, b.z]} s={[0.17, b.h, 0.038]} r={0.006} color={b.c} rough={0.8} />
      ))}
      <OrigamiSwan p={[-0.15, 0.015, 0.05]} s={1.1} ry={-1.2} />
      {/* the tiny pocket-puh fox on the shelf (cross-series easter egg) */}
      <group position={[-0.14, 0.09, 0.3]} rotation={[0, -Math.PI / 2, 0]}>
        <FursuitHead s={0.11} t={t} />
      </group>
      {/* photo taped above */}
      <mesh position={[-0.005, 0.32, 0.12]} rotation={[0, -Math.PI / 2, 0.05]}>
        <planeGeometry args={[0.13, 0.09]} />
        <meshStandardMaterial map={labelTex("#d8c8a8", "#6a8aa8", "LJ + M", "1987")} roughness={0.7} />
      </mesh>
      {/* steel desk + stool bolted to the floor */}
      <RB p={[-0.22, -0.6, 0]} s={[0.44, 0.04, 0.8]} r={0.01} color="#6a767c" metal={0.7} rough={0.45} />
      <RB p={[-0.05, -0.97, 0]} s={[0.06, 0.72, 0.06]} r={0.01} color="#5a666c" metal={0.7} rough={0.45} />
      <Cyl p={[-0.6, -1.0, 0.05]} r={0.04} h={0.7} color="#5a666c" metal={0.7} rough={0.45} />
      <Cyl p={[-0.6, -0.64, 0.05]} r={0.17} h={0.04} color="#6a767c" metal={0.7} rough={0.45} />
      {/* folded paper cranes + a notebook + a mug on the desk */}
      <OrigamiSwan p={[-0.25, -0.58, -0.25]} s={0.6} ry={0.8} />
      <RB p={[-0.25, -0.57, 0.15]} s={[0.21, 0.015, 0.15]} r={0.004} color="#e8e2d0" rough={0.9} rot={[0, 0.2, 0]} />
      <Cyl p={[-0.3, -0.53, -0.05]} r={0.04} h={0.1} color="#d8d2c0" rough={0.6} />
    </group>
  );
};

/** Homemade Allen key (hex L-key), ≈ 9 cm. */
export const AllenKey: React.FC<{ p: V3; rot?: V3; s?: number; glow?: number }> = ({ p, rot = [0, 0, 0], s = 1, glow = 0 }) => (
  <group position={p} rotation={rot} scale={s}>
    <Cyl p={[0, 0.045, 0]} r={0.004} h={0.09} seg={6} color="#3a3f44" metal={0.9} rough={0.3} emissive="#ffb35c" ei={glow} />
    <Cyl p={[0.015, 0.0, 0]} r={0.004} h={0.03} seg={6} rot={[0, 0, Math.PI / 2]} color="#3a3f44" metal={0.9} rough={0.3} emissive="#ffb35c" ei={glow} />
  </group>
);

// ───────────────────────── tool room ─────────────────────────
type ToolKind = "wrench" | "hammer" | "driver" | "pliers" | "saw" | "allen" | "file" | "chisel";
/** Tools on the board in board metres: x = centre, y = top edge (board centre = 0, board 1.3 × 0.9 m). */
const TOOLS: { k: ToolKind; x: number; y: number }[] = [
  { k: "saw", x: -0.38, y: 0.27 },
  { k: "hammer", x: 0.08, y: 0.29 },
  { k: "wrench", x: 0.3, y: 0.29 },
  { k: "pliers", x: 0.5, y: 0.29 },
  { k: "driver", x: -0.52, y: -0.02 },
  { k: "driver", x: -0.42, y: -0.02 },
  { k: "allen", x: -0.2, y: -0.02 },
  { k: "file", x: 0.02, y: -0.02 },
  { k: "chisel", x: 0.18, y: -0.02 },
];
const toolSize: Record<ToolKind, [number, number]> = { wrench: [0.07, 0.3], hammer: [0.15, 0.32], driver: [0.04, 0.28], pliers: [0.08, 0.24], saw: [0.44, 0.15], allen: [0.06, 0.11], file: [0.035, 0.3], chisel: [0.035, 0.26] };

/** Painted shadow board (1300 × 900 px = 1.3 × 0.9 m): orange outline + dark fill of every tool, "TOOL CONTROL" header. */
const shadowTex = () => {
  const c = document.createElement("canvas");
  c.width = 1300;
  c.height = 900;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e8e2d0";
  g.fillRect(0, 0, 1300, 900);
  g.fillStyle = "rgba(60,50,40,0.35)";
  for (let y = 120; y < 900; y += 26) for (let x = 13; x < 1300; x += 26) g.fillRect(x, y, 5, 5);
  g.fillStyle = "#c0202a";
  g.fillRect(0, 0, 1300, 100);
  g.fillStyle = "#fff";
  g.font = "900 64px Arial";
  g.textAlign = "center";
  g.fillText("TOOL CONTROL · CLASS A", 650, 72);
  for (const t of TOOLS) {
    const [w, h] = toolSize[t.k];
    g.fillStyle = "#2a2a2a";
    g.strokeStyle = "#e86a1a";
    g.lineWidth = 8;
    g.beginPath();
    g.roundRect(650 + (t.x - w / 2) * 1000, 450 - t.y * 1000, w * 1000, h * 1000, 10);
    g.fill();
    g.stroke();
  }
  g.fillStyle = "#1a1a1a";
  g.font = "700 34px Arial";
  g.fillText("COUNT BEFORE AND AFTER EVERY USE", 650, 870);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const Tool: React.FC<{ k: ToolKind; p: V3 }> = ({ k, p }) => {
  const [, h] = toolSize[k];
  const m = { color: "#8d969b", metal: 0.9, rough: 0.35 };
  return (
    <group position={p}>
      {k === "wrench" ? (
        <>
          <RB p={[0, -h / 2, 0]} s={[0.035, h * 0.8, 0.012]} r={0.005} {...m} />
          <mesh position={[0, -0.03, 0]}>
            <torusGeometry args={[0.025, 0.01, 8, 20]} />
            <meshStandardMaterial color="#8d969b" metalness={0.9} roughness={0.35} />
          </mesh>
        </>
      ) : k === "hammer" ? (
        <>
          <Cyl p={[0, -h / 2 - 0.03, 0]} r={0.014} h={h * 0.8} color="#c9a46a" rough={0.6} />
          <RB p={[0, -0.03, 0]} s={[0.13, 0.04, 0.035]} r={0.008} {...m} />
        </>
      ) : k === "saw" ? (
        <>
          <RB p={[0, -0.02, 0]} s={[0.4, 0.015, 0.012]} r={0.004} color="#2f6a9a" metal={0.6} rough={0.4} />
          <RB p={[-0.195, -0.06, 0]} s={[0.015, 0.09, 0.012]} r={0.004} color="#2f6a9a" metal={0.6} rough={0.4} />
          <RB p={[0.195, -0.06, 0]} s={[0.015, 0.09, 0.012]} r={0.004} color="#2f6a9a" metal={0.6} rough={0.4} />
          <RB p={[0, -0.1, 0]} s={[0.38, 0.012, 0.003]} r={0.001} color="#d8dde0" metal={1} rough={0.2} />
        </>
      ) : k === "pliers" ? (
        <>
          <RB p={[-0.012, -0.12, 0]} s={[0.014, 0.2, 0.01]} r={0.004} color="#c0202a" rough={0.5} rot={[0, 0, 0.12]} />
          <RB p={[0.012, -0.12, 0]} s={[0.014, 0.2, 0.01]} r={0.004} color="#c0202a" rough={0.5} rot={[0, 0, -0.12]} />
          <RB p={[0, -0.02, 0]} s={[0.02, 0.06, 0.012]} r={0.004} {...m} />
        </>
      ) : k === "allen" ? (
        <AllenKey p={[0, -0.09, 0]} s={1} />
      ) : (
        <>
          <Cyl p={[0, -0.05, 0]} r={k === "driver" ? 0.014 : 0.01} h={0.1} color={k === "driver" ? "#e8b020" : "#3a3a3a"} rough={0.5} />
          <Cyl p={[0, -0.05 - h / 2, 0]} r={0.004} h={h * 0.65} {...m} />
        </>
      )}
    </group>
  );
};

/** Wall tool cabinet with an open door and a painted shadow board (1.3 × 0.9 m). `missing` = index of the tool that
 * is gone (its painted shadow then shows), `flash` 0…1 pulses that outline red. */
export const ShadowBoard: React.FC<{ p: V3; ry?: number; missing?: number; flash?: number; door?: number }> = ({ p, ry = 0, missing = -1, flash = 0, door = 1 }) => {
  const map = useMemo(shadowTex, []);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <RB p={[0, 0, -0.06]} s={[1.42, 1.0, 0.12]} r={0.015} color="#4a5a3a" metal={0.4} rough={0.55} />
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[1.3, 0.9]} />
        <meshStandardMaterial map={map} roughness={0.8} />
      </mesh>
      {TOOLS.map((t, i) =>
        i === missing ? (
          <mesh key={i} position={[t.x, t.y - toolSize[t.k][1] / 2, 0.004]}>
            <planeGeometry args={[toolSize[t.k][0] + 0.03, toolSize[t.k][1] + 0.03]} />
            <meshBasicMaterial color="#ff2a2a" transparent opacity={0.55 * flash} depthWrite={false} toneMapped={false} />
          </mesh>
        ) : (
          <Tool key={i} k={t.k} p={[t.x, t.y, 0.03]} />
        ),
      )}
      {/* open cabinet door on hinges (left) */}
      <group position={[-0.71, 0, 0.02]} rotation={[0, -2.0 * door, 0]}>
        <RB p={[0.7, 0, 0]} s={[1.4, 1.0, 0.03]} r={0.01} color="#4a5a3a" metal={0.4} rough={0.55} />
        <RB p={[1.25, 0, 0.03]} s={[0.04, 0.18, 0.03]} r={0.01} color="#c9c9c9" metal={0.9} rough={0.3} />
      </group>
      {/* padlock hasp */}
      <RB p={[0.73, 0, 0.0]} s={[0.04, 0.12, 0.05]} r={0.01} color="#b8a040" metal={0.9} rough={0.35} />
    </group>
  );
};

// ───────────────────────── infirmary + chemistry ─────────────────────────
/** Pharmacy pill bottle with a printed label. */
export const PillBottle: React.FC<{ p: V3; label: string; s?: number; ry?: number }> = ({ p, label, s = 1, ry = 0 }) => {
  const map = useMemo(() => labelTex("#ffffff", "#2a7ac0", label, "Rx · 30 TABLETS", 512, 256), [label]);
  return (
    <group position={p} scale={s} rotation={[0, ry, 0]}>
      <mesh position={[0, 0.045, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.07, 28, 1, true]} />
        <meshStandardMaterial color="#d8822a" roughness={0.2} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.042, 0]}>
        <cylinderGeometry args={[0.0225, 0.0225, 0.045, 28, 1, true]} />
        <meshStandardMaterial map={map} roughness={0.6} />
      </mesh>
      <Cyl p={[0, 0.088, 0]} r={0.024} h={0.018} color="#f4f4f4" rough={0.5} />
    </group>
  );
};

/** Lab-style bottle (glass, liquid, label) — copper sulfate is blue, phosphoric acid clear. */
export const ChemBottle: React.FC<{ p: V3; label: string; sub: string; liquid: string; level?: number; h?: number; band?: string }> = ({ p, label, sub, liquid, level = 0.7, h = 0.24, band = "#2a7ac0" }) => {
  const map = useMemo(() => labelTex("#ffffff", band, label, sub, 512, 256), [label, sub, band]);
  return (
    <group position={p}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.06, h, 32, 1, true]} />
        <meshStandardMaterial color="#dfe8ec" roughness={0.05} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, (h * level) / 2, 0]}>
        <cylinderGeometry args={[0.056, 0.056, h * level, 32]} />
        <meshStandardMaterial color={liquid} roughness={0.1} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, h * 0.42, 0]}>
        <cylinderGeometry args={[0.0605, 0.0605, h * 0.32, 32, 1, true]} />
        <meshStandardMaterial map={map} roughness={0.6} />
      </mesh>
      <Cyl p={[0, h + 0.02, 0]} r={0.025} h={0.04} color="#2a2a2a" rough={0.5} />
    </group>
  );
};

/** Infirmary room (x −2.5…2.5, z −2…2): tiles, exam bed, glass medicine cabinet, sink, barred window, desk, IV pole. */
export const Infirmary: React.FC<{ window?: number }> = ({ window = 0 }) => {
  const tiles = useMemo(() => tex("tiles", "#d8e2e0", [10, 4], 3), []);
  const floor = useMemo(() => tex("tiles", "#9aa8a4", [8, 6], 5), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 4]} />
        <meshStandardMaterial map={floor} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.4, -2]} receiveShadow>
        <planeGeometry args={[5, 2.8]} />
        <meshStandardMaterial map={tiles} roughness={0.4} />
      </mesh>
      {[-2.5, 2.5].map((x, k) => (
        <mesh key={x} position={[x, 1.4, 0]} rotation={[0, k ? -Math.PI / 2 : Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[4, 2.8]} />
          <meshStandardMaterial map={tiles} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 4]} />
        <meshStandardMaterial color="#e8ece8" roughness={0.9} />
      </mesh>
      {/* fluorescent panels */}
      {[-1, 1].map((x) => (
        <mesh key={x} position={[x, 2.79, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 0.3]} />
          <meshStandardMaterial color="#fff" emissive="#f0f6ff" emissiveIntensity={2.2} />
        </mesh>
      ))}
      {/* exam bed */}
      <group position={[-1.2, 0, -0.6]}>
        <RB p={[0, 0.75, 0]} s={[0.7, 0.1, 1.9]} r={0.04} color="#5a8aa0" rough={0.6} />
        <RB p={[0, 0.82, 0.0]} s={[0.66, 0.02, 1.86]} r={0.01} color="#f4f4f0" rough={0.95} />
        <RB p={[0, 0.88, -0.75]} s={[0.5, 0.08, 0.3]} r={0.03} color="#f4f4f0" rough={0.95} />
        {[-0.3, 0.3].map((x) => [-0.85, 0.85].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.36, z]} r={0.02} h={0.72} color="#c9cfd2" metal={0.8} rough={0.3} />))}
      </group>
      {/* IV pole */}
      <group position={[-0.6, 0, -1.3]}>
        <Cyl p={[0, 0.9, 0]} r={0.012} h={1.8} color="#c9cfd2" metal={0.9} rough={0.3} />
        <RB p={[0.06, 1.72, 0]} s={[0.1, 0.16, 0.03]} r={0.02} color="#e8f2f4" rough={0.2} opacity={0.8} />
        <Cyl p={[0, 0.03, 0]} r={0.22} h={0.03} color="#6a7276" metal={0.6} rough={0.4} />
      </group>
      {/* glass medicine cabinet + sink on the back wall */}
      <group position={[0.9, 0, -1.8]}>
        {/* open steel cabinet: back, sides, top, bottom, a faint glass door */}
        <RB p={[0, 1.55, -0.16]} s={[1.0, 1.1, 0.03]} r={0.005} color="#e8ece8" metal={0.2} rough={0.5} />
        {[-0.49, 0.49].map((x) => (
          <RB key={x} p={[x, 1.55, 0]} s={[0.03, 1.1, 0.35]} r={0.005} color="#e8ece8" metal={0.2} rough={0.5} />
        ))}
        {[1.0, 2.1].map((y) => (
          <RB key={y} p={[0, y, 0]} s={[1.0, 0.03, 0.35]} r={0.005} color="#e8ece8" metal={0.2} rough={0.5} />
        ))}
        <mesh position={[0, 1.55, 0.18]}>
          <planeGeometry args={[0.92, 1.02]} />
          <meshStandardMaterial color="#cfe0e8" roughness={0.05} metalness={0.1} transparent opacity={0.12} depthWrite={false} />
        </mesh>
        {[1.2, 1.55, 1.9].map((y) => (
          <group key={y}>
            <RB p={[0, y - 0.15, 0.02]} s={[0.94, 0.015, 0.3]} r={0.004} color="#f4f4f4" />
            {Array.from({ length: 6 }, (_, k) => (
              <PillBottle key={k} p={[-0.38 + k * 0.15, y - 0.142, 0.05]} label={["PUGNAc", "INSULIN", "SALINE", "IBU", "AMOX", "GAUZE"][(k + Math.round(y * 10)) % 6]} s={1.1} />
            ))}
          </group>
        ))}
        <RB p={[0.0, 0.85, 0.05]} s={[0.6, 0.15, 0.45]} r={0.03} color="#f4f4f4" rough={0.3} />
        <Cyl p={[0, 1.0, -0.1]} r={0.012} h={0.15} color="#c9cfd2" metal={0.9} rough={0.2} />
      </group>
      {/* barred window on the right wall: the last stop of the route */}
      <group position={[2.48, 1.6, 0.4]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[1.0, 1.1]} />
          <meshStandardMaterial color="#1a2848" emissive="#3d5a9a" emissiveIntensity={0.8} />
        </mesh>
        {Array.from({ length: 5 }, (_, b) => (
          <group key={b} position={[0, 0, 0.04 + 0.6 * window * (b === 2 ? 1 : 0)]} rotation={[0, 0, b === 2 ? 0.6 * window : 0]}>
            <Cyl p={[-0.4 + b * 0.2, 0, 0]} r={0.015} h={1.1} color="#2a2e30" metal={0.7} rough={0.4} />
          </group>
        ))}
      </group>
      {/* desk with a chart */}
      <group position={[1.6, 0, 0.8]}>
        <RB p={[0, 0.74, 0]} s={[0.6, 0.04, 1.1]} r={0.01} color="#8a7a5a" rough={0.6} />
        <RB p={[0, 0.37, -0.4]} s={[0.55, 0.72, 0.04]} r={0.01} color="#6a6050" />
        <RB p={[0, 0.37, 0.4]} s={[0.55, 0.72, 0.04]} r={0.01} color="#6a6050" />
        <RB p={[0, 0.765, 0.1]} s={[0.24, 0.012, 0.32]} r={0.003} color="#f2efe4" rot={[0, 0.2, 0]} />
      </group>
    </group>
  );
};

// ───────────────────────── phone ─────────────────────────
/** Steel inmate wall phone with keypad, armoured cord and the recording notice above it. */
export const WallPhone: React.FC<{ p: V3; ry?: number; lifted?: number }> = ({ p, ry = 0, lifted = 0 }) => {
  const sign = useMemo(() => labelTex("#f4f1e6", "#c0202a", "NOTICE", "CALLS ARE MONITORED AND RECORDED", 1024, 340), []);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <RB p={[0, 1.35, 0.05]} s={[0.24, 0.42, 0.1]} r={0.02} {...steel} />
      {Array.from({ length: 12 }, (_, k) => (
        <RB key={k} p={[-0.05 + (k % 3) * 0.05, 1.42 - Math.floor(k / 3) * 0.045, 0.105]} s={[0.035, 0.03, 0.012]} r={0.005} color="#2a2e30" metal={0.6} />
      ))}
      <group position={[-0.09, 1.38 - lifted * 0.2, 0.12 + lifted * 0.2]} rotation={[0, 0, lifted * 0.6]}>
        <RB p={[0, 0, 0]} s={[0.05, 0.22, 0.05]} r={0.02} color="#1a1c1e" rough={0.4} />
      </group>
      <mesh position={[0, 1.95, 0.002]}>
        <planeGeometry args={[0.6, 0.2]} />
        <meshStandardMaterial map={sign} roughness={0.7} />
      </mesh>
    </group>
  );
};

// ───────────────────────── bank, court, studio, intake ─────────────────────────
/** Bank lobby (x −4…4, z −3…3): marble floor, teller counter with glass, brass, a vault door, rope posts, a sign. */
export const BankLobby: React.FC = () => {
  const marble = useMemo(() => tex("tiles", "#d9d2c4", [8, 6], 9), []);
  const plaster = useMemo(() => tex("plaster", "#e8dcc4", [4, 2], 2), []);
  const sign = useMemo(() => labelTex("#0e2a4a", "#c9a227", "FIRST NATIONAL", "BANK · MEMBER FDIC", 1024, 256), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial map={marble} roughness={0.15} metalness={0.05} />
      </mesh>
      <mesh position={[0, 2, -3]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial map={plaster} roughness={0.8} />
      </mesh>
      {[-4, 4].map((x, k) => (
        <mesh key={x} position={[x, 2, 0]} rotation={[0, k ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <planeGeometry args={[6, 4]} />
          <meshStandardMaterial map={plaster} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.2, -2.98]}>
        <planeGeometry args={[3.2, 0.8]} />
        <meshStandardMaterial map={sign} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* teller counter: wood panels, marble top, glass screens, three windows */}
      <group position={[0, 0, -1.4]}>
        <RB p={[0, 0.55, 0]} s={[6, 1.1, 0.6]} r={0.03} color="#5a3a24" rough={0.5} />
        <RB p={[0, 1.13, 0.05]} s={[6.1, 0.06, 0.72]} r={0.02} color="#efe8dc" rough={0.15} />
        {[-2, 0, 2].map((x) => (
          <group key={x} position={[x, 1.16, 0.1]}>
            <mesh position={[0, 0.5, 0]}>
              <planeGeometry args={[1.6, 1]} />
              <meshStandardMaterial color="#dfe8ec" roughness={0.03} transparent opacity={0.16} depthWrite={false} />
            </mesh>
            <RB p={[0, 1.02, 0]} s={[1.7, 0.05, 0.06]} r={0.01} color="#c9a227" metal={1} rough={0.25} />
            <RB p={[-0.85, 0.5, 0]} s={[0.05, 1.05, 0.06]} r={0.01} color="#c9a227" metal={1} rough={0.25} />
            <RB p={[0, 0.01, 0.15]} s={[0.4, 0.02, 0.2]} r={0.005} color="#c9a227" metal={1} rough={0.3} />
          </group>
        ))}
      </group>
      {/* round vault door, half open, on the back wall */}
      <group position={[3.0, 1.35, -2.95]}>
        <Cyl p={[0, 0, 0]} r={1.0} h={0.1} rot={[Math.PI / 2, 0, 0]} color="#7a7f84" metal={0.9} rough={0.3} />
        <group position={[-0.95, 0, 0.1]} rotation={[0, -1.0, 0]}>
          <Cyl p={[0.95, 0, 0.12]} r={0.92} h={0.35} rot={[Math.PI / 2, 0, 0]} color="#b8bcc0" metal={0.95} rough={0.2} />
          <mesh position={[0.95, 0, 0.31]}>
            <torusGeometry args={[0.25, 0.03, 8, 6]} />
            <meshStandardMaterial color="#d0d4d8" metalness={1} roughness={0.2} />
          </mesh>
        </group>
      </group>
      {/* rope barriers */}
      {[-1.8, -0.6, 0.6, 1.8].map((x) => (
        <group key={x} position={[x, 0, 0.6]}>
          <Cyl p={[0, 0.48, 0]} r={0.025} h={0.95} color="#c9a227" metal={1} rough={0.25} />
          <Cyl p={[0, 0.02, 0]} r={0.15} h={0.04} color="#c9a227" metal={1} rough={0.25} />
        </group>
      ))}
      {[-1.2, 0, 1.2].map((x) => (
        <mesh key={x} position={[x, 0.82, 0.6]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
          <meshStandardMaterial color="#8a1a2a" roughness={0.7} />
        </mesh>
      ))}
      {/* pendant lamps */}
      {[-2, 0, 2].map((x) => (
        <group key={x} position={[x, 3.4, 0.5]}>
          <Cyl p={[0, 0.3, 0]} r={0.006} h={0.6} color="#222" />
          <mesh>
            <sphereGeometry args={[0.18, 20, 14]} />
            <meshStandardMaterial color="#fff6e0" emissive="#ffe0a8" emissiveIntensity={1.8} />
          </mesh>
          <Glow position={[0, 0, 0]} size={1.2} color="#ffd9a0" opacity={0.4} />
        </group>
      ))}
    </group>
  );
};

/** Courtroom (x −4…4, z −3…3): judge's bench in panelled wood, state seal, flags, witness box, counsel tables. */
export const Courtroom: React.FC = () => {
  const wood = useMemo(() => tex("planks", "#6a4428", [3, 2], 4), []);
  const seal = useMemo(() => labelTex("#c9a227", "#0e2a4a", "STATE OF", "ILLINOIS · CIRCUIT COURT", 512, 512), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial map={useMemo(() => tex("carpet", "#4a2a2a", [4, 3], 2), [])} roughness={1} />
      </mesh>
      <mesh position={[0, 2.2, -3]} receiveShadow>
        <planeGeometry args={[8, 4.4]} />
        <meshStandardMaterial map={wood} roughness={0.6} />
      </mesh>
      {[-4, 4].map((x, k) => (
        <mesh key={x} position={[x, 2.2, 0]} rotation={[0, k ? -Math.PI / 2 : Math.PI / 2, 0]}>
          <planeGeometry args={[6, 4.4]} />
          <meshStandardMaterial map={wood} roughness={0.6} color="#d8c8b8" />
        </mesh>
      ))}
      {/* bench on a dais */}
      <RB p={[0, 0.15, -2.2]} s={[3.6, 0.3, 1.4]} r={0.02} color="#4a2c18" rough={0.6} />
      <RB p={[0, 0.85, -1.75]} s={[3.2, 1.1, 0.5]} r={0.03} color="#5a361e" rough={0.5} />
      <RB p={[0, 1.42, -1.75]} s={[3.3, 0.06, 0.6]} r={0.02} color="#3a2412" rough={0.4} />
      <mesh position={[0, 2.7, -2.98]}>
        <circleGeometry args={[0.6, 48]} />
        <meshStandardMaterial map={seal} metalness={0.5} roughness={0.35} />
      </mesh>
      {/* flags */}
      {[-1.9, 1.9].map((x, k) => (
        <group key={x} position={[x, 0, -2.6]}>
          <Cyl p={[0, 1.3, 0]} r={0.02} h={2.6} color="#c9a227" metal={1} rough={0.3} />
          <mesh position={[k ? -0.42 : 0.42, 2.15, 0]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.8, 0.55, 8, 1]} />
            <meshStandardMaterial map={k ? labelTex("#ffffff", "#0e2a4a", "ILLINOIS", "", 256, 160) : labelTex("#b22234", "#ffffff", "★ ★ ★", "", 256, 160)} side={THREE.DoubleSide} roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* gavel */}
      <group position={[0.6, 1.47, -1.6]}>
        <Cyl p={[0, 0.03, 0]} r={0.03} h={0.1} rot={[0, 0, Math.PI / 2]} color="#3a2412" rough={0.4} />
        <Cyl p={[0, 0.03, 0.12]} r={0.01} h={0.22} rot={[Math.PI / 2, 0, 0]} color="#3a2412" rough={0.4} />
        <Cyl p={[0, 0.0, 0]} r={0.05} h={0.02} color="#3a2412" rough={0.4} />
      </group>
      {/* counsel table + chairs */}
      <RB p={[-1.4, 0.74, 1.0]} s={[1.8, 0.05, 0.8]} r={0.01} color="#5a361e" rough={0.5} />
      {[-2.0, -0.8].map((x) => (
        <RB key={x} p={[x, 0.37, 1.0]} s={[0.06, 0.72, 0.7]} r={0.01} color="#4a2c18" />
      ))}
      <RB p={[1.6, 0.6, -0.6]} s={[1.0, 1.2, 0.8]} r={0.03} color="#5a361e" rough={0.5} />
      {/* ceiling */}
      <mesh position={[0, 4.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.9} />
      </mesh>
    </group>
  );
};

/** Tattoo studio corner: padded chair, articulated lamp, ink caps, machine, flash sheets on the wall. */
export const TattooStudio: React.FC<{ buzz?: number }> = ({ buzz = 0 }) => {
  const flash = useMemo(() => labelTex("#f2ead8", "#1a1a1a", "FLASH", "CUSTOM · WALK-INS", 512, 640), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial map={useMemo(() => tex("planks", "#3a2a22", [3, 3], 6), [])} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.6, -2]} receiveShadow>
        <planeGeometry args={[6, 3.2]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.9} />
      </mesh>
      {[-1.6, -0.8, 0, 0.8, 1.6].map((x, k) => (
        <mesh key={x} position={[x, 1.9 + (k % 2) * 0.12, -1.99]} rotation={[0, 0, (k - 2) * 0.03]}>
          <planeGeometry args={[0.6, 0.75]} />
          <meshStandardMaterial map={flash} roughness={0.8} />
        </mesh>
      ))}
      {/* reclining chair */}
      <group position={[0, 0, -0.4]}>
        <Cyl p={[0, 0.25, 0]} r={0.06} h={0.5} color="#2a2a2a" metal={0.7} rough={0.3} />
        <Cyl p={[0, 0.02, 0]} r={0.3} h={0.04} color="#2a2a2a" metal={0.7} rough={0.3} />
        <RB p={[0, 0.58, 0.1]} s={[0.62, 0.14, 1.0]} r={0.06} color="#1a1a1c" rough={0.45} />
        <RB p={[0, 0.95, -0.5]} s={[0.62, 0.8, 0.14]} r={0.06} color="#1a1a1c" rough={0.45} rot={[-0.35, 0, 0]} />
      </group>
      {/* cart: ink caps, machine, gloves box */}
      <group position={[0.9, 0, 0.1]}>
        <RB p={[0, 0.85, 0]} s={[0.5, 0.03, 0.4]} r={0.01} {...steel} />
        <Cyl p={[0, 0.42, 0]} r={0.02} h={0.84} {...steel} />
        {["#111111", "#1a2a5a", "#5a1a1a", "#111111", "#2a4a2a"].map((col, k) => (
          <Cyl key={k} p={[-0.18 + k * 0.08, 0.88, 0.1]} r={0.015} h={0.025} color={col} rough={0.3} />
        ))}
        <group position={[0.05, 0.9 + 0.003 * Math.sin(buzz * 90), -0.08]} rotation={[0, 0.4, Math.PI / 2]}>
          <Cyl p={[0, 0, 0]} r={0.018} h={0.13} color="#8a8f94" metal={0.9} rough={0.25} />
          <Cyl p={[0, 0.08, 0]} r={0.006} h={0.05} color="#c0c4c8" metal={0.9} rough={0.25} />
        </group>
        <RB p={[0.15, 0.92, 0.05]} s={[0.12, 0.08, 0.08]} r={0.01} color="#2a6ac0" rough={0.6} />
      </group>
      {/* articulated lamp */}
      <group position={[-0.9, 0, -0.6]}>
        <Cyl p={[0, 0.8, 0]} r={0.02} h={1.6} color="#2a2a2a" metal={0.7} rough={0.3} />
        <mesh position={[0.4, 1.65, 0.3]} rotation={[0.5, 0, -0.6]}>
          <cylinderGeometry args={[0.02, 0.02, 1.0, 8]} />
          <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.75, 1.8, 0.5]} rotation={[0.6, 0, 0.4]}>
          <cylinderGeometry args={[0.07, 0.16, 0.16, 24, 1, true]} />
          <meshStandardMaterial color="#e8e8e8" side={THREE.DoubleSide} />
        </mesh>
        <Glow position={[0.75, 1.72, 0.5]} size={0.9} color="#fff4e0" opacity={0.6} />
        <pointLight position={[0.75, 1.7, 0.5]} color="#fff2dc" intensity={5} distance={4} decay={2} />
      </group>
    </group>
  );
};

/** Intake / booking room: height chart wall (feet + metres), number placard ledge, camera on a tripod with a flash. */
export const IntakeRoom: React.FC<{ flash?: number }> = ({ flash = 0 }) => {
  const chart = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 1024;
    const g = c.getContext("2d")!;
    g.fillStyle = "#cfd3cf";
    g.fillRect(0, 0, 512, 1024);
    // 0…2.4 m over 1024 px; lines every 5 cm, labels in feet + metres
    for (let cm = 0; cm <= 240; cm += 5) {
      const y = 1024 - (cm / 240) * 1024;
      g.fillStyle = "#1a1a1a";
      g.fillRect(0, y - (cm % 10 === 0 ? 2 : 1), cm % 10 === 0 ? 512 : 300, cm % 10 === 0 ? 4 : 2);
    }
    g.font = "700 30px Arial";
    for (let ft = 3; ft <= 7; ft++) {
      const y = 1024 - ((ft * 30.48) / 240) * 1024;
      g.fillText(`${ft}'`, 410, y - 8);
    }
    for (let m = 1; m <= 2; m += 0.2) {
      const y = 1024 - ((m * 100) / 240) * 1024;
      g.fillText(`${m.toFixed(1)} m`, 330, y + 30);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial map={useMemo(() => tex("tiles", "#8a8e88", [6, 6], 8), [])} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.4, -1.5]} receiveShadow>
        <planeGeometry args={[6, 2.8]} />
        <meshStandardMaterial color="#b8bdb8" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.2, -1.49]}>
        <planeGeometry args={[1.2, 2.4]} />
        <meshStandardMaterial map={chart} roughness={0.8} />
      </mesh>
      {/* camera on tripod, 2.6 m in front of the chart */}
      <group position={[0, 0, 1.6]} rotation={[0, Math.PI, 0]}>
        {[0, 2.1, 4.2].map((a) => (
          <mesh key={a} position={[Math.sin(a) * 0.2, 0.62, Math.cos(a) * 0.2]} rotation={[Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3]}>
            <cylinderGeometry args={[0.012, 0.015, 1.3, 8]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
        <RB p={[0, 1.33, 0]} s={[0.16, 0.11, 0.09]} r={0.015} color="#1a1a1a" rough={0.4} />
        <Cyl p={[0, 1.33, 0.08]} r={0.035} h={0.08} rot={[Math.PI / 2, 0, 0]} color="#0e0e0e" metal={0.4} rough={0.2} />
        <RB p={[0, 1.44, 0]} s={[0.08, 0.06, 0.05]} r={0.01} color="#2a2a2a" />
        <mesh position={[0, 1.45, 0.03]}>
          <planeGeometry args={[0.07, 0.04]} />
          <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={6 * flash} />
        </mesh>
        {flash > 0 ? <pointLight position={[0, 1.45, 0.2]} color="#ffffff" intensity={60 * flash} distance={6} decay={2} /> : null}
        {flash > 0 ? <Glow position={[0, 1.45, 0.08]} size={1.6 * flash} color="#ffffff" opacity={flash} /> : null}
      </group>
      {/* fluorescent */}
      <mesh position={[0, 2.79, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.4, 0.3]} />
        <meshStandardMaterial color="#fff" emissive="#f0f6ff" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

// ───────────────────────── outside: manhunt, Chicago, Clinton ─────────────────────────
/** Police helicopter (≈ 12 m), searchlight cone pointing down. `rotor` = seconds. */
export const Helicopter: React.FC<{ p: V3; ry?: number; rotor: number; beam?: number }> = ({ p, ry = 0, rotor, beam = 1 }) => (
  <group position={p} rotation={[0, ry, 0.05]}>
    <mesh scale={[1, 0.85, 1.9]} castShadow>
      <sphereGeometry args={[1.1, 28, 18]} />
      <meshStandardMaterial color="#1c2a4a" metalness={0.5} roughness={0.35} />
    </mesh>
    <mesh position={[0, 0.15, 1.3]} scale={[0.85, 0.6, 0.8]}>
      <sphereGeometry args={[1.0, 24, 14]} />
      <meshPhysicalMaterial color="#5a7a9a" metalness={0.2} roughness={0.05} transparent opacity={0.6} />
    </mesh>
    <mesh position={[0, 0.25, -3.6]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.18, 0.4, 4.2, 12]} />
      <meshStandardMaterial color="#1c2a4a" metalness={0.5} roughness={0.35} />
    </mesh>
    <RB p={[0.15, 0.85, -5.6]} s={[0.08, 1.3, 0.7]} r={0.05} color="#e8e8e8" />
    <group position={[0.25, 0.9, -5.6]} rotation={[rotor * 70, 0, 0]}>
      <RB p={[0, 0, 0]} s={[0.03, 1.4, 0.12]} r={0.01} color="#2a2a2a" />
    </group>
    <Cyl p={[0, 1.05, 0]} r={0.12} h={0.4} color="#2a2a2a" metal={0.6} />
    <group position={[0, 1.27, 0]} rotation={[0, rotor * 40, 0]}>
      {[0, Math.PI / 2].map((a) => (
        <RB key={a} p={[0, 0, 0]} s={[11, 0.04, 0.3]} r={0.01} color="#1a1a1a" rot={[0, a, 0]} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.5, 40]} />
        <meshBasicMaterial color="#8a9aaa" transparent opacity={0.05} depthWrite={false} />
      </mesh>
    </group>
    {[-0.75, 0.75].map((x) => (
      <group key={x}>
        <RB p={[x, -1.15, 0.2]} s={[0.08, 0.06, 3.2]} r={0.03} color="#2a2a2a" metal={0.6} />
        <Cyl p={[x * 0.9, -0.95, -0.6]} r={0.03} h={0.45} color="#2a2a2a" />
        <Cyl p={[x * 0.9, -0.95, 0.9]} r={0.03} h={0.45} color="#2a2a2a" />
      </group>
    ))}
    {/* searchlight under the nose */}
    <group position={[0, -0.8, 1.5]}>
      <mesh>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color="#fff" emissive="#fffbe8" emissiveIntensity={5 * beam} />
      </mesh>
      <Glow position={[0, -0.1, 0]} size={2} color="#fffbe8" opacity={0.8 * beam} />
      <mesh position={[0, -9, 2.5]} rotation={[-0.27, 0, 0]}>
        <coneGeometry args={[3.2, 18, 32, 1, true]} />
        <meshBasicMaterial color="#fff6dc" transparent opacity={0.08 * beam} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      <Spot p={[0, 0, 0]} target={[0, -16, 4]} angle={0.3} intensity={1800 * beam} distance={60} color="#fff6dc" local />
    </group>
    {/* nav lights */}
    <Glow position={[0, -0.9, -1]} size={0.6} color="#ff3030" opacity={0.6 + 0.4 * Math.sin(rotor * 12)} />
  </group>
);

/** Chicago's Metropolitan Correctional Center (the triangular 27-storey jail with slit windows), with the bedsheet
 * rope hanging from a 17th-floor window. `rope` 0…1 = how far it has been let down. */
export const HighRiseJail: React.FC<{ rope?: number }> = ({ rope = 1 }) => {
  const conc = usePbr("concrete_floor_02", [3, 20]);
  const tri = useMemo(() => {
    const s = new THREE.Shape();
    const R = 14;
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
      if (k === 0) s.moveTo(Math.cos(a) * R, Math.sin(a) * R);
      else s.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    }
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 82, bevelEnabled: true, bevelSize: 0.6, bevelThickness: 0.6, bevelSegments: 3 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const slits = useMemo(() => {
    const out: { p: V3; ry: number; lit: boolean }[] = [];
    const r = seeded(17);
    // the front face (facing +z): two triangle corners at angles 210° and 330° → face normal at 270°+180° = +z
    for (let fl = 2; fl < 27; fl++)
      for (let k = -8; k <= 8; k++) out.push({ p: [k * 1.3, fl * 3.0 + 1.2, 7.62], ry: 0, lit: r() < 0.3 });
    return out;
  }, []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0b0e14", roughness: 0.3 }), []);
  const lit = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffd9a0", emissive: "#ffc070", emissiveIntensity: 1.6 }), []);
  const slitGeo = useMemo(() => new THREE.BoxGeometry(0.13, 1.6, 0.1), []);
  const ropeLen = 17 * 3.0 * rope;
  return (
    <group>
      <mesh geometry={tri} castShadow receiveShadow>
        <meshStandardMaterial {...conc} color="#cfc6b6" roughness={0.85} />
      </mesh>
      <Spot p={[0, 0.5, 22]} target={[0, 40, 7]} angle={0.55} intensity={2600} distance={120} color="#ffd9a6" />
      <Inst2 geo={slitGeo} items={slits.filter((s) => !s.lit).map((s) => s.p)} mat={dark} />
      <Inst2 geo={slitGeo} items={slits.filter((s) => s.lit).map((s) => s.p)} mat={lit} />
      {/* knotted bedsheet rope from the 17th-floor slit (x = 1.3) */}
      <group position={[1.3, 17 * 3.0 + 1.0, 7.85]}>
        {Array.from({ length: Math.max(1, Math.floor(ropeLen / 1.2)) }, (_, k) => (
          <group key={k} position={[0.06 * Math.sin(k * 1.7), -k * 1.2 - 0.6, 0]}>
            <mesh rotation={[0, k * 0.7, 0]}>
              <cylinderGeometry args={[0.07, 0.09, 1.1, 8]} />
              <meshStandardMaterial color={k % 3 === 2 ? "#e8e4d8" : "#f4f2ea"} roughness={0.95} />
            </mesh>
            <mesh position={[0, -0.58, 0]}>
              <sphereGeometry args={[0.13, 10, 8]} />
              <meshStandardMaterial color="#e2ddd0" roughness={0.95} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

/** Plain instanced boxes at positions (local helper). */
const Inst2: React.FC<{ geo: THREE.BufferGeometry; items: V3[]; mat: THREE.Material }> = ({ geo, items, mat }) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
    const o = new THREE.Object3D();
    items.forEach((p, i) => {
      o.position.set(...p);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.count = items.length;
    m.frustumCulled = false;
    return m;
  }, [geo, items, mat]);
  return <primitive object={mesh} />;
};

/** Cast-iron manhole cover + ring in a street. `lift` 0…1 slides the cover aside. */
export const Manhole: React.FC<{ p: V3; lift?: number }> = ({ p, lift = 0 }) => {
  const iron = usePbr("metal_plate", [1, 1]);
  return (
    <group position={p}>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 1.2, 32, 1, true]} />
        <meshStandardMaterial color="#1a1612" roughness={1} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.36, 32]} />
        <meshBasicMaterial color="#050403" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.36, 0.45, 40]} />
        <meshStandardMaterial color="#2a2622" metalness={0.7} roughness={0.6} />
      </mesh>
      <group position={[0.55 * lift, 0.02 + 0.03 * lift, 0.25 * lift]} rotation={[0, lift * 0.8, 0]}>
        <Cyl p={[0, 0, 0]} r={0.355} h={0.03} seg={40} {...iron} color="#4a4440" metal={0.8} rough={0.55} />
        {[-0.2, -0.1, 0, 0.1, 0.2].map((z) => (
          <RB key={z} p={[0, 0.017, z]} s={[0.5 - Math.abs(z) * 1.2, 0.006, 0.03]} r={0.002} color="#5a5450" metal={0.8} rough={0.5} />
        ))}
      </group>
    </group>
  );
};

/** Frozen hamburger meat block in butcher paper, with hacksaw blades showing (Clinton, 2015). */
export const MeatBlock: React.FC<{ p: V3; open?: number }> = ({ p, open = 0 }) => (
  <group position={p}>
    <RB p={[0, 0.04, 0]} s={[0.3, 0.08, 0.2]} r={0.03} color="#b8454a" rough={0.7} />
    {/* frost */}
    <RB p={[0, 0.082, 0]} s={[0.28, 0.006, 0.18]} r={0.003} color="#f0f4f8" rough={0.4} opacity={0.7} />
    {/* butcher paper folded back */}
    <group position={[0, 0.0, -0.1]} rotation={[-1.2 * open, 0, 0]}>
      <RB p={[0, 0.0, -0.13]} s={[0.4, 0.004, 0.28]} r={0.002} color="#e8dcc0" rough={0.9} />
    </group>
    <RB p={[0, -0.002, 0]} s={[0.42, 0.004, 0.32]} r={0.002} color="#e8dcc0" rough={0.9} />
    {[-0.04, 0.0, 0.04].map((z, k) => (
      <RB key={z} p={[0.02 * k, 0.06 + 0.04 * open, z]} s={[0.3, 0.003, 0.013]} r={0.001} color="#dfe6ea" metal={1} rough={0.15} rot={[0, 0.1 * k, 0]} />
    ))}
  </group>
);

/** FBI case wall: cork board with tattoo photos, a map, red strings between pins. */
export const CaseBoard: React.FC<{ p: V3; strings?: number }> = ({ p, strings = 1 }) => {
  const cork = useMemo(() => tex("carpet", "#a8804a", [2, 1], 12), []);
  const pins: V3[] = [
    [-0.9, 0.45, 0.02], [-0.3, 0.55, 0.02], [0.4, 0.4, 0.02], [0.95, 0.5, 0.02], [-0.6, -0.2, 0.02], [0.2, -0.35, 0.02], [0.9, -0.15, 0.02],
  ];
  const links: [number, number][] = [[0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [5, 6], [2, 6]];
  return (
    <group position={p}>
      <RB p={[0, 0, -0.02]} s={[2.4, 1.4, 0.04]} r={0.01} color="#5a3a20" />
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[2.3, 1.3]} />
        <meshStandardMaterial map={cork} roughness={1} />
      </mesh>
      {pins.map((q, i) => (
        <group key={i} position={q}>
          <mesh position={[0, -0.12, -0.005]} rotation={[0, 0, (i - 3) * 0.05]}>
            <planeGeometry args={[0.34, 0.24]} />
            <meshStandardMaterial map={labelTex("#e8e4dc", "#1a2a4a", ["PIPE", "DOOR", "VENT", "WALL", "SWAN", "MAP", "1-800"][i], "EXHIBIT " + (i + 1), 512, 360)} roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <sphereGeometry args={[0.018, 10, 8]} />
            <meshStandardMaterial color="#d02020" roughness={0.4} />
          </mesh>
        </group>
      ))}
      {links.map(([a, b], i) => {
        const k = Math.max(0, Math.min(1, strings * links.length - i));
        if (k <= 0) return null;
        const A = new THREE.Vector3(...pins[a]);
        const B = A.clone().lerp(new THREE.Vector3(...pins[b]), k);
        const mid = A.clone().add(B).multiplyScalar(0.5);
        const len = A.distanceTo(B);
        const ang = Math.atan2(B.y - A.y, B.x - A.x);
        return (
          <mesh key={i} position={[mid.x, mid.y, 0.02]} rotation={[0, 0, ang]}>
            <boxGeometry args={[len, 0.006, 0.004]} />
            <meshStandardMaterial color="#e02020" emissive="#801010" roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Living-room TV on a low cabinet (screen 1.25 × 0.7 m, centre at y = 1.05), the finale. */
export const TvSet: React.FC<{ p: V3; screenOn?: number }> = ({ p, screenOn = 1 }) => (
  <group position={p}>
    <RB p={[0, 0.25, 0]} s={[1.8, 0.5, 0.45]} r={0.03} color="#4a3628" rough={0.6} />
    {[-0.45, 0.45].map((x) => (
      <RB key={x} p={[x, 0.25, 0.226]} s={[0.84, 0.44, 0.01]} r={0.01} color="#3a2a1e" rough={0.6} />
    ))}
    <RB p={[0, 1.05, -0.05]} s={[1.32, 0.78, 0.05]} r={0.015} color="#0b0b0d" rough={0.3} metal={0.4} />
    <mesh position={[0, 1.05, -0.022]}>
      <planeGeometry args={[1.25, 0.7]} />
      <meshStandardMaterial color="#0a0c10" emissive="#203048" emissiveIntensity={0.6 * screenOn} roughness={0.1} />
    </mesh>
    <RB p={[0, 0.58, -0.05]} s={[0.3, 0.06, 0.2]} r={0.01} color="#0b0b0d" />
    <pointLight position={[0, 1.05, 0.6]} color="#6a8ac8" intensity={2.4 * screenOn} distance={4} decay={2} />
  </group>
);
