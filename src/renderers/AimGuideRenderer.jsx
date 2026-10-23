// src/renderers/AimGuideRenderer.jsx

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ballQuery, activeBalls } from "../ecs/world";
import { BALL_R, PLAY_X, PLAY_Z, POCKET_R } from "../ecs/constants/table";

const GUIDE_Y = 0.45;

const PATH_LENGTH = 8; // max distance the cue ball is traced before it hits a ball
const MAX_BOUNCES = 3; // cushion bounces traced before contact
const OBJECT_GUIDE_LENGTH = 2; // target-ball path
const DEFLECT_GUIDE_LENGTH = 1.5; // cue-ball path after contact (scaled by cut angle)
const POST_HIT_BOUNCES = 1;

const DIAM = BALL_R * 2;
const DIAM_SQ = DIAM * DIAM;
const EPS = 1e-6;
const MAX_PTS = 12;

// Same limits and pocket openings as src/ecs/systems/physics.js (table centred
// on the origin, ball-centre limits one radius inside the cushion faces).
const OPENING = POCKET_R + BALL_R;
const MIN_X = -PLAY_X + BALL_R;
const MAX_X = PLAY_X - BALL_R;
const MIN_Z = -PLAY_Z + BALL_R;
const MAX_Z = PLAY_Z - BALL_R;

// Left/right cushions only have the corner pockets.
function inCornerGap(v, play) {
  return Math.abs(v + play) < OPENING || Math.abs(v - play) < OPENING;
}

// Top/bottom cushions also have the middle pocket.
function inPocketGap(v, play) {
  return inCornerGap(v, play) || Math.abs(v) < OPENING;
}

const GHOST_SEGMENTS = 32;

// Scratch results so the per-frame code doesn't allocate.
const wall = { t: Infinity, axis: 0, gap: false };
const hit = { t: Infinity, ball: null };

/**
 * Distance along (dx,dz) from (x,z) to the first cushion. axis: 1 = x wall,
 * 2 = z wall. gap = the ball would reach that wall inside a pocket opening
 * (physics lets it through, so the guide ends there instead of bouncing).
 */
function rayToWall(x, z, dx, dz) {
  let t = Infinity;
  let axis = 0;

  if (dx > EPS) {
    t = (MAX_X - x) / dx;
    axis = 1;
  } else if (dx < -EPS) {
    t = (MIN_X - x) / dx;
    axis = 1;
  }

  let tz = Infinity;
  if (dz > EPS) tz = (MAX_Z - z) / dz;
  else if (dz < -EPS) tz = (MIN_Z - z) / dz;

  if (tz < t) {
    t = tz;
    axis = 2;
  }

  t = Math.max(t, 0);
  wall.t = t;
  wall.axis = axis;
  wall.gap = false;
  if (axis === 1) wall.gap = inCornerGap(z + dz * t, PLAY_Z);
  else if (axis === 2) wall.gap = inPocketGap(x + dx * t, PLAY_X);
  return wall;
}

/**
 * First ball whose centre the moving cue-ball centre would come within 2R of,
 * travelling from (x,z) along unit dir. Result in `hit` (t = distance of the
 * cue centre at the moment of contact).
 */
function findBallHit(x, z, dx, dz, cueBall) {
  const balls = ballQuery.entities;
  hit.t = Infinity;
  hit.ball = null;

  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];
    if (ball === cueBall || ball.pocketed || ball.falling) continue;

    const relX = ball.x - x;
    const relZ = ball.z - z;

    const t = relX * dx + relZ * dz; // closest-approach distance
    if (t <= 0) continue;

    const d2 = relX * relX + relZ * relZ - t * t; // perpendicular distance squared
    if (d2 >= DIAM_SQ) continue;

    // Contact happens BEFORE closest approach.
    const tHit = Math.max(t - Math.sqrt(DIAM_SQ - d2), 0);
    if (tHit < hit.t) {
      hit.t = tHit;
      hit.ball = ball;
    }
  }
}

function pushPoint(p, n, x, z) {
  p[n * 3] = x;
  p[n * 3 + 1] = GUIDE_Y;
  p[n * 3 + 2] = z;
  return n + 1;
}

/**
 * Append points for a straight path from (x,z) that reflects off cushions
 * (balls ignored). (x,z) must already be the last pushed point.
 */
function extendPath(p, n, x, z, dx, dz, len, maxBounces) {
  for (let b = 0; b <= maxBounces && len > 0.001 && n < MAX_PTS; b++) {
    const w = rayToWall(x, z, dx, dz);
    const wallT = w.t;
    const axis = w.axis;
    const gap = w.gap;

    const seg = Math.min(len, wallT);
    x += dx * seg;
    z += dz * seg;
    n = pushPoint(p, n, x, z);
    len -= seg;

    if (axis === 0 || seg < wallT || gap) break; // out of length, or into a pocket

    if (axis === 1) dx = -dx;
    else dz = -dz;
  }
  return n;
}

function commit(geo, n) {
  if (n < 2) {
    geo.setDrawRange(0, 0);
    return;
  }
  geo.attributes.position.needsUpdate = true;
  geo.setDrawRange(0, n);
}

