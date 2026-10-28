// src/ai/ShotPlanner.js

import { POCKETS } from "../ecs/constants/pockets.js";
import { BALL_R } from "../ecs/constants/table.js";

import {
  MIN_X,
  MAX_X,
  MIN_Z,
  MAX_Z,
} from "../ecs/constants/tableBounds.js";

import { calculateShot } from "./ShotCalculator.js";
import { rankShots } from "./ShotEvaluator.js";
import {
  getDifficulty,
  randomError,
  clamp,
} from "./difficulty.js";

import { simulateShot } from "./ShotSimulation.js";
import { aiPhysics } from "./aiPhysics.js";

const DIAMETER = BALL_R * 2;
const RAIL_MARGIN = BALL_R * 1.1;

// --------------------------------------------------
// LEGAL TARGETS
// --------------------------------------------------

function getLegalTargets(balls, playerGroup, isEightBallLegal) {
  const available = balls.filter((ball) =>
    !ball.cueBall &&
    ball.id !== 0 &&
    !ball.pocketed &&
    !ball.falling &&
    !ball.scratched
  );

  if (isEightBallLegal) {
    return available.filter((ball) => ball.id === 8);
  }

  return available.filter((ball) => {
    if (ball.id === 8) return false;
    if (!playerGroup) return true;

    const group = ball.id <= 7 ? "solids" : "stripes";
    return group === playerGroup;
  });
}

// --------------------------------------------------
// BANK POCKETS
// --------------------------------------------------

function getBankPockets() {
  const banks = [];

  for (const pocket of POCKETS) {
    banks.push({
      ...pocket,
      x: 2 * MIN_X - pocket.x,
      bank: "left",
    });

    banks.push({
      ...pocket,
      x: 2 * MAX_X - pocket.x,
      bank: "right",
    });

    banks.push({
      ...pocket,
      z: 2 * MIN_Z - pocket.z,
      bank: "top",
    });

    banks.push({
      ...pocket,
      z: 2 * MAX_Z - pocket.z,
      bank: "bottom",
    });
  }

  return banks;
}

// --------------------------------------------------
// SHOT GENERATION
// --------------------------------------------------

function generateDirectShots(cueBall, targets, balls) {
  const candidates = [];

  for (const target of targets) {
    for (const pocket of POCKETS) {
      const shot = calculateShot(cueBall, target, pocket, balls);

      if (shot) {
        candidates.push({
          ...shot,
          type: "direct",
        });
      }
    }
  }

  return candidates;
}

function generateBankShots(cueBall, targets, balls) {
  const candidates = [];

  for (const target of targets) {
    for (const pocket of getBankPockets()) {
      const shot = calculateShot(cueBall, target, pocket, balls);

      if (!shot) continue;

      candidates.push({
        ...shot,
        type: "bank",
        bank: pocket.bank,
      });
    }
  }

  return candidates;
}

function generateSafetyShots(cueBall, targets, balls) {
  const candidates = [];

  for (const target of targets) {
    const destinations = [
      { x: target.x, z: MIN_Z + RAIL_MARGIN },
      { x: target.x, z: MAX_Z - RAIL_MARGIN },
      { x: MIN_X + RAIL_MARGIN, z: target.z },
      { x: MAX_X - RAIL_MARGIN, z: target.z },
    ];

    for (let i = 0; i < destinations.length; i++) {
      const shot = calculateShot(
        cueBall,
        target,
        {
          ...destinations[i],
          id: `safety-${target.id}-${i}`,
        },
        balls
      );

      if (!shot) continue;

      candidates.push({
        ...shot,
        type: "safety",
      });
    }
  }

  return candidates;
}

// --------------------------------------------------
// SHOT ERROR
// --------------------------------------------------

function addShotError(shot, difficulty) {
  const angleError = randomError(difficulty.aimError);
  const powerError = randomError(difficulty.powerError);

  const angle =
    Math.atan2(shot.direction.z, shot.direction.x) + angleError;

  return {
    targetId: shot.target.id,
    pocketId: shot.type === "safety" ? null : shot.pocket?.id ?? null,

    cos: Math.cos(angle),
    sin: Math.sin(angle),

    power: clamp(
      shot.power * (1 + powerError),
      0.5,
      18
    ),

    score: shot.score,
    ghost: shot.ghost,

    type: shot.type,
    bank: shot.bank || null,
  };
}

