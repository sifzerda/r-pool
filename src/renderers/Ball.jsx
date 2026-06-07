// src/renderers/Ball.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BALL_R } from "../ecs/constants/table";
import { markDirty } from "../ecs/world";

export default function Ball({
  ball,
  texture,
}) {
  const meshRef = useRef();

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (ball.sleeping && !ball.dirty && !ball.falling) {
      return;
    }

    if (ball.falling) {

      const dx = ball.pocketX - ball.x;
      const dz = ball.pocketZ - ball.z;

      ball.x += dx * 8 * delta;
      ball.z += dz * 8 * delta;

      ball.fallSpeed += 12 * delta;
      ball.y -= ball.fallSpeed * delta;

      markDirty(ball);

      meshRef.current.position.set(ball.x, ball.y, ball.z);
      meshRef.current.rotation.x += delta * 8;
      meshRef.current.rotation.z += delta * 8;

      if (ball.y < -0.4) {
        ball.pocketed = true;
      }

      return;
    }

    if (ball.pocketed) return;
    if (!ball.dirty) return;

    meshRef.current.position.set(ball.x, ball.y, ball.z);
    meshRef.current.rotation.set(ball.rotX, ball.rotY, ball.rotZ);

    ball.dirty = false;

  });

  if (ball.pocketed) return null;

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[BALL_R, 32, 32]} />
      <meshPhysicalMaterial map={texture} roughness={0.08} clearcoat={1} />
    </mesh>
  );
}