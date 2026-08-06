/* ============================================================
   EARTH — js/supabase.js
   ------------------------------------------------------------
   La passerelle navigateur. Les opérations sensibles passent par
   les fonctions TypeScript de /api ; seul Supabase Auth reçoit
   directement l'email et le mot de passe de l'administratrice.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const CLE_SESSION = 'earth_admin_session';

  const Supa = {
    get cfg() { return EARTH.CONFIG.collectif; },
    get pret() { return !!(this.cfg.actif && this.cfg.url && this.cfg.cle); },
    session: null,
    configurationChargee: false,

    async initialiser() {
      if (this.configurationChargee) return this.pret;
      this.configurationChargee = true;
      if (!/^https?:$/.test(location.protocol)) return this.pret;
      try {
        const res = await fetch('/api/config', { headers: { Accept: 'application/json' } });
        if (!res.ok) return false;
        const data = await res.json();
        if (data && data.enabled) {
          this.cfg.url = data.supabaseUrl || '';
          this.cfg.cle = data.supabaseAnonKey || '';
          this.cfg.tailleMax = data.maxUploadBytes || this.cfg.tailleMax;
          this.cfg.googleEarth = data.googleEarthUrl || this.cfg.googleEarth;
        }
      } catch (e) {
        console.warn('[EARTH] configuration collective indisponible', e.message);
      }
      return this.pret;
    },

    async api(chemin, options) {
      const o = options || {};
      const entetes = Object.assign({ Accept: 'application/json' }, o.headers || {});
      if (o.body != null && typeof o.body !== 'string') {
        entetes['Content-Type'] = 'application/json';
        o.body = JSON.stringify(o.body);
      }
      const res = await fetch(chemin, Object.assign({}, o, { headers: entetes }));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `requête ${res.status}`);
      return data;
    },

    async apiAdmin(chemin, options) {
      await this.rafraichirSession();
      if (!this.session || !this.session.access_token) throw new Error('connexion requise');
      const o = options || {};
      o.headers = Object.assign({}, o.headers || {}, {
        Authorization: 'Bearer ' + this.session.access_token
      });
      return this.api(chemin, o);
    },

    /* --- dépôt direct vers le bucket privé ----------------- */

    televerserSigne(url, fichier, surProgression) {
      return new Promise((resoudre, rejeter) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url);
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.upload.onprogress = e => {
          if (e.lengthComputable && surProgression) surProgression(e.loaded / e.total);
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resoudre(true);
          else rejeter(new Error('téléversement ' + xhr.status));
        };
        xhr.onerror = () => rejeter(new Error('réseau injoignable'));
        /* Le endpoint signé Supabase attend le même multipart que
           uploadToSignedUrl(). Le navigateur pose lui-même la boundary. */
        const corps = new FormData();
        corps.append('cacheControl', '3600');
        corps.append('', fichier);
        xhr.send(corps);
      });
    },

    /* --- authentification email + mot de passe ------------- */

    async connecter(email, motDePasse) {
      if (!this.pret) throw new Error('Supabase n’est pas configuré');
      const res = await fetch(`${this.cfg.url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: this.cfg.cle, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: motDePasse })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.access_token) throw new Error(data.error_description || data.msg || 'connexion refusée');
      this.sauverSession(data);
      return data.user;
    },

    reprendreSession() {
      const brut = localStorage.getItem(CLE_SESSION);
      if (!brut) return null;
      try { this.session = JSON.parse(brut); } catch (e) { this.session = null; }
      return this.session;
    },

    sauverSession(data) {
      const expireDans = Number(data.expires_in || 3600);
      this.session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at || Math.floor(Date.now() / 1000) + expireDans,
        user: data.user || null
      };
      localStorage.setItem(CLE_SESSION, JSON.stringify(this.session));
    },

    async rafraichirSession() {
      if (!this.session) this.reprendreSession();
      if (!this.session) return null;
      const encoreValide = Number(this.session.expires_at || 0) * 1000 > Date.now() + 30000;
      if (encoreValide) return this.session;
      if (!this.session.refresh_token) { this.deconnecter(); return null; }

      const res = await fetch(`${this.cfg.url}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { apikey: this.cfg.cle, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.session.refresh_token })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.access_token) { this.deconnecter(); return null; }
      this.sauverSession(data);
      return this.session;
    },

    async utilisateur() {
      await this.rafraichirSession();
      if (!this.session) return null;
      const res = await fetch(`${this.cfg.url}/auth/v1/user`, {
        headers: { apikey: this.cfg.cle, Authorization: 'Bearer ' + this.session.access_token }
      });
      if (!res.ok) { this.deconnecter(); return null; }
      return res.json();
    },

    deconnecter() {
      this.session = null;
      localStorage.removeItem(CLE_SESSION);
    }
  };

  EARTH.Supa = Supa;
})(window.EARTH = window.EARTH || {});
