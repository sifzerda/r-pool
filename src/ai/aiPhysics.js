 // src/ai/aiPhysics.js

import {
  MAX_POWER,
  MAX_SHOT_SPEED,
} from "../ecs/constants/table.js";

import {
  FIXED_DT,
  MAX_SUBSTEPS,
} from "../ecs/constants/simulation.js";

import {
  physicsConfig,
  physicsDerived,
  shotSpeed,
} from "../ecs/constants/physicsConfig.js";

import {
  findCapturePocket,
} from "../ecs/constants/pockets.js";

export const aiPhysics = {
  physics: {
    ballE: physicsConfig.ballE,
    cushionE: physicsConfig.cushionE,
    cushionMinE: physicsConfig.cushionMinE,
    cushionSpeedLoss: physicsConfig.cushionSpeedLoss,
    cushionFriction: physicsConfig.cushionFriction,
    rollDecel: physicsConfig.rollDecel,
    damping: physicsDerived.damping,
    sleepSq: physicsDerived.sleepSq,
  },

  shotSpeed: (power) =>
    shotSpeed(
      Math.min(1, power / MAX_POWER),
      MAX_SHOT_SPEED
    ),

  findCapturePocket,

  fixedDt: FIXED_DT,
  maxSubsteps: MAX_SUBSTEPS,
};
