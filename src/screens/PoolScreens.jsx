// src/screens/PoolScreens.jsx

import { useEffect } from "react";
import useScreenStore, { SCREEN } from "../store/useScreenStore.js";
import MenuScreen from "./MenuScreen.jsx";
import PlayScreen from "./PlayScreen.jsx";
import PauseScreen from "./PauseScreen.jsx";
import SettingsScreen from "./SettingsScreen.jsx";
import GameCompleteScreen from "./GameCompleteScreen.jsx";
import HighscoresScreen from "./HighscoresScreen.jsx";

function ActiveScreen({ screen }) {
  switch (screen) {
    case SCREEN.MENU:
      return <MenuScreen />;
    case SCREEN.PAUSE:
      return <PauseScreen />;
    case SCREEN.SETTINGS:
      return <SettingsScreen />;
    case SCREEN.GAME_COMPLETE:
      return <GameCompleteScreen />;
    case SCREEN.HIGHSCORES:
      return <HighscoresScreen />;
    default:
      return null;
  }
}
function PoolScreens() {
  const screen = useScreenStore((state) => state.screen), hasGame = useScreenStore((state) => state.hasGame), sessionId = useScreenStore((state) => state.sessionId);
  useEffect(() => {
    useScreenStore.getState().hydrate();
  }, []);
  useEffect(() => {
    function onKey(event) {
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
      const state = useScreenStore.getState();
      if (event.code === "KeyP" && (state.screen === SCREEN.PLAY || state.screen === SCREEN.PAUSE)) {
        event.preventDefault();
        state.togglePause();
      } else if (event.key === "Escape") {
        if (state.screen === SCREEN.PLAY) {
          event.preventDefault();
          state.pause();
        } else if (state.screen === SCREEN.PAUSE) {
          event.preventDefault();
          state.resume();
        } else if (state.screen === SCREEN.SETTINGS || state.screen === SCREEN.HIGHSCORES) {
          event.preventDefault();
          state.back();
        } else if (state.screen === SCREEN.GAME_COMPLETE) {
          event.preventDefault();
          state.goToMenu();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return <div style={{ position: "relative", width: "100%", minHeight: 560, borderRadius: 18, overflow: "hidden", background: "radial-gradient(ellipse at center,#17322f,#050910)" }}>
    {hasGame && <PlayScreen key={sessionId} />}
    <ActiveScreen key={screen} screen={screen} />
  </div>;
}
export {
  PoolScreens as default
};
