// src/ecs/systems/frictionSystem.js

import {
  activeBalls,
  deactiveBall,
  markDirty,
} from "../world";

const ROLLING_RESISTANCE = 0.45;

export function frictionSystem(dt) {
  const sleepingBalls = [];

  for (const ball of activeBalls) {

    if (ball.sleeping) continue;

    const speed = Math.hypot(ball.vx, ball.vz);

    if (speed === 0) continue;

    const decel = ROLLING_RESISTANCE * dt;

    const newSpeed = Math.max(0, speed - decel);

    if (newSpeed === 0) {

      ball.vx = 0;
      ball.vz = 0;

      ball.sleeping = true;
      markDirty(ball);

      sleepingBalls.push(ball);

      continue;
    }

    const scale = newSpeed / speed;

    ball.vx *= scale;
    ball.vz *= scale;
  }

  for (const ball of sleepingBalls) {
    deactiveBall(ball);
  }
}