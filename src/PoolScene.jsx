// src/PoolScene.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import {
  ballQuery,
  solidBallQuery,
  stripeBallQuery,
  eightBallQuery
} from "./ecs/world";

import PoolTable from "./renderers/PoolTable";
//import PoolBalls from "./renderers/PoolBalls";
import CueStick from "./renderers/CueStick";
//import PoolSolids from "./renderers/PoolSolids";
//import PoolStripes from "./renderers/PoolStripes";
//import PoolEightBall from "./renderers/PoolEightBall";

import BallRenderer from "./renderers/BallRenderer";

import AimGuide from "./renderers/AimGuide";

import CueSystem from "./ecs/systems/CueSystem";
import InputSystem from "./ecs/InputSystem";
import { PhysicsEngine } from "./ecs/PhysicsEngine";


export default function PoolScene({ cueBall }) {
  const aimRef = useRef({
    angle: 0,
    power: 0,
    swing: 0,
    swingT: 0,
    pendingShot: null,
  });

  const engineRef = useRef();

  if (!engineRef.current) {
    engineRef.current =
      new PhysicsEngine(
        cueBall,
        aimRef
      );
  }

  useFrame((_, delta) => {
    engineRef.current.update(delta);
  });

  return (
    <>
      <ambientLight intensity={0.45} />

      <directionalLight
        castShadow
        intensity={2}
        position={[3, 8, 3]}
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
      />

      <hemisphereLight intensity={0.4} />

      <PoolTable />

      {/* <Pockets /> */}

      <BallRenderer balls={ballQuery.entities} />

      <AimGuide cueBall={cueBall} aimRef={aimRef} />
      <CueStick cueBall={cueBall} aimRef={aimRef} />
      <InputSystem cueBall={cueBall} aimRef={aimRef} />
      <CueSystem cueBall={cueBall} aimRef={aimRef} />
    </>
  );
}