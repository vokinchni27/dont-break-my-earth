/* ============================================================
   EARTH — js/panel.js
   ------------------------------------------------------------
   Le bac à sable. Brutaliste : des blocs, des traits épais, des
   capitales, aucun arrondi. Dix réglages, pas trente-cinq — on
   règle une œuvre, on ne pilote pas une console.

   Fermé par défaut. Touche P.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { get, set } = EARTH.utils;

  /* type : range | bascule
     `l` est une CLÉ, pas un mot : le libellé est posé par
     EARTH.T.hydrater et reposé à chaque réécriture. */
  const REGLAGES = [
    ['panneau.echelle', [
      { p: 'echelle.min', l: 'panneau.plusPetite', min: 0.01, max: 0.6, pas: 0.005 },
      { p: 'echelle.max', l: 'panneau.plusGrande', min: 0.2, max: 2.5, pas: 0.01 }
    ]],
    ['panneau.rythme', [
      { p: 'rythme.tenue', l: 'panneau.tenue', min: 800, max: 30000, pas: 100, u: 'ms',
        apres: () => EARTH.Director.programmer() },
      { p: 'rythme.cascade', l: 'panneau.cascade', min: 0, max: 2500, pas: 10, u: 'ms' }
    ]],
    ['panneau.grille', [
      { p: 'grille.visible', l: 'panneau.visible', type: 'bascule', apres: () => EARTH.Grille.appliquer() },
      { p: 'grille.souffle', l: 'panneau.souffle', min: 0, max: 4, pas: 0.05 },
      { p: 'grille.attraction', l: 'panneau.attraction', min: 0, max: 4, pas: 0.05 },
      { p: 'grille.obeissance', l: 'panneau.obeissance', min: 0, max: 1, pas: 0.05 },
      { p: 'grille.vibration', l: 'panneau.vibration', min: 0, max: 2, pas: 0.05 },
      { p: 'grille.curseur', l: 'panneau.curseurGrille', min: 0, max: 3, pas: 0.05 },
      { p: 'grille.absences', l: 'panneau.absences', min: 0, max: 0.5, pas: 0.01 }
    ]],
    ['panneau.seuil', [
      { p: 'titre.particules', l: 'panneau.particules', min: 0, max: 90, pas: 1 },
      { p: 'titre.naissance', l: 'panneau.naissance', min: 0, max: 0.4, pas: 0.005 },
      { p: 'titre.opacite', l: 'panneau.opaciteSignes', min: 0, max: 1, pas: 0.05 },
      { p: 'titre.montee', l: 'panneau.montee', min: 0, max: 3, pas: 0.05 }
    ]],
    ['panneau.geste', [
      { p: 'geste.parallaxe', l: 'panneau.respiration', min: 0, max: 3, pas: 0.05 },
      { p: 'geste.dispersion', l: 'panneau.dispersion', min: 0, max: 3, pas: 0.05 }
    ]],
    ['panneau.regard', [
      { p: 'regard.grisaille', l: 'panneau.gris', min: 0, max: 1, pas: 0.05,
        apres: () => EARTH.Stage.rafraichirRegard() },
      { p: 'regard.melangeChance', l: 'panneau.conflit', min: 0, max: 1, pas: 0.05 },
      { p: 'texte.frequence', l: 'panneau.texte', min: 0, max: 1, pas: 0.05 },
      { p: 'evenements.rarete', l: 'panneau.evenements', min: 0, max: 0.6, pas: 0.01 }
    ]]
  ];

  const Panel = {
    el: null,
    ouvert: false,

    init() {
      const el = document.createElement('aside');
      el.id = 'panneau';
      el.setAttribute('data-interface', 'bac-a-sable');
      el.innerHTML = '<div class="pan-tete"><span data-t="panneau.titre"></span>' +
                     '<span class="pan-fermer" title="P">×</span></div>';

      const etat = document.createElement('div');
      etat.className = 'pan-etat';
      el.appendChild(etat);

      el.appendChild(bloc('panneau.partitions', partitions()));

      REGLAGES.forEach(([cle, liste]) => {
        const corps = document.createElement('div');
        liste.forEach(r => corps.appendChild(controle(r)));
        el.appendChild(bloc(cle, corps));
      });

      el.appendChild(bloc('panneau.textes', redaction()));

      const actions = document.createElement('div');
      actions.className = 'pan-actions';
      actions.appendChild(bouton('panneau.rejouer', () => EARTH.Director.relancer()));
      actions.appendChild(bouton('panneau.pause', () => EARTH.Director.bascule()));
      actions.appendChild(bouton('panneau.copier', copierConfig));
      el.appendChild(actions);
      el.appendChild(aide());

      document.body.appendChild(el);
      this.el = el;
      EARTH.T.hydrater(el);
      el.querySelector('.pan-fermer').onclick = () => this.basculer();

      const majEtat = () => {
        if (!this.ouvert) return;
        const s = EARTH.Director.courante || {};
        const vivants = EARTH.Stage.plans.filter(p => !p.sorti).length;
        etat.innerHTML =
          `<b>${s.nom || '—'}</b> — ${vivants} ${EARTH.T('panneau.plans')}<br>` +
          `${EARTH.T('panneau.graine')} ${s.graine != null ? s.graine : '—'}<br>` +
          `${EARTH.Archive.taille} ${EARTH.T('hud.captures')} / ${EARTH.Archive.situees.length} ${EARTH.T('panneau.situees')}` +
          (EARTH.Director.enPause ? `<br><b>${EARTH.T('panneau.enPause')}</b>` : '');
      };
      EARTH.Director.surChangement(majEtat);
      setInterval(majEtat, 700);
      this.majEtat = majEtat;

      this.ouvert = !!EARTH.CONFIG.bacASable.panneauOuvert;
      this.appliquer();
      return this;
    },

    basculer() { this.ouvert = !this.ouvert; this.appliquer(); this.majEtat && this.majEtat(); },
    appliquer() { document.body.classList.toggle('panneau-ouvert', this.ouvert); }
  };

  function bloc(cle, corps) {
    const d = document.createElement('section');
    d.className = 'pan-bloc';
    const h = document.createElement('h2');
    h.setAttribute('data-t', cle);
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
      coche.setAttribute('data-t-titre', 'panneau.gardeRotation');
      coche.onchange = () => {
        const a = cfg.compositions.actives;
        const j = a.indexOf(nom);
        if (coche.checked && j === -1) a.push(nom);
        if (!coche.checked && j > -1) a.splice(j, 1);
      };

      const b = document.createElement('button');
      b.className = 'pan-lien';
      b.innerHTML = `<span class="pan-num">${i < 10 ? (i + 1) % 10 : '·'}</span>${nom}`;
      b.title = EARTH.Layouts.get(nom).label;
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
    nom.setAttribute('data-t', r.l);
    ligne.appendChild(nom);

    if (r.type === 'bascule') {
      ligne.classList.add('pan-ligne--bascule');
      const i = document.createElement('input');
      i.type = 'checkbox';
      i.checked = !!get(cfg, r.p);
      i.onchange = () => { set(cfg, r.p, i.checked); r.apres && r.apres(); };
      ligne.appendChild(i);
      return ligne;
    }

    const valeur = document.createElement('span');
    valeur.className = 'pan-valeur';
    const i = document.createElement('input');
    i.type = 'range';
    i.min = r.min; i.max = r.max; i.step = r.pas;
    i.value = get(cfg, r.p);
    const maj = v => { valeur.textContent = arrondi(v) + (r.u || ''); };
    maj(Number(i.value));
    i.oninput = () => {
      const v = Number(i.value);
      set(cfg, r.p, v);
      maj(v);
      r.apres && r.apres();
    };
    ligne.appendChild(i);
    ligne.appendChild(valeur);
    return ligne;
  }

  /* ==========================================================
     LA RÉDACTION
     Changer ce qui est écrit, la police et les corps, sans
     toucher au code. TOUS les textes passent par ici : le titre,
     les angles de l'appareillage, le formulaire de dépôt, l'aide,
     les fragments, les messages — la liste vient de js/textes.js
     et se met à jour toute seule si on y ajoute une clé.

     Ce qu'on écrit s'applique à l'écran immédiatement : EARTH.T
     prévient tout ce qui affiche un texte. Les essais sont gardés
     dans le navigateur ; le bouton « copier » sort un bloc à
     coller dans js/textes.js ou dans le mini-CMS pour les figer
     pour tout le monde.

     Les listes — l'aide, les fragments — s'écrivent une entrée
     par ligne. Une paire touche/sens se sépare d'une tabulation
     ou de deux espaces.
     ========================================================== */

  const POLICES = [
    ['Helvetica', '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif'],
    ['Arial', 'Arial, "Helvetica Neue", Helvetica, sans-serif'],
    ['Système', 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'],
    ['Times', '"Times New Roman", Times, serif'],
    ['Mono', 'ui-monospace, "SFMono-Regular", Consolas, Menlo, monospace']
  ];

  function appliquerTypo() {
    const t = EARTH.CONFIG.typo;
    const r = document.documentElement.style;
    r.setProperty('--grotesque', t.famille);
    r.setProperty('--micro', t.micro + 'px');
    r.setProperty('--interlettre', t.interlettre + 'em');
    document.querySelectorAll('.titre-ligne').forEach(l => {
      l.style.fontSize = `clamp(42px, ${t.titre}vw, 210px)`;
    });
  }

  /* une liste ↔ du texte, une entrée par ligne */
  function listeVersTexte(liste) {
    return liste.map(e => Array.isArray(e) ? e.join('\t') : String(e)).join('\n');
  }
  function texteVersListe(texte, enPaires) {
    const lignes = texte.split('\n').map(l => l.trim()).filter(Boolean);
    if (!enPaires) return lignes;
    return lignes.map(l => {
      const coupe = l.split(/\t|\s{2,}/);
      return coupe.length > 1
        ? [coupe[0].trim(), coupe.slice(1).join(' ').trim()]
        : [l, ''];
    });
  }

  function redaction() {
    const wrap = document.createElement('div');
    wrap.className = 'pan-redaction';

    /* quel texte réécrire — toutes les clés, sans exception,
       y compris les listes */
    const choix = document.createElement('select');
    const plat = EARTH.T.toutes();
    const cles = Object.keys(plat).sort();
    cles.forEach(k => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = k + (Array.isArray(plat[k]) ? ' […]' : '');
      choix.appendChild(o);
    });

    const champ = document.createElement('textarea');
    champ.rows = 3;
    champ.spellcheck = false;

    const estListe = () => Array.isArray(plat[choix.value]);
    const estPaires = () => {
      const modele = plat[choix.value];
      return Array.isArray(modele) && Array.isArray(modele[0]);
    };

    const montrer = () => {
      const valeur = EARTH.T(choix.value);
      champ.value = Array.isArray(valeur) ? listeVersTexte(valeur) : String(valeur);
      champ.rows = estListe() ? 8 : 3;
    };
    choix.onchange = montrer;

    /* Une seule ligne : EARTH.T prévient lui-même tout ce qui
       affiche ce texte — l'appareillage, le formulaire, l'aide,
       le titre. Rien à rafraîchir à la main ici. */
    champ.oninput = () => {
      EARTH.T.definir(
        choix.value,
        estListe() ? texteVersListe(champ.value, estPaires()) : champ.value
      );
    };
    montrer();

    wrap.appendChild(choix);
    wrap.appendChild(champ);

    /* la police */
    const police = document.createElement('label');
    police.className = 'pan-ligne';
    const nomPolice = document.createElement('span');
    nomPolice.className = 'pan-nom';
    nomPolice.setAttribute('data-t', 'panneau.police');
    const selPolice = document.createElement('select');
    POLICES.forEach(([nom, pile]) => {
      const o = document.createElement('option');
      o.value = pile; o.textContent = nom;
      selPolice.appendChild(o);
    });
    selPolice.value = EARTH.CONFIG.typo.famille;
    selPolice.onchange = () => { EARTH.CONFIG.typo.famille = selPolice.value; appliquerTypo(); };
    police.appendChild(nomPolice);
    police.appendChild(selPolice);
    wrap.appendChild(police);

    [
      { p: 'typo.micro', l: 'panneau.corps', min: 6, max: 20, pas: 0.5, u: 'px' },
      { p: 'typo.interlettre', l: 'panneau.interlettre', min: 0, max: 0.5, pas: 0.01 },
      { p: 'typo.titre', l: 'panneau.corpsTitre', min: 4, max: 24, pas: 0.5, u: 'vw' },
      { p: 'texte.taille', l: 'panneau.corpsFragment', min: 10, max: 90, pas: 1, u: 'px' }
    ].forEach(r => wrap.appendChild(controle(Object.assign({ apres: appliquerTypo }, r))));

    const remise = bouton('panneau.remiseTextes', () => {
      EARTH.T.oublier();
      montrer();
      EARTH.HUD.souffler(EARTH.T('panneau.textesRemis'));
    });
    remise.style.marginTop = '8px';
    wrap.appendChild(remise);

    const sortir = bouton('panneau.copierTextes', () => {
      const locales = EARTH.T.locales();
      const texte = JSON.stringify(locales, null, 2);
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texte).then(
          () => EARTH.HUD.souffler(EARTH.T('hud.reglagesCopies')),
          () => console.log(texte));
      } else console.log(texte);
    });
    wrap.appendChild(sortir);

    appliquerTypo();
    return wrap;
  }

  function bouton(cle, fn) {
    const b = document.createElement('button');
    b.className = 'pan-bouton';
    b.setAttribute('data-t', cle);
    b.onclick = fn;
    return b;
  }

  /* la liste complète des touches — elle se réécrit comme le
     reste, alors elle se redessine comme le reste */
  function aide() {
    const d = document.createElement('div');
    d.className = 'pan-aide';
    const peindre = () => {
      const liste = EARTH.T('aide');
      d.replaceChildren();
      (Array.isArray(liste) ? liste : []).forEach(paire => {
        const touche = document.createElement('b');
        touche.textContent = Array.isArray(paire) ? paire[0] : String(paire);
        d.append(touche, ' ' + (Array.isArray(paire) ? paire[1] : ''),
                 document.createElement('br'));
      });
    };
    peindre();
    EARTH.T.surChangement(peindre);
    return d;
  }

  function arrondi(v) {
    if (Math.abs(v) >= 100) return Math.round(v);
    if (Math.abs(v) >= 1) return Math.round(v * 100) / 100;
    return Math.round(v * 1000) / 1000;
  }

  function copierConfig() {
    const texte = 'EARTH.CONFIG = ' + JSON.stringify(EARTH.CONFIG, null, 2) + ';';
    const fin = () => EARTH.HUD.souffler(EARTH.T('hud.reglagesCopies'));
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texte).then(fin, () => repli(texte, fin));
    } else repli(texte, fin);
  }

  function repli(texte, fin) {
    const t = document.createElement('textarea');
    t.value = texte;
    t.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(t);
    t.select();
    try { document.execCommand('copy'); fin(); }
    catch (e) { console.log(texte); EARTH.HUD.souffler(EARTH.T('hud.voirConsole')); }
    t.remove();
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
      if (k === 'c' || k === 'C') {
        if (cropMemoire) { Object.assign(cfg.crop, cropMemoire); cropMemoire = null; }
        else {
          cropMemoire = Object.assign({}, cfg.crop);
          Object.assign(cfg.crop, { top: 0, bottom: 0, left: 0, right: 0 });
        }
        EARTH.Stage.recadrerTout();
        return;
      }
      if (k === 'f' || k === 'F') {
        if (document.fullscreenElement) document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
        return;
      }
      if (k === 'Enter') { EARTH.Evenements.declencher('alignement'); return; }
      if (k === 'Backspace') {
        e.preventDefault();
        EARTH.Stage.viderTout('fondu');
        EARTH.Texte.viderTout();
        EARTH.Director.suspendre(4000);
        return;
      }
      if (/^[0-9]$/.test(k)) {
        const nom = EARTH.Layouts.noms[(Number(k) + 9) % 10];
        if (nom) EARTH.Director.forcer(nom);
      }
    });
  }

  Panel.clavier = clavier;
  EARTH.Panel = Panel;

})(window.EARTH = window.EARTH || {});
