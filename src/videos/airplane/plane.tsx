import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "../../lib/three/core";

/**
 * A jumbo jet at real scale (Boeing 747-400 proportions), metres. Nose to −Z, up +Y, origin on the fuselage axis at
 * mid-length; with `gear` the wheels stand on y = GEAR_Y. Built so the reel can grow it part by part:
 *   wings 0–1 (grow out from the root) · skin 0–1 (aluminium panels cover the frame skeleton, nose → tail)
 *   engines 0–1 · tail 0–1 · paint 0–1 (bare aluminium → white "POCKET PUH AIR" livery) · ghost 0–1 (see-through skin)
 * Dimensions: length 70.6 m, span 64.4 m, fuselage Ø 6.5 m, upper-deck hump, wing sweep 37.5°, dihedral 7°.
 */
export const LENGTH = 70.6;
export const SPAN = 64.4;
export const R = 3.25;
export const GEAR_Y = -6.1;
const Z0 = -LENGTH / 2;

/** fuselage radius, centre-line height and hump height at z */
const body = (z: number) => {
  const s = z - Z0; // 0 at the nose
  const nose = s < 9 ? Math.sqrt(Math.max(0, 1 - Math.pow((9 - s) / 9, 2.2))) : 1;
  const t = THREE.MathUtils.clamp((z - 12) / (LENGTH / 2 - 12), 0, 1);
  const r = R * nose * (1 - t) ** 1.25 + 0.3 * t;
  const yc = 2.1 * t ** 1.7 - 0.35 * (1 - nose); // tail upsweep, nose a little low
  const hump = 2.05 * THREE.MathUtils.smoothstep(s, 2.5, 9.5) * (1 - THREE.MathUtils.smoothstep(s, 26, 33));
  return { r: Math.max(r, 0.02), yc, hump };
};
/** surface point of the fuselage at z, angle a (0 = right side, π/2 = top) */
const surf = (z: number, a: number): V3 => {
  const { r, yc, hump } = body(z);
  const up = Math.max(0, Math.sin(a));
  return [r * Math.cos(a), yc + r * Math.sin(a) * 1.03 + hump * up ** 3.2, z];
};

