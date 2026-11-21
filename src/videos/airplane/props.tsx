import React, { useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Glow, V3 } from "../../lib/three/core";
import { seeded } from "../../lib/timing";

// ───────────────────────── Wright Flyer (1903), real size ─────────────────────────
/**
 * Span 12.3 m, chord 1.98 m, wing gap 1.83 m, length 6.4 m. Nose (the canard elevator) to −Z, sits on its skids at y = 0.
 * Muslin wings with spruce ribs, two pusher propellers behind the wings (counter-rotating), rudders at the back.
 */
const muslinTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#e9dfc6";
    g.fillRect(0, 0, 1024, 256);
    const r = seeded(4);
    for (let i = 0; i < 3000; i++) {
      g.fillStyle = `rgba(150,130,90,${r() * 0.08})`;
      g.fillRect(r() * 1024, r() * 256, 2, 1);
    }
    // ribs every ~30 cm (40 across the span)
    for (let i = 0; i <= 40; i++) {
      const x = (i / 40) * 1024;
      g.fillStyle = "rgba(120,92,58,0.55)";
      g.fillRect(x - 2, 0, 4, 256);
    }
    g.fillStyle = "rgba(110,84,50,0.7)";
    g.fillRect(0, 0, 1024, 10);
    g.fillRect(0, 246, 1024, 10);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();
const cambered = (span: number, chord: number, camber: number) => {
  const g = new THREE.PlaneGeometry(span, chord, 40, 8);
  g.rotateX(-Math.PI / 2);
  const pa = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pa.count; i++) {
    const z = pa.getZ(i) / chord + 0.5; // 0 front → 1 back
    const x = pa.getX(i) / (span / 2);
    pa.setY(i, camber * Math.sin(Math.PI * z) * (1 - 0.15 * x * x) - 0.04 * Math.abs(x) ** 3 * 0); // no wing warp at rest
  }
  g.computeVertexNormals();
  return g;
};
const Stick: React.FC<{ a: V3; b: V3; r?: number; color?: string }> = ({ a, b, r = 0.025, color = "#8a5a30" }) => {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const len = va.distanceTo(vb);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return (
    <mesh position={mid} quaternion={q} castShadow>
      <cylinderGeometry args={[r, r, len, 6]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
};
export const WrightFlyer: React.FC<{ t: number; spin?: number; pilot?: React.ReactNode }> = ({ t, spin = 1, pilot }) => {
  const geo = useMemo(() => ({ wing: cambered(12.3, 1.98, 0.09), elev: cambered(4.4, 0.9, 0.05) }), []);
  const cloth = useMemo(() => new THREE.MeshStandardMaterial({ map: muslinTex(), roughness: 0.9, side: THREE.DoubleSide }), []);
  const yL = 0.75;
  const yU = yL + 1.83;
  const struts = [-5.6, -4.2, -2.8, -1.4, 1.4, 2.8, 4.2, 5.6, -0.4, 0.4];
  return (
    <group>
      {/* the two wings */}
      <mesh geometry={geo.wing} material={cloth} position={[0, yL, 0]} castShadow receiveShadow />
      <mesh geometry={geo.wing} material={cloth} position={[0, yU, 0]} castShadow receiveShadow />
      {/* struts + cross wires */}
      {struts.map((x) =>
        [-0.85, 0.85].map((z) => <Stick key={`${x}${z}`} a={[x, yL, z]} b={[x, yU, z]} r={0.03} />),
      )}
      {[-5.6, -2.8, 2.8].map((x) => (
        <React.Fragment key={x}>
          <Stick a={[x, yL, 0.85]} b={[x + 1.4 * Math.sign(x || 1), yU, 0.85]} r={0.006} color="#555" />
          <Stick a={[x, yU, 0.85]} b={[x + 1.4 * Math.sign(x || 1), yL, 0.85]} r={0.006} color="#555" />
        </React.Fragment>
      ))}
      {/* skids + outriggers to the canard elevator in front */}
      {[-0.4, 0.4].map((x) => (
        <React.Fragment key={x}>
          <Stick a={[x, 0.05, 1.2]} b={[x, 0.05, -2.6]} r={0.04} />
          <Stick a={[x, 0.05, -2.6]} b={[x, 0.75, -3.4]} r={0.035} />
          <Stick a={[x, yL, -0.9]} b={[x, 0.95, -3.1]} r={0.03} />
          <Stick a={[x, yU, -0.9]} b={[x, 1.75, -3.2]} r={0.03} />
        </React.Fragment>
      ))}
      <mesh geometry={geo.elev} material={cloth} position={[0, 0.95, -3.25]} castShadow />
      <mesh geometry={geo.elev} material={cloth} position={[0, 1.6, -3.25]} castShadow />
      {/* rudders at the back */}
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} material={cloth} position={[x, 1.6, 3.0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <planeGeometry args={[0.65, 1.8]} />
        </mesh>
      ))}
      {[-0.4, 0.4].map((x) => (
        <React.Fragment key={`r${x}`}>
          <Stick a={[x, yL, 0.9]} b={[x * 0.75, 1.0, 2.75]} r={0.025} />
          <Stick a={[x, yU, 0.9]} b={[x * 0.75, 2.3, 2.75]} r={0.025} />
        </React.Fragment>
      ))}
      {/* engine (right of centre) and chain drive */}
      <mesh position={[0.6, yL + 0.3, 0.1]} castShadow>
        <boxGeometry args={[0.5, 0.45, 0.7]} />
        <meshStandardMaterial color="#3b3a38" metalness={0.7} roughness={0.45} />
      </mesh>
      {/* propellers: 2.6 m, behind the wings, counter-rotating */}
      {[-1.75, 1.75].map((x, i) => (
        <group key={x} position={[x, 1.65, 1.35]} rotation={[0, 0, (i ? -1 : 1) * t * 24 * spin]}>
          {[0, Math.PI].map((a) => (
            <mesh key={a} rotation={[0, 0.25, a]} position={[0, 0, 0]}>
              <boxGeometry args={[0.16, 2.6, 0.04]} />
              <meshStandardMaterial color="#7a4e28" roughness={0.6} />
            </mesh>
          ))}
          {spin > 0.5 ? (
            <mesh>
              <circleGeometry args={[1.3, 32]} />
              <meshBasicMaterial color="#d9c9a6" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          ) : null}
        </group>
      ))}
      {pilot}
    </group>
  );
};

