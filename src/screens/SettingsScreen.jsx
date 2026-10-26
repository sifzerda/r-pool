// src/screens/SettingsScreen.jsx

import useGameStore from "../store/useGameStore.js";
import ScreenPanel, { buttonStyle } from "./ScreenPanel.jsx";
export default function SettingsScreen() {
 const settings = useGameStore((s) => s.settings);
 const setSetting = useGameStore((s) => s.setSetting);
 const closeSettings = useGameStore((s) => s.closeSettings);
 return <ScreenPanel title="Settings">
  <label><input type="checkbox" checked={settings.showAimGuide} onChange={(e) => setSetting("showAimGuide", e.target.checked)} /> Show aim guide</label>
  <label><input type="checkbox" checked={settings.showHUD} onChange={(e) => setSetting("showHUD", e.target.checked)} /> Show HUD</label>
  <button style={buttonStyle} onClick={closeSettings}>Back</button>
 </ScreenPanel>;
}
