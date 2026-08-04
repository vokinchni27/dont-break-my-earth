/* ============================================================
   EARTH — js/coords.js
   ------------------------------------------------------------
   Les donnees deviennent du design.

   Chaque capture porte ses coordonnees. Elles ne sont pas une
   legende : elles sont un materiau graphique, au meme titre que
   les images. Quatre etats :

     bloc     — au survol, un pave typographique
     curseur  — une lecture permanente : le lieu le plus proche
     lignes   — la latitude et la longitude tracees en travers
                de l'ecran, a leur vraie place dans l'archive
     bandeau  — les vrais pixels du bandeau Google Earth, agrandis

   La bande de donnees d'origine n'est jamais reconstituee : c'est
   l'image elle-meme qu'on va rechercher.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { clamp, lerp } = EARTH.utils;

  const AR_SOURCE = 2493 / 1231;

  const Coords = {
    el: null,
    bloc: null,
    curseur: null,
    ligneLat: null,
    ligneLon: null,
    bandeau: null,
    survole: null,

    init(el) {
      this.el = el;
      this.bloc = creer('coord-bloc');
      this.curseur = creer('coord-curseur');
      this.ligneLat = creer('coord-ligne coord-ligne--lat');
      this.ligneLon = creer('coord-ligne coord-ligne--lon');
      this.bandeau = creer('coord-bandeau');
      [this.bloc, this.curseur, this.ligneLat, this.ligneLon]
        .forEach(d => el.appendChild(d));
      /* le bandeau montre les VRAIS pixels de la capture : il doit
         rester hors de la couche en fusion, qui les inverserait */
      document.body.appendChild(this.bandeau);

      /* le cartel se copie : les coordonnees appartiennent aussi
         a celui qui regarde, il doit pouvoir les emporter */
      this.bandeau.addEventListener('click', () => this.copier());
      return this;
    },

    /* --- formatage ----------------------------------------- */

    texte(item) {
      const c = item && item.coord;
      if (!c) return String(item && item.place || '').replace(/\//g, ' · ');
      return `${c.lat}\n${c.lon}`;
    },

    detail(item) {
      const c = item && item.coord;
      if (!c) return '';
      return [
        `${c.lat}  ${c.lon}`,
        `caméra ${c.camera}`,
        `sol ${c.sol}`,
        `échelle ${c.echelle}`
      ].join('\n');
    },

    /* --- le survol ----------------------------------------- */

    montrer(plan) {
      const cfg = EARTH.CONFIG.coordonnees;
      if (!cfg.survol || !plan) return;
      this.survole = plan;

      /* Le pave ne se pose PAS sur l'image : en fusion difference,
         un texte qui tombe sur un gris moyen devient invisible.
         Il rejoint l'appareillage, a place fixe, comme la lecture
         d'un instrument. C'est plus lisible, et plus juste : la
         donnee n'appartient pas a l'image, elle appartient a
         l'appareil qui la regarde. */
      this.bloc.textContent = this.detail(plan.item) || this.texte(plan.item);
      this.bloc.style.setProperty('--taille', cfg.taille + 'px');
      this.bloc.classList.add('visible');

      if (cfg.lignes) this.tracer(plan.item);
      if (cfg.cartel) this.montrerBandeau(plan);
    },

    cacher() {
      this.survole = null;
      this.bloc.classList.remove('visible');
      this.ligneLat.classList.remove('visible');
      this.ligneLon.classList.remove('visible');
      this.bandeau.classList.remove('visible');
    },

    /* --- les lignes de composition -------------------------- */
    /* la latitude et la longitude de l'image, projetees sur
       l'etendue de toute l'archive : l'image reprend sa place
       sur la Terre, et cette place devient une ligne */

    tracer(item) {
      const e = EARTH.Archive.etendue;
      const c = item && item.coord;
      if (!e || !c || c.latDec == null) return;

      const ty = 1 - (c.latDec - e.latMin) / Math.max(1e-6, e.latMax - e.latMin);
      const tx = (c.lonDec - e.lonMin) / Math.max(1e-6, e.lonMax - e.lonMin);

      this.ligneLat.style.top = clamp(ty, 0.02, 0.98) * 100 + '%';
      this.ligneLon.style.left = clamp(tx, 0.02, 0.98) * 100 + '%';
      this.ligneLat.dataset.valeur = c.lat;
      this.ligneLon.dataset.valeur = c.lon;
      this.ligneLat.classList.add('visible');
      this.ligneLon.classList.add('visible');
    },

    /* --- le bandeau d'origine ------------------------------- */
    /* on ne recompose pas le texte : on va chercher les pixels
       exacts de la capture, en bas a droite, et on les agrandit */

    montrerBandeau(plan) {
      if (plan.item.type !== 'image') return;
      const BANDE = EARTH.CONFIG.cartel;
      const largeurVisible = 1 - BANDE.gauche;
      const hauteurVisible = 1 - BANDE.haut;
      const zoom = 1 / largeurVisible;

      /* la largeur du bloc vaut « zoom » fois sa propre largeur en
         image ; la hauteur rendue vaut donc W*zoom/AR, dont on ne
         garde que la tranche du bandeau */
      const ar = AR_SOURCE / (hauteurVisible * zoom);

      const d = this.bandeau;
      d.style.backgroundImage = `url("${plan.item.src}")`;
      d.style.backgroundSize = zoom * 100 + '% auto';
      d.style.backgroundPosition = '100% 100%';
      d.style.aspectRatio = ar.toFixed(3);
      d.classList.add('visible');
    },

    /* --- la lecture au curseur ------------------------------ */
    /* le plan le plus proche du curseur donne sa position : bouger
       la souris, c'est deja lire la Terre */

    suivre(x, y) {
      const cfg = EARTH.CONFIG.coordonnees;
      if (!cfg.curseur) { this.curseur.classList.remove('visible'); return; }

      const plan = plusProche(x, y);
      if (!plan) { this.curseur.classList.remove('visible'); return; }

      this.curseur.textContent = this.texte(plan.item);
      this.curseur.classList.add('visible');
      this.curseur.style.transform =
        `translate(${Math.round(clamp(x + 16, 8, window.innerWidth - 150))}px, ` +
        `${Math.round(clamp(y + 16, 8, window.innerHeight - 46))}px)`;
    },

    /* --- emporter les coordonnees --------------------------- */

    copier() {
      const item = this.survole && this.survole.item;
      const c = item && item.coord;
      if (!c) return;
      const texte = `${c.lat} ${c.lon}`;
      const dire = () => EARTH.HUD && EARTH.HUD.souffler('coordonnées copiées');
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texte).then(dire, () => repli(texte, dire));
      } else repli(texte, dire);
    },

    /* --- coordonnees imprimees ------------------------------ */
    /* certaines images portent leurs coordonnees a meme la surface */

    imprimer(plan) {
      if (!plan.item.coord) return;
      const d = document.createElement('div');
      d.className = 'coord-imprimee';
      d.textContent = this.texte(plan.item);
      plan.frame.appendChild(d);
      plan.imprimee = d;
    },

    /* --- l'inondation (evenement rare) ---------------------- */
    /* toutes les coordonnees de l'archive envahissent l'ecran,
       a leur vraie place : la carte apparait enfin, une fois */

    inonder(duree) {
      const e = EARTH.Archive.etendue;
      if (!e) return;
      const nappe = document.createElement('div');
      nappe.className = 'coord-nappe';

      EARTH.Archive.situees.forEach((item, i) => {
        const c = item.coord;
        const tx = (c.lonDec - e.lonMin) / Math.max(1e-6, e.lonMax - e.lonMin);
        const ty = 1 - (c.latDec - e.latMin) / Math.max(1e-6, e.latMax - e.latMin);
        const s = document.createElement('span');
        s.textContent = c.lat + ' ' + c.lon;
        s.style.left = lerp(3, 97, tx) + '%';
        s.style.top = lerp(4, 96, ty) + '%';
        s.style.animationDelay = (i * 9) + 'ms';
        nappe.appendChild(s);
      });

      this.el.appendChild(nappe);
      setTimeout(() => {
        nappe.classList.add('sortie');
        setTimeout(() => nappe.remove(), 1400);
      }, duree || 5200);
    }
  };

  function plusProche(x, y) {
    let best = null, d2 = Infinity;
    EARTH.Stage.plans.forEach(p => {
      if (p.sorti) return;
      const r = p.frame.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height / 2);
      const d = dx * dx + dy * dy;
      if (d < d2) { d2 = d; best = p; }
    });
    return best;
  }

  function repli(texte, fin) {
    const t = document.createElement('textarea');
    t.value = texte;
    t.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); fin(); } catch (e) { /* tant pis */ }
    t.remove();
  }

  function creer(classe) {
    const d = document.createElement('div');
    d.className = classe;
    return d;
  }

  Coords.plusProche = plusProche;
  EARTH.Coords = Coords;

})(window.EARTH = window.EARTH || {});
