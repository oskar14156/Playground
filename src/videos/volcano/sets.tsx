import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { HudOverlay, ViewMode } from "../../lib/ViewMode";
import { fonts } from "../../lib/theme";
import { easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { Cam, CameraRig, Glow, project, Stars3D, V3 } from "../../lib/three/core";
import { Drift } from "../../lib/three/fx";
import { Humanoid, walk } from "../../lib/three/Humanoid";
import { AshCloud, BlastForest, LavaRiver } from "../../lib/three/volcanic";
import { Volcano } from "../../lib/three/Volcano";
import { c } from "./cues";

type SetProps = { f: number };

const Canvas: React.FC<{ children: React.ReactNode; cam: Cam; fog?: [string, number, number] }> = ({ children, cam, fog }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.05, far: 600 }} gl={{ antialias: true }}>
      <CameraRig cam={cam} />
      {fog ? <fog attach="fog" args={fog} /> : null}
      {children}
    </ThreeCanvas>
  );
};
const at = (cam: Cam, p: V3) => project(p, cam, 1080, 1920);

const NIGHT = "linear-gradient(180deg, #04060d 0%, #0b1226 60%, #1c1a2a 100%)";
const DAY = "linear-gradient(180deg, #4f7fbf 0%, #8fb4de 55%, #dfe8ef 100%)";

// ───────────────────────── A · night: a slow lava dome glowing in the crater (hook + loop) ─────────────────────────
const Dome: React.FC<{ f: number; position: V3; size: number }> = ({ f, position, size }) => {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 4);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      const n = 1 + 0.12 * Math.sin(v.x * 7) * Math.cos(v.z * 6) + 0.08 * Math.sin(v.y * 11 + v.x * 3);
      v.multiplyScalar(n);
      p.setXYZ(i, v.x, Math.max(-0.1, v.y) * 0.55, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const pulse = 0.85 + 0.15 * Math.sin(f * 0.05);
  return (
    <group position={position} scale={size}>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#2a1a14" emissive="#ff5a14" emissiveIntensity={0.55 * pulse} roughness={0.95} />
      </mesh>
      <Glow position={[0, 0.3, 0]} size={3.2} color="#ff6a2a" opacity={0.55 * pulse} />
    </group>
  );
};

export const SetDome: React.FC<SetProps> = ({ f }) => {
  const t = keys(f, [
    [0, 0],
    [c.hawaii, 1],
    [c.danger, 0.6],
    [c.end - 2, 0],
  ]);
  const cam: Cam = { pos: [3.2 - 0.6 * t, 2.6 - 0.2 * t, -9.5 + 1.4 * t], look: [0, 1.5, 0], fov: 38 };
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <Canvas cam={cam} fog={["#0a0d18", 10, 40]}>
        <hemisphereLight args={["#4d5d8a", "#1a0e0a", 0.55]} />
        <directionalLight position={[-6, 8, -10]} intensity={0.35} color="#9fb2ff" />
        <pointLight position={[0, 2.2, -0.6]} intensity={14} distance={9} decay={1.6} color="#ff6a2a" />
        <Stars3D frame={f} count={900} radius={150} size={0.5} />
        <Volcano kind="strato" collapse={1} snow={0.25} />
        <Dome f={f} position={[0, 1.42, -0.35]} size={0.75} />
        {/* steam drifting off the dome */}
        <AshCloud t={f + 60} origin={[0, 1.8, -0.3]} dir={[0.4, 0, 0.6]} speed={0.008} spread={1.2} count={24} color="#3a3634" size={0.35} rise={0.008} seed={8} />
      </Canvas>
    </AbsoluteFill>
  );
};

// ───────────────────────── B · Hawaii: a lava river at night, a hiker walks away ─────────────────────────
const RIVER: V3[] = (() => {
  const pts: V3[] = [];
  for (let i = 0; i <= 14; i++) {
    const z = -18 + i * 1.6;
    pts.push([Math.sin(i * 0.55) * 1.6 + i * 0.12, 0, z]);
  }
  return pts;
})();

