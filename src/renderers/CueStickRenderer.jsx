// src/ecs/components/CueStickRenderer.jsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { toRenderX, toRenderZ } from "../ecs/utils/coords";

// ─────────────────────────────────────────
// Build merged geometries ONCE at module load
// ─────────────────────────────────────────

function makeCylinder(rTop, rBot, len, segs, offsetX) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, len, segs);
  geo.rotateZ(Math.PI / 2);
  geo.translate(offsetX, 0, 0);
  return geo;
}

// Group 1 – tip (leather brown)  — 8 sides, barely visible up close
const geoTip = makeCylinder(0.018, 0.028, 0.14, 8, 0.07);

// Group 2 – ferrule (white)  — 8 sides, short collar
const geoFerrule = makeCylinder(0.028, 0.032, 0.18, 8, 0.23);

// Group 3 – maple (shaft + butt merged)  — 12 sides, longest visible section
const geoMaple = mergeGeometries([
  makeCylinder(0.032, 0.052, 2.20, 12, 1.42),  // shaft
  makeCylinder(0.060, 0.070, 0.82, 12, 3.65),  // butt
]);

// Group 4 – gold rings  — 8 sides, tiny and mostly occluded by neighbors
const geoRings = mergeGeometries([
  makeCylinder(0.056, 0.056, 0.024, 8, 2.530),
  makeCylinder(0.056, 0.056, 0.016, 8, 2.566),
  makeCylinder(0.062, 0.062, 0.024, 8, 3.210),
  makeCylinder(0.062, 0.062, 0.016, 8, 3.246),
]);

// Group 5 – dark (wrap + end cap merged)  — 10 sides
const geoDark = mergeGeometries([
  makeCylinder(0.056, 0.060, 0.64, 10, 2.88),
  makeCylinder(0.070, 0.070, 0.072, 8, 4.100),  // end cap: 8, fully hidden
]);

// ─────────────────────────────────────────
// Materials — one instance each, shared forever
// ─────────────────────────────────────────

const matTip = new THREE.MeshStandardMaterial({
  color: "#5c3317", 
  roughness: 0.9, 
  metalness: 0.0,
});
const matFerrule = new THREE.MeshStandardMaterial({
  color: "#f0ede8", 
  roughness: 0.3, 
  metalness: 0.1,
});
const matMaple = new THREE.MeshStandardMaterial({
  color: "#d4a84b", 
  roughness: 0.25, 
  metalness: 0.05,
});
const matRings = new THREE.MeshStandardMaterial({
  color: "#c8a030", 
  roughness: 0.2, 
  metalness: 0.6,
  emissive: "#4a3800", 
  emissiveIntensity: 0.3,
});
const matDark = new THREE.MeshStandardMaterial({
  color: "#1a0e06", 
  roughness: 0.95, 
  metalness: 0.0,
});

export default function CueStickRenderer({ cueBall, aimRef }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;

    const angle = aimRef.current.angle || 0;
    const power = aimRef.current.power || 0;
    const cueX = toRenderX(cueBall.x);
    const cueZ = toRenderZ(cueBall.z);

    // ── Swing state machine ──────────────────

    let swingOffset = 0;

    if (aimRef.current.swing === 1) {
      swingOffset = -0.35 - power * 0.0006;
    }

    if (
      aimRef.current.swing === 2 &&
      aimRef.current.swingT > 0.15 &&
      aimRef.current.pendingShot
    ) {
      const shot = aimRef.current.pendingShot;
      const strength = shot.power * 2.2;
      cueBall.vx = Math.cos(shot.angle) * strength;
      cueBall.vz = Math.sin(shot.angle) * strength;
      cueBall.sleeping = false;
      cueBall.dirty = true;
      aimRef.current.pendingShot = null;
    } {
      aimRef.current.swingT += delta * 10;

      if (aimRef.current.swingT > 0.15 && aimRef.current.pendingShot) {
        const shot = aimRef.current.pendingShot;
        const strength = shot.power * 2.2;
        cueBall.vx = Math.cos(shot.angle) * strength;
        cueBall.vz = Math.sin(shot.angle) * strength;
        cueBall.sleeping = false;
        aimRef.current.pendingShot = null;
      }

      swingOffset = 0.8 * Math.exp(-aimRef.current.swingT * 6);

      if (aimRef.current.swingT > 1) aimRef.current.swing = 0;
    }

    if (aimRef.current.swing === 0) {
      swingOffset = -0.15 - power * 0.0003;
    }

    // ── Position ────────────────────────────

    const baseDistance = 0.5;
    const x = cueX - Math.cos(angle) * (baseDistance + swingOffset);
    const z = cueZ - Math.sin(angle) * (baseDistance + swingOffset);

    ref.current.position.set(x, 0.45, z);
    ref.current.rotation.set(0.05, -angle + Math.PI, 0);
  });

  const moving = Math.abs(cueBall.vx) > 0.05 || Math.abs(cueBall.vz) > 0.05;
  if (moving) return null;

  // 5 meshes → 5 draw calls (was 8)
  return (
    <group ref={ref}>
      <mesh geometry={geoTip}     material={matTip} />
      <mesh geometry={geoFerrule} material={matFerrule} />
      <mesh geometry={geoMaple}   material={matMaple} />
      <mesh geometry={geoRings}   material={matRings} />
      <mesh geometry={geoDark}    material={matDark} />
    </group>
  );
}