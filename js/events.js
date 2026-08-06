/* ============================================================
   EARTH — js/events.js
   ------------------------------------------------------------
   Les evenements rares.

   Ils ne se declenchent pas au hasard pur : ils naissent d'un
   geste (avoir creuse profond, avoir tout disperse, etre reste
   longtemps). La surprise recompense une maniere de faire, elle
   ne tombe pas du ciel.

   Ajouter un evenement = ajouter une fonction au registre.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { Rand, clamp } = EARTH.utils;

  /* quelle cause appelle quel evenement */
  const AFFINITES = {
    fouille:     { apparition: 3, inondation: 2, nuit: 1 },
    dispersion:  { eclat: 4, effacement: 2, alignement: 2 },
    naissance:   { alignement: 2, inondation: 1 },
    composition: { inondation: 1, nuit: 1, combustion: 1, alignement: 1 },
    contemplation: { apparition: 3, combustion: 2 }
  };

  const Evenements = {
    dernier: 0,
    encours: null,
    journal: [],

    registre: {

      /* toutes les coordonnees de l'archive envahissent l'ecran,
         chacune a sa vraie place : la carte se montre, une fois */
      inondation(fin) {
        EARTH.Coords.inonder(5200);
        setTimeout(fin, 6800);
      },

      /* tout disparait. Le blanc, seul, quelques secondes. */
      effacement(fin) {
        EARTH.Stage.viderTout('fondu');
        EARTH.Texte.viderTout();
        setTimeout(() => {
          EARTH.Texte.poser(EARTH.T('evenements.rienAVoir'), { x: 0.5, y: 0.5 },
            { taille: 15, duree: 2600, alignement: 'center' });
        }, 1400);
        setTimeout(fin, 4600);
      },

      /* la nuit tombe sur l'archive */
      nuit(fin) {
        document.body.classList.add('nuit');
        setTimeout(() => { document.body.classList.remove('nuit'); fin(); }, 5200);
      },

      /* l'ordre, brutalement : tout se cale sur la grille */
      alignement(fin) {
        const G = EARTH.Grille;
        const vivants = EARTH.Stage.plans.filter(p => !p.sorti);
        if (!EARTH.CONFIG.grille.visible) { EARTH.CONFIG.grille.visible = true; G.appliquer(); }
        vivants.forEach((p, i) => {
          setTimeout(() => EARTH.Stage.replacer(p, G.caler(p.place), 900), i * 55);
        });
        setTimeout(fin, 1400 + vivants.length * 55);
      },

      /* la grille explose */
      eclat(fin) {
        if (!EARTH.CONFIG.grille.visible) { EARTH.CONFIG.grille.visible = true; EARTH.Grille.appliquer(); }
        EARTH.Grille.exploser(2600);
        setTimeout(fin, 2800);
      },

      /* une image immense, et rien d'autre */
      apparition(fin) {
        const rand = Rand();
        const item = EARTH.Archive.suivante(rand, 'sac');
        EARTH.Stage.viderTout('fondu');
        const plan = EARTH.Stage.poser(item, {
          x: 0.5, y: 0.5, w: EARTH.CONFIG.echelle.max * 1.25, z: 500
        }, 'fondu', 500);
        setTimeout(() => { if (plan) EARTH.Stage.retirer(plan, 'fondu'); fin(); }, 7200);
      },

      /* une image se consume : elle blanchit jusqu'a disparaitre.
         Pas de flammes — le feu, ici, c'est la surexposition. */
      combustion(fin) {
        const vivants = EARTH.Stage.plans.filter(p => !p.sorti);
        const plan = vivants[Math.floor(Math.random() * vivants.length)];
        if (!plan) return fin();
        plan.frame.animate([
          { filter: 'none' },
          { filter: 'contrast(2.4) brightness(1.9) saturate(0.4)', offset: 0.45 },
          { filter: 'contrast(6) brightness(6) saturate(0)' }
        ], { duration: 3200, easing: 'cubic-bezier(.6,0,.9,.4)', fill: 'forwards' });
        setTimeout(() => { EARTH.Stage.retirer(plan, 'fondu'); fin(); }, 3400);
      },

      /* le texte remplit progressivement la page */
      envahissement(fin) {
        EARTH.Texte.envahir(7000);
        setTimeout(fin, 9000);
      }
    },

    /* --- declenchement -------------------------------------- */

    peutEtre(cause) {
      const cfg = EARTH.CONFIG.evenements;
      if (!cfg.actifs || this.encours) return false;
      const t = performance.now();
      if (t - this.dernier < cfg.palier) return false;
      if (Math.random() > cfg.rarete) return false;
      return this.declencher(choisir(cause, cfg.liste));
    },

    declencher(nom) {
      const fn = this.registre[nom];
      if (!fn || this.encours) return false;
      this.encours = nom;
      this.dernier = performance.now();
      this.journal.push(nom);
      if (EARTH.CONFIG.bacASable.journal) console.log('[EARTH] événement rare : ' + nom);
      EARTH.Director.suspendre(12000);
      let fini = false;
      const fin = () => {
        if (fini) return;
        fini = true;
        this.encours = null;
        EARTH.Director.suspendre(1200);
      };
      try { fn(fin); } catch (e) { console.error(e); fin(); }
      setTimeout(fin, 15000);          // filet : jamais bloque
      return true;
    },

    get noms() { return Object.keys(this.registre); }
  };

  function choisir(cause, autorises) {
    const poids = AFFINITES[cause] || {};
    const sac = [];
    autorises.forEach(nom => {
      const n = clamp(poids[nom] || 1, 1, 8);
      for (let i = 0; i < n; i++) sac.push(nom);
    });
    return sac[Math.floor(Math.random() * sac.length)];
  }

  EARTH.Evenements = Evenements;

})(window.EARTH = window.EARTH || {});
