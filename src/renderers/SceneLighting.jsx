// src/renderers/SceneLighting.jsx

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import useGameStore from "../store/useGameStore.js";

export default function SceneLighting() {
  const params = useGameStore((s) => s.appearanceParams);

  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    // Transparent background.
    scene.background = null;
    gl.setClearColor(0x000000, 0);

    // Preserve preset exposure.
    gl.toneMappingExposure = params["scene.exposure"];

    invalidate();
  }, [params, gl, scene, invalidate]);

  return (
    <>
      <ambientLight intensity={params["scene.ambient"]} />

      <directionalLight
        position={[0, 8, 4]}
        intensity={params["scene.key"]}
        color={params["scene.keyColor"]}
        castShadow
      />
    </>
  );
}
