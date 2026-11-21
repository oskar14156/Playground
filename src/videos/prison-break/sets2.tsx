import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill } from "remotion";
import { Cam, Glow, project, V3 } from "../../lib/three/core";
import { Model } from "../../lib/three/gltf";
import { Car, RB, Streetlight } from "../../lib/three/diorama";
import { Dog } from "../../lib/three/Dog";
import { usePbr } from "../../lib/three/pbr";
import { easeOut, keys3, ramp, seeded } from "../../lib/timing";
import { c } from "./cues";
import { AMBER, BLUE, Pin, Stamp } from "./inserts";
import { GuardCap, INMATE, INMATE2, LIB1, POLICE, follow } from "./people";
import { Helicopter, HighRiseJail, Manhole } from "./props";
import { Fence, Inst, NightSky, Perimeter, PrisonCanvas, Tower, Xf, ashlar, geo, signTex } from "./world";

/** Outside sets: the wall and the cable, the real perimeter, under the wall, Chicago, the manhunt. */
type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const useAt = (cam: Cam) => (p: V3) => project(p, cam, 1080, 1920) ?? { x: -999, y: -999 };
const NIGHT_FOG: [string, number, number] = ["#0a1020", 30, 150];

/** Infirmary block inside the wall (window at 6 m), for the cable shot. */
const InfirmaryBlock: React.FC = () => {
  const brick = usePbr("red_brick_03", [6, 3]);
  return (
    <group position={[0, 0, -14]}>
      <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[18, 9, 8]} />
        <meshStandardMaterial {...brick} color="#c8c0b0" roughness={0.9} />
      </mesh>
      {[-6, -3, 0, 3, 6].map((x) =>
        [2.2, 6].map((y) => (
          <group key={`${x}${y}`} position={[x, y, 4.02]}>
            <mesh>
              <planeGeometry args={[1.1, 1.4]} />
              <meshStandardMaterial color={x === 0 && y === 6 ? "#fff0c8" : "#1a2236"} emissive={x === 0 && y === 6 ? "#ffd590" : "#2a3a5a"} emissiveIntensity={x === 0 && y === 6 ? 1.4 : 0.4} />
            </mesh>
            {Array.from({ length: 4 }, (_, b) => (
              <mesh key={b} position={[-0.39 + b * 0.26, 0, 0.03]}>
                <boxGeometry args={[0.03, 1.4, 0.03]} />
                <meshStandardMaterial color="#1a1a1a" />
              </mesh>
            ))}
          </group>
        )),
      )}
    </group>
  );
};

/** The cable from the infirmary window over the wall to a pole outside (sagging). */
const CABLE_A = new THREE.Vector3(0, 6.2, -9.9);
const CABLE_B = new THREE.Vector3(6, 8.6, 16);
const cableAt = (k: number) => {
  const p = CABLE_A.clone().lerp(CABLE_B, k);
  p.y -= 1.6 * Math.sin(Math.PI * k);
  return p;
};
const Cable: React.FC = () => {
  const g = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => cableAt(i / 29))), 80, 0.025, 6, false), []);
  return (
    <group>
      <mesh geometry={g}>
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* the utility pole outside */}
      <mesh position={[6, 5, 16]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 10, 10]} />
        <meshStandardMaterial color="#4a3626" roughness={0.9} />
      </mesh>
      <RB p={[6, 9.2, 16]} s={[1.8, 0.14, 0.14]} r={0.02} color="#4a3626" rough={0.9} />
    </group>
  );
};

