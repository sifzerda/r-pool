//src/renderers/ballAssets.js

import * as THREE from "three";
import { BALL_R } from "../ecs/constants/table.js";

export const ballGeometry = new THREE.SphereGeometry(
  BALL_R,
  24,
  24
);

const materials = new Map();

export function getBallMaterial(texture) {
  if (!materials.has(texture)) {
    materials.set(
      texture,
      new THREE.MeshPhysicalMaterial({
        map: texture,
        roughness: 0.08,
        clearcoat: 1,
      })
    );
  }

  return materials.get(texture);
}