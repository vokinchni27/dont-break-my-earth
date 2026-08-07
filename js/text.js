/* ============================================================
   EARTH — js/text.js
   ------------------------------------------------------------
   Le texte comme respiration. Tres peu, jamais explicatif.
   Une grotesque neutre, aucun effet.

   Il ne bouge pas. Les lettres fuyaient le curseur et pivotaient
   en le fuyant : un texte qui se derobe quand on s'en approche
   est un texte qu'on ne lit pas. Il parait, il se lit, il part.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const Texte = {
    el: null,
    blocs: [],

    init(el) {
      this.el = el;
      return this;
    },

    /* --- poser un fragment --------------------------------- */

    poser(phrase, place, options) {
      const cfg = EARTH.CONFIG.texte;
      if (!cfg.actif || !phrase) return null;
      const o = options || {};

      const bloc = document.createElement('div');
      bloc.className = 'texte-bloc';
      bloc.style.left = (place.x * 100) + '%';
      bloc.style.top = (place.y * 100) + '%';
      bloc.style.setProperty('--taille', (o.taille || cfg.taille) + 'px');
      if (o.alignement) bloc.style.textAlign = o.alignement;

      /* une lettre par span : l'apparition se fait en cascade, et
         c'est la SEULE animation. Aucune reaction au curseur. */
      phrase.split('').forEach((car, i) => {
        const s = document.createElement('span');
        s.className = 'texte-lettre';
        s.textContent = car === ' ' ? ' ' : car;
        s.style.animationDelay = (i * 26) + 'ms';
        bloc.appendChild(s);
      });

      this.el.appendChild(bloc);
      this.blocs.push(bloc);

      const duree = o.duree == null ? cfg.duree : o.duree;
      if (duree > 0) setTimeout(() => this.retirer(bloc), duree);
      return bloc;
    },

    retirer(bloc) {
      if (!bloc || !bloc.isConnected) return;
      bloc.classList.add('sortie');
      setTimeout(() => {
        this.blocs = this.blocs.filter(b => b !== bloc);
        bloc.remove();
      }, 900);
    },

    viderTout() { this.blocs.slice().forEach(b => this.retirer(b)); },

    /* --- un fragment au hasard, pose quelque part ----------- */

    fragment(rand) {
      const cfg = EARTH.CONFIG.texte;
      if (!cfg.actif || !cfg.fragments.length) return;
      if (!rand.chance(cfg.frequence)) return;
      this.poser(rand.pick(cfg.fragments), {
        x: rand.f(0.12, 0.62),
        y: rand.f(0.15, 0.85)
      }, { taille: cfg.taille * rand.f(0.8, 1.6) });
    },

    /* --- le texte envahit la page (evenement rare) ---------- */

    envahir(duree) {
      const cfg = EARTH.CONFIG.texte;
      const source = cfg.fragments.concat(
        EARTH.Archive.situees.slice(0, 40).map(i => i.coord.lat + ' ' + i.coord.lon)
      );
      const n = Math.min(26, source.length);
      for (let i = 0; i < n; i++) {
        setTimeout(() => {
          this.poser(source[i % source.length], {
            x: 0.06 + Math.random() * 0.7,
            y: 0.08 + Math.random() * 0.84
          }, { taille: cfg.taille * (0.7 + Math.random() * 1.4), duree: (duree || 6000) - i * 120 });
        }, i * 170);
      }
    }
  };

  EARTH.Texte = Texte;

})(window.EARTH = window.EARTH || {});
