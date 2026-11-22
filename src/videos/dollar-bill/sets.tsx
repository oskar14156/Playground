import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, TubePath, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { RB } from "../../lib/three/diorama";
import { Earth } from "../../lib/three/Earth";
import { FollowPill } from "../../lib/Follow";
import { Grain } from "../../lib/ViewMode";
import { easeInOut, easeOut, keys, keys3, ramp } from "../../lib/timing";
import { Shades } from "../white-house/props";
import { AirCanvas } from "../airplane/world";
import { EARTH_LAT, EARTH_LON, greatCircle, onEarth } from "../airplane/sets";
import { Garden } from "../internet/props";
import { c } from "./cues";
import { BleachedFiveBill, ColonialBill, FakeBill, PuhBill } from "./bill";
import {
  BillRain,
  BleachStation,
  CheckoutCounter,
  EmptyWallet,
  FoldMachine,
  HomePrinter,
  IodinePen,
  MagnifyingGlass,
  MicroLensRibbon,
  PhotoshopDesk,
  PriceTag,
  PrintingPress,
  StickyNote,
  UvFixture,
  WashingMachine,
} from "./props";
import { BillCanvas, DenRoom, LaundryRoom, StoreRoom, StudioPedestal, Workshop1739 } from "./world";
import {
  Big,
  Clipping,
  CounterPill,
  MaterialBar,
  MicroCollarZoom,
  PenSchematic,
  Pill,
  RibbonDiagram,
  SecretServiceTimeline,
  Stamp,
  StatTriplet,
  Tag,
  TypoCard,
  UvCompare,
  YearTag,
} from "./inserts";

export type SetProps = { f: number };
const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 10) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));

/** walk along a collision-free polyline at `speed` m/s; returns position, heading (+Z front) and moving flag */
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

// ───────────────────────── outfits (always Outfit.loose for clothed people) ─────────────────────────
const YOU: Outfit = { top: "#e8573a", pants: "#2b323d", shoes: "#f0f0f0", loose: "male" };
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#383b42", shoes: "#24201c", loose: "male" };
const CASHIER: Outfit = { top: "#248252", pants: "#262b34", shoes: "#1c1c1e", sleeves: 0.72, loose: "female" };
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

const Sepia: React.FC<{ children: React.ReactNode; k?: number }> = ({ children, k = 0.88 }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ filter: `sepia(${k}) contrast(1.06) brightness(0.95) saturate(0.95)` }}>{children}</AbsoluteFill>
    <Grain amount={0.1} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(28,16,6,0.48) 100%)" }} />
  </AbsoluteFill>
);

