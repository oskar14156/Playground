import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetBlobs, SetCctv, SetCoil, SetGlass, SetKey, SetLamp, SetLobby, SetOutro, SetWall, SetWant, SetWhy } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

// Set list (storyboard.md). Each set mounts only while active; hard cuts between them.
const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetWall },
  { from: c.lobby, C: SetLobby },
  { from: c.camera, C: SetCctv },
  { from: c.every, C: SetBlobs },
  { from: c.andRandom, C: SetKey },
  { from: c.why, C: SetWhy },
  { from: c.inside, C: SetLamp },
  { from: c.trick, C: SetGlass },
  { from: c.coil, C: SetCoil },
  { from: c.want, C: SetWant },
  { from: c.because, C: SetOutro },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("lava-lamp/vo.mp3")} />
    <MusicBed name="wonder" words={words} volume={0.28} />
    <Sfx at={0} name="thud" volume={0.4} />
    <Sfx at={c.lobby} name="whoosh" volume={0.45} />
    <Sfx at={c.camera} name="beep" volume={0.5} />
    <Sfx at={c.every} name="whoosh" volume={0.45} />
    <Ticks from={c.random} to={c.andRandom} every={3} volume={0.25} />
    <Sfx at={c.andRandom} name="glitch" volume={0.4} />
    <Sfx at={c.guess} name="pop" volume={0.7} />
    <Sfx at={c.why} name="whoosh_fast" volume={0.5} />
    <Sfx at={c.inside} name="swell" volume={0.4} />
    <Sfx at={c.bulb} name="riser" volume={0.35} />
    <Sfx at={c.lighter} name="whoosh" volume={0.4} />
    <Sfx at={c.top} name="thud" volume={0.45} />
    <Sfx at={c.floats} name="pop" />
    <Sfx at={c.heavier} name="thud" volume={0.55} />
    <Sfx at={c.melt} name="chime" volume={0.5} />
    <Sfx at={c.want} name="swell" volume={0.4} />
    <Sfx at={c.linked} name="pop" volume={0.6} />
    <Sfx at={c.hour} name="tick" volume={0.5} />
    <Sfx at={c.because} name="whoosh" volume={0.45} />
  </>
);

export const LavaLampReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <GlitchCut at={c.why} color="#ffb070" />
    <LoopBridge frames={14} opening={<World />} />
    <FilmLook vignette={0.4} />
    <Captions words={words} palette={P} variant="punch" y={0.74} highlight={["encrypt", "random", "guess", "lighter", "rises", "sinks", "floats", "heavier", "coil", "linked", "same"]} />
    <Sound />
  </AbsoluteFill>
);
