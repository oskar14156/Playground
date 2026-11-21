import React, { useMemo } from "react";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { Model, Outfit, useGltf } from "../../lib/three/gltf";
import type { V3 } from "../../lib/three/core";
import { Cyl, RB } from "../../lib/three/diorama";
import { seeded } from "../../lib/timing";

export const LIB1 = "ual/ual1_ue.glb";
export const LIB2 = "ual/ual2.glb";

// Fox River issue: chambray shirt + dark denim (season 1 look), guards in grey shirts and black trousers.
export const INMATE: Outfit = { top: "#5b7ba6", pants: "#2c3f5c", shoes: "#d8d6cc" };
export const INMATE2: Outfit = { top: "#6a86ae", pants: "#34465e", shoes: "#2a2a2a" };
export const GUARD: Outfit = { top: "#5a6470", pants: "#1e2126", shoes: "#111111", sleeves: 0.42 };
export const SUIT: Outfit = { top: "#22252b", pants: "#22252b", shoes: "#141414", sleeves: 1 };
export const COAT: Outfit = { top: "#eef0ee", pants: "#3a4a6a", shoes: "#e8e8e8", sleeves: 1 };
export const ROBE: Outfit = { top: "#111214", pants: "#111214", shoes: "#111", sleeves: 1 };
export const ROBBER: Outfit = { top: "#1e1f22", pants: "#2a3340", shoes: "#151515", sleeves: 1 };
export const ARTIST: Outfit = { top: "#151515", pants: "#3a3530", shoes: "#151515", sleeves: 0.42 };
export const POLICE: Outfit = { top: "#1d2b45", pants: "#1d2b45", shoes: "#0e0e0e", sleeves: 1 };

/** Guard's peaked cap (on the Head bone). */
export const GuardCap: React.FC<{ color?: string }> = ({ color = "#1c2028" }) => (
  <group position={[0, 0.15, 0.01]}>
    <Cyl p={[0, 0.04, 0]} r={0.105} r2={0.12} h={0.08} color={color} rough={0.6} />
    <Cyl p={[0, 0.0, 0.0]} r={0.1} h={0.02} color="#0b0b0b" rough={0.4} />
    <RB p={[0, -0.005, 0.1]} s={[0.17, 0.012, 0.08]} r={0.005} color="#0b0b0b" rough={0.3} rot={[0.25, 0, 0]} />
    <RB p={[0, 0.05, 0.115]} s={[0.04, 0.03, 0.01]} r={0.004} color="#c9a227" metal={1} rough={0.3} />
  </group>
);

/** Ski mask over the head (bank robber). */
export const SkiMask: React.FC = () => (
  <mesh position={[0, 0.08, 0.01]} scale={[1, 1.18, 1.05]}>
    <sphereGeometry args={[0.112, 24, 18]} />
    <meshStandardMaterial color="#1a1a1c" roughness={1} />
  </mesh>
);

