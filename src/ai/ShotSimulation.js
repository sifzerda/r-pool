// src/ai/ShotSimulation.js

import { stepPhysics, applyShot } from "../ecs/physicsCore.js";

export function simulateShot({
  balls,
  shot,
  physics,
  shotSpeed,
  findCapturePocket,
  fixedDt = 1 / 120,
  maxSteps = 1800,
  maxSubsteps = 8,
}) {
  if (
    !Array.isArray(balls) ||
    !shot ||
    !physics ||
    typeof shotSpeed !== "function" ||
    typeof findCapturePocket !== "function" ||
    !Number.isFinite(fixedDt) ||
    fixedDt <= 0
  ) {
    return null;
  }

  // --------------------------------------------------
  // BUILD SIMULATION STATE
  // --------------------------------------------------

  const simulatedBalls = [];
  let cue = null;

  // Single pass instead of filter + map + find.
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];

    if (
      ball.pocketed ||
      ball.falling ||
      ball.scratched
    ) {
      continue;
    }

    const simulated = {
      id: ball.id,
      x: ball.x,
      z: ball.z,
      vx: 0,
      vz: 0,
      cueBall: !!ball.cueBall,
      active: false,
      pocketed: false,
      falling: false,
      scratched: false,
    };

    simulatedBalls.push(simulated);

    if (simulated.cueBall) {
      cue = simulated;
    }
  }

  if (!cue) return null;

  // --------------------------------------------------
  // APPLY SHOT
  // --------------------------------------------------

  const speed = shotSpeed(shot.power);

  if (!applyShot(cue, shot, speed)) {
    return null;
  }

  // --------------------------------------------------
  // RESULT
  // --------------------------------------------------

  const result = {
    balls: simulatedBalls,
    pottedIds: [],
    firstContactId: null,
    railAfterContact: false,
    cueScratch: false,
    cuePosition: null,
    steps: 0,
    duration: 0,
    settled: false,
  };

  // --------------------------------------------------
  // EVENTS
  // --------------------------------------------------

  const events = {
    onFirstContact(id) {
      if (result.firstContactId === null) {
        result.firstContactId = id;
      }
    },

    onRail() {
      if (result.firstContactId !== null) {
        result.railAfterContact = true;
      }
    },

    onPocket(ball) {
      if (ball.cueBall) {
        result.cueScratch = true;
      } else {
        result.pottedIds.push(ball.id);
      }

      // Immediately remove captured balls from
      // simulation; no falling animation.
      ball.falling = false;
      ball.pocketed = true;
      ball.active = false;
      ball.vx = 0;
      ball.vz = 0;
    },
  };

  // --------------------------------------------------
  // PHYSICS OPTIONS
  // --------------------------------------------------

  // Reuse this object for every step instead of
  // allocating a new one 1200–1800 times.
  const physicsOptions = {
    balls: simulatedBalls,
    cfg: physics,
    findPocket: findCapturePocket,
    fixedDt,
    maxSubsteps,
    damping: physics.damping,
    sleepSq: physics.sleepSq,
    events,
  };

  // --------------------------------------------------
  // SIMULATION LOOP
  // --------------------------------------------------

  let steps = 0;
  let settled = false;

  for (; steps < maxSteps; steps++) {
    let moving = false;

    for (let i = 0; i < simulatedBalls.length; i++) {
      if (simulatedBalls[i].active) {
        moving = true;
        break;
      }
    }

    if (!moving) {
      settled = true;
      break;
    }

    stepPhysics(physicsOptions);
  }

  // Check once more in case the final step
  // brought all balls to rest.
  if (!settled) {
    settled = true;

    for (let i = 0; i < simulatedBalls.length; i++) {
      if (simulatedBalls[i].active) {
        settled = false;
        break;
      }
    }
  }

  // --------------------------------------------------
  // FINAL RESULT
  // --------------------------------------------------

  result.steps = steps;
  result.duration = steps * fixedDt;
  result.settled = settled;

  result.cuePosition = {
    x: cue.x,
    z: cue.z,
  };

  return result;
}
