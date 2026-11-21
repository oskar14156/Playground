import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { CleopatraTimeline, DjehutihotepPainting, MererPapyrus } from "./inserts";
import {
  SetAliens,
  SetBackrooms,
  SetBent,
  SetCrew,
  SetFinale,
  SetFriend,
  SetGreat,
  SetHole,
  SetMastaba,
  SetPrecision,
  SetQuake,
  SetRamp,
  SetRiver,
  SetRobbers,
  SetScan,
  SetSled,
  SetStep,
  SetTourists,
} from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const Painting: React.FC<{ f: number }> = ({ f }) => <DjehutihotepPainting f={f} at={c.painting} />;
const Merer: React.FC<{ f: number }> = ({ f }) => <MererPapyrus f={f} at={c.merer} oldest={c.oldest} diary={c.diary} />;
const Record: React.FC<{ f: number }> = ({ f }) => <CleopatraTimeline f={f} at={c.tallest} cleo={c.cleo} />;

/** `over`: a 2D insert that fades in over the previous set (no black frame at the cut). */
const SETS: { from: number; C: React.FC<{ f: number }>; over?: boolean }[] = [
  { from: 0, C: SetFriend },
  { from: c.dig, C: SetHole },
  { from: c.bench, C: SetMastaba },
  { from: c.stack, C: SetStep },
  { from: c.smooth, C: SetBent },
  { from: c.bigger2, C: SetGreat },
  { from: c.sleds, C: SetSled },
  { from: c.painting, C: Painting, over: true },
  { from: c.nile, C: SetRiver },
  { from: c.merer, C: Merer, over: true },
  { from: c.who, C: SetCrew },
  { from: c.up, C: SetRamp },
  { from: c.north, C: SetPrecision },
  { from: c.robbers, C: SetRobbers },
  { from: c.tourists, C: SetTourists },
  { from: c.white, C: SetQuake },
  { from: c.scan, C: SetScan },
  { from: c.backrooms, C: SetBackrooms },
  { from: c.aliens, C: SetAliens },
  { from: c.tallest, C: Record, over: true },
  { from: c.congrats, C: SetFinale },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const i = SETS.filter((s) => s.from <= f).length - 1;
  const active = SETS[i];
  const Prev = active.over && i > 0 && f < active.from + 12 ? SETS[i - 1].C : null;
  return (
    <>
      {Prev ? <Prev f={f} /> : null}
      <active.C f={f} />
    </>
  );
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("pyramid/vo.mp3")} volume={1.32} />
    <MusicBed name="wonder" words={words} volume={0.22} cuts={[[c.backrooms - 2, c.aliens]]} />
    <Sfx at={c.forever} name="boom" volume={0.42} />
    <Sfx at={c.age} name="pop" volume={0.4} />
    <Sfx at={c.steal + 2} name="stamp" volume={0.6} />
    <Sfx at={c.dig} name="whoosh" volume={0.3} />
    <Sfx at={c.robbers1} name="scratch" volume={0.45} />
    <Sfx at={c.robbers1 + 8} name="creak" volume={0.3} />
    <Sfx at={c.bench + 6} name="thud" volume={0.55} />
    <Sfx at={c.mastaba} name="pop" volume={0.4} />
    <Sfx at={c.bigger1} name="boom" volume={0.4} />
    <Sfx at={c.stack} name="riser" volume={0.3} lead={0} />
    <Sfx at={c.first} name="chime" volume={0.4} />
    <Sfx at={c.smooth} name="whoosh" volume={0.35} />
    <Sfx at={c.risky} name="beep" volume={0.35} />
    <Sfx at={c.switch43 + 8} name="ping" volume={0.4} />
    <Sfx at={c.patch} name="glitch" volume={0.4} />
    <Sfx at={c.patch + 4} name="typing" volume={0.35} />
    <Sfx at={c.bigger2} name="riser" volume={0.35} lead={0} />
    <Sfx at={c.m146 + 4} name="bass808" volume={0.45} />
    <Sfx at={c.liberty} name="pop" volume={0.4} />
    <Ticks from={c.blocks - 6} to={c.blocks + 22} every={2} volume={0.22} />
    <Sfx at={c.heavy} name="thud" volume={0.45} />
    <Ticks from={c.finish} to={c.sleds} every={8} volume={0.2} />
    <Sfx at={c.sleds} name="creak" volume={0.45} />
    <Sfx at={c.water + 4} name="splash" volume={0.45} />
    <Sfx at={c.study} name="swell" volume={0.3} />
    <Sfx at={c.painting} name="whoosh" volume={0.4} />
    <Sfx at={c.painting + 6} name="shutter" volume={0.4} />
    <Sfx at={c.nile} name="whoosh" volume={0.4} />
    <Sfx at={c.granite} name="ping" volume={0.35} />
    <Sfx at={c.boats} name="splash" volume={0.3} />
    <Sfx at={c.merer} name="whoosh" volume={0.4} />
    <Sfx at={c.diary} name="pop" volume={0.45} />
    <Sfx at={c.who} name="whoosh" volume={0.35} />
    <Sfx at={c.who + 10} name="stamp" volume={0.6} />
    <Sfx at={c.paid} name="cash" volume={0.35} />
    <Sfx at={c.loaves} name="pop" volume={0.4} />
    <Sfx at={c.friends} name="ding" volume={0.3} />
    <Sfx at={c.drunk} name="pop" volume={0.45} />
    <Sfx at={c.up} name="whoosh" volume={0.35} />
    <Sfx at={c.honest} name="scratch" volume={0.4} />
    <Sfx at={c.bro} name="boom" volume={0.5} />
    <Sfx at={c.north} name="whoosh" volume={0.4} />
    <Sfx at={c.north + 14} name="ping" volume={0.35} />
    <Sfx at={c.flat + 8} name="ding" volume={0.3} />
    <Sfx at={c.cover} name="chime" volume={0.4} />
    <Sfx at={c.robbers} name="glitch" volume={0.4} />
    <Sfx at={c.plugs + 6} name="thud" volume={0.55} />
    <Sfx at={c.around} name="riser" volume={0.3} lead={0} />
    <Sfx at={c.tourists} name="whoosh" volume={0.4} />
    <Sfx at={c.white} name="whoosh" volume={0.35} />
    <Sfx at={c.quake} name="impact" volume={0.45} />
    <Sfx at={c.quake + 2} name="rumble" volume={0.55} />
    <Sfx at={c.cairo} name="whoosh" volume={0.4} />
    <Sfx at={c.scan} name="glitch" volume={0.4} />
    <Ticks from={c.scan + 4} to={c.found} every={4} volume={0.18} />
    <Sfx at={c.found + 6} name="ping" volume={0.45} />
    <Sfx at={c.nobodyIn} name="thud" volume={0.5} />
    <Sfx at={c.backrooms - 2} name="glitch" volume={0.5} />
    {Array.from({ length: Math.ceil((c.aliens - c.backrooms) / 84) }, (_, k) => (
      <Sfx key={k} at={c.backrooms + k * 84} name="hum" volume={0.28} />
    ))}
    <Sfx at={c.aliens} name="ufo" volume={0.35} />
    <Sfx at={c.busy + 6} name="whoosh_fast" volume={0.5} />
    <Sfx at={c.a51} name="ding" volume={0.3} />
    <Sfx at={c.tallest} name="whoosh" volume={0.4} />
    <Sfx at={c.cleo + 8} name="ping" volume={0.35} />
    <Sfx at={c.congrats} name="chime" volume={0.6} />
    {[0, 36, 72].map((k) => (
      <Sfx key={k} at={c.congrats + 10 + k} name="clap" volume={0.3} />
    ))}
    <Sfx at={c.great} name="swell" volume={0.5} />
  </>
);

export const PyramidReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.robbers} color="#ffd28a" />
    <GlitchCut at={c.scan} color="#7af0ff" />
    <GlitchCut at={c.backrooms} color="#e8d870" />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["2.3", "25.", "Imhotep", "54", "43.", "146", "20", "Merer", "Khufu.", "Menkaure.", "1303,", "2017,", "3,800", "Cleopatra"]} />
    <Sound />
  </AbsoluteFill>
);
