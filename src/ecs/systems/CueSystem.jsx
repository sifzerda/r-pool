// src/ecs/systems/CueSystem.jsx

import { useEffect } from "react";

const MAX_POWER = 18;

export default function CueSystem({ cueBall, aimRef }) {
  useEffect(() => {
    let charging = false;
    let chargeStart = 0;

    function isMoving() {
      return Math.hypot(cueBall.vx, cueBall.vz) > 0.05;
    }

    function down() {
      if (isMoving()) return;

      charging = true;
      chargeStart = performance.now();

      aimRef.current.swing = 1;
    }

    function up() {
      if (!charging) return;
      charging = false;

      const power = aimRef.current.power;

      aimRef.current.swing = 2;
      aimRef.current.swingT = 0;

      cueBall.sleeping = false;

      const angle = aimRef.current.angle;

      // FIXED scaling (feels like real cue impulse)
      const strength = power * 2.2;

      aimRef.current.pendingShot = {
        power,
        angle: aimRef.current.angle,
      };

      aimRef.current.power = 0;
    }

    function update() {
      if (!charging) return;

      const held = (performance.now() - chargeStart) * 0.001;

      // smoother + more controllable power curve
      const t = Math.min(1, held * 1.2);
      aimRef.current.power = t * t * MAX_POWER;
    }

    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    const id = setInterval(update, 16);

    return () => {
      clearInterval(id);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [cueBall, aimRef]);

  return null;
}