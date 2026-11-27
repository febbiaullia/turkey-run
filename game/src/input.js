// Keyboard, mouse and touch input, normalised into jump / duck / pause / confirm actions.

export function createInput(canvas, onAction) {
  const state = { duckHeld: false };

  function press(action) {
    onAction(action);
  }

  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      if (!e.repeat) press('jump');
    } else if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      e.preventDefault();
      if (!e.repeat) press('jump');
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      e.preventDefault();
      state.duckHeld = true;
      if (!e.repeat) press('duck');
    } else if (k === 'p' || k === 'P' || k === 'Escape') {
      press('pause');
    } else if (k === 'm' || k === 'M') {
      press('mute');
    } else if (k === 'Enter') {
      press('confirm');
    }
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key;
    if (k === 'ArrowDown' || k === 's' || k === 'S') state.duckHeld = false;
  });

  let touchStartY = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const y = (e.clientY - rect.top) / rect.height;
    touchStartY = e.clientY;
    if (y > 0.72) {
      state.duckHeld = true;
      press('duck');
    } else {
      press('jump');
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (touchStartY !== null && e.clientY - touchStartY > 36) {
      state.duckHeld = true;
      press('duck');
    }
  });
  function endPointer() {
    touchStartY = null;
    state.duckHeld = false;
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('pointerleave', endPointer);

  return state;
}
