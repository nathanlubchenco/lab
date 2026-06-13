export const ORDER_DELAY = 0.45; // s before an issued order registers (comms lag)

export function issueOrder(unit, order) {
  unit.pendingOrder = { type: order.type, target: order.target, elapsed: 0 };
  if (unit.activeOrder === undefined) unit.activeOrder = null;
}

export function updateOrders(unit, dt) {
  const p = unit.pendingOrder;
  if (!p) return;
  p.elapsed += dt;
  if (p.elapsed >= ORDER_DELAY) { unit.activeOrder = { type: p.type, target: p.target }; unit.pendingOrder = null; }
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
