// src/ecs/systems/frictionSystem.js

export function frictionSystem(world) {
  const balls = world.with("ball");

  for (const ball of balls) {
    if (ball.sleeping) continue;

    const speed = Math.hypot(
      ball.vx,
      ball.vy
    );

    if (speed < 0.05) {
      ball.vx = 0;
      ball.vy = 0;
      ball.sleeping = true;
      continue;
    }

    const drag = 0.992;

    ball.vx *= drag;
    ball.vy *= drag;
  }
}
