import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { OceanLiner } from "../../lib/three/OceanLiner";
import { FollowPill } from "../../lib/Follow";
import { easeInOut, easeOut, keys, keys3, ramp } from "../../lib/timing";
import { c } from "./cues";
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
} from "./props";
import { AtlanticNight, HarborPier, ShipCanvas, StudioDark, UnderwaterDeep } from "./world";
import { Big, DepthCard, FunnelCard, HullSpecCard, IceCubeCard, LifeboatCard, Pill, Stamp, TurbineCard } from "./inserts";

export type SetProps = { f: number };
const LIB1 = "ual/ual1_ue.glb";
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 9) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));

const FRIEND: Outfit = { top: "#2874c9", pants: "#262b36", shoes: "#1c1f26", loose: "male" };
const GRANDMA: Outfit = { top: "#6f4b86", pants: "#262834", shoes: "#2c2e38", loose: "female" };
const WORN: V3 = [0, -0.2, 0.03];

// ───────────────────────── 1. HOOK: Grandma escapes on speedboat wearing FursuitHead -> build ship on harbor pier ─────────────────────────
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const boatProg = ramp(f, 0, c.hull269, easeInOut);
  const boatX = 0.35 + boatProg * 4.5;
  const boatZ = 0.95 - boatProg * 3.8;
  const shipIn = ramp(f, c.unsinkable - 6, c.hull269 - 2, easeOut);
  const linerX = -5.5 + shipIn * 6.5;

  const cam: Cam = {
    pos: keys3(f, [
      [0, [-2.75, 1.88, 3.65]],
      [c.unsinkable, [-2.2, 1.92, 4.15]],
      [c.hull269, [-1.55, 2.02, 4.45]],
    ]),
    look: keys3(f, [
      [0, [-0.15, 0.72, 0.1]],
      [c.unsinkable, [0.45, 0.7, -1.35]],
      [c.hull269, [0.85, 0.78, -2.55]],
    ]),
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <ShipCanvas cam={cam} look="harbor" ao={0}>
        <HarborPier t={t}>
          {/* Friend standing firmly on wooden harbor pier (top y = 0.48) */}
          <Model file="man_b.glb" anims={LIB1} clip={f >= c.unsinkable ? "Interact" : "Idle_Loop"} t={t} p={[-1.35, 0.48, 0.85]} ry={1.38} outfit={FRIEND} tint={{ Hair: "#161616" }} />

          {/* Grandma speeding toward New York wearing the giant pocket puh (Sitting_Idle_Loop in LIB1 avoids T-pose) */}
          <Speedboat
            p={[boatX, 0.02, boatZ]}
            ry={0.62}
            scale={0.88}
            t={t}
            wake={1}
            driver={
              <Model
                file="woman_c.glb"
                anims={LIB1}
                clip="Sitting_Idle_Loop"
                t={t}
                outfit={GRANDMA}
                tint={{ Hair: "#d9d9d9" }}
                attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
              />
            }
          />

          {/* Towering steel OceanLiner sliding in as you build an unsinkable ship */}
          {f >= c.unsinkable - 8 ? <OceanLiner frame={f} position={[linerX, 0.08, -3.9]} rotation={[0, 0.14, 0]} scale={0.54} lights={0} /> : null}
        </HarborPier>
      </ShipCanvas>
      <Pill o={fadeIn(f, c.chase)} value="GRANDMA ESCAPED" label="CHASE HER DOWN" top={195} color="#ffd23f" />
    </AbsoluteFill>
  );
};

