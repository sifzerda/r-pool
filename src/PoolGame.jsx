// src/PoolGame.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { world } from "./ecs/world";
import { setupGame } from "./ecs/setupGame.js";

import PoolScene from "./PoolScene";

export default function PoolGame() {

  useEffect(() => {
    setupGame();
  }, []);
  
  return (
    <Canvas shadows>
      <OrthographicCamera
        makeDefault
        position={[0, 10, 0]}
        rotation={[ -Math.PI / 2, 0, 0 ]}
        zoom={110}
      />

      <PoolScene />
    </Canvas>
  );
}