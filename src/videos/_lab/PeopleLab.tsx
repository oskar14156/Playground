import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { CameraRig } from "../../lib/three/core";
import { KeyLight, Post, Slab, tex } from "../../lib/three/diorama";
import { Model } from "../../lib/three/gltf";

export const PEOPLE_LAB_DURATION = 90;

// Look-dev for the CC0 characters + animation library (frame → clip time).
export const PeopleLab: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = f / 30;
  return (
    <AbsoluteFill style={{ background: "#222" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, near: 0.05, far: 100 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
        <CameraRig cam={{ pos: [0, 1.5, 5.2], look: [0, 1.0, 0], fov: 40 }} />
        <hemisphereLight args={["#fff4e2", "#4a3626", 0.8]} />
        <KeyLight p={[3, 5, 4]} target={[0, 1, 0]} intensity={2.4} color="#fff1d8" size={4} />
        <Slab p={[0, -0.05, 0]} s={[10, 0.1, 10]} map={tex("planks", "#9a6a3e", [3, 3], 2)} />
        <Model file="man_a.glb" anims="ual/ual1_ue.glb" clip="Idle_Loop" t={t} p={[-0.8, 0, 0]} outfit={{ top: "#4c5a3c", pants: "#2c3440", shoes: "#2a2420" }} tint={{ Hair: "#3b2a1e" }} />
        <Model file="woman_a.glb" anims="ual/ual2.glb" clip="Idle_TalkingPhone_Loop" t={t} p={[0.8, 0, 0]} outfit={{ top: "#8a3f3a", pants: "#3a4a6a", shoes: "#e8e4dc" }} tint={{ Hair: "#6b4a2b" }} />
        <Post />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
