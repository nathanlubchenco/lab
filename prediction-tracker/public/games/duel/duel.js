import { createLoop } from '../engine/loop.js';
import { createInput } from '../engine/input.js';
import { createRenderer } from '../engine/renderer.js';
import { angle, sub, angleDiff, fromAngle, dist } from '../engine/vec.js';
import { COLORS, drawCRT, drawFrame } from '../engine/theme.js';
import { createFX, createStarfield } from '../engine/fx.js';
import { sfx, resumeAudio } from '../engine/audio.js';
import { makeButton, buttonPressed, drawButton, inButton } from '../engine/touchui.js';
import { createShip, setDesiredHeading, boost, lunge, stepShip } from './ship.js';
import { hitZone, inRange } from './combat.js';
import { decideHeading } from './ai.js';
import { createVariants, drawVariantHUD } from '../engine/variants.js';

const V = createVariants('duel', [
  { id: 'hunter', name: 'HUNTER', blurb: 'free steering · SPACE lunges · punish the enemy while EXPOSED' },
  { id: 'overdrive', name: 'OVERDRIVE', blurb: 'no commitments at all · pure positioning' },
  { id: 'classic', name: 'CLASSIC', blurb: 'v1 — hard turns commit YOU too' },
]);

const W = 760, H = 520;
const canvas = document.getElementById('game');
const r = createRenderer(canvas, W, H);
const ctx = r.ctx;
const input = createInput(window, canvas);
const fx = createFX();
const stars = createStarfield(W, H, 90);

const BEAM_RANGE = 250, CONE = 0.42;
const ZONE_DPS = { rear: 150, flank: 72, front: 26 }; // damage per second by exposed face
const boostBtn = makeButton(W - 84, H - 92, 64, 64);

let player, enemy, round, pWins, eWins;
let state, stateT, msg, slow, pointerMoved = false, tclock = 0;

function mkShip(x, y, heading, color, commitOnTurn) {
  const s = createShip({ pos: { x, y }, heading, color, speed: 165, turnRate: 3.0, commitOnTurn });
  s.trail = []; s.hp = 100; s.flash = 0; s.beamZone = null; s.windup = 0;
  return s;
}

function reset(full) {
  // hunter/overdrive: latency never gates YOUR steering — commitment is the enemy's
  // weakness (hunter) or gone entirely (overdrive control variant).
  const playerCommits = V.is('classic');
  const enemyCommits = !V.is('overdrive');
  player = mkShip(W * 0.28, H * 0.72, -Math.PI / 2, COLORS.blue, playerCommits);
  enemy = mkShip(W * 0.72, H * 0.28, Math.PI / 2, COLORS.red, enemyCommits);
  enemy.turnRate = V.is('overdrive') ? 2.8 : 2.35; // slower than the player (3.0) so juking can out-turn it
  if (full) { round = 1; pWins = 0; eWins = 0; }
  state = 'intro'; stateT = 0; slow = 0; msg = '';
}
reset(true);

function beamZone(shooter, target) {
  if (!inRange(shooter.pos, target.pos, BEAM_RANGE)) return null;
  const toT = angle(sub(target.pos, shooter.pos));
  if (Math.abs(angleDiff(shooter.heading, toT)) > CONE) return null;
  return hitZone(shooter.pos, target.pos, target.heading);
}

function applyBeam(shooter, target, dt) {
  const zone = beamZone(shooter, target);
  shooter.beamZone = zone;
  if (!zone) return;
  // hunter: a committed ship is EXPOSED — hits land harder while it can't steer
  const punish = V.is('hunter') && target.lockTimer > 0 ? 1.7 : 1;
  target.hp -= ZONE_DPS[zone] * punish * dt;
  target.flash = 0.12;
  // impact sparks at the target hull
  const col = zone === 'rear' ? '#ffffff' : shooter.color;
  fx.trail(target.pos.x, target.pos.y, col, 0, 0, zone === 'rear' ? 2.4 : 1.6);
  if (zone === 'rear' && Math.random() < 0.18) { fx.shake(2); }
}

function die(s, killer) {
  s.dead = true;
  fx.burst(s.pos.x, s.pos.y, s.color, 30, 320);
  fx.burst(s.pos.x, s.pos.y, '#ffffff', 16, 200);
  fx.ring(s.pos.x, s.pos.y, killer.color, 70, 0.6, 3);
  fx.shake(9, 0.4);
  sfx.kill();
  slow = 0.75; // cinematic slow-mo
}

