// All canvas drawing: turkey, farmer, dog, obstacles, pickups and stage scenery.
// Pure vector shapes in an autumn palette — no image files, everything drawn at run time.

import { VIEW_W, VIEW_H, GROUND_Y, PALETTE } from './config.js';

function ellipse(ctx, x, y, rx, ry, color, rot) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function roundRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export function drawSky(ctx, stage) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, stage.sky[0]);
  g.addColorStop(1, stage.sky[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export function drawSun(ctx, x, y) {
  ellipse(ctx, x, y, 58, 58, '#fff3b0');
  ellipse(ctx, x, y, 44, 44, '#ffd94d');
}

export function drawCloud(ctx, x, y, s) {
  ellipse(ctx, x, y, 46 * s, 20 * s, 'rgba(255,250,238,0.92)');
  ellipse(ctx, x + 34 * s, y + 4 * s, 34 * s, 16 * s, 'rgba(255,250,238,0.92)');
  ellipse(ctx, x - 36 * s, y + 5 * s, 30 * s, 14 * s, 'rgba(255,250,238,0.92)');
}

export function drawHills(ctx, stage, offset) {
  ctx.fillStyle = stage.hill;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  for (let x = 0; x <= VIEW_W; x += 40) {
    const y = GROUND_Y - 120 - Math.sin((x + offset) * 0.006) * 42 - Math.sin((x + offset) * 0.017) * 14;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(VIEW_W, GROUND_Y);
  ctx.closePath();
  ctx.fill();
}

export function drawBarn(ctx, x, y, s) {
  const w = 190 * s;
  const h = 130 * s;
  rect(ctx, x, y - h, w, h, '#a83a2a');
  ctx.fillStyle = '#7e2a1e';
  ctx.beginPath();
  ctx.moveTo(x - 12 * s, y - h);
  ctx.lineTo(x + w / 2, y - h - 52 * s);
  ctx.lineTo(x + w + 12 * s, y - h);
  ctx.closePath();
  ctx.fill();
  rect(ctx, x + w * 0.36, y - h * 0.52, w * 0.28, h * 0.52, '#6e2417');
  ctx.strokeStyle = '#f3e2c2';
  ctx.lineWidth = 4 * s;
  ctx.strokeRect(x + w * 0.36, y - h * 0.52, w * 0.28, h * 0.52);
  rect(ctx, x + w * 0.42, y - h * 0.86, w * 0.16, h * 0.18, '#f3e2c2');
}

export function drawTree(ctx, x, y, s) {
  rect(ctx, x - 6 * s, y - 70 * s, 12 * s, 70 * s, '#6e4517');
  ellipse(ctx, x, y - 108 * s, 52 * s, 46 * s, '#c95f1e');
  ellipse(ctx, x - 34 * s, y - 84 * s, 34 * s, 28 * s, '#e07b2a');
  ellipse(ctx, x + 34 * s, y - 86 * s, 32 * s, 26 * s, '#a84e14');
}

export function drawKitchenBackdrop(ctx, offset) {
  rect(ctx, 0, 0, VIEW_W, GROUND_Y, '#f3e2c2');
  ctx.strokeStyle = 'rgba(156,107,52,0.35)';
  ctx.lineWidth = 2;
  for (let x = -((offset * 0.3) % 90); x < VIEW_W; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GROUND_Y);
    ctx.stroke();
  }
  for (let y = 60; y < GROUND_Y; y += 90) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
    ctx.stroke();
  }
  const shelfY = 190;
  rect(ctx, 0, shelfY, VIEW_W, 14, '#9c6b34');
  for (let x = 60 - ((offset * 0.5) % 320); x < VIEW_W; x += 320) {
    roundRect(ctx, x, shelfY - 58, 44, 58, 6, '#c62828');
    roundRect(ctx, x + 56, shelfY - 44, 36, 44, 6, '#3f6d9e');
    roundRect(ctx, x + 104, shelfY - 66, 30, 66, 6, '#5d8a3c');
    ellipse(ctx, x + 170, shelfY - 26, 30, 26, '#8a8f96');
    rect(ctx, x + 196, shelfY - 34, 26, 8, '#6e7278');
  }
}

export function drawGround(ctx, stage, offset) {
  rect(ctx, 0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y, stage.ground);
  rect(ctx, 0, GROUND_Y, VIEW_W, 8, stage.groundLine);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = -((offset) % 64); x < VIEW_W; x += 64) {
    ctx.fillRect(x, GROUND_Y + 34, 30, 6);
    ctx.fillRect(x + 28, GROUND_Y + 72, 22, 5);
  }
}

