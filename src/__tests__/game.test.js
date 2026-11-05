// src/__tests__/game.test.js

// tests the game setup

import {
  TABLE_W,
  TABLE_H,
  BALL_R,
  PLAY_W,
  PLAY_H,
} from "../ecs/constants/table.js";

import { buildRack } from "../ecs/constants/rack.js";

import {
  shotSpeed,
  MIN_SHOT_SPEED,
} from "../ecs/constants/physicsConfig.js";

describe("Pool Game", () => {
  // TEST 1: Table dimensions
  test("table has valid playing dimensions", () => {
    expect(TABLE_W).toBeGreaterThan(0);
    expect(TABLE_H).toBeGreaterThan(0);

    expect(PLAY_W).toBeLessThan(TABLE_W);
    expect(PLAY_H).toBeLessThan(TABLE_H);

    expect(BALL_R).toBeGreaterThan(0);
  });

  // TEST 2: Rack generation
  test("new rack contains 15 unique object balls", () => {
    const rack = buildRack();

    expect(rack).toHaveLength(15);

    const numbers = rack.map((ball) => ball.num);

    expect(new Set(numbers).size).toBe(15);

    expect(numbers).toEqual(
      expect.arrayContaining(
        Array.from({ length: 15 }, (_, i) => i + 1)
      )
    );

    for (const ball of rack) {
      expect(ball.group).toBe("object");
      expect(Number.isFinite(ball.x)).toBe(true);
      expect(Number.isFinite(ball.z)).toBe(true);
    }
  });

  // TEST 3: Shot power
  test("shot speed increases with power", () => {
    const maxSpeed = 24;

    const weak = shotSpeed(0, maxSpeed);
    const medium = shotSpeed(0.5, maxSpeed);
    const strong = shotSpeed(1, maxSpeed);

    expect(weak).toBeCloseTo(MIN_SHOT_SPEED);
    expect(medium).toBeGreaterThan(weak);
    expect(strong).toBeGreaterThan(medium);
    expect(strong).toBeCloseTo(maxSpeed);
  });
});
