// src/renderers/balls/ballTextures.js

import { CanvasTexture, SRGBColorSpace, LinearFilter } from "three";

// --------------------------------------------------
// BALL DEFINITIONS
// --------------------------------------------------

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

// --------------------------------------------------
// ATLAS CONFIGURATION
// --------------------------------------------------

const GRID = 4;
const CELL_SIZE = 512;
const SIZE = GRID * CELL_SIZE;

// --------------------------------------------------
// DRAW INDIVIDUAL BALL INTO ATLAS
// --------------------------------------------------

function drawBall(ctx, ball, x, y) {
    const s = CELL_SIZE;

    ctx.save();

    ctx.translate(x, y);

    // Base
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, s, s);

    // Solid / eight ball
    if (ball.type === "solid" || ball.type === "eight") {
        ctx.fillStyle = ball.color;
        ctx.fillRect(0, 0, s, s);
    }

    // Stripes
    if (ball.type === "stripe") {
        ctx.fillStyle = ball.color;
        ctx.fillRect(0, s * 0.33, s, s * 0.34);
    }

    // Number circles
    if (ball.type !== "cue") {
        for (const cx of [s * 0.25, s * 0.75]) {
            ctx.beginPath();

            ctx.arc(
                cx,
                s / 2,
                s * 0.12,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = "#ffffff";
            ctx.fill();

            ctx.lineWidth = 3;
            ctx.strokeStyle = "#dddddd";
            ctx.stroke();

            ctx.fillStyle = "#000000";
            ctx.font = "bold 125px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(String(ball.id), cx, s / 2);
        }
    }

    ctx.restore();
}

// --------------------------------------------------
// CREATE ATLAS
// --------------------------------------------------

function createBallAtlas() {
    const canvas = document.createElement("canvas");

    canvas.width = SIZE;
    canvas.height = SIZE;

    const ctx = canvas.getContext("2d");

    // Draw each ball into its own cell
    for (const ball of BALLS) {
        const col = ball.id % GRID;
        const row = Math.floor(ball.id / GRID);

        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;

        drawBall(ctx, ball, x, y);
    }

    const texture = new CanvasTexture(canvas);

    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 16;

    // Avoid mipmap filtering across neighbouring atlas cells.
    texture.generateMipmaps = false;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;

    texture.needsUpdate = true;

    return texture;
}

// One texture shared by every ball
export const ballAtlas = createBallAtlas();

// --------------------------------------------------
// UV OFFSETS
// --------------------------------------------------

export function getBallUvOffset(ballId) {
    const col = ballId % GRID;
    const row = Math.floor(ballId / GRID);

    return [
        col / GRID,
        (GRID - 1 - row) / GRID,
    ];
}