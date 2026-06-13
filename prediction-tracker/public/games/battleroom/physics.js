export function integrate(body, dt) {
  body.pos = { x: body.pos.x + body.vel.x * dt, y: body.pos.y + body.vel.y * dt };
  return body;
}

export function applyThrust(body, dir, accel, dt) {
  body.vel = { x: body.vel.x + dir.x * accel * dt, y: body.vel.y + dir.y * accel * dt };
  return body;
}

export function bounceWalls(body, bounds, restitution = 0.6) {
  let bounced = false;
  if (body.pos.x < bounds.min.x) { body.pos.x = bounds.min.x; body.vel.x = Math.abs(body.vel.x) * restitution; bounced = true; }
  if (body.pos.x > bounds.max.x) { body.pos.x = bounds.max.x; body.vel.x = -Math.abs(body.vel.x) * restitution; bounced = true; }
  if (body.pos.y < bounds.min.y) { body.pos.y = bounds.min.y; body.vel.y = Math.abs(body.vel.y) * restitution; bounced = true; }
  if (body.pos.y > bounds.max.y) { body.pos.y = bounds.max.y; body.vel.y = -Math.abs(body.vel.y) * restitution; bounced = true; }
  return bounced;
}
