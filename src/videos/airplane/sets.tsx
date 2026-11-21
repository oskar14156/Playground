import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, staticFile } from "remotion";
import { useLoader } from "@react-three/fiber";
import { Cam, Glow, project, TubePath, V3 } from "../../lib/three/core";
import { Model, Outfit } from "../../lib/three/gltf";
import { FursuitHead } from "../../lib/three/Mascots";
import { FlightRecorder } from "../../lib/three/FlightRecorder";
import { Earth } from "../../lib/three/Earth";
import { Flames } from "../../lib/three/fx";
import { Bookshelf, Car, House, Lamp, Plant, Rug, tex, Window } from "../../lib/three/diorama";
import { easeOut, keys, keys3, ramp, seeded } from "../../lib/timing";
import { fonts } from "../../lib/theme";
import { Big, Tag } from "../rocket/sets";
import { c } from "./cues";
import { Airliner, GEAR_Y, LENGTH, StaticWicks, WICKS } from "./plane";
import { Bed, Cabin, CabinDoor, flightMapTex, GumTree, KangarooSign, CometSection, LaunchRail, Lavatory, MealTray, Phone, Seat, SEAT_X, WrightFlyer } from "./props";
import { AirCanvas, CloudDeck, Hangar } from "./world";
import { AltitudePill, BlackBoxSpecs, BoardingPass, CabinMountain, CounterPill, LawCard, PhoneCard, Stamp, TasteMeter, Turbofan } from "./inserts";

export type SetProps = { f: number };
const fadeIn = (f: number, a: number, d = 8) => ramp(f, a, a + d, easeOut);
const W = 1080;
const H = 1920;
const D = Math.PI / 180;

const LIB1 = "ual/ual1_ue.glb";
const LIB2 = "ual/ual2.glb";
const FRIEND: Outfit = { top: "#3a7bd5", pants: "#3b3b3b", shoes: "#2a2420" };
const YOU: Outfit = { top: "#e8573a", pants: "#2c3440", shoes: "#f2f2f2" };
const GRANDMA: Outfit = { top: "#c86a9a", pants: "#6a5a7a", shoes: "#e8e0d8", sleeves: 0.5 };
const MASK_S = 0.5;
/** fuselage axis height above the floor when the jet stands on its gear */
const AXIS_Y = -GEAR_Y;

/** screen position of a world point; points beyond project()'s far plane are pulled in along the line of sight */
export const atOf = (cam: Cam) => (p: V3) => {
  const d = Math.hypot(p[0] - cam.pos[0], p[1] - cam.pos[1], p[2] - cam.pos[2]);
  if (d < 900) return project(p, cam, W, H);
  const k = 500 / d;
  return project([cam.pos[0] + (p[0] - cam.pos[0]) * k, cam.pos[1] + (p[1] - cam.pos[1]) * k, cam.pos[2] + (p[2] - cam.pos[2]) * k], cam, W, H);
};

