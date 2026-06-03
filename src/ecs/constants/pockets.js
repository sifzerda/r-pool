//ecs/constants/pockets.js

import { PLAY_X, PLAY_Z } from "./table";

export const POCKETS = [
  { x: -PLAY_X, z: -PLAY_Z }, // top left
  { x: 0, z: -PLAY_Z },       // top middle
  { x: PLAY_X, z: -PLAY_Z },  // top right

  { x: -PLAY_X, z: PLAY_Z },  // bottom left
  { x: 0, z: PLAY_Z },        // bottom middle
  { x: PLAY_X, z: PLAY_Z },   // bottom right
];