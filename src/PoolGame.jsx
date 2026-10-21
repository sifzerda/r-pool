// src/PoolGame.jsx

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

import { setupGame } from "./ecs/setupGame";

import PoolScene from "./PoolScene";
import HUD from "./components/HUD";

const CONTAINER_STYLE = {
  width: "100%",
  height: "500px",
  position: "relative",
};

const CAMERA_POSITION = [0, 10, 0];
const CAMERA_ROTATION = [-Math.PI / 2, 0, 0];

export default function PoolGame() {
  const [cueBall, setCueBall] = useState(null);

  // Kept in an effect (not a lazy useState initialiser) so React StrictMode's
  // double invocation can't leave a stale cue ball that was removed from the world.
  useEffect(() => {
    setCueBall(setupGame());
  }, []);

  return (
    <div style={CONTAINER_STYLE}>
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

    </div>
  );
}