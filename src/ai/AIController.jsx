// src/ai/AIController.jsx

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import useGameStore from "../store/useGameStore.js";
import { ballQuery, ballsAreMoving } from "../ecs/world.js";

import {
  MIN_X,
  MAX_X,
  MIN_Z,
  MAX_Z,
} from "../ecs/constants/tableBounds.js";

import {
  BALL_R,
  MAX_POWER,
  MAX_PULL,
  MIN_PULL,
} from "../ecs/constants/table.js";

import { POCKETS } from "../ecs/constants/pockets.js";
import { placeCueBall } from "../ecs/AimController.jsx";
import { createAIWorker } from "./AIWorkerClient.js";

import {
  setPendingPrediction,
  clearPendingPrediction,
} from "./AIPhysicsDebugger.js";

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const GROUP_BALLS = {
  solids: [1, 2, 3, 4, 5, 6, 7],
  stripes: [9, 10, 11, 12, 13, 14, 15],
};

const AI_CHARGE_DURATION = 0.55;
const PLACE_DURATION = 0.65;

const SHOT_START_TIMEOUT = 3;
const MAX_SETTLE_WAIT = 10;
const RETRY_COOLDOWN = 0.4;

const DEBUG_PREDICTIONS = import.meta.env.DEV;

const GRID_MARGIN = 0.12;
const GRID_STEP = 0.2;

const SPOT_CLEARANCE_SQ = (BALL_R * 2.4) ** 2;
const POCKET_CLEARANCE_SQ = (BALL_R * 3.5) ** 2;

const MAX_PLACEMENT_CHOICES = 6;
const RANDOM_PLACEMENT_TRIES = 24;

const FALLBACK_SPOTS = [
  {
    x: MIN_X + (MAX_X - MIN_X) * 0.25,
    z: 0,
  },
  { x: 0, z: 0 },
];

// --------------------------------------------------
// GAME HELPERS
// --------------------------------------------------

function isAITurn(game) {
  return (
    game.screen === "play" &&
    !game.settings.solo &&
    game.currentPlayer === "ai" &&
    !game.winner
  );
}

function getGroupState(game) {
  const group = game.playerGroups.ai;
  const ids = GROUP_BALLS[group];

  let remaining = 0;

  if (ids) {
    for (let i = 0; i < ids.length; i++) {
      if (!game.pottedIds.has(ids[i])) {
        remaining++;
      }
    }
  }

  return {
    group,
    isEightBallLegal: Boolean(
      group && remaining === 0
    ),
  };
}

// --------------------------------------------------
// SNAPSHOTS
// --------------------------------------------------

function snapshotBall(ball) {
  return {
    id: ball.id,
    x: ball.x,
    z: ball.z,
    cueBall: !!ball.cueBall,
    pocketed: !!ball.pocketed,
    falling: !!ball.falling,
    scratched: !!ball.scratched,
  };
}

function snapshotBalls(balls) {
  const result = new Array(balls.length);

  for (let i = 0; i < balls.length; i++) {
    result[i] = snapshotBall(balls[i]);
  }

  return result;
}

// --------------------------------------------------
// PLACEMENT
// --------------------------------------------------

function isSpotClear(x, z, balls, cueId) {
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];

    if (
      ball.id === cueId ||
      ball.pocketed ||
      ball.falling ||
      ball.scratched
    ) {
      continue;
    }

    const dx = ball.x - x;
    const dz = ball.z - z;

    if (
      dx * dx + dz * dz <
      SPOT_CLEARANCE_SQ
    ) {
      return false;
    }
  }

  for (let i = 0; i < POCKETS.length; i++) {
    const pocket = POCKETS[i];

    const dx = pocket.x - x;
    const dz = pocket.z - z;

    if (
      dx * dx + dz * dz <
      POCKET_CLEARANCE_SQ
    ) {
      return false;
    }
  }

  return true;
}

