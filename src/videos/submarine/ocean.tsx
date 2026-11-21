import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow, V3 } from "../../lib/three/core";
import { Env, KeyLight, Post } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";

// ───────────────────────── ocean cross-section (metres, y = 0 is the sea surface) ─────────────────────────
export const SEABED = -300;
export const FRONT = 6; // the cut face of the water ("aquarium glass"); the camera always stays in front of it
export const BACK = -45;
export const DEPTHS = [10, 50, 100, 150, 200, 250, 300];
/** Where the plush lands: 150 m (straight line) from where the sub pings at 222 m depth (x = −5.4). */
export const PLUSH_X = 122;

const STOPS: [number, string][] = [
  [0, "#3fc6dd"],
  [12, "#2aa6d0"],
  [40, "#1679b4"],
  [100, "#0d5292"],
  [170, "#08305f"],
  [230, "#05193a"],
  [300, "#030d22"],
];
/** Water colour at a depth (m, positive down). */
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

/** Far wall of the water: colour by depth, soft light shafts near the surface. */
const Backdrop: React.FC<{ t: number; dark: number }> = ({ t, dark }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uT: { value: 0 }, uDark: { value: 0 } },
        vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `${GLSL_STOPS}
          varying vec3 vW; uniform float uT; uniform float uDark;
          void main(){
            float d = -vW.y;
            vec3 c = waterCol(d);
            // light shafts fading out by ~60 m
            float rays = 0.5 + 0.5 * sin(vW.x * 0.09 + d * 0.025 + uT * 0.25) * sin(vW.x * 0.023 - uT * 0.13);
            c += vec3(0.16, 0.24, 0.26) * pow(rays, 2.5) * exp(-d / 45.0);
            c *= 1.0 - 0.8 * uDark;
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
        depthWrite: true,
      }),
    [],
  );
  mat.uniforms.uT.value = t;
  mat.uniforms.uDark.value = dark;
  return (
    <mesh position={[0, SEABED / 2 - 5, BACK]} material={mat}>
      <planeGeometry args={[900, -SEABED + 10]} />
    </mesh>
  );
};

/** The cut face: a thin coloured veil that tints everything behind it by depth. */
const FrontGlass: React.FC<{ dark: number }> = ({ dark }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        uniforms: { uDark: { value: 0 } },
        fragmentShader: `${GLSL_STOPS}
          varying vec3 vW; uniform float uDark;
          void main(){
            float d = -vW.y;
            float a = 0.12 + 0.42 * smoothstep(0.0, 300.0, d) + 0.25 * uDark;
            gl_FragColor = vec4(waterCol(d) * (1.0 - 0.7 * uDark), a);
            #include <colorspace_fragment>
          }`,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  mat.uniforms.uDark.value = dark;
  return (
    <group>
      <mesh position={[0, (SEABED - 40) / 2, FRONT]} material={mat} renderOrder={10}>
        <planeGeometry args={[900, -SEABED + 40]} />
      </mesh>
      {/* bright waterline along the cut */}
      <mesh position={[0, -0.04, FRONT + 0.01]} renderOrder={11}>
        <planeGeometry args={[900, 0.08]} />
        <meshBasicMaterial color="#d9fbff" transparent opacity={0.85} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Sea surface with a gentle swell (seen from above; its front edge is the cut). */
const Surface: React.FC<{ t: number }> = ({ t }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(700, 500, 140, 100);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, FRONT - 250);
    return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3];
    const z = base[i * 3 + 2];
    const edge = Math.min(1, (FRONT - z) / 2); // flat at the cut so it meets the waterline
    pos.setY(i, edge * (0.12 * Math.sin(x * 0.35 + t * 1.3) + 0.08 * Math.sin(z * 0.5 - t * 1.1) + 0.05 * Math.sin((x + z) * 0.9 + t * 2.1)));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} receiveShadow>
      <meshPhysicalMaterial color="#1f87ad" roughness={0.18} metalness={0.05} clearcoat={0.6} clearcoatRoughness={0.2} side={THREE.DoubleSide} transparent opacity={0.62} depthWrite={false} />
    </mesh>
  );
};

/** Height of the seabed at (x, z): gentle dunes + a few humps. */
export const bedY = (x: number, z: number) => SEABED + 0.35 * Math.sin(x * 0.21) * Math.cos(z * 0.17) + 0.6 * Math.sin(x * 0.045 + 1.3) + 0.25 * Math.sin(z * 0.31 + x * 0.07);

const Seabed: React.FC = () => {
  const sand = usePbr("coast_sand_rocks_02", [60, 8]);
  const rock = usePbr("brown_mud_rocks_01", [40, 2]);
  const rockTex = usePbr("coast_sand_rocks_02", [1, 1]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(600, FRONT - BACK, 300, 40);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, (FRONT + BACK) / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, bedY(p.getX(i), p.getZ(i)) - SEABED);
    g.computeVertexNormals();
    g.translate(0, SEABED, 0);
    return g;
  }, []);
  const cutGeo = useMemo(() => {
    // vertical face at the cut whose top edge follows the sand
    const g = new THREE.PlaneGeometry(600, 200, 300, 1);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      p.setY(i, p.getY(i) > 0 ? bedY(x, FRONT) : SEABED - 200);
      p.setZ(i, FRONT - 0.005);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const rocks = useMemo(() => {
    const r = seeded(303);
    return Array.from({ length: 110 }, () => {
      const x = -90 + r() * 300;
      const z = BACK + 4 + r() * (FRONT - BACK - 6);
      const s = 0.3 + Math.pow(r(), 2.5) * 2.6;
      return { x, z, s, ry: r() * 6, sq: 0.45 + r() * 0.4, seed: Math.floor(r() * 1000) };
    }).filter((q) => Math.abs(q.x - PLUSH_X) > 7 || q.z < -9); // keep the plush's landing spot clear
  }, []);
  const rockGeo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 3);
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = 1 + 0.18 * Math.sin(v.x * 5.1 + v.y * 3.3) * Math.cos(v.z * 4.7) + 0.08 * Math.sin(v.y * 11 + v.x * 7);
      v.multiplyScalar(n);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial map={sand.map} normalMap={sand.normalMap} roughnessMap={sand.roughnessMap} color="#c7b79a" roughness={1} />
      </mesh>
      {/* the cut through the ground under the water */}
      <mesh geometry={cutGeo}>
        <meshStandardMaterial map={rock.map} normalMap={rock.normalMap} color="#6f5e4e" roughness={1} />
      </mesh>
      {rocks.map((q, i) => (
        <mesh key={i} geometry={rockGeo} position={[q.x, bedY(q.x, q.z) + q.s * q.sq * 0.35, q.z]} rotation={[0, q.ry, 0]} scale={[q.s, q.s * q.sq, q.s * 0.9]} castShadow receiveShadow>
          <meshStandardMaterial map={rockTex.map} normalMap={rockTex.normalMap} color="#7c7468" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
};

/** Thin depth lines across the cut, every marked depth. Labels are HTML (see DepthLabels in sets). */
const DepthLines: React.FC<{ o: number; camZ: number }> = ({ o, camZ }) => {
  const th = Math.max(0.02, (camZ - FRONT) * 0.0028); // ~2 px at any camera distance
  return (
    <group>
      {DEPTHS.filter((d) => d < 300).map((d) => (
        <mesh key={d} position={[0, -d, FRONT + 0.03]} renderOrder={12}>
          <planeGeometry args={[900, th]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3 * o} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

/** Marine snow around the camera (wraps so it is always there, frame-driven). */
const Snow: React.FC<{ center: V3; t: number; amount: number }> = ({ center, t, amount }) => {
  const N = 700;
  const seeds = useMemo(() => {
    const r = seeded(9);
    return Array.from({ length: N }, () => [r(), r(), r(), r()]);
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
    return g;
  }, []);
  const p = geo.attributes.position as THREE.BufferAttribute;
  const box = [70, 60, FRONT - BACK - 2];
  for (let i = 0; i < N; i++) {
    const [a, b, c2, d] = seeds[i];
    const wrap = (v: number, size: number, ctr: number) => ctr - size / 2 + ((((v - (ctr - size / 2)) % size) + size) % size);
    const x = wrap(a * 400 + Math.sin(t * 0.3 + d * 6) * 0.4, box[0], center[0]);
    const y = wrap(b * 400 - t * 0.15 * (0.5 + d), box[1], center[1]);
    const z = BACK + 1 + c2 * box[2];
    p.setXYZ(i, x, Math.min(-0.5, y), z);
  }
  p.needsUpdate = true;
  return (
    <points geometry={geo}>
      <pointsMaterial color="#cfe8ff" size={0.09} sizeAttenuation transparent opacity={0.55 * amount} depthWrite={false} />
    </points>
  );
};

/** Small fish school near the surface (cones with tails), circling slowly. */
const FishSchool: React.FC<{ c: V3; t: number; n?: number; seed?: number }> = ({ c, t, n = 40, seed = 5 }) => {
  const fish = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: n }, () => ({ r: 1.5 + r() * 4, ph: r() * Math.PI * 2, y: (r() - 0.5) * 3, sp: 0.25 + r() * 0.15, s: 0.16 + r() * 0.1 }));
  }, [n, seed]);
  return (
    <group position={c}>
      {fish.map((q, i) => {
        const a = q.ph + t * q.sp;
        const x = Math.cos(a) * q.r * 1.8;
        const z = Math.sin(a) * q.r * 0.6;
        const wag = Math.sin(t * 9 + i) * 0.35;
        return (
          <group key={i} position={[x, q.y + Math.sin(t * 1.2 + i) * 0.2, z]} rotation={[0, -a, 0]} scale={[q.s, q.s, q.s]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.5, 1.4, 0.8]}>
              <sphereGeometry args={[0.5, 12, 8]} />
              <meshStandardMaterial color="#b9c7d2" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, -0.8]} rotation={[0, wag, 0]}>
              <coneGeometry args={[0.3, 0.5, 4]} />
              <meshStandardMaterial color="#8fa3b3" metalness={0.6} roughness={0.35} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** Deep-sea jellyfish: glowing bell + trailing tentacles. */
export const Jelly: React.FC<{ p: V3; t: number; s?: number; color?: string }> = ({ p, t, s = 1, color = "#9be7ff" }) => {
  const pulse = 1 + 0.12 * Math.sin(t * 2.2);
  return (
    <group position={[p[0], p[1] + Math.sin(t * 0.6) * 0.4, p[2]]} scale={[s, s, s]}>
      <mesh scale={[pulse, 0.7 / pulse, pulse]}>
        <sphereGeometry args={[0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.3, -0.7, Math.sin(a) * 0.3]} rotation={[0.1 * Math.sin(t * 1.5 + i), 0, 0.1 * Math.cos(t * 1.3 + i)]}>
            <cylinderGeometry args={[0.012, 0.004, 1.4, 4]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
        );
      })}
      <Glow position={[0, 0.05, 0]} size={1.6} color={color} opacity={0.5} />
    </group>
  );
};

/** Light level for a depth (stylised: still readable at 300 m). */
export const daylight = (d: number) => Math.exp(-Math.max(0, d) / 95);

/**
 * The whole ocean set with lights for the camera's depth. `children` = the story objects.
 * `dark` 0–1 forces night-black water (no sunlight) for the sonar beat.
 */
export const OceanCanvas: React.FC<{ cam: Cam; t: number; children: React.ReactNode; lines?: number; dark?: number; snow?: number; fish?: boolean }> = ({
  cam,
  t,
  children,
  lines = 1,
  dark = 0,
  snow = 1,
  fish = true,
}) => {
  const { width, height } = useVideoConfig();
  const d = Math.max(0, -cam.look[1]);
  const day = daylight(d) * (1 - 0.85 * dark);
  const under = cam.pos[1] < -12;
  const dist = Math.hypot(cam.pos[0] - cam.look[0], cam.pos[1] - cam.look[1], cam.pos[2] - cam.look[2]);
  const fogC = waterColor(d).multiplyScalar(1 - 0.6 * dark);
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.1, far: 1500 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <color attach="background" args={["#9fd3f2"]} />
      {under ? <fog attach="fog" args={[fogC, Math.max(25, dist * 0.6), Math.max(160, dist * 2.5)]} /> : null}
      {/* sky dome above the water */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[900, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#a9d6f5" side={THREE.BackSide} fog={false} />
      </mesh>
      <hemisphereLight args={["#dff3ff", "#1c3550", 0.25 + 0.75 * day]} />
      <KeyLight p={[-40, 80, 50]} target={[cam.look[0], cam.look[1], 0]} intensity={0.35 + 2.3 * day} color={d > 20 ? "#d6efff" : "#fff3e2"} size={30} />
      <Backdrop t={t} dark={dark} />
      <Surface t={t} />
      <Seabed />
      <DepthLines o={lines} camZ={cam.pos[2]} />
      <FrontGlass dark={dark} />
      {snow > 0 ? <Snow center={[cam.look[0], cam.look[1], 0]} t={t} amount={snow * Math.min(1, d / 20)} /> : null}
      {fish ? <FishSchool c={[14, -14, -8]} t={t} /> : null}
      {fish ? <FishSchool c={[-18, -32, -14]} t={t + 3} n={30} seed={8} /> : null}
      {children}
      <Env intensity={0.25 + 0.3 * day} />
      <Post bloom={0.55} ao={1.2} vignette={0.45} />
    </ThreeCanvas>
  );
};
