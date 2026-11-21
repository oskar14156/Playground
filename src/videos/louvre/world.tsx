import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, Glow, Stars3D, V3 } from "../../lib/three/core";
import { Env, KeyLight, Post, RB, tex } from "../../lib/three/diorama";
import { seeded } from "../../lib/timing";
import { Barrier, crackTex, monaPuhTex, oldMasterTex, Painting, Stanchions } from "./props";

// ───────────────────────── canvas ─────────────────────────
export type Look = "gallery" | "day" | "night" | "interior-night" | "warm";
/** One canvas for every Louvre set: sky/fog/lights per look, AO + bloom + ACES. */
export const LouvreCanvas: React.FC<{ cam: Cam; t: number; look: Look; children: React.ReactNode; ao?: number; key2?: V3; shadow?: number }> = ({ cam, t, look, children, ao = 1.2, key2, shadow = 30 }) => {
  const { width, height } = useVideoConfig();
  const day = look === "day";
  const night = look === "night" || look === "interior-night";
  const bg = day ? "#bcd6ee" : night ? "#070a14" : look === "warm" ? "#2a1d14" : "#1a2230";
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.05, far: 3000 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[bg]} />
      {day ? <SkyDome /> : null}
      {look === "night" ? <Stars3D frame={t * 30} count={500} radius={900} size={2.5} /> : null}
      {day ? <fog attach="fog" args={["#cfe0f0", 260, 1400]} /> : look === "night" ? <fog attach="fog" args={["#0a0f1e", 60, 420]} /> : <fog attach="fog" args={[bg, 40, 140]} />}
      <hemisphereLight args={[day ? "#e6f0ff" : night ? "#3a4a78" : "#fff1dc", day ? "#8a7a60" : "#0b0f14", day ? 0.5 : night ? 0.28 : look === "warm" ? 0.9 : 0.55]} />
      <KeyLight
        p={key2 ?? (day ? [cam.look[0] - 90, cam.look[1] + 120, cam.look[2] + 70] : [cam.look[0] + 3, cam.look[1] + 14, cam.look[2] + 6])}
        target={cam.look}
        intensity={day ? 2.1 : night ? 0.35 : 1.2}
        color={day ? "#fff0d8" : night ? "#b8c8ff" : "#fff3e2"}
        size={shadow}
      />
      {children}
      <Env intensity={day ? 0.4 : night ? 0.06 : 0.22} />
      <Post bloom={night ? 0.9 : 0.5} ao={ao} vignette={0.45} />
    </ThreeCanvas>
  );
};

const SkyDome: React.FC = () => {
  const mat = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 4;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "#5f95d4");
    gr.addColorStop(0.55, "#a9c9ea");
    gr.addColorStop(1, "#e9eef0");
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false });
  }, []);
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[2000, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2 + 0.1]} />
    </mesh>
  );
};

/** Spot light with its target in the scene (so it really points at `target`). */
export const Spot: React.FC<{ p: V3; target: V3; angle: number; penumbra: number; intensity: number; distance: number; color: string }> = ({ p, target, angle, penumbra, intensity, distance, color }) => {
  const l = useMemo(() => new THREE.SpotLight(), []);
  l.position.set(...p);
  l.target.position.set(...target);
  l.angle = angle;
  l.penumbra = penumbra;
  l.intensity = intensity;
  l.distance = distance;
  l.decay = 2;
  l.color.set(color);
  return (
    <>
      <primitive object={l} />
      <primitive object={l.target} />
    </>
  );
};

// ───────────────────────── textures ─────────────────────────
const tcache = new Map<string, THREE.CanvasTexture>();
const ctex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, rep: [number, number] = [1, 1]) => {
  const k = `${key}|${rep}`;
  if (tcache.has(k)) return tcache.get(k)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, seeded(key.length * 13 + w));
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...rep);
  t.anisotropy = 8;
  tcache.set(k, t);
  return t;
};

/** Louvre facade, 2 bays (12 m) wide × 22 m tall: rusticated ground floor with arches, tall windows with pediments,
 * pilasters, cornices, attic windows. `night` lights some windows warm. */
