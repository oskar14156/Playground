import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { Gauge, StatPill } from "../../lib/Hud";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { fonts, palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetPlates, SetSites, SetTimeline, SetWorker } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

// Set list (storyboard.md → Sets). Each set mounts only while active; hard cuts between them.
const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetPlates },
  { from: c.php, C: SetSites },
  { from: c.one, C: SetWorker },
  { from: c.worst, C: SetTimeline },
  { from: c.run, C: SetPlates },
  { from: c.because, C: SetPlates },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

const Footnote: React.FC = () => {
  const f = useCurrentFrame();
  if (f < c.seven || f >= c.called) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 540, textAlign: "center" }}>
      <span style={{ padding: "6px 14px", background: "rgba(5,6,14,0.85)", fontFamily: fonts.hud, fontSize: 26, letterSpacing: 2, color: "#c9d0ff" }}>
        OF SITES WITH A KNOWN SERVER LANGUAGE · W3TECHS 2026
      </span>
    </div>
  );
};

const Hud: React.FC = () => (
  <>
    <StatPill at={c.seven} until={c.called} from={0} value={71} countFrames={18} unit="% RUN PHP" palette={P} color="#aab4ff" top={400} />
    <Footnote />
    <Gauge at={c.rated} until={c.one} from={0} value={9.2} decimals={1} countFrames={14} max={10} unit="/10" label="SEVERITY (CVSS)" x={540} y={1060} size={300} palette={P} redFrom={7} />
  </>
);

const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("php2shell/vo.mp3")} />
    <MusicBed name="tension" words={words} volume={0.28} cuts={[[c.worst - 6, c.planned]]} />
    <Sfx at={0} name="thud" volume={0.45} />
    <Sfx at={c.holes} name="glitch" volume={0.4} />
    <Sfx at={c.php} name="whoosh" volume={0.5} />
    <Ticks from={c.seven} to={c.seven + 18} every={2} />
    <Sfx at={c.name} name="glitch" volume={0.6} />
    <Sfx at={c.rated} name="beep" volume={0.6} />
    <Ticks from={c.rated} to={c.rated + 14} every={2} />
    <Sfx at={c.one} name="whoosh" volume={0.5} />
    <Sfx at={c.memory + 10} name="thud" volume={0.55} />
    <Sfx at={c.other} name="whoosh_fast" volume={0.4} />
    <Sfx at={c.next} name="pop" />
    <Sfx at={c.either} name="riser" volume={0.4} />
    <Sfx at={c.code} name="impact" volume={0.8} />
    <Sfx at={c.nopass} name="beep" volume={0.5} />
    <Sfx at={c.worst} name="glitch" volume={0.5} />
    <Sfx at={c.leaked} name="pop" />
    <Sfx at={c.amazon} name="thud" volume={0.7} />
    <Sfx at={c.days4} name="tick" volume={0.6} />
    <Sfx at={c.run} name="whoosh" volume={0.5} />
    <Sfx at={c.update} name="chime" volume={0.5} />
    <Sfx at={c.restart} name="swell" volume={0.4} />
    <Sfx at={c.because} name="glitch" volume={0.45} />
  </>
);

export const Php2Shell: React.FC = () => (
  <AbsoluteFill style={{ background: "#03040a" }}>
    <World />
    <Hud />
    <GlitchCut at={c.worst} color="#ff8a9a" />
    <GlitchCut at={c.because} color="#ff8a9a" />
    <LoopBridge frames={16} opening={<World />} />
    <FilmLook />
    <Captions
      words={words}
      palette={P}
      variant="punch"
      y={0.8}
      highlight={["holes", "PHP2Shell", "memory", "leftovers", "stranger", "password", "request", "worst", "leaked", "attack", "update", "restart"]}
    />
    <Sound />
  </AbsoluteFill>
);