// ───────────────────────── the wall + the cable ─────────────────────────
export const SetWall: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.wall) / 30;
  const cable = f >= c.climbs;
  const cam: Cam = cable
    ? { pos: keys3(f, [[c.climbs, [-17, 6, 4]], [c.perim, [-15, 7, 8]]]), look: keys3(f, [[c.climbs, [1, 5.5, -3]], [c.top, [3, 6, 3]], [c.perim, [4, 6, 8]]]), fov: 48 }
    : { pos: keys3(f, [[c.wall, [-6, 1.6, -16]], [c.climbs, [-5, 1.5, -12]]]), look: [6, 7, 0], fov: 50 };
  const at = useAt(cam);
  // 4 of the men on the cable, hanging hand over hand (spread along it, moving outwards)
  const men = cable
    ? [0, 1, 2, 3].map((i) => {
        const k = Math.min(0.92, Math.max(0.03, 0.08 + i * 0.13 + 0.05 * (f - c.climbs) / 30));
        return { k, p: cableAt(k) };
      })
    : [];
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="night" fog={NIGHT_FOG} ao={0.6} bloom={1.0}>
        <NightSky />
        <Perimeter beam={0.8} t={t} />
        <InfirmaryBlock />
        <Cable />
        {men.map(({ p }, i) => (
          <Model key={i} file={["man_a.glb", "man_b.glb", "man_c.glb", "man_d.glb"][i]} anims={LIB1} clip="Jump_Loop" t={0.25 + i * 0.1} p={[p.x, p.y - 2.05, p.z]} ry={Math.atan2(CABLE_B.x - CABLE_A.x, CABLE_B.z - CABLE_A.z)} outfit={i % 2 ? INMATE : INMATE2} tint={{ Hair: ["#2a2018", "#1a1a1a", "#3a2a1a", "#5a3a22"][i] }} />
        ))}
      </PrisonCanvas>
      {!cable ? <Pin {...at([0, 7.4, -0.6])} o={fadeIn(f, c.wall + 6)} text="THE WALL" sub="LAST STEP" color={AMBER} side="left" /> : null}
      {cable ? <Pin {...at([cableAt(0.5).x, cableAt(0.5).y + 0.3, cableAt(0.5).z])} o={fadeIn(f, c.cable)} text="A CABLE OVER THE TOP" sub="IN THE SHOW" color={AMBER} side="right" size={36} /> : null}
    </AbsoluteFill>
  );
};

