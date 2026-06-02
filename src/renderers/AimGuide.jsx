// src/renderers/AimGuide.jsx

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function AimGuide({
  cueBall,
  aimRef,
}) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;
    

    const angle =
      aimRef.current.angle;

      const dirX =
  Math.cos(angle);

const dirZ =
  Math.sin(angle);

    const length = 8;

ref.current.position.set(
  cueBall.x + dirX * 4,
  0.34,
  cueBall.z + dirZ * 4
);

    ref.current.rotation.set(
      0,
      -angle,
      0
    );
  });

  const moving =
    Math.hypot(
      cueBall.vx,
      cueBall.vz
    ) > 0.05;

  if (moving) return null;

  return (
    <mesh ref={ref}>
      <boxGeometry
        args={[
          8,
          0.005,
          0.005,
        ]}
      />

      <meshBasicMaterial
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}