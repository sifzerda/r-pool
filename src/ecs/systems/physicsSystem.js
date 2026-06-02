// src/ecs/systems/physicsSystem.js

export function physicsSystem(world, dt) {
  const balls = world.with("ball");

  for (const ball of balls) {
    if (ball.sleeping) continue;

    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;

    // table bounds
    ball.x = Math.max(-3.3, Math.min(3.3, ball.x));
    ball.z = Math.max(-1.6, Math.min(1.6, ball.z));

    const r = 0.1;

    ball.rotationX -= (ball.vz * dt) / r;
    ball.rotationZ += (ball.vx * dt) / r;
  }
}