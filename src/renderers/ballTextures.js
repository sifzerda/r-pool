// src/renderers/balls/ballTextures.js

import { CanvasTexture, SRGBColorSpace } from "three";

// --------------------------------------------------
// BALL DEFINITIONS
// --------------------------------------------------

const BALL_DEFINITIONS = [
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
// TEXTURE GENERATOR
// --------------------------------------------------

function createBallTexture(number, color, type) {
    const size = 1024;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    // Base colour
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Cue ball: plain white
    if (type === "cue") {
        const texture = new CanvasTexture(canvas);
        texture.colorSpace = SRGBColorSpace;
        texture.anisotropy = 16;
        texture.needsUpdate = true;

        return texture;
    }

    // Solid and eight balls
    if (type === "solid" || type === "eight") {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, size, size);
    }

    // Striped balls
    if (type === "stripe") {
        ctx.fillStyle = color;
        ctx.fillRect(0, size * 0.33, size, size * 0.34);
    }

    // Number circles
    const positions = [
        size * 0.25,
        size * 0.75,
    ];

    for (const x of positions) {
        ctx.beginPath();

        ctx.arc(
            x,
            size / 2,
            size * 0.12,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.lineWidth = 6;
        ctx.strokeStyle = "#dddddd";
        ctx.stroke();

        // Number
        ctx.fillStyle = "#000000";
        ctx.font = "bold 250px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(String(number), x, size / 2);
    }

    const texture = new CanvasTexture(canvas);

    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 16;
    texture.needsUpdate = true;

    return texture;
}

// --------------------------------------------------
// CREATE ALL BALL TEXTURES
// --------------------------------------------------

export const ballTextures = new Map(
    BALL_DEFINITIONS.map(ball => [
        ball.id,
        createBallTexture(
            ball.id,
            ball.color,
            ball.type
        ),
    ])
);