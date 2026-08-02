/* ============================================================
   EARTH — js/hud.js
   ------------------------------------------------------------
   L'appareillage. Quatre angles, une horloge, un bandeau.

   Tout est en fusion « difference » : le texte se lit noir sur le
   blanc, blanc sur les images sombres, sans jamais poser de fond.
   L'interface ne recouvre pas l'oeuvre, elle la traverse.

   Rien ici n'est cliquable sauf ce qui doit l'etre. Le HUD dit
   trois choses : ou tu es, ce que contient l'archive, et ce que
   tu peux faire.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const HUD = {
    el: null,
    marquee: null,
    curseur: null,

    init(el) {
      this.el = el;
      el.innerHTML =
        '<div class="hud-coin hud-tl">' +
          '<b>EARTH<sup>®</sup></b>' +
          '<span>archive vivante</span>' +
        '</div>' +
        '<div class="hud-coin hud-tr">' +
          '<span id="hud-heure">--:--:--</span>' +
          '<span id="hud-compte">—</span>' +
        '</div>' +
        '<div class="hud-coin hud-bl">' +
          '<span id="hud-partition">—</span>' +
          '<span class="hud-faible">jamais termine</span>' +
        '</div>' +
        '<div class="hud-coin hud-br">' +
          '<span class="hud-faible">maintiens pour creuser</span>' +
          '<span class="hud-faible">ne bouge plus, et attends</span>' +
        '</div>';

      this.marquee = document.createElement('div');
      this.marquee.className = 'marquee';
      this.marquee.innerHTML = '<div class="marquee-ruban"></div>';
      el.appendChild(this.marquee);

      this.curseur = document.createElement('div');
      this.curseur.className = 'curseur';
      el.appendChild(this.curseur);

      this.horloge();
      setInterval(() => this.horloge(), 1000);

      EARTH.bus.sur('pointeur', p => this.bougerCurseur(p));
      EARTH.Director.surChangement(() => { this.majEtat(); this.majMarquee(); });

      this.appliquer();
      return this;
    },

    appliquer() {
      const cfg = EARTH.CONFIG.hud;
      this.el.classList.toggle('cache', !cfg.actif);
      this.marquee.classList.toggle('cache', !cfg.marquee);
      /* pas de curseur en croix quand il n'y a pas de curseur :
         au doigt, la croix resterait figee la ou on a touche */
      const croix = cfg.curseur && !EARTH.utils.mobile();
      document.body.classList.toggle('instrument', !!croix);
    },

    basculer() {
      EARTH.CONFIG.hud.actif = !EARTH.CONFIG.hud.actif;
      this.appliquer();
    },

    horloge() {
      const d = new Date();
      const p = n => String(n).padStart(2, '0');
      const e = document.getElementById('hud-heure');
      if (e) e.textContent =
        `UTC ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
    },

    majEtat() {
      const A = EARTH.Archive;
      const collectives = A.liste.filter(i => i.collective).length;
      const compte = document.getElementById('hud-compte');
      if (compte) {
        compte.textContent =
          `${A.taille} captures · ${A.lieux.length} lieux` +
          (collectives ? ` · ${collectives} recues` : '');
      }
      const part = document.getElementById('hud-partition');
      const c = EARTH.Director.courante;
      if (part && c) part.textContent = c.nom;
    },

    /* le bandeau ne defile pas du texte decoratif : il enumere
       les coordonnees de ce qui est a l'ecran, maintenant */
    majMarquee() {
      const ruban = this.marquee.firstChild;
      const vivants = EARTH.Stage.plans.filter(p => !p.sorti && p.item.coord);
      if (vivants.length < 2) { this.marquee.classList.add('vide'); return; }
      this.marquee.classList.remove('vide');

      const morceaux = vivants.map(p =>
        `${p.item.coord.lat} ${p.item.coord.lon}`).join('   ·   ');
      ruban.textContent = morceaux + '   ·   ' + morceaux + '   ·   ';
      ruban.style.animationDuration = Math.max(24, vivants.length * 7) + 's';
    },

    bougerCurseur(p) {
      if (!EARTH.CONFIG.hud.curseur) return;
      this.curseur.style.transform = `translate(${p.x}px, ${p.y}px)`;
    },

    /* un mot en tres grand, au centre. Reserve aux moments rares. */
    proclamer(mot, duree) {
      const d = document.createElement('div');
      d.className = 'proclame';
      d.textContent = mot;
      this.el.appendChild(d);
      requestAnimationFrame(() => d.classList.add('visible'));
      setTimeout(() => {
        d.classList.remove('visible');
        setTimeout(() => d.remove(), 900);
      }, duree || 2600);
    }
  };

  EARTH.HUD = HUD;

})(window.EARTH = window.EARTH || {});
