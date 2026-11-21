import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { HudOverlay, ViewMode } from "../../lib/ViewMode";
import { fonts } from "../../lib/theme";
import { easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { Cam, CameraRig, Glow, glowTexture, project, Stars3D, TubePath, V3 } from "../../lib/three/core";
import { Arrow, Drift, Dunes } from "../../lib/three/fx";
import { LINER, OceanLiner } from "../../lib/three/OceanLiner";
import { Humanoid, seated } from "../../lib/three/Humanoid";
import { Lifeboat, SEAT_Y, THWARTS } from "../../lib/three/Lifeboat";
import { c } from "./cues";

type SetProps = { f: number };
const deg = (d: number) => (d * Math.PI) / 180;

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

/** Ship pitched about a point on the waterline (bow-down = negative pitch), sunk by `sink`. */
const Ship: React.FC<{ f: number; pitch?: number; pivot?: number; sink?: number; split?: number; lights?: number; stress?: number; sternDrop?: number; bowDrop?: number }> = ({
  f,
  pitch = 0,
  pivot = 0.8,
  sink = 0,
  ...rest
}) => (
  <group position={[pivot, -sink, 0]} rotation={[0, 0, pitch]}>
    <group position={[-pivot, 0, 0]}>
      <OceanLiner frame={f} {...rest} />
    </group>
  </group>
);

/** Night sea: dark water, moon, stars. Water is opaque, so anything below y=0 is hidden. */
const NightSea: React.FC<{ f: number; moon?: V3; fill?: V3 }> = ({ f, moon = [-30, 14, -60], fill = [12, 5, 9] }) => (
  <>
    <hemisphereLight args={["#7d93c9", "#05070c", 0.9]} />
    <directionalLight position={fill} intensity={0.8} color="#a9bbef" />
    <directionalLight position={[moon[0] / 4, moon[1] / 2, moon[2] / 4]} intensity={1.4} color="#b9c8ff" castShadow shadow-mapSize={[2048, 2048]} />
    <directionalLight position={[8, 3, 6]} intensity={0.45} color="#8aa0d8" />
    <Stars3D frame={f} count={900} radius={120} size={0.35} />
    <Glow position={moon} size={9} color="#dfe6ff" opacity={0.9} fog={false} />
    <mesh position={moon}>
      <sphereGeometry args={[1.4, 24, 16]} />
      <meshBasicMaterial color="#eef2ff" fog={false} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[600, 600]} />
      {/* matte and near-black: a smooth sea mirrored the fill light into a big grey smear */}
      <meshStandardMaterial color="#02040a" roughness={1} metalness={0} />
    </mesh>
    {/* moon glitter path on the water */}
    <Drift frame={f} count={160} box={[3, 0.001, 30]} velocity={[0, 0, 0.004]} size={0.25} color="#9fb4ff" opacity={0.35} seed={4} />
  </>
);

const SKY = "linear-gradient(180deg, #050913 0%, #0b1530 55%, #1a2440 70%, #04070d 71%, #020306 100%)";

