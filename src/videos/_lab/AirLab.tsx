import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { Airliner, GEAR_Y } from "../airplane/plane";
import { AirCanvas, Hangar } from "../airplane/world";
import { Ashtray, Cabin, CabinDoor, flightMapTex, GumTree, KangarooSign, LaunchRail, Lavatory, MealTray, WindowPanel, WrightFlyer } from "../airplane/props";

// Look-dev for the airplane reel (node scripts/stills_fast.mjs air-lab out/stills/airlab 0.4 0 1 2 …).
export const AIR_LAB_DURATION = 16;
const Y = -GEAR_Y; // fuselage axis above the floor

export const AirLab: React.FC = () => {
  const f = useCurrentFrame();
  const shots: { cam: Cam; skin?: number; paint?: number; wings?: number; engines?: number; hangar?: boolean; fly?: boolean }[] = [
    { cam: { pos: [-60, 14, -70], look: [0, Y, 0], fov: 40 }, hangar: true },
    { cam: { pos: [-95, Y, 0], look: [0, Y, 0], fov: 40 }, hangar: true },
    { cam: { pos: [30, 70, 60], look: [0, Y, 0], fov: 45 }, hangar: true },
    { cam: { pos: [-20, Y - 2, -30], look: [-11.9, Y - 3, -10], fov: 40 }, hangar: true },
    { cam: { pos: [-40, 12, -30], look: [0, Y, 0], fov: 40 }, hangar: true, skin: 0.45, paint: 0, wings: 0, engines: 0 },
    { cam: { pos: [-60, 14, -70], look: [0, Y, 0], fov: 40 }, hangar: true, paint: 0 },
    { cam: { pos: [-70, 18, 60], look: [0, 0, 0], fov: 38 }, fly: true },
    { cam: { pos: [50, 6, -110], look: [0, 0, 0], fov: 38 }, fly: true },
  ];
  if (f >= 8) {
    const extra: { cam: Cam; ground: "field" | "none" | "hangar"; node: React.ReactNode }[] = [
      { cam: { pos: [-9, 3, -11], look: [0, 1.4, 0], fov: 42 }, ground: "field", node: <><LaunchRail p={[0, 0, 2]} /><WrightFlyer t={f} /></> },
      { cam: { pos: [7, 1.6, 8], look: [0, 1.4, 0], fov: 42 }, ground: "field", node: <><LaunchRail p={[0, 0, 2]} /><WrightFlyer t={f} /><KangarooSign p={[4, 0, -4]} /><GumTree p={[-12, 0, -16]} /></> },
      { cam: { pos: [0.4, 1.45, 1.4], look: [0, 1.0, -5], fov: 55 }, ground: "none", node: <Cabin rows={14} screen={flightMapTex(0.4)} /> },
      { cam: { pos: [2.2, 1.2, -1.5], look: [-2, 1.0, -3.5], fov: 50 }, ground: "none", node: <><Cabin rows={10} /><MealTray p={[-1.95, 0.75, -2.9]} /></> },
      { cam: { pos: [0, 1.5, 1.9], look: [0, 1.1, -0.4], fov: 55 }, ground: "none", node: <><Lavatory /><group position={[-0.5, 1.0, 0.65]} rotation={[0, Math.PI / 2, 0]}><Ashtray p={[0, 0, 0]} open={0.6} /></group></> },
      { cam: { pos: [0.6, 0.3, 2.4], look: [0, 0, 0], fov: 40 }, ground: "none", node: <><group position={[-1.6, 0, 0]}><WindowPanel cracks={1} /></group><group position={[1.6, 0, 0]}><WindowPanel round={1} /></group></> },
      { cam: { pos: [1.2, 1.1, 2.6], look: [0, 1.0, 0], fov: 45 }, ground: "none", node: <group position={[0, 1, 0]}><CabinDoor handle={0.5} /></group> },
    ];
    const e = extra[Math.min(f - 8, extra.length - 1)];
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <AirCanvas cam={e.cam} t={f / 30} ground={e.ground} high={e.ground === "none" ? 1 : 0} clouds={e.ground === "none" ? -700 : null}>
          {e.node}
        </AirCanvas>
      </AbsoluteFill>
    );
  }
  const s = shots[Math.min(f, shots.length - 1)];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AirCanvas cam={s.cam} t={f / 30} ground={s.fly ? "none" : "hangar"} high={s.fly ? 1 : 0} clouds={s.fly ? -700 : null}>
        {s.hangar ? <Hangar /> : null}
        <group position={[0, s.fly ? 0 : Y, 0]}>
          <Airliner frame={f * 3} skin={s.skin ?? 1} paint={s.paint ?? 1} wings={s.wings ?? 1} engines={s.engines ?? 1} gear={!s.fly} lights />
        </group>
      </AirCanvas>
    </AbsoluteFill>
  );
};
