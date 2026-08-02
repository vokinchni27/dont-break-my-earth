/* ============================================================
   EARTH MEMORY — archive.js
   Loads the list of images from manifest.json.
   To add images : drop files anywhere in the project folder,
   run tools/update-manifest.ps1 — no code change needed.
   ============================================================ */

EM.Archive = {
  list: [],
  i: 0,

  async load() {
    try {
      const res = await fetch(EM.CONFIG.archive.manifest, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const files = await res.json();
      this.list = files.map(f => EM.CONFIG.archive.dir + f);
    } catch (e) {
      console.warn('[archive] manifest not found — serve the folder over http (ex: python -m http.server)');
      this.list = [];
    }
    // random starting point, then the sequence unfolds
    if (this.list.length) this.i = Math.floor(Math.random() * this.list.length);
    // quiet preload of the first signals
    this.list.slice(0, 4).forEach(src => { const im = new Image(); im.src = src; });
  },

  get size() { return this.list.length; },

  next() {
    if (!this.list.length) return null;
    const src = this.list[this.i % this.list.length];
    this.i++;
    return src;
  },

  random() {
    if (!this.list.length) return null;
    return this.list[Math.floor(Math.random() * this.list.length)];
  }
};
