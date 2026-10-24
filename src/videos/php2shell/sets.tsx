import React, { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { ViewMode } from "../../lib/ViewMode";
import { fonts } from "../../lib/theme";
import { easeOut, keys, keys3, ramp } from "../../lib/timing";
import { Cam, CameraRig, Glow, project, V3 } from "../../lib/three/core";
import { Drift } from "../../lib/three/fx";
import { c } from "./cues";

type SetProps = { f: number };
const PHP = "#8892bf";
const RED = "#ff3b4a";
const GREEN = "#3dffa0";
const BG = "radial-gradient(ellipse at 50% 40%, #151a33 0%, #070914 65%, #03040a 100%)";

const Canvas: React.FC<{ children: React.ReactNode; cam: Cam; fog?: [string, number, number] }> = ({ children, cam, fog }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: cam.fov ?? 40, near: 0.05, far: 200 }} gl={{ antialias: true }}>
      <CameraRig cam={cam} />
      {fog ? <fog attach="fog" args={fog} /> : null}
      {children}
    </ThreeCanvas>
  );
};
const at = (cam: Cam, p: V3) => project(p, cam, 1080, 1920);

// ───────────────────────── A/E · version plates with two holes through all of them ─────────────────────────
const VERSIONS = ["5.6", "7.0", "7.4", "8.0", "8.1", "8.2", "8.3", "8.4", "8.5"];
const HOLES: [number, number][] = [
  [-0.55, 0.35],
  [0.5, -0.4],
];
const HOLE_R = 0.28;

const plateGeometry = () => {
  const w = 2.4;
  const h = 3.2;
  const s = new THREE.Shape();
  const r = 0.14;
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  HOLES.forEach(([x, y]) => {
    const p = new THREE.Path();
    p.absarc(x, y, HOLE_R, 0, Math.PI * 2, true);
    s.holes.push(p);
  });
  return new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false, curveSegments: 32 });
};

const labelTex = (text: string) => {
  const cv = document.createElement("canvas");
  cv.width = 512;
  cv.height = 160;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#c9d0ff";
  g.font = "bold 92px Arial, sans-serif";
  g.textAlign = "center";
  g.fillText(`PHP ${text}`, 256, 112);
  const t = new THREE.CanvasTexture(cv);
  t.anisotropy = 4;
  return t;
};