// ───────────────────────── 1. HOOK: used pocket puh + printer at home ─────────────────────────
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const openWallet = ramp(f, c.broke, c.broke + 12, easeOut);
  const mothT = f >= c.broke ? (f - c.broke) / 30 : 0;
  const printProg = ramp(f, c.printsHome, c.cantFake, easeOut);
  const rise = ramp(f, c.cantFake, c.paper, easeOut);
  // Friend walks behind the desk (clear open aisle at z=-1.55) so he never blocks camera view of mask/printer
  const walk = follow(
    [
      [0.95, -1.55],
      [1.52, -1.52],
    ],
    1.1,
    Math.max(0, (f - c.broke) / 30),
  );
  const isWalking = f >= c.broke && walk.moving;
  const cam: Cam = {
    pos: keys3(f, [
      [0, [0.72, 1.56, 1.82]],
      [c.say100, [0.78, 1.5, 1.65]],
      [c.broke, [0.85, 1.48, 1.55]],
      [c.printsHome, [1.35, 1.44, 1.15]],
      [c.cantFake, [1.02, 1.46, 1.05]],
    ]),
    look: keys3(f, [
      [0, [0.86, 1.08, -0.92]],
      [c.say100, [0.9, 1.05, -0.92]],
      [c.broke, [0.95, 1.02, -0.92]],
      [c.printsHome, [1.46, 0.98, -0.92]],
      [c.cantFake, [1.0, 1.24, -0.82]],
    ]),
    fov: 46,
  };
  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="room">
        <DenRoom>
          {/* FursuitHead with USED $100 price tag on oak desk (top y=0.78) */}
          <FursuitHead p={[0.72, 0.78, -0.92]} s={0.42} ry={-0.28} t={t} blink={f > 18 && f < 22 ? 1 : 0} />
          <PriceTag p={[0.98, 0.95, -0.74]} rot={[0.06, -0.2, 0.08]} swing={Math.sin(t * 3.5) * 0.08} text="$100" sub="USED" />
          <EmptyWallet p={[0.48, 0.785, -0.66]} rot={[0, 0.35, 0]} open={0.25 + 0.75 * openWallet} mothT={mothT} />
          <HomePrinter p={[1.5, 0.78, -0.9]} ry={-0.32} printProg={printProg} active={f >= c.printsHome ? 1 : 0.3} />
          {/* Glowing crisp PuhBill rising at "bill he can't fake" */}
          {f >= c.cantFake ? (
            <group position={[1.0, 1.12 + 0.16 * rise, -0.76]} scale={pop(f, c.cantFake, 10) * 0.55}>
              <PuhBill rot={[-0.08, -0.18 + (f - c.cantFake) * 0.03, 0]} colorShift={rise} />
              <Glow position={[0, 0, -0.04]} size={1.1} color="#7affb2" opacity={0.38 * rise} />
            </group>
          ) : null}
          {/* You standing cleanly behind left side of the desk */}
          <Model
            file="man_a.glb"
            anims={LIB1}
            clip={f >= c.say100 && f < c.broke ? "Idle_Talking_Loop" : "Idle_Loop"}
            t={t}
            p={[0.42, 0, -1.55]}
            ry={0.22}
            outfit={YOU}
            tint={{ Hair: "#3a281c" }}
          />
          {/* Friend behind the desk looking over the mask & walking behind printer — 0 occlusion! */}
          <Model
            file="man_b.glb"
            anims={LIB1}
            clip={isWalking ? "Walk_Loop" : f >= c.printsHome ? "Interact" : "Idle_Loop"}
            t={isWalking ? ((f - c.broke) / 30) * 1.1 : f >= c.printsHome ? Math.max(0, (f - c.printsHome) / 30) : t}
            p={[walk.x, 0, walk.z]}
            ry={isWalking ? walk.ry : 0.05}
            outfit={FRIEND}
            tint={{ Hair: "#161616" }}
          />
        </DenRoom>
      </BillCanvas>
      {f >= c.say100 && f < c.broke ? <Big x={540} y={260} text="USED · $100" o={pop(f, c.say100)} color="#ffd639" size={96} /> : null}
      {f >= c.printsHome && f < c.cantFake ? <Tag x={160} y={1320} text="MONEY PRINTER GO BRRR" o={fadeIn(f, c.printsHome)} color="#5dfc8d" side="right" size={34} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 2. PAPER: washing machine cutaway (75% cotton / 25% linen) ─────────────────────────
export const SetWash: React.FC<SetProps> = ({ f }) => {
  const spin = (f - c.paper) * 0.22;
  const mush = ramp(f, c.paper + 6, c.cotton, easeInOut);
  const showJeans = ramp(f, c.jeans - 4, c.jeans + 10, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.paper, [0.22, 1.1, 2.25]],
      [c.cotton, [0.12, 0.72, 1.48]],
      [c.folds, [0.06, 0.62, 1.25]],
    ]),
    look: keys3(f, [
      [c.paper, [0, 0.52, -0.25]],
      [c.cotton, [0, 0.49, -0.18]],
      [c.folds, [0, 0.49, -0.15]],
    ]),
    fov: 42,
  };
  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="laundry">
        <LaundryRoom>
          <WashingMachine p={[0, 0, -0.32]} ry={0.14} spin={spin} mush={mush} showJeans={showJeans} />
        </LaundryRoom>
      </BillCanvas>
      {f >= c.mush && f < c.cotton ? <Big x={540} y={290} text="PAPER → MUSH!" o={pop(f, c.mush)} color="#ff6b5e" size={96} /> : null}
      <MaterialBar f={f} at={c.cotton} until={c.folds} jeansAt={c.jeans} foldsAt={999999} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. FOLD TEST: 4,000 double folds ─────────────────────────
