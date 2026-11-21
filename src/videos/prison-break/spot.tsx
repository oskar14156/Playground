import React, { useMemo } from "react";
import * as THREE from "three";
import type { V3 } from "../../lib/three/core";

/** Spot light whose target really is where it should be: the target object is added next to the light (r3f's
 * `target-position` only moves a target that is not in the scene, so the cone kept pointing at the origin).
 * `local` = target given relative to the light (for lights on moving parents). */
export const Spot: React.FC<{ p: V3; target: V3; angle?: number; penumbra?: number; intensity: number; distance?: number; color?: string; local?: boolean }> = ({ p, target, angle = 0.5, penumbra = 0.5, intensity, distance = 40, color = "#ffffff", local }) => {
  const light = useMemo(() => new THREE.SpotLight(color, intensity, distance, angle, penumbra, 2), []); // eslint-disable-line react-hooks/exhaustive-deps
  light.color.set(color);
  light.intensity = intensity;
  light.distance = distance;
  light.angle = angle;
  light.penumbra = penumbra;
  light.position.set(...p);
  light.target.position.set(...(local ? ([p[0] + target[0], p[1] + target[1], p[2] + target[2]] as V3) : target));
  return (
    <>
      <primitive object={light} />
      <primitive object={light.target} />
    </>
  );
};
