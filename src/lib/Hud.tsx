import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, Palette } from "./theme";
import { easeOut, ramp } from "./timing";

const fmt = (n: number, decimals: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

type Count = {
  /** frame the element appears (pop-in) */
  at: number;
  /** frame it disappears (fade-out over 6 frames); omit to stay */
  until?: number;
  value: number;
  /** count up from this value; omit for no count-up */
  from?: number;
  /** frames the count-up takes */
  countFrames?: number;
  decimals?: number;
};

const useCount = ({ at, until, value, from, countFrames = 18, decimals = 0 }: Count) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - at, fps, config: { damping: 13, stiffness: 200, mass: 0.7 } });
  const out = until === undefined ? 1 : 1 - ramp(frame, until - 6, until);
  const v = from === undefined ? value : from + (value - from) * ramp(frame, at, at + countFrames, easeOut);
  return { visible: frame >= at && out > 0, pop, out, text: fmt(v, decimals) };
};

/**
 * Dark glass pill with a big number + small unit ("84 miles of belts", "1:00 AM", "300 routes").
 * Position it with `style` (absolute, centered by default at `top`).
 */
export const StatPill: React.FC<
  Count & { unit: string; palette: Palette; color?: string; top?: number; scale?: number; prefix?: string }
> = ({ unit, palette, color, top = 300, scale = 1, prefix = "", ...count }) => {
  const c = useCount(count);
  if (!c.visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top,
        transform: `translate(-50%,0) scale(${scale * (0.7 + 0.3 * c.pop)})`,
        opacity: c.out * Math.min(1, c.pop * 1.5),
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        padding: "10px 26px 14px",
        borderRadius: 22,
        background: "rgba(8,10,22,0.78)",
        border: "1.5px solid rgba(255,255,255,0.12)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontFamily: fonts.punch,
          fontWeight: 800,
          fontSize: 84,
          color: color ?? palette.accent,
          fontVariantNumeric: "tabular-nums",
          textShadow: `0 0 28px ${color ?? palette.accent}66`,
        }}
      >
        {prefix}
        {c.text}
      </span>
      <span style={{ fontFamily: fonts.punch, fontWeight: 700, fontSize: 38, color: color ?? palette.accent }}>{unit}</span>
    </div>
  );
};

/** Technical bracket readout "[ 594 FT ]" with a small label under it (submarine reel). */
export const Readout: React.FC<Count & { unit: string; label?: string; palette: Palette; top?: number }> = ({
  unit,
  label,
  palette,
  top = 160,
  ...count
}) => {
  const c = useCount(count);
  if (!c.visible) return null;
  const corner = (pos: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    width: 18,
    height: 18,
    borderColor: palette.accent,
    borderStyle: "solid",
    borderWidth: 0,
    ...pos,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top,
        transform: `translate(-50%,0) scale(${0.85 + 0.15 * c.pop})`,
        opacity: c.out * Math.min(1, c.pop * 1.5),
        textAlign: "center",
      }}
    >
      <div style={{ position: "relative", padding: "4px 30px" }}>
        <span style={corner({ left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4 })} />
        <span style={corner({ right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4 })} />
        <span style={corner({ left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4 })} />
        <span style={corner({ right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4 })} />
        <span
          style={{
            fontFamily: fonts.hud,
            fontWeight: 700,
            fontSize: 96,
            letterSpacing: 4,
            color: palette.accent,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {c.text} {unit}
        </span>
      </div>
      {label ? (
        <div style={{ fontFamily: fonts.hud, fontWeight: 600, fontSize: 24, letterSpacing: 3, color: palette.text, marginTop: 8 }}>
          {label}
        </div>
      ) : null}
    </div>
  );
};

/** Callout tag with a leader line ("VIRGINIA CLASS — US NAVY, 377 FT LONG"). x/y = point it labels, in px. */
export const Callout: React.FC<{
  at: number;
  until?: number;
  title: string;
  sub?: string;
  x: number;
  y: number;
  palette: Palette;
  side?: "left" | "right";
}> = ({ at, until, title, sub, x, y, palette, side = "left" }) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const line = ramp(frame, at, at + 8, easeOut);
  const tag = ramp(frame, at + 5, at + 12, easeOut);
  const lineH = 150;
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      <div style={{ position: "absolute", left: -9, top: -9, width: 18, height: 18, border: `3px solid ${palette.accent}`, opacity: line }} />
      <div style={{ position: "absolute", left: -1.5, top: -lineH * line, width: 3, height: lineH * line, background: palette.accent }} />
      <div
        style={{
          position: "absolute",
          top: -lineH - 70,
          [side === "left" ? "right" : "left"]: -20,
          opacity: tag,
          transform: `translateY(${(1 - tag) * 12}px)`,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ background: palette.accent, color: "#111", fontFamily: fonts.hud, fontWeight: 700, fontSize: 40, padding: "2px 14px", letterSpacing: 1 }}>
          {title}
        </div>
        {sub ? <div style={{ fontFamily: fonts.hud, fontWeight: 600, fontSize: 20, color: palette.text, letterSpacing: 2, marginTop: 6 }}>{sub}</div> : null}
      </div>
    </div>
  );
};

/**
 * Analog dial for comparisons (tension.md §4) — "9 G" next to "3,400 G". The needle sweeps
 * with the count-up; past `redFrom` the arc and number turn red. x/y = dial center in px.
 */
