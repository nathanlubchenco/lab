// Minimal on-screen touch controls: buttons + a virtual joystick.
// Logic reads input.touches (multi-touch) and falls back to the mouse pointer.
import { COLORS } from './theme.js';

function inRect(p, b) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }
export function inButton(btn, p) { return inRect(p, btn); }

export function makeButton(x, y, w, h) { return { x, y, w, h, _held: false }; }

function hitButton(btn, input) {
  if (input.touches.length) return input.touches.some(t => inRect(t, btn));
  return input.pointer.down && inRect(input.pointer, btn);
}
// rising-edge press (for one-shot actions like boost)
export function buttonPressed(btn, input) { const hit = hitButton(btn, input); const edge = hit && !btn._held; btn._held = hit; return edge; }
export function buttonHeld(btn, input) { return hitButton(btn, input); }

export function drawButton(r, btn, label, color = COLORS.blue, held = false) {
  const ctx = r.ctx, { x, y, w, h } = btn, rad = Math.min(w, h) / 2;
  ctx.save();
  ctx.globalAlpha = held ? 0.5 : 0.22; ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, rad, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.9; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = color;
  ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, rad, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  r.text(label, x + w / 2, y + h / 2 + 4, color, 'bold 12px monospace', { align: 'center', glow: 6 });
}

// Virtual joystick anchored at (cx,cy). Returns {x,y} in [-1,1] from the active touch in `zoneFn`.
export function readJoystick(input, cx, cy, maxR, zoneFn) {
  let t = null;
  if (input.touches.length) t = input.touches.find(zoneFn);
  else if (input.pointer.down && zoneFn(input.pointer)) t = input.pointer;
  if (!t) return { x: 0, y: 0, active: false, tx: cx, ty: cy };
  let dx = t.x - cx, dy = t.y - cy; const d = Math.hypot(dx, dy) || 1;
  const m = Math.min(d, maxR) / maxR;
  return { x: (dx / d) * m, y: (dy / d) * m, active: true, tx: t.x, ty: t.y };
}

export function drawJoystick(r, cx, cy, maxR, js, color = COLORS.blue) {
  const ctx = r.ctx;
  ctx.save(); ctx.globalAlpha = 0.3; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowBlur = 8; ctx.shadowColor = color;
  ctx.beginPath(); ctx.arc(cx, cy, maxR, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = js.active ? 0.7 : 0.4;
  const kx = cx + js.x * maxR, ky = cy + js.y * maxR;
  ctx.beginPath(); ctx.arc(kx, ky, maxR * 0.42, 0, Math.PI * 2); ctx.fillStyle = color; ctx.globalAlpha = js.active ? 0.5 : 0.25; ctx.fill();
  ctx.restore(); ctx.globalAlpha = 1;
}
