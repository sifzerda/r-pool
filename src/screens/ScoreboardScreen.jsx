// src/screens/ScoreboardScreen.jsx

import { useEffect, useRef, useMemo } from "react";
import useGameStore from "../store/useGameStore.js";

const EMPTY_SCORES = [];

export default function ScoreboardScreen() {
  const closeInfo = useGameStore((s) => s.closeInfo);
  const panel = useRef(null);

  useEffect(() => {
    panel.current?.focus();
  }, []);

  const highScores = useGameStore((s) => s.highScores ?? EMPTY_SCORES);

  const scores = useMemo(() => highScores
        .filter((entry) => entry && Number.isFinite(entry.score) && entry.score >= 0)
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
    [highScores]);

  return (
    <div className="absolute inset-0 z-10 grid min-h-0 place-items-center p-4 sm:p-5">

      <section ref={panel} tabIndex={-1} aria-label="Scoreboard"
        className="relative grid max-h-full w-full max-w-90 min-h-0
          gap-3 overflow-y-auto overscroll-contain
          rounded-lg backdrop-blur-2xl
          p-6 sm:p-8
          font-sans text-cyan-50
          shadow-[0_0_50px_rgba(15,35,100,0.2)]
          outline-none">

        {/* Heading */}
        <div className="relative mb-3 text-center">

          <div className="pointer-events-none absolute inset-0 bg-blue-400/10 blur-[45px]" />

          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-linear-to-r from-transparent to-cyan-400" />

            <span className="text-[16px] uppercase tracking-[0.5em] text-blue-300">
              Scoreboard
            </span>

            <div className="h-px w-10 bg-linear-to-l from-transparent to-cyan-400" />
          </div>
        </div>

        {/* Scores */}
        {scores.length === 0 ? (
          <p role="status" className="py-6 text-center text-xs uppercase tracking-[0.25em] text-cyan-100/50">No highscores yet</p>
        ) : (
          <div className="relative min-w-0 overflow-x-auto">

            <table className="w-full border-collapse text-left text-xs">

              <caption className="pb-4 text-center text-[9px] uppercase tracking-[0.4em] text-cyan-400/60">
                Top 10 Scores
              </caption>

              <thead>
                <tr className="text-[9px] uppercase tracking-[0.3em] text-blue-300/70">
                  <th scope="col" className="border-b border-cyan-400/20 px-2 py-3">
                    Rank
                  </th>

                  <th scope="col" className="border-b border-cyan-400/20 px-2 py-3">
                    Player
                  </th>

                  <th scope="col" className="border-b border-cyan-400/20 px-2 py-3 text-right">
                    Score
                  </th>
                </tr>
              </thead>

              <tbody>
                {scores.map((entry, index) => (
                  <tr
                    key={entry.id ?? `${entry.date}-${index}`}
                    className="transition-colors hover:bg-cyan-400/5">
                    <td className="border-b border-cyan-400/10 px-2 py-3 text-cyan-500/60 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    <td className="max-w-0 truncate border-b border-cyan-400/10 px-2 py-3 text-cyan-100">
                      {entry.name || "Player"}
                    </td>

                    <td className="border-b border-cyan-400/10 px-2 py-3 text-right font-semibold tabular-nums text-cyan-300">
                      {entry.score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

        {/* Back Button */}
        <button
          type="button"
          onClick={closeInfo}
          className="
            group relative overflow-hidden
            rounded-md border border-cyan-400/20
            bg-[#091a32]/80
            px-4 py-3
            text-xs font-semibold uppercase tracking-[0.35em]
            text-cyan-100
            transition-all duration-300
            hover:border-cyan-300/70
            hover:bg-[#102b48]
            hover:text-cyan-200
            hover:shadow-[0_0_18px_rgba(34,211,238,0.18)]
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-cyan-300
            cursor-pointer touch-manipulation
          ">
          <span className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-cyan-300/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <span className="relative">BACK</span>
        </button>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-center">
          <div className="h-px w-30 bg-linear-to-r from-transparent to-cyan-400" />
          <div className="h-px w-30 bg-linear-to-l from-transparent to-cyan-400" />
        </div>

      </section>
    </div>
  );
}
