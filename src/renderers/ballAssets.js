// src/renderers/ballAssets.js

import * as THREE from "three";
import { BALL_R } from "../ecs/constants/table.js";
import { ballAtlas } from "./ballTextures.js";

const ballGeometry = new THREE.SphereGeometry(BALL_R, 24, 16);
const ballMaterial = new THREE.MeshPhysicalMaterial({
  
  map: ballAtlas,
  roughness: 0.08,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  iridescence: 0,
  iridescenceIOR: 1.3,
  iridescenceThicknessRange: [100, 700],
  emissive: new THREE.Color("#ffffff"),
  emissiveMap: ballAtlas,
  emissiveIntensity: 0
  
});

ballGeometry.setAttribute("instanceUvOffset", new THREE.InstancedBufferAttribute(new Float32Array(16 * 2), 2));

ballMaterial.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nattribute vec2 instanceUvOffset;");
  shader.vertexShader = shader.vertexShader.replace("#include <uv_vertex>", `
    #include <uv_vertex>
    #ifdef USE_MAP
      // Half a texel inset prevents linear filtering sampling another ball's cell.
      vMapUv = uv * (0.25 - 1.0 / 1024.0) + instanceUvOffset + vec2(0.5 / 1024.0);
    #endif
    #ifdef USE_EMISSIVEMAP
      vEmissiveMapUv = uv * (0.25 - 1.0 / 1024.0) + instanceUvOffset + vec2(0.5 / 1024.0);
    #endif
  `);
};

ballMaterial.customProgramCacheKey = () => "pool-ball-atlas-inset-v3";

export {
  ballGeometry,
  ballMaterial
};
