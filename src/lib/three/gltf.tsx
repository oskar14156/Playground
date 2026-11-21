import React, { useMemo } from "react";
import { staticFile } from "remotion";
import { createPortal, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type { V3 } from "./core";

/**
 * glTF/GLB models in Remotion: loads once per file (render waits via delayRender), clones per
 * instance (skinned meshes need SkeletonUtils.clone), and poses animations from the frame —
 * `mixer.setTime(t)` every render, so parallel render tabs agree and frames are deterministic.
 * Files live in public/models/ (CC0 sources listed in public/models/CREDITS.md).
 */
// r3f's useLoader suspends; @remotion/three's ThreeCanvas wraps its children in Suspense +
// delayRender, so the frame is only captured once the model is in the scene (a manual
// useState/delayRender loader resolved after the canvas had already drawn → empty frames).
export const useGltf = (file: string) => useLoader(GLTFLoader, staticFile(`models/${file}`)) as GLTF;

type ModelProps = {
  file: string;
  /** take animation clips from another file with the same skeleton (e.g. an animation library) */
  anims?: string;
  /** animation clip name (or index); omit for a static model */
  clip?: string | number;
  /** seconds into the clip (loops) */
  t?: number;
  p?: V3;
  ry?: number;
  scale?: number;
  /** recolour materials whose name contains a key, e.g. { Hair: "#3a2a1a" } */
  tint?: Record<string, string>;
  /** paint clothes onto a base body (bind-pose regions): top, pants, shoes */
  outfit?: Outfit;
  shadows?: boolean;
  /** hang something on a bone so it follows the animation, e.g. a mask on "Head" (bone space, metres); a list for several */
  attach?: { bone: string; node: React.ReactNode } | { bone: string; node: React.ReactNode }[];
  /** drop the root motion of "_RM" clips (e.g. ClimbUp_1m_RM loops on the spot; move the model with `p` instead) */
  inPlace?: boolean;
  /** extra bone rotations (radians, applied on top of the clip), e.g. { upperarm_l: [0, 0, 1.2] } for arms swept back */
  bonePose?: Record<string, [number, number, number]>;
  /** point bones along a direction in model space (+Z = facing, +Y = up), e.g. arms swept back for a "Naruto run":
   * { upperarm_l: [0.3, -0.5, -1], lowerarm_l: [0.3, -0.5, -1] } — applied in this order, after the clip */
  aim?: Record<string, [number, number, number]>;
};

export type Outfit = {
  top: string;
  pants: string;
  shoes: string;
  sleeves?: number;
  /** a loose knit top: the torso is pulled onto a smooth sweater shape (no anatomy under the fabric); "female" | "male" body */
  loose?: "female" | "male";
};

/** sweater per body (bind pose, metres): envelope rows [y, half-width, front z, back z] from the hips up to the chest,
 *  where it fades out towards the neck (fadeY) and the arms (fadeX), and where the knit ends at the neck (neck) */
type SweaterBody = { rows: [number, number, number, number][]; fadeY: [number, number]; fadeX: [number, number]; neck: [number, number] };
const SWEATER: Record<"female" | "male", SweaterBody> = {
  female: {
    rows: [
      [0.97, 0.19, 0.105, -0.165],
      [1.08, 0.16, 0.125, -0.115],
      [1.2, 0.155, 0.145, -0.115],
      [1.3, 0.16, 0.152, -0.135],
      [1.4, 0.17, 0.11, -0.14],
    ],
    fadeY: [1.36, 1.46],
    fadeX: [0.15, 0.2],
    neck: [1.43, 1.47],
  },
  male: {
    rows: [
      [0.97, 0.175, 0.105, -0.155],
      [1.1, 0.165, 0.12, -0.11],
      [1.25, 0.19, 0.128, -0.15],
      [1.35, 0.212, 0.126, -0.167],
      [1.45, 0.215, 0.085, -0.162],
    ],
    fadeY: [1.42, 1.53],
    fadeX: [0.17, 0.23],
    neck: [1.51, 1.55],
  },
};
const sweaterGlsl = (sw: SweaterBody) => {
  const rows = sw.rows;
  const f = (v: number) => v.toFixed(3);
  const pick = (k: number) =>
    rows
      .slice(1)
      .map((r, i) => `if (y <= ${f(r[0])}) return mix(${f(rows[i][k])}, ${f(r[k])}, smoothstep(${f(rows[i][0])}, ${f(r[0])}, y));`)
      .join("\n  ") + `\n  return ${f(rows[rows.length - 1][k])};`;
  return `
float swA(float y){ ${pick(1)} }
float swF(float y){ ${pick(2)} }
float swB(float y){ ${pick(3)} }
// weight of the sweater at a bind-pose point: torso between hips and shoulders, fading out towards neck, arms and legs
float swW(vec3 p){
  return smoothstep(0.93, 1.0, p.y) * (1.0 - smoothstep(${f(sw.fadeY[0])}, ${f(sw.fadeY[1])}, p.y)) * (1.0 - smoothstep(${f(sw.fadeX[0])}, ${f(sw.fadeX[1])}, abs(p.x)));
}
vec3 swPos(vec3 p){
  float a = swA(p.y), f = swF(p.y), b = swB(p.y);
  float zc = 0.5 * (f + b);
  float hz = 0.5 * (f - b);
  float th = atan(p.z - zc, p.x / a * hz);
  return vec3(a * cos(th), p.y, zc + hz * sin(th));
}
vec3 swNormal(vec3 p){
  float a = swA(p.y), f = swF(p.y), b = swB(p.y);
  float zc = 0.5 * (f + b);
  float hz = 0.5 * (f - b);
  float th = atan(p.z - zc, p.x / a * hz);
  return normalize(vec3(cos(th) / a, 0.0, sin(th) / hz));
}`;
};

/** Clothes on the Quaternius base bodies: colours chosen per fragment from the bind-pose position
 * (before skinning), so they stick to the body while it animates. Heights in metres. */
const dress = (mat: THREE.Material, o: Outfit) => {
  const m = (mat as THREE.MeshStandardMaterial).clone();
  m.normalScale = new THREE.Vector2(0.35, 0.35); // soften the muscle detail under the "fabric"
  const u = { uTop: { value: new THREE.Color(o.top) }, uPants: { value: new THREE.Color(o.pants) }, uShoes: { value: new THREE.Color(o.shoes) }, uSleeve: { value: o.sleeves ?? 0.7 } };
  const neck = o.loose ? SWEATER[o.loose].neck : [1.43, 1.47];
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vBind;" + (o.loose ? sweaterGlsl(SWEATER[o.loose]) : "")).replace("#include <begin_vertex>", "#include <begin_vertex>\nvBind = position;" + (o.loose ? "\ntransformed = mix(transformed, swPos(position), swW(position));" : ""));
    if (o.loose) sh.vertexShader = sh.vertexShader.replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nobjectNormal = normalize(mix(objectNormal, swNormal(position), swW(position)));");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBind;\nuniform vec3 uTop; uniform vec3 uPants; uniform vec3 uShoes; uniform float uSleeve;\nfloat cloth;")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        float shoe = 1.0 - smoothstep(0.085, 0.11, vBind.y);
        float pants = (1.0 - smoothstep(0.97, 1.0, vBind.y)) * (1.0 - shoe);
        float torso = smoothstep(0.97, 1.0, vBind.y) * (1.0 - smoothstep(${neck[0].toFixed(3)}, ${neck[1].toFixed(3)}, vBind.y)) * (1.0 - smoothstep(uSleeve - 0.02, uSleeve, abs(vBind.x)));
        // T-pose arms lie sideways around shoulder height: sleeves from the shoulder out to uSleeve
        float arm = smoothstep(0.16, 0.2, abs(vBind.x)) * (1.0 - smoothstep(uSleeve - 0.02, uSleeve, abs(vBind.x))) * smoothstep(1.28, 1.32, vBind.y) * (1.0 - smoothstep(1.56, 1.6, vBind.y));
        float top = max(torso, arm);
        cloth = clamp(shoe + pants + top, 0.0, 1.0);
        float weave = 0.92 + 0.08 * sin(vBind.y * 900.0) * sin(vBind.x * 900.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, uShoes, shoe);
        diffuseColor.rgb = mix(diffuseColor.rgb, uPants * weave, pants);
        diffuseColor.rgb = mix(diffuseColor.rgb, uTop * weave, top);`,
      )
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.9, cloth);");
  };
  if (o.loose) m.normalScale = new THREE.Vector2(0.12, 0.12); // knit, not muscles
  m.customProgramCacheKey = () => `dress-${o.top}-${o.pants}-${o.shoes}-${o.sleeves}-${o.loose ?? ""}`;
  return m;
};

export const Model: React.FC<ModelProps> = ({ file, anims, clip, t = 0, p = [0, 0, 0], ry = 0, scale = 1, tint, outfit, shadows = true, attach, inPlace = false, bonePose, aim }) => {
  const gltf = useGltf(file);
  const lib = useGltf(anims ?? file);
  const inst = useMemo(() => {
    if (!gltf || !lib) return null;
    const root = SkeletonUtils.clone(gltf.scene) as THREE.Object3D;
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = shadows;
        m.receiveShadow = true;
        m.frustumCulled = false; // skinned meshes move outside their bind-pose bounds
        if (outfit && !Array.isArray(m.material) && /superhero|body|regular|teen/i.test(m.material.name)) m.material = dress(m.material, outfit);
        if (tint) {
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          m.material = mats.map((mat) => {
            const key = Object.keys(tint).find((k) => mat.name.toLowerCase().includes(k.toLowerCase()));
            if (!key) return mat;
            const c = (mat as THREE.MeshStandardMaterial).clone();
            c.color = new THREE.Color(tint[key]);
            return c;
          }) as unknown as THREE.Material;
          if ((m.material as unknown as THREE.Material[]).length === 1) m.material = (m.material as unknown as THREE.Material[])[0];
        }
      }
    });
    const mixer = new THREE.AnimationMixer(root);
    let action: THREE.AnimationAction | null = null;
    const clips = lib.animations;
    if (clip !== undefined && clips.length) {
      const want = String(clip).toLowerCase();
      const c = typeof clip === "number" ? clips[clip] : clips.find((a) => a.name.toLowerCase().split("|").pop() === want) ?? clips.find((a) => a.name.toLowerCase().includes(want)) ?? clips[0];
      action = mixer.clipAction(c);
      action.play();
    }
    return { root, mixer, action };
  }, [gltf, lib, clip, tint, outfit, shadows]);
  if (!inst) return null;
  if (inst.action) inst.mixer.setTime(t % inst.action.getClip().duration);
  if (inPlace) inst.root.getObjectByName("root")?.position.set(0, 0, 0);
  if (bonePose)
    for (const [name, [x, y, z]] of Object.entries(bonePose)) {
      const b = inst.root.getObjectByName(name);
      if (b) {
        b.rotation.x += x;
        b.rotation.y += y;
        b.rotation.z += z;
      }
    }
  if (aim) {
    // work in model space: park the root at the origin, aim, then put it back (r3f only re-applies changed props)
    const r = inst.root;
    const sp = r.position.clone();
    const sq = r.quaternion.clone();
    const ss = r.scale.clone();
    r.position.set(0, 0, 0);
    r.quaternion.identity();
    r.scale.set(1, 1, 1);
    r.updateMatrixWorld(true);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    for (const [name, d] of Object.entries(aim)) {
      const bone = r.getObjectByName(name);
      const child = bone?.children.find((c) => (c as THREE.Bone).isBone);
      if (!bone || !child || !bone.parent) continue;
      bone.getWorldPosition(a);
      child.getWorldPosition(b);
      const cur = b.sub(a).normalize();
      const want = new THREE.Vector3(...d).normalize();
      const turn = new THREE.Quaternion().setFromUnitVectors(cur, want);
      const world = turn.multiply(bone.getWorldQuaternion(new THREE.Quaternion()));
      bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
      bone.updateMatrixWorld(true);
    }
    r.position.copy(sp);
    r.quaternion.copy(sq);
    r.scale.copy(ss);
    r.updateMatrixWorld(true);
  }
  const attached = (attach ? (Array.isArray(attach) ? attach : [attach]) : []).map((a) => ({ a, bone: inst.root.getObjectByName(a.bone) }));
  return (
    <>
      <primitive object={inst.root} position={p} rotation={[0, ry, 0]} scale={scale} />
      {/* keyed by the bone: when the clip changes the rig is re-cloned, and the portal must move to the new bone */}
      {attached.map(({ a, bone }, i) => (bone ? <React.Fragment key={`${bone.uuid}${i}`}>{createPortal(a.node, bone)}</React.Fragment> : null))}
    </>
  );
};

