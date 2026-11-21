import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow, Stars3D, V3 } from "../../lib/three/core";
import { Env, KeyLight, Post } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";

/**
 * The airplane reel's worlds, metres, up +Y.
 *   ground: "field" (Kitty Hawk sand + dune grass), "hangar" (concrete apron + a steel hangar), "none" (flight)
 *   sky: day blue → `dusk` orange → `night` deep blue; `clouds` puts a cloud deck at y = cloudY below the camera
 */
const Sky: React.FC<{ dusk: number; night: number; high: number }> = ({ dusk, night, high }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uLow: { value: new THREE.Color() }, uGlow: { value: 0 } },
        vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uLow; uniform float uGlow; varying vec3 vD;
          void main(){
            float k = smoothstep(-0.02, 0.38, vD.y);
            vec3 c = mix(uHor, uTop, k);
            c = mix(c, uLow, smoothstep(0.0, -0.25, vD.y));
            float w = pow(max(0.0, dot(normalize(vec3(vD.x, 0.0, vD.z)), normalize(vec3(0.6, 0.0, 0.8)))), 4.0) * (1.0 - smoothstep(-0.05, 0.3, abs(vD.y)));
            c += vec3(1.0, 0.5, 0.2) * w * uGlow;
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  // `high`: at 11 km the zenith is a deeper blue and the horizon paler
  const top = new THREE.Color("#3d84d8").lerp(new THREE.Color("#174a9e"), high).lerp(new THREE.Color("#2c2a5e"), dusk).lerp(new THREE.Color("#03071a"), night);
  const hor = new THREE.Color("#d6e6f2").lerp(new THREE.Color("#cfe2f5"), high).lerp(new THREE.Color("#ffa463"), dusk).lerp(new THREE.Color("#101a36"), night);
  mat.uniforms.uTop.value.copy(top);
  mat.uniforms.uHor.value.copy(hor);
  mat.uniforms.uLow.value.copy(hor.clone().multiplyScalar(0.85));
  mat.uniforms.uGlow.value = 0.9 * dusk * (1 - night);
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[20000, 32, 16]} />
    </mesh>
  );
};

// ───────────────────────── cloud deck: a big soft noise layer of puffy sprites ─────────────────────────
const puffTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    const r = seeded(77);
    for (let i = 0; i < 26; i++) {
      const x = S / 2 + (r() - 0.5) * S * 0.5;
      const y = S / 2 + (r() - 0.5) * S * 0.32;
      const rad = S * (0.12 + r() * 0.16);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, "rgba(255,255,255,0.55)");
      gr.addColorStop(0.6, "rgba(255,255,255,0.25)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, S, S);
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();
/** cloud deck around (cx, cz) at height y: flat-bottomed puffs, lit from above (`tint` darkens for storms) */
export const CloudDeck: React.FC<{ y: number; c?: [number, number]; size?: number; n?: number; tint?: string; flash?: number; seed?: number }> = ({ y, c = [0, 0], size = 9000, n = 900, tint = "#ffffff", flash = 0, seed = 5 }) => {
  const puffs = useMemo(() => {
    const r = seeded(seed);
    return Array.from({ length: n }, () => {
      const x = (r() - 0.5) * size;
      const z = (r() - 0.5) * size;
      const s = 180 + r() * 420;
      return { x, z, s, dy: r() * 60, sh: 0.82 + r() * 0.18 };
    });
  }, [n, size, seed]);
  const map = puffTex();
  const base = new THREE.Color(tint);
  return (
    <group position={[c[0], y, c[1]]}>
      {puffs.map((p, i) => (
        <sprite key={i} position={[p.x, p.dy, p.z]} scale={[p.s * 1.7, p.s * 0.75, 1]}>
          <spriteMaterial map={map} color={base.clone().multiplyScalar(p.sh + flash * 0.8)} depthWrite={false} transparent fog={false} />
        </sprite>
      ))}
      {/* the solid underside, so the deck never looks see-through */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -40, 0]}>
        <planeGeometry args={[size * 1.4, size * 1.4]} />
        <meshBasicMaterial color={base.clone().multiplyScalar(0.86 + flash * 0.6)} fog={false} />
      </mesh>
    </group>
  );
};