// ───────────────────────── livery: windows, doors, cheatline, name, belly ─────────────────────────
const W = 4096;
const H = 1024;
const liveryTex = (() => {
  const cache: Record<string, THREE.Texture> = {};
  return (paint: boolean) => {
    const k = paint ? "p" : "a";
    if (cache[k]) return cache[k];
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    // canvas x = along the body (nose → tail), canvas y = angle (0 at the top of the canvas = a 0 … 2π)
    const yOf = (a: number) => ((((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2)) * H;
    const xOf = (z: number) => ((z - Z0) / LENGTH) * W;
    if (paint) {
      g.fillStyle = "#f4f6f8";
      g.fillRect(0, 0, W, H);
      // grey belly
      g.fillStyle = "#b9c0c9";
      g.fillRect(0, yOf(Math.PI * 1.18), W, yOf(Math.PI * 1.82) - yOf(Math.PI * 1.18));
      // cheatlines (orange + blue) under the windows on both sides
      for (const side of [0.02, Math.PI - 0.1]) {
        const y = yOf(side + (side < 1 ? -0.14 : 0.14));
        g.fillStyle = "#ff7a1a";
        g.fillRect(xOf(Z0 + 7), y - 8, W, 16);
        g.fillStyle = "#1d3f8f";
        g.fillRect(xOf(Z0 + 7), y + (side < 1 ? -26 : 14), W, 12);
      }
    } else {
      // bare aluminium: panel seams and rivet lines
      g.fillStyle = "#cfd4da";
      g.fillRect(0, 0, W, H);
      for (let i = 0; i < 140; i++) {
        const x = (i / 140) * W;
        g.fillStyle = `rgba(${i % 2 ? 210 : 190},${i % 2 ? 214 : 196},${i % 2 ? 220 : 204},0.6)`;
        g.fillRect(x, 0, W / 140, H);
      }
      g.strokeStyle = "rgba(90,98,110,0.55)";
      g.lineWidth = 2;
      for (let i = 0; i < 140; i++) {
        g.beginPath();
        g.moveTo((i / 140) * W, 0);
        g.lineTo((i / 140) * W, H);
        g.stroke();
      }
      for (let j = 0; j < 16; j++) {
        g.beginPath();
        g.moveTo(0, (j / 16) * H);
        g.lineTo(W, (j / 16) * H);
        g.stroke();
      }
    }
    // passenger windows (rounded) on both sides of the main deck, and the upper deck
    const win = (x: number, y: number, w: number, h: number) => {
      g.fillStyle = "#1a2432";
      g.beginPath();
      g.roundRect(x - w / 2, y - h / 2, w, h, Math.min(w, h) * 0.45);
      g.fill();
      g.fillStyle = "rgba(120,160,200,0.35)";
      g.beginPath();
      g.roundRect(x - w / 2 + 2, y - h / 2 + 2, w * 0.5, h * 0.4, 4);
      g.fill();
    };
    const doors = [Z0 + 9.5, Z0 + 21, Z0 + 33, Z0 + 46, Z0 + 57];
    for (const a of [0.2, Math.PI - 0.2]) {
      for (let z = Z0 + 8; z < Z0 + 60; z += 0.53) {
        if (doors.some((d) => Math.abs(z - d) < 1.1)) continue;
        win(xOf(z), yOf(a), 13, 20);
      }
      for (const d of doors) {
        g.strokeStyle = paint ? "#9aa3ad" : "#6a737d";
        g.lineWidth = 3;
        g.beginPath();
        g.roundRect(xOf(d) - 18, yOf(a) - 46, 36, 92, 8);
        g.stroke();
      }
    }
    // upper-deck windows (on the hump)
    for (const a of [0.95, Math.PI - 0.95]) for (let z = Z0 + 11; z < Z0 + 25; z += 0.53) win(xOf(z), yOf(a), 12, 18);
    // cockpit windows
    for (const a of [0.85, 1.12, Math.PI - 1.12, Math.PI - 0.85]) {
      g.fillStyle = "#121a26";
      g.beginPath();
      g.roundRect(xOf(Z0 + 7.2) - 22, yOf(a) - 26, 44, 34, 8);
      g.fill();
    }
    if (paint) {
      // airline name above the windows, readable on both sides
      g.font = "900 120px Montserrat, Arial Black, sans-serif";
      g.fillStyle = "#1d3f8f";
      g.textBaseline = "middle";
      g.textAlign = "center";
      // right side: the nose is on the viewer's right and canvas-down runs up the body → rotate 180°; left side reads as drawn
      g.save();
      g.translate(xOf(Z0 + 30), yOf(0.62));
      g.scale(-1, -1);
      g.fillText("POCKET PUH AIR", 0, 0);
      g.restore();
      g.save();
      g.translate(xOf(Z0 + 30), yOf(Math.PI - 0.62));
      g.fillText("POCKET PUH AIR", 0, 0);
      g.restore();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    cache[k] = t;
    return t;
  };
})();

/** tail livery: an orange fin with a white fox-paw (the airline's logo) */
const finTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const g = c.getContext("2d")!;
    const gr = g.createLinearGradient(0, 512, 512, 0);
    gr.addColorStop(0, "#ff6a10");
    gr.addColorStop(1, "#ffa23a");
    g.fillStyle = gr;
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = "#ffffff";
    const paw = (x: number, y: number, s: number) => {
      g.beginPath();
      g.ellipse(x, y, 70 * s, 58 * s, 0, 0, Math.PI * 2);
      g.fill();
      for (const [dx, dy] of [
        [-78, -78],
        [-28, -112],
        [28, -112],
        [78, -78],
      ]) {
        g.beginPath();
        g.ellipse(x + dx * s, y + dy * s, 24 * s, 30 * s, 0, 0, Math.PI * 2);
        g.fill();
      }
    };
    paw(300, 330, 1.1);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

// ───────────────────────── geometry builders ─────────────────────────
const fuselageGeo = () => {
  const NZ = 220;
  const NA = 64;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= NZ; i++) {
    // denser at the nose and the tail cone
    const k = i / NZ;
    const z = Z0 + LENGTH * (k < 0.15 ? 0.15 * Math.pow(k / 0.15, 1.6) : k);
    for (let j = 0; j <= NA; j++) {
      const a = (j / NA) * Math.PI * 2;
      pos.push(...surf(z, a));
      uv.push((z - Z0) / LENGTH, 1 - j / NA);
    }
  }
  for (let i = 0; i < NZ; i++)
    for (let j = 0; j < NA; j++) {
      const a = i * (NA + 1) + j;
      const b = a + NA + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b); // outward normals
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

/** cambered airfoil (upper/lower), chord 1, thickness th; returns closed loop from TE over the top to TE */
const airfoil = (th: number, n = 22): [number, number][] => {
  const pts: [number, number][] = [];
  const yt = (x: number) => 5 * th * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1036 * x ** 4);
  const yc = (x: number) => 0.02 * Math.sin(Math.PI * x);
  for (let i = n; i >= 0; i--) {
    const x = 0.5 - 0.5 * Math.cos((i / n) * Math.PI);
    pts.push([x, yc(x) + yt(x)]);
  }
  for (let i = 1; i <= n; i++) {
    const x = 0.5 - 0.5 * Math.cos((i / n) * Math.PI);
    pts.push([x, yc(x) - yt(x)]);
  }
  return pts;
};

type Section = { x: number; y: number; z: number; chord: number; th: number };
/** loft airfoil sections spanning along X (each section's chord runs along +Z from its leading edge) */
const loftGeo = (secs: Section[], vertical = false) => {
  const foil = airfoil(1);
  const pos: number[] = [];
  const idx: number[] = [];
  const M = foil.length;
  secs.forEach((s) => {
    const f = airfoil(s.th);
    for (let j = 0; j < M; j++) {
      const [cx, cy] = f[j];
      if (vertical) pos.push(s.x + cy * s.chord, s.y, s.z + cx * s.chord);
      else pos.push(s.x, s.y + cy * s.chord, s.z + cx * s.chord);
    }
  });
  for (let i = 0; i < secs.length - 1; i++)
    for (let j = 0; j < M - 1; j++) {
      const a = i * M + j;
      const b = a + M;
      idx.push(a, b, a + 1, a + 1, b, b + 1); // outward normals (top surface up)
    }
  // tip cap
  const last = (secs.length - 1) * M;
  for (let j = 1; j < M - 1; j++) idx.push(last, last + j, last + j + 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

/** wing planform (right wing; mirror for the left): root at the fuselage side, 37.5° sweep, 7° dihedral */
const ROOT = { x: 2.6, y: -1.9, z: -9.5, chord: 16.5 };
const TIP = { x: SPAN / 2 - 0.4, chord: 4.1 };
export const wingAt = (x: number) => {
  const k = (x - ROOT.x) / (TIP.x - ROOT.x);
  const chord = ROOT.chord + (TIP.chord - ROOT.chord) * k + 2.6 * Math.max(0, 1 - k / 0.3) ** 2; // trailing-edge kink inboard
  const qc = ROOT.z + ROOT.chord * 0.25 + Math.tan((37.5 * Math.PI) / 180) * (x - ROOT.x);
  return { le: qc - chord * 0.25, chord, y: ROOT.y + Math.tan((7 * Math.PI) / 180) * (x - ROOT.x), th: 0.135 - 0.055 * k };
};
const wingGeo = () => {
  const secs: Section[] = [];
  for (let i = 0; i <= 24; i++) {
    const x = ROOT.x - 0.6 + ((TIP.x - ROOT.x + 0.6) * i) / 24;
    const w = wingAt(Math.max(ROOT.x, x));
    secs.push({ x, y: w.y, z: w.le, chord: w.chord, th: w.th });
  }
  return loftGeo(secs);
};
const winglet = () => {
  const w = wingAt(TIP.x);
  const secs: Section[] = [];
  for (let i = 0; i <= 6; i++) {
    const k = i / 6;
    secs.push({ x: TIP.x + 0.5 * k, y: w.y + 1.9 * k, z: w.le + 1.4 * k ** 1.2, chord: w.chord * (1 - 0.55 * k), th: 0.08 });
  }
  return loftGeo(secs);
};
const stabGeo = () => {
  const secs: Section[] = [];
  for (let i = 0; i <= 10; i++) {
    const k = i / 10;
    const x = 0.6 + 10.6 * k;
    secs.push({ x, y: 1.1 + Math.tan((7 * Math.PI) / 180) * x, z: 25 + Math.tan((37 * Math.PI) / 180) * x - 1.6 * k, chord: 8.5 - 5.8 * k, th: 0.1 });
  }
  return loftGeo(secs);
};
const finGeo = () => {
  // vertical: sections stacked up Y, chord along +Z
  const foil = airfoil(0.1);
  const pos: number[] = [];
  const idx: number[] = [];
  const M = foil.length;
  const N = 10;
  for (let i = 0; i <= N; i++) {
    const k = i / N;
    const y = 1.4 + 9.6 * k;
    const chord = 12 - 7.6 * k;
    const le = 22.5 + Math.tan((45 * Math.PI) / 180) * (9.6 * k);
    for (let j = 0; j < M; j++) pos.push(foil[j][1] * chord, y, le + foil[j][0] * chord);
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < M - 1; j++) {
      const a = i * M + j;
      const b = a + M;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const last = N * M;
  for (let j = 1; j < M - 1; j++) idx.push(last, last + j + 1, last + j);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // uv for the fin texture: (z, y) of the side
  const uv: number[] = [];
  for (let i = 0; i < pos.length; i += 3) uv.push((pos[i + 2] - 22.5) / 14, (pos[i + 1] - 1.4) / 9.6);
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
};
const nacelleGeo = () => {
  const pts = [
    [0.95, 0],
    [1.22, 0.05],
    [1.32, 0.35],
    [1.38, 1.4],
    [1.32, 3.0],
    [1.08, 4.6],
    [0.86, 5.4],
    [0.8, 5.42],
    [0.7, 5.5],
    [0.5, 6.4],
    [0.12, 7.2],
  ].map(([r, z]) => new THREE.Vector2(r, z));
  const g = new THREE.LatheGeometry(pts, 40);
  g.rotateX(Math.PI / 2); // lathe axis Y → Z (front at z = 0, back at +z)
  return g;
};
/** inner duct + fan face */
const ductGeo = () => {
  const g = new THREE.CylinderGeometry(0.96, 0.96, 1.2, 40, 1, true);
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, 0.6);
  return g;
};

/** engine stations (right wing): spanwise x */
export const ENGINES_X = [11.9, 21.1];
export const engineAt = (x: number): V3 => {
  const w = wingAt(x);
  return [x, w.y - 1.95, w.le - 3.4];
};

// ───────────────────────── parts ─────────────────────────
const Fan: React.FC<{ frame: number; spin: number }> = ({ frame, spin }) => {
  const blades = 22;
  const rot = frame * 0.9 * spin;
  return (
    <group position={[0, 0, 0.9]} rotation={[0, 0, rot]}>
      {Array.from({ length: blades }, (_, i) => (
        <group key={i} rotation={[0, 0, (i / blades) * Math.PI * 2]}>
          <mesh position={[0, 0.52, 0]} rotation={[0, 0.55, 0]}>
            <boxGeometry args={[0.035, 0.84, 0.34]} />
            <meshStandardMaterial color="#59616c" metalness={0.9} roughness={0.28} />
          </mesh>
        </group>
      ))}
      {/* spinner with a white swirl mark (shows the spin) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.1]}>
        <coneGeometry args={[0.34, 0.75, 32]} />
        <meshStandardMaterial color="#2b2f36" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0.12, 0.05, -0.28]} rotation={[0.3, 0.3, 0]}>
        <boxGeometry args={[0.04, 0.22, 0.04]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

const Engine: React.FC<{ p: V3; frame: number; skin: THREE.Material; spin: number }> = ({ p, frame, skin, spin }) => {
  const g = useMemo(() => ({ nac: nacelleGeo(), duct: ductGeo() }), []);
  return (
    <group position={p}>
      <mesh geometry={g.nac} material={skin} castShadow receiveShadow />
      <mesh geometry={g.duct}>
        <meshStandardMaterial color="#20242a" side={THREE.BackSide} roughness={0.6} />
      </mesh>
      <Fan frame={frame} spin={spin} />
      {/* inlet lip: polished */}
      <mesh position={[0, 0, 0.03]}>
        <torusGeometry args={[1.08, 0.13, 12, 40]} />
        <meshStandardMaterial color="#d9dde2" metalness={1} roughness={0.15} />
      </mesh>
      {/* pylon up to the wing */}
      <mesh position={[0, 1.45, 2.6]} material={skin} castShadow>
        <boxGeometry args={[0.42, 1.5, 5.2]} />
      </mesh>
    </group>
  );
};

const Wheel: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.62, 0.62, 0.42, 24]} />
      <meshStandardMaterial color="#1b1c1f" roughness={0.85} />
    </mesh>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.34, 0.34, 0.44, 16]} />
      <meshStandardMaterial color="#9aa1aa" metalness={0.8} roughness={0.35} />
    </mesh>
  </group>
);
const Bogie: React.FC<{ p: V3; strut: number }> = ({ p, strut }) => (
  <group position={p}>
    <mesh position={[0, strut / 2, 0]}>
      <cylinderGeometry args={[0.16, 0.16, strut, 12]} />
      <meshStandardMaterial color="#c9ced5" metalness={0.9} roughness={0.25} />
    </mesh>
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.22, 0.22, 2.6]} />
      <meshStandardMaterial color="#8a9099" metalness={0.8} roughness={0.35} />
    </mesh>
    {[-0.36, 0.36].map((x) => [-0.95, 0.95].map((z) => <Wheel key={`${x}${z}`} p={[x, 0, z]} />))}
  </group>
);
const Gear: React.FC = () => {
  const gy = GEAR_Y + 0.62;
  return (
    <group>
      {/* nose gear: two wheels */}
      <group position={[0, gy, Z0 + 7.5]}>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 3.2, 12]} />
          <meshStandardMaterial color="#c9ced5" metalness={0.9} roughness={0.25} />
        </mesh>
        <Wheel p={[-0.3, 0, 0]} />
        <Wheel p={[0.3, 0, 0]} />
      </group>
      {/* body gear + wing gear: four 4-wheel bogies */}
      {[-1.6, 1.6].map((x) => (
        <Bogie key={`b${x}`} p={[x, gy, 3.8]} strut={3.4} />
      ))}
      {[-5.2, 5.2].map((x) => (
        <Bogie key={`w${x}`} p={[x, gy, 1.2]} strut={4.0} />
      ))}
    </group>
  );
};

