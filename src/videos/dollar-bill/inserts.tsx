import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeOut, ramp } from "../../lib/timing";

export { Stamp, CounterPill } from "../pyramid/inserts";
export { Clipping } from "../white-house/inserts";
export { YearTag } from "../louvre/inserts";
export { Tag, Big } from "../rocket/sets";
export { Pill } from "../sewer/inserts";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.25 * Math.sin(k * Math.PI)) : 1;
};

/** 75% Cotton + 25% Linen bar + "BASICALLY JEANS" badge + 4,000 double folds readout */
export const MaterialBar: React.FC<{ f: number; at: number; until: number; jeansAt: number; foldsAt: number }> = ({
  f,
  at,
  until,
  jeansAt,
  foldsAt,
}) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 9);
  const w = ramp(f, at + 4, at + 22, easeOut);
  const j = pop(f, jeansAt, 8);
  const fl = ramp(f, foldsAt, foldsAt + 24, easeOut);
  const folds = Math.round(fl * 4000);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div
        style={{
          width: 900,
          padding: "22px 30px",
          borderRadius: 24,
          background: "rgba(8,14,24,0.88)",
          border: "4px solid #63a4ff",
          boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          transform: `scale(${0.86 + 0.14 * k})`,
          opacity: Math.min(1, k * 1.4),
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.hud, fontSize: 32, letterSpacing: 3, color: "#cfd8e3", marginBottom: 12 }}>
          <span>BANKNOTE BLEND</span>
          {f >= jeansAt ? <span style={{ color: "#7cc6ff", fontWeight: 700, opacity: j }}>BASICALLY JEANS 👖</span> : null}
        </div>
        <div style={{ display: "flex", height: 56, borderRadius: 14, overflow: "hidden", border: "3px solid rgba(255,255,255,0.25)" }}>
          <div style={{ width: `${75 * w}%`, background: "#2b5c9e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, color: "#fff", whiteSpace: "nowrap" }}>
            {w > 0.45 ? "75% COTTON" : ""}
          </div>
          <div style={{ width: `${25 * w}%`, background: "#e8dec0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 30, color: "#1d1a14", whiteSpace: "nowrap" }}>
            {w > 0.7 ? "25% LINEN" : ""}
          </div>
        </div>
      </div>
      {f >= foldsAt ? (
        <div
          style={{
            padding: "10px 30px",
            borderRadius: 18,
            background: "rgba(8,14,24,0.88)",
            border: "3px solid #ffd23f",
            fontFamily: fonts.punch,
            fontWeight: 900,
            fontSize: 44,
            color: "#ffd23f",
            opacity: fadeIn(f, foldsAt, 6),
          }}
        >
          {folds.toLocaleString("en-US")} DOUBLE FOLDS
        </div>
      ) : null}
    </div>
  );
};

/** 2D chemical-reaction mini card: iodine pen reaction */
export const PenSchematic: React.FC<{ f: number; at: number; until: number; cottonAt: number }> = ({ f, at, until, cottonAt }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const c = pop(f, cottonAt, 8);
  return (
    <div style={{ position: "absolute", top: 200, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(1, k * 1.4) }}>
      <div style={{ width: 920, padding: "22px 28px", borderRadius: 24, background: "rgba(10,14,24,0.88)", border: "4px solid #f5c824", transform: `scale(${0.85 + 0.15 * k})`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
        <div style={{ fontFamily: fonts.hud, fontSize: 32, letterSpacing: 4, color: "#f5c824", marginBottom: 14 }}>IODINE DETECTOR PEN</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.06)", padding: "12px 20px", borderRadius: 14 }}>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, color: "#fff" }}>WOOD PULP → STARCH</span>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: "#ff5c5c", background: "#141210", padding: "6px 18px", borderRadius: 10, border: "3px solid #ff5c5c" }}>BLACK · FAKE</span>
        </div>
        {f >= cottonAt ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.06)", padding: "12px 20px", borderRadius: 14, marginTop: 12, opacity: c }}>
            <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, color: "#fff" }}>COTTON → NO STARCH</span>
            <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: "#1d1a10", background: "#f5d436", padding: "6px 18px", borderRadius: 10 }}>YELLOW · PASS</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

/** UV Blacklight side-by-side comparison pill */
export const UvCompare: React.FC<{ f: number; at: number; blueAt: number; until: number }> = ({ f, at, blueAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const b = pop(f, blueAt, 8);
  return (
    <div style={{ position: "absolute", top: 210, width: "100%", display: "flex", justifyContent: "center", gap: 28 }}>
      <div style={{ width: 420, padding: "18px 24px", borderRadius: 22, background: "rgba(24,6,34,0.9)", border: "4px solid #ff2ea6", boxShadow: "0 0 30px rgba(255,46,166,0.45)", transform: `scale(${k})`, textAlign: "center" }}>
        <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#ffb8e3" }}>REAL $100</div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, color: "#ff2ea6" }}>GLOWS PINK</div>
      </div>
      {f >= blueAt ? (
        <div style={{ width: 440, padding: "18px 24px", borderRadius: 22, background: "rgba(6,18,36,0.9)", border: "4px solid #1ea7ff", boxShadow: "0 0 30px rgba(30,167,255,0.45)", transform: `scale(${b})`, textAlign: "center" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#b5e5ff" }}>BLEACHED $5</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, color: "#1ea7ff" }}>GLOWS BLUE</div>
        </div>
      ) : null}
    </div>
  );
};

/** Photoshop / Copier Counterfeit Block modal + Infinite Money Glitch Patched */
export const PhotoshopPopup: React.FC<{ f: number; at: number; patchAt: number; until: number }> = ({ f, at, patchAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 7);
  const p = pop(f, patchAt, 7);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 200, width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 880, borderRadius: 22, background: "#14161e", border: "5px solid #ff3b30", boxShadow: "0 26px 70px rgba(0,0,0,0.7)", overflow: "hidden", transform: `scale(${0.78 + 0.22 * k})` }}>
          <div style={{ background: "#ff3b30", padding: "12px 26px", fontFamily: fonts.punch, fontWeight: 900, fontSize: 36, color: "#fff" }}>
            ⚠ COUNTERFEIT DETERRENCE SYSTEM
          </div>
          <div style={{ padding: "24px 30px", textAlign: "center" }}>
            <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 50, color: "#fff" }}>CANNOT EDIT BANKNOTES</div>
            <div style={{ fontFamily: fonts.hud, fontSize: 32, letterSpacing: 2, color: "#ffe033", marginTop: 8 }}>EURION DOTS + DIGITAL CDS WATERMARK</div>
          </div>
        </div>
      </div>
      {f >= patchAt ? (
        <div style={{ position: "absolute", top: 1270, width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ transform: `rotate(-4deg) scale(${2 - p})`, opacity: p, border: "10px solid #5dfc8d", color: "#5dfc8d", background: "rgba(6,14,12,0.9)", fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, padding: "12px 32px", borderRadius: 16 }}>
            INFINITE MONEY GLITCH: PATCHED
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Circular brass loupe showing sharp microprinting on the collar + real $100 fact tag */
export const MicroCollarZoom: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 9);
  const sweep = ramp(f, at + 4, at + 36);
  return (
    <div style={{ position: "absolute", top: 190, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: Math.min(1, k * 1.4) }}>
      <div style={{ width: 880, padding: "24px 32px", borderRadius: 28, background: "linear-gradient(180deg, #1b2820 0%, #0d1410 100%)", border: "6px solid #d9aa42", boxShadow: "0 24px 60px rgba(0,0,0,0.65)", transform: `scale(${0.86 + 0.14 * k})`, textAlign: "center" }}>
        <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 4, color: "#d9aa42" }}>COLLAR MICROPRINTING · 20× ZOOM</div>
        <div style={{ marginTop: 12, padding: "16px 14px", borderRadius: 14, background: "#d6dec5", border: "4px solid #244730", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 36, letterSpacing: 1.5, color: "#153620", transform: `scale(${1 + 0.04 * sweep})` }}>
          THE UNITED STATES OF POCKET PUH
        </div>
        <div style={{ marginTop: 12, fontFamily: fonts.hud, fontSize: 30, color: "#cfd8e3" }}>
          REAL $100 COLLAR: &quot;THE UNITED STATES OF AMERICA&quot;
        </div>
      </div>
    </div>
  );
};

