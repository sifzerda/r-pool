// src/screens/GameCompleteScreen.jsx

import useScreenStore from "../store/useScreenStore.js";
import Panel, { Button, ACTIONS, SUBTLE } from "./ScreenPanel.jsx";

export default function GameCompleteScreen() {
  const result = useScreenStore((state) => state.result), start = useScreenStore((state) => state.startGame), scores = useScreenStore((state) => state.openHighscores), menu = useScreenStore((state) => state.goToMenu);
 
 return <Panel title="TABLE CLEARED"><p style={SUBTLE}>All 15 object balls potted. Your completed game has been added to the local rankings.</p>
    {result && <div style={{ display: "flex", gap: 24, flexWrap: "wrap", padding: "12px 0" }}>
      <span><strong>{result.shots}</strong> shots</span>
      <span><strong>{result.scratches}</strong> scratches</span>
      <span><strong>{result.bestPots}</strong> best single-shot pots</span>
      </div>}
    <div style={ACTIONS}><Button onClick={start}>Play again</Button><Button onClick={scores}>Highscores</Button><Button onClick={menu}>Main menu</Button></div>
  </Panel>;
}