function steerPlayer() {
  if (input.isTouch) {
    // aim toward a touch that isn't on the boost button; if none, keep current heading
    const t = input.touches.find(p => !inButton(boostBtn, p));
    if (t) setDesiredHeading(player, angle(sub(t, player.pos)));
    return;
  }
  // aim at pointer once the user has moved it; before that, face the enemy (clean default)
  const aim = pointerMoved
    ? angle({ x: input.pointer.x - player.pos.x, y: input.pointer.y - player.pos.y })
    : angle(sub(enemy.pos, player.pos));
  setDesiredHeading(player, aim);
}

function endRound(playerWon) {
  if (playerWon) pWins++; else eWins++;
  if (pWins === 2 || eWins === 2) { state = 'matchover'; msg = pWins === 2 ? 'SIMULATION PASSED' : 'SIMULATION FAILED'; if (pWins === 2) sfx.win(); else sfx.lose(); }
  else { round++; state = 'roundover'; msg = playerWon ? 'ROUND WON' : 'ROUND LOST'; }
}

function update(dt) {
  tclock += dt;
  stars.update(dt);
  if (input.pointer.x || input.pointer.y) pointerMoved = true;
  if (input.wasPressed('Space') || input.pointer.down) resumeAudio();

  // slow-mo decay
  if (slow > 0) slow = Math.max(0, slow - dt);
  const sdt = dt * (slow > 0 ? 0.28 : 1);

  fx.update(dt);
  player.flash = Math.max(0, player.flash - dt);
  enemy.flash = Math.max(0, enemy.flash - dt);

  if (state === 'intro') {
    stateT += dt;
    steerPlayer();
    // hold ships facing each other during countdown
    if (stateT > 1.6) { state = 'play'; stateT = 0; sfx.blip(); }
    pushTrails();
    input.endFrame();
    return;
  }

  if (state === 'roundover' || state === 'matchover') {
    stateT += dt;
    fx.update(0); // already updated above
    if ((input.wasPressed('Space')) && stateT > 0.4) reset(state === 'matchover');
    input.endFrame();
    return;
  }

  // PLAY
  steerPlayer();
  const btnBoost = buttonPressed(boostBtn, input); // evaluate every frame to track edge state
  if (input.wasPressed('Space') || btnBoost) {
    // hunter/overdrive: SPACE is a lunge — a commitment you choose (overdrive keeps steering)
    const go = V.is('classic') ? boost(player) : lunge(player);
    if (go) {
      if (V.is('overdrive')) player.lockTimer = 0;
      sfx.boost(); fx.ring(player.pos.x, player.pos.y, COLORS.blue, 26, 0.3, 2);
    }
  }

  // AI: aggressive, over-commits — it charges and, when it has the player roughly ahead
  // at mid range, slams a boost it can't recover from. That commit window is your opening.
  setDesiredHeading(enemy, decideHeading(enemy, player));
  if (enemy.windup > 0) {
    // hunter: the charge is telegraphed — windup, then a long committed lunge
    enemy.windup -= dt;
    if (enemy.windup <= 0 && lunge(enemy)) {
      enemy.lockTimer = 0.9; // extended punish window
      sfx.boost(); fx.ring(enemy.pos.x, enemy.pos.y, COLORS.red, 30, 0.35, 2.5);
    }
  } else if (enemy.lockTimer <= 0) {
    const toP = angle(sub(player.pos, enemy.pos));
    const facing = Math.abs(angleDiff(enemy.heading, toP)) < 0.5;
    const d = dist(enemy.pos, player.pos);
    if (facing && d > 90 && d < 300 && Math.random() < 0.05 * (dt * 60)) {
      if (V.is('hunter')) { enemy.windup = 0.4; sfx.blip(); }
      else if (boost(enemy)) {
        if (V.is('overdrive')) enemy.lockTimer = 0;
        sfx.boost(); fx.ring(enemy.pos.x, enemy.pos.y, COLORS.red, 24, 0.3, 2);
      }
    }
  }

  stepShip(player, sdt); stepShip(enemy, sdt);
  wrapEdges(player); wrapEdges(enemy);
  pushTrails();
  emitEngine(player); emitEngine(enemy);

  if (!player.dead && !enemy.dead) {
    applyBeam(player, enemy, sdt);
    applyBeam(enemy, player, sdt);
  }

  if (enemy.hp <= 0 && !enemy.dead) die(enemy, player);
  if (player.hp <= 0 && !player.dead) die(player, enemy);

  if (player.dead || enemy.dead) {
    state = 'death'; stateT = 0;
  }
  input.endFrame();
}

