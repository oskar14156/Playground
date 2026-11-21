import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeOut, ramp } from "../../lib/timing";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.25 * Math.sin(k * Math.PI)) : 1;
};

/** A torn newspaper clipping that slaps onto a dark desk ("TRUE STORY" stamp). The headline never names the place. */
export const Clipping: React.FC<{ f: number; at: number; year: string; head: string; sub: string }> = ({ f, at, year, head, sub }) => {
  const k = pop(f, at, 10);
  const stamp = pop(f, at + 16, 6);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #2a2f3a 0%, #0a0c10 100%)", alignItems: "center", justifyContent: "flex-start", paddingTop: 120 }}>
      <div
        style={{
          width: 860,
          padding: "46px 54px 60px",
          background: "linear-gradient(180deg, #f3ecd9 0%, #e8dec5 100%)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          transform: `translateY(${(1 - k) * 600}px) rotate(${-4 + (1 - k) * 10}deg) scale(${0.9 + 0.1 * k})`,
          clipPath: "polygon(0 2%, 6% 0, 14% 2%, 25% 0, 38% 1.5%, 52% 0, 66% 2%, 80% 0, 92% 1.5%, 100% 0, 99% 30%, 100% 62%, 98.5% 100%, 84% 98%, 70% 100%, 55% 98.5%, 40% 100%, 24% 98%, 10% 100%, 0 98%, 1% 60%)",
          fontFamily: fonts.hud,
          color: "#1a1712",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "4px double #1a1712", paddingBottom: 12, fontSize: 30, letterSpacing: 4 }}>
          <span>THE DAILY NEWS</span>
          <span>{year}</span>
        </div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 92, lineHeight: 1.0, marginTop: 26, textTransform: "uppercase" }}>{head}</div>
        <div style={{ fontSize: 36, marginTop: 22, lineHeight: 1.35, color: "#3a342a" }}>{sub}</div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1330,
          right: 130,
          transform: `rotate(-12deg) scale(${2 - stamp})`,
          opacity: stamp,
          border: "10px solid #d0342c",
          color: "#d0342c",
          fontFamily: fonts.punch,
          fontWeight: 900,
          fontSize: 84,
          padding: "6px 26px",
          borderRadius: 14,
        }}
      >
        TRUE STORY
      </div>
    </AbsoluteFill>
  );
};

/** 35 bathrooms: toilet icons popping into a 5 × 7 grid with a counter. */
export const Bathrooms: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const n = Math.min(35, Math.max(0, Math.floor((f - at) / 1.1)));
  const Toilet: React.FC<{ s: number }> = ({ s }) => (
    <svg width={120} height={120} viewBox="0 0 120 120" style={{ transform: `scale(${s})` }}>
      <rect x={26} y={10} width={58} height={34} rx={8} fill="#f4f6f8" stroke="#1d232b" strokeWidth={5} />
      <path d="M18 52 h84 a6 6 0 0 1 6 6 c0 24 -18 38 -48 38 c-30 0 -48 -14 -48 -38 a6 6 0 0 1 6 -6z" fill="#ffffff" stroke="#1d232b" strokeWidth={5} />
      <rect x={42} y={92} width={36} height={18} rx={4} fill="#f4f6f8" stroke="#1d232b" strokeWidth={5} />
      <ellipse cx={60} cy={60} rx={30} ry={6} fill="#cfe3f5" />
    </svg>
  );
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #e9f2f8 0%, #c9dbe8 100%)", alignItems: "center" }}>
      <div style={{ marginTop: 300, display: "grid", gridTemplateColumns: "repeat(5, 150px)", gap: 14 }}>
        {Array.from({ length: 35 }, (_, i) => (
          <div key={i} style={{ width: 150, height: 120, display: "flex", justifyContent: "center", opacity: i < n ? 1 : 0.12 }}>
            <Toilet s={i < n ? pop(f, at + i * 1.1, 6) : 1} />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 1460, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 120, color: "#1d6fd1", WebkitTextStroke: "10px #fff", paintOrder: "stroke fill" }}>
        {n} BATHROOMS
      </div>
    </AbsoluteFill>
  );
};

/** Classified codename card: OBAMA → RENEGADE, then POCKET PUH → FLUFFBALL (stamped). Overlays a 3D shot. */
export const CodenameCard: React.FC<{ f: number; at: number; obama: number; fluff: number }> = ({ f, at, obama, fluff }) => {
  const k = pop(f, at, 10);
  const row = (a: string, b: string, start: number, hot: boolean) => {
    const o = fadeIn(f, start, 6);
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: o, transform: `translateX(${(1 - o) * 60}px)`, padding: "18px 0", borderTop: "3px solid #2b2b2b" }}>
        <span style={{ fontSize: 42, color: "#3a3a3a", letterSpacing: 2 }}>{a}</span>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: hot ? 76 : 58, color: hot ? "#d0342c" : "#1a1a1a" }}>{b}</span>
      </div>
    );
  };
  return (
    <div
      style={{
        position: "absolute",
        left: 90,
        top: 1080,
        width: 900,
        padding: "30px 44px 26px",
        background: "#f2ead2",
        boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
        transform: `translateY(${(1 - k) * 500}px) rotate(-2deg)`,
        fontFamily: fonts.hud,
        color: "#1a1a1a",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, letterSpacing: 5, color: "#7a1f1a" }}>
        <span>CODENAMES</span>
        <span>TOP SECRET</span>
      </div>
      {row("OBAMA", "RENEGADE", obama, false)}
      {row("POCKET PUH", "FLUFFBALL", fluff, true)}
    </div>
  );
};
