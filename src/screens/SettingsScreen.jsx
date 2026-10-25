// src/screens/SettingsScreen.jsx

import useScreenStore from "../store/useScreenStore.js";
import Panel, { Button, ACTIONS, SUBTLE } from "./ScreenPanel.jsx";

export default function SettingsScreen() {
  const settings = useScreenStore((state) => state.settings), update = useScreenStore((state) => state.updateSettings), reset = useScreenStore((state) => state.resetSettings), back = useScreenStore((state) => state.back);
  const row = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "12px 0", borderBottom: "1px solid #ffffff18" };
  return <Panel title="SETTINGS"><p style={SUBTLE}>Changes apply immediately and are saved on this device.</p>
    <label style={row}><span>Render quality</span><select value={settings.quality} onChange={(event) => update({ quality: event.target.value })} style={{ padding: 8, borderRadius: 8, background: "#10212e", color: "white", border: "1px solid #477" }}><option value="low">Low — 1× DPR</option><option value="balanced">Balanced — up to 1.5×</option><option value="high">High — up to 2×</option></select></label>
    <label style={row}><span>Shadows</span><input type="checkbox" checked={settings.shadows} onChange={(event) => update({ shadows: event.target.checked })} /></label>
    <label style={row}><span>Aim guide</span><input type="checkbox" checked={settings.aimGuide} onChange={(event) => update({ aimGuide: event.target.checked })} /></label>
    <div style={ACTIONS}><Button onClick={back}>Back</Button><Button onClick={reset}>Restore defaults</Button></div>
  </Panel>;
}
