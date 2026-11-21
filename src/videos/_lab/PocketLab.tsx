import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Model } from "../../lib/three/gltf";
import { Axolotl, Capybara, FoxHead, MascotProps, PlushShark, RubberDuck } from "../../lib/three/Mascots";
import { Plush } from "../../lib/three/Plush";
import { WorkBoat } from "../../lib/three/WorkBoat";
import { fonts } from "../../lib/theme";
import { OceanCanvas } from "../submarine/ocean";

// Casting sheet for the "giant pocket puh": frames 0–5 standing next to the friend, 6–11 dancing (the finale).
export const POCKET_LAB_DURATION = 12;

const Old: React.FC<MascotProps> = ({ p, ry, t, dance = 0 }) => (
  <group position={p} rotation={[0, 0, dance * Math.sin((t ?? 0) * 6.6) * 0.15]}>
    <group position={[0, dance * Math.abs(Math.sin((t ?? 0) * 6.6)) * 0.15, 0]}>
      <Plush s={0.85} t={t} ry={ry} />
    </group>
  </group>
);

const CAST: { name: string; C: React.FC<MascotProps> }[] = [
  { name: "A · CAPYBARA", C: Capybara },
  { name: "B · PLUSH SHARK", C: PlushShark },
  { name: "C · AXOLOTL", C: Axolotl },
  { name: "D · FOX MASK", C: FoxHead },
  { name: "E · RUBBER DUCK", C: RubberDuck },
  { name: "F · OLD PLUSH", C: Old },
];

export const PocketLab: React.FC = () => {
  const f = useCurrentFrame();
  const who = CAST[f % 6];
  const dance = f >= 6 ? 1 : 0;
  const t = dance ? 0.22 : 1;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <OceanCanvas cam={{ pos: [-0.75, 1.95, 7.4], look: [-0.95, 1.45, 0], fov: 40 }} t={1} lines={0} fish={false}>
        <WorkBoat p={[0, 0, 0]} />
        <Model file="man_b.glb" anims="ual/ual1_ue.glb" clip={dance ? "Dance_Loop" : "Idle_Loop"} t={dance ? 0.5 : 1} p={[-0.3, 0.75, 0.2]} ry={-0.75} outfit={{ top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" }} tint={{ Hair: "#1a1a1a" }} />
        <who.C p={[-1.45, 0.75, 0.25]} ry={0.6} t={t} dance={dance} />
      </OceanCanvas>
      <div style={{ position: "absolute", top: 240, width: "100%", textAlign: "center", fontFamily: fonts.punch, fontWeight: 900, fontSize: 92, color: "#fff", WebkitTextStroke: "12px #000", paintOrder: "stroke fill" }}>{who.name}</div>
    </AbsoluteFill>
  );
};
