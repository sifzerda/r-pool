// src/screens/PauseScreen.jsx

import useScreenStore from "../store/useScreenStore.js";
import Panel, { Button, ACTIONS, SUBTLE } from "./ScreenPanel.jsx";

export default function PauseScreen() {
  const resume = useScreenStore((state) => state.resume), settings = useScreenStore((state) => state.openSettings), menu = useScreenStore((state) => state.goToMenu), start = useScreenStore((state) => state.startGame);
  return <Panel title="PAUSED"><p style={SUBTLE}>Your table is preserved. Resume to continue the current shot.</p>
    <div style={ACTIONS}><Button onClick={resume}>Resume</Button><Button onClick={settings}>Settings</Button><Button onClick={start}>New rack</Button><Button onClick={menu}>Main menu</Button></div>
  </Panel>;
}
