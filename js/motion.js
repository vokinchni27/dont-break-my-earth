/* ============================================================
   EARTH — js/motion.js
   ------------------------------------------------------------
   Comment une image arrive, comment elle s'en va.
   Un registre de recettes nommees. Pour en inventer une :

     EARTH.Motion.entrees.mon_nom = (plan, o) => [keyframes];

   ...et son nom devient utilisable dans CONFIG.mouvement.
   Rien d'autre a modifier dans le projet.

   Les animations tournent sur .plate-motion, jamais sur .plate :
   la position et la taille restent donc intactes pendant le
   mouvement (aucun conflit de transform).
   ============================================================ */

(function (EARTH) {
  'use strict';

  const Motion = {

    /* --- ENTREES ------------------------------------------ */
    /* chaque recette renvoie [etatDepart, etatArrivee] */
    entrees: {
      /* apparition brutale : pas de transition du tout */
      coupe: (plan, o) => [
        { opacity: o.opacite, transform: 'none' },
        { opacity: o.opacite, transform: 'none' }
      ],
      fondu: (plan, o) => [
        { opacity: 0, transform: 'none' },
        { opacity: o.opacite, transform: 'none' }
      ],
      derive: (plan, o) => [
        { opacity: 0, transform: `translate(${o.dx}px, ${o.dy}px)` },
        { opacity: o.opacite, transform: 'none' }
      ],
      zoom: (plan, o) => [
        { opacity: 0, transform: `scale(${o.zoomDepart})` },
        { opacity: o.opacite, transform: 'scale(1)' }
      ],
      montee: (plan, o) => [
        { opacity: 0, transform: `translateY(${Math.abs(o.dy) + o.unite * 0.4}px)` },
        { opacity: o.opacite, transform: 'none' }
      ],
      eclosion: (plan, o) => [
        { opacity: 0, transform: 'scale(0.75)' },
        { opacity: o.opacite, transform: 'scale(1)' }
      ],
      // depuis le bord le plus proche
      glisse: (plan, o) => {
        const x = plan.place.x < 0.5 ? -o.unite * 0.5 : o.unite * 0.5;
        return [
          { opacity: 0, transform: `translateX(${x}px)` },
          { opacity: o.opacite, transform: 'none' }
        ];
      }
    },

    /* --- SORTIES ------------------------------------------ */
    sorties: {
      coupe: (plan, o) => [
        { opacity: o.opacite }, { opacity: 0, offset: 0.999 }, { opacity: 0 }
      ],
      fondu: (plan, o) => [
        { opacity: o.opacite, transform: 'none' },
        { opacity: 0, transform: 'none' }
      ],
      retrait: (plan, o) => [
        { opacity: o.opacite, transform: 'scale(1)' },
        { opacity: 0, transform: `scale(${o.zoomDepart})` }
      ],
      chute: (plan, o) => [
        { opacity: o.opacite, transform: 'none' },
        { opacity: 0, transform: `translateY(${o.unite * 0.25}px)` }
      ],
      envol: (plan, o) => [
        { opacity: o.opacite, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(1.12)' }
      ]
    },

    /* --- moteur ------------------------------------------- */
    entree(nom, plan, delai) {
      const cfg = EARTH.CONFIG;
      const choix = resoudre(nom, cfg.mouvement.entree, this.entrees, cfg.mouvement.poolEntree);
      const o = options(plan);
      const keyframes = this.entrees[choix](plan, o);
      const duree = choix === 'coupe' ? 1 : cfg.mouvement.dureeEntree;
      return plan.motion.animate(keyframes, {
        duration: duree,
        delay: delai,
        easing: cfg.mouvement.courbe,
        fill: 'both'
      });
    },

    sortie(nom, plan, delai) {
      const cfg = EARTH.CONFIG;
      const choix = resoudre(nom, cfg.mouvement.sortie, this.sorties, cfg.mouvement.poolSortie);
      const o = options(plan);
      const keyframes = this.sorties[choix](plan, o);
      const duree = choix === 'coupe' ? 1 : cfg.mouvement.dureeSortie;
      return plan.motion.animate(keyframes, {
        duration: duree,
        delay: delai,
        easing: cfg.mouvement.courbe,
        fill: 'both'
      });
    }
  };

  /* nom explicite > reglage global > tirage dans le pool */
  function resoudre(nom, global, registre, pool) {
    if (nom && registre[nom]) return nom;
    if (global && global !== 'auto' && registre[global]) return global;
    const dispo = pool.filter(n => registre[n]);
    return dispo[Math.floor(Math.random() * dispo.length)] || Object.keys(registre)[0];
  }

  function options(plan) {
    const cfg = EARTH.CONFIG;
    const unite = Math.min(window.innerWidth, window.innerHeight);
    const d = cfg.mouvement.derive * unite;
    return {
      unite,
      dx: (Math.random() * 2 - 1) * d,
      dy: (Math.random() * 2 - 1) * d,
      zoomDepart: cfg.mouvement.zoomDepart,
      opacite: cfg.regard.opacite
    };
  }

  EARTH.Motion = Motion;

})(window.EARTH = window.EARTH || {});
