import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeOut, ramp, seeded } from "../../lib/timing";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.25 * Math.sin(k * Math.PI)) : 1;
};
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** A red rubber stamp that slams in (scale 2 → 1). */
export const Stamp: React.FC<{ f: number; at: number; text: string; top: number; color?: string; rot?: number; size?: number }> = ({ f, at, text, top, color = "#ff3b30", rot = -8, size = 96 }) => {
  if (f < at) return null;
  const k = ramp(f, at, at + 6, easeOut);
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(1, k * 1.5) }}>
      <div style={{ transform: `rotate(${rot}deg) scale(${2 - k})`, border: `12px solid ${color}`, color, fontFamily: fonts.punch, fontWeight: 900, fontSize: size, padding: "4px 30px", borderRadius: 16, background: "rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
};

/** Game-style patch notes for Sneferu's pyramid: "Angle nerfed 54° → 43°". */
export const PatchNotes: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  if (f < at) return null;
  const k = pop(f, at, 9);
  const line = (i: number) => fadeIn(f, at + 8 + i * 7);
  return (
    <div style={{ position: "absolute", left: 80, top: 1180, width: 920, transform: `translateY(${(1 - k) * 260}px) scale(${0.92 + 0.08 * k})`, opacity: Math.min(1, k * 1.4), background: "linear-gradient(180deg, #1a2230 0%, #0e131c 100%)", border: "4px solid #c8a24a", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", padding: "26px 36px", fontFamily: fonts.hud, color: "#e8edf3" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 54, color: "#f2c94c", letterSpacing: 2 }}>PATCH NOTES v2.1</span>
        <span style={{ fontSize: 28, color: "#8a96a8" }}>~2600 BC</span>
      </div>
      <div style={{ fontSize: 30, color: "#8a96a8", marginTop: 4, letterSpacing: 3 }}>SNEFERU&apos;S PYRAMID · DAHSHUR</div>
      <div style={{ height: 3, background: "#2c3648", margin: "16px 0" }} />
      <div style={{ fontSize: 40, opacity: line(0) }}>
        <span style={{ color: "#ff6b5e" }}>▼ NERF</span> &nbsp;Side angle <b style={{ color: "#fff" }}>54° → 43°</b>
      </div>
      <div style={{ fontSize: 40, marginTop: 10, opacity: line(1) }}>
        <span style={{ color: "#5dfc8d" }}>▲ BUFF</span> &nbsp;Stability
      </div>
      <div style={{ fontSize: 40, marginTop: 10, opacity: line(2) }}>
        <span style={{ color: "#8fd0ff" }}>● KNOWN ISSUE</span> &nbsp;Pyramid is bent
      </div>
    </div>
  );
};

/** Two bars on one scale: pulling force on dry sand vs wet sand (half). */
export const ForceBars: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  if (f < at) return null;
  const o = fadeIn(f, at);
  const dry = ramp(f, at + 4, at + 20, easeOut);
  const wet = ramp(f, at + 16, at + 32, easeOut);
  const bar = (label: string, k: number, color: string, pct: string) => (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#cfd8e3" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 6 }}>
        <div style={{ width: 600 * k, height: 46, borderRadius: 10, background: color, boxShadow: `0 0 18px ${color}` }} />
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 46, color: "#fff", opacity: k > 0.95 ? 1 : 0 }}>{pct}</span>
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 70, top: 1240, width: 940, opacity: o, padding: "22px 32px", borderRadius: 22, background: "rgba(8,12,22,0.82)", border: "3px solid rgba(140,200,255,0.5)" }}>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#ffd23f" }}>PULLING FORCE</div>
      {bar("DRY SAND", dry, "#e0a050", "100%")}
      {bar("WET SAND", wet * 0.5, "#4ab8ff", "50%")}
    </div>
  );
};

