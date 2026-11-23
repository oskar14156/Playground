import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetArrestingGear, SetEmalsLaunch, SetHook, SetPayoff, SetReactorCore } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.t100k, C: SetEmalsLaunch },
  { from: c.threeCables, C: SetArrestingGear },
  { from: c.reactors, C: SetReactorCore },
  { from: c.congrats, C: SetPayoff },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("carrier/vo.mp3")} volume={1.25} />
    <MusicBed
      name="wonder"
      words={words}
      volume={0.18}
      cuts={[
        [c.bigProb, c.electromagnetic],
        [c.plotTwist, c.missAll],
      ]}
    />
    <Sfx at={c.hook + 2} name="scratch" volume={0.4} />
    <Sfx at={c.floating} name="whoosh_fast" volume={0.44} />
    <Sfx at={c.t100k} name="clang" volume={0.42} />
    <Sfx at={c.electromagnetic} name="glitch" volume={0.46} />
    <Sfx at={c.kph240} name="boom" volume={0.48} />
    <Sfx at={c.kph240 + 4} name="stamp" volume={0.44} />
    <Sfx at={c.threeCables} name="creak" volume={0.4} />
    <Sfx at={c.m90} name="impact" volume={0.46} />
    <Sfx at={c.plotTwist} name="glitch" volume={0.46} />
    <Sfx at={c.fullThrottle} name="whoosh_fast" volume={0.48} />
    <Sfx at={c.fullThrottle + 4} name="stamp" volume={0.44} />
    <Sfx at={c.reactors} name="rumble" volume={0.42} />
    <Sfx at={c.years25} name="chime" volume={0.46} />
    <Sfx at={c.years25 + 4} name="stamp" volume={0.44} />
    <Sfx at={c.congrats} name="swell" volume={0.48} />
    <Sfx at={c.carrier} name="boom" volume={0.52} />
    <Sfx at={c.follow} name="pop" volume={0.46} />
    <Sfx at={c.because} name="ding" volume={0.44} />
  </>
);

export const CarrierReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.floating} color="#4ceeff" />
    <GlitchCut at={c.electromagnetic} color="#6af4ff" />
    <GlitchCut at={c.plotTwist} color="#ff9b42" />
    <GlitchCut at={c.reactors} color="#44eeff" />
    <FilmLook vignette={0.22} />
    <Captions
      words={words}
      palette={P}
      variant="word"
      y={0.5}
      highlight={[
        "banned",
        "ocean.",
        "100,000",
        "333",
        "75",
        "electromagnetic",
        "240",
        "two",
        "three",
        "turbines",
        "90",
        "throttle",
        "sky.",
        "nuclear",
        "25",
        "carrier.",
        "Follow,",
        "Because...",
      ]}
    />
    <Sound />
  </AbsoluteFill>
);
