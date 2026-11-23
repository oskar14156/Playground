import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { FollowPill } from "../../lib/Follow";
import { easeOut, keys3, ramp } from "../../lib/timing";
import { c } from "./cues";
import {
  ArmyPerimeterBase,
  BunkerWallCutaway,
  FortKnoxBuilding,
  GoldBullionRoom,
  SelfSustainingCore,
  SplitKeypadRing,
  VaultDoor20Ton,
} from "./props";
import { BunkerInterior, FortKnoxLawn, StudioDark, VaultCanvas } from "./world";
import { Big, DefenseCard, DoorCard, GoldCard, Pill, Stamp, WallCard } from "./inserts";

export type SetProps = { f: number };
const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 9) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));

const FRIEND: Outfit = { top: "#2874c9", pants: "#262b36", shoes: "#1c1f26", loose: "male" };
const GRANDMA: Outfit = { top: "#6f4b86", pants: "#262834", shoes: "#2c2e38", loose: "female" };
const WORN: V3 = [0, -0.2, 0.03];

// ───────────────────────── 1. HOOK: Stole FursuitHead back from Grandma -> sprint into Fort Knox vault ─────────────────────────
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const run = ramp(f, 0, c.yards4200, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [0, [2.1, 2.05, 5.95]],
      [c.safest, [0.95, 2.25, 6.85]],
      [c.yards4200, [0.25, 2.4, 7.25]],
    ]),
    look: [0, 1.15, -0.4],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <VaultCanvas cam={cam} look="nightlawn" ao={0.75}>
        <FortKnoxLawn t={t}>
          <FortKnoxBuilding p={[0, 0, -1.85]} scale={0.96} t={t} />
          <Model
            file="man_a.glb"
            anims={LIB1}
            clip="Walk_Loop"
            t={t}
            p={[0.15, 0.03, 3.2 - run * 2.1]}
            ry={3.0}
            outfit={FRIEND}
            tint={{ Hair: "#161616" }}
            attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
          />
          <Model file="woman_c.glb" anims={LIB2} clip="Idle_No_Loop" t={t} p={[-1.0, 0.03, 2.55]} ry={0.35} outfit={GRANDMA} tint={{ Hair: "#d9d9d9" }} />
        </FortKnoxLawn>
      </VaultCanvas>
      <Pill o={fadeIn(f, c.safest)} value="SAFEST VAULT" label="HIDE IT FROM GRANDMA" top={195} color="#ffd23f" />
    </AbsoluteFill>
  );
};

