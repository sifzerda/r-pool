// src/renderers/AimGuide.jsx

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function AimGuide({ cueBall, aimRef }) {
  const lineRef = useRef();

  useFrame(() => {
    if (!lineRef.current) return;

    const angle = aimRef.current.angle;

    lineRef.current.geometry.setFromPoints([
      {
        x: cueBall.x,
        y: 0.35,
        z: cueBall.z,
      },
      {
        x: cueBall.x + Math.cos(angle) * 10,
        y: 0.35,
        z: cueBall.z + Math.sin(angle) * 10,
      },
    ]);
  });

  const moving =
    Math.hypot(cueBall.vx, cueBall.vz) > 0.05;

  if (moving) return null;

  return (
    <Line
      ref={lineRef}
      points={[
        [0, 0, 0],
        [0, 0, 0],
      ]}
    />
  );
}