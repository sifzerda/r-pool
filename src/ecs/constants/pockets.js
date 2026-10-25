// src/ecs/constants/pockets.js

import { PLAY_X, PLAY_Z, BALL_R, BALL_Y, CORNER_POCKET_R, SIDE_POCKET_R, CORNER_CAPTURE_R, SIDE_CAPTURE_R, POCKET_FLOOR_Y } from "./table.js";

function pocket(id, x, z, radius, captureRadius) {
  return { id, x, z, radius, captureRadius, captureRadiusSq: captureRadius * captureRadius };
}

const POCKETS = [
  pocket(0, -PLAY_X, -PLAY_Z, CORNER_POCKET_R, CORNER_CAPTURE_R),
  pocket(1, 0, -PLAY_Z, SIDE_POCKET_R, SIDE_CAPTURE_R),
  pocket(2, PLAY_X, -PLAY_Z, CORNER_POCKET_R, CORNER_CAPTURE_R),
  pocket(3, -PLAY_X, PLAY_Z, CORNER_POCKET_R, CORNER_CAPTURE_R),
  pocket(4, 0, PLAY_Z, SIDE_POCKET_R, SIDE_CAPTURE_R),
  pocket(5, PLAY_X, PLAY_Z, CORNER_POCKET_R, CORNER_CAPTURE_R)
];
const FALL_START_Y = BALL_Y, FALL_END_Y = POCKET_FLOOR_Y + BALL_R, FALL_GRAVITY = 12;

function findCapturePocket(x, z) {
  for (const p of POCKETS) if ((x - p.x) ** 2 + (z - p.z) ** 2 <= p.captureRadiusSq) return p;
  return null;
}

export {
  FALL_END_Y,
  FALL_GRAVITY,
  FALL_START_Y,
  POCKETS,
  findCapturePocket
};
