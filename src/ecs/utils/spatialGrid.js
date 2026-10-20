// src/ecs/utils/spatialGrid.js

import { BALL_R } from "../constants/table";

const CELL_SIZE = BALL_R * 4;

// The table is small, so signed 16-bit cell coordinates are ample.
function cellKey(x, z) {
  return ((x & 0xffff) << 16) | (z & 0xffff);
}

export class SpatialGrid {
  constructor() {
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  insert(ball) {
    const cx = Math.floor(ball.x / CELL_SIZE);
    const cz = Math.floor(ball.z / CELL_SIZE);
    const key = cellKey(cx, cz);

    let bucket = this.cells.get(key);

    if (!bucket) {
      bucket = [];
      this.cells.set(key, bucket);
    }

    bucket.push(ball);
  }

  getNearby(ball) {
    const result = [];

    const cx = Math.floor(ball.x / CELL_SIZE);
    const cz = Math.floor(ball.z / CELL_SIZE);

    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const bucket = this.cells.get(
          cellKey(cx + x, cz + z)
        );

        if (!bucket) continue;

        for (let i = 0; i < bucket.length; i++) {
          result.push(bucket[i]);
        }
      }
    }

    return result;
  }

forEachNearby(ball, callback) {
  const cx = Math.floor(ball.x / CELL_SIZE);
  const cz = Math.floor(ball.z / CELL_SIZE);

  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      const bucket = this.cells.get(
        cellKey(cx + x, cz + z)
      );

      if (!bucket) continue;

      for (let i = 0; i < bucket.length; i++) {
        callback(bucket[i]);
      }
    }
  }
}


}
