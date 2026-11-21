import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow } from "../../lib/three/core";
import { Env, KeyLight, Post, RB } from "../../lib/three/diorama";
import { seeded } from "../../lib/timing";
import { ClawMachine } from "../../lib/three/ClawMachine";
import { usePbr } from "../../lib/three/pbr";

/** The classic black-light arcade carpet: dark navy with neon squiggles, planets, stars and triangles. */
const arcadeCarpet = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const S = 1024;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    g.fillStyle = "#0b0a24";
    g.fillRect(0, 0, S, S);
    const r = seeded(42);
    for (let i = 0; i < 60000; i++) {
      g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "60,60,120"},${0.25 * r()})`;
      g.fillRect(r() * S, r() * S, 2, 2);
    }
    const neon = ["#ff2fa0", "#28e0ff", "#ffe23a", "#7dff5a", "#a35bff", "#ff8a2a"];
    for (let i = 0; i < 70; i++) {
      const col = neon[i % neon.length];
      const x = r() * S;
      const y = r() * S;
      g.strokeStyle = col;
      g.fillStyle = col;
      g.lineWidth = 7;
      const kind = i % 5;
      if (kind === 0) {
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 1; k < 6; k++) g.quadraticCurveTo(x + k * 22 - 11, y + (k % 2 ? -26 : 26), x + k * 22, y);
        g.stroke();
      } else if (kind === 1) {
        g.beginPath();
        g.arc(x, y, 18 + r() * 14, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.ellipse(x, y, 42, 10, -0.4, 0, Math.PI * 2);
        g.stroke();
      } else if (kind === 2) {
        g.beginPath();
        g.moveTo(x, y - 22);
        g.lineTo(x + 20, y + 14);
        g.lineTo(x - 20, y + 14);
        g.closePath();
        g.stroke();
      } else if (kind === 3) {
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          g.fillRect(x + Math.cos(a) * 14 - 3, y + Math.sin(a) * 14 - 3, 6, 6);
        }
      } else {
        g.beginPath();
        g.arc(x, y, 8, 0, Math.PI * 2);
        g.fill();
      }
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(5, 5);
    t.anisotropy = 8;
    return t;
  };
})();

/** Neon tube text on a wall (canvas, emissive). */
const neonTex = (text: string, color: string, w = 1024, h = 256, size = 150) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, w, h);
  g.font = `italic 900 ${size}px Arial Black, Impact, sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = color;
  g.shadowBlur = 50;
  g.strokeStyle = color;
  g.lineWidth = 14;
  g.strokeText(text, w / 2, h / 2);
  g.shadowBlur = 10;
  g.lineWidth = 5;
  g.strokeStyle = "#ffffff";
  g.strokeText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

export const NeonSign: React.FC<{ p: [number, number, number]; ry?: number; text: string; color: string; w: number; on?: number }> = ({ p, ry = 0, text, color, w, on = 1 }) => {
  const map = useMemo(() => neonTex(text, color), [text, color]);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh>
        <planeGeometry args={[w, w / 4]} />
        <meshBasicMaterial map={map} transparent opacity={on} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={1.6 * on} distance={5} decay={2} position={[0, 0, 0.4]} />
    </group>
  );
};

