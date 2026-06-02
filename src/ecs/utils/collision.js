// SRC/ECS/UTILS/COLLISION.JS

import { BALL_R } from "../constants/table.js";

export function dist2(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;

  return dx * dx + dz * dz;
}

export function resolveCollision(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;

  const distance = Math.sqrt(dx * dx + dz * dz);

  if (distance === 0) return;

  const nx = dx / distance;
  const ny = dz / distance;

  // Separate overlapping balls
  const overlap = BALL_R * 2 - distance;

  if (overlap > 0) {
    a.x -= nx * overlap * 0.5;
    a.z -= ny * overlap * 0.5;

    b.x += nx * overlap * 0.5;
    b.z += ny * overlap * 0.5;
  }

  // Relative velocity
  const rvx = b.vx - a.vx;
  const rvy = b.vz - a.vz;

  const velocityAlongNormal =
    rvx * nx + rvy * ny;

  // Already separating
  if (velocityAlongNormal >= 0) return;

  // Equal-mass elastic collision
  const impulse = velocityAlongNormal;

  a.vx += impulse * nx;
  a.vz += impulse * ny;

  b.vx -= impulse * nx;
  b.vz -= impulse * ny;
}