import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "./core";

/**
 * Candidates for the running character "giant pocket puh" (build reels). All are giant soft toys / a mascot head,
 * ~1.5–1.8 m, origin on the floor, facing +Z, frame-driven with the same pose props:
 * `t` seconds, `dance` 0–1 (hop, sway, flapping limbs), `limp` 0–1 (floppy: falling, lying, hanging), `wave` 0–1.
 */
export type MascotProps = { p?: V3; ry?: number; s?: number; t?: number; dance?: number; limp?: number; wave?: number };

const fur = (color: string, sheen = "#ffffff") => new THREE.MeshPhysicalMaterial({ color, roughness: 1, sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color(sheen) });
const bead = () => new THREE.MeshPhysicalMaterial({ color: "#111318", roughness: 0.15, clearcoat: 1 });
const felt = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 1 });

/** Shared body motion: hop + sway + twist while dancing, a gentle breathing wobble otherwise. */
const useBounce = (t: number, dance: number) => {
  const ph = t * Math.PI * 2 * 1.05;
  return {
    ph,
    hop: dance * Math.abs(Math.sin(ph)) * 0.16,
    sway: dance * Math.sin(ph) * 0.16,
    twist: dance * Math.sin(ph * 0.5) * 0.4,
    wob: Math.sin(t * 1.6) * 0.015 * (1 - dance),
  };
};

const Wrap: React.FC<MascotProps & { children: React.ReactNode }> = ({ p = [0, 0, 0], ry = 0, s = 1, t = 0, dance = 0, children }) => {
  const b = useBounce(t, dance);
  return (
    <group position={p} rotation={[0, ry, 0]} scale={[s, s * (1 + b.wob), s]}>
      <group position={[0, b.hop, 0]} rotation={[0, b.twist, b.sway]}>
        {children}
      </group>
    </group>
  );
};

