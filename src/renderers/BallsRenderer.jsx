// src/renderers/BallsRenderer.jsx

import { InstancedMesh, Object3D } from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

const dummy = new Object3D();

export default function Balls({ balls }) {
  const mesh =
    useRef();

  useFrame(() => {
    balls.forEach(
      (ball, i) => {
        dummy.position.set(
          (ball.x - 340) / 100, 0.1,
          (ball.y - 170) / 100
        );

        dummy.rotation.x = ball.rotationX;
        dummy.rotation.z = ball.rotationZ;

        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
    );

    mesh.current .instanceMatrix .needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[ null, null, balls.length ]}
      castShadow
    >
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color="#ffffff" />
    </instancedMesh>
  );
}