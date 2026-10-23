// src/ecs/systems/shotSystem.js

import { activeBall, markDirty } from "../world";
import { MAX_POWER } from "../constants/table";
import { shotSpeed } from "../constants/physicsConfig";

// Cue-ball speed at full power, in table units per second.
// (Before: MAX_POWER * 2.2 = 39.6. The lab was tuned around 18.)
const MAX_SHOT_SPEED = 24;

export function shotSystem(cueBall, aimRef) {
  const aim = aimRef.current;
  const shot = aim.pendingShot;

  if (!shot) return;

  // shot.power is 0..MAX_POWER; turn it into a 0..1 fraction of the full pull.
  const t = shot.power / MAX_POWER;
  const strength = shotSpeed(t, MAX_SHOT_SPEED);

  cueBall.vx = shot.cos * strength;
  cueBall.vz = shot.sin * strength;
  cueBall.sleeping = false;

  markDirty(cueBall);
  activeBall(cueBall);

  aim.pendingShot = null;
}