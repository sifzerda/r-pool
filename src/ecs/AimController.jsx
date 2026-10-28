// src/ecs/AimController.jsx

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import {
  canAim,
  ballQuery,
  markDirty,
  deactiveBall,
} from "./world.js";

import {
  BALL_Y,
  MAX_POWER,
  MAX_PULL,
  MIN_PULL,
} from "./constants/table.js";

import {
  MIN_X,
  MAX_X,
  MIN_Z,
  MAX_Z,
} from "./constants/tableBounds.js";

import { findCapturePocket } from "./constants/pockets.js";
import useGameStore from "../store/useGameStore.js";

function createAim() {
  return {
    angle: 0,
    cos: 1,
    sin: 0,
    power: 0,
    pullBack: 0,
    charging: false,
    pointerId: null,
    hasPointer: false,
    pointerX: 0,
    pointerZ: 0,
    dragStartX: 0,
    dragStartZ: 0,
    lockedAngle: 0,
    lockedCos: 1,
    lockedSin: 0,
    swing: 0,
    swingT: 0,
    shotX: 0,
    shotZ: 0,
    shotPullBack: 0,
    pendingShot: null,
    handX: 0,
    handZ: 0,
    handLift: 0,
  };
}

function aimAtPointer(aim, cue) {
  if (!aim.hasPointer) return;

  const dx = aim.pointerX - cue.x;
  const dz = aim.pointerZ - cue.z;
  const length = Math.hypot(dx, dz);

  if (length < 1e-5) return;

  aim.angle = Math.atan2(dz, dx);
  aim.cos = dx / length;
  aim.sin = dz / length;
}

function isValidCuePosition(x, z, cueBall) {
  if (
    x < MIN_X ||
    x > MAX_X ||
    z < MIN_Z ||
    z > MAX_Z ||
    findCapturePocket(x, z)
  ) {
    return false;
  }

  const minimumDistance = 2 * 0.1 + 0.01;

  for (const ball of ballQuery.entities) {
    if (
      ball === cueBall ||
      ball.pocketed ||
      ball.falling ||
      ball.scratched
    ) {
      continue;
    }

    if (
      (ball.x - x) ** 2 + (ball.z - z) ** 2 <
      minimumDistance ** 2
    ) {
      return false;
    }
  }

  return true;
}

function placeCueBall(cueBall, x, z) {
  if (!isValidCuePosition(x, z, cueBall)) return false;

  Object.assign(cueBall, {
    x,
    z,
    y: BALL_Y,
    vx: 0,
    vz: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scratched: false,
    pocketed: false,
    falling: false,
    fallSpeed: 0,
  });

  deactiveBall(cueBall);
  markDirty(cueBall);

  return true;
}

