// Thin Canvas2D wrapper with primitive helpers. Points are {x, y}.
// Every primitive accepts an optional glow (px) that adds a phosphor halo.
export function createRenderer(canvas, width, height) {
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');

  function withGlow(color, glow, fn) {
    if (glow) { ctx.save(); ctx.shadowBlur = glow; ctx.shadowColor = color; fn(); ctx.restore(); }
    else fn();
  }

  return {
    ctx, width, height,
    clear(color = '#05070f') { ctx.fillStyle = color; ctx.fillRect(0, 0, width, height); },
    line(a, b, color = '#fff', w = 1, glow = 0) {
      withGlow(color, glow, () => {
        ctx.strokeStyle = color; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      });
    },
    poly(points, color = '#fff', { fill = true, w = 1, glow = 0 } = {}) {
      withGlow(color, glow, () => {
        ctx.beginPath();
        points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); }
      });
    },
    circle(c, r, color = '#fff', { fill = true, w = 1, glow = 0 } = {}) {
      withGlow(color, glow, () => {
        ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); }
      });
    },
    text(str, x, y, color = '#9fb6d6', font = '14px monospace', { glow = 0, align = 'left' } = {}) {
      withGlow(color, glow, () => {
        ctx.fillStyle = color; ctx.font = font; ctx.textAlign = align;
        ctx.fillText(str, x, y); ctx.textAlign = 'left';
      });
    },
  };
}
