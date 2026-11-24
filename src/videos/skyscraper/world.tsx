import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig } from "remotion";
import { Cam, CameraRig, Glow, Stars3D, V3 } from "../../lib/three/core";
import { Car, Cyl, Env, KeyLight, Post, RB, Slab, Streetlight, tex } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";

export type Mood = "day" | "heat" | "night" | "storm" | "sunset";

// ───────────────────────── Cached procedural textures ─────────────────────────
const texCache = new Map<string, THREE.CanvasTexture>();

const makeTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, r: () => number) => void, rep: [number, number] = [1, 1], srgb = true) => {
  const k = `${key}|${rep[0]}x${rep[1]}|${w}x${h}`;
  if (texCache.has(k)) return texCache.get(k)!;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!, seeded(key.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7) & 0x7fffffff));
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...rep);
  t.anisotropy = 8;
  texCache.set(k, t);
  return t;
};

/** 4 architectural curtain-wall textures + paired emissive window maps for smooth day->night transition. */
export const dubaiTowerMaps = (variant: number) => {
  const map = makeTex(`dtow_diff_${variant}`, 512, 1024, (g, r) => {
    const palettes = [
      { base: "#4d7899", glass: "#6fa3c7", mullion: "#dce6f0", band: "#2b3e52" },
      { base: "#9a8870", glass: "#395268", mullion: "#e8dcc4", band: "#6e5d47" },
      { base: "#3a5e7d", glass: "#5890b8", mullion: "#b8cad8", band: "#1e3044" },
      { base: "#6b7985", glass: "#8fb0c7", mullion: "#e2e6eb", band: "#45505a" },
    ];
    const pal = palettes[variant % palettes.length];
    g.fillStyle = pal.base;
    g.fillRect(0, 0, 512, 1024);
    const cols = variant % 4 === 1 ? 8 : 12;
    const rows = 36;
    const cw = 512 / cols;
    const rh = 1024 / rows;
    for (let y = 0; y < rows; y++) {
      const isMech = y % 12 === 6;
      if (isMech) {
        g.fillStyle = pal.band;
        g.fillRect(0, y * rh, 512, rh);
        g.fillStyle = "rgba(0,0,0,0.28)";
        for (let l = 2; l < rh; l += 4) g.fillRect(0, y * rh + l, 512, 2);
        continue;
      }
      for (let x = 0; x < cols; x++) {
        const px = x * cw;
        const py = y * rh;
        const shade = r();
        g.fillStyle = shade < 0.25 ? pal.base : shade < 0.7 ? pal.glass : pal.mullion;
        g.globalAlpha = shade < 0.7 ? 0.92 : 0.35;
        g.fillRect(px + 4, py + 4, cw - 8, rh - 9);
        g.globalAlpha = 1;
        // sky reflection diagonal streak
        g.fillStyle = "rgba(255,255,255,0.12)";
        g.fillRect(px + 5, py + 5, (cw - 10) * 0.45, 4);
      }
      g.fillStyle = pal.mullion;
      g.fillRect(0, y * rh, 512, 4);
    }
    g.fillStyle = pal.mullion;
    for (let x = 0; x < cols; x++) g.fillRect(x * cw, 0, variant % 4 === 1 ? 8 : 3, 1024);
  });

  const emissiveMap = makeTex(
    `dtow_em_${variant}`,
    512,
    1024,
    (g, r) => {
      g.fillStyle = "#000000";
      g.fillRect(0, 0, 512, 1024);
      const cols = variant % 4 === 1 ? 8 : 12;
      const rows = 36;
      const cw = 512 / cols;
      const rh = 1024 / rows;
      for (let y = 0; y < rows; y++) {
        if (y % 12 === 6) {
          g.fillStyle = variant % 2 === 0 ? "#4fd4ff" : "#ffcb78";
          g.fillRect(0, y * rh + rh * 0.35, 512, 4);
          continue;
        }
        for (let x = 0; x < cols; x++) {
          if (r() < 0.42) {
            g.fillStyle = r() < 0.78 ? "#ffd78a" : "#9ae6ff";
            g.fillRect(x * cw + 6, y * rh + 6, cw - 12, rh - 12);
          }
        }
      }
    },
    [1, 1],
    true,
  );
  return { map, emissiveMap };
};

