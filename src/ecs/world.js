// ─── src/ecs/world.js ───────────────────

import { World } from "miniplex";

const world = new World();
const ballQuery = world.with("ball");
const activeBalls = /* @__PURE__ */ new Set();
const fallingBalls = /* @__PURE__ */ new Set();
const dirtyBalls = /* @__PURE__ */ new Set();
let revision = 0;

const getWorldRevision = () => revision;
const ballsAreMoving = () => activeBalls.size > 0 || fallingBalls.size > 0;

function canAim(ball, aim) {
  return !!ball && !ballsAreMoving() && !ball.pocketed && !ball.falling && !ball.scratched && aim.pendingShot == null && aim.swing !== 2;
}

function activeBall(ball) {
  ball.active = true;
  ball.sleeping = false;
  activeBalls.add(ball);
}

function deactiveBall(ball) {
  ball.active = false;
  ball.sleeping = true;
  activeBalls.delete(ball);
}

function markDirty(ball) {
  ball.dirty = true;
  dirtyBalls.add(ball);
  revision++;
}

function clearDirty(ball) {
  ball.dirty = false;
  dirtyBalls.delete(ball);
}

function clearWorld() {
  world.clear();
  activeBalls.clear();
  fallingBalls.clear();
  dirtyBalls.clear();
  revision++;
}

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
  world
};
