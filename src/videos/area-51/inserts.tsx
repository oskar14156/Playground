import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeOut, ramp } from "../../lib/timing";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 8) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.25 * Math.sin(k * Math.PI)) : 1;
};
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

/** UFO report forms pile up on a desk, a counter climbs; then the CIA tweet card slaps on top: "It was us." */
export const UfoReports: React.FC<{ f: number; at: number; cia: number; tweet: number }> = ({ f, at, cia, tweet }) => {
  const n = Math.min(24, Math.max(0, Math.floor((f - at) / 2.2)));
  const tk = pop(f, tweet, 10);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #3a3026 0%, #120e0a 100%)" }}>
      {Array.from({ length: n }, (_, i) => {
        const r = (i * 37) % 11;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 150 + ((i * 73) % 300),
              top: 260 + ((i * 131) % 520),
              width: 520,
              padding: "22px 28px",
              background: "#f1ead6",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              transform: `rotate(${(r - 5) * 2.4}deg)`,
              fontFamily: fonts.hud,
              color: "#2a241c",
            }}
          >
            <div style={{ fontSize: 26, letterSpacing: 4, color: "#7a1f1a" }}>UFO REPORT · 195{5 + (i % 5)}</div>
            <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 40, marginTop: 6 }}>{["GLOWING OBJECT", "SILVER CRAFT", "FIERY LIGHT", "OBJECT AT 60,000 FT"][i % 4]}</div>
            <div style={{ height: 8, background: "#b9ae94", width: "80%", marginTop: 14 }} />
            <div style={{ height: 8, background: "#b9ae94", width: "60%", marginTop: 10 }} />
          </div>
        );
      })}
      {f >= cia ? (
        <div style={{ position: "absolute", top: 1330, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 76, color: "#ffd23f", WebkitTextStroke: "9px #000", paintOrder: "stroke fill", opacity: fadeIn(f, cia) }}>
          MORE THAN HALF = U-2
        </div>
      ) : null}
      {f >= tweet ? (
        <div
          style={{
            position: "absolute",
            left: 90,
            top: 380,
            width: 900,
            padding: "34px 40px",
            background: "#ffffff",
            borderRadius: 26,
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            transform: `translateY(${(1 - tk) * 500}px) rotate(-2deg) scale(${0.9 + 0.1 * tk})`,
            fontFamily: fonts.ui,
            color: "#0f1419",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 84, height: 84, borderRadius: 42, background: "#1d3b6e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: fonts.punch, fontWeight: 900, fontSize: 30 }}>CIA</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 40 }}>CIA</div>
              <div style={{ fontSize: 30, color: "#536471" }}>Dec 2014</div>
            </div>
          </div>
          <div style={{ fontSize: 46, marginTop: 22, lineHeight: 1.3 }}>Reports of unusual activity in the skies in the '50s?</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 96, marginTop: 10, color: "#d0342c" }}>It was us.</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** Pilot chart of the desert with a restricted box; the label types in: HOMEY AIRPORT. A 58-year counter above. */
export const HomeyChart: React.FC<{ f: number; at: number; homey: number }> = ({ f, at, homey }) => {
  const years = Math.min(58, Math.max(0, Math.floor((f - at) / 0.9)));
  const label = "HOMEY AIRPORT";
  const typed = label.slice(0, Math.max(0, Math.floor((f - homey) / 1.6)));
  return (
    <AbsoluteFill style={{ background: "#e9e4cf" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
        {/* contour lines of the mountains */}
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} d={`M ${-50} ${300 + i * 90} C 300 ${200 + i * 95}, 700 ${420 + i * 80}, 1150 ${260 + i * 92}`} stroke="#c9b98f" strokeWidth={3} fill="none" />
        ))}
        {/* airways */}
        <path d="M 0 400 L 1080 1500" stroke="#3d6fb5" strokeWidth={5} strokeDasharray="20 12" />
        <path d="M 1080 520 L 80 1700" stroke="#3d6fb5" strokeWidth={5} strokeDasharray="20 12" />
        {/* restricted area R-4808 */}
        <rect x={250} y={640} width={580} height={600} fill="rgba(208,52,44,0.12)" stroke="#d0342c" strokeWidth={8} strokeDasharray="30 14" />
        <text x={540} y={700} textAnchor="middle" fontFamily="monospace" fontSize={40} fill="#d0342c" fontWeight="bold">R-4808N</text>
        {/* the dry lake + runway */}
        <ellipse cx={540} cy={900} rx={190} ry={80} fill="#f7f4ea" stroke="#9c8f6a" strokeWidth={4} />
        <rect x={380} y={985} width={320} height={14} fill="#333" />
      </svg>
      <div style={{ position: "absolute", top: 1300, width: "100%", textAlign: "center", fontFamily: "monospace", fontWeight: 700, fontSize: 72, color: "#1d2a3a", letterSpacing: 4, background: "rgba(233,228,207,0.85)" }}>
        {typed}
        <span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0 }}>▌</span>
      </div>
      {f >= homey + 22 ? <div style={{ position: "absolute", top: 1400, width: "100%", textAlign: "center", fontFamily: "monospace", fontSize: 40, color: "#5a6676", opacity: fadeIn(f, homey + 22) }}>KXTA</div> : null}
      <div style={{ position: "absolute", top: 220, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 110, color: "#ffffff", WebkitTextStroke: "11px #000", paintOrder: "stroke fill" }}>
        {years} YEARS
      </div>
      <div style={{ position: "absolute", top: 360, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, color: "#d0342c", WebkitTextStroke: "6px #fff", paintOrder: "stroke fill", opacity: fadeIn(f, at + 10) }}>
        1955 → 2013 · OFFICIALLY NOTHING
      </div>
    </AbsoluteFill>
  );
};

