import { createLoop } from '../engine/loop.js';
import { createInput } from '../engine/input.js';
import { createRenderer } from '../engine/renderer.js';
import { norm, sub, len, dist, fromAngle, angle } from '../engine/vec.js';
import { COLORS, drawCRT, drawFrame } from '../engine/theme.js';
import { createFX, createStarfield } from '../engine/fx.js';
import { sfx, resumeAudio } from '../engine/audio.js';
import { makeButton, buttonHeld, drawButton, readJoystick, drawJoystick, inButton } from '../engine/touchui.js';
import { integrate, applyThrust, bounceWalls } from './physics.js';
import { createSoldier, applyFreezeHit, projectileHits } from './freeze.js';

const W = 720, H = 560;
const bounds = { min: { x: 16, y: 16 }, max: { x: W - 16, y: H - 16 } };
const RAD = 9, MAXV = 240, THRUST = 520, BRAKE = 3.0, PROJ_V = 430;
const canvas = document.getElementById('game');
const r = createRenderer(canvas, W, H);
const ctx = r.ctx;
const input = createInput(window, canvas);
const fx = createFX();
const sky = createStarfield(W, H, 70);

// "the enemy's gate is down" — the objective gate sits at the bottom; you dive toward it.
const gate = { x: W / 2, y: H - 28, r: 30 };
const stars = [
  { x: W / 2, y: H * 0.46, s: 64 },
  { x: W * 0.24, y: H * 0.34, s: 40 },
  { x: W * 0.76, y: H * 0.34, s: 40 },
  { x: W * 0.30, y: H * 0.70, s: 44 },
  { x: W * 0.70, y: H * 0.70, s: 44 },
];
let player, enemies, projs, state, msg, frost = 0, tclock = 0;
const jbX = 80, jbY = H - 80, jbR = 50;
const brakeBtn = makeButton(W - 80, H - 80, 60, 60);

function mk(pos, team) { const s = createSoldier({ pos, team }); s.fireCd = Math.random() * 0.6; s.trail = []; s.flash = 0; return s; }
function reset() {
  player = mk({ x: W / 2, y: 56 }, 'blue');
  player.grace = 1.3; // brief deploy invulnerability so you can orient
  enemies = [mk({ x: W * 0.30, y: H * 0.52 }, 'red'), mk({ x: W * 0.70, y: H * 0.50 }, 'red'), mk({ x: W / 2, y: H * 0.82 }, 'red')];
  projs = []; state = 'play'; msg = ''; frost = 0;
}
reset();

function losBlocked(a, b) {
  // sample the segment; if any sample lands inside a star, line of sight is blocked
  const steps = Math.ceil(dist(a, b) / 10);
  for (let i = 1; i < steps; i++) {
    const x = a.x + (b.x - a.x) * (i / steps), y = a.y + (b.y - a.y) * (i / steps);
    for (const st of stars) { const h = st.s / 2; if (Math.abs(x - st.x) < h && Math.abs(y - st.y) < h) return true; }
  }
  return false;
}
function collideStars(body) {
  for (const st of stars) {
    const h = st.s / 2;
    const cx = Math.max(st.x - h, Math.min(body.pos.x, st.x + h));
    const cy = Math.max(st.y - h, Math.min(body.pos.y, st.y + h));
    const dx = body.pos.x - cx, dy = body.pos.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < RAD * RAD) {
      const d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d, ov = RAD - d;
      body.pos.x += nx * ov; body.pos.y += ny * ov;
      const vn = body.vel.x * nx + body.vel.y * ny;
      if (vn < 0) { body.vel.x -= 1.6 * vn * nx; body.vel.y -= 1.6 * vn * ny; }
    }
  }
}
function clampV(b) { const s = len(b.vel); if (s > MAXV) { b.vel.x *= MAXV / s; b.vel.y *= MAXV / s; } }
function shoot(from, dir, team, owner) { projs.push({ pos: { x: from.x, y: from.y }, prev: { x: from.x, y: from.y }, vel: { x: dir.x * PROJ_V, y: dir.y * PROJ_V }, team, life: 1.6, owner }); }

