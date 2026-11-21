import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { Gauge, StatPill } from "../../lib/Hud";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { Set1895, SetMorph, SetPhysics, SetRevolution, SetSunset } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

// Set list (storyboard.md → Sets). Each set mounts only while active; hard cuts between them.
const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetSunset },
  { from: c.y1895, C: Set1895 },
  { from: c.why, C: SetPhysics },
  { from: c.engineers, C: SetMorph },
  { from: c.y1976, C: SetRevolution },
  { from: c.look, C: SetSunset },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

const Hud: React.FC = () => (
  <>
    <Gauge at={c.g6 - 4} until={c.matter} from={1} value={6} decimals={0} countFrames={16} max={7} unit="G" label="AT THE BOTTOM" x={540} y={1470} size={260} palette={P} redFrom={4.5} />
    <StatPill at={c.six} until={c.matter} value={6} unit="× YOUR WEIGHT" palette={P} color="#ff6b6b" top={1660} />
    <Gauge at={c.under5 - 2} until={c.look} from={6} value={4.9} decimals={1} countFrames={16} max={7} unit="G" label="DESIGN LIMIT" x={540} y={1500} size={280} palette={P} redFrom={5.5} />
  </>
);

const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("coaster-loop/vo.mp3")} />
    <MusicBed name="wonder" words={words} volume={0.3} cuts={[[c.why - 4, c.top]]} />
    <Sfx at={2} name="whoosh" volume={0.45} />
    <Sfx at={c.y1895} name="glitch" volume={0.4} />
    <Sfx at={c.injuries} name="thud" volume={0.6} />
    <Sfx at={c.why} name="whoosh" volume={0.5} />
    <Sfx at={c.top} name="pop" />
    <Sfx at={c.bottom} name="whoosh_fast" volume={0.5} />
    <Sfx at={c.g6} name="impact" volume={0.6} />
    <Ticks from={c.g6 - 4} to={c.g6 + 12} every={3} />
    <Sfx at={c.matter} name="pop" />
    <Sfx at={c.engineers} name="swell" volume={0.45} />
    <Sfx at={c.wide} name="pop" />
    <Sfx at={c.tight} name="pop" />
    <Sfx at={c.y1976} name="whoosh" volume={0.5} />
    <Sfx at={c.under5} name="chime" volume={0.45} />
    <Sfx at={c.look} name="swell" volume={0.4} />
  </>
);

export const CoasterReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#05060c" }}>
    <World />
    <Hud />
    <GlitchCut at={c.why} color="#bfefff" />
    <LoopBridge frames={16} opening={<World />} />
    <FilmLook />
    <Captions
      words={words}
      palette={P}
      variant="punch"
      y={0.62}
      highlight={["circles", "round", "injuries", "top", "bottom", "circle", "weight", "teardrop", "fast", "slow", "Revolution", "closely"]}
    />
    <Sound />
  </AbsoluteFill>
);