export function drawTurkey(ctx, x, y, opts) {
  const duck = opts.duck;
  const flap = opts.flap || 0;
  const runPhase = opts.runPhase || 0;
  const hurt = opts.hurt;
  const bodyY = duck ? y + 20 : y;
  const bodyColor = hurt ? '#e8a09a' : '#8a5a2b';
  const darkColor = hurt ? '#c97a72' : '#5f3c17';

  // tail fan
  ctx.save();
  ctx.translate(x - 26, bodyY - 18);
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.32 - 0.5);
    ellipse(ctx, -26, 0, 30, 11, i % 2 ? '#a86a2e' : '#c98a3d');
    ctx.restore();
  }
  ctx.restore();

  // legs
  const legSwing = Math.sin(runPhase) * 12;
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 8, bodyY + 30);
  ctx.lineTo(x - 8 + legSwing, bodyY + 52);
  ctx.moveTo(x + 14, bodyY + 30);
  ctx.lineTo(x + 14 - legSwing, bodyY + 52);
  ctx.stroke();

  // body
  ellipse(ctx, x, bodyY, 46, duck ? 30 : 36, bodyColor);
  ellipse(ctx, x + 8, bodyY + 6, 34, duck ? 20 : 24, darkColor);

  // wing
  const wingY = bodyY + Math.sin(flap * Math.PI * 2) * (flap > 0 ? 10 : 2);
  ellipse(ctx, x - 4, wingY + 2, 24, 13, '#6e4517', -0.4);

  // neck + head
  const headX = x + 40;
  const headY = duck ? bodyY - 14 : bodyY - 34;
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(x + 30, bodyY - 8);
  ctx.lineTo(headX, headY + 8);
  ctx.stroke();
  ellipse(ctx, headX, headY, 15, 13, '#b8c7d9');
  // beak
  ctx.fillStyle = '#f5a623';
  ctx.beginPath();
  ctx.moveTo(headX + 12, headY - 2);
  ctx.lineTo(headX + 28, headY + 2);
  ctx.lineTo(headX + 12, headY + 6);
  ctx.closePath();
  ctx.fill();
  // wattle
  ellipse(ctx, headX + 6, headY + 12, 6, 9, PALETTE.red);
  // eye
  ellipse(ctx, headX + 5, headY - 3, 3.4, 3.4, PALETTE.ink);
  ellipse(ctx, headX + 6, headY - 4, 1.2, 1.2, '#ffffff');
}

export function drawFarmer(ctx, x, y, runPhase, shout) {
  const bob = Math.abs(Math.sin(runPhase)) * 6;
  const top = y - bob;
  const legSwing = Math.sin(runPhase) * 16;

  ctx.strokeStyle = PALETTE.blue;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 6, top + 62);
  ctx.lineTo(x - 6 + legSwing, top + 104);
  ctx.moveTo(x + 10, top + 62);
  ctx.lineTo(x + 10 - legSwing, top + 104);
  ctx.stroke();

  roundRect(ctx, x - 22, top + 8, 46, 58, 8, PALETTE.blue);
  roundRect(ctx, x - 22, top + 8, 46, 20, 8, '#b03a2e');
  ctx.strokeStyle = '#8a4a2b';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(x + 20, top + 22);
  ctx.lineTo(x + 44, top + 44 + Math.sin(runPhase) * 6);
  ctx.stroke();

  // pitchfork
  ctx.strokeStyle = '#6e4517';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + 44, top + 44);
  ctx.lineTo(x + 58, top - 6);
  ctx.stroke();
  ctx.strokeStyle = '#9aa0a6';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 58 + i * 6, top - 6);
    ctx.lineTo(x + 58 + i * 6, top - 22);
    ctx.stroke();
  }

  ellipse(ctx, x + 2, top - 8, 16, 15, '#e8b48c');
  ctx.fillStyle = '#f5b921';
  ctx.beginPath();
  ctx.ellipse(x + 2, top - 20, 24, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  roundRect(ctx, x - 12, top - 34, 28, 14, 5, '#f5b921');
  ellipse(ctx, x + 10, top - 8, 2.6, 2.6, PALETTE.ink);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  if (shout) {
    ctx.arc(x + 12, top + 2, 4, 0, Math.PI * 2);
  } else {
    ctx.moveTo(x + 8, top + 3);
    ctx.lineTo(x + 16, top + 3);
  }
  ctx.stroke();
}

export function drawDog(ctx, x, y, runPhase) {
  const bob = Math.abs(Math.sin(runPhase * 1.4)) * 5;
  const top = y - bob;
  ellipse(ctx, x, top + 26, 36, 18, '#c98a3d');
  ellipse(ctx, x + 34, top + 14, 15, 12, '#c98a3d');
  ellipse(ctx, x + 44, top + 20, 9, 6, '#a86a2e');
  ellipse(ctx, x + 30, top + 2, 6, 11, '#8a5a2b', 0.4);
  ellipse(ctx, x + 38, top + 12, 2.4, 2.4, PALETTE.ink);
  ctx.strokeStyle = '#a86a2e';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  const s = Math.sin(runPhase * 1.4) * 10;
  ctx.beginPath();
  ctx.moveTo(x - 22, top + 38);
  ctx.lineTo(x - 22 + s, top + 58);
  ctx.moveTo(x + 20, top + 38);
  ctx.lineTo(x + 20 - s, top + 58);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 34, top + 18);
  ctx.lineTo(x - 48, top + 4 + Math.sin(runPhase * 2) * 4);
  ctx.stroke();
  rect(ctx, x + 24, top + 22, 12, 6, PALETTE.red);
}

