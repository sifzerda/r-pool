// src/ecs/systems/collisionSystem.js

import { BALL_R } from "../constants/table.js";
import { resolveCollision } from "../utils/collision.js";
import { ballQuery, activeBall, markDirty } from "../world.js";
import { SpatialGrid } from "../utils/spatialGrid.js";

const grid = new SpatialGrid();

const MIN_DIST = BALL_R * 2;
const MIN_DIST_SQ = MIN_DIST * MIN_DIST;
const MIN_VELOCITY = 0.0001;

export function collisionSystem() {
  grid.clear();

  // Build spatial grid.
  for (const ball of ballQuery) {
    if (ball.pocketed || ball.falling) continue;
    grid.insert(ball);
  }

  // Check nearby ball pairs.
  for (const a of ballQuery) {
    if (a.pocketed || a.falling) continue;

    grid.forEachNearby(a, (b) => {
      if (a.id >= b.id) return;
      if (b.pocketed || b.falling) return;

      const dx = b.x - a.x;
      const dz = b.z - a.z;

      const distSq = dx * dx + dz * dz;

      if (distSq >= MIN_DIST_SQ) return;

      // Check whether the balls are approaching.
      const distance = Math.sqrt(distSq);
      if (distance === 0) return;

      const nx = dx / distance;
      const nz = dz / distance;

      const relativeVelocity =
        (b.vx - a.vx) * nx +
        (b.vz - a.vz) * nz;

      const approaching = relativeVelocity < -MIN_VELOCITY;

      resolveCollision(a, b);

      // Only activate balls when an actual collision transfers motion.
      if (approaching) {
        if (Math.hypot(a.vx, a.vz) > MIN_VELOCITY) {
          a.sleeping = false;
          activeBall(a);
        }

        if (Math.hypot(b.vx, b.vz) > MIN_VELOCITY) {
          b.sleeping = false;
          activeBall(b);
        }
      }

      markDirty(a);
      markDirty(b);
    });
  }
}