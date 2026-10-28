// src/ai/AIController.jsx


import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import useGameStore from "../store/useGameStore.js";
import { ballQuery, ballsAreMoving } from "../ecs/world.js";
import { MIN_X, MAX_X, MIN_Z, MAX_Z } from "../ecs/constants/tableBounds.js";
import { MAX_POWER, MAX_PULL, MIN_PULL } from "../ecs/constants/table.js";
import { placeCueBall } from "../ecs/AimController.jsx";
import { planShot } from "./ShotPlanner.js";
import { aiPhysics } from "./aiPhysics.js";
import { simulateShot } from "./ShotSimulation.js";
import { setPendingPrediction, clearPendingPrediction } from "./AIPhysicsDebugger.js";

const GROUP_BALLS = {
    solids: [1, 2, 3, 4, 5, 6, 7],
    stripes: [9, 10, 11, 12, 13, 14, 15],
};

const AI_CHARGE_DURATION = 0.55;

function getAIPlacement(cueBall, balls, game) {
    const group = game.playerGroups.ai;
    const potted = game.pottedIds;
    const remaining = group ? GROUP_BALLS[group].filter((id) => !potted.has(id)) : [];
    const isEightBallLegal = Boolean(group && remaining.length === 0);

    let best = null;

    for (let z = MIN_Z + 0.12; z <= MAX_Z - 0.12; z += 0.2) {
        for (let x = MIN_X + 0.12; x <= MAX_X - 0.12; x += 0.2) {
            const virtualCue = {
                ...cueBall,
                x,
                z,
                pocketed: false,
                falling: false,
                scratched: false,
            };

            const shot = planShot({
                cueBall: virtualCue,
                balls,
                playerGroup: group,
                isEightBallLegal,
                level: game.difficulty,
            });

            if (shot && (!best || shot.score > best.score)) {
                best = { x, z, score: shot.score };
            }
        }
    }

    return best || { x: 0, z: 0 };
}

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

export default function AIController({ cueBall, aimRef }) {
    const invalidate = useThree((state) => state.invalidate);

    const submitted = useRef(false);
    const sawActiveShot = useRef(false);
    const phase = useRef("idle");
    const chargeTime = useRef(0);
    const plannedPull = useRef(0);

    useEffect(() => {
        const unsubscribe = useGameStore.subscribe(() => invalidate());
        return unsubscribe;
    }, [invalidate]);

    useFrame((_, dt) => {
        const game = useGameStore.getState();
        const aim = aimRef.current;

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

            resetAIAim(aim);
            clearPendingPrediction();
            return;
        }

        invalidate();

        // Wait while the AI's shot is being simulated.
        if (game.stats.shotActive) {
            sawActiveShot.current = true;
            phase.current = "waiting";
            return;
        }

        // The AI shot has finished. It may have another turn if it potted.
        if (sawActiveShot.current) {
            sawActiveShot.current = false;
            submitted.current = false;
            phase.current = "idle";
            resetAIAim(aim);
        }

        // Animate the hand carrying the cue ball to the AI's chosen position.
        if (phase.current === "placing") {
            const placement = aim.handPlacement;

            if (!placement) {
                phase.current = "idle";
                return;
            }

            placement.elapsed += Math.max(0, dt);

            const progress = Math.min(1, placement.elapsed / placement.duration);
            const eased = progress * progress * (3 - 2 * progress);

            aim.handX = placement.fromX + (placement.toX - placement.fromX) * eased;
            aim.handZ = placement.fromZ + (placement.toZ - placement.fromZ) * eased;

            aim.handLift = Math.sin(progress * Math.PI) * 0.12;

            if (progress >= 1) {
                const placed = placeCueBall(cueBall, placement.toX, placement.toZ);

                aim.handLift = 0;
                aim.handPlacement = null;
                phase.current = "idle";

                if (placed) {
                    useGameStore.setState({ ballInHand: false });
                }
            }

            invalidate();
            return;
        }

        // Animate the cue pulling backwards before releasing the shot.
        if (phase.current === "charging") {
            chargeTime.current += Math.max(0, dt);

            const progress = Math.min(1, chargeTime.current / AI_CHARGE_DURATION);

            // Ease the stick into its pulled-back position.
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
            }

            return;
        }

        if (submitted.current || phase.current === "waiting" || ballsAreMoving() || aim.pendingShot) {
            return;
        }

        const balls = ballQuery.entities;

        // Handle ball-in-hand using the animated hand.
        if (game.ballInHand) {
            const position = getAIPlacement(cueBall, balls, game);

            aim.handX = cueBall.x;
            aim.handZ = cueBall.z;
            aim.handLift = 0;

            aim.handPlacement = {
                fromX: cueBall.x,
                fromZ: cueBall.z,
                toX: position.x,
                toZ: position.z,
                elapsed: 0,
                duration: 0.65,
            };

            phase.current = "placing";
            invalidate();
            return;
        }

        const group = game.playerGroups.ai;
        const remaining = group ? GROUP_BALLS[group].filter((id) => !game.pottedIds.has(id)) : [];
        const isEightBallLegal = Boolean(group && remaining.length === 0);

        const shot = planShot({
            cueBall,
            balls,
            playerGroup: group,
            isEightBallLegal,
            level: game.difficulty,
        });

        if (!shot) return;

        // Record the prediction for comparison with the actual shot.
        const prediction = simulateShot({
            balls,
            shot,
            ...aiPhysics,
        });

        setPendingPrediction(prediction);

        // Point the cue in the selected shot direction.
        const angle = Math.atan2(shot.sin, shot.cos);

        aim.angle = angle;
        aim.cos = shot.cos;
        aim.sin = shot.sin;

        aim.lockedAngle = angle;
        aim.lockedCos = shot.cos;
        aim.lockedSin = shot.sin;

        // Store the AI's chosen shot power.
        aim.aiShotPower = shot.power;
        aim.aiShotType = shot.type;
        aim.aiTargetId = shot.targetId;

        plannedPull.current = Math.min(MAX_PULL, Math.max(MIN_PULL, (shot.power / MAX_POWER) * MAX_PULL));

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
