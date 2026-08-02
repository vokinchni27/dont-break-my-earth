/* ============================================================
   EARTH MEMORY — webcam.js
   The local signal. The visitor's face, reduced to characters.
   Not a selfie — a reminder that looking is reciprocal.
   Toggle with [c]. Nothing is recorded, nothing leaves the machine.

   Extension points (later versions) :
     - replace characters by tiny satellite fragments
       (draw image tiles instead of fillText in loop())
     - let the face slowly decompose into terrain
   ============================================================ */

EM.Webcam = {
  active: false,
  stream: null,
  raf: null,
  video: null,
  canvas: null,
  ctx: null,
  off: null,
  offCtx: null,
  _rs: null,

  toggle() { this.active ? this.stop() : this.start(); },

  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      EM.Text.show('no signal on this machine', { center: false });
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640 }, audio: false
      });
    } catch (e) {
      EM.Text.show('the signal was refused', { center: false });
      return;
    }
    this.active = true;
    this.video = document.createElement('video');
    this.video.srcObject = this.stream;
    this.video.muted = true;
    await this.video.play();

    this.canvas = document.getElementById('webcam-layer');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.classList.remove('hidden');
    this.resize();
    this._rs = () => this.resize();
    window.addEventListener('resize', this._rs);
    EM.Main.status(null, 'LOCAL SIGNAL — IT IS LOOKING AT YOU');
    this.loop();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  loop() {
    if (!this.active) return;
    const cfg = EM.CONFIG.webcam;
    const fs = cfg.fontSize;
    const charW = fs * 0.6;
    const cols = Math.floor(this.canvas.width / charW);
    const rows = Math.floor(this.canvas.height / fs);

    if (!this.off) {
      this.off = document.createElement('canvas');
      this.offCtx = this.off.getContext('2d', { willReadFrequently: true });
    }
    this.off.width = cols;
    this.off.height = rows;

    const vw = this.video.videoWidth, vh = this.video.videoHeight;
    if (vw && cols > 0 && rows > 0) {
      // cover-fit, mirrored — like a surface of water
      const scale = Math.max(cols / vw, rows / vh);
      const sw = cols / scale, sh = rows / scale;
      const o = this.offCtx;
      o.save();
      o.translate(cols, 0);
      o.scale(-1, 1);
      o.drawImage(this.video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, cols, rows);
      o.restore();

      const data = o.getImageData(0, 0, cols, rows).data;
      const chars = cfg.charset;
      const last = chars.length - 1;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.font = fs + 'px "Space Mono", monospace';
      ctx.fillStyle = `rgba(20,20,19,${cfg.opacity})`;
      ctx.textBaseline = 'top';
      for (let y = 0; y < rows; y++) {
        let line = '';
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const lum = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
          line += chars[Math.floor(lum * last)];
        }
        ctx.fillText(line, 0, y * fs);
      }
    }
    this.raf = requestAnimationFrame(() => this.loop());
  },

  stop() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null;
    if (this.canvas) {
      this.canvas.classList.add('hidden');
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (this._rs) window.removeEventListener('resize', this._rs);
  }
};
