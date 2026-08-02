/* ============================================================
   EARTH — js/grid.js
   ------------------------------------------------------------
   La grille. Elle structure l'espace et se montre.
   Les images ne lui obeissent pas toujours : certaines s'y calent
   au pixel, d'autres l'ignorent completement. Tout le jeu du
   projet tient dans cet ecart entre le systeme et la liberte.

   Elle expose des cellules aux partitions (layouts.js) : une
   composition « calee » demande une cellule, une composition
   libre n'en demande pas. Personne n'est oblige.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { vmin, mobile, clamp } = EARTH.utils;

  const Grille = {
    el: null,
    traits: [],
    colonnes: 12,
    lignes: 8,

    init(el) {
      this.el = el;
      this.mesurer();
      this.dessiner();
      window.addEventListener('resize', () => { this.mesurer(); this.dessiner(); });
      return this;
    },

    mesurer() {
      const g = EARTH.CONFIG.grille;
      this.colonnes = mobile() ? g.colonnesMobile : g.colonnes;
      this.lignes = mobile() ? g.lignesMobile : g.lignes;
    },

    dessiner() {
      const g = EARTH.CONFIG.grille;
      this.el.innerHTML = '';
      this.traits = [];

      for (let c = 0; c <= this.colonnes; c++) {
        const t = trait('v', c / this.colonnes, c === 0 || c === this.colonnes);
        this.el.appendChild(t);
        this.traits.push(t);
      }
      for (let l = 0; l <= this.lignes; l++) {
        const t = trait('h', l / this.lignes, l === 0 || l === this.lignes);
        this.el.appendChild(t);
        this.traits.push(t);
      }

      if (g.reperes && !mobile()) {
        for (let c = 0; c < this.colonnes; c++) {
          const r = document.createElement('span');
          r.className = 'grille-repere';
          r.style.left = `calc(${((c + 0.5) / this.colonnes) * 100}% )`;
          r.textContent = String(c + 1).padStart(2, '0');
          this.el.appendChild(r);
        }
      }
      this.appliquer();
    },

    appliquer() {
      this.el.classList.toggle('cachee', !EARTH.CONFIG.grille.visible);
      this.el.style.setProperty('--trait', EARTH.CONFIG.grille.trait);
      this.el.style.setProperty('--trait-fort', EARTH.CONFIG.grille.traitFort);
    },

    basculer() {
      EARTH.CONFIG.grille.visible = !EARTH.CONFIG.grille.visible;
      this.appliquer();
    },

    /* --- ce que la grille offre aux partitions -------------- */

    /* une cellule, ou un bloc de cellules, exprime dans le meme
       systeme que les placements libres : x,y = centre en fraction
       d'ecran, w = largeur en fraction de vmin */
    cellule(c, l, spanC, spanL) {
      const sc = Math.max(1, spanC || 1);
      const sl = Math.max(1, spanL || 1);
      const x = (c + sc / 2) / this.colonnes;
      const y = (l + sl / 2) / this.lignes;
      const largeurPx = (sc / this.colonnes) * window.innerWidth;
      return { x, y, w: largeurPx / vmin(), cellule: { c, l, sc, sl } };
    },

    /* cale un placement libre sur l'intersection la plus proche */
    caler(place) {
      const c = Math.round(place.x * this.colonnes) / this.colonnes;
      const l = Math.round(place.y * this.lignes) / this.lignes;
      const pas = window.innerWidth / this.colonnes / vmin();
      return Object.assign({}, place, {
        x: clamp(c, 0, 1),
        y: clamp(l, 0, 1),
        w: Math.max(pas, Math.round(place.w / pas) * pas),
        rot: 0,
        calee: true
      });
    },

    /* --- evenements rares ---------------------------------- */

    exploser(duree) {
      this.traits.forEach((t, i) => {
        const dx = (Math.random() * 2 - 1) * 60;
        const dy = (Math.random() * 2 - 1) * 60;
        const rot = (Math.random() * 2 - 1) * 18;
        t.animate([
          { transform: 'none', opacity: 1 },
          { transform: `translate(${dx}vw, ${dy}vh) rotate(${rot}deg)`, opacity: 0, offset: 0.55 },
          { transform: 'none', opacity: 1 }
        ], { duration: duree || 2600, delay: i * 12, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
    },

    /* la grille respire tres legerement avec le curseur : elle
       cesse d'etre un decor, elle devient un espace */
    respirer(nx, ny) {
      const a = EARTH.CONFIG.geste.parallaxe * 0.6;
      this.el.style.transform = `translate(${(nx - 0.5) * -6 * a}px, ${(ny - 0.5) * -6 * a}px)`;
    }
  };

  function trait(sens, position, fort) {
    const d = document.createElement('div');
    d.className = 'grille-trait grille-trait--' + sens + (fort ? ' fort' : '');
    if (sens === 'v') d.style.left = position * 100 + '%';
    else d.style.top = position * 100 + '%';
    return d;
  }

  EARTH.Grille = Grille;

})(window.EARTH = window.EARTH || {});
