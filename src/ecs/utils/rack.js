// src/ecs/utils/rack.js
// ball positions generated here

export function buildRack() {

  const balls = [];

  const startX = 0.9;
  const startZ = 0;

  const ballDefs = [

    { num: 1, type: "solid", group: "object" },
    { num: 2, type: "solid", group: "object" },
    { num: 3, type: "solid", group: "object" },
    { num: 4, type: "solid", group: "object" },
    { num: 5, type: "solid", group: "object" },
    { num: 6, type: "solid", group: "object" },
    { num: 7, type: "solid", group: "object" },

    { num: 8, type: "eight" },

    { num: 9, type: "stripe", group: "object" },
    { num: 10, type: "stripe", group: "object" },
    { num: 11, type: "stripe", group: "object" },
    { num: 12, type: "stripe", group: "object" },
    { num: 13, type: "stripe", group: "object" },
    { num: 14, type: "stripe", group: "object" },
    { num: 15, type: "stripe", group: "object" },
  ];

  let index = 0;

  for (let row = 0; row < 5; row++) {

    for (let i = 0; i <= row; i++) {

      const ball = ballDefs[index++];

      balls.push({

        ...ball,

        x: startX + row * 0.18,
        z: i * 0.18 - row * 0.09,

      });
    }
  }

  return balls;
}