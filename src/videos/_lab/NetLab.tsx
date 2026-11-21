import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { Pigeon } from "../../lib/three/Pigeon";
import { Shark } from "../../lib/three/Shark";
import { CableShip, CS } from "../../lib/three/CableShip";
import { AirCanvas } from "../airplane/world";
import { Bedroom, EARTH_LAT, EARTH_LON, onEarth } from "../airplane/sets";
import { Earth } from "../../lib/three/Earth";
import { Glow } from "../../lib/three/core";
import { FRIEND_POSE, Grandma, GRANDMA_AT, PosingFriend, TRIPOD } from "../internet/sets";
import { Garden } from "../internet/props";
import { Model } from "../../lib/three/gltf";
import { c } from "../internet/cues";

// Look-dev for the internet reel (node scripts/stills_fast.mjs net-lab out/stills/netlab 0.4 0 1 2 …).
export const NET_LAB_DURATION = 24;

export const NetLab: React.FC = () => {
  const f = useCurrentFrame();
  const shots: { cam: Cam; node: React.ReactNode; ground?: "field" | "none" }[] = [
    { cam: { pos: [0.5, 0.2, 0.55], look: [0, 0.12, 0], fov: 35 }, ground: "field", node: <Pigeon t={0.2} /> },
    { cam: { pos: [-0.6, 0.35, -0.3], look: [0, 0.12, 0], fov: 35 }, ground: "field", node: <Pigeon t={0.2} card /> },
    { cam: { pos: [0.45, 0.45, -0.5], look: [0, 0.12, 0], fov: 35 }, ground: "field", node: <Pigeon t={0.2} /> },
    { cam: { pos: [0.6, 0.35, 0.6], look: [0, 0.15, 0], fov: 35 }, ground: "field", node: <Pigeon t={0.05} flap={1} card /> },
    { cam: { pos: [0.0, 0.25, 0.8], look: [0, 0.15, 0], fov: 35 }, ground: "field", node: <Pigeon t={0.12} flap={1} card /> },
    { cam: { pos: [0, 0.3, 4.2], look: [0, 0, 0], fov: 40 }, node: <Shark t={0.3} /> },
    { cam: { pos: [3.2, 0.6, 2], look: [0, 0, 0], fov: 40 }, node: <Shark t={0.6} bite={1} /> },
    { cam: { pos: [-1.5, 2.6, 1.6], look: [0, 0, 0], fov: 40 }, node: <Shark t={0.9} /> },
    { cam: { pos: [160, 40, 140], look: [0, 8, 0], fov: 35 }, node: <CableShip /> },
    { cam: { pos: [110, 20, -60], look: [CS.L / 2, 10, 0], fov: 35 }, node: <CableShip /> },
    { cam: { pos: [-140, 60, 90], look: [0, 6, 0], fov: 35 }, node: <CableShip lights={1} /> },
  ];
  // the two photos (rendered at full size and cropped to 4:5 → public/internet/photo*.jpg)
  if (f >= 15 && f <= 20) {
    // the loose-sweater outfit: grandma front / side / laughing, the friend front / side, grandma's selfie
    const G = { top: "#b07ab8", pants: "#6a5a7a", shoes: "#e8e0d8", sleeves: 0.62, loose: "female" as const };
    const F = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420", loose: "male" as const };
    const cams: Cam[] = [
      { pos: [1.4, 1.35, 4.6], look: [0.8, 1.15, 2.2], fov: 34 },
      { pos: [3.3, 1.35, 2.2], look: [0.8, 1.15, 2.2], fov: 34 },
      { pos: [2.4, 1.4, 4.2], look: [0.8, 1.15, 2.2], fov: 34 },
      { pos: [1.4, 1.35, 4.6], look: [0.8, 1.15, 2.2], fov: 34 },
      { pos: [3.3, 1.35, 2.2], look: [0.8, 1.15, 2.2], fov: 34 },
      { pos: [1.4, 1.35, 4.6], look: [0.8, 1.15, 2.2], fov: 34 },
    ];
    const i = f - 15;
    const person =
      i < 3 ? <Model file="woman_c.glb" anims="ual/ual2.glb" clip={i === 2 ? "Yes" : "Idle_Lantern_Loop"} t={1} p={GRANDMA_AT} ry={0.35} outfit={G} tint={{ Hair: "#d9d9d9" }} />
      : i < 5 ? <Model file="man_b.glb" anims="ual/ual1_ue.glb" clip="Dance_Loop" t={1.6} p={GRANDMA_AT} ry={0.35} outfit={F} tint={{ Hair: "#1a1a1a" }} />
      : <Grandma t={1.2} mode="selfie" />;
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <AirCanvas cam={cams[i]} t={0} dusk={0.15} sun={[220, 90, 60]} fog={0.6}>
          <Garden>{person}</Garden>
        </AirCanvas>
      </AbsoluteFill>
    );
  }
  if (f === 13 || f === 14) {
    const spin = f === 13 ? 0 : 1.0;
    const pts: [number, number][] = [[-34.36, 18.47], [51.5, -0.1], [-33.9, 151.2], [40.6, -73.9], [-22.9, -43.2]];
    const v = onEarth(0, 20, 1, spin).normalize().multiplyScalar(3.2);
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <AirCanvas cam={{ pos: [v.x, v.y, v.z], look: [0, 0, 0], fov: 40 }} t={0} night={1} ao={0} env={0.05}>
          <Earth r={1} lat={EARTH_LAT} lon={EARTH_LON} spin={spin} clouds={0} cover={0} sun={[v.x, v.y, v.z]} />
          {pts.map((q, i) => (
            <Glow key={i} position={onEarth(q[0], q[1], 1.01, spin)} size={0.08} color="#ff2020" />
          ))}
        </AirCanvas>
      </AbsoluteFill>
    );
  }
  if (f === 11) {
    const tPose = (c.lives - 16 - c.using) / 30 + FRIEND_POSE.at - 1.2;
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <AirCanvas cam={{ pos: [TRIPOD[0], 1.05, TRIPOD[2]], look: [-0.6, 1.3, 0.6], fov: 52 }} t={0} night={1} indoor shadow={6} ao={0.6}>
          <Bedroom t={0} friend={false} />
          <PosingFriend t={tPose} />
          <pointLight position={[0.8, 2.2, 1.5]} intensity={1.6} distance={6} color="#ffe2c0" />
          <pointLight position={[TRIPOD[0], 1.0, TRIPOD[2]]} intensity={2.5} distance={5} color="#ffffff" />
        </AirCanvas>
      </AbsoluteFill>
    );
  }
  if (f === 12) {
    const fwd: [number, number] = [Math.sin(0.35), Math.cos(0.35)];
    return (
      <AbsoluteFill style={{ background: "#000" }}>
        <AirCanvas cam={{ pos: [GRANDMA_AT[0] + fwd[0] * 1.5 + 0.15, 1.75, GRANDMA_AT[2] + fwd[1] * 1.5], look: [GRANDMA_AT[0], 1.45, GRANDMA_AT[2]], fov: 50 }} t={0} dusk={0.15} sun={[220, 90, 60]} fog={0.6}>
          <Garden>
            <Grandma t={1.2} mode="selfie" />
          </Garden>
        </AirCanvas>
      </AbsoluteFill>
    );
  }
  const s = shots[Math.min(f, shots.length - 1)];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AirCanvas cam={s.cam} t={f / 30} ground={s.ground ?? "none"} night={f === 10 ? 0.8 : 0}>
        {s.node}
      </AirCanvas>
    </AbsoluteFill>
  );
};
