import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow, Stars3D, V3 } from "../../lib/three/core";
import { Env, KeyLight, Post, RB } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";
import { Jelly } from "../submarine/ocean";

/**
 * The internet reel's sea: one ocean cut open like a doll's house (metres, y = 0 is the sea surface, NOT to scale in depth).
 *   x < 0  the beach (landing station at BEACH_X), the cable goes into the surf at x = 0
 *   0…SHELF_X  the continental shelf (gentle, down to SHELF_Y), then the slope, then the abyss from ABYSS_X at ABYSS_Y
 * The cable lies on the floor along z = 0. The cut face is at z = FRONT; the camera stays in front of it.
 */
export const FRONT = 8;
export const BACK = -60;
export const BEACH_X = -26;
export const SHELF_X = 420;
export const SHELF_Y = -110;
export const ABYSS_X = 640;
export const ABYSS_Y = -760;
export const END_X = 1500;

/** floor height along the route (z = 0 line) */
export const floorY = (x: number) => {
  if (x < -40) return 3.2 + 0.2 * Math.sin(x * 0.2);
  if (x < 0) return 3.2 * Math.pow(-x / 40, 0.9);
  if (x < SHELF_X) return SHELF_Y * Math.pow(x / SHELF_X, 0.85) + 1.2 * Math.sin(x * 0.05);
  if (x < ABYSS_X) {
    const k = (x - SHELF_X) / (ABYSS_X - SHELF_X);
    return SHELF_Y + (ABYSS_Y - SHELF_Y) * (0.5 - 0.5 * Math.cos(Math.PI * k));
  }
  return ABYSS_Y + 6 * Math.sin(x * 0.012) + 3 * Math.sin(x * 0.041);
};
/** floor height anywhere (small ripples across z) */
export const bedY = (x: number, z: number) => floorY(x) + (x > 0 ? 0.35 * Math.sin(x * 0.23 + z * 0.4) * Math.cos(z * 0.17) : 0.08 * Math.sin(x * 0.7 + z));
/** the real sand height along the cable line (z = 0), ripples included: everything on the cable sits on this */
export const groundY = (x: number) => bedY(x, 0);

const STOPS: [number, string][] = [
  [0, "#43c3d6"],
  [15, "#2a9fc9"],
  [60, "#16719f"],
  [140, "#0c4a80"],
  [300, "#072b56"],
  [520, "#04173a"],
  [800, "#020b1f"],
];
export const waterColor = (d: number) => {
  const dd = Math.max(0, d);
  for (let i = 1; i < STOPS.length; i++) {
    if (dd <= STOPS[i][0]) {
      const [a, ca] = STOPS[i - 1];
      const [b, cb] = STOPS[i];
      return new THREE.Color(ca).lerp(new THREE.Color(cb), (dd - a) / (b - a));
    }
  }
  return new THREE.Color(STOPS[STOPS.length - 1][1]);
};
const GLSL_STOPS = `
vec3 waterCol(float d){
  d = max(d, 0.0);
  ${STOPS.slice(1)
    .map(([b, cb], i) => {
      const [a, ca] = STOPS[i];
      const A = new THREE.Color(ca);
      const B = new THREE.Color(cb);
      return `if (d <= ${b.toFixed(1)}) return mix(vec3(${A.r.toFixed(4)},${A.g.toFixed(4)},${A.b.toFixed(4)}), vec3(${B.r.toFixed(4)},${B.g.toFixed(4)},${B.b.toFixed(4)}), (d - ${a.toFixed(1)}) / ${(b - a).toFixed(1)});`;
    })
    .join("\n  ")}
  return vec3(${new THREE.Color(STOPS[STOPS.length - 1][1]).toArray().map((v) => v.toFixed(4)).join(",")});
}`;

