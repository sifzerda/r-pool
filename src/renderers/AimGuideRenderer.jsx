// src/renderers/AimGuideRenderer.jsx

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ballQuery, ballsAreMoving, getWorldRevision } from "../ecs/world.js";
import { BALL_R, BALL_Y } from "../ecs/constants/table.js";
import { POCKETS } from "../ecs/constants/pockets.js";
import { MIN_X, MAX_X, MIN_Z, MAX_Z } from "../ecs/constants/tableBounds.js";

const GUIDE_Y = BALL_Y + BALL_R + 0.02;
const PATH_LENGTH = 8;
const MAX_BOUNCES = 3;
const OBJECT_GUIDE_LENGTH = 2;
const DEFLECT_GUIDE_LENGTH = 1.5;
const POST_HIT_BOUNCES = 1;
const DIAMETER = BALL_R * 2;
const DIAMETER_SQ = DIAMETER * DIAMETER;
const EPS = 1e-7;
const MAX_POINTS = 16;
const GHOST_SEGMENTS = 32;
const EVENT_END = 0;
const EVENT_WALL = 1;
const EVENT_POCKET = 2;
const EVENT_BALL = 3;

function createEvent() {
  return {
    type: EVENT_END,
    distance: 0,
    reflectX: false,
    reflectZ: false,
    ball: null
  };
}

function rayCircleDistance(x, z, dx, dz, centreX, centreZ, radiusSq) {
  const relX = centreX - x;
  const relZ = centreZ - z;
  const centreDistanceSq = relX * relX + relZ * relZ;
  if (centreDistanceSq <= radiusSq) {
    return 0;
  }
  const projection = relX * dx + relZ * dz;
  if (projection <= 0) return Infinity;
  const perpendicularSq = Math.max(0, centreDistanceSq - projection * projection);
  if (perpendicularSq > radiusSq) {
    return Infinity;
  }
  return Math.max(
    0,
    projection - Math.sqrt(radiusSq - perpendicularSq)
  );
}

function findNextEvent(result, x, z, dx, dz, budget, ignoreA, ignoreB) {
  result.type = EVENT_END;
  result.distance = budget;
  result.reflectX = false;
  result.reflectZ = false;
  result.ball = null;
  let tx = Infinity;
  let tz = Infinity;
  if (dx > EPS) {
    tx = Math.max(0, (MAX_X - x) / dx);
  } else if (dx < -EPS) {
    tx = Math.max(0, (MIN_X - x) / dx);
  }
  if (dz > EPS) {
    tz = Math.max(0, (MAX_Z - z) / dz);
  } else if (dz < -EPS) {
    tz = Math.max(0, (MIN_Z - z) / dz);
  }
  const wallDistance = Math.min(tx, tz);
  if (wallDistance <= result.distance) {
    result.type = EVENT_WALL;
    result.distance = wallDistance;
    result.reflectX = Math.abs(tx - wallDistance) <= EPS;
    result.reflectZ = Math.abs(tz - wallDistance) <= EPS;
  }
  for (const pocket of POCKETS) {
    const distance = rayCircleDistance(x, z, dx, dz, pocket.x, pocket.z, pocket.captureRadiusSq);
    if (distance <= result.distance) {
      result.type = EVENT_POCKET;
      result.distance = distance;
      result.reflectX = false;
      result.reflectZ = false;
      result.ball = null;
    }
  }
  for (const ball of ballQuery.entities) {
    if (ball === ignoreA || ball === ignoreB || ball.pocketed || ball.falling) {
      continue;
    }
    const relX = ball.x - x;
    const relZ = ball.z - z;
    const projection = relX * dx + relZ * dz;
    if (projection <= EPS) continue;
    const perpendicularSq = relX * relX + relZ * relZ - projection * projection;
    if (perpendicularSq >= DIAMETER_SQ) {
      continue;
    }
    const distance = Math.max(
      0,
      projection - Math.sqrt(DIAMETER_SQ - Math.max(0, perpendicularSq))
    );
    if (distance < result.distance) {
      result.type = EVENT_BALL;
      result.distance = distance;
      result.reflectX = false;
      result.reflectZ = false;
      result.ball = ball;
    }
  }
  return result;
}

function pushPoint(array, count, x, z) {
  const offset = count * 3;
  array[offset] = x;
  array[offset + 1] = GUIDE_Y;
  array[offset + 2] = z;
  return count + 1;
}

function commit(geometry, count) {
  geometry.setDrawRange(0, count >= 2 ? count : 0);
  if (count >= 2) {
    geometry.attributes.position.needsUpdate = true;
  }
}

function extendPath(event, points, count, x, z, dx, dz, length, maxBounces, ignoreA, ignoreB) {
  let bounces = 0;
  while (length > EPS && count < MAX_POINTS) {
    findNextEvent(event, x, z, dx, dz, length, ignoreA, ignoreB);
    x += dx * event.distance;
    z += dz * event.distance;
    count = pushPoint(points, count, x, z);
    length -= event.distance;
    if (event.type !== EVENT_WALL || bounces >= maxBounces) {
      break;
    }
    if (event.reflectX) dx = -dx;
    if (event.reflectZ) dz = -dz;
    bounces++;
    x += dx * EPS;
    z += dz * EPS;
    length -= EPS;
  }
  return count;
}

function GuideLine({ color, geometryRef }) {
  const positions = useMemo(() => new Float32Array(MAX_POINTS * 3), []);
  return <line renderOrder={999} frustumCulled={false}>
    <bufferGeometry
      ref={geometryRef}
      drawRange={{ start: 0, count: 0 }}
    >
      <bufferAttribute attach="attributes-position" args={[positions, 3]} />
    </bufferGeometry>

    <lineBasicMaterial
      color={color}
      depthTest={false}
      depthWrite={false}
      transparent
      opacity={0.85}
      toneMapped={false}
    />
  </line>;
}

