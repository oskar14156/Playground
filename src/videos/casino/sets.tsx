import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { RB } from "../../lib/three/diorama";
import { FollowPill } from "../../lib/Follow";
import { easeInOut, easeOut, keys3, ramp } from "../../lib/timing";
import { Shades } from "../white-house/props";
import { PuhBill } from "../dollar-bill/bill";
import { c } from "./cues";
import {
  CardTable,
  CeilingDome,
  ChipRain,
  ChipStack,
  CocktailTray,
  MonitorWall,
  PlayingCard,
  RfidChipCutaway,
  RouletteWheel,
  SlotMachine,
  VegasSkyline,
  VentDuct,
  VirtualReelCutaway,
} from "./props";
import { BellagioRoom, CasinoCanvas, MazeRoom, ParlorRoom, StudioDark, VipPitRoom } from "./world";
import {
  Big,
  CardCountVerdict,
  LayoutCompare,
  LdwReceipt,
  Pill,
  RevenueCounter,
  RouletteEdgeBar,
  Stamp,
  VentCompare,
  VirtualReelCard,
} from "./inserts";

export type SetProps = { f: number };
const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 9) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));

const follow = (pts: [number, number][], speed: number, t: number) => {
  let d = Math.max(0, t) * speed;
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    const L = Math.hypot(bx - ax, bz - az);
    if (L > 1e-4 && d <= L) return { x: ax + ((bx - ax) * d) / L, z: az + ((bz - az) * d) / L, ry: Math.atan2(bx - ax, bz - az), moving: true };
    d -= L;
  }
  const [lx, lz] = pts[pts.length - 1];
  const [px, pz] = pts[pts.length - 2];
  return { x: lx, z: lz, ry: Math.atan2(lx - px, lz - pz), moving: false };
};

// Always use Outfit.loose for clothed humans
const YOU: Outfit = { top: "#e8573a", pants: "#2b323d", shoes: "#f0f0f0", loose: "male" };
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#383b42", shoes: "#24201c", loose: "male" };
const AGENT: Outfit = { top: "#151820", pants: "#151820", shoes: "#0c0d10", sleeves: 0.9, loose: "male" };
const GRANDMA: Outfit = { top: "#b07ab8", pants: "#6a5a7a", shoes: "#e8e0d8", sleeves: 0.65, loose: "female" };

const MASK_S = 0.5;
const WORN: V3 = [0, -0.2, 0.03];

const Agent: React.FC<{ file: string; clip: string; t: number; p: V3; ry: number; lib?: string }> = ({
  file,
  clip,
  t,
  p,
  ry,
  lib = LIB2,
}) => (
  <Model
    file={file}
    anims={lib}
    clip={clip}
    t={t}
    p={p}
    ry={ry}
    outfit={AGENT}
    tint={{ Hair: "#241912" }}
    attach={{ bone: "Head", node: <Shades /> }}
  />
);

