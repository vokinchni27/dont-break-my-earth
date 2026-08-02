/* ============================================================
   EARTH — js/main.js
   ------------------------------------------------------------
   L'amorcage, et rien d'autre. Si tu dois modifier ce fichier
   pour experimenter, c'est qu'un module manque quelque part.
   ============================================================ */

(function (EARTH) {
  'use strict';

  async function demarrer() {
    const cfg = EARTH.CONFIG;
    const scene = document.getElementById('scene');

    document.documentElement.style.setProperty('--fond', cfg.scene.fond);

    EARTH.Stage.init(scene);
    EARTH.Stage.rafraichirRegard();

    const n = await EARTH.Archive.charger(cfg);

    if (!n) {
      note(EARTH.Archive.erreur || 'aucune image trouvee dans images/', true);
      return;
    }
    console.log(`[EARTH] ${n} fichiers · ${EARTH.Archive.lieux.length} lieux : ${EARTH.Archive.lieux.join(', ')}`);

    EARTH.Panel.init();
    EARTH.Panel.clavier();

    ['pointerdown', 'keydown'].forEach(ev =>
      window.addEventListener(ev, () => EARTH.Stage.reveillerVideos(), { once: false, passive: true })
    );

    if (cfg.rythme.demarrageAuto) EARTH.Director.demarrer();
    else EARTH.Director.pause();
  }

  /* seul texte que la piece s'autorise : un diagnostic */
  function note(message, erreur) {
    const d = document.createElement('div');
    d.className = 'note' + (erreur ? ' note--erreur' : '');
    d.innerHTML = message +
      (erreur ? '<br><br>ouvre un terminal dans le dossier du projet et lance :<br><code>node tools/index-images.mjs</code>' : '');
    document.body.appendChild(d);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }

})(window.EARTH = window.EARTH || {});
