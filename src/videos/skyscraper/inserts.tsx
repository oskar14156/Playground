import React from "react";
import { AbsoluteFill } from "remotion";
import { fonts } from "../../lib/theme";
import { easeInOut, easeOut, ramp } from "../../lib/timing";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 9) => {
  const k = ramp(f, a, a + d, easeOut);
  return k < 1 ? k * (1 + 0.22 * Math.sin(k * Math.PI)) : 1;
};

/** Projected 3D->2D callout tag matching repo's flagship series style; clamped inside safe frame margins. */
export const Tag: React.FC<{
  x: number;
  y: number;
  text: string;
  o: number;
  color?: string;
  side?: "left" | "right";
  size?: number;
}> = ({ x, y, text, o, color = "#ffd23f", side: want = "right", size = 34 }) => {
  if (o <= 0.02) return null;
  const approxW = text.length * size * 0.6 + 100;
  const side = want === "right" && x + approxW > 1040 ? "left" : want === "left" && x - approxW < 40 ? "right" : want;
  const clampedY = Math.max(120, Math.min(1780, y));
  return (
    <div
      style={{
        position: "absolute",
        left: Math.max(36, Math.min(1044, x)),
        top: clampedY,
        opacity: o,
        transform: `translate(${side === "right" ? "0" : "-100%"}, -50%) scale(${0.86 + 0.14 * o})`,
        transformOrigin: side === "right" ? "left center" : "right center",
        display: "flex",
        alignItems: "center",
        flexDirection: side === "right" ? "row" : "row-reverse",
        gap: 10,
      }}
    >
      <div style={{ width: 16, height: 16, borderRadius: 8, background: color, boxShadow: `0 0 12px ${color}` }} />
      <div style={{ width: 40, height: 4, background: color }} />
      <div
        style={{
          padding: "8px 18px",
          borderRadius: 12,
          background: "#ffffff",
          border: `4px solid ${color}`,
          fontFamily: fonts.punch,
          fontWeight: 900,
          fontSize: size,
          color: "#111824",
          whiteSpace: "nowrap",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Big: React.FC<{
  x?: number;
  y: number;
  text: string;
  o: number;
  color?: string;
  size?: number;
}> = ({ x = 540, y, text, o, color = "#ffd23f", size = 82 }) =>
  o <= 0.02 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${0.75 + 0.25 * o})`,
        opacity: o,
        fontFamily: fonts.punch,
        fontWeight: 900,
        fontSize: size,
        color,
        WebkitTextStroke: `${Math.round(size / 7)}px #000`,
        paintOrder: "stroke fill",
        whiteSpace: "pre",
        textAlign: "center",
        lineHeight: 1.04,
      }}
    >
      {text}
    </div>
  );

