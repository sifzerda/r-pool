// src/screens/MenuScreen.jsx

import useScreenStore from "../store/useScreenStore.js";
import Panel, { Button, ACTIONS, SUBTLE } from "./ScreenPanel.jsx";

export default function MenuScreen() {
 
  const start = useScreenStore((state) => state.startGame), settings = useScreenStore((state) => state.openSettings), scores = useScreenStore((state) => state.openHighscores);
 
 return <Panel title="POOL"><p style={SUBTLE}>Clear the table in as few shots as you can. Aim, drag backwards, and release to shoot.</p>
    <div style={ACTIONS}><Button onClick={start}>Play</Button><Button onClick={settings}>Settings</Button><Button onClick={scores}>Highscores</Button></div>
    <p style={{ ...SUBTLE, marginBottom: 0 }}>P / Escape pauses. Escape cancels a charged shot first.</p>
  </Panel>;
  
}
