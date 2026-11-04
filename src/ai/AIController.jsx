// src/ai/AIController.jsx

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import useGameStore from "../store/useGameStore.js";
import { ballQuery, ballsAreMoving } from "../ecs/world.js";
import { MIN_X, MAX_X, MIN_Z, MAX_Z } from "../ecs/constants/tableBounds.js";
import {
    BALL_R,
    MAX_POWER,
    MAX_PULL,
    MIN_PULL,
} from "../ecs/constants/table.js";
import { POCKETS } from "../ecs/constants/pockets.js";
import { placeCueBall } from "../ecs/AimController.jsx";
import { planShot, rankCueSpots } from "./ShotPlanner.js";
import { aiPhysics } from "./aiPhysics.js";
import { simulateShot } from "./ShotSimulation.js";
import {
    setPendingPrediction,
    clearPendingPrediction,
} from "./AIPhysicsDebugger.js";

const GROUP_BALLS = {
    solids: [1, 2, 3, 4, 5, 6, 7],
    stripes: [9, 10, 11, 12, 13, 14, 15],
};

// --------------------------------------------------
// TUNING
// --------------------------------------------------

const AI_CHARGE_DURATION = 0.55;
const PLACE_DURATION = 0.65;

// Seconds after releasing the cue for the engine to report an active shot.
const SHOT_START_TIMEOUT = 3;

// Seconds to wait for balls to settle before shooting anyway.
const MAX_SETTLE_WAIT = 10;

// Seconds to wait before retrying after a failed plan or placement.
const RETRY_COOLDOWN = 0.4;

// Only the debug comparison needs the extra prediction simulation.
const DEBUG_PREDICTIONS = Boolean(import.meta.env?.DEV);

// --------------------------------------------------
// BALL-IN-HAND PLACEMENT
// --------------------------------------------------

const GRID_MARGIN = 0.12;
const GRID_STEP = 0.2;
const SPOT_CLEARANCE = BALL_R * 2.4;
const POCKET_CLEARANCE = BALL_R * 3.5;
const MAX_PLACEMENT_CHOICES = 6;
const RANDOM_PLACEMENT_TRIES = 24;

const FALLBACK_SPOTS = [
    { x: MIN_X + (MAX_X - MIN_X) * 0.25, z: 0 },
    { x: 0, z: 0 },
];

function getGroupState(game) {
    const group = game.playerGroups.ai;

    const remaining = group
        ? GROUP_BALLS[group].filter((id) => !game.pottedIds.has(id))
        : [];

    return {
        group,
        isEightBallLegal: Boolean(group && remaining.length === 0),
    };
}

function isSpotClear(x, z, balls, cueId) {
    for (const ball of balls) {
        if (
            ball.id === cueId ||
            ball.pocketed ||
            ball.falling ||
            ball.scratched
        ) {
            continue;
        }

        if (Math.hypot(ball.x - x, ball.z - z) < SPOT_CLEARANCE) {
            return false;
        }
    }

    for (const pocket of POCKETS) {
        if (Math.hypot(pocket.x - x, pocket.z - z) < POCKET_CLEARANCE) {
            return false;
        }
    }

    return true;
}

