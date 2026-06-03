// ─── src/ecs/world.js ───────────────────

import { World } from "miniplex";

export const world = new World();

export const ballQuery = world.with("ball");
export const cueBallQuery = world.with("cueBall");

export const solidBallQuery = world
  .with("ball")
  .where(ball => ball.type === "solid");

export const stripeBallQuery = world
  .with("ball")
  .where(ball => ball.type === "stripe");

export const eightBallQuery = world
  .with("ball")
  .where(ball => ball.type === "eight");