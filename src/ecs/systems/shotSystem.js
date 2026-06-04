// src/ecs/systems/shotSystem.js

import { activeBall } from "../world";

export function shotSystem(cueBall, aimRef) {
  const shot = aimRef.current.pendingShot;

  if (!shot) return;

  const strength = shot.power * 2.2;

  cueBall.vx =
    -Math.cos(shot.angle) * strength;

  cueBall.vz =
    -Math.sin(shot.angle) * strength;

  cueBall.sleeping = false;
  cueBall.dirty = true;

  activeBall(cueBall);

  aimRef.current.pendingShot = null;
}