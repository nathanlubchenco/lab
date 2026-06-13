import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hitZone, damageFor } from './combat.js';

// target at origin facing +x (heading 0)
test('attacker behind target = rear', () => { assert.equal(hitZone({ x: -10, y: 0 }, { x: 0, y: 0 }, 0), 'rear'); });
test('attacker ahead of target = front', () => { assert.equal(hitZone({ x: 10, y: 0 }, { x: 0, y: 0 }, 0), 'front'); });
test('attacker to the side = flank', () => { assert.equal(hitZone({ x: 0, y: 10 }, { x: 0, y: 0 }, 0), 'flank'); });
test('damage ordering rear > flank > front', () => {
  assert.ok(damageFor('rear') > damageFor('flank'));
  assert.ok(damageFor('flank') > damageFor('front'));
});
