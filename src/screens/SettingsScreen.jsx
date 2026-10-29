
// src/screens/SettingsScreen.jsx

import { useEffect, useRef } from "react";
import { PRESET_NAMES } from "../paintjob/schema.js";
import PreviewTable from "../renderers/PreviewRenderer.jsx";
import useGameStore from "../store/useGameStore.js";
import { AI_DIFFICULTIES } from "../ai/difficulty.js";

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

  const selectClass = "w-full min-w-0 cursor-pointer rounded-md border border-cyan-400/20 bg-[#091a32]/90 px-3 py-2 text-xs text-cyan-50 transition-colors hover:border-cyan-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed";
  const optionClass = "flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-cyan-400/15 bg-[#091a32]/50 px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-cyan-100/90 transition-colors hover:border-cyan-300/40 hover:bg-cyan-400/5";

  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-label="Settings"
      className="relative grid h-full min-h-0 w-full max-w-none grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-y-auto overscroll-contain rounded-lg backdrop-blur-2xl p-3 font-sans text-cyan-50 shadow-[0_0_50px_rgba(15,35,100,0.2)] outline-none sm:p-4">
      {/* Heading */}
      <div className="relative text-center">
        <div className="pointer-events-none absolute inset-0 bg-blue-400/10 blur-[35px]" />

        <div className="relative flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-linear-to-r from-transparent to-cyan-400" />
          <span className="text-[16px] uppercase tracking-[0.5em] text-blue-300">
            Settings
          </span>
          <div className="h-px w-8 bg-linear-to-l from-transparent to-cyan-400" />
        </div>
      </div>

      <div className="grid min-h-0 min-w-0 grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_320px]">    {/* Preview */}
        {/* Preview */}
        <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-2">
          <p className="text-center text-[9px] uppercase tracking-[0.2em] text-cyan-100/50"
            role="status">
            Preview: <span className="text-cyan-300">{selectedPreset}</span>
          </p>

          <div className="relative min-h-60 overflow-hidden rounded-md border border-cyan-400/20 bg-[#091a32]/50 shadow-[0_0_25px_rgba(34,211,238,0.05)] md:min-h-0">
            <PreviewTable />
          </div>
        </div>

        {/* Controls */}
        <div className="grid min-h-0 min-w-0 grid-rows-[1fr_auto_auto_auto_auto_auto] gap-2">

          {/* Appearance */}
          <div className="grid content-center gap-2 rounded-md border border-cyan-400/20 bg-[#091a32]/50 p-3">

            <select
              id="appearance-preset"
              value={selectedPreset}
              onChange={(event) => applyPreset(event.target.value)}
              className={selectClass}>

              {PRESET_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Aim guide */}
          <label className={optionClass}>
            <input
              type="checkbox"
              className="h-3.5 w-3.5 shrink-0 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-cyan-300"
              checked={settings.showAimGuide}
              onChange={(event) =>
                setSetting("showAimGuide", event.target.checked)
              }
            />
            <span>Show aim guide</span>
          </label>

          {/* Solo */}
          <div className="grid gap-1">
            <label className={optionClass}>
              <input
                type="checkbox"
                className="h-3.5 w-3.5 shrink-0 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-cyan-300"
                checked={settings.solo}
                onChange={(event) =>
                  setSetting("solo", event.target.checked)
                }
              />
              <span>Solo mode</span>
            </label>

            <p className="px-1 text-[10px] leading-relaxed text-cyan-100/45">
              {settings.solo
                ? "Play alone. Clear both solids and stripes before potting the eight ball."
                : "Play against the AI opponent."}
            </p>
          </div>

          {/* AI difficulty */}
          <div
            className={`grid gap-1 rounded-md border p-2 transition-opacity ${aiEnabled
              ? "border-cyan-400/20 bg-[#091a32]/50 opacity-100"
              : "border-cyan-400/10 bg-[#091a32]/20 opacity-40"
              }`}>
            <label
              htmlFor="ai-difficulty"
              className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-300">
              AI difficulty
            </label>

            <select
              id="ai-difficulty"
              value={difficulty}
              disabled={!aiEnabled}
              onChange={(event) => setSetting("aiDifficulty", event.target.value) }
              className={selectClass}>
              {Object.keys(AI_DIFFICULTIES).map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>

            <p className="text-[10px] text-cyan-100/45">
              {aiEnabled
                ? "Select opponent difficulty."
                : "Unavailable in Solo mode."}
            </p>
          </div>

          {/* HUD */}
          <label className={optionClass}>
            <input
              type="checkbox"
              className="h-3.5 w-3.5 shrink-0 accent-cyan-400 focus-visible:outline-2 focus-visible:outline-cyan-300"
              checked={settings.showHUD}
              onChange={(event) =>
                setSetting("showHUD", event.target.checked)
              }
            />
            <span>Show HUD</span>
          </label>

          {/* Back */}
          <button
            type="button"
            onClick={closeSettings}
            className="group relative mt-1 cursor-pointer touch-manipulation overflow-hidden rounded-md border border-cyan-400/20 bg-[#091a32]/80 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-100 transition-all duration-300 hover:border-cyan-300/70 hover:bg-[#102b48] hover:text-cyan-200 hover:shadow-[0_0_18px_rgba(34,211,238,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-cyan-300/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative">Back</span>
          </button>
        </div>
      </div>
    </section>

  );
}
