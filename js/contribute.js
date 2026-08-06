/* ============================================================
   EARTH — js/contribute.js
   ------------------------------------------------------------
   Un parcours guidé : ouvrir Google Earth, capturer, renseigner
   le lieu, puis déposer.

   RÈGLE ABSOLUE : une capture déposée n'apparaît NULLE PART avant
   d'avoir été validée — pas même à celui qui vient de l'envoyer.
   Elle part dans un bucket privé, en statut « pending », et n'entre
   dans l'œuvre qu'une fois passée en « approved ».
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
      invite.innerHTML = `<span class="invite-signe">${EARTH.T('contribution.inviteSigne')}</span>` +
        `<span class="invite-texte">${EARTH.T('contribution.invite')}</span>`;
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
      voile.innerHTML = `<div class="depot-mot">${EARTH.T('contribution.voileTitre')}</div>` +
        `<div class="depot-note">${EARTH.T('contribution.voileNote')}</div>`;
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
          <button type="button" class="contrib-fermer" aria-label="${EARTH.T('contribution.fermerAria')}">${EARTH.T('contribution.fermer')}</button>
          <div class="contrib-entete">
            <span class="contrib-index">${EARTH.T('contribution.formeIndex')}</span>
            <h2>${EARTH.T('contribution.formeTitre')}</h2>
          </div>
          <section class="contrib-etape">
            <span class="contrib-index">${EARTH.T('contribution.etape1Index')}</span>
            <p>${EARTH.T('contribution.etape1Texte')}</p>
            <a class="contrib-google" target="_blank" rel="noopener noreferrer">${EARTH.T('contribution.etape1Lien')}</a>
          </section>
          <section class="contrib-etape">
            <span class="contrib-index">${EARTH.T('contribution.etape2Index')}</span>
            <button type="button" class="contrib-fichier">${EARTH.T('contribution.etape2Bouton')}</button>
            <div class="contrib-apercu" hidden><img alt="${EARTH.T('contribution.apercuAria')}"><span></span></div>
          </section>
          <section class="contrib-etape contrib-champs">
            <span class="contrib-index">${EARTH.T('contribution.etape3Index')}</span>
            <div class="contrib-duo">
              <label>${EARTH.T('contribution.champLatitude')}<input name="latitude" inputmode="decimal" placeholder="${EARTH.T('contribution.placeholderLatitude')}" required></label>
              <label>${EARTH.T('contribution.champLongitude')}<input name="longitude" inputmode="decimal" placeholder="${EARTH.T('contribution.placeholderLongitude')}" required></label>
            </div>
            <label>${EARTH.T('contribution.champLieu')}<input name="locationLabel" maxlength="120" placeholder="${EARTH.T('contribution.placeholderLieu')}"></label>
            <label>${EARTH.T('contribution.champMot')}<textarea name="comment" maxlength="1000" rows="3"></textarea></label>
            <label>${EARTH.T('contribution.champSignature')}<input name="authorName" maxlength="80"></label>
            <label class="contrib-piege" aria-hidden="true">site<input name="website" tabindex="-1" autocomplete="off"></label>
          </section>
          <p class="contrib-regle">${EARTH.T('contribution.regle')}</p>
          <button class="contrib-envoyer" type="submit" disabled>${EARTH.T('contribution.envoyer')}</button>
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
      if (!TYPES.includes(fichier.type)) return this.signaler(EARTH.T('contribution.formatRefuse'));
      if (fichier.size > cfg.tailleMax) {
        return this.signaler(EARTH.T('contribution.tropLourde') + ' — ' + Math.ceil(fichier.size / 1048576) + ' Mo');
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
        else this.dire(EARTH.T('contribution.pasUneImage'));
      });
    },

    async soumettre() {
      if (!this.fichier) return this.signaler(EARTH.T('contribution.choisisDabord'));
      const data = new FormData(this.forme);
      const latitude = coordonnee(data.get('latitude'), 'lat');
      const longitude = coordonnee(data.get('longitude'), 'lon');
      if (latitude == null || longitude == null) {
        return this.signaler(EARTH.T('contribution.coordonneesIllisibles'));
      }

      this.envoyerBouton.disabled = true;
      this.envoyerBouton.dataset.encours = '1';
      this.erreur.textContent = EARTH.T('contribution.preparation');
      EARTH.Director.suspendre(14000);

      const fichier = this.fichier;
      const dimensions = await mesurer(fichier);

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
          this.erreur.textContent = EARTH.T('contribution.envoiEnCours') + ' ' + Math.round(p * 100) + '%';
        });
        await EARTH.Supa.api('/api/submissions', {
          method: 'PATCH',
          body: { submissionId: prepare.submissionId, uploadToken: prepare.uploadToken }
        });
        this.envois++;
        this.dire(EARTH.T('contribution.recue'));
        this.forme.reset();
        this.fichier = null;
        this.apercu.hidden = true;
        this.fermerForcee();
      } catch (e) {
        console.warn('[EARTH] contribution', e);
        this.signaler(e.message || EARTH.T('contribution.envoiImpossible'));
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
        console.warn('[EARTH] ' + EARTH.T('contribution.archiveInjoignable'), e.message);
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
