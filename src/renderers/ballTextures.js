// src/renderers/ballTextures.js
// One 1024x1024 atlas (4x4 cells of 256px) shared by every ball.
// redrawAtlas() repaints it when the Lab changes colours/stripes/numbers.

import { CanvasTexture, Color, SRGBColorSpace, LinearFilter } from "three";
import { BALLS } from "../ecs/constants/balls.js";

const GRID = 4, CELL_SIZE = 256, SIZE = GRID * CELL_SIZE;
const DEFAULT_ATLAS_OPTS = { saturation: 1, brightness: 1, stripeWidth: 0.34, badgeSize: 0.12 };
const hsl = { h: 0, s: 0, l: 0 }, color = new Color();

function adjust(hex, saturation, brightness) {
  color.set(hex);
  color.getHSL(hsl, SRGBColorSpace);
  color.setHSL(hsl.h, Math.max(0, Math.min(1, hsl.s * saturation)), Math.max(0, Math.min(1, hsl.l * brightness)), SRGBColorSpace);
  return `#${color.getHexString(SRGBColorSpace)}`;
}

const canvas = document.createElement("canvas");
canvas.width = canvas.height = SIZE;
const ctx = canvas.getContext("2d");

function paint(options) {
  const o = { ...DEFAULT_ATLAS_OPTS, ...options };
  ctx.clearRect(0, 0, SIZE, SIZE);
  for (const ball of BALLS) {
    const x = ball.id % GRID * CELL_SIZE, y = Math.floor(ball.id / GRID) * CELL_SIZE, s = CELL_SIZE;
    const c = adjust(ball.color, o.saturation, o.brightness);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = ball.type === "solid" || ball.type === "eight" ? c : "#ffffff";
    ctx.fillRect(0, 0, s, s);
    if (ball.type === "stripe") {
      ctx.fillStyle = c;
      ctx.fillRect(0, s * (0.5 - o.stripeWidth / 2), s, s * o.stripeWidth);
    }
    if (ball.type !== "cue") {
      const r = s * o.badgeSize;
      ctx.font = `bold ${Math.round(r * 2.04)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = s * 6e-3;
      for (const cx of [s * 0.25, s * 0.75]) {
        ctx.beginPath();
        ctx.arc(cx, s / 2, r, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#dddddd";
        ctx.stroke();
        ctx.fillStyle = "#000000";
        ctx.fillText(String(ball.id), cx, s / 2);
      }
    }
    ctx.restore();
  }
}

paint();
const ballAtlas = new CanvasTexture(canvas);
ballAtlas.colorSpace = SRGBColorSpace;
ballAtlas.generateMipmaps = false;
ballAtlas.minFilter = LinearFilter;
ballAtlas.magFilter = LinearFilter;
function redrawAtlas(options) {
  paint(options);
  ballAtlas.needsUpdate = true;
}

function getBallUvOffset(id) {
  return [id % GRID / GRID, (GRID - 1 - Math.floor(id / GRID)) / GRID];
}

export {
  DEFAULT_ATLAS_OPTS,
  ballAtlas,
  getBallUvOffset,
  redrawAtlas
};
