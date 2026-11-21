import React from "react";
import { Img, staticFile } from "remotion";
import { fonts } from "../../lib/theme";
import { easeOut, ramp, seeded } from "../../lib/timing";

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
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
export const PHOTO = "internet/photo.jpg";

/** a little pigeon silhouette (side view, facing right) */
const PigeonIcon: React.FC<{ size: number; color?: string; flap?: number }> = ({ size, color = "#c9d2de", flap = 0 }) => (
  <svg width={size} height={size * 0.75} viewBox="0 0 80 60">
    <path d="M 8 38 Q 4 30 16 30 L 30 30 Q 40 18 54 20 Q 62 14 68 20 L 76 22 L 68 26 Q 66 40 50 44 L 22 46 Z" fill={color} />
    <path d={flap > 0.5 ? "M 34 30 Q 30 6 44 2 Q 46 18 48 28 Z" : "M 26 32 Q 40 26 56 32 Q 44 40 26 38 Z"} fill="#6d7686" />
    <circle cx={64} cy={22} r={2.2} fill="#e2722c" />
    <path d="M 40 46 L 38 56 M 46 46 L 46 56" stroke="#c9636a" strokeWidth={2.5} />
  </svg>
);

// ───────────────────────── grandma's chat on a phone ─────────────────────────
export type ChatMsg = { at: number; from: "her" | "me"; text?: string; photo?: string };
export const ChatPhone: React.FC<{ f: number; at: number; until: number; msgs: ChatMsg[]; title?: string; left?: number; top?: number; tilt?: number }> = ({
  f,
  at,
  until,
  msgs,
  title = "GRANDMA 🇦🇺",
  left = 300,
  top = 1080,
  tilt = 4,
}) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 10);
  const out = ramp(f, until - 8, until, easeOut);
  const shown = msgs.filter((m) => f >= m.at);
  return (
    <div style={{ position: "absolute", left, top, width: 480, height: 760, opacity: Math.min(1, k * 1.4) * (1 - out), transform: `translateY(${(1 - k) * 200 + out * 120}px) rotate(${tilt}deg)`, borderRadius: 54, background: "#0d1119", border: "10px solid #2a2f38", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", overflow: "hidden", fontFamily: fonts.hud, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "26px 28px 14px", color: "#a9b8c9", fontSize: 26, letterSpacing: 2, borderBottom: "2px solid #1c2636" }}>{title}</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 22px 26px", gap: 14 }}>
        {shown.map((m, i) => {
          const o = pop(f, m.at, 8);
          const me = m.from === "me";
          return (
            <div key={i} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: 360, opacity: Math.min(1, o * 1.4), transform: `scale(${0.8 + 0.2 * o})`, transformOrigin: me ? "right bottom" : "left bottom" }}>
              {m.photo ? (
                <div style={{ borderRadius: 22, overflow: "hidden", border: `6px solid ${me ? "#3a7bd5" : "#2a3446"}`, width: 300, height: 380 }}>
                  <Img src={staticFile(m.photo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ) : (
                <div style={{ padding: "16px 24px", borderRadius: 28, background: me ? "#3a7bd5" : "#2a3446", color: "#fff", fontSize: 42, lineHeight: 1.2 }}>{m.text}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ───────────────────────── RFC 1149 ─────────────────────────
export const RfcCard: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 10);
  const out = fadeIn(f, until - 8);
  return (
    <div style={{ position: "absolute", left: 110, top: 1180, width: 860, padding: "30px 40px", opacity: Math.min(1, k * 1.4) * (1 - out), transform: `scale(${0.92 + 0.08 * k}) rotate(-2deg)`, background: "#fbfbf7", border: "3px solid #9aa0a6", borderRadius: 10, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", fontFamily: "Courier New, monospace", color: "#1a1a1a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#555" }}>
        <span>Network Working Group</span>
        <span>1 April 1990</span>
      </div>
      <div style={{ fontSize: 30, color: "#555", marginTop: 4 }}>Request for Comments: 1149</div>
      <div style={{ fontSize: 46, fontWeight: 700, marginTop: 22, lineHeight: 1.2, textAlign: "center" }}>
        IP Datagrams on
        <br />
        <span style={{ background: "#ffe066", padding: "0 10px" }}>Avian Carriers</span>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
        <PigeonIcon size={120} color="#8c95a6" />
      </div>
    </div>
  );
};

// ───────────────────────── Bergen 2001: 9 packets, 5 lost ─────────────────────────
export const PacketLoss: React.FC<{ f: number; at: number; lost: number; until: number }> = ({ f, at, lost, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 10);
  const out = fadeIn(f, until - 8);
  const LOST = [1, 3, 4, 6, 8];
  return (
    <div style={{ position: "absolute", left: 90, top: 1150, width: 900, padding: "26px 34px", opacity: Math.min(1, k * 1.4) * (1 - out), transform: `scale(${0.92 + 0.08 * k})`, ...card }}>
      <div style={{ fontSize: 32, letterSpacing: 4, color: "#a9b8c9" }}>BERGEN, NORWAY · 2001</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", marginTop: 18, height: 90 }}>
        {Array.from({ length: 9 }, (_, i) => {
          const sent = fadeIn(f, at + 6 + i * 3, 4);
          const gone = LOST.includes(i) ? ramp(f, lost + i * 2, lost + i * 2 + 18, easeOut) : 0;
          return (
            <div key={i} style={{ opacity: sent * (1 - 0.75 * gone), transform: `translate(${gone * (i % 2 ? 60 : -40)}px, ${-gone * 70}px) rotate(${gone * (i % 2 ? 30 : -25)}deg)`, filter: gone > 0.5 ? "grayscale(1)" : undefined }}>
              <PigeonIcon size={88} flap={gone > 0 ? (Math.floor(f / 3) % 2) : 0} color={gone > 0.5 ? "#6a7280" : "#c9d2de"} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, alignItems: "baseline" }}>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 52 }}>9 SENT</span>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, color: "#ff6b5e", opacity: fadeIn(f, lost) }}>5 LOST</span>
      </div>
      <div style={{ fontSize: 36, letterSpacing: 3, color: "#ffd23f", marginTop: 8, opacity: fadeIn(f, lost + 14) }}>PACKET LOSS: 55 %</div>
    </div>
  );
};

// ───────────────────────── Winston vs ADSL (2009) ─────────────────────────
export const PigeonRace: React.FC<{ f: number; at: number; beat: number; until: number }> = ({ f, at, beat, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 10);
  const out = fadeIn(f, until - 8);
  const run = ramp(f, at + 8, beat + 20, (x) => x);
  const bird = Math.min(1, run * 1.05);
  const adsl = Math.min(0.04, run * 0.04);
  const lane = (label: string, sub: string, v: number, color: string, icon: React.ReactNode) => (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32, letterSpacing: 3 }}>
        <span style={{ color }}>{label}</span>
        <span style={{ color: "#a9b8c9" }}>{sub}</span>
      </div>
      <div style={{ position: "relative", height: 70, marginTop: 8, borderRadius: 14, background: "rgba(255,255,255,0.08)", overflow: "visible" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v * 100}%`, borderRadius: 14, background: color }} />
        <div style={{ position: "absolute", left: `calc(${v * 100}% - 40px)`, top: -6 }}>{icon}</div>
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 90, top: 1160, width: 900, padding: "24px 34px 30px", opacity: Math.min(1, k * 1.4) * (1 - out), transform: `scale(${0.92 + 0.08 * k})`, ...card }}>
      <div style={{ fontSize: 30, letterSpacing: 4, color: "#a9b8c9" }}>SOUTH AFRICA · 2009 · 4 GB · 80 KM · 50 MI</div>
      {lane("WINSTON 🐦", bird >= 1 ? "DONE · 2 H 7 MIN" : `${Math.round(bird * 100)} %`, bird, "#3fd06a", <PigeonIcon size={80} flap={Math.floor(f / 3) % 2} />)}
      {lane("ADSL LINE", `${Math.round(adsl * 100)} %`, adsl, "#ff6b5e", <span style={{ fontSize: 46 }}>⏳</span>)}
    </div>
  );
};

// ───────────────────────── 1858: the first Atlantic cable ─────────────────────────
export const Cable1858: React.FC<{ f: number; at: number; queen: number; hours: number; weeks: number; until: number }> = ({ f, at, queen, hours, weeks, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 10);
  const out = fadeIn(f, until - 8);
  const draw = ramp(f, at + 4, at + 34, easeOut);
  const wordsN = Math.round(98 * ramp(f, queen, hours + 10, (x) => x));
  const h = 16 * ramp(f, hours - 6, hours + 20, easeOut);
  const dead = ramp(f, weeks + 6, weeks + 30, (x) => x);
  const spark = dead > 0 && dead < 1;
  const r = seeded(Math.floor(f / 2));
  const path = "M 645 160 C 500 110, 300 110, 128 140";
  return (
    <div style={{ position: "absolute", left: 80, top: 1130, width: 920, padding: "22px 30px", opacity: Math.min(1, k * 1.4) * (1 - out), transform: `scale(${0.92 + 0.08 * k})`, background: "#efe2c4", border: "5px solid #7a5a32", borderRadius: 12, boxShadow: "0 30px 80px rgba(0,0,0,0.55)", fontFamily: "Georgia, serif", color: "#3a2a16" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32 }}>
        <span>ATLANTIC TELEGRAPH · 1858</span>
        <span>IRELAND → NEWFOUNDLAND</span>
      </div>
      <svg width={860} height={250} viewBox="0 0 860 250" style={{ marginTop: 10 }}>
        <rect width={860} height={250} fill="#d9c8a0" rx={10} />
        {/* coasts */}
        <path d="M 0 60 Q 80 40 130 90 Q 150 140 120 200 L 0 250 Z" fill="#b39a6a" />
        <path d="M 640 150 Q 700 120 760 130 Q 820 100 860 120 L 860 250 L 620 250 Q 610 200 640 150 Z" fill="#b39a6a" />
        <text x={40} y={150} fontSize={26} fill="#5a4220">N. AMERICA</text>
        <text x={690} y={210} fontSize={26} fill="#5a4220">EUROPE</text>
        <path d={path} stroke={dead > 0.3 ? "#b82a10" : "#2a1a0a"} strokeWidth={dead > 0.3 ? 7 : 5} fill="none" strokeDasharray="1000" strokeDashoffset={1000 * (1 - draw)} />
        {spark
          ? Array.from({ length: 10 }, (_, i) => {
              const x = 180 + r() * 440;
              const y = 130 + r() * 40;
              return <circle key={i} cx={x} cy={y} r={4 + r() * 6} fill={i % 2 ? "#ffd23f" : "#ff6a10"} />;
            })
          : null}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 40, fontWeight: 700 }}>
        <span style={{ opacity: fadeIn(f, queen) }}>THE QUEEN: {wordsN} WORDS</span>
        <span style={{ opacity: fadeIn(f, hours - 6) }}>⏱ {Math.round(h)} H</span>
      </div>
    </div>
  );
};

// ───────────────────────── light vs plane ─────────────────────────
export const SpeedRace: React.FC<{ f: number; at: number; plane: number; until: number }> = ({ f, at, plane, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 10);
  const out = fadeIn(f, until - 8);
  const light = ramp(f, at + 6, at + 9, (x) => x);
  const pl = ramp(f, plane, until, (x) => x) * 0.06;
  const row = (label: string, v: number, color: string, right: string, icon: string) => (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32, letterSpacing: 3 }}>
        <span style={{ color }}>{label}</span>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 44, color: "#fff" }}>{right}</span>
      </div>
      <div style={{ position: "relative", height: 56, marginTop: 6, borderRadius: 12, background: "rgba(255,255,255,0.08)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${v * 100}%`, borderRadius: 12, background: color, boxShadow: `0 0 24px ${color}` }} />
        <div style={{ position: "absolute", left: `calc(${v * 100}% - 30px)`, top: -2, fontSize: 44 }}>{icon}</div>
      </div>
    </div>
  );
  return (
    <div style={{ position: "absolute", left: 90, top: 1200, width: 900, padding: "22px 34px 30px", opacity: Math.min(1, k * 1.4) * (1 - out), transform: `scale(${0.92 + 0.08 * k})`, ...card }}>
      <div style={{ fontSize: 30, letterSpacing: 4, color: "#a9b8c9" }}>LONDON → SYDNEY · 17,000 KM · 10,600 MI</div>
      {row("LIGHT IN GLASS", light, "#7ff6ff", light >= 1 ? "0.08 S" : "…", "✨")}
      {f >= plane ? row("THE PLANE (EP. 8)", pl, "#ffd23f", "20 H", "✈️") : null}
    </div>
  );
};

// ───────────────────────── the photo → 2,000 packets ─────────────────────────
const COLS = 8;
const ROWS = 10;
/** the photo card breaks into tiles ("packets"), each stamped with grandma's address, and flies off to the right */
export const PhotoPackets: React.FC<{ f: number; at: number; split: number; address: number; until: number }> = ({ f, at, split, address, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 10);
  const W = 560;
  const H = 700;
  const tw = W / COLS;
  const th = H / ROWS;
  const r = seeded(4);
  const tiles = Array.from({ length: COLS * ROWS }, (_, i) => ({ i, c: i % COLS, row: Math.floor(i / COLS), d: r() * 24, dy: (r() - 0.5) * 900 }));
  const n = Math.round(2000 * ramp(f, split, split + 30, (x) => x));
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: Math.min(1, k * 1.4) }}>
      {tiles.map((q) => {
        const go = ramp(f, split + q.d, split + q.d + 26, easeOut);
        const fly = ramp(f, until - 40 + q.d * 0.6, until - 6 + q.d * 0.6, (x) => x * x);
        const x = 260 + q.c * tw + go * ((q.c - COLS / 2) * 30) + fly * 1100;
        const y = 160 + q.row * th + go * ((q.row - ROWS / 2) * 22) + fly * q.dy * 0.3;
        const gap = go * 10;
        return (
          <div key={q.i} style={{ position: "absolute", left: x + gap / 2, top: y + gap / 2, width: tw - gap, height: th - gap, overflow: "hidden", borderRadius: go * 8, boxShadow: go > 0 ? `0 0 ${18 * go}px rgba(127,246,255,${0.8 * go})` : undefined, border: go > 0.3 ? "2px solid rgba(127,246,255,0.9)" : undefined }}>
            <Img src={staticFile(PHOTO)} style={{ position: "absolute", left: -q.c * tw, top: -q.row * th, width: W, height: H, objectFit: "cover" }} />
            {f >= address ? (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(10,16,28,0.8)", color: "#ffd23f", fontFamily: fonts.hud, fontSize: 13, textAlign: "center", opacity: fadeIn(f, address + q.d * 0.5, 6) }}>TO: GRANDMA</div>
            ) : null}
          </div>
        );
      })}
      {f >= split ? (
        <div style={{ position: "absolute", top: 1180, width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, padding: "12px 32px", borderRadius: 22, background: "rgba(6,10,22,0.85)", border: "3px solid rgba(127,246,255,0.7)" }}>
            <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 70, color: "#fff", fontVariantNumeric: "tabular-nums" }}>{fmt(n)}</span>
            <span style={{ fontFamily: fonts.hud, fontSize: 34, letterSpacing: 4, color: "#7ff6ff" }}>PACKETS</span>
          </div>
        </div>
      ) : null}
      {f >= address ? (
        <div style={{ position: "absolute", top: 1330, width: "100%", textAlign: "center", fontFamily: fonts.hud, fontSize: 40, letterSpacing: 3, color: "#ffd23f", opacity: fadeIn(f, address) }}>EACH ONE: “TO GRANDMA, SYDNEY”</div>
      ) : null}
    </div>
  );
};

