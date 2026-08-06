# Tous les textes du site

Chaque texte porte une **clé stable**. Pour réécrire le site, on ne touche
que `js/textes.js` — aucune chaîne visible n’est écrite ailleurs.

Une ligne de la table `site_content` dont la colonne `key` vaut exactement
une clé ci-dessous **remplace** le texte statique au chargement, sans toucher
au code ni redéployer. C’est le CMS.

> 181 textes. Régénérer avec `node tools/lister-textes.mjs`.

---

## Le seuil

| clé | texte actuel |
|---|---|
| `titre.mot` | DON’T BREAK MY HEART |
| `titre.echo` | DON’T BREAK MY EARTH |
| `titre.invitation` | passe la main |
| `titre.symboles` | · • + × ° ′ ″ N S E W 0 1 4 7 |

## L’appareillage

| clé | texte actuel |
|---|---|
| `hud.marque` | EARTH |
| `hud.sousTitre` | archive vivante |
| `hud.etatJamaisTermine` | jamais terminé |
| `hud.aide1` | glisse pour descendre. |
| `hud.aide2` | maintiens pour creuser. |
| `hud.aide3` | ne bouge plus. |
| `hud.captures` | captures |
| `hud.lieux` | lieux |
| `hud.recues` | reçues |
| `hud.coordonneesCopiees` | coordonnées copiées |
| `hud.reglagesCopies` | réglages copiés |
| `hud.voirConsole` | voir la console |

## Contribuer

| clé | texte actuel |
|---|---|
| `contribution.invite` | ajouter votre morceau de Terre |
| `contribution.inviteSigne` | + |
| `contribution.voileTitre` | DÉPOSE<br>TA TERRE |
| `contribution.voileNote` | elle restera privée jusqu’à validation |
| `contribution.formeTitre` | RAPPORTE<br>UN MORCEAU<br>DE TERRE |
| `contribution.formeIndex` | 01—03 |
| `contribution.fermer` | fermer |
| `contribution.fermerAria` | Fermer |
| `contribution.etape1Index` | 01 · explorer |
| `contribution.etape1Texte` | Choisis un lieu dans Google Earth et réalise une capture d’écran. |
| `contribution.etape1Lien` | ouvrir Google Earth |
| `contribution.etape2Index` | 02 · déposer |
| `contribution.etape2Bouton` | choisir la capture |
| `contribution.apercuAria` | Aperçu de la capture |
| `contribution.etape3Index` | 03 · situer |
| `contribution.etape3Texte` | facultatif |
| `contribution.champLatitude` | latitude, si tu veux |
| `contribution.champLongitude` | longitude, si tu veux |
| `contribution.champLieu` | lieu, si tu veux |
| `contribution.champMot` | un mot, si tu veux |
| `contribution.champSignature` | signer, si tu veux |
| `contribution.placeholderLatitude` | 48.8566 ou 48°51′24″N |
| `contribution.placeholderLongitude` | 2.3522 ou 2°21′08″E |
| `contribution.placeholderLieu` | Paris, France |
| `contribution.regle` | JPG, PNG, WebP ou AVIF · 8 Mo maximum · jamais visible avant validation. |
| `contribution.envoyer` | envoyer ce morceau |
| `contribution.preparation` | préparation… |
| `contribution.envoiEnCours` | envoi |
| `contribution.recue` | reçue — elle attend d’être validée |
| `contribution.formatRefuse` | format non autorisé |
| `contribution.tropLourde` | trop lourde |
| `contribution.pasUneImage` | ce n’est pas une image autorisée |
| `contribution.choisisDabord` | choisis d’abord une capture |
| `contribution.coordonneesIllisibles` | coordonnées illisibles ou hors limites |
| `contribution.envoiImpossible` | envoi impossible — réessaie dans un instant |
| `contribution.archiveInjoignable` | archive collective injoignable |
| `contribution.lieuCollectif` | COLLECTIF |

## Le feuillet « à propos »

