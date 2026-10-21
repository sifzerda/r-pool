// ─── src/ecs/world.js ───────────────────

import { World } from "miniplex";

export const world = new World();
export const ballQuery = world.with("ball");

// Balls currently moving (cheap to iterate: usually 0-16 entries).
export const activeBalls = new Set();
// Balls playing the pocket-drop animation.
export const fallingBalls = new Set();
// Balls whose transform changed since the renderer last read them.
export const dirtyBalls = new Set();

export const ballsAreMoving = () => activeBalls.size > 0;

export function activeBall(ball) {
  if (ball.active) return;
  ball.active = true;
  activeBalls.add(ball);
}

export function deactiveBall(ball) {
  if (!ball.active) return;
  ball.active = false;
  activeBalls.delete(ball);
}

export function markDirty(ball) {
  ball.dirty = true;
  dirtyBalls.add(ball);
}

export function clearDirty(ball) {
  ball.dirty = false;
  dirtyBalls.delete(ball);
}