/** skeleton under the skin: frames (rings) every 1.2 m and stringers */
const Skeleton: React.FC<{ from: number }> = ({ from }) => {
  const g = useMemo(() => {
    const ring = new THREE.TorusGeometry(1, 0.045, 6, 48);
    return { ring };
  }, []);
  const rings: { z: number; r: number; yc: number; hump: number }[] = [];
  for (let z = Z0 + 2; z < LENGTH / 2 - 1; z += 1.2) rings.push({ z, ...body(z) });
  return (
    <group>
      {rings
        .filter((q) => q.z >= from - 0.6)
        .map((q, i) => (
          <mesh key={i} geometry={g.ring} position={[0, q.yc + q.hump * 0.35, q.z]} scale={[q.r * 0.985, q.r * 1.02 + q.hump * 0.45, 1]}>
            <meshStandardMaterial color="#7e8792" metalness={0.8} roughness={0.4} />
          </mesh>
        ))}
      {Array.from({ length: 14 }, (_, j) => {
        const a = (j / 14) * Math.PI * 2;
        const pts: THREE.Vector3[] = [];
        for (let z = Math.max(from, Z0 + 3); z < LENGTH / 2 - 1.5; z += 1) {
          const s = surf(z, a);
          pts.push(new THREE.Vector3(s[0] * 0.98, s[1], s[2]));
        }
        if (pts.length < 2) return null;
        const curve = new THREE.CatmullRomCurve3(pts);
        return (
          <mesh key={j}>
            <tubeGeometry args={[curve, Math.max(2, pts.length), 0.035, 4]} />
            <meshStandardMaterial color="#8e97a2" metalness={0.8} roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
};

export const Airliner: React.FC<{
  frame: number;
  wings?: number;
  skin?: number;
  engines?: number;
  tail?: number;
  paint?: number;
  ghost?: number;
  gear?: boolean;
  spin?: number;
  lights?: boolean;
  children?: React.ReactNode;
}> = ({ frame, wings = 1, skin = 1, engines = 1, tail = 1, paint = 1, ghost = 0, gear = false, spin = 1, lights = false, children }) => {
  const geo = useMemo(() => ({ fus: fuselageGeo(), wing: wingGeo(), let: winglet(), stab: stabGeo(), fin: finGeo() }), []);
  const painted = paint > 0.5;
  const glass = ghost > 0.01;
  const mats = useMemo(
    () => ({
      bodyP: new THREE.MeshPhysicalMaterial({ map: liveryTex(true), metalness: 0.15, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
      bodyA: new THREE.MeshStandardMaterial({ map: liveryTex(false), metalness: 0.85, roughness: 0.32 }),
      wingP: new THREE.MeshStandardMaterial({ color: "#d9dee4", metalness: 0.5, roughness: 0.35 }),
      wingA: new THREE.MeshStandardMaterial({ color: "#c7ccd3", metalness: 0.85, roughness: 0.3 }),
      nacP: new THREE.MeshPhysicalMaterial({ color: "#f2f4f6", metalness: 0.2, roughness: 0.3, clearcoat: 0.5 }),
      fin: new THREE.MeshPhysicalMaterial({ map: finTex(), metalness: 0.15, roughness: 0.32, clearcoat: 0.6, side: THREE.DoubleSide }),
    }),
    [],
  );
  const bodyM = painted ? mats.bodyP : mats.bodyA;
  bodyM.transparent = glass;
  bodyM.opacity = 1 - 0.85 * ghost;
  bodyM.depthWrite = !glass;
  const wingM = painted ? mats.wingP : mats.wingA;
  // the fin goes see-through with the body (the black box sits under it)
  mats.fin.transparent = glass;
  mats.fin.opacity = 1 - 0.8 * ghost;
  mats.fin.depthWrite = !glass;
  const nacM = painted ? mats.nacP : mats.wingA;
  // skin covers the frame from the nose: clip with a plane at z = skinZ (local)
  const skinZ = Z0 + (LENGTH + 0.5) * skin;
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), []);
  clip.constant = skinZ;
  bodyM.clippingPlanes = skin < 1 ? [clip] : null;
  const blink = frame % 36 < 3;
  return (
    <group>
      {skin < 1 ? <Skeleton from={skinZ} /> : null}
      {skin > 0 ? <mesh geometry={geo.fus} material={bodyM} castShadow receiveShadow /> : null}
      {wings > 0.001
        ? [1, -1].map((m) => (
            <group key={m} scale={[m * Math.max(0.001, wings), 1, 1]}>
              <mesh geometry={geo.wing} material={wingM} castShadow receiveShadow />
              {wings > 0.98 ? <mesh geometry={geo.let} material={wingM} castShadow /> : null}
            </group>
          ))
        : null}
      {engines > 0.001
        ? [1, -1].map((m) =>
            ENGINES_X.map((x, i) => {
              const p = engineAt(x);
              const k = THREE.MathUtils.clamp(engines * 2 - i * 0.6, 0, 1);
              if (k <= 0) return null;
              return (
                <group key={`${m}${i}`} position={[m * p[0], p[1] - 6 * (1 - k) ** 2, p[2]]}>
                  <Engine p={[0, 0, 0]} frame={frame + i * 7} skin={nacM} spin={spin} />
                </group>
              );
            }),
          )
        : null}
      {tail > 0.001 ? (
        <group scale={[1, Math.max(0.001, tail), 1]} position={[0, 0, 0]}>
          <mesh geometry={geo.fin} material={painted ? mats.fin : mats.wingA} castShadow />
          {[1, -1].map((m) => (
            <mesh key={m} geometry={geo.stab} material={wingM} scale={[m, 1, 1]} castShadow />
          ))}
        </group>
      ) : null}
      {gear ? <Gear /> : null}
      {lights ? (
        <>
          <Glow position={[-(TIP.x + 0.3), wingAt(TIP.x).y, wingAt(TIP.x).le + 1]} size={blink ? 6 : 2.2} color="#ff3030" opacity={0.95} />
          <Glow position={[TIP.x + 0.3, wingAt(TIP.x).y, wingAt(TIP.x).le + 1]} size={blink ? 6 : 2.2} color="#30ff70" opacity={0.95} />
          <Glow position={[0, R + 1.2, 5]} size={blink ? 7 : 0.01} color="#ff4040" opacity={0.9} />
        </>
      ) : null}
      {children}
    </group>
  );
};

/** the static wicks on the wing trailing edge (where lightning leaves the plane): small rods, right wing */
export const WICKS: V3[] = [0.55, 0.7, 0.85, 0.97].map((k) => {
  const x = ROOT.x + (TIP.x - ROOT.x) * k;
  const w = wingAt(x);
  return [x, w.y, w.le + w.chord + 0.3];
});
export const StaticWicks: React.FC<{ glow?: number }> = ({ glow = 0 }) => (
  <>
    {[1, -1].map((m) =>
      WICKS.map((p, i) => (
        <group key={`${m}${i}`} position={[m * p[0], p[1], p[2]]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          {glow > 0.01 ? <Glow position={[0, 0, 0.4]} size={3 * glow} color="#bfe6ff" opacity={glow} /> : null}
        </group>
      )),
    )}
  </>
);
