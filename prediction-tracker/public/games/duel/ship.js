import { fromAngle, add, scale, angleDiff } from '../engine/vec.js';

const HARD_TURN = 1.2;          // rad: a desired-heading change bigger than this commits you
export const LOCK_DURATION = 0.35; // s: committed window after a hard turn
const BOOST_MULT = 1.8;
export const BOOST_LOCK = 0.5;  // s: committed window after a boost
export const LUNGE_DURATION = 0.45; // s: a lunge is a chosen commitment — no steering while it lasts
export const LUNGE_MULT = 2.3;
export const LUNGE_COOLDOWN = 1.1;

export function createShip({ pos, heading = 0, speed = 160, turnRate = 3.2, color = '#36e0ff', commitOnTurn = true }) {
  return { pos: { ...pos }, heading, desired: heading, speed, turnRate, color, commitOnTurn, lockTimer: 0, boosting: 0, boostMult: BOOST_MULT, lungeCd: 0, alive: true };
}

// Returns false if the order is rejected because the ship is committed (locked).
export function setDesiredHeading(ship, rad) {
  if (ship.lockTimer > 0) return false;
  const delta = Math.abs(angleDiff(ship.heading, rad));
  ship.desired = rad;
  if (ship.commitOnTurn && delta > HARD_TURN) ship.lockTimer = LOCK_DURATION; // a hard turn commits you
  return true;
}

export function boost(ship) {
  if (ship.lockTimer > 0) return false;
  ship.lockTimer = BOOST_LOCK;
  ship.boosting = BOOST_LOCK;
  ship.boostMult = BOOST_MULT;
  return true;
}

// A lunge is stronger than a boost and always commits — power the player opts into.
export function lunge(ship) {
  if (ship.lockTimer > 0 || ship.lungeCd > 0) return false;
  ship.lockTimer = LUNGE_DURATION;
  ship.boosting = LUNGE_DURATION;
  ship.boostMult = LUNGE_MULT;
  ship.lungeCd = LUNGE_COOLDOWN;
  return true;
}

// Always executes toward the (committed) desired heading; only NEW orders are gated by lock.
export function stepShip(ship, dt) {
  ship.lockTimer = Math.max(0, ship.lockTimer - dt);
  ship.lungeCd = Math.max(0, ship.lungeCd - dt);
  const d = angleDiff(ship.heading, ship.desired);
  const max = ship.turnRate * dt;
  ship.heading += Math.max(-max, Math.min(max, d));
  let spd = ship.speed;
  if (ship.boosting > 0) { spd *= ship.boostMult; ship.boosting = Math.max(0, ship.boosting - dt); }
  ship.pos = add(ship.pos, scale(fromAngle(ship.heading), spd * dt));
  return ship;
}
