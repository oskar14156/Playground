import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetArrive, SetCableMap, SetFibre, SetFinale, SetFloor, SetGlobe, SetGrandma, SetHook, SetLay, SetPackets, SetPigeonGlobe, SetRoof, SetShip, SetShoot, SetToday } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.using, C: SetShoot },
  { from: c.lives, C: SetGlobe },
  { from: c.today, C: SetToday },
  { from: c.pigeon, C: SetRoof },
  { from: c.ocean, C: SetPigeonGlobe },
  { from: c.cable, C: SetLay },
  { from: c.light, C: SetFibre },
  { from: c.fades, C: SetFloor },
  { from: c.ship, C: SetShip },
  { from: c.photo, C: SetPackets },
  { from: c.herEnd, C: SetArrive },
  { from: c.notOne, C: SetCableMap },
  { from: c.detours, C: SetGrandma },
  { from: c.congrats, C: SetFinale },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("internet/vo.mp3")} volume={1.32} />
    <MusicBed name="wonder_long" words={words} volume={0.22} />
    <Sfx at={4} name="ding" volume={0.35} />
    <Sfx at={c.lives - 16} name="shutter" volume={0.5} />
    <Sfx at={c.lives} name="whoosh" volume={0.4} />
    <Ticks from={c.lives + 14} to={c.lives + 44} every={2} volume={0.18} />
    <Sfx at={c.today + 2} name="ding" volume={0.35} />
    <Sfx at={c.today + 6} name="boom" volume={0.45} />
    <Sfx at={c.pigeon} name="whoosh" volume={0.35} />
    <Sfx at={c.pigeon + 22} name="pop" volume={0.35} />
    <Sfx at={c.joke} name="scratch" volume={0.4} />
    <Sfx at={c.standard} name="stamp" volume={0.4} />
    <Sfx at={c.y2001} name="whoosh" volume={0.3} />
    <Sfx at={c.lost} name="scratch" volume={0.35} />
    <Sfx at={c.y2009} name="whoosh" volume={0.3} />
    <Sfx at={c.beat + 20} name="ding" volume={0.4} />
    <Sfx at={c.beat + 24} name="boom" volume={0.4} />
    <Sfx at={c.ocean} name="whoosh" volume={0.35} />
    <Sfx at={c.ocean + 50} name="splash" volume={0.45} />
    <Sfx at={c.cable} name="dialup" volume={0.3} />
    <Sfx at={c.y1858} name="typing" volume={0.35} />
    <Sfx at={c.hours16} name="typing" volume={0.3} />
    <Sfx at={c.weeks + 6} name="glitch" volume={0.35} />
    <Sfx at={c.weeks + 18} name="stamp" volume={0.5} />
    <Sfx at={c.voltage} name="boom" volume={0.35} />
    <Sfx at={c.light} name="riser" volume={0.3} lead={0} />
    <Sfx at={c.hair} name="pop" volume={0.35} />
    <Ticks from={c.runs} to={c.runs + 24} every={2} volume={0.18} />
    <Sfx at={c.theory + 6} name="whoosh_fast" volume={0.4} />
    <Sfx at={c.plane} name="scratch" volume={0.35} />
    <Sfx at={c.fades} name="whoosh" volume={0.35} />
    <Sfx at={c.amp} name="ding" volume={0.35} />
    <Sfx at={c.power + 10} name="hum" volume={0.3} />
    <Sfx at={c.deep} name="whoosh" volume={0.35} />
    <Sfx at={c.deep + 30} name="rumble" volume={0.4} />
    <Sfx at={c.hose} name="pop" volume={0.35} />
    <Sfx at={c.coast} name="whoosh" volume={0.35} />
    <Sfx at={c.steel} name="clang" volume={0.35} />
    <Sfx at={c.sharks + 18} name="thud" volume={0.5} />
    <Sfx at={c.google} name="pop" volume={0.35} />
    <Sfx at={c.twist} name="scratch" volume={0.45} />
    <Sfx at={c.twist + 4} name="stamp" volume={0.5} />
    <Ticks from={c.breaks} to={c.breaks + 24} every={2} volume={0.18} />
    <Sfx at={c.anchors + 6} name="impact" volume={0.5} />
    <Sfx at={c.ship} name="whoosh" volume={0.35} />
    <Sfx at={c.hook} name="clang" volume={0.35} />
    <Sfx at={c.photo} name="whoosh" volume={0.3} />
    <Sfx at={c.packets} name="glitch" volume={0.3} />
    <Sfx at={c.address} name="typing" volume={0.35} />
    <Sfx at={c.herEnd} name="whoosh" volume={0.35} />
    <Sfx at={c.herEnd + 34} name="ding" volume={0.4} />
    <Sfx at={c.notOne} name="whoosh" volume={0.35} />
    <Sfx at={c.six} name="riser" volume={0.25} lead={0} />
    <Sfx at={c.carry} name="ding" volume={0.35} />
    <Sfx at={c.detours} name="chime" volume={0.4} />
    <Sfx at={c.wearing + 6} name="shutter" volume={0.5} />
    <Sfx at={c.wearing + 8} name="boom" volume={0.45} />
    <Sfx at={c.three + 10} name="stamp" volume={0.5} />
    <Sfx at={c.congrats} name="swell" volume={0.4} />
    <Sfx at={c.callIt} name="clap" volume={0.3} />
    <Sfx at={c.internet} name="boom" volume={0.4} />
  </>
);

export const InternetReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.fades} color="#7ff6ff" />
    <GlitchCut at={c.twist} color="#ff8a3a" />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["Australia.", "17,000", "today.", "1990.", "2001,", "9", "5", "2009,", "1858.", "98", "16", "3", "hair.", "200,000", "20", "10,000", "8,000", "200", "2,000", "600.", "1.5", "99", "3"]} />
    <Sound />
  </AbsoluteFill>
);
