// src/screens/SettingsScreen.jsx

import { useEffect, useRef } from "react";
import { PRESET_NAMES } from "../paintjob/schema.js";
import PreviewTable from "../renderers/PreviewRenderer.jsx";
import useGameStore from "../store/useGameStore.js";
import { AI_DIFFICULTIES } from "../ai/difficulty.js";

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function SettingsScreen() {
  const settings = useGameStore((s) => s.settings);
  const setSetting = useGameStore((s) => s.setSetting);
  const closeSettings = useGameStore((s) => s.closeSettings);
  const selectedPreset = useGameStore((s) => s.selectedPreset);
  const applyPreset = useGameStore((s) => s.applyPreset);

  const panel = useRef(null);

  const difficulty = settings.aiDifficulty || "medium";
  const aiEnabled = !settings.solo;

  useEffect(() => {
    panel.current?.focus();
  }, []);

  return (
    <div className="absolute inset-0 z-10 grid min-h-0 place-items-center bg-[#030a11]/85 p-4 sm:p-5">
      <section
        ref={panel}
        tabIndex={-1}
        aria-label="Settings"
        className="grid max-h-full w-full max-w-240 min-h-0 gap-3.5 overflow-y-auto overscroll-contain rounded-3xl border border-[#285562] bg-[#091820] p-5 font-sans text-cyan-50 outline-none sm:p-7"
      >
        <h1 className="mb-2 text-[28px] font-bold">Settings</h1>

        <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <div className="h-60 overflow-hidden rounded-2xl border border-[#285562] md:h-90">
              <PreviewTable />
            </div>

            <p className="mt-2 text-sm text-slate-300" role="status">
              Preview: {selectedPreset}
            </p>
          </div>

          <div className="grid content-start gap-3.5">
            <label className="grid gap-2 text-sm font-semibold">
              Appearance preset

              <select
                value={selectedPreset}
                onChange={(event) => applyPreset(event.target.value)}
                className="w-full cursor-pointer rounded-xl border border-[#285562] bg-[#142a33] px-3 py-3 text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {PRESET_NAMES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <p className="text-sm text-slate-300">
              Choose a complete look for the table, cue, balls and lighting.
            </p>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#285562] p-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-cyan-300"
                checked={settings.showAimGuide}
                onChange={(event) =>
                  setSetting("showAimGuide", event.target.checked)
                }
              />
              Show aim guide
            </label>

            {/* Game mode */}
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#285562] p-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-cyan-300"
                checked={settings.solo}
                onChange={(event) =>
                  setSetting("solo", event.target.checked)
                }
              />
              Solo
            </label>

            <p className="text-sm text-slate-300">
              {settings.solo
                ? "Play alone. Clear both solids and stripes before potting the eight ball."
                : "Play against the AI opponent."}
            </p>

            {/* AI difficulty */}
            <div
              className={`grid gap-2 rounded-xl border p-3 transition-opacity ${
                aiEnabled
                  ? "border-[#285562] opacity-100"
                  : "border-[#285562]/40 opacity-40"
              }`}
            >
              <label
                htmlFor="ai-difficulty"
                className="text-sm font-semibold"
              >
                AI difficulty
              </label>

              <select
                id="ai-difficulty"
                value={difficulty}
                disabled={!aiEnabled}
                onChange={(event) =>
                  setSetting("aiDifficulty", event.target.value)
                }
                className="w-full cursor-pointer rounded-xl border border-[#285562] bg-[#142a33] px-3 py-3 text-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed"
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <p className="text-xs text-slate-400">
                {aiEnabled
                  ? "Choose how challenging your AI opponent will be."
                  : "AI difficulty is unavailable in Solo mode."}
              </p>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#285562] p-3">
              <input
                type="checkbox"
                className="h-4 w-4 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-cyan-300"
                checked={settings.showHUD}
                onChange={(event) =>
                  setSetting("showHUD", event.target.checked)
                }
              />
              Show HUD
            </label>

            <button
              type="button"
              className="cursor-pointer touch-manipulation rounded-xl border border-[#3f6470] bg-[#142a33] px-4.5 py-2.5 text-sm font-semibold text-cyan-50 transition-colors hover:bg-[#1c3b47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              onClick={closeSettings}
            >
              Back
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}