// --------------------------------------------------
// SIMULATION
// --------------------------------------------------

function runSimulation(balls, shot) {
  return simulateShot({
    balls,
    shot: {
      cos: shot.direction.x,
      sin: shot.direction.z,
      power: shot.power,
    },
    ...aiPhysics,
  });
}

// --------------------------------------------------
// POSITIONAL EVALUATION
// --------------------------------------------------

function evaluateCuePosition(simulation, legalTargets, level) {
  const cueBall = simulation.balls.find((ball) => ball.cueBall);

  if (!cueBall || simulation.cueScratch) return -1000;

  const potted = new Set(simulation.pottedIds);

  const remainingTargets = legalTargets
    .filter((target) => !potted.has(target.id))
    .map((target) =>
      simulation.balls.find((ball) => ball.id === target.id)
    )
    .filter(Boolean);

  if (!remainingTargets.length) return 0;

  const nextShots = generateDirectShots(
    cueBall,
    remainingTargets,
    simulation.balls
  );

  const ranked = rankShots(nextShots, level);

  if (!ranked.length) return -40;

  return clamp(ranked[0].score * 0.25, -40, 60);
}

// --------------------------------------------------
// FOLLOW-UP EVALUATION
// --------------------------------------------------

function evaluateFollowUp(simulation, legalTargets, difficulty, level) {
  const cueBall = simulation.balls.find((ball) => ball.cueBall);

  if (!cueBall || simulation.cueScratch) return -1000;

  const potted = new Set(simulation.pottedIds);

  const remainingTargets = legalTargets
    .filter((target) => !potted.has(target.id))
    .map((target) =>
      simulation.balls.find((ball) => ball.id === target.id)
    )
    .filter(Boolean);

  if (!remainingTargets.length) return 0;

  const followUpShots = generateDirectShots(
    cueBall,
    remainingTargets,
    simulation.balls
  );

  const ranked = rankShots(followUpShots, level);

  if (!ranked.length) return -50;

  const followUpLimit = difficulty.lookahead >= 2 ? 3 : 1;
  const shortlist = ranked.slice(0, followUpLimit);

  let bestScore = -50;

  for (const shot of shortlist) {
    const nextSimulation = runSimulation(
      simulation.balls,
      shot
    );

    if (!nextSimulation || nextSimulation.cueScratch) continue;

    let score = 0;

    if (nextSimulation.pottedIds.includes(shot.target.id)) {
      score += 100;
    }

    if (
      nextSimulation.firstContactId != null &&
      nextSimulation.firstContactId !== shot.target.id
    ) {
      score -= 40;
    }

    score += clamp(shot.score * 0.1, -10, 20);

    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

// --------------------------------------------------
// SAFETY EVALUATION
// --------------------------------------------------

function distanceToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;

  const lengthSq = dx * dx + dz * dz;

  if (lengthSq === 0) {
    return Math.hypot(px - ax, pz - az);
  }

  const t = clamp(
    ((px - ax) * dx + (pz - az) * dz) / lengthSq,
    0,
    1
  );

  const closestX = ax + t * dx;
  const closestZ = az + t * dz;

  return Math.hypot(px - closestX, pz - closestZ);
}

function getOpponentTargets(balls, playerGroup) {
  return balls.filter((ball) => {
    if (
      ball.cueBall ||
      ball.id === 0 ||
      ball.id === 8 ||
      ball.pocketed ||
      ball.falling ||
      ball.scratched
    ) {
      return false;
    }

    if (!playerGroup) return true;

    const group = ball.id <= 7 ? "solids" : "stripes";

    return group !== playerGroup;
  });
}

function countOpponentOpenShots(balls, opponentTargets) {
  let openShots = 0;

  for (const target of opponentTargets) {
    for (const pocket of POCKETS) {
      const blocked = balls.some((obstacle) => {
        if (
          obstacle.id === target.id ||
          obstacle.pocketed
        ) {
          return false;
        }

        return (
          distanceToSegment(
            obstacle.x,
            obstacle.z,
            target.x,
            target.z,
            pocket.x,
            pocket.z
          ) < DIAMETER * 0.95
        );
      });

      if (!blocked) openShots++;
    }
  }

  return openShots;
}

function evaluateSafetyOutcome(
  simulation,
  shot,
  difficulty
) {
  if (
    simulation.cueScratch ||
    simulation.firstContactId !== shot.target.id
  ) {
    return -1000;
  }

  if (
    !simulation.railAfterContact &&
    simulation.pottedIds.length === 0
  ) {
    return -500;
  }

  const opponentTargets = getOpponentTargets(
    simulation.balls,
    shot.playerGroup
  );

  if (!opponentTargets.length) return 0;

  const openShots = countOpponentOpenShots(
    simulation.balls,
    opponentTargets
  );

  return -openShots * 20 * difficulty.safetyWeight;
}

// --------------------------------------------------
// CANDIDATE EVALUATION
// --------------------------------------------------

function chooseSimulatedShot(
  candidates,
  balls,
  legalTargets,
  difficulty,
  level,
  playerGroup
) {
  if (!candidates.length) return null;

  const evaluated = candidates.map((shot) => {
    const simulation = runSimulation(balls, shot);

    if (!simulation) {
      return { shot, score: -Infinity };
    }

    let score = shot.score;

    if (simulation.cueScratch) {
      score -= 1000;
    }

    const pottedTarget = simulation.pottedIds.includes(
      shot.target.id
    );

    if (pottedTarget) {
      score += 1000;

      if (difficulty.lookahead >= 1) {
        score += evaluateFollowUp(
          simulation,
          legalTargets,
          difficulty,
          level
        ) * difficulty.positionalSkill;
      }
    } else if (shot.type !== "safety") {
      score -= 300;
    }

    // A small positional bonus also rewards useful cue-ball
    // positions after shots that do not pot a ball.
    if (
      !simulation.cueScratch &&
      difficulty.lookahead >= 1 &&
      shot.type !== "safety"
    ) {
      score += evaluateCuePosition(
        simulation,
        legalTargets,
        level
      ) * difficulty.positionalSkill;
    }

    if (shot.type === "safety") {
      score += evaluateSafetyOutcome(
        simulation,
        {
          ...shot,
          playerGroup,
        },
        difficulty
      );
    }

    return {
      shot,
      score,
      simulation,
    };
  });

  evaluated.sort((a, b) => b.score - a.score);

  return evaluated[0]?.score === -Infinity
    ? null
    : evaluated[0]?.shot ?? null;
}

// --------------------------------------------------
// MAIN PLANNER
// --------------------------------------------------

export function planShot({
  cueBall,
  balls,
  playerGroup = null,
  isEightBallLegal = false,
  level = "medium",
}) {
  if (!cueBall || cueBall.pocketed || cueBall.falling) {
    return null;
  }

  const difficulty = getDifficulty(level);

  const targets = getLegalTargets(
    balls,
    playerGroup,
    isEightBallLegal
  );

  if (!targets.length) return null;

  const directShots = generateDirectShots(
    cueBall,
    targets,
    balls
  );

  const bankShots = generateBankShots(
    cueBall,
    targets,
    balls
  );

  const safetyShots = generateSafetyShots(
    cueBall,
    targets,
    balls
  );

  const direct = rankShots(directShots, level);

  const banks = rankShots(bankShots, level).map((shot) => ({
    ...shot,
    score: shot.score - 14,
  }));

  const safeties = rankShots(safetyShots, level).map((shot) => ({
    ...shot,
    score: shot.score - 5,
  }));

  // Easy and Medium only consider safety when there are no
  // direct or bank opportunities. Hard considers all three.
  let candidates;

  if (difficulty.lookahead >= 2) {
    candidates = [
      ...direct.slice(0, difficulty.maxCandidates),
      ...banks.slice(0, difficulty.maxCandidates),
      ...safeties.slice(0, difficulty.maxCandidates),
    ];
  } else if (direct.length) {
    candidates = direct.slice(0, difficulty.maxCandidates);
  } else if (banks.length) {
    candidates = banks.slice(0, difficulty.maxCandidates);
  } else {
    candidates = safeties.slice(0, difficulty.maxCandidates);
  }

  if (!candidates.length) return null;

  // Apply selection noise before simulation to preserve
  // difficulty differences when candidates have similar scores.
  const noisyCandidates = candidates
    .map((shot) => ({
      ...shot,
      score: shot.score + randomError(difficulty.selectionNoise),
    }))
    .sort((a, b) => b.score - a.score);

  const chosen = chooseSimulatedShot(
    noisyCandidates,
    balls,
    targets,
    difficulty,
    level,
    playerGroup
  );

  return chosen
    ? addShotError(chosen, difficulty)
    : null;
}
