import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { Canyon, Cofferdam, Dam, DamBlocks, DamCanvas, H, IntakeTowers, Lake, Look, Portal, Powerhouse, River, tunnelPts } from "../dam/world";
import { TubePath } from "../../lib/three/core";

export const DAM_LAB_DURATION = 6;

const SHOTS: { cam: Cam; look: Look; mode: "built" | "site" | "xray" | "blocks" | "profile" }[] = [
  { cam: { pos: [260, 420, 760], look: [0, 120, 60], fov: 40 }, look: "day", mode: "built" },
  { cam: { pos: [-40, 150, 620], look: [0, 110, 80], fov: 42 }, look: "day", mode: "built" },
  { cam: { pos: [30, 520, -620], look: [0, 0, 80], fov: 42 }, look: "day", mode: "site" },
  { cam: { pos: [0, 900, 200], look: [0, 0, 60], fov: 45 }, look: "xray", mode: "xray" },
  { cam: { pos: [60, 330, 520], look: [0, 90, 80], fov: 42 }, look: "day", mode: "blocks" },
  { cam: { pos: [520, 120, 120], look: [0, 100, 110], fov: 40 }, look: "day", mode: "profile" },
];

export const DamLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = SHOTS[Math.min(f, SHOTS.length - 1)];
  const xr = s.mode === "xray" ? 1 : 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <DamCanvas cam={s.cam} look={s.look}>
        <Canyon xray={xr} cut={s.mode === "profile"} />
        {s.mode === "built" ? (
          <>
            <Dam />
            <Lake y={200} />
            <IntakeTowers />
            <Powerhouse />
            <River z0={330} z1={1600} y={4} t={0} speed={2} foam={0.3} />
          </>
        ) : null}
        {s.mode === "site" || s.mode === "xray" ? (
          <>
            <Cofferdam z={-300} up={1} />
            <Cofferdam z={420} up={1} />
            <River z0={-1600} z1={-330} y={6} t={0} />
            <River z0={450} z1={1600} y={4} t={0} />
            {[-1, 1].map((sd) => [0, 1].map((ln) => <TubePath key={`${sd}${ln}`} points={tunnelPts(sd, ln)} radius={8.5} color="#4ceeff" />))}
            {[-1, 1].map((sd) => [0, 1].map((ln) => <Portal key={`${sd}${ln}`} side={sd} lane={ln} inlet />))}
          </>
        ) : null}
        {s.mode === "blocks" ? <DamBlocks s={{ top: 150, stagger: 1, studs: 1 }} /> : null}
        {s.mode === "profile" ? <Dam half /> : null}
        {s.mode === "profile" ? <Lake y={200} /> : null}
        {s.mode === "blocks" ? <Lake y={0} /> : null}
        {void H}
      </DamCanvas>
    </AbsoluteFill>
  );
};
