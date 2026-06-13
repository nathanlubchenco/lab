export const v = (x = 0, y = 0) => ({ x, y });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a, s) => ({ x: a.x * s, y: a.y * s });
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const len = (a) => Math.hypot(a.x, a.y);
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const norm = (a) => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };
export const fromAngle = (r, m = 1) => ({ x: Math.cos(r) * m, y: Math.sin(r) * m });
export const angle = (a) => Math.atan2(a.y, a.x);
export const limit = (a, max) => { const l = len(a); return l > max ? scale(a, max / l) : a; };

// shortest signed angular difference from a to b, in (-PI, PI]
export const angleDiff = (a, b) => {
  let d = (b - a) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return d;
};
