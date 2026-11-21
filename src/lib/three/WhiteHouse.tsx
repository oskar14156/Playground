import React, { useMemo } from "react";
import * as THREE from "three";
import { Glow, V3 } from "./core";
import { RB, tex } from "./diorama";

/**
 * The White House Executive Residence at real size (1 unit = 1 m): main block 51.2 × 26 m, walls to the cornice
 * ≈ 15.8 m, balustrade on top, low hipped roof. North front (+Z): two rows of windows with alternating triangular and
 * segmental pediments, Ionic pilasters, the North Portico (4 + 2 Ionic columns, pediment, door with fanlight, lantern).
 * South front (−Z): the bowed South Portico with 6 columns and the Truman Balcony. Origin = middle of the block at lawn level.
 * `lit` 0–1 warms the windows (night), `door` 0–1 swings the north door open, `glass` 0–1 shows the bulletproof
 * spiderweb hits on the north windows of the ground floor.
 */
export const WH = { w: 51.2, d: 26, wall: 15.8, rail: 17.4, roof: 20.6 } as const;

const WHITE = "#f2efe7";

/** Painted sandstone ashlar: courses of blocks with fine joints (white, slight per-block tint). One tile = 6 × 6 m. */
const ashlar = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const S = 1024;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    const rows = 10;
    const rh = S / rows;
    let r = 7;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let y = 0; y < rows; y++) {
      const bw = S / 4;
      const off = (y % 2) * bw * 0.5;
      for (let x = -1; x < 5; x++) {
        const v = 238 + Math.floor(rnd() * 12);
        g.fillStyle = `rgb(${v},${v - 2},${v - 6})`;
        g.fillRect(x * bw + off, y * rh, bw, rh);
      }
      g.fillStyle = "rgba(150,145,135,0.55)";
      g.fillRect(0, y * rh, S, 3);
      for (let x = -1; x < 5; x++) g.fillRect(x * bw + off, y * rh, 3, rh);
    }
    // weathering speckle
    for (let i = 0; i < 9000; i++) {
      const a = 0.04 + rnd() * 0.06;
      g.fillStyle = `rgba(120,115,105,${a})`;
      g.fillRect(rnd() * S, rnd() * S, 2, 2);
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(8.5, 2.6);
    t.anisotropy = 8;
    return t;
  };
})();

/** Standing-seam metal roof (vertical seams every ~0.5 m). */
const seams = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "#c8ccd0";
    g.fillRect(0, 0, 512, 64);
    for (let x = 0; x < 512; x += 16) {
      g.fillStyle = "#eef0f2";
      g.fillRect(x, 0, 3, 64);
      g.fillStyle = "#9da3a9";
      g.fillRect(x + 3, 0, 2, 64);
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 6);
    return t;
  };
})();

/** Flowers in front of a hedge (origin = hedge centre): mulch strip + rows of red and white blooms. */
const FlowerBed: React.FC<{ len: number }> = ({ len }) => {
  const n = Math.floor(len / 0.22);
  const blooms = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.12, 1);
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.7 }), n * 2);
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < n * 2; i++) {
      const row = i % 2;
      const x = -len / 2 + 0.15 + Math.floor(i / 2) * 0.22 + (row ? 0.11 : 0);
      o.position.set(x, 0.32 + 0.06 * Math.sin(i * 1.7), 1.15 + row * 0.32);
      o.scale.setScalar(0.8 + 0.4 * Math.abs(Math.sin(i * 2.3)));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, col.set(row ? "#f4f1ea" : i % 6 === 0 ? "#f2c230" : "#c8263a"));
    }
    m.castShadow = true;
    return m;
  }, [len, n]);
  return (
    <group>
      <mesh position={[0, 0.06, 1.3]}>
        <boxGeometry args={[len, 0.12, 0.9]} />
        <meshStandardMaterial color="#4a3324" roughness={1} />
      </mesh>
      {/* leaves under the blooms */}
      <mesh position={[0, 0.2, 1.3]}>
        <boxGeometry args={[len - 0.2, 0.22, 0.8]} />
        <meshStandardMaterial color="#3d6b2e" roughness={0.95} />
      </mesh>
      <primitive object={blooms} />
    </group>
  );
};

