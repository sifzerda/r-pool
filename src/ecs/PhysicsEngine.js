// src/ecs/PhysicsEngine.js

import { physicsSystem, frictionSystem } from "./systems/physics.js";
import { collisionSystem } from "./systems/collisionSystem.js";
import { pocketSystem } from "./systems/pocketSystem.js";
import { shotSystem } from "./systems/shotSystem.js";
import { BALL_R } from "./constants/table.js";
import { FIXED_DT, MAX_SUBSTEPS, MAX_FRAME_DT } from "./constants/simulation.js";
import { activeBalls, fallingBalls, markDirty } from "./world.js";

export class PhysicsEngine {
  constructor(cueBall, aimRef) {
    this.cueBall = cueBall;
    this.aimRef = aimRef;
    this.accumulator = 0;
    this.wasSimulating = false;
  }

  step() {
    shotSystem(this.cueBall, this.aimRef);

    // Substeps scale with the fastest ball: usually 1, up to MAX_SUBSTEPS
    // for a hard break, so a ball never moves more than ~1 radius per substep.
    let maxSq = 0;
    for (const ball of activeBalls) {
      const s = ball.vx * ball.vx + ball.vz * ball.vz;
      if (s > maxSq) maxSq = s;
    }

    const steps = Math.min(
      MAX_SUBSTEPS,
      Math.max(1, Math.ceil((Math.sqrt(maxSq) * FIXED_DT) / BALL_R))
    );
    const dt = FIXED_DT / steps;

    for (let i = 0; i < steps; i++) {
      physicsSystem(dt);
      collisionSystem();
    }

    // Flag moved balls once per step instead of once per substep.
    for (const ball of activeBalls) markDirty(ball);

    pocketSystem(FIXED_DT);
    frictionSystem();
  }

  // Returns true if another frame should be rendered (frameloop="demand").
  update(delta) {
    const aim = this.aimRef.current;

    const simulating =
      activeBalls.size > 0 ||
      fallingBalls.size > 0 ||
      aim.pendingShot !== null;

    if (simulating) {
      this.accumulator += Math.min(delta, MAX_FRAME_DT);

      while (this.accumulator >= FIXED_DT) {
        this.step();
        this.accumulator -= FIXED_DT;
      }
    } else {
      this.accumulator = 0;
    }

    // - while simulating
    // - one trailing frame so renderers pick up the final dirty state
    // - while the stick follow-through animation (swing 2) is playing
    const needsFrame = simulating || this.wasSimulating || aim.swing === 2;
    this.wasSimulating = simulating;

    return needsFrame;
  }
}