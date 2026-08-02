/* ============================================================
   EARTH MEMORY — effects.js
   Reveal effects. Each takes a frame already on stage
   (opacity 0) and makes it appear.
   No motion design — raw cuts, slow fades, scans, fragments.
   ============================================================ */

EM.Effects = {

  apply(frame, type, done) {
    (this[type] || this.brutal).call(this, frame, done || (() => {}));
  },

  random(exclude) {
    const all = ['brutal', 'fade', 'scan', 'lines', 'tiles', 'glitch', 'pixel'];
    let t;
    do { t = all[Math.floor(Math.random() * all.length)]; }
    while (t === exclude);
    return t;
  },

  /* it is simply there, as if it had always been */
  brutal(frame, done) {
    frame.classList.add('on');
    done();
  },

  /* a very slow surfacing */
  fade(frame, done) {
    frame.style.transition = `opacity ${EM.CONFIG.timing.slowFade}ms ease`;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => frame.classList.add('on')));
    setTimeout(done, EM.CONFIG.timing.slowFade);
  },

  /* a short interference, then the image */
  glitch(frame, done) {
    frame.classList.add('on', 'glitch-in');
    setTimeout(() => { frame.classList.remove('glitch-in'); done(); }, 650);
  },

  /* a scanline travels down — the image exists only behind it */
  scan(frame, done) {
    frame.style.clipPath = 'inset(0 0 100% 0)';
    frame.classList.add('on');
    const line = document.createElement('div');
    line.className = 'scanline';
    frame.appendChild(line);
    const dur = 2200;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      frame.style.clipPath = `inset(0 0 ${(1 - p) * 100}% 0)`;
      line.style.top = (p * 100) + '%';
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => { frame.style.clipPath = ''; line.remove(); }, 80);
        done();
      }
    };
    requestAnimationFrame(step);
  },

  /* the image is cut into horizontal strips that appear one by one */
  lines(frame, done) {
    const src = frame.dataset.src;
    const w = Math.round(parseFloat(frame.style.width));
    const h = Math.round(parseFloat(frame.style.height));
    const n = 14;
    frame.innerHTML = '';
    frame.classList.add('on');
    const order = [];
    for (let i = 0; i < n; i++) order.push(i);
    if (Math.random() < 0.4) order.sort(() => Math.random() - 0.5); // sometimes disorder
    order.forEach((idx, k) => {
      const strip = document.createElement('div');
      strip.className = 'strip';
      strip.style.top = (idx * h / n) + 'px';
      strip.style.height = (Math.ceil(h / n) + 1) + 'px';
      strip.style.left = '0';
      strip.style.width = w + 'px';
      strip.style.backgroundImage = `url("${src}")`;
      strip.style.backgroundSize = `${w}px ${h}px`;
      strip.style.backgroundPosition = `0 ${-idx * h / n}px`;
      frame.appendChild(strip);
      setTimeout(() => strip.classList.add('on'), 90 * k + Math.random() * 120);
    });
    setTimeout(done, 90 * n + 400);
  },

  /* decoupage — tiles of the image appear in disorder */
  tiles(frame, done) {
    const src = frame.dataset.src;
    const w = Math.round(parseFloat(frame.style.width));
    const h = Math.round(parseFloat(frame.style.height));
    const cols = 6, rows = 4;
    frame.innerHTML = '';
    frame.classList.add('on');
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
    cells.sort(() => Math.random() - 0.5);
    cells.forEach(([c, r], k) => {
      const t = document.createElement('div');
      t.className = 'tile';
      t.style.left = (c * w / cols) + 'px';
      t.style.top = (r * h / rows) + 'px';
      t.style.width = (Math.ceil(w / cols) + 1) + 'px';
      t.style.height = (Math.ceil(h / rows) + 1) + 'px';
      t.style.backgroundImage = `url("${src}")`;
      t.style.backgroundSize = `${w}px ${h}px`;
      t.style.backgroundPosition = `${-c * w / cols}px ${-r * h / rows}px`;
      frame.appendChild(t);
      setTimeout(() => t.classList.add('on'), 45 * k);
    });
    setTimeout(done, 45 * cells.length + 200);
  },

  /* pixelation that slowly resolves into the real image —
     you watch the signal become a place */
  pixel(frame, done) {
    const src = frame.dataset.src;
    const w = Math.round(parseFloat(frame.style.width));
    const h = Math.round(parseFloat(frame.style.height));
    const pctT = EM.CONFIG.cropTop;
    const pctB = EM.CONFIG.cropBottom || 0;
    const img = new Image();
    img.onload = () => {
      frame.innerHTML = '';
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      cv.className = 'pixel-canvas';
      frame.appendChild(cv);
      frame.classList.add('on');
      const ctx = cv.getContext('2d');
      // same framing as the cropped <img> :
      // box = w × (1+pctT+pctB)*h, object-fit cover, visible window = h
      const boxH = (1 + pctT + pctB) * h;
      const scale = Math.max(w / img.width, boxH / img.height);
      const sx = (img.width - w / scale) / 2;
      const sy = (img.height - boxH / scale) / 2 + (pctT * h) / scale;
      const sw = w / scale, sh = h / scale;
      const off = document.createElement('canvas');
      const offCtx = off.getContext('2d');
      const blocks = [72, 48, 32, 20, 12, 6, 2, 1];
      let i = 0;
      const tick = () => {
        const b = blocks[i];
        const tw = Math.max(1, Math.round(w / b));
        const th = Math.max(1, Math.round(h / b));
        off.width = tw;
        off.height = th;
        offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, tw, th, 0, 0, w, h);
        i++;
        if (i < blocks.length) setTimeout(tick, 340);
        else done();
      };
      tick();
    };
    img.onerror = () => this.brutal(frame, done);
    img.src = src;
  }
};
