import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, TubePath, V3 } from "../../lib/three/core";
import { seeded } from "../../lib/timing";

/** Half-width (x, z) of a tomb at height y, in metres. */
export type Profile = { h: number; hw: (y: number) => [number, number] };

// Real dimensions (brief.md facts 1, 8, 9).
export const GREAT: Profile = { h: 146.6, hw: (y) => [115.15 * (1 - y / 146.6), 115.15 * (1 - y / 146.6)] };
const BENT_BREAK = 47;
const bentLow = (y: number) => 94.7 - y / Math.tan((54.5 * Math.PI) / 180);
export const BENT: Profile = {
  h: 104.6,
  hw: (y) => {
    const w = y < BENT_BREAK ? bentLow(y) : bentLow(BENT_BREAK) - (y - BENT_BREAK) / Math.tan((43.3 * Math.PI) / 180);
    return [Math.max(0, w), Math.max(0, w)];
  },
};
/** Djoser: six steps on a 121 × 109 m base, 62.5 m tall; each step leans in a little. */
export const STEP: Profile = {
  h: 62.5,
  hw: (y) => {
    const k = Math.min(5, Math.floor(y / (62.5 / 6)));
    const lean = (y - k * (62.5 / 6)) * 0.18;
    return [60.5 - k * 8.4 - lean, 54.5 - k * 8.4 - lean];
  },
};
/** A mastaba: a flat "bench" of stone, 44 × 22 m, 7 m tall, walls at about 75°. */
export const MASTABA: Profile = { h: 7, hw: (y) => [22 - y * 0.27, 11 - y * 0.27] };

/** Core limestone: rows of rough blocks with dark joints (4 blocks × 4 courses per tile, varied widths and tones). */
const coreTex = (() => {
  const cache: Record<string, THREE.Texture> = {};
  return (tone: string) => {
    if (cache[tone]) return cache[tone];
    const S = 512;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    const base = new THREE.Color(tone);
    const r = seeded(13);
    for (let row = 0; row < 4; row++) {
      let x = -r() * 60;
      while (x < S) {
        const w = 90 + r() * 80;
        const k = 0.85 + r() * 0.25;
        const col = base.clone().multiplyScalar(k);
        g.fillStyle = `#${col.getHexString()}`;
        g.fillRect(x, row * 128, w, 128);
        // pits and grain
        for (let i = 0; i < 70; i++) {
          g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)";
          g.fillRect(x + r() * w, row * 128 + r() * 128, 2 + r() * 6, 2 + r() * 4);
        }
        g.strokeStyle = "rgba(60,40,20,0.75)";
        g.lineWidth = 5;
        g.strokeRect(x, row * 128, w, 128);
        // worn edge highlight
        g.strokeStyle = "rgba(255,240,210,0.25)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x + 4, row * 128 + 4);
        g.lineTo(x + w - 4, row * 128 + 4);
        g.stroke();
        x += w;
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    cache[tone] = t;
    return t;
  };
})();

/** Polished white Tura casing: almost seamless, with faint joints. */
const casingTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const S = 512;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f2ece0";
    g.fillRect(0, 0, S, S);
    const r = seeded(4);
    for (let row = 0; row < 4; row++) {
      let x = -r() * 80;
      while (x < S) {
        const w = 120 + r() * 120;
        const v = 236 + Math.floor(r() * 14);
        g.fillStyle = `rgb(${v},${v - 5},${v - 16})`;
        g.fillRect(x, row * 128, w, 128);
        g.strokeStyle = "rgba(150,130,100,0.35)";
        g.lineWidth = 2;
        g.strokeRect(x, row * 128, w, 128);
        x += w;
      }
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
})();

type Geo = { pos: number[]; uv: number[]; nor: number[] };
const quad = (g: Geo, a: V3, b: V3, c: V3, d: V3, ua: [number, number], ub: [number, number], uc: [number, number], ud: [number, number]) => {
  const n = new THREE.Vector3().subVectors(new THREE.Vector3(...b), new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...d), new THREE.Vector3(...a))).normalize();
  for (const [p, u] of [
    [a, ua],
    [b, ub],
    [c, uc],
    [a, ua],
    [c, uc],
    [d, ud],
  ] as [V3, [number, number]][]) {
    g.pos.push(...p);
    g.uv.push(...u);
    g.nor.push(n.x, n.y, n.z);
  }
};

