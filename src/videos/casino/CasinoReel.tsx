import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetChips, SetClocks, SetHook, SetLayout, SetLdw, SetRoulette, SetScale, SetFinale, SetSecurity, SetSlots, SetVents } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.checksTime, C: SetClocks },
  { from: c.mazes, C: SetLayout },
  { from: c.cashHurts, C: SetChips },
  { from: c.fairBet, C: SetRoulette },
  { from: c.slots, C: SetSlots },
  { from: c.betOne, C: SetLdw },
  { from: c.oxygen, C: SetVents },
  { from: c.wait, C: SetSecurity },
  { from: c.billion72, C: SetScale },
  { from: c.allIn, C: SetFinale },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("casino/vo.mp3")} volume={1.25} />
    <MusicBed
      name="wonder"
      words={words}
      volume={0.18}
      cuts={[
        [c.totalMyth, c.oneSpark],
        [c.wait, c.counting],
      ]}
    />
    {/* Hook */}
    <Sfx at={c.betsIt} name="cash" volume={0.48} />
    <Sfx at={c.wins} name="ding" volume={0.42} />
    <Sfx at={c.door} name="whoosh_fast" volume={0.35} />
    <Sfx at={c.neverLeaves} name="clang" volume={0.48} />
    <Sfx at={c.neverLeaves + 3} name="stamp" volume={0.45} />
    {/* Clocks & Layout */}
    <Sfx at={c.checksTime} name="tick" volume={0.35} />
    <Sfx at={c.ripOut} name="impact" volume={0.45} />
    <Sfx at={c.mazes} name="whoosh" volume={0.38} />
    <Sfx at={c.plotTwist} name="scratch" volume={0.45} />
    <Sfx at={c.bellagio} name="swell" volume={0.48} />
    {/* Chips & Drinks */}
    <Sfx at={c.cashHurts} name="whoosh" volume={0.35} />
    <Sfx at={c.swapChips} name="cash" volume={0.48} />
    <Sfx at={c.freeDrinks} name="chime" volume={0.42} />
    {/* Roulette */}
    <Sfx at={c.fairBet} name="whoosh" volume={0.38} />
    <Ticks from={c.roulette} to={c.houseWins} every={4} volume={0.22} />
    <Sfx at={c.edge27} name="ding" volume={0.4} />
    <Sfx at={c.doubleZero} name="ding" volume={0.42} />
    <Sfx at={c.tripleZero} name="ding" volume={0.46} />
    <Sfx at={c.houseWins} name="boom" volume={0.5} />
    {/* Slots & Virtual Reel */}
    <Sfx at={c.slots} name="clang" volume={0.42} />
    <Sfx at={c.patent1984} name="glitch" volume={0.42} />
    <Sfx at={c.oneNotch} name="scratch" volume={0.45} />
    <Sfx at={c.oneNotch + 4} name="stamp" volume={0.48} />
    {/* Loss Disguised as a Win */}
    <Sfx at={c.betOne} name="whoosh" volume={0.38} />
    <Sfx at={c.bellsCrazy} name="chime" volume={0.5} />
    <Sfx at={c.bellsCrazy + 4} name="cash" volume={0.42} />
    <Sfx at={c.walletShrinks} name="boom" volume={0.48} />
    {/* Oxygen Myth */}
    <Sfx at={c.oxygen} name="rumble" volume={0.38} />
    <Sfx at={c.totalMyth} name="glitch" volume={0.44} />
    <Sfx at={c.oneSpark} name="boom" volume={0.55} />
    <Sfx at={c.coolAir} name="pop" volume={0.42} />
    {/* Card Counting & Security */}
    <Sfx at={c.wait} name="scratch" volume={0.45} />
    <Sfx at={c.banHim} name="impact" volume={0.5} />
    <Sfx at={c.banHim + 3} name="stamp" volume={0.48} />
    <Sfx at={c.ceilingDomes} name="typing" volume={0.38} />
    <Sfx at={c.rfid} name="pop" volume={0.42} />
    {/* Scale & Finale */}
    <Sfx at={c.billion72} name="swell" volume={0.48} />
    <Sfx at={c.billion72 + 6} name="cash" volume={0.45} />
    <Sfx at={c.allIn} name="whoosh" volume={0.4} />
    <Sfx at={c.grandma} name="clap" volume={0.45} />
    <Sfx at={c.grandma + 3} name="boom" volume={0.5} />
    <Sfx at={c.congrats} name="swell" volume={0.48} />
    <Sfx at={c.theCasino} name="boom" volume={0.52} />
    <Sfx at={c.follow} name="pop" volume={0.46} />
    <Sfx at={c.greenZeroEnd} name="ding" volume={0.48} />
  </>
);

export const CasinoReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.plotTwist} color="#ffd23f" />
    <GlitchCut at={c.patent1984} color="#42e8ff" />
    <GlitchCut at={c.totalMyth} color="#ff5a26" />
    <GlitchCut at={c.banHim} color="#ff3b30" />
    <FilmLook vignette={0.22} />
    <Captions
      words={words}
      palette={P}
      variant="word"
      y={0.5}
      highlight={[
        "100",
        "door.",
        "leaves.",
        "clock",
        "window.",
        "twist.",
        "1.6",
        "billion",
        "more.",
        "chips.",
        "free.",
        "zero.",
        "2.7",
        "doubled",
        "triples",
        "wins.",
        "22",
        "1984",
        "virtual",
        "near",
        "miss.",
        "1",
        "40",
        "crazy.",
        "loss",
        "win.",
        "myth.",
        "spark",
        "cool",
        "Wait.",
        "legal.",
        "ban",
        "RFID",
        "72",
        "grandma.",
        "casino.",
        "Follow,",
      ]}
    />
    <Sound />
  </AbsoluteFill>
);
