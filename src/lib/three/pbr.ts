import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";

/**
 * Poly Haven PBR set from public/textures/<slug>_{diff,nor_gl,rough}.jpg (CC0).
 * Loaded with r3f's useLoader so ThreeCanvas waits for it (a manual delayRender loader rendered empty frames).
 */
export const usePbr = (slug: string, repeat: [number, number] = [1, 1]) => {
  const [map, normalMap, roughnessMap] = useLoader(THREE.TextureLoader, [
    staticFile(`textures/${slug}_diff.jpg`),
    staticFile(`textures/${slug}_nor_gl.jpg`),
    staticFile(`textures/${slug}_rough.jpg`),
  ]);
  return useMemo(() => {
    const out = [map, normalMap, roughnessMap].map((t) => {
      const c = t.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(...repeat);
      c.anisotropy = 8;
      c.needsUpdate = true;
      return c;
    });
    out[0].colorSpace = THREE.SRGBColorSpace;
    return { map: out[0], normalMap: out[1], roughnessMap: out[2] };
  }, [map, normalMap, roughnessMap, repeat[0], repeat[1]]); // eslint-disable-line react-hooks/exhaustive-deps
};
