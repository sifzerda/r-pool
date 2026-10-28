// src/screens/ScoreboardScreen.jsx

import { useEffect, useRef, useMemo } from "react";
import useGameStore from "../store/useGameStore.js";

const EMPTY_SCORES = [];

export default function ScoreboardScreen() {
    
    const closeInfo = useGameStore((s) => s.closeInfo);
    const panel = useRef(null);
    useEffect(() => { panel.current?.focus(); }, []);
    const highScores = useGameStore((s) => s.highScores ?? EMPTY_SCORES);
    const scores = useMemo(() => highScores
        .filter((entry) => entry && Number.isFinite(entry.score) && entry.score >= 0)
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 10), [highScores]);

    return (
        <div className="absolute inset-0 z-10 grid min-h-0 place-items-center bg-[#030a11]/85 p-4 sm:p-5">
            <section ref={panel} tabIndex={-1} aria-label="Scoreboard"
                className="grid max-h-full w-full max-w-90 min-h-0 gap-3.5 overflow-y-auto overscroll-contain rounded-3xl border border-[#285562] bg-[#091820] p-5 font-sans text-cyan-50 outline-none sm:p-7">
                <h1 className="mb-2 text-[28px] font-bold">Scoreboard</h1>
                {scores.length === 0 ? (
                    <p role="status" className="text-center text-slate-300">No highscores yet.</p>
                ) : (
                    <div className="min-w-0 overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <caption className="pb-4 text-left text-[#a4bbc5]">Top 10 scores</caption>
                            <thead>
                                <tr>
                                    <th scope="col" className="border-b border-[#285562] px-2 py-3">Rank</th>
                                    <th scope="col" className="border-b border-[#285562] px-2 py-3">Player</th>
                                    <th scope="col" className="border-b border-[#285562] px-2 py-3 text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((entry, index) => (
                                    <tr key={entry.id ?? `${entry.date}-${index}`}>
                                        <td className="border-b border-[#285562] px-2 py-3">{index + 1}</td>
                                        <td className="border-b border-[#285562] px-2 py-3 wrap-anywhere">{entry.name || "Player"}</td>
                                        <td className="border-b border-[#285562] px-2 py-3 text-right tabular-nums text-cyan-300">{entry.score.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <button type="button" className="rounded-xl border border-[#3f6470] bg-[#142a33] px-4.5 py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer touch-manipulation" onClick={closeInfo} >Back</button>
            </section>
        </div>
    );
}