/** "Storm Area 51" event card: 2,000,000 going → then a big red 150. */
export const StormCounter: React.FC<{ f: number; at: number; showed: number }> = ({ f, at, showed }) => {
  const up = ramp(f, at, at + 26, easeOut);
  const going = Math.round(2000000 * up);
  const k = pop(f, showed, 10);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #1b2a4a 0%, #0b1020 100%)", alignItems: "center" }}>
      <div style={{ marginTop: 300, width: 900, background: "#ffffff", borderRadius: 24, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", fontFamily: fonts.ui }}>
        <div style={{ height: 260, background: "linear-gradient(135deg, #4bb36b 0%, #1d6b3a 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 150 }}>👽</div>
        <div style={{ padding: "26px 36px" }}>
          <div style={{ fontSize: 30, color: "#d0342c", fontWeight: 700 }}>FRI, SEP 20, 2019</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#111", marginTop: 6 }}>Storm Area 51</div>
          <div style={{ fontSize: 46, color: "#3a3f45", marginTop: 14 }}>
            <b style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(going)}</b> going
          </div>
        </div>
      </div>
      {f >= showed ? (
        <div style={{ position: "absolute", top: 1210, width: "100%", textAlign: "center", transform: `scale(${0.6 + 0.4 * k})`, opacity: Math.min(1, k) }}>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 230, color: "#ff3b30", WebkitTextStroke: "14px #000", paintOrder: "stroke fill", lineHeight: 1 }}>150</div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 64, color: "#ffffff", WebkitTextStroke: "7px #000", paintOrder: "stroke fill" }}>SHOWED UP</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** 1974: the CIA memo line "There is no agreement." slides up over the Skylab photo (SetSkylab). */
export const SkylabMemo: React.FC<{ f: number; memo: number }> = ({ f, memo }) => {
  const m = pop(f, memo, 10);
  return f >= memo ? (
    <div style={{ position: "absolute", left: 90, top: 1130, width: 900, padding: "28px 38px", background: "#f2ead2", boxShadow: "0 24px 60px rgba(0,0,0,0.6)", transform: `translateY(${(1 - m) * 700}px) rotate(-2deg)`, fontFamily: fonts.hud, color: "#1a1a1a" }}>
      <div style={{ fontSize: 28, letterSpacing: 5, color: "#7a1f1a" }}>CIA MEMO · APRIL 1974 · SECRET</div>
      <div style={{ fontSize: 38, marginTop: 10 }}>Can a photo taken from space be classified?</div>
      <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 70, marginTop: 8, color: "#d0342c" }}>"THERE IS NO AGREEMENT."</div>
    </div>
  ) : null;
};
