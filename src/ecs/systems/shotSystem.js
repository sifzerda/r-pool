// src/ecs/systems/shotSystem.js

import { activeBall, markDirty } from "../world";

const POWER_TO_SPEED = 2.2;

export function shotSystem(cueBall, aimRef) {
  const aim = aimRef.current;
  const shot = aim.pendingShot;

  if (!shot) return;

  const strength = shot.power * POWER_TO_SPEED;

  cueBall.vx = shot.cos * strength;
  cueBall.vz = shot.sin * strength;
  cueBall.sleeping = false;

  markDirty(cueBall);
  activeBall(cueBall);

  aim.pendingShot = null;
}