// ───────────────────────── A · the intact ship at night (hook + loop) ─────────────────────────
export const SetNight: React.FC<SetProps> = ({ f }) => {
  const t = keys(f, [
    [0, 0],
    [c.then, 1],
    [c.which, 0.3],
    [c.end - 2, 0],
  ]);
  const cam: Cam = {
    pos: [10.2 - 2.0 * t, 1.7 - 0.25 * t, 5.9 + 0.5 * t],
    look: [-0.6, 0.9 - 0.1 * t, 0],
    fov: 34,
  };
  return (
    <AbsoluteFill style={{ background: SKY }}>
      <Canvas cam={cam} fog={["#070b16", 22, 90]}>
        <NightSea f={f} moon={[-49, 14, -27]} />
        <Ship f={f} />
        {/* porthole reflections on the water */}
        {Array.from({ length: 18 }, (_, i) => (
          <mesh key={i} position={[-3.6 + i * 0.42, 0.003, 0.62]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.06, 0.7 + 0.25 * Math.sin(i * 1.7)]} />
            <meshBasicMaterial map={glowTexture()} color="#ffcf8a" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </Canvas>
    </AbsoluteFill>
  );
};

// ───────────────────────── B · 1985: the wreck on the seabed, two pieces (white-hot sonar cam) ─────────────────────────
const DEBRIS = (() => {
  const r = seeded(19);
  return Array.from({ length: 160 }, () => {
    const z = -6 + r() * 12;
    return { p: [(r() - 0.5) * (3 + Math.abs(z) * 0.2), 0.03, z] as V3, s: 0.05 + r() * 0.25, rot: r() * 6 };
  });
})();
// 1 unit ≈ 33.6 m (ship 269 m = 8 units) → the 600 m gap is ~17.9 units
const BOW_POS: V3 = [0.6, 0, -9.85];
const STERN_POS: V3 = [-0.4, 0, 10.4];

export const SetWreck: React.FC<SetProps> = ({ f }) => {
  // the crane up must be finished when "two pieces" is said, or the shot shows only debris
  const k = ramp(f, c.depth + 12, c.two);
  const cam: Cam = {
    pos: keys3(f, [
      [c.then, [4.2, 2.4, -19.5]],
      [c.depth + 12, [3.0, 3.4, -18.0]],
      [c.two, [0.01, 37, -0.4]],
      [c.so, [0.01, 38.5, -0.4]],
    ]),
    look: keys3(f, [
      [c.then, [0.6, 0.3, -12.0]],
      [c.depth + 12, [0.6, 0.3, -11.0]],
      [c.two, [0, 0, -1]],
    ]),
    fov: keys(f, [
      [c.then, 40],
      [c.two, 44],
    ]),
  };
  // bow piece's torn end and the stern piece's propeller end (the gap the debris field fills)
  const a = at(cam, [BOW_POS[0], 0.3, BOW_POS[2] + 0.85]);
  const b = at(cam, [STERN_POS[0] - 0.55, 0.3, STERN_POS[2] - 1.5]);
  const bowTag = at(cam, [BOW_POS[0], 0.4, BOW_POS[2] - 1.8]);
  const sternTag = at(cam, [STERN_POS[0], 0.4, STERN_POS[2]]);
  const line = ramp(f, c.apart, c.apart + 14, easeOut);
  return (
    <ViewMode mode="whitehot" id="wreck">
      <AbsoluteFill style={{ background: "#020203" }}>
        <Canvas cam={cam} fog={["#020203", 8, 60 + 20 * k]}>
          <ambientLight intensity={0.35} />
          <spotLight position={[3, 10, -6]} angle={0.9} penumbra={0.7} intensity={40} decay={1.4} castShadow />
          <directionalLight position={[2, 10, 3]} intensity={0.6 + 1.6 * k} />
          <Dunes size={80} color="#6f6a60" amp={0.18} />
          {/* bow: upright, nose dug into the seabed, heading one way */}
          <group position={BOW_POS} rotation={[0, Math.PI / 2, 0]}>
            <group position={[0, -0.12, 0]} rotation={[0, 0, -0.04]}>
              <OceanLiner frame={f} breakX={LINER.breakX} split={1} bowDrop={0} sternDrop={0} lights={0} wreck={0.7} clip="bow" />
            </group>
          </group>
          {/* stern: crumpled, facing the other way */}
          <group position={STERN_POS} rotation={[0, -Math.PI / 2 + 0.35, 0]}>
            <group position={[2.4, -0.15, 0]}>
              <OceanLiner frame={f} split={1} bowDrop={0} sternDrop={0} lights={0} wreck={1} clip="stern" />
            </group>
          </group>
          {DEBRIS.map((d, i) => (
            <mesh key={i} position={d.p} rotation={[0, d.rot, 0]}>
              <boxGeometry args={[d.s, d.s * 0.4, d.s * 0.7]} />
              <meshStandardMaterial color="#4a443c" roughness={1} />
            </mesh>
          ))}
          <Drift frame={f} count={200} box={[10, 3, 14]} velocity={[0.003, 0.002, 0]} size={0.12} color="#ffffff" opacity={0.35} seed={8} />
        </Canvas>
        {a && b && line > 0 ? <Measure a={a} b={b} t={line} label="600 M" /> : null}
        {bowTag && f >= c.two + 4 ? <Tag x={bowTag.x} y={bowTag.y} text="BOW" o={ramp(f, c.two + 4, c.two + 10)} /> : null}
        {sternTag && f >= c.two + 10 ? <Tag x={sternTag.x} y={sternTag.y} text="STERN" o={ramp(f, c.two + 10, c.two + 16)} /> : null}
        <HudOverlay
          color="#ffffff"
          title="ARGO · SEPT 1985"
          lines={["41°43′N  49°56′W", "DEBRIS FIELD"]}
        />
      </AbsoluteFill>
    </ViewMode>
  );
};

export const Tag: React.FC<{ x: number; y: number; text: string; o: number }> = ({ x, y, text, o }) => (
  <div
    style={{
      position: "absolute",
      left: x + 70,
      top: y - 26,
      opacity: o,
      padding: "4px 16px",
      background: "#ffd166",
      color: "#111",
      fontFamily: fonts.hud,
      fontWeight: 700,
      fontSize: 40,
      letterSpacing: 3,
    }}
  >
    {text}
  </div>
);

/** Dimension line between two screen points with end ticks and a label. */
export const Measure: React.FC<{ a: { x: number; y: number }; b: { x: number; y: number }; t: number; label: string }> = ({ a, b, t, label }) => {
  const mx = a.x + (b.x - a.x) * t;
  const my = a.y + (b.y - a.y) * t;
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <g stroke="#ffd166" strokeWidth={4} fill="none">
        <line x1={a.x} y1={a.y} x2={mx} y2={my} strokeDasharray="14 10" />
        <line x1={a.x - 26} y1={a.y} x2={a.x + 26} y2={a.y} />
        {t > 0.98 ? <line x1={b.x - 26} y1={b.y} x2={b.x + 26} y2={b.y} /> : null}
      </g>
      {t > 0.5 ? (
        <g opacity={ramp(t, 0.5, 1)}>
          <rect x={cx + 24} y={cy - 36} width={200} height={72} rx={10} fill="rgba(10,10,12,0.85)" stroke="#ffd166" strokeWidth={3} />
          <text x={cx + 124} y={cy + 16} textAnchor="middle" fill="#ffd166" style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 48, letterSpacing: 3 }}>
            {label}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

// ───────────────────────── C · rehook: a crack opens in the hull ─────────────────────────
const CRACK: V3[] = (() => {
  const r = seeded(3);
  const pts: V3[] = [];
  for (let i = 0; i <= 16; i++) {
    const y = LINER.deck - (i / 16) * (LINER.deck - LINER.keel + 0.02);
    pts.push([LINER.breakX + (i % 2 ? 0.045 : -0.045) + (r() - 0.5) * 0.04, y, LINER.halfBeam + 0.012]);
  }
  return pts;
})();

export const SetCrack: React.FC<SetProps> = ({ f }) => {
  const prog = ramp(f, c.so + 8, c.half + 8, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.so, [0.9, 1.6, 6.4]],
      [c.iceberg, [0.2, 1.3, 4.6]],
    ]),
    look: [LINER.breakX, 0.75, 0],
    fov: 38,
  };
  return (
    <AbsoluteFill style={{ background: SKY }}>
      <Canvas cam={cam} fog={["#070b16", 10, 60]}>
        <NightSea f={f} />
        <Ship f={f} />
        {CRACK.slice(0, -1).map((p, i) => {
          const seg = Math.min(1, Math.max(0, prog * (CRACK.length - 1) - i));
          if (seg <= 0) return null;
          const q = new THREE.Vector3(...p).lerp(new THREE.Vector3(...CRACK[i + 1]), seg);
          return <TubePath key={i} points={[new THREE.Vector3(...p), q]} radius={0.007} color="#ff7a3a" glow={false} />;
        })}
        {prog > 0 ? <Glow position={CRACK[Math.min(CRACK.length - 1, Math.floor(prog * (CRACK.length - 1)))]} size={0.35} color="#ffb070" /> : null}
      </Canvas>
    </AbsoluteFill>
  );
};