function hitSoldier(s, kind) {
  const was = s.frozen;
  applyFreezeHit(s, kind);
  if (s.frozen && !was) { fx.burst(s.pos.x, s.pos.y, COLORS.ice, 26, 220); fx.ring(s.pos.x, s.pos.y, COLORS.ice, 42, 0.55, 2); fx.shake(5); sfx.freeze(); frost = 0.45; }
  else { fx.burst(s.pos.x, s.pos.y, COLORS.ice, 7, 130); s.flash = 0.1; sfx.hit(); }
}

function update(dt) {
  tclock += dt; sky.update(dt); fx.update(dt);
  if (frost > 0) frost = Math.max(0, frost - dt);
  if (player.grace > 0) player.grace -= dt;
  player.flash = Math.max(0, player.flash - dt);
  enemies.forEach(e => e.flash = Math.max(0, e.flash - dt));

  if (state !== 'play') { if (input.wasPressed('Space')) { resumeAudio(); reset(); } input.endFrame(); return; }
  if (input.pointer.down || input.keys.size) resumeAudio();

  // ----- player thrust (zero-G): touch joystick or WASD -----
  let thrustDir = null, thrustMag = 1;
  if (input.isTouch) {
    const js = readJoystick(input, jbX, jbY, jbR, p => p.x < W * 0.42);
    if (js.active) { thrustDir = { x: js.x, y: js.y }; thrustMag = 1; }
    if (buttonHeld(brakeBtn, input) && len(player.vel) > 4) applyThrust(player, norm({ x: -player.vel.x, y: -player.vel.y }), BRAKE * 100, dt);
  } else {
    const t = { x: 0, y: 0 };
    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) t.y -= 1;
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) t.y += 1;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) t.x -= 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) t.x += 1;
    if (t.x || t.y) thrustDir = norm(t);
    if (input.keys.has('Space') && len(player.vel) > 4) applyThrust(player, norm({ x: -player.vel.x, y: -player.vel.y }), BRAKE * 100, dt);
  }
  if (thrustDir && player.control > 0) {
    applyThrust(player, thrustDir, THRUST * thrustMag * player.control, dt);
    const back = norm({ x: -thrustDir.x || 0.0001, y: -thrustDir.y || 0 });
    fx.trail(player.pos.x + back.x * 9, player.pos.y + back.y * 9, COLORS.blue, back.x * 80, back.y * 80, 2);
    if (Math.random() < 0.4) sfx.thrust();
  }
  integrate(player, dt); clampV(player); bounceWalls(player, bounds, 0.6); collideStars(player);
  pushTrail(player);

  // ----- player fire: touch right-side aim or mouse -----
  player.fireCd = Math.max(0, player.fireCd - dt);
  let fireAt = null;
  if (input.isTouch) { const ft = input.touches.find(t => t.x >= W * 0.42 && !inButton(brakeBtn, t)); if (ft) fireAt = ft; }
  else if (input.pointer.down) fireAt = input.pointer;
  if (fireAt && player.fireCd <= 0 && player.control > 0) {
    shoot(player.pos, norm(sub(fireAt, player.pos)), 'blue', player); player.fireCd = 0.22; sfx.beam();
  }

  // enemies: use cover, peek, fire with line of sight
  for (const e of enemies) {
    if (e.frozen) continue;
    const toP = sub(player.pos, e.pos), d = len(toP);
    const desired = d > 230 ? 90 : (d < 140 ? -70 : 0); // keep mid range
    if (desired) applyThrust(e, norm(toP), desired, dt);
    // light strafing
    applyThrust(e, { x: -toP.y / (d || 1), y: toP.x / (d || 1) }, 26 * Math.sin(tclock * 1.3 + e.pos.x), dt);
    integrate(e, dt); clampV(e); bounceWalls(e, bounds, 0.6); collideStars(e);
    pushTrail(e);
    e.fireCd = Math.max(0, e.fireCd - dt);
    if (e.fireCd <= 0 && !losBlocked(e.pos, player.pos) && d < 320 && player.grace <= 0) {
      const lead = { x: player.pos.x + player.vel.x * 0.12, y: player.pos.y + player.vel.y * 0.12 };
      shoot(e.pos, norm(sub(lead, e.pos)), 'red', e); e.fireCd = 1.5 + Math.random() * 0.7;
    }
  }

  // projectiles
  for (const p of projs) { p.prev = { x: p.pos.x, y: p.pos.y }; integrate(p, dt); p.life -= dt; }
  projs = projs.filter((p) => {
    if (p.life <= 0) return false;
    for (const st of stars) { const h = st.s / 2; if (Math.abs(p.pos.x - st.x) < h && Math.abs(p.pos.y - st.y) < h) { fx.burst(p.pos.x, p.pos.y, p.team === 'blue' ? COLORS.ice : COLORS.amber, 5, 90); return false; } }
    return true;
  });
  for (const p of projs) {
    if (p.team === 'blue') { for (const e of enemies) { if (e.frozen) continue; const k = projectileHits(p, e, RAD + 3); if (k) { hitSoldier(e, k); p.life = 0; break; } } }
    else { const k = projectileHits(p, player, RAD + 3); if (k) { p.life = 0; if (player.grace > 0) { fx.burst(player.pos.x, player.pos.y, COLORS.blue, 5, 90); } else { hitSoldier(player, k); } } }
  }
  projs = projs.filter(p => p.life > 0);

  // win/lose
  if (enemies.every((e) => e.frozen)) end('SIMULATION PASSED', 'win', 'all hostiles frozen');
  else if (dist(player.pos, gate) < gate.r && !player.frozen) end('GATE BREACHED', 'win', "the enemy's gate is down");
  else if (player.frozen) end('FROZEN SOLID', 'lose', 'simulation failed');
  input.endFrame();
}

