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
