import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { FilmLook } from "../../lib/Backdrop";
import { Readout } from "../../lib/Hud";
import { palettes } from "../../lib/theme";
import { keys3 } from "../../lib/timing";
import { CameraRig, Glow } from "../../lib/three/core";
import { climb, float, Humanoid, idle, mixPose, seated, walk, wave } from "../../lib/three/Humanoid";

// Test bench for the Humanoid + lighting look (submarine-reel style). Not a real video.
export const HUMAN_LAB_DURATION = 150;
const P = palettes.deep;

export const HumanLab: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const cam = { pos: keys3(frame, [[0, [3.2, 2.3, 7.4]], [150, [-2.2, 1.9, 6.6]]]), look: [0, 1.0, 0] as [number, number, number], fov: 38 };
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${P.bgTop}, ${P.bgBottom})` }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
        <CameraRig cam={cam} />
        <fog attach="fog" args={[P.bgBottom, 6, 16]} />
        <hemisphereLight args={["#bcd3ff", "#202a35", 0.7]} />
        <spotLight position={[0, 5, 2]} angle={0.7} penumbra={0.6} intensity={60} castShadow shadow-mapSize={[2048, 2048]} color="#fff3e0" />
        <directionalLight position={[-4, 3, -2]} intensity={0.6} color="#7fb2ff" />
        {/* floor + back wall of an escape trunk room */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#cfd5db" roughness={0.55} metalness={0.1} />
        </mesh>
        <mesh position={[0, 1.6, -1.6]} receiveShadow>
          <boxGeometry args={[7, 3.2, 0.1]} />
          <meshStandardMaterial color="#e8ebef" roughness={0.7} />
        </mesh>
        <mesh position={[0, 3.2, -1.1]}>
          <boxGeometry args={[7, 0.12, 1.2]} />
          <meshStandardMaterial color="#ff5a1f" roughness={0.4} emissive="#ff5a1f" emissiveIntensity={0.15} />
        </mesh>
        {/* ladder */}
        {[-0.25, 0.25].map((x) => (
          <mesh key={x} position={[x + 1.4, 1.5, -1.4]}>
            <cylinderGeometry args={[0.025, 0.025, 3, 8]} />
            <meshStandardMaterial color="#9aa3ad" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[1.4, 0.3 + i * 0.32, -1.4]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.018, 0.5, 8]} />
            <meshStandardMaterial color="#9aa3ad" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
        <Humanoid position={[-1.2, 0, 0]} pose={walk(t, 0.8)} rotation={[0, 0.6, 0]} />
        <Humanoid position={[0, 0, 0.3]} pose={mixPose(idle(t), wave(t), Math.min(1, t / 1.5))} />
        <Humanoid position={[1.4, 0.4 + t * 0.12, -1.15]} pose={climb(t)} rotation={[0, Math.PI, 0]} />
        <Humanoid position={[-2.4, 0, 1]} pose={seated(t)} look={{ suit: "#4b5a3a", helmet: "flight", helmetColor: "#8b949c", stripe: "#c9b458" }} />
        <Humanoid position={[2.6, 0.6 + Math.sin(t) * 0.05, 1]} pose={float(t)} />
        <Glow position={[0, 3.05, -1.05]} size={1.2} color="#fff1d8" opacity={0.6} />
      </ThreeCanvas>
      <Readout at={10} value={594} from={620} countFrames={120} unit="FT" label="DEPTH" palette={P} />
      <FilmLook />
    </AbsoluteFill>
  );
};
