// src/ecs/setupGame.js

import { world, clearWorld, markDirty } from "./world.js";
import { BALL_R, BALL_Y } from "./constants/table.js";
import { buildRack } from "./constants/rack.js";
import useGameStore from "../store/useGameStore.js";

function createBall(data) {
  return {
    ball: true,
    dirty: false,
    active: false,
    sleeping: true,
    vx: 0,
    vz: 0,
    y: BALL_Y,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    radius: BALL_R,
    falling: false,
    fallSpeed: 0,
    pocketed: false,
    scratched: false,
    pocketX: 0,
    pocketZ: 0,
    pocketRadius: 0,
    ...data
  };
}

function setupGame() {
  clearWorld();
  useGameStore.getState().resetPotted();
  const cue = world.add(createBall({ id: 0, instanceId: 0, cueBall: true, type: "cue", group: "cue", x: 0, z: 0 }));
  markDirty(cue);
  const rack = buildRack();
  for (let i = 0; i < rack.length; i++) {
    const data = rack[i];
    markDirty(world.add(createBall({ ...data, id: data.num, instanceId: i + 1 })));
  }
  return cue;
}

export { setupGame };