// Returns an ordered list of spots to try. The first is the best choice;
// the rest are fallbacks in case placeCueBall rejects it.
function getAIPlacement(cueBall, balls, game) {
    const { group, isEightBallLegal } = getGroupState(game);

    const spots = [];

    for (let z = MIN_Z + GRID_MARGIN; z <= MAX_Z - GRID_MARGIN; z += GRID_STEP) {
        for (let x = MIN_X + GRID_MARGIN; x <= MAX_X - GRID_MARGIN; x += GRID_STEP) {
            if (isSpotClear(x, z, balls, cueBall.id)) {
                spots.push({ x, z });
            }
        }
    }

    // Cheap scoring: direct-shot quality only, no physics simulation.
    const ranked = rankCueSpots({
        cueBall,
        balls,
        spots,
        playerGroup: group,
        isEightBallLegal,
        level: game.difficulty,
    }).slice(0, MAX_PLACEMENT_CHOICES);

    return [...ranked, ...FALLBACK_SPOTS];
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function tryPlaceCueBall(cueBall, spots, balls) {
    for (const spot of spots) {
        if (placeCueBall(cueBall, spot.x, spot.z)) return true;
    }

    for (let i = 0; i < RANDOM_PLACEMENT_TRIES; i++) {
        const x = randomBetween(MIN_X + GRID_MARGIN, MAX_X - GRID_MARGIN);
        const z = randomBetween(MIN_Z + GRID_MARGIN, MAX_Z - GRID_MARGIN);

        if (!isSpotClear(x, z, balls, cueBall.id)) continue;
        if (placeCueBall(cueBall, x, z)) return true;
    }

    return false;
}

// --------------------------------------------------
// AIM RESET
// --------------------------------------------------

function resetAIAim(aim) {
    if (!aim.aiControlled) return;

    aim.aiControlled = false;
    aim.charging = false;
    aim.swing = 0;
    aim.swingT = 0;
    aim.power = 0;
    aim.pullBack = 0;
    aim.pendingShot = null;
}

// --------------------------------------------------
// CONTROLLER
// --------------------------------------------------

export default function AIController({ cueBall, aimRef }) {
    const invalidate = useThree((state) => state.invalidate);

    const submitted = useRef(false);
    const sawActiveShot = useRef(false);
    const phase = useRef("idle");
    const chargeTime = useRef(0);
    const plannedPull = useRef(0);

    const stuckTime = useRef(0);
    const movingTime = useRef(0);
    const retryIn = useRef(0);

    useEffect(() => {
        const unsubscribe = useGameStore.subscribe(() => invalidate());
        return unsubscribe;
    }, [invalidate]);

    useFrame((_, rawDt) => {
        // Clamp so a long idle gap can't skip animations or trip watchdogs.
        const dt = Math.min(Math.max(0, rawDt), 0.1);

        const game = useGameStore.getState();
        const aim = aimRef.current;

        // --------------------------------------------------
        // Not the AI's turn: reset everything.
        // --------------------------------------------------
        if (
            game.screen !== "play" ||
            game.settings.solo ||
            game.currentPlayer !== "ai" ||
            game.winner
        ) {
            submitted.current = false;
            sawActiveShot.current = false;
            phase.current = "idle";
            chargeTime.current = 0;
            stuckTime.current = 0;
            movingTime.current = 0;
            retryIn.current = 0;

            resetAIAim(aim);
            clearPendingPrediction();
            return;
        }

        invalidate();

        // --------------------------------------------------
        // Wait while the AI's shot is being simulated.
        // --------------------------------------------------
        if (game.stats.shotActive) {
            sawActiveShot.current = true;
            stuckTime.current = 0;
            phase.current = "waiting";
            return;
        }

        // The AI shot has finished. It may have another turn if it potted.
        if (sawActiveShot.current) {
            sawActiveShot.current = false;
            submitted.current = false;
            stuckTime.current = 0;
            phase.current = "idle";
            resetAIAim(aim);
        }

        // --------------------------------------------------
        // Animate the hand carrying the cue ball.
        // --------------------------------------------------
        if (phase.current === "placing") {
            const placement = aim.handPlacement;

            if (!placement) {
                phase.current = "idle";
                return;
            }

            placement.elapsed += dt;

            const progress = Math.min(1, placement.elapsed / placement.duration);
            const eased = progress * progress * (3 - 2 * progress);

            aim.handX = placement.fromX + (placement.toX - placement.fromX) * eased;
            aim.handZ = placement.fromZ + (placement.toZ - placement.fromZ) * eased;
            aim.handLift = Math.sin(progress * Math.PI) * 0.12;

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
                    useGameStore.setState({ ballInHand: false });
                } else {
                    // Nothing was accepted. Wait briefly, then replan.
                    console.warn("[AI] could not place the cue ball, retrying");
                    retryIn.current = RETRY_COOLDOWN;
                }
            }

            invalidate();
            return;
        }

        // --------------------------------------------------
        // Animate the cue pulling backwards before the shot.
        // --------------------------------------------------
        if (phase.current === "charging") {
            chargeTime.current += dt;

            const progress = Math.min(1, chargeTime.current / AI_CHARGE_DURATION);
            const eased = 1 - (1 - progress) ** 2;

            aim.pullBack = plannedPull.current * eased;
            aim.power = (aim.pullBack / MAX_PULL) * MAX_POWER;

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
                aim.shotPullBack = plannedPull.current;

                aim.charging = false;
                aim.swing = 2;
                aim.swingT = 0;
                aim.power = 0;
                aim.pullBack = 0;

                phase.current = "waiting";
                submitted.current = true;
                stuckTime.current = 0;
            }

            return;
        }

        // --------------------------------------------------
        // Watchdog: a submitted shot must become active.
        // If the engine dropped it, recover instead of waiting forever.
        // --------------------------------------------------
        if (
            submitted.current ||
            phase.current === "waiting" ||
            aim.pendingShot
        ) {
            stuckTime.current += dt;

            if (stuckTime.current > SHOT_START_TIMEOUT) {
                console.warn("[AI] shot never started, resetting", {
                    pendingShot: aim.pendingShot,
                });

                stuckTime.current = 0;
                submitted.current = false;
                phase.current = "idle";
                aim.pendingShot = null;
                aim.aiControlled = true; // make sure resetAIAim clears it
                resetAIAim(aim);
            }

            return;
        }

        stuckTime.current = 0;

        // --------------------------------------------------
        // Cooldown after a failed plan or placement.
        // --------------------------------------------------
        if (retryIn.current > 0) {
            retryIn.current -= dt;
            return;
        }

        // --------------------------------------------------
        // Wait for balls to settle, but never forever.
        // --------------------------------------------------
        if (ballsAreMoving()) {
            const before = movingTime.current;
            movingTime.current += dt;

            if (movingTime.current < MAX_SETTLE_WAIT) return;

            if (before < MAX_SETTLE_WAIT) {
                console.warn("[AI] balls never settled, shooting anyway");
            }
        } else {
            movingTime.current = 0;
        }

        const balls = ballQuery.entities;

        // --------------------------------------------------
        // Ball-in-hand: choose a spot and animate the hand.
        // --------------------------------------------------
        if (game.ballInHand) {
            const spots = getAIPlacement(cueBall, balls, game);

            aim.handX = cueBall.x;
            aim.handZ = cueBall.z;
            aim.handLift = 0;

            aim.handPlacement = {
                fromX: cueBall.x,
                fromZ: cueBall.z,
                toX: spots[0].x,
                toZ: spots[0].z,
                spots,
                elapsed: 0,
                duration: PLACE_DURATION,
            };

            phase.current = "placing";
            invalidate();
            return;
        }

        // --------------------------------------------------
        // Plan the shot.
        // --------------------------------------------------
        const { group, isEightBallLegal } = getGroupState(game);

        const shot = planShot({
            cueBall,
            balls,
            playerGroup: group,
            isEightBallLegal,
            level: game.difficulty,
        });

        if (!shot) {
            // Only happens when there is nothing to hit. Don't re-run the
            // planner every frame.
            console.warn("[AI] no shot available, retrying");
            retryIn.current = RETRY_COOLDOWN;
            return;
        }

        movingTime.current = 0;

        // Record the prediction for comparison with the actual shot.
        if (DEBUG_PREDICTIONS) {
            setPendingPrediction(
                simulateShot({
                    balls,
                    shot,
                    ...aiPhysics,
                })
            );
        }

        // Point the cue in the selected shot direction.
        const angle = Math.atan2(shot.sin, shot.cos);

        aim.angle = angle;
        aim.cos = shot.cos;
        aim.sin = shot.sin;

        aim.lockedAngle = angle;
        aim.lockedCos = shot.cos;
        aim.lockedSin = shot.sin;

        // Store the AI's chosen shot.
        aim.aiShotPower = shot.power;
        aim.aiShotType = shot.type;
        aim.aiTargetId = shot.targetId;

        plannedPull.current = Math.min(
            MAX_PULL,
            Math.max(MIN_PULL, (shot.power / MAX_POWER) * MAX_PULL)
        );

        // Start the visible pullback animation.
        aim.aiControlled = true;
        aim.charging = true;
        aim.swing = 1;
        aim.swingT = 0;
        aim.pullBack = 0;
        aim.power = 0;

        aim.shotX = cueBall.x;
        aim.shotZ = cueBall.z;

        chargeTime.current = 0;
        phase.current = "charging";

        invalidate();
    }, -2);

    return null;
}