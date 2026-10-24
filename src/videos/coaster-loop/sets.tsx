import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Grain } from "../../lib/ViewMode";
import { fonts } from "../../lib/theme";
import { easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { Cam, CameraRig, project, V3 } from "../../lib/three/core";
import { CoasterLoop, loopRide, loopShape } from "../../lib/three/CoasterLoop";
import { c } from "./cues";

type SetProps = { f: number };
const GOLD = "#ffd166";
const R = 3;

const Canvas: React.FC<{ children: React.ReactNode; cam: Cam; fog?: [string, number, number] }> = ({ children, cam, fog }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.1, far: 400 }} gl={{ antialias: true }}>
      <CameraRig cam={cam} />
      {fog ? <fog attach="fog" args={fog} /> : null}
      {children}
    </ThreeCanvas>
  );
};
const at = (cam: Cam, p: V3) => project(p, cam, 1080, 1920);

const Ground: React.FC<{ color: string }> = ({ color }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
    <planeGeometry args={[400, 400]} />
    <meshStandardMaterial color={color} roughness={1} />
  </mesh>
);

const PALMS = (() => {
  const r = seeded(4);
  return Array.from({ length: 9 }, () => ({ x: -14 + r() * 28, z: -8 - r() * 14, h: 3 + r() * 2.5 }));
})();

/** Palm: a slightly bent trunk and drooping fronds (flattened spheres read as mushrooms). */
const Palm: React.FC<{ p: { x: number; z: number; h: number }; trunk: string; leaf: string }> = ({ p, trunk, leaf }) => (
  <group position={[p.x, -0.6, p.z]}>
    <mesh position={[0, p.h / 2, 0]} rotation={[0, 0, 0.06]}>
      <cylinderGeometry args={[0.05, 0.1, p.h, 6]} />
      <meshStandardMaterial color={trunk} />
    </mesh>
    {Array.from({ length: 7 }, (_, k) => (
      <group key={k} position={[-p.h * 0.03, p.h, 0]} rotation={[0, (k / 7) * Math.PI * 2, 0]}>
        <mesh position={[0.55, -0.12, 0]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[1.2, 0.03, 0.22]} />
          <meshStandardMaterial color={leaf} />
        </mesh>
      </group>
    ))}
  </group>
);

