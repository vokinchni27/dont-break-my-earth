/* DON'T BREAK MY EARTH — administration sécurisée */
(function (EARTH) {
  'use strict';

  const Supa = EARTH.Supa;
  const etat = { propositions: [], contenus: [], filtre: 'all' };
  const $ = selecteur => document.querySelector(selecteur);

  async function demarrer() {
    hydraterTextes();
    await Supa.initialiser();
    Supa.reprendreSession();
    const utilisateur = await Supa.utilisateur();
    if (utilisateur) {
      try { await ouvrir(utilisateur); return; } catch (e) { Supa.deconnecter(); }
    }
    $('#connexion').hidden = false;
    $('#connexion-forme').addEventListener('submit', connecter);
  }

  async function connecter(e) {
    e.preventDefault();
    const bouton = e.currentTarget.querySelector('button');
    const erreur = $('#connexion-erreur');
    bouton.disabled = true;
    erreur.textContent = EARTH.T('admin.connexionEnCours');
    try {
      const utilisateur = await Supa.connecter($('#courriel').value.trim(), $('#mot-de-passe').value);
      await ouvrir(utilisateur);
    } catch (err) {
      erreur.textContent = EARTH.T('admin.connexionImpossible');
      bouton.disabled = false;
    }
  }

  async function ouvrir(utilisateur) {
    $('#connexion').hidden = true;
    $('#atelier').hidden = false;
    $('#identite').textContent = utilisateur.email || EARTH.T('admin.marque');
    $('#sortir').onclick = () => { Supa.deconnecter(); location.reload(); };
    brancherNavigation();
    brancherContenu();
    await Promise.all([chargerPropositions(), chargerContenus()]);
  }

  function brancherNavigation() {
    document.querySelectorAll('.onglet').forEach(bouton => {
      bouton.onclick = () => {
        document.querySelectorAll('.onglet').forEach(b => b.classList.toggle('actif', b === bouton));
        ['propositions', 'contenus'].forEach(nom => {
          $('#vue-' + nom).hidden = bouton.dataset.vue !== nom;
        });
      };
    });
    document.querySelectorAll('.filtre').forEach(bouton => {
      bouton.onclick = () => {
        etat.filtre = bouton.dataset.statut;
        document.querySelectorAll('.filtre').forEach(b => b.classList.toggle('actif', b === bouton));
        afficherPropositions();
      };
    });
    $('#rafraichir').onclick = chargerPropositions;
  }

  async function chargerPropositions() {
    const liste = $('#liste-propositions');
    liste.replaceChildren(texte('chargement…', 'vide'));
    try {
      const data = await Supa.apiAdmin('/api/admin/submissions');
      etat.propositions = data.submissions || [];
      $('#nombre-propositions').textContent = String(etat.propositions.filter(p => p.status === 'pending').length);
      afficherPropositions();
    } catch (e) {
      liste.replaceChildren(texte(e.message, 'vide'));
      throw e;
    }
  }

  function afficherPropositions() {
    const liste = $('#liste-propositions');
    const lignes = etat.propositions.filter(p => etat.filtre === 'all' || p.status === etat.filtre);
    liste.replaceChildren();
    if (!lignes.length) { liste.appendChild(texte(EARTH.T('admin.aucuneProposition'), 'vide')); return; }
    lignes.forEach(ligne => liste.appendChild(carteProposition(ligne)));
  }

  function carteProposition(ligne) {
    const carte = element('article', 'proposition');
    carte.dataset.id = ligne.id;
    const imageBloc = element('div', 'proposition-image');
    const image = document.createElement('img');
    image.src = ligne.image_url || '';
    image.alt = ligne.location_label ? `${EARTH.T('admin.capture')} — ${ligne.location_label}` : EARTH.T('admin.capture');
    image.loading = 'lazy';
    imageBloc.appendChild(image);

    const donnees = element('div', 'proposition-donnees');
    const statut = texte(libelleStatut(ligne.status), `proposition-statut proposition-statut--${ligne.status}`);
    const meta = texte([
      new Date(ligne.created_at).toLocaleString('fr-FR'),
      `${ligne.width || '?'} × ${ligne.height || '?'} px · ${Math.round(Number(ligne.size_bytes || 0) / 1024)} ko`,
      ligne.author_name ? `signée : ${ligne.author_name}` : 'non signée'
    ].join('\n'), 'proposition-meta');
    donnees.append(statut, meta);

    const lieu = champ('lieu', ligne.location_label || '', 'locationLabel');
    const latitude = champ('latitude', ligne.latitude == null ? '' : ligne.latitude, 'latitude');
    const longitude = champ('longitude', ligne.longitude == null ? '' : ligne.longitude, 'longitude');
    const duo = element('div', 'grille-forme');
    duo.append(latitude.label, longitude.label);
    const commentaire = zone('commentaire', ligne.comment || '', 'comment');
    donnees.append(lieu.label, duo, commentaire.label);

    const actions = element('div', 'proposition-actions');
    const valider = bouton(EARTH.T('admin.valider'), 'bouton bouton--plein');
    const refuser = bouton(EARTH.T('admin.refuser'), 'bouton');
    const supprimer = bouton(EARTH.T('admin.supprimer'), 'bouton danger');
    valider.onclick = () => moderer(carte, ligne, 'approve');
    refuser.onclick = () => moderer(carte, ligne, 'reject');
    supprimer.onclick = () => supprimerProposition(carte, ligne);
    actions.append(valider, refuser, supprimer);
    donnees.appendChild(actions);
    carte.append(imageBloc, donnees);
    return carte;
  }

  async function moderer(carte, ligne, action) {
    const latitude = nombreOuNull(carte.querySelector('[data-champ="latitude"]').value, -90, 90);
    const longitude = nombreOuNull(carte.querySelector('[data-champ="longitude"]').value, -180, 180);
    if (latitude === false || longitude === false) return notifier(EARTH.T('admin.coordonneesInvalides'));
    desactiver(carte, true);
    try {
      await Supa.apiAdmin('/api/admin/submissions', {
        method: 'PATCH',
        body: {
          id: ligne.id,
          action,
          latitude,
          longitude,
          locationLabel: carte.querySelector('[data-champ="locationLabel"]').value,
          comment: carte.querySelector('[data-champ="comment"]').value
        }
      });
      notifier(action === 'approve' ? 'capture validée' : 'capture refusée');
      await chargerPropositions();
    } catch (e) {
      notifier(e.message);
      desactiver(carte, false);
    }
  }

  async function supprimerProposition(carte, ligne) {
    if (!confirm(EARTH.T('admin.confirmerSuppression'))) return;
    desactiver(carte, true);
    try {
      await Supa.apiAdmin('/api/admin/submissions', { method: 'DELETE', body: { id: ligne.id } });
      notifier(EARTH.T('admin.captureSupprimee'));
      await chargerPropositions();
    } catch (e) {
      notifier(e.message);
      desactiver(carte, false);
    }
  }

  function brancherContenu() {
    $('#contenu-forme').addEventListener('submit', enregistrerContenu);
    $('#contenu-annuler').onclick = viderFormeContenu;
  }

  async function chargerContenus() {
    const data = await Supa.apiAdmin('/api/admin/content');
    etat.contenus = data.content || [];
    $('#nombre-contenus').textContent = String(etat.contenus.length);
    afficherContenus();
  }

  function afficherContenus() {
    const liste = $('#liste-contenus');
    liste.replaceChildren();
    if (!etat.contenus.length) { liste.appendChild(texte(EARTH.T('admin.aucunContenu'), 'vide')); return; }
    etat.contenus.forEach(item => {
      const ligne = element('article', 'contenu-item');
      const cle = texte(`${item.key}\n${item.type} · ordre ${item.sort_order}`, 'contenu-cle micro');
      const corps = element('div', 'contenu-texte');
      if (item.title) corps.appendChild(texte(item.title, 'contenu-titre', 'h3'));
      corps.appendChild(texte(item.value));
      if (!item.is_published) corps.appendChild(texte('non publié', 'non-publie micro'));
      const actions = element('div', 'contenu-actions');
      const modifier = bouton('modifier', 'bouton');
      const supprimer = bouton('supprimer', 'bouton');
      modifier.onclick = () => remplirFormeContenu(item);
      supprimer.onclick = () => supprimerContenu(item);
      actions.append(modifier, supprimer);
      ligne.append(cle, corps, actions);
      liste.appendChild(ligne);
    });
  }

  async function enregistrerContenu(e) {
    e.preventDefault();
    const id = $('#contenu-id').value;
    const corps = {
      key: $('#contenu-cle').value.trim(),
      type: $('#contenu-type').value,
      title: $('#contenu-titre').value.trim() || null,
      value: $('#contenu-valeur').value.trim(),
      sortOrder: Number($('#contenu-ordre').value || 0),
      isPublished: $('#contenu-publie').checked,
      metadata: {}
    };
    if (id) corps.id = id;
    $('#contenu-message').textContent = EARTH.T('admin.enregistrement');
    try {
      await Supa.apiAdmin('/api/admin/content', { method: id ? 'PATCH' : 'POST', body: corps });
      $('#contenu-message').textContent = '';
      notifier(id ? 'contenu modifié' : 'contenu ajouté');
      viderFormeContenu();
      await chargerContenus();
    } catch (err) {
      $('#contenu-message').textContent = err.message;
    }
  }

  function remplirFormeContenu(item) {
    $('#contenu-id').value = item.id;
    $('#contenu-cle').value = item.key;
    $('#contenu-type').value = item.type;
    $('#contenu-titre').value = item.title || '';
    $('#contenu-valeur').value = item.value;
    $('#contenu-ordre').value = item.sort_order;
    $('#contenu-publie').checked = item.is_published;
    $('#contenu-forme-titre').textContent = EARTH.T('admin.modifierContenu');
    $('#contenu-annuler').hidden = false;
    $('#contenu-forme').scrollIntoView({ behavior: 'smooth' });
  }

  function viderFormeContenu() {
    $('#contenu-forme').reset();
    $('#contenu-id').value = '';
    $('#contenu-ordre').value = '0';
    $('#contenu-publie').checked = true;
    $('#contenu-forme-titre').textContent = EARTH.T('admin.ajouterContenu');
    $('#contenu-annuler').hidden = true;
    $('#contenu-message').textContent = '';
  }

  async function supprimerContenu(item) {
    if (!confirm(`Supprimer définitivement « ${item.key} » ?`)) return;
    try {
      await Supa.apiAdmin('/api/admin/content', { method: 'DELETE', body: { id: item.id } });
      notifier(EARTH.T('admin.contenuSupprime'));
      await chargerContenus();
    } catch (e) { notifier(e.message); }
  }

  function element(tag, classe) { const e = document.createElement(tag); if (classe) e.className = classe; return e; }
  function texte(valeur, classe, tag) { const e = element(tag || 'p', classe); e.textContent = valeur; return e; }
  function bouton(valeur, classe) { const e = texte(valeur, classe, 'button'); e.type = 'button'; return e; }
  function champ(libelle, valeur, nom) {
    const label = element('label'); label.appendChild(document.createTextNode(libelle));
    const input = document.createElement('input'); input.value = valeur; input.dataset.champ = nom; label.appendChild(input);
    return { label, input };
  }
  function zone(libelle, valeur, nom) {
    const label = element('label'); label.appendChild(document.createTextNode(libelle));
    const input = document.createElement('textarea'); input.value = valeur; input.rows = 3; input.maxLength = 1000; input.dataset.champ = nom; label.appendChild(input);
    return { label, input };
  }
  function nombreOuNull(valeur, min, max) {
    if (String(valeur).trim() === '') return null;
    const n = Number(String(valeur).replace(',', '.'));
    return Number.isFinite(n) && n >= min && n <= max ? n : false;
  }
  function desactiver(carte, oui) { carte.querySelectorAll('button,input,textarea').forEach(e => { e.disabled = oui; }); }
  function libelleStatut(statut) { return EARTH.T('admin.statut.' + statut, statut); }
  /* Les libelles vivent dans js/textes.js : le HTML ne porte que
     des cles. Un seul endroit a reecrire pour changer la langue. */
  function hydraterTextes() {
    document.querySelectorAll('[data-t]').forEach(el => {
      el.textContent = EARTH.T(el.dataset.t);
    });
    document.querySelectorAll('[data-t-html]').forEach(el => {
      el.innerHTML = EARTH.T(el.datasetTHtml || el.getAttribute('data-t-html'));
    });
    document.querySelectorAll('[data-t-aria]').forEach(el => {
      el.setAttribute('aria-label', EARTH.T(el.getAttribute('data-t-aria')));
    });
    const cle = document.getElementById('contenu-cle');
    if (cle) cle.placeholder = EARTH.T('admin.placeholderCle');
    const titre = document.getElementById('contenu-forme-titre');
    if (titre && !titre.textContent) titre.textContent = EARTH.T('admin.ajouterContenu');
  }

  function notifier(message) {
    const d = $('#notification'); d.textContent = message; d.classList.add('visible');
    clearTimeout(notifier._t); notifier._t = setTimeout(() => d.classList.remove('visible'), 3600);
  }

  demarrer();
})(window.EARTH);