const desertSandTex = () =>
  makeTex(
    "dubai_sand_detail",
    512,
    512,
    (g, r) => {
      g.fillStyle = "#f4ebdc";
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 80; i++) {
        const x = r() * 512;
        const y = r() * 512;
        const rad = 24 + r() * 65;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        gr.addColorStop(0, r() < 0.5 ? "rgba(165,120,70,0.07)" : "rgba(255,250,240,0.08)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = gr;
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      g.lineWidth = 2;
      for (let j = 0; j < 44; j++) {
        const y0 = (j / 44) * 512;
        g.strokeStyle = `rgba(130,90,48,${0.09 + r() * 0.09})`;
        g.beginPath();
        for (let x = 0; x <= 512; x += 8) {
          const y = y0 + 4 * Math.sin((x / 512) * Math.PI * 6 + j * 0.6) + 1.8 * Math.sin((x / 512) * Math.PI * 14 + j);
          x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.stroke();
      }
      for (let i = 0; i < 2200; i++) {
        const v = 80 + r() * 90;
        g.fillStyle = `rgba(${v + 28},${v},${v - 28},${0.22 + r() * 0.3})`;
        g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
      }
    },
    [220, 220],
  );

const lakeWaterTex = () =>
  makeTex(
    "burj_lake_water",
    256,
    256,
    (g, r) => {
      g.fillStyle = "#19809c";
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 380; i++) {
        g.strokeStyle = r() < 0.5 ? "rgba(180,242,255,0.22)" : "rgba(8,52,70,0.24)";
        g.lineWidth = 1 + r() * 1.8;
        const x = r() * 256;
        const y = r() * 256;
        g.beginPath();
        g.moveTo(x, y);
        g.quadraticCurveTo(x + 7, y - 2, x + 15 + r() * 9, y);
        g.stroke();
      }
    },
    [10, 10],
  );

// ───────────────────────── GLSL SkyDome + Unified DubaiCanvas ─────────────────────────
const SkyDome: React.FC<{ top: THREE.Color; hor: THREE.Color; glow: number; glowCol: THREE.Color }> = ({ top, hor, glow, glowCol }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTop: { value: new THREE.Color() },
          uHor: { value: new THREE.Color() },
          uGlowCol: { value: new THREE.Color("#ffb068") },
          uGlow: { value: 0 },
        },
        vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uGlowCol; uniform float uGlow;
          varying vec3 vD;
          void main(){
            float k = smoothstep(-0.04, 0.42, vD.y);
            vec3 c = mix(uHor, uTop, k);
            vec3 sunDir = normalize(vec3(-0.78, 0.16, -0.6));
            float w = pow(max(0.0, dot(normalize(vD), sunDir)), 5.0) * (1.0 - smoothstep(-0.05, 0.55, vD.y));
            float disc = pow(max(0.0, dot(normalize(vD), sunDir)), 80.0);
            c += uGlowCol * (w * 0.65 + disc * 1.1) * uGlow;
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  mat.uniforms.uTop.value.copy(top);
  mat.uniforms.uHor.value.copy(hor);
  mat.uniforms.uGlowCol.value.copy(glowCol);
  mat.uniforms.uGlow.value = glow;
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[12000, 32, 16]} />
    </mesh>
  );
};

