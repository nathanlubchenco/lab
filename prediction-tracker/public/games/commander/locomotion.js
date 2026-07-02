import { dist, norm, sub, scale } from '../engine/vec.js';

// Book-rules zero-G: a soldier can only change course by pushing off something —
// a wall, a star block, or another body. Mid-drift you are committed.

export const ANCHOR_PAD = 12; // how close counts as "touching" a surface
export const LAUNCH_SPEED = 230;

// What (if anything) the unit can push off right now.
export function anchorNear(unit, { bounds, stars = [], bodies = [] }, rad = 9) {
  const p = unit.pos;
  const reach = rad + ANCHOR_PAD;
  if (bounds) {
    if (p.x - bounds.min.x < reach || bounds.max.x - p.x < reach ||
        p.y - bounds.min.y < reach || bounds.max.y - p.y < reach) return { type: 'wall' };
  }
  for (const st of stars) {
    const h = st.s / 2;
    const dx = Math.max(Math.abs(p.x - st.x) - h, 0);
    const dy = Math.max(Math.abs(p.y - st.y) - h, 0);
    if (Math.hypot(dx, dy) < reach) return { type: 'star', star: st };
  }
  for (const b of bodies) {
    if (b === unit) continue;
    if (dist(p, b.pos) < rad * 2 + ANCHOR_PAD) return { type: 'body', body: b };
  }
  return null;
}

// Push off the anchor toward a target. Newton: pushing off a floating body
// shoves it the other way (and knocks it off whatever it was holding).
export function launch(unit, target, anchor, speed = LAUNCH_SPEED) {
  const dir = norm(sub(target, unit.pos));
  unit.vel = scale(dir, speed);
  unit.drifting = true;
  if (anchor && anchor.type === 'body') {
    const b = anchor.body;
    b.vel = { x: b.vel.x - dir.x * 90, y: b.vel.y - dir.y * 90 };
    b.drifting = true;
  }
  return unit;
}

// A drifting soldier grabs hold and stops. Frozen soldiers can't grab.
export function grab(unit) {
  if (unit.frozen) return false;
  unit.vel = { x: 0, y: 0 };
  unit.drifting = false;
  return true;
}

// Pairwise soldier collisions: overlapping bodies separate and swap momentum
// along the contact normal — a moving soldier can knock an anchored one loose.
export function collideBodies(list, rad = 9, restitution = 0.6) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const dx = b.pos.x - a.pos.x, dy = b.pos.y - a.pos.y;
      const d = Math.hypot(dx, dy);
      if (d === 0 || d >= rad * 2) continue;
      const nx = dx / d, ny = dy / d, ov = (rad * 2 - d) / 2;
      a.pos.x -= nx * ov; a.pos.y -= ny * ov;
      b.pos.x += nx * ov; b.pos.y += ny * ov;
      const rel = (b.vel.x - a.vel.x) * nx + (b.vel.y - a.vel.y) * ny;
      if (rel < 0) {
        const imp = -(1 + restitution) * rel / 2;
        a.vel.x -= imp * nx; a.vel.y -= imp * ny;
        b.vel.x += imp * nx; b.vel.y += imp * ny;
        a.drifting = true; b.drifting = true;
      }
    }
  }
}

// Snap an order waypoint to the nearest push-off surface (wall or block edge)
// within `range`, so plans read as hop routes between real anchors.
export function snapPoint(pt, { bounds, stars = [] }, range = 70, rad = 9) {
  let best = null, bd = range;
  if (bounds) {
    const cand = [
      { x: bounds.min.x + rad, y: pt.y }, { x: bounds.max.x - rad, y: pt.y },
      { x: pt.x, y: bounds.min.y + rad }, { x: pt.x, y: bounds.max.y - rad },
    ];
    for (const c of cand) { const d = dist(pt, c); if (d < bd) { bd = d; best = c; } }
  }
  for (const st of stars) {
    const h = st.s / 2 + rad + 2;
    const c = {
      x: Math.max(st.x - h, Math.min(pt.x, st.x + h)),
      y: Math.max(st.y - h, Math.min(pt.y, st.y + h)),
    };
    // clamp inside the expanded rect projects to the nearest face
    if (Math.abs(c.x - st.x) < h && Math.abs(c.y - st.y) < h) {
      const px = h - Math.abs(c.x - st.x), py = h - Math.abs(c.y - st.y);
      if (px < py) c.x = st.x + Math.sign(c.x - st.x || 1) * h;
      else c.y = st.y + Math.sign(c.y - st.y || 1) * h;
    }
    const d = dist(pt, c);
    if (d < bd) { bd = d; best = c; }
  }
  return best || { x: pt.x, y: pt.y };
}