/** The wooden launch rail (60 ft · 18 m) on the sand. */
export const LaunchRail: React.FC<{ p?: V3 }> = ({ p = [0, 0, 0] }) => (
  <group position={p}>
    <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.12, 0.16, 18.3]} />
      <meshStandardMaterial color="#8a6a44" roughness={0.85} />
    </mesh>
    <mesh position={[0, 0.17, 0]}>
      <boxGeometry args={[0.05, 0.02, 18.3]} />
      <meshStandardMaterial color="#9aa0a6" metalness={0.8} roughness={0.4} />
    </mesh>
  </group>
);

// ───────────────────────── cabin (economy, 3-4-3) ─────────────────────────
/** Window view: sky above a bright cloud deck (drawn once). */
const windowViewTex = (() => {
  const cache: Record<string, THREE.Texture> = {};
  return (night: boolean) => {
    const k = night ? "n" : "d";
    if (cache[k]) return cache[k];
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 192;
    const g = c.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 192);
    if (night) {
      gr.addColorStop(0, "#050a1e");
      gr.addColorStop(1, "#1b2440");
    } else {
      gr.addColorStop(0, "#2f6fc6");
      gr.addColorStop(0.55, "#bcd8f0");
      gr.addColorStop(0.62, "#ffffff");
      gr.addColorStop(1, "#e8eef4");
    }
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 192);
    cache[k] = new THREE.CanvasTexture(c);
    cache[k].colorSpace = THREE.SRGBColorSpace;
    return cache[k];
  };
})();
const SEAT_PITCH = 0.81; // 32 in
export const SEAT_X = [-2.45, -1.95, -1.45, -0.75, -0.25, 0.25, 0.75, 1.45, 1.95, 2.45];
/** one economy seat (facing −Z), seat cushion at y = 0.45 */
export const Seat: React.FC<{ p: V3; color?: string; screen?: THREE.Texture | null }> = ({ p, color = "#1f3f7a", screen }) => {
  const geo = useMemo(() => ({ back: new RoundedBoxGeometry(0.46, 0.78, 0.12, 3, 0.04), cush: new RoundedBoxGeometry(0.46, 0.12, 0.48, 3, 0.04) }), []);
  return (
    <group position={p}>
      <mesh geometry={geo.cush} position={[0, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh geometry={geo.back} position={[0, 0.88, 0.25]} rotation={[0.12, 0, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* headrest cover */}
      <mesh position={[0, 1.18, 0.29]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.4, 0.16, 0.13]} />
        <meshStandardMaterial color="#e9edf2" roughness={0.9} />
      </mesh>
      {/* seat-back screen (seen by the row behind) */}
      <mesh position={[0, 0.98, 0.338]} rotation={[0.12, 0, 0]}>
        <planeGeometry args={[0.26, 0.17]} />
        {screen ? <meshBasicMaterial map={screen} toneMapped={false} /> : <meshStandardMaterial color="#101418" roughness={0.3} />}
      </mesh>
      {/* armrests and legs */}
      {[-0.25, 0.25].map((x) => (
        <mesh key={x} position={[x, 0.63, 0.02]}>
          <boxGeometry args={[0.05, 0.05, 0.42]} />
          <meshStandardMaterial color="#3a3f47" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.36, 0.38, 0.05]} />
        <meshStandardMaterial color="#5a6068" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
};
/** the cabin tube: floor at y = 0, centre aisle(s), sidewalls with round windows, overhead bins, lights. Rows along −Z from z = 0. */
export const Cabin: React.FC<{ rows: number; night?: boolean; screen?: THREE.Texture | null; empty?: (row: number, seat: number) => boolean; lights?: number }> = ({ rows, night = false, screen = null, empty, lights = 1 }) => {
  const len = rows * SEAT_PITCH + 3;
  const view = windowViewTex(night);
  const shell = useMemo(() => {
    const g = new THREE.CylinderGeometry(3.05, 3.05, len, 48, 1, true);
    g.rotateX(Math.PI / 2);
    return g;
  }, [len]);
  return (
    <group>
      <mesh geometry={shell} position={[0, 1.35, -len / 2 + 1.5]} rotation={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#d9d8d2" roughness={0.8} side={THREE.BackSide} />
      </mesh>
      {/* floor + carpet in the aisles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -len / 2 + 1.5]} receiveShadow>
        <planeGeometry args={[5.9, len]} />
        <meshStandardMaterial color="#3b4252" roughness={0.95} />
      </mesh>
      {/* windows: one per row each side, round-cornered, with the sky behind */}
      {Array.from({ length: rows }, (_, i) =>
        [-1, 1].map((m) => (
          <group key={`${i}${m}`} position={[m * 2.86, 1.25, -i * SEAT_PITCH - 0.2]} rotation={[0, (-m * Math.PI) / 2, m * 0.18]}>
            <mesh>
              <planeGeometry args={[0.3, 0.42]} />
              <meshBasicMaterial map={view} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.01]}>
              <ringGeometry args={[0.2, 0.27, 24]} />
              <meshStandardMaterial color="#d9dde2" roughness={0.6} />
            </mesh>
          </group>
        )),
      )}
      {/* overhead bins on both sides and over the centre block */}
      {[-2.15, 2.15].map((x) => (
        <mesh key={x} position={[x, 2.15, -len / 2 + 1.5]} rotation={[0, 0, x < 0 ? -0.35 : 0.35]} castShadow>
          <boxGeometry args={[1.1, 0.5, len - 1]} />
          <meshStandardMaterial color="#f4f5f6" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 2.35, -len / 2 + 1.5]} castShadow>
        <boxGeometry args={[1.9, 0.45, len - 1]} />
        <meshStandardMaterial color="#f4f5f6" roughness={0.6} />
      </mesh>
      {/* ceiling light strips */}
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, 2.62, -len / 2 + 1.5]}>
          <boxGeometry args={[0.18, 0.03, len - 1]} />
          <meshBasicMaterial color={new THREE.Color(night ? "#7a8cff" : "#fff6e6").multiplyScalar(0.5 + 0.8 * lights)} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: rows }, (_, i) =>
        SEAT_X.map((x, j) => (empty && empty(i, j) ? null : <Seat key={`${i}${j}`} p={[x, 0, -i * SEAT_PITCH]} color={i % 7 === 3 ? "#2a4f94" : "#1f3f7a"} screen={screen} />)),
      )}
      <pointLight position={[0, 2.3, -len / 3]} intensity={60 * lights} distance={len} decay={1.2} color={night ? "#9aa8ff" : "#fff2de"} />
      <pointLight position={[0, 2.3, -len * 0.75]} intensity={60 * lights} distance={len} decay={1.2} color={night ? "#9aa8ff" : "#fff2de"} />
    </group>
  );
};

