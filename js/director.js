/* ============================================================
   EARTH — js/director.js
   ------------------------------------------------------------
   Le temps. Ce qui apparait, quand, et comment on passe d'une
   composition a la suivante.

   Il ne place rien lui-meme : il demande une partition a
   layouts.js, des images a loader.js, et confie la pose a
   stage.js. Trois responsabilites, trois modules.

   Chaque composition est identifiee par une graine : elle peut
   donc etre rejouee a l'identique (touche R), ou notee pour plus
   tard (CONFIG.bacASable.graine).
   ============================================================ */

(function (EARTH) {
  'use strict';

  const Director = {
    enPause: false,
    minuteur: null,
    histoire: [],       // [{ nom, graine, passage }]
    index: -1,
    courante: null,
    derniereCascade: 0, // temps de mise en place de la composition courante
    ecouteurs: [],

    demarrer() {
      this.enPause = false;
      this.suivante();
    },

    /* --- navigation --------------------------------------- */

    suivante() {
      const cfg = EARTH.CONFIG;
      const graine = cfg.bacASable.graine != null
        ? cfg.bacASable.graine
        : Math.floor(Math.random() * 1e9);
      const scene = { nom: choisirNom(graine), graine, passage: null };
      this.histoire = this.histoire.slice(0, this.index + 1);
      this.histoire.push(scene);
      if (this.histoire.length > 60) this.histoire.shift();
      this.index = this.histoire.length - 1;
      this.jouer(scene);
    },

    precedente() {
      if (this.index <= 0) return;
      this.index--;
      this.jouer(this.histoire[this.index], { passage: 'remplace' });
    },

    /* rejoue la composition en cours, au pixel pres */
    rejouer() {
      if (!this.courante) return this.suivante();
      this.jouer(this.courante, { passage: 'remplace' });
    },

    /* meme partition, nouveau tirage */
    relancer() {
      if (!this.courante) return this.suivante();
      this.jouer({ nom: this.courante.nom, graine: Math.floor(Math.random() * 1e9) },
                 { passage: 'remplace' });
    },

    forcer(nom) {
      this.jouer({ nom, graine: Math.floor(Math.random() * 1e9) }, { passage: 'remplace' });
    },

    pause() { this.enPause = true; clearTimeout(this.minuteur); this.prevenir(); },
    reprendre() { this.enPause = false; this.programmer(); this.prevenir(); },
    bascule() { this.enPause ? this.reprendre() : this.pause(); },

    /* --- le coeur ----------------------------------------- */

    jouer(scene, options) {
      const cfg = EARTH.CONFIG;
      const Stage = EARTH.Stage;
      const rand = EARTH.utils.Rand(scene.graine);

      const nom = EARTH.Layouts.get(scene.nom) ? scene.nom : choisirNom(scene.graine);
      const compo = EARTH.Layouts.composer(nom, rand);

      /* comment on quitte la composition precedente.
         Un passage demande explicitement (panneau, clavier) est
         respecte tel quel : cliquer une partition doit montrer
         cette partition, pas un empilement. */
      const impose = options && options.passage;
      let passage = impose || cfg.rythme.passage;
      if (!impose && passage === 'remplace' && rand.chance(cfg.rythme.accumuleChance)) passage = 'accumule';
      scene.passage = passage;

      const sortie = def(compo, 'sortie');
      if (passage === 'remplace') {
        Stage.viderTout(sortie);
      } else if (passage === 'echange') {
        rand.shuffle(Stage.plans).slice(0, Math.ceil(Stage.plans.length / 2))
            .forEach((p, i) => Stage.retirer(p, sortie, i * 60));
      }

      /* les images. Une partition peut les avoir choisies elle-meme
         (composition gouvernee par les coordonnees) ; sinon c'est
         l'archive qui distribue. */
      const items = compo.items && compo.items.length
        ? compo.items
        : EARTH.Archive.lot(compo.places.length, rand, cfg.archive.ordre);
      if (!items.length) { this.courante = scene; this.programmer(); return; }

      const entree = def(compo, 'entree');
      const retard = passage === 'remplace' ? cfg.mouvement.dureeSortie * 0.45 : 0;

      /* Une nuee de 22 vignettes a 420 ms d'ecart mettrait 9 s a se
         poser : la composition serait remplacee avant d'exister.
         La cascade est donc resserree pour que l'ensemble tienne
         dans une fraction de la tenue. Le reglage reste vrai pour
         les compositions courtes, ou rien ne le contraint. */
      const n = compo.places.length;
      const budget = cfg.rythme.tenue * cfg.rythme.cascadeBudget;
      const cascade = Math.min(Math.max(0, cfg.rythme.cascade), n > 1 ? budget / (n - 1) : budget);
      const variation = Math.min(cfg.rythme.cascadeVariation, cascade);

      compo.places.forEach((place, i) => {
        const item = items[i % items.length];
        Stage.poser(item, place, entree, retard + i * cascade + rand.f(0, variation));
      });

      this.courante = scene;
      this.derniereCascade = retard + (n - 1) * cascade + variation;
      if (cfg.bacASable.journal) {
        console.log(`[EARTH] ${nom} · ${n} plans · graine ${scene.graine} · ${passage} · cascade ${Math.round(cascade)}ms`);
      }

      /* une respiration de temps en temps, et la possibilite
         qu'il arrive quelque chose */
      EARTH.Texte.fragment(rand);
      EARTH.Evenements.peutEtre('composition');

      this.prevenir();
      this.programmer();
    },

    /* --- le geste suspend le temps -------------------------- */
    /* tant que le visiteur agit, la machine ne remplace pas ce
       qu'il est en train de regarder. L'oeuvre lui cede la main. */
    suspendre(ms) {
      const t = performance.now() + Math.max(ms || 0, EARTH.CONFIG.rythme.patience);
      this.suspenduJusqua = Math.max(this.suspenduJusqua || 0, t);
      this.programmer();
    },

    /* la tenue commence quand la composition est complete, pas
       quand elle commence a se poser */
    programmer() {
      clearTimeout(this.minuteur);
      if (this.enPause) return;
      const cfg = EARTH.CONFIG;
      const v = cfg.rythme.tenueVariation;
      const pose = this.derniereCascade || 0;
      const duree = Math.max(600, pose + cfg.rythme.tenue + (Math.random() * 2 - 1) * v);
      const attente = Math.max(duree, (this.suspenduJusqua || 0) - performance.now());
      this.minuteur = setTimeout(() => this.suivante(), attente);
    },

    /* --- pour le panneau ---------------------------------- */
    surChangement(fn) { this.ecouteurs.push(fn); },
    prevenir() { this.ecouteurs.forEach(fn => fn(this.courante, this.enPause)); }
  };

  function def(compo, cle) {
    const global = EARTH.CONFIG.mouvement[cle === 'entree' ? 'entree' : 'sortie'];
    if (global && global !== 'auto') return global;
    return (compo.def.mouvement && compo.def.mouvement[cle]) || 'auto';
  }

  function choisirNom(graine) {
    const cfg = EARTH.CONFIG;
    if (cfg.compositions.forcee) return cfg.compositions.forcee;
    const dispo = cfg.compositions.actives.filter(n => EARTH.Layouts.get(n));
    if (!dispo.length) return EARTH.Layouts.noms[0];
    return dispo[Math.floor(EARTH.utils.Rand(graine ^ 0x9e3779b9).next() * dispo.length)];
  }

  EARTH.Director = Director;

})(window.EARTH = window.EARTH || {});
