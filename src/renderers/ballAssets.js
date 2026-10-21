//src/renderers/balls/ballAssets.js

import * as THREE from "three";
import { BALL_R } from "../ecs/constants/table";

// --------------------------------------------------
// SHARED BALL GEOMETRY
// --------------------------------------------------

export const ballGeometry = new THREE.SphereGeometry(
    BALL_R,
    32,
    32
);

// --------------------------------------------------
// SHARED BALL MATERIALS
// --------------------------------------------------

const materials = new Map();

export function getBallMaterial(texture) {
    if (!materials.has(texture)) {
        const material = new THREE.MeshPhysicalMaterial({
            map: texture,

            roughness: 0.08,
            metalness: 0,

            clearcoat: 1,
            clearcoatRoughness: 0.08,
        });

        materials.set(texture, material);
    }

    return materials.get(texture);
}