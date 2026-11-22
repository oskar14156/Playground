import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import {
  SetBleach,
  SetFinale,
  SetFold,
  SetFranklin,
  SetHook,
  SetMicro,
  SetPen,
  SetPhotoshop,
  SetRibbon,
  SetScale,
  SetSecretService,
  SetUv,
  SetWash,
} from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.paper, C: SetWash },
  { from: c.folds, C: SetFold },
  { from: c.cashiers, C: SetPen },
  { from: c.bleaches, C: SetBleach },
  { from: c.thread, C: SetUv },
  { from: c.scans, C: SetPhotoshop },
  { from: c.press, C: SetMicro },
  { from: c.franklin, C: SetFranklin },
  { from: c.ribbon, C: SetRibbon },
  { from: c.wontStop, C: SetSecretService },
  { from: c.costs, C: SetScale },
  { from: c.grandma, C: SetFinale },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("dollar-bill/vo.mp3")} volume={1.25} />
    <MusicBed name="wonder" words={words} volume={0.18} cuts={[[c.joke + 2, c.isnt + 6]]} />
    {/* Hook */}
    <Sfx at={c.usedPuh} name="pop" volume={0.35} />
    <Sfx at={c.say100 + 4} name="cash" volume={0.5} />
    <Sfx at={c.broke} name="scratch" volume={0.35} />
    <Sfx at={c.printsHome} name="typing" volume={0.35} />
    <Sfx at={c.cantFake + 6} name="ding" volume={0.45} />
    {/* Paper + Wash + Fold */}
    <Sfx at={c.paper} name="whoosh" volume={0.4} />
    <Sfx at={c.mush} name="bubbles" volume={0.45} />
    <Sfx at={c.cotton} name="pop" volume={0.4} />
    <Sfx at={c.jeans} name="ding" volume={0.38} />
    <Sfx at={c.folds} name="whoosh_fast" volume={0.35} />
    <Ticks from={c.folds + 2} to={c.cashiers - 6} every={2} volume={0.22} />
    <Sfx at={c.cashiers - 4} name="clang" volume={0.42} />
    {/* Iodine Pen + Bleach */}
    <Sfx at={c.cashiers} name="whoosh" volume={0.35} />
    <Sfx at={c.fakeBlack + 4} name="scratch" volume={0.4} />
    <Sfx at={c.fakeBlack + 12} name="stamp" volume={0.52} />
    <Sfx at={c.cottonYellow + 8} name="ding" volume={0.42} />
    <Sfx at={c.bleaches} name="splash" volume={0.42} />
    <Sfx at={c.prints100 + 2} name="thud" volume={0.45} />
    <Sfx at={c.passes} name="boom" volume={0.45} />
    {/* UV Light */}
    <Sfx at={c.thread} name="whoosh" volume={0.35} />
    <Sfx at={c.uvLight} name="glitch" volume={0.4} />
    <Sfx at={c.uvLight + 4} name="hum" volume={0.35} />
    <Sfx at={c.realPink} name="ding" volume={0.45} />
    <Sfx at={c.hisBlue + 6} name="scratch" volume={0.38} />
    <Sfx at={c.busted} name="stamp" volume={0.55} />
    <Sfx at={c.busted + 2} name="boom" volume={0.5} />
    {/* Photoshop Block */}
    <Sfx at={c.scans} name="whoosh_fast" volume={0.38} />
    <Sfx at={c.scans + 6} name="typing" volume={0.35} />
    <Sfx at={c.blocked} name="glitch" volume={0.45} />
    <Sfx at={c.blocked + 2} name="impact" volume={0.45} />
    <Sfx at={c.dots} name="beep" volume={0.38} />
    <Sfx at={c.patched + 4} name="boom" volume={0.48} />
    {/* Microtech + Franklin */}
    <Sfx at={c.press} name="clang" volume={0.42} />
    <Sfx at={c.raised} name="swell" volume={0.38} />
    <Sfx at={c.colorShift} name="chime" volume={0.35} />
    <Sfx at={c.oursSays + 8} name="pop" volume={0.42} />
    <Sfx at={c.franklin} name="whoosh" volume={0.35} />
    <Sfx at={c.fakersFixed + 4} name="scratch" volume={0.4} />
    <Sfx at={c.fakersFixed + 12} name="stamp" volume={0.45} />
    {/* 3D Ribbon */}
    <Sfx at={c.ribbon} name="whoosh" volume={0.4} />
    <Sfx at={c.lenses} name="pop" volume={0.38} />
    <Sfx at={c.bells} name="chime" volume={0.45} />
    {/* Secret Service */}
    <Sfx at={c.wontStop} name="rumble" volume={0.4} />
    <Sfx at={c.police} name="impact" volume={0.45} />
    <Sfx at={c.isnt} name="boom" volume={0.58} />
    <Sfx at={c.isnt + 2} name="stamp" volume={0.5} />
    <Sfx at={c.y1865} name="glitch" volume={0.35} />
    <Sfx at={c.lincoln} name="pop" volume={0.38} />
    <Sfx at={c.y1901} name="ding" volume={0.38} />
    {/* Scale + Finale + Follow */}
    <Sfx at={c.costs} name="whoosh" volume={0.38} />
    <Sfx at={c.costs + 4} name="cash" volume={0.35} />
    <Sfx at={c.lasts24} name="pop" volume={0.38} />
    <Sfx at={c.outside} name="swell" volume={0.42} />
    <Sfx at={c.grandma} name="whoosh" volume={0.35} />
    <Sfx at={c.grandma + 12} name="ding" volume={0.4} />
    <Sfx at={c.congrats} name="swell" volume={0.48} />
    <Sfx at={c.callIt} name="clap" volume={0.35} />
    <Sfx at={c.hundredDollar} name="boom" volume={0.48} />
    <Sfx at={c.hundredDollar + 4} name="cash" volume={0.42} />
    <Sfx at={c.follow} name="pop" volume={0.45} />
    <Sfx at={c.secretEnd} name="ding" volume={0.45} />
  </>
);

export const DollarBillReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.uvLight} color="#b44cff" />
    <GlitchCut at={c.blocked} color="#ff4a55" />
    <GlitchCut at={c.franklin} color="#ffe2a8" />
    <GlitchCut at={c.y1865} color="#ffe2a8" />
    <FilmLook vignette={0.22} />
    <Captions
      words={words}
      palette={P}
      variant="word"
      y={0.5}
      highlight={[
        "used",
        "100",
        "broke,",
        "fake.",
        "mush",
        "75",
        "25",
        "jeans.",
        "4,000",
        "black.",
        "yellow.",
        "5",
        "passes.",
        "pink.",
        "blue.",
        "Busted.",
        "Blocked.",
        "patched.",
        "Pocket",
        "Puh.",
        "typos",
        "3D",
        "hundreds.",
        "joke.",
        "isn't.",
        "1865,",
        "Secret",
        "1901.",
        "11",
        "24",
        "80",
        "grandma.",
        "bill.",
        "Follow,",
      ]}
    />
    <Sound />
  </AbsoluteFill>
);
