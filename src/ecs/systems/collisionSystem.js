// src/ecs/systems/collisionSystem.js

import { BALL_R } from "../constants/table";
import { resolveCollision } from "../utils/collision";
import { ballQuery } from "../world";

export function collisionSystem() {
  const balls = [...ballQuery].filter(b => !b.pocketed);
  const len = balls.length;

  for (let i = 0; i < len; i++) {
    const a = balls[i];

    for (let j = i + 1; j < len; j++) {
      const b = balls[j];

      const dx = a.x - b.x;
      const dz = a.z - b.z;

      const min = BALL_R * 2;

      if (dx * dx + dz * dz < min * min) {
        a.sleeping = false;
        b.sleeping = false;

        resolveCollision(a, b);
      }
    }
  }
}