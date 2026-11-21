import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";
import { Car, House, RB, tex } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";
import { GumTree, KangarooSign } from "../airplane/props";

// ───────────────────────── a phone with any screen ─────────────────────────
/** phone (7.5 × 15.5 cm) facing +Z with a texture on its screen; `flash` lights the camera flash on the back */
export const PhoneMesh: React.FC<{ p?: V3; rot?: V3; screen?: THREE.Texture | null; flash?: number; s?: number }> = ({ p = [0, 0, 0], rot = [0, 0, 0], screen, flash = 0, s = 1 }) => (
  <group position={p} rotation={rot} scale={[s, s, s]}>
    <mesh>
      <boxGeometry args={[0.075, 0.155, 0.008]} />
      <meshStandardMaterial color="#1a1a1e" metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0, 0.0045]}>
      <planeGeometry args={[0.068, 0.145]} />
      {screen ? <meshBasicMaterial map={screen} toneMapped={false} /> : <meshBasicMaterial color="#0e1420" />}
    </mesh>
    <mesh position={[-0.022, 0.06, -0.0045]} rotation={[0, Math.PI, 0]}>
      <circleGeometry args={[0.007, 16]} />
      <meshBasicMaterial color={flash > 0 ? "#ffffff" : "#222"} toneMapped={false} />
    </mesh>
    {flash > 0 ? (
      <>
        <Glow position={[-0.022, 0.06, -0.05]} size={1.2 * flash} color="#ffffff" opacity={flash} />
        <pointLight position={[-0.022, 0.06, -0.15]} intensity={6 * flash} distance={6} color="#ffffff" />
      </>
    ) : null}
    <pointLight position={[0, 0, 0.12]} intensity={0.12} distance={0.8} color="#9fc0ff" />
  </group>
);

/** a phone on a little tripod (self-timer photo) */
export const TripodPhone: React.FC<{ p: V3; ry?: number; flash?: number }> = ({ p, ry = 0, flash = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    {[0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.sin(a) * 0.12, 0.42, Math.cos(a) * 0.12]} rotation={[Math.cos(a) * 0.28, 0, -Math.sin(a) * 0.28]}>
          <cylinderGeometry args={[0.012, 0.012, 0.88, 6]} />
          <meshStandardMaterial color="#222428" metalness={0.5} roughness={0.5} />
        </mesh>
      );
    })}
    <mesh position={[0, 0.88, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.06, 10]} />
      <meshStandardMaterial color="#222428" metalness={0.5} roughness={0.5} />
    </mesh>
    {/* the phone faces −Z (its camera looks at +Z, at the friend) */}
    <PhoneMesh p={[0, 1.0, 0]} rot={[0, Math.PI, 0]} flash={flash} s={1.2} />
  </group>
);

