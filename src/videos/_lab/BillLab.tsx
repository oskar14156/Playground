import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { FursuitHead } from "../../lib/three/Mascots";
import { BleachedFiveBill, ColonialBill, FakeBill, PuhBill } from "../dollar-bill/bill";
import {
  EmptyWallet,
  FoldMachine,
  HomePrinter,
  MicroLensRibbon,
  PhotoshopDesk,
  PriceTag,
  PrintingPress,
  StickyNote,
  UvFixture,
  WashingMachine,
} from "../dollar-bill/props";
import { BillCanvas, DenRoom, LaundryRoom, Look, StudioPedestal, Workshop1739 } from "../dollar-bill/world";

export const BILL_LAB_DURATION = 6;

const SHOTS: { cam: Cam; look: Look }[] = [
  // 0: Hero PuhBill macro (full bill framed edge-to-edge: 3D ribbon, copper→green inkwell & 100, raised intaglio, bump)
  { cam: { pos: [0.24, 0.54, 4.15], look: [0, 0.5, 0], fov: 40 }, look: "studio" },
  // 1: DenRoom desk (FursuitHead + USED $100 PriceTag + HomePrinter + EmptyWallet + StickyNote)
  { cam: { pos: [0.65, 1.48, 1.15], look: [1.1, 0.94, -0.92], fov: 44 }, look: "room" },
  // 2: LaundryRoom (WashingMachine cutaway w/ jeans + crisp PuhBill + mushy FakeBill + FoldMachine on stand)
  { cam: { pos: [0.06, 1.24, 3.25], look: [0.05, 0.56, 0], fov: 44 }, look: "laundry" },
  // 3: UV Darkroom (UvFixture + Pink PuhBill vs Blue BleachedFiveBill, both fully framed)
  { cam: { pos: [0, 0.72, 3.65], look: [0, 0.62, 0], fov: 42 }, look: "uv" },
  // 4: PhotoshopDesk (ACCESS DENIED + scan bar + EURion) + MicroLensRibbon face-forward stand
  { cam: { pos: [0.05, 1.5, 3.85], look: [0.02, 0.72, -0.15], fov: 44 }, look: "studio" },
  // 5: 1739 Sepia Workshop (PrintingPress + PENNSILVANIA vs PENNSYLVANIA)
  { cam: { pos: [0, 1.65, 3.25], look: [0, 0.92, -0.22], fov: 44 }, look: "sepia" },
];

export const BillLab: React.FC = () => {
  const f = useCurrentFrame();
  const s = SHOTS[Math.min(f, SHOTS.length - 1)];

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <BillCanvas cam={s.cam} look={s.look}>
        {f === 0 ? (
          <StudioPedestal spotI={32}>
            <PuhBill p={[0, 0.5, 0]} rot={[-0.08, 0.22, 0.03]} scale={0.96} tiltX={0.14} tiltY={0.18} ribbonPhase={0.35} colorShift={0.85} raised={0.9} eurion={0.35} />
          </StudioPedestal>
        ) : null}

        {f === 1 ? (
          <DenRoom>
            <FursuitHead p={[0.72, 0.78, -0.98]} s={0.42} ry={-0.3} t={0.4} />
            <PriceTag p={[0.98, 0.95, -0.78]} rot={[0.08, -0.25, 0.12]} swing={0.05} text="$100" sub="USED" />
            <EmptyWallet p={[0.56, 0.79, -0.66]} rot={[0, 0.4, 0]} open={0.9} mothT={0.75} />
            <HomePrinter p={[1.52, 0.78, -0.92]} ry={-0.38} printProg={0.7} active={1} />
            <StickyNote p={[1.1, 0.786, -0.64]} rot={[-Math.PI / 2, 0, -0.15]} />
          </DenRoom>
        ) : null}

        {f === 2 ? (
          <LaundryRoom>
            <WashingMachine p={[-0.36, 0, -0.08]} ry={0.2} spin={0.6} mush={0.92} showJeans={1} />
            <FoldMachine p={[0.48, 0, 0.25]} ry={-0.25} fold={0.42} />
          </LaundryRoom>
        ) : null}

        {f === 3 ? (
          <StudioPedestal spotI={4}>
            <UvFixture p={[0, 1.44, 0.05]} on={1} width={1.6} />
            <PuhBill p={[0, 0.96, 0]} scale={0.82} uv={1} watermark={1} />
            <BleachedFiveBill p={[0, 0.28, 0]} scale={0.82} uv={1} watermark={1} penMark="yellow" penProg={1} />
          </StudioPedestal>
        ) : null}

        {f === 4 ? (
          <StudioPedestal spotI={22}>
            <PhotoshopDesk p={[0, 0.2, -0.22]} scanProg={0.6} blocked={1} eurion={1} />
            <group position={[0.42, 1.32, 0.12]} scale={0.38}>
              <MicroLensRibbon rot={[0.1, -0.18, 0]} tiltX={0.2} tiltY={0.25} />
            </group>
            <FakeBill p={[-0.48, 0.25, 0.55]} rot={[-Math.PI / 2, 0, 0.16]} scale={0.4} penMark="black" penProg={1} />
          </StudioPedestal>
        ) : null}

        {f === 5 ? (
          <Workshop1739>
            <PrintingPress p={[-0.18, 0.73, -0.65]} ry={0.32} spin={0.8} scale={0.72} />
            <ColonialBill p={[-0.28, 0.745, 0.06]} rot={[-Math.PI / 2 + 0.35, 0, 0.08]} scale={0.38} fixed={false} highlight={1} />
            <ColonialBill p={[0.3, 0.745, 0.06]} rot={[-Math.PI / 2 + 0.35, 0, -0.08]} scale={0.38} fixed={true} highlight={1} />
          </Workshop1739>
        ) : null}
      </BillCanvas>
    </AbsoluteFill>
  );
};
