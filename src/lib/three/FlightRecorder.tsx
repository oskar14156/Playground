import React, { useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Glow } from "./core";

/**
 * Orange flight recorder ("black box") from primitives: armored box on a dark mounting tray,
 * reflective stripes, stencil label, underwater locator beacon (ULB) on the front.
 * Length ≈ 1.4 along X, front (beacon) at +X, ~0.62 tall, sits on y=0.
 *
 *   open       0–1 lid and side armor lift away, revealing insulation + the memory chip
 *   blueprint  0–1 solids fade, glowing cyan edges remain (diagram / x-ray look)
 *   char       0–1 scorched by fire (orange → soot black, stripes dull)
 *   beacon     0–1 ULB glow intensity (pings)
 */
export const FlightRecorder: React.FC<
  { open?: number; blueprint?: number; char?: number; beacon?: number; color?: string } & ThreeElements["group"]
> = ({ open = 0, blueprint = 0, char = 0, beacon = 0, color = "#ff6a10", ...g }) => {
  const geo = useMemo(
    () => ({
      body: new RoundedBoxGeometry(1.16, 0.44, 0.52, 4, 0.06),
      lid: new RoundedBoxGeometry(1.24, 0.06, 0.6, 3, 0.025),
      side: new RoundedBoxGeometry(1.24, 0.4, 0.04, 3, 0.015),
      tray: new RoundedBoxGeometry(1.5, 0.08, 0.66, 2, 0.02),
      chip: new RoundedBoxGeometry(0.42, 0.2, 0.3, 3, 0.03),
      insul: new RoundedBoxGeometry(0.7, 0.3, 0.42, 3, 0.05),
    }),
    [],
  );
  const label = useMemo(() => labelTexture(), []);
  const solid = 1 - blueprint * 0.92;
  const orange = new THREE.Color(color).lerp(new THREE.Color("#1a1210"), char * 0.85);
  const stripe = new THREE.Color("#f4f4f0").lerp(new THREE.Color("#3a3430"), char);
  const mat = (c: THREE.Color | string, rough = 0.45, metal = 0.15) => (
    // key: three.js does not reliably pick up a `transparent` flip on a live material, and with
    // parallel render tabs that showed up as every-3rd-frame flicker — remount instead.
    <meshStandardMaterial key={solid < 1 ? "t" : "o"} color={c} roughness={rough} metalness={metal} transparent={solid < 1} opacity={solid} depthWrite={solid > 0.5} />
  );
  const lift = open * 0.55;
  const slide = open * 0.38;

  return (
    <group {...g}>
      {/* mounting tray */}
      <mesh geometry={geo.tray} position={[-0.05, 0.04, 0]} castShadow receiveShadow>
        {mat("#2a2d33", 0.6, 0.5)}
      </mesh>
      {/* inner: insulation block + memory chip (visible when opened / blueprint) */}
      <group position={[0, 0.34, 0]}>
        <mesh geometry={geo.insul}>{mat("#e9e4d6", 0.9, 0)}</mesh>
        <mesh geometry={geo.chip} position={[0, 0.03 + open * 0.28, 0]} castShadow>
          <meshStandardMaterial color="#3b4048" metalness={0.8} roughness={0.25} emissive="#ffb347" emissiveIntensity={0.25 * open} />
        </mesh>
        {open > 0.05 ? <Glow position={[0, 0.06 + open * 0.28, 0]} size={0.9 * open} color="#ffc66b" opacity={0.55 * open} /> : null}
      </group>
      {/* core body (hidden while open so the inside reads) */}
      <mesh geometry={geo.body} position={[0, 0.34, 0]} castShadow receiveShadow visible={open < 0.02}>
        {mat(orange)}
      </mesh>
      {/* armor: lid + two sides */}
      <mesh geometry={geo.lid} position={[0, 0.6 + lift, 0]} castShadow>
        {mat(orange)}
      </mesh>
      {[1, -1].map((s) => (
        <group key={s} position={[0, 0.34, s * (0.3 + slide)]}>
          <mesh geometry={geo.side} castShadow>
            {mat(orange)}
          </mesh>
          {/* reflective stripes */}
          {[-0.35, 0.35].map((x) => (
            <mesh key={x} position={[x, 0, s * 0.027]}>
              <boxGeometry args={[0.08, 0.4, 0.004]} />
              <meshStandardMaterial key={solid < 1 ? "t" : "o"} color={stripe} roughness={0.2} metalness={0.3} transparent={solid < 1} opacity={solid} />
            </mesh>
          ))}
          {/* stencil label */}
          <mesh position={[0, 0.02, s * 0.03]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[0.56, 0.28]} />
            <meshBasicMaterial map={label} transparent opacity={solid * (1 - char * 0.7)} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {/* front plate + underwater locator beacon */}
      <mesh position={[0.62 + open * 0.2, 0.34, 0]} castShadow>
        <boxGeometry args={[0.04, 0.44, 0.54]} />
        {mat(orange)}
      </mesh>
      <mesh position={[0.78 + open * 0.2, 0.34, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 0.3, 20]} />
        {mat("#c9ccd2", 0.25, 0.85)}
      </mesh>
      {beacon > 0 ? <Glow position={[0.95 + open * 0.2, 0.34, 0]} size={0.5 + beacon * 0.9} color="#7dffb0" opacity={beacon} /> : null}
      {blueprint > 0.01 ? <BlueprintEdges geos={geo} opacity={blueprint} lift={lift} slide={slide} /> : null}
    </group>
  );
};

/** Cyan edge lines over the same parts — the "diagram" look. */
const BlueprintEdges: React.FC<{
  geos: Record<string, THREE.BufferGeometry>;
  opacity: number;
  lift: number;
  slide: number;
}> = ({ geos, opacity, lift, slide }) => {
  const edges = useMemo(() => Object.fromEntries(Object.entries(geos).map(([k, v]) => [k, new THREE.EdgesGeometry(v, 20)])), [geos]);
  const m = <lineBasicMaterial color="#7fe8ff" transparent opacity={opacity} toneMapped={false} />;
  return (
    <group>
      <lineSegments geometry={edges.tray} position={[-0.05, 0.04, 0]}>
        {m}
      </lineSegments>
      <lineSegments geometry={edges.lid} position={[0, 0.6 + lift, 0]}>
        {m}
      </lineSegments>
      {[1, -1].map((s) => (
        <lineSegments key={s} geometry={edges.side} position={[0, 0.34, s * (0.3 + slide)]}>
          {m}
        </lineSegments>
      ))}
      <lineSegments geometry={edges.insul} position={[0, 0.34, 0]}>
        {m}
      </lineSegments>
      <lineSegments geometry={edges.chip} position={[0, 0.37 + lift * 0.5, 0]}>
        <lineBasicMaterial color="#ffc66b" transparent opacity={opacity} toneMapped={false} />
      </lineSegments>
    </group>
  );
};

let labelTex: THREE.Texture | null = null;
const labelTexture = () => {
  if (labelTex) return labelTex;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#111";
  g.textAlign = "center";
  g.font = "bold 54px Arial, sans-serif";
  g.fillText("FLIGHT RECORDER", 256, 100);
  g.font = "bold 44px Arial, sans-serif";
  g.fillText("DO NOT OPEN", 256, 170);
  labelTex = new THREE.CanvasTexture(c);
  labelTex.anisotropy = 4;
  return labelTex;
};
