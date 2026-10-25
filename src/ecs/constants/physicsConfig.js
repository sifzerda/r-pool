// ecs/constants/physicsConfig.js

const PHYSICS_DEFAULTS = Object.freeze({
  rollDecel: 1,
  viscous: 0.25,
  sleepSpeed: 0.04,
  cushionE: 0.82,
  cushionSpeedLoss: 6e-3,
  cushionMinE: 0.55,
  cushionFriction: 0.12,
  ballE: 0.96
});

const physicsConfig = { ...PHYSICS_DEFAULTS };

const physicsDerived = { damping: 1, sleepSq: 0 };
let stepDt = 1 / 120;

function recompute() {
  physicsDerived.damping = Math.exp(-physicsConfig.viscous * stepDt);
  physicsDerived.sleepSq = physicsConfig.sleepSpeed ** 2;
}

function bindTimeStep(dt) {
  if (Number.isFinite(dt) && dt > 0) {
    stepDt = dt;
    recompute();
  }
}

function setPhysics(patch) {
  for (const key of Object.keys(PHYSICS_DEFAULTS)) {
    const value = patch?.[key];
    if (!Number.isFinite(value)) continue;
    physicsConfig[key] = key === "ballE" || key === "cushionE" || key === "cushionMinE" ? Math.max(0, Math.min(1, value)) : Math.max(0, value);
  }
  recompute();
}

function resetPhysics() {
  setPhysics(PHYSICS_DEFAULTS);
}

const MIN_SHOT_SPEED = 0.6;
function shotSpeed(t, maxSpeed) {
  const fraction = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : 0;
  return MIN_SHOT_SPEED + (maxSpeed - MIN_SHOT_SPEED) * fraction * fraction;
}

recompute();

export {
  MIN_SHOT_SPEED,
  PHYSICS_DEFAULTS,
  bindTimeStep,
  physicsConfig,
  physicsDerived,
  resetPhysics,
  setPhysics,
  shotSpeed
};
