// audio.js — tiny WebAudio sound kit for Turkey Run.
// One job: beeps and jingles, created lazily on first user gesture, M mutes.
// No audio files, no network: every sound is synthesized with oscillators.

export class AudioSys {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  // Call from any user gesture (key/click). Safe to call repeatedly.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    } catch (e) { /* audio unavailable: game stays silent */ }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type, when, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + (when || 0);
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(vol || 0.5, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(g);
      g.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) { /* ignore */ }
  }

  // Short happy chirp when the turkey grabs corn.
  corn() { this.tone(880, 0.09, 'sine', 0, 0.6); this.tone(1320, 0.12, 'sine', 0.07, 0.5); }

  // Whoosh-flutter when the turkey jumps.
  jump() { this.tone(300, 0.16, 'triangle', 0, 0.5, 720); }

  // Low thud when the turkey is hit.
  hurt() { this.tone(160, 0.25, 'sawtooth', 0, 0.7, 70); this.tone(90, 0.3, 'square', 0.02, 0.5, 50); }

  // Rising alarm when the farmer gets close.
  spotted() {
    this.tone(520, 0.12, 'square', 0, 0.45);
    this.tone(660, 0.12, 'square', 0.12, 0.45);
    this.tone(520, 0.12, 'square', 0.24, 0.45);
  }

  // Feather power-up sparkle.
  feather() {
    [660, 880, 1100, 1320].forEach((f, i) => this.tone(f, 0.1, 'sine', i * 0.06, 0.45));
  }

  // Little victory jingle for escaping.
  escapeJingle() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', i * 0.13, 0.55));
  }

  // Sad trombone-ish slide for getting caught.
  caughtJingle() {
    [392, 370, 349, 311].forEach((f, i) => this.tone(f, 0.22, 'sawtooth', i * 0.18, 0.4));
  }

  // Title-screen gobble: two low honks.
  gobble() {
    this.tone(220, 0.1, 'square', 0, 0.5, 180);
    this.tone(220, 0.1, 'square', 0.14, 0.5, 170);
    this.tone(260, 0.14, 'square', 0.3, 0.5, 200);
  }
}