/** A box course with world-scaled UVs (1 texture tile = 4 blocks × 4 courses). Sides + top. */
const course = (g: Geo, hx: number, hz: number, y0: number, y1: number, tile: number, x0 = -hx) => {
  const U = (s: number) => s / (tile * 4);
  const V = (y: number) => y / ((y1 - y0) * 4);
  const sides: [V3, V3, number][] = [
    [[x0, 0, hz], [hx, 0, hz], hx - x0],
    [[hx, 0, hz], [hx, 0, -hz], 2 * hz],
    [[hx, 0, -hz], [x0, 0, -hz], hx - x0],
    [[x0, 0, -hz], [x0, 0, hz], 2 * hz],
  ];
  sides.forEach(([a, b, len], i) => {
    const off = i * 0.37;
    quad(g, [a[0], y0, a[2]], [b[0], y0, b[2]], [b[0], y1, b[2]], [a[0], y1, a[2]], [off, V(y0)], [off + U(len), V(y0)], [off + U(len), V(y1)], [off, V(y1)]);
  });
  quad(g, [x0, y1, hz], [hx, y1, hz], [hx, y1, -hz], [x0, y1, -hz], [U(x0), U(hz)], [U(hx), U(hz)], [U(hx), U(-hz)], [U(x0), U(-hz)]);
};

const VERTS_PER_COURSE = 30;

/**
 * A tomb built from stepped courses of blocks. `built` 0–1 is how far it has risen (the newest course drops in);
 * `casing` 0–1 covers it in polished white stone from the bottom up; `xray` 0–1 makes the stone glassy.
 */
/** `cut` builds only the half at x ≥ 0, so the section through the middle faces the camera at −x (a doll's-house cut). */
export const Tomb: React.FC<{ prof: Profile; courseH?: number; built?: number; casing?: number; xray?: number; tone?: string; casingColor?: string; drop?: number; cast?: boolean; cut?: boolean }> = ({
  prof,
  courseH = 1.5,
  built = 1,
  casing = 0,
  xray = 0,
  tone = "#d9bf92",
  casingColor = "#fffaf0",
  drop = 6,
  cast = true,
  cut = false,
}) => {
  const n = Math.ceil(prof.h / courseH);
  const { coreGeo, dropGeo, caseGeo, bands } = useMemo(() => {
    const g: Geo = { pos: [], uv: [], nor: [] };
    for (let i = 0; i < n; i++) {
      const y0 = i * courseH;
      const y1 = Math.min(prof.h, y0 + courseH);
      const [hx, hz] = prof.hw((y0 + y1) / 2);
      const w = Math.max(0.6, hx);
      course(g, w, Math.max(0.6, hz), y0, y1, 1.6, cut ? 0 : -w);
    }
    const mk = () => {
      const b = new THREE.BufferGeometry();
      b.setAttribute("position", pos);
      b.setAttribute("uv", uv);
      b.setAttribute("normal", nor);
      return b;
    };
    const pos = new THREE.Float32BufferAttribute(g.pos, 3);
    const uv = new THREE.Float32BufferAttribute(g.uv, 2);
    const nor = new THREE.Float32BufferAttribute(g.nor, 3);
    const coreGeo = mk();
    const dropGeo = mk();
    coreGeo.computeBoundingSphere();
    dropGeo.boundingSphere = coreGeo.boundingSphere;
    // casing: smooth bands following the profile, slightly outside the courses
    const c: Geo = { pos: [], uv: [], nor: [] };
    const bands = 60;
    for (let i = 0; i < bands; i++) {
      const y0 = (i / bands) * prof.h;
      const y1 = ((i + 1) / bands) * prof.h;
      const [ax, az] = prof.hw(y0).map((v) => v + 0.35);
      const [bx, bz] = prof.hw(y1).map((v) => (i === bands - 1 ? 0 : v + 0.35));
      const V = (y: number) => y / 12;
      const faces: [V3, V3, V3, V3][] = [
        [[-ax, y0, az], [ax, y0, az], [bx, y1, bz], [-bx, y1, bz]],
        [[ax, y0, az], [ax, y0, -az], [bx, y1, -bz], [bx, y1, bz]],
        [[ax, y0, -az], [-ax, y0, -az], [-bx, y1, -bz], [bx, y1, -bz]],
        [[-ax, y0, -az], [-ax, y0, az], [-bx, y1, bz], [-bx, y1, -bz]],
      ];
      faces.forEach(([a, b, cc, d]) => {
        const w0 = Math.hypot(b[0] - a[0], b[2] - a[2]) / 12;
        const w1 = Math.hypot(cc[0] - d[0], cc[2] - d[2]) / 12;
        quad(c, a, b, cc, d, [-w0 / 2, V(y0)], [w0 / 2, V(y0)], [w1 / 2, V(y1)], [-w1 / 2, V(y1)]);
      });
    }
    const caseGeo = new THREE.BufferGeometry();
    caseGeo.setAttribute("position", new THREE.Float32BufferAttribute(c.pos, 3));
    caseGeo.setAttribute("uv", new THREE.Float32BufferAttribute(c.uv, 2));
    caseGeo.setAttribute("normal", new THREE.Float32BufferAttribute(c.nor, 3));
    caseGeo.computeBoundingSphere();
    return { coreGeo, dropGeo, caseGeo, bands };
  }, [prof, courseH, n, cut]);

  const rows = built * n;
  const done = Math.floor(rows);
  const frac = rows - done;
  coreGeo.setDrawRange(0, done * VERTS_PER_COURSE);
  const falling = done < n && frac > 0;
  dropGeo.setDrawRange(done * VERTS_PER_COURSE, falling ? VERTS_PER_COURSE : 0);
  const fallK = 1 - Math.pow(Math.min(1, frac * 1.6), 2);
  const shownBands = cut ? 0 : Math.round(casing * bands);
  caseGeo.setDrawRange(0, shownBands * 24);
  const glass = xray > 0.01;
  const map = coreTex(tone);
  return (
    <group>
      <mesh geometry={coreGeo} castShadow={cast && !glass} receiveShadow>
        <meshStandardMaterial key={glass ? "g" : "o"} map={map} roughness={0.92} transparent={glass} opacity={1 - 0.86 * xray} depthWrite={!glass} />
      </mesh>
      {falling ? (
        <mesh geometry={dropGeo} position={[0, fallK * drop, 0]} castShadow={cast && !glass} receiveShadow>
          <meshStandardMaterial key={glass ? "g" : "o"} map={map} roughness={0.92} transparent={glass} opacity={(1 - 0.86 * xray) * Math.min(1, frac * 4)} depthWrite={!glass} />
        </mesh>
      ) : null}
      {shownBands > 0 ? (
        <mesh geometry={caseGeo} castShadow={cast && !glass} receiveShadow>
          <meshStandardMaterial key={glass ? "g" : "o"} map={casingTex()} roughness={0.32} metalness={0.02} color={casingColor} transparent={glass} opacity={1 - 0.9 * xray} depthWrite={!glass} side={THREE.DoubleSide} />
        </mesh>
      ) : null}
    </group>
  );
};

