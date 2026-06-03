// src/PoolGame.jsx
import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { setupGame } from "./ecs/setupGame";
import PoolScene from "./PoolScene";

export default function PoolGame() {
  const [cueBall, setCueBall] = useState(null);

  useEffect(() => {
    setCueBall(setupGame());
  }, []);

  return (

    <div style={{ 
      width: '100%', 
      height: '500px', 
      position: 'relative' 
      }}>

      <Canvas shadows={{enabled: true}} dpr={[1, 1.5]}>
        <OrthographicCamera
          makeDefault
          position={[0, 10, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          zoom={80}
        />

        {cueBall && (<PoolScene cueBall={cueBall} />)}
      </Canvas>

    </div>
  );
}
