// src/ai/ShotSimulation.js

import { BALL_R } from "../ecs/constants/table.js";
import {
    MIN_X,
    MAX_X,
    MIN_Z,
    MAX_Z,
} from "../ecs/constants/tableBounds.js";

const DIAMETER = BALL_R * 2;
const DIAMETER_SQ = DIAMETER * DIAMETER;

export function simulateShot({
    balls,
    shot,
    physics,
    shotSpeed,
    findCapturePocket,
    fixedDt = 1 / 120,
    maxSteps = 1800,
    maxSubsteps = 8,
}) {
    if (
        !Array.isArray(balls) ||
        !shot ||
        !physics ||
        typeof shotSpeed !== "function" ||
        typeof findCapturePocket !== "function" ||
        !Number.isFinite(fixedDt) ||
        fixedDt <= 0
    ) {
        return null;
    }

    const simulatedBalls = balls
        .filter(
            (ball) =>
                !ball.pocketed &&
                !ball.falling &&
                !ball.scratched
        )
        .map((ball) => ({
            id: ball.id,
            x: ball.x,
            z: ball.z,
            vx: 0,
            vz: 0,
            cueBall: !!ball.cueBall,
            pocketed: false,
            active: !!ball.cueBall,
        }));

    const cue = simulatedBalls.find((ball) => ball.cueBall);

    if (!cue) return null;

    const directionLength = Math.hypot(
        shot.cos,
        shot.sin
    );

    if (
        !Number.isFinite(directionLength) ||
        directionLength < 1e-8
    ) {
        return null;
    }

    const speed = shotSpeed(shot.power);

    if (!Number.isFinite(speed) || speed <= 0) {
        return null;
    }

    cue.vx = (shot.cos / directionLength) * speed;
    cue.vz = (shot.sin / directionLength) * speed;

    const result = {
        balls: simulatedBalls,
        pottedIds: [],
        firstContactId: null,
        railAfterContact: false,
        cueScratch: false,
        cuePosition: null,
        steps: 0,
        duration: 0,
        settled: false,
    };

    for (let step = 0; step < maxSteps; step++) {
        const movingBalls = simulatedBalls.filter(
            (ball) => ball.active && !ball.pocketed
        );

        if (movingBalls.length === 0) {
            result.settled = true;
            break;
        }

        let speedSq = 0;

        for (const ball of movingBalls) {
            speedSq = Math.max(
                speedSq,
                ball.vx * ball.vx + ball.vz * ball.vz
            );
        }

        const substeps = Math.min(
            maxSubsteps,
            Math.max(
                1,
                Math.ceil(
                    Math.sqrt(speedSq) *
                    fixedDt /
                    (BALL_R * 0.5)
                )
            )
        );

        const dt = fixedDt / substeps;

        for (
            let substep = 0;
            substep < substeps;
            substep++
        ) {
            // Match physicsSystem().
            integrate(
                simulatedBalls,
                dt,
                physics,
                findCapturePocket,
                result
            );

            // Match the first detectPockets().
            detectPocketCaptures(
                simulatedBalls,
                findCapturePocket,
                result
            );

            // Match collisionSystem().
            resolveBallCollisions(
                simulatedBalls,
                physics,
                result
            );

            // Match the second detectPockets().
            detectPocketCaptures(
                simulatedBalls,
                findCapturePocket,
                result
            );

            // Match the additional cushion resolution in step().
            resolveCushions(
                simulatedBalls,
                physics,
                findCapturePocket,
                result
            );
        }

        // Match frictionSystem(), once per fixed step.
        applyFriction(
            simulatedBalls,
            physics,
            fixedDt
        );

        result.steps = step + 1;
        result.duration = result.steps * fixedDt;
    }

    result.balls = simulatedBalls.map((ball) => ({
        ...ball,
    }));

    const finalCue = result.balls.find(
        (ball) => ball.cueBall
    );

    result.cuePosition = finalCue
        ? {
            x: finalCue.x,
            z: finalCue.z,
        }
        : null;

    result.pottedIds = [
        ...new Set(result.pottedIds),
    ];

    return result;
}

function integrate(
    balls,
    dt,
    physics,
    findCapturePocket,
    result
) {
    for (const ball of balls) {
        if (!ball.active || ball.pocketed) continue;

        ball.x += ball.vx * dt;
        ball.z += ball.vz * dt;

        resolveSingleCushion(
            ball,
            physics,
            findCapturePocket,
            result
        );
    }
}

function resolveSingleCushion(
    ball,
    physics,
    findCapturePocket,
    result
) {
    if (
        ball.pocketed ||
        findCapturePocket(ball.x, ball.z)
    ) {
        return;
    }

    if (ball.x < MIN_X) {
        bounce(ball, "x", physics, result, MIN_X, true);
    } else if (ball.x > MAX_X) {
        bounce(ball, "x", physics, result, MAX_X, false);
    }

    if (ball.z < MIN_Z) {
        bounce(ball, "z", physics, result, MIN_Z, true);
    } else if (ball.z > MAX_Z) {
        bounce(ball, "z", physics, result, MAX_Z, false);
    }
}

