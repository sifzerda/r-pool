// src/setupRack.js

import { world } from "./ecs/world";
import {TABLE_W, TABLE_H, BALL_R} from "./ecs/constants/table.js";
import {BALL_COLORS} from "./ecs/constants/colors.js";
import {buildRack} from "./ecs/utils/rack.js";

export function setupRack() {
  world.clear();

  // Cue ball
  world.add({
    ball: true,
    cueBall: true,

    x: TABLE_W * 0.27,
    y: TABLE_H / 2,

    vx: 0,
    vy: 0,

    radius: BALL_R,

    rotationX: 0,
    rotationZ: 0,

    color: "#ffffff",

    sleeping: true,
  });

  // Rack balls
  buildRack().forEach(({ x, y, num }) => {
    world.add({
      ball: true,

      x,
      y,

      vx: 0,
      vy: 0,

      radius: BALL_R,

      num,

      color: BALL_COLORS[num],

      rotationX: 0,
      rotationZ: 0,

      sleeping: true,
    });
  });
}