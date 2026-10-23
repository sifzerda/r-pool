// Live-tunable physics parameters. physics.js reads these every step, so
// setPhysics({...}) works while the game is running.
// All speeds are in table units per second (BALL_R = 0.1, MAX_POWER = 18).

export const PHYSICS_DEFAULTS = Object.freeze({
  // Cloth: constant rolling slowdown plus a small speed-proportional drag.
  rollDecel: 1.0, // units/s^2
  viscous: 0.25, // 1/s
  sleepSpeed: 0.04, // below this a ball stops dead

  // Cushions.
  cushionE: 0.82, // bounce for a slow hit
  cushionSpeedLoss: 0.006, // extra bounce lost per unit of impact speed
  cushionMinE: 0.55, // bounce never drops below this
  cushionFriction: 0.12, // rail grip: sideways speed lost per unit of bounce impulse

  ballE: 0.96, // not used by physics.js; read it from your ball-ball collision code
});

export const physicsConfig = { ...PHYSICS_DEFAULTS };

export const physicsDerived = { damping: 1, sleepSq: 0 };

let stepDt = 1 / 120;

export function bindTimeStep(dt) {
  stepDt = dt;
  recompute();
}

function recompute() {
  physicsDerived.damping = Math.exp(-physicsConfig.viscous * stepDt);
  physicsDerived.sleepSq = physicsConfig.sleepSpeed * physicsConfig.sleepSpeed;
}

export function setPhysics(patch) {
  Object.assign(physicsConfig, patch);
  recompute();
}

export function resetPhysics() {
  setPhysics(PHYSICS_DEFAULTS);
}

recompute();