// ───────────────────────── chat screen textures ─────────────────────────
type Msg = { from: "her" | "me"; text?: string; photo?: boolean };
const chatCache = new Map<string, THREE.Texture>();
/** a messenger screen with bubbles (grandma's chat with the friend) */
export const chatTex = (msgs: Msg[], title = "Grandma 🇦🇺") => {
  const key = title + JSON.stringify(msgs);
  if (chatCache.has(key)) return chatCache.get(key)!;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 1024;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0f1622";
  g.fillRect(0, 0, 512, 1024);
  g.fillStyle = "#1c2636";
  g.fillRect(0, 0, 512, 120);
  g.fillStyle = "#fff";
  g.font = "bold 40px Arial";
  g.fillText(title, 30, 80);
  let y = 1000;
  for (const m of [...msgs].reverse()) {
    const h = m.photo ? 300 : 100;
    y -= h + 24;
    const x = m.from === "me" ? 150 : 24;
    g.fillStyle = m.from === "me" ? "#2f7cf6" : "#2a3446";
    g.beginPath();
    g.roundRect(x, y, 338, h, 28);
    g.fill();
    if (m.photo) {
      // the photo: the friend in the fox head (simple painted thumbnail)
      g.fillStyle = "#5a6a8a";
      g.fillRect(x + 14, y + 14, 310, 272);
      g.fillStyle = "#f08a2a";
      g.beginPath();
      g.arc(x + 169, y + 130, 70, 0, Math.PI * 2);
      g.fill();
      g.beginPath();
      g.moveTo(x + 110, y + 90);
      g.lineTo(x + 120, y + 30);
      g.lineTo(x + 150, y + 70);
      g.moveTo(x + 228, y + 90);
      g.lineTo(x + 218, y + 30);
      g.lineTo(x + 188, y + 70);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.ellipse(x + 169, y + 160, 44, 28, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#2ec4d6";
      g.beginPath();
      g.arc(x + 145, y + 118, 13, 0, Math.PI * 2);
      g.arc(x + 193, y + 118, 13, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#3a7bd5";
      g.fillRect(x + 104, y + 200, 130, 86);
    } else {
      g.fillStyle = "#fff";
      g.font = "34px Arial";
      g.fillText(m.text ?? "", x + 26, y + 62);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  chatCache.set(key, t);
  return t;
};

// ───────────────────────── London roof with a pigeon loft ─────────────────────────
/** pitched slate roofs, brick chimneys with pots, a flat roof terrace with a wooden pigeon loft */
export const LondonRoof: React.FC<{ t: number }> = ({ t }) => {
  const brick = usePbr("red_brick_03", [3, 2]);
  const slate = tex("shingles", "#4b5058", [6, 3], 3);
  const planks = tex("planks", "#7a5a3a", [2, 2], 5);
  const roofs = useMemo(() => {
    const r = seeded(31);
    return Array.from({ length: 14 }, (_, i) => ({ x: -40 + i * 7 + (r() - 0.5) * 2, z: -18 - r() * 30, h: 4 + r() * 5, w: 6 + r() * 2, ch: r() > 0.4 }));
  }, []);
  return (
    <group>
      {/* the flat terrace the camera stands on */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#6d6a66" roughness={0.95} />
      </mesh>
      {/* parapet walls */}
      <mesh position={[0, 0.45, -5]} castShadow receiveShadow>
        <boxGeometry args={[14, 0.9, 0.35]} />
        <meshStandardMaterial map={brick.map} normalMap={brick.normalMap} roughness={0.9} />
      </mesh>
      <mesh position={[-7, 0.45, 0]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[10, 0.9, 0.35]} />
        <meshStandardMaterial map={brick.map} normalMap={brick.normalMap} roughness={0.9} />
      </mesh>
      {/* the loft: a wooden box on legs with two landing boards */}
      <group position={[-2.2, 0, -3.4]}>
        {[-0.8, 0.8].map((x) =>
          [-0.4, 0.4].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.45, z]} castShadow>
              <boxGeometry args={[0.08, 0.9, 0.08]} />
              <meshStandardMaterial color="#5a4128" roughness={0.8} />
            </mesh>
          )),
        )}
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 1.0, 1.1]} />
          <meshStandardMaterial map={planks} roughness={0.85} />
        </mesh>
        <mesh position={[0, 2.0, 0]} rotation={[0.18, 0, 0]} castShadow>
          <boxGeometry args={[2.1, 0.06, 1.4]} />
          <meshStandardMaterial color="#3e4248" roughness={0.8} />
        </mesh>
        {[-0.5, 0.5].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.3, 0.56]}>
              <planeGeometry args={[0.32, 0.36]} />
              <meshStandardMaterial color="#120e0a" roughness={1} />
            </mesh>
            <mesh position={[x, 1.1, 0.7]} castShadow>
              <boxGeometry args={[0.5, 0.04, 0.3]} />
              <meshStandardMaterial color="#8a6a48" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
      {/* a chimney stack on our roof */}
      <group position={[4.6, 0, -4.2]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[1.6, 2.8, 0.8]} />
          <meshStandardMaterial map={brick.map} normalMap={brick.normalMap} roughness={0.9} />
        </mesh>
        {[-0.45, 0, 0.45].map((x) => (
          <mesh key={x} position={[x, 3.05, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.15, 0.5, 10]} />
            <meshStandardMaterial color="#b0603e" roughness={0.8} />
          </mesh>
        ))}
      </group>
      {/* the terraced roofs around: slate pitches + chimneys */}
      {roofs.map((q, i) => (
        <group key={i} position={[q.x, -6 + q.h * 0.2, q.z]}>
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[q.w, 6, 6]} />
            <meshStandardMaterial map={brick.map} roughness={0.9} color="#c9b0a0" />
          </mesh>
          {[-1, 1].map((d) => (
            <mesh key={d} position={[0, 4.0, d * 1.6]} rotation={[d * 0.7, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[q.w + 0.3, 0.15, 4.2]} />
              <meshStandardMaterial map={slate} roughness={0.85} />
            </mesh>
          ))}
          {q.ch ? (
            <mesh position={[q.w * 0.3, 5.4, 0]} castShadow>
              <boxGeometry args={[1, 2.2, 0.7]} />
              <meshStandardMaterial map={brick.map} roughness={0.9} />
            </mesh>
          ) : null}
        </group>
      ))}
      {/* more terraces further out, fading into the London haze */}
      {Array.from({ length: 40 }, (_, i) => {
        const row = Math.floor(i / 10);
        const x = -60 + (i % 10) * 13 + row * 5;
        const z = -60 - row * 28;
        const h = 8 + ((i * 37) % 7) * 1.6;
        return (
          <group key={i} position={[x, -8 + h / 2, z]}>
            <mesh>
              <boxGeometry args={[12, h, 10]} />
              <meshStandardMaterial map={brick.map} color="#b89a8a" roughness={0.95} />
            </mesh>
            <mesh position={[0, h / 2 + 1.6, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[7.6, 3.4, 4, 1]} />
              <meshStandardMaterial color="#5a5f68" roughness={0.9} />
            </mesh>
          </group>
        );
      })}
      {/* a church spire and a far tower block in the haze */}
      <mesh position={[22, 14, -120]}>
        <coneGeometry args={[2.5, 30, 6]} />
        <meshStandardMaterial color="#8a8f98" roughness={1} />
      </mesh>
      <fog attach="fog" args={["#c4ccd6", 30, 230]} />
    </group>
  );
};