export const SetHawaii: React.FC<SetProps> = ({ f }) => {
  const front = keys(f, [
    [c.hawaii, 0.82],
    [c.so, 0.9],
  ]);
  const cam: Cam = {
    pos: keys3(f, [
      [c.hawaii, [3.4, 0.75, 9.5]],
      [c.creep, [3.0, 0.6, 8.2]],
      [c.walk, [4.4, 0.7, 8.6]],
      [c.so, [4.6, 0.7, 8.8]],
    ]),
    look: keys3(f, [
      [c.hawaii, [0.6, 0.15, -3]],
      [c.creep, [1.0, 0.1, 1.5]],
      [c.walk, [2.6, 0.5, 4.2]],
    ]),
    fov: 40,
  };
  const hikerZ = 3.2 + (f - c.hawaii) * 0.012;
  const hikerT = (f - c.hawaii) / 30;
  return (
    <AbsoluteFill style={{ background: NIGHT }}>
      <Canvas cam={cam} fog={["#0b0f1c", 12, 60]}>
        <hemisphereLight args={["#3d4a70", "#120806", 0.4]} />
        <Stars3D frame={f} count={900} radius={150} size={0.5} />
        {/* the shield volcano on the horizon with a glowing vent */}
        <Volcano kind="shield" position={[-6, 0, -48]} />
        <Glow position={[-6, 1.4, -48]} size={8} color="#ff7a2a" opacity={0.7} fog={false} />
        {/* dark basalt plain */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial color="#151110" roughness={1} />
        </mesh>
        <LavaRiver points={RIVER} width={0.75} progress={front} flow={f * 0.004} />
        {/* the hiker: lit by the lava, walking away from the front */}
        <pointLight position={[2.0, 0.6, hikerZ - 0.4]} intensity={2.2} distance={3} decay={1.5} color="#ff8a3a" />
        <group position={[2.4, 0, hikerZ]} rotation={[0, 0.3, 0]} scale={0.32}>
          <Humanoid pose={walk(hikerT, 0.9)} look={{ suit: "#c86a2a", helmet: "none", skin: "#c9a68a", boots: "#2a2a2a" }} />
        </group>
        <Drift frame={f} count={120} box={[6, 2, 10]} velocity={[0, 0.01, 0]} size={0.06} color="#ffb070" opacity={0.6} seed={6} />
      </Canvas>
    </AbsoluteFill>
  );
};

// ───────────────────────── C/E · Mount St. Helens in daylight: calm, swelling, collapse, blast ─────────────────────────
export const SetHelens: React.FC<SetProps> = ({ f }) => {
  const bulge = ramp(f, c.pressure, c.y1980 + 6);
  const collapse = ramp(f, c.slid - 4, c.slid + 26, easeOut);
  const blastT = f - c.burst + 4;
  const danger = f >= c.burst && f < c.blast;
  const cam: Cam = {
    pos: keys3(f, [
      [c.so, [-20, 2.2, 2]],
      [c.every, [-18.5, 2.1, 1.5]],
      [c.pressure, [-19, 2.4, -1]],
      [c.slid, [-19.5, 2.5, -1.5]],
      [c.burst + 10, [-21, 2.8, -3]],
      [c.blast, [-26, 4.2, -6]],
    ]),
    look: keys3(f, [
      [c.so, [0, 1.6, 0]],
      [c.pressure, [0, 1.6, -1.5]],
      [c.slid, [0, 1.6, -1.5]],
      [c.burst + 10, [0, 2.0, -7]],
    ]),
    fov: 36,
  };
  const st = f - c.burst;
  const shake = st >= 0 && st < 24 ? Math.sin(st * 0.9) * 0.12 * (1 - st / 24) : 0;
  cam.pos = [cam.pos[0] + shake, cam.pos[1] + shake * 0.5, cam.pos[2]];
  const flank = at(cam, [0, 2.0, -2.0]);
  return (
    <ViewMode mode={danger ? "danger" : "normal"} id="helens">
      <AbsoluteFill style={{ background: DAY }}>
        <Canvas cam={cam} fog={["#c5d4e3", 30, 120]}>
          <hemisphereLight args={["#d6e6ff", "#4a4436", 1.0]} />
          <directionalLight position={[10, 14, -4]} intensity={2.4} color="#fff3dc" castShadow shadow-mapSize={[2048, 2048]} />
          <Volcano kind="strato" bulge={bulge} collapse={collapse} ground="#3f5a35" />
          {/* Spirit Lake-ish plain + forest around the base */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
            <planeGeometry args={[400, 400]} />
            <meshStandardMaterial color="#3f5a35" roughness={1} />
          </mesh>
          <BlastForest front={0} rMin={7.5} rMax={16} count={1600} scale={0.22} />
          {/* landslide debris pouring north */}
          <AshCloud t={f - c.slid + 2} origin={[0, 1.6, -2.2]} dir={[0, 0, -1]} speed={0.16} spread={0.8} count={90} color="#8a7a66" size={1.0} rise={-0.004} seed={4} />
          {/* lateral blast: low, fast, sideways */}
          <AshCloud t={blastT} origin={[0, 1.6, -2.5]} dir={[0, 0, -1]} speed={0.55} spread={2.2} count={320} color="#3e3b39" size={3.2} rise={0.025} seed={5} />
          {/* vertical plume */}
          <AshCloud t={blastT - 10} origin={[0, 2.4, -0.5]} dir={[0, 0, -1]} speed={0.03} spread={3} count={120} color="#55524f" size={2.8} rise={0.14} seed={6} />
        </Canvas>
        {flank && f >= c.pressure && f < c.north ? <Tag x={flank.x} y={flank.y} text="NORTH FLANK SWELLING" o={ramp(f, c.pressure + 4, c.pressure + 10)} /> : null}
        {f >= c.y1980 && f < c.blast ? <DateTag o={ramp(f, c.y1980, c.y1980 + 6)} /> : null}
      </AbsoluteFill>
    </ViewMode>
  );
};

const Tag: React.FC<{ x: number; y: number; text: string; o: number }> = ({ x, y, text, o }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: o }}>
    <div style={{ position: "absolute", left: -10, top: -10, width: 20, height: 20, border: "3px solid #ffd166" }} />
    <div style={{ position: "absolute", left: -1.5, top: -140, width: 3, height: 130, background: "#ffd166" }} />
    <div
      style={{
        position: "absolute",
        top: -200,
        left: -40,
        whiteSpace: "nowrap",
        background: "#ffd166",
        color: "#111",
        padding: "4px 16px",
        fontFamily: fonts.hud,
        fontWeight: 700,
        fontSize: 38,
        letterSpacing: 2,
      }}
    >
      {text}
    </div>
  </div>
);

