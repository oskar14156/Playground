import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { FursuitHead } from "../../lib/three/Mascots";
import { Model, Outfit } from "../../lib/three/gltf";
import {
  BoatDeckCutaway,
  BulkheadCutaway,
  CrowsNest,
  FloatingDoor,
  FunnelCutaway,
  HeatedPool,
  Iceberg,
  Speedboat,
  SternTurbine,
} from "../unsinkable/props";
import { AtlanticNight, HarborPier, Look, ShipCanvas, StudioDark, UnderwaterDeep } from "../unsinkable/world";

export const UNSINKABLE_LAB_DURATION = 6;
const GRANDMA: Outfit = { top: "#6f4b86", pants: "#262834", shoes: "#1e1f26", loose: "female" };
const LIB2 = "ual/ual2.glb";

const SHOTS: { cam: Cam; look: Look; ao?: number }[] = [
  // 0: BulkheadCutaway mid-spillover over open E-Deck tops
  { cam: { pos: [0.35, 2.15, 7.2], look: [0.05, 1.15, 0], fov: 46 }, look: "studio" },
  // 1: FunnelCutaway (#1-#3 steaming, #4 split open hollow air vent)
  { cam: { pos: [-0.4, 1.55, 5.2], look: [-0.6, 0.72, 0], fov: 44 }, look: "studio" },
  // 2: BoatDeckCutaway (20 solid + glowing red cut ghosts + lower hull & portholes)
  { cam: { pos: [0.15, 1.65, 5.05], look: [0, 0.05, 0.2], fov: 44 }, look: "harbor", ao: 0.4 },
  // 3: SternTurbine (3/4 behind-starboard angle framing ALL 3 props + rudder wash loss cleanly)
  { cam: { pos: [1.85, 0.68, 2.35], look: [0, 0.24, -0.05], fov: 44 }, look: "abyss" },
  // 4: CrowsNest + Iceberg (locked BINOCULARS chest, drifting brass key, sculpted iceberg)
  { cam: { pos: [0.35, 1.48, 3.85], look: [0.22, 0.65, 0.05], fov: 45 }, look: "night", ao: 0.3 },
  // 5: HeatedPool (still full & tiles shimmering through) + FloatingDoor ("ROOM FOR 2" + FursuitHead) + Speedboat
  { cam: { pos: [0.0, 2.05, 4.45], look: [0, 0.42, 0.1], fov: 45 }, look: "abyss" },
];

export const UnsinkableLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = SHOTS[Math.min(f, SHOTS.length - 1)];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ShipCanvas cam={s.cam} look={s.look} ao={s.ao ?? 0.8}>
        {f === 0 ? (
          <StudioDark spotI={28}>
            <BulkheadCutaway p={[0, 1.05, 0]} scale={0.9} t={0.4} flood={0.78} />
          </StudioDark>
        ) : null}

        {f === 1 ? (
          <StudioDark spotI={26}>
            <FunnelCutaway p={[0, 0.45, 0]} scale={0.9} t={0.4} cutaway={1} />
          </StudioDark>
        ) : null}

        {f === 2 ? (
          <HarborPier t={0.3}>
            <BoatDeckCutaway p={[0, 1.15, 0]} scale={0.95} ghosts={1} />
          </HarborPier>
        ) : null}

        {f === 3 ? (
          <UnderwaterDeep t={0.4} spotI={28}>
            <SternTurbine p={[0, 0.25, 0]} ry={0.05} scale={1.08} t={0.4} stalled={1} rudderAngle={0.42} />
          </UnderwaterDeep>
        ) : null}

        {f === 4 ? (
          <AtlanticNight t={0.3}>
            <CrowsNest p={[-0.45, 0.4, 0]} ry={0.2} scale={1.0} t={0.3} locked={1} keyAway={0.25} />
            <Iceberg p={[1.15, 0.25, -1.25]} ry={-0.35} scale={0.85} t={0.3} />
          </AtlanticNight>
        ) : null}

        {f === 5 ? (
          <UnderwaterDeep t={0.5} spotI={26}>
            <HeatedPool p={[0, 0.15, -1.2]} scale={0.82} t={0.5} wreck={1} />
            <FloatingDoor
              p={[-0.35, -0.1, 0.95]}
              ry={0.1}
              scale={0.76}
              t={0.5}
              hero={<FursuitHead p={[0, 0.26, 0]} s={0.42} ry={0.1} t={0.5} />}
            />
            <Speedboat
              p={[1.25, 0.0, 0.35]}
              ry={-2.55}
              scale={0.52}
              t={0.5}
              driver={
                <Model
                  file="woman_c.glb"
                  anims={LIB2}
                  clip="Idle_Loop"
                  t={0.5}
                  outfit={GRANDMA}
                  tint={{ Hair: "#d9d9d9" }}
                  attach={{ bone: "Head", node: <FursuitHead p={[0, -0.2, 0.03]} s={0.5} /> }}
                />
              }
            />
          </UnderwaterDeep>
        ) : null}
      </ShipCanvas>
    </AbsoluteFill>
  );
};
