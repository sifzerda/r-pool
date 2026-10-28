// src/ai/ShotEvaluator.js

import { POCKETS } from "../ecs/constants/pockets.js";
import { BALL_R } from "../ecs/constants/table.js";
import { getDifficulty } from "./difficulty.js";
import {
  MIN_X,
  MAX_X,
  MIN_Z,
  MAX_Z,
} from "../ecs/constants/tableBounds.js";

function scoreAngle(cutCos) {
  // Straight shots score highly.
  return Math.max(0, Math.min(1, (cutCos - 0.12) / 0.88));
}

function scoreDistance(distance) {
  return Math.exp(-distance * 0.12);
}

function scorePocket(target, pocket) {
  const isCorner =
    Math.abs(pocket.x) > BALL_R &&
    Math.abs(pocket.z) > BALL_R;

  // Corner and side pockets are both viable.
  // Slight preference for larger corner pockets.
  return isCorner ? 1 : 0.92;
}

function scoreCuePosition(shot, difficulty) {
  if (difficulty.positionalSkill <= 0) return 0.5;

  const edgeDistance = Math.min(
    shot.ghost.x - MIN_X,
    MAX_X - shot.ghost.x,
    shot.ghost.z - MIN_Z,
    MAX_Z - shot.ghost.z
  );

  return Math.max(0, Math.min(1, edgeDistance / 0.25));
}

export function evaluateShot(shot, level = "medium") {
  if (!shot) return -Infinity;

  const difficulty = getDifficulty(level);

  const angle = scoreAngle(shot.cutCos);
  const distance = scoreDistance(shot.totalDistance);
  const pocket = scorePocket(shot.target, shot.pocket);
  const position = scoreCuePosition(shot, difficulty);

  const score =
    angle * 42 +
    distance * 24 +
    pocket * 10 +
    position * 8 * difficulty.positionalSkill +
    16;

  return score;
}

export function rankShots(shots, level = "medium") {
  return shots
    .map((shot) => ({
      ...shot,
      score: evaluateShot(shot, level),
    }))
    .sort((a, b) => b.score - a.score);
}