export const SetFold: React.FC<SetProps> = ({ f }) => {
  const k = ramp(f, c.folds, c.cashiers - 6, easeOut);
  const fold = 0.46 * (1 - Math.cos((f - c.folds) * 0.52));
  const cam: Cam = {
    pos: keys3(f, [
      [c.folds, [0.42, 1.42, 1.85]],
      [c.cashiers, [-0.42, 1.32, 1.65]],
    ]),
    look: [0, 0.84, 0.04],
    fov: 42,
  };
  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="laundry">
        <LaundryRoom>
          <FoldMachine p={[0, 0, -0.1]} ry={-0.12} fold={fold} />
        </LaundryRoom>
      </BillCanvas>
      <CounterPill o={fadeIn(f, c.folds)} value={Math.round(k * 4000)} label="DOUBLE FOLDS" top={190} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. THE PEN: checkout counter + iodine pen ─────────────────────────
export const SetPen: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const fakeProg = ramp(f, c.fakeBlack, c.fakeBlack + 18, easeOut);
  const realProg = ramp(f, c.cottonYellow, c.cottonYellow + 18, easeOut);
  const onReal = f >= c.cottonYellow - 4;
  const penX = onReal ? 0.106 + 0.084 * realProg : -0.394 + 0.084 * fakeProg;
  const penY = f < c.fakeBlack ? 1.15 : onReal && f < c.cottonYellow ? 1.14 : 0.976;
  const penZ = 0.03 + 0.02 * (onReal ? realProg : fakeProg);
  const cam: Cam = {
    pos: keys3(f, [
      [c.cashiers, [0.16, 1.76, 2.15]],
      [c.fakeBlack, [-0.12, 2.08, 1.65]],
      [c.cottonYellow, [0.12, 2.08, 1.65]],
    ]),
    look: keys3(f, [
      [c.cashiers, [0.0, 1.18, -0.1]],
      [c.fakeBlack, [-0.12, 0.9, 0.04]],
      [c.cottonYellow, [0.12, 0.9, 0.04]],
    ]),
    fov: 46,
  };
  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="store">
        <StoreRoom>
          <CheckoutCounter p={[0, 0, -0.15]} />
          <Model file="woman_a.glb" anims={LIB1} clip="Interact" t={t} p={[-0.08, 0, -0.92]} ry={0} outfit={CASHIER} tint={{ Hair: "#2a1b12" }} />
          <Model file="man_b.glb" anims={LIB1} clip="Idle_Loop" t={t} p={[-0.78, 0, 0.72]} ry={2.6} outfit={FRIEND} tint={{ Hair: "#161616" }} />
          {/* Two bills side-by-side cleanly above conveyor belt top (y=0.933) */}
          <FakeBill p={[-0.25, 0.942, 0.02]} rot={[-Math.PI / 2, 0, 0.05]} scale={0.3} penMark="black" penProg={fakeProg} />
          <PuhBill p={[0.25, 0.942, 0.02]} rot={[-Math.PI / 2, 0, -0.05]} scale={0.3} penMark="yellow" penProg={realProg} />
          <IodinePen p={[penX, penY, penZ]} rot={[0.42, 0, -0.35]} scale={1.05} />
        </StoreRoom>
      </BillCanvas>
      <PenSchematic f={f} at={c.fakeBlack} until={c.bleaches} cottonAt={c.cottonYellow} />
      {f >= c.fakeBlack + 12 && f < c.cottonYellow ? <Stamp f={f} at={c.fakeBlack + 12} text="FAKE!" top={1290} color="#ff3b30" rot={-8} size={110} /> : null}
      {f >= c.cottonYellow + 10 ? <Big x={540} y={1340} text="PASS ✓" o={pop(f, c.cottonYellow + 10)} color="#34c759" size={96} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. BLEACHED $5: fools the iodine pen! ─────────────────────────
export const SetBleach: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const soak = ramp(f, c.bleaches, c.prints100, easeInOut);
  const stampPress = ramp(f, c.prints100 - 4, c.prints100 + 8, easeOut) - ramp(f, c.prints100 + 10, c.prints100 + 20, easeOut) * 0.7;
  const penProg = ramp(f, c.passes, c.passes + 14, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.bleaches, [0.25, 1.65, 1.75]],
      [c.prints100, [0.3, 1.54, 1.25]],
      [c.passes, [0.32, 1.48, 0.98]],
    ]),
    look: keys3(f, [
      [c.bleaches, [-0.08, 0.95, -0.15]],
      [c.prints100, [0.26, 0.84, -0.1]],
      [c.passes, [0.32, 0.82, -0.08]],
    ]),
    fov: 40,
  };
  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="laundry">
        <LaundryRoom>
          {/* waist-high workbench supporting BleachStation cleanly down to y=0 */}
          <group position={[0, 0, -0.15]}>
            {[
              [-0.68, -0.36],
              [0.68, -0.36],
              [-0.68, 0.36],
              [0.68, 0.36],
            ].map(([x, z], i) => (
              <RB key={i} p={[x, 0.36, z]} s={[0.08, 0.72, 0.08]} r={0.01} color="#2c323a" />
            ))}
            <BleachStation p={[0, 0.72, 0]} soak={soak} stampPress={stampPress} />
            {/* yellow iodine pen passing over the bleached 5 */}
            {f >= c.passes - 6 ? <IodinePen p={[0.24 + 0.1 * penProg, 0.85, 0.05]} rot={[0.42, 0, -0.3]} scale={1.05} /> : null}
            {f >= c.passes ? <BleachedFiveBill p={[0.32, 0.812, 0.05]} rot={[-Math.PI / 2, 0, -0.05]} scale={0.34} penMark="yellow" penProg={penProg} /> : null}
          </group>
          <Model file="man_b.glb" anims={LIB1} clip="Interact" t={t} p={[0, 0, -0.92]} ry={0} outfit={FRIEND} tint={{ Hair: "#161616" }} />
        </LaundryRoom>
      </BillCanvas>
      <Big x={540} y={250} text="BLEACHED $5 → $100" o={fadeIn(f, c.bleaches)} color="#ffd23f" size={68} />
      {f >= c.passes ? <Big x={540} y={1320} text="PASSES?!" o={pop(f, c.passes)} color="#ffe042" size={116} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 6. UV LIGHT: pink vs blue + watermark → BUSTED ─────────────────────────
export const SetUv: React.FC<SetProps> = ({ f }) => {
  const uvOn = ramp(f, c.uvLight, c.uvLight + 8, easeOut);
  const wmOn = ramp(f, c.watermark, c.watermark + 10, easeOut);
  const pinkOn = ramp(f, c.realPink - 4, c.realPink + 6, easeOut);
  const blueOn = ramp(f, c.hisBlue, c.hisBlue + 8, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.thread, [0.15, 0.78, 3.85]],
      [c.uvLight, [0, 0.72, 3.65]],
      [c.busted, [0, 0.68, 3.45]],
    ]),
    look: [0, 0.64, 0],
    fov: 42,
  };
  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="uv" keyI={f >= c.uvLight ? 0.28 : 1.15}>
        <StudioPedestal spotI={f >= c.uvLight ? 4 : 22}>
          <UvFixture p={[0, 1.62, 0.05]} on={uvOn} width={1.65} />
          <PuhBill p={[0, 0.96, 0]} scale={0.82} uv={Math.max(pinkOn * uvOn, 0.15 * ramp(f, c.thread, c.uvLight))} watermark={Math.max(wmOn * 0.7, pinkOn)} />
          <BleachedFiveBill p={[0, 0.28, 0]} scale={0.82} uv={blueOn * uvOn} watermark={Math.max(wmOn * 0.4, blueOn)} penMark="yellow" penProg={1} />
        </StudioPedestal>
      </BillCanvas>
      <UvCompare f={f} at={c.realPink - 2} blueAt={c.hisBlue} until={c.scans} />
      <Stamp f={f} at={c.busted} text="BUSTED!" top={1270} color="#ff3b30" rot={-8} size={118} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 7. PHOTOSHOP: EURion dots + CDS block ─────────────────────────