function GhostBall({ lineRef }) {
  const positions = useMemo(() => {
    const array = new Float32Array(GHOST_SEGMENTS * 3);
    for (let i = 0; i < GHOST_SEGMENTS; i++) {
      const angle = i / GHOST_SEGMENTS * Math.PI * 2;
      array[i * 3] = Math.cos(angle) * BALL_R;
      array[i * 3 + 1] = GUIDE_Y;
      array[i * 3 + 2] = Math.sin(angle) * BALL_R;
    }

    return array;
  }, []);
  
  return <lineLoop
    ref={lineRef}
    renderOrder={999}
    frustumCulled={false}
    visible={false}
  >
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[positions, 3]} />
    </bufferGeometry>

    <lineBasicMaterial
      color="white"
      depthTest={false}
      depthWrite={false}
      transparent
      opacity={0.7}
      toneMapped={false}
    />
  </lineLoop>;
}

function AimGuideRenderer({ cueBall, aimRef }) {
  const cueRef = useRef();
  const objectRef = useRef();
  const ghostRef = useRef();
  const event = useMemo(createEvent, []);
  const cache = useRef(null);

  useFrame(() => {
    const cueGeometry = cueRef.current;
    const objectGeometry = objectRef.current;
    const ghost = ghostRef.current;
    if (!cueGeometry || !objectGeometry || !ghost) {
      return;
    }

    const aim = aimRef.current;
    if (ballsAreMoving() || cueBall.pocketed || cueBall.falling || cueBall.scratched || aim.pendingShot !== null || aim.swing === 2) {
      cache.current = null;
      cueGeometry.setDrawRange(0, 0);
      objectGeometry.setDrawRange(0, 0);
      ghost.visible = false;
      return;
    }

    let dx = aim.charging ? aim.lockedCos : aim.cos;
    let dz = aim.charging ? aim.lockedSin : aim.sin;
    const directionLength = Math.hypot(dx, dz);

    if (!Number.isFinite(directionLength) || directionLength < EPS) {
      cache.current = null;
      cueGeometry.setDrawRange(0, 0);
      objectGeometry.setDrawRange(0, 0);
      ghost.visible = false;
      return;
    }

    dx /= directionLength;
    dz /= directionLength;
    const revision = getWorldRevision();
    const previous = cache.current;
    if (previous && previous.x === cueBall.x && previous.z === cueBall.z && previous.dx === dx && previous.dz === dz && previous.revision === revision) return;
    cache.current = { x: cueBall.x, z: cueBall.z, dx, dz, revision };
    const cuePoints = cueGeometry.attributes.position.array;
    const objectPoints = objectGeometry.attributes.position.array;
    let x = cueBall.x;
    let z = cueBall.z;
    let remaining = PATH_LENGTH;
    let bounces = 0;
    let count = pushPoint(cuePoints, 0, x, z);
    let target = null;

    while (remaining > EPS && count < MAX_POINTS) {
      findNextEvent(event, x, z, dx, dz, remaining, cueBall, null);
      x += dx * event.distance;
      z += dz * event.distance;
      count = pushPoint(cuePoints, count, x, z);
      remaining -= event.distance;
      if (event.type === EVENT_BALL) {
        target = event.ball;
        break;
      }
      if (event.type !== EVENT_WALL || bounces >= MAX_BOUNCES) {
        break;
      }
      if (event.reflectX) dx = -dx;
      if (event.reflectZ) dz = -dz;
      bounces++;
      x += dx * EPS;
      z += dz * EPS;
      remaining -= EPS;
    }

    if (!target) {
      ghost.visible = false;
      objectGeometry.setDrawRange(0, 0);
      commit(cueGeometry, count);
      return;
    }

    let normalX = target.x - x;
    let normalZ = target.z - z;
    const normalLength = Math.hypot(normalX, normalZ);
    if (normalLength < EPS) {
      ghost.visible = false;
      objectGeometry.setDrawRange(0, 0);
      commit(cueGeometry, count);
      return;
    }

    normalX /= normalLength;
    normalZ /= normalLength;
    ghost.position.set(x, 0, z);
    ghost.visible = true;
    const normalSpeedFraction = Math.max(0, dx * normalX + dz * normalZ);
    let objectCount = pushPoint(objectPoints, 0, target.x, target.z);
    objectCount = extendPath(event, objectPoints, objectCount, target.x, target.z, normalX, normalZ, OBJECT_GUIDE_LENGTH * normalSpeedFraction, POST_HIT_BOUNCES, target, cueBall);
    commit(objectGeometry, objectCount);
    const tangentX = dx - normalSpeedFraction * normalX;
    const tangentZ = dz - normalSpeedFraction * normalZ;
    const tangentLength = Math.hypot(tangentX, tangentZ);
    if (tangentLength > 0.02) {
      count = extendPath(event, cuePoints, count, x, z, tangentX / tangentLength, tangentZ / tangentLength, DEFLECT_GUIDE_LENGTH * tangentLength, POST_HIT_BOUNCES, cueBall, target);
    }

    commit(cueGeometry, count);
  });

  return <>
    <GuideLine color="white" geometryRef={cueRef} />
    <GuideLine color="yellow" geometryRef={objectRef} />
    <GhostBall lineRef={ghostRef} />
  </>;
}

export {
  AimGuideRenderer as default
};
