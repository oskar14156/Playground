import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeInOut, easeOut, ramp } from "../../lib/timing";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.25 * Math.sin(k * Math.PI)) : 1;
};
const stroke = (px: number, c = "#000") => ({ WebkitTextStroke: `${px}px ${c}`, paintOrder: "stroke fill" as const });

/** The operator menu on the control board's LCD: COIN / PRIZE / PROFIT type in as they are named. */
export const OperatorMenu: React.FC<{ f: number; at: number; coin: number; prize: number; profit: number }> = ({ f, at, coin, prize, profit }) => {
  const rows: [string, string, number][] = [
    ["COIN VALUE", "$0.50", coin],
    ["PRIZE VALUE", "$7.00", prize],
    ["PROFIT LEVEL", "▮▮▮▮▮▯", profit],
  ];
  const blink = Math.floor(f / 8) % 2;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #0f3a33 0%, #031512 100%)", alignItems: "center" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        {Array.from({ length: 26 }, (_, i) => (
          <path key={i} d={`M ${(i * 97) % 1080} ${(i * 211) % 1920} h ${120 + (i % 5) * 40} v ${80 + (i % 3) * 60} h ${-60 - (i % 4) * 30}`} stroke="#e8c35a" strokeWidth={6} fill="none" />
        ))}
      </svg>
      <div style={{ marginTop: 300, width: 920, padding: "36px 40px", background: "#9fc07a", border: "16px solid #1b1d1a", borderRadius: 18, boxShadow: "0 30px 80px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.35)", fontFamily: fonts.hud, color: "#1d2a14", transform: `scale(${0.92 + 0.08 * fadeIn(f, at, 8)})` }}>
        <div style={{ fontSize: 40, letterSpacing: 6, borderBottom: "4px solid #1d2a14", paddingBottom: 10 }}>OPERATOR MENU · PAYOUT</div>
        {rows.map(([k, v, a]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 60, marginTop: 26, opacity: f >= a ? 1 : 0.3 }}>
            <span>{k}</span>
            <span style={{ fontWeight: 700 }}>{f >= a ? v.slice(0, Math.max(1, Math.floor((f - a) / 1.5))) : "_"}</span>
          </div>
        ))}
        <div style={{ marginTop: 30, fontSize: 40 }}>{f >= profit + 12 ? "▶ SAVE" : ""}{blink ? "" : " ▌"}</div>
      </div>
      <div style={{ position: "absolute", top: 1240, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, color: "#ffffff", ...stroke(7), opacity: fadeIn(f, at + 6) }}>YOU SET THE ODDS</div>
    </AbsoluteFill>
  );
};

/** "It's in the manuals": a scanned manual page, one line highlighted (BMI Gaming manual, quoted by Vox 2015). */
export const ManualQuote: React.FC<{ f: number; at: number; hl: number }> = ({ f, at, hl }) => {
  const k = ramp(f, hl, hl + 14, easeOut);
  return (
    <AbsoluteFill style={{ background: "#1a1712", alignItems: "center" }}>
      <div style={{ marginTop: 250, width: 900, minHeight: 1150, padding: "60px 64px", background: "#f4f1e8", boxShadow: "0 30px 90px rgba(0,0,0,0.7)", transform: `rotate(-2deg) scale(${0.95 + 0.05 * fadeIn(f, at, 10)})`, fontFamily: "Georgia, serif", color: "#2a2620" }}>
        <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 4, color: "#7a7468" }}>CRANE OPERATION MANUAL · SECTION 4</div>
        <div style={{ fontSize: 56, fontWeight: 700, marginTop: 20 }}>Profit Management</div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ height: 14, background: "#d8d2c2", width: `${92 - i * 9}%`, marginTop: 26 }} />
        ))}
        <div style={{ fontSize: 50, lineHeight: 1.45, marginTop: 36, position: "relative" }}>
          <span style={{ background: `linear-gradient(90deg, rgba(255,226,58,0.85) ${k * 100}%, transparent ${k * 100}%)` }}>
            “The machine will automatically calculate when to send full strength to the claw.”
          </span>
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ height: 14, background: "#d8d2c2", width: `${88 - i * 7}%`, marginTop: 26 }} />
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#b8b0a0" }}>BMI GAMING MANUAL, QUOTED BY VOX (2015)</div>
    </AbsoluteFill>
  );
};

