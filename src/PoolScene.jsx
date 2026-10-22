// src/PoolScene.jsx

import { useState } from "react";
import { useFrame } from "@react-three/fiber";

import { ballQuery } from "./ecs/world";

import TableRenderer from "./renderers/TableRenderer";
import StickRenderer from "./renderers/StickRenderer";
import BallRenderer from "./renderers/BallRenderer";
import AimGuideRenderer from "./renderers/AimGuideRenderer";
import AimController from "./ecs/AimController";
import SceneLab from "./lab/SceneLab";
import { PhysicsEngine } from "./ecs/PhysicsEngine";

const createAim = () => ({
  angle: 0,
  cos: 1,
  sin: 0,

  power: 0,
  pullBack: 0,

  charging: false,

  pointerX: 0,
  pointerZ: 0,

  dragStartX: 0,
  dragStartZ: 0,

  lockedAngle: 0,
  lockedCos: 1,
  lockedSin: 0,

  swing: 0,
  swingT: 0,

  pendingShot: null,
});

export default function PoolScene({ cueBall }) {
  const [aimRef] = useState(() => ({ current: createAim() }));
  const [engine] = useState(() => new PhysicsEngine(cueBall, aimRef));

  // frameloop="demand": keep rendering only while something is happening.
  useFrame((state, delta) => {
    if (engine.update(delta)) state.invalidate();
  });

  return (
    <>
      {/* Lights, reflections, background and exposure (all Lab-controlled). */}
      <SceneLab />

      <TableRenderer />
      <BallRenderer balls={ballQuery.entities} />

      <AimGuideRenderer cueBall={cueBall} aimRef={aimRef} />
      <StickRenderer cueBall={cueBall} aimRef={aimRef} />
      <AimController cueBall={cueBall} aimRef={aimRef} />
    </>
  );
}