import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { TitaniumGlobe } from "./globe";
import { HomeyChart, SkylabMemo, StormCounter, UfoReports } from "./inserts";
import { SetDesert, SetDusk, SetFinale, SetHighway, SetHome, SetMig, SetNaruto, SetSkylab, SetSpy, SetWindow } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const Reports: React.FC<{ f: number }> = ({ f }) => <UfoReports f={f} at={c.pile} cia={c.half} tweet={c.tweeted + 6} />;
const Chart: React.FC<{ f: number }> = ({ f }) => <HomeyChart f={f} at={c.name} homey={c.homey} />;
const Storm: React.FC<{ f: number }> = ({ f }) => <StormCounter f={f} at={c.million - 4} showed={100000} />;
const Titanium: React.FC<{ f: number }> = ({ f }) => <TitaniumGlobe f={f} at={c.soviet} enemy={c.enemyUssr} man={c.man} bought={c.bought} fake={c.fakeCo} end={c.lights} />;
const Skylab: React.FC<{ f: number }> = ({ f }) => (
  <AbsoluteFill>
    <SetSkylab f={f} />
    <SkylabMemo f={f} memo={c.argued} />
  </AbsoluteFill>
);

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHome },
  { from: c.desert, C: SetDesert },
  { from: c.build, C: SetSpy },
  { from: c.soviet, C: Titanium },
  { from: c.lights, C: SetDusk },
  { from: c.pile, C: Reports },
  { from: c.skylab, C: Skylab },
  { from: c.enemy, C: SetMig },
  { from: c.name, C: Chart },
  { from: c.highway, C: SetHighway },
  { from: c.storm, C: Storm },
  { from: c.naruto, C: SetNaruto },
  { from: c.popcorn, C: SetWindow },
  { from: c.congrats, C: SetFinale },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("area-51/vo.mp3")} volume={1.32} />
    <MusicBed name="tension" words={words} volume={0.22} cuts={[[c.tweeted + 4, c.wasUs + 2]]} />
    <Sfx at={10} name="beep" volume={0.35} />
    <Sfx at={c.hide} name="thud" volume={0.45} />
    <Sfx at={c.desert} name="whoosh" volume={0.45} />
    <Sfx at={c.lake} name="whoosh_fast" volume={0.4} />
    <Sfx at={c.runway} name="swell" volume={0.4} />
    <Sfx at={c.sign} name="thud" volume={0.6} />
    <Sfx at={c.deadly + 6} name="impact" volume={0.5} />
    <Sfx at={c.sensors + 6} name="ping" volume={0.45} />
    <Sfx at={c.fence} name="pop" volume={0.4} />
    <Sfx at={c.workers} name="riser" volume={0.35} lead={0} />
    <Sfx at={c.workers + 14} name="beep" volume={0.25} />
    <Sfx at={c.fly} name="whoosh" volume={0.5} />
    <Sfx at={c.janet - 2} name="pop" volume={0.5} />
    <Sfx at={c.build} name="riser" volume={0.35} lead={0} />
    <Sfx at={c.soviet} name="whoosh" volume={0.4} />
    <Sfx at={c.bought} name="whoosh" volume={0.35} />
    <Sfx at={c.fakeCo + 6} name="thud" volume={0.6} />
    <Sfx at={c.enemyUssr} name="impact" volume={0.35} />
    <Sfx at={c.lights} name="swell" volume={0.35} />
    <Sfx at={c.spy} name="whoosh" volume={0.4} />
    <Sfx at={c.glows} name="swell" volume={0.45} />
    <Ticks from={c.pile} to={c.cia} every={3} volume={0.25} />
    <Sfx at={c.tweeted + 6} name="glitch" volume={0.55} />
    <Sfx at={c.skylab} name="whoosh" volume={0.4} />
    <Sfx at={c.skylab + 62} name="impact" volume={0.35} />
    <Sfx at={c.told} name="thud" volume={0.5} />
    <Sfx at={c.argued} name="thud" volume={0.5} />
    <Sfx at={c.enemy} name="whoosh_fast" volume={0.5} />
    <Sfx at={c.y1968 + 10} name="whoosh" volume={0.5} />
    <Sfx at={c.name} name="whoosh" volume={0.4} />
    <Sfx at={c.highway} name="pop" volume={0.45} />
    <Ticks from={c.name} to={c.maps} every={2} volume={0.22} />
    <Sfx at={c.storm} name="whoosh_fast" volume={0.4} />
    <Sfx at={c.naruto + 6} name="whoosh_fast" volume={0.5} />
    <Sfx at={c.cantStop} name="riser" volume={0.35} lead={0} />
    <Sfx at={c.showed + 4} name="thud" volume={0.7} />
    <Sfx at={c.popcorn + 10} name="pop" volume={0.45} />
    <Sfx at={c.congrats} name="chime" volume={0.6} />
    <Sfx at={c.a51} name="swell" volume={0.5} />
  </>
);

export const Area51Reel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.pile} color="#5dfc8d" />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["Janet", "2019", "58", "Homey", "Airport", "1995", "1974", "1968", "Naruto", "18"]} />
    <Sound />
  </AbsoluteFill>
);
