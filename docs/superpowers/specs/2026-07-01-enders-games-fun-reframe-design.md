# Ender's Games — "Make It Fun" Reframe

**Date:** 2026-07-01
**Status:** Exploratory (user goal: "try a lot of things to make these ideas fun")
**Builds on:** 2026-06-13-enders-game-prototypes-design.md

## Problem

Playtesting verdict on v1: the unifying "latency" theme reads as a concept gimmick, not
fun. Root cause: in all three games latency is implemented as *the player's inputs being
ignored* —

- **Duel:** `setDesiredHeading` rejects mouse input for 0.35–0.5 s after a hard turn/boost.
  Feels like broken controls, not like the book's exploit-the-engine-lag scene.
- **Commander:** a flat 0.45 s click→action delay makes a 3-unit RTS feel like a *laggy*
  RTS. The delay creates no decision; you just wait.
- **Battle Room:** healthiest of the three (momentum "lag" is physics), but it doesn't
  lean into what makes drift fun.

## Reframe principle

Latency is fun when it is:
1. **something you exploit in the enemy** (telegraphed commitment you bait and punish),
2. **a powerful move you choose to commit to** (Souls attack, fighting-game whiff punish),
3. **a plan you watch unfold** (Frozen Synapse WeGo turns) —

and never friction silently applied to the player's inputs.

## Approach: switchable variants per game

Each game gets 3 variants switchable with keys **1/2/3** (persisted per game in
localStorage, initial via `?v=`): a **reframed default**, a **no-latency control** (does
the theme add anything?), and **classic** (v1 as built). A shared
`engine/variants.js` handles selection, persistence, and the HUD chip. Switching resets
the round.

### Duel
1. **HUNTER (default):** Player steering is never locked. Space = **lunge** — a chosen,
   committed high-speed dash (can't turn during it). The enemy keeps big commitments:
   it telegraphs its boost with a windup flash, locks longer, and takes bonus damage
   while committed ("punish window"). Fun loop: bait the charge, juke, kill from behind.
2. **OVERDRIVE (control):** no locks for anyone, fast turn rates, pure positioning.
3. **CLASSIC:** v1 behavior.

### Battle Room
1. **RAIDER (default):** momentum as a weapon — firing recoils you backward (Luftrausers
   movement tool), wall push-offs give a speed *boost* when thrusting off the wall,
   much stronger brake, faster fire cadence. Skill = surfing your own recoil.
2. **HEAVY (control):** v1 mechanics, cranked thrust/brake (tests "it's just tuning").
3. **CLASSIC:** v1 behavior.

### Commander
1. **WEGO (default):** plan-then-execute rhythm. PLAN phase: world frozen, click to queue
   orders/waypoints (they chain), no delay. SPACE → EXECUTE: 2.5 s of full-speed
   simultaneous execution, then back to PLAN. Latency becomes the format, not friction.
2. **DIRECT (control):** real-time, zero order delay.
3. **CLASSIC:** v1 (0.45 s comms delay, real-time).

## Success criteria

The user can flip between variants mid-game and judge feel directly. New pure logic
(lunge state machine, order queue, recoil/wall-kick impulse) is unit-tested; the suite
(`npm run test:games`) stays green. Smoke-tested in the browser per variant.

## Non-goals

Touch-first variant switching UI (number keys + `?v=` is fine for a prototype), 3D,
persistence beyond the variant choice.
