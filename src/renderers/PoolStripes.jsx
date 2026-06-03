// src/renderers/PoolStripes.jsx

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, InstancedBufferAttribute } from "three";

import { BALL_R } from "../ecs/constants/table";

const dummy = new Object3D();

export default function PoolStripes({ balls }) {

  const whiteMeshRef = useRef();
  const stripeMeshRef = useRef();

  useEffect(() => {

  if (!stripeMeshRef.current) return;

  stripeMeshRef.current.instanceColor =
    new InstancedBufferAttribute(
      new Float32Array(
        balls.length * 3
      ),
      3
    );

}, [balls.length]);

  useFrame(() => {

    let count = 0;

    for (const ball of balls) {

      if (ball.pocketed) continue;

      dummy.position.set(
        ball.x,
        0.3,
        ball.z
      );

      dummy.rotation.set(
  Math.PI / 2,
  0,
  0
);

      dummy.updateMatrix();

      whiteMeshRef.current.setMatrixAt(
        count,
        dummy.matrix
      );

      stripeMeshRef.current.setMatrixAt(
        count,
        dummy.matrix
      );

      stripeMeshRef.current.setColorAt(
        count,
        ball.renderColor
      );

      count++;
    }

    whiteMeshRef.current.count = count;
    stripeMeshRef.current.count = count;

    whiteMeshRef.current.instanceMatrix.needsUpdate = true;
    stripeMeshRef.current.instanceMatrix.needsUpdate = true;

    stripeMeshRef.current.instanceColor.needsUpdate = true;

  });

  return (
    <>

      {/* White base ball */}

      <instancedMesh
        ref={whiteMeshRef}
        args={[null, null, balls.length]}
        castShadow
      >

        <sphereGeometry
          args={[BALL_R, 12, 12]}
        />

        <meshPhysicalMaterial
          color="white"
          roughness={0.08}
          clearcoat={1}
        />

      </instancedMesh>

      {/* Stripe */}

      <instancedMesh
        ref={stripeMeshRef}
        args={[null, null, balls.length]}
      >

        <cylinderGeometry
          args={[
            BALL_R * 1.02,
            BALL_R * 1.02,
            BALL_R * 0.9,
            24,
            1,
            true
          ]}
        />

        <meshPhysicalMaterial
          roughness={0.08}
          clearcoat={1}
        />

      </instancedMesh>

    </>
  );
}