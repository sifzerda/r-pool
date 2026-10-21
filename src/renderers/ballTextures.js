// src/renderers/ballTextures.js

import { CanvasTexture, SRGBColorSpace, LinearFilter } from "three";

const BALLS = [
    { id: 0, color: "#ffffff", type: "cue" },

    { id: 1, color: "#F5C518", type: "solid" },
    { id: 2, color: "#1B4FD8", type: "solid" },
    { id: 3, color: "#D92B2B", type: "solid" },
    { id: 4, color: "#7B2FBE", type: "solid" },
    { id: 5, color: "#E05C00", type: "solid" },
    { id: 6, color: "#1A7A1A", type: "solid" },
    { id: 7, color: "#8B1A1A", type: "solid" },

    { id: 8, color: "#000000", type: "eight" },

    { id: 9, color: "#F5C518", type: "stripe" },
    { id: 10, color: "#1B4FD8", type: "stripe" },
    { id: 11, color: "#D92B2B", type: "stripe" },
    { id: 12, color: "#7B2FBE", type: "stripe" },
    { id: 13, color: "#E05C00", type: "stripe" },
    { id: 14, color: "#1A7A1A", type: "stripe" },
    { id: 15, color: "#8B1A1A", type: "stripe" },
];

// Balls are only ~16px across on screen (radius 0.1 at zoom 80), so a 2048px
// atlas (512px cells) was 16x more memory than needed. 256px cells still
// leave plenty of headroom if you zoom in: 1024x1024 = 4MB instead of 16MB.
const GRID = 4;
const CELL_SIZE = 256;
const SIZE = GRID * CELL_SIZE;

function drawBall(ctx, ball, x, y) {
    const s = CELL_SIZE;

    ctx.save();
    ctx.translate(x, y);

    // Base colour (solids and the eight ball are fully coloured).
    const solid = ball.type === "solid" || ball.type === "eight";
    ctx.fillStyle = solid ? ball.color : "#ffffff";
    ctx.fillRect(0, 0, s, s);

    // Stripe band
    if (ball.type === "stripe") {
        ctx.fillStyle = ball.color;
        ctx.fillRect(0, s * 0.33, s, s * 0.34);
    }

    // Number circles (front and back of the ball)
    if (ball.type !== "cue") {
        ctx.font = `bold ${Math.round(s * 0.245)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = s * 0.006;

        for (const cx of [s * 0.25, s * 0.75]) {
            ctx.beginPath();
            ctx.arc(cx, s / 2, s * 0.12, 0, Math.PI * 2);

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

function createBallAtlas() {
    const canvas = document.createElement("canvas");

    canvas.width = SIZE;
    canvas.height = SIZE;

    const ctx = canvas.getContext("2d");

    for (const ball of BALLS) {
        drawBall(
            ctx,
            ball,
            (ball.id % GRID) * CELL_SIZE,
            Math.floor(ball.id / GRID) * CELL_SIZE
        );
    }

    const texture = new CanvasTexture(canvas);

    texture.colorSpace = SRGBColorSpace;

    // No mipmaps (they would bleed across neighbouring atlas cells), so
    // anisotropic filtering has nothing to work with and is left at 1.
    texture.generateMipmaps = false;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;

    texture.needsUpdate = true;

    return texture;
}

// One texture shared by every ball
export const ballAtlas = createBallAtlas();

export function getBallUvOffset(ballId) {
    const col = ballId % GRID;
    const row = Math.floor(ballId / GRID);

    return [col / GRID, (GRID - 1 - row) / GRID];
}