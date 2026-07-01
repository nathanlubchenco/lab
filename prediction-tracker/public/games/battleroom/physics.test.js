import { test } from 'node:test';
import assert from 'node:assert/strict';
import { integrate, applyThrust, applyImpulse, bounceWalls } from './physics.js';

test('applyImpulse kicks velocity instantly, independent of dt', () => {
  const b = { pos: { x: 0, y: 0 }, vel: { x: 5, y: 0 } };
  applyImpulse(b, { x: -1, y: 0 }, 20); // e.g. shot recoil opposite the aim
  assert.deepEqual(b.vel, { x: -15, y: 0 });
});

test('integrate moves by vel*dt and keeps velocity (no friction)', () => {
  const b = { pos: { x: 0, y: 0 }, vel: { x: 10, y: 0 } };
  integrate(b, 0.5);
  assert.deepEqual(b.pos, { x: 5, y: 0 });
  assert.deepEqual(b.vel, { x: 10, y: 0 });
});

test('applyThrust accelerates velocity', () => {
  const b = { pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 } };
  applyThrust(b, { x: 1, y: 0 }, 100, 0.1);
  assert.ok(Math.abs(b.vel.x - 10) < 1e-9);
});

test('bounceWalls clamps position and reflects velocity', () => {
  const b = { pos: { x: -5, y: 5 }, vel: { x: -10, y: 0 } };
  const bounced = bounceWalls(b, { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } }, 0.5);
  assert.equal(bounced, true);
  assert.equal(b.pos.x, 0);
  assert.ok(b.vel.x > 0);
});
