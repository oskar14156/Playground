import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam, CameraRig } from "../../lib/three/core";
import { Volcano } from "../../lib/three/Volcano";

// Test bench for the Volcano terrain in its states. Not a real video.
export const VOLCANO_LAB_DURATION = 5;
const VIEWS: { cam: Cam; kind: "strato" | "shield"; bulge?: number; collapse?: number; night?: boolean }[] = [
  { cam: { pos: [0, 2.2, -16], look: [0, 1.4, 0], fov: 40 }, kind: "strato" },
  { cam: { pos: [6, 2.0, -14], look: [0, 1.4, 0], fov: 40 }, kind: "strato", bulge: 1 },
  { cam: { pos: [3, 3.0, -15], look: [0, 1.2, 0], fov: 40 }, kind: "strato", collapse: 1 },
  { cam: { pos: [10, 3, 18], look: [0, 0.4, 0], fov: 40 }, kind: "shield", night: true },
  { cam: { pos: [0, 30, 0.01], look: [0, 0, 0], fov: 50 }, kind: "strato", collapse: 1 },
];

export const VolcanoLab: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const v = VIEWS[f];
  return (
    <AbsoluteFill style={{ background: v.night ? "linear-gradient(#050913, #0b1530)" : "linear-gradient(#5d86c2, #c9d9ec)" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 40, near: 0.1, far: 200 }}>
        <CameraRig cam={v.cam} />
        <hemisphereLight args={[v.night ? "#5a6c9a" : "#cfe0ff", "#3a3226", v.night ? 0.5 : 1.0]} />
        <directionalLight position={[8, 10, -6]} intensity={v.night ? 0.3 : 2.2} color="#fff2dc" castShadow />
        <Volcano kind={v.kind} bulge={v.bulge ?? 0} collapse={v.collapse ?? 0} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