const DateTag: React.FC<{ o: number }> = ({ o }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: 250,
      transform: "translate(-50%,0)",
      opacity: o,
      padding: "8px 24px",
      background: "rgba(10,12,18,0.82)",
      border: "2px solid rgba(255,255,255,0.25)",
      color: "#fff",
      fontFamily: fonts.hud,
      fontWeight: 700,
      fontSize: 46,
      letterSpacing: 4,
      whiteSpace: "nowrap",
    }}
  >
    MAY 18, 1980 · 8:32 AM
  </div>
);

// ───────────────────────── D · magma lab: runny vs sticky, bubbles escape vs trapped ─────────────────────────
const BUBBLES = (() => {
  const r = seeded(31);
  return Array.from({ length: 60 }, () => ({ x: (r() - 0.5) * 0.7, z: (r() - 0.5) * 0.7, y0: r() * 3.4, born: r() * 30, s: 0.05 + r() * 0.07, sp: 0.7 + r() * 0.6 }));
})();

const Tube: React.FC<{ f: number; x: number; color: string; runny: boolean }> = ({ f, x, color, runny }) => {
  const nucleate = ramp(f, c.every + 4, c.soda + 10);
  const go = runny ? ramp(f, c.runny, c.runny + 10) : 0;
  const H = 3.6;
  return (
    <group position={[x, 0, 0]}>
      {/* glass */}
      <mesh position={[0, H / 2, 0]}>
        <cylinderGeometry args={[0.55, 0.55, H + 0.1, 40, 1, true]} />
        <meshPhysicalMaterial color="#cfe9ff" transparent opacity={0.18} roughness={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* magma */}
      <mesh position={[0, H / 2 - 0.05, 0]}>
        <cylinderGeometry args={[0.5, 0.5, H - 0.1, 40]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} roughness={0.6} transparent opacity={0.88} />
      </mesh>
      {BUBBLES.map((b, i) => {
        const age = f - c.every - b.born;
        if (age < 0) return null;
        const grow = Math.min(1, age / 20) * nucleate;
        let y: number;
        if (runny) {
          // rise freely and leave at the top, then a new one forms at the bottom
          const span = H - 0.2;
          y = 0.1 + ((b.y0 + age * 0.06 * b.sp * go + (go > 0 ? 0 : 0)) % span);
        } else {
          // barely move; pack together and swell as pressure builds
          y = 0.15 + b.y0 * 0.9 + age * 0.0015;
        }
        const swell = runny ? 1 : 1 + ramp(f, c.trapped, c.pressure + 20) * 0.9;
        return (
          <mesh key={i} position={[b.x, Math.min(H - 0.15, y), b.z * 0.6 + 0.2]} scale={b.s * 1.5 * grow * swell}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} transparent opacity={0.95} />
          </mesh>
        );
      })}
      {/* puffs escaping from the runny tube */}
      {/* escaping gas drifts toward the middle, away from the RUNNY label above the tube */}
      {runny && go > 0 ? <AshCloud t={f - c.slip + 6} origin={[0.3, H + 0.05, 0.3]} dir={[1, 0, 0.3]} speed={0.02} spread={0.6} count={18} color="#bdb6ae" size={0.3} rise={0.004} seed={2} /> : null}
    </group>
  );
};