export const Stamp: React.FC<{
  f: number;
  at: number;
  until?: number;
  text: string;
  top?: number;
  color?: string;
  rot?: number;
  size?: number;
}> = ({ f, at, until, text, top = 1280, color = "#ffd23f", rot = -6, size = 84 }) => {
  if (f < at || (until !== undefined && f >= until)) return null;
  const k = ramp(f, at, at + 6, easeOut);
  const out = until !== undefined ? 1 - ramp(f, until - 5, until, easeInOut) : 1;
  return (
    <div
      style={{
        position: "absolute",
        top,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        opacity: Math.min(1, k * 1.5) * out,
      }}
    >
      <div
        style={{
          transform: `rotate(${rot}deg) scale(${1.9 - 0.9 * k})`,
          border: `10px solid ${color}`,
          color,
          fontFamily: fonts.punch,
          fontWeight: 900,
          fontSize: size,
          padding: "6px 32px",
          borderRadius: 16,
          background: "rgba(6,10,18,0.68)",
          whiteSpace: "nowrap",
          boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const CounterPill: React.FC<{
  o: number;
  label: string;
  value: string;
  sub?: string;
  top?: number;
  color?: string;
}> = ({ o, label, value, sub, top = 150, color = "#ffd23f" }) => {
  if (o <= 0.02) return null;
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 30px",
          borderRadius: 20,
          background: "rgba(7,12,24,0.84)",
          border: `3px solid ${color}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontFamily: fonts.hud, fontSize: 26, letterSpacing: 4, color: "#9eb8d6" }}>{label}</div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, color: "#ffffff", lineHeight: 1.05 }}>{value}</div>
        {sub ? <div style={{ fontFamily: fonts.punch, fontWeight: 800, fontSize: 32, color }}>{sub}</div> : null}
      </div>
    </div>
  );
};

/** Bottom comparison vector chart: Burj Khalifa (828 m) vs Empire State (443 m) vs Eiffel Tower (330 m). */
export const HeightCompareBadge: React.FC<{ f: number; at: number; until?: number }> = ({ f, at, until }) => {
  if (f < at || (until !== undefined && f >= until)) return null;
  const o = Math.min(fadeIn(f, at, 10), until ? 1 - ramp(f, until - 5, until) : 1);
  const grow = ramp(f, at + 4, at + 22, easeOut);
  const bars = [
    { name: "EIFFEL", m: "330 m · 1,083 ft", h: 72 * grow, col: "#6f86a0" },
    { name: "EMPIRE ST.", m: "443 m · 1,454 ft", h: 96 * grow, col: "#4fa8d8" },
    { name: "BURJ KHALIFA", m: "828 m · 2,717 ft", h: 180 * grow, col: "#ffd23f" },
  ];
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        bottom: 140,
        opacity: o,
        padding: "18px 28px",
        borderRadius: 20,
        background: "rgba(8,14,26,0.86)",
        border: "3px solid rgba(140,210,255,0.5)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-end",
        height: 280,
      }}
    >
      {bars.map((b) => (
        <div key={b.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 28, color: b.col }}>{b.m}</div>
          <div
            style={{
              width: 34,
              height: Math.max(4, b.h),
              borderRadius: "8px 8px 2px 2px",
              background: b.col,
              boxShadow: b.name === "BURJ KHALIFA" ? "0 0 22px rgba(255,210,63,0.65)" : "none",
            }}
          />
          <div style={{ fontFamily: fonts.hud, fontSize: 24, color: "#dbe5f0", letterSpacing: 1 }}>{b.name}</div>
        </div>
      ))}
    </div>
  );
};

/** Live temperature gauge transitioning from scorching 50°C day crack to 18°C ice-chilled night pour. */
export const TempGauge: React.FC<{ f: number; at: number; iceAt: number; until: number }> = ({ f, at, iceAt, until }) => {
  if (f < at || f >= until) return null;
  const o = Math.min(fadeIn(f, at), 1 - ramp(f, until - 5, until));
  const iceK = ramp(f, iceAt, iceAt + 18, easeOut);
  const degC = Math.round(50 - iceK * 32);
  const degF = Math.round(degC * 1.8 + 32);
  const col = iceK > 0.45 ? "#4ceeff" : "#ff5a36";
  return (
    <div style={{ position: "absolute", top: 145, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "14px 32px",
          borderRadius: 20,
          background: "rgba(8,14,24,0.88)",
          border: `3px solid ${col}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: fonts.hud, fontSize: 24, letterSpacing: 3, color: "#9eb6cc" }}>DUBAI POUR TEMP</span>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 52, color: "#fff" }}>
            {degC}°C · {degF}°F
          </span>
        </div>
        <div
          style={{
            padding: "8px 18px",
            borderRadius: 12,
            background: iceK > 0.45 ? "rgba(76,238,255,0.18)" : "rgba(255,90,54,0.22)",
            fontFamily: fonts.punch,
            fontWeight: 900,
            fontSize: 34,
            color: col,
          }}
        >
          {iceK > 0.45 ? "ICE CHILLED ✓" : "COOKS FAST ✗"}
        </div>
      </div>
    </div>
  );
};

