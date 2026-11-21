import React, { useMemo } from "react";
import { useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, CameraRig, Glow, Stars3D, V3 } from "../../lib/three/core";
import { Env, KeyLight, Post } from "../../lib/three/diorama";
import { usePbr } from "../../lib/three/pbr";
import { seeded } from "../../lib/timing";

/**
 * Giza, metres. North = −Z, east = +X, the Great Pyramid's centre at the origin.
 * East of the plateau: green fields, the Nile (a north–south ribbon) and the pale Tura limestone cliffs on the far bank.
 */
export const NILE = { x: 1150, w: 260 };
export const FIELDS = { x0: 760, x1: 1750 };
export const CLIFF_X = 2050;


/** Sky: desert blue by day → orange horizon at dusk → deep blue night. `night` darkens everything after dusk. */
const Sky: React.FC<{ dusk: number; night: number }> = ({ dusk, night }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uGlow: { value: 0 } },
        vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform float uGlow; varying vec3 vD;
          void main(){
            float k = smoothstep(-0.02, 0.32, vD.y);
            vec3 c = mix(uHor, uTop, k);
            float w = pow(max(0.0, dot(normalize(vec3(vD.x, 0.0, vD.z)), normalize(vec3(-1.0, 0.0, 0.35)))), 3.0) * (1.0 - smoothstep(0.0, 0.35, vD.y));
            c += vec3(1.0, 0.45, 0.15) * w * uGlow;
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  );
  const top = new THREE.Color("#3f86d6").lerp(new THREE.Color("#2b2a5a"), dusk).lerp(new THREE.Color("#060a1c"), night);
  const hor = new THREE.Color("#d3e2ee").lerp(new THREE.Color("#ffa060"), dusk).lerp(new THREE.Color("#1a2340"), night);
  mat.uniforms.uTop.value.copy(top);
  mat.uniforms.uHor.value.copy(hor);
  mat.uniforms.uGlow.value = 0.9 * dusk * (1 - night);
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[15000, 32, 16]} />
    </mesh>
  );
};

/** Height of the open desert: flat plateau near the pyramids, long low dunes further west and south, the drop to the valley in the east. */
export const groundH = (x: number, z: number) => {
  const r = Math.hypot(x, z);
  const far = THREE.MathUtils.smoothstep(r, 1100, 2600) * (1 - THREE.MathUtils.smoothstep(x, 300, 500));
  const dunes = 18 * (0.5 + 0.5 * Math.sin(x * 0.0042 + Math.sin(z * 0.0021) * 2.2)) * (0.6 + 0.4 * Math.sin(z * 0.0031 + 1.3));
  // the drop into the valley (below the fields and the river), then the east-bank desert up to the cliffs
  const valley = -14 * THREE.MathUtils.smoothstep(x, 520, FIELDS.x0) + 4 * THREE.MathUtils.smoothstep(x, FIELDS.x1, FIELDS.x1 + 150);
  return far * dunes + valley;
};

/** A green field texture: strips of crops and irrigation ditches. */
const fieldTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const S = 512;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    const r = seeded(5);
    for (let y = 0; y < S; y += 32) {
      for (let x = 0; x < S; x += 64) {
        const v = r();
        g.fillStyle = v < 0.2 ? "#8a9a3a" : v < 0.5 ? "#4f7a2a" : v < 0.8 ? "#3d6a26" : "#6b8a34";
        g.fillRect(x, y, 64, 32);
      }
    }
    g.strokeStyle = "rgba(60,50,30,0.5)";
    g.lineWidth = 2;
    for (let y = 0; y <= S; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(S, y);
      g.stroke();
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(18, 120);
    t.anisotropy = 8;
    return t;
  };
})();

/** Ripples on the river, scrolled by time. */
const waterTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const S = 256;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    g.fillStyle = "#4a7672";
    g.fillRect(0, 0, S, S);
    const r = seeded(9);
    for (let i = 0; i < 500; i++) {
      const v = r();
      g.strokeStyle = v < 0.5 ? "rgba(170,200,190,0.22)" : "rgba(30,60,60,0.25)";
      g.lineWidth = 1 + r() * 2;
      const x = r() * S;
      const y = r() * S;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 6, y - 2, x + 14 + r() * 10, y);
      g.stroke();
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 120);
    return t;
  };
})();

