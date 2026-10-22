// src/renderers/materials.js
// Shared, module-level materials for the table and cue. The Lab mutates these
// in place (see lab/applyAppearance.js), so nothing needs to re-render.

import * as THREE from "three";

// ── Table ───────────────────────────────────────────
export const feltMat = new THREE.MeshPhysicalMaterial({
  color: "#008000",
  roughness: 0.95,
  sheen: 0,
  sheenRoughness: 0.5,
});

export const clothMat = new THREE.MeshBasicMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  opacity: 1,
  depthWrite: false,
});

export const frameMat = new THREE.MeshStandardMaterial({ color: "#3a1f0f", roughness: 0.8 });
export const baseMat = new THREE.MeshStandardMaterial({ color: "#5b3418", roughness: 0.7 });
export const railMat = new THREE.MeshStandardMaterial({ color: "#5b3418" });
export const trimMat = new THREE.MeshStandardMaterial({ color: "#7b4a25" });
export const diamondMat = new THREE.MeshStandardMaterial({ color: "#f0d080" });
export const wellMat = new THREE.MeshStandardMaterial({ color: "#120c08", roughness: 1 });

// ── Cue stick ───────────────────────────────────────
export const stickTipMat = new THREE.MeshStandardMaterial({ color: "#5c3317", roughness: 0.9 });
export const stickFerruleMat = new THREE.MeshStandardMaterial({ color: "#f0ede8", roughness: 0.3, metalness: 0.1 });
export const stickShaftMat = new THREE.MeshStandardMaterial({ color: "#d4a84b", roughness: 0.25, metalness: 0.05 });
export const stickAccentMat = new THREE.MeshStandardMaterial({
  color: "#c8a030",
  roughness: 0.2,
  metalness: 0.6,
  emissive: "#c8a030",
  emissiveIntensity: 0.3,
});
export const stickButtMat = new THREE.MeshStandardMaterial({ color: "#1a0e06", roughness: 0.95 });

// Everything the Lab drives, for bulk updates (e.g. reflection strength).
export const labMaterials = [
  feltMat, frameMat, baseMat, railMat, trimMat, diamondMat, wellMat,
  stickTipMat, stickFerruleMat, stickShaftMat, stickAccentMat, stickButtMat,
];
