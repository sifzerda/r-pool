// src/lab/SceneLab.jsx
// Lights, reflections, background and exposure, all driven by the Lab.
// Replaces the hard-coded lights that used to live in PoolScene.

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useLabParams } from "./labStore";
import { applyAppearance } from "./applyAppearance";

export default function SceneLab() {
  const p = useLabParams();
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  // Material edits happen outside React, so ask for a redraw (frameloop="demand").
  useEffect(() => {
    applyAppearance(p);
    gl.toneMappingExposure = p["scene.exposure"];
    scene.environmentIntensity = p["scene.reflections"];
    invalidate();
  }, [p, gl, scene, invalidate]);

  const accent = p["scene.accent"];
  const glow = p["scene.accentGlow"];

  return (
    <>
      <color attach="background" args={[p["scene.bg"]]} />

      <ambientLight intensity={p["scene.ambient"]} />

      <directionalLight
        castShadow
        intensity={p["scene.key"]}
        color={p["scene.keyColor"]}
        position={[4, 8, 2]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0004}
      />

      {/* Accent lights at each end of the table. */}
      <pointLight position={[-3.2, 1.4, 0]} color={accent} intensity={glow * 3} distance={7} decay={2} />
      <pointLight position={[3.2, 1.4, 0]} color={accent} intensity={glow * 3} distance={7} decay={2} />

      {/* Studio softboxes rendered once into a reflection map (no network needed).
          The camera looks straight down, so flat surfaces mirror the zenith:
          keep it dim and put the bright softboxes at an angle, where the
          spherical balls pick them up as highlights. */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={0.3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#dbeaff" position={[-5, 4, -4]} target={[0, 0, 0]} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={1.3} color="#ffe6c4" position={[5, 3, 4]} target={[0, 0, 0]} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={1} position={[6, 3, -4]} target={[0, 0, 0]} scale={[3, 2, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[-5, 3, 4]} target={[0, 0, 0]} scale={2.5} />
      </Environment>
    </>
  );
}
