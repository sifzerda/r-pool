// src/ai/ai.worker.js


import {
  planShot,
  rankCueSpots,
} from "./ShotPlanner.js";

import { simulateShot } from "./ShotSimulation.js";
import { aiPhysics } from "./aiPhysics.js";

import {
  setPhysics,
  bindTimeStep,
} from "../ecs/constants/physicsConfig.js";

// --------------------------------------------------
// WORKER CONFIGURATION
// --------------------------------------------------

// Cache the last timestep so it is not rebound
// unnecessarily for every AI request.
let lastFixedDt = null;

// Cache physics values, not object references.
// Structured cloning creates new objects when
// messages cross the worker boundary.
let lastPhysics = null;

function samePhysics(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i];

    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is(a[key], b[key])
    ) {
      return false;
    }
  }

  return true;
}

function configurePhysics(physics, fixedDt) {
  if (
    fixedDt !== undefined &&
    fixedDt !== lastFixedDt
  ) {
    bindTimeStep(fixedDt);
    lastFixedDt = fixedDt;
  }

  if (
    physics != null &&
    !samePhysics(physics, lastPhysics)
  ) {
    setPhysics(physics);

    lastPhysics = { ...physics };
  }
}

// --------------------------------------------------
// REQUEST HANDLERS
// --------------------------------------------------

const handlers = {
  plan(payload) {
    return planShot(payload);
  },

  placement(payload) {
    return rankCueSpots(payload);
  },

  predict(payload) {
    return simulateShot({
      ...payload,
      ...aiPhysics,
    });
  },
};

// --------------------------------------------------
// WORKER MESSAGE HANDLER
// --------------------------------------------------

self.onmessage = ({ data }) => {
  const {
    id,
    type,
    payload,
    physics,
    fixedDt,
  } = data || {};

  try {
    const handler = handlers[type];

    if (!handler) {
      throw new Error(
        `Unknown AI request: ${type}`
      );
    }

    if (!payload || typeof payload !== "object") {
      throw new Error(
        `Invalid payload for AI request: ${type}`
      );
    }

    configurePhysics(physics, fixedDt);

    const result = handler(payload);

    self.postMessage({
      id,
      type,
      result,
    });
  } catch (error) {
    self.postMessage({
      id,
      type,
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
};
