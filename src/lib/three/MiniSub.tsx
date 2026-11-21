import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "./core";
import { seeded } from "../timing";

/**
 * A small submersible that is "built" part by part (submarine build reel). Axis along X, nose at +X,
 * origin = hull centre, 1 unit = 1 m. Frame-driven, every prop 0–1:
 * - `stretch` 0 = steel ball (bathysphere, Ø 1.5 m), 1 = capsule hull 6.8 m long, Ø 2.2 m
 * - `paint`   steel grey → yellow; `xray` hull turns see-through (interior = `children`)
 * - `tanks`   ballast tanks appear; `fill` water level in them; `blow` white air bubbles out of the bottom
 * - `lights`  headlights; `arm`/`claw` manipulator; `reactor` extra hull section; `t` seconds (propeller, bubbles)
 */
export type SubProps = {
  stretch?: number;
  paint?: number;
  xray?: number;
  tanks?: number;
  fill?: number;
  vent?: number;
  blow?: number;
  lights?: number;
  arm?: number;
  claw?: number;
  reactor?: number;
  hatch?: number;
  t?: number;
  children?: React.ReactNode;
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const mixHex = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), clamp01(k)).getHexString();

/** Hull dimensions for a given build state (used by scenes to place cables, labels, people). */
export const subDims = (stretch: number, reactor = 0) => {
  const R = lerp(0.76, 1.1, stretch);
  const L = 4.6 * stretch + 1.6 * reactor; // cylinder part
  return { R, L, half: L / 2 + R };
};

/** Circular segment (water in a horizontal tank) extruded along X: flat surface at `fill` of the height. */
const waterGeo = (r: number, len: number, fill: number) => {
  const lv = -r + 2 * r * clamp01(fill);
  const a0 = Math.asin(Math.max(-1, Math.min(1, lv / r))); // angle of the waterline
  const s = new THREE.Shape();
  const n = 32;
  // arc from the right end of the waterline down around the bottom to the left end
  for (let i = 0; i <= n; i++) {
    const a = a0 - (i / n) * (Math.PI + 2 * a0);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -len / 2);
  g.rotateY(Math.PI / 2); // extrusion (z) → x
  return g;
};

