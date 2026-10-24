import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { fonts } from "./theme";
import { seeded } from "./timing";

/**
 * How we *see* the shot (tension.md §2). Wraps a set — 3D canvas included — in an SVG
 * colour filter plus the overlay that sells the look. Switch modes on a cut with <GlitchCut/>.
 *
 *   thermal      ironbow heat map (black → purple → red → yellow → white)
 *   whitehot     grey thermal camera, hot = white
 *   nightvision  green phosphor, scanlines, heavy grain
 *   danger       red wash that pulses (stakes beat)
 *   normal       passthrough
 */
export type Mode = "normal" | "thermal" | "whitehot" | "nightvision" | "danger";

const LUMA = "0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0";

const FILTERS: Record<Exclude<Mode, "normal" | "danger">, { r: string; g: string; b: string }> = {
  thermal: { r: "0 0.32 0.78 1 1 1", g: "0 0 0.08 0.42 0.82 1", b: "0.06 0.42 0.32 0 0.08 0.95" },
  whitehot: { r: "0 0.12 0.5 0.85 1", g: "0 0.12 0.5 0.85 1", b: "0 0.13 0.5 0.85 1" },
  nightvision: { r: "0 0.02 0.12 0.45", g: "0.02 0.35 0.85 1", b: "0 0.04 0.15 0.4" },
};

export const ViewMode: React.FC<{ mode: Mode; children: React.ReactNode; id?: string }> = ({ mode, children, id = "vm" }) => {
  const frame = useCurrentFrame();
  if (mode === "normal") return <AbsoluteFill>{children}</AbsoluteFill>;
  if (mode === "danger") {
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.45);
    return (
      <AbsoluteFill>
        {children}
        <AbsoluteFill style={{ background: "#ff1e1e", mixBlendMode: "multiply", opacity: 0.35 + 0.15 * pulse }} />
        <AbsoluteFill style={{ boxShadow: `inset 0 0 ${160 + 80 * pulse}px rgba(255,20,20,${0.55 + 0.25 * pulse})` }} />
      </AbsoluteFill>
    );
  }
  const f = FILTERS[mode];
  const fid = `${id}-${mode}`;
  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={fid} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={LUMA} />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={f.r} />
            <feFuncG type="table" tableValues={f.g} />
            <feFuncB type="table" tableValues={f.b} />
          </feComponentTransfer>
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: `url(#${fid})` }}>{children}</AbsoluteFill>
      {mode === "nightvision" ? <Scanlines opacity={0.22} /> : <Scanlines opacity={0.08} />}
      <Grain amount={mode === "nightvision" ? 0.22 : 0.1} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.7) 100%)" }} />
    </AbsoluteFill>
  );
};

export const Scanlines: React.FC<{ opacity?: number }> = ({ opacity = 0.15 }) => (
  <AbsoluteFill
    style={{
      opacity,
      background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.9) 0px, rgba(0,0,0,0.9) 2px, transparent 2px, transparent 5px)",
      pointerEvents: "none",
    }}
  />
);

export const Grain: React.FC<{ amount?: number }> = ({ amount = 0.1 }) => {
  const frame = useCurrentFrame();
  const id = `g${frame % 6}`;
  return (
    <AbsoluteFill style={{ opacity: amount, mixBlendMode: "screen", pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed={frame % 6} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${id})`} />
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Hard cut with a short (3-frame) digital glitch: offset slices, RGB fringe, a soft lift.
 * Put it above the sets at the cut frame; pair with <Sfx name="glitch"/> or "whoosh_fast".
 */
export const GlitchCut: React.FC<{ at: number; frames?: number; color?: string }> = ({ at, frames = 3, color = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < -1 || t >= frames) return null;
  const rnd = seeded(at * 31 + t + 7);
  const bands = Array.from({ length: 5 }, () => ({ y: rnd() * 100, h: 2 + rnd() * 7, dx: (rnd() - 0.5) * 100 }));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* a soft lift, not a white strobe (a full white frame read as blinking) */}
      {t === 0 ? <AbsoluteFill style={{ background: color, opacity: 0.22, mixBlendMode: "screen" }} /> : null}
      {bands.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${b.y}%`,
            height: `${b.h}%`,
            transform: `translateX(${b.dx}px)`,
            background: i % 3 === 0 ? "rgba(255,40,80,0.35)" : i % 3 === 1 ? "rgba(40,220,255,0.3)" : "rgba(255,255,255,0.18)",
            mixBlendMode: "screen",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/**
 * Camera-feed HUD: corner brackets, optional crosshair, blinking REC, telemetry lines.
 * `lines` are short uppercase strings, e.g. ["ULB 37.5 KHZ", "DEPTH 20,000 FT"].
 */
export const HudOverlay: React.FC<{
  color?: string;
  crosshair?: boolean;
  rec?: boolean;
  title?: string;
  lines?: string[];
  opacity?: number;
}> = ({ color = "#9dffb0", crosshair = false, rec = true, title, lines = [], opacity = 1 }) => {
  const frame = useCurrentFrame();
  const corner = (s: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    width: 90,
    height: 90,
    borderColor: color,
    borderStyle: "solid",
    borderWidth: 0,
    ...s,
  });
  const text: React.CSSProperties = { fontFamily: fonts.hud, fontWeight: 600, fontSize: 30, letterSpacing: 3, color };
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <div style={corner({ left: 60, top: 220, borderLeftWidth: 4, borderTopWidth: 4 })} />
      <div style={corner({ right: 60, top: 220, borderRightWidth: 4, borderTopWidth: 4 })} />
      <div style={corner({ left: 60, bottom: 260, borderLeftWidth: 4, borderBottomWidth: 4 })} />
      <div style={corner({ right: 60, bottom: 260, borderRightWidth: 4, borderBottomWidth: 4 })} />
      {rec ? (
        <div style={{ position: "absolute", right: 90, top: 250, display: "flex", alignItems: "center", gap: 12, ...text }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: "#ff3b3b", opacity: frame % 30 < 18 ? 1 : 0.15 }} />
          REC
        </div>
      ) : null}
      {title ? <div style={{ position: "absolute", left: 90, top: 250, ...text }}>{title}</div> : null}
      <div style={{ position: "absolute", left: 90, bottom: 290, ...text, fontSize: 26, lineHeight: 1.45 }}>
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
      {crosshair ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <g stroke={color} strokeWidth={3} fill="none" opacity={0.9}>
            <circle cx={540} cy={960} r={70} />
            <line x1={540} y1={840} x2={540} y2={900} />
            <line x1={540} y1={1020} x2={540} y2={1080} />
            <line x1={420} y1={960} x2={480} y2={960} />
            <line x1={600} y1={960} x2={660} y2={960} />
          </g>
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
