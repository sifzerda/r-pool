// src/ecs/utils/spatialGrid.js

import { BALL_R } from "../constants/table";

const CELL_SIZE = BALL_R * 4;

export class SpatialGrid {

  constructor() {
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  key(x,z) {
    return `${x}:${z}`;
  }

  insert(ball) {

    const cx = Math.floor(ball.x / CELL_SIZE);
    const cz = Math.floor(ball.z / CELL_SIZE);

    const key = this.key(cx,cz);

    let bucket = this.cells.get(key);

    if(!bucket){

      bucket = [];
      this.cells.set(key,bucket);

    }

    bucket.push(ball);
  }

  getNearby(ball){

    const result = [];

    const cx = Math.floor(ball.x / CELL_SIZE);
    const cz = Math.floor(ball.z / CELL_SIZE);

    for(let x=-1;x<=1;x++){

      for(let z=-1;z<=1;z++){

        const bucket = this.cells.get(this.key(cx+x, cz+z));

        if(bucket){

          result.push(...bucket);

        }
      }
    }

    return result;
  }
}