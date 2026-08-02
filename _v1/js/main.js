/* ============================================================
   EARTH MEMORY — main.js
   Orchestration. Boot, exploration counter, idle whisper,
   status line, clock, and the way the piece ends.
   ============================================================ */

EM.Main = {
  started: false,
  scenes: 0,
  idleTimer: null,
  idleEl: null,

  async init() {
    EM.Stage.init();
    EM.Text.init();
    EM.Input.init();
    this.clock();
    await EM.Archive.load();
    this.status(null, EM.Archive.size
      ? `ARCHIVE : ${EM.Archive.size} SIGNALS FOUND — READY`
      : 'ARCHIVE EMPTY — drop images in Images/ + run tools/update-manifest.ps1');
  },

  /* space — the main gesture */
  explore() {
    if (EM.Ending.shown) return;
    if (!this.started) {
      this.started = true;
      const intro = document.getElementById('intro');
      intro.classList.add('off');
      setTimeout(() => intro.remove(), 1300);
    }
    this.touch();
    if (!EM.Archive.size) {
      EM.Text.show('the archive is empty', { center: false });
      return;
    }
    EM.Compo.next();
  },

  /* arrows / digits — direct preset access (sandbox mode) */
  preset(fn) {
    if (EM.Ending.shown) return;
    if (!this.started) { this.explore(); return; }
    this.touch();
    if (!EM.Archive.size) return;
    fn();
  },

  /* click on empty space — reveal a fragment where the eye lands */
  revealAt(x, y) {
    if (!this.started || EM.Ending.shown) return;
    const src = EM.Archive.random();
    if (!src) return;
    this.touch();
    const w = 100 + Math.random() * 300;
    const h = 80 + Math.random() * 220;
    const fx = Math.min(Math.max(x - w / 2, 0), window.innerWidth - w);
    const fy = Math.min(Math.max(y - h / 2, 0), window.innerHeight - h);
    const f = EM.Frame(src, { mode: 'fragment', x: fx, y: fy, w, h });
    EM.Stage.add(f);
    EM.Effects.apply(f, Math.random() < 0.6 ? 'brutal' : 'glitch');
  },

  registerScene() {
    this.scenes++;
    if (this.scenes >= EM.CONFIG.ending.scenesBeforeEnding) {
      setTimeout(() => EM.Ending.show(), 3800);
    }
  },

  /* status line — the instrument reports what it observes */
  status(src, msg) {
    const el = document.getElementById('ui-status');
    if (msg) { el.textContent = msg; return; }
    if (src) {
      const name = src.split('/').pop().toUpperCase();
      const zone = src.split('/')[0] || '';
      el.textContent =
        `SIGNAL ${String((EM.Archive.i - 1 + EM.Archive.size) % (EM.Archive.size || 1) + 1).padStart(3, '0')}` +
        ` / ${String(EM.Archive.size).padStart(3, '0')} — ${zone} — ${name}`;
    }
  },

  /* if the visitor stops, the piece asks a question */
  touch() {
    clearTimeout(this.idleTimer);
    if (this.idleEl) { this.idleEl.remove(); this.idleEl = null; }
    this.idleTimer = setTimeout(() => {
      if (!EM.Ending.shown && this.started) {
        this.idleEl = EM.Text.show(EM.CONFIG.idlePhrase, { hold: 6000 });
      }
    }, EM.CONFIG.timing.idleWhisper);
  },

  clock() {
    const el = document.getElementById('ui-clock');
    const tick = () => {
      el.textContent = new Date().toISOString().substr(11, 8) + ' UTC';
    };
    tick();
    setInterval(tick, 1000);
  }
};

window.addEventListener('DOMContentLoaded', () => EM.Main.init());