const Eye: React.FC<{ p: V3; r: number; mat: THREE.Material; glint?: boolean }> = ({ p, r, mat, glint = true }) => (
  <group position={p}>
    <mesh material={mat}>
      <sphereGeometry args={[r, 16, 12]} />
    </mesh>
    {glint ? (
      <mesh position={[r * 0.35, r * 0.35, r * 0.75]}>
        <sphereGeometry args={[r * 0.28, 8, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    ) : null}
  </group>
);

// ───────────────────────── A · capybara with an orange on its head ─────────────────────────
export const Capybara: React.FC<MascotProps> = (props) => {
  const { t = 0, dance = 0, limp = 0, wave = 0 } = props;
  const m = useMemo(() => ({ body: fur("#a8774c", "#e8c9a4"), dark: fur("#83593a"), nose: felt("#3a2a22"), bead: bead(), orange: new THREE.MeshPhysicalMaterial({ color: "#ff9418", roughness: 0.55, clearcoat: 0.4 }), leaf: felt("#3f9a3a") }), []);
  const b = useBounce(t, dance);
  const leg = (x: number, z: number, i: number) => {
    const kick = dance * Math.max(0, Math.sin(b.ph + i * Math.PI)) * 0.5 + limp * 0.4 * (i % 2 ? 1 : -1);
    return (
      <group key={i} position={[x, 0.42, z]} rotation={[-kick, 0, 0]}>
        <mesh material={m.body} position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.13, 0.25, 8, 14]} />
        </mesh>
        <mesh material={m.dark} position={[0, -0.4, 0.04]} scale={[1, 0.55, 1.3]}>
          <sphereGeometry args={[0.13, 14, 10]} />
        </mesh>
      </group>
    );
  };
  return (
    <Wrap {...props}>
      {/* barrel body, sitting a bit upright like a plush */}
      <group rotation={[-0.35 - 0.3 * dance * Math.sin(b.ph), 0, 0]} position={[0, 0.1, 0]}>
        <mesh material={m.body} position={[0, 0.62, 0]} scale={[0.62, 0.6, 0.8]} castShadow receiveShadow>
          <sphereGeometry args={[1, 40, 28]} />
        </mesh>
        {leg(0.32, 0.45, 0)}
        {leg(-0.32, 0.45, 1)}
        {leg(0.34, -0.45, 2)}
        {leg(-0.34, -0.45, 3)}
        {/* head: long rounded box-ish snout */}
        <group position={[0, 1.1, 0.62]} rotation={[0.45 - 0.2 * wave, 0, -b.sway * 0.5]}>
          <mesh material={m.body} scale={[0.36, 0.38, 0.52]} castShadow>
            <sphereGeometry args={[1, 32, 24]} />
          </mesh>
          <mesh material={m.dark} position={[0, -0.04, 0.4]} scale={[0.3, 0.27, 0.2]}>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
          {/* big flat nose pad + nostrils */}
          <mesh material={m.nose} position={[0, 0.05, 0.56]} scale={[0.17, 0.08, 0.05]}>
            <sphereGeometry args={[1, 20, 12]} />
          </mesh>
          {/* half-closed sleepy eyes: bead under a fur lid */}
          {[-1, 1].map((k) => (
            <group key={k} position={[0.27 * k, 0.16, 0.22]}>
              <mesh material={m.bead} scale={[0.06, 0.045, 0.05]}>
                <sphereGeometry args={[1, 14, 10]} />
              </mesh>
              <mesh material={m.body} position={[0, 0.022, 0.006]} scale={[0.068, 0.04, 0.058]}>
                <sphereGeometry args={[1, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              </mesh>
            </group>
          ))}
          {/* little round ears */}
          {[-1, 1].map((k) => (
            <mesh key={k} material={m.dark} position={[0.25 * k, 0.33, -0.18]} scale={[0.1, 0.1, 0.05]} rotation={[0, 0.4 * k, 0]}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
          ))}
          {/* the orange (bounces when dancing) */}
          <group position={[0, 0.48 + dance * Math.abs(Math.sin(b.ph + 0.6)) * 0.12, -0.05]}>
            <mesh material={m.orange} castShadow>
              <sphereGeometry args={[0.17, 28, 20]} />
            </mesh>
            <mesh material={m.leaf} position={[0.05, 0.17, 0]} rotation={[0, 0, -0.7]} scale={[0.09, 0.025, 0.05]}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          </group>
        </group>
      </group>
    </Wrap>
  );
};

// ───────────────────────── B · plush shark standing on its tail ─────────────────────────
export const PlushShark: React.FC<MascotProps> = (props) => {
  const { t = 0, dance = 0, limp = 0, wave = 0 } = props;
  const b = useBounce(t, dance);
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const y = 0.3 + u * 1.45;
      const r = 0.44 * Math.sin(Math.min(1, u * 1.15) * Math.PI * 0.92 + 0.1) * (u > 0.85 ? Math.sqrt(Math.max(0, 1 - ((u - 0.85) / 0.155) ** 2)) * 0.9 + 0.1 : 1);
      pts.push(new THREE.Vector2(Math.max(0.02, r), y));
    }
    const g = new THREE.LatheGeometry(pts, 48);
    // white belly in front, blue-grey back
    const pos = g.attributes.position as THREE.BufferAttribute;
    const col: number[] = [];
    const back = new THREE.Color("#6f93b6");
    const belly = new THREE.Color("#f4f1ea");
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const x = pos.getX(i);
      const k = THREE.MathUtils.smoothstep(z / Math.max(0.01, Math.hypot(x, z)), 0.55, 0.8);
      const c2 = back.clone().lerp(belly, k);
      col.push(c2.r, c2.g, c2.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, []);
  const m = useMemo(() => ({ skin: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 1, sheen: 1, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffffff") }), fin: fur("#6a8eb2"), mouth: felt("#7a2233"), tooth: felt("#ffffff"), bead: bead() }), []);
  const flap = dance * Math.sin(b.ph * 2) * 0.6;
  const fin = (k: 1 | -1) => (
    <group position={[0.36 * k, 0.95, 0.05]} rotation={[0, 0, k * (-0.9 - 0.5 * limp - (k > 0 ? wave * 1.6 : 0) - flap * k)]}>
      <mesh material={m.fin} position={[0, -0.22, 0]} scale={[0.07, 0.3, 0.17]} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
    </group>
  );
  return (
    <Wrap {...props}>
      <mesh geometry={geo} material={m.skin} castShadow receiveShadow />
      {/* open felt mouth with a row of soft teeth */}
      <mesh material={m.mouth} position={[0, 1.22, 0.36]} scale={[0.2, 0.08, 0.06]}>
        <sphereGeometry args={[1, 24, 12]} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} material={m.tooth} position={[-0.15 + i * 0.05, 1.27, 0.39]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.02, 0.05, 6]} />
        </mesh>
      ))}
      {[-1, 1].map((k) => (
        <Eye key={k} p={[0.2 * k, 1.42, 0.31]} r={0.045} mat={m.bead} />
      ))}
      {/* gill slits */}
      {[-1, 1].map((k) =>
        [0, 1, 2].map((j) => (
          <mesh key={`${k}${j}`} position={[0.4 * k, 1.12 - j * 0.07, -0.02]} rotation={[0, k * 1.3, 0]}>
            <boxGeometry args={[0.12, 0.012, 0.01]} />
            <meshStandardMaterial color="#3d5875" />
          </mesh>
        )),
      )}
      {/* dorsal fin on the back */}
      <mesh material={m.fin} position={[0, 1.05, -0.42]} rotation={[-0.6, 0, 0]} scale={[0.05, 0.28, 0.18]} castShadow>
        <coneGeometry args={[1, 1, 3]} />
      </mesh>
      {fin(1)}
      {fin(-1)}
      {/* tail fin = feet */}
      {[-1, 1].map((k) => (
        <mesh key={k} material={m.fin} position={[0.2 * k, 0.12, 0.05]} rotation={[0, 0, k * (0.9 + dance * Math.max(0, Math.sin(b.ph * 2 * k)) * 0.4)]} scale={[0.08, 0.26, 0.16]} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ))}
    </Wrap>
  );
};

