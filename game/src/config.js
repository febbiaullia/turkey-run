// Gobble & Go — shared constants: canvas size, physics, speeds, stage table, palette.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const GROUND_Y = 604;

export const TURKEY_X = 268;
export const TURKEY_W = 96;
export const TURKEY_H = 92;
export const DUCK_H = 58;

export const GRAVITY = 2600;
export const JUMP_VY = -1080;
export const DOUBLE_JUMP_VY = -940;
export const FAST_FALL_VY = 1500;

export const START_SPEED = 390;
export const MAX_SPEED = 920;
export const SPEED_PER_100M = 16;

export const START_HEARTS = 3;
export const MAX_HEARTS = 5;

export const FARMER_START_GAP = 430;
export const FARMER_MAX_GAP = 520;
export const FARMER_STUMBLE_GAIN = 150;
export const FARMER_CREEP = 4.5;
export const FARMER_RECOVER = 9;

export const STAGE_LENGTH_M = 400;

export const STAGES = [
  {
    id: 'farmyard',
    name: 'Stage 1 · The Farmyard',
    sky: ['#ffd98a', '#ffb35c'],
    hill: '#e08a3c',
    ground: '#a86a2e',
    groundLine: '#7c4a1c',
    banner: 'Out of the coop!',
  },
  {
    id: 'barnyard',
    name: 'Stage 2 · The Barnyard',
    sky: ['#ffb36b', '#e96f4e'],
    hill: '#b85c38',
    ground: '#8a5426',
    groundLine: '#633a14',
    banner: 'Through the barnyard!',
  },
  {
    id: 'kitchen',
    name: 'Stage 3 · The Kitchen',
    sky: ['#f3e2c2', '#e8c795'],
    hill: '#c99a5b',
    ground: '#9c6b34',
    groundLine: '#6e4517',
    banner: 'Not the kitchen!',
  },
];

export const PALETTE = {
  ink: '#3a1e08',
  cream: '#fff4dd',
  orange: '#e86a17',
  deepOrange: '#c24e0a',
  red: '#c62828',
  gold: '#f5b921',
  corn: '#ffd94d',
  green: '#5d8a3c',
  brown: '#7a4a21',
  darkBrown: '#4c2c10',
  blue: '#3f6d9e',
};
