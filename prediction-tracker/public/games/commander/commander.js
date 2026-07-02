import { createLoop } from '../engine/loop.js';
import { createInput } from '../engine/input.js';
import { createRenderer } from '../engine/renderer.js';
import { norm, sub, len, dist } from '../engine/vec.js';
import { COLORS, drawCRT, drawFrame } from '../engine/theme.js';
import { createFX, createStarfield } from '../engine/fx.js';
import { sfx, resumeAudio } from '../engine/audio.js';
import { integrate, applyThrust, bounceWalls } from '../battleroom/physics.js';
import { createSoldier, applyFreezeHit, projectileHits } from '../battleroom/freeze.js';
import { issueOrder, updateOrders, queueOrder, updateQueue, resolveBehavior, ORDER_DELAY } from './orders.js';
import { pickTarget, guardGoal, hunterGoal } from './foeai.js';
import { createVariants, drawVariantHUD } from '../engine/variants.js';

const V = createVariants('commander', [
  { id: 'wego', name: 'WEGO', blurb: 'freeze time · queue orders · SPACE runs 2.5s of battle' },
  { id: 'direct', name: 'DIRECT', blurb: 'real-time, zero comms lag' },
  { id: 'classic', name: 'CLASSIC', blurb: 'v1 — real-time with 0.45s comms lag' },
]);
const EXEC_LEN = 2.5; // s of simultaneous execution per WeGo turn
const ORDERS_PER_TURN = 4; // WeGo comms bandwidth — you can't micro everyone

const W = 720, H = 560;
const bounds = { min: { x: 16, y: 16 }, max: { x: W - 16, y: H - 16 } };
const RAD = 9, MAXV = 220, PROJ_V = 410;
const canvas = document.getElementById('game');
const r = createRenderer(canvas, W, H);
const ctx = r.ctx;
const input = createInput(window, canvas);
const fx = createFX();
const sky = createStarfield(W, H, 70);
const enemyGate = { x: W / 2, y: 74, r: 26 };
const stars = [
  { x: W / 2, y: H * 0.5, s: 58 }, { x: W * 0.26, y: H * 0.38, s: 40 }, { x: W * 0.74, y: H * 0.38, s: 40 },
  { x: W * 0.30, y: H * 0.64, s: 40 }, { x: W * 0.70, y: H * 0.64, s: 40 },
];
let squad, foes, projs, state, msg, tclock = 0, frost = 0, lastOrder = null;
let phase, execT, turn; // WeGo: 'plan' (time frozen, queue orders) / 'exec' (watch it unfold)
let selected = null, ordersLeft = ORDERS_PER_TURN, foePlanT = 0, gateT = 0;
const GATE_DWELL = 0.4; // s a soldier must hold the gate to breach it

function mk(pos, team) {
  const s = createSoldier({ pos, team });
  s.fireCd = Math.random() * 0.5; s.activeOrder = null; s.pendingOrder = null; s.orderQueue = []; s.trail = []; s.flash = 0; s.intent = null;
  return s;
}
function mkFoe(pos, role, post) { const f = mk(pos, 'red'); f.role = role; f.post = post || { ...pos }; f.goal = null; return f; }
function reset() {
  squad = [mk({ x: W * 0.38, y: H - 56 }, 'blue'), mk({ x: W * 0.5, y: H - 44 }, 'blue'), mk({ x: W * 0.62, y: H - 56 }, 'blue')];
  // outnumbered 3v5: two gate guards + three hunters, commanded turn by turn
  foes = [
    mkFoe({ x: W / 2 - 70, y: 118 }, 'guard'),
    mkFoe({ x: W / 2 + 70, y: 118 }, 'guard'),
    mkFoe({ x: W * 0.30, y: 150 }, 'hunter'),
    mkFoe({ x: W * 0.70, y: 150 }, 'hunter'),
    mkFoe({ x: W / 2, y: H * 0.34 }, 'hunter'),
  ];
  projs = []; state = 'play'; msg = ''; frost = 0; lastOrder = null;
  phase = 'plan'; execT = 0; turn = 1; selected = null; ordersLeft = ORDERS_PER_TURN; foePlanT = 0; gateT = 0;
}
function planFoes() {
  // guards abandon post to close out the game once the hunt is theirs to finish:
  // when the squad is down to one, or all hunters are frozen (one guard always stays)
  const squadUp = squad.filter((s) => !s.frozen).length;
  const huntersUp = foes.filter((f) => !f.frozen && f.role === 'hunter').length;
  let holding = 0;
  for (const f of foes) {
    if (f.frozen) { f.goal = null; continue; }
    let holds = false;
    if (f.role === 'guard') {
      if (squadUp === 1) holds = false; // lone survivor: everyone closes it out
      else if (huntersUp === 0) holds = ++holding === 1; // hunt's over: one stays home
      else holds = true;
    }
    f.goal = holds
      ? guardGoal(f, f.post, enemyGate, squad)
      : hunterGoal(f, pickTarget(f, squad), stars);
  }
}
reset();