/** Pole-mounted dome camera. */
const DomeCam: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh position={[0, 2.2, 0]}>
      <cylinderGeometry args={[0.05, 0.07, 4.4, 8]} />
      <meshStandardMaterial color="#6a7076" metalness={0.6} roughness={0.4} />
    </mesh>
    <RB p={[0, 4.45, 0.2]} s={[0.12, 0.08, 0.5]} r={0.02} color="#d8d8d8" metal={0.3} />
    <mesh position={[0, 4.36, 0.4]}>
      <sphereGeometry args={[0.13, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      <meshPhysicalMaterial color="#1a1a1a" roughness={0.05} metalness={0.3} />
    </mesh>
    <Glow position={[0.06, 4.32, 0.5]} size={0.2} color="#ff3030" opacity={0.9} />
  </group>
);

// ───────────────────────── the real perimeter ─────────────────────────
export const SetPerimeter: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.perim) / 30;
  const volts = f >= c.volts;
  const cam: Cam = volts
    ? { pos: keys3(f, [[c.volts, [-11, 2.0, 5.6]], [c.ny, [-8, 1.9, 5.7]]]), look: [4, 1.7, 8.2], fov: 50 }
    : { pos: keys3(f, [[c.perim, [-22, 3.2, 17]], [c.sensors, [-12, 2.6, 15]], [c.volts, [-9, 2.4, 14.5]]]), look: keys3(f, [[c.perim, [-4, 3.5, 4]], [c.towers, [0, 6, 0]], [c.sensors, [-6, 1.3, 10.5]], [c.volts, [-6, 1.3, 10.5]]]), fov: 46 };
  const at = useAt(cam);
  const shake = f >= c.sensors ? 0.03 * Math.sin((f - c.sensors) * 1.7) * Math.max(0, 1 - (f - c.sensors) / 30) : 0;
  const sensorBlink = f >= c.sensors && Math.floor(f / 5) % 2 === 0;
  const warn = useMemo(() => signTex("DANGER", ["LETHAL ELECTRIFIED FENCE", "5,000+ VOLTS · KEEP OUT"], "#d01818", "#ffd23f"), []);
  // a jagged arc between the two fences (deliberate flicker: it re-strikes every 3 frames)
  const arc = useMemo(() => {
    const out: Xf[] = [];
    const r = seeded(Math.floor(f / 3) + 7);
    let prev = new THREE.Vector3(-1 + r(), 3.0, 4.05);
    for (let k = 1; k <= 10; k++) {
      const cur = new THREE.Vector3(-1 + r() * 2, 3.0 - k * 0.05 + (r() - 0.5) * 0.5, 4.05 + k * 0.645);
      const mid = prev.clone().add(cur).multiplyScalar(0.5);
      const len = prev.distanceTo(cur);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), cur.clone().sub(prev).normalize());
      const e = new THREE.Euler().setFromQuaternion(q);
      out.push({ p: mid.toArray() as V3, s: [0.025, len, 0.025], r: [e.x, e.y, e.z] });
      prev = cur;
    }
    return out;
  }, [Math.floor(f / 3)]); // eslint-disable-line react-hooks/exhaustive-deps
  const arcMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#bfe8ff", toneMapped: false }), []);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="night" fog={NIGHT_FOG} ao={0.6} bloom={1.2}>
        <NightSky />
        <group position={[0, 0, 0]}>
          <Perimeter beam={0.6} t={t} fences={false} hot={volts ? 1 : 0} />
          <group position={[shake, 0, 0]}>
            <Fence z={4} from={-60} to={60} />
          </group>
          <Fence z={10.5} from={-60} to={60} hot={volts ? 1 : 0} />
          {/* the electrified fence between them (California) */}
          {volts ? <Fence z={7.25} from={-60} to={60} h={3.2} hot={1} /> : null}
          {volts && Math.floor(f / 3) % 3 !== 2 ? (
            <Inst geo={geo.box} xf={arc} mat={arcMat} cast={false} />
          ) : null}
          {volts ? (
            <mesh position={[-4, 1.6, 7.2]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[0.9, 0.6]} />
              <meshStandardMaterial map={warn} side={THREE.DoubleSide} roughness={0.6} emissive="#ffd23f" emissiveIntensity={0.15} />
            </mesh>
          ) : null}
          <DomeCam p={[-12, 0, 11.3]} />
          <DomeCam p={[6, 0, 11.3]} />
          {sensorBlink ? <Glow position={[-6, 1.35, 10.62]} size={0.5} color="#ff3030" /> : null}
          <Tower p={[-40, 0, -0.6]} beam={0.8} t={t} />
        </group>
        {volts ? <pointLight position={[0, 3, 7.25]} color="#9fdcff" intensity={Math.floor(f / 3) % 3 !== 2 ? 30 : 4} distance={14} decay={2} /> : null}
      </PrisonCanvas>
      {!volts ? (
        <>
          <Pin {...at([-14, 4.1, 10.5])} o={fadeIn(f, c.razor)} text="RAZOR WIRE" color={BLUE} side="right" size={38} />
          <Pin {...at([-12, 4.4, 11.6])} o={fadeIn(f, c.cameras)} text="CAMERAS" color={BLUE} side="left" size={38} />
          <Pin {...at([0, 13.5, -0.6])} o={fadeIn(f, c.towers)} text="ARMED TOWERS" color={BLUE} side="right" size={38} />
          <Pin {...at([-6, 1.2, 10.6])} o={fadeIn(f, c.sensors)} text="SENSORS FEEL THE FENCE" color={BLUE} side="right" size={36} />
          <Pin x={540} y={1500} o={fadeIn(f, c.perim + 8)} text="2 FENCES · 3.7 m · 12 ft" sub="6–7.5 m · 20–25 ft APART" color={BLUE} size={36} />
        </>
      ) : (
        <>
          <Pin x={540} y={330} o={fadeIn(f, c.volts + 4)} text="CALIFORNIA · LETHAL FENCE" sub="5,000+ VOLTS · BETWEEN 2 FENCES" color="#ff3b30" size={40} />
        </>
      )}
    </AbsoluteFill>
  );
};

