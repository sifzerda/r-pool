// src/ecs/systems/physicsSystem.js
import { PLAY_X, PLAY_Z, BALL_R, POCKET_R } from "../constants/table";
import { activeBalls, markDirty } from "../world";

const CUSHION_RESTITUTION = 0.75;  // lowered — real cushions lose more energy
const OPENING = POCKET_R + BALL_R;
const INV_R   = 1 / BALL_R;

function reflect(vel, normal) {
  const dot = vel.vx * normal.x + vel.vz * normal.z;
  vel.vx = (vel.vx - 2 * dot * normal.x) * CUSHION_RESTITUTION;
  vel.vz = (vel.vz - 2 * dot * normal.z) * CUSHION_RESTITUTION;
}

export function physicsSystem(dt) {
  const left   = -PLAY_X, right  = PLAY_X;
  const top    = -PLAY_Z, bottom = PLAY_Z;

  for (const ball of activeBalls) {
    if (ball.pocketed || ball.falling || ball.sleeping) continue;

    ball.x    += ball.vx * dt;
    ball.z    += ball.vz * dt;
    ball.rotX += (ball.vz * INV_R) * dt;
    ball.rotZ -= (ball.vx * INV_R) * dt;

    const pocketOpenLR = Math.abs(ball.z + PLAY_Z) < OPENING
                      || Math.abs(ball.z)           < OPENING
                      || Math.abs(ball.z - PLAY_Z)  < OPENING;

    const pocketOpenTB = Math.abs(ball.x + PLAY_X) < OPENING
                      || Math.abs(ball.x)           < OPENING
                      || Math.abs(ball.x - PLAY_X)  < OPENING;

    if (ball.x - BALL_R < left  && !pocketOpenLR) { ball.x =  left  + BALL_R; reflect(ball, { x:  1, z: 0 }); }
    if (ball.x + BALL_R > right && !pocketOpenLR) { ball.x =  right - BALL_R; reflect(ball, { x: -1, z: 0 }); }
    if (ball.z - BALL_R < top   && !pocketOpenTB) { ball.z =  top   + BALL_R; reflect(ball, { x: 0, z:  1 }); }
    if (ball.z + BALL_R > bottom && !pocketOpenTB) { ball.z = bottom - BALL_R; reflect(ball, { x: 0, z: -1 }); }

    markDirty(ball);
  }
}