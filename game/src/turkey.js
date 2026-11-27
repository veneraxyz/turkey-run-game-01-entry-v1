// turkey.js — the player: a turkey escaping Thanksgiving dinner.
// One job: movement, jumping, animation state, and getting hurt.
// Drawing lives in render.js; physics constants live here.

export const GROUND_Y = 600;
export const GRAVITY = 2400;
export const JUMP_VELOCITY = -820;

export function createTurkey() {
  return {
    x: 220,            // fixed screen x; the world scrolls past
    y: GROUND_Y,       // feet position
    vy: 0,
    grounded: true,
    width: 64,
    height: 62,
    runPhase: 0,       // leg animation cycle
    flapPhase: 0,      // wing flutter while airborne
    facing: 1,
    invincibleUntil: 0, // timestamp (game time) — flicker while active
    boostUntil: 0,      // feather speed boost expiry (game time)
    squash: 0,          // landing squash timer
  };
}

// Horizontal speed is set by the game (difficulty ramp); the turkey adds
// a little steering: left/right arrows nudge within a safe band.
export function updateTurkey(t, input, dt, speed, now) {
  const steer = 170;
  if (input.down('ArrowLeft', 'a')) t.x -= steer * dt;
  if (input.down('ArrowRight', 'd')) t.x += steer * dt;
  t.x = Math.max(90, Math.min(420, t.x));

  if (input.wasPressed(' ', 'ArrowUp', 'w') && t.grounded) {
    t.vy = JUMP_VELOCITY;
    t.grounded = false;
    t.flapPhase = 0;
    return 'jumped';
  }

  t.vy += GRAVITY * dt;
  t.y += t.vy * dt;
  if (t.y >= GROUND_Y) {
    if (!t.grounded && t.vy > 500) t.squash = 0.12; // hard landing
    t.y = GROUND_Y;
    t.vy = 0;
    t.grounded = true;
  }
  if (t.squash > 0) t.squash -= dt;

  const pace = speed / 260;
  t.runPhase += dt * 11 * pace;
  if (!t.grounded) t.flapPhase += dt * 16;
  return null;
}

export function turkeyBoosted(t, now) {
  return now < t.boostUntil;
}

export function turkeyInvincible(t, now) {
  return now < t.invincibleUntil;
}

// Called when a hazard lands a hit: knock the turkey up a little and
// grant a short mercy window so one knife cannot eat two lives at once.
export function hurtTurkey(t, now) {
  t.invincibleUntil = now + 1.6;
  if (t.grounded) {
    t.vy = -420;
    t.grounded = false;
  }
}

export function feedTurkeyFeather(t, now) {
  t.boostUntil = now + 3.0;
}

// Axis-aligned hit box (a little forgiving: the turkey's beak and tail
// are not part of the body the player feels).
export function turkeyHitBox(t) {
  return { x: t.x - 22, y: t.y - t.height + 6, w: 46, h: t.height - 8 };
}
