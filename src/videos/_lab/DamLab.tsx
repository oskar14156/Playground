import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { FursuitHead } from "../../lib/three/Mascots";
import { CanyonTunnelsCutaway, DamCoolingMatrix, HooverArchWall, TurbineBayCutaway } from "../dam/props";
import { BlackCanyonWorld, DamCanvas, FloodedBackyard, Look, StudioDark } from "../dam/world";

export const DAM_LAB_DURATION = 5;

const SHOTS: { cam: Cam; look: Look; ao?: number }[] = [
  { cam: { pos: [-1.1, 2.75, 5.8], look: [-0.2, 1.05, 0.2], fov: 46 }, look: "yard", ao: 0 },
  { cam: { pos: [0.3, 3.1, 6.4], look: [0, 0.55, 0], fov: 46 }, look: "studio" },
  { cam: { pos: [0.4, 2.55, 6.1], look: [0, 1.35, 0], fov: 46 }, look: "canyon", ao: 0 },
  { cam: { pos: [-1.5, 2.35, 5.45], look: [-0.25, 0.9, 0], fov: 46 }, look: "studio" },
  { cam: { pos: [0.3, 1.75, 5.2], look: [0, 0.65, 0], fov: 46 }, look: "turbine" },
];

export const DamLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = SHOTS[Math.min(f, SHOTS.length - 1)];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <DamCanvas cam={s.cam} look={s.look} ao={s.ao ?? 0.8}>
        {f === 0 ? (
          <FloodedBackyard t={0.4}>
            <FursuitHead p={[-0.65, 1.85, -0.45]} s={0.5} t={0.4} />
          </FloodedBackyard>
        ) : null}
        {f === 1 ? (
          <StudioDark>
            <CanyonTunnelsCutaway p={[0, 0, 0]} t={0.4} divert={1} />
          </StudioDark>
        ) : null}
        {f === 2 ? (
          <BlackCanyonWorld t={0.4} dammed>
            <HooverArchWall p={[0, 0, 0]} t={0.4} archMode={1} />
          </BlackCanyonWorld>
        ) : null}
        {f === 3 ? (
          <StudioDark>
            <DamCoolingMatrix p={[0, 0, 0]} t={0.4} legoCool={1} />
          </StudioDark>
        ) : null}
        {f === 4 ? (
          <StudioDark>
            <TurbineBayCutaway p={[0, 0, 0]} t={0.4} />
          </StudioDark>
        ) : null}
      </DamCanvas>
    </AbsoluteFill>
  );
};
