// src/renderers/tableGeometry.js
//
// Table surface with real pocket holes. The felt, the cloth overlay and the table
// body are all cut open at each pocket, and a dark cup (wall + floor) lines the
// shaft, so a ball can literally fall in.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { TABLE_W, TABLE_H, PLAY_W, PLAY_H, PLAY_X, PLAY_Z, FRAME_BOTTOM, FRAME_TOP, FELT_THICKNESS, CLOTH_Y, POCKET_FLOOR_Y, CORNER_POCKET_R, SIDE_POCKET_R } from "../ecs/constants/table.js";
import { POCKETS } from "../ecs/constants/pockets.js";

const POCKET_HOLES = POCKETS.map((p) => [p.x, p.z, p.radius]);
const CURVE = 32, PI = Math.PI;

function surface() {
  const c = CORNER_POCKET_R, r = SIDE_POCKET_R, s = new THREE.Shape();
  s.moveTo(-PLAY_X + c, -PLAY_Z);
  s.lineTo(-r, -PLAY_Z);
  s.absarc(0, -PLAY_Z, r, PI, 0, true);
  s.lineTo(PLAY_X - c, -PLAY_Z);
  s.absarc(PLAY_X, -PLAY_Z, c, PI, PI / 2, true);
  s.lineTo(PLAY_X, PLAY_Z - c);
  s.absarc(PLAY_X, PLAY_Z, c, -PI / 2, -PI, true);
  s.lineTo(r, PLAY_Z);
  s.absarc(0, PLAY_Z, r, 0, -PI, true);
  s.lineTo(-PLAY_X + c, PLAY_Z);
  s.absarc(-PLAY_X, PLAY_Z, c, 0, -PI / 2, true);
  s.lineTo(-PLAY_X, -PLAY_Z + c);
  s.absarc(-PLAY_X, -PLAY_Z, c, PI / 2, 0, true);
  s.closePath();
  return s;
}

function makeFeltGeometry() {
  const g = new THREE.ExtrudeGeometry(surface(), { depth: FELT_THICKNESS, bevelEnabled: false, curveSegments: CURVE });
  g.rotateX(-PI / 2);
  g.translate(0, FRAME_TOP, 0);
  return g;
}

function makeClothGeometry() {
  const g = new THREE.ShapeGeometry(surface(), CURVE), positions = g.attributes.position, uv = new Float32Array(positions.count * 2);
  for (let i = 0; i < positions.count; i++) {
    uv[i * 2] = (positions.getX(i) + PLAY_W / 2) / PLAY_W;
    uv[i * 2 + 1] = (positions.getY(i) + PLAY_H / 2) / PLAY_H;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.rotateX(-PI / 2);
  g.translate(0, CLOTH_Y, 0);
  return g;
}

function makeFrameGeometry() {
  const x = (TABLE_W + 0.4) / 2, z = (TABLE_H + 0.4) / 2, s = new THREE.Shape();
  s.moveTo(-x, -z);
  s.lineTo(x, -z);
  s.lineTo(x, z);
  s.lineTo(-x, z);
  s.closePath();
  for (const p of POCKETS) {
    const hole = new THREE.Path();
    hole.absarc(p.x, p.z, p.radius, 0, PI * 2, true);
    s.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: FRAME_TOP - FRAME_BOTTOM, bevelEnabled: false, curveSegments: CURVE });
  g.rotateX(-PI / 2);
  g.translate(0, FRAME_BOTTOM, 0);
  return g;
}

function makeLinerGeometry() {
  const height = FRAME_TOP + FELT_THICKNESS + 0.01 - FRAME_BOTTOM, parts = [];
  for (const p of POCKETS) {
    const r = p.radius - 5e-3, wall = new THREE.CylinderGeometry(r, r, height, CURVE, 1, true);
    wall.translate(p.x, FRAME_BOTTOM + height / 2, p.z);
    const floor = new THREE.CircleGeometry(r, CURVE);
    floor.rotateX(PI / 2);
    floor.translate(p.x, POCKET_FLOOR_Y, p.z);
    parts.push(wall, floor);
  }
  const g = mergeGeometries(parts);
  for (const part of parts) part.dispose();
  return g;
}

export {
  CLOTH_Y,
  CORNER_POCKET_R,
  FELT_THICKNESS,
  FRAME_BOTTOM,
  FRAME_TOP,
  POCKET_FLOOR_Y,
  POCKET_HOLES,
  SIDE_POCKET_R,
  makeClothGeometry,
  makeFeltGeometry,
  makeFrameGeometry,
  makeLinerGeometry
};