function AimController({ cueBall, aimRef }) {
  const { gl, camera, invalidate } = useThree();

  const scratch = useMemo(() => ({
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    hit: new THREE.Vector3(),
    wasPlacing: false,
    plane: new THREE.Plane(
      new THREE.Vector3(0, 1, 0),
      -BALL_Y
    ),
    lastCueX: NaN,
    lastCueZ: NaN,
  }), []);

  function isHumanTurn() {
    const game = useGameStore.getState();
    return (
      game.screen === "play" &&
      game.currentPlayer === "human" &&
      !game.winner
    );
  }

  function isPlacingBall() {
    const game = useGameStore.getState();
    return game.ballInHand && isHumanTurn();
  }

  useFrame(() => {
    const aim = aimRef.current;
 const placing = isPlacingBall();

    if (placing) {
        if (!scratch.wasPlacing) {
            aim.handX = cueBall.x;
            aim.handZ = cueBall.z;
            aim.handLift = 0;
        }

        scratch.wasPlacing = true;
        return;
    }

    scratch.wasPlacing = false;

    if (
        !isHumanTurn() ||
        aim.charging ||
        !canAim(cueBall, aim)
    ) {
        return;
    }

    if (
        cueBall.x === scratch.lastCueX &&
        cueBall.z === scratch.lastCueZ
    ) {
        return;
    }

    scratch.lastCueX = cueBall.x;
    scratch.lastCueZ = cueBall.z;

    aimAtPointer(aim, cueBall);
}, -2);

  useEffect(() => {
    const element = gl.domElement;
    const aim = aimRef.current;

    const previousTouchAction = element.style.touchAction;
    element.style.touchAction = "none";

    let frame = null;
    let latest = null;

    function updatePointer(event) {
      const rect = element.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) return false;

      scratch.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      camera.updateMatrixWorld();
      scratch.raycaster.setFromCamera(scratch.pointer, camera);

      if (
        !scratch.raycaster.ray.intersectPlane(
          scratch.plane,
          scratch.hit
        )
      ) {
        return false;
      }

aim.pointerX = scratch.hit.x;
aim.pointerZ = scratch.hit.z;
aim.hasPointer = true;

const game = useGameStore.getState();

if (isPlacingBall() || game.debugShowHand) {
    aim.handX = scratch.hit.x;
    aim.handZ = scratch.hit.z;
    aim.handLift = 0;
}

      if (isPlacingBall()) {
        aim.handX = scratch.hit.x;
        aim.handZ = scratch.hit.z;
        aim.handLift = 0;
      }

      return true;
    }

    function updatePull() {
      const pull = Math.max(
        0,
        -(
          (aim.pointerX - aim.dragStartX) * aim.lockedCos +
          (aim.pointerZ - aim.dragStartZ) * aim.lockedSin
        )
      );

      aim.pullBack = Math.min(MAX_PULL, pull);
      aim.power = (aim.pullBack / MAX_PULL) * MAX_POWER;
    }

    function stopFrame() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      latest = null;
    }

    function releasePointer(id) {
      if (id === null) return;

      try {
        if (element.hasPointerCapture?.(id)) {
          element.releasePointerCapture(id);
        }
      } catch {
        // Pointer capture may already have been released.
      }
    }

    function cancelCharge() {
      stopFrame();

      if (!aim.charging) return;

      const id = aim.pointerId;

      aim.pointerId = null;
      aim.charging = false;
      aim.power = 0;
      aim.pullBack = 0;
      aim.swing = 0;
      aim.swingT = 0;

      releasePointer(id);
      invalidate();
    }

    function applyMove() {
      frame = null;

      const event = latest;
      latest = null;

      if (!event || !updatePointer(event)) return;

      if (aim.charging) {
        updatePull();
      } else if (
        isHumanTurn() &&
        !isPlacingBall() &&
        canAim(cueBall, aim)
      ) {
        aimAtPointer(aim, cueBall);
      }

      invalidate();
    }

    function onMove(event) {
      if (
        aim.charging
          ? event.pointerId !== aim.pointerId
          : event.isPrimary === false
      ) {
        return;
      }

      latest = {
        clientX: event.clientX,
        clientY: event.clientY,
      };

      if (frame === null) {
        frame = requestAnimationFrame(applyMove);
      }
    }

    function onDown(event) {
      if (
        event.button !== 0 ||
        event.isPrimary === false ||
        aim.charging ||
        !isHumanTurn()
      ) {
        return;
      }

      stopFrame();

      if (!updatePointer(event)) return;

      // Ball-in-hand: click a legal location to place the cue ball.
      if (isPlacingBall()) {
        event.preventDefault();

        const placed = placeCueBall(
          cueBall,
          aim.pointerX,
          aim.pointerZ
        );

        if (placed) {
          useGameStore.setState({ ballInHand: false });
          scratch.lastCueX = NaN;
          scratch.lastCueZ = NaN;
        }

        invalidate();
        return;
      }

      if (!canAim(cueBall, aim)) return;

      event.preventDefault();

      aimAtPointer(aim, cueBall);

      aim.pointerId = event.pointerId;
      aim.charging = true;
      aim.power = 0;
      aim.pullBack = 0;

      aim.lockedAngle = aim.angle;
      aim.lockedCos = aim.cos;
      aim.lockedSin = aim.sin;

      aim.dragStartX = aim.pointerX;
      aim.dragStartZ = aim.pointerZ;

      aim.swing = 1;
      aim.swingT = 0;

      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        cancelCharge();
        return;
      }

      invalidate();
    }

    function onUp(event) {
      if (!aim.charging || event.pointerId !== aim.pointerId) return;

      stopFrame();

      if (!isHumanTurn() || !canAim(cueBall, aim)) {
        cancelCharge();
        return;
      }

      if (updatePointer(event)) updatePull();

      if (aim.pullBack < MIN_PULL) {
        cancelCharge();
        return;
      }

      const id = aim.pointerId;

      aim.pendingShot = {
        cos: aim.lockedCos,
        sin: aim.lockedSin,
        power: aim.power,
        player: "human",
      };

      aim.shotX = cueBall.x;
      aim.shotZ = cueBall.z;
      aim.shotPullBack = aim.pullBack;

      aim.pointerId = null;
      aim.charging = false;
      aim.swing = 2;
      aim.swingT = 0;
      aim.power = 0;
      aim.pullBack = 0;

      releasePointer(id);
      invalidate();
    }

    function onCancel(event) {
      if (event.pointerId === aim.pointerId) {
        cancelCharge();
      }
    }

    function onKey(event) {
      if (event.key === "Escape" && aim.charging) {
        event.preventDefault();
        cancelCharge();
      }
    }

    function onHidden() {
      if (document.hidden) cancelCharge();
    }

    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onCancel);
    element.addEventListener("lostpointercapture", onCancel);

    window.addEventListener("blur", cancelCharge);
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onCancel);
      element.removeEventListener("lostpointercapture", onCancel);

      window.removeEventListener("blur", cancelCharge);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHidden);

      cancelCharge();
      stopFrame();

      element.style.touchAction = previousTouchAction;
    };
  }, [gl, camera, invalidate, cueBall, aimRef, scratch]);

  return null;
}

export {
  createAim,
  placeCueBall,
  isValidCuePosition,
  AimController as default,
};