export const Gauge: React.FC<
  Count & { max: number; unit: string; label: string; x: number; y: number; palette: Palette; size?: number; redFrom?: number }
> = ({ max, unit, label, x, y, palette, size = 300, redFrom, ...count }) => {
  const frame = useCurrentFrame();
  const c = useCount(count);
  if (!c.visible) return null;
  const from = count.from ?? count.value;
  const v = from + (count.value - from) * ramp(frame, count.at, count.at + (count.countFrames ?? 18), easeOut);
  const k = Math.min(1, v / max);
  // 240° sweep, -210° (lower left) → 30° (lower right); overshoot wobble when pinned
  const pinned = v >= max ? Math.sin(frame * 1.7) * 2.5 : 0;
  const ang = -210 + 240 * k + pinned;
  const red = redFrom !== undefined && v >= redFrom;
  const col = red ? "#ff3b3b" : palette.accent;
  const r = size / 2 - 18;
  const pt = (deg: number, rr: number) => [size / 2 + rr * Math.cos((deg * Math.PI) / 180), size / 2 + rr * Math.sin((deg * Math.PI) / 180)];
  const arc = (a0: number, a1: number) => {
    const [x0, y0] = pt(a0, r);
    const [x1, y1] = pt(a1, r);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
  };
  const [nx, ny] = pt(ang, r - 26);
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        transform: `scale(${0.8 + 0.2 * c.pop})`,
        opacity: c.out * Math.min(1, c.pop * 1.5),
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: palette.text, marginBottom: 6 }}>{label}</div>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="rgba(8,10,18,0.82)" stroke="rgba(255,255,255,0.2)" strokeWidth={3} />
        <path d={arc(-210, 30)} stroke="rgba(255,255,255,0.15)" strokeWidth={14} fill="none" strokeLinecap="round" />
        {k > 0.002 ? <path d={arc(-210, -210 + 240 * k)} stroke={col} strokeWidth={14} fill="none" strokeLinecap="round" /> : null}
        {Array.from({ length: 13 }, (_, i) => {
          const a = -210 + i * 20;
          const [ax, ay] = pt(a, r - 14);
          const [bx, by] = pt(a, r - (i % 3 === 0 ? 34 : 24));
          return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke="rgba(255,255,255,0.55)" strokeWidth={3} />;
        })}
        <line x1={size / 2} y1={size / 2} x2={nx} y2={ny} stroke={col} strokeWidth={7} strokeLinecap="round" />
        <circle cx={size / 2} cy={size / 2} r={14} fill={col} />
      </svg>
      <div
        style={{
          marginTop: -size * 0.3,
          fontFamily: fonts.punch,
          fontWeight: 900,
          fontSize: size * 0.2,
          color: col,
          fontVariantNumeric: "tabular-nums",
          textShadow: `0 0 24px ${col}88`,
        }}
      >
        {c.text}
        <span style={{ fontSize: size * 0.1, marginLeft: 6 }}>{unit}</span>
      </div>
    </div>
  );
};

/**
 * Two clocks racing side by side ("fighter jet 2.0 s" vs "gunship 13 s"). Each lane counts
 * from 0 to its `seconds` over `frames`, then freezes and turns its `color`.
 */
export const RaceTimer: React.FC<{
  at: number;
  until?: number;
  lanes: { label: string; seconds: number; frames: number; color: string }[];
  top?: number;
  palette: Palette;
}> = ({ at, until, lanes, top = 300, palette }) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const o = ramp(frame, at, at + 6) * (until === undefined ? 1 : 1 - ramp(frame, until - 6, until));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", gap: 40, opacity: o }}>
      {lanes.map((l) => {
        const p = ramp(frame, at, at + l.frames, (x) => x);
        const done = p >= 1;
        return (
          <div
            key={l.label}
            style={{
              width: 400,
              padding: "16px 0 20px",
              borderRadius: 22,
              textAlign: "center",
              background: "rgba(8,10,22,0.8)",
              border: `3px solid ${done ? l.color : "rgba(255,255,255,0.15)"}`,
            }}
          >
            <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: palette.dim }}>{l.label}</div>
            <div style={{ fontFamily: fonts.punch, fontWeight: 800, fontSize: 92, color: done ? l.color : palette.text, fontVariantNumeric: "tabular-nums" }}>
              {fmt(l.seconds * p, l.seconds < 10 ? 1 : 0)}
              <span style={{ fontSize: 40 }}> s</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Red "WARNING"-style tag that blinks in for the stakes beat. */
export const WarningTag: React.FC<{ at: number; until?: number; text: string; top?: number }> = ({ at, until, text, top = 420 }) => {
  const frame = useCurrentFrame();
  if (frame < at || (until !== undefined && frame >= until)) return null;
  const blink = frame - at < 12 ? (Math.floor((frame - at) / 3) % 2 === 0 ? 1 : 0.2) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top,
        transform: "translate(-50%,0)",
        opacity: blink,
        padding: "8px 28px",
        background: "#ff2a2a",
        color: "#fff",
        fontFamily: fonts.hud,
        fontWeight: 700,
        fontSize: 48,
        letterSpacing: 6,
        boxShadow: "0 0 50px rgba(255,40,40,0.7)",
        whiteSpace: "nowrap",
      }}
    >
      ⚠ {text}
    </div>
  );
};