/** Egyptian figure in profile: striding legs, kilt, arms forward on the rope (or holding a jar when `pour`). */
const Figure: React.FC<{ x: number; y: number; s?: number; pour?: boolean; ph?: number }> = ({ x, y, s = 1, pour = false, ph = 0 }) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    {/* legs */}
    <path d={`M -6 40 L ${-14 - 4 * Math.sin(ph)} 78 M 6 40 L ${16 + 4 * Math.sin(ph)} 78`} stroke="#9a4a24" strokeWidth={7} strokeLinecap="round" />
    {/* kilt */}
    <path d="M -12 26 L 14 26 L 18 46 L -14 46 Z" fill="#f4efe2" stroke="#3a2a1a" strokeWidth={1.5} />
    {/* torso */}
    <path d="M -9 -6 L 11 -6 L 12 26 L -10 26 Z" fill="#9a4a24" />
    {/* head + wig */}
    <circle cx={4} cy={-16} r={10} fill="#9a4a24" />
    <path d="M -8 -22 Q 2 -32 14 -22 L 12 -10 L -6 -8 Z" fill="#1c1410" />
    <circle cx={10} cy={-17} r={1.6} fill="#fff" />
    {/* arms */}
    {pour ? <path d="M 8 -2 L 26 -14 M 8 2 L 28 -6" stroke="#9a4a24" strokeWidth={6} strokeLinecap="round" /> : <path d="M 6 -2 L 30 8 M 6 2 L 30 12" stroke="#9a4a24" strokeWidth={6} strokeLinecap="round" />}
    {pour ? (
      <g>
        <ellipse cx={34} cy={-12} rx={9} ry={12} fill="#b0603a" stroke="#3a2a1a" strokeWidth={1.5} transform="rotate(50 34 -12)" />
        <path d="M 40 -4 Q 46 20 44 74" stroke="#4ab8ff" strokeWidth={4} fill="none" />
      </g>
    ) : null}
  </g>
);