// ───────────────────────── 2. WALLS: 4,200 cu yd concrete + granite + 750 t rebar cage cutaway ─────────────────────────
export const SetWalls: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.yards4200, [-1.55, 2.0, 5.25]],
      [c.steel750, [-0.15, 2.05, 5.35]],
      [c.blastDoor, [1.45, 2.1, 5.35]],
    ]),
    look: [0.15, 1.35, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <VaultCanvas cam={cam} look="studio" ao={0.8}>
        <StudioDark spotI={26}>
          <BunkerWallCutaway p={[0, 0, 0]} scale={0.96} t={t} />
        </StudioDark>
      </VaultCanvas>
      <WallCard f={f} at={c.yards4200} until={c.blastDoor} />
      <Stamp f={f} at={c.meterThick} text="BOMB PROOF ✓" top={1320} color="#ffd23f" size={82} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. DOOR & CODES: 20-ton Mosler door repelling blowtorch -> 10 split keypads ─────────────────────────
export const SetDoorCodes: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const split = f >= c.splitCode;
  const lit = Math.min(10, 1 + Math.floor(ramp(f, c.splitCode, c.cityPower - 10, easeOut) * 10));

  const cam: Cam = split
    ? {
        pos: keys3(f, [
          [c.splitCode, [0, 2.45, 4.55]],
          [c.cityPower, [0.45, 2.3, 4.4]],
        ]),
        look: [0, 0.85, -0.2],
        fov: 46,
      }
    : {
        pos: keys3(f, [
          [c.blastDoor, [0.45, 1.85, 4.7]],
          [c.splitCode, [-0.25, 1.8, 4.6]],
        ]),
        look: [0, 1.45, 0],
        fov: 46,
      };

  return (
    <AbsoluteFill>
      <VaultCanvas cam={cam} look={split ? "studio" : "bunker"} ao={0.8}>
        {!split ? (
          <BunkerInterior>
            <VaultDoor20Ton p={[0, 0, 0]} scale={0.96} t={t} open={0.18} torch={1} />
          </BunkerInterior>
        ) : (
          <StudioDark spotColor="#42f58a" spotI={28}>
            <SplitKeypadRing p={[0, 0, 0]} scale={0.98} t={t} lit={lit} lost10={0} />
          </StudioDark>
        )}
      </VaultCanvas>
      <DoorCard f={f} at={c.blastDoor} splitAt={c.splitCode} until={c.cityPower} />
      <Stamp f={f} at={c.people10} text="ZERO MASTER KEY" top={1320} color="#42f58a" size={78} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. UTILITIES & ARMY: Own power plant & water -> Army base & radar perimeter ─────────────────────────
export const SetBunkerDefense: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const army = f >= c.armyBase;
  const cam: Cam = army
    ? {
        pos: keys3(f, [
          [c.armyBase, [0.55, 2.35, 6.4]],
          [c.gold4500, [-0.55, 2.45, 6.5]],
        ]),
        look: [0, 0.95, 0],
        fov: 46,
      }
    : {
        pos: keys3(f, [
          [c.cityPower, [0.45, 1.85, 4.85]],
          [c.armyBase, [-0.35, 1.9, 4.8]],
        ]),
        look: [0, 0.65, 0],
        fov: 46,
      };

  return (
    <AbsoluteFill>
      <VaultCanvas cam={cam} look={army ? "army" : "bunker"} ao={0.8}>
        {!army ? (
          <BunkerInterior>
            <SelfSustainingCore p={[0, 0, 0]} scale={0.98} t={t} />
          </BunkerInterior>
        ) : (
          <FortKnoxLawn t={t}>
            <FortKnoxBuilding p={[0, 0, -1.6]} scale={0.84} t={t} />
            <ArmyPerimeterBase p={[0, 0.02, 1.25]} scale={0.94} t={t} />
          </FortKnoxLawn>
        )}
      </VaultCanvas>
      <DefenseCard f={f} at={c.cityPower} armyAt={c.armyBase} until={c.gold4500} />
      <Stamp f={f} at={c.ownPower} text="OFF-GRID BUNKER" top={1320} color="#4ceeff" size={78} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. GOLD & TWIST: 4,500 t gold bullion chamber -> Forgot code #10 & locked out! ─────────────────────────
export const SetGoldTwist: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const locked = f >= c.forgotWho;
  const cam: Cam = locked
    ? {
        pos: keys3(f, [
          [c.forgotWho, [0.35, 2.15, 6.2]],
          [c.congrats, [-0.25, 2.25, 6.3]],
        ]),
        look: [0, 1.1, 0.25],
        fov: 46,
      }
    : {
        pos: keys3(f, [
          [c.gold4500, [-0.35, 1.85, 4.35]],
          [c.forgotWho, [0.35, 1.9, 4.45]],
        ]),
        look: [0, 0.9, 0],
        fov: 46,
      };

  return (
    <AbsoluteFill>
      <VaultCanvas cam={cam} look={locked ? "bunker" : "gold"} ao={0.8}>
        {!locked ? (
          <BunkerInterior>
            <GoldBullionRoom p={[0, 0, 0]} scale={0.96} t={t} hero={<FursuitHead p={[0, 0.22, 0]} s={0.48} t={t} />} />
          </BunkerInterior>
        ) : (
          <BunkerInterior>
            <VaultDoor20Ton p={[0, 0, -0.55]} scale={0.92} t={t} open={0} torch={0} />
            <SplitKeypadRing p={[0.35, 0, 1.45]} scale={0.68} t={t} lit={9} lost10={1} />
            <Model file="man_a.glb" anims={LIB2} clip="Idle_No_Loop" t={t} p={[-0.78, 0.03, 1.45]} ry={0.45} outfit={FRIEND} tint={{ Hair: "#161616" }} />
          </BunkerInterior>
        )}
      </VaultCanvas>
      <GoldCard f={f} at={c.gold4500} lostAt={c.forgotWho} until={c.congrats} />
      <Stamp f={f} at={c.forgotWho} text="LOCKED OUT ✗" top={1320} color="#ff4238" size={84} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 6. PAYOFF: Locked outside Fort Knox + FollowPill cleanly below ─────────────────────────
export const SetPayoff: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [-0.55, 2.35, 7.3]],
      [c.fortKnox, [0.15, 2.45, 7.5]],
      [c.end, [0.55, 2.5, 7.65]],
    ]),
    look: [0, 1.35, -0.6],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <VaultCanvas cam={cam} look="nightlawn" ao={0.75}>
        <FortKnoxLawn t={t}>
          <FortKnoxBuilding p={[0, 0, -1.25]} scale={0.96} t={t} />
          <FursuitHead p={[-0.8, 2.62, -0.9]} s={0.44} t={t} />
          <Model file="man_a.glb" anims={LIB2} clip="Idle_No_Loop" t={t} p={[-1.35, 0.28, 0.95]} ry={0.3} outfit={FRIEND} tint={{ Hair: "#161616" }} />
        </FortKnoxLawn>
      </VaultCanvas>
      {f >= c.fortKnox && f < c.end - 16 ? <Big x={540} y={240} text="FORT KNOX" o={pop(f, c.fortKnox)} color="#ffd23f" size={108} /> : null}
      <FollowPill f={f} at={c.follow} until={c.end - 16} top={1400} />
    </AbsoluteFill>
  );
};
