import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "./core";

/**
 * Rock pigeon (~0.32 m beak to tail), origin between the feet, beak towards +Z.
 * `flap` 0 = perched (wings folded on the back), 1 = flying (wings out, beating 5×/s, legs tucked).
 * `card` straps a little blue memory card to the right leg (RFC 1149 / Winston).
 * Everything is driven by `t` (seconds).
 */
const BODY = "#8c95a6";
const DARK = "#5d6576";
const NECK_A = "#3f7d6b";
const NECK_B = "#7a4f8a";

const bodyGeo = () => {
  const g = new THREE.SphereGeometry(1, 32, 20);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    const z = p.getZ(i);
    // plump chest forward, tapering to the tail
    const k = z < 0 ? 1 + z * 0.55 : 1 + 0.08 * Math.sin(z * Math.PI);
    x *= k;
    y *= k * (y < 0 ? 0.92 : 1);
    p.setXYZ(i, x * 0.06, y * 0.058 + (z < 0 ? -z * 0.012 : 0), z * 0.11);
  }
  g.computeVertexNormals();
  return g;
};

/** flat wing in the x (span) / z (chord) plane, hinge at the origin, leading edge at +z */
const wingGeo = () => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.03);
  s.bezierCurveTo(0.07, 0.045, 0.15, 0.03, 0.22, -0.01);
  // primaries: a ragged trailing edge
  s.lineTo(0.235, -0.05);
  s.lineTo(0.205, -0.065);
  s.lineTo(0.215, -0.09);
  s.lineTo(0.18, -0.1);
  s.lineTo(0.17, -0.12);
  s.bezierCurveTo(0.12, -0.11, 0.06, -0.08, 0, -0.06);
  s.lineTo(0, 0.03);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1 });
  g.rotateX(Math.PI / 2); // shape y → +z (chord, leading edge forward), extrusion → −y (thickness)
  return g;
};

/** wing paint in shape coordinates (x 0…0.24 span, y −0.12…0.05 chord): grey covert feathers, two dark bars,
 *  dark-tipped primaries towards the tip */
let wingT: THREE.Texture | null = null;
const wingTex = () => {
  if (wingT) return wingT;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 192;
  const g = c.getContext("2d")!;
  const X = (x: number) => (x / 0.24) * 256;
  const Y = (y: number) => 192 - ((y + 0.12) / 0.17) * 192;
  g.fillStyle = "#a6aebd";
  g.fillRect(0, 0, 256, 192);
  // feather rows
  g.strokeStyle = "rgba(60,66,80,0.25)";
  g.lineWidth = 2;
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    g.moveTo(X(0.01 + i * 0.016), Y(0.03));
    g.lineTo(X(0.02 + i * 0.018), Y(-0.1));
    g.stroke();
  }
  // two black wing bars across the inner wing
  g.fillStyle = "#23262e";
  g.fillRect(X(0.0), Y(-0.03), X(0.11), 9);
  g.fillRect(X(0.0), Y(-0.055), X(0.12), 9);
  // dark primaries at the tip
  const gr = g.createLinearGradient(X(0.13), 0, X(0.24), 0);
  gr.addColorStop(0, "rgba(70,76,90,0)");
  gr.addColorStop(0.35, "rgba(70,76,90,0.9)");
  gr.addColorStop(1, "rgba(40,44,54,1)");
  g.fillStyle = gr;
  g.fillRect(X(0.13), 0, X(0.11), 192);
  wingT = new THREE.CanvasTexture(c);
  wingT.colorSpace = THREE.SRGBColorSpace;
  wingT.repeat.set(1 / 0.24, 1 / 0.17);
  wingT.offset.set(0, 0.12 / 0.17);
  return wingT;
};

const tailGeo = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.018, 0);
  s.lineTo(-0.045, -0.11);
  s.quadraticCurveTo(0, -0.125, 0.045, -0.11);
  s.lineTo(0.018, 0);
  s.lineTo(-0.018, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1, curveSegments: 6 });
  g.rotateX(Math.PI / 2); // shape −y → −z: the fan points backwards
  return g;
};

const Leg: React.FC<{ x: number; tuck: number; card?: boolean }> = ({ x, tuck, card }) => (
  <group position={[x, 0.07, 0.005]} rotation={[-1.3 * tuck, 0, 0]}>
    <mesh position={[0, -0.035, 0]}>
      <cylinderGeometry args={[0.0045, 0.004, 0.07, 6]} />
      <meshStandardMaterial color="#c9636a" roughness={0.6} />
    </mesh>
    {[-0.5, 0, 0.5].map((a, i) => (
      <mesh key={i} position={[Math.sin(a) * 0.012, -0.069, Math.cos(a) * 0.012]} rotation={[Math.PI / 2, 0, -a]}>
        <cylinderGeometry args={[0.0028, 0.002, 0.026, 5]} />
        <meshStandardMaterial color="#c9636a" roughness={0.6} />
      </mesh>
    ))}
    <mesh position={[0, -0.071, -0.01]} rotation={[-Math.PI / 2 + 0.3, 0, 0]}>
      <cylinderGeometry args={[0.0025, 0.002, 0.016, 5]} />
      <meshStandardMaterial color="#c9636a" roughness={0.6} />
    </mesh>
    {card ? (
      <group position={[0.012, -0.03, 0]}>
        <mesh>
          <boxGeometry args={[0.006, 0.03, 0.022]} />
          <meshStandardMaterial color="#2f6fd6" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0.0035, 0.004, 0]}>
          <boxGeometry args={[0.001, 0.014, 0.016]} />
          <meshStandardMaterial color="#e8c36a" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[-0.008, 0, 0]}>
          <torusGeometry args={[0.009, 0.0018, 6, 16]} />
          <meshStandardMaterial color="#222" roughness={0.6} />
        </mesh>
      </group>
    ) : null}
  </group>
);

