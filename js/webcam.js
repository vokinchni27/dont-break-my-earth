/* ============================================================
   EARTH — js/webcam.js
   ------------------------------------------------------------
   Le visiteur entre dans l'image.

   Jamais de video brute. La camera n'est qu'une source de
   luminance : elle est reduite a une grille de cellules, et
   chaque cellule assez claire devient un fragment de paysage.
   Le visage n'est pas montre, il est reconstitue en Terre.

   Deux sources possibles (CONFIG.webcam.source) :
     'camera'  la vraie camera (exige https ou localhost)
     'test'    une mire animee — permet de verifier toute la
               chaine sans camera, et sans autorisation

   Desactive par defaut. Touche W.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { clamp, vmin } = EARTH.utils;

  const Webcam = {
    el: null,
    actif: false,
    video: null,
    canvas: null,
    ctx: null,
    tuiles: [],
    minuteur: null,
    flux: null,
    erreur: null,
    tempsTest: 0,

    init(el) {
      this.el = el;
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
      return this;
    },

    async basculer() {
      if (this.actif) { this.arreter(); return false; }
      return this.demarrer();
    },

    async demarrer() {
      const cfg = EARTH.CONFIG.webcam;
      this.erreur = null;

      if (cfg.source === 'camera') {
        try {
          this.flux = await navigator.mediaDevices.getUserMedia({
            video: { width: 320, height: 240, facingMode: 'user' }, audio: false
          });
          this.video = document.createElement('video');
          this.video.srcObject = this.flux;
          this.video.muted = true;
          this.video.playsInline = true;
          await this.video.play();
        } catch (e) {
          this.erreur = e && e.name === 'NotAllowedError'
            ? EARTH.T('webcam.refusee')
            : EARTH.T('webcam.indisponible');
          console.warn('[EARTH] ' + this.erreur, e);
          return false;
        }
      }

      this.canvas.width = cfg.colonnes;
      this.canvas.height = cfg.lignes;
      this.preparerTuiles();
      this.actif = true;
      EARTH.CONFIG.webcam.actif = true;
      document.body.classList.add('webcam');
      this.minuteur = setInterval(() => this.echantillonner(), cfg.cadence);
      this.echantillonner();
      return true;
    },

    arreter() {
      clearInterval(this.minuteur);
      this.minuteur = null;
      this.actif = false;
      EARTH.CONFIG.webcam.actif = false;
      document.body.classList.remove('webcam');
      if (this.flux) { this.flux.getTracks().forEach(t => t.stop()); this.flux = null; }
      this.video = null;
      this.tuiles.forEach(t => t.el.remove());
      this.tuiles = [];
    },

    /* --- le bassin de tuiles -------------------------------- */
    /* cree une fois, jamais recree : seules la position, la
       taille et l'opacite changent d'une image a l'autre */
    preparerTuiles() {
      const cfg = EARTH.CONFIG.webcam;
      const n = cfg.colonnes * cfg.lignes;
      this.tuiles.forEach(t => t.el.remove());
      this.tuiles = [];
      const liste = EARTH.Archive.liste.filter(i => i.type === 'image');
      if (!liste.length) return;

      for (let i = 0; i < n; i++) {
        const el = document.createElement('div');
        el.className = 'wc-tuile';
        const item = liste[Math.floor(Math.random() * liste.length)];
        /* un detail de l'image, pas l'image : la matiere plutot
           que le motif */
        el.style.backgroundImage = `url("${item.src}")`;
        el.style.backgroundSize = (260 + Math.random() * 340) + '%';
        el.style.backgroundPosition = `${Math.random() * 100}% ${20 + Math.random() * 55}%`;
        this.el.appendChild(el);
        this.tuiles.push({ el, item });
      }
    },

    /* --- une image de la source ----------------------------- */
    echantillonner() {
      const cfg = EARTH.CONFIG.webcam;
      const { colonnes: C, lignes: L } = cfg;

      if (cfg.source === 'camera' && this.video) {
        /* miroir : le visiteur se reconnait */
        this.ctx.save();
        this.ctx.translate(C, 0);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.video, 0, 0, C, L);
        this.ctx.restore();
      } else {
        this.mire(C, L);
      }

      const data = this.ctx.getImageData(0, 0, C, L).data;
      const cw = window.innerWidth / C;
      const ch = window.innerHeight / L;
      const base = Math.min(cw, ch);

      for (let l = 0; l < L; l++) {
        for (let c = 0; c < C; c++) {
          const i = (l * C + c);
          const t = this.tuiles[i];
          if (!t) continue;
          const p = i * 4;
          const lum = (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
          const v = clamp((lum - cfg.seuil) / Math.max(0.01, 1 - cfg.seuil), 0, 1);

          if (v <= 0.02) { t.el.style.opacity = '0'; continue; }
          const taille = base * (0.35 + v * 0.95);
          t.el.style.width = taille + 'px';
          t.el.style.height = taille + 'px';
          t.el.style.transform =
            `translate(${(c + 0.5) * cw - taille / 2}px, ${(l + 0.5) * ch - taille / 2}px)`;
          t.el.style.opacity = String(clamp(v * cfg.opacite, 0, 1));
        }
      }
    },

    /* mire animee : une forme claire qui respire, de quoi voir
       la mosaique fonctionner sans allumer de camera */
    mire(C, L) {
      const ctx = this.ctx;
      this.tempsTest += 0.06;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, C, L);
      const cx = C / 2 + Math.sin(this.tempsTest * 0.7) * C * 0.08;
      const cy = L / 2 + Math.cos(this.tempsTest * 0.5) * L * 0.06;
      const rx = C * (0.22 + Math.sin(this.tempsTest) * 0.02);
      const ry = L * 0.34;
      const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, Math.max(rx, ry));
      g.addColorStop(0, '#fff');
      g.addColorStop(0.6, '#888');
      g.addColorStop(1, '#000');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  EARTH.Webcam = Webcam;

})(window.EARTH = window.EARTH || {});