// ───────────────────────── ground: Kitty Hawk field ─────────────────────────
const Field: React.FC = () => {
  const sand = usePbr("coast_sand_rocks_02", [260, 260]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(6000, 6000, 160, 160);
    g.rotateX(-Math.PI / 2);
    const pa = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i);
      const z = pa.getZ(i);
      // Kill Devil Hills: a big dune to the north-west, low rolling sand elsewhere
      const hill = 28 * Math.exp(-((x + 160) ** 2 + (z + 260) ** 2) / (2 * 110 ** 2));
      const roll = 1.2 * Math.sin(x * 0.02) * Math.sin(z * 0.017);
      pa.setY(i, hill + roll * THREE.MathUtils.smoothstep(Math.hypot(x, z), 40, 140));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const tufts = useMemo(() => {
    const r = seeded(12);
    return Array.from({ length: 420 }, () => ({ x: (r() - 0.5) * 300, z: (r() - 0.5) * 300, s: 0.4 + r() * 0.9, ry: r() * 6 })).filter((p) => Math.abs(p.x) > 8 || Math.abs(p.z) > 40);
  }, []);
  return (
    <group>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial normalMap={sand.normalMap} roughnessMap={sand.roughnessMap} color="#e6d6b4" roughness={0.97} />
      </mesh>
      {tufts.map((p, i) => (
        <mesh key={i} position={[p.x, 0.2 * p.s, p.z]} rotation={[0, p.ry, 0]} scale={[p.s, p.s * 0.8, p.s]} castShadow>
          <coneGeometry args={[0.35, 0.6, 5]} />
          <meshStandardMaterial color="#8a9a4a" roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

// ───────────────────────── ground: airport apron + hangar ─────────────────────────
const Apron: React.FC = () => {
  const con = usePbr("concrete_floor_02", [120, 120]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[4000, 4000]} />
      <meshStandardMaterial map={con.map} normalMap={con.normalMap} roughnessMap={con.roughnessMap} color="#b9b6ae" roughness={0.9} />
    </mesh>
  );
};
/** A steel hangar, 100 × 90 m, 30 m high, open to +Z (the doors slid aside). Interior lights from the roof trusses. */
export const HANGAR = { w: 100, d: 90, h: 30, z: -10 };
export const Hangar: React.FC<{ lit?: number }> = ({ lit = 1 }) => {
  const metal = usePbr("metal_plate", [12, 4]);
  const { w, d, h, z } = HANGAR;
  const wallM = <meshStandardMaterial map={metal.map} normalMap={metal.normalMap} roughnessMap={metal.roughnessMap} color="#c7ccd2" metalness={0.5} roughness={0.6} side={THREE.DoubleSide} />;
  return (
    <group position={[0, 0, z]}>
      {/* back wall, side walls, roof */}
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <planeGeometry args={[w, h]} />
        {wallM}
      </mesh>
      {[-1, 1].map((m) => (
        <mesh key={m} position={[(m * w) / 2, h / 2, 0]} rotation={[0, (m * Math.PI) / 2, 0]} receiveShadow>
          <planeGeometry args={[d, h]} />
          {wallM}
        </mesh>
      ))}
      <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#8d939a" metalness={0.4} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* roof trusses + light rows */}
      {Array.from({ length: 7 }, (_, i) => {
        const tz = -d / 2 + 8 + i * ((d - 16) / 6);
        return (
          <group key={i} position={[0, h - 1.2, tz]}>
            <mesh>
              <boxGeometry args={[w, 0.5, 0.5]} />
              <meshStandardMaterial color="#5a6068" metalness={0.7} roughness={0.5} />
            </mesh>
            <mesh position={[0, -1.2, 0]}>
              <boxGeometry args={[w, 0.3, 0.3]} />
              <meshStandardMaterial color="#5a6068" metalness={0.7} roughness={0.5} />
            </mesh>
            {Array.from({ length: 12 }, (_, j) => (
              <mesh key={j} position={[-w / 2 + 6 + j * ((w - 12) / 11), -0.5, 0.6]}>
                <boxGeometry args={[2.4, 0.15, 0.6]} />
                <meshBasicMaterial color={new THREE.Color("#fff6e4").multiplyScalar(0.4 + 0.8 * lit)} />
              </mesh>
            ))}
          </group>
        );
      })}
      {/* the sliding doors, parked at both sides of the opening */}
      {[-1, 1].map((m) => (
        <mesh key={m} position={[m * (w / 2 - 4), h / 2 - 1, d / 2 + 1]} castShadow>
          <boxGeometry args={[8, h - 2, 0.8]} />
          <meshStandardMaterial color="#e0e3e6" metalness={0.4} roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, h - 1, d / 2 + 0.6]}>
        <boxGeometry args={[w, 2, 1.4]} />
        <meshStandardMaterial color="#1d3f8f" roughness={0.6} />
      </mesh>
      {/* yellow floor guide line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10]}>
        <planeGeometry args={[0.4, d + 80]} />
        <meshStandardMaterial color="#f2c230" roughness={0.8} />
      </mesh>
      {lit > 0 ? <pointLight position={[0, h - 4, 0]} intensity={2500 * lit} distance={140} decay={1.6} color="#fff3dc" /> : null}
    </group>
  );
};

export const AirCanvas: React.FC<{
  cam: Cam;
  t: number;
  ground?: "field" | "hangar" | "none";
  dusk?: number;
  night?: number;
  high?: number;
  clouds?: number | null;
  cloudTint?: string;
  flash?: number;
  sun?: V3;
  shadow?: number;
  env?: number;
  fog?: number;
  ao?: number;
  /** inside the cabin / lavatory: no sun, soft fill, the set's own lights do the work */
  indoor?: boolean;
  children: React.ReactNode;
}> = ({ cam, t, ground = "none", dusk = 0, night = 0, high = 0, clouds = null, cloudTint, flash = 0, sun, shadow = 60, env, fog = 1, ao = 0.8, indoor = false, children }) => {
  const { width, height } = useVideoConfig();
  const day = (1 - dusk) * (1 - night);
  const fogC = new THREE.Color("#dbe7f0").lerp(new THREE.Color("#d79a6e"), dusk).lerp(new THREE.Color("#0b1226"), night);
  const keyP: V3 = sun ? [cam.look[0] + sun[0], cam.look[1] + sun[1], cam.look[2] + sun[2]] : [cam.look[0] + 120, cam.look[1] + 150 * day + 40 * dusk + 160 * night, cam.look[2] + 160];
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      camera={{ fov: cam.fov ?? 40, near: 0.1, far: 40000 }}
      gl={{ antialias: true, toneMapping: THREE.NoToneMapping, logarithmicDepthBuffer: true }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
    >
      <CameraRig cam={cam} />
      <group position={cam.pos}>
        <Sky dusk={dusk} night={night} high={high} />
        {night > 0.3 ? <Stars3D frame={t * 30} count={900} radius={15000} size={22 * night} /> : null}
        {dusk > 0.2 && night < 0.8 ? <Glow position={[9000, 400, 12000]} size={2600} color="#ffb070" opacity={0.7 * dusk * (1 - night)} fog={false} /> : null}
      </group>
      {fog > 0 && ground !== "none" ? <fog attach="fog" args={[fogC, 900 * fog, 7000 * fog]} /> : null}
      <hemisphereLight args={[new THREE.Color("#e3ecf6").lerp(new THREE.Color("#7a5a8a"), dusk).lerp(new THREE.Color("#30406a"), night), new THREE.Color(ground === "none" ? "#c8d4e0" : "#b89a74").lerp(new THREE.Color("#3a2a30"), dusk).lerp(new THREE.Color("#10141e"), night), (indoor ? 0.35 : 1) * (0.6 * day + 0.32 * dusk + 0.3 * night)]} />
      {indoor ? null : <KeyLight p={keyP} target={cam.look} intensity={2.7 * day + 1.3 * dusk * (1 - night) + 0.5 * night} color={night > 0.5 ? "#9fb6ff" : dusk > 0.5 ? "#ff9a5a" : "#fff1d8"} size={shadow} />}
      {flash > 0 ? <directionalLight position={[cam.look[0] - 200, cam.look[1] + 300, cam.look[2] - 100]} intensity={8 * flash} color="#dfe8ff" /> : null}
      {ground === "field" ? <Field /> : null}
      {ground === "hangar" ? <Apron /> : null}
      {clouds !== null ? <CloudDeck y={clouds} c={[cam.pos[0], cam.pos[2]]} tint={cloudTint} flash={flash} /> : null}
      {children}
      <Env intensity={env ?? (indoor ? 0.12 : 0.22 * day + 0.12 * dusk + 0.05 * night)} />
      <Post bloom={indoor ? 0.25 : 0.45 + 0.4 * dusk + 0.5 * night + 0.6 * flash} ao={ao} vignette={0.4} />
    </ThreeCanvas>
  );
};
