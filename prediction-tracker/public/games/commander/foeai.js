import { dist } from '../engine/vec.js';

// Enemy commander doctrine, re-planned each turn:
// - guards hold posts by their gate and intercept gate-runners
// - hunters advance cover-to-cover and focus the most wounded squad unit

export function pickTarget(foe, squad) {
  const alive = squad.filter((s) => !s.frozen);
  if (!alive.length) return null;
  const weakest = Math.min(...alive.map((s) => s.integrity));
  let best = null, bd = Infinity;
  for (const s of alive) {
    if (s.integrity !== weakest) continue;
    const d = dist(foe.pos, s.pos);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

export function guardGoal(foe, post, gate, squad, radius = 190) {
  let intruder = null, bd = Infinity;
  for (const s of squad) {
    if (s.frozen) continue;
    const d = dist(s.pos, gate);
    if (d < radius && d < bd) { bd = d; intruder = s; }
  }
  if (intruder) return { move: intruder.pos, target: intruder, reason: 'intercept' };
  return { move: post, target: null, reason: 'hold' };
}

// hunters trade inside the squad's self-defense range — they have the numbers
export function hunterGoal(foe, target, stars, standoff = 230) {
  if (!target) return { move: null, target: null, reason: 'idle' };
  if (dist(foe.pos, target.pos) <= standoff) return { move: null, target, reason: 'engage' };
  // advance to the cover block nearest the midpoint, hugging the side facing us
  const mid = { x: (foe.pos.x + target.pos.x) / 2, y: (foe.pos.y + target.pos.y) / 2 };
  let block = null, bd = Infinity;
  for (const st of stars) { const d = dist(st, mid); if (d < bd) { bd = d; block = st; } }
  if (!block) return { move: { x: target.pos.x, y: target.pos.y }, target, reason: 'advance' };
  const away = { x: foe.pos.x - block.x, y: foe.pos.y - block.y };
  const m = Math.hypot(away.x, away.y) || 1;
  const off = block.s / 2 + 16;
  return { move: { x: block.x + (away.x / m) * off, y: block.y + (away.y / m) * off }, target, reason: 'advance' };
}
