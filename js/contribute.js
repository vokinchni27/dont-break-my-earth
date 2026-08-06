/* ============================================================
   EARTH — js/contribute.js
   ------------------------------------------------------------
   Un parcours guidé : ouvrir Google Earth, capturer, renseigner
   le lieu, puis déposer. L'image entre immédiatement dans l'œuvre
   locale ; sa version distante reste privée jusqu'à validation.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { clamp, lerp, Rand, dms } = EARTH.utils;
  const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

  const Contribution = {
    el: null,
    fichier: null,
    formeOuverteA: 0,
    envois: 0,
    retenues: [],

    init(el) {
      this.el = el;
      this.construire();
      this.ecouterDepot();
      this.charger();
      this._actualisation = setInterval(() => this.charger(), 45 * 60 * 1000);
      return this;
    },

    construire() {
      const invite = document.createElement('button');
      invite.className = 'invite';
      invite.type = 'button';
      invite.innerHTML = '<span class="invite-signe">+</span>' +
        '<span class="invite-texte">ajouter votre morceau de Terre</span>';
      invite.onclick = () => this.ouvrir();
      document.body.appendChild(invite);
      this.invite = invite;

      const champ = document.createElement('input');
      champ.type = 'file';
      champ.accept = TYPES.join(',');
      champ.className = 'invite-fichier';
      champ.onchange = () => {
        const fichier = champ.files && champ.files[0];
        if (fichier) this.selectionner(fichier);
        champ.value = '';
      };
      document.body.appendChild(champ);
      this.champ = champ;

      const voile = document.createElement('div');
      voile.className = 'depot-voile';
      voile.innerHTML = '<div class="depot-mot">DÉPOSE<br>TA TERRE</div>' +
        '<div class="depot-note">elle restera privée jusqu’à validation</div>';
      this.el.appendChild(voile);
      this.voile = voile;

      this.dialogue = this.creerDialogue();
      this.el.appendChild(this.dialogue);
    },

    creerDialogue() {
      const fond = document.createElement('div');
      fond.className = 'contrib-dialogue';
      fond.setAttribute('aria-hidden', 'true');
      fond.innerHTML = `
        <form class="contrib-forme" novalidate>
          <button type="button" class="contrib-fermer" aria-label="Fermer">fermer</button>
          <div class="contrib-entete">
            <span class="contrib-index">01—03</span>
            <h2>RAPPORTE<br>UN MORCEAU<br>DE TERRE</h2>
          </div>
          <section class="contrib-etape">
            <span class="contrib-index">01 · explorer</span>
            <p>Choisis un lieu dans Google Earth et réalise une capture d’écran.</p>
            <a class="contrib-google" target="_blank" rel="noopener noreferrer">ouvrir Google Earth ↗</a>
          </section>
          <section class="contrib-etape">
            <span class="contrib-index">02 · déposer</span>
            <button type="button" class="contrib-fichier">choisir la capture</button>
            <div class="contrib-apercu" hidden><img alt="Aperçu de la capture"><span></span></div>
          </section>
          <section class="contrib-etape contrib-champs">
            <span class="contrib-index">03 · situer</span>
            <div class="contrib-duo">
              <label>latitude<input name="latitude" inputmode="decimal" placeholder="48.8566 ou 48°51′24″N" required></label>
              <label>longitude<input name="longitude" inputmode="decimal" placeholder="2.3522 ou 2°21′08″E" required></label>
            </div>
            <label>lieu, si tu veux<input name="locationLabel" maxlength="120" placeholder="Paris, France"></label>
            <label>un mot, si tu veux<textarea name="comment" maxlength="1000" rows="3"></textarea></label>
            <label>signer, si tu veux<input name="authorName" maxlength="80"></label>
            <label class="contrib-piege" aria-hidden="true">site<input name="website" tabindex="-1" autocomplete="off"></label>
          </section>
          <p class="contrib-regle">JPG, PNG, WebP ou AVIF · 8 Mo maximum · jamais visible avant validation.</p>
          <button class="contrib-envoyer" type="submit" disabled>envoyer ce morceau</button>
          <div class="contrib-erreur" role="status"></div>
        </form>`;

      this.forme = fond.querySelector('form');
      this.apercu = fond.querySelector('.contrib-apercu');
      this.apercuImage = fond.querySelector('.contrib-apercu img');
      this.apercuNom = fond.querySelector('.contrib-apercu span');
      this.envoyerBouton = fond.querySelector('.contrib-envoyer');
      this.erreur = fond.querySelector('.contrib-erreur');
      fond.querySelector('.contrib-google').href = EARTH.CONFIG.collectif.googleEarth;
      fond.querySelector('.contrib-fichier').onclick = () => this.choisir();
      fond.querySelector('.contrib-fermer').onclick = () => this.fermer();
      fond.addEventListener('click', e => { if (e.target === fond) this.fermer(); });
      this.forme.addEventListener('submit', e => { e.preventDefault(); this.soumettre(); });
      window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && fond.classList.contains('visible')) this.fermer();
      });
      return fond;
    },

    ouvrir(fichier) {
      this.formeOuverteA = Date.now();
      this.dialogue.classList.add('visible');
      this.dialogue.setAttribute('aria-hidden', 'false');
      document.body.classList.add('contribution-ouverte');
      if (fichier) this.selectionner(fichier);
      setTimeout(() => this.dialogue.querySelector('.contrib-google').focus(), 50);
    },

    fermer() {
      if (this.envoyerBouton.disabled && this.envoyerBouton.dataset.encours === '1') return;
      this.dialogue.classList.remove('visible');
      this.dialogue.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('contribution-ouverte');
    },

    choisir() { this.champ.click(); },

    selectionner(fichier) {
      const cfg = EARTH.CONFIG.collectif;
      if (!TYPES.includes(fichier.type)) return this.signaler('format non autorisé');
      if (fichier.size > cfg.tailleMax) {
        return this.signaler('trop lourde — ' + Math.ceil(fichier.size / 1048576) + ' Mo');
      }
      if (!this.dialogue.classList.contains('visible')) this.ouvrir();
      if (this.fichierUrl) URL.revokeObjectURL(this.fichierUrl);
      this.fichier = fichier;
      this.fichierUrl = URL.createObjectURL(fichier);
      this.apercuImage.src = this.fichierUrl;
      this.apercuNom.textContent = `${fichier.name} · ${Math.round(fichier.size / 1024)} ko`;
      this.apercu.hidden = false;
      this.envoyerBouton.disabled = false;
      this.erreur.textContent = '';
    },

    ecouterDepot() {
      let compteur = 0;
      const stop = e => { e.preventDefault(); e.stopPropagation(); };
      window.addEventListener('dragenter', e => { stop(e); compteur++; document.body.classList.add('depot'); });
      window.addEventListener('dragover', stop);
      window.addEventListener('dragleave', e => {
        stop(e);
        if (--compteur <= 0) { compteur = 0; document.body.classList.remove('depot'); }
      });
      window.addEventListener('drop', e => {
        stop(e);
        compteur = 0;
        document.body.classList.remove('depot');
        const fichier = Array.from(e.dataTransfer.files || []).find(f => TYPES.includes(f.type));
        if (fichier) this.ouvrir(fichier);
        else this.dire('ce n’est pas une image autorisée');
      });
    },

    async soumettre() {
      if (!this.fichier) return this.signaler('choisis d’abord une capture');
      const data = new FormData(this.forme);
      const latitude = coordonnee(data.get('latitude'), 'lat');
      const longitude = coordonnee(data.get('longitude'), 'lon');
      if (latitude == null || longitude == null) {
        return this.signaler('coordonnées illisibles ou hors limites');
      }

      this.envoyerBouton.disabled = true;
      this.envoyerBouton.dataset.encours = '1';
      this.erreur.textContent = 'préparation…';
      EARTH.Director.suspendre(14000);

      const fichier = this.fichier;
      const dimensions = await mesurer(fichier);
      this.poserLocale(fichier, dimensions);

      try {
        const prepare = await EARTH.Supa.api('/api/submissions', {
          method: 'POST',
          body: {
            filename: fichier.name,
            mimeType: fichier.type,
            sizeBytes: fichier.size,
            width: dimensions.width,
            height: dimensions.height,
            latitude,
            longitude,
            locationLabel: valeur(data, 'locationLabel'),
            comment: valeur(data, 'comment'),
            authorName: valeur(data, 'authorName'),
            website: valeur(data, 'website') || '',
            formStartedAt: this.formeOuverteA
          }
        });
        await EARTH.Supa.televerserSigne(prepare.signedUrl, fichier, p => {
          this.erreur.textContent = 'envoi ' + Math.round(p * 100) + '%';
        });
        await EARTH.Supa.api('/api/submissions', {
          method: 'PATCH',
          body: { submissionId: prepare.submissionId, uploadToken: prepare.uploadToken }
        });
        this.envois++;
        this.dire('reçue — elle attend d’être validée');
        this.forme.reset();
        this.fichier = null;
        this.apercu.hidden = true;
        this.fermerForcee();
      } catch (e) {
        console.warn('[EARTH] contribution', e);
        this.signaler(e.message || 'envoi impossible — elle reste ici');
        this.envoyerBouton.disabled = false;
      } finally {
        delete this.envoyerBouton.dataset.encours;
      }
    },

    fermerForcee() {
      delete this.envoyerBouton.dataset.encours;
      this.dialogue.classList.remove('visible');
      this.dialogue.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('contribution-ouverte');
    },

    poserLocale(fichier, dimensions) {
      const url = this.fichierUrl || URL.createObjectURL(fichier);
      const item = {
        src: url,
        path: 'depot/' + fichier.name,
        place: 'TOI',
        name: fichier.name.replace(/\.[^.]+$/, ''),
        type: 'image',
        contribuee: true,
        largeur: dimensions.width,
        hauteur: dimensions.height
      };
      const rand = Rand();
      const plan = EARTH.Stage.poser(item, {
        x: rand.f(0.34, 0.66),
        y: rand.f(0.34, 0.66),
        w: lerp(EARTH.CONFIG.echelle.min, EARTH.CONFIG.echelle.max, 0.62),
        z: 300,
        libre: true
      }, 'eclosion', 0);
      if (plan) plan.el.classList.add('contribuee', 'envoyee');
    },

    async charger() {
      if (!/^https?:$/.test(location.protocol)) return 0;
      try {
        const data = await EARTH.Supa.api('/api/submissions');
        const lignes = Array.isArray(data.submissions) ? data.submissions : [];
        EARTH.Archive.tous = EARTH.Archive.tous.filter(item => !item.collective);
        this.retenues = lignes.map(l => ({
          collectiveId: l.id,
          src: l.image_url,
          path: l.storage_path,
          place: l.location_label || 'COLLECTIF',
          name: (l.original_filename || '').replace(/\.[^.]+$/, ''),
          type: 'image',
          collective: true,
          auteur: l.author_name || null,
          commentaire: l.comment || null,
          coord: l.latitude == null ? null : {
            lat: Number(l.latitude).toFixed(6),
            lon: Number(l.longitude).toFixed(6),
            latDec: Number(l.latitude),
            lonDec: Number(l.longitude),
            camera: '—', sol: '—', echelle: '—'
          }
        }));
        if (this.retenues.length) {
          EARTH.Archive.tous = EARTH.Archive.tous.concat(this.retenues);
          EARTH.Archive.appliquerFiltres(EARTH.CONFIG);
          EARTH.HUD.majEtat();
        }
        return this.retenues.length;
      } catch (e) {
        console.warn('[EARTH] archive collective injoignable', e.message);
        return 0;
      }
    },

    signaler(message) { this.erreur.textContent = message; },

    dire(message) {
      let d = document.getElementById('contrib-mot');
      if (!d) {
        d = document.createElement('div');
        d.id = 'contrib-mot';
        document.body.appendChild(d);
      }
      d.textContent = message;
      d.classList.add('visible');
      clearTimeout(this._mot);
      this._mot = setTimeout(() => d.classList.remove('visible'), 5200);
    }
  };

  function valeur(data, cle) {
    const brut = data.get(cle);
    const propre = typeof brut === 'string' ? brut.trim() : '';
    return propre || null;
  }

  function coordonnee(brut, axe) {
    if (typeof brut !== 'string') return null;
    const normalise = brut.trim().replace(',', '.').replace(/[′’]/g, "'").replace(/[″]/g, '"');
    let n = Number(normalise);
    if (!Number.isFinite(n)) n = dms(normalise);
    const limite = axe === 'lat' ? 90 : 180;
    return Number.isFinite(n) && Math.abs(n) <= limite ? Math.round(n * 1e6) / 1e6 : null;
  }

  function mesurer(fichier) {
    return new Promise(resolve => {
      const image = new Image();
      const url = URL.createObjectURL(fichier);
      image.onload = () => {
        resolve({ width: image.naturalWidth || null, height: image.naturalHeight || null });
        URL.revokeObjectURL(url);
      };
      image.onerror = () => { URL.revokeObjectURL(url); resolve({ width: null, height: null }); };
      image.src = url;
    });
  }

  Contribution.coordonnee = coordonnee;
  EARTH.Contribution = Contribution;
})(window.EARTH = window.EARTH || {});
