import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeOut, ramp } from "../../lib/timing";
import { FoxIcon } from "../../lib/Follow";

export { Stamp, CounterPill } from "../pyramid/inserts";
export { Clipping } from "../white-house/inserts";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.25 * Math.sin(k * Math.PI)) : 1;
};

/** Small year tag with an icon line, e.g. "1956 · A ROCK". */
export const YearTag: React.FC<{ f: number; at: number; until: number; year: string; what: string; top?: number; color?: string }> = ({ f, at, until, year, what, top = 300, color = "#ffd23f" }) => {
  if (f < at || f >= until) return null;
  const k = pop(f, at, 7);
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${k})`, display: "flex", alignItems: "center", gap: 18, padding: "12px 30px", borderRadius: 20, background: "rgba(8,10,18,0.82)", border: `4px solid ${color}` }}>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 70, color }}>{year}</span>
        <span style={{ fontFamily: fonts.hud, fontSize: 44, letterSpacing: 3, color: "#fff" }}>{what}</span>
      </div>
    </div>
  );
};

/** Police suspect file, 1911: a faceless silhouette, the name, a "SUS" stamp. */
export const SuspectCard: React.FC<{ f: number; at: number; stamp: number }> = ({ f, at, stamp }) => {
  const k = pop(f, at, 10);
  const s = pop(f, stamp, 6);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #3a3226 0%, #0e0c08 100%)", alignItems: "center", paddingTop: 230 }}>
      <div style={{ width: 820, padding: "40px 50px 50px", background: "linear-gradient(180deg,#efe4c8,#ddd0b0)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: `translateY(${(1 - k) * 500}px) rotate(${2 - (1 - k) * 8}deg)`, fontFamily: fonts.hud, color: "#2a2216" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34, letterSpacing: 5, borderBottom: "4px solid #2a2216", paddingBottom: 10 }}>
          <span>PRÉFECTURE DE POLICE</span>
          <span>1911</span>
        </div>
        <div style={{ display: "flex", gap: 36, marginTop: 34, alignItems: "center" }}>
          <svg width="250" height="300" viewBox="0 0 250 300" style={{ background: "#c9bb98", border: "4px solid #2a2216" }}>
            <ellipse cx="125" cy="115" rx="58" ry="68" fill="#2a2216" />
            <path d="M20 300 Q30 200 125 190 Q220 200 230 300 Z" fill="#2a2216" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={40} y={220 + i * 14} width={170} height={6} fill="#efe4c8" opacity={0.85} />
            ))}
            <text x="125" y="125" textAnchor="middle" fontSize="80" fontWeight="900" fill="#c9bb98" fontFamily="Arial">?</text>
          </svg>
          <div style={{ fontSize: 34, lineHeight: 1.5 }}>
            <div style={{ opacity: 0.7 }}>NAME</div>
            <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 64 }}>PABLO PICASSO</div>
            <div style={{ opacity: 0.7, marginTop: 10 }}>JOB</div>
            <div style={{ fontSize: 42 }}>painter</div>
            <div style={{ opacity: 0.7, marginTop: 10 }}>RESULT</div>
            <div style={{ fontSize: 42 }}>let go</div>
          </div>
        </div>
      </div>
      {f >= stamp ? (
        <div style={{ position: "absolute", top: 760, right: 120, transform: `rotate(-14deg) scale(${2 - s})`, opacity: s, border: "12px solid #d0342c", color: "#d0342c", fontFamily: fonts.punch, fontWeight: 900, fontSize: 150, padding: "0 34px", borderRadius: 18 }}>SUS</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** The letter to the Florence dealer, signed "Leonardo V.", then a BUSTED stamp. */
export const LeonardoLetter: React.FC<{ f: number; at: number; sign: number; busted: number }> = ({ f, at, sign, busted }) => {
  const k = pop(f, at, 10);
  const w = ramp(f, sign, sign + 18);
  const b = pop(f, busted, 6);
  const name = "Leonardo V.";
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #3a3226 0%, #0e0c08 100%)", alignItems: "center", paddingTop: 200 }}>
      <div style={{ width: 780, minHeight: 760, padding: "60px 64px", background: "linear-gradient(180deg,#f4ead2,#e4d6b4)", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", transform: `translateY(${(1 - k) * 500}px) rotate(${-3 + (1 - k) * 8}deg)`, fontFamily: "Georgia, serif", color: "#2a2216", fontSize: 44, lineHeight: 1.45 }}>
        <div style={{ textAlign: "right", fontSize: 34, opacity: 0.7 }}>Paris, 1913</div>
        <div style={{ marginTop: 40 }}>Dear Sir,</div>
        <div style={{ marginTop: 20 }}>I have a certain painting you might like to buy.</div>
        <div style={{ marginTop: 50, fontStyle: "italic", fontSize: 76, fontFamily: "'Brush Script MT', 'Snell Roundhand', cursive", color: "#1d2a6a" }}>{name.slice(0, Math.round(w * name.length))}</div>
      </div>
      {f >= busted ? (
        <div style={{ position: "absolute", top: 1000, left: 0, width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ transform: `rotate(-10deg) scale(${2 - b})`, opacity: b, border: "12px solid #d0342c", color: "#d0342c", fontFamily: fonts.punch, fontWeight: 900, fontSize: 130, padding: "0 34px", borderRadius: 18, background: "rgba(244,234,210,0.6)" }}>CAUGHT</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Plot twist: front pages fly in, a fame meter fills, FREE MARKETING stamp. */
export const Headlines: React.FC<{ f: number; at: number; free: number }> = ({ f, at, free }) => {
  const heads = ["STOLEN!", "WHERE IS IT?", "STILL MISSING", "FOUND!", "SHE'S BACK"];
  const meter = ramp(f, at + 6, free, easeOut);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #2a2f3a 0%, #07090d 100%)" }}>
      {heads.map((h, i) => {
        const a = at + i * 7;
        if (f < a) return null;
        const k = pop(f, a, 8);
        const rot = [-8, 6, -4, 9, -2][i];
        return (
          <div key={i} style={{ position: "absolute", left: 90 + (i % 2) * 120, top: 110 + i * 150, width: 760, padding: "24px 34px", background: "#efe8d6", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", transform: `rotate(${rot}deg) scale(${k})`, fontFamily: fonts.hud, color: "#1a1712" }}>
            <div style={{ fontSize: 24, letterSpacing: 4, borderBottom: "3px double #1a1712", display: "flex", justifyContent: "space-between" }}>
              <span>{["LE PETIT PARISIEN", "NEW YORK DAILY", "LE MATIN", "THE TIMES", "CORRIERE"][i]}</span>
              <span>{i < 3 ? "1911" : "1913"}</span>
            </div>
            <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 84, lineHeight: 1.05, marginTop: 8 }}>{h}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", top: 1180, width: "100%", display: "flex", justifyContent: "center", opacity: fadeIn(f, at + 4) }}>
        <div style={{ width: 820, padding: "18px 26px", borderRadius: 22, background: "rgba(6,10,22,0.85)", border: "3px solid rgba(255,210,63,0.7)" }}>
          <div style={{ fontFamily: fonts.hud, fontSize: 34, letterSpacing: 4, color: "#ffd23f" }}>FAME</div>
          <div style={{ height: 46, marginTop: 10, borderRadius: 23, background: "#1b2236", overflow: "hidden" }}>
            <div style={{ width: `${8 + 92 * meter}%`, height: "100%", background: "linear-gradient(90deg,#ff9f1c,#ffd23f)" }} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** CRT login: types L-O-U-V-R-E, ACCESS GRANTED. */
export const LoginScreen: React.FC<{ f: number; at: number; typeAt: number; granted: number }> = ({ f, at, typeAt, granted }) => {
  const k = fadeIn(f, at, 6);
  const word = "LOUVRE";
  const n = Math.max(0, Math.min(word.length, Math.floor((f - typeAt) / 3)));
  const g = f >= granted;
  const blink = Math.floor(f / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: "#05070a", opacity: k, transform: `scale(${1 + 0.08 * ramp(f, at, granted + 30)})` }}>
      <div style={{ position: "absolute", left: 70, top: 300, width: 940, height: 900, borderRadius: 60, background: "radial-gradient(ellipse at 50% 50%, #0c2a1a 0%, #03100a 100%)", boxShadow: "inset 0 0 120px rgba(0,0,0,0.9), 0 0 0 30px #2a2a26, 0 0 0 34px #111", overflow: "hidden", fontFamily: "'Courier New', monospace", color: "#5cff9a", fontSize: 50, padding: "70px 64px", boxSizing: "border-box", textShadow: "0 0 12px rgba(92,255,154,0.8)" }}>
        <div style={{ fontSize: 36, opacity: 0.8 }}>VIDEO SURVEILLANCE SERVER</div>
        <div style={{ fontSize: 36, opacity: 0.8 }}>SECURITY AUDIT · 2014</div>
        <div style={{ marginTop: 70 }}>USER: admin</div>
        <div style={{ marginTop: 20 }}>
          PASSWORD: {word.slice(0, n)}
          {!g && blink ? "█" : ""}
        </div>
        {g ? <div style={{ marginTop: 80, fontSize: 70, fontWeight: 900, color: "#0a0", background: "#5cff9a", padding: "10px 24px", display: "inline-block", textShadow: "none", transform: `scale(${pop(f, granted, 6)})` }}>ACCESS GRANTED</div> : null}
        {/* scanlines */}
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 2px, transparent 2px, transparent 5px)" }} />
      </div>
    </AbsoluteFill>
  );
};

/** A printed entry ticket "POCKET PUH ONLY" sliding out of a slot. */
export const Ticket: React.FC<{ f: number; at: number; top?: number }> = ({ f, at, top = 1150 }) => {
  if (f < at) return null;
  const k = ramp(f, at, at + 14, easeOut);
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", overflow: "hidden", height: 330 }}>
      <div style={{ transform: `translateY(${(1 - k) * -320}px) rotate(-3deg)`, width: 640, height: 290, borderRadius: 18, background: "linear-gradient(135deg,#fff7e6,#f2dfb8)", border: "4px dashed #b48a3a", display: "flex", alignItems: "center", gap: 26, padding: "0 30px", boxSizing: "border-box", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
        <FoxIcon size={150} />
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, color: "#2a1810" }}>
          <div style={{ fontSize: 34, letterSpacing: 4, color: "#b48a3a" }}>ADMIT ONE</div>
          <div style={{ fontSize: 62, lineHeight: 1.0 }}>POCKET PUH</div>
          <div style={{ fontSize: 62, lineHeight: 1.0 }}>ROOM</div>
        </div>
      </div>
    </div>
  );
};
