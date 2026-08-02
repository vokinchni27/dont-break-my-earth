/* ============================================================
   EARTH MEMORY — compositions.js
   A composition sandbox. Not one fixed layout — a list of
   presets you can edit, duplicate, break, reorder.

   Each composition = { name, clear, layers, phrase }
   Each layer = {
     size   : 'fill' | 'bleed' | [wFrac, hFrac]  (viewport fractions)
     pos    : 'center' | 'random' | [xFrac, yFrac]
     mode   : 'full' (whole image) | 'fragment' (random detail)
     src    : 'next' (sequence) | 'random'
     effect : 'brutal' | 'fade' | 'scan' | 'lines' | 'tiles'
              | 'glitch' | 'pixel' | 'random'
     blend  : true → multiply over the previous layer
     drift  : true → very slow movement
     delay  : ms before appearing
   }

   Keys : space = random preset · ← → = previous/next ·
          1…0 = jump to preset 1…10
   The current preset name is shown bottom-center.
   ============================================================ */

EM.COMPO = [
  {
    name: 'fill',
    clear: 'fade',
    layers: [
      { size: 'fill', pos: 'center', effect: 'fade' }
    ],
    phrase: 0.3
  },
  {
    name: 'bleed + drift',
    clear: 'fade',
    layers: [
      { size: 'bleed', pos: 'center', effect: 'fade', drift: true }
    ],
    phrase: 0.3
  },
  {
    name: 'tiny, centered',
    clear: 'fade',
    layers: [
      { size: [0.12, 0.14], pos: 'center', effect: 'fade' }
    ],
    phrase: 0.4
  },
  {
    name: 'small, off-center',
    clear: 'fade',
    layers: [
      { size: [0.24, 0.28], pos: 'random', effect: 'random' }
    ],
    phrase: 0.3
  },
  {
    name: 'medium, off-center',
    clear: 'fade',
    layers: [
      { size: [0.42, 0.5], pos: 'random', effect: 'random' }
    ],
    phrase: 0.3
  },
  {
    name: 'duo',
    clear: 'fade',
    layers: [
      { size: [0.3, 0.36], pos: [0.08, 0.14], effect: 'fade' },
      { size: [0.3, 0.36], pos: [0.6, 0.5], effect: 'fade', delay: 600 }
    ]
  },
  {
    name: 'overlap',
    clear: 'fade',
    layers: [
      { size: [0.55, 0.62], pos: 'center', effect: 'fade' },
      { size: [0.16, 0.2], pos: 'random', effect: 'brutal', delay: 900 }
    ],
    phrase: 0.25
  },
  {
    name: 'blend — two skies',
    clear: 'fade',
    layers: [
      { size: 'fill', pos: 'center', effect: 'fade' },
      { size: 'fill', pos: 'center', effect: 'fade', blend: true, delay: 800 }
    ],
    phrase: 0.4
  },
  {
    name: 'fragments scatter',
    clear: 'fade',
    layers: [
      { size: [0.14, 0.18], pos: 'random', mode: 'fragment', effect: 'brutal' },
      { size: [0.1, 0.22], pos: 'random', mode: 'fragment', effect: 'brutal', delay: 300 },
      { size: [0.18, 0.14], pos: 'random', mode: 'fragment', effect: 'brutal', delay: 650 },
      { size: [0.08, 0.12], pos: 'random', mode: 'fragment', effect: 'brutal', delay: 1000 },
      { size: [0.15, 0.17], pos: 'random', mode: 'fragment', effect: 'brutal', delay: 1400 }
    ]
  },
  {
    name: 'row of three',
    clear: 'fade',
    layers: [
      { size: [0.26, 0.34], pos: [0.04, 0.33], effect: 'fade' },
      { size: [0.26, 0.34], pos: [0.37, 0.33], effect: 'fade', delay: 350 },
      { size: [0.26, 0.34], pos: [0.70, 0.33], effect: 'fade', delay: 700 }
    ]
  },
  {
    name: 'monument + details',
    clear: 'fade',
    layers: [
      { size: [0.6, 0.7], pos: 'center', effect: 'scan' },
      { size: [0.09, 0.12], pos: 'random', mode: 'fragment', effect: 'brutal', delay: 1600 },
      { size: [0.12, 0.09], pos: 'random', mode: 'fragment', effect: 'brutal', delay: 2100 }
    ],
    phrase: 0.3
  },
  {
    name: 'pixel resolve',
    clear: 'brutal',
    layers: [
      { size: 'fill', pos: 'center', effect: 'pixel' }
    ],
    phrase: 0.3
  },
  {
    name: 'breath',
    clear: 'fade',
    layers: [],
    phrase: 1
  }
];


