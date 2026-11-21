import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { Set1911, SetApollo, SetClip1911, SetEscape, SetFans, SetFinale, SetHook, SetLetter, SetOwnRoom, SetPassword, SetPicasso, SetPyramid, SetQuai, SetQueue, SetTrunk, SetTwist } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.y1911, C: SetClip1911 },
  { from: c.monday, C: Set1911 },
  { from: c.police, C: SetPicasso },
  { from: c.trunk, C: SetTrunk },
  { from: c.sell, C: SetLetter },
  { from: c.twist, C: SetTwist },
  { from: c.fans, C: SetFans },
  { from: c.queue, C: SetQueue },
  { from: c.entrance, C: SetPyramid },
  { from: c.back, C: SetQuai },
  { from: c.skip, C: SetApollo },
  { from: c.minutes, C: SetEscape },
  { from: c.password, C: SetPassword },
  { from: c.ownRoom, C: SetOwnRoom },
  { from: c.congrats, C: SetFinale },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("louvre/vo.mp3")} volume={1.25} />
    <MusicBed name="tension" words={words} volume={0.2} cuts={[[c.joke + 2, c.isnt + 6]]} />
    <Sfx at={4} name="shutter" volume={0.35} />
    <Sfx at={c.million} name="whoosh" volume={0.35} />
    <Ticks from={c.million + 2} to={c.million + 24} every={2} volume={0.18} />
    <Sfx at={c.steal} name="scratch" volume={0.35} />
    <Sfx at={c.glassCase} name="clang" volume={0.3} />
    <Sfx at={c.steals} name="creak" volume={0.4} />
    <Sfx at={c.dumb} name="boom" volume={0.35} />
    <Sfx at={c.y1911} name="whoosh" volume={0.4} />
    <Sfx at={c.y1911 + 16} name="stamp" volume={0.5} />
    <Sfx at={c.monday} name="whoosh" volume={0.3} />
    <Sfx at={c.plumber + 6} name="creak" volume={0.45} />
    <Sfx at={c.police} name="whoosh" volume={0.35} />
    <Sfx at={c.picasso + 8} name="stamp" volume={0.55} />
    <Sfx at={c.trunk + 4} name="creak" volume={0.4} />
    <Ticks from={c.years} to={c.sell - 2} every={3} volume={0.2} />
    <Sfx at={c.sell} name="whoosh" volume={0.3} />
    <Sfx at={c.leoWord} name="typing" volume={0.3} />
    <Sfx at={c.twist - 8} name="stamp" volume={0.5} />
    <Sfx at={c.twist} name="scratch" volume={0.45} />
    <Sfx at={c.free} name="cash" volume={0.5} />
    <Sfx at={c.fans} name="riser" volume={0.3} lead={0} />
    <Sfx at={c.rock + 9} name="impact" volume={0.55} />
    <Sfx at={c.paint + 9} name="splash" volume={0.45} />
    <Sfx at={c.teacup + 9} name="clang" volume={0.4} />
    <Sfx at={c.soup + 9} name="splash" volume={0.5} />
    <Sfx at={c.grandma} name="creak" volume={0.3} />
    <Sfx at={c.cake + 13} name="splash" volume={0.55} />
    <Sfx at={c.cake + 15} name="boom" volume={0.35} />
    <Sfx at={c.bullet + 6} name="clang" volume={0.45} />
    <Sfx at={c.ac} name="hum" volume={0.3} />
    <Sfx at={c.queue} name="whoosh" volume={0.35} />
    <Ticks from={c.seconds} to={c.seconds + 60} every={4} volume={0.2} />
    <Sfx at={c.entrance} name="whoosh" volume={0.35} />
    <Sfx at={c.pyramid} name="swell" volume={0.4} />
    <Ticks from={c.panes} to={c.not666 - 4} every={2} volume={0.16} />
    <Sfx at={c.not666 + 6} name="scratch" volume={0.4} />
    <Sfx at={c.back} name="whoosh" volume={0.35} />
    <Sfx at={c.truck + 4} name="hum" volume={0.35} />
    <Sfx at={c.skip - 10} name="impact" volume={0.6} />
    <Sfx at={c.skip - 9} name="glitch" volume={0.35} />
    <Sfx at={c.skip} name="whoosh" volume={0.3} />
    <Sfx at={c.jewels + 2} name="scratch" volume={0.35} />
    <Sfx at={c.jewels + 13} name="impact" volume={0.45} />
    <Sfx at={c.jewels + 16} name="cash" volume={0.45} />
    <Sfx at={c.minutes} name="whoosh" volume={0.3} />
    <Sfx at={c.minutes + 8} name="whoosh_fast" volume={0.45} />
    <Sfx at={c.minutes + 4} name="clang" volume={0.35} />
    <Sfx at={c.password} name="typing" volume={0.4} />
    <Sfx at={c.itWas + 4} name="typing" volume={0.4} />
    <Sfx at={c.joke - 2} name="ding" volume={0.4} />
    <Sfx at={c.isnt} name="boom" volume={0.55} />
    <Sfx at={c.isnt + 2} name="stamp" volume={0.45} />
    <Sfx at={c.ownRoom} name="whoosh" volume={0.3} />
    <Sfx at={c.ownEntrance} name="pop" volume={0.35} />
    <Sfx at={c.ticket} name="ding" volume={0.4} />
    <Sfx at={c.plan} name="pop" volume={0.35} />
    <Sfx at={c.congrats} name="swell" volume={0.45} />
    <Sfx at={c.palace} name="rumble" volume={0.35} />
    <Sfx at={c.pyrTop + 2} name="pop" volume={0.4} />
    <Sfx at={c.callIt} name="clap" volume={0.3} />
    <Sfx at={c.louvre} name="boom" volume={0.4} />
    <Sfx at={c.follow} name="pop" volume={0.45} />
    <Sfx at={c.follow + 25} name="ding" volume={0.4} />
  </>
);

export const LouvreReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.y1911} color="#ffe2a8" />
    <GlitchCut at={c.twist} color="#ffd23f" />
    <GlitchCut at={c.password} color="#5cff9a" />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["viral.", "10", "1911,", "Picasso.", "2", "Leonardo.", "twist.", "1956", "bulletproof,", "30", "673", "666,", "2025,", "88", "7", "2014,", "Louvre.", "Louvre"]} />
    <Sound />
  </AbsoluteFill>
);
