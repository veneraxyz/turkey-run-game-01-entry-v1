// render.js — all procedural drawing for Turkey Run.
// One job: paint the turkey, the farmer, the farm, the kitchen, the
// autumn palette, the HUD screens and the end screens. No images, no
// fonts loaded from anywhere: every shape is canvas primitives.

// Autumn palette, shared by every scene.
export const PALETTE = {
  skyTop: '#f9b95c', skyMid: '#f7c873', skyBot: '#f2a65a',
  kitchenTop: '#e8956b', kitchenMid: '#d97b4f', kitchenBot: '#b85c38',
  ground: '#8a5a2b', groundTop: '#a06a33', grass: '#c98a3d',
  barnRed: '#a63d2a', barnDark: '#7e2c1e', wood: '#6e4a22',
  turkeyBrown: '#7a4a21', turkeyDark: '#5d3617', feather: '#8b5a2b',
  wattleRed: '#d9382b', beakOrange: '#f59e0b',
  farmerBlue: '#3b5a8a', farmerShirt: '#4a6fa5', farmerSkin: '#e8b88a',
  ovenGrey: '#5a5a60', ovenHot: '#ff7a1a', knifeSteel: '#d7dde3',
  cornYellow: '#ffd23e', featherWhite: '#fff6e0',
  leafOrange: '#e8722a', leafRed: '#c0392b', leafGold: '#f1c40f',
};

const W = 1280, H = 720;

function skyGradient(ctx, stageIdx) {
  const g = ctx.createLinearGradient(0, 0, 0, 620);
  if (stageIdx === 1) {
    g.addColorStop(0, PALETTE.kitchenTop); g.addColorStop(0.6, PALETTE.kitchenMid); g.addColorStop(1, PALETTE.kitchenBot);
  } else {
    g.addColorStop(0, PALETTE.skyTop); g.addColorStop(0.6, PALETTE.skyMid); g.addColorStop(1, PALETTE.skyBot);
  }
  return g;
}

