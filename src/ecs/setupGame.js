// src/ecs/setupGame.js
// takes in utils + constants files

import { world } from "./world";
import { BALL_R } from "./constants/table";
import { buildRack } from "./utils/rack";

export function setupGame() {
  world.clear();

  const cueBall = world.add({
    ball: true,
    cueBall: true,

    mass: 0.17,

    x: 0,
    z: 0,

    vx: 0,
    vz: 0,

    spinX: 0,
    spinZ: 0,

    sideSpin: 0,
    topSpin: 0,

    radius: BALL_R,

    sleeping: true,
    pocketed: false,
  });

  buildRack().forEach(ball => {
    world.add({
      ball: true,
      ...ball,

      mass: 0.17,

      vx: 0,
      vz: 0,

      spinX: 0,
      spinZ: 0,

      sideSpin: 0,
      topSpin: 0,

      radius: BALL_R,
      sleeping: true,
      pocketed: false,
    });
  });

  return cueBall;
}