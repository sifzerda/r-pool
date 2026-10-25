// src/renderers/materials.js
// Shared, module-level materials for the table and cue. The Lab mutates these
// in place (see lab/applyAppearance.js), so nothing needs to re-render.

import * as THREE from "three";

const feltMat = new THREE.MeshPhysicalMaterial({ color: "#008000", roughness: 0.95, sheen: 0, sheenRoughness: 0.5 });
const clothMat = new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, opacity: 1, depthWrite: false });
const frameMat = new THREE.MeshStandardMaterial({ color: "#3a1f0f", roughness: 0.8 });
const baseMat = new THREE.MeshStandardMaterial({ color: "#5b3418", roughness: 0.7 });
const railMat = new THREE.MeshStandardMaterial({ color: "#5b3418" });
const trimMat = new THREE.MeshStandardMaterial({ color: "#7b4a25" });
const diamondMat = new THREE.MeshStandardMaterial({ color: "#f0d080" });
const wellMat = new THREE.MeshStandardMaterial({ color: "#120c08", roughness: 1 });
const stickTipMat = new THREE.MeshStandardMaterial({ color: "#5c3317", roughness: 0.9 });
const stickFerruleMat = new THREE.MeshStandardMaterial({ color: "#f0ede8", roughness: 0.3, metalness: 0.1 });
const stickShaftMat = new THREE.MeshStandardMaterial({ color: "#d4a84b", roughness: 0.25, metalness: 0.05 });
const stickAccentMat = new THREE.MeshStandardMaterial({ color: "#c8a030", roughness: 0.2, metalness: 0.6, emissive: "#c8a030", emissiveIntensity: 0.3 });
const stickButtMat = new THREE.MeshStandardMaterial({ color: "#1a0e06", roughness: 0.95 });
const labMaterials = [feltMat, frameMat, baseMat, railMat, trimMat, diamondMat, wellMat, stickTipMat, stickFerruleMat, stickShaftMat, stickAccentMat, stickButtMat];

export {
  baseMat,
  clothMat,
  diamondMat,
  feltMat,
  frameMat,
  labMaterials,
  railMat,
  stickAccentMat,
  stickButtMat,
  stickFerruleMat,
  stickShaftMat,
  stickTipMat,
  trimMat,
  wellMat
};
