// src/renderers/TableRenderer.jsx
// Static scene: repeated meshes are merged once at module load. Materials are
// shared singletons (materials.js) so the Lab can restyle the table live.
// The playing surface, cloth overlay and table body have real holes at the
// pockets (see tableGeometry.js), so balls physically drop into them.

// src/renderers/TableRenderer.jsx

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import {
  TABLE_W,
  TABLE_H,
  PLAY_W,
  PLAY_H,
  PLAY_X,
  PLAY_Z,
  CUSHION,
  FRAME_BOTTOM,
  FRAME_TOP,
  FELT_THICKNESS,
  CLOTH_Y,
  POCKET_FLOOR_Y,
  CORNER_POCKET_R,
  SIDE_POCKET_R,
} from "../ecs/constants/table.js";

import { POCKETS } from "../ecs/constants/pockets.js";

/* -------------------- SHARED MATERIALS -------------------- */

const feltMat = new THREE.MeshPhysicalMaterial({
  color: "#008000",
  roughness: 0.95,
  sheen: 0,
  sheenRoughness: 0.5,
});

const clothMat = new THREE.MeshBasicMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  opacity: 1,
  depthWrite: false,
});

const frameMat = new THREE.MeshStandardMaterial({
  color: "#3a1f0f",
  roughness: 0.8,
});

const baseMat = new THREE.MeshStandardMaterial({
  color: "#5b3418",
  roughness: 0.7,
});

const railMat = new THREE.MeshStandardMaterial({
  color: "#5b3418",
});

const trimMat = new THREE.MeshStandardMaterial({
  color: "#7b4a25",
});

const diamondMat = new THREE.MeshStandardMaterial({
  color: "#f0d080",
});

const wellMat = new THREE.MeshStandardMaterial({
  color: "#120c08",
  roughness: 1,
  side: THREE.BackSide,
});

const stickTipMat = new THREE.MeshStandardMaterial({
  color: "#5c3317",
  roughness: 0.9,
});

const stickFerruleMat = new THREE.MeshStandardMaterial({
  color: "#f0ede8",
  roughness: 0.3,
  metalness: 0.1,
});

const stickShaftMat = new THREE.MeshStandardMaterial({
  color: "#d4a84b",
  roughness: 0.25,
  metalness: 0.05,
});

const stickAccentMat = new THREE.MeshStandardMaterial({
  color: "#c8a030",
  roughness: 0.2,
  metalness: 0.6,
  emissive: "#c8a030",
  emissiveIntensity: 0.3,
});

const stickButtMat = new THREE.MeshStandardMaterial({
  color: "#1a0e06",
  roughness: 0.95,
});

const labMaterials = [
  feltMat,
  frameMat,
  baseMat,
  railMat,
  trimMat,
  diamondMat,
  wellMat,
  stickTipMat,
  stickFerruleMat,
  stickShaftMat,
  stickAccentMat,
  stickButtMat,
];

/* -------------------- GEOMETRY HELPERS -------------------- */

const CURVE = 32;
const PI = Math.PI;

const POCKET_HOLES = POCKETS.map((p) => [
  p.x,
  p.z,
  p.radius,
]);

function merge(parts) {
  const geometry = mergeGeometries(parts);

  for (const part of parts) {
    part.dispose();
  }

  return geometry;
}

function box(w, h, d, x, y, z, rotation = 0) {
  const geometry = new THREE.BoxGeometry(w, h, d);

  geometry.rotateY(rotation);
  geometry.translate(x, y, z);

  return geometry;
}

// Outline of the playing surface, including pocket openings.
function surface() {
  const c = CORNER_POCKET_R;
  const r = SIDE_POCKET_R;
  const shape = new THREE.Shape();

  shape.moveTo(-PLAY_X + c, -PLAY_Z);
  shape.lineTo(-r, -PLAY_Z);
  shape.absarc(0, -PLAY_Z, r, PI, 0, true);

  shape.lineTo(PLAY_X - c, -PLAY_Z);
  shape.absarc(PLAY_X, -PLAY_Z, c, PI, PI / 2, true);

  shape.lineTo(PLAY_X, PLAY_Z - c);
  shape.absarc(PLAY_X, PLAY_Z, c, -PI / 2, -PI, true);

  shape.lineTo(r, PLAY_Z);
  shape.absarc(0, PLAY_Z, r, 0, -PI, true);

  shape.lineTo(-PLAY_X + c, PLAY_Z);
  shape.absarc(-PLAY_X, PLAY_Z, c, 0, -PI / 2, true);

  shape.lineTo(-PLAY_X, -PLAY_Z + c);
  shape.absarc(-PLAY_X, -PLAY_Z, c, PI / 2, 0, true);

  shape.closePath();

  return shape;
}

function makeFeltGeometry() {
  const geometry = new THREE.ExtrudeGeometry(surface(), {
    depth: FELT_THICKNESS,
    bevelEnabled: false,
    curveSegments: CURVE,
  });

  geometry.rotateX(-PI / 2);
  geometry.translate(0, FRAME_TOP, 0);

  return geometry;
}

function makeClothGeometry() {
  const geometry = new THREE.ShapeGeometry(surface(), CURVE);
  const positions = geometry.attributes.position;
  const uv = new Float32Array(positions.count * 2);

  for (let i = 0; i < positions.count; i++) {
    uv[i * 2] = (positions.getX(i) + PLAY_W / 2) / PLAY_W;
    uv[i * 2 + 1] = (positions.getY(i) + PLAY_H / 2) / PLAY_H;
  }

  geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(uv, 2),
  );

  geometry.rotateX(-PI / 2);
  geometry.translate(0, CLOTH_Y, 0);

  return geometry;
}

