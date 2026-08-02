/* ============================================================
   EARTH MEMORY — text.js
   Text acts as a breath. Short phrases, rarely, never long.
   ============================================================ */

EM.Text = {
  layer: null,

  init() { this.layer = document.getElementById('text-layer'); },

  /* opts: center (default true), hold (ms) */
  show(str, opts = {}) {
    const el = document.createElement('div');
    el.className = 'phrase';
    el.textContent = str;
    if (opts.center === false) {
      el.style.left = (14 + Math.random() * 72) + '%';
      el.style.top = (18 + Math.random() * 60) + '%';
    }
    this.layer.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    const hold = opts.hold || EM.CONFIG.timing.phraseHold;
    setTimeout(() => {
      el.classList.remove('on');
      setTimeout(() => el.remove(), 1800);
    }, hold);
    return el;
  },

  phrase() {
    const p = EM.CONFIG.phrases;
    return p[Math.floor(Math.random() * p.length)];
  }
};
