// src/renderers/AimGuideRenderer.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ballQuery, activeBalls } from "../ecs/world";
import { BALL_R } from "../ecs/constants/table";
import * as THREE from "three";

const GUIDE_Y = 0.45;
const GUIDE_LENGTH = 5;
const OBJECT_GUIDE_LENGTH = 2;
const DEFLECT_GUIDE_LENGTH = 1.5;

function setLinePoints(geo, x1, y1, z1, x2, y2, z2) {
  if (!geo) return;

  const positions = geo.attributes.position.array;

  positions[0] = x1;
  positions[1] = y1;
  positions[2] = z1;
  positions[3] = x2;
  positions[4] = y2;
  positions[5] = z2;

  geo.attributes.position.needsUpdate = true;
  geo.setDrawRange(0, 2);
}

function clearLine(geo) {
  if (geo) geo.setDrawRange(0, 0);
}

export default function AimGuideRenderer({ cueBall, aimRef }) {
  const cueGeoRef = useRef();
  const objectGeoRef = useRef();
  const deflectGeoRef = useRef();
  const lastAngleRef = useRef(null);

  useFrame(() => {
    const cueGeo = cueGeoRef.current;
    const objectGeo = objectGeoRef.current;
    const deflectGeo = deflectGeoRef.current;

    if (!cueGeo || !objectGeo || !deflectGeo) return;

    // Hide guides while balls move.
    if (activeBalls.size > 0) {
      clearLine(cueGeo);
      clearLine(objectGeo);
      clearLine(deflectGeo);

      // Force recalculation when the balls stop.
      lastAngleRef.current = null;
      return;
    }

    const { angle, cos, sin } = aimRef.current;

    if (
      lastAngleRef.current !== null &&
      Math.abs(angle - lastAngleRef.current) < 0.0001
    ) {
      return;
    }

    lastAngleRef.current = angle;

    const dirX = cos ?? Math.cos(angle);
    const dirZ = sin ?? Math.sin(angle);

    let nearestBall = null;
    let nearestT = Infinity;

    const hitRadiusSq = (BALL_R * 2) ** 2;

    for (const ball of ballQuery) {
      if (ball === cueBall || ball.pocketed || ball.falling) continue;

      const relX = ball.x - cueBall.x;
      const relZ = ball.z - cueBall.z;

      const t = relX * dirX + relZ * dirZ;
      if (t <= 0) continue;

      const dx = relX - dirX * t;
      const dz = relZ - dirZ * t;

      const distSq = dx * dx + dz * dz;

      if (distSq < hitRadiusSq && t < nearestT) {
        nearestBall = ball;
        nearestT = t;
      }
    }

    if (!nearestBall) {
      setLinePoints(
        cueGeo,
        cueBall.x, GUIDE_Y, cueBall.z,
        cueBall.x + dirX * GUIDE_LENGTH, GUIDE_Y,
        cueBall.z + dirZ * GUIDE_LENGTH
      );

      clearLine(objectGeo);
      clearLine(deflectGeo);
      return;
    }

    const hitX = cueBall.x + dirX * nearestT;
    const hitZ = cueBall.z + dirZ * nearestT;

    const nx = nearestBall.x - hitX;
    const nz = nearestBall.z - hitZ;

    const len = Math.hypot(nx, nz);
    if (len < 0.0001) return;

    const normalX = nx / len;
    const normalZ = nz / len;

    setLinePoints(
      cueGeo,
      cueBall.x, GUIDE_Y, cueBall.z,
      hitX, GUIDE_Y, hitZ
    );

    setLinePoints(
      objectGeo,
      nearestBall.x, GUIDE_Y, nearestBall.z,
      nearestBall.x + normalX * OBJECT_GUIDE_LENGTH,
      GUIDE_Y,
      nearestBall.z + normalZ * OBJECT_GUIDE_LENGTH
    );

    const tx = dirX - normalX;
    const tz = dirZ - normalZ;
    const tLen = Math.hypot(tx, tz);

    if (tLen > 0.001) {
      setLinePoints(
        deflectGeo,
        hitX, GUIDE_Y, hitZ,
        hitX + (tx / tLen) * DEFLECT_GUIDE_LENGTH,
        GUIDE_Y,
        hitZ + (tz / tLen) * DEFLECT_GUIDE_LENGTH
      );
    } else {
      clearLine(deflectGeo);
    }
  });

  return (
    <>
      <line renderOrder={999} ref={obj => {
        if (obj) cueGeoRef.current = obj.geometry;
      }}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(6), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="white" depthTest={false} transparent opacity={0.85} />
      </line>

      <line renderOrder={999} ref={obj => {
        if (obj) objectGeoRef.current = obj.geometry;
      }}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(6), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="yellow" depthTest={false} transparent opacity={0.85} />
      </line>

      <line renderOrder={999} ref={obj => {
        if (obj) deflectGeoRef.current = obj.geometry;
      }}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(6), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="cyan" depthTest={false} transparent opacity={0.85} />
      </line>
    </>
  );
}