/** seat-back map screen: Europe → Australia, a tiny plane crawling over the ocean. `k` 0–1 progress. */
export const flightMapTex = (() => {
  let c: HTMLCanvasElement | null = null;
  let t: THREE.CanvasTexture | null = null;
  return (k: number, earth?: HTMLImageElement) => {
    if (!c) {
      c = document.createElement("canvas");
      c.width = 512;
      c.height = 336;
      t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
    }
    const g = c.getContext("2d")!;
    g.fillStyle = "#0b2a4a";
    g.fillRect(0, 0, 512, 336);
    if (earth) {
      // lon −25…165, lat 68…−48 of the equirectangular day map → the whole screen
      const iw = earth.width;
      const ih = earth.height;
      const sx = ((-25 + 180) / 360) * iw;
      const sw = (190 / 360) * iw;
      const sy = ((90 - 68) / 180) * ih;
      const sh = (116 / 180) * ih;
      g.filter = "saturate(0.7) brightness(0.85) contrast(1.1)";
      g.drawImage(earth, sx, sy, sw, sh, 0, 0, 512, 336);
      g.filter = "none";
    }
    g.fillStyle = earth ? "rgba(0,0,0,0)" : "#2e6b4a";
    // Europe, Africa, Asia, Australia as rough blobs
    const blob = (pts: number[][]) => {
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.fill();
    };
    blob([[60, 40], [140, 30], [170, 70], [130, 100], [90, 95], [70, 70]]);
    blob([[95, 110], [160, 110], [175, 170], [150, 250], [120, 260], [100, 190]]);
    blob([[170, 40], [360, 30], [420, 80], [380, 140], [300, 150], [230, 120], [175, 90]]);
    blob([[360, 220], [440, 210], [470, 250], [450, 300], [390, 300], [355, 265]]);
    // London → Sydney (on the satellite map: x = (lon + 25) / 190, y = (68 − lat) / 116)
    const a = earth ? [67, 48] : [100, 70];
    const b = earth ? [475, 295] : [440, 265];
    const ctrl = earth ? [300, 40] : [300, 60];
    g.strokeStyle = "rgba(255,255,255,0.8)";
    g.setLineDash([8, 8]);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.quadraticCurveTo(ctrl[0], ctrl[1], b[0], b[1]);
    g.stroke();
    g.setLineDash([]);
    const q = (s: number) => [(1 - s) ** 2 * a[0] + 2 * (1 - s) * s * ctrl[0] + s * s * b[0], (1 - s) ** 2 * a[1] + 2 * (1 - s) * s * ctrl[1] + s * s * b[1]];
    const [px, py] = q(k);
    const [qx, qy] = q(Math.min(1, k + 0.01));
    g.save();
    g.translate(px, py);
    g.rotate(Math.atan2(qy - py, qx - px));
    g.scale(2.2, 2.2);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(14, 0);
    g.lineTo(-10, -12);
    g.lineTo(-6, 0);
    g.lineTo(-10, 12);
    g.closePath();
    g.fill();
    g.restore();
    g.fillStyle = "#ffffff";
    g.font = "bold 22px Arial";
    g.fillText(`TIME TO DESTINATION ${Math.max(0, Math.round((1 - k) * 20))}:${String(Math.round(((1 - k) * 1200) % 60)).padStart(2, "0")}`, 18, 322);
    t!.needsUpdate = true;
    return t!;
  };
})();

