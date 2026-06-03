// src/ecs/systems/pocketSystem.js

import { ballQuery } from "../world";
import { POCKETS } from "../constants/pockets";
import { POCKET_R } from "../constants/table";

export function pocketSystem() {
  for (const ball of ballQuery) {

    if (ball.pocketed)
      continue;

    for (const pocket of POCKETS) {

      const dx = ball.x - pocket.x;
      const dz = ball.z - pocket.z;

      const dist =
        Math.sqrt(
          dx * dx +
          dz * dz
        );

      if (dist < POCKET_R) {

        if (ball.cueBall) {

          ball.x = 0;
          ball.z = 0;

          ball.vx = 0;
          ball.vz = 0;

          ball.sleeping = true;

        } else {

          ball.pocketed = true;

          ball.vx = 0;
          ball.vz = 0;

          ball.sleeping = true;
        }

        break;
      }
    }
  }
}