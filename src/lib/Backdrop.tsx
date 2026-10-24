import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Palette } from "./theme";
import { seeded } from "./timing";

/** Night-sky gradient with a soft horizon band and twinkling CSS stars (cheap, no WebGL). */
export const NightBackdrop: React.FC<{ palette: Palette; horizonY?: number; stars?: number; seed?: number }> = ({
  palette,
  horizonY = 0.5,
  stars = 140,
  seed = 7,
}) => {
  const frame = useCurrentFrame();
  const rnd = seeded(seed);
  const pts = Array.from({ length: stars }, () => ({ x: rnd(), y: rnd() * horizonY, s: 1 + rnd() * 2.2, p: rnd() * 6.28 }));
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${palette.bgTop} 0%, ${palette.bgTop} ${horizonY * 55}%, ${palette.horizon} ${
          horizonY * 100
        }%, ${palette.bgBottom} ${horizonY * 100 + 12}%, ${palette.bgBottom} 100%)`,
      }}
    >
      {pts.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: p.s,
            height: p.s,
            borderRadius: "50%",
            background: "#fff",
            opacity: 0.35 + 0.35 * Math.sin(frame * 0.08 + p.p),
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Vignette + subtle grain on top of everything — makes code renders feel filmed. */
export const FilmLook: React.FC<{ vignette?: number }> = ({ vignette = 0.55 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,${vignette}) 100%)` }} />
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id={`grain${frame % 4}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 4} />
          </filter>
          <rect width="100%" height="100%" filter={`url(#grain${frame % 4})`} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
