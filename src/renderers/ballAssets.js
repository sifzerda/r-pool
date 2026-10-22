// src/renderers/ballAssets.js

import * as THREE from "three";

import { BALL_R } from "../ecs/constants/table";
import { ballAtlas } from "./ballTextures.js";

// Shared geometry
export const ballGeometry = new THREE.SphereGeometry(BALL_R, 32, 32);

// Shared material. The Lab edits these properties live.
export const ballMaterial = new THREE.MeshPhysicalMaterial({
    map: ballAtlas,

    roughness: 0.08,
    metalness: 0,

    clearcoat: 1,
    clearcoatRoughness: 0.08,

    iridescence: 0,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [100, 700],

    // "Glow": the ball lights itself with its own texture.
    emissive: new THREE.Color("#ffffff"),
    emissiveMap: ballAtlas,
    emissiveIntensity: 0,
});

// Per-instance UV offset into the atlas.
ballGeometry.setAttribute(
    "instanceUvOffset",
    new THREE.InstancedBufferAttribute(new Float32Array(16 * 2), 2)
);

ballMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
        #include <common>

        attribute vec2 instanceUvOffset;
        `
    );

    // Atlas coordinates for the colour map, and the same ones for the glow map.
    shader.vertexShader = shader.vertexShader.replace(
        "#include <uv_vertex>",
        `
        #include <uv_vertex>

        vMapUv = uv * 0.25 + instanceUvOffset;

        #ifdef USE_EMISSIVEMAP
            vEmissiveMapUv = vMapUv;
        #endif
        `
    );
};

ballMaterial.customProgramCacheKey = () => "pool-ball-atlas-v2";