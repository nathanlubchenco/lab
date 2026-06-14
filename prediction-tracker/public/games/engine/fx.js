// Juice: particles, shockwave rings, floating text, screenshake. All additive-glow.
const rand = (a, b) => a + Math.random() * (b - a);

export function createFX() {
  let particles = [];
  let rings = [];
  let texts = [];
  let shakeMag = 0, shakeT = 0;

  return {
    // Radial spray of glowing sparks.
    burst(x, y, color, n = 14, speed = 200) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), s = rand(speed * 0.15, speed);
        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.3, 0.75), max: 0.75, color, r: rand(1, 2.8), drag: 0.9 });
      }
    },
    // Directional exhaust/trail particle.
    trail(x, y, color, vx = 0, vy = 0, r = 2) {
      particles.push({ x, y, vx: vx + rand(-12, 12), vy: vy + rand(-12, 12), life: rand(0.25, 0.5), max: 0.5, color, r, drag: 0.94 });
    },
    // Expanding ring (impact / shockwave).
    ring(x, y, color, r1 = 46, life = 0.5, w = 2) {
      rings.push({ x, y, color, r0: 4, r1, cur: 4, life, max: life, w });
    },
    text(x, y, str, color, { life = 0.9, vy = -34, size = 16 } = {}) {
      texts.push({ x, y, str, color, life, max: life, vy, size });
    },
    shake(mag, dur = 0.28) { shakeMag = Math.max(shakeMag, mag); shakeT = Math.max(shakeT, dur); },

    update(dt) {
      for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= p.drag; p.vy *= p.drag; p.life -= dt; }
      particles = particles.filter(p => p.life > 0);
      for (const r of rings) { const k = 1 - r.life / r.max; r.cur = r.r0 + (r.r1 - r.r0) * (1 - (1 - k) * (1 - k)); r.life -= dt; }
      rings = rings.filter(r => r.life > 0);
      for (const t of texts) { t.y += t.vy * dt; t.vy *= 0.9; t.life -= dt; }
      texts = texts.filter(t => t.life > 0);
      shakeT -= dt; if (shakeT <= 0) shakeMag = 0;
    },

    // Call right after ctx.save(), before world draw, to offset the camera.
    applyShake(ctx) {
      if (shakeMag > 0 && shakeT > 0) {
        const m = shakeMag * (shakeT / 0.28);
        ctx.translate(rand(-m, m), rand(-m, m));
      }
    },

    draw(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color; ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const r of rings) {
        ctx.globalAlpha = Math.max(0, r.life / r.max) * 0.85;
        ctx.strokeStyle = r.color; ctx.lineWidth = r.w; ctx.shadowBlur = 14; ctx.shadowColor = r.color;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.cur, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.textAlign = 'center';
      for (const t of texts) {
        ctx.globalAlpha = Math.min(1, t.life / (t.max * 0.5));
        ctx.fillStyle = t.color; ctx.shadowBlur = 10; ctx.shadowColor = t.color;
        ctx.font = `bold ${t.size}px "Courier New", monospace`;
        ctx.fillText(t.str, t.x, t.y);
      }
      ctx.restore();
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    },
  };
}

// Parallax twinkling starfield, drawn behind everything.
export function createStarfield(w, h, n = 80) {
  const stars = [];
  for (let i = 0; i < n; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, z: Math.random(), tw: Math.random() * Math.PI * 2 });
  return {
    update(dt) { for (const s of stars) s.tw += dt * 2.2; },
    draw(ctx) {
      ctx.save();
      for (const s of stars) {
        const b = (0.35 + 0.65 * Math.abs(Math.sin(s.tw))) * (0.4 + s.z * 0.6);
        ctx.globalAlpha = b * 0.6; ctx.fillStyle = '#bfe6ff';
        const r = s.z * 1.7 + 0.3;
        ctx.fillRect(s.x, s.y, r, r);
      }
      ctx.restore(); ctx.globalAlpha = 1;
    },
  };
}
