import { Easing, interpolate } from "remotion";

export type Word = { word: string; start: number; end: number };

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9äöüß]/g, "");

/**
 * Turns words.json into frame cues, so beats are anchored to what is said,
 * never to hand-typed frame numbers. Re-voicing the script re-times the whole video.
 *
 *   const cue = makeCues(words, fps);
 *   cue.at("great circle")      // frame where "great" starts
 *   cue.end("great circle")     // frame where "circle" ends
 *   cue.at("the", 3)            // 3rd occurrence
 */
export const makeCues = (words: Word[], fps: number) => {
  const f = (sec: number) => Math.round(sec * fps);
  const find = (phrase: string, nth = 1) => {
    const toks = phrase.split(/\s+/).map(norm).filter(Boolean);
    let seen = 0;
    for (let i = 0; i + toks.length <= words.length; i++) {
      if (toks.every((t, k) => norm(words[i + k].word) === t) && ++seen === nth) return i;
    }
    throw new Error(`Cue "${phrase}" (#${nth}) is not in words.json — script and storyboard are out of sync`);
  };
  return {
    words,
    fps,
    at: (phrase: string, nth = 1) => f(words[find(phrase, nth)].start),
    end: (phrase: string, nth = 1) => {
      const i = find(phrase, nth);
      return f(words[i + phrase.split(/\s+/).filter(Boolean).length - 1].end);
    },
    /** frame where the last word ends */
    voiceEnd: f(words[words.length - 1].end),
  };
};
export type Cues = ReturnType<typeof makeCues>;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** 0→1 between two frames, eased and clamped. */
export const ramp = (frame: number, from: number, to: number, ease = easeInOut) =>
  interpolate(frame, [from, Math.max(to, from + 1)], [0, 1], { ...clamp, easing: ease });

/** Piecewise keyframes: [[frame, value], ...] → value at frame (eased per segment). */
export const keys = (frame: number, k: [number, number][], ease = easeInOut) => {
  if (frame <= k[0][0]) return k[0][1];
  for (let i = 0; i < k.length - 1; i++) {
    const [f0, v0] = k[i];
    const [f1, v1] = k[i + 1];
    if (frame <= f1) return v0 + (v1 - v0) * ramp(frame, f0, f1, ease);
  }
  return k[k.length - 1][1];
};

/** Same as keys() for [x,y,z] tuples. */
export const keys3 = (frame: number, k: [number, [number, number, number]][], ease = easeInOut) =>
  [0, 1, 2].map((i) => keys(frame, k.map(([f, v]) => [f, v[i]] as [number, number]), ease)) as [number, number, number];

/** Deterministic PRNG — never use Math.random() in a composition. */
export const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
