import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { Gauge, Readout, StatPill, WarningTag } from "../../lib/Hud";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetBlueprint, SetFire, SetImpact, SetOcean, SetPlane, SetSonar, SetVoid, SetWreck } from "./sets";

export { DURATION } from "./cues";
const P = palettes.deep;

// Set list (storyboard.md → Sets). Each set mounts only while active; hard cuts between them.
const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetVoid },
  { from: c.search, C: SetWreck },
  { from: c.tail, C: SetPlane },
  { from: c.armor, C: SetBlueprint },
  { from: c.first, C: SetImpact },
  { from: c.fire, C: SetFire },
  { from: c.ocean, C: SetOcean },
  { from: c.underwater, C: SetSonar },
  { from: c.so, C: SetVoid },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Hud: React.FC = () => (
  <>
    <Readout at={c.g3400} until={c.fighter} from={0} value={3400} countFrames={10} unit="G" label="IMPACT TEST" palette={P} top={230} />
    <Gauge at={c.fighter - 2} until={c.fire} from={0} value={3400} countFrames={8} max={3400} unit="G" label="BLACK BOX" x={290} y={760} size={340} palette={P} />
    <Gauge at={c.fighter + 8} until={c.fire} from={0} value={9} countFrames={14} max={3400} unit="G" label="FIGHTER PILOT" x={790} y={760} size={340} palette={P} redFrom={9} />
    <Readout at={c.deg} until={c.ocean} from={20} value={1100} countFrames={16} unit="°C" label="FURNACE" palette={P} top={230} />
    <StatPill at={c.hour} until={c.ocean} from={0} value={60} countFrames={24} unit="MIN" palette={P} top={430} />
    <Readout at={c.ocean} until={c.underwater} from={0} value={20000} countFrames={c.underwater - c.ocean - 8} unit="FT" label="DEPTH" palette={P} top={230} />
    <StatPill at={c.days} until={c.silent} from={0} value={90} countFrames={20} unit="DAYS" palette={P} top={420} color="#9dffb0" />
    <WarningTag at={c.silent + 6} until={c.so} text="SIGNAL LOST" top={430} />
  </>
);

export const Sound: React.FC = () => {
  const pings = Array.from({ length: Math.max(0, Math.ceil((c.silent - c.underwater) / 30)) }, (_, i) => c.underwater + i * 30);
  return (
    <>
      <Audio src={staticFile("black-box/vo.mp3")} />
      <MusicBed name="tension" words={words} volume={0.3} cuts={[[c.silent, c.so - 4]]} />
      <Sfx at={0} name="thud" volume={0.5} />
      <Sfx at={c.black2} name="impact" volume={0.6} />
      <Sfx at={c.orange + 2} name="pop" />
      {[c.search, c.tail, c.armor, c.ocean, c.so].map((t) => (
        <Sfx key={t} at={t} name="whoosh" volume={0.55} />
      ))}
      <Sfx at={c.wreckage + 4} name="pop" />
      <Sfx at={c.tailWord} name="swell" volume={0.35} />
      <Sfx at={c.tailWord + 8} name="pop" />
      <Sfx at={c.chip} name="swell" volume={0.5} />
      {[0, 5, 10].map((d) => (
        <Sfx key={d} at={c.tests + d} name="pop" volume={0.6} />
      ))}
      <Sfx at={c.g3400 + 2} name="riser" volume={0.45} />
      <Sfx at={c.g3400 + 2} name="impact" volume={0.9} />
      <Ticks from={c.g3400} to={c.g3400 + 10} />
      <Sfx at={c.fighter - 2} name="pop" />
      <Ticks from={c.fighter + 8} to={c.fighter + 22} every={3} />
      <Sfx at={c.blacks} name="thud" volume={0.7} />
      <Sfx at={c.fire} name="whoosh_fast" volume={0.6} />
      <Sfx at={c.deg} name="glitch" volume={0.6} />
      <Ticks from={c.deg} to={c.deg + 16} />
      <Ticks from={c.hour} to={c.hour + 24} every={3} />
      <Sfx at={c.feet + 4} name="thud" volume={0.6} />
      <Sfx at={c.underwater} name="glitch" volume={0.6} />
      {pings.map((t) => (
        <Sfx key={t} at={t} name="beep" volume={0.5} />
      ))}
      <Ticks from={c.days} to={c.days + 20} />
      <Sfx at={c.silent + 6} name="glitch" volume={0.35} />
      <Sfx at={c.found} name="swell" volume={0.5} />
    </>
  );
};

export const BlackBox: React.FC = () => (
  <AbsoluteFill style={{ background: "#020305" }}>
    <World />
    <Hud />
    <GlitchCut at={c.deg} color="#ffd29a" />
    <GlitchCut at={c.underwater} color="#c8ffc8" />
    <LoopBridge frames={16} opening={<World />} />
    <FilmLook />
    <Captions
      words={words}
      palette={P}
      variant="punch"
      y={0.7}
      highlight={["black", "orange", "tail", "armor", "chip", "fire", "ocean", "silent", "found", "blacks"]}
    />
    <Sound />
  </AbsoluteFill>
);
