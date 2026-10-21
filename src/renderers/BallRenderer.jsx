// src/renderers/BallRenderer.jsx

import { useRef, useMemo, useLayoutEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ballGeometry, ballMaterial } from "./ballAssets.js";
import { getBallUvOffset } from "./ballTextures.js";
import { dirtyBalls } from "../ecs/world.js";

function writeBall(mesh, dummy, ball) {
    if (ball.pocketed) {
        dummy.position.set(0, 0, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(0);
    } else {
        dummy.position.set(ball.x, ball.y, ball.z);
        dummy.rotation.set(ball.rotX, ball.rotY, ball.rotZ);
        dummy.scale.setScalar(1);
    }

    dummy.updateMatrix();
    mesh.setMatrixAt(ball.instanceId, dummy.matrix);
}

export default function BallRenderer({ balls }) {
    const meshRef = useRef();
    const needsFullWrite = useRef(true);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Per-instance atlas offsets.
    useLayoutEffect(() => {
        const attribute = ballGeometry.getAttribute("instanceUvOffset");

        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];
            const [u, v] = getBallUvOffset(ball.id);
            attribute.setXY(ball.instanceId, u, v);
        }

        attribute.needsUpdate = true;
        needsFullWrite.current = true;
    }, [balls]);

    useFrame(() => {
        const mesh = meshRef.current;
        if (!mesh) return;

        // First frame: write every instance once.
        if (needsFullWrite.current) {
            needsFullWrite.current = false;

            for (let i = 0; i < balls.length; i++) {
                writeBall(mesh, dummy, balls[i]);
                balls[i].dirty = false;
            }

            dirtyBalls.clear();
            mesh.instanceMatrix.needsUpdate = true;
            return;
        }

        // After that, only touch balls that actually changed.
        if (dirtyBalls.size === 0) return;

        for (const ball of dirtyBalls) {
            writeBall(mesh, dummy, ball);
            ball.dirty = false;
        }

        dirtyBalls.clear();
        mesh.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[ballGeometry, ballMaterial, balls.length]}
            frustumCulled={false}
            castShadow
            receiveShadow
        />
    );
}