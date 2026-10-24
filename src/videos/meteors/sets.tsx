import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { ViewMode } from "../../lib/ViewMode";
import { fonts } from "../../lib/theme";
import { easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { Cam, CameraRig, Glow, project, Stars3D, ThinLine, TubePath, V3 } from "../../lib/three/core";
import { c } from "./cues";

type SetProps = { f: number };
const GOLD = "#ffd166";
const BLUE = "#7fb6ff";

const Canvas: React.FC<{ children: React.ReactNode; cam: Cam; fog?: [string, number, number] }> = ({ children, cam, fog }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: cam.fov ?? 40, near: 0.01, far: 2000 }} gl={{ antialias: true }}>
      <CameraRig cam={cam} />
      {fog ? <fog attach="fog" args={fog} /> : null}
      {children}
    </ThreeCanvas>
  );
};
const at = (cam: Cam, p: V3) => project(p, cam, 1080, 1920);

// ───────────────────────── shared 2D sky: stars, milky way, hills, meteors ─────────────────────────
const STARS = (() => {
  const r = seeded(5);
  return Array.from({ length: 420 }, () => ({ x: r() * 1080, y: r() * 1500, s: 0.6 + r() * 2.2, p: r() * 6.28 }));
})();

/** One meteor streak: from (x,y) along angle `a`, `len` px, alive [t0, t0+dur). Fades in and out (no strobe). */
type Streak = { x: number; y: number; a: number; len: number; t0: number; dur: number; w: number };

const Streaks: React.FC<{ f: number; list: Streak[]; color?: string }> = ({ f, list, color = "#eaf2ff" }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <linearGradient id="mtail" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={color} stopOpacity="0" />
        <stop offset="0.85" stopColor={color} stopOpacity="0.9" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="1" />
      </linearGradient>
    </defs>
    {list.map((m, i) => {
      const k = (f - m.t0) / m.dur;
      if (k < 0 || k > 1) return null;
      const head = Math.min(1, k * 1.4); // head travels, tail follows
      const tail = Math.max(0, k * 1.4 - 0.45);
      const o = Math.sin(Math.PI * k);
      const dx = Math.cos(m.a);
      const dy = Math.sin(m.a);
      const x0 = m.x + dx * m.len * tail;
      const y0 = m.y + dy * m.len * tail;
      const x1 = m.x + dx * m.len * head;
      const y1 = m.y + dy * m.len * head;
      const L = Math.hypot(x1 - x0, y1 - y0);
      if (L < 1) return null;
      return (
        <g key={i} opacity={o} transform={`translate(${x0} ${y0}) rotate(${(Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI})`}>
          <rect x={0} y={-m.w / 2} width={L} height={m.w} rx={m.w / 2} fill="url(#mtail)" />
          <circle cx={L} cy={0} r={m.w * 1.6} fill="#ffffff" opacity={0.9} />
        </g>
      );
    })}
  </svg>
);

const Sky: React.FC<{ f: number; children?: React.ReactNode; leo?: number }> = ({ f, children, leo = 0 }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #02030a 0%, #070b1e 55%, #141a33 78%, #1f2238 82%)" }}>
    {/* milky way band */}
    <AbsoluteFill style={{ background: "linear-gradient(115deg, transparent 30%, rgba(170,180,255,0.10) 45%, rgba(255,230,200,0.12) 50%, rgba(170,180,255,0.08) 56%, transparent 70%)", filter: "blur(18px)" }} />
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {STARS.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s * 0.6} fill="#fff" opacity={0.45 + 0.35 * Math.sin(f * 0.05 + s.p)} />
      ))}
      {leo > 0 ? <Leo o={leo} /> : null}
    </svg>
    {children}
    {/* hills + a lone tree, silhouettes */}
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <path d="M 0 1560 Q 180 1490 360 1540 T 720 1520 T 1080 1500 L 1080 1920 L 0 1920 Z" fill="#05060c" />
      <path d="M 0 1640 Q 260 1580 540 1630 T 1080 1610 L 1080 1920 L 0 1920 Z" fill="#020306" />
    </svg>
  </AbsoluteFill>
);

