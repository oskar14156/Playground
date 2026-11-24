import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeInOut, easeOut, ramp } from "../../lib/timing";
export { Stamp, CounterPill } from "../pyramid/inserts";
export { Tag, Big } from "../rocket/sets";
export { Pill } from "../sewer/inserts";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);

/**
 * Top-view schematic: the lake pushes on a FLAT wall → it bows → snaps like a cracker (cracker biscuit snaps alongside).
 * at = start, bend = "snap", until = end.
 */
export const FlatWallInsert: React.FC<{ f: number; at: number; snap: number; until: number }> = ({ f, at, snap, until }) => {
  if (f < at || f >= until) return null;
  const o = fadeIn(f, at, 6);
  const bow = ramp(f, at + 10, snap, easeInOut) * 46;
  const brk = ramp(f, snap + 4, snap + 16, easeOut);
  const shake = f > snap && f < snap + 10 ? Math.sin(f * 7) * 10 : 0;
  const arrows = Array.from({ length: 7 }, (_, i) => 180 + i * 120);
  const wallY = 1180;
  // the wall: a thick polyline bowed by `bow`, breaking in the middle into two halves
  const half = (side: -1 | 1) => {
    const pts: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const x = side < 0 ? 120 + i * 42 : 540 + i * 42;
      const u = (x - 120) / 840;
      const y = wallY + bow * Math.sin(u * Math.PI);
      pts.push(`${x},${y}`);
    }
    return pts.join(" ");
  };
  return (
    <AbsoluteFill style={{ opacity: o, transform: `translateX(${shake}px)` }}>
      <AbsoluteFill style={{ background: "linear-gradient(#0b2a44 0%, #0b2a44 58%, #231a14 58.2%, #2c2119 100%)" }} />
      {/* blueprint grid */}
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {Array.from({ length: 28 }, (_, i) => (
          <line key={`h${i}`} x1={0} x2={1080} y1={i * 70} y2={i * 70} stroke="rgba(140,200,255,0.08)" strokeWidth={2} />
        ))}
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`v${i}`} y1={0} y2={1920} x1={i * 70} x2={i * 70} stroke="rgba(140,200,255,0.08)" strokeWidth={2} />
        ))}
        {/* cliffs */}
        <path d="M0,1080 L120,1080 L120,1360 L0,1360 Z" fill="#6a4a36" />
        <path d="M1080,1080 L960,1080 L960,1360 L1080,1360 Z" fill="#6a4a36" />
        {/* water pressure arrows */}
        {arrows.map((x, i) => {
          const len = 120 + 30 * Math.sin(f * 0.3 + i);
          return (
            <g key={i} opacity={0.9}>
              <line x1={x} x2={x} y1={wallY - 300} y2={wallY - 300 + len} stroke="#5cd2ff" strokeWidth={14} strokeLinecap="round" />
              <path d={`M${x - 24},${wallY - 300 + len - 8} L${x + 24},${wallY - 300 + len - 8} L${x},${wallY - 300 + len + 30} Z`} fill="#5cd2ff" />
            </g>
          );
        })}
        {/* the wall */}
        <g transform={`translate(${-brk * 60},${brk * 120}) rotate(${-brk * 14} 330 ${wallY})`}>
          <polyline points={half(-1)} fill="none" stroke={brk > 0 ? "#ff5a3c" : "#e8dfcf"} strokeWidth={46} strokeLinejoin="round" />
        </g>
        <g transform={`translate(${brk * 60},${brk * 120}) rotate(${brk * 14} 750 ${wallY})`}>
          <polyline points={half(1)} fill="none" stroke={brk > 0 ? "#ff5a3c" : "#e8dfcf"} strokeWidth={46} strokeLinejoin="round" />
        </g>
        {brk > 0
          ? Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={540 + (i - 4) * 18 + (i - 4) * 30 * brk} y={wallY + 20 + 200 * brk * (0.5 + (i % 3) * 0.3)} width={22} height={22} fill="#e8dfcf" transform={`rotate(${i * 40 * brk} 540 ${wallY})`} />
            ))
          : null}
      </svg>
      <div style={{ position: "absolute", top: 740, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 44, letterSpacing: 6, color: "#8fd0ff" }}>LAKE · MILLIONS OF TONS</div>
      <div style={{ position: "absolute", top: 1420, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 44, letterSpacing: 6, color: "#e8dfcf" }}>FLAT WALL · TOP VIEW</div>
      {/* cracker biscuit */}
      <CrackerSnap f={f} snap={snap} />
    </AbsoluteFill>
  );
};