// ---- geometry helpers (cover + line of sight) ----
function losBlocked(a, b) {
  const steps = Math.ceil(dist(a, b) / 10);
  for (let i = 1; i < steps; i++) {
    const x = a.x + (b.x - a.x) * (i / steps), y = a.y + (b.y - a.y) * (i / steps);
    for (const st of stars) { const h = st.s / 2; if (Math.abs(x - st.x) < h && Math.abs(y - st.y) < h) return true; }
  }
  return false;
}
function collideStars(b) {
  for (const st of stars) {
    const h = st.s / 2;
    const cx = Math.max(st.x - h, Math.min(b.pos.x, st.x + h)), cy = Math.max(st.y - h, Math.min(b.pos.y, st.y + h));
    const dx = b.pos.x - cx, dy = b.pos.y - cy, d2 = dx * dx + dy * dy;
    if (d2 < RAD * RAD) { const d = Math.sqrt(d2) || 0.001, nx = dx / d, ny = dy / d; b.pos.x += nx * (RAD - d); b.pos.y += ny * (RAD - d); const vn = b.vel.x * nx + b.vel.y * ny; if (vn < 0) { b.vel.x -= 1.5 * vn * nx; b.vel.y -= 1.5 * vn * ny; } }
  }
}
function nearestCover(u) {
  let best = null, bd = 1e9;
  for (const st of stars) { const d = dist(u.pos, st); if (d < bd) { bd = d; best = st; } }
  if (!best) return u.pos;
  const dir = norm(sub(u.pos, best)); // tuck against the far side from threat-ish: just hug the block
  return { x: best.x + dir.x * (best.s / 2 + 14), y: best.y + dir.y * (best.s / 2 + 14) };
}
function clampV(b) { const s = len(b.vel); if (s > MAXV) { b.vel.x *= MAXV / s; b.vel.y *= MAXV / s; } }
function shoot(from, target, team) { const d = norm(sub(target, from)); projs.push({ pos: { x: from.x, y: from.y }, prev: { x: from.x, y: from.y }, vel: { x: d.x * PROJ_V, y: d.y * PROJ_V }, team, life: 1.6 }); }

function hit(s, kind) {
  const was = s.frozen; applyFreezeHit(s, kind);
  if (s.frozen && !was) { fx.burst(s.pos.x, s.pos.y, COLORS.ice, 22, 200); fx.ring(s.pos.x, s.pos.y, COLORS.ice, 38, 0.5, 2); fx.shake(4); sfx.freeze(); if (s.team === 'blue') frost = 0.4; }
  else { fx.burst(s.pos.x, s.pos.y, COLORS.ice, 6, 120); s.flash = 0.1; sfx.hit(); }
}

