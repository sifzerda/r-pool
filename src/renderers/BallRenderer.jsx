// src/renderers/BallRenderer.jsx

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { ballGeometry, ballMaterial } from "./ballAssets.js";
import { getBallUvOffset } from "./ballTextures.js";
import { dirtyBalls } from "../ecs/world.js";
import useGameStore from "../store/useGameStore.js";

function writeBall(mesh, dummy, ball, ballInHand) {
  dummy.position.set(ball.x, ball.y, ball.z);
  dummy.rotation.set(
    ball.rotX || 0,
    ball.rotY || 0,
    ball.rotZ || 0
  );

  const hidden =
    ball.pocketed ||
    (ball.id === 0 && ballInHand);

  dummy.scale.setScalar(hidden ? 0 : 1);
  dummy.updateMatrix();

  mesh.setMatrixAt(ball.instanceId, dummy.matrix);
  ball.dirty = false;
}

function BallRenderer({ balls }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const ballInHand = useGameStore((s) => s.ballInHand);

  const ballInHandRef = useRef(ballInHand);
  const cueBallRef = useRef(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const offsets = ballGeometry.getAttribute(
      "instanceUvOffset"
    );

    cueBallRef.current = null;

    for (const ball of balls) {
      if (ball.id === 0) cueBallRef.current = ball;

      const [u, v] = getBallUvOffset(ball.id);
      offsets.setXY(ball.instanceId, u, v);

      writeBall(mesh, dummy, ball, ballInHand);
      dirtyBalls.delete(ball);
    }

    offsets.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;

    ballInHandRef.current = ballInHand;
  }, [balls, dummy]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    const cueBall = cueBallRef.current;

    ballInHandRef.current = ballInHand;

    if (!mesh || !cueBall) return;

    writeBall(mesh, dummy, cueBall, ballInHand);
    mesh.instanceMatrix.needsUpdate = true;
  }, [ballInHand, dummy]);

  useFrame(() => {
    const mesh = meshRef.current;

    if (!mesh || dirtyBalls.size === 0) return;

    let updated = false;

    for (const ball of dirtyBalls) {
      if (
        ball.instanceId == null ||
        ball.instanceId < 0 ||
        ball.instanceId >= mesh.count
      ) {
        continue;
      }

      writeBall(
        mesh,
        dummy,
        ball,
        ballInHandRef.current
      );

      updated = true;
    }

    dirtyBalls.clear();

    if (updated) {
      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[ballGeometry, ballMaterial, balls.length]}
      frustumCulled={false}
      castShadow
      receiveShadow
      dispose={null}
    />
  );
}

export default BallRenderer;
