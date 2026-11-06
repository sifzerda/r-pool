// src/store/useGameStore.js

import { create } from "zustand";
import { DEFAULT_PRESET, PRESET_NAMES, isPreset, presetValues } from "../paintjob/schema.js";

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const STORAGE_KEY = "pool-appearance-preset-v1";
const LEGACY_KEY = "pool-lab-v1";

const SOLIDS = [1, 2, 3, 4, 5, 6, 7];
const STRIPES = [9, 10, 11, 12, 13, 14, 15];

const GROUPS = {
  solids: SOLIDS,
  stripes: STRIPES,
};

const DIFFICULTIES = new Set([
  "easy",
  "medium",
  "hard",
]);

const BOOLEAN_SETTINGS = new Set([
  "showAimGuide",
  "showHUD",
  "solo",
]);

const INFO_SCREENS = new Set([
  "menu",
  "pause",
  "complete",
]);

// --------------------------------------------------
// APPEARANCE
// --------------------------------------------------

function loadPreset() {
  try {
    const selected = localStorage.getItem(STORAGE_KEY);

    if (isPreset(selected)) {
      return selected;
    }

    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");

    if (legacy && typeof legacy === "object") {
      for (const name of PRESET_NAMES) {
        const values = presetValues(name);

        let matches = true;

        for (const key of Object.keys(values)) {
          if (legacy[key] !== values[key]) {
            matches = false;
            break;
          }
        }

        if (matches) return name;
      }
    }
  } catch {
    // Storage unavailable or invalid.
  }

  return DEFAULT_PRESET;
}

const initialPreset = loadPreset();

// --------------------------------------------------
// SCREENS
// --------------------------------------------------

export const SCREENS = Object.freeze({
  MENU: "menu",
  PLAY: "play",
  PAUSE: "pause",
  SETTINGS: "settings",
  COMPLETE: "complete",
  SCORE_BOARD: "scoreboard",
  HOW_TO_PLAY: "howtoplay",
});

// --------------------------------------------------
// INITIAL STATE HELPERS
// --------------------------------------------------

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

function isValidBallId(id) {
  return (Number.isInteger(id) && id >= 1 && id <= 15);
}

function countRemaining(group, pottedIds) {
  const ids = GROUPS[group];

  if (!ids) return 0;

  let remaining = 0;

  for (let i = 0; i < ids.length; i++) {
    if (!pottedIds.has(ids[i])) {
      remaining++;
    }
  }

  return remaining;
}

function countRemainingSolo(pottedIds) {
  let remaining = 0;

  for (let id = 1; id <= 15; id++) {
    if (id === 8) continue;

    if (!pottedIds.has(id)) {
      remaining++;
    }
  }

  return remaining;
}

function firstPottedGroup(shotPottedIds) {
  for (const id of shotPottedIds) {
    const group = getBallGroup(id);

    if (group) return group;
  }

  return null;
}

// --------------------------------------------------
// STORE
// --------------------------------------------------