/** Full-frame 2D animated SVG Geotechnical Schematic: Normal Bedrock vs Burj Khalifa Skin Friction (caption gutter clean). */
export const FrictionSchematic: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const o = fadeIn(f, at, 8);
  const shift = ((f - at) * 3) % 60;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #f6f1e6 0%, #ded6c5 100%)", opacity: o }}>
      {/* Drafting grid */}
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {Array.from({ length: 18 }, (_, i) => (
          <line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={1920} stroke="rgba(40,60,90,0.08)" strokeWidth={2} />
        ))}
        {Array.from({ length: 32 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 60} x2={1080} y2={i * 60} stroke="rgba(40,60,90,0.08)" strokeWidth={2} />
        ))}

        {/* Header */}
        <text x={540} y={180} textAnchor="middle" fontFamily={fonts.hud} fontSize={30} letterSpacing={5} fill="#46586e">
          GEOTECHNICAL ENGINEERING · BURJ KHALIFA
        </text>
        <text x={540} y={244} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={50} fill="#141e2e">
          END-BEARING vs SKIN FRICTION
        </text>

        {/* LEFT DIAGRAM (y = 300..820): Typical Skyscraper hitting Solid Bedrock */}
        <g transform="translate(65,300)">
          <rect x={0} y={0} width={440} height={510} rx={22} fill="#fbf8f1" stroke="#c8beab" strokeWidth={4} />
          <text x={220} y={48} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={34} fill="#3a4a5e">
            TYPICAL TOWER
          </text>
          {/* Tower base + piles resting on bedrock */}
          <rect x={150} y={84} width={140} height={60} rx={6} fill="#7289a3" />
          <rect x={125} y={144} width={190} height={24} fill="#4c5c6e" />
          {[145, 220, 295].map((px) => (
            <rect key={px} x={px - 10} y={168} width={20} height={210} fill="#939ca6" />
          ))}
          {/* Loose sand layer */}
          <rect x={24} y={168} width={392} height={210} fill="rgba(222,184,120,0.32)" />
          {/* Dark granite bedrock layer */}
          <rect x={24} y={378} width={392} height={106} rx={10} fill="#343d48" />
          <text x={220} y={428} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={30} fill="#ffffff">
            SOLID BEDROCK
          </text>
          <text x={220} y={462} textAnchor="middle" fontFamily={fonts.hud} fontSize={24} fill="#8ef5b4">
            SUPPORTS WEIGHT ✓
          </text>
        </g>

        {/* RIGHT DIAGRAM (y = 300..820): Dubai Desert — NO bedrock, 192 Friction Piles */}
        <g transform="translate(575,300)">
          <rect x={0} y={0} width={440} height={510} rx={22} fill="#fffdf8" stroke="#d9a82b" strokeWidth={6} />
          <text x={220} y={48} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={34} fill="#b57409">
            DUBAI DESERT
          </text>
          {/* Burj silhouette */}
          <polygon points="200,82 240,82 260,144 180,144" fill="#3a6b94" />
          {/* 3.7 m thick raft slab */}
          <rect x={95} y={144} width={250} height={28} rx={5} fill="#505e6e" />
          {/* 50 m piles embedded purely in sand */}
          <rect x={24} y={172} width={392} height={312} rx={10} fill="#e5c58d" />
          {[120, 170, 220, 270, 320].map((px) => (
            <g key={px}>
              <rect x={px - 9} y={172} width={18} height={250} rx={4} fill="#6b7785" />
              {/* Upward skin friction shear chevrons sliding along shaft */}
              {[0, 1, 2].map((k) => {
                const yy = 400 - ((k * 70 + shift) % 210);
                return (
                  <path
                    key={k}
                    d={`M ${px - 18} ${yy + 12} L ${px - 10} ${yy} M ${px + 18} ${yy + 12} L ${px + 10} ${yy}`}
                    stroke="#d93829"
                    strokeWidth={4}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          ))}
          <text x={220} y={466} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={22} fill="#b82018">
            ZERO BEDROCK — SAND ONLY
          </text>
        </g>

        {/* Bottom Enlarged Spec Strip (y = 1140..1510, completely below center caption gutter!) */}
        <g transform="translate(80,1150)">
          <rect x={0} y={0} width={920} height={330} rx={24} fill="#141e2e" stroke="#ffd23f" strokeWidth={5} />
          <text x={460} y={76} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={36} fill="#ffd23f">
            450,000 t · 500k US t ↑ HELD BY FRICTION
          </text>
          <text x={460} y={145} textAnchor="middle" fontFamily={fonts.punch} fontWeight={800} fontSize={38} fill="#ffffff">
            192 CONCRETE PILES · 50 m (164 ft) DEEP
          </text>
          <text x={460} y={208} textAnchor="middle" fontFamily={fonts.punch} fontWeight={800} fontSize={36} fill="#7ce8ff">
            3.7 m (12 ft) Y-SHAPED CONCRETE RAFT
          </text>
          <text x={460} y={282} textAnchor="middle" fontFamily={fonts.hud} fontSize={30} letterSpacing={4} fill="#a9c0d8">
            SIDE-WALL SHEAR GRIPS COMPACTED DESERT SAND
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Full-frame 2D animated SVG Aerodynamic Blueprint: Square Kármán Resonance vs Burj Y-Plan 27 Setbacks. */
export const VortexPlanSchematic: React.FC<{ f: number; at: number; setbacksAt: number }> = ({ f, at, setbacksAt }) => {
  const o = fadeIn(f, at, 8);
  const flow = (f - at) * 7;
  const setbackCount = Math.min(27, Math.max(1, Math.round(1 + 26 * ramp(f, setbacksAt - 8, setbacksAt + 35))));
  const wingScale = 1 - (setbackCount / 27) * 0.52;

  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #11243e 0%, #050c18 100%)", opacity: o }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {Array.from({ length: 18 }, (_, i) => (
          <line key={`v${i}`} x1={i * 60} y1={0} x2={i * 60} y2={1920} stroke="rgba(90,180,255,0.08)" strokeWidth={2} />
        ))}
        {Array.from({ length: 32 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 60} x2={1080} y2={i * 60} stroke="rgba(90,180,255,0.08)" strokeWidth={2} />
        ))}

        <text x={540} y={175} textAnchor="middle" fontFamily={fonts.hud} fontSize={30} letterSpacing={6} fill="#6ec2ff">
          AERODYNAMIC WIND TUNNEL · TOP PLAN VIEW
        </text>
        <text x={540} y={242} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={58} fill="#ffffff">
          CONFUSING THE WIND
        </text>

        {/* TOP CARD (y = 290..770): Square Plan -> Giant Alternating Kármán Vortex Street */}
        <g transform="translate(80,290)">
          <rect x={0} y={0} width={920} height={470} rx={24} fill="rgba(16,28,48,0.88)" stroke="#ff5642" strokeWidth={4} />
          <text x={460} y={54} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={30} fill="#ff7362">
            STRAIGHT SQUARE TOWER · RESONANCE SNAPS ✗
          </text>
          {/* Incoming steady streamlines */}
          {[160, 235, 310].map((y, idx) => (
            <line
              key={idx}
              x1={48 + (flow % 50)}
              y1={y}
              x2={250}
              y2={y}
              stroke="#6ce2ff"
              strokeWidth={8}
              strokeDasharray="28 16"
              strokeLinecap="round"
            />
          ))}
          {/* Square cross-section */}
          <rect x={275} y={165} width={140} height={140} rx={8} fill="#4d7ea8" stroke="#c8e6ff" strokeWidth={6} />
          {/* Big alternating locked red spiral eddies */}
          {[0, 1, 2, 3].map((v) => {
            const vx = 490 + ((v * 110 + flow * 2) % 390);
            const vy = v % 2 === 0 ? 165 : 315;
            const rot = (f - at) * (v % 2 === 0 ? 10 : -10);
            return (
              <g key={v} transform={`translate(${vx},${vy}) rotate(${rot})`}>
                <circle r={46} fill="none" stroke="#ff4e3a" strokeWidth={8} strokeDasharray="110 40" />
                <circle r={24} fill="none" stroke="#ff9580" strokeWidth={6} strokeDasharray="55 25" />
              </g>
            );
          })}
          <text x={660} y={425} textAnchor="middle" fontFamily={fonts.hud} fontSize={28} fill="#ff9e92">
            LOCKED VORTEX FREQUENCY · VIOLENT SWAY
          </text>
        </g>

        {/* BOTTOM CARD (y = 1160..1710): Burj Khalifa Y-Plan Stepping Inward across 27 Tiers */}
        <g transform="translate(80,1160)">
          <rect x={0} y={0} width={920} height={540} rx={24} fill="rgba(12,34,46,0.9)" stroke="#4df29c" strokeWidth={5} />
          <text x={460} y={58} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={36} fill="#5dfc9d">
            BURJ KHALIFA Y-PLAN · {setbackCount} / 27 SETBACKS ✓
          </text>
          {[200, 275, 350].map((y, idx) => (
            <line
              key={idx}
              x1={48 + (flow % 50)}
              y1={y}
              x2={230}
              y2={y}
              stroke="#6ce2ff"
              strokeWidth={8}
              strokeDasharray="28 16"
              strokeLinecap="round"
            />
          ))}
          {/* Outer faint ghost outline of Ground Y-plan + live shrinking upper Y-plan */}
          {[1.0, wingScale].map((sc, tierIdx) => (
            <g key={tierIdx} transform={`translate(345,275) scale(${sc})`} opacity={tierIdx === 0 ? 0.28 : 1}>
              {[0, 120, 240].map((deg) => (
                <rect
                  key={deg}
                  x={-12}
                  y={-130}
                  width={48}
                  height={135}
                  rx={24}
                  transform={`rotate(${deg})`}
                  fill={tierIdx === 0 ? "#88d6ff" : "#5dfc9d"}
                  stroke="#ffffff"
                  strokeWidth={tierIdx === 0 ? 3 : 5}
                />
              ))}
              <circle r={34} fill="#143248" stroke="#ffffff" strokeWidth={4} />
            </g>
          ))}
          {/* Broken scattered small green micro-curls */}
          {[0, 1, 2, 3, 4, 5].map((w) => {
            const wx = 490 + ((w * 72 + flow * 1.8) % 380);
            const wy = 140 + ((w * 63) % 270);
            return (
              <path
                key={w}
                d={`M ${wx} ${wy} q 18 -14 34 4`}
                fill="none"
                stroke="#5dfc9d"
                strokeWidth={7}
                strokeLinecap="round"
              />
            );
          })}
          <text x={460} y={492} textAnchor="middle" fontFamily={fonts.hud} fontSize={28} fill="#aefcd0">
            VORTEX TIMING SCRAMBLED AT EVERY SETBACK FLOOR
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/** Animated 3-Month Sisyphus Window Washing Calendar Badge. */
export const CalendarBadge: React.FC<{ f: number; at: number; progress: number; until: number }> = ({
  f,
  at,
  progress,
  until,
}) => {
  if (f < at || f >= until) return null;
  const o = Math.min(fadeIn(f, at), 1 - ramp(f, until - 5, until));
  const month = Math.min(3, Math.floor(progress * 3) + 1);
  const loop = progress > 0.78;
  const k = pop(f, at, 9);
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", opacity: o, transform: `scale(${0.88 + 0.12 * k})` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "14px 32px",
          borderRadius: 20,
          background: "rgba(8,14,26,0.86)",
          border: `3px solid ${loop ? "#ff9538" : "#ffd23f"}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 14,
            background: "#fff",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ width: "100%", height: 26, background: "#e03b2b", color: "#fff", fontFamily: fonts.hud, fontSize: 18, textAlign: "center", lineHeight: "26px" }}>
            MONTH
          </div>
          <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 48, color: "#111", lineHeight: "56px" }}>{month}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: fonts.hud, fontSize: 24, letterSpacing: 3, color: "#9eb6cc" }}>24,348 GLASS PANELS</span>
          <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 42, color: loop ? "#ff9538" : "#fff" }}>
            {loop ? "TOP DIRTY AGAIN!" : `WASHING · MONTH ${month}/3`}
          </span>
        </div>
      </div>
    </div>
  );
};