// ───────────────────────── inside the Great Pyramid (section in the x = 0 plane, approximate real positions) ─────────────────────────
const D26 = (26.5 * Math.PI) / 180;
const ENTRANCE: V3 = [0, 16.8, -101.95];
const alongDesc = (d: number): V3 => [0, ENTRANCE[1] - d * Math.sin(D26), ENTRANCE[2] + d * Math.cos(D26)];
const JUNCTION = alongDesc(28.2);
const A26 = (26 * Math.PI) / 180;
const alongAsc = (d: number): V3 => [0, JUNCTION[1] + d * Math.sin(A26), JUNCTION[2] + d * Math.cos(A26)];
const GALLERY0 = alongAsc(39);
const GALLERY1: V3 = [0, GALLERY0[1] + 46.7 * Math.sin(A26), GALLERY0[2] + 46.7 * Math.cos(A26)];
export const KINGS: V3 = [0, 45.9, 6];
export const QUEENS: V3 = [0, 24.4, -0.4];
export const VOID_C: V3 = [0, 50, -20];
export const ROBBER_IN: V3 = [0, 7, -109.6];
export const ENTRANCE_P = ENTRANCE;
/** the robbers' tunnel: in at the north face, then around the granite plugs into the ascending passage */
export const ROBBER_PATH: V3[] = [ROBBER_IN, [0, 7, -96], [0, 7.2, -84], [0.8, 8.6, -78], [1.2, 11, -73], [0.6, 10.4, -68.6], alongAsc(9)];
export const PLUGS: V3[] = [0.9, 2.6, 4.3].map((d) => alongAsc(d));

/** the section face is the plane x = 0; passages are drawn as glowing strips just in front of it */
const FLAT_X = -0.25;
/** A slab between two points (a passage, a gallery), w wide and h tall, its floor on the line. */
const Shaft: React.FC<{ a: V3; b: V3; w: number; h: number; color: string; o: number; glow?: number }> = ({ a, b, w, h, color, o, glow = 0.6 }) => {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const ang = Math.atan2(B.y - A.y, B.z - A.z);
  return (
    <mesh position={[FLAT_X, mid.y + h / 2, mid.z]} rotation={[-ang, 0, 0]}>
      <boxGeometry args={[0.3, h, len]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} transparent={o < 0.99} opacity={o} />
    </mesh>
  );
};
const Room: React.FC<{ c: V3; s: V3; color: string; o: number; glow?: number }> = ({ c, s, color, o, glow = 0.6 }) => (
  <mesh position={[FLAT_X, c[1], c[2]]}>
    <boxGeometry args={[0.3, s[1], s[2]]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} transparent={o < 0.99} opacity={o} />
  </mesh>
);

