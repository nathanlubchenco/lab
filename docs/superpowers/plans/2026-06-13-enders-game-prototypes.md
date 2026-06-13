# Ender's Game Mini-Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three small single-player browser games (A · Light Duel, B · Battle Room, C · Commander) inspired by *Ender's Game*, sharing one engine, deployed as static files under `prediction-tracker/public/games/`.

**Architecture:** Vanilla JS ES modules + HTML5 Canvas 2D, no framework/bundler. Pure-logic modules (vector math, ship commitment-lag, hit zones, zero-G physics, freeze state, order latency) are unit-tested with Node's built-in test runner. Browser glue (loop, input, renderer, per-game wiring, HTML) is verified by `node --check` syntax checks plus manual playtest in the Next dev server.

**Tech Stack:** Node 22 (`node:test`/`node:assert`), HTML5 Canvas, ES modules. A scoped `public/games/package.json` with `{"type":"module"}` makes Node treat the files as ESM without affecting the Next build.

**Conventions for the whole plan:**
- **All shell commands run from `prediction-tracker/`** unless stated otherwise.
- Vectors are plain `{x, y}` objects.
- Test files sit next to the module they test, named `*.test.js`.
- Manual playtest = run `npm run dev` and open `http://localhost:3000/games/...`. (ES module imports need a server; opening files via `file://` will fail CORS.)

---

## File Structure

```
prediction-tracker/public/games/
  package.json            # {"type":"module"} — scopes ESM for Node test runner
  index.html              # hub linking the three games
  engine/
    vec.js  vec.test.js   # pure 2D vector math
    loop.js               # fixed-timestep game loop (browser)
    input.js              # keyboard + pointer state (browser)
    renderer.js           # canvas draw helpers (browser)
  duel/                   # Game A
    index.html
    ship.js  ship.test.js     # commitment-lag state machine (pure)
    combat.js combat.test.js  # rear/flank/front hit zones (pure)
    ai.js   ai.test.js        # opponent heading decision (pure)
    duel.js                   # browser wiring
  battleroom/             # Game B
    index.html
    physics.js physics.test.js  # zero-G integrate / thrust / wall bounce (pure)
    freeze.js  freeze.test.js   # soldier freeze state + projectile hit (pure)
    battleroom.js               # browser wiring
  commander/              # Game C (reuses battleroom physics + freeze)
    index.html
    orders.js orders.test.js    # order latency + obedience (pure)
    commander.js                # browser wiring
```

---

## Phase 0 — Scaffolding & Engine

### Task 0: Scaffolding

**Files:**
- Create: `prediction-tracker/public/games/package.json`

- [ ] **Step 1: Create the directory structure**

Run (from `prediction-tracker/`):
```bash
mkdir -p public/games/engine public/games/duel public/games/battleroom public/games/commander
```

- [ ] **Step 2: Create the ESM-scoping package.json**

Create `public/games/package.json`:
```json
{
  "name": "ender-games",
  "private": true,
  "type": "module"
}
```

- [ ] **Step 3: Verify Node treats this dir as ESM**

Run:
```bash
node --input-type=module -e "import('node:test').then(()=>console.log('esm ok'))"
```
Expected: prints `esm ok` (sanity check that the runner is available).

- [ ] **Step 4: Commit**

```bash
git add public/games/package.json
git commit -m "chore(games): scaffold ender-games directory + ESM scope"
```

---

### Task 1: Vector math (`engine/vec.js`)

**Files:**
- Create: `public/games/engine/vec.js`
- Test: `public/games/engine/vec.test.js`

- [ ] **Step 1: Write the failing test**

Create `public/games/engine/vec.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { add, sub, scale, len, norm, dist, fromAngle, angle, angleDiff } from './vec.js';

test('add/sub/scale', () => {
  assert.deepEqual(add({ x: 1, y: 2 }, { x: 3, y: 4 }), { x: 4, y: 6 });
  assert.deepEqual(sub({ x: 5, y: 5 }, { x: 1, y: 2 }), { x: 4, y: 3 });
  assert.deepEqual(scale({ x: 2, y: 3 }, 2), { x: 4, y: 6 });
});

test('len/dist/norm', () => {
  assert.equal(len({ x: 3, y: 4 }), 5);
  assert.equal(dist({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  const n = norm({ x: 0, y: 5 });
  assert.equal(n.x, 0);
  assert.equal(n.y, 1);
});

test('fromAngle/angle round-trip', () => {
  const a = Math.PI / 3;
  assert.ok(Math.abs(angle(fromAngle(a)) - a) < 1e-9);
});

test('angleDiff returns shortest signed difference', () => {
  assert.ok(Math.abs(angleDiff(0.1, 0.2) - 0.1) < 1e-9);
  const d = angleDiff(3.0, -3.0); // should wrap to ~+0.283, not -6
  assert.ok(Math.abs(d - 0.2831853) < 1e-4, `got ${d}`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test public/games/engine/vec.test.js`
Expected: FAIL — cannot resolve `./vec.js` / functions not defined.

- [ ] **Step 3: Write minimal implementation**

Create `public/games/engine/vec.js`:
```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test public/games/engine/vec.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/engine/vec.js public/games/engine/vec.test.js
git commit -m "feat(games): add engine vector math with tests"
```

---

### Task 2: Browser engine glue (`loop.js`, `input.js`, `renderer.js`)

These touch the DOM and are not unit-tested; verify with `node --check` (syntax) now, exercised live in Task A4.

**Files:**
- Create: `public/games/engine/loop.js`, `public/games/engine/input.js`, `public/games/engine/renderer.js`

