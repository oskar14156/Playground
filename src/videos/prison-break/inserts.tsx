import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeInOut, easeOut, ramp } from "../../lib/timing";

/** 2D overlays + full-screen inserts for "Prison Break vs a real prison". Plan = amber, reality = blue. */
export const AMBER = "#ffb347";
export const BLUE = "#5cc8ff";
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.25 * Math.sin(k * Math.PI)) : 1;
};
const stroke = (px: number, c = "#000") => ({ WebkitTextStroke: `${px}px ${c}`, paintOrder: "stroke fill" as const });

// ───────────────────────── HUD ─────────────────────────
/** Top-left side chip: THE PLAN (amber, with the show's clock) or REALITY (blue). Series tag top-right. */
export const SideChip: React.FC<{ f: number; side: "plan" | "real"; at: number; clock?: string }> = ({ f, side, at, clock }) => {
  const k = pop(f, at, 7);
  const col = side === "plan" ? AMBER : BLUE;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 120, left: 48, display: "flex", alignItems: "center", gap: 14, padding: "12px 26px 12px 18px", borderRadius: 16, background: "rgba(6,8,14,0.82)", border: `4px solid ${col}`, transform: `scale(${0.8 + 0.2 * k})`, transformOrigin: "left center", boxShadow: `0 0 30px ${col}55` }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: col, boxShadow: `0 0 14px ${col}` }} />
        <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 46, letterSpacing: 4, color: col }}>{side === "plan" ? "THE PLAN" : "REALITY"}</div>
        {side === "plan" && clock ? <div style={{ fontFamily: fonts.hud, fontSize: 40, color: "#fff", opacity: 0.85 }}>· {clock}</div> : null}
      </div>
      <div style={{ position: "absolute", top: 132, right: 44, fontFamily: fonts.hud, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: "#ffffff", opacity: 0.75, padding: "8px 16px", border: "2px solid rgba(255,255,255,0.45)", borderRadius: 10, background: "rgba(0,0,0,0.35)" }}>FICTION vs REALITY #1</div>
    </AbsoluteFill>
  );
};

/** Big rotated stamp ("REAL", "NO EVIDENCE", "CAUGHT"). */
export const Stamp: React.FC<{ f: number; at: number; until?: number; text: string; color?: string; top?: number; size?: number; rot?: number; sub?: string }> = ({ f, at, until, text, color = "#ff3b30", top = 1260, size = 120, rot = -6, sub }) => {
  if (f < at || (until !== undefined && f >= until)) return null;
  const k = pop(f, at, 6);
  const out = until !== undefined ? 1 - ramp(f, until - 5, until, easeInOut) : 1;
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(1, k) * out }}>
      <div style={{ transform: `rotate(${rot}deg) scale(${1.6 - 0.6 * k})`, border: `10px solid ${color}`, borderRadius: 18, padding: "10px 34px", background: "rgba(0,0,0,0.25)", textAlign: "center" }}>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: size, color, lineHeight: 1, letterSpacing: 4 }}>{text}</div>
        {sub ? <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: size * 0.32, color, letterSpacing: 3 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

/** A label pinned to a projected 3D point: dot + line + white card (left or right of the point). */
export const Pin: React.FC<{ x: number; y: number; o: number; text: string; sub?: string; color?: string; side?: "left" | "right" | "center"; size?: number }> = ({ x, y, o, text, sub, color = BLUE, side: want = "right", size = 40 }) => {
  if (o <= 0.01) return null;
  if (want === "center")
    return (
      <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `translate(-50%, -50%) scale(${0.85 + 0.15 * o})`, padding: "10px 24px", borderRadius: 14, background: "#ffffff", border: `5px solid ${color}`, boxShadow: `0 6px 24px rgba(0,0,0,0.4), 0 0 24px ${color}55`, whiteSpace: "nowrap", textAlign: "center" }}>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: size, color: "#111", lineHeight: 1.05 }}>{text}</div>
        {sub ? <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: size * 0.62, color: "#444", letterSpacing: 2 }}>{sub}</div> : null}
      </div>
    );
  const w = Math.max(text.length, (sub ?? "").length * 0.7) * size * 0.62 + 110;
  const side = want === "right" && x + w > 1060 ? "left" : want === "left" && x - w < 20 ? "right" : want;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `translate(${side === "right" ? "0" : "-100%"}, -50%) scale(${0.85 + 0.15 * o})`, transformOrigin: side === "right" ? "left center" : "right center", display: "flex", alignItems: "center", flexDirection: side === "right" ? "row" : "row-reverse", gap: 10 }}>
      <div style={{ width: 18, height: 18, borderRadius: 9, background: color, boxShadow: `0 0 14px ${color}` }} />
      <div style={{ width: 44, height: 4, background: color }} />
      <div style={{ padding: "8px 18px", borderRadius: 12, background: "#ffffff", border: `4px solid ${color}`, boxShadow: "0 6px 20px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: size, color: "#111", lineHeight: 1.05 }}>{text}</div>
        {sub ? <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: size * 0.62, color: "#444", letterSpacing: 2 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

/** Headline across the top third. */
export const Headline: React.FC<{ f: number; at: number; text: string; color?: string; top?: number; size?: number; until?: number }> = ({ f, at, text, color = "#fff", top = 270, size = 84, until }) => {
  if (f < at || (until !== undefined && f >= until)) return null;
  const k = pop(f, at, 8);
  const out = until !== undefined ? 1 - ramp(f, until - 5, until) : 1;
  return (
    <div style={{ position: "absolute", top, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: size, color, ...stroke(Math.round(size / 7)), transform: `scale(${0.7 + 0.3 * k})`, opacity: Math.min(1, k) * out, lineHeight: 1.05, whiteSpace: "pre" }}>
      {text}
    </div>
  );
};

/** The hook title card. */
export const TitleCard: React.FC<{ f: number; out: number }> = ({ f, out }) => {
  const k = pop(f, 4, 10);
  const o = 1 - ramp(f, out - 8, out);
  return (
    <div style={{ position: "absolute", top: 250, width: "100%", textAlign: "center", opacity: o * Math.min(1, k) }}>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 112, lineHeight: 1.0, color: AMBER, ...stroke(14), transform: `scale(${0.7 + 0.3 * k})` }}>PRISON BREAK</div>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 70, color: "#fff", ...stroke(10), marginTop: 6 }}>VS</div>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 112, lineHeight: 1.0, color: BLUE, ...stroke(14) }}>REAL PRISON?</div>
    </div>
  );
};

