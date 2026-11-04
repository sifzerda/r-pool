// src/ai/ShotPlanner.js

import { POCKETS } from "../ecs/constants/pockets.js";
import { BALL_R, MAX_POWER } from "../ecs/constants/table.js";
import { MIN_X, MAX_X, MIN_Z, MAX_Z } from "../ecs/constants/tableBounds.js";
import { calculateShot } from "./ShotCalculator.js";
import { rankShots, evaluateShot } from "./ShotEvaluator.js";
import { getDifficulty, randomError, clamp } from "./difficulty.js";
import { simulateShot } from "./ShotSimulation.js";
import { aiPhysics } from "./aiPhysics.js";

const DIAMETER = BALL_R * 2;
const RAIL_MARGIN = BALL_R * 1.1;
const PLAN_MAX_STEPS = 1200;

const PLAN_BUDGET_MS = {
  easy: 35,
  medium: 65,
  hard: 110,
};

// Adaptive sampling configuration.
// Samples include the initial perfect-aim simulation.
const SAMPLING = {
  easy: {
    finalists: 2,
    initialSamples: 3,
    maxSamples: 5,
    totalSamples: 8,
  },
  medium: {
    finalists: 3,
    initialSamples: 3,
    maxSamples: 9,
    totalSamples: 18,
  },
  hard: {
    finalists: 4,
    initialSamples: 5,
    maxSamples: 15,
    totalSamples: 36,
  },
};

// Normalized aim/power offsets.
// The same sequence is used for each candidate so their
// reliability estimates can be compared consistently.
const ERROR_SAMPLES = [
  [0, 0],
  [-0.5, 0],
  [0.5, 0],
  [0, -0.5],
  [0, 0.5],
  [-0.5, -0.5],
  [0.5, 0.5],
  [-0.5, 0.5],
  [0.5, -0.5],
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [1, 1],
];

const now = () => performance.now();

function isOnTable(ball) {
  return !ball.pocketed && !ball.falling && !ball.scratched;
}

function getLegalTargets(balls, playerGroup, isEightBallLegal) {
  return balls.filter((ball) => {
    if (ball.cueBall || ball.id === 0 || !isOnTable(ball)) {
      return false;
    }

    if (isEightBallLegal) return ball.id === 8;
    if (ball.id === 8) return false;
    if (!playerGroup) return true;

    return ((ball.id <= 7 ? "solids" : "stripes") === playerGroup);
  });
}

// --------------------------------------------------
// SHOT GENERATION
// --------------------------------------------------

const BANK_POCKETS = POCKETS.flatMap((pocket) => [
  {
    ...pocket,
    x: 2 * MIN_X - pocket.x,
    bank: "left",
  },
  {
    ...pocket,
    x: 2 * MAX_X - pocket.x,
    bank: "right",
  },
  {
    ...pocket,
    z: 2 * MIN_Z - pocket.z,
    bank: "top",
  },
  {
    ...pocket,
    z: 2 * MAX_Z - pocket.z,
    bank: "bottom",
  },
]);

function generateDirectShots(cueBall, targets, balls) {
  const shots = [];

  for (const target of targets) {
    for (const pocket of POCKETS) {
      const shot = calculateShot(cueBall, target, pocket, balls);

      if (shot) {
        shots.push({ ...shot, type: "direct" });
      }
    }
  }

  return shots;
}

function generateBankShots(cueBall, targets, balls) {
  const shots = [];

  for (const target of targets) {
    for (const pocket of BANK_POCKETS) {
      const shot = calculateShot(cueBall, target, pocket, balls);

      if (!shot) continue;

      shots.push({
        ...shot,
        type: "bank",
        bank: pocket.bank,
      });
    }
  }

  return shots;
}

function generateSafetyShots(cueBall, targets, balls) {
  const shots = [];

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

      if (shot) {
        shots.push({
          ...shot,
          type: "safety",
        });
      }
    }
  }

  return shots;
}