export const SetMagma: React.FC<SetProps> = ({ f }) => {
  const cam: Cam = {
    pos: keys3(f, [
      [c.every, [0, 2.4, 12.5]],
      [c.runny, [-0.5, 2.4, 11.8]],
      [c.sticky, [0.5, 2.3, 11.8]],
      [c.pressure, [0.5, 2.2, 11.6]],
    ]),
    look: [0, 2.0, 0],
    fov: 40,
  };
  const left = at(cam, [-1.3, 3.95, 0]);
  const right = at(cam, [1.3, 3.95, 0]);
  return (
    <AbsoluteFill
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(127,232,255,0.05) 0 2px, transparent 2px 60px), repeating-linear-gradient(90deg, rgba(127,232,255,0.05) 0 2px, transparent 2px 60px), #0a1220",
      }}
    >
      <Canvas cam={cam}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 6, 5]} intensity={1.2} />
        <Tube f={f} x={-1.3} color="#ff8a2a" runny />
        <Tube f={f} x={1.3} color="#b8401a" runny={false} />
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial color="#0c1626" roughness={1} />
        </mesh>
      </Canvas>
      {left ? <TubeLabel x={left.x} y={left.y} title="RUNNY" sub="BASALT · HAWAII" color="#ffb347" o={ramp(f, c.runny - 4, c.runny + 4)} /> : null}
      {right ? <TubeLabel x={right.x} y={right.y} title="STICKY" sub="DACITE · ST. HELENS" color="#ff6b4a" o={ramp(f, c.sticky - 4, c.sticky + 4)} /> : null}
    </AbsoluteFill>
  );
};

