// src/PoolScene.jsx

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { world, balls } from "./ecs/world";

import PoolTable from "./renderers/PoolTable";
import PoolBalls from "./renderers/PoolBalls";
import CueStick from "./renderers/CueStick";

import { physicsSystem } from "./ecs/systems/physicsSystem";
import { frictionSystem } from "./ecs/systems/frictionSystem";
import { collisionSystem } from "./ecs/systems/collisionSystem";
import CueSystem from "./ecs/systems/CueSystem";

import { toRenderX, toRenderZ } from "./ecs/utils/coords";

export default function PoolScene({ cueBall }) {
  const aimRef = useRef({
    angle: 0,
    power: 0,
    swing: 0,        // 0 = idle, 1 = pulled back, 2 = striking
    swingT: 0,       // animation timer
  });

  const accumulatorRef = useRef(0);

  const raycaster = useRef(new THREE.Raycaster());
  const point = useRef(new THREE.Vector3());

  const plane = useRef(
    new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      0
    )
  );

  const FIXED_DT = 1 / 120;

  const { camera } = useThree();

  useFrame((state, delta) => {


    console.log(
      "cue",
      cueBall.x,
      cueBall.z,
      cueBall.vx,
      cueBall.vz
    );

    accumulatorRef.current += delta;

    while (accumulatorRef.current >= FIXED_DT) {
      physicsSystem(world, FIXED_DT);
      collisionSystem(world);
      frictionSystem(world);

      accumulatorRef.current -= FIXED_DT;
    }

    raycaster.current.setFromCamera(
      state.pointer,
      camera
    );

    const hit =
      raycaster.current.ray.intersectPlane(
        plane.current,
        point.current
      );

    if (!hit) return;


    console.log("cueBall", cueBall);

    const cueX =
      toRenderX(cueBall.x);

    const cueZ =
      toRenderZ(cueBall.z);

    const dx =
      point.current.x - cueX;

    const dz =
      point.current.z - cueZ;

    if (
      Number.isNaN(dx) ||
      Number.isNaN(dz)
    ) {
      console.log({
        cueX,
        cueZ,
        pointX: point.current.x,
        pointZ: point.current.z,
        cueBall,
      });
    }

   aimRef.current.angle = Math.atan2(dz, dx);
  });

  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        castShadow
        intensity={2}
        position={[3, 8, 3]}
      />

      <PoolTable />

      <PoolBalls balls={[...balls]} />

      <CueStick
        cueBall={cueBall}
        aimRef={aimRef}
      />

      <CueSystem
        cueBall={cueBall}
        aimRef={aimRef}
      />

      {/* debug marker */}
      <mesh
        position={[
          toRenderX(cueBall.x),
          0.2,
          toRenderZ(cueBall.z),
        ]}
      >
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </>
  );
}