/** Hazard trefoil on a transparent canvas (reactor section). */
let trefoil: THREE.Texture | null = null;
const trefoilTex = () => {
  if (trefoil) return trefoil;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffd400";
  g.beginPath();
  g.arc(128, 128, 120, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#111";
  for (let k = 0; k < 3; k++) {
    const a = -Math.PI / 2 + (k * Math.PI * 2) / 3;
    g.beginPath();
    g.moveTo(128, 128);
    g.arc(128, 128, 100, a - Math.PI / 6, a + Math.PI / 6);
    g.closePath();
    g.fill();
  }
  g.fillStyle = "#ffd400";
  g.beginPath();
  g.arc(128, 128, 30, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#111";
  g.beginPath();
  g.arc(128, 128, 20, 0, Math.PI * 2);
  g.fill();
  trefoil = new THREE.CanvasTexture(c);
  trefoil.colorSpace = THREE.SRGBColorSpace;
  return trefoil;
};

/** Fresnel rim: edges of the see-through hull glow, the middle stays clear. */
const rimCache = new Map<number, THREE.ShaderMaterial>();
const rimMat = (o: number) => {
  const k = Math.round(o * 20) / 20;
  if (!rimCache.has(k))
    rimCache.set(
      k,
      new THREE.ShaderMaterial({
        uniforms: { uO: { value: k } },
        vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float uO; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.5); gl_FragColor = vec4(vec3(0.62,0.93,1.0), f * 0.85 * uO); }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
  return rimCache.get(k)!;
};

const Bolt: React.FC<{ p: V3; rot?: V3; r?: number }> = ({ p, rot, r = 0.025 }) => (
  <mesh position={p} rotation={rot}>
    <cylinderGeometry args={[r, r, 0.03, 6]} />
    <meshStandardMaterial color="#5b6168" metalness={0.8} roughness={0.35} />
  </mesh>
);

/** Ring of bolts on a flange, facing +Y in its own space. */
const BoltRing: React.FC<{ r: number; n: number; y?: number }> = ({ r, n, y = 0 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return <Bolt key={i} p={[Math.cos(a) * r, y, Math.sin(a) * r]} />;
    })}
  </>
);

export const MiniSub: React.FC<SubProps> = ({
  stretch = 1,
  paint = 1,
  xray = 0,
  tanks = 0,
  fill = 0,
  vent = 0,
  blow = 0,
  lights = 0,
  arm = 0,
  claw = 0,
  reactor = 0,
  hatch = 0,
  t = 0,
  children,
}) => {
  const { R, L } = subDims(stretch, reactor);
  const hullColor = mixHex("#59636e", "#ffbf12", paint);
  const sub = clamp01((stretch - 0.55) / 0.45); // sub-only parts (sail, propeller, fins, skids)
  const ball = 1 - clamp01(stretch / 0.35); // bathysphere-only parts (bolted windows, rear hatch)
  const see = xray > 0.001;
  const hullGeo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(R, Math.max(0.0001, L), 24, 64);
    g.rotateZ(-Math.PI / 2);
    return g;
  }, [R, L]);
  const sailGeo = useMemo(() => {
    // rounded teardrop sail: extruded stadium outline, bevelled
    const sh = new THREE.Shape();
    sh.moveTo(-0.6, -0.26);
    sh.lineTo(0.35, -0.26);
    sh.absarc(0.35, 0, 0.26, -Math.PI / 2, Math.PI / 2, false);
    sh.lineTo(-0.6, 0.26);
    sh.quadraticCurveTo(-0.85, 0, -0.6, -0.26);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 24 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -0.25, 0);
    return g;
  }, []);
  // weld seams every ~1.1 m along the cylinder
  const seams = Math.max(0, Math.floor(L / 1.1));
  // ballast tanks: under the hull on both sides
  const tankR = lerp(0.26, 0.36, stretch);
  const tankLen = Math.max(1.2, L + R * 0.9);
  const tankY = -R * 0.55;
  const tankZ = R * 0.78 + tankR * 0.55;
  const fq = Math.round(clamp01(fill) * 50) / 50;
  const water = useMemo(() => waterGeo(tankR * 0.9, tankLen * 0.96, Math.max(0.001, fq)), [tankR, tankLen, fq]);
  const bubbles = useMemo(() => {
    const r = seeded(77);
    return Array.from({ length: 36 }, () => ({ ph: r(), x: r() - 0.5, dz: (r() - 0.5) * 0.3, s: 0.05 + r() * 0.08 }));
  }, []);
  const prop = t * 9;
  const noseX = L / 2 + R;
  const tailX = -noseX;
  // manipulator arm (folded under the nose → reaching forward and down)
  const sh = lerp(-2.3, -0.55, arm); // shoulder pitch
  const el = lerp(2.6, 0.45, arm); // elbow
  const fingers = lerp(0.55, 0.08, claw);
  const yellow = "#ffcc1a";
  return (
    <group>
      {/* pressure hull */}
      <mesh geometry={hullGeo} castShadow receiveShadow>
        <meshPhysicalMaterial
          key={see ? "x" : "o"}
          color={hullColor}
          metalness={lerp(0.75, 0.08, paint)}
          roughness={lerp(0.38, 0.32, paint)}
          clearcoat={0.6 * paint}
          clearcoatRoughness={0.25}
          transparent={see}
          opacity={1 - 0.82 * xray}
          depthWrite={!see}
        />
      </mesh>
      {see ? (
        // x-ray outline so the hull shape still reads
        <mesh geometry={hullGeo} scale={[1.003, 1.003, 1.003]} material={rimMat(xray)} />
      ) : null}
      {/* weld seams */}
      {Array.from({ length: seams }, (_, i) => {
        const x = -L / 2 + ((i + 1) * L) / (seams + 1);
        return (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[R + 0.004, 0.012, 6, 64]} />
            <meshStandardMaterial color={mixHex("#3e454c", "#c98d0e", paint)} roughness={0.5} metalness={0.4} transparent={see} opacity={1 - 0.8 * xray} />
          </mesh>
        );
      })}
      {/* front window: bolted quartz ports on the ball, one big acrylic viewport on the sub */}
      {ball > 0.01
        ? [-0.32, 0, 0.32].map((a, i) => {
            const dir = new THREE.Vector3(Math.cos(a) * Math.cos(i === 1 ? 0.05 : -0.12), i === 1 ? 0.05 : -0.12, Math.sin(a));
            const p = dir.clone().multiplyScalar(R).add(new THREE.Vector3(L / 2, 0, 0));
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
            const e = new THREE.Euler().setFromQuaternion(q);
            return (
              <group key={i} position={p.toArray()} rotation={[e.x, e.y, e.z]} scale={[ball, ball, ball]}>
                <mesh position={[0, 0.03, 0]}>
                  <cylinderGeometry args={[0.13, 0.15, 0.08, 32]} />
                  <meshStandardMaterial color="#3d444b" metalness={0.85} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.072, 0]}>
                  <cylinderGeometry args={[0.085, 0.085, 0.01, 32]} />
                  <meshPhysicalMaterial color="#9fd6ff" emissive="#2a6f9a" emissiveIntensity={0.6} roughness={0.05} clearcoat={1} />
                </mesh>
                <group position={[0, 0.07, 0]}>
                  <BoltRing r={0.115} n={8} />
                </group>
              </group>
            );
          })
        : null}
      {sub > 0.01 ? (
        <group position={[noseX - 0.02, 0.05, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[sub, sub, sub]}>
          {/* viewport dome set into the nose */}
          <mesh position={[0, -0.02, 0]}>
            <sphereGeometry args={[0.52, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#bfe7ff" emissive="#3a8fc0" emissiveIntensity={0.35 + 0.5 * lights} roughness={0.04} metalness={0} clearcoat={1} transparent opacity={0.55} />
          </mesh>
          <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.53, 0.05, 10, 48]} />
            <meshStandardMaterial color="#2f353b" metalness={0.8} roughness={0.35} />
          </mesh>
        </group>
      ) : null}
      {/* rear entry hatch of the ball (bolted flange) */}
      {ball > 0.01 ? (
        <group position={[-L / 2 - R, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[ball, ball, ball]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.32, 0.34, 0.09, 40]} />
            <meshStandardMaterial color="#454c53" metalness={0.85} roughness={0.32} />
          </mesh>
          <group position={[0, 0.07, 0]}>
            <BoltRing r={0.28} n={10} />
          </group>
        </group>
      ) : null}
      {/* lifting eye on top (ball) */}
      {ball > 0.01 ? (
        <mesh position={[0, R + 0.08, 0]} rotation={[0, 0, 0]} scale={[ball, ball, ball]}>
          <torusGeometry args={[0.1, 0.03, 10, 24]} />
          <meshStandardMaterial color="#454c53" metalness={0.85} roughness={0.3} />
        </mesh>
      ) : null}
      {/* sail with hatch, side portholes, fins, propeller, skids, lights */}
      {sub > 0.01 ? (
        <group scale={[1, sub, 1]}>
          <mesh position={[L * 0.12, R + 0.22, 0]} geometry={sailGeo} castShadow>
            <meshPhysicalMaterial key={see ? "x" : "o"} color={hullColor} roughness={0.32} clearcoat={0.6} transparent={see} opacity={1 - 0.8 * xray} depthWrite={!see} />
          </mesh>
          {/* small windows in the sail */}
          {[-1, 1].map((k) => (
            <mesh key={k} position={[L * 0.12 + 0.25, R + 0.42, k * 0.305]} rotation={[0, k > 0 ? 0 : Math.PI, 0]}>
              <planeGeometry args={[0.36, 0.12]} />
              <meshStandardMaterial color="#14202a" roughness={0.1} metalness={0.3} />
            </mesh>
          ))}
          {/* hatch on the sail (opens at the end) */}
          <group position={[L * 0.12 - 0.15, R + 0.6, 0]}>
            <mesh>
              <cylinderGeometry args={[0.27, 0.27, 0.05, 32]} />
              <meshStandardMaterial color="#3a4148" metalness={0.8} roughness={0.35} />
            </mesh>
            <group position={[-0.27, 0.03, 0]} rotation={[0, 0, 1.9 * hatch]}>
              <mesh position={[0.27, 0.03, 0]}>
                <cylinderGeometry args={[0.25, 0.25, 0.07, 32]} />
                <meshStandardMaterial color="#e0a215" metalness={0.3} roughness={0.4} />
              </mesh>
              <mesh position={[0.27, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.1, 0.018, 8, 24]} />
                <meshStandardMaterial color="#2a2f35" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          </group>
          {/* antenna + nav light on the sail */}
          <mesh position={[L * 0.12 - 0.45, R + 0.85, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <Glow position={[L * 0.12 - 0.45, R + 1.1, 0]} size={0.18} color="#ff4d3a" opacity={0.8 * (0.5 + 0.5 * Math.sin(t * 3))} />
        </group>
      ) : null}
      {sub > 0.01 && stretch > 0.5
        ? [-1, 1].map((k) =>
            [-0.25, 0.25, 0.75].map((u, i) => (
              <group key={`${k}${i}`} position={[u * L * 0.5, R * 0.25, k * Math.sqrt(Math.max(0, R * R - (R * 0.25) ** 2))]} rotation={[k * (Math.PI / 2 - 0.25), 0, 0]} scale={[sub, sub, sub]}>
                <mesh position={[0, 0.012, 0]}>
                  <cylinderGeometry args={[0.15, 0.15, 0.04, 28]} />
                  <meshStandardMaterial color="#2f353b" metalness={0.8} roughness={0.35} />
                </mesh>
                <mesh position={[0, 0.034, 0]}>
                  <cylinderGeometry args={[0.11, 0.11, 0.01, 28]} />
                  <meshPhysicalMaterial color="#8fd2ff" emissive="#ffd38a" emissiveIntensity={0.25 + 0.9 * lights} roughness={0.05} clearcoat={1} />
                </mesh>
              </group>
            )),
          )
        : null}
      {sub > 0.01 ? (
        <group position={[tailX, 0, 0]} scale={[sub, sub, sub]}>
          {/* tail cone + cross fins */}
          <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.18, 0.42, 0.7, 32]} />
            <meshStandardMaterial color={mixHex("#59636e", "#d99a12", paint)} metalness={0.3} roughness={0.4} transparent={see} opacity={1 - 0.8 * xray} />
          </mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[-0.4, 0, 0]} rotation={[(i * Math.PI) / 2, 0, 0]} castShadow>
              <boxGeometry args={[0.55, 0.04, 1.3]} />
              <meshStandardMaterial color="#2c3238" metalness={0.5} roughness={0.45} />
            </mesh>
          ))}
          {/* ducted propeller */}
          <mesh position={[-0.95, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.52, 0.52, 0.32, 40, 1, true]} />
            <meshStandardMaterial color="#2a3036" metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
          <group position={[-0.95, 0, 0]} rotation={[prop, 0, 0]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} rotation={[(i * Math.PI * 2) / 5, 0, 0]} position={[0, 0, 0]}>
                <boxGeometry args={[0.06, 0.46, 0.14]} />
                <meshStandardMaterial color="#b9894a" metalness={0.9} roughness={0.25} />
              </mesh>
            ))}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <coneGeometry args={[0.1, 0.25, 16]} />
              <meshStandardMaterial color="#b9894a" metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
        </group>
      ) : null}
      {/* skids */}
      {sub > 0.01
        ? [-1, 1].map((k) => (
            <group key={k} scale={[1, sub, 1]}>
              <mesh position={[0, -R - 0.32, k * 0.55]} castShadow>
                <boxGeometry args={[L + R * 1.2, 0.07, 0.1]} />
                <meshStandardMaterial color="#30363c" metalness={0.6} roughness={0.4} />
              </mesh>
              {[-0.35, 0.35].map((u) => (
                <mesh key={u} position={[u * L, -R - 0.12, k * 0.5]} rotation={[k * 0.25, 0, 0]}>
                  <boxGeometry args={[0.07, 0.42, 0.07]} />
                  <meshStandardMaterial color="#30363c" metalness={0.6} roughness={0.4} />
                </mesh>
              ))}
            </group>
          ))
        : null}
      {/* headlights */}
      {sub > 0.01
        ? [-1, 1].map((k) => (
            <group key={k} position={[noseX - 0.35, -R * 0.55, k * 0.62]} scale={[sub, sub, sub]}>
              <mesh rotation={[0, 0, -Math.PI / 2]}>
                <cylinderGeometry args={[0.1, 0.13, 0.22, 20]} />
                <meshStandardMaterial color="#2a2f35" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0.115, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <cylinderGeometry args={[0.085, 0.085, 0.01, 20]} />
                <meshStandardMaterial color="#fff6dc" emissive="#fff1c8" emissiveIntensity={0.2 + 3 * lights} />
              </mesh>
              {lights > 0.01 ? <Glow position={[0.2, 0, 0]} size={0.9} color="#fff1c8" opacity={0.85 * lights} /> : null}
            </group>
          ))
        : null}
      {/* ballast tanks (see-through shell so the water level shows) */}
      {tanks > 0.01
        ? [-1, 1].map((k) => (
            <group key={k} position={[0, tankY, k * tankZ]} scale={[tanks, tanks, tanks]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[tankR, tankLen, 12, 32]} />
                <meshPhysicalMaterial color="#1fd1c1" roughness={0.15} clearcoat={1} transparent opacity={0.32} depthWrite={false} />
              </mesh>
              {/* straps */}
              {[-0.3, 0.3].map((u) => (
                <mesh key={u} position={[u * tankLen, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <torusGeometry args={[tankR + 0.01, 0.025, 8, 32]} />
                  <meshStandardMaterial color="#1a6f69" metalness={0.5} roughness={0.4} />
                </mesh>
              ))}
              {fq > 0.005 ? (
                <mesh geometry={water}>
                  <meshStandardMaterial color="#1f6dff" emissive="#0b3fd0" emissiveIntensity={0.5} roughness={0.2} transparent opacity={0.9 * (1 - 0.8 * xray)} depthWrite={xray < 0.05} />
                </mesh>
              ) : null}
              {/* vent valve on top, flood grate underneath */}
              <mesh position={[tankLen * 0.3, tankR + 0.05, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.1, 12]} />
                <meshStandardMaterial color={vent > 0.5 ? "#ff3b30" : "#2a2f35"} emissive={vent > 0.5 ? "#ff2a1a" : "#000"} emissiveIntensity={vent > 0.5 ? 1.2 : 0} />
              </mesh>
            </group>
          ))
        : null}
      {/* air escaping from the vents (flooding) */}
      {tanks > 0.5 && vent > 0.01
        ? bubbles.slice(0, 18).map((b, i) => {
            const u = (((t * 0.9 + b.ph) % 1) + 1) % 1;
            const k = i % 2 ? 1 : -1;
            return <Glow key={`v${i}`} position={[tankLen * 0.3 + b.x * 0.2, tankY + tankR + 0.1 + u * 2.4, k * tankZ + b.dz]} size={b.s * 2.4 * (0.6 + u)} color="#e8fbff" opacity={vent * 0.9 * Math.sin(u * Math.PI)} />;
          })
        : null}
      {/* compressed air blowing the water out of the bottom */}
      {tanks > 0.5 && blow > 0.01
        ? bubbles.map((b, i) => {
            const u = (((t * 1.3 + b.ph) % 1) + 1) % 1;
            const k = i % 2 ? 1 : -1;
            return <Glow key={`b${i}`} position={[b.x * tankLen, tankY - tankR - u * 0.8 + u * u * 3.2, k * (tankZ + u * 0.4) + b.dz]} size={b.s * 3 * (0.6 + u)} color="#ffffff" opacity={blow * 0.95 * Math.sin(u * Math.PI)} />;
          })
        : null}
      {/* manipulator arm */}
      {arm > 0.001 || stretch > 0.95 ? (
        <group position={[noseX - 0.55, -R * 0.75, 0]} scale={[sub, sub, sub]}>
          <mesh>
            <sphereGeometry args={[0.13, 20, 14]} />
            <meshStandardMaterial color="#30363c" metalness={0.7} roughness={0.35} />
          </mesh>
          <group rotation={[0, 0, sh]}>
            <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.07, 0.08, 0.9, 16]} />
              <meshStandardMaterial color={yellow} metalness={0.3} roughness={0.4} />
            </mesh>
            <group position={[0.9, 0, 0]} rotation={[0, 0, el]}>
              <mesh>
                <sphereGeometry args={[0.1, 16, 12]} />
                <meshStandardMaterial color="#30363c" metalness={0.7} roughness={0.35} />
              </mesh>
              <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.055, 0.065, 0.8, 16]} />
                <meshStandardMaterial color={yellow} metalness={0.3} roughness={0.4} />
              </mesh>
              {/* claw */}
              <group position={[0.82, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.09, 0.09, 0.08, 16]} />
                  <meshStandardMaterial color="#30363c" metalness={0.7} roughness={0.35} />
                </mesh>
                {[-1, 1].map((k) => (
                  <group key={k} rotation={[0, 0, k * fingers]}>
                    <mesh position={[0.17, k * 0.05, 0]} rotation={[0, 0, -k * 0.35]}>
                      <boxGeometry args={[0.3, 0.04, 0.12]} />
                      <meshStandardMaterial color="#2a2f35" metalness={0.7} roughness={0.35} />
                    </mesh>
                  </group>
                ))}
              </group>
            </group>
          </group>
        </group>
      ) : null}
      {/* reactor section: yellow-black band with trefoils and green glow seams */}
      {reactor > 0.01 ? (
        <group scale={[reactor, 1, 1]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[R + 0.012, R + 0.012, 1.4, 64, 1, true]} />
            <meshStandardMaterial color="#2b3a2f" metalness={0.5} roughness={0.4} />
          </mesh>
          {[-0.7, 0.7].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[R + 0.02, 0.03, 8, 64]} />
              <meshStandardMaterial color="#3dff7a" emissive="#3dff7a" emissiveIntensity={2.2 * reactor} />
            </mesh>
          ))}
          {[-1, 1].map((k) => (
            <mesh key={k} position={[0, 0, k * (R + 0.03)]} rotation={[0, k > 0 ? 0 : Math.PI, 0]}>
              <planeGeometry args={[0.8, 0.8]} />
              <meshStandardMaterial map={trefoilTex()} transparent alphaTest={0.5} emissive="#ffd400" emissiveIntensity={0.25} />
            </mesh>
          ))}
        </group>
      ) : null}
      {children}
    </group>
  );
};
