// src/screens/HighscoresScreen.jsx

import useGameStore from "../store/useGameStore.js";
import ScreenPanel, { buttonStyle } from "./ScreenPanel.jsx";
export default function HighScoresScreen() {
 const scores = useGameStore((s) => s.highScores);
 const closeInfo = useGameStore((s) => s.closeInfo);
 return <ScreenPanel title="High scores">
  <p style={{ margin: 0 }}>Top 10 scores on this browser. Higher scores rank first.</p>
  {scores.length === 0 ? <p role="status">No scores yet. Complete a scored game to set your first record.</p> :
   <div style={{ overflowX: "auto" }}><table style={{ width: "100%", textAlign: "left", borderSpacing: "0 10px" }}>
    <thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">Score</th></tr></thead>
    <tbody>{scores.map((entry, index) => <tr key={`${entry.date}-${index}`}><td>{index + 1}</td><td style={{ overflowWrap: "anywhere" }}>{entry.name}</td><td>{entry.score.toLocaleString()}</td></tr>)}</tbody>
   </table></div>}
  <button style={buttonStyle} onClick={closeInfo}>Back</button>
 </ScreenPanel>;
}