- [ ] **Step 1: Write `loop.js`**

Create `public/games/engine/loop.js`:
```js
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
```

- [ ] **Step 2: Write `input.js`**

Create `public/games/engine/input.js`:
```js
// Keyboard (held set + per-frame edge) and pointer position/down state.
export function createInput(target = window, canvas = null) {
  const keys = new Set();
  const pressed = new Set();
  const pointer = { x: 0, y: 0, down: false };

  target.addEventListener('keydown', (e) => { if (!keys.has(e.code)) pressed.add(e.code); keys.add(e.code); });
  target.addEventListener('keyup', (e) => keys.delete(e.code));

  if (canvas) {
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) * (canvas.width / r.width);
      pointer.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', () => { pointer.down = true; });
    window.addEventListener('mouseup', () => { pointer.down = false; });
  }

  return {
    keys, pointer,
    wasPressed(code) { return pressed.has(code); },
    endFrame() { pressed.clear(); }
  };
}
```

- [ ] **Step 3: Write `renderer.js`**

Create `public/games/engine/renderer.js`:
```js
// Thin Canvas2D wrapper with primitive helpers. Points are {x, y}.
export function createRenderer(canvas, width, height) {
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  return {
    ctx, width, height,
    clear(color = '#03070d') { ctx.fillStyle = color; ctx.fillRect(0, 0, width, height); },
    line(a, b, color = '#fff', w = 1) {
      ctx.strokeStyle = color; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    },
    poly(points, color = '#fff', { fill = true, w = 1 } = {}) {
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); }
    },
    circle(c, r, color = '#fff', { fill = true, w = 1 } = {}) {
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = color; ctx.fill(); } else { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); }
    },
    text(str, x, y, color = '#9fb6d6', font = '14px monospace') { ctx.fillStyle = color; ctx.font = font; ctx.fillText(str, x, y); }
  };
}
```

- [ ] **Step 4: Syntax-check all three**

Run:
```bash
node --check public/games/engine/loop.js && node --check public/games/engine/input.js && node --check public/games/engine/renderer.js && echo OK
```
Expected: prints `OK` (no syntax errors).

- [ ] **Step 5: Commit**

```bash
git add public/games/engine/loop.js public/games/engine/input.js public/games/engine/renderer.js
git commit -m "feat(games): add engine loop, input, and renderer"
```

---

## Phase 1 — Game A · Light Duel

### Task A1: Ship commitment-lag state machine (`duel/ship.js`)

**Files:**
- Create: `public/games/duel/ship.js`
- Test: `public/games/duel/ship.test.js`

- [ ] **Step 1: Write the failing test**

Create `public/games/duel/ship.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShip, setDesiredHeading, boost, stepShip, LOCK_DURATION } from './ship.js';

test('small heading change does not commit/lock', () => {
  const s = createShip({ pos: { x: 0, y: 0 }, heading: 0 });
  assert.equal(setDesiredHeading(s, 0.2), true);
  assert.equal(s.lockTimer, 0);
});

test('hard turn commits and rejects new orders until lock expires', () => {
  const s = createShip({ pos: { x: 0, y: 0 }, heading: 0 });
  setDesiredHeading(s, Math.PI); // 180 deg = hard turn
  assert.ok(s.lockTimer > 0);
  assert.equal(setDesiredHeading(s, 0), false); // ignored while committed
  for (let i = 0; i < 40; i++) stepShip(s, LOCK_DURATION / 20); // run past the lock
  assert.equal(s.lockTimer, 0);
  assert.equal(setDesiredHeading(s, 0.5), true); // accepted again
});

test('stepShip turns toward desired by at most turnRate*dt', () => {
  const s = createShip({ pos: { x: 0, y: 0 }, heading: 0, turnRate: 2 });
  s.desired = 1; // small enough to not have triggered a lock
  stepShip(s, 0.1); // max turn this tick = 0.2
  assert.ok(Math.abs(s.heading - 0.2) < 1e-9);
});

test('boost sets lock and increases distance traveled', () => {
  const a = createShip({ pos: { x: 0, y: 0 }, heading: 0, turnRate: 2 });
  const b = createShip({ pos: { x: 0, y: 0 }, heading: 0, turnRate: 2 });
  assert.equal(boost(b), true);
  assert.ok(b.lockTimer > 0);
  stepShip(a, 0.1); stepShip(b, 0.1);
  assert.ok(b.pos.x > a.pos.x);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test public/games/duel/ship.test.js`
Expected: FAIL — `./ship.js` not found.

- [ ] **Step 3: Write minimal implementation**

