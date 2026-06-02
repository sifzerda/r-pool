// src/ecs/components/CueStick.jsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import {
  toRenderX,
  toRenderZ,
} from "../ecs/utils/coords";

export default function CueStick({
  cueBall,
  aimRef,
}) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;

    const angle = aimRef.current.angle || 0;
    const power = aimRef.current.power || 0;

    const cueX = cueBall.x;
    const cueZ = cueBall.z;

    // -----------------------------
    // 🎯 SWING STATE MACHINE
    // -----------------------------

    let swingOffset = 0;

    if (aimRef.current.swing === 1) {
      // BACKSWING (pull back)
      swingOffset = -0.35 - power * 0.0006;
    }

    if (aimRef.current.swing === 2) {
      // STRIKE animation
      aimRef.current.swingT += delta * 10;

      swingOffset = 0.8 * Math.exp(-aimRef.current.swingT * 6);

      if (aimRef.current.swingT > 1) {
        aimRef.current.swing = 0;
      }
    }

    // idle slight hover
    if (aimRef.current.swing === 0) {
      swingOffset = -0.15 - power * 0.0003;
    }

    // -----------------------------
    // POSITION
    // -----------------------------

    const baseDistance = 0.5;

    const x =
      cueX - Math.cos(angle) * (baseDistance + swingOffset);

    const z =
      cueZ - Math.sin(angle) * (baseDistance + swingOffset);

    ref.current.position.set(x, 0.45, z);

    // rotate cue
    ref.current.rotation.y = angle;

    // slight tilt for realism
    ref.current.rotation.x = 0.05;
  });

  const moving =
    Math.abs(cueBall.vx) > 0.05 ||
    Math.abs(cueBall.vy) > 0.05;

  if (moving) return null;

  return (
    <group ref={ref}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.02, 0.7, 16]} />
        <meshStandardMaterial color="#c89b63" />
      </mesh>
    </group>
  );
}