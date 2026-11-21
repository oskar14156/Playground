import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Env, Post } from "../../lib/three/diorama";
import { Cam, CameraRig, project, V3 } from "../../lib/three/core";
import { fonts } from "../../lib/theme";
import { easeOut, ramp } from "../../lib/timing";

// ───────────────────────── 3D helpers ─────────────────────────
export const Canvas: React.FC<{ children: React.ReactNode; cam: Cam; fog?: [string, number, number]; bg?: string; post?: { bloom?: number; ao?: number; vignette?: number; env?: number } }> = ({ children, cam, fog, bg, post }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.05, far: 600 }} gl={{ antialias: true, toneMapping: post ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping }}>
      <CameraRig cam={cam} />
      {bg ? <color attach="background" args={[bg]} /> : null}
      {fog ? <fog attach="fog" args={fog} /> : null}
      {children}
      {post ? (
        <>
          <Env intensity={post.env ?? 0.35} />
          <Post {...post} />
        </>
      ) : null}
    </ThreeCanvas>
  );
};

export const at = (cam: Cam, p: V3) => project(p, cam, 1080, 1920);

/** A plain box with a matte material (the whole kit is low-poly like a diorama). */
export const Box: React.FC<{ p: V3; s: V3; color: string; rot?: V3; emissive?: string; ei?: number; rough?: number; cast?: boolean }> = ({ p, s, color, rot, emissive, ei = 0, rough = 0.8, cast = true }) => (
  <mesh position={p} rotation={rot} castShadow={cast} receiveShadow>
    <boxGeometry args={s} />
    <meshStandardMaterial color={color} roughness={rough} emissive={emissive ?? "#000"} emissiveIntensity={ei} />
  </mesh>
);

/** Room shell (floor + back wall + left wall), open toward the camera at +z / +x. */
export const Room: React.FC<{ w: number; d: number; h: number; floor: string; wall: string; wall2?: string }> = ({ w, d, h, floor, wall, wall2 }) => (
  <group>
    <Box p={[0, -0.05, 0]} s={[w, 0.1, d]} color={floor} cast={false} />
    <Box p={[0, h / 2, -d / 2]} s={[w, h, 0.12]} color={wall} cast={false} />
    <Box p={[-w / 2, h / 2, 0]} s={[0.12, h, d]} color={wall2 ?? wall} cast={false} />
  </group>
);

/** A seated / standing person in dark clothes — the viewer's stand-in, always seen from behind. */
export const You: React.FC<{ p: V3; ry?: number; seated?: boolean }> = ({ p, ry = 0, seated }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <mesh position={[0, seated ? 0.62 : 1.1, 0]} castShadow>
      <capsuleGeometry args={[0.2, seated ? 0.42 : 0.62, 6, 12]} />
      <meshStandardMaterial color="#2d3540" roughness={0.9} />
    </mesh>
    <mesh position={[0, seated ? 1.12 : 1.72, 0]} castShadow>
      <sphereGeometry args={[0.13, 16, 12]} />
      <meshStandardMaterial color="#1b1612" roughness={0.9} />
    </mesh>
  </group>
);

// ───────────────────────── 2D overlays ─────────────────────────
const glass = "rgba(9,11,16,0.84)";

/** Chapter card: big clock time + title, center screen, ~2 s. */
export const ChapterCard: React.FC<{ at: number; time: string; title: string }> = ({ at: a, time, title }) => {
  const f = useCurrentFrame();
  if (f < a || f > a + 58) return null;
  const o = ramp(f, a, a + 6) * (1 - ramp(f, a + 48, a + 58));
  const s = 0.9 + 0.1 * ramp(f, a, a + 10, easeOut);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: o, background: `rgba(0,0,0,${0.45 * o})` }}>
      <div style={{ transform: `scale(${s})`, textAlign: "center" }}>
        <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: "#ff5a4f" }}>DAY 1</div>
        <div style={{ fontFamily: fonts.punch, fontWeight: 800, fontSize: 150, color: "#fff", lineHeight: 1, textShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>{time}</div>
        <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 52, letterSpacing: 8, color: "#ffd166", marginTop: 10 }}>{title}</div>
      </div>
    </AbsoluteFill>
  );
};

export type Status = { time: string; water?: string; food?: string; cases?: string; phone?: string };

