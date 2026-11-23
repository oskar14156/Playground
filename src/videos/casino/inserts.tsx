import React from "react";
import { fonts } from "../../lib/theme";
import { easeOut, ramp } from "../../lib/timing";

export { Stamp, CounterPill } from "../pyramid/inserts";
export { YearTag } from "../louvre/inserts";
export { Tag, Big } from "../rocket/sets";
export { Pill } from "../sewer/inserts";

const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.24 * Math.sin(k * Math.PI)) : 1;
};
const fadeIn = (f: number, a: number, d = 7) => ramp(f, a, a + d, easeOut);

/** 1. LayoutCompare: Old Friedman Confusing Maze vs 1998 Bellagio $1.6B Playground */
export const LayoutCompare: React.FC<{ f: number; at: number; bellagioAt: number; until: number }> = ({ f, at, bellagioAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const b = pop(f, bellagioAt, 8);
  const isB = f >= bellagioAt;
  return (
    <div style={{ position: "absolute", top: 185, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "22px 28px",
          borderRadius: 24,
          background: "rgba(10,12,20,0.9)",
          border: `4px solid ${isB ? "#ffd23f" : "#ff5a4d"}`,
          boxShadow: "0 20px 55px rgba(0,0,0,0.55)",
          transform: `scale(${0.86 + 0.14 * k})`,
          display: "flex",
          gap: 20,
        }}
      >
        <div style={{ flex: 1, padding: "14px 18px", borderRadius: 14, background: "rgba(255,60,48,0.14)", border: "3px solid #ff5a4d", opacity: isB ? 0.55 : 1 }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 28, color: "#ff9b92" }}>OLD CASINO DESIGN</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#fff", marginTop: 4 }}>CONFUSING MAZE</div>
        </div>
        {isB ? (
          <div style={{ flex: 1.2, padding: "14px 18px", borderRadius: 14, background: "rgba(255,210,63,0.16)", border: "3px solid #ffd23f", transform: `scale(${b})` }}>
            <div style={{ fontFamily: fonts.hud, fontSize: 28, color: "#ffd23f" }}>1998 BELLAGIO · $1.6B</div>
            <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#5dfc8d", marginTop: 4 }}>OPEN PLAYGROUND</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

/** 2. RouletteEdgeBar: 2.7% → 5.26% → 7.69% animated house edge gauge */
export const RouletteEdgeBar: React.FC<{ f: number; at: number; doubleAt: number; tripleAt: number; until: number }> = ({
  f,
  at,
  doubleAt,
  tripleAt,
  until,
}) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const step = f >= tripleAt ? 3 : f >= doubleAt ? 2 : 1;
  const pct = step === 1 ? "2.70%" : step === 2 ? "5.26%" : "7.69%";
  const label = step === 1 ? "SINGLE ZERO (0)" : step === 2 ? "DOUBLE ZERO (00)" : "TRIPLE ZERO (000)";
  const col = step === 1 ? "#ffd23f" : step === 2 ? "#ff8c38" : "#ff3b30";
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 900,
          padding: "22px 28px",
          borderRadius: 24,
          background: "rgba(8,12,20,0.9)",
          border: `4px solid ${col}`,
          boxShadow: "0 20px 55px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <span style={{ fontFamily: fonts.hud, fontSize: 32, letterSpacing: 3, color: "#cfd8e3" }}>{label}</span>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 56, color: col }}>{pct} EDGE</span>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {[
            { t: "0 · 2.7%", s: 1 },
            { t: "00 · 5.26%", s: 2 },
            { t: "000 · 7.69%", s: 3 },
          ].map((b) => (
            <div
              key={b.s}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 12,
                textAlign: "center",
                fontFamily: fonts.punch,
                fontWeight: 900,
                fontSize: 32,
                background: step >= b.s ? "#16c95b" : "rgba(255,255,255,0.08)",
                color: step >= b.s ? "#081a0f" : "#6c7688",
                border: step === b.s ? "3px solid #fff" : "3px solid transparent",
              }}
            >
              {b.t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** 3. VirtualReelCard: 22 Stops → 1984 Patent US 4,448,419 Virtual Reel Mapping */
export const VirtualReelCard: React.FC<{ f: number; at: number; patentAt: number; until: number }> = ({ f, at, patentAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const p = f >= patentAt ? fadeIn(f, patentAt, 7) : 0;
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 920,
          padding: "20px 28px",
          borderRadius: 24,
          background: "rgba(8,14,26,0.9)",
          border: "4px solid #42e8ff",
          boxShadow: "0 20px 55px rgba(0,0,0,0.6)",
          transform: `scale(${0.86 + 0.14 * k})`,
        }}
      >
        <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#7cefff" }}>SLOT REEL MATH</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 18 }}>
          <div style={{ padding: "12px 20px", borderRadius: 14, background: "rgba(255,255,255,0.07)", fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: "#fff" }}>
            22 PHYSICAL STOPS
          </div>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 42, color: "#ffd23f", opacity: p }}>→</span>
          <div style={{ flex: 1, padding: "12px 20px", borderRadius: 14, background: "rgba(255,210,63,0.16)", border: "3px solid #ffd23f", fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, color: "#ffd23f", opacity: p, textAlign: "center" }}>
            1984 VIRTUAL REEL PATENT
          </div>
        </div>
      </div>
    </div>
  );
};