/** The worked example: price tags 50¢ and $7, then 21 tries as bars, then the gacha banner. */
export const TryExample: React.FC<{ f: number; cents: number; seven: number; every: number; pity: number }> = ({ f, cents, seven, every, pity }) => {
  const tag = (txt: string, sub: string, a: number, color: string) => (
    <div style={{ opacity: fadeIn(f, a), transform: `scale(${0.6 + 0.4 * pop(f, a, 8)}) rotate(${color === "#ffd23f" ? -6 : 5}deg)`, padding: "18px 34px", borderRadius: 24, background: color, boxShadow: "0 14px 40px rgba(0,0,0,0.5)", textAlign: "center" }}>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 110, color: "#111", lineHeight: 1 }}>{txt}</div>
      <div style={{ fontFamily: fonts.hud, fontSize: 32, color: "#111", letterSpacing: 3 }}>{sub}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #2a1a4a 0%, #07050f 100%)", alignItems: "center" }}>
      <div style={{ marginTop: 280, display: "flex", gap: 60 }}>
        {tag("50¢", "ONE GAME", cents, "#ffd23f")}
        {tag("$7", "ONE PRIZE", seven, "#2ec4d6")}
      </div>
      {f >= every ? <TryBars f={f} at={every} pity={pity} /> : null}
      <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#a99cc8" }}>EXAMPLE FROM VOX (2015) · 21 × 50¢ = $10.50</div>
    </AbsoluteFill>
  );
};

