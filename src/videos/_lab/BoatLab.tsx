import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam, CameraRig } from "../../lib/three/core";
import { Humanoid, seated } from "../../lib/three/Humanoid";
import { Lifeboat, SEAT_Y, THWARTS } from "../../lib/three/Lifeboat";

// Test bench for Lifeboat + seated people: side, top, behind, with water. Not a real video.
export const BOAT_LAB_DURATION = 4;
const VIEWS: Cam[] = [
  { pos: [0, 0.6, 6], look: [0, 0.1, 0], fov: 40 },
  { pos: [3.5, 2.5, 3.5], look: [0, 0, 0], fov: 40 },
  { pos: [4.2, 0.8, 1.2], look: [-3, 0.5, -0.6], fov: 40 },
  { pos: [0.01, 6, 0], look: [0, 0, 0], fov: 40 },
];

export const BoatLab: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#1b2333" }}>
      <ThreeCanvas width={width} height={height} camera={{ fov: 40, near: 0.05, far: 100 }}>
        <CameraRig cam={VIEWS[f]} />
        <hemisphereLight args={["#c9d6ff", "#202020", 1.4]} />
        <directionalLight position={[3, 5, 4]} intensity={1.5} />
        <group position={[0, 0.28, 0]}>
          <Lifeboat />
          {THWARTS.slice(0, 3).flatMap((x) => [-0.24, 0.24].map((z) => (
            <group key={`${x}${z}`} position={[x, SEAT_Y, z]} rotation={[0, -Math.PI / 2, 0]} scale={0.42}>
              <Humanoid pose={seated(0)} look={{ suit: "#3a3330", helmet: "none" }} />
            </group>
          )))}
        </group>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#0b1a2b" transparent opacity={0.85} />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