// ───────────────────────── galley tray: meal + tomato juice ─────────────────────────
export const MealTray: React.FC<{ p: V3; juice?: number }> = ({ p, juice = 1 }) => (
  <group position={p}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[0.42, 0.02, 0.3]} />
      <meshStandardMaterial color="#7d8792" roughness={0.6} />
    </mesh>
    <mesh position={[-0.08, 0.03, 0]} castShadow>
      <boxGeometry args={[0.2, 0.04, 0.16]} />
      <meshStandardMaterial color="#e8e8e4" roughness={0.4} />
    </mesh>
    <mesh position={[-0.08, 0.055, 0]}>
      <boxGeometry args={[0.18, 0.012, 0.14]} />
      <meshStandardMaterial color="#c99a4a" roughness={0.8} />
    </mesh>
    {/* tomato juice: clear plastic cup */}
    <group position={[0.13, 0.01, 0.04]}>
      <mesh position={[0, 0.06 * juice, 0]}>
        <cylinderGeometry args={[0.032, 0.027, 0.12 * juice, 20]} />
        <meshStandardMaterial color="#c4261a" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.036, 0.03, 0.13, 20, 1, true]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} roughness={0.05} transmission={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  </group>
);

// ───────────────────────── lavatory with the ashtray ─────────────────────────
export const noSmokeTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#1a1a1a";
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "#ffffff";
    g.lineWidth = 16;
    g.beginPath();
    g.arc(128, 128, 96, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#ffffff";
    g.fillRect(56, 116, 120, 24);
    g.fillStyle = "#ff6a10";
    g.fillRect(176, 116, 22, 24);
    g.strokeStyle = "#ff3b30";
    g.lineWidth = 18;
    g.beginPath();
    g.moveTo(60, 60);
    g.lineTo(196, 196);
    g.stroke();
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();
/** warm grey laminate with panel seams and a light speckle (lavatory walls) */
const laminateTex = (() => {
  const cache: Record<string, THREE.Texture> = {};
  return (base: string, seams: number) => {
    const k = base + seams;
    if (cache[k]) return cache[k];
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = base;
    g.fillRect(0, 0, 512, 512);
    const r = seeded(6);
    for (let i = 0; i < 5000; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.05)";
      g.fillRect(r() * 512, r() * 512, 2, 2);
    }
    g.fillStyle = "rgba(60,60,60,0.35)";
    for (let i = 1; i < seams; i++) g.fillRect((i / seams) * 512 - 1, 0, 3, 512);
    cache[k] = new THREE.CanvasTexture(c);
    cache[k].colorSpace = THREE.SRGBColorSpace;
    return cache[k];
  };
})();
const steel = { color: "#c9ced4", metalness: 0.95, roughness: 0.22 } as const;
/**
 * A 1.0 × 1.4 × 2.05 m airliner lavatory, metres, floor y = 0. Toilet against the back wall (−Z), sink counter on the
 * right wall (+X), the door closes the front (+Z) with the NO SMOKING sign and the ashtray on its inside face.
 * Walls are single planes that only meet at their edges (no coplanar faces → no flicker).
 */