/** the tiles flying back together into grandma's phone screen (screen rect in px) */
export const PacketsArrive: React.FC<{ f: number; at: number; done: number; rect: [number, number, number, number] }> = ({ f, at, done, rect }) => {
  if (f < at || f >= done + 10) return null;
  const [L, T, W, H] = rect;
  const tw = W / COLS;
  const th = H / ROWS;
  const r = seeded(7);
  const out = fadeIn(f, done, 8);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, opacity: 1 - out }}>
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const c = i % COLS;
        const row = Math.floor(i / COLS);
        const d = r() * 20;
        const k = ramp(f, at + d, at + d + 22, easeOut);
        const sx = -200 - r() * 400;
        const sy = r() * 1920;
        const x = sx + (L + c * tw - sx) * k;
        const y = sy + (T + row * th - sy) * k;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: tw, height: th, overflow: "hidden", boxShadow: k < 1 ? "0 0 16px rgba(127,246,255,0.9)" : undefined }}>
            <Img src={staticFile(PHOTO)} style={{ position: "absolute", left: -c * tw, top: -row * th, width: W, height: H, objectFit: "cover" }} />
          </div>
        );
      })}
    </div>
  );
};

/** deep-sea cable vs garden hose, true size side by side */
export const HoseCompare: React.FC<{ f: number; at: number; until: number }> = ({ f, at, until }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 10);
  const out = fadeIn(f, until - 8);
  return (
    <div style={{ position: "absolute", left: 160, top: 1190, width: 760, padding: "24px 34px", opacity: Math.min(1, k * 1.4) * (1 - out), transform: `scale(${0.92 + 0.08 * k})`, ...card }}>
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
        {[
          ["DEEP-SEA CABLE", "#ffd23f"],
          ["GARDEN HOSE", "#3fae4a"],
        ].map(([label, color]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <svg width={170} height={170} viewBox="0 0 170 170">
              <circle cx={85} cy={85} r={78} fill={color} />
              <circle cx={85} cy={85} r={label === "GARDEN HOSE" ? 52 : 30} fill={label === "GARDEN HOSE" ? "#0b1220" : "#c9ced6"} />
              {label === "DEEP-SEA CABLE" ? <circle cx={85} cy={85} r={12} fill="#7ff6ff" /> : null}
            </svg>
            <span style={{ fontSize: 30, letterSpacing: 3 }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 56, marginTop: 10 }}>≈ 17 MM · 0.7 IN</div>
    </div>
  );
};

/** "USED: 2 → 3" — grandma's tally from ep. 8 */
export const UsedCounter: React.FC<{ f: number; at: number; top?: number }> = ({ f, at, top = 1430 }) => {
  if (f < at) return null;
  const k = pop(f, at, 10);
  const flip = f >= at + 10;
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: Math.min(1, k * 1.4) }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, padding: "14px 40px", borderRadius: 24, background: "rgba(6,10,22,0.85)", border: "4px solid #ff6aa8", transform: `scale(${0.9 + 0.1 * k})` }}>
        <span style={{ fontFamily: fonts.hud, fontSize: 40, letterSpacing: 4, color: "#ff6aa8" }}>TIMES USED</span>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 90, color: "#fff", textDecoration: flip ? "line-through" : undefined, opacity: flip ? 0.45 : 1 }}>2</span>
        {flip ? <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 110, color: "#ffd23f", transform: `scale(${pop(f, at + 10, 8)})` }}>3</span> : null}
      </div>
    </div>
  );
};
