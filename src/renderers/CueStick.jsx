// src/ecs/components/CueStick.jsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { toRenderX, toRenderZ } from "../ecs/utils/coords";

export default function CueStick({ cueBall, aimRef }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;

    const angle = aimRef.current.angle || 0;
    const power = aimRef.current.power || 0;

    const cueX = toRenderX(cueBall.x);
    const cueZ = toRenderZ(cueBall.z);

    // -----------------------------
    // 🎯 SWING STATE MACHINE
    // -----------------------------

    let swingOffset = 0;

    if (aimRef.current.swing === 1) {
      // BACKSWING (pull back)
      swingOffset = -0.35 - power * 0.0006;
    }

    if (
      aimRef.current.swing === 2 &&
      aimRef.current.swingT > 0.15 &&
      aimRef.current.pendingShot
    ) {

      const shot =
        aimRef.current.pendingShot;

      const strength =
        shot.power * 2.2;

      cueBall.vx =
        Math.cos(shot.angle) *
        strength;

      cueBall.vz =
        Math.sin(shot.angle) *
        strength;

      cueBall.sleeping = false;

      aimRef.current.pendingShot = null;
    } {
      // STRIKE animation
      aimRef.current.swingT += delta * 10;

      if (
        aimRef.current.swingT > 0.15 &&
        aimRef.current.pendingShot
      ) {

        const shot =
          aimRef.current.pendingShot;

        const strength =
          shot.power * 2.2;

        cueBall.vx =
          Math.cos(shot.angle)
          * strength;

        cueBall.vz =
          Math.sin(shot.angle)
          * strength;

        cueBall.sleeping = false;

        aimRef.current.pendingShot = null;
      }

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

    const x = cueX - Math.cos(angle) * (baseDistance + swingOffset);
    const z = cueZ - Math.sin(angle) * (baseDistance + swingOffset);

    ref.current.position.set(x, 0.45, z);

    ref.current.lookAt(
      cueX,
      0.45,
      cueZ
    );

    ref.current.rotateY(Math.PI / 2);
    // rotate cue
    ref.current.rotation.set(
      0.05,
      -angle + Math.PI,
      0
    );
  });

  const moving = Math.abs(cueBall.vx) > 0.05 || Math.abs(cueBall.vz) > 0.05;

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