/** 21 tries as bars: 20 grey hugs, the 21st gold FULL POWER; then a gacha-style "PITY 20/21" banner. */
const TryBars: React.FC<{ f: number; at: number; pity: number }> = ({ f, at, pity }) => {
  const n = Math.min(21, Math.max(0, Math.floor((f - at) / 1.4)));
  const pk = pop(f, pity, 10);
  return (
    <div style={{ position: "absolute", top: 1080, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 300 }}>
        {Array.from({ length: 21 }, (_, i) => {
          const on = i < n;
          const gold = i === 20;
          return (
            <div
              key={i}
              style={{
                width: 34,
                height: on ? (gold ? 290 : 70) : 6,
                background: gold ? "linear-gradient(180deg,#fff2a8,#ffb400)" : "#6c7a86",
                borderRadius: 6,
                boxShadow: gold && on ? "0 0 40px #ffd23f" : "none",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", width: 900, marginTop: 12, fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff", ...stroke(6) }}>
        <span style={{ color: "#c9d3db" }}>20× HUG</span>
        <span style={{ color: "#ffd23f", opacity: n >= 21 ? 1 : 0 }}>FULL POWER</span>
      </div>
      {f >= pity ? (
        <div style={{ marginTop: 40, transform: `scale(${0.6 + 0.4 * pk}) rotate(-3deg)`, opacity: Math.min(1, pk), padding: "16px 40px", borderRadius: 999, background: "linear-gradient(90deg,#7b3cff,#ff4fd8,#ffd23f)", boxShadow: "0 0 50px rgba(255,79,216,0.7)", fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, color: "#fff", ...stroke(7, "#2a0a4a") }}>
          ★ PITY 20/21 ★
        </div>
      ) : null}
    </div>
  );
};

/** Claw power over one try: GRAB+LIFT strong, CARRY weak, the prize slips at the chute edge. */
export const GripGraph: React.FC<{ f: number; at: number; carry: number; edge: number }> = ({ f, at, carry, edge }) => {
  const W = 880;
  const H = 520;
  const prog = ramp(f, at + 4, edge + 6, (x) => x);
  // power curve: 0 → 100 % (grab) → 100 % (lift) → 25 % (carry) → 0 (open over chute)
  const pts: [number, number][] = [
    [0, 0],
    [0.08, 1],
    [0.42, 1],
    [0.5, 0.25],
    [0.88, 0.25],
    [0.92, 0],
    [1, 0],
  ];
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x * W} ${H - y * (H - 40)}`).join(" ");
  const len = 2200;
  const curY = (() => {
    for (let i = 1; i < pts.length; i++)
      if (prog <= pts[i][0]) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        return y0 + ((y1 - y0) * (prog - x0)) / Math.max(1e-6, x1 - x0);
      }
    return 0;
  })();
  const weak = f >= carry;
  return (
    <AbsoluteFill style={{ background: weak ? "radial-gradient(ellipse at 50% 40%, #3a0f16 0%, #0d0306 100%)" : "radial-gradient(ellipse at 50% 40%, #13203a 0%, #04070e 100%)", alignItems: "center" }}>
      <div style={{ position: "absolute", top: 220, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 70, color: "#fff", ...stroke(8) }}>CLAW POWER</div>
      <svg width={W + 180} height={H + 160} style={{ position: "absolute", top: 1080 }}>
        <g transform="translate(130,20)">
          {/* phase bands */}
          <rect x={0} y={0} width={0.42 * W} height={H} fill="rgba(46,196,214,0.12)" />
          <rect x={0.5 * W} y={0} width={0.4 * W} height={H} fill={`rgba(255,59,48,${weak ? 0.22 : 0.08})`} />
          {[0, 0.25, 0.5, 0.75, 1].map((y) => (
            <line key={y} x1={0} x2={W} y1={H - y * (H - 40)} y2={H - y * (H - 40)} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
          ))}
          <text x={-12} y={48} fill="#9fb3c8" fontFamily="monospace" fontSize={30} textAnchor="end">100%</text>
          <text x={-12} y={H - 0.25 * (H - 40) + 10} fill="#9fb3c8" fontFamily="monospace" fontSize={30} textAnchor="end">25%</text>
          <path d={path} stroke="#ffd23f" strokeWidth={12} fill="none" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - prog)} />
          <circle cx={prog * W} cy={H - curY * (H - 40)} r={20} fill="#fff" stroke="#ffd23f" strokeWidth={6} />
          <text x={0.21 * W} y={H + 60} fill="#2ec4d6" fontFamily={fonts.punch} fontWeight={900} fontSize={46} textAnchor="middle">LIFT</text>
          <text x={0.7 * W} y={H + 60} fill="#ff5a4f" fontFamily={fonts.punch} fontWeight={900} fontSize={46} textAnchor="middle" opacity={fadeIn(f, carry - 4)}>CARRY</text>
          <text x={0.95 * W} y={H + 60} fill="#fff" fontFamily={fonts.punch} fontWeight={900} fontSize={40} textAnchor="middle" opacity={fadeIn(f, edge)}>HOLE</text>
        </g>
      </svg>

      <div style={{ position: "absolute", top: 320, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#9fb3c8" }}>TWO TRIM POTS: LIFT VOLTAGE · CARRY VOLTAGE</div>
    </AbsoluteFill>
  );
};

/** 1951: a carnival "digger" with a red GAMBLING DEVICE stamp (Johnson Act). */
export const Law1951: React.FC<{ f: number; at: number; stamp: number }> = ({ f, at, stamp }) => {
  const sk = pop(f, stamp, 7);
  const push = 1 + 0.1 * ramp(f, at, stamp + 30, (x) => x);
  return (
    <AbsoluteFill style={{ background: "#e9dfc6", alignItems: "center", transform: `scale(${push}) rotate(${-1 + 2 * ramp(f, at, stamp + 30)}deg)` }}>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0 3px, transparent 3px 7px)" }} />
      <div style={{ marginTop: 230, fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 80, color: "#1d1a14", letterSpacing: 1 }}>THE DAILY DIGGER</div>
      <div style={{ width: 900, height: 6, background: "#1d1a14", marginTop: 6 }} />
      <div style={{ fontFamily: "Georgia, serif", fontSize: 40, color: "#3a3428", marginTop: 12 }}>JANUARY 2, 1951 · JOHNSON ACT SIGNED</div>
      {/* the old digger machine, drawn in ink */}
      <svg width={620} height={820} viewBox="0 0 620 820" style={{ marginTop: 40, opacity: fadeIn(f, at, 6) }}>
        <g fill="none" stroke="#2a2418" strokeWidth={8} strokeLinejoin="round">
          <path d="M 120 120 Q 310 20 500 120 L 500 170 L 120 170 Z" fill="#c9a96a" />
          <rect x={130} y={170} width={360} height={330} fill="rgba(200,230,240,0.35)" />
          <line x1={310} y1={170} x2={310} y2={300} />
          <path d="M 290 300 h 40 l 20 40 M 290 300 l -20 40 M 310 300 v 45" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={170 + i * 55} cy={470 - (i % 2) * 14} r={20} fill="#e0b84a" />
          ))}
          <path d="M 110 500 L 510 500 L 540 780 L 80 780 Z" fill="#8a3a2a" />
          <rect x={270} y={560} width={80} height={60} fill="#2a2418" />
          <circle cx={200} cy={600} r={16} fill="#2a2418" />
          <circle cx={420} cy={600} r={16} fill="#2a2418" />
        </g>
        <text x={310} y={152} textAnchor="middle" fontFamily="Georgia, serif" fontWeight={900} fontSize={40} fill="#2a2418">DIGGER</text>
      </svg>
      {f >= stamp ? (
        <div style={{ position: "absolute", top: 1220, padding: "18px 36px", border: "12px solid #c0202a", borderRadius: 16, color: "#c0202a", fontFamily: fonts.punch, fontWeight: 900, fontSize: 96, transform: `rotate(-14deg) scale(${2.2 - 1.2 * Math.min(1, sk)})`, opacity: Math.min(1, sk) * 0.92, mixBlendMode: "multiply" }}>
          GAMBLING DEVICE
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Big centred stamp text for meme beats (SKILL ISSUE, LET HIM COOK, AW DANG IT). */
export const MemeStamp: React.FC<{ f: number; at: number; until?: number; text: string; color?: string; top?: number; size?: number; rot?: number }> = ({ f, at, until, text, color = "#ffd23f", top = 1240, size = 110, rot = -4 }) => {
  if (f < at || (until !== undefined && f >= until)) return null;
  const k = pop(f, at, 7);
  const out = until !== undefined ? 1 - ramp(f, until - 5, until, easeInOut) : 1;
  return (
    <div style={{ position: "absolute", top, width: "100%", textAlign: "center", transform: `rotate(${rot}deg) scale(${0.5 + 0.5 * k})`, opacity: Math.min(1, k) * out, fontFamily: fonts.punch, fontWeight: 900, fontSize: size, color, ...stroke(Math.round(size / 8)), lineHeight: 1 }}>
      {text}
    </div>
  );
};

/** Glitch HUD for the kids-climb-in beat: OUT OF BOUNDS → PATCH NOTES. */
export const GlitchHud: React.FC<{ f: number; at: number; patch: number }> = ({ f, at, patch }) => {
  if (f < at) return null;
  const jit = Math.floor(f / 2) % 3;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 230, left: 60 + jit * 4, fontFamily: fonts.hud, fontSize: 54, color: "#ff3b30", textShadow: "4px 0 #28e0ff, -4px 0 #ff2fa0", letterSpacing: 4 }}>⚠ OUT OF BOUNDS</div>
      <div style={{ position: "absolute", top: 300, left: 60, fontFamily: fonts.hud, fontSize: 34, color: "#ffffff", opacity: 0.8 }}>PLAYER INSIDE MACHINE</div>
      {f >= patch ? (
        <div style={{ position: "absolute", top: 1180, left: 90, width: 900, padding: "26px 34px", background: "rgba(8,10,20,0.9)", border: "4px solid #7dff5a", borderRadius: 18, fontFamily: fonts.hud, color: "#7dff5a", opacity: fadeIn(f, patch), transform: `translateY(${(1 - fadeIn(f, patch)) * 40}px)` }}>
          <div style={{ fontSize: 44 }}>PATCH NOTES v1.0.1</div>
          <div style={{ fontSize: 34, color: "#d8ffd0", marginTop: 10 }}>– fixed: kids clipping through the prize door</div>
          <div style={{ fontSize: 34, color: "#d8ffd0" }}>– fix deployed by: the fire department</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
