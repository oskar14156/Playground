import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, V3 } from "../../lib/three/core";
import { RB } from "../../lib/three/diorama";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { FollowPill } from "../../lib/Follow";
import { easeInOut, easeOut, keys3, ramp } from "../../lib/timing";
import { c } from "./cues";
import {
  BurjTower,
  CloudPenthouse,
  DoubleDeckElevator,
  FrictionPilesCutaway,
  IceConcreteMixer,
  WindVortexTunnel,
  WindowWasherCradle,
} from "./props";
import { DubaiDesert, NightSite, SkyCanvas, StudioDark } from "./world";
import { Big, GlassCard, HeatCard, PileCard, Pill, SpeedCard, Stamp, VortexCard } from "./inserts";

export type SetProps = { f: number };
const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 9) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));

const FRIEND: Outfit = { top: "#2874c9", pants: "#262b36", shoes: "#1c1f26", loose: "male" };
const GRANDMA: Outfit = { top: "#6f4b86", pants: "#262834", shoes: "#2c2e38", loose: "female" };
const WASHER: Outfit = { top: "#f5a623", pants: "#223042", shoes: "#1c2028", loose: "male" };
const WORN: V3 = [0, -0.2, 0.03];

// ───────────────────────── 1. HOOK: Grandma in cloud penthouse wearing FursuitHead -> peek from rising tower next door ─────────────────────────
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const climb = ramp(f, c.taller - 10, c.floors163 - 6, easeOut);
  const towerY = -3.4 + climb * 2.15;

  const cam: Cam = {
    pos: keys3(f, [
      [0, [-1.45, 2.05, 5.25]],
      [c.taller, [-0.25, 2.25, 6.75]],
      [c.floors163, [0.1, 2.4, 6.95]],
    ]),
    look: keys3(f, [
      [0, [-0.6, 1.05, 0.1]],
      [c.taller, [0.05, 1.25, -0.1]],
      [c.floors163, [0.05, 1.35, -0.1]],
    ]),
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} look="clouds" ao={0}>
        {/* Left: Grandma's luxury cloud balcony with pocket puh */}
        <CloudPenthouse
          p={[-0.95, 0.45, 0.35]}
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

        {/* Right: Rising skyscraper + braced steel balcony where Friend peeks across into Grandma's window */}
        <group position={[1.25, towerY, -0.25]}>
          <BurjTower p={[0, 0, 0]} scale={0.78} t={t} cutaway={0.25} />
          <group position={[-0.45, 2.75, 0.45]}>
            <RB p={[0, 0, 0]} s={[1.1, 0.12, 1.05]} r={0.02} color="#3a4a5e" metal={0.7} />
            <RB p={[0.12, -0.35, -0.32]} rot={[0, 0, 0.65]} s={[0.08, 0.85, 0.08]} r={0.01} color="#283546" metal={0.75} />
            <RB p={[0.12, -0.35, 0.32]} rot={[0, 0, 0.65]} s={[0.08, 0.85, 0.08]} r={0.01} color="#283546" metal={0.75} />
            <RB p={[-0.52, 0.42, 0]} s={[0.04, 0.04, 1.0]} r={0.01} color="#f5a623" />
            <Model file="man_a.glb" anims={LIB1} clip="Interact" t={t} p={[0, 0.06, 0]} ry={-1.45} outfit={FRIEND} tint={{ Hair: "#161616" }} />
          </group>
        </group>
      </SkyCanvas>
      <Pill o={fadeIn(f, c.peek)} value="PEEK IN HER WINDOW" label="BUILD TALLER NEXT DOOR" top={195} color="#ffd23f" />
    </AbsoluteFill>
  );
};

