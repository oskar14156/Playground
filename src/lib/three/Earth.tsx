import React, { useMemo } from "react";
import { staticFile } from "remotion";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { V3 } from "./core";
import { seeded } from "../timing";
import land from "../../../public/data/land-dots.json";

/**
 * Earth from code: an equirectangular texture painted from the Natural Earth land dots (public/data/land-dots.json),
 * coloured by latitude (ice, tundra, forest, desert, jungle), a separate cloud layer and a soft blue atmosphere rim.
 * `r` = radius in scene units, `spin` = rotation (radians), `clouds` = cloud drift (radians).
 */
let earthTex: THREE.Texture | null = null;
let cloudTex: THREE.Texture | null = null;

export const paintEarth = () => {
  if (earthTex) return earthTex;
  const W = 2048;
  const H = 1024;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  // ocean: deep blue, a bit lighter near the equator
  const oc = g.createLinearGradient(0, 0, 0, H);
  oc.addColorStop(0, "#0b2d5c");
  oc.addColorStop(0.5, "#11497f");
  oc.addColorStop(1, "#0b2d5c");
  g.fillStyle = oc;
  g.fillRect(0, 0, W, H);
  // land mask from the dots (≈2° grid) → soft blobs
  const mask = document.createElement("canvas");
  mask.width = W;
  mask.height = H;
  const m = mask.getContext("2d")!;
  // draw every dot sharp in one path, then blur the whole mask once (a filter set before thousands of draws
  // runs the blur per draw on the GPU and ran out of memory)
  const sharp = document.createElement("canvas");
  sharp.width = W;
  sharp.height = H;
  const sh = sharp.getContext("2d")!;
  sh.fillStyle = "#fff";
  sh.beginPath();
  for (const [lat, lon] of land as [number, number][]) {
    const x = ((lon + 180) / 360) * W;
    const y = ((90 - lat) / 180) * H;
    sh.moveTo(x + 9.5, y);
    sh.arc(x, y, 9.5, 0, Math.PI * 2);
  }
  sh.fill();
  m.filter = "blur(6px)";
  m.drawImage(sharp, 0, 0);
  m.filter = "none";
  // colour the land by latitude, with noise for texture
  const col = document.createElement("canvas");
  col.width = W;
  col.height = H;
  const k = col.getContext("2d")!;
  const lg = k.createLinearGradient(0, 0, 0, H);
  const stops: [number, string][] = [
    [0.0, "#f4f6f8"],
    [0.1, "#e9edef"],
    [0.16, "#8a8f6a"],
    [0.24, "#3f6b35"],
    [0.32, "#577a3a"],
    [0.38, "#b49a62"],
    [0.44, "#c9a96b"],
    [0.5, "#2f6a2c"],
    [0.56, "#c2a468"],
    [0.64, "#5d7d3c"],
    [0.74, "#7a8a58"],
    [0.86, "#e9edef"],
    [1.0, "#f4f6f8"],
  ];
  for (const [o, cc] of stops) lg.addColorStop(o, cc);
  k.fillStyle = lg;
  k.fillRect(0, 0, W, H);
  const r = seeded(7);
  for (let i = 0; i < 9000; i++) {
    k.fillStyle = `rgba(${r() < 0.5 ? "30,50,20" : "220,200,150"},${0.08 + r() * 0.12})`;
    k.beginPath();
    k.arc(r() * W, r() * H, 2 + r() * 10, 0, Math.PI * 2);
    k.fill();
  }
  k.globalCompositeOperation = "destination-in";
  k.drawImage(mask, 0, 0);
  g.drawImage(col, 0, 0);
  // polar ice over the ocean too
  const ice = g.createLinearGradient(0, 0, 0, H);
  ice.addColorStop(0, "rgba(240,244,248,1)");
  ice.addColorStop(0.06, "rgba(240,244,248,0)");
  ice.addColorStop(0.92, "rgba(240,244,248,0)");
  ice.addColorStop(1, "rgba(240,244,248,1)");
  g.fillStyle = ice;
  g.fillRect(0, 0, W, H);
  earthTex = new THREE.CanvasTexture(c);
  earthTex.colorSpace = THREE.SRGBColorSpace;
  earthTex.anisotropy = 8;
  return earthTex;
};

