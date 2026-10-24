import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { CameraRig, Cam, Stars3D } from "../../lib/three/core";
import { OceanLiner } from "../../lib/three/OceanLiner";

// Test bench for the OceanLiner model: frame 0–3 = different views / states. Not a real video.
export const LINER_LAB_DURATION = 6;
const VIEWS: { cam: Cam; split?: number; pitch?: number; stress?: number; bp?: number; water?: boolean }[] = [
  { cam: { pos: [6, 1.6, 7], look: [0, 0.4, 0], fov: 40 }, water: true },
  { cam: { pos: [0, 0.6, 10], look: [0, 0.4, 0], fov: 40 } },
  { cam: { pos: [-7, 2.5, 4], look: [0, 0.4, 0], fov: 40 }, pitch: -0.26, water: true },
  { cam: { pos: [0, 0.6, 10], look: [0, 0.4, 0], fov: 40 }, pitch: -0.26, split: 1, stress: 0.6 },
  { cam: { pos: [0, 9, 0.01], look: [0, 0, 0], fov: 50 } },
  { cam: { pos: [0, 0.6, 10], look: [0, 0.4, 0], fov: 40 }, bp: 1 },
];

export const LinerLab: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const v = VIEWS[f];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#0b1328, #02040a)" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, near: 0.1, far: 200 }}>
        <CameraRig cam={v.cam} />
        <hemisphereLight args={["#9fb6ff", "#101418", 1.1]} />
        <directionalLight position={[-5, 3, -4]} intensity={1.2} color="#8fb0ff" />
        <directionalLight position={[4, 6, 5]} intensity={1.6} color="#c9d8ff" castShadow />
        <Stars3D frame={f} count={500} radius={40} />
        <group position={[0.8, 0, 0]} rotation={[0, 0, v.pitch ?? 0]}>
          <group position={[-0.8, 0, 0]}>
            <OceanLiner frame={f} split={v.split ?? 0} stress={v.stress ?? 0} blueprint={v.bp ?? 0} />
          </group>
        </group>
        {v.water ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[80, 80]} />
            <meshStandardMaterial color="#060a14" roughness={0.3} metalness={0.5} />
          </mesh>
        ) : null}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
