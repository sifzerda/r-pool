// src/store/useGameStore.js

import { create } from "zustand";
import { DEFAULT_PRESET, PRESET_NAMES, isPreset, presetValues } from "../lab/schema.js";

const STORAGE_KEY = "pool-appearance-preset-v1";
const LEGACY_KEY = "pool-lab-v1";
function loadPreset() {
  try {
    const selected = localStorage.getItem(STORAGE_KEY);
    if (isPreset(selected)) return selected;
    // Preserve an old preset only if every saved appearance value matches it.
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    if (legacy && typeof legacy === "object") {
      for (const name of PRESET_NAMES) {
        const values = presetValues(name);
        if (Object.keys(values).every((key) => legacy[key] === values[key])) return name;
      }
    }
  } catch { /* Use the default if storage is unavailable or corrupt. */ }
  return DEFAULT_PRESET;
}
const initialPreset = loadPreset();


export const SCREENS = Object.freeze({ MENU: "menu", PLAY: "play", PAUSE: "pause", SETTINGS: "settings", COMPLETE: "complete", SCORE_BOARD: "scoreboard", HOW_TO_PLAY: "howtoplay" });
export const createInitialStats = () => ({
  shots: 0, scratches: 0, potted: 0, shotPots: 0, lastPots: 0,
  bestPots: 0, shotActive: false, cleared: false,
  message: "Aim • drag backwards • release to shoot",
});
const useGameStore = create((set, get) => ({
  selectedPreset: initialPreset,
  appearanceParams: Object.freeze(presetValues(initialPreset)),
  applyPreset: (name) => {
    if (!isPreset(name)) return false;
    if (get().selectedPreset === name) return true;
    set({ selectedPreset: name, appearanceParams: Object.freeze(presetValues(name)) });
    try { localStorage.setItem(STORAGE_KEY, name); } catch { /* Keep choice in memory. */ }
    return true;
  },
  stats: createInitialStats(),
  pottedIds: new Set(),
  completionRecorded: false,
  isPotted: (id) => get().pottedIds.has(id),
  resetPotted: () => set({ stats: createInitialStats(), pottedIds: new Set() }),
  markPotted: (id) => set((s) => {
    if (s.screen !== SCREENS.PLAY || !Number.isInteger(id) || id < 1 || id > 15 || s.pottedIds.has(id)) return s;
    const pottedIds = new Set(s.pottedIds);
    pottedIds.add(id);
    return { pottedIds, stats: { ...s.stats, potted: pottedIds.size, shotPots: s.stats.shotPots + 1 } };
  }),
  recordShot: () => set((s) => {
    if (s.screen !== SCREENS.PLAY || s.stats.shotActive || s.stats.cleared) return s;
    return { stats: { ...s.stats, shots: s.stats.shots + 1, shotPots: 0, shotActive: true, message: "Shot in play…" } };
  }),
  recordScratch: () => set((s) => {
    if (s.screen !== SCREENS.PLAY || !s.stats.shotActive) return s;
    return { stats: { ...s.stats, scratches: s.stats.scratches + 1, message: "Scratch • cue ball returns when the table settles" } };
  }),
  finishShot: () => {
    const s = get();
    if (s.screen !== SCREENS.PLAY || !s.stats.shotActive) return;
    const pots = s.stats.shotPots;
    const cleared = s.pottedIds.size === 15;
    const stats = {
      ...s.stats, shotActive: false, lastPots: pots,
      bestPots: Math.max(s.stats.bestPots, pots), cleared,
      message: cleared ? "Table cleared!" : pots > 1 ? `${pots} balls in one shot!` : pots === 1 ? "Nice pot!" : "Line up your next shot",
    };
    if (cleared) {
      // One atomic update exposes final statistics and the completion screen together.
      set({ stats, screen: SCREENS.COMPLETE, completionRecorded: true,
        result: { message: "Table cleared!", ...stats } });
    } else set({ stats });
  },
  infoReturnScreen: SCREENS.MENU,
  openScoreboard: () => set((s) => [SCREENS.MENU, SCREENS.PAUSE, SCREENS.COMPLETE].includes(s.screen) ? { screen: SCREENS.SCORE_BOARD, infoReturnScreen: s.screen } : {}),
  openHowToPlay: () => set((s) => [SCREENS.MENU, SCREENS.PAUSE, SCREENS.COMPLETE].includes(s.screen) ? { screen: SCREENS.HOW_TO_PLAY, infoReturnScreen: s.screen } : {}),
  closeInfo: () => set((s) => [SCREENS.SCORE_BOARD, SCREENS.HOW_TO_PLAY].includes(s.screen) ? { screen: s.infoReturnScreen } : {}),
  screen: SCREENS.MENU,
  settingsReturnScreen: SCREENS.MENU,
  sessionId: 0,
  result: null,
  settings: { showAimGuide: true, showHUD: true },
  startGame: () => set((s) => ({ screen: SCREENS.PLAY, sessionId: s.sessionId + 1, result: null, completionRecorded: false, stats: createInitialStats(), pottedIds: new Set() })),
  pauseGame: () => set((s) => s.screen === SCREENS.PLAY ? { screen: SCREENS.PAUSE } : {}),
  resumeGame: () => set((s) => s.screen === SCREENS.PAUSE ? { screen: SCREENS.PLAY } : {}),
  openSettings: () => set((s) => s.screen === SCREENS.SETTINGS ? {} : { screen: SCREENS.SETTINGS, settingsReturnScreen: s.screen === SCREENS.PLAY ? SCREENS.PAUSE : s.screen }),
  closeSettings: () => set((s) => s.screen === SCREENS.SETTINGS ? { screen: s.settingsReturnScreen } : {}),
  returnToMenu: () => set({ screen: SCREENS.MENU, result: null }),
  completeGame: (result = { message: "Rack complete!" }) => set((s) => {
    if (s.screen !== SCREENS.PLAY || s.completionRecorded) return s;
    const finalResult = result || { message: "Rack complete!" };
    return { screen: SCREENS.COMPLETE, completionRecorded: true, result: finalResult };
  }),
  setSetting: (key, value) => set((s) => Object.hasOwn(s.settings, key) && typeof value === "boolean" ? { settings: { ...s.settings, [key]: value } } : {}),
}));
export default useGameStore;