export const Lavatory: React.FC<{ ashOpen?: number; binFire?: boolean }> = ({ ashOpen = 0, binFire = false }) => {
  const wall = laminateTex("#d6d0c4", 3);
  const door = laminateTex("#b9bcc0", 1);
  const bowl = useMemo(() => {
    const pts = [
      [0.0, 0.0],
      [0.15, 0.0],
      [0.19, 0.18],
      [0.2, 0.4],
      [0.18, 0.43],
      [0.12, 0.3],
      [0.03, 0.22],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 32);
  }, []);
  const basin = useMemo(() => {
    const pts = [
      [0.0, -0.08],
      [0.09, -0.07],
      [0.13, -0.02],
      [0.14, 0.0],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 28);
  }, []);
  return (
    <group>
      {/* shell: floor, ceiling, back, left, right, door — planes meeting at the edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.0, 1.4]} />
        <meshStandardMaterial color="#4a4f57" roughness={0.9} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.05, 0]}>
        <planeGeometry args={[1.0, 1.4]} />
        <meshStandardMaterial color="#e9e6df" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.025, -0.7]} receiveShadow>
        <planeGeometry args={[1.0, 2.05]} />
        <meshStandardMaterial map={wall} roughness={0.55} />
      </mesh>
      <mesh position={[-0.5, 1.025, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[1.4, 2.05]} />
        <meshStandardMaterial map={wall} roughness={0.55} />
      </mesh>
      <mesh position={[0.5, 1.025, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[1.4, 2.05]} />
        <meshStandardMaterial map={wall} roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.025, 0.7]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[1.0, 2.05]} />
        <meshStandardMaterial map={door} roughness={0.45} />
      </mesh>
      {/* dark trim along the corners */}
      {[
        [-0.49, 1.025, -0.69],
        [0.49, 1.025, -0.69],
        [-0.49, 1.025, 0.69],
        [0.49, 1.025, 0.69],
      ].map((q, i) => (
        <mesh key={i} position={q as V3}>
          <boxGeometry args={[0.02, 2.05, 0.02]} />
          <meshStandardMaterial color="#5f656d" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* ceiling light panel */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.04, -0.1]}>
        <planeGeometry args={[0.6, 0.5]} />
        <meshBasicMaterial color="#fff4e2" toneMapped={false} />
      </mesh>
      {/* toilet: white shroud, steel bowl, seat + lid up, flush button */}
      <mesh position={[0, 0.2, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.4, 0.38]} />
        <meshStandardMaterial color="#f0eee8" roughness={0.4} />
      </mesh>
      <mesh geometry={bowl} position={[0, 0.02, -0.38]} castShadow>
        <meshStandardMaterial {...steel} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.455, -0.37]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.025, 10, 28]} />
        <meshStandardMaterial color="#f7f5f0" roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.72, -0.62]} rotation={[-0.12, 0, 0]} castShadow>
        <boxGeometry args={[0.38, 0.48, 0.03]} />
        <meshStandardMaterial color="#f7f5f0" roughness={0.35} />
      </mesh>
      <mesh position={[0.18, 1.05, -0.695]}>
        <circleGeometry args={[0.035, 20]} />
        <meshStandardMaterial color="#3a7bd5" roughness={0.4} />
      </mesh>
      {/* sink counter on the right wall: laminate box, steel basin, tap, waste flap on its front */}
      <mesh position={[0.33, 0.43, 0.12]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.86, 0.56]} />
        <meshStandardMaterial map={wall} roughness={0.5} />
      </mesh>
      <mesh geometry={basin} position={[0.33, 0.865, 0.12]}>
        <meshStandardMaterial {...steel} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.46, 0.95, 0.12]}>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 12]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[0.4, 1.02, 0.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.13, 12]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[0.159, 0.62, 0.12]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.24, 0.13]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      {binFire ? <Glow position={[0.15, 0.62, 0.12]} size={0.4} color="#ff7a1a" opacity={0.85} /> : null}
      {/* mirror above the sink, soap dispenser */}
      <mesh position={[0.497, 1.45, 0.12]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.5, 0.55]} />
        <meshStandardMaterial color="#b8c4cf" metalness={1} roughness={0.04} />
      </mesh>
      <mesh position={[0.47, 1.12, -0.12]}>
        <boxGeometry args={[0.05, 0.12, 0.07]} />
        <meshStandardMaterial color="#e9e6df" roughness={0.4} />
      </mesh>
      {/* grab handle + paper roll on the left wall */}
      <mesh position={[-0.47, 1.0, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.32, 12]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <mesh position={[-0.44, 0.62, -0.25]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.055, 0.055, 0.1, 20]} />
        <meshStandardMaterial color="#faf9f5" roughness={0.9} />
      </mesh>
      {/* the door's inside: NO SMOKING sign, the ashtray, the latch */}
      <mesh position={[-0.22, 1.32, 0.697]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.16, 0.16]} />
        <meshBasicMaterial map={noSmokeTex()} toneMapped={false} />
      </mesh>
      <group position={[-0.22, 1.02, 0.685]} rotation={[0, Math.PI, 0]}>
        <Ashtray p={[0, 0, 0]} open={ashOpen} />
      </group>
      <mesh position={[0.36, 1.05, 0.69]}>
        <boxGeometry args={[0.1, 0.05, 0.02]} />
        <meshStandardMaterial {...steel} />
      </mesh>
      <pointLight position={[0, 1.9, -0.1]} intensity={3} distance={3.5} color="#fff2de" />
    </group>
  );
};
const ashLabel = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "#1a1a1a";
    g.font = "bold 44px Arial";
    g.textAlign = "center";
    g.fillText("ASH TRAY", 128, 48);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();
/** the little stainless ashtray (flap + recess), as it sits on a lavatory door, facing +Z */
export const Ashtray: React.FC<{ p: V3; open?: number }> = ({ p, open = 0 }) => (
  <group position={p}>
    <mesh castShadow>
      <boxGeometry args={[0.12, 0.08, 0.03]} />
      <meshStandardMaterial color="#c4c9cf" metalness={0.95} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.0, 0.016]}>
      <boxGeometry args={[0.09, 0.03, 0.006]} />
      <meshStandardMaterial color="#2a2d31" roughness={0.5} />
    </mesh>
    <mesh position={[0, 0.07, 0.004]}>
      <planeGeometry args={[0.12, 0.03]} />
      <meshBasicMaterial map={ashLabel()} transparent toneMapped={false} />
    </mesh>
    {open > 0.3 ? (
      <mesh position={[0.015, -0.005, 0.02]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.004, 0.004, 0.03, 8]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.8} />
      </mesh>
    ) : null}
    <group position={[0, 0.04, 0.017]} rotation={[-1.1 * open, 0, 0]}>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.004]} />
        <meshStandardMaterial color="#d6dade" metalness={0.95} roughness={0.15} />
      </mesh>
    </group>
  </group>
);

// ───────────────────────── fuselage panel with a window (square → round), fatigue cracks ─────────────────────────
/**
 * A 3 × 2 m piece of fuselage skin with a 0.5 × 0.7 m window, facing +Z. `round` 0–1 morphs the corners from square to
 * round; `cracks` 0–1 grows red fatigue cracks out of the square corners; `bulge` 0–1 pushes the panel out (pressure).
 */
