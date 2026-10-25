// src/ecs/constants/table.js

import { PLAY_X, PLAY_Z, BALL_R } from "./table.js";
const MIN_X = -PLAY_X + BALL_R;
const MAX_X = PLAY_X - BALL_R;
const MIN_Z = -PLAY_Z + BALL_R;
const MAX_Z = PLAY_Z - BALL_R;

export {
  MAX_X,
  MAX_Z,
  MIN_X,
  MIN_Z
};
