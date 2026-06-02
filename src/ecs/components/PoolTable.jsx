// src/ecs/components/PoolTable.jsx

export default function PoolTable() {
  return (
    <>
      <mesh receiveShadow>
        <boxGeometry
          args={[6.8, 0.4, 3.4]}
        />

<meshStandardMaterial
  color="#15603a"
  roughness={0.95}
/>
      </mesh>
    </>
  );
}