export const paintClouds = () => {
  if (cloudTex) return cloudTex;
  const W = 1024;
  const H = 512;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const sharp = document.createElement("canvas");
  sharp.width = W;
  sharp.height = H;
  const g = sharp.getContext("2d")!;
  const r = seeded(21);
  // streaky cloud bands: many soft ellipses, denser in the storm belts
  for (let i = 0; i < 1100; i++) {
    const y = r() * H;
    const lat = 90 - (y / H) * 180;
    const belt = Math.exp(-(((Math.abs(lat) - 50) / 15) ** 2)) * 0.8 + Math.exp(-((lat / 8) ** 2)) * 0.6 + 0.15;
    if (r() > belt) continue;
    g.fillStyle = `rgba(255,255,255,${0.08 + r() * 0.18})`;
    g.beginPath();
    g.ellipse(r() * W, y, 6 + r() * 26, 2 + r() * 7, (r() - 0.5) * 0.4, 0, Math.PI * 2);
    g.fill();
  }
  const out = c.getContext("2d")!;
  out.filter = "blur(4px)";
  out.drawImage(sharp, 0, 0);
  cloudTex = new THREE.CanvasTexture(c);
  cloudTex.colorSpace = THREE.SRGBColorSpace;
  return cloudTex;
};

/** `lat`/`lon` (degrees) is the spot that faces up (+Y), i.e. what lies under a camera above the planet;
 * `spin` turns it further around that spot's meridian (radians, for sunrise fast-forwards). */
/**
 * Real Earth from NASA textures (public/textures/earth_*.jpg): day side, city lights on the night side, a sun glint
 * that only shows on the ocean, a drifting cloud layer, and an atmosphere that is blue on the day side and orange at
 * the terminator. `sun` = world-space direction towards the sun. Falls back to the painted map in `paintEarth()` when
 * `painted` is set (used before the textures existed).
 */
/** `backdrop`: drawn first and without depth, like the sky (when a far-away Earth is drawn close to the camera and
 * would otherwise hide things below you, e.g. a plane under the ladder). */
