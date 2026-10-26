// src/store/useGameStore.js

import { create } from "zustand";

export const SCREENS = Object.freeze({
  MENU: "menu",
  PLAY: "play",
  PAUSE: "pause",
  SETTINGS: "settings",
  COMPLETE: "complete",
  HOW_TO_PLAY: "howtoplay",
  SCORE_BOARD: "scoreboard",
});

export const createInitialStats = () => ({
  shots: 0,
  scratches: 0,
  potted: 0,
  shotPots: 0,
  lastPots: 0,
  bestPots: 0,
  shotActive: false,
  cleared: false,
  message: "Aim • drag backwards • release to shoot",
});

const useGameStore = create((set, get) => ({
  screen: SCREENS.MENU,
  settingsReturnScreen: SCREENS.MENU,
  infoReturnScreen: SCREENS.MENU,

  sessionId: 0,
  result: null,
  completionRecorded: false,

  settings: {
    showAimGuide: true,
    showHUD: true,
  },

  stats: createInitialStats(),
  pottedIds: new Set(),

  isPotted: (id) => get().pottedIds.has(id),
  resetPotted: () => set({ stats: createInitialStats(), pottedIds: new Set() }),

  markPotted: (id) =>
    set((s) => {
      if (s.screen !== SCREENS.PLAY || !Number.isInteger(id) || id < 1 || id > 15 || s.pottedIds.has(id)) {
        return s;
      }

      const pottedIds = new Set(s.pottedIds);
      pottedIds.add(id);

      return {
        pottedIds,
        stats: {
          ...s.stats,
          potted: pottedIds.size,
          shotPots: s.stats.shotPots + 1,
        },
      };
    }),

  recordShot: () =>
    set((s) => {
      if (s.screen !== SCREENS.PLAY || s.stats.shotActive || s.stats.cleared) {
        return s;
      }

      return {
        stats: {
          ...s.stats,
          shots: s.stats.shots + 1,
          shotPots: 0,
          shotActive: true,
          message: "Shot in play…",
        },
      };
    }),

  recordScratch: () =>
    set((s) => {
      if (s.screen !== SCREENS.PLAY || !s.stats.shotActive) {
        return s;
      }

      return {
        stats: {
          ...s.stats,
          scratches: s.stats.scratches + 1,
          message:
            "Scratch • cue ball returns when the table settles",
        },
      };
    }),

  finishShot: () => {
    const s = get();

    if (s.screen !== SCREENS.PLAY || !s.stats.shotActive) {
      return;
    }

    const pots = s.stats.shotPots;
    const cleared = s.pottedIds.size === 15;

    const stats = {
      ...s.stats,
      shotActive: false,
      lastPots: pots,
      bestPots: Math.max(s.stats.bestPots, pots),
      cleared,
      message: cleared ? "Table cleared!" : pots > 1 ? `${pots} balls in one shot!` : pots === 1 ? "Nice pot!" : "Line up your next shot",
    };

    if (cleared) {
      set({ stats, screen: SCREENS.COMPLETE, completionRecorded: true, result: { ...stats } });
    } else {
      set({ stats });
    }
  },

  startGame: () => set((s) => ({ screen: SCREENS.PLAY, sessionId: s.sessionId + 1, result: null, completionRecorded: false, stats: createInitialStats(), pottedIds: new Set(), })),
  pauseGame: () => set((s) => s.screen === SCREENS.PLAY ? { screen: SCREENS.PAUSE } : s),
  resumeGame: () => set((s) => s.screen === SCREENS.PAUSE ? { screen: SCREENS.PLAY } : s),
  openScoreboard: () => set((s) => [SCREENS.MENU, SCREENS.PAUSE, SCREENS.COMPLETE].includes(s.screen) ? { screen: SCREENS.SCORE_BOARD, infoReturnScreen: s.screen } : s),
  openSettings: () => set((s) => s.screen === SCREENS.SETTINGS ? s : { screen: SCREENS.SETTINGS, settingsReturnScreen: s.screen === SCREENS.PLAY ? SCREENS.PAUSE : s.screen }),
  closeSettings: () => set((s) => s.screen === SCREENS.SETTINGS ? { screen: s.settingsReturnScreen } : s),
  openHowToPlay: () => set((s) => [SCREENS.MENU, SCREENS.PAUSE, SCREENS.COMPLETE].includes(s.screen) ? { screen: SCREENS.HOW_TO_PLAY, infoReturnScreen: s.screen } : s),
  closeInfo: () => set((s) => [ SCREENS.HOW_TO_PLAY, SCREENS.SCORE_BOARD, ].includes(s.screen) ? { screen: s.infoReturnScreen } : s),
  returnToMenu: () => set({ screen: SCREENS.MENU, result: null }),

  completeGame: (result = { message: "Rack complete!" }) =>
    set((s) => {
      if (s.screen !== SCREENS.PLAY || s.completionRecorded) {
        return s;
      }

      return {
        screen: SCREENS.COMPLETE,
        completionRecorded: true,
        result: result || { message: "Rack complete!" },
      };
    }),

  setSetting: (key, value) =>
    set((s) => {
      if (!Object.hasOwn(s.settings, key) || typeof value !== "boolean") {
        return s;
      }

      return {
        settings: {
          ...s.settings,
          [key]: value,
        },
      };
    }),
}));

export default useGameStore;