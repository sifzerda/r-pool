// src/PoolScene.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { ballQuery, solidBallQuery, stripeBallQuery, eightBallQuery } from "./ecs/world";

import PoolTableRenderer from "./renderers/PoolTableRenderer";
import CueStickRenderer from "./renderers/CueStickRenderer";
import BallRenderer from "./renderers/BallRenderer";
import AimGuideRenderer from "./renderers/AimGuideRenderer";
import CueSystem from "./ecs/systems/CueSystem";
import InputSystem from "./ecs/InputSystem";
import { PhysicsEngine } from "./ecs/PhysicsEngine";

export default function PoolScene({ cueBall }) {
  const aimRef = useRef({ angle: 0, power: 0, swing: 0, swingT: 0, pendingShot: null });

  const engineRef = useRef();

  if (!engineRef.current) {
    engineRef.current = new PhysicsEngine(cueBall, aimRef);
  }

  useFrame((_, delta) => {
    engineRef.current.update(delta);
  });

  return (
    <>
      <ambientLight intensity={0.45} />

      <directionalLight
        castShadow
        intensity={2.5}
        position={[4, 8, 2]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      <hemisphereLight intensity={0.4} />

      <PoolTableRenderer />
      <BallRenderer balls={ballQuery.entities} />

      <AimGuideRenderer cueBall={cueBall} aimRef={aimRef} />
      <CueStickRenderer cueBall={cueBall} aimRef={aimRef} />
      <InputSystem cueBall={cueBall} aimRef={aimRef} />
      <CueSystem cueBall={cueBall} aimRef={aimRef} />
    </>
  );
}