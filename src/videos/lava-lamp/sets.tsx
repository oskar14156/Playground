import React, { useMemo } from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow, project, V3 } from "../../lib/three/core";
import { Env, Post, RB, Slab, tex } from "../../lib/three/diorama";
import { LavaLamp, LAMP, bottleR } from "../../lib/three/LavaLamp";
import { HudOverlay } from "../../lib/ViewMode";
import { fonts } from "../../lib/theme";
import { easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { c } from "./cues";

export type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const ORANGE = "#ffb347";

// ───────────────────────── shared 2D pieces ─────────────────────────
const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", left: 28, bottom: 34, fontFamily: fonts.ui, fontSize: 22, color: "rgba(255,255,255,0.7)", textShadow: "0 1px 4px #000" }}>{text}</div>
);

/** Label chip that points at a screen position (used over the 3D lamp). */
const Tag: React.FC<{ x: number; y: number; text: string; o: number; side?: "left" | "right"; color?: string }> = ({ x, y, text, o, side = "right", color = ORANGE }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: o, transform: `translate(${side === "right" ? "0" : "-100%"}, -50%)`, display: "flex", alignItems: "center", flexDirection: side === "right" ? "row" : "row-reverse", gap: 10 }}>
    <div style={{ width: 14, height: 14, borderRadius: 7, background: color, boxShadow: `0 0 14px ${color}` }} />
    <div style={{ width: 70, height: 3, background: color }} />
    <div style={{ padding: "8px 18px", borderRadius: 12, background: "rgba(10,8,14,0.82)", border: `2px solid ${color}`, fontFamily: fonts.hud, fontWeight: 700, fontSize: 38, letterSpacing: 2, color: "#fff", whiteSpace: "nowrap" }}>{text}</div>
  </div>
);

/** Big centred info line ("WARM → EXPANDS → LIGHTER ↑"). */
const Banner: React.FC<{ text: React.ReactNode; o: number; top?: number; color?: string }> = ({ text, o, top = 330, color = ORANGE }) => (
  <div style={{ position: "absolute", top, width: "100%", display: "flex", justifyContent: "center", opacity: o, transform: `translateY(${(1 - o) * 16}px)` }}>
    <div style={{ padding: "14px 30px", borderRadius: 18, background: "rgba(10,8,14,0.82)", border: "1.5px solid rgba(255,255,255,0.14)", fontFamily: fonts.punch, fontWeight: 800, fontSize: 46, color, letterSpacing: 1, whiteSpace: "nowrap", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>{text}</div>
  </div>
);

// ───────────────────────── PHOTO · real Cloudflare wall (Ken Burns) ─────────────────────────
/** A 4:3 or 3:4 photo filling the 9:16 frame: `pan` 0→1 moves across its width, `zoom` scales. */
const Photo: React.FC<{ src: string; w: number; h: number; pan: number; zoom: number; y?: number }> = ({ src, w, h, pan, zoom, y = 0.5 }) => {
  const H = 1920 * zoom;
  const W = (w / h) * H;
  const W2 = Math.max(W, 1080 * zoom);
  const H2 = (h / w) * W2;
  const left = -(W2 - 1080) * pan;
  const top = -(H2 - 1920) * y;
  return <Img src={staticFile(src)} style={{ position: "absolute", left, top, width: W2, height: H2 }} />;
};

export const SetWall: React.FC<SetProps> = ({ f }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Photo src="lava-lamp/photos/cf1.jpg" w={3840} h={2880} pan={0.15 + 0.5 * ramp(f, 0, c.lobby + 10)} zoom={1.08 + 0.06 * ramp(f, 0, c.lobby + 10)} />
    <Credit text="Photo: FASTILY · CC BY-SA 4.0 · Wikimedia Commons" />
  </AbsoluteFill>
);

export const SetLobby: React.FC<SetProps> = ({ f }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <Photo src="lava-lamp/photos/cf2.jpg" w={3840} h={2880} pan={0.42 + 0.12 * ramp(f, c.lobby, c.camera)} zoom={1.0 + 0.1 * ramp(f, c.lobby, c.camera)} />
    <div style={{ position: "absolute", left: 70, top: 330, opacity: fadeIn(f, c.lobby + 18), padding: "10px 22px", borderRadius: 12, background: "rgba(10,8,14,0.8)", fontFamily: fonts.hud, fontWeight: 700, fontSize: 36, letterSpacing: 3, color: "#fff" }}>📍 SAN FRANCISCO</div>
    <Credit text="Photo: HaeB · CC BY-SA 4.0 · Wikimedia Commons" />
  </AbsoluteFill>
);

export const SetCctv: React.FC<SetProps> = ({ f }) => {
  const t = Math.max(0, f - c.camera);
  const ts = `14:${String(22 + Math.floor((t + 37) / 30 / 60)).padStart(2, "0")}:${String(Math.floor(((t + 37) / 30) % 60)).padStart(2, "0")}`;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ filter: "saturate(0.85) contrast(1.08)" }}>
        <Photo src="lava-lamp/photos/cf3.jpg" w={3024} h={4032} pan={0.5} zoom={1.12 + 0.05 * ramp(f, c.camera, c.every)} y={0.45} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 5px)" }} />
      <HudOverlay color="#e8f6ff" rec title="CAM 01 · LOBBY" lines={[`LIVE  ${ts}`, "LAVARAND FEED"]} crosshair />
      <Credit text="Photo: HaeB · CC BY-SA 4.0 · Wikimedia Commons" />
    </AbsoluteFill>
  );
};

