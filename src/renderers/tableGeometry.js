// src/renderers/tableGeometry.js
//
// Table surface with real pocket holes. The felt, the cloth overlay and the table
// body are all cut open at each pocket, and a dark cup (wall + floor) lines the
// shaft, so a ball can literally fall in.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { TABLE_W, TABLE_H, PLAY_W, PLAY_H, PLAY_X, PLAY_Z } from "../ecs/constants/table";

export const CORNER_POCKET_R = 0.28;
export const SIDE_POCKET_R = 0.22;

// Pocket centres sit on the edge of the playing surface (same as the physics).
export const POCKET_HOLES = [
  [-PLAY_X, -PLAY_Z, CORNER_POCKET_R],
  [0, -PLAY_Z, SIDE_POCKET_R],
  [PLAY_X, -PLAY_Z, CORNER_POCKET_R],
  [-PLAY_X, PLAY_Z, CORNER_POCKET_R],
  [0, PLAY_Z, SIDE_POCKET_R],
  [PLAY_X, PLAY_Z, CORNER_POCKET_R],
];

// Heights.
export const FRAME_BOTTOM = -0.3;
export const FRAME_TOP = 0.2;
export const FELT_THICKNESS = 0.02;
export const CLOTH_Y = 0.221;
export const POCKET_FLOOR_Y = -0.28; // keep FALL_END_Y = floor + BALL_R

const CURVE = 32;
const PI = Math.PI;

/**
 * The playing surface outline: a rectangle with a quarter-circle bitten out of
 * each corner and a half-circle out of the middle of each long edge.
 * Shape coordinates are (x, z); the shape is symmetric so the flip to world z
 * when it is laid flat does not matter.
 */
function playSurfaceShape() {
  const rc = CORNER_POCKET_R;
  const rs = SIDE_POCKET_R;
  const s = new THREE.Shape();

  s.moveTo(-PLAY_X + rc, -PLAY_Z);

  // bottom edge, left to right
  s.lineTo(-rs, -PLAY_Z);
  s.absarc(0, -PLAY_Z, rs, PI, 0, true);
  s.lineTo(PLAY_X - rc, -PLAY_Z);
  s.absarc(PLAY_X, -PLAY_Z, rc, PI, PI / 2, true);

  // right edge, upwards
  s.lineTo(PLAY_X, PLAY_Z - rc);
  s.absarc(PLAY_X, PLAY_Z, rc, -PI / 2, -PI, true);

  // top edge, right to left
  s.lineTo(rs, PLAY_Z);
  s.absarc(0, PLAY_Z, rs, 0, -PI, true);
  s.lineTo(-PLAY_X + rc, PLAY_Z);
  s.absarc(-PLAY_X, PLAY_Z, rc, 0, -PI / 2, true);

  // left edge, downwards
  s.lineTo(-PLAY_X, -PLAY_Z + rc);
  s.absarc(-PLAY_X, -PLAY_Z, rc, PI / 2, 0, true);

  s.closePath();
  return s;
}

/** Felt slab with the pocket notches cut out of it. */
export function makeFeltGeometry() {
  const geo = new THREE.ExtrudeGeometry(playSurfaceShape(), {
    depth: FELT_THICKNESS,
    bevelEnabled: false,
    curveSegments: CURVE,
  });
  geo.rotateX(-PI / 2); // extrusion becomes +y
  geo.translate(0, FRAME_TOP, 0);
  return geo;
}

/** Flat cloth-texture overlay with the same notches; UVs match the old plane (0..1). */
export function makeClothGeometry() {
  const geo = new THREE.ShapeGeometry(playSurfaceShape(), CURVE);

  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + PLAY_W / 2) / PLAY_W;
    uv[i * 2 + 1] = (pos.getY(i) + PLAY_H / 2) / PLAY_H;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));

  geo.rotateX(-PI / 2);
  geo.translate(0, CLOTH_Y, 0);
  return geo;
}

/** The table body (wood frame), with a round shaft cut straight through at each pocket. */
export function makeFrameGeometry() {
  const w = (TABLE_W + 0.4) / 2;
  const h = (TABLE_H + 0.4) / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-w, -h);
  shape.lineTo(w, -h);
  shape.lineTo(w, h);
  shape.lineTo(-w, h);
  shape.closePath();

  for (const [x, z, r] of POCKET_HOLES) {
    const hole = new THREE.Path();
    hole.absarc(x, z, r, 0, PI * 2, false);
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: FRAME_TOP - FRAME_BOTTOM,
    bevelEnabled: false,
    curveSegments: CURVE,
  });
  geo.rotateX(-PI / 2);
  geo.translate(0, FRAME_BOTTOM, 0);
  return geo;
}

/**
 * Dark cup lining each shaft: an open wall (draw it with side = BackSide so you
 * see its inside) and a floor that faces down, which BackSide shows from above.
 */
export function makeLinerGeometry() {
  const top = FRAME_TOP + FELT_THICKNESS + 0.01; // just under the felt surface
  const height = top - FRAME_BOTTOM;
  const parts = [];

  for (const [x, z, r] of POCKET_HOLES) {
    const rr = r - 0.005;

    const wall = new THREE.CylinderGeometry(rr, rr, height, CURVE, 1, true);
    wall.translate(x, FRAME_BOTTOM + height / 2, z);

    const floor = new THREE.CircleGeometry(rr, CURVE);
    floor.rotateX(PI / 2);
    floor.translate(x, POCKET_FLOOR_Y, z);

    parts.push(wall, floor);
  }

  return mergeGeometries(parts);
}
