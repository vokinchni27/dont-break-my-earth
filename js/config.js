/* ============================================================
   EARTH — js/config.js
   ------------------------------------------------------------
   LE TABLEAU DE BORD.
   Tout ce qui se regle se regle ici, et nulle part ailleurs.
   Le panneau (touche P) modifie ces memes valeurs en direct.
   Quand un reglage te plait, copie-le ici pour le figer.
   ============================================================ */

window.EARTH = window.EARTH || {};

EARTH.CONFIG = {

  /* --- L'ARCHIVE ------------------------------------------ */
  archive: {
    manifest: 'images/manifest.json',
    includeVideos: true,
    poidsVideos: 6,      // une video compte pour N images dans le tirage
    places: null,        // null = tous les lieux. Sinon ['CHINE','RUSSIE']
    ordre: 'sac'         // 'sac' = tout passe avant de repasser | 'hasard' | 'suite'
  },

  /* --- LE RECADRAGE --------------------------------------- */
  /* L'interface de Google Earth est coupee a l'affichage, jamais
     sur le disque. Le bandeau de donnees (bas droite) peut etre
     rappele a la demande : voir coordonnees.bandeau. */
  crop: {
    top: 0.145,
    bottom: 0.11,
    left: 0,
    right: 0
  },

  /* --- LES ECHELLES --------------------------------------- */
  echelle: {
    min: 0.05,           // fraction du petit cote de l'ecran
    max: 1.30,
    rotationMax: 0
  },

  /* --- LA SCENE ------------------------------------------- */
  scene: {
    fond: '#ffffff',
    maxPlans: 26,
    marge: 0.05
  },

  /* --- LA GRILLE ------------------------------------------ */
  /* Elle structure l'espace. Les images ne lui obeissent pas
     toujours : c'est le jeu entre systeme et liberte. */
  grille: {
    visible: true,
    colonnes: 12,
    lignes: 8,
    colonnesMobile: 6,
    lignesMobile: 10,
    trait: 'rgba(0,0,0,.09)',
    traitFort: 'rgba(0,0,0,.22)',
    obeissance: 0.5,     // part des compositions qui se calent sur la grille
    reperes: true        // chiffres de colonnes/lignes dans les marges
  },

  /* --- LE RYTHME ------------------------------------------ */
  rythme: {
    tenue: 11000,
    tenueVariation: 4000,
    cascade: 420,
    cascadeVariation: 300,
    cascadeBudget: 0.55,
    passage: 'remplace', // 'remplace' | 'accumule' | 'echange'
    accumuleChance: 0.25,
    demarrageAuto: true,
    /* le geste suspend la machine : tant que le visiteur agit,
       la composition ne se remplace pas toute seule */
    patience: 6000       // ms de silence avant que le temps reprenne
  },

  /* --- LE MOUVEMENT --------------------------------------- */
  mouvement: {
    entree: 'auto',
    sortie: 'auto',
    dureeEntree: 1500,
    dureeSortie: 900,
    courbe: 'cubic-bezier(.22,.61,.36,1)',
    derive: 0.035,
    zoomDepart: 0.94,
    poolEntree: ['coupe', 'fondu', 'derive', 'zoom', 'montee'],
    poolSortie: ['fondu', 'coupe', 'retrait', 'chute']
  },

  /* --- LE GESTE ------------------------------------------- */
  /* Le curseur n'est pas un pointeur, c'est un outil d'observation.
     Ces seuils decident de ce qu'un geste veut dire. */
  geste: {
    seuilBref: 240,      // ms : en dessous = clic bref
    seuilMaintien: 320,  // ms : au dela = on creuse
    seuilLent: 0.05,     // vitesse (vmin/ms) en dessous = respiration
    seuilRapide: 0.55,   // au dela = dispersion
    immobilite: 7000,    // ms sans bouger = recompense de la contemplation
    parallaxe: 0.9,      // amplitude de la respiration (0 = aucune)
    dispersion: 1,       // amplitude de la dispersion
    creuseCadence: 260,  // ms entre deux fragments pendant un maintien
    creuseMax: 14        // fragments maximum par maintien
  },

  /* --- LES COORDONNEES ------------------------------------ */
  /* Les donnees deviennent du design. */
  coordonnees: {
    survol: true,        // bloc typographique au survol
    curseur: true,       // lecture permanente qui suit le curseur
    imprimees: 0.18,     // part des plans qui portent leurs coordonnees
    bandeau: true,       // le vrai bandeau Google Earth, en pixels, sur demande
    lignes: true,        // latitude / longitude tracees comme lignes de compo
    taille: 11
  },

  /* --- LE TEXTE ------------------------------------------- */
  texte: {
    actif: true,
    frequence: 0.28,     // probabilite qu'une composition porte un fragment
    taille: 22,          // px, a l'echelle de vmin
    duree: 9000,
    fragments: [
      'tu regardes',
      'personne n a jamais marche ici',
      'cette riviere ne connait pas ton nom',
      'il pleut quelque part sur cette image',
      'la lumiere que tu vois est deja partie',
      'ce n est pas une carte',
      'ce lieu existe maintenant',
      'rien ici n a ete retouche',
      'reste encore un peu',
      'plus lentement',
      'quelqu un a construit cette ligne droite',
      'la Terre ne pose pas',
      'tu es aussi dedans'
    ]
  },

  /* --- LES EVENEMENTS RARES ------------------------------- */
  evenements: {
    actifs: true,
    rarete: 0.06,        // probabilite de base a chaque declencheur
    palier: 45000,       // ms mini entre deux evenements
    liste: ['inondation', 'effacement', 'nuit', 'alignement', 'apparition', 'eclat']
  },

  /* --- LES COMPOSITIONS ----------------------------------- */
  compositions: {
    actives: [
      'solo', 'plein', 'duo', 'diptyque', 'constellation',
      'pile', 'horizon', 'colonne', 'bord', 'poussiere',
      'grille', 'essaim', 'conflit', 'bande', 'latitude'
    ],
    forcee: null
  },

  /* --- LE REGARD ------------------------------------------ */
  regard: {
    opacite: 1,
    grisaille: 0,
    contraste: 1,
    filet: false,
    melange: 'normal',   // 'normal' | 'multiply' | 'difference' | 'darken'
    melangeChance: 0.2   // part des compositions qui entrent en conflit
  },

  /* --- LA WEBCAM ------------------------------------------ */
  /* Jamais d'image video brute : la camera n'est qu'une source de
     luminance, retranscrite en mosaique de paysages. Desactivee
     par defaut — la place est prete (touche W). */
  webcam: {
    actif: false,
    colonnes: 26,
    lignes: 18,
    seuil: 0.42,         // en dessous = cellule vide (le vide fait le visage)
    cadence: 900,        // ms entre deux rafraichissements
    opacite: 0.9,
    source: 'camera'     // 'camera' | 'test' (mire animee, sans camera)
  },

  /* --- LE BAC A SABLE ------------------------------------- */
  bacASable: {
    panneauOuvert: false,
    graine: null,
    journal: false
  }
};
