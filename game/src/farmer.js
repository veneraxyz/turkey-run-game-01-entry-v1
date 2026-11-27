// farmer.js — the farmer AI: chase, search, and corner the turkey.
// One job: decide how fast the farmer closes the gap, and when he lunges.
// The farmer is drawn behind the turkey; his "gap" is the distance in px
// between him and the turkey. Gap 0 = caught. Gap recovers while the
// turkey runs clean, so clean play outruns him and mistakes let him in.

export const FARMER_MAX_GAP = 320;
export const FARMER_CATCH_GAP = 0;

export function createFarmer() {
  return {
    gap: 220,          // px behind the turkey
    mode: 'chase',     // 'chase' | 'search' | 'corner'
    runPhase: 0,
    lungeTimer: 0,     // countdown to the next cornering lunge
    lungeActive: 0,    // seconds left of an active lunge
    shoutTimer: 0,     // "HEY! GET BACK HERE!" bubble timer
    spotted: false,    // true while the farmer is close enough to alarm
  };
}

// difficulty: 0..1 as the run progresses (distance / 1000).
// events: { hit: boolean } — true on a frame the turkey took a hit.
// Returns 'caught' when the gap closes to zero, else null.
export function updateFarmer(f, dt, difficulty, events, now) {
  f.runPhase += dt * 12;

  // --- SEARCH: when the gap is wide the farmer loses the trail and
  // wanders, giving the player breathing room (gap drifts back in).
  if (f.gap > 240) {
    f.mode = 'search';
    f.gap -= 14 * dt; // he wanders forward, slowly closing in
  } else {
    f.mode = 'chase';
  }

  // --- CHASE: steady pressure, stronger as the stages get harder.
  const chaseRate = 6 + difficulty * 16; // px per second
  f.gap -= chaseRate * dt;

  // Clean running earns distance back: the turkey is faster than him.
  const recoverRate = 14;
  f.gap += recoverRate * dt;

  // A hit stumbles the turkey: the farmer gains a big chunk at once.
  if (events.hit) {
    f.gap -= 70;
    f.shoutTimer = 1.4;
  }

  // --- CORNER: every so often he cuts across the yard and lunges.
  // Telegraph: shout + a short wind-up, then the gap collapses fast.
  f.lungeTimer -= dt;
  if (f.lungeTimer <= 0 && f.gap < 200) {
    f.mode = 'corner';
    f.lungeActive = 0.9;
    f.lungeTimer = 6 + Math.random() * 3; // next lunge (live play only)
    f.shoutTimer = 1.2;
  }
  if (f.lungeActive > 0) {
    f.lungeActive -= dt;
    f.gap -= 95 * dt; // lunging closes the gap fast
    if (f.lungeActive <= 0) f.mode = 'chase';
  }

  if (f.shoutTimer > 0) f.shoutTimer -= dt;

  f.gap = Math.max(0, Math.min(FARMER_MAX_GAP, f.gap));
  const wasSpotted = f.spotted;
  f.spotted = f.gap < 90;
  if (f.spotted && !wasSpotted) return 'spotted';
  if (f.gap <= FARMER_CATCH_GAP) return 'caught';
  return null;
}

// Screen x of the farmer, given the turkey's screen x.
export function farmerScreenX(f, turkeyX) {
  return turkeyX - f.gap - 46;
}

// How panicked the farmer looks: 0 (relaxed search) .. 1 (on the heels).
export function farmerUrgency(f) {
  return 1 - f.gap / FARMER_MAX_GAP;
}
