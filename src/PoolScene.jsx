// src/PoolScene.jsx

import { Suspense, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ballQuery } from "./ecs/world.js";
import TableRenderer from "./renderers/TableRenderer.jsx";
import StickRenderer from "./renderers/StickRenderer.jsx";
import BallRenderer from "./renderers/BallRenderer.jsx";
import AimGuideRenderer from "./renderers/AimGuideRenderer.jsx";
import AimController, { createAim } from "./ecs/AimController.jsx";
import SceneLab from "./lab/SceneLab";
import { PhysicsEngine } from "./ecs/PhysicsEngine.js";
import useGameStore, { SCREENS } from "./store/useGameStore.js";

export default function PoolScene({ cueBall }) {
    const playing = useGameStore((s) => s.screen === SCREENS.PLAY);
    const showAimGuide = useGameStore((s) => s.settings.showAimGuide);
    const [aimRef] = useState(() => ({ current: createAim() }));
    const [engine] = useState(() => new PhysicsEngine(cueBall, aimRef));
    const invalidate = useThree((s) => s.invalidate);
    useEffect(() => {
        // Cancel charging, queued shots and swings when leaving play.
        Object.assign(aimRef.current, createAim());
        invalidate();
    }, [playing, aimRef, invalidate]);
    useFrame((state, dt) => {
        // Read synchronously: completeGame/pauseGame takes effect before another tick.
        if (useGameStore.getState().screen !== SCREENS.PLAY) return;
        if (engine.update(Math.min(dt, 1 / 30))) state.invalidate();
    }, -1);
    return <>
        <Suspense fallback={null}><SceneLab /></Suspense>
        <Suspense fallback={null}><TableRenderer /></Suspense>
        <BallRenderer balls={ballQuery.entities} />
        {playing && <>
            {showAimGuide && <AimGuideRenderer cueBall={cueBall} aimRef={aimRef} />}
            <StickRenderer cueBall={cueBall} aimRef={aimRef} />
            <AimController cueBall={cueBall} aimRef={aimRef} />
        </>}
    </>;
}
