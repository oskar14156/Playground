import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { FursuitHead } from "../../lib/three/Mascots";
import { Capsule, ISS, LaunchPad, Rocket } from "../../lib/three/Space";
import { WorkBoat } from "../../lib/three/WorkBoat";
import { FarEarth, SkyCanvas, SpaceCanvas } from "../rocket/world";
import { Model } from "../../lib/three/gltf";
import { FishbowlHelmet, Ladder, Skateboard, Sandwich, Columbiad } from "../rocket/props";

// Look-dev for the rocket reel (scripts/stills.sh rocket-lab 0 1 2 …).
export const ROCKET_LAB_DURATION = 15;
const PAD: [number, number, number] = [60, 0, -30];
const R_E = 6371000;

export const RocketLab: React.FC = () => {
  const f = useCurrentFrame();
  const t = 1 + f * 0.3;
  if (f <= 4) {
    const shots: { cam: Cam; km: number }[] = [
      { cam: { pos: [20, 18, 95], look: [48, 22, -30], fov: 40 }, km: 0 },
      { cam: { pos: [PAD[0] + 14, 22, -2], look: [PAD[0], 22, PAD[2]], fov: 45 }, km: 0 },
      { cam: { pos: [PAD[0] + 40, 12000 + 10, PAD[2] + 60], look: [PAD[0], 12000 + 18, PAD[2]], fov: 40 }, km: 12 },
      { cam: { pos: [PAD[0] + 30, 40, PAD[2] + 60], look: [PAD[0], 25, PAD[2]], fov: 40 }, km: 0 },
      { cam: { pos: [PAD[0] + 16, 70000 + 4, PAD[2] + 22], look: [PAD[0], 70000, PAD[2]], fov: 40 }, km: 70 },
    ];
    const s = shots[f];
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <SkyCanvas cam={s.cam} t={t} km={s.km} sea={s.km < 30}>
          {f <= 1 ? <WorkBoat p={[0, 0, 0]} /> : null}
          {f <= 1 ? (
            <group position={PAD}>
              <LaunchPad />
              <group position={[0, 3.2, 0]}>
                <Rocket t={t} xray={f === 1 ? 1 : 0} fuel1={0.9} fuel2={1} />
              </group>
            </group>
          ) : null}
          {f === 2 ? (
            <group position={[PAD[0], 12000, PAD[2]]} rotation={[0, 0, -0.35]}>
              <Rocket t={t} flame1={0} flame2={1} sep1={9} tumble1={0.5} />
            </group>
          ) : null}
          {f === 3 ? (
            <group position={[PAD[0], 4, PAD[2]]}>
              <Capsule t={t} chutes={1} />
            </group>
          ) : null}
          {f === 4 ? (
            <group position={[PAD[0], 70000, PAD[2]]} rotation={[0.5, 0, 0.4]}>
              <Capsule t={t} heat={1} ablate={0.4} />
            </group>
          ) : null}
        </SkyCanvas>
      </AbsoluteFill>
    );
  }
  if (f >= 11) {
    // 11–12 ladder climb clip, 13 pancake + cannon, 14 skateboard + helmet + sandwich
    const cam: Cam = f <= 12 ? { pos: [2.6, 2.0, 4.2], look: [0, 1.4, 0], fov: 40 } : f === 13 ? { pos: [4, 3, 12], look: [0, 3, 0], fov: 40 } : { pos: [2.2, 1.4, 3.6], look: [0, 1.0, 0], fov: 40 };
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <SkyCanvas cam={cam} t={t} km={0} sea>
          <mesh position={[0, -0.02, 0]} receiveShadow>
            <boxGeometry args={[30, 0.04, 30]} />
            <meshStandardMaterial color="#b7b3ab" roughness={0.95} />
          </mesh>
          {f <= 12 ? (
            <group>
              <group position={[0, 0, -0.45]}>
                <Ladder h={8} around={2} />
              </group>
              <Model file="man_a.glb" anims="ual/ual2.glb" clip="ClimbUp_1m_RM" t={f === 11 ? 0.3 : 0.8} p={[0, 0.3, 0]} ry={Math.PI} outfit={{ top: "#e8573a", pants: "#2c3440", shoes: "#f2f2f2" }} tint={{ Hair: "#3b2a1e" }} />
            </group>
          ) : null}
          {f === 13 ? (
            <group>
              <group position={[-4, 0, -2]} scale={[0.4, 0.4, 0.4]}>
                <Columbiad />
              </group>
              <group position={[1, 0.05, 1]} rotation={[-Math.PI / 2, 0, 0.4]} scale={[1.25, 1.25, 0.12]}>
                <Model file="man_a.glb" anims="ual/ual1_ue.glb" clip="Idle_Loop" t={0.2} outfit={{ top: "#e8573a", pants: "#2c3440", shoes: "#f2f2f2" }} tint={{ Hair: "#3b2a1e" }} />
              </group>
            </group>
          ) : null}
          {f === 14 ? (
            <group>
              <Skateboard />
              <Model file="man_a.glb" anims="ual/ual2.glb" clip="OverhandThrow" t={0.5} p={[0, 0.15, 0]} ry={-Math.PI / 2} outfit={{ top: "#e8573a", pants: "#2c3440", shoes: "#f2f2f2" }} tint={{ Hair: "#3b2a1e" }} attach={{ bone: "Head", node: <FishbowlHelmet /> }} />
              <Sandwich p={[0.9, 1.4, 0.4]} burst={0} t={t} />
              <Sandwich p={[1.2, 0.9, -0.4]} burst={0.4} t={t} />
            </group>
          ) : null}
        </SkyCanvas>
      </AbsoluteFill>
    );
  }
  if (f >= 9) {
    const cam: Cam = { pos: [6, 2, 14], look: [0, 1.5, 0], fov: 40 };
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <SpaceCanvas cam={cam} t={t}>
          {f === 10 ? <FarEarth cam={cam} center={[0, -(R_E + 400000), 0]} /> : <Capsule t={t} />}
        </SpaceCanvas>
      </AbsoluteFill>
    );
  }
  const shots: Cam[] = [
    { pos: [70, 30, 120], look: [0, 0, 0], fov: 40 },
    { pos: [-38, 6, 30], look: [-44, 2, 26], fov: 35 },
    { pos: [0, 300000, 1400000], look: [0, -200000, 0], fov: 40 },
    { pos: [6, 2, 14], look: [0, 1.5, 0], fov: 40 },
  ];
  const cam = shots[f - 5];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <SpaceCanvas cam={cam} t={t}>
        <FarEarth cam={cam} center={[0, -(R_E + 400000), 0]} spin={1.2} clouds={0.1} />
        {f <= 7 ? (
          <ISS>
            {/* the mask, stuck on a solar panel */}
            <group position={[-44, 0.3, 26]} rotation={[0.2, 0.6, 0.3]}>
              <FursuitHead s={0.5} t={t} />
            </group>
          </ISS>
        ) : (
          <Capsule t={t} />
        )}
      </SpaceCanvas>
    </AbsoluteFill>
  );
};
