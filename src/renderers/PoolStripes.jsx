// src/renderers/PoolStripes.jsx

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D } from "three";

import { BALL_R } from "../ecs/constants/table";

const dummy = new Object3D();

export default function PoolStripes({ balls }) {
  const whiteMeshRef = useRef();
  const stripeMeshRef = useRef();

  // Initialize stripe colors once
  useEffect(() => {
    const stripeMesh = stripeMeshRef.current;

    if (!stripeMesh) return;

    balls.forEach((ball, i) => {
      stripeMesh.setColorAt(
        i,
        ball.renderColor
      );
    });

    if (stripeMesh.instanceColor) {
      stripeMesh.instanceColor.needsUpdate = true;
    }
  }, [balls]);

  useFrame(() => {
    const whiteMesh = whiteMeshRef.current;
    const stripeMesh = stripeMeshRef.current;

    if (!whiteMesh || !stripeMesh) return;

    let count = 0;

    for (const ball of balls) {
      if (ball.pocketed) continue;

      dummy.position.set(
        ball.x,
        0.3,
        ball.z
      );

      dummy.updateMatrix();

      whiteMesh.setMatrixAt(
        count,
        dummy.matrix
      );

      stripeMesh.setMatrixAt(
        count,
        dummy.matrix
      );

      count++;
    }

    whiteMesh.count = count;
    stripeMesh.count = count;

    if (whiteMesh.instanceMatrix) {
      whiteMesh.instanceMatrix.needsUpdate = true;
    }

    if (stripeMesh.instanceMatrix) {
      stripeMesh.instanceMatrix.needsUpdate = true;
    }
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

      {/* Colored stripe */}

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
            true,
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