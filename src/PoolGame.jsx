// src/PoolGame.jsx

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { setupGame } from "./ecs/setupGame.js";
import { clearWorld } from "./ecs/world.js";
import { TABLE_W, TABLE_H } from "./ecs/constants/table.js";
import PoolScene from "./PoolScene.jsx";
import LabPanel from "./lab/LabPanel";
import useGameStore, { SCREENS } from "./store/useGameStore.js";
import MenuScreen from "./screens/MenuScreen.jsx";
import PlayScreen from "./screens/PlayScreen.jsx";
import PauseScreen from "./screens/PauseScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import GameCompleteScreen from "./screens/GameCompleteScreen.jsx";
import HighScoresScreen from "./screens/HighScoresScreen.jsx";
import HowToPlayScreen from "./screens/HowToPlayScreen.jsx";

const POSITION = [0, 10, 0], ROTATION = [-Math.PI / 2, 0, 0];

function FittedCamera() {
    const camera = useRef();
    const size = useThree((s) => s.size);
    const invalidate = useThree((s) => s.invalidate);
    useLayoutEffect(() => {
        if (!camera.current) return;
        camera.current.zoom = Math.max(1, Math.min(80, (size.width - 24) / (TABLE_W + .8), (size.height - 120) / (TABLE_H + .8)));
        camera.current.updateProjectionMatrix(); invalidate();
    }, [size.width, size.height, invalidate]);
    return <OrthographicCamera ref={camera} makeDefault position={POSITION} rotation={ROTATION} zoom={80} />;
}

function Rack() {
    const [session, setSession] = useState(null);
    useEffect(() => {
        clearWorld();
        setSession({ cueBall: setupGame() });
        return clearWorld;
    }, []);

    return (
        <Canvas shadows dpr={[1, 1.5]} frameloop="demand" gl={{ powerPreference: "high-performance" }}>
            <FittedCamera />
            {session && <PoolScene cueBall={session.cueBall} />}
        </Canvas>
    )
}

export default function PoolGame() {

    const screen = useGameStore((s) => s.screen);
    const sessionId = useGameStore((s) => s.sessionId);
    const [labOpen, setLabOpen] = useState(false);
    const hasRack = sessionId > 0 && (screen === SCREENS.PLAY || screen === SCREENS.PAUSE || screen === SCREENS.COMPLETE || (screen === SCREENS.SETTINGS && useGameStore.getState().settingsReturnScreen !== SCREENS.MENU) || ([SCREENS.HIGH_SCORES, SCREENS.HOW_TO_PLAY].includes(screen) && useGameStore.getState().infoReturnScreen !== SCREENS.MENU));

    useEffect(() => { setLabOpen(false); }, [screen, sessionId]);

    useEffect(() => {
        function onKeyDown(e) {
            if (e.repeat || e.key !== "Escape" || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)) return;
            const s = useGameStore.getState();
            if (s.screen === SCREENS.PLAY) s.pauseGame();
            else if (s.screen === SCREENS.PAUSE) s.resumeGame();
            else if (s.screen === SCREENS.SETTINGS) s.closeSettings();
            else if ([SCREENS.HIGH_SCORES, SCREENS.HOW_TO_PLAY].includes(s.screen)) s.closeInfo();
        }
        function onVisibility() { if (document.hidden) useGameStore.getState().pauseGame(); }
        window.addEventListener("keydown", onKeyDown);
        document.addEventListener("visibilitychange", onVisibility);
        return () => { window.removeEventListener("keydown", onKeyDown); document.removeEventListener("visibilitychange", onVisibility); };
    }, []);

    return (

        <div style={{ width: "100%", height: 560, position: "relative", minWidth: 0, overflow: "hidden", borderRadius: 18, background: "#061017" }}>
            {hasRack && <Rack key={sessionId} />}
            {screen === SCREENS.HIGH_SCORES && <HighScoresScreen />}
            {screen === SCREENS.HOW_TO_PLAY && <HowToPlayScreen />}
            {screen === SCREENS.MENU && <MenuScreen />}
            {screen === SCREENS.PLAY && <PlayScreen labOpen={labOpen} onToggleLab={() => setLabOpen((v) => !v)} />}
            {screen === SCREENS.PAUSE && <PauseScreen />}
            {screen === SCREENS.SETTINGS && <SettingsScreen />}
            {screen === SCREENS.COMPLETE && <GameCompleteScreen />}
            {screen === SCREENS.PLAY && labOpen && <div style={{ position: "absolute", top: 0, right: 0, bottom: 62, maxWidth: "100%", overflow: "auto", zIndex: 5 }}><LabPanel onClose={() => setLabOpen(false)} /></div>}
        </div>

    )
}
