import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx, Ticks } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { ClassForm, ClintonEnd, CountClock, FatCell, FederalCard, IntakePhoto, Recapture, SideChip, Stamp, TestCard } from "./inserts";
import { SetArrive, SetBank, SetBoard, SetChase, SetClinton, SetCount, SetCourt, SetCrew, SetEight, SetFinale, SetHacksaw, SetHook, SetInfirmary, SetIntake, SetOffice, SetPhone, SetPoison, SetStudio, SetTattoo, SetToilet, SetTools } from "./sets";
import { SetChicago, SetManhole, SetManhunt, SetPerimeter, SetUnder, SetWall } from "./sets2";

export { DURATION } from "./cues";
const P = palettes.night;

const Photo1: React.FC<{ f: number }> = ({ f }) => (
  <>
    <IntakePhoto f={f} at={c.remember1} zoom={0.15 * ((f - c.remember1) / 30)} />
    <Stamp f={f} at={c.remember1 + 6} text="REMEMBER THIS" color="#ffb347" top={1500} size={90} rot={-5} />
  </>
);
const Photo2: React.FC<{ f: number }> = ({ f }) => <IntakePhoto f={f} at={c.remember2} title="FOX RIVER · INTAKE FILE" zoom={Math.min(1, (f - c.remember2) / 150)} marksAt={[c.pipe, c.pipe + 12, c.pipe + 24]} />;
const Federal: React.FC<{ f: number }> = ({ f }) => <FederalCard f={f} at={c.federal} prison={c.fedPrison} />;
const Classif: React.FC<{ f: number }> = ({ f }) => <ClassForm f={f} at={c.illinois} points={c.classif + 6} />;
const Fat: React.FC<{ f: number }> = ({ f }) => <FatCell f={f} at={c.pugReal} fat={c.fat} />;
const Test: React.FC<{ f: number }> = ({ f }) => <TestCard f={f} at={c.looks2} blood={c.blood} clean={c.clean} />;
const Clock: React.FC<{ f: number }> = ({ f }) => <CountClock f={f} at={c.handbook} marks={c.midnight} />;
const Recap: React.FC<{ f: number }> = ({ f }) => <Recapture f={f} at={c.study} pct={c.pct} />;
const Clinton: React.FC<{ f: number }> = ({ f }) => <ClintonEnd f={f} at={c.lasted} shot={c.shot} other={c.other} />;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.michael, C: SetArrive },
  { from: c.wears, C: SetTattoo },
  { from: c.tattooBig, C: SetStudio },
  { from: c.day1, C: SetIntake },
  { from: c.remember1, C: Photo1 },
  { from: c.robs, C: SetBank },
  { from: c.judge, C: SetCourt },
  { from: c.federal, C: Federal },
  { from: c.illinois, C: Classif },
  { from: c.toGet, C: SetToilet },
  { from: c.real1, C: SetTools },
  { from: c.behind, C: SetChase },
  { from: c.y2015, C: SetClinton },
  { from: c.manhole, C: SetManhole },
  { from: c.took, C: SetHacksaw },
  { from: c.route, C: SetInfirmary },
  { from: c.pugReal, C: Fat },
  { from: c.looks2, C: Test },
  { from: c.mixes, C: SetPoison },
  { from: c.crew, C: SetCrew },
  { from: c.night, C: SetEight },
  { from: c.count, C: SetCount },
  { from: c.handbook, C: Clock },
  { from: c.bunk, C: SetCount },
  { from: c.phone, C: SetPhone },
  { from: c.wall, C: SetWall },
  { from: c.perim, C: SetPerimeter },
  { from: c.ny, C: SetUnder },
  { from: c.chicago, C: SetChicago },
  { from: c.manhunt, C: SetManhunt },
  { from: c.study, C: Recap },
  { from: c.lasted, C: Clinton },
  { from: c.police, C: SetOffice },
  { from: c.remember2, C: Photo2 },
  { from: c.show, C: SetBoard },
  { from: c.congrats, C: SetFinale },
];

