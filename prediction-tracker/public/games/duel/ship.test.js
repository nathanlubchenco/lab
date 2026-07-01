import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShip, setDesiredHeading, boost, lunge, stepShip, LOCK_DURATION, LUNGE_DURATION, LUNGE_COOLDOWN } from './ship.js';

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

test('commitOnTurn=false: hard turns never lock steering', () => {
  const s = createShip({ pos: { x: 0, y: 0 }, heading: 0, commitOnTurn: false });
  assert.equal(setDesiredHeading(s, Math.PI), true);
  assert.equal(s.lockTimer, 0);
  assert.equal(setDesiredHeading(s, -Math.PI / 2), true); // still responsive
});

test('lunge commits harder than boost and respects cooldown', () => {
  const b = createShip({ pos: { x: 0, y: 0 }, heading: 0, commitOnTurn: false });
  const l = createShip({ pos: { x: 0, y: 0 }, heading: 0, commitOnTurn: false });
  boost(b); assert.equal(lunge(l), true);
  assert.ok(l.lockTimer > 0);
  assert.equal(setDesiredHeading(l, Math.PI), false); // committed: steering rejected
  stepShip(b, 0.1); stepShip(l, 0.1);
  assert.ok(l.pos.x > b.pos.x); // lunge outruns boost
  for (let i = 0; i < 10; i++) stepShip(l, LUNGE_DURATION / 10); // lock over, cooldown not
  assert.equal(l.lockTimer, 0);
  assert.equal(lunge(l), false); // still on cooldown
  for (let i = 0; i < 20; i++) stepShip(l, LUNGE_COOLDOWN / 10);
  assert.equal(lunge(l), true);
});

test('boost sets lock and increases distance traveled', () => {
  const a = createShip({ pos: { x: 0, y: 0 }, heading: 0, turnRate: 2 });
  const b = createShip({ pos: { x: 0, y: 0 }, heading: 0, turnRate: 2 });
  assert.equal(boost(b), true);
  assert.ok(b.lockTimer > 0);
  stepShip(a, 0.1); stepShip(b, 0.1);
  assert.ok(b.pos.x > a.pos.x);
});
