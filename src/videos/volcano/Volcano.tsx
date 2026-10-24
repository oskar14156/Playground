import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { Gauge, Readout, StatPill } from "../../lib/Hud";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetDome, SetHawaii, SetHeight, SetHelens, SetMagma, SetMap } from "./sets";

export { DURATION } from "./cues";
const P = palettes.deep;

// Set list (storyboard.md → Sets). Each set mounts only while active; hard cuts between them.
const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetDome },
  { from: c.hawaii, C: SetHawaii },
  { from: c.so, C: SetHelens },
  { from: c.every, C: SetMagma },
  { from: c.pressure, C: SetHelens },
  { from: c.blast, C: SetMap },
  { from: c.lost, C: SetHeight },
  { from: c.danger, C: SetDome },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

const Hud: React.FC = () => (
  <>
    <Readout at={c.deg} until={c.so} from={20} value={1100} countFrames={16} unit="°C" label="LAVA · KĪLAUEA" palette={P} top={230} />
    <StatPill at={c.m50} until={c.so} from={0} value={50} countFrames={14} unit="M / HOUR" palette={P} top={420} />
    {/* starts with "The pressure keeps rising" — over the magma tubes it cluttered the labels */}
    <Gauge at={c.pressure} until={c.slid} from={35} value={100} countFrames={c.slid - c.pressure} max={100} unit="%" label="PRESSURE" x={540} y={470} size={300} palette={P} redFrom={70} />
  </>
);

const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("volcano/vo.mp3")} />
    <MusicBed name="tension" words={words} volume={0.3} cuts={[[c.slid, c.burst]]} />
    <Sfx at={0} name="thud" volume={0.45} />
    <Sfx at={c.hawaii} name="whoosh" volume={0.5} />
    <Ticks from={c.deg} to={c.deg + 16} />
    <Ticks from={c.m50} to={c.m50 + 14} every={3} />
    <Sfx at={c.so} name="whoosh" volume={0.5} />
    <Sfx at={c.apart} name="riser" volume={0.35} lead={0} />
    <Sfx at={c.every} name="glitch" volume={0.45} />
    <Sfx at={c.slip} name="pop" />
    <Sfx at={c.trapped} name="thud" volume={0.55} />
    <Sfx at={c.pressure} name="riser" volume={0.4} />
    <Sfx at={c.y1980} name="beep" volume={0.6} />
    <Sfx at={c.slid} name="thud" volume={0.7} />
    <Sfx at={c.burst} name="impact" volume={1} />
    <Sfx at={c.blast} name="whoosh" volume={0.55} />
    <Sfx at={c.km30} name="pop" />
    <Sfx at={c.lost} name="whoosh_fast" volume={0.5} />
    <Sfx at={c.m400} name="thud" volume={0.6} />
    <Sfx at={c.eiffel} name="pop" />
    <Sfx at={c.danger} name="swell" volume={0.45} />
    <Sfx at={c.which} name="whoosh" volume={0.5} />
  </>
);

export const VolcanoReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#020305" }}>
    <World />
    <Hud />
    <GlitchCut at={c.every} color="#ffb070" />
    <LoopBridge frames={16} opening={<World />} />
    <FilmLook />
    <Captions
      words={words}
      palette={P}
      variant="punch"
      y={0.78}
      highlight={["scariest", "slowest", "walk", "apart", "soda", "runny", "sticky", "trapped", "burst", "Eiffel", "danger"]}
    />
    <Sound />
  </AbsoluteFill>
);