// Leo, with its sickle; the radiant sits near the head (Regulus at the bottom of the sickle)
const LEO: [number, number][] = [
  [520, 520], // radiant area (sickle)
  [470, 560],
  [455, 620],
  [500, 670],
  [560, 690], // Regulus-ish
  [700, 640],
  [820, 600],
  [780, 700],
];
const Leo: React.FC<{ o: number }> = ({ o }) => (
  <g opacity={o}>
    <polyline points={LEO.slice(0, 5).map((p) => p.join(",")).join(" ")} fill="none" stroke="#9fb4ff" strokeWidth={2} strokeDasharray="6 6" />
    <polyline points={[LEO[4], LEO[5], LEO[6], LEO[7], LEO[5]].map((p) => p.join(",")).join(" ")} fill="none" stroke="#9fb4ff" strokeWidth={2} strokeDasharray="6 6" />
    {LEO.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={i === 4 ? 6 : 4.5} fill="#ffffff" />
    ))}
    <text x={600} y={760} fill="#9fb4ff" style={{ fontFamily: fonts.hud, fontSize: 34, letterSpacing: 6 }}>
      LEO
    </text>
  </g>
);

const RADIANT: [number, number] = [520, 520];
const radiantStreaks = (n: number, t0: number, span: number, seed: number, minLen = 160, maxLen = 420): Streak[] => {
  const r = seeded(seed);
  return Array.from({ length: n }, () => {
    const a = r() * Math.PI * 2;
    const start = 40 + r() * 260; // start a little away from the radiant
    return {
      x: RADIANT[0] + Math.cos(a) * start,
      y: RADIANT[1] + Math.sin(a) * start,
      a,
      len: minLen + r() * (maxLen - minLen),
      t0: t0 + r() * span,
      dur: 14 + r() * 10,
      w: 2.5 + r() * 3,
    };
  });
};

// ───────────────────────── A · the sky (hook, payoff, loop) ─────────────────────────
const HOOK_STREAK: Streak[] = [{ x: 980, y: 260, a: Math.PI * 0.74, len: 900, t0: -10, dur: 46, w: 10 }];

export const SetSky: React.FC<SetProps> = ({ f }) => {
  const payoff = f >= c.leonids && f < c.look;
  const leo = payoff ? ramp(f, c.leonids, c.leonids + 10) : 0;
  const list = useMemo(() => [...HOOK_STREAK, ...radiantStreaks(10, c.leonids, Math.max(30, c.look - c.leonids), 41)], []);
  return (
    <Sky f={f} leo={leo}>
      <Streaks f={f} list={payoff ? list : HOOK_STREAK} />
      {payoff ? <DatePill o={ramp(f, c.nov17 - 4, c.nov17 + 6)} /> : null}
    </Sky>
  );
};

const DatePill: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ position: "absolute", left: "50%", top: 300, transform: `translate(-50%,0) scale(${0.9 + 0.1 * o})`, opacity: o, textAlign: "center" }}>
    <div style={{ padding: "10px 30px", borderRadius: 20, background: "rgba(8,10,22,0.8)", border: "1.5px solid rgba(255,255,255,0.15)" }}>
      <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 5, color: "#9fb4ff" }}>LEONIDS 2026 · PEAK NIGHT</div>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 80, color: GOLD, whiteSpace: "nowrap" }}>NOV 17–18</div>
    </div>
  </div>
);

