/* ============================================================
   EARTH — js/grid.js
   ------------------------------------------------------------
   La grille.

   Une trame droite, derrière les images. Elle peut respirer,
   frémir, s’écarter sous la main et se laisser tordre par la
   position géographique des captures — la longitude donne la
   direction, la latitude la force — mais TOUT cela passe par
   `CONFIG.grille`, et tout y est à zéro.

   C’est la règle : aucune déformation ne doit exister en dehors
   de ces réglages. Deux en sortaient — le creusement autour
   d’une image regardée, et l’« éclat » des événements rares —
   et le quadrillage se muait alors en un semis de polygones
   quoi qu’on règle. Elles sont supprimées.

   Canvas et non DOM : on ne peut pas tordre une bordure CSS.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { clamp, mobile, lerp } = EARTH.utils;

  const SEGMENTS = 44;          // finesse de la déformation

  const Grille = {
    el: null,
    canvas: null,
    ctx: null,
    colonnes: 12,
    lignes: 8,
    t: 0,
    dpr: 1,
    pointeur: { x: -9999, y: -9999, force: 0 },
    absentes: new Set(),
    boucle: null,

    init(el) {
      this.el = el;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'grille-toile';
      el.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      this.mesurer();
      this.redimensionner();
      window.addEventListener('resize', () => { this.mesurer(); this.redimensionner(); });

      EARTH.bus.sur('pointeur', p => {
        this.pointeur.x = p.x;
        this.pointeur.y = p.y;
        this.pointeur.force = clamp(1 - p.vitesse * 0.6, 0.25, 1);
      });

      this.tirerAbsences();
      setInterval(() => this.tirerAbsences(), 9000);

      this.demarrer();
      this.appliquer();
      return this;
    },

    mesurer() {
      const g = EARTH.CONFIG.grille;
      this.colonnes = mobile() ? g.colonnesMobile : g.colonnes;
      this.lignes = mobile() ? g.lignesMobile : g.lignes;
    },

    redimensionner() {
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      this.canvas.width = Math.round(window.innerWidth * this.dpr);
      this.canvas.height = Math.round(window.innerHeight * this.dpr);
      this.canvas.style.width = window.innerWidth + 'px';
      this.canvas.style.height = window.innerHeight + 'px';
      this.reperes();
    },

    /* certaines lignes manquent, et ce ne sont jamais les mêmes */
    tirerAbsences() {
      const g = EARTH.CONFIG.grille;
      this.absentes = new Set();
      const total = this.colonnes + this.lignes + 2;
      const n = Math.round(total * g.absences);
      for (let i = 0; i < n; i++) {
        this.absentes.add(Math.floor(Math.random() * total));
      }
    },

    reperes() {
      const g = EARTH.CONFIG.grille;
      [...this.el.querySelectorAll('.grille-repere')].forEach(e => e.remove());
      if (!g.reperes || mobile()) return;
      for (let c = 0; c < this.colonnes; c++) {
        const r = document.createElement('span');
        r.className = 'grille-repere';
        r.style.left = ((c + 0.5) / this.colonnes) * 100 + '%';
        r.textContent = String(c + 1).padStart(2, '0');
        this.el.appendChild(r);
      }
    },

    appliquer() {
      this.el.classList.toggle('cachee', !EARTH.CONFIG.grille.visible);
    },

    basculer() {
      EARTH.CONFIG.grille.visible = !EARTH.CONFIG.grille.visible;
      this.appliquer();
    },

    /* ========================================================
       LA DÉFORMATION
       ======================================================== */

    /* les captures présentes, devenues champs de tension.
       lon → direction, lat → force : deux lieux différents ne
       tordent jamais l’espace de la même façon. */
    tensions() {
      const g = EARTH.CONFIG.grille;
      if (!g.attraction) return [];
      const out = [];
      EARTH.Stage.plans.forEach(p => {
        if (p.sorti) return;
        const r = p.frame.getBoundingClientRect();
        if (!r.width || r.bottom < -200 || r.top > window.innerHeight + 200) return;
        const c = p.item.coord;
        const angle = c && c.lonDec != null
          ? (c.lonDec / 180) * Math.PI
          : (r.left / window.innerWidth) * Math.PI;
        const lat = c && c.latDec != null ? Math.abs(c.latDec) / 90 : 0.4;
        out.push({
          x: r.left + r.width / 2,
          y: r.top + r.height / 2,
          rayon: Math.max(r.width, r.height) * 0.9 + 60,
          fx: Math.cos(angle) * (6 + lat * 20) * g.attraction,
          fy: Math.sin(angle) * (4 + lat * 14) * g.attraction
        });
      });
      return out;
    },

    /* le déplacement d’un point de la grille */
    deplacer(x, y, champs) {
      const g = EARTH.CONFIG.grille;
      let dx = 0, dy = 0;

      /* la respiration : très lente, très ample */
      if (g.souffle) {
        dx += Math.sin(y * 0.006 + this.t * 0.00035) * 3.4 * g.souffle;
        dy += Math.cos(x * 0.005 + this.t * 0.00029) * 2.6 * g.souffle;
      }

      /* le frémissement */
      if (g.vibration) {
        dx += Math.sin(x * 0.07 + y * 0.05 + this.t * 0.004) * 0.9 * g.vibration;
        dy += Math.cos(x * 0.05 - y * 0.06 + this.t * 0.0035) * 0.9 * g.vibration;
      }

      /* la main écarte l’espace devant elle */
      if (g.curseur) {
        const ddx = x - this.pointeur.x, ddy = y - this.pointeur.y;
        const d = Math.hypot(ddx, ddy);
        const R = 220;
        if (d < R && d > 0.01) {
          const k = (1 - d / R) ** 2 * 34 * g.curseur * this.pointeur.force;
          dx += (ddx / d) * k;
          dy += (ddy / d) * k;
        }
      }

      /* les captures tordent l’espace autour d’elles */
      for (let i = 0; i < champs.length; i++) {
        const c = champs[i];
        const ddx = x - c.x, ddy = y - c.y;
        const d = Math.hypot(ddx, ddy);
        if (d > c.rayon) continue;
        const k = (1 - d / c.rayon) ** 2;
        dx += c.fx * k;
        dy += c.fy * k;
      }

      return [x + dx, y + dy];
    },

    /* ========================================================
       LE TRACÉ
       ======================================================== */

    dessiner() {
      const g = EARTH.CONFIG.grille;
      const ctx = this.ctx;
      const W = window.innerWidth, H = window.innerHeight;

      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!g.visible) return;

      const champs = this.tensions();
      const pasX = W / this.colonnes;
      const pasY = H / this.lignes;
      ctx.lineWidth = 1;
      ctx.lineCap = 'butt';

      const P = EARTH.Plongee;
      const plonge = P && EARTH.CONFIG.plongee.active && Math.abs(P.z) > 0.001;

      if (!plonge) {
        /* au repos : la grille est calée sur la fenêtre, et c’est
           bien cette grille-là que les partitions savent viser */
        for (let c = 0; c <= this.colonnes; c++) {
          if (this.absentes.has(c) && c !== 0 && c !== this.colonnes) continue;
          const bord = c === 0 || c === this.colonnes;
          this.trait(c * pasX, 'v', bord ? g.traitFort : g.trait, champs, W, H);
        }
        for (let l = 0; l <= this.lignes; l++) {
          if (this.absentes.has(this.colonnes + 1 + l) && l !== 0 && l !== this.lignes) continue;
          const bord = l === 0 || l === this.lignes;
          this.trait(l * pasY, 'h', bord ? g.traitFort : g.trait, champs, W, H);
        }
        return;
      }

      /* en descente : deux générations de quadrillage, l’une qui
         s’écarte et s’efface, l’autre qui naît entre ses lignes.
         Le passage de l’une à l’autre est invisible — c’est ce qui
         rend la descente sans fin. */
      const f = P.facteur();
      const cx = P.centre.x * W, cy = P.centre.y * H;
      const generations = [
        { e: f, a: clamp(2 - f, 0, 1) },
        { e: f / 2, a: clamp(f - 1, 0, 1) }
      ];

      generations.forEach(gen => {
        if (gen.a < 0.02) return;
        const spX = pasX * gen.e, spY = pasY * gen.e;
        const nX = Math.ceil(W / spX) + 2, nY = Math.ceil(H / spY) + 2;
        for (let k = -nX; k <= nX; k++) {
          const x = cx + k * spX;
          if (x < -spX || x > W + spX) continue;
          this.trait(x, 'v', g.trait * gen.a, champs, W, H);
        }
        for (let k = -nY; k <= nY; k++) {
          const y = cy + k * spY;
          if (y < -spY || y > H + spY) continue;
          this.trait(y, 'h', g.trait * gen.a, champs, W, H);
        }
      });
    },

    /* une ligne, déformée point par point */
    trait(position, sens, opacite, champs, W, H) {
      const ctx = this.ctx;
      ctx.strokeStyle = `rgba(0,0,0,${opacite})`;
      ctx.beginPath();
      for (let s = 0; s <= SEGMENTS; s++) {
        const t = s / SEGMENTS;
        const [px, py] = sens === 'v'
          ? this.deplacer(position, t * H, champs)
          : this.deplacer(t * W, position, champs);
        s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    },

    demarrer() {
      const pas = () => {
        this.boucle = requestAnimationFrame(pas);
        this.t = performance.now();
        this.dessiner();
      };
      this.boucle = requestAnimationFrame(pas);
    },

    /* --- ce que la grille offre aux partitions -------------- */

    cellule(c, l, spanC, spanL) {
      const sc = Math.max(1, spanC || 1);
      const sl = Math.max(1, spanL || 1);
      const largeurPx = (sc / this.colonnes) * window.innerWidth;
      return {
        x: (c + sc / 2) / this.colonnes,
        y: (l + sl / 2) / this.lignes,
        w: largeurPx / EARTH.utils.vmin(),
        cellule: { c, l, sc, sl }
      };
    },

    caler(place) {
      const pas = window.innerWidth / this.colonnes / EARTH.utils.vmin();
      return Object.assign({}, place, {
        x: clamp(Math.round(place.x * this.colonnes) / this.colonnes, 0, 1),
        y: clamp(Math.round(place.y * this.lignes) / this.lignes, 0, 1),
        w: Math.max(pas, Math.round(place.w / pas) * pas),
        rot: 0,
        calee: true
      });
    },

    /* --- états ---------------------------------------------- */

    /* La grille ne se creuse plus autour d'une image regardée, et
       elle n'explose plus : ces deux effets ne passaient par aucun
       réglage, donc les curseurs du bac à sable avaient beau être
       à zéro, le quadrillage se tordait quand même en un semis de
       polygones. Une trame droite derrière les images, toujours.
       Les fonctions restent, vides, pour ne rien casser ailleurs. */
    ouvrir() {},
    refermer() {},
    exploser() {},
    respirer() {}
  };

  EARTH.Grille = Grille;

})(window.EARTH = window.EARTH || {});
