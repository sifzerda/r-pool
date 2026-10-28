
 // src/ai/AIPhysicsDebugger.js

const POSITION_TOLERANCE = 0.025;

let pendingPrediction = null;

export function setPendingPrediction(prediction) {
  pendingPrediction = prediction;
}

export function clearPendingPrediction() {
  pendingPrediction = null;
}

function distance(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.z - b.z
  );
}

function sortedIds(ids) {
  return [...ids].sort((a, b) => a - b);
}

export function captureActualShot(balls, game) {
  return {
    balls: balls.map((ball) => ({
      id: ball.id,
      x: ball.x,
      z: ball.z,
      cueBall: !!ball.cueBall,
      pocketed:
        !!ball.pocketed ||
        game.pottedIds.has(ball.id),
    })),

    pottedIds: [...game.shotPottedIds],

    firstContactId:
      game.shotEvents.firstContactId,

    railAfterContact:
      game.shotEvents.railAfterContact,

    cueScratch:
      game.shotEvents.cueScratch,
  };
}

export function compareShotResults(predicted, actual) {
  if (!predicted || !actual) return null;

  const predictedMap = new Map(
    predicted.balls.map((ball) => [ball.id, ball])
  );

  const actualMap = new Map(
    actual.balls.map((ball) => [ball.id, ball])
  );

  const ballResults = [];

  for (const [id, actualBall] of actualMap) {
    const predictedBall = predictedMap.get(id);

    if (!predictedBall) continue;

    const predictedPotted = !!predictedBall.pocketed;
    const actualPotted = !!actualBall.pocketed;

    if (predictedPotted || actualPotted) {
      ballResults.push({
        id,
        predictedPotted,
        actualPotted,
        positionError: null,
        matches: predictedPotted === actualPotted,
      });

      continue;
    }

    const error = distance(
      predictedBall,
      actualBall
    );

    ballResults.push({
      id,
      predictedPotted,
      actualPotted,
      positionError: error,
      matches: error <= POSITION_TOLERANCE,
    });
  }

  const errors = ballResults
    .filter((ball) => ball.positionError !== null)
    .map((ball) => ball.positionError);

  const averageError = errors.length
    ? errors.reduce((sum, value) => sum + value, 0) / errors.length
    : 0;

  const maximumError = errors.length
    ? Math.max(...errors)
    : 0;

  // The cue ball is not included in the rules system's pottedIds.
  const cueId = predicted.balls.find(
    (ball) => ball.cueBall
  )?.id;

  const predictedPotted = sortedIds(
    predicted.pottedIds.filter((id) => id !== cueId)
  );

  const actualPotted = sortedIds(actual.pottedIds);

  const pottedMatch =
    JSON.stringify(predictedPotted) ===
    JSON.stringify(actualPotted);

  const firstContactMatch =
    predicted.firstContactId === actual.firstContactId;

  const railAfterContactMatch =
    predicted.railAfterContact === actual.railAfterContact;

  const scratchMatch =
    !!predicted.cueScratch === !!actual.cueScratch;

  const settled = !!predicted.settled;

  return {
    ballResults,
    averageError,
    maximumError,
    pottedMatch,
    firstContactMatch,
    railAfterContactMatch,
    scratchMatch,
    settled,

    passed:
      settled &&
      ballResults.every((ball) => ball.matches) &&
      pottedMatch &&
      firstContactMatch &&
      railAfterContactMatch &&
      scratchMatch,
  };
}

export function logPendingShotComparison(balls, game) {
  if (!pendingPrediction) return null;

  const predicted = pendingPrediction;
  pendingPrediction = null;

  const actual = captureActualShot(balls, game);

  const comparison = compareShotResults(
    predicted,
    actual
  );

  if (!comparison) return null;

  const passed = comparison.passed;

  console.group(
    `%cAI Physics Test: ${passed ? "PASS" : "MISMATCH"}`,
    `color:${passed ? "#22c55e" : "#ef4444"};font-weight:bold`
  );

  if (!comparison.settled) {
    console.warn(
      "Prediction did not settle before its simulation limit."
    );
  }

  console.log(
    "Average position error:",
    comparison.averageError.toFixed(5)
  );

  console.log(
    "Maximum position error:",
    comparison.maximumError.toFixed(5)
  );

  console.log("Potted balls match:", comparison.pottedMatch);
  console.log("First contact matches:", comparison.firstContactMatch);
  console.log("Rail after contact matches:", comparison.railAfterContactMatch);
  console.log("Scratch matches:", comparison.scratchMatch);

  console.table(comparison.ballResults);

  console.groupEnd();

  return comparison;
}
