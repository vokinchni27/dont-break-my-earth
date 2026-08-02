/* ============================================================
   EARTH — js/layouts.js
   ------------------------------------------------------------
   Les partitions. C'est ici que se joue la composition.

   Une composition = une fonction qui rend une liste de places :
       { x, y, w, rot, z }
       x, y : position du CENTRE du plan, en fraction d'ecran (0..1)
       w    : largeur, en fraction du petit cote de l'ecran
       rot  : degres
       z    : ordre de superposition

   Rien d'autre. Elles ne connaissent ni les images, ni le temps,
   ni le DOM. Pour en ajouter une :

       EARTH.Layouts.ajouter('mon_nom', {
         label: 'ce que ca fait',
         nb: r => r.i(3, 6),
         build: ({ r, nb, taille }) => [...],
         mouvement: { entree: 'fondu', sortie: 'fondu' }
       });

   ...puis ajoute 'mon_nom' dans CONFIG.compositions.actives.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { lerp, clamp } = EARTH.utils;

  const Layouts = {
    registre: {},

    ajouter(nom, def) { this.registre[nom] = Object.assign({ nom }, def); return this; },
    get(nom) { return this.registre[nom]; },
    get noms() { return Object.keys(this.registre); },

    /* fabrique une composition complete.
       Une partition peut aussi choisir ses images elle-meme
       (def.items) : c'est ce qui permet a une composition d'etre
       gouvernee par les coordonnees plutot que par le hasard. */
    composer(nom, rand) {
      const cfg = EARTH.CONFIG;
      const def = this.registre[nom] || this.registre[this.noms[0]];
      const nb = Math.max(1, def.nb(rand));

      /* taille(a,b) : pioche entre deux reperes 0..1 de l'echelle globale.
         Changer CONFIG.echelle.min/max deplace TOUTES les compositions
         d'un coup, sans toucher a une seule d'entre elles. */
      const taille = (a, b, biais) => {
        const e = cfg.echelle;
        const t = biais ? rand.biais(a, b, biais) : rand.f(a, b);
        return lerp(e.min, e.max, clamp(t, 0, 1));
      };

      const contexte = {
        r: rand, rand, nb, taille, cfg,
        marge: cfg.scene.marge,
        grille: EARTH.Grille,
        archive: EARTH.Archive,
        ratio: window.innerWidth / window.innerHeight
      };

      const items = def.items ? def.items(contexte) : null;
      if (items) contexte.items = items;
      let places = def.build(contexte);

      /* la rotation globale s'applique apres coup, jamais dans les partitions */
      const rotMax = cfg.echelle.rotationMax;
      places.forEach((p, i) => {
        if (p.rot == null) p.rot = rotMax ? rand.f(-rotMax, rotMax) : 0;
        if (p.z == null) p.z = i + 1;
      });

      /* obeir a la grille, ou pas. Certaines partitions s'y calent
         toujours, d'autres jamais, la plupart parfois : c'est cet
         ecart entre systeme et liberte qui fait la composition. */
      const regle = def.grille || 'parfois';
      const obeit = regle === 'toujours' ||
        (regle === 'parfois' && rand.chance(cfg.grille.obeissance));
      if (obeit && EARTH.Grille && EARTH.Grille.el) {
        places = places.map(p => (p.libre ? p : EARTH.Grille.caler(p)));
      }

      /* le conflit : les images se superposent et se combattent */
      if (def.melange) {
        places.forEach(p => { p.melange = def.melange; });
      } else if (rand.chance(cfg.regard.melangeChance)) {
        const m = rand.pick(['multiply', 'difference', 'darken']);
        places.forEach(p => { p.melange = m; });
      }

      return { nom, def, places, items };
    }
  };

  /* --- petites aides pour ecrire les partitions ------------ */
  const dansMarge = (v, m) => clamp(v, m, 1 - m);

  /* ============================================================
     LES PARTITIONS
     ============================================================ */

  /* une seule image, grande, presque centree. Le silence. */
  Layouts.ajouter('solo', {
    label: 'une seule, grande',
    nb: () => 1,
    mouvement: { entree: 'zoom', sortie: 'fondu' },
    build: ({ r, taille }) => [{
      x: r.f(0.42, 0.58),
      y: r.f(0.44, 0.56),
      w: taille(0.55, 0.85)
    }]
  });

  /* une image qui deborde de l'ecran. On ne voit qu'un fragment. */
  Layouts.ajouter('plein', {
    label: 'plein cadre, deborde',
    nb: () => 1,
    mouvement: { entree: 'fondu', sortie: 'fondu' },
    build: ({ r, taille }) => [{
      x: r.f(0.35, 0.65),
      y: r.f(0.35, 0.65),
      w: taille(0.9, 1.0)
    }]
  });

  /* le rapport de force : une immense, une minuscule. */
  Layouts.ajouter('duo', {
    label: 'une immense, une minuscule',
    nb: () => 2,
    mouvement: { entree: 'derive', sortie: 'fondu' },
    build: ({ r, taille, marge }) => {
      const cote = r.signe();
      const grande = {
        x: dansMarge(0.5 - cote * r.f(0.1, 0.22), marge),
        y: r.f(0.4, 0.6),
        w: taille(0.45, 0.72),
        z: 1
      };
      const petite = {
        x: dansMarge(0.5 + cote * r.f(0.24, 0.4), marge),
        y: r.f(0.2, 0.8),
        w: taille(0.0, 0.1),
        z: 2
      };
      return [grande, petite];
    }
  });

  /* deux plans egaux, alignes. Lecture editoriale. */
  Layouts.ajouter('diptyque', {
    label: 'deux egales, alignees',
    nb: () => 2,
    mouvement: { entree: 'montee', sortie: 'fondu' },
    build: ({ r, taille }) => {
      const w = taille(0.22, 0.38);
      const y = r.f(0.42, 0.58);
      const ecart = r.f(0.06, 0.14);
      return [
        { x: 0.5 - w * 0.5 - ecart, y, w },
        { x: 0.5 + w * 0.5 + ecart, y, w }
      ];
    }
  });

  /* des petites, tres espacees. Le vide domine. */
  Layouts.ajouter('constellation', {
    label: 'petites, tres espacees',
    nb: r => r.i(4, 8),
    mouvement: { entree: 'fondu', sortie: 'fondu' },
    build: ({ r, nb, taille, marge }) => {
      const places = [];
      for (let i = 0; i < nb; i++) {
        let x, y, essais = 0;
        do {
          x = r.f(marge, 1 - marge);
          y = r.f(marge, 1 - marge);
          essais++;
        } while (essais < 24 && places.some(p => Math.hypot(p.x - x, p.y - y) < 0.22));
        places.push({ x, y, w: taille(0.02, 0.16, 1.6) });
      }
      return places;
    }
  });

  /* un tas. Elles se recouvrent, se cachent, se contredisent. */
  Layouts.ajouter('pile', {
    label: 'un tas qui se recouvre',
    nb: r => r.i(4, 7),
    mouvement: { entree: 'coupe', sortie: 'retrait' },
    build: ({ r, nb, taille }) => {
      const cx = r.f(0.38, 0.62);
      const cy = r.f(0.4, 0.6);
      const places = [];
      for (let i = 0; i < nb; i++) {
        places.push({
          x: cx + r.f(-0.13, 0.13),
          y: cy + r.f(-0.12, 0.12),
          w: taille(0.18, 0.55),
          z: i + 1
        });
      }
      return places;
    }
  });

  /* une ligne d'horizon : tout aligne sur une meme bande. */
  Layouts.ajouter('horizon', {
    label: 'alignees sur une bande',
    nb: r => r.i(3, 7),
    mouvement: { entree: 'glisse', sortie: 'fondu' },
    build: ({ r, nb, taille }) => {
      const y = r.f(0.28, 0.72);
      const debord = r.chance(0.5) ? r.f(0.05, 0.18) : 0;
      const places = [];
      for (let i = 0; i < nb; i++) {
        const t = nb === 1 ? 0.5 : i / (nb - 1);
        places.push({
          x: lerp(-debord, 1 + debord, t),
          y: y + r.f(-0.02, 0.02),
          w: taille(0.05, 0.32, 1.4),
          z: i + 1
        });
      }
      return places;
    }
  });

  /* une colonne, collee sur un cote. Beaucoup de vide a cote. */
  Layouts.ajouter('colonne', {
    label: 'empilees sur un cote',
    nb: r => r.i(3, 5),
    mouvement: { entree: 'montee', sortie: 'chute' },
    build: ({ r, nb, taille, marge }) => {
      const x = r.chance(0.5) ? r.f(marge, 0.3) : r.f(0.7, 1 - marge);
      const w = taille(0.12, 0.3);
      const places = [];
      for (let i = 0; i < nb; i++) {
        const t = (i + 0.5) / nb;
        places.push({ x: x + r.f(-0.015, 0.015), y: lerp(0.12, 0.88, t), w, z: i + 1 });
      }
      return places;
    }
  });

  /* elles sortent du cadre. On n'en voit qu'une moitie. */
  Layouts.ajouter('bord', {
    label: 'a moitie hors champ',
    nb: r => r.i(2, 4),
    mouvement: { entree: 'glisse', sortie: 'fondu' },
    build: ({ r, nb, taille }) => {
      const places = [];
      for (let i = 0; i < nb; i++) {
        const bord = r.i(0, 3);
        const d = r.f(-0.12, 0.18);
        const p = { w: taille(0.4, 0.8), z: i + 1 };
        if (bord === 0) { p.x = d; p.y = r.f(0.15, 0.85); }
        else if (bord === 1) { p.x = 1 - d; p.y = r.f(0.15, 0.85); }
        else if (bord === 2) { p.x = r.f(0.15, 0.85); p.y = d; }
        else { p.x = r.f(0.15, 0.85); p.y = 1 - d; }
        places.push(p);
      }
      return places;
    }
  });

  /* de la poussiere. Beaucoup, minuscules. */
  Layouts.ajouter('poussiere', {
    label: 'nuee de vignettes',
    nb: r => r.i(12, 22),
    mouvement: { entree: 'coupe', sortie: 'coupe' },
    build: ({ r, nb, taille, marge }) => {
      const places = [];
      for (let i = 0; i < nb; i++) {
        places.push({
          x: r.f(marge * 0.5, 1 - marge * 0.5),
          y: r.f(marge * 0.5, 1 - marge * 0.5),
          w: taille(0.0, 0.055, 1.8),
          z: i + 1
        });
      }
      return places;
    }
  });

  /* une grille, mais trouee et decalee. Ordre contrarie. */
  Layouts.ajouter('grille', {
    label: 'grille trouee',
    nb: r => r.i(6, 12),
    mouvement: { entree: 'fondu', sortie: 'fondu' },
    build: ({ r, nb, taille, marge }) => {
      const cols = r.i(3, 5);
      const lignes = Math.max(2, Math.ceil(nb / cols));
      const w = taille(0.06, 0.2);
      const places = [];
      for (let l = 0; l < lignes; l++) {
        for (let c = 0; c < cols; c++) {
          if (places.length >= nb) break;
          if (r.chance(0.18)) continue;                 // les trous
          places.push({
            x: lerp(marge + 0.05, 1 - marge - 0.05, cols === 1 ? 0.5 : c / (cols - 1)) + r.f(-0.02, 0.02),
            y: lerp(0.18, 0.82, lignes === 1 ? 0.5 : l / (lignes - 1)) + r.f(-0.02, 0.02),
            w: w * r.f(0.85, 1.15)
          });
        }
      }
      return places;
    }
  });

  /* un groupe serre dans un coin, et une seule, tres loin. */
  Layouts.ajouter('essaim', {
    label: 'un groupe serre, une isolee',
    nb: r => r.i(6, 10),
    mouvement: { entree: 'derive', sortie: 'fondu' },
    build: ({ r, nb, taille }) => {
      const cx = r.chance(0.5) ? r.f(0.16, 0.34) : r.f(0.66, 0.84);
      const cy = r.chance(0.5) ? r.f(0.18, 0.36) : r.f(0.64, 0.82);
      const places = [];
      for (let i = 0; i < nb - 1; i++) {
        places.push({
          x: cx + r.f(-0.14, 0.14),
          y: cy + r.f(-0.13, 0.13),
          w: taille(0.02, 0.14, 1.5),
          z: i + 1
        });
      }
      places.push({ x: 1 - cx, y: 1 - cy, w: taille(0.18, 0.42), z: nb });
      return places;
    }
  });

  /* elles se battent : meme place, meme taille, modes de fusion.
     Ce qu'on voit n'est plus une image mais leur difference. */
  Layouts.ajouter('conflit', {
    label: 'superposees, en conflit',
    nb: r => r.i(2, 4),
    grille: 'jamais',
    melange: 'difference',
    mouvement: { entree: 'fondu', sortie: 'fondu' },
    build: ({ r, nb, taille }) => {
      const x = r.f(0.42, 0.58), y = r.f(0.44, 0.56);
      const w = taille(0.4, 0.7);
      const places = [];
      for (let i = 0; i < nb; i++) {
        places.push({
          x: x + r.f(-0.04, 0.04),
          y: y + r.f(-0.035, 0.035),
          w: w * r.f(0.92, 1.08),
          z: i + 1,
          libre: true
        });
      }
      return places;
    }
  });

  /* une bande continue : chaque plan montre un detail different,
     colles bord a bord. Un paysage recompose qui n'existe pas. */
  Layouts.ajouter('bande', {
    label: 'bande de details colles',
    nb: r => r.i(5, 9),
    grille: 'toujours',
    mouvement: { entree: 'glisse', sortie: 'coupe' },
    build: ({ r, nb, grille }) => {
      const ligne = r.i(1, Math.max(1, grille.lignes - 2));
      const spanC = Math.max(1, Math.floor(grille.colonnes / nb));
      const places = [];
      for (let i = 0; i < nb; i++) {
        const c = i * spanC;
        if (c >= grille.colonnes) break;
        const p = grille.cellule(c, ligne, spanC, 1);
        p.z = i + 1;
        p.fouille = { zoom: r.f(1.8, 3.4), cx: r.f(0.15, 0.85), cy: r.f(0.2, 0.8) };
        places.push(p);
      }
      return places;
    }
  });

  /* LA PARTITION DES DONNEES.
     Chaque image reprend sa vraie place : la latitude devient la
     hauteur, la longitude devient l'abscisse. L'ecran n'est plus
     une page, c'est l'etendue de l'archive. Les images proches sur
     la Terre se retrouvent proches sur le mur. */
  Layouts.ajouter('latitude', {
    label: 'a leur vraie place sur la Terre',
    nb: r => r.i(7, 14),
    grille: 'jamais',
    mouvement: { entree: 'fondu', sortie: 'fondu' },
    items: ({ r, nb, archive }) => {
      const situees = archive.situees;
      if (situees.length < 4) return null;
      return r.shuffle(situees).slice(0, nb);
    },
    build: ({ r, nb, taille, items, archive }) => {
      const e = archive.etendue;
      if (!items || !e) {
        /* pas de coordonnees : on retombe sur une constellation */
        const places = [];
        for (let i = 0; i < nb; i++) {
          places.push({ x: r.f(.1, .9), y: r.f(.1, .9), w: taille(0.03, 0.16), libre: true });
        }
        return places;
      }
      return items.map((item, i) => {
        const c = item.coord;
        const tx = (c.lonDec - e.lonMin) / Math.max(1e-6, e.lonMax - e.lonMin);
        const ty = 1 - (c.latDec - e.latMin) / Math.max(1e-6, e.latMax - e.latMin);
        return {
          x: clamp(0.06 + tx * 0.88, 0.04, 0.96),
          y: clamp(0.08 + ty * 0.84, 0.05, 0.95),
          /* l'altitude de prise de vue donne l'echelle : plus la
             camera etait haute, plus l'image est grande */
          w: taille(0.03, 0.26, 1.4) * (c.cameraM > 50000 ? 1.8 : 1),
          z: i + 1,
          libre: true
        };
      });
    }
  });

  EARTH.Layouts = Layouts;

})(window.EARTH = window.EARTH || {});