/** Flashlight in the right hand. */
export const Torch: React.FC<{ on?: number }> = ({ on = 1 }) => (
  <group position={[0, 0.06, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
    <Cyl p={[0, 0, 0]} r={0.018} h={0.2} color="#1a1a1a" metal={0.6} rough={0.4} />
    <mesh position={[0, 0.105, 0]}>
      <circleGeometry args={[0.022, 16]} />
      <meshStandardMaterial color="#fff" emissive="#fff8e0" emissiveIntensity={4 * on} />
    </mesh>
  </group>
);

// ───────────────────────── the tattoo ─────────────────────────
/**
 * Michael's full-body tattoo as a canvas: blueprint linework (pipes, a floor plan, the route), a big angel-vs-demon
 * piece (drawn as abstract flourishes), and the pause-and-read details fans know: Fibonacci numbers, "RIPE CHANCE
 * WOODS", "1-800-", "ALLEN", "CUTE POISON". Two halves: left = front (chest + belly), right = back.
 */
const tattooTex = () => {
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 2048, 1024);
  const r = seeded(51);
  const ink = "rgba(18,26,40,0.92)";
  const draw = (ox: number) => {
    g.strokeStyle = ink;
    g.fillStyle = ink;
    // blueprint pipes + floor plan
    g.lineWidth = 6;
    for (let k = 0; k < 9; k++) {
      g.beginPath();
      const y = 120 + k * 90;
      g.moveTo(ox + 60, y);
      g.lineTo(ox + 200 + r() * 200, y);
      g.lineTo(ox + 200 + r() * 200, y + 60);
      g.lineTo(ox + 940, y + 60);
      g.stroke();
    }
    g.lineWidth = 3;
    for (let k = 0; k < 14; k++) g.strokeRect(ox + 80 + r() * 800, 80 + r() * 820, 60 + r() * 160, 40 + r() * 120);
    // flourishes (wings / flames) as curves
    g.lineWidth = 9;
    for (let k = 0; k < 16; k++) {
      g.beginPath();
      const x = ox + 120 + r() * 780;
      const y = 140 + r() * 760;
      g.moveTo(x, y);
      g.bezierCurveTo(x + 120 * (r() - 0.5) * 2, y - 140, x + 220 * (r() - 0.5) * 2, y + 60, x + 180 * (r() - 0.5) * 2, y + 200);
      g.stroke();
    }
    // shading blocks
    for (let k = 0; k < 900; k++) {
      g.fillStyle = `rgba(18,26,40,${0.12 + 0.2 * r()})`;
      g.fillRect(ox + 60 + r() * 900, 60 + r() * 900, 3 + r() * 10, 3 + r() * 10);
    }
    g.fillStyle = ink;
  };
  draw(0);
  draw(1024);
  g.font = "900 44px Georgia";
  g.fillStyle = ink;
  g.fillText("1 1 2 3 5 8 13 21", 140, 980);
  g.fillText("RIPE CHANCE WOODS", 1180, 980);
  g.font = "900 40px Arial";
  g.fillText("1-800-", 700, 70);
  g.fillText("ALLEN", 160, 70);
  g.fillText("CUTE POISON", 1500, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

/**
 * A rigged body with no shirt: ink on the torso + arms (bind-pose projection, front half on the chest, back half on
 * the back), skin elsewhere, dark denim trousers. `glow` 0…1 lights the linework amber (the route in the hook / map).
 */
export const TattooMan: React.FC<{ file?: string; anims?: string; clip?: string; t?: number; p?: V3; ry?: number; glow?: number; pants?: string; hair?: string }> = ({
  file = "man_a.glb",
  anims = LIB1,
  clip = "Idle_Loop",
  t = 0,
  p = [0, 0, 0],
  ry = 0,
  glow = 0,
  pants = "#2c3f5c",
  hair = "#2a2018",
}) => {
  const gltf = useGltf(file);
  const lib = useGltf(anims);
  const map = useMemo(tattooTex, []);
  const u = useMemo(() => ({ uInk: { value: map }, uGlow: { value: 0 }, uPants: { value: new THREE.Color(pants) } }), [map, pants]);
  u.uGlow.value = glow;
  const inst = useMemo(() => {
    const root = SkeletonUtils.clone(gltf.scene) as THREE.Object3D;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      if (!Array.isArray(m.material) && /hair/i.test(m.material.name)) {
        const h = (m.material as THREE.MeshStandardMaterial).clone();
        h.color = new THREE.Color(hair);
        m.material = h;
        return;
      }
      if (Array.isArray(m.material) || !/superhero|body|regular|teen/i.test(m.material.name)) return;
      const mat = (m.material as THREE.MeshStandardMaterial).clone();
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vBind;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvBind = position;");
        sh.fragmentShader = sh.fragmentShader
          .replace("#include <common>", "#include <common>\nvarying vec3 vBind;\nuniform sampler2D uInk; uniform float uGlow; uniform vec3 uPants;\nfloat inkA;")
          .replace(
            "#include <map_fragment>",
            `#include <map_fragment>
            float shoe = 1.0 - smoothstep(0.085, 0.11, vBind.y);
            float pants = (1.0 - smoothstep(0.97, 1.0, vBind.y)) * (1.0 - shoe);
            // ink zone: torso 1.0…1.47 m + arms out to the wrists (T-pose x up to ±0.62)
            float zone = smoothstep(0.99, 1.02, vBind.y) * (1.0 - smoothstep(1.45, 1.49, vBind.y)) * (1.0 - smoothstep(0.6, 0.63, abs(vBind.x)));
            vec2 uv = vec2(clamp(vBind.x / 1.3 + 0.5, 0.0, 1.0) * 0.5 + (vBind.z < 0.0 ? 0.5 : 0.0), clamp((vBind.y - 1.0) / 0.5, 0.0, 1.0));
            uv.x = vBind.z < 0.0 ? 1.5 - uv.x : uv.x;
            vec4 ink = texture2D(uInk, uv);
            inkA = ink.a * zone;
            diffuseColor.rgb = mix(diffuseColor.rgb, ink.rgb, inkA * 0.9);
            diffuseColor.rgb = mix(diffuseColor.rgb, uPants * (0.92 + 0.08 * sin(vBind.y * 900.0)), pants);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.12), shoe);`,
          )
          .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.62, 0.22) * inkA * uGlow * 1.6;");
      };
      mat.customProgramCacheKey = () => `tattoo-${pants}`;
      m.material = mat;
    });
    const mixer = new THREE.AnimationMixer(root);
    const want = clip.toLowerCase();
    const cl = lib.animations.find((a) => a.name.toLowerCase().split("|").pop() === want) ?? lib.animations[0];
    const action = mixer.clipAction(cl);
    action.play();
    return { root, mixer, action };
  }, [gltf, lib, clip, u, pants, hair]);
  inst.mixer.setTime(t % inst.action.getClip().duration);
  return <primitive object={inst.root} position={p} rotation={[0, ry, 0]} />;
};

/** Michael (dark buzz cut) in Fox River blues. */
export const Michael: React.FC<Omit<React.ComponentProps<typeof Model>, "file">> = (props) => <Model file="man_a.glb" outfit={INMATE} tint={{ Hair: "#2a2018" }} {...props} />;

/** Walk along a waypoint path at `speed` m/s; returns position + heading at time t (s). */
export const follow = (path: [number, number][], t: number, speed = 1.2) => {
  const seg = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i][0], q[1] - path[i][1]));
  let d = Math.max(0, t * speed);
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const k = d / seg[i];
      const a = path[i];
      const b = path[i + 1];
      return { x: a[0] + (b[0] - a[0]) * k, z: a[1] + (b[1] - a[1]) * k, ry: Math.atan2(b[0] - a[0], b[1] - a[1]), done: false };
    }
    d -= seg[i];
  }
  const a = path[path.length - 2];
  const b = path[path.length - 1];
  return { x: b[0], z: b[1], ry: Math.atan2(b[0] - a[0], b[1] - a[1]), done: true };
};