// ───────────────────────── D/E · blueprint: compartments, iceberg, flooding (SVG diagram) ─────────────────────────
const PX = 120; // px per unit
const OX = 540; // screen x of ship x=0
const OY = 980; // screen y of the waterline
const sx = (x: number) => OX + x * PX;
const sy = (y: number) => OY - y * PX;
// 15 bulkheads → 16 compartments, bow compartments a little shorter
const BULKHEADS = [-3.55, -3.0, -2.45, -1.92, -1.4, -0.9, -0.4, 0.08, 0.55, 1.0, 1.45, 1.9, 2.32, 2.72, 3.1];
const BULK_TOP = 0.3; // they stop below the deck — the fatal detail
const HULL_PATH = (() => {
  const xs = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1);
  const keelY = (x: number) => (x > 3.3 ? LINER.keel + (x - 3.3) * 0.35 : x < -3.4 ? LINER.keel + (-3.4 - x) * 0.5 : LINER.keel);
  const top = xs.map((x) => `${sx(x)},${sy(LINER.deck + (x > 2.6 ? (x - 2.6) * 0.08 : 0))}`);
  const bot = [...xs].reverse().map((x) => `${sx(x)},${sy(keelY(x))}`);
  return `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
})();
const compX = (i: number) => {
  // i = 0 is the most forward (bow) compartment
  const edges = [-4, ...BULKHEADS, 4].reverse();
  return [edges[i + 1], edges[i]] as const;
};

export const SetBlueprint: React.FC<SetProps> = ({ f }) => {
  // iceberg slides from the bow aft along the starboard side, scraping compartments 1–5
  const berg = keys(f, [
    [c.iceberg, 4.6],
    [c.five + 12, 0.0],
    [c.built, -1.2],
  ]);
  const opened = (i: number) => ramp(f, c.iceberg + 4 + i * 7, c.iceberg + 10 + i * 7);
  const tilt = keys(f, [
    [c.bow, 0],
    [c.stern, 5],
  ]);
  // water level per compartment 0..1 (of keel→bulkhead top); 1–5 flood first, then spill aft
  const level = (i: number) =>
    i < 5
      ? ramp(f, c.iceberg + 8 + i * 7, c.built + 10 + i * 4)
      : ramp(f, c.spilled + (i - 5) * 14, c.spilled + (i - 5) * 14 + 22);
  const spilling = (i: number) => i >= 5 && f >= c.spilled + (i - 5) * 14 - 6 && f < c.spilled + (i - 5) * 14 + 14;
  // zoom = how much of the ship is shown; bow is kept at the right edge (screen x 1040)
  const zoom = keys(f, [
    [c.iceberg, 2.0],
    [c.built, 1.9],
    [c.bow, 1.6],
    [c.stern, 1.55],
  ]);
  const panX = 1040 - 540 - (sx(4) - 540) * zoom;
  const cy = OY - 0.2 * PX;
  const pivot = { x: sx(-2.5), y: OY };
  return (
    <AbsoluteFill
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(127,232,255,0.06) 0 2px, transparent 2px 60px), repeating-linear-gradient(90deg, rgba(127,232,255,0.06) 0 2px, transparent 2px 60px), #061a2e",
      }}
    >
      <svg width={1080} height={1920}>
        <defs>
          {Array.from({ length: 16 }, (_, i) => {
            const [x0, x1] = compX(i);
            return (
              <clipPath key={i} id={`comp${i}`}>
                <rect
                  x={sx(x0)}
                  y={sy(BULK_TOP)}
                  width={(x1 - x0) * PX}
                  height={(BULK_TOP - LINER.keel) * PX}
                  transform={`rotate(${tilt} ${pivot.x} ${pivot.y})`}
                />
              </clipPath>
            );
          })}
        </defs>
        <g transform={`translate(${540 + panX} ${cy}) scale(${zoom}) translate(-540 ${-cy})`}>
          {/* sea surface (world-horizontal) */}
          <rect x={-200} y={OY} width={1500} height={900} fill="rgba(30,110,170,0.18)" />
          <line x1={-200} y1={OY} x2={1300} y2={OY} stroke="#5fc7ff" strokeWidth={3} strokeDasharray="18 10" />
          <text x={60} y={OY - 14} fill="#5fc7ff" style={{ fontFamily: fonts.hud, fontSize: 28, letterSpacing: 3 }}>
            SEA LEVEL
          </text>
          {/* water inside compartments: world-horizontal surface, clipped to the tilted compartment */}
          {Array.from({ length: 16 }, (_, i) => {
            const lv = level(i);
            if (lv <= 0) return null;
            const top = sy(LINER.keel + lv * (BULK_TOP - LINER.keel) + 0.05); // world-horizontal surface
            return <rect key={i} x={-200} y={top} width={1500} height={1000} fill="#2f8cff" opacity={0.75} clipPath={`url(#comp${i})`} />;
          })}
          <g transform={`rotate(${tilt} ${pivot.x} ${pivot.y})`}>
            {/* breached compartments glow red */}
            {[0, 1, 2, 3, 4].map((i) => {
              const [x0, x1] = compX(i);
              const o = opened(i);
              return o > 0 ? (
                <rect key={i} x={sx(x0)} y={sy(LINER.deck)} width={(x1 - x0) * PX} height={(LINER.deck - LINER.keel) * PX} fill="#ff3b3b" opacity={0.18 * o} />
              ) : null;
            })}
            <path d={HULL_PATH} fill="none" stroke="#9fe9ff" strokeWidth={4} />
            {/* superstructure + funnels (outline) */}
            <rect x={sx(-2.9)} y={sy(0.9)} width={5.4 * PX} height={0.4 * PX} fill="none" stroke="#9fe9ff" strokeWidth={2} opacity={0.6} />
            {[1.55, 0.6, -0.35, -1.3].map((x) => (
              <rect key={x} x={sx(x) - 16} y={sy(1.75)} width={32} height={0.85 * PX} fill="none" stroke="#9fe9ff" strokeWidth={2} opacity={0.6} transform={`rotate(-7 ${sx(x)} ${sy(0.9)})`} />
            ))}
            {/* bulkheads stop short of the deck */}
            {BULKHEADS.map((x) => (
              <line key={x} x1={sx(x)} y1={sy(LINER.keel)} x2={sx(x)} y2={sy(BULK_TOP)} stroke="#ffffff" strokeWidth={4} />
            ))}
            {/* compartment numbers for the breached ones */}
            {[0, 1, 2, 3, 4].map((i) => {
              const [x0, x1] = compX(i);
              return (
                <text key={i} x={(sx(x0) + sx(x1)) / 2} y={sy(LINER.keel) + 46} textAnchor="middle" fill={opened(i) > 0.5 ? "#ff6b6b" : "#9fe9ff"} style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 32 }}>
                  {i + 1}
                </text>
              );
            })}
            {/* scrape line below the waterline */}
            {f >= c.iceberg ? (
              <line x1={sx(Math.max(berg, compX(4)[0]))} y1={sy(-0.12)} x2={sx(3.85)} y2={sy(-0.08)} stroke="#ff4040" strokeWidth={6} strokeLinecap="round" opacity={1 - ramp(f, c.bow, c.bow + 10) * 0.6} />
            ) : null}
            {/* spill-over waterfalls */}
            {Array.from({ length: 16 }, (_, i) => {
              if (!spilling(i)) return null;
              const xb = compX(i - 1)[0];
              return <rect key={i} x={sx(xb) - 6} y={sy(BULK_TOP + 0.04)} width={12} height={0.5 * PX} fill="#7cc4ff" opacity={0.9} />;
            })}
          </g>
          {/* the iceberg (only its tip shows above the sea) */}
          {f < c.bow + 20 ? (
            <g transform={`translate(${sx(berg)} ${OY}) rotate(${tilt} ${pivot.x - sx(berg)} 0)`} opacity={1 - ramp(f, c.built, c.bow)}>
              <g transform="scale(0.45)">
                <path d="M -150 0 L -110 -120 L -60 -90 L -20 -170 L 40 -100 L 90 -130 L 150 0 Z" fill="#e9f6ff" opacity={0.95} />
                <path d="M -190 0 L -120 210 L 10 300 L 160 200 L 210 0 Z" fill="#cfe9ff" opacity={0.28} />
              </g>
            </g>
          ) : null}
        </g>
      </svg>
      {/* legend: bulkheads don't reach the top */}
      <Label at={c.bow + 4} until={c.stern} x={540} y={1240} text="BULKHEADS STOP BELOW THE DECK" f={f} />
    </AbsoluteFill>
  );
};

