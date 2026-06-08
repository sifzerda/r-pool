// src/ecs/systems/frictionSystem.js
import { activeBalls, deactiveBall, markDirty } from "../world";

const VISCOUS_DAMP  = 1.5;  // decay rate — higher = stops sooner
const SLEEP_SPEED   = 0.09;

export function frictionSystem(dt) {
  const toSleep = [];
  const damping = Math.exp(-VISCOUS_DAMP * dt);  // smooth decay factor

  for (const ball of activeBalls) {
    if (ball.sleeping) continue;

    const speed = Math.hypot(ball.vx, ball.vz);
    if (speed === 0) continue;

    const newSpeed = speed * damping;

    if (newSpeed <= SLEEP_SPEED) {
      ball.vx = 0;
      ball.vz = 0;
      ball.sleeping = true;
      markDirty(ball);
      toSleep.push(ball);
      continue;
    }

    const scale = newSpeed / speed;
    ball.vx *= scale;
    ball.vz *= scale;
  }

  for (const ball of toSleep) deactiveBall(ball);
}