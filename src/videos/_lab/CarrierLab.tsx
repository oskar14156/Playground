import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { FursuitHead } from "../../lib/three/Mascots";
import { A1BReactorPair, ArrestingGearBay, CarrierHull333m, EmalsTrackCutaway } from "../carrier/props";
import { AirportTarmac, CarrierCanvas, Look, OpenOcean, StudioDark } from "../carrier/world";

export const CARRIER_LAB_DURATION = 5;

const SHOTS: { cam: Cam; look: Look; ao?: number }[] = [
  { cam: { pos: [0.4, 2.1, 5.2], look: [0, 1.0, -0.4], fov: 46 }, look: "tarmac" },
  { cam: { pos: [3.6, 2.8, 7.6], look: [0, 0.55, 0], fov: 46 }, look: "daysea", ao: 0 },
  { cam: { pos: [0.5, 2.05, 5.2], look: [0.1, 0.35, 0], fov: 46 }, look: "studio" },
  { cam: { pos: [0.4, 1.5, 5.2], look: [0, 0.15, 0], fov: 46 }, look: "studio" },
  { cam: { pos: [0.2, 1.8, 5.4], look: [0, 0.65, 0], fov: 46 }, look: "studio" },
];

export const CarrierLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = SHOTS[Math.min(f, SHOTS.length - 1)];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <CarrierCanvas cam={s.cam} look={s.look} ao={s.ao ?? 0.8}>
        {f === 0 ? (
          <AirportTarmac>
            <FursuitHead p={[0, 0.85, 0.6]} s={0.55} t={0.4} />
          </AirportTarmac>
        ) : null}
        {f === 1 ? (
          <OpenOcean t={0.4} day>
            <CarrierHull333m p={[0, 0, 0]} scale={0.9} t={0.4} hero={<FursuitHead p={[0, 0.25, 0]} s={0.35} t={0.4} />} />
          </OpenOcean>
        ) : null}
        {f === 2 ? (
          <StudioDark>
            <EmalsTrackCutaway p={[0, 0.1, 0]} t={0.4} progress={0.58} />
          </StudioDark>
        ) : null}
        {f === 3 ? (
          <StudioDark>
            <ArrestingGearBay p={[0, 0.35, 0]} t={0.4} pull={0.55} bolter={0} />
          </StudioDark>
        ) : null}
        {f === 4 ? (
          <StudioDark>
            <A1BReactorPair p={[0, 0.15, 0]} t={0.4} />
          </StudioDark>
        ) : null}
      </CarrierCanvas>
    </AbsoluteFill>
  );
};