export const WindowPanel: React.FC<{ round?: number; cracks?: number; bulge?: number }> = ({ round = 0, cracks = 0, bulge = 0 }) => {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.5, -1);
    s.lineTo(1.5, -1);
    s.lineTo(1.5, 1);
    s.lineTo(-1.5, 1);
    s.closePath();
    const w = 0.5;
    const h = 0.7;
    const r = 0.02 + 0.2 * round;
    const hole = new THREE.Path();
    hole.moveTo(-w / 2 + r, -h / 2);
    hole.lineTo(w / 2 - r, -h / 2);
    hole.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    hole.lineTo(w / 2, h / 2 - r);
    hole.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    hole.lineTo(-w / 2 + r, h / 2);
    hole.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    hole.lineTo(-w / 2, -h / 2 + r);
    hole.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: false, curveSegments: 16 });
    return g;
  }, [round]);
  const crackLines = useMemo(() => {
    const r = seeded(9);
    const corners: [number, number, number][] = [
      [0.25, 0.35, 0.8],
      [-0.25, 0.35, 2.3],
      [0.25, -0.35, -0.8],
      [-0.25, -0.35, -2.3],
    ];
    return corners.map(([x, y, a]) => {
      const pts: THREE.Vector3[] = [new THREE.Vector3(x, y, 0.035)];
      let px = x;
      let py = y;
      for (let i = 0; i < 9; i++) {
        const ang = a + (r() - 0.5) * 0.9;
        px += Math.cos(ang) * 0.09;
        py += Math.sin(ang) * 0.09;
        pts.push(new THREE.Vector3(px, py, 0.035));
      }
      return pts;
    });
  }, []);
  return (
    <group scale={[1, 1, 1 + bulge * 4]}>
      <mesh geometry={shape} castShadow receiveShadow>
        <meshStandardMaterial color="#d3d8de" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* rivet rows */}
      {Array.from({ length: 24 }, (_, i) => (
        <React.Fragment key={i}>
          <mesh position={[-1.4 + i * 0.122, 0.92, 0.034]}>
            <sphereGeometry args={[0.012, 6, 4]} />
            <meshStandardMaterial color="#9aa1a9" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[-1.4 + i * 0.122, -0.92, 0.034]}>
            <sphereGeometry args={[0.012, 6, 4]} />
            <meshStandardMaterial color="#9aa1a9" metalness={0.9} roughness={0.3} />
          </mesh>
        </React.Fragment>
      ))}
      {/* window glass */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.5, 0.7]} />
        <meshStandardMaterial color="#5f86ad" metalness={0.2} roughness={0.05} />
      </mesh>
      {cracks > 0.01 && round < 0.2
        ? crackLines.map((pts, i) => {
            const n = Math.max(2, Math.round(pts.length * cracks));
            const curve = new THREE.CatmullRomCurve3(pts.slice(0, n));
            return (
              <mesh key={i}>
                <tubeGeometry args={[curve, 24, 0.008, 4]} />
                <meshBasicMaterial color="#ff2a1a" toneMapped={false} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

// ───────────────────────── a plane door (plug type) seen from inside ─────────────────────────
export const CabinDoor: React.FC<{ handle?: number }> = ({ handle = 0 }) => (
  <group>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1.07, 1.93, 0.12]} />
      <meshStandardMaterial color="#e9ebee" roughness={0.55} />
    </mesh>
    <mesh position={[0, 0.35, 0.065]}>
      <circleGeometry args={[0.14, 24]} />
      <meshStandardMaterial color="#6f8fb0" metalness={0.3} roughness={0.1} />
    </mesh>
    <mesh position={[0, 0.35, 0.067]}>
      <ringGeometry args={[0.14, 0.18, 24]} />
      <meshStandardMaterial color="#c9ced4" roughness={0.4} />
    </mesh>
    {/* the big lever */}
    <group position={[0.1, -0.1, 0.09]} rotation={[0, 0, -0.9 * handle]}>
      <mesh position={[0.18, 0, 0]}>
        <boxGeometry args={[0.42, 0.06, 0.05]} />
        <meshStandardMaterial color="#c43a2a" roughness={0.45} />
      </mesh>
    </group>
    <mesh position={[0, -0.55, 0.066]}>
      <planeGeometry args={[0.5, 0.12]} />
      <meshBasicMaterial color="#c43a2a" />
    </mesh>
    {/* slide pack (bustle) at the bottom, assist handle, frame, the green EXIT sign, ARMED indicator, a folded crew seat */}
    <mesh position={[0, -0.72, 0.16]} castShadow>
      <boxGeometry args={[0.9, 0.42, 0.2]} />
      <meshStandardMaterial color="#8d939b" roughness={0.6} />
    </mesh>
    <mesh position={[0, -0.72, 0.262]}>
      <planeGeometry args={[0.5, 0.08]} />
      <meshBasicMaterial color="#ffd23f" />
    </mesh>
    {[-0.62, 0.62].map((x) => (
      <mesh key={x} position={[x, 0, 0.02]}>
        <boxGeometry args={[0.14, 2.1, 0.16]} />
        <meshStandardMaterial color="#cfd2d6" roughness={0.5} />
      </mesh>
    ))}
    <mesh position={[0, 1.04, 0.02]}>
      <boxGeometry args={[1.38, 0.16, 0.16]} />
      <meshStandardMaterial color="#cfd2d6" roughness={0.5} />
    </mesh>
    <mesh position={[0.72, 0.2, 0.14]}>
      <boxGeometry args={[0.04, 0.5, 0.04]} />
      <meshStandardMaterial color="#c9ced4" metalness={0.9} roughness={0.25} />
    </mesh>
    <mesh position={[0, 1.27, 0.06]}>
      <planeGeometry args={[0.42, 0.16]} />
      <meshBasicMaterial map={exitTex()} toneMapped={false} />
    </mesh>
    <Glow position={[0, 1.27, 0.12]} size={0.9} color="#3dff8a" opacity={0.35} />
    <mesh position={[0.3, 0.72, 0.062]}>
      <planeGeometry args={[0.18, 0.06]} />
      <meshBasicMaterial color="#ff3b30" toneMapped={false} />
    </mesh>
    <mesh position={[-1.0, 0.0, 0.12]} castShadow>
      <boxGeometry args={[0.5, 0.9, 0.18]} />
      <meshStandardMaterial color="#3a4252" roughness={0.8} />
    </mesh>
  </group>
);
const exitTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 96;
    const g = c.getContext("2d")!;
    g.fillStyle = "#0c2a16";
    g.fillRect(0, 0, 256, 96);
    g.fillStyle = "#4dff92";
    g.font = "bold 64px Arial";
    g.textAlign = "center";
    g.fillText("EXIT", 128, 72);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

// ───────────────────────── Australia: a road sign ─────────────────────────
const roSignTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const g = c.getContext("2d")!;
    g.translate(256, 256);
    g.rotate(Math.PI / 4);
    g.fillStyle = "#111";
    g.fillRect(-176, -176, 352, 352);
    g.fillStyle = "#ffc72c";
    g.fillRect(-164, -164, 328, 328);
    g.rotate(-Math.PI / 4);
    // kangaroo silhouette
    g.fillStyle = "#111";
    g.beginPath();
    g.ellipse(10, 10, 70, 46, -0.5, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(70, -60, 22, 16, -0.3, 0, Math.PI * 2);
    g.fill();
    g.fillRect(55, -95, 8, 28);
    g.fillRect(70, -98, 8, 28);
    g.beginPath();
    g.moveTo(-50, 40);
    g.quadraticCurveTo(-130, 60, -150, 120);
    g.lineTo(-138, 124);
    g.quadraticCurveTo(-110, 76, -40, 60);
    g.fill();
    g.fillRect(-10, 40, 14, 60);
    g.fillRect(-10, 92, 70, 12);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();
export const KangarooSign: React.FC<{ p: V3; ry?: number }> = ({ p, ry = 0 }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <mesh position={[0, 1.1, 0]} castShadow>
      <cylinderGeometry args={[0.04, 0.04, 2.2, 8]} />
      <meshStandardMaterial color="#9aa0a6" metalness={0.8} roughness={0.4} />
    </mesh>
    <mesh position={[0, 2.25, 0.03]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial map={roSignTex()} roughness={0.5} transparent alphaTest={0.01} />
    </mesh>
  </group>
);

/** a gum (eucalyptus) tree: pale trunk, airy olive canopy */
export const GumTree: React.FC<{ p: V3; s?: number; seed?: number }> = ({ p, s = 1, seed = 3 }) => {
  const blobs = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: 9 }, () => ({ p: [(r() - 0.5) * 4, 6 + r() * 3, (r() - 0.5) * 4] as V3, s: 1.2 + r() * 1.3 }));
  }, [seed]);
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.32, 7, 10]} />
        <meshStandardMaterial color="#d9d2c4" roughness={0.8} />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} scale={[b.s, b.s * 0.7, b.s]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={i % 2 ? "#6f7d4a" : "#7d8a56"} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
};

