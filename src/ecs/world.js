// ─── src/ecs/world.js ───────────────────

import { World } from "miniplex";

// --------------------------------------------------
// WORLD
// --------------------------------------------------

const world = new World();
const ballQuery = world.with("ball");

// --------------------------------------------------
// BALL STATE
// --------------------------------------------------

const activeBalls = new Set();
const fallingBalls = new Set();
const dirtyBalls = new Set();

let revision = 0;

// --------------------------------------------------
// QUERIES
// --------------------------------------------------

function getWorldRevision() {
  return revision;
}

function ballsAreMoving() {
  return (activeBalls.size !== 0 || fallingBalls.size !== 0);
}

function canAim(ball, aim) {
  return (
    ball != null &&
    aim != null &&
    activeBalls.size === 0 &&
    fallingBalls.size === 0 &&
    !ball.pocketed &&
    !ball.falling &&
    !ball.scratched &&
    aim.pendingShot == null &&
    aim.swing !== 2
  );
}

// --------------------------------------------------
// ACTIVE BALLS
// --------------------------------------------------

function activeBall(ball) {
  if (!ball) return;

  ball.active = true;
  ball.sleeping = false;

  if (!activeBalls.has(ball)) {
    activeBalls.add(ball);
  }
}

function deactiveBall(ball) {
  if (!ball) return;

  ball.active = false;
  ball.sleeping = true;

  activeBalls.delete(ball);
}

// --------------------------------------------------
// DIRTY BALLS
// --------------------------------------------------

function markDirty(ball) {
  if (!ball) return;

  ball.dirty = true;
  dirtyBalls.add(ball);
  revision++;
}

function clearDirty(ball) {
  if (!ball) return;

  ball.dirty = false;
  dirtyBalls.delete(ball);
}

// --------------------------------------------------
// RESET
// --------------------------------------------------

function clearWorld() {
  world.clear();

  activeBalls.clear();
  fallingBalls.clear();
  dirtyBalls.clear();

  revision++;
}

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

export {
  activeBall,
  activeBalls,
  ballQuery,
  ballsAreMoving,
  canAim,
  clearDirty,
  clearWorld,
  deactiveBall,
  dirtyBalls,
  fallingBalls,
  getWorldRevision,
  markDirty,
  world,
};
