// src/renderers/ballTextures.js

import {
  CanvasTexture,
  Color,
  SRGBColorSpace,
  LinearFilter,
} from "three";

import { BALLS } from "../ecs/constants/balls.js";

const GRID = 4;
const CELL_SIZE = 256;
const SIZE = GRID * CELL_SIZE;

const DEFAULT_ATLAS_OPTS = {
  saturation: 1,
  brightness: 1,
  stripeWidth: 0.34,
  badgeSize: 0.12,
};

const hsl = { h: 0, s: 0, l: 0 };
const color = new Color();

const canvas = document.createElement("canvas");
canvas.width = SIZE;
canvas.height = SIZE;

const ctx = canvas.getContext("2d", {
  alpha: false,
});

const WHITE = "#ffffff";
const BLACK = "#000000";
const BADGE_BORDER = "#dddddd";

const BADGE_X1 = CELL_SIZE * 0.25;
const BADGE_X2 = CELL_SIZE * 0.75;
const BADGE_Y = CELL_SIZE * 0.5;

const clamp01 = (value) =>
  Math.max(0, Math.min(1, value));

// --------------------------------------------------
// COLOR ADJUSTMENT
// --------------------------------------------------

function adjust(hex, saturation, brightness) {
  color.set(hex);
  color.getHSL(hsl, SRGBColorSpace);

  color.setHSL(
    hsl.h,
    clamp01(hsl.s * saturation),
    clamp01(hsl.l * brightness),
    SRGBColorSpace
  );

  return `#${color.getHexString(SRGBColorSpace)}`;
}

// --------------------------------------------------
// ATLAS PAINTING
// --------------------------------------------------

function paint(options = DEFAULT_ATLAS_OPTS) {
  const saturation =
    options.saturation ?? DEFAULT_ATLAS_OPTS.saturation;

  const brightness =
    options.brightness ?? DEFAULT_ATLAS_OPTS.brightness;

  const stripeWidth =
    options.stripeWidth ?? DEFAULT_ATLAS_OPTS.stripeWidth;

  const badgeSize =
    options.badgeSize ?? DEFAULT_ATLAS_OPTS.badgeSize;

  const stripeHeight = CELL_SIZE * stripeWidth;
  const stripeY = (CELL_SIZE - stripeHeight) * 0.5;

  const badgeRadius = CELL_SIZE * badgeSize;

  // Shared canvas text and stroke settings.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${Math.round(badgeRadius * 2.04)}px Arial`;
  ctx.lineWidth = CELL_SIZE * 0.006;
  ctx.strokeStyle = BADGE_BORDER;

  // Every cell receives an opaque background.
  // No clearRect is needed.
  for (const ball of BALLS) {
    const x = (ball.id % GRID) * CELL_SIZE;
    const y = Math.floor(ball.id / GRID) * CELL_SIZE;

    const ballColor = adjust(
      ball.color,
      saturation,
      brightness
    );

    ctx.save();
    ctx.translate(x, y);

    // Base colour
    ctx.fillStyle =
      ball.type === "solid" || ball.type === "eight"
        ? ballColor
        : WHITE;

    ctx.fillRect(0, 0, CELL_SIZE, CELL_SIZE);

    // Stripe
    if (ball.type === "stripe") {
      ctx.fillStyle = ballColor;

      ctx.fillRect(
        0,
        stripeY,
        CELL_SIZE,
        stripeHeight
      );
    }

    // Number badges
    if (ball.type !== "cue") {
      const number = String(ball.id);

      for (const badgeX of [BADGE_X1, BADGE_X2]) {
        ctx.beginPath();

        ctx.arc(
          badgeX,
          BADGE_Y,
          badgeRadius,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = WHITE;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = BLACK;
        ctx.fillText(
          number,
          badgeX,
          BADGE_Y
        );
      }
    }

    ctx.restore();
  }
}

// --------------------------------------------------
// SHARED TEXTURE
// --------------------------------------------------

paint();

const ballAtlas = new CanvasTexture(canvas);

ballAtlas.colorSpace = SRGBColorSpace;
ballAtlas.generateMipmaps = false;
ballAtlas.minFilter = LinearFilter;
ballAtlas.magFilter = LinearFilter;

// --------------------------------------------------
// LIVE PAINTJOB UPDATES
// --------------------------------------------------

function redrawAtlas(options) {
  paint(options);
  ballAtlas.needsUpdate = true;
}

// --------------------------------------------------
// INSTANCE UV OFFSETS
// --------------------------------------------------

function getBallUvOffset(id) {
  return [
    (id % GRID) / GRID,
    (GRID - 1 - Math.floor(id / GRID)) / GRID,
  ];
}

// --------------------------------------------------
// EXPORTS
// --------------------------------------------------

export {
  DEFAULT_ATLAS_OPTS,
  ballAtlas,
  getBallUvOffset,
  redrawAtlas,
};
