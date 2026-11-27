// main.js — Turkey Run: Thanksgiving Escape.
// One job: the game loop, the state machine (title → playing → caught /
// escaped → restart), the HUD, and the deterministic ?shot= modes.
// Wiring only: movement lives in turkey.js, the farmer in farmer.js,
// hazards in hazards.js, drawing in render.js, sound in audio.js.

import { Input } from './input.js';
import { AudioSys } from './audio.js';
import { createTurkey, updateTurkey, hurtTurkey, feedTurkeyFeather, turkeyHitBox, turkeyInvincible, turkeyBoosted, GROUND_Y } from './turkey.js';
import { createFarmer, updateFarmer, FARMER_MAX_GAP } from './farmer.js';
import { createHazardField, updateHazards, collideHazards, stageFor, mulberry32 } from './hazards.js';
import { drawFrame } from './render.js';
import { buildShotState, parseShotQuery } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const hudScore = document.getElementById('hud-score');
const hudDist = document.getElementById('hud-dist');
const hudLives = document.getElementById('hud-lives');
const hudStage = document.getElementById('hud-stage');
const hudCorn = document.getElementById('hud-corn');
const hudFarmer = document.getElementById('hud-farmer');
const hint = document.getElementById('hint');

const ESCAPE_DISTANCE = 1000; // meters to the freedom gate

function newGame(rngSeed) {
  return {
    state: 'title',
    score: 0,
    distance: 0,
    lives: 3,
    cornCount: 0,
    speed: 260,
    scroll: 0,
    time: 0,
    turkey: createTurkey(),
    farmer: createFarmer(),
    hazards: createHazardField(),
    stage: stageFor(0),
    rng: mulberry32(rngSeed == null ? (Date.now() % 2147483647) : rngSeed),
    shotMode: null,
    flash: 0, // red damage flash timer
  };
}

let game = newGame();
const input = new Input(canvas);
const audio = new AudioSys();

function startRun() {
  const keepRng = game.rng;
  game = newGame();
  game.rng = keepRng;
  game.state = 'playing';
  audio.unlock();
  audio.gobble();
}

function endRun(kind) {
  game.state = kind;
  if (kind === 'escaped') audio.escapeJingle();
  else audio.caughtJingle();
}

function updateHUD() {
  const show = game.state === 'playing';
  hud.style.display = show ? 'flex' : 'none';
  hint.style.display = show ? 'block' : 'none';
  if (!show) return;
  hudScore.textContent = 'SCORE ' + game.score;
  hudDist.textContent = Math.floor(game.distance) + ' m / ' + ESCAPE_DISTANCE + ' m';
  hudLives.innerHTML = '&#10084;'.repeat(game.lives) + '<span style="opacity:.25">' + '&#10084;'.repeat(3 - game.lives) + '</span>';
  hudStage.textContent = game.stage.name;
  hudCorn.innerHTML = '&#127829; ' + game.cornCount;
  const danger = 1 - game.farmer.gap / FARMER_MAX_GAP;
  hudFarmer.style.width = Math.round(danger * 100) + '%';
  hudFarmer.style.background = danger > 0.75 ? '#ff2e1f' : (danger > 0.5 ? '#ff8c1a' : '#e23b2e');
}

function update(dt) {
  game.time += dt;
  if (game.flash > 0) game.flash -= dt;

  if (game.state === 'title') {
    // Idle yard behind the title: the turkey paces, leaves drift.
    game.scroll += 20 * dt;
    game.turkey.runPhase += dt * 6;
    // Any click on the canvas or Space/Enter starts the run.
    if (input.wasPressed(' ', 'Enter') || input.wasClicked()) startRun();
    return;
  }

  if (game.state === 'caught' || game.state === 'escaped') {
    if (input.wasPressed('r', 'R', ' ', 'Enter') || input.wasClicked()) startRun();
    return;
  }

  // --- playing ---
  const difficulty = Math.min(1, game.distance / ESCAPE_DISTANCE);
  const boosted = turkeyBoosted(game.turkey, game.time);
  game.speed = (260 + difficulty * 160) * (boosted ? 1.35 : 1);
  game.scroll += game.speed * dt;
  game.distance += (game.speed * dt) / 28; // ~28 px per meter
  game.stage = stageFor(game.distance);

  const jumpEvent = updateTurkey(game.turkey, input, dt, game.speed, game.time);
  if (jumpEvent === 'jumped') audio.jump();

  const farmerEvent = updateFarmer(game.farmer, dt, difficulty, { hit: false }, game.time);
  if (farmerEvent === 'spotted') audio.spotted();
  if (farmerEvent === 'caught') { endRun('caught'); return; }

  updateHazards(game.hazards, dt, game.speed, game.distance, game.rng, difficulty);

  const hit = collideHazards(
    game.hazards,
    turkeyHitBox(game.turkey),
    turkeyInvincible(game.turkey, game.time)
  );
  if (hit.corn > 0) {
    game.cornCount += hit.corn;
    game.score += hit.corn * 10;
    audio.corn();
  }
  if (hit.feather) {
    feedTurkeyFeather(game.turkey, game.time);
    audio.feather();
  }
  if (hit.hit) {
    game.lives -= 1;
    game.flash = 0.35;
    hurtTurkey(game.turkey, game.time);
    audio.hurt();
    // The stumble lets the farmer surge forward.
    updateFarmer(game.farmer, 0, difficulty, { hit: true }, game.time);
    if (game.lives <= 0) { endRun('caught'); return; }
  }

  game.score = Math.max(game.score, Math.floor(game.distance) + game.cornCount * 10);

  if (game.distance >= ESCAPE_DISTANCE) { endRun('escaped'); return; }

  if (input.wasPressed('m', 'M')) {
    const muted = audio.toggleMute();
    hudStage.textContent = game.stage.name + (muted ? ' · MUTED' : '');
  }
}

function render() {
  drawFrame(ctx, game, game.time);
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(220,30,20,${game.flash * 0.9})`;
    ctx.fillRect(0, 0, 1280, 720);
  }
}

// Debug handle for play-testing (read-only state inspection).
window.__turkeyRun = { get state() { return game.state; }, get game() { return game; } };

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.shotMode) update(dt);
  render();
  updateHUD();
  input.endFrame();
  requestAnimationFrame(loop);
}

// --- Deterministic screenshot mode: ?shot=cover|play|chase|escaped&seed=1
// The snapshot is built once and never advances, so the render is stable.
const shot = parseShotQuery(window.location.search);
if (shot) {
  const snap = buildShotState(shot.shot, shot.seed);
  game = Object.assign(newGame(shot.seed), snap, { shotMode: shot.shot, rng: mulberry32(shot.seed) });
  // HUD visible on gameplay shots, hidden on title/end shots (they draw
  // their own panels).
  const showHud = shot.shot === 'play' || shot.shot === 'chase';
  hud.style.display = showHud ? 'flex' : 'none';
  if (showHud) {
    game.state = 'playing';
    updateHUD();
  }
  document.title = 'Turkey Run — shot: ' + shot.shot;
  drawFrame(ctx, game, game.time);
} else {
  updateHUD();
  requestAnimationFrame(loop);
}
