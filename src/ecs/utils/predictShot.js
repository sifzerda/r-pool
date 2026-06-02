// src/ecs/utils/predictShot.js

export function predictShot(
  cueBall,
  balls,
  angle,
  ballRadius
) {
  const dirX = Math.cos(angle);
  const dirZ = Math.sin(angle);

  let nearestBall = null;
  let nearestT = Infinity;

  for (const ball of balls) {

    if (
      ball === cueBall ||
      ball.pocketed
    ) continue;

    const relX =
      ball.x - cueBall.x;

    const relZ =
      ball.z - cueBall.z;

    const t =
      relX * dirX +
      relZ * dirZ;

    if (t <= 0)
      continue;

    const closestX =
      cueBall.x +
      dirX * t;

    const closestZ =
      cueBall.z +
      dirZ * t;

    const dx =
      ball.x - closestX;

    const dz =
      ball.z - closestZ;

    const dist2 =
      dx * dx +
      dz * dz;

    const hitRadius =
      ballRadius * 2;

    if (
      dist2 >
      hitRadius * hitRadius
    ) continue;

    if (t < nearestT) {

      nearestT = t;
      nearestBall = ball;
    }
  }

  if (!nearestBall) {
    return null;
  }

  const impactX =
    cueBall.x +
    dirX * nearestT;

  const impactZ =
    cueBall.z +
    dirZ * nearestT;

  return {
    impactX,
    impactZ,
    objectBall: nearestBall,
  };
}