function generatePlacementSpots(cueBall, balls) {
  const spots = [];

  const minX = MIN_X + GRID_MARGIN;
  const maxX = MAX_X - GRID_MARGIN;
  const minZ = MIN_Z + GRID_MARGIN;
  const maxZ = MAX_Z - GRID_MARGIN;

  // Integer grid indices avoid accumulated
  // floating-point drift from repeated += 0.2.
  const xCount = Math.floor(
    (maxX - minX) / GRID_STEP
  );

  const zCount = Math.floor(
    (maxZ - minZ) / GRID_STEP
  );

  for (let zi = 0; zi <= zCount; zi++) {
    const z = minZ + zi * GRID_STEP;

    for (let xi = 0; xi <= xCount; xi++) {
      const x = minX + xi * GRID_STEP;

      if (isSpotClear(x, z, balls, cueBall.id)) {
        spots.push({ x, z });
      }
    }
  }

  return spots;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function tryPlaceCueBall(cueBall, spots, balls) {
  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];

    if (
      !Number.isFinite(spot.x) ||
      !Number.isFinite(spot.z)
    ) {
      continue;
    }

    if (
      !isSpotClear(
        spot.x,
        spot.z,
        balls,
        cueBall.id
      )
    ) {
      continue;
    }

    if (
      placeCueBall(
        cueBall,
        spot.x,
        spot.z
      )
    ) {
      return true;
    }
  }

  for (
    let i = 0;
    i < RANDOM_PLACEMENT_TRIES;
    i++
  ) {
    const x = randomBetween(
      MIN_X + GRID_MARGIN,
      MAX_X - GRID_MARGIN
    );

    const z = randomBetween(
      MIN_Z + GRID_MARGIN,
      MAX_Z - GRID_MARGIN
    );

    if (
      !isSpotClear(
        x,
        z,
        balls,
        cueBall.id
      )
    ) {
      continue;
    }

    if (placeCueBall(cueBall, x, z)) {
      return true;
    }
  }

  return false;
}

// --------------------------------------------------
// AIM
// --------------------------------------------------

function resetAIAim(aim) {
  if (!aim) return;

  if (
    !aim.aiControlled &&
    !aim.handPlacement
  ) {
    return;
  }

  aim.aiControlled = false;
  aim.charging = false;

  aim.swing = 0;
  aim.swingT = 0;

  aim.power = 0;
  aim.pullBack = 0;

  aim.pendingShot = null;

  aim.aiShotPower = 0;
  aim.aiShotType = null;
  aim.aiTargetId = null;

  aim.handPlacement = null;
  aim.handLift = 0;
}

function applyAIShot(aim, cueBall, shot) {
  const angle = Math.atan2(
    shot.sin,
    shot.cos
  );

  aim.angle = angle;
  aim.cos = shot.cos;
  aim.sin = shot.sin;

  aim.lockedAngle = angle;
  aim.lockedCos = shot.cos;
  aim.lockedSin = shot.sin;

  aim.aiShotPower = shot.power;
  aim.aiShotType = shot.type;
  aim.aiTargetId = shot.targetId;

  aim.aiControlled = true;
  aim.charging = true;

  aim.swing = 1;
  aim.swingT = 0;

  aim.pullBack = 0;
  aim.power = 0;

  aim.shotX = cueBall.x;
  aim.shotZ = cueBall.z;
}

function validShot(shot) {
  return (
    shot &&
    Number.isFinite(shot.cos) &&
    Number.isFinite(shot.sin) &&
    Number.isFinite(shot.power) &&
    shot.power > 0 &&
    shot.cos * shot.cos +
      shot.sin * shot.sin >
      1e-16
  );
}

// --------------------------------------------------
// CONTROLLER
// --------------------------------------------------