// ───────────────────────── full-screen inserts ─────────────────────────
const Paper: React.FC<{ children: React.ReactNode; rot?: number; k?: number; w?: number; top?: number; bg?: string }> = ({ children, rot = -1.5, k = 1, w = 900, top = 330, bg = "#f4f1e8" }) => (
  <div style={{ position: "absolute", top, left: (1080 - w) / 2, width: w, padding: "44px 52px", background: bg, boxShadow: "0 30px 90px rgba(0,0,0,0.7)", transform: `rotate(${rot}deg) scale(${0.94 + 0.06 * k})`, opacity: Math.min(1, k * 1.5), color: "#1e1c18" }}>
    {children}
  </div>
);
const desk = "radial-gradient(ellipse at 50% 40%, #2b2a28 0%, #0c0b0a 100%)";

/** The intake photo of the tattoo (callback). `zoom` 0…1 pushes onto the details; `marks` 0…1 circles PIPE/DOOR/CLUE. */
export const IntakePhoto: React.FC<{ f: number; at: number; zoom?: number; marks?: number; title?: string; marksAt?: number[] }> = ({ f, at, zoom = 0, marks = 0, title = "INTAKE · TATTOO RECORD", marksAt = [] }) => {
  const k = fadeIn(f, at, 10);
  const marksData: [number, number, string][] = [
    [300, 520, "PIPE"],
    [610, 430, "DOOR"],
    [470, 700, "CLUE"],
  ];
  return (
    <AbsoluteFill style={{ background: desk }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 + 0.35 * zoom})`, transformOrigin: "50% 45%" }}>
        <Paper k={k} rot={-2} top={300}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.hud, fontSize: 32, letterSpacing: 3 }}>
            <span>{title}</span>
            <span>FILE #94177</span>
          </div>
          <div style={{ position: "relative", marginTop: 20, height: 900, background: "#c9b49a", overflow: "hidden" }}>
            {/* a back with the tattoo, drawn as linework */}
            <svg width={796} height={900} viewBox="0 0 796 900" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <linearGradient id="skin" x1="0" x2="1">
                  <stop offset="0" stopColor="#b98f6c" />
                  <stop offset="0.5" stopColor="#d8b08c" />
                  <stop offset="1" stopColor="#b98f6c" />
                </linearGradient>
              </defs>
              <rect width={796} height={900} fill="#5d6a72" />
              <path d="M 120 900 C 110 600 150 300 250 230 C 320 190 360 170 398 170 C 436 170 476 190 546 230 C 646 300 686 600 676 900 Z" fill="url(#skin)" />
              <ellipse cx={398} cy={110} rx={78} ry={92} fill="#c99d78" />
              {Array.from({ length: 14 }, (_, i) => (
                <path key={i} d={`M ${170 + (i % 4) * 40} ${300 + i * 40} h ${200 + (i * 37) % 160} v ${30 + (i % 3) * 20} h ${120 - (i % 5) * 20}`} stroke="#1a2230" strokeWidth={6} fill="none" opacity={0.85} />
              ))}
              {Array.from({ length: 9 }, (_, i) => (
                <rect key={`r${i}`} x={200 + ((i * 83) % 380)} y={320 + ((i * 131) % 460)} width={60 + (i % 3) * 30} height={40 + (i % 2) * 40} stroke="#1a2230" strokeWidth={4} fill="none" opacity={0.8} />
              ))}
              <path d="M 250 300 C 300 260 360 330 398 290 C 436 330 496 260 546 300" stroke="#1a2230" strokeWidth={10} fill="none" />
              <text x={240} y={860} fontFamily="Georgia" fontWeight={900} fontSize={30} fill="#1a2230">1 1 2 3 5 8 13</text>
            </svg>
            {marksData.map(([x, y, txt], i) => {
              const a = marksAt[i] ?? 0;
              const m = marksAt.length ? fadeIn(f, a, 8) : marks;
              return m > 0.01 ? (
                <div key={txt} style={{ position: "absolute", left: x - 90, top: y - 60, width: 180, height: 120, border: `8px solid #ff3b30`, borderRadius: "50%", opacity: m, transform: `scale(${0.6 + 0.4 * m})` }}>
                  <div style={{ position: "absolute", top: -64, left: 0, width: 180, textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 48, color: "#ff3b30", ...stroke(6, "#fff") }}>{txt}</div>
                </div>
              ) : null;
            })}
          </div>
          <div style={{ marginTop: 18, fontFamily: fonts.hud, fontSize: 30, letterSpacing: 2, display: "flex", justifyContent: "space-between" }}>
            <span>MARKS · SCARS · TATTOOS</span>
            <span>DAY 1</span>
          </div>
        </Paper>
      </div>
    </AbsoluteFill>
  );
};

