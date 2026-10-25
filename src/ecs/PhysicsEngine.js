// src/ecs/PhysicsEngine.js

import { ballQuery, activeBalls, fallingBalls, activeBall, deactiveBall, markDirty, ballsAreMoving } from "./world.js";
import { BALL_R, BALL_Y, MAX_POWER, MAX_SHOT_SPEED, CUE_SWING_DURATION } from "./constants/table.js";
import { MIN_X, MAX_X, MIN_Z, MAX_Z } from "./constants/tableBounds.js";
import { FIXED_DT, MAX_SUBSTEPS, MAX_FRAME_DT } from "./constants/simulation.js";
import { physicsConfig as cfg, physicsDerived, bindTimeStep, shotSpeed } from "./constants/physicsConfig.js";
import { FALL_END_Y, FALL_GRAVITY, findCapturePocket } from "./constants/pockets.js";
import { markPotted, recordShot, recordScratch, finishShot } from "../store/pottedStore.js";

const DIAMETER = BALL_R * 2;
const DIAMETER_SQ = DIAMETER * DIAMETER;
const RESPAWN_SPACING = DIAMETER + 0.01;
const RESPAWN_SPACING_SQ = RESPAWN_SPACING ** 2;
const MAX_STEPS = Math.ceil(MAX_FRAME_DT / FIXED_DT);
bindTimeStep(FIXED_DT);

function shotSystem(cueBall, aimRef) {
  const aim = aimRef.current;
  const shot = aim.pendingShot;
  if (!shot) return false;
  aim.pendingShot = null;
  if (ballsAreMoving() || cueBall.pocketed || cueBall.falling || cueBall.scratched || !Number.isFinite(shot.power) || !Number.isFinite(shot.cos) || !Number.isFinite(shot.sin) || shot.power <= 0) return false;
  const length = Math.hypot(shot.cos, shot.sin);
  if (length < 1e-8) return false;
  const speed = shotSpeed(Math.min(1, shot.power / MAX_POWER), MAX_SHOT_SPEED);
  cueBall.vx = shot.cos / length * speed;
  cueBall.vz = shot.sin / length * speed;
  activeBall(cueBall);
  markDirty(cueBall);
  recordShot();
  return true;
}

function bounce(ball, axis, limit, minimum) {
  ball[axis] = limit;
  const velocity = axis === "x" ? "vx" : "vz";
  const tangent = axis === "x" ? "vz" : "vx";
  if (minimum ? ball[velocity] >= 0 : ball[velocity] <= 0) return;
  const speed = Math.abs(ball[velocity]);
  const restitution = Math.max(Math.min(cfg.cushionMinE, cfg.cushionE), cfg.cushionE - cfg.cushionSpeedLoss * speed);
  ball[velocity] *= -restitution;
  const side = ball[tangent];
  ball[tangent] = Math.sign(side) * Math.max(0, Math.abs(side) - cfg.cushionFriction * (1 + restitution) * speed);
}

function resolveCushions(ball) {
  if (ball.pocketed || ball.falling || findCapturePocket(ball.x, ball.z)) return;
  if (ball.x < MIN_X) bounce(ball, "x", MIN_X, true);
  else if (ball.x > MAX_X) bounce(ball, "x", MAX_X, false);
  if (ball.z < MIN_Z) bounce(ball, "z", MIN_Z, true);
  else if (ball.z > MAX_Z) bounce(ball, "z", MAX_Z, false);
}

function physicsSystem(dt) {
  for (const ball of activeBalls) {
    if (ball.pocketed || ball.falling) continue;
    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;
    ball.rotX += ball.vz / BALL_R * dt;
    ball.rotZ -= ball.vx / BALL_R * dt;
    resolveCushions(ball);
  }
}

