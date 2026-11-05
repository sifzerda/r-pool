// // src/renderers/HandRenderer.jsx
// renders the hand for ball-in-hand events

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

import useGameStore from "../store/useGameStore.js";
import { BALL_Y } from "../ecs/constants/table.js";

const HAND_WIDTH = 0.68;
const HAND_HEIGHT = 0.43;
const HAND_Y = BALL_Y + 0.01;

const BALL_IMAGE_X = 0.19;
const BALL_IMAGE_Z = 0.48;

const OFFSET_X = (0.5 - BALL_IMAGE_X) * HAND_WIDTH;
const OFFSET_Z = (0.5 - BALL_IMAGE_Z) * HAND_HEIGHT;

const HAND_GEOMETRY = new THREE.PlaneGeometry(
  HAND_WIDTH,
  HAND_HEIGHT
);

export default function HandRenderer({ cueBall, aimRef }) {
  const groupRef = useRef(null);

  const texture = useLoader(
    THREE.TextureLoader,
    "/hand-ball.png"
  );

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [texture]
  );

  const visible = useGameStore(
    (s) =>
      s.screen === "play" &&
      !s.winner &&
      s.ballInHand &&
      (s.currentPlayer === "human" ||
        s.currentPlayer === "ai")
  );

  useFrame(() => {
    const hand = groupRef.current;
    if (!hand || !visible) return;

    const aim = aimRef.current;
    if (!aim || !cueBall) return;

    const ballX = Number.isFinite(aim.handX)
      ? aim.handX
      : cueBall.x;

    const ballZ = Number.isFinite(aim.handZ)
      ? aim.handZ
      : cueBall.z;

    const x = ballX + OFFSET_X;
    const y = HAND_Y + (aim.handLift || 0);
    const z = ballZ + OFFSET_Z;

    if (
      hand.position.x !== x ||
      hand.position.y !== y ||
      hand.position.z !== z
    ) {
      hand.position.set(x, y, z);
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      <mesh
        geometry={HAND_GEOMETRY}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={5}
        dispose={null}
      />
    </group>
  );
}