// ───────────────────────── B · macro: a grain on a millimetre ruler ─────────────────────────
const Grain: React.FC<{ size: number; seed: number; color: string; emissive?: string; glow?: number } & { position: V3 }> = ({ size, seed, color, emissive = "#000000", glow = 0, position }) => {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const r = seeded(seed);
    const bumps = Array.from({ length: 6 }, () => [r() * 6, r() * 6, r() * 0.3]);
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      let k = 1;
      bumps.forEach(([a, b, s]) => (k += s * Math.sin(v.x * a + b) * Math.cos(v.y * b + a)));
      v.multiplyScalar(k);
      p.setXYZ(i, v.x, v.y * 0.8, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, [seed]);
  return (
    <group position={position} scale={size}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={glow} roughness={0.8} />
      </mesh>
    </group>
  );
};

let rulerTex: THREE.CanvasTexture | null = null;
const rulerTexture = () => {
  if (rulerTex) return rulerTex;
  const cv = document.createElement("canvas");
  cv.width = 1024;
  cv.height = 160;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#e9e4d6";
  g.fillRect(0, 0, 1024, 160);
  g.fillStyle = "#1a1a1a";
  for (let i = 0; i <= 40; i++) {
    const x = 32 + i * 24;
    const h = i % 10 === 0 ? 70 : i % 5 === 0 ? 50 : 32;
    g.fillRect(x - 1.5, 0, 3, h);
    if (i % 10 === 0) {
      g.font = "bold 34px Arial";
      g.textAlign = "center";
      g.fillText(`${i / 10}`, x, 112);
    }
  }
  g.font = "bold 26px Arial";
  g.fillText("cm", 1000, 150);
  rulerTex = new THREE.CanvasTexture(cv);
  rulerTex.anisotropy = 8;
  return rulerTex;
};

export const SetMacro: React.FC<SetProps> = ({ f }) => {
  // 1 unit = 1 mm here; ruler ticks every 1 mm (24 px of 1024 over 42.7 units → ~1 unit)
  const cam: Cam = {
    pos: keys3(f, [
      [c.grain, [0.7, 15, 12.5]],
      [c.these, [0.7, 12.5, 10.5]],
    ]),
    look: [0.65, 0, 0],
    fov: 30,
  };
  const glowK = ramp(f, c.grain + 8, c.grain + 22);
  const sand = at(cam, [-0.4, 0.6, 0.4]);
  const dust = at(cam, [1.7, 0.6, 0.4]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #1b1d2a 0%, #07080e 70%)" }}>
      <Canvas cam={cam}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 6, 4]} intensity={1.8} castShadow />
        {/* ruler: 1 unit = 1 mm */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3, 0, -1.2]} receiveShadow>
          <planeGeometry args={[42.7, 6.7]} />
          <meshStandardMaterial map={rulerTexture()} color="#a9a497" roughness={0.8} />
        </mesh>
        <Grain size={0.45} seed={3} color="#c9a46a" position={[-0.4, 0.38, 0.4]} />
        <Grain size={0.35} seed={9} color="#3b3532" emissive="#ffb070" glow={1.5 * glowK} position={[1.7, 0.3, 0.4]} />
        {glowK > 0 ? <Glow position={[1.7, 0.35, 0.4]} size={2.2 * glowK} color="#ffcf8a" /> : null}
      </Canvas>
      {sand ? <MiniLabel x={sand.x} y={sand.y - 140} text="SAND GRAIN" sub="~1 MM" /> : null}
      {dust && glowK > 0.3 ? <MiniLabel x={dust.x} y={dust.y - 140} text="COMET DUST" sub="A SHOOTING STAR" color={GOLD} /> : null}
    </AbsoluteFill>
  );
};

const MiniLabel: React.FC<{ x: number; y: number; text: string; sub?: string; color?: string }> = ({ x, y, text, sub, color = "#ffffff" }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,0)", textAlign: "center", whiteSpace: "nowrap" }}>
    <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 38, letterSpacing: 3, color }}>{text}</div>
    {sub ? <div style={{ fontFamily: fonts.hud, fontSize: 26, letterSpacing: 3, color: "#c9d0ff" }}>{sub}</div> : null}
    <div style={{ width: 3, height: 70, background: color, margin: "6px auto 0", opacity: 0.8 }} />
  </div>
);

