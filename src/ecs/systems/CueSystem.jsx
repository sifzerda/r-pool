// src/ecs/systems/CueSystem.jsx

import { useEffect } from "react";
import { activeBalls } from "../world.js";

export default function CueSystem({ cueBall, aimRef }) {
  useEffect(() => {
    function down(event) {
      // Only use the left mouse button.
      if (event.button !== 0) return;

      if (activeBalls.size > 0) return;
      if (cueBall.pocketed || cueBall.falling) return;

      const aim = aimRef.current;

      if (aim.charging) return;

      aim.charging = true;
      aim.pullBack = 0;
      aim.power = 0;

      // Lock the current aim direction.
      aim.lockedAngle = aim.angle;
      aim.lockedCos = aim.cos;
      aim.lockedSin = aim.sin;

      // Record where the mouse was when clicked.
      aim.dragStartX = aim.pointerX;
      aim.dragStartZ = aim.pointerZ;

      aim.swing = 1;
    }

    function up(event) {
      if (event.button !== 0) return;

      const aim = aimRef.current;

      if (!aim.charging) return;

      aim.charging = false;

      const power = aim.power;

      aim.pendingShot = {
        angle: aim.lockedAngle,
        cos: aim.lockedCos,
        sin: aim.lockedSin,
        power,
      };

      aim.swing = 2;
      aim.swingT = 0;

      aim.power = 0;
      aim.pullBack = 0;
    }

    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [cueBall, aimRef]);

  return null;
}
