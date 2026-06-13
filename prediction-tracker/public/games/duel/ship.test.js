import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShip, setDesiredHeading, boost, stepShip, LOCK_DURATION } from './ship.js';

test('small heading change does not commit/lock', () => {
  const s = createShip({ pos: { x: 0, y: 0 }, heading: 0 });
  assert.equal(setDesiredHeading(s, 0.2), true);
  assert.equal(s.lockTimer, 0);
});

test('hard turn commits and rejects new orders until lock expires', () => {
  const s = createShip({ pos: { x: 0, y: 0 }, heading: 0 });
  setDesiredHeading(s, Math.PI); // 180 deg = hard turn
  assert.ok(s.lockTimer > 0);
  assert.equal(setDesiredHeading(s, 0), false); // ignored while committed
  for (let i = 0; i < 40; i++) stepShip(s, LOCK_DURATION / 20); // run past the lock
  assert.equal(s.lockTimer, 0);
  assert.equal(setDesiredHeading(s, 0.5), true); // accepted again
});

test('stepShip turns toward desired by at most turnRate*dt', () => {
  const s = createShip({ pos: { x: 0, y: 0 }, heading: 0, turnRate: 2 });
  s.desired = 1; // small enough to not have triggered a lock
  stepShip(s, 0.1); // max turn this tick = 0.2
  assert.ok(Math.abs(s.heading - 0.2) < 1e-9);
});

test('boost sets lock and increases distance traveled', () => {
  const a = createShip({ pos: { x: 0, y: 0 }, heading: 0, turnRate: 2 });
  const b = createShip({ pos: { x: 0, y: 0 }, heading: 0, turnRate: 2 });
  assert.equal(boost(b), true);
  assert.ok(b.lockTimer > 0);
  stepShip(a, 0.1); stepShip(b, 0.1);
  assert.ok(b.pos.x > a.pos.x);
});