// --------------------------------------------------
// PHYSICS
// --------------------------------------------------

function runSimulation(balls, shot, angleError = 0, powerError = 0) {
  const angle = Math.atan2(shot.direction.z, shot.direction.x) + angleError;

  return simulateShot({
    balls,
    shot: {
      cos: Math.cos(angle),
      sin: Math.sin(angle),
      power: clamp(
        shot.power * (1 + powerError),
        0.5,
        MAX_POWER
      ),
    },
    ...aiPhysics,
    maxSteps: PLAN_MAX_STEPS,
  });
}

function legalContact(simulation, shot) {
  return (!!simulation && simulation.firstContactId === shot.target.id);
}

function legalPot(simulation, shot) {
  return (!!simulation && !simulation.cueScratch && legalContact(simulation, shot) && simulation.pottedIds.includes(shot.target.id));
}

function legalSafety(simulation, shot) {
  return (!!simulation && !simulation.cueScratch && legalContact(simulation, shot) && (simulation.railAfterContact || simulation.pottedIds.length > 0));
}

// --------------------------------------------------
// SHOT EXECUTION
// --------------------------------------------------

function addShotError(shot, difficulty) {
  const angle = Math.atan2(shot.direction.z, shot.direction.x) + randomError(difficulty.aimError);

  return {
    targetId: shot.target.id,
    pocketId: shot.type === "safety" || shot.type === "break" ? null : shot.pocket?.id ?? null,

    cos: Math.cos(angle),
    sin: Math.sin(angle),

    power: clamp(shot.power * (1 + randomError(difficulty.powerError)), 0.5, MAX_POWER),

    score: shot.score,
    ghost: shot.ghost,
    type: shot.type,
    bank: shot.bank || null,
  };
}

// --------------------------------------------------
// FALLBACK
// --------------------------------------------------

function fallbackShot({
  cueBall,
  balls,
  playerGroup,
  isEightBallLegal,
}) {
  let targets = getLegalTargets(balls, playerGroup, isEightBallLegal);

  if (!targets.length) {
    targets = balls.filter((ball) => !ball.cueBall && ball.id !== 0 && isOnTable(ball));
  }

  if (!targets.length) return null;

  const nearest = targets.reduce((best, ball) => {
    if (!best) return ball;

    const distance = (target) => Math.hypot(target.x - cueBall.x, target.z - cueBall.z);

    return distance(ball) < distance(best) ? ball : best;
  }, null);

  const angle = Math.atan2(nearest.z - cueBall.z, nearest.x - cueBall.x);

  return {
    targetId: nearest.id,
    pocketId: null,
    cos: Math.cos(angle),
    sin: Math.sin(angle),
    power: MAX_POWER * 0.5,
    score: 0,
    ghost: {
      x: nearest.x,
      z: nearest.z,
    },
    type: "safety",
    bank: null,
  };
}

// --------------------------------------------------
// BREAK SHOTS
// --------------------------------------------------

function generateBreakShots(cueBall, balls) {
  const objects = balls.filter((ball) => !ball.cueBall && ball.id !== 0 && isOnTable(ball));

  if (objects.length !== 15) return [];

  const nearest = objects.reduce((best, ball) => {
    if (!best) return ball;

    const distance = (target) => Math.hypot(target.x - cueBall.x, target.z - cueBall.z);

    return distance(ball) < distance(best) ? ball : best;
  }, null);

  const base = Math.atan2(nearest.z - cueBall.z, nearest.x - cueBall.x);

  const shots = [];

  for (const offset of [
    -0.08,
    -0.035,
    0,
    0.035,
    0.08,
  ]) {
    for (const fraction of [0.75, 0.9, 1]) {
      const angle = base + offset;

      shots.push({
        target: nearest,
        direction: {
          x: Math.cos(angle),
          z: Math.sin(angle),
        },
        power: MAX_POWER * fraction,
        score: 0,
        ghost: {
          x: nearest.x,
          z: nearest.z,
        },
        type: "break",
      });
    }
  }

  return shots;
}

