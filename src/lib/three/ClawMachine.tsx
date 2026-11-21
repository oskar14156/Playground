import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "./core";
import { Cyl, RB } from "./diorama";
import { seeded } from "../timing";
import { Axolotl, Capybara, PlushShark, RubberDuck } from "./Mascots";
import { Plush } from "./Plush";

/**
 * Arcade claw crane at real size (≈ 0.96 × 0.92 × 2.05 m), origin on the floor, front = +Z.
 * Frame-driven: `claw` = gantry position inside the glass box (x, z in metres from the box centre),
 * `drop` 0–1 cable out, `open` 0–1 prongs; `power` 0–1 lights the coil (yellow) and its voltage bar;
 * `xray` 0–1 fades the lower front panel so the control board + coil wiring show.
 * Real parts: coin door + bill slot, joystick + button deck, prize chute with an acrylic rim in the
 * front-left corner, prize door below it, gantry on two rails, marquee with chase bulbs.
 */
export const CM = {
  W: 0.84, // inner box width (x)
  D: 0.78, // inner box depth (z)
  floor: 1.0, // prize floor height
  top: 1.76, // gantry rail height
  chute: { x: -0.27, z: 0.24, s: 0.26, rim: 0.16 }, // hole centre + size + acrylic rim height
};

/** where the claw hub hangs for a given drop (for attaching a prize to it) */
export const clawHubY = (drop: number) => CM.top - 0.12 - drop * 0.52;

export type ClawState = { x: number; z: number; drop: number; open: number };

const signTex = (text: string, color: string) => {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#14061f";
  g.fillRect(0, 0, 1024, 256);
  g.font = "900 150px Arial Black, Impact, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = color;
  g.shadowBlur = 40;
  g.lineWidth = 10;
  g.strokeStyle = color;
  g.strokeText(text, 512, 136);
  g.shadowBlur = 0;
  g.fillStyle = "#ffffff";
  g.fillText(text, 512, 136);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const stickerTex = (lines: string[], bg: string, fg: string) => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = fg;
  g.textAlign = "center";
  g.textBaseline = "middle";
  lines.forEach((l, i) => {
    g.font = `900 ${i === 0 ? 96 : 52}px Arial Black, Impact, sans-serif`;
    g.fillText(l, 256, lines.length === 1 ? 128 : 80 + i * 110);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Control board (PCB) with chips, a tiny LCD and two trim pots: what the "chip" beat zooms into. */
const pcbTex = () => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 384;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0d6b5a";
  g.fillRect(0, 0, 512, 384);
  const r = seeded(7);
  g.strokeStyle = "#e8c35a";
  g.lineWidth = 3;
  for (let i = 0; i < 40; i++) {
    const x = r() * 512;
    const y = r() * 384;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 160, y);
    g.lineTo(x + (r() - 0.5) * 160, y + (r() - 0.5) * 120);
    g.stroke();
  }
  g.fillStyle = "#1a1a1e";
  g.fillRect(170, 120, 170, 120); // main chip
  for (let i = 0; i < 12; i++) {
    g.fillStyle = "#c9c9c9";
    g.fillRect(176 + i * 13.5, 110, 6, 10);
    g.fillRect(176 + i * 13.5, 240, 6, 10);
  }
  g.fillStyle = "#1a1a1e";
  g.fillRect(40, 40, 80, 50);
  g.fillRect(390, 260, 90, 70);
  g.fillStyle = "#ffffff";
  g.font = "bold 22px monospace";
  g.fillText("CPU", 230, 186);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** One prong of the claw: an upper arm from the hub pivot and a curved tip that points inwards. */
const Prong: React.FC<{ a: number; open: number; mat: THREE.Material }> = ({ a, open, mat }) => {
  const swing = -0.08 + 0.85 * open; // radians outward
  return (
    <group rotation={[0, a, 0]}>
      <group position={[0, 0, 0.035]} rotation={[swing, 0, 0]}>
        <mesh material={mat} position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.018, 0.12, 0.01]} />
        </mesh>
        <group position={[0, -0.118, 0]} rotation={[-0.75, 0, 0]}>
          <mesh material={mat} position={[0, -0.04, 0]} castShadow>
            <boxGeometry args={[0.016, 0.08, 0.009]} />
          </mesh>
          <mesh material={mat} position={[0, -0.083, -0.004]}>
            <sphereGeometry args={[0.01, 8, 6]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

/** The claw on its own (hub + coil + 3 prongs), origin = hub top. */
export const Claw: React.FC<{ open: number; power?: number; s?: number }> = ({ open, power = 0, s = 1 }) => {
  const chrome = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d8dde3", metalness: 1, roughness: 0.22 }), []);
  const coil = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffcc33", metalness: 0.4, roughness: 0.4, emissive: "#ffb000" }), []);
  coil.emissiveIntensity = 0.1 + 2.4 * power;
  return (
    <group scale={s}>
      <mesh material={chrome} position={[0, -0.03, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.046, 0.06, 24]} />
      </mesh>
      <mesh material={coil} position={[0, -0.03, 0]}>
        <torusGeometry args={[0.047, 0.008, 8, 28]} />
      </mesh>
      <mesh material={chrome} position={[0, -0.068, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.02, 20]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, -0.07, 0]}>
          <Prong a={(i * Math.PI * 2) / 3} open={open} mat={chrome} />
        </group>
      ))}
    </group>
  );
};

