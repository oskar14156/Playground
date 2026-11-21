import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { ClawMachine } from "../../lib/three/ClawMachine";
import { FursuitHead } from "../../lib/three/Mascots";
import { ArcadeCanvas } from "../claw-machine/world";

// Look-dev for the claw-machine reel (render frames 0 … 5).
export const CLAW_LAB_DURATION = 8;
const shots: { cam: Cam; xray?: number; open?: number; drop?: number }[] = [
  { cam: { pos: [1.4, 1.6, 3.2], look: [0, 1.15, 0], fov: 40 } },
  { cam: { pos: [0, 1.45, 1.35], look: [0, 1.2, 0], fov: 40 }, open: 0.9, drop: 0.5 },
  { cam: { pos: [-0.5, 1.5, 0.75], look: [-0.15, 1.25, 0], fov: 40 }, open: 0.1, drop: 0.7 },
  { cam: { pos: [0.9, 0.9, 1.6], look: [0, 0.6, 0], fov: 40 }, xray: 1 },
  { cam: { pos: [0, 2.2, 6.5], look: [0, 1.3, -1.5], fov: 50 } },
  { cam: { pos: [0.35, 1.85, 0.9], look: [0, 1.6, 0], fov: 40 } },
];

export const ClawLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = shots[Math.min(f, shots.length - 1)];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ArcadeCanvas cam={s.cam} t={f * 0.3}>
        <ClawMachine claw={{ x: 0.05, z: 0, drop: s.drop ?? 0.2, open: s.open ?? 0.5 }} t={f * 0.3} xray={s.xray ?? 0} power={s.xray ? 0.3 : 0} inside={<group position={[0.15, 0.17, -0.12]}><FursuitHead s={0.32} t={0} /></group>} />
      </ArcadeCanvas>
    </AbsoluteFill>
  );
};
