/* ============================================================
   DON’T BREAK MY EARTH — js/textes.js
   ------------------------------------------------------------
   TOUS LES TEXTES DU SITE, ET RIEN QUE LES TEXTES.

   Aucune chaîne visible ne doit être écrite ailleurs. Pour
   réécrire le site, on ne touche que ce fichier.

   Chaque texte a une clé stable, en points :

       EARTH.T('contribution.envoyer')

   Le mini-CMS Supabase peut redéfinir n’importe laquelle de ces
   clés sans toucher au code : une ligne de `site_content` dont la
   `key` vaut exactement la clé ci-dessous remplace la valeur
   statique au chargement. C’est l’abstraction demandée : le texte
   statique est le défaut, la base est la surcharge.

   Voir TEXTES.md pour la liste complète, prête à être réécrite.
   ============================================================ */

(function (EARTH) {
  'use strict';

  const TEXTES = {

    /* --- LE SEUIL ------------------------------------------ */
    titre: {
      mot: 'DON’T BREAK MY HEART',
      echo: 'DON’T BREAK MY EARTH',
      invitation: 'passe la main',
      /* ce qui s’échappe des lettres : des signes de coordonnées */
      symboles: '· • + × ° ′ ″ N S E W 0 1 4 7'
    },

    /* --- L’APPAREILLAGE ------------------------------------ */
    hud: {
      marque: 'EARTH',
      sousTitre: 'archive vivante',
      etatJamaisTermine: 'jamais terminé',
      aide1: 'maintiens pour creuser.',
      aide2: 'ne bouge plus.',
      aide3: 'attends.',
      captures: 'captures',
      lieux: 'lieux',
      recues: 'reçues',
      coordonneesCopiees: 'coordonnées copiées',
      reglagesCopies: 'réglages copiés',
      voirConsole: 'voir la console'
    },

    /* --- CONTRIBUER ---------------------------------------- */
    contribution: {
      invite: 'ajouter votre morceau de Terre',
      inviteSigne: '+',
      voileTitre: 'DÉPOSE<br>TA TERRE',
      voileNote: 'elle restera privée jusqu’à validation',

      formeTitre: 'RAPPORTE<br>UN MORCEAU<br>DE TERRE',
      formeIndex: '01—03',
      fermer: 'fermer',
      fermerAria: 'Fermer',

      etape1Index: '01 · explorer',
      etape1Texte: 'Choisis un lieu dans Google Earth et réalise une capture d’écran.',
      etape1Lien: 'ouvrir Google Earth ↗',

      etape2Index: '02 · déposer',
      etape2Bouton: 'choisir la capture',
      apercuAria: 'Aperçu de la capture',

      etape3Index: '03 · situer, si tu veux',
      etape3Texte: 'Rien n’est obligatoire ici. Une capture seule suffit.',
      champLatitude: 'latitude, si tu veux',
      champLongitude: 'longitude, si tu veux',
      champLieu: 'lieu, si tu veux',
      champMot: 'un mot, si tu veux',
      champSignature: 'signer, si tu veux',
      placeholderLatitude: '48.8566 ou 48°51′24″N',
      placeholderLongitude: '2.3522 ou 2°21′08″E',
      placeholderLieu: 'Paris, France',

      regle: 'JPG, PNG, WebP ou AVIF · 8 Mo maximum · jamais visible avant validation.',
      envoyer: 'envoyer ce morceau',

      preparation: 'préparation…',
      envoiEnCours: 'envoi',           // suivi de « 42% »
      recue: 'reçue — elle attend d’être validée',
      formatRefuse: 'format non autorisé',
      tropLourde: 'trop lourde',       // suivi de « — 12 Mo »
      pasUneImage: 'ce n’est pas une image autorisée',
      choisisDabord: 'choisis d’abord une capture',
      coordonneesIllisibles: 'coordonnées illisibles ou hors limites',
      envoiImpossible: 'envoi impossible — réessaie dans un instant',
      archiveInjoignable: 'archive collective injoignable',
      lieuCollectif: 'COLLECTIF'      // quand personne n’a nommé le lieu
    },

    /* --- L’AIDE AU CENTRE ---------------------------------- */
    /* Elle paraît, elle se lit, elle s’efface. On la rappelle
       avec « ? ». La liste des touches est plus bas : `aide`. */
    raccourcis: {
      titre: 'QUELQUES TOUCHES',
      note: '? pour revoir',
      rappel: '?'
    },

    /* --- LE FEUILLET « À PROPOS » -------------------------- */
    contenu: {
      invite: 'à propos',
      fermer: 'fermer',
      aria: 'À propos de Don’t Break My Earth'
    },

    /* --- LE BAC À SABLE ------------------------------------ */
    panneau: {
      titre: 'BAC À SABLE',
      partitions: 'PARTITIONS',
      echelle: 'ÉCHELLE',
      rythme: 'RYTHME',
      grille: 'GRILLE',
      seuil: 'SEUIL',
      geste: 'GESTE',
      regard: 'REGARD',
      particules: 'signes',
      naissance: 'fréquence',
      opaciteSignes: 'présence',
      montee: 'montée',
      plusPetite: 'plus petite',
      plusGrande: 'plus grande',
      tenue: 'tenue',
      cascade: 'cascade',
      visible: 'visible',
      souffle: 'souffle',
      attraction: 'attraction',
      obeissance: 'obéissance',
      respiration: 'respiration',
      dispersion: 'dispersion',
      gris: 'gris',
      conflit: 'conflit',
      texte: 'texte',
      evenements: 'événements',
      rejouer: 'REJOUER',
      pause: 'PAUSE',
      copier: 'COPIER LES RÉGLAGES',
      enPause: 'EN PAUSE',
      plans: 'plans',
      graine: 'graine',
      situees: 'situées',
      gardeRotation: 'garder dans la rotation',
      textes: 'TEXTES',
      police: 'police',
      corps: 'corps',
      interlettre: 'interlettre',
      corpsTitre: 'titre',
      corpsFragment: 'fragments',
      remiseTextes: 'REMETTRE LES TEXTES D\u2019ORIGINE',
      copierTextes: 'COPIER MES TEXTES',
      textesRemis: 'textes d\u2019origine remis',
      vibration: 'frémissement',
      curseurGrille: 'sous la main',
      absences: 'lignes absentes'
    },

    /* --- CE QUE MONTRE L’AIDE DU CENTRE -------------------- */
    /* Court exprès : on n’apprend pas un clavier, on en retient
       trois touches. La liste complète reste dans le bac à sable. */
    apercuAide: [
      ['X', 'pause'],
      ['← →', 'image précédente / suivante'],
      ['W', 'webcam'],
      ['P', 'bac à sable']
    ],

    /* --- LES CONSIGNES DE GESTE ---------------------------- */
    aide: [
      ['MOLETTE', 'descendre dans la grille'],
      ['CLIC', 'détacher une image'],
      ['MAINTENIR', 'creuser'],
      ['NE RIEN FAIRE', 'une image immense'],
      ['DÉPOSER', 'contribuer'],
      ['ESPACE', 'suivante'],
      ['← →', 'naviguer'],
      ['R', 'rejouer'],
      ['X', 'pause'],
      ['1-9', 'partition'],
      ['ENTRÉE', 'aligner'],
      ['RETOUR', 'effacer'],
      ['G', 'grille'],
      ['H', 'appareillage'],
      ['N', 'gris'],
      ['C', 'recadrage'],
      ['T', 'texte'],
      ['A', 'ajouter'],
      ['E', 'événement'],
      ['W', 'webcam'],
      ['P', 'panneau'],
      ['?', 'cette aide']
    ],

    /* --- LES FRAGMENTS VIVANTS ----------------------------- */
    /* Le CMS peut en ajouter : type « fragment » dans site_content. */
    fragments: [
      'tu regardes',
      'personne n’a jamais marché ici',
      'cette rivière ne connaît pas ton nom',
      'il pleut quelque part sur cette image',
      'la lumière que tu vois est déjà partie',
      'ce n’est pas une carte',
      'ce lieu existe maintenant',
      'rien ici n’a été retouché',
      'reste encore un peu',
      'plus lentement',
      'quelqu’un a tracé cette ligne droite',
      'la Terre ne pose pas',
      'tu es dedans aussi'
    ],

    /* --- LES ÉVÉNEMENTS RARES ------------------------------ */
    evenements: {
      rienAVoir: 'il n’y a rien à voir pour l’instant'
    },

    /* --- LA WEBCAM ----------------------------------------- */
    webcam: {
      refusee: 'caméra refusée',
      indisponible: 'caméra indisponible — il faut https ou localhost'
    },

    /* --- LES PANNES ---------------------------------------- */
    panne: {
      archiveVide: 'aucune image trouvée dans images/',
      relance: 'ouvre un terminal dans le dossier du projet et lance :',
      commande: 'node tools/index-images.mjs'
    },

    /* --- L’ADMINISTRATION ---------------------------------- */
    admin: {
      titrePage: 'EARTH — administration',
      accesPrive: 'archive collective · accès privé',
      marque: 'EARTH',
      champEmail: 'adresse email',
      champMotDePasse: 'mot de passe',
      entrer: 'entrer',
      connexionEnCours: 'connexion…',
      connexionImpossible: 'Connexion impossible. Vérifie tes identifiants.',

      enteteSurTitre: 'DON’T BREAK MY EARTH · administration',
      enteteTitre: 'ARCHIVE<br>COLLECTIVE',
      quitter: 'quitter',
      ongletsAria: 'Sections d’administration',
      ongletPropositions: 'propositions',
      ongletContenus: 'contenus',

      filtresAria: 'Filtrer les propositions',
      filtreToutes: 'toutes',
      filtreEnAttente: 'en attente',
      filtreValidees: 'validées',
      filtreRefusees: 'refusées',
      filtreSupprimees: 'supprimées',
      actualiser: 'actualiser',

      capture: 'Capture proposée',
      aucuneProposition: 'Rien ici pour l’instant.',
      aucunContenu: 'Aucun contenu.',
      chargement: 'chargement…',
      valider: 'valider',
      refuser: 'refuser',
      supprimer: 'supprimer',
      modifier: 'modifier',
      confirmerSuppression:
        'Supprimer le fichier et passer la ligne en « supprimée » ? Le fichier ne sera pas récupérable.',
      confirmerSuppressionContenu: 'Supprimer définitivement ce contenu ?',
      coordonneesInvalides: 'coordonnées invalides',
      captureValidee: 'capture validée',
      captureRefusee: 'capture refusée',
      captureSupprimee: 'capture supprimée',
      contenuAjoute: 'contenu ajouté',
      contenuModifie: 'contenu modifié',
      contenuSupprime: 'contenu supprimé',
      enregistrement: 'enregistrement…',
      champLieu: 'lieu',
      champLatitude: 'latitude',
      champLongitude: 'longitude',
      champCommentaire: 'commentaire',
      sansCoordonnees: 'sans coordonnées',
      signeePar: 'signée :',
      nonSignee: 'non signée',
      nonPublie: 'non publié',
      ordreCourt: 'ordre',

      statut: {
        pending: 'en attente',
        approved: 'validée',
        rejected: 'refusée',
        deleted: 'supprimée'
      },

      cms: 'mini-CMS',
      ajouterContenu: 'AJOUTER UN CONTENU',
      modifierContenu: 'MODIFIER LE CONTENU',
      annuler: 'annuler',
      cleTechnique: 'clé technique',
      type: 'type',
      titreContenu: 'titre',
      ordre: 'ordre',
      texteContenu: 'texte',
      publie: 'publié sur le site',
      enregistrer: 'enregistrer',
      placeholderCle: 'section.manifeste',
      typeIntro: 'introduction',
      typeParagraphe: 'paragraphe',
      typeCitation: 'citation',
      typeSection: 'section',
      typeFragment: 'fragment vivant'
    }
  };

  /* ----------------------------------------------------------
     L’ACCESSEUR
     EARTH.T('contribution.envoyer') → le texte statique, ou la
     valeur du CMS si une ligne de site_content porte cette clé.
     ---------------------------------------------------------- */

  const surcharges = Object.create(null);

  function lire(source, chemin) {
    return chemin.split('.').reduce((o, k) => (o == null ? o : o[k]), source);
  }

  function T(cle, defaut) {
    if (cle in surcharges) return surcharges[cle];
    const valeur = lire(TEXTES, cle);
    if (valeur == null) {
      if (defaut !== undefined) return defaut;
      console.warn('[EARTH] texte manquant : ' + cle);
      return '';
    }
    return valeur;
  }

  /* Réécriture depuis le bac à sable. Gardée dans le navigateur :
     on peut fermer l'onglet sans perdre ses essais. Pour figer un
     texte pour de bon, on le copie dans ce fichier ou dans le CMS. */
  const LOCALES = 'earth_textes';

  /* Le stockage n'existe pas partout : ni sous Node (outils), ni en
     navigation privée stricte. On l'enveloppe pour que son absence
     ne casse jamais rien. */
  const magasin = {
    lire() {
      try {
        if (typeof localStorage === 'undefined') return {};
        return JSON.parse(localStorage.getItem(LOCALES) || '{}');
      } catch (e) { return {}; }
    },
    ecrire(objet) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(LOCALES, JSON.stringify(objet));
        }
      } catch (e) { /* quota plein ou stockage refusé : tant pis */ }
    },
    vider() {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(LOCALES);
      } catch (e) { /* rien à faire */ }
    }
  };

  T.definir = function (cle, valeur) {
    surcharges[cle] = valeur;
    const gardees = magasin.lire();
    gardees[cle] = valeur;
    magasin.ecrire(gardees);
    prevenir();
  };

  T.oublier = function () {
    magasin.vider();
    Object.keys(surcharges).forEach(k => delete surcharges[k]);
    prevenir();
  };

  T.locales = function () { return magasin.lire(); };

  (function reprendre() {
    const gardees = magasin.lire();
    Object.keys(gardees).forEach(k => { surcharges[k] = gardees[k]; });
  })();

  /* appelé par content.js quand le CMS a répondu */
  T.surcharger = function (lignes) {
    (lignes || []).forEach(ligne => {
      if (ligne && typeof ligne.key === 'string' && typeof ligne.value === 'string') {
        if (lire(TEXTES, ligne.key) != null) surcharges[ligne.key] = ligne.value;
      }
    });
    prevenir();
  };

  T.toutes = function () {
    const plat = {};
    (function parcourir(objet, prefixe) {
      Object.keys(objet).forEach(cle => {
        const valeur = objet[cle];
        const chemin = prefixe ? prefixe + '.' + cle : cle;
        if (valeur && typeof valeur === 'object' && !Array.isArray(valeur)) parcourir(valeur, chemin);
        else plat[chemin] = valeur;
      });
    })(TEXTES, '');
    return plat;
  };

  /* ----------------------------------------------------------
     QUI PRÉVENIR QUAND UN TEXTE CHANGE
     Le bac à sable réécrit une clé ; tout ce qui l’affiche doit
     se remettre à jour sans qu’on recharge la page.
     ---------------------------------------------------------- */

  const temoins = [];
  let silence = false;

  T.surChangement = function (fn) { temoins.push(fn); return T; };

  /* Plusieurs écritures d’affilée (une frappe au clavier, le CMS
     qui répond) ne déclenchent qu’un seul rafraîchissement.

     On groupe dans une micro-tâche et non dans une image
     d’animation : requestAnimationFrame ne s’exécute pas du tout
     dans un onglet caché ou ralenti, et les textes resteraient
     alors figés jusqu’au retour du visiteur. Une promesse, elle,
     tient toujours. */
  function prevenir() {
    if (silence) return;
    silence = true;
    const jouer = () => {
      silence = false;
      T.hydrater(document);
      temoins.forEach(fn => {
        try { fn(); } catch (e) { console.error('[EARTH] texte', e); }
      });
    };
    if (typeof Promise === 'function') Promise.resolve().then(jouer);
    else setTimeout(jouer, 0);
  }

  /* ----------------------------------------------------------
     L’HYDRATATION
     Le HTML ne porte que des clés ; c’est ici qu’elles
     deviennent des mots. Un seul passage remet tout à jour.

       <h2 data-t="contribution.formeTitre"></h2>
       <p  data-t-html="hud.marque"></p>       texte avec balises
       <input data-t-place="contribution.placeholderLieu">
       <button data-t-aria="contribution.fermerAria">

     Appelée automatiquement à chaque réécriture.
     ---------------------------------------------------------- */

  T.hydrater = function (racine) {
    const ou = racine || (typeof document !== 'undefined' ? document : null);
    if (!ou || !ou.querySelectorAll) return;
    const pose = (attribut, appliquer) => {
      ou.querySelectorAll('[' + attribut + ']').forEach(el => {
        appliquer(el, T(el.getAttribute(attribut)));
      });
    };
    pose('data-t', (el, v) => { el.textContent = v; });
    pose('data-t-html', (el, v) => { el.innerHTML = v; });
    pose('data-t-place', (el, v) => { el.setAttribute('placeholder', v); });
    pose('data-t-aria', (el, v) => { el.setAttribute('aria-label', v); });
    pose('data-t-titre', (el, v) => { el.setAttribute('title', v); });
  };

  EARTH.TEXTES = TEXTES;
  EARTH.T = T;

})(window.EARTH = window.EARTH || {});
