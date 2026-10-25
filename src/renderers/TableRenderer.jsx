// src/renderers/TableRenderer.jsx
// Static scene: repeated meshes are merged once at module load. Materials are
// shared singletons (materials.js) so the Lab can restyle the table live.
// The playing surface, cloth overlay and table body have real holes at the
// pockets (see tableGeometry.js), so balls physically drop into them.

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { PLAY_W, PLAY_H, PLAY_X, PLAY_Z, CUSHION } from "../ecs/constants/table.js";
import { feltMat, clothMat, frameMat, railMat, trimMat, diamondMat, wellMat } from "./materials.js";
import { SIDE_POCKET_R, CORNER_POCKET_R, makeFeltGeometry, makeClothGeometry, makeFrameGeometry, makeLinerGeometry } from "./tableGeometry.js";

const RAIL_Y = 0.34, RAIL_H = 0.28, SIDE_GAP = SIDE_POCKET_R * 2.2, CORNER_GAP = CORNER_POCKET_R * 1.8;
const LONG_LEN = (PLAY_W - SIDE_GAP) / 2 - CORNER_GAP, LONG_X = PLAY_W / 4 + SIDE_GAP / 4;
function box(w, h, d, x, y, z, rotation = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.rotateY(rotation);
  g.translate(x, y, z);
  return g;
}

function merge(parts) {
  const g = mergeGeometries(parts);
  for (const p of parts) p.dispose();
  return g;
}

const rails = [], trim = [], diamonds = [];
for (const sz of [-1, 1]) {
  for (const sx of [-1, 1]) {
    rails.push(box(LONG_LEN, RAIL_H, CUSHION, sx * LONG_X, RAIL_Y, sz * PLAY_Z));
    rails.push(box(0.24, RAIL_H, 0.08, sx * (PLAY_X - 0.12), RAIL_Y, sz * (PLAY_Z - 0.12), sx * sz * Math.PI / 4));
    trim.push(box(LONG_LEN, 0.03, 0.05, sx * LONG_X, RAIL_Y + 0.08, sz * PLAY_Z));
  }
  for (const n of [-2, -1, 1, 2]) diamonds.push(box(0.05, 0.02, 0.05, n * 0.9, 0.48, sz * (PLAY_Z + 0.02), Math.PI / 4));
}

for (const sx of [-1, 1]) {
  rails.push(box(CUSHION, RAIL_H, PLAY_H - CORNER_GAP * 1.4, sx * PLAY_X, RAIL_Y, 0));
  for (const n of [-1, 1]) diamonds.push(box(0.05, 0.02, 0.05, sx * (PLAY_X + 0.02), 0.48, n * 0.5, Math.PI / 4));
}

const railsGeometry = merge(rails), trimGeometry = merge(trim), diamondsGeometry = merge(diamonds);
const feltGeometry = makeFeltGeometry(), clothGeometry = makeClothGeometry(), frameGeometry = makeFrameGeometry(), linerGeometry = makeLinerGeometry();

wellMat.side = THREE.BackSide;

function TableRenderer() {
  
  const texture = useTexture("/pool-table.png");
  const invalidate = useThree((state) => state.invalidate);
 
  useLayoutEffect(() => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(PLAY_W / 1.7, PLAY_H / 1.7);
    texture.needsUpdate = true;
    clothMat.map = texture;
    clothMat.needsUpdate = true;
    invalidate();
  }, [texture, invalidate]);

  return <group dispose={null}>
    <mesh geometry={frameGeometry} material={frameMat} receiveShadow />
    <mesh geometry={feltGeometry} material={feltMat} receiveShadow />
    <mesh geometry={clothGeometry} material={clothMat} />
    <mesh geometry={linerGeometry} material={wellMat} receiveShadow />
    <mesh geometry={railsGeometry} material={railMat} castShadow receiveShadow />
    <mesh geometry={trimGeometry} material={trimMat} />
    <mesh geometry={diamondsGeometry} material={diamondMat} />
  </group>;
}

export {
  TableRenderer as default
};