function updateDeath(dt) {
  // let the explosion + slow-mo play before resolving the round
  stateT += dt;
  if (slow > 0) slow = Math.max(0, slow - dt);
  stars.update(dt); fx.update(dt); pushTrails();
  if (stateT > 0.9) endRound(enemy.dead);
  input.endFrame();
}

// route 'death' through update via a wrapper
const baseUpdate = update;
function masterUpdate(dt) {
  if (V.update(input)) { reset(true); input.endFrame(); return; }
  if (state === 'death') return updateDeath(dt);
  return baseUpdate(dt);
}

function wrapEdges(s) {
  const m = 14;
  if (s.pos.x < m) s.pos.x = m; if (s.pos.x > W - m) s.pos.x = W - m;
  if (s.pos.y < m) s.pos.y = m; if (s.pos.y > H - m) s.pos.y = H - m;
}
function pushTrails() {
  for (const s of [player, enemy]) {
    if (s.dead) continue;
    s.trail.push({ x: s.pos.x, y: s.pos.y });
    if (s.trail.length > 18) s.trail.shift();
  }
}
function emitEngine(s) {
  if (s.dead) return;
  const back = fromAngle(s.heading + Math.PI, 12);
  const boosting = s.boosting > 0;
  fx.trail(s.pos.x + back.x, s.pos.y + back.y, boosting ? '#ffffff' : s.color, -fromAngle(s.heading, 60).x, -fromAngle(s.heading, 60).y, boosting ? 2.6 : 1.6);
}