const CrackerSnap: React.FC<{ f: number; snap: number }> = ({ f, snap }) => {
  const o = ramp(f, snap - 14, snap - 6, easeOut);
  if (o <= 0) return null;
  const brk = ramp(f, snap, snap + 10, easeOut);
  const half = (s: -1 | 1) => (
    <div style={{ position: "absolute", left: s < 0 ? 0 : 130, top: 0, width: 130, height: 220, overflow: "hidden", transform: `translate(${s * brk * 40}px, ${brk * 20}px) rotate(${s * brk * 18}deg)` }}>
      <div style={{ position: "absolute", left: s < 0 ? 0 : -130, width: 260, height: 220, background: "#e0b468", borderRadius: 16, boxShadow: "inset 0 0 0 6px #c99a4c" }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 32 + (i % 4) * 62, top: 40 + Math.floor(i / 4) * 62, width: 12, height: 12, borderRadius: 6, background: "#a8783a" }} />
        ))}
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 410, top: 1500, width: 260, height: 220, opacity: o, transform: `scale(${0.8 + 0.2 * o})` }}>
      {half(-1)}
      {half(1)}
      {brk > 0.05 ? <div style={{ position: "absolute", left: -60, top: 230, width: 380, textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 84, color: "#ffd23f", WebkitTextStroke: "10px #000", paintOrder: "stroke fill", transform: `scale(${0.6 + 0.4 * brk})` }}>SNAP!</div> : null}
    </div>
  );
};

/** year counter: 1935 → 2060 while the monolith cools */
export const YearCounter: React.FC<{ f: number; at: number; until: number; from?: number; to?: number; top?: number }> = ({ f, at, until, from = 1935, to = 2060, top = 230 }) => {
  if (f < at || f >= until) return null;
  const o = fadeIn(f, at, 6);
  const y = Math.round(from + (to - from) * ramp(f, at + 4, at + 46, (x) => x));
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 40px", borderRadius: 22, background: "rgba(20,6,2,0.8)", border: "3px solid #ff7a3c" }}>
        <span style={{ fontFamily: fonts.hud, fontSize: 32, letterSpacing: 5, color: "#ffb08a" }}>STILL COOLING IN</span>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 110, color: "#fff", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{y}</span>
        <span style={{ fontFamily: fonts.hud, fontSize: 32, letterSpacing: 5, color: "#ffb08a" }}>~125 YEARS</span>
      </div>
    </div>
  );
};

/** vertical dimension line with a label (screen space) */
export const DimV: React.FC<{ x: number; y0: number; y1: number; o: number; label: string; color?: string; side?: "left" | "right" }> = ({ x, y0, y1, o, label, color = "#ffd23f", side = "right" }) =>
  o > 0.01 ? (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: o }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <line x1={x} x2={x} y1={y1 + (y0 - y1) * (1 - o)} y2={y0} stroke={color} strokeWidth={6} />
        <line x1={x - 22} x2={x + 22} y1={y0} y2={y0} stroke={color} strokeWidth={6} />
        <line x1={x - 22} x2={x + 22} y1={y1 + (y0 - y1) * (1 - o)} y2={y1 + (y0 - y1) * (1 - o)} stroke={color} strokeWidth={6} />
      </svg>
      <div style={{ position: "absolute", left: side === "right" ? x + 30 : undefined, right: side === "left" ? 1080 - x + 30 : undefined, top: (y0 + y1) / 2 - 40, padding: "6px 18px", borderRadius: 12, background: "rgba(6,10,18,0.85)", border: `3px solid ${color}`, fontFamily: fonts.punch, fontWeight: 900, fontSize: 48, color: "#fff", whiteSpace: "pre", lineHeight: 1.05, textAlign: "center" }}>
        {label}
      </div>
    </div>
  ) : null;

/** horizontal dimension line with a label (screen space) */
export const DimH: React.FC<{ y: number; x0: number; x1: number; o: number; label: string; color?: string; below?: boolean }> = ({ y, x0, x1, o, label, color = "#ffd23f", below }) =>
  o > 0.01 ? (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: o }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <line x1={x0} x2={x0 + (x1 - x0) * o} y1={y} y2={y} stroke={color} strokeWidth={6} />
        <line x1={x0} x2={x0} y1={y - 20} y2={y + 20} stroke={color} strokeWidth={6} />
        <line x1={x0 + (x1 - x0) * o} x2={x0 + (x1 - x0) * o} y1={y - 20} y2={y + 20} stroke={color} strokeWidth={6} />
      </svg>
      <div style={{ position: "absolute", left: Math.min(x0, x1), width: Math.abs(x1 - x0), top: below ? y + 26 : y - 96, display: "flex", justifyContent: "center" }}>
        <div style={{ padding: "6px 18px", borderRadius: 12, background: "rgba(6,10,18,0.85)", border: `3px solid ${color}`, fontFamily: fonts.punch, fontWeight: 900, fontSize: 46, color: "#fff", whiteSpace: "nowrap" }}>{label}</div>
      </div>
    </div>
  ) : null;
