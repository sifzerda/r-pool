// SRC/ECS/UTILS/COLLISION.JS

import { BALL_R } from "../constants/table.js";

const RESTITUTION = 0.96;
const DEFAULT_MASS = 0.17;
const MIN_DISTANCE = 0.000001;

export function dist2(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;

  return dx * dx + dz * dz;
}

export function resolveCollision(a, b) {
  let dx = b.x - a.x;
  let dz = b.z - a.z;

  let distance = Math.sqrt(dx * dx + dz * dz);

  // Handle perfectly overlapping centres.
  if (distance < MIN_DISTANCE) {
    dx = 1;
    dz = 0;
    distance = 1;
  }

  const nx = dx / distance;
  const nz = dz / distance;

  // Separate overlapping balls.
  const overlap = BALL_R * 2 - distance;

  if (overlap > 0) {
    const separation = overlap * 0.5;

    a.x -= nx * separation;
    a.z -= nz * separation;

    b.x += nx * separation;
    b.z += nz * separation;
  }

  // Relative velocity.
  const rvx = b.vx - a.vx;
  const rvz = b.vz - a.vz;

  const velocityAlongNormal = rvx * nx + rvz * nz;

  // Already separating.
  if (velocityAlongNormal >= 0) return;

  const massA = a.mass || DEFAULT_MASS;
  const massB = b.mass || DEFAULT_MASS;

  const impulse =
    -(1 + RESTITUTION) *
    velocityAlongNormal /
    (1 / massA + 1 / massB);

  const impulseX = impulse * nx;
  const impulseZ = impulse * nz;

  a.vx -= impulseX / massA;
  a.vz -= impulseZ / massA;

  b.vx += impulseX / massB;
  b.vz += impulseZ / massB;

  // Simple visual spin response.
  a.rotY += impulse * 0.05;
  b.rotY -= impulse * 0.05;
}