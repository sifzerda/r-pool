// src/PoolScene.jsx

import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import { ballQuery } from "./ecs/world.js";
import TableRenderer from "./renderers/TableRenderer.jsx";
import StickRenderer from "./renderers/StickRenderer.jsx";
import BallRenderer from "./renderers/BallRenderer.jsx";
import AimGuideRenderer from "./renderers/AimGuideRenderer.jsx";
import AimController, { createAim } from "./ecs/AimController.jsx";
import HandRenderer from "./renderers/HandRenderer.jsx";
import AIController from "./ai/AIController.jsx";
import { PhysicsEngine } from "./ecs/PhysicsEngine.js";

import useGameStore, { SCREENS } from "./store/useGameStore.js";
import { applyAppearance } from "./paintjob/applyAppearance.js";

export default function PoolScene({ cueBall }) {
  const playing = useGameStore(
    (s) => s.screen === SCREENS.PLAY
  );

  const showAimGuide = useGameStore(
    (s) => s.settings.showAimGuide
  );

  const appearanceParams = useGameStore(
    (s) => s.appearanceParams
  );

  const [aimRef] = useState(() => ({
    current: createAim(),
  }));

  const [engine] = useState(
    () => new PhysicsEngine(cueBall, aimRef)
  );

  const invalidate = useThree((s) => s.invalidate);

  // Apply the selected appearance to shared materials.
  useLayoutEffect(() => {
    applyAppearance(appearanceParams);
    invalidate();
  }, [appearanceParams, invalidate]);

  // Reset aiming state when entering/leaving gameplay.
  useEffect(() => {
    Object.assign(aimRef.current, createAim());
    invalidate();
  }, [playing, aimRef, invalidate]);

  // Physics update.
  useFrame((state, dt) => {
    if (useGameStore.getState().screen !== SCREENS.PLAY) {
      return;
    }

    if (engine.update(Math.min(dt, 1 / 30))) {
      state.invalidate();
    }
  }, -1);

  return (
    <>
      <Suspense fallback={null}>
        <TableRenderer />
      </Suspense>

      <BallRenderer balls={ballQuery.entities} />

      {playing && (
        <>
          <HandRenderer cueBall={cueBall} aimRef={aimRef} />

          {showAimGuide && (
            <AimGuideRenderer
              cueBall={cueBall}
              aimRef={aimRef}
            />
          )}

          <StickRenderer cueBall={cueBall} aimRef={aimRef} />

          <AimController
            cueBall={cueBall}
            aimRef={aimRef}
          />

          <AIController
            cueBall={cueBall}
            aimRef={aimRef}
          />
        </>
      )}
    </>
  );
}
