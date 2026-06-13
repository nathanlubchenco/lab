import { sub, angle, angleDiff, dist } from '../engine/vec.js';

// Which face of `target` (facing `targetHeading`) is exposed to the attacker.
export function hitZone(attackerPos, targetPos, targetHeading) {
  const toAttacker = angle(sub(attackerPos, targetPos));
  const rel = Math.abs(angleDiff(targetHeading, toAttacker)); // 0 = attacker dead ahead
  if (rel > Math.PI * 0.75) return 'rear';
  if (rel < Math.PI * 0.25) return 'front';
  return 'flank';
}

export const DAMAGE = { rear: 100, flank: 45, front: 15 };
export function damageFor(zone) { return DAMAGE[zone]; }
export function inRange(a, b, r) { return dist(a, b) <= r; }
