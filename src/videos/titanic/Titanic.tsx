import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { Readout, StatPill } from "../../lib/Hud";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetBlueprint, SetBreak, SetCompare, SetCrack, SetDescent, SetLifeboat, SetNight, SetWreck } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

// Set list (storyboard.md → Sets). Each set mounts only while active; hard cuts between them.
const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetNight },
  { from: c.then, C: SetWreck },
  { from: c.so, C: SetCrack },
  { from: c.iceberg, C: SetBlueprint },
  { from: c.stern, C: SetBreak },
  { from: c.not, C: SetCompare },
  { from: c.survivors, C: SetLifeboat },
  { from: c.truth, C: SetDescent },
  { from: c.which, C: SetNight },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Hud: React.FC = () => (
  <>
    <StatPill at={5} until={c.then} from={0} value={73} countFrames={14} unit="YEARS" palette={P} top={300} />
    <Readout at={c.depth} until={c.two} from={0} value={3800} countFrames={22} unit="M" label="DEPTH" palette={P} top={230} />
    {/* limits, not quantities: no count-up (a ticking "3 SURVIVABLE" would be wrong) */}
    <StatPill at={c.five} until={c.stern} value={5} unit="OF 16 OPEN" palette={P} color="#ff6b6b" top={300} />
    <StatPill at={c.four} until={c.stern} value={4} unit="SURVIVABLE" palette={P} color="#7dffa8" top={430} />
    <Readout at={c.stern + 6} until={c.hull} from={7} value={15} countFrames={c.hanging + 20 - c.stern - 6} unit="°" label="STERN ANGLE" palette={P} top={230} />
    <Readout at={c.truth + 2} until={c.which} from={0} value={3800} countFrames={c.which - c.truth - 4} unit="M" label="DEPTH" palette={P} top={230} />
  </>
);

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("titanic/vo.mp3")} />
    <MusicBed name="dark" words={words} volume={0.3} cuts={[[c.ruler, c.snapped]]} />
    <Sfx at={0} name="thud" volume={0.45} />
    <Ticks from={5} to={19} every={2} />
    <Sfx at={c.then} name="glitch" volume={0.5} />
    <Ticks from={c.depth} to={c.depth + 22} />
    <Sfx at={c.depth + 12} name="whoosh" volume={0.5} />
    <Sfx at={c.apart} name="pop" />
    <Sfx at={c.so} name="whoosh" volume={0.5} />
    <Sfx at={c.so + 8} name="riser" volume={0.35} lead={0} />
    <Sfx at={c.iceberg} name="whoosh" volume={0.55} />
    <Sfx at={c.five} name="pop" />
    <Sfx at={c.four} name="beep" volume={0.6} />
    <Sfx at={c.bow} name="swell" volume={0.4} />
    {[0, 1, 2].map((i) => (
      <Sfx key={i} at={c.spilled + i * 14} name="whoosh_fast" volume={0.35} />
    ))}
    <Sfx at={c.stern} name="whoosh" volume={0.55} />
    <Sfx at={c.tons + 4} name="thud" volume={0.6} />
    <Sfx at={c.hull} name="glitch" volume={0.5} />
    <Sfx at={c.snapped} name="impact" volume={0.95} />
    <Sfx at={c.not} name="whoosh" volume={0.5} />
    <Sfx at={c.n45} name="pop" />
    <Sfx at={c.n15} name="chime" volume={0.4} />
    <Sfx at={c.survivors} name="whoosh" volume={0.45} />
    <Sfx at={c.them + 4} name="thud" volume={0.7} />
    <Sfx at={c.truth} name="swell" volume={0.45} />
    <Sfx at={c.which} name="whoosh" volume={0.5} />
  </>
);

export const Titanic: React.FC = () => (
  <AbsoluteFill style={{ background: "#020306" }}>
    <World />
    <Hud />
    <GlitchCut at={c.then} color="#ffffff" />
    <GlitchCut at={c.hull} color="#ffb070" />
    <LoopBridge frames={16} opening={<World />} />
    <FilmLook />
    <Captions
      words={words}
      palette={P}
      variant="punch"
      y={0.78}
      highlight={["piece", "two", "half", "iceberg", "survive", "spilled", "stern", "snapped", "movie", "break", "truth"]}
    />
    <Sound />
  </AbsoluteFill>
);