export const SetPlates: React.FC<SetProps> = ({ f }) => {
  const geo = useMemo(plateGeometry, []);
  const labels = useMemo(() => VERSIONS.map(labelTex), []);
  // patched state only during the payoff (from "If you run" until the loop line)
  const patch = f >= c.run && f < c.because ? ramp(f, c.update, c.update + 20, easeOut) : 0;
  const restart = f >= c.restart && f < c.because ? ramp(f, c.restart, c.restart + 24) : 0;
  const t = keys(f, [
    [0, 0],
    [c.php, 1],
    [c.run, 0.4],
    [c.because, 0.35],
    [c.end - 2, 0],
  ]);
  // nearly on-axis: the two holes line up into two tunnels (an off-axis view turned each
  // beam into a slash across its ring, like a "no entry" sign)
  const cam: Cam = {
    pos: [0.15 - 0.1 * t, 0.3 - 0.1 * t, 7.2 - 1.6 * t],
    look: [0, 0, -6],
    fov: 38,
  };
  const ring = new THREE.Color(RED).lerp(new THREE.Color(GREEN), patch);
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Canvas cam={cam} fog={["#05060e", 6, 22]}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 5]} intensity={1.1} color="#c9d0ff" />
        {VERSIONS.map((v, i) => {
          const z = -i * 1.4;
          return (
            <group key={v} position={[0, 0, z]}>
              <mesh geometry={geo} position={[0, 0, -0.03]}>
                {/* opaque: see-through plates let the label of the plate behind bleed through */}
                <meshStandardMaterial color="#1c2140" emissive={PHP} emissiveIntensity={0.18} metalness={0.4} roughness={0.4} />
              </mesh>
              <mesh position={[0, 1.25, 0.04]}>
                <planeGeometry args={[1.6, 0.5]} />
                <meshBasicMaterial map={labels[i]} transparent toneMapped={false} />
              </mesh>
              {HOLES.map(([x, y], k) => (
                <group key={k} position={[x, y, 0.04]}>
                  <mesh>
                    <ringGeometry args={[HOLE_R, HOLE_R + 0.05, 48]} />
                    <meshBasicMaterial color={ring} toneMapped={false} />
                  </mesh>
                  {patch > 0 ? (
                    <mesh scale={patch}>
                      <circleGeometry args={[HOLE_R, 48]} />
                      <meshBasicMaterial color={GREEN} transparent opacity={0.85} toneMapped={false} />
                    </mesh>
                  ) : null}
                </group>
              ))}
            </group>
          );
        })}
        {/* the line of sight through every plate: two red beams (fade out once patched) */}
        {HOLES.map(([x, y], k) => (
          <group key={k}>
            {/* depthWrite off: a faded-out beam still hid the green caps behind it (black bars) */}
            {patch < 0.98 ? (
              <mesh position={[x, y, -5.6]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 14, 16]} />
                <meshBasicMaterial color={RED} transparent opacity={0.85 * (1 - patch)} depthWrite={false} toneMapped={false} />
              </mesh>
            ) : null}
            <Glow position={[x, y, 1.0]} size={0.9} color={RED} opacity={0.7 * (1 - patch)} />
          </group>
        ))}
        <Drift frame={f} count={150} box={[4, 3, 8]} velocity={[0, 0.003, 0.01]} size={0.04} color="#9aa6ff" opacity={0.5} seed={3} />
      </Canvas>
      {restart > 0 ? <RestartIcon p={restart} /> : null}
      {f < c.php || f >= c.because ? <VersionsTag o={f < c.php ? 1 - ramp(f, c.php - 8, c.php) : ramp(f, c.because, c.because + 8)} /> : null}
    </AbsoluteFill>
  );
};

const VersionsTag: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 210, textAlign: "center", opacity: o }}>
    <span style={{ padding: "8px 22px", border: `3px solid ${RED}`, background: "rgba(5,6,14,0.85)", color: "#ffd0d4", fontFamily: fonts.hud, fontWeight: 700, fontSize: 40, letterSpacing: 4 }}>
      EVERY VERSION · PHP 5 → 8.5
    </span>
  </div>
);

const RestartIcon: React.FC<{ p: number }> = ({ p }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <g transform={`translate(540 250) rotate(${p * 360})`} opacity={Math.min(1, p * 4)}>
      <path d="M 0 -80 A 80 80 0 1 1 -69 -40" fill="none" stroke={GREEN} strokeWidth={14} strokeLinecap="round" />
      <path d="M -96 -62 L -66 -30 L -40 -70 Z" fill={GREEN} />
    </g>
  </svg>
);

// ───────────────────────── B · 100 websites, 71 run PHP; name + score ─────────────────────────
export const SetSites: React.FC<SetProps> = ({ f }) => {
  const lit = (i: number) => ramp(f, c.seven + i * 0.35, c.seven + i * 0.35 + 6);
  const order = useMemo(() => {
    // deterministic shuffle so the PHP tiles are scattered, not a solid block
    const idx = Array.from({ length: 100 }, (_, i) => i);
    let s = 7;
    for (let i = idx.length - 1; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const rank = new Array(100);
    idx.forEach((v, k) => (rank[v] = k));
    return rank as number[];
  }, []);
  const hit = ramp(f, c.name, c.name + 10);
  const cam: Cam = {
    pos: keys3(f, [
      [c.php, [0, -1.6, 15.5]],
      [c.called, [0.5, -1.2, 14.2]],
      [c.one, [0.7, -1.0, 13.6]],
    ]),
    look: [0, 0.2, 0],
    fov: 42,
  };
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Canvas cam={cam}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 6]} intensity={1} />
        <group rotation={[-0.25, 0.12 + f * 0.0008, 0]}>
          {Array.from({ length: 100 }, (_, i) => {
            const x = (i % 10) - 4.5;
            const y = 4.5 - Math.floor(i / 10);
            const php = order[i] < 71;
            const on = php ? lit(order[i]) : 0;
            const col = new THREE.Color("#262b45").lerp(new THREE.Color(PHP), on).lerp(new THREE.Color(RED), php ? hit * 0.75 : 0);
            return (
              <group key={i} position={[x * 0.62, y * 0.62 * 1.1, 0]}>
                <mesh>
                  <boxGeometry args={[0.52, 0.6, 0.04]} />
                  <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.35 + 0.4 * on} roughness={0.5} />
                </mesh>
                <mesh position={[0, 0.25, 0.025]}>
                  <boxGeometry args={[0.52, 0.08, 0.01]} />
                  <meshBasicMaterial color="#0d1022" />
                </mesh>
              </group>
            );
          })}
        </group>
      </Canvas>
      {f >= c.called ? <Title f={f} /> : null}
    </AbsoluteFill>
  );
};

