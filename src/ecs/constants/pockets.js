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

// findCapturePocket runs several times per ball per physics substep (in both
// the live engine and the AI's shot simulation), and almost every call is for
// a ball in the middle of the table. A point can only be inside a capture
// circle if it is close enough to that pocket's rail line, so anything nearer
// the centre line than this bound can't be captured by any pocket. The result
// is identical to checking every pocket.
const CAPTURE_MIN_ABS_Z = Math.min(...POCKETS.map((p) => Math.abs(p.z) - p.captureRadius));

function findCapturePocket(x, z) {
  if (Math.abs(z) < CAPTURE_MIN_ABS_Z) return null;

  for (let i = 0; i < POCKETS.length; i++) {
    const p = POCKETS[i];
    const dx = x - p.x;
    const dz = z - p.z;
    if (dx * dx + dz * dz <= p.captureRadiusSq) return p;
  }

  return null;
}

export {
  FALL_END_Y,
  FALL_GRAVITY,
  FALL_START_Y,
  POCKETS,
  findCapturePocket
};