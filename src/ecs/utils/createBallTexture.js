// src/ecs/utils/createBallTexture.js

import {
  CanvasTexture,
} from "three";

export function createBallTexture(number, color, stripe = false) {
  const size = 512;

  const canvas = document.createElement("canvas");

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  // white base

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // stripe or solid

  ctx.fillStyle = color;

  if (stripe) {
    ctx.fillRect(0, size * 0.33, size, size * 0.34);
  } else {
    ctx.fillRect(0, 0, size, size);
  }

  // number circle

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.12, 0, Math.PI * 2);

  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.fillStyle = "#000000";

  ctx.font = "bold 64px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(String(number), size / 2, size / 2);

  const texture = new CanvasTexture(canvas);

  texture.needsUpdate = true;

  return texture;
}