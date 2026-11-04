// src/ecs/constants/rack.js
// Generates a triangular 15-ball rack.

import { BALL_R } from "./table.js";
import { BALLS } from "./balls.js";

const DIAMETER = BALL_R * 2;
const ROW_SPACING = DIAMETER * Math.sqrt(3) / 2;

const RACK_X = 0.9;

// Small positional variations to prevent
// identical breaks every game.
const RACK_VARIATION = BALL_R * 0.015;

// Preserve your existing rack arrangement.
const ORDER = [
  1,
  9, 2,
  3, 8, 10,
  11, 4, 12, 5,
  6, 13, 7, 14, 15,
];

function randomOffset() {
  return (
    Math.random() * 2 - 1
  ) * RACK_VARIATION;
}

function buildRack() {
  const rack = [];
  let index = 0;

  for (let row = 0; row < 5; row++) {
    for (
      let column = 0;
      column <= row;
      column++
    ) {
      const num = ORDER[index++];

      rack.push({
        num,
        type: BALLS[num].type,
        group: "object",

        x:
          RACK_X +
          row * ROW_SPACING +
          randomOffset(),

        z:
          (column - row / 2) *
          DIAMETER +
          randomOffset(),
      });
    }
  }

  return rack;
}

export { buildRack };
