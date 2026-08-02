/* ============================================================
   EARTH — js/contribute.js
   ------------------------------------------------------------
   L'archive appartient a ceux qui regardent.

   Le visiteur va sur Google Earth, trouve un endroit, capture,
   et depose le fichier sur la page. Trois choses se passent, dans
   cet ordre, et l'ordre compte :

     1. l'image entre IMMEDIATEMENT dans la composition. Le
        contributeur voit sa Terre vivre avec les autres avant
        meme que le reseau ait repondu.
     2. le fichier part vers l'archive collective, en silence.
     3. il attend d'etre retenu. Personne ne se publie soi-meme.

   Si l'archive collective n'est pas configuree ou injoignable,
   l'image reste quand meme dans la composition, en local. Le
   geste n'est jamais perdu.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const { clamp, lerp, Rand } = EARTH.utils;

  const Contribution = {
    el: null,
    signature: localStorage.getItem('earth_signature') || '',
    envois: 0,
    retenues: [],

    init(el) {
      this.el = el;
      this.construire();
      this.ecouterDepot();
      this.charger();
      return this;
    },

    /* --- l'invitation, discrete et permanente --------------- */
    construire() {
      const invite = document.createElement('button');
      invite.className = 'invite';
      invite.innerHTML =
        '<span class="invite-signe">+</span>' +
        '<span class="invite-texte">ajouter une capture</span>';
      invite.title = 'va sur Google Earth, capture, depose ici';
      invite.onclick = () => this.choisir();
      document.body.appendChild(invite);
      this.invite = invite;

      const champ = document.createElement('input');
      champ.type = 'file';
      champ.accept = 'image/*';
      champ.multiple = true;
      champ.className = 'invite-fichier';
      champ.onchange = () => {
        this.accueillir(Array.from(champ.files), window.innerWidth / 2, window.innerHeight / 2);
        champ.value = '';
      };
      document.body.appendChild(champ);
      this.champ = champ;

      const voile = document.createElement('div');
      voile.className = 'depot-voile';
      voile.innerHTML =
        '<div class="depot-mot">DEPOSE<br>TA TERRE</div>' +
        '<div class="depot-note">elle rejoindra l archive si elle est retenue</div>';
      this.el.appendChild(voile);
      this.voile = voile;
    },

    choisir() { this.champ.click(); },

    /* --- glisser-deposer ------------------------------------ */
    ecouterDepot() {
      let compteur = 0;

      const stop = e => { e.preventDefault(); e.stopPropagation(); };

      window.addEventListener('dragenter', e => {
        stop(e);
        compteur++;
        document.body.classList.add('depot');
      });
      window.addEventListener('dragover', stop);
      window.addEventListener('dragleave', e => {
        stop(e);
        if (--compteur <= 0) { compteur = 0; document.body.classList.remove('depot'); }
      });
      window.addEventListener('drop', e => {
        stop(e);
        compteur = 0;
        document.body.classList.remove('depot');
        const fichiers = Array.from(e.dataTransfer.files || [])
          .filter(f => /^image\//.test(f.type));
        if (fichiers.length) this.accueillir(fichiers, e.clientX, e.clientY);
        else this.dire('ce n est pas une image');
      });
    },

    /* --- accueillir une capture ----------------------------- */
    accueillir(fichiers, x, y) {
      const cfg = EARTH.CONFIG.collectif;
      EARTH.Director.suspendre(14000);

      fichiers.slice(0, 8).forEach((fichier, i) => {
        if (fichier.size > cfg.tailleMax) {
          this.dire('trop lourde — ' + Math.round(fichier.size / 1048576) + ' Mo');
          return;
        }
        setTimeout(() => this.poser(fichier, x, y), i * 260);
      });
    },

    poser(fichier, x, y) {
      const rand = Rand();
      const url = URL.createObjectURL(fichier);
      const item = {
        src: url,
        path: 'depot/' + fichier.name,
        place: 'TOI',
        name: fichier.name.replace(/\.[^.]+$/, ''),
        type: 'image',
        contribuee: true
      };

      /* elle arrive grande : c'est un evenement */
      const plan = EARTH.Stage.poser(item, {
        x: clamp((x || window.innerWidth / 2) / window.innerWidth, 0.18, 0.82),
        y: clamp((y || window.innerHeight / 2) / window.innerHeight, 0.18, 0.82),
        w: lerp(EARTH.CONFIG.echelle.min, EARTH.CONFIG.echelle.max, 0.62),
        z: 300,
        libre: true
      }, 'eclosion', 0);

      if (plan) plan.el.classList.add('contribuee');

      /* on mesure pendant que le reseau travaille */
      const im = new Image();
      im.onload = () => { item.largeur = im.naturalWidth; item.hauteur = im.naturalHeight; };
      im.src = url;

      this.envoyer(fichier, item, plan);
    },

    /* --- l'envoi -------------------------------------------- */
    async envoyer(fichier, item, plan) {
      const Supa = EARTH.Supa;
      if (!Supa.pret) {
        this.dire('gardee ici seulement — archive collective non configuree');
        return;
      }

      const ext = (fichier.name.match(/\.[a-z0-9]+$/i) || ['.jpg'])[0].toLowerCase();
      const cle = `${EARTH.CONFIG.collectif.dossier}/${Date.now()}-${jeton()}${ext}`;

      this.dire('envoi…', true);

      /* le fichier part TOUT DE SUITE : la question de la signature
         ne doit pas retenir le reseau pendant qu'on hesite */
      const montee = Supa.televerser(cle, fichier,
        p => this.dire('envoi ' + Math.round(p * 100) + '%', true));
      montee.catch(() => {});                 // gerée plus bas, jamais orpheline
      const signature = await this.demanderSignature();

      try {
        await montee;
        await Supa.inserer('earth_contributions', {
          chemin: cle,
          auteur: signature || null,
          largeur: item.largeur || null,
          hauteur: item.hauteur || null,
          poids: fichier.size
        });
        this.envois++;
        if (plan) plan.el.classList.add('envoyee');
        this.dire('recue — elle attend d etre retenue');
      } catch (e) {
        console.warn('[EARTH] contribution', e);
        this.dire('envoi impossible — elle reste ici');
      }
    },

    /* une seule question, facultative, qui s'efface toute seule */
    demanderSignature() {
      if (this.signature) return Promise.resolve(this.signature);
      return new Promise(resoudre => {
        const bloc = document.createElement('div');
        bloc.className = 'signature';
        bloc.innerHTML = '<label>signer&nbsp;?</label>';
        const champ = document.createElement('input');
        champ.type = 'text';
        champ.maxLength = 40;
        champ.placeholder = 'facultatif';
        bloc.appendChild(champ);
        document.body.appendChild(bloc);
        requestAnimationFrame(() => { bloc.classList.add('visible'); champ.focus(); });

        let fini = false;
        const fermer = valeur => {
          if (fini) return;
          fini = true;
          clearTimeout(minuteur);
          if (valeur) {
            this.signature = valeur;
            localStorage.setItem('earth_signature', valeur);
          }
          bloc.classList.remove('visible');
          setTimeout(() => bloc.remove(), 500);
          resoudre(valeur || '');
        };

        champ.addEventListener('keydown', e => {
          if (e.key === 'Enter') fermer(champ.value.trim());
          if (e.key === 'Escape') fermer('');
          e.stopPropagation();
        });
        const minuteur = setTimeout(() => fermer(champ.value.trim()), 9000);
      });
    },

    /* --- ce que l'archive collective a deja retenu ----------- */
    async charger() {
      const Supa = EARTH.Supa;
      if (!Supa.pret) return 0;
      try {
        const lignes = await Supa.lire(
          'earth_contributions',
          'statut=eq.retenue&select=chemin,lieu,lat,lon,lat_dec,lon_dec,auteur&order=cree_le.desc&limit=400'
        );
        this.retenues = lignes.map(l => ({
          src: Supa.urlPublique(l.chemin),
          path: l.chemin,
          place: l.lieu || 'COLLECTIF',
          name: (l.chemin.split('/').pop() || '').replace(/\.[^.]+$/, ''),
          type: 'image',
          collective: true,
          auteur: l.auteur || null,
          coord: l.lat_dec == null ? null : {
            lat: l.lat, lon: l.lon,
            latDec: l.lat_dec, lonDec: l.lon_dec,
            camera: '—', sol: '—', echelle: '—'
          }
        }));

        if (this.retenues.length) {
          EARTH.Archive.tous = EARTH.Archive.tous.concat(this.retenues);
          EARTH.Archive.appliquerFiltres(EARTH.CONFIG);
          console.log(`[EARTH] archive collective : ${this.retenues.length} capture(s) retenue(s)`);
        }
        return this.retenues.length;
      } catch (e) {
        console.warn('[EARTH] archive collective injoignable', e.message);
        return 0;
      }
    },

    /* --- un mot, en bas, qui s'efface ----------------------- */
    dire(message, persistant) {
      let d = document.getElementById('contrib-mot');
      if (!d) {
        d = document.createElement('div');
        d.id = 'contrib-mot';
        document.body.appendChild(d);
      }
      d.textContent = message;
      d.classList.add('visible');
      clearTimeout(this._mot);
      if (!persistant) this._mot = setTimeout(() => d.classList.remove('visible'), 4200);
    }
  };

  function jeton() {
    return Math.random().toString(36).slice(2, 10);
  }

  EARTH.Contribution = Contribution;

})(window.EARTH = window.EARTH || {});