function end(m, kind, sub2) { state = 'over'; msg = m; window._sub = sub2; window._kind = kind; if (kind === 'win') sfx.win(); else sfx.lose(); }

function pushTrail(s) { s.trail.push({ x: s.pos.x, y: s.pos.y }); if (s.trail.length > 12) s.trail.shift(); }

// ---------- render ----------
function drawStar(st) {
  const h = st.s / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(28,64,92,0.5)';
  ctx.strokeStyle = COLORS.blueDim; ctx.lineWidth = 1.5; ctx.shadowBlur = 8; ctx.shadowColor = COLORS.blueDim;
  ctx.fillRect(st.x - h, st.y - h, st.s, st.s);
  ctx.strokeRect(st.x - h, st.y - h, st.s, st.s);
  // inner detailing
  ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.moveTo(st.x - h, st.y - h); ctx.lineTo(st.x + h, st.y + h); ctx.moveTo(st.x + h, st.y - h); ctx.lineTo(st.x - h, st.y + h); ctx.stroke();
  ctx.restore();
}
function drawSoldier(s) {
  for (let i = 0; i < s.trail.length; i++) { const p = s.trail[i], a = i / s.trail.length; ctx.globalAlpha = a * 0.4; ctx.fillStyle = s.team === 'blue' ? COLORS.blue : COLORS.red; ctx.beginPath(); ctx.arc(p.x, p.y, a * 3, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  const base = s.team === 'blue' ? COLORS.blue : COLORS.red;
  const col = s.flash > 0 ? '#ffffff' : base;
  if (s.frozen) {
    // frozen crystal
    r.circle(s.pos, RAD + 4, COLORS.ice, { fill: false, w: 2, glow: 12 });
    drawShard(s.pos, RAD + 4);
    r.circle(s.pos, RAD, base, { glow: 4 });
  } else {
    if (s.control < 1) r.circle(s.pos, RAD + 4, COLORS.ice, { fill: false, w: 1, glow: 6 }); // partial freeze cracks
    r.circle(s.pos, RAD, col, { glow: 12 });
    r.circle(s.pos, RAD - 3, '#ffffff', { glow: 4 });
  }
  if (s === player && s.grace > 0) { ctx.globalAlpha = 0.4 + 0.4 * Math.abs(Math.sin(tclock * 12)); r.circle(s.pos, RAD + 7, COLORS.blue, { fill: false, w: 1.5, glow: 10 }); ctx.globalAlpha = 1; }
}
function drawShard(c, rr) {
  ctx.save(); ctx.strokeStyle = COLORS.ice; ctx.lineWidth = 1; ctx.globalAlpha = 0.8; ctx.shadowBlur = 8; ctx.shadowColor = COLORS.ice;
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.4; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr); ctx.stroke(); }
  ctx.restore(); ctx.globalAlpha = 1;
}
function drawGate() {
  const pulse = 1 + Math.sin(tclock * 3) * 0.06;
  r.circle(gate, gate.r * pulse, COLORS.amber, { fill: false, w: 2, glow: 16 });
  r.circle(gate, gate.r * 0.6 * pulse, COLORS.amber, { fill: false, w: 1, glow: 8 });
  // downward chevrons: "the enemy's gate is down"
  ctx.save(); ctx.strokeStyle = COLORS.amber; ctx.globalAlpha = 0.5; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const yy = gate.y - 70 - i * 12 + (tclock * 30 % 36); ctx.globalAlpha = 0.35 - i * 0.1; ctx.beginPath(); ctx.moveTo(gate.x - 10, yy); ctx.lineTo(gate.x, yy + 8); ctx.lineTo(gate.x + 10, yy); ctx.stroke(); }
  ctx.restore(); ctx.globalAlpha = 1;
}

