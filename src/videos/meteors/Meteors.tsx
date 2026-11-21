import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { Readout } from "../../lib/Hud";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetAltitude, SetEntry, SetGlow, SetMacro, SetOrbit, SetSky, SetStorm } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

// Set list (storyboard.md → Sets). Each set mounts only while active; hard cuts between them.
const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetSky },
  { from: c.grain, C: SetMacro },
  { from: c.these, C: SetOrbit },
  { from: c.each, C: SetEntry },
  { from: c.but, C: SetGlow },
  { from: c.km100, C: SetAltitude },
  { from: c.most, C: SetStorm },
  { from: c.leonids, C: SetSky },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

const Hud: React.FC = () => (
  <>
    <Readout at={c.k70} until={c.times70} from={0} value={70} countFrames={14} unit="KM/S" label="ENTRY SPEED" palette={P} top={230} />
    <Readout at={c.deg} until={c.km100} from={0} value={1600} countFrames={16} unit="°C+" label="SQUEEZED AIR" palette={P} top={150} />
  </>
);

const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("meteors/vo.mp3")} />
    <MusicBed name="wonder" words={words} volume={0.3} cuts={[[c.but - 4, c.friction + 4]]} />
    <Sfx at={2} name="whoosh" volume={0.4} />
    <Sfx at={c.grain} name="pop" />
    <Sfx at={c.these} name="whoosh" volume={0.5} />
    <Sfx at={c.drives} name="swell" volume={0.45} />
    <Sfx at={c.each} name="whoosh_fast" volume={0.5} />
    <Ticks from={c.k70} to={c.k70 + 14} every={2} />
    <Sfx at={c.times70} name="pop" />
    <Sfx at={c.friction + 4} name="thud" volume={0.55} />
    <Sfx at={c.squeezed} name="glitch" volume={0.45} />
    <Ticks from={c.deg} to={c.deg + 16} every={2} />
    <Sfx at={c.km100} name="whoosh" volume={0.5} />
    <Sfx at={c.most} name="whoosh" volume={0.45} />
    <Sfx at={c.y1966} name="riser" volume={0.45} lead={0} />
    <Sfx at={c.thousands} name="impact" volume={0.7} />
    <Sfx at={c.leonids} name="chime" volume={0.5} />
    <Sfx at={c.nov17} name="pop" />
    <Sfx at={c.look} name="swell" volume={0.4} />
  </>
);

export const Meteors: React.FC = () => (
  <AbsoluteFill style={{ background: "#020308" }}>
    <World />
    <Hud />
    <GlitchCut at={c.squeezed} color="#ffd0a0" />
    <LoopBridge frames={16} opening={<World />} />
    <FilmLook />
    <Captions
      words={words}
      palette={P}
      variant="punch"
      y={0.72}
      highlight={["sand", "comet", "trail", "rifle", "friction", "squeezed", "head", "handful", "thousands", "Leonids", "look"]}
    />
    <Sound />
  </AbsoluteFill>
);