const Title: React.FC<{ f: number }> = ({ f }) => {
  const o = ramp(f, c.name - 2, c.name + 4);
  const t = f - c.name;
  // short RGB split on appearance, then steady
  const split = t >= 0 && t < 8 ? (8 - t) * 2.5 : 0;
  const style: React.CSSProperties = { position: "absolute", left: 0, right: 0, textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 132, letterSpacing: -2 };
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 360, opacity: o }}>
      <div style={{ ...style, color: "#ff3b6b", transform: `translateX(${-split}px)`, opacity: 0.7 }}>PHP2SHELL</div>
      <div style={{ ...style, color: "#3be0ff", transform: `translateX(${split}px)`, opacity: 0.7 }}>PHP2SHELL</div>
      <div style={{ ...style, color: "#ffffff" }}>PHP2SHELL</div>
      <div style={{ position: "absolute", top: 160, left: 0, right: 0, textAlign: "center", fontFamily: fonts.hud, fontSize: 30, letterSpacing: 4, color: "#c9d0ff" }}>
        CVE-2026-109618 · CVE-2026-109619
      </div>
    </div>
  );
};

// ───────────────────────── C · inside a PHP worker: memory, leftovers, a stranger's code ─────────────────────────
const COLS = 8;
const ROWS = 6;

