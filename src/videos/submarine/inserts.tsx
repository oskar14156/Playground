import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow } from "../../lib/three/core";
import { Env, KeyLight, Post } from "../../lib/three/diorama";
import { MiniSub } from "../../lib/three/MiniSub";
import { fonts } from "../../lib/theme";
import { easeOut, ramp, seeded } from "../../lib/timing";
import { c } from "./cues";
import { Cable } from "./parts";
import { Big, fadeIn, SetProps } from "./sets";

// ───────────────────────── 1934: Beebe & Barton ride the bathysphere to 923 m (sepia) ─────────────────────────
export const Set1934: React.FC<SetProps> = ({ f }) => {
  const { width, height } = useVideoConfig();
  const t = f / 30;
  // depth counts up to 923 m on the number; the camera rides along
  const k = ramp(f, c.y1934 + 6, c.n923 + 8, (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2));
  const depth = 923 * k;
  const y = -depth / 4; // world units: 1 = 4 m, so the water colour keeps changing on screen
  const cam: Cam = { pos: [2.6, y + 0.5, 6.5], look: [0, y - 0.2, 0], fov: 38 };
  const bg = new THREE.Color("#3a7a92").lerp(new THREE.Color("#02060c"), Math.min(1, depth / 600));
  const snow = useMemo(() => {
    const r = seeded(4);
    return Array.from({ length: 90 }, () => [r() * 10 - 5, r() * 300, -r() * 6 - 1] as [number, number, number]);
  }, []);
  return (
    <AbsoluteFill style={{ filter: "sepia(0.85) contrast(1.1) brightness(1.05)" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 38, near: 0.1, far: 200 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
        <CameraRig cam={cam} />
        <color attach="background" args={[bg]} />
        <hemisphereLight args={["#e6f4ff", "#20303a", 0.5 + 0.6 * (1 - k)]} />
        <KeyLight p={[-6, y + 10, 8]} target={[0, y, 0]} intensity={1.2 + 1.3 * (1 - k)} color="#fff3e2" size={6} />
        <Cable a={[0, y + 0.92, 0]} b={[0, y + 60, 0]} r={0.035} color="#9aa0a6" />
        {/* the telephone and power hose running alongside the cable */}
        <Cable a={[0.12, y + 0.8, 0.05]} b={[0.12, y + 60, 0.05]} r={0.025} color="#3a3a3a" />
        <group position={[0, y, 0]} rotation={[0, -0.5, 0]}>
          <MiniSub stretch={0} paint={0} t={t} />
          {/* lamp shining out of a window */}
          <Glow position={[0.9, 0.05, 0.3]} size={1.1} color="#fff1c8" opacity={0.6 * k} />
        </group>
        {snow.map((p, i) => (
          <Glow key={i} position={[p[0], y + 6 - ((p[1] + t * 0.6) % 14), p[2]]} size={0.06} color="#ffffff" opacity={0.6} />
        ))}
        <Env intensity={0.3} />
        <Post bloom={0.4} ao={1.0} vignette={0.75} />
      </ThreeCanvas>
      {/* old film grain/scratches */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(90deg, rgba(255,240,210,0.03) 0 2px, rgba(0,0,0,0) 2px 7px)", mixBlendMode: "overlay" }} />
      <div style={{ position: "absolute", top: 230, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 140, color: "#fff", WebkitTextStroke: "16px #000", paintOrder: "stroke fill", opacity: fadeIn(f, c.y1934) }}>1934</div>
      <div style={{ position: "absolute", top: 400, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 800, fontSize: 44, color: "#fff", WebkitTextStroke: "8px #000", paintOrder: "stroke fill", opacity: fadeIn(f, c.y1934 + 10) }}>BEEBE & BARTON · BATHYSPHERE</div>
      <div style={{ position: "absolute", top: 1380, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 150, color: depth > 900 ? "#ffd23f" : "#fff", WebkitTextStroke: "16px #000", paintOrder: "stroke fill", fontVariantNumeric: "tabular-nums", opacity: fadeIn(f, c.y1934 + 6) }}>
        {Math.round(depth)} m
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── why round: flat walls bend, round ones only get squeezed (schematic) ─────────────────────────
export const SetShape: React.FC<SetProps> = ({ f }) => {
  const bend = ramp(f, c.flat + 8, c.flat + 26, easeOut);
  const roundOn = f >= c.round;
  const squeeze = roundOn ? ramp(f, c.round + 4, c.round + 18, easeOut) : 0;
  const pulse = 0.5 + 0.5 * Math.sin(f / 4);
  const arrowsAround = (cx: number, cy: number, r: number, n: number, color: string, push: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + Math.PI / n;
      const d0 = r + 40 + 30 * (1 - push);
      const x1 = cx + Math.cos(a) * (d0 + 80);
      const y1 = cy + Math.sin(a) * (d0 + 80);
      const x2 = cx + Math.cos(a) * d0;
      const y2 = cy + Math.sin(a) * d0;
      const hx = Math.cos(a);
      const hy = Math.sin(a);
      return (
        <g key={i}>
          <line x1={x1} y1={y1} x2={x2 + hx * 18} y2={y2 + hy * 18} stroke={color} strokeWidth={14} strokeLinecap="round" />
          <polygon points={`${x2},${y2} ${x2 + hx * 34 - hy * 20},${y2 + hy * 34 + hx * 20} ${x2 + hx * 34 + hy * 20},${y2 + hy * 34 - hx * 20}`} fill={color} />
        </g>
      );
    });
  // flat-sided section: each wall bows inward by `bend`
  const S = { cx: 540, cy: 470, h: 170 };
  const b = 95 * bend;
  const sq = `M ${S.cx - S.h} ${S.cy - S.h} Q ${S.cx} ${S.cy - S.h + b} ${S.cx + S.h} ${S.cy - S.h} Q ${S.cx + S.h - b} ${S.cy} ${S.cx + S.h} ${S.cy + S.h} Q ${S.cx} ${S.cy + S.h - b} ${S.cx - S.h} ${S.cy + S.h} Q ${S.cx - S.h + b} ${S.cy} ${S.cx - S.h} ${S.cy - S.h} Z`;
  const R = { cx: 540, cy: 1420, r: 180 - 10 * squeeze };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0f2c4a 0%, #06152a 100%)" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {/* blueprint grid */}
        {Array.from({ length: 28 }, (_, i) => (
          <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={1920} stroke="#1d4a73" strokeWidth={1} opacity={0.5} />
        ))}
        {Array.from({ length: 49 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 40} x2={1080} y2={i * 40} stroke="#1d4a73" strokeWidth={1} opacity={0.5} />
        ))}
        {/* flat walls */}
        <g opacity={fadeIn(f, c.flat - 2)}>
          {arrowsAround(S.cx, S.cy, S.h * 1.12, 12, "#ff5a4a", pulse)}
          <path d={sq} fill="#ffcf3a" fillOpacity={0.18} stroke={bend > 0.4 ? "#ff3b30" : "#ffd23f"} strokeWidth={22} strokeLinejoin="round" />
          {bend > 0.6 ? (
            <g stroke="#ff3b30" strokeWidth={10} strokeLinecap="round">
              <line x1={S.cx - 40} y1={S.cy - S.h + b + 10} x2={S.cx - 10} y2={S.cy - S.h + b + 50} />
              <line x1={S.cx + S.h - b - 10} y1={S.cy + 30} x2={S.cx + S.h - b - 55} y2={S.cy + 55} />
            </g>
          ) : null}
        </g>
        {/* round walls */}
        <g opacity={roundOn ? fadeIn(f, c.round - 2) : 0.25}>
          {arrowsAround(R.cx, R.cy, 190, 12, roundOn ? "#ff5a4a" : "#6b7a8c", roundOn ? pulse : 0)}
          <circle cx={R.cx} cy={R.cy} r={R.r} fill="#ffcf3a" fillOpacity={0.18} stroke={roundOn ? "#3ddc84" : "#ffd23f"} strokeWidth={22} />
        </g>
      </svg>
      <div style={{ position: "absolute", top: 760, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 70, color: "#ff5a4a", opacity: ramp(f, c.flat + 18, c.flat + 26) }}>✗ FLAT WALLS BEND</div>
      <div style={{ position: "absolute", top: 1700, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 70, color: "#3ddc84", opacity: roundOn ? fadeIn(f, c.round + 10) : 0 }}>✓ ROUND: JUST SQUEEZED</div>
    </AbsoluteFill>
  );
};

// ───────────────────────── 30 kg on a fingernail (illustration) ─────────────────────────
export const SetFinger: React.FC<SetProps> = ({ f }) => {
  const drop = ramp(f, c.kilo + 4, c.kilo + 16, (x) => x * x);
  const land = f >= c.kilo + 16;
  const bounce = land ? Math.exp(-(f - c.kilo - 16) / 5) * Math.sin((f - c.kilo - 16) / 2) * 12 : 0;
  const wy = -500 + 1010 * drop + bounce; // kettlebell bottom sits on the nail at y ≈ 1010
  const squash = land ? 1 - 0.06 * Math.exp(-(f - c.kilo - 16) / 6) : 1;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #f6f1e7 0%, #ddd5c6 100%)" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {/* finger seen from above, coming in from the bottom */}
        <g transform={`translate(540 0) scale(1 ${squash}) translate(-540 0)`}>
          <path d="M 400 1920 L 400 1180 Q 400 1000 540 1000 Q 680 1000 680 1180 L 680 1920 Z" fill="#e8b48f" stroke="#b9805c" strokeWidth={8} />
          <path d="M 455 1220 L 455 1110 Q 455 1040 540 1040 Q 625 1040 625 1110 L 625 1220 Q 540 1250 455 1220 Z" fill="#f7d8cc" stroke="#d6a594" strokeWidth={6} />
          <path d="M 470 1060 Q 540 1048 610 1060" stroke="#ffffff" strokeWidth={6} fill="none" opacity={0.7} />
          <path d="M 430 1420 Q 540 1440 650 1420" stroke="#b9805c" strokeWidth={5} fill="none" opacity={0.6} />
        </g>
        {/* kettlebell */}
        <g transform={`translate(540 ${wy})`}>
          <path d="M -110 -330 Q -110 -440 0 -440 Q 110 -440 110 -330" fill="none" stroke="#1f2328" strokeWidth={46} strokeLinecap="round" />
          <ellipse cx={0} cy={-150} rx={230} ry={190} fill="#2a2f35" />
          <ellipse cx={-70} cy={-210} rx={60} ry={40} fill="#4a525b" />
          <rect x={-120} y={-30} width={240} height={30} rx={10} fill="#1f2328" />
          <text x={0} y={-120} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={120} fill="#ffd23f">30 KG</text>
        </g>
        {land ? (
          <g stroke="#ff3b30" strokeWidth={10} strokeLinecap="round" opacity={Math.exp(-(f - c.kilo - 16) / 14)}>
            <line x1={340} y1={1030} x2={280} y2={1000} />
            <line x1={330} y1={1090} x2={260} y2={1100} />
            <line x1={740} y1={1030} x2={800} y2={1000} />
            <line x1={750} y1={1090} x2={820} y2={1100} />
          </g>
        ) : null}
      </svg>
      <div style={{ position: "absolute", top: 1560, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, color: "#1d2330", opacity: fadeIn(f, c.nail) }}>ON EVERY FINGERNAIL</div>
      <div style={{ position: "absolute", top: 1650, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 38, color: "#4b5563", opacity: fadeIn(f, c.nail + 6) }}>at 300 m: ≈ 30 kg per cm²</div>
    </AbsoluteFill>
  );
};

// ───────────────────────── the sonar screen: ping out, echo back, distance ─────────────────────────
export const SetSonar: React.FC<SetProps> = ({ f }) => {
  const C = { x: 540, y: 820, r: 400 };
  const scale = C.r / 200; // screen radius = 200 m
  const target = { a: (-35 * Math.PI) / 180 + Math.PI / 2, d: 150 }; // ahead and down-right
  const tx = C.x + Math.cos(target.a) * target.d * scale;
  const ty = C.y + Math.sin(target.a) * target.d * scale;
  const sweep = (f - c.sound) * 0.06;
  // ping: out (fifth of a second, slowed down on screen) and back
  const t0 = c.echo + 4;
  const out = ramp(f, t0, t0 + 20, (x) => x);
  const back = ramp(f, t0 + 20, t0 + 40, (x) => x);
  const timer = f < t0 ? 0 : 0.2 * Math.min(1, (f - t0) / 40);
  const found = f >= t0 + 40;
  const green = "#5dfc8d";
  return (
    <AbsoluteFill style={{ background: "#020a06" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <radialGradient id="scr" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0b2a17" />
            <stop offset="100%" stopColor="#03120a" />
          </radialGradient>
          <linearGradient id="sw" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={green} stopOpacity={0} />
            <stop offset="100%" stopColor={green} stopOpacity={0.45} />
          </linearGradient>
        </defs>
        <circle cx={C.x} cy={C.y} r={C.r + 30} fill="#0e1512" stroke="#2b3a31" strokeWidth={10} />
        <circle cx={C.x} cy={C.y} r={C.r} fill="url(#scr)" />
        {[50, 100, 150, 200].map((d) => (
          <g key={d}>
            <circle cx={C.x} cy={C.y} r={d * scale} fill="none" stroke={green} strokeOpacity={0.3} strokeWidth={3} />
            <text x={C.x + 8} y={C.y - d * scale + 32} fontFamily={fonts.hud} fontSize={28} fill={green} opacity={0.7}>{d} m</text>
          </g>
        ))}
        <line x1={C.x - C.r} y1={C.y} x2={C.x + C.r} y2={C.y} stroke={green} strokeOpacity={0.25} strokeWidth={2} />
        <line x1={C.x} y1={C.y - C.r} x2={C.x} y2={C.y + C.r} stroke={green} strokeOpacity={0.25} strokeWidth={2} />
        {/* rotating sweep */}
        <g transform={`rotate(${(sweep * 180) / Math.PI} ${C.x} ${C.y})`}>
          <path d={`M ${C.x} ${C.y} L ${C.x + C.r} ${C.y} A ${C.r} ${C.r} 0 0 0 ${C.x + C.r * Math.cos(-0.6)} ${C.y + C.r * Math.sin(-0.6)} Z`} fill="url(#sw)" />
        </g>
        {/* the pulse going out and the echo coming back */}
        {f >= t0 && out < 1 ? <circle cx={C.x} cy={C.y} r={target.d * scale * out} fill="none" stroke="#5dfcff" strokeWidth={8} opacity={0.9} /> : null}
        {out >= 1 && back < 1 ? <circle cx={tx} cy={ty} r={target.d * scale * back} fill="none" stroke="#ffd23f" strokeWidth={8} opacity={0.9 * (1 - back * 0.5)} /> : null}
        {out >= 1 ? <circle cx={tx} cy={ty} r={20 + (found ? 6 * Math.sin(f / 4) : 0)} fill="#ffd23f" opacity={0.95} /> : null}
        {found ? <line x1={C.x} y1={C.y} x2={tx} y2={ty} stroke="#ffd23f" strokeWidth={5} strokeDasharray="16 12" /> : null}
        {/* you, in the middle */}
        <polygon points={`${C.x},${C.y - 26} ${C.x + 18},${C.y + 18} ${C.x - 18},${C.y + 18}`} fill="#fff" />
      </svg>
      <div style={{ position: "absolute", top: 160, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 40, letterSpacing: 6, color: green }}>SONAR</div>
      <div style={{ position: "absolute", top: 1330, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 96, color: "#fff", opacity: fadeIn(f, c.sound + 6) }}>
        1,500 <span style={{ fontSize: 54 }}>m/s</span>
      </div>
      <div style={{ position: "absolute", top: 1480, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 72, color: "#ffd23f", fontVariantNumeric: "tabular-nums", opacity: fadeIn(f, c.echo) }}>
        ECHO: {timer.toFixed(1)} s
      </div>
      {found ? (
        <div style={{ position: "absolute", top: 1600, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 46, color: "#fff", opacity: fadeIn(f, t0 + 40) }}>
          1,500 × 0.2 ÷ 2 = <span style={{ color: "#ffd23f", fontWeight: 900 }}>150 m</span>
        </div>
      ) : null}
      {found ? <Big x={Math.min(820, tx)} y={ty + 90} text="POCKET PUH" o={fadeIn(f, t0 + 40)} color="#ffd23f" size={54} /> : null}
      <div style={{ position: "absolute", top: 1700, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 30, color: green, opacity: found ? 0.8 : 0 }}>÷ 2: there and back</div>
    </AbsoluteFill>
  );
};

