/* ============================================================
   EARTH — js/interactions.js
   ------------------------------------------------------------
   Ce que les gestes provoquent. Le coeur de l'oeuvre.

   Dix comportements, pas cinquante. Chacun doit se remarquer,
   se comprendre sans mode d'emploi, et donner envie de
   recommencer autrement.

     effleurer   les coordonnees apparaissent, l'image se leve
     s'attarder  l'image en appelle d'autres — ses voisines reelles
                 sur la Terre, pas ses voisines de dossier
     appui bref  plein regard : tout s'efface sauf elle
     maintenir   on creuse : le meme lieu, de plus en plus pres
     lent        les images respirent (parallaxe)
     rapide      les images se dispersent
     immobile    la contemplation est payee : une image immense
     vide        cliquer sur le blanc fait naitre une image
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { vmin, clamp, lerp, Rand } = EARTH.utils;
  const bus = EARTH.bus;

  const Interactions = {
    parallaxe: { x: 0.5, y: 0.5 },
    focalise: null,
    recompense: null,
    fouille: [],
    boucle: null,
    minuteurAttrait: null,
    attires: [],

    init() {
      const Stage = EARTH.Stage;

      /* --- effleurer ---------------------------------------- */
      bus.sur('effleure', ({ plan }) => {
        EARTH.Coords.montrer(plan);
        EARTH.Stage.monterEnQualite(plan);      // le survol charge l'original
        plan.el.classList.add('effleure');
        clearTimeout(this.minuteurAttrait);
        /* s'attarder sur une image appelle ses voisines reelles */
        this.minuteurAttrait = setTimeout(() => this.attirer(plan), 950);
      });

      bus.sur('quitte', ({ plan }) => {
        EARTH.Coords.cacher();
        plan.el.classList.remove('effleure');
        clearTimeout(this.minuteurAttrait);
        this.relacherAttires();
      });

      /* --- appui bref --------------------------------------- */
      bus.sur('bref', ({ plan, x, y }) => {
        if (plan) this.pleinRegard(plan);
        else this.naitre(x, y);
      });

      /* --- maintenir : creuser ------------------------------ */
      bus.sur('maintien-debut', () => { this.fouille = []; document.body.classList.add('creuse'); });
      bus.sur('maintien', d => this.creuser(d));
      bus.sur('maintien-fin', d => this.finFouille(d));

      /* --- respiration et dispersion ------------------------ */
      bus.sur('lent', p => { this.parallaxe.x = p.nx; this.parallaxe.y = p.ny; });
      bus.sur('pointeur', p => {
        this.parallaxe.x = p.nx;
        this.parallaxe.y = p.ny;
        EARTH.Coords.suivre(p.x, p.y);
      });
      bus.sur('rapide', p => this.disperser(p));

      /* --- immobilite --------------------------------------- */
      bus.sur('immobile', p => this.contempler(p));
      bus.sur('reveil', () => this.finContemplation());

      this.demarrerBoucle();
      return this;
    },

    /* ========================================================
       S'ATTARDER — une image en appelle d'autres
       Les voisines ne sont pas tirees au hasard : ce sont les
       captures les plus proches sur la Terre. Le geste revele
       une geographie, pas une base de donnees.
       ======================================================== */
    attirer(plan) {
      if (this.focalise || !plan || plan.sorti) return;
      const rand = Rand();
      const voisines = EARTH.Archive.voisines(plan.item, 3);
      const r = plan.frame.getBoundingClientRect();
      const cx = (r.left + r.width / 2) / window.innerWidth;
      const cy = (r.top + r.height / 2) / window.innerHeight;
      const rayon = 0.16 + (r.width / window.innerWidth) * 0.4;

      voisines.forEach((item, i) => {
        const angle = (i / voisines.length) * Math.PI * 2 + rand.f(0, 1);
        const place = {
          x: clamp(cx + Math.cos(angle) * rayon, 0.05, 0.95),
          y: clamp(cy + Math.sin(angle) * rayon * 0.7, 0.06, 0.94),
          w: (r.width / vmin()) * rand.f(0.22, 0.42),
          z: 60 + i
        };
        const p = EARTH.Stage.poser(item, place, 'eclosion', i * 110);
        if (p) { p.attire = true; this.attires.push(p); }
      });
    },

    relacherAttires() {
      const liste = this.attires;
      this.attires = [];
      liste.forEach((p, i) => EARTH.Stage.retirer(p, 'retrait', i * 70));
    },

    /* ========================================================
       PLEIN REGARD — appui bref
       Tout s'efface, elle occupe la Terre entiere quelques
       secondes, puis rend l'espace.
       ======================================================== */
    pleinRegard(plan) {
      if (this.focalise) return this.liberer();
      const Stage = EARTH.Stage;
      this.focalise = plan;
      document.body.classList.add('focalise');

      Stage.monterEnQualite(plan);
      Stage.attenuerSauf(plan, 0.05);
      /* l'image quitte la grille et flotte. Jamais de fenêtre :
         on reste dans le même espace, la grille reste derrière. */
      const rendre = Stage.focaliser(plan, { couverture: 0.94, duree: 900 });
      EARTH.Grille.ouvrir(plan);

      this.minuteurFocus = setTimeout(() => this.liberer(), 3400);
      this._rendre = rendre;
      EARTH.Director.suspendre(4200);
    },

    liberer() {
      if (!this.focalise) return;
      clearTimeout(this.minuteurFocus);
      const plan = this.focalise;
      this.focalise = null;
      document.body.classList.remove('focalise');
      EARTH.Grille.refermer();
      if (this._rendre) this._rendre();
      EARTH.Stage.retablir();
      /* elle a ete vue : elle peut disparaitre */
      setTimeout(() => EARTH.Stage.retirer(plan, 'fondu'), 700);
    },

    /* ========================================================
       CREUSER — appui maintenu
       Chaque palier fait surgir un fragment du MEME lieu, plus
       petit et plus serre : on ne parcourt pas l'archive, on
       s'enfonce dedans.
       ======================================================== */
    creuser({ x, y, plan, profondeur }) {
      const rand = Rand();
      const source = plan ? plan.item : (EARTH.Coords.plusProche(x, y) || {}).item;
      if (!source) return;

      const items = EARTH.Archive.memeLieu(source, 1, rand);
      const item = items[0] || source;

      const serrage = 1 - profondeur / (EARTH.CONFIG.geste.creuseMax + 4);
      const rayon = vmin() * 0.22 * serrage;
      const angle = rand.f(0, Math.PI * 2);

      const place = {
        x: clamp((x + Math.cos(angle) * rayon) / window.innerWidth, 0.02, 0.98),
        y: clamp((y + Math.sin(angle) * rayon) / window.innerHeight, 0.02, 0.98),
        w: lerp(0.34, 0.05, profondeur / EARTH.CONFIG.geste.creuseMax) * rand.f(0.8, 1.2),
        z: 200 + profondeur,
        /* et surtout : on entre dans l'image. Chaque palier
           agrandit un detail de plus en plus petit. */
        fouille: {
          zoom: 1 + profondeur * 0.55,
          cx: rand.f(0.2, 0.8),
          cy: rand.f(0.2, 0.8)
        }
      };

      const p = EARTH.Stage.poser(item, place, 'coupe', 0);
      if (p) { p.fouillee = true; this.fouille.push(p); }
      EARTH.Director.suspendre(3000);
    },

    finFouille({ profondeur }) {
      document.body.classList.remove('creuse');
      const liste = this.fouille;
      this.fouille = [];
      /* peu creuse : le trou se referme.
         beaucoup creuse : ce qu'on a trouve reste, et devient
         la composition. La curiosite est recompensee. */
      if (profondeur < 5) {
        setTimeout(() => liste.forEach((p, i) => EARTH.Stage.retirer(p, 'retrait', i * 60)), 900);
      } else {
        EARTH.Evenements.peutEtre('fouille');
      }
    },

    /* ========================================================
       DISPERSER — geste vif
       ======================================================== */
    disperser({ x, y, vitesse }) {
      const force = clamp(vitesse, 0, 3) * 9 * EARTH.CONFIG.geste.dispersion;
      const rayon = vmin() * 0.34;
      EARTH.Stage.plans.forEach(p => {
        if (p.sorti) return;
        const r = p.frame.getBoundingClientRect();
        const dx = (r.left + r.width / 2) - x;
        const dy = (r.top + r.height / 2) - y;
        const d = Math.hypot(dx, dy);
        if (d > rayon || d < 0.001) return;
        const k = (1 - d / rayon) * force;
        p.vx = (p.vx || 0) + (dx / d) * k;
        p.vy = (p.vy || 0) + (dy / d) * k;
      });
      EARTH.Director.suspendre(2500);
      EARTH.Evenements.peutEtre('dispersion');
    },

    /* ========================================================
       CONTEMPLER — ne rien faire assez longtemps
       ======================================================== */
    contempler() {
      if (this.recompense || this.focalise) return;
      const Stage = EARTH.Stage;
      const rand = Rand();
      const item = EARTH.Archive.suivante(rand, 'sac');
      if (!item) return;

      Stage.plans.forEach(p => Stage.retirer(p, 'fondu', rand.i(0, 700)));
      EARTH.Texte.viderTout();

      const plan = Stage.poser(item, {
        x: 0.5, y: 0.5,
        w: EARTH.CONFIG.echelle.max * 0.98,
        z: 400
      }, 'zoom', 900);

      if (plan) {
        plan.recompense = true;
        this.recompense = plan;
        /* une derive tres lente : l'image n'est jamais tout a fait fixe */
        plan.motion.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }],
          { duration: 46000, easing: 'linear', fill: 'forwards', composite: 'add' }
        );
      }
      EARTH.Director.suspendre(60000);
      document.body.classList.add('contemple');
    },

    finContemplation() {
      if (!this.recompense) return;
      const plan = this.recompense;
      this.recompense = null;
      document.body.classList.remove('contemple');
      EARTH.Stage.retirer(plan, 'fondu');
      EARTH.Director.suspendre(600);
    },

    /* ========================================================
       NAITRE — cliquer sur le vide
       Le blanc n'est pas mort : il peut produire une image.
       ======================================================== */
    naitre(x, y) {
      const rand = Rand();
      const item = EARTH.Archive.suivante(rand, EARTH.CONFIG.archive.ordre);
      if (!item) return;
      EARTH.Stage.poser(item, {
        x: x / window.innerWidth,
        y: y / window.innerHeight,
        w: lerp(EARTH.CONFIG.echelle.min, EARTH.CONFIG.echelle.max, rand.biais(0.05, 0.55, 1.6)),
        z: 90
      }, 'eclosion', 0);
      EARTH.Director.suspendre(3000);
      EARTH.Evenements.peutEtre('naissance');
    },

    /* ========================================================
       LA BOUCLE — respiration + dispersion, un seul endroit
       ======================================================== */
    demarrerBoucle() {
      const pas = () => {
        this.boucle = requestAnimationFrame(pas);
        const g = EARTH.CONFIG.geste;
        const ax = (this.parallaxe.x - 0.5);
        const ay = (this.parallaxe.y - 0.5);

        EARTH.Stage.plans.forEach(p => {
          /* la profondeur vient de la taille : les grandes images
             sont proches, elles bougent plus */
          const profondeur = clamp(p.place.w / EARTH.CONFIG.echelle.max, 0.05, 1);
          const px = -ax * profondeur * 46 * g.parallaxe;
          const py = -ay * profondeur * 30 * g.parallaxe;

          p.vx = (p.vx || 0) * 0.9;
          p.vy = (p.vy || 0) * 0.9;
          p.ox = (p.ox || 0) + p.vx;
          p.oy = (p.oy || 0) + p.vy;
          p.ox *= 0.94;                       // tout revient toujours
          p.oy *= 0.94;

          const dx = px + p.ox, dy = py + p.oy;
          if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
            p.el.style.setProperty('--px', dx.toFixed(2) + 'px');
            p.el.style.setProperty('--py', dy.toFixed(2) + 'px');
          }
        });

        if (EARTH.CONFIG.grille.visible) EARTH.Grille.respirer(this.parallaxe.x, this.parallaxe.y);
      };
      this.boucle = requestAnimationFrame(pas);
    }
  };

  EARTH.Interactions = Interactions;

})(window.EARTH = window.EARTH || {});