export const DubaiCanvas: React.FC<{
  cam: Cam;
  t?: number;
  mood?: Mood;
  /** Optional 0..1 overrides to blend smoothly between day/heat and night/sunset. */
  nightMix?: number;
  sunsetMix?: number;
  children: React.ReactNode;
  ao?: number;
  shadow?: number;
  env?: number;
  fogRange?: [number, number];
  keyPos?: V3;
  keyI?: number;
}> = ({ cam, t = 0, mood = "day", nightMix, sunsetMix, children, ao = 0.75, shadow = 40, env, fogRange, keyPos, keyI }) => {
  const { width, height } = useVideoConfig();

  const night = nightMix ?? (mood === "night" ? 1 : mood === "storm" ? 0.65 : 0);
  const sunset = sunsetMix ?? (mood === "sunset" ? 1 : 0);
  const heat = mood === "heat" ? 1 - night : 0;
  const storm = mood === "storm" ? 1 : 0;
  const day = Math.max(0, 1 - Math.max(night, sunset, storm));

  const topCol = new THREE.Color("#2b6fc2")
    .lerp(new THREE.Color("#cf7b3e"), heat * 0.45)
    .lerp(new THREE.Color("#1f2347"), sunset * 0.85)
    .lerp(new THREE.Color("#0e1726"), storm * 0.85)
    .lerp(new THREE.Color("#050916"), night);

  const horCol = new THREE.Color("#c5dff2")
    .lerp(new THREE.Color("#f7c27d"), heat)
    .lerp(new THREE.Color("#ff965a"), sunset)
    .lerp(new THREE.Color("#263547"), storm * 0.85)
    .lerp(new THREE.Color("#13203b"), night);

  const fogCol = horCol.clone().lerp(topCol, 0.14);
  const fogArgs: [number, number] = fogRange ?? (mood === "storm" ? [45, 750] : [220, 4200]);

  const sunGlow = Math.max(0.25 * day, 0.65 * heat, 1.0 * sunset) * (1 - storm * 0.8) * (1 - night * 0.9);
  const glowCol = new THREE.Color(sunset > 0.2 ? "#ff9048" : "#ffe0a4");

  const hemiSky = new THREE.Color("#e8f2fc")
    .lerp(new THREE.Color("#ffdcb3"), heat)
    .lerp(new THREE.Color("#ffaf7a"), sunset * 0.65)
    .lerp(new THREE.Color("#4a668c"), storm)
    .lerp(new THREE.Color("#2d4676"), night);
  const hemiGround = new THREE.Color("#d4b486")
    .lerp(new THREE.Color("#452b22"), sunset * 0.7)
    .lerp(new THREE.Color("#141a24"), Math.max(night, storm));
  const hemiI = 0.68 * day + 0.78 * heat + 0.45 * sunset + 0.36 * storm + 0.28 * night;

  const kPos: V3 = keyPos ?? [
    cam.look[0] - 85 * (1 - night * 0.4),
    cam.look[1] + 115 * (1 - sunset * 0.65) + 45 * sunset,
    cam.look[2] + 95,
  ];
  const kInt = keyI ?? (2.35 * day + 2.55 * heat + 1.55 * sunset + 0.85 * storm + 0.65 * night);
  const kCol = sunset > 0.35 ? "#ff9f5f" : heat > 0.4 ? "#ffdf9e" : night > 0.5 || storm > 0.4 ? "#b5ceff" : "#fff4df";

  const envI = env ?? (0.3 * day + 0.24 * heat + 0.22 * sunset + 0.14 * storm + 0.08 * night);
  const bloom = 0.28 * day + 0.24 * heat + 0.62 * sunset + 0.55 * storm + 0.72 * night;

  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      camera={{ fov: cam.fov ?? 42, near: 0.08, far: 25000 }}
      gl={{ antialias: true, toneMapping: THREE.NoToneMapping, logarithmicDepthBuffer: true }}
    >
      <CameraRig cam={cam} />
      <group position={cam.pos}>
        <SkyDome top={topCol} hor={horCol} glow={sunGlow} glowCol={glowCol} />
        {night > 0.25 || sunset > 0.45 ? (
          <Stars3D frame={t * 30} count={900} radius={9500} size={18 * Math.max(night, sunset * 0.65)} />
        ) : null}
        {sunset > 0.25 && night < 0.8 ? (
          <Glow position={[-5200, 750, -4000]} size={1600} color="#ffaa68" opacity={0.65 * sunset * (1 - night)} fog={false} />
        ) : null}
      </group>
      <fog attach="fog" args={[fogCol, fogArgs[0], fogArgs[1]]} />
      <hemisphereLight args={[hemiSky, hemiGround, hemiI]} />
      <KeyLight p={kPos} target={cam.look} intensity={kInt} color={kCol} size={shadow} />
      {children}
      <Env intensity={envI} />
      <Post bloom={bloom} ao={ao} vignette={0.28 + 0.16 * Math.max(night, storm)} />
    </ThreeCanvas>
  );
};