// ───────────────────────── BEDROOM (opening): awake at 3 a.m., the puh is in Australia ─────────────────────────
export const Bedroom: React.FC<{ t: number; asleep?: boolean; friend?: boolean }> = ({ t, asleep = false, friend = true }) => {
  const floor = tex("planks", "#8a6a4a", [3, 3]);
  const wall = tex("wallpaper", "#5a6a8a", [2, 1]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial map={floor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.4, -2.5]} receiveShadow>
        <planeGeometry args={[5, 2.8]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      <mesh position={[-2.5, 1.4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[5, 2.8]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#2a3040" roughness={1} />
      </mesh>
      <Window p={[-2.47, 1.5, -0.6]} ry={Math.PI / 2} s={[1.1, 1.2]} sky="#1a2a55" glow={0.7} curtains="#3a4a6a" />
      <Bed p={[0.2, 0, -1.4]} duvet="#4a6a9a" />
      {/* night stand + lamp */}
      <mesh position={[1.35, 0.3, -2.1]} castShadow>
        <boxGeometry args={[0.5, 0.6, 0.45]} />
        <meshStandardMaterial color="#6b4a30" roughness={0.7} />
      </mesh>
      <Lamp p={[1.35, 0.6, -2.1]} on={asleep ? 0.15 : 0.5} />
      <Bookshelf p={[2.2, 0, -2.25]} />
      <Rug p={[0.2, 0.01, 0.6]} s={[2.2, 1.4]} color="#8a4a3a" />
      <Plant p={[-2.0, 0, -2.1]} s={0.8} />
      <pointLight position={[-2.2, 1.6, -0.6]} intensity={0.7} distance={5} color="#6f8cff" />
      <pointLight position={[1.35, 1.0, -1.9]} intensity={asleep ? 0.3 : 1.1} distance={4} color="#ffc27a" />
      {/* an empty spot on the pillow where the puh should be */}
      {asleep || !friend ? null : (
        <Model file="man_b.glb" anims={LIB1} clip="Sitting_Idle_Loop" t={t} p={[1.08, 0.1, -1.25]} ry={Math.PI / 2} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} attach={{ bone: "hand_r", node: <Phone p={[0.02, 0.08, 0.04]} rot={[1.2, 0.2, 0]} /> }} />
      )}
    </group>
  );
};
export const SetBedroom: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [0, [2.3, 1.15, 0.2]],
      [c.down, [2.5, 1.35, 0.9]],
      [c.needs, [2.6, 1.55, 1.7]],
    ]),
    look: keys3(f, [
      [0, [1.2, 0.95, -1.3]],
      [c.needs, [0.6, 0.95, -1.4]],
    ]),
    fov: 42,
  };
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={1} indoor shadow={6} ao={0.6}>
        <Bedroom t={t} />
      </AirCanvas>
      {f >= c.australia ? <Big x={540} y={430} text="IN AUSTRALIA." o={fadeIn(f, c.australia)} size={96} color="#ffd23f" /> : null}
      <PhoneCard f={f} at={12} until={c.down} />
      {f >= c.slept ? <Big x={540} y={1460} text={"DAY 3\nNO SLEEP"} o={fadeIn(f, c.slept)} size={90} color="#ff6b5e" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── GLOBE: 17,000 km, a ship takes 6 weeks ─────────────────────────
export const EARTH_LAT = 8;
export const EARTH_LON = 70;
/** world position of (lat, lon) on lib/Earth with the group/mesh rotations it uses */
export const onEarth = (lat: number, lon: number, r: number, spin: number) => {
  const phi = (lon + 180) * D;
  const th = (90 - lat) * D;
  const v = new THREE.Vector3(-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th)).multiplyScalar(r);
  v.applyEuler(new THREE.Euler(0, -EARTH_LON * D + spin, 0));
  v.applyEuler(new THREE.Euler(0, 0, Math.PI / 2 - EARTH_LAT * D));
  return v;
};
export const LONDON: [number, number] = [51.47, -0.45];
export const SYDNEY: [number, number] = [-33.95, 151.18];
export const greatCircle = (a: [number, number], b: [number, number], n = 120) => {
  const toV = ([la, lo]: [number, number]) => new THREE.Vector3(Math.cos(la * D) * Math.cos(lo * D), Math.cos(la * D) * Math.sin(lo * D), Math.sin(la * D));
  const va = toV(a);
  const vb = toV(b);
  const om = va.angleTo(vb);
  return Array.from({ length: n }, (_, i) => {
    const s = i / (n - 1);
    const v = va.clone().multiplyScalar(Math.sin((1 - s) * om)).add(vb.clone().multiplyScalar(Math.sin(s * om))).divideScalar(Math.sin(om));
    return [Math.asin(v.z) / D, Math.atan2(v.y, v.x) / D] as [number, number];
  });
};
export const SetGlobe: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const spin = ramp(f, c.needs, c.wings, (x) => x) * 0.5;
  const route = useMemo(() => greatCircle(LONDON, SYDNEY), []);
  const pts = route.map(([la, lo], i) => onEarth(la, lo, 1 + 0.02 + 0.06 * Math.sin((Math.PI * i) / (route.length - 1)), spin));
  const mid = onEarth(10, 75, 1, spin).normalize();
  const camPos = mid.clone().multiplyScalar(keys(f, [
    [c.needs, 2.6],
    [c.ship, 3.1],
  ]));
  const cam: Cam = { pos: [camPos.x, camPos.y + 0.1, camPos.z], look: [0, 0, 0], fov: 40 };
  const draw = ramp(f, c.km - 4, c.km + 30, easeOut);
  const at = atOf(cam);
  const pL = onEarth(...LONDON, 1.02, spin);
  const pS = onEarth(...SYDNEY, 1.02, spin);
  const sL = at([pL.x, pL.y, pL.z]);
  const sS = at([pS.x, pS.y, pS.z]);
  const ship = ramp(f, c.ship + 4, c.wings, (x) => x) * 0.07;
  const shipP = pts[Math.round(ship * (pts.length - 1))];
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={1} ao={0} env={0.05}>
        <Earth r={1} lat={EARTH_LAT} lon={EARTH_LON} spin={spin} clouds={t * 0.01} sun={[0.4, 0.5, 0.8]} />
        <TubePath points={pts} progress={draw} radius={0.007} color="#ffd23f" />
        {f >= c.ship ? <Glow position={shipP} size={0.06} color="#8fd0ff" opacity={0.95} /> : null}
      </AirCanvas>
      {sL ? <Tag x={sL.x} y={sL.y} text="YOU" side="right" o={fadeIn(f, c.needs + 6)} size={32} /> : null}
      {sS && f >= c.km ? <Tag x={sS.x} y={sS.y} text="GRANDMA" color="#ff8a3a" side="left" o={fadeIn(f, c.km + 20)} size={32} /> : null}
      <CounterPill o={fadeIn(f, c.km - 2)} value={17000 * draw} label="KM · 10,600 MI" />
      {f >= c.ship ? <Big x={540} y={1500} text={"SHIP:\n6 WEEKS"} o={fadeIn(f, c.ship)} size={88} color="#8fd0ff" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── FIELD: Kitty Hawk 1903, 12 s and 37 m — shorter than a jumbo's wing ─────────────────────────
export const SetField: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  // the hop: 37 m along −Z in about 2.3 s (the real one took 12 s), up to 3 m high
  const k = ramp(f, c.first + 6, c.went + 26, (x) => x);
  const fz = 6 - 37 * k;
  const fy = 3 * Math.sin(Math.PI * k) ** 0.8;
  const pitch = 0.06 * Math.cos(Math.PI * k);
  const wide = ramp(f, c.shorter - 6, c.shorter + 26);
  const broken = ramp(f, c.wood + 20, c.wood + 34);
  const cam: Cam = {
    pos: keys3(f, [
      [c.wings, [7, 1.8, 14]],
      [c.first, [9, 3, 14]],
      [c.shorter - 6, [9, 4, Math.max(fz, -31) + 11]],
      [c.shorter + 30, [-6, 92, 14]],
      [c.wood, [-6, 92, 14]],
      [c.wood + 14, [8, 3.5, -22]],
    ]),
    look: keys3(f, [
      [c.wings, [0, 1.6, 4]],
      [c.first, [0, 2, 2]],
      [c.shorter - 6, [0, 2, Math.max(fz, -31) - 3]],
      [c.shorter + 30, [-14, 0, -14]],
      [c.wood, [-14, 0, -14]],
      [c.wood + 14, [0, 1.4, -31]],
    ]),
    fov: 44,
  };
  const at = atOf(cam);
  const p0 = at([0, 0.2, 6]);
  const p1 = at([0, 0.2, -31]);
  const pWing = at([-30 + 0, AXIS_Y - 1.9, -18 - 31]);
  const pW0 = at([-30, AXIS_Y - 1.9, -18 + 32]);
  const pW1 = at([-30, AXIS_Y - 1.9, -18 - 32]);
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} ground="field" shadow={40}>
        <LaunchRail p={[0, 0, 8]} />
        <group position={[0, fy * (1 - broken), Math.max(fz, -31)]} rotation={[pitch + 0.25 * broken, 0, -0.18 * broken]}>
          <WrightFlyer t={t} spin={f < c.wood + 20 ? 1 : 0} pilot={<Model file="man_c.glb" anims={LIB2} clip="LayToIdle" t={0.02} p={[-0.45, 0.82, 0.55]} ry={Math.PI} scale={0.95} outfit={{ top: "#3a3a3a", pants: "#3a3a3a", shoes: "#2a2420" }} tint={{ Hair: "#5a4632" }} />} />
        </group>
        {/* the brother running alongside */}
        {f < c.shorter ? <Model file="man_d.glb" anims={LIB1} clip="Jog_Fwd_Loop" t={t} p={[3.2, 0, 4 - 11 * ramp(f, c.first + 6, c.went + 40, (x) => x)]} ry={Math.PI} outfit={{ top: "#4a4a50", pants: "#3a3a3a", shoes: "#2a2420" }} tint={{ Hair: "#3a2a1e" }} /> : null}
        {/* a jumbo jet's wing (ghost) over the whole flight path */}
        {wide > 0.01 ? (
          <group position={[-30, AXIS_Y, -18]} rotation={[0, Math.PI / 2, 0]}>
            <Airliner frame={f} gear spin={0} />
          </group>
        ) : null}
      </AirCanvas>
      {f >= c.first && f < c.wood && p0 && p1 ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: fadeIn(f, c.went) }}>
          <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#ffd23f" strokeWidth={8} strokeDasharray="18 10" />
        </svg>
      ) : null}
      {f >= c.first && f < c.wood ? <Big x={540} y={380} text={"12 S · 37 M\n120 FT"} o={fadeIn(f, c.first)} size={90} color="#ffd23f" /> : null}
      {f >= c.brothers && f < c.first ? <Big x={540} y={380} text="1903" o={fadeIn(f, c.brothers)} size={120} color="#ffffff" /> : null}
      {f >= c.shorter + 20 && f < c.wood + 8 && pW0 && pW1 ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: fadeIn(f, c.shorter + 20) }}>
          <line x1={pW0.x - 60} y1={pW0.y} x2={pW1.x - 60} y2={pW1.y} stroke="#8fd0ff" strokeWidth={8} />
        </svg>
      ) : null}
      {f >= c.shorter + 24 && f < c.wood + 8 && pWing ? <Tag x={pWing.x - 60} y={pWing.y - 40} text="JUMBO WING · 64 M" color="#8fd0ff" side="right" size={32} o={fadeIn(f, c.shorter + 24)} /> : null}
      {f >= c.wood + 22 ? <Stamp f={f} at={c.wood + 22} text="BROKE." top={1400} size={110} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── HANGAR: aluminium skin, then jet engines (and a propeller that gives up) ─────────────────────────
const NoseProp: React.FC<{ t: number; spin: number }> = ({ t, spin }) => (
  <group rotation={[0, 0, t * 9 * spin]}>
    {[0, 1, 2].map((i) => (
      <mesh key={i} rotation={[0, 0.3, (i / 3) * Math.PI * 2]} position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 4.6, 0.12]} />
        <meshStandardMaterial color="#2a2d33" roughness={0.5} />
      </mesh>
    ))}
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <coneGeometry args={[0.7, 1.4, 24]} />
      <meshStandardMaterial color="#d94a2a" roughness={0.4} />
    </mesh>
  </group>
);
export const SetHangar: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const skin = ramp(f, c.alu + 4, c.alu + 40, (x) => x);
  const wings = ramp(f, c.alu + 20, c.alu + 44);
  const tail = ramp(f, c.alu + 30, c.alu + 48);
  const engines = ramp(f, c.jets + 2, c.jets + 26, (x) => x);
  const propOff = ramp(f, c.jets - 4, c.jets + 10);
  const propSpin = keys(f, [
    [c.prop, 1],
    [c.prop + 40, 0.12],
  ]);
  const engineShot = ramp(f, c.pilots - 10, c.pilots + 14);
  const cam: Cam = {
    pos: keys3(f, [
      [c.alu, [-28, 9, 58]],
      [c.alu + 46, [-46, 16, 72]],
      [c.prop, [-14, 8, 58]],
      [c.jets + 24, [-40, 10, 64]],
      [c.pilots, [-26, 5.2, 36]],
      [c.low, [-22, 4.8, 33]],
    ]),
    look: keys3(f, [
      [c.alu, [0, AXIS_Y, 6]],
      [c.prop, [0, AXIS_Y, 30]],
      [c.jets + 24, [-10, AXIS_Y - 1, 8]],
      [c.pilots, [-11.9, AXIS_Y - 2.4, 13.6]],
    ]),
    fov: keys(f, [
      [c.alu, 44],
      [c.pilots, 38],
    ]),
  };
  const at = atOf(cam);
  const pSkin = at([0, AXIS_Y + 4.5, 20]);
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} ground="hangar" shadow={90} sun={[-60, 120, 160]}>
        <Hangar />
        <group position={[0, AXIS_Y, 0]} rotation={[0, Math.PI, 0]}>
          <Airliner frame={f} skin={skin} wings={wings} tail={tail} engines={engines} paint={0} gear spin={1}>
            {propOff < 1 ? (
              <group position={[0, -0.3 - 8 * propOff ** 2, -LENGTH / 2 - 0.4]} rotation={[0, 0, 0.6 * propOff]}>
                <NoseProp t={t} spin={propSpin} />
              </group>
            ) : null}
          </Airliner>
        </group>
        {/* a worker on the floor for scale */}
        <Model file="man_a.glb" anims={LIB2} clip="Idle_FoldArms_Loop" t={t} p={[-8, 0, 30]} ry={-2.4} outfit={YOU} tint={{ Hair: "#3b2a1e" }} />
      </AirCanvas>
      {f >= c.alu + 6 && f < c.prop && pSkin ? <Tag x={pSkin.x} y={pSkin.y} text="ALUMINIUM" color="#cfd6de" side="left" o={fadeIn(f, c.alu + 6)} /> : null}
      {f >= c.prop + 18 && f < c.jets ? <Big x={540} y={420} text={"PROPELLER:\nOUT OF AIR"} o={fadeIn(f, c.prop + 18)} size={84} color="#ff6b5e" /> : null}
      {engineShot > 0 ? <Turbofan f={f} at={c.pilots} words={[c.suck, c.squeeze, c.bang, c.blow]} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── CLIMB: through the clouds to 11 km ─────────────────────────
export const SetClimb: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const climb = ramp(f, c.low + 6, c.thinner + 10);
  const km = 1.5 + 9.5 * climb;
  // the plane stays at the origin; the cloud deck sinks past it
  const deckY = 260 - 1400 * climb;
  const cam: Cam = {
    pos: keys3(f, [
      [c.low, [-58, 8, 70]],
      [c.drag, [-75, 18, 40]],
      [c.pump, [-34, 6, 52]],
    ]),
    look: [0, 2, 4],
    fov: 38,
  };
  const pitch = 0.14 * (1 - ramp(f, c.thinner, c.drag + 20));
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} high={climb} clouds={deckY} sun={[260, 220, -120]}>
        <group rotation={[pitch, 0, 0]}>
          <Airliner frame={f} lights />
        </group>
        {/* contrails once you are up high */}
        {climb > 0.7
          ? [-1, 1].map((m) => [11.9, 21.1].map((x) => (
              <mesh key={`${m}${x}`} position={[m * x, -2.6, 140]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.5, 2.8, 260, 10, 1, true]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.35 * (climb - 0.7) * 3} depthWrite={false} />
              </mesh>
            )))
          : null}
      </AirCanvas>
      <AltitudePill o={fadeIn(f, c.low)} km={km} density={1 - 0.7 * ramp(f, c.fly11, c.thinner + 10)} />
      {f >= c.drag && f < c.breathe ? <Big x={540} y={1450} text={"LESS DRAG\nLESS FUEL"} o={fadeIn(f, c.drag)} size={84} color="#5dfc8d" /> : null}
      {f >= c.breathe && f < c.pump ? <Big x={540} y={1450} text={"−56 °C\nNO AIR"} o={fadeIn(f, c.breathe)} size={90} color="#8fd0ff" /> : null}
      <CabinMountain f={f} at={c.pump + 6} />
    </AbsoluteFill>
  );
};

