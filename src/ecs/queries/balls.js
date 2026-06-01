export function getBalls(world) {
  return world
    .query("x", "y", "vx", "vy")
    .filter(ball => !ball.pocketed);
}

export function getActiveBalls(world) {
  return world
    .query("x", "y", "num")
    .filter(ball => !ball.pocketed);
}