function frictionSystem() {
  const loss = cfg.rollDecel * FIXED_DT;
  for (const ball of activeBalls) {
    if (ball.pocketed || ball.falling) {
      deactiveBall(ball);
      continue;
    }
    const speed = Math.hypot(ball.vx, ball.vz);
    const next = speed * physicsDerived.damping - loss;
    if (speed === 0 || next <= 0 || next * next <= physicsDerived.sleepSq) {
      ball.vx = ball.vz = 0;
      markDirty(ball);
      deactiveBall(ball);
    } else {
      const scale = next / speed;
      ball.vx *= scale;
      ball.vz *= scale;
    }
  }
}

function collisionSystem() {
  if (!activeBalls.size) return;
  const balls = ballQuery.entities;
  for (let i = 0; i < balls.length - 1; i++) {
    const a = balls[i];
    if (a.pocketed || a.falling) continue;
    for (let j = i + 1; j < balls.length; j++) {
      const b = balls[j];
      if (b.pocketed || b.falling || !a.active && !b.active) continue;
      const dx = b.x - a.x, dz = b.z - a.z;
      if (Math.abs(dx) >= DIAMETER || Math.abs(dz) >= DIAMETER) continue;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq >= DIAMETER_SQ) continue;
      let nx = 1, nz = 0, distance = 0;
      if (distanceSq > 1e-12) {
        distance = Math.sqrt(distanceSq);
        nx = dx / distance;
        nz = dz / distance;
      } else {
        const rvx = a.vx - b.vx, rvz = a.vz - b.vz;
        const speed = Math.hypot(rvx, rvz);
        if (speed > 1e-8) {
          nx = rvx / speed;
          nz = rvz / speed;
        }
      }

      const correction = (DIAMETER - distance) * 0.5;
      a.x -= nx * correction;
      a.z -= nz * correction;
      b.x += nx * correction;
      b.z += nz * correction;
      markDirty(a);
      markDirty(b);
      const normalSpeed = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
      if (normalSpeed >= 0) continue;
      const impulse = -(1 + cfg.ballE) * normalSpeed * 0.5;
      a.vx -= impulse * nx;
      a.vz -= impulse * nz;
      b.vx += impulse * nx;
      b.vz += impulse * nz;
      a.rotY += impulse * 85e-4;
      b.rotY -= impulse * 85e-4;
      activeBall(a);
      activeBall(b);
    }
  }
}

function detectPockets() {
  for (const ball of activeBalls) {
    if (ball.pocketed || ball.falling) continue;
    const pocket = findCapturePocket(ball.x, ball.z);
    if (!pocket) continue;
    ball.vx = ball.vz = 0;
    deactiveBall(ball);
    if (ball.cueBall) {
      ball.scratched = true;
      ball.pocketed = true;
      ball.falling = false;
      recordScratch();
    } else {
      ball.pocketX = pocket.x;
      ball.pocketZ = pocket.z;
      ball.pocketRadius = pocket.radius;
      ball.falling = true;
      ball.fallSpeed = 0;
      fallingBalls.add(ball);
      markPotted(ball.id);
    }
    markDirty(ball);
  }
}

function updateFallingBalls(dt) {
  const pull = 1 - Math.exp(-8 * dt);
  for (const ball of fallingBalls) {
    ball.x += (ball.pocketX - ball.x) * pull;
    ball.z += (ball.pocketZ - ball.z) * pull;
    const dx = ball.pocketX - ball.x, dz = ball.pocketZ - ball.z;
    const clearance = Math.max(0.01, ball.pocketRadius - BALL_R);
    if (dx * dx + dz * dz <= clearance ** 2) {
      ball.fallSpeed += FALL_GRAVITY * dt;
      ball.y -= ball.fallSpeed * dt;
    }
    ball.rotX += dt * 8;
    ball.rotZ += dt * 8;
    if (ball.y <= FALL_END_Y) {
      ball.y = FALL_END_Y;
      ball.falling = false;
      ball.pocketed = true;
      fallingBalls.delete(ball);
    }
    markDirty(ball);
  }
}

function isClear(x, z, cueBall) {
  if (x < MIN_X || x > MAX_X || z < MIN_Z || z > MAX_Z || findCapturePocket(x, z)) return false;
  for (const ball of ballQuery.entities) {
    if (ball === cueBall || ball.pocketed || ball.falling) continue;
    if ((ball.x - x) ** 2 + (ball.z - z) ** 2 < RESPAWN_SPACING_SQ) return false;
  }
  return true;
}

