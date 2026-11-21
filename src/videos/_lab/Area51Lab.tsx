import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { Model } from "../../lib/three/gltf";
import { A12, ETSign, MiG21, Scrub, Sedan } from "../area-51/props";
import { DesertCanvas } from "../area-51/world";

// Look-dev for the area-51 reel (render frames 0 … 5).
export const AREA51_LAB_DURATION = 8;
const shots: Cam[] = [
  { pos: [30, 12, 30], look: [0, 0, 0], fov: 40 },
  { pos: [-18, 5, 14], look: [0, 1, 0], fov: 40 },
  { pos: [14, 4, -16], look: [0, 1, 0], fov: 40 },
  { pos: [6, 2.2, 8], look: [0, 0.8, 0], fov: 40 },
  { pos: [0, 2, 9], look: [0, 2.2, 0], fov: 40 },
  { pos: [3, 2, 5], look: [0, 1.1, 0], fov: 40 },
];

export const Area51Lab: React.FC = () => {
  const f = useCurrentFrame();
  const cam = shots[Math.min(f, shots.length - 1)];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <DesertCanvas cam={cam} t={f * 0.3}>
        <Scrub n={600} area={[-40, 40, -40, 40]} avoid={(x, z) => Math.abs(x) < 18 && Math.abs(z) < 12} />
        {f <= 0 ? (
          <group position={[0, 1.6, 0]}>
            <A12 />
          </group>
        ) : null}
        {f === 1 || f === 2 ? (
          <group position={[0, 1.6, 0]}>
            <MiG21 />
          </group>
        ) : null}
        {f === 3 ? <Sedan color="#c0392b" /> : null}
        {f === 4 ? <ETSign /> : null}
        {f >= 5 ? (
          <Model file="man_c.glb" anims="ual/ual1_ue.glb" clip="Sprint_Loop" t={0.3} p={[0, 0, 0]} ry={-0.8} outfit={{ top: "#e3c13a", pants: "#3b4a6a", shoes: "#eee" }} aim={{ spine_02: [0, 1, 0.75], upperarm_l: [0.22, -0.3, -1], lowerarm_l: [0.2, -0.28, -1], upperarm_r: [-0.22, -0.3, -1], lowerarm_r: [-0.2, -0.28, -1] }} />
        ) : null}
      </DesertCanvas>
    </AbsoluteFill>
  );
};
