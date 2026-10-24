import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { CameraRig, Cam } from "../../lib/three/core";
import { FlightRecorder } from "../../lib/three/FlightRecorder";
import { VolumeFire } from "../../lib/three/VolumeFire";

// Quality test B: same scene as experiments/blender/firetest.py, in the upgraded code stack.
export const FIRE_B_DURATION = 60;

type Set3 = { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };
type Assets = { brick: Set3; concrete: Set3; rust: Set3; hdr: THREE.DataTexture };

/** Load textures + HDRI before the first frame renders (Remotion waits via delayRender). */
const useAssets = () => {
  const [assets, setAssets] = useState<Assets | null>(null);
  const [handle] = useState(() => delayRender("textures"));
  useEffect(() => {
    const tl = new THREE.TextureLoader();
    const load = (f: string) => tl.loadAsync(staticFile(`textures/${f}`));
    const set = async (slug: string, repeat: number): Promise<Set3> => {
      const [map, normalMap, roughnessMap] = await Promise.all([load(`${slug}_diff.jpg`), load(`${slug}_nor_gl.jpg`), load(`${slug}_rough.jpg`)]);
      map.colorSpace = THREE.SRGBColorSpace;
      [map, normalMap, roughnessMap].forEach((t) => {
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(repeat, repeat);
        t.anisotropy = 8;
      });
      return { map, normalMap, roughnessMap };
    };
    Promise.all([set("red_brick_03", 3), set("concrete_floor_02", 4), set("rusty_metal_02", 1), new RGBELoader().loadAsync(staticFile("textures/industrial_workshop_foundry_1k.hdr"))]).then(
      ([brick, concrete, rust, hdr]) => {
        hdr.mapping = THREE.EquirectangularReflectionMapping;
        setAssets({ brick, concrete, rust, hdr });
        continueRender(handle);
      },
    );
  }, [handle]);
  return assets;
};

const Environment: React.FC<{ hdr: THREE.DataTexture; intensity: number }> = ({ hdr, intensity }) => {
  const scene = useThree((s) => s.scene);
  scene.environment = hdr;
  scene.environmentIntensity = intensity;
  return null;
};

export const FireTestB: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const assets = useAssets();
  // camera matched to the Blender shot (Blender Z-up (x, y, z) → three Y-up (x, z, −y)); 40 mm on a 36 mm portrait sensor
  const cam: Cam = { pos: [1.15, 1.55, 3.3], look: [0, 1.12, 0], fov: 48.5 };
  const flick = 0.85 + 0.15 * Math.sin(f * 0.23) * Math.sin(f * 0.11 + 1);
  const legs = useMemo(
    () => [
      [-0.6, -0.45],
      [-0.6, 0.45],
      [0.6, -0.45],
      [0.6, 0.45],
    ],
    [],
  );
  if (!assets) return null;
  const rust = <meshStandardMaterial {...assets.rust} metalness={0.6} />;
  return (
    <AbsoluteFill style={{ background: "#120a06" }}>
      <ThreeCanvas width={width} height={height} shadows camera={{ fov: 48.5, near: 0.05, far: 60 }} gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}>
        <CameraRig cam={cam} />
        <Environment hdr={assets.hdr} intensity={0.22} />
        <ambientLight intensity={0.05} />
        <directionalLight position={[2.5, 4.5, 3]} intensity={0.9} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
        <pointLight position={[0, 0.6, 0.4]} intensity={4 * flick} distance={7} decay={2} color="#ff7a2a" castShadow />
        <pointLight position={[0, 2.0, -1]} intensity={8 * flick} distance={6} decay={2} color="#ff6a1a" />
        {/* floor + brick corner */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial {...assets.concrete} />
        </mesh>
        <mesh position={[0, 3, -2.2]} receiveShadow>
          <planeGeometry args={[16, 6]} />
          <meshStandardMaterial {...assets.brick} />
        </mesh>
        <mesh position={[-2.6, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[16, 6]} />
          <meshStandardMaterial {...assets.brick} />
        </mesh>
        {/* rusty stand */}
        {legs.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.45, z]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.9, 16]} />
            {rust}
          </mesh>
        ))}
        {[-0.45, 0.45].map((z) => (
          <mesh key={z} position={[0, 0.9, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 1.25, 12]} />
            {rust}
          </mesh>
        ))}
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.95, 12]} />
            {rust}
          </mesh>
        ))}
        {[-0.3, 0, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.13, -0.05]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.25, 16]} />
            {rust}
          </mesh>
        ))}
        {/* the recorder on the stand (FlightRecorder: ~1.4 long on X, sits on y=0) */}
        <group position={[-0.1, 0.92, 0]} scale={0.62}>
          <FlightRecorder />
        </group>
        {/* fire volume around and above the burners */}
        <VolumeFire time={f / 30} position={[0, 1.2, -0.05]} scale={[1.5, 2.3, 0.95]} intensity={0.16} />
        <EffectComposer multisampling={0}>
          <N8AO aoRadius={0.6} intensity={2.2} distanceFalloff={0.8} />
          {/* focus on the recorder (~3.6 units from the camera), background softens */}
          <DepthOfField worldFocusDistance={3.6} worldFocusRange={2.2} bokehScale={2.2} />
          <Bloom luminanceThreshold={0.75} luminanceSmoothing={0.2} intensity={1.1} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.3} darkness={0.55} />
        </EffectComposer>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