/** Survival status panel (top-left), always the same place once the plan starts. */
export const StatusPanel: React.FC<{ from: number; s: Status }> = ({ from, s }) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const o = ramp(f, from, from + 8);
  const row = (k: string, v: string | undefined, col = "#fff") =>
    v ? (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 26 }}>
        <span style={{ color: "rgba(255,255,255,0.55)" }}>{k}</span>
        <span style={{ color: col }}>{v}</span>
      </div>
    ) : null;
  return (
    <div style={{ position: "absolute", left: 40, top: 150, opacity: o, minWidth: 300, padding: "16px 22px", borderRadius: 14, background: glass, border: "1.5px solid rgba(255,255,255,0.14)", fontFamily: fonts.hud, fontWeight: 700, fontSize: 30, letterSpacing: 2, lineHeight: 1.45 }}>
      <div style={{ color: "#ff5a4f", fontSize: 26, letterSpacing: 4 }}>● DAY 1 · {s.time}</div>
      {row("WATER", s.water, "#7fd6ff")}
      {row("FOOD", s.food, "#ffd166")}
      {row("CASES", s.cases, "#ff6b6b")}
      {row("PHONE", s.phone)}
    </div>
  );
};

/** Small white info tag pinned to a screen point (like a museum label). */
export const InfoTag: React.FC<{ x: number; y: number; title: string; sub?: string; o: number; align?: "left" | "right" }> = ({ x, y, title, sub, o, align = "left" }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `translate(${align === "right" ? "-100%" : "0"}, -50%)` }}>
    <div style={{ background: "#f4f1ea", color: "#111", padding: "8px 16px", borderRadius: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.45)", fontFamily: fonts.hud, whiteSpace: "nowrap" }}>
      <div style={{ fontWeight: 800, fontSize: 32, letterSpacing: 2 }}>{title}</div>
      {sub ? <div style={{ fontWeight: 600, fontSize: 22, opacity: 0.65, letterSpacing: 1 }}>{sub}</div> : null}
    </div>
  </div>
);

/** Rule card ("RULE 1 · STAY HOME" + why), top center. */
export const RuleCard: React.FC<{ at: number; until: number; n: number; title: string; why: string }> = ({ at: a, until, n, title, why }) => {
  const f = useCurrentFrame();
  if (f < a || f >= until) return null;
  const o = ramp(f, a, a + 6) * (1 - ramp(f, until - 6, until));
  return (
    <div style={{ position: "absolute", left: "50%", top: 420, transform: `translate(-50%,0) translateY(${(1 - o) * 20}px)`, opacity: o, width: 820, textAlign: "center", padding: "20px 28px", borderRadius: 16, background: "#f4f1ea", boxShadow: "0 14px 40px rgba(0,0,0,0.5)" }}>
      <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 28, letterSpacing: 6, color: "#c4302b" }}>RULE {n}</div>
      <div style={{ fontFamily: fonts.punch, fontWeight: 800, fontSize: 64, color: "#111", lineHeight: 1.05 }}>{title}</div>
      <div style={{ fontFamily: fonts.hud, fontWeight: 600, fontSize: 28, letterSpacing: 2, color: "#555", marginTop: 6 }}>{why}</div>
    </div>
  );
};

/** Big number + label, used inside infographic sets. */
export const BigNum: React.FC<{ value: string; label: string; color?: string; size?: number; o?: number; style?: React.CSSProperties }> = ({ value, label, color = "#ffd166", size = 130, o = 1, style }) => (
  <div style={{ textAlign: "center", opacity: o, ...style }}>
    <div style={{ fontFamily: fonts.punch, fontWeight: 800, fontSize: size, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 34, letterSpacing: 5, color: "rgba(255,255,255,0.75)", marginTop: 8 }}>{label}</div>
  </div>
);

/** Infographic backdrop: dark blue with a faint grid, like the explainer panels between scenes. */
export const Board: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #13213a 0%, #070b14 75%)" }}>
    <svg width={1080} height={1920} style={{ position: "absolute", opacity: 0.08 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <line key={`v${i}`} x1={i * 120} y1={0} x2={i * 120} y2={1920} stroke="#9cf" />
      ))}
      {Array.from({ length: 17 }, (_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 120} x2={1080} y2={i * 120} stroke="#9cf" />
      ))}
    </svg>
    {children}
  </AbsoluteFill>
);