export const facadeTex = (rep: [number, number], night = false) =>
  ctex(`facade${night}`, 512, 940, (g, r) => {
    const W = 512,
      H = 940,
      m = W / 12; // px per metre
    const stone = night ? "#6a6253" : "#e6dac2";
    g.fillStyle = stone;
    g.fillRect(0, 0, W, H);
    // stone courses
    g.strokeStyle = night ? "rgba(0,0,0,0.25)" : "rgba(120,100,70,0.22)";
    g.lineWidth = 1;
    for (let y = 0; y < H; y += m * 0.55) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }
    const yAt = (metres: number) => H - metres * m;
    // rusticated ground floor (0–6 m)
    g.fillStyle = night ? "rgba(0,0,0,0.12)" : "rgba(110,90,60,0.12)";
    for (let y = yAt(6); y < H; y += m * 0.6) g.fillRect(0, y, W, 2);
    for (let b = 0; b < 2; b++) {
      const cx = (b + 0.5) * 6 * m;
      // arch
      g.fillStyle = night ? (r() < 0.6 ? "#f2b45a" : "#1a1612") : "#2d3138";
      g.beginPath();
      g.moveTo(cx - 1.6 * m, yAt(0.6));
      g.lineTo(cx - 1.6 * m, yAt(3.8));
      g.arc(cx, yAt(3.8), 1.6 * m, Math.PI, 0);
      g.lineTo(cx + 1.6 * m, yAt(0.6));
      g.fill();
      g.strokeStyle = night ? "#3a3428" : "#c9b994";
      g.lineWidth = 6;
      g.stroke();
      // mullions
      g.strokeStyle = night ? "rgba(60,40,10,0.8)" : "#555b63";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx, yAt(0.6));
      g.lineTo(cx, yAt(5.4));
      for (const yy of [1.8, 3.0, 4.2]) {
        g.moveTo(cx - 1.6 * m, yAt(yy));
        g.lineTo(cx + 1.6 * m, yAt(yy));
      }
      g.stroke();
      // keystone
      g.fillStyle = night ? "#7a705e" : "#f2e8d2";
      g.fillRect(cx - 0.3 * m, yAt(5.75), 0.6 * m, 0.6 * m);
    }
    // string course
    g.fillStyle = night ? "#544c40" : "#d4c6a8";
    g.fillRect(0, yAt(6.6), W, 0.6 * m);
    // main floor tall windows with pediments (7.5–14 m)
    for (let b = 0; b < 2; b++) {
      const cx = (b + 0.5) * 6 * m;
      const lit = night && r() < 0.35;
      g.fillStyle = lit ? "#ffcf7a" : night ? "#151a24" : "#323943";
      g.fillRect(cx - 1.2 * m, yAt(13.2), 2.4 * m, 5.6 * m);
      g.strokeStyle = night ? "#3a3428" : "#c9b994";
      g.lineWidth = 7;
      g.strokeRect(cx - 1.2 * m, yAt(13.2), 2.4 * m, 5.6 * m);
      g.strokeStyle = lit ? "rgba(120,70,10,0.8)" : "#6a7078";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx, yAt(7.6));
      g.lineTo(cx, yAt(13.2));
      for (let k = 1; k < 5; k++) {
        g.moveTo(cx - 1.2 * m, yAt(7.6 + k * 1.12));
        g.lineTo(cx + 1.2 * m, yAt(7.6 + k * 1.12));
      }
      g.stroke();
      // balustrade under the window
      g.fillStyle = night ? "#5a5244" : "#efe4cc";
      for (let k = 0; k < 7; k++) g.fillRect(cx - 1.3 * m + k * 0.4 * m, yAt(7.6), 0.18 * m, 0.9 * m);
      // pediment (alternating triangle / segment)
      g.fillStyle = night ? "#6e6656" : "#f1e7d0";
      g.beginPath();
      if (b % 2 === 0) {
        g.moveTo(cx - 1.7 * m, yAt(13.6));
        g.lineTo(cx, yAt(15.0));
        g.lineTo(cx + 1.7 * m, yAt(13.6));
      } else {
        g.moveTo(cx - 1.7 * m, yAt(13.6));
        g.quadraticCurveTo(cx, yAt(15.4), cx + 1.7 * m, yAt(13.6));
      }
      g.closePath();
      g.fill();
      g.strokeStyle = night ? "#3a3428" : "#b8a682";
      g.lineWidth = 3;
      g.stroke();
    }
    // pilasters
    for (let k = 0; k <= 2; k++) {
      const x = k * 6 * m;
      const gr = g.createLinearGradient(x - 0.5 * m, 0, x + 0.5 * m, 0);
      gr.addColorStop(0, night ? "#5e5648" : "#d8caa8");
      gr.addColorStop(0.5, night ? "#7a7060" : "#f4ead4");
      gr.addColorStop(1, night ? "#5e5648" : "#d8caa8");
      g.fillStyle = gr;
      g.fillRect(x - 0.5 * m, yAt(17.5), 1.0 * m, 10.9 * m);
      g.fillStyle = night ? "#6e6656" : "#efe4cc";
      g.fillRect(x - 0.7 * m, yAt(17.8), 1.4 * m, 0.5 * m);
    }
    // entablature + frieze
    g.fillStyle = night ? "#5a5244" : "#d6c8a8";
    g.fillRect(0, yAt(19.0), W, 1.4 * m);
    g.fillStyle = night ? "#4a4236" : "#c4b48e";
    for (let x = 0; x < W; x += 0.8 * m) g.fillRect(x, yAt(18.8), 0.35 * m, 0.5 * m);
    // attic windows
    for (let b = 0; b < 2; b++) {
      const cx = (b + 0.5) * 6 * m;
      g.fillStyle = night && r() < 0.3 ? "#ffcf7a" : night ? "#151a24" : "#3a414b";
      g.fillRect(cx - 0.9 * m, yAt(21.3), 1.8 * m, 1.8 * m);
      g.strokeStyle = night ? "#3a3428" : "#c9b994";
      g.lineWidth = 5;
      g.strokeRect(cx - 0.9 * m, yAt(21.3), 1.8 * m, 1.8 * m);
    }
    // top cornice
    g.fillStyle = night ? "#6e6656" : "#f2e8d2";
    g.fillRect(0, 0, W, 0.8 * m);
    // grime
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = `rgba(60,50,30,${r() * 0.05})`;
      g.fillRect(r() * W, r() * H, 2 + r() * 4, 4 + r() * 18);
    }
  }, rep);

