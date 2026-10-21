// src/ecs/systems/physics.js

import { PLAY_X, PLAY_Z, BALL_R, POCKET_R } from "../constants/table.js";
import { FIXED_DT } from "../constants/simulation.js";
import { activeBalls, deactiveBall, markDirty } from "../world.js";

const CUSHION_RESTITUTION = 0.75;
const VISCOUS_DAMP = 1.5;
const SLEEP_SPEED = 0.09;

const SLEEP_SPEED_SQ = SLEEP_SPEED * SLEEP_SPEED;
const OPENING = POCKET_R + BALL_R;
const INV_R = 1 / BALL_R;

// Ball-centre limits (cushion faces are axis aligned).
const MIN_X = -PLAY_X + BALL_R;
const MAX_X = PLAY_X - BALL_R;
const MIN_Z = -PLAY_Z + BALL_R;
const MAX_Z = PLAY_Z - BALL_R;

// FIXED_DT never changes, so the damping factor is a constant.
const DAMPING = Math.exp(-VISCOUS_DAMP * FIXED_DT);

// Left/right cushions only have the four corner pockets.
function inCornerGap(v, play) {
  return Math.abs(v + play) < OPENING || Math.abs(v - play) < OPENING;
}

// Top/bottom cushions have corner pockets plus the middle pocket.
function inPocketGap(v, play) {
  return inCornerGap(v, play) || Math.abs(v) < OPENING;
}

export function physicsSystem(dt) {
  for (const ball of activeBalls) {
    if (ball.sleeping || ball.pocketed || ball.falling) continue;

    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;

    ball.rotX += ball.vz * INV_R * dt;
    ball.rotZ -= ball.vx * INV_R * dt;

    if (ball.x < MIN_X) {
      if (!inCornerGap(ball.z, PLAY_Z)) {
        ball.x = MIN_X;
        ball.vx = -ball.vx * CUSHION_RESTITUTION;
        ball.vz *= CUSHION_RESTITUTION;
      }
    } else if (ball.x > MAX_X) {
      if (!inCornerGap(ball.z, PLAY_Z)) {
        ball.x = MAX_X;
        ball.vx = -ball.vx * CUSHION_RESTITUTION;
        ball.vz *= CUSHION_RESTITUTION;
      }
    }

    if (ball.z < MIN_Z) {
      if (!inPocketGap(ball.x, PLAY_X)) {
        ball.z = MIN_Z;
        ball.vz = -ball.vz * CUSHION_RESTITUTION;
        ball.vx *= CUSHION_RESTITUTION;
      }
    } else if (ball.z > MAX_Z) {
      if (!inPocketGap(ball.x, PLAY_X)) {
        ball.z = MAX_Z;
        ball.vz = -ball.vz * CUSHION_RESTITUTION;
        ball.vx *= CUSHION_RESTITUTION;
      }
    }
  }
}

// Runs once per fixed step.
export function frictionSystem() {
  for (const ball of activeBalls) {
    if (ball.sleeping) {
      deactiveBall(ball);
      continue;
    }

    ball.vx *= DAMPING;
    ball.vz *= DAMPING;

    if (ball.vx * ball.vx + ball.vz * ball.vz <= SLEEP_SPEED_SQ) {
      ball.vx = 0;
      ball.vz = 0;
      ball.sleeping = true;

      markDirty(ball);
      deactiveBall(ball);
    }
  }
}