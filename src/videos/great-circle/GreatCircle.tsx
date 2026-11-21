import React, { useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import words from "../../../public/great-circle/words.json";
import landDots from "../../../public/data/land-dots.json";
import { Captions } from "../../lib/Captions";
import { FilmLook, NightBackdrop } from "../../lib/Backdrop";
import { StatPill } from "../../lib/Hud";
import { LoopBridge } from "../../lib/Loop";
import { fonts, palettes } from "../../lib/theme";
import { keys, keys3, makeCues, ramp } from "../../lib/timing";
import { Cam, CameraRig, Glow, project, Stars3D, ThinLine, TubePath } from "../../lib/three/core";
import { PlaneModel } from "../../lib/three/PlaneModel";
import { circleAround, CITIES, graticule, greatCircle, LL, NYC, place, rhumb, TYO } from "./geo";

const P = palettes.night;
export const cue = makeCues(words, 30);
export const DURATION = cue.voiceEnd + 8;

const GC = greatCircle(NYC, TYO);
const RH = rhumb(NYC, TYO);
const GRID = graticule(20);
const ARCTIC: LL[] = Array.from({ length: 181 }, (_, i) => [66.56, -180 + i * 2] as LL);
const TISSOT: LL[][] = [0, 30, 55, 72].flatMap((lat) => [-30, 30].map((dl) => circleAround([lat, -147 + dl], 6)));

// ---------- timeline: every value is a pure function of the frame, anchored to spoken cues ----------
const c = {
  map: cue.at("On a map"),
  looks: cue.at("Looks like"),
  lying: cue.at("lying"),
  ball: cue.at("Earth is a ball"),
  flatten: cue.at("Flatten it"),
  stretched: cue.at("stretched"),
  straightLine: cue.at("That straight line"),
  n12800: cue.at("12,800"),
  curve: cue.at("The curve"),
  n10900: cue.at("10,900"),
  globe: cue.at("On the globe"),
  great: cue.at("great circle"),
  airlines: cue.at("Airlines"),
  arctic: cue.at("Arctic"),
  end: DURATION,
};

const CAM_OPEN: [number, number, number][] = [
  [0, -0.35, 4.7],
  [0, 0.2, 0],
];
const CAM_MAP: [number, number, number][] = [
  [0, -1.3, 7.3],
  [0, 0.3, 0],
];

const timeline = (f: number) => {
  const morph = keys(f, [
    [c.map - 2, 0],
    [c.map + 20, 1],
    [c.ball - 2, 1],
    [c.ball + 18, 0],
    [c.flatten, 0],
    [c.flatten + 20, 1],
    [c.globe - 2, 1],
    [c.globe + 22, 0],
  ]);
  const tilt = keys(f, [
    [0, 0.5],
    [c.ball, 0.5],
    [c.ball + 18, 0.6],
    [c.globe, 0.6],
    [c.globe + 22, 1.05],
    [c.airlines, 1.05],
    [c.end - 2, 0.5],
  ]);
  const spin = keys(f, [
    [0, 0.0],
    [c.map, -0.1],
    [c.ball, -0.1],
    [c.flatten, 0.05],
    [c.globe, 0.05],
    [c.airlines, -0.05],
    [c.end - 2, 0],
  ]);
  const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, spin, 0, "XYZ"));

  const camKeys = (i: 0 | 1) =>
    keys3(f, [
      [0, CAM_OPEN[i]],
      [8, CAM_OPEN[i]],
      [c.map - 2, i === 0 ? [0, -0.1, 4.0] : CAM_OPEN[i]],
      [c.map + 22, CAM_MAP[i]],
      [c.ball - 2, i === 0 ? [0.25, -1.05, 6.6] : [0.1, 0.4, 0]],
      [c.ball + 18, i === 0 ? [0, -0.1, 4.6] : [0, 0.05, 0]],
      [c.flatten, i === 0 ? [0, -0.1, 4.6] : [0, 0.05, 0]],
      [c.flatten + 22, CAM_MAP[i]],
      [c.globe - 2, CAM_MAP[i]],
      [c.globe + 24, i === 0 ? [0, -0.1, 4.1] : [0, 0.12, 0]],
      [c.airlines, i === 0 ? [0, -0.1, 4.1] : [0, 0.12, 0]],
      [c.end - 2, CAM_OPEN[i]],
    ]);
  // "the map is lying" — a short, decaying camera shake
  const shakeT = f - c.lying;
  const shake = shakeT >= 0 && shakeT < 14 ? Math.sin(shakeT * 2.6) * 0.05 * (1 - shakeT / 14) : 0;
  const pos = camKeys(0);
  const cam: Cam = { pos: [pos[0] + shake, pos[1], pos[2]], look: camKeys(1), fov: 40 };

  const gcProg = keys(f, [
    [4, 0],
    [cue.end("straight"), 1],
  ]);
  const planeT = keys(
    f,
    [
      [0, 0.02],
      [c.map, 0.5],
      [c.airlines, 0.5],
      [c.end, 0.98],
    ],
    (x) => x,
  );
  const rhProg = keys(f, [
    [c.looks, 0],
    [c.looks + 22, 1],
  ]);
  const tissot = keys(f, [
    [c.ball, 0],
    [c.ball + 10, 1],
    [c.straightLine - 6, 1],
    [c.straightLine + 4, 0],
  ]);
  // which line is "talking": 1 = full, dims the other one
  const rhFocus = keys(f, [
    [c.straightLine - 2, 0],
    [c.straightLine + 6, 1],
    [c.curve - 2, 1],
    [c.curve + 6, 0],
  ]);
  const gcFocus = keys(f, [
    [c.curve - 2, 0],
    [c.curve + 6, 1],
    [c.globe, 1],
    [c.globe + 8, 0],
  ]);
  const rhOpacity = Math.min(
    1 - 0.65 * gcFocus - 0.55 * tissot,
    1 - ramp(f, c.airlines, c.airlines + 18),
  );
  const gcOpacity = 1 - 0.65 * rhFocus - 0.55 * tissot;
  const arctic = keys(f, [
    [c.arctic - 2, 0],
    [c.arctic + 10, 1],
    [c.looks + 10, 1],
    [c.looks + 24, 0],
  ]);
  return { morph, rot, cam, gcProg, planeT, rhProg, tissot, rhOpacity, gcOpacity, arctic };
};

