// src/renderers/PoolBalls.jsx

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, Object3D, InstancedBufferAttribute } from "three";
import { BALL_R } from "../ecs/constants/table";

import * as THREE from "three";

const dummy = new Object3D();

const solidMaterial =
  new THREE.MeshPhysicalMaterial({
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0,
    metalness: 0
  });

export default function PoolBalls({ balls }) {
  const meshRef = useRef();

  useEffect(() => {

    if (!meshRef.current) return;

    balls.forEach((ball, i) => {

      meshRef.current.setColorAt(
        i,
        ball.renderColor
      );

    });

    meshRef.current.instanceColor.needsUpdate = true;

  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    let i = 0;

    for (const ball of balls) {

      if (ball.pocketed) continue;

      dummy.position.set(ball.x, 0.3, ball.z); // pockets height on table felt
      dummy.updateMatrix();
      ball.dirty = false;
      meshRef.current.setMatrixAt(i, dummy.matrix);

      if (!ball.renderColor) {
        console.log("Missing renderColor", ball);
      }

      meshRef.current.setColorAt(i, ball.renderColor);

      i++;
    }

    meshRef.current.count = i;
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
      receiveShadow>
      <sphereGeometry args={[BALL_R, 12, 12]} /> { /* can make these 24 for bigger balls */}
      <primitive object={solidMaterial} />
    </instancedMesh>
  );
}