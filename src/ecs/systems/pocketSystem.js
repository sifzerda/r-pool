// src/ecs/systems/pocketSystem.js

import { ballQuery, activeBalls, deactiveBall } from "../world";
import { POCKETS } from "../constants/pockets";
import { POCKET_R } from "../constants/table";

const POCKET_R_SQ = POCKET_R * POCKET_R;

export function pocketSystem() {
    for (const ball of activeBalls) {

if (ball.pocketed) continue;

if (ball.sleeping && Math.abs(ball.vx) < 0.001 && Math.abs(ball.vz) < 0.001) {
  continue;
}

        for (const pocket of POCKETS) {

            const dx = ball.x - pocket.x;
            const dz = ball.z - pocket.z;

            const distSq = dx * dx + dz * dz;

            if (distSq < POCKET_R_SQ) {

                console.log("POCKETED", ball.id);

                if (ball.cueBall) {

                    ball.x = 0;
                    ball.z = 0;

                    ball.vx = 0;
                    ball.vz = 0;

                    ball.sleeping = true;
                    ball.dirty = true;
                    deactiveBall(ball);

                } else {

                    ball.falling = true;

                    ball.vx = 0;
                    ball.vz = 0;

                    ball.sleeping = true
                    ball.dirty = true;
                    deactiveBall(ball);
                }

                break;
            }
        }
    }
}