/** far wall of the water: colour by depth + soft light shafts near the surface; `night` darkens the top */
const Backdrop: React.FC<{ t: number; night: number }> = ({ t, night }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uNight: { value: 0 } },
        vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `${GLSL_STOPS}
          varying vec3 vW; uniform float uT; uniform float uNight;
          void main(){
            float d = -vW.y;
            vec3 c = waterCol(d);
            float rays = 0.5 + 0.5 * sin(vW.x * 0.07 + d * 0.02 + uT * 0.25) * sin(vW.x * 0.019 - uT * 0.13);
            c += vec3(0.16, 0.24, 0.26) * pow(rays, 2.5) * exp(-d / 50.0) * (1.0 - uNight);
            c *= 1.0 - 0.75 * uNight * exp(-d / 300.0);
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  mat.uniforms.uT.value = t;
  mat.uniforms.uNight.value = night;
  return (
    <mesh position={[(END_X - 60) / 2, (ABYSS_Y - 40) / 2, BACK]} material={mat}>
      <planeGeometry args={[END_X + 200, -ABYSS_Y + 60]} />
    </mesh>
  );
};

/** the cut face: a coloured veil that tints everything behind it by depth */
const FrontGlass: React.FC<{ night: number }> = ({ night }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        uniforms: { uNight: { value: 0 } },
        fragmentShader: `${GLSL_STOPS}
          varying vec3 vW; uniform float uNight;
          void main(){
            float d = -vW.y;
            if (d < 0.0) discard;
            float a = 0.1 + 0.38 * smoothstep(0.0, 700.0, d) + 0.15 * uNight;
            gl_FragColor = vec4(waterCol(d) * (1.0 - 0.6 * uNight), a);
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  mat.uniforms.uNight.value = night;
  return (
    <group>
      <mesh position={[(END_X - 60) / 2, (ABYSS_Y - 40) / 2, FRONT]} material={mat} renderOrder={10}>
        <planeGeometry args={[END_X + 200, -ABYSS_Y + 40]} />
      </mesh>
      <mesh position={[(END_X + 0) / 2, -0.05, FRONT + 0.01]} renderOrder={11}>
        <planeGeometry args={[END_X, 0.12]} />
        <meshBasicMaterial color="#d9fbff" transparent opacity={0.85 * (1 - 0.6 * night)} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** sea surface with a gentle swell, starting at the shoreline */
const Surface: React.FC<{ t: number; night: number }> = ({ t, night }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(END_X, 600, 300, 60);
    g.rotateX(-Math.PI / 2);
    g.translate(END_X / 2 + 2, 0, FRONT - 300);
    return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3];
    const z = base[i * 3 + 2];
    const edge = Math.min(1, (FRONT - z) / 3) * Math.min(1, Math.max(0, x - 2) / 12);
    pos.setY(i, edge * (0.25 * Math.sin(x * 0.18 + t * 1.2) + 0.18 * Math.sin(z * 0.23 - t * 1.0) + 0.08 * Math.sin((x + z) * 0.6 + t * 2.0)));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} receiveShadow>
      <meshPhysicalMaterial color={night > 0.5 ? "#0c2a40" : "#1f87ad"} roughness={0.22} metalness={0.05} clearcoat={0.5} clearcoatRoughness={0.25} side={THREE.DoubleSide} transparent opacity={0.66} depthWrite={false} />
    </mesh>
  );
};