/** Bank robbery = federal crime → federal prison, not Fox River. */
export const FederalCard: React.FC<{ f: number; at: number; prison: number }> = ({ f, at, prison }) => {
  const k = fadeIn(f, at, 10);
  const p = fadeIn(f, prison, 10);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #142238 0%, #04070d 100%)" }}>
      <Paper k={k} top={330} rot={1}>
        <div style={{ fontFamily: fonts.hud, fontSize: 34, letterSpacing: 4, color: "#555" }}>UNITED STATES CODE · TITLE 18</div>
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 84, marginTop: 10 }}>§ 2113</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 50, marginTop: 6 }}>Bank robbery</div>
        <div style={{ marginTop: 26, display: "inline-block", padding: "10px 24px", background: "#0e2a4a", color: "#fff", fontFamily: fonts.punch, fontWeight: 900, fontSize: 52 }}>FEDERAL CRIME</div>
      </Paper>
      <div style={{ position: "absolute", top: 1180, width: "100%", display: "flex", justifyContent: "center", gap: 40, opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>
        <div style={{ padding: "22px 30px", borderRadius: 18, background: "#0e2a4a", border: `5px solid ${BLUE}`, color: "#fff", fontFamily: fonts.punch, fontWeight: 900, fontSize: 50, textAlign: "center" }}>
          FEDERAL
          <br />
          PRISON ✓
        </div>
        <div style={{ position: "relative", padding: "22px 30px", borderRadius: 18, background: "#2a1a10", border: `5px solid ${AMBER}`, color: "#fff", fontFamily: fonts.punch, fontWeight: 900, fontSize: 50, textAlign: "center", opacity: 0.85 }}>
          FOX RIVER
          <br />
          (STATE)
          <div style={{ position: "absolute", left: -10, right: -10, top: "50%", height: 10, background: "#ff3b30", transform: "rotate(-12deg)" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Illinois classification: points → the state picks the prison. */
export const ClassForm: React.FC<{ f: number; at: number; points: number }> = ({ f, at, points }) => {
  const k = fadeIn(f, at, 10);
  const rows: [string, number][] = [
    ["Offense severity", 7],
    ["Sentence length", 4],
    ["Prior record", 2],
    ["Escape history", 0],
    ["Age · conduct", 3],
  ];
  return (
    <AbsoluteFill style={{ background: desk }}>
      <Paper k={k} top={230} rot={-1}>
        <div style={{ fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#555" }}>ILLINOIS DEPT. OF CORRECTIONS</div>
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 50, marginTop: 6 }}>Reception & Classification</div>
        {rows.map(([name, v], i) => {
          const on = f >= points + i * 6;
          return (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.hud, fontSize: 40, marginTop: 10, borderBottom: "2px dashed #b8b0a0", paddingBottom: 4 }}>
              <span>{name}</span>
              <span style={{ fontWeight: 700, color: on ? "#0e2a4a" : "#bbb" }}>{on ? `+${v}` : "_"}</span>
            </div>
          );
        })}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontFamily: fonts.punch, fontWeight: 900, fontSize: 50 }}>
          <span>SCORE</span>
          <span>{f >= points + 30 ? 16 : "…"}</span>
        </div>
        <div style={{ marginTop: 10, fontFamily: fonts.hud, fontSize: 38 }}>
          Inmate's preference: <span style={{ color: "#c0202a", fontWeight: 700 }}>NOT A FACTOR</span>
        </div>
      </Paper>
      <div style={{ position: "absolute", bottom: 110, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#b8b0a0" }}>ILLUSTRATIVE SCORE · REAL PROCESS: NRC STATEVILLE</div>
    </AbsoluteFill>
  );
};

/** PUGNAc in the lab: a fat cell with insulin bouncing off its receptors (Vosseller et al., PNAS 2002). */
export const FatCell: React.FC<{ f: number; at: number; fat: number }> = ({ f, at, fat }) => {
  const k = fadeIn(f, at, 10);
  const bounce = ramp(f, fat, fat + 24, easeOut);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #2a1a2e 0%, #07050a 100%)", opacity: k }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="fat" cx="0.45" cy="0.4">
            <stop offset="0" stopColor="#ffe7a8" />
            <stop offset="0.7" stopColor="#f2c66a" />
            <stop offset="1" stopColor="#c48a32" />
          </radialGradient>
        </defs>
        <circle cx={540} cy={900} r={300} fill="url(#fat)" stroke="#7a4a1a" strokeWidth={10} />
        <circle cx={460} cy={820} r={60} fill="#b07a3a" opacity={0.55} />
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return <rect key={i} x={540 + Math.cos(a) * 300 - 14} y={900 + Math.sin(a) * 300 - 14} width={28} height={28} fill="#4ab0d8" transform={`rotate(${(a * 180) / Math.PI} ${540 + Math.cos(a) * 300} ${900 + Math.sin(a) * 300})`} />;
        })}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2 + 0.3;
          const d = 470 - 140 * Math.sin(Math.min(1, bounce * 2) * Math.PI * 0.5) + 160 * Math.max(0, bounce * 2 - 1);
          return (
            <g key={i} transform={`translate(${540 + Math.cos(a) * d} ${900 + Math.sin(a) * d})`}>
              <circle r={26} fill="#7dff8a" stroke="#1a4a1a" strokeWidth={5} />
              <text y={10} textAnchor="middle" fontFamily="Arial" fontWeight={900} fontSize={26} fill="#1a4a1a">
                I
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 76, color: "#fff", ...stroke(9) }}>PUGNAc · LAB COMPOUND</div>
      <div style={{ position: "absolute", top: 1300, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 70, color: "#7dff8a", ...stroke(9), opacity: fadeIn(f, fat + 10) }}>FAT CELL IGNORES INSULIN</div>
      <div style={{ position: "absolute", bottom: 110, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#c8b8d8" }}>VOSSELLER ET AL., PNAS 2002</div>
    </AbsoluteFill>
  );
};

