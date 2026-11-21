import React from "react";
import { fonts } from "../../lib/theme";
import { easeOut, ramp } from "../../lib/timing";

export { Stamp, CounterPill } from "../pyramid/inserts";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.25 * Math.sin(k * Math.PI)) : 1;
};
const card: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(16,24,38,0.94) 0%, rgba(8,12,20,0.94) 100%)",
  border: "4px solid rgba(140,200,255,0.55)",
  borderRadius: 22,
  boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
  color: "#eaf2fb",
  fontFamily: fonts.hud,
};

/** Turbofan schematic: the four stages light up one after another — SUCK, SQUEEZE, BANG, BLOW. */
export const Turbofan: React.FC<{ f: number; at: number; words: number[] }> = ({ f, at, words }) => {
  if (f < at) return null;
  const k = pop(f, at, 10);
  const on = (i: number) => ramp(f, words[i], words[i] + 5, easeOut);
  const stages = [
    { x: 120, w: 150, label: "SUCK", sub: "FAN", color: "#8fd0ff" },
    { x: 280, w: 230, label: "SQUEEZE", sub: "COMPRESSOR", color: "#5dfc8d" },
    { x: 520, w: 150, label: "BANG", sub: "FUEL BURNS", color: "#ff8a3a" },
    { x: 680, w: 240, label: "BLOW", sub: "TURBINE + EXHAUST", color: "#ffd23f" },
  ];
  return (
    <div style={{ position: "absolute", left: 40, top: 1150, width: 1000, height: 480, opacity: Math.min(1, k * 1.4), transform: `scale(${0.9 + 0.1 * k})`, ...card, padding: 0 }}>
      <svg width={1000} height={480} viewBox="0 0 1000 480">
        {/* casing */}
        <path d="M 110 120 Q 130 90 280 100 L 700 130 Q 900 150 950 210 L 950 270 Q 900 330 700 350 L 280 380 Q 130 390 110 360 Z" fill="#1c2636" stroke="#5a6a80" strokeWidth={4} />
        {/* fan blades */}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={190} y1={115 + i * 31} x2={215} y2={118 + i * 31} stroke="#c9d3df" strokeWidth={8} opacity={0.6 + 0.4 * on(0)} />
        ))}
        {/* compressor stages (narrowing) */}
        {Array.from({ length: 8 }, (_, i) => {
          const x = 300 + i * 26;
          const h = 110 - i * 9;
          return <line key={i} x1={x} y1={240 - h} x2={x} y2={240 + h} stroke="#9fe8b4" strokeWidth={7} opacity={0.35 + 0.65 * on(1)} />;
        })}
        {/* combustor flame */}
        <ellipse cx={595} cy={240} rx={60 * (0.6 + 0.4 * on(2))} ry={48} fill="#ff7a1a" opacity={0.25 + 0.75 * on(2)} />
        <ellipse cx={595} cy={240} rx={30} ry={22} fill="#ffe28a" opacity={on(2)} />
        {/* turbine + exhaust jet */}
        {Array.from({ length: 4 }, (_, i) => (
          <line key={i} x1={690 + i * 24} y1={160} x2={690 + i * 24} y2={320} stroke="#ffd98a" strokeWidth={7} opacity={0.35 + 0.65 * on(3)} />
        ))}
        <path d={`M 950 210 L ${950 + 50 * on(3)} 200 L ${950 + 50 * on(3)} 280 L 950 270 Z`} fill="#ffd23f" opacity={0.7 * on(3)} />
        {/* air arrows in */}
        {[160, 240, 320].map((y) => (
          <path key={y} d={`M 20 ${y} L 90 ${y} M 75 ${y - 12} L 92 ${y} L 75 ${y + 12}`} stroke="#8fd0ff" strokeWidth={6} fill="none" opacity={on(0)} />
        ))}
        {stages.map((s, i) => (
          <g key={s.label} opacity={0.25 + 0.75 * on(i)}>
            <text x={s.x + s.w / 2} y={62} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={48} fill={s.color}>
              {s.label}
            </text>
            <text x={s.x + s.w / 2} y={440} textAnchor="middle" fontFamily={fonts.hud} fontSize={24} fill="#a9b8c9" letterSpacing={2}>
              {s.sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

/** Altitude + air density pill: 11 KM · 36,000 FT, AIR ≈ 1/3. */
export const AltitudePill: React.FC<{ o: number; km: number; density?: number }> = ({ o, km, density }) =>
  o > 0.01 ? (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 34px", borderRadius: 22 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ fontSize: 28, letterSpacing: 4, color: "#8fd0ff" }}>ALTITUDE</span>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 58, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{km.toFixed(km < 10 ? 1 : 0)} km</span>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#ffd23f", fontVariantNumeric: "tabular-nums" }}>· {Math.round((km * 3280.84) / 100) * 100 >= 1000 ? Math.round((km * 3280.84) / 100) * 100 : 0} ft</span>
        </div>
        {density !== undefined ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
            <span style={{ fontSize: 26, letterSpacing: 3, color: "#a9b8c9" }}>AIR</span>
            <div style={{ width: 300, height: 20, borderRadius: 10, background: "#26324a", overflow: "hidden" }}>
              <div style={{ width: `${density * 100}%`, height: "100%", background: "#8fd0ff" }} />
            </div>
            <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 32, color: "#8fd0ff" }}>{density > 0.9 ? "100 %" : `${Math.round(density * 100)} %`}</span>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

/** "The cabin = a 2,400 m mountain": a mountain silhouette with a tiny plane cabin on its top. */
export const CabinMountain: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  if (f < at) return null;
  const k = pop(f, at, 10);
  const rise = ramp(f, at, at + 24, easeOut);
  return (
    <div style={{ position: "absolute", left: 90, top: 1170, width: 900, height: 440, opacity: Math.min(1, k * 1.4), transform: `scale(${0.9 + 0.1 * k})`, ...card }}>
      <svg width={900} height={440} viewBox="0 0 900 440">
        <path d={`M 40 400 L 300 ${400 - 260 * rise} L 380 ${400 - 220 * rise} L 450 ${400 - 300 * rise} L 560 ${400 - 200 * rise} L 860 400 Z`} fill="#4a6a8a" />
        <path d={`M 400 ${400 - 260 * rise} L 450 ${400 - 300 * rise} L 500 ${400 - 255 * rise} L 470 ${400 - 245 * rise} L 450 ${400 - 262 * rise} L 425 ${400 - 245 * rise} Z`} fill="#f2f6fa" />
        <g transform={`translate(450 ${400 - 300 * rise - 26})`}>
          <rect x={-70} y={-24} width={140} height={44} rx={22} fill="#f4f6f8" stroke="#1d3f8f" strokeWidth={4} />
          {[-45, -22, 0, 22, 45].map((x) => (
            <circle key={x} cx={x} cy={-4} r={6} fill="#1a2432" />
          ))}
        </g>
        <text x={40} y={70} fontFamily={fonts.punch} fontWeight={900} fontSize={46} fill="#ffffff">
          CABIN AIR =
        </text>
        <text x={40} y={128} fontFamily={fonts.punch} fontWeight={900} fontSize={46} fill="#ffd23f">
          2,400 M · 8,000 FT
        </text>
      </svg>
    </div>
  );
};

/** Taste at 11 km: SALT −30 %, SWEET −30 %, UMAMI stays (→ tomato juice). */
export const TasteMeter: React.FC<{ f: number; at: number; tomato: number }> = ({ f, at, tomato }) => {
  if (f < at) return null;
  const k = pop(f, at, 10);
  const drop = ramp(f, at + 10, at + 34, easeOut);
  const um = fadeIn(f, tomato);
  const rows = [
    { label: "SALT", v: 1 - 0.3 * drop, color: "#e9edf2" },
    { label: "SWEET", v: 1 - 0.3 * drop, color: "#ff9fc4" },
    { label: "UMAMI 🍅", v: 1, color: "#ff5a3a", o: um },
  ];
  return (
    <div style={{ position: "absolute", left: 80, top: 1210, width: 920, padding: "28px 38px", opacity: Math.min(1, k * 1.4), transform: `scale(${0.92 + 0.08 * k})`, ...card }}>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#8fd0ff", letterSpacing: 2 }}>YOUR TONGUE AT 11 KM</div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 18, opacity: r.o ?? 1 }}>
          <span style={{ width: 230, fontSize: 36, letterSpacing: 2 }}>{r.label}</span>
          <div style={{ flex: 1, height: 30, borderRadius: 15, background: "#26324a", overflow: "hidden" }}>
            <div style={{ width: `${r.v * 100}%`, height: "100%", background: r.color }} />
          </div>
          <span style={{ width: 130, textAlign: "right", fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: r.v < 0.99 ? "#ff6b5e" : "#5dfc8d" }}>{r.v < 0.99 ? `−${Math.round((1 - r.v) * 100)} %` : "OK"}</span>
        </div>
      ))}
    </div>
  );
};