function update(dt) {
  tclock += dt; sky.update(dt); fx.update(dt);
  if (frost > 0) frost = Math.max(0, frost - dt);
  [...squad, ...foes].forEach(s => s.flash = Math.max(0, s.flash - dt));

  if (V.update(input)) { reset(); input.endFrame(); return; }
  if (state !== 'play') { if (input.wasPressed('Space')) { resumeAudio(); reset(); } input.endFrame(); return; }
  if (input.pointer.down || input.keys.size) resumeAudio();

  const wego = V.is('wego');
  // ----- player command input (WeGo: only while time is frozen; orders chain) -----
  const acceptOrders = !wego || phase === 'plan';
  if (acceptOrders && input.wasClicked()) {
    const pt = { x: input.pointer.x, y: input.pointer.y };
    const pick = squad.find((u) => !u.frozen && dist(u.pos, pt) < 15);
    if (pick) { // clicking a soldier (de)selects — selection is free, orders are not
      selected = selected === pick ? null : pick;
      sfx.blip();
    } else if (wego && ordersLeft <= 0) {
      sfx.blip(); // out of comms bandwidth this turn
    } else {
      const tgtFoe = foes.find(f => !f.frozen && dist(f.pos, pt) < 22);
      const order = tgtFoe ? { type: 'attack', target: tgtFoe } : { type: 'move', target: pt };
      const recipients = selected ? [selected] : squad.filter(u => !u.frozen);
      let i = 0;
      for (const u of recipients) {
        const uo = order.type === 'move' && recipients.length > 1
          ? { type: 'move', target: { x: pt.x + (i++ - 1) * 26, y: pt.y } } : order;
        if (wego) queueOrder(u, uo);
        else issueOrder(u, uo, V.is('direct') ? 0 : ORDER_DELAY);
      }
      if (wego) ordersLeft--;
      lastOrder = { ...order, pt, t: 0.6 };
      sfx.order();
    }
  }
  if (input.wasPressed('Escape')) selected = null;
  if (selected && selected.frozen) selected = null;
  if (lastOrder) lastOrder.t -= dt;

  // ----- WeGo phase machine -----
  if (wego) {
    if (phase === 'plan') {
      if (input.wasPressed('Space')) { phase = 'exec'; execT = EXEC_LEN; planFoes(); sfx.blip(); }
      else { input.endFrame(); return; } // time stays frozen: no sim below
    } else {
      execT -= dt;
      if (execT <= 0) { phase = 'plan'; turn++; ordersLeft = ORDERS_PER_TURN; sfx.order(); input.endFrame(); return; }
    }
  }

  // ----- squad -----
  for (const u of squad) {
    if (wego) updateQueue(u); else updateOrders(u, dt);
    const underFire = projs.some((p) => p.team === 'red' && Math.hypot(p.pos.x - u.pos.x, p.pos.y - u.pos.y) < 64);
    const b = resolveBehavior(u, { underFire, coverPoint: nearestCover(u) });
    u.intent = b;
    if (b.action === 'move' && b.target) applyThrust(u, norm(sub(b.target, u.pos)), 280 * u.control, dt);
    else if (b.action === 'attack' && b.target && !b.target.frozen) {
      // advance only until the shot is there — no closing past firing range for free
      const d = dist(u.pos, b.target.pos);
      if (d > 290 || losBlocked(u.pos, b.target.pos)) applyThrust(u, norm(sub(b.target.pos, u.pos)), 260 * u.control, dt);
    } else if (b.action === 'idle' && wego && len(u.vel) > 8) {
      // station-keeping between turns: trained soldiers kill their drift while awaiting orders
      applyThrust(u, norm({ x: -u.vel.x, y: -u.vel.y }), 180 * u.control, dt);
    }
    integrate(u, dt); clampV(u); bounceWalls(u, bounds, 0.5); collideStars(u);
    pushTrail(u);
    // fire: prefer ordered attack target, else nearest visible foe
    u.fireCd = Math.max(0, u.fireCd - dt);
    if (!u.frozen && u.control > 0 && u.fireCd <= 0) {
      let tgt = (u.intent.action === 'attack' && u.intent.target && !u.intent.target.frozen) ? u.intent.target : null;
      if (!tgt) { let bd = 1e9; for (const f of foes) { if (f.frozen) continue; const d = dist(u.pos, f.pos); if (d < bd && !losBlocked(u.pos, f.pos)) { bd = d; tgt = f; } } }
      // ordered attacks shoot at full range; unordered units only defend themselves up close
      const range = u.intent.action === 'attack' ? 330 : 250;
      const dd = tgt ? dist(u.pos, tgt.pos) : Infinity;
      if (tgt && dd < range && !losBlocked(u.pos, tgt.pos)) {
        // toons execute imperfectly: same distance-scaled spread as the enemy
        const ang = Math.atan2(tgt.pos.y - u.pos.y, tgt.pos.x - u.pos.x) + (Math.random() - 0.5) * (0.06 + (dd / 340) * 0.16);
        shoot(u.pos, { x: u.pos.x + Math.cos(ang) * dd, y: u.pos.y + Math.sin(ang) * dd }, 'blue');
        u.fireCd = 0.75;
      }
    }
  }

  // ----- enemy commander: re-plans every turn (or on the same cadence in real-time) -----
  foePlanT -= dt;
  if (!wego && foePlanT <= 0) { planFoes(); foePlanT = EXEC_LEN; }
  for (const f of foes) {
    if (f.frozen) continue;
    // guards watch the gate continuously — a runner mid-turn gets intercepted, not ignored
    if (f.role === 'guard') {
      let intr = null, bd = Infinity;
      for (const s of squad) { if (s.frozen) continue; const d = dist(s.pos, enemyGate); if (d < 210 && d < bd) { bd = d; intr = s; } }
      if (intr) f.goal = { move: intr.pos, target: intr, reason: 'intercept' };
      else if (f.goal && f.goal.reason === 'intercept') f.goal = { move: f.post, target: null, reason: 'hold' };
    }
    const g = f.goal || { reason: 'idle' };
    const tgt = g.target && !g.target.frozen ? g.target : null;
    // interceptors chase the live runner; others head for their planned waypoint
    const mv = g.reason === 'intercept' && tgt ? tgt.pos : g.move;
    if (mv && dist(f.pos, mv) > 16) applyThrust(f, norm(sub(mv, f.pos)), f.role === 'guard' ? 170 : 140, dt);
    else if (tgt && losBlocked(f.pos, tgt.pos)) applyThrust(f, norm(sub(tgt.pos, f.pos)), 120, dt); // creep for a firing line
    else if (len(f.vel) > 8) applyThrust(f, norm({ x: -f.vel.x, y: -f.vel.y }), 150, dt); // settle at post
    f.fireCd = Math.max(0, f.fireCd - dt);
    if (tgt) {
      const d = dist(f.pos, tgt.pos);
      if (f.fireCd <= 0 && d < 340 && !losBlocked(f.pos, tgt.pos)) {
        // ballistic lead with distance-scaled spread: point-blank shots land,
        // long-range fire is suppressive — closing the distance is what kills
        const leadT = Math.min(0.6, d / PROJ_V);
        const lead = { x: tgt.pos.x + tgt.vel.x * leadT, y: tgt.pos.y + tgt.vel.y * leadT };
        const ang = Math.atan2(lead.y - f.pos.y, lead.x - f.pos.x) + (Math.random() - 0.5) * (0.06 + (d / 340) * 0.16);
        shoot(f.pos, { x: f.pos.x + Math.cos(ang) * d, y: f.pos.y + Math.sin(ang) * d }, 'red');
        f.fireCd = 0.85 + Math.random() * 0.4;
      }
    }
    integrate(f, dt); clampV(f); bounceWalls(f, bounds, 0.5); collideStars(f);
    pushTrail(f);
  }

  // ----- projectiles -----
  for (const p of projs) { p.prev = { x: p.pos.x, y: p.pos.y }; integrate(p, dt); p.life -= dt; }
  projs = projs.filter((p) => {
    if (p.life <= 0) return false;
    for (const st of stars) { const h = st.s / 2; if (Math.abs(p.pos.x - st.x) < h && Math.abs(p.pos.y - st.y) < h) { fx.burst(p.pos.x, p.pos.y, p.team === 'blue' ? COLORS.ice : COLORS.amber, 4, 80); return false; } }
    return true;
  });
  for (const p of projs) {
    const targets = p.team === 'blue' ? foes : squad;
    for (const s of targets) { if (s.frozen) continue; const k = projectileHits(p, s, RAD + 3); if (k) { hit(s, k); p.life = 0; break; } }
  }
  projs = projs.filter(p => p.life > 0);

  const contesting = squad.some((s) => !s.frozen && dist(s.pos, enemyGate) < enemyGate.r);
  gateT = contesting ? gateT + dt : 0;
  if (foes.every((f) => f.frozen)) end('ENEMY SQUAD NEUTRALIZED', 'win', 'all hostiles frozen');
  else if (gateT >= GATE_DWELL) end('GATE BREACHED', 'win', 'a soldier held the enemy gate');
  else if (squad.every((s) => s.frozen)) end('SQUAD LOST', 'lose', 'your whole squad is frozen');
  input.endFrame();
}

