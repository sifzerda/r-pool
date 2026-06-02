// src/renderers/AimGuide.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function AimGuide({
  cueBall,
  aimRef,
}) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;

    const angle =
      aimRef.current.angle || 0;

    const length = 8;

    ref.current.position.set(
      cueBall.x +
        Math.cos(angle) *
        length *
        0.5,

      0.34,

      cueBall.z +
        Math.sin(angle) *
        length *
        0.5
    );

    ref.current.rotation.y =
      -angle;
  });

  const moving =
    Math.hypot(
      cueBall.vx,
      cueBall.vz
    ) > 0.05;

  if (moving)
    return null;

  return (
    <mesh ref={ref}>
      <boxGeometry
        args={[
          8,
          0.01,
          0.01
        ]}
      />

      <meshBasicMaterial
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}