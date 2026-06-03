// src/ecs/components/PoolTable.jsx
// table contains pockets

import { TABLE_W, TABLE_H, CUSHION, PLAY_W, PLAY_H, PLAY_X, PLAY_Z } from "../ecs/constants/table.js";

export default function PoolTable() {

  const railHeight = 0.28;
  const railY = 0.34;
  const pocketRadius = 0.24;

  return (
    <group>

      {/* TABLE BASE */}

      <mesh receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[TABLE_W, 0.4, TABLE_H]} />
        <meshStandardMaterial
          color="#4b2e18" />
      </mesh>

      {/* FELT */}

      <mesh receiveShadow position={[0, 0.21, 0]}>
        <boxGeometry args={[PLAY_W, 0.02, PLAY_H]} />
        <meshStandardMaterial color="#15603a" roughness={1} />
      </mesh>

      {/* TOP RAIL */}

      <mesh position={[0, railY, -PLAY_Z]} castShadow>
        <boxGeometry args={[PLAY_W, railHeight, CUSHION]} />
        <meshStandardMaterial color="#5b3418" />
      </mesh>

      {/* BOTTOM RAIL */}

      <mesh position={[0, railY, PLAY_Z]} castShadow>
        <boxGeometry args={[PLAY_W, railHeight, CUSHION]} />
        <meshStandardMaterial color="#5b3418" />
      </mesh>

      {/* LEFT RAIL */}

      <mesh position={[-PLAY_X, railY, 0]} castShadow>
        <boxGeometry args={[CUSHION, railHeight, PLAY_H]} />
        <meshStandardMaterial color="#5b3418" />
      </mesh>

      {/* RIGHT RAIL */}

      <mesh position={[PLAY_X, railY, 0]}
        castShadow>
        <boxGeometry args={[CUSHION, railHeight, PLAY_H]} />
        <meshStandardMaterial color="#5b3418" />
      </mesh>

      {/* POCKET WELLS */}

      {[
        [-PLAY_X, -PLAY_Z],
        [0, -PLAY_Z],
        [PLAY_X, -PLAY_Z],

        [-PLAY_X, PLAY_Z],
        [0, PLAY_Z],
        [PLAY_X, PLAY_Z],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]} receiveShadow>
          <cylinderGeometry args={[pocketRadius, pocketRadius, 0.2, 24]} />
          <meshStandardMaterial color="#050505" roughness={1} metalness={0} />
        </mesh>
      ))}

      {/* cushion diamonds */}
      {[-2, -1, 1, 2].map((n, i) => (
        <mesh key={`diamond-${i}`} position={[n * 0.9, 0.48, -1.68]}
          rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.05, 0.02, 0.05]} />
          <meshStandardMaterial color="#f0d080" />
        </mesh>
      ))}

    </group>
  );
}