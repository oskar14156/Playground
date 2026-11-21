import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { Bathrooms, Clipping } from "./inserts";
import { SetDay, SetNight, SetUnder } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const Clip2014: React.FC<{ f: number }> = ({ f }) => (
  <Clipping f={f} at={c.y2014} year="2014" head="Man runs straight in through the front door" sub="He climbed the fence, crossed the lawn and walked into the most famous house in the country." />
);
const Baths: React.FC<{ f: number }> = ({ f }) => <Bathrooms f={f} at={c.baths} />;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetNight },
  { from: c.y2014, C: Clip2014 },
  { from: c.lock, C: SetNight },
  { from: c.bunker, C: SetUnder },
  { from: c.baths, C: Baths },
  { from: c.codename, C: SetNight },
  { from: c.congrats, C: SetDay },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("white-house/vo.mp3")} volume={1.12} />
    <MusicBed name="tension" words={words} volume={0.22} cuts={[[c.joke + 2, c.isnt + 4]]} />
    <Sfx at={c.nice} name="pop" volume={0.5} />
    <Sfx at={c.walkIn + 28} name="creak" volume={0.5} />
    <Sfx at={c.y2014} name="whoosh" volume={0.45} />
    <Sfx at={c.y2014 + 16} name="thud" volume={0.6} />
    <Sfx at={c.lock} name="whoosh_fast" volume={0.4} />
    <Sfx at={c.lock + 13} name="thud" volume={0.6} />
    <Sfx at={c.newFence + 2} name="riser" volume={0.35} lead={0} />
    <Sfx at={c.truck} name="whoosh" volume={0.45} />
    <Sfx at={c.street + 6} name="impact" volume={0.85} />
    <Sfx at={c.anyway + 22} name="thud" volume={0.5} />
    <Sfx at={c.dogs + 6} name="whoosh_fast" volume={0.45} />
    <Sfx at={c.steps + 16} name="impact" volume={0.7} />
    <Sfx at={c.snipers} name="beep" volume={0.4} />
    {[10, 20, 30].map((d) => (
      <Sfx key={d} at={c.shoot + d} name="pop" volume={0.55} />
    ))}
    <Sfx at={c.glass + 2} name="glitch" volume={0.4} />
    <Sfx at={c.sky} name="riser" volume={0.4} />
    <Sfx at={c.crashed + 14} name="impact" volume={0.8} />
    <Sfx at={c.ban + 2} name="swell" volume={0.45} />
    <Sfx at={c.missiles + 6} name="thud" volume={0.5} />
    <Sfx at={c.joke} name="pop" volume={0.45} />
    <Sfx at={c.isnt} name="glitch" volume={0.6} />
    <Sfx at={c.drunk + 26} name="pop" volume={0.5} />
    <Sfx at={c.bunker} name="whoosh" volume={0.45} />
    <Sfx at={c.bowling + 30} name="impact" volume={0.6} />
    <Ticks from={c.baths} to={c.baths + 40} every={2} volume={0.25} />
    <Sfx at={c.codename + 4} name="beep" volume={0.4} />
    <Sfx at={c.fluffball} name="thud" volume={0.5} />
    <Sfx at={c.congrats} name="chime" volume={0.6} />
    <Sfx at={c.wh} name="swell" volume={0.5} />
  </>
);

export const WhiteHouseReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["2014", "1994", "2015", "Fluffball"]} />
    <Sound />
  </AbsoluteFill>
);
