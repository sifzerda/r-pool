// src/ecs/setupGame.js
// takes in utils + constants files

import { world, activeBalls, dirtyBalls } from "./world";
import { BALL_R } from "./constants/table";
import { buildRack } from "./utils/rack";
import { Color } from "three";

const BALL_MASS = 0.17;
const BALL_Y = 0.3;

function createBall(data) {
  return {
    ball: true,

    dirty: true,
    instanceId: data.instanceId,

    mass: BALL_MASS,

    vx: 0,
    vz: 0,

    rotX: 0,
    rotY: 0,
    rotZ: 0,
    y: BALL_Y,

    spinX: 0,
    spinZ: 0,
    sideSpin: 0,
    topSpin: 0,

    radius: BALL_R,

    active: false,
    sleeping: true,
    sleepTimer: 0,

    falling: false,
    fallSpeed: 0,
    pocketed: false,

    ...data,
    renderColor: new Color(data.color),
  };
}

export function setupGame() {
  world.clear();
  activeBalls.clear();
  dirtyBalls.clear();

  let nextInstanceId = 0;

  const cueBall = world.add(
    createBall({
      id: 0,
      instanceId: nextInstanceId++,

      cueBall: true,
      type: "cue",
      group: "cue",

      color: "#ffffff",

      x: 0,
      z: 0,
    })
  );

  for (const [i, ball] of buildRack().entries()) {
    world.add(
      createBall({
        ...ball,
        id: i + 1,
        instanceId: nextInstanceId++,
      })
    );
  }

  return cueBall;
}
