// ─── src/ecs/world.js ───────────────────

import { World } from "miniplex";

export const world = new World();

export const ballQuery = world.with("ball");
export const cueBallQuery = world.with("cueBall");

export const solidBallQuery = world.with("ball").where(ball => ball.type === "solid");
export const stripeBallQuery = world.with("ball").where(ball => ball.type === "stripe");
export const eightBallQuery = world.with("ball").where(ball => ball.type === "eight");

export const activeBalls = new Set();

  // helper for calculating aim line while balls moving (so not continously updating)
export function ballsAreMoving() {
  return activeBalls.size > 0;
}

//helpers for tracking only moving balls
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