/** Which side of the story we are on (top-left chip). */
const SIDES: [number, "plan" | "real"][] = [
  [c.michael, "plan"],
  [c.tattooBig, "real"],
  [c.robs, "plan"],
  [c.federal, "real"],
  [c.toGet, "plan"],
  [c.real1, "real"],
  [c.behind, "plan"],
  [c.thisReal, "real"],
  [c.route, "plan"],
  [c.pugReal, "real"],
  [c.mixes, "plan"],
  [c.noProof, "real"],
  [c.crew, "plan"],
  [c.count, "real"],
  [c.wall, "plan"],
  [c.perim, "real"],
  [c.show, "plan"],
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const s = SIDES.filter(([a]) => a <= f).pop();
  if (!s || f >= c.honest + 6) return null;
  return <SideChip f={f} side={s[1]} at={s[0]} clock={s[1] === "plan" ? "SEASON 1" : undefined} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("prison-break/vo.mp3")} volume={1.3} />
    <MusicBed name="tension" words={words} volume={0.2} cuts={[[c.thisReal - 4, c.thisReal + 4], [c.fox - 4, c.fox + 4]]} />
    <Sfx at={0} name="thud" volume={0.5} />
    <Sfx at={50} name="riser" volume={0.3} lead={0} />
    {SIDES.map(([a, s]) => (
      <Sfx key={a} at={a} name={s === "plan" ? "whoosh" : "whoosh_fast"} volume={0.32} />
    ))}
    <Sfx at={c.michael + 10} name="creak" volume={0.3} />
    <Sfx at={c.wears} name="swell" volume={0.4} />
    <Ticks from={c.tattooBig + 10} to={c.tattooBig + 84} every={12} volume={0.25} />
    <Sfx at={c.day1 + 18} name="ping" volume={0.5} />
    <Sfx at={c.finger} name="ping" volume={0.5} />
    <Sfx at={c.remember1 + 6} name="thud" volume={0.55} />
    <Sfx at={c.robs + 14} name="impact" volume={0.6} />
    <Sfx at={c.judge + 20} name="thud" volume={0.45} />
    <Sfx at={c.federal + 30} name="thud" volume={0.5} />
    <Ticks from={c.classif + 6} to={c.classif + 36} every={6} volume={0.3} />
    <Ticks from={c.toilet + 6} to={c.toilet + 30} every={6} volume={0.3} />
    <Sfx at={c.counted} name="beep" volume={0.4} />
    <Sfx at={c.behind} name="creak" volume={0.45} />
    <Sfx at={c.thisReal + 6} name="impact" volume={0.6} />
    <Sfx at={c.manhole + 4} name="creak" volume={0.4} />
    <Sfx at={c.meat} name="pop" volume={0.4} />
    <Sfx at={c.pills + 4} name="pop" volume={0.4} />
    <Sfx at={c.fat + 10} name="ping" volume={0.35} />
    <Ticks from={c.clean} to={c.clean + 12} every={5} volume={0.35} />
    <Sfx at={c.mixes + 14} name="bubbles" volume={0.45} />
    <Sfx at={c.noProof + 4} name="thud" volume={0.6} />
    <Sfx at={c.cooper} name="swell" volume={0.4} />
    <Sfx at={c.count} name="beep" volume={0.35} />
    <Ticks from={c.midnight} to={c.midnight + 60} every={6} volume={0.2} />
    <Sfx at={c.phone + 6} name="beep" volume={0.35} />
    <Sfx at={c.wall} name="whoosh" volume={0.35} />
    <Sfx at={c.razor} name="tick" volume={0.45} />
    <Sfx at={c.cameras} name="tick" volume={0.45} />
    <Sfx at={c.towers} name="tick" volume={0.45} />
    <Sfx at={c.sensors} name="beep" volume={0.45} />
    <Sfx at={c.volts} name="glitch" volume={0.5} />
    <Sfx at={c.under} name="creak" volume={0.4} />
    <Sfx at={c.caught3} name="impact" volume={0.6} />
    <Sfx at={c.manhunt} name="riser" volume={0.35} lead={0} />
    <Ticks from={c.pct} to={c.pct + 26} every={2} volume={0.2} />
    <Sfx at={c.shot} name="thud" volume={0.55} />
    <Sfx at={c.other} name="thud" volume={0.55} />
    <Sfx at={c.remember2} name="swell" volume={0.4} />
    <Sfx at={c.pipe} name="pop" volume={0.45} />
    <Sfx at={c.pipe + 12} name="pop" volume={0.45} />
    <Sfx at={c.pipe + 24} name="pop" volume={0.45} />
    <Sfx at={c.congrats} name="chime" volume={0.55} />
    <Sfx at={c.honest} name="whoosh" volume={0.4} />
  </>
);

export const PrisonBreakReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.volts} color="#9fdcff" />
    <Hud />
    <FilmLook vignette={0.25} />
    <Captions words={words} palette={P} variant="word" y={0.5} highlight={["tattoo", "photo", "federal", "real", "counted", "real.", "Pugnac", "clean", "proof", "recorded", "wall", "5,000", "under", "bedsheets", "91", "file", "Fox"]} />
    <Sound />
  </AbsoluteFill>
);
