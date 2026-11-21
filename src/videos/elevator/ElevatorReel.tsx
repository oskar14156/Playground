import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { MusicBed, Sfx } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetBrake, SetGovernor, SetOtis, SetWorld } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

// One continuous building; two inserts (brake close-up, 1854 flashback).
const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetWorld },
  { from: c.slack, C: SetBrake },
  { from: c.y1854, C: SetOtis },
  { from: c.faster, C: SetWorld },
  { from: c.wheel, C: SetGovernor },
  { from: c.several, C: SetWorld },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("elevator/vo.mp3")} />
    <MusicBed name="wonder" words={words} volume={0.26} />
    <Sfx at={c.stairs} name="whoosh" volume={0.4} />
    <Sfx at={c.corner + 6} name="thud" volume={0.5} />
    <Sfx at={c.box} name="pop" volume={0.6} />
    <Sfx at={c.counter + 4} name="thud" volume={0.5} />
    <Sfx at={c.snaps + 6} name="impact" volume={0.8} />
    <Sfx at={c.survive - 2} name="thud" volume={0.7} />
    <Sfx at={c.rails} name="glitch" volume={0.45} />
    <Sfx at={c.slack + 10} name="impact" volume={0.6} />
    <Sfx at={c.y1854} name="whoosh" volume={0.4} />
    <Sfx at={c.cut + 10} name="impact" volume={0.7} />
    <Sfx at={c.faster} name="riser" volume={0.35} />
    <Sfx at={c.fire} name="impact" volume={0.6} />
    <Sfx at={c.eachOne} name="pop" volume={0.5} />
    <Sfx at={c.empty} name="beep" volume={0.5} />
    <Sfx at={c.locked + 4} name="chime" volume={0.45} />
    <Sfx at={c.springs} name="thud" volume={0.5} />
    <Sfx at={c.reactor + 4} name="swell" volume={0.5} />
    <Sfx at={c.congrats} name="chime" volume={0.6} />
  </>
);

export const ElevatorReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <GlitchCut at={c.rails} color="#ffffff" />
    <GlitchCut at={c.locked} color="#ffffff" />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["1854"]} />
    <Sound />
  </AbsoluteFill>
);
