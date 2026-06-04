//src/ecs/InputSystem.js

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import {
  toRenderX,
  toRenderZ,
} from "./utils/coords";

export default function InputSystem({
  cueBall,
  aimRef,
}) {
  const { camera } = useThree();

  const raycaster =
    useRef(new THREE.Raycaster());

  const point =
    useRef(new THREE.Vector3());

  const plane =
    useRef(
      new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        0
      )
    );

  useFrame((state) => {
    raycaster.current.setFromCamera(
      state.pointer,
      camera
    );

    const hit =
      raycaster.current.ray.intersectPlane(
        plane.current,
        point.current
      );

    if (!hit) return;

    const cueX =
      toRenderX(cueBall.x);

    const cueZ =
      toRenderZ(cueBall.z);

    const dx =
      cueX - point.current.x;

    const dz =
      cueZ - point.current.z;

    aimRef.current.angle =
      Math.atan2(dz, dx);
  });

  return null;
}