// src/ecs/PhysicsEngine.js

import { physicsSystem, frictionSystem } from "./systems/physics.js";
import { collisionSystem } from "./systems/collisionSystem.js";
import { pocketSystem } from "./systems/pocketSystem.js";
import { shotSystem } from "./systems/shotSystem.js";

const FIXED_DT = 1 / 120;
const SUBSTEPS = 3;
const SUB_DT = FIXED_DT / SUBSTEPS;
const MAX_FRAME_DT = 0.05;

export class PhysicsEngine {
  constructor(cueBall, aimRef) {
    this.cueBall = cueBall;
    this.aimRef = aimRef;
    this.accumulator = 0;
  }

  update(delta) {
    this.accumulator += Math.min(delta, MAX_FRAME_DT);

    while (this.accumulator >= FIXED_DT) {
      shotSystem(this.cueBall, this.aimRef);

      for (let i = 0; i < SUBSTEPS; i++) {
        physicsSystem(SUB_DT);
        collisionSystem();
        pocketSystem();
      }

      frictionSystem(FIXED_DT);

      this.accumulator -= FIXED_DT;
    }
  }
}
