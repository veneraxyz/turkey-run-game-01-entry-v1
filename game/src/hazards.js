// hazards.js — ovens, carving knives, corn and feathers.
// One job: spawn, move, and collide everything that is not the turkey
// or the farmer. All randomness comes from the seeded rng the game hands
// in, so a fixed seed replays the same yard every time.

// mulberry32 — small deterministic RNG, written here, no library.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createHazardField() {
  return {
    obstacles: [], // fences, hay bales, ovens — things to jump or avoid
    knives: [],    // falling and thrown carving knives
    corn: [],      // pickups: +10 score
    feathers: [],  // pickups: brief speed boost
    spawnX: 1350, // just off the right edge
    nextSpawnIn: 1.2, // seconds until the next spawn wave
    knifeTimer: 3.0,
  };
}

// Stage names by distance (meters). The yard grows harder as you run.
export function stageFor(distance) {
  if (distance < 400) return { name: 'FARMYARD', idx: 0 };
  if (distance < 800) return { name: 'KITCHEN', idx: 1 };
  return { name: 'FREEDOM GATE', idx: 2 };
}

function pickSpawn(rng, stageIdx, difficulty) {
  const roll = rng();
  if (stageIdx === 0) {
    // Farmyard: fences and hay bales to jump, corn trails to follow.
    if (roll < 0.42) return 'fence';
    if (roll < 0.62) return 'hay';
    if (roll < 0.9) return 'corn';
    return 'feather';
  }
  if (stageIdx === 1) {
    // Kitchen: hot ovens on the floor, more knives, less corn.
    if (roll < 0.3) return 'oven';
    if (roll < 0.5) return 'fence';
    if (roll < 0.66) return 'knifeRain';
    if (roll < 0.88) return 'corn';
    return 'feather';
  }
  // Freedom gate: a last sprint — fences and corn, knives still falling.
  if (roll < 0.4) return 'fence';
  if (roll < 0.55) return 'knifeRain';
  if (roll < 0.9) return 'corn';
  return 'feather';
}

function spawnOne(field, kind, x, rng) {
  if (kind === 'fence') field.obstacles.push({ kind: 'fence', x, y: 600, w: 26, h: 64 });
  else if (kind === 'hay') field.obstacles.push({ kind: 'hay', x, y: 600, w: 74, h: 52 });
  else if (kind === 'oven') field.obstacles.push({ kind: 'oven', x, y: 600, w: 130, h: 46, hot: true });
  else if (kind === 'corn') {
    for (let i = 0; i < 3; i++) {
      field.corn.push({ x: x + i * 44, y: 600 - 78 - (i === 1 ? 42 : 0), taken: false });
    }
  } else if (kind === 'feather') {
    field.feathers.push({ x, y: 600 - 110, taken: false, bob: rng() * 6 });
  } else if (kind === 'knifeRain') {
    field.knives.push({ x: x + rng() * 120, y: -40, vy: 320 + rng() * 120, vx: 0, spin: rng() * 6, kind: 'fall' });
  }
}

export function updateHazards(field, dt, speed, distance, rng, difficulty) {
  const stage = stageFor(distance);
  field.nextSpawnIn -= dt;
  if (field.nextSpawnIn <= 0) {
    const kind = pickSpawn(rng, stage.idx, difficulty);
    spawnOne(field, kind, field.spawnX, rng);
    // Spawn waves tighten as the run gets harder.
    field.nextSpawnIn = Math.max(0.55, 1.35 - difficulty * 0.55) * (0.8 + rng() * 0.4);
  }

  // Kitchen stage throws knives sideways across the yard.
  field.knifeTimer -= dt;
  if (stage.idx === 1 && field.knifeTimer <= 0) {
    field.knives.push({ x: field.spawnX, y: 600 - 130 - rng() * 160, vy: 0, vx: -(380 + difficulty * 160), spin: rng() * 6, kind: 'thrown' });
    field.knifeTimer = Math.max(1.4, 3.2 - difficulty * 1.4);
  }

  const move = (list) => {
    for (const o of list) o.x -= speed * dt;
    return list.filter((o) => o.x > -220);
  };
  field.obstacles = move(field.obstacles);
  field.corn = move(field.corn);
  field.feathers = move(field.feathers);
  for (const k of field.knives) {
    // Falling knives drift with the scrolling world; thrown knives fly
    // across it on their own, faster than the scroll.
    if (k.kind === 'fall') { k.x -= speed * dt * 0.55; k.y += k.vy * dt; k.spin += dt * 9; }
    else { k.x += k.vx * dt; k.spin += dt * 12; }
  }
  field.knives = field.knives.filter((k) => k.x > -160 && k.y < 760);
}

// Collision pass. Returns { hit, corn, feather } counts for this frame.
// `now` is game time; invincible turkeys take no hits.
export function collideHazards(field, turkeyBox, invincible) {
  const out = { hit: false, corn: 0, feather: false };
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  if (!invincible) {
    for (const o of field.obstacles) {
      const box = o.kind === 'oven'
        ? { x: o.x - 8, y: o.y - o.h, w: o.w + 16, h: o.h } // oven heat spills past its edges
        : { x: o.x - 6, y: o.y - o.h, w: o.w + 12, h: o.h };
      if (overlap(turkeyBox, box)) { out.hit = true; break; }
    }
    if (!out.hit) {
      for (const k of field.knives) {
        const box = { x: k.x - 12, y: k.y - 14, w: 24, h: 34 };
        if (overlap(turkeyBox, box)) { out.hit = true; break; }
      }
    }
  }

  for (const c of field.corn) {
    if (!c.taken && overlap(turkeyBox, { x: c.x - 18, y: c.y - 18, w: 36, h: 36 })) {
      c.taken = true;
      out.corn++;
    }
  }
  field.corn = field.corn.filter((c) => !c.taken);

  for (const f of field.feathers) {
    if (!f.taken && overlap(turkeyBox, { x: f.x - 20, y: f.y - 20, w: 40, h: 40 })) {
      f.taken = true;
      out.feather = true;
    }
  }
  field.feathers = field.feathers.filter((f) => !f.taken);
  return out;
}
