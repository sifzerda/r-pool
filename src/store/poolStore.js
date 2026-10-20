//src/store/poolStore.js

import { create } from "zustand";

export const usePoolStore = create((set, get) => ({
  // Game state
  gameStatus: "ready",
  gameMode: "8ball",

  // Players
  currentPlayer: 1,
  player1Group: null,
  player2Group: null,

  // Gameplay
  ballInHand: false,
  winner: null,
  shotsTaken: 0,

  // UI state
  aiming: false,
  shotPower: 0,
  selectedBallGroup: null,

  // Actions
  startGame: () => set({
    gameStatus: "playing",
    currentPlayer: 1,
    winner: null,
    shotsTaken: 0,
  }),

  pauseGame: () => set({
    gameStatus: "paused",
  }),

  resumeGame: () => set({
    gameStatus: "playing",
  }),

  setAiming: (aiming) => set({ aiming }),

  setShotPower: (shotPower) => set({ shotPower }),

  incrementShots: () => set(state => ({
    shotsTaken: state.shotsTaken + 1,
  })),

  switchPlayer: () => set(state => ({
    currentPlayer: state.currentPlayer === 1 ? 2 : 1,
  })),

  assignGroups: (player1, player2) => set({
    player1Group: player1,
    player2Group: player2,
  }),

  setBallInHand: (value) => set({
    ballInHand: value,
  }),

  setWinner: (winner) => set({
    winner,
    gameStatus: "gameover",
  }),

  resetGame: () => set({
    gameStatus: "ready",
    currentPlayer: 1,
    player1Group: null,
    player2Group: null,
    ballInHand: false,
    winner: null,
    shotsTaken: 0,
    aiming: false,
    shotPower: 0,
    selectedBallGroup: null,
  }),
}));