/** Ionic column: base, slightly tapering fluted shaft (lathe), capital with two volutes. Origin = bottom. */
export const IonicColumn: React.FC<{ h: number; r: number; mat: THREE.Material }> = ({ h, r, mat }) => {
  const shaft = useMemo(() => {
    const len = h - 1.35;
    const g = new THREE.CylinderGeometry(r, r, len, 144, 24, true);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const k = (p.getY(i) + len / 2) / len;
      const a = Math.atan2(z, x);
      const flute = Math.pow(0.5 + 0.5 * Math.cos(a * 24), 0.6);
      const rr = r * (1 - 0.14 * k * k) * (1 - 0.045 * flute);
      p.setXYZ(i, Math.cos(a) * rr, p.getY(i) + 0.55 + len / 2, Math.sin(a) * rr);
    }
    g.computeVertexNormals();
    return g;
  }, [h, r]);
  return (
    <group>
      <mesh material={mat} position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[r * 2.7, 0.3, r * 2.7]} />
      </mesh>
      <mesh material={mat} position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[r * 1.12, r * 1.25, 0.25, 32]} />
      </mesh>
      <mesh material={mat} geometry={shaft} castShadow receiveShadow />
      {/* capital: echinus, volutes, abacus */}
      <mesh material={mat} position={[0, h - 0.72, 0]} castShadow>
        <cylinderGeometry args={[r * 1.05, r * 0.9, 0.3, 32]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={mat} position={[s * r * 1.05, h - 0.62, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[r * 0.32, r * 0.14, 10, 20]} />
        </mesh>
      ))}
      <mesh material={mat} position={[0, h - 0.4, 0]} castShadow>
        <boxGeometry args={[r * 2.6, 0.22, r * 2.4]} />
      </mesh>
    </group>
  );
};

/** One sash window: dark glass with muntins, white frame + sill, optional pediment. Origin = window centre, on the wall. */
const glassTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 96;
    c.height = 192;
    const g = c.getContext("2d")!;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 96, 192);
    g.fillStyle = "#c9ccd2";
    for (let x = 1; x < 3; x++) g.fillRect(x * 32 - 2, 0, 4, 192);
    for (let y = 1; y < 4; y++) g.fillRect(0, y * 48 - 2, 96, y === 2 ? 6 : 4);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();
const crackTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(255,255,255,0.95)";
    g.lineCap = "round";
    const hit = (x: number, y: number, s: number, seed: number) => {
      let r = seed;
      const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
      g.lineWidth = 2;
      for (let i = 0; i < 11; i++) {
        const a = (i / 11) * Math.PI * 2 + rnd() * 0.4;
        g.beginPath();
        g.moveTo(x, y);
        let px = x;
        let py = y;
        for (let k = 1; k <= 4; k++) {
          px = x + Math.cos(a + (rnd() - 0.5) * 0.3) * s * k * 0.25;
          py = y + Math.sin(a + (rnd() - 0.5) * 0.3) * s * k * 0.25;
          g.lineTo(px, py);
        }
        g.stroke();
      }
      for (const rr of [0.25, 0.5]) {
        g.beginPath();
        for (let i = 0; i <= 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          const q = rr * s * (0.85 + rnd() * 0.3);
          g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
        }
        g.stroke();
      }
      g.fillStyle = "rgba(255,255,255,0.9)";
      g.beginPath();
      g.arc(x, y, 5, 0, Math.PI * 2);
      g.fill();
    };
    hit(110, 100, 120, 3);
    hit(170, 170, 90, 7);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