export const SetPhotoshop: React.FC<SetProps> = ({ f }) => {
  const scanProg = ramp(f, c.scans, c.blocked, easeInOut);
  const blocked = pop(f, c.blocked, 8);
  const eurion = ramp(f, c.dots, c.dots + 12, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.scans, [-0.62, 1.48, 1.35]],
      [c.blocked - 2, [-0.62, 1.36, 1.15]],
      // push monitor into upper-half (above y=900 captions) so nothing covers the screen modal!
      [c.blocked + 4, [0.38, 1.18, 2.35]],
      [c.dots, [0.32, 1.16, 2.05]],
      [c.patched, [0.28, 1.16, 2.2]],
    ]),
    look: keys3(f, [
      [c.scans, [-0.62, 0.76, -0.08]],
      [c.blocked - 2, [-0.62, 0.76, -0.08]],
      [c.blocked + 4, [0.35, 1.0, -0.25]],
      [c.dots, [0.28, 0.98, -0.25]],
      [c.patched, [0.32, 1.0, -0.25]],
    ]),
    fov: 42,
  };
  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="studio">
        <StudioPedestal spotI={18}>
          {/* Four dark desk legs down to y=0 under PhotoshopDesk */}
          <group position={[0, 0.68, -0.15]}>
            {[
              [-0.95, -0.42],
              [0.95, -0.42],
              [-0.95, 0.42],
              [0.95, 0.42],
            ].map(([x, z], i) => (
              <RB key={i} p={[x, -0.34, z]} s={[0.08, 0.68, 0.08]} r={0.01} color="#161920" />
            ))}
            <PhotoshopDesk scanProg={scanProg} blocked={f >= c.blocked ? blocked : 0} eurion={eurion} />
          </group>
        </StudioPedestal>
      </BillCanvas>
      {f >= c.dots ? <Pill o={fadeIn(f, c.dots)} value="EURion + CDS" label="ANTI-COPY CODE" top={190} color="#ffe033" /> : null}
      {f >= c.patched ? <Stamp f={f} at={c.patched} text="PATCHED" top={1290} color="#5dfc8d" rot={-5} size={96} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 8. MICROTECH: press, raised ink, copper→green ink, collar zoom ─────────────────────────
export const SetMicro: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const isPress = f < c.raised;
  const raisedK = ramp(f, c.raised, c.raised + 12, easeOut);
  const colorShift = ramp(f, c.colorShift, c.colorShift + 18, easeInOut);
  const tiltY = ramp(f, c.colorShift, c.micro, easeInOut) * 0.42 - 0.16;
  const magProg = ramp(f, c.micro, c.micro + 16, easeOut);
  const cam: Cam = isPress
    ? {
        pos: keys3(f, [
          [c.press, [0.28, 1.52, 3.85]],
          [c.raised - 1, [0.15, 1.46, 3.55]],
        ]),
        look: [0.02, 0.86, -0.05],
        fov: 45,
      }
    : {
        pos: keys3(f, [
          [c.raised, [-0.38, 0.58, 3.65]],
          [c.colorShift, [0.34, 0.66, 3.65]],
          [c.micro, [-0.04, 0.6, 3.55]],
          [c.franklin, [-0.04, 0.56, 3.35]],
        ]),
        look: keys3(f, [
          [c.raised, [-0.02, 0.6, 0]],
          [c.colorShift, [0.06, 0.6, 0]],
          [c.micro, [-0.02, 0.58, 0]],
          [c.franklin, [-0.02, 0.58, 0]],
        ]),
        fov: 42,
      };
  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="studio" keyPos={isPress ? [2.4, 3.8, 2.8] : [-2.6, 1.6, 1.1]} keyI={isPress ? 1.6 : 2.2}>
        <StudioPedestal spotI={24}>
          {isPress ? (
            <>
              <PrintingPress p={[0.28, 0, -0.15]} ry={0.18} spin={t * 4.5} scale={0.85} />
              <Model file="man_b.glb" anims={LIB1} clip="Interact" t={t} p={[-0.68, 0, 0.12]} ry={1.05} outfit={FRIEND} tint={{ Hair: "#161616" }} />
            </>
          ) : (
            <>
              <PuhBill p={[0, 0.62, 0]} scale={0.88} tiltY={tiltY} raised={raisedK} colorShift={colorShift} ribbonPhase={0.25} />
              {f >= c.micro ? (
                <MagnifyingGlass
                  p={[-0.42 + 0.34 * magProg, 0.34, 0.22]}
                  rot={[0.08, 0.1, -0.45]}
                  scale={0.62}
                />
              ) : null}
            </>
          )}
        </StudioPedestal>
      </BillCanvas>
      {f >= c.raised && f < c.colorShift ? <Tag x={440} y={1280} text="RAISED INTAGLIO INK" o={pop(f, c.raised)} color="#5dfc8d" side="right" size={36} /> : null}
      {f >= c.colorShift && f < c.micro ? <Tag x={660} y={1320} text="COPPER → GREEN INK" o={pop(f, c.colorShift)} color="#24c46a" side="left" size={36} /> : null}
      <MicroCollarZoom f={f} at={c.oursSays} until={c.franklin} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 9. 1739 FRANKLIN TYPOS (Sepia) ─────────────────────────
export const SetFranklin: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const fixedHl = ramp(f, c.fakersFixed, c.fakersFixed + 10, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.franklin, [-0.15, 1.65, 3.05]],
      [c.ribbon, [0.16, 1.54, 2.75]],
    ]),
    look: [0, 0.9, -0.15],
    fov: 44,
  };
  return (
    <Sepia k={0.86}>
      <BillCanvas cam={cam} look="sepia">
        <Workshop1739>
          <PrintingPress p={[-0.18, 0.73, -0.68]} ry={0.32} spin={t * 1.6} scale={0.7} />
          <ColonialBill p={[-0.29, 0.745, 0.05]} rot={[-Math.PI / 2 + 0.36, 0, 0.08]} scale={0.38} fixed={false} highlight={1} />
          <ColonialBill p={[0.3, 0.745, 0.05]} rot={[-Math.PI / 2 + 0.36, 0, -0.08]} scale={0.38} fixed={true} highlight={fixedHl} />
        </Workshop1739>
      </BillCanvas>
      <TypoCard f={f} at={c.franklin + 4} caughtAt={c.fakersFixed} until={c.ribbon} />
      <YearTag f={f} at={c.franklin} until={c.ribbon} year="1739" what="BEN FRANKLIN" top={1280} />
    </Sepia>
  );
};

