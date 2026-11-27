# Turkey Run: Thanksgiving Escape

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/competitions/turkey-run-game-01)
[![rank](https://make.fun/badge/veneraxyz/turkey-run-game-01-entry-v1/rank.svg)](https://make.fun/competitions/turkey-run-game-01)
[![reward](https://make.fun/badge/veneraxyz/turkey-run-game-01-entry-v1/reward.svg)](https://make.fun/competitions/turkey-run-game-01)

You are the turkey. Thanksgiving is coming, the farmer has his eye on
you, and the oven is already hot. Run 1000 metres from the farmyard,
through the kitchen, and out the freedom gate — before the farmer
catches you or the carving knives do.

## How to play

- **Arrows / WASD** — run left and right (the yard scrolls on its own)
- **Space** — jump (over fences, hay bales and hot ovens)
- **Mouse** — click to start, and to run again after an end screen
- **M** — mute / unmute the sound
- **R** — restart after being caught or escaping

## The run

- **Score** — corn is worth 10 points each; every metre you survive adds
  to it. Feathers give a 3-second speed boost.
- **Lives** — you have 3. A carving knife or a hot oven costs one life
  and stumbles you, letting the farmer surge closer.
- **The farmer** — he chases, loses your trail and searches when you pull
  away, and lunges to corner you when he gets close. If he reaches you,
  dinner is served. Watch the red FARMER bar in the HUD.
- **Stages** — Farmyard (0–400 m): fences and hay. Kitchen (400–800 m):
  hot ovens and knives thrown across the yard. Freedom Gate (800–1000 m):
  the last sprint home. Reach 1000 m and you escape.

## What it is

A complete 2D canvas game in plain static files under `game/` — no
libraries, no network requests, no external assets. All art is drawn
procedurally on the canvas (turkey, farmer, barn, kitchen, autumn
leaves) and all sound is synthesized with WebAudio. Deterministic
screenshot states are available at `?shot=cover|play|chase|escaped`
with an optional `&seed=` parameter.

## Files

- `game/index.html` — canvas + HUD
- `game/src/main.js` — game loop, state machine, deterministic shot modes
- `game/src/turkey.js` — player movement, jump, animation
- `game/src/farmer.js` — farmer AI: chase, search, corner
- `game/src/hazards.js` — ovens, carving knives, corn, feathers (seeded RNG)
- `game/src/render.js` — procedural drawing: turkey, farmer, farm, kitchen
- `game/src/audio.js` — WebAudio beeps and jingles
- `game/src/input.js` — keyboard + mouse
- `game/src/shots.js` — deterministic screenshot states
- `main.ts` — hand-in program: copies `game/` + `screenshots/` to the
  output directory and writes `dossier.json`

## License

MIT — see `LICENSE`.
