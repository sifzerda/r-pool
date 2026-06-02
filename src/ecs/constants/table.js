//ecs/constants/table.js

export const TABLE_W = 6.8;
export const TABLE_H = 3.4;

export const TABLE_X = TABLE_W / 2; // 3.4
export const TABLE_Z = TABLE_H / 2; // 1.7

export const CUSHION = 0.28; // 28 cm

export const PLAY_X = CUSHION;
export const PLAY_Z = CUSHION;

export const PLAY_W = TABLE_W - CUSHION * 2;
export const PLAY_H = TABLE_H - CUSHION * 2;

export const BALL_R = 0.1;
export const BALL_Y = 0.12; // visual height above table

export const POCKET_R = 0.14; // 14 cm

export const FRICTION = 0.988;
export const MIN_SPEED = 0.18;

export const MAX_POWER = 18;
export const CUE_MAX_PULL = 80;