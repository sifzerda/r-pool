// src/renderers/Ball.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BALL_R } from "../ecs/constants/table";

export default function Ball({
  ball,
  texture,
}) {
  const meshRef = useRef();

  useFrame(() => {
    if (!meshRef.current || ball.pocketed)
      return;

    meshRef.current.position.set(ball.x, ball.y, ball.z);
    meshRef.current.rotation.set(ball.rotX, ball.rotY, ball.rotZ);
  });

  if (ball.pocketed) return null;

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[BALL_R, 32, 32]}  />
      <meshPhysicalMaterial map={texture} roughness={0.08} clearcoat={1} />
    </mesh>
  );
}