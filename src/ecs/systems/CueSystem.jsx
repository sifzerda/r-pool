import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const plane = new THREE.Plane(
  new THREE.Vector3(0, 1, 0),
  0
);

const hit = new THREE.Vector3();

export default function CueSystem({
  cueBall,
  aimRef,
}) {
  const { raycaster, pointer, camera } =
    useThree();

  const dragging = useRef(false);

  useFrame(() => {
    if (!cueBall) return;

    raycaster.setFromCamera(
      pointer,
      camera
    );

    raycaster.ray.intersectPlane(
      plane,
      hit
    );

    const ballX =
      (cueBall.x - 340) / 100;

    const ballZ =
      (cueBall.y - 170) / 100;

    const dx = ballX - hit.x;
    const dz = ballZ - hit.z;

    const len =
      Math.hypot(dx, dz) || 1;

    aimRef.current = {
      x: dx / len,
      y: dz / len,
      distance: Math.min(
        Math.hypot(dx, dz),
        2
      ),
    };
  });

  useEffect(() => {
    const down = () => {
      dragging.current = true;
    };

    const up = () => {
      if (!dragging.current) return;

      dragging.current = false;

      const aim =
        aimRef.current;

      const power =
        aim.distance * 10;

      cueBall.vx =
        aim.x * power;

      cueBall.vy =
        aim.y * power;

      cueBall.sleeping = false;
    };

    window.addEventListener(
      "pointerdown",
      down
    );

    window.addEventListener(
      "pointerup",
      up
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        down
      );

      window.removeEventListener(
        "pointerup",
        up
      );
    };
  }, [cueBall]);

  return null;
}