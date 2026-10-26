// src/renderers/BallRenderer.jsx

import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ballGeometry, ballMaterial } from "./ballAssets.js";
import { getBallUvOffset } from "./ballTextures.js";
import { dirtyBalls } from "../ecs/world.js";

function writeBall(mesh, dummy, ball) {
  dummy.position.set(ball.x, ball.y, ball.z);
  dummy.rotation.set(ball.rotX, ball.rotY, ball.rotZ);
  dummy.scale.setScalar(ball.pocketed ? 0 : 1);
  dummy.updateMatrix();
  mesh.setMatrixAt(ball.instanceId, dummy.matrix);
  ball.dirty = false;
}

function BallRenderer({ balls }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const offsets = ballGeometry.getAttribute("instanceUvOffset");
    for (const ball of balls) {
      const [u, v] = getBallUvOffset(ball.id);
      offsets.setXY(ball.instanceId, u, v);
      writeBall(mesh, dummy, ball);
    }
    dirtyBalls.clear();
    offsets.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  }, [balls, dummy]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh || !dirtyBalls.size) return;
    for (const ball of dirtyBalls) writeBall(mesh, dummy, ball);
    dirtyBalls.clear();
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[ballGeometry, ballMaterial, balls.length]} frustumCulled={false} castShadow receiveShadow dispose={null} />
  )

}

export {
  BallRenderer as default
};
