// src/renderers/AimGuideRenderer.jsx

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ballQuery, activeBalls } from "../ecs/world";
import { BALL_R } from "../ecs/constants/table";

const GUIDE_Y = 0.45;
const GUIDE_LENGTH = 5;
const OBJECT_GUIDE_LENGTH = 2;
const DEFLECT_GUIDE_LENGTH = 1.5;
const HIT_RADIUS_SQ = (BALL_R * 2) ** 2;

function setLine(geo, x1, z1, x2, z2) {
  const p = geo.attributes.position.array;

  p[0] = x1;
  p[1] = GUIDE_Y;
  p[2] = z1;
  p[3] = x2;
  p[4] = GUIDE_Y;
  p[5] = z2;

  geo.attributes.position.needsUpdate = true;
  geo.setDrawRange(0, 2);
}

function clearLine(geo) {
  geo.setDrawRange(0, 0);
}

function GuideLine({ color, geoRef }) {
  const positions = useMemo(() => new Float32Array(6), []);

  return (
    <line renderOrder={999} frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} depthTest={false} transparent opacity={0.85} />
    </line>
  );
}

export default function AimGuideRenderer({ cueBall, aimRef }) {
  const cueRef = useRef();
  const objectRef = useRef();
  const deflectRef = useRef();
  const cache = useRef({ angle: NaN, x: NaN, z: NaN });

  useFrame(() => {
    const cueGeo = cueRef.current;
    const objectGeo = objectRef.current;
    const deflectGeo = deflectRef.current;

    if (!cueGeo || !objectGeo || !deflectGeo) return;

    if (activeBalls.size > 0 || cueBall.pocketed || cueBall.falling) {
      clearLine(cueGeo);
      clearLine(objectGeo);
      clearLine(deflectGeo);
      cache.current.angle = NaN;
      return;
    }

    const { angle, cos: dirX, sin: dirZ } = aimRef.current;
    const c = cache.current;

    // Skip if nothing relevant changed since the last computation.
    if (angle === c.angle && cueBall.x === c.x && cueBall.z === c.z) return;

    c.angle = angle;
    c.x = cueBall.x;
    c.z = cueBall.z;

    // Nearest ball along the aim ray.
    const balls = ballQuery.entities;

    let nearestBall = null;
    let nearestT = Infinity;

    for (let i = 0; i < balls.length; i++) {
      const ball = balls[i];

      if (ball === cueBall || ball.pocketed || ball.falling) continue;

      const relX = ball.x - cueBall.x;
      const relZ = ball.z - cueBall.z;

      const t = relX * dirX + relZ * dirZ;
      if (t <= 0 || t >= nearestT) continue;

      const dx = relX - dirX * t;
      const dz = relZ - dirZ * t;

      if (dx * dx + dz * dz < HIT_RADIUS_SQ) {
        nearestBall = ball;
        nearestT = t;
      }
    }

    if (!nearestBall) {
      setLine(
        cueGeo,
        cueBall.x, cueBall.z,
        cueBall.x + dirX * GUIDE_LENGTH,
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

    setLine(cueGeo, cueBall.x, cueBall.z, hitX, hitZ);

    setLine(
      objectGeo,
      nearestBall.x, nearestBall.z,
      nearestBall.x + normalX * OBJECT_GUIDE_LENGTH,
      nearestBall.z + normalZ * OBJECT_GUIDE_LENGTH
    );

    // The cue ball deflects along the tangent: dir minus its component
    // along the contact normal. (The old `dir - normal` was not a tangent.)
    const dot = dirX * normalX + dirZ * normalZ;
    const tx = dirX - dot * normalX;
    const tz = dirZ - dot * normalZ;
    const tLen = Math.hypot(tx, tz);

    if (tLen > 0.001) {
      setLine(
        deflectGeo,
        hitX, hitZ,
        hitX + (tx / tLen) * DEFLECT_GUIDE_LENGTH,
        hitZ + (tz / tLen) * DEFLECT_GUIDE_LENGTH
      );
    } else {
      clearLine(deflectGeo);
    }
  });

  return (
    <>
      <GuideLine color="white" geoRef={cueRef} />
      <GuideLine color="yellow" geoRef={objectRef} />
      <GuideLine color="cyan" geoRef={deflectRef} />
    </>
  );
}