// ───────────────────────── WINDOW: the hull breathes every flight; square windows crack, round ones don't ─────────────────────────
const PressureRing: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  if (f < at) return null;
  const k = fadeIn(f, at);
  const b = 0.5 + 0.5 * Math.sin((f - at) * 0.22);
  const r = 150 + 30 * b;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: k }}>
      <circle cx={540} cy={1420} r={r} fill="rgba(143,208,255,0.18)" stroke="#f4f6f8" strokeWidth={16} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 540 + Math.cos(a) * (r - 60);
        const y1 = 1420 + Math.sin(a) * (r - 60);
        const x2 = 540 + Math.cos(a) * (r + 40 + 30 * b);
        const y2 = 1420 + Math.sin(a) * (r + 40 + 30 * b);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffd23f" strokeWidth={8} markerEnd="url(#ah)" />;
      })}
      <defs>
        <marker id="ah" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#ffd23f" />
        </marker>
      </defs>
      <text x={540} y={1430} textAnchor="middle" fontFamily={fonts.punch} fontWeight={900} fontSize={42} fill="#fff" stroke="#000" strokeWidth={6} paintOrder="stroke">
        FLIGHT {1 + Math.floor((f - at) / 28.5)}
      </text>
    </svg>
  );
};
export const SetWindow: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cracks = ramp(f, c.cracks + 4, c.cracks + 50, (x) => x);
  const round = ramp(f, c.round + 4, c.round + 16);
  const comet = f >= c.y1954;
  // the hero window of the Comet section sits ~0.4 m below the tube's side line, at x = 0
  const HW: V3 = [0, -0.41, 1.6];
  const cam: Cam = comet
    ? {
        pos: keys3(f, [
          [c.y1954, [3.2, 0.6, 7.5]],
          [c.cracks, [0.5, -0.3, 5.3]],
          [c.round + 10, [0.35, -0.35, 4.6]],
          [c.pressure, [0.25, -0.36, 4.4]],
        ]),
        look: keys3(f, [
          [c.y1954, [0, 0, 0]],
          [c.cracks, HW],
        ]),
        fov: 40,
      }
    : {
        pos: keys3(f, [
          [c.every, [70, 14, 60]],
          [c.y1954, [55, 10, 45]],
        ]),
        look: [0, 0, 2],
        fov: 38,
      };
  const breathe = 1 + 0.012 * Math.sin((f - c.every) * 0.22) * (f >= c.balloon ? 1 : 0);
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} high={1} clouds={-900} sun={comet ? [-3, 4, 6] : [200, 160, 140]} shadow={comet ? 8 : 60}>
        {comet ? (
          <CometSection round={round} cracks={cracks} />
        ) : (
          <group scale={[breathe, breathe, 1]}>
            <Airliner frame={f} lights />
          </group>
        )}
      </AirCanvas>
      {!comet ? <PressureRing f={f} at={c.balloon - 4} /> : null}
      {comet ? <Big x={540} y={400} text={"1954\nTHE COMET"} o={fadeIn(f, c.y1954)} size={96} color="#ffffff" /> : null}
      {f >= c.cracks + 10 && f < c.round ? <Big x={540} y={1450} text={"CRACKS START\nAT THE CORNERS"} o={fadeIn(f, c.cracks + 10)} size={74} color="#ff6b5e" /> : null}
      {f >= c.round + 6 ? <Big x={540} y={1450} text="ROUND." o={fadeIn(f, c.round + 6)} size={120} color="#5dfc8d" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── DOOR: 10 tonnes hold it shut, your friend tries anyway ─────────────────────────
const DOOR_P: V3 = [-2.8, 1.0, 0.9];
export const SetDoor: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.pressure, [0.6, 1.5, 2.6]],
      [c.cant, [0.2, 1.35, 2.2]],
      [c.food, [-0.2, 1.3, 2.0]],
    ]),
    look: keys3(f, [
      [c.pressure, [-2.6, 1.1, 0.6]],
      [c.cant, [-2.3, 1.1, 0.6]],
    ]),
    fov: 52,
  };
  const at = atOf(cam);
  const pDoor = at([DOOR_P[0], DOOR_P[1] + 0.9, DOOR_P[2]]);
  const tries = f >= c.cant;
  const arrows = fadeIn(f, c.tonnes);
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} indoor high={1}>
        <group position={[0, 0, -0.4]}>
          <Cabin rows={9} empty={(r) => r < 1} />
        </group>
        <group position={DOOR_P} rotation={[0, Math.PI / 2, 0]}>
          <CabinDoor handle={tries ? 0.3 + 0.25 * Math.max(0, Math.sin(t * 9)) : 0} />
        </group>
        {tries ? (
          <Model file="man_b.glb" anims={LIB1} clip="Push_Loop" t={t} p={[-2.05, 0, 0.9]} ry={-Math.PI / 2} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} />
        ) : null}
      </AirCanvas>
      {arrows > 0 && pDoor ? (
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, opacity: arrows }}>
          {[-120, 0, 120].map((dy) => (
            <path key={dy} d={`M ${pDoor.x - 260} ${pDoor.y + 260 + dy} L ${pDoor.x - 60} ${pDoor.y + 260 + dy} M ${pDoor.x - 100} ${pDoor.y + 220 + dy} L ${pDoor.x - 55} ${pDoor.y + 260 + dy} L ${pDoor.x - 100} ${pDoor.y + 300 + dy}`} stroke="#ffd23f" strokeWidth={14} fill="none" strokeLinecap="round" />
          ))}
        </svg>
      ) : null}
      {f >= c.tonnes ? <Big x={540} y={420} text={"≈ 10 TONNES\n20,000 LB"} o={fadeIn(f, c.tonnes)} size={92} color="#ffd23f" /> : null}
      {f >= c.tried ? <Stamp f={f} at={c.tried} text="HE TRIED." top={1420} size={96} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── MEAL: salt and sugar −30 %, tomato juice tastes amazing ─────────────────────────
const SEAT_ROW_Z = (r: number) => -r * 0.81;
export const SetMeal: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const row = 3;
  const sx = SEAT_X[7];
  const cam: Cam = {
    pos: keys3(f, [
      [c.food, [sx + 0.75, 1.5, SEAT_ROW_Z(row) + 0.2]],
      [c.tomato, [sx + 0.45, 1.12, SEAT_ROW_Z(row) - 0.12]],
    ]),
    look: keys3(f, [
      [c.food, [sx, 0.8, SEAT_ROW_Z(row) - 0.45]],
      [c.tomato, [sx + 0.13, 0.8, SEAT_ROW_Z(row) - 0.38]],
    ]),
    fov: 48,
  };
  const juice = 1 - 0.6 * ramp(f, c.tomato + 20, c.ocean);
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} indoor high={1}>
        <Cabin rows={9} empty={(r, s) => r === row && s === 7} />
        <Model file="man_b.glb" anims={LIB1} clip="Sitting_Idle_Loop" t={t} p={[sx, 0.02, SEAT_ROW_Z(row) - 0.05]} ry={Math.PI} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} />
        <Seat p={[sx, 0, SEAT_ROW_Z(row)]} />
        {/* the tray table of the seat in front */}
        <mesh position={[sx, 0.72, SEAT_ROW_Z(row) - 0.42]} castShadow receiveShadow>
          <boxGeometry args={[0.44, 0.02, 0.3]} />
          <meshStandardMaterial color="#7a828c" roughness={0.6} />
        </mesh>
        <MealTray p={[sx, 0.74, SEAT_ROW_Z(row) - 0.42]} juice={juice} />
      </AirCanvas>
      <TasteMeter f={f} at={c.taste + 4} tomato={c.tomato} />
    </AbsoluteFill>
  );
};