// ───────────────────────── 1. HOOK: owes grandma $100 → bets at your table → wins → EXIT locked ─────────────────────────
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const winGrow = ramp(f, c.wins, c.door, easeOut);
  const walk = follow(
    [
      [0.44, -1.25],
      [1.75, -1.85],
    ],
    1.0,
    Math.max(0, (f - c.door) / 30),
  );
  const isWalking = f >= c.door && walk.moving;
  const shutterDrop = ramp(f, c.neverLeaves - 4, c.neverLeaves + 8, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [0, [0.0, 1.62, 2.35]],
      [c.betsIt, [0.1, 1.56, 2.08]],
      [c.wins, [0.22, 1.56, 2.0]],
      [c.door, [0.85, 1.64, 2.15]],
      [c.neverLeaves, [1.22, 1.6, 1.85]],
    ]),
    look: keys3(f, [
      [0, [0.0, 1.0, -0.45]],
      [c.betsIt, [0.05, 0.96, -0.35]],
      [c.wins, [0.12, 0.96, -0.3]],
      [c.door, [1.05, 1.12, -1.65]],
      [c.neverLeaves, [1.55, 1.15, -2.0]],
    ]),
    fov: 46,
  };
  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look="parlor">
        <ParlorRoom>
          <CardTable p={[0, 0, -0.35]} mode="blackjack">
            <FursuitHead p={[-0.48, 0.78, -0.05]} s={0.34} ry={0.25} t={t} blink={f > 18 && f < 22 ? 1 : 0} />
            <PuhBill p={[0.04, 0.786, 0.08]} rot={[-Math.PI / 2, 0, -0.08]} scale={0.28} ribbon={false} />
            <ChipStack p={[0.42, 0.78, 0.05]} count={6 + Math.round(winGrow * 14)} color="#1b1e28" label="$100" scale={1.15} />
            <PlayingCard p={[-0.14, 0.786, -0.18]} rot={[-Math.PI / 2, 0, 0.1]} rank="A" suit="♠" />
            <PlayingCard p={[0.02, 0.788, -0.18]} rot={[-Math.PI / 2, 0, -0.08]} rank="K" suit="♥" />
          </CardTable>
          {/* Steel security shutter sealing the EXIT door */}
          {shutterDrop > 0.02 ? <RB p={[2.2, 2.1 - shutterDrop * 1.05, -2.38]} s={[1.1, shutterDrop * 2.1, 0.08]} r={0.01} color="#28303d" metal={0.75} rough={0.35} /> : null}
          {/* You behind left side of table */}
          <Model
            file="man_a.glb"
            anims={LIB1}
            clip={f >= c.betsIt && f < c.wins ? "Interact" : "Idle_Loop"}
            t={t}
            p={[-0.44, 0, -1.25]}
            ry={0.18}
            outfit={YOU}
            tint={{ Hair: "#3a281c" }}
          />
          {/* Friend behind right side of table -> walks toward EXIT door */}
          <Model
            file="man_b.glb"
            anims={LIB1}
            clip={isWalking ? "Walk_Loop" : "Idle_Loop"}
            t={isWalking ? ((f - c.door) / 30) * 1.0 : t}
            p={[walk.x, 0, walk.z]}
            ry={isWalking ? walk.ry : f >= c.door ? 0.55 : -0.18}
            outfit={FRIEND}
            tint={{ Hair: "#161616" }}
          />
        </ParlorRoom>
      </CasinoCanvas>
      {f < c.wins ? <Big x={540} y={195} text="OWES GRANDMA $100" o={pop(f, 0)} color="#ffd23f" size={76} /> : null}
      {f >= c.neverLeaves ? <Stamp f={f} at={c.neverLeaves} text="LOCKED IN" top={1290} color="#ff3b30" rot={-7} size={108} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 2. CLOCKS & WINDOWS: ripped off wall ─────────────────────────
export const SetClocks: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const clockOut = ramp(f, c.ripOut + 10, c.ripOut + 24, easeInOut);
  const windowOut = ramp(f, c.ripOut + 20, c.ripOut + 34, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.checksTime, [-0.25, 1.78, 2.85]],
      [c.mazes, [-0.45, 1.82, 2.55]],
    ]),
    look: [-0.55, 1.55, -2.5],
    fov: 48,
  };
  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look="parlor">
        <ParlorRoom clockOut={clockOut} windowOut={windowOut}>
          <Model file="man_b.glb" anims={LIB1} clip="Idle_Loop" t={t} p={[-0.55, 0, -1.15]} ry={Math.PI} outfit={FRIEND} tint={{ Hair: "#161616" }} />
        </ParlorRoom>
      </CasinoCanvas>
      {f >= c.ripOut ? <Big x={540} y={240} text={"NO CLOCKS\nNO WINDOWS"} o={pop(f, c.ripOut)} color="#ff6b5e" size={96} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. LAYOUT: Maze vs 1998 Bellagio $1.6B Playground ─────────────────────────
export const SetLayout: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const inBellagio = f >= c.bellagio;
  const mazeWalk = follow(
    [
      [0.0, 0.55],
      [0.18, -0.2],
      [-0.14, -0.82],
    ],
    1.05,
    Math.max(0, (f - c.mazes) / 30),
  );
  const belWalk = follow(
    [
      [0.0, 1.55],
      [0.0, -1.0],
    ],
    1.1,
    Math.max(0, (f - c.bellagio) / 30),
  );
  const cam: Cam = inBellagio
    ? {
        pos: keys3(f, [
          [c.bellagio, [0.15, 2.05, 5.1]],
          [c.relaxed, [-0.15, 1.95, 4.35]],
        ]),
        look: [0, 1.48, -0.8],
        fov: 50,
      }
    : {
        pos: keys3(f, [
          [c.mazes, [0.22, 1.62, 2.75]],
          [c.bellagio - 1, [-0.15, 1.55, 2.2]],
        ]),
        look: [0, 1.05, -0.45],
        fov: 48,
      };
  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look={inBellagio ? "bellagio" : "maze"}>
        {inBellagio ? (
          <BellagioRoom t={t}>
            <Model
              file="man_b.glb"
              anims={LIB1}
              clip={belWalk.moving ? "Walk_Loop" : "Idle_Loop"}
              t={belWalk.moving ? ((f - c.bellagio) / 30) * 1.1 : t}
              p={[belWalk.x, 0, belWalk.z]}
              ry={belWalk.ry}
              outfit={FRIEND}
              tint={{ Hair: "#161616" }}
            />
          </BellagioRoom>
        ) : (
          <MazeRoom>
            <Model
              file="man_b.glb"
              anims={LIB1}
              clip={mazeWalk.moving ? "Walk_Loop" : "Idle_Loop"}
              t={mazeWalk.moving ? ((f - c.mazes) / 30) * 1.05 : t}
              p={[mazeWalk.x, 0, mazeWalk.z]}
              ry={mazeWalk.ry}
              outfit={FRIEND}
              tint={{ Hair: "#161616" }}
            />
          </MazeRoom>
        )}
      </CasinoCanvas>
      <LayoutCompare f={f} at={c.mazes} bellagioAt={c.bellagio} until={c.cashHurts} />
      {f >= c.plotTwist && f < c.bellagio ? <Stamp f={f} at={c.plotTwist} text="PLOT TWIST!" top={1290} color="#ffd23f" rot={-6} size={100} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. CHIPS & FREE DRINKS: Cash → Plastic Chips ─────────────────────────
export const SetChips: React.FC<SetProps> = ({ f }) => {
  const swap = ramp(f, c.swapChips, c.swapChips + 14, easeInOut);
  const drinks = ramp(f, c.freeDrinks - 4, c.freeDrinks + 10, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.cashHurts, [0.1, 1.82, 1.72]],
      [c.freeDrinks, [-0.15, 1.66, 1.55]],
    ]),
    look: [0.0, 0.84, 0.0],
    fov: 44,
  };
  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look="vip">
        <VipPitRoom>
          <CardTable p={[0, 0, 0]} mode="blackjack">
            <PuhBill p={[0, 0.786, 0.1 - swap * 0.45]} rot={[-Math.PI / 2, 0, -0.06]} scale={0.3 * (1 - swap * 0.2)} ribbon={false} />
            {[
              { x: -0.18, z: 0.08, c: "#1b1e28", l: "$100", n: 10 },
              { x: 0.04, z: 0.12, c: "#c92a2a", l: "$5", n: 14 },
              { x: 0.24, z: 0.06, c: "#1f7a3f", l: "$25", n: 12 },
              { x: 0.36, z: -0.08, c: "#d49b2a", l: "$500", n: 8 },
            ].map((s, idx) => (
              <ChipStack key={idx} p={[s.x, 0.78, s.z]} count={Math.max(1, Math.round(swap * s.n))} color={s.c} label={s.l} seed={idx + 20} scale={1.25 * swap} />
            ))}
            {f >= c.freeDrinks - 6 ? <CocktailTray p={[-0.95 + drinks * 0.56, 0.78, -0.14]} scale={1.15} /> : null}
          </CardTable>
        </VipPitRoom>
      </CasinoCanvas>
      <Pill o={fadeIn(f, c.swapChips)} value="CASH → CHIPS" label="ZERO PAIN OF PAYING" top={195} color="#ffd23f" />
      {f >= c.freeDrinks ? <Big x={540} y={1320} text="FREE DRINKS 🍸" o={pop(f, c.freeDrinks)} color="#5ff2ff" size={92} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. ROULETTE: 0 (2.7%) → 00 (5.26%) → 000 (7.69%) ─────────────────────────
export const SetRoulette: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.fairBet) / 30;
  const zeros: 1 | 2 | 3 = f >= c.tripleZero ? 3 : f >= c.doubleZero ? 2 : 1;
  const drop = ramp(f, c.edge27, c.houseWins, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.fairBet, [0.2, 1.56, 1.38]],
      [c.doubleZero, [-0.14, 1.62, 1.28]],
      [c.houseWins, [0.0, 1.68, 1.18]],
    ]),
    look: [0, 0.62, 0.02],
    fov: 45,
  };
  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look="studio">
        <StudioDark spotI={28}>
          <RouletteWheel p={[0, 0.58, 0]} scale={1.08} spin={t * 1.4} ballAngle={-t * 4.2} ballDrop={drop} zeros={zeros} stand={true} />
        </StudioDark>
      </CasinoCanvas>
      <RouletteEdgeBar f={f} at={c.roulette} doubleAt={c.doubleZero} tripleAt={c.tripleZero} until={c.slots} />
      {f >= c.houseWins ? <Stamp f={f} at={c.houseWins} text="HOUSE WINS" top={1290} color="#19e066" rot={-6} size={102} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 6. SLOTS: Classic Machine → 1984 Virtual Reel X-Ray (Near Miss) ─────────────────────────
export const SetSlots: React.FC<SetProps> = ({ f }) => {
  const isXray = f >= c.patent1984;
  const spinProg = ramp(f, c.slots + 4, c.stops22 + 12, easeOut);
  const lever = ramp(f, c.slots, c.slots + 7, easeOut) - ramp(f, c.slots + 8, c.slots + 16, easeOut);
  const vrSpin = ramp(f, c.patent1984, c.nearMiss, easeOut) * (Math.PI * 2 - 0.175); // stops 1 notch off jackpot!
  const cam: Cam = isXray
    ? {
        pos: keys3(f, [
          [c.patent1984, [0, 1.12, 4.35]],
          [c.nearMiss, [0.18, 1.22, 3.95]],
        ]),
        look: [0, 0.88, 0],
        fov: 44,
      }
    : {
        pos: keys3(f, [
          [c.slots, [0.22, 1.35, 2.75]],
          [c.patent1984 - 1, [0.06, 1.24, 2.45]],
        ]),
        look: [0, 1.04, 0],
        fov: 44,
      };
  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look="studio">
        <StudioDark spotI={26}>
          {isXray ? (
            <VirtualReelCutaway p={[0, 0.3, 0]} scale={0.78} spin={vrSpin} highlight={1} />
          ) : (
            <SlotMachine
              p={[0, 0, 0]}
              scale={0.96}
              reels={[0.78 + spinProg * 6.28, 0.78 + spinProg * 12.56, 1.56 + spinProg * 12.56]}
              lever={lever}
              mode="classic"
              flash={0.75}
            />
          )}
        </StudioDark>
      </CasinoCanvas>
      <VirtualReelCard f={f} at={c.stops22} patentAt={c.patent1984} until={c.betOne} />
      {f >= c.oneNotch ? <Stamp f={f} at={c.oneNotch} text="NEAR MISS!" top={1290} color="#ff4238" rot={-7} size={108} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 7. LOSS DISGUISED AS A WIN (Bet $1 → Win $0.40) ─────────────────────────
export const SetLdw: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const flash = 0.55 + 0.45 * Math.sin((f - c.betOne) * 0.55);
  const cam: Cam = {
    pos: keys3(f, [
      [c.betOne, [0.1, 1.5, 3.88]],
      [c.ldw, [-0.08, 1.44, 3.55]],
    ]),
    look: [-0.08, 1.02, 0],
    fov: 44,
  };
  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look="vip">
        <VipPitRoom>
          <SlotMachine p={[0.32, 0, -0.05]} ry={-0.24} scale={0.96} mode="ldw" flash={flash} />
          <Model file="man_b.glb" anims={LIB2} clip="Yes" t={t} p={[-0.58, 0, 0.15]} ry={0.75} outfit={FRIEND} tint={{ Hair: "#161616" }} />
        </VipPitRoom>
      </CasinoCanvas>
      <LdwReceipt f={f} at={c.betOne} until={c.oxygen} />
      {f >= c.walletShrinks ? <Big x={540} y={1320} text="NET: -$0.60 💀" o={pop(f, c.walletShrinks)} color="#ff4238" size={96} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 8. OXYGEN MYTH vs COOL AIR + SCENT ─────────────────────────
export const SetVents: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const mythFlash = f >= c.totalMyth && f < c.coolAir ? 0.65 + 0.35 * Math.sin(t * 20) : 0;
  const scentProg = ramp(f, c.coolAir - 4, c.coolAir + 10, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.oxygen, [0.0, 0.74, 3.55]],
      [c.coolAir, [0.12, 0.72, 3.35]],
    ]),
    look: [0, 0.6, 0],
    fov: 44,
  };
  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look="studio">
        <StudioDark spotI={30}>
          <VentDuct p={[0, 0.82, 0]} scale={0.95} spin={t * 8} mythFlash={mythFlash} scentProg={scentProg} />
        </StudioDark>
      </CasinoCanvas>
      <VentCompare f={f} at={c.totalMyth} scentAt={c.coolAir} until={c.wait} />
      {f >= c.oneSpark && f < c.coolAir ? <Stamp f={f} at={c.oneSpark} text="FIRE HAZARD!" top={1290} color="#ff5a26" rot={-6} size={98} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 9. CARD COUNTING, AGENTS, CCTV & RFID ─────────────────────────
export const SetSecurity: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const stage: "table" | "cctv" | "rfid" = f >= c.rfid ? "rfid" : f >= c.ceilingDomes ? "cctv" : "table";
  const a1 = follow(
    [
      [1.25, -0.7],
      [0.62, -0.84],
    ],
    1.5,
    Math.max(0, (f - c.banHim) / 30),
  );
  const a2 = follow(
    [
      [-1.25, -0.7],
      [-0.62, -0.84],
    ],
    1.5,
    Math.max(0, (f - c.banHim) / 30),
  );
  const a1Walking = f >= c.banHim && a1.moving;
  const a2Walking = f >= c.banHim && a2.moving;
  const rfidOpen = ramp(f, c.rfid, c.rfid + 14, easeOut);

  const cam: Cam =
    stage === "table"
      ? {
          pos: keys3(f, [
            [c.wait, [0, 1.66, 3.65]],
            [c.banHim, [0, 1.66, 3.75]],
          ]),
          look: [0, 1.05, -0.3],
          fov: 46,
        }
      : stage === "cctv"
        ? { pos: [0, 1.48, 3.35], look: [0, 1.32, -0.15], fov: 44 }
        : { pos: [0.12, 1.44, 1.62], look: [0, 0.7, 0], fov: 42 };

  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look={stage === "table" ? "vip" : "security"}>
        {stage === "table" ? (
          <VipPitRoom>
            <CardTable p={[0, 0, -0.15]} mode="blackjack">
              <PlayingCard p={[-0.24, 0.786, 0.08]} rot={[-Math.PI / 2, 0, 0.1]} rank="A" suit="♠" />
              <PlayingCard p={[-0.08, 0.786, 0.08]} rot={[-Math.PI / 2, 0, -0.05]} rank="K" suit="♠" />
              <PlayingCard p={[0.1, 0.786, 0.08]} rot={[-Math.PI / 2, 0, 0.08]} rank="Q" suit="♦" />
              <PlayingCard p={[0.26, 0.786, 0.08]} rot={[-Math.PI / 2, 0, -0.1]} rank="10" suit="♣" />
              <ChipStack p={[-0.5, 0.78, 0.08]} count={8} color="#1b1e28" label="$100" />
            </CardTable>
            <Model file="man_b.glb" anims={LIB1} clip="Idle_Loop" t={t} p={[0, 0, -0.98]} ry={0} outfit={FRIEND} tint={{ Hair: "#161616" }} />
            {f >= c.banHim ? (
              <>
                <Agent
                  file="man_c.glb"
                  lib={a1Walking ? LIB1 : LIB2}
                  clip={a1Walking ? "Walk_Loop" : "Idle_FoldArms_Loop"}
                  t={a1Walking ? ((f - c.banHim) / 30) * 1.5 : t}
                  p={[a1.x, 0, a1.z]}
                  ry={a1Walking ? a1.ry : -0.35}
                />
                <Agent
                  file="man_d.glb"
                  lib={a2Walking ? LIB1 : LIB2}
                  clip={a2Walking ? "Walk_Loop" : "Idle_FoldArms_Loop"}
                  t={a2Walking ? ((f - c.banHim) / 30) * 1.5 : t + 0.4}
                  p={[a2.x, 0, a2.z]}
                  ry={a2Walking ? a2.ry : 0.35}
                />
              </>
            ) : null}
          </VipPitRoom>
        ) : stage === "cctv" ? (
          <StudioDark spotColor="#a8d8ff" spotI={24}>
            <MonitorWall p={[0, 0, -0.2]} scale={1.0} />
            <CeilingDome p={[0.58, 2.42, 0.25]} scanAngle={Math.sin(t * 2.5) * 0.4} beam={0.55} />
          </StudioDark>
        ) : (
          <StudioDark spotColor="#80e8ff" spotI={26}>
            <RfidChipCutaway p={[0, 0.62, 0]} rot={[0.25, t * 0.45, 0]} scale={1.08} open={rfidOpen} pulse={1} />
          </StudioDark>
        )}
      </CasinoCanvas>
      <CardCountVerdict f={f} at={c.legal} banAt={c.banHim} until={c.ceilingDomes} />
      {stage === "cctv" ? <Pill o={fadeIn(f, c.ceilingDomes)} value="FACIAL ID" label="CEILING CAMERAS" top={200} color="#ff4238" /> : null}
      {stage === "rfid" ? <Pill o={fadeIn(f, c.rfid)} value="RFID MICROCHIP" label="TRACKS EVERY BET" top={200} color="#4ceeff" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 10. SCALE: $72 BILLION U.S. CASINOS (2024) ─────────────────────────
export const SetScale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.billion72, [0.22, 1.88, 5.35]],
      [c.allIn, [-0.15, 1.75, 4.85]],
    ]),
    look: [0, 1.18, -0.8],
    fov: 46,
  };
  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look="vegas">
        <VegasSkyline p={[0, 0, -0.8]} t={t} />
      </CasinoCanvas>
      <RevenueCounter f={f} at={c.billion72} until={c.allIn} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 11. FINALE: All-In → Grandma Royal Flush → Fox Dance → Green Zero Follow ─────────────────────────
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const stage: "showdown" | "dance" | "follow" = f >= c.follow ? "follow" : f >= c.congrats ? "dance" : "showdown";

  if (stage === "showdown") {
    const cam: Cam = {
      pos: keys3(f, [
        [c.allIn, [0, 1.65, 3.45]],
        [c.grandma, [0.16, 1.6, 3.15]],
      ]),
      look: [0, 1.05, -0.35],
      fov: 46,
    };
    return (
      <AbsoluteFill>
        <CasinoCanvas cam={cam} look="vip">
          <VipPitRoom>
            <CardTable p={[0, 0, -0.25]} mode="blackjack">
              <FursuitHead p={[0, 0.78, 0.08]} s={0.34} ry={0.18} t={t} />
              {[
                { r: "10", x: -0.2, rz: 0.16 },
                { r: "J", x: -0.1, rz: 0.08 },
                { r: "Q", x: 0.0, rz: 0 },
                { r: "K", x: 0.1, rz: -0.08 },
                { r: "A", x: 0.2, rz: -0.16 },
              ].map((card, i) => (
                <PlayingCard key={i} p={[card.x + 0.36, 0.81 + i * 0.002, -0.14]} rot={[-Math.PI / 2 + 0.22, 0, card.rz]} rank={card.r} suit="♠" />
              ))}
              <ChipStack p={[-0.48, 0.78, -0.05]} count={10} color="#1b1e28" label="$100" />
            </CardTable>
            <Model file="man_b.glb" anims={LIB1} clip="Interact" t={t} p={[-0.56, 0, -0.96]} ry={0.35} outfit={FRIEND} tint={{ Hair: "#161616" }} />
            <Model
              file="woman_c.glb"
              anims={LIB2}
              clip="Yes"
              t={t}
              p={[0.56, 0, -0.96]}
              ry={-0.35}
              outfit={GRANDMA}
              tint={{ Hair: "#d9d9d9" }}
              attach={{ bone: "Head", node: <Shades /> }}
            />
          </VipPitRoom>
        </CasinoCanvas>
        {f >= c.grandma ? <Big x={540} y={240} text="ROYAL FLUSH! ♠" o={pop(f, c.grandma)} color="#ffd23f" size={88} /> : null}
      </AbsoluteFill>
    );
  }

  if (stage === "dance") {
    const cam: Cam = {
      pos: keys3(f, [
        [c.congrats, [0.1, 1.48, 3.45]],
        [c.follow - 1, [0.0, 1.54, 3.75]],
      ]),
      look: [0, 1.08, 0.15],
      fov: 44,
    };
    return (
      <AbsoluteFill>
        <CasinoCanvas cam={cam} look="vip">
          <VipPitRoom>
            <ChipRain t={t} count={30} radius={2.8} height={4.2} />
            {/* Grandma wearing the won pocket puh and dancing */}
            <Model
              file="woman_c.glb"
              anims={LIB1}
              clip="Dance_Loop"
              t={t}
              p={[0.15, 0, 0.25]}
              ry={-0.12}
              outfit={GRANDMA}
              tint={{ Hair: "#d9d9d9" }}
              attach={{ bone: "Head", node: <FursuitHead s={MASK_S} p={WORN} t={t} dance={1} /> }}
            />
            <Model file="man_b.glb" anims={LIB2} clip="Idle_FoldArms_Loop" t={t} p={[-0.62, 0, -0.25]} ry={0.45} outfit={FRIEND} tint={{ Hair: "#161616" }} />
          </VipPitRoom>
        </CasinoCanvas>
        {f >= c.theCasino ? <Big x={540} y={240} text="THE CASINO" o={pop(f, c.theCasino)} color="#ffd23f" size={112} /> : null}
      </AbsoluteFill>
    );
  }

  // Follow beat: Pocket Puh riding green 0 on spinning roulette wheel
  const wheelSpin = Math.PI + Math.sin((f - c.follow) * 0.08) * 0.28;
  const cam: Cam = { pos: [0.0, 1.84, 1.82], look: [0, 0.58, 0.0], fov: 44 };
  return (
    <AbsoluteFill>
      <CasinoCanvas cam={cam} look="studio">
        <StudioDark spotI={28}>
          <RouletteWheel p={[0, 0.58, 0]} scale={1.08} spin={wheelSpin} ballAngle={-t * 3.0} ballDrop={0.7} zeros={2} stand={true} />
          <group position={[0, 0.612, 0]} rotation={[0, wheelSpin, 0]}>
            <FursuitHead p={[0.0, 0.075, -0.3]} s={0.18} ry={Math.PI} t={t} />
          </group>
        </StudioDark>
      </CasinoCanvas>
      <FollowPill f={f} at={c.follow} until={c.end - 16} top={1400} />
      {f >= c.greenZeroEnd - 4 && f < c.end - 16 ? <Big x={540} y={240} text="GREEN ZERO?!" o={pop(f, c.greenZeroEnd - 4)} color="#19e066" size={88} /> : null}
    </AbsoluteFill>
  );
};