const WinUnit: React.FC<{ p: V3; w: number; h: number; ped?: "tri" | "seg" | "none"; lit: number; crack?: number; ry?: number; mat: THREE.Material }> = ({ p, w, h, ped = "none", lit, crack = 0, ry = 0, mat }) => (
  <group position={p} rotation={[0, ry, 0]}>
    <mesh position={[0, 0, 0.02]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={glassTex()} color={lit > 0 ? "#ffcf8a" : "#2c3846"} emissive="#ffb35c" emissiveIntensity={0.9 * lit} roughness={0.12} metalness={0.4} />
    </mesh>
    {crack > 0.01 ? (
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={crackTex()} transparent opacity={crack} depthWrite={false} toneMapped={false} />
      </mesh>
    ) : null}
    {/* frame */}
    <mesh material={mat} position={[0, h / 2 + 0.09, 0.08]}>
      <boxGeometry args={[w + 0.36, 0.18, 0.18]} />
    </mesh>
    <mesh material={mat} position={[0, -h / 2 - 0.12, 0.12]}>
      <boxGeometry args={[w + 0.6, 0.18, 0.3]} />
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} material={mat} position={[s * (w / 2 + 0.09), 0, 0.08]}>
        <boxGeometry args={[0.18, h, 0.18]} />
      </mesh>
    ))}
    {ped === "tri" ? (
      <mesh material={mat} position={[0, h / 2 + 0.25, 0.04]} castShadow>
        <cylinderGeometry args={[(w + 0.9) / 2 / Math.cos(Math.PI / 6), (w + 0.9) / 2 / Math.cos(Math.PI / 6), 0.3, 3, 1, false, Math.PI / 2, Math.PI * 2]} />
      </mesh>
    ) : null}
    {ped !== "none" ? (
      <mesh material={mat} position={[0, h / 2 + 0.3, 0.15]} castShadow>
        <boxGeometry args={[w + 1.0, 0.16, 0.36]} />
      </mesh>
    ) : null}
    {ped === "seg" ? (
      <mesh material={mat} position={[0, h / 2 + 0.36, 0.1]} castShadow>
        <cylinderGeometry args={[(w + 0.9) / 2, (w + 0.9) / 2, 0.28, 32, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
    ) : null}
  </group>
);

/** Balustrade along X of length `len` (origin = left end on the cornice). Balusters as one instanced mesh. */
const Balustrade: React.FC<{ len: number; mat: THREE.Material }> = ({ len, mat }) => {
  const n = Math.floor(len / 0.32);
  const geo = useMemo(() => {
    const pts = [
      [0.1, 0],
      [0.1, 0.08],
      [0.06, 0.16],
      [0.11, 0.42],
      [0.06, 0.66],
      [0.08, 0.74],
      [0.08, 0.82],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return new THREE.LatheGeometry(pts, 10);
  }, []);
  const inst = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, n);
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      o.position.set(0.16 + i * 0.32, 0.18, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.castShadow = true;
    return m;
  }, [geo, mat, n]);
  return (
    <group>
      <mesh material={mat} position={[len / 2, 0.09, 0]}>
        <boxGeometry args={[len, 0.18, 0.4]} />
      </mesh>
      <primitive object={inst} />
      <mesh material={mat} position={[len / 2, 1.08, 0]} castShadow>
        <boxGeometry args={[len, 0.16, 0.42]} />
      </mesh>
      {Array.from({ length: Math.floor(len / 6) + 1 }, (_, i) => (
        <mesh key={i} material={mat} position={[Math.min(len - 0.25, i * 6 + 0.25), 0.55, 0]}>
          <boxGeometry args={[0.5, 1.1, 0.5]} />
        </mesh>
      ))}
    </group>
  );
};

const flagTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 380;
    c.height = 200;
    const g = c.getContext("2d")!;
    for (let i = 0; i < 13; i++) {
      g.fillStyle = i % 2 === 0 ? "#b22234" : "#ffffff";
      g.fillRect(0, (i * 200) / 13, 380, 200 / 13 + 1);
    }
    g.fillStyle = "#3c3b6e";
    g.fillRect(0, 0, 152, (7 * 200) / 13);
    g.fillStyle = "#ffffff";
    for (let r = 0; r < 9; r++)
      for (let k = 0; k < (r % 2 ? 5 : 6); k++) {
        g.beginPath();
        g.arc(12 + k * 25 + (r % 2 ? 12 : 0), 9 + r * 11.5, 3, 0, Math.PI * 2);
        g.fill();
      }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

