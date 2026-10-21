// src/ecs/systems/collisionSystem.js

import { BALL_R } from "../constants/table.js";
import { ballQuery, activeBalls, activeBall, markDirty } from "../world.js";

const MIN_DIST = BALL_R * 2;
const MIN_DIST_SQ = MIN_DIST * MIN_DIST;
const RESTITUTION = 0.96;
const SPIN_FACTOR = 0.0085;

function wake(ball) {
  ball.sleeping = false;
  activeBall(ball);
}

// With 16 equal-mass balls, brute force against only the moving balls is
// cheaper than a spatial hash, and does nothing at all while the table is idle.
export function collisionSystem() {
  if (activeBalls.size === 0) return;

  const balls = ballQuery.entities;

  for (const a of activeBalls) {
    if (a.pocketed || a.falling) continue;

    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];

      if (b === a || b.pocketed || b.falling) continue;

      // If b is also moving, the pair is handled when b is "a".
      if (b.active && b.id < a.id) continue;

      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const d2 = dx * dx + dz * dz;

      if (d2 >= MIN_DIST_SQ) continue;

      // Handle perfectly overlapping centres.
      let nx = 1;
      let nz = 0;
      let d = 0;

      if (d2 > 1e-12) {
        d = Math.sqrt(d2);
        nx = dx / d;
        nz = dz / d;
      }

      // Separate overlapping balls.
      const push = (MIN_DIST - d) * 0.5;

      a.x -= nx * push;
      a.z -= nz * push;
      b.x += nx * push;
      b.z += nz * push;

      markDirty(a);
      markDirty(b);

      const vn = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;

      // Already separating.
      if (vn >= 0) continue;

      // Equal masses: each ball's velocity changes by -(1 + e) * vn / 2.
      const j = -(1 + RESTITUTION) * vn * 0.5;

      a.vx -= j * nx;
      a.vz -= j * nz;
      b.vx += j * nx;
      b.vz += j * nz;

      // Simple visual spin response.
      a.rotY += j * SPIN_FACTOR;
      b.rotY -= j * SPIN_FACTOR;

      wake(a);
      wake(b);
    }
  }
}