// ───────────────────────── STORM: lightning hits, the skin carries it around you and out the wicks ─────────────────────────
const bolt = (from: V3, to: V3, seed: number) => {
  const r = seeded(seed);
  const pts: THREE.Vector3[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const j = i === 0 || i === n ? 0 : 1;
    pts.push(new THREE.Vector3(from[0] + (to[0] - from[0]) * k + j * (r() - 0.5) * 14, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k + j * (r() - 0.5) * 14));
  }
  return pts;
};
export const SetStorm: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const strike = c.ocean + 12;
  const flash = f >= strike ? Math.max(0, 1 - (f - strike) / 6) + 0.6 * Math.max(0, 1 - Math.abs(f - strike - 14) / 3) : 0;
  const nose: V3 = [0, 0.5, -LENGTH / 2 + 0.5];
  const B = useMemo(() => bolt([-30, 260, -150], nose, 3), []); // eslint-disable-line react-hooks/exhaustive-deps
  const run = ramp(f, c.skin, c.skin + 40, (x) => x);
  // current path: nose → along the top → over the wing root → out to the right wing tip wicks
  const path = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let z = -LENGTH / 2 + 0.5; z <= -2; z += 2) pts.push(new THREE.Vector3(1.6, 2.9, z));
    for (let k = 0; k <= 1.0001; k += 0.1) pts.push(new THREE.Vector3(2.6 + k * (WICKS[3][0] - 2.6), -1.6 + k * (WICKS[3][1] + 1.6), -2 + k * (WICKS[3][2] + 2)));
    return pts;
  }, []);
  const wick = fadeIn(f, c.wicks) * (0.6 + 0.4 * Math.sin(t * 30));
  const cam: Cam = {
    pos: keys3(f, [
      [c.ocean, [-60, 30, -95]],
      [c.skin, [-46, 34, -40]],
      [c.wicks, [44, 10, 46]],
    ]),
    look: keys3(f, [
      [c.ocean, [0, 10, -10]],
      [c.skin, [0, 0, 0]],
      [c.wicks, [20, 0, 10]],
    ]),
    fov: 40,
  };
  const at = atOf(cam);
  const pWick = at([WICKS[3][0], WICKS[3][1], WICKS[3][2]]);
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} night={0.85} high={1} clouds={-260} cloudTint="#5a6478" flash={flash} sun={[120, 200, 60]}>
        <Airliner frame={f} lights>
          <StaticWicks glow={wick} />
        </Airliner>
        {/* storm clouds around */}
        <CloudDeck y={180} c={[0, -200]} size={2400} n={140} tint="#3a4258" flash={flash} seed={9} />
        {f >= strike && f < strike + 10 ? <TubePath points={B} progress={1} radius={0.5} color="#e8f0ff" /> : null}
        {f >= strike && f < strike + 10 ? <Glow position={nose} size={30 * flash + 6} color="#cfe0ff" opacity={0.9} /> : null}
        {run > 0 && f < c.toilet ? <TubePath points={path} progress={run} radius={0.22} color="#9fe0ff" /> : null}
      </AirCanvas>
      {f >= c.yearly ? <Big x={540} y={420} text={"≈ ONCE\nA YEAR"} o={fadeIn(f, c.yearly)} size={100} color="#cfe0ff" /> : null}
      {f >= c.wicks + 6 && pWick ? <Tag x={pWick.x} y={pWick.y} text="STATIC WICKS" color="#9fe0ff" side="left" o={fadeIn(f, c.wicks + 6)} size={34} /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── LAVATORY: no smoking — and an ashtray ─────────────────────────
export const SetLav: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.toilet, [0.25, 1.62, 0.55]],
      [c.ashtray - 8, [0.2, 1.5, 0.3]],
      [c.ashtray + 4, [0.05, 1.3, 0.1]],
      [c.law, [0.15, 1.5, -0.2]],
      [c.anyway + 4, [-0.25, 1.3, 0.45]],
    ]),
    look: keys3(f, [
      [c.toilet, [0.0, 0.75, -0.45]],
      [c.ashtray - 8, [-0.1, 1.1, 0.7]],
      [c.ashtray + 4, [-0.22, 1.02, 0.7]],
      [c.law, [-0.1, 1.2, 0.7]],
      [c.anyway + 4, [0.16, 0.66, 0.12]],
    ]),
    fov: keys(f, [
      [c.toilet, 64],
      [c.ashtray + 4, 40],
      [c.law, 58],
    ]),
  };
  const binFire = f >= c.anyway + 18;
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} indoor ao={0}>
        <Lavatory ashOpen={ramp(f, c.ashtray + 6, c.ashtray + 16)} binFire={binFire} />
      </AirCanvas>
      {f >= c.ashtray + 4 && f < c.law ? <Stamp f={f} at={c.ashtray + 4} text="ASHTRAY?!" top={360} size={100} color="#ffd23f" /> : null}
      {f >= c.banned && f < c.law ? <Big x={540} y={1500} text={"SMOKING BANNED\nSINCE 2000 (US)"} o={fadeIn(f, c.banned)} size={70} color="#ff6b5e" /> : null}
      <LawCard f={f} at={c.law + 4} />
      {binFire ? <Big x={540} y={420} text="BIN = FIRE" o={fadeIn(f, c.anyway + 18)} size={100} color="#ff8a3a" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── TAIL: the black box — it's orange ─────────────────────────
export const SetTail: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const ghost = ramp(f, c.box, c.box + 16);
  const fire = f >= c.survives;
  const char = ramp(f, c.fire + 6, c.screen, (x) => x);
  const cam: Cam = fire
    ? {
        pos: keys3(f, [
          [c.survives, [2.2, 1.3, 2.6]],
          [c.screen, [1.8, 1.0, 2.0]],
        ]),
        look: [0, 0.3, 0],
        fov: 40,
      }
    : {
        pos: keys3(f, [
          [c.wrong, [-46, 6, 70]],
          [c.box, [-20, -1, 40]],
          [c.orange, [-6.5, -0.2, 29.5]],
        ]),
        look: keys3(f, [
          [c.wrong, [0, 2, 10]],
          [c.orange, [0, 0.9, 27]],
        ]),
        fov: 40,
      };
  return (
    <AbsoluteFill>
      {fire ? (
        <AirCanvas cam={cam} t={t} night={1} ao={0.6}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#1c1a18" roughness={1} />
          </mesh>
          <FlightRecorder char={char} beacon={0.6 + 0.4 * Math.sin(t * 8)} />
          <Flames frame={f} count={26} spread={[1.8, 0, 1.4]} height={1.6} intensity={1} />
          <pointLight position={[0, 1.2, 0.6]} intensity={30} distance={8} color="#ff8a3a" />
        </AirCanvas>
      ) : (
        <AirCanvas cam={cam} t={t} high={1} clouds={-900} sun={[-200, 160, 140]}>
          <Airliner frame={f} ghost={ghost} lights>
            <group position={[0, 0.9, 27]} rotation={[0, Math.PI / 2, 0]} scale={0.45}>
              <FlightRecorder beacon={ghost} />
            </group>
            {ghost > 0.1 ? <Glow position={[0, 1.1, 27]} size={3 * ghost} color="#ff8a3a" opacity={0.6 * ghost} /> : null}
          </Airliner>
        </AirCanvas>
      )}
      {f >= c.orange && !fire ? <Stamp f={f} at={c.orange} text="IT'S ORANGE." top={1380} size={96} color="#ff8a3a" /> : null}
      <BlackBoxSpecs f={f} at={c.survives + 2} fire={c.fire} />
    </AbsoluteFill>
  );
};

