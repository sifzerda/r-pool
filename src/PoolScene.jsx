// src/PoolScene.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { world, balls } from "./ecs/world";

import PoolTable from "./renderers/PoolTable";
import PoolBalls from "./renderers/PoolBalls";
//import CueStick from "./renderers/CueStick";

import { physicsSystem } from "./ecs/systems/physicsSystem";
import { frictionSystem } from "./ecs/systems/frictionSystem";
import { collisionSystem } from "./ecs/systems/collisionSystem";
import CueSystem from "./ecs/systems/CueSystem";

export default function PoolScene({cueBall, mouse}) {
  const aimRef = useRef({x: 0, y: 0, distance: 0});
  const FIXED_DT = 1 / 120;
  const accumulatorRef = useRef(0);

  useFrame((_, delta) => { accumulatorRef.current += delta;

    while (accumulatorRef.current >= FIXED_DT) {
      physicsSystem(world, FIXED_DT);
      collisionSystem(world);
      frictionSystem(world);

      accumulatorRef.current -= FIXED_DT;
    }
  });

  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        castShadow
        intensity={2}
        position={[3, 8, 3]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <PoolTable />

      <PoolBalls balls={[...balls]} />

      {/*     {cueBall && (
        <>
            <CueStick cueBall={cueBall} mouse={mouse} />  
       <CueSystem cueBall={cueBall} aimRef={aimRef} /> 
        </>  
      )}     */} 
    </>
  );
}