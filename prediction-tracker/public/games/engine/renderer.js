// Thin Canvas2D wrapper with primitive helpers. Points are {x, y}.
export function createRenderer(canvas, width, height) {
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  return {
    ctx, width, height,
    clear(color = '#03070d') { ctx.fillStyle = color; ctx.fillRect(0, 0, width, height); },
    line(a, b, color = '#fff', w = 1) {
      ctx.strokeStyle = color; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    },
    poly(points, color = '#fff', { fill = true, w = 1 } = {}) {
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); }
    },
    circle(c, r, color = '#fff', { fill = true, w = 1 } = {}) {
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); }
    },
    text(str, x, y, color = '#9fb6d6', font = '14px monospace') { ctx.fillStyle = color; ctx.font = font; ctx.fillText(str, x, y); }
  };
}
