import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "./core";
import { RB } from "./diorama";
import { seeded } from "../timing";

// Spaceflight kit for the rocket build reel. 1 unit = 1 m, frame-driven props only.

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// ───────────────────────── engine flame ─────────────────────────
/** Rocket exhaust pointing down from the origin: white-hot core, orange plume, glow. `len` metres, `t` seconds. */
const flameMat = (inner: string, outer: string) =>
  new THREE.ShaderMaterial({
    uniforms: { uIn: { value: new THREE.Color(inner) }, uOut: { value: new THREE.Color(outer) }, uO: { value: 1 }, uT: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uIn; uniform vec3 uOut; uniform float uO; uniform float uT; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float along = clamp(vUv.y, 0.0, 1.0);        // 0 at the tip, 1 at the nozzle
        // the cone tip has a zero-length normal: guard it, or one NaN pixel gets smeared over the frame by bloom
        vec3 n = vN + vec3(1e-4);
        float edge = clamp(abs(dot(normalize(n), normalize(vV + vec3(1e-4)))), 0.0, 1.0);
        float flick = 0.85 + 0.15 * sin(uT * 9.0 + along * 14.0);
        float a = clamp(pow(along, 1.6) * pow(edge, 1.3) * flick * uO, 0.0, 1.0);
        vec3 c = mix(uOut, uIn, pow(along, 3.0) * edge);
        if (a != a) discard;
        gl_FragColor = vec4(clamp(c * 1.6, 0.0, 4.0), a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

/** Rocket exhaust pointing down from the origin: white-hot core, orange plume, glow. `len` metres, `t` seconds. */
export const Flame: React.FC<{ p?: V3; len: number; r: number; t: number; o?: number; vacuum?: number }> = ({ p = [0, 0, 0], len, r, t, o = 1, vacuum = 0 }) => {
  const core = useMemo(() => flameMat("#ffffff", "#ffd27a"), []);
  const plume = useMemo(() => flameMat("#ffe0a0", "#ff5a14"), []);
  if (o <= 0.001) return null;
  core.uniforms.uO.value = o;
  core.uniforms.uT.value = t;
  plume.uniforms.uO.value = 0.8 * o;
  plume.uniforms.uT.value = t + 1.3;
  const pulse = 1 + 0.04 * Math.sin(t * 7.3) + 0.03 * Math.sin(t * 12.1);
  const spread = 1 + vacuum * 1.4; // the plume balloons out in thin air
  return (
    <group position={p}>
      {/* cones point down: tip (uv.y = 0) at the bottom */}
      <mesh material={core} position={[0, (-len * 0.45 * pulse) / 2, 0]} rotation={[Math.PI, 0, 0]} scale={[1, pulse, 1]}>
        <coneGeometry args={[r * 0.6, len * 0.45, 32, 8, true]} />
      </mesh>
      <mesh material={plume} position={[0, (-len * pulse) / 2, 0]} rotation={[Math.PI, 0, 0]} scale={[spread, pulse, spread]}>
        <coneGeometry args={[r * 1.15, len, 32, 8, true]} />
      </mesh>
      <Glow position={[0, -len * 0.12, 0]} size={r * 5 * spread} color="#fff0c0" opacity={0.9 * o} />
      <Glow position={[0, -len * 0.5, 0]} size={r * 8 * spread} color="#ff9a3a" opacity={0.5 * o} />
    </group>
  );
};

// ───────────────────────── the rocket ─────────────────────────
export const RK = { r: 1.85, s1: 26, inter: 2.4, s2: 10, cap: 3.6 } as const;
/** Height of each part's base above the rocket origin (bottom of stage 1). */
export const rkY = { s1: 0, s2: RK.s1 + RK.inter, cap: RK.s1 + RK.inter + RK.s2 + 0.4, top: RK.s1 + RK.inter + RK.s2 + 0.4 + RK.cap };

const stripeTex = () => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f2f2ee";
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = "#1b1d22";
  g.fillRect(0, 0, 64, 64);
  g.fillRect(128, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
};
const labelTex = (text: string) => {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 1024;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f2f2ee";
  g.fillRect(0, 0, 128, 1024);
  g.save();
  g.translate(64, 512);
  g.rotate(-Math.PI / 2);
  g.font = "bold 92px Arial, sans-serif";
  g.fillStyle = "#c0392b";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 0, 0);
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** A see-through tank section with two propellants (kerosene orange below, liquid oxygen blue above). */
const Tank: React.FC<{ y: number; h: number; r: number; fuel: number; xray: number }> = ({ y, h, r, fuel, xray }) => {
  if (xray <= 0.01) return null;
  const f = clamp01(fuel);
  const half = h / 2;
  return (
    <group position={[0, y, 0]}>
      {/* RP-1 (bottom half of the tank stack) */}
      {f > 0 ? (
        <mesh position={[0, (half * Math.min(1, f * 2)) / 2, 0]}>
          <cylinderGeometry args={[r * 0.92, r * 0.92, half * Math.min(1, f * 2), 40]} />
          <meshStandardMaterial color="#ff9a2e" emissive="#ff7a10" emissiveIntensity={0.35} transparent opacity={0.85 * xray} depthWrite={false} />
        </mesh>
      ) : null}
      {/* LOX */}
      {f > 0.5 ? (
        <mesh position={[0, half + (half * (f - 0.5) * 2) / 2, 0]}>
          <cylinderGeometry args={[r * 0.92, r * 0.92, half * (f - 0.5) * 2, 40]} />
          <meshStandardMaterial color="#5fb7ff" emissive="#2a7fff" emissiveIntensity={0.35} transparent opacity={0.85 * xray} depthWrite={false} />
        </mesh>
      ) : null}
      {/* common bulkhead */}
      <mesh position={[0, half, 0]}>
        <cylinderGeometry args={[r * 0.93, r * 0.93, 0.08, 40]} />
        <meshStandardMaterial color="#d8dde3" transparent opacity={xray} depthWrite={false} />
      </mesh>
    </group>
  );
};

const Engine: React.FC<{ p: V3; r: number }> = ({ p, r }) => (
  <group position={p}>
    <mesh position={[0, -r * 0.9, 0]}>
      <cylinderGeometry args={[r * 0.45, r, r * 1.6, 28, 1, true]} />
      <meshStandardMaterial color="#3a3530" metalness={0.85} roughness={0.35} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, -0.05, 0]}>
      <cylinderGeometry args={[r * 0.5, r * 0.45, 0.3, 20]} />
      <meshStandardMaterial color="#6d6a66" metalness={0.8} roughness={0.4} />
    </mesh>
  </group>
);

export type RocketProps = {
  t: number;
  xray?: number;
  fuel1?: number;
  fuel2?: number;
  flame1?: number;
  flame2?: number;
  /** metres stage 1 has fallen away from the stack (0 = attached), and how far it has tumbled */
  sep1?: number;
  tumble1?: number;
  /** stage 2 separation from the capsule */
  sep2?: number;
  showS1?: boolean;
  showS2?: boolean;
  showCap?: boolean;
  vacuum?: number;
  name?: string;
};

/** Two-stage rocket + capsule, origin at the bottom of stage 1, nose up (+Y). */
export const Rocket: React.FC<RocketProps> = ({ t, xray = 0, fuel1 = 1, fuel2 = 1, flame1 = 0, flame2 = 0, sep1 = 0, tumble1 = 0, sep2 = 0, showS1 = true, showS2 = true, showCap = true, vacuum = 0, name = "POCKET PUH 1" }) => {
  const { r } = RK;
  const see = xray > 0.01;
  const paint = useMemo(() => stripeTex(), []);
  const label = useMemo(() => labelTex(name), [name]);
  const skin = (color = "#f2f2ee") => <meshStandardMaterial key={see ? "x" : "o"} color={color} roughness={0.55} metalness={0.1} transparent={see} opacity={1 - 0.8 * xray} depthWrite={!see} />;
  const engines = (y: number, n: number, er: number, rr: number) =>
    n === 1 ? (
      <Engine p={[0, y, 0]} r={er} />
    ) : (
      <>
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2 + Math.PI / 4;
          return <Engine key={i} p={[Math.cos(a) * rr, y, Math.sin(a) * rr]} r={er} />;
        })}
        <Engine p={[0, y, 0]} r={er} />
      </>
    );
  return (
    <group>
      {/* ── stage 1 (falls away with sep1/tumble1) */}
      {showS1 ? (
        <group position={[0, -sep1, 0]} rotation={[0, 0, tumble1]}>
          <mesh position={[0, RK.s1 / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r, r, RK.s1, 48]} />
            {skin()}
          </mesh>
          {/* black roll pattern band + vertical name */}
          <mesh position={[0, RK.s1 * 0.82, 0]}>
            <cylinderGeometry args={[r + 0.01, r + 0.01, 3, 48, 1, true]} />
            <meshStandardMaterial map={paint} roughness={0.55} transparent={see} opacity={1 - 0.8 * xray} />
          </mesh>
          <mesh position={[0, RK.s1 * 0.45, r + 0.012]}>
            <planeGeometry args={[1.3, 10.4]} />
            <meshStandardMaterial map={label} roughness={0.6} transparent opacity={1 - 0.8 * xray} />
          </mesh>
          <Tank y={1.2} h={RK.s1 - 2.4} r={r} fuel={fuel1} xray={xray} />
          {/* fins */}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos((i * Math.PI) / 2 + Math.PI / 4) * (r + 0.8), 2.2, Math.sin((i * Math.PI) / 2 + Math.PI / 4) * (r + 0.8)]} rotation={[0, -((i * Math.PI) / 2 + Math.PI / 4), 0]} castShadow>
              <boxGeometry args={[1.8, 4.2, 0.18]} />
              <meshStandardMaterial color="#1b1d22" roughness={0.5} />
            </mesh>
          ))}
          {engines(0, 4, 0.55, 1.05)}
          <Flame p={[0, -1.4, 0]} len={14} r={2.2} t={t} o={flame1} vacuum={vacuum} />
          {/* interstage */}
          <mesh position={[0, RK.s1 + RK.inter / 2, 0]}>
            <cylinderGeometry args={[r, r, RK.inter, 48]} />
            <meshStandardMaterial color="#2a2d33" roughness={0.6} transparent={see} opacity={1 - 0.7 * xray} />
          </mesh>
        </group>
      ) : null}
      {/* ── stage 2 */}
      {showS2 ? (
        <group position={[0, -sep2, 0]}>
          <mesh position={[0, rkY.s2 + RK.s2 / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r, r, RK.s2, 48]} />
            {skin()}
          </mesh>
          <Tank y={rkY.s2 + 0.6} h={RK.s2 - 1.2} r={r} fuel={fuel2} xray={xray} />
          {engines(rkY.s2, 1, 0.95, 0)}
          <Flame p={[0, rkY.s2 - 1.6, 0]} len={10} r={1.4} t={t} o={flame2} vacuum={1} />
        </group>
      ) : null}
      {/* ── capsule on top */}
      {showCap ? (
        <group position={[0, rkY.cap, 0]}>
          <Capsule t={t} />
        </group>
      ) : null}
    </group>
  );
};