// ───────────────────────── grandma's garden (from ep. 8, now with a garden table + chairs) ─────────────────────────
export const Garden: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const grass = tex("grass", "#6f8a3a", [30, 30]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial map={grass} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 14]} receiveShadow>
        <planeGeometry args={[300, 7]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.9} />
      </mesh>
      <House p={[0, 0, -6]} siding="#e8dcc0" lit={0.2} seed={4} />
      <GumTree p={[-9, 0, -4]} s={1.1} seed={2} />
      <GumTree p={[11, 0, -9]} s={1.3} seed={5} />
      <GumTree p={[-20, 0, -14]} s={1.5} seed={8} />
      <KangarooSign p={[5.5, 0, 10.6]} ry={-0.4} />
      <Car p={[-6, 0, 14]} color="#d8d8d0" ry={Math.PI / 2} />
      {/* garden table with a cup of tea */}
      <group position={[2.0, 0, 2.6]}>
        <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.04, 28]} />
          <meshStandardMaterial color="#f2f0ea" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.72, 8]} />
          <meshStandardMaterial color="#8a8f96" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0.15, 0.78, 0.1]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.09, 16]} />
          <meshStandardMaterial color="#e86a9a" roughness={0.4} />
        </mesh>
      </group>
      {/* a white garden chair */}
      <group position={[0.9, 0, 2.3]} rotation={[0, 0.35, 0]}>
        <RB p={[0, 0.45, 0]} s={[0.5, 0.05, 0.5]} r={0.02} color="#f4f2ec" />
        <RB p={[0, 0.75, -0.24]} s={[0.5, 0.55, 0.05]} r={0.02} color="#f4f2ec" />
        {[-0.22, 0.22].map((x) =>
          [-0.22, 0.22].map((z) => <RB key={`${x}${z}`} p={[x, 0.22, z]} s={[0.04, 0.45, 0.04]} r={0.01} color="#f4f2ec" />),
        )}
      </group>
      {children}
    </group>
  );
};

// ───────────────────────── the fibre close-up ─────────────────────────
/**
 * Macro of one glass fibre (125 µm, drawn 10 cm thick so it reads) next to a human hair at the same scale.
 * Axis along X. `pulse` 0–1 is where the light pulse is along the visible length; `hair` 0–1 fades the hair in.
 */
