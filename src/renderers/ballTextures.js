// src/renderers/Ball.jsx

import { createBallTexture } from "../ecs/utils/createBallTexture";

export const ballTextures = new Map();

ballTextures.set(0, createBallTexture("", "#ffffff", false));
ballTextures.set(1, createBallTexture(1, "#F5C518", false));
ballTextures.set(2, createBallTexture(2, "#1B4FD8", false));
ballTextures.set(3, createBallTexture(3, "#D92B2B", false));
ballTextures.set(4, createBallTexture(4, "#7B2FBE", false));
ballTextures.set(5, createBallTexture(5, "#E05C00", false));
ballTextures.set(6, createBallTexture(6, "#1A7A1A", false));
ballTextures.set(7, createBallTexture(7, "#8B1A1A", false));

ballTextures.set(8, createBallTexture(8, "#111111", false));

ballTextures.set(9, createBallTexture(9, "#F5C518", true));
ballTextures.set(10, createBallTexture(10, "#1B4FD8", true));
ballTextures.set(11, createBallTexture(11, "#D92B2B", true));
ballTextures.set(12, createBallTexture(12, "#7B2FBE", true));
ballTextures.set(13, createBallTexture(13, "#E05C00", true));
ballTextures.set(14, createBallTexture(14, "#1A7A1A", true));
ballTextures.set(15, createBallTexture(15, "#8B1A1A", true));