export const SetWorker: React.FC<SetProps> = ({ f }) => {
  const phase = f < c.other ? "oom" : f < c.either ? "leak" : "rce";
  const cam: Cam = {
    pos: keys3(f, [
      [c.one, [1.6, 0.8, 7.4]],
      [c.other, [0.8, 0.6, 7.0]],
      [c.either, [-0.4, 0.4, 7.6]],
      [c.worst, [-0.6, 0.3, 7.2]],
    ]),
    look: [0, 0.3, 0],
    fov: 40,
  };
  // memory fill for the out-of-memory beat
  const fill = ramp(f, c.one + 4, c.memory + 14, (x) => x);
  const oom = f >= c.memory + 10 && phase === "oom";
  // visitors for the leftovers beat
  const v1 = ramp(f, c.other, c.leftovers + 6);
  const v2 = ramp(f, c.next - 4, c.next + 12);
  // the stranger's request
  const red = ramp(f, c.either, c.stranger + 10, easeOut);
  const cell = (i: number) => {
    const k = i / (COLS * ROWS);
    if (phase === "oom") return k < fill ? (oom && k > fill - 0.12 ? RED : PHP) : "#1a1f38";
    if (phase === "leak") {
      // visitor 1 leaves a few amber cells behind, visitor 2 picks them up
      const left = [5, 12, 19, 27, 30].includes(i);
      if (left && v1 > 0.6) return v2 > 0.6 ? RED : "#ffb347";
      return k < 0.35 * v2 ? "#4fb0ff" : "#1a1f38";
    }
    return k < red ? RED : "#1a1f38";
  };
  const packet = (p: number, color: string, y: number) => {
    if (p <= 0 || p >= 1) return null;
    const x = -4.2 + p * 4.2;
    return (
      <group position={[x, y, 0.3]}>
        <mesh>
          <boxGeometry args={[0.32, 0.32, 0.32]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <Glow position={[0, 0, 0]} size={1.0} color={color} />
      </group>
    );
  };
  const srv = at(cam, [0, 1.75, 0]);
  return (
    <ViewMode mode={phase === "rce" && f >= c.code ? "danger" : "normal"} id="worker">
      <AbsoluteFill style={{ background: BG }}>
        <Canvas cam={cam}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 4, 6]} intensity={1} />
          {/* the server: translucent box with a memory grid on its face */}
          <mesh position={[0, 0.3, -0.3]}>
            <boxGeometry args={[2.8, 2.6, 0.5]} />
            <meshStandardMaterial color="#141933" transparent opacity={0.9} metalness={0.5} roughness={0.35} />
          </mesh>
          {Array.from({ length: COLS * ROWS }, (_, i) => {
            const x = (i % COLS) - (COLS - 1) / 2;
            const y = (ROWS - 1) / 2 - Math.floor(i / COLS);
            const col = cell(i);
            return (
              <mesh key={i} position={[x * 0.3, 0.3 + y * 0.34, 0]}>
                <boxGeometry args={[0.24, 0.26, 0.06]} />
                <meshBasicMaterial color={col} toneMapped={false} />
              </mesh>
            );
          })}
          {/* the wire from the internet */}
          <mesh position={[-2.8, -1.25, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 3.6, 8]} />
            <meshBasicMaterial color="#3a4170" />
          </mesh>
          {phase === "leak" ? packet(v1 * 1.1, "#ffb347", -1.25) : null}
          {phase === "leak" ? packet(v2 * 1.1, "#4fb0ff", -1.25) : null}
          {phase === "rce" ? packet(red * 1.1, RED, -1.25) : null}
          <Drift frame={f} count={80} box={[5, 3, 3]} velocity={[0.004, 0, 0]} size={0.04} color="#9aa6ff" opacity={0.4} seed={9} />
        </Canvas>
        {srv ? <Label x={srv.x} y={srv.y - 60} text="PHP WORKER · MEMORY" /> : null}
        {oom ? <Badge top={1390} text="OUT OF MEMORY · MID-REQUEST" color={RED} /> : null}
        {phase === "leak" && v1 > 0.2 ? <Badge top={1390} text={v2 > 0.6 ? "VISITOR 2 GETS VISITOR 1'S LEFTOVERS" : "VISITOR 1 LEAVES LEFTOVERS"} color={v2 > 0.6 ? RED : "#ffb347"} /> : null}
        {phase === "rce" && f >= c.code ? <Terminal f={f} /> : null}
        {f >= c.nopass ? <Badge top={1390} text={f >= c.onereq ? "NO PASSWORD · 1 REQUEST" : "NO PASSWORD"} color="#ffffff" /> : null}
      </AbsoluteFill>
    </ViewMode>
  );
};

const Label: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%,0)", fontFamily: fonts.hud, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: "#c9d0ff", whiteSpace: "nowrap" }}>{text}</div>
);

const Badge: React.FC<{ top: number; text: string; color: string }> = ({ top, text, color }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top,
      transform: "translate(-50%,0)",
      padding: "8px 22px",
      border: `3px solid ${color}`,
      background: "rgba(7,9,20,0.85)",
      color,
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

/** A stranger's commands appearing on the server — generic, nothing real or usable. */
const Terminal: React.FC<{ f: number }> = ({ f }) => {
  const lines = ["$ whoami", "www-data", "$ ls /var/www", "config.php  uploads/  index.php", "$ _"];
  const n = Math.min(lines.length, Math.floor((f - c.code) / 6) + 1);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 300,
        transform: "translate(-50%,0)",
        width: 760,
        padding: "22px 28px",
        background: "rgba(5,6,12,0.92)",
        border: `3px solid ${RED}`,
        fontFamily: "Menlo, Courier New, monospace",
        fontSize: 34,
        lineHeight: 1.45,
        color: "#ff9aa2",
      }}
    >
      <div style={{ fontFamily: fonts.hud, fontSize: 26, letterSpacing: 3, color: RED, marginBottom: 8 }}>SOMEONE ELSE'S CODE · ON YOUR SERVER</div>
      {lines.slice(0, n).map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
};

