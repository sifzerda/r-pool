// src/renderers/PreviewRenderer.jsx

import { Suspense, useLayoutEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

import {
  TABLE_W,
  TABLE_H,
  BALL_Y,
} from "../ecs/constants/table.js";

import TableRenderer from "./TableRenderer.jsx";
import SceneLab from "../paintjob/SceneLab.jsx";
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

    camera.current.zoom = Math.max(
      1,
      Math.min(
        (width - 4) / (TABLE_W + 0.4),
        (height - 4) / (TABLE_H + 0.8)
      )
    );

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

// Shared cue materials from the game.
const CUE_PARTS = [
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

function CueSample() {
  const length = TABLE_W;

  return (
    <group
      position={[0, BALL_Y, TABLE_H / 2 + 0.35]}
    >
      {CUE_PARTS.map((part) => (
        <mesh
          key={part.name}
          castShadow
          position={[
            ((part.start + part.end - 1) * length) / 2,
            0,
            0,
          ]}
          rotation={[0, 0, -Math.PI / 2]}
        >
          <cylinderGeometry
            args={[
              part.radiusEnd,
              part.radiusStart,
              (part.end - part.start) * length,
              24,
            ]}
          />

          <primitive
            object={part.material}
            attach="material"
            dispose={null}
          />
        </mesh>
      ))}
    </group>
  );
}

function filenameForPreset(preset) {
  return String(preset || "default")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function saveScreenshot(canvas, preset) {
  if (!canvas) return;

  const filename = `${filenameForPreset(preset)}.webp`;

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        console.error("Unable to capture table preview.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      // Release the temporary download URL.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    "image/webp",
    0.9
  );
}

export default function PreviewRenderer({
  preset = "default",
  className = "",
}) {
  const canvasRef = useRef(null);

  return (
    <div
      className={`relative h-full min-h-60 w-full overflow-hidden ${className}`}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{
          powerPreference: "low-power",
          preserveDrawingBuffer: true,
        }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
        }}
        aria-label="Table and cue preview"
      >
        <PreviewCamera />

        <Suspense fallback={null}>
          <SceneLab />
          <TableRenderer />
          <CueSample />
        </Suspense>
      </Canvas>

      <button
        type="button"
        onClick={() =>
          saveScreenshot(canvasRef.current, preset)
        }
        className="absolute bottom-3 right-3 z-10 cursor-pointer rounded-md border border-cyan-300/50 bg-[#091a32]/95 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-cyan-100 shadow-lg transition-colors hover:bg-cyan-400/20"
      >
        Save Screenshot
      </button>
    </div>
  );
}
