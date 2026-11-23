import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { FursuitHead } from "../../lib/three/Mascots";
import {
  ArmyPerimeterBase,
  BunkerWallCutaway,
  FortKnoxBuilding,
  GoldBullionRoom,
  SelfSustainingCore,
  SplitKeypadRing,
  VaultDoor20Ton,
} from "../vault/props";
import { BunkerInterior, FortKnoxLawn, Look, StudioDark, VaultCanvas } from "../vault/world";

export const VAULT_LAB_DURATION = 6;

const SHOTS: { cam: Cam; look: Look }[] = [
  { cam: { pos: [0.5, 2.35, 8.6], look: [0, 1.15, 0], fov: 46 }, look: "nightlawn" },
  { cam: { pos: [-1.4, 2.0, 5.2], look: [0.2, 1.3, 0], fov: 46 }, look: "studio" },
  { cam: { pos: [0.4, 1.85, 5.1], look: [0, 1.45, 0], fov: 46 }, look: "bunker" },
  { cam: { pos: [0, 2.35, 4.4], look: [0, 0.85, -0.2], fov: 46 }, look: "studio" },
  { cam: { pos: [0.2, 1.8, 4.6], look: [0, 0.55, 0], fov: 46 }, look: "bunker" },
  { cam: { pos: [0, 1.85, 4.2], look: [0, 0.85, 0], fov: 46 }, look: "gold" },
];

export const VaultLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = SHOTS[Math.min(f, SHOTS.length - 1)];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <VaultCanvas cam={s.cam} look={s.look}>
        {f === 0 ? (
          <FortKnoxLawn t={0.4}>
            <FortKnoxBuilding p={[0, 0, 0]} t={0.4} />
          </FortKnoxLawn>
        ) : null}
        {f === 1 ? (
          <StudioDark>
            <BunkerWallCutaway p={[0, 0, 0]} t={0.4} />
          </StudioDark>
        ) : null}
        {f === 2 ? (
          <BunkerInterior>
            <VaultDoor20Ton p={[0, 0, 0]} t={0.4} open={0.22} torch={1} />
          </BunkerInterior>
        ) : null}
        {f === 3 ? (
          <StudioDark>
            <SplitKeypadRing p={[0, 0, 0]} t={0.4} lit={9} lost10={1} />
          </StudioDark>
        ) : null}
        {f === 4 ? (
          <BunkerInterior>
            <SelfSustainingCore p={[0, 0, -0.35]} t={0.4} />
            <ArmyPerimeterBase p={[0, 0, 1.35]} scale={0.62} t={0.4} />
          </BunkerInterior>
        ) : null}
        {f === 5 ? (
          <BunkerInterior>
            <GoldBullionRoom p={[0, 0, 0]} t={0.4} hero={<FursuitHead p={[0, 0.35, 0]} s={0.48} t={0.4} />} />
          </BunkerInterior>
        ) : null}
      </VaultCanvas>
    </AbsoluteFill>
  );
};