// ───────────────────────── capsule ─────────────────────────
/** Crew capsule (cone, Ø 3.7 m), origin at the heat-shield base. `heat` 0–1 glow; `ablate` 0–1 shield worn;
 * `chutes` 0–1 three main parachutes open; `xray` see-through hull for the cabin beats. */
export const Capsule: React.FC<{ t: number; heat?: number; ablate?: number; chutes?: number; xray?: number; cut?: boolean; children?: React.ReactNode }> = ({ t, heat = 0, ablate = 0, chutes = 0, xray = 0, cut = false, children }) => {
  const see = xray > 0.01;
  if (cut) return <CapsuleCut t={t}>{children}</CapsuleCut>;
  return (
    <group>
      {/* heat shield (dark, chars and thins while ablating) */}
      <mesh position={[0, 0.12 - 0.08 * ablate, 0]} scale={[1, 1 - 0.5 * ablate, 1]}>
        <cylinderGeometry args={[1.86, 1.9, 0.28, 48]} />
        <meshStandardMaterial color={heat > 0.05 ? "#ff7a2a" : "#4a3a2c"} emissive="#ff5a10" emissiveIntensity={3 * heat} roughness={0.9} />
      </mesh>
      {/* cone */}
      <mesh position={[0, 0.25 + 1.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 1.86, 3.2, 48, 1, false]} />
        <meshStandardMaterial key={see ? "x" : "o"} color="#e9ecef" roughness={0.45} metalness={0.2} transparent={see} opacity={1 - 0.88 * xray} depthWrite={!see} />
      </mesh>
      {/* nose + docking ring */}
      <mesh position={[0, 3.6, 0]}>
        <cylinderGeometry args={[0.6, 0.85, 0.5, 32]} />
        <meshStandardMaterial color="#c9cdd2" roughness={0.4} metalness={0.4} transparent={see} opacity={1 - 0.8 * xray} />
      </mesh>
      {/* cabin, seen in x-ray: three seats and a console */}
      {see ? (
        <group>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[1.6, 1.6, 0.06, 40]} />
            <meshStandardMaterial color="#5a6068" roughness={0.7} />
          </mesh>
          {[-0.75, 0, 0.75].map((x) => (
            <group key={x} position={[x, 0.75, -0.35]} rotation={[-0.5, 0, 0]}>
              <RB p={[0, 0, 0]} s={[0.55, 0.12, 0.7]} r={0.05} color="#2b2f36" />
              <RB p={[0, 0.35, -0.35]} s={[0.55, 0.7, 0.1]} r={0.05} color="#2b2f36" />
            </group>
          ))}
          <RB p={[0, 1.7, 0.85]} s={[1.5, 0.5, 0.12]} r={0.04} color="#1b1e24" emissive="#3dd6ff" ei={0.6} rot={[-0.5, 0, 0]} />
        </group>
      ) : null}
      {/* windows */}
      {!see && [-0.5, 0.5].map((a) => (
        <mesh key={a} position={[Math.sin(a) * 1.35, 2.0, Math.cos(a) * 1.35]} rotation={[0.4, a, 0]}>
          <boxGeometry args={[0.45, 0.35, 0.05]} />
          <meshStandardMaterial color="#13202c" emissive="#ffd38a" emissiveIntensity={0.3} roughness={0.1} />
        </mesh>
      ))}
      {/* hatch */}
      {!see ? (
        <mesh position={[0, 1.6, 1.42]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.8, 1.0, 0.06]} />
          <meshStandardMaterial color="#d3d7db" roughness={0.5} />
        </mesh>
      ) : null}
      {heat > 0.01 ? (
        <group>
          <Glow position={[0, -0.6, 0]} size={9 * heat} color="#ff8a3a" opacity={0.9 * heat} />
          <Glow position={[0, -1.6, 0]} size={14 * heat} color="#ff5a1a" opacity={0.6 * heat} />
        </group>
      ) : null}
      {chutes > 0.01 ? <Chutes k={chutes} t={t} /> : null}
      {children}
    </group>
  );
};

