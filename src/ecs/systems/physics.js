// src/ecs/systems/physics.js

import {
  PLAY_X,
  PLAY_Z,
  BALL_R,
  POCKET_R,
} from "../constants/table.js";

import {
  activeBalls,
  deactiveBall,
  markDirty,
} from "../world.js";

const CUSHION_RESTITUTION = 0.75;
const VISCOUS_DAMP = 1.5;
const SLEEP_SPEED = 0.09;

const OPENING = POCKET_R + BALL_R;
const INV_R = 1 / BALL_R;

// --------------------------------
// Physics integration
// --------------------------------

function reflect(ball, nx, nz) {
  const dot = ball.vx * nx + ball.vz * nz;

  ball.vx = (ball.vx - 2 * dot * nx) * CUSHION_RESTITUTION;
  ball.vz = (ball.vz - 2 * dot * nz) * CUSHION_RESTITUTION;
}

export function physicsSystem(dt) {
  const left = -PLAY_X;
  const right = PLAY_X;
  const top = -PLAY_Z;
  const bottom = PLAY_Z;

  for (const ball of activeBalls) {
    if (ball.pocketed || ball.falling || ball.sleeping) continue;

    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;

    ball.rotX += ball.vz * INV_R * dt;
    ball.rotZ -= ball.vx * INV_R * dt;

    const openX =
      Math.abs(ball.z + PLAY_Z) < OPENING ||
      Math.abs(ball.z) < OPENING ||
      Math.abs(ball.z - PLAY_Z) < OPENING;

    const openZ =
      Math.abs(ball.x + PLAY_X) < OPENING ||
      Math.abs(ball.x) < OPENING ||
      Math.abs(ball.x - PLAY_X) < OPENING;

    if (ball.x - BALL_R < left && !openX) {
      ball.x = left + BALL_R;
      reflect(ball, 1, 0);
    }

    if (ball.x + BALL_R > right && !openX) {
      ball.x = right - BALL_R;
      reflect(ball, -1, 0);
    }

    if (ball.z - BALL_R < top && !openZ) {
      ball.z = top + BALL_R;
      reflect(ball, 0, 1);
    }

    if (ball.z + BALL_R > bottom && !openZ) {
      ball.z = bottom - BALL_R;
      reflect(ball, 0, -1);
    }

    markDirty(ball);
  }
}

// --------------------------------
// Friction and sleep
// --------------------------------

export function frictionSystem(dt) {
  const damping = Math.exp(-VISCOUS_DAMP * dt);

  for (const ball of activeBalls) {
    if (ball.sleeping) {
      deactiveBall(ball);
      continue;
    }

    const speedSq = ball.vx * ball.vx + ball.vz * ball.vz;

    if (speedSq === 0) continue;

    const newSpeedSq = speedSq * damping * damping;

    if (newSpeedSq <= SLEEP_SPEED * SLEEP_SPEED) {
      ball.vx = 0;
      ball.vz = 0;
      ball.sleeping = true;

      markDirty(ball);
      deactiveBall(ball);
      continue;
    }

    const scale = Math.sqrt(newSpeedSq / speedSq);

    ball.vx *= scale;
    ball.vz *= scale;
  }
}