import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { FursuitHead } from "../../lib/three/Mascots";
import { Model, Outfit } from "../../lib/three/gltf";
import {
  BurjTower,
  CloudPenthouse,
  DoubleDeckElevator,
  FrictionPilesCutaway,
  IceConcreteMixer,
  WindVortexTunnel,
  WindowWasherCradle,
} from "../skyscraper/props";
import { DubaiDesert, Look, NightSite, SkyCanvas, StudioDark } from "../skyscraper/world";

export const SKYSCRAPER_LAB_DURATION = 6;
const LIB1 = "ual/ual1_ue.glb";
const GRANDMA: Outfit = { top: "#6f4b86", pants: "#262834", shoes: "#2c2e38", loose: "female" };

const SHOTS: { cam: Cam; look: Look; ao?: number }[] = [
  // 0: CloudPenthouse + peeking BurjTower behind
  { cam: { pos: [-1.4, 2.2, 4.6], look: [0.2, 1.0, -0.4], fov: 46 }, look: "clouds", ao: 0 },
  // 1: FrictionPilesCutaway underground desert cutaway
  { cam: { pos: [0.3, -0.35, 6.2], look: [0, -1.05, 0], fov: 46 }, look: "underground" },
  // 2: IceConcreteMixer at illuminated night site
  { cam: { pos: [0.2, 1.85, 5.4], look: [0.05, 0.95, 0], fov: 46 }, look: "nightsite" },
  // 3: WindVortexTunnel (Y-shape 27 setbacks breaking vortices)
  { cam: { pos: [0.2, 1.8, 5.2], look: [0, 1.05, 0], fov: 46 }, look: "studio" },
  // 4: DoubleDeckElevator shaft + WindowWasherCradle
  { cam: { pos: [0.1, 1.5, 4.8], look: [0, 0.35, 0], fov: 46 }, look: "studio" },
  // 5: Full BurjTower rising above DubaiDesert skyline
  { cam: { pos: [1.8, 3.2, 9.6], look: [0, 3.2, 0], fov: 46 }, look: "clouds", ao: 0 },
];

export const SkyscraperLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = SHOTS[Math.min(f, SHOTS.length - 1)];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <SkyCanvas cam={s.cam} look={s.look} ao={s.ao ?? 0.8}>
        {f === 0 ? (
          <group>
            <CloudPenthouse
              p={[-0.7, 0.5, 0.4]}
              t={0.4}
              resident={
                <Model
                  file="woman_c.glb"
                  anims={LIB1}
                  clip="Idle_Loop"
                  t={0.4}
                  outfit={GRANDMA}
                  tint={{ Hair: "#d9d9d9" }}
                  attach={{ bone: "Head", node: <FursuitHead p={[0, -0.2, 0.03]} s={0.5} /> }}
                />
              }
            />
            <BurjTower p={[1.6, -1.8, -1.5]} scale={0.7} t={0.4} cutaway={0.4} />
          </group>
        ) : null}

        {f === 1 ? (
          <FrictionPilesCutaway p={[0, 0.25, 0]} scale={0.95} t={0.4} arrows={1} />
        ) : null}

        {f === 2 ? (
          <NightSite>
            <IceConcreteMixer p={[0, 0, 0]} scale={0.95} t={0.4} hotCrack={0} />
          </NightSite>
        ) : null}

        {f === 3 ? (
          <StudioDark spotI={26}>
            <WindVortexTunnel p={[0, 0.25, 0]} scale={0.95} t={0.4} yShape={1} />
          </StudioDark>
        ) : null}

        {f === 4 ? (
          <StudioDark spotI={26}>
            <DoubleDeckElevator p={[-1.0, 0.3, 0]} scale={0.8} t={0.4} lift={0.5} />
            <WindowWasherCradle
              p={[0.95, 0.2, 0]}
              scale={0.68}
              t={0.4}
              progress={0.55}
              washer={<Model file="man_b.glb" anims={LIB1} clip="Interact" t={0.4} scale={0.45} outfit={{ top: "#f5a623", pants: "#223042", shoes: "#1c2028", loose: "male" }} />}
            />
          </StudioDark>
        ) : null}

        {f === 5 ? (
          <DubaiDesert t={0.4}>
            <BurjTower p={[0, 0, 0]} scale={0.95} t={0.4} sway={0.25} />
          </DubaiDesert>
        ) : null}
      </SkyCanvas>
    </AbsoluteFill>
  );
};