type Prize = { kind: number; p: V3; ry: number; s: number; tilt: number };
/** A seeded pile of small plush animals on the prize floor, kept clear of the chute. */
export const makePile = (n: number, seed = 3): Prize[] => {
  const r = seeded(seed);
  const out: Prize[] = [];
  const { W, D, chute } = CM;
  let tries = 0;
  while (out.length < n && tries < 600) {
    tries++;
    const x = (r() - 0.5) * (W - 0.12);
    const z = (r() - 0.5) * (D - 0.12);
    if (Math.abs(x - chute.x) < chute.s / 2 + 0.07 && Math.abs(z - chute.z) < chute.s / 2 + 0.07) continue;
    // two loose layers: second layer sits on the first
    const layer = out.filter((q) => Math.hypot(q.p[0] - x, q.p[2] - z) < 0.11).length;
    if (layer > 1) continue;
    out.push({ kind: Math.floor(r() * 5), p: [x, layer * 0.085, z], ry: (r() - 0.5) * 2.4, s: 0.095 + r() * 0.03, tilt: (r() - 0.5) * 0.5 });
  }
  return out;
};

export const PrizeToy: React.FC<{ kind: number; s: number; t?: number }> = ({ kind, s, t = 0 }) => {
  const k = kind % 5;
  if (k === 0) return <Capybara s={s} t={t} />;
  if (k === 1) return <PlushShark s={s} t={t} />;
  if (k === 2) return <Axolotl s={s} t={t} />;
  if (k === 3) return <RubberDuck s={s * 0.9} t={t} />;
  return <Plush s={s * 0.85} t={t} color={["#ff8fc2", "#4a9cff", "#8bd96a"][Math.floor(s * 100) % 3]} belly="#ffffff" />;
};

