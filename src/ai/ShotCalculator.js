// src/ai/ShotCalculator.js


import { BALL_R, MAX_POWER, MAX_SHOT_SPEED } from "../ecs/constants/table.js";
import { MIN_X, MAX_X, MIN_Z, MAX_Z } from "../ecs/constants/tableBounds.js";
import { POCKETS } from "../ecs/constants/pockets.js";

const DIAMETER = BALL_R * 2;
const MIN_SHOT_SPEED = 0.6;

const EPSILON = 1e-8;

function distance(x1, z1, x2, z2) {
  return Math.hypot(x2 - x1, z2 - z1);
}

function normalize(x, z) {
  const length = Math.hypot(x, z);

  if (length < EPSILON) return null;

  return {
    x: x / length,
    z: z / length,
  };
}

// Squared distance from a point to a line segment.
function pointSegmentDistanceSq(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;

  const lengthSq = dx * dx + dz * dz;

  if (lengthSq < EPSILON) {
    return (px - ax) ** 2 + (pz - az) ** 2;
  }

  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (pz - az) * dz) / lengthSq)
  );

  const closestX = ax + t * dx;
  const closestZ = az + t * dz;

  return (px - closestX) ** 2 + (pz - closestZ) ** 2;
}

// Checks whether another ball blocks a trajectory.
function isPathClear(start, end, balls, ignoredIds = [], clearance = DIAMETER) {
  const clearanceSq = clearance * clearance;

  for (const ball of balls) {
    if (
      ball.id === start.id ||
      ignoredIds.includes(ball.id) ||
      ball.pocketed ||
      ball.falling ||
      ball.scratched
    ) {
      continue;
    }

    const dSq = pointSegmentDistanceSq(
      ball.x,
      ball.z,
      start.x,
      start.z,
      end.x,
      end.z
    );

    if (dSq < clearanceSq) return false;
  }

  return true;
}

function getGhostBall(target, pocket) {
  const direction = normalize(
    pocket.x - target.x,
    pocket.z - target.z
  );

  if (!direction) return null;

  return {
    x: target.x - direction.x * DIAMETER,
    z: target.z - direction.z * DIAMETER,
    direction,
  };
}

function getPower(distanceTotal, cutCos) {
  // Approximate required velocity based on travel distance.
  const desiredSpeed = Math.max(
    2.5,
    Math.min(11, 2.8 + distanceTotal * 1.05 + (1 - cutCos) * 1.5)
  );

  // Invert PhysicsEngine.shotSpeed().
  const fraction = Math.max(
    0,
    Math.min(
      1,
      (desiredSpeed - MIN_SHOT_SPEED) /
      (MAX_SHOT_SPEED - MIN_SHOT_SPEED)
    )
  );

  return MAX_POWER * Math.sqrt(fraction);
}

export function calculateShot(cueBall, target, pocket, balls) {
  const ghost = getGhostBall(target, pocket);

  if (!ghost) return null;

  // Ghost ball must be on the playable table.
  if (
    ghost.x < MIN_X ||
    ghost.x > MAX_X ||
    ghost.z < MIN_Z ||
    ghost.z > MAX_Z
  ) {
    return null;
  }

  const cueDirection = normalize(
    ghost.x - cueBall.x,
    ghost.z - cueBall.z
  );

  if (!cueDirection) return null;

  const cueDistance = distance(
    cueBall.x,
    cueBall.z,
    ghost.x,
    ghost.z
  );

  const objectDistance = distance(
    target.x,
    target.z,
    pocket.x,
    pocket.z
  );

  // Cosine of the angle between the two trajectories.
  const cutCos = Math.max(
    -1,
    Math.min(
      1,
      cueDirection.x * ghost.direction.x +
      cueDirection.z * ghost.direction.z
    )
  );

  // Reject extremely thin contact angles.
  if (cutCos < 0.12) return null;

  // Check cue-ball route to ghost-ball position.
  const cuePathClear = isPathClear(
    cueBall,
    ghost,
    balls,
    [target.id],
    DIAMETER * 0.98
  );

  if (!cuePathClear) return null;

  // Check object-ball route to pocket.
  const objectPathClear = isPathClear(
    target,
    pocket,
    balls,
    [cueBall.id],
    DIAMETER * 0.95
  );

  if (!objectPathClear) return null;

  // Reject targets that are not actually aligned with the pocket.
  if (objectDistance < EPSILON) return null;

  const totalDistance = cueDistance + objectDistance;

  return {
    target,
    pocket,

    ghost: {
      x: ghost.x,
      z: ghost.z,
    },

    direction: cueDirection,

    cueDistance,
    objectDistance,
    totalDistance,

    cutCos,

    power: getPower(totalDistance, cutCos),

    cuePathClear,
    objectPathClear,
  };
}

export { distance, isPathClear };
