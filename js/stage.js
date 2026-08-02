/* ============================================================
   EARTH — js/stage.js
   ------------------------------------------------------------
   La scene : elle ne decide rien, elle execute.
   Poser un plan, le recadrer, le deplacer, le retirer.
   Le « ou » appartient a layouts.js, le « quand » a director.js,
   le « pourquoi » a interactions.js.

   Un plan :
     figure.plate          position + largeur (+ parallaxe)
       div.plate-motion    opacite + transform animes
         div.plate-frame   fenetre de recadrage — c'est elle qui
                           recoit le geste
           img | video     l'image reelle, decalee et agrandie
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { clamp, vmin } = EARTH.utils;

  const Stage = {
    el: null,
    plans: [],

    init(el) {
      this.el = el;
      return this;
    },

    /* --- poser un plan ------------------------------------- */
    /* place = { x, y, w, rot, z, fouille, melange } */
    poser(item, place, mouvement, delai) {
      if (!item) return null;
      const cfg = EARTH.CONFIG;

      const el = document.createElement('figure');
      el.className = 'plate';
      el.style.setProperty('--x', place.x);
      el.style.setProperty('--y', place.y);
      el.style.setProperty('--w', place.w);
      el.style.setProperty('--rot', place.rot || 0);
      el.style.zIndex = String(Math.round(place.z == null ? 1 : place.z));

      const motion = document.createElement('div');
      motion.className = 'plate-motion';
      const melange = place.melange || cfg.regard.melange;
      if (melange && melange !== 'normal') motion.style.mixBlendMode = melange;

      const frame = document.createElement('div');
      frame.className = 'plate-frame';
      if (cfg.regard.filet) frame.classList.add('filet');

      let media;
      if (item.type === 'video') {
        media = document.createElement('video');
        media.muted = true; media.loop = true; media.autoplay = true;
        media.playsInline = true; media.preload = 'auto';
        ['muted', 'loop', 'autoplay', 'playsinline'].forEach(a => media.setAttribute(a, ''));
      } else {
        media = document.createElement('img');
        media.decoding = 'async';
        media.alt = '';
      }
      media.src = item.src;

      frame.appendChild(media);
      motion.appendChild(frame);
      el.appendChild(motion);
      this.el.appendChild(el);

      const plan = { el, motion, frame, media, item, place, ne: performance.now(), sorti: false };
      frame._plan = plan;                       // pour la detection du geste
      this.plans.push(plan);
      this.recadrer(plan);

      pret(media).then(() => {
        this.recadrer(plan);
        if (plan.sorti) return;
        if (media.tagName === 'VIDEO') {
          const p = media.play();
          if (p && p.catch) p.catch(() => {});
        }
        const ecoule = performance.now() - plan.ne;
        plan.animEntree = EARTH.Motion.entree(mouvement, plan, Math.max(0, (delai || 0) - ecoule));
      });

      /* certaines images portent leurs coordonnees a meme la surface */
      if (item.coord && place.w > 0.2 && Math.random() < cfg.coordonnees.imprimees) {
        EARTH.Coords.imprimer(plan);
      }

      const vivants = this.plans.filter(p => !p.sorti && !p.recompense);
      if (vivants.length > cfg.scene.maxPlans) {
        this.retirer(vivants[0], cfg.mouvement.sortie);
      }
      return plan;
    },

    /* --- recadrage ----------------------------------------- */
    /* La fenetre prend le rapport de l'image APRES coupe, et
       l'image est decalee et agrandie pour que seule la fenetre
       demandee reste visible. Tout en pourcentages : redimensionner
       la fenetre du navigateur ne casse rien.

       plan.place.fouille permet d'entrer DANS l'image : c'est ce
       qui fait qu'un appui maintenu creuse au lieu de defiler. */
    cadre(plan) {
      const c = EARTH.CONFIG.crop;
      const f = plan.place.fouille;
      if (!f) return { top: c.top, bottom: c.bottom, left: c.left, right: c.right };

      const largeur = 1 - c.left - c.right;
      const hauteur = 1 - c.top - c.bottom;
      const zoom = Math.max(1, f.zoom || 1);
      const sw = largeur / zoom;
      const sh = hauteur / zoom;
      const left = clamp(c.left + largeur * (f.cx == null ? 0.5 : f.cx) - sw / 2, c.left, 1 - c.right - sw);
      const top = clamp(c.top + hauteur * (f.cy == null ? 0.5 : f.cy) - sh / 2, c.top, 1 - c.bottom - sh);
      return { top, bottom: 1 - top - sh, left, right: 1 - left - sw };
    },

    recadrer(plan) {
      const k = this.cadre(plan);
      const m = plan.media;
      const nw = m.naturalWidth || m.videoWidth || 2493;
      const nh = m.naturalHeight || m.videoHeight || 1231;

      const visW = Math.max(0.01, 1 - k.left - k.right);
      const visH = Math.max(0.01, 1 - k.top - k.bottom);
      plan.frame.style.setProperty('--ar', ((nw * visW) / (nh * visH)).toFixed(4));
      plan.frame.style.setProperty('--ct', k.top);
      plan.frame.style.setProperty('--cl', k.left);
      plan.frame.style.setProperty('--zoom', (1 / visW).toFixed(4));
    },

    recadrerTout() { this.plans.forEach(p => this.recadrer(p)); },

    /* --- deplacer un plan deja pose ------------------------- */
    replacer(plan, place, duree) {
      if (!plan || plan.sorti) return;
      plan.el.classList.add('glisse');
      plan.el.style.setProperty('--duree-glisse', (duree || 900) + 'ms');
      plan.el.style.setProperty('--x', place.x);
      plan.el.style.setProperty('--y', place.y);
      plan.el.style.setProperty('--w', place.w);
      plan.el.style.setProperty('--rot', place.rot || 0);
      plan.place = Object.assign({}, plan.place, place);
      clearTimeout(plan._glisse);
      plan._glisse = setTimeout(() => plan.el.classList.remove('glisse'), (duree || 900) + 60);
    },

    /* --- plein regard --------------------------------------- */
    /* on ne recalcule pas la mise en page : on transporte le plan
       au centre et on l'agrandit. Rien ne bouge autour. */
    focaliser(plan, options) {
      const o = options || {};
      const couverture = o.couverture == null ? 0.94 : o.couverture;
      const r = plan.frame.getBoundingClientRect();
      if (!r.width) return () => {};

      const parLargeur = (window.innerWidth * couverture) / r.width;
      const parHauteur = (window.innerHeight * couverture) / r.height;
      const echelle = Math.max(1.02, Math.min(parLargeur, parHauteur));
      const dx = window.innerWidth / 2 - (r.left + r.width / 2);
      const dy = window.innerHeight / 2 - (r.top + r.height / 2);

      plan.el.classList.add('garde');
      const anim = plan.motion.animate(
        [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${echelle})` }],
        { duration: o.duree || 900, easing: 'cubic-bezier(.16,.84,.34,1)', fill: 'forwards', composite: 'add' }
      );

      return () => {
        const retour = plan.motion.animate(
          [{ transform: `translate(${dx}px, ${dy}px) scale(${echelle})` }, { transform: 'none' }],
          { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards', composite: 'add' }
        );
        retour.finished.then(() => {
          anim.cancel(); retour.cancel();
          plan.el.classList.remove('garde');
        }, () => {});
      };
    },

    attenuerSauf(plan, opacite) {
      this.el.style.setProperty('--attenuation', opacite == null ? 0.06 : opacite);
      this.el.classList.add('attenue');
      if (plan) plan.el.classList.add('garde');
    },

    retablir() {
      this.el.classList.remove('attenue');
      this.plans.forEach(p => p.el.classList.remove('garde'));
    },

    /* --- retirer -------------------------------------------- */
    retirer(plan, mouvement, delai) {
      if (!plan || plan.sorti) return;
      plan.sorti = true;
      if (plan.frame) plan.frame._plan = null;
      const anim = EARTH.Motion.sortie(mouvement, plan, delai || 0);
      const fin = () => {
        plan.el.remove();
        const i = this.plans.indexOf(plan);
        if (i > -1) this.plans.splice(i, 1);
      };
      if (anim && anim.finished) anim.finished.then(fin, fin);
      else fin();
    },

    viderTout(mouvement) {
      const cfg = EARTH.CONFIG;
      this.plans.slice().forEach((p, i) => {
        this.retirer(p, mouvement, i * Math.min(80, cfg.rythme.cascade / 4));
      });
    },

    videImmediat() {
      this.plans.forEach(p => p.el.remove());
      this.plans = [];
    },

    reveillerVideos() {
      this.plans.forEach(p => {
        if (p.media.tagName === 'VIDEO' && p.media.paused) {
          const pr = p.media.play();
          if (pr && pr.catch) pr.catch(() => {});
        }
      });
    },

    rafraichirRegard() {
      const r = EARTH.CONFIG.regard;
      this.el.style.setProperty('--opacite', r.opacite);
      this.el.style.filter =
        ((r.grisaille ? `grayscale(${r.grisaille}) ` : '') +
         (r.contraste !== 1 ? `contrast(${r.contraste})` : '')).trim() || 'none';
      this.plans.forEach(p => p.frame.classList.toggle('filet', !!r.filet));
    }
  };

  function pret(media) {
    if (media.tagName === 'VIDEO') {
      if (media.readyState >= 1) return Promise.resolve();
      return new Promise(res => {
        media.addEventListener('loadedmetadata', res, { once: true });
        media.addEventListener('error', res, { once: true });
        setTimeout(res, 4000);
      });
    }
    if (media.complete && media.naturalWidth) return Promise.resolve();
    return new Promise(res => {
      media.addEventListener('load', res, { once: true });
      media.addEventListener('error', res, { once: true });
      setTimeout(res, 6000);
    });
  }

  EARTH.Stage = Stage;

})(window.EARTH = window.EARTH || {});