export const ClawMachine: React.FC<{
  claw: ClawState;
  t: number;
  power?: number;
  xray?: number;
  sign?: string;
  signColor?: string;
  body?: string;
  pile?: Prize[] | null;
  /** extra things inside the glass box (box-local coords, y = 0 on the prize floor) */
  inside?: React.ReactNode;
  /** something hanging in the claw (hub-local coords) */
  held?: React.ReactNode;
  water?: number;
  lights?: number;
  /** joystick tilt [toward +x, toward +z] in radians */
  stick?: [number, number];
  /** prize door flap 0 = shut, 1 = pushed open inwards */
  door?: number;
}> = ({ claw, t, power = 0, xray = 0, sign = "PLUSH GRAB", signColor = "#ff3fb4", body = "#d8243f", pile, inside, held, water = 0, lights = 1, stick = [0, 0], door = 0 }) => {
  const { W, D, floor, top, chute } = CM;
  const OW = W + 0.12;
  const OD = D + 0.14;
  const m = useMemo(
    () => ({
      glass: new THREE.MeshPhysicalMaterial({ color: "#dff4ff", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false }),
      acrylic: new THREE.MeshPhysicalMaterial({ color: "#bfe6ff", roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false }),
      frame: new THREE.MeshStandardMaterial({ color: "#c3c8cf", metalness: 1, roughness: 0.3 }),
      dark: new THREE.MeshStandardMaterial({ color: "#16161a", roughness: 0.6, metalness: 0.3 }),
      rail: new THREE.MeshStandardMaterial({ color: "#9aa1aa", metalness: 1, roughness: 0.35 }),
      sign: signTex(sign, signColor),
      sticker: stickerTex(["$1", "PER PLAY"], "#ffd23f", "#1a1a1a"),
      win: stickerTex(["WIN!"], "#2ec4d6", "#ffffff"),
      pcb: pcbTex(),
      front: new THREE.MeshStandardMaterial({ color: body, roughness: 0.35, metalness: 0.15, transparent: true, opacity: 1 }),
      water: new THREE.MeshStandardMaterial({ color: "#1d6a9a", roughness: 0.1, transparent: true, opacity: 0.0, depthWrite: false }),
    }),
    [sign, signColor, body],
  );
  m.front.opacity = 1 - 0.85 * xray;
  m.water.opacity = 0.16 * water;
  const prizes = useMemo(() => pile === undefined ? makePile(16) : pile, [pile]);
  const cableLen = 0.12 + claw.drop * 0.52;
  const bulbs = 18;
  return (
    <group>
      {/* ── lower cabinet ── */}
      {/* side + back walls and the deck (open front, so the x-ray can look inside) */}
      {[-1, 1].map((k) => (
        <RB key={k} p={[k * (OW / 2 - 0.015), 0.48, 0]} s={[0.03, 0.96, OD]} r={0.012} color={body} rough={0.35} metal={0.15} />
      ))}
      <RB p={[0, 0.48, -OD / 2 + 0.015]} s={[OW, 0.96, 0.03]} r={0.012} color={body} rough={0.35} metal={0.15} />
      <RB p={[0, 0.945, 0]} s={[OW, 0.03, OD]} r={0.012} color={body} rough={0.35} metal={0.15} />
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[OW - 0.04, 0.02, OD - 0.04]} />
        <meshStandardMaterial color="#141418" roughness={0.9} />
      </mesh>
      {/* inner chute shaft from the hole down to the prize door */}
      <mesh position={[chute.x, 0.66, chute.z + 0.03]}>
        <boxGeometry args={[chute.s, 0.6, chute.s]} />
        <meshStandardMaterial color="#2a2a33" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* front panel (fades for the x-ray) with coin door, bill slot, sticker, prize door */}
      <mesh position={[0, 0.5, OD / 2 + 0.006]} material={m.front}>
        <boxGeometry args={[OW - 0.04, 0.9, 0.012]} />
      </mesh>
      <group visible={xray < 0.5}>
      <RB p={[0.2, 0.56, OD / 2 + 0.02]} s={[0.2, 0.3, 0.02]} r={0.01} color="#2a2a30" metal={0.6} rough={0.35} />
      <RB p={[0.2, 0.62, OD / 2 + 0.032]} s={[0.07, 0.012, 0.008]} r={0.003} color="#c8c8c8" metal={1} rough={0.2} />
      <RB p={[0.2, 0.5, OD / 2 + 0.032]} s={[0.12, 0.02, 0.008]} r={0.004} color="#0a0a0a" />
      <mesh position={[0.2, 0.8, OD / 2 + 0.014]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshStandardMaterial map={m.sticker} roughness={0.6} />
      </mesh>
      {/* prize door under the chute, with a WIN sticker */}
      </group>
      {/* door frame (dark opening behind) + the flap, hinged at the top, swings inwards */}
      <RB p={[chute.x, 0.43, OD / 2 + 0.02]} s={[0.26, 0.03, 0.02]} r={0.008} color="#1d1d22" metal={0.4} rough={0.4} />
      <RB p={[chute.x, 0.17, OD / 2 + 0.02]} s={[0.26, 0.03, 0.02]} r={0.008} color="#1d1d22" metal={0.4} rough={0.4} />
      {[-1, 1].map((k) => (
        <RB key={k} p={[chute.x + k * 0.115, 0.3, OD / 2 + 0.02]} s={[0.03, 0.29, 0.02]} r={0.008} color="#1d1d22" metal={0.4} rough={0.4} />
      ))}
      <mesh position={[chute.x, 0.3, OD / 2 - 0.02]}>
        <boxGeometry args={[0.2, 0.23, 0.04]} />
        <meshStandardMaterial color="#050507" roughness={1} />
      </mesh>
      <group position={[chute.x, 0.415, OD / 2 + 0.026]} rotation={[-1.25 * door, 0, 0]}>
        <RB p={[0, -0.115, 0]} s={[0.2, 0.22, 0.008]} r={0.008} color="#2e3a44" rough={0.15} opacity={0.75} />
      </group>
      <mesh position={[chute.x, 0.48, OD / 2 + 0.014]}>
        <planeGeometry args={[0.18, 0.09]} />
        <meshStandardMaterial map={m.win} roughness={0.6} />
      </mesh>
      {/* kick plate */}
      <RB p={[0, 0.04, OD / 2 + 0.01]} s={[OW, 0.08, 0.02]} r={0.01} color="#222" metal={0.5} />
      {/* ── x-ray internals: board, power supply, coil wires ── */}
      <group visible={xray > 0.02}>
        <mesh position={[0.05, 0.55, OD / 2 - 0.06]}>
          <planeGeometry args={[0.36, 0.27]} />
          <meshStandardMaterial map={m.pcb} roughness={0.5} emissive="#0d6b5a" emissiveIntensity={0.4 * xray} />
        </mesh>
        <RB p={[-0.25, 0.2, 0]} s={[0.18, 0.12, 0.25]} r={0.01} color="#8a8f96" metal={0.8} rough={0.4} />
        <mesh position={[0.12, 0.92, 0.2]}>
          <cylinderGeometry args={[0.006, 0.006, 0.8, 6]} />
          <meshStandardMaterial color="#ffcc33" emissive="#ffb000" emissiveIntensity={0.5 + 2 * power} />
        </mesh>
      </group>
      {/* ── control deck: joystick + button ── */}
      <RB p={[0, 0.99, OD / 2 + 0.06]} s={[OW, 0.07, 0.2]} r={0.02} color="#1a1a20" metal={0.3} rough={0.5} />
      <group position={[0.08, 1.025, OD / 2 + 0.07]}>
        <Cyl p={[0, 0.005, 0]} r={0.035} h={0.012} color="#111" />
        <group rotation={[stick[1], 0, -stick[0]]}>
          <Cyl p={[0, 0.06, 0]} r={0.008} h={0.11} color="#cfd3d8" metal={1} rough={0.25} />
          <mesh position={[0, 0.125, 0]} castShadow>
            <sphereGeometry args={[0.024, 20, 14]} />
            <meshPhysicalMaterial color="#e0262c" roughness={0.2} clearcoat={1} />
          </mesh>
        </group>
      </group>
      <group position={[0.28, 1.03, OD / 2 + 0.07]}>
        <Cyl p={[0, 0, 0]} r={0.038} h={0.02} color="#222" />
        <mesh position={[0, 0.014, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.016, 24]} />
          <meshStandardMaterial color="#2ec4d6" emissive="#2ec4d6" emissiveIntensity={0.6 * lights} />
        </mesh>
      </group>
      {/* ── glass box ── */}
      <group position={[0, 0, 0]}>
        {/* prize floor */}
        <mesh position={[0, floor - 0.01, 0]} receiveShadow>
          <boxGeometry args={[W, 0.02, D]} />
          <meshStandardMaterial color="#2a1b3a" roughness={0.8} />
        </mesh>
        {/* chute hole: dark well + acrylic rim */}
        <mesh position={[chute.x, floor + 0.001, chute.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[chute.s, chute.s]} />
          <meshBasicMaterial color="#050507" />
        </mesh>
        {[
          [0, chute.s / 2, chute.s, 0.008],
          [0, -chute.s / 2, chute.s, 0.008],
          [chute.s / 2, 0, 0.008, chute.s],
          [-chute.s / 2, 0, 0.008, chute.s],
        ].map(([dx, dz, sx, sz], i) => (
          <mesh key={i} position={[chute.x + dx, floor + chute.rim / 2, chute.z + dz]} material={m.acrylic}>
            <boxGeometry args={[sx, chute.rim, sz]} />
          </mesh>
        ))}
        <mesh position={[chute.x, floor + chute.rim, chute.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[chute.s * 0.7, chute.s * 0.72, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color="#9fe8ff" />
        </mesh>
        {/* prizes */}
        <group position={[0, floor, 0]}>
          {prizes?.map((q, i) => (
            <group key={i} position={q.p} rotation={[q.tilt, q.ry, q.tilt * 0.6]}>
              <PrizeToy kind={q.kind} s={q.s} t={t * 0.3 + i} />
            </group>
          ))}
          {inside}
        </group>
        {/* water for the lobster tank */}
        {water > 0 ? (
          <mesh position={[0, floor + 0.18 * water, 0]} scale={[1, Math.max(0.001, water), 1]} material={m.water}>
            <boxGeometry args={[W - 0.01, 0.36, D - 0.01]} />
          </mesh>
        ) : null}
        {/* glass panes + corner posts */}
        <mesh position={[0, (floor + top) / 2 + 0.03, D / 2 + 0.03]} material={m.glass}>
          <planeGeometry args={[W + 0.04, top - floor + 0.08]} />
        </mesh>
        <mesh position={[0, (floor + top) / 2 + 0.03, -D / 2 - 0.03]} rotation={[0, Math.PI, 0]} material={m.glass}>
          <planeGeometry args={[W + 0.04, top - floor + 0.08]} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * (W / 2 + 0.03), (floor + top) / 2 + 0.03, 0]} rotation={[0, (k * Math.PI) / 2, 0]} material={m.glass}>
            <planeGeometry args={[D + 0.04, top - floor + 0.08]} />
          </mesh>
        ))}
        {[-1, 1].map((kx) =>
          [-1, 1].map((kz) => <RB key={`${kx}${kz}`} p={[kx * (W / 2 + 0.03), (floor + top) / 2 + 0.04, kz * (D / 2 + 0.03)]} s={[0.04, top - floor + 0.1, 0.04]} r={0.01} color="#c3c8cf" metal={1} rough={0.3} />),
        )}
        {/* LED strips inside the front posts */}
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * (W / 2 + 0.005), (floor + top) / 2, D / 2 + 0.005]}>
            <boxGeometry args={[0.012, top - floor - 0.04, 0.012]} />
            <meshStandardMaterial color="#ffffff" emissive={signColor} emissiveIntensity={2.2 * lights} />
          </mesh>
        ))}
      </group>
      {/* ── gantry: two rails along Z, the bridge along X at claw.z, the trolley at claw.x ── */}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * (W / 2 - 0.03), top, 0]} material={m.rail}>
          <boxGeometry args={[0.03, 0.03, D - 0.02]} />
        </mesh>
      ))}
      <mesh position={[0, top - 0.02, claw.z]} material={m.rail}>
        <boxGeometry args={[W - 0.04, 0.025, 0.05]} />
      </mesh>
      <group position={[claw.x, top - 0.05, claw.z]}>
        <RB p={[0, 0, 0]} s={[0.1, 0.05, 0.09]} r={0.008} color="#2a2a30" metal={0.6} rough={0.4} />
        <Cyl p={[0, -0.01, 0.05]} r={0.018} h={0.04} rot={[Math.PI / 2, 0, 0]} color="#555" metal={0.8} />
        {/* cable + claw */}
        <mesh position={[0, -cableLen / 2, 0]}>
          <cylinderGeometry args={[0.0025, 0.0025, cableLen, 6]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <group position={[0, -cableLen, 0]}>
          <Claw open={claw.open} power={power} />
          {held}
        </group>
      </group>
      {/* ── top: roof + marquee with chase bulbs ── */}
      <RB p={[0, top + 0.06, 0]} s={[OW, 0.06, OD]} r={0.02} color={body} rough={0.35} metal={0.15} />
      <RB p={[0, top + 0.2, OD / 2 - 0.08]} s={[OW, 0.24, 0.16]} r={0.03} color="#1a0f24" />
      <mesh position={[0, top + 0.2, OD / 2 + 0.002]}>
        <planeGeometry args={[OW - 0.08, 0.19]} />
        <meshStandardMaterial map={m.sign} emissiveMap={m.sign} emissive="#ffffff" emissiveIntensity={1.4 * lights} roughness={0.4} />
      </mesh>
      {Array.from({ length: bulbs }, (_, i) => {
        const on = 0.35 + 0.65 * (Math.floor(t * 4 + i) % 3 === 0 ? 1 : 0);
        const u = i / (bulbs - 1);
        return (
          <mesh key={i} position={[-OW / 2 + 0.04 + u * (OW - 0.08), top + 0.095, OD / 2 + 0.005]}>
            <sphereGeometry args={[0.011, 10, 8]} />
            <meshStandardMaterial color="#fff6d8" emissive="#ffd27a" emissiveIntensity={on * 3 * lights} />
          </mesh>
        );
      })}
    </group>
  );
};