// ───────────────────────── bedroom: a bed and a phone ─────────────────────────
/** double bed, head at −Z, 1.6 × 2.1 m, mattress top at y ≈ 0.55; `duvet` colour */
export const Bed: React.FC<{ p: V3; ry?: number; duvet?: string }> = ({ p, ry = 0, duvet = "#5a7fb5" }) => {
  const geo = useMemo(() => ({ mat: new RoundedBoxGeometry(1.6, 0.25, 2.0, 4, 0.08), duvet: new RoundedBoxGeometry(1.66, 0.14, 1.45, 4, 0.06), pillow: new RoundedBoxGeometry(0.62, 0.16, 0.4, 4, 0.07) }), []);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.72, 0.2, 2.12]} />
        <meshStandardMaterial color="#6b4a30" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.65, -1.04]} castShadow>
        <boxGeometry args={[1.72, 0.9, 0.08]} />
        <meshStandardMaterial color="#6b4a30" roughness={0.7} />
      </mesh>
      <mesh geometry={geo.mat} position={[0, 0.42, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f1efe9" roughness={0.9} />
      </mesh>
      <mesh geometry={geo.duvet} position={[0, 0.56, 0.27]} castShadow receiveShadow>
        <meshStandardMaterial color={duvet} roughness={0.95} />
      </mesh>
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} geometry={geo.pillow} position={[x, 0.6, -0.78]} castShadow>
          <meshStandardMaterial color="#f7f6f2" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
};
/** phone (glowing screen) with a canvas texture */
export const phoneTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#0e1420";
    g.fillRect(0, 0, 256, 512);
    g.fillStyle = "#2a3a5a";
    g.fillRect(14, 60, 228, 300);
    // the photo: an orange fox face on a sofa
    g.fillStyle = "#e9b04a";
    g.fillRect(14, 260, 228, 100);
    g.fillStyle = "#f08a2a";
    g.beginPath();
    g.arc(128, 200, 70, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.ellipse(128, 228, 46, 30, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#5fd6e0";
    g.beginPath();
    g.arc(102, 186, 13, 0, Math.PI * 2);
    g.arc(154, 186, 13, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#111";
    g.beginPath();
    g.arc(128, 214, 8, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#ffffff";
    g.font = "bold 26px Arial";
    g.fillText("Grandma 🇦🇺", 24, 400);
    g.font = "20px Arial";
    g.fillStyle = "#a9b8c9";
    g.fillText("“found this on my sofa x”", 24, 436);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();
export const Phone: React.FC<{ p: V3; rot?: V3 }> = ({ p, rot = [0, 0, 0] }) => (
  <group position={p} rotation={rot}>
    <mesh>
      <boxGeometry args={[0.075, 0.155, 0.008]} />
      <meshStandardMaterial color="#1a1a1e" metalness={0.6} roughness={0.3} />
    </mesh>
    <mesh position={[0, 0, 0.0045]}>
      <planeGeometry args={[0.068, 0.145]} />
      <meshBasicMaterial map={phoneTex()} toneMapped={false} />
    </mesh>
    <pointLight position={[0, 0, 0.12]} intensity={0.12} distance={0.8} color="#9fc0ff" />
  </group>
);

// ───────────────────────── a Comet-era fuselage section: bare aluminium, a row of windows, fatigue cracks ─────────────────────────
/**
 * Bare aluminium tube, radius 1.6 m, 10 m long, axis along X, the window row faces +Z (towards the camera).
 * `round` 0–1 swaps the square windows for round-cornered ones; `cracks` 0–1 grows red cracks out of the corners of the
 * hero window (at x = 0). The skin texture is redrawn when these change.
 */
const cometTex = (() => {
  let c: HTMLCanvasElement | null = null;
  let t: THREE.CanvasTexture | null = null;
  let last = "";
  return (round: number, cracks: number) => {
    if (!c) {
      c = document.createElement("canvas");
      c.width = 1024; // around the tube
      c.height = 1024; // along the tube (x)
      t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    }
    const key = `${round.toFixed(2)}|${cracks.toFixed(2)}`;
    if (key === last) return t!;
    last = key;
    const g = c.getContext("2d")!;
    // aluminium panels: slightly different tones, seams, rivet rows
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        const v = 196 + ((i * 7 + j * 13) % 5) * 5;
        g.fillStyle = `rgb(${v},${v + 3},${v + 8})`;
        g.fillRect(i * 128, j * 128, 128, 128);
      }
    g.fillStyle = "rgba(80,88,98,0.7)";
    for (let i = 0; i <= 8; i++) {
      g.fillRect(i * 128 - 1, 0, 2, 1024);
      g.fillRect(0, i * 128 - 1, 1024, 2);
    }
    g.fillStyle = "rgba(110,118,128,0.9)";
    for (let i = 0; i <= 8; i++)
      for (let k = 0; k < 64; k++) {
        g.fillRect(i * 128 - 6, k * 16 + 4, 3, 3);
        g.fillRect(k * 16 + 4, i * 128 - 6, 3, 3);
      }
    // the window row: centred around the tube's front (canvas x = 512), one every 1 m along the tube
    const r = 4 + 30 * round;
    const win = (x: number, y: number) => {
      g.fillStyle = "#17202c";
      g.beginPath();
      g.roundRect(x - 34, y - 46, 68, 92, r);
      g.fill();
      g.strokeStyle = "#8a939e";
      g.lineWidth = 5;
      g.beginPath();
      g.roundRect(x - 40, y - 52, 80, 104, r + 4);
      g.stroke();
      g.fillStyle = "rgba(140,180,220,0.35)";
      g.beginPath();
      g.roundRect(x - 28, y - 40, 30, 36, Math.min(r, 12));
      g.fill();
    };
    for (let k = -5; k <= 5; k++) win(470, 512 + k * 102);
    // fatigue cracks out of the hero window's square corners
    if (cracks > 0.01 && round < 0.2) {
      const rr = seeded(9);
      g.strokeStyle = "#ff2a1a";
      g.lineWidth = 9;
      g.lineCap = "round";
      g.shadowColor = "#ff5a3a";
      g.shadowBlur = 10;
      for (const [cx, cy, a] of [
        [470 + 40, 512 - 52, -0.8],
        [470 - 40, 512 - 52, -2.3],
        [470 + 40, 512 + 52, 0.8],
        [470 - 40, 512 + 52, 2.3],
      ]) {
        let x = cx;
        let y = cy;
        g.beginPath();
        g.moveTo(x, y);
        const n = Math.round(10 * cracks);
        for (let i = 0; i < n; i++) {
          const ang = a + (rr() - 0.5) * 0.9;
          x += Math.cos(ang) * 14;
          y += Math.sin(ang) * 14;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.shadowBlur = 0;
    }
    t!.needsUpdate = true;
    return t!;
  };
})();
export const CometSection: React.FC<{ round?: number; cracks?: number }> = ({ round = 0, cracks = 0 }) => {
  const geo = useMemo(() => {
    // thetaStart −π puts canvas x = 512 (u = 0.5) on the side facing +Z
    const g = new THREE.CylinderGeometry(1.6, 1.6, 10, 96, 1, true, -Math.PI, Math.PI * 2);
    g.rotateZ(Math.PI / 2);
    return g;
  }, []);
  const map = cometTex(round, cracks);
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial map={map} metalness={0.75} roughness={0.32} />
      </mesh>
      {/* the open ends look into the dark hull */}
      <mesh geometry={geo} scale={[0.999, 0.97, 0.97]}>
        <meshStandardMaterial color="#2a2e34" side={THREE.BackSide} roughness={0.8} />
      </mesh>
    </group>
  );
};
