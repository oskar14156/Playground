import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam, V3 } from "../../lib/three/core";
import { MiniSub, SubProps } from "../../lib/three/MiniSub";
import { Plush } from "../../lib/three/Plush";
import { RagDoll } from "../../lib/three/RagDoll";
import { CRANE_TIP, WorkBoat } from "../../lib/three/WorkBoat";
import { Model } from "../../lib/three/gltf";
import { bedY, OceanCanvas, Jelly } from "../submarine/ocean";

// Look-dev for the submarine reel: one configuration per frame (scripts/stills.sh sub-lab 0 1 2 …).
export const SUB_LAB_DURATION = 20;

type Shot = { cam: Cam; sub?: SubProps & { p: V3; ry?: number }; boat?: boolean; plush?: V3; dark?: number };
const SHOTS: Shot[] = [
  { cam: { pos: [2, 4, 40], look: [0, -4, 0], fov: 40 }, boat: true },
  { cam: { pos: [-1, 1.5, 14], look: [-1.5, 0.5, 0], fov: 40 }, boat: true },
  { cam: { pos: [-4, -16, 14], look: [-5.4, -18, 0], fov: 35 }, boat: false, sub: { p: [-5.4, -18, 0], stretch: 0, paint: 0 } },
  { cam: { pos: [3, -40, 12], look: [0, -40, 0], fov: 38 }, sub: { p: [0, -40, 0], stretch: 0.5, paint: 0.5, tanks: 1, fill: 0.5 } },
  { cam: { pos: [6, -78, 13], look: [0, -80, 0], fov: 40 }, sub: { p: [0, -80, 0], ry: 0.3, stretch: 1, paint: 1, tanks: 1, fill: 0.3, lights: 1 } },
  { cam: { pos: [-7, -118, 12], look: [0, -120, 0], fov: 40 }, sub: { p: [0, -120, 0], ry: -0.4, stretch: 1, paint: 1, tanks: 1, fill: 1, lights: 1, blow: 1 } },
  { cam: { pos: [0, -199, 9], look: [0, -200, 0], fov: 40 }, sub: { p: [0, -200, 0], stretch: 1, paint: 1, tanks: 1, xray: 1, lights: 1 } },
  { cam: { pos: [10, -294, 14], look: [6, -298.5, 0], fov: 40 }, sub: { p: [1, -297, 0], stretch: 1, paint: 1, tanks: 1, lights: 1, arm: 1, claw: 0.3 }, plush: [6, 0, 0], dark: 0.8 },
  { cam: { pos: [8, -58, 14], look: [0, -60, 0], fov: 40 }, sub: { p: [0, -60, 0], ry: 0.5, stretch: 1, paint: 1, tanks: 1, lights: 1, reactor: 1 } },
  { cam: { pos: [12, -1, 16], look: [0, -1, 0], fov: 40 }, boat: true, sub: { p: [-1, -0.6, 2.4], stretch: 1, paint: 1, tanks: 1, hatch: 1 } },
  { cam: { pos: [0, -120, 60], look: [0, -150, 0], fov: 40 }, boat: true, plush: [6, 0, 0] },
  { cam: { pos: [3, -297, 9], look: [5, -299.2, 0], fov: 35 }, plush: [6, 0, 0] },
];

export const SubLab: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= 12) {
    // rag doll look-dev: angles and poses
    const k = f - 12;
    const views: { cam: Cam; sit?: number; limp?: number; dance?: number; wave?: number; ry?: number; rz?: number; t?: number }[] = [
      { cam: { pos: [0, 1.2, 4.2], look: [0, 0.95, 0], fov: 35 } },
      { cam: { pos: [3.6, 1.4, 2.0], look: [0, 0.9, 0], fov: 35 } },
      { cam: { pos: [-1.8, 1.3, -3.6], look: [0, 0.9, 0], fov: 35 } },
      { cam: { pos: [0.4, 1.6, 1.8], look: [0, 1.45, 0], fov: 30 } },
      { cam: { pos: [1.5, 1.2, 3.8], look: [0, 0.6, 0], fov: 35 }, sit: 1 },
      { cam: { pos: [0, 1.2, 4.2], look: [0, 0.95, 0], fov: 35 }, dance: 1, t: 0.2 },
      { cam: { pos: [0, 1.2, 4.2], look: [0, 0.95, 0], fov: 35 }, dance: 1, t: 0.65 },
      { cam: { pos: [1.2, 1.4, 4.0], look: [0, 0.6, 0], fov: 35 }, limp: 1, rz: 1.25 },
    ];
    const v = views[Math.min(k, views.length - 1)];
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <OceanCanvas cam={{ pos: [v.cam.pos[0], v.cam.pos[1] + 0.75, v.cam.pos[2] + 1], look: [v.cam.look[0], v.cam.look[1] + 0.75, v.cam.look[2] + 1], fov: v.cam.fov }} t={1} lines={0} fish={false}>
          <WorkBoat p={[0.6, 0, -1]} />
          <group position={[0, 0.75 + (v.rz ? 0.3 : 0), 1]} rotation={[0, 0, v.rz ?? 0]}>
            <RagDoll t={v.t ?? 1} sit={v.sit} limp={v.limp} dance={v.dance} wave={v.wave} />
          </group>
        </OceanCanvas>
      </AbsoluteFill>
    );
  }
  const s = SHOTS[Math.min(f, SHOTS.length - 1)];
  const t = 2 + f * 0.37;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OceanCanvas cam={s.cam} t={t} dark={s.dark ?? 0}>
        {s.boat ? <WorkBoat p={[0, 0, 0]} /> : null}
        {s.boat ? <Model file="man_b.glb" anims="ual/ual1_ue.glb" clip="Idle_Talking_Loop" t={t} p={[-1.5, 0.75, 0.4]} ry={Math.PI / 2} outfit={{ top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" }} tint={{ Hair: "#1a1a1a" }} /> : null}
        {s.sub ? (
          <group position={s.sub.p} rotation={[0, s.sub.ry ?? 0, 0]}>
            <MiniSub {...s.sub} t={t} />
          </group>
        ) : null}
        {f === 2 ? <mesh position={[CRANE_TIP[0], (CRANE_TIP[1] - 18 + 0.9) / 2, 0]}><cylinderGeometry args={[0.03, 0.03, CRANE_TIP[1] + 18 - 0.9, 6]} /><meshStandardMaterial color="#c9c9c9" metalness={0.8} roughness={0.3} /></mesh> : null}
        {s.plush ? (
          <group position={[s.plush[0], bedY(s.plush[0], 0), 0]} rotation={[0, 0, 1.2]}>
            <Plush s={0.85} t={t} />
          </group>
        ) : null}
        {f >= 6 ? <Jelly p={[-4, -205, -6]} t={t} /> : null}
      </OceanCanvas>
    </AbsoluteFill>
  );
};