/** Type 1 vs type 2 lab card: antibody test comes back negative. */
export const TestCard: React.FC<{ f: number; at: number; blood: number; clean: number }> = ({ f, at, blood, clean }) => {
  const k = fadeIn(f, at, 10);
  const col = (on: boolean) => (on ? "#0e2a4a" : "#999");
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #12263a 0%, #04070d 100%)" }}>
      <div style={{ position: "absolute", top: 300, width: "100%", display: "flex", justifyContent: "center", gap: 30, opacity: k }}>
        {[
          ["TYPE 1", "body attacks its insulin cells", "what he claims", AMBER],
          ["TYPE 2", "cells ignore insulin", "what PUGNAc mimics", BLUE],
        ].map(([t, d, s, c]) => (
          <div key={t} style={{ width: 460, padding: "26px 26px", borderRadius: 22, background: "#f4f1e8", border: `8px solid ${c}`, textAlign: "center" }}>
            <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 76 }}>{t}</div>
            <div style={{ fontFamily: fonts.hud, fontSize: 40, marginTop: 6 }}>{d}</div>
            <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 34, marginTop: 14, color: "#555" }}>{s}</div>
          </div>
        ))}
      </div>
      <Paper k={fadeIn(f, blood, 10)} top={1140} rot={1} w={860}>
        <div style={{ fontFamily: fonts.hud, fontSize: 32, letterSpacing: 3, color: "#555" }}>LAB REPORT · TYPE 1 AUTOANTIBODIES</div>
        {["GAD", "IA-2", "ZnT8"].map((n, i) => {
          const on = f >= clean + i * 5;
          return (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.hud, fontSize: 52, marginTop: 14 }}>
              <span>{n}</span>
              <span style={{ fontWeight: 700, color: col(on) }}>{on ? "NEGATIVE" : "…"}</span>
            </div>
          );
        })}
      </Paper>
    </AbsoluteFill>
  );
};

