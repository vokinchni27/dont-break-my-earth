/* ============================================================
   EARTH — js/hud.js
   ------------------------------------------------------------
   L’appareillage. Quatre angles, une heure, un bandeau.

   Tout est en fusion « différence » : le texte se lit noir sur
   le blanc, blanc sur les images sombres, sans jamais poser de
   fond. L’interface ne recouvre pas l’œuvre, elle la traverse.

   L’heure est locale — Europe/Paris. Une œuvre sur la Terre n’a
   pas besoin d’afficher un décalage.
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
          '<b><span data-t="hud.marque"></span><sup>®</sup></b>' +
          '<span class="hud-faible" data-t="hud.sousTitre"></span>' +
        '</div>' +
        '<div class="hud-coin hud-tr">' +
          '<span id="hud-heure">--:--</span>' +
          '<span class="hud-faible" id="hud-date">--.--.----</span>' +
          '<span class="hud-faible" id="hud-compte">—</span>' +
        '</div>' +
        '<div class="hud-coin hud-bl">' +
          '<span id="hud-partition">—</span>' +
          '<span class="hud-faible" data-t="hud.etatJamaisTermine"></span>' +
        '</div>' +
        '<div class="hud-coin hud-br">' +
          '<span class="hud-faible" data-t="hud.aide1"></span>' +
          '<span class="hud-faible" data-t="hud.aide2"></span>' +
          '<span class="hud-faible" data-t="hud.aide3"></span>' +
        '</div>';
      EARTH.T.hydrater(el);

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

      /* Les libelles fixes sont reposes d'office par
         EARTH.T.hydrater. Seul le compte, compose de plusieurs
         textes, demande d'etre recalcule. */
      EARTH.T.surChangement(() => this.majEtat());

      this.appliquer();
      return this;
    },

    appliquer() {
      const cfg = EARTH.CONFIG.hud;
      this.el.classList.toggle('cache', !cfg.actif);
      this.marquee.classList.toggle('cache', !cfg.marquee);
      /* pas de curseur en croix quand il n’y a pas de curseur :
         au doigt, la croix resterait figée là où on a touché */
      document.body.classList.toggle('instrument', !!(cfg.curseur && !EARTH.utils.mobile()));
    },

    basculer() {
      EARTH.CONFIG.hud.actif = !EARTH.CONFIG.hud.actif;
      this.appliquer();
    },

    /* heure locale, sans mention de fuseau : c’est l’heure d’ici */
    horloge() {
      const zone = EARTH.CONFIG.hud.fuseau || 'Europe/Paris';
      const d = new Date();
      let heure, date;
      try {
        heure = new Intl.DateTimeFormat('fr-FR', {
          timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false
        }).format(d);
        const p = new Intl.DateTimeFormat('fr-FR', {
          timeZone: zone, day: '2-digit', month: '2-digit', year: 'numeric'
        }).formatToParts(d).reduce((o, x) => (o[x.type] = x.value, o), {});
        date = `${p.day}.${p.month}.${p.year}`;
      } catch (e) {
        const n = x => String(x).padStart(2, '0');
        heure = `${n(d.getHours())}:${n(d.getMinutes())}`;
        date = `${n(d.getDate())}.${n(d.getMonth() + 1)}.${d.getFullYear()}`;
      }
      const h = document.getElementById('hud-heure');
      const j = document.getElementById('hud-date');
      if (h) h.textContent = heure;
      if (j) j.textContent = date;
    },

    majEtat() {
      const A = EARTH.Archive;
      const collectives = A.liste.filter(i => i.collective).length;
      const compte = document.getElementById('hud-compte');
      if (compte) {
        compte.textContent =
          `${A.taille} ${EARTH.T('hud.captures')} · ${A.lieux.length} ${EARTH.T('hud.lieux')}` +
          (collectives ? ` · ${collectives} ${EARTH.T('hud.recues')}` : '');
      }
      const part = document.getElementById('hud-partition');
      const c = EARTH.Director.courante;
      if (part && c) part.textContent = c.nom;
    },

    /* le bandeau énumère les coordonnées de ce qui est à l’écran */
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

    /* un mot en très grand, au centre. Les moments rares. */
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
    },

    /* un mot minuscule, en bas : un accusé de réception */
    souffler(message) {
      let d = document.getElementById('hud-souffle');
      if (!d) {
        d = document.createElement('div');
        d.id = 'hud-souffle';
        document.body.appendChild(d);
      }
      d.textContent = message;
      d.classList.add('visible');
      clearTimeout(this._souffle);
      this._souffle = setTimeout(() => d.classList.remove('visible'), 2600);
    }
  };

  EARTH.HUD = HUD;

})(window.EARTH = window.EARTH || {});
