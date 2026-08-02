/* ============================================================
   EARTH — js/main.js
   ------------------------------------------------------------
   L'amorcage, et rien d'autre. Si tu dois modifier ce fichier
   pour experimenter, c'est qu'un reglage manque dans config.js.

   L'ordre compte : la scene et la grille d'abord (elles portent
   tout), les donnees ensuite, le geste en dernier — on n'ecoute
   la main qu'une fois qu'il y a quelque chose a toucher.
   ============================================================ */

(function (EARTH) {
  'use strict';

  async function demarrer() {
    const cfg = EARTH.CONFIG;
    document.documentElement.style.setProperty('--fond', cfg.scene.fond);

    /* 1. les surfaces */
    EARTH.Stage.init(document.getElementById('scene'));
    EARTH.Grille.init(document.getElementById('grille'));
    EARTH.Coords.init(document.getElementById('coordonnees'));
    EARTH.Texte.init(document.getElementById('textes'));
    EARTH.Webcam.init(document.getElementById('webcam'));
    EARTH.Stage.rafraichirRegard();

    /* 2. l'archive locale */
    const n = await EARTH.Archive.charger(cfg);
    if (!n) { note(EARTH.Archive.erreur || 'aucune image trouvee dans images/'); return; }
    console.log(
      `[EARTH] ${n} captures · ${EARTH.Archive.lieux.length} lieux · ` +
      `${EARTH.Archive.situees.length} situees`
    );

    /* 3. l'appareillage et l'atelier */
    EARTH.HUD.init(document.getElementById('hud'));
    EARTH.Panel.init();
    EARTH.Panel.clavier();

    /* 4. le geste */
    EARTH.Gestes.init();
    EARTH.Interactions.init();

    /* 5. l'archive collective — elle arrive quand elle arrive,
          la piece n'attend pas le reseau pour commencer */
    EARTH.Contribution.init(document.getElementById('depot'));

    ['pointerdown', 'keydown'].forEach(ev =>
      window.addEventListener(ev, () => EARTH.Stage.reveillerVideos(), { passive: true })
    );

    if (cfg.rythme.demarrageAuto) EARTH.Director.demarrer();
    else EARTH.Director.pause();

    EARTH.HUD.majEtat();
  }

  /* seul texte que la piece s'autorise en cas de panne */
  function note(message) {
    const d = document.createElement('div');
    d.className = 'note';
    d.innerHTML = message +
      '<br><br>ouvre un terminal dans le dossier du projet et lance :' +
      '<br><code>node tools/index-images.mjs</code>';
    document.body.appendChild(d);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }

})(window.EARTH = window.EARTH || {});
