// src/renderers/PreviewRenderer.jsx

// renders preview visual of table preset in settings

import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { TABLE_W, TABLE_H, BALL_Y } from "../ecs/constants/table.js";
import TableRenderer from "../renderers/TableRenderer.jsx";
import SceneLab from "../lab/SceneLab.jsx";
import * as M from "./TableRenderer.jsx";

const CAMERA_POSITION = [0, 10, 0];
const CAMERA_ROTATION = [-Math.PI / 2, 0, 0];

function PreviewCamera() {
  const camera = useRef(null);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    if (!camera.current) return;

    camera.current.zoom = Math.max(1, Math.min((width - 20) / (TABLE_W + 1.6), (height - 20) / (TABLE_H + 2.4)));

    camera.current.updateProjectionMatrix();
    invalidate();
  }, [width, height, invalidate]);

  return (
    <OrthographicCamera
      ref={camera}
      makeDefault
      position={CAMERA_POSITION}
      rotation={CAMERA_ROTATION}
      zoom={40}
      near={0.1}
      far={100}
    />
  );
}

// Stationary cue sample using the game's shared cue materials.
// No physics or aiming controls are needed.
function CueSample() {
  const length = TABLE_W * 0.8;

  const parts = [
    {
      name: "butt",
      start: 0,
      end: 0.28,
      radiusStart: 0.045,
      radiusEnd: 0.04,
      material: M.stickButtMat,
    },
    {
      name: "accent",
      start: 0.28,
      end: 0.31,
      radiusStart: 0.041,
      radiusEnd: 0.04,
      material: M.stickAccentMat,
    },
    {
      name: "shaft",
      start: 0.31,
      end: 0.92,
      radiusStart: 0.04,
      radiusEnd: 0.019,
      material: M.stickShaftMat,
    },
    {
      name: "ferrule",
      start: 0.92,
      end: 0.97,
      radiusStart: 0.019,
      radiusEnd: 0.018,
      material: M.stickFerruleMat,
    },
    {
      name: "tip",
      start: 0.97,
      end: 1,
      radiusStart: 0.018,
      radiusEnd: 0.018,
      material: M.stickTipMat,
    },
  ];

  return (
    <group position={[0, BALL_Y, TABLE_H / 2 + 0.8]}>
      {parts.map((part) => (
        <mesh key={part.name} castShadow
          position={[((part.start + part.end - 1) * length) / 2, 0, 0]}
          rotation={[0, 0, -Math.PI / 2]}>
          <cylinderGeometry args={[part.radiusEnd, part.radiusStart, (part.end - part.start) * length, 24]} />

          {/* Shared materials must survive preview unmounting. */}
          <primitive object={part.material} attach="material" dispose={null} />
        </mesh>
      ))}
    </group>
  );
}

export default function Preview() {
  return (
    <Canvas shadows dpr={[1, 1.5]} frameloop="demand"
      gl={{ powerPreference: "low-power" }}
      aria-label="Table and cue preview">
      <PreviewCamera />

      <Suspense fallback={null}>
        <SceneLab />
        <TableRenderer />
        <CueSample />
      </Suspense>
    </Canvas>
  );
}