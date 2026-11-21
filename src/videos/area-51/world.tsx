import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow, Stars3D } from "../../lib/three/core";
import { Env, KeyLight, Post } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";

/** Dry lake (Groom Lake) centre and radii; the runway runs along X at z = 0 on its south shore. */
export const LAKE = { c: [0, 0, -600] as [number, number, number], rx: 1300, rz: 520 };

/** Sky: desert blue by day → orange horizon + violet top at dusk. */
const Sky: React.FC<{ dusk: number }> = ({ dusk }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uGlow: { value: 0 } },
        vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform float uGlow; varying vec3 vD;
          void main(){
            float k = smoothstep(-0.03, 0.5, vD.y);
            vec3 c = mix(uHor, uTop, k);
            // sunset glow towards -X (west)
            float w = pow(max(0.0, dot(normalize(vec3(vD.x, 0.0, vD.z)), vec3(-1.0, 0.0, 0.0))), 3.0) * (1.0 - smoothstep(0.0, 0.35, vD.y));
            c += vec3(1.0, 0.45, 0.15) * w * uGlow;
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  mat.uniforms.uTop.value.copy(new THREE.Color("#3b7fd0").lerp(new THREE.Color("#2a2350"), dusk));
  mat.uniforms.uHor.value.copy(new THREE.Color("#d9e6ef").lerp(new THREE.Color("#ff9a5a"), dusk));
  mat.uniforms.uGlow.value = 0.9 * dusk;
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[9000, 32, 16]} />
    </mesh>
  );
};

/** Cracked white salt crust for the dry lake. */
const saltTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const S = 1024;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    g.fillStyle = "#e9e3d6";
    g.fillRect(0, 0, S, S);
    let r = 11;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    // polygon cracks: jittered grid cells
    const N = 14;
    const pts: [number, number][][] = [];
    for (let y = 0; y <= N; y++) {
      pts.push([]);
      for (let x = 0; x <= N; x++) pts[y].push([(x + (x % N ? (rnd() - 0.5) * 0.7 : 0)) * (S / N), (y + (y % N ? (rnd() - 0.5) * 0.7 : 0)) * (S / N)]);
    }
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const v = 226 + Math.floor(rnd() * 20);
        g.fillStyle = `rgb(${v},${v - 4},${v - 14})`;
        g.beginPath();
        g.moveTo(...pts[y][x]);
        g.lineTo(...pts[y][x + 1]);
        g.lineTo(...pts[y + 1][x + 1]);
        g.lineTo(...pts[y + 1][x]);
        g.closePath();
        g.fill();
        g.strokeStyle = "rgba(120,105,85,0.55)";
        g.lineWidth = 3;
        g.stroke();
      }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(60, 24);
    t.anisotropy = 8;
    return t;
  };
})();

/** The mountain ring: a polar grid of RING.nA × RING.nR cells from r0 to r1. */
const RING = { nA: 720, nR: 90, r0: 2400, r1: 5200 };
/** height of ring grid vertex (i around, j outwards) */
const ringV = (i: number, j: number) => {
  const k = j / RING.nR;
  const a = (i / RING.nA) * Math.PI * 2;
  const ridge = Math.sin(k * Math.PI);
  const n = 0.55 + 0.25 * Math.sin(a * 7 + 1.3) + 0.15 * Math.sin(a * 17 + 0.4) + 0.08 * Math.sin(a * 41 + k * 9);
  // gullies and ridgelets so the slopes don't read as smooth paper
  const gully = 0.1 * Math.sin(a * 140 + Math.sin(k * 20) * 3) * Math.sin(k * Math.PI) + 0.05 * Math.sin(a * 330 + k * 40);
  const h = ridge * n * 780 * (0.8 + 0.4 * Math.sin(k * 11 + a * 3)) * (1 + gully);
  return Math.max(0, h) - 2;
};

/** Ground height at (x, z) on the ring mesh itself (interpolated over its triangles, so people stand on it); 0 off the ring. */
export const ringH = (x: number, z: number) => {
  let a = Math.atan2(z, x);
  if (a < 0) a += Math.PI * 2;
  const u0 = (a / (Math.PI * 2)) * RING.nA;
  const v0 = ((Math.hypot(x, z) - RING.r0) / (RING.r1 - RING.r0)) * RING.nR;
  if (v0 <= 0 || v0 >= RING.nR) return 0;
  const i = Math.floor(u0);
  const j = Math.floor(v0);
  const u = u0 - i;
  const v = v0 - j;
  const h00 = ringV(i, j);
  const h10 = ringV(i + 1, j);
  const h01 = ringV(i, j + 1);
  const h11 = ringV(i + 1, j + 1);
  // same split as the index buffer: (a, b, a+1) and (b, b+1, a+1)
  return Math.max(0, u + v <= 1 ? h00 + u * (h10 - h00) + v * (h01 - h00) : h11 + (1 - u) * (h01 - h11) + (1 - v) * (h10 - h11));
};