// ───────────────────────── CLIP · real footage (Pexels) ─────────────────────────
const Clip: React.FC<{ id: string; from: number; start: number; f: number; zoom?: [number, number]; until: number; rate?: number }> = ({ id, from, start, f, zoom = [1, 1.08], until, rate = 1 }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <AbsoluteFill style={{ transform: `scale(${zoom[0] + (zoom[1] - zoom[0]) * ramp(f, from, until)})` }}>
      <Sequence from={from} layout="none">
        <OffthreadVideo src={staticFile(`lava-lamp/clips/${id}.mp4`)} startFrom={Math.round(start * 30)} playbackRate={rate} muted style={{ width: 1080, height: 1920 }} />
      </Sequence>
    </AbsoluteFill>
  </AbsoluteFill>
);

/** Pixels → bytes: a grid over the footage and a column of hex bytes that keeps changing. */
const HEX = "0123456789abcdef";
const HexStream: React.FC<{ f: number; from: number }> = ({ f, from }) => {
  const o = fadeIn(f, from, 10);
  const step = Math.floor((f - from) / 3); // new bytes every 3 frames (deliberate data look)
  const rows = Array.from({ length: 9 }, (_, r) => {
    const rnd = seeded(7919 * (step + r * 13) + 17);
    return Array.from({ length: 6 }, () => HEX[Math.floor(rnd() * 16)] + HEX[Math.floor(rnd() * 16)]).join(" ");
  });
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`v${i}`} x1={i * 90} y1={0} x2={i * 90} y2={1920} stroke="rgba(255,255,255,0.16)" strokeWidth={1.5} />
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 90} x2={1080} y2={i * 90} stroke="rgba(255,255,255,0.16)" strokeWidth={1.5} />
        ))}
        {/* the sampled pixels */}
        {[[3, 6], [7, 9], [5, 12], [9, 5], [2, 14]].map(([cx, cy], i) => (
          <rect key={i} x={cx * 90} y={cy * 90} width={90} height={90} fill="none" stroke="#7dffb0" strokeWidth={4} opacity={((step + i) % 4) < 3 ? 1 : 0.4} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: "50%", top: 300, transform: "translateX(-50%)", padding: "18px 28px", borderRadius: 16, background: "rgba(4,10,8,0.84)", border: "2px solid #7dffb0", fontFamily: "Menlo, monospace", fontSize: 40, lineHeight: 1.35, color: "#7dffb0", whiteSpace: "pre" }}>
        {rows.slice(0, 5).join("\n")}
      </div>
    </AbsoluteFill>
  );
};