export const FibreMacro: React.FC<{ t: number; pulse: number; hair: number; len?: number }> = ({ t, pulse, hair, len = 24 }) => {
  const hairGeo = useMemo(() => {
    const pts = Array.from({ length: 40 }, (_, i) => new THREE.Vector3(-len / 2 + (len * i) / 39, 0.55 * Math.sin(i * 0.25) + 0.12 * Math.sin(i * 0.9), 0.4 * Math.cos(i * 0.21)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.045 * 0.8, 12, false);
  }, [len]);
  const px = -len / 2 + len * pulse;
  const R = 0.05; // cladding 125 µm → 0.05; the core (9 µm) → 0.0036, drawn a bit thicker to see it glow
  return (
    <group>
      {/* cladding: clear glass */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R, R, len, 32, 1, true]} />
        <meshPhysicalMaterial color="#dff6ff" roughness={0.05} metalness={0} transmission={0.9} thickness={0.1} transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* the core */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[R * 0.16, R * 0.16, len, 12]} />
        <meshStandardMaterial color="#7fe9ff" emissive="#3fd8ff" emissiveIntensity={0.35} />
      </mesh>
      {/* the pulse and its streak */}
      {pulse > 0 && pulse < 1 ? (
        <>
          <mesh position={[px - 0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[R * 0.2, R * 0.2, 1.8, 12]} />
            <meshBasicMaterial color="#e8fdff" toneMapped={false} />
          </mesh>
          <Glow position={[px, 0, 0]} size={0.9} color="#9ff4ff" opacity={1} />
          <Glow position={[px - 1, 0, 0]} size={0.6} color="#7ff6ff" opacity={0.7} />
          <pointLight position={[px, 0, 0.2]} intensity={2} distance={2} color="#9ff4ff" />
        </>
      ) : null}
      {/* a human hair at the same scale (≈ 70–100 µm), a little below the fibre */}
      {hair > 0 ? (
        <mesh geometry={hairGeo} position={[0, -0.32, 0]} scale={[1, hair, 1]}>
          <meshStandardMaterial color="#4a2e1c" roughness={0.45} />
        </mesh>
      ) : null}
      <Glow position={[Math.sin(t) * 0.2, 0, 0]} size={0.2} color="#7ff6ff" opacity={0.2} />
    </group>
  );
};

/** a green garden hose coil (to show the deep-sea cable is about the same thickness, 17 mm) */
export const GardenHose: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => {
  const geo = useMemo(() => {
    const pts = Array.from({ length: 120 }, (_, i) => {
      const a = (i / 120) * Math.PI * 2 * 3;
      const r = 1.2 + 0.05 * i * 0.03;
      return new THREE.Vector3(Math.cos(a) * r, 0.12 + i * 0.004, Math.sin(a) * r);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 360, 0.16, 10, false);
  }, []);
  return (
    <mesh geometry={geo} position={p} scale={[s, s, s]} castShadow>
      <meshStandardMaterial color="#3fae4a" roughness={0.45} />
    </mesh>
  );
};

// ───────────────────────── grandma's knitted shawl ─────────────────────────
let knitT: THREE.Texture | null = null;
const knitTex = () => {
  if (knitT) return knitT;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#b89ad0";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16)
    for (let x = 0; x < 256; x += 16) {
      g.fillStyle = (x + y) % 32 ? "#a888c4" : "#c4a8dc";
      g.beginPath();
      g.ellipse(x + 4, y + 8, 4, 7, 0.5, 0, Math.PI * 2);
      g.ellipse(x + 12, y + 8, 4, 7, -0.5, 0, Math.PI * 2);
      g.fill();
    }
  g.fillStyle = "#f2e6c8";
  g.fillRect(0, 236, 256, 20); // a cream border at the hem
  knitT = new THREE.CanvasTexture(c);
  knitT.wrapS = knitT.wrapT = THREE.RepeatWrapping;
  knitT.repeat.set(6, 1);
  knitT.colorSpace = THREE.SRGBColorSpace;
  return knitT;
};
/** a knitted shawl over the shoulders (a short open cone), hung on the "spine_03" bone; `rot`/`p` in bone space */
export const Shawl: React.FC<{ p?: V3; rot?: V3; s?: number; k?: V3 }> = ({ p = [0, 0, 0], rot = [0, 0, 0], s = 1, k = [1, 1, 1] }) => (
  <group position={p} rotation={rot} scale={[s * k[0], s * k[1], s * k[2]]}>
    <mesh castShadow>
      <cylinderGeometry args={[0.2, 0.42, 0.62, 48, 6, true]} />
      <meshStandardMaterial map={knitTex()} roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.2, 0.035, 8, 40]} />
      <meshStandardMaterial color="#9a7ab8" roughness={0.95} />
    </mesh>
  </group>
);
