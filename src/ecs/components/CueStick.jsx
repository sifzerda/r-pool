// src/ecs/components/CueStick.jsx

export default function CueStick({
  cueBall,
  mouse,
}) {
  if (!cueBall) return null;

  const dx =
    mouse.x - cueBall.x;

  const dy =
    mouse.y - cueBall.y;

  const angle = Math.atan2(
    aim.y,
    aim.x
  );

  const offset = 0.8;

  return (
    <mesh
      position={[
        ballX - aim.x * offset,
        0.12,
        ballZ - aim.y * offset
      ]}
      rotation={[
        0,
        -angle + Math.PI / 2,
        0
      ]}
    >
      <cylinderGeometry
        args={[
          0.02,
          0.04,
          2,
          12,
        ]}
      />

      <meshStandardMaterial
        color="#caa472"
      />
    </mesh>
  );
}