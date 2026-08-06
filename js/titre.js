/* ============================================================
   EARTH — js/titre.js
   ------------------------------------------------------------
   Le site commence par un vide.

   Une typographie immense, gris très clair, presque invisible.
   Elle ne bouge pas. Elle ne réagit pas. Elle est simplement là,
   et on la lit.

   Ce qui vit, c'est ce qui s'en échappe : quelques signes —
   points, croix, degrés, minutes, lettres de cardinaux — se
   détachent lentement des lettres et montent, comme des données
   qui quitteraient un relevé. Très peu à la fois. Très lents.
   Le texte, lui, reste stable : c'est la condition pour qu'on
   le lise.

   HEART est l'anagramme d'EARTH — à une rotation près. Quand le
   titre se retire, le dernier mot se décale d'un cran et devient
   l'autre. Rien n'est ajouté : c'étaient les mêmes lettres.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { clamp, vmin } = EARTH.utils;

  const Titre = {
    el: null,
    lettres: [],
    boites: [],
    grains: [],
    canvas: null,
    ctx: null,
    boucle: null,
    pointeur: { x: -9999, y: -9999 },
    parti: false,
    ne: 0,                 // combien de signes ont déjà quitté les lettres

    init(el) {
      this.el = el;
      this.construire();

      EARTH.bus.sur('pointeur', p => { this.pointeur.x = p.x; this.pointeur.y = p.y; });
      EARTH.bus.sur('bref', () => this.retirer());
      window.addEventListener('wheel', e => {
        if (EARTH.utils.interfaceSous(e.target)) return;
        this.retirer();
      }, { passive: true });
      window.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'Enter') this.retirer();
      });

      /* le seuil ne retient personne indéfiniment */
      const attente = EARTH.CONFIG.titre.attente;
      if (attente > 0) this._minuteur = setTimeout(() => this.retirer(), attente);

      /* les textes peuvent changer sous nos pieds (bac à sable) */
      EARTH.T.surChangement(() => {
        if (this.parti) return;
        this.construire();
        this.mesurer();
      });

      this.demarrer();
      return this;
    },

    construire() {
      const mots = EARTH.T('titre.mot').split(/\s+/).filter(Boolean);
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
            this.lettres.push({ el: s, dernier: iLigne === lignes.length - 1 });
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
      note.setAttribute('data-t', 'titre.invitation');
      this.el.appendChild(note);
      this.note = note;
      EARTH.T.hydrater(this.el);

      this.poserCanvas();
    },

    /* La couche des signes. Un canvas : cent DOM qui bougent
       coûteraient bien plus cher qu'un seul contexte 2D.

       Il n'est créé QU'UNE FOIS. construire() vide this.el à
       chaque réécriture d'un texte — donc à chaque frappe dans le
       bac à sable — et recréer le canvas là empilerait un écouteur
       de resize par caractère tapé. */
    poserCanvas() {
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'titre-grains';
        this.canvas.setAttribute('aria-hidden', 'true');
        this.ctx = this.canvas.getContext('2d');
        window.addEventListener('resize', () => this.mesurer(), { passive: true });
      }
      this.el.appendChild(this.canvas);          // il reste au-dessus

      /* tout de suite, pour ne pas dépendre d'une image d'animation
         qui peut ne jamais venir (onglet caché), puis une fois la
         mise en page posée, pour la mesure juste */
      this.mesurer();
      requestAnimationFrame(() => this.mesurer());
    },

    /* où sont les lettres, et quelle taille fait la couche */
    mesurer() {
      if (!this.canvas || this.parti) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const l = window.innerWidth, h = window.innerHeight;
      this.canvas.width = Math.round(l * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.canvas.style.width = l + 'px';
      this.canvas.style.height = h + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.boites = this.lettres
        .map(x => x.el.getBoundingClientRect())
        .filter(r => r.width > 1 && r.height > 1);
    },

    /* ========================================================
       LES SIGNES QUI S'ÉCHAPPENT
       Un grain naît sur le bord d'une lettre, monte très
       lentement, dérive un peu, et s'efface. Rien d'autre.
       ======================================================== */

    naitreGrain(rand) {
      const cfg = EARTH.CONFIG.titre;
      if (!this.boites.length) return;
      const b = this.boites[(rand * this.boites.length) | 0];
      if (!b) return;

      const signes = EARTH.T('titre.symboles').split(/\s+/).filter(Boolean);
      const corps = vmin() * 0.014;

      this.grains.push({
        x: b.left + Math.random() * b.width,
        y: b.top + b.height * (0.15 + Math.random() * 0.8),
        vx: (Math.random() - 0.5) * 0.10 * cfg.derive,
        vy: -(0.035 + Math.random() * 0.075) * cfg.montee,
        car: signes.length ? signes[(Math.random() * signes.length) | 0] : '·',
        taille: corps * (0.75 + Math.random() * 0.7),
        age: 0,
        vie: cfg.duree * (0.7 + Math.random() * 0.6)
      });
      this.ne++;
    },

    demarrer() {
      let dernier = performance.now();

      const pas = () => {
        this.boucle = requestAnimationFrame(pas);
        if (this.parti || !this.ctx) return;

        const cfg = EARTH.CONFIG.titre;
        const maintenant = performance.now();
        const dt = clamp((maintenant - dernier) / 16.7, 0.2, 3);
        dernier = maintenant;

        /* la main ne déforme rien : elle appelle seulement
           un peu plus de signes, là où elle passe */
        const proche = this.pointeur.x > -999;
        const naissance = cfg.naissance * (proche ? 1.6 : 1) * dt;
        if (this.grains.length < cfg.particules && Math.random() < naissance) {
          this.naitreGrain(proche ? this.pres() : Math.random());
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let i = this.grains.length - 1; i >= 0; i--) {
          const g = this.grains[i];
          g.age += dt * 16.7;
          if (g.age >= g.vie) { this.grains.splice(i, 1); continue; }

          g.x += g.vx * dt;
          g.y += g.vy * dt;

          /* paraître, puis disparaître — jamais d'apparition sèche */
          const t = g.age / g.vie;
          const alpha = Math.sin(t * Math.PI) * cfg.opacite;

          this.ctx.globalAlpha = alpha;
          this.ctx.fillStyle = cfg.encre;
          this.ctx.font = `${g.taille.toFixed(1)}px ${EARTH.CONFIG.typo.famille}`;
          this.ctx.fillText(g.car, g.x, g.y);
        }
        this.ctx.globalAlpha = 1;
      };

      this.boucle = requestAnimationFrame(pas);
    },

    /* choisit une lettre proche du curseur, en valeur 0→1 */
    pres() {
      if (!this.boites.length) return Math.random();
      let meilleur = 0, distance = Infinity;
      this.boites.forEach((b, i) => {
        const d = Math.hypot(
          this.pointeur.x - (b.left + b.width / 2),
          this.pointeur.y - (b.top + b.height / 2));
        if (d < distance) { distance = d; meilleur = i; }
      });
      if (distance > vmin() * 0.4) return Math.random();
      return (meilleur + Math.random() * 0.999) / this.boites.length;
    },

    /* ========================================================
       LE RETRAIT — HEART devient EARTH
       ======================================================== */
    retirer() {
      if (this.parti) return;
      this.parti = true;
      clearTimeout(this._minuteur);

      const derniers = this.lettres.filter(l => l.dernier);
      if (derniers.length > 1) {
        /* rotation d'un cran : les mêmes lettres, l'autre mot */
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
        this.grains.length = 0;
        this.el.remove();
        EARTH.bus.emet('titre-fini', {});
      }, 1500);
    }
  };

  EARTH.Titre = Titre;

})(window.EARTH = window.EARTH || {});
