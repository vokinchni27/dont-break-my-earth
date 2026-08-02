/* ============================================================
   EARTH — js/text.js
   ------------------------------------------------------------
   Le texte comme respiration. Tres peu, jamais explicatif.
   Une grotesque neutre, aucun effet.

   Mais il est vivant : le curseur qui le traverse en chasse les
   lettres, qui reviennent ensuite a leur place. Le texte n'est
   pas un contenu, c'est une matiere de plus.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { vmin, clamp } = EARTH.utils;

  const Texte = {
    el: null,
    lettres: [],
    blocs: [],
    boucle: null,
    pointeur: { x: -9999, y: -9999 },

    init(el) {
      this.el = el;
      EARTH.bus.sur('pointeur', p => { this.pointeur.x = p.x; this.pointeur.y = p.y; });
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

      const lettres = [];
      phrase.split('').forEach((car, i) => {
        const s = document.createElement('span');
        s.className = 'texte-lettre';
        s.textContent = car === ' ' ? ' ' : car;
        s.style.animationDelay = (i * 26) + 'ms';
        bloc.appendChild(s);
        lettres.push({ el: s, x: 0, y: 0, vx: 0, vy: 0, r: 0 });
      });

      this.el.appendChild(bloc);
      this.blocs.push(bloc);
      this.lettres.push(...lettres);
      bloc._lettres = lettres;
      this.demarrerBoucle();

      const duree = o.duree == null ? cfg.duree : o.duree;
      if (duree > 0) setTimeout(() => this.retirer(bloc), duree);
      return bloc;
    },

    retirer(bloc) {
      if (!bloc || !bloc.isConnected) return;
      bloc.classList.add('sortie');
      setTimeout(() => {
        this.lettres = this.lettres.filter(l => !bloc._lettres.includes(l));
        this.blocs = this.blocs.filter(b => b !== bloc);
        bloc.remove();
        if (!this.lettres.length) this.arreterBoucle();
      }, 900);
    },

    viderTout() { this.blocs.slice().forEach(b => this.retirer(b)); },

    /* --- les lettres fuient le curseur, puis reviennent ------ */

    demarrerBoucle() {
      if (this.boucle) return;
      const pas = () => {
        this.boucle = requestAnimationFrame(pas);
        const rayon = vmin() * 0.11;
        const px = this.pointeur.x, py = this.pointeur.y;

        this.lettres.forEach(l => {
          const r = l.el.getBoundingClientRect();
          const cx = r.left + r.width / 2 - l.x;
          const cy = r.top + r.height / 2 - l.y;
          const dx = cx - px, dy = cy - py;
          const d = Math.hypot(dx, dy);

          if (d < rayon && d > 0.001) {
            const force = (1 - d / rayon) * 4.2;
            l.vx += (dx / d) * force;
            l.vy += (dy / d) * force;
          }

          /* rappel elastique vers la place d'origine */
          l.vx += -l.x * 0.055;
          l.vy += -l.y * 0.055;
          l.vx *= 0.88;
          l.vy *= 0.88;
          l.x += l.vx;
          l.y += l.vy;
          l.r = clamp(l.x * 0.35, -22, 22);

          l.el.style.transform =
            Math.abs(l.x) < 0.05 && Math.abs(l.y) < 0.05
              ? ''
              : `translate(${l.x.toFixed(2)}px, ${l.y.toFixed(2)}px) rotate(${l.r.toFixed(2)}deg)`;
        });
      };
      this.boucle = requestAnimationFrame(pas);
    },

    arreterBoucle() {
      cancelAnimationFrame(this.boucle);
      this.boucle = null;
    },

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
