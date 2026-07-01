import { dist } from '../engine/vec.js';

export const ORDER_DELAY = 0.45; // s before an issued order registers (comms lag)
const ARRIVE = 20; // px: a move order counts as completed inside this radius

export function issueOrder(unit, order, delay = ORDER_DELAY) {
  unit.pendingOrder = { type: order.type, target: order.target, elapsed: 0, delay };
  if (unit.activeOrder === undefined) unit.activeOrder = null;
}

export function updateOrders(unit, dt) {
  const p = unit.pendingOrder;
  if (!p) return;
  p.elapsed += dt;
  if (p.elapsed >= (p.delay ?? ORDER_DELAY)) { unit.activeOrder = { type: p.type, target: p.target }; unit.pendingOrder = null; }
}

// WeGo planning: orders chain instead of replacing — queue in the plan phase,
// the unit works through them during execution.
export function queueOrder(unit, order) {
  if (!unit.orderQueue) unit.orderQueue = [];
  unit.orderQueue.push({ type: order.type, target: order.target });
}

export function clearOrders(unit) {
  unit.orderQueue = [];
  unit.activeOrder = null;
  unit.pendingOrder = null;
}

// Completes the active order (move: arrived; attack: target frozen) and pulls the next
// one off the queue. Returns the order the unit should act on this tick.
export function updateQueue(unit) {
  const q = unit.orderQueue || (unit.orderQueue = []);
  const a = unit.activeOrder;
  const done = a && (
    (a.type === 'move' && dist(unit.pos, a.target) < ARRIVE) ||
    (a.type === 'attack' && a.target.frozen)
  );
  if (done) unit.activeOrder = null;
  if (!unit.activeOrder && q.length) unit.activeOrder = q.shift();
  return unit.activeOrder;
}

// What the unit actually intends this tick — orders are obeyed imperfectly.
export function resolveBehavior(unit, ctx) {
  if (unit.frozen || unit.control <= 0) return { action: 'idle' };
  if (ctx.underFire && unit.control < 1 && ctx.coverPoint) {
    return { action: 'move', target: ctx.coverPoint, reason: 'self-preservation' };
  }
  if (unit.activeOrder) return { action: unit.activeOrder.type, target: unit.activeOrder.target };
  return { action: 'idle' };
}
