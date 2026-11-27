// Boot: canvas setup, fixed-timestep loop, and deterministic screenshot scenes via ?shot=.

import { createGame, updateGame, renderGame, handleAction, poseShot } from './game.js';
import { createInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 1) || 1;
const shot = params.get('shot');

const game = createGame(seed);
const input = createInput(canvas, (action) => handleAction(game, action, input));

if (shot) {
  poseShot(game, shot);
  // a few settle frames so scenery and leaves sit naturally, then freeze on one frame
  for (let i = 0; i < 12; i++) updateGame(game, 1 / 60, { duckHeld: false });
  if (shot === 'kitchen') game.turkey.duck = true;
  renderGame(ctx, game);
  window.__shotReady = true;
} else {
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 120;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    while (acc >= STEP) {
      updateGame(game, STEP, input);
      acc -= STEP;
    }
    renderGame(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