Create `public/games/duel/ship.js`:
```js
import { fromAngle, add, scale, angleDiff } from '../engine/vec.js';

const HARD_TURN = 1.2;          // rad: a desired-heading change bigger than this commits you
export const LOCK_DURATION = 0.35; // s: committed window after a hard turn
const BOOST_MULT = 1.8;
export const BOOST_LOCK = 0.5;  // s: committed window after a boost

export function createShip({ pos, heading = 0, speed = 160, turnRate = 3.2, color = '#36e0ff' }) {
  return { pos: { ...pos }, heading, desired: heading, speed, turnRate, color, lockTimer: 0, boosting: 0, alive: true };
}

// Returns false if the order is rejected because the ship is committed (locked).
export function setDesiredHeading(ship, rad) {
  if (ship.lockTimer > 0) return false;
  const delta = Math.abs(angleDiff(ship.heading, rad));
  ship.desired = rad;
  if (delta > HARD_TURN) ship.lockTimer = LOCK_DURATION; // a hard turn commits you
  return true;
}

export function boost(ship) {
  if (ship.lockTimer > 0) return false;
  ship.lockTimer = BOOST_LOCK;
  ship.boosting = BOOST_LOCK;
  return true;
}

// Always executes toward the (committed) desired heading; only NEW orders are gated by lock.
export function stepShip(ship, dt) {
  ship.lockTimer = Math.max(0, ship.lockTimer - dt);
  const d = angleDiff(ship.heading, ship.desired);
  const max = ship.turnRate * dt;
  ship.heading += Math.max(-max, Math.min(max, d));
  let spd = ship.speed;
  if (ship.boosting > 0) { spd *= BOOST_MULT; ship.boosting = Math.max(0, ship.boosting - dt); }
  ship.pos = add(ship.pos, scale(fromAngle(ship.heading), spd * dt));
  return ship;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test public/games/duel/ship.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/duel/ship.js public/games/duel/ship.test.js
git commit -m "feat(duel): add ship commitment-lag state machine with tests"
```

---

### Task A2: Hit zones (`duel/combat.js`)

**Files:**
- Create: `public/games/duel/combat.js`
- Test: `public/games/duel/combat.test.js`

- [ ] **Step 1: Write the failing test**

Create `public/games/duel/combat.test.js`:
```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test public/games/duel/combat.test.js`
Expected: FAIL — `./combat.js` not found.

- [ ] **Step 3: Write minimal implementation**

Create `public/games/duel/combat.js`:
```js
import { sub, angle, angleDiff, dist } from '../engine/vec.js';

// Which face of `target` (facing `targetHeading`) is exposed to the attacker.
export function hitZone(attackerPos, targetPos, targetHeading) {
  const toAttacker = angle(sub(attackerPos, targetPos));
  const rel = Math.abs(angleDiff(targetHeading, toAttacker)); // 0 = attacker dead ahead
  if (rel > Math.PI * 0.75) return 'rear';
  if (rel < Math.PI * 0.25) return 'front';
  return 'flank';
}

export const DAMAGE = { rear: 100, flank: 45, front: 15 };
export function damageFor(zone) { return DAMAGE[zone]; }
export function inRange(a, b, r) { return dist(a, b) <= r; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test public/games/duel/combat.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/duel/combat.js public/games/duel/combat.test.js
git commit -m "feat(duel): add rear/flank/front hit zones with tests"
```

---

### Task A3: Opponent AI (`duel/ai.js`)

**Files:**
- Create: `public/games/duel/ai.js`
- Test: `public/games/duel/ai.test.js`

- [ ] **Step 1: Write the failing test**

Create `public/games/duel/ai.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideHeading } from './ai.js';

test('AI steers its heading toward the enemy', () => {
  const self = { pos: { x: 0, y: 0 } };
  assert.ok(Math.abs(decideHeading(self, { pos: { x: 10, y: 0 } }) - 0) < 1e-9);
  assert.ok(Math.abs(decideHeading(self, { pos: { x: 0, y: 10 } }) - Math.PI / 2) < 1e-9);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test public/games/duel/ai.test.js`
Expected: FAIL — `./ai.js` not found.

- [ ] **Step 3: Write minimal implementation**

Create `public/games/duel/ai.js`:
```js
import { sub, angle } from '../engine/vec.js';

// Aggressive opponent: always points straight at the enemy (over-commits, exploitable).
export function decideHeading(self, enemy) {
  return angle(sub(enemy.pos, self.pos));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test public/games/duel/ai.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add public/games/duel/ai.js public/games/duel/ai.test.js
git commit -m "feat(duel): add aggressive opponent heading AI with test"
```

---

### Task A4: Wire up Game A (`duel/duel.js` + `duel/index.html`)

**Files:**
- Create: `public/games/duel/duel.js`, `public/games/duel/index.html`

- [ ] **Step 1: Write `duel.js`**

