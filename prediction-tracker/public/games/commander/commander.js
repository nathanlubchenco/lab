import { createLoop } from '../engine/loop.js';
import { createInput } from '../engine/input.js';
import { createRenderer } from '../engine/renderer.js';
import { norm, sub } from '../engine/vec.js';
import { integrate, applyThrust, bounceWalls } from '../battleroom/physics.js';
import { createSoldier, applyFreezeHit, projectileHits } from '../battleroom/freeze.js';
import { issueOrder, updateOrders, resolveBehavior } from './orders.js';

const W = 720, H = 520;
const bounds = { min: { x: 16, y: 16 }, max: { x: W - 16, y: H - 16 } };
const canvas = document.getElementById('game');
const r = createRenderer(canvas, W, H);
const input = createInput(window, canvas);
const enemyGate = { x: W / 2, y: 34, r: 26 };
let squad, foes, projs, state, msg;

function mk(pos, team) { const s = createSoldier({ pos, team }); s.fireCd = 0; s.activeOrder = null; s.pendingOrder = null; return s; }
function reset() {
  squad = [mk({ x: W * 0.4, y: H - 60 }, 'blue'), mk({ x: W * 0.5, y: H - 60 }, 'blue'), mk({ x: W * 0.6, y: H - 60 }, 'blue')];
  foes = [mk({ x: W * 0.4, y: 90 }, 'red'), mk({ x: W * 0.6, y: 90 }, 'red')];
  projs = []; state = 'play'; msg = '';
}
reset();

function shoot(from, target, team) { const d = norm(sub(target, from)); projs.push({ pos: { ...from }, vel: { x: d.x * 400, y: d.y * 400 }, team, life: 1.5 }); }

function update(dt) {
  if (state !== 'play') { if (input.wasPressed('Space')) reset(); input.endFrame(); return; }

  if (input.pointer.down) {
    const target = { x: input.pointer.x, y: input.pointer.y };
    for (const u of squad) if (!u.frozen) issueOrder(u, { type: 'move', target });
  }

  for (const u of squad) {
    updateOrders(u, dt);
    const underFire = projs.some((p) => p.team === 'red' && Math.hypot(p.pos.x - u.pos.x, p.pos.y - u.pos.y) < 70);
    const coverPoint = { x: u.pos.x + (u.pos.x < W / 2 ? 70 : -70), y: u.pos.y };
    const b = resolveBehavior(u, { underFire, coverPoint });
    if (b.action === 'move' && b.target) applyThrust(u, norm(sub(b.target, u.pos)), 300 * u.control, dt);
    integrate(u, dt); bounceWalls(u, bounds, 0.6);
    u.fireCd = Math.max(0, u.fireCd - dt);
    const tgt = foes.find((f) => !f.frozen);
    if (tgt && !u.frozen && u.fireCd <= 0) { shoot(u.pos, tgt.pos, 'blue'); u.fireCd = 0.7; }
  }

  for (const f of foes) {
    if (f.frozen) continue;
    const tgt = squad.find((s) => !s.frozen);
    if (tgt) {
      applyThrust(f, norm(sub(tgt.pos, f.pos)), 120, dt);
      f.fireCd = Math.max(0, f.fireCd - dt);
      if (f.fireCd <= 0) { shoot(f.pos, tgt.pos, 'red'); f.fireCd = 0.9; }
    }
    integrate(f, dt); bounceWalls(f, bounds, 0.6);
  }

  for (const p of projs) { integrate(p, dt); p.life -= dt; }
  projs = projs.filter((p) => p.life > 0);
  for (const p of projs) {
    const targets = p.team === 'blue' ? foes : squad;
    for (const s of targets) { const k = projectileHits(p, s); if (k) { applyFreezeHit(s, k); p.life = 0; break; } }
  }

  if (foes.every((f) => f.frozen)) { state = 'over'; msg = 'ENEMY SQUAD FROZEN — YOU WIN  (Space)'; }
  else if (squad.some((s) => !s.frozen && Math.hypot(s.pos.x - enemyGate.x, s.pos.y - enemyGate.y) < enemyGate.r)) { state = 'over'; msg = 'GATE BREACHED — YOU WIN  (Space)'; }
  else if (squad.every((s) => s.frozen)) { state = 'over'; msg = 'SQUAD FROZEN — YOU LOSE  (Space)'; }
  input.endFrame();
}

function drawSoldier(s) {
  const c = s.team === 'blue' ? '#4da3ff' : '#ff5b5b';
  if (s.team === 'blue' && s.pendingOrder) r.line(s.pos, s.pendingOrder.target, '#ffd166', 1); // order in flight
  r.circle(s.pos, 8, c);
  if (s.frozen) r.circle(s.pos, 14, '#7fdfff', { fill: false, w: 2 });
}

function render() {
  r.clear('#070b14');
  r.poly([{ x: bounds.min.x, y: bounds.min.y }, { x: bounds.max.x, y: bounds.min.y }, { x: bounds.max.x, y: bounds.max.y }, { x: bounds.min.x, y: bounds.max.y }], '#2e4a6b', { fill: false, w: 1 });
  r.circle(enemyGate, enemyGate.r, '#ffd166', { fill: false, w: 2 });
  for (const p of projs) r.circle(p.pos, 3, p.team === 'blue' ? '#7fdfff' : '#ff9f43');
  squad.forEach(drawSoldier); foes.forEach(drawSoldier);
  r.text('Click to order your squad to a point — they answer with delay + their own momentum', 16, H - 14, '#5b7497', '13px monospace');
  if (state !== 'play') r.text(msg, W / 2 - 190, H / 2, '#fff', '20px monospace');
}

createLoop({ update, render }).start();
