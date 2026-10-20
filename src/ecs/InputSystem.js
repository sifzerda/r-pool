//src/ecs/InputSystem.js

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { toRenderX, toRenderZ } from "./utils/coords";

const MAX_PULL = 1.2;
const MAX_POWER = 18;

export default function InputSystem({ cueBall, aimRef }) {
  const { camera } = useThree();

  const raycaster = useRef(new THREE.Raycaster());
  const point = useRef(new THREE.Vector3());

  const plane = useRef(
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  );

  useFrame((state) => {
    raycaster.current.setFromCamera(state.pointer, camera);

    const hit = raycaster.current.ray.intersectPlane(
      plane.current,
      point.current
    );

    if (!hit) return;

    const aim = aimRef.current;

    // Save the current mouse position in world coordinates.
    aim.pointerX = point.current.x;
    aim.pointerZ = point.current.z;

    // While charging, don't change the aim direction.
    if (aim.charging) {
      const dx = point.current.x - aim.dragStartX;
      const dz = point.current.z - aim.dragStartZ;

      // Power increases when dragging opposite to the aim vector.
      const pull = Math.max(
        0,
        -(dx * aim.cos + dz * aim.sin)
      );

      const pullBack = Math.min(pull, MAX_PULL);
      const powerRatio = pullBack / MAX_PULL;

      aim.pullBack = pullBack;
      aim.power = powerRatio * MAX_POWER;

      return;
    }

    const cueX = toRenderX(cueBall.x);
    const cueZ = toRenderZ(cueBall.z);

    const dx = point.current.x - cueX;
    const dz = point.current.z - cueZ;

    const angle = Math.atan2(dz, dx);

    aim.angle = angle;
    aim.cos = Math.cos(angle);
    aim.sin = Math.sin(angle);
  });

  return null;
}
