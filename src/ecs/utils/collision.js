import { BALL_R } from "../constants/table.js";

export function dist2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return dx * dx + dy * dy;
}

export function resolveCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return;

  const nx = dx / distance;
  const ny = dy / distance;

  // Separate overlapping balls
  const overlap = BALL_R * 2 - distance;

  if (overlap > 0) {
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;

    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;
  }

  // Relative velocity
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;

  const velocityAlongNormal =
    rvx * nx + rvy * ny;

  // Already separating
  if (velocityAlongNormal >= 0) return;

  // Equal-mass elastic collision
  const impulse = velocityAlongNormal;

  a.vx += impulse * nx;
  a.vy += impulse * ny;

  b.vx -= impulse * nx;
  b.vy -= impulse * ny;
}