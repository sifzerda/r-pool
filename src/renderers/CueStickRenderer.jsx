// src/ecs/components/CueStickRenderer.jsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { toRenderX, toRenderZ } from "../ecs/utils/coords";

// ─────────────────────────────────────────
// Geometry creation (once)
// ─────────────────────────────────────────

function makeCylinder(rTop, rBot, len, segs, offsetX) {
  const geo = new THREE.CylinderGeometry(rTop, rBot, len, segs);

  geo.rotateZ(Math.PI / 2);
  geo.translate(offsetX, 0, 0);

  return geo;
}

const geoTip = makeCylinder(0.018, 0.028, 0.14, 8, 0.07);
const geoFerrule = makeCylinder(0.028, 0.032, 0.18, 8, 0.23);

const geoMaple = mergeGeometries([
  makeCylinder(0.032, 0.052, 2.20, 12, 1.42),
  makeCylinder( 0.060, 0.070, 0.82, 12, 3.65),
]);

const geoRings = mergeGeometries([
  makeCylinder(0.056, 0.056, 0.024, 8, 2.530),
  makeCylinder(0.056, 0.056, 0.016, 8, 2.566),
  makeCylinder(0.062, 0.062, 0.024, 8, 3.210),
  makeCylinder( 0.062, 0.062, 0.016, 8, 3.246),
]);

const geoDark = mergeGeometries([
  makeCylinder(0.056, 0.060, 0.64, 10, 2.88),
  makeCylinder(0.070, 0.070, 0.072, 8, 4.10),
]);

// ─────────────────────────────────────────
// Shared materials
// ─────────────────────────────────────────

const matTip =
  new THREE.MeshStandardMaterial({
    color: "#5c3317",
    roughness: 0.9,
  });

const matFerrule =
  new THREE.MeshStandardMaterial({
    color: "#f0ede8",
    roughness: 0.3,
    metalness: 0.1,
  });

const matMaple =
  new THREE.MeshStandardMaterial({
    color: "#d4a84b",
    roughness: 0.25,
    metalness: 0.05,
  });

const matRings =
  new THREE.MeshStandardMaterial({
    color: "#c8a030",
    roughness: 0.2,
    metalness: 0.6,
    emissive: "#4a3800",
    emissiveIntensity: 0.3,
  });

const matDark =
  new THREE.MeshStandardMaterial({
    color: "#1a0e06",
    roughness: 0.95,
  });

// ─────────────────────────────────────────

export default function CueStickRenderer({
  cueBall,
  aimRef,
}) {
  const ref = useRef();

  useFrame((_, delta) => {
    const group = ref.current;

    if (!group) return;

     const moving =
    Math.abs(cueBall.vx) > 0.05 ||
    Math.abs(cueBall.vz) > 0.05;

  group.visible = !moving;

  if (moving) return;

    const angle = aimRef.current.angle ?? 0;
    const cos = aimRef.current.cos ?? Math.cos(angle);
    const sin = aimRef.current.sin ?? Math.sin(angle);
    const power = aimRef.current.power ?? 0;

    const cueX = toRenderX(cueBall.x);
    const cueZ = toRenderZ(cueBall.z);

    let swingOffset = -0.15 - power * 0.0003;

    // Pull back
    if (aimRef.current.swing === 1) {
      swingOffset = -0.35 - power * 0.0006;
    }

    // Follow-through
    if (aimRef.current.swing === 2) {
      aimRef.current.swingT += delta * 10;

      const p = Math.min(1, aimRef.current.swingT);

      swingOffset = 0.8 * (1 - p) * (1 - p);

      if (p >= 1) {
        aimRef.current.swing = 0;
        aimRef.current.swingT = 0;
      }
    }

    const distance = 0.5 + swingOffset;

    group.position.set(cueX - cos * distance, 0.45, cueZ - sin * distance);
    group.rotation.set(0.05, -angle + Math.PI, 0);
  });

  const moving = Math.abs(cueBall.vx) > 0.05 || Math.abs(cueBall.vz) > 0.05;

  return (
  <group ref={ref}>
    <mesh
      geometry={geoTip}
      material={matTip}
      castShadow
    />

    <mesh
      geometry={geoFerrule}
      material={matFerrule}
      castShadow
    />

    <mesh
      geometry={geoMaple}
      material={matMaple}
      castShadow
    />

    <mesh
      geometry={geoRings}
      material={matRings}
      castShadow
    />

    <mesh
      geometry={geoDark}
      material={matDark}
      castShadow
    />
  </group>
);
}