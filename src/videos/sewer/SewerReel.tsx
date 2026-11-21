import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetBricks, SetFatberg, SetFinale, SetGator, SetHook, SetMuseum, SetParliament, SetPump, SetRain, SetRiver, SetScreens, SetStinkOutside, SetTideway, SetWipes } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.pipe, C: SetRiver },
  { from: c.y1854, C: SetPump },
  { from: c.y1858, C: SetStinkOutside },
  { from: c.smells, C: SetParliament },
  { from: c.tunnels, C: SetBricks },
  { from: c.rain, C: SetRain },
  { from: c.y2025, C: SetTideway },
  { from: c.wipes, C: SetWipes },
  { from: c.whitechapel, C: SetFatberg },
  { from: c.museum, C: SetMuseum },
  { from: c.ny, C: SetGator },
  { from: c.screens, C: SetScreens },
  { from: c.congrats, C: SetFinale },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("sewer/vo.mp3")} volume={1.25} />
    <MusicBed name="wonder" words={words} volume={0.18} cuts={[[c.joke + 2, c.isnt + 6]]} />
    <Sfx at={c.catches - 4} name="creak" volume={0.5} />
    <Sfx at={c.catches + 6} name="impact" volume={0.4} />
    <Sfx at={c.flushed} name="whoosh_fast" volume={0.35} />
    <Sfx at={c.flushed + 4} name="whoosh" volume={0.45} />
    <Sfx at={c.flushed + 8} name="splash" volume={0.4} />
    <Sfx at={c.down + 6} name="scratch" volume={0.35} />
    <Sfx at={c.andNow} name="whoosh_fast" volume={0.4} />
    <Sfx at={c.place} name="pop" volume={0.35} />
    <Sfx at={c.pipe + 6} name="pop" volume={0.3} />
    <Sfx at={c.done} name="stamp" volume={0.5} />
    <Sfx at={c.drinks} name="scratch" volume={0.35} />
    <Sfx at={c.everybody + 8} name="splash" volume={0.3} />
    <Sfx at={c.y1854} name="whoosh" volume={0.35} />
    <Ticks from={c.dirty + 4} to={c.handle - 4} every={3} volume={0.18} />
    <Sfx at={c.removed + 2} name="clang" volume={0.45} />
    <Sfx at={c.y1858} name="rumble" volume={0.35} />
    <Sfx at={c.parliament + 12} name="splash" volume={0.5} />
    <Sfx at={c.noWork + 4} name="boom" volume={0.4} />
    <Ticks from={c.law + 4} to={c.days + 6} every={2} volume={0.18} />
    <Sfx at={c.days + 8} name="stamp" volume={0.55} />
    <Sfx at={c.nothing + 6} name="whoosh_fast" volume={0.45} />
    <Sfx at={c.tunnels} name="clang" volume={0.35} />
    <Ticks from={c.bricks} to={c.bricks + 24} every={2} volume={0.16} />
    <Sfx at={c.twice} name="swell" volume={0.35} />
    <Sfx at={c.four} name="pop" volume={0.4} />
    <Sfx at={c.today} name="hum" volume={0.3} />
    <Sfx at={c.rain} name="rumble" volume={0.3} />
    <Sfx at={c.overflow} name="splash" volume={0.45} />
    <Sfx at={c.included} name="boom" volume={0.45} />
    <Ticks from={c.tonnes39} to={c.tonnes39 + 22} every={2} volume={0.16} />
    <Sfx at={c.y2025} name="rumble" volume={0.45} />
    <Sfx at={c.superSewer} name="impact" volume={0.5} />
    <Sfx at={c.wipes} name="glitch" volume={0.35} />
    <Sfx at={c.fatberg + 6} name="boom" volume={0.4} />
    <Sfx at={c.whitechapel} name="whoosh" volume={0.3} />
    <Sfx at={c.t130} name="impact" volume={0.4} />
    <Ticks from={c.buses} to={c.buses + 26} every={2} volume={0.2} />
    <Sfx at={c.museum} name="swell" volume={0.3} />
    <Sfx at={c.flies} name="hum" volume={0.3} />
    <Sfx at={c.stream} name="ding" volume={0.4} />
    <Sfx at={c.isnt} name="boom" volume={0.55} />
    <Sfx at={c.isnt + 2} name="stamp" volume={0.45} />
    <Sfx at={c.ny} name="whoosh" volume={0.35} />
    <Sfx at={c.gator} name="scratch" volume={0.45} />
    <Sfx at={c.screens} name="hum" volume={0.3} />
    <Sfx at={c.wipeWord} name="pop" volume={0.35} />
    <Sfx at={c.fatWord} name="pop" volume={0.35} />
    <Sfx at={c.gators} name="pop" volume={0.35} />
    <Sfx at={c.yourPuh + 6} name="ding" volume={0.45} />
    <Sfx at={c.yourPuh + 10} name="boom" volume={0.35} />
    <Sfx at={c.congrats} name="swell" volume={0.45} />
    <Sfx at={c.builtMiles} name="rumble" volume={0.3} />
    <Sfx at={c.liveFat} name="pop" volume={0.35} />
    <Sfx at={c.callIt} name="clap" volume={0.3} />
    <Sfx at={c.sewer} name="boom" volume={0.4} />
    <Sfx at={c.follow} name="pop" volume={0.45} />
    <Sfx at={c.follow + 25} name="ding" volume={0.4} />
    <Sfx at={c.flushIt} name="whoosh_fast" volume={0.45} />
  </>
);

export const SewerReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.y1854} color="#ffe2a8" />
    <GlitchCut at={c.wipes} color="#9bff8a" />
    <GlitchCut at={c.ny} color="#ffe2a8" />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["flushed", "river.", "1854,", "1858,", "bleach.", "18", "1,100", "318", "twice", "4", "2", "39", "2025,", "25", "70", "fatberg.", "130", "11", "flies,", "joke.", "1935,", "alligator", "Alligators.", "sewer.", "flush"]} />
    <Sound />
  </AbsoluteFill>
);
