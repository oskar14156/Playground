import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Callout } from "../../lib/Hud";
import { HudOverlay, ViewMode } from "../../lib/ViewMode";
import { fonts, palettes } from "../../lib/theme";
import { easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { Cam, CameraRig, Glow, glowTexture, project, V3 } from "../../lib/three/core";
import { FlightRecorder } from "../../lib/three/FlightRecorder";
import { PlaneModel } from "../../lib/three/PlaneModel";
import { c } from "./cues";
import { AimedSpot, Arrow, Beam, Drift, Dunes, Flames, GroundGlow } from "../../lib/three/fx";

const P = palettes.deep;
type SetProps = { f: number };

const Canvas: React.FC<{ children: React.ReactNode; cam: Cam; fog?: [string, number, number] }> = ({ children, cam, fog }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.05, far: 300 }} gl={{ antialias: true }}>
      <CameraRig cam={cam} />
      {fog ? <fog attach="fog" args={fog} /> : null}
      {children}
    </ThreeCanvas>
  );
};

const at = (cam: Cam, p: V3) => project(p, cam, 1080, 1920);

// ───────────────────────── A · void (hook + outro, shares frame 0 with the loop) ─────────────────────────
export const SetVoid: React.FC<SetProps> = ({ f }) => {
  // key light: off at frame 0 (box reads black), snaps on at "black" #2, fades out for the loop
  const key = keys(f, [
    [c.black2 - 1, 0],
    [c.black2 + 2, 1],
    [c.so, 1],
    [c.which, 0.12],
    [c.end - 6, 0],
  ]);
  const orbit = keys(f, [
    [0, -0.55],
    [c.search, 0.15],
    [c.so, 0.6],
    [c.end - 2, -0.55],
  ]);
  const dist = keys(f, [
    [0, 5.0],
    [c.search, 3.9],
    [c.so, 4.1],
    [c.end - 2, 5.0],
  ]);
  const spin = keys(f, [
    [0, 0.5],
    [c.search, 0.95],
    [c.so, 0.2],
    [c.end - 2, 0.5],
  ]);
  const camY = keys(f, [
    [0, 0.8],
    [c.search, 1.1],
    [c.so, 1.25],
    [c.end - 2, 0.8],
  ]);
  const cam: Cam = { pos: [Math.sin(orbit) * dist, camY, Math.cos(orbit) * dist], look: [0, 0.32, 0], fov: 42 };
  const tag = at(cam, [0.1, 0.62, 0]);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, #142235 0%, #060a10 60%, #020305 100%)" }}>
      <Canvas cam={cam} fog={["#05080d", 4, 12]}>
        <ambientLight intensity={0.04 + 0.25 * key} />
        {/* blue rim from behind — the only light at frame 0 */}
        <directionalLight position={[-2, 2.5, -4]} intensity={2.4} color="#5d8cff" />
        <directionalLight position={[3, 1.5, -3]} intensity={1.4} color="#7fb0ff" />
        <AimedSpot position={[1.2, 4.2, 2.4]} target={[0, 0.2, 0]} intensity={9 * key} angle={0.42} color="#fff1dd" />
        {key > 0.01 ? <Beam from={[1.2, 4.2, 2.4]} to={[0, -0.05, 0]} radius={1.15} opacity={0.05 * key} color="#ffe9c7" /> : null}
        <group rotation={[0, spin, 0]} position={[-0.1, 0, 0]}>
          <FlightRecorder />
        </group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#0b0f15" roughness={0.38} metalness={0.4} />
        </mesh>
        <GroundGlow position={[0, 0.005, 0]} size={3.4} color="#ffcf9a" opacity={0.35 * key} />
        <Drift frame={f} count={160} box={[3, 1.6, 3]} velocity={[0.002, 0.0015, 0]} size={0.035} color="#cfe0ff" opacity={0.5} />
      </Canvas>
      {tag ? <Callout at={c.orange + 2} until={c.search} title="HIGH-VIS ORANGE" sub="PAINTED TO BE FOUND" x={tag.x} y={tag.y} palette={P} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── B · wreckage at night, searchlight finds the box ─────────────────────────
const DEBRIS = (() => {
  const r = seeded(42);
  return Array.from({ length: 110 }, () => {
    const a = r() * Math.PI * 2;
    const d = 0.9 + r() * 7;
    return {
      p: [Math.cos(a) * d, 0.02 + r() * 0.08, Math.sin(a) * d - 1] as V3,
      s: [0.15 + r() * 0.9, 0.03 + r() * 0.12, 0.1 + r() * 0.5] as V3,
      rot: [r() * 0.5, r() * 6.28, r() * 0.5] as V3,
      col: ["#5d636c", "#7d838c", "#41454c", "#24272b"][Math.floor(r() * 4)],
      ember: r() < 0.12,
    };
  });
})();
const BOX_B: V3 = [0.7, 0, 0.6];

export const SetWreck: React.FC<SetProps> = ({ f }) => {
  const found = ramp(f, c.wreckage, c.wreckage + 8, easeOut);
  const tgt = keys3(f, [
    [c.search, [-3.5, 0, -2.5]],
    [c.search + 18, [-1.5, 0, 1.2]],
    [c.wreckage - 4, BOX_B],
  ]);
  const lightPos: V3 = [tgt[0] - 1.5, 9, tgt[2] - 3];
  const cam: Cam = {
    pos: keys3(f, [
      [c.search, [-1.2, 7.5, 7.5]],
      [c.tail, [2.2, 3.4, 4.6]],
    ]),
    look: keys3(f, [
      [c.search, [-0.8, 0, -0.5]],
      [c.wreckage, BOX_B],
    ]),
    fov: 40,
  };
  const tag = at(cam, [BOX_B[0], 0.5, BOX_B[2]]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #070b14 0%, #0d1520 60%, #121a22 100%)" }}>
      <Canvas cam={cam} fog={["#0a1018", 6, 22]}>
        <ambientLight intensity={0.12} color="#8fa6ff" />
        <directionalLight position={[-5, 6, -3]} intensity={0.35} color="#9fb4ff" />
        <AimedSpot position={lightPos} target={tgt} intensity={5} angle={0.22} color="#f2f6ff" />
        <Beam from={lightPos} to={tgt} radius={2.1} opacity={0.06 - 0.045 * found} />
        <GroundGlow position={[tgt[0], 0.03, tgt[2]]} size={4.6} color="#dce8ff" opacity={0.22} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color="#1b2027" roughness={1} />
        </mesh>
        {DEBRIS.map((d, i) => (
          <group key={i} position={d.p} rotation={d.rot}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={d.s} />
              <meshStandardMaterial color={d.col} roughness={0.6} metalness={0.5} />
            </mesh>
            {d.ember ? <Glow position={[0, 0.1, 0]} size={0.35 + 0.15 * Math.sin(f * 0.4 + i)} color="#ff7a2a" opacity={0.8} /> : null}
          </group>
        ))}
        {/* half-buried recorder */}
        <group position={[BOX_B[0], -0.12, BOX_B[2]]} rotation={[0.25, 0.7, -0.18]} scale={0.6}>
          <FlightRecorder />
        </group>
        {found > 0 ? (
          <mesh position={[BOX_B[0], 0.04, BOX_B[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55 + 0.6 * ((f - c.wreckage) % 20) / 20, 0.6 + 0.6 * ((f - c.wreckage) % 20) / 20, 48]} />
            <meshBasicMaterial color="#ff8a2a" transparent opacity={found * (1 - ((f - c.wreckage) % 20) / 20)} toneMapped={false} />
          </mesh>
        ) : null}
        <Drift frame={f} count={90} box={[6, 2, 6]} velocity={[0.004, 0.006, 0]} size={0.6} color="#5c6670" opacity={0.08} additive={false} seed={9} />
      </Canvas>
      {tag ? <Callout at={c.wreckage + 4} until={c.tail} title="FLIGHT RECORDER" sub="SPOTTED BY ITS COLOUR" x={tag.x} y={tag.y} palette={P} side="right" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── C · airliner in the clouds, tail goes x-ray ─────────────────────────
const CLOUDS = (() => {
  const r = seeded(77);
  return Array.from({ length: 70 }, () => ({ x: (r() - 0.5) * 16, y: r() < 0.25 ? 2.6 + r() * 1.5 : -1.6 - r() * 2.5, z: r() * 40, s: 1.5 + r() * 3.5 }));
})();

export const SetPlane: React.FC<SetProps> = ({ f }) => {
  const xray = ramp(f, c.tailWord, c.tailWord + 10);
  const cam: Cam = {
    pos: keys3(f, [
      [c.tail, [4.6, 1.3, -3.0]],
      [c.tailWord, [3.2, 0.8, -0.4]],
      [c.survive, [1.55, 0.62, 1.35]],
      [c.armor, [1.4, 0.58, 1.3]],
    ]),
    look: keys3(f, [
      [c.tail, [0, 0, -0.2]],
      [c.survive, [0, -0.02, 0.62]],
    ]),
    fov: 38,
  };
  const bank = Math.sin(f * 0.04) * 0.05;
  const tail = at(cam, [0, 0.02, 0.72]);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0f1c33 0%, #2c4466 45%, #b7826b 78%, #2a2f3d 100%)" }}>
      <Canvas cam={cam} fog={["#3d5272", 8, 30]}>
        <hemisphereLight args={["#bcd0ff", "#4a3a30", 1.3]} />
        <directionalLight position={[-4, 3, -2]} intensity={2.2} color="#ffd2a8" />
        {CLOUDS.map((cl, i) => {
          const pos: V3 = [cl.x, cl.y, ((cl.z + f * 0.35) % 40) - 20];
          const near = new THREE.Vector3(...pos).distanceTo(new THREE.Vector3(...cam.pos));
          return (
            <sprite key={i} position={pos} scale={[cl.s * 1.8, cl.s, 1]}>
              <spriteMaterial map={glowTexture()} color="#e6ecf5" transparent opacity={0.5 * ramp(near, cl.s * 0.6, cl.s * 1.6)} depthWrite={false} />
            </sprite>
          );
        })}
        <group rotation={[0, 0, bank]}>
          <PlaneModel frame={f} xray={xray} body="#eef1f6" tail="#1d3d6e" />
          <group position={[0, -0.03, 0.72]} rotation={[0, Math.PI / 2, 0]} scale={0.1}>
            <FlightRecorder />
          </group>
          {xray > 0 ? <Glow position={[0, 0, 0.72]} size={0.5 * xray} color="#ff8a2a" opacity={0.9 * xray} /> : null}
          <pointLight position={[0.15, 0.1, 0.6]} intensity={1.6 * xray} color="#fff0e0" decay={0} distance={0.6} />
        </group>
      </Canvas>
      {tail ? (
        <Callout at={c.tailWord + 8} until={c.armor} title="FLIGHT RECORDERS" sub="TAIL · MOST SURVIVABLE SECTION" x={tail.x} y={tail.y} palette={P} side="left" />
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── D · blueprint: armor vs the real recorder ─────────────────────────
export const SetBlueprint: React.FC<SetProps> = ({ f }) => {
  const bp = keys(f, [
    [c.armor, 0],
    [c.armorWord, 0.15],
    [c.chip, 0.55],
    [c.chip + 14, 1],
  ]);
  const open = ramp(f, c.chip, c.chip + 18);
  const armorPulse = f >= c.armorWord && f < c.chip ? 0.5 + 0.5 * Math.sin((f - c.armorWord) * 0.5) : 0;
  const orbit = keys(f, [
    [c.armor, 0.9],
    [c.first, 0.2],
  ]);
  const dist = keys(f, [
    [c.armor, 3.2],
    [c.chip + 12, 2.4],
    [c.first, 2.2],
  ]);
  const cam: Cam = { pos: [Math.sin(orbit) * dist, 1.5, Math.cos(orbit) * dist], look: [0, 0.4, 0], fov: 40 };
  const chip = at(cam, [0, 0.5 + open * 0.28, 0]);
  const tests = ["IMPACT", "FIRE", "OCEAN"];
  return (
    <AbsoluteFill
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(127,232,255,0.07) 0 2px, transparent 2px 64px), repeating-linear-gradient(90deg, rgba(127,232,255,0.07) 0 2px, transparent 2px 64px), #06182b",
      }}
    >
      <Canvas cam={cam}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 3]} intensity={1.8} />
        <gridHelper args={[8, 16, "#2f6f8f", "#1b4560"]} />
        <FlightRecorder blueprint={bp} open={open} color={armorPulse > 0 ? new THREE.Color("#ff6a10").lerp(new THREE.Color("#ffd2a0"), armorPulse * 0.5).getStyle() : undefined} />
      </Canvas>
      {chip ? <Callout at={c.chip + 10} until={c.tests} title="MEMORY CHIP" sub="CRASH-SURVIVABLE MEMORY UNIT" x={chip.x} y={chip.y} palette={P} side="right" /> : null}
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 22 }}>
        {tests.map((t, i) => {
          const o = ramp(f, c.tests + i * 5, c.tests + i * 5 + 6, easeOut);
          if (o <= 0) return null;
          return (
            <div
              key={t}
              style={{
                opacity: o,
                transform: `translateY(${(1 - o) * 20}px) scale(${0.85 + 0.15 * o})`,
                padding: "10px 22px",
                border: "3px solid #7fe8ff",
                background: "rgba(6,24,43,0.85)",
                fontFamily: fonts.hud,
                fontWeight: 700,
                fontSize: 42,
                letterSpacing: 3,
                color: "#d8f7ff",
              }}
            >
              <span style={{ color: P.accent }}>{i + 1}</span> {t}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── E · impact test: launched into a steel wall ─────────────────────────
const SPARKS = (() => {
  const r = seeded(5);
  return Array.from({ length: 70 }, () => ({ v: [-(0.04 + r() * 0.12), 0.02 + r() * 0.12, (r() - 0.5) * 0.16] as V3, s: 0.08 + r() * 0.12 }));
})();

export const SetImpact: React.FC<SetProps> = ({ f }) => {
  const hit = c.g3400 + 2;
  const x = f < hit ? keys(f, [[c.first, -7], [hit, 1.25]], (t) => t * t * t) : 1.25 - 0.35 * ramp(f, hit, hit + 14, easeOut);
  const squash = f >= hit && f < hit + 6 ? 1 - 0.25 * (1 - (f - hit) / 6) : 1;
  const st = f - hit;
  // ~3 swings, decaying — a per-frame back-and-forth reads as jitter, not impact
  const shake = st >= 0 && st < 18 ? Math.sin(st * 1.1) * 0.06 * (1 - st / 18) : 0;
  const cam: Cam = {
    pos: (f < hit ? [x - 1.6, 0.8, 2.8] : keys3(f, [
      [hit, [-0.05, 0.75, 2.8]],
      [c.fighter, [-0.4, 1.6, 3.6]],
      [c.fire, [-0.2, 1.9, 4.2]],
    ])).map((v, i) => v + (i === 0 ? shake : i === 1 ? shake * 0.6 : 0)) as V3,
    look: f < hit ? [x + 0.3, 0.35, 0] : keys3(f, [
      [hit, [1.55, 0.35, 0]],
      [c.fighter, [0.9, 0.6, 0]],
    ]),
    fov: 40,
  };
  const flash = st >= 0 && st < 3 ? 1 - st / 3 : 0;
  const dim = ramp(f, c.fighter - 4, c.fighter + 6) * 0.55;
  // "blacks out": the frame itself closes to black for a beat
  const bo = f - c.blacks;
  const blackout = bo >= 0 && bo < 22 ? Math.sin((bo / 22) * Math.PI) : 0;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #1c2128 0%, #2a3038 70%, #14171c 100%)" }}>
      <Canvas cam={cam} fog={["#1c2128", 6, 18]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[-3, 5, 4]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
        {/* back wall with panel lights so the lab reads */}
        <mesh position={[0, 2.5, -3]} receiveShadow>
          <planeGeometry args={[30, 6]} />
          <meshStandardMaterial color="#2b3038" roughness={0.9} />
        </mesh>
        {[-8, -5, -2, 1, 4].map((px) => (
          <mesh key={px} position={[px, 3.2, -2.98]}>
            <planeGeometry args={[1.6, 0.12]} />
            <meshBasicMaterial color="#e8f1ff" toneMapped={false} />
          </mesh>
        ))}
        <pointLight position={[1.6, 1.2, 1]} intensity={2.5 * flash} color="#ffd38a" decay={0} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#3b4048" roughness={0.85} />
        </mesh>
        {/* launch rail */}
        <mesh position={[-3.5, 0.05, 0]} receiveShadow>
          <boxGeometry args={[9.5, 0.1, 0.2]} />
          <meshStandardMaterial color="#6b7079" metalness={0.7} roughness={0.35} />
        </mesh>
        {/* steel test block with hazard stripe */}
        <mesh position={[2.35, 1, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 2, 2.2]} />
          <meshStandardMaterial color="#8a9099" metalness={0.85} roughness={0.3} />
        </mesh>
        {[-0.8, -0.4, 0, 0.4, 0.8].map((z) => (
          <mesh key={z} position={[1.995, 1.85, z]} rotation={[0.6, 0, 0]}>
            <boxGeometry args={[0.01, 0.12, 0.3]} />
            <meshBasicMaterial color="#ffc531" />
          </mesh>
        ))}
        <group position={[x, 0.1, 0]} scale={[0.55 * squash, 0.55, 0.55 / Math.sqrt(squash)]}>
          <FlightRecorder />
        </group>
        {st >= 0 && st < 26
          ? SPARKS.map((s, i) => (
              <Glow
                key={i}
                position={[1.95 + s.v[0] * st * 3, 0.45 + s.v[1] * st * 3 - 0.012 * st * st, s.v[2] * st * 3]}
                size={s.s * (1 - st / 26)}
                color="#ffd27a"
              />
            ))
          : null}
        {flash > 0 ? <Glow position={[1.9, 0.45, 0]} size={4 * flash} color="#fff1c9" /> : null}
      </Canvas>
      <AbsoluteFill style={{ background: "#fff", opacity: flash * 0.3 }} />
      <AbsoluteFill style={{ background: "#05070a", opacity: dim }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,${0.6 * blackout}) 0%, rgba(0,0,0,${blackout}) 55%)` }} />
    </AbsoluteFill>
  );
};

// ───────────────────────── F · fire: furnace, switches to thermal on "1,100" ─────────────────────────
export const SetFire: React.FC<SetProps> = ({ f }) => {
  const thermal = f >= c.deg;
  const char = ramp(f, c.fire, c.ocean - 4);
  const orbit = keys(f, [
    [c.fire, -0.7],
    [c.ocean, 0.5],
  ]);
  const d = keys(f, [
    [c.fire, 3.4],
    [c.ocean, 2.6],
  ]);
  const cam: Cam = { pos: [Math.sin(orbit) * d, 0.9, Math.cos(orbit) * d], look: [0, 0.45, 0], fov: 40 };
  // slow, irregular breathing — fast sines here read as a strobe
  const flick = 0.85 + 0.15 * Math.sin(f * 0.23) * Math.sin(f * 0.13 + 1);
  return (
    <ViewMode mode={thermal ? "thermal" : "normal"} id="fire">
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 60%, #3a1406 0%, #120604 55%, #050202 100%)" }}>
        <Canvas cam={cam} fog={["#120604", 4, 11]}>
          <ambientLight intensity={0.15} />
          <pointLight position={[0, 0.8, 0.8]} intensity={7 * flick} color="#ff7a2a" decay={0} distance={6} />
          <pointLight position={[0.5, 1.6, -0.6]} intensity={3 * flick} color="#ffb347" decay={0} distance={6} />
          {/* grate */}
          {Array.from({ length: 13 }, (_, i) => (
            <mesh key={i} position={[0, 0.02, -1.2 + i * 0.2]} receiveShadow>
              <boxGeometry args={[3, 0.05, 0.05]} />
              <meshStandardMaterial color="#2a2522" metalness={0.6} roughness={0.5} />
            </mesh>
          ))}
          <group position={[-0.15, 0.04, 0]} scale={0.85}>
            <FlightRecorder char={char} />
          </group>
          <Flames frame={f} spread={[1.2, 0, 0.7]} height={2} />
          <group position={[0, 0, 0]}>
            <Flames frame={f + 13} count={80} spread={[0.7, 0, 0.45]} height={1.3} seed={23} />
          </group>
          <Drift frame={f} count={60} box={[2, 1.5, 1.5]} velocity={[0, 0.02, 0]} size={0.05} color="#ffb347" seed={31} />
        </Canvas>
      </AbsoluteFill>
    </ViewMode>
  );
};

// ───────────────────────── G · ocean: sinking to 20,000 ft, pressure arrows ─────────────────────────
export const SetOcean: React.FC<SetProps> = ({ f }) => {
  const depth = ramp(f, c.ocean, c.underwater, (t) => t);
  const press = ramp(f, c.feet + 4, c.feet + 14, easeOut);
  const pulse = 0.12 * Math.sin((f - c.feet) * 0.35);
  const cam: Cam = {
    pos: keys3(f, [
      [c.ocean, [2.3, 2.9, 4.6]],
      [c.underwater, [1.8, 1.7, 3.6]],
    ]),
    look: [0, 0.2, 0],
    fov: 42,
  };
  const dirs: V3[] = [
    [0, 1, 0],
    [1, 0.3, 0],
    [-1, 0.3, 0],
    [0, 0.3, 1],
    [0, 0.3, -1],
    [0.7, 0.8, 0.7],
    [-0.7, 0.8, -0.7],
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #0f5578 0%, #08304a 45%, #03121e 100%)" }}>
      <AbsoluteFill style={{ background: "#01060b", opacity: depth * 0.75 }} />
      <Canvas cam={cam} fog={["#06283c", 3, 12]}>
        <ambientLight intensity={0.9 - depth * 0.4} color="#7fc4ff" />
        <pointLight position={[1.5, 1.5, 2]} intensity={2.5 * (1 - depth * 0.5)} color="#cfe8ff" decay={0} distance={8} />
        <directionalLight position={[0.5, 6, 1]} intensity={2.2 * (1 - depth * 0.7)} color="#a9dcff" />
        {/* light shafts from the surface, fading with depth */}
        {[-1.8, -0.6, 0.7, 1.9].map((xx, i) => (
          <mesh key={i} position={[xx, 4 + ((f * 0.04 + i) % 3), -1.5 + i * 0.4]} rotation={[0, 0, 0.18]}>
            <planeGeometry args={[0.5 + i * 0.12, 9]} />
            <meshBasicMaterial color="#9fd8ff" transparent opacity={0.07 * (1 - depth)} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <group rotation={[0.25 * Math.sin(f * 0.03), f * 0.008, 0.18 * Math.cos(f * 0.025)]} position={[-0.1, -0.1, 0]} scale={0.8}>
          <FlightRecorder />
        </group>
        {/* marine snow rises past the sinking box */}
        <Drift frame={f} count={260} box={[4, 4, 4]} velocity={[0, 0.045, 0]} size={0.05} color="#cfe9ff" opacity={0.6} seed={13} />
        {press > 0
          ? dirs.map((dv, i) => {
              const n = new THREE.Vector3(...dv).normalize();
              const r0 = 1.55 + pulse;
              const r1 = 0.95 + pulse * 0.5;
              return (
                <Arrow
                  key={i}
                  from={[n.x * r0, 0.25 + n.y * r0, n.z * r0]}
                  to={[n.x * r1, 0.25 + n.y * r1, n.z * r1]}
                  color="#ff5a3c"
                  thickness={0.028}
                  opacity={press}
                />
              );
            })
          : null}
      </Canvas>
    </AbsoluteFill>
  );
};

// ───────────────────────── H · sonar: beacon pings on the seabed (night vision) ─────────────────────────
export const SetSonar: React.FC<SetProps> = ({ f }) => {
  const alive = f < c.silent;
  const t = (f - c.underwater) % 30;
  const ping = alive ? 1 - t / 30 : 0;
  const after = ramp(f, c.silent, c.silent + 18);
  const orbit = keys(f, [
    [c.underwater, 0.9],
    [c.so, 1.8],
  ]);
  const cam: Cam = { pos: [Math.sin(orbit) * 3.1, 1.25, Math.cos(orbit) * 3.1], look: [0.2, 0.2, 0], fov: 40 };
  const beacon: V3 = [0.58, 0.2, 0.05];
  return (
    <ViewMode mode="nightvision" id="sonar">
      <AbsoluteFill style={{ background: "#020604" }}>
        <Canvas cam={cam} fog={["#020604", 3, 10]}>
          <ambientLight intensity={0.25} />
          <AimedSpot position={[0, 5, 2]} target={[0, 0, 0]} intensity={2.2 * (1 - after * 0.6)} angle={0.5} />
          <Dunes color="#857a66" />
          <group position={[-0.1, -0.05, 0]} rotation={[0.12, 0.3, -0.1]} scale={0.7}>
            <FlightRecorder beacon={alive ? 0.35 + 0.65 * Math.max(0, 1 - t / 6) : 0} />
          </group>
          {alive
            ? [0, 1].map((k) => {
                const tt = ((f - c.underwater + k * 15) % 30) / 30;
                return (
                  <group key={k}>
                    <mesh position={[beacon[0], 0.06, beacon[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[0.2 + tt * 3.6, 0.26 + tt * 3.6, 64]} />
                      <meshBasicMaterial color="#ffffff" transparent opacity={(1 - tt) * 0.8} toneMapped={false} />
                    </mesh>
                    <mesh position={beacon} scale={0.2 + tt * 3.6}>
                      <sphereGeometry args={[1, 24, 16]} />
                      <meshBasicMaterial color="#ffffff" wireframe transparent opacity={(1 - tt) * 0.12} toneMapped={false} />
                    </mesh>
                  </group>
                );
              })
            : null}
          <Drift frame={f} count={140} box={[4, 2, 4]} velocity={[0.002, 0.004, 0]} size={0.04} color="#ffffff" opacity={0.4} seed={21} />
        </Canvas>
        <AbsoluteFill style={{ background: "#000", opacity: after * 0.45 }} />
        <HudOverlay
          color="#d9ffd9"
          title="SONAR · ULB"
          rec={alive}
          lines={alive ? ["FREQ 37.5 KHZ", "1 PING / SEC", `SIGNAL ${Math.round(70 + 25 * ping)}%`] : ["FREQ 37.5 KHZ", "NO SIGNAL", "SIGNAL 0%"]}
        />
      </AbsoluteFill>
    </ViewMode>
  );
};
