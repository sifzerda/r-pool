// ─── src/ecs/world.js ───────────────────

import { World } from "miniplex";

export const world = new World();

export const ballQuery = world.with("ball");
export const cueBallQuery = world.with("cueBall");

//export const pockets = world.with("pocket");

