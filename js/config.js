/* ============================================================
   EARTH — js/config.js
   ------------------------------------------------------------
   LE TABLEAU DE BORD.
   Tout ce qui se règle se règle ici, et nulle part ailleurs.
   ============================================================ */

window.EARTH = window.EARTH || {};

EARTH.CONFIG = {

  titre: {
    /* les mots vivent dans js/textes.js — ici, seuls les réglages */
    liquide: 1,            // amplitude de la déformation au curseur
    viscosite: 0.9,        // 0 = revient sec, 1 = revient très lentement
    sortie: 2200           // ms de silence avant que le titre s’efface
  },

  archive: {
    manifest: 'images/manifest.json',
    includeVideos: true,
    poidsVideos: 6,
    places: null,
    ordre: 'sac'
  },

  /* --- LE RECADRAGE --------------------------------------- */
  /* L’interface de Google Earth est coupée à l’affichage,
     jamais sur le disque. */
  crop: {
    top: 0.145,
    bottom: 0.11,
    left: 0,
    right: 0
  },

  /* Le cartel : la bande noire des coordonnées, en vrais pixels.
     0.9699 = la première ligne vraiment noire d’une capture
     2493×1231, mesurée et non estimée. */
  cartel: {
    haut: 0.9699,
    gauche: 0.58,
    visible: true
  },

  echelle: {
    min: 0.05,
    max: 1.30,
    rotationMax: 0
  },

  scene: {
    fond: '#ffffff',
    maxPlans: 26,
    marge: 0.05
  },

  /* --- LA GRILLE VIVANTE ---------------------------------- */
  /* Elle n’est plus un décor : elle respire, elle suit la main,
     et chaque capture la déforme localement selon sa position
     sur la Terre. On n’a jamais deux fois la même grille. */
  grille: {
    visible: true,
    colonnes: 12,
    lignes: 8,
    colonnesMobile: 6,
    lignesMobile: 10,
    trait: 0.09,           // opacité du trait ordinaire
    traitFort: 0.24,       // opacité des bords
    obeissance: 0.5,       // part des compositions qui se calent dessus
    souffle: 0,            // respiration lente — 0 = grille immobile
    vibration: 0,          // frémissement — 0 = aucun tremblement
    attraction: 0,         // déformation autour des captures
    curseur: 0,            // déformation sous la main
    absences: 0,           // part des lignes qui manquent, et changent
    reperes: true
  },

  /* --- LA PLONGÉE ----------------------------------------- */
  /* Molette ou deux doigts : on descend dans le quadrillage.
     Les cases s’écartent, de nouvelles naissent au centre.
     L’archive n’a pas de fond. */
  plongee: {
    active: true,
    vitesse: 0.0016,
    inertie: 0.92,
    naissances: 3,         // captures qui apparaissent par palier
    limite: 7              // au-delà, un plan est retiré
  },

  rythme: {
    tenue: 11000,
    tenueVariation: 4000,
    cascade: 420,
    cascadeVariation: 300,
    cascadeBudget: 0.55,
    passage: 'remplace',
    accumuleChance: 0.25,
    demarrageAuto: true,
    patience: 6000
  },

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

  geste: {
    seuilBref: 240,
    seuilMaintien: 320,
    seuilLent: 0.05,
    seuilRapide: 0.55,
    immobilite: 7000,
    parallaxe: 0.9,
    dispersion: 1,
    creuseCadence: 260,
    creuseMax: 14
  },

  /* --- LES COORDONNÉES ------------------------------------ */
  coordonnees: {
    survol: true,
    curseur: true,
    imprimees: 0.18,
    cartel: true,          // la vraie bande noire, agrandie
    lignes: true,
    taille: 11
  },

  texte: {
    actif: true,
    frequence: 0.28,
    taille: 22,
    duree: 9000,
    fragments: (EARTH.TEXTES ? EARTH.TEXTES.fragments.slice() : [])
  },

  evenements: {
    actifs: true,
    rarete: 0.06,
    palier: 45000,
    liste: ['inondation', 'effacement', 'nuit', 'alignement', 'apparition', 'eclat']
  },

  compositions: {
    actives: [
      'solo', 'plein', 'duo', 'diptyque', 'constellation',
      'pile', 'horizon', 'colonne', 'bord', 'poussiere',
      'grille', 'essaim', 'conflit', 'bande', 'latitude'
    ],
    forcee: null
  },

  /* --- LE REGARD ------------------------------------------ */
  /* Noir et blanc absolu : aucune couleur en dehors des images. */
  regard: {
    opacite: 1,
    grisaille: 0,
    contraste: 1,
    filet: false,
    melange: 'normal',
    melangeChance: 0.2
  },

  /* --- LA TYPOGRAPHIE ------------------------------------- */
  /* Réglable en direct depuis le bac à sable (touche P). */
  typo: {
    famille: '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif',
    micro: 8.5,            // px — l'appareillage, les angles, le bandeau
    interlettre: 0.2,      // em
    titre: 13.5            // vw — la taille du grand mot d'accueil
  },

  hud: {
    actif: true,
    marquee: true,
    curseur: true,
    fuseau: 'Europe/Paris'
  },

  webcam: {
    actif: false,
    colonnes: 26,
    lignes: 18,
    seuil: 0.42,
    cadence: 900,
    opacite: 0.9,
    source: 'camera'
  },

  collectif: {
    actif: true,
    /* Ces deux valeurs sont chargées depuis /api/config sur Vercel.
       Elles restent vides en file:// : l'œuvre locale continue alors
       de fonctionner sans sa couche collaborative. */
    url: '',
    cle: '',
    bucket: 'earth',
    tailleMax: 8 * 1024 * 1024,
    googleEarth: 'https://earth.google.com/web/'
  },

  bacASable: {
    panneauOuvert: false,
    graine: null,
    journal: false
  }
};