// ───────────────────────── A · modern teardrop loop at sunset; a circle doesn't fit (hook + loop) ─────────────────────────
export const SetSunset: React.FC<SetProps> = ({ f }) => {
  const t = keys(f, [
    [0, 0],
    [c.y1895, 1],
    [c.look, 0.5],
    [c.end - 2, 0],
  ]);
  const cam: Cam = { pos: [2.5 + 1.2 * t, 2.8, 18.5 - 1.5 * t], look: [0.2, 3.2, 0.4], fov: 40 };
  const ride = loopRide(f / 30 + 0.6, 0, R, 4.2);
  // projected circle overlay: centre and radius of the "would-be" circle at the loop's position
  const ctr = at(cam, [0, R, 0.45]);
  const edge = at(cam, [R, R, 0.45]);
  const circleO = f < c.y1895 ? ramp(f, 4, 14) : ramp(f, c.look + 6, c.look + 16);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #2a2350 0%, #a4507a 45%, #f39a5b 70%, #ffd29a 82%)" }}>
      <Canvas cam={cam} fog={["#c9806e", 30, 120]}>
        <hemisphereLight args={["#ffd0b0", "#2a2030", 1.0]} />
        <directionalLight position={[-12, 5, -6]} intensity={2.2} color="#ffb07a" castShadow />
        <directionalLight position={[8, 6, 10]} intensity={0.6} color="#9fb4ff" />
        <CoasterLoop round={0} R={R} ride={ride} />
        <Ground color="#2b2238" />
        {PALMS.map((p, i) => (
          <Palm key={i} p={p} trunk="#1a1420" leaf="#1a1420" />
        ))}
      </Canvas>
      {ctr && edge && circleO > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={ctr.x} cy={ctr.y} r={Math.abs(edge.x - ctr.x)} fill="none" stroke="#ffffff" strokeWidth={5} strokeDasharray="18 14" opacity={0.85 * circleO} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── B · 1895, Coney Island: a round wooden loop (sepia film) ─────────────────────────
export const Set1895: React.FC<SetProps> = ({ f }) => {
  const cam: Cam = {
    pos: keys3(f, [
      [c.y1895, [-8, 2.4, 12]],
      [c.why, [-6, 2.0, 10.5]],
    ]),
    look: [0, 2.6, 0.4],
    fov: 40,
  };
  const ride = loopRide((f - c.y1895) / 30 + 1.2, 1, R, 4.6);
  const flick = 0.96 + 0.04 * Math.sin(f * 0.21) * Math.sin(f * 0.13); // gentle projector breathing, no strobe
  return (
    <AbsoluteFill style={{ background: "#b9a27e" }}>
      <AbsoluteFill style={{ filter: `sepia(0.9) contrast(1.05) brightness(${flick})` }}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, #d9d2c2 0%, #c9bfa8 60%, #8f8064 100%)" }} />
        <Canvas cam={cam} fog={["#cfc6b1", 18, 60]}>
          <hemisphereLight args={["#ffffff", "#5a4a3a", 1.1]} />
          <directionalLight position={[6, 10, 6]} intensity={1.6} castShadow />
          <CoasterLoop round={1} R={R} ride={ride} style="wood" />
          <Ground color="#7a6a52" />
          {/* boardwalk crowd posts */}
          {Array.from({ length: 14 }, (_, i) => (
            <mesh key={i} position={[-9 + i * 1.3, 0, 4]}>
              <cylinderGeometry args={[0.05, 0.05, 1.2, 6]} />
              <meshStandardMaterial color="#5a4632" />
            </mesh>
          ))}
        </Canvas>
      </AbsoluteFill>
      <Grain amount={0.18} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(40,25,10,0.65) 100%)" }} />
      <div style={{ position: "absolute", left: "50%", top: 250, transform: "translate(-50%,0)", padding: "8px 24px", background: "rgba(30,20,10,0.75)", color: "#f3e6c8", fontFamily: fonts.hud, fontWeight: 700, fontSize: 44, letterSpacing: 5, whiteSpace: "nowrap" }}>
        CONEY ISLAND · 1895
      </div>
      {f >= c.injuries ? (
        <div style={{ position: "absolute", left: "50%", top: 350, transform: "translate(-50%,0)", opacity: ramp(f, c.injuries, c.injuries + 6), padding: "8px 26px", background: "#b8322a", color: "#fff", fontFamily: fonts.hud, fontWeight: 700, fontSize: 44, letterSpacing: 4, whiteSpace: "nowrap" }}>
          NECK & BACK INJURIES
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── C/D · blueprint physics: slow at the top, fast at the bottom → 6 g ─────────────────────────
// angle from the bottom (0) round the loop; speed² ∝ 5 − 2(1 − cos θ) for the minimum-speed circle (g·r = 1)
const thetaAt = (t: number) => {
  let th = 0;
  const dt = 1 / 30;
  for (let k = 0; k < Math.floor(t / dt); k++) {
    const v = Math.sqrt(Math.max(0.05, 5 - 2 * (1 - Math.cos(th))));
    th += v * dt * 1.15;
  }
  return th % (Math.PI * 2);
};

export const SetPhysics: React.FC<SetProps> = ({ f }) => {
  const cx = 540;
  const cy = 640;
  const r = 280;
  const th = thetaAt((f - c.why) / 30);
  const car = { x: cx + r * Math.sin(th), y: cy + r * Math.cos(th) };
  const v = Math.sqrt(Math.max(0.05, 5 - 2 * (1 - Math.cos(th))));
  const tan = { x: Math.cos(th), y: -Math.sin(th) };
  const topO = ramp(f, c.top, c.top + 8);
  const botO = ramp(f, c.bottom, c.bottom + 8);
  const sizes = f >= c.matter ? ramp(f, c.matter, c.matter + 14, easeOut) : 0;
  return (
    <AbsoluteFill
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(127,232,255,0.06) 0 2px, transparent 2px 60px), repeating-linear-gradient(90deg, rgba(127,232,255,0.06) 0 2px, transparent 2px 60px), #061a2e",
      }}
    >
      <svg width={1080} height={1920}>
        {/* the loop */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#9fe9ff" strokeWidth={10} opacity={1 - sizes} />
        {/* top: just enough speed */}
        <g opacity={topO * (1 - sizes)}>
          <line x1={cx} y1={cy - r} x2={cx - 70} y2={cy - r} stroke={GOLD} strokeWidth={8} markerEnd="url(#arr)" />
          <text x={cx} y={cy - r - 40} textAnchor="middle" fill={GOLD} style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 38, letterSpacing: 3 }}>
            JUST ENOUGH SPEED
          </text>
        </g>
        {/* bottom: much faster */}
        <g opacity={botO * (1 - sizes)}>
          <line x1={cx} y1={cy + r} x2={cx + 230} y2={cy + r} stroke="#ff6b6b" strokeWidth={10} markerEnd="url(#arr2)" />
          <text x={cx} y={cy + r + 70} textAnchor="middle" fill="#ff6b6b" style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 38, letterSpacing: 3 }}>
            MUCH FASTER
          </text>
        </g>
        <defs>
          <marker id="arr" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={GOLD} />
          </marker>
          <marker id="arr2" markerWidth="8" markerHeight="8" refX="5" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#ff6b6b" />
          </marker>
        </defs>
        {/* the car + its live speed arrow */}
        {sizes < 0.5 ? (
          <g>
            <line x1={car.x} y1={car.y} x2={car.x + tan.x * 40 * v} y2={car.y + tan.y * 40 * v} stroke="#ffffff" strokeWidth={6} />
            <circle cx={car.x} cy={car.y} r={26} fill="#2b6cff" stroke="#ffffff" strokeWidth={5} />
          </g>
        ) : null}
        {/* "no matter how big": three circles, all 6 g */}
        {sizes > 0
          ? [
              { r: 80, x: 170 },
              { r: 140, x: 410 },
              { r: 220, x: 800 },
            ].map((k, i) => (
              // side by side, small → large, all standing on the same baseline
              <g key={i} opacity={ramp(sizes, i * 0.2, i * 0.2 + 0.4)}>
                <circle cx={k.x} cy={980 - k.r} r={k.r} fill="none" stroke="#9fe9ff" strokeWidth={6} />
                <text x={k.x} y={980 - k.r + 18} textAnchor="middle" fill="#ff6b6b" style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 30 + k.r * 0.15 }}>
                  6 G
                </text>
              </g>
            ))
          : null}
      </svg>
    </AbsoluteFill>
  );
};

