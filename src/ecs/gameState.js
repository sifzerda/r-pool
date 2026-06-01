export function createGameState() {
  return {
    phase: "aiming",

    mouse: {
      x: 0,
      y: 0,
    },

    dragging: false,

    cueBall: null,

    pocketed: [],

    message: "",

    messageTimer: 0,

    solids: null,

    currentPlayer: 1,

    scores: [0, 0],

    turn: 0,

    foulNextTurn: false,
  };
}