// ───────────────────────── 2. FOUNDATION: 163 floors on desert sand -> zero bedrock -> 192 friction piles ─────────────────────────
export const SetFoundation: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const arrows = ramp(f, c.piles192, c.piles192 + 12, easeOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.floors163, [0.45, 0.72, 6.15]],
      [c.noBedrock, [0.35, -0.18, 6.25]],
      [c.piles192, [0.3, -0.45, 6.2]],
      [c.deg50, [-0.15, -0.5, 6.15]],
    ]),
    look: keys3(f, [
      [c.floors163, [0, 0.15, 0]],
      [c.noBedrock, [0, -0.95, 0]],
      [c.deg50, [0, -1.15, 0]],
    ]),
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} look="underground" ao={0.85}>
        <FrictionPilesCutaway p={[0, 0.3, 0]} scale={0.94} t={t} arrows={arrows} />
      </SkyCanvas>
      <PileCard f={f} at={c.floors163} pileAt={c.piles192} until={c.deg50} />
      <Stamp f={f} at={c.friction} text="FRICTION ONLY" top={1320} color="#ffd23f" size={82} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. NIGHT ICE CONCRETE: 50C heat cracks -> ban daytime pours -> night ice + high-pressure pump ─────────────────────────
export const SetNightIce: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const nightMode = f >= c.banDay;
  const cam: Cam = {
    pos: keys3(f, [
      [c.deg50, [0.1, 2.1, 7.0]],
      [c.banDay, [-0.12, 2.15, 7.15]],
      [c.m828, [-0.28, 2.2, 7.2]],
    ]),
    look: [-0.12, 1.08, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} look={nightMode ? "nightsite" : "dayheat"} ao={0.75}>
        <NightSite>
          <IceConcreteMixer p={[0, 0, 0]} scale={0.95} t={t} hotCrack={nightMode ? 0 : 1} />
        </NightSite>
      </SkyCanvas>
      <HeatCard f={f} at={c.deg50} iceAt={c.banDay} until={c.m828} />
      <Stamp f={f} at={c.crushedIce} text="NIGHT POURS ONLY" top={1320} color="#4ceeff" size={76} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. WIND VORTEX: Straight shaking guitar-string tower -> 27-setback Y breaks vortices ─────────────────────────
export const SetWind: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const yShape = f >= c.gaslight ? 1 : 0;
  const cam: Cam = {
    pos: keys3(f, [
      [c.m828, [0.25, 1.95, 5.4]],
      [c.gaslight, [0.0, 1.9, 5.2]],
      [c.tipSways, [-0.45, 1.85, 5.15]],
    ]),
    look: [0, 1.1, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} look="studio" ao={0.8}>
        <StudioDark spotI={26}>
          <WindVortexTunnel p={[0, 0.25, 0]} scale={0.95} t={t} yShape={yShape} />
        </StudioDark>
      </SkyCanvas>
      <VortexCard f={f} at={c.m828} yAt={c.gaslight} until={c.tipSways} />
      <Stamp f={f} at={c.giantY} text="WIND GASLIT" top={1320} color="#5dfc8d" size={84} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. TIP SWAY: Macro upper spire flexing ~2 m / 6.5 ft in high storm winds ─────────────────────────
export const SetSway: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.tipSways, [0.4, 1.5, 4.4]],
      [c.elevators, [-0.2, 1.65, 4.6]],
    ]),
    look: [0, 1.45, 0],
    fov: 44,
  };

  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} look="nightsite" ao={0}>
        {/* High-altitude clouds brushing past the upper pinnacle */}
        {[
          [-1.8, 0.6, -2.5],
          [1.6, 1.2, -3.2],
          [-0.9, 2.1, -3.8],
        ].map(([cx, cy, cz], i) => (
          <mesh key={i} position={[cx + ((t * 0.7 + i) % 3) - 1.5, cy, cz]} scale={[1.6, 0.35, 0.9]}>
            <sphereGeometry args={[0.85, 12, 10]} />
            <meshStandardMaterial color="#3c526e" roughness={0.95} transparent opacity={0.55} />
          </mesh>
        ))}
        {/* Shift BurjTower down so the upper tiers & steel spire fill center frame cleanly */}
        <BurjTower p={[0, -5.5, 0]} scale={1.15} t={t} sway={1.0} />
      </SkyCanvas>
      <Pill o={fadeIn(f, c.tipSways)} value="2 m · 6.5 ft" label="STORM TIP SWAY" top={195} color="#ffd23f" />
    </AbsoluteFill>
  );
};