/** the cut through the ground: layered sediments (sand, clay, gravel, rock) that follow the sea floor */
const STRATA_W = 60;
const STRATA_H = 40;
let strataT: THREE.Texture | null = null;
const strataTex = () => {
  if (strataT) return strataT;
  const W = 1024;
  const H = 1024;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const r = seeded(5);
  // bands from the top (just under the sand) down: [thickness 0–1, colour]
  const bands: [number, string][] = [
    [0.035, "#d8c39a"],
    [0.06, "#c2a676"],
    [0.05, "#9c7e58"],
    [0.09, "#b49064"],
    [0.04, "#7d6448"],
    [0.12, "#8f7656"],
    [0.06, "#6d5a46"],
    [0.14, "#7a6652"],
    [0.4, "#5a4c40"],
  ];
  let y = 0;
  for (const [h, col] of bands) {
    const hh = h * H;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= W; x += 32) g.lineTo(x, y + 6 * Math.sin(x * 0.012 + y) + 4 * (r() - 0.5));
    for (let x = W; x >= 0; x -= 32) g.lineTo(x, y + hh + 6 * Math.sin(x * 0.012 + y + hh) + 4 * (r() - 0.5));
    g.closePath();
    g.fill();
    y += hh;
  }
  // grain, pebbles and a few rocks (more and bigger deeper down)
  for (let i = 0; i < 2600; i++) {
    const py = Math.pow(r(), 0.8) * H;
    const px = r() * W;
    const s = 1 + r() * (2 + (py / H) * 9);
    g.fillStyle = r() > 0.5 ? "rgba(255,240,210,0.18)" : "rgba(40,28,18,0.28)";
    g.beginPath();
    g.ellipse(px, py, s, s * (0.6 + r() * 0.4), r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 40; i++) {
    const py = H * (0.45 + r() * 0.55);
    const px = r() * W;
    const s = 10 + r() * 26;
    g.fillStyle = r() > 0.5 ? "#4a4038" : "#6a5c4e";
    g.beginPath();
    g.ellipse(px, py, s, s * 0.6, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  strataT = new THREE.CanvasTexture(c);
  strataT.wrapS = THREE.RepeatWrapping;
  strataT.wrapT = THREE.MirroredRepeatWrapping;
  strataT.colorSpace = THREE.SRGBColorSpace;
  strataT.anisotropy = 8;
  return strataT;
};

/** sea floor + the beach, with the cut face below it */
const Floor: React.FC = () => {
  const sand = usePbr("coast_sand_rocks_02", [120, 6]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(END_X + 160, FRONT - BACK, 1100, 34); // 2 m rows: one row runs exactly along the cable (z = 0)
    g.rotateX(-Math.PI / 2);
    g.translate((END_X + 160) / 2 - 140, 0, (FRONT + BACK) / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, bedY(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  const cutGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(END_X + 160, 100, 900, 1);
    const p = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + (END_X + 160) / 2 - 140;
      const top = p.getY(i) > 0;
      const y = top ? bedY(x, FRONT) : ABYSS_Y - 120;
      p.setX(i, x);
      p.setY(i, y);
      p.setZ(i, FRONT + 0.02); // in front of the water veil: the earth is not tinted blue
      // u along the route, v = depth below the sand (0 at the top): the strata follow the floor
      uv.setXY(i, x / STRATA_W, top ? 1 : 1 - (bedY(x, FRONT) - y) / STRATA_H); // v = 1 is the top of the canvas (flipY)
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial map={sand.map} normalMap={sand.normalMap} roughnessMap={sand.roughnessMap} color="#d2c2a2" roughness={1} />
      </mesh>
      <mesh geometry={cutGeo}>
        <meshStandardMaterial map={strataTex()} roughness={1} />
      </mesh>
    </group>
  );
};

/** marine snow in a box around a centre */
const Snow: React.FC<{ center: V3; t: number; amount: number; box?: V3 }> = ({ center, t, amount, box = [90, 70, FRONT - BACK - 4] }) => {
  const N = 600;
  const seeds = useMemo(() => {
    const r = seeded(19);
    return Array.from({ length: N }, () => [r(), r(), r(), r()]);
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }, []);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const wrap = (v: number, size: number, ctr: number) => ctr - size / 2 + ((((v - (ctr - size / 2)) % size) + size) % size);
  for (let i = 0; i < N; i++) {
    const [a, b, c2, d] = seeds[i];
    const x = wrap(a * 900 + Math.sin(t * 0.3 + d * 6) * 0.5, box[0], center[0]);
    const y = wrap(b * 900 - t * 0.2 * (0.5 + d), box[1], center[1]);
    p.setXYZ(i, x, Math.min(-0.5, y), BACK + 2 + c2 * box[2]);
  }
  p.needsUpdate = true;
  return (
    <points geometry={geo}>
      <pointsMaterial color="#cfe8ff" size={0.14} sizeAttenuation transparent opacity={0.5 * amount} depthWrite={false} />
    </points>
  );
};

// ───────────────────────── life on the floor: rocks, sea grass, fish, deep-sea jellies ─────────────────────────
const SeaLife: React.FC<{ t: number; near: number }> = ({ t, near }) => {
  const rockTex = usePbr("coast_sand_rocks_02", [1, 1]);
  const rockGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      v.multiplyScalar(1 + 0.2 * Math.sin(v.x * 5.1 + v.y * 3.3) * Math.cos(v.z * 4.7));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const rocks = useMemo(() => {
    const r = seeded(77);
    const out: { x: number; z: number; s: number; ry: number; sq: number }[] = [];
    while (out.length < 260) {
      const x = 4 + r() * 1350;
      const z = BACK + 4 + r() * (FRONT - BACK - 6);
      if (Math.abs(z) < 2.6) continue; // keep the cable line clear
      out.push({ x, z, s: 0.25 + Math.pow(r(), 2.4) * 2.2, ry: r() * 6, sq: 0.45 + r() * 0.4 });
    }
    return out;
  }, []);
  const grass = useMemo(() => {
    const r = seeded(91);
    const out: { x: number; z: number; h: number; ph: number; lean: number }[] = [];
    while (out.length < 150) {
      const x = 6 + r() * 200;
      const z = BACK + 6 + r() * (FRONT - BACK - 8);
      if (Math.abs(z) < 2.2) continue;
      for (let k = 0; k < 4; k++) out.push({ x: x + (r() - 0.5) * 0.8, z: z + (r() - 0.5) * 0.8, h: 0.8 + r() * 1.6, ph: r() * 6, lean: (r() - 0.5) * 0.4 });
    }
    return out;
  }, []);
  const fish = useMemo(() => {
    const r = seeded(13);
    return [
      [118, -30, -10],
      [205, -48, -18],
      [300, -74, -8],
      [160, -24, -30],
    ].flatMap(([cx, cy, cz], si) => Array.from({ length: 26 }, () => ({ c: [cx, cy, cz] as V3, r: 1.5 + r() * 4, ph: r() * Math.PI * 2, y: (r() - 0.5) * 3, sp: 0.25 + r() * 0.15, s: 0.22 + r() * 0.12, si })));
  }, []);
  return (
    <group>
      {rocks.map((q, i) => (
        <mesh key={i} geometry={rockGeo} position={[q.x, bedY(q.x, q.z) + q.s * q.sq * 0.3, q.z]} rotation={[0, q.ry, 0]} scale={[q.s, q.s * q.sq, q.s * 0.9]} castShadow receiveShadow>
          <meshStandardMaterial map={rockTex.map} normalMap={rockTex.normalMap} color={q.x > ABYSS_X ? "#5a5a58" : "#8a8070"} roughness={0.95} />
        </mesh>
      ))}
      {near > 0
        ? grass.map((q, i) => (
            <mesh key={i} position={[q.x, bedY(q.x, q.z) + q.h / 2, q.z]} rotation={[0.15 * Math.sin(t * 1.1 + q.ph), q.ph, q.lean + 0.12 * Math.sin(t * 0.9 + q.ph)]}>
              <planeGeometry args={[0.12, q.h, 1, 4]} />
              <meshStandardMaterial color={i % 3 ? "#4f8a3a" : "#6a9a3a"} roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          ))
        : null}
      {fish.map((q, i) => {
        const a = q.ph + t * q.sp;
        const x = q.c[0] + Math.cos(a) * q.r * 1.8;
        const z = q.c[2] + Math.sin(a) * q.r * 0.6;
        const wag = Math.sin(t * 9 + i) * 0.35;
        return (
          <group key={i} position={[x, q.c[1] + q.y + Math.sin(t * 1.2 + i) * 0.2, z]} rotation={[0, -a, 0]} scale={[q.s, q.s, q.s]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.5, 1.4, 0.8]}>
              <sphereGeometry args={[0.5, 12, 8]} />
              <meshStandardMaterial color={q.si % 2 ? "#c9b98a" : "#b9c7d2"} metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, -0.8]} rotation={[0, wag, 0]}>
              <coneGeometry args={[0.3, 0.5, 4]} />
              <meshStandardMaterial color="#8fa3b3" metalness={0.5} roughness={0.35} />
            </mesh>
          </group>
        );
      })}
      {/* deep-sea jellies glowing near the abyss cable */}
      {[[688, -742, -6], [712, -735, -14], [726, -748, -3], [700, -728, -22]].map((q, i) => (
        <Jelly key={i} p={q as V3} t={t + i} s={0.9 + i * 0.2} color={i % 2 ? "#9be7ff" : "#c79bff"} />
      ))}
    </group>
  );
};

export const SeaCanvas: React.FC<{ cam: Cam; t: number; night?: number; snow?: number; lamp?: number; children: React.ReactNode }> = ({ cam, t, night = 0, snow = 1, lamp = 0, children }) => {
  const { width, height } = useVideoConfig();
  const d = Math.max(0, -cam.look[1]);
  const day = Math.exp(-d / 220) * (1 - 0.8 * night);
  const under = cam.pos[1] < -8;
  const dist = Math.hypot(cam.pos[0] - cam.look[0], cam.pos[1] - cam.look[1], cam.pos[2] - cam.look[2]);
  const fogC = waterColor(d).multiplyScalar(1 - 0.6 * night);
  const sky = night > 0.5 ? "#0a1430" : "#a9d6f5";
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.1, far: 5000 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={[sky]} />
      {under ? <fog attach="fog" args={[fogC, Math.max(40, dist * 0.7), Math.max(260, dist * 3)]} /> : null}
      <mesh position={[cam.pos[0], 0, 0]}>
        <sphereGeometry args={[2500, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color={sky} side={THREE.BackSide} fog={false} />
      </mesh>
      {night > 0.5 ? <Stars3D frame={t * 30} count={700} radius={2200} size={9} /> : null}
      <hemisphereLight args={[night > 0.5 ? "#6f86c8" : "#dff3ff", "#1c3550", 0.3 + 0.75 * day]} />
      <KeyLight p={[cam.look[0] - 60, 140, 80]} target={[cam.look[0], Math.max(cam.look[1], -200), 0]} intensity={0.4 + 2.4 * day} color={night > 0.5 ? "#9fb6ff" : d > 30 ? "#d6efff" : "#fff3e2"} size={60} />
      {lamp > 0 ? <pointLight position={[cam.pos[0], cam.pos[1] + 4, Math.min(cam.pos[2], FRONT + 6)]} intensity={900 * lamp} distance={120} decay={1.6} color="#dff3ff" /> : null}
      <Backdrop t={t} night={night} />
      <Surface t={t} night={night} />
      <Floor />
      <SeaLife t={t} near={cam.look[1] > -80 ? 1 : 0} />
      <FrontGlass night={night} />
      {snow > 0 ? <Snow center={[cam.look[0], cam.look[1], 0]} t={t} amount={snow * Math.min(1, d / 25)} /> : null}
      {children}
      <Env intensity={0.22 + 0.3 * day} />
      <Post bloom={0.6 + 0.3 * night} ao={1.0} vignette={0.45} />
    </ThreeCanvas>
  );
};

// ───────────────────────── the cable ─────────────────────────
/** a cable lying on the floor from x0 to x1 (lifted `lift` above the sand) */
export const cablePoints = (x0: number, x1: number, n = 200, lift = 0.36) =>
  Array.from({ length: n }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / (n - 1);
    return new THREE.Vector3(x, groundY(x) + lift, 0);
  });

/**
 * The subsea cable along the floor from x0 to x1, in diagram yellow.
 * `armour` (0–1) adds steel rings and a thicker jacket on the shelf part (x < ARMOUR_X);
 * `buried` (0–1) sinks the armoured part into the sand.
 * `yarn` (0–1) wraps the shark-bite section [YARN_X0, YARN_X1] in white yarn.
 * `gap` [a, b] cuts the cable there (a break), the ends bent up a little.
 */
export const ARMOUR_X = 260;
export const YARN_X0 = 290;
export const YARN_X1 = 324;
export const Cable: React.FC<{ x0?: number; x1?: number; radius?: number; armour?: number; buried?: number; yarn?: number; gap?: [number, number] | null; color?: string; dead?: number }> = ({
  x0 = -10,
  x1 = END_X - 40,
  radius = 0.32,
  armour = 0,
  buried = 0,
  yarn = 0,
  gap = null,
  color = "#ffd23f",
  dead = 0,
}) => {
  const parts = useMemo(() => {
    const segs: [number, number][] = gap ? [[x0, gap[0]], [gap[1], x1]] : [[x0, x1]];
    return segs.map(([a, b]) => {
      const n = Math.max(8, Math.round((b - a) / 2));
      const pts = cablePoints(a, b, n, radius + 0.04);
      if (gap) {
        // broken ends lift off the floor a little
        const end = a === x0 ? pts.length - 1 : 0;
        pts[end].y += 1.2;
        pts[end + (a === x0 ? -1 : 1)].y += 0.4;
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, radius, 10, false);
    });
  }, [x0, x1, radius, gap]);
  const rings = useMemo(() => {
    const out: V3[] = [];
    for (let x = Math.max(x0, 2); x < Math.min(x1, ARMOUR_X); x += 3) out.push([x, groundY(x) + radius, 0]);
    return out;
  }, [x0, x1, radius]);
  const col = new THREE.Color(color).lerp(new THREE.Color("#4a3a30"), dead);
  return (
    <group>
      {parts.map((g, i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial color={col} roughness={0.45} metalness={0.05} emissive={dead > 0 ? "#ff3010" : "#000"} emissiveIntensity={dead > 0 ? 0.6 * Math.sin(Math.PI * Math.min(1, dead * 1.5)) : 0} />
        </mesh>
      ))}
      {armour > 0
        ? rings.map((q, i) => {
            const dx = 0.6;
            const dy = groundY(q[0] + dx) - groundY(q[0] - dx);
            const ang = Math.atan2(dy, 2 * dx);
            return (
              <mesh key={i} position={[q[0], q[1] - buried * radius * 2.6, 0]} rotation={[0, Math.PI / 2, 0]} scale={[armour, armour, armour]}>
                <group rotation={[ang, 0, 0]}>
                  <mesh rotation={[0, 0, 0]}>
                    <torusGeometry args={[radius * 1.45, radius * 0.3, 8, 20]} />
                    <meshStandardMaterial color="#9aa3ad" metalness={0.85} roughness={0.35} />
                  </mesh>
                </group>
              </mesh>
            );
          })
        : null}
      {armour > 0 ? (
        <mesh position={[0, -buried * radius * 2.6, 0]}>
          <tubeGeometry args={[new THREE.CatmullRomCurve3(cablePoints(Math.max(x0, 2), Math.min(x1, ARMOUR_X), 120, radius * 1.3 + 0.04)), 240, radius * 1.3 * armour, 10, false]} />
          <meshStandardMaterial color="#6e7780" metalness={0.75} roughness={0.4} />
        </mesh>
      ) : null}
      {buried > 0 ? <SandCover x0={Math.max(x0, 2)} x1={Math.min(x1, ARMOUR_X)} k={buried} /> : null}
      {yarn > 0 ? (
        <mesh>
          <tubeGeometry args={[new THREE.CatmullRomCurve3(cablePoints(YARN_X0, YARN_X0 + (YARN_X1 - YARN_X0) * yarn, 40, radius * 1.32 + 0.04)), 80, radius * 1.32, 10, false]} />
          <meshStandardMaterial color="#f4f1e6" roughness={0.95} map={yarnTex()} />
        </mesh>
      ) : null}
    </group>
  );
};

/** a sand berm over the buried cable (grows up out of the floor) */
const SandCover: React.FC<{ x0: number; x1: number; k: number }> = ({ x0, x1, k }) => {
  const sand = usePbr("coast_sand_rocks_02", [40, 1]);
  const geo = useMemo(() => {
    const n = 160;
    const g = new THREE.PlaneGeometry(x1 - x0, 3.2, n, 6);
    g.rotateX(-Math.PI / 2);
    g.translate((x0 + x1) / 2, 0, 0);
    return g;
  }, [x0, x1]);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = base[i * 3];
    const z = base[i * 3 + 2];
    p.setY(i, bedY(x, z) + 0.05 + k * 1.15 * Math.max(0, 1 - Math.pow(z / 1.6, 2)));
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} receiveShadow castShadow>
      <meshStandardMaterial map={sand.map} normalMap={sand.normalMap} color="#d2c2a2" roughness={1} />
    </mesh>
  );
};