// ───────────────────────── under the wall (Clinton): a cross-section ─────────────────────────
export const SetUnder: React.FC<SetProps> = ({ f }) => {
  const cam: Cam = { pos: keys3(f, [[c.ny, [2, 2, 50]], [c.chicago, [2.5, 1.5, 44]]]), look: [2, -0.5, 0], fov: 50 };
  const at = useAt(cam);
  const route = ramp(f, c.ny + 10, c.under + 20);
  const stone = useMemo(() => ashlar([3, 1]), []);
  const pts = useMemo(() => [[-8, 0.6, 0.3], [-6, -2.2, 0.3], [-1, -2.75, 0.3], [7, -2.75, 0.3], [11, -1.2, 0.3], [12, 0.3, 0.3]].map((q) => new THREE.Vector3(...(q as V3))), []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts), [pts]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 120, 0.22, 8, false), [curve]);
  tube.setDrawRange(0, Math.floor((tube.index!.count * route) / 6) * 6);
  const soil = usePbr("brown_mud_rocks_01", [6, 2]);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="room" bg="#0b1426" ao={0.5} bloom={1.0}>
        {/* the cut-open ground block */}
        {/* cut face at z = 0: soil behind it, the tunnel and the route drawn in front */}
        <mesh position={[2, -3, -1.5]} receiveShadow>
          <boxGeometry args={[24, 6, 3]} />
          <meshStandardMaterial {...soil} color="#b08860" roughness={1} />
        </mesh>
        <mesh position={[2, 0.01, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[24, 3]} />
          <meshStandardMaterial color="#3a4a2a" roughness={1} />
        </mesh>
        {/* the wall on top */}
        <mesh position={[0, 3.5, 0]} castShadow>
          <boxGeometry args={[1.2, 7, 6]} />
          <meshStandardMaterial map={stone} roughness={0.9} />
        </mesh>
        {/* cell block on the left, street on the right */}
        <RB p={[-7.5, 4, 0]} s={[4, 8, 5]} r={0.1} color="#8a5a48" rough={0.9} />
        <RB p={[11.5, 0.05, 0]} s={[5, 0.1, 5]} r={0.02} color="#2a2a2c" rough={0.9} />
        {/* steam tunnel */}
        <RB p={[3, -3, 0.02]} s={[9, 1.0, 0.04]} r={0.02} color="#1e1610" rough={1} />
        <mesh position={[3, -3, 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 9, 16]} />
          <meshStandardMaterial color="#8a7a66" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh geometry={tube}>
          <meshBasicMaterial color="#5cc8ff" toneMapped={false} />
        </mesh>
        <Manhole p={[12, 0.1, 0]} lift={ramp(f, c.under, c.under + 16)} />
        <pointLight position={[2, 8, 22]} intensity={700} distance={80} decay={2} color="#c8d4ff" />
      </PrisonCanvas>
      <Pin {...at([0, 7.6, 0])} o={fadeIn(f, c.ny + 4)} text="NEVER TOUCHED THE WALL" color={BLUE} side="left" size={36} />
      <Pin {...at([3, -3.4, 0])} o={fadeIn(f, c.under)} text="UNDER IT" sub="STEAM PIPE → MANHOLE" color={BLUE} side="right" size={40} />
      <Pin {...at([12, 0.6, 0])} o={fadeIn(f, c.under + 10)} text="≈150 m · 500 ft OUT" color={BLUE} side="left" size={34} />
    </AbsoluteFill>
  );
};

