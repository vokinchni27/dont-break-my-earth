/* ============================================================
   EARTH — js/loader.js
   ------------------------------------------------------------
   L'archive vivante.
   Lit images/manifest.json (genere par tools/index-images.mjs),
   avec repli sur images/manifest.js — ce qui permet d'ouvrir
   index.html en double-clic, sans serveur.

   Elle sait aussi ce que les coordonnees permettent : trouver
   les voisins d'une image sur la Terre, pas dans un dossier.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const Archive = {
    tous: [],
    liste: [],
    lieux: [],
    etendue: null,
    sac: [],
    curseur: 0,
    erreur: null,

    async charger(cfg) {
      const brut = await lireManifeste(cfg.archive.manifest);
      this.tous = brut.items || [];
      this.lieux = brut.places || [];
      this.etendue = brut.etendue || null;
      this.appliquerFiltres(cfg);
      this.precharger(4);
      return this.liste.length;
    },

    appliquerFiltres(cfg) {
      const a = cfg.archive;
      this.liste = this.tous.filter(item => {
        if (!a.includeVideos && item.type === 'video') return false;
        if (a.places && a.places.length &&
            !a.places.some(p => item.place === p || item.place.startsWith(p + '/'))) return false;
        return true;
      });
      this.sac = [];
      this.curseur = 0;
    },

    get taille() { return this.liste.length; },
    get situees() { return this.liste.filter(i => i.coord && i.coord.latDec != null); },

    /* le sac est pondere : les videos, rares, sont sur-representees
       pour qu'elles ne se perdent pas dans une archive d'images */
    remplirSac(rand) {
      const p = Math.max(1, Math.round(EARTH.CONFIG.archive.poidsVideos));
      const grains = [];
      this.liste.forEach(item => {
        const n = item.type === 'video' ? p : 1;
        for (let i = 0; i < n; i++) grains.push(item);
      });
      this.sac = rand.shuffle(grains);
    },

    suivante(rand, ordre) {
      if (!this.liste.length) return null;
      if (ordre === 'suite') return this.liste[this.curseur++ % this.liste.length];
      if (ordre === 'hasard') return rand.pick(this.liste);
      if (!this.sac.length) this.remplirSac(rand);
      return this.sac.pop();
    },

    lot(n, rand, ordre) {
      const out = [];
      const vus = new Set();
      let gardeFou = n * 8;
      while (out.length < n && gardeFou-- > 0) {
        const item = this.suivante(rand, ordre);
        if (!item) break;
        if (vus.has(item.src) && this.liste.length > n) continue;
        vus.add(item.src);
        out.push(item);
      }
      return out;
    },

    /* --- ce que les coordonnees permettent ------------------ */

    /* les images les plus proches sur la Terre. Une image en appelle
       d'autres non pas au hasard, mais parce qu'elles se touchent. */
    voisines(item, n) {
      if (!item || !item.coord || item.coord.latDec == null) return this.aleatoires(n);
      const ref = item.coord;
      const autres = this.situees.filter(i => i.src !== item.src);
      autres.sort((a, b) => distance(ref, a.coord) - distance(ref, b.coord));
      const proches = autres.slice(0, Math.max(1, n));
      return proches.length ? proches : this.aleatoires(n);
    },

    /* meme bande de latitude : un parallele, pas un dossier */
    memeLatitude(item, tolerance, n) {
      if (!item || !item.coord || item.coord.latDec == null) return this.aleatoires(n);
      const lat = item.coord.latDec;
      const bande = this.situees.filter(i =>
        i.src !== item.src && Math.abs(i.coord.latDec - lat) < (tolerance || 8));
      return bande.length ? bande.slice(0, n) : this.voisines(item, n);
    },

    /* le meme lieu : creuser, c'est rester au meme endroit */
    memeLieu(item, n, rand) {
      if (!item) return this.aleatoires(n);
      const racine = String(item.place).split('/')[0];
      const memes = this.liste.filter(i => i.src !== item.src && String(i.place).split('/')[0] === racine);
      if (!memes.length) return this.aleatoires(n);
      const melange = rand ? rand.shuffle(memes) : memes;
      const out = [];
      for (let i = 0; i < n; i++) out.push(melange[i % melange.length]);
      return out;
    },

    aleatoires(n) {
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(this.liste[Math.floor(Math.random() * this.liste.length)]);
      }
      return out.filter(Boolean);
    },

    precharger(n) {
      this.liste.slice(0, n).forEach(item => {
        if (item.type === 'image') { const im = new Image(); im.src = item.src; }
      });
    }
  };

  /* distance angulaire suffisante pour classer des voisins */
  function distance(a, b) {
    if (!b || b.latDec == null) return Infinity;
    const dLat = a.latDec - b.latDec;
    let dLon = Math.abs(a.lonDec - b.lonDec);
    if (dLon > 180) dLon = 360 - dLon;                    // la Terre se referme
    const cos = Math.cos((a.latDec * Math.PI) / 180);
    return Math.hypot(dLat, dLon * cos);
  }

  async function lireManifeste(url) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.items) return data;
      }
    } catch (e) { /* file:// : fetch est bloque, c'est normal */ }

    if (window.EARTH_MANIFEST && window.EARTH_MANIFEST.items) return window.EARTH_MANIFEST;

    Archive.erreur = 'manifeste introuvable — lance : node tools/index-images.mjs';
    console.error('[EARTH] ' + Archive.erreur);
    return { items: [], places: [] };
  }

  Archive.distance = distance;
  EARTH.Archive = Archive;

})(window.EARTH = window.EARTH || {});
