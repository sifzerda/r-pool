//ecs/constants/pockets.js

import {
  TABLE_W,
  TABLE_H,
  PLAY_X,
  PLAY_Y,
  PLAY_W,
  PLAY_H,
} from "./table";

export const POCKETS = [
  { x: PLAY_X + 2, y: PLAY_Y + 2 },

  { x: TABLE_W / 2, y: PLAY_Y - 2 },

  {
    x: PLAY_X + PLAY_W - 2,
    y: PLAY_Y + 2,
  },

  {
    x: PLAY_X + 2,
    y: PLAY_Y + PLAY_H - 2,
  },

  {
    x: TABLE_W / 2,
    y: PLAY_Y + PLAY_H + 2,
  },

  {
    x: PLAY_X + PLAY_W - 2,
    y: PLAY_Y + PLAY_H - 2,
  },
];