function render() {
  r.clear(COLORS.bg);
  sky.draw(ctx);
  ctx.save(); fx.applyShake(ctx);
  drawGate();
  for (const st of stars) drawStar(st);
  for (const p of projs) {
    const col = p.team === 'blue' ? COLORS.ice : COLORS.amber;
    r.line(p.prev, p.pos, col, 2.4, 10); r.circle(p.pos, 2.6, '#ffffff', { glow: 8 });
  }
  drawSoldier(player); enemies.forEach(drawSoldier);
  fx.draw(ctx);
  ctx.restore();

  drawFrame(ctx, W, H);

  // frost overlay when hit
  if (frost > 0) { ctx.save(); ctx.globalAlpha = frost * 0.5; ctx.fillStyle = COLORS.ice; ctx.fillRect(0, 0, W, H); ctx.restore(); }

  // HUD
  r.text('SIM-B · BATTLE ROOM', 22, 30, COLORS.text, '12px monospace', { glow: 4 });
  ctx.globalAlpha = 0.4 + 0.3 * Math.abs(Math.sin(tclock * 1.4)); r.text('● OBSERVED', W - 104, 30, COLORS.amber, '11px monospace'); ctx.globalAlpha = 1;
  // hostile freeze pips
  r.text('HOSTILES', W / 2 - 78, 30, COLORS.text, '11px monospace');
  enemies.forEach((e, i) => r.circle({ x: W / 2 + 4 + i * 16, y: 26 }, 5, e.frozen ? COLORS.ice : COLORS.red, e.frozen ? { fill: false, w: 1.5 } : { glow: 6 }));
  r.text("objective: freeze all hostiles  ·  or  ·  the enemy's gate is DOWN", 22, H - 16, COLORS.textDim, '11px monospace');

  if (input.isTouch && state === 'play') {
    const js = readJoystick(input, jbX, jbY, jbR, p => p.x < W * 0.42);
    drawJoystick(r, jbX, jbY, jbR, js, COLORS.blue);
    drawButton(r, brakeBtn, 'BRAKE', COLORS.amber, buttonHeld(brakeBtn, input));
    r.text('aim + fire', W * 0.72, H - 88, COLORS.textDim, '11px monospace', { align: 'center' });
  }

  drawCRT(ctx, W, H, tclock);

  if (state === 'over') {
    const color = window._kind === 'win' ? COLORS.blue : COLORS.red;
    ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#02040a'; ctx.fillRect(W / 2 - 220, H / 2 - 48, 440, 86);
    ctx.globalAlpha = 0.5; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.shadowBlur = 12; ctx.shadowColor = color; ctx.strokeRect(W / 2 - 220, H / 2 - 48, 440, 86); ctx.restore();
    r.text(msg, W / 2, H / 2 - 6, color, 'bold 28px monospace', { align: 'center', glow: 16 });
    r.text(window._sub || '', W / 2, H / 2 + 18, COLORS.text, '12px monospace', { align: 'center' });
    r.text('press SPACE to redeploy', W / 2, H / 2 + 40, COLORS.textDim, '11px monospace', { align: 'center' });
  }
}

createLoop({ update, render }).start();
