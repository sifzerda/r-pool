// // src/renderers/HandRenderer.jsx

// renders the hand for ball-in-hand events

import { useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import useGameStore from "../store/useGameStore.js";
import { BALL_Y } from "../ecs/constants/table.js";

const HAND_WIDTH = 0.68;
const HAND_HEIGHT = 0.43;
// Position the image just above the table.
const HAND_Y = BALL_Y + 0.01;
// The cue ball is approximately 19% across the generated image.
const BALL_IMAGE_X = 0.19;
const BALL_IMAGE_Z = 0.48;

export default function HandRenderer({ cueBall, aimRef }) {
    const groupRef = useRef();
    const texture = useLoader(THREE.TextureLoader, "/hand-ball.png");

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;

    useFrame(() => {
        const game = useGameStore.getState();
        const aim = aimRef.current;
        const hand = groupRef.current;

        if (!hand) return;

        const visible = game.screen === "play" && !game.winner && (game.ballInHand && (game.currentPlayer === "human" || game.currentPlayer === "ai"));
        hand.visible = visible;

        if (!visible) return;

        const ballX = Number.isFinite(aim.handX) ? aim.handX : cueBall.x;
        const ballZ = Number.isFinite(aim.handZ) ? aim.handZ : cueBall.z;

        // Offset the image so its illustrated cue ball
        // stays directly over the actual placement position.
        const offsetX = (0.5 - BALL_IMAGE_X) * HAND_WIDTH;
        const offsetZ = (0.5 - BALL_IMAGE_Z) * HAND_HEIGHT;

        hand.position.set(ballX + offsetX, HAND_Y + (aim.handLift || 0), ballZ + offsetZ);
    });

    return (
        <group ref={groupRef} visible={false}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
                <planeGeometry args={[HAND_WIDTH, HAND_HEIGHT]} />

                <meshBasicMaterial
                    map={texture}
                    transparent
                    alphaTest={0.01}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}
