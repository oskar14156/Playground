import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { PuhBill } from "../dollar-bill/bill";
import {
  CardTable,
  ChipStack,
  CocktailTray,
  PlayingCard,
  RfidChipCutaway,
  RouletteWheel,
  SlotMachine,
  VegasSkyline,
  VentDuct,
  VirtualReelCutaway,
} from "../casino/props";
import { BellagioRoom, CasinoCanvas, Look, StudioDark, VipPitRoom } from "../casino/world";

export const CASINO_LAB_DURATION = 6;

const SHOTS: { cam: Cam; look: Look }[] = [
  // 0: Hero RouletteWheel (3 zeros, glossy bowl, deflectors, turret, ivory ball)
  { cam: { pos: [0.18, 1.46, 1.28], look: [0, 0.64, 0.02], fov: 44 }, look: "studio" },
  // 1: SlotMachine + VirtualReelCutaway side-by-side
  { cam: { pos: [-0.08, 1.48, 5.0], look: [-0.08, 0.92, 0], fov: 44 }, look: "studio" },
  // 2: BellagioRoom wide shot (marble floor, columns, Chihuly glass chandelier, LDW SlotMachine)
  { cam: { pos: [0, 1.78, 5.2], look: [0, 1.75, -0.8], fov: 48 }, look: "bellagio" },
  // 3: VipPitRoom CardTable macro (RfidChipCutaway open, ChipStack, PuhBill, CocktailTray, Royal Flush)
  { cam: { pos: [0.15, 1.65, 1.55], look: [0.02, 0.85, 0], fov: 42 }, look: "vip" },
  // 4: VentDuct HVAC cutaway (O2 cylinder warning glow + cool airflow + scent bottle)
  { cam: { pos: [0, 0.72, 3.3], look: [0, 0.52, 0], fov: 44 }, look: "studio" },
  // 5: VegasSkyline night Strip neon towers + palms + fountain
  { cam: { pos: [0, 1.85, 5.2], look: [0, 1.15, -0.8], fov: 46 }, look: "vegas" },
];

export const CasinoLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = SHOTS[Math.min(f, SHOTS.length - 1)];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <CasinoCanvas cam={s.cam} look={s.look}>
        {f === 0 ? (
          <StudioDark spotI={28}>
            <RouletteWheel p={[0, 0.58, 0]} scale={1.08} spin={0.4} ballAngle={-0.7} ballDrop={0.85} zeros={3} stand={true} />
          </StudioDark>
        ) : null}

        {f === 1 ? (
          <StudioDark spotI={26}>
            <SlotMachine p={[-0.78, 0, -0.1]} ry={0.22} scale={0.92} reels={[0.9, 0.9, 1.25]} lever={0.45} mode="classic" flash={0.7} />
            <VirtualReelCutaway p={[0.45, 0.45, 0.25]} scale={0.78} spin={0.45} highlight={1} />
          </StudioDark>
        ) : null}

        {f === 2 ? (
          <BellagioRoom t={0.4}>
            <SlotMachine p={[1.1, 0, -0.4]} ry={-0.35} mode="ldw" flash={0.8} scale={0.95} />
          </BellagioRoom>
        ) : null}

        {f === 3 ? (
          <VipPitRoom>
            <CardTable p={[0, 0, 0]} mode="blackjack">
              <RfidChipCutaway p={[-0.28, 0.815, 0.05]} rot={[0.18, 0.2, 0]} scale={0.42} open={0.9} pulse={1} />
              <ChipStack p={[0.32, 0.78, -0.08]} count={12} color="#1b1e28" label="$100" />
              <ChipStack p={[0.45, 0.78, 0.04]} count={8} color="#d49b2a" label="$500" seed={17} />
              <PuhBill p={[0.04, 0.786, 0.24]} rot={[-Math.PI / 2, 0, -0.1]} scale={0.26} ribbon={false} />
              <CocktailTray p={[-0.64, 0.78, -0.18]} />
              {[
                { r: "10", x: -0.18, rz: 0.16 },
                { r: "J", x: -0.09, rz: 0.08 },
                { r: "Q", x: 0.0, rz: 0 },
                { r: "K", x: 0.09, rz: -0.08 },
                { r: "A", x: 0.18, rz: -0.16 },
              ].map((c, idx) => (
                <PlayingCard key={idx} p={[c.x, 0.786 + idx * 0.002, -0.18]} rot={[-Math.PI / 2, 0, c.rz]} rank={c.r} suit="♠" />
              ))}
            </CardTable>
          </VipPitRoom>
        ) : null}

        {f === 4 ? (
          <StudioDark spotI={24}>
            <VentDuct p={[0, 0.82, 0]} scale={0.95} spin={0.8} mythFlash={0.85} scentProg={0.8} />
          </StudioDark>
        ) : null}

        {f === 5 ? <VegasSkyline p={[0, 0, -0.8]} t={0.6} /> : null}
      </CasinoCanvas>
    </AbsoluteFill>
  );
};
