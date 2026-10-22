// src/PoolGame.jsx

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

import { setupGame } from "./ecs/setupGame";

import PoolScene from "./PoolScene";
import HUD from "./components/HUD";
import LabPanel from "./lab/LabPanel";

const CONTAINER_STYLE = {
  width: "100%",
  height: "560px",
  display: "flex",
};

const STAGE_STYLE = {
  position: "relative",
  flex: 1,
  minWidth: 0,
};

const LAB_BUTTON_STYLE = {
  position: "absolute",
  top: 10,
  right: 10,
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid #3a3a45",
  background: "rgba(22,22,26,.85)",
  color: "#e8e8ee",
  font: "600 12px system-ui, sans-serif",
  cursor: "pointer",
};

const CAMERA_POSITION = [0, 10, 0];
const CAMERA_ROTATION = [-Math.PI / 2, 0, 0];

export default function PoolGame() {
  const [cueBall, setCueBall] = useState(null);
  const [labOpen, setLabOpen] = useState(false);

  // Kept in an effect (not a lazy useState initialiser) so React StrictMode's
  // double invocation can't leave a stale cue ball that was removed from the world.
  useEffect(() => {
    setCueBall(setupGame());
  }, []);

  return (
    <div style={CONTAINER_STYLE}>
      <div style={STAGE_STYLE}>
        <Canvas shadows dpr={[1, 1.5]} frameloop="demand">
          <OrthographicCamera
            makeDefault
            position={CAMERA_POSITION}
            rotation={CAMERA_ROTATION}
            zoom={80}
          />

          {cueBall && <PoolScene cueBall={cueBall} />}
        </Canvas>

        <HUD />

        {!labOpen && (
          <button style={LAB_BUTTON_STYLE} onClick={() => setLabOpen(true)}>
            Lab
          </button>
        )}
      </div>

      {labOpen && <LabPanel onClose={() => setLabOpen(false)} />}
    </div>
  );
}