let yarnT: THREE.Texture | null = null;
const yarnTex = () => {
  if (yarnT) return yarnT;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f2efe4";
  g.fillRect(0, 0, 64, 256);
  g.strokeStyle = "rgba(150,140,110,0.6)";
  g.lineWidth = 3;
  for (let i = -8; i < 40; i++) {
    g.beginPath();
    g.moveTo(0, i * 8);
    g.lineTo(64, i * 8 + 18);
    g.stroke();
  }
  yarnT = new THREE.CanvasTexture(c);
  yarnT.wrapS = yarnT.wrapT = THREE.RepeatWrapping;
  yarnT.repeat.set(40, 1);
  yarnT.colorSpace = THREE.SRGBColorSpace;
  return yarnT;
};

/** light pulses racing along the cable (cyan glows); `fade` dims them with distance since the last amplifier */
export const AMP_EVERY = 90;
export const AMPS = Array.from({ length: 16 }, (_, i) => 60 + i * AMP_EVERY).filter((x) => x < END_X - 60);
export const Pulses: React.FC<{ t: number; x0: number; x1: number; o?: number; fade?: number; speed?: number; color?: string; every?: number; size?: number }> = ({
  t,
  x0,
  x1,
  o = 1,
  fade = 0,
  speed = 60,
  color = "#7ff6ff",
  every = 24,
  size = 3,
}) => {
  const n = Math.ceil((x1 - x0) / every) + 1;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const x = x0 + ((((t * speed + i * every) % (n * every)) + n * every) % (n * every));
        if (x > x1) return null;
        const since = x - Math.max(-30, ...AMPS.filter((a) => a <= x));
        const k = 1 - fade * Math.min(1, since / AMP_EVERY) * 0.85;
        return <Glow key={i} position={[x, groundY(x) + 0.35, 0.4]} size={size * (0.6 + 0.4 * k)} color={color} opacity={o * k} />;
      })}
    </group>
  );
};

