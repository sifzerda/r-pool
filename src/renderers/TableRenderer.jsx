// src/renderers/TableRenderer.jsx
// Static scene: all repeated meshes are merged once at module load, so the
// table is 8 draw calls instead of ~35 (and half that again in the shadow pass).

import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { TABLE_W, TABLE_H, CUSHION, PLAY_W, PLAY_H, PLAY_X, PLAY_Z } from "../ecs/constants/table";

const RAIL_Y = 0.34;
const RAIL_H = 0.28;
const CORNER_POCKET_R = 0.28;
const SIDE_POCKET_R = 0.22;
const SIDE_GAP = SIDE_POCKET_R * 2.2;
const CORNER_GAP = CORNER_POCKET_R * 1.8;

const LONG_RAIL_LEN = (PLAY_W - SIDE_GAP) / 2 - CORNER_GAP;
const LONG_RAIL_X = PLAY_W / 4 + SIDE_GAP / 4;
const END_RAIL_LEN = PLAY_H / 2 - CORNER_GAP;
const END_RAIL_Z = PLAY_H / 4;

// ─── geometry helpers ───────────────────────────

function box(w, h, d, x, y, z, rotY = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.rotateY(rotY);
  geo.translate(x, y, z);
  return geo;
}

function well(x, z, r) {
  const geo = new THREE.CylinderGeometry(r, r * 0.9, 0.22, 32);
  geo.translate(x, 0.35, z);
  return geo;
}

// ─── merged static geometry ─────────────────────

const railParts = [];

for (const sz of [-1, 1]) {
  for (const sx of [-1, 1]) {
    // top / bottom rails (split by the middle pocket)
    railParts.push(box(LONG_RAIL_LEN, RAIL_H, CUSHION, sx * LONG_RAIL_X, RAIL_Y, sz * PLAY_Z));
    // left / right rails
    railParts.push(box(CUSHION, RAIL_H, END_RAIL_LEN, sx * PLAY_X, RAIL_Y, sz * END_RAIL_Z));
    // corner pocket jaws
    railParts.push(
      box(0.24, RAIL_H, 0.08, sx * (PLAY_X - 0.12), RAIL_Y, sz * (PLAY_Z - 0.12), sx * sz * (Math.PI / 4))
    );
  }
}

const railsGeometry = mergeGeometries(railParts);

const trimGeometry = mergeGeometries([
  box(PLAY_W, 0.03, 0.05, 0, RAIL_Y + 0.08, -PLAY_Z),
  box(PLAY_W, 0.03, 0.05, 0, RAIL_Y + 0.08, PLAY_Z),
]);

const diamondsGeometry = mergeGeometries(
  [-2, -1, 1, 2].map((n) => box(0.05, 0.02, 0.05, n * 0.9, 0.48, -PLAY_Z - 0.02, Math.PI / 4))
);

const wellsGeometry = mergeGeometries([
  well(-PLAY_X, -PLAY_Z, CORNER_POCKET_R),
  well(0, -PLAY_Z, SIDE_POCKET_R),
  well(PLAY_X, -PLAY_Z, CORNER_POCKET_R),
  well(-PLAY_X, PLAY_Z, CORNER_POCKET_R),
  well(0, PLAY_Z, SIDE_POCKET_R),
  well(PLAY_X, PLAY_Z, CORNER_POCKET_R),
]);

// ─── shared materials ───────────────────────────

const railMat = new THREE.MeshStandardMaterial({ color: "#5b3418" });
const trimMat = new THREE.MeshStandardMaterial({ color: "#7b4a25" });
const diamondMat = new THREE.MeshStandardMaterial({ color: "#f0d080" });
const wellMat = new THREE.MeshStandardMaterial({ color: "#120c08", roughness: 1 });

export default function TableRenderer() {
  // Runs once when the texture loads instead of mutating it on every render.
  const pixelTexture = useTexture("/pool-table.png", (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(PLAY_W / 1.7, PLAY_H / 1.7);
    t.needsUpdate = true;
  });

  return (
    <group>
      {/* Outer wood frame */}
      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[TABLE_W + 0.4, 0.5, TABLE_H + 0.4]} />
        <meshStandardMaterial color="#3a1f0f" roughness={0.8} />
      </mesh>

      {/* Table base */}
      <mesh receiveShadow>
        <boxGeometry args={[TABLE_W, 0.4, TABLE_H]} />
        <meshStandardMaterial color="#5b3418" roughness={0.7} />
      </mesh>

      {/* Felt */}
      <mesh receiveShadow position={[0, 0.21, 0]}>
        <boxGeometry args={[PLAY_W, 0.02, PLAY_H]} />
        <meshStandardMaterial color="#008000" roughness={0.95} />
      </mesh>

      {/* Felt texture overlay */}
      <mesh position={[0, 0.221, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PLAY_W, PLAY_H]} />
        <meshBasicMaterial
          map={pixelTexture}
          transparent
          blending={THREE.AdditiveBlending}
          opacity={1}
          depthWrite={false}
        />
      </mesh>

      {/* Rails + pocket jaws */}
      <mesh geometry={railsGeometry} material={railMat} castShadow />

      {/* Pocket wells */}
      <mesh geometry={wellsGeometry} material={wellMat} receiveShadow />

      {/* Rail cap trim */}
      <mesh geometry={trimGeometry} material={trimMat} />

      {/* Diamonds */}
      <mesh geometry={diamondsGeometry} material={diamondMat} />
    </group>
  );
}