import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Earth } from "../../lib/three/Earth";
import { fonts } from "../../lib/theme";
import { easeOut, ramp } from "../../lib/timing";
import { c } from "./cues";

export type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);

// ───────────────────────── Newton's cannon: fast enough and you fall around the Earth ─────────────────────────
export const SetNewton: React.FC<SetProps> = ({ f }) => {
  const E = { x: 540, y: 1130, r: 330 };
  const top = { x: E.x, y: E.y - E.r - 60 }; // cannon on a very tall mountain
  // three shots, each faster: lands near, lands far, goes all the way round
  const shots = [
    { at: c.falling + 2, dur: 16, end: 0.55 },
    { at: c.falling + 14, dur: 22, end: 1.35 },
    { at: c.missing - 8, dur: 40, end: Math.PI * 2 },
  ];
  // path of a shot fired horizontally: angle around the Earth θ(k), radius shrinking until it hits (or stays)
  const path = (end: number, k: number) => {
    const th = end * k;
    const full = end >= Math.PI * 2 - 0.01;
    const rr = full ? E.r + 60 : E.r + 60 - 60 * Math.pow(th / end, 2.2);
    return { x: E.x + Math.sin(th) * rr, y: E.y - Math.cos(th) * rr };
  };
  const label = (text: string, color: string, o: number, y: number) => (
    <div style={{ position: "absolute", top: y, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 56, color, opacity: o, WebkitTextStroke: "8px #000", paintOrder: "stroke fill" }}>{text}</div>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 60%, #0f1f3a 0%, #03060f 100%)" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {Array.from({ length: 90 }, (_, i) => (
          <circle key={i} cx={(i * 397) % 1080} cy={(i * 613) % 1920} r={i % 7 === 0 ? 2.5 : 1.4} fill="#cfd8ff" opacity={0.6} />
        ))}
      </svg>
      {/* the real Earth (same NASA maps as the 3D sets), orthographic so it sits exactly in the circle E */}
      <AbsoluteFill>
        <ThreeCanvas width={1080} height={1920} orthographic camera={{ position: [0, 0, 2000], near: 1, far: 4000, zoom: 1 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
          {/* Earth faces "lat" up (+y); turn that point towards the camera (+z) with north up */}
          <group position={[E.x - 540, 960 - E.y, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <group rotation={[Math.PI / 2, 0, 0]}>
              <Earth r={E.r} lat={18} lon={-35} spin={f * 0.0015} clouds={f * 0.0008} sun={[0.55, 0.45, 0.7]} />
            </group>
          </group>
        </ThreeCanvas>
      </AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="rock" x1="0" x2="1">
            <stop offset="0" stopColor="#6f655a" />
            <stop offset="0.5" stopColor="#9a8f80" />
            <stop offset="1" stopColor="#5a5148" />
          </linearGradient>
          <radialGradient id="puff">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="1" stopColor="#cfd6e0" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* a very tall mountain with a snow cap, and the cannon on top (Newton's thought experiment) */}
        <path d={`M ${top.x - 92} ${E.y - E.r + 26} L ${top.x - 30} ${top.y + 40} L ${top.x - 12} ${top.y + 18} L ${top.x} ${top.y + 12} L ${top.x + 18} ${top.y + 24} L ${top.x + 44} ${top.y + 52} L ${top.x + 92} ${E.y - E.r + 26} Z`} fill="url(#rock)" />
        <path d={`M ${top.x - 30} ${top.y + 40} L ${top.x - 12} ${top.y + 18} L ${top.x} ${top.y + 12} L ${top.x + 18} ${top.y + 24} L ${top.x + 30} ${top.y + 38} L ${top.x + 14} ${top.y + 32} L ${top.x + 2} ${top.y + 40} L ${top.x - 14} ${top.y + 34} Z`} fill="#f4f7fb" />
        <g transform={`translate(${top.x - 4} ${top.y + 4})`}>
          <rect x={-2} y={-14} width={58} height={16} rx={7} fill="#2b2d31" stroke="#111" strokeWidth={2} />
          <rect x={50} y={-16} width={8} height={20} rx={3} fill="#3a3d42" />
          <rect x={-6} y={-16} width={10} height={20} rx={4} fill="#3a3d42" />
          <circle cx={12} cy={6} r={10} fill="#6b4a2b" stroke="#2a1c10" strokeWidth={3} />
          <circle cx={12} cy={6} r={2.5} fill="#2a1c10" />
        </g>
        {/* muzzle smoke for each shot */}
        {shots.map((s, i) => {
          const k = (f - s.at) / 14;
          if (k < 0 || k > 1) return null;
          return <circle key={`p${i}`} cx={top.x + 60 + 26 * k} cy={top.y - 4 - 10 * k} r={12 + 30 * k} fill="url(#puff)" opacity={1 - k} />;
        })}
        {/* the shots and their dotted trails */}
        {shots.map((s, i) => {
          if (f < s.at) return null;
          const k = Math.min(1, (f - s.at) / s.dur);
          const n = 40;
          const pts = Array.from({ length: n + 1 }, (_, j) => path(s.end, (k * j) / n));
          const head = pts[n];
          const landed = k >= 1 && i < 2;
          const color = i === 2 ? "#ffd23f" : "#ff6b5e";
          return (
            <g key={i}>
              <polyline points={pts.map((q) => `${q.x},${q.y}`).join(" ")} fill="none" stroke={color} strokeWidth={6} strokeDasharray="4 14" strokeLinecap="round" />
              <circle cx={head.x} cy={head.y} r={landed ? 16 : 12} fill={landed ? "#ff3b30" : color} />
              {landed ? <circle cx={head.x} cy={head.y} r={34} fill="none" stroke="#ff3b30" strokeWidth={5} opacity={0.7} /> : null}
            </g>
          );
        })}
      </svg>
      {label("SLOW → FALLS", "#ff6b5e", fadeIn(f, c.falling + 10) * (1 - ramp(f, c.missing - 12, c.missing - 4)), 280)}
      {label("FAST → FALLS… AND MISSES", "#ffd23f", fadeIn(f, c.missing - 4), 280)}
      {label("28,000 km/h · 17,500 mph", "#ffffff", fadeIn(f, c.missing + 6), 1560)}
    </AbsoluteFill>
  );
};

// ───────────────────────── Project Orion, 1958: a ship pushed by atom bombs (sepia blueprint) ─────────────────────────
export const SetOrion: React.FC<SetProps> = ({ f }) => {
  // every ~12 frames a small bomb pops behind the plate and the ship jumps up a little
  const t0 = c.atom - 4;
  const n = Math.max(0, Math.floor((f - t0) / 12));
  const local = f < t0 ? 0 : ((f - t0) % 12) / 12;
  const rise = Math.min(n, 7) * 34 + (f >= t0 ? 34 * Math.min(1, local * 3) : 0);
  const shipY = 1100 - rise;
  const flash = f >= t0 && local < 0.35 ? 1 - local / 0.35 : 0;
  const stamp = f >= c.cancelled + 2 ? ramp(f, c.cancelled + 2, c.cancelled + 7, easeOut) : 0;
  const ink = "#2a1c10";
  return (
    <AbsoluteFill style={{ background: "#d9c7a3", filter: "contrast(1.05)" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {/* paper grid */}
        {Array.from({ length: 28 }, (_, i) => (
          <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={1920} stroke="#b59f78" strokeWidth={1} opacity={0.6} />
        ))}
        {Array.from({ length: 49 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 40} x2={1080} y2={i * 40} stroke="#b59f78" strokeWidth={1} opacity={0.6} />
        ))}
        {/* the ship: crew section, long body, shock absorbers, big round pusher plate */}
        <g transform={`translate(540 ${shipY})`} stroke={ink} strokeWidth={5} fill="none">
          <path d="M -70 -420 Q 0 -500 70 -420 L 90 -120 L -90 -120 Z" />
          <line x1={-60} y1={-380} x2={60} y2={-380} />
          <rect x={-120} y={-120} width={240} height={150} />
          {[-90, -30, 30, 90].map((x) => (
            <g key={x}>
              <line x1={x} y1={30} x2={x} y2={130 + 14 * flash} />
              <rect x={x - 12} y={60} width={24} height={40} fill="#d9c7a3" />
            </g>
          ))}
          <path d={`M -230 ${150 + 14 * flash} Q 0 ${110 + 14 * flash} 230 ${150 + 14 * flash} L 230 ${175 + 14 * flash} Q 0 ${135 + 14 * flash} -230 ${175 + 14 * flash} Z`} fill="#a58f6a" />
          <text x={260} y={170} fontFamily={fonts.hud} fontSize={30} fill={ink} stroke="none">PUSHER PLATE</text>
          <text x={110} y={-300} fontFamily={fonts.hud} fontSize={30} fill={ink} stroke="none">CREW</text>
        </g>
        {/* the bomb going off behind the plate */}
        {f >= t0 ? (
          <g transform={`translate(540 ${shipY + 260})`}>
            <circle r={40 + 160 * (1 - flash)} fill="none" stroke="#c0392b" strokeWidth={8} opacity={flash} />
            <circle r={36 * flash} fill="#fff4d6" opacity={flash} />
            {local > 0.35 ? <circle r={10} fill={ink} /> : null}
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", top: 210, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 92, color: ink, opacity: fadeIn(f, c.y1958) }}>PROJECT ORION</div>
      <div style={{ position: "absolute", top: 330, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 44, letterSpacing: 6, color: ink, opacity: fadeIn(f, c.y1958 + 6) }}>USA · 1958 · CLASSIFIED</div>
      <div style={{ position: "absolute", top: 1560, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 38, color: ink, opacity: fadeIn(f, c.atom + 10) }}>1–4 BOMBS PER SECOND</div>
      {stamp > 0 ? (
        <div style={{ position: "absolute", top: 860, left: 540, transform: `translate(-50%,-50%) rotate(-14deg) scale(${2.2 - 1.2 * stamp})`, opacity: stamp, border: "14px solid #c0392b", borderRadius: 18, padding: "10px 40px", fontFamily: fonts.punch, fontWeight: 900, fontSize: 130, color: "#c0392b", letterSpacing: 6 }}>CANCELLED</div>
      ) : null}
    </AbsoluteFill>
  );
};