/** 4. LdwReceipt: Loss Disguised as a Win (Bet $1.00, Win $0.40, Net -$0.60) */
export const LdwReceipt: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width: 900,
          padding: "22px 30px",
          borderRadius: 24,
          background: "rgba(18,8,28,0.92)",
          border: "4px solid #ff42b0",
          boxShadow: "0 20px 55px rgba(255,66,176,0.35)",
          transform: `scale(${0.86 + 0.14 * k})`,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#ff9ce0" }}>LOSS DISGUISED AS A WIN (2010 STUDY)</div>
        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 12, fontFamily: fonts.punch, fontWeight: 900, fontSize: 44 }}>
          <span style={{ color: "#ffffff" }}>BET: $1.00</span>
          <span style={{ color: "#5dfc8d" }}>WIN: $0.40</span>
          <span style={{ color: "#ff4238" }}>NET: -$0.60</span>
        </div>
      </div>
    </div>
  );
};

/** 5. VentCompare: Oxygen Myth (Fire Hazard) vs Cool Air + Signature Scent */
export const VentCompare: React.FC<{ f: number; at: number; scentAt: number; until: number }> = ({ f, at, scentAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const s = pop(f, scentAt, 8);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center", gap: 20 }}>
      <div style={{ width: 430, padding: "16px 20px", borderRadius: 22, background: "rgba(30,8,10,0.9)", border: "4px solid #ff3b30", transform: `scale(${k})`, textAlign: "center" }}>
        <div style={{ fontFamily: fonts.hud, fontSize: 28, color: "#ff9e98" }}>O₂ IN VENTS?</div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 42, color: "#ff3b30" }}>TOTAL MYTH ❌</div>
      </div>
      {f >= scentAt ? (
        <div style={{ width: 440, padding: "16px 20px", borderRadius: 22, background: "rgba(6,24,38,0.9)", border: "4px solid #4ceeff", transform: `scale(${s})`, textAlign: "center" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 28, color: "#9eeeff" }}>REAL HVAC</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: "#4ceeff" }}>COOL + SCENT ✓</div>
        </div>
      ) : null}
    </div>
  );
};

/** 6. CardCountVerdict: Counting Cards = Legal, Still Banned (Private Property) */
export const CardCountVerdict: React.FC<{ f: number; at: number; banAt: number; until: number }> = ({ f, at, banAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const b = pop(f, banAt, 8);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", justifyContent: "center", gap: 20 }}>
      <div style={{ width: 420, padding: "18px 22px", borderRadius: 22, background: "rgba(8,28,16,0.9)", border: "4px solid #5dfc8d", transform: `scale(${k})`, textAlign: "center" }}>
        <div style={{ fontFamily: fonts.hud, fontSize: 28, color: "#a5ffc2" }}>CARD COUNTING</div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#5dfc8d" }}>100% LEGAL ✓</div>
      </div>
      {f >= banAt ? (
        <div style={{ width: 440, padding: "18px 22px", borderRadius: 22, background: "rgba(32,8,12,0.9)", border: "4px solid #ff3b30", transform: `scale(${b})`, textAlign: "center" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 28, color: "#ff9e98" }}>PRIVATE PROPERTY</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#ff3b30" }}>BANNED ANYWAY</div>
        </div>
      ) : null}
    </div>
  );
};

/** 7. RevenueCounter: $72 Billion U.S. Casino Revenue (2024 AGA) */
export const RevenueCounter: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const prog = ramp(f, at, at + 22, easeOut);
  const val = Math.round(prog * 72);
  return (
    <div style={{ position: "absolute", top: 195, width: "100%", display: "flex", justifyContent: "center" }}>
      <div
        style={{
          padding: "20px 44px",
          borderRadius: 26,
          background: "rgba(10,14,24,0.9)",
          border: "5px solid #ffd23f",
          boxShadow: "0 20px 60px rgba(255,210,63,0.35)",
          textAlign: "center",
          transform: `scale(${pop(f, at, 8)})`,
        }}
      >
        <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 4, color: "#ffd23f" }}>U.S. CASINO REVENUE · 2024</div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 84, color: "#ffffff", lineHeight: 1.05 }}>${val} BILLION</div>
      </div>
    </div>
  );
};
