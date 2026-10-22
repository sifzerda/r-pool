// src/renderers/ballTextures.js
// One 1024x1024 atlas (4x4 cells of 256px) shared by every ball.
// redrawAtlas() repaints it when the Lab changes colours/stripes/numbers.

import { CanvasTexture, Color, SRGBColorSpace, LinearFilter } from "three";
import { BALLS } from "../ecs/constants/balls.js";

const GRID = 4;
const CELL_SIZE = 256;
const SIZE = GRID * CELL_SIZE;

export const DEFAULT_ATLAS_OPTS = {
    saturation: 1,
    brightness: 1,
    stripeWidth: 0.34,
    badgeSize: 0.12,
};

const _hsl = { h: 0, s: 0, l: 0 };
const _col = new Color();

function adjust(hex, saturation, brightness) {
    _col.set(hex);
    _col.getHSL(_hsl, SRGBColorSpace);
    _col.setHSL(
        _hsl.h,
        Math.min(1, _hsl.s * saturation),
        Math.min(1, _hsl.l * brightness),
        SRGBColorSpace
    );
    return `#${_col.getHexString(SRGBColorSpace)}`;
}

function drawBall(ctx, ball, x, y, o) {
    const s = CELL_SIZE;
    const color = adjust(ball.color, o.saturation, o.brightness);

    ctx.save();
    ctx.translate(x, y);

    // Base colour (solids and the eight ball are fully coloured).
    const solid = ball.type === "solid" || ball.type === "eight";
    ctx.fillStyle = solid ? color : "#ffffff";
    ctx.fillRect(0, 0, s, s);

    // Stripe band
    if (ball.type === "stripe") {
        const w = o.stripeWidth;
        ctx.fillStyle = color;
        ctx.fillRect(0, s * (0.5 - w / 2), s, s * w);
    }

    // Number circles (front and back of the ball)
    if (ball.type !== "cue") {
        const r = s * o.badgeSize;

        ctx.font = `bold ${Math.round(r * 2.04)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = s * 0.006;

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

const canvas = document.createElement("canvas");
canvas.width = SIZE;
canvas.height = SIZE;
const ctx = canvas.getContext("2d");

function paint(opts) {
    const o = { ...DEFAULT_ATLAS_OPTS, ...opts };
    ctx.clearRect(0, 0, SIZE, SIZE);

    for (const ball of BALLS) {
        drawBall(
            ctx,
            ball,
            (ball.id % GRID) * CELL_SIZE,
            Math.floor(ball.id / GRID) * CELL_SIZE,
            o
        );
    }
}

paint();

// One texture shared by every ball.
export const ballAtlas = new CanvasTexture(canvas);
ballAtlas.colorSpace = SRGBColorSpace;

// No mipmaps (they would bleed across neighbouring atlas cells).
ballAtlas.generateMipmaps = false;
ballAtlas.minFilter = LinearFilter;
ballAtlas.magFilter = LinearFilter;
ballAtlas.needsUpdate = true;

export function redrawAtlas(opts) {
    paint(opts);
    ballAtlas.needsUpdate = true;
}

export function getBallUvOffset(ballId) {
    const col = ballId % GRID;
    const row = Math.floor(ballId / GRID);

    return [col / GRID, (GRID - 1 - row) / GRID];
}