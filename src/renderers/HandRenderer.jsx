// // src/renderers/HandRenderer.jsx

// renders the hand for ball-in-hand events

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import useGameStore from "../store/useGameStore.js";
import { BALL_Y } from "../ecs/constants/table.js";

const HAND_Y = BALL_Y + 0.28;

export default function HandRenderer({ cueBall, aimRef }) {
    const groupRef = useRef();

    useFrame(() => {
        const game = useGameStore.getState();
        const aim = aimRef.current;
        const hand = groupRef.current;

        if (!hand) return;

        const visible = game.screen === "play" && game.ballInHand && !game.winner && (game.currentPlayer === "human" || game.currentPlayer === "ai");

        hand.visible = visible;

        if (!visible) return;

        hand.position.set(
            Number.isFinite(aim.handX) ? aim.handX : cueBall.x,
            HAND_Y + (aim.handLift || 0),
            Number.isFinite(aim.handZ) ? aim.handZ : cueBall.z
        );
    });

    return (
        <group ref={groupRef} visible={false}>
            {/* Cue ball being held */}
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
                <sphereGeometry args={[0.1, 32, 24]} />
                <meshStandardMaterial
                    color="#f5f3ed"
                    roughness={0.22}
                    metalness={0}
                />
            </mesh>

            {/* Palm */}
            <mesh position={[0, 0.02, 0.25]} rotation={[-0.15, 0, 0]}>
                <sphereGeometry args={[1, 24, 16]} />
                <meshStandardMaterial color="#c58d70" roughness={0.85} />
            </mesh>

            {/* Fingers curling around the cue ball */}
            {[-0.105, -0.035, 0.035, 0.105].map((x, i) => (
                <group key={i} position={[x, 0.045, 0.105]}>
                    <mesh rotation={[0.35, 0, 0]}>
                        <capsuleGeometry args={[0.027, 0.105, 4, 8]} />
                        <meshStandardMaterial color="#d5a184" roughness={0.85} />
                    </mesh>
                </group>
            ))}

            {/* Thumb */}
            <mesh
                position={[-0.145, 0.055, 0.015]}
                rotation={[0.2, 0, -0.75]}
            >
                <capsuleGeometry args={[0.032, 0.105, 4, 8]} />
                <meshStandardMaterial color="#d5a184" roughness={0.85} />
            </mesh>

            {/* Wrist */}
            <mesh position={[0, 0.015, 0.37]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.105, 0.12, 0.18, 16]} />
                <meshStandardMaterial color="#c58d70" roughness={0.85} />
            </mesh>
        </group>
    );
}