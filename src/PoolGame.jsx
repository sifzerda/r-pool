// src/PoolGame.jsx

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

import { setupGame } from "./ecs/setupGame";
import { usePoolStore } from "./store/poolStore";

import PoolScene from "./PoolScene";

const CONTAINER_STYLE = {
  width: "100%",
  height: "500px",
  position: "relative",
};

const STATUS_STYLE = {
  position: "absolute",
  top: 10,
  left: 10,
  color: "white",
};

const CAMERA_POSITION = [0, 10, 0];
const CAMERA_ROTATION = [-Math.PI / 2, 0, 0];

export default function PoolGame() {
  const [cueBall, setCueBall] = useState(null);
  const gameStatus = usePoolStore((state) => state.gameStatus);

  // Kept in an effect (not a lazy useState initialiser) so React StrictMode's
  // double invocation can't leave a stale cue ball that was removed from the world.
  useEffect(() => {
    setCueBall(setupGame());
    usePoolStore.getState().startGame();
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

      <div style={STATUS_STYLE}>{gameStatus}</div>
    </div>
  );
}