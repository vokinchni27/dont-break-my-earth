/* ============================================================
   EARTH — js/utils.js
   Hasard reproductible + petites aides. Rien d'artistique ici.
   ============================================================ */

(function (EARTH) {
  'use strict';

  /* mulberry32 : generateur pseudo-aleatoire deterministe.
     Meme graine = meme composition, au pixel pres. C'est ce qui
     permet de rejouer une image qui t'a plu (touche R). */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function Rand(graine) {
    const seed = (graine == null ? Math.floor(Math.random() * 1e9) : graine) >>> 0;
    const next = mulberry32(seed);
    return {
      graine: seed,
      next,
      f(a, b) { return a + next() * (b - a); },
      i(a, b) { return Math.floor(a + next() * (b - a + 1)); },
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      chance(p) { return next() < p; },
      signe() { return next() < 0.5 ? -1 : 1; },
      /* distribution biaisee vers le bas : beaucoup de petit, un peu de grand */
      biais(a, b, force) {
        return a + Math.pow(next(), force == null ? 2 : force) * (b - a);
      },
      shuffle(arr) {
        const out = arr.slice();
        for (let i = out.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
      }
    };
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const vmin = () => Math.min(window.innerWidth, window.innerHeight);
  const mobile = () => window.innerWidth < 720 || matchMedia('(pointer: coarse)').matches;

  /* acces par chemin : get(CONFIG,'rythme.tenue') — sert au panneau */
  function get(obj, chemin) {
    return chemin.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }
  function set(obj, chemin, valeur) {
    const ks = chemin.split('.');
    const last = ks.pop();
    const cible = ks.reduce((o, k) => o[k], obj);
    cible[last] = valeur;
  }

  /* un bus d'evenements minuscule : c'est par la que les gestes
     parlent aux interactions, sans que personne ne se connaisse */
  function Bus() {
    const abonnes = {};
    return {
      sur(nom, fn) { (abonnes[nom] = abonnes[nom] || []).push(fn); return this; },
      emet(nom, donnee) {
        (abonnes[nom] || []).forEach(fn => {
          try { fn(donnee); } catch (e) { console.error('[EARTH] ' + nom, e); }
        });
      }
    };
  }

  EARTH.utils = { Rand, clamp, lerp, get, set, vmin, mobile, Bus };
  EARTH.bus = Bus();

})(window.EARTH = window.EARTH || {});
