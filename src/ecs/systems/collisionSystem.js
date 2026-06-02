// src/ecs/systems/collisionSystem.js

import { BALL_R } from "../constants/table";
import { resolveCollision } from "../utils/collision";

export function collisionSystem(world) {
  const balls = [...world.with("ball")]
    .filter(ball => !ball.pocketed);

  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i];
      const b = balls[j];

      const dx = a.x - b.x;
      const dz = a.z - b.z;

      const minDist = BALL_R * 2;

if (
  dx * dx + dz * dz <
  minDist * minDist
) {
        a.sleeping = false;
        b.sleeping = false;

        resolveCollision(a, b);
      }
    }
  }
}