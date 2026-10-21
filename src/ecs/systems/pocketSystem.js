// src/ecs/systems/pocketSystem.js

import {
    activeBalls,
    ballQuery,
    markDirty,
    deactiveBall,
} from "../world.js";

import { POCKETS } from "../constants/pockets.js";
import { POCKET_R } from "../constants/table.js";

const POCKET_R_SQ = POCKET_R * POCKET_R;

// Falling animation settings
const FALL_PULL = 8;
const FALL_ACCELERATION = 12;
const FALL_END_Y = -0.4;

// --------------------------------
// Pocket detection
// --------------------------------

function detectPockets() {
    for (const ball of activeBalls) {
        if (ball.pocketed || ball.falling) continue;

        for (const pocket of POCKETS) {
            const dx = ball.x - pocket.x;
            const dz = ball.z - pocket.z;

            if (dx * dx + dz * dz >= POCKET_R_SQ) {
                continue;
            }

            if (ball.cueBall) {
                // Scratch: return cue ball to table centre.
                ball.x = 0;
                ball.z = 0;

                ball.vx = 0;
                ball.vz = 0;

                ball.sleeping = true;

                markDirty(ball);
                deactiveBall(ball);
            } else {
                // Start the falling animation.
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

// --------------------------------
// Falling animation
// --------------------------------

function updateFallingBalls(dt) {
    // Use all ball entities, not just activeBalls.
    // Falling balls have already been deactivated.
    for (const ball of ballQuery.entities) {
        if (!ball.falling || ball.pocketed) continue;

        const dx = ball.pocketX - ball.x;
        const dz = ball.pocketZ - ball.z;

        ball.x += dx * FALL_PULL * dt;
        ball.z += dz * FALL_PULL * dt;

        ball.fallSpeed += FALL_ACCELERATION * dt;
        ball.y -= ball.fallSpeed * dt;

        ball.rotX += dt * 8;
        ball.rotZ += dt * 8;

        markDirty(ball);

        // Finish the pocket animation.
        if (ball.y < FALL_END_Y) {
            ball.falling = false;
            ball.pocketed = true;
            ball.active = false;

            markDirty(ball);
        }
    }
}

// --------------------------------
// Main pocket system
// --------------------------------

export function pocketSystem(dt) {
    detectPockets();
    updateFallingBalls(dt);
}
