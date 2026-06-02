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

    x: 180,
    y: 170,

    vx: 0,
    vy: 0,

    radius: BALL_R,

    num: 0,

    color: "#ffffff",

    sleeping: true,
    pocketed: false,

    rotationX: 0,
    rotationZ: 0,
  });

  buildRack().forEach(ball => {
    world.add({
      ball: true,

      ...ball,

      vx: 0,
      vy: 0,

      radius: BALL_R,

      color: BALL_COLORS[ball.num],

      sleeping: true,
      pocketed: false,

      rotationX: 0,
      rotationZ: 0,
    });
  });

  return cueBall;
}