// ───────────────────────── C · axolotl ─────────────────────────
export const Axolotl: React.FC<MascotProps> = (props) => {
  const { t = 0, dance = 0, limp = 0, wave = 0 } = props;
  const b = useBounce(t, dance);
  const m = useMemo(() => ({ body: fur("#ffaec6"), belly: fur("#ffd6e3"), gill: fur("#e2457f", "#ffb3d0"), bead: bead(), mouth: felt("#9a2c55"), blush: felt("#ff7fa8") }), []);
  const smile = useMemo(() => new THREE.TorusGeometry(0.16, 0.014, 6, 28, Math.PI * 0.75), []);
  const gill = (k: 1 | -1, j: number) => {
    const a = 0.5 + j * 0.42; // fan out from the side of the head
    const wig = dance * Math.sin(b.ph * 2 + j) * 0.25 + limp * 0.3;
    return (
      <group key={`${k}${j}`} position={[0.52 * k, 1.43 + 0.05 * (1 - j), -0.05]} rotation={[0, 0, k * (-a - wig) + (k > 0 ? 0 : 0)]}>
        <mesh material={m.gill} position={[0, 0.17, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.28, 6, 10]} />
        </mesh>
        {[0, 1, 2, 3].map((q) => (
          <mesh key={q} material={m.gill} position={[0.04 * (q % 2 ? 1 : -1), 0.08 + q * 0.07, 0]} scale={[0.07, 0.04, 0.06]}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        ))}
      </group>
    );
  };
  const arm = (k: 1 | -1, up: number) => (
    <group position={[0.4 * k, 0.8, 0.12]} rotation={[0, 0, k * (0.9 + 0.4 * limp + up)]}>
      <mesh material={m.body} position={[0, -0.16, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.2, 6, 12]} />
      </mesh>
      {[-1, 0, 1].map((q) => (
        <mesh key={q} material={m.body} position={[q * 0.04, -0.32, 0.02]}>
          <sphereGeometry args={[0.035, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
  return (
    <Wrap {...props}>
      {/* chubby body + belly */}
      <mesh material={m.body} position={[0, 0.62, 0]} scale={[0.5, 0.6, 0.46]} castShadow receiveShadow>
        <sphereGeometry args={[1, 36, 24]} />
      </mesh>
      <mesh material={m.belly} position={[0, 0.56, 0.2]} scale={[0.36, 0.44, 0.3]}>
        <sphereGeometry args={[1, 28, 20]} />
      </mesh>
      {/* tail lying behind */}
      <mesh material={m.body} position={[0, 0.25, -0.55]} rotation={[0.9, 0, dance * Math.sin(b.ph) * 0.4]} scale={[0.12, 0.42, 0.24]} castShadow>
        <sphereGeometry args={[1, 18, 12]} />
      </mesh>
      {/* stubby legs */}
      {[-1, 1].map((k) => (
        <mesh key={k} material={m.body} position={[0.27 * k, 0.12, 0.2]} scale={[0.15, 0.12, 0.2]} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
      ))}
      {arm(1, wave * 1.8 + dance * (1.3 + 0.5 * Math.sin(b.ph)))}
      {arm(-1, dance * (1.3 + 0.5 * Math.sin(b.ph + 2)))}
      {/* wide head */}
      <group position={[0, 1.33, 0.02]} rotation={[0, 0, -b.sway * 0.5]}>
        <mesh material={m.body} scale={[0.58, 0.4, 0.46]} castShadow>
          <sphereGeometry args={[1, 36, 24]} />
        </mesh>
        {[-1, 1].map((k) => (
          <Eye key={k} p={[0.3 * k, 0.08, 0.38]} r={0.05} mat={m.bead} />
        ))}
        {[-1, 1].map((k) => (
          <mesh key={k} material={m.blush} position={[0.36 * k, -0.04, 0.32]} rotation={[0, 0.7 * k, 0]} scale={[0.06, 0.035, 0.02]}>
            <sphereGeometry args={[1, 12, 8]} />
          </mesh>
        ))}
        <mesh geometry={smile} material={m.mouth} position={[0, -0.04, 0.42]} rotation={[0.3, 0, Math.PI * 1.125]} />
      </group>
      {[-1, 1].map((k) => [0, 1, 2].map((j) => gill(k as 1 | -1, j)))}
    </Wrap>
  );
};

// ───────────────────────── D · giant fox mascot head (fursuit mask) ─────────────────────────
/** A huge foam fox head (~1.2 m), like a mascot costume. Rests on its neck opening. */
export const FoxHead: React.FC<MascotProps> = (props) => {
  const { t = 0, dance = 0, limp = 0 } = props;
  const b = useBounce(t, dance);
  const m = useMemo(() => ({ orange: fur("#ef7a2b", "#ffd2a8"), white: fur("#fbf4ea"), black: fur("#26211f"), eyeW: new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.2, clearcoat: 1 }), bead: bead(), tongue: new THREE.MeshPhysicalMaterial({ color: "#ff6f8e", roughness: 0.4, clearcoat: 0.6 }), nose: new THREE.MeshPhysicalMaterial({ color: "#1b1715", roughness: 0.2, clearcoat: 1 }), mouth: felt("#5a1a24") }), []);
  const earWig = dance * Math.sin(b.ph * 2) * 0.2 + limp * 0.4;
  return (
    <Wrap {...props}>
      <group position={[0, 0.62, 0]}>
        {/* foam head */}
        <mesh material={m.orange} scale={[0.62, 0.55, 0.56]} castShadow receiveShadow>
          <sphereGeometry args={[1, 40, 28]} />
        </mesh>
        {/* fluffy white cheek tufts */}
        {[-1, 1].map((k) => (
          <mesh key={k} material={m.white} position={[0.52 * k, -0.14, 0.12]} rotation={[0, 0, k * -1.2]} scale={[0.2, 0.3, 0.2]} castShadow>
            <coneGeometry args={[1, 1, 16]} />
          </mesh>
        ))}
        {/* muzzle + nose */}
        <mesh material={m.white} position={[0, -0.12, 0.42]} scale={[0.32, 0.22, 0.3]} castShadow>
          <sphereGeometry args={[1, 28, 20]} />
        </mesh>
        <mesh material={m.nose} position={[0, -0.02, 0.72]} scale={[0.09, 0.065, 0.06]}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        {/* open grin with the tongue hanging out */}
        <mesh material={m.mouth} position={[0, -0.22, 0.6]} scale={[0.18, 0.07, 0.05]}>
          <sphereGeometry args={[1, 20, 12]} />
        </mesh>
        <mesh material={m.tongue} position={[0.06, -0.31, 0.62]} rotation={[0.4, 0, 0.25 + dance * Math.sin(b.ph * 2) * 0.3]} castShadow>
          <capsuleGeometry args={[0.06, 0.14, 6, 12]} />
        </mesh>
        {/* big toon eyes, slightly derpy */}
        {[-1, 1].map((k) => (
          <group key={k} position={[0.22 * k, 0.15, 0.44]} rotation={[0, 0.35 * k, 0]}>
            <mesh material={m.eyeW} scale={[0.15, 0.18, 0.06]}>
              <sphereGeometry args={[1, 24, 16]} />
            </mesh>
            <mesh material={m.bead} position={[-0.035 * k, -0.02, 0.05]} scale={[0.085, 0.1, 0.03]}>
              <sphereGeometry args={[1, 18, 12]} />
            </mesh>
            <mesh position={[-0.01 * k + 0.02, 0.03, 0.075]}>
              <sphereGeometry args={[0.025, 10, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* eyebrow */}
            <mesh material={m.black} position={[0, 0.23, 0.02]} rotation={[0, 0, k * 0.25]} scale={[0.11, 0.025, 0.02]}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          </group>
        ))}
        {/* tall ears: orange outside, white inside, black tips */}
        {[-1, 1].map((k) => (
          <group key={k} position={[0.34 * k, 0.42, -0.05]} rotation={[0, 0, k * (-0.35 - earWig)]}>
            <mesh material={m.orange} position={[0, 0.25, 0]} scale={[0.17, 0.5, 0.08]} castShadow>
              <coneGeometry args={[1, 1, 20]} />
            </mesh>
            <mesh material={m.white} position={[0, 0.2, 0.05]} scale={[0.1, 0.35, 0.03]}>
              <coneGeometry args={[1, 1, 16]} />
            </mesh>
            <mesh material={m.black} position={[0, 0.44, 0]} scale={[0.06, 0.12, 0.04]}>
              <coneGeometry args={[1, 1, 12]} />
            </mesh>
          </group>
        ))}
        {/* neck opening fringe at the bottom */}
        <mesh material={m.white} position={[0, -0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.36, 0.1, 12, 32]} />
        </mesh>
      </group>
    </Wrap>
  );
};

// ───────────────────────── E · giant rubber duck ─────────────────────────
export const RubberDuck: React.FC<MascotProps> = (props) => {
  const { t = 0, dance = 0, wave = 0 } = props;
  const b = useBounce(t, dance);
  const m = useMemo(() => ({ rubber: new THREE.MeshPhysicalMaterial({ color: "#ffd21a", roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 }), beak: new THREE.MeshPhysicalMaterial({ color: "#ff7a12", roughness: 0.3, clearcoat: 1 }), bead: bead(), white: felt("#ffffff") }), []);
  const flap = dance * Math.sin(b.ph * 2) * 0.5 + wave * 0.8;
  return (
    <Wrap {...props}>
      <mesh material={m.rubber} position={[0, 0.48, -0.05]} scale={[0.66, 0.48, 0.82]} castShadow receiveShadow>
        <sphereGeometry args={[1, 40, 28]} />
      </mesh>
      {/* tail point */}
      <mesh material={m.rubber} position={[0, 0.72, -0.8]} rotation={[-1.0, 0, 0]} scale={[0.22, 0.3, 0.16]} castShadow>
        <coneGeometry args={[1, 1, 20]} />
      </mesh>
      {/* wings */}
      {[-1, 1].map((k) => (
        <mesh key={k} material={m.rubber} position={[0.6 * k, 0.55, -0.05]} rotation={[0.2, 0, k * (0.3 + flap)]} scale={[0.1, 0.24, 0.4]} castShadow>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
      ))}
      {/* head */}
      <group position={[0, 1.12, 0.32]} rotation={[0, 0, -b.sway * 0.4]}>
        <mesh material={m.rubber} castShadow>
          <sphereGeometry args={[0.42, 36, 26]} />
        </mesh>
        <mesh material={m.beak} position={[0, -0.06, 0.4]} scale={[0.24, 0.07, 0.2]}>
          <sphereGeometry args={[1, 24, 14]} />
        </mesh>
        <mesh material={m.beak} position={[0, -0.13, 0.36]} scale={[0.2, 0.05, 0.16]}>
          <sphereGeometry args={[1, 24, 14]} />
        </mesh>
        {[-1, 1].map((k) => (
          <group key={k} position={[0.17 * k, 0.12, 0.33]}>
            <mesh material={m.white} scale={[0.09, 0.1, 0.05]}>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
            <Eye p={[0, -0.01, 0.04]} r={0.045} mat={m.bead} />
          </group>
        ))}
      </group>
    </Wrap>
  );
};

// ───────────────────────── the pick: a fursuit head (what furries wear) ─────────────────────────
let furNoise: THREE.Texture | null = null;
/** Per-pixel random strand heights; shells discard below their threshold → fuzzy fur. */
const furNoiseTex = () => {
  if (furNoise) return furNoise;
  const n = 256;
  const c = document.createElement("canvas");
  c.width = c.height = n;
  const g = c.getContext("2d")!;
  const img = g.createImageData(n, n);
  let s = 1234567;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n * n; i++) {
    const v = Math.pow(rnd(), 0.7) * 255;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  furNoise = new THREE.CanvasTexture(c);
  furNoise.wrapS = furNoise.wrapT = THREE.RepeatWrapping;
  furNoise.repeat.set(10, 6);
  furNoise.magFilter = THREE.NearestFilter;
  furNoise.minFilter = THREE.NearestFilter;
  return furNoise;
};

/** A furry ellipsoid: solid base + `layers` fuzzy shells growing outward (shell-texture fur). */
const Fluffy: React.FC<{ p?: V3; s: V3; rot?: V3; color: string; tip?: string; length?: number; layers?: number }> = ({ p = [0, 0, 0], s, rot, color, tip, length = 0.05, layers = 6 }) => {
  const mats = useMemo(() => {
    const base = new THREE.Color(color);
    const end = new THREE.Color(tip ?? color).lerp(new THREE.Color("#ffffff"), tip ? 0 : 0.12);
    return Array.from({ length: layers }, (_, i) => {
      const k = (i + 1) / layers;
      return new THREE.MeshStandardMaterial({ color: base.clone().lerp(end, k), roughness: 1, alphaMap: furNoiseTex(), alphaTest: 0.15 + 0.75 * k });
    });
  }, [color, tip, layers]);
  const solid = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 1 }), [color]);
  return (
    <group position={p} rotation={rot}>
      <mesh material={solid} scale={s} castShadow receiveShadow>
        <sphereGeometry args={[1, 40, 28]} />
      </mesh>
      {mats.map((m, i) => {
        const g = 1 + (length * (i + 1)) / layers / Math.min(...s);
        return (
          <mesh key={i} material={m} scale={[s[0] * g, s[1] * g, s[2] * g]}>
            <sphereGeometry args={[1, 40, 28]} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Fur tuft: a pointed fluffy cone along +Y (cheeks, bangs, ear fluff, neck ruff). */
const tuftGeo = new THREE.ConeGeometry(1, 1, 20, 4);
tuftGeo.translate(0, 0.5, 0);
const Tuft: React.FC<{ p: V3; rot: V3; s: V3; color: string }> = ({ p, rot, s, color }) => {
  const mats = useMemo(() => {
    const base = new THREE.Color(color);
    return [
      new THREE.MeshStandardMaterial({ color, roughness: 1 }),
      ...[0, 1, 2].map((i) => new THREE.MeshStandardMaterial({ color: base.clone().lerp(new THREE.Color("#ffffff"), 0.08 * (i + 1)), roughness: 1, alphaMap: furNoiseTex(), alphaTest: 0.3 + 0.2 * i })),
    ];
  }, [color]);
  return (
    <group position={p} rotation={rot}>
      {mats.map((m, i) => (
        <mesh key={i} geometry={tuftGeo} material={m} scale={[s[0] * (1 + 0.18 * i), s[1] * (1 + 0.04 * i), s[2] * (1 + 0.18 * i)]} castShadow={i === 0} />
      ))}
    </group>
  );
};

export const FURSUIT = { fur: "#ef7d2e", cream: "#fff3e3", dark: "#3a2620", iris: "#2ec4d6" };

/**
 * Fursuit head, fox style (~0.75 m tall with ears at s = 0.6). Origin = centre of the neck opening, so it can sit
 * on the floor or be worn: put it on the "Head" bone with `Model attach` (see WORN_OFFSET).
 * Toon eyes (big aqua iris, two glints, friendly lids), cream muzzle with a black nose, open smile with a tongue,
 * cheek fluff, bangs, big ears with inner fluff, a fur ruff around the neck.
 */
export const FursuitHead: React.FC<MascotProps & { blink?: number }> = (props) => {
  const { t = 0, dance = 0, limp = 0, blink = 0 } = props;
  const b = useBounce(t, dance);
  const C = FURSUIT;
  const m = useMemo(
    () => ({
      eyeW: new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.15, clearcoat: 1 }),
      iris: new THREE.MeshPhysicalMaterial({ color: C.iris, roughness: 0.2, clearcoat: 1, emissive: C.iris, emissiveIntensity: 0.15 }),
      pupil: bead(),
      nose: new THREE.MeshPhysicalMaterial({ color: "#1d1716", roughness: 0.2, clearcoat: 1 }),
      mouth: felt("#4a1622"),
      tongue: new THREE.MeshPhysicalMaterial({ color: "#ff7b98", roughness: 0.45, clearcoat: 0.5 }),
      tooth: felt("#ffffff"),
      lid: new THREE.MeshStandardMaterial({ color: C.fur, roughness: 1 }),
    }),
    [C.iris, C.fur],
  );
  const smile = useMemo(() => new THREE.TorusGeometry(0.17, 0.02, 8, 28, Math.PI * 0.85), []);
  const earWig = dance * Math.sin(b.ph * 2) * 0.18 + limp * 0.35;
  const lid = 0.35 + 0.55 * blink; // how far the upper lid comes down
  return (
    <Wrap {...props}>
      <group position={[0, 0.62, 0]}>
        {/* head + cream muzzle + cheek patches */}
        <Fluffy s={[0.6, 0.55, 0.56]} color={C.fur} length={0.06} />
        <Fluffy p={[0, -0.13, 0.43]} s={[0.33, 0.24, 0.3]} color={C.cream} length={0.035} />
        {[-1, 1].map((k) => (
          <Fluffy key={k} p={[0.3 * k, -0.18, 0.28]} s={[0.24, 0.2, 0.2]} color={C.cream} length={0.04} />
        ))}
        {/* cheek fluff sticking out sideways */}
        {[-1, 1].map((k) =>
          [0, 1, 2].map((j) => <Tuft key={`${k}${j}`} p={[0.46 * k, -0.08 - j * 0.1, 0.18 - j * 0.05]} rot={[0, 0, k * (-1.35 - j * 0.3)]} s={[0.07, 0.24 - j * 0.03, 0.06]} color={C.cream} />),
        )}
        {/* bangs */}
        {[-0.16, 0, 0.16].map((x, i) => (
          <Tuft key={i} p={[x, 0.46, 0.22]} rot={[2.0, 0, -x * 1.5]} s={[0.08, 0.2, 0.07]} color={C.fur} />
        ))}
        {/* cream eyebrow markings */}
        {[-1, 1].map((k) => (
          <mesh key={k} position={[0.2 * k, 0.34, 0.49]} rotation={[-0.5, 0.3 * k, k * 0.3]} scale={[0.11, 0.04, 0.03]}>
            <sphereGeometry args={[1, 14, 10]} />
            <meshStandardMaterial color={C.cream} roughness={1} />
          </mesh>
        ))}
        {/* toon eyes */}
        {[-1, 1].map((k) => (
          <group key={k} position={[0.21 * k, 0.13, 0.535]} rotation={[-0.1, 0.32 * k, 0]}>
            <mesh material={m.eyeW} scale={[0.14, 0.17, 0.075]}>
              <sphereGeometry args={[1, 28, 20]} />
            </mesh>
            <mesh material={m.iris} position={[-0.012 * k, -0.02, 0.058]} scale={[0.1, 0.12, 0.025]}>
              <sphereGeometry args={[1, 24, 16]} />
            </mesh>
            <mesh material={m.pupil} position={[-0.012 * k, -0.025, 0.079]} scale={[0.055, 0.07, 0.012]}>
              <sphereGeometry args={[1, 18, 12]} />
            </mesh>
            <mesh position={[0.03 - 0.012 * k, 0.03, 0.092]}>
              <sphereGeometry args={[0.024, 10, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-0.04 - 0.012 * k, -0.07, 0.088]}>
              <sphereGeometry args={[0.012, 8, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* upper lid (friendly half-moon look) + dark lash line */}
            <mesh material={m.lid} position={[0, 0.235 - 0.13 * lid, 0.012]} scale={[0.155, 0.07 + 0.05 * lid, 0.08]}>
              <sphereGeometry args={[1, 20, 12]} />
            </mesh>
            <mesh position={[0, 0.235 - 0.13 * lid - 0.07 - 0.05 * lid, 0.07]} scale={[0.14, 0.012, 0.02]}>
              <sphereGeometry args={[1, 16, 8]} />
              <meshStandardMaterial color={C.dark} />
            </mesh>
          </group>
        ))}
        {/* nose + open smile + fangs + tongue */}
        <mesh material={m.nose} position={[0, -0.02, 0.745]} scale={[0.1, 0.07, 0.065]}>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
        <mesh position={[-0.03, 0.01, 0.8]}>
          <sphereGeometry args={[0.018, 8, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh material={m.mouth} position={[0, -0.2, 0.635]} scale={[0.17, 0.09, 0.06]}>
          <sphereGeometry args={[1, 24, 14]} />
        </mesh>
        <mesh geometry={smile} material={m.nose} position={[0, -0.1, 0.66]} rotation={[0.2, 0, Math.PI * 1.075]} />
        {[-1, 1].map((k) => (
          <mesh key={k} material={m.tooth} position={[0.08 * k, -0.14, 0.68]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.018, 0.05, 8]} />
          </mesh>
        ))}
        <mesh material={m.tongue} position={[0.05, -0.27, 0.665]} rotation={[0.5, 0, 0.2 + dance * Math.sin(b.ph * 2) * 0.35]} castShadow>
          <capsuleGeometry args={[0.055, 0.12, 6, 12]} />
        </mesh>
        {/* big ears with inner fluff and dark tips */}
        {[-1, 1].map((k) => (
          <group key={k} position={[0.33 * k, 0.4, -0.04]} rotation={[-0.1, 0, k * (-0.3 - earWig)]}>
            <mesh position={[0, 0.27, 0]} scale={[0.18, 0.54, 0.09]} castShadow>
              <coneGeometry args={[1, 1, 24]} />
              <meshStandardMaterial color={C.fur} roughness={1} />
            </mesh>
            <mesh position={[0, 0.48, 0]} scale={[0.07, 0.13, 0.05]}>
              <coneGeometry args={[1, 1, 16]} />
              <meshStandardMaterial color={C.dark} roughness={1} />
            </mesh>
            {[0, 1, 2].map((j) => (
              <Tuft key={j} p={[0.03 * (j - 1), 0.05 + j * 0.06, 0.06]} rot={[0.15, 0, (j - 1) * 0.3]} s={[0.05, 0.2, 0.03]} color={C.cream} />
            ))}
          </group>
        ))}
        {/* fur ruff around the neck opening */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <Tuft key={i} p={[Math.cos(a) * 0.32, -0.42, Math.sin(a) * 0.3]} rot={[Math.sin(a) * 2.5, 0, -Math.cos(a) * 2.5]} s={[0.11, 0.13, 0.11]} color={i % 2 ? C.cream : C.fur} />;
        })}
      </group>
    </Wrap>
  );
};