function chooseBreakShot(cueBall, balls, difficulty, deadline) {
  const shots = generateBreakShots(cueBall, balls);

  let best = null;
  let bestScore = -Infinity;

  for (const shot of shots) {
    if (best && now() >= deadline) break;

    const simulation = runSimulation(balls, shot);
    if (!simulation) continue;

    const score = simulation.pottedIds.length * 100 - (simulation.cueScratch ? 500 : 0) + (legalContact(simulation, shot) ? 40 : -200) + (simulation.railAfterContact ? 15 : 0);

    if (score > bestScore) {
      best = shot;
      bestScore = score;
    }
  }

  return best ? addShotError(best, difficulty) : null;
}

// --------------------------------------------------
// POSITIONAL PLAY
// --------------------------------------------------

function getNextState(simulation, legalTargets, level) {
  const balls = simulation.balls || [];

  const cueBall = balls.find((ball) => ball.cueBall && isOnTable(ball));

  if (!cueBall) {
    return {
      cueBall: null,
      balls,
      remaining: 0,
      ranked: [],
    };
  }

  const potted = new Set(simulation.pottedIds);

  const remaining = legalTargets
    .filter((target) => !potted.has(target.id))
    .map((target) => balls.find((ball) => ball.id === target.id))
    .filter((ball) => ball && isOnTable(ball));

  const ranked = remaining.length ? rankShots(generateDirectShots(cueBall, remaining,  balls), level) : [];

  return {
    cueBall,
    balls,
    remaining: remaining.length,
    ranked,
  };
}

function cuePositionScore(next) {
  if (!next.cueBall) return -1000;
  if (!next.remaining) return 0;
  if (!next.ranked.length) return -40;

  return clamp(next.ranked[0].score * 0.25, -40, 60);
}

function followUpScore(next, difficulty, deadline) {
  if (!next.cueBall) return -1000;
  if (!next.remaining) return 0;
  if (!next.ranked.length) return -50;

  const limit = difficulty.lookahead >= 2 ? 3 : 1;

  let best = -50;
  let tested = 0;

  for (const shot of next.ranked.slice(0, limit)) {
    if (now() >= deadline) break;

    const simulation = runSimulation(next.balls, shot);

    tested++;

    if (!simulation || simulation.cueScratch) {
      continue;
    }

    const score = (legalPot(simulation, shot) ? 100 : -40) + clamp(shot.score * 0.1, -10, 20);

    best = Math.max(best, score);
  }

  return tested ? best : 0;
}

// --------------------------------------------------
// SAFETY EVALUATION
// --------------------------------------------------

function distanceToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const lengthSq = dx * dx + dz * dz;

  if (!lengthSq) {
    return Math.hypot(px - ax, pz - az);
  }

  const t = clamp(((px - ax) * dx + (pz - az) * dz) / lengthSq, 0, 1);

  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

function getOpponentTargets(balls, playerGroup) {
  return balls.filter((ball) => {
    if (ball.cueBall || ball.id === 0 || ball.id === 8 || !isOnTable(ball)) {
      return false;
    }

    if (!playerGroup) return true;

    return ((ball.id <= 7 ? "solids" : "stripes") !== playerGroup);
  });
}

function countOpponentOpenShots(balls, targets) {
  let openShots = 0;

  for (const target of targets) {
    for (const pocket of POCKETS) {
      const blocked = balls.some((ball) => {
        if (ball.id === target.id || ball.cueBall || !isOnTable(ball)) {
          return false;
        }

        return (
          distanceToSegment(ball.x, ball.z, target.x, target.z, pocket.x, pocket.z) < DIAMETER * 0.95
        );
      });

      if (!blocked) openShots++;
    }
  }

  return openShots;
}

function evaluateSafetyOutcome(simulation, shot, difficulty, playerGroup) {
  if (!legalSafety(simulation, shot)) {
    return -1000;
  }

  const balls = simulation.balls || [];
  const targets = getOpponentTargets(balls, playerGroup);

  if (!targets.length) return 0;

  return (-countOpponentOpenShots(balls, targets) * 20 * difficulty.safetyWeight);
}

