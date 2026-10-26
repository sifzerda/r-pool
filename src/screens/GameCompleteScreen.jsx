// src/screens/GameCompleteScreen.jsx

import useGameStore from "../store/useGameStore.js";
import ScreenPanel, { buttonStyle } from "./ScreenPanel.jsx";

export default function GameCompleteScreen() {
  const result = useGameStore((s) => s.result);
  const startGame = useGameStore((s) => s.startGame);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const openHowToPlay = useGameStore((s) => s.openHowToPlay);
  const openScoreboard = useGameStore((s) => s.openScoreboard);

  return (
    <ScreenPanel title="Game complete">
      <p role="status">{result?.message || "Rack complete!"}</p>

      <button type="button" style={buttonStyle} onClick={startGame}>
        Play again
      </button>

      <button type="button" style={buttonStyle} onClick={openScoreboard}>
        Scoreboard
      </button>

      <button type="button" style={buttonStyle} onClick={openHowToPlay}>
        How to play
      </button>

      <button type="button" style={buttonStyle} onClick={returnToMenu}>
        Main menu
      </button>
    </ScreenPanel>
  );
}