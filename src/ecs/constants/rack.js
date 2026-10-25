// src/ecs/constants/rack.js
// Generates a triangular 15-ball rack.

import { BALL_R } from "./table.js";
import { BALLS } from "./balls.js";

const DIAMETER = BALL_R * 2, ROW_SPACING = DIAMETER * Math.sqrt(3) / 2;
const ORDER = [1, 9, 2, 3, 8, 10, 11, 4, 12, 5, 6, 13, 7, 14, 15];

function buildRack() {
  const rack = [];
  let i = 0;
  for (let row = 0; row < 5; row++) for (let column = 0; column <= row; column++) {
    const num = ORDER[i++];
    rack.push({ num, type: BALLS[num].type, group: "object", x: 0.9 + row * ROW_SPACING, z: (column - row / 2) * DIAMETER });
  }
  return rack;
}

export {
  buildRack
};
