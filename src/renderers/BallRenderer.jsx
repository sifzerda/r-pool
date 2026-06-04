//src/renderers/BallRenderer.jsx

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D } from "three";

import { BALL_R } from "../ecs/constants/table";

const dummy = new Object3D();

export default function BallRenderer({
  balls
}) {
  const meshRef = useRef();

  console.log("balls", balls.length, balls);

  useEffect(() => {
    if (!meshRef.current) return;

    balls.forEach((ball, i) => {
      meshRef.current.setColorAt(
        i,
        ball.renderColor
      );
    });

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [balls]);

  useFrame(() => {
    const mesh = meshRef.current;

    if (!mesh) return;

    let changed = false;
    let count = 0;

    for (const ball of balls) {

      if (ball.pocketed) continue;

      if (ball.dirty) {
        changed = true;
      }

      dummy.position.set(
        ball.x,
        0.3,
        ball.z
      );

      dummy.updateMatrix();

      mesh.setMatrixAt(
        count,
        dummy.matrix
      );

      count++;
    }

    mesh.count = count;

    if (changed) {
      mesh.instanceMatrix.needsUpdate = true;
    }

    for (const ball of balls) {
      ball.dirty = false;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, balls.length]}
      castShadow={false}
      receiveShadow={false}
    >
      <sphereGeometry
        args={[BALL_R, 10, 10]}
      />

      <meshPhysicalMaterial
        roughness={0.08}
        clearcoat={1}
      />
    </instancedMesh>
  );
}