import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { Captions } from "../../lib/Captions";
import { FilmLook } from "../../lib/Backdrop";
import { LoopBridge } from "../../lib/Loop";
import { GlitchCut, HudOverlay, ViewMode } from "../../lib/ViewMode";
import { palettes } from "../../lib/theme";
import { easeOut, ramp } from "../../lib/timing";
import track from "../../../public/tib/wreck_track.json";
import { c, words } from "./cues";
import { InquiryCard, Measure, SetBlueprint, SetCompare, Tag } from "./sets";
import { Hud, Sound } from "./Titanic";

// Same reel; the 3D sets are Blender (EEVEE) renders: blender/titanic.py → public/tib/frames
// (or public/tib/draft for the quick preview). The two diagram sets stay vector graphics.
const P = palettes.night;
const pad = (n: number) => String(n).padStart(4, "0");

export type TitanicBlenderProps = { plate: string };

const Plate: React.FC<{ dir: string }> = ({ dir }) => {
  const f = useCurrentFrame();
  return <Img src={staticFile(`${dir}/f_${pad(f)}.jpg`)} style={{ width: "100%", height: "100%" }} />;
};

// cut from the ROV to the survey mosaic (same frame as SCAN_CUT in blender/titanic.py)
const SCAN = c.two - 4;
const LUMA = "0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0";

/** The debris field as a dark sonar/photo-mosaic scan: teal monochrome, a sweep that reveals it, a survey grid. */
const ScanLook: React.FC<{ dir: string }> = ({ dir }) => {
  const f = useCurrentFrame();
  const sweep = ramp(f, SCAN, SCAN + 22, easeOut);
  const y = sweep * 1920;
  return (
    <AbsoluteFill style={{ background: "#010407" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="scan" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={LUMA} />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0 0.04 0.16 0.45 0.85" />
            <feFuncG type="table" tableValues="0.02 0.16 0.5 0.86 1" />
            <feFuncB type="table" tableValues="0.03 0.2 0.55 0.86 0.97" />
          </feComponentTransfer>
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: "url(#scan) contrast(1.1)" }}>
        <Plate dir={dir} />
      </AbsoluteFill>
      {/* not yet scanned: dark below the sweep line */}
      <div style={{ position: "absolute", left: 0, right: 0, top: y, bottom: 0, background: "rgba(1,4,7,0.92)" }} />
      {sweep < 1 ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: y - 140, height: 140, background: "linear-gradient(180deg, rgba(90,255,230,0) 0%, rgba(90,255,230,0.18) 100%)", borderBottom: "3px solid rgba(150,255,240,0.9)", boxShadow: "0 0 24px rgba(120,255,235,0.8)" }} />
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: 0.16 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`v${i}`} x1={i * 120} y1={0} x2={i * 120} y2={1920} stroke="#8ff" strokeWidth={1.5} />
        ))}
        {Array.from({ length: 17 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 120} x2={1080} y2={i * 120} stroke="#8ff" strokeWidth={1.5} />
        ))}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%)" }} />
    </AbsoluteFill>
  );
};

const pt = (k: keyof typeof track.points, f: number) => {
  const p = track.points[k][f - track.from];
  return p ? { x: p[0], y: p[1] } : null;
};

const WreckOverlay: React.FC = () => {
  const f = useCurrentFrame();
  if (f < c.then || f >= c.so) return null;
  const a = pt("a", f);
  const b = pt("b", f);
  const bow = pt("bowTag", f);
  const stern = pt("sternTag", f);
  const line = ramp(f, c.apart, c.apart + 14, easeOut);
  return (
    <>
      {a && b && line > 0 ? <Measure a={a} b={b} t={line} label="600 M" /> : null}
      {bow && f >= c.two + 4 ? <Tag x={bow.x} y={bow.y} text="BOW" o={ramp(f, c.two + 4, c.two + 10)} /> : null}
      {stern && f >= c.two + 10 ? <Tag x={stern.x} y={stern.y} text="STERN" o={ramp(f, c.two + 10, c.two + 16)} /> : null}
      {f < SCAN ? (
        <HudOverlay color="#ffffff" title="ARGO · SEPT 1985" lines={["41°43′N  49°56′W", "DEPTH 3,800 M"]} />
      ) : (
        <HudOverlay color="#9ffff0" title="SURVEY MOSAIC" rec={false} lines={["41°43′N  49°56′W", "DEBRIS FIELD · 600 M"]} />
      )}
    </>
  );
};

export const World: React.FC<{ dir: string }> = ({ dir }) => {
  const f = useCurrentFrame();
  if (f >= SCAN && f < c.so) return <ScanLook dir={dir} />;
  if (f >= c.iceberg && f < c.stern) return <SetBlueprint f={f} />;
  if (f >= c.not && f < c.survivors) return <SetCompare f={f} />;
  if (f >= c.hull && f < c.snapped)
    return (
      <ViewMode mode="thermal" id="break">
        <Plate dir={dir} />
        <HudOverlay color="#ffffff" title="STRESS MAP" rec={false} lines={["BENDING LOAD", "HULL MIDSHIP"]} />
      </ViewMode>
    );
  return <Plate dir={dir} />;
};

const Inquiry: React.FC = () => {
  const f = useCurrentFrame();
  if (f < c.official || f >= c.truth) return null;
  return <InquiryCard f={f} o={ramp(f, c.official, c.official + 8, easeOut)} />;
};

export const TitanicBlender: React.FC<TitanicBlenderProps> = ({ plate }) => (
  <AbsoluteFill style={{ background: "#020306" }}>
    <World dir={plate} />
    <WreckOverlay />
    <Inquiry />
    <Hud />
    <GlitchCut at={c.then} color="#ffffff" />
    <GlitchCut at={SCAN} color="#8ffff0" />
    <GlitchCut at={c.hull} color="#ffb070" />
    <LoopBridge frames={16} opening={<World dir={plate} />} />
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
