// World generation: obstacle and corn spawning, stage progression, scenery placement.

import { VIEW_W, GROUND_Y, STAGES, STAGE_LENGTH_M } from './config.js';
import { rngRange, rngPick } from './rng.js';

export function stageForDistance(distanceM) {
  const index = Math.floor(distanceM / STAGE_LENGTH_M);
  const stage = STAGES[index % STAGES.length];
  const round = Math.floor(index / STAGES.length) + 1;
  return { stage, index, round };
}

export function createWorld(rng) {
  return {
    obstacles: [],
    corns: [],
    nextSpawnX: VIEW_W + 240,
    nextCornX: VIEW_W + 120,
    leaves: [],
    clouds: [],
    trees: [],
    barns: [],
  };
}

const GROUND_KINDS = ['fence', 'haybale', 'dog', 'oven'];
const FLYING_KINDS = ['knife', 'pin'];

function obstacleForStage(rng, stageId, difficulty) {
  const pool = [];
  if (stageId === 'kitchen') {
    pool.push('oven', 'oven', 'knife', 'knife', 'pin', 'fence');
  } else if (stageId === 'barnyard') {
    pool.push('fence', 'haybale', 'dog', 'dog', 'knife', 'fence');
  } else {
    pool.push('fence', 'haybale', 'fence', 'dog', 'haybale');
  }
  if (difficulty > 0.55) pool.push('dog', 'knife');
  return rngPick(rng, pool);
}

function makeObstacle(rng, kind, x) {
  switch (kind) {
    case 'fence':
      return { kind, x, w: rngRange(rng, 90, 150), h: rngRange(rng, 74, 96), y: GROUND_Y, hit: false };
    case 'haybale':
      return { kind, x, w: rngRange(rng, 84, 110), h: rngRange(rng, 64, 84), y: GROUND_Y, hit: false };
    case 'dog':
      return { kind, x, w: 84, h: 62, y: GROUND_Y, vx: rngRange(rng, 60, 130), phase: rng() * 6, hit: false };
    case 'oven':
      return { kind, x, w: rngRange(rng, 110, 140), h: rngRange(rng, 96, 118), y: GROUND_Y, hit: false };
    case 'knife':
      return { kind, x, w: 66, h: 18, y: GROUND_Y - rngRange(rng, 104, 126), vx: rngRange(rng, 150, 240), spin: rng() * 6, hit: false };
    case 'pin':
      return { kind, x, w: 96, h: 24, y: GROUND_Y - rngRange(rng, 100, 118), vx: rngRange(rng, 90, 150), spin: rng() * 6, hit: false };
    default:
      return { kind: 'fence', x, w: 100, h: 84, y: GROUND_Y, hit: false };
  }
}

export function spawnAhead(world, rng, stageId, difficulty, speed) {
  while (world.nextSpawnX < VIEW_W + 500) {
    const kind = obstacleForStage(rng, stageId, difficulty);
    world.obstacles.push(makeObstacle(rng, kind, world.nextSpawnX));
    const gap = rngRange(rng, 340, 560) * (1.25 - difficulty * 0.45) + speed * 0.32;
    world.nextSpawnX += Math.max(300, gap);
  }
  while (world.nextCornX < VIEW_W + 500) {
    const golden = rng() < 0.08;
    const arc = rng() < 0.45;
    const n = arc ? 4 : 1;
    for (let i = 0; i < n; i++) {
      const lift = arc ? Math.sin((i / (n - 1 || 1)) * Math.PI) * 120 : rngRange(rng, 0, 30);
      world.corns.push({
        x: world.nextCornX + i * 46,
        y: GROUND_Y - 56 - lift,
        golden: golden && i === n - 1,
        taken: false,
        spin: rng() * 6,
      });
    }
    world.nextCornX += rngRange(rng, 420, 900);
  }
}

export function ensureScenery(world, rng) {
  if (world.clouds.length === 0) {
    for (let i = 0; i < 6; i++) {
      world.clouds.push({ x: rng() * VIEW_W, y: rngRange(rng, 40, 170), s: rngRange(rng, 0.7, 1.4), v: rngRange(rng, 4, 12) });
    }
  }
  if (world.trees.length === 0) {
    for (let i = 0; i < 5; i++) world.trees.push({ x: rng() * VIEW_W, s: rngRange(rng, 0.8, 1.3) });
  }
  if (world.barns.length === 0) {
    world.barns.push({ x: rngRange(rng, 500, 900), s: 1 });
  }
  if (world.leaves.length === 0) {
    const colors = ['#e07b2a', '#c62828', '#f5b921', '#a84e14'];
    for (let i = 0; i < 14; i++) {
      world.leaves.push({
        x: rng() * VIEW_W,
        y: rng() * 420,
        rot: rng() * 6,
        v: rngRange(rng, 18, 46),
        sway: rng() * 6,
        color: colors[i % colors.length],
      });
    }
  }
}
