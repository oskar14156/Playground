import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam, CameraRig } from "../../lib/three/core";
import { CoasterLoop, loopRide } from "../../lib/three/CoasterLoop";

// Test bench for CoasterLoop: circle vs teardrop, train at several positions. Not a real video.
export const COASTER_LAB_DURATION = 6;
const VIEWS: { cam: Cam; round: number; t: number; style?: "steel" | "wood" }[] = [
  { cam: { pos: [0, 3, 18], look: [0, 3, 0], fov: 40 }, round: 1, t: 0.9 },
  { cam: { pos: [0, 3, 18], look: [0, 3, 0], fov: 40 }, round: 0, t: 0.9 },
  { cam: { pos: [8, 4, 12], look: [0, 3, 0], fov: 40 }, round: 0, t: 1.6 },
  { cam: { pos: [8, 4, 12], look: [0, 3, 0], fov: 40 }, round: 0, t: 2.2 },
  { cam: { pos: [-6, 2.5, 13], look: [0, 3, 0], fov: 40 }, round: 1, t: 1.8, style: "wood" },
  { cam: { pos: [0, 3, 18], look: [0, 3, 0], fov: 40 }, round: 0.5, t: 0.2 },
];

export const CoasterLab: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const v = VIEWS[f];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f39a5b, #3b2a4a)" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, near: 0.1, far: 200 }}>
        <CameraRig cam={v.cam} />
        <hemisphereLight args={["#ffd9b0", "#2a2030", 1.2]} />
        <directionalLight position={[5, 10, 8]} intensity={2} castShadow />
        <CoasterLoop round={v.round} ride={loopRide(v.t, v.round, 3)} style={v.style ?? "steel"} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#2f3a2a" />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