Create `public/games/duel/duel.js`:
```js
import { createLoop } from '../engine/loop.js';
import { createInput } from '../engine/input.js';
import { createRenderer } from '../engine/renderer.js';
import { angle, sub, angleDiff } from '../engine/vec.js';
import { createShip, setDesiredHeading, boost, stepShip } from './ship.js';
import { hitZone, damageFor, inRange } from './combat.js';
import { decideHeading } from './ai.js';

const W = 720, H = 480;
const canvas = document.getElementById('game');
const r = createRenderer(canvas, W, H);
const input = createInput(window, canvas);

let player, enemy, pHP, eHP, round, pWins, eWins, state, msg;

function reset(full) {
  player = createShip({ pos: { x: W * 0.3, y: H * 0.7 }, heading: -Math.PI / 2, color: '#36e0ff' });
  enemy = createShip({ pos: { x: W * 0.7, y: H * 0.3 }, heading: Math.PI / 2, color: '#ff5b5b' });
  pHP = eHP = 100;
  if (full) { round = 1; pWins = 0; eWins = 0; }
  state = 'play'; msg = `Round ${round}`;
}
reset(true);

function fire(shooter, target, applyDamage) {
  if (!inRange(shooter.pos, target.pos, 240)) return;
  const toTarget = angle(sub(target.pos, shooter.pos));
  if (Math.abs(angleDiff(shooter.heading, toTarget)) > 0.5) return; // must be aiming at target
  applyDamage(damageFor(hitZone(shooter.pos, target.pos, target.heading)) * 0.05);
}

function update(dt) {
  if (state !== 'play') {
    if (input.wasPressed('Space')) reset(state === 'matchover');
    input.endFrame();
    return;
  }
  setDesiredHeading(player, angle({ x: input.pointer.x - player.pos.x, y: input.pointer.y - player.pos.y }));
  if (input.wasPressed('Space')) boost(player);
  setDesiredHeading(enemy, decideHeading(enemy, player));
  if (Math.random() < 0.012) boost(enemy);
  stepShip(player, dt); stepShip(enemy, dt);
  fire(player, enemy, (d) => { eHP -= d; });
  fire(enemy, player, (d) => { pHP -= d; });
  if (pHP <= 0 || eHP <= 0) {
    if (eHP <= 0) pWins++; else eWins++;
    if (pWins === 2 || eWins === 2) { state = 'matchover'; msg = (pWins === 2 ? 'YOU WIN THE MATCH' : 'YOU LOSE') + ' — Space to rematch'; }
    else { round++; const won = eHP <= 0; state = 'roundover'; msg = (won ? 'Round won' : 'Round lost') + ' — Space to continue'; }
  }
  input.endFrame();
}

function drawShip(s) {
  const a = s.heading;
  r.poly([
    { x: s.pos.x + Math.cos(a) * 14, y: s.pos.y + Math.sin(a) * 14 },
    { x: s.pos.x + Math.cos(a + 2.5) * 10, y: s.pos.y + Math.sin(a + 2.5) * 10 },
    { x: s.pos.x + Math.cos(a - 2.5) * 10, y: s.pos.y + Math.sin(a - 2.5) * 10 }
  ], s.color, { fill: false, w: 2 });
  if (s.lockTimer > 0) r.circle(s.pos, 18, '#ffd166', { fill: false, w: 1 }); // committed indicator
}

function render() {
  r.clear('#03070d');
  for (let x = 0; x < W; x += 40) r.line({ x, y: 0 }, { x, y: H }, '#0c2230', 1);
  for (let y = 0; y < H; y += 40) r.line({ x: 0, y }, { x: W, y }, '#0c2230', 1);
  drawShip(player); drawShip(enemy);
  r.text(`You ${pWins} — ${eWins} AI   (Round ${round})`, 16, 24, '#9fb6d6', '16px monospace');
  r.text(`HP ${Math.max(0, pHP | 0)}`, 16, H - 16, '#36e0ff');
  r.text(`HP ${Math.max(0, eHP | 0)}`, W - 90, H - 16, '#ff5b5b');
  if (state !== 'play') r.text(msg, W / 2 - 160, H / 2, '#fff', '20px monospace');
}

createLoop({ update, render }).start();
```

- [ ] **Step 2: Write `index.html`**

