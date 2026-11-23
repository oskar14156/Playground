import React from "react";
import { AbsoluteFill } from "remotion";
import { Cam, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { FollowPill } from "../../lib/Follow";
import { easeInOut, easeOut, keys3, ramp } from "../../lib/timing";
import { c } from "./cues";
import { A1BReactorPair, ArrestingGearBay, CarrierHull333m, EmalsTrackCutaway, FighterJet } from "./props";
import { AirportTarmac, CarrierCanvas, OpenOcean, StudioDark } from "./world";
import { Big, CatchCard, LaunchCard, Pill, ReactorCard, Stamp } from "./inserts";

export type SetProps = { f: number };
const LIB2 = "ual/ual2.glb";

const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const pop = (f: number, a: number, d = 9) => ramp(f, a, a + d, (x) => 1 - Math.pow(1 - x, 3) * Math.cos(x * 4.5));

const FRIEND: Outfit = { top: "#2874c9", pants: "#262b36", shoes: "#1c1f26", loose: "male" };
const WORN: V3 = [0, -0.2, 0.03];

// ───────────────────────── 1. HOOK: Banned at tarmac -> build floating 333m steel airport on ocean ─────────────────────────
export const SetHook: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const atOcean = f >= c.floating;
  const cam: Cam = atOcean
    ? {
        pos: keys3(f, [
          [c.floating, [3.4, 3.2, 9.2]],
          [c.t100k, [2.6, 2.9, 8.6]],
        ]),
        look: [0, 0.5, 0],
        fov: 46,
      }
    : {
        pos: keys3(f, [
          [0, [0.35, 1.95, 4.45]],
          [c.floating, [0.05, 2.05, 4.7]],
        ]),
        look: [0, 1.05, -0.35],
        fov: 46,
      };

  return (
    <AbsoluteFill>
      <CarrierCanvas cam={cam} look={atOcean ? "daysea" : "tarmac"} ao={atOcean ? 0 : 0.8}>
        {!atOcean ? (
          <AirportTarmac>
            <Model
              file="man_a.glb"
              anims={LIB2}
              clip="Idle_No_Loop"
              t={t}
              p={[-0.35, 0, 0.45]}
              ry={0.25}
              outfit={FRIEND}
              tint={{ Hair: "#161616" }}
              attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
            />
          </AirportTarmac>
        ) : (
          <OpenOcean t={t} day>
            <CarrierHull333m p={[0, 0, 0]} ry={-0.65} scale={0.74} t={t} />
          </OpenOcean>
        )}
      </CarrierCanvas>
      <Pill o={fadeIn(f, c.floating)} value="FLOATING AIRPORT" label="333 m · 1,092 ft STEEL" top={195} color="#ffd23f" />
    </AbsoluteFill>
  );
};

