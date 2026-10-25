// src/screens/HighscoresScreen.jsx

import useScreenStore from "../store/useScreenStore.js";
import Panel, { Button, ACTIONS, SUBTLE } from "./ScreenPanel.jsx";

export default function HighscoresScreen() {

  const scores = useScreenStore((state) => state.highscores), back = useScreenStore((state) => state.back);

  return <Panel title="HIGHSCORES">
    <p style={SUBTLE}>Completed racks on this device. Fewer shots ranks higher; fewer scratches breaks a tie.</p>
    {scores.length ? <div style={{ maxHeight: 290, overflowY: "auto" }}>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}><thead><tr><th scope="col" style={{ textAlign: "left", padding: 8 }}>#</th>
        <th scope="col">Shots</th><th scope="col">Scratches</th>
        <th scope="col">Date</th></tr></thead>
        <tbody>{scores.map((score, index) => <tr key={score.id} style={{ borderTop: "1px solid #ffffff18" }}><td style={{ padding: 8 }}>{index + 1}</td>
          <td style={{ textAlign: "center" }}>{score.shots}</td><td style={{ textAlign: "center" }}>{score.scratches}</td><td style={{ textAlign: "center" }}>{new Date(score.completedAt).toLocaleDateString()}</td></tr>)}</tbody>
      </table>

    </div> :
      <p style={SUBTLE}>No completed racks yet. Clear the table to record your first result.</p>}
    <div style={ACTIONS}>
      
      <Button onClick={back}>Back</Button></div>
 
  </Panel>;
}