// ───────────────────────── 10. 3D MICROLENS RIBBON ─────────────────────────
export const SetRibbon: React.FC<SetProps> = ({ f }) => {
  const phase = (f - c.ribbon) * 0.09;
  const tiltActive = ramp(f, c.tilt, c.tilt + 10, easeOut);
  const tiltX = Math.sin(phase) * (0.14 + 0.22 * tiltActive);
  const tiltY = Math.cos(phase * 0.85) * (0.18 + 0.28 * tiltActive);
  const cam: Cam = {
    pos: keys3(f, [
      [c.ribbon, [0.22, 0.88, 3.35]],
      [c.tilt, [-0.18, 0.82, 3.15]],
      [c.wontStop, [0.12, 0.84, 3.25]],
    ]),
    look: [0, 0.8, 0],
    fov: 42,
  };
  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="studio">
        <StudioPedestal spotI={28} spotColor="#cce8ff">
          <group position={[0, 0.72, 0]} scale={0.78}>
            <MicroLensRibbon tiltX={tiltX} tiltY={tiltY} />
          </group>
        </StudioPedestal>
      </BillCanvas>
      <RibbonDiagram f={f} at={c.lenses - 6} tiltAt={c.tilt} until={c.wontStop} />
      {f >= c.bells ? <Big x={540} y={1340} text="BELLS ⇄ 100s" o={pop(f, c.bells)} color="#7be0ff" size={88} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 11. SECRET SERVICE RAID + 1865 TIMELINE ─────────────────────────
export const SetSecretService: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const isRaid = f < c.y1865;
  const isClip = f >= c.y1865 && f < c.lincoln;
  const raidT = Math.max(0, (f - c.police + 8) / 30);

  // Two Secret Service agents stride cleanly right into frame flanking Friend + Press
  const a1 = follow(
    [
      [1.35, 1.35],
      [0.6, 0.35],
    ],
    1.4,
    raidT,
  );
  const a2 = follow(
    [
      [-1.35, 1.35],
      [-0.6, 0.35],
    ],
    1.4,
    raidT,
  );

  const cam: Cam = isRaid
    ? {
        pos: keys3(f, [
          [c.wontStop, [0.35, 1.65, 3.65]],
          [c.police, [0.1, 1.62, 4.35]],
          [c.isnt, [0.0, 1.58, 4.35]],
        ]),
        look: keys3(f, [
          [c.wontStop, [0, 0.92, -0.1]],
          [c.police, [0, 0.96, 0.1]],
          [c.isnt, [0, 0.98, 0.1]],
        ]),
        fov: 46,
      }
    : {
        pos: keys3(f, [
          [c.lincoln, [0.12, 1.58, 4.05]],
          [c.costs, [0.0, 1.56, 3.85]],
        ]),
        look: [0, 1.28, 0.35],
        fov: 44,
      };

  if (isClip) {
    return <Clipping f={f} at={c.y1865} year="1865" head="1/3 OF U.S. CASH IS FAKE" sub="Treasury forms the Secret Service to stop counterfeiting." />;
  }

  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="room">
        <DenRoom>
          {/* Press turned sideways-back so red flywheel doesn't hide Friend or Agents */}
          <PrintingPress
            p={isRaid ? [0.15, 0, -0.35] : [-0.65, 0, -0.88]}
            ry={isRaid ? -0.65 : 0.25}
            scale={isRaid ? 0.68 : 0.62}
            spin={isRaid ? t * 4.5 : 0}
          />
          <Model
            file="man_b.glb"
            anims={LIB1}
            clip={f >= c.police ? "Idle_Loop" : "Interact"}
            t={t}
            p={isRaid ? [-0.45, 0, -0.18] : [0.0, 0, -0.02]}
            ry={isRaid ? 0.85 : 0.0}
            outfit={FRIEND}
            tint={{ Hair: "#161616" }}
          />
          {f >= c.police - 8 ? (
            <>
              <Agent
                file="man_c.glb"
                lib={!isRaid ? LIB2 : a1.moving ? LIB1 : LIB2}
                clip={!isRaid ? "Idle_FoldArms_Loop" : a1.moving ? "Walk_Loop" : "Idle_FoldArms_Loop"}
                t={isRaid && a1.moving ? raidT * 1.4 : t}
                p={isRaid ? [a1.x, 0, a1.z] : [0.5, 0, 0.42]}
                ry={isRaid ? (a1.moving ? a1.ry : -0.6) : -0.22}
              />
              <Agent
                file="man_d.glb"
                lib={!isRaid ? LIB2 : a2.moving ? LIB1 : LIB2}
                clip={!isRaid ? "Idle_FoldArms_Loop" : a2.moving ? "Walk_Loop" : "Idle_FoldArms_Loop"}
                t={isRaid && a2.moving ? raidT * 1.4 + 0.35 : t + 0.4}
                p={isRaid ? [a2.x, 0, a2.z] : [-0.5, 0, 0.42]}
                ry={isRaid ? (a2.moving ? a2.ry : 0.6) : 0.22}
              />
            </>
          ) : null}
        </DenRoom>
      </BillCanvas>
      {f >= c.isnt && f < c.y1865 ? <Stamp f={f} at={c.isnt} text="NOT A JOKE" top={1280} color="#ff3b30" rot={-7} size={104} /> : null}
      {f >= c.lincoln ? <SecretServiceTimeline f={f} at={c.lincoln} lincolnAt={c.lincoln} guardAt={c.y1901} until={c.costs} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── 12. SCALE: 11¢ · 24 YRS · 80% OUTSIDE U.S. (Earth globe) ─────────────────────────
const globeCam = (lat: number, lon: number, dist: number, spin0: number, fov = 40): Cam => {
  const v = onEarth(lat, lon, 1, spin0).normalize();
  const pole = onEarth(90, 0, 1, spin0);
  const np = pole.clone().sub(v.clone().multiplyScalar(pole.dot(v)));
  const p = v.clone().multiplyScalar(dist);
  return { pos: [p.x, p.y, p.z], look: [0, 0, 0], fov, roll: Math.atan2(np.x, np.y) };
};

const USA: [number, number] = [39, -96];
const TARGETS: [number, number][] = [
  [51.5, -0.1], // London
  [35.6, 139.7], // Tokyo
  [-23.5, -46.6], // Sao Paulo
  [-33.8, 151.2], // Sydney
  [6.5, 3.4], // Lagos
  [25.2, 55.3], // Dubai
];

export const SetScale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const spin = -0.35 - ramp(f, c.costs, c.grandma, (x) => x) * 0.45;
  const draw = ramp(f, c.outside - 4, c.grandma - 6, easeOut);
  const cam = globeCam(
    22,
    -52,
    keys(f, [
      [c.costs, 3.6],
      [c.grandma, 4.1],
    ]),
    -0.35,
  );
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={1} ao={0} env={0.05}>
        <Earth r={1} lat={EARTH_LAT} lon={EARTH_LON} spin={spin} clouds={t * 0.01} sun={[cam.pos[0] + 1.5, cam.pos[1] + 2, cam.pos[2]]} cover={0.42} />
        {TARGETS.map((dest, idx) => {
          const arc = greatCircle(USA, dest, 64).map(([la, lo], i, arr) =>
            onEarth(la, lo, 1.012 + 0.14 * Math.sin((Math.PI * i) / (arr.length - 1)), spin),
          );
          return <TubePath key={idx} points={arc} progress={draw} radius={0.009} color="#4bff96" />;
        })}
      </AirCanvas>
      <StatTriplet f={f} costAt={c.costs} lifeAt={c.lasts24} abroadAt={c.outside} until={c.grandma} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 13. FINALE: grandma in Australia → bill-rain dance + FOLLOW ─────────────────────────
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const inGarden = f < c.congrats;
  if (inGarden) {
    const cam: Cam = {
      pos: keys3(f, [
        [c.grandma, [2.05, 1.66, 7.25]],
        [c.congrats, [2.0, 1.6, 6.95]],
      ]),
      look: [2.0, 1.05, 2.65],
      fov: 44,
    };
    return (
      <AbsoluteFill>
        <BillCanvas cam={cam} look="day" shadow={18}>
          <Garden>
            <Model file="woman_c.glb" anims={LIB2} clip="Yes" t={t} p={[1.36, 0.01, 2.68]} ry={1.15} outfit={GRANDMA} tint={{ Hair: "#d9d9d9" }} />
            <Model file="man_b.glb" anims={LIB1} clip="Interact" t={t} p={[2.64, 0.01, 2.68]} ry={-1.15} outfit={FRIEND} tint={{ Hair: "#161616" }} />
            <PuhBill p={[2.0, 0.745, 2.46]} rot={[-Math.PI / 2, 0, 0.15]} scale={0.3} />
            <StickyNote p={[1.82, 0.746, 2.72]} rot={[-Math.PI / 2, 0, -0.18]} text="ONLY USED 3×" sub="— GRANDMA" />
          </Garden>
        </BillCanvas>
        <Pill o={fadeIn(f, c.grandma)} value="GRANDMA" label="AUSTRALIA 🇦🇺" top={190} color="#ffd23f" />
      </AbsoluteFill>
    );
  }

  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [0.14, 1.48, 3.35]],
      [c.hundredDollar, [0.06, 1.52, 3.65]],
      [c.follow, [0.04, 1.56, 4.15]],
      [c.end - 16, [0.04, 1.56, 4.15]],
      [c.end, [0.72, 1.56, 1.82]],
    ]),
    look: keys3(f, [
      [c.congrats, [0, 1.12, 0.35]],
      [c.hundredDollar, [0, 1.1, 0.35]],
      [c.follow, [0, 1.08, 0.2]],
      [c.end - 16, [0, 1.08, 0.2]],
      [c.end, [0.86, 1.08, -0.92]],
    ]),
    fov: 44,
  };
  return (
    <AbsoluteFill>
      <BillCanvas cam={cam} look="room">
        <DenRoom>
          <BillRain t={t} count={28} radius={2.8} height={4.2} />
          <Model
            file="man_b.glb"
            anims={LIB1}
            clip="Dance_Loop"
            t={t}
            p={[0.0, 0, 0.35]}
            ry={0.18}
            outfit={FRIEND}
            tint={{ Hair: "#161616" }}
            attach={{ bone: "Head", node: <FursuitHead s={MASK_S} p={WORN} t={t} dance={1} /> }}
          />
          {f >= c.follow - 6 ? (
            <>
              <Agent file="man_c.glb" clip="Idle_FoldArms_Loop" t={t} p={[-0.64, 0, -0.05]} ry={0.28} />
              <Agent file="man_d.glb" clip="Idle_FoldArms_Loop" t={t + 0.5} p={[0.64, 0, -0.05]} ry={-0.28} />
            </>
          ) : null}
        </DenRoom>
      </BillCanvas>
      {f >= c.hundredDollar && f < c.end - 16 ? (
        <Big x={540} y={240} text={"THE HUNDRED\nDOLLAR BILL"} o={pop(f, c.hundredDollar) * (1 - ramp(f, c.end - 22, c.end - 16))} color="#ffd23f" size={108} />
      ) : null}
      <FollowPill f={f} at={c.follow} until={c.end - 16} />
      {f >= c.secretEnd - 6 && f < c.end - 16 ? <Big x={540} y={1450} text="REPORTED?!" o={pop(f, c.secretEnd - 6)} color="#5ff2ff" size={82} /> : null}
    </AbsoluteFill>
  );
};