export const SetBlobs: React.FC<SetProps> = ({ f }) => (
  <AbsoluteFill>
    <Clip id="9113173" from={c.every} start={2} f={f} until={c.andRandom} zoom={[1.05, 1.15]} />
    {f >= c.random - 4 ? <HexStream f={f} from={c.random - 4} /> : null}
  </AbsoluteFill>
);

// ───────────────────────── KEY · random numbers → an encryption key ─────────────────────────
export const SetKey: React.FC<SetProps> = ({ f }) => {
  const locked = ramp(f, c.guess - 6, c.guess + 4, easeOut);
  const step = Math.floor((f - c.andRandom) / 2);
  const key = Array.from({ length: 4 }, (_, r) => {
    const rnd = seeded(31 * (f < c.guess ? step : 9999) + r * 101 + 5);
    return Array.from({ length: 16 }, () => HEX[Math.floor(rnd() * 16)]).join("");
  });
  const col = locked > 0.5 ? "#7dffb0" : "#ffc65c";
  const o = fadeIn(f, c.andRandom, 8);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, #1b1f2e 0%, #07080d 70%)" }}>
      <div style={{ position: "absolute", top: 360, width: "100%", display: "flex", justifyContent: "center", opacity: o }}>
        <svg width={300} height={340} viewBox="0 0 300 340">
          {/* shackle drops into the body when the key is set */}
          <path d={`M75 ${170 - 50 * (1 - locked)} V95 a75 75 0 0 1 150 0 V${170 - 50 * (1 - locked) + (1 - locked) * 0}`} transform={`translate(0 ${-40 * (1 - locked)})`} fill="none" stroke="#c9ced6" strokeWidth={30} strokeLinecap="round" />
          <rect x={30} y={160} width={240} height={170} rx={28} fill={col} opacity={0.95} />
          <circle cx={150} cy={230} r={20} fill="#0b0d14" />
          <rect x={141} y={240} width={18} height={50} rx={8} fill="#0b0d14" />
        </svg>
      </div>
      <div style={{ position: "absolute", top: 760, width: "100%", textAlign: "center", opacity: o, fontFamily: fonts.hud, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: "rgba(255,255,255,0.75)" }}>ENCRYPTION KEY</div>
      <div style={{ position: "absolute", top: 830, left: "50%", transform: "translateX(-50%)", opacity: o, padding: "22px 30px", borderRadius: 18, background: "rgba(0,0,0,0.5)", border: `2px solid ${col}`, fontFamily: "Menlo, monospace", fontSize: 48, lineHeight: 1.35, color: col, textAlign: "center", boxShadow: `0 0 ${40 * locked}px ${col}55` }}>
        {key.map((k) => (
          <div key={k}>{k}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const SetWhy: React.FC<SetProps> = ({ f }) => <Clip id="854961" from={c.why} start={6} f={f} until={c.inside} zoom={[1.0, 1.18]} />;

// ───────────────────────── 3D · the lamp, cut open ─────────────────────────
const Canvas3D: React.FC<{ cam: Cam; children: React.ReactNode; bloom?: number }> = ({ cam, children, bloom = 1.1 }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 34, near: 0.05, far: 100 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={["#08060b"]} />
      {children}
      <Env intensity={0.3} />
      <Post bloom={bloom} ao={1.2} vignette={0.6} />
    </ThreeCanvas>
  );
};

/** Dark room: walnut table + a faint back wall the lamp light falls on. */
const Room: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const wood = useMemo(() => tex("planks", "#3a2416", [2, 2], 21), []);
  const wall = useMemo(() => tex("plaster", "#2a2230", [3, 3], 22), []);
  return (
    <group>
      <Slab p={[0, -0.05, 0]} s={[8, 0.1, 5]} map={wood} rough={0.35} />
      <Slab p={[0, 3, -2.2]} s={[10, 7, 0.1]} map={wall} rough={0.95} />
      <hemisphereLight args={["#3a3550", "#120a08", 0.35]} />
      <pointLight position={[0, 2.6, -1.6]} intensity={2.2 * glow} distance={4} color="#ff8a3a" />
      <spotLight position={[3, 6, 4]} angle={0.4} penumbra={0.8} intensity={6} color="#b8c6ff" castShadow />
    </group>
  );
};

/** Rising heat shimmer: small glows that leave the bulb and fade upward (looping, frame-driven). */
const Heat: React.FC<{ f: number; o: number }> = ({ f, o }) => (
  <group>
    {Array.from({ length: 10 }, (_, i) => {
      const u = ((f / 45 + i / 10) % 1 + 1) % 1;
      const y = LAMP.baseTop + 0.05 + u * 1.2;
      const a = i * 2.4;
      const r = Math.min(0.18, bottleR(y) - 0.1);
      return <Glow key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r + 0.25]} size={0.35} color="#ff9a3a" opacity={o * 0.55 * Math.sin(u * Math.PI)} />;
    })}
  </group>
);

