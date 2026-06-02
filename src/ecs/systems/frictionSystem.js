// src/ecs/systems/frictionSystem.js

import { ballQuery } from "../world";

const ROLLING_RESISTANCE = 0.45;

export function frictionSystem(_, dt) {

  for (const ball of ballQuery) {

    if (ball.sleeping)
      continue;

    const speed =
      Math.hypot(
        ball.vx,
        ball.vz
      );

    if (speed === 0)
      continue;

    const decel =
      ROLLING_RESISTANCE * dt;

    const newSpeed =
      Math.max(
        0,
        speed - decel
      );

    if (newSpeed === 0) {

      ball.vx = 0;
      ball.vz = 0;
      ball.sleeping = true;

      continue;
    }

    const scale =
      newSpeed / speed;

    ball.vx *= scale;
    ball.vz *= scale;
  }
}