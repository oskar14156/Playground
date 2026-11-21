import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeInOut, easeOut, ramp } from "../../lib/timing";
import { FoxIcon } from "../../lib/Follow";

export { Stamp, CounterPill } from "../pyramid/inserts";
export { Clipping } from "../white-house/inserts";
export { YearTag } from "../louvre/inserts";
export { Tag, Big } from "../rocket/sets";

const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.25 * Math.sin(k * Math.PI)) : 1;
};

/** dark pill with a big value and a small label (metric · imperial on one line) */
export const Pill: React.FC<{ o: number; value: string; label: string; top?: number; color?: string }> = ({ o, value, label, top = 180, color = "#8fd0ff" }) =>
  o > 0.01 ? (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ transform: `scale(${0.85 + 0.15 * o})`, display: "flex", alignItems: "baseline", gap: 16, padding: "12px 30px", borderRadius: 22, background: "rgba(6,10,18,0.82)", border: `3px solid ${color}`, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 60, color: "#fff", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{value}</span>
        <span style={{ fontFamily: fonts.hud, fontSize: 32, letterSpacing: 3, color }}>{label}</span>
      </div>
    </div>
  ) : null;

/** John Snow's 1854 map, simplified: street grid, the pump, black bars stacking up around it. No death count. */
export const SnowMap: React.FC<{ f: number; at: number; until: number; cross?: number }> = ({ f, at, until, cross = 1e9 }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 10);
  const grow = ramp(f, at + 4, at + 40, easeOut);
  const x = ramp(f, cross, cross + 8, easeOut);
  const bars: [number, number, number][] = [];
  for (let i = 0; i < 60; i++) {
    const a = i * 2.39996;
    const d = 30 + Math.sqrt(i) * 34;
    bars.push([440 + Math.cos(a) * d, 520 + Math.sin(a) * d * 0.8, 1 + (i % 4)]);
  }
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
      <div style={{ transform: `scale(${k}) rotate(-2deg)`, width: 880, padding: 24, background: "linear-gradient(180deg,#efe4c8,#ddd0b0)", boxShadow: "0 30px 80px rgba(0,0,0,0.55)" }}>
        <div style={{ fontFamily: fonts.hud, fontSize: 34, letterSpacing: 5, color: "#2a2216", display: "flex", justifyContent: "space-between", borderBottom: "3px solid #2a2216", paddingBottom: 8 }}>
          <span>SOHO, LONDON</span>
          <span>1854</span>
        </div>
        <svg width="832" height="900" viewBox="0 0 880 950">
          <rect width="880" height="950" fill="#e8dcbc" />
          {[120, 300, 480, 660, 820].map((y) => (
            <rect key={y} x="0" y={y} width="880" height="34" fill="#cbbd98" />
          ))}
          {[90, 280, 600, 790].map((x0) => (
            <rect key={x0} x={x0} y="0" width="34" height="950" fill="#cbbd98" />
          ))}
          <text x="460" y="505" fontFamily="Arial" fontWeight="900" fontSize="26" fill="#2a2216">
            BROAD ST.
          </text>
          {bars.map(([bx, by, n], i) =>
            Array.from({ length: n }, (_, j) => (
              <rect key={`${i}-${j}`} x={bx} y={by - j * 9} width="22" height="6" fill="#1a1410" opacity={grow * 30 > i * 0.5 ? 1 : 0} />
            )),
          )}
          <circle cx="440" cy="520" r="22" fill="#c0392b" stroke="#2a2216" strokeWidth="4" />
          <text x="440" y="580" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="34" fill="#c0392b">
            PUMP
          </text>
          {x > 0 ? (
            <g opacity={x}>
              <line x1="400" y1="480" x2="480" y2="560" stroke="#c0392b" strokeWidth="10" />
              <line x1="480" y1="480" x2="400" y2="560" stroke="#c0392b" strokeWidth="10" />
            </g>
          ) : null}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/** desk calendar flipping from day 1 to day 18, then the stamp */
