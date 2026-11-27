// shots.js — deterministic screenshot states for Turkey Run.
// One job: build a fixed, seeded game snapshot for each ?shot= mode so
// screenshots render identically every time. No randomness here: every
// position comes from the seeded rng, and the snapshot never advances.

import { mulberry32, createHazardField, stageFor } from './hazards.js';
import { createTurkey } from './turkey.js';
import { createFarmer } from './farmer.js';

export const SHOT_MODES = ['cover', 'play', 'chase', 'escaped'];

// Build a full game snapshot for a shot. `seed` defaults to 1.
export function buildShotState(mode, seed) {
  const rng = mulberry32(seed || 1);
  const turkey = createTurkey();
  const farmer = createFarmer();
  const hazards = createHazardField();

  const base = {
    state: 'playing',
    score: 0,
    distance: 0,
    lives: 3,
    cornCount: 0,
    speed: 260,
    scroll: 0,
    time: 2.4, // fixed clock so leaves/heat shimmer are identical
    turkey,
    farmer,
    hazards,
    stage: stageFor(0),
  };

  if (mode === 'cover') {
    base.state = 'title';
    base.scroll = 300;
    // A lively yard behind the title panel: turkey mid-run, farmer near.
    turkey.x = 220; turkey.y = 600; turkey.runPhase = 1.2;
    farmer.gap = 180; farmer.mode = 'chase'; farmer.runPhase = 0.8;
    hazards.corn = [
      { x: 520, y: 522, taken: false },
      { x: 564, y: 480, taken: false },
      { x: 608, y: 522, taken: false },
    ];
    hazards.obstacles = [{ kind: 'fence', x: 760, y: 600, w: 26, h: 64 }];
    return base;
  }

  if (mode === 'play') {
    base.distance = 180;
    base.score = 240;
    base.cornCount = 14;
    base.speed = 300;
    base.scroll = 1800;
    base.stage = stageFor(180);
    turkey.y = 600 - 90; // mid-jump over a fence
    turkey.grounded = false;
    turkey.vy = -300;
    turkey.runPhase = 2.1;
    farmer.gap = 140; farmer.mode = 'chase'; farmer.runPhase = 1.4;
    hazards.obstacles = [
      { kind: 'fence', x: 320, y: 600, w: 26, h: 64 },
      { kind: 'hay', x: 900, y: 600, w: 74, h: 52 },
    ];
    hazards.corn = [
      { x: 460, y: 522, taken: false },
      { x: 504, y: 480, taken: false },
      { x: 548, y: 522, taken: false },
      { x: 1060, y: 522, taken: false },
    ];
    hazards.feathers = [{ x: 700, y: 490, taken: false, bob: 1.5 }];
    return base;
  }

  if (mode === 'chase') {
    base.distance = 620;
    base.score = 810;
    base.cornCount = 31;
    base.lives = 2;
    base.speed = 380;
    base.scroll = 6200;
    base.stage = stageFor(620);
    turkey.y = 600; turkey.runPhase = 3.3;
    farmer.gap = 42; farmer.mode = 'corner'; farmer.runPhase = 2.2;
    farmer.shoutTimer = 1.2; farmer.lungeActive = 0.5;
    hazards.obstacles = [
      { kind: 'oven', x: 620, y: 600, w: 130, h: 46, hot: true },
      { kind: 'fence', x: 1020, y: 600, w: 26, h: 64 },
    ];
    hazards.knives = [
      { x: 300, y: 300, vy: 380, vx: 0, spin: 1.1, kind: 'fall' },
      { x: 880, y: 470, vy: 0, vx: -520, spin: 2.4, kind: 'thrown' },
    ];
    hazards.corn = [{ x: 1120, y: 522, taken: false }];
    return base;
  }

  if (mode === 'escaped') {
    base.state = 'escaped';
    base.distance = 1000;
    base.score = 1420;
    base.cornCount = 52;
    base.speed = 420;
    base.scroll = 10000;
    base.stage = stageFor(1000);
    turkey.x = 1150; turkey.y = 600; turkey.runPhase = 0.6;
    farmer.gap = 320; farmer.mode = 'search'; farmer.runPhase = 0.4;
    hazards.corn = [
      { x: 420, y: 522, taken: false },
      { x: 464, y: 480, taken: false },
    ];
    return base;
  }

  return base;
}

// Parse the shot query (?shot=cover&seed=1) from the page URL.
export function parseShotQuery(search) {
  const params = new URLSearchParams(search || '');
  const shot = params.get('shot');
  if (!shot || !SHOT_MODES.includes(shot)) return null;
  const seed = parseInt(params.get('seed') || '1', 10);
  return { shot, seed: Number.isFinite(seed) ? seed : 1 };
}
