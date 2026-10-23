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

// Pocket drop animation heights (ball centre).
export const FALL_START_Y = BALL_Y;
export const FALL_END_Y = -0.18; // pocket floor (-0.28) + ball radius