| clé | texte actuel |
|---|---|
| `contenu.invite` | à propos |
| `contenu.fermer` | fermer |
| `contenu.aria` | À propos de Don’t Break My Earth |
| `contenu.blocs` | DON’T BREAK MY EARTH — Une archive vivante composée de morceaux de Terre rapportés par celles et ceux qui la regardent. · CE QUE C’EST — Des captures satellite, leurs coordonnées, et un système qui compose sans fin de nouvelles relations entre elles. Rien n’est retouché. Rien n’est fixe. · PARTICIPER — Choisis un lieu, capture-le, dépose-le. Chaque morceau est relu avant de rejoindre l’archive. |

## Le bac à sable

| clé | texte actuel |
|---|---|
| `panneau.titre` | BAC À SABLE |
| `panneau.partitions` | PARTITIONS |
| `panneau.echelle` | ÉCHELLE |
| `panneau.rythme` | RYTHME |
| `panneau.grille` | GRILLE |
| `panneau.seuil` | SEUIL |
| `panneau.geste` | GESTE |
| `panneau.regard` | REGARD |
| `panneau.particules` | signes |
| `panneau.naissance` | fréquence |
| `panneau.opaciteSignes` | présence |
| `panneau.montee` | montée |
| `panneau.plusPetite` | plus petite |
| `panneau.plusGrande` | plus grande |
| `panneau.tenue` | tenue |
| `panneau.cascade` | cascade |
| `panneau.visible` | visible |
| `panneau.souffle` | souffle |
| `panneau.attraction` | attraction |
| `panneau.obeissance` | obéissance |
| `panneau.respiration` | respiration |
| `panneau.dispersion` | dispersion |
| `panneau.gris` | gris |
| `panneau.conflit` | conflit |
| `panneau.texte` | texte |
| `panneau.evenements` | événements |
| `panneau.rejouer` | REJOUER |
| `panneau.pause` | PAUSE |
| `panneau.copier` | COPIER LES RÉGLAGES |
| `panneau.enPause` | EN PAUSE |
| `panneau.plans` | plans |
| `panneau.graine` | graine |
| `panneau.situees` | situées |
| `panneau.gardeRotation` | garder dans la rotation |
| `panneau.textes` | TEXTES |
| `panneau.police` | police |
| `panneau.corps` | corps |
| `panneau.interlettre` | interlettre |
| `panneau.corpsTitre` | titre |
| `panneau.corpsFragment` | fragments |
| `panneau.remiseTextes` | REMETTRE LES TEXTES D’ORIGINE |
| `panneau.copierTextes` | COPIER MES TEXTES |
| `panneau.textesRemis` | textes d’origine remis |
| `panneau.vibration` | frémissement |
| `panneau.curseurGrille` | sous la main |
| `panneau.absences` | lignes absentes |

## apercuAide

| clé | texte actuel |
|---|---|
| `apercuAide` | X — pause · ← → — précédente / suivante · W — webcam |

## Les consignes de geste

| clé | texte actuel |
|---|---|
| `aide` | MOLETTE — descendre dans la grille · CLIC — détacher une image · MAINTENIR — creuser · NE RIEN FAIRE — une image immense · DÉPOSER — contribuer · ESPACE — suivante · ← → — naviguer · R — rejouer · X — pause · 1-9 — partition · ENTRÉE — aligner · RETOUR — effacer · G — grille · H — appareillage · N — gris · C — recadrage · T — texte · A — ajouter · E — événement · W — webcam · P — panneau |

## Les fragments vivants

| clé | texte actuel |
|---|---|
| `fragments` | tu regardes · personne n’a jamais marché ici · cette rivière ne connaît pas ton nom · il pleut quelque part sur cette image · la lumière que tu vois est déjà partie · ce n’est pas une carte · ce lieu existe maintenant · rien ici n’a été retouché · reste encore un peu · plus lentement · quelqu’un a tracé cette ligne droite · la Terre ne pose pas · tu es dedans aussi |

## Les événements rares

| clé | texte actuel |
|---|---|
| `evenements.rienAVoir` | il n’y a rien à voir pour l’instant |

