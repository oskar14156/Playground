import React from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { Glow } from "./core";

/**
 * Low-poly airliner built from primitives (no asset files). Nose points to -Z, up is +Y.
 * Length ≈ 2 units at scale 1. Use `lights` for blinking nav lights + landing light bloom.
 * `xray` 0–1 turns the skin translucent with cyan wireframe, so parts inside (e.g. a
 * FlightRecorder placed at the tail, around z ≈ 0.75) show through.
 */
export const PlaneModel: React.FC<{
  frame: number;
  body?: string;
  tail?: string;
  lights?: boolean;
  landingLight?: boolean;
  xray?: number;
} & ThreeElements["group"]> = ({ frame, body = "#e9edf5", tail = "#5b2b8c", lights = true, landingLight = false, xray = 0, ...g }) => {
  const skin = 1 - xray * 0.88;
  const mat = <meshStandardMaterial key={xray > 0 ? "t" : "o"} color={body} metalness={0.35} roughness={0.35} transparent={xray > 0} opacity={skin} depthWrite={xray < 0.5} />;
  const blink = frame % 30 < 4;
  // swept wing as an extruded polygon
  const wing = new THREE.Shape();
  wing.moveTo(0, 0.28);
  wing.lineTo(1.15, -0.32);
  wing.lineTo(1.15, -0.45);
  wing.lineTo(0, -0.12);
  const wingGeo = new THREE.ExtrudeGeometry(wing, { depth: 0.035, bevelEnabled: false });
  const stab = new THREE.Shape();
  stab.moveTo(0, 0.1);
  stab.lineTo(0.42, -0.12);
  stab.lineTo(0.42, -0.2);
  stab.lineTo(0, -0.05);
  const stabGeo = new THREE.ExtrudeGeometry(stab, { depth: 0.02, bevelEnabled: false });
  const fin = new THREE.Shape();
  fin.moveTo(0, 0);
  fin.lineTo(0.38, 0.5);
  fin.lineTo(0.55, 0.5);
  fin.lineTo(0.45, 0);
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.025, bevelEnabled: false });

  return (
    <group {...g}>
      {/* fuselage */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.13, 1.7, 8, 16]} />
        {mat}
      </mesh>
      {xray > 0 ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.131, 1.7, 6, 14]} />
          <meshBasicMaterial color="#7fe8ff" wireframe transparent opacity={0.35 * xray} toneMapped={false} depthWrite={false} />
        </mesh>
      ) : null}
      {/* cockpit windows */}
      <mesh position={[0, 0.06, -0.93]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.16, 0.03, 0.08]} />
        <meshStandardMaterial color="#1a2233" roughness={0.1} metalness={0.6} />
      </mesh>
      {/* wings (mirror via scale) */}
      {[1, -1].map((s) => (
        <group key={s} scale={[s, 1, 1]} position={[0, -0.05, 0.05]}>
          <mesh geometry={wingGeo} rotation={[-Math.PI / 2, 0, 0]}>
            {mat}
          </mesh>
          {/* engine */}
          <mesh position={[0.42, -0.1, -0.12]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.065, 0.36, 16]} />
            <meshStandardMaterial color="#b9bfcc" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh geometry={stabGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0.74]}>
            {mat}
          </mesh>
          {lights ? (
            <>
              <Glow position={[1.15, -0.05, 0.45]} size={blink ? 0.5 : 0.22} color={s > 0 ? "#3dff7a" : "#ff3b3b"} />
              <Glow position={[0.42, -0.1, 0.1]} size={0.18} color="#ffd9a0" opacity={0.5} />
            </>
          ) : null}
        </group>
      ))}
      {/* tail fin */}
      <mesh geometry={finGeo} rotation={[0, -Math.PI / 2, 0]} position={[0.012, 0.08, 0.5]}>
        <meshStandardMaterial key={xray > 0 ? "t" : "o"} color={tail} metalness={0.3} roughness={0.4} transparent={xray > 0} opacity={skin} />
      </mesh>
      {lights ? <Glow position={[0, 0.6, 1.05]} size={blink ? 0.45 : 0.15} color="#ffffff" /> : null}
      {landingLight ? <Glow position={[0, -0.1, -1.05]} size={1.4} color="#fff3d6" /> : null}
    </group>
  );
};
