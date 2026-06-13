const MAX_INTEGRITY = 3;

export function createSoldier({ pos, team }) {
  return { pos: { ...pos }, vel: { x: 0, y: 0 }, team, integrity: MAX_INTEGRITY, control: 1, frozen: false };
}

// kind: 'limb' chips away control; 'core' (central hit) freezes solid immediately.
export function applyFreezeHit(soldier, kind = 'limb') {
  if (soldier.frozen) return;
  if (kind === 'core') soldier.integrity = 0;
  else soldier.integrity = Math.max(0, soldier.integrity - 1);
  soldier.control = soldier.integrity / MAX_INTEGRITY;
  if (soldier.integrity <= 0) { soldier.frozen = true; soldier.control = 0; }
}

// Returns 'core' | 'limb' | null based on distance from the soldier center.
export function projectileHits(proj, soldier, radius = 12) {
  const d = Math.hypot(proj.pos.x - soldier.pos.x, proj.pos.y - soldier.pos.y);
  if (d > radius) return null;
  return d < radius * 0.4 ? 'core' : 'limb';
}