function drawSun(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath(); ctx.arc(x, y, 46, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,243,196,.55)'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(x, y, 60, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawCloud(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,248,231,.85)';
  ctx.beginPath();
  ctx.arc(x, y, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 28 * s, y - 8 * s, 30 * s, 0, Math.PI * 2);
  ctx.arc(x + 58 * s, y, 24 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Deterministic leaf scatter: positions come from a fixed table so the
// scene is identical every frame (no per-frame randomness).
const LEAF_SPOTS = [];
for (let i = 0; i < 26; i++) {
  const a = (i * 2654435761) % 100000 / 100000;
  const b = (i * 40503) % 100000 / 100000;
  LEAF_SPOTS.push({ x: a * W, y: 60 + b * 420, c: i % 3, s: 0.7 + (b * 0.8), ph: a * 6.28 });
}

function drawLeaves(ctx, time, scroll) {
  const colors = [PALETTE.leafOrange, PALETTE.leafRed, PALETTE.leafGold];
  ctx.save();
  for (const l of LEAF_SPOTS) {
    const x = ((l.x - scroll * 0.35) % (W + 60) + W + 60) % (W + 60) - 30;
    const y = l.y + Math.sin(time * 1.4 + l.ph) * 9;
    ctx.fillStyle = colors[l.c];
    ctx.beginPath();
    ctx.ellipse(x, y, 7 * l.s, 4 * l.s, Math.sin(time + l.ph) * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFarmBackground(ctx, stageIdx, scroll, time) {
  // Sky + sun + clouds.
  ctx.fillStyle = skyGradient(ctx, stageIdx);
  ctx.fillRect(0, 0, W, 620);
  drawSun(ctx, 1080, 96);
  drawCloud(ctx, ((180 - scroll * 0.08) % 1400 + 1400) % 1400 - 60, 110, 1);
  drawCloud(ctx, ((720 - scroll * 0.05) % 1400 + 1400) % 1400 - 60, 170, 0.8);
  drawCloud(ctx, ((1050 - scroll * 0.11) % 1400 + 1400) % 1400 - 60, 70, 1.2);

  if (stageIdx === 0) {
    // Barn, fence line and haystacks on the horizon.
    const bx = ((240 - scroll * 0.5) % 1500 + 1500) % 1500 - 110;
    drawBarn(ctx, bx, 470);
    ctx.fillStyle = PALETTE.wood;
    for (let i = 0; i < 14; i++) {
      const fx = ((i * 120 - scroll * 0.85) % 1440 + 1440) % 1440 - 40;
      ctx.fillRect(fx, 540, 8, 62);
    }
    ctx.fillRect(0, 552, W, 8);
    drawHaystack(ctx, ((900 - scroll * 0.6) % 1500 + 1500) % 1500 - 80, 560);
  } else if (stageIdx === 1) {
    // Kitchen: big window, hanging pans, tiled wall band.
    ctx.fillStyle = 'rgba(255,240,200,.28)';
    ctx.fillRect(80, 90, 300, 240);
    ctx.fillStyle = '#7e4a26';
    ctx.fillRect(80, 90, 300, 12); ctx.fillRect(80, 318, 300, 12);
    ctx.fillRect(80, 90, 12, 240); ctx.fillRect(368, 90, 12, 240);
    ctx.strokeStyle = '#7e4a26'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(230, 90); ctx.lineTo(230, 330); ctx.moveTo(80, 210); ctx.lineTo(380, 210); ctx.stroke();
    // Hanging copper pans.
    for (let i = 0; i < 3; i++) {
      const px = 560 + i * 130;
      ctx.strokeStyle = '#5d3a1a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(px, 60); ctx.lineTo(px, 110); ctx.stroke();
      ctx.fillStyle = '#b87333';
      ctx.beginPath(); ctx.arc(px, 140, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a2b';
      ctx.beginPath(); ctx.arc(px, 140, 24, 0, Math.PI * 2); ctx.fill();
    }
    // Roasting pan on the counter, back wall.
    ctx.fillStyle = '#3d3d44';
    ctx.fillRect(980, 470, 220, 60);
    ctx.fillStyle = '#ff7a1a';
    ctx.beginPath(); ctx.ellipse(1090, 470, 60, 14, 0, Math.PI, 0); ctx.fill();
  } else {
    // Freedom gate: white picket fence + open gate + green hills.
    ctx.fillStyle = '#7fb069';
    ctx.beginPath(); ctx.moveTo(0, 620); ctx.quadraticCurveTo(320, 480, 640, 580);
    ctx.quadraticCurveTo(960, 660, 1280, 540); ctx.lineTo(1280, 620); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f5efe0';
    for (let i = 0; i < 16; i++) {
      const fx = i * 82;
      ctx.fillRect(fx, 520, 14, 84);
      ctx.beginPath(); ctx.moveTo(fx, 520); ctx.lineTo(fx + 7, 506); ctx.lineTo(fx + 14, 520); ctx.fill();
    }
    ctx.fillRect(0, 556, W, 8);
    // The open gate, glowing.
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(1120, 420, 130, 184);
    ctx.fillStyle = '#2b7a3d';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('FREEDOM', 1185, 400);
  }
  drawLeaves(ctx, time, scroll);

  // Ground.
  ctx.fillStyle = PALETTE.groundTop;
  ctx.fillRect(0, 600, W, 14);
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, 614, W, 106);
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  for (let i = 0; i < 20; i++) {
    const gx = ((i * 97 - scroll) % 1400 + 1400) % 1400 - 60;
    ctx.fillRect(gx, 630, 46, 5);
  }
}

function drawBarn(ctx, x, baseY) {
  ctx.save();
  ctx.fillStyle = PALETTE.barnRed;
  ctx.fillRect(x, baseY - 130, 190, 130);
  ctx.fillStyle = PALETTE.barnDark;
  ctx.beginPath();
  ctx.moveTo(x - 12, baseY - 130); ctx.lineTo(x + 95, baseY - 200); ctx.lineTo(x + 202, baseY - 130);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f5efe0';
  ctx.fillRect(x + 70, baseY - 70, 50, 70);
  ctx.strokeStyle = '#f5efe0'; ctx.lineWidth = 4;
  ctx.strokeRect(x + 22, baseY - 112, 34, 34);
  ctx.strokeRect(x + 134, baseY - 112, 34, 34);
  ctx.restore();
}

function drawHaystack(ctx, x, baseY) {
  ctx.save();
  ctx.fillStyle = '#d9a441';
  ctx.beginPath(); ctx.arc(x, baseY, 62, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#b07f2a'; ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(x + i * 20, baseY - 58 + Math.abs(i) * 8); ctx.lineTo(x + i * 14, baseY - 4); ctx.stroke();
  }
  ctx.restore();
}

// --- The turkey ---
export function drawTurkey(ctx, t, time) {
  const bob = t.grounded ? Math.sin(t.runPhase) * 3 : 0;
  const squashY = t.squash > 0 ? 6 : 0;
  const blink = (t.invincibleUntil > time) && Math.floor(time * 14) % 2 === 0;
  ctx.save();
  ctx.translate(t.x, t.y + bob - squashY);
  if (blink) ctx.globalAlpha = 0.35;
  const flap = t.grounded ? Math.sin(t.runPhase) * 0.35 : Math.sin(t.flapPhase) * 0.9;

  // Tail fan.
  ctx.fillStyle = PALETTE.feather;
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(-26, -34);
    ctx.rotate(i * 0.32 - 0.15);
    ctx.beginPath(); ctx.ellipse(0, -22, 9, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = i % 2 ? '#a06a33' : PALETTE.feather;
    ctx.restore();
  }
  // Body.
  ctx.fillStyle = PALETTE.turkeyBrown;
  ctx.beginPath(); ctx.ellipse(0, -30, 30, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.turkeyDark;
  ctx.beginPath(); ctx.ellipse(0, -22, 26, 14, 0, 0, Math.PI); ctx.fill();
  // Wing.
  ctx.save();
  ctx.translate(-4, -32);
  ctx.rotate(-0.5 + flap);
  ctx.fillStyle = '#6b3f1d';
  ctx.beginPath(); ctx.ellipse(0, 0, 20, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Neck + head.
  ctx.strokeStyle = PALETTE.turkeyBrown; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(18, -48); ctx.quadraticCurveTo(30, -62, 30, -72); ctx.stroke();
  ctx.fillStyle = PALETTE.turkeyBrown;
  ctx.beginPath(); ctx.arc(30, -76, 13, 0, Math.PI * 2); ctx.fill();
  // Beak + wattle + snood.
  ctx.fillStyle = PALETTE.beakOrange;
  ctx.beginPath(); ctx.moveTo(38, -80); ctx.lineTo(52, -75); ctx.lineTo(38, -70); ctx.closePath(); ctx.fill();
  ctx.fillStyle = PALETTE.wattleRed;
  ctx.beginPath(); ctx.ellipse(34, -64, 4, 8, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.wattleRed;
  ctx.beginPath(); ctx.ellipse(44, -84, 3, 6, 0.4, 0, Math.PI * 2); ctx.fill();
  // Eye.
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(33, -80, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath(); ctx.arc(34, -80, 2, 0, Math.PI * 2); ctx.fill();
  // Legs (running).
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  const legSwing = t.grounded ? Math.sin(t.runPhase) * 10 : 6;
  ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(-8 + legSwing, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(8 - legSwing, 0); ctx.stroke();
  // Speed-boost sparkle.
  if (t.boostUntil > time) {
    ctx.fillStyle = '#fff6e0';
    for (let i = 0; i < 5; i++) {
      const a = time * 4 + i * 1.26;
      ctx.beginPath(); ctx.arc(-20 + Math.cos(a) * 34, -34 + Math.sin(a) * 26, 3, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// --- The farmer ---
export function drawFarmer(ctx, f, x, time) {
  const urgency = 1 - f.gap / 320;
  const runSwing = Math.sin(f.runPhase) * (10 + urgency * 8);
  ctx.save();
  ctx.translate(x, 600);
  // Legs.
  ctx.strokeStyle = '#2e3d55'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, -52); ctx.lineTo(-8 + runSwing, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -52); ctx.lineTo(8 - runSwing, 0); ctx.stroke();
  // Body: overalls + shirt.
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.fillRect(-20, -108, 40, 58);
  ctx.fillStyle = PALETTE.farmerBlue;
  ctx.fillRect(-20, -78, 40, 28);
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(-20, -80, 40, 6);
  // Arms reaching forward (he wants that turkey).
  ctx.strokeStyle = PALETTE.farmerShirt; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(14, -96); ctx.lineTo(34 + urgency * 8, -78 + Math.sin(f.runPhase) * 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(14, -88); ctx.lineTo(30, -62); ctx.stroke();
  // Head + hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath(); ctx.arc(0, -122, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5d3a1a';
  ctx.beginPath(); ctx.arc(-6, -118, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -118, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5d3a1a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -112, 8, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Straw hat.
  ctx.fillStyle = '#e8c85a';
  ctx.beginPath(); ctx.ellipse(0, -134, 30, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-14, -152, 28, 20);
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(-14, -136, 28, 5);
  // Shout bubble when he is close or lunging.
  if (f.shoutTimer > 0 || f.mode === 'corner') {
    ctx.fillStyle = '#fff8e7';
    ctx.strokeStyle = '#3a2312'; ctx.lineWidth = 2;
    const bw = 190, bh = 40;
    ctx.beginPath(); ctx.roundRect(10, -206, bw, bh, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(30, -166); ctx.lineTo(44, -150); ctx.lineTo(52, -166); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2312';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.mode === 'corner' ? 'GOTCHA NOW!' : 'HEY! GET BACK HERE!', 105, -180);
  }
  ctx.restore();
}

// --- Hazards & pickups ---
export function drawHazards(ctx, field, time) {
  for (const o of field.obstacles) {
    if (o.kind === 'fence') {
      ctx.fillStyle = PALETTE.wood;
      ctx.fillRect(o.x - 13, o.y - 64, 8, 64);
      ctx.fillRect(o.x + 5, o.y - 64, 8, 64);
      ctx.fillRect(o.x - 20, o.y - 58, 40, 8);
      ctx.fillRect(o.x - 20, o.y - 34, 40, 8);
    } else if (o.kind === 'hay') {
      drawHaystack(ctx, o.x, o.y);
    } else if (o.kind === 'oven') {
      // A kitchen oven, door glowing with heat.
      ctx.fillStyle = PALETTE.ovenGrey;
      ctx.fillRect(o.x - 65, o.y - 46, 130, 46);
      ctx.fillStyle = '#3d3d44';
      ctx.fillRect(o.x - 65, o.y - 46, 130, 10);
      const flick = 0.7 + Math.sin(time * 9 + o.x) * 0.3;
      ctx.fillStyle = `rgba(255,122,26,${flick})`;
      ctx.fillRect(o.x - 48, o.y - 36, 96, 26);
      ctx.fillStyle = '#ffd23e';
      ctx.fillRect(o.x - 48, o.y - 36, 96, 5);
      // Heat shimmer marks above the door.
      ctx.strokeStyle = 'rgba(255,122,26,.8)'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const hx = o.x - 40 + i * 40;
        ctx.beginPath();
        ctx.moveTo(hx, o.y - 52);
        ctx.quadraticCurveTo(hx + 6, o.y - 62, hx, o.y - 72);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff8e7';
      ctx.font = 'bold 13px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillText('HOT!', o.x, o.y - 80);
    }
  }
  for (const c of field.corn) {
    const bobY = Math.sin(time * 3 + c.x * 0.05) * 4;
    ctx.save();
    ctx.translate(c.x, c.y + bobY);
    ctx.rotate(0.5);
    ctx.fillStyle = PALETTE.cornYellow;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a90c';
    for (let i = -1; i <= 1; i++) { ctx.fillRect(i * 5 - 1, -12, 2, 24); }
    ctx.fillStyle = '#7fb069';
    ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(-8, 26); ctx.lineTo(8, 26); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  for (const f of field.feathers) {
    const bobY = Math.sin(time * 2.5 + f.bob) * 6;
    ctx.save();
    ctx.translate(f.x, f.y + bobY);
    ctx.fillStyle = PALETTE.featherWhite;
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 18, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9c48a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, 16); ctx.stroke();
    ctx.restore();
  }
  for (const k of field.knives) {
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(k.spin);
    // Carving knife: steel blade + wooden handle.
    ctx.fillStyle = PALETTE.knifeSteel;
    ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(10, 6); ctx.lineTo(0, 12); ctx.lineTo(-10, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6e4a22';
    ctx.fillRect(-5, 12, 10, 16);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-2, -18, 3, 20);
    ctx.restore();
  }
}

// --- Screens ---
function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(43,26,14,.82)';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fill();
  ctx.strokeStyle = '#f7c873'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.stroke();
}

export function drawTitle(ctx, time) {
  ctx.fillStyle = 'rgba(43,26,14,.35)';
  ctx.fillRect(0, 0, W, H);
  panel(ctx, 290, 110, 700, 470);
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('TURKEY RUN', 640, 200);
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('Thanksgiving Escape', 640, 246);
  ctx.fillStyle = '#f7c873';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('The farmer wants you for dinner. Run for your life!', 640, 292);
  ctx.fillText('Dodge fences, ovens and carving knives.', 640, 322);
  ctx.fillText('Grab corn for points and feathers for speed.', 640, 352);
  ctx.fillStyle = '#fff8e7';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Arrows / WASD — run      SPACE — jump', 640, 408);
  ctx.fillText('M — mute      R — restart', 640, 440);
  const pulse = 0.65 + Math.sin(time * 4) * 0.35;
  ctx.fillStyle = `rgba(255,210,62,${pulse})`;
  ctx.font = 'bold 28px Georgia, serif';
  ctx.fillText('CLICK OR PRESS SPACE TO RUN!', 640, 510);
  ctx.fillStyle = '#f7c873';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Farmyard → Kitchen → Freedom Gate · 1000 m to freedom', 640, 548);
}

export function drawEndScreen(ctx, kind, score, distance, corn, time) {
  ctx.fillStyle = 'rgba(43,26,14,.45)';
  ctx.fillRect(0, 0, W, H);
  panel(ctx, 320, 130, 640, 440);
  ctx.textAlign = 'center';
  if (kind === 'escaped') {
    ctx.fillStyle = '#8be28b';
    ctx.font = 'bold 58px Georgia, serif';
    ctx.fillText('YOU ESCAPED!', 640, 220);
    ctx.fillStyle = '#fff8e7';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('The turkey lives to gobble another day.', 640, 266);
    ctx.fillText('The farmer is still searching the barn…', 640, 296);
  } else {
    ctx.fillStyle = '#ff8a7a';
    ctx.font = 'bold 58px Georgia, serif';
    ctx.fillText('CAUGHT!', 640, 220);
    ctx.fillStyle = '#fff8e7';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('The farmer got you. Dinner is served…', 640, 266);
    ctx.fillText('…unless you run again, faster this time.', 640, 296);
  }
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(`SCORE ${score}`, 640, 366);
  ctx.fillStyle = '#fff8e7';
  ctx.font = '22px Georgia, serif';
  ctx.fillText(`Distance ${Math.floor(distance)} m · Corn ${corn}`, 640, 406);
  const pulse = 0.65 + Math.sin(time * 4) * 0.35;
  ctx.fillStyle = `rgba(255,210,62,${pulse})`;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText('Press R or CLICK to run again', 640, 470);
  ctx.fillStyle = '#f7c873';
  ctx.font = '16px Georgia, serif';
  ctx.fillText('Tip: jump the ovens, grab feathers, never stop running.', 640, 530);
}

// Draw one full frame for a given game snapshot.
export function drawFrame(ctx, g, time) {
  const stage = g.stage;
  drawFarmBackground(ctx, stage.idx, g.scroll, time);
  drawHazards(ctx, g.hazards, time);
  const fx = g.turkey.x - g.farmer.gap - 46;
  if (fx > -120) drawFarmer(ctx, g.farmer, fx, time);
  drawTurkey(ctx, g.turkey, time);
  // Freedom gate glow when the run is almost won.
  if (stage.idx === 2 && g.state === 'playing') {
    ctx.fillStyle = 'rgba(255,243,196,.25)';
    ctx.fillRect(1120, 420, 130, 184);
  }
  if (g.state === 'title') drawTitle(ctx, time);
  if (g.state === 'caught') drawEndScreen(ctx, 'caught', g.score, g.distance, g.cornCount, time);
  if (g.state === 'escaped') drawEndScreen(ctx, 'escaped', g.score, g.distance, g.cornCount, time);
}
