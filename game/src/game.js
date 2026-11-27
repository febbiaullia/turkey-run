// Game state machine: title, running, paused, stage banner, caught and escaped screens.
// Owns the turkey physics, farmer chase pressure, collisions, score and HUD.

import {
  VIEW_W, VIEW_H, GROUND_Y, TURKEY_X, TURKEY_W, TURKEY_H, DUCK_H,
  GRAVITY, JUMP_VY, DOUBLE_JUMP_VY, FAST_FALL_VY,
  START_SPEED, MAX_SPEED, SPEED_PER_100M,
  START_HEARTS, MAX_HEARTS,
  FARMER_START_GAP, FARMER_MAX_GAP, FARMER_STUMBLE_GAIN, FARMER_CREEP, FARMER_RECOVER,
  PALETTE,
} from './config.js';
import { makeRng } from './rng.js';
import { createWorld, spawnAhead, ensureScenery, stageForDistance } from './world.js';
import {
  drawSky, drawSun, drawCloud, drawHills, drawBarn, drawTree, drawKitchenBackdrop,
  drawGround, drawTurkey, drawFarmer, drawDog, drawFence, drawHayBale, drawKnife,
  drawOven, drawRollingPin, drawCorn, drawHeart, drawLeaf,
} from './art.js';
import { sfx, unlockAudio, setMuted, isMuted } from './audio.js';

const BEST_KEY = 'gobble-go-best';

export function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // storage may be unavailable; the game still plays
  }
}

export function createGame(seed) {
  const rng = makeRng(seed || 1);
  const world = createWorld(rng);
  ensureScenery(world, rng);
  return {
    mode: 'title',
    rng,
    world,
    time: 0,
    scroll: 0,
    distanceM: 0,
    score: 0,
    corn: 0,
    goldenCorn: 0,
    hearts: START_HEARTS,
    speed: START_SPEED,
    turkey: { y: GROUND_Y - TURKEY_H, vy: 0, jumps: 0, duck: false, hurtT: 0, flapT: 0, runPhase: 0 },
    farmer: { gap: FARMER_START_GAP, phase: 0, shoutT: 0 },
    invulnT: 0,
    burstT: 0,
    stumbleT: 0,
    bannerT: 0,
    bannerText: '',
    stageIndex: -1,
    endReason: '',
    best: loadBest(),
    newBest: false,
    popups: [],
  };
}

export function startRun(g) {
  const best = g.best;
  const fresh = createGame(Math.floor(Math.random() * 1e9) + 1);
  Object.assign(g, fresh);
  g.best = best;
  g.mode = 'run';
  showBanner(g, 'Run, turkey, run!');
  sfx.gobble();
}

function showBanner(g, text) {
  g.bannerText = text;
  g.bannerT = 2.2;
}

function addPopup(g, x, y, text, color) {
  g.popups.push({ x, y, text, color: color || PALETTE.cream, t: 0 });
}

export function handleAction(g, action, input) {
  unlockAudio();
  if (action === 'mute') {
    setMuted(!isMuted());
    return;
  }
  if (g.mode === 'title') {
    if (action === 'jump' || action === 'confirm') startRun(g);
    return;
  }
  if (g.mode === 'over') {
    if (action === 'jump' || action === 'confirm') startRun(g);
    return;
  }
  if (g.mode === 'paused') {
    if (action === 'pause' || action === 'confirm') g.mode = 'run';
    return;
  }
  if (g.mode !== 'run') return;

  if (action === 'pause') {
    g.mode = 'paused';
    return;
  }
  const t = g.turkey;
  if (action === 'jump') {
    if (t.jumps === 0) {
      t.vy = JUMP_VY;
      t.jumps = 1;
      t.duck = false;
      sfx.jump();
    } else if (t.jumps === 1) {
      t.vy = DOUBLE_JUMP_VY;
      t.jumps = 2;
      t.flapT = 0.45;
      sfx.flap();
    }
  }
  if (action === 'duck') {
    if (t.jumps > 0) {
      t.vy = Math.max(t.vy, FAST_FALL_VY);
    } else if (!t.duck) {
      sfx.duck();
    }
    t.duck = true;
  }
}

