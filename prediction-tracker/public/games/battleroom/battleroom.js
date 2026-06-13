import { createLoop } from '../engine/loop.js';
import { createInput } from '../engine/input.js';
import { createRenderer } from '../engine/renderer.js';
import { norm, sub } from '../engine/vec.js';
import { integrate, applyThrust, bounceWalls } from './physics.js';
import { createSoldier, applyFreezeHit, projectileHits } from './freeze.js';

const W = 720, H = 520;
const bounds = { min: { x: 16, y: 16 }, max: { x: W - 16, y: H - 16 } };
const canvas = document.getElementById('game');
const r = createRenderer(canvas, W, H);
const input = createInput(window, canvas);
const stars = [{ x: W / 2, y: H / 2, s: 46 }, { x: W * 0.25, y: H * 0.3, s: 30 }, { x: W * 0.75, y: H * 0.72, s: 30 }];
const gate = { x: W / 2, y: 34, r: 26 };
let player, enemies, projs, state, msg;

function reset() {
  player = createSoldier({ pos: { x: W / 2, y: H - 60 }, team: 'blue' });
  player.fireCd = 0;
  enemies = [createSoldier({ pos: { x: W * 0.3, y: 90 }, team: 'red' }), createSoldier({ pos: { x: W * 0.7, y: 100 }, team: 'red' })];
  enemies.forEach((e) => { e.fireCd = Math.random(); });
  projs = []; state = 'play'; msg = '';
}
reset();

function shoot(from, dir, team) { projs.push({ pos: { ...from }, vel: { x: dir.x * 420, y: dir.y * 420 }, team, life: 1.4 }); }

function update(dt) {
  if (state !== 'play') { if (input.wasPressed('Space')) reset(); input.endFrame(); return; }
  const t = { x: 0, y: 0 };
  if (input.keys.has('KeyW')) t.y -= 1;
  if (input.keys.has('KeyS')) t.y += 1;
  if (input.keys.has('KeyA')) t.x -= 1;
  if (input.keys.has('KeyD')) t.x += 1;
  if (t.x || t.y) applyThrust(player, norm(t), 360 * player.control, dt);
  integrate(player, dt); bounceWalls(player, bounds, 0.7);
  player.fireCd = Math.max(0, player.fireCd - dt);
  if (input.pointer.down && player.fireCd <= 0) { shoot(player.pos, norm(sub(input.pointer, player.pos)), 'blue'); player.fireCd = 0.25; }

  for (const e of enemies) {
    if (e.frozen) continue;
    integrate(e, dt); bounceWalls(e, bounds, 0.7);
    e.fireCd = Math.max(0, e.fireCd - dt);
    if (e.fireCd <= 0) { shoot(e.pos, norm(sub(player.pos, e.pos)), 'red'); e.fireCd = 1.1; applyThrust(e, norm(sub(player.pos, e.pos)), 60, dt); }
  }

  for (const p of projs) { integrate(p, dt); p.life -= dt; }
  projs = projs.filter((p) => p.life > 0);
  for (const p of projs) {
    if (p.team === 'blue') { for (const e of enemies) { const k = projectileHits(p, e); if (k) { applyFreezeHit(e, k); p.life = 0; } } }
    else { const k = projectileHits(p, player); if (k) { applyFreezeHit(player, k); p.life = 0; } }
  }

  if (enemies.every((e) => e.frozen)) { state = 'over'; msg = 'ALL FROZEN — YOU WIN  (Space)'; }
  else if (Math.hypot(player.pos.x - gate.x, player.pos.y - gate.y) < gate.r) { state = 'over'; msg = 'GATE BREACHED — YOU WIN  (Space)'; }
  else if (player.frozen) { state = 'over'; msg = 'FROZEN — YOU LOSE  (Space)'; }
  input.endFrame();
}

function drawSoldier(s) {
  const c = s.team === 'blue' ? '#4da3ff' : '#ff5b5b';
  r.circle(s.pos, 8, c);
  if (s.frozen) r.circle(s.pos, 14, '#7fdfff', { fill: false, w: 2 });
  else if (s.control < 1) r.circle(s.pos, 12, '#7fdfff', { fill: false, w: 1 });
}

function render() {
  r.clear('#070b14');
  r.poly([{ x: bounds.min.x, y: bounds.min.y }, { x: bounds.max.x, y: bounds.min.y }, { x: bounds.max.x, y: bounds.max.y }, { x: bounds.min.x, y: bounds.max.y }], '#2e4a6b', { fill: false, w: 1 });
  for (const st of stars) r.poly([{ x: st.x - st.s / 2, y: st.y - st.s / 2 }, { x: st.x + st.s / 2, y: st.y - st.s / 2 }, { x: st.x + st.s / 2, y: st.y + st.s / 2 }, { x: st.x - st.s / 2, y: st.y + st.s / 2 }], '#1c3350');
  r.circle(gate, gate.r, '#ffd166', { fill: false, w: 2 });
  for (const p of projs) r.circle(p.pos, 3, p.team === 'blue' ? '#7fdfff' : '#ff9f43');
  drawSoldier(player); enemies.forEach(drawSoldier);
  r.text('WASD to thrust (zero-G drift) · mouse aim + hold to fire · reach gold gate or freeze all', 16, H - 14, '#5b7497', '13px monospace');
  if (state !== 'play') r.text(msg, W / 2 - 170, H / 2, '#fff', '20px monospace');
}

createLoop({ update, render }).start();
