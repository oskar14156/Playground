import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { BurjKhalifa, StraightGlassTower } from "../skyscraper/burj";
import { FrictionSchematic, VortexPlanSchematic } from "../skyscraper/inserts";
import {
  ConcretePourSite,
  ConstructionCoreDeck,
  DoubleDeckCoreCutaway,
  FacadeWashScene,
  GeologyFoundationCutaway,
  LuxuryPenthouse,
  StormPenthouseSpire,
  WindStreamlines,
} from "../skyscraper/props";
import { CloudDeck, DowntownDubai, DubaiCanvas, Mood } from "../skyscraper/world";

export const SKYSCRAPER_LAB_DURATION = 12;
const LIB1 = "ual/ual1_ue.glb";
const GRANDMA: Outfit = { top: "#6f4b86", pants: "#262834", shoes: "#2c2e38", loose: "female" };
const WORN: V3 = [0, -0.2, 0.03];

const SHOTS: { cam: Cam; mood: Mood; nightMix?: number; ao?: number; fog?: [number, number]; shadow?: number; keyPos?: V3 }[] = [
  // 0: LuxuryPenthouse interior hero close-up
  { cam: { pos: [-2.1, 1.95, 6.4], look: [-2.4, 1.45, -0.3], fov: 44 }, mood: "day", ao: 0, fog: [60, 1000], shadow: 20 },
  // 1: Hook wide (Penthouse + rising ConstructionCoreDeck + TowerCrane + Friend in narrow 9:16!)
  { cam: { pos: [0.35, 2.75, 14.4], look: [0.3, 1.9, -0.1], fov: 46 }, mood: "day", ao: 0, fog: [60, 1200], shadow: 28 },
  // 2: Full 828 m BurjKhalifa from Burj Lake fountains to spire beacon above Downtown Dubai
  { cam: { pos: [85, 360, 1080], look: [-10, 415, 0], fov: 46 }, mood: "sunset", ao: 0, fog: [600, 7500], shadow: 460 },
  // 3: Subterranean GeologyFoundationCutaway (rig + Burj stub + Y-raft + rebar + strata + friction piles ALL visible!)
  { cam: { pos: [0.0, -0.45, 15.0], look: [-0.15, -1.65, -0.2], fov: 46 }, mood: "day", ao: 0.75, fog: [35, 320], shadow: 22, keyPos: [5, 10, 14] },
  // 4: 2D FrictionSchematic
  { cam: { pos: [0, 0, 5], look: [0, 0, 0], fov: 45 }, mood: "day", ao: 0 },
  // 5: 50°C Daytime ConcretePourSite (Ice silo, striped mixer truck, pump, riser, cracked deck ALL framed cleanly)
  { cam: { pos: [0.1, 3.05, 13.5], look: [0.1, 1.65, -0.15], fov: 46 }, mood: "heat", nightMix: 0, ao: 0.7, fog: [28, 320], shadow: 26, keyPos: [6, 11, 10] },
  // 6: Midnight Floodlit Crushed-Ice Pour
  { cam: { pos: [0.1, 3.05, 13.5], look: [0.1, 1.65, -0.15], fov: 46 }, mood: "heat", nightMix: 1, ao: 0.7, fog: [28, 320], shadow: 26, keyPos: [6, 11, 10] },
  // 7: 3D WindStreamlines breaking around BurjKhalifa Y-setbacks
  { cam: { pos: [110, 420, 920], look: [-45, 400, 0], fov: 46 }, mood: "day", ao: 0, fog: [650, 6800], shadow: 420 },
  // 8: 2D VortexPlanSchematic
  { cam: { pos: [0, 0, 5], look: [0, 0, 0], fov: 45 }, mood: "day", ao: 0 },
  // 9: StormPenthouseSpire (flexing Burj pinnacle ABOVE roof + rain + storm clouds + cozy chandelier suite)
  { cam: { pos: [0.3, 2.2, 10.6], look: [0.0, 1.55, 0.0], fov: 45 }, mood: "storm", ao: 0.65, fog: [28, 320], shadow: 18, keyPos: [4, 8, 8] },
  // 10: DoubleDeckCoreCutaway (8 furnished floors + glass cabs + visible red stair climber!)
  { cam: { pos: [0.2, 4.6, 11.4], look: [0, 4.2, -0.2], fov: 46 }, mood: "day", ao: 0.75, fog: [40, 420], shadow: 26, keyPos: [4, 14, 12] },
  // 11: FacadeWashScene angled to show dizzying 600 m drop to Downtown Dubai + clean sparkle vs sand!
  { cam: { pos: [3.35, 0.55, 8.9], look: [-0.6, 0.3, 0.0], fov: 46 }, mood: "day", ao: 0.45, fog: [45, 600], shadow: 18, keyPos: [8, 9, 10] },
];

