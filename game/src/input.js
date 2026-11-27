// input.js — keyboard + mouse input for Turkey Run.
// One job: track keys and clicks, expose a tiny polling API to the game loop.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // edge-triggered, consumed by the loop each frame
    this.mouseX = 0;
    this.mouseY = 0;
    this.clicked = false; // edge-triggered click
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!e.repeat) this.pressed.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      this.keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    });
    canvas.addEventListener('pointerdown', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) * (canvas.width / r.width);
      this.mouseY = (e.clientY - r.top) * (canvas.height / r.height);
      this.clicked = true;
    });
    // Keep focus so keys always reach the game.
    window.addEventListener('blur', () => this.keys.clear());
  }

  down(...names) {
    return names.some((n) => this.keys.has(n));
  }

  // True once on the frame the key went down; cleared by endFrame().
  wasPressed(...names) {
    return names.some((n) => this.pressed.has(n));
  }

  wasClicked() {
    return this.clicked;
  }

  clickPos() {
    return { x: this.mouseX, y: this.mouseY };
  }

  endFrame() {
    this.pressed.clear();
    this.clicked = false;
  }
}

// Hit-test helper for on-screen buttons drawn on the canvas.
export function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}
