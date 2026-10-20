// src/ecs/systems/collisionSystem.js

import { BALL_R } from "../constants/table";
import { resolveCollision } from "../utils/collision";
import { ballQuery, activeBall, markDirty } from "../world";
import { SpatialGrid } from "../utils/spatialGrid";

const grid = new SpatialGrid();

const MIN_DIST = BALL_R * 2;
const MIN_DIST_SQ = MIN_DIST * MIN_DIST;

export function collisionSystem() {
  grid.clear();

  // Build the spatial grid.
  for (const ball of ballQuery) {
    if (ball.pocketed || ball.falling) continue;
    grid.insert(ball);
  }

  // Check nearby pairs.
  for (const a of ballQuery) {
    if (a.pocketed || a.falling) continue;

    grid.forEachNearby(a, (b) => {
      // Each pair is processed exactly once.
      if (a.id >= b.id) return;
      if (b.pocketed || b.falling) return;

      const dx = a.x - b.x;
      const dz = a.z - b.z;

      if (dx * dx + dz * dz >= MIN_DIST_SQ) return;

      resolveCollision(a, b);

      activeBall(a);
      activeBall(b);

      a.sleeping = false;
      b.sleeping = false;

      markDirty(a);
      markDirty(b);
    });
  }
}