/** 1739 Franklin typo comparison: PENNSILVANIA vs PENNSYLVANIA */
export const TypoCard: React.FC<{ f: number; at: number; caughtAt: number; until: number }> = ({ f, at, caughtAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const c = pop(f, caughtAt, 7);
  return (
    <div style={{ position: "absolute", top: 200, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 920, padding: "24px 30px", borderRadius: 22, background: "linear-gradient(180deg, #efe2c4, #dac89e)", border: "5px solid #3a2a16", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", transform: `scale(${0.86 + 0.14 * k})`, fontFamily: "Georgia, serif" }}>
        <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 4, color: "#4a351b", marginBottom: 14 }}>BEN FRANKLIN · 1739 ANTI-FAKE TRAP</div>
        <div style={{ display: "flex", gap: 20 }}>
          <div style={{ flex: 1, padding: "16px 18px", borderRadius: 14, background: "rgba(38, 130, 62, 0.14)", border: "4px solid #217a38", textAlign: "center" }}>
            <div style={{ fontFamily: fonts.hud, fontSize: 30, color: "#1a5c2a" }}>REAL BILL ✓</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: "#17331d", marginTop: 6 }}>
              PENNS<span style={{ color: "#1c9c3d", textDecoration: "underline" }}>I</span>LVANIA
            </div>
          </div>
          <div style={{ flex: 1, padding: "16px 18px", borderRadius: 14, background: "rgba(210, 45, 38, 0.14)", border: "4px solid #c92a22", textAlign: "center", opacity: f >= caughtAt ? c : 0.35 }}>
            <div style={{ fontFamily: fonts.hud, fontSize: 30, color: "#a81e18" }}>FAKER &quot;FIXED&quot; IT ❌</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: "#751410", marginTop: 6 }}>
              PENNS<span style={{ background: "#ff3b30", color: "#fff", padding: "0 8px", borderRadius: 6 }}>Y</span>LVANIA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** 3D Microlens ribbon optical shift diagram */
