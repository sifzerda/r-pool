// src/ecs/constants/pockets.js

import { PLAY_X, PLAY_Z, BALL_Y } from "./table";

export const POCKETS = [
  { x: -PLAY_X, z: -PLAY_Z }, // top left
  { x: 0, z: -PLAY_Z },       // top middle
  { x: PLAY_X, z: -PLAY_Z },  // top right

  { x: -PLAY_X, z: PLAY_Z },  // bottom left
  { x: 0, z: PLAY_Z },        // bottom middle
  { x: PLAY_X, z: PLAY_Z },   // bottom right
];

// Pocket drop heights (ball centre). Must match the pocket floor in tableGeometry.js:
// FALL_END_Y = POCKET_FLOOR_Y + BALL_R.
export const FALL_START_Y = BALL_Y;
export const FALL_END_Y = -2.5;
// Real gravity in table units. A ball is 0.2 across, a real one is about 57 mm,
// so 1 unit is about 0.286 m and g = 9.81 / 0.286 = about 34 units/s^2.
export const FALL_GRAVITY = 34;