import { sub, angle } from '../engine/vec.js';

// Aggressive opponent: always points straight at the enemy (over-commits, exploitable).
export function decideHeading(self, enemy) {
  return angle(sub(enemy.pos, self.pos));
}
