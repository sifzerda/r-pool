import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

import { setupGame } from "./ecs/setupGame";
import { usePoolStore } from "./store/poolStore";

import PoolScene from "./PoolScene";

export default function PoolGame() {
  const [cueBall, setCueBall] = useState(null);

  const gameStatus = usePoolStore(
    state => state.gameStatus
  );

  useEffect(() => {
    const cue = setupGame();

    setCueBall(cue);

    usePoolStore.getState().startGame();
  }, []);

  return (
    <div style={{
      width: "100%",
      height: "500px",
      position: "relative",
    }}>

      <Canvas shadows dpr={[1, 1.5]}>

        <OrthographicCamera
          makeDefault
          position={[0, 10, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          zoom={80}
        />

        {cueBall && (
          <PoolScene cueBall={cueBall} />
        )}

      </Canvas>

      {/* Outside Canvas: normal React UI */}

      <div style={{
        position: "absolute",
        top: 10,
        left: 10,
        color: "white",
      }}>
        {gameStatus}
      </div>

    </div>
  );
}