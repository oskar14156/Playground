import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetNewton, SetOrion } from "./inserts";
import { SetCapsule, SetClimb, SetOrbit, SetReentry, SetSea } from "./sets";

export { DURATION } from "./cues";
const P = palettes.deep;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetOrbit },
  { from: c.space, C: SetSea },
  { from: c.ladder + 8, C: SetClimb },
  { from: c.because, C: SetOrbit },
  { from: c.falling, C: SetNewton },
  { from: c.cannon, C: SetSea },
  { from: c.y1958, C: SetOrion },
  { from: c.stages, C: SetSea },
  { from: c.tip - 2, C: SetClimb },
  { from: c.aroundToo, C: SetOrbit },
  { from: c.float, C: SetCapsule },
  { from: c.sunrises, C: SetOrbit },
  { from: c.steak, C: SetCapsule },
  { from: c.grab, C: SetOrbit },
  { from: c.home, C: SetReentry },
  { from: c.chutes, C: SetSea },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("rocket/vo.mp3")} volume={1.12} />
    <MusicBed name="wonder_long" words={words} volume={0.24} cuts={[[c.bombs + 40, c.y1958 - 4]]} />
    <Sfx at={4} name="beep" volume={0.4} />
    <Sfx at={c.space} name="whoosh" volume={0.4} />
    <Sfx at={c.ladder} name="whoosh_fast" volume={0.5} />
    <Sfx at={c.ladder + 20} name="riser" volume={0.35} lead={0} />
    <Sfx at={c.letGo + 8} name="whoosh" volume={0.5} />
    <Sfx at={c.fall} name="whoosh_fast" volume={0.5} />
    <Sfx at={c.because} name="whoosh" volume={0.4} />
    <Sfx at={c.falling + 2} name="pop" volume={0.5} />
    <Sfx at={c.falling + 14} name="pop" volume={0.5} />
    <Sfx at={c.missing - 8} name="pop" volume={0.5} />
    <Sfx at={c.missing + 30} name="chime" volume={0.4} />
    <Sfx at={c.cannon} name="thud" volume={0.5} />
    <Sfx at={c.kick + 6} name="impact" volume={0.9} />
    <Sfx at={c.pancake + 2} name="thud" volume={0.6} />
    {Array.from({ length: 8 }, (_, i) => (
      <Sfx key={i} at={c.throwBack + i * 13 + 6} name="pop" volume={0.45} />
    ))}
    <Sfx at={c.rocket} name="swell" volume={0.5} />
    <Sfx at={c.fuel} name="beep" volume={0.45} />
    <Sfx at={c.bombs + 38} name="impact" volume={0.7} />
    <Sfx at={c.joke} name="glitch" volume={0.6} />
    <Sfx at={c.y1958} name="whoosh" volume={0.4} />
    <Ticks from={c.atom - 4} to={c.cancelled} every={12} volume={0.4} />
    <Sfx at={c.cancelled + 2} name="thud" volume={0.7} />
    <Sfx at={c.stages + 4} name="pop" volume={0.5} />
    <Sfx at={c.drop} name="pop" volume={0.5} />
    <Sfx at={c.launch} name="riser" volume={0.4} />
    <Sfx at={c.launch + 2} name="impact" volume={0.7} />
    <Sfx at={c.tip} name="whoosh" volume={0.45} />
    <Sfx at={c.tip + 30} name="thud" volume={0.5} />
    <Sfx at={c.aroundToo + 6} name="chime" volume={0.45} />
    <Sfx at={c.float} name="whoosh" volume={0.35} />
    <Ticks from={c.sunrises} to={c.steak} every={4} volume={0.3} />
    <Sfx at={c.steak + 6} name="pop" volume={0.5} />
    <Sfx at={c.sandwich} name="whoosh_fast" volume={0.4} />
    <Sfx at={c.crumbs - 4} name="glitch" volume={0.4} />
    <Sfx at={c.congress} name="thud" volume={0.55} />
    <Sfx at={c.grab + 20} name="pop" volume={0.5} />
    <Sfx at={c.home} name="riser" volume={0.45} />
    <Sfx at={c.shield} name="glitch" volume={0.3} />
    <Sfx at={c.chutes} name="whoosh" volume={0.5} />
    <Sfx at={c.splash + 8} name="splash" volume={0.8} />
    <Sfx at={c.congrats} name="chime" volume={0.6} />
    <Sfx at={c.built + 40} name="thud" volume={0.45} />
    <Sfx at={c.theRocket} name="pop" volume={0.5} />
    <Sfx at={c.theRocket + 62} name="chime" volume={0.45} />
  </>
);

export const RocketReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.falling} color="#ffffff" />
    <GlitchCut at={c.y1958} color="#ffd23f" />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["1958", "1965", "Orion"]} />
    <Sound />
  </AbsoluteFill>
);
