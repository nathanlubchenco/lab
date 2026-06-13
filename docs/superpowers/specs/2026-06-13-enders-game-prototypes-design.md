# Ender's Game Mini-Games — Design Spec

**Date:** 2026-06-13
**Status:** Approved for planning
**Author:** Nathan Lubchenco (with Claude)

## Goal

Build three small, single-player, browser-based games inspired by *Ender's Game*, to
explore which core loop is most fun. Start at "quick fun toy" scope; architect cleanly
so a winner can grow into a polished mini-game later. All three deploy on the existing
Vercel infra as static files served from `prediction-tracker/public/`.

A unifying theme connects the three: **latency as the central tension.**
- **A** — your *own* maneuver-commitment lag.
- **B** — *physics* momentum lag (zero-G, no friction).
- **C** — your *units'* response lag (command delay + imperfect obedience).

## Non-Goals (YAGNI)

- No multiplayer, no networking, no accounts, no persistence/leaderboards (yet).
- No 3D for the first pass — all three are 2D top-down Canvas. (B may escalate to true
  3D later *only if* the zero-G feel proves fun.)
- No build-step requirement for the games themselves — plain HTML + ES modules so they
  drop into `public/` and work without bundling. (See "Tech & Structure".)
- No asset pipeline — vector/wireframe rendering drawn in code, no image/audio deps
  required for v1 (audio optional polish).

## Source References (faithfulness anchors)

- **A · Light Duel** — Ch. 5 game-room scene. Older boys play tactical holographic
  spaceship games on machines with keyboard + trackball controls. The engine has slight
  *execution lag*; an opponent relying on aggressive rapid movement can't recover if you
  change direction inside that lag window. Ender challenges a boy to "two out of three,"
  loses round 1 on purpose to map the opponent's habits/reaction times, then wins 2–3.
- **B · Battle Room** — zero-G cube, flash suits, freeze guns (limb hit locks that limb,
  torso/full hit freezes solid), floating "star" blocks as cover/orientation, gates at
  opposite ends. Win by freezing the enemy or pushing soldiers through their gate. No
  air resistance — movement by thrust and pushing off surfaces. "The enemy's gate is down."
- **C · Commander** — Ender directing toons/squadrons; orders take time and are executed
  imperfectly by semi-autonomous units.

## Tech & Structure

**Stack:** Plain HTML + vanilla JS ES modules + HTML5 Canvas 2D. No framework, no bundler.
This keeps each game a self-contained static drop-in for `public/` and avoids coupling to
the Next.js build. (The Next app already serves standalone HTML from `public/`, e.g.
`ai_displacement_analysis.html`.)

**Shared engine skeleton** (reused by all three; the "build clean, can grow" requirement):

```
prediction-tracker/public/games/
  index.html              # hub page linking the three games
  engine/
    loop.js               # fixed-timestep game loop (update + render)
    vec.js                # 2D vector math helpers
    input.js              # keyboard + mouse/pointer input state
    entity.js             # base entity (pos, vel, update/draw contract)
    renderer.js           # canvas setup, camera, primitive draw helpers
  duel/
    index.html            # A
    duel.js               # game-specific logic
  battleroom/
    index.html            # B
    battleroom.js
  commander/
    index.html            # C
    commander.js          # reuses battleroom physics + freeze, adds order layer
```

Each game is understandable and testable on its own; the engine modules expose small,
well-defined interfaces (loop, input, vector math, entity contract, draw helpers) and the
games depend only on those.

**Engine contracts (interfaces):**
- `loop.start({ update(dt), render(alpha) })` — fixed-timestep accumulator loop.
- `input` — exposes `keys` (held set), `pointer` ({x, y, down}), edge-trigger helpers.
- `Entity` — `{ pos, vel, update(dt), draw(ctx) }`; subclasses override behavior.
- `renderer` — canvas/context init, clear, and primitive helpers (line, poly, glow).

## Game A — Light Duel

**View/look:** Top-down rectangular arena, cyan (player) vs red (AI) vector-wireframe
"holographic" ships. Subtle grid/scanline aesthetic to evoke the holo machines.

**Controls:** Pointer sets desired heading; the ship turns toward it at a limited turn
rate. A key (e.g. Space/Shift) triggers a boost. The ship **auto-fires forward** on a
fixed cadence — keeps the player focused on positioning, not trigger timing.

**Core mechanic — commitment window:** After a hard turn or a boost, the ship enters a
brief locked state (e.g. ~250–500 ms, tuned) where heading changes are ignored/damped.
Aggressive maneuvering repeatedly enters this window, creating exploitable exposure.