// ───────────────────────── C · solar system: the comet's dust trail, Earth drives through ─────────────────────────
const cometOrbit = (t: number): V3 => {
  // ellipse, sun at a focus, tilted; perihelion near Earth's orbit (R = 4)
  const a = 9;
  const e = 0.9;
  const E = t * Math.PI * 2;
  const x = a * (Math.cos(E) - e);
  const z = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const tilt = 0.28;
  return [x * Math.cos(0.4) - z * Math.sin(0.4), x * Math.sin(tilt) * 0.3, x * Math.sin(0.4) + z * Math.cos(0.4)];
};

export const SetOrbit: React.FC<SetProps> = ({ f }) => {
  const R = 4;
  const ring = useMemo(() => Array.from({ length: 121 }, (_, i) => new THREE.Vector3(Math.cos((i / 120) * Math.PI * 2) * R, 0, Math.sin((i / 120) * Math.PI * 2) * R)), []);
  const comet = useMemo(() => Array.from({ length: 241 }, (_, i) => new THREE.Vector3(...cometOrbit(i / 240))), []);
  // dust particles strung along the orbit, thicker near the comet
  const dust = useMemo(() => {
    const r = seeded(17);
    return Array.from({ length: 900 }, () => {
      const t = r();
      const p = cometOrbit(t);
      return [p[0] + (r() - 0.5) * 0.35, p[1] + (r() - 0.5) * 0.12, p[2] + (r() - 0.5) * 0.35] as V3;
    });
  }, []);
  const dustGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(dust.flat(), 3));
    return g;
  }, [dust]);
  // where Earth's orbit meets the stream: pick the orbit point closest to radius R
  const cross = useMemo(() => {
    let best = 0;
    let bd = 1e9;
    for (let i = 0; i < 1000; i++) {
      const p = cometOrbit(i / 1000);
      const d = Math.abs(Math.hypot(p[0], p[2]) - R) + (p[2] > 0 ? 0 : 5);
      if (d < bd) {
        bd = d;
        best = i / 1000;
      }
    }
    const p = cometOrbit(best);
    return Math.atan2(p[2], p[0]);
  }, []);
  const earthA = keys(f, [
    [c.these, cross - 1.2],
    [c.drives + 10, cross],
    [c.each, cross + 0.15],
  ]);
  const earth: V3 = [Math.cos(earthA) * R, 0, Math.sin(earthA) * R];
  const cometPos = cometOrbit(0.62 + (f - c.these) * 0.0006);
  const cam: Cam = {
    pos: keys3(f, [
      [c.these, [0, 15, 13]],
      [c.november, [2, 9, 12]],
      [c.drives, [earth[0] + 3, 2.2, earth[2] + 4]],
      [c.each, [earth[0] + 1.6, 1.0, earth[2] + 2.0]],
    ]),
    look: keys3(f, [
      [c.these, [0, 0, 0]],
      [c.november, [earth[0] * 0.5, 0, earth[2] * 0.5]],
      [c.drives, earth],
    ]),
    fov: 40,
  };
  const inStream = ramp(f, c.drives + 4, c.drives + 14);
  const sunP = at(cam, [0, 0, 0]);
  const cometP = at(cam, cometPos);
  const earthP = at(cam, earth);
  return (
    <AbsoluteFill style={{ background: "#020308" }}>
      <Canvas cam={cam}>
        <Stars3D frame={f} count={1500} radius={300} size={0.9} />
        <pointLight position={[0, 0, 0]} intensity={3} decay={0} />
        <mesh>
          <sphereGeometry args={[0.6, 32, 24]} />
          <meshBasicMaterial color="#fff2c0" />
        </mesh>
        <Glow position={[0, 0, 0]} size={4} color="#ffd27a" />
        <ThinLine points={ring} color={BLUE} opacity={0.6} />
        <ThinLine points={comet} color={GOLD} opacity={0.35} />
        <points geometry={dustGeo}>
          <pointsMaterial size={0.06} color="#ffe2a8" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
        </points>
        {/* comet nucleus + tail pointing away from the sun */}
        <Glow position={cometPos} size={0.9} color="#cfe9ff" />
        <mesh position={cometPos}>
          <sphereGeometry args={[0.06, 12, 10]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Earth */}
        <mesh position={earth}>
          <sphereGeometry args={[0.22, 32, 24]} />
          <meshStandardMaterial color="#3d7bd9" emissive="#123a7a" emissiveIntensity={0.4} />
        </mesh>
        <Glow position={earth} size={0.9 + inStream * 0.6} color={inStream > 0 ? "#ffd27a" : "#7fb6ff"} opacity={0.6} />
      </Canvas>
      {sunP && f < c.drives ? <Tag x={sunP.x} y={sunP.y + 120} text="SUN" /> : null}
      {cometP && f >= c.comet && f < c.drives ? <Tag x={cometP.x} y={cometP.y + 40} text="TEMPEL-TUTTLE" sub="COMET · 33-YEAR ORBIT" color={GOLD} /> : null}
      {earthP && f >= c.november ? <Tag x={earthP.x} y={earthP.y + 50} text="EARTH" sub={f >= c.drives ? "IN THE DUST TRAIL" : "EVERY NOVEMBER"} color={BLUE} /> : null}
    </AbsoluteFill>
  );
};

