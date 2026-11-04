// src/ai/ShotPlanner.js

import { POCKETS } from "../ecs/constants/pockets.js";
import { BALL_R, MAX_POWER } from "../ecs/constants/table.js";

import {
  MIN_X,
  MAX_X,
  MIN_Z,
  MAX_Z,
} from "../ecs/constants/tableBounds.js";

import { calculateShot } from "./ShotCalculator.js";
import { rankShots, evaluateShot } from "./ShotEvaluator.js";
import {
  getDifficulty,
  randomError,
  clamp,
} from "./difficulty.js";

import { simulateShot } from "./ShotSimulation.js";
import { aiPhysics } from "./aiPhysics.js";

const DIAMETER = BALL_R * 2;
const RAIL_MARGIN = BALL_R * 1.1;

// Planning simulations don't need to run to full rest.
const PLAN_MAX_STEPS = 1200;

// Time budget (ms) for evaluating candidates by simulation. Candidates are
// evaluated best-first, so stopping early still keeps the strongest options.
const PLAN_BUDGET_MS = {
  easy: 25,
  medium: 40,
  hard: 70,
};

// --------------------------------------------------
// LEGAL TARGETS
// --------------------------------------------------

function isOnTable(ball) {
  return !ball.pocketed && !ball.falling && !ball.scratched;
}

