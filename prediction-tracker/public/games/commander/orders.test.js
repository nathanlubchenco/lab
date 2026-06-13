import { test } from 'node:test';
import assert from 'node:assert/strict';
import { issueOrder, updateOrders, resolveBehavior, ORDER_DELAY } from './orders.js';

test('order activates only after the registration delay', () => {
  const u = { control: 1, frozen: false };
  issueOrder(u, { type: 'move', target: { x: 5, y: 5 } });
  updateOrders(u, ORDER_DELAY * 0.5);
  assert.equal(u.activeOrder, null);
  updateOrders(u, ORDER_DELAY); // total now past the delay
  assert.equal(u.activeOrder.type, 'move');
});

test('frozen unit resolves to idle regardless of orders', () => {
  const u = { control: 0, frozen: true, activeOrder: { type: 'move', target: { x: 1, y: 1 } } };
  assert.equal(resolveBehavior(u, {}).action, 'idle');
});

test('a damaged unit under fire overrides its order to seek cover', () => {
  const u = { control: 0.5, frozen: false, activeOrder: { type: 'move', target: { x: 9, y: 9 } } };
  const b = resolveBehavior(u, { underFire: true, coverPoint: { x: 1, y: 1 } });
  assert.equal(b.action, 'move');
  assert.deepEqual(b.target, { x: 1, y: 1 });
  assert.equal(b.reason, 'self-preservation');
});
