// src/screens/PauseScreen.jsx

import useGameStore from "../store/useGameStore.js";
import ScreenPanel, { buttonStyle } from "./ScreenPanel.jsx";
export default function PauseScreen() {

  const resumeGame = useGameStore((s) => s.resumeGame);
  const startGame = useGameStore((s) => s.startGame);
  const openSettings = useGameStore((s) => s.openSettings);
  const returnToMenu = useGameStore((s) => s.returnToMenu);
  const openHighScores = useGameStore((s) => s.openHighScores);
  const openHowToPlay = useGameStore((s) => s.openHowToPlay);

  return (

    <ScreenPanel title="Paused">
      <button style={buttonStyle} onClick={resumeGame}>Resume</button>
      <button style={buttonStyle} onClick={startGame}>New rack</button>
      <button style={buttonStyle} onClick={openSettings}>Settings</button>
      <button style={buttonStyle} onClick={returnToMenu}>Main menu</button>
      <button style={buttonStyle} onClick={openHighScores}>High scores</button>
      <button style={buttonStyle} onClick={openHowToPlay}>How to play</button>
    </ScreenPanel>

  )
}
