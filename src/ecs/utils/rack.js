// src/ecs/utils/rack.js
// ball positions generated here

import { Color } from "three";

export function buildRack() {

  const balls = [];

  const startX = 0.9;
  const startZ = 0;

  const ballDefs = [

    { num: 1, color: "#F5C518", type: "solid", group: "object" },
    { num: 2, color: "#1B4FD8", type: "solid", group: "object" },
    { num: 3, color: "#D92B2B", type: "solid", group: "object" },
    { num: 4, color: "#7B2FBE", type: "solid", group: "object" },
    { num: 5, color: "#E05C00", type: "solid", group: "object" },
    { num: 6, color: "#1A7A1A", type: "solid", group: "object" },
    { num: 7, color: "#8B1A1A", type: "solid", group: "object" },

    { num: 8, color: "#111111", type: "eight" },

    { num: 9, color: "#F5C518", type: "stripe", group: "object" },
    { num: 10, color: "#1B4FD8", type: "stripe", group: "object" },
    { num: 11, color: "#D92B2B", type: "stripe", group: "object" },
    { num: 12, color: "#7B2FBE", type: "stripe", group: "object" },
    { num: 13, color: "#E05C00", type: "stripe", group: "object" },
    { num: 14, color: "#1A7A1A", type: "stripe", group: "object" },
    { num: 15, color: "#8B1A1A", type: "stripe", group: "object" },
  ];

  let index = 0;

  for (let row = 0; row < 5; row++) {

    for (let i = 0; i <= row; i++) {

      const ball = ballDefs[index++];

      balls.push({

        ...ball,

        renderColor: new Color(ball.color),

        x: startX + row * 0.18,
        z: i * 0.18 - row * 0.09,

      });
    }
  }

  return balls;
}