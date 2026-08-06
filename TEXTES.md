# Tous les textes du site

Chaque texte porte une **clé stable**. Pour réécrire le site, on ne touche
que `js/textes.js` — aucune chaîne visible n’est écrite ailleurs.

Une ligne de la table `site_content` dont la colonne `key` vaut exactement
une clé ci-dessous **remplace** le texte statique au chargement, sans toucher
au code ni redéployer. C’est le CMS.

> 144 textes. Régénérer avec `node tools/lister-textes.mjs`.

---

## Le seuil

| clé | texte actuel |
|---|---|
| `titre.mot` | DON’T BREAK MY HEART |
| `titre.echo` | DON’T BREAK MY EARTH |
| `titre.invitation` | passe la main |

## L’appareillage

| clé | texte actuel |
|---|---|
| `hud.marque` | EARTH |
| `hud.sousTitre` | archive vivante |
| `hud.etatJamaisTermine` | jamais terminé |
| `hud.aide1` | maintiens pour creuser. |
| `hud.aide2` | ne bouge plus. |
| `hud.aide3` | attends. |
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
| `contribution.etape1Lien` | ouvrir Google Earth ↗ |
| `contribution.etape2Index` | 02 · déposer |
| `contribution.etape2Bouton` | choisir la capture |
| `contribution.apercuAria` | Aperçu de la capture |
| `contribution.etape3Index` | 03 · situer |
| `contribution.champLatitude` | latitude |
| `contribution.champLongitude` | longitude |
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

## Le feuillet « à propos »

| clé | texte actuel |
|---|---|
| `contenu.invite` | à propos |
| `contenu.fermer` | fermer |
| `contenu.aria` | À propos de Don’t Break My Earth |

## Le bac à sable

| clé | texte actuel |
|---|---|
| `panneau.titre` | BAC À SABLE |
| `panneau.partitions` | PARTITIONS |
| `panneau.echelle` | ÉCHELLE |
| `panneau.rythme` | RYTHME |
| `panneau.grille` | GRILLE |
| `panneau.geste` | GESTE |
| `panneau.regard` | REGARD |
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
| `admin.valider` | valider |
| `admin.refuser` | refuser |
| `admin.supprimer` | supprimer |
| `admin.restaurer` | remettre en attente |
| `admin.confirmerSuppression` | Supprimer le fichier et passer la ligne en « supprimée » ? Le fichier ne sera pas récupérable. |
| `admin.coordonneesInvalides` | coordonnées invalides |
| `admin.captureSupprimee` | capture supprimée |
| `admin.contenuSupprime` | contenu supprimé |
| `admin.enregistrement` | enregistrement… |
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