/** Slate mansard roof with dormers, 12 m wide repeat. */
const roofTex = (rep: [number, number]) =>
  ctex("roof", 512, 256, (g, r) => {
    g.fillStyle = "#56616d";
    g.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 9) {
      g.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.06})`;
      g.fillRect(0, y, 512, 2);
    }
    for (let i = 0; i < 2; i++) {
      const cx = 128 + i * 256;
      g.fillStyle = "#e8dcc4";
      g.fillRect(cx - 34, 120, 68, 110);
      g.beginPath();
      g.arc(cx, 120, 34, Math.PI, 0);
      g.fill();
      g.fillStyle = "#2a313a";
      g.fillRect(cx - 22, 128, 44, 92);
      g.beginPath();
      g.arc(cx, 128, 22, Math.PI, 0);
      g.fill();
    }
  }, rep);

// ───────────────────────── palace + pyramid (day / night) ─────────────────────────
/** A palace wing along +X from x0 to x1, front face at z (facing `face` = +1 → +Z, -1 → −Z), 22 m to the cornice. */
export const Wing: React.FC<{ x0: number; x1: number; z: number; face: 1 | -1; depth?: number; night?: boolean; rise?: number }> = ({ x0, x1, z, face, depth = 24, night = false, rise = 1 }) => {
  const L = x1 - x0;
  const H = 22;
  const fac = useMemo(() => facadeTex([L / 12, 1], night), [L, night]);
  const roof = useMemo(() => roofTex([L / 12, 1]), [L]);
  const cz = z - (face * depth) / 2;
  return (
    <group position={[(x0 + x1) / 2, 0, cz]} scale={[1, Math.max(0.001, rise), 1]}>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[L, H, depth]} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} map={(face === 1 && i === 4) || (face === -1 && i === 5) ? fac : undefined} color={(face === 1 && i === 4) || (face === -1 && i === 5) ? "#ffffff" : night ? "#5e5648" : "#d9ccb0"} roughness={0.85} />
        ))}
      </mesh>
      {/* mansard: a prism on top with dormers on the court side */}
      <mesh position={[0, H + 4, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[depth * 0.36, depth * 0.62, 8, 4, 1, false, Math.PI / 4]} />
        <meshStandardMaterial color="#56616d" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, H + 3.2, (face * depth) / 2 - face * 1.6]} rotation={[face * -0.38, face === 1 ? 0 : Math.PI, 0]}>
        <planeGeometry args={[L, 8.6]} />
        <meshStandardMaterial map={roof} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* cornice + chimneys */}
      <mesh position={[0, H + 0.2, (face * depth) / 2]}>
        <boxGeometry args={[L, 0.6, 1.2]} />
        <meshStandardMaterial color={night ? "#6e6656" : "#efe4cc"} roughness={0.8} />
      </mesh>
      {Array.from({ length: Math.floor(L / 24) }, (_, i) => (
        <mesh key={i} position={[-L / 2 + 12 + i * 24, H + 8.6, 0]}>
          <boxGeometry args={[1.4, 3, 2.4]} />
          <meshStandardMaterial color={night ? "#5e5648" : "#d4c6a8"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

/** A taller corner pavilion with a square dome roof. */
export const Pavilion: React.FC<{ p: V3; s?: number; night?: boolean; rise?: number }> = ({ p, s = 30, night = false, rise = 1 }) => {
  const fac = useMemo(() => facadeTex([s / 12, 1.1], night), [s, night]);
  return (
    <group position={p} scale={[1, Math.max(0.001, rise), 1]}>
      <mesh position={[0, 12.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[s, 25, s]} />
        <meshStandardMaterial map={fac} roughness={0.85} />
      </mesh>
      <mesh position={[0, 31, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[s * 0.32, s * 0.72, 12, 4]} />
        <meshStandardMaterial color="#4f5a66" roughness={0.55} metalness={0.25} />
      </mesh>
      <mesh position={[0, 38, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.6, s * 0.32, 3, 4]} />
        <meshStandardMaterial color="#c9a24a" roughness={0.3} metalness={0.9} />
      </mesh>
    </group>
  );
};

export const PYR = { base: 35.4, h: 21.6 };
/**
 * The glass pyramid: 4 faces with a rhombus lattice (dark steel mullions, blue-grey glass that shows the steel net
 * inside). `reveal` 0–1 lights the panes up one by one (the counter), `pop` scales it in from the ground.
 */
export const GlassPyramid: React.FC<{ reveal?: number; pop?: number; night?: number; t?: number }> = ({ reveal = 0, pop = 1, night = 0 }) => {
  const { base, h } = PYR;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const b = base / 2;
    const apex = [0, h, 0];
    const corners = [
      [-b, 0, b],
      [b, 0, b],
      [b, 0, -b],
      [-b, 0, -b],
    ];
    const pos: number[] = [];
    const face: number[] = [];
    const fuv: number[] = [];
    for (let i = 0; i < 4; i++) {
      const a = corners[i],
        c = corners[(i + 1) % 4];
      pos.push(...a, ...c, ...apex);
      // face-local metres: x along the base (−b…b), s up the slant (0…slant)
      const slant = Math.hypot(h, b);
      fuv.push(-b, 0, b, 0, 0, slant);
      face.push(i, i, i);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("fuv", new THREE.Float32BufferAttribute(fuv, 2));
    g.setAttribute("face", new THREE.Float32BufferAttribute(face, 1));
    g.computeVertexNormals();
    return g;
  }, [base, h]);
  const u = useMemo(() => ({ uReveal: { value: 0 }, uNight: { value: 0 } }), []);
  u.uReveal.value = reveal;
  u.uNight.value = night;
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color: "#9fb4c4", roughness: 0.08, metalness: 0.55, clearcoat: 1, transparent: true, opacity: 0.86, side: THREE.DoubleSide, envMapIntensity: 1.4 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec2 fuv; attribute float face; varying vec2 vF; varying float vFace;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvF = fuv; vFace = face;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uReveal; uniform float uNight; varying vec2 vF; varying float vFace; float lat; float lit;\nfloat h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }")
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
          // rhombus panes ~ 2.9 m along the diagonals (603 rhombi + 70 triangles over the 4 faces)
          float cell = 2.05;
          vec2 q = vec2(vF.x + vF.y, vF.x - vF.y) / cell;
          vec2 fq = fract(q);
          float line = min(min(fq.x, 1.0 - fq.x), min(fq.y, 1.0 - fq.y));
          lat = 1.0 - smoothstep(0.025, 0.06, line);
          float id = h21(floor(q) + vFace * 17.0);
          lit = step(id, uReveal) * (1.0 - lat);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.08, 0.09), lat);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.85, 0.35), lit * 0.7);
          diffuseColor.a = mix(diffuseColor.a, 1.0, lat);`,
        )
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.8, 0.3) * lit * 0.9 + vec3(1.0, 0.78, 0.45) * (1.0 - lat) * uNight * 0.55;");
    };
    m.customProgramCacheKey = () => "glasspyr";
    return m;
  }, [u]);
  return (
    <group scale={[pop, pop, pop]}>
      <mesh geometry={geo} material={mat} castShadow />
      {/* steel frame edges */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const b = base / 2;
        const cx = Math.sign(Math.cos(a)) * b,
          cz = Math.sign(Math.sin(a)) * b;
        const len = Math.hypot(Math.hypot(cx, cz), h);
        const dir = new THREE.Vector3(-cx, h, -cz).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={i} position={[cx / 2, h / 2, cz / 2]} quaternion={q}>
            <cylinderGeometry args={[0.18, 0.18, len, 8]} />
            <meshStandardMaterial color="#2b2f35" metalness={0.8} roughness={0.35} />
          </mesh>
        );
      })}
      {/* granite base kerb */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[base + 1.2, 0.5, base + 1.2]} />
        <meshStandardMaterial color="#c9c2b6" roughness={0.7} />
      </mesh>
      {night > 0 ? <pointLight position={[0, 6, 0]} intensity={900 * night} distance={60} color="#ffcf8a" /> : null}
    </group>
  );
};