// ───────────────────────── Desert Dunes Terrain ─────────────────────────
const duneHeight = (x: number, z: number) => {
  const r = Math.hypot(x, z);
  const plateau = THREE.MathUtils.smoothstep(r, 240, 820);
  const w1 = Math.sin(x * 0.0055 + Math.sin(z * 0.0032) * 1.9);
  const w2 = Math.cos(z * 0.0044 - x * 0.0021);
  return plateau * (14 * (0.5 + 0.5 * w1) * (0.55 + 0.45 * w2));
};

export const DubaiDesert: React.FC<{ night?: number; sunset?: number }> = ({ night = 0, sunset = 0 }) => {
  const sand = usePbr("coast_sand_rocks_02", [550, 550]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(11000, 11000, 160, 160);
    g.rotateX(-Math.PI / 2);
    const pa = g.attributes.position as THREE.BufferAttribute;
    const ua = g.attributes.uv as THREE.BufferAttribute;
    const col = new Float32Array(pa.count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i);
      const z = pa.getZ(i);
      const sx = Math.sign(x) * Math.pow(Math.abs(x) / 5500, 1.65) * 5500;
      const sz = Math.sign(z) * Math.pow(Math.abs(z) / 5500, 1.65) * 5500;
      const y = duneHeight(sx, sz);
      pa.setXYZ(i, sx, y - 0.18, sz);
      ua.setXY(i, sx / 11000 + 0.5, sz / 11000 + 0.5);
      const crest = THREE.MathUtils.smoothstep(y, 4, 13);
      tmp.set("#d8b684").lerp(new THREE.Color("#eed3a5"), crest * 0.65);
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  const tint = new THREE.Color("#ffffff")
    .lerp(new THREE.Color("#c88a68"), sunset * 0.55)
    .lerp(new THREE.Color("#3a4258"), night * 0.78);

  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial
        map={desertSandTex()}
        normalMap={sand.normalMap}
        normalScale={new THREE.Vector2(1.1, 1.1)}
        roughnessMap={sand.roughnessMap}
        vertexColors
        color={tint}
        roughness={0.95}
      />
    </mesh>
  );
};

// ───────────────────────── Instanced Date Palms ─────────────────────────
export const DubaiPalms: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  const { trunk, frond } = useMemo(() => {
    const r = seeded(41);
    const pts: V3[] = [];
    // boulevard & Burj Park promenade palms
    for (let i = 0; i < 42; i++) {
      const a = (i / 42) * Math.PI * 2;
      const rad = 52 + (i % 3) * 18;
      pts.push([Math.cos(a) * rad, 0, Math.sin(a) * rad * 0.85]);
    }
    for (let x = -220; x <= 220; x += 22) {
      pts.push([x, 0, 88]);
      pts.push([x, 0, 108]);
    }
    const trunkG = new THREE.CylinderGeometry(0.18, 0.34, 1, 7);
    trunkG.translate(0, 0.5, 0);
    const frondG = new THREE.PlaneGeometry(1, 0.85, 5, 1);
    const pa = frondG.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) {
      const px = pa.getX(i) + 0.5;
      pa.setXYZ(i, px * 3.6, -px * px * 1.45, pa.getY(i) * (1.1 - px * 0.85));
    }
    frondG.computeVertexNormals();
    const trunkM = new THREE.MeshStandardMaterial({ color: "#78573b", roughness: 0.94 });
    const frondM = new THREE.MeshStandardMaterial({ color: "#3d7a36", roughness: 0.78, side: THREE.DoubleSide });
    const trunkI = new THREE.InstancedMesh(trunkG, trunkM, pts.length);
    const frondI = new THREE.InstancedMesh(frondG, frondM, pts.length * 8);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let k = 0;
    pts.forEach((p, idx) => {
      const h = 7 + r() * 4.5;
      q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.16, 0, (r() - 0.5) * 0.16));
      m.compose(new THREE.Vector3(...p), q, new THREE.Vector3(1, h, 1));
      trunkI.setMatrixAt(idx, m);
      const top = new THREE.Vector3(0, h, 0).applyQuaternion(q).add(new THREE.Vector3(...p));
      for (let j = 0; j < 8; j++) {
        const a = (j / 8) * Math.PI * 2 + r() * 0.35;
        q.setFromEuler(new THREE.Euler(0.12, a, (r() - 0.5) * 0.25, "YXZ"));
        const sc = 0.82 + r() * 0.32;
        m.compose(top, q, new THREE.Vector3(sc, sc, sc));
        frondI.setMatrixAt(k++, m);
      }
    });
    trunkI.castShadow = frondI.castShadow = true;
    return { trunk: trunkI, frond: frondI };
  }, []);
  return (
    <group scale={scale}>
      <primitive object={trunk} />
      <primitive object={frond} />
    </group>
  );
};

