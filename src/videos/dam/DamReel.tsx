import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetArchWedge, SetCoolingBlocks, SetDiversionTunnels, SetHook, SetPayoff } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.wetConcrete, C: SetDiversionTunnels },
  { from: c.tall221, C: SetArchWedge },
  { from: c.yrs125, C: SetCoolingBlocks },
  { from: c.turbines17, C: SetPayoff },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("dam/vo.mp3")} volume={1.25} />
    <MusicBed
      name="wonder"
      words={words}
      volume={0.18}
      cuts={[
        [c.snapLike, c.giantArch],
        [c.yrs125, c.legoBlocks],
      ]}
    />
    <Sfx at={c.hook + 2} name="splash" volume={0.42} />
    <Sfx at={c.flooded} name="whoosh_fast" volume={0.44} />
    <Sfx at={c.wetConcrete} name="rumble" volume={0.44} />
    <Sfx at={c.fourTunnels} name="glitch" volume={0.46} />
    <Sfx at={c.reroute} name="boom" volume={0.46} />
    <Sfx at={c.reroute + 4} name="stamp" volume={0.44} />
    <Sfx at={c.tall221} name="clang" volume={0.42} />
    <Sfx at={c.snapLike} name="impact" volume={0.46} />
    <Sfx at={c.giantArch} name="glitch" volume={0.46} />
    <Sfx at={c.base200} name="stamp" volume={0.44} />
    <Sfx at={c.yrs125} name="rumble" volume={0.42} />
    <Sfx at={c.legoBlocks} name="glitch" volume={0.46} />
    <Sfx at={c.iceWater} name="splash" volume={0.44} />
    <Sfx at={c.grout} name="stamp" volume={0.44} />
    <Sfx at={c.turbines17} name="chime" volume={0.46} />
    <Sfx at={c.congrats} name="swell" volume={0.48} />
    <Sfx at={c.hooverDam} name="boom" volume={0.52} />
    <Sfx at={c.follow} name="pop" volume={0.46} />
    <Sfx at={c.because} name="ding" volume={0.44} />
  </>
);

export const DamReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.fourTunnels} color="#4ceeff" />
    <GlitchCut at={c.giantArch} color="#5dfc8d" />
    <GlitchCut at={c.legoBlocks} color="#5ceeff" />
    <GlitchCut at={c.congrats} color="#ffd23f" />
    <FilmLook vignette={0.22} />
    <Captions
      words={words}
      palette={P}
      variant="word"
      y={0.5}
      highlight={[
        "flooded",
        "river.",
        "four",
        "17",
        "reroute",
        "221",
        "cracker",
        "arch,",
        "200",
        "14",
        "125",
        "Lego",
        "930",
        "solid.",
        "17",
        "2,000",
        "Dam.",
        "Follow,",
        "Because...",
      ]}
    />
    <Sound />
  </AbsoluteFill>
);
