/* ============================================================
   EARTH — js/gestures.js
   ------------------------------------------------------------
   Le vocabulaire du geste.

   Ce module ne fait rien de visible : il ecoute la main et
   traduit. Le clic n'est qu'un des mots ; les autres sont la
   duree, la vitesse et l'immobilite.

     effleure        le curseur passe sur une image
     bref            appui court — une revelation
     maintien        appui long — on creuse, de plus en plus profond
     lent            deplacement lent — les images respirent
     rapide          deplacement vif — les images se dispersent
     immobile        plus rien ne bouge — la contemplation est payee

   Souris, doigt et stylet passent par le meme chemin (Pointer
   Events) : le telephone n'est pas un cas particulier.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { vmin, clamp, interfaceSous } = EARTH.utils;
  const bus = EARTH.bus;

  const Gestes = {
    x: 0, y: 0, nx: 0.5, ny: 0.5,
    vitesse: 0,
    appuye: false,
    survole: null,
    dernier: 0,

    init() {
      let debutAppui = 0, xAppui = 0, yAppui = 0;
      let minuteurMaintien = null, cadenceMaintien = null, profondeur = 0;
      let minuteurImmobile = null, dormant = false;
      let tx = 0, ty = 0, tt = 0;          // dernier point pour la vitesse
      let dernierRapide = 0;

      const surface = document.documentElement;

      const reveiller = () => {
        clearTimeout(minuteurImmobile);
        if (dormant) { dormant = false; bus.emet('reveil', {}); }
        minuteurImmobile = setTimeout(() => {
          dormant = true;
          bus.emet('immobile', { x: this.x, y: this.y });
        }, EARTH.CONFIG.geste.immobilite);
      };

      const planSous = (x, y) => {
        const el = document.elementFromPoint(x, y);
        const frame = el && el.closest && el.closest('.plate-frame');
        return (frame && frame._plan) || null;
      };

      /* --- deplacement ------------------------------------- */
      surface.addEventListener('pointermove', e => {
        const g = EARTH.CONFIG.geste;
        const t = e.timeStamp || performance.now();
        const dt = Math.max(1, t - tt);
        const d = Math.hypot(e.clientX - tx, e.clientY - ty);
        this.vitesse = (d / vmin()) / dt * 100;      // unites : vmin/100ms
        tx = e.clientX; ty = e.clientY; tt = t;

        this.x = e.clientX; this.y = e.clientY;
        this.nx = clamp(e.clientX / window.innerWidth, 0, 1);
        this.ny = clamp(e.clientY / window.innerHeight, 0, 1);
        this.dernier = t;

        bus.emet('pointeur', { x: this.x, y: this.y, nx: this.nx, ny: this.ny, vitesse: this.vitesse });
        bus.emet('geste', { type: 'deplacement' });

        if (this.vitesse > g.seuilRapide) {
          if (t - dernierRapide > 70) {
            dernierRapide = t;
            bus.emet('rapide', { x: this.x, y: this.y, vitesse: this.vitesse, dx: e.movementX || 0, dy: e.movementY || 0 });
          }
        } else if (this.vitesse < g.seuilLent) {
          bus.emet('lent', { x: this.x, y: this.y, nx: this.nx, ny: this.ny });
        }

        /* survol */
        if (!this.appuye) {
          const plan = planSous(e.clientX, e.clientY);
          if (plan !== this.survole) {
            if (this.survole) bus.emet('quitte', { plan: this.survole });
            this.survole = plan;
            if (plan) bus.emet('effleure', { plan, x: this.x, y: this.y });
          }
        }

        if (this.appuye && Math.hypot(e.clientX - xAppui, e.clientY - yAppui) > 14) {
          // un appui qui derive n'est plus un appui bref
          debutAppui = 0;
        }

        reveiller();
      }, { passive: true });

      /* --- appui ------------------------------------------- */
      surface.addEventListener('pointerdown', e => {
        /* on ne creuse pas dans un formulaire */
        if (interfaceSous(e.target)) return;
        const g = EARTH.CONFIG.geste;
        this.appuye = true;
        debutAppui = e.timeStamp || performance.now();
        xAppui = e.clientX; yAppui = e.clientY;
        this.x = e.clientX; this.y = e.clientY;
        profondeur = 0;

        const plan = planSous(e.clientX, e.clientY);
        this.survole = plan;
        bus.emet('geste', { type: 'appui' });
        reveiller();

        minuteurMaintien = setTimeout(() => {
          bus.emet('maintien-debut', { x: xAppui, y: yAppui, plan });
          cadenceMaintien = setInterval(() => {
            if (profondeur >= EARTH.CONFIG.geste.creuseMax) return;
            profondeur++;
            bus.emet('maintien', {
              x: this.x, y: this.y, plan, profondeur,
              duree: (performance.now() - debutAppui)
            });
          }, g.creuseCadence);
        }, g.seuilMaintien);
      });

      const relacher = e => {
        if (!this.appuye) return;
        this.appuye = false;
        clearTimeout(minuteurMaintien);
        clearInterval(cadenceMaintien);

        const t = (e && e.timeStamp) || performance.now();
        const duree = debutAppui ? t - debutAppui : 9999;
        const bouge = e ? Math.hypot(e.clientX - xAppui, e.clientY - yAppui) : 99;

        if (profondeur > 0) {
          bus.emet('maintien-fin', { duree, profondeur, plan: this.survole, x: this.x, y: this.y });
        } else if (duree < EARTH.CONFIG.geste.seuilBref && bouge < 14) {
          bus.emet('bref', { x: xAppui, y: yAppui, plan: this.survole });
        }
        profondeur = 0;
        reveiller();
      };

      surface.addEventListener('pointerup', relacher);
      surface.addEventListener('pointercancel', relacher);
      window.addEventListener('blur', () => relacher(null));

      /* le doigt ne survole pas : sur mobile, l'effleurement
         devient un simple contact glisse */
      surface.addEventListener('touchmove', e => {
        const t = e.touches[0];
        if (!t) return;
        const plan = planSous(t.clientX, t.clientY);
        if (plan !== this.survole) {
          if (this.survole) bus.emet('quitte', { plan: this.survole });
          this.survole = plan;
          if (plan) bus.emet('effleure', { plan, x: t.clientX, y: t.clientY });
        }
      }, { passive: true });

      reveiller();
      return this;
    }
  };

  EARTH.Gestes = Gestes;

})(window.EARTH = window.EARTH || {});