export default function AIController({
  cueBall,
  aimRef,
}) {
  const invalidate = useThree(
    (state) => state.invalidate
  );

  const workerRef = useRef(null);
  const requestId = useRef(0);

  const phase = useRef("idle");

  const submitted = useRef(false);
  const sawActiveShot = useRef(false);

  const chargeTime = useRef(0);
  const plannedPull = useRef(0);

  const stuckTime = useRef(0);
  const movingTime = useRef(0);
  const retryIn = useRef(0);

  // Track the current planning request's
  // turn context to reject stale responses.
  const requestContext = useRef(null);

  // --------------------------------------------------
  // WORKER LIFECYCLE
  // --------------------------------------------------

  useEffect(() => {
    const worker = createAIWorker();

    workerRef.current = worker;

    // Only relevant store changes wake the AI.
    // Unrelated HUD/stat updates no longer
    // invalidate the canvas automatically.
    let previous = useGameStore.getState();

    const unsubscribe = useGameStore.subscribe(
      (state) => {
        const changed =
          state.screen !== previous.screen ||
          state.currentPlayer !== previous.currentPlayer ||
          state.ballInHand !== previous.ballInHand ||
          state.winner !== previous.winner ||
          state.settings.solo !== previous.settings.solo ||
          state.stats.shotActive !== previous.stats.shotActive ||
          state.difficulty !== previous.difficulty ||
          state.playerGroups.ai !== previous.playerGroups.ai ||
          state.pottedIds !== previous.pottedIds;

        previous = state;

        if (changed) {
          invalidate();
        }
      }
    );

    invalidate();

    return () => {
      unsubscribe();

      requestId.current++;
      requestContext.current = null;

      worker.dispose();

      if (workerRef.current === worker) {
        workerRef.current = null;
      }

      resetAIAim(aimRef.current);
      clearPendingPrediction();
    };
  }, [invalidate, aimRef]);

  // --------------------------------------------------
  // REQUEST CONTROL
  // --------------------------------------------------

  function cancelPlanning() {
    requestId.current++;
    requestContext.current = null;

    workerRef.current?.cancel();
  }

  function resetController(aim) {
    if (phase.current === "planning") {
      cancelPlanning();
    }

    submitted.current = false;
    sawActiveShot.current = false;

    phase.current = "idle";

    chargeTime.current = 0;
    plannedPull.current = 0;

    stuckTime.current = 0;
    movingTime.current = 0;
    retryIn.current = 0;

    requestContext.current = null;

    resetAIAim(aim);
    clearPendingPrediction();
  }

  function isRequestValid(id, expectedPhase) {
    if (
      id !== requestId.current ||
      phase.current !== expectedPhase
    ) {
      return false;
    }

    const game = useGameStore.getState();
    const context = requestContext.current;

    if (
      !context ||
      !isAITurn(game) ||
      game.stats.shotActive ||
      ballsAreMoving()
    ) {
      return false;
    }

    // Reject results calculated for a different
    // turn, difficulty or ball-in-hand state.
    return (
      game.currentPlayer === context.player &&
      game.difficulty === context.difficulty &&
      game.ballInHand === context.ballInHand &&
      game.playerGroups.ai === context.group &&
      game.pottedIds === context.pottedIds
    );
  }

  function beginRequest(game) {
    const id = ++requestId.current;

    phase.current = "planning";

    requestContext.current = {
      player: game.currentPlayer,
      difficulty: game.difficulty,
      ballInHand: game.ballInHand,
      group: game.playerGroups.ai,
      pottedIds: game.pottedIds,
    };

    return id;
  }

  function failRequest(id, error, label) {
    if (id !== requestId.current) return;

    if (
      error?.name !== "AbortError"
    ) {
      console.error(
        `[AI] ${label} failed:`,
        error
      );
    }

    requestContext.current = null;
    phase.current = "idle";
    retryIn.current = RETRY_COOLDOWN;

    invalidate();
  }

  // --------------------------------------------------
  // REQUEST PLACEMENT
  // --------------------------------------------------

  function requestPlacement(game) {
    const worker = workerRef.current;

    if (!worker) return;

    const balls = snapshotBalls(
      ballQuery.entities
    );

    const cue = snapshotBall(cueBall);

    const spots = generatePlacementSpots(
      cue,
      balls
    );

    const {
      group,
      isEightBallLegal,
    } = getGroupState(game);

    const id = beginRequest(game);

    worker
      .request("placement", {
        cueBall: cue,
        balls,
        spots,
        playerGroup: group,
        isEightBallLegal,
        level: game.difficulty,
      })
      .then((ranked) => {
        if (
          !isRequestValid(id, "planning")
        ) {
          return;
        }

        const currentGame =
          useGameStore.getState();

        if (!currentGame.ballInHand) {
          phase.current = "idle";
          requestContext.current = null;
          invalidate();
          return;
        }

        const candidates = [
          ...(Array.isArray(ranked)
            ? ranked.slice(
                0,
                MAX_PLACEMENT_CHOICES
              )
            : []),
          ...FALLBACK_SPOTS,
        ];

        if (!candidates.length) {
          phase.current = "idle";
          requestContext.current = null;
          retryIn.current = RETRY_COOLDOWN;
          invalidate();
          return;
        }

        const aim = aimRef.current;

        if (!aim) return;

        const destination = candidates[0];

        aim.handX = cueBall.x;
        aim.handZ = cueBall.z;
        aim.handLift = 0;

        aim.handPlacement = {
          fromX: cueBall.x,
          fromZ: cueBall.z,

          toX: destination.x,
          toZ: destination.z,

          spots: candidates,

          elapsed: 0,
          duration: PLACE_DURATION,
        };

        requestContext.current = null;
        phase.current = "placing";

        invalidate();
      })
      .catch((error) => {
        failRequest(
          id,
          error,
          "Placement"
        );
      });
  }

  // --------------------------------------------------
  // REQUEST SHOT
  // --------------------------------------------------

  function requestShot(game) {
    const worker = workerRef.current;

    if (!worker) return;

    const balls = snapshotBalls(
      ballQuery.entities
    );

    const cue = snapshotBall(cueBall);

    const {
      group,
      isEightBallLegal,
    } = getGroupState(game);

    const id = beginRequest(game);

    worker
      .request("plan", {
        cueBall: cue,
        balls,
        playerGroup: group,
        isEightBallLegal,
        level: game.difficulty,
      })
      .then((shot) => {
        if (
          !isRequestValid(id, "planning")
        ) {
          return;
        }

        if (
          useGameStore.getState().ballInHand
        ) {
          requestContext.current = null;
          phase.current = "idle";
          invalidate();
          return;
        }

        if (!validShot(shot)) {
          console.warn(
            "[AI] No valid shot returned"
          );

          requestContext.current = null;
          phase.current = "idle";
          retryIn.current = RETRY_COOLDOWN;

          invalidate();
          return;
        }

        function startCharging() {
          if (
            !isRequestValid(
              id,
              "planning"
            )
          ) {
            return;
          }

          const aim = aimRef.current;

          if (!aim) return;

          applyAIShot(
            aim,
            cueBall,
            shot
          );

          plannedPull.current = Math.min(
            MAX_PULL,
            Math.max(
              MIN_PULL,
              (shot.power / MAX_POWER) *
                MAX_PULL
            )
          );

          chargeTime.current = 0;
          movingTime.current = 0;

          requestContext.current = null;
          phase.current = "charging";

          invalidate();
        }

        // Debug prediction is optional.
        // Production AI skips this extra
        // full physics simulation.
        if (!DEBUG_PREDICTIONS) {
          startCharging();
          return;
        }

        worker
          .request("predict", {
            balls,
            shot,
          })
          .then((prediction) => {
            if (
              !isRequestValid(
                id,
                "planning"
              )
            ) {
              return;
            }

            if (prediction) {
              setPendingPrediction(
                prediction
              );
            } else {
              clearPendingPrediction();
            }

            startCharging();
          })
          .catch((error) => {
            if (
              id !== requestId.current
            ) {
              return;
            }

            if (
              error?.name !== "AbortError"
            ) {
              console.warn(
                "[AI] Prediction failed:",
                error
              );
            }

            clearPendingPrediction();
            startCharging();
          });
      })
      .catch((error) => {
        failRequest(
          id,
          error,
          "Planning"
        );
      });
  }

  // --------------------------------------------------
  // FRAME LOOP
  // --------------------------------------------------

  useFrame((_, rawDt) => {
    const dt = Math.min(
      Math.max(0, rawDt),
      0.1
    );

    const game = useGameStore.getState();
    const aim = aimRef.current;

    if (!aim) return;

    // ----------------------------------------------
    // NOT AI TURN
    // ----------------------------------------------

    if (!isAITurn(game)) {
      if (
        phase.current !== "idle" ||
        aim.aiControlled ||
        aim.handPlacement
      ) {
        resetController(aim);
      }

      return;
    }

    // ----------------------------------------------
    // SHOT ACTIVE
    // ----------------------------------------------

    if (game.stats.shotActive) {
      if (
        phase.current === "planning"
      ) {
        cancelPlanning();
      }

      sawActiveShot.current = true;
      stuckTime.current = 0;

      phase.current = "waiting";

      // Live physics handles invalidation.
      return;
    }

    // ----------------------------------------------
    // PREVIOUS SHOT FINISHED
    // ----------------------------------------------

    if (sawActiveShot.current) {
      sawActiveShot.current = false;
      submitted.current = false;

      stuckTime.current = 0;
      movingTime.current = 0;

      phase.current = "idle";

      resetAIAim(aim);
    }

    // ----------------------------------------------
    // WORKER PLANNING
    // ----------------------------------------------

    if (phase.current === "planning") {
      // Do not continuously invalidate.
      // Worker completion wakes the canvas.
      return;
    }

    // ----------------------------------------------
    // BALL-IN-HAND ANIMATION
    // ----------------------------------------------

    if (phase.current === "placing") {
      const placement =
        aim.handPlacement;

      if (!placement) {
        phase.current = "idle";
        invalidate();
        return;
      }

      placement.elapsed += dt;

      const progress = Math.min(
        1,
        placement.elapsed /
          placement.duration
      );

      const eased =
        progress *
        progress *
        (3 - 2 * progress);

      aim.handX =
        placement.fromX +
        (placement.toX -
          placement.fromX) *
          eased;

      aim.handZ =
        placement.fromZ +
        (placement.toZ -
          placement.fromZ) *
          eased;

      aim.handLift =
        Math.sin(
          progress * Math.PI
        ) * 0.12;

      if (progress >= 1) {
        const placed = tryPlaceCueBall(
          cueBall,
          placement.spots,
          ballQuery.entities
        );

        aim.handLift = 0;
        aim.handPlacement = null;

        phase.current = "idle";

        if (placed) {
          useGameStore.setState({
            ballInHand: false,
          });
        } else {
          console.warn(
            "[AI] Cue-ball placement failed"
          );

          retryIn.current =
            RETRY_COOLDOWN;
        }
      }

      invalidate();
      return;
    }

    // ----------------------------------------------
    // CHARGING ANIMATION
    // ----------------------------------------------

    if (phase.current === "charging") {
      chargeTime.current += dt;

      const progress = Math.min(
        1,
        chargeTime.current /
          AI_CHARGE_DURATION
      );

      const remaining = 1 - progress;

      const eased =
        1 - remaining * remaining;

      aim.pullBack =
        plannedPull.current * eased;

      aim.power =
        (aim.pullBack / MAX_PULL) *
        MAX_POWER;

      if (progress >= 1) {
        aim.pendingShot = {
          cos: aim.lockedCos,
          sin: aim.lockedSin,

          power: aim.aiShotPower,

          player: "ai",

          shotType: aim.aiShotType,
          targetId: aim.aiTargetId,
        };

        aim.shotX = cueBall.x;
        aim.shotZ = cueBall.z;

        aim.shotPullBack =
          plannedPull.current;

        aim.charging = false;

        aim.swing = 2;
        aim.swingT = 0;

        aim.power = 0;
        aim.pullBack = 0;

        phase.current = "waiting";

        submitted.current = true;
        stuckTime.current = 0;
      }

      invalidate();
      return;
    }

    // ----------------------------------------------
    // WAIT FOR SHOT TO START
    // ----------------------------------------------

    if (
      submitted.current ||
      phase.current === "waiting" ||
      aim.pendingShot
    ) {
      stuckTime.current += dt;

      if (
        stuckTime.current >
        SHOT_START_TIMEOUT
      ) {
        console.warn(
          "[AI] Shot never started, resetting"
        );

        submitted.current = false;
        stuckTime.current = 0;

        phase.current = "idle";

        aim.aiControlled = true;
        resetAIAim(aim);

        clearPendingPrediction();
      }

      // Watchdog requires further frames.
      invalidate();
      return;
    }

    stuckTime.current = 0;

    // ----------------------------------------------
    // RETRY COOLDOWN
    // ----------------------------------------------

    if (retryIn.current > 0) {
      retryIn.current = Math.max(
        0,
        retryIn.current - dt
      );

      invalidate();
      return;
    }

    // ----------------------------------------------
    // WAIT FOR BALLS TO SETTLE
    // ----------------------------------------------

    if (ballsAreMoving()) {
      movingTime.current += dt;

      if (
        movingTime.current <
        MAX_SETTLE_WAIT
      ) {
        invalidate();
        return;
      }

      console.warn(
        "[AI] Waiting for physics to settle"
      );

      movingTime.current = 0;
      retryIn.current =
        RETRY_COOLDOWN;

      invalidate();
      return;
    }

    movingTime.current = 0;

    // ----------------------------------------------
    // BALL-IN-HAND
    // ----------------------------------------------

    if (game.ballInHand) {
      requestPlacement(game);
      return;
    }

    // ----------------------------------------------
    // PLAN NEXT SHOT
    // ----------------------------------------------

    requestShot(game);
  }, -2);

  return null;
}
