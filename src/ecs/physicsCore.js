// src/ecs/physicsCore.js

import { BALL_R } from "./constants/table.js";
import { MIN_X, MAX_X, MIN_Z, MAX_Z } from "./constants/tableBounds.js";

const DIAMETER = BALL_R * 2;
const DIAMETER_SQ = DIAMETER * DIAMETER;
const INV_BALL_R = 1 / BALL_R;
const SUBSTEP_DISTANCE = BALL_R * 0.5;
const EPSILON_SQ = 1e-12;
const SPIN_IMPULSE = 85e-4;

// --------------------------------------------------
// SUBSTEPS
// --------------------------------------------------

export function getSubsteps(balls, fixedDt, maxSubsteps) {
  let maxSpeedSq = 0;

  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];

    if (!ball.active || ball.pocketed || ball.falling) {
      continue;
    }

    const speedSq = ball.vx * ball.vx + ball.vz * ball.vz;

    if (speedSq > maxSpeedSq) {
      maxSpeedSq = speedSq;
    }
  }

  if (maxSpeedSq === 0) return 1;

  const travel = Math.sqrt(maxSpeedSq) * fixedDt;

  return Math.min(maxSubsteps, Math.max(1, Math.ceil(travel / SUBSTEP_DISTANCE)));
}

// --------------------------------------------------
// SHOT
// --------------------------------------------------

export function applyShot(ball, shot, speed) {
  const cos = shot.cos;
  const sin = shot.sin;
  const lengthSq = cos * cos + sin * sin;

  if (!Number.isFinite(lengthSq) || lengthSq < 1e-16 || !Number.isFinite(speed) || speed <= 0) {
    return false;
  }

  const scale = speed / Math.sqrt(lengthSq);

  ball.vx = cos * scale;
  ball.vz = sin * scale;
  ball.active = true;

  return true;
}

// --------------------------------------------------
// CUSHIONS
// --------------------------------------------------

function bounceX(ball, limit, minimum, cfg, events) {
  ball.x = limit;
  const vx = ball.vx;

  if (minimum ? vx >= 0 : vx <= 0) {
    return;
  }

  const speed = Math.abs(vx);

  const restitution = Math.max(Math.min(cfg.cushionMinE, cfg.cushionE), cfg.cushionE - cfg.cushionSpeedLoss * speed);

  ball.vx = -vx * restitution;

  const side = ball.vz;
  const friction = cfg.cushionFriction * (1 + restitution) * speed;

  ball.vz = Math.sign(side) * Math.max(0, Math.abs(side) - friction);
  events?.onRail?.(ball);
}

function bounceZ(ball, limit, minimum, cfg, events) {
  ball.z = limit;

  const vz = ball.vz;

  if (minimum ? vz >= 0 : vz <= 0) {
    return;
  }

  const speed = Math.abs(vz);
  const restitution = Math.max(Math.min(cfg.cushionMinE, cfg.cushionE), cfg.cushionE - cfg.cushionSpeedLoss * speed);

  ball.vz = -vz * restitution;

  const side = ball.vx;
  const friction = cfg.cushionFriction * (1 + restitution) * speed;

  ball.vx = Math.sign(side) * Math.max(0, Math.abs(side) - friction);
  events?.onRail?.(ball);
}

export function resolveCushion(ball, cfg, findPocket, events) {
  if (ball.pocketed || ball.falling) {
    return;
  }

  const x = ball.x;
  const z = ball.z;

  // Avoid pocket lookup when safely inside bounds.
  if (x >= MIN_X && x <= MAX_X && z >= MIN_Z && z <= MAX_Z) {
    return;
  }

  if (findPocket(x, z)) return;

  if (x < MIN_X) {
    bounceX(ball, MIN_X, true, cfg, events);
  } else if (x > MAX_X) {
    bounceX(ball, MAX_X, false, cfg, events);
  }

  if (z < MIN_Z) {
    bounceZ(ball, MIN_Z, true, cfg, events);
  } else if (z > MAX_Z) {
    bounceZ(ball, MAX_Z, false, cfg, events);
  }
}

// --------------------------------------------------
// INTEGRATION
// --------------------------------------------------

