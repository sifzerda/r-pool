// src/ecs/systems/physicsSystem.js

import { TABLE_X, TABLE_Z, BALL_R } from "../constants/table";

export function physicsSystem(world, dt) {
  const balls = world.with("ball");

  for (const ball of balls) {
    if (ball.sleeping) continue;

    // integrate
    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;

    const r = BALL_R;

    // -------------------------
    // LEFT / RIGHT cushions
    // -------------------------
    if (ball.x - r < -TABLE_X) {
      ball.x = -TABLE_X + r;
      ball.vx *= -0.9; // energy loss
    }

    if (ball.x + r > TABLE_X) {
      ball.x = TABLE_X - r;
      ball.vx *= -0.9;
    }

    // -------------------------
    // TOP / BOTTOM cushions
    // -------------------------
    if (ball.z - r < -TABLE_Z) {
      ball.z = -TABLE_Z + r;
      ball.vz *= -0.9;
    }

    if (ball.z + r > TABLE_Z) {
      ball.z = TABLE_Z - r;
      ball.vz *= -0.9;
    }

    // -------------------------
    // stop tiny jitter
    // -------------------------
    const speed = Math.hypot(ball.vx, ball.vz);

    if (speed < 0.02) {
      ball.vx = 0;
      ball.vz = 0;
      ball.sleeping = true;
    }

    // rotation (optional visual spin)
    ball.rotationX -= (ball.vz * dt) / r;
    ball.rotationZ += (ball.vx * dt) / r;
  }
}