/** Triangular fountain basin with water (side length s, centre p, rotated ry). */
const Basin: React.FC<{ p: V3; s: number; ry: number; t: number }> = ({ p, s, ry }) => {
  const shape = useMemo(() => {
    const sh = new THREE.Shape();
    const r = s / Math.sqrt(3);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      i === 0 ? sh.moveTo(Math.cos(a) * r, Math.sin(a) * r) : sh.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    sh.closePath();
    return sh;
  }, [s]);
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[shape, { depth: 0.5, bevelEnabled: true, bevelSize: 0.3, bevelThickness: 0.1, bevelSegments: 2 }]} />
        <meshStandardMaterial color="#d8d2c6" roughness={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.42, 0]} scale={[0.93, 0.93, 1]}>
        <shapeGeometry args={[shape]} />
        <meshPhysicalMaterial color="#2c4a5c" roughness={0.04} metalness={0.3} clearcoat={1} envMapIntensity={1.6} />
      </mesh>
    </group>
  );
};

/** Cour Napoléon: paving, the pyramid with three basins and three small pyramids, palace wings on three sides. */
export const CourNapoleon: React.FC<{ t: number; reveal?: number; pyrPop?: number; night?: number; rise?: number; pyramid?: boolean }> = ({ t, reveal = 0, pyrPop = 1, night = 0, rise = 1, pyramid = true }) => {
  const paving = useMemo(() => tex("tiles", "#cdc5b6", [70, 70], 4), []);
  const isN = night > 0.5;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial map={paving} color={isN ? "#6a6a72" : "#b3ab9c"} roughness={0.75} />
      </mesh>
      {pyramid ? <GlassPyramid reveal={reveal} pop={pyrPop} night={night} /> : null}
      {pyramid
        ? [
            [0, -36, 0],
            [36, 0, Math.PI / 2],
            [0, 36, Math.PI],
          ].map(([x, z, ry], i) => <Basin key={i} p={[x, 0, z]} s={30} ry={ry} t={t} />)
        : null}
      {pyramid
        ? [
            [-6, -58],
            [62, -2],
            [-6, 58],
          ].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]} scale={[0.16 * pyrPop, 0.16 * pyrPop, 0.16 * pyrPop]}>
              <GlassPyramid pop={1} night={night} />
            </group>
          ))
        : null}
      {rise > 0.01 ? (
        <>
          <Wing x0={-130} x1={80} z={-70} face={1} night={isN} rise={rise} />
          <Wing x0={-130} x1={80} z={70} face={-1} night={isN} rise={rise} />
          <group rotation={[0, Math.PI / 2, 0]}>
            <Wing x0={-70} x1={70} z={92} face={-1} night={isN} rise={rise} />
          </group>
          <Pavilion p={[106, 0, 0]} s={30} night={isN} rise={rise} />
          <Pavilion p={[94, 0, -82]} s={28} night={isN} rise={rise} />
          <Pavilion p={[94, 0, 82]} s={28} night={isN} rise={rise} />
          <Pavilion p={[-40, 0, -82]} s={26} night={isN} rise={rise} />
          <Pavilion p={[-40, 0, 82]} s={26} night={isN} rise={rise} />
        </>
      ) : null}
      {/* lamp posts around the court */}
      {[-60, -30, 40, 70].map((x) =>
        [-46, 46].map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh position={[0, 2.2, 0]}>
              <cylinderGeometry args={[0.07, 0.11, 4.4, 8]} />
              <meshStandardMaterial color="#1d2024" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 4.6, 0]}>
              <sphereGeometry args={[0.28, 12, 10]} />
              <meshStandardMaterial color="#fff4d8" emissive="#ffcf8a" emissiveIntensity={isN ? 2.5 : 0.1} />
            </mesh>
            {isN ? <Glow position={[0, 4.6, 0]} size={4} color="#ffcf8a" opacity={0.6} /> : null}
          </group>
        )),
      )}
    </group>
  );
};