/** Desert floor + the dry lake + a ring of rocky mountains (heights from layered sines). */
export const Terrain: React.FC = () => {
  const sand = usePbr("coast_sand_rocks_02", [500, 500]);
  const rock = usePbr("brown_mud_rocks_01", [240, 24]);
  const lake = useMemo(() => {
    const g = new THREE.CircleGeometry(1, 96);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const ring = useMemo(() => {
    // polar grid from r0 to r1; height rises then falls, with noisy peaks
    const { nA, nR, r0, r1 } = RING;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let j = 0; j <= nR; j++) {
      const k = j / nR;
      for (let i = 0; i <= nA; i++) {
        const a = (i / nA) * Math.PI * 2;
        const rr = r0 + (r1 - r0) * k;
        pos.push(Math.cos(a) * rr, ringV(i, j), Math.sin(a) * rr);
        uv.push(i / nA, k);
      }
    }
    for (let j = 0; j < nR; j++)
      for (let i = 0; i < nA; i++) {
        const a = j * (nA + 1) + i;
        const b = a + nA + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12000, 12000]} />
        <meshStandardMaterial {...sand} color="#ffe6bf" roughness={0.95} />
      </mesh>
      <mesh geometry={lake} position={[LAKE.c[0], 0.4, LAKE.c[2]]} scale={[LAKE.rx, 1, LAKE.rz]} receiveShadow>
        <meshStandardMaterial map={saltTex()} roughness={0.9} />
      </mesh>
      <mesh geometry={ring} receiveShadow>
        <meshStandardMaterial {...rock} color="#f2c79a" roughness={0.95} />
      </mesh>
    </group>
  );
};

/** The 3.7 km main runway along X (origin = runway centre), with edge lines, centre dashes, numbers and threshold bars. */
export const Runway: React.FC<{ len?: number }> = ({ len = 3600 }) => {
  const asph = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#3a3c40";
    g.fillRect(0, 0, 64, 512);
    let r = 5;
    const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 3000; i++) {
      const v = 40 + Math.floor(rnd() * 40);
      g.fillStyle = `rgb(${v},${v},${v + 2})`;
      g.fillRect(rnd() * 64, rnd() * 512, 1, 1);
    }
    g.fillStyle = "#e9e6dc";
    g.fillRect(2, 0, 2, 512);
    g.fillRect(60, 0, 2, 512);
    g.fillRect(31, 0, 2, 220);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, len / 60);
    t.anisotropy = 8;
    return t;
  }, [len]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.06, 0]} receiveShadow>
        <planeGeometry args={[60, len]} />
        <meshStandardMaterial map={asph} roughness={0.85} />
      </mesh>
      {/* threshold bars at both ends */}
      {[-1, 1].map((s) =>
        Array.from({ length: 8 }, (_, i) => (
          <mesh key={`${s}${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[s * (len / 2 - 30), 0.07, -24 + i * 6.8]}>
            <planeGeometry args={[40, 3]} />
            <meshStandardMaterial color="#ece9e0" roughness={0.8} />
          </mesh>
        )),
      )}
      {/* taxiway to the apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, 80]} receiveShadow>
        <planeGeometry args={[30, 110]} />
        <meshStandardMaterial map={asph} roughness={0.85} />
      </mesh>
    </group>
  );
};

/**
 * The desert world of this reel. `dusk` 0–1 lowers the sun in the west, turns the sky orange/violet, brings out stars.
 */
/** `sun` overrides the key light offset from the look point (default: from the west/south, above). */
export const DesertCanvas: React.FC<{ cam: Cam; t: number; dusk?: number; children: React.ReactNode; ao?: number; sun?: [number, number, number] }> = ({ cam, t, dusk = 0, children, ao = 0.8, sun }) => {
  const { width, height } = useVideoConfig();
  const day = 1 - dusk;
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.2, far: 20000 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping, logarithmicDepthBuffer: true }}>
      <CameraRig cam={cam} />
      <group position={cam.pos}>
        <Sky dusk={dusk} />
        {dusk > 0.5 ? <Stars3D frame={t * 30} count={500} radius={8000} size={18 * (dusk - 0.5)} /> : null}
        {dusk > 0.2 ? <Glow position={[-7000, 400, 0]} size={1800} color="#ffb070" opacity={0.7 * dusk} fog={false} /> : null}
      </group>
      <fog attach="fog" args={[new THREE.Color("#e8d8c2").lerp(new THREE.Color("#c27a5a"), dusk), 1800, 14000]} />
      <hemisphereLight args={[new THREE.Color("#dfe9f5").lerp(new THREE.Color("#7a5a8a"), dusk), new THREE.Color("#c89a6a").lerp(new THREE.Color("#3a2a30"), dusk), 0.75 * day + 0.3 * dusk]} />
      <KeyLight p={sun ? [cam.look[0] + sun[0], cam.look[1] + sun[1], cam.look[2] + sun[2]] : [cam.look[0] - 80, cam.look[1] + 120 * day + 15 * dusk, cam.look[2] + 50 * day]} target={cam.look} intensity={2.3 * day + 1.2 * dusk} color={dusk > 0.5 ? "#ff9a5a" : "#fff0d6"} size={90} />
      <Terrain />
      {children}
      <Env intensity={0.26 * day + 0.12 * dusk} />
      <Post bloom={0.45 + 0.4 * dusk} ao={ao} vignette={0.4} />
    </ThreeCanvas>
  );
};