// --------------------------------------------------
// FIRST-PASS EVALUATION
// --------------------------------------------------

function evaluateFirstPass(shot, balls, difficulty, playerGroup) {
  const simulation = runSimulation(balls, shot);

  if (!simulation) return null;

  const contact = legalContact(simulation, shot);
  const pot = legalPot(simulation, shot);
  const safety = legalSafety(simulation, shot);
  const isSafety = shot.type === "safety";

  let score = shot.score;

  if (simulation.cueScratch) score -= 1000;
  if (!contact) score -= 700;

  if (pot) {
    score += 1000;
  } else if (!isSafety) {
    score -= 300;
  }

  if (isSafety) {
    score += evaluateSafetyOutcome(simulation, shot, difficulty, playerGroup);
  }

  return {
    shot,
    simulation,
    score,
    legalPot: pot,
    legalSafety: safety,

    // Adaptive sampling state.
    samples: 0,
    successes: 0,
    scratches: 0,
    illegal: 0,
    nextSample: 0,
    reliability: null,

    finalScore: score,
  };
}

// --------------------------------------------------
// ADAPTIVE RELIABILITY SAMPLING
// --------------------------------------------------

// Wilson score interval estimates uncertainty from a
// small number of binary success/failure observations.
// It is used to decide which candidate needs more tests.
function wilsonInterval(successes, samples) {
  if (!samples) {
    return {
      low: 0,
      high: 1,
      width: 1,
    };
  }

  const z = 1.96;
  const z2 = z * z;
  const p = successes / samples;
  const denominator = 1 + z2 / samples;
  const centre = (p + z2 / (2 * samples)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / samples + z2 / (4 * samples * samples))) / denominator;
  const low = clamp(centre - margin, 0, 1);
  const high = clamp(centre + margin, 0, 1);

  return {
    low,
    high,
    width: high - low,
  };
}

function updateReliability(entry) {
  const samples = entry.samples;

  if (!samples) {
    entry.reliability = null;
    return;
  }

  const interval = wilsonInterval(entry.successes, samples);

  entry.reliability = {
    probability: entry.successes / samples,
    scratchProbability: entry.scratches / samples,
    illegalProbability: entry.illegal / samples,

    samples,
    uncertainty: interval.width,
    lowerBound: interval.low,
    upperBound: interval.high,
  };
}

// Runs exactly one new error sample.
// Returns false if no more samples can be taken.
function sampleCandidate(entry, balls, difficulty, deadline) {
  if (now() >= deadline) return false;

  if (entry.nextSample >= ERROR_SAMPLES.length) {
    return false;
  }

  const [angleFactor, powerFactor] = ERROR_SAMPLES[entry.nextSample];

  entry.nextSample++;

  const simulation = angleFactor === 0 && powerFactor === 0 ? entry.simulation : runSimulation(balls, entry.shot, angleFactor * difficulty.aimError, powerFactor * difficulty.powerError);

  if (!simulation) return true;

  entry.samples++;

  if (simulation.cueScratch) {
    entry.scratches++;
  }

  if (!legalContact(simulation, entry.shot)) {
    entry.illegal++;
  }

  const success = entry.shot.type === "safety" ? legalSafety(simulation, entry.shot) : legalPot(simulation, entry.shot);

  if (success) {
    entry.successes++;
  }

  updateReliability(entry);

  return true;
}

function reliabilityBonus(entry) {
  const r = entry.reliability;
  if (!r) return 0;

  const successWeight = entry.shot.type === "safety" ? 150 : 350;

  return (r.probability * successWeight - r.scratchProbability * 200 - r.illegalProbability * 150);
}

function estimatedScore(entry) {
  return entry.score + reliabilityBonus(entry);
}

