// src/ecs/utils/createBallTexture.js

import { CanvasTexture, SRGBColorSpace } from "three";

export function createBallTexture(number, color, stripe = false) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  // ------------------------
  // base
  // ------------------------

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // ------------------------
  // stripe / solid
  // ------------------------

  ctx.fillStyle = color;

  if (stripe) {
    ctx.fillRect(0, size * 0.33, size, size * 0.34);
  } else {
    ctx.fillRect(0, 0, size, size);
  }

  // ------------------------
  // draw number circles
  // ------------------------

  const positions = [
    size * 0.25,
    size * 0.75,
  ];

  for (const x of positions) {

    ctx.beginPath();

    ctx.arc(x, size / 2, size * 0.12, 0, Math.PI * 2);

    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.lineWidth = 6;
    ctx.strokeStyle = "#dddddd";
    ctx.stroke();

    if (number !== "") {

      ctx.fillStyle = "#000000";
      ctx.font = "bold 250px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(String(number), x, size / 2);
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  texture.colorSpace = SRGBColorSpace;

  return texture;
}

