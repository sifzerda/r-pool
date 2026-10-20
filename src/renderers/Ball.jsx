// src/renderers/Ball.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { ballGeometry, getBallMaterial } from "./ballAssets";

export default function Ball({ ball, texture }) {
  const meshRef = useRef();

  const material = getBallMaterial(texture);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    if (ball.pocketed) {
      mesh.visible = false;
      return;
    }

    if (ball.falling) {
      const dx = ball.pocketX - ball.x;
      const dz = ball.pocketZ - ball.z;

      ball.x += dx * 8 * delta;
      ball.z += dz * 8 * delta;

      ball.fallSpeed += 12 * delta;
      ball.y -= ball.fallSpeed * delta;

      mesh.position.set(ball.x, ball.y, ball.z);

      mesh.rotation.x += delta * 8;
      mesh.rotation.z += delta * 8;

      if (ball.y < -0.4) {
        ball.pocketed = true;
        mesh.visible = false;
      }

      return;
    }

    if (!ball.dirty) return;

    mesh.position.set(ball.x, ball.y, ball.z);
    mesh.rotation.set(ball.rotX, ball.rotY, ball.rotZ);

    ball.dirty = false;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={ballGeometry}
      material={material}
      castShadow
      receiveShadow
    />
  );
}