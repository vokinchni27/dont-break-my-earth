/* ============================================================
   EARTH MEMORY — stage.js
   The stage owns every visible layer.
   Layers stack, overlap, disappear.
   EM.Frame(src, opts) builds a window onto one archive image.
   ============================================================ */

EM.Stage = {
  el: null,
  layers: [],

  init() { this.el = document.getElementById('stage'); },

  add(node) {
    this.layers.push(node);
    node.style.zIndex = 10 + this.layers.length;
    this.el.appendChild(node);
    return node;
  },

  remove(node, mode = 'brutal') {
    const idx = this.layers.indexOf(node);
    if (idx !== -1) this.layers.splice(idx, 1);
    if (mode === 'fade') {
      node.style.transition = 'opacity 1400ms ease';
      node.style.opacity = '0';
      setTimeout(() => node.remove(), 1500);
    } else if (mode === 'glitch') {
      node.classList.add('glitch-out');
      setTimeout(() => node.remove(), 480);
    } else {
      node.remove();
    }
  },

  clear(mode = 'brutal') {
    [...this.layers].forEach(n => this.remove(n, mode));
  },

  get count() { return this.layers.length; }
};


/* A frame is a window onto one archive image.
   opts:
     mode : 'full'      → the image covers the frame, toolbar cropped from top
            'fragment'  → a small window showing a random region of the image
     x, y, w, h : geometry in px
   Clicking a frame makes it disappear — observation is reversible. */
EM.Frame = function (src, opts = {}) {
  const mode = opts.mode || 'full';
  const el = document.createElement('div');
  el.className = 'frame frame-' + mode;
  el.style.left   = Math.round(opts.x || 0) + 'px';
  el.style.top    = Math.round(opts.y || 0) + 'px';
  el.style.width  = Math.round(opts.w) + 'px';
  el.style.height = Math.round(opts.h) + 'px';
  el.dataset.src = src;

  if (mode === 'fragment') {
    // a true detail : real zoom into a random region (never the UI bars)
    const inner = document.createElement('div');
    inner.className = 'frag-inner';
    inner.style.backgroundImage = `url("${src}")`;
    const minZoom = (opts.h / opts.w) * 2.05; // sources are ~2:1
    const zoom = Math.max(2, minZoom) + 0.3 + Math.random() * 2;
    inner.style.backgroundSize = Math.round(opts.w * zoom) + 'px auto';
    inner.style.backgroundPosition =
      (Math.random() * 100) + '% ' + (15 + Math.random() * 70) + '%';
    el.appendChild(inner);
  } else {
    const pctT = EM.CONFIG.cropTop;
    const pctB = EM.CONFIG.cropBottom || 0;
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.draggable = false;
    img.style.top = (-pctT * 100) + '%';
    img.style.height = ((1 + pctT + pctB) * 100) + '%';
    el.appendChild(img);
  }

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    EM.Stage.remove(el, Math.random() < 0.4 ? 'glitch' : 'brutal');
    EM.Main.touch();
  });

  return el;
};