// ───────────────────────── 2. DECK & EMALS: 333 m ship overview -> sub-deck electromagnetic rail catapult ─────────────────────────
export const SetEmalsLaunch: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const emalsOn = f >= c.electromagnetic;
  const launch = ramp(f, c.electromagnetic, c.threeCables - 6, easeInOut);

  const cam: Cam = emalsOn
    ? {
        pos: keys3(f, [
          [c.electromagnetic, [-1.15 + launch * 2.4, 2.15, 5.85]],
          [c.kph240, [-0.5 + launch * 2.2, 2.2, 5.95]],
          [c.threeCables, [0.8 + launch * 1.4, 2.35, 6.1]],
        ]),
        look: [-1.4 + launch * 3.1, 0.45, 0],
        fov: 46,
      }
    : {
        pos: keys3(f, [
          [c.t100k, [3.4, 3.2, 9.1]],
          [c.electromagnetic, [2.4, 2.9, 8.4]],
        ]),
        look: [0, 0.5, 0],
        fov: 46,
      };

  return (
    <AbsoluteFill>
      <CarrierCanvas cam={cam} look={emalsOn ? "studio" : "daysea"} ao={emalsOn ? 0.8 : 0}>
        {!emalsOn ? (
          <OpenOcean t={t} day>
            <CarrierHull333m p={[0, 0, 0]} ry={-0.65} scale={0.74} t={t} />
          </OpenOcean>
        ) : (
          <StudioDark spotI={28}>
            <EmalsTrackCutaway p={[0, 0.1, 0]} scale={0.82} t={t} progress={launch} />
          </StudioDark>
        )}
      </CarrierCanvas>
      <LaunchCard f={f} at={c.t100k} emalsAt={c.electromagnetic} until={c.threeCables} />
      <Stamp f={f} at={c.kph240} text="0 -> 240 km/h IN 2s" top={1320} color="#4ceeff" size={76} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 3. LANDING & AAG: 3 cables + sub-deck water turbines -> full throttle touch-and-go ─────────────────────────
export const SetArrestingGear: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const bolter = f >= c.plotTwist;
  const pull = bolter
    ? ramp(f, c.plotTwist, c.reactors - 6, easeInOut)
    : ramp(f, c.threeCables, c.plotTwist - 4, easeInOut);

  const cam: Cam = {
    pos: keys3(f, [
      [c.threeCables, [0.45, 1.8, 6.2]],
      [c.plotTwist, [0.25, 1.9, 6.25]],
      [c.reactors, [-0.35, 2.0, 6.3]],
    ]),
    look: [0, 0.35, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <CarrierCanvas cam={cam} look="studio" ao={0.8}>
        <StudioDark spotI={26}>
          <ArrestingGearBay p={[0, 0.35, 0]} scale={0.84} t={t} pull={pull} bolter={bolter ? 1 : 0} />
        </StudioDark>
      </CarrierCanvas>
      <CatchCard f={f} at={c.threeCables} bolterAt={c.plotTwist} until={c.reactors} />
      <Stamp f={f} at={c.fullThrottle} text="FULL THROTTLE LANDING" top={1320} color="#ff9b42" size={72} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 4. NUCLEAR REACTORS: Hull cutaway x-ray exposing twin A1B reactors (25 yrs) ─────────────────────────
export const SetReactorCore: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.reactors, [0.45, 1.95, 6.1]],
      [c.congrats, [-0.45, 2.0, 6.15]],
    ]),
    look: [0, 0.65, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <CarrierCanvas cam={cam} look="studio" ao={0.8}>
        <StudioDark spotColor="#44eeff" spotI={28}>
          <A1BReactorPair p={[0, 0.15, 0]} scale={0.98} t={t} />
        </StudioDark>
      </CarrierCanvas>
      <ReactorCard f={f} at={c.reactors} until={c.congrats} />
      <Stamp f={f} at={c.years25} text="25 YRS NO FUEL" top={1320} color="#5dfc8d" size={82} />
    </AbsoluteFill>
  );
};

// ───────────────────────── 5. PAYOFF: Floating nuclear city sailing cleanly with Friend on Island + FollowPill below ─────────────────────────
export const SetPayoff: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const jetFly = -3.2 + ((t * 2.2) % 7);
  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [3.4, 3.2, 9.1]],
      [c.carrier, [2.6, 3.25, 9.2]],
      [c.end, [1.8, 3.3, 9.3]],
    ]),
    look: [0, 0.6, 0],
    fov: 46,
  };

  return (
    <AbsoluteFill>
      <CarrierCanvas cam={cam} look="daysea" ao={0}>
        <OpenOcean t={t} day>
          <CarrierHull333m
            p={[0, 0, 0]}
            ry={-0.65}
            scale={0.74}
            t={t}
            hero={
              <Model
                file="man_a.glb"
                anims={LIB2}
                clip="Yes"
                t={t}
                scale={0.44}
                outfit={FRIEND}
                tint={{ Hair: "#161616" }}
                attach={{ bone: "Head", node: <FursuitHead p={WORN} s={0.5} /> }}
              />
            }
          />
          <FighterJet p={[jetFly, 2.25, -1.6]} rot={[0, -0.25, 0.22]} scale={0.78} afterburner={0.9} />
        </OpenOcean>
      </CarrierCanvas>
      {f >= c.carrier && f < c.end - 16 ? <Big x={540} y={240} text="AIRCRAFT CARRIER" o={pop(f, c.carrier)} color="#ffd23f" size={90} /> : null}
      <FollowPill f={f} at={c.follow} until={c.end - 16} top={1400} />
    </AbsoluteFill>
  );
};
