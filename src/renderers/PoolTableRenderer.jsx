// src/ecs/components/PoolTableRenderer.jsx
// table contains pockets

import { TABLE_W, TABLE_H, CUSHION, PLAY_W, PLAY_H, PLAY_X, PLAY_Z } from "../ecs/constants/table";
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

export default function PoolTableRenderer() {
  const railHeight = 0.28;
  const railY = 0.34;

  const CORNER_POCKET_R = 0.28;
  const SIDE_POCKET_R = 0.22;

  const sideGap = SIDE_POCKET_R * 2.2;
  const cornerGap = CORNER_POCKET_R * 1.8;

  const topRailLength = (PLAY_W - sideGap) / 2 - cornerGap;

  // For bg felt
  const pixelTexture = useTexture('/pool-table.png')
  pixelTexture.wrapS = pixelTexture.wrapT = THREE.RepeatWrapping
  pixelTexture.repeat.set(PLAY_W / 1.7, PLAY_H / 1.7)

  return (
    <group>

      {/* ========================================= */}
      {/* OUTER WOOD FRAME */}
      {/* ========================================= */}

      <mesh receiveShadow position={[0, -0.05, 0]}>
        <boxGeometry
          args={[
            TABLE_W + 0.4,
            0.5,
            TABLE_H + 0.4,
          ]}
        />
        <meshStandardMaterial
          color="#3a1f0f"
          roughness={0.8}
        />
      </mesh>

      {/* ========================================= */}
      {/* TABLE BASE */}
      {/* ========================================= */}

      <mesh receiveShadow>
        <boxGeometry
          args={[TABLE_W, 0.4, TABLE_H]}
        />
        <meshStandardMaterial
          color="#5b3418"
          roughness={0.7}
        />
      </mesh>

      {/* ========================================= */}
      {/* FELT */}
      {/* ========================================= */}

      <mesh receiveShadow position={[0, 0.21, 0]}>
        <boxGeometry args={[PLAY_W, 0.02, PLAY_H]} />
        <meshStandardMaterial color="#008000" roughness={0.95} />
      </mesh>

      {/* cream-pixels texture overlay — screen blend, 35% opacity */}
      <mesh position={[0, 0.221, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[PLAY_W, PLAY_H]} />
        <meshBasicMaterial
          map={pixelTexture}
          transparent
          blending={THREE.AdditiveBlending}
          opacity={1.0}
          depthWrite={false}
        />
      </mesh>

      {/* ========================================= */}
      {/* TOP RAILS */}
      {/* ========================================= */}

      <mesh
        position={[
          -(PLAY_W / 4 + sideGap / 4),
          railY,
          -PLAY_Z,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            topRailLength,
            railHeight,
            CUSHION,
          ]}
        />
        <meshStandardMaterial
          color="#5b3418"
        />
      </mesh>

      <mesh
        position={[
          PLAY_W / 4 + sideGap / 4,
          railY,
          -PLAY_Z,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            topRailLength,
            railHeight,
            CUSHION,
          ]}
        />
        <meshStandardMaterial
          color="#5b3418"
        />
      </mesh>

      {/* ========================================= */}
      {/* BOTTOM RAILS */}
      {/* ========================================= */}

      <mesh
        position={[
          -(PLAY_W / 4 + sideGap / 4),
          railY,
          PLAY_Z,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            topRailLength,
            railHeight,
            CUSHION,
          ]}
        />
        <meshStandardMaterial
          color="#5b3418"
        />
      </mesh>

      <mesh
        position={[
          PLAY_W / 4 + sideGap / 4,
          railY,
          PLAY_Z,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            topRailLength,
            railHeight,
            CUSHION,
          ]}
        />
        <meshStandardMaterial
          color="#5b3418"
        />
      </mesh>

      {/* ========================================= */}
      {/* LEFT RAILS */}
      {/* ========================================= */}

      <mesh
        position={[
          -PLAY_X,
          railY,
          -(PLAY_H / 4),
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            CUSHION,
            railHeight,
            PLAY_H / 2 - cornerGap,
          ]}
        />
        <meshStandardMaterial
          color="#5b3418"
        />
      </mesh>

      <mesh
        position={[
          -PLAY_X,
          railY,
          PLAY_H / 4,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            CUSHION,
            railHeight,
            PLAY_H / 2 - cornerGap,
          ]}
        />
        <meshStandardMaterial
          color="#5b3418"
        />
      </mesh>

      {/* ========================================= */}
      {/* RIGHT RAILS */}
      {/* ========================================= */}

      <mesh
        position={[
          PLAY_X,
          railY,
          -(PLAY_H / 4),
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            CUSHION,
            railHeight,
            PLAY_H / 2 - cornerGap,
          ]}
        />
        <meshStandardMaterial
          color="#5b3418"
        />
      </mesh>

      <mesh
        position={[
          PLAY_X,
          railY,
          PLAY_H / 4,
        ]}
        castShadow
      >
        <boxGeometry
          args={[
            CUSHION,
            railHeight,
            PLAY_H / 2 - cornerGap,
          ]}
        />
        <meshStandardMaterial
          color="#5b3418"
        />
      </mesh>

      {/* ========================================= */}
      {/* POCKET JAWS */}
      {/* ========================================= */}

      {[
        [-PLAY_X + 0.12, -PLAY_Z + 0.12, Math.PI / 4],
        [PLAY_X - 0.12, -PLAY_Z + 0.12, -Math.PI / 4],

        [-PLAY_X + 0.12, PLAY_Z - 0.12, -Math.PI / 4],
        [PLAY_X - 0.12, PLAY_Z - 0.12, Math.PI / 4],
      ].map(([x, z, rot], i) => (
        <mesh
          key={i}
          position={[x, railY, z]}
          rotation={[0, rot, 0]}
          castShadow
        >
          <boxGeometry
            args={[0.24, railHeight, 0.08]}
          />
          <meshStandardMaterial
            color="#5b3418"
          />
        </mesh>
      ))}

      {/* ========================================= */}
      {/* POCKET WELLS */}
      {/* ========================================= */}

      {[
        {
          x: -PLAY_X,
          z: -PLAY_Z,
          r: CORNER_POCKET_R,
        },
        {
          x: 0,
          z: -PLAY_Z,
          r: SIDE_POCKET_R,
        },
        {
          x: PLAY_X,
          z: -PLAY_Z,
          r: CORNER_POCKET_R,
        },
        {
          x: -PLAY_X,
          z: PLAY_Z,
          r: CORNER_POCKET_R,
        },
        {
          x: 0,
          z: PLAY_Z,
          r: SIDE_POCKET_R,
        },
        {
          x: PLAY_X,
          z: PLAY_Z,
          r: CORNER_POCKET_R,
        },
      ].map((pocket, i) => (
        <mesh
          key={i}
          position={[
            pocket.x,
            0.35,
            pocket.z,
          ]}
          receiveShadow
        >
          <cylinderGeometry
            args={[
              pocket.r,
              pocket.r * 0.9,
              0.22,
              32,
            ]}
          />
          <meshStandardMaterial
            color="#120c08"
            roughness={1}
          />
        </mesh>
      ))}

      {/* ========================================= */}
      {/* RAIL CAP TRIM */}
      {/* ========================================= */}

      <mesh
        position={[0, railY + 0.08, -PLAY_Z]}
      >
        <boxGeometry
          args={[PLAY_W, 0.03, 0.05]}
        />
        <meshStandardMaterial
          color="#7b4a25"
        />
      </mesh>

      <mesh
        position={[0, railY + 0.08, PLAY_Z]}
      >
        <boxGeometry
          args={[PLAY_W, 0.03, 0.05]}
        />
        <meshStandardMaterial
          color="#7b4a25"
        />
      </mesh>

      {/* ========================================= */}
      {/* DIAMONDS */}
      {/* ========================================= */}

      {[-2, -1, 1, 2].map((n) => (
        <mesh
          key={`top-${n}`}
          position={[
            n * 0.9,
            0.48,
            -PLAY_Z - 0.02,
          ]}
          rotation={[
            0,
            Math.PI / 4,
            0,
          ]}
        >
          <boxGeometry
            args={[0.05, 0.02, 0.05]}
          />
          <meshStandardMaterial
            color="#f0d080"
          />
        </mesh>
      ))}

    </group>
  );
}