// src/ecs/PhysicsEngine.js

import { physicsSystem } from "./systems/physicsSystem";
import { frictionSystem } from "./systems/frictionSystem";
import { collisionSystem } from "./systems/collisionSystem";
import { pocketSystem } from "./systems/pocketSystem";
import { shotSystem } from "./systems/shotSystem";

export class PhysicsEngine {
  constructor(cueBall, aimRef) {
    this.cueBall = cueBall;
    this.aimRef = aimRef;

    this.accumulator = 0;

    this.FIXED_DT = 1 / 90;
    this.SUBSTEPS = 4;
  }

  update(delta) {
    this.accumulator += delta;

    while (this.accumulator >= this.FIXED_DT) {
      const subDt = this.FIXED_DT / this.SUBSTEPS;

      for (
        let i = 0;
        i < this.SUBSTEPS;
        i++
      ) {
        shotSystem(
          this.cueBall,
          this.aimRef
        );

        physicsSystem(subDt);
        collisionSystem();
        pocketSystem();
        frictionSystem(null, subDt);
      }

      this.accumulator -= this.FIXED_DT;
    }
  }
}