**Combat:** Rear/flank hits are lethal (or high damage); head-on is weak/deflected. This
makes *positioning* the win condition, not raw shooting. Tunable hit arcs.

**Opponent AI:** Opens aggressive and over-committing (the smug older boy). Beatable by
baiting it into a committed vector, then juking during its lag to slip behind. Difficulty
knobs: turn rate, lag length, aggression, reaction delay.

**Match structure:** Best **2-of-3** rounds (explicit nod to the scene). Round/score HUD,
round-start countdown, win/lose screen with replay.

**Fun hypothesis:** The read-and-punish timing loop is satisfying without twitch reflexes.

## Game B — Battle Room

**View/look:** Top-down view of the cube arena. A few rectangular "star" blocks float as
cover. Player = blue soldier, enemies = red. Optional "enemy's gate is down" orientation
flavor (arena drawn with the enemy gate toward bottom).

**Movement — zero-G momentum:** No friction. Thrust (WASD/arrows) applies acceleration;
you keep drifting until you thrust the other way or hit a wall. Pushing off a wall on
contact gives a momentum kick. Mastering drift/braking is part of the skill.

**Combat — freeze beam:** Pointer aims; click/key fires a freeze beam as a **fast
projectile** (visibly dodgeable, not instant hitscan — dodging beams is part of the fun).
A limb hit slows/partially locks the target (reduced control/thrust); a
full/torso hit freezes them solid (out of the round). Player can be frozen the same way.

**Enemies:** A handful of AI soldiers drift, take cover behind stars, and fire back.

**Win/lose:** Win by freezing all enemies **or** reaching/touching the enemy gate. Lose if
fully frozen. Restart on end.

**Fun hypothesis:** The make-or-break is whether momentum movement feels good (controllable
but weighty). This prototype exists to answer that cheaply in 2D before any 3D investment.

## Game C — Commander

**Built on B:** Reuses B's arena, star obstacles, zero-G physics, and freeze system
entirely. The difference: you do **not** fly a soldier. You command a squad of toons.

**Orders:** Click/drag to issue orders to selected unit(s):
- **Move-to** (click a point)
- **Focus-fire** (click an enemy)
- **Take cover** (click near a star)
- **Push the gate** (advance toward enemy gate)

**Core mechanic — command latency + imperfect obedience:**
- **Registration delay:** an order takes a beat (~300–600 ms, tuned) before the unit
  begins acting on it; a small HUD bar shows the pending order registering.
- **Imperfect execution:** units move under their own zero-G momentum (overshoot, curved
  approach), and have light autonomy — a unit under fire may break off to cover
  (self-preservation), and a frozen/partly-frozen unit responds sluggishly or not at all.
- You set intent and adapt; you cannot pixel-perfect micro.

**Enemy:** An AI-commanded enemy squad doing the same (its own order logic + delays).

**Win/lose:** Freeze all enemy soldiers **or** push one of your soldiers through the enemy
gate. Lose if your whole squad is frozen.

**Fun hypothesis:** The Ender fantasy — issuing good orders under uncertainty and reading
the flow — is more interesting than direct control.

## Hub Page

`public/games/index.html`: a simple themed landing page (matches the blog's dark aesthetic)
with three cards (A/B/C), one-line pitches, and links. Makes the three easy to find and
compare — the "which is most fun" evaluation is built into the entry point.

## Deployment

Static files under `prediction-tracker/public/games/` are served by Vercel automatically at
`/games/...`. No routing or Next.js page changes required for v1. (Optionally link from the
main site later, once a winner emerges.)

## Success Criteria

This is an exploration. "Done" for v1 = all three are playable end-to-end and we can judge:
1. **A:** Can a human reliably beat the AI by exploiting the lag window (not by twitch)?
   Does the read-and-punish loop feel clever and satisfying?
2. **B:** Does zero-G momentum movement feel controllable-but-weighty rather than
   frustrating/floaty? Is freezing enemies satisfying?
3. **C:** Does commanding-under-latency feel like meaningful tactical decision-making
   rather than fighting bad controls?

Each prototype should be tunable (constants for lag, turn rate, thrust, delays, hit arcs)
so we can iterate on feel quickly. After playtest, pick the winner to grow toward polished
mini-game (levels, progression, audio/juice, possibly 3D for B).

## Open Questions / Deferred

- Exact tuning values (lag windows, thrust, turn rates) — to be found by playtesting.
- Audio/juice (screenshake, particles, sound) — optional v1 polish, not required.
- Whether B escalates to true 3D — decided only after the 2D feel test.
- Linking games from the main blog navigation — deferred until a winner is chosen.
