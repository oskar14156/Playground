import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { GlitchHud, GripGraph, Law1951, ManualQuote, OperatorMenu, TryExample } from "./inserts";
import { SetArcade, SetBait, SetClose, SetDeck, SetDrop, SetFinale, SetGamble, SetGarage, SetGlitch, SetInside, SetLobster, SetLonely, SetPower, SetXray } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const Menu: React.FC<{ f: number }> = ({ f }) => <OperatorMenu f={f} at={c.type} coin={c.type + 18} prize={c.prizeCosts + 4} profit={c.profit + 4} />;
const Manual: React.FC<{ f: number }> = ({ f }) => <ManualQuote f={f} at={c.real} hl={c.real + 10} />;
const Example: React.FC<{ f: number }> = ({ f }) => <TryExample f={f} cents={c.cents} seven={c.seven} every={c.fullEvery} pity={c.pity} />;
const Grip: React.FC<{ f: number }> = ({ f }) => <GripGraph f={f} at={c.settings} carry={c.weak} edge={c.edge - 8} />;
const Law: React.FC<{ f: number }> = ({ f }) => <Law1951 f={f} at={c.wait} stamp={c.devices} />;
const Glitch: React.FC<{ f: number }> = ({ f }) => (
  <>
    <SetGlitch f={f} />
    <GlitchHud f={f} at={c.glitch + 6} patch={c.patch} />
  </>
);

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetGarage },
  { from: c.glass, C: SetArcade },
  { from: c.down, C: SetClose },
  { from: c.nobody, C: SetLonely },
  { from: c.chip, C: SetXray },
  { from: c.type, C: Menu },
  { from: c.decides, C: SetPower },
  { from: c.real, C: Manual },
  { from: c.example, C: Example },
  { from: c.hugAgain, C: SetGamble },
  { from: c.settings, C: Grip },
  { from: c.edge, C: SetDrop },
  { from: c.chooses, C: SetInside },
  { from: c.wait, C: Law },
  { from: c.joystick, C: SetDeck },
  { from: c.top, C: SetBait },
  { from: c.runOut, C: SetLobster },
  { from: c.glitch, C: Glitch },
  { from: c.congrats, C: SetFinale },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("claw-machine/vo.mp3")} volume={1.32} />
    <MusicBed name="wonder" words={words} volume={0.2} cuts={[[c.edge + 30, c.close + 2], [c.congrats - 6, c.congrats + 2]]} />
    <Sfx at={0} name="thud" volume={0.45} />
    <Sfx at={12} name="pop" volume={0.35} />
    <Ticks from={c.plushies} to={c.plushies + 20} every={2} volume={0.22} />
    <Sfx at={c.glass} name="whoosh" volume={0.5} />
    <Sfx at={c.dollar + 4} name="ping" volume={0.45} />
    <Sfx at={c.every} name="whoosh_fast" volume={0.35} />
    <Sfx at={c.every + 22} name="pop" volume={0.5} />
    <Sfx at={c.every + 46} name="pop" volume={0.5} />
    <Sfx at={c.lunch} name="thud" volume={0.55} />
    <Sfx at={c.down} name="whoosh" volume={0.35} />
    <Ticks from={c.down + 4} to={c.down + 24} every={3} volume={0.2} />
    <Sfx at={c.hug} name="pop" volume={0.5} />
    <Sfx at={c.nobody} name="thud" volume={0.4} />
    <Sfx at={c.chip} name="glitch" volume={0.45} />
    <Sfx at={c.type} name="whoosh" volume={0.35} />
    <Sfx at={c.type + 18} name="tick" volume={0.45} />
    <Sfx at={c.prizeCosts + 4} name="tick" volume={0.45} />
    <Sfx at={c.profit + 4} name="tick" volume={0.45} />
    <Sfx at={c.decides} name="whoosh" volume={0.35} />
    <Sfx at={c.decides + 44} name="impact" volume={0.45} />
    <Sfx at={c.real} name="whoosh_fast" volume={0.35} />
    <Sfx at={c.example} name="whoosh" volume={0.35} />
    <Sfx at={c.cents} name="pop" volume={0.45} />
    <Sfx at={c.seven} name="pop" volume={0.45} />
    <Ticks from={c.fullEvery} to={c.fullEvery + 28} every={1.4} volume={0.18} />
    <Sfx at={c.fullEvery + 28} name="chime" volume={0.5} />
    <Sfx at={c.pity} name="swell" volume={0.45} />
    <Sfx at={c.hugAgain} name="whoosh" volume={0.35} />
    <Sfx at={c.gambling} name="pop" volume={0.45} />
    <Sfx at={c.dang1} name="thud" volume={0.45} />
    <Sfx at={c.dang2} name="thud" volume={0.5} />
    <Sfx at={c.settings} name="riser" volume={0.35} lead={0} />
    <Sfx at={c.edge} name="whoosh" volume={0.35} />
    <Sfx at={c.close} name="impact" volume={0.55} />
    <Sfx at={c.chooses} name="swell" volume={0.45} />
    <Sfx at={c.wait} name="whoosh_fast" volume={0.4} />
    <Sfx at={c.devices} name="thud" volume={0.7} />
    <Sfx at={c.joystick} name="whoosh" volume={0.35} />
    <Sfx at={c.joystick + 10} name="beep" volume={0.35} />
    <Sfx at={c.issue} name="impact" volume={0.5} />
    <Sfx at={c.top} name="whoosh" volume={0.35} />
    <Sfx at={c.grand} name="chime" volume={0.45} />
    <Sfx at={c.fit} name="pop" volume={0.45} />
    <Sfx at={c.next} name="whoosh_fast" volume={0.35} />
    <Sfx at={c.ball} name="ping" volume={0.55} />
    <Sfx at={c.runOut} name="thud" volume={0.4} />
    <Sfx at={c.lobsters} name="splash" volume={0.55} />
    <Sfx at={c.lobsters + 10} name="bubbles" volume={0.4} />
    <Sfx at={c.restaurants} name="pop" volume={0.45} />
    <Sfx at={c.cook} name="impact" volume={0.45} />
    <Sfx at={c.glitch} name="glitch" volume={0.55} />
    <Sfx at={c.climb} name="creak" volume={0.45} />
    <Sfx at={c.patch} name="beep" volume={0.4} />
    <Sfx at={c.congrats} name="chime" volume={0.6} />
    <Sfx at={c.name} name="swell" volume={0.5} />
  </>
);

export const ClawMachineReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.chip} color="#2ec4d6" />
    <GlitchCut at={c.glitch} color="#ff2fa0" />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["hug", "pity", "gambling", "skill", "issue", "steel", "ball", "lobsters", "cook", "glitch"]} />
    <Sound />
  </AbsoluteFill>
);