const Label: React.FC<{ at: number; until: number; x: number; y: number; text: string; f: number }> = ({ at, until, x, y, text, f }) => {
  const o = ramp(f, at, at + 6) * (1 - ramp(f, until - 6, until));
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,0) translateY(${(1 - o) * 12}px)`,
        opacity: o,
        padding: "8px 20px",
        border: "3px solid #9fe9ff",
        background: "rgba(6,26,46,0.85)",
        color: "#d8f7ff",
        fontFamily: fonts.hud,
        fontWeight: 700,
        fontSize: 36,
        letterSpacing: 3,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// ───────────────────────── F/G · the stern rises, stress builds, the hull snaps ─────────────────────────
export const SetBreak: React.FC<SetProps> = ({ f }) => {
  const pitch = keys(f, [
    [c.stern, deg(-7)],
    [c.hanging + 20, deg(-15)],
    [c.snapped, deg(-15)],
  ]);
  const sink = keys(f, [
    [c.stern, 0.15],
    [c.snapped, 0.32],
    [c.not, 0.55],
  ]);
  const thermal = f >= c.hull && f < c.snapped;
  const stress = ramp(f, c.hull + 4, c.snapped - 2);
  const split = ramp(f, c.snapped, c.snapped + 22, easeOut);
  const lights = 1 - ramp(f, c.hull - 4, c.hull + 4) * 0.8 - ramp(f, c.snapped, c.snapped + 6) * 0.2;
  const weight = ramp(f, c.tons + 4, c.tons + 14) * (1 - ramp(f, c.hull - 4, c.hull));
  const cam: Cam = {
    pos: keys3(f, [
      [c.stern, [-8.6, 0.6, 10.2]],
      [c.hull - 2, [-9.4, 0.85, 11.4]],
      [c.hull, [-1.4, 1.4, 20.5]],
      [c.not, [-1.2, 1.4, 19.5]],
    ]),
    look: keys3(f, [
      [c.stern, [-2.4, 1.3, 0]],
      [c.hull - 2, [-2.2, 1.4, 0]],
      [c.hull, [-1.2, 1.0, 0]],
    ]),
    fov: 36,
  };
  const st = f - c.snapped;
  // ship-local point → world (pitch about x = 0.8 on the waterline, then sink)
  const w = (x: number, y: number): V3 => {
    const dx = x - 0.8;
    return [0.8 + dx * Math.cos(pitch) - y * Math.sin(pitch), dx * Math.sin(pitch) + y * Math.cos(pitch) - sink, 0];
  };
  const crack = w(LINER.breakX, LINER.deck);
  return (
    <ViewMode mode={thermal ? "thermal" : "normal"} id="break">
      <AbsoluteFill style={{ background: SKY }}>
        <Canvas cam={cam} fog={["#070b16", 24, 90]}>
          <NightSea f={f} fill={[-6, 4, 14]} />
          <Ship f={f} pitch={pitch} sink={sink} split={split} lights={lights} stress={thermal ? stress : stress * (1 - split)} bowDrop={-0.3} sternDrop={0.22} />
          {/* the stern's weight pulling down */}
          {weight > 0
            ? [-3.4, -2.6, -2.0].map((x) => {
                const [wx, wy] = w(x, LINER.deck);
                return <Arrow key={x} from={[wx, wy + 1.5, 0]} to={[wx, wy + 0.55, 0]} color="#ff5a3c" thickness={0.05} opacity={weight} />;
              })
            : null}
          {st >= 0 && st < 30
            ? Array.from({ length: 40 }, (_, i) => {
                const r = seeded(i + 1);
                const v: V3 = [(r() - 0.5) * 0.12, 0.05 + r() * 0.1, (r() - 0.2) * 0.1];
                return (
                  <Glow
                    key={i}
                    position={[crack[0] + v[0] * st, crack[1] + v[1] * st - 0.006 * st * st, 0.45 + v[2] * st]}
                    size={0.12 * (1 - st / 30)}
                    color="#ffcf7a"
                  />
                );
              })
            : null}
        </Canvas>
        {thermal ? <HudOverlay color="#ffffff" title="STRESS MAP" rec={false} lines={["BENDING LOAD", "HULL MIDSHIP"]} /> : null}
      </AbsoluteFill>
    </ViewMode>
  );
};

// ───────────────────────── H · movie vs wreck studies (SVG comparison) ─────────────────────────
export const SetCompare: React.FC<SetProps> = ({ f }) => {
  const a1 = ramp(f, c.not, c.n45 + 12, easeOut) * 45;
  const a2 = ramp(f, c.wreck, c.n15 + 10, easeOut) * 15;
  const o2 = ramp(f, c.wreck - 4, c.wreck + 4);
  const panel = (y: number, angle: number, label: string, sub: string, color: string, o: number, cross: boolean) => (
    <g transform={`translate(540 ${y})`} opacity={o}>
      <text x={0} y={-390} textAnchor="middle" fill="#d8f7ff" style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 46, letterSpacing: 4 }}>
        {label}
      </text>
      <text x={0} y={-344} textAnchor="middle" fill="rgba(216,247,255,0.6)" style={{ fontFamily: fonts.hud, fontSize: 28, letterSpacing: 3 }}>
        {sub}
      </text>
      <line x1={-460} y1={0} x2={460} y2={0} stroke="#5fc7ff" strokeWidth={3} strokeDasharray="16 10" />
      {/* the whole ship pitches bow-down about the break; stern rises on the left */}
      <g transform={`rotate(${angle} 0 0)`}>
        <ShipSilhouetteSimple color={color} />
      </g>
      <rect x={-470} y={2} width={940} height={330} fill="#061a2e" opacity={0.82} />
      {/* angle arc */}
      <path d={arcPath(angle, 200)} stroke={color} strokeWidth={5} fill="none" />
      <text x={300} y={-200} textAnchor="middle" fill={color} style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 92 }}>
        {cross ? "" : "≈"}
        {Math.round(angle)}°
      </text>
      {cross && angle > 40 ? (
        <g stroke="#ff4d4d" strokeWidth={10} strokeLinecap="round" opacity={ramp(f, c.n45 + 14, c.n45 + 20)}>
          <line x1={-90} y1={-150} x2={90} y2={30} />
          <line x1={90} y1={-150} x2={-90} y2={30} />
        </g>
      ) : null}
    </g>
  );
  return (
    <AbsoluteFill
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(127,232,255,0.06) 0 2px, transparent 2px 60px), repeating-linear-gradient(90deg, rgba(127,232,255,0.06) 0 2px, transparent 2px 60px), #061a2e",
      }}
    >
      <svg width={1080} height={1920}>
        {panel(600, a1, "THE MOVIE (1997)", "BREAKS AT ABOUT 45°", "#ff8a8a", 1, true)}
        {panel(1160, a2, "WRECK STUDIES", "BREAK STARTED AT A SHALLOW ANGLE", "#ffd166", o2, false)}
      </svg>
    </AbsoluteFill>
  );
};

/** Side silhouette with the stern on the right after mirroring (so it rises when rotated). */
const ShipSilhouetteSimple: React.FC<{ color: string }> = ({ color }) => (
  <g>
    <path d="M -380 0 L 300 0 L 340 -40 L 300 -70 L -340 -70 L -380 -40 Z" fill={color} />
    <rect x={-300} y={-110} width={540} height={40} fill={color} />
    {[-180, -60, 60, 180].map((x) => (
      <rect key={x} x={x} y={-200} width={30} height={92} fill={color} transform={`rotate(8 ${x} -110)`} />
    ))}
  </g>
);

const arcPath = (angle: number, r: number) => {
  // arc on the left (stern side) from horizontal up to `angle` degrees
  const a = deg(Math.max(0.5, angle));
  const x1 = -r;
  const y1 = 0;
  const x2 = -r * Math.cos(a);
  const y2 = -r * Math.sin(a);
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;
};

// ───────────────────────── I · survivors in a lifeboat watching the stern ─────────────────────────
// two people per thwart, all facing the ship (−X)
const ROWERS: { p: V3; ry: number }[] = THWARTS.slice(0, 3).flatMap((x) => [
  { p: [x, SEAT_Y, -0.24] as V3, ry: -Math.PI / 2 },
  { p: [x, SEAT_Y, 0.24] as V3, ry: -Math.PI / 2 },
]);

export const SetLifeboat: React.FC<SetProps> = ({ f }) => {
  const cam: Cam = {
    pos: keys3(f, [
      [c.survivors, [4.2, 1.05, 1.6]],
      [c.truth, [3.8, 0.95, 1.45]],
    ]),
    look: [-16, 1.4, -4.2],
    fov: 40,
  };
  const bob = Math.sin(f * 0.06) * 0.03;
  const papers = ramp(f, c.official, c.official + 8, easeOut);
  return (
    <AbsoluteFill style={{ background: SKY }}>
      <Canvas cam={cam} fog={["#070b16", 10, 60]}>
        <NightSea f={f} moon={[-70, 11, -19]} fill={[-10, 3, -3]} />
        {/* the stern standing out of the sea, lights out, far away */}
        <group position={[-17, 0, -4.6]} rotation={[0, 0.25, 0]}>
          <Ship f={f} pitch={deg(-25)} sink={1.2} split={1} bowDrop={-0.9} sternDrop={-0.55} lights={0} />
        </group>
        {/* moonlight glitter between the boat and the ship, so the people read as silhouettes */}
        <group position={[-9, 0.01, -2.4]} rotation={[0, 0.27, 0]}>
          <Drift frame={f} count={420} box={[10, 0.001, 0.9]} velocity={[0.004, 0, 0]} size={0.16} color="#c9d6ff" opacity={0.55} seed={12} />
        </group>
        {/* lifeboat: floats with its gunwale ~0.28 above the sea, people sit on the thwarts */}
        <group position={[0, 0.28 + bob, 0]} rotation={[0.02 * Math.sin(f * 0.05), 0, 0.015 * Math.sin(f * 0.04)]}>
          <Lifeboat />
          {ROWERS.map((r, i) => (
            <group key={i} position={r.p} rotation={[0, r.ry, 0]} scale={0.42}>
              <Humanoid pose={seated(f / 30 + i)} look={{ suit: i % 2 ? "#2b2f36" : "#3a3330", helmet: "none", skin: "#c9a68a" }} />
            </group>
          ))}
        </group>
      </Canvas>
      {papers > 0 ? <InquiryCard f={f} o={papers} /> : null}
    </AbsoluteFill>
  );
};

export const InquiryCard: React.FC<{ f: number; o: number }> = ({ f, o }) => {
  const stamp = ramp(f, c.them + 4, c.them + 9, easeOut);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 330,
        width: 760,
        transform: `translate(-50%,0) rotate(-2deg) translateY(${(1 - o) * 40}px)`,
        opacity: o,
        padding: "34px 40px",
        background: "#efe6cf",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        fontFamily: "Courier New, monospace",
        color: "#2a2620",
      }}
    >
      <div style={{ fontSize: 30, letterSpacing: 4, opacity: 0.7 }}>1912 · OFFICIAL INQUIRIES</div>
      <div style={{ fontSize: 50, fontWeight: 700, marginTop: 14 }}>Finding: she sank intact.</div>
      {stamp > 0 ? (
        <div
          style={{
            position: "absolute",
            right: 30,
            bottom: -40,
            transform: `rotate(-12deg) scale(${1.6 - 0.6 * stamp})`,
            opacity: stamp,
            border: "8px solid #c4302b",
            color: "#c4302b",
            padding: "4px 24px",
            fontFamily: fonts.hud,
            fontWeight: 700,
            fontSize: 64,
            letterSpacing: 6,
          }}
        >
          WRONG
        </div>
      ) : null}
    </div>
  );
};

// ───────────────────────── J · the bow glides down into the dark ─────────────────────────
export const SetDescent: React.FC<SetProps> = ({ f }) => {
  const t = ramp(f, c.truth, c.which, (x) => x);
  const cam: Cam = { pos: [4.5 - t * 0.8, -1.0 - t * 1.8, 11.5], look: [0.4, -2.4 - t * 1.9, 0], fov: 42 };
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #06223a 0%, #031220 50%, #010508 100%)" }}>
      <Canvas cam={cam} fog={["#031220", 4, 18]}>
        <ambientLight intensity={0.5} color="#6fa8d8" />
        <directionalLight position={[0, 10, 2]} intensity={1.0} color="#8fc4ff" />
        <group position={[0.6 + t * 0.8, -2.2 - t * 2.2, 0]} rotation={[0, 0, deg(-32)]}>
          <group position={[-1.2, 0, 0]}>
            <OceanLiner frame={f} split={1} bowDrop={0} sternDrop={0} lights={0} clip="bow" />
          </group>
        </group>
        <Drift frame={f} count={260} box={[6, 5, 5]} velocity={[0, 0.03, 0]} size={0.06} color="#cfe9ff" opacity={0.5} seed={2} />
      </Canvas>
    </AbsoluteFill>
  );
};

