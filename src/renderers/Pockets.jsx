// src/renderers/Pockets.jsx

import { POCKETS } from "../ecs/constants/pockets";

export default function Pockets() {
  return (
    <>
      {POCKETS.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, 0.21, p.z]}
          rotation={[-Math.PI / 1, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.18, 32]} />
          <meshStandardMaterial color="#050505" roughness={1} metalness={0} />
        </mesh>
      ))}
    </>
  );
}