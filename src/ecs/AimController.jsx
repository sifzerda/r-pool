// src/ecs/AimController.jsx
// Replaces InputSystem + CueSystem.
// Event driven: no per-frame raycast, works with mouse and touch, and only
// reacts to the canvas (not clicks elsewhere on the page).

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { activeBalls } from "./world";
import { MAX_POWER, MAX_PULL } from "./constants/table";

function aimAtPointer(aim, cueBall) {
  const angle = Math.atan2(aim.pointerZ - cueBall.z, aim.pointerX - cueBall.x);

  aim.angle = angle;
  aim.cos = Math.cos(angle);
  aim.sin = Math.sin(angle);
}

export default function AimController({ cueBall, aimRef }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  // Keep the aim following the cue ball (e.g. after a scratch reset).
  useFrame(() => {
    if (!aimRef.current.charging && activeBalls.size === 0) {
      aimAtPointer(aimRef.current, cueBall);
    }
  });

  useEffect(() => {
    const el = gl.domElement;
    const aim = aimRef.current;
    const prevTouchAction = el.style.touchAction;

    el.style.touchAction = "none";

    // Top-down orthographic camera: screen pixels map straight to world units.
    // Screen right = +x, screen down = +z.
    function updatePointer(e) {
      const rect = el.getBoundingClientRect();

      aim.pointerX = (e.clientX - rect.left - rect.width / 2) / camera.zoom;
      aim.pointerZ = (e.clientY - rect.top - rect.height / 2) / camera.zoom;
    }

    function onMove(e) {
      updatePointer(e);

      if (aim.charging) {
        const dx = aim.pointerX - aim.dragStartX;
        const dz = aim.pointerZ - aim.dragStartZ;

        // Power increases when dragging opposite to the aim vector.
        const pull = Math.max(0, -(dx * aim.lockedCos + dz * aim.lockedSin));

        aim.pullBack = Math.min(pull, MAX_PULL);
        aim.power = (aim.pullBack / MAX_PULL) * MAX_POWER;
      }

      invalidate();
    }

    function onDown(e) {
      if (e.button !== 0 || aim.charging) return;
      if (activeBalls.size > 0 || cueBall.pocketed || cueBall.falling) return;

      updatePointer(e);
      aimAtPointer(aim, cueBall);

      el.setPointerCapture?.(e.pointerId);

      aim.charging = true;
      aim.pullBack = 0;
      aim.power = 0;

      // Lock the aim direction while charging.
      aim.lockedAngle = aim.angle;
      aim.lockedCos = aim.cos;
      aim.lockedSin = aim.sin;

      aim.dragStartX = aim.pointerX;
      aim.dragStartZ = aim.pointerZ;

      aim.swing = 1;
      invalidate();
    }

    function onUp(e) {
      if (e.button !== 0 || !aim.charging) return;

      el.releasePointerCapture?.(e.pointerId);

      aim.charging = false;

      aim.pendingShot = {
        cos: aim.lockedCos,
        sin: aim.lockedSin,
        power: aim.power,
      };

      aim.swing = 2;
      aim.swingT = 0;
      aim.power = 0;
      aim.pullBack = 0;

      invalidate();
    }

    function onCancel() {
      if (!aim.charging) return;

      aim.charging = false;
      aim.power = 0;
      aim.pullBack = 0;
      aim.swing = 0;

      invalidate();
    }

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onCancel);

    return () => {
      el.style.touchAction = prevTouchAction;
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onCancel);
    };
  }, [gl, camera, invalidate, cueBall, aimRef]);

  return null;
}