const TubeLabel: React.FC<{ x: number; y: number; title: string; sub: string; color: string; o: number }> = ({ x, y, title, sub, color, o }) => (
  <div style={{ position: "absolute", left: x, top: y - 130, transform: "translate(-50%,0)", opacity: o, textAlign: "center", whiteSpace: "nowrap" }}>
    <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 54, color }}>{title}</div>
    <div style={{ fontFamily: fonts.hud, fontWeight: 600, fontSize: 26, letterSpacing: 3, color: "#d8e6f5" }}>{sub}</div>
  </div>
);

// ───────────────────────── F · top-down map: the blast flattens the forest ─────────────────────────
export const SetMap: React.FC<SetProps> = ({ f }) => {
  const front = keys(f, [
    [c.blast, 6],
    [c.km30 + 10, 30],
  ]);
  // offset in +z so the screen's "up" is north (−Z); an x offset turned the map 90°
  const cam: Cam = { pos: [0, 66, -12.49], look: [0, 0, -12.5], fov: 42 };
  const v = at(cam, [0, 0, 0]);
  const edge = at(cam, [0, 0, -30]);
  const line = ramp(f, c.km30, c.km30 + 12, easeOut);
  return (
    <AbsoluteFill style={{ background: "#2c3f28" }}>
      <Canvas cam={cam}>
        <hemisphereLight args={["#e6efff", "#3a3226", 1.1]} />
        <directionalLight position={[10, 30, 10]} intensity={1.6} castShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#3c5636" roughness={1} />
        </mesh>
        <Volcano kind="strato" collapse={1} snow={0.6} ground="#3c5636" />
        {/* the 1980 blast fanned out to the north; the south side was largely spared */}
        <BlastForest front={front} rMin={7.5} rMax={36} count={5200} scale={0.9} sector={Math.PI * 0.5} />
        {/* the blast front ring (north fan) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
          <ringGeometry args={[front - 0.25, front + 0.25, 96, 1, 0, Math.PI]} />
          <meshBasicMaterial color="#ff6a3a" transparent opacity={0.9 * (1 - ramp(f, c.km30 + 10, c.km30 + 20))} toneMapped={false} />
        </mesh>
      </Canvas>
      {v && edge && line > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <line x1={v.x} y1={v.y} x2={v.x + (edge.x - v.x) * line} y2={v.y + (edge.y - v.y) * line} stroke="#ffd166" strokeWidth={5} strokeDasharray="16 10" />
          {line > 0.98 ? <line x1={edge.x - 30} y1={edge.y} x2={edge.x + 30} y2={edge.y} stroke="#ffd166" strokeWidth={5} /> : null}
          {line > 0.5 ? (
            <g opacity={ramp(line, 0.5, 1)}>
              <rect x={(v.x + edge.x) / 2 + 26} y={(v.y + edge.y) / 2 - 36} width={196} height={72} rx={10} fill="rgba(10,10,12,0.85)" stroke="#ffd166" strokeWidth={3} />
              <text x={(v.x + edge.x) / 2 + 124} y={(v.y + edge.y) / 2 + 16} textAnchor="middle" fill="#ffd166" style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 48, letterSpacing: 3 }}>
                30 KM
              </text>
            </g>
          ) : null}
        </svg>
      ) : null}
      <HudOverlay color="#ffffff" title="BLAST ZONE · NORTH" rec={false} lines={["TREES FLATTENED", "FAN-SHAPED, ~600 KM²"]} />
    </AbsoluteFill>
  );
};

// ───────────────────────── G · before/after height with the Eiffel Tower to scale (SVG) ─────────────────────────
export const SetHeight: React.FC<SetProps> = ({ f }) => {
  // vertical scale: show 1,700 m → 3,050 m; 1 m = 0.9 px
  const Y = (m: number) => 1500 - (m - 1700) * 0.9;
  const cut = ramp(f, c.lost + 4, c.m400 + 6, easeOut);
  const tower = ramp(f, c.eiffel - 6, c.eiffel + 6, easeOut);
  const before = 2950;
  const after = 2550;
  const prof = (top: number, notch: number) => {
    // simple cone profile cut flat at `top`; the north side (right) dips further when collapsed
    const slope = 1.7; // steep on purpose: a to-scale slope makes the missing top look like a plateau
    const halfAtTop = (before - top) * 0.9 / slope;
    return `M 40 ${Y(1700)} L ${540 - halfAtTop} ${Y(top)} L ${540 + halfAtTop * (1 - notch)} ${Y(top) + notch * 60} L ${540 + halfAtTop + notch * 160} ${Y(top - 300 * notch)} L 1040 ${Y(1700)} Z`;
  };
  const top = before - (before - after) * cut;
  return (
    <AbsoluteFill
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(127,232,255,0.06) 0 2px, transparent 2px 60px), repeating-linear-gradient(90deg, rgba(127,232,255,0.06) 0 2px, transparent 2px 60px), #061a2e",
      }}
    >
      <svg width={1080} height={1920}>
        {/* the missing top, outlined */}
        <path d={prof(before, 0)} fill="none" stroke="#ff8a8a" strokeWidth={4} strokeDasharray="16 10" opacity={cut} />
        <path d={prof(top, cut)} fill="#4a5568" stroke="#9fe9ff" strokeWidth={4} />
        {/* height lines */}
        {[
          { m: before, label: "BEFORE  2,950 M", c: "#ff8a8a", o: 1 },
          { m: after, label: "AFTER  2,550 M", c: "#9fe9ff", o: cut },
        ].map((l) => (
          <g key={l.label} opacity={l.o}>
            <line x1={60} y1={Y(l.m)} x2={1020} y2={Y(l.m)} stroke={l.c} strokeWidth={2} strokeDasharray="10 8" />
            <text x={70} y={Y(l.m) - 14} fill={l.c} style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 34, letterSpacing: 3 }}>
              {l.label}
            </text>
          </g>
        ))}
        {/* −400 M bracket */}
        <g opacity={cut}>
          <line x1={900} y1={Y(before)} x2={900} y2={Y(after)} stroke="#ff8a8a" strokeWidth={5} />
          <line x1={880} y1={Y(before)} x2={920} y2={Y(before)} stroke="#ff8a8a" strokeWidth={5} />
          <line x1={880} y1={Y(after)} x2={920} y2={Y(after)} stroke="#ff8a8a" strokeWidth={5} />
          <text x={890} y={(Y(before) + Y(after)) / 2 + 18} textAnchor="end" fill="#ff8a8a" style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 64 }}>
            −400 M
          </text>
        </g>
        {/* Eiffel Tower, 330 m, standing on the new summit level */}
        <g transform={`translate(330 ${Y(after)}) scale(1 ${tower})`} opacity={tower}>
          <EiffelPath h={330 * 0.9} />
          <text x={0} y={-330 * 0.9 - 20} textAnchor="middle" fill="#ffd166" style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 32, letterSpacing: 2 }}>
            EIFFEL TOWER 330 M
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Eiffel Tower silhouette, base at (0,0), height h px, pointing up (negative y). */
const EiffelPath: React.FC<{ h: number }> = ({ h }) => {
  const w = h * 0.42;
  const d = `M ${-w / 2} 0 Q ${-w * 0.18} ${-h * 0.25} ${-w * 0.12} ${-h * 0.42} L ${-w * 0.06} ${-h * 0.75} L ${-w * 0.02} ${-h * 0.97} L 0 ${-h} L ${w * 0.02} ${-h * 0.97} L ${w * 0.06} ${-h * 0.75} L ${w * 0.12} ${-h * 0.42} Q ${w * 0.18} ${-h * 0.25} ${w / 2} 0 L ${w * 0.28} 0 Q 0 ${-h * 0.2} ${-w * 0.28} 0 Z`;
  return (
    <g>
      <path d={d} fill="#ffd166" />
      <rect x={-w * 0.2} y={-h * 0.27} width={w * 0.4} height={h * 0.025} fill="#ffd166" />
      <rect x={-w * 0.11} y={-h * 0.56} width={w * 0.22} height={h * 0.02} fill="#ffd166" />
    </g>
  );
};

