// Keyboard (held set + per-frame edge) and pointer position/down state.
export function createInput(target = window, canvas = null) {
  const keys = new Set();
  const pressed = new Set();
  const pointer = { x: 0, y: 0, down: false };

  target.addEventListener('keydown', (e) => { if (!keys.has(e.code)) pressed.add(e.code); keys.add(e.code); });
  target.addEventListener('keyup', (e) => keys.delete(e.code));

  if (canvas) {
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) * (canvas.width / r.width);
      pointer.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', () => { pointer.down = true; });
    window.addEventListener('mouseup', () => { pointer.down = false; });
  }

  return {
    keys, pointer,
    wasPressed(code) { return pressed.has(code); },
    endFrame() { pressed.clear(); }
  };
}