export function integrateBalls(balls, dt, cfg, findPocket, events) {
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];

    if (!ball.active || ball.pocketed || ball.falling) {
      continue;
    }

    const dx = ball.vx * dt;
    const dz = ball.vz * dt;

    ball.x += dx;
    ball.z += dz;

    if (ball.rotX != null) {
      ball.rotX += dz * INV_BALL_R;
    }

    if (ball.rotZ != null) {
      ball.rotZ -= dx * INV_BALL_R;
    }

    resolveCushion(ball, cfg, findPocket, events);
  }
}

// --------------------------------------------------
// POCKET CAPTURE
// --------------------------------------------------

export function capturePockets(balls, findPocket, events) {
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];

    if (!ball.active || ball.pocketed || ball.falling) {
      continue;
    }

    const pocket = findPocket(ball.x, ball.z);

    if (!pocket) continue;

    ball.vx = 0;
    ball.vz = 0;
    ball.active = false;

    if (ball.cueBall) {
      ball.scratched = true;
      ball.pocketed = true;
    } else {
      ball.falling = true;
      ball.pocketX = pocket.x;
      ball.pocketZ = pocket.z;
      ball.pocketRadius = pocket.radius;
    }

    events?.onPocket?.(ball, pocket);
  }
}

// --------------------------------------------------
// BALL COLLISIONS
// --------------------------------------------------

// Dense racks need a solver that does not immediately propagate
// impulses according to the order of balls in the ECS query.
const CONTACT_ITERATIONS = 5;
const POSITION_ITERATIONS = 3;
const POSITION_SLOP = DIAMETER * 1e-5;

export function collideBalls(balls, cfg, events) {
  const count = balls.length;
  if (count < 2) return;

  // Scratch buffers are local to the call, so the same solver is safe
  // in the live game and in the AI worker.
  const deltaX = new Float64Array(count);
  const deltaZ = new Float64Array(count);
  const contacts = [];

  // Collect overlapping / touching pairs from one position snapshot.
  // Include resting neighbours: a moving ball may push through a rack.
  for (let i = 0; i < count - 1; i++) {
    const a = balls[i];
    if (a.pocketed || a.falling) continue;

    for (let j = i + 1; j < count; j++) {
      const b = balls[j];
      if (b.pocketed || b.falling || (!a.active && !b.active)) continue;

      const dx = b.x - a.x;
      if (dx < -DIAMETER || dx > DIAMETER) continue;
      const dz = b.z - a.z;
      if (dz < -DIAMETER || dz > DIAMETER) continue;

      const distanceSq = dx * dx + dz * dz;
      if (distanceSq > DIAMETER_SQ) continue;

      let nx = 1;
      let nz = 0;
      let distance = 0;
      if (distanceSq > EPSILON_SQ) {
        distance = Math.sqrt(distanceSq);
        nx = dx / distance;
        nz = dz / distance;
      } else {
        const rvx = a.vx - b.vx;
        const rvz = a.vz - b.vz;
        const speedSq = rvx * rvx + rvz * rvz;
        if (speedSq > EPSILON_SQ) {
          const inv = 1 / Math.sqrt(speedSq);
          nx = rvx * inv;
          nz = rvz * inv;
        }
      }

      contacts.push({ i, j, nx, nz, overlap: DIAMETER - distance });
    }
  }

  if (contacts.length === 0) return;

  // Jacobi-style impulse updates: all contacts in an iteration read
  // the same velocities. This avoids a left-to-right chain reaction.
  // Restitution is applied only on the first iteration; subsequent
  // iterations settle the coupled contacts without adding energy.
  for (let iteration = 0; iteration < CONTACT_ITERATIONS; iteration++) {
    deltaX.fill(0);
    deltaZ.fill(0);
    let anyImpulse = false;

    for (let k = 0; k < contacts.length; k++) {
      const contact = contacts[k];
      const a = balls[contact.i];
      const b = balls[contact.j];
      const { nx, nz } = contact;

      const normalSpeed = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
      if (normalSpeed >= -1e-9) continue;

      const restitution = iteration === 0 ? cfg.ballE : 0;
      const impulse = -(1 + restitution) * normalSpeed * 0.5;
      const ix = impulse * nx;
      const iz = impulse * nz;

      deltaX[contact.i] -= ix;
      deltaZ[contact.i] -= iz;
      deltaX[contact.j] += ix;
      deltaZ[contact.j] += iz;
      anyImpulse = true;

      if (iteration === 0) {
        if (a.cueBall && !b.cueBall) events?.onFirstContact?.(b.id);
        else if (b.cueBall && !a.cueBall) events?.onFirstContact?.(a.id);
      }

      if (a.rotY != null) a.rotY += impulse * SPIN_IMPULSE;
      if (b.rotY != null) b.rotY -= impulse * SPIN_IMPULSE;
    }

    if (!anyImpulse) break;

    for (let i = 0; i < count; i++) {
      if (deltaX[i] === 0 && deltaZ[i] === 0) continue;
      const ball = balls[i];
      ball.vx += deltaX[i];
      ball.vz += deltaZ[i];
      ball.active = true;
      events?.onActivate?.(ball);
    }
  }

  // Resolve overlaps separately from velocity. Recompute contact
  // normals each iteration as the balls move apart.
  for (let iteration = 0; iteration < POSITION_ITERATIONS; iteration++) {
    let anyCorrection = false;
    for (let k = 0; k < contacts.length; k++) {
      const contact = contacts[k];
      const a = balls[contact.i];
      const b = balls[contact.j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq >= DIAMETER_SQ) continue;

      const distance = Math.sqrt(distanceSq);
      const overlap = DIAMETER - distance - POSITION_SLOP;
      if (overlap <= 0) continue;

      const inv = distance > 1e-12 ? 1 / distance : 0;
      const nx = inv ? dx * inv : contact.nx;
      const nz = inv ? dz * inv : contact.nz;
      const correction = overlap * 0.5;
      a.x -= nx * correction;
      a.z -= nz * correction;
      b.x += nx * correction;
      b.z += nz * correction;
      events?.onMove?.(a);
      events?.onMove?.(b);
      anyCorrection = true;
    }
    if (!anyCorrection) break;
  }
}

