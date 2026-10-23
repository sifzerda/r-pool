// src/ecs/systems/physics.js

import { PLAY_X, PLAY_Z, BALL_R, POCKET_R } from "../constants/table.js";
import { FIXED_DT } from "../constants/simulation.js";
import { physicsConfig as cfg, physicsDerived as derived, bindTimeStep } from "../constants/physicsConfig.js";
import { activeBalls, deactiveBall, markDirty } from "../world.js";

const OPENING = POCKET_R + BALL_R;
const INV_R = 1 / BALL_R;

const MIN_X = -PLAY_X + BALL_R;
const MAX_X = PLAY_X - BALL_R;
const MIN_Z = -PLAY_Z + BALL_R;
const MAX_Z = PLAY_Z - BALL_R;

bindTimeStep(FIXED_DT);

function inCornerGap(v, play) {
  return Math.abs(v + play) < OPENING || Math.abs(v - play) < OPENING;
}
function inPocketGap(v, play) {
  return inCornerGap(v, play) || Math.abs(v) < OPENING;
}

// Fraction of normal speed kept after a cushion hit. Harder hits lose more.
function cushionBounce(normalSpeed) {
  const e = cfg.cushionE - cfg.cushionSpeedLoss * normalSpeed;
  return e > cfg.cushionMinE ? e : cfg.cushionMinE;
}

// Rail grip: friction along the cushion, capped so it never reverses the
// sideways speed. (The old code multiplied sideways speed by the bounce
// factor, which cost 25% of it on every rail.)
function cushionGrip(sideSpeed, impulse) {
  const maxLoss = cfg.cushionFriction * impulse;
  const mag = Math.abs(sideSpeed);
  if (mag <= maxLoss) return 0;
  return sideSpeed > 0 ? sideSpeed - maxLoss : sideSpeed + maxLoss;
}

function bounceX(ball, limit) {
  ball.x = limit;
  if ((limit === MIN_X && ball.vx >= 0) || (limit === MAX_X && ball.vx <= 0)) return;
  const vn = Math.abs(ball.vx);
  const e = cushionBounce(vn);
  ball.vx = -ball.vx * e;
  ball.vz = cushionGrip(ball.vz, (1 + e) * vn);
}

function bounceZ(ball, limit) {
  ball.z = limit;
  if ((limit === MIN_Z && ball.vz >= 0) || (limit === MAX_Z && ball.vz <= 0)) return;
  const vn = Math.abs(ball.vz);
  const e = cushionBounce(vn);
  ball.vz = -ball.vz * e;
  ball.vx = cushionGrip(ball.vx, (1 + e) * vn);
}

export function physicsSystem(dt) {
  for (const ball of activeBalls) {
    if (ball.sleeping || ball.pocketed || ball.falling) continue;

    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;

    ball.rotX += ball.vz * INV_R * dt;
    ball.rotZ -= ball.vx * INV_R * dt;

    if (ball.x < MIN_X) {
      if (!inCornerGap(ball.z, PLAY_Z)) bounceX(ball, MIN_X);
    } else if (ball.x > MAX_X) {
      if (!inCornerGap(ball.z, PLAY_Z)) bounceX(ball, MAX_X);
    }

    if (ball.z < MIN_Z) {
      if (!inPocketGap(ball.x, PLAY_X)) bounceZ(ball, MIN_Z);
    } else if (ball.z > MAX_Z) {
      if (!inPocketGap(ball.x, PLAY_X)) bounceZ(ball, MAX_Z);
    }
  }
}

// Runs once per fixed step.
export function frictionSystem() {
  const roll = cfg.rollDecel * FIXED_DT;

  for (const ball of activeBalls) {
    if (ball.sleeping) {
      deactiveBall(ball);
      continue;
    }

    const speed = Math.hypot(ball.vx, ball.vz);

    // Speed-proportional drag, then a constant rolling-resistance slowdown.
    const next = speed * derived.damping - roll;

    if (next <= 0 || next * next <= derived.sleepSq) {
      ball.vx = 0;
      ball.vz = 0;
      ball.sleeping = true;

      markDirty(ball);
      deactiveBall(ball);
      continue;
    }

    const k = next / speed;
    ball.vx *= k;
    ball.vz *= k;
  }
}