// src/PoolGame.jsx

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { setupGame } from "./ecs/setupGame.js";
import { clearWorld } from "./ecs/world.js";
import { TABLE_W, TABLE_H } from "./ecs/constants/table.js";
import PoolScene from "./PoolScene.jsx";
import useGameStore, { SCREENS } from "./store/useGameStore.js";
import MenuScreen from "./screens/MenuScreen.jsx";
import PlayScreen from "./screens/PlayScreen.jsx";
import PauseScreen from "./screens/PauseScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import GameCompleteScreen from "./screens/GameCompleteScreen.jsx";
import ScoreboardScreen from "./screens/ScoreboardScreen.jsx";
import HowToPlayScreen from "./screens/HowToPlayScreen.jsx";

const POSITION = [0, 10, 0], ROTATION = [-Math.PI / 2, 0, 0];

function FittedCamera() {
    const camera = useRef(null);
    const size = useThree((s) => s.size);
    const invalidate = useThree((s) => s.invalidate);

    useLayoutEffect(() => {
        if (!camera.current) return;

        const fittedZoom = Math.min(
            Math.max(1, size.width - 24) / (TABLE_W + 0.8),
            Math.max(1, size.height - 120) / (TABLE_H + 0.8)
        );

        camera.current.zoom = Math.max(1, fittedZoom  );

        camera.current.updateProjectionMatrix();
        invalidate();
    }, [size.width, size.height, invalidate]);

    return (
        <OrthographicCamera
            ref={camera}
            makeDefault
            position={POSITION}
            rotation={ROTATION}
            zoom={80}
        />
    );
}

function Rack() {
    const [session, setSession] = useState(null);
    useEffect(() => {
        setSession({ cueBall: setupGame() });
        return clearWorld;
    }, []);
    return <Canvas shadows dpr={[1, 1.5]} frameloop="demand" gl={{ powerPreference: "high-performance" }}>
        <FittedCamera />{session && <PoolScene cueBall={session.cueBall} />}
    </Canvas>;
}

export default function PoolGame() {
    const screen = useGameStore((s) => s.screen);
    const sessionId = useGameStore((s) => s.sessionId);
    const settingsReturnScreen = useGameStore((s) => s.settingsReturnScreen);
    const infoReturnScreen = useGameStore((s) => s.infoReturnScreen);
    const hasRack = sessionId > 0 && (screen === SCREENS.PLAY || screen === SCREENS.PAUSE || screen === SCREENS.COMPLETE || (screen === SCREENS.SETTINGS && settingsReturnScreen !== SCREENS.MENU) || ([SCREENS.SCORE_BOARD, SCREENS.HOW_TO_PLAY].includes(screen) && infoReturnScreen !== SCREENS.MENU));

    useEffect(() => {
        function onKeyDown(e) {
            if (e.repeat || e.key !== "Escape" || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)) return;
            const s = useGameStore.getState();
            if (s.screen === SCREENS.PLAY) s.pauseGame();
            else if (s.screen === SCREENS.PAUSE) s.resumeGame();
            else if (s.screen === SCREENS.SETTINGS) s.closeSettings();
            else if ([SCREENS.SCORE_BOARD, SCREENS.HOW_TO_PLAY].includes(s.screen)) s.closeInfo();
        }

        function onVisibility() { if (document.hidden) useGameStore.getState().pauseGame(); }
        window.addEventListener("keydown", onKeyDown);
        document.addEventListener("visibilitychange", onVisibility);
        return () => { window.removeEventListener("keydown", onKeyDown); document.removeEventListener("visibilitychange", onVisibility); };
    }, []);

    return (

        <div className="relative h-120 w-full min-w-0 overflow-hidden rounded-[18px]">

            {hasRack && <Rack key={sessionId} />}
            {screen === SCREENS.SCORE_BOARD && <ScoreboardScreen />}
            {screen === SCREENS.HOW_TO_PLAY && <HowToPlayScreen />}
            {screen === SCREENS.MENU && <MenuScreen />}
            {screen === SCREENS.PLAY && <PlayScreen />} 
            {screen === SCREENS.PAUSE && <PauseScreen />}
            {screen === SCREENS.SETTINGS && <SettingsScreen />}
            {screen === SCREENS.COMPLETE && <GameCompleteScreen />}
        </div>
    )

}