/** Date palms along both banks: instanced trunks and fronds. */
const Palms: React.FC = () => {
  const { trunk, frond, mats } = useMemo(() => {
    const pts: V3[] = [];
    const r = seeded(31);
    for (let i = 0; i < 420; i++) {
      const bank = r() < 0.55 ? -1 : 1;
      const x = NILE.x + bank * (NILE.w / 2 + 12 + Math.pow(r(), 2) * 420);
      const z = -5000 + r() * 10000;
      pts.push([x, 0, z]);
    }
    const trunkG = new THREE.CylinderGeometry(0.22, 0.38, 1, 7, 1);
    trunkG.translate(0, 0.5, 0);
    const frondG = new THREE.PlaneGeometry(1, 0.9, 6, 1);
    // bend each frond down along its length
    const pa = frondG.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i) + 0.5;
      pa.setXYZ(i, x * 5.2, -x * x * 2.2, pa.getY(i) * (1.2 - x * 0.9));
    }
    frondG.rotateX(-0.15);
    frondG.computeVertexNormals();
    const trunkM = new THREE.MeshStandardMaterial({ color: "#7a5d3e", roughness: 0.95 });
    const frondM = new THREE.MeshStandardMaterial({ color: "#4e7a32", roughness: 0.8, side: THREE.DoubleSide });
    const trunkI = new THREE.InstancedMesh(trunkG, trunkM, pts.length);
    const frondI = new THREE.InstancedMesh(frondG, frondM, pts.length * 9);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let k = 0;
    pts.forEach((p, i) => {
      const h = 9 + r() * 9;
      const lean = (r() - 0.5) * 0.25;
      q.setFromEuler(new THREE.Euler(lean, 0, (r() - 0.5) * 0.2));
      m.compose(new THREE.Vector3(...p), q, new THREE.Vector3(1, h, 1));
      trunkI.setMatrixAt(i, m);
      const top = new THREE.Vector3(0, h, 0).applyQuaternion(q).add(new THREE.Vector3(...p));
      for (let j = 0; j < 9; j++) {
        const a = (j / 9) * Math.PI * 2 + r() * 0.5;
        q.setFromEuler(new THREE.Euler(0, a, (r() - 0.5) * 0.3, "YXZ"));
        const s = 0.8 + r() * 0.4;
        m.compose(top, q, new THREE.Vector3(s, s, s));
        frondI.setMatrixAt(k++, m);
      }
    });
    trunkI.castShadow = frondI.castShadow = true;
    return { trunk: trunkI, frond: frondI, mats: [trunkM, frondM] };
  }, []);
  void mats;
  return (
    <>
      <primitive object={trunk} />
      <primitive object={frond} />
    </>
  );
};

