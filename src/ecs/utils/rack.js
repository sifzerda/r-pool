import { TABLE_W, TABLE_H, BALL_R } from "../constants/table.js";

export function buildRack() {
  const cx = TABLE_W * 0.63;
  const cy = TABLE_H / 2;

  const dx = BALL_R * 2 * 0.87;
  const dy = BALL_R * 2;

  const rows = [
    [1],
    [2, 3],
    [4, 8, 5],
    [6, 7, 9, 10],
    [11, 12, 13, 14, 15],
  ];

  const balls = [];

  rows.forEach((row, r) => {
    row.forEach((num, c) => {
      balls.push({
        x: cx + r * dx,
        y:
          cy -
          ((row.length - 1) * dy) / 2 +
          c * dy,
        num,
      });
    });
  });

  return balls;
}