// ───────────────────────── the fortress of 1190 ─────────────────────────
export const Fortress: React.FC<{ o: number; sink?: number }> = ({ o, sink = 0 }) => {
  const stone = useMemo(() => tex("plaster", "#bfb29a", [6, 2], 22), []);
  const s = 78;
  const towers: [number, number][] = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  if (o < 0.01) return null;
  return (
    <group position={[0, -sink * 40, 0]}>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * (s / 2), 6, Math.cos(a) * (s / 2)]} rotation={[0, a, 0]} castShadow>
            <boxGeometry args={[s, 12, 3]} />
            <meshStandardMaterial map={stone} color="#d8cbb0" roughness={0.95} transparent opacity={o} />
          </mesh>
        );
      })}
      {towers.map(([x, z], i) => (
        <group key={i} position={[(x * s) / 2, 0, (z * s) / 2]}>
          <mesh position={[0, 9, 0]} castShadow>
            <cylinderGeometry args={[4, 4.4, 18, 20]} />
            <meshStandardMaterial map={stone} color="#d8cbb0" roughness={0.95} transparent opacity={o} />
          </mesh>
          <mesh position={[0, 21, 0]}>
            <coneGeometry args={[4.8, 7, 20]} />
            <meshStandardMaterial color="#4f5a66" roughness={0.6} transparent opacity={o} />
          </mesh>
        </group>
      ))}
      {/* the Grosse Tour keep: 15 m wide, 31 m tall */}
      <mesh position={[0, 15.5, 0]} castShadow>
        <cylinderGeometry args={[7.5, 7.8, 31, 28]} />
        <meshStandardMaterial map={stone} color="#d8cbb0" roughness={0.95} transparent opacity={o} />
      </mesh>
      <mesh position={[0, 36, 0]}>
        <coneGeometry args={[8.4, 11, 28]} />
        <meshStandardMaterial color="#4f5a66" roughness={0.6} transparent opacity={o} />
      </mesh>
    </group>
  );
};

// ───────────────────────── the gallery (Salle des États) ─────────────────────────
export const ROOM = { x: 10, z0: -18, z1: 22, h: 11 };
export const VIT_P: V3 = [0, 0, -14.6];
/** Long room (z axis), dark blue walls, parquet, skylight vault, huge canvases on the side walls, the puh's wall at the far end. */
export const Gallery: React.FC<{ t: number; children?: React.ReactNode; queue?: boolean; spot?: number }> = ({ children, queue = false, spot = 1 }) => {
  const { x, z0, z1, h } = ROOM;
  const L = z1 - z0;
  const floor = useMemo(() => tex("planks", "#9a6a3e", [8, 16], 3), []);
  const wall = useMemo(() => tex("plaster", "#2d3c55", [6, 2], 6), []);
  const zc = (z0 + z1) / 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} receiveShadow>
        <planeGeometry args={[2 * x, L]} />
        <meshStandardMaterial map={floor} roughness={0.45} />
      </mesh>
      {/* side walls + end walls */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * x, h / 2, zc]} rotation={[0, -s * (Math.PI / 2), 0]} receiveShadow>
          <planeGeometry args={[L, h]} />
          <meshStandardMaterial map={wall} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, h / 2, z0]} receiveShadow>
        <planeGeometry args={[2 * x, h]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, h / 2, z1]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[2 * x, h]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      {/* skirting + dado */}
      {[-1, 1].map((s) => (
        <RB key={s} p={[s * (x - 0.05), 0.15, zc]} s={[0.1, 0.3, L]} r={0.01} color="#1a2232" />
      ))}
      {/* ceiling: coffered cove + skylight */}
      <mesh position={[0, h, zc]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2 * x, L]} />
        <meshStandardMaterial color="#e9e3d6" roughness={0.9} />
      </mesh>
      <mesh position={[0, h - 0.02, zc]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, L - 4]} />
        <meshStandardMaterial color="#f4f6ff" emissive="#e9f0ff" emissiveIntensity={1.1} />
      </mesh>
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={i} position={[0, h - 0.06, z0 + 2 + i * ((L - 4) / 12)]}>
          <boxGeometry args={[8.2, 0.12, 0.14]} />
          <meshStandardMaterial color="#9a9488" />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 4.1, h - 0.06, zc]}>
          <boxGeometry args={[0.14, 0.12, L - 4]} />
          <meshStandardMaterial color="#9a9488" />
        </mesh>
      ))}
      {/* skylight fill */}
      {[-10, 0, 10].map((z) => (
        <pointLight key={z} position={[0, h - 1, z]} intensity={70} distance={22} decay={1.6} color="#eef2ff" />
      ))}
      {/* the huge canvases */}
      <Painting p={[-x + 0.02, 4.6, 2]} ry={Math.PI / 2} s={[9, 5.6]} map={oldMasterTex(3, 900, 560)} frame={0.3} />
      <Painting p={[x - 0.02, 4.6, 4]} ry={-Math.PI / 2} s={[7.5, 5]} map={oldMasterTex(5, 900, 600)} frame={0.3} />
      <Painting p={[-x + 0.02, 3.8, -9]} ry={Math.PI / 2} s={[3.2, 4.2]} map={oldMasterTex(8, 480, 640)} frame={0.2} />
      <Painting p={[x - 0.02, 3.8, -9]} ry={-Math.PI / 2} s={[3.2, 4.2]} map={oldMasterTex(9, 480, 640)} frame={0.2} />
      <Painting p={[0, 5, z1 - 0.02]} ry={Math.PI} s={[10, 6.7]} map={oldMasterTex(11, 1000, 670)} frame={0.32} />
      {/* the puh's freestanding wall + spotlights */}
      <RB p={[0, 3.4, VIT_P[2] - 1.6]} s={[9, 6.8, 0.6]} r={0.04} color="#22324a" rough={0.9} />
      <group position={VIT_P}>
        <Barrier r={3.6} />
      </group>
      {spot > 0
        ? [-1, 1].map((s) => <Spot key={s} p={[s * 3, h - 0.5, VIT_P[2] + 5]} target={[0, 1.6, VIT_P[2]]} angle={0.28} penumbra={0.6} intensity={150 * spot} distance={30} color="#fff2dc" />)
        : null}
      {queue ? (
        <Stanchions
          pts={[
            [-5.5, -9],
            [5.5, -9],
            [5.5, -6.5],
            [-5.5, -6.5],
            [-5.5, -4],
            [5.5, -4],
            [5.5, -1.5],
            [-5.5, -1.5],
          ]}
        />
      ) : null}
      {children}
    </group>
  );
};