/** Boarding pass: "KATZ / CELLO" → stamped over by "PUH / POCKET, MR", seat 34A. */
export const BoardingPass: React.FC<{ f: number; at: number; swap: number }> = ({ f, at, swap }) => {
  if (f < at) return null;
  const k = pop(f, at, 10);
  const sw = ramp(f, swap, swap + 6, easeOut);
  const name = sw < 0.5 ? "KATZ / CELLO" : "PUH / POCKET MR";
  return (
    <div style={{ position: "absolute", left: 70, top: 1160, width: 940, height: 400, opacity: Math.min(1, k * 1.4), transform: `rotate(-3deg) scale(${0.9 + 0.1 * k})`, display: "flex", borderRadius: 22, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
      <div style={{ flex: 1, background: "#fbfaf6", padding: "26px 34px", fontFamily: fonts.hud, color: "#1a1f28" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: "#1d3f8f" }}>POCKET PUH AIR</span>
          <span style={{ fontSize: 26, letterSpacing: 3, color: "#7a8494" }}>BOARDING PASS</span>
        </div>
        <div style={{ fontSize: 24, letterSpacing: 3, color: "#7a8494", marginTop: 22 }}>PASSENGER</div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, transform: `scale(${1 + 0.15 * Math.sin(sw * Math.PI)})`, transformOrigin: "left center", color: sw < 0.5 ? "#1a1f28" : "#ff6a10" }}>{name}</div>
        <div style={{ display: "flex", gap: 50, marginTop: 24 }}>
          {[
            ["FROM", "SYD"],
            ["TO", "LHR"],
            ["SEAT", "34A"],
          ].map(([a, b]) => (
            <div key={a}>
              <div style={{ fontSize: 22, letterSpacing: 3, color: "#7a8494" }}>{a}</div>
              <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 50 }}>{b}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 180, background: "#ff6a10", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "6px dashed #fbfaf6" }}>
        <div style={{ transform: "rotate(90deg)", fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#fff", whiteSpace: "nowrap" }}>WINDOW 34A</div>
      </div>
    </div>
  );
};

/** The rule card: 14 CFR 25.853 — lavatories must have ashtrays. */
export const LawCard: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  if (f < at) return null;
  const k = pop(f, at, 10);
  return (
    <div style={{ position: "absolute", left: 90, top: 1200, width: 900, padding: "28px 38px", opacity: Math.min(1, k * 1.4), transform: `scale(${0.92 + 0.08 * k})`, background: "#f6f1e4", border: "4px solid #8a7a5a", borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", fontFamily: "Georgia, serif", color: "#2a2418" }}>
      <div style={{ fontSize: 30, letterSpacing: 2, color: "#7a6a4a" }}>US FEDERAL AVIATION RULE · 14 CFR 25.853</div>
      <div style={{ fontSize: 44, lineHeight: 1.25, marginTop: 14 }}>
        &ldquo;Regardless of whether smoking is allowed&hellip; lavatories must have <b>ashtrays</b>.&rdquo;
      </div>
    </div>
  );
};

/** Black box spec card: 3,400 G · 1,100 °C / 2,000 °F · 1 HOUR. */
export const BlackBoxSpecs: React.FC<{ f: number; at: number; fire: number }> = ({ f, at, fire }) => {
  if (f < at) return null;
  const k = pop(f, at, 10);
  const row = (label: string, v: string, a: number, color: string) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 12, opacity: fadeIn(f, a) }}>
      <span style={{ fontSize: 34, letterSpacing: 3, color: "#a9b8c9" }}>{label}</span>
      <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 50, color }}>{v}</span>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 120, top: 1250, width: 840, padding: "24px 38px", opacity: Math.min(1, k * 1.4), transform: `scale(${0.92 + 0.08 * k})`, ...card, border: "4px solid #ff6a10" }}>
      {row("CRASH", "3,400 G", at + 4, "#ffffff")}
      {row("FIRE", "1,100 °C · 2,000 °F", fire, "#ff8a3a")}
      {row("FOR", "1 HOUR", fire + 8, "#ffd23f")}
    </div>
  );
};

