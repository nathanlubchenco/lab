// Keyboard (held set + per-frame edge), pointer, and multi-touch input.
export function createInput(target = window, canvas = null) {
  const keys = new Set();
  const pressed = new Set();
  const pointer = { x: 0, y: 0, down: false };
  const touches = []; // [{ id, x, y }] in canvas coords
  const state = { isTouch: false };

  target.addEventListener('keydown', (e) => { if (!keys.has(e.code)) pressed.add(e.code); keys.add(e.code); });
  target.addEventListener('keyup', (e) => keys.delete(e.code));

  function toCanvas(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: (clientX - r.left) * (canvas.width / r.width), y: (clientY - r.top) * (canvas.height / r.height) };
  }

  if (canvas) {
    canvas.addEventListener('mousemove', (e) => { const p = toCanvas(e.clientX, e.clientY); pointer.x = p.x; pointer.y = p.y; });
    canvas.addEventListener('mousedown', (e) => { const p = toCanvas(e.clientX, e.clientY); pointer.x = p.x; pointer.y = p.y; pointer.down = true; });
    window.addEventListener('mouseup', () => { pointer.down = false; });

    const syncTouches = (e) => {
      touches.length = 0;
      for (const t of e.touches) { const p = toCanvas(t.clientX, t.clientY); touches.push({ id: t.identifier, x: p.x, y: p.y }); }
      if (touches.length) { pointer.x = touches[0].x; pointer.y = touches[0].y; pointer.down = true; }
      else pointer.down = false;
    };
    canvas.addEventListener('touchstart', (e) => { state.isTouch = true; e.preventDefault(); syncTouches(e); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); syncTouches(e); }, { passive: false });
    canvas.addEventListener('touchend', (e) => { e.preventDefault(); syncTouches(e); }, { passive: false });
    canvas.addEventListener('touchcancel', (e) => { e.preventDefault(); syncTouches(e); }, { passive: false });
  }

  return {
    keys, pointer, touches, state,
    get isTouch() { return state.isTouch; },
    wasPressed(code) { return pressed.has(code); },
    endFrame() { pressed.clear(); },
  };
}