function detectPocketCaptures(
    balls,
    findCapturePocket,
    result
) {
    for (const ball of balls) {
        if (ball.pocketed) continue;

        const pocket = findCapturePocket(
            ball.x,
            ball.z
        );

        if (!pocket) continue;

        ball.pocketed = true;
        ball.active = false;
        ball.vx = 0;
        ball.vz = 0;

        result.pottedIds.push(ball.id);

        if (ball.cueBall) {
            result.cueScratch = true;
        }
    }
}

function resolveBallCollisions(
    balls,
    physics,
    result
) {
    for (let i = 0; i < balls.length - 1; i++) {
        const a = balls[i];

        if (a.pocketed) continue;

        for (let j = i + 1; j < balls.length; j++) {
            const b = balls[j];

            if (
                b.pocketed ||
                (!a.active && !b.active)
            ) {
                continue;
            }

            const dx = b.x - a.x;
            const dz = b.z - a.z;

            // Match the live engine's broad-phase checks.
            if (
                Math.abs(dx) >= DIAMETER ||
                Math.abs(dz) >= DIAMETER
            ) {
                continue;
            }

            const distanceSq = dx * dx + dz * dz;

            if (distanceSq >= DIAMETER_SQ) {
                continue;
            }

            let nx = 1;
            let nz = 0;
            let distance = 0;

            if (distanceSq > 1e-12) {
                distance = Math.sqrt(distanceSq);
                nx = dx / distance;
                nz = dz / distance;
            } else {
                // Match the live engine's coincident-ball fallback.
                const rvx = a.vx - b.vx;
                const rvz = a.vz - b.vz;
                const relativeSpeed = Math.hypot(rvx, rvz);

                if (relativeSpeed > 1e-8) {
                    nx = rvx / relativeSpeed;
                    nz = rvz / relativeSpeed;
                }
            }

            // Match equal overlap correction.
            const correction =
                (DIAMETER - distance) * 0.5;

            a.x -= nx * correction;
            a.z -= nz * correction;

            b.x += nx * correction;
            b.z += nz * correction;

            const normalSpeed =
                (b.vx - a.vx) * nx +
                (b.vz - a.vz) * nz;

            if (normalSpeed >= 0) continue;

            // Record first cue-ball contact.
            if (
                a.cueBall &&
                !b.cueBall &&
                result.firstContactId == null
            ) {
                result.firstContactId = b.id;
            } else if (
                b.cueBall &&
                !a.cueBall &&
                result.firstContactId == null
            ) {
                result.firstContactId = a.id;
            }

            const impulse =
                -((1 + physics.ballE) * normalSpeed) / 2;

            a.vx -= impulse * nx;
            a.vz -= impulse * nz;

            b.vx += impulse * nx;
            b.vz += impulse * nz;

            // Match activeBall(a) and activeBall(b).
            a.active = true;
            b.active = true;
        }
    }
}

function resolveCushions(
    balls,
    physics,
    findCapturePocket,
    result
) {
    for (const ball of balls) {
        if (
            !ball.active ||
            ball.pocketed ||
            findCapturePocket(ball.x, ball.z)
        ) {
            continue;
        }

        if (ball.x < MIN_X) {
            bounce(ball, "x", physics, result, MIN_X, true);
        } else if (ball.x > MAX_X) {
            bounce(ball, "x", physics, result, MAX_X, false);
        }

        if (ball.z < MIN_Z) {
            bounce(ball, "z", physics, result, MIN_Z, true);
        } else if (ball.z > MAX_Z) {
            bounce(ball, "z", physics, result, MAX_Z, false);
        }
    }
}

function bounce(
    ball,
    axis,
    physics,
    result,
    limit,
    minimum
) {
    const normalKey = axis === "x" ? "vx" : "vz";
    const tangentKey = axis === "x" ? "vz" : "vx";

    if (
        minimum
            ? ball[normalKey] >= 0
            : ball[normalKey] <= 0
    ) {
        return;
    }

    ball[axis] = limit;

    const speed = Math.abs(ball[normalKey]);

    const restitution = Math.max(
        Math.min(
            physics.cushionMinE,
            physics.cushionE
        ),
        physics.cushionE -
        physics.cushionSpeedLoss * speed
    );

    ball[normalKey] *= -restitution;

    const tangent = ball[tangentKey];

    ball[tangentKey] =
        Math.sign(tangent) *
        Math.max(
            0,
            Math.abs(tangent) -
            physics.cushionFriction *
            (1 + restitution) *
            speed
        );

    if (result.firstContactId != null) {
        result.railAfterContact = true;
    }
}

function applyFriction(
    balls,
    physics,
    fixedDt
) {
    const loss = physics.rollDecel * fixedDt;

    for (const ball of balls) {
        if (!ball.active || ball.pocketed) continue;

        const speed = Math.hypot(
            ball.vx,
            ball.vz
        );

        const next =
            speed * physics.damping - loss;

        if (
            speed === 0 ||
            next <= 0 ||
            next * next <= physics.sleepSq
        ) {
            ball.vx = 0;
            ball.vz = 0;
            ball.active = false;
        } else {
            const scale = next / speed;

            ball.vx *= scale;
            ball.vz *= scale;
        }
    }
}
