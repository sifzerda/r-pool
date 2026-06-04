// src/ecs/systems/collisionSystem.js

import { BALL_R } from "../constants/table";
import { resolveCollision } from "../utils/collision";
import { ballQuery, activeBall } from "../world";
import { SpatialGrid } from "../utils/spatialGrid";

const grid = new SpatialGrid();

export function collisionSystem() {
  grid.clear();

  const balls = [];

  for (const ball of ballQuery) {
    if (ball.pocketed) continue;

    grid.insert(ball);
    balls.push(ball);
  }

  const checked = new Set();

  const minDist = BALL_R * 2;
  const minDistSq = minDist * minDist;

  for (const a of balls) {
    const nearby = grid.getNearby(a);

    for (const b of nearby) {
      if (a === b) continue;

      const id = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;

      if (checked.has(id)) continue;

      checked.add(id);

      const dx = a.x - b.x;
      const dz = a.z - b.z;

      if (dx * dx + dz * dz < minDistSq) {
        resolveCollision(a, b);

        activeBall(a);
        activeBall(b);

        a.sleeping = false;
        b.sleeping = false;

        a.dirty = true;
        b.dirty = true;
      }
    }
  }
}