// src/PoolScene.jsx

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { Line } from "@react-three/drei";

import {
  world,
  ballQuery,
  cueBallQuery,
  solidBallQuery,
  stripeBallQuery,
  eightBallQuery
} from "./ecs/world";

import PoolTable from "./renderers/PoolTable";
import PoolBalls from "./renderers/PoolBalls";
import CueStick from "./renderers/CueStick";
import PoolSolids from "./renderers/PoolSolids";
import PoolStripes from "./renderers/PoolStripes";
import PoolEightBall from "./renderers/PoolEightBall";

import { physicsSystem } from "./ecs/systems/physicsSystem";
import { frictionSystem } from "./ecs/systems/frictionSystem";
import { collisionSystem } from "./ecs/systems/collisionSystem";
import { pocketSystem } from "./ecs/systems/pocketSystem";
import CueSystem from "./ecs/systems/CueSystem";
import AimGuide from "./renderers/AimGuide";

import { toRenderX, toRenderZ } from "./ecs/utils/coords";

export default function PoolScene({ cueBall }) {
  const aimRef = useRef({
    angle: 0,
    power: 0,
    swing: 0,
    swingT: 0,
  });

  const accumulatorRef = useRef(0);
  const raycaster = useRef(new THREE.Raycaster());
  const point = useRef(new THREE.Vector3());
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const FIXED_DT = 1 / 90;
  const SUBSTEPS = 2;

  const { camera } = useThree();

  useFrame((state, delta) => {
    accumulatorRef.current += delta;

    const SUBSTEPS = 4;

    while (accumulatorRef.current >= FIXED_DT) {

      const subDt = FIXED_DT / SUBSTEPS;

      for (let i = 0; i < SUBSTEPS; i++) {

        physicsSystem(world, subDt);
        collisionSystem(world);
        pocketSystem();
        frictionSystem(world, subDt);
      }

      accumulatorRef.current -= FIXED_DT;
    }

    raycaster.current.setFromCamera(state.pointer, camera);

    const hit = raycaster.current.ray.intersectPlane(
      plane.current,
      point.current
    );

    if (!hit) return;

    const cueX = toRenderX(cueBall.x);
    const cueZ = toRenderZ(cueBall.z);

    // FIXED DIRECTION (mouse → cue)
    const dx = cueX - point.current.x;
    const dz = cueZ - point.current.z;

    aimRef.current.angle = Math.atan2(dz, dx);
  });

  return (
    <>
      <ambientLight intensity={0.45} />

      <directionalLight
        castShadow
        intensity={2}
        position={[3, 8, 3]}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />

      <hemisphereLight intensity={0.4} />

      <PoolTable />

      {/* <Pockets /> */}

      <PoolBalls balls={ballQuery.entities} />

      <PoolSolids
        balls={solidBallQuery.entities}
      />

      <PoolStripes
        balls={stripeBallQuery.entities}
      />

      <PoolEightBall
        balls={eightBallQuery.entities}
      />

      <AimGuide
        cueBall={cueBall}
        aimRef={aimRef}
      />

      <CueStick cueBall={cueBall} aimRef={aimRef} />
      <CueSystem cueBall={cueBall} aimRef={aimRef} />
    </>
  );
}