## La webcam

| clé | texte actuel |
|---|---|
| `webcam.refusee` | caméra refusée |
| `webcam.indisponible` | caméra indisponible — il faut https ou localhost |

## Les pannes

| clé | texte actuel |
|---|---|
| `panne.archiveVide` | aucune image trouvée dans images/ |
| `panne.relance` | ouvre un terminal dans le dossier du projet et lance : |
| `panne.commande` | node tools/index-images.mjs |

## L’administration

| clé | texte actuel |
|---|---|
| `admin.titrePage` | EARTH — administration |
| `admin.accesPrive` | archive collective · accès privé |
| `admin.marque` | EARTH |
| `admin.champEmail` | adresse email |
| `admin.champMotDePasse` | mot de passe |
| `admin.entrer` | entrer |
| `admin.connexionEnCours` | connexion… |
| `admin.connexionImpossible` | Connexion impossible. Vérifie tes identifiants. |
| `admin.enteteSurTitre` | DON’T BREAK MY EARTH · administration |
| `admin.enteteTitre` | ARCHIVE<br>COLLECTIVE |
| `admin.quitter` | quitter |
| `admin.ongletsAria` | Sections d’administration |
| `admin.ongletPropositions` | propositions |
| `admin.ongletContenus` | contenus |
| `admin.filtresAria` | Filtrer les propositions |
| `admin.filtreToutes` | toutes |
| `admin.filtreEnAttente` | en attente |
| `admin.filtreValidees` | validées |
| `admin.filtreRefusees` | refusées |
| `admin.filtreSupprimees` | supprimées |
| `admin.actualiser` | actualiser |
| `admin.capture` | Capture proposée |
| `admin.aucuneProposition` | Rien ici pour l’instant. |
| `admin.aucunContenu` | Aucun contenu. |
| `admin.chargement` | chargement… |
| `admin.valider` | valider |
| `admin.refuser` | refuser |
| `admin.supprimer` | supprimer |
| `admin.modifier` | modifier |
| `admin.confirmerSuppression` | Supprimer le fichier et passer la ligne en « supprimée » ? Le fichier ne sera pas récupérable. |
| `admin.confirmerSuppressionContenu` | Supprimer définitivement ce contenu ? |
| `admin.coordonneesInvalides` | coordonnées invalides |
| `admin.captureValidee` | capture validée |
| `admin.captureRefusee` | capture refusée |
| `admin.captureSupprimee` | capture supprimée |
| `admin.contenuAjoute` | contenu ajouté |
| `admin.contenuModifie` | contenu modifié |
| `admin.contenuSupprime` | contenu supprimé |
| `admin.enregistrement` | enregistrement… |
| `admin.champLieu` | lieu |
| `admin.champLatitude` | latitude |
| `admin.champLongitude` | longitude |
| `admin.champCommentaire` | commentaire |
| `admin.sansCoordonnees` | sans coordonnées |
| `admin.signeePar` | signée : |
| `admin.nonSignee` | non signée |
| `admin.nonPublie` | non publié |
| `admin.ordreCourt` | ordre |
| `admin.statut.pending` | en attente |
| `admin.statut.approved` | validée |
| `admin.statut.rejected` | refusée |
| `admin.statut.deleted` | supprimée |
| `admin.cms` | mini-CMS |
| `admin.ajouterContenu` | AJOUTER UN CONTENU |
| `admin.modifierContenu` | MODIFIER LE CONTENU |
| `admin.annuler` | annuler |
| `admin.cleTechnique` | clé technique |
| `admin.type` | type |
| `admin.titreContenu` | titre |
| `admin.ordre` | ordre |
| `admin.texteContenu` | texte |
| `admin.publie` | publié sur le site |
| `admin.enregistrer` | enregistrer |
| `admin.placeholderCle` | section.manifeste |
| `admin.typeIntro` | introduction |
| `admin.typeParagraphe` | paragraphe |
| `admin.typeCitation` | citation |
| `admin.typeSection` | section |
| `admin.typeFragment` | fragment vivant |

