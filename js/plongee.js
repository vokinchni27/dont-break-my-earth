/* ============================================================
   EARTH — js/plongee.js
   ------------------------------------------------------------
   Descendre dans le quadrillage.

   Ce n’est pas un défilement : rien ne glisse vers le haut. Les
   cases s’écartent, les captures s’éloignent de nous, et de
   nouvelles naissent au centre. La grille se subdivise sans
   jamais se répéter tout à fait.

   L’archive n’a pas de fond. La Terre non plus.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { clamp, lerp, Rand, interfaceSous } = EARTH.utils;

  const Plongee = {
    z: 0,                 // profondeur continue, en paliers
    vitesse: 0,
    centre: { x: 0.5, y: 0.5 },
    dernierPalier: 0,
    boucle: null,

    init() {
      this.centre.x = 0.5;
      this.centre.y = 0.5;

      window.addEventListener('wheel', e => {
        if (!EARTH.CONFIG.plongee.active) return;
        /* Sur une surface d'interface — le formulaire de dépôt, le
           bac à sable, le feuillet — la molette fait ce qu'elle
           fait partout ailleurs sur le web : elle défile. On ne
           l'intercepte pas, et surtout on ne l'annule pas. */
        if (interfaceSous(e.target)) return;
        e.preventDefault();
        this.vitesse += e.deltaY * EARTH.CONFIG.plongee.vitesse;
        this.centre.x = clamp(e.clientX / window.innerWidth, 0.1, 0.9);
        this.centre.y = clamp(e.clientY / window.innerHeight, 0.1, 0.9);
        EARTH.Director.suspendre(5000);
      }, { passive: false });

      /* ------------------------------------------------------
         AU DOIGT
         Deux gestes, pas un : le pincement, et surtout le simple
         glissement vertical. Exiger deux doigts condamnait le
         téléphone à ne rien faire — on y glisse d'instinct, on
         n'y pince presque jamais.
         ------------------------------------------------------ */
      let pincee = null;
      let dernierY = null, dernierX = null;

      window.addEventListener('touchstart', e => {
        pincee = null;
        if (e.touches.length === 1 && !interfaceSous(e.target)) {
          dernierY = e.touches[0].clientY;
          dernierX = e.touches[0].clientX;
        } else { dernierY = null; }
      }, { passive: true });

      window.addEventListener('touchmove', e => {
        if (!EARTH.CONFIG.plongee.active || interfaceSous(e.target)) return;
        const cfg = EARTH.CONFIG.plongee;

        /* un doigt qui glisse : on descend, comme à la molette */
        if (e.touches.length === 1 && dernierY != null) {
          const t = e.touches[0];
          const dy = dernierY - t.clientY;
          dernierY = t.clientY;
          /* sous le seuil, c'est un appui qui tremble, pas un geste */
          if (Math.abs(dy) > 1.5) {
            this.vitesse += dy * cfg.vitesse * 1.15;
            this.centre.x = clamp(dernierX / window.innerWidth, 0.1, 0.9);
            this.centre.y = clamp(t.clientY / window.innerHeight, 0.1, 0.9);
            EARTH.Director.suspendre(4000);
          }
          return;
        }

        /* deux doigts : le pincement fait la même chose, en plus franc */
        if (e.touches.length !== 2) return;
        dernierY = null;
        const [a, b] = e.touches;
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        if (pincee != null) {
          this.vitesse += (pincee - d) * cfg.vitesse * 1.6;
          this.centre.x = clamp((a.clientX + b.clientX) / 2 / window.innerWidth, 0.1, 0.9);
          this.centre.y = clamp((a.clientY + b.clientY) / 2 / window.innerHeight, 0.1, 0.9);
        }
        pincee = d;
      }, { passive: true });

      window.addEventListener('touchend', () => { pincee = null; dernierY = null; }, { passive: true });

      this.demarrer();
      return this;
    },

    /* le facteur d’écartement dans le palier courant : 1 → 2 */
    facteur() {
      const f = this.z - Math.floor(this.z);
      return Math.pow(2, f);
    },

    demarrer() {
      let dernier = performance.now();
      const pas = () => {
        this.boucle = requestAnimationFrame(pas);
        const maintenant = performance.now();
        const dt = clamp((maintenant - dernier) / 16.7, 0.2, 3);
        dernier = maintenant;

        if (Math.abs(this.vitesse) < 0.00002) { this.vitesse = 0; return; }

        const cfg = EARTH.CONFIG.plongee;
        this.z += this.vitesse * dt;
        this.vitesse *= Math.pow(cfg.inertie, dt);

        this.ecarter();

        /* chaque palier franchi peuple le centre */
        const palier = Math.floor(this.z);
        if (palier !== this.dernierPalier) {
          this.dernierPalier = palier;
          this.naitre();
        }
      };
      this.boucle = requestAnimationFrame(pas);
    },

    /* les captures s’éloignent du point de descente */
    ecarter() {
      const cfg = EARTH.CONFIG.plongee;
      const cx = this.centre.x, cy = this.centre.y;

      EARTH.Stage.plans.forEach(p => {
        if (p.sorti || p.recompense) return;
        if (p.z0 == null) { p.z0 = this.z; p.place0 = { x: p.place.x, y: p.place.y, w: p.place.w }; }

        const s = Math.pow(2, this.z - p.z0);
        if (s > cfg.limite) { EARTH.Stage.retirer(p, 'fondu'); return; }
        if (s < 1 / cfg.limite) { EARTH.Stage.retirer(p, 'fondu'); return; }

        const x = cx + (p.place0.x - cx) * s;
        const y = cy + (p.place0.y - cy) * s;
        p.place.x = x;
        p.place.y = y;
        p.place.w = p.place0.w * s;
        p.el.style.setProperty('--x', x);
        p.el.style.setProperty('--y', y);
        p.el.style.setProperty('--w', p.place.w);
        /* elles s’effacent en nous dépassant */
        p.el.style.opacity = String(clamp(
          Math.min(s * 1.4, (cfg.limite - s) / (cfg.limite * 0.4)), 0, 1));
      });
    },

    naitre() {
      const cfg = EARTH.CONFIG.plongee;
      const rand = Rand();
      for (let i = 0; i < cfg.naissances; i++) {
        const item = EARTH.Archive.suivante(rand, EARTH.CONFIG.archive.ordre);
        if (!item) return;
        const plan = EARTH.Stage.poser(item, {
          x: this.centre.x + rand.f(-0.13, 0.13),
          y: this.centre.y + rand.f(-0.13, 0.13),
          w: lerp(EARTH.CONFIG.echelle.min, EARTH.CONFIG.echelle.max, rand.biais(0, 0.22, 1.6)),
          z: 10 + i,
          libre: true
        }, 'fondu', i * 120);
        if (plan) { plan.z0 = this.z; plan.place0 = { x: plan.place.x, y: plan.place.y, w: plan.place.w }; }
      }
    },

    reprendre() {
      this.z = 0; this.vitesse = 0; this.dernierPalier = 0;
      EARTH.Stage.plans.forEach(p => { p.z0 = null; p.el.style.opacity = ''; });
    }
  };

  EARTH.Plongee = Plongee;

})(window.EARTH = window.EARTH || {});
