import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, sub, scale, len, norm, dist, fromAngle, angle, angleDiff } from './vec.js';

test('add/sub/scale', () => {
  assert.deepEqual(add({ x: 1, y: 2 }, { x: 3, y: 4 }), { x: 4, y: 6 });
  assert.deepEqual(sub({ x: 5, y: 5 }, { x: 1, y: 2 }), { x: 4, y: 3 });
  assert.deepEqual(scale({ x: 2, y: 3 }, 2), { x: 4, y: 6 });
});

test('len/dist/norm', () => {
  assert.equal(len({ x: 3, y: 4 }), 5);
  assert.equal(dist({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  const n = norm({ x: 0, y: 5 });
  assert.equal(n.x, 0);
  assert.equal(n.y, 1);
});

test('fromAngle/angle round-trip', () => {
  const a = Math.PI / 3;
  assert.ok(Math.abs(angle(fromAngle(a)) - a) < 1e-9);
});

test('angleDiff returns shortest signed difference', () => {
  assert.ok(Math.abs(angleDiff(0.1, 0.2) - 0.1) < 1e-9);
  const d = angleDiff(3.0, -3.0); // should wrap to ~+0.283, not -6
  assert.ok(Math.abs(d - 0.2831853) < 1e-4, `got ${d}`);
});
