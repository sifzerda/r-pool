// src/ecs/components/StickRenderer.jsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { toRenderX, toRenderZ } from "../ecs/utils/coords.js";
import { activeBalls } from "../ecs/world.js";

// ─────────────────────────────────────────
// Geometry creation
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
  makeCylinder(0.060, 0.070, 0.82, 12, 3.65),
]);

const geoRings = mergeGeometries([
  makeCylinder(0.056, 0.056, 0.024, 8, 2.530),
  makeCylinder(0.056, 0.056, 0.016, 8, 2.566),
  makeCylinder(0.062, 0.062, 0.024, 8, 3.210),
  makeCylinder(0.062, 0.062, 0.016, 8, 3.246),
]);

const geoDark = mergeGeometries([
  makeCylinder(0.056, 0.060, 0.64, 10, 2.88),
  makeCylinder(0.070, 0.070, 0.072, 8, 4.10),
]);

// ─────────────────────────────────────────
// Materials
// ─────────────────────────────────────────

const matTip = new THREE.MeshStandardMaterial({ color: "#5c3317", roughness: 0.9 });
const matFerrule = new THREE.MeshStandardMaterial({ color: "#f0ede8", roughness: 0.3, metalness: 0.1 });
const matMaple = new THREE.MeshStandardMaterial({ color: "#d4a84b", roughness: 0.25, metalness: 0.05 });
const matRings = new THREE.MeshStandardMaterial({ color: "#c8a030", roughness: 0.2, metalness: 0.6, emissive: "#4a3800", emissiveIntensity: 0.3 });
const matDark = new THREE.MeshStandardMaterial({ color: "#1a0e06", roughness: 0.95 });

// Power meter materials
const meterBackground = new THREE.MeshBasicMaterial({ color: "#151515" });
const meterFill = new THREE.MeshBasicMaterial({ color: "#00e5ff" });

// ─────────────────────────────────────────

export default function StickRenderer({ cueBall, aimRef }) {
  const ref = useRef();
  const meterRef = useRef();
  const fillRef = useRef();

  useFrame((_, delta) => {
    const group = ref.current;
    const meter = meterRef.current;
    const fill = fillRef.current;

    if (!group) return;

    const canAim = activeBalls.size === 0 && !cueBall.pocketed && !cueBall.falling;
    group.visible = canAim;

    if (meter) {
      meter.visible = canAim && aimRef.current.charging;
    }

    if (!canAim) return;

    const aim = aimRef.current;

    const angle = aim.charging ? aim.lockedAngle : aim.angle ?? 0;
    const cos = aim.charging ? aim.lockedCos : aim.cos ?? Math.cos(angle);
    const sin = aim.charging ? aim.lockedSin : aim.sin ?? Math.sin(angle);
    const pullBack = aim.charging ? aim.pullBack ?? 0 : 0;

    const cueX = toRenderX(cueBall.x);
    const cueZ = toRenderZ(cueBall.z);

    // Normal resting position plus drag distance.
    let distance = 0.35 + pullBack;

    // Follow-through animation after releasing the shot.
    if (aim.swing === 2) {
      aim.swingT += delta * 10;

      const p = Math.min(1, aim.swingT);

      distance = 0.35 - 0.8 * (1 - p) * (1 - p);

      if (p >= 1) {
        aim.swing = 0;
        aim.swingT = 0;
      }
    }

    group.position.set(cueX - cos * distance, 0.58, cueZ - sin * distance);
    group.rotation.set(0.05, -angle + Math.PI, 0);

    // Power meter
    if (meter) {
      meter.position.set(cueX, 0.85, cueZ - 0.55);
    }

    if (fill) {
      const ratio = Math.min(1, Math.max(0, (aim.power ?? 0) / 18));
      fill.scale.x = Math.max(0.001, ratio);
      fill.position.x = -0.4 + ratio * 0.4;
    }
  });

  return (
    <>
      <group ref={ref}>
        <mesh geometry={geoTip} material={matTip} castShadow />
        <mesh geometry={geoFerrule} material={matFerrule} castShadow />
        <mesh geometry={geoMaple} material={matMaple} castShadow />
        <mesh geometry={geoRings} material={matRings} castShadow />
        <mesh geometry={geoDark} material={matDark} castShadow />
      </group>

      {/* Power meter */}
      <group ref={meterRef} visible={false}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.82, 0.035, 0.035]} />
          <primitive object={meterBackground} attach="material" />
        </mesh>

        <mesh ref={fillRef} position={[-0.4, 0.022, 0]}>
          <boxGeometry args={[0.8, 0.025, 0.025]} />
          <primitive object={meterFill} attach="material" />
        </mesh>
      </group>
    </>
  );
}
