// src/ecs/AimController.jsx
// Replaces InputSystem + CueSystem.
// Event driven: no per-frame raycast, works with mouse and touch, and only
// reacts to the canvas (not clicks elsewhere on the page).

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { canAim } from "./world.js";
import { BALL_Y, MAX_POWER, MAX_PULL, MIN_PULL } from "./constants/table.js";

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
    pendingShot: null
  };
}

function aimAtPointer(aim, cue) {
  if (!aim.hasPointer) return;
  const dx = aim.pointerX - cue.x, dz = aim.pointerZ - cue.z;
  const length = Math.hypot(dx, dz);
  if (length < 1e-5) return;
  aim.angle = Math.atan2(dz, dx);
  aim.cos = dx / length;
  aim.sin = dz / length;
}

function AimController({ cueBall, aimRef }) {
  const { gl, camera, invalidate } = useThree();
  const scratch = useMemo(() => ({
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
    hit: new THREE.Vector3(),
    plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -BALL_Y),
    lastCueX: NaN,
    lastCueZ: NaN
  }), []);

  useFrame(() => {
    const aim = aimRef.current;
    if (aim.charging || !canAim(cueBall, aim)) return;
    if (cueBall.x === scratch.lastCueX && cueBall.z === scratch.lastCueZ) return;
    scratch.lastCueX = cueBall.x;
    scratch.lastCueZ = cueBall.z;
    aimAtPointer(aim, cueBall);
  }, -2);

  useEffect(() => {
    const element = gl.domElement, aim = aimRef.current;
    const previousTouchAction = element.style.touchAction;
    element.style.touchAction = "none";
    let frame = null, latest = null;
    function updatePointer(event) {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      scratch.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      camera.updateMatrixWorld();
      scratch.raycaster.setFromCamera(scratch.pointer, camera);
      if (!scratch.raycaster.ray.intersectPlane(scratch.plane, scratch.hit)) return false;
      aim.pointerX = scratch.hit.x;
      aim.pointerZ = scratch.hit.z;
      aim.hasPointer = true;
      return true;
    }

    function updatePull() {
      const pull = Math.max(0, -((aim.pointerX - aim.dragStartX) * aim.lockedCos + (aim.pointerZ - aim.dragStartZ) * aim.lockedSin));
      aim.pullBack = Math.min(MAX_PULL, pull);
      aim.power = aim.pullBack / MAX_PULL * MAX_POWER;
    }

    function stopFrame() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      latest = null;
    }

    function releasePointer(id) {
      if (id === null) return;
      try {
        if (element.hasPointerCapture?.(id)) element.releasePointerCapture(id);
      } catch {
      }
    }

    function cancelCharge() {
      stopFrame();
      if (!aim.charging) return;
      const id = aim.pointerId;
      aim.pointerId = null;
      aim.charging = false;
      aim.power = aim.pullBack = aim.swing = aim.swingT = 0;
      releasePointer(id);
      invalidate();
    }

    function applyMove() {
      frame = null;
      const event = latest;
      latest = null;
      if (!event || !updatePointer(event)) return;
      if (aim.charging) updatePull();
      else if (canAim(cueBall, aim)) aimAtPointer(aim, cueBall);
      invalidate();
    }

    function onMove(event) {
      if (aim.charging ? event.pointerId !== aim.pointerId : event.isPrimary === false) return;
      latest = { clientX: event.clientX, clientY: event.clientY };
      if (frame === null) frame = requestAnimationFrame(applyMove);
    }

    function onDown(event) {
      if (event.button !== 0 || event.isPrimary === false || aim.charging || !canAim(cueBall, aim)) return;
      stopFrame();
      if (!updatePointer(event)) return;
      event.preventDefault();
      aimAtPointer(aim, cueBall);
      aim.pointerId = event.pointerId;
      aim.charging = true;
      aim.power = aim.pullBack = 0;
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
      if (!canAim(cueBall, aim)) {
        cancelCharge();
        return;
      }
      if (updatePointer(event)) updatePull();
      if (aim.pullBack < MIN_PULL) {
        cancelCharge();
        return;
      }
      const id = aim.pointerId;
      aim.pendingShot = { cos: aim.lockedCos, sin: aim.lockedSin, power: aim.power };
      aim.shotX = cueBall.x;
      aim.shotZ = cueBall.z;
      aim.shotPullBack = aim.pullBack;
      aim.pointerId = null;
      aim.charging = false;
      aim.swing = 2;
      aim.swingT = 0;
      aim.power = aim.pullBack = 0;
      releasePointer(id);
      invalidate();
    }

    function onCancel(event) {
      if (event.pointerId === aim.pointerId) cancelCharge();
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
  AimController as default
};