const yLo = LAMP.baseTop + 0.18;
const yHi = LAMP.bottleTop - 0.32;
const heroY = (h: number) => yLo + (yHi - yLo) * h;

export const SetLamp: React.FC<SetProps> = ({ f }) => {
  // story of one blob: swell at "expands", rise from "lighter" to "At the top", sink after "sinks"
  const hero = keys(f, [
    [c.expands - 4, 0],
    [c.lighter, 0.05],
    [c.top - 4, 1],
    [c.sinks - 6, 1],
    [c.trick + 6, 0.35],
  ]);
  const heat = keys(f, [[c.bulb, 0.3], [c.bulb + 24, 1]]);
  const cut = keys(f, [[c.inside, 0], [c.inside + 24, 0.75]]);
  const blobY = heroY(hero);
  const cam: Cam = {
    // starts on the whole lamp, then the bottle, the base, and follows the blob up and down
    pos: keys3(f, [
      [c.inside, [2.6, 2.7, 9.0]],
      [c.inside + 40, [1.3, 2.6, 6.0]],
      [c.bulb, [1.3, 2.6, 6.0]],
      [c.bulb + 20, [1.0, 1.9, 4.3]],
      [c.expands, [1.0, 1.9, 4.3]],
      [c.lighter, [1.0, blobY + 0.1, 4.6]],
      [c.top, [1.0, 3.1, 4.6]],
      [c.sinks, [1.1, 3.0, 4.9]],
      [c.trick, [1.2, 2.6, 5.6]],
    ]),
    look: keys3(f, [
      [c.inside, [0, 2.1, 0]],
      [c.inside + 40, [0, 2.5, 0]],
      [c.bulb, [0, 2.5, 0]],
      [c.bulb + 20, [0, 1.7, 0]],
      [c.expands, [0, 1.7, 0]],
      [c.lighter, [0, blobY, 0]],
      [c.top, [0, 3.05, 0]],
      [c.sinks, [0, 2.9, 0]],
      [c.trick, [0, 2.5, 0]],
    ]),
    fov: 34,
  };
  const at = (p: V3) => project(p, cam, 1080, 1920);
  const pWax = at([0.15, blobY, 0]);
  const pLiq = at([-bottleR(2.6) + 0.06, 2.6, 0]);
  const pBulb = at([0, LAMP.baseTop - 0.05, 0.2]);
  return (
    <AbsoluteFill>
      <Canvas3D cam={cam}>
        <Room glow={heat} />
        <LavaLamp t={f / 30} hero={hero} heat={heat} ambient={0} cut={cut} />
        <Heat f={f} o={ramp(f, c.bulb + 6, c.bulb + 20) * (1 - ramp(f, c.top, c.top + 10))} />
      </Canvas3D>
      {pWax && f < c.bulb ? <Tag x={pWax.x + 40} y={pWax.y} text="WAX" o={fadeIn(f, c.inside + 14)} /> : null}
      {pLiq && f < c.bulb ? <Tag x={pLiq.x - 40} y={pLiq.y} text="LIQUID" side="left" color="#ffd36b" o={fadeIn(f, c.inside + 22)} /> : null}
      {f >= c.weigh && f < c.bulb ? <Banner text="WAX ≈ LIQUID  (same weight)" o={fadeIn(f, c.weigh)} /> : null}
      {pBulb && f >= c.bulb && f < c.expands ? <Tag x={pBulb.x + 60} y={pBulb.y} text="BULB → HEAT" o={fadeIn(f, c.bulb + 8)} /> : null}
      {f >= c.expands && f < c.top ? (
        <Banner
          text={
            <span>
              WARM → EXPANDS{f >= c.lighter ? <span style={{ color: "#7dffb0" }}> → LIGHTER ↑</span> : null}
            </span>
          }
          o={fadeIn(f, c.expands)}
        />
      ) : null}
      {f >= c.top ? <Banner text={<span style={{ color: "#8fd0ff" }}>COOLS → HEAVIER ↓</span>} o={fadeIn(f, c.top + 6)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 3D · the float test (plain wax vs the 1960s recipe) ─────────────────────────
export const SetGlass: React.FC<SetProps> = ({ f }) => {
  const sink = ramp(f, c.recipe + 20, c.heavier + 6, easeOut);
  const waterTop = 1.55;
  const blockY = keys(f, [[c.recipe + 20, waterTop + 0.02], [c.heavier + 6, 0.85]]);
  const bob = Math.sin(f / 18) * 0.015 * (1 - sink);
  const cam: Cam = { pos: keys3(f, [[c.trick, [0.9, 2.4, 7.4]], [c.recipe, [0.6, 2.0, 6.4]], [c.coil, [0.5, 1.8, 6.0]]]), look: [0, 1.0, 0], fov: 34 };
  const glassGeo = useMemo(
    () =>
      new THREE.LatheGeometry(
        [new THREE.Vector2(0, 0.02), new THREE.Vector2(0.62, 0.02), new THREE.Vector2(0.66, 0.08), new THREE.Vector2(0.7, 2.0), new THREE.Vector2(0.67, 2.0), new THREE.Vector2(0.63, 0.1), new THREE.Vector2(0, 0.1)],
        96,
      ),
    [],
  );
  const pBlock = project([0.3, blockY + bob, 0], cam, 1080, 1920);
  return (
    <AbsoluteFill>
      <Canvas3D cam={cam} bloom={0.7}>
        <Room glow={0.6} />
        <pointLight position={[1.5, 2.5, 2]} intensity={8} distance={7} color="#fff2e0" />
        <mesh geometry={glassGeo} renderOrder={3}>
          <meshPhysicalMaterial key="g" color="#ffffff" transparent opacity={0.08} roughness={0.04} clearcoat={0.6} depthWrite={false} side={THREE.FrontSide} />
        </mesh>
        <mesh position={[0, (waterTop + 0.1) / 2, 0]} renderOrder={2}>
          <cylinderGeometry args={[0.64, 0.62, waterTop - 0.1, 96]} />
          <meshStandardMaterial key="w" color="#2f7fd0" emissive="#123a66" emissiveIntensity={0.4} transparent opacity={0.3} roughness={0.05} depthWrite={false} />
        </mesh>
        <RB p={[0, blockY + bob, 0]} s={[0.42, 0.26, 0.42]} r={0.04} color="#ff5a1a" emissive="#ff3a00" ei={0.55} rough={0.35} />
      </Canvas3D>
      {pBlock ? <Tag x={pBlock.x - 150} y={pBlock.y} side="left" text={f < c.recipe ? "PLAIN WAX" : "HEAVIER WAX"} o={fadeIn(f, c.floats - 4)} /> : null}
      {f >= c.floats && f < c.recipe ? <Banner text="PLAIN WAX FLOATS" o={fadeIn(f, c.floats)} /> : null}
      {f >= c.recipe ? <Banner text={<span>1960s RECIPE: <span style={{ color: "#7dffb0" }}>HEAVIER ON PURPOSE</span></span>} o={fadeIn(f, c.recipe + 4)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 3D · the coil at the bottom ─────────────────────────
export const SetCoil: React.FC<SetProps> = ({ f }) => {
  // a sinking blob reaches the pool on "melt back together" and merges
  const hero = keys(f, [[c.coil, 0.32], [c.melt + 6, 0.0]]);
  const cam: Cam = { pos: keys3(f, [[c.coil, [1.4, 2.4, 4.2]], [c.melt, [0.9, 1.9, 3.0]]]), look: keys3(f, [[c.coil, [0, 1.85, 0]], [c.melt, [0, 1.55, 0]]]), fov: 34 };
  const pCoil = project([-0.2, LAMP.baseTop + 0.09, 0.05], cam, 1080, 1920);
  return (
    <AbsoluteFill>
      <Canvas3D cam={cam}>
        <Room glow={1} />
        <LavaLamp t={f / 30} hero={hero} heat={1} ambient={0} cut={0.75} />
      </Canvas3D>
      {pCoil && f < c.melt ? <Tag x={pCoil.x - 40} y={pCoil.y} text="METAL COIL" side="left" color="#cfd6de" o={fadeIn(f, c.coil + 10)} /> : null}
      {f >= c.melt ? <Banner text="BLOBS MERGE AGAIN" o={fadeIn(f, c.melt)} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── product + loop footage ─────────────────────────
export const SetWant: React.FC<SetProps> = ({ f }) => (
  <AbsoluteFill>
    <Clip id="9113217" from={c.want} start={4} f={f} until={c.because} zoom={[1.0, 1.1]} />
    <div style={{ position: "absolute", top: 340, width: "100%", display: "flex", justifyContent: "center", opacity: fadeIn(f, c.linked - 4), transform: `scale(${0.85 + 0.15 * fadeIn(f, c.linked - 4)})` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 34px", borderRadius: 40, background: "#ffffff", boxShadow: "0 12px 40px rgba(0,0,0,0.5)", fontFamily: fonts.punch, fontWeight: 800, fontSize: 52, color: "#111" }}>
        🛒 LINK IN BIO
      </div>
    </div>
    <div style={{ position: "absolute", top: 450, width: "100%", textAlign: "center", opacity: fadeIn(f, c.linked), fontFamily: fonts.ui, fontSize: 26, color: "rgba(255,255,255,0.75)" }}>Ad · affiliate link</div>
    {f >= c.hour ? (
      <div style={{ position: "absolute", top: 520, width: "100%", display: "flex", justifyContent: "center", opacity: fadeIn(f, c.hour + 6) }}>
        <div style={{ padding: "12px 28px", borderRadius: 18, background: "rgba(10,8,14,0.82)", border: "1.5px solid rgba(255,255,255,0.14)", fontFamily: fonts.punch, fontWeight: 800, fontSize: 56, color: ORANGE }}>
          WARM-UP <span style={{ color: "#fff" }}>1–3 H</span>
        </div>
      </div>
    ) : null}
  </AbsoluteFill>
);

export const SetOutro: React.FC<SetProps> = ({ f }) => <Clip id="2006729" from={c.because} start={3} f={f} until={c.end} zoom={[1.05, 1.15]} />;
