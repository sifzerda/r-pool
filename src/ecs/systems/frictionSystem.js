// src/ecs/systems/frictionSystem.js

import {
  activeBalls,
  deactiveBall,
  markDirty,
} from "../world";

const ROLLING_RESISTANCE = 0.45;
const SLEEP_SPEED = 0.02;

export function frictionSystem(dt) {
  const sleepingBalls = [];

  for (const ball of activeBalls) {
    if (ball.sleeping) continue;

    const speed = Math.hypot(
      ball.vx,
      ball.vz
    );

    if (speed <= SLEEP_SPEED) {
      ball.vx = 0;
      ball.vz = 0;

      ball.sleeping = true;
      markDirty(ball);

      sleepingBalls.push(ball);

      continue;
    }

    const decel = ROLLING_RESISTANCE * dt;
    const newSpeed = Math.max(0, speed - decel);
    const scale = newSpeed / speed;

    ball.vx *= scale;
    ball.vz *= scale;
  }

  for (const ball of sleepingBalls) {
    deactiveBall(ball);
  }
}