import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { LoopBridge } from "../../lib/Loop";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { Set1934, SetFinger, SetShape, SetSonar } from "./inserts";
import { SetWorld } from "./sets";

export { DURATION } from "./cues";
const P = palettes.deep;

// One continuous ocean world; inserts for the 1934 dive, the hull shape, the fingernail and the sonar screen.
const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetWorld },
  { from: c.y1934, C: Set1934 },
  { from: c.again, C: SetWorld },
  { from: c.flat, C: SetShape },
  { from: c.p300, C: SetWorld },
  { from: c.kilo, C: SetFinger },
  { from: c.breathe, C: SetWorld },
  { from: c.sound, C: SetSonar },
  { from: c.arm, C: SetWorld },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("submarine/vo.mp3")} volume={1.12} />
    <MusicBed name="wonder_long" words={words} volume={0.24} cuts={[[c.reactor + 16, c.joke]]} />
    <Sfx at={c.dropped + 21} name="splash" volume={0.7} />
    <Sfx at={c.sank} name="riser" volume={0.3} />
    <Sfx at={c.sank + 40} name="thud" volume={0.55} />
    <Sfx at={c.breath} name="whoosh" volume={0.4} />
    <Sfx at={c.breath + 25} name="splash" volume={0.6} />
    <Sfx at={c.breath + 30} name="bubbles" volume={0.4} />
    <Sfx at={c.ears} name="beep" volume={0.45} />
    <Sfx at={c.ears + 6} name="beep" volume={0.45} />
    <Sfx at={c.outAir} name="whoosh_fast" volume={0.5} />
    <Sfx at={c.glass} name="pop" volume={0.6} />
    <Sfx at={c.upside} name="whoosh" volume={0.4} />
    <Sfx at={c.inside + 8} name="splash" volume={0.45} />
    <Sfx at={c.squeezes} name="bubbles" volume={0.4} />
    <Sfx at={c.halfFull} name="pop" volume={0.5} />
    <Sfx at={c.ball} name="pop" volume={0.6} />
    <Ticks from={c.lower} to={c.y1934} every={4} volume={0.2} />
    <Sfx at={c.y1934} name="whoosh" volume={0.4} />
    <Ticks from={c.y1934 + 6} to={c.n923 + 8} every={3} volume={0.25} />
    <Sfx at={c.again} name="creak" volume={0.5} />
    <Sfx at={c.ends + 18} name="impact" volume={0.5} />
    <Sfx at={c.ends + 34} name="glitch" volume={0.4} />
    <Sfx at={c.cut} name="pop" volume={0.7} />
    <Sfx at={c.addTanks} name="pop" volume={0.6} />
    <Sfx at={c.rushes} name="bubbles" volume={0.6} />
    <Sfx at={c.blow} name="bubbles" volume={0.7} />
    <Sfx at={c.rise} name="whoosh" volume={0.35} />
    <Sfx at={c.never} name="thud" volume={0.5} />
    <Sfx at={c.stretch + 4} name="swell" volume={0.5} />
    <Sfx at={c.flat} name="glitch" volume={0.4} />
    <Sfx at={c.flat + 18} name="creak" volume={0.4} />
    <Sfx at={c.round} name="pop" volume={0.5} />
    <Sfx at={c.p300} name="whoosh" volume={0.4} />
    <Sfx at={c.n31} name="creak" volume={0.45} />
    <Sfx at={c.kilo + 16} name="impact" volume={0.6} />
    <Sfx at={c.breathe} name="whoosh" volume={0.35} />
    <Sfx at={c.co2} name="beep" volume={0.4} />
    <Sfx at={c.scrub + 4} name="pop" volume={0.5} />
    <Sfx at={c.machine + 4} name="pop" volume={0.5} />
    <Sfx at={c.oxygen} name="chime" volume={0.4} />
    <Sfx at={c.below} name="swell" volume={0.4} />
    <Sfx at={c.ping} name="ping" volume={0.8} />
    <Sfx at={c.ping + 26} name="ping" volume={0.45} />
    <Sfx at={c.sound} name="glitch" volume={0.35} />
    <Sfx at={c.echo + 4} name="ping" volume={0.6} />
    <Sfx at={c.echo + 44} name="beep" volume={0.5} />
    <Sfx at={c.arm} name="whoosh" volume={0.35} />
    <Sfx at={c.grab} name="thud" volume={0.5} />
    <Sfx at={c.blowT} name="bubbles" volume={0.7} />
    <Sfx at={c.up} name="riser" volume={0.3} />
    <Sfx at={c.empty} name="beep" volume={0.5} />
    <Sfx at={c.reactor + 4} name="swell" volume={0.55} />
    <Sfx at={c.joke} name="whoosh" volume={0.45} />
    <Sfx at={c.congrats - 4} name="splash" volume={0.6} />
    <Sfx at={c.congrats} name="chime" volume={0.6} />
    <Sfx at={c.theSub} name="pop" volume={0.5} />
    <Sfx at={c.built + 46} name="thud" volume={0.45} />
    <Sfx at={c.theSub + 40} name="whoosh" volume={0.35} />
    <Sfx at={c.theSub + 62} name="chime" volume={0.45} />
  </>
);

export const Submarine: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.again} color="#ffffff" />
    <GlitchCut at={c.sound} color="#5dfc8d" />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["1934", "923", "300", "31"]} />
    <Sound />
  </AbsoluteFill>
);
