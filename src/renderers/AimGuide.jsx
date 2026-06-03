// src/renderers/AimGuide.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { ballQuery } from "../ecs/world";
import { BALL_R } from "../ecs/constants/table";

const GUIDE_Y = 0.45;

function GuideLine({ color, lineRef }) {
  const geoRef = useRef();

  // Give the geometry a ref so we can imperatively update it
  lineRef.current = geoRef;

  return (
    <line>
      <bufferGeometry ref={geoRef} />
      <lineBasicMaterial color={color} depthTest={false} transparent opacity={0.8} />
    </line>
  );
}

function setLinePoints(geoRef, p1, p2) {
  const geo = geoRef.current;
  if (!geo) return;
  const positions = new Float32Array([
    p1[0], p1[1], p1[2],
    p2[0], p2[1], p2[2],
  ]);
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.computeBoundingSphere();
}

function clearLine(geoRef) {
  const geo = geoRef.current;
  if (!geo) return;
  geo.deleteAttribute("position");
}

export default function AimGuide({ cueBall, aimRef }) {
  const cueGeoRef = useRef();
  const objectGeoRef = useRef();
  const deflectGeoRef = useRef();

  useFrame(() => {
    let moving = false;
    for (const ball of ballQuery) {
      if (Math.abs(ball.vx) > 0.01 || Math.abs(ball.vz) > 0.01) {
        moving = true;
        break;
      }
    }

    if (moving) {
      clearLine(cueGeoRef);
      clearLine(objectGeoRef);
      clearLine(deflectGeoRef);
      return;
    }

    const angle = aimRef.current.angle;
    const dirX = Math.cos(angle);
    const dirZ = Math.sin(angle);

    let nearestBall = null;
    let nearestT = Infinity;
    const hitRadius = BALL_R * 2;
    const hitRadiusSq = hitRadius * hitRadius;

    for (const ball of ballQuery) {
      if (ball === cueBall || ball.pocketed) continue;
      const relX = ball.x - cueBall.x;
      const relZ = ball.z - cueBall.z;
      const t = relX * dirX + relZ * dirZ;
      if (t < 0) continue;
      const closestX = cueBall.x + dirX * t;
      const closestZ = cueBall.z + dirZ * t;
      const dx = ball.x - closestX;
      const dz = ball.z - closestZ;
      if (dx * dx + dz * dz < hitRadiusSq && t < nearestT) {
        nearestBall = ball;
        nearestT = t;
      }
    }

    if (!nearestBall) {
      setLinePoints(cueGeoRef,
        [cueBall.x, GUIDE_Y, cueBall.z],
        [cueBall.x + dirX * 5, GUIDE_Y, cueBall.z + dirZ * 5]
      );
      clearLine(objectGeoRef);
      clearLine(deflectGeoRef);
      return;
    }

    const hitX = cueBall.x + dirX * nearestT;
    const hitZ = cueBall.z + dirZ * nearestT;
    const nx = nearestBall.x - hitX;
    const nz = nearestBall.z - hitZ;
    const len = Math.hypot(nx, nz);
    if (len === 0) return;
    const normalX = nx / len;
    const normalZ = nz / len;

    setLinePoints(cueGeoRef,
      [cueBall.x, GUIDE_Y, cueBall.z],
      [hitX, GUIDE_Y, hitZ]
    );

    setLinePoints(objectGeoRef,
      [nearestBall.x, GUIDE_Y, nearestBall.z],
      [nearestBall.x + normalX * 2, GUIDE_Y, nearestBall.z + normalZ * 2]
    );

    const tx = dirX - normalX;
    const tz = dirZ - normalZ;
    const tLen = Math.hypot(tx, tz);
    if (tLen > 0.001) {
      setLinePoints(deflectGeoRef,
        [hitX, GUIDE_Y, hitZ],
        [hitX + tx / tLen * 1.5, GUIDE_Y, hitZ + tz / tLen * 1.5]
      );
    } else {
      clearLine(deflectGeoRef);
    }
  });

  return (
    <>
      <line ref={(obj) => { if (obj) cueGeoRef.current = obj.geometry; }}>
        <bufferGeometry />
        <lineBasicMaterial color="white" depthTest={false} transparent opacity={0.8} />
      </line>
      <line ref={(obj) => { if (obj) objectGeoRef.current = obj.geometry; }}>
        <bufferGeometry />
        <lineBasicMaterial color="yellow" depthTest={false} transparent opacity={0.8} />
      </line>
      <line ref={(obj) => { if (obj) deflectGeoRef.current = obj.geometry; }}>
        <bufferGeometry />
        <lineBasicMaterial color="cyan" depthTest={false} transparent opacity={0.8} />
      </line>
    </>
  );
}