/**
 * A repeater/amplifier pod on the cable: a fat steel capsule; `on` lights its rings.
 * `xray` 0–1 makes the shell see-through and shows what is inside a real optical amplifier (EDFA):
 * a coil of erbium-doped fibre (glows pink when pumped) and the pump laser that feeds it; the faint pulse that goes in
 * comes out bright.
 */
export const Amplifier: React.FC<{ x: number; on?: number; s?: number; xray?: number; t?: number }> = ({ x, on = 0, s = 1, xray = 0, t = 0 }) => {
  const dx = 1;
  const ang = Math.atan2(groundY(x + dx) - groundY(x - dx), 2 * dx);
  const coil = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 400; i++) {
      const k = i / 400;
      const a = k * Math.PI * 2 * 9;
      pts.push(new THREE.Vector3(-1.1 + 2.2 * k, Math.cos(a) * 0.42, Math.sin(a) * 0.42));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 900, 0.035, 6, false);
  }, []);
  const see = xray > 0.01;
  const pumped = on * (0.6 + 0.4 * Math.sin(t * 5));
  return (
    <group position={[x, groundY(x) + 0.75 * s, 0]} rotation={[0, 0, ang]} scale={[s, s, s]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow={!see} receiveShadow>
        <capsuleGeometry args={[0.7, 3.2, 8, 20]} />
        {/* the shell's material is swapped (not toggled) when it goes see-through: no flicker */}
        <meshStandardMaterial key={see ? "x" : "o"} color="#b9c2cc" metalness={0.85} roughness={0.3} transparent={see} opacity={1 - 0.82 * xray} depthWrite={!see} side={see ? THREE.DoubleSide : THREE.FrontSide} />
      </mesh>
      {[-1.2, 1.2].map((k) => (
        <mesh key={k} position={[k, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.72, 0.07, 8, 24]} />
          <meshStandardMaterial color="#ffd23f" emissive="#7ff6ff" emissiveIntensity={on * 2.2} roughness={0.4} />
        </mesh>
      ))}
      {see ? (
        <group>
          {/* erbium-doped fibre coil */}
          <mesh geometry={coil}>
            <meshStandardMaterial color="#ff6aa8" emissive="#ff3a8a" emissiveIntensity={0.3 + 2.2 * pumped} toneMapped={false} />
          </mesh>
          <Glow position={[0, 0, 0.3]} size={2.6} color="#ff6aa8" opacity={0.55 * pumped * xray} />
          {/* pump laser: a small box with a red beam into the coil */}
          <RB p={[-1.35, -0.38, 0]} s={[0.5, 0.26, 0.36]} r={0.04} color="#2a2f36" />
          <mesh position={[-1.08, -0.38, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.12, 8]} />
            <meshBasicMaterial color="#ff3030" toneMapped={false} />
          </mesh>
          <Glow position={[-1.05, -0.38, 0]} size={0.6} color="#ff3030" opacity={xray * on} />
          {/* the signal: faint going in, bright coming out */}
          <Glow position={[-2.3 + ((t * 2.2) % 1) * 0.6, 0, 0]} size={0.55} color="#7ff6ff" opacity={0.35 * xray} />
          <Glow position={[1.9 + ((t * 2.2) % 1) * 0.6, 0, 0]} size={1.3} color="#e8fdff" opacity={xray * on} />
        </group>
      ) : null}
      {on > 0 ? <Glow position={[0, 0, 0.9]} size={4.5} color="#7ff6ff" opacity={0.85 * on * (1 - 0.7 * xray)} /> : null}
    </group>
  );
};

