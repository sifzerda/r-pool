// src/renderers/PoolEightBall.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D } from "three";

import { BALL_R } from "../ecs/constants/table";

const dummy = new Object3D();

export default function PoolEightBall({ balls }) {

  const meshRef = useRef();

  useFrame(() => {

    if (!meshRef.current) return;

    let count = 0;

    for (const ball of balls) {

      if (ball.pocketed) continue;

      dummy.position.set(
        ball.x,
        0.3,
        ball.z
      );

      dummy.updateMatrix();

      meshRef.current.setMatrixAt(
        count,
        dummy.matrix
      );

      count++;
    }

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;

  });

  return (

    <instancedMesh
      ref={meshRef}
      args={[null, null, balls.length]}
      castShadow
      receiveShadow
    >

      <sphereGeometry
        args={[BALL_R, 12, 12]}
      />

      <meshPhysicalMaterial
        color="#111111"
        roughness={0.08}
        clearcoat={1}
      />

    </instancedMesh>

  );
}