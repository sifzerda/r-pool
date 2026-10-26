// src/screens/ScoreboardScreen.jsx

import { useMemo } from "react";
import useGameStore from "../store/useGameStore.js";
import ScreenPanel, { buttonStyle } from "./ScreenPanel.jsx";

const EMPTY_SCORES = [];

export default function ScoreboardScreen() {
    const highScores = useGameStore(
        (s) => s.highScores ?? EMPTY_SCORES
    );

    const closeInfo = useGameStore((s) => s.closeInfo);

    const scores = useMemo(
        () =>
            highScores
                .filter(
                    (entry) =>
                        entry &&
                        Number.isFinite(entry.score) &&
                        entry.score >= 0
                )
                .slice()
                .sort((a, b) => b.score - a.score)
                .slice(0, 10),
        [highScores]
    );

    return (
        <ScreenPanel title="Scoreboard">
            {scores.length === 0 ? (
                <p role="status" style={{ textAlign: "center" }}>
                    No highscores yet.
                </p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            textAlign: "left",
                        }}
                    >
                        <caption
                            style={{
                                textAlign: "left",
                                paddingBottom: 16,
                                color: "#a4bbc5",
                            }}
                        >
                            Top 10 scores
                        </caption>

                        <thead>
                            <tr>
                                <th scope="col" style={cellStyle}>
                                    Rank
                                </th>
                                <th scope="col" style={cellStyle}>
                                    Player
                                </th>
                                <th
                                    scope="col"
                                    style={{
                                        ...cellStyle,
                                        textAlign: "right",
                                    }}
                                >
                                    Score
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {scores.map((entry, index) => (
                                <tr key={entry.id ?? `${entry.date}-${index}`}>
                                    <td style={cellStyle}>
                                        {index + 1}
                                    </td>

                                    <td
                                        style={{
                                            ...cellStyle,
                                            overflowWrap: "anywhere",
                                        }}
                                    >
                                        {entry.name || "Player"}
                                    </td>

                                    <td
                                        style={{
                                            ...cellStyle,
                                            textAlign: "right",
                                            fontVariantNumeric: "tabular-nums",
                                            color: "#67e8f9",
                                        }}
                                    >
                                        {entry.score.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <button type="button" style={buttonStyle} onClick={closeInfo}>Back</button>
            
        </ScreenPanel>
    );
}

const cellStyle = {
    padding: "12px 8px",
    borderBottom: "1px solid #285562",
};