export const Calendar: React.FC<{ f: number; at: number; until: number; days?: number }> = ({ f, at, until, days = 18 }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const d = Math.max(1, Math.min(days, Math.round(1 + ramp(f, at + 4, at + 34, easeInOut) * (days - 1))));
  return (
    <div style={{ position: "absolute", top: 330, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${k}) rotate(3deg)`, width: 380, borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", background: "#f4efe2" }}>
        <div style={{ background: "#b0302a", color: "#fff", fontFamily: fonts.hud, fontSize: 44, letterSpacing: 6, textAlign: "center", padding: "10px 0" }}>DAY</div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 200, color: "#1a1410", textAlign: "center", lineHeight: 1.15, fontVariantNumeric: "tabular-nums" }}>{d}</div>
      </div>
    </div>
  );
};

/** 2× wider pipe → 4× the space: two circles, the big one filled by four "units" */
export const AreaInsert: React.FC<{ f: number; at: number; four: number; until: number }> = ({ f, at, four, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const g = ramp(f, at + 6, at + 18, easeOut);
  const q = ramp(f, four, four + 10, easeOut);
  return (
    <div style={{ position: "absolute", top: 250, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${k})`, padding: "26px 36px", borderRadius: 30, background: "rgba(6,10,18,0.86)", border: "4px solid #ff9f1c", display: "flex", gap: 40, alignItems: "flex-end" }}>
        <div style={{ textAlign: "center" }}>
          <svg width="150" height="150" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r="36" fill="#8fd0ff" stroke="#fff" strokeWidth="5" strokeDasharray="10 8" />
          </svg>
          <div style={{ fontFamily: fonts.hud, fontSize: 34, color: "#8fd0ff", letterSpacing: 3 }}>NEEDED</div>
        </div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, color: "#fff", paddingBottom: 60 }}>→</div>
        <div style={{ textAlign: "center" }}>
          <svg width="300" height="300" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r={72 * (1 + g)} fill="#ff9f1c" fillOpacity={0.25} stroke="#ff9f1c" strokeWidth="6" />
            {[0, 1, 2, 3].map((i) => (
              <text key={i} x={95 + (i % 2) * 110} y={118 + Math.floor(i / 2) * 98} textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="62" fill="#fff" opacity={q > i * 0.2 ? 1 : 0.0}>
                {i + 1}
              </text>
            ))}
          </svg>
          <div style={{ fontFamily: fonts.hud, fontSize: 34, color: "#ff9f1c", letterSpacing: 3 }}>2× WIDE = {q > 0.6 ? "4×" : "?"} SPACE</div>
        </div>
      </div>
    </div>
  );
};

/** rain gauge pill: millimetres · inches */
export const RainGauge: React.FC<{ o: number; mm: number; top?: number }> = ({ o, mm, top = 180 }) =>
  o > 0.01 ? (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "12px 30px", borderRadius: 22, background: "rgba(6,10,18,0.82)", border: "3px solid #8fd0ff" }}>
        <svg width="54" height="90" viewBox="0 0 54 90">
          <rect x="10" y="4" width="34" height="80" rx="8" fill="none" stroke="#fff" strokeWidth="4" />
          <rect x="14" y={80 - 70 * Math.min(1, mm / 2)} width="26" height={70 * Math.min(1, mm / 2)} rx="4" fill="#4fb3ff" />
        </svg>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{mm.toFixed(1)} mm</span>
        <span style={{ fontFamily: fonts.hud, fontSize: 36, color: "#8fd0ff", letterSpacing: 2 }}>· {(mm / 25.4).toFixed(2)} in RAIN</span>
      </div>
    </div>
  ) : null;

