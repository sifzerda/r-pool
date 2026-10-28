// src/store/useGameStore.js

import { create } from "zustand";
import {
  DEFAULT_PRESET,
  PRESET_NAMES,
  isPreset,
  presetValues,
} from "../paintjob/schema.js";

const STORAGE_KEY = "pool-appearance-preset-v1";
const LEGACY_KEY = "pool-lab-v1";

const GROUPS = {
  solids: [1, 2, 3, 4, 5, 6, 7],
  stripes: [9, 10, 11, 12, 13, 14, 15],
};

function loadPreset() {
  try {
    const selected = localStorage.getItem(STORAGE_KEY);
    if (isPreset(selected)) return selected;

    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");

    if (legacy && typeof legacy === "object") {
      for (const name of PRESET_NAMES) {
        const values = presetValues(name);
        if (Object.keys(values).every((key) => legacy[key] === values[key])) {
          return name;
        }
      }
    }
  } catch {
    // Use the default if storage is unavailable or corrupt.
  }

  return DEFAULT_PRESET;
}

const initialPreset = loadPreset();

export const SCREENS = Object.freeze({
  MENU: "menu",
  PLAY: "play",
  PAUSE: "pause",
  SETTINGS: "settings",
  COMPLETE: "complete",
  SCORE_BOARD: "scoreboard",
  HOW_TO_PLAY: "howtoplay",
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

function createShotEvents() {
  return {
    firstContactId: null,
    railAfterContact: false,
    cueScratch: false,
  };
}

function getBallGroup(id) {
  if (id >= 1 && id <= 7) return "solids";
  if (id >= 9 && id <= 15) return "stripes";
  return null;
}

function getOpponent(player) {
  return player === "human" ? "ai" : "human";
}

function getRemainingGroupBalls(group, pottedIds) {
  if (!group) return [];
  return GROUPS[group].filter((id) => !pottedIds.has(id));
}

const useGameStore = create((set, get) => ({
  // Appearance
  selectedPreset: initialPreset,
  appearanceParams: Object.freeze(presetValues(initialPreset)),

  applyPreset: (name) => {
    if (!isPreset(name)) return false;
    if (get().selectedPreset === name) return true;

    set({
      selectedPreset: name,
      appearanceParams: Object.freeze(presetValues(name)),
    });

    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // Keep choice in memory.
    }

    return true;
  },

  // Game configuration
  gameMode: "8ball",
  difficulty: "medium",

  // Player and 8-ball state
  currentPlayer: "human",
  playerGroups: {
    human: null,
    ai: null,
  },
  ballInHand: false,
  winner: null,
  foul: null,

  // Per-shot state
  shotPlayer: null,
  shotEvents: createShotEvents(),
  shotPottedIds: new Set(),
  shotStartPottedIds: new Set(),

  // General game state
  stats: createInitialStats(),
  pottedIds: new Set(),
  completionRecorded: false,

  isPotted: (id) => get().pottedIds.has(id),

  resetPotted: () => set({
    stats: createInitialStats(),
    pottedIds: new Set(),
    shotPottedIds: new Set(),
    shotStartPottedIds: new Set(),
  }),

  startGame: (options = {}) => {
    const difficulty = ["easy", "medium", "hard"].includes(options.difficulty)
      ? options.difficulty : get().settings.aiDifficulty || "medium";

    set((s) => ({
      screen: SCREENS.PLAY,
      sessionId: s.sessionId + 1,
      result: null,
      completionRecorded: false,

      gameMode: "8ball",
      difficulty,

      currentPlayer: options.startingPlayer === "ai" ? "ai" : "human",
      playerGroups: {
        human: null,
        ai: null,
      },

      ballInHand: false,
      winner: null,
      foul: null,

      shotPlayer: null,
      shotEvents: createShotEvents(),
      shotPottedIds: new Set(),
      shotStartPottedIds: new Set(),

      stats: createInitialStats(),
      pottedIds: new Set(),
    }));
  },

  // Begin a shot and capture the table state before it happens.
  recordShot: () => set((s) => {
    if (
      s.screen !== SCREENS.PLAY ||
      s.stats.shotActive ||
      s.stats.cleared ||
      s.winner ||
      s.ballInHand
    ) {
      return s;
    }

    return {
      shotPlayer: s.currentPlayer,
      shotEvents: createShotEvents(),
      shotPottedIds: new Set(),
      shotStartPottedIds: new Set(s.pottedIds),

      stats: {
        ...s.stats,
        shots: s.stats.shots + 1,
        shotPots: 0,
        shotActive: true,
        message: "Shot in play…",
      },
    };
  }),

  // The first object ball contacted by the cue ball.
  recordFirstContact: (id) => set((s) => {
    if (
      !s.stats.shotActive ||
      s.shotEvents.firstContactId !== null ||
      !Number.isInteger(id) ||
      id < 1 ||
      id > 15
    ) {
      return s;
    }

    return {
      shotEvents: {
        ...s.shotEvents,
        firstContactId: id,
      },
    };
  }),

  // Called when any ball actually bounces off a cushion.
  recordRailContact: () => set((s) => {
    if (
      !s.stats.shotActive ||
      s.shotEvents.firstContactId === null ||
      s.shotEvents.railAfterContact
    ) {
      return s;
    }

    return {
      shotEvents: {
        ...s.shotEvents,
        railAfterContact: true,
      },
    };
  }),

  markPotted: (id) => set((s) => {
    if (
      s.screen !== SCREENS.PLAY ||
      !Number.isInteger(id) ||
      id < 1 ||
      id > 15 ||
      s.pottedIds.has(id)
    ) {
      return s;
    }

    const pottedIds = new Set(s.pottedIds);
    const shotPottedIds = new Set(s.shotPottedIds);

    pottedIds.add(id);
    shotPottedIds.add(id);

    return {
      pottedIds,
      shotPottedIds,
      stats: {
        ...s.stats,
        potted: pottedIds.size,
        shotPots: shotPottedIds.size,
      },
    };
  }),

  recordScratch: () => set((s) => {
    if (!s.stats.shotActive || s.shotEvents.cueScratch) return s;

    return {
      shotEvents: {
        ...s.shotEvents,
        cueScratch: true,
      },
      stats: {
        ...s.stats,
        scratches: s.stats.scratches + 1,
        message: "Scratch • ball in hand",
      },
    };
  }),

  // Resolve the shot after every ball has stopped and every pocket animation
  // has completed.

  finishShot: () => {
    const s = get();

    if (s.screen !== SCREENS.PLAY || !s.stats.shotActive || !s.shotPlayer) {
      return;
    }

    const solo = Boolean(s.settings.solo);
    const shooter = s.shotPlayer;
    const opponent = getOpponent(shooter);
    const events = s.shotEvents;
    const shotPots = [...s.shotPottedIds];

    const groups = { ...s.playerGroups };
    const shooterGroup = groups[shooter];

    // In Solo, all 14 object balls must be cleared before the 8-ball.
    const remainingBeforeShot = solo
      ? [...GROUPS.solids, ...GROUPS.stripes].filter(
        (id) => !s.shotStartPottedIds.has(id)
      )
      : getRemainingGroupBalls(
        shooterGroup,
        s.shotStartPottedIds
      );

    const eightBallWasLegal = remainingBeforeShot.length === 0;

    const firstContactGroup = getBallGroup(events.firstContactId);

    let foulReason = null;

    if (events.cueScratch) {
      foulReason = "Scratch";
    } else if (events.firstContactId === null) {
      foulReason = "No object ball contacted";
    } else if (events.firstContactId === 8) {
      if (!eightBallWasLegal) {
        foulReason = "Early 8-ball contact";
      }
    } else if (
      !solo &&
      shooterGroup &&
      firstContactGroup !== shooterGroup
    ) {
      foulReason = "Wrong first contact";
    }

    if (
      !foulReason &&
      !events.railAfterContact &&
      shotPots.length === 0
    ) {
      foulReason = "No ball reached a cushion";
    }

    const pottedEightBall = shotPots.includes(8);

    if (pottedEightBall) {
      const legalEightBall = eightBallWasLegal && !foulReason;

      const winner = solo ? legalEightBall ? "human" : null : legalEightBall ? shooter : opponent;

      const message = legalEightBall
        ? `${shooter === "human" ? "You" : "AI"} win!`
        : solo
          ? "Rack lost — illegal 8-ball"
          : `${shooter === "human" ? "You" : "AI"} lose — illegal 8-ball`;

      const stats = {
        ...s.stats,
        shotActive: false,
        lastPots: shotPots.length,
        bestPots: Math.max(s.stats.bestPots, shotPots.length),
        cleared: true,
        message,
      };

      set({
        stats,
        winner,
        foul: foulReason,
        ballInHand: false,
        currentPlayer: shooter,
        shotPlayer: null,
        completionRecorded: true,
        screen: SCREENS.COMPLETE,
        result: {
          message,
          winner,
          foul: foulReason,
          ...stats,
        },
      });

      return;
    }

    // Only assign groups in AI-versus-player mode.
    if (
      !solo &&
      !foulReason &&
      !groups[shooter] &&
      shotPots.length > 0
    ) {
      const firstGroupPot = shotPots.find(
        (id) => getBallGroup(id)
      );

      const assignedGroup = getBallGroup(firstGroupPot);

      if (assignedGroup) {
        groups[shooter] = assignedGroup;
        groups[opponent] =
          assignedGroup === "solids" ? "stripes" : "solids";
      }
    }

    const nextPlayer = solo
      ? "human"
      : foulReason
        ? opponent
        : shotPots.length > 0
          ? shooter
          : opponent;

    const message = foulReason
      ? `Foul: ${foulReason} • ${solo ? "Your" : nextPlayer === "human" ? "Your" : "AI"} turn — ball in hand`
      : shotPots.length > 0
        ? `${shotPots.length} ball${shotPots.length === 1 ? "" : "s"} potted`
        : solo
          ? "No pot • your turn"
          : "No pot • turn changes";

    const stats = {
      ...s.stats,
      shotActive: false,
      lastPots: shotPots.length,
      bestPots: Math.max(s.stats.bestPots, shotPots.length),
      message,
    };

    set({
      stats,
      playerGroups: groups,
      currentPlayer: nextPlayer,
      ballInHand: Boolean(foulReason),
      foul: foulReason,
      shotPlayer: null,
      shotEvents: createShotEvents(),
      shotPottedIds: new Set(),
      shotStartPottedIds: new Set(),
    });
  },


  // Existing screens and navigation
  infoReturnScreen: SCREENS.MENU,

  openScoreboard: () => set((s) =>
    [SCREENS.MENU, SCREENS.PAUSE, SCREENS.COMPLETE].includes(s.screen)
      ? { screen: SCREENS.SCORE_BOARD, infoReturnScreen: s.screen }
      : {}
  ),

  openHowToPlay: () => set((s) =>
    [SCREENS.MENU, SCREENS.PAUSE, SCREENS.COMPLETE].includes(s.screen) ? { screen: SCREENS.HOW_TO_PLAY, infoReturnScreen: s.screen } : {}
  ),

  closeInfo: () => set((s) =>
    [SCREENS.SCORE_BOARD, SCREENS.HOW_TO_PLAY].includes(s.screen) ? { screen: s.infoReturnScreen } : {}
  ),

  screen: SCREENS.MENU,
  settingsReturnScreen: SCREENS.MENU,
  sessionId: 0,
  result: null,
  settings: {
    showAimGuide: true,
    showHUD: true,
    solo: false,
    aiDifficulty: "medium",
  },

  pauseGame: () => set((s) => s.screen === SCREENS.PLAY ? { screen: SCREENS.PAUSE } : {}),
  resumeGame: () => set((s) => s.screen === SCREENS.PAUSE ? { screen: SCREENS.PLAY } : {}),

  openSettings: () => set((s) =>
    s.screen === SCREENS.SETTINGS
      ? {}
      : {
        screen: SCREENS.SETTINGS,
        settingsReturnScreen:
          s.screen === SCREENS.PLAY ? SCREENS.PAUSE : s.screen,
      }
  ),

  closeSettings: () => set((s) => s.screen === SCREENS.SETTINGS ? { screen: s.settingsReturnScreen } : {}),

  returnToMenu: () => set({
    screen: SCREENS.MENU,
    result: null,
  }),

  completeGame: (result = { message: "Rack complete!" }) => set((s) => {
    if (s.screen !== SCREENS.PLAY || s.completionRecorded) return s;

    return {
      screen: SCREENS.COMPLETE,
      completionRecorded: true,
      result: result || { message: "Rack complete!" },
    };
  }),

  setSetting: (key, value) => set((s) => {
    // Boolean settings
    if (
      ["showAimGuide", "showHUD", "solo"].includes(key) && typeof value === "boolean"
    ) {
      return {
        settings: {
          ...s.settings,
          [key]: value,
        },
      };
    }

    // AI difficulty
    if (
      key === "aiDifficulty" && ["easy", "medium", "hard"].includes(value)
    ) {
      return {
        settings: {
          ...s.settings,
          aiDifficulty: value,
        },
        difficulty: value,
      };
    }

    return {};
  }),
}));

export default useGameStore;