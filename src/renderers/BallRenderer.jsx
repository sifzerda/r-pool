// src/renderers/BallRenderer.jsx

import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ballGeometry, ballMaterial } from "./ballAssets.js";
import { getBallUvOffset } from "./ballTextures.js";
import { clearDirty } from "../ecs/world.js";

// --------------------------------
// BALL RENDERER
// --------------------------------

export default function BallRenderer({ balls }) {

    const meshRef = useRef();
    const initialized = useRef(false);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // --------------------------------
    // INITIALISE INSTANCE UV OFFSETS
    // --------------------------------

    useLayoutEffect(() => {
        const attribute = ballGeometry.getAttribute("instanceUvOffset");

        if (!attribute) {
            console.error("BallRenderer: Missing instanceUvOffset attribute");
            return;
        }

        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];
            const [u, v] = getBallUvOffset(ball.id);
            attribute.setXY(i, u, v);
        }
        attribute.needsUpdate = true;
        // New instance matrices must be initialised.
        initialized.current = false;
    }, [balls]);

    // --------------------------------
    // UPDATE INSTANCE TRANSFORMS
    // --------------------------------

    useFrame(() => {
        const mesh = meshRef.current;

        if (!mesh) return;

        let changed = false;

        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];

            // Initialise every instance on first render.
            if (!ball.dirty && initialized.current) {
                continue;
            }

            // --------------------------------
            // POCKETED
            // --------------------------------

            if (ball.pocketed) {
                dummy.position.set(0, 0, 0);
                dummy.rotation.set(0, 0, 0);
                dummy.scale.setScalar(0);
            }

            // --------------------------------
            // VISIBLE BALL
            // --------------------------------

            else {
                dummy.position.set(ball.x, ball.y, ball.z);
                dummy.rotation.set(ball.rotX, ball.rotY, ball.rotZ);
                dummy.scale.setScalar(1);
            }

            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
            clearDirty(ball);
            changed = true;
        }

        initialized.current = true;

        if (changed) {
            mesh.instanceMatrix.needsUpdate = true;
        }
    });

    // --------------------------------
    // RENDER
    // --------------------------------

    return (
        <instancedMesh
            ref={meshRef}
            args={[ ballGeometry, ballMaterial, balls.length ]}
            count={balls.length} castShadow receiveShadow
        />
    );
}
