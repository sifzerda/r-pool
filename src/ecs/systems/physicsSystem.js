// src/ecs/systems/physicsSystem.js

import { PLAY_X, PLAY_Z, BALL_R } from "../constants/table";
import { ballQuery } from "../world";

const CUSHION_RESTITUTION = 0.92;

export function physicsSystem(world, dt) {
  for (const ball of ballQuery) {
    if (ball.pocketed) continue;
    if (ball.sleeping) continue;

    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;

    ball.dirty = true;

    ball.vx += ball.sideSpin * dt;
    ball.sideSpin *= 0.99;

    const r = BALL_R;

    const left = -PLAY_X;
    const right = PLAY_X;
    const top = -PLAY_Z;
    const bottom = PLAY_Z;

    const leftPocketOpening = Math.abs(ball.z + PLAY_Z) < 0.25 || Math.abs(ball.z - PLAY_Z) < 0.25;

    if (
      ball.x - r < left &&
      !leftPocketOpening
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

    const rightPocketOpening =
      Math.abs(ball.z + PLAY_Z) < 0.25 ||
      Math.abs(ball.z - PLAY_Z) < 0.25;

    if (
      ball.x + r > right &&
      !rightPocketOpening
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

    const topPocketOpening = Math.abs(ball.x + PLAY_X) < 0.25 || Math.abs(ball.x) < 0.25 || Math.abs(ball.x - PLAY_X) < 0.25;

    if (
      ball.z - r < top &&
      !topPocketOpening
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

    const bottomPocketOpening = Math.abs(ball.x + PLAY_X) < 0.25 || Math.abs(ball.x) < 0.25 || Math.abs(ball.x - PLAY_X) < 0.25;

    if (
      ball.z + r > bottom &&
      !bottomPocketOpening
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
    }
  }
}