const BusIcon: React.FC<{ w?: number }> = ({ w = 150 }) => (
  <svg width={w} height={w * 0.86} viewBox="0 0 150 130">
    <rect x="6" y="8" width="138" height="104" rx="14" fill="#d8261f" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={`u${i}`} x={16 + i * 32} y="18" width="26" height="24" rx="4" fill="#d9ecf5" />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <rect key={`l${i}`} x={16 + i * 32} y="60" width="26" height="24" rx="4" fill="#d9ecf5" />
    ))}
    <rect x="6" y="50" width="138" height="5" fill="#f2c14e" />
    {[34, 116].map((x) => (
      <circle key={x} cx={x} cy="114" r="13" fill="#1a1a1a" stroke="#777" strokeWidth="4" />
    ))}
  </svg>
);
/** 130 tonnes = 11 double-decker buses (icons pop in one by one) */
export const BusCompare: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const n = Math.min(11, Math.floor(ramp(f, at, at + 26) * 11.99));
  return (
    <div style={{ position: "absolute", top: 1180, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", width: 900, justifyContent: "center", gap: 10, padding: "16px 10px", borderRadius: 26, background: "rgba(6,10,18,0.8)" }}>
        {Array.from({ length: 11 }, (_, i) => (
          <div key={i} style={{ transform: `scale(${i < n ? pop(f, at + (i * 26) / 11, 5) : 0})` }}>
            <BusIcon w={140} />
          </div>
        ))}
        <div style={{ width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 54, color: "#fff", marginTop: 6 }}>= 11 DOUBLE-DECKER BUSES</div>
      </div>
    </div>
  );
};

/** "FatCam" live stream on a phone: LIVE badge, viewer count, floating reactions */
export const FatCam: React.FC<{ f: number; at: number; until: number; children?: React.ReactNode }> = ({ f, at, until, children }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 9);
  const viewers = Math.round(1200 + ramp(f, at, at + 60) * 8400);
  const emojis = ["🤢", "🪰", "😂", "🤮", "💀", "🪰", "😭"];
  return (
    <div style={{ position: "absolute", top: 300, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${k}) rotate(-3deg)`, width: 560, height: 980, borderRadius: 70, background: "#0b0d10", padding: 22, boxShadow: "0 30px 90px rgba(0,0,0,0.6)", border: "4px solid #333" }}>
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 52, overflow: "hidden", background: "#222" }}>
          {children}
          <div style={{ position: "absolute", top: 34, left: 28, display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ background: "#ff2d55", color: "#fff", fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, padding: "4px 14px", borderRadius: 10 }}>● LIVE</span>
            <span style={{ background: "rgba(0,0,0,0.55)", color: "#fff", fontFamily: fonts.hud, fontSize: 32, padding: "4px 14px", borderRadius: 10 }}>👁 {viewers.toLocaleString("en-US")}</span>
          </div>
          <div style={{ position: "absolute", top: 100, left: 28, color: "#fff", fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, textShadow: "0 3px 10px #000" }}>FatCam</div>
          {emojis.map((e, i) => {
            const u = ((f - at) / 50 + i / emojis.length) % 1;
            return (
              <div key={i} style={{ position: "absolute", right: 34 + (i % 3) * 30, bottom: 120 + u * 520, fontSize: 64, opacity: Math.sin(u * Math.PI) }}>
                {e}
              </div>
            );
          })}
          <div style={{ position: "absolute", bottom: 36, left: 28, right: 28, padding: "16px 22px", borderRadius: 26, background: "rgba(255,255,255,0.15)", color: "#fff", fontFamily: fonts.ui, fontSize: 30 }}>Add a comment…</div>
        </div>
      </div>
    </div>
  );
};

/** "WHERE DOES IT GO?" question card under the floor */
export const Question: React.FC<{ f: number; at: number; until: number; text: string; top?: number }> = ({ f, at, until, text, top = 1240 }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${k})`, display: "flex", alignItems: "center", gap: 18, padding: "14px 34px", borderRadius: 26, background: "#ffd23f", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
        <FoxIcon size={80} />
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 60, color: "#111" }}>{text}</span>
      </div>
    </div>
  );
};

/** CCTV overlay: green tint, scanlines, timestamp, REC dot */
export const Cctv: React.FC<{ f: number; label: string }> = ({ f, label }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: "rgba(40,90,40,0.18)", mixBlendMode: "multiply" }} />
    <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, transparent 2px, transparent 5px)" }} />
    <div style={{ position: "absolute", top: 120, left: 60, fontFamily: fonts.hud, fontSize: 40, color: "#e9ffe0", letterSpacing: 3, textShadow: "0 2px 6px #000" }}>
      <span style={{ color: "#ff3b30", opacity: Math.floor(f / 15) % 2 ? 1 : 0.2 }}>● </span>REC · {label}
    </div>
    <div style={{ position: "absolute", top: 172, left: 60, fontFamily: fonts.hud, fontSize: 34, color: "#e9ffe0", letterSpacing: 3, textShadow: "0 2px 6px #000", fontVariantNumeric: "tabular-nums" }}>
      SEP 2017 · 0{Math.floor(f / 30) % 10}:{String((f * 2) % 60).padStart(2, "0")}
    </div>
  </AbsoluteFill>
);
