import React from "react";
import { fonts } from "./theme";
import { easeOut, ramp } from "./timing";

/** Flat fox-head icon (the giant pocket puh), for 2D overlays. */
export const FoxIcon: React.FC<{ size?: number }> = ({ size = 96 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M14 8 L40 36 L20 50 Z" fill="#ef7d2e" />
    <path d="M86 8 L60 36 L80 50 Z" fill="#ef7d2e" />
    <path d="M20 18 L34 36 L23 42 Z" fill="#fff3e3" />
    <path d="M80 18 L66 36 L77 42 Z" fill="#fff3e3" />
    <ellipse cx="50" cy="56" rx="38" ry="34" fill="#ef7d2e" />
    <ellipse cx="50" cy="72" rx="24" ry="17" fill="#fff3e3" />
    {[-1, 1].map((s) => (
      <g key={s}>
        <ellipse cx={50 + s * 15} cy={52} rx={9} ry={10.5} fill="#fff" />
        <ellipse cx={50 + s * 15 + 1} cy={53.5} rx={6.5} ry={8} fill="#2ec4d6" />
        <ellipse cx={50 + s * 15 + 1.5} cy={54} rx={3} ry={4} fill="#111" />
        <circle cx={50 + s * 15 + 3.5} cy={50} r={1.8} fill="#fff" />
      </g>
    ))}
    <ellipse cx="50" cy="66" rx="5" ry="3.5" fill="#1d1716" />
    <path d="M40 74 Q50 84 60 74" stroke="#4a1622" strokeWidth="3" fill="#ff7b98" />
  </svg>
);

/** The series' end pill: fox head + FOLLOW, pops in at `at`, a soft pulse, fades out before `until`. */
export const FollowPill: React.FC<{ f: number; at: number; until: number; top?: number }> = ({ f, at, until, top = 1180 }) => {
  if (f < at || f > until) return null;
  const k = ramp(f, at, at + 9, easeOut);
  const o = Math.min(k, 1 - ramp(f, until - 8, until));
  const pulse = 1 + 0.04 * Math.sin((f - at) * 0.35) * k;
  const tap = ramp(f, at + 22, at + 28) - ramp(f, at + 28, at + 34);
  return (
    <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "16px 46px 16px 20px",
          borderRadius: 80,
          background: tap > 0.5 ? "#ffffff" : "#ff2d55",
          boxShadow: "0 14px 40px rgba(0,0,0,0.45)",
          transform: `scale(${(0.6 + 0.4 * k) * pulse * (1 - 0.06 * tap)})`,
          border: "6px solid #ffffff",
        }}
      >
        <div style={{ width: 104, height: 104, borderRadius: 52, background: "#fff7ec", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <FoxIcon size={92} />
        </div>
        <span style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 88, letterSpacing: 2, color: tap > 0.5 ? "#ff2d55" : "#ffffff" }}>{tap > 0.5 || f > at + 28 ? "FOLLOWING" : "FOLLOW"}</span>
      </div>
    </div>
  );
};
