import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, Palette } from "./theme";
import { norm, ramp, Word } from "./timing";

type Chunk = { words: Word[]; from: number; to: number };

const endsPhrase = (w: string) => /[.?!:…]$/.test(w) || w.endsWith("...");

/** Groups words into on-screen chunks. Exported so storyboards can preview the caption cuts. */
export const chunkWords = (words: Word[], maxWords: number, fps: number, total: number): Chunk[] => {
  const groups: Word[][] = [];
  let cur: Word[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const gap = next ? next.start - w.end : 0;
    const soft = /,$/.test(w.word) && cur.length >= Math.ceil(maxWords / 2);
    if (!next || cur.length >= maxWords || endsPhrase(w.word) || soft || gap > 0.35) {
      groups.push(cur);
      cur = [];
    }
  });
  return groups.map((g, i) => ({
    words: g,
    // the hook is captioned from frame 0 (director rule), even if the first word starts a beat later
    from: i === 0 && g[0].start < 0.5 ? 0 : Math.round(g[0].start * fps),
    to: groups[i + 1] ? Math.round(groups[i + 1][0].start * fps) : total,
  }));
};

type Props = {
  words: Word[];
  palette: Palette;
  /**
   * punch   — 1–3 words, centered, keyword in accent color (submarine / AC-130 reels)
   * karaoke — sentence at the top, words appear as spoken, current word bold (FedEx reel)
   */
  variant: "punch" | "karaoke";
  /** words to emphasise (accent color in punch, selection box in karaoke). Numbers are always emphasised. */
  highlight?: string[];
  /** vertical center of the caption block, 0–1 of the frame height */
  y?: number;
};

export const Captions: React.FC<Props> = ({ words, palette, variant, highlight = [], y }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, height } = useVideoConfig();
  const hl = new Set(highlight.map(norm));
  const isHl = (w: string) => hl.has(norm(w)) || /\d/.test(w);
  const chunks = chunkWords(words, variant === "punch" ? 3 : 7, fps, durationInFrames);
  const chunk = chunks.find((c) => frame >= c.from && frame < c.to);
  if (!chunk) return null;
  const local = frame - chunk.from;

  if (variant === "punch") {
    const pop = spring({ frame: local, fps, config: { damping: 14, stiffness: 220, mass: 0.6 } });
    return (
      <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: (y ?? 0.64) * height,
            transform: `translate(0,-50%) scale(${0.86 + 0.14 * pop})`,
            opacity: chunk.from === 0 ? 1 : ramp(local, 0, 3),
            maxWidth: 940,
            textAlign: "center",
            fontFamily: fonts.punch,
            fontWeight: 800,
            fontSize: 68,
            lineHeight: 1.12,
            color: palette.text,
            textShadow: "0 3px 0 rgba(0,0,0,0.55), 0 6px 22px rgba(0,0,0,0.55)",
            WebkitTextStroke: "1.5px rgba(0,0,0,0.35)",
            letterSpacing: -0.5,
          }}
        >
          {chunk.words.map((w, i) => (
            <span key={i} style={{ color: isHl(w.word) ? palette.accent : undefined }}>
              {w.word.replace(/\.\.\.$/, "…")}
              {i < chunk.words.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  // karaoke
  const spokenIdx = chunk.words.findIndex((w, i) => {
    const next = chunk.words[i + 1];
    return frame < Math.round((next ? next.start : Infinity) * fps);
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: (y ?? 0.085) * height,
          maxWidth: 880,
          textAlign: "center",
          fontFamily: fonts.ui,
          fontSize: 52,
          lineHeight: 1.3,
          color: palette.text,
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        }}
      >
        {chunk.words.map((w, i) => {
          const start = Math.round(w.start * fps);
          if (frame < start) return null;
          const current = i === spokenIdx;
          const box = isHl(w.word) && hl.has(norm(w.word));
          const style: React.CSSProperties = {
            fontWeight: current || box ? 700 : 400,
            color: current || box ? palette.text : palette.dim,
            opacity: start === 0 ? 1 : ramp(frame, start, start + 3),
          };
          return (
            <React.Fragment key={i}>
              {box ? <SelectionBox style={style}>{w.word}</SelectionBox> : <span style={style}>{w.word}</span>}
              {i < chunk.words.length - 1 ? " " : ""}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** The "editor selection" box with corner handles from the FedEx reel. */
const SelectionBox: React.FC<{ children: React.ReactNode; style: React.CSSProperties }> = ({ children, style }) => {
  const handle = (pos: React.CSSProperties): React.CSSProperties => ({
    position: "absolute",
    width: 9,
    height: 9,
    background: "#fff",
    border: "2px solid #3d7bff",
    borderRadius: 2,
    ...pos,
  });
  return (
    <span
      style={{
        ...style,
        position: "relative",
        padding: "0 8px",
        background: "rgba(20,40,110,0.55)",
        outline: "3px solid #3d7bff",
        borderRadius: 3,
      }}
    >
      {children}
      <span style={handle({ left: -6, top: -6 })} />
      <span style={handle({ right: -6, bottom: -6 })} />
    </span>
  );
};