export const SkyscraperLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = SHOTS[Math.min(f, SHOTS.length - 1)];

  if (f === 4) return <FrictionSchematic f={35} at={0} />;
  if (f === 8) return <VortexPlanSchematic f={45} at={0} setbacksAt={10} />;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <DubaiCanvas
        cam={s.cam}
        t={0.45}
        mood={s.mood}
        nightMix={s.nightMix}
        ao={s.ao ?? 0.65}
        fogRange={s.fog}
        shadow={s.shadow}
        keyPos={s.keyPos}
      >
        {f === 0 || f === 1 ? (
          <>
            <group position={[0, -95, -28]} scale={0.18}>
              <DowntownDubai t={0.45} showFountain={false} showBoulevard={false} />
            </group>
            <CloudDeck y={-11} count={14} seed={19} spread={56} t={0.45} scale={1.55} />
            <LuxuryPenthouse
              p={[-2.1, 0.2, 0.2]}
              ry={0.14}
              scale={0.78}
              t={0.45}
              resident={
                <Model
                  file="woman_c.glb"
                  anims={LIB1}
                  clip="Idle_Loop"
                  t={0.45}
                  outfit={GRANDMA}
                  tint={{ Hair: "#d9d9d9" }}
                  attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
                />
              }
            />
            {f === 1 ? <ConstructionCoreDeck p={[3.0, 0.2, -0.15]} scale={0.86} t={0.45} showFriend crane /> : null}
          </>
        ) : null}

        {f === 2 ? (
          <>
            <DowntownDubai t={0.45} night={0.38} sunset={0.95} showFountain showBoulevard />
            <CloudDeck y={380} count={12} seed={82} spread={400} t={0.45} scale={18} tint="#ffd6b8" opacity={0.58} />
            <BurjKhalifa p={[0, 0, 0]} scale={1} t={0.45} lit={0.9} sway={0.2} />
          </>
        ) : null}

        {f === 3 ? <GeologyFoundationCutaway p={[0, 0.4, 0]} t={0.45} drillK={1} arrows={1} /> : null}

        {f === 5 || f === 6 ? (
          <>
            <group position={[0, -0.15, -34]} scale={0.14}>
              <DowntownDubai t={0.45} night={f === 6 ? 1 : 0} showFountain={false} showBoulevard={false} />
            </group>
            <ConcretePourSite
              p={[0, 0, 0]}
              t={0.45}
              nightK={f === 6 ? 1 : 0}
              iceFlow={f === 6 ? 1 : 0}
              crackK={f === 5 ? 1 : 0}
              pumpPulse={1}
            />
          </>
        ) : null}

        {f === 7 ? (
          <>
            <DowntownDubai t={0.45} />
            <StraightGlassTower p={[-175, 0, -40]} scale={0.9} t={0.45} flex={1} />
            <BurjKhalifa p={[45, 0, 0]} scale={1} t={0.45} highlightSetbacks={0.8} />
            <WindStreamlines p={[45, 0, 0]} scale={1} t={0.45} yShape={1} />
          </>
        ) : null}

        {f === 9 ? (
          <>
            <CloudDeck y={-2.5} count={14} seed={91} spread={32} t={0.45} scale={1.5} tint="#28384e" opacity={0.8} />
            <StormPenthouseSpire p={[0, 0, 0]} t={0.45} />
          </>
        ) : null}

        {f === 10 ? (
          <>
            <group position={[0, -42, -32]} scale={0.14}>
              <DowntownDubai t={0.45} showFountain={false} showBoulevard={false} />
            </group>
            <DoubleDeckCoreCutaway p={[0, 0, 0]} t={0.45} lift={0.32} />
          </>
        ) : null}

        {f === 11 ? (
          <>
            <group position={[12, -56, -24]} scale={0.14}>
              <DowntownDubai t={0.45} showFountain={false} showBoulevard />
            </group>
            <CloudDeck y={-28} count={10} seed={67} spread={45} t={0.45} scale={1.2} opacity={0.65} />
            <FacadeWashScene p={[-1.05, 0.2, 0]} ry={0.34} t={0.45} buildK={1} washProgress={0.55} dustReturn={0} />
          </>
        ) : null}
      </DubaiCanvas>
    </AbsoluteFill>
  );
};
