/* ============================================================
   EARTH MEMORY — sound.js
   Sound architecture — OFF by default. Toggle with [s].
   Design intent : not music. Breath, interference, silence.
   Currently : a barely-there wind (filtered noise with a slow LFO).
   Future sources to plug into start() :
     - room-tone / field-recording loops
     - short interference blips on scene changes (hook EM.Scenes.next)
     - geophone / hydrophone textures
   ============================================================ */

EM.Sound = {
  enabled: false,
  ctx: null,
  gain: null,

  toggle() { this.enabled ? this.stop() : this.start(); },

  start() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();

      // brown-ish noise — the raw matter of wind
      const len = 2 * this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buffer.getChannelData(0);
      let v = 0;
      for (let i = 0; i < len; i++) {
        v = v * 0.98 + (Math.random() * 2 - 1) * 0.02;
        d[i] = v * 3;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 240;
      filter.Q.value = 0.4;

      this.gain = this.ctx.createGain();
      this.gain.gain.value = 0;

      src.connect(filter).connect(this.gain).connect(this.ctx.destination);
      src.start();

      // slow breath — the wind comes and goes
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.05;
      lfoGain.gain.value = 0.015;
      lfo.connect(lfoGain).connect(this.gain.gain);
      lfo.start();
    }
    this.ctx.resume();
    this.gain.gain.setTargetAtTime(0.035, this.ctx.currentTime, 3);
    this.enabled = true;
    EM.Main.status(null, 'SOUND : WIND — [s] TO SILENCE');
  },

  stop() {
    if (this.gain) this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 1.5);
    this.enabled = false;
  }
};
