// src/ecs/PhysicsEngine.js

import {
  ballQuery,
  activeBalls,
  fallingBalls,
  activeBall,
  deactiveBall,
  markDirty,
  ballsAreMoving,
} from "./world.js";

import {
  BALL_R,
  MAX_POWER,
  MAX_SHOT_SPEED,
  CUE_SWING_DURATION,
} from "./constants/table.js";

import {
  FIXED_DT,
  MAX_SUBSTEPS,
  MAX_FRAME_DT,
} from "./constants/simulation.js";

import {
  physicsConfig as cfg,
  physicsDerived,
  bindTimeStep,
  shotSpeed,
} from "./constants/physicsConfig.js";

import {
  FALL_END_Y,
  FALL_GRAVITY,
  findCapturePocket,
} from "./constants/pockets.js";

import {
  applyShot,
  stepPhysics,
  integrateBalls,
  collideBalls,
  capturePockets,
  resolveCushion,
  applyFriction,
} from "./physicsCore.js";

import useGameStore from "../store/useGameStore.js";
import { logPendingShotComparison } from "../ai/AIPhysicsDebugger.js";

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const MAX_STEPS = Math.ceil(MAX_FRAME_DT / FIXED_DT);
const MAX_SHOT_SECONDS = 30;
const DEV = import.meta.env.DEV;
const INV_SWING_DURATION = 1 / CUE_SWING_DURATION;
const FALL_PULL = 8;

bindTimeStep(FIXED_DT);

// --------------------------------------------------
// SHARED PHYSICS OPTIONS
// --------------------------------------------------

// Reused every fixed step.
// physicsDerived values are refreshed before
// stepping in case the live configuration changes.

const physicsOptions = {
  balls: null,
  cfg,
  findPocket: findCapturePocket,
  fixedDt: FIXED_DT,
  maxSubsteps: MAX_SUBSTEPS,
  damping: physicsDerived.damping,
  sleepSq: physicsDerived.sleepSq,
  events: null,
};

// --------------------------------------------------
// LIVE GAME EVENTS
// --------------------------------------------------

const liveEvents = {
  onMove(ball) {
    markDirty(ball);
  },

  onActivate(ball) {
    activeBall(ball);
  },

  onDeactivate(ball) {
    deactiveBall(ball);
    markDirty(ball);
  },

  onFirstContact(id) {
    useGameStore
      .getState()
      .recordFirstContact(id);
  },

  onRail() {
    useGameStore
      .getState()
      .recordRailContact();
  },

  onPocket(ball) {
    deactiveBall(ball);

    if (ball.cueBall) {
      useGameStore
        .getState()
        .recordScratch();
    } else {
      ball.fallSpeed = 0;
      fallingBalls.add(ball);

      useGameStore
        .getState()
        .markPotted(ball.id);
    }

    markDirty(ball);
  },
};

physicsOptions.events = liveEvents;

// --------------------------------------------------
// SHOT VALIDATION
// --------------------------------------------------

function rejectShot(reason, detail) {
  if (DEV) {
    console.warn(`[shot] rejected: ${reason}`, detail);
  }

  return false;
}

function shotSystem(cueBall, aimRef) {
  const aim = aimRef.current;

  if (!aim) return false;

  const shot = aim.pendingShot;

  if (!shot) return false;

  aim.pendingShot = null;

  const game = useGameStore.getState();
  const shooter = shot.player || "human";

  if (game.screen !== "play" || game.stats.shotActive || game.stats.cleared) {
    return rejectShot(
      "game not ready for shot"
    );
  }

  if (game.currentPlayer !== shooter) {
    return rejectShot("wrong player", {
      shooter,
      current: game.currentPlayer,
    });
  }

  if (game.ballInHand) {
    return rejectShot("ball in hand");
  }

  if (game.winner) {
    return rejectShot(
      "game already won"
    );
  }

  if (ballsAreMoving() || fallingBalls.size > 0) {
    return rejectShot("balls still moving");
  }

  if (cueBall.pocketed || cueBall.falling || cueBall.scratched) {
    return rejectShot("cue ball unavailable");
  }

  if (!Number.isFinite(shot.power) || !Number.isFinite(shot.cos) || !Number.isFinite(shot.sin) || shot.power <= 0) {
    return rejectShot("invalid shot", shot);
  }

  const speed = shotSpeed(Math.min(1, shot.power / MAX_POWER), MAX_SHOT_SPEED);
  const lengthSq = shot.cos * shot.cos + shot.sin * shot.sin;

  if (!Number.isFinite(lengthSq) || lengthSq < 1e-16 || !Number.isFinite(speed) || speed <= 0) {
    return rejectShot("invalid shot direction");
  }

  // Record the shot first, so physics cannot
  // begin if the game rules reject it.
  game.recordShot();

  if (!useGameStore .getState() .stats.shotActive) {
    return rejectShot("shot rejected by game state");
  }

  if (!applyShot(cueBall, shot, speed)) {
    return rejectShot("could not apply shot");
  }

  activeBall(cueBall);
  markDirty(cueBall);

  return true;
}

// --------------------------------------------------
// COMPATIBILITY EXPORTS
// --------------------------------------------------

function physicsSystem(dt) {
  integrateBalls(ballQuery.entities, dt, cfg, findCapturePocket, liveEvents);
}

function collisionSystem() {
  collideBalls(ballQuery.entities, cfg, liveEvents);
}

function detectPockets() {
  capturePockets(ballQuery.entities, findCapturePocket, liveEvents);
}