Create `public/games/duel/index.html`:
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Light Duel — Ender Games</title>
<style>body{margin:0;background:#03070d;color:#9fb6d6;font-family:monospace;display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px}canvas{border:1px solid #123;max-width:100%}a{color:#36e0ff}</style>
</head><body>
<h1>Light Duel</h1>
<canvas id="game"></canvas>
<p>Aim with the mouse · Space to boost · best 2 of 3. Bait the AI into committing, then juke. · <a href="/games/">back</a></p>
<script type="module" src="./duel.js"></script>
</body></html>
```

- [ ] **Step 3: Syntax-check the wiring**

Run: `node --check public/games/duel/duel.js && echo OK`
Expected: prints `OK`.

- [ ] **Step 4: Manual playtest**

Run: `npm run dev` then open `http://localhost:3000/games/duel/`.
Expected: cyan ship follows your mouse heading; red ship charges you; boosting/hard turns draw a yellow "committed" ring; rear hits drain HP fast; match runs best-of-3 with round/match messages and Space to continue. Confirm you can win by slipping behind the AI during its committed window.

- [ ] **Step 5: Commit**

```bash
git add public/games/duel/duel.js public/games/duel/index.html
git commit -m "feat(duel): wire up Light Duel game (canvas + best-of-3)"
```

---

## Phase 2 — Game B · Battle Room

### Task B1: Zero-G physics (`battleroom/physics.js`)

**Files:**
- Create: `public/games/battleroom/physics.js`
- Test: `public/games/battleroom/physics.test.js`

- [ ] **Step 1: Write the failing test**

Create `public/games/battleroom/physics.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { integrate, applyThrust, bounceWalls } from './physics.js';

test('integrate moves by vel*dt and keeps velocity (no friction)', () => {
  const b = { pos: { x: 0, y: 0 }, vel: { x: 10, y: 0 } };
  integrate(b, 0.5);
  assert.deepEqual(b.pos, { x: 5, y: 0 });
  assert.deepEqual(b.vel, { x: 10, y: 0 });
});

test('applyThrust accelerates velocity', () => {
  const b = { pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 } };
  applyThrust(b, { x: 1, y: 0 }, 100, 0.1);
  assert.ok(Math.abs(b.vel.x - 10) < 1e-9);
});

test('bounceWalls clamps position and reflects velocity', () => {
  const b = { pos: { x: -5, y: 5 }, vel: { x: -10, y: 0 } };
  const bounced = bounceWalls(b, { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } }, 0.5);
  assert.equal(bounced, true);
  assert.equal(b.pos.x, 0);
  assert.ok(b.vel.x > 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test public/games/battleroom/physics.test.js`
Expected: FAIL — `./physics.js` not found.

- [ ] **Step 3: Write minimal implementation**

Create `public/games/battleroom/physics.js`:
```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test public/games/battleroom/physics.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/battleroom/physics.js public/games/battleroom/physics.test.js
git commit -m "feat(battleroom): add zero-G physics with tests"
```

---

### Task B2: Freeze system (`battleroom/freeze.js`)

**Files:**
- Create: `public/games/battleroom/freeze.js`
- Test: `public/games/battleroom/freeze.test.js`

- [ ] **Step 1: Write the failing test**

Create `public/games/battleroom/freeze.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSoldier, applyFreezeHit, projectileHits } from './freeze.js';

test('limb hits reduce control then freeze on the third', () => {
  const s = createSoldier({ pos: { x: 0, y: 0 }, team: 'red' });
  applyFreezeHit(s, 'limb'); assert.ok(s.control < 1 && !s.frozen);
  applyFreezeHit(s, 'limb'); assert.ok(!s.frozen);
  applyFreezeHit(s, 'limb'); assert.equal(s.frozen, true);
});

test('core hit freezes instantly', () => {
  const s = createSoldier({ pos: { x: 0, y: 0 }, team: 'red' });
  applyFreezeHit(s, 'core');
  assert.equal(s.frozen, true);
});

test('projectileHits classifies center vs edge vs miss', () => {
  const s = createSoldier({ pos: { x: 0, y: 0 }, team: 'red' });
  assert.equal(projectileHits({ pos: { x: 0, y: 0 } }, s, 12), 'core');
  assert.equal(projectileHits({ pos: { x: 9, y: 0 } }, s, 12), 'limb');
  assert.equal(projectileHits({ pos: { x: 50, y: 0 } }, s, 12), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test public/games/battleroom/freeze.test.js`
Expected: FAIL — `./freeze.js` not found.

- [ ] **Step 3: Write minimal implementation**

Create `public/games/battleroom/freeze.js`:
```js
const MAX_INTEGRITY = 3;

export function createSoldier({ pos, team }) {
  return { pos: { ...pos }, vel: { x: 0, y: 0 }, team, integrity: MAX_INTEGRITY, control: 1, frozen: false };
}

// kind: 'limb' chips away control; 'core' (central hit) freezes solid immediately.
export function applyFreezeHit(soldier, kind = 'limb') {
  if (soldier.frozen) return;
  if (kind === 'core') soldier.integrity = 0;
  else soldier.integrity = Math.max(0, soldier.integrity - 1);
  soldier.control = soldier.integrity / MAX_INTEGRITY;
  if (soldier.integrity <= 0) { soldier.frozen = true; soldier.control = 0; }
}

// Returns 'core' | 'limb' | null based on distance from the soldier center.
export function projectileHits(proj, soldier, radius = 12) {
  const d = Math.hypot(proj.pos.x - soldier.pos.x, proj.pos.y - soldier.pos.y);
  if (d > radius) return null;
  return d < radius * 0.4 ? 'core' : 'limb';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test public/games/battleroom/freeze.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/battleroom/freeze.js public/games/battleroom/freeze.test.js
git commit -m "feat(battleroom): add freeze state + projectile hit with tests"
```

---

### Task B3: Wire up Game B (`battleroom/battleroom.js` + `index.html`)

**Files:**
- Create: `public/games/battleroom/battleroom.js`, `public/games/battleroom/index.html`

- [ ] **Step 1: Write `battleroom.js`**

Create `public/games/battleroom/battleroom.js`:
```js
import { createLoop } from '../engine/loop.js';
import { createInput } from '../engine/input.js';
import { createRenderer } from '../engine/renderer.js';
import { norm, sub } from '../engine/vec.js';
import { integrate, applyThrust, bounceWalls } from './physics.js';
import { createSoldier, applyFreezeHit, projectileHits } from './freeze.js';

const W = 720, H = 520;
const bounds = { min: { x: 16, y: 16 }, max: { x: W - 16, y: H - 16 } };
const canvas = document.getElementById('game');
const r = createRenderer(canvas, W, H);
const input = createInput(window, canvas);
const stars = [{ x: W / 2, y: H / 2, s: 46 }, { x: W * 0.25, y: H * 0.3, s: 30 }, { x: W * 0.75, y: H * 0.72, s: 30 }];
const gate = { x: W / 2, y: 34, r: 26 };
let player, enemies, projs, state, msg;

function reset() {
  player = createSoldier({ pos: { x: W / 2, y: H - 60 }, team: 'blue' });
  player.fireCd = 0;
  enemies = [createSoldier({ pos: { x: W * 0.3, y: 90 }, team: 'red' }), createSoldier({ pos: { x: W * 0.7, y: 100 }, team: 'red' })];
  enemies.forEach((e) => { e.fireCd = Math.random(); });
  projs = []; state = 'play'; msg = '';
}
reset();

function shoot(from, dir, team) { projs.push({ pos: { ...from }, vel: { x: dir.x * 420, y: dir.y * 420 }, team, life: 1.4 }); }

function update(dt) {
  if (state !== 'play') { if (input.wasPressed('Space')) reset(); input.endFrame(); return; }
  const t = { x: 0, y: 0 };
  if (input.keys.has('KeyW')) t.y -= 1;
  if (input.keys.has('KeyS')) t.y += 1;
  if (input.keys.has('KeyA')) t.x -= 1;
  if (input.keys.has('KeyD')) t.x += 1;
  if (t.x || t.y) applyThrust(player, norm(t), 360 * player.control, dt);
  integrate(player, dt); bounceWalls(player, bounds, 0.7);
  player.fireCd = Math.max(0, player.fireCd - dt);
  if (input.pointer.down && player.fireCd <= 0) { shoot(player.pos, norm(sub(input.pointer, player.pos)), 'blue'); player.fireCd = 0.25; }

  for (const e of enemies) {
    if (e.frozen) continue;
    integrate(e, dt); bounceWalls(e, bounds, 0.7);
    e.fireCd = Math.max(0, e.fireCd - dt);
    if (e.fireCd <= 0) { shoot(e.pos, norm(sub(player.pos, e.pos)), 'red'); e.fireCd = 1.1; applyThrust(e, norm(sub(player.pos, e.pos)), 60, dt); }
  }

  for (const p of projs) { integrate(p, dt); p.life -= dt; }
  projs = projs.filter((p) => p.life > 0);
  for (const p of projs) {
    if (p.team === 'blue') { for (const e of enemies) { const k = projectileHits(p, e); if (k) { applyFreezeHit(e, k); p.life = 0; } } }
    else { const k = projectileHits(p, player); if (k) { applyFreezeHit(player, k); p.life = 0; } }
  }

  if (enemies.every((e) => e.frozen)) { state = 'over'; msg = 'ALL FROZEN — YOU WIN  (Space)'; }
  else if (Math.hypot(player.pos.x - gate.x, player.pos.y - gate.y) < gate.r) { state = 'over'; msg = 'GATE BREACHED — YOU WIN  (Space)'; }
  else if (player.frozen) { state = 'over'; msg = 'FROZEN — YOU LOSE  (Space)'; }
  input.endFrame();
}

function drawSoldier(s) {
  const c = s.team === 'blue' ? '#4da3ff' : '#ff5b5b';
  r.circle(s.pos, 8, c);
  if (s.frozen) r.circle(s.pos, 14, '#7fdfff', { fill: false, w: 2 });
  else if (s.control < 1) r.circle(s.pos, 12, '#7fdfff', { fill: false, w: 1 });
}

function render() {
  r.clear('#070b14');
  r.poly([{ x: bounds.min.x, y: bounds.min.y }, { x: bounds.max.x, y: bounds.min.y }, { x: bounds.max.x, y: bounds.max.y }, { x: bounds.min.x, y: bounds.max.y }], '#2e4a6b', { fill: false, w: 1 });
  for (const st of stars) r.poly([{ x: st.x - st.s / 2, y: st.y - st.s / 2 }, { x: st.x + st.s / 2, y: st.y - st.s / 2 }, { x: st.x + st.s / 2, y: st.y + st.s / 2 }, { x: st.x - st.s / 2, y: st.y + st.s / 2 }], '#1c3350');
  r.circle(gate, gate.r, '#ffd166', { fill: false, w: 2 });
  for (const p of projs) r.circle(p.pos, 3, p.team === 'blue' ? '#7fdfff' : '#ff9f43');
  drawSoldier(player); enemies.forEach(drawSoldier);
  r.text('WASD to thrust (zero-G drift) · mouse aim + hold to fire · reach gold gate or freeze all', 16, H - 14, '#5b7497', '13px monospace');
  if (state !== 'play') r.text(msg, W / 2 - 170, H / 2, '#fff', '20px monospace');
}

createLoop({ update, render }).start();
```

- [ ] **Step 2: Write `index.html`**

Create `public/games/battleroom/index.html`:
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Battle Room — Ender Games</title>
<style>body{margin:0;background:#070b14;color:#9fb6d6;font-family:monospace;display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px}canvas{border:1px solid #123;max-width:100%}a{color:#4da3ff}</style>
</head><body>
<h1>Battle Room</h1>
<canvas id="game"></canvas>
<p>Zero-G: WASD thrusts, you keep drifting. Mouse-aim freeze beams. The enemy's gate is up top. · <a href="/games/">back</a></p>
<script type="module" src="./battleroom.js"></script>
</body></html>
```

- [ ] **Step 3: Syntax-check the wiring**

Run: `node --check public/games/battleroom/battleroom.js && echo OK`
Expected: prints `OK`.

- [ ] **Step 4: Manual playtest**

Run: `npm run dev` then open `http://localhost:3000/games/battleroom/`.
Expected: WASD applies thrust with momentum and no friction (you drift, bounce off walls); holding mouse fires dodgeable beam projectiles; hitting a red soldier's edge rings them (partial), center-hit or 3 hits freezes them solid; you win by freezing both or reaching the gold gate; you lose if frozen. Confirm the floaty movement feels controllable — this is the key "is it fun?" check for B.

- [ ] **Step 5: Commit**

```bash
git add public/games/battleroom/battleroom.js public/games/battleroom/index.html
git commit -m "feat(battleroom): wire up zero-G Battle Room game"
```

---

## Phase 3 — Game C · Commander

### Task C1: Order latency & obedience (`commander/orders.js`)

**Files:**
- Create: `public/games/commander/orders.js`
- Test: `public/games/commander/orders.test.js`

- [ ] **Step 1: Write the failing test**

Create `public/games/commander/orders.test.js`:
```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test public/games/commander/orders.test.js`
Expected: FAIL — `./orders.js` not found.

- [ ] **Step 3: Write minimal implementation**

Create `public/games/commander/orders.js`:
```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test public/games/commander/orders.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add public/games/commander/orders.js public/games/commander/orders.test.js
git commit -m "feat(commander): add order latency + imperfect obedience with tests"
```

---

### Task C2: Wire up Game C (`commander/commander.js` + `index.html`)

**Files:**
- Create: `public/games/commander/commander.js`, `public/games/commander/index.html`

This reuses `../battleroom/physics.js` and `../battleroom/freeze.js`.

- [ ] **Step 1: Write `commander.js`**

Create `public/games/commander/commander.js`:
```js
import { createLoop } from '../engine/loop.js';
import { createInput } from '../engine/input.js';
import { createRenderer } from '../engine/renderer.js';
import { norm, sub } from '../engine/vec.js';
import { integrate, applyThrust, bounceWalls } from '../battleroom/physics.js';
import { createSoldier, applyFreezeHit, projectileHits } from '../battleroom/freeze.js';
import { issueOrder, updateOrders, resolveBehavior } from './orders.js';

const W = 720, H = 520;
const bounds = { min: { x: 16, y: 16 }, max: { x: W - 16, y: H - 16 } };
const canvas = document.getElementById('game');
const r = createRenderer(canvas, W, H);
const input = createInput(window, canvas);
const enemyGate = { x: W / 2, y: 34, r: 26 };
let squad, foes, projs, state, msg;

function mk(pos, team) { const s = createSoldier({ pos, team }); s.fireCd = 0; s.activeOrder = null; s.pendingOrder = null; return s; }
function reset() {
  squad = [mk({ x: W * 0.4, y: H - 60 }, 'blue'), mk({ x: W * 0.5, y: H - 60 }, 'blue'), mk({ x: W * 0.6, y: H - 60 }, 'blue')];
  foes = [mk({ x: W * 0.4, y: 90 }, 'red'), mk({ x: W * 0.6, y: 90 }, 'red')];
  projs = []; state = 'play'; msg = '';
}
reset();

function shoot(from, target, team) { const d = norm(sub(target, from)); projs.push({ pos: { ...from }, vel: { x: d.x * 400, y: d.y * 400 }, team, life: 1.5 }); }

function update(dt) {
  if (state !== 'play') { if (input.wasPressed('Space')) reset(); input.endFrame(); return; }

  if (input.pointer.down) {
    const target = { x: input.pointer.x, y: input.pointer.y };
    for (const u of squad) if (!u.frozen) issueOrder(u, { type: 'move', target });
  }

  for (const u of squad) {
    updateOrders(u, dt);
    const underFire = projs.some((p) => p.team === 'red' && Math.hypot(p.pos.x - u.pos.x, p.pos.y - u.pos.y) < 70);
    const coverPoint = { x: u.pos.x + (u.pos.x < W / 2 ? 70 : -70), y: u.pos.y };
    const b = resolveBehavior(u, { underFire, coverPoint });
    if (b.action === 'move' && b.target) applyThrust(u, norm(sub(b.target, u.pos)), 300 * u.control, dt);
    integrate(u, dt); bounceWalls(u, bounds, 0.6);
    u.fireCd = Math.max(0, u.fireCd - dt);
    const tgt = foes.find((f) => !f.frozen);
    if (tgt && !u.frozen && u.fireCd <= 0) { shoot(u.pos, tgt.pos, 'blue'); u.fireCd = 0.7; }
  }

  for (const f of foes) {
    if (f.frozen) continue;
    const tgt = squad.find((s) => !s.frozen);
    if (tgt) {
      applyThrust(f, norm(sub(tgt.pos, f.pos)), 120, dt);
      f.fireCd = Math.max(0, f.fireCd - dt);
      if (f.fireCd <= 0) { shoot(f.pos, tgt.pos, 'red'); f.fireCd = 0.9; }
    }
    integrate(f, dt); bounceWalls(f, bounds, 0.6);
  }

  for (const p of projs) { integrate(p, dt); p.life -= dt; }
  projs = projs.filter((p) => p.life > 0);
  for (const p of projs) {
    const targets = p.team === 'blue' ? foes : squad;
    for (const s of targets) { const k = projectileHits(p, s); if (k) { applyFreezeHit(s, k); p.life = 0; break; } }
  }

  if (foes.every((f) => f.frozen)) { state = 'over'; msg = 'ENEMY SQUAD FROZEN — YOU WIN  (Space)'; }
  else if (squad.some((s) => !s.frozen && Math.hypot(s.pos.x - enemyGate.x, s.pos.y - enemyGate.y) < enemyGate.r)) { state = 'over'; msg = 'GATE BREACHED — YOU WIN  (Space)'; }
  else if (squad.every((s) => s.frozen)) { state = 'over'; msg = 'SQUAD FROZEN — YOU LOSE  (Space)'; }
  input.endFrame();
}

function drawSoldier(s) {
  const c = s.team === 'blue' ? '#4da3ff' : '#ff5b5b';
  if (s.team === 'blue' && s.pendingOrder) r.line(s.pos, s.pendingOrder.target, '#ffd166', 1); // order in flight
  r.circle(s.pos, 8, c);
  if (s.frozen) r.circle(s.pos, 14, '#7fdfff', { fill: false, w: 2 });
}

function render() {
  r.clear('#070b14');
  r.poly([{ x: bounds.min.x, y: bounds.min.y }, { x: bounds.max.x, y: bounds.min.y }, { x: bounds.max.x, y: bounds.max.y }, { x: bounds.min.x, y: bounds.max.y }], '#2e4a6b', { fill: false, w: 1 });
  r.circle(enemyGate, enemyGate.r, '#ffd166', { fill: false, w: 2 });
  for (const p of projs) r.circle(p.pos, 3, p.team === 'blue' ? '#7fdfff' : '#ff9f43');
  squad.forEach(drawSoldier); foes.forEach(drawSoldier);
  r.text('Click to order your squad to a point — they answer with delay + their own momentum', 16, H - 14, '#5b7497', '13px monospace');
  if (state !== 'play') r.text(msg, W / 2 - 190, H / 2, '#fff', '20px monospace');
}

createLoop({ update, render }).start();
```

- [ ] **Step 2: Write `index.html`**

Create `public/games/commander/index.html`:
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Commander — Ender Games</title>
<style>body{margin:0;background:#070b14;color:#9fb6d6;font-family:monospace;display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px}canvas{border:1px solid #123;max-width:100%}a{color:#4da3ff}</style>
</head><body>
<h1>Commander</h1>
<canvas id="game"></canvas>
<p>You command the squad. Click a destination — orders lag and your soldiers move under their own momentum and survival instincts. · <a href="/games/">back</a></p>
<script type="module" src="./commander.js"></script>
</body></html>
```

- [ ] **Step 3: Syntax-check the wiring**

Run: `node --check public/games/commander/commander.js && echo OK`
Expected: prints `OK`.

- [ ] **Step 4: Manual playtest**

Run: `npm run dev` then open `http://localhost:3000/games/commander/`.
Expected: clicking issues a move order to your three blue soldiers; a yellow line shows the order "in flight" during the registration delay; soldiers then drift toward the point under zero-G momentum (overshooting); a damaged soldier under fire peels off toward cover on its own; you win by freezing the red squad or pushing a soldier into the gold enemy gate. Confirm commanding-under-latency feels like tactical decision-making, not broken controls.

- [ ] **Step 5: Commit**

```bash
git add public/games/commander/commander.js public/games/commander/index.html
git commit -m "feat(commander): wire up Commander game reusing battleroom systems"
```

---

## Phase 4 — Hub

### Task D1: Hub page (`games/index.html`)

**Files:**
- Create: `public/games/index.html`

- [ ] **Step 1: Write the hub**

Create `public/games/index.html`:
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ender Games — prototypes</title>
<style>
  body{margin:0;background:#04060d;color:#cdd9ec;font-family:monospace;padding:40px 20px;display:flex;flex-direction:column;align-items:center}
  h1{letter-spacing:2px} p.sub{color:#5b7497;margin-top:-8px}
  .grid{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;max-width:980px;margin-top:24px}
  a.card{display:block;width:280px;text-decoration:none;color:inherit;background:#0a1120;border:1px solid #1c2c44;border-radius:10px;padding:18px;transition:border-color .15s,transform .15s}
  a.card:hover{border-color:#36e0ff;transform:translateY(-3px)}
  a.card h2{margin:0 0 6px;font-size:1.1rem} a.card .tag{font-size:.72rem;color:#7fa0c8;text-transform:uppercase;letter-spacing:1px}
  a.card p{font-size:.9rem;line-height:1.4;color:#9fb6d6}
</style>
</head><body>
<h1>ENDER GAMES</h1>
<p class="sub">Three single-player prototypes inspired by <em>Ender's Game</em>. Which is most fun?</p>
<div class="grid">
  <a class="card" href="/games/duel/"><span class="tag">A · holo arcade</span><h2>Light Duel</h2><p>The Ch.5 game-room duel. Bait an over-aggressive AI into committing, then juke during its lag window. Best 2 of 3.</p></a>
  <a class="card" href="/games/battleroom/"><span class="tag">B · zero-G</span><h2>Battle Room</h2><p>Float through the cube on pure momentum. Freeze enemy soldiers or reach their gate. The enemy's gate is down.</p></a>
  <a class="card" href="/games/commander/"><span class="tag">C · command</span><h2>Commander</h2><p>Direct a squad, not a soldier. Orders lag and your toons obey imperfectly. Think like Ender.</p></a>
</div>
</body></html>
```

- [ ] **Step 2: Manual playtest**

Run: `npm run dev` then open `http://localhost:3000/games/`.
Expected: three cards render; hovering highlights; each links to its game and each game's "back" link returns here.

- [ ] **Step 3: Run the full test suite once**

Run: `node --test public/games/`
Expected: all test files pass (vec, ship, combat, ai, physics, freeze, orders).

- [ ] **Step 4: Commit**

```bash
git add public/games/index.html
git commit -m "feat(games): add hub landing page linking the three prototypes"
```

---

## Self-Review (completed by plan author)

**Spec coverage:**
- A · Light Duel (commitment window, rear/flank hits, best-of-3, aggressive AI) → Tasks A1–A4 ✓
- B · Battle Room (zero-G momentum, wall bounce, freeze beam projectiles, gate/freeze win) → Tasks B1–B3 ✓
- C · Commander (order latency, imperfect obedience, reuses B physics+freeze, squad win conditions) → Tasks C1–C2 ✓
- Shared engine skeleton (loop, input, renderer, vec) → Tasks 1–2 ✓
- Hub page → Task D1 ✓
- Static deploy under `public/games/` → directory layout (Task 0); no Next changes needed ✓
- Tunable constants for feel → exported/visible constants in ship.js, freeze.js, orders.js, and inline accel/range values ✓

**Deferred (matches spec "Open Questions"):** star-block collision in B (drawn as visual cover only this pass), audio/juice, 3D escalation for B, main-site nav link. These are intentional non-goals for v1.

**Placeholder scan:** No TBD/TODO; every code step contains complete code.

**Type/name consistency:** `createSoldier`/`applyFreezeHit`/`projectileHits` shared identically by battleroom and commander; `{x,y}` vectors throughout; `setDesiredHeading`/`boost`/`stepShip` consistent between ship.js and duel.js; `issueOrder`/`updateOrders`/`resolveBehavior` consistent between orders.js and commander.js. `activeOrder` initialized to `null` in `mk()` and in `issueOrder`, matching the `=== null` assertion in the orders test.