function respawnCueBall(cueBall) {
  if (!cueBall.scratched || ballsAreMoving()) return false;
  let x = 0, z = 0;
  if (!isClear(x, z, cueBall)) {
    let nearest = Infinity;
    const columns = Math.floor((MAX_X - MIN_X) / RESPAWN_SPACING);
    const rows = Math.floor((MAX_Z - MIN_Z) / RESPAWN_SPACING);
    for (let row = 0; row <= rows; row++) {
      const candidateZ = MIN_Z + row * RESPAWN_SPACING;
      for (let column = 0; column <= columns; column++) {
        const candidateX = MIN_X + column * RESPAWN_SPACING;
        const distance = candidateX ** 2 + candidateZ ** 2;
        if (distance < nearest && isClear(candidateX, candidateZ, cueBall)) {
          nearest = distance;
          x = candidateX;
          z = candidateZ;
        }
      }
    }
    if (nearest === Infinity) return false;
  }
  Object.assign(cueBall, { x, z, y: BALL_Y, vx: 0, vz: 0, rotX: 0, rotY: 0, rotZ: 0, scratched: false, pocketed: false, falling: false, fallSpeed: 0 });
  deactiveBall(cueBall);
  markDirty(cueBall);
  return true;
}

class PhysicsEngine {
  constructor(cueBall, aimRef) {
    this.cueBall = cueBall;
    this.aimRef = aimRef;
    this.accumulator = 0;
    this.wasSimulating = false;
  }
  isSimulating() {
    return ballsAreMoving() || this.aimRef.current.pendingShot != null || this.cueBall.scratched;
  }
  updateSwing(dt) {
    const aim = this.aimRef.current;
    if (aim.swing !== 2) return;
    aim.swingT = Math.min(1, aim.swingT + dt / CUE_SWING_DURATION);
    if (aim.swingT >= 1) aim.swing = 0;
  }
  step() {
    shotSystem(this.cueBall, this.aimRef);
    let speedSq = 0;
    for (const ball of activeBalls) speedSq = Math.max(speedSq, ball.vx ** 2 + ball.vz ** 2);
    const substeps = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(Math.sqrt(speedSq) * FIXED_DT / (BALL_R * 0.5))));
    const dt = FIXED_DT / substeps;
    for (let i = 0; i < substeps; i++) {
      physicsSystem(dt);
      detectPockets();
      collisionSystem();
      detectPockets();
      for (const ball of activeBalls) resolveCushions(ball);
    }
    for (const ball of activeBalls) markDirty(ball);
    updateFallingBalls(FIXED_DT);
    frictionSystem();
    respawnCueBall(this.cueBall);
    if (!ballsAreMoving()) finishShot();
  }
  update(delta) {
    const dt = Number.isFinite(delta) ? Math.min(Math.max(delta, 0), MAX_FRAME_DT) : 0;
    const wasSwinging = this.aimRef.current.swing === 2;
    this.updateSwing(dt);
    const started = this.isSimulating();
    if (started) {
      this.accumulator += dt;
      let steps = 0;
      while (this.accumulator + 1e-12 >= FIXED_DT && steps++ < MAX_STEPS) {
        this.step();
        this.accumulator = Math.max(0, this.accumulator - FIXED_DT);
        if (!this.isSimulating()) {
          this.accumulator = 0;
          break;
        }
      }
    } else this.accumulator = 0;
    const moving = this.isSimulating();
    const needsFrame = started || moving || this.wasSimulating || wasSwinging || this.aimRef.current.swing === 2;
    this.wasSimulating = moving;
    return needsFrame;
  }
}

export {
  PhysicsEngine,
  collisionSystem,
  detectPockets,
  frictionSystem,
  physicsSystem,
  resolveCushions,
  respawnCueBall,
  shotSystem,
  updateFallingBalls
};