/** Screen art for an upright video cabinet: a little game frame (space shooter / maze / racer). */
const screenTex = (kind: number) => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 200;
  const g = c.getContext("2d")!;
  g.fillStyle = "#04040c";
  g.fillRect(0, 0, 256, 200);
  const r = seeded(kind * 11 + 5);
  if (kind === 0) {
    for (let i = 0; i < 40; i++) {
      g.fillStyle = "#ffffff";
      g.fillRect(r() * 256, r() * 200, 2, 2);
    }
    g.fillStyle = "#7dff5a";
    for (let y = 0; y < 3; y++) for (let x = 0; x < 7; x++) g.fillRect(28 + x * 30, 26 + y * 24, 18, 12);
    g.fillStyle = "#28e0ff";
    g.fillRect(118, 170, 22, 12);
  } else if (kind === 1) {
    g.strokeStyle = "#3b5bff";
    g.lineWidth = 6;
    for (let i = 0; i < 9; i++) g.strokeRect(14 + i * 12, 14 + i * 9, 228 - i * 24, 172 - i * 18);
    g.fillStyle = "#ffe23a";
    g.beginPath();
    g.arc(128, 100, 12, 0.5, Math.PI * 2 - 0.5);
    g.lineTo(128, 100);
    g.fill();
  } else {
    g.fillStyle = "#2a2a3a";
    g.beginPath();
    g.moveTo(100, 0);
    g.lineTo(156, 0);
    g.lineTo(256, 200);
    g.lineTo(0, 200);
    g.fill();
    g.fillStyle = "#ffffff";
    for (let i = 0; i < 6; i++) g.fillRect(126, i * 34, 4, 18);
    g.fillStyle = "#ff2f4a";
    g.fillRect(110, 150, 36, 30);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Upright arcade video cabinet (≈ 0.7 × 0.85 × 1.8 m), front = +Z. */
export const VideoCabinet: React.FC<{ p: [number, number, number]; ry?: number; color: string; kind: number; t: number }> = ({ p, ry = 0, color, kind, t }) => {
  const scr = useMemo(() => screenTex(kind), [kind]);
  const marq = useMemo(() => neonTex(["STAR BLAST", "MAZE MUNCH", "TURBO 99"][kind % 3], ["#7dff5a", "#ffe23a", "#ff2f4a"][kind % 3], 512, 128, 70), [kind]);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <RB p={[0, 0.5, 0]} s={[0.7, 1.0, 0.8]} r={0.02} color={color} rough={0.5} />
      <RB p={[0, 1.38, -0.12]} s={[0.7, 0.76, 0.56]} r={0.02} color={color} rough={0.5} />
      {/* angled screen bezel + glowing screen */}
      <group position={[0, 1.3, 0.17]} rotation={[-0.25, 0, 0]}>
        <RB p={[0, 0, 0]} s={[0.62, 0.5, 0.04]} r={0.01} color="#0b0b10" />
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[0.52, 0.4]} />
          <meshStandardMaterial map={scr} emissiveMap={scr} emissive="#ffffff" emissiveIntensity={1.1 + 0.1 * Math.sin(t * 7 + kind)} roughness={0.2} />
        </mesh>
      </group>
      {/* control panel */}
      <RB p={[0, 1.02, 0.33]} s={[0.7, 0.08, 0.3]} r={0.02} color="#18181e" rot={[0.2, 0, 0]} />
      <mesh position={[-0.12, 1.1, 0.36]}>
        <sphereGeometry args={[0.025, 12, 10]} />
        <meshPhysicalMaterial color="#e0262c" clearcoat={1} roughness={0.2} />
      </mesh>
      {[0.06, 0.14, 0.22].map((x, i) => (
        <mesh key={i} position={[x, 1.075, 0.36]}>
          <cylinderGeometry args={[0.02, 0.02, 0.015, 16]} />
          <meshStandardMaterial color={["#ffe23a", "#28e0ff", "#7dff5a"][i]} emissive={["#ffe23a", "#28e0ff", "#7dff5a"][i]} emissiveIntensity={0.4} />
        </mesh>
      ))}
      {/* marquee */}
      <RB p={[0, 1.86, -0.05]} s={[0.7, 0.2, 0.42]} r={0.02} color="#0b0b10" />
      <mesh position={[0, 1.86, 0.165]}>
        <planeGeometry args={[0.62, 0.155]} />
        <meshBasicMaterial map={marq} toneMapped={false} />
      </mesh>
      <RB p={[0, 0.55, 0.405]} s={[0.22, 0.3, 0.01]} r={0.005} color="#2a2a30" metal={0.6} />
    </group>
  );
};

/** Coin / change machine on the back wall. */
const ChangeMachine: React.FC<{ p: [number, number, number]; ry?: number }> = ({ p, ry = 0 }) => {
  const label = useMemo(() => neonTex("CHANGE", "#28e0ff", 512, 128, 80), []);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <RB p={[0, 0.85, 0]} s={[0.6, 1.7, 0.5]} r={0.02} color="#c9ccd2" metal={0.7} rough={0.35} />
      <mesh position={[0, 1.45, 0.252]}>
        <planeGeometry args={[0.5, 0.125]} />
        <meshBasicMaterial map={label} toneMapped={false} />
      </mesh>
      <RB p={[0, 1.05, 0.26]} s={[0.24, 0.1, 0.02]} r={0.01} color="#18181e" />
      <RB p={[0, 0.45, 0.26]} s={[0.3, 0.2, 0.06]} r={0.02} color="#2a2a30" metal={0.6} />
    </group>
  );
};

/**
 * The arcade hall: carpet, dark walls with neon, a ceiling grid with spotlights, rows of cabinets and
 * three more claw machines. The hero claw machine stands at the origin (not drawn here).
 * Hall: x −7…7, z −6…5, ceiling 3.4 m.
 */
