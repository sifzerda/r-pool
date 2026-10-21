// src/ecs/systems/pocketSystem.js

import { activeBalls, fallingBalls, markDirty, deactiveBall } from "../world.js";
import { POCKETS } from "../constants/pockets.js";
import { POCKET_R } from "../constants/table.js";
import { markPotted } from "../../store/pottedStore.js";

const POCKET_R_SQ = POCKET_R * POCKET_R;

// Falling animation settings
const FALL_PULL = 8;
const FALL_ACCELERATION = 12;
const FALL_END_Y = -0.4;

function detectPockets() {
  for (const ball of activeBalls) {
    if (ball.pocketed || ball.falling) continue;

    for (const pocket of POCKETS) {
      const dx = ball.x - pocket.x;
      const dz = ball.z - pocket.z;

      if (dx * dx + dz * dz >= POCKET_R_SQ) continue;

      ball.vx = 0;
      ball.vz = 0;
      ball.sleeping = true;

      if (ball.cueBall) {
        // Scratch: return cue ball to table centre.
        ball.x = 0;
        ball.z = 0;
      } else {
        // Start the falling animation.
        ball.pocketX = pocket.x;
        ball.pocketZ = pocket.z;
        ball.falling = true;
        ball.fallSpeed = 0;
        fallingBalls.add(ball);
        markPotted(ball.id);
      }

      markDirty(ball);
      deactiveBall(ball);
      break;
    }
  }
}

function updateFallingBalls(dt) {
  for (const ball of fallingBalls) {
    ball.x += (ball.pocketX - ball.x) * FALL_PULL * dt;
    ball.z += (ball.pocketZ - ball.z) * FALL_PULL * dt;

    ball.fallSpeed += FALL_ACCELERATION * dt;
    ball.y -= ball.fallSpeed * dt;

    ball.rotX += dt * 8;
    ball.rotZ += dt * 8;

    markDirty(ball);

    if (ball.y < FALL_END_Y) {
      ball.falling = false;
      ball.pocketed = true;
      fallingBalls.delete(ball);
    }
  }
}

// Runs once per fixed step.
export function pocketSystem(dt) {
  detectPockets();
  updateFallingBalls(dt);
}