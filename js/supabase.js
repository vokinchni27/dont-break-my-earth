/* ============================================================
   EARTH — js/supabase.js
   ------------------------------------------------------------
   Un client minuscule, ecrit a la main.

   Pas de SDK : l'API REST de Supabase est du simple HTTP, et le
   projet doit rester ouvrable en double-clic, sans build, sans
   dependance. Une centaine de lignes suffisent.

   La cle publique est faite pour vivre dans la page : ce qui
   protege l'archive, ce sont les regles RLS (voir supabase/earth.sql),
   pas le secret de la cle.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const Supa = {
    get cfg() { return EARTH.CONFIG.collectif; },
    get pret() { return !!(this.cfg.actif && this.cfg.url && this.cfg.cle); },
    session: null,

    entetes(extra) {
      const jeton = (this.session && this.session.access_token) || this.cfg.cle;
      return Object.assign({
        apikey: this.cfg.cle,
        Authorization: 'Bearer ' + jeton
      }, extra || {});
    },

    /* --- table ---------------------------------------------- */

    async lire(table, requete) {
      const url = `${this.cfg.url}/rest/v1/${table}?${requete || ''}`;
      const res = await fetch(url, { headers: this.entetes() });
      if (!res.ok) throw new Error('lecture ' + res.status + ' ' + await res.text());
      return res.json();
    },

    async inserer(table, ligne) {
      const res = await fetch(`${this.cfg.url}/rest/v1/${table}`, {
        method: 'POST',
        headers: this.entetes({
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }),
        body: JSON.stringify(ligne)
      });
      if (!res.ok) throw new Error('insertion ' + res.status + ' ' + await res.text());
      const data = await res.json();
      return data[0];
    },

    async modifier(table, filtre, champs) {
      const res = await fetch(`${this.cfg.url}/rest/v1/${table}?${filtre}`, {
        method: 'PATCH',
        headers: this.entetes({
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }),
        body: JSON.stringify(champs)
      });
      if (!res.ok) throw new Error('modification ' + res.status + ' ' + await res.text());
      return res.json();
    },

    /* --- stockage ------------------------------------------- */

    async televerser(chemin, fichier, surProgression) {
      const url = `${this.cfg.url}/storage/v1/object/${this.cfg.bucket}/${chemin}`;

      /* XHR plutot que fetch : c'est le seul moyen d'avoir une
         progression, et le depot d'une capture merite un retour */
      return new Promise((resoudre, rejeter) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader('apikey', this.cfg.cle);
        xhr.setRequestHeader('Authorization', 'Bearer ' + this.cfg.cle);
        xhr.setRequestHeader('x-upsert', 'false');
        if (fichier.type) xhr.setRequestHeader('Content-Type', fichier.type);
        xhr.upload.onprogress = e => {
          if (e.lengthComputable && surProgression) surProgression(e.loaded / e.total);
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resoudre(chemin);
          else rejeter(new Error('televersement ' + xhr.status + ' ' + xhr.responseText));
        };
        xhr.onerror = () => rejeter(new Error('televersement : reseau injoignable'));
        xhr.send(fichier);
      });
    },

    urlPublique(chemin) {
      return `${this.cfg.url}/storage/v1/object/public/${this.cfg.bucket}/${chemin}`;
    },

    async effacer(chemin) {
      const res = await fetch(
        `${this.cfg.url}/storage/v1/object/${this.cfg.bucket}/${chemin}`,
        { method: 'DELETE', headers: this.entetes() }
      );
      return res.ok;
    },

    /* --- authentification (page de moderation seulement) ----- */

    async lienMagique(email, redirection) {
      const res = await fetch(`${this.cfg.url}/auth/v1/otp`, {
        method: 'POST',
        headers: { apikey: this.cfg.cle, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, create_user: false, options: { email_redirect_to: redirection } })
      });
      if (!res.ok) throw new Error(await res.text());
      return true;
    },

    /* le lien magique renvoie les jetons dans le fragment d'URL */
    reprendreSession() {
      const brut = localStorage.getItem('earth_session');
      if (brut) {
        try { this.session = JSON.parse(brut); } catch (e) { /* session illisible */ }
      }
      if (location.hash.includes('access_token')) {
        const p = new URLSearchParams(location.hash.slice(1));
        const jeton = p.get('access_token');
        if (jeton) {
          this.session = { access_token: jeton, refresh_token: p.get('refresh_token') };
          localStorage.setItem('earth_session', JSON.stringify(this.session));
          history.replaceState(null, '', location.pathname);
        }
      }
      return this.session;
    },

    async utilisateur() {
      if (!this.session) return null;
      const res = await fetch(`${this.cfg.url}/auth/v1/user`, { headers: this.entetes() });
      if (!res.ok) { this.deconnecter(); return null; }
      return res.json();
    },

    deconnecter() {
      this.session = null;
      localStorage.removeItem('earth_session');
    }
  };

  EARTH.Supa = Supa;

})(window.EARTH = window.EARTH || {});
