// src/PoolScene.jsx

import { Suspense, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { ballQuery } from "./ecs/world.js";
import TableRenderer from "./renderers/TableRenderer.jsx";
import StickRenderer from "./renderers/StickRenderer.jsx";
import BallRenderer from "./renderers/BallRenderer.jsx";
import AimGuideRenderer from "./renderers/AimGuideRenderer.jsx";
import AimController, { createAim } from "./ecs/AimController.jsx";
import SceneLab from "./lab/SceneLab";
import { PhysicsEngine } from "./ecs/PhysicsEngine.js";

function PoolScene({ cueBall }) {
 
  const [aimRef] = useState(() => ({ current: createAim() }));
  const [engine] = useState(() => new PhysicsEngine(cueBall, aimRef));
 
  useFrame((state, dt) => {
    if (engine.update(dt)) state.invalidate();
  }, -1);
  
  return <>
    <Suspense fallback={null}><SceneLab /></Suspense>
    <Suspense fallback={null}><TableRenderer /></Suspense>
    <BallRenderer balls={ballQuery.entities} />
    <AimGuideRenderer cueBall={cueBall} aimRef={aimRef} />
    <StickRenderer cueBall={cueBall} aimRef={aimRef} />
    <AimController cueBall={cueBall} aimRef={aimRef} />
  </>;

}
export {
  PoolScene as default
};
