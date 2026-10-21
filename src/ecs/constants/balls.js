// src/ecs/constants/balls.js
// Single source of truth for ball colours/types (used by the atlas and the HUD).

export const BALLS = [
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

export const SOLIDS = BALLS.filter((b) => b.type === "solid");
export const STRIPES = BALLS.filter((b) => b.type === "stripe");
export const EIGHT = BALLS.find((b) => b.type === "eight");