// ───────────────────────── 6. ELEVATORS: Double-deck 36 km/h cutaway glass express shaft ─────────────────────────
export const SetElevator: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const lift = ramp(f, c.elevators, c.glass24k - 4, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.elevators, [0.65, 0.65, 4.65]],
      [c.glass24k, [-0.2, 1.65, 4.75]],
    ]),
    look: [0, 0.35 + lift * 0.85, 0],
    fov: 45,
  };

  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} look="studio" ao={0.75}>
        <StudioDark spotI={28}>
          <DoubleDeckElevator p={[0, 0.35, 0]} scale={0.96} t={t} lift={lift} />
        </StudioDark>
      </SkyCanvas>
      <SpeedCard f={f} at={c.elevators} until={c.glass24k} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 7. WASHERS: 24,348 panels BMU cradle cleaning 3 months -> top dirty again ─────────────────────────
export const SetWashers: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const progress = ramp(f, c.glass24k, c.congrats - 6, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.glass24k, [0.35, 1.75, 4.9]],
      [c.topDirty, [-0.25, 1.35, 5.05]],
      [c.congrats, [-0.15, 1.45, 5.1]],
    ]),
    look: keys3(f, [
      [c.glass24k, [0, 0.9, 0]],
      [c.topDirty, [0, 0.45, 0]],
      [c.congrats, [0, 0.75, 0]],
    ]),
    fov: 45,
  };

  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} look="clouds" ao={0}>
        <WindowWasherCradle
          p={[0, 0.15, 0]}
          scale={0.94}
          t={t}
          progress={progress}
          washer={<Model file="man_b.glb" anims={LIB1} clip="Interact" t={t} scale={0.45} outfit={WASHER} tint={{ Hair: "#201a16" }} />}
        />
      </SkyCanvas>
      <GlassCard f={f} at={c.glass24k} until={c.congrats} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 8. PAYOFF & FOLLOW LOOP: Full 828 m Burj Khalifa + Cloud Penthouse + FollowPill below ─────────────────────────
export const SetPayoff: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [1.55, 3.25, 9.8]],
      [c.burjKhalifa, [0.35, 3.55, 10.2]],
      [c.end, [-0.35, 3.65, 10.4]],
    ]),
    look: [-0.2, 3.05, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <SkyCanvas cam={cam} look="clouds" ao={0}>
        <DubaiDesert t={t}>
          <BurjTower p={[0.35, 0.04, 0]} scale={0.95} t={t} sway={0.25} />
          {/* Grandma cheering/dancing on her cloud penthouse balcony right next to upper tiers */}
          <CloudPenthouse
            p={[-1.9, 3.55, 0.35]}
            ry={0.32}
            scale={0.56}
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
          {/* Friend standing proudly on left travertine plaza clear of FollowPill cheering upward */}
          <Model file="man_a.glb" anims={LIB2} clip="Yes" t={t} p={[-1.45, 0.05, 1.65]} ry={0.55} scale={0.72} outfit={FRIEND} tint={{ Hair: "#161616" }} />
        </DubaiDesert>
      </SkyCanvas>
      {f >= c.burjKhalifa && f < c.end - 16 ? <Big x={540} y={240} text="THE BURJ KHALIFA" o={pop(f, c.burjKhalifa)} color="#ffd23f" size={88} /> : null}
      <FollowPill f={f} at={c.follow} until={c.end - 16} top={1400} />
    </AbsoluteFill>
  );
};