const useGameStore = create((set, get) => ({
  // ------------------------------------------------
  // APPEARANCE
  // ------------------------------------------------

  selectedPreset: initialPreset,
  appearanceParams: Object.freeze(presetValues(initialPreset)),

  applyPreset: (name) => {
    if (!isPreset(name)) return false;

    if (get().selectedPreset === name) {
      return true;
    }

    set({
      selectedPreset: name,
      appearanceParams: Object.freeze(presetValues(name)),
    });

    try {
      localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // Keep the in-memory selection.
    }

    return true;
  },

  // ------------------------------------------------
  // GAME CONFIGURATION
  // ------------------------------------------------

  gameMode: "8ball",
  difficulty: "medium",
  currentPlayer: "human",

  playerGroups: {
    human: null,
    ai: null,
  },

  ballInHand: false,
  winner: null,
  foul: null,

  // ------------------------------------------------
  // SHOT STATE
  // ------------------------------------------------

  shotPlayer: null,
  shotEvents: createShotEvents(),
  shotPottedIds: new Set(),
  shotStartPottedIds: new Set(),

  // ------------------------------------------------
  // GENERAL STATE
  // ------------------------------------------------

  stats: createInitialStats(),
  pottedIds: new Set(),
  completionRecorded: false,
  isPotted: (id) => get().pottedIds.has(id),

  // ------------------------------------------------
  // RESET
  // ------------------------------------------------

  resetPotted: () => {
    set({
      stats: createInitialStats(),
      pottedIds: new Set(),
      shotPottedIds: new Set(),
      shotStartPottedIds: new Set(),
    });
  },

  // ------------------------------------------------
  // START GAME
  // ------------------------------------------------

  startGame: (options = {}) => {
    const current = get();
    const difficulty = DIFFICULTIES.has(options.difficulty) ? options.difficulty : current.settings.aiDifficulty || "medium";

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

  // ------------------------------------------------
  // RECORD SHOT
  // ------------------------------------------------

  recordShot: () => {
    set((s) => {
      if (s.screen !== SCREENS.PLAY || s.stats.shotActive || s.stats.cleared || s.winner || s.ballInHand) {
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
    });
  },

  // ------------------------------------------------
  // FIRST CONTACT
  // ------------------------------------------------

  recordFirstContact: (id) => {
    if (!isValidBallId(id)) return;

    set((s) => {
      if (!s.stats.shotActive || s.shotEvents.firstContactId !== null) {
        return s;
      }

      return {
        shotEvents: {
          ...s.shotEvents,
          firstContactId: id,
        },
      };
    });
  },

  // ------------------------------------------------
  // RAIL CONTACT
  // ------------------------------------------------

  recordRailContact: () => {
    set((s) => {
      const events = s.shotEvents;

      if (!s.stats.shotActive || events.firstContactId === null || events.railAfterContact) {
        return s;
      }

      return {
        shotEvents: {
          ...events,
          railAfterContact: true,
        },
      };
    });
  },

  // ------------------------------------------------
  // POT BALL
  // ------------------------------------------------

  markPotted: (id) => {
    if (!isValidBallId(id)) return;

    set((s) => {
      if (s.screen !== SCREENS.PLAY || s.pottedIds.has(id)) {
        return s;
      }

      // Copy-on-write preserves Zustand
      // subscriptions and AI request validation.
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
    });
  },

  // ------------------------------------------------
  // SCRATCH
  // ------------------------------------------------

  recordScratch: () => {
    set((s) => {
      if (!s.stats.shotActive || s.shotEvents.cueScratch) {
        return s;
      }

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
    });
  },

  // ------------------------------------------------
  // FINISH SHOT
  // ------------------------------------------------

  finishShot: () => {
    const s = get();

    if (s.screen !== SCREENS.PLAY || !s.stats.shotActive || !s.shotPlayer) {
      return;
    }

    const solo = Boolean(s.settings.solo);
    const shooter = s.shotPlayer;
    const opponent = getOpponent(shooter);
    const events = s.shotEvents;
    const shotPots = s.shotPottedIds;
    const potCount = shotPots.size;
    const groups = {
      ...s.playerGroups,
    };
    const shooterGroup = groups[shooter];

    // Calculate legality using the table
    // state before the shot.
    const remainingBeforeShot = solo ? countRemainingSolo(s.shotStartPottedIds) : countRemaining(shooterGroup, s.shotStartPottedIds);
    const eightBallWasLegal = remainingBeforeShot === 0;
    const firstContactGroup = getBallGroup(events.firstContactId);

    // ----------------------------------------------
    // FOUL DETECTION
    // ----------------------------------------------

    let foulReason = null;

    if (events.cueScratch) {
      foulReason = "Scratch";
    } else if (
      events.firstContactId === null
    ) {
      foulReason = "No object ball contacted";
    } else if (
      events.firstContactId === 8
    ) {
      if (!eightBallWasLegal) {
        foulReason = "Early 8-ball contact";
      }
    } else if (!solo && shooterGroup && firstContactGroup !== shooterGroup) {
      foulReason = "Wrong first contact";
    }

    if (!foulReason && !events.railAfterContact && potCount === 0) {
      foulReason = "No ball reached a cushion";
    }

    // House rule:
    // Pocketing only opponent-group balls is a foul.
    // Pocketing at least one own-group ball makes
    // opponent-group pots acceptable.

    if (!solo && !foulReason && shooterGroup) {
      let ownBallPotted = false;
      let opponentBallPotted = false;

      for (const id of shotPots) {
        const group = getBallGroup(id);

        if (group === shooterGroup) {
          ownBallPotted = true;
        } else if (group && group !== shooterGroup) {
          opponentBallPotted = true;
        }
      }

      if (opponentBallPotted && !ownBallPotted) {
        foulReason = "Only opponent's balls potted";
      }
    }

    // ----------------------------------------------
    // EIGHT BALL
    // ----------------------------------------------

    if (shotPots.has(8)) {
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
        lastPots: potCount,
        bestPots: Math.max(s.stats.bestPots, potCount),
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

    // ----------------------------------------------
    // GROUP ASSIGNMENT
    // ----------------------------------------------

    if (!solo && !foulReason && !groups[shooter] && potCount > 0) {
      const assignedGroup = firstPottedGroup(shotPots);

      if (assignedGroup) {
        groups[shooter] = assignedGroup;
        groups[opponent] = assignedGroup === "solids" ? "stripes" : "solids";
      }
    }

    // ----------------------------------------------
    // NEXT PLAYER
    // ----------------------------------------------

    const nextPlayer = solo ? "human" : foulReason ? opponent : potCount > 0 ? shooter : opponent;

    // ----------------------------------------------
    // MESSAGE
    // ----------------------------------------------

    let message;

    if (foulReason) {
      const turnLabel = solo ? "Your" : nextPlayer === "human" ? "Your" : "AI";
      message = `Foul: ${foulReason} • ` + `${turnLabel} turn — ball in hand`;
    } else if (potCount > 0) {
      message = `${potCount} ball` + `${potCount === 1 ? "" : "s"} potted`;
    } else {
      message = solo ? "No pot • your turn" : "No pot • turn changes";
    }

    const stats = {
      ...s.stats,
      shotActive: false,
      lastPots: potCount,
      bestPots: Math.max(s.stats.bestPots, potCount),
      message,
    };

    // Single Zustand update for the completed
    // shot and next-turn transition.
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

  // ------------------------------------------------
  // NAVIGATION
  // ------------------------------------------------

  infoReturnScreen: SCREENS.MENU,

  openScoreboard: () => {
    set((s) => {
      if (!INFO_SCREENS.has(s.screen)) {
        return s;
      }

      return {
        screen: SCREENS.SCORE_BOARD,
        infoReturnScreen: s.screen,
      };
    });
  },

  openHowToPlay: () => {
    set((s) => {
      if (!INFO_SCREENS.has(s.screen)) {
        return s;
      }

      return {
        screen: SCREENS.HOW_TO_PLAY,
        infoReturnScreen: s.screen,
      };
    });
  },

  closeInfo: () => {
    set((s) => {
      if (s.screen !== SCREENS.SCORE_BOARD && s.screen !== SCREENS.HOW_TO_PLAY) {
        return s;
      }

      return {
        screen: s.infoReturnScreen,
      };
    });
  },

  // ------------------------------------------------
  // SCREENS AND SETTINGS
  // ------------------------------------------------

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

  pauseGame: () => {
    set((s) => s.screen === SCREENS.PLAY ? { screen: SCREENS.PAUSE } : s);
  },

  resumeGame: () => {
    set((s) => s.screen === SCREENS.PAUSE ? { screen: SCREENS.PLAY } : s);
  },

  openSettings: () => {
    set((s) => {
      if (s.screen === SCREENS.SETTINGS) {
        return s;
      }

      return {
        screen: SCREENS.SETTINGS,
        settingsReturnScreen: s.screen === SCREENS.PLAY ? SCREENS.PAUSE : s.screen,
      };
    });
  },

  closeSettings: () => {
    set((s) => s.screen === SCREENS.SETTINGS ? { screen: s.settingsReturnScreen } : s);
  },

  returnToMenu: () => {
    set((s) => {
      if (s.screen === SCREENS.MENU && s.result === null) {
        return s;
      }

      return {
        screen: SCREENS.MENU,
        result: null,
      };
    });
  },

  completeGame: (
    result = { message: "Rack complete!" }
  ) => {
    set((s) => {
      if (s.screen !== SCREENS.PLAY || s.completionRecorded) {
        return s;
      }

      return {
        screen: SCREENS.COMPLETE,
        completionRecorded: true,
        result: result || { message: "Rack complete!" },
      };
    });
  },

  // ------------------------------------------------
  // SETTINGS
  // ------------------------------------------------

  setSetting: (key, value) => {
    set((s) => {
      // Boolean settings
      if (BOOLEAN_SETTINGS.has(key) && typeof value === "boolean") {
        // Avoid unnecessary Zustand notifications.
        if (s.settings[key] === value) {
          return s;
        }

        return {
          settings: {
            ...s.settings,
            [key]: value,
          },
        };
      }

      // AI difficulty
      if (key === "aiDifficulty" && DIFFICULTIES.has(value)) {
        if (s.settings.aiDifficulty === value && s.difficulty === value) {
          return s;
        }

        return {
          settings: {
            ...s.settings,
            aiDifficulty: value,
          },
          difficulty: value,
        };
      }

      return s;
    });
  },
}));

export default useGameStore;