// ───────────────────────── E · the circle bends into a teardrop (3D morph) ─────────────────────────
export const SetMorph: React.FC<SetProps> = ({ f }) => {
  const round = 1 - ramp(f, c.engineers + 4, c.teardrop + 14, easeOut);
  const cam: Cam = { pos: [0.6, 3.6, 21], look: [0.3, 3.4, 0.4], fov: 40 };
  const ride = loopRide((f - c.engineers) / 30 + 2.0, round, R, 4.2);
  const [, yTop] = loopShape(Math.PI, round, R);
  const bottomL = at(cam, [loopShape(Math.PI * 0.18, round, R)[0] + 0.4, loopShape(Math.PI * 0.18, round, R)[1], 0.2]);
  const topL = at(cam, [0, yTop + 0.2, 0.45]);
  return (
    <AbsoluteFill
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(127,232,255,0.05) 0 2px, transparent 2px 60px), repeating-linear-gradient(90deg, rgba(127,232,255,0.05) 0 2px, transparent 2px 60px), #081a2c",
      }}
    >
      <Canvas cam={cam}>
        <hemisphereLight args={["#d6e6ff", "#202a38", 1.2]} />
        <directionalLight position={[4, 8, 10]} intensity={1.6} />
        <CoasterLoop round={round} R={R} ride={ride} />
      </Canvas>
      {bottomL && f >= c.wide ? <Note x={540} y={Math.min(1420, bottomL.y + 120)} title="WIDE" sub="YOU'RE FAST → GENTLE TURN" color={GOLD} o={ramp(f, c.wide, c.wide + 6)} align="center" /> : null}
      {topL && f >= c.tight ? <Note x={topL.x} y={topL.y - 140} title="TIGHT" sub="YOU'RE SLOW → STILL PRESSED IN" color="#9fe9ff" o={ramp(f, c.tight, c.tight + 6)} align="center" /> : null}
    </AbsoluteFill>
  );
};

