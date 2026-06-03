// src/ecs/utils/rack.js
// ball positions generated here

import { TABLE_W, TABLE_H, BALL_R } from "../constants/table.js";

export function buildRack() {
  const balls = [];

  let id = 1;

  const startX = 0.9;
  const startZ = 0;

  for (let row = 0; row < 5; row++) {
    for (let i = 0; i <= row; i++) {
      const colors = [

        "#F5C518",
        "#1B4FD8",
        "#D92B2B",
        "#7B2FBE",
        "#E05C00",
        "#1A7A1A",
        "#8B1A1A",
        "#1a1a1a",
        "#F5C518",
        "#1B4FD8",
        "#D92B2B",
        "#7B2FBE",
        "#E05C00",
        "#1A7A1A",
        "#8B1A1A",

      ];

      balls.push({
        num: id,
        color:
          colors[
          (id - 1) %
          colors.length
          ],
        x:
          startX +
          row * 0.18,
        z:
          i * 0.18 -
          row * 0.09
      });

      id++;
    }
  }

  return balls;
}