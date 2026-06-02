// src/ecs/systems/CueSystem.jsx

import { useEffect } from "react";
import { BALL_R } from "../constants/table.js";

const MAX_POWER = 800;

export default function CueSystem({
  cueBall,
  aimRef,
}) {

   useEffect(() => {
    let charging = false;
    let chargeStart = 0;

    function down() {
      if (Math.abs(cueBall.vx) > 0.05 ||
          Math.abs(cueBall.vy) > 0.05)
        return;

      charging = true;
      chargeStart = performance.now();

      aimRef.current.swing = 1; // backswing
    }

    function up() {
      if (!charging) return;
      charging = false;

      const power = aimRef.current.power;

      aimRef.current.swing = 2; // strike animation
      aimRef.current.swingT = 0;

      cueBall.sleeping = false;

      cueBall.vx =
        Math.cos(aimRef.current.angle) * power;

      cueBall.vy =
        Math.sin(aimRef.current.angle) * power;

      aimRef.current.power = 0;
    }

    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    const interval = setInterval(() => {
      if (!charging) return;

      const held =
        (performance.now() - chargeStart) / 1000;

      aimRef.current.power =
        Math.min(MAX_POWER, held * 400);
    }, 16);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [cueBall, aimRef]);

  return null;
}