import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetElevator, SetFoundation, SetHook, SetNightIce, SetPayoff, SetSway, SetWashers, SetWind } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.floors163, C: SetFoundation },
  { from: c.deg50, C: SetNightIce },
  { from: c.m828, C: SetWind },
  { from: c.tipSways, C: SetSway },
  { from: c.elevators, C: SetElevator },
  { from: c.glass24k, C: SetWashers },
  { from: c.congrats, C: SetPayoff },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("skyscraper/vo.mp3")} volume={1.25} />
    <MusicBed
      name="wonder"
      words={words}
      volume={0.18}
      cuts={[
        [c.noBedrock, c.piles192],
        [c.guitar, c.gaslight],
      ]}
    />
    {/* 1. Hook */}
    <Sfx at={c.hook + 2} name="whoosh_fast" volume={0.4} />
    <Sfx at={c.peek} name="chime" volume={0.42} />
    {/* 2. Foundation */}
    <Sfx at={c.floors163} name="rumble" volume={0.42} />
    <Sfx at={c.noBedrock} name="glitch" volume={0.46} />
    <Sfx at={c.piles192} name="impact" volume={0.46} />
    <Sfx at={c.friction} name="stamp" volume={0.46} />
    {/* 3. Night Ice Concrete */}
    <Sfx at={c.deg50} name="clang" volume={0.4} />
    <Sfx at={c.banDay} name="glitch" volume={0.46} />
    <Sfx at={c.crushedIce} name="splash" volume={0.44} />
    <Sfx at={c.crushedIce + 4} name="stamp" volume={0.45} />
    {/* 4. Wind Vortex Shedding */}
    <Sfx at={c.m828} name="rumble" volume={0.42} />
    <Sfx at={c.guitar} name="scratch" volume={0.42} />
    <Sfx at={c.gaslight} name="glitch" volume={0.48} />
    <Sfx at={c.giantY} name="whoosh" volume={0.44} />
    <Sfx at={c.giantY + 4} name="stamp" volume={0.46} />
    {/* 5. Spire Sway */}
    <Sfx at={c.tipSways} name="creak" volume={0.4} />
    <Sfx at={c.tipSways + 18} name="boom" volume={0.42} />
    {/* 6. Elevators & Windows */}
    <Sfx at={c.elevators} name="whoosh_fast" volume={0.46} />
    <Sfx at={c.speed36} name="ding" volume={0.44} />
    <Sfx at={c.glass24k} name="typing" volume={0.36} />
    <Sfx at={c.topDirty} name="glitch" volume={0.44} />
    {/* 7. Payoff */}
    <Sfx at={c.congrats} name="swell" volume={0.48} />
    <Sfx at={c.burjKhalifa} name="boom" volume={0.52} />
    <Sfx at={c.follow} name="pop" volume={0.46} />
    <Sfx at={c.because} name="ding" volume={0.44} />
  </>
);

export const SkyscraperReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.noBedrock} color="#ffd23f" />
    <GlitchCut at={c.banDay} color="#4ceeff" />
    <GlitchCut at={c.gaslight} color="#5dfc8d" />
    <GlitchCut at={c.topDirty} color="#ffaa42" />
    <FilmLook vignette={0.22} />
    <Captions
      words={words}
      palette={P}
      variant="word"
      y={0.5}
      highlight={[
        "puh.",
        "163",
        "450,000",
        "bedrock",
        "192",
        "50",
        "4",
        "friction.",
        "50",
        "ice",
        "night.",
        "828",
        "guitar",
        "gaslight",
        "27",
        "2",
        "36",
        "24,000",
        "3",
        "dirty",
        "Khalifa.",
        "Follow,",
        "Because...",
      ]}
    />
    <Sound />
  </AbsoluteFill>
);