function end(m, kind, sub2) {
  if (V.is('wego') && kind === 'win') sub2 += ` · turn ${turn}`;
  state = 'over'; msg = m; window._sub = sub2; window._kind = kind; if (kind === 'win') sfx.win(); else sfx.lose();
}
function pushTrail(s) { s.trail.push({ x: s.pos.x, y: s.pos.y }); if (s.trail.length > 10) s.trail.shift(); }

// ---------- render ----------
function drawStar(st) {
  const h = st.s / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(28,64,92,0.5)'; ctx.strokeStyle = COLORS.blueDim; ctx.lineWidth = 1.5; ctx.shadowBlur = 8; ctx.shadowColor = COLORS.blueDim;
  ctx.fillRect(st.x - h, st.y - h, st.s, st.s); ctx.strokeRect(st.x - h, st.y - h, st.s, st.s);
  ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.moveTo(st.x - h, st.y - h); ctx.lineTo(st.x + h, st.y + h); ctx.moveTo(st.x + h, st.y - h); ctx.lineTo(st.x - h, st.y + h); ctx.stroke();
  ctx.restore();
}
function drawUnit(s, isSquad) {
  for (let i = 0; i < s.trail.length; i++) { const p = s.trail[i], a = i / s.trail.length; ctx.globalAlpha = a * 0.35; ctx.fillStyle = isSquad ? COLORS.blue : COLORS.red; ctx.beginPath(); ctx.arc(p.x, p.y, a * 2.6, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  const base = isSquad ? COLORS.blue : COLORS.red, col = s.flash > 0 ? '#fff' : base;

  // order legibility (squad only): pending-delay ring + intended path
  if (isSquad && !s.frozen) {
    if (V.is('wego')) {
      // the whole plan reads as a route: active order + queued orders chained
      let from = s.pos;
      const chain = [...(s.activeOrder ? [s.activeOrder] : []), ...(s.orderQueue || [])];
      chain.forEach((o, i) => {
        const tp = o.target.pos || o.target;
        const col = o.type === 'attack' ? COLORS.red : COLORS.blue;
        dashLine(from, tp, col, i === 0 ? 0.55 : 0.3);
        r.circle(tp, 3, col, { glow: 4 });
        from = tp;
      });
      if (s.intent && s.intent.reason === 'self-preservation') {
        r.text('BREAK', s.pos.x, s.pos.y - 16, COLORS.amber, 'bold 8px monospace', { align: 'center', glow: 6 });
      }
    } else if (s.pendingOrder) {
      const frac = Math.min(1, s.pendingOrder.elapsed / ORDER_DELAY);
      ctx.save(); ctx.strokeStyle = COLORS.amber; ctx.lineWidth = 2; ctx.globalAlpha = 0.9; ctx.shadowBlur = 8; ctx.shadowColor = COLORS.amber;
      ctx.beginPath(); ctx.arc(s.pos.x, s.pos.y, RAD + 6, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke(); ctx.restore(); ctx.globalAlpha = 1;
      const tp = s.pendingOrder.target.pos || s.pendingOrder.target;
      dashLine(s.pos, tp, COLORS.amber, 0.35);
    } else if (s.intent && s.intent.reason === 'self-preservation') {
      if (s.intent.target) dashLine(s.pos, s.intent.target, COLORS.amber, 0.7);
      r.text('BREAK', s.pos.x, s.pos.y - 16, COLORS.amber, 'bold 8px monospace', { align: 'center', glow: 6 });
    } else if (s.activeOrder) {
      const tp = s.activeOrder.target.pos || s.activeOrder.target;
      dashLine(s.pos, tp, s.activeOrder.type === 'attack' ? COLORS.red : COLORS.blue, 0.25);
    }
  }

  if (s.frozen) { r.circle(s.pos, RAD + 3, COLORS.ice, { fill: false, w: 2, glow: 10 }); r.circle(s.pos, RAD, base, { glow: 3 }); }
  else { if (s.control < 1) r.circle(s.pos, RAD + 4, COLORS.ice, { fill: false, w: 1, glow: 5 }); r.circle(s.pos, RAD, col, { glow: 11 }); r.circle(s.pos, RAD - 3, '#fff', { glow: 3 }); }
}
function dashLine(a, b, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([4, 5]); ctx.shadowBlur = 5; ctx.shadowColor = color;
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); ctx.globalAlpha = 1;
}
function drawGate() {
  const pulse = 1 + Math.sin(tclock * 3) * 0.06;
  r.circle(enemyGate, enemyGate.r * pulse, COLORS.amber, { fill: false, w: 2, glow: 16 });
  r.circle(enemyGate, enemyGate.r * 0.6, COLORS.amber, { fill: false, w: 1, glow: 8 });
  if (gateT > 0) { // breach progress while a soldier holds the gate
    ctx.save(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.shadowBlur = 14; ctx.shadowColor = '#ffffff';
    ctx.beginPath(); ctx.arc(enemyGate.x, enemyGate.y, enemyGate.r + 6, -Math.PI / 2, -Math.PI / 2 + (gateT / GATE_DWELL) * Math.PI * 2); ctx.stroke(); ctx.restore();
  }
}

function render() {
  r.clear(COLORS.bg);
  sky.draw(ctx);
  ctx.save(); fx.applyShake(ctx);
  drawGate();
  for (const st of stars) drawStar(st);
  // order marker flash
  if (lastOrder && lastOrder.t > 0) { ctx.globalAlpha = lastOrder.t; r.circle(lastOrder.pt, 10 + (0.6 - lastOrder.t) * 30, lastOrder.type === 'attack' ? COLORS.red : COLORS.amber, { fill: false, w: 1.5, glow: 8 }); ctx.globalAlpha = 1; }
  for (const p of projs) { const col = p.team === 'blue' ? COLORS.ice : COLORS.amber; r.line(p.prev, p.pos, col, 2.2, 9); r.circle(p.pos, 2.4, '#fff', { glow: 7 }); }
  foes.forEach(f => drawUnit(f, false)); squad.forEach(u => drawUnit(u, true));
  if (selected && !selected.frozen) {
    const pulse = RAD + 7 + Math.sin(tclock * 6) * 1.5;
    r.circle(selected.pos, pulse, COLORS.amber, { fill: false, w: 1.5, glow: 10 });
  }
  fx.draw(ctx);
  ctx.restore();

  drawFrame(ctx, W, H);
  if (frost > 0) { ctx.save(); ctx.globalAlpha = frost * 0.45; ctx.fillStyle = COLORS.ice; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // WeGo plan phase: faint ice tint sells "time frozen"
  if (V.is('wego') && state === 'play' && phase === 'plan') { ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = COLORS.ice; ctx.fillRect(0, 0, W, H); ctx.restore(); }

  // HUD
  r.text('SIM-C · FLEET COMMAND', 22, 30, COLORS.text, '12px monospace', { glow: 4 });
  ctx.globalAlpha = 0.4 + 0.3 * Math.abs(Math.sin(tclock * 1.4)); r.text('● OBSERVED', W - 104, 30, COLORS.amber, '11px monospace'); ctx.globalAlpha = 1;
  r.text('SQUAD', W / 2 - 96, 30, COLORS.text, '11px monospace');
  squad.forEach((u, i) => r.circle({ x: W / 2 - 48 + i * 15, y: 26 }, 5, u.frozen ? COLORS.ice : COLORS.blue, u.frozen ? { fill: false, w: 1.5 } : { glow: 6 }));
  r.text('HOSTILE', W / 2 + 16, 30, COLORS.text, '11px monospace');
  foes.forEach((f, i) => r.circle({ x: W / 2 + 74 + i * 15, y: 26 }, 5, f.frozen ? COLORS.ice : COLORS.red, f.frozen ? { fill: false, w: 1.5 } : { glow: 6 }));
  drawVariantHUD(r, ctx, W, H, V, COLORS.textDim);
  const hint = V.is('wego')
    ? 'click soldier: select  ·  click ground/hostile: order selected (or all)  ·  orders chain'
    : V.is('direct')
      ? 'real-time, zero comms lag — click soldier to select, ground/hostile to order'
      : 'click soldier: select  ·  click ground/hostile: order  ·  orders carry comms lag + momentum';
  r.text(hint, 22, H - 16, COLORS.textDim, '11px monospace');

  // WeGo phase banner
  if (V.is('wego') && state === 'play') {
    if (phase === 'plan') {
      ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(tclock * 2.2));
      r.text('◼ TIME FROZEN — TURN ' + turn + ' · SPACE TO EXECUTE', W / 2, H - 34, COLORS.amber, 'bold 13px monospace', { align: 'center', glow: 10 });
      ctx.globalAlpha = 1;
      // comms bandwidth pips — each order this turn spends one
      r.text('COMMS', W / 2 - 78, H - 51, COLORS.textDim, '9px monospace');
      for (let i = 0; i < ORDERS_PER_TURN; i++) {
        r.circle({ x: W / 2 - 24 + i * 16, y: H - 54 }, 4, COLORS.amber, i < ordersLeft ? { glow: 6 } : { fill: false, w: 1 });
      }
    } else {
      const bw = 220, frac = Math.max(0, execT / EXEC_LEN);
      r.text('▶ EXECUTING', W / 2, H - 40, COLORS.blue, 'bold 12px monospace', { align: 'center', glow: 8 });
      ctx.save();
      ctx.globalAlpha = 0.25; ctx.fillStyle = COLORS.blue; ctx.fillRect(W / 2 - bw / 2, H - 34, bw, 6);
      ctx.globalAlpha = 1; ctx.shadowBlur = 8; ctx.shadowColor = COLORS.blue; ctx.fillRect(W / 2 - bw / 2, H - 34, bw * frac, 6);
      ctx.restore();
    }
  }

  drawCRT(ctx, W, H, tclock);

  if (state === 'over') {
    const color = window._kind === 'win' ? COLORS.blue : COLORS.red;
    ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#02040a'; ctx.fillRect(W / 2 - 230, H / 2 - 48, 460, 86);
    ctx.globalAlpha = 0.5; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.shadowBlur = 12; ctx.shadowColor = color; ctx.strokeRect(W / 2 - 230, H / 2 - 48, 460, 86); ctx.restore();
    r.text(msg, W / 2, H / 2 - 6, color, 'bold 26px monospace', { align: 'center', glow: 16 });
    r.text(window._sub || '', W / 2, H / 2 + 18, COLORS.text, '12px monospace', { align: 'center' });
    r.text('press SPACE to redeploy', W / 2, H / 2 + 40, COLORS.textDim, '11px monospace', { align: 'center' });
  }
}

// debug/tuning hook (harmless in prod; used by headless balance sims)
window.__cmdState = () => ({
  state, msg, phase, turn, ordersLeft,
  squadUp: squad.filter(s => !s.frozen).length,
  foesUp: foes.filter(f => !f.frozen).length,
  squadPos: squad.filter(s => !s.frozen).map(s => ({ x: s.pos.x, y: s.pos.y, hp: s.integrity })),
  foePos: foes.filter(f => !f.frozen).map(f => ({ x: f.pos.x, y: f.pos.y, role: f.role })),
});

createLoop({ update, render }).start();
