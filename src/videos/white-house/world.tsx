import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow, Stars3D } from "../../lib/three/core";
import { Env, KeyLight, Post, tex } from "../../lib/three/diorama";
import { CloudField } from "../rocket/spaceport";

/** Sky dome around the camera: night (deep blue, city glow at the horizon) ↔ day (blue, pale horizon). */
const Sky: React.FC<{ night: number }> = ({ night }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() } },
        vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; varying vec3 vD;
          void main(){ float k = smoothstep(-0.05, 0.45, vD.y); gl_FragColor = vec4(mix(uHor, uTop, k), 1.0);
          #include <colorspace_fragment>
          }`,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  mat.uniforms.uTop.value.copy(new THREE.Color("#3f86d6").lerp(new THREE.Color("#060b1c"), night));
  mat.uniforms.uHor.value.copy(new THREE.Color("#cfe5fb").lerp(new THREE.Color("#3a3150"), night));
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[2900, 32, 16]} />
    </mesh>
  );
};

/** The lawn: fine grass texture + the mowing stripes of the White House lawns (8 m bands, world space). */
export const Lawn: React.FC = () => {
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: tex("grass", "#4f7f36", [260, 260], 31), roughness: 0.95 });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWp;").replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWp;")
        .replace("#include <map_fragment>", "#include <map_fragment>\nfloat band = step(0.5, fract(vWp.x / 16.0));\ndiffuseColor.rgb *= mix(0.86, 1.08, band);\ndiffuseColor.rgb *= 0.94 + 0.06 * sin(vWp.z * 0.07 + sin(vWp.x * 0.05) * 2.0);");
    };
    m.customProgramCacheKey = () => "lawn-stripes";
    return m;
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={mat} receiveShadow>
      <planeGeometry args={[3000, 3000]} />
    </mesh>
  );
};

/** The Washington Monument, ~1.1 km south of the house (169 m marble obelisk with its ring of flags). */
const Monument: React.FC = () => {
  const marble = useMemo(() => tex("plaster", "#ece6da", [2, 20], 101), []);
  return (
    <group position={[40, 0, -1100]}>
      <mesh position={[0, 76, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[(10.5 / 2) * Math.SQRT2, (16.8 / 2) * Math.SQRT2, 152, 4]} />
        <meshStandardMaterial map={marble} roughness={0.7} />
      </mesh>
      <mesh position={[0, 152 + 8.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[(10.5 / 2) * Math.SQRT2, 17, 4]} />
        <meshStandardMaterial map={marble} roughness={0.7} />
      </mesh>
      {Array.from({ length: 50 }, (_, i) => {
        const a = (i / 50) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 40, 10, Math.sin(a) * 40]}>
            <cylinderGeometry args={[0.15, 0.2, 20, 6]} />
            <meshStandardMaterial color="#d9d9d9" />
          </mesh>
        );
      })}
    </group>
  );
};

/**
 * The world of this reel: the White House grounds by day (sun, clouds, the Monument to the south) or at night
 * (`night` 0–1 blends). Children are placed in metres. `flood` 0–1: warm uplights along the north facade at night.
 */
export const LawnCanvas: React.FC<{ cam: Cam; t: number; night: number; children: React.ReactNode; ao?: number; flood?: number; monument?: boolean }> = ({ cam, t, night, children, ao = 1.0, flood = 0, monument = true }) => {
  const { width, height } = useVideoConfig();
  const day = 1 - night;
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.1, far: 4000 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <group position={cam.pos}>
        <Sky night={night} />
        {night > 0.3 ? <Stars3D frame={t * 30} count={700} radius={800} size={3 * night} /> : null}
        {night > 0.3 ? <Glow position={[-260, 330, -500]} size={60} color="#e8eeff" opacity={night} fog={false} /> : null}
      </group>
      {day > 0.5 ? <CloudField center={[0, 0, 0]} y0={420} y1={700} spread={4200} n={70} size={[260, 620]} seed={21} opacity={0.9} /> : null}
      <fog attach="fog" args={[new THREE.Color("#d6e7f7").lerp(new THREE.Color("#141a30"), night), 250 * day + 160 * night, 2600 * day + 700 * night]} />
      <hemisphereLight args={[new THREE.Color("#dbeaff").lerp(new THREE.Color("#3a4a78"), night), new THREE.Color("#5a6a38").lerp(new THREE.Color("#0b0f14"), night), 0.55 * day + 0.35 * night]} />
      {/* sun by day (from the south-west, an afternoon light), moon by night */}
      <KeyLight p={[cam.look[0] - 70 * day + 60 * night, cam.look[1] + 110, cam.look[2] + 60 * night - 40 * day]} target={cam.look} intensity={2.7 * day + 0.45 * night} color={day > 0.5 ? "#fff0d8" : "#b8c8ff"} size={70} />
      {flood > 0.01
        ? [-21, -13, 13, 21].map((x) => <pointLight key={x} position={[x, 0.8, 21]} intensity={240 * flood} distance={26} decay={2} color="#ffe6c4" />)
        : null}
      <Lawn />
      {day > 0.5 && monument ? <Monument /> : null}
      {children}
      <Env intensity={0.34 * day + 0.07 * night} />
      <Post bloom={0.45 + 0.45 * night} ao={ao} vignette={0.4} />
    </ThreeCanvas>
  );
};
