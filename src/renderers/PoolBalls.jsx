// src/ecs/components/PoolBalls.jsx

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Object3D, InstancedBufferAttribute } from "three";
import { toRenderX, toRenderZ } from "../ecs/utils/coords.js";

const BALL_RADIUS = 0.1;
const Y_POS = 0.35;
const dummy = new Object3D();
const color = new Color();

export default function PoolBalls({ balls }) {
  const meshRef = useRef();

  useEffect(() => {
    if (!meshRef.current) return;
    meshRef.current.instanceColor = new InstancedBufferAttribute(
      new Float32Array(balls.length * 3),
      3
    );
  }, [balls.length]);

  useFrame(() => {
    if (!meshRef.current) return;

    let visibleIndex = 0;

    for (const ball of balls) {
      if (ball.pocketed) continue;

dummy.position.set(
  ball.x,
  Y_POS,
  ball.z
);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(visibleIndex, dummy.matrix);

      color.set(ball.color);
      meshRef.current.setColorAt(visibleIndex, color);

      visibleIndex++;
    }

    meshRef.current.count = visibleIndex;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, balls.length]}
      castShadow>
      <sphereGeometry args={[BALL_RADIUS, 32, 32]} />
      <meshStandardMaterial roughness={0.15} metalness={0.1} />
    </instancedMesh>
  );
}