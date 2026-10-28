// src/ai/difficulty.js


export const AI_DIFFICULTIES = {
  easy: {
    aimError: 0.045,
    powerError: 0.18,
    selectionNoise: 18,
    maxCandidates: 8,
    positionalSkill: 0.2,
    lookahead: 0,
    safetyWeight: 0.2,
  },

  medium: {
    aimError: 0.018,
    powerError: 0.09,
    selectionNoise: 8,
    maxCandidates: 20,
    positionalSkill: 0.55,
    lookahead: 1,
    safetyWeight: 0.6,
  },

  hard: {
    aimError: 0.005,
    powerError: 0.035,
    selectionNoise: 3,
    maxCandidates: 40,
    positionalSkill: 0.85,
    lookahead: 2,
    safetyWeight: 1,
  },
};

export function getDifficulty(level = "medium") {
  return AI_DIFFICULTIES[level] || AI_DIFFICULTIES.medium;
}

export function randomError(amount) {
  return (Math.random() * 2 - 1) * amount;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
