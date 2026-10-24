import React, { useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";

/**
 * Ray-marched volumetric fire inside a unit box (scale/position it like any mesh).
 * Deterministic: pass `time` in seconds (frame / fps). Flames rise from the bottom face,
 * narrow toward the top, with fbm turbulence; colour ramps red → orange → yellow-white.
 * Additive, so place it after opaque geometry; it does not cast light (add a pointLight).
 */
const vert = /* glsl */ `
varying vec3 vObj;
varying vec3 vCamObj;
void main() {
  vObj = position;
  vCamObj = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const frag = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
varying vec3 vObj;
varying vec3 vCamObj;

// 3D value noise + fbm
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }

float fire(vec3 p) {
  // p in [-0.5, 0.5]^3, y up; h = 0 at the bottom, 1 at the top
  float h = p.y + 0.5;
  vec3 q = vec3(p.x * 2.2, h * 1.6 - uTime * 1.25, p.z * 2.2);
  float turb = fbm(q * 3.0 + vec3(0.0, 0.0, uTime * 0.3));
  // flame envelope: wide base narrowing upward, with flickering tongues
  float r = length(p.xz) * 2.0;
  float width = mix(0.95, 0.12, pow(h, 0.8)) + 0.25 * (turb - 0.5);
  float body = smoothstep(width, width - 0.35, r);
  float fade = smoothstep(1.0, 0.25, h + 0.35 * (turb - 0.5));
  // break the body into tongues: only where the turbulence is above a rising threshold
  float tongues = smoothstep(0.38 + 0.25 * h, 0.62 + 0.25 * h, turb + 0.15 * (1.0 - h));
  return clamp(body * fade * tongues * 1.3, 0.0, 1.0);
}

vec3 ramp(float t) {
  vec3 c = mix(vec3(0.35, 0.02, 0.0), vec3(1.0, 0.28, 0.02), smoothstep(0.0, 0.45, t));
  c = mix(c, vec3(1.0, 0.72, 0.25), smoothstep(0.45, 0.8, t));
  return mix(c, vec3(1.0, 0.95, 0.8), smoothstep(0.85, 1.0, t));
}

void main() {
  vec3 ro = vCamObj;
  vec3 rd = normalize(vObj - vCamObj);
  // box [-0.5, 0.5]^3 intersection
  vec3 inv = 1.0 / rd;
  vec3 t0 = (vec3(-0.5) - ro) * inv;
  vec3 t1 = (vec3(0.5) - ro) * inv;
  vec3 tmin = min(t0, t1), tmax = max(t0, t1);
  float tn = max(max(tmin.x, tmin.y), max(tmin.z, 0.0));
  float tf = min(min(tmax.x, tmax.y), tmax.z);
  if (tf <= tn) discard;
  const int STEPS = 56;
  float dt = (tf - tn) / float(STEPS);
  vec3 col = vec3(0.0);
  float trans = 1.0;
  for (int i = 0; i < STEPS; i++) {
    vec3 p = ro + rd * (tn + (float(i) + 0.5) * dt);
    float d = fire(p);
    if (d > 0.01) {
      float a = 1.0 - exp(-d * dt * 6.0);
      col += trans * a * ramp(d) * (1.0 + 2.5 * d);
      trans *= 1.0 - a * 0.55;
      if (trans < 0.02) break;
    }
  }
  gl_FragColor = vec4(col * uIntensity, 1.0);
}`;

export const VolumeFire: React.FC<{ time: number; intensity?: number } & ThreeElements["mesh"]> = ({ time, intensity = 1.6, ...m }) => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
        toneMapped: false,
      }),
    [],
  );
  material.uniforms.uTime.value = time;
  material.uniforms.uIntensity.value = intensity;
  return (
    <mesh {...m} material={material}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  );
};
