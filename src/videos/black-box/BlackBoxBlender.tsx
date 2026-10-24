import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { HudOverlay } from "../../lib/ViewMode";
import { fonts, palettes } from "../../lib/theme";
import { ramp } from "../../lib/timing";
import { c, words } from "./cues";
import { Hud, Sound } from "./BlackBox";

// Same reel, but every picture is a Blender (EEVEE) render: blender/blackbox.py → public/bbb/frames.
// Remotion only adds what the old version had on top: captions, HUD, sound, the loop dissolve.
const P = palettes.deep;
const pad = (n: number) => String(n).padStart(4, "0");

const Plate: React.FC = () => {
  const f = useCurrentFrame();
  return <Img src={staticFile(`bbb/frames/f_${pad(f)}.jpg`)} style={{ width: "100%", height: "100%" }} />;
};

const Tag: React.FC<{ at: number; until: number; title: string; sub?: string; top: number }> = ({ at, until, title, sub, top }) => {
  const f = useCurrentFrame();
  if (f < at || f >= until) return null;
  const o = ramp(f, at, at + 6) * (1 - ramp(f, until - 6, until));
  return (
    <div style={{ position: "absolute", left: "50%", top, transform: `translate(-50%,0) translateY(${(1 - o) * 14}px)`, opacity: o, textAlign: "center", whiteSpace: "nowrap" }}>
      <div style={{ display: "inline-block", background: P.accent, color: "#111", fontFamily: fonts.hud, fontWeight: 700, fontSize: 44, padding: "4px 18px", letterSpacing: 2 }}>{title}</div>
      {sub ? <div style={{ marginTop: 6, fontFamily: fonts.hud, fontWeight: 600, fontSize: 26, letterSpacing: 3, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>{sub}</div> : null}
    </div>
  );
};

const Tests: React.FC = () => {
  const f = useCurrentFrame();
  if (f < c.tests || f >= c.first) return null;
  return (
    <div style={{ position: "absolute", top: 420, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 22 }}>
      {["IMPACT", "FIRE", "OCEAN"].map((t, i) => {
        const o = ramp(f, c.tests + i * 5, c.tests + i * 5 + 6);
        return (
          <div key={t} style={{ opacity: o, padding: "10px 22px", border: "3px solid #7fe8ff", background: "rgba(6,24,43,0.85)", fontFamily: fonts.hud, fontWeight: 700, fontSize: 42, letterSpacing: 3, color: "#d8f7ff" }}>
            <span style={{ color: P.accent }}>{i + 1}</span> {t}
          </div>
        );
      })}
    </div>
  );
};

const ImpactDim: React.FC = () => {
  const f = useCurrentFrame();
  if (f < c.fighter - 4 || f >= c.fire) return null;
  const bo = f - c.blacks;
  const blackout = bo >= 0 && bo < 22 ? Math.sin((bo / 22) * Math.PI) : 0;
  return (
    <>
      <AbsoluteFill style={{ background: "#05070a", opacity: ramp(f, c.fighter - 4, c.fighter + 6) * 0.5 }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,${0.6 * blackout}) 0%, rgba(0,0,0,${blackout}) 55%)` }} />
    </>
  );
};

const Sonar: React.FC = () => {
  const f = useCurrentFrame();
  if (f < c.underwater || f >= c.so) return null;
  const alive = f < c.silent;
  return <HudOverlay color="#bfffe0" title="SONAR · ULB" rec={alive} lines={alive ? ["FREQ 37.5 KHZ", "1 PING / SEC"] : ["FREQ 37.5 KHZ", "NO SIGNAL"]} />;
};

export const World: React.FC = () => <Plate />;

export const BlackBoxBlender: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <World />
    <Tag at={c.orange + 2} until={c.search} title="HIGH-VIS ORANGE" sub="PAINTED TO BE FOUND" top={300} />
    <Tag at={c.wreckage + 4} until={c.tail} title="FLIGHT RECORDER" sub="SPOTTED BY ITS COLOUR" top={300} />
    <Tag at={c.tailWord + 8} until={c.armor} title="FLIGHT RECORDERS" sub="TAIL · MOST SURVIVABLE SECTION" top={300} />
    <Tag at={c.armorWord} until={c.chip} title="ARMOR" sub="ORANGE STEEL SHELL" top={300} />
    <Tag at={c.chip + 10} until={c.tests} title="MEMORY UNIT" sub="CRASH-SURVIVABLE MEMORY · CHIPS INSIDE" top={300} />
    <Tests />
    <ImpactDim />
    <Sonar />
    <Hud />
    <LoopBridge frames={16} opening={<World />} />
    <FilmLook vignette={0.35} />
    <Captions words={words} palette={P} variant="punch" y={0.7} highlight={["black", "orange", "tail", "armor", "chip", "fire", "ocean", "silent", "found", "blacks"]} />
    <Sound />
  </AbsoluteFill>
);
