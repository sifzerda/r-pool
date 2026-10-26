// src/screens/MenuScreen.jsx

import useGameStore from "../store/useGameStore.js";
import ScreenPanel, { buttonStyle } from "./ScreenPanel.jsx";

export default function MenuScreen() {

  const startGame = useGameStore((s) => s.startGame);
  const openSettings = useGameStore((s) => s.openSettings);
  const openHighScores = useGameStore((s) => s.openHighScores);
  const openHowToPlay = useGameStore((s) => s.openHowToPlay);

  return (

    <ScreenPanel title="Pool">
      <button style={buttonStyle} onClick={startGame}>Play</button>
      <button style={buttonStyle} onClick={openSettings}>Settings</button>
      <button style={buttonStyle} onClick={openHighScores}>High scores</button>
      <button style={buttonStyle} onClick={openHowToPlay}>How to play</button>
    </ScreenPanel>
    
  )
}