// --------------------------------------------------
// FRICTION
// --------------------------------------------------

export function applyFriction(balls, cfg, damping, sleepSq, fixedDt, events) {
  const loss = cfg.rollDecel * fixedDt;

  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];

    if (!ball.active) continue;

    if (ball.pocketed || ball.falling) {
      ball.active = false;
      events?.onDeactivate?.(ball);
      continue;
    }

    const vx = ball.vx;
    const vz = ball.vz;

    const speedSq = vx * vx + vz * vz;

    if (speedSq === 0) {
      ball.vx = 0;
      ball.vz = 0;
      ball.active = false;

      events?.onDeactivate?.(ball);
      continue;
    }

    const speed = Math.sqrt(speedSq);
    const next = speed * damping - loss;

    if (next <= 0 || next * next <= sleepSq) {
      ball.vx = 0;
      ball.vz = 0;
      ball.active = false;

      events?.onDeactivate?.(ball);
    } else {
      const scale = next / speed;

      ball.vx = vx * scale;
      ball.vz = vz * scale;
    }
  }
}

// --------------------------------------------------
// MAIN PHYSICS STEP
// --------------------------------------------------

export function stepPhysics({
  balls,
  cfg,
  findPocket,
  fixedDt,
  maxSubsteps,
  damping,
  sleepSq,
  events,
}) {
  const substeps = getSubsteps(balls, fixedDt, maxSubsteps);
  const dt = fixedDt / substeps;

  for (let step = 0; step < substeps; step++) {
    integrateBalls(balls, dt, cfg, findPocket, events);
    capturePockets(balls, findPocket, events);
    collideBalls(balls, cfg, events);
    capturePockets(balls, findPocket, events);

    // Cushion correction after collisions.
    // Only check active balls outside table bounds.
    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];

      if (!ball.active) continue;

      if (ball.x < MIN_X || ball.x > MAX_X || ball.z < MIN_Z || ball.z > MAX_Z) {
        resolveCushion(ball, cfg, findPocket, events);
      }
    }
  }

  applyFriction(balls, cfg, damping, sleepSq, fixedDt, events);
}
