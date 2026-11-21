import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { GlitchCut, ViewMode } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { ramp } from "../../lib/timing";
import track from "../../../public/vob/flank_track.json";
import { c, words } from "./cues";
import { DateTag, SetHeight, SetMagma, SetMap, Tag } from "./sets";
import { Hud, Sound } from "./Volcano";

// Same reel; the 3D sets are Blender renders: blender/volcano.py → public/vob/frames (or /draft).
// The magma lab, blast map and height comparison stay vector graphics.
const P = palettes.deep;
const pad = (n: number) => String(n).padStart(4, "0");

export type VolcanoBlenderProps = { plate: string };

const Plate: React.FC<{ dir: string }> = ({ dir }) => {
  const f = useCurrentFrame();
  return <Img src={staticFile(`${dir}/f_${pad(f)}.jpg`)} style={{ width: "100%", height: "100%" }} />;
};

const HelensOverlay: React.FC = () => {
  const f = useCurrentFrame();
  const p = track.points.flank[f - track.from];
  return (
    <>
      {p && f >= c.pressure && f < c.north ? <Tag x={p[0]} y={p[1]} text="NORTH FLANK SWELLING" o={ramp(f, c.pressure + 4, c.pressure + 10)} /> : null}
      {f >= c.y1980 && f < c.blast ? <DateTag o={ramp(f, c.y1980, c.y1980 + 6)} /> : null}
    </>
  );
};

export const World: React.FC<{ dir: string }> = ({ dir }) => {
  const f = useCurrentFrame();
  if (f >= c.every && f < c.pressure) return <SetMagma f={f} />;
  if (f >= c.blast && f < c.lost) return <SetMap f={f} />;
  if (f >= c.lost && f < c.danger) return <SetHeight f={f} />;
  return (
    <ViewMode mode={f >= c.burst && f < c.blast ? "danger" : "normal"} id="helens">
      <Plate dir={dir} />
    </ViewMode>
  );
};

export const VolcanoBlender: React.FC<VolcanoBlenderProps> = ({ plate }) => (
  <AbsoluteFill style={{ background: "#020305" }}>
    <World dir={plate} />
    <HelensOverlay />
    <Hud />
    <GlitchCut at={c.every} color="#ffb070" />
    <LoopBridge frames={16} opening={<World dir={plate} />} />
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