function getLegalTargets(balls, playerGroup, isEightBallLegal) {
  const available = balls.filter(
    (ball) => !ball.cueBall && ball.id !== 0 && isOnTable(ball)
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
// BANK POCKETS (built once)
// --------------------------------------------------

function buildBankPockets() {
  const banks = [];

  for (const pocket of POCKETS) {
    banks.push({ ...pocket, x: 2 * MIN_X - pocket.x, bank: "left" });
    banks.push({ ...pocket, x: 2 * MAX_X - pocket.x, bank: "right" });
    banks.push({ ...pocket, z: 2 * MIN_Z - pocket.z, bank: "top" });
    banks.push({ ...pocket, z: 2 * MAX_Z - pocket.z, bank: "bottom" });
  }

  return banks;
}

const BANK_POCKETS = buildBankPockets();

// --------------------------------------------------
// SHOT GENERATION
// --------------------------------------------------

function generateDirectShots(cueBall, targets, balls) {
  const candidates = [];

  for (const target of targets) {
    for (const pocket of POCKETS) {
      const shot = calculateShot(cueBall, target, pocket, balls);

      if (shot) {
        candidates.push({ ...shot, type: "direct" });
      }
    }
  }

  return candidates;
}

function generateBankShots(cueBall, targets, balls) {
  const candidates = [];

  for (const target of targets) {
    for (const pocket of BANK_POCKETS) {
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

      candidates.push({ ...shot, type: "safety" });
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

    power: clamp(shot.power * (1 + powerError), 0.5, 18),

    score: shot.score,
    ghost: shot.ghost,

    type: shot.type,
    bank: shot.bank || null,
  };
}

// --------------------------------------------------
// FALLBACK SHOT
// --------------------------------------------------

// Last resort when no candidate survives the geometry filters or every
// simulation fails: hit the nearest legal ball at medium pace so the AI
// always takes a turn instead of freezing. Returns null only when there is
// nothing on the table to hit.
function fallbackShot({ cueBall, balls, playerGroup, isEightBallLegal }) {
  let targets = getLegalTargets(balls, playerGroup, isEightBallLegal);

  if (!targets.length) {
    targets = balls.filter(
      (ball) => !ball.cueBall && ball.id !== 0 && isOnTable(ball)
    );
  }

  if (!targets.length) return null;

  let nearest = null;
  let nearestDistance = Infinity;

  for (const target of targets) {
    const d = Math.hypot(target.x - cueBall.x, target.z - cueBall.z);

    if (d < nearestDistance) {
      nearestDistance = d;
      nearest = target;
    }
  }

  const angle = Math.atan2(nearest.z - cueBall.z, nearest.x - cueBall.x);

  return {
    targetId: nearest.id,
    pocketId: null,

    cos: Math.cos(angle),
    sin: Math.sin(angle),

    power: MAX_POWER * 0.5,

    score: 0,
    ghost: { x: nearest.x, z: nearest.z },

    type: "safety",
    bank: null,
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
    maxSteps: PLAN_MAX_STEPS,
  });
}

// --------------------------------------------------
// NEXT-SHOT ANALYSIS (computed once per simulation)
// --------------------------------------------------

function getNextState(simulation, legalTargets, level) {
  const cueBall = simulation.balls.find((ball) => ball.cueBall);

  if (!cueBall) {
    return { cueBall: null, balls: simulation.balls, remaining: 0, ranked: [] };
  }

  const potted = new Set(simulation.pottedIds);
  const remaining = [];

  for (const target of legalTargets) {
    if (potted.has(target.id)) continue;

    const ball = simulation.balls.find((b) => b.id === target.id);
    if (ball) remaining.push(ball);
  }

  if (!remaining.length) {
    return { cueBall, balls: simulation.balls, remaining: 0, ranked: [] };
  }

  const ranked = rankShots(
    generateDirectShots(cueBall, remaining, simulation.balls),
    level
  );

  return {
    cueBall,
    balls: simulation.balls,
    remaining: remaining.length,
    ranked,
  };
}

// How good is the cue ball's position for a next shot?
function cuePositionScore(next) {
  if (!next.cueBall) return -1000;
  if (!next.remaining) return 0;
  if (!next.ranked.length) return -40;

  return clamp(next.ranked[0].score * 0.25, -40, 60);
}

// If the next shot is played, how likely is it to pot?
function followUpScore(next, difficulty, level) {
  if (!next.cueBall) return -1000;
  if (!next.remaining) return 0;
  if (!next.ranked.length) return -50;

  const limit = difficulty.lookahead >= 2 ? 3 : 1;
  const shortlist = next.ranked.slice(0, limit);

  let bestScore = -50;

  for (const shot of shortlist) {
    const nextSimulation = runSimulation(next.balls, shot);

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

  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function getOpponentTargets(balls, playerGroup) {
  return balls.filter((ball) => {
    if (
      ball.cueBall ||
      ball.id === 0 ||
      ball.id === 8 ||
      !isOnTable(ball)
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
        if (obstacle.id === target.id || obstacle.pocketed) {
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
          ) <
          DIAMETER * 0.95
        );
      });

      if (!blocked) openShots++;
    }
  }

  return openShots;
}

function evaluateSafetyOutcome(simulation, shot, difficulty) {
  if (
    simulation.cueScratch ||
    simulation.firstContactId !== shot.target.id
  ) {
    return -1000;
  }

  if (!simulation.railAfterContact && simulation.pottedIds.length === 0) {
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

function scoreCandidate(
  shot,
  balls,
  legalTargets,
  difficulty,
  level,
  playerGroup
) {
  const simulation = runSimulation(balls, shot);

  if (!simulation) return -Infinity;

  const isSafety = shot.type === "safety";
  const pottedTarget = simulation.pottedIds.includes(shot.target.id);

  let score = shot.score;

  if (simulation.cueScratch) score -= 1000;

  if (pottedTarget) {
    score += 1000;
  } else if (!isSafety) {
    score -= 300;
  }

  // Positional play: the next-shot analysis is computed once and shared
  // between the follow-up and cue-position terms.
  if (
    difficulty.lookahead >= 1 &&
    !simulation.cueScratch &&
    (pottedTarget || !isSafety)
  ) {
    const next = getNextState(simulation, legalTargets, level);

    if (pottedTarget) {
      score +=
        followUpScore(next, difficulty, level) * difficulty.positionalSkill;
    }

    if (!isSafety) {
      score += cuePositionScore(next) * difficulty.positionalSkill;
    }
  }

  if (isSafety) {
    score += evaluateSafetyOutcome(
      simulation,
      { ...shot, playerGroup },
      difficulty
    );
  }

  return score;
}

// Candidates arrive sorted best-first. Evaluate them in order and stop when
// the time budget runs out (always evaluating at least one).
function chooseSimulatedShot(
  candidates,
  balls,
  legalTargets,
  difficulty,
  level,
  playerGroup,
  deadline
) {
  let best = null;
  let bestScore = -Infinity;

  for (let i = 0; i < candidates.length; i++) {
    if (i > 0 && performance.now() > deadline) break;

    const shot = candidates[i];

    const score = scoreCandidate(
      shot,
      balls,
      legalTargets,
      difficulty,
      level,
      playerGroup
    );

    if (Number.isFinite(score) && score > bestScore) {
      bestScore = score;
      best = shot;
    }
  }

  return best;
}

// --------------------------------------------------
// CUE-BALL PLACEMENT (no simulation)
// --------------------------------------------------

// Scores candidate cue-ball spots by the quality of the best direct shot
// available from each. Cheap enough to run over a whole grid.
export function rankCueSpots({
  cueBall,
  balls,
  spots,
  playerGroup = null,
  isEightBallLegal = false,
  level = "medium",
}) {
  const targets = getLegalTargets(balls, playerGroup, isEightBallLegal);

  if (!targets.length) return [];

  const ranked = [];

  for (const spot of spots) {
    const virtualCue = {
      ...cueBall,
      x: spot.x,
      z: spot.z,
      pocketed: false,
      falling: false,
      scratched: false,
    };

    const shots = generateDirectShots(virtualCue, targets, balls);

    if (!shots.length) continue;

    let best = -Infinity;

    for (const shot of shots) {
      const score = evaluateShot(shot, level);
      if (score > best) best = score;
    }

    // Small bonus for having several options available.
    ranked.push({
      x: spot.x,
      z: spot.z,
      score: best + Math.min(shots.length, 4) * 2,
    });
  }

  return ranked.sort((a, b) => b.score - a.score);
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
  const deadline =
    performance.now() + (PLAN_BUDGET_MS[level] ?? PLAN_BUDGET_MS.medium);

  const targets = getLegalTargets(balls, playerGroup, isEightBallLegal);

  const fallback = () =>
    fallbackShot({ cueBall, balls, playerGroup, isEightBallLegal });

  if (!targets.length) return fallback();

  // Easy and Medium only generate banks and safeties when the better
  // category is empty, so don't compute them unless they might be used.
  const hard = difficulty.lookahead >= 2;

  const direct = rankShots(
    generateDirectShots(cueBall, targets, balls),
    level
  );

  let banks = [];
  let safeties = [];

  if (hard || !direct.length) {
    banks = rankShots(
      generateBankShots(cueBall, targets, balls),
      level
    ).map((shot) => ({ ...shot, score: shot.score - 14 }));
  }

  if (hard || (!direct.length && !banks.length)) {
    safeties = rankShots(
      generateSafetyShots(cueBall, targets, balls),
      level
    ).map((shot) => ({ ...shot, score: shot.score - 5 }));
  }

  let candidates;

  if (hard) {
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

  if (!candidates.length) return fallback();

  // Apply selection noise before simulation to preserve difficulty
  // differences when candidates have similar scores.
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
    playerGroup,
    deadline
  );

  return chosen ? addShotError(chosen, difficulty) : fallback();
}