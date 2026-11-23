import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { MusicBed, Sfx } from "../../lib/Sound";
import { GlitchCut } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { c, words } from "./cues";
import { SetBulkheads, SetCrowsNest, SetFunnel, SetHook, SetHull, SetLifeboats, SetPayoff, SetPool, SetTurbine } from "./sets";

export { DURATION } from "./cues";
const P = palettes.night;

const SETS: { from: number; C: React.FC<{ f: number }> }[] = [
  { from: 0, C: SetHook },
  { from: c.hull269, C: SetHull },
  { from: c.sinkBoat, C: SetBulkheads },
  { from: c.boilers, C: SetFunnel },
  { from: c.waitBoats, C: SetLifeboats },
  { from: c.knots22, C: SetCrowsNest },
  { from: c.iceberg400, C: SetTurbine },
  { from: c.rips6, C: SetPool },
  { from: c.congrats, C: SetPayoff },
];

export const World: React.FC = () => {
  const f = useCurrentFrame();
  const active = SETS.filter((s) => s.from <= f).pop()!;
  return <active.C f={f} />;
};

export const Sound: React.FC = () => (
  <>
    <Audio src={staticFile("unsinkable/vo.mp3")} volume={1.25} />
    <MusicBed
      name="wonder"
      words={words}
      volume={0.18}
      cuts={[
        [c.plotTwist, c.dontSeal],
        [c.hugeMistake, c.centerProp],
      ]}
    />
    {/* 1. Hook */}
    <Sfx at={c.sailed} name="splash" volume={0.42} />
    <Sfx at={c.unsinkable} name="whoosh_fast" volume={0.38} />
    {/* 2. Hull */}
    <Sfx at={c.hull269} name="clang" volume={0.44} />
    <Sfx at={c.rivets} name="typing" volume={0.36} />
    {/* 3. Bulkheads */}
    <Sfx at={c.sinkBoat} name="impact" volume={0.45} />
    <Sfx at={c.plotTwist} name="glitch" volume={0.45} />
    <Sfx at={c.iceCube} name="stamp" volume={0.48} />
    <Sfx at={c.flood5} name="splash" volume={0.46} />
    {/* 4. Fourth funnel */}
    <Sfx at={c.boilers} name="rumble" volume={0.4} />
    <Sfx at={c.auraFarming} name="scratch" volume={0.45} />
    <Sfx at={c.auraFarming + 4} name="stamp" volume={0.45} />
    <Sfx at={c.airVent} name="ding" volume={0.42} />
    {/* 5. Lifeboats */}
    <Sfx at={c.waitBoats} name="whoosh" volume={0.38} />
    <Sfx at={c.law1894} name="pop" volume={0.42} />
    <Sfx at={c.ruinView} name="ding" volume={0.4} />
    {/* 6. Binoculars */}
    <Sfx at={c.knots22} name="creak" volume={0.38} />
    <Sfx at={c.locked} name="clang" volume={0.48} />
    <Sfx at={c.locked + 3} name="stamp" volume={0.46} />
    <Sfx at={c.pocketedKey} name="scratch" volume={0.42} />
    {/* 7. Turbine */}
    <Sfx at={c.iceberg400} name="boom" volume={0.5} />
    <Sfx at={c.hugeMistake} name="glitch" volume={0.48} />
    <Sfx at={c.stops} name="impact" volume={0.48} />
    <Sfx at={c.rudder} name="rumble" volume={0.42} />
    {/* 8. Collision & Pool */}
    <Sfx at={c.rips6} name="impact" volume={0.52} />
    <Sfx at={c.sinks3800} name="bubbles" volume={0.44} />
    <Sfx at={c.pool} name="splash" volume={0.42} />
    <Sfx at={c.stillFull} name="chime" volume={0.48} />
    {/* 9. Payoff */}
    <Sfx at={c.congrats} name="swell" volume={0.48} />
    <Sfx at={c.roomForTwo} name="clap" volume={0.44} />
    <Sfx at={c.theTitanic} name="boom" volume={0.52} />
    <Sfx at={c.follow} name="pop" volume={0.46} />
    <Sfx at={c.because} name="ding" volume={0.44} />
  </>
);

export const UnsinkableReel: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <LoopBridge frames={16} opening={<World />} />
    <GlitchCut at={c.plotTwist} color="#ffd23f" />
    <GlitchCut at={c.auraFarming} color="#42e8ff" />
    <GlitchCut at={c.hugeMistake} color="#ff4238" />
    <GlitchCut at={c.stillFull} color="#3deeff" />
    <FilmLook vignette={0.22} />
    <Captions
      words={words}
      palette={P}
      variant="word"
      y={0.5}
      highlight={[
        "puh",
        "unsinkable",
        "269",
        "3",
        "16",
        "floats.",
        "twist.",
        "3",
        "ice",
        "29",
        "fourth?",
        "aura",
        "20",
        "1894",
        "22",
        "locked.",
        "key.",
        "400",
        "mistake.",
        "stops.",
        "6",
        "3,800",
        "pool.",
        "water.",
        "two",
        "Titanic.",
        "Follow,",
        "Because...",
      ]}
    />
    <Sound />
  </AbsoluteFill>
);
