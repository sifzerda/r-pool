//src/store/useGameStore.js

import { create } from "zustand";
const SCREEN = Object.freeze({
  MENU: "menu",
  PLAY: "play",
  SETTINGS: "settings",
  GAME_COMPLETE: "gamecomplete",
  PAUSE: "pause",
  HIGHSCORES: "highscores"
});

const QUALITY_DPR = Object.freeze({ low: 1, balanced: 1.5, high: 2 });
const DEFAULT_SETTINGS = Object.freeze({ quality: "balanced", shadows: true, aimGuide: true });
const STORAGE_KEY = "pool-preferences-v1";
const LIMIT = 20;

function cleanSettings(value = {}) {
  return {
    quality: Object.hasOwn(QUALITY_DPR, value?.quality) ? value.quality : DEFAULT_SETTINGS.quality,
    shadows: typeof value?.shadows === "boolean" ? value.shadows : DEFAULT_SETTINGS.shadows,
    aimGuide: typeof value?.aimGuide === "boolean" ? value.aimGuide : DEFAULT_SETTINGS.aimGuide
  };
}

function cleanScore(value) {
  if (!value || typeof value.id !== "string" || !Number.isInteger(value.shots) || value.shots < 1 || !Number.isInteger(value.scratches) || value.scratches < 0 || !Number.isFinite(value.completedAt) || !Number.isInteger(value.bestPots) || value.bestPots < 0 || value.bestPots > 15) return null;
  return { id: value.id, shots: value.shots, scratches: value.scratches, bestPots: value.bestPots, completedAt: value.completedAt };
}

const rankScores = (scores) => [...scores].sort((a, b) => a.shots - b.shots || a.scratches - b.scratches || a.completedAt - b.completedAt).slice(0, LIMIT);
function save(state) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: state.settings, highscores: state.highscores }));
  } catch {
  }
}

function newRunId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const useGameStore = create((set, get) => ({
  screen: SCREEN.MENU,
  sessionId: 0,
  runId: null,
  hasGame: false,
  history: [],
  result: null,
  settings: { ...DEFAULT_SETTINGS },
  highscores: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    let saved = null;
    try {
      if (typeof window !== "undefined") saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    } catch {
    }
    const ids = /* @__PURE__ */ new Set();
    const highscores = (Array.isArray(saved?.highscores) ? saved.highscores : []).map(cleanScore).filter((score) => {
      if (!score || ids.has(score.id)) return false;
      ids.add(score.id);
      return true;
    });
    set({ settings: cleanSettings(saved?.settings), highscores: rankScores(highscores), hydrated: true });
  },

  startGame: () => set((state) => ({ screen: SCREEN.PLAY, sessionId: state.sessionId + 1, runId: newRunId(), hasGame: true, history: [], result: null })),
  
  pause: () => {
    if (get().screen === SCREEN.PLAY) set({ screen: SCREEN.PAUSE, history: [] });
  },

  resume: () => {
    if (get().screen === SCREEN.PAUSE) set({ screen: SCREEN.PLAY, history: [] });
  },

  togglePause: () => {
    const state = get();
    if (state.screen === SCREEN.PLAY) state.pause();
    else if (state.screen === SCREEN.PAUSE) state.resume();
  },

  openSettings: () => {
    const { screen, history } = get();
    if (screen !== SCREEN.SETTINGS) set({ screen: SCREEN.SETTINGS, history: [...history, screen] });
  },

  openHighscores: () => {
    const { screen, history } = get();
    if (screen !== SCREEN.HIGHSCORES) set({ screen: SCREEN.HIGHSCORES, history: [...history, screen] });
  },

  back: () => {
    const { screen, history } = get();
    if (screen !== SCREEN.SETTINGS && screen !== SCREEN.HIGHSCORES) return;
    set({ screen: history.at(-1) ?? SCREEN.MENU, history: history.slice(0, -1) });
  },

  goToMenu: () => set({ screen: SCREEN.MENU, hasGame: false, history: [], runId: null, result: null }),
  
  completeGame: (stats) => {
    const state = get();
    if (state.screen !== SCREEN.PLAY || !state.hasGame || !stats?.cleared || stats.potted !== 15) return false;
    const result = cleanScore({ id: state.runId, shots: stats.shots, scratches: stats.scratches, bestPots: stats.bestPots, completedAt: Date.now() });
    if (!result) return false;
    const highscores = rankScores([...state.highscores.filter((score) => score.id !== result.id), result]);
    set({ screen: SCREEN.GAME_COMPLETE, history: [], result, highscores });
    save(get());
    return true;
  },

  updateSettings: (patch) => {
    const current = get().settings;
    const settings = cleanSettings({ ...current, ...patch });
    if (settings.quality === current.quality && settings.shadows === current.shadows && settings.aimGuide === current.aimGuide) return;
    set({ settings });
    save(get());
  },

  resetSettings: () => {
    set({ settings: { ...DEFAULT_SETTINGS } });
    save(get());
  }
}));

const isPlaying = () => useGameStore.getState().screen === SCREEN.PLAY;
const selectIsPlaying = (state) => state.screen === SCREEN.PLAY;
var stdin_default = useGameStore;

export {
  QUALITY_DPR,
  SCREEN,
  stdin_default as default,
  isPlaying,
  selectIsPlaying
};