function turkeyBox(g) {
  const t = g.turkey;
  const h = t.duck && t.jumps === 0 ? DUCK_H : TURKEY_H;
  return { x: TURKEY_X - TURKEY_W / 2 + 8, y: t.y + (TURKEY_H - h), w: TURKEY_W - 16, h: h - 6 };
}

function obstacleBox(o) {
  if (o.kind === 'knife' || o.kind === 'pin') {
    return { x: o.x - o.w / 2 + 6, y: o.y - o.h / 2, w: o.w - 12, h: o.h };
  }
  return { x: o.x + 6, y: o.y - o.h + 4, w: o.w - 12, h: o.h - 4 };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function endRun(g, reason) {
  g.mode = 'over';
  g.endReason = reason;
  const finalScore = Math.floor(g.score);
  if (finalScore > g.best) {
    g.best = finalScore;
    g.newBest = true;
    saveBest(finalScore);
  }
  if (reason === 'escaped') sfx.escape();
  else sfx.caught();
}

export function updateGame(g, dt, input) {
  g.time += dt;
  if (g.bannerT > 0) g.bannerT -= dt;
  for (const p of g.popups) p.t += dt;
  g.popups = g.popups.filter((p) => p.t < 1.1);

  // scenery always drifts a little, even on the title screen
  for (const c of g.world.clouds) {
    c.x -= c.v * dt;
    if (c.x < -90) c.x = VIEW_W + 90;
  }
  for (const l of g.world.leaves) {
    l.y += l.v * dt;
    l.x -= 26 * dt;
    l.rot += dt * 1.6;
    if (l.y > GROUND_Y + 30) {
      l.y = -20;
      l.x = Math.random() * VIEW_W;
    }
    if (l.x < -24) l.x = VIEW_W + 24;
  }

  if (g.mode !== 'run') return;

  const t = g.turkey;
  const { stage, index, round } = stageForDistance(g.distanceM);
  if (index !== g.stageIndex) {
    if (g.stageIndex >= 0) {
      showBanner(g, `${stage.banner}  (${stage.name}${round > 1 ? ` · Round ${round}` : ''})`);
      sfx.stage();
      if (index >= 9) {
        endRun(g, 'escaped');
        return;
      }
    }
    g.stageIndex = index;
  }

  const difficulty = Math.min(1, g.distanceM / 2400);
  g.speed = Math.min(MAX_SPEED, START_SPEED + (g.distanceM / 100) * SPEED_PER_100M + (round - 1) * 40);
  const speed = g.stumbleT > 0 ? g.speed * 0.55 : g.speed * (g.burstT > 0 ? 1.18 : 1);
  if (g.stumbleT > 0) g.stumbleT -= dt;
  if (g.burstT > 0) g.burstT -= dt;
  if (g.invulnT > 0) g.invulnT -= dt;
  if (t.hurtT > 0) t.hurtT -= dt;
  if (t.flapT > 0) t.flapT -= dt;

  const dx = speed * dt;
  g.scroll += dx;
  g.distanceM += dx / 42;
  g.score += dx / 42;

  // turkey physics
  t.duck = input.duckHeld && t.jumps === 0;
  t.vy += GRAVITY * dt;
  t.y += t.vy * dt;
  if (t.y >= GROUND_Y - TURKEY_H) {
    t.y = GROUND_Y - TURKEY_H;
    t.vy = 0;
    t.jumps = 0;
  }
  t.runPhase += dt * (6 + speed / 60);

  // farmer pressure: creeps closer, recovers when you run clean
  const f = g.farmer;
  f.phase += dt * (6 + speed / 55);
  f.gap -= FARMER_CREEP * dt * (0.5 + difficulty);
  if (g.stumbleT <= 0) f.gap += FARMER_RECOVER * dt;
  f.gap = Math.max(0, Math.min(FARMER_MAX_GAP, f.gap));
  if (f.gap < 150) {
    f.shoutT -= dt;
    if (f.shoutT <= 0) {
      f.shoutT = 2.4;
      sfx.shout();
      addPopup(g, TURKEY_X - f.gap + 30, GROUND_Y - 210, 'Gotcha soon!', '#ffd9d0');
    }
  }
  if (f.gap <= 6) {
    endRun(g, 'caught');
    return;
  }

  // world motion
  spawnAhead(g.world, g.rng, stage.id, difficulty, speed);
  g.world.nextSpawnX -= dx;
  g.world.nextCornX -= dx;
  for (const o of g.world.obstacles) {
    o.x -= dx + (o.vx || 0) * dt;
    if (o.kind === 'dog') o.phase += dt * 8;
    if (o.spin !== undefined) o.spin += dt * 6;
  }
  g.world.obstacles = g.world.obstacles.filter((o) => o.x + o.w > -80);
  for (const c of g.world.corns) {
    c.x -= dx;
    c.spin += dt;
  }
  g.world.corns = g.world.corns.filter((c) => !c.taken && c.x > -60);
  for (const tr of g.world.trees) {
    tr.x -= dx * 0.55;
    if (tr.x < -90) tr.x = VIEW_W + 90 + Math.random() * 200;
  }
  for (const b of g.world.barns) {
    b.x -= dx * 0.4;
    if (b.x < -280) b.x = VIEW_W + 300 + Math.random() * 500;
  }

  // corn pickups
  const box = turkeyBox(g);
  for (const c of g.world.corns) {
    if (c.taken) continue;
    const cb = { x: c.x - 16, y: c.y - 22, w: 32, h: 44 };
    if (overlaps(box, cb)) {
      c.taken = true;
      if (c.golden) {
        g.goldenCorn += 1;
        g.score += 50;
        g.burstT = 2.2;
        g.invulnT = Math.max(g.invulnT, 2.2);
        f.gap = Math.min(FARMER_MAX_GAP, f.gap + 60);
        sfx.golden();
        addPopup(g, c.x, c.y - 40, '+50 GOLDEN!', PALETTE.gold);
      } else {
        g.corn += 1;
        g.score += 10;
        f.gap = Math.min(FARMER_MAX_GAP, f.gap + 7);
        sfx.corn();
        addPopup(g, c.x, c.y - 36, '+10', PALETTE.cream);
      }
    }
  }

  // obstacle collisions
  if (g.invulnT <= 0) {
    for (const o of g.world.obstacles) {
      if (o.hit) continue;
      if (overlaps(box, obstacleBox(o))) {
        o.hit = true;
        g.hearts -= 1;
        t.hurtT = 0.7;
        g.invulnT = 1.4;
        g.stumbleT = 0.8;
        f.gap = Math.max(0, f.gap - FARMER_STUMBLE_GAIN);
        sfx.hit();
        sfx.gobble();
        addPopup(g, TURKEY_X, t.y - 30, 'OUCH!', '#ffd9d0');
        if (g.hearts <= 0) {
          endRun(g, 'caught');
          return;
        }
        break;
      }
    }
  }
}

function drawScenery(ctx, g, stage) {
  if (stage.id === 'kitchen') {
    drawKitchenBackdrop(ctx, g.scroll);
  } else {
    drawSky(ctx, stage);
    drawSun(ctx, 1120, 96);
    for (const c of g.world.clouds) drawCloud(ctx, c.x, c.y, c.s);
    drawHills(ctx, stage, g.scroll * 0.25);
    for (const b of g.world.barns) drawBarn(ctx, b.x, GROUND_Y - 4, b.s);
    for (const tr of g.world.trees) drawTree(ctx, tr.x, GROUND_Y - 2, tr.s);
  }
  drawGround(ctx, stage, g.scroll);
}

function drawWorld(ctx, g) {
  for (const c of g.world.corns) drawCorn(ctx, c.x, c.y, c.golden, c.spin);
  for (const o of g.world.obstacles) {
    if (o.kind === 'fence') drawFence(ctx, o.x, o.y, o.w, o.h);
    else if (o.kind === 'haybale') drawHayBale(ctx, o.x, o.y, o.w, o.h);
    else if (o.kind === 'dog') drawDog(ctx, o.x + o.w / 2, o.y - o.h + 6, o.phase);
    else if (o.kind === 'oven') drawOven(ctx, o.x, o.y, o.w, o.h, g.time);
    else if (o.kind === 'knife') drawKnife(ctx, o.x, o.y, Math.sin(o.spin) * 0.5 - 0.2);
    else if (o.kind === 'pin') drawRollingPin(ctx, o.x, o.y, o.spin);
  }
}

function drawHud(ctx, g, stage) {
  ctx.fillStyle = 'rgba(43,22,8,0.72)';
  ctx.beginPath();
  ctx.roundRect(18, 16, 560, 86, 16);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${Math.floor(g.score)}`, 36, 54);
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(`${Math.floor(g.distanceM)} m`, 36, 86);
  drawCorn(ctx, 300, 52, false, g.time);
  ctx.fillText(`× ${g.corn}`, 322, 60);
  drawCorn(ctx, 408, 52, true, g.time);
  ctx.fillText(`× ${g.goldenCorn}`, 430, 60);
  for (let i = 0; i < MAX_HEARTS; i++) {
    if (i < Math.max(START_HEARTS, g.hearts)) drawHeart(ctx, 500 + i * 34, 44, i < g.hearts);
  }
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.cream;
  ctx.fillText(stage.name, 300, 88);

  // farmer gap meter
  const meterW = 300;
  const frac = g.farmer.gap / FARMER_MAX_GAP;
  ctx.fillStyle = 'rgba(43,22,8,0.72)';
  ctx.beginPath();
  ctx.roundRect(VIEW_W - meterW - 36, 16, meterW + 18, 58, 14);
  ctx.fill();
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('FARMER', VIEW_W - meterW - 24, 40);
  ctx.fillStyle = 'rgba(255,244,221,0.3)';
  ctx.fillRect(VIEW_W - meterW - 24, 48, meterW - 12, 12);
  ctx.fillStyle = frac < 0.3 ? PALETTE.red : frac < 0.55 ? PALETTE.gold : '#7bc950';
  ctx.fillRect(VIEW_W - meterW - 24, 48, (meterW - 12) * frac, 12);

  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,244,221,0.85)';
  ctx.textAlign = 'right';
  ctx.fillText(isMuted() ? 'M unmute · P pause' : 'M mute · P pause', VIEW_W - 24, 96);
  ctx.textAlign = 'left';
}

function drawPopups(ctx, g) {
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const p of g.popups) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / 1.1);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = 'rgba(58,30,8,0.8)';
    ctx.lineWidth = 4;
    const y = p.y - p.t * 46;
    ctx.strokeText(p.text, p.x, y);
    ctx.fillText(p.text, p.x, y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawBanner(ctx, g) {
  if (g.bannerT <= 0) return;
  const a = Math.min(1, g.bannerT / 0.4);
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(43,22,8,0.78)';
  ctx.beginPath();
  ctx.roundRect(VIEW_W / 2 - 430, 150, 860, 74, 18);
  ctx.fill();
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.bannerText, VIEW_W / 2, 198);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

function panel(ctx, w, h) {
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = 'rgba(43,22,8,0.88)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 4;
  ctx.stroke();
  return { x, y };
}

function drawTitle(ctx, g) {
  const { y } = panel(ctx, 800, 520);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.fillText('GOBBLE & GO!', VIEW_W / 2, y + 92);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('The Great Turkey Escape', VIEW_W / 2, y + 138);
  ctx.font = '21px system-ui, sans-serif';
  const lines = [
    'Thanksgiving is coming — and you are NOT dinner.',
    'Outrun the farmer through the farmyard, the barnyard',
    'and the dreaded kitchen. Dodge fences, dogs, ovens',
    'and flying carving knives. Grab corn to stay ahead!',
    '',
    'SPACE / ↑ / tap — jump (twice for a wing flap)',
    '↓ / S / swipe down — duck under knives',
    'P — pause · M — mute',
    '',
    g.best > 0 ? `Best score: ${g.best}` : 'No escapes yet. Be the first!',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, y + 182 + i * 26));
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 28px system-ui, sans-serif';
  if (Math.sin(g.time * 3) > -0.4) ctx.fillText('Press SPACE or tap to run!', VIEW_W / 2, y + 182 + lines.length * 26 + 22);
  ctx.textAlign = 'left';
}

function drawPaused(ctx) {
  panel(ctx, 520, 220);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2 - 10);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText('Press P to keep running', VIEW_W / 2, VIEW_H / 2 + 36);
  ctx.textAlign = 'left';
}

function drawOver(ctx, g) {
  const escaped = g.endReason === 'escaped';
  panel(ctx, 780, 430);
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#7bc950' : PALETTE.red;
  ctx.font = 'bold 58px system-ui, sans-serif';
  ctx.fillText(escaped ? 'YOU ESCAPED!' : 'CAUGHT!', VIEW_W / 2, VIEW_H / 2 - 110);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '24px system-ui, sans-serif';
  ctx.fillText(
    escaped ? 'Freedom! The forest is yours, brave turkey.' : 'The farmer got you… the oven awaits.',
    VIEW_W / 2,
    VIEW_H / 2 - 64,
  );
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(`Score: ${Math.floor(g.score)}`, VIEW_W / 2, VIEW_H / 2 - 10);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(`Distance: ${Math.floor(g.distanceM)} m · Corn: ${g.corn} · Golden: ${g.goldenCorn}`, VIEW_W / 2, VIEW_H / 2 + 30);
  ctx.fillStyle = g.newBest ? PALETTE.gold : PALETTE.cream;
  ctx.fillText(g.newBest ? `NEW BEST: ${g.best}!` : `Best: ${g.best}`, VIEW_W / 2, VIEW_H / 2 + 70);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 27px system-ui, sans-serif';
  if (Math.sin(g.time * 3) > -0.4) ctx.fillText('Press SPACE or tap to run again', VIEW_W / 2, VIEW_H / 2 + 132);
  ctx.textAlign = 'left';
}

export function renderGame(ctx, g) {
  const { stage } = stageForDistance(g.mode === 'title' ? 0 : g.distanceM);
  drawScenery(ctx, g, stage);

  if (g.mode !== 'title') {
    drawWorld(ctx, g);
    const t = g.turkey;
    const farmerX = TURKEY_X - g.farmer.gap;
    if (farmerX > -80) {
      drawFarmer(ctx, farmerX, GROUND_Y - 106, g.farmer.phase, g.farmer.gap < 150);
    }
    const blink = g.invulnT > 0 && Math.sin(g.time * 26) > 0;
    if (!blink) {
      drawTurkey(ctx, TURKEY_X, t.y + TURKEY_H / 2 + 6, {
        duck: t.duck && t.jumps === 0,
        flap: t.flapT > 0 ? 1 - t.flapT / 0.45 : 0,
        runPhase: t.runPhase,
        hurt: t.hurtT > 0,
      });
    }
    if (g.mode === 'run' || g.mode === 'paused') drawHud(ctx, g, stage);
  } else {
    // title scene: farmer chasing in from the left, turkey fleeing at the right edge
    drawFence(ctx, 1030, GROUND_Y, 150, 92);
    drawCorn(ctx, 1160, GROUND_Y - 60, true, g.time);
    drawFarmer(ctx, 140, GROUND_Y - 106, g.time * 7, false);
    drawTurkey(ctx, 1120, GROUND_Y - TURKEY_H / 2 + 6, {
      duck: false,
      flap: 0,
      runPhase: g.time * 9,
      hurt: false,
    });
  }

  for (const l of g.world.leaves) drawLeaf(ctx, l.x, l.y, l.rot, l.color);
  drawPopups(ctx, g);
  if (g.mode === 'run') drawBanner(ctx, g);
  if (g.mode === 'title') drawTitle(ctx, g);
  if (g.mode === 'paused') drawPaused(ctx);
  if (g.mode === 'over') drawOver(ctx, g);
}

// Deterministic posed scenes for screenshots (?shot=...). Sets up a readable frame
// of real gameplay state without relying on timing.
export function poseShot(g, shot) {
  const rng = g.rng;
  if (shot === 'title') {
    g.mode = 'title';
    g.best = 0;
    return;
  }
  g.mode = 'run';
  g.score = 0;
  g.corn = 0;
  g.goldenCorn = 0;
  g.hearts = 3;
  g.world.obstacles = [];
  g.world.corns = [];

  if (shot === 'play') {
    g.distanceM = 186;
    g.score = 312;
    g.corn = 9;
    g.goldenCorn = 1;
    g.farmer.gap = 205;
    g.turkey.y = GROUND_Y - TURKEY_H - 128;
    g.turkey.jumps = 1;
    g.turkey.runPhase = 2.4;
    g.farmer.phase = 3.1;
    g.world.obstacles.push({ kind: 'fence', x: 560, w: 130, h: 88, y: GROUND_Y, hit: false });
    g.world.obstacles.push({ kind: 'haybale', x: 1010, w: 100, h: 76, y: GROUND_Y, hit: false });
    g.world.obstacles.push({ kind: 'dog', x: 820, w: 84, h: 62, y: GROUND_Y, vx: 90, phase: 1.2, hit: false });
    for (let i = 0; i < 4; i++) {
      g.world.corns.push({ x: 640 + i * 46, y: GROUND_Y - 56 - Math.sin((i / 3) * Math.PI) * 110, golden: i === 3, taken: false, spin: i });
    }
    g.bannerText = '';
    g.bannerT = 0;
  } else if (shot === 'kitchen') {
    g.distanceM = 862;
    g.score = 1180;
    g.corn = 24;
    g.goldenCorn = 2;
    g.hearts = 2;
    g.farmer.gap = 190;
    g.turkey.y = GROUND_Y - TURKEY_H;
    g.turkey.duck = true;
    g.turkey.runPhase = 4.2;
    g.farmer.phase = 5.0;
    g.world.obstacles.push({ kind: 'knife', x: 430, w: 66, h: 18, y: GROUND_Y - 118, vx: 180, spin: 0.4, hit: false });
    g.world.obstacles.push({ kind: 'oven', x: 760, w: 128, h: 110, y: GROUND_Y, hit: false });
    g.world.obstacles.push({ kind: 'pin', x: 1080, w: 96, h: 24, y: GROUND_Y - 108, vx: 120, spin: 1.1, hit: false });
    for (let i = 0; i < 3; i++) {
      g.world.corns.push({ x: 560 + i * 46, y: GROUND_Y - 52, golden: false, taken: false, spin: i * 2 });
    }
    g.bannerText = 'Not the kitchen!  (Stage 3 · The Kitchen)';
    g.bannerT = 2;
  } else if (shot === 'end') {
    g.distanceM = 1044;
    g.score = 1462;
    g.corn = 31;
    g.goldenCorn = 3;
    g.hearts = 0;
    g.farmer.gap = 40;
    g.turkey.y = GROUND_Y - TURKEY_H;
    g.turkey.runPhase = 1.0;
    g.farmer.phase = 2.0;
    g.world.obstacles.push({ kind: 'oven', x: 900, w: 128, h: 110, y: GROUND_Y, hit: false });
    g.mode = 'over';
    g.endReason = 'caught';
    g.best = 1462;
    g.newBest = true;
  }
  void rng;
}