function GuideLine({ color, geoRef }) {
  const positions = useMemo(() => new Float32Array(MAX_PTS * 3), []);

  return (
    <line renderOrder={999} frustumCulled={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} depthTest={false} transparent opacity={0.85} />
    </line>
  );
}

/** Ring showing where the cue ball will be at the moment of contact. */
function GhostBall({ groupRef }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(GHOST_SEGMENTS * 3);
    for (let i = 0; i < GHOST_SEGMENTS; i++) {
      const a = (i / GHOST_SEGMENTS) * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * BALL_R;
      arr[i * 3 + 1] = GUIDE_Y;
      arr[i * 3 + 2] = Math.sin(a) * BALL_R;
    }
    return arr;
  }, []);

  return (
    <lineLoop ref={groupRef} renderOrder={999} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="white" depthTest={false} transparent opacity={0.7} />
    </lineLoop>
  );
}

export default function AimGuideRenderer({ cueBall, aimRef }) {
  const cueRef = useRef(); // white: the whole cue-ball path
  const objectRef = useRef(); // yellow: the ball that gets hit
  const ghostRef = useRef();
  const cache = useRef({ dx: NaN, dz: NaN, x: NaN, z: NaN });

  useFrame(() => {
    const cueGeo = cueRef.current;
    const objectGeo = objectRef.current;
    const ghost = ghostRef.current;

    if (!cueGeo || !objectGeo || !ghost) return;

    if (activeBalls.size > 0 || cueBall.pocketed || cueBall.falling) {
      cueGeo.setDrawRange(0, 0);
      objectGeo.setDrawRange(0, 0);
      ghost.visible = false;
      cache.current.dx = NaN;
      return;
    }

    // Normalise defensively so stale/unnormalised cos/sin can't skew the maths.
    let { cos: dirX, sin: dirZ } = aimRef.current;
    const dirLen = Math.hypot(dirX, dirZ);
    if (dirLen < EPS) return;
    dirX /= dirLen;
    dirZ /= dirLen;

    const c = cache.current;
    if (dirX === c.dx && dirZ === c.dz && cueBall.x === c.x && cueBall.z === c.z) return;
    c.dx = dirX;
    c.dz = dirZ;
    c.x = cueBall.x;
    c.z = cueBall.z;

    const cuePts = cueGeo.attributes.position.array;
    const objPts = objectGeo.attributes.position.array;

    // ── Trace the cue ball: straight, bouncing off cushions, until it touches a ball.
    let x = cueBall.x;
    let z = cueBall.z;
    let dx = dirX;
    let dz = dirZ;
    let budget = PATH_LENGTH;

    let n = pushPoint(cuePts, 0, x, z);
    let target = null;
    let contactX = 0;
    let contactZ = 0;

    for (let b = 0; b <= MAX_BOUNCES && budget > 0.001 && n < MAX_PTS - 4; b++) {
      const w = rayToWall(x, z, dx, dz);
      const wallT = w.t;
      const axis = w.axis;
      const gap = w.gap;

      findBallHit(x, z, dx, dz, cueBall);

      if (hit.ball && hit.t <= Math.min(wallT, budget)) {
        target = hit.ball;
        contactX = x + dx * hit.t;
        contactZ = z + dz * hit.t;
        n = pushPoint(cuePts, n, contactX, contactZ);
        break; // (dx, dz) is now the direction at the moment of impact
      }

      const seg = Math.min(wallT, budget);
      x += dx * seg;
      z += dz * seg;
      n = pushPoint(cuePts, n, x, z);
      budget -= seg;

      if (axis === 0 || seg < wallT || gap) break; // out of length, or into a pocket

      if (axis === 1) dx = -dx;
      else dz = -dz;
    }

    if (!target) {
      ghost.visible = false;
      objectGeo.setDrawRange(0, 0);
      commit(cueGeo, n);
      return;
    }

    // ── Contact: target ball goes along the line of centres, cue ball along the tangent.
    const normalX = (target.x - contactX) / DIAM;
    const normalZ = (target.z - contactZ) / DIAM;

    ghost.position.set(contactX, 0, contactZ);
    ghost.visible = true;

    // Yellow: target ball path.
    let m = pushPoint(objPts, 0, target.x, target.z);
    m = extendPath(objPts, m, target.x, target.z, normalX, normalZ, OBJECT_GUIDE_LENGTH, POST_HIT_BOUNCES);
    commit(objectGeo, m);

    // White (continued): cue ball after contact. Equal masses, no friction:
    // it keeps the tangential component of its velocity. Its speed fraction is
    // |tangent|, so the line shrinks to nothing on a dead-straight hit.
    const dot = dx * normalX + dz * normalZ;
    const tx = dx - dot * normalX;
    const tz = dz - dot * normalZ;
    const tLen = Math.hypot(tx, tz);

    if (tLen > 0.02) {
      n = extendPath(
        cuePts, n, contactX, contactZ,
        tx / tLen, tz / tLen,
        DEFLECT_GUIDE_LENGTH * tLen,
        POST_HIT_BOUNCES
      );
    }

    commit(cueGeo, n);
  });

  return (
    <>
      <GuideLine color="white" geoRef={cueRef} />
      <GuideLine color="yellow" geoRef={objectRef} />
      <GhostBall groupRef={ghostRef} />
    </>
  );
}