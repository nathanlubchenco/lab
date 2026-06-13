import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideHeading } from './ai.js';

test('AI steers its heading toward the enemy', () => {
  const self = { pos: { x: 0, y: 0 } };
  assert.ok(Math.abs(decideHeading(self, { pos: { x: 10, y: 0 } }) - 0) < 1e-9);
  assert.ok(Math.abs(decideHeading(self, { pos: { x: 0, y: 10 } }) - Math.PI / 2) < 1e-9);
});
