// src/ecs/systems/physicsSystem.js

export function physicsSystem(
  world,
  dt
) {
  const balls = world.with("ball");

  for (const ball of balls) {
    if (ball.sleeping) continue;

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    const r = 0.1;

    ball.rotationX -=
      (ball.vy * dt) / r;

    ball.rotationZ +=
      (ball.vx * dt) / r;
  }
}