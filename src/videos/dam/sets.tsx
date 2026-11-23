import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { FollowPill } from "../../lib/Follow";
import { easeInOut, easeOut, keys3, ramp } from "../../lib/timing";
import { c } from "./cues";
import { CanyonTunnelsCutaway, DamCoolingMatrix, HooverArchWall, TurbineBayCutaway } from "./props";
import { BlackCanyonWorld, DamCanvas, FloodedBackyard, StudioDark } from "./world";
import { ArchCard, Big, CoolCard, Pill, Stamp, TunnelCard, TurbineCard } from "./inserts";

export type SetProps = { f: number };
const LIB1 = "ual/ual1_ue.glb";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 9) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));

const FRIEND: Outfit = { top: "#2874c9", pants: "#262b36", shoes: "#1c1f26", loose: "male" };
const WORN: V3 = [0, -0.2, 0.03];

// ───────────────────────── 1. HOOK: Backyard kiddie pool bursts and floods entire desert canyon ─────────────────────────
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [0, [-1.05, 3.05, 6.2]],
      [c.flooded, [-0.15, 3.25, 7.1]],
      [c.wetConcrete, [0.35, 3.4, 7.5]],
    ]),
    look: [-0.25, 1.05, 0.2],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="yard" ao={0}>
        <FloodedBackyard t={t}>
          <Model
            file="man_a.glb"
            anims={LIB1}
            clip="Interact"
            t={t}
            p={[-0.95, 1.5, 0.72]}
            ry={0.5}
            scale={0.76}
            outfit={FRIEND}
            tint={{ Hair: "#161616" }}
            attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
          />
        </FloodedBackyard>
      </DamCanvas>
      <Pill o={fadeIn(f, c.flooded)} value="STOP THE RIVER" label="FLOODED BLACK CANYON" top={195} color="#ffd23f" />
    </AbsoluteFill>
  );
};

// ───────────────────────── 2. DIVERSION TUNNELS: Blast 4 x 17m bypass tunnels through canyon rock ─────────────────────────
export const SetDiversionTunnels: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const divert = ramp(f, c.fourTunnels, c.reroute + 10, easeInOut);
  const cam: Cam = {
    pos: keys3(f, [
      [c.wetConcrete, [0.4, 3.45, 7.5]],
      [c.reroute, [-0.35, 3.55, 7.6]],
    ]),
    look: [0, 0.55, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="studio" ao={0.8}>
        <StudioDark spotI={26}>
          <CanyonTunnelsCutaway p={[0, 0, 0]} scale={0.96} t={t} divert={divert} />
        </StudioDark>
      </DamCanvas>
      <TunnelCard f={f} at={c.wetConcrete} until={c.tall221} />
      <Stamp f={f} at={c.reroute} text="RIVER REROUTED" top={1320} color="#4ceeff" size={82} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. ARCH WEDGE: Flat snapping wall -> 221 m curved arch-gravity wedge ─────────────────────────
export const SetArchWedge: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const archOn = f >= c.giantArch;
  const cam: Cam = {
    pos: keys3(f, [
      [c.tall221, [0.55, 2.3, 5.8]],
      [c.giantArch, [0.25, 2.45, 5.8]],
      [c.yrs125, [-0.45, 2.55, 5.9]],
    ]),
    look: [0, 1.3, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="canyon" ao={0}>
        <BlackCanyonWorld t={t} dammed>
          <HooverArchWall p={[0, 0, 0]} scale={0.96} t={t} archMode={archOn ? 1 : 0} />
        </BlackCanyonWorld>
      </DamCanvas>
      <ArchCard f={f} at={c.tall221} archAt={c.giantArch} until={c.yrs125} />
      <Stamp f={f} at={c.base200} text="ARCH WEDGED ✓" top={1320} color="#5dfc8d" size={84} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. COOLING PIPES: 125-yr cracked monolith -> Lego blocks + 930 km ice pipes ─────────────────────────
export const SetCoolingBlocks: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const legoCool = f >= c.legoBlocks ? 1 : 0;
  const cam: Cam = {
    pos: keys3(f, [
      [c.yrs125, [-1.4, 2.45, 6.2]],
      [c.legoBlocks, [-0.75, 2.4, 5.95]],
      [c.turbines17, [0.35, 2.3, 5.75]],
    ]),
    look: [-0.2, 0.95, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look="studio" ao={0.8}>
        <StudioDark spotColor={legoCool ? "#5ceeff" : "#ff6b38"} spotI={28}>
          <DamCoolingMatrix p={[0, 0, 0]} scale={0.96} t={t} legoCool={legoCool} />
        </StudioDark>
      </DamCanvas>
      <CoolCard f={f} at={c.yrs125} pipeAt={c.legoBlocks} until={c.turbines17} />
      <Stamp f={f} at={c.grout} text="ICE GROUTED ✓" top={1320} color="#5ceeff" size={84} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. TURBINES & PAYOFF: 17 turbines (2,080 MW) -> full Hoover Dam + Friend on crest road ─────────────────────────
export const SetPayoff: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const fullView = f >= c.congrats;
  const cam: Cam = fullView
    ? {
        pos: keys3(f, [
          [c.congrats, [0.45, 2.9, 7.6]],
          [c.hooverDam, [-0.15, 3.0, 7.75]],
          [c.end, [-0.45, 3.05, 7.85]],
        ]),
        look: [0, 1.8, 0],
        fov: 46,
      }
    : {
        pos: keys3(f, [
          [c.turbines17, [0.45, 1.7, 4.95]],
          [c.congrats, [-0.25, 1.8, 5.05]],
        ]),
        look: [0, 0.65, 0],
        fov: 46,
      };

  return (
    <AbsoluteFill>
      <DamCanvas cam={cam} look={fullView ? "canyon" : "turbine"} ao={fullView ? 0 : 0.8}>
        {!fullView ? (
          <StudioDark spotI={26}>
            <TurbineBayCutaway p={[0, 0, 0]} scale={0.95} t={t} />
          </StudioDark>
        ) : (
          <BlackCanyonWorld t={t} dammed>
            <HooverArchWall p={[0, 0, 0]} scale={0.98} t={t} archMode={1} />
            <Model
              file="man_a.glb"
              anims={LIB1}
              clip="Dance_Loop"
              t={t}
              p={[0, 2.38, -0.52]}
              ry={0.15}
              scale={0.62}
              outfit={FRIEND}
              tint={{ Hair: "#161616" }}
              attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
            />
          </BlackCanyonWorld>
        )}
      </DamCanvas>
      <TurbineCard f={f} at={c.turbines17} until={c.congrats} />
      {f >= c.hooverDam && f < c.end - 16 ? <Big x={540} y={240} text="THE HOOVER DAM" o={pop(f, c.hooverDam)} color="#ffd23f" size={94} /> : null}
      <FollowPill f={f} at={c.follow} until={c.end - 16} top={1400} />
    </AbsoluteFill>
  );
};