export function drawFence(ctx, x, y, w, h) {
  const posts = Math.max(2, Math.round(w / 26));
  for (let i = 0; i < posts; i++) {
    const px = x + (i * (w - 10)) / (posts - 1 || 1);
    roundRect(ctx, px, y - h, 10, h, 3, '#8a5a2b');
  }
  rect(ctx, x - 4, y - h + 10, w + 8, 9, '#a86a2e');
  rect(ctx, x - 4, y - h * 0.45, w + 8, 9, '#a86a2e');
}

export function drawHayBale(ctx, x, y, w, h) {
  roundRect(ctx, x, y - h, w, h, 14, '#e8c35a');
  ctx.strokeStyle = '#c9a13c';
  ctx.lineWidth = 3;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + (w * i) / 4, y - h + 4);
    ctx.lineTo(x + (w * i) / 4, y - 4);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(x + 4, y - h / 2);
  ctx.lineTo(x + w - 4, y - h / 2);
  ctx.stroke();
}

export function drawKnife(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#d7dde3';
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.lineTo(10, -7);
  ctx.lineTo(22, 0);
  ctx.lineTo(10, 7);
  ctx.closePath();
  ctx.fill();
  roundRect(ctx, 20, -5, 22, 10, 4, '#4c2c10');
  ctx.restore();
}

export function drawOven(ctx, x, y, w, h, flame) {
  roundRect(ctx, x, y - h, w, h, 10, '#5a6068');
  roundRect(ctx, x + 8, y - h + 10, w - 16, h - 44, 8, '#2b1608');
  const fh = 18 + Math.sin(flame * 9) * 6;
  for (let i = 0; i < 4; i++) {
    const fx = x + 18 + i * ((w - 36) / 3);
    ellipse(ctx, fx, y - 34, 9, fh, '#f57c00');
    ellipse(ctx, fx, y - 30, 5, fh * 0.6, '#ffd94d');
  }
  rect(ctx, x + 6, y - 26, w - 12, 7, '#9aa0a6');
  for (let i = 0; i < 3; i++) ellipse(ctx, x + 18 + i * 20, y - h + 8, 5, 5, '#d7dde3');
}

export function drawRollingPin(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  roundRect(ctx, -34, -11, 68, 22, 10, '#d9a55c');
  roundRect(ctx, -48, -6, 16, 12, 6, '#a86a2e');
  roundRect(ctx, 32, -6, 16, 12, 6, '#a86a2e');
  ctx.restore();
}

export function drawCorn(ctx, x, y, golden, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(spin * 3) * 0.18);
  ellipse(ctx, 0, 0, 11, 20, golden ? '#ffb300' : PALETTE.corn);
  ctx.strokeStyle = golden ? '#e65100' : '#d9a55c';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6, -16);
    ctx.lineTo(i * 6, 16);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(-9, -6);
  ctx.lineTo(9, -6);
  ctx.moveTo(-9, 4);
  ctx.lineTo(9, 4);
  ctx.stroke();
  ellipse(ctx, -8, 18, 8, 14, PALETTE.green, 0.5);
  ellipse(ctx, 8, 18, 8, 14, PALETTE.green, -0.5);
  ctx.restore();
  if (golden) {
    ctx.fillStyle = 'rgba(255,217,77,0.85)';
    for (let i = 0; i < 3; i++) {
      const a = spin * 2 + i * 2.1;
      const sx = x + Math.cos(a) * 22;
      const sy = y + Math.sin(a) * 18;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 6);
      ctx.lineTo(sx + 2, sy - 2);
      ctx.lineTo(sx + 6, sy);
      ctx.lineTo(sx + 2, sy + 2);
      ctx.lineTo(sx, sy + 6);
      ctx.lineTo(sx - 2, sy + 2);
      ctx.lineTo(sx - 6, sy);
      ctx.lineTo(sx - 2, sy - 2);
      ctx.closePath();
      ctx.fill();
    }
  }
}

export function drawHeart(ctx, x, y, filled) {
  ctx.fillStyle = filled ? PALETTE.red : 'rgba(58,30,8,0.25)';
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.bezierCurveTo(x - 16, y - 6, x - 8, y - 18, x, y - 8);
  ctx.bezierCurveTo(x + 8, y - 18, x + 16, y - 6, x, y + 10);
  ctx.fill();
}

export function drawLeaf(ctx, x, y, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ellipse(ctx, 0, 0, 10, 5, color);
  ctx.restore();
}
