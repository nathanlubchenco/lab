import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anchorNear, launch, grab, collideBodies, snapPoint, LAUNCH_SPEED } from './locomotion.js';

const bounds = { min: { x: 16, y: 16 }, max: { x: 704, y: 544 } };
const soldier = (x, y, extra = {}) => ({ pos: { x, y }, vel: { x: 0, y: 0 }, frozen: false, drifting: false, ...extra });

test('anchorNear: wall, star, and body all count; open space does not', () => {
  assert.equal(anchorNear(soldier(30, 300), { bounds }).type, 'wall');
  assert.equal(anchorNear(soldier(300, 300), { bounds }), null);
  const star = { x: 300, y: 300, s: 50 };
  assert.equal(anchorNear(soldier(300, 340), { bounds, stars: [star] }).type, 'star');
  const buddy = soldier(300, 300);
  assert.equal(anchorNear(soldier(315, 300), { bounds, bodies: [buddy] }).type, 'body');
});

test('launch sets a straight drift; pushing off a body shoves it the other way', () => {
  const u = soldier(100, 100);
  const b = soldier(110, 100);
  launch(u, { x: 500, y: 100 }, { type: 'body', body: b });
  assert.ok(Math.abs(u.vel.x - LAUNCH_SPEED) < 1e-9);
  assert.equal(u.drifting, true);
  assert.ok(b.vel.x < 0, 'anchor body recoils backward');
  assert.equal(b.drifting, true);
});

test('grab stops a drifter but frozen soldiers cannot grab', () => {
  const u = soldier(0, 0, { vel: { x: 50, y: 0 }, drifting: true });
  assert.equal(grab(u), true);
  assert.deepEqual(u.vel, { x: 0, y: 0 });
  const f = soldier(0, 0, { vel: { x: 50, y: 0 }, drifting: true, frozen: true });
  assert.equal(grab(f), false);
  assert.equal(f.vel.x, 50);
});

test('collideBodies transfers momentum and knocks both loose', () => {
  const mover = soldier(100, 100, { vel: { x: 100, y: 0 }, drifting: true });
  const still = soldier(112, 100);
  collideBodies([mover, still]);
  assert.ok(still.vel.x > 0, 'anchored soldier gets shoved');
  assert.ok(mover.vel.x < 100, 'mover slows');
  assert.equal(still.drifting, true);
});

test('snapPoint pulls waypoints onto nearby surfaces, leaves deep space alone', () => {
  const star = { x: 300, y: 300, s: 50 };
  const snapped = snapPoint({ x: 300, y: 350 }, { bounds, stars: [star] });
  assert.ok(Math.abs(snapped.y - (300 + 25 + 9 + 2)) < 1e-9, 'snaps to the bottom face of the block');
  const wall = snapPoint({ x: 30, y: 300 }, { bounds, stars: [star] });
  assert.equal(wall.x, bounds.min.x + 9);
  const open = snapPoint({ x: 360, y: 450 }, { bounds, stars: [star] });
  assert.deepEqual(open, { x: 360, y: 450 });
});