// ---------- render ----------
function drawShip(s) {
  if (s.dead) return;
  const a = s.heading;
  // trail
  for (let i = 0; i < s.trail.length; i++) {
    const p = s.trail[i], al = i / s.trail.length;
    ctx.globalAlpha = al * 0.5; ctx.fillStyle = s.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, al * 2.4, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // charge telegraph (hunter): the enemy winds up before it commits — your cue to juke
  if (s.windup > 0) {
    const cr = 14 + (0.4 - s.windup) * 60;
    r.circle(s.pos, Math.max(6, cr), COLORS.red, { fill: false, w: 2, glow: 14 });
    r.text('CHARGING', s.pos.x, s.pos.y - 24, COLORS.red, 'bold 9px monospace', { glow: 8, align: 'center' });
  }

  // committed (locked) indicator — pulsing amber ring + forward commit vector
  if (s.lockTimer > 0) {
    const exposed = V.is('hunter') && s === enemy;
    const ringCol = exposed ? '#ffffff' : COLORS.amber;
    const pulse = 16 + Math.sin(tclock * 22) * 2;
    r.circle(s.pos, pulse, ringCol, { fill: false, w: exposed ? 2 : 1.5, glow: exposed ? 16 : 10 });
    const tip = fromAngle(s.heading, 34);
    r.line(s.pos, { x: s.pos.x + tip.x, y: s.pos.y + tip.y }, ringCol, 1, 6);
    // vulnerability bracket so the player learns to punish
    r.text(exposed ? 'EXPOSED' : 'LOCKED', s.pos.x, s.pos.y - 24, ringCol, 'bold 9px monospace', { glow: 8, align: 'center' });
  }

  // hull
  const col = s.flash > 0 ? '#ffffff' : s.color;
  r.poly([
    { x: s.pos.x + Math.cos(a) * 15, y: s.pos.y + Math.sin(a) * 15 },
    { x: s.pos.x + Math.cos(a + 2.5) * 11, y: s.pos.y + Math.sin(a + 2.5) * 11 },
    { x: s.pos.x + Math.cos(a + Math.PI) * 5, y: s.pos.y + Math.sin(a + Math.PI) * 5 },
    { x: s.pos.x + Math.cos(a - 2.5) * 11, y: s.pos.y + Math.sin(a - 2.5) * 11 },
  ], col, { fill: false, w: 2, glow: 12 });
  // core
  r.circle(s.pos, 2.2, '#ffffff', { glow: 8 });
}

function drawBeam(shooter, target) {
  if (!shooter.beamZone || shooter.dead || target.dead) return;
  const hot = shooter.beamZone === 'rear';
  const nose = fromAngle(shooter.heading, 15);
  const a = { x: shooter.pos.x + nose.x, y: shooter.pos.y + nose.y };
  r.line(a, target.pos, hot ? '#ffffff' : shooter.color, hot ? 3 : 1.6, 12);
  r.circle(target.pos, hot ? 7 : 4, hot ? '#ffffff' : shooter.color, { fill: false, w: 1.5, glow: 10 });
}

function shieldBar(x, y, hp, color, right) {
  const w = 150, h = 9, p = Math.max(0, hp) / 100;
  ctx.globalAlpha = 0.25; ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
  ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = color; ctx.fillStyle = color;
  ctx.fillRect(right ? x + w - w * p : x, y, w * p, h); ctx.restore();
  ctx.strokeStyle = color; ctx.globalAlpha = 0.5; ctx.strokeRect(x + 0.5, y + 0.5, w, h); ctx.globalAlpha = 1;
}

function pip(x, y, on, color) {
  r.circle({ x, y }, 5, color, on ? { glow: 8 } : { fill: false, w: 1.2 });
}

function render() {
  r.clear(COLORS.bg);
  stars.draw(ctx);
  // subtle grid
  ctx.globalAlpha = 1;
  for (let x = 40; x < W; x += 48) r.line({ x, y: 12 }, { x, y: H - 12 }, COLORS.grid, 1);
  for (let y = 40; y < H; y += 48) r.line({ x: 12, y }, { x: W - 12, y }, COLORS.grid, 1);

  ctx.save();
  fx.applyShake(ctx);
  drawBeam(player, enemy); drawBeam(enemy, player);
  drawShip(enemy); drawShip(player);
  fx.draw(ctx);
  ctx.restore();

  drawFrame(ctx, W, H);

  // HUD: status bar
  r.text('SIM-A · NULL-G DUEL', 22, 30, COLORS.text, '12px monospace', { glow: 4 });
  // observers flavor (pulsing)
  ctx.globalAlpha = 0.4 + 0.3 * Math.abs(Math.sin(tclock * 1.4));
  r.text('● OBSERVED', W - 104, 30, COLORS.amber, '11px monospace');
  ctx.globalAlpha = 1;
  // round pips
  r.text('ROUND ' + round + ' / 3', W / 2, 28, COLORS.text, '12px monospace', { align: 'center', glow: 4 });
  pip(W / 2 - 30, 42, pWins >= 1, COLORS.blue); pip(W / 2 - 14, 42, pWins >= 2, COLORS.blue);
  pip(W / 2 + 14, 42, eWins >= 1, COLORS.red); pip(W / 2 + 30, 42, eWins >= 2, COLORS.red);

  drawVariantHUD(r, ctx, W, H, V, COLORS.textDim);

  // per-variant hint
  const hint = V.is('hunter') ? 'bait the charge · juke it · kill from behind while EXPOSED'
    : V.is('overdrive') ? 'no lag anywhere — is it better or just flat?'
      : 'hard turns and boosts commit YOU · plan your maneuvers';
  r.text(hint, W / 2, H - 16, COLORS.textDim, '10px monospace', { align: 'center' });

  // shields
  r.text('YOU', 22, H - 30, COLORS.blue, '11px monospace');
  shieldBar(22, H - 24, player.dead ? 0 : player.hp, COLORS.blue, false);
  r.text('CADET-X', W - 172, H - 30, COLORS.red, '11px monospace');
  shieldBar(W - 172, H - 24, enemy.dead ? 0 : enemy.hp, COLORS.red, true);

  drawCRT(ctx, W, H, tclock);

  if (input.isTouch && state === 'play') drawButton(r, boostBtn, 'BOOST', COLORS.amber, boostBtn._held);

  // overlays
  if (state === 'intro') {
    const n = Math.max(1, Math.ceil(1.6 - stateT));
    bigText(stateT < 0.4 ? 'ROUND ' + round : (stateT > 1.4 ? 'ENGAGE' : String(n)));
  } else if (state === 'roundover' || state === 'matchover') {
    bigText(msg, state === 'matchover' ? (pWins === 2 ? COLORS.blue : COLORS.red) : COLORS.white);
    r.text('press SPACE', W / 2, H / 2 + 34, COLORS.text, '13px monospace', { align: 'center' });
  }
}

function bigText(s, color = COLORS.white) {
  ctx.save();
  ctx.globalAlpha = 0.55; ctx.fillStyle = '#02040a'; ctx.fillRect(W / 2 - 210, H / 2 - 42, 420, 68);
  ctx.globalAlpha = 0.5; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.shadowBlur = 12; ctx.shadowColor = color;
  ctx.strokeRect(W / 2 - 210, H / 2 - 42, 420, 68);
  ctx.restore();
  r.text(s, W / 2, H / 2 + 6, color, 'bold 30px monospace', { align: 'center', glow: 16 });
}

createLoop({ update: masterUpdate, render }).start();