/** A flag that waves (vertex wave driven by `t`). Origin = top of the hoist side. */
export const Flag: React.FC<{ t: number; w?: number; h?: number }> = ({ t, w = 3.8, h = 2 }) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(w, h, 24, 8), [w, h]);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3] + w / 2;
    pos.setZ(i, Math.sin(x * 1.6 - t * 3.2) * 0.18 * (x / w));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} position={[w / 2, -h / 2, 0]}>
      <meshStandardMaterial map={flagTex()} side={THREE.DoubleSide} roughness={0.8} />
    </mesh>
  );
};

export const WhiteHouse: React.FC<{ t?: number; lit?: number; door?: number; glass?: number }> = ({ t = 0, lit = 0, door = 0, glass = 0 }) => {
  const wall = useMemo(() => {
    const a = ashlar();
    return new THREE.MeshStandardMaterial({ map: a, bumpMap: a, bumpScale: 2.2, color: "#fbfaf6", roughness: 0.82 });
  }, []);
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ map: tex("plaster", "#f7f5ef", [2, 2], 23), roughness: 0.6 }), []);
  const roofMat = useMemo(() => {
    const s = seams();
    return new THREE.MeshStandardMaterial({ map: s, bumpMap: s, bumpScale: 3, color: "#9aa2aa", roughness: 0.45, metalness: 0.45 });
  }, []);
  const { w, d, wall: H } = WH;
  // north front: 11 bays; the three middle bays sit behind the portico
  const bays = Array.from({ length: 11 }, (_, i) => -w / 2 + 3.2 + i * ((w - 6.4) / 10));
  const pil = Array.from({ length: 12 }, (_, i) => -w / 2 + 0.6 + i * ((w - 1.2) / 11));
  const portW = 15;
  const portD = 9;
  return (
    <group>
      {/* main block + rusticated base course */}
      <mesh material={wall} position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, H, d]} />
      </mesh>
      <mesh material={trim} position={[0, 0.5, 0]} receiveShadow>
        <boxGeometry args={[w + 0.5, 1, d + 0.5]} />
      </mesh>
      {/* string course between the floors, cornice, frieze */}
      <mesh material={trim} position={[0, 7.4, 0]}>
        <boxGeometry args={[w + 0.3, 0.35, d + 0.3]} />
      </mesh>
      <mesh material={trim} position={[0, H - 0.9, 0]}>
        <boxGeometry args={[w + 0.25, 1.0, d + 0.25]} />
      </mesh>
      <mesh material={trim} position={[0, H - 0.2, 0]} castShadow>
        <boxGeometry args={[w + 1.2, 0.4, d + 1.2]} />
      </mesh>
      {/* balustrade all around */}
      <group position={[-w / 2 - 0.3, H, d / 2 + 0.3]}>
        <Balustrade len={w + 0.6} mat={trim} />
      </group>
      <group position={[-w / 2 - 0.3, H, -d / 2 - 0.3]}>
        <Balustrade len={w + 0.6} mat={trim} />
      </group>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 + 0.3), H, d / 2 + 0.3]} rotation={[0, Math.PI / 2, 0]}>
          <Balustrade len={d + 0.6} mat={trim} />
        </group>
      ))}
      {/* low hipped roof behind the balustrade + chimneys */}
      <group position={[0, H + 0.2 + 1.9, 0]} scale={[(w - 4) / (d - 2.6), 1, 1]}>
        <mesh material={roofMat} rotation={[0, Math.PI / 4, 0]} castShadow>
          <cylinderGeometry args={[((d - 2.6) * 0.62) / Math.SQRT2, (d - 2.6) / Math.SQRT2, 3.8, 4]} />
        </mesh>
      </group>
      {[-17, -9, 9, 17].map((x) => (
        <RB key={x} p={[x, H + 3.2, 0]} s={[1.4, 3.4, 2.6]} r={0.05} color={WHITE} rough={0.85} />
      ))}
      {/* pilasters on both long fronts */}
      {[1, -1].map((side) =>
        pil.map((x) => (
          <mesh key={`${side}${x}`} material={trim} position={[x, H / 2, side * (d / 2 + 0.12)]} castShadow>
            <boxGeometry args={[0.7, H - 1.6, 0.24]} />
          </mesh>
        )),
      )}
      {/* windows: north (+Z) and south (−Z) */}
      {[1, -1].map((side) =>
        bays.map((x, i) => {
          return (
            <group key={`${side}${i}`}>
              <WinUnit p={[x, 4.0, side * (d / 2 + 0.01)]} ry={side === 1 ? 0 : Math.PI} w={1.7} h={3.3} ped={i % 2 === 0 ? "tri" : "seg"} lit={side === 1 && (i === 3 || i === 7) ? lit * 0.25 : lit * (0.6 + 0.4 * ((i * 7) % 3 === 0 ? 1 : 0.5))} crack={side === 1 && (i === 3 || i === 7) ? glass : 0} mat={trim} />
              <WinUnit p={[x, 11.2, side * (d / 2 + 0.01)]} ry={side === 1 ? 0 : Math.PI} w={1.6} h={2.7} lit={lit * ((i * 5) % 4 === 0 ? 1 : 0.35)} mat={trim} />
            </group>
          );
        }),
      )}
      {/* end walls: three windows each */}
      {[-1, 1].map((s) =>
        [-7, 0, 7].map((z) => (
          <group key={`${s}${z}`}>
            <WinUnit p={[s * (w / 2 + 0.01), 4.0, z]} ry={(s * Math.PI) / 2} w={1.7} h={3.3} ped="tri" lit={lit * 0.5} mat={trim} />
            <WinUnit p={[s * (w / 2 + 0.01), 11.2, z]} ry={(s * Math.PI) / 2} w={1.6} h={2.7} lit={lit * 0.3} mat={trim} />
          </group>
        )),
      )}
      {/* ── NORTH PORTICO ── */}
      <group position={[0, 0, d / 2]}>
        {/* floor + steps */}
        <mesh material={trim} position={[0, 0.55, portD / 2]} receiveShadow>
          <boxGeometry args={[portW, 1.1, portD]} />
        </mesh>
        {[0, 1, 2].map((k) => (
          <mesh key={k} material={trim} position={[0, 0.18 + k * 0.32, portD + 1.4 - k * 0.45]} receiveShadow>
            <boxGeometry args={[portW - 4, 0.36, 0.9]} />
          </mesh>
        ))}
        {/* 4 front columns + 2 behind at the sides */}
        {[-5.4, -1.8, 1.8, 5.4].map((x) => (
          <group key={x} position={[x, 1.1, portD - 0.9]}>
            <IonicColumn h={H - 2.3} r={0.62} mat={trim} />
          </group>
        ))}
        {[-5.4, 5.4].map((x) => (
          <group key={`b${x}`} position={[x, 1.1, 2.6]}>
            <IonicColumn h={H - 2.3} r={0.62} mat={trim} />
          </group>
        ))}
        {/* entablature + pediment */}
        <mesh material={trim} position={[0, H - 0.6, portD / 2]} castShadow>
          <boxGeometry args={[portW + 0.6, 1.4, portD + 0.4]} />
        </mesh>
        <mesh material={wall} position={[0, H + 0.1, portD / 2 + 0.2]} rotation={[0, 0, 0]} castShadow>
          <extrudeGeometry
            args={[
              (() => {
                const s = new THREE.Shape();
                s.moveTo(-(portW + 0.6) / 2, 0);
                s.lineTo(0, 3.6);
                s.lineTo((portW + 0.6) / 2, 0);
                s.closePath();
                return s;
              })(),
              { depth: portD + 0.2, bevelEnabled: false },
            ]}
          />
        </mesh>
        {/* raking cornices */}
        {[-1, 1].map((s) => (
          <mesh key={s} material={trim} position={[(s * (portW + 0.6)) / 4, H + 0.1 + 1.8, portD + 0.45]} rotation={[0, 0, -s * Math.atan2(3.6, (portW + 0.6) / 2)]}>
            <boxGeometry args={[Math.hypot(3.6, (portW + 0.6) / 2) + 0.4, 0.35, 0.5]} />
          </mesh>
        ))}
        {/* the north door with fanlight */}
        <group position={[0, 1.1, 0.02]}>
          <mesh position={[0, 3.3, 0]}>
            <planeGeometry args={[3.0, 6.6]} />
            <meshStandardMaterial color="#1a1c20" />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 1.45, 0, 0.06]} rotation={[0, s * -door * 1.3, 0]}>
              <mesh position={[-s * 0.72, 2.25, 0]} castShadow>
                <boxGeometry args={[1.44, 4.5, 0.12]} />
                <meshStandardMaterial color="#f4f1ea" roughness={0.45} />
              </mesh>
              {[1.2, 3.2].map((y) => (
                <mesh key={y} position={[-s * 0.72, y, 0.07]}>
                  <boxGeometry args={[1.0, 1.5, 0.04]} />
                  <meshStandardMaterial color="#e6e2d8" roughness={0.5} />
                </mesh>
              ))}
              <mesh position={[-s * 1.2, 2.3, 0.1]}>
                <sphereGeometry args={[0.06, 10, 8]} />
                <meshStandardMaterial color="#c9a64a" metalness={0.9} roughness={0.25} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 4.95, 0.04]}>
            <circleGeometry args={[1.5, 32, 0, Math.PI]} />
            <meshStandardMaterial map={glassTex()} color={lit > 0 ? "#ffd59a" : "#3a4654"} emissive="#ffb35c" emissiveIntensity={lit} />
          </mesh>
          {/* hanging lantern */}
          <mesh position={[0, H - 4.2, 3.6]}>
            <cylinderGeometry args={[0.02, 0.02, 2.2, 6]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, H - 5.6, 3.6]}>
            <cylinderGeometry args={[0.35, 0.25, 0.9, 6]} />
            <meshStandardMaterial color="#ffe2a8" emissive="#ffc46b" emissiveIntensity={0.4 + 1.6 * lit} />
          </mesh>
          {lit > 0 ? <Glow position={[0, H - 5.6, 3.7]} size={3 + 2 * lit} color="#ffc46b" opacity={0.8 * lit} /> : null}
        </group>
      </group>
      {/* ── SOUTH PORTICO: bowed, 6 columns, Truman Balcony ── */}
      <group position={[0, 0, -d / 2]}>
        <mesh material={trim} position={[0, 0.55, -2.5]} receiveShadow>
          <cylinderGeometry args={[8.5, 8.5, 1.1, 48, 1, false, Math.PI / 2, Math.PI]} />
        </mesh>
        {[-75, -45, -15, 15, 45, 75].map((a) => {
          const r = (a * Math.PI) / 180;
          return (
            <group key={a} position={[Math.sin(r) * 7.6, 1.1, -Math.cos(r) * 7.6]}>
              <IonicColumn h={H - 2.3} r={0.6} mat={trim} />
            </group>
          );
        })}
        {/* Truman balcony at the second floor */}
        <mesh material={trim} position={[0, 7.3, -2.5]}>
          <cylinderGeometry args={[7.9, 7.9, 0.4, 48, 1, false, Math.PI / 2, Math.PI]} />
        </mesh>
        <mesh position={[0, 8.05, -2.5]}>
          <cylinderGeometry args={[7.85, 7.85, 1.1, 48, 1, true, Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color="#f7f5ef" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>
        {/* curved entablature + roof of the bow */}
        <mesh material={trim} position={[0, H - 0.6, -2.5]} castShadow>
          <cylinderGeometry args={[8.3, 8.3, 1.4, 48, 1, false, Math.PI / 2, Math.PI]} />
        </mesh>
      </group>
      {/* flag pole on the roof */}
      <mesh position={[0, H + 5.5, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 9, 8]} />
        <meshStandardMaterial color="#d9d9d9" metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[0.1, H + 9.8, 0]}>
        <Flag t={t} />
      </group>
      {/* clipped boxwood hedges with flower beds in front, both long fronts */}
      {[1, -1].map((side) =>
        [-1, 1].map((s) => (
          <group key={`${side}${s}`} position={[s * 17.5, 0, side * (d / 2 + 1.4)]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
            <RB p={[0, 0.7, 0]} s={[16, 1.4, 1.6]} r={0.6} color="#2f5a2a" rough={0.95} />
            <FlowerBed len={16} />
          </group>
        )),
      )}
    </group>
  );
};