/** Three orange-and-white main parachutes above the capsule, with risers. */
const Chutes: React.FC<{ k: number; t: number }> = ({ k, t }) => {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 64;
    const g = c.getContext("2d")!;
    for (let i = 0; i < 16; i++) {
      g.fillStyle = i % 2 ? "#ffffff" : "#ff6a1a";
      g.fillRect(i * 32, 0, 32, 64);
    }
    const tt = new THREE.CanvasTexture(c);
    tt.colorSpace = THREE.SRGBColorSpace;
    return tt;
  }, []);
  const H = 4 + 16 * k;
  return (
    <group>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        const x = Math.cos(a) * 4.5 * k;
        const z = Math.sin(a) * 4.5 * k;
        const sway = Math.sin(t * 0.9 + i * 2) * 0.05;
        const R = 0.6 + 4.6 * k;
        return (
          <group key={i}>
            <group position={[x, H, z]} rotation={[sway + (z / 30), 0, -x / 30]}>
              <mesh>
                <sphereGeometry args={[R, 32, 12, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
                <meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.9} />
              </mesh>
            </group>
            {/* risers */}
            {[0, 1, 2, 3].map((j) => {
              const b = (j / 4) * Math.PI * 2;
              const top = new THREE.Vector3(x + Math.cos(b) * R * 0.95, H + R * 0.25, z + Math.sin(b) * R * 0.95);
              const bot = new THREE.Vector3(0, 3.9, 0);
              const mid = top.clone().add(bot).multiplyScalar(0.5);
              const d = top.clone().sub(bot);
              const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
              return (
                <mesh key={j} position={mid.toArray()} quaternion={q}>
                  <cylinderGeometry args={[0.02, 0.02, d.length(), 4]} />
                  <meshStandardMaterial color="#e6e1d6" />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

// ───────────────────────── space station ─────────────────────────
let panelTex: THREE.Texture | null = null;
const solarTex = () => {
  if (panelTex) return panelTex;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c79a3a";
  g.fillRect(0, 0, 128, 512);
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 4; x++) {
      g.fillStyle = (x + y) % 2 ? "#2a2f5a" : "#33386a";
      g.fillRect(x * 32 + 2, y * 16 + 2, 28, 12);
    }
  panelTex = new THREE.CanvasTexture(c);
  panelTex.colorSpace = THREE.SRGBColorSpace;
  return panelTex;
};

/** The International Space Station at real scale (~109 m truss along X). Origin = centre of the modules. */
export const ISS: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const wing = (x: number, side: 1 | -1, k: number) => (
    <group key={`${x}${side}${k}`} position={[x, 0, side * (3 + 17.5)]}>
      <mesh>
        <boxGeometry args={[11.5, 0.12, 34]} />
        <meshStandardMaterial map={solarTex()} roughness={0.35} metalness={0.5} emissive="#1a1f40" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.35, 0.35, 35]} />
        <meshStandardMaterial color="#c9ccd1" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
  return (
    <group>
      {/* main truss */}
      <RB p={[0, 3.2, 0]} s={[100, 2.4, 2.4]} r={0.1} color="#bfc4ca" rough={0.5} metal={0.5} />
      {[-30, -10, 10, 30].map((x) => (
        <RB key={x} p={[x, 3.2, 0]} s={[0.6, 2.6, 2.6]} r={0.05} color="#8e949b" rough={0.5} metal={0.5} />
      ))}
      {/* solar array wings: two pairs at each end, top and bottom */}
      {[-46, -34, 34, 46].map((x) => [1, -1].map((side) => wing(x, side as 1 | -1, 0)))}
      {/* radiators */}
      {[-16, 16].map((x) => (
        <mesh key={x} position={[x, 3.2, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[3, 0.1, 22]} />
          <meshStandardMaterial color="#f2f3f5" roughness={0.6} />
        </mesh>
      ))}
      {/* pressurised modules along Z */}
      {[
        [0, 0, -6, 8, 2.1],
        [0, 0, 3, 9, 2.2],
        [0, 0, 12, 8, 2.1],
        [0, 0, -15, 10, 2.0],
        [4.5, 0, 3, 6, 2.0],
        [-4.5, 0, 3, 6, 2.0],
      ].map(([x, y, z, len, r], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[i >= 4 ? 0 : Math.PI / 2, 0, i >= 4 ? Math.PI / 2 : 0]} castShadow>
          <cylinderGeometry args={[r, r, len, 32]} />
          <meshStandardMaterial color="#e8e9ea" roughness={0.55} metalness={0.15} />
        </mesh>
      ))}
      {/* Russian segment continuing along −Z, with its own small solar wings */}
      {[
        [-24, 1.9, 9],
        [-33, 2.0, 7],
        [-41, 1.8, 7],
      ].map(([z, r, len], i) => (
        <mesh key={`ru${i}`} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[r, r, len, 32]} />
          <meshStandardMaterial color={i === 1 ? "#d9c27a" : "#e2e3e4"} roughness={0.5} metalness={0.2} />
        </mesh>
      ))}
      {[-1, 1].map((k) => (
        <mesh key={`rw${k}`} position={[k * 9, 0, -33]}>
          <boxGeometry args={[14, 0.1, 3.6]} />
          <meshStandardMaterial map={solarTex()} roughness={0.35} metalness={0.5} />
        </mesh>
      ))}
      {/* docked Dragon capsule at the forward port */}
      <group position={[0, 0, 19.5]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[1.1, 1.85, 3.2, 32]} />
          <meshStandardMaterial color="#f4f5f6" roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[0, -2.6, 0]}>
          <cylinderGeometry args={[1.85, 1.85, 2.2, 32]} />
          <meshStandardMaterial color="#2a2d33" roughness={0.6} />
        </mesh>
      </group>
      {/* gold thermal blankets on the nodes */}
      {[-6, 12].map((z) => (
        <mesh key={`g${z}`} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.16, 2.16, 1.2, 32, 1, true]} />
          <meshStandardMaterial color="#c9a24a" roughness={0.35} metalness={0.8} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* extra radiator panels on the truss */}
      {[-22, 22].map((x) => (
        <mesh key={`rad${x}`} position={[x, -4, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[2.2, 0.1, 14]} />
          <meshStandardMaterial color="#f7f7f5" roughness={0.6} />
        </mesh>
      ))}
      {children}
    </group>
  );
};

// ───────────────────────── launch pad ─────────────────────────
/** Concrete pad on a pier in the sea with a flame trench and a lattice umbilical tower. Origin = pad centre, deck at y = 3. */
export const LaunchPad: React.FC<{ arm?: number }> = ({ arm = 1 }) => {
  const H = 52;
  const bars = useMemo(() => {
    const out: { p: V3; s: V3; rot?: V3 }[] = [];
    const w = 4;
    for (let y = 0; y < H; y += 3) {
      // horizontal frame
      out.push({ p: [0, y, w / 2], s: [w, 0.25, 0.25] }, { p: [0, y, -w / 2], s: [w, 0.25, 0.25] }, { p: [w / 2, y, 0], s: [0.25, 0.25, w] }, { p: [-w / 2, y, 0], s: [0.25, 0.25, w] });
      // diagonals
      out.push({ p: [0, y + 1.5, w / 2], s: [0.18, 3.6, 0.18], rot: [0, 0, 0.9] }, { p: [w / 2, y + 1.5, 0], s: [0.18, 3.6, 0.18], rot: [0.9, 0, 0] });
    }
    return out;
  }, []);
  return (
    <group>
      {/* pier legs into the sea + deck */}
      {[-10, 0, 10].map((x) => [-6, 6].map((z) => <RB key={`${x}${z}`} p={[x, -2, z]} s={[1.2, 10, 1.2]} r={0.1} color="#8c8a86" rough={0.9} />))}
      <RB p={[0, 2.5, 0]} s={[30, 1.2, 18]} r={0.2} color="#b7b3ab" rough={0.95} />
      {/* flame trench */}
      <RB p={[0, 3.12, 0]} s={[7, 0.1, 7]} r={0.05} color="#3a3633" rough={0.9} />
      {/* tower */}
      <group position={[-7.5, 3, 0]}>
        {[
          [2, 2],
          [-2, 2],
          [2, -2],
          [-2, -2],
        ].map(([x, z], i) => (
          <RB key={i} p={[x, H / 2, z]} s={[0.4, H, 0.4]} r={0.05} color="#c0392b" rough={0.6} metal={0.3} />
        ))}
        {bars.map((b, i) => (
          <RB key={i} p={b.p} s={b.s} rot={b.rot} r={0.03} color="#c0392b" rough={0.6} metal={0.3} />
        ))}
        {/* access arm to the capsule */}
        {/* a zero scale makes the normal matrix singular → NaN shading → bloom blacks out the frame */}
        {arm > 0.02 ? (
          <group position={[2, 42, 0]} scale={[arm, 1, 1]}>
            <RB p={[2.2, 0, 0]} s={[4.4, 1.6, 1.8]} r={0.1} color="#9aa1a8" rough={0.6} />
          </group>
        ) : null}
        <Glow position={[0, H + 1, 0]} size={1.4} color="#ff3b30" opacity={0.9} />
      </group>
    </group>
  );
};

// ───────────────────────── capsule cut open (doll's house) ─────────────────────────
let quiltTex: THREE.Texture | null = null;
const quilt = () => {
  if (quiltTex) return quiltTex;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#eef0f2";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      const grd = g.createRadialGradient(x * 64 + 32, y * 64 + 32, 4, x * 64 + 32, y * 64 + 32, 40);
      grd.addColorStop(0, "#ffffff");
      grd.addColorStop(1, "#d3d7dc");
      g.fillStyle = grd;
      g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
    }
  quiltTex = new THREE.CanvasTexture(c);
  quiltTex.wrapS = quiltTex.wrapT = THREE.RepeatWrapping;
  quiltTex.repeat.set(6, 2);
  quiltTex.colorSpace = THREE.SRGBColorSpace;
  return quiltTex;
};

/** Cabin displays: 0 = ground-track map, 1 = telemetry, 2 = attitude ball; 3 = the view out of the window. */
const screenTexs: THREE.Texture[] = [];
const screenTex = (i: number) => {
  if (screenTexs[i]) return screenTexs[i];
  const W = 256;
  const H = i === 3 ? 256 : 190;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const glow = (col: string) => {
    g.strokeStyle = col;
    g.fillStyle = col;
    g.shadowColor = col;
    g.shadowBlur = 6;
  };
  g.fillStyle = "#04110c";
  g.fillRect(0, 0, W, H);
  if (i < 3) {
    g.strokeStyle = "rgba(90,200,150,0.18)";
    g.lineWidth = 1;
    for (let x = 0; x <= W; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, H);
      g.stroke();
    }
    for (let y = 0; y <= H; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }
  }
  if (i === 0) {
    // two sine-shaped orbits over a dotted world
    const r = seeded(17);
    g.fillStyle = "rgba(93,252,141,0.35)";
    for (let k = 0; k < 260; k++) {
      const x = r() * W;
      const y = 40 + r() * 110;
      if (Math.sin(x * 0.05) + Math.cos(y * 0.07) > 0.4) g.fillRect(x, y, 3, 3);
    }
    glow("#3dd6ff");
    g.lineWidth = 3;
    for (const ph of [0, 1.9]) {
      g.beginPath();
      for (let x = 0; x <= W; x += 4) g.lineTo(x, H / 2 - Math.sin((x / W) * Math.PI * 2 + ph) * 58);
      g.stroke();
    }
    glow("#ffd23f");
    g.beginPath();
    g.arc(150, H / 2 - Math.sin((150 / W) * Math.PI * 2) * 58, 7, 0, Math.PI * 2);
    g.fill();
  } else if (i === 1) {
    glow("#5dfc8d");
    g.font = "bold 26px monospace";
    const rows = [["ALT", "408 KM"], ["VEL", "7.66 KM/S"], ["O2", "21.3 %"], ["CABIN", "22 °C"]];
    rows.forEach(([a, b], k) => {
      g.fillText(a, 14, 40 + k * 42);
      g.fillText(b, 110, 40 + k * 42);
    });
  } else if (i === 2) {
    // attitude ball: sky over ground, pitch ladder
    g.save();
    g.beginPath();
    g.arc(W / 2, H / 2, 78, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = "#1f6fb5";
    g.fillRect(0, 0, W, H / 2 + 8);
    g.fillStyle = "#6b4a2b";
    g.fillRect(0, H / 2 + 8, W, H);
    g.strokeStyle = "#ffffff";
    g.lineWidth = 2;
    for (let k = -2; k <= 2; k++) {
      g.beginPath();
      g.moveTo(W / 2 - 24, H / 2 + 8 + k * 22);
      g.lineTo(W / 2 + 24, H / 2 + 8 + k * 22);
      g.stroke();
    }
    g.restore();
    glow("#ffd23f");
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(W / 2 - 50, H / 2);
    g.lineTo(W / 2 - 14, H / 2);
    g.lineTo(W / 2, H / 2 + 12);
    g.lineTo(W / 2 + 14, H / 2);
    g.lineTo(W / 2 + 50, H / 2);
    g.stroke();
  } else {
    // the window: black space, the curved blue Earth with clouds and a thin bright atmosphere
    g.fillStyle = "#000004";
    g.fillRect(0, 0, W, H);
    const cx = W * 0.5;
    const cy = H * 1.55;
    const R = H * 1.15;
    const grd = g.createRadialGradient(cx, cy - R * 0.4, R * 0.2, cx, cy, R);
    grd.addColorStop(0, "#2c7ad6");
    grd.addColorStop(1, "#0b3b7a");
    g.fillStyle = grd;
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.fill();
    const r = seeded(5);
    for (let k = 0; k < 70; k++) {
      const a = -Math.PI / 2 + (r() - 0.5) * 1.6;
      const d = R * (0.75 + r() * 0.24);
      g.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.5})`;
      g.beginPath();
      g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 6 + r() * 16, 3 + r() * 5, a + Math.PI / 2, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(140,200,255,0.9)";
    g.lineWidth = 5;
    g.shadowColor = "#8fd0ff";
    g.shadowBlur = 14;
    g.beginPath();
    g.arc(cx, cy, R + 2, 0, Math.PI * 2);
    g.stroke();
  }
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  screenTexs[i] = tx;
  return tx;
};

/** The back half of the capsule (front cut away towards +Z): hull outside, quilted padding inside, cut edges,
 * three seats, a console with screens, a round window with Earth glow, handrails and a cabin light. */
const CapsuleCut: React.FC<{ t: number; children?: React.ReactNode }> = ({ children }) => {
  const half = { thetaStart: Math.PI / 2, thetaLength: Math.PI };
  return (
    <group>
      {/* heat shield + floor */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.86, 1.9, 0.28, 48, 1, false, half.thetaStart, half.thetaLength]} />
        <meshStandardMaterial color="#4a3a2c" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 48, Math.PI, Math.PI]} />
        <meshStandardMaterial color="#59606a" roughness={0.7} />
      </mesh>
      {/* hull: white outside, quilted inside */}
      <mesh position={[0, 0.25 + 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.85, 1.86, 3.2, 64, 1, true, half.thetaStart, half.thetaLength]} />
        <meshStandardMaterial color="#e9ecef" roughness={0.45} metalness={0.2} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, 0.25 + 1.6, 0]} scale={[0.96, 1, 0.96]}>
        <cylinderGeometry args={[0.85, 1.86, 3.2, 64, 1, true, half.thetaStart, half.thetaLength]} />
        <meshStandardMaterial map={quilt()} color="#c9ced4" roughness={0.95} side={THREE.BackSide} envMapIntensity={0.3} />
      </mesh>
      {/* the cut: dark wall thickness along both edges */}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 1.32, 1.85, 0]} rotation={[0, 0, k * 0.3]}>
          <boxGeometry args={[0.08, 3.35, 0.06]} />
          <meshStandardMaterial color="#2b2f36" roughness={0.6} />
        </mesh>
      ))}
      {/* round window on the back wall with the blue glow of the Earth */}
      <mesh position={[0, 2.0, -1.36]} rotation={[0.32, 0, 0]}>
        <circleGeometry args={[0.32, 32]} />
        <meshBasicMaterial map={screenTex(3)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.0, -1.35]} rotation={[0.32, 0, 0]}>
        <torusGeometry args={[0.33, 0.04, 8, 32]} />
        <meshStandardMaterial color="#9aa1a8" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* seats */}
      {[-0.75, 0, 0.75].map((x) => (
        <group key={x} position={[x, 0.72, -0.45]} rotation={[-0.45, 0, 0]}>
          <RB p={[0, 0, 0]} s={[0.55, 0.12, 0.7]} r={0.05} color="#2b2f36" />
          <RB p={[0, 0.38, -0.36]} s={[0.55, 0.75, 0.1]} r={0.05} color="#2b2f36" />
          <RB p={[0, 0.06, 0.05]} s={[0.06, 0.02, 0.6]} r={0.01} color="#e8573a" />
        </group>
      ))}
      {/* console with three screens */}
      <group position={[0, 1.75, -0.95]} rotation={[0.45, 0, 0]}>
        <RB p={[0, 0, 0]} s={[1.7, 0.6, 0.12]} r={0.04} color="#1b1e24" />
        {[-0.55, 0, 0.55].map((x, i) => (
          <group key={x}>
            <RB p={[x, 0.02, 0.065]} s={[0.5, 0.38, 0.02]} r={0.02} color="#2a2e35" />
            <mesh position={[x, 0.02, 0.077]}>
              <planeGeometry args={[0.44, 0.33]} />
              <meshBasicMaterial map={screenTex(i)} toneMapped={false} />
            </mesh>
          </group>
        ))}
        {/* switch rows under the screens */}
        {Array.from({ length: 14 }, (_, k) => (
          <RB key={k} p={[-0.72 + k * 0.11, -0.23, 0.07]} s={[0.05, 0.05, 0.03]} r={0.01} color={k % 4 === 0 ? "#e8573a" : "#c9ced4"} />
        ))}
      </group>
      {/* handrails + light */}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 0.95, 2.6, -0.55]} rotation={[0, 0, k * 0.3]}>
          <torusGeometry args={[0.12, 0.02, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#f2b21c" />
        </mesh>
      ))}
      <pointLight position={[0, 2.7, 0.4]} intensity={1.4} distance={5} color="#fff4e0" />
      {children}
    </group>
  );
};

// ───────────────────────── re-entry plasma ─────────────────────────
const plasmaMat = () =>
  new THREE.ShaderMaterial({
    uniforms: { uO: { value: 1 }, uT: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec2 vUv; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uO; uniform float uT; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      void main(){
        float e = clamp(abs(dot(normalize(vN + vec3(1e-4)), normalize(vV + vec3(1e-4)))), 0.0, 1.0);
        float rim = pow(1.0 - e, 1.5);
        float flick = 0.85 + 0.15 * sin(uT * 11.0 + vUv.y * 20.0 + vUv.x * 9.0);
        vec3 c = mix(vec3(1.0, 0.82, 0.55), vec3(1.0, 0.36, 0.1), rim);
        c = mix(c, vec3(0.95, 0.3, 0.6), smoothstep(0.6, 1.0, vUv.y) * 0.6);
        float a = clamp((0.1 + 0.9 * rim) * flick * uO * (1.0 - 0.7 * vUv.y), 0.0, 1.0);
        gl_FragColor = vec4(c * 1.5, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

/** Bow shock in front of the heat shield (−Y in capsule space) and a long glowing wake behind. `o` 0–1. */
export const Plasma: React.FC<{ o: number; t: number }> = ({ o, t }) => {
  const shock = useMemo(plasmaMat, []);
  const wake = useMemo(plasmaMat, []);
  if (o <= 0.001) return null;
  shock.uniforms.uO.value = 0.75 * o;
  shock.uniforms.uT.value = t;
  wake.uniforms.uO.value = 0.22 * o;
  wake.uniforms.uT.value = t + 2;
  return (
    <group>
      {/* bow shock: a bowl wrapped around the shield */}
      <mesh material={shock} position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]} scale={[1, 0.45, 1]}>
        <sphereGeometry args={[2.25, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
      </mesh>
      {/* wake streaming past the capsule and far behind it */}
      <mesh material={wake} position={[0, 9, 0]}>
        <cylinderGeometry args={[0.6, 2.7, 18, 40, 6, true]} />
      </mesh>
      <Glow position={[0, -0.8, 0]} size={9 * o} color="#ffb06a" opacity={0.85 * o} />
      <Glow position={[0, 6, 0]} size={14 * o} color="#ff6a3a" opacity={0.35 * o} />
    </group>
  );
};
