// src/ecs/setupGame.js

import { world, activeBalls, fallingBalls, dirtyBalls, markDirty } from "./world";
import { BALL_R } from "./constants/table";
import { buildRack } from "../ecs/constants/rack";

const BALL_Y = 0.3;

function createBall(data) {
  return {
    ball: true,
    dirty: false,

    vx: 0,
    vz: 0,

    y: BALL_Y,
    rotX: 0,
    rotY: 0,
    rotZ: 0,

    radius: BALL_R,

    active: false,
    sleeping: true,

    falling: false,
    fallSpeed: 0,
    pocketed: false,

    ...data,
  };
}

export function setupGame() {
  world.clear();
  activeBalls.clear();
  fallingBalls.clear();
  dirtyBalls.clear();

  const cueBall = world.add(
    createBall({
      id: 0,
      instanceId: 0,
      cueBall: true,
      type: "cue",
      group: "cue",
      x: 0,
      z: 0,
    })
  );

  markDirty(cueBall);

  buildRack().forEach((ball, i) => {
    markDirty(
      world.add(createBall({ ...ball, id: i + 1, instanceId: i + 1 }))
    );
  });

  return cueBall;
}