// ---------- 3D world ----------
const DotEarth: React.FC<{ morph: number; rot: THREE.Quaternion }> = ({ morph, rot }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(landDots.length * 3), 3));
    return g;
  }, []);
  const arr = geo.getAttribute("position") as THREE.BufferAttribute;
  (landDots as LL[]).forEach((ll, i) => {
    const v = place(ll, morph, rot);
    arr.setXYZ(i, v.x, v.y, v.z);
  });
  arr.needsUpdate = true;
  geo.computeBoundingSphere();
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.018 + 0.016 * morph} color="#8ea2ff" transparent opacity={0.6 + 0.25 * morph} depthWrite={false} />
    </points>
  );
};

const atmosphereMat = new THREE.ShaderMaterial({
  uniforms: { uOpacity: { value: 1 }, uColor: { value: new THREE.Color("#4d6bff") } },
  vertexShader: `varying vec3 vN; varying vec3 vV;
    void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform float uOpacity; uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
    void main(){ float fr = pow(1. - max(dot(vN, vV), 0.), 2.6); gl_FragColor = vec4(uColor*fr*1.6, fr*uOpacity); }`,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const s = timeline(frame);
  const at = (ll: LL, alt = 0) => place(ll, s.morph, s.rot, alt);
  const arcAlt = (i: number, n: number) => 0.012 + 0.06 * Math.sin((Math.PI * i) / (n - 1));
  const gcPts = GC.map((ll, i) => at(ll, arcAlt(i, GC.length)));
  const rhPts = RH.map((ll, i) => at(ll, arcAlt(i, RH.length) * 0.4));

  // plane on the great circle, nose along the path, belly toward the surface
  const pi = Math.min(GC.length - 2, Math.floor(s.planeT * (GC.length - 1)));
  const p0 = gcPts[pi];
  const p1 = gcPts[pi + 1];
  const up = p0.clone().normalize().lerp(new THREE.Vector3(0, 0, 1), s.morph).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(p0, p1, up));
  const atmo = atmosphereMat.clone();
  atmo.uniforms.uOpacity.value = 1 - s.morph;

  const labels = [
    { ll: NYC, text: "New York" },
    { ll: TYO, text: "Tokyo" },
  ];
  return (
    <AbsoluteFill>
      <NightBackdrop palette={P} horizonY={0.98} stars={90} />
      <ThreeCanvas width={width} height={height} camera={{ fov: 40, near: 0.01, far: 200 }}>
        <CameraRig cam={s.cam} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.6} />
        <Stars3D frame={frame} count={700} radius={30} size={0.09} />
        {s.morph < 0.5 ? (
          <mesh>
            <sphereGeometry args={[0.985, 64, 48]} />
            <meshBasicMaterial color="#070b1f" />
          </mesh>
        ) : null}
        <mesh scale={1.06} material={atmo}>
          <sphereGeometry args={[1, 64, 48]} />
        </mesh>
        {GRID.map((line, i) => (
          <ThinLine key={i} points={line.map((ll) => at(ll, 0.001))} color="#3c4f9c" opacity={0.28} />
        ))}
        <DotEarth morph={s.morph} rot={s.rot} />
        {CITIES.map((ll, i) => (
          <Glow key={i} position={at(ll, 0.004)} size={i < 2 ? 0.16 : 0.07} color={P.glow} opacity={i < 2 ? 1 : 0.7} />
        ))}
        {s.tissot > 0
          ? TISSOT.map((circle, i) => (
              <TubePath key={i} points={circle.map((ll) => at(ll, 0.006))} radius={0.006} color="#66e0ff" opacity={s.tissot} glow={false} />
            ))
          : null}
        {s.arctic > 0 ? (
          <TubePath points={ARCTIC.map((ll) => at(ll, 0.004))} radius={0.005} color="#7fe3ff" opacity={s.arctic * 0.85} glow={false} />
        ) : null}
        <TubePath points={rhPts} progress={s.rhProg} radius={0.009} color={P.accent2} opacity={s.rhOpacity} />
        <TubePath points={gcPts} progress={s.gcProg} radius={0.011} color={P.accent} opacity={s.gcOpacity} />
        <group position={p0} quaternion={q} scale={0.05}>
          <PlaneModel frame={frame} landingLight />
        </group>
      </ThreeCanvas>
      {labels.map(({ ll, text }) => {
        const pt = project(at(ll, 0.01), s.cam, width, height);
        if (!pt) return null;
        return <CityPill key={text} x={pt.x} y={pt.y} text={text} />;
      })}
      <GreatCircleTag frame={frame} pos={project(gcPts[Math.floor(GC.length / 2)], s.cam, width, height)} />
    </AbsoluteFill>
  );
};