const Tag: React.FC<{ x: number; y: number; text: string; sub?: string; color?: string }> = ({ x, y, text, sub, color = "#ffffff" }) => (
  <div style={{ position: "absolute", left: Math.min(900, Math.max(180, x)), top: y, transform: "translate(-50%,0)", textAlign: "center", whiteSpace: "nowrap" }}>
    <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 36, letterSpacing: 3, color }}>{text}</div>
    {sub ? <div style={{ fontFamily: fonts.hud, fontSize: 24, letterSpacing: 3, color: "#c9d0ff" }}>{sub}</div> : null}
  </div>
);

// ───────────────────────── D · entry: the grain falls into the atmosphere; speed bars ─────────────────────────
const atmosphere = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying vec3 vV;
    void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying vec3 vV;
    void main(){ float fr = pow(1. - max(dot(vN, vV), 0.), 3.0); gl_FragColor = vec4(vec3(0.35,0.62,1.0)*fr*1.8, fr); }`,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
export const SetEntry: React.FC<SetProps> = ({ f }) => {
  const cam: Cam = { pos: [0, 7.5, 24], look: [0, 1.2, 0], fov: 40 };
  // a streak plunging toward the limb, repeating so there is always one in flight
  const k = ((f - c.each) % 24) / 24;
  const from: V3 = [9, 14, -2];
  const to: V3 = [-1.5, 1.3, 1];
  const head: V3 = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k];
  return (
    <AbsoluteFill style={{ background: "#010206" }}>
      <Canvas cam={cam}>
        <Stars3D frame={f} count={1200} radius={200} size={0.7} />
        <directionalLight position={[-6, 3, 4]} intensity={2} />
        {/* Earth limb + atmosphere */}
        <mesh position={[0, -18, 0]}>
          <sphereGeometry args={[19, 96, 64]} />
          <meshStandardMaterial color="#1a3f7a" emissive="#0b1d3d" emissiveIntensity={0.6} roughness={0.9} />
        </mesh>
        <mesh position={[0, -18, 0]} scale={1.03} material={atmosphere}>
          <sphereGeometry args={[19, 96, 64]} />
        </mesh>
        {/* a continuous glowing trail behind the head (sprites alone read as a dotted line) */}
        <TubePath
          points={[
            new THREE.Vector3(...from).lerp(new THREE.Vector3(...head), Math.max(0, 1 - 0.35 / Math.max(k, 0.05))),
            new THREE.Vector3(...head),
          ]}
          radius={0.06}
          color="#ffd27a"
          opacity={0.85}
        />
        <Glow position={head} size={1.2 + 1.8 * k} color="#fff1c9" />
        {[0.06, 0.12, 0.18, 0.24].map((d, i) => {
          const kk = Math.max(0, k - d);
          return (
            <Glow
              key={i}
              position={[from[0] + (to[0] - from[0]) * kk, from[1] + (to[1] - from[1]) * kk, from[2] + (to[2] - from[2]) * kk]}
              size={0.9 * (1 - i * 0.2)}
              color="#ffd27a"
              opacity={0.7 - i * 0.15}
            />
          );
        })}
      </Canvas>
      <SpeedBars f={f} />
    </AbsoluteFill>
  );
};

const SpeedBars: React.FC<{ f: number }> = ({ f }) => {
  const o = ramp(f, c.times70 - 4, c.times70 + 6);
  if (o <= 0) return null;
  const grow = ramp(f, c.times70, c.bullet + 10, easeOut);
  const row = (label: string, sub: string, w: number, color: string, top: number) => (
    <div style={{ position: "absolute", left: 80, top, opacity: o }}>
      <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 42, letterSpacing: 3, color }}>
        {label} <span style={{ color: "#c9d0ff", fontWeight: 600, fontSize: 34 }}>{sub}</span>
      </div>
      <div style={{ marginTop: 8, height: 34, width: Math.max(10, w), borderRadius: 17, background: color, boxShadow: `0 0 24px ${color}88` }} />
    </div>
  );
  return (
    <>
      {row("RIFLE BULLET", "≈ 1 KM/S", 13 * grow, "#c9d0ff", 470)}
      {row("METEOR", "70 KM/S", 920 * grow, GOLD, 590)}
    </>
  );
};

// ───────────────────────── E · not friction: air squeezed in front glows (thermal) ─────────────────────────
const MOLECULES = (() => {
  const r = seeded(23);
  return Array.from({ length: 260 }, () => ({ x: r() * 16 - 8, y: (r() - 0.5) * 7, z: (r() - 0.5) * 2 }));
})();

export const SetGlow: React.FC<SetProps> = ({ f }) => {
  const squeeze = ramp(f, c.squeezed - 6, c.squeezed + 18, easeOut);
  const thermal = f >= c.squeezed;
  const cam: Cam = { pos: [0.6, 0.4, 7.5], look: [0, 0, 0], fov: 40 };
  // 0.35 units/frame made the dots jump so far they flickered (A→B→A); slower + streaks reads as speed
  const speed = 0.09;
  return (
    <ViewMode mode={thermal ? "thermal" : "normal"} id="glow">
      <AbsoluteFill style={{ background: "#04050c" }}>
        <Canvas cam={cam}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 3, 5]} intensity={1.4} />
          {/* the grain travels left → right; we ride with it, so air streams past right → left */}
          <Grain size={0.55} seed={9} color="#3b3532" emissive="#ff9a4a" glow={1.2 * squeeze} position={[0, 0, 0]} />
          {MOLECULES.map((m, i) => {
            let x = ((((m.x - f * speed) % 16) + 24) % 16) - 8;
            const dy = m.y;
            // in front of the grain (x > 0, close to the axis) molecules pile up into a cap
            const nearAxis = Math.exp(-(dy * dy) / 1.2);
            if (x > 0 && x < 2.2) x = 0.6 + (x - 0.6) * (1 - 0.8 * squeeze * nearAxis);
            const y = dy * (x > 0.4 ? 1 : 1 + (0.4 - x) * 0.15 * squeeze);
            const hot = squeeze * nearAxis * Math.max(0, 1 - Math.abs(x - 0.9) / 1.0);
            return (
              <mesh key={i} position={[x, y, m.z]} scale={[0.22 * (1 - 0.6 * hot) + 0.05, 0.035 + 0.04 * hot, 0.035 + 0.04 * hot]}>
                <sphereGeometry args={[1, 10, 6]} />
                <meshBasicMaterial color={new THREE.Color("#8fb6ff").lerp(new THREE.Color("#ffffff"), hot)} toneMapped={false} />
              </mesh>
            );
          })}
          {squeeze > 0 ? <Glow position={[0.95, 0, 0.2]} size={3.2 * squeeze} color="#ffffff" opacity={0.9} /> : null}
        </Canvas>
        <FrictionTag f={f} />
        {f >= c.squeezed ? <AirLabel o={ramp(f, c.squeezed, c.squeezed + 8)} /> : null}
      </AbsoluteFill>
    </ViewMode>
  );
};

const FrictionTag: React.FC<{ f: number }> = ({ f }) => {
  const o = ramp(f, c.friction - 2, c.friction + 6) * (1 - ramp(f, c.air + 10, c.air + 18));
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: "50%", top: 330, transform: "translate(-50%,0)", opacity: o }}>
      <div style={{ position: "relative", fontFamily: fonts.punch, fontWeight: 900, fontSize: 96, color: "#ffffff" }}>
        FRICTION
        <div style={{ position: "absolute", left: -20, right: -20, top: "52%", height: 12, background: "#ff3b4a", transform: "rotate(-6deg)", opacity: ramp(f, c.friction + 4, c.friction + 9) }} />
      </div>
    </div>
  );
};

const AirLabel: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ position: "absolute", left: "50%", top: 420, transform: "translate(-50%,0)", opacity: o, textAlign: "center", whiteSpace: "nowrap" }}>
    <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 44, letterSpacing: 4, color: "#ffffff" }}>AIR SQUEEZED IN FRONT</div>
    <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 4, color: "#ffd9b0" }}>→ HEATS UP AND GLOWS</div>
  </div>
);

// ───────────────────────── F · altitude: it all happens ~100 km up (SVG) ─────────────────────────
export const SetAltitude: React.FC<SetProps> = ({ f }) => {
  // 0 km at y=1250, 120 km at y≈340 — the captions sit below the ground line
  const Y = (km: number) => 1250 - km * 7.6;
  const band = ramp(f, c.km100 - 6, c.km100 + 8);
  const tick = (km: number, label: string) => (
    <g key={km}>
      <line x1={120} y1={Y(km)} x2={150} y2={Y(km)} stroke="#9fb4ff" strokeWidth={3} />
      <text x={110} y={Y(km) + 10} textAnchor="end" fill="#9fb4ff" style={{ fontFamily: fonts.hud, fontSize: 28 }}>
        {label}
      </text>
    </g>
  );
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #010208 0%, #050a1c 50%, #0c1a3a 85%, #1a3a6a 100%)" }}>
      <svg width={1080} height={1920}>
        <line x1={150} y1={Y(0)} x2={150} y2={Y(125)} stroke="#9fb4ff" strokeWidth={3} />
        {[0, 20, 40, 60, 80, 100, 120].map((km) => tick(km, `${km} KM`))}
        {/* meteor band 80–120 km */}
        <rect x={160} y={Y(120)} width={880} height={Y(80) - Y(120)} fill="#ffb347" opacity={0.12 * band} />
        <text x={1030} y={Y(120) + 40} textAnchor="end" fill={GOLD} opacity={band} style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 32, letterSpacing: 3 }}>
          SHOOTING STARS · 80–120 KM
        </text>
        {/* a streak inside the band */}
        <g opacity={band}>
          <line x1={760} y1={Y(112)} x2={420} y2={Y(94)} stroke="#fff1c9" strokeWidth={6} strokeLinecap="round" />
          <circle cx={420} cy={Y(94)} r={10} fill="#ffffff" />
        </g>
        {/* airliner for scale at ~11 km */}
        <g transform={`translate(640 ${Y(11)})`} fill="#c9d0ff">
          <rect x={-60} y={-6} width={120} height={12} rx={6} />
          <path d="M -10 0 L -40 -40 L -20 -40 L 20 0 Z" />
          <path d="M 45 -6 L 60 -26 L 66 -26 L 60 -6 Z" />
        </g>
        <text x={720} y={Y(11) + 8} fill="#c9d0ff" style={{ fontFamily: fonts.hud, fontSize: 26, letterSpacing: 2 }}>
          AIRLINER · 11 KM
        </text>
        {/* ground + you */}
        <rect x={0} y={Y(0)} width={1080} height={800} fill="#050608" />
        <g transform={`translate(540 ${Y(0)})`} fill="#e9ecf5">
          <circle cx={0} cy={-62} r={11} />
          <rect x={-8} y={-50} width={16} height={34} rx={6} />
          <rect x={-8} y={-18} width={6} height={18} />
          <rect x={2} y={-18} width={6} height={18} />
        </g>
        <text x={570} y={Y(0) - 30} fill="#e9ecf5" style={{ fontFamily: fonts.hud, fontSize: 28, letterSpacing: 2 }}>
          YOU
        </text>
        {/* 100 km bracket */}
        <g opacity={band}>
          <line x1={500} y1={Y(0) - 80} x2={500} y2={Y(100)} stroke={GOLD} strokeWidth={4} strokeDasharray="12 8" />
          <rect x={300} y={(Y(0) + Y(100)) / 2 - 38} width={190} height={76} rx={10} fill="rgba(8,10,22,0.85)" stroke={GOLD} strokeWidth={3} />
          <text x={395} y={(Y(0) + Y(100)) / 2 + 16} textAnchor="middle" fill={GOLD} style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 46 }}>
            100 KM
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ───────────────────────── G · a handful an hour vs the 1966 storm ─────────────────────────
export const SetStorm: React.FC<SetProps> = ({ f }) => {
  const storm = f >= c.y1966;
  const calm = useMemo(() => radiantStreaks(2, c.most + 6, 40, 7, 260, 420), []);
  const heavy = useMemo(() => radiantStreaks(180, c.y1966, Math.max(40, c.leonids - c.y1966 - 10), 12, 120, 380), []);
  return (
    <Sky f={f} leo={storm ? ramp(f, c.y1966, c.y1966 + 10) : 0}>
      <Streaks f={f} list={storm ? heavy : calm} />
      {storm ? <StormTag o={ramp(f, c.y1966, c.y1966 + 8)} big={ramp(f, c.thousands, c.thousands + 8)} /> : <CalmTag o={ramp(f, c.most + 4, c.most + 12)} />}
    </Sky>
  );
};

const CalmTag: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ position: "absolute", left: "50%", top: 300, transform: "translate(-50%,0)", opacity: o, padding: "10px 28px", borderRadius: 20, background: "rgba(8,10,22,0.8)", textAlign: "center" }}>
    <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 84, color: "#c9d0ff" }}>~10</span>
    <span style={{ fontFamily: fonts.punch, fontWeight: 700, fontSize: 38, color: "#c9d0ff" }}> / HOUR</span>
  </div>
);

const StormTag: React.FC<{ o: number; big: number }> = ({ o, big }) => (
  <div style={{ position: "absolute", left: "50%", top: 260, transform: "translate(-50%,0)", opacity: o, textAlign: "center", whiteSpace: "nowrap" }}>
    <div style={{ display: "inline-block", padding: "6px 20px", background: "rgba(8,10,22,0.8)", fontFamily: fonts.hud, fontWeight: 700, fontSize: 38, letterSpacing: 4, color: "#ffffff" }}>NOV 17, 1966</div>
    <div style={{ marginTop: 16, opacity: big, transform: `scale(${0.85 + 0.15 * big})` }}>
      <span style={{ padding: "8px 26px", borderRadius: 20, background: "rgba(8,10,22,0.94)", fontFamily: fonts.punch, fontWeight: 900, fontSize: 72, color: GOLD }}>THOUSANDS / MIN</span>
    </div>
  </div>
);
