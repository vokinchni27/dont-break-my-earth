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
      invitation: 'passe la main'
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

      etape3Index: '03 · situer',
      champLatitude: 'latitude',
      champLongitude: 'longitude',
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
      archiveInjoignable: 'archive collective injoignable'
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
      geste: 'GESTE',
      regard: 'REGARD',
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
      gardeRotation: 'garder dans la rotation'
    },

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
      ['P', 'panneau']
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
      valider: 'valider',
      refuser: 'refuser',
      supprimer: 'supprimer',
      restaurer: 'remettre en attente',
      confirmerSuppression:
        'Supprimer le fichier et passer la ligne en « supprimée » ? Le fichier ne sera pas récupérable.',
      coordonneesInvalides: 'coordonnées invalides',
      captureSupprimee: 'capture supprimée',
      contenuSupprime: 'contenu supprimé',
      enregistrement: 'enregistrement…',

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

  /* appelé par content.js quand le CMS a répondu */
  T.surcharger = function (lignes) {
    (lignes || []).forEach(ligne => {
      if (ligne && typeof ligne.key === 'string' && typeof ligne.value === 'string') {
        if (lire(TEXTES, ligne.key) != null) surcharges[ligne.key] = ligne.value;
      }
    });
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

  EARTH.TEXTES = TEXTES;
  EARTH.T = T;

})(window.EARTH = window.EARTH || {});