/**
 * Passages and chambers. `o` overall opacity; `plugs` shows the red granite plugs; `robbers` 0–1 digs the tunnel;
 * `void` 0–1 lights up the Big Void (found 2017) above the Grand Gallery; `pocket` shows the pocket puh's sarcophagus glow.
 */
export const Chambers: React.FC<{ o: number; plugs?: number; robbers?: number; voidK?: number; pocket?: number }> = ({ o, plugs = 0, robbers = 0, voidK = 0, pocket = 0 }) => {
  if (o < 0.01) return null;
  const pass = "#ffd28a";
  return (
    <group>
      <Shaft a={ENTRANCE} b={alongDesc(105)} w={1.05} h={1.2} color={pass} o={0.9 * o} />
      <Room c={[0, -28.5, -0.9]} s={[8.4, 3.5, 14]} color={pass} o={0.7 * o} />
      <Shaft a={JUNCTION} b={GALLERY0} w={1.05} h={1.2} color={pass} o={0.9 * o} />
      <Shaft a={GALLERY0} b={GALLERY1} w={2.1} h={8.6} color="#ffe2a8" o={0.75 * o} />
      <Shaft a={GALLERY0} b={[0, GALLERY0[1], -2.9]} w={1.05} h={1.15} color={pass} o={0.9 * o} />
      <Room c={QUEENS} s={[5.8, 6.2, 5.2]} color={pass} o={0.75 * o} />
      <Room c={[0, 43 + 1.8, 1.9]} s={[1.6, 3.6, 3]} color={pass} o={0.8 * o} />
      <Room c={KINGS} s={[10.5, 5.8, 5.2]} color="#ffb85a" o={0.85 * o} glow={0.8 + 0.6 * pocket} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Room key={i} c={[0, 50.2 + i * 3.1, 6]} s={[10.5, 1.2, 5.2]} color="#e8c890" o={0.45 * o} />
      ))}
      {/* the granite plugs, up to 25 t each */}
      {plugs > 0.01
        ? PLUGS.map((p, i) => (
            <mesh key={i} position={[FLAT_X - 0.1, p[1] + 0.6, p[2]]} rotation={[-A26, 0, 0]}>
              <boxGeometry args={[0.35, 1.3, 1.6]} />
              <meshStandardMaterial color="#e2483a" emissive="#ff4030" emissiveIntensity={1.2} transparent={plugs < 0.99} opacity={plugs * o} />
            </mesh>
          ))
        : null}
      {robbers > 0.001 ? <TubePath points={ROBBER_PATH.map((p) => new THREE.Vector3(FLAT_X - 0.6, p[1] + 0.7, p[2]))} progress={robbers} radius={0.7} color="#ff8a3a" /> : null}
      {voidK > 0.001 ? (
        <group>
          <Shaft a={[0, 43, -36]} b={[0, 53, -5]} w={2.2} h={6.5} color="#7af0ff" o={0.85 * voidK * o} glow={1.4} />
          <Glow position={[-2, 51, -20]} size={40 * voidK} color="#7af0ff" opacity={0.6 * voidK} />
        </group>
      ) : null}
      {pocket > 0.01 ? <Glow position={[KINGS[0], KINGS[1], KINGS[2]]} size={22 * pocket} color="#ffcf6a" opacity={0.8 * pocket} /> : null}
    </group>
  );
};

/** Three ramp theories as glowing paths: straight (from the south), zigzag (on the east face), spiral (around all faces). */
export const RampTheories: React.FC<{ straight: number; zigzag: number; spiral: number }> = ({ straight, zigzag, spiral }) => {
  const paths = useMemo(() => {
    const out = (y: number) => GREAT.hw(y)[0] + 3;
    const s: THREE.Vector3[] = [new THREE.Vector3(0, 0, 520), new THREE.Vector3(0, 80, out(80))];
    const z: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const y = i * 15;
      const w = out(y) * 0.85;
      z.push(new THREE.Vector3(out(y), y, i % 2 ? -w : w));
    }
    const sp: THREE.Vector3[] = [];
    const corners: [number, number][] = [
      [1, 1],
      [1, -1],
      [-1, -1],
      [-1, 1],
    ];
    for (let k = 0; k <= 16; k++) {
      const y = k * 8.4;
      const w = out(y);
      const [cx, cz] = corners[k % 4];
      sp.push(new THREE.Vector3(cx * w, y, cz * w));
    }
    return { s, z, sp };
  }, []);
  return (
    <group>
      {straight > 0.001 ? <TubePath points={paths.s} progress={straight} radius={5} color="#ff9a3a" /> : null}
      {zigzag > 0.001 ? <TubePath points={paths.z} progress={zigzag} radius={4} color="#5ad2ff" /> : null}
      {spiral > 0.001 ? <TubePath points={paths.sp} progress={spiral} radius={4} color="#c78bff" /> : null}
    </group>
  );
};
