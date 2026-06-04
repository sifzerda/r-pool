// src/ecs/setupGame.js
// takes in utils + constants files

import { world } from "./world";
import { BALL_R } from "./constants/table";
import { buildRack } from "./utils/rack";
import { Color } from "three";

export function setupGame() {
  world.clear();

  let nextInstanceId = 0;

  const cueBall = world.add({
    ball: true,
    cueBall: true,
    type: "cue",
    group: "cue",

    dirty: true,
    id: 0,
    instanceId: nextInstanceId++,

    color: "#ffffff",
    renderColor: new Color("#ffffff"),

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

    active: false,
    sleeping: true,
    pocketed: false,
  });

  buildRack().forEach((ball, i) => {
    world.add({
      ball: true,
      id: i + 1,
      dirty: true,
      instanceId: nextInstanceId++,
      
      ...ball,

      renderColor: new Color(ball.color),

      mass: 0.17,

      vx: 0,
      vz: 0,

      spinX: 0,
      spinZ: 0,

      sideSpin: 0,
      topSpin: 0,

      radius: BALL_R,
      active: false,
      sleeping: true,
      sleepTimer: 0,
      pocketed: false,
    });
  });

  return cueBall;
}