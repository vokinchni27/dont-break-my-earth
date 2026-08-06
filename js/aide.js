/* ============================================================
   EARTH — js/aide.js
   ------------------------------------------------------------
   Trois touches, au centre, puis plus rien.

   Le clavier fait beaucoup de choses ici, et personne ne les
   découvre. Alors on les montre — une fois, brièvement, au
   milieu de l'écran, dans la même micro-typographie que le
   reste de l'appareillage. Puis l'aide s'efface toute seule et
   laisse les images tranquilles.

   On la rappelle avec « ? » aussi souvent qu'on veut. La liste
   complète, elle, vit dans le bac à sable (touche P).

   Ce qu'elle montre se règle dans js/textes.js — clé
   `apercuAide` — et se réécrit depuis le bac à sable.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const Aide = {
    el: null,
    visible: false,
    minuteur: null,

    init() {
      const cfg = EARTH.CONFIG.aide;
      if (!cfg.actif) return this;

      const el = document.createElement('div');
      el.id = 'aide';
      el.setAttribute('data-interface', 'aide');
      el.setAttribute('role', 'note');
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      this.el = el;

      this.ecrire();
      EARTH.T.surChangement(() => this.ecrire());

      /* elle ne coupe pas l'entrée en matière : elle attend que
         le titre ait laissé la place */
      EARTH.bus.sur('titre-fini', () => {
        setTimeout(() => this.montrer(), cfg.retard);
      });

      window.addEventListener('keydown', e => {
        const c = e.target;
        if (c && c.matches && c.matches('input, select, textarea')) return;
        if (e.key === EARTH.T('raccourcis.rappel') || e.key === '?') {
          e.preventDefault();
          this.basculer();
        } else if (e.key === 'Escape' && this.visible) {
          this.cacher();
        }
      });

      /* le moindre geste volontaire la congédie */
      ['pointerdown', 'wheel'].forEach(nom =>
        window.addEventListener(nom, e => {
          if (this.visible && !EARTH.utils.interfaceSous(e.target)) this.cacher();
        }, { passive: true })
      );

      return this;
    },

    ecrire() {
      if (!this.el) return;
      const liste = EARTH.T('apercuAide');
      const lignes = (Array.isArray(liste) ? liste : [])
        .map(paire => Array.isArray(paire) ? paire : [String(paire), '']);

      this.el.replaceChildren();
      const cadre = document.createElement('div');
      cadre.className = 'aide-cadre';

      const titre = document.createElement('p');
      titre.className = 'aide-titre';
      titre.setAttribute('data-t', 'raccourcis.titre');
      cadre.appendChild(titre);

      const table = document.createElement('dl');
      table.className = 'aide-table';
      lignes.forEach(([touche, sens]) => {
        const dt = document.createElement('dt');
        dt.textContent = touche;
        const dd = document.createElement('dd');
        dd.textContent = sens;
        table.append(dt, dd);
      });
      cadre.appendChild(table);

      const note = document.createElement('p');
      note.className = 'aide-note';
      note.setAttribute('data-t', 'raccourcis.note');
      cadre.appendChild(note);

      this.el.appendChild(cadre);
      EARTH.T.hydrater(this.el);
    },

    montrer() {
      if (!this.el) return;
      this.visible = true;
      this.el.classList.add('visible');
      this.el.setAttribute('aria-hidden', 'false');
      clearTimeout(this.minuteur);
      const duree = EARTH.CONFIG.aide.duree;
      if (duree > 0) this.minuteur = setTimeout(() => this.cacher(), duree);
    },

    cacher() {
      if (!this.el) return;
      this.visible = false;
      this.el.classList.remove('visible');
      this.el.setAttribute('aria-hidden', 'true');
      clearTimeout(this.minuteur);
    },

    basculer() { this.visible ? this.cacher() : this.montrer(); }
  };

  EARTH.Aide = Aide;

})(window.EARTH = window.EARTH || {});