/** yellow "power" dots running from the beach down the cable (10,000 V DC) */
export const PowerDots: React.FC<{ t: number; x0: number; x1: number; o: number }> = ({ t, x0, x1, o }) => (
  <Pulses t={t} x0={x0} x1={x1} o={o} speed={45} every={14} color="#ffd23f" size={2.2} />
);

// ───────────────────────── the beach landing station ─────────────────────────
const signTex = (lines: string[], bg = "#f6f3ea", fg = "#13305a") => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = fg;
  g.lineWidth = 10;
  g.strokeRect(8, 8, 496, 240);
  g.fillStyle = fg;
  g.textAlign = "center";
  g.font = "900 64px Arial, sans-serif";
  lines.forEach((l, i) => g.fillText(l, 256, 100 + i * 80));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
export const LandingStation: React.FC = () => {
  const sign = useMemo(() => signTex(["CABLE", "LANDING"]), []);
  const volts = useMemo(() => signTex(["DANGER", "10 kV"], "#ffd23f", "#111"), []);
  const x = BEACH_X - 6;
  const y = groundY(x);
  return (
    <group position={[x, y, -6]}>
      <RB p={[0, 2.2, 0]} s={[9, 4.4, 7]} r={0.15} color="#d9d6cf" />
      <RB p={[0, 4.55, 0]} s={[9.6, 0.35, 7.6]} r={0.1} color="#8b8e93" />
      <mesh position={[0, 3.2, 3.53]}>
        <planeGeometry args={[4.2, 2.1]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      <RB p={[-2.8, 1.25, 3.52]} s={[1.4, 2.5, 0.08]} r={0.03} color="#4a5a6a" />
      {/* the duct: a manhole between the hut and the sea where the cable comes up */}
      <mesh position={[5.5, 0.06, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 24]} />
        <meshStandardMaterial color="#3a3d42" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[5.5, 0.08, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.1, 24]} />
        <meshStandardMaterial color="#6a6e74" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* high-voltage warning */}
      <mesh position={[3.3, 3.0, 3.53]}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial map={volts} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ───────────────────────── trouble on the shelf: an anchor and a trawl net ─────────────────────────
/** a ship's anchor (stockless, ~3 m) with its chain going up to the surface at (x, 0) */
export const Anchor: React.FC<{ p: V3; chainTop: V3; rot?: number }> = ({ p, chainTop, rot = 0 }) => {
  const links = useMemo(() => {
    const out: { p: V3; r: V3 }[] = [];
    const n = 70;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      // catenary-ish sag from the anchor up to the hawse pipe
      const x = p[0] + (chainTop[0] - p[0]) * k;
      const y = p[1] + 2.6 + (chainTop[1] - p[1] - 2.6) * Math.pow(k, 1.8);
      const z = p[2] + (chainTop[2] - p[2]) * k;
      out.push({ p: [x, y, z], r: [0, i % 2 ? Math.PI / 2 : 0, Math.atan2(chainTop[1] - p[1], chainTop[0] - p[0]) * Math.pow(k, 0.5)] });
    }
    return out;
  }, [p, chainTop]);
  return (
    <group>
      <group position={p} rotation={[0, 0, rot]}>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.2, 2.8, 10]} />
          <meshStandardMaterial color="#2b2e33" metalness={0.7} roughness={0.55} />
        </mesh>
        {[-1, 1].map((k) => (
          <mesh key={k} position={[k * 0.55, 0.35, 0]} rotation={[0, 0, k * -0.75]} castShadow>
            <coneGeometry args={[0.28, 1.4, 4]} />
            <meshStandardMaterial color="#2b2e33" metalness={0.7} roughness={0.55} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 1.1, 10]} />
          <meshStandardMaterial color="#2b2e33" metalness={0.7} roughness={0.55} />
        </mesh>
        <mesh position={[0, 2.85, 0]}>
          <torusGeometry args={[0.24, 0.07, 8, 16]} />
          <meshStandardMaterial color="#2b2e33" metalness={0.7} roughness={0.55} />
        </mesh>
      </group>
      {links.map((q, i) => (
        <mesh key={i} position={q.p} rotation={q.r}>
          <torusGeometry args={[0.18, 0.05, 6, 12]} />
          <meshStandardMaterial color="#3a3d42" metalness={0.75} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
};

/** a bottom-trawl net dragged along the floor towards −X by two warps from a trawler at the surface */
export const TrawlNet: React.FC<{ x: number; t: number; top: V3 }> = ({ x, t, top }) => {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(4.5, 0.8, 22, 18, 10, true);
    g.rotateZ(Math.PI / 2);
    return g;
  }, []);
  const y = groundY(x);
  const mouth: V3 = [x - 11, y + 3, 0];
  return (
    <group>
      <mesh geometry={geo} position={[x, y + 3, 0]} scale={[1, 0.75 + 0.04 * Math.sin(t * 2), 1]}>
        <meshStandardMaterial color="#ffe9a8" emissive="#6a5a2a" wireframe />
      </mesh>
      {/* the heavy footrope + the otter boards that dig into the sand */}
      <mesh position={[mouth[0], y + 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 9, 10]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>
      {[-1, 1].map((k) => (
        <RB key={k} p={[mouth[0] - 12, y + 1.2, k * 6]} s={[3.5, 2.4, 0.3]} r={0.1} color="#8a3a2a" />
      ))}
      {[-1, 1].map((k) => {
        const a = new THREE.Vector3(mouth[0] - 12, y + 1.5, k * 6);
        const b = new THREE.Vector3(...top);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const len = a.distanceTo(b);
        const dir = b.clone().sub(a).normalize();
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={k} position={mid} quaternion={q}>
            <cylinderGeometry args={[0.06, 0.06, len, 6]} />
            <meshStandardMaterial color="#c9c9c0" roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
};

/** a dark ship hull silhouette sitting on the surface (seen from below and from the side) */
export const HullAbove: React.FC<{ x: number; len?: number; color?: string }> = ({ x, len = 60, color = "#3a3f47" }) => (
  <group position={[x, 0, -4]}>
    <RB p={[0, 0.5, 0]} s={[len, 7, 11]} r={2.5} color={color} />
    <RB p={[-len * 0.25, 6.5, 0]} s={[len * 0.25, 6, 8]} r={0.5} color="#e8e6e0" />
  </group>
);
