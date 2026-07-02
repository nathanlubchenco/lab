import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickTarget, guardGoal, hunterGoal } from './foeai.js';

const at = (x, y, extra = {}) => ({ pos: { x, y }, frozen: false, integrity: 3, ...extra });

test('pickTarget focuses the most wounded squad unit, nearest first on ties', () => {
  const foe = at(0, 0);
  const healthy = at(10, 0);
  const woundedFar = at(300, 0, { integrity: 1 });
  const woundedNear = at(100, 0, { integrity: 1 });
  assert.equal(pickTarget(foe, [healthy, woundedFar, woundedNear]), woundedNear);
  assert.equal(pickTarget(foe, [at(5, 5, { frozen: true })]), null);
});

test('pickTarget with nearest targeting ignores wounds and takes proximity', () => {
  const foe = at(0, 0);
  const healthyNear = at(10, 0);
  const woundedFar = at(300, 0, { integrity: 1 });
  assert.equal(pickTarget(foe, [healthyNear, woundedFar], 'nearest'), healthyNear);
});

test('guard holds post until a squad unit nears the gate, then intercepts', () => {
  const gate = { x: 0, y: 0 };
  const post = { x: 40, y: 40 };
  const foe = at(50, 50);
  const far = at(500, 500);
  assert.deepEqual(guardGoal(foe, post, gate, [far]).reason, 'hold');
  const runner = at(120, 0);
  const g = guardGoal(foe, post, gate, [far, runner]);
  assert.equal(g.reason, 'intercept');
  assert.equal(g.target, runner);
});

test('hunter engages inside standoff, otherwise advances to cover toward the target', () => {
  const target = at(200, 0);
  assert.equal(hunterGoal(at(100, 0), target, []).reason, 'engage');
  const farFoe = at(600, 0);
  const block = { x: 400, y: 0, s: 40 };
  const g = hunterGoal(farFoe, target, [block]);
  assert.equal(g.reason, 'advance');
  assert.ok(g.move.x > 400, 'waypoint hugs the side of the block facing the foe');
  assert.ok(Math.abs(g.move.x - 400) <= 40, 'waypoint stays adjacent to the block');
});
