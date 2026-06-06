// src/ecs/systems/physicsSystem.js

import { PLAY_X, PLAY_Z, BALL_R, POCKET_R } from "../constants/table";
import { ballQuery, activeBalls, deactiveBall } from "../world";

const CUSHION_RESTITUTION = 0.92;
const INV_R = 1 / BALL_R;
const OPENING = POCKET_R + BALL_R;

export function physicsSystem(dt) {
  for (const ball of activeBalls) {
    if (ball.pocketed) continue;

    if (
      ball.sleeping && Math.abs(ball.vx) < 0.001 && Math.abs(ball.vz) < 0.001
    ) {
      continue;
    }
    if (ball.sleeping) continue;

    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;
    ball.rotX += (ball.vz * INV_R) * dt;
    ball.rotZ -= (ball.vx * INV_R) * dt;

    ball.dirty = true;

    ball.vx += ball.sideSpin * dt;
    ball.sideSpin *= 0.99;

    const r = BALL_R;

    const left = -PLAY_X;
    const right = PLAY_X;
    const top = -PLAY_Z;
    const bottom = PLAY_Z;

    // left / right pockets (x fixed, vary z)
    const leftRightOpening = Math.abs(ball.z + PLAY_Z) < OPENING || Math.abs(ball.z) < OPENING || Math.abs(ball.z - PLAY_Z) < OPENING;

    if (
      ball.x - r < left && !leftRightOpening
    ) {
      ball.x = left + r;

      const nx = 1;
      const nz = 0;

      const dot = ball.vx * nx + ball.vz * nz;
      ball.vx = ball.vx - 2 * dot * nx;
      ball.vz = ball.vz - 2 * dot * nz;

      ball.vx *= CUSHION_RESTITUTION;
      ball.vz *= CUSHION_RESTITUTION;
    }

    if (
      ball.x + r > right && !leftRightOpening
    ) {
      ball.x = right - r;

      const nx = -1;
      const nz = 0;

      const dot = ball.vx * nx + ball.vz * nz;
      ball.vx = ball.vx - 2 * dot * nx;
      ball.vz = ball.vz - 2 * dot * nz;

      ball.vx *= CUSHION_RESTITUTION;
      ball.vz *= CUSHION_RESTITUTION;
    }

    // top / bottom pockets (z fixed, vary x)
    const topBottomOpening = Math.abs(ball.x + PLAY_X) < OPENING || Math.abs(ball.x) < OPENING || Math.abs(ball.x - PLAY_X) < OPENING;

    if (
      ball.z - r < top && !topBottomOpening
    ) {
      ball.z = top + r;

      const nx = 0;
      const nz = 1;

      const dot = ball.vx * nx + ball.vz * nz;
      ball.vx = ball.vx - 2 * dot * nx;
      ball.vz = ball.vz - 2 * dot * nz;

      ball.vx *= CUSHION_RESTITUTION;
      ball.vz *= CUSHION_RESTITUTION;
    }

    if (
      ball.z + r > bottom && !topBottomOpening
    ) {
      ball.z = bottom - r;

      const nx = 0;
      const nz = -1;

      const dot = ball.vx * nx + ball.vz * nz;
      ball.vx = ball.vx - 2 * dot * nx;
      ball.vz = ball.vz - 2 * dot * nz;

      ball.vx *= CUSHION_RESTITUTION;
      ball.vz *= CUSHION_RESTITUTION;
    }

    const speed = Math.hypot(ball.vx, ball.vz);

    if (speed < 0.02) {
      ball.vx = 0;
      ball.vz = 0;
      ball.sleeping = true;
      ball.dirty = true;
      deactiveBall(ball);
    }
  }
}