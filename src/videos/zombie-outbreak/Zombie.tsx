import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { ChapterCard, RuleCard, Status, StatusPanel } from "./kit";
import { QuestionCard, SetDoor, SetFights, SetHighway, SetHospital, SetKnock, SetMap, SetPantry, SetPhone, SetSpeed, SetStore, SetStreet, SetTub, SetTV, SetWaterChain } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

// Set list (storyboard.md → Sets). Hard cuts on chapter cards; one canvas per frame.
const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetTV },
  { from: c.stay, C: SetStore },
  { from: c.water, C: SetWaterChain },
  { from: c.fill, C: SetTub },
  { from: c.food, C: SetPantry },
  { from: c.news2, C: ({ f }) => <SetTV f={f} update /> },
  { from: c.figured, C: SetSpeed },
  { from: c.fight, C: SetFights },
  { from: c.hospital, C: SetHospital },
  { from: c.door, C: SetDoor },
  { from: c.lights, C: SetStreet },
  { from: c.call, C: SetPhone },
  { from: c.answer + 40, C: SetMap },
  { from: c.highway, C: SetHighway },
  { from: c.street, C: SetKnock },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

const status = (f: number): Status => {
  const time = f < c.stay ? "8:30 AM" : f < c.water ? "9:00 AM" : f < c.food ? "9:30 AM" : f < c.news2 ? "10:00 AM" : f < c.door ? "2:00 PM" : f < c.call ? "5:00 PM" : f < c.highway ? "9:00 PM" : f < c.street ? "11:00 PM" : "3:12 AM";
  return {
    time,
    water: f < c.days40 ? "TAP" : "40 DAYS",
    food: f < c.days15 ? "?" : "15 DAYS",
    cases: f < c.news2 ? "20" : "300+",
    phone: f < c.noGo ? "OK" : f < c.slips ? "NO CALLS" : "TEXT ONLY",
  };
};

const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {f >= c.plan && f < c.open ? <StatusPanel from={c.plan} s={status(f)} /> : null}
      <ChapterCard at={c.stay} time="9:00 AM" title="STAY HOME" />
      <ChapterCard at={c.water} time="9:30 AM" title="WATER" />
      <ChapterCard at={c.food} time="10:00 AM" title="FOOD" />
      <ChapterCard at={c.news2} time="2:00 PM" title="NEWS UPDATE" />
      <ChapterCard at={c.door} time="5:00 PM" title="THE BARRICADE" />
      <ChapterCard at={c.call} time="9:00 PM" title="THE PHONE" />
      <ChapterCard at={c.highway} time="11:00 PM" title="THE HIGHWAY" />
      <ChapterCard at={c.street} time="3:12 AM" title="THE KNOCK" />
      <RuleCard at={c.stay + 60} until={c.stay + 150} n={1} title="DON'T GO SHOPPING" why="EVERYONE WHO GOES MEETS EVERYONE ELSE" />
      <RuleCard at={c.water + 60} until={c.water + 140} n={2} title="WATER BEFORE FOOD" why="THE TAP ONLY RUNS WHILE PEOPLE RUN THE PUMPS" />
      <RuleCard at={c.lights} until={c.lights + 50} n={3} title="LIGHTS OFF" why="FROM THE STREET, THE HOUSE MUST LOOK EMPTY" />
      <QuestionCard f={f} />
    </>
  );
};

const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("zombie-outbreak/vo.mp3")} />
    <MusicBed name="dark" words={words} volume={0.28} cuts={[[c.knocks - 20, c.open]]} />
    <Sfx at={0} name="glitch" volume={0.4} />
    <Ticks from={4} to={40} every={3} />
    <Sfx at={c.flour + 6} name="thud" volume={0.6} />
    <Sfx at={c.hour + 6} name="pop" volume={0.4} />
    <Sfx at={c.min30} name="beep" volume={0.5} />
    <Sfx at={c.zombies} name="impact" volume={0.8} />
    {[c.stay, c.water, c.food, c.news2, c.door, c.call, c.highway, c.street].map((a) => (
      <Sfx key={a} at={a} name="whoosh" volume={0.5} />
    ))}
    <Sfx at={c.crowd + 4} name="pop" />
    <Sfx at={c.second} name="pop" />
    <Sfx at={c.four} name="pop" />
    <Sfx at={c.dry} name="thud" volume={0.7} />
    <Sfx at={c.gal40} name="pop" />
    <Sfx at={c.days40} name="chime" volume={0.4} />
    <Sfx at={c.trash} name="whoosh_fast" volume={0.5} />
    <Ticks from={c.kcal} to={c.kcal + 18} />
    <Sfx at={c.days15} name="chime" volume={0.4} />
    <Sfx at={c.eight} name="pop" />
    <Sfx at={c.lose} name="thud" volume={0.6} />
    <Sfx at={c.fridge + 16} name="thud" volume={0.8} />
    <Sfx at={c.lights + 2} name="tick" volume={0.7} />
    <Sfx at={c.noGo} name="beep" volume={0.5} />
    <Sfx at={c.tooLate} name="chime" volume={0.5} />
    <Sfx at={c.miles} name="swell" volume={0.4} />
    {[0, 1, 2].map((n) => (
      <Sfx key={n} at={c.knocks + 4 + n * 12} name="thud" volume={1} />
    ))}
    <Sfx at={c.open} name="riser" volume={0.35} lead={0} />
  </>
);

export const ZombieOutbreak: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <GlitchCut at={c.news2} color="#ffb070" />
    <Overlays />
    <FilmLook vignette={0.45} />
    <Captions words={words} palette={P} variant="punch" y={0.8} highlight={["Zombies", "bread", "flour", "bite", "water", "slow", "matter", "lights", "Montana", "knocks", "bitten", "door"]} />
    <Sound />
  </AbsoluteFill>
);
