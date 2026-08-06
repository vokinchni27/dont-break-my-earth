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
     Fonction et non constante : les libelles doivent pouvoir venir
     du CMS, qui repond apres le chargement du script. */
  function reglages() { return [
    [EARTH.T('panneau.echelle'), [
      { p: 'echelle.min', l: EARTH.T('panneau.plusPetite'), min: 0.01, max: 0.6, pas: 0.005 },
      { p: 'echelle.max', l: EARTH.T('panneau.plusGrande'), min: 0.2, max: 2.5, pas: 0.01 }
    ]],
    [EARTH.T('panneau.rythme'), [
      { p: 'rythme.tenue', l: EARTH.T('panneau.tenue'), min: 800, max: 30000, pas: 100, u: 'ms',
        apres: () => EARTH.Director.programmer() },
      { p: 'rythme.cascade', l: EARTH.T('panneau.cascade'), min: 0, max: 2500, pas: 10, u: 'ms' }
    ]],
    [EARTH.T('panneau.grille'), [
      { p: 'grille.visible', l: EARTH.T('panneau.visible'), type: 'bascule', apres: () => EARTH.Grille.appliquer() },
      { p: 'grille.souffle', l: EARTH.T('panneau.souffle'), min: 0, max: 4, pas: 0.05 },
      { p: 'grille.attraction', l: EARTH.T('panneau.attraction'), min: 0, max: 4, pas: 0.05 },
      { p: 'grille.obeissance', l: EARTH.T('panneau.obeissance'), min: 0, max: 1, pas: 0.05 }
    ]],
    [EARTH.T('panneau.geste'), [
      { p: 'geste.parallaxe', l: EARTH.T('panneau.respiration'), min: 0, max: 3, pas: 0.05 },
      { p: 'geste.dispersion', l: EARTH.T('panneau.dispersion'), min: 0, max: 3, pas: 0.05 }
    ]],
    [EARTH.T('panneau.regard'), [
      { p: 'regard.grisaille', l: EARTH.T('panneau.gris'), min: 0, max: 1, pas: 0.05,
        apres: () => EARTH.Stage.rafraichirRegard() },
      { p: 'regard.melangeChance', l: EARTH.T('panneau.conflit'), min: 0, max: 1, pas: 0.05 },
      { p: 'texte.frequence', l: EARTH.T('panneau.texte'), min: 0, max: 1, pas: 0.05 },
      { p: 'evenements.rarete', l: EARTH.T('panneau.evenements'), min: 0, max: 0.6, pas: 0.01 }
    ]]
  ]; }

  const Panel = {
    el: null,
    ouvert: false,

    init() {
      const el = document.createElement('aside');
      el.id = 'panneau';
      el.innerHTML = `<div class="pan-tete"><span>${EARTH.T('panneau.titre')}</span>` +
                     '<span class="pan-fermer" title="P">×</span></div>';

      const etat = document.createElement('div');
      etat.className = 'pan-etat';
      el.appendChild(etat);

      el.appendChild(bloc(EARTH.T('panneau.partitions'), partitions()));

      reglages().forEach(([titre, liste]) => {
        const corps = document.createElement('div');
        liste.forEach(r => corps.appendChild(controle(r)));
        el.appendChild(bloc(titre, corps));
      });

      const actions = document.createElement('div');
      actions.className = 'pan-actions';
      actions.appendChild(bouton(EARTH.T('panneau.rejouer'), () => EARTH.Director.relancer()));
      actions.appendChild(bouton(EARTH.T('panneau.pause'), () => EARTH.Director.bascule()));
      actions.appendChild(bouton(EARTH.T('panneau.copier'), copierConfig));
      el.appendChild(actions);
      el.appendChild(aide());

      document.body.appendChild(el);
      this.el = el;
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
      coche.title = EARTH.T('panneau.gardeRotation');
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
    nom.textContent = r.l;
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
    d.innerHTML = EARTH.T('aide')
      .map(paire => `<b>${paire[0]}</b> ${paire[1]}`)
      .join('<br>');
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