// ───────────────────────── Chicago, 2012 ─────────────────────────
const City: React.FC = () => {
  const xf = useMemo(() => {
    const r = seeded(3);
    const out: Xf[] = [];
    for (let i = 0; i < 40; i++) {
      const x = -120 + r() * 240;
      const z = -60 - r() * 120;
      const h = 20 + r() * 120;
      out.push({ p: [x, h / 2, z], s: [10 + r() * 16, h, 10 + r() * 16] });
    }
    return out;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a2030", roughness: 0.6, emissive: "#3a3020", emissiveIntensity: 0.25 }), []);
  return <Inst geo={geo.box} xf={xf} mat={mat} cast={false} />;
};

export const SetChicago: React.FC<SetProps> = ({ f }) => {
  const cam: Cam = { pos: keys3(f, [[c.chicago, [10, 2, 46]], [c.floors, [7, 3, 38]], [c.manhunt, [5, 6, 30]]]), look: keys3(f, [[c.chicago, [0, 40, 0]], [c.sheets, [1.3, 34, 7]], [c.manhunt, [1.3, 24, 7]]]), fov: 46 };
  const at = useAt(cam);
  const asphalt = usePbr("concrete_floor_02", [20, 20]);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="night" fog={["#0a1020", 80, 260]} ao={0.4} bloom={1.1}>
        <NightSky />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial {...asphalt} color="#2a2a2e" roughness={0.9} />
        </mesh>
        <HighRiseJail rope={ramp(f, c.chicago + 6, c.floors + 20)} />
        <City />
        <pointLight position={[10, 20, 30]} intensity={300} distance={120} decay={2} color="#ffc983" />
        <Car p={[16, 0, 24]} color="#3a3a40" ry={Math.PI / 2} head={1} />
      </PrisonCanvas>
      <Pin x={540} y={330} o={fadeIn(f, c.chicago + 4)} text="CHICAGO · 2012" sub="FEDERAL JAIL (MCC)" color={BLUE} size={44} />
      <Pin {...at([1.3, 52, 7.3])} o={fadeIn(f, c.floors)} text="17 FLOORS DOWN" color={BLUE} side="right" size={38} />
      <Pin {...at([1.3, 30, 7.3])} o={fadeIn(f, c.sheets)} text="BEDSHEETS + DENTAL FLOSS" color={BLUE} side="right" size={34} />
      <Stamp f={f} at={c.caught3} text="CAUGHT" sub="2 DAYS · 18 DAYS" color="#ff3b30" top={1320} size={120} />
    </AbsoluteFill>
  );
};

// ───────────────────────── the manhunt ─────────────────────────
export const SetManhunt: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.manhunt) / 30;
  const cam: Cam = { pos: keys3(f, [[c.manhunt, [-16, 3.4, 28]], [c.study, [-13, 3.2, 28]]]), look: keys3(f, [[c.manhunt, [0, 4, 21]], [c.study, [6, 4, 22]]]), fov: 52 };
  const run = follow([[-8, 25.5], [12, 26.5]], t, 3.2);
  const flash = Math.floor(f / 6) % 2;
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="night" fog={NIGHT_FOG} ao={0.5} bloom={1.2}>
        <NightSky />
        <Perimeter beam={1} t={t} />
        <Helicopter p={[2 + t * 2, 14, 24]} ry={-1.2} rotor={t} />
        <pointLight position={[-4, 6, 27]} color="#9ab0e0" intensity={80} distance={30} decay={2} />
        <group position={[run.x - 2.2, 0, run.z - 0.6]} rotation={[0, -Math.atan2(16, 4) + Math.PI / 2, 0]}>
          <Dog t={t} run={1} />
        </group>
        <Model file="man_d.glb" anims={LIB1} clip="Sprint_Loop" t={t} p={[run.x - 4, 0, run.z - 1.2]} ry={run.ry} outfit={POLICE} tint={{ Hair: "#1a1a1a" }} attach={{ bone: "Head", node: <GuardCap color="#141a28" /> }} />
        {[[-4, 21], [4, 21]].map(([x, z], i) => (
          <group key={x}>
            <Car p={[x, 0, z]} color="#e8e8e8" ry={Math.PI / 2} head={1} />
            <RB p={[x, 1.32, z - 0.25]} s={[0.25, 0.08, 1.1]} r={0.02} color={(flash + i) % 2 ? "#ff2a2a" : "#2a6aff"} emissive={(flash + i) % 2 ? "#ff2a2a" : "#2a6aff"} ei={4} />
            <Glow position={[x, 1.5, z - 0.25]} size={3} color={(flash + i) % 2 ? "#ff2a2a" : "#2a6aff"} opacity={0.7} />
          </group>
        ))}
      </PrisonCanvas>
      <Pin x={540} y={330} o={fadeIn(f, c.manhunt + 4)} text="THE MANHUNT" color={BLUE} size={48} />
    </AbsoluteFill>
  );
};

// ───────────────────────── Clinton manhole outside the wall ─────────────────────────
export const SetManhole: React.FC<SetProps> = ({ f }) => {
  const t = (f - c.manhole) / 30;
  const cam: Cam = { pos: keys3(f, [[c.manhole, [7, 1.6, 23.5]], [c.took, [6, 1.3, 22]]]), look: [4, 0.3, 19], fov: 46 };
  const at = useAt(cam);
  const lift = ramp(f, c.manhole + 4, c.manhole + 20);
  const rise = ramp(f, c.manhole + 18, c.took, easeOut);
  return (
    <AbsoluteFill>
      <PrisonCanvas cam={cam} mood="night" fog={NIGHT_FOG} ao={0.6} bloom={1.0}>
        <NightSky />
        <Perimeter beam={0.4} t={t} woods={false} />
        <Manhole p={[4, 0.03, 19]} lift={lift} />
        <Streetlight p={[6.5, 0, 17.6]} />
        <pointLight position={[6.3, 4.6, 17.8]} color="#ffc983" intensity={40} distance={14} decay={2} />
        <Model file="man_b.glb" anims={LIB1} clip="Idle_Loop" t={t} p={[4, -1.75 + 1.05 * rise, 19]} ry={2.2} outfit={{ top: "#4a5a3a", pants: "#3a4a3a", shoes: "#2a2a2a" }} tint={{ Hair: "#1a1a1a" }} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.035, 19]}>
          <ringGeometry args={[0.45, 3, 40]} />
          <meshStandardMaterial color="#38383a" roughness={0.9} />
        </mesh>
      </PrisonCanvas>
      <Pin {...at([4, 0.9, 19])} o={fadeIn(f, c.manhole + 8)} text="MANHOLE" sub="OUTSIDE THE WALLS" color={BLUE} side="right" />
    </AbsoluteFill>
  );
};

