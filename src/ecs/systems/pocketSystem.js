// src/ecs/systems/pocketSystem.js

import {
  activeBalls,
  markDirty,
  deactiveBall,
} from "../world";

import { POCKETS } from "../constants/pockets";
import { POCKET_R } from "../constants/table";

const POCKET_R_SQ = POCKET_R * POCKET_R;

export function pocketSystem() {
  for (const ball of activeBalls) {
    if (ball.pocketed || ball.falling) continue;

    for (const pocket of POCKETS) {
      const dx = ball.x - pocket.x;
      const dz = ball.z - pocket.z;

      if (dx * dx + dz * dz >= POCKET_R_SQ) continue;

      if (ball.cueBall) {
        // Scratch: return cue ball to the table centre.
        ball.x = 0;
        ball.z = 0;

        ball.vx = 0;
        ball.vz = 0;

        ball.sleeping = true;

        markDirty(ball);
        deactiveBall(ball);

      } else {
        // Start pocket animation.
        ball.pocketX = pocket.x;
        ball.pocketZ = pocket.z;

        ball.falling = true;
        ball.fallSpeed = 0;

        ball.vx = 0;
        ball.vz = 0;

        ball.sleeping = true;

        markDirty(ball);
        deactiveBall(ball);
      }

      break;
    }
  }
}