// ───────────────────────── D · timeline: planned, leaked, attacked before anyone knew ─────────────────────────
const DAYS = [
  { d: 17, label: "ATTACK SEEN", sub: "AMAZON HONEYPOT", color: RED },
  { d: 20, label: "DETAILS LEAK", sub: "SOCIAL MEDIA", color: "#ffb347" },
  { d: 21, label: "FIX RELEASED", sub: "PHP 8.2–8.5", color: GREEN },
  { d: 22, label: "PLANNED REVEAL", sub: "THE ORIGINAL DATE", color: "#c9d0ff" },
];

export const SetTimeline: React.FC<SetProps> = ({ f }) => {
  const y = (d: number) => 430 + (d - 17) * 165;
  const show = (d: number) =>
    d === 22 ? ramp(f, c.planned - 4, c.planned + 6) : d === 20 ? ramp(f, c.leaked - 2, c.leaked + 6) : d === 21 ? ramp(f, c.leaked + 8, c.leaked + 16) : ramp(f, c.amazon, c.amazon + 8);
  const bracket = ramp(f, c.days4, c.days4 + 12, easeOut);
  const danger = f >= c.amazon;
  return (
    <ViewMode mode={danger ? "danger" : "normal"} id="tl">
      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(150,160,255,0.05) 0 2px, transparent 2px 60px), repeating-linear-gradient(90deg, rgba(150,160,255,0.05) 0 2px, transparent 2px 60px), #070914",
        }}
      >
        <svg width={1080} height={1920}>
          <line x1={300} y1={y(16.5)} x2={300} y2={y(22.5)} stroke="#3a4170" strokeWidth={6} />
          {Array.from({ length: 6 }, (_, i) => 17 + i).map((d) => (
            <g key={d}>
              <circle cx={300} cy={y(d)} r={10} fill="#3a4170" />
              <text x={262} y={y(d) + 14} textAnchor="end" fill="#8b93c7" style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 40 }}>
                OCT {d}
              </text>
            </g>
          ))}
          {DAYS.map((e) => {
            const o = show(e.d);
            if (o <= 0) return null;
            return (
              <g key={e.d} opacity={o} transform={`translate(${(1 - o) * 30} 0)`}>
                <circle cx={300} cy={y(e.d)} r={22} fill={e.color} />
                <text x={345} y={y(e.d) + 4} fill={e.color} style={{ fontFamily: fonts.punch, fontWeight: 900, fontSize: 54 }}>
                  {e.label}
                </text>
                <text x={345} y={y(e.d) + 46} fill="#c9d0ff" style={{ fontFamily: fonts.hud, fontWeight: 600, fontSize: 30, letterSpacing: 3 }}>
                  {e.sub}
                </text>
              </g>
            );
          })}
          {bracket > 0 ? (
            <g opacity={bracket}>
              <path d={`M 110 ${y(17)} L 80 ${y(17)} L 80 ${y(17) + (y(21) - y(17)) * bracket} L 110 ${y(17) + (y(21) - y(17)) * bracket}`} fill="none" stroke={RED} strokeWidth={6} />
              <text x={56} y={(y(17) + y(21)) / 2} textAnchor="middle" fill={RED} transform={`rotate(-90 56 ${(y(17) + y(21)) / 2})`} style={{ fontFamily: fonts.hud, fontWeight: 700, fontSize: 40, letterSpacing: 4 }}>
                4 DAYS BEFORE PUBLIC
              </text>
            </g>
          ) : null}
        </svg>
      </AbsoluteFill>
    </ViewMode>
  );
};
