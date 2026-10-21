//src/renderers/balls/ballAssets.js

import * as THREE from "three";

import { BALL_R } from "../ecs/constants/table";
import { ballAtlas } from "./ballTextures.js";

// --------------------------------------------------
// SHARED GEOMETRY
// --------------------------------------------------

export const ballGeometry = new THREE.SphereGeometry(
    BALL_R,
    32,
    32
);

// --------------------------------------------------
// SHARED MATERIAL
// --------------------------------------------------

export const ballMaterial = new THREE.MeshPhysicalMaterial({
    map: ballAtlas,

    roughness: 0.08,
    metalness: 0,

    clearcoat: 1,
    clearcoatRoughness: 0.08,
});

// --------------------------------------------------
// INSTANCE UV ATTRIBUTE
// --------------------------------------------------

ballGeometry.setAttribute(
    "instanceUvOffset",
    new THREE.InstancedBufferAttribute(
        new Float32Array(16 * 2),
        2
    )
);

// --------------------------------------------------
// CUSTOM SHADER
// --------------------------------------------------

ballMaterial.onBeforeCompile = (shader) => {

    // Declare per-instance UV offset
    shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `
        #include <common>

        attribute vec2 instanceUvOffset;
        `
    );

    // Override normal UV coordinates with atlas coordinates
    shader.vertexShader = shader.vertexShader.replace(
        "#include <uv_vertex>",
        `
        #include <uv_vertex>

        vMapUv = uv * 0.25 + instanceUvOffset;
        `
    );
};

// Unique program cache key
ballMaterial.customProgramCacheKey = () => "pool-ball-atlas-v1";