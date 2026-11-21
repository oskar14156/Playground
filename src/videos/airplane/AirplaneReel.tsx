import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetAustralia, SetBedroom, SetClimb, SetDoor, SetField, SetFinale, SetGlobe, SetHangar, SetLav, SetMap, SetMeal, SetSeat, SetStorm, SetTail, SetWindow } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetBedroom },
  { from: c.needs, C: SetGlobe },
  { from: c.wings, C: SetField },
  { from: c.alu, C: SetHangar },
  { from: c.low, C: SetClimb },
  { from: c.every, C: SetWindow },
  { from: c.pressure, C: SetDoor },
  { from: c.food, C: SetMeal },
  { from: c.ocean, C: SetStorm },
  { from: c.toilet, C: SetLav },
  { from: c.wrong, C: SetTail },
  { from: c.screen, C: SetMap },
  { from: c.later, C: SetAustralia },
  { from: c.back, C: SetSeat },
  { from: c.congrats, C: SetFinale },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("airplane/vo.mp3")} volume={1.32} />
    <MusicBed name="wonder_long" words={words} volume={0.22} />
    <Sfx at={c.australia} name="pop" volume={0.4} />
    <Sfx at={c.down} name="boom" volume={0.45} />
    <Sfx at={c.slept} name="stamp" volume={0.4} />
    <Sfx at={c.needs} name="whoosh" volume={0.4} />
    <Ticks from={c.km} to={c.km + 30} every={2} volume={0.2} />
    <Sfx at={c.ship} name="ding" volume={0.3} />
    <Sfx at={c.wings} name="whoosh" volume={0.4} />
    <Sfx at={c.first + 6} name="whoosh_fast" volume={0.4} />
    <Sfx at={c.shorter + 8} name="boom" volume={0.45} />
    <Sfx at={c.wood + 20} name="creak" volume={0.45} />
    <Sfx at={c.wood + 22} name="stamp" volume={0.55} />
    <Sfx at={c.alu} name="whoosh" volume={0.4} />
    <Ticks from={c.alu + 4} to={c.alu + 40} every={3} volume={0.18} />
    <Sfx at={c.alu + 42} name="ding" volume={0.3} />
    <Sfx at={c.prop + 18} name="scratch" volume={0.4} />
    <Sfx at={c.jets + 8} name="clang" volume={0.35} />
    <Sfx at={c.jets + 18} name="thud" volume={0.5} />
    <Sfx at={c.suck} name="thud" volume={0.45} />
    <Sfx at={c.squeeze} name="thud" volume={0.45} />
    <Sfx at={c.bang} name="impact" volume={0.4} />
    <Sfx at={c.blow} name="boom" volume={0.5} />
    <Sfx at={c.low} name="whoosh" volume={0.45} />
    <Sfx at={c.fly11} name="riser" volume={0.3} lead={0} />
    <Sfx at={c.drag} name="ding" volume={0.3} />
    <Sfx at={c.breathe} name="glitch" volume={0.35} />
    <Sfx at={c.pump + 6} name="pop" volume={0.4} />
    <Sfx at={c.every} name="whoosh" volume={0.35} />
    <Sfx at={c.y1954} name="impact" volume={0.4} />
    <Sfx at={c.cracks + 6} name="creak" volume={0.45} />
    <Sfx at={c.round + 6} name="ding" volume={0.4} />
    <Sfx at={c.pressure} name="whoosh" volume={0.35} />
    <Sfx at={c.tonnes} name="thud" volume={0.55} />
    <Sfx at={c.cant + 8} name="creak" volume={0.35} />
    <Sfx at={c.tried} name="boom" volume={0.45} />
    <Sfx at={c.food} name="whoosh" volume={0.35} />
    <Sfx at={c.taste + 6} name="pop" volume={0.35} />
    <Sfx at={c.tomato} name="ding" volume={0.35} />
    <Sfx at={c.ocean} name="rumble" volume={0.45} />
    <Sfx at={c.ocean + 12} name="impact" volume={0.6} />
    <Sfx at={c.skin} name="riser" volume={0.25} lead={0} />
    <Sfx at={c.wicks + 4} name="glitch" volume={0.3} />
    <Sfx at={c.toilet} name="whoosh" volume={0.35} />
    <Sfx at={c.ashtray + 4} name="scratch" volume={0.45} />
    <Sfx at={c.law + 4} name="stamp" volume={0.45} />
    <Sfx at={c.anyway + 18} name="pop" volume={0.35} />
    <Sfx at={c.wrong} name="whoosh" volume={0.35} />
    <Sfx at={c.orange} name="boom" volume={0.5} />
    <Sfx at={c.survives} name="impact" volume={0.4} />
    <Sfx at={c.fire} name="whoosh_fast" volume={0.35} />
    <Sfx at={c.screen} name="whoosh" volume={0.3} />
    <Ticks from={c.crawling} to={c.later - 6} every={10} volume={0.15} />
    <Sfx at={c.later} name="swell" volume={0.4} />
    <Sfx at={c.grandma} name="chime" volume={0.45} />
    <Sfx at={c.back + 20} name="stamp" volume={0.45} />
    <Sfx at={c.cellos} name="pop" volume={0.35} />
    <Sfx at={c.katz + 22} name="stamp" volume={0.45} />
    <Sfx at={c.sleeps} name="chime" volume={0.4} />
    <Sfx at={c.congrats} name="swell" volume={0.4} />
    <Sfx at={c.callIt} name="clap" volume={0.3} />
    <Sfx at={c.airplane} name="boom" volume={0.4} />
  </>
);

export const AirplaneReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.ocean} color="#cfe0ff" />
    <GlitchCut at={c.wrong} color="#ff8a3a" />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["Australia.", "3", "17,000", "1903.", "12", "37", "11", "2,400", "1954,", "10", "30", "orange.", "3,400", "1,100", "20", "400"]} />
    <Sound />
  </AbsoluteFill>
);
