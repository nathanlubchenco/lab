// Shared "I.F. Battle School holo-terminal" visual identity.
export const COLORS = {
  bg: '#05070f',
  blue: '#36e0ff', blueDim: '#14506a',
  red: '#ff3b6b', redDim: '#7a1f3a',
  amber: '#ffd166', amberDim: '#7a6320',
  ice: '#9fe8ff',
  white: '#eaf6ff',
  grid: '#0d2030',
  text: '#7fa8c8', textDim: '#41607c',
};

// Scanlines + vignette + faint phosphor flicker over the whole canvas.
export function drawCRT(ctx, w, h, t = 0) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.05; ctx.fillStyle = '#000';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 1;

  const flick = 0.015 + 0.015 * Math.abs(Math.sin(t * 1.7)) + 0.01 * Math.random();
  ctx.fillStyle = `rgba(90,190,255,${flick})`;
  ctx.fillRect(0, 0, w, h);
}

// Bordered viewport with bright corner brackets — the "terminal frame".
export function drawFrame(ctx, w, h, pad = 10) {
  ctx.save();
  ctx.strokeStyle = COLORS.blueDim; ctx.lineWidth = 1;
  ctx.strokeRect(pad + 0.5, pad + 0.5, w - 2 * pad - 1, h - 2 * pad - 1);
  const c = 18;
  ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 2; ctx.shadowBlur = 8; ctx.shadowColor = COLORS.blue;
  const pts = [[pad, pad, 1, 1], [w - pad, pad, -1, 1], [pad, h - pad, 1, -1], [w - pad, h - pad, -1, -1]];
  for (const [cx, cy, dx, dy] of pts) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * c); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * c, cy);
    ctx.stroke();
  }
  ctx.restore();
}

// A military-readout status bar string helper: pads "label" / "value" pairs.
export function readout(parts, sep = '   ') {
  return parts.join(sep);
}
