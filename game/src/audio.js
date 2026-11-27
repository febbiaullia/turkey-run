// WebAudio synth sound effects: gobbles, jumps, corn dings, thuds and little fanfares.
// No audio files — every sound is a few oscillators, so the game stays fully offline.

let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume();
}

function tone(freq, dur, type, vol, slideTo, delay) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + (delay || 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(vol || 0.08, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  gobble() {
    tone(520, 0.09, 'square', 0.07, 300);
    tone(560, 0.09, 'square', 0.07, 320, 0.1);
    tone(600, 0.14, 'square', 0.08, 260, 0.2);
  },
  jump() {
    tone(300, 0.18, 'sine', 0.1, 720);
  },
  flap() {
    tone(420, 0.12, 'sine', 0.08, 860);
  },
  duck() {
    tone(500, 0.1, 'sine', 0.06, 240);
  },
  corn() {
    tone(880, 0.08, 'triangle', 0.09);
    tone(1320, 0.12, 'triangle', 0.09, null, 0.07);
  },
  golden() {
    tone(784, 0.09, 'triangle', 0.1);
    tone(988, 0.09, 'triangle', 0.1, null, 0.08);
    tone(1175, 0.09, 'triangle', 0.1, null, 0.16);
    tone(1568, 0.2, 'triangle', 0.11, null, 0.24);
  },
  hit() {
    tone(160, 0.22, 'sawtooth', 0.12, 60);
  },
  shout() {
    tone(220, 0.12, 'sawtooth', 0.07, 180);
    tone(240, 0.12, 'sawtooth', 0.07, 190, 0.14);
  },
  stage() {
    tone(523, 0.11, 'triangle', 0.1);
    tone(659, 0.11, 'triangle', 0.1, null, 0.1);
    tone(784, 0.22, 'triangle', 0.11, null, 0.2);
  },
  caught() {
    tone(392, 0.22, 'triangle', 0.1);
    tone(370, 0.22, 'triangle', 0.1, null, 0.22);
    tone(349, 0.22, 'triangle', 0.1, null, 0.44);
    tone(311, 0.5, 'triangle', 0.11, 280, 0.66);
  },
  escape() {
    tone(659, 0.1, 'triangle', 0.1);
    tone(784, 0.1, 'triangle', 0.1, null, 0.09);
    tone(988, 0.1, 'triangle', 0.1, null, 0.18);
    tone(1319, 0.3, 'triangle', 0.11, null, 0.27);
  },
};