/** The puh's own room: small, velvet red, the vitrine alone, its own door with "ENTRÉE" + a Mona Puh portrait. */
export const PuhRoom: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const wall = useMemo(() => tex("wallpaper", "#6a1622", [3, 1.5], 9), []);
  const floor = useMemo(() => tex("planks", "#7a5232", [4, 4], 6), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial map={floor} roughness={0.4} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * -6, 3.5, Math.cos(a) * -6]} rotation={[0, a, 0]} receiveShadow>
            <planeGeometry args={[12, 7]} />
            <meshStandardMaterial map={wall} roughness={0.9} />
          </mesh>
        );
      })}
      <mesh position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#e9e3d6" />
      </mesh>
      <Painting p={[-3.4, 3.2, -5.95]} s={[1.06, 1.54]} map={monaPuhTex()} frame={0.14} />
      {/* door + gold sign */}
      <RB p={[3.4, 1.4, -5.95]} s={[1.6, 2.8, 0.1]} r={0.02} color="#2a1810" rough={0.5} />
      <RB p={[3.4, 3.2, -5.95]} s={[2.2, 0.5, 0.06]} r={0.02} color="#c9a24a" metal={0.9} rough={0.3} />
      <pointLight position={[0, 5.5, 2]} intensity={60} distance={14} color="#fff0d8" />
      <Spot p={[0, 6.8, 2]} target={[0, 1.6, -1.5]} angle={0.35} penumbra={0.6} intensity={300} distance={14} color="#fff2dc" />
      {children}
    </group>
  );
};

// ───────────────────────── 1911 ─────────────────────────
/** Salon Carré, 1911: red walls hung frame-to-frame, a dark doorway to the service stairs. The puh's
 * spot is the empty patch with four iron hooks once `empty` is 1. */