/** The tomb painting of Djehutihotep (~1900 BC): rows of men haul a colossal statue on a sledge, one pours water in front. */
export const DjehutihotepPainting: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const o = fadeIn(f, at, 10);
  const pan = ramp(f, at, at + 90, (x) => x) * 60;
  const ph = (f - at) * 0.12;
  return (
    <AbsoluteFill style={{ background: "#0d0a07", opacity: o }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <filter id="plaster">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={3} seed={4} />
            <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0 0.18  0 0 0 0.35 0" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
        <g transform={`translate(${-pan},0)`}>
          <rect x={20} y={300} width={1140} height={1180} fill="#d9c08e" />
          <rect x={20} y={300} width={1140} height={1180} filter="url(#plaster)" />
          {/* register bands */}
          {[300, 690, 1080, 1470].map((y) => (
            <rect key={y} x={20} y={y - 6} width={1140} height={12} fill="#6a3a1c" />
          ))}
          {/* the colossus on its sledge (right) */}
          <g transform="translate(820,560)">
            <rect x={-10} y={330} width={300} height={22} fill="#7a4a24" />
            <path d="M 20 330 L 40 40 Q 60 -10 110 -20 L 150 -20 Q 190 0 196 60 L 230 330 Z" fill="#c8b08a" stroke="#3a2a1a" strokeWidth={3} />
            <circle cx={135} cy={-60} r={42} fill="#c8b08a" stroke="#3a2a1a" strokeWidth={3} />
            <path d="M 95 -80 Q 135 -120 175 -80 L 172 -30 L 98 -30 Z" fill="#2a2a3a" />
            {/* the water-pourer on the sledge's front */}
            <Figure x={-30} y={254} s={1.25} pour ph={0} />
          </g>
          {/* rows of pullers, two registers */}
          {[0, 1].map((row) =>
            Array.from({ length: 9 }, (_, i) => <Figure key={`${row}${i}`} x={80 + i * 78} y={row ? 1180 : 800} s={1.4} ph={ph + i * 0.7} />),
          )}
          {/* ropes */}
          <path d="M 70 818 L 790 900" stroke="#6a4a2a" strokeWidth={5} />
          <path d="M 70 1198 L 790 905" stroke="#6a4a2a" strokeWidth={5} />
          {/* hieroglyph columns along the top */}
          {Array.from({ length: 14 }, (_, i) => {
            const r = seeded(i + 3);
            return (
              <g key={i} transform={`translate(${60 + i * 78},360)`} stroke="#2a3a6a" strokeWidth={4} fill="none">
                {r() < 0.5 ? <circle cx={0} cy={20} r={12} /> : <path d="M -14 30 L 0 6 L 14 30" />}
                {r() < 0.5 ? <path d="M -16 70 Q 0 50 16 70" /> : <rect x={-10} y={56} width={20} height={20} />}
                <path d="M 0 100 L 0 140 M -12 120 L 12 120" />
              </g>
            );
          })}
        </g>
      </svg>
      <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 34, letterSpacing: 5, color: "#e8d6a8" }}>TOMB OF DJEHUTIHOTEP</div>
      <div style={{ position: "absolute", top: 200, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 56, color: "#ffd23f", WebkitTextStroke: "7px #000", paintOrder: "stroke fill" }}>~1900 BC</div>
      {f >= at + 30 ? (
        <div style={{ position: "absolute", left: 640, top: 600, opacity: fadeIn(f, at + 30), fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#4ab8ff", WebkitTextStroke: "6px #000", paintOrder: "stroke fill" }}>
          ← WATER
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** The Diary of Merer: a papyrus with hieratic lines, then the translation card. */
export const MererPapyrus: React.FC<{ f: number; at: number; oldest: number; diary: number }> = ({ f, at, oldest, diary }) => {
  const o = fadeIn(f, at, 10);
  const r = seeded(19);
  const lines = Array.from({ length: 11 }, (_, i) => Array.from({ length: 16 }, () => ({ w: 8 + r() * 26, h: 6 + r() * 22, red: r() < 0.12, gap: 6 + r() * 10, dy: (r() - 0.5) * 8 })));
  const tk = pop(f, diary, 10);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #3a2c1a 0%, #0f0b07 100%)", opacity: o }}>
      <div style={{ position: "absolute", left: 90, top: 300, width: 900, height: 900, background: "linear-gradient(90deg, #d9c48e, #e8d7a6 30%, #d6bf86 60%, #e3cf9a)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: `rotate(-2deg) scale(${1 + 0.04 * ramp(f, at, at + 120, (x) => x)})`, overflow: "hidden" }}>
        {/* papyrus fibres */}
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: 0, top: i * 18, width: "100%", height: 2, background: "rgba(120,90,40,0.12)" }} />
        ))}
        {Array.from({ length: 30 }, (_, i) => (
          <div key={i} style={{ position: "absolute", left: i * 30, top: 0, width: 2, height: "100%", background: "rgba(120,90,40,0.08)" }} />
        ))}
        {/* hieratic writing, right to left */}
        {lines.map((row, i) => (
          <div key={i} style={{ position: "absolute", right: 50, top: 60 + i * 72, display: "flex", flexDirection: "row-reverse", alignItems: "center" }}>
            {row.map((g, j) => (
              <div key={j} style={{ width: g.w, height: g.h, marginLeft: g.gap, transform: `translateY(${g.dy}px) skewX(-20deg)`, background: g.red ? "#a8341e" : "#1c140c", borderRadius: 4, opacity: 0.85 }} />
            ))}
          </div>
        ))}
        {/* torn edge */}
        <div style={{ position: "absolute", right: -30, top: 0, width: 80, height: "100%", background: "linear-gradient(90deg, rgba(15,11,7,0) 0%, #0f0b07 70%)" }} />
      </div>
      <div style={{ position: "absolute", top: 140, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 34, letterSpacing: 5, color: "#e8d6a8" }}>THE DIARY OF MERER · FOUND 2013</div>
      {f >= oldest ? (
        <div style={{ position: "absolute", top: 1240, width: "100%", textAlign: "center", opacity: fadeIn(f, oldest), fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, lineHeight: 1.05, color: "#ffd23f", WebkitTextStroke: "8px #000", paintOrder: "stroke fill" }}>
          OLDEST WRITTEN{"\n"}PAPYRUS EVER FOUND
        </div>
      ) : null}
      {f >= diary ? (
        <div style={{ position: "absolute", left: 120, top: 420, width: 840, padding: "30px 40px", background: "#fffaf0", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: `translateY(${(1 - tk) * 400}px) rotate(1.5deg)`, fontFamily: fonts.hud, color: "#2a1c10" }}>
          <div style={{ fontSize: 28, letterSpacing: 4, color: "#a8341e" }}>TRANSLATION (BASICALLY)</div>
          {["DAY 1: STONES.", "DAY 2: STONES.", "DAY 3: MORE STONES."].map((s, i) => (
            <div key={s} style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 54, marginTop: 10, opacity: fadeIn(f, diary + 6 + i * 7) }}>
              {s}
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** A strip map of the Nile from Giza to Aswan: 900 km · 560 mi. */
export const NileMap: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  if (f < at) return null;
  const o = fadeIn(f, at);
  const k = ramp(f, at + 4, at + 30, easeOut);
  const path = "M 120 60 C 90 160 150 230 120 330 C 95 420 140 500 118 600";
  return (
    <div style={{ position: "absolute", right: 40, top: 280, width: 300, height: 700, opacity: o, background: "rgba(10,14,24,0.82)", border: "3px solid rgba(140,200,255,0.5)", borderRadius: 20 }}>
      <svg width={300} height={700}>
        <path d={path} stroke="#3a8ad8" strokeWidth={10} fill="none" strokeLinecap="round" />
        <path d={path} stroke="#ffd23f" strokeWidth={6} fill="none" strokeDasharray="700" strokeDashoffset={700 * (1 - k)} />
        <circle cx={120} cy={60} r={12} fill="#ffd23f" />
        <circle cx={118} cy={600} r={12} fill="#ff6b5e" />
      </svg>
      <div style={{ position: "absolute", left: 150, top: 38, fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: "#fff" }}>GIZA</div>
      <div style={{ position: "absolute", left: 150, top: 578, fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: "#fff" }}>ASWAN</div>
      <div style={{ position: "absolute", left: 150, top: 618, fontFamily: fonts.hud, fontSize: 24, color: "#ff9d94" }}>GRANITE</div>
      <div style={{ position: "absolute", left: 140, top: 280, fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, lineHeight: 1.05, color: "#ffd23f", opacity: k }}>
        900 KM
        <br />
        <span style={{ fontSize: 30, color: "#cfd8e3" }}>560 MI</span>
      </div>
    </div>
  );
};

/** A block vs a car on a scale: "1 BLOCK ≈ 1 CAR". */
export const BlockVsCar: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  if (f < at) return null;
  const k = pop(f, at, 9);
  return (
    <div style={{ position: "absolute", left: 60, top: 1250, width: 520, padding: "20px 26px", borderRadius: 20, background: "rgba(8,12,22,0.85)", border: "3px solid rgba(255,210,63,0.6)", transform: `scale(${0.8 + 0.2 * k})`, transformOrigin: "left top", opacity: Math.min(1, k * 1.4) }}>
      <svg width={470} height={150}>
        {/* the block */}
        <rect x={20} y={50} width={130} height={86} rx={6} fill="#d8bd8e" stroke="#6a4a2a" strokeWidth={4} />
        <text x={182} y={110} fontFamily={fonts.punch} fontWeight={900} fontSize={60} fill="#fff">
          ≈
        </text>
        {/* a car silhouette */}
        <path d="M 250 120 L 252 92 Q 262 78 300 74 L 330 52 Q 340 46 380 46 L 410 48 Q 430 52 440 76 L 458 84 Q 466 90 464 120 Z" fill="#e8573a" stroke="#2a1a10" strokeWidth={4} />
        <circle cx={292} cy={124} r={16} fill="#1a1a1a" />
        <circle cx={428} cy={124} r={16} fill="#1a1a1a" />
      </svg>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#ffd23f" }}>MOST BLOCKS ≈ 1.5 T · 1.7 TONS</div>
    </div>
  );
};

/** A stopwatch: one block every 2 minutes, 10 hours a day, for 20 years. */
export const BlockClock: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  if (f < at) return null;
  const o = fadeIn(f, at);
  const a = ((f - at) / 30) * Math.PI * 1.2;
  return (
    <div style={{ position: "absolute", right: 60, top: 1250, width: 400, padding: "18px 22px", borderRadius: 20, background: "rgba(8,12,22,0.85)", border: "3px solid rgba(140,200,255,0.5)", opacity: o, display: "flex", alignItems: "center", gap: 18 }}>
      <svg width={120} height={120}>
        <circle cx={60} cy={60} r={52} fill="#0e1420" stroke="#cfd8e3" strokeWidth={6} />
        {Array.from({ length: 12 }, (_, i) => {
          const t = (i / 12) * Math.PI * 2;
          return <line key={i} x1={60 + Math.sin(t) * 42} y1={60 - Math.cos(t) * 42} x2={60 + Math.sin(t) * 48} y2={60 - Math.cos(t) * 48} stroke="#cfd8e3" strokeWidth={3} />;
        })}
        <line x1={60} y1={60} x2={60 + Math.sin(a) * 40} y2={60 - Math.cos(a) * 40} stroke="#ffd23f" strokeWidth={6} strokeLinecap="round" />
      </svg>
      <div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#fff", lineHeight: 1 }}>1 BLOCK</div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: "#ffd23f" }}>EVERY 2 MIN</div>
        <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#cfd8e3" }}>10 H A DAY · 20 YEARS</div>
      </div>
    </div>
  );
};

/** A counter pill at the top: label + number. */
export const CounterPill: React.FC<{ o: number; value: number; label: string; top?: number }> = ({ o, value, label, top = 150 }) =>
  o > 0.01 ? (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, padding: "12px 32px", borderRadius: 22, background: "rgba(6,10,22,0.8)", border: "3px solid rgba(255,210,63,0.7)", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 70, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{fmt(value)}</span>
        <span style={{ fontFamily: fonts.hud, fontSize: 34, letterSpacing: 4, color: "#ffd23f" }}>{label}</span>
      </div>
    </div>
  ) : null;

/** Timeline: the pyramid (~2560 BC), Cleopatra (died 30 BC), the Moon landing (1969). */
export const CleopatraTimeline: React.FC<{ f: number; at: number; cleo: number }> = ({ f, at, cleo }) => {
  const o = fadeIn(f, at, 10);
  const x = (year: number) => 90 + ((year + 2600) / (2030 + 2600)) * 900; // BC as negative
  const k1 = ramp(f, cleo + 8, cleo + 26, easeOut);
  const k2 = ramp(f, cleo + 22, cleo + 40, easeOut);
  const tall = ramp(f, at + 4, at + 34, easeOut);
  const ev = (year: number, label: string, sub: string, y: number, color: string, show: number) => (
    <div style={{ position: "absolute", left: x(year), top: y, transform: "translateX(-50%)", textAlign: "center", opacity: show }}>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color, whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ fontFamily: fonts.hud, fontSize: 28, color: "#cfd8e3", whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #2a2216 0%, #0b0906 100%)", opacity: o }}>
      {/* "tallest for 3,800 years": a bar from 2600 BC to 1221 AD */}
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 34, letterSpacing: 5, color: "#e8d6a8" }}>TALLEST BUILDING ON EARTH</div>
      <div style={{ position: "absolute", left: x(-2600), top: 370, width: (x(1221) - x(-2600)) * tall, height: 54, borderRadius: 12, background: "linear-gradient(90deg, #f2c94c, #e09a3a)" }} />
      <div style={{ position: "absolute", left: x(-2600), top: 440, fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, color: "#fff", opacity: tall }}>
        ≈ 3,800 YEARS <span style={{ fontSize: 34, color: "#cfd8e3" }}>(UNTIL 1221 AD)</span>
      </div>
      {/* the timeline */}
      <div style={{ position: "absolute", left: 90, top: 1500, width: 900, height: 8, background: "#cfd8e3", opacity: 0.8 }} />
      {[
        [-2560, "#f2c94c"],
        [-30, "#ff8ad0"],
        [1969, "#8fd0ff"],
      ].map(([y, col]) => (
        <div key={y} style={{ position: "absolute", left: x(y as number) - 14, top: 1490, width: 28, height: 28, borderRadius: 14, background: col as string, opacity: f >= cleo ? 1 : 0.3 }} />
      ))}
      {ev(-2560, "PYRAMID", "~2560 BC", 1540, "#f2c94c", fadeIn(f, cleo))}
      {ev(-30, "CLEOPATRA", "30 BC", 1540, "#ff8ad0", fadeIn(f, cleo + 4))}
      {ev(1969, "MOON", "1969", 1540, "#8fd0ff", fadeIn(f, cleo + 8))}
      {/* the two gaps */}
      <div style={{ position: "absolute", left: x(-2560), top: 1440, width: (x(-30) - x(-2560)) * k1, height: 16, borderRadius: 8, background: "#f2c94c" }} />
      <div style={{ position: "absolute", left: (x(-2560) + x(-30)) / 2, top: 1370, transform: "translateX(-50%)", fontFamily: fonts.punch, fontWeight: 900, fontSize: 46, color: "#f2c94c", opacity: k1, whiteSpace: "nowrap" }}>2,530 YEARS</div>
      <div style={{ position: "absolute", left: x(-30), top: 1440, width: (x(1969) - x(-30)) * k2, height: 16, borderRadius: 8, background: "#8fd0ff" }} />
      <div style={{ position: "absolute", left: (x(-30) + x(1969)) / 2, top: 1370, transform: "translateX(-50%)", fontFamily: fonts.punch, fontWeight: 900, fontSize: 46, color: "#8fd0ff", opacity: k2, whiteSpace: "nowrap" }}>1,998 YEARS</div>
    </AbsoluteFill>
  );
};
