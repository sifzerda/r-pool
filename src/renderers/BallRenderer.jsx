//src/renderers/BallRenderer.jsx

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, Color } from "three";
import { BALL_R } from "../ecs/constants/table";

const dummy = new Object3D();

export default function BallRenderer({ balls }) {
  const solidRef = useRef();
  const stripeBaseRef = useRef();
  const stripeBandRef = useRef();

  useEffect(() => {
    if (!solidRef.current) return;

    let solidIndex = 0;
    let stripeIndex = 0;

    for (const ball of balls) {
      if (ball.type === "stripe") {
        stripeBaseRef.current.setColorAt(stripeIndex, new Color("#ffffff"));

        stripeBandRef.current.setColorAt(stripeIndex, ball.renderColor);

        stripeIndex++;
      } else {
        solidRef.current.setColorAt(solidIndex, ball.renderColor);

        solidIndex++;
      }
    }

    solidRef.current.instanceColor.needsUpdate = true;
    stripeBaseRef.current.instanceColor.needsUpdate = true;
    stripeBandRef.current.instanceColor.needsUpdate = true;
  }, [balls]);

  useFrame(() => {
    if (!solidRef.current || !stripeBaseRef.current || !stripeBandRef.current)
      return;

    let solidIndex = 0;
    let stripeIndex = 0;

    let changed = false;

    for (const ball of balls) {
      if (ball.pocketed) continue;

      if (ball.dirty) changed = true;

      dummy.position.set(ball.x, 0.3, ball.z
      );

      dummy.rotation.set(0, 0, 0);

      dummy.updateMatrix();

      if (ball.type === "stripe") {
        stripeBaseRef.current.setMatrixAt(stripeIndex, dummy.matrix);

        dummy.rotation.z = Math.PI / 2;

        dummy.updateMatrix();

        stripeBandRef.current.setMatrixAt(stripeIndex, dummy.matrix);

        stripeIndex++;
      } else {
        solidRef.current.setMatrixAt(solidIndex, dummy.matrix);
        solidIndex++;
      }

      ball.dirty = false;
    }

    solidRef.current.count = solidIndex;
    stripeBaseRef.current.count = stripeIndex;
    stripeBandRef.current.count = stripeIndex;

    if (changed) {
      solidRef.current.instanceMatrix.needsUpdate = true;
      stripeBaseRef.current.instanceMatrix.needsUpdate = true;
      stripeBandRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {/* cue ball, solids, eight ball */}

      <instancedMesh
        ref={solidRef}
        args={[null, null, balls.length]}
        castShadow={false}
        receiveShadow={false}
      >
        <sphereGeometry
          args={[BALL_R, 12, 12]}
        />

        <meshPhysicalMaterial
          roughness={0.08}
          clearcoat={1}
        />
      </instancedMesh>

      {/* stripe white base */}

      <instancedMesh
        ref={stripeBaseRef}
        args={[null, null, balls.length]}
        castShadow={false}
        receiveShadow={false}
      >
        <sphereGeometry
          args={[BALL_R, 12, 12]}
        />

        <meshPhysicalMaterial
          roughness={0.08}
          clearcoat={1}
        />
      </instancedMesh>

      {/* stripe colored band */}

      <instancedMesh
        ref={stripeBandRef}
        args={[null, null, balls.length]}
        castShadow={false}
        receiveShadow={false}
      >
        <cylinderGeometry
          args={[
            BALL_R * 1.02,
            BALL_R * 1.02,
            BALL_R * 0.85,
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