function makeFrameGeometry() {
  const x = (TABLE_W + 0.4) / 2;
  const z = (TABLE_H + 0.4) / 2;
  const shape = new THREE.Shape();

  shape.moveTo(-x, -z);
  shape.lineTo(x, -z);
  shape.lineTo(x, z);
  shape.lineTo(-x, z);
  shape.closePath();

  for (const pocket of POCKETS) {
    const hole = new THREE.Path();

    hole.absarc(
      pocket.x,
      pocket.z,
      pocket.radius,
      0,
      PI * 2,
      true,
    );

    shape.holes.push(hole);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: FRAME_TOP - FRAME_BOTTOM,
    bevelEnabled: false,
    curveSegments: CURVE,
  });

  geometry.rotateX(-PI / 2);
  geometry.translate(0, FRAME_BOTTOM, 0);

  return geometry;
}

function makeLinerGeometry() {
  const height =
    FRAME_TOP + FELT_THICKNESS + 0.01 - FRAME_BOTTOM;

  const parts = [];

  for (const pocket of POCKETS) {
    const radius = pocket.radius - 0.005;

    const wall = new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      CURVE,
      1,
      true,
    );

    wall.translate(
      pocket.x,
      FRAME_BOTTOM + height / 2,
      pocket.z,
    );

    const floor = new THREE.CircleGeometry(radius, CURVE);

    floor.rotateX(PI / 2);
    floor.translate(pocket.x, POCKET_FLOOR_Y, pocket.z);

    parts.push(wall, floor);
  }

  return merge(parts);
}

/* -------------------- STATIC TABLE GEOMETRY -------------------- */

const RAIL_Y = 0.34;
const RAIL_H = 0.28;
const SIDE_GAP = SIDE_POCKET_R * 2.2;
const CORNER_GAP = CORNER_POCKET_R * 1.8;

const LONG_LEN = (PLAY_W - SIDE_GAP) / 2 - CORNER_GAP;
const LONG_X = PLAY_W / 4 + SIDE_GAP / 4;

const rails = [];
const trim = [];
const diamonds = [];

for (const sz of [-1, 1]) {
  for (const sx of [-1, 1]) {
    rails.push(
      box(
        LONG_LEN,
        RAIL_H,
        CUSHION,
        sx * LONG_X,
        RAIL_Y,
        sz * PLAY_Z,
      ),
      box(
        0.24,
        RAIL_H,
        0.08,
        sx * (PLAY_X - 0.12),
        RAIL_Y,
        sz * (PLAY_Z - 0.12),
        (sx * sz * PI) / 4,
      ),
    );

    trim.push(
      box(
        LONG_LEN,
        0.03,
        0.05,
        sx * LONG_X,
        RAIL_Y + 0.08,
        sz * PLAY_Z,
      ),
    );
  }

  for (const n of [-2, -1, 1, 2]) {
    diamonds.push(
      box(
        0.05,
        0.02,
        0.05,
        n * 0.9,
        0.48,
        sz * (PLAY_Z + 0.02),
        PI / 4,
      ),
    );
  }
}

for (const sx of [-1, 1]) {
  rails.push(
    box(
      CUSHION,
      RAIL_H,
      PLAY_H - CORNER_GAP * 1.4,
      sx * PLAY_X,
      RAIL_Y,
      0,
    ),
  );

  for (const n of [-1, 1]) {
    diamonds.push(
      box(
        0.05,
        0.02,
        0.05,
        sx * (PLAY_X + 0.02),
        0.48,
        n * 0.5,
        PI / 4,
      ),
    );
  }
}

const railsGeometry = merge(rails);
const trimGeometry = merge(trim);
const diamondsGeometry = merge(diamonds);

const feltGeometry = makeFeltGeometry();
const clothGeometry = makeClothGeometry();
const frameGeometry = makeFrameGeometry();
const linerGeometry = makeLinerGeometry();

/* -------------------- RENDERER -------------------- */

function TableRenderer() {
  const texture = useTexture("/pool-table.png");
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    texture.repeat.set(
      PLAY_W / 1.7,
      PLAY_H / 1.7,
    );

    texture.needsUpdate = true;

    clothMat.map = texture;
    clothMat.needsUpdate = true;

    invalidate();
  }, [texture, invalidate]);

  return (
    <group dispose={null}>
      <mesh
        geometry={frameGeometry}
        material={frameMat}
        receiveShadow
      />

      <mesh
        geometry={feltGeometry}
        material={feltMat}
        receiveShadow
      />

      <mesh
        geometry={clothGeometry}
        material={clothMat}
      />

      <mesh
        geometry={linerGeometry}
        material={wellMat}
        receiveShadow
      />

      <mesh
        geometry={railsGeometry}
        material={railMat}
        castShadow
        receiveShadow
      />

      <mesh
        geometry={trimGeometry}
        material={trimMat}
      />

      <mesh
        geometry={diamondsGeometry}
        material={diamondMat}
      />
    </group>
  );
}

export default TableRenderer;

export {
  baseMat,
  clothMat,
  diamondMat,
  feltMat,
  frameMat,
  labMaterials,
  railMat,
  stickAccentMat,
  stickButtMat,
  stickFerruleMat,
  stickShaftMat,
  stickTipMat,
  trimMat,
  wellMat,
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
  makeLinerGeometry,
};