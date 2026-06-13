// Fixed-timestep loop. update(dt) gets dt in seconds; render(alpha) for interpolation.
export function createLoop({ update, render, stepMs = 1000 / 60 }) {
  let raf = null, last = 0, acc = 0, running = false;
  function frame(now) {
    if (!running) return;
    acc += now - last;
    last = now;
    if (acc > 250) acc = 250; // avoid spiral of death after tab blur
    while (acc >= stepMs) { update(stepMs / 1000); acc -= stepMs; }
    render(acc / stepMs);
    raf = requestAnimationFrame(frame);
  }
  return {
    start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); }
  };
}
