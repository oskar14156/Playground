import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { WhiteHouse } from "../../lib/three/WhiteHouse";
import { LawnCanvas } from "../white-house/world";

// Look-dev for the white-house reel (scripts/stills.sh white-house-lab 0 1 2 …).
export const WH_LAB_DURATION = 12;

const shots: { cam: Cam; night: number; lit?: number; door?: number; glass?: number }[] = [
  { cam: { pos: [30, 14, 95], look: [0, 9, 0], fov: 40 }, night: 0 },
  { cam: { pos: [-40, 10, -85], look: [0, 9, 0], fov: 40 }, night: 0 },
  { cam: { pos: [26, 10, 80], look: [0, 8, 0], fov: 40 }, night: 1, lit: 1 },
  { cam: { pos: [4, 3.5, 30], look: [0, 5, 13], fov: 40 }, night: 1, lit: 1, door: 0.6 },
  { cam: { pos: [-14, 5, 24], look: [-12, 4.5, 13], fov: 40 }, night: 1, lit: 1, glass: 1 },
  { cam: { pos: [60, 40, 60], look: [0, 8, 0], fov: 40 }, night: 0 },
];

export const WhiteHouseLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = shots[Math.min(f, shots.length - 1)];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <LawnCanvas cam={s.cam} t={f * 0.3} night={s.night}>
        <WhiteHouse t={f * 0.3} lit={s.lit ?? 0} door={s.door ?? 0} glass={s.glass ?? 0} />
      </LawnCanvas>
    </AbsoluteFill>
  );
};
