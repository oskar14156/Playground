import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, project, V3 } from "../../lib/three/core";
import { Cyl, RB } from "../../lib/three/diorama";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { FollowPill } from "../../lib/Follow";
import { easeInOut, easeOut, keys, keys3, ramp } from "../../lib/timing";
import { BurjKhalifa, StraightGlassTower } from "./burj";
import { c } from "./cues";
import {
  Big,
  CalendarBadge,
  CounterPill,
  FrictionSchematic,
  HeightCompareBadge,
  Stamp,
  Tag,
  TempGauge,
  VortexPlanSchematic,
} from "./inserts";
import {
  Binoculars,
  ConcretePourSite,
  ConstructionCoreDeck,
  DoubleDeckCoreCutaway,
  FacadeWashScene,
  GeologyFoundationCutaway,
  LuxuryPenthouse,
  StormPenthouseSpire,
  WindStreamlines,
} from "./props";
import { CloudDeck, DowntownDubai, DubaiCanvas } from "./world";

export type SetProps = { f: number };
const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const W = 1080;
const H = 1920;

const GRANDMA: Outfit = { top: "#6f4b86", pants: "#262834", shoes: "#2c2e38", loose: "female" };
const FRIEND: Outfit = { top: "#2874c9", pants: "#242b38", shoes: "#1a1d24", loose: "male" };
const WORN: V3 = [0, -0.2, 0.03];

const atOf = (cam: Cam) => (p: V3) => {
  const d = Math.hypot(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]);
  if (d < 900) return project(p, cam, W, H);
  const k = 500 / d;
  return project(
    [
      cam.pos[0] + (p[0] - cam.pos[0]) * k,
      cam.pos[1] + (p[1] - cam.pos[1]) * k,
      cam.pos[2] + (p[2] - cam.pos[2]) * k,
    ],
    cam,
    W,
    H,
  );
};

