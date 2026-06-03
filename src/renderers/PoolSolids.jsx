// src/renderers/PoolSolids.jsx

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, InstancedBufferAttribute } from "three";

import { BALL_R } from "../ecs/constants/table";

const dummy = new Object3D();

export default function PoolSolids({ balls }) {

  const meshRef = useRef();

useEffect(() => {

  if (!meshRef.current) return;

  balls.forEach((ball, i) => {

    meshRef.current.setColorAt(i, ball.renderColor);

  });

  if (meshRef.current.instanceColor) {

    meshRef.current.instanceColor.needsUpdate = true;

  }

}, [balls]);

  useFrame(() => {

    if (!meshRef.current) return;

    let count = 0;

    for (const ball of balls) {

      if (ball.pocketed) continue;

      dummy.position.set(ball.x, 0.3, ball.z);

      dummy.updateMatrix();
      //ball.dirty = false;

      meshRef.current.setMatrixAt(count, dummy.matrix);

      count++;
    }

    meshRef.current.count = count;

    meshRef.current.instanceMatrix.needsUpdate = true;

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }

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
        roughness={0.08}
        clearcoat={1}
        clearcoatRoughness={0}
      />

    </instancedMesh>

  );
}