EM.Compo = {
  current: -1,
  lastRandom: -1,

  vw() { return window.innerWidth; },
  vh() { return window.innerHeight; },

  get count() { return EM.COMPO.length; },

  /* space — a random preset, never twice the same */
  next() {
    if (!EM.COMPO.length) return;
    let i;
    do { i = Math.floor(Math.random() * EM.COMPO.length); }
    while (i === this.lastRandom && EM.COMPO.length > 1);
    this.lastRandom = i;
    this.go(i);
  },

  /* arrows */
  cycle(dir) {
    const n = EM.COMPO.length;
    if (!n) return;
    const i = ((this.current < 0 ? 0 : this.current) + dir + n) % n;
    this.go(i);
  },

  /* digits 1…9, 0 → presets 1…10 */
  go(i) {
    if (i < 0 || i >= EM.COMPO.length) return;
    this.current = i;
    this.run(EM.COMPO[i]);
    EM.Main.registerScene(EM.COMPO[i].name);
  },

  run(compo) {
    if (compo.clear !== 'none') EM.Stage.clear(compo.clear || 'fade');

    compo.layers.forEach(spec => {
      const build = () => {
        const src = spec.src === 'random' ? EM.Archive.random() : EM.Archive.next();
        if (!src) return;
        const geo = this.geometry(spec);
        const f = EM.Frame(src, {
          mode: spec.mode || 'full',
          x: geo.x, y: geo.y, w: geo.w, h: geo.h
        });
        if (spec.blend) f.classList.add('blend');
        if (spec.drift) f.classList.add('drift');
        EM.Stage.add(f);
        const effect = spec.effect === 'random' || !spec.effect
          ? EM.Effects.random()
          : spec.effect;
        EM.Effects.apply(f, effect);
        if ((spec.mode || 'full') === 'full') EM.Main.status(src);
      };
      spec.delay ? setTimeout(build, spec.delay) : build();
    });

    if (compo.phrase && Math.random() < compo.phrase) {
      setTimeout(() => EM.Text.show(EM.Text.phrase(), { center: Math.random() < 0.5 }), 1200);
    }

    this.label(compo);
  },

  /* turns a layer spec into px geometry */
  geometry(spec) {
    const vw = this.vw(), vh = this.vh();
    let w, h;
    if (spec.size === 'fill')       { w = vw;        h = vh; }
    else if (spec.size === 'bleed') { w = vw * 1.15; h = vh * 1.15; }
    else { w = vw * spec.size[0];   h = vh * spec.size[1]; }

    let x, y;
    if (spec.pos === 'center') {
      x = (vw - w) / 2;
      y = (vh - h) / 2;
    } else if (spec.pos === 'random' || !spec.pos) {
      // random, but always fully inside the page
      x = Math.random() * Math.max(vw - w, 1);
      y = Math.random() * Math.max(vh - h, 1);
    } else {
      x = vw * spec.pos[0];
      y = vh * spec.pos[1];
      x = Math.min(Math.max(x, 0), Math.max(vw - w, 0));
      y = Math.min(Math.max(y, 0), Math.max(vh - h, 0));
    }
    return { x, y, w, h };
  },

  label(compo) {
    const el = document.getElementById('ui-compo');
    if (el) el.textContent =
      String(this.current + 1).padStart(2, '0') + ' / ' +
      String(EM.COMPO.length).padStart(2, '0') + ' — ' + compo.name;
  }
};