// ───────────────────────── MAP: a tiny plane crawling over the ocean ─────────────────────────
/** the cabin with the satellite flight map on every seat back (loads the Earth day map inside the canvas) */
const MapCabin: React.FC<{ k: number }> = ({ k }) => {
  const earth = useLoader(THREE.TextureLoader, staticFile("textures/earth_day.jpg"));
  return <Cabin rows={4} screen={flightMapTex(k, earth.image as HTMLImageElement)} />;
};
export const SetMap: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const k = 0.47 + 0.004 * ramp(f, c.screen, c.later, (x) => x);
  const cam: Cam = {
    pos: keys3(f, [
      [c.screen, [0.6, 1.25, 1.4]],
      [c.crawling, [0.27, 1.04, 1.0]],
    ]),
    look: [0.25, 0.98, 0.33],
    fov: 40,
  };
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} indoor high={1} night={0.3}>
        <MapCabin k={k} />
      </AirCanvas>
      {f >= c.crawling + 10 ? <Big x={540} y={1500} text={"9 HOURS\nLATER…"} o={fadeIn(f, c.crawling + 10)} size={84} color="#ffffff" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── AUSTRALIA: sunrise, grandma kept it safe ─────────────────────────
const Garden: React.FC<{ t: number; worn: boolean }> = ({ t, worn }) => {
  const grass = tex("grass", "#6f8a3a", [30, 30]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial map={grass} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 14]} receiveShadow>
        <planeGeometry args={[300, 7]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.9} />
      </mesh>
      <House p={[0, 0, -6]} siding="#e8dcc0" lit={0.2} seed={4} />
      <GumTree p={[-9, 0, -4]} s={1.1} seed={2} />
      <GumTree p={[11, 0, -9]} s={1.3} seed={5} />
      <GumTree p={[-20, 0, -14]} s={1.5} seed={8} />
      <KangarooSign p={[5.5, 0, 10.6]} ry={-0.4} />
      <Car p={[-6, 0, 14]} color="#d8d8d0" ry={Math.PI / 2} />
      {/* grandma: first next to the puh on her garden table, then wearing it (she only wore it twice) */}
      {worn ? (
        <Model file="woman_c.glb" anims={LIB1} clip="Dance_Loop" t={t} p={[0.8, 0, 2.2]} ry={0.35} outfit={GRANDMA} tint={{ Hair: "#d9d9d9" }} attach={{ bone: "Head", node: <FursuitHead s={MASK_S * 0.95} t={t} p={[0, -0.2, 0.03]} /> }} />
      ) : (
        <>
          <Model file="woman_c.glb" anims={LIB1} clip="Idle_Talking_Loop" t={t} p={[0.8, 0, 2.2]} ry={0.35} outfit={GRANDMA} tint={{ Hair: "#d9d9d9" }} />
          <group position={[1.9, 0.42, 2.5]}>
            <FursuitHead s={MASK_S} t={t} />
          </group>
        </>
      )}
      <mesh position={[1.9, 0.38, 2.5]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.04, 24]} />
        <meshStandardMaterial color="#f2f0ea" roughness={0.6} />
      </mesh>
      <mesh position={[1.9, 0.19, 2.5]}>
        <cylinderGeometry args={[0.03, 0.03, 0.38, 8]} />
        <meshStandardMaterial color="#8a8f96" metalness={0.7} roughness={0.4} />
      </mesh>
      <Model file="man_b.glb" anims={LIB2} clip={worn ? "Idle_No_Loop" : "Idle_FoldArms_Loop"} t={t} p={[-0.6, 0, 3.4]} ry={2.6} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} />
    </group>
  );
};
export const SetAustralia: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const land = ramp(f, c.later - 6, c.grandma - 4, (x) => x);
  const cam: Cam = {
    pos: keys3(f, [
      [c.later, [14, 5, 26]],
      [c.grandma, [4.8, 1.9, 8.6]],
      [c.wore, [3.6, 1.75, 6.6]],
      [c.back, [3.2, 1.7, 6.0]],
    ]),
    look: keys3(f, [
      [c.later, [-20, 22, -60]],
      [c.grandma, [0.8, 1.2, 2.6]],
      [c.wore, [0.8, 1.35, 2.3]],
    ]),
    fov: 42,
  };
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} dusk={0.35} sun={[220, 70, 60]} fog={0.6}>
        <Garden t={t} worn={f >= c.wore} />
        {f < c.grandma + 10 ? (
          <group position={[-60 + 140 * land, 90 - 70 * land, -260]} rotation={[0.05, -Math.PI / 2, 0]}>
            <Airliner frame={f} gear lights />
          </group>
        ) : null}
      </AirCanvas>
      {f >= c.later && f < c.wore ? <Big x={540} y={400} text={"SYDNEY\n20 H LATER"} o={fadeIn(f, c.later)} size={88} color="#ffd23f" /> : null}
      {f >= c.wore + 18 ? <Stamp f={f} at={c.wore + 18} text="ONLY TWICE." top={1420} size={100} color="#ff6aa8" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── SEAT: too big for the bin → its own seat (like a cello) ─────────────────────────
export const SetSeat: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const row = 2;
  const binTry = f < c.seat;
  const cam: Cam = binTry
    ? { pos: [0.2, 1.6, 0.6], look: [-1.6, 1.9, -1.6], fov: 50 }
    : {
        pos: keys3(f, [
          [c.seat, [-1.0, 1.4, SEAT_ROW_Z(row) + 1.5]],
          [c.sleeps, [-1.3, 1.3, SEAT_ROW_Z(row) + 1.3]],
        ]),
        look: [-2.2, 0.95, SEAT_ROW_Z(row)],
        fov: 46,
      };
  const push = Math.max(0, Math.sin(t * 6)) * 0.08;
  const asleep = f >= c.sleeps;
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} indoor high={1} night={asleep ? 0.6 : 0}>
        <Cabin rows={8} empty={(r, s) => r === row && (s === 0 || s === 1)} lights={asleep ? 0.35 : 1} night={asleep} />
        {binTry ? (
          <>
            <group position={[-1.62 + push, 1.78, -1.6]} rotation={[0, 0.6, 0]}>
              <FursuitHead s={MASK_S} t={t} />
            </group>
            <mesh position={[-1.62, 2.55, -1.6]} rotation={[0, 0, -0.9]}>
              <boxGeometry args={[0.04, 0.55, 1.6]} />
              <meshStandardMaterial color="#f4f5f6" roughness={0.6} />
            </mesh>
          </>
        ) : (
          <>
            <Seat p={[SEAT_X[0], 0, SEAT_ROW_Z(row)]} />
            <Seat p={[SEAT_X[1], 0, SEAT_ROW_Z(row)]} />
            <group position={[SEAT_X[0], 0.82, SEAT_ROW_Z(row) + 0.05]}>
              <FursuitHead s={MASK_S * 0.95} t={t} />
            </group>
            {/* its seat belt */}
            <mesh position={[SEAT_X[0], 0.6, SEAT_ROW_Z(row) - 0.2]}>
              <boxGeometry args={[0.46, 0.04, 0.02]} />
              <meshStandardMaterial color="#3a3f47" roughness={0.6} />
            </mesh>
            <Model file="man_b.glb" anims={LIB1} clip="Sitting_Idle_Loop" t={t} p={[SEAT_X[1], 0.02, SEAT_ROW_Z(row) - 0.05]} ry={Math.PI} outfit={FRIEND} tint={{ Hair: "#1a1a1a" }} bonePose={asleep ? { Head: [0.25, 0, 0.45], neck_01: [0.1, 0, 0.2] } : undefined} />
          </>
        )}
      </AirCanvas>
      {binTry && f >= c.back + 20 ? <Stamp f={f} at={c.back + 20} text="DOESN'T FIT." top={1420} size={96} /> : null}
      <BoardingPass f={f} at={c.cellos} swap={c.katz + 22} />
      {asleep ? <Big x={540} y={420} text="Z z z" o={fadeIn(f, c.sleeps + 6)} size={110} color="#cfe0ff" /> : null}
    </AbsoluteFill>
  );
};

// ───────────────────────── FINALE: the 400-tonne metal tube at sunset ─────────────────────────
export const SetFinale: React.FC<SetProps> = ({ f }) => {
  const t = f / 30;
  const cam: Cam = {
    pos: keys3(f, [
      [c.congrats, [-70, 10, -40]],
      [c.callIt, [-95, 16, 20]],
      [c.airplane + 80, [-110, 22, 60]],
    ]),
    look: [0, 2, 0],
    fov: 38,
  };
  return (
    <AbsoluteFill>
      <AirCanvas cam={cam} t={t} dusk={0.85} high={1} clouds={-600} sun={[-300, 60, -400]}>
        <Airliner frame={f} lights />
      </AirCanvas>
      {f >= c.tube ? <Big x={540} y={1450} text={"400 TONNES\n880,000 LB"} o={fadeIn(f, c.tube)} size={80} color="#ffd23f" /> : null}
      {f >= c.callIt ? <Big x={540} y={380} text={"THE\nAIRPLANE"} o={fadeIn(f, c.callIt)} size={130} color="#ffffff" /> : null}
    </AbsoluteFill>
  );
};