function resolveCushions(ball) {
  resolveCushion(ball, cfg, findCapturePocket, liveEvents);
}

function frictionSystem() {
  applyFriction(ballQuery.entities, cfg, physicsDerived.damping, physicsDerived.sleepSq, FIXED_DT, liveEvents);
}

// --------------------------------------------------
// FALLING BALLS
// --------------------------------------------------

function updateFallingBalls(dt) {
  if (fallingBalls.size === 0) {
    return;
  }

  const pull = 1 - Math.exp(-FALL_PULL * dt);

  for (const ball of fallingBalls) {
    ball.x += (ball.pocketX - ball.x) * pull;
    ball.z += (ball.pocketZ - ball.z) * pull;

    const dx = ball.pocketX - ball.x;
    const dz = ball.pocketZ - ball.z;
    const clearance = Math.max(0.01, ball.pocketRadius - BALL_R);

    if (dx * dx + dz * dz <= clearance * clearance) {
      ball.fallSpeed += FALL_GRAVITY * dt;
      ball.y -= ball.fallSpeed * dt;
    }

    if (ball.rotX != null) {
      ball.rotX += dt * 8;
    }

    if (ball.rotZ != null) {
      ball.rotZ += dt * 8;
    }

    if (ball.y <= FALL_END_Y) {
      ball.y = FALL_END_Y;

      ball.falling = false;
      ball.pocketed = true;

      fallingBalls.delete(ball);
    }

    markDirty(ball);
  }
}

// --------------------------------------------------
// PHYSICS ENGINE
// --------------------------------------------------

function PhysicsEngine(cueBall, aimRef) {
  let accumulator = 0;
  let wasSimulating = false;
  let shotClock = 0;

  // Reuse options per engine instance.
  const options = {
    ...physicsOptions,
    balls: ballQuery.entities,
  };

  function isSimulating() {
    const aim = aimRef.current;

    return (ballsAreMoving() || fallingBalls.size > 0 || aim?.pendingShot != null);
  }

  // ------------------------------------------------
  // SWING
  // ------------------------------------------------

  function updateSwing(dt) {
    const aim = aimRef.current;

    if (!aim || aim.swing !== 2) {
      return;
    }

    aim.swingT = Math.min(1, aim.swingT + dt * INV_SWING_DURATION);

    if (aim.swingT >= 1) {
      aim.swing = 0;
    }
  }

  // ------------------------------------------------
  // SHOT TIMEOUT
  // ------------------------------------------------

  function enforceShotTimeLimit() {
    if (!ballsAreMoving() && fallingBalls.size === 0) {
      return;
    }

    shotClock += FIXED_DT;

    if (shotClock <= MAX_SHOT_SECONDS) {
      return;
    }

    if (DEV) {
      console.warn("[physics] shot exceeded time limit");
    }

    // Delete directly while iterating.
    // JavaScript Sets support deletion of
    // the current entry during iteration.
    for (const ball of activeBalls) {
      ball.vx = 0;
      ball.vz = 0;

      deactiveBall(ball);
      markDirty(ball);
    }

    for (const ball of fallingBalls) {
      ball.y = FALL_END_Y;
      ball.falling = false;
      ball.pocketed = true;

      fallingBalls.delete(ball);
      markDirty(ball);
    }

    shotClock = 0;
  }

  // ------------------------------------------------
  // FIXED STEP
  // ------------------------------------------------

  function step() {
    shotSystem(cueBall, aimRef);

    const moving = ballsAreMoving();

    // Skip expensive collision/integration work
    // when only pocket animations remain.
    if (moving) {
      options.balls = ballQuery.entities;
      options.damping = physicsDerived.damping;
      options.sleepSq = physicsDerived.sleepSq;

      stepPhysics(options);

      for (const ball of activeBalls) {
        markDirty(ball);
      }
    }

    if (fallingBalls.size > 0) {
      updateFallingBalls(FIXED_DT);
    }

    enforceShotTimeLimit();

    const game = useGameStore.getState();

    if (game.stats.shotActive && !ballsAreMoving() && fallingBalls.size === 0) {
      shotClock = 0;

      logPendingShotComparison(ballQuery.entities, game);

      game.finishShot();
    }
  }

  // ------------------------------------------------
  // FRAME UPDATE
  // ------------------------------------------------

  function update(delta) {
    const dt = Number.isFinite(delta) ? Math.min(Math.max(delta, 0), MAX_FRAME_DT) : 0;
    const aim = aimRef.current;
    const wasSwinging = aim?.swing === 2;

    updateSwing(dt);

    const started = isSimulating();

    if (started) {
      accumulator += dt;

      let steps = 0;

      while (accumulator + 1e-12 >= FIXED_DT && steps < MAX_STEPS) {
        step();
        steps++;

        accumulator = Math.max(0, accumulator - FIXED_DT);

        if (!isSimulating()) {
          accumulator = 0;
          break;
        }
      }
    } else {
      accumulator = 0;
    }

    const moving = isSimulating();
    const needsFrame = started || moving || wasSimulating || wasSwinging || aim?.swing === 2;

    wasSimulating = moving;

    return needsFrame;
  }

  return {
    isSimulating,
    updateSwing,
    step,
    update,
  };
}

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

export {
  PhysicsEngine,
  collisionSystem,
  detectPockets,
  frictionSystem,
  physicsSystem,
  resolveCushions,
  shotSystem,
  updateFallingBalls,
};
