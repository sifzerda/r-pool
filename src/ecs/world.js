// ─── src/ecs/world.js ───────────────────

import { World } from "miniplex";

export const world = new World();

export const balls = world.with("ball");
export const cueBalls = world.with("cueBall");

//export const pockets = world.with("pocket");

