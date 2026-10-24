import React from "react";
import { AbsoluteFill, Freeze, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { ramp } from "./timing";

/**
 * Seamless loop: over the last `frames` frames, cross-dissolve into the video's own
 * first frame, so the last rendered frame IS frame 0. Pair it with a script whose last
 * line is an unfinished sentence that the hook completes ("Which is why…" → hook).
 *
 * `opening` must render the opening shot exactly as it looks at frame 0
 * (usually the same element the video starts with).
 */
export const LoopBridge: React.FC<{ frames?: number; opening: React.ReactNode }> = ({ frames = 18, opening }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <Sequence from={durationInFrames - frames} durationInFrames={frames} name="LoopBridge">
      <Dissolve frames={frames}>
        <Freeze frame={0}>{opening}</Freeze>
      </Dissolve>
    </Sequence>
  );
};

const Dissolve: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  // Sequence-relative frame 0 … frames-1; fully opaque on the very last frame of the video.
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: ramp(f, 0, frames - 1) }}>{children}</AbsoluteFill>;
};
