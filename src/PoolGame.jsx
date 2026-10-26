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
import HowToPlayScreen from "./screens/HowToPlayScreen.jsx";
import ScoreboardScreen from "./screens/ScoreboardScreen.jsx";

const POSITION = [0, 10, 0];
const ROTATION = [-Math.PI / 2, 0, 0];

function FittedCamera() {
  const camera = useRef();
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    if (!camera.current) return;

    camera.current.zoom = Math.max(
      1,
      Math.min(
        80,
        (size.width - 24) / (TABLE_W + 0.8),
        (size.height - 120) / (TABLE_H + 0.8)
      )
    );

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

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      frameloop="demand"
      gl={{ powerPreference: "high-performance" }}
    >
      <FittedCamera />

      {session && <PoolScene cueBall={session.cueBall} />}
    </Canvas>
  );
}

export default function PoolGame() {
  const screen = useGameStore((s) => s.screen);
  const sessionId = useGameStore((s) => s.sessionId);
  const settingsReturnScreen = useGameStore(
    (s) => s.settingsReturnScreen
  );
  const infoReturnScreen = useGameStore(
    (s) => s.infoReturnScreen
  );

  const [labOpen, setLabOpen] = useState(false);

  const isInfoScreen =
    screen === SCREENS.HOW_TO_PLAY ||
    screen === SCREENS.SCORE_BOARD;

  // Keep the current rack mounted behind pause and information screens.
  const hasRack =
    sessionId > 0 &&
    (
      screen === SCREENS.PLAY ||
      screen === SCREENS.PAUSE ||
      screen === SCREENS.COMPLETE ||
      (
        screen === SCREENS.SETTINGS &&
        settingsReturnScreen !== SCREENS.MENU
      ) ||
      (
        isInfoScreen &&
        infoReturnScreen !== SCREENS.MENU
      )
    );

  useEffect(() => {
    setLabOpen(false);
  }, [screen, sessionId]);

  useEffect(() => {
    function onKeyDown(event) {
      if (
        event.repeat ||
        event.key !== "Escape" ||
        /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName)
      ) {
        return;
      }

      const state = useGameStore.getState();

      if (state.screen === SCREENS.PLAY) {
        state.pauseGame();
      } else if (state.screen === SCREENS.PAUSE) {
        state.resumeGame();
      } else if (state.screen === SCREENS.SETTINGS) {
        state.closeSettings();
      } else if (
        state.screen === SCREENS.HOW_TO_PLAY ||
        state.screen === SCREENS.SCORE_BOARD
      ) {
        state.closeInfo();
      }
    }

    function onVisibility() {
      if (document.hidden) {
        useGameStore.getState().pauseGame();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener(
        "visibilitychange",
        onVisibility
      );
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: 560,
        position: "relative",
        minWidth: 0,
        overflow: "hidden",
        borderRadius: 18,
        background: "#061017",
      }}
    >
      {hasRack && <Rack key={sessionId} />}

      {screen === SCREENS.MENU && <MenuScreen />}

      {screen === SCREENS.PLAY && (
        <PlayScreen
          labOpen={labOpen}
          onToggleLab={() => setLabOpen((open) => !open)}
        />
      )}

      {screen === SCREENS.PAUSE && <PauseScreen />}
      {screen === SCREENS.SETTINGS && <SettingsScreen />}
      {screen === SCREENS.COMPLETE && <GameCompleteScreen />}
      {screen === SCREENS.HOW_TO_PLAY && <HowToPlayScreen />}
      {screen === SCREENS.SCORE_BOARD && <ScoreboardScreen />}

      {screen === SCREENS.PLAY && labOpen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 62,
            maxWidth: "100%",
            overflow: "auto",
            zIndex: 5,
          }}
        >
          <LabPanel onClose={() => setLabOpen(false)} />
        </div>
      )}
    </div>
  );
}