// src/ecs/systems/shotSystem.js

import { activeBall } from "../world";

export function shotSystem(
  cueBall,
  aimRef
) {
  const shot = aimRef.current.pendingShot;

  if (!shot) return;

  const cos = shot.cos ?? Math.cos(shot.angle);
  const sin = shot.sin ?? Math.sin(shot.angle);

  const strength = shot.power * 2.2;

  cueBall.vx = -cos * strength;
  cueBall.vz = -sin * strength;

  cueBall.sleeping = false;
  cueBall.dirty = true;

  activeBall(cueBall);

  aimRef.current.pendingShot = null;
}