const Note: React.FC<{ x: number; y: number; title: string; sub: string; color: string; o: number; align: "left" | "center" }> = ({ x, y, title, sub, color, o, align }) => (
  <div
    style={{
      position: "absolute",
      left: Math.min(1000, Math.max(80, x)),
      top: y,
      transform: align === "center" ? "translate(-50%,0)" : "translate(-30%,0)",
      opacity: o,
      textAlign: "center",
      whiteSpace: "nowrap",
      padding: "8px 20px",
      background: "rgba(6,20,36,0.85)",
      border: `3px solid ${color}`,
    }}
  >
    <div style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 56, color }}>{title}</div>
    <div style={{ fontFamily: fonts.hud, fontWeight: 600, fontSize: 28, letterSpacing: 3, color: "#d8f7ff" }}>{sub}</div>
  </div>
);

// ───────────────────────── F · 1976: Revolution, the first modern loop ─────────────────────────
export const SetRevolution: React.FC<SetProps> = ({ f }) => {
  const cam: Cam = {
    pos: keys3(f, [
      [c.y1976, [-4.5, 2.4, 19.5]],
      [c.look, [-3.0, 2.0, 18]],
    ]),
    look: [0.4, 3.0, 0.4],
    fov: 40,
  };
  const ride = loopRide((f - c.y1976) / 30 + 0.2, 0, R, 4.2);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #3d7fd9 0%, #8fc0f0 60%, #e9f2fa 100%)" }}>
      <Canvas cam={cam} fog={["#cfe0f0", 30, 140]}>
        <hemisphereLight args={["#e6f0ff", "#7a6a4a", 1.2]} />
        <directionalLight position={[10, 14, 8]} intensity={2.4} color="#fff3dc" castShadow shadow-mapSize={[2048, 2048]} />
        <CoasterLoop round={0} R={R} ride={ride} trackColor="#e9ecf2" />
        <Ground color="#b9a77a" />
        {/* dry California hills */}
        {[-30, -5, 22].map((x, i) => (
          <mesh key={i} position={[x, -0.6, -45]} scale={[18, 6 + i * 2, 10]}>
            <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#9a8a5e" roughness={1} />
          </mesh>
        ))}
        {PALMS.map((p, i) => (
          <Palm key={i} p={p} trunk="#6b5a40" leaf="#3e6b35" />
        ))}
      </Canvas>
      <div style={{ position: "absolute", left: "50%", top: 250, transform: "translate(-50%,0)", opacity: ramp(f, c.revolution, c.revolution + 8), textAlign: "center", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-block", padding: "8px 24px", background: "rgba(8,10,22,0.82)", color: "#fff", fontFamily: fonts.hud, fontWeight: 700, fontSize: 44, letterSpacing: 4 }}>REVOLUTION · 1976</div>
        <div style={{ marginTop: 8, fontFamily: fonts.hud, fontSize: 28, letterSpacing: 3, color: "#0b1530" }}>SIX FLAGS MAGIC MOUNTAIN, CALIFORNIA</div>
      </div>
    </AbsoluteFill>
  );
};