// ───────────────────────── 2. HULL: 269 m blueprint -> steel hull & 3M rivets ─────────────────────────
export const SetHull: React.FC<SetProps> = ({ f }) => {
  const bp = 1 - ramp(f, c.hull269 + 8, c.rivets - 4, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.hull269, [2.25, 1.65, 6.2]],
      [c.sinkBoat, [0.75, 1.5, 5.75]],
    ]),
    look: [0.0, 0.62, 0],
    fov: 45,
  };
  return (
    <AbsoluteFill>
      <ShipCanvas cam={cam} look="shipyard" ao={0.65}>
        <StudioDark spotColor="#7fe8ff" spotI={28}>
          <OceanLiner frame={f} position={[0, 0.56, 0]} rotation={[0, -0.45, 0]} scale={0.56} blueprint={bp} lights={1 - bp} />
        </StudioDark>
      </ShipCanvas>
      <HullSpecCard f={f} at={c.hull269} until={c.sinkBoat} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. BULKHEADS: 16 watertight bays -> E-deck open top ice cube tray spillover ─────────────────────────
export const SetBulkheads: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const flood = keys(f, [
    [c.sinkBoat, 0.06],
    [c.fourFlood, 0.36],
    [c.plotTwist, 0.4],
    [c.flood5, 0.68],
    [c.boilers, 0.94],
  ]);

  const cam: Cam = {
    pos: keys3(f, [
      [c.sinkBoat, [0.3, 1.85, 8.45]],
      [c.plotTwist, [0.45, 2.25, 8.2]],
      [c.dontSeal, [0.55, 2.75, 7.8]],
      [c.boilers, [0.25, 2.45, 7.95]],
    ]),
    look: keys3(f, [
      [c.sinkBoat, [0.05, 1.1, 0]],
      [c.boilers, [0.0, 1.0, 0]],
    ]),
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <ShipCanvas cam={cam} look="studio" ao={0.7}>
        <StudioDark spotColor="#72e4ff" spotI={28}>
          <BulkheadCutaway p={[0, 1.08, 0]} scale={0.82} t={t} flood={flood} />
        </StudioDark>
      </ShipCanvas>
      <IceCubeCard f={f} at={c.slice} twistAt={c.plotTwist} until={c.boilers} />
      <Stamp f={f} at={c.iceCube} text="UNSEALED TOPS" top={1320} color="#ff4c3d" size={82} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. FOURTH FUNNEL: 29 boilers -> 3 smokestacks + #4 aura-farming air vent ─────────────────────────
export const SetFunnel: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cutaway = ramp(f, c.auraFarming, c.notHooked + 6, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.boilers, [0.95, 1.68, 5.95]],
      [c.fourthQ, [-0.15, 1.65, 5.45]],
      [c.auraFarming, [-0.95, 1.6, 5.05]],
      [c.waitBoats, [-1.05, 1.56, 4.9]],
    ]),
    look: keys3(f, [
      [c.boilers, [0.45, 0.92, 0]],
      [c.fourthQ, [-0.35, 0.96, 0]],
      [c.waitBoats, [-1.02, 1.0, 0]],
    ]),
    fov: 44,
  };

  return (
    <AbsoluteFill>
      <ShipCanvas cam={cam} look="studio" ao={0.7}>
        <StudioDark spotI={26}>
          <FunnelCutaway p={[0, 0.48, 0]} scale={0.92} t={t} cutaway={cutaway} />
        </StudioDark>
      </ShipCanvas>
      <FunnelCard f={f} at={c.boilers} fakeAt={c.auraFarming} until={c.waitBoats} />
      <Stamp f={f} at={c.auraFarming} text="AURA FARMING" top={1320} color="#ffd23f" size={82} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. LIFEBOATS: 1894 law (16) vs Titanic (20) vs cut ghosts (48) ─────────────────────────
export const SetLifeboats: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const ghosts = 1 - ramp(f, c.ruinView - 4, c.ruinView + 14, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.waitBoats, [0.3, 2.65, 5.75]],
      [c.knots22, [-0.3, 2.45, 5.3]],
    ]),
    look: [0, 0.92, 0.15],
    fov: 45,
  };

  return (
    <AbsoluteFill>
      <ShipCanvas cam={cam} look="studio" ao={0.5}>
        <StudioDark spotColor="#ffe8c2" spotI={28}>
          <BoatDeckCutaway p={[0, 1.25, 0]} scale={0.95} ghosts={ghosts} />
          {/* Friend standing cleanly on boat deck timber (y = 1.25 + 0.05*0.95 ≈ 1.30) */}
          <Model file="man_b.glb" anims={LIB1} clip="Idle_Loop" t={t} p={[0.18, 1.3, 0.2]} ry={0.18} scale={0.56} outfit={FRIEND} tint={{ Hair: "#161616" }} />
        </StudioDark>
      </ShipCanvas>
      <LifeboatCard f={f} at={c.waitBoats} lawAt={c.law1894} until={c.knots22} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 6. BINOCULARS: 22 knots into ice field, locked locker & officer's key ─────────────────────────
export const SetCrowsNest: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const locked = ramp(f, c.binoculars, c.locked + 6, easeOut);
  const keyAway = ramp(f, c.pocketedKey - 4, c.iceberg400 - 4, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.knots22, [0.22, 1.55, 3.85]],
      [c.locked, [0.14, 1.34, 3.45]],
      [c.iceberg400, [0.12, 1.28, 3.35]],
    ]),
    look: keys3(f, [
      [c.knots22, [0.02, 0.9, 0.1]],
      [c.iceberg400, [0.02, 0.8, 0.12]],
    ]),
    fov: 44,
  };

  return (
    <AbsoluteFill>
      <ShipCanvas cam={cam} look="night" ao={0}>
        <AtlanticNight t={t}>
          <CrowsNest p={[-0.25, 0.42, 0]} ry={0.16} t={t} locked={locked} keyAway={keyAway} />
        </AtlanticNight>
      </ShipCanvas>
      <Pill o={fadeIn(f, c.knots22)} value="22 KNOTS" label="41 km/h · 25 mph" top={195} color="#7cf5ff" />
      <Stamp f={f} at={c.locked} text="LOCKER LOCKED" top={1320} color="#ff4238" size={82} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 7. TURBINE PARADOX: 400m iceberg -> GlitchCut -> underwater dead center turbine ─────────────────────────
export const SetTurbine: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const underwater = f >= c.hugeMistake;

  if (!underwater) {
    const zIce = keys(f, [
      [c.iceberg400, -3.2],
      [c.reverse, -1.6],
      [c.hugeMistake - 1, -0.75],
    ]);
    const cam: Cam = {
      pos: [0.25, 1.45, 3.85],
      look: [0.05, 0.62, -1.2],
      fov: 46,
    };
    return (
      <AbsoluteFill>
        <ShipCanvas cam={cam} look="night" ao={0}>
          <AtlanticNight t={t}>
            <Iceberg p={[0.1, 0.15, zIce]} ry={-0.32} scale={1.18} t={t} />
          </AtlanticNight>
        </ShipCanvas>
        <Big x={540} y={240} text="400 m · 1,300 ft" o={pop(f, c.iceberg400)} color="#7ce3ff" size={84} />
      </AbsoluteFill>
    );
  }

  const stalled = ramp(f, c.stops - 6, c.stops + 4, easeOut);
  const rudderAngle = keys(f, [
    [c.hugeMistake, 0.08],
    [c.rudder, 0.48],
    [c.rips6, 0.52],
  ]);
  const cam: Cam = {
    pos: keys3(f, [
      [c.hugeMistake, [2.75, 0.95, 3.65]],
      [c.rudder, [2.45, 0.85, 3.35]],
    ]),
    look: [0.0, 0.65, -0.15],
    fov: 44,
  };

  return (
    <AbsoluteFill>
      <ShipCanvas cam={cam} look="abyss" ao={0.65}>
        <UnderwaterDeep t={t} spotI={28}>
          <SternTurbine p={[0, 0.65, 0]} ry={0.05} scale={1.0} t={t} stalled={stalled} rudderAngle={rudderAngle} />
        </UnderwaterDeep>
      </ShipCanvas>
      <TurbineCard f={f} at={c.centerProp} until={c.rips6} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 8. COLLISION & HEATED POOL: 3,800m abyss wreck -> intact shimmering F-deck pool ─────────────────────────
export const SetPool: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const inPool = f >= c.pool;

  if (!inPool) {
    const linerY = keys(f, [
      [c.rips6, 1.0],
      [c.sinks3800, 0.05],
      [c.pool - 1, -0.78],
    ]);
    const split = ramp(f, c.sinks3800 - 16, c.sinks3800 + 18, easeInOut);
    const wreck = ramp(f, c.sinks3800 - 4, c.pool - 4, easeInOut);
    const cam: Cam = {
      pos: keys3(f, [
        [c.rips6, [1.85, 1.55, 6.75]],
        [c.pool - 1, [1.3, 0.68, 6.15]],
      ]),
      look: [0, linerY * 0.5 + 0.15, -0.25],
      fov: 46,
    };
    return (
      <AbsoluteFill>
        <ShipCanvas cam={cam} look="abyss" ao={0.65}>
          <UnderwaterDeep t={t} spotI={28}>
            <OceanLiner frame={f} position={[0, linerY, -0.3]} rotation={[0, -0.35, 0]} scale={0.62} split={split} wreck={wreck} lights={1 - wreck} stress={1 - wreck} />
          </UnderwaterDeep>
        </ShipCanvas>
        <DepthCard f={f} at={c.sinks3800} until={c.pool} />
      </AbsoluteFill>
    );
  }

  const cam: Cam = {
    pos: keys3(f, [
      [c.pool, [0.1, 2.08, 4.65]],
      [c.congrats, [-0.15, 1.92, 4.25]],
    ]),
    look: [0, 0.32, -0.15],
    fov: 44,
  };
  return (
    <AbsoluteFill>
      <ShipCanvas cam={cam} look="abyss" ao={0.7}>
        <UnderwaterDeep t={t} spotI={28}>
          <HeatedPool p={[0, 0.18, 0]} scale={0.96} t={t} wreck={1} />
        </UnderwaterDeep>
      </ShipCanvas>
      <Stamp f={f} at={c.stillFull} text="STILL FULL ✓" top={240} color="#3deeff" size={88} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 9. PAYOFF & FOLLOW LOOP: Room for 2 floating door + Grandma cruising with FollowPill cleanly below ─────────────────────────
export const SetPayoff: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const isFollow = f >= c.follow;
  const grandProgress = Math.max(0, (f - c.follow) / 30);
  const boatX = 0.78 - grandProgress * 0.28;
  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [0, 2.32, 3.45]],
      [c.theTitanic, [0, 2.35, 3.5],
      ],
      [c.end, [0, 2.38, 3.55]],
    ]),
    look: [0, 0.18, -0.25],
    fov: 44,
  };

  return (
    <AbsoluteFill>
      <ShipCanvas cam={cam} look="night" ao={0}>
        <AtlanticNight t={t}>
          <FloatingDoor
            p={[0, 0.08, 0.12]}
            ry={0.05}
            scale={0.78}
            t={t}
            hero={<FursuitHead p={[0, 0.26, 0]} s={0.44} ry={0.12} t={t} />}
          />
          {isFollow ? (
            <Speedboat
              p={[boatX, 0.02, -1.55]}
              ry={2.45}
              scale={0.56}
              t={t}
              wake={0.8}
              driver={
                <Model
                  file="woman_c.glb"
                  anims={LIB1}
                  clip="Sitting_Idle_Loop"
                  t={t}
                  outfit={GRANDMA}
                  tint={{ Hair: "#d9d9d9" }}
                  attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
                />
              }
            />
          ) : null}
        </AtlanticNight>
      </ShipCanvas>
      {f >= c.theTitanic && f < c.end - 16 ? <Big x={540} y={240} text="THE TITANIC" o={pop(f, c.theTitanic)} color="#ffd23f" size={108} /> : null}
      <FollowPill f={f} at={c.follow} until={c.end - 16} top={1400} />
    </AbsoluteFill>
  );
};
