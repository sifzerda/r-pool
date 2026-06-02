// src/ecs/components/PoolBalls.jsx

export default function PoolBalls({
  balls,
}) {
  return (
    <>
      {balls.map((ball, index) => {
        if (ball.pocketed)
          return null;

        return (
          <mesh
            key={index}
            castShadow
            position={[
              (ball.x - 340) / 100,
              0.12,
              (ball.y - 170) / 100,
            ]}
          >
            <sphereGeometry
              args={[0.1, 32, 32]}
            />

            <meshStandardMaterial
              roughness={0.15}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </>
  );
}