export const RibbonDiagram: React.FC<{ f: number; at: number; tiltAt: number; until: number }> = ({ f, at, tiltAt, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const t = f >= tiltAt ? Math.sin((f - tiltAt) * 0.25) : 0;
  return (
    <div style={{ position: "absolute", top: 200, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 900, padding: "20px 30px", borderRadius: 24, background: "rgba(8,14,28,0.88)", border: "4px solid #4ca6ff", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", transform: `scale(${0.86 + 0.14 * k})` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#8fd0ff" }}>3D WOVEN MICROLENS RIBBON</div>
            <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff", marginTop: 4 }}>
              HUNDREDS OF THOUSANDS OF LENSES
            </div>
          </div>
          <div style={{ padding: "12px 20px", borderRadius: 14, background: "#14428a", border: "3px solid #8fd0ff", fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, color: "#fff", transform: `translateX(${t * 14}px)` }}>
            🔔 ⇄ 100
          </div>
        </div>
      </div>
    </div>
  );
};

/** 1865 → 1901 Secret Service timeline card */
export const SecretServiceTimeline: React.FC<{ f: number; at: number; lincolnAt: number; guardAt: number; until: number }> = ({
  f,
  at,
  lincolnAt,
  guardAt,
  until,
}) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 8);
  const row = (yr: string, desc: string, col: string, show: boolean, o: number) =>
    show ? (
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12, opacity: o }}>
        <span style={{ minWidth: 185, fontFamily: fonts.punch, fontWeight: 900, fontSize: 38, color: col }}>{yr}</span>
        <span style={{ fontFamily: fonts.hud, fontSize: 34, color: "#fff" }}>{desc}</span>
      </div>
    ) : null;
  return (
    <div style={{ position: "absolute", top: 185, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 920, padding: "22px 30px", borderRadius: 24, background: "rgba(8,12,22,0.9)", border: "4px solid #ffd23f", boxShadow: "0 20px 55px rgba(0,0,0,0.6)", transform: `scale(${0.86 + 0.14 * k})` }}>
        <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 4, color: "#ffd23f" }}>U.S. SECRET SERVICE · TRUE TIMELINE</div>
        {row("1865", "1/3 OF U.S. CASH FAKE → TREASURY POLICE", "#ff6b5e", true, 1)}
        {row("APR 14, 1865", "LINCOLN APPROVED IT THE DAY HE WAS SHOT", "#ffd23f", f >= lincolnAt, fadeIn(f, lincolnAt, 6))}
        {row("1901", "PRESIDENTIAL PROTECTION ADDED (AFTER McKINLEY)", "#70e0ff", f >= guardAt, fadeIn(f, guardAt, 6))}
      </div>
    </div>
  );
};

/** Three snappy stat cards for 11.3¢ · 24 YEARS · 80% ABROAD */
export const StatTriplet: React.FC<{ f: number; costAt: number; lifeAt: number; abroadAt: number; until: number }> = ({
  f,
  costAt,
  lifeAt,
  abroadAt,
  until,
}) => {
  if (f < costAt || f >= until) return null;
  const card = (val: string, sub: string, col: string, start: number) =>
    f >= start ? (
      <div style={{ flex: 1, padding: "18px 14px", borderRadius: 20, background: "rgba(8,14,26,0.88)", border: `4px solid ${col}`, textAlign: "center", transform: `scale(${pop(f, start, 7)})`, boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 54, color: col }}>{val}</div>
        <div style={{ fontFamily: fonts.hud, fontSize: 30, color: "#fff", letterSpacing: 2 }}>{sub}</div>
      </div>
    ) : null;
  return (
    <div style={{ position: "absolute", top: 210, left: 60, right: 60, display: "flex", gap: 18 }}>
      {card("11.3¢", "PRINT COST", "#5dfc8d", costAt)}
      {card("24 YRS", "LIFESPAN", "#ffd23f", lifeAt)}
      {card("~80%", "OUTSIDE U.S.", "#70d6ff", abroadAt)}
    </div>
  );
};
