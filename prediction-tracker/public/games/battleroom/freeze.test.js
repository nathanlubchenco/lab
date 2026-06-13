import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSoldier, applyFreezeHit, projectileHits } from './freeze.js';

test('limb hits reduce control then freeze on the third', () => {
  const s = createSoldier({ pos: { x: 0, y: 0 }, team: 'red' });
  applyFreezeHit(s, 'limb'); assert.ok(s.control < 1 && !s.frozen);
  applyFreezeHit(s, 'limb'); assert.ok(!s.frozen);
  applyFreezeHit(s, 'limb'); assert.equal(s.frozen, true);
});

test('core hit freezes instantly', () => {
  const s = createSoldier({ pos: { x: 0, y: 0 }, team: 'red' });
  applyFreezeHit(s, 'core');
  assert.equal(s.frozen, true);
});

test('projectileHits classifies center vs edge vs miss', () => {
  const s = createSoldier({ pos: { x: 0, y: 0 }, team: 'red' });
  assert.equal(projectileHits({ pos: { x: 0, y: 0 } }, s, 12), 'core');
  assert.equal(projectileHits({ pos: { x: 9, y: 0 } }, s, 12), 'limb');
  assert.equal(projectileHits({ pos: { x: 50, y: 0 } }, s, 12), null);
});
