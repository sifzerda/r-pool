//src/renderers/BallRenderer.jsx

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import {
    ballGeometry,
    ballMaterial,
} from "./ballAssets.js";
import { getBallUvOffset } from "./ballTextures.js";

// --------------------------------------------------
// BALL RENDERER
// --------------------------------------------------

export default function BallRenderer({ balls }) {
    const meshRef = useRef();

    // Temporary object used to calculate instance transforms
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Reusable Euler rotation
    const rotation = useMemo(() => new THREE.Euler(), []);

    // --------------------------------------------------
    // INITIALISE INSTANCE UV OFFSETS
    // --------------------------------------------------

    useMemo(() => {
        const attribute = ballGeometry.getAttribute(
            "instanceUvOffset"
        );

        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];

            const [u, v] = getBallUvOffset(ball.id);

            attribute.setXY(i, u, v);
        }

        attribute.needsUpdate = true;
    }, [balls]);

    // --------------------------------------------------
    // UPDATE INSTANCES
    // --------------------------------------------------

    useFrame((_, delta) => {
        const mesh = meshRef.current;

        if (!mesh) return;

        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];

            // ------------------------------------------
            // POCKETED
            // ------------------------------------------

            if (ball.pocketed) {
                dummy.position.set(0, 0, 0);
                dummy.rotation.set(0, 0, 0);
                dummy.scale.setScalar(0);

                dummy.updateMatrix();

                mesh.setMatrixAt(i, dummy.matrix);

                continue;
            }

            // ------------------------------------------
            // FALLING ANIMATION
            // ------------------------------------------

            if (ball.falling) {
                const dx = ball.pocketX - ball.x;
                const dz = ball.pocketZ - ball.z;

                ball.x += dx * 8 * delta;
                ball.z += dz * 8 * delta;

                ball.fallSpeed += 12 * delta;
                ball.y -= ball.fallSpeed * delta;

                ball.rotX += delta * 8;
                ball.rotZ += delta * 8;

                if (ball.y < -0.4) {
                    ball.pocketed = true;
                    ball.active = false;
                    ball.dirty = true;

                    dummy.scale.setScalar(0);
                    dummy.position.set(0, 0, 0);
                    dummy.rotation.set(0, 0, 0);

                    dummy.updateMatrix();

                    mesh.setMatrixAt(i, dummy.matrix);

                    continue;
                }
            }

            // ------------------------------------------
            // NORMAL TRANSFORM
            // ------------------------------------------

            if (!ball.dirty && !ball.falling) {
                continue;
            }

            dummy.position.set(
                ball.x,
                ball.y,
                ball.z
            );

            rotation.set(
                ball.rotX,
                ball.rotY,
                ball.rotZ
            );

            dummy.rotation.copy(rotation);

            dummy.scale.setScalar(1);

            dummy.updateMatrix();

            mesh.setMatrixAt(i, dummy.matrix);

            ball.dirty = false;
        }

        // Tell Three.js that instance matrices changed
        mesh.instanceMatrix.needsUpdate = true;
    });

    // --------------------------------------------------
    // RENDER
    // --------------------------------------------------

    return (
        <instancedMesh
            ref={meshRef}
            args={[
                ballGeometry,
                ballMaterial,
                balls.length,
            ]}
            count={balls.length}
            castShadow
            receiveShadow
        />
    );
}