// ───────────────────────── Downtown Dubai Skyline, Lake, Fountains & Traffic ─────────────────────────
type SkylineBuilding = {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  variant: number;
  style: "address" | "chamfer" | "twin" | "stepped";
  spire: number;
  ry: number;
};

const SKYLINE_BUILDINGS: SkylineBuilding[] = [
  // Inner Downtown ring around Burj Lake & Boulevard
  { x: -125, z: -95, w: 34, d: 30, h: 165, variant: 1, style: "address", spire: 34, ry: 0.25 },
  { x: 132, z: -88, w: 32, d: 32, h: 195, variant: 0, style: "chamfer", spire: 28, ry: -0.3 },
  { x: -175, z: 25, w: 28, d: 26, h: 145, variant: 2, style: "twin", spire: 40, ry: 0.1 },
  { x: 185, z: 18, w: 30, d: 28, h: 155, variant: 3, style: "stepped", spire: 22, ry: -0.2 },
  { x: -72, z: -155, w: 36, d: 30, h: 210, variant: 0, style: "chamfer", spire: 32, ry: 0.15 },
  { x: 75, z: -162, w: 38, d: 32, h: 235, variant: 2, style: "twin", spire: 48, ry: -0.18 },
  { x: 0, z: -190, w: 58, d: 38, h: 95, variant: 1, style: "address", spire: 12, ry: 0 }, // Dubai Mall podium complex
  // Mid-ring skyscrapers along Sheikh Zayed Rd corridor
  { x: -255, z: -70, w: 34, d: 30, h: 245, variant: 2, style: "twin", spire: 50, ry: 0.4 },
  { x: -215, z: -185, w: 40, d: 34, h: 270, variant: 0, style: "stepped", spire: 42, ry: 0.22 },
  { x: 230, z: -170, w: 36, d: 32, h: 260, variant: 1, style: "address", spire: 36, ry: -0.25 },
  { x: 270, z: -65, w: 34, d: 30, h: 220, variant: 3, style: "chamfer", spire: 28, ry: -0.35 },
  { x: -145, z: -265, w: 42, d: 36, h: 295, variant: 3, style: "stepped", spire: 45, ry: 0.12 },
  { x: 145, z: -275, w: 38, d: 34, h: 285, variant: 0, style: "chamfer", spire: 55, ry: -0.1 },
  { x: 18, z: -310, w: 40, d: 36, h: 310, variant: 2, style: "twin", spire: 52, ry: 0.05 },
  { x: -295, z: 120, w: 32, d: 28, h: 175, variant: 0, style: "stepped", spire: 26, ry: 0.3 },
  { x: 295, z: 125, w: 34, d: 28, h: 185, variant: 1, style: "address", spire: 30, ry: -0.28 },
  { x: -185, z: 165, w: 30, d: 26, h: 140, variant: 3, style: "chamfer", spire: 20, ry: 0.15 },
  { x: 195, z: 165, w: 30, d: 26, h: 150, variant: 2, style: "stepped", spire: 24, ry: -0.15 },
  // Distant outer skyline silhouette
  { x: -390, z: -210, w: 44, d: 38, h: 250, variant: 1, style: "address", spire: 40, ry: 0.2 },
  { x: 390, z: -220, w: 44, d: 38, h: 265, variant: 0, style: "stepped", spire: 38, ry: -0.2 },
  { x: -320, z: -340, w: 46, d: 40, h: 330, variant: 2, style: "chamfer", spire: 46, ry: 0.1 },
  { x: 320, z: -345, w: 46, d: 40, h: 320, variant: 3, style: "twin", spire: 44, ry: -0.1 },
  { x: -95, z: -410, w: 48, d: 42, h: 280, variant: 0, style: "stepped", spire: 35, ry: 0 },
  { x: 115, z: -420, w: 48, d: 42, h: 290, variant: 1, style: "address", spire: 36, ry: 0.08 },
];

export const DowntownDubai: React.FC<{
  t?: number;
  scale?: number;
  night?: number;
  sunset?: number;
  showFountain?: boolean;
  showBoulevard?: boolean;
  showSkyline?: boolean;
}> = ({ t = 0, scale = 1, night = 0, sunset = 0, showFountain = true, showBoulevard = true, showSkyline = true }) => {
  const stone = usePbr("concrete_floor_02", [10, 10]);
  const asphalt = useMemo(() => tex("asphalt", "#252930", [18, 2], 12), []);
  const water = lakeWaterTex();
  const mats = useMemo(() => [0, 1, 2, 3].map((v) => dubaiTowerMaps(v)), []);
  const lit = Math.max(night, sunset * 0.72);
  const lakeColor = new THREE.Color("#1f98ba").lerp(new THREE.Color("#e88a58"), sunset * 0.35).lerp(new THREE.Color("#0e3854"), night * 0.8);

  // Shimmering parabolic fountain water jets (pre-built unit curves scaled per frame)
  const fountainJets = useMemo(() => {
    const out: { geo: THREE.TubeGeometry; fx: number }[] = [];
    for (let j = 0; j < 11; j++) {
      const fx = -28 + j * 5.6;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(fx, 0, 40),
        new THREE.Vector3(fx * 1.03, 0.68, 41.5),
        new THREE.Vector3(fx * 1.06, 1.0, 43),
        new THREE.Vector3(fx * 1.1, 0.45, 45.5),
      ]);
      out.push({ geo: new THREE.TubeGeometry(curve, 12, 0.55, 6, false), fx });
    }
    return out;
  }, []);

  return (
    <group scale={scale}>
      <DubaiDesert night={night} sunset={sunset} />

      {/* Burj Park stone plaza */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[62, 66, 0.35, 48]} />
        <meshStandardMaterial
          map={stone.map}
          normalMap={stone.normalMap}
          roughnessMap={stone.roughnessMap}
          color={night > 0.5 ? "#505a68" : sunset > 0.3 ? "#e8cbb0" : "#e6dfd0"}
          roughness={0.78}
        />
      </mesh>

      {/* Crescent Burj Lake in front of the plaza */}
      <mesh position={[0, 0.14, 42]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.5, 1]} receiveShadow>
        <circleGeometry args={[52, 48]} />
        <meshStandardMaterial map={water} color={lakeColor} roughness={0.14} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.18, 42]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.5, 1]} receiveShadow>
        <ringGeometry args={[51.5, 53.5, 48]} />
        <meshStandardMaterial color={night > 0.5 ? "#4a5360" : "#dcd3be"} roughness={0.7} />
      </mesh>

      {/* Dubai Fountain choreographed water arcs */}
      {showFountain ? (
        <group>
          {fountainJets.map((jet, j) => {
            const dist = Math.abs(jet.fx) / 28;
            const h = (36 - dist * 16) * (0.75 + 0.25 * Math.sin(t * 2.6 + j * 0.85));
            return (
              <mesh key={j} position={[0, 0.2, 0]} scale={[1, h, 1]} geometry={jet.geo}>
                <meshStandardMaterial
                  color="#ddf8ff"
                  emissive={sunset > 0.3 || night > 0.3 ? "#ffd88f" : "#9ae6ff"}
                  emissiveIntensity={0.7 + lit * 1.9}
                  roughness={0.2}
                  transparent
                  opacity={0.88}
                />
              </mesh>
            );
          })}
        </group>
      ) : null}

      <DubaiPalms />

      {/* Sheikh Zayed Road foreground boulevard + moving traffic */}
      {showBoulevard ? (
        <group>
          <Slab p={[0, 0.05, 98]} s={[640, 0.1, 18]} map={asphalt} rough={0.88} />
          <Slab p={[0, 0.12, 98]} s={[640, 0.04, 1.4]} color={night > 0.5 ? "#3b424c" : "#d0c8b4"} rough={0.8} />
          {Array.from({ length: 24 }, (_, i) => (
            <Slab key={i} p={[-290 + i * 25, 0.11, 93.5]} s={[8, 0.02, 0.4]} color="#eef2f6" rough={0.5} />
          ))}
          {Array.from({ length: 24 }, (_, i) => (
            <Slab key={i + 50} p={[-290 + i * 25, 0.11, 102.5]} s={[8, 0.02, 0.4]} color="#eef2f6" rough={0.5} />
          ))}
          {[-180, -120, -60, 0, 60, 120, 180].map((lx) => (
            <group key={lx} position={[lx, 0.1, 98]} scale={2.4}>
              <Streetlight p={[0, 0, 0]} on={lit} />
            </group>
          ))}
          {Array.from({ length: 14 }, (_, i) => {
            const dir = i % 2 === 0 ? 1 : -1;
            const span = 520;
            const x = ((i * 73 + t * 24 * dir) % span + span) % span - span / 2;
            const carColors = ["#f0f4f8", "#1d222c", "#c6392c", "#2d6ea3", "#c8a45c", "#7b8794"];
            return (
              <group key={i} position={[x, 0.12, dir > 0 ? 102 : 94]} rotation={[0, dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0]} scale={1.45}>
                <Car p={[0, 0, 0]} color={carColors[i % carColors.length]} head={lit} tail={lit} />
              </group>
            );
          })}
        </group>
      ) : null}

      {/* Architectural Downtown Dubai skyscrapers */}
      {showSkyline
        ? SKYLINE_BUILDINGS.map((b, i) => {
            const m = mats[b.variant % mats.length];
            const baseTint = new THREE.Color("#ffffff").lerp(new THREE.Color("#ffc9a2"), sunset * 0.35).lerp(new THREE.Color("#5a6e88"), night * 0.6);
            return (
              <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.ry, 0]}>
                {/* Retail podium */}
                <RB p={[0, 8, 0]} s={[b.w * 1.28, 16, b.d * 1.22]} r={0.8} color={night > 0.5 ? "#26303d" : "#d8ccb8"} rough={0.75} />
                {/* Main shaft */}
                <mesh position={[0, b.h * 0.45, 0]} castShadow receiveShadow>
                  <boxGeometry args={[b.w, b.h * 0.9, b.d]} />
                  <meshStandardMaterial
                    map={m.map}
                    emissiveMap={m.emissiveMap}
                    emissive="#ffffff"
                    emissiveIntensity={lit * 1.1}
                    color={baseTint}
                    metalness={0.55}
                    roughness={0.26}
                  />
                </mesh>
                {/* Variant crown architecture */}
                {b.style === "twin" ? (
                  <>
                    <mesh position={[-b.w * 0.22, b.h * 0.96, 0]} castShadow>
                      <boxGeometry args={[b.w * 0.38, b.h * 0.2, b.d * 0.72]} />
                      <meshStandardMaterial map={m.map} emissiveMap={m.emissiveMap} emissive="#ffffff" emissiveIntensity={lit * 1.1} color={baseTint} metalness={0.65} roughness={0.22} />
                    </mesh>
                    <mesh position={[b.w * 0.22, b.h * 0.94, 0]} castShadow>
                      <boxGeometry args={[b.w * 0.38, b.h * 0.16, b.d * 0.72]} />
                      <meshStandardMaterial map={m.map} emissiveMap={m.emissiveMap} emissive="#ffffff" emissiveIntensity={lit * 1.1} color={baseTint} metalness={0.65} roughness={0.22} />
                    </mesh>
                    <Cyl p={[-b.w * 0.22, b.h * 1.06 + b.spire * 0.5, 0]} r={0.8} r2={0.18} h={b.spire} color="#dce6f0" metal={0.85} />
                  </>
                ) : b.style === "address" ? (
                  <>
                    <RB p={[0, b.h * 0.92, 0]} s={[b.w * 0.76, b.h * 0.12, b.d * 0.76]} r={1.2} color={night > 0.5 ? "#38465a" : "#e5d5bc"} metal={0.35} rough={0.45} />
                    <Cyl p={[0, b.h * 0.98 + b.spire * 0.45, 0]} r={0.9} r2={0.2} h={b.spire} color="#e6edf5" metal={0.85} />
                  </>
                ) : (
                  <>
                    <mesh position={[0, b.h * 0.95, 0]} castShadow>
                      <boxGeometry args={[b.w * 0.7, b.h * 0.14, b.d * 0.7]} />
                      <meshStandardMaterial map={m.map} emissiveMap={m.emissiveMap} emissive="#ffffff" emissiveIntensity={lit * 1.2} color={baseTint} metalness={0.62} roughness={0.22} />
                    </mesh>
                    <Cyl p={[0, b.h * 1.02 + b.spire * 0.5, 0]} r={0.75} r2={0.16} h={b.spire} color="#d6e2ee" metal={0.88} />
                  </>
                )}
              </group>
            );
          })
        : null}
    </group>
  );
};

