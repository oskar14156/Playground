import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import {
  SetArch,
  SetBlast,
  SetFinale,
  SetFlat,
  SetGrout,
  SetHall,
  SetHeat,
  SetHook,
  SetJumbo,
  SetLego,
  SetPenstock,
  SetPipes,
  SetPlant,
  SetPortal,
  SetPour,
  SetProfile,
  SetReroute,
  SetRise,
  SetRiver,
  SetTunnels,
  SetVegas,
  SetWedge,
} from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

export const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.first, C: SetRiver },
  { from: c.dynamite - 4, C: SetBlast },
  { from: c.fourTunnels, C: SetTunnels },
  { from: c.m17, C: SetPortal },
  { from: c.straight, C: SetJumbo },
  { from: c.plug - 2, C: SetReroute },
  { from: c.next, C: SetRise },
  { from: c.but - 4, C: SetFlat },
  { from: c.soCurve, C: SetArch },
  { from: c.base200, C: SetProfile },
  { from: c.harder, C: SetWedge },
  { from: c.wait, C: SetPour },
  { from: c.traps, C: SetHeat },
  { from: c.soPour, C: SetLego },
  { from: c.pipes930, C: SetPipes },
  { from: c.pump, C: SetPlant },
  { from: c.grout - 6, C: SetGrout },
  { from: c.finally, C: SetHall },
  { from: c.turning, C: SetPenstock },
  { from: c.mw2000, C: SetVegas },
  { from: c.congrats, C: SetFinale },
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
        [c.snapLike, c.soCurve],
        [c.wait, c.wait + 20],
        [c.shatter, c.soPour],
      ]}
    />
    <Sfx at={c.pool} name="splash" volume={0.3} />
    <Sfx at={c.accidentally} name="pop" volume={0.45} />
    <Sfx at={c.flooded} name="whoosh_fast" volume={0.44} />
    <Sfx at={c.entire} name="rumble" volume={0.42} />
    <Sfx at={c.soBuild + 6} name="riser" volume={0.36} />
    <Sfx at={c.first} name="rumble" volume={0.4} />
    <Sfx at={c.wetConcrete + 8} name="splash" volume={0.44} />
    <Sfx at={c.sweeps} name="scratch" volume={0.42} />
    <Sfx at={c.dynamite + 5} name="boom" volume={0.55} />
    <Sfx at={c.fourTunnels} name="glitch" volume={0.44} />
    <Sfx at={c.m17 + 2} name="clang" volume={0.4} />
    <Sfx at={c.straight} name="rumble" volume={0.44} />
    <Sfx at={c.plug} name="thud" volume={0.5} />
    <Sfx at={c.reroute} name="whoosh" volume={0.4} />
    <Sfx at={c.site - 2} name="stamp" volume={0.46} />
    <Sfx at={c.next + 4} name="swell" volume={0.4} />
    <Sfx at={c.cracker} name="impact" volume={0.55} />
    <Sfx at={c.cracker + 2} name="clap" volume={0.4} />
    <Sfx at={c.soCurve} name="glitch" volume={0.44} />
    <Sfx at={c.base200 + 2} name="ding" volume={0.36} />
    <Sfx at={c.wedges} name="clang" volume={0.42} />
    <Sfx at={c.cliffs} name="stamp" volume={0.46} />
    <Sfx at={c.wait} name="scratch" volume={0.5} />
    <Sfx at={c.traps} name="hum" volume={0.4} />
    <Sfx at={c.yrs125} name="tick" volume={0.4} />
    <Sfx at={c.shatter + 2} name="boom" volume={0.55} />
    <Sfx at={c.lego} name="pop" volume={0.45} />
    <Sfx at={c.pipes930} name="typing" volume={0.3} />
    <Sfx at={c.fridge} name="hum" volume={0.36} />
    <Sfx at={c.grout} name="splash" volume={0.36} />
    <Sfx at={c.solid} name="stamp" volume={0.46} />
    <Sfx at={c.turbines17} name="clang" volume={0.44} />
    <Sfx at={c.turning} name="whoosh" volume={0.42} />
    <Sfx at={c.vegas} name="chime" volume={0.46} />
    <Sfx at={c.congrats} name="swell" volume={0.48} />
    <Sfx at={c.justTo + 10} name="ding" volume={0.44} />
    <Sfx at={c.hooverDam} name="boom" volume={0.52} />
    <Sfx at={c.follow} name="pop" volume={0.46} />
  </>
);

export const DamReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.fourTunnels} color="#4ceeff" />
    <GlitchCut at={c.reroute} color="#4ceeff" />
    <GlitchCut at={c.soCurve} color="#5dfc8d" />
    <GlitchCut at={c.soPour} color="#ffd23f" />
    <GlitchCut at={c.congrats} color="#ffd23f" />
    <FilmLook vignette={0.22} />
    <Captions
      words={words}
      palette={P}
      variant="word"
      y={0.5}
      highlight={["flooded", "canyon.", "river.", "four", "17", "reroute", "221", "cracker", "arch,", "200", "14", "125", "dust.", "Lego", "930", "refrigeration", "solid.", "17", "2,000", "Vegas.", "Dam.", "Follow,", "Because..."]}
    />
    <Sound />
  </AbsoluteFill>
);