export const Earth: React.FC<{ p?: V3; r: number; spin?: number; clouds?: number; lat?: number; lon?: number; sun?: V3; backdrop?: boolean; cover?: number }> = ({ p = [0, 0, 0], r, spin = 0, clouds = 0, lat = 28, lon = -20, sun = [0.75, 0.55, -0.35], backdrop = false, cover = 0.9 }) => {
  const [day, night, cloud] = useLoader(THREE.TextureLoader, [staticFile("textures/earth_day.jpg"), staticFile("textures/earth_night.jpg"), staticFile("textures/earth_clouds.jpg")]);
  const mat = useMemo(() => {
    for (const t of [day, night]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
    }
    cloud.wrapS = THREE.RepeatWrapping;
    cloud.anisotropy = 8;
    return new THREE.ShaderMaterial({
      uniforms: { uDay: { value: day }, uNight: { value: night }, uCloud: { value: cloud }, uSun: { value: new THREE.Vector3(1, 0, 0) }, uCloudShift: { value: 0 }, uCover: { value: 0.9 } },
      // logdepthbuf chunks: in a canvas with logarithmicDepthBuffer the globe must write the same depth as the
      // other materials, or lines/markers on the far side shine through it
      vertexShader: `#include <common>
        #include <logdepthbuf_pars_vertex>
        varying vec2 vUv; varying vec3 vN; varying vec3 vP;
        void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w;
        #include <logdepthbuf_vertex>
        }`,
      fragmentShader: `#include <logdepthbuf_pars_fragment>
        uniform sampler2D uDay; uniform sampler2D uNight; uniform sampler2D uCloud; uniform vec3 uSun; uniform float uCloudShift; uniform float uCover;
        varying vec2 vUv; varying vec3 vN; varying vec3 vP;
        void main(){
          #include <logdepthbuf_fragment>
          vec3 n = normalize(vN);
          vec3 v = normalize(cameraPosition - vP);
          float ndl = dot(n, uSun);
          float lit = smoothstep(-0.12, 0.22, ndl);
          vec3 day = texture2D(uDay, vUv).rgb;
          float cl = texture2D(uCloud, vUv + vec2(uCloudShift, 0.0)).r;
          float clShadow = texture2D(uCloud, vUv + vec2(uCloudShift - 0.0012, 0.0006)).r;
          // ocean = blue-dominant pixels of the day map
          float ocean = smoothstep(0.02, 0.10, day.b - max(day.r, day.g) * 0.92);
          vec3 col = day * (0.04 + 1.15 * max(ndl, 0.0)) * (1.0 - 0.35 * clShadow * lit);
          // sun glint on the water
          vec3 h = normalize(uSun + v);
          float glint = pow(max(dot(n, h), 0.0), 70.0) * ocean * lit * (1.0 - cl);
          col += vec3(1.0, 0.92, 0.78) * glint * 1.3;
          // clouds (lit on the day side, faint on the night side)
          col = mix(col, vec3(1.0) * (0.03 + 1.05 * max(ndl, 0.0)), cl * uCover);
          // city lights on the night side
          vec3 nightCol = texture2D(uNight, vUv).rgb;
          col += pow(nightCol, vec3(1.4)) * vec3(1.0, 0.82, 0.55) * 1.8 * (1.0 - lit) * (1.0 - 0.8 * cl);
          // atmosphere seen through: blue haze at grazing angles, warm at the terminator
          float fr = pow(1.0 - max(dot(n, v), 0.0), 2.5);
          vec3 sky = mix(vec3(1.0, 0.45, 0.2), vec3(0.35, 0.62, 1.0), smoothstep(-0.15, 0.1, ndl));
          col += sky * fr * 0.45 * smoothstep(-0.3, 0.3, ndl);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
  }, [day, night, cloud]);
  const atmo = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uSun: { value: new THREE.Vector3(1, 0, 0) } },
        vertexShader: `varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vP;
          void main(){
            vec3 n = normalize(vN); vec3 v = normalize(cameraPosition - vP);
            float rim = pow(1.0 - abs(dot(n, v)), 7.0);
            float ndl = dot(n, uSun);
            vec3 c = mix(vec3(1.0, 0.5, 0.25), vec3(0.32, 0.6, 1.0), smoothstep(-0.2, 0.05, ndl));
            gl_FragColor = vec4(c * 1.3, rim * smoothstep(-0.3, 0.2, ndl));
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    [],
  );
  const s = new THREE.Vector3(...sun).normalize();
  mat.uniforms.uSun.value.copy(s);
  mat.uniforms.uCloudShift.value = clouds / (Math.PI * 2);
  mat.uniforms.uCover.value = cover;
  atmo.uniforms.uSun.value.copy(s);
  mat.depthWrite = !backdrop;
  return (
    <group position={p} rotation={[0, 0, Math.PI / 2 - (lat * Math.PI) / 180]}>
      <mesh material={mat} rotation={[0, (-lon * Math.PI) / 180 + spin, 0]} renderOrder={backdrop ? -9 : 0}>
        <sphereGeometry args={[r, 160, 120]} />
      </mesh>
      <mesh material={atmo} scale={[1.014, 1.014, 1.014]} renderOrder={backdrop ? -8 : 0}>
        <sphereGeometry args={[r, 96, 72]} />
      </mesh>
    </group>
  );
};