const CityPill: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <div
    style={{
      position: "absolute",
      left: Math.max(110, Math.min(1080 - 110, x)),
      top: y + 26,
      transform: "translate(-50%,0)",
      padding: "6px 16px",
      borderRadius: 14,
      background: "rgba(10,12,28,0.82)",
      border: `2px solid ${P.accent}`,
      color: "#fff",
      fontFamily: fonts.ui,
      fontWeight: 600,
      fontSize: 30,
      whiteSpace: "nowrap",
      boxShadow: `0 0 18px ${P.accent}55`,
    }}
  >
    {text}
  </div>
);

const GreatCircleTag: React.FC<{ frame: number; pos: { x: number; y: number } | null }> = ({ frame, pos }) => {
  const o = ramp(frame, c.great, c.great + 6) * (1 - ramp(frame, c.airlines + 10, c.airlines + 20));
  if (!pos || o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y - 90,
        transform: `translate(-50%,0) scale(${0.9 + 0.1 * o})`,
        opacity: o,
        padding: "6px 18px",
        borderRadius: 10,
        background: P.accent,
        color: "#16110a",
        fontFamily: fonts.punch,
        fontWeight: 800,
        fontSize: 34,
        letterSpacing: 2,
      }}
    >
      GREAT CIRCLE
    </div>
  );
};

// ---------- composition ----------
export const GreatCircle: React.FC = () => (
  <AbsoluteFill style={{ background: P.bgBottom }}>
    <World />
    <StatPill at={c.n12800} until={c.globe} from={0} value={12800} countFrames={20} unit="km" palette={P} color={P.accent2} top={330} />
    <StatPill at={c.n10900} until={c.globe} from={0} value={10900} countFrames={20} unit="km" palette={P} top={470} />
    <LoopBridge frames={16} opening={<World />} />
    <FilmLook />
    <Captions words={words} palette={P} variant="karaoke" highlight={["lying.", "Arctic.", "shortcut."]} />
    <Audio src={staticFile("great-circle/vo.mp3")} />
  </AbsoluteFill>
);
