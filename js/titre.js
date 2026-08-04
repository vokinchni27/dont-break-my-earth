/* ============================================================
   EARTH — js/titre.js
   ------------------------------------------------------------
   Le site commence par un vide.

   Une typographie immense, gris très clair, presque invisible.
   Puis la main passe, et la matière se liquéfie : les lettres
   fondent, s’étirent, suivent le curseur, puis retrouvent
   lentement leur forme. Comme une mémoire qu’on déforme.

   HEART est l’anagramme d’EARTH — à une rotation près. Quand le
   titre se retire, le dernier mot se décale d’un cran et devient
   l’autre. Rien n’est ajouté : c’étaient les mêmes lettres.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { clamp, vmin } = EARTH.utils;

  const Titre = {
    el: null,
    lettres: [],
    boucle: null,
    pointeur: { x: -9999, y: -9999 },
    fondu: 0,              // combien le visiteur a déjà liquéfié
    parti: false,

    init(el) {
      this.el = el;
      this.construire();

      EARTH.bus.sur('pointeur', p => { this.pointeur.x = p.x; this.pointeur.y = p.y; });
      EARTH.bus.sur('bref', () => this.retirer());
      window.addEventListener('wheel', () => this.retirer(), { passive: true, once: true });
      window.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'Enter') this.retirer();
      });

      this.demarrer();
      return this;
    },

    construire() {
      const cfg = EARTH.CONFIG.titre;
      const mots = cfg.mot.split(/\s+/);
      /* trois lignes : premier mot, le milieu, le dernier */
      const lignes = mots.length >= 3
        ? [[mots[0]], mots.slice(1, -1), [mots[mots.length - 1]]]
        : [mots];

      this.el.innerHTML = '';
      this.lettres = [];

      lignes.forEach((mots, iLigne) => {
        const ligne = document.createElement('div');
        ligne.className = 'titre-ligne';
        mots.forEach((mot, iMot) => {
          const bloc = document.createElement('span');
          bloc.className = 'titre-mot';
          mot.split('').forEach(car => {
            const s = document.createElement('span');
            s.className = 'titre-lettre';
            s.textContent = car;
            bloc.appendChild(s);
            this.lettres.push({
              el: s, x: 0, y: 0, vx: 0, vy: 0,
              etire: 0, dernier: iLigne === lignes.length - 1
            });
          });
          if (iMot < mots.length - 1) {
            const esp = document.createElement('span');
            esp.className = 'titre-espace';
            esp.innerHTML = '&nbsp;';
            bloc.appendChild(esp);
          }
          ligne.appendChild(bloc);
        });
        this.el.appendChild(ligne);
      });

      const note = document.createElement('div');
      note.className = 'titre-note';
      note.textContent = 'passe la main';
      this.el.appendChild(note);
      this.note = note;
    },

    /* ========================================================
       LA LIQUÉFACTION
       Les lettres ne fuient pas le curseur : elles le suivent,
       et s’étirent en le suivant. C’est la différence entre un
       effet et une matière.
       ======================================================== */
    demarrer() {
      const pas = () => {
        this.boucle = requestAnimationFrame(pas);
        if (this.parti) return;

        const cfg = EARTH.CONFIG.titre;
        const R = vmin() * 0.34;
        const px = this.pointeur.x, py = this.pointeur.y;
        let travail = 0;

        this.lettres.forEach(l => {
          const r = l.el.getBoundingClientRect();
          const cx = r.left + r.width / 2 - l.x;
          const cy = r.top + r.height / 2 - l.y;
          const dx = px - cx, dy = py - cy;
          const d = Math.hypot(dx, dy);

          if (d < R && d > 0.01) {
            const k = (1 - d / R) ** 2 * 2.6 * cfg.liquide;
            l.vx += (dx / d) * k;
            l.vy += (dy / d) * k;
            l.etire = Math.min(1, l.etire + k * 0.05);
            travail += k;
          }

          /* rappel élastique : la forme revient, mais lentement */
          const rappel = 0.045 * (1.05 - cfg.viscosite * 0.6);
          l.vx += -l.x * rappel;
          l.vy += -l.y * rappel;
          l.vx *= 0.9;
          l.vy *= 0.9;
          l.x += l.vx;
          l.y += l.vy;
          l.etire *= 0.965;

          const tir = 1 + l.etire * 0.55;
          const ecrase = 1 / (1 + l.etire * 0.30);
          const gauche = clamp(l.x * 0.05, -14, 14);

          l.el.style.transform =
            Math.abs(l.x) < 0.06 && Math.abs(l.y) < 0.06 && l.etire < 0.01
              ? ''
              : `translate(${l.x.toFixed(2)}px, ${l.y.toFixed(2)}px) ` +
                `scale(${ecrase.toFixed(3)}, ${tir.toFixed(3)}) skewX(${(-gauche).toFixed(2)}deg)`;
        });

        this.fondu += travail;
        if (this.note && this.fondu > 40) {
          this.note.classList.add('efface');
        }
        /* assez joué : la Terre peut commencer */
        if (this.fondu > 320) this.retirer();
      };
      this.boucle = requestAnimationFrame(pas);
    },

    /* ========================================================
       LE RETRAIT — HEART devient EARTH
       ======================================================== */
    retirer() {
      if (this.parti) return;
      this.parti = true;

      const derniers = this.lettres.filter(l => l.dernier);
      if (derniers.length > 1) {
        /* rotation d’un cran : les mêmes lettres, l’autre mot */
        const boites = derniers.map(l => l.el.getBoundingClientRect());
        derniers.forEach((l, i) => {
          const cible = boites[(i - 1 + boites.length) % boites.length];
          const ici = boites[i];
          l.el.style.transition = 'transform 1.15s cubic-bezier(.7,0,.2,1)';
          l.el.style.transform =
            `translate(${(cible.left - ici.left).toFixed(1)}px, 0px)`;
        });
      }

      this.el.classList.add('parti');
      setTimeout(() => {
        cancelAnimationFrame(this.boucle);
        this.el.remove();
        EARTH.bus.emet('titre-fini', {});
      }, 1500);
    }
  };

  EARTH.Titre = Titre;

})(window.EARTH = window.EARTH || {});