// ───────────────────────── 1. HOOK: Grandma in cloud penthouse + rising skyscraper core next door ─────────────────────────
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const riseY = keys(f, [
    [0, -1.8],
    [c.taller, -0.35],
    [c.peek, 0.25],
  ], easeOut);

  const cam: Cam = {
    pos: keys3(f, [
      [0, [-1.95, 1.9, 6.2]],
      [c.clouds, [-1.6, 2.05, 7.2]],
      [c.taller, [0.25, 2.65, 13.8]],
      [c.peek, [0.35, 2.75, 14.4]],
    ]),
    look: keys3(f, [
      [0, [-2.05, 1.45, 0.2]],
      [c.clouds, [-1.6, 1.5, 0.2]],
      [c.taller, [0.25, 1.85, -0.1]],
      [c.peek, [0.3, 1.9, -0.1]],
    ]),
    fov: keys(f, [
      [0, 44],
      [c.taller, 46],
    ]),
  };

  const at = atOf(cam);
  const pTitanic = at([-2.3, 1.95, -1.6]);
  const pFriend = at([1.95, riseY + 2.75, 0.2]);

  return (
    <AbsoluteFill>
      <DubaiCanvas cam={cam} t={t} mood="day" ao={0} fogRange={[60, 1200]} shadow={28}>
        {/* Distant Downtown Dubai skyline shimmering far beneath the cloud bank */}
        <group position={[0, -95, -28]} scale={0.18}>
          <DowntownDubai t={t} night={0} sunset={0} showFountain={false} showBoulevard={false} />
        </group>
        <CloudDeck y={-11} count={14} seed={19} spread={56} t={t} scale={1.55} />
        <CloudDeck y={-17.5} count={16} seed={31} spread={62} t={t} scale={2.15} opacity={0.94} />
        <CloudDeck y={-28} count={12} seed={52} spread={52} t={t} scale={1.9} opacity={0.55} />

        {/* Left: Furnished Cloud Penthouse with Grandma wearing FursuitHead */}
        <LuxuryPenthouse
          p={[-2.1, 0.2, 0.2]}
          ry={0.14}
          scale={0.78}
          t={t}
          resident={
            <Model
              file="woman_c.glb"
              anims={LIB1}
              clip="Idle_Loop"
              t={t}
              outfit={GRANDMA}
              tint={{ Hair: "#d9d9d9" }}
              attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
            />
          }
        />

        {/* Right: Rising skyscraper construction core + tower crane + crew + Friend with binoculars */}
        <ConstructionCoreDeck p={[3.0, riseY, -0.15]} scale={0.86} t={t} showFriend crane />
      </DubaiCanvas>

      {f >= c.titanic && f < c.taller + 8 && pTitanic ? (
        <Tag x={pTitanic.x} y={pTitanic.y} text="SAVED FROM TITANIC ✓" color="#4ceeff" side="right" size={30} o={fadeIn(f, c.titanic)} />
      ) : null}
      {f >= c.peek - 4 && pFriend ? (
        <Tag x={pFriend.x} y={pFriend.y} text="SPY RIG NEXT DOOR" color="#ffd23f" side="right" size={32} o={fadeIn(f, c.peek - 4)} />
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 2. FOUNDATION: 163-floor build/sink -> underground geological cutaway -> 2D engineering schematic ─────────────────────────
export const SetFoundation: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;

  // Sub-beat C: Full-screen 2D animated geotechnical engineering schematic
  if (f >= c.hangs) {
    return (
      <AbsoluteFill>
        <FrictionSchematic f={f} at={c.hangs} />
        <Stamp f={f} at={c.friction} text="FRICTION ONLY" top={1530} color="#ffd23f" size={82} />
      </AbsoluteFill>
    );
  }

  // Sub-beat B: Underground geological cutaway with piling rig, Y-raft & 192 concrete friction piles
  if (f >= c.noBedrock) {
    const drillK = ramp(f, c.piles192 - 4, c.raft4m + 10, easeOut);
    const arrows = ramp(f, c.piles192, c.raft4m + 6, easeOut);
    const cam: Cam = {
      pos: keys3(f, [
        [c.noBedrock, [-0.15, 0.4, 14.4]],
        [c.piles192, [0.0, -0.45, 15.0]],
        [c.raft4m, [0.1, -0.95, 14.4]],
      ]),
      look: keys3(f, [
        [c.noBedrock, [-0.25, -0.9, -0.2]],
        [c.piles192, [-0.15, -1.65, -0.2]],
        [c.raft4m, [0.0, -1.9, -0.2]],
      ]),
      fov: 46,
    };
    const at = atOf(cam);
    const pRaft = at([1.4, -0.1, 0.8]);
    const pPiles = at([-1.4, -4.1, 0.6]);

    return (
      <AbsoluteFill>
        <DubaiCanvas cam={cam} t={t} mood="day" ao={0.75} fogRange={[35, 320]} shadow={22} keyPos={[5, 10, 14]}>
          <GeologyFoundationCutaway p={[0, 0.4, 0]} scale={1.0} t={t} drillK={drillK} arrows={arrows} />
        </DubaiCanvas>
        {f >= c.raft4m && pRaft ? (
          <Tag x={pRaft.x} y={pRaft.y} text="3.7 m · 12 ft Y-RAFT" color="#4ceeff" side="right" size={32} o={fadeIn(f, c.raft4m)} />
        ) : null}
        {f >= c.piles192 + 4 && pPiles ? (
          <Tag x={pPiles.x} y={pPiles.y} text="192 PILES · 50 m (164 ft)" color="#ffd23f" side="left" size={30} o={fadeIn(f, c.piles192 + 4)} />
        ) : null}
        <Stamp f={f} at={c.noBedrock + 4} until={c.piles192 + 8} text="ZERO BEDROCK ✗" top={1320} color="#ff4b3a" size={78} />
      </AbsoluteFill>
    );
  }

  // Sub-beat A: 163-floor build on desert sand -> heavy sink warning!
  const build = ramp(f, c.floors163, c.tons450 + 6, easeOut);
  const sink = ramp(f, c.sand, c.noBedrock - 2, easeInOut);
  const flCount = Math.round(build * 163);
  const cam: Cam = {
    pos: keys3(f, [
      [c.floors163, [145, 220, 620]],
      [c.tons450, [115, 290, 560]],
      [c.sand, [85, 65, 240]],
    ]),
    look: keys3(f, [
      [c.floors163, [0, 290, 0]],
      [c.sand, [0, 38, 0]],
    ]),
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <DubaiCanvas cam={cam} t={t} mood="day" ao={0} fogRange={[600, 6500]} shadow={420}>
        <DowntownDubai t={t} showFountain showBoulevard={false} />
        <group position={[0, -sink * 22, 0]} rotation={[0, 0, sink * 0.045]}>
          <BurjKhalifa p={[0, 0, 0]} scale={1} t={t} build={Math.max(0.12, build)} cranes={build < 0.9} />
        </group>
      </DubaiCanvas>
      <CounterPill
        o={fadeIn(f, c.floors163)}
        label="BUILDING WEIGHT"
        value={`${flCount} FLOORS`}
        sub={f >= c.tons450 ? "450,000 t · 500k US t" : "STACKING ON SAND"}
        color={sink > 0.2 ? "#ff5240" : "#ffd23f"}
      />
      <Stamp f={f} at={c.oneProblem} text="NO BEDROCK! ✗" top={1320} color="#ff4b3a" size={82} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. NIGHT ICE CONCRETE: 50°C scorching site -> ban day pours -> flooded midnight crushed-ice pour ─────────────────────────
export const SetNightIce: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const nightMix = ramp(f, c.banDay - 3, c.banDay + 14, easeInOut);
  const crackK = 1 - ramp(f, c.banDay, c.crushedIce + 6, easeOut);
  const iceFlow = ramp(f, c.crushedIce - 3, c.crushedIce + 12, easeOut);

  const cam: Cam = {
    pos: keys3(f, [
      [c.deg50, [0.45, 2.95, 12.8]],
      [c.banDay, [0.1, 3.05, 13.5]],
      [c.crushedIce, [-0.15, 3.1, 13.5]],
      [c.m828, [0.25, 3.05, 13.3]],
    ]),
    look: keys3(f, [
      [c.deg50, [0.35, 1.55, 0.0]],
      [c.banDay, [0.1, 1.65, -0.15]],
      [c.crushedIce, [0.0, 1.7, -0.15]],
      [c.m828, [0.2, 1.65, -0.15]],
    ]),
    fov: 46,
  };

  const at = atOf(cam);
  const pDeck = at([1.95, 0.85, 1.3]);
  const pIce = at([-1.65, 3.92, -0.6]);
  const pPipe = at([2.3, 3.6, -0.9]);

  return (
    <AbsoluteFill>
      <DubaiCanvas
        cam={cam}
        t={t}
        mood="heat"
        nightMix={nightMix}
        ao={0.7}
        fogRange={[28, 320]}
        shadow={22}
        keyPos={[6, 10, 9]}
      >
        {/* Background Downtown Dubai skyline anchoring the pour site */}
        <group position={[0, -0.15, -34]} scale={0.14}>
          <DowntownDubai t={t} night={nightMix} sunset={0} showFountain={false} showBoulevard={false} />
        </group>
        <ConcretePourSite
          p={[0, 0, 0]}
          scale={1.0}
          t={t}
          nightK={nightMix}
          iceFlow={iceFlow}
          crackK={crackK}
          pumpPulse={1}
        />
      </DubaiCanvas>

      <TempGauge f={f} at={c.deg50} iceAt={c.banDay} until={c.m828} />
      {f >= c.cooks && f < c.banDay + 4 && pDeck ? (
        <Tag x={pDeck.x} y={pDeck.y} text="FLASH SETS & CRACKS" color="#ff5238" side="left" size={30} o={fadeIn(f, c.cooks)} />
      ) : null}
      {f >= c.crushedIce && pIce ? (
        <Tag x={pIce.x} y={pIce.y} text="CRUSHED ICE SILO" color="#6eeeff" side="right" size={30} o={fadeIn(f, c.crushedIce)} />
      ) : null}
      {f >= c.pumpNight && pPipe ? (
        <Tag x={pPipe.x} y={pPipe.y} text="CHILLED NIGHT PUMP ✓" color="#5dfc9d" side="left" size={30} o={fadeIn(f, c.pumpNight)} />
      ) : null}
      <Stamp f={f} at={c.banDay} until={c.crushedIce + 4} text="DAY POURS BANNED ✗" top={1320} color="#ff4b3a" size={72} />
      <Stamp f={f} at={c.crushedIce + 8} text="NIGHT POURS ONLY ✓" top={1320} color="#4ceeff" size={72} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. WIND VORTICES: Resonant snapping box -> 2D plan blueprint -> 27-setback Y-tower orbit ─────────────────────────
export const SetWind: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;

  // Sub-beat B: Animated 2D aerodynamic top-down plan schematic
  if (f >= c.gaslight && f < c.everyFew) {
    return (
      <AbsoluteFill>
        <VortexPlanSchematic f={f} at={c.gaslight} setbacksAt={c.setbacks27} />
        <Stamp f={f} at={c.giantY} text="WIND GASLIT ✓" top={1035} color="#5dfc9d" size={70} rot={-3} />
      </AbsoluteFill>
    );
  }

  // Sub-beat C: 3D Helical orbit climbing the Y-shaped Burj Khalifa with glowing 27 setbacks & broken turquoise wakes
  if (f >= c.everyFew) {
    const k = ramp(f, c.everyFew, c.tipSways - 2, easeInOut);
    const orbit = -0.35 + k * 1.45;
    const cam: Cam = {
      pos: [Math.sin(orbit) * 440, 220 + k * 340, Math.cos(orbit) * 440],
      look: [0, 290 + k * 210, 0],
      fov: 44,
    };
    const setbacksOn = ramp(f, c.everyFew, c.confused + 8, easeOut);
    return (
      <AbsoluteFill>
        <DubaiCanvas cam={cam} t={t} mood="day" ao={0} fogRange={[650, 6800]} shadow={420}>
          <DowntownDubai t={t} />
          <CloudDeck y={190} count={12} seed={44} spread={320} t={t} scale={18} opacity={0.7} />
          <BurjKhalifa p={[0, 0, 0]} scale={1} t={t} highlightSetbacks={setbacksOn} />
          <WindStreamlines p={[0, 0, 0]} scale={1} t={t} yShape={1} />
        </DubaiCanvas>
        <CounterPill
          o={fadeIn(f, c.everyFew)}
          label="SPIRAL AERODYNAMICS"
          value="27 Y-SETBACKS"
          sub="VORTEX RHYTHM BROKEN ✓"
          color="#5dfc9d"
        />
      </AbsoluteFill>
    );
  }

  // Sub-beat A: Straight glass tower shaking violently like a guitar string in Kármán vortices until it snaps!
  const flex = ramp(f, c.whirlpools - 6, c.guitar + 12, easeOut);
  const snap = ramp(f, c.snaps - 4, c.gaslight - 2, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.m828, [160, 460, 760]],
      [c.guitar, [120, 480, 680]],
      [c.snaps, [150, 520, 740]],
    ]),
    look: [25, 430, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <DubaiCanvas cam={cam} t={t} mood="day" ao={0} fogRange={[650, 6800]} shadow={420}>
        <DowntownDubai t={t} />
        <CloudDeck y={210} count={10} seed={28} spread={320} t={t} scale={16} opacity={0.65} />
        <StraightGlassTower p={[0, 0, 0]} scale={1} t={t} flex={0.35 + 0.85 * flex} snap={snap} />
        <WindStreamlines p={[0, 0, 0]} scale={1} t={t} yShape={0} />
      </DubaiCanvas>
      <CounterPill o={fadeIn(f, c.m828)} label="RECORD PINNACLE" value="828 m · 2,717 ft" sub="RESONANT KÁRMÁN VORTICES" color="#ff5a45" />
      <HeightCompareBadge f={f} at={c.m828} until={c.guitar} />
      <Stamp f={f} at={c.snaps - 2} text="SNAPS! ✗" top={1280} color="#ff3b30" size={96} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. STORM SPIRE SWAY: Pinnacle flexing ±2 m + swinging chandelier comedy penthouse ─────────────────────────
export const SetSway: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.tipSways, [0.45, 2.25, 10.6]],
      [c.elevators, [-0.45, 2.35, 10.8]],
    ]),
    look: [0, 1.65, 0.0],
    fov: 45,
  };
  const at = atOf(cam);
  const pChand = at([0.45, -0.05, 0.4]);

  return (
    <AbsoluteFill>
      <DubaiCanvas cam={cam} t={t} mood="storm" ao={0.65} fogRange={[28, 320]} shadow={18} keyPos={[4, 8, 8]}>
        <CloudDeck y={-2.5} count={14} seed={91} spread={32} t={t} scale={1.5} tint="#28384e" opacity={0.8} />
        <StormPenthouseSpire p={[0, 0, 0]} scale={1.0} t={t} />
      </DubaiCanvas>
      <CounterPill o={fadeIn(f, c.tipSways)} label="STORM TIP SWAY" value="± 2 m · 6.5 ft" sub="ENGINEERED FLEX ZONE" color="#ffd23f" />
      {f >= c.tipSways + 8 && pChand ? (
        <Tag x={pChand.x} y={pChand.y} text="STILL CHILLING ✓" color="#5dfc9d" side="right" size={32} o={fadeIn(f, c.tipSways + 8)} />
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 6. DOUBLE-DECK EXPRESS ELEVATOR: Exhausted stair climber -> 8 furnished floors shooting up ─────────────────────────
export const SetElevator: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const lift = ramp(f, c.elevators, c.glass24k - 3, easeInOut);
  const cabY = -1.6 + lift * 2.65 * 5;
  const speed = Math.round(f < c.elevators ? 0 : lift < 0.88 ? 14 + lift * 26 : 36);
  const curFl = Math.round(112 + lift * 51);

  const cam: Cam = {
    pos: keys3(f, [
      [c.stairs, [0.95, 4.4, 10.8]],
      [c.elevators, [0.25, cabY + 2.5, 11.6]],
      [c.glass24k, [-0.25, cabY + 2.7, 11.4]],
    ]),
    look: keys3(f, [
      [c.stairs, [0.75, 4.1, -0.2]],
      [c.elevators, [0.0, cabY + 2.3, -0.2]],
      [c.glass24k, [0.0, cabY + 2.3, -0.2]],
    ]),
    fov: 46,
  };
  const at = atOf(cam);
  const pUpper = at([0.78, cabY + 4.92, 0.7]);
  const pStair = at([2.24, -3.8 + 3 * 2.65 + 2.4, 0.0]);

  return (
    <AbsoluteFill>
      <DubaiCanvas cam={cam} t={t} mood="day" ao={0.75} fogRange={[40, 420]} shadow={26} keyPos={[4, cabY + 12, 12]}>
        <group position={[0, -42, -32]} scale={0.14}>
          <DowntownDubai t={t} showFountain={false} showBoulevard={false} />
        </group>
        <DoubleDeckCoreCutaway p={[0, 0, 0]} scale={1} t={t} lift={lift} />
      </DubaiCanvas>
      <CounterPill
        o={fadeIn(f, c.elevators)}
        label="DOUBLE-DECK EXPRESS"
        value={`FLOOR ${curFl} / 163`}
        sub={`${speed} km/h · ${Math.round(speed * 0.6214)} mph`}
        color="#4ceeff"
      />
      {f >= c.elevators + 6 && pUpper ? (
        <Tag x={pUpper.x} y={pUpper.y} text="2 DECKS AT ONCE ✓" color="#ffd23f" side="left" size={30} o={fadeIn(f, c.elevators + 6)} />
      ) : null}
      {f >= c.stairs + 4 && f < c.speed36 + 12 && pStair ? (
        <Tag x={pStair.x} y={pStair.y} text="STAIRS: 1 HOUR ✗" color="#ff5a45" side="left" size={28} o={fadeIn(f, c.stairs + 4)} />
      ) : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 7. WINDOW WASHERS AT 600 m: 24,348 panels + BMU gondola + sandstorm reset ─────────────────────────
export const SetWashers: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const buildK = ramp(f, c.glass24k - 2, c.threeMonths - 2, easeOut);
  const washProgress = ramp(f, c.threeMonths - 4, c.topDirty - 2, easeInOut);
  const dustReturn = ramp(f, c.topDirty, c.congrats - 2, easeInOut);
  const panelsCount = Math.min(24348, Math.round(buildK * 24348)).toLocaleString("en-US");

  const cam: Cam = {
    pos: keys3(f, [
      [c.glass24k, [3.35, 0.75, 8.9]],
      [c.threeMonths, [3.2, 0.45, 8.8]],
      [c.bottomClean, [2.75, -0.45, 8.5]],
      [c.topDirty, [3.25, 0.65, 8.9]],
    ]),
    look: keys3(f, [
      [c.glass24k, [-0.6, 0.35, 0.0]],
      [c.bottomClean, [-0.6, -0.35, 0.1]],
      [c.topDirty, [-0.6, 0.5, 0.0]],
    ]),
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <DubaiCanvas cam={cam} t={t} mood="day" ao={0.45} fogRange={[45, 600]} shadow={18} keyPos={[8, 9, 10]}>
        {/* Miniature Downtown Dubai skyline visibly far below for true 600 m altitude vertigo */}
        <group position={[12, -56, -24]} scale={0.14}>
          <DowntownDubai t={t} showFountain={false} showBoulevard />
        </group>
        <CloudDeck y={-28} count={10} seed={67} spread={45} t={t} scale={1.2} opacity={0.65} />
        <FacadeWashScene p={[-1.05, 0.2, 0]} ry={0.34} scale={1.0} t={t} buildK={buildK} washProgress={washProgress} dustReturn={dustReturn} />
      </DubaiCanvas>
      <CalendarBadge f={f} at={c.glass24k} progress={washProgress * 0.75 + dustReturn * 0.25} until={c.congrats} />
      {f < c.threeMonths + 6 ? (
        <Stamp f={f} at={c.glass24k + 6} until={c.threeMonths + 6} text={`${panelsCount} PANELS`} top={1320} color="#4ceeff" size={76} rot={-3} />
      ) : null}
      <Stamp f={f} at={c.startOver} text="START RIGHT OVER!" top={1320} color="#ff9538" size={72} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 8. FINALE PAYOFF & FOLLOW LOOP: Golden-hour Dubai reveal + dancing Grandma + FollowPill ─────────────────────────
export const SetPayoff: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const k = ramp(f, c.congrats, c.burjKhalifa + 12, easeOut);
  const celebrate = ramp(f, c.burjKhalifa - 4, c.burjKhalifa + 22, easeOut);

  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [-18, 187.5, 353]],
      [c.spyGrandma, [12, 245, 580]],
      [c.burjKhalifa, [75, 385, 1110]],
      [c.end, [-30, 395, 1130]],
    ]),
    look: keys3(f, [
      [c.congrats, [-20, 185.6, 343]],
      [c.spyGrandma, [-10, 340, 20]],
      [c.burjKhalifa, [0, 445, 0]],
      [c.end, [0, 445, 0]],
    ]),
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <DubaiCanvas cam={cam} t={t} mood="sunset" ao={0} fogRange={[650, 7500]} shadow={460}>
        <DowntownDubai t={t} night={0.38} sunset={0.95} showFountain showBoulevard />
        {/* Soft warm horizon sunset mist softening desert cutoff */}
        <CloudDeck y={65} count={12} seed={94} spread={480} t={t} scale={24} tint="#f4ad82" opacity={0.42} />
        <CloudDeck y={390} count={14} seed={82} spread={420} t={t} scale={19} tint="#ffd6b8" opacity={0.58} />

        {/* Monumental illuminated 828 m Burj Khalifa overlooking Downtown Dubai */}
        <BurjKhalifa p={[0, 0, 0]} scale={1} t={t} lit={0.92} celebrate={celebrate} sway={0.18} />

        {/* Subtle crisp twinkling golden specular star glints flanking the upper spire */}
        {f >= c.burjKhalifa
          ? [
              [-95, 710, -25, "#ffe89e", 0],
              [105, 755, -20, "#a6f4ff", 0.55],
              [0, 828, 2, "#ffd23f", 1.1],
            ].map(([fx, fy, fz, fc, ph], fi) => {
              const pulse = Math.max(0, Math.sin(t * 3.8 + Number(ph) * 4));
              return (
                <Glow
                  key={`fw_${fi}`}
                  position={[Number(fx), Number(fy), Number(fz)]}
                  size={14 + pulse * 12}
                  color={String(fc)}
                  opacity={(0.22 + pulse * 0.35) * celebrate}
                />
              );
            })
          : null}

        {/* Foreground Sky Observation Terrace (Friend celebrating with glass balustrade & binoculars) */}
        <group position={[-20, 183, 344]}>
          <RB p={[0, 0, 0]} s={[7, 1.5, 6]} r={0.2} color="#3a4554" metal={0.5} />
          <mesh position={[0, 1.22, -2.9]}>
            <boxGeometry args={[6.9, 0.92, 0.04]} />
            <meshStandardMaterial color="#bce8ff" transparent opacity={0.28} metalness={0.25} roughness={0.1} />
          </mesh>
          <RB p={[0, 1.7, -2.9]} s={[7, 0.12, 0.14]} r={0.02} color="#d6b35f" metal={0.85} />
          {[-3.3, -1.65, 0, 1.65, 3.3].map((rx) => (
            <Cyl key={rx} p={[rx, 1.22, -2.9]} r={0.045} h={0.94} color="#d6b35f" metal={0.85} />
          ))}
          <Model
            file="man_a.glb"
            anims={LIB2}
            clip="Yes"
            t={t}
            p={[0, 0.75, -0.5]}
            ry={0.25}
            scale={1.35}
            outfit={FRIEND}
            tint={{ Hair: "#161616" }}
            attach={{ bone: "hand_r", node: <Binoculars /> }}
          />
        </group>

        {/* Surreal giant Cloud Penthouse floating proudly beside upper Burj tiers with Grandma dancing! */}
        <LuxuryPenthouse
          p={[-195, 455 + Math.sin(t) * 3, 25]}
          ry={0.32}
          scale={22 * (0.85 + 0.15 * k)}
          t={t}
          resident={
            <Model
              file="woman_c.glb"
              anims={LIB1}
              clip="Dance_Loop"
              t={t}
              outfit={GRANDMA}
              tint={{ Hair: "#d9d9d9" }}
              attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
            />
          }
        />
      </DubaiCanvas>

      {f >= c.burjKhalifa && f < c.end - 16 ? (
        <Big y={168} text={"THE BURJ KHALIFA\n828 m · 2,717 ft"} o={fadeIn(f, c.burjKhalifa)} color="#ffd23f" size={70} />
      ) : null}
      <FollowPill f={f} at={c.follow} until={c.end - 16} top={1400} />
    </AbsoluteFill>
  );
};
