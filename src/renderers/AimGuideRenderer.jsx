// src/renderers/AimGuideRenderer.jsx

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {ballQuery, activeBalls} from "../ecs/world";
import { BALL_R } from "../ecs/constants/table";

import * as THREE from "three";

const GUIDE_Y = 0.45;

function initGeometry(geo) {
  if (!geo) return;

  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  geo.setDrawRange(0, 2);
}

function setLinePoints(geo, x1, y1, z1, x2, y2, z2) {
  if (!geo) return;

  if (!geo.attributes.position) {
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  }

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
  if (!geo) return;
  if (!geo.setDrawRange) return;

  geo.setDrawRange(0, 0);
}

export default function AimGuideRenderer({ cueBall, aimRef }) {
  const cueGeoRef = useRef();
  const objectGeoRef = useRef();
  const deflectGeoRef = useRef();
  const lastAngleRef = useRef(null);

  useFrame(() => {

    if (!cueGeoRef.current || !objectGeoRef.current || !deflectGeoRef.current) {
      return;
    }

    // Hide guide while balls moving
    if (activeBalls.size > 0) {

      clearLine(cueGeoRef.current);
      clearLine(objectGeoRef.current);
      clearLine(deflectGeoRef.current);

      return;
    }

    const angle = aimRef.current.angle;

    // Skip work if aim hasn't changed
    if (lastAngleRef.current !== null && Math.abs(angle - lastAngleRef.current) < 0.0001) {
      return;
    }

    lastAngleRef.current = angle;

    const dirX = Math.cos(angle);
    const dirZ = Math.sin(angle);

    let nearestBall = null;
    let nearestT = Infinity;

    const hitRadius = BALL_R * 2;
    const hitRadiusSq = hitRadius * hitRadius;

    for (const ball of ballQuery) {

      if (ball === cueBall || ball.pocketed) {
        continue;
      }

      const relX = ball.x - cueBall.x;
      const relZ = ball.z - cueBall.z;
      const t = relX * dirX + relZ * dirZ;

      if (t <= 0) continue;

      const closestX = cueBall.x + dirX * t;
      const closestZ = cueBall.z + dirZ * t;

      const dx = ball.x - closestX;
      const dz = ball.z - closestZ;

      const distSq = dx * dx + dz * dz;

      if (distSq < hitRadiusSq && t < nearestT) {
        nearestBall = ball;
        nearestT = t;
      }
    }

    // No collision predicted
    if (!nearestBall) {

      setLinePoints(cueGeoRef.current, cueBall.x, GUIDE_Y, cueBall.z, cueBall.x + dirX * 5, GUIDE_Y, cueBall.z + dirZ * 5);
      clearLine(objectGeoRef.current);
      clearLine(deflectGeoRef.current);

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

    // Cue ball path
    setLinePoints(cueGeoRef.current, cueBall.x, GUIDE_Y, cueBall.z, hitX, GUIDE_Y, hitZ);

    // Object ball path
    setLinePoints(objectGeoRef.current, nearestBall.x, GUIDE_Y, nearestBall.z, nearestBall.x + normalX * 2, GUIDE_Y, nearestBall.z + normalZ * 2);

    // Cue ball deflection
    const tx = dirX - normalX;
    const tz = dirZ - normalZ;

    const tLen = Math.hypot(tx, tz);

    if (tLen > 0.001) {

      setLinePoints(deflectGeoRef.current, hitX, GUIDE_Y, hitZ, hitX + (tx / tLen) * 1.5, GUIDE_Y, hitZ + (tz / tLen) * 1.5);

    } else {

      clearLine(deflectGeoRef.current);
    }
  });

  return (
    <>
      <line
        renderOrder={999} ref={(obj) => { if (obj) cueGeoRef.current = obj.geometry;
        }}>
        <bufferGeometry />
        <lineBasicMaterial color="white" depthTest={false} transparent opacity={0.85} />
      </line>

      <line renderOrder={999} ref={(obj) => { if (obj) objectGeoRef.current = obj.geometry;
        }}>
        <bufferGeometry />
        <lineBasicMaterial color="yellow" depthTest={false} transparent opacity={0.85} />
      </line>

      <line renderOrder={999} ref={(obj) => { if (obj) deflectGeoRef.current = obj.geometry;
        }}>
        <bufferGeometry />
        <lineBasicMaterial color="cyan" depthTest={false} transparent opacity={0.85} />
      </line>
    </>
  );
}