// Choose the next candidate to sample based on:
// 1. How close its estimated score is to the leader.
// 2. How uncertain its estimated success rate is.
// 3. How many samples it has already received.
function chooseNextSampleCandidate(finalists, maxSamples) {
  const available = finalists.filter((entry) => entry.samples < maxSamples && entry.nextSample < ERROR_SAMPLES.length);

  if (!available.length) return null;

  const bestScore = Math.max(...finalists.map(estimatedScore));

  let selected = null;
  let bestPriority = -Infinity;

  for (const entry of available) {
    const score = estimatedScore(entry);
    const gap = Math.max(0, bestScore - score);
    const uncertainty = entry.reliability?.uncertainty ?? 1;
    // Close contenders are prioritized.
    const competitiveness = 1 / (1 + gap / 150);
    // Uncertain candidates need more evidence.
    const uncertaintyWeight = 0.25 + uncertainty;
    // Discourage repeatedly sampling one candidate.
    const samplePenalty = 1 / Math.sqrt(entry.samples + 1);
    const priority = competitiveness * uncertaintyWeight * samplePenalty;

    if (priority > bestPriority) {
      bestPriority = priority;
      selected = entry;
    }
  }

  return selected;
}

// Shared-budget adaptive sampling.
// Every finalist receives an initial sample allocation
// before additional samples are distributed.
function adaptiveReliability(finalists, balls, difficulty, level, deadline) {
  const config = SAMPLING[level] || SAMPLING.medium;

  let totalSamples = 0;

  // Phase 1: equal initial coverage.
  for (let round = 0; round < config.initialSamples; round++) {
    for (const entry of finalists) {
      if (totalSamples >= config.totalSamples || now() >= deadline) {
        return;
      }

      if (sampleCandidate(entry, balls, difficulty, deadline)) {
        totalSamples++;
      }
    }
  }

  // Phase 2: allocate additional simulations to
  // uncertain, competitive candidates.
  while (totalSamples < config.totalSamples && now() < deadline) {
    const entry = chooseNextSampleCandidate(finalists, config.maxSamples);

    if (!entry) break;

    if (!sampleCandidate(entry, balls, difficulty, deadline)) {
      break;
    }

    totalSamples++;
  }
}

// --------------------------------------------------
// POSITIONAL LOOKAHEAD
// --------------------------------------------------

function evaluateFinalist(entry, legalTargets, difficulty, level, deadline) {
  if (difficulty.lookahead < 1 || !entry.legalPot || now() >= deadline) {
    return 0;
  }

  const next = getNextState(entry.simulation, legalTargets, level);
  let bonus = cuePositionScore(next) * difficulty.positionalSkill;

  if (now() < deadline) {
    bonus += followUpScore(next, difficulty, deadline) * difficulty.positionalSkill;
  }

  return bonus;
}

// --------------------------------------------------
// CANDIDATE SEARCH
// --------------------------------------------------

function takeWithNoise(shots, difficulty, limit) {
  return shots
    .slice(0, Math.max(0, limit))
    .map((shot) => ({
      ...shot,
      score:
        shot.score +
        randomError(difficulty.selectionNoise),
    }))
    .sort((a, b) => b.score - a.score);
}

function evaluateBatch(candidates, balls, difficulty, playerGroup, deadline, results) {
  for (const shot of candidates) {
    if (results.length && now() >= deadline) {
      break;
    }

    const entry = evaluateFirstPass(shot, balls, difficulty, playerGroup);

    if (entry && Number.isFinite(entry.score)) {
      results.push(entry);
    }
  }

  results.sort((a, b) => b.score - a.score);
}

function strongPot(results) {
  return results.some((entry) => entry.legalPot && entry.score >= 1000);
}

// --------------------------------------------------
// FINAL SELECTION
// --------------------------------------------------

function chooseBestShot(results, balls, targets, difficulty, level, deadline) {
  if (!results.length) return null;

  const config = SAMPLING[level] || SAMPLING.medium;
  const finalists = results.slice(0, config.finalists);

  // Allocate reliability simulations adaptively.
  adaptiveReliability(finalists, balls, difficulty, level, deadline);

  // Re-rank before lookahead, so reliable shots
  // receive positional analysis first.
  finalists.sort((a, b) => estimatedScore(b) - estimatedScore(a));

  const lookaheadCount = difficulty.lookahead >= 2 ? 3 : difficulty.lookahead >= 1 ? 2 : 0;

  for (const entry of finalists.slice(0, lookaheadCount)) {
    if (now() >= deadline) break;

    entry.score += evaluateFinalist(entry, targets, difficulty, level, deadline);
  }

  for (const entry of results) {
    entry.finalScore = estimatedScore(entry);
  }

  results.sort((a, b) => b.finalScore - a.finalScore);

  return results[0];
}

// --------------------------------------------------
// CUE-BALL PLACEMENT
// --------------------------------------------------

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
      best = Math.max(best, evaluateShot(shot, level));
    }

    ranked.push({
      x: spot.x,
      z: spot.z,
      score:
        best +
        Math.min(shots.length, 4) * 2,
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
  if (!cueBall || !isOnTable(cueBall)) {
    return null;
  }

  const difficulty = getDifficulty(level);
  const targets = getLegalTargets(balls, playerGroup, isEightBallLegal);

  const fallback = () => fallbackShot({
      cueBall,
      balls,
      playerGroup,
      isEightBallLegal,
    });

  const objectCount = balls.filter((ball) => !ball.cueBall && ball.id !== 0 && isOnTable(ball)).length;
  const baseBudget = PLAN_BUDGET_MS[level] ?? PLAN_BUDGET_MS.medium;
  const startTime = now();

  // Break planning.
  if (objectCount === 15) {
    return (chooseBreakShot(cueBall, balls, difficulty, startTime + baseBudget) || fallback());
  }

  if (!targets.length) return fallback();

  // Geometry ranking.
  const direct = rankShots(generateDirectShots(cueBall, targets, balls), level);
  const hard = difficulty.lookahead >= 2;
  const limit = difficulty.maxCandidates;
  const budgetMultiplier = isEightBallLegal || direct.length < 3 ? 1.5 : 1;
  const deadline = startTime + baseBudget * budgetMultiplier;
  // Reserve part of the time budget for
  // adaptive reliability and lookahead.
  const searchDeadline = startTime + (deadline - startTime) * 0.65;
  const results = [];
  const directLimit = hard ? Math.max(1, Math.floor(limit * 0.6)) : limit;

  evaluateBatch(takeWithNoise(direct, difficulty, directLimit), balls, difficulty, playerGroup, searchDeadline, results);

  // Expand to bank shots when needed.
  const needBanks = !strongPot(results) || (hard && results.length < 2);

  if (needBanks && now() < searchDeadline) {
    const banks = rankShots(generateBankShots(cueBall, targets, balls), level).map((shot) => ({
      ...shot,
      score: shot.score - 14,
    }));

    const remaining = Math.max(0, limit - results.length);
    const bankLimit = hard ? Math.ceil(remaining * 0.6) : remaining;

    evaluateBatch(takeWithNoise(banks, difficulty, bankLimit), balls, difficulty, playerGroup, searchDeadline, results);
  }

  // Expand to safety shots if no reliable pot
  // has been found by the initial simulations.
  if (!strongPot(results) && now() < searchDeadline) {
    const safeties = rankShots(generateSafetyShots(cueBall, targets, balls), level).map((shot) => ({
      ...shot,
      score: shot.score - 5,
    }));

    evaluateBatch(takeWithNoise(safeties, difficulty, Math.max(0, limit - results.length)), balls, difficulty, playerGroup, searchDeadline, results);
  }

  if (!results.length) return fallback();

  // Adaptive sampling and positional analysis.
  const best = chooseBestShot(results, balls, targets, difficulty, level, deadline);

  return best ? addShotError(best.shot, difficulty) : fallback();
}