/** The Tura cliffs on the east bank: a long pale limestone escarpment with ledges. */
const Cliffs: React.FC = () => {
  const rock = usePbr("coast_sand_rocks_02", [60, 4]);
  const geo = useMemo(() => {
    const nz = 260;
    const nx = 16;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    for (let j = 0; j <= nx; j++) {
      for (let i = 0; i <= nz; i++) {
        const z = -6000 + (i / nz) * 12000;
        const k = j / nx;
        const gully = Math.pow(Math.abs(Math.sin(z * 0.0105 + Math.sin(z * 0.003) * 2)), 10);
        const x = CLIFF_X + k * 500 + 30 * Math.sin(z * 0.004) + 26 * gully * (1 - k);
        const face = THREE.MathUtils.smoothstep(k, 0.0, 0.07);
        const h = face * (105 + 28 * Math.sin(z * 0.0023 + 1) + 12 * Math.sin(z * 0.013)) * (1 - 0.25 * gully) + Math.floor(face * 5) * 3;
        pos.push(x, h - 10, z);
        uv.push(i / nz, k);
      }
    }
    for (let j = 0; j < nx; j++)
      for (let i = 0; i < nz; i++) {
        const a = j * (nz + 1) + i;
        const b = a + nz + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    // limestone strata: pale and darker bands by height, darker gullies and a weathered brown top
    const col = new Float32Array((pos.length / 3) * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < pos.length / 3; i++) {
      const y = pos[i * 3 + 1];
      const z = pos[i * 3 + 2];
      const band = 0.5 + 0.5 * Math.sin(y * 0.55 + Math.sin(z * 0.02) * 0.8);
      const gully = Math.pow(Math.abs(Math.sin(z * 0.0105 + Math.sin(z * 0.003) * 2)), 10);
      tmp.set("#eadcc0").lerp(new THREE.Color("#b89a72"), band * 0.55 + gully * 0.3);
      if (uv[i * 2 + 1] > 0.08) tmp.lerp(new THREE.Color("#c4a274"), 0.6);
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow castShadow>
      <meshStandardMaterial normalMap={rock.normalMap} roughnessMap={rock.roughnessMap} vertexColors roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
};

/** Sand detail, 40 m per tile: wind ripples, speckles, small stones (multiplied over the macro vertex colours). */
const sandTex = (() => {
  let t: THREE.Texture | null = null;
  return () => {
    if (t) return t;
    const S = 512;
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d")!;
    const r = seeded(31);
    g.fillStyle = "#f4ece0";
    g.fillRect(0, 0, S, S);
    // soft tone blotches
    for (let i = 0; i < 90; i++) {
      const x = r() * S, y = r() * S, rad = 20 + r() * 70;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const l = r() < 0.5 ? "rgba(150,110,70,0.06)" : "rgba(255,250,240,0.08)";
      gr.addColorStop(0, l);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // wind ripples: wavy darker lines across the tile (tileable: whole periods across S)
    g.lineWidth = 2;
    for (let j = 0; j < 42; j++) {
      const y0 = (j / 42) * S;
      g.strokeStyle = `rgba(120,84,48,${0.10 + r() * 0.1})`;
      g.beginPath();
      for (let x = 0; x <= S; x += 8) {
        const y = y0 + 4 * Math.sin((x / S) * Math.PI * 2 * 3 + j * 0.7) + 2 * Math.sin((x / S) * Math.PI * 2 * 7 + j);
        x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
    // speckles and small stones
    for (let i = 0; i < 2600; i++) {
      const v = 70 + r() * 90;
      g.fillStyle = `rgba(${v + 30},${v},${v - 30},${0.25 + r() * 0.35})`;
      g.fillRect(r() * S, r() * S, 1 + r() * 2, 1 + r() * 2);
    }
    for (let i = 0; i < 70; i++) {
      const v = 90 + r() * 70;
      g.fillStyle = `rgb(${v + 25},${v + 5},${v - 20})`;
      g.beginPath();
      g.ellipse(r() * S, r() * S, 2 + r() * 4, 1.5 + r() * 3, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(350, 350);
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
})();

/** Large-scale sand tone (vertex colours): darker rocky/gravel patches on the plateau, light dune crests, warm troughs. */
const sandTone = (x: number, z: number, out: THREE.Color) => {
  const n1 = Math.sin(x * 0.0061 + Math.sin(z * 0.0043) * 1.7) * Math.sin(z * 0.0057 + 0.8);
  const n2 = Math.sin(x * 0.021 + z * 0.013) * Math.sin(z * 0.019 - x * 0.007);
  const gravel = THREE.MathUtils.smoothstep(n1 * 0.7 + n2 * 0.3, 0.25, 0.7) * (1 - THREE.MathUtils.smoothstep(Math.hypot(x, z), 900, 1800));
  const crest = THREE.MathUtils.smoothstep(groundH(x, z), 9, 17);
  out.set("#d9b783").lerp(new THREE.Color("#b0906a"), gravel * 0.5).lerp(new THREE.Color("#ecd3a2"), crest * 0.6);
  out.offsetHSL(0, 0, n2 * 0.025);
};

/** The open desert floor with dunes (a grid displaced by groundH, finer near the centre). */
export const Desert: React.FC = () => {
  const sand = usePbr("coast_sand_rocks_02", [700, 700]);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(14000, 14000, 220, 220);
    g.rotateX(-Math.PI / 2);
    const pa = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i);
      const z = pa.getZ(i);
      // squeeze the grid towards the centre so the plateau gets the most vertices
      const sx = Math.sign(x) * Math.pow(Math.abs(x) / 7000, 1.6) * 7000;
      const sz = Math.sign(z) * Math.pow(Math.abs(z) / 7000, 1.6) * 7000;
      pa.setXYZ(i, sx, groundH(sx, sz), sz);
    }
    // world-space uv (the squeezed grid would stretch the detail texture), macro tone in vertex colours
    const ua = g.attributes.uv as THREE.BufferAttribute;
    const col = new Float32Array(pa.count * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < pa.count; i++) {
      const x = pa.getX(i);
      const z = pa.getZ(i);
      ua.setXY(i, x / 14000 + 0.5, z / 14000 + 0.5);
      sandTone(x, z, tmp);
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial map={sandTex()} vertexColors normalMap={sand.normalMap} normalScale={new THREE.Vector2(1.4, 1.4)} roughnessMap={sand.roughnessMap} roughness={0.97} />
    </mesh>
  );
};

/** River, fields and palms of the Nile valley. */
const Valley: React.FC<{ t: number }> = ({ t }) => {
  const w = waterTex();
  w.offset.set(0, (t * 0.02) % 1);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(FIELDS.x0 + FIELDS.x1) / 2, -9.6, 0]} receiveShadow>
        <planeGeometry args={[FIELDS.x1 - FIELDS.x0, 12000]} />
        <meshStandardMaterial map={fieldTex()} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[NILE.x, -9.4, 0]}>
        <planeGeometry args={[NILE.w, 12000]} />
        <meshStandardMaterial map={w} color="#a9c8c0" roughness={0.3} metalness={0.05} />
      </mesh>
      <group position={[0, -9.6, 0]}>
        <Palms />
      </group>
    </group>
  );
};

/**
 * The world of this reel. `dusk` lowers the sun to the west and turns the sky orange; `night` makes it a starry night
 * (moonlight from the north-east). `sun` overrides the key light offset from the look point.
 */
export const GizaCanvas: React.FC<{ cam: Cam; t: number; dusk?: number; night?: number; children: React.ReactNode; ao?: number; sun?: V3; shadow?: number; env?: number; fog?: number }> = ({
  cam,
  t,
  dusk = 0,
  night = 0,
  children,
  ao = 0.8,
  sun,
  shadow = 260,
  env,
  fog = 1,
}) => {
  const { width, height } = useVideoConfig();
  const day = (1 - dusk) * (1 - night);
  const fogC = new THREE.Color("#ecdcc0").lerp(new THREE.Color("#c98a62"), dusk).lerp(new THREE.Color("#0b1226"), night);
  const keyP: V3 = sun ? [cam.look[0] + sun[0], cam.look[1] + sun[1], cam.look[2] + sun[2]] : [cam.look[0] - 230, cam.look[1] + 175 * day + 40 * dusk + 200 * night, cam.look[2] + 170];
  return (
    <ThreeCanvas width={width} height={height} shadows camera={{ fov: cam.fov ?? 40, near: 0.1, far: 30000 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping, logarithmicDepthBuffer: true }}>
      <CameraRig cam={cam} />
      <group position={cam.pos}>
        <Sky dusk={dusk} night={night} />
        {night > 0.3 ? <Stars3D frame={t * 30} count={900} radius={12000} size={22 * night} /> : null}
        {dusk > 0.2 && night < 0.8 ? <Glow position={[-9000, 500, 3000]} size={2400} color="#ffb070" opacity={0.7 * dusk * (1 - night)} fog={false} /> : null}
      </group>
      {fog > 0 ? <fog attach="fog" args={[fogC, 2200 * fog, 16000 * fog]} /> : null}
      <hemisphereLight args={[new THREE.Color("#e3ecf6").lerp(new THREE.Color("#7a5a8a"), dusk).lerp(new THREE.Color("#30406a"), night), new THREE.Color("#d2a36e").lerp(new THREE.Color("#3a2a30"), dusk).lerp(new THREE.Color("#10141e"), night), 0.58 * day + 0.32 * dusk + 0.25 * night]} />
      <KeyLight p={keyP} target={cam.look} intensity={2.75 * day + 1.3 * dusk * (1 - night) + 0.55 * night} color={night > 0.5 ? "#9fb6ff" : dusk > 0.5 ? "#ff9a5a" : "#fff1d8"} size={shadow} />
      <Desert />
      <Valley t={t} />
      <Cliffs />
      {children}
      <Env intensity={env ?? 0.2 * day + 0.12 * dusk + 0.05 * night} />
      <Post bloom={0.45 + 0.4 * dusk + 0.5 * night} ao={ao} vignette={0.4} />
    </ThreeCanvas>
  );
};