export const Salon1911: React.FC<{ empty: number; children?: React.ReactNode }> = ({ empty, children }) => {
  const wall = useMemo(() => tex("wallpaper", "#7a2a24", [4, 2], 2), []);
  const floor = useMemo(() => tex("planks", "#6e4a2a", [6, 10], 9), []);
  const W = 7,
    Z0 = -12,
    Z1 = 8,
    H = 8;
  const r = seeded(19);
  const hang = useMemo(() => {
    const out: { p: V3; s: [number, number]; ry: number; seed: number }[] = [];
    for (const side of [-1, 1])
      for (let row = 0; row < 3; row++)
        for (let k = 0; k < 6; k++) {
          const w = 1.4 + r() * 1.4,
            h = 1.0 + r() * 1.0;
          const z = Z0 + 2 + k * 3.1;
          if (side === 1 && Math.abs(z - -5.5) < 2.4) continue; // the service door
          out.push({ p: [side * (W - 0.02), 1.9 + row * 2.0, z], s: [w, h], ry: -side * (Math.PI / 2), seed: 40 + out.length });
        }
    for (let row = 0; row < 3; row++)
      for (let k = 0; k < 4; k++) {
        if (row === 0 && (k === 1 || k === 2)) continue; // the puh's spot
        out.push({ p: [-4.8 + k * 3.2, 1.9 + row * 2.0, Z0 + 0.02], s: [2.2, 1.4], ry: 0, seed: 80 + out.length });
      }
    return out;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (Z0 + Z1) / 2]} receiveShadow>
        <planeGeometry args={[2 * W, Z1 - Z0]} />
        <meshStandardMaterial map={floor} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * W, H / 2, (Z0 + Z1) / 2]} rotation={[0, -s * (Math.PI / 2), 0]}>
          <planeGeometry args={[Z1 - Z0, H]} />
          <meshStandardMaterial map={wall} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, H / 2, Z0]}>
        <planeGeometry args={[2 * W, H]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, H, (Z0 + Z1) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2 * W, Z1 - Z0]} />
        <meshStandardMaterial color="#e6dcc6" emissive="#fff3dc" emissiveIntensity={0.25} />
      </mesh>
      {hang.map((h, i) => (
        <Painting key={i} p={h.p} s={h.s} ry={h.ry} map={oldMasterTex(h.seed, 512, 360)} frame={0.12} />
      ))}
      {/* the empty spot: four iron hooks */}
      {[
        [-0.35, 2.4],
        [0.35, 2.4],
        [-0.35, 1.5],
        [0.35, 1.5],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, Z0 + 0.05]}>
          <torusGeometry args={[0.04, 0.012, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#222" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}
      {empty < 1 ? <Painting p={[0, 1.95, Z0 + 0.03]} s={[0.53, 0.77]} map={monaPuhTex()} frame={0.1} /> : null}
      {/* service door on the right wall */}
      <RB p={[W - 0.03, 1.25, -5.5]} s={[0.06, 2.5, 1.2]} r={0.01} color="#0c0806" rough={0.9} />
      <RB p={[W - 0.06, 2.6, -5.5]} s={[0.14, 0.2, 1.5]} r={0.02} color="#c9a24a" metal={0.6} rough={0.4} />
      <pointLight position={[0, 6.5, -2]} intensity={160} distance={24} decay={1.6} color="#fff2dc" />
      <pointLight position={[4, 4, 4]} intensity={90} distance={16} decay={1.6} color="#ffe6c0" />
      <pointLight position={[0, 3, -8]} intensity={70} distance={10} decay={1.6} color="#ffe6c0" />
      {children}
    </group>
  );
};

/** His Paris room, 1911–1913: sloped attic ceiling, bed, small window, the trunk. */
export const Attic: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const wall = useMemo(() => tex("wallpaper", "#a89a78", [2, 1], 31), []);
  const floor = useMemo(() => tex("planks", "#6a4a2a", [3, 3], 12), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial map={floor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.6, -3]}>
        <planeGeometry args={[6, 3.2]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      <mesh position={[-3, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[6, 3.2]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.0, 0.4]} rotation={[-Math.PI / 2 + 0.5, 0, 0]}>
        <planeGeometry args={[6, 7]} />
        <meshStandardMaterial color="#7a6a50" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* small window with Paris roofs */}
      <mesh position={[0.8, 2.0, -2.98]}>
        <planeGeometry args={[0.9, 1.0]} />
        <meshBasicMaterial color="#d9e4ee" />
      </mesh>
      <RB p={[0.8, 2.0, -2.96]} s={[1.0, 0.05, 0.04]} r={0.005} color="#3a2a1a" />
      <RB p={[0.8, 2.0, -2.96]} s={[0.05, 1.1, 0.04]} r={0.005} color="#3a2a1a" />
      {/* bed */}
      <RB p={[-2.0, 0.3, -1.2]} s={[1.0, 0.25, 2.0]} r={0.06} color="#d9cfb8" rough={0.95} />
      <RB p={[-2.0, 0.12, -1.2]} s={[1.05, 0.24, 2.05]} r={0.02} color="#3a2a1a" />
      <RB p={[-2.0, 0.5, -2.05]} s={[0.7, 0.15, 0.35]} r={0.06} color="#f2ecdc" rough={0.95} />
      <pointLight position={[0.8, 2.2, -1.5]} intensity={18} distance={8} color="#fff2dc" />
      <pointLight position={[1.4, 2.2, 1.6]} intensity={14} distance={8} color="#ffe6c0" />
      {children}
    </group>
  );
};

