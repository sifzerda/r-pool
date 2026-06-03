// src/ecs/components/PoolBalls.jsx

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Object3D, InstancedBufferAttribute } from "three";
import { BALL_R } from "../ecs/constants/table";

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

    let i = 0;

for (const ball of balls) {

  if (ball.pocketed) continue;

  dummy.position.set(
    ball.x,
    0.35,
    ball.z
  );

  dummy.updateMatrix();

  meshRef.current.setMatrixAt(
    i,
    dummy.matrix
  );

  color.set(
    ball.color || "#ffffff"
  );

  meshRef.current.setColorAt(
    i,
    color
  );

  i++;
}

    meshRef.current.count = i;
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, balls.length]} castShadow>
      <sphereGeometry args={[BALL_R, 24, 24]} />
      <meshStandardMaterial roughness={0.2} metalness={0.1} />
    </instancedMesh>
  );
}