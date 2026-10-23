// src/renderers/TableRenderer.jsx
// Static scene: repeated meshes are merged once at module load. Materials are
// shared singletons (materials.js) so the Lab can restyle the table live.
// The playing surface, cloth overlay and table body have real holes at the
// pockets (see tableGeometry.js), so balls physically drop into them.

import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PLAY_W, PLAY_H, PLAY_X, PLAY_Z, CUSHION } from "../ecs/constants/table";
import {
  feltMat, clothMat, frameMat, railMat, trimMat, diamondMat, wellMat,
} from "./materials";
import {
  CORNER_POCKET_R, SIDE_POCKET_R,
  makeFeltGeometry, makeClothGeometry, makeFrameGeometry, makeLinerGeometry,
} from "./tableGeometry";

const RAIL_Y = 0.34;
const RAIL_H = 0.28;
const SIDE_GAP = SIDE_POCKET_R * 2.2;
const CORNER_GAP = CORNER_POCKET_R * 1.8;

// Long rails: split in the middle by the side pocket (two pieces per side).
const LONG_RAIL_LEN = (PLAY_W - SIDE_GAP) / 2 - CORNER_GAP;
const LONG_RAIL_X = PLAY_W / 4 + SIDE_GAP / 4;

// Short rails: one continuous piece per end.
const END_RAIL_LEN = PLAY_H - CORNER_GAP * 1.4;

// ─── geometry helpers ───────────────────────────

function box(w, h, d, x, y, z, rotY = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.rotateY(rotY);
  geo.translate(x, y, z);
  return geo;
}

// ─── merged static geometry ─────────────────────

const railParts = [];

for (const sz of [-1, 1]) {
  for (const sx of [-1, 1]) {
    // top / bottom rails (split by the middle pocket)
    railParts.push(box(LONG_RAIL_LEN, RAIL_H, CUSHION, sx * LONG_RAIL_X, RAIL_Y, sz * PLAY_Z));
    // corner pocket jaws
    railParts.push(
      box(0.24, RAIL_H, 0.08, sx * (PLAY_X - 0.12), RAIL_Y, sz * (PLAY_Z - 0.12), sx * sz * (Math.PI / 4))
    );
  }
}

// left / right rails: one continuous piece each
for (const sx of [-1, 1]) {
  railParts.push(box(CUSHION, RAIL_H, END_RAIL_LEN, sx * PLAY_X, RAIL_Y, 0));
}

const railsGeometry = mergeGeometries(railParts);

const trimGeometry = mergeGeometries([
  box(PLAY_W, 0.03, 0.05, 0, RAIL_Y + 0.08, -PLAY_Z),
  box(PLAY_W, 0.03, 0.05, 0, RAIL_Y + 0.08, PLAY_Z),
]);

const DIAMOND_Y = 0.48;
const diamondParts = [];

// Long rails: 2 diamonds either side of the middle pocket, on both rails.
for (const sz of [-1, 1]) {
  for (const n of [-2, -1, 1, 2]) {
    diamondParts.push(box(0.05, 0.02, 0.05, n * 0.9, DIAMOND_Y, sz * (PLAY_Z + 0.02), Math.PI / 4));
  }
}

// Short rails: 2 diamonds on each.
for (const sx of [-1, 1]) {
  for (const n of [-1, 1]) {
    diamondParts.push(box(0.05, 0.02, 0.05, sx * (PLAY_X + 0.02), DIAMOND_Y, n * 0.5, Math.PI / 4));
  }
}

const diamondsGeometry = mergeGeometries(diamondParts);

// Surface and body with real pocket holes, plus the dark cups lining each shaft.
const feltGeometry = makeFeltGeometry();
const clothGeometry = makeClothGeometry();
const frameGeometry = makeFrameGeometry();
const linerGeometry = makeLinerGeometry();

// The liner is an open cylinder + a downward-facing floor, so draw its inside.
wellMat.side = THREE.BackSide;
wellMat.needsUpdate = true;

export default function TableRenderer() {
  // Runs once when the texture loads and feeds the shared cloth overlay material.
  useTexture("/pool-table.png", (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(PLAY_W / 1.7, PLAY_H / 1.7);
    t.needsUpdate = true;

    clothMat.map = t;
    clothMat.needsUpdate = true;
  });

  return (
    <group>
      {/* Table body (wood frame), shafts cut through at each pocket */}
      <mesh geometry={frameGeometry} material={frameMat} receiveShadow />

      {/* Felt, notched at each pocket */}
      <mesh geometry={feltGeometry} material={feltMat} receiveShadow />

      {/* Felt texture overlay, same notches */}
      <mesh geometry={clothGeometry} material={clothMat} />

      {/* Pocket cups: dark wall and floor inside each shaft */}
      <mesh geometry={linerGeometry} material={wellMat} receiveShadow />

      {/* Rails + pocket jaws */}
      <mesh geometry={railsGeometry} material={railMat} castShadow receiveShadow />

      {/* Rail cap trim */}
      <mesh geometry={trimGeometry} material={trimMat} />

      {/* Diamonds */}
      <mesh geometry={diamondsGeometry} material={diamondMat} />
    </group>
  );
}