// ───────────────────────── 2025: the Seine side at night + the Apollo gallery ─────────────────────────
/** Galerie d'Apollon from the quai: the wing facing +Z at z = 0, a balcony window at 7 m, quai road, parapet, river. */
export const QUAI_WIN: V3 = [0, 7.2, 0.4];
export const Quai: React.FC<{ t: number; children?: React.ReactNode; broken?: number; day?: boolean }> = ({ t, children, broken = 0, day = false }) => {
  const road = useMemo(() => tex("asphalt", "#3a3c40", [10, 3], 7), []);
  return (
    <group>
      <Wing x0={-90} x1={90} z={0} face={1} night={!day} depth={20} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 14]} receiveShadow>
        <planeGeometry args={[300, 28]} />
        <meshStandardMaterial map={road} roughness={0.8} />
      </mesh>
      {/* pavement strip + parapet */}
      <mesh position={[0, 0.08, 2]}>
        <boxGeometry args={[300, 0.16, 4]} />
        <meshStandardMaterial color="#5a5a60" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.6, 26]}>
        <boxGeometry args={[300, 1.2, 0.8]} />
        <meshStandardMaterial color="#6a665e" roughness={0.9} />
      </mesh>
      {/* river */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 90]}>
        <planeGeometry args={[400, 120]} />
        <meshPhysicalMaterial color="#0c1626" roughness={0.08} metalness={0.4} clearcoat={1} />
      </mesh>
      {/* the balcony */}
      <RB p={[QUAI_WIN[0], QUAI_WIN[1] - 0.9, 1.0]} s={[3.6, 0.25, 1.4]} r={0.03} color="#5e5648" />
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[QUAI_WIN[0] - 1.6 + i * 0.4, QUAI_WIN[1] - 0.4, 1.6]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
          <meshStandardMaterial color="#1d2024" metalness={0.6} />
        </mesh>
      ))}
      {/* the window: dark glass, cracks + a hole once broken */}
      <mesh position={[QUAI_WIN[0], QUAI_WIN[1] + 0.9, 0.05]}>
        <planeGeometry args={[2.2, 3.2]} />
        <meshStandardMaterial color={day ? "#2a3440" : "#1a1612"} roughness={0.05} metalness={0.4} emissive="#ffb85a" emissiveIntensity={day ? 0.15 * broken : 0.25 + 0.6 * broken} />
      </mesh>
      {broken > 0 ? (
        <mesh position={[QUAI_WIN[0], QUAI_WIN[1] + 0.9, 0.07]}>
          <planeGeometry args={[2.0, 2.0]} />
          <meshBasicMaterial map={crackTex()} transparent depthWrite={false} opacity={broken} />
        </mesh>
      ) : null}
      {/* street lamps */}
      {(day ? [] : [-24, -8, 8, 24]).map((x) => (
        <group key={x} position={[x, 0, 4.5]}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.07, 0.12, 5, 8]} />
            <meshStandardMaterial color="#1d2024" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 5.2, 0]}>
            <sphereGeometry args={[0.3, 12, 10]} />
            <meshStandardMaterial color="#fff4d8" emissive="#ffcf8a" emissiveIntensity={3} />
          </mesh>
          <Glow position={[0, 5.2, 0]} size={5} color="#ffcf8a" opacity={0.7} />
          <pointLight position={[0, 5, 0.5]} intensity={90} distance={18} decay={1.8} color="#ffcf8a" />
        </group>
      ))}
      {/* facade wash */}
      {day ? null : <pointLight position={[0, 1, 8]} intensity={140} distance={30} color="#ffb870" />}
      {/* plane trees along the quai */}
      {day
        ? [-44, 16, 30].map((x) => (
            <group key={x} position={[x, 0, 22]}>
              <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[0.25, 0.35, 5, 10]} />
                <meshStandardMaterial color="#7a7062" roughness={0.9} />
              </mesh>
              <mesh position={[0, 6.5, 0]} scale={[1, 0.8, 1]}>
                <icosahedronGeometry args={[3.2, 1]} />
                <meshStandardMaterial color="#6a7a3a" roughness={0.9} flatShading />
              </mesh>
            </group>
          ))
        : null}
      {children}
    </group>
  );
};

/** Inside the Galerie d'Apollon: gilded vault, painted ceiling panels, jewel tables; window on the +X wall. */
export const Apollo: React.FC<{ children?: React.ReactNode; torch?: number; t: number }> = ({ children, torch = 1, t }) => {
  const floor = useMemo(() => tex("planks", "#5a3a22", [6, 20], 17), []);
  const W = 4.5,
    Z0 = -26,
    Z1 = 6,
    H = 7;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (Z0 + Z1) / 2]} receiveShadow>
        <planeGeometry args={[2 * W, Z1 - Z0]} />
        <meshStandardMaterial map={floor} roughness={0.35} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * W, H / 2, (Z0 + Z1) / 2]} rotation={[0, -s * (Math.PI / 2), 0]}>
          <planeGeometry args={[Z1 - Z0, H]} />
          <meshStandardMaterial color="#c9a24a" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      {/* vault: half cylinder with painted panels */}
      <mesh position={[0, H, (Z0 + Z1) / 2]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <cylinderGeometry args={[W, W, Z1 - Z0, 24, 1, true, 0, Math.PI]} />
        <meshStandardMaterial map={oldMasterTex(61, 1024, 256)} side={THREE.BackSide} roughness={0.6} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[0, H, Z0 + 2 + i * 3.6]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[W - 0.05, 0.12, 6, 24, Math.PI]} />
          <meshStandardMaterial color="#e6c15a" metalness={1} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, H / 2, Z0]}>
        <planeGeometry args={[2 * W, H + W]} />
        <meshStandardMaterial color="#8a6a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* morning: daylight through the tall windows on the +X wall + warm chandeliers */}
      <pointLight position={[0, 6, -10]} intensity={60} distance={30} decay={1.5} color="#cfe0ff" />
      {[-2, -12, -22].map((z) => (
        <pointLight key={z} position={[0, 5.5, z]} intensity={90} distance={16} decay={1.6} color="#ffdcae" />
      ))}
      {[0, -8, -16].map((z) => (
        <group key={z}>
          <mesh position={[W - 0.02, 3.4, z - 2]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[2.0, 3.4]} />
            <meshStandardMaterial color="#e8f0ff" emissive="#dfeaff" emissiveIntensity={0.9} />
          </mesh>
          <pointLight position={[W - 1.2, 3.4, z - 2]} intensity={40} distance={9} decay={1.6} color="#e6efff" />
        </group>
      ))}
      <pointLight position={[-1, 2.4, -9.6]} intensity={14} distance={4} color="#bcd0ff" />
      {torch > 0
        ? [0, 1].map((i) => (
            <Spot key={i} p={[1.5 - i * 2.2, 1.8, 2.5]} target={[Math.sin(t * 1.3 + i * 2) * 1.5, 1, -2 - i * 2]} angle={0.22} penumbra={0.4} intensity={220 * torch} distance={22} color="#f4f8ff" />
          ))
        : null}
      {children}
    </group>
  );
};