/** Grandma's message on the phone: a photo of the pocket puh on her sofa, "found this on my sofa x". */
export const PhoneCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 10);
  const out = ramp(f, until - 8, until, easeOut);
  return (
    <div style={{ position: "absolute", left: 300, top: 1080, width: 480, height: 760, opacity: Math.min(1, k * 1.4) * (1 - out), transform: `translateY(${(1 - k) * 200 + out * 120}px) rotate(4deg)`, borderRadius: 54, background: "#0d1119", border: "10px solid #2a2f38", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden", fontFamily: fonts.hud }}>
      <div style={{ padding: "26px 28px 10px", color: "#a9b8c9", fontSize: 26, letterSpacing: 2 }}>GRANDMA 🇦🇺</div>
      <div style={{ margin: "8px 24px", borderRadius: 22, overflow: "hidden", background: "#c9a26a" }}>
        <svg width={412} height={330} viewBox="0 0 412 330">
          <rect width={412} height={330} fill="#c9a26a" />
          <rect y={210} width={412} height={120} fill="#7a4a3a" />
          <rect x={20} y={150} width={372} height={80} rx={20} fill="#9a5a48" />
          <circle cx={206} cy={150} r={92} fill="#f08a2a" />
          <path d="M 130 90 L 120 20 L 175 70 Z M 282 90 L 292 20 L 237 70 Z" fill="#f08a2a" />
          <ellipse cx={206} cy={190} rx={62} ry={40} fill="#ffffff" />
          <circle cx={172} cy={138} r={20} fill="#5fd6e0" />
          <circle cx={240} cy={138} r={20} fill="#5fd6e0" />
          <circle cx={172} cy={138} r={9} fill="#111" />
          <circle cx={240} cy={138} r={9} fill="#111" />
          <ellipse cx={206} cy={176} rx={14} ry={10} fill="#111" />
          <path d="M 200 200 Q 206 226 214 200 Z" fill="#ff7aa0" />
        </svg>
      </div>
      <div style={{ margin: "16px 24px", padding: "16px 22px", borderRadius: 26, background: "#2a3446", color: "#fff", fontSize: 34 }}>found this on my sofa x</div>
      <div style={{ margin: "0 24px 0 120px", padding: "14px 22px", borderRadius: 26, background: "#3a7bd5", color: "#fff", fontSize: 34, opacity: fadeIn(f, at + 30) }}>I NEED IT BACK 😭</div>
    </div>
  );
};
