import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetBunkerDefense, SetDoorCodes, SetGoldTwist, SetHook, SetPayoff, SetWalls } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.yards4200, C: SetWalls },
  { from: c.blastDoor, C: SetDoorCodes },
  { from: c.cityPower, C: SetBunkerDefense },
  { from: c.gold4500, C: SetGoldTwist },
  { from: c.congrats, C: SetPayoff },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("vault/vo.mp3")} volume={1.25} />
    <MusicBed
      name="wonder"
      words={words}
      volume={0.18}
      cuts={[
        [c.tinyFlaw, c.forgotWho],
        [c.splitCode, c.people10],
      ]}
    />
    <Sfx at={c.hook + 2} name="whoosh_fast" volume={0.42} />
    <Sfx at={c.safest} name="chime" volume={0.42} />
    <Sfx at={c.yards4200} name="rumble" volume={0.44} />
    <Sfx at={c.meterThick} name="clang" volume={0.46} />
    <Sfx at={c.meterThick + 4} name="stamp" volume={0.44} />
    <Sfx at={c.blastDoor} name="impact" volume={0.48} />
    <Sfx at={c.splitCode} name="glitch" volume={0.46} />
    <Sfx at={c.people10} name="typing" volume={0.4} />
    <Sfx at={c.people10 + 4} name="stamp" volume={0.44} />
    <Sfx at={c.cityPower} name="hum" volume={0.44} />
    <Sfx at={c.ownPower} name="stamp" volume={0.44} />
    <Sfx at={c.armyBase} name="glitch" volume={0.46} />
    <Sfx at={c.gold4500} name="chime" volume={0.48} />
    <Sfx at={c.tinyFlaw} name="scratch" volume={0.44} />
    <Sfx at={c.forgotWho} name="glitch" volume={0.48} />
    <Sfx at={c.forgotWho + 4} name="stamp" volume={0.46} />
    <Sfx at={c.congrats} name="swell" volume={0.48} />
    <Sfx at={c.fortKnox} name="boom" volume={0.52} />
    <Sfx at={c.follow} name="pop" volume={0.46} />
    <Sfx at={c.because} name="ding" volume={0.44} />
  </>
);

export const VaultReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.splitCode} color="#42f58a" />
    <GlitchCut at={c.armyBase} color="#4ceeff" />
    <GlitchCut at={c.forgotWho} color="#ff4238" />
    <FilmLook vignette={0.22} />
    <Captions
      words={words}
      palette={P}
      variant="word"
      y={0.5}
      highlight={[
        "puh",
        "safest",
        "4,200",
        "750",
        "20",
        "10",
        "emergency",
        "army",
        "4,500",
        "gold",
        "10,",
        "Knox.",
        "Follow,",
        "Because...",
      ]}
    />
    <Sound />
  </AbsoluteFill>
);
