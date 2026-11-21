import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Cam } from "../../lib/three/core";
import { Model } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { WorkBoat } from "../../lib/three/WorkBoat";
import { OceanCanvas } from "../submarine/ocean";

// Look-dev for the fursuit head: 0–3 angles on the deck, 4 bone axes, 5–7 worn by the friend (idle / dance).
export const FURSUIT_LAB_DURATION = 8;
const AXES = (
  <group>
    {[
      ["#ff0000", [0.15, 0, 0], [0, 0, -Math.PI / 2]],
      ["#00ff00", [0, 0.15, 0], [0, 0, 0]],
      ["#0000ff", [0, 0, 0.15], [Math.PI / 2, 0, 0]],
    ].map(([c, p, r], i) => (
      <mesh key={i} position={p as [number, number, number]} rotation={r as [number, number, number]}>
        <cylinderGeometry args={[0.01, 0.01, 0.3, 6]} />
        <meshBasicMaterial color={c as string} />
      </mesh>
    ))}
  </group>
);

export const FursuitLab: React.FC = () => {
  const f = useCurrentFrame();
  const angles: Cam[] = [
    { pos: [-1.45, 1.35, 2.2], look: [-1.45, 1.1, 0.25], fov: 35 },
    { pos: [-0.4, 1.4, 1.9], look: [-1.45, 1.1, 0.25], fov: 35 },
    { pos: [-0.2, 1.25, 0.25], look: [-1.45, 1.1, 0.25], fov: 35 },
    { pos: [-2.6, 1.7, -1.8], look: [-1.45, 1.2, 0.25], fov: 35 },
  ];
  const worn = f >= 4;
  const cam: Cam = worn ? { pos: [-0.3, 1.9, 3.4], look: [-0.4, 1.55, 0.2], fov: 38 } : angles[f];
  const dance = f >= 6;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OceanCanvas cam={cam} t={1} lines={0} fish={false}>
        <WorkBoat p={[0, 0, 0]} />
        {!worn ? <FursuitHead p={[-1.45, 0.75, 0.25]} s={0.5} ry={0} t={1} /> : null}
        <Model
          file="man_b.glb"
          anims="ual/ual1_ue.glb"
          clip={dance ? "Dance_Loop" : "Idle_Loop"}
          t={f === 7 ? 1.1 : 0.4}
          p={[-0.42, 0.75, 0.2]}
          ry={0}
          outfit={{ top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" }}
          tint={{ Hair: "#1a1a1a" }}
          attach={worn ? { bone: "Head", node: f === 4 ? AXES : <group><FursuitHead s={0.5} t={1} dance={dance ? 1 : 0} p={[0, -0.2, 0.03]} /></group> } : undefined}
        />
      </OceanCanvas>
    </AbsoluteFill>
  );
};