export const Pigeon: React.FC<{ p?: V3; ry?: number; rx?: number; s?: number; t?: number; flap?: number; card?: boolean; peck?: number; seed?: number }> = ({
  p = [0, 0, 0],
  ry = 0,
  rx = 0,
  s = 1,
  t = 0,
  flap = 0,
  card = false,
  peck = 0,
  seed = 0,
}) => {
  const body = useMemo(bodyGeo, []);
  const wing = useMemo(wingGeo, []);
  const tail = useMemo(tailGeo, []);
  const mBody = useMemo(() => new THREE.MeshStandardMaterial({ color: BODY, roughness: 0.85 }), []);
  const mDark = useMemo(() => new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.85, side: THREE.DoubleSide }), []);
  const mWing = useMemo(() => new THREE.MeshStandardMaterial({ map: wingTex(), roughness: 0.85, side: THREE.DoubleSide }), []);
  const mWingFold = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9aa2b2", roughness: 0.85 }), []);
  // wing beat: up-stroke/down-stroke at 5 Hz while flying; folded on the back when perched
  const beat = Math.sin(t * Math.PI * 2 * 5 + seed);
  const up = flap * (0.25 + 0.75 * beat);
  const bob = (1 - flap) * Math.max(0, Math.sin(t * 3 + seed)) * 0.08; // head bob while standing
  const nod = peck * 0.9 + bob;
  return (
    <group position={p} rotation={[rx, ry, 0]} scale={[s, s, s]}>
      <group position={[0, 0.125 - 0.03 * flap, 0]} rotation={[-0.25 + 0.2 * flap, 0, 0]}>
        <mesh geometry={body} material={mBody} castShadow />
        {/* iridescent neck */}
        <mesh position={[0, 0.035, 0.07]} scale={[0.042, 0.048, 0.045]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshStandardMaterial color={NECK_A} metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.045, 0.082]} scale={[0.034, 0.03, 0.03]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color={NECK_B} metalness={0.55} roughness={0.35} />
        </mesh>
        {/* head */}
        <group position={[0, 0.075, 0.1]} rotation={[nod, 0, 0]}>
          <mesh scale={[0.031, 0.031, 0.036]}>
            <sphereGeometry args={[1, 18, 12]} />
            <meshStandardMaterial color="#7d8597" roughness={0.8} />
          </mesh>
          {[-1, 1].map((k) => (
            <group key={k} position={[k * 0.024, 0.008, 0.012]}>
              <mesh>
                <sphereGeometry args={[0.0075, 10, 8]} />
                <meshStandardMaterial color="#e2722c" roughness={0.3} />
              </mesh>
              <mesh position={[k * 0.004, 0, 0.003]}>
                <sphereGeometry args={[0.0042, 8, 6]} />
                <meshStandardMaterial color="#0d0d0d" roughness={0.2} />
              </mesh>
            </group>
          ))}
          {/* cere + beak */}
          <mesh position={[0, 0.006, 0.034]} scale={[0.011, 0.007, 0.01]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#efeae2" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.002, 0.048]} rotation={[Math.PI / 2 - 0.15, 0, 0]}>
            <coneGeometry args={[0.007, 0.024, 8]} />
            <meshStandardMaterial color="#2a2628" roughness={0.5} />
          </mesh>
        </group>
        {/* wings. Perched: folded wings hug the flanks (rounded, with the two dark bars and the dark primaries
            crossing over the tail). Flying (flap > 0.5): flat painted wings spread from the shoulders. */}
        {flap < 0.5
          ? [-1, 1].map((k) => (
              <group key={k} scale={[k, 1, 1]}>
                <mesh position={[0.05, 0.016, -0.02]} rotation={[-0.12, 0.08, 0]} scale={[0.024, 0.044, 0.095]} material={mWingFold} castShadow>
                  <sphereGeometry args={[1, 20, 14]} />
                </mesh>
                {[-0.035, -0.06].map((z, i) => (
                  <mesh key={i} position={[0.0725, 0.004, z]} rotation={[-0.12, 0.08, 0]} scale={[0.0035, 0.026, 0.007]}>
                    <sphereGeometry args={[1, 10, 8]} />
                    <meshStandardMaterial color="#2b2f38" roughness={0.9} />
                  </mesh>
                ))}
                <mesh position={[0.03, 0.026, -0.105]} rotation={[-0.2, -0.12, 0]} scale={[0.016, 0.01, 0.062]}>
                  <sphereGeometry args={[1, 12, 8]} />
                  <meshStandardMaterial color="#4a505d" roughness={0.85} />
                </mesh>
              </group>
            ))
          : [-1, 1].map((k) => {
              const fold = (1 - flap) * 2; // 1 at flap 0.5 → 0 at flap 1 (wings swing out on take-off)
              return (
                <group key={k} scale={[k, 1, 1]}>
                  <group position={[0.045, 0.035, 0.04]} rotation={[0, 1.2 * fold, up * 0.9]}>
                    <mesh geometry={wing} material={mWing} castShadow />
                  </group>
                </group>
              );
            })}
        {/* tail fan with its dark band */}
        <group position={[0, 0.012, -0.1]} rotation={[0.18 - 0.25 * flap, 0, 0]} scale={[1 + 0.5 * flap, 1, 1]}>
          <mesh geometry={tail} material={mDark} />
          <mesh position={[0, 0.0042, -0.1]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.085, 0.018]} />
            <meshStandardMaterial color="#1d2027" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      <Leg x={-0.018} tuck={flap} />
      <Leg x={0.018} tuck={flap} card={card} />
    </group>
  );
};
