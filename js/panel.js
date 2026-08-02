/* ============================================================
   EARTH — js/panel.js
   ------------------------------------------------------------
   Le bac a sable. Ferme par defaut (touche P) : l'interface doit
   disparaitre derriere les images.

   Chaque reglage pointe un chemin dans CONFIG. Ajouter un curseur
   = ajouter une ligne dans REGLAGES. Aucune autre modification.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { get, set } = EARTH.utils;

  /* --- declaration des reglages ---------------------------- */
  /* type: range | bascule | choix | action */
  const REGLAGES = [
    ['ECHELLE', [
      { p: 'echelle.min', l: 'plus petite', min: 0.01, max: 0.6, pas: 0.005 },
      { p: 'echelle.max', l: 'plus grande', min: 0.2, max: 2.5, pas: 0.01 },
      { p: 'echelle.rotationMax', l: 'rotation', min: 0, max: 20, pas: 0.5, u: '°' }
    ]],
    ['RYTHME', [
      { p: 'rythme.tenue', l: 'tenue', min: 800, max: 30000, pas: 100, u: 'ms', apres: () => EARTH.Director.programmer() },
      { p: 'rythme.tenueVariation', l: 'variation', min: 0, max: 15000, pas: 100, u: 'ms' },
      { p: 'rythme.cascade', l: 'cascade', min: 0, max: 2500, pas: 10, u: 'ms' },
      { p: 'rythme.passage', l: 'passage', type: 'choix', options: ['remplace', 'accumule', 'echange'] },
      { p: 'scene.maxPlans', l: 'plans max', min: 1, max: 80, pas: 1 }
    ]],
    ['MOUVEMENT', [
      { p: 'mouvement.entree', l: 'entree', type: 'choix', options: () => ['auto'].concat(Object.keys(EARTH.Motion.entrees)) },
      { p: 'mouvement.sortie', l: 'sortie', type: 'choix', options: () => ['auto'].concat(Object.keys(EARTH.Motion.sorties)) },
      { p: 'mouvement.dureeEntree', l: 'duree entree', min: 0, max: 6000, pas: 50, u: 'ms' },
      { p: 'mouvement.dureeSortie', l: 'duree sortie', min: 0, max: 6000, pas: 50, u: 'ms' },
      { p: 'mouvement.derive', l: 'derive', min: 0, max: 0.4, pas: 0.005 }
    ]],
    ['RECADRAGE', [
      { p: 'crop.top', l: 'haut', min: 0, max: 0.4, pas: 0.005, apres: recadrer },
      { p: 'crop.bottom', l: 'bas', min: 0, max: 0.4, pas: 0.005, apres: recadrer },
      { p: 'crop.left', l: 'gauche', min: 0, max: 0.4, pas: 0.005, apres: recadrer },
      { p: 'crop.right', l: 'droite', min: 0, max: 0.4, pas: 0.005, apres: recadrer }
    ]],
    ['REGARD', [
      { p: 'regard.opacite', l: 'opacite', min: 0.05, max: 1, pas: 0.01, apres: regard },
      { p: 'regard.grisaille', l: 'grisaille', min: 0, max: 1, pas: 0.01, apres: regard },
      { p: 'regard.contraste', l: 'contraste', min: 0.5, max: 2, pas: 0.01, apres: regard },
      { p: 'regard.filet', l: 'filet', type: 'bascule', apres: regard }
    ]],
    ['GRILLE', [
      { p: 'grille.visible', l: 'visible', type: 'bascule', apres: grille },
      { p: 'grille.colonnes', l: 'colonnes', min: 2, max: 24, pas: 1, apres: grilleRefaire },
      { p: 'grille.lignes', l: 'lignes', min: 2, max: 18, pas: 1, apres: grilleRefaire },
      { p: 'grille.obeissance', l: 'obeissance', min: 0, max: 1, pas: 0.05 }
    ]],
    ['GESTE', [
      { p: 'geste.parallaxe', l: 'respiration', min: 0, max: 3, pas: 0.05 },
      { p: 'geste.dispersion', l: 'dispersion', min: 0, max: 3, pas: 0.05 },
      { p: 'geste.seuilRapide', l: 'seuil vif', min: 0.1, max: 2, pas: 0.05 },
      { p: 'geste.immobilite', l: 'immobilite', min: 2000, max: 30000, pas: 500, u: 'ms' },
      { p: 'geste.creuseCadence', l: 'cadence fouille', min: 80, max: 900, pas: 20, u: 'ms' },
      { p: 'geste.creuseMax', l: 'profondeur max', min: 3, max: 30, pas: 1 }
    ]],
    ['DONNEES', [
      { p: 'coordonnees.survol', l: 'au survol', type: 'bascule' },
      { p: 'coordonnees.curseur', l: 'au curseur', type: 'bascule' },
      { p: 'coordonnees.lignes', l: 'lignes de compo', type: 'bascule' },
      { p: 'coordonnees.bandeau', l: 'bandeau source', type: 'bascule' },
      { p: 'coordonnees.imprimees', l: 'imprimees', min: 0, max: 1, pas: 0.02 },
      { p: 'hud.actif', l: 'appareillage', type: 'bascule', apres: hud },
      { p: 'hud.marquee', l: 'bandeau defilant', type: 'bascule', apres: hud },
      { p: 'hud.curseur', l: 'curseur en croix', type: 'bascule', apres: hud }
    ]],
    ['TEXTE ET EVENEMENTS', [
      { p: 'texte.actif', l: 'texte', type: 'bascule' },
      { p: 'texte.frequence', l: 'frequence', min: 0, max: 1, pas: 0.02 },
      { p: 'texte.taille', l: 'corps', min: 10, max: 90, pas: 1, u: 'px' },
      { p: 'evenements.actifs', l: 'evenements rares', type: 'bascule' },
      { p: 'evenements.rarete', l: 'rarete', min: 0, max: 0.6, pas: 0.01 },
      { p: 'regard.melangeChance', l: 'conflit', min: 0, max: 1, pas: 0.05 }
    ]],
    ['ARCHIVE', [
      { p: 'archive.ordre', l: 'ordre', type: 'choix', options: ['sac', 'hasard', 'suite'] },
      { p: 'archive.includeVideos', l: 'videos', type: 'bascule', apres: filtres },
      { p: 'archive.poidsVideos', l: 'poids videos', min: 1, max: 20, pas: 1 },
      { p: 'collectif.actif', l: 'archive collective', type: 'bascule' },
      { p: 'bacASable.journal', l: 'journal console', type: 'bascule' }
    ]]
  ];

  function grille() { EARTH.Grille.appliquer(); }
  function grilleRefaire() { EARTH.Grille.mesurer(); EARTH.Grille.dessiner(); }
  function hud() { EARTH.HUD.appliquer(); }

  function recadrer() { EARTH.Stage.recadrerTout(); }
  function regard() { EARTH.Stage.rafraichirRegard(); }
  function filtres() { EARTH.Archive.appliquerFiltres(EARTH.CONFIG); }

  /* --- construction ---------------------------------------- */

  const Panel = {
    el: null,
    ouvert: false,

    init() {
      const cfg = EARTH.CONFIG;
      const el = document.createElement('aside');
      el.id = 'panneau';
      el.innerHTML = '<div class="pan-tete">BAC A SABLE<span class="pan-fermer" title="P">×</span></div>';

      /* etat courant */
      const etat = document.createElement('div');
      etat.className = 'pan-etat';
      el.appendChild(etat);

      /* partitions */
      el.appendChild(bloc('COMPOSITIONS', partitions()));

      /* reglages */
      REGLAGES.forEach(([titre, liste]) => {
        const corps = document.createElement('div');
        liste.forEach(r => corps.appendChild(controle(r)));
        el.appendChild(bloc(titre, corps));
      });

      /* actions */
      const actions = document.createElement('div');
      actions.className = 'pan-actions';
      actions.appendChild(bouton('rejouer (R)', () => EARTH.Director.relancer()));
      actions.appendChild(bouton('pause (X)', () => EARTH.Director.bascule()));
      actions.appendChild(bouton('copier les reglages', copierConfig));
      el.appendChild(actions);

      el.appendChild(aide());

      document.body.appendChild(el);
      this.el = el;
      el.querySelector('.pan-fermer').onclick = () => this.basculer();

      /* l'etat se rafraichit tout seul tant que le panneau est
         ouvert : les plans en cours de sortie ne sont pas comptes */
      const majEtat = () => {
        if (!this.ouvert) return;
        const s = EARTH.Director.courante || {};
        const vivants = EARTH.Stage.plans.filter(p => !p.sorti).length;
        etat.innerHTML =
          `<b>${s.nom || '—'}</b> · ${vivants} plans` +
          `<br>graine ${s.graine != null ? s.graine : '—'} · ${s.passage || '—'}` +
          `<br>archive : ${EARTH.Archive.taille} fichiers / ${EARTH.Archive.lieux.length} lieux` +
          (EARTH.Director.enPause ? '<br><b>EN PAUSE</b>' : '');
      };
      EARTH.Director.surChangement(majEtat);
      setInterval(majEtat, 600);
      this.majEtat = majEtat;

      this.ouvert = !!cfg.bacASable.panneauOuvert;
      this.appliquer();
      return this;
    },

    basculer() { this.ouvert = !this.ouvert; this.appliquer(); this.majEtat && this.majEtat(); },
    appliquer() { document.body.classList.toggle('panneau-ouvert', this.ouvert); }
  };

  function bloc(titre, corps) {
    const d = document.createElement('section');
    d.className = 'pan-bloc';
    const h = document.createElement('h2');
    h.textContent = titre;
    d.appendChild(h);
    d.appendChild(corps);
    return d;
  }

  function partitions() {
    const cfg = EARTH.CONFIG;
    const wrap = document.createElement('div');
    wrap.className = 'pan-partitions';
    EARTH.Layouts.noms.forEach((nom, i) => {
      const ligne = document.createElement('div');
      ligne.className = 'pan-partition';

      const coche = document.createElement('input');
      coche.type = 'checkbox';
      coche.checked = cfg.compositions.actives.includes(nom);
      coche.title = 'garder dans la rotation';
      coche.onchange = () => {
        const a = cfg.compositions.actives;
        const j = a.indexOf(nom);
        if (coche.checked && j === -1) a.push(nom);
        if (!coche.checked && j > -1) a.splice(j, 1);
      };

      const b = document.createElement('button');
      b.className = 'pan-lien';
      b.innerHTML = `<span class="pan-num">${i < 10 ? (i + 1) % 10 : '&nbsp;'}</span>${nom}` +
                    `<em>${EARTH.Layouts.get(nom).label}</em>`;
      b.onclick = () => EARTH.Director.forcer(nom);

      ligne.appendChild(coche);
      ligne.appendChild(b);
      wrap.appendChild(ligne);
    });
    return wrap;
  }

  function controle(r) {
    const cfg = EARTH.CONFIG;
    const ligne = document.createElement('label');
    ligne.className = 'pan-ligne';
    const nom = document.createElement('span');
    nom.className = 'pan-nom';
    nom.textContent = r.l;
    ligne.appendChild(nom);

    const valeur = document.createElement('span');
    valeur.className = 'pan-valeur';

    const majValeur = v => { valeur.textContent = (typeof v === 'number' ? arrondi(v) : v) + (r.u || ''); };

    if (r.type === 'bascule') {
      const i = document.createElement('input');
      i.type = 'checkbox';
      i.checked = !!get(cfg, r.p);
      i.onchange = () => { set(cfg, r.p, i.checked); r.apres && r.apres(); };
      ligne.appendChild(i);
      ligne.classList.add('pan-ligne--bascule');
      return ligne;
    }

    if (r.type === 'choix') {
      const s = document.createElement('select');
      const opts = typeof r.options === 'function' ? r.options() : r.options;
      opts.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o; opt.textContent = o;
        s.appendChild(opt);
      });
      s.value = get(cfg, r.p);
      s.onchange = () => { set(cfg, r.p, s.value); r.apres && r.apres(); };
      ligne.appendChild(s);
      return ligne;
    }

    const i = document.createElement('input');
    i.type = 'range';
    i.min = r.min; i.max = r.max; i.step = r.pas;
    i.value = get(cfg, r.p);
    majValeur(Number(i.value));
    i.oninput = () => {
      const v = Number(i.value);
      set(cfg, r.p, v);
      majValeur(v);
      r.apres && r.apres();
    };
    ligne.appendChild(i);
    ligne.appendChild(valeur);
    return ligne;
  }

  function bouton(texte, fn) {
    const b = document.createElement('button');
    b.className = 'pan-bouton';
    b.textContent = texte;
    b.onclick = fn;
    return b;
  }

  function aide() {
    const d = document.createElement('div');
    d.className = 'pan-aide';
    d.innerHTML = [
      '<b>clic bref</b> plein regard',
      '<b>maintenir</b> creuser dans le lieu',
      '<b>lent / vif</b> respirer / disperser',
      '<b>ne rien faire</b> une image immense',
      '<b>deposer un fichier</b> contribuer',
      '&nbsp;',
      '<b>espace</b> composition suivante',
      '<b>← →</b> precedente / suivante',
      '<b>R</b> autre tirage · <b>Maj+R</b> identique',
      '<b>Entree</b> tout aligner · <b>Retour</b> tout effacer',
      '<b>1-9</b> partition · <b>X</b> pause',
      '<b>G</b> grille · <b>H</b> appareillage · <b>N</b> gris',
      '<b>C</b> recadrage · <b>T</b> texte · <b>A</b> ajouter',
      '<b>E</b> evenement · <b>W</b> webcam · <b>P</b> panneau'
    ].join('<br>');
    return d;
  }

  function arrondi(v) {
    if (Math.abs(v) >= 100) return Math.round(v);
    if (Math.abs(v) >= 1) return Math.round(v * 100) / 100;
    return Math.round(v * 1000) / 1000;
  }

  function copierConfig() {
    const texte = 'EARTH.CONFIG = ' + JSON.stringify(EARTH.CONFIG, null, 2) + ';';
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texte).then(
        () => flash('reglages copies'),
        () => repli(texte)
      );
    } else repli(texte);
  }

  function repli(texte) {
    const t = document.createElement('textarea');
    t.value = texte;
    t.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); flash('reglages copies'); }
    catch (e) { console.log(texte); flash('voir la console'); }
    t.remove();
  }

  let minuteurFlash = null;
  function flash(msg) {
    let d = document.getElementById('pan-flash');
    if (!d) {
      d = document.createElement('div');
      d.id = 'pan-flash';
      document.body.appendChild(d);
    }
    d.textContent = msg;
    d.classList.add('visible');
    clearTimeout(minuteurFlash);
    minuteurFlash = setTimeout(() => d.classList.remove('visible'), 1600);
  }

  /* --- clavier --------------------------------------------- */

  function clavier() {
    const cfg = EARTH.CONFIG;
    let cropMemoire = null;

    window.addEventListener('keydown', e => {
      const cible = e.target;
      if (cible && cible.matches && cible.matches('input, select, textarea')) return;
      const k = e.key;

      if (k === ' ') { e.preventDefault(); EARTH.Director.suivante(); return; }
      if (k === 'ArrowRight') { EARTH.Director.suivante(); return; }
      if (k === 'ArrowLeft') { EARTH.Director.precedente(); return; }
      if (k === 'r' || k === 'R') {
        e.shiftKey ? EARTH.Director.rejouer() : EARTH.Director.relancer();
        return;
      }
      if (k === 'x' || k === 'X') { EARTH.Director.bascule(); return; }
      if (k === 'p' || k === 'P') { Panel.basculer(); return; }
      if (k === 'g' || k === 'G') { EARTH.Grille.basculer(); return; }
      if (k === 'n' || k === 'N') {
        cfg.regard.grisaille = cfg.regard.grisaille ? 0 : 1;
        EARTH.Stage.rafraichirRegard();
        return;
      }
      if (k === 'h' || k === 'H') { EARTH.HUD.basculer(); return; }
      if (k === 't' || k === 'T') {
        cfg.texte.actif = !cfg.texte.actif;
        if (!cfg.texte.actif) EARTH.Texte.viderTout();
        return;
      }
      if (k === 'a' || k === 'A') { EARTH.Contribution.choisir(); return; }
      if (k === 'e' || k === 'E') {
        /* provoquer un evenement rare, pour l'atelier seulement */
        EARTH.Evenements.declencher(
          EARTH.Evenements.noms[Math.floor(Math.random() * EARTH.Evenements.noms.length)]
        );
        return;
      }
      if (k === 'w' || k === 'W') {
        EARTH.Webcam.basculer().then(ok => {
          if (!ok && EARTH.Webcam.erreur) EARTH.HUD.proclamer(EARTH.Webcam.erreur, 2600);
        });
        return;
      }
      /* l'ordre, d'un coup : tout se cale sur la grille */
      if (k === 'Enter') { EARTH.Evenements.declencher('alignement'); return; }
      /* le vide */
      if (k === 'Backspace') {
        e.preventDefault();
        EARTH.Stage.viderTout('fondu');
        EARTH.Texte.viderTout();
        EARTH.Director.suspendre(4000);
        return;
      }
      if (k === 'c' || k === 'C') {
        if (cropMemoire) { Object.assign(cfg.crop, cropMemoire); cropMemoire = null; }
        else { cropMemoire = Object.assign({}, cfg.crop); Object.assign(cfg.crop, { top: 0, bottom: 0, left: 0, right: 0 }); }
        EARTH.Stage.recadrerTout();
        return;
      }
      if (k === 'f' || k === 'F') {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
        return;
      }
      if (/^[0-9]$/.test(k)) {
        const i = (Number(k) + 9) % 10;      // 1 -> 0, 0 -> 9
        const nom = EARTH.Layouts.noms[i];
        if (nom) EARTH.Director.forcer(nom);
      }
    });
  }

  Panel.clavier = clavier;
  EARTH.Panel = Panel;

})(window.EARTH = window.EARTH || {});