// ───────────────────────── Layered Soft Cloud Deck ─────────────────────────
export const CloudDeck: React.FC<{
  y?: number;
  count?: number;
  seed?: number;
  spread?: number;
  t?: number;
  scale?: number;
  tint?: string;
  opacity?: number;
}> = ({ y = -4, count = 14, seed = 19, spread = 42, t = 0, scale = 1, tint = "#ffffff", opacity = 0.92 }) => {
  const clouds = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: count }, (_, i) => ({
      x: (r() - 0.5) * spread * 2.2,
      y: y + (r() - 0.5) * 4.5,
      z: -6 - r() * spread * 1.4,
      s: (0.75 + r() * 0.95) * scale,
      speed: 0.15 + r() * 0.25,
      idx: i,
    }));
  }, [count, seed, spread, y, scale]);

  const puffs: V3[] = [
    [0, 0.25, 0],
    [-0.9, 0.05, 0.12],
    [0.95, 0.08, -0.08],
    [-0.42, 0.42, -0.18],
    [0.48, 0.36, 0.18],
    [-1.45, -0.1, -0.15],
    [1.48, -0.08, 0.15],
  ];
  const puffScales: V3[] = [
    [1.15, 0.65, 0.95],
    [0.92, 0.52, 0.82],
    [0.95, 0.55, 0.85],
    [0.78, 0.54, 0.72],
    [0.8, 0.5, 0.74],
    [0.7, 0.4, 0.68],
    [0.72, 0.42, 0.68],
  ];

  return (
    <group>
      {clouds.map((c) => {
        const span = spread * 2.4;
        const dx = (((c.x + t * c.speed) % span) + span) % span - span / 2;
        return (
          <group key={c.idx} position={[dx, c.y, c.z]} scale={c.s}>
            {puffs.map((p, k) => (
              <mesh key={k} position={p} scale={puffScales[k]}>
                <sphereGeometry args={[1, 14, 10]} />
                <meshStandardMaterial color={tint} roughness={0.95} metalness={0} transparent opacity={opacity} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};
