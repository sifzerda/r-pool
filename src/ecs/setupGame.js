// src/ecs/setupGame.js
// takes in utils + constants files

import { world } from "./world";
import { BALL_R } from "./constants/table";
import { BALL_COLORS } from "./constants/colors";
import { buildRack } from "./utils/rack";

export function setupGame() {
  world.clear();

  const cueBall = world.add({
    ball: true,
    cueBall: true,

    x: 0,
    z: 0,   // center of table

    vx: 0,
    vz: 0,

    radius: BALL_R,

    sleeping: true,
    pocketed: false,
  });

  buildRack().forEach(ball => {
    world.add({
      ball: true,
      ...ball,

      vx: 0,
      vz: 0,

      radius: BALL_R,
      sleeping: true,
      pocketed: false,
    });
  });

  return cueBall;
}