/** Count clock: the BOP handbook's night counts at midnight, 3 and 5 AM. */
export const CountClock: React.FC<{ f: number; at: number; marks: number }> = ({ f, at, marks }) => {
  const k = fadeIn(f, at, 10);
  const hand = ramp(f, marks, marks + 60, easeInOut) * 5; // hours from midnight → 5 AM
  const counts = [0, 3, 5];
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, #0f1a2e 0%, #020409 100%)", opacity: k }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <circle cx={540} cy={850} r={330} fill="#f4f1e8" stroke="#1a1a1a" strokeWidth={18} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          return <rect key={i} x={540 + Math.cos(a) * 285 - 6} y={850 + Math.sin(a) * 285 - 22} width={12} height={44} fill="#1a1a1a" transform={`rotate(${(i / 12) * 360} ${540 + Math.cos(a) * 285} ${850 + Math.sin(a) * 285})`} />;
        })}
        {counts.map((h, i) => {
          const a = (h / 12) * Math.PI * 2 - Math.PI / 2;
          const on = hand >= h - 0.05;
          return (
            <g key={h}>
              <circle cx={540 + Math.cos(a) * 220} cy={850 + Math.sin(a) * 220} r={46} fill={on ? BLUE : "#d8d4c8"} opacity={on ? 1 : 0.6} />
              <text x={540 + Math.cos(a) * 220} y={850 + Math.sin(a) * 220 + 14} textAnchor="middle" fontFamily="Arial" fontWeight={900} fontSize={38} fill="#111">
                {h === 0 ? 12 : h}
              </text>
              {on && i < 3 ? (
                <text x={540 + Math.cos(a) * 420} y={850 + Math.sin(a) * 420 + 16} textAnchor="middle" fontFamily="Arial" fontWeight={900} fontSize={44} fill={BLUE}>
                  COUNT
                </text>
              ) : null}
            </g>
          );
        })}
        <line x1={540} y1={850} x2={540 + Math.cos((hand / 12) * Math.PI * 2 - Math.PI / 2) * 180} y2={850 + Math.sin((hand / 12) * Math.PI * 2 - Math.PI / 2) * 180} stroke="#1a1a1a" strokeWidth={18} strokeLinecap="round" />
        <line x1={540} y1={850} x2={540} y2={600} stroke="#c0202a" strokeWidth={8} strokeLinecap="round" transform={`rotate(${hand * 360} 540 850)`} />
        <circle cx={540} cy={850} r={20} fill="#1a1a1a" />
      </svg>
      <div style={{ position: "absolute", top: 1290, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, color: "#fff", ...stroke(8) }}>12 AM · 3 AM · 5 AM</div>
      <div style={{ position: "absolute", bottom: 110, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#a8b8d8" }}>FEDERAL BUREAU OF PRISONS · INMATE HANDBOOK</div>
    </AbsoluteFill>
  );
};

/** 610 escapes → 91 % caught within a year (Peterson, Security Journal 2024). */
export const Recapture: React.FC<{ f: number; at: number; pct: number }> = ({ f, at, pct }) => {
  const k = fadeIn(f, at, 10);
  const v = 91 * ramp(f, pct, pct + 26, easeOut);
  const dots = 100;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #1a1414 0%, #050303 100%)", opacity: k }}>
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 72, color: "#fff", ...stroke(8) }}>610 ESCAPES</div>
      <div style={{ position: "absolute", top: 450, left: 120, width: 840, display: "flex", flexWrap: "wrap", gap: 14 }}>
        {Array.from({ length: dots }, (_, i) => (
          <div key={i} style={{ width: 70, height: 70, borderRadius: 35, background: i < v ? "#ff3b30" : "#3a3a3a", boxShadow: i < v ? "0 0 14px #ff3b30aa" : "none", transform: `scale(${i < v ? 1 : 0.85})` }} />
        ))}
      </div>
      <div style={{ position: "absolute", top: 1320, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 150, color: "#ff3b30", ...stroke(14), fontVariantNumeric: "tabular-nums" }}>{Math.round(v)}%</div>
      <div style={{ position: "absolute", top: 1500, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 58, color: "#fff", ...stroke(8) }}>CAUGHT WITHIN A YEAR</div>
      <div style={{ position: "absolute", bottom: 110, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 30, letterSpacing: 3, color: "#c8b0b0" }}>PETERSON · SECURITY JOURNAL · 2024</div>
    </AbsoluteFill>
  );
};

/** Clinton 2015 ending: 22 days, then two cards. */
export const ClintonEnd: React.FC<{ f: number; at: number; shot: number; other: number }> = ({ f, at, shot, other }) => {
  const k = fadeIn(f, at, 8);
  const d = Math.min(22, Math.round(22 * ramp(f, at + 4, at + 40, easeOut)));
  const card = (a: number, name: string, line: string, rot: number) => (
    <div style={{ width: 430, padding: "24px 20px", borderRadius: 18, background: "#f4f1e8", border: "8px solid #1a1a1a", textAlign: "center", transform: `rotate(${rot}deg) scale(${0.6 + 0.4 * pop(f, a, 8)})`, opacity: fadeIn(f, a, 6) }}>
      <div style={{ fontFamily: fonts.hud, fontSize: 36, letterSpacing: 3 }}>{name}</div>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 58, color: "#c0202a", marginTop: 6 }}>{line}</div>
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 35%, #182a18 0%, #040704 100%)", opacity: k }}>
      <div style={{ position: "absolute", top: 320, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 42, letterSpacing: 4, color: "#c8d8c8" }}>CLINTON · NEW YORK · 2015</div>
      <div style={{ position: "absolute", top: 380, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 240, color: "#fff", ...stroke(18), fontVariantNumeric: "tabular-nums" }}>{d}</div>
      <div style={{ position: "absolute", top: 650, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 80, color: "#fff", ...stroke(10) }}>DAYS ON THE RUN</div>
      <div style={{ position: "absolute", top: 1180, width: "100%", display: "flex", justifyContent: "center", gap: 36 }}>
        {card(shot, "MAN 1", "SHOT DEAD", -3)}
        {card(other, "MAN 2", "SHOT · CAUGHT", 3)}
      </div>
    </AbsoluteFill>
  );
};

/** Show vs reality time bar: one night on TV vs 4+ weeks of hacksaw work. */
export const TimeBars: React.FC<{ f: number; at: number; top?: number }> = ({ f, at, top = 1240 }) => {
  const k = fadeIn(f, at, 8);
  const grow = ramp(f, at + 8, at + 40, easeOut);
  return (
    <div style={{ position: "absolute", top, left: 80, width: 920, opacity: k }}>
      {[
        ["ON TV", 0.04, AMBER, "ONE NIGHT"],
        ["REAL (2015)", 1, BLUE, "4+ WEEKS OF CUTTING"],
      ].map(([l, w, col, txt]) => (
        <div key={l as string} style={{ marginTop: 20 }}>
          <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 36, color: col as string, letterSpacing: 3 }}>{l as string}</div>
          <div style={{ height: 62, borderRadius: 12, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.max(3, (w as number) * grow * 100)}%`, background: col as string, display: "flex", alignItems: "center", paddingLeft: 16, fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, color: "#111", whiteSpace: "nowrap" }}>{(w as number) > 0.5 ? (txt as string) : ""}</div>
          </div>
          {(w as number) < 0.5 ? <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 34, color: "#fff", marginTop: 4 }}>{txt as string}</div> : null}
        </div>
      ))}
    </div>
  );
};