export const ArcadeHall: React.FC<{ t: number; others?: boolean }> = ({ t, others = true }) => {
  const carpet = useMemo(() => arcadeCarpet(), []);
  const wall = usePbr("concrete_floor_02", [6, 2]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 11]} />
        <meshStandardMaterial map={carpet} roughness={1} />
      </mesh>
      {/* walls + ceiling */}
      <mesh position={[0, 1.7, -6]} receiveShadow>
        <planeGeometry args={[14, 3.4]} />
        <meshStandardMaterial {...wall} color="#2a1f3f" roughness={0.9} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * 7, 1.7, -0.5]} rotation={[0, (-k * Math.PI) / 2, 0]} receiveShadow>
          <planeGeometry args={[11, 3.4]} />
          <meshStandardMaterial {...wall} color="#251b38" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.7, 5]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[14, 3.4]} />
        <meshStandardMaterial color="#1c1530" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.4, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 11]} />
        <meshStandardMaterial color="#0d0b14" roughness={1} />
      </mesh>
      {/* skirting with a neon strip */}
      <mesh position={[0, 0.08, -5.98]}>
        <boxGeometry args={[14, 0.04, 0.02]} />
        <meshStandardMaterial color="#ffffff" emissive="#a35bff" emissiveIntensity={2} />
      </mesh>
      {/* ceiling spots */}
      {[-4, 0, 4].map((x) =>
        [-3.5, 0, 3].map((z) => (
          <group key={`${x}${z}`} position={[x, 3.36, z]}>
            <mesh>
              <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
              <meshStandardMaterial color="#fff3dd" emissive="#fff3dd" emissiveIntensity={1.6} />
            </mesh>
          </group>
        )),
      )}
      <NeonSign p={[0, 2.65, -5.95]} text="ARCADE" color="#ff2fa0" w={3.6} on={0.92 + 0.08 * Math.sin(t * 2.3)} />
      <NeonSign p={[-6.95, 2.4, -2.5]} ry={Math.PI / 2} text="PRIZES" color="#28e0ff" w={2.4} />
      <NeonSign p={[6.95, 2.4, -2.5]} ry={-Math.PI / 2} text="HIGH SCORE" color="#ffe23a" w={2.8} />
      {others ? (
        <>
          {/* back row of video cabinets */}
          {[-5.2, -4.3, -3.4, 3.4, 4.3, 5.2].map((x, i) => (
            <VideoCabinet key={x} p={[x, 0, -5.5]} color={["#2b3a8a", "#8a2b5a", "#1f6a5a"][i % 3]} kind={i % 3} t={t} />
          ))}
          {/* more claw machines in a row with the hero (hero at x = 0) */}
          {[-2.2, -1.1, 1.1, 2.2].map((x, i) => (
            <group key={x} position={[x, 0, 0]}>
              <ClawMachine claw={{ x: 0.1 * (i - 1.5), z: -0.1, drop: 0, open: 0.4 }} t={t + i} body={["#2b6fd8", "#18a35a", "#e88a1a", "#8a3ad8"][i]} sign={["MEGA CLAW", "LUCKY GRAB", "TOY TOWN", "CLAW KING"][i]} signColor={["#28e0ff", "#7dff5a", "#ffe23a", "#a35bff"][i]} pile={undefined} />
            </group>
          ))}
          <ChangeMachine p={[-6.4, 0, -4.8]} ry={Math.PI / 4} />
          {/* side rows */}
          {[-3.2, -1.8, -0.4, 1.0].map((z, i) => (
            <VideoCabinet key={`l${z}`} p={[-6.4, 0, z]} ry={Math.PI / 2} color={["#3a2b8a", "#8a2b2b"][i % 2]} kind={(i + 1) % 3} t={t} />
          ))}
          {[-3.2, -1.8, -0.4, 1.0].map((z, i) => (
            <VideoCabinet key={`r${z}`} p={[6.4, 0, z]} ry={-Math.PI / 2} color={["#1f5a8a", "#6a2b8a"][i % 2]} kind={i % 3} t={t} />
          ))}
        </>
      ) : null}
    </group>
  );
};

/** Canvas for every shot: `arcade` = low env (night inside), warm key from the ceiling, pink/cyan neon fills;
 * `garage` = one warm bulb (inside <Garage/>) + a cool fill from the door. `dim` 0–1 darkens the hall lights. */
export const ArcadeCanvas: React.FC<{ cam: Cam; t: number; children: React.ReactNode; others?: boolean; hall?: boolean; ao?: number; bloom?: number; mood?: "arcade" | "garage"; dim?: number }> = ({ cam, t, children, others = true, hall = true, ao = 1.0, bloom = 0.9, mood = "arcade", dim = 0 }) => {
  const { width, height } = useVideoConfig();
  const a = mood === "arcade";
  const lit = 1 - 0.6 * dim;
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.02, far: 80 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={["#07060d"]} />
      {a ? (
        <>
          <hemisphereLight args={["#6a5a9a", "#1a1028", 0.55 * lit]} />
          <KeyLight p={[1.2, 3.3, 2.2]} target={[0, 1, 0]} intensity={2.1 * lit} color="#fff0dc" size={4} />
          <pointLight position={[-2.5, 2.2, 1.5]} color="#ff2fa0" intensity={2.2 * lit} distance={7} decay={2} />
          <pointLight position={[2.5, 2.2, 1.5]} color="#28e0ff" intensity={2.2 * lit} distance={7} decay={2} />
          {hall ? <ArcadeHall t={t} others={others} /> : null}
          <Glow position={[0, 2.65, -5.8]} size={4} color="#ff2fa0" opacity={0.35} />
        </>
      ) : (
        <>
          <hemisphereLight args={["#9ab0d0", "#3a3028", 0.45]} />
          <KeyLight p={[-3, 2.4, 2.5]} target={[0, 0.6, 0]} intensity={0.9} color="#bcd0ff" size={4} />
        </>
      )}
      {children}
      <Env intensity={a ? 0.08 : 0.12} />
      <Post bloom={bloom} ao={ao} vignette={0.45} />
    </ThreeCanvas>
  );
};
