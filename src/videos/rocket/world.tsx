import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Cam, CameraRig, Stars3D } from "../../lib/three/core";
import { Env, KeyLight, Post } from "../../lib/three/diorama";
import { Earth } from "../../lib/three/Earth";

/** Sky colour at an altitude (km): blue → deep blue → black at the edge of space. */
export const skyAt = (km: number) => {
  const stops: [number, string][] = [
    [0, "#8ccdf2"],
    [8, "#5aa6e6"],
    [25, "#1d4f9a"],
    [50, "#0b1c44"],
    [80, "#040814"],
    [100, "#000003"],
  ];
  const k = Math.max(0, km);
  for (let i = 1; i < stops.length; i++) {
    if (k <= stops[i][0]) return new THREE.Color(stops[i - 1][1]).lerp(new THREE.Color(stops[i][1]), (k - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  }
  return new THREE.Color(stops[stops.length - 1][1]);
};

/** Sky dome: colour from `km`, lighter towards the horizon, a thin glowing atmosphere line once you're high. */
const SkyDome: React.FC<{ km: number }> = ({ km }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uHigh: { value: 0 } },
        vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform float uHigh; varying vec3 vD;
          void main(){
            float h = vD.y;
            // horizon dips below the camera as you climb (curvature)
            float dip = -0.18 * uHigh;
            float k = smoothstep(dip - 0.02, dip + 0.35, h);
            vec3 c = mix(uHor, uTop, k);
            // the glowing limb of the atmosphere seen from high up
            c += vec3(0.25, 0.55, 1.0) * uHigh * exp(-pow((h - dip) / 0.025, 2.0)) * 1.4;
            // below the horizon: the planet (dark sea) once high, sea colour handled by the sea plane low down
            if (h < dip) c = mix(vec3(0.03, 0.08, 0.16), vec3(0.08, 0.22, 0.4), smoothstep(dip - 0.6, dip, h)) * (0.4 + 0.6 * (1.0 - uHigh * 0.5));
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  const top = skyAt(km);
  const hor = skyAt(km * 0.55).lerp(new THREE.Color("#cfe8ff"), km < 30 ? 0.55 * (1 - km / 30) : 0);
  mat.uniforms.uTop.value.copy(top);
  mat.uniforms.uHor.value.copy(hor);
  mat.uniforms.uHigh.value = Math.min(1, Math.max(0, (km - 20) / 80));
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[4000, 48, 24]} />
    </mesh>
  );
};

/** Sea plane with a light swell (for the launch pad, the boat and the splashdown). */
export const Sea: React.FC<{ t: number }> = ({ t }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(3000, 3000, 160, 160);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3];
    const z = base[i * 3 + 2];
    const near = Math.max(0, 1 - Math.hypot(x, z) / 400);
    pos.setY(i, near * (0.18 * Math.sin(x * 0.22 + t * 1.2) + 0.12 * Math.sin(z * 0.31 - t * 1.0) + 0.06 * Math.sin((x + z) * 0.7 + t * 2.0)));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} receiveShadow>
      <meshPhysicalMaterial color="#1f7fa8" roughness={0.22} metalness={0.05} clearcoat={0.5} clearcoatRoughness={0.25} />
    </mesh>
  );
};

/** The lower world: sea, sky that darkens with `km` (camera altitude for the colour), sun, post. */
export const SkyCanvas: React.FC<{ cam: Cam; t: number; km: number; children: React.ReactNode; sea?: boolean; sun?: number }> = ({ cam, t, km, children, sea = true, sun = 1 }) => {
  const { width, height } = useVideoConfig();
  const stars = Math.min(1, Math.max(0, (km - 35) / 40));
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.1, far: 60000 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <group position={cam.pos}>
        <SkyDome km={km} />
        {stars > 0 ? (
          <group scale={[1, 1, 1]}>
            <Stars3D frame={t * 30} count={1600} radius={3000} size={7 * stars} />
          </group>
        ) : null}
      </group>
      {km < 6 ? <fog attach="fog" args={[skyAt(0).lerp(new THREE.Color("#d6ecff"), 0.4), 600, 2600]} /> : null}
      <hemisphereLight args={["#e8f4ff", "#2a4a60", 0.7 * sun]} />
      <KeyLight p={[cam.look[0] - 60, cam.look[1] + 120, cam.look[2] + 80]} target={cam.look} intensity={2.4 * sun} color="#fff2df" size={60} />
      {sea ? <Sea t={t} /> : null}
      {children}
      <Env intensity={0.35} />
      <Post bloom={0.6} ao={1.0} vignette={0.4} />
    </ThreeCanvas>
  );
};

/** Sets the near plane every frame (canvas camera props only apply when the canvas is created). */
const NearPlane: React.FC<{ near: number }> = ({ near }) => {
  const camera = useThree((s) => s.camera);
  if (camera.near !== near) {
    camera.near = near;
    camera.updateProjectionMatrix();
  }
  return null;
};

/** Space: black, stars, one hard sun from the side. */
export const SUN: [number, number, number] = [0.75, 0.55, -0.35];
/** `ao` off for shots where the scene spans a huge depth range (SSAO blotches on the far Earth). */
export const SpaceCanvas: React.FC<{ cam: Cam; t: number; children: React.ReactNode; sunDir?: [number, number, number]; sun?: number; ao?: boolean; near?: number }> = ({ cam, t, children, sunDir = SUN, sun = 1, ao = true, near = 0.3 }) => {
  const { width, height } = useVideoConfig();
  const L = new THREE.Vector3(...sunDir).normalize().multiplyScalar(400);
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near, far: 60000 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
      <CameraRig cam={cam} />
      <NearPlane near={near} />
      <color attach="background" args={["#000005"]} />
      <group position={cam.pos}>
        <Stars3D frame={t * 30} count={2400} radius={6000} size={14} />
      </group>
      <hemisphereLight args={["#9fb6d6", "#05070c", 0.12]} />
      <KeyLight p={[cam.look[0] + L.x, cam.look[1] + L.y, cam.look[2] + L.z]} target={cam.look} intensity={3.2 * sun} color="#fffaf0" size={80} />
      {children}
      <Env intensity={0.18} />
      <Post bloom={0.7} ao={ao ? 0.8 : 0} vignette={0.45} />
    </ThreeCanvas>
  );
};

export const R_EARTH = 6371000;
/**
 * The Earth at real size and distance, drawn 1000× smaller and 1000× closer to the camera: it looks exactly the
 * same but stays inside a normal depth range (so small things near the camera always sort in front of it).
 * `center` is the real Earth centre in scene metres.
 */
export const FarEarth: React.FC<{ cam: Cam; center: [number, number, number]; spin?: number; clouds?: number; lat?: number; lon?: number; sun?: [number, number, number]; backdrop?: boolean }> = ({ cam, center, spin = 0, clouds = 0, lat, lon, sun, backdrop }) => {
  const s = 1 / 1000;
  const p: [number, number, number] = [cam.pos[0] + (center[0] - cam.pos[0]) * s, cam.pos[1] + (center[1] - cam.pos[1]) * s, cam.pos[2] + (center[2] - cam.pos[2]) * s];
  return <Earth p={p} r={R_EARTH * s} spin={spin} clouds={